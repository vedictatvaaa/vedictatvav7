// =====================================================================
// AI Coder — Tier 1 implementation.
//
// Admin types a request, OpenAI proposes file edits scoped to client/src/,
// admin reviews diff, clicks Apply (writes to disk in this Replit env)
// or Rollback (restores). The AI itself NEVER touches the filesystem;
// every write is an explicit POST .../apply triggered by an authenticated
// admin click. Disabled-by-default via AI_CODER_ENABLED=1 env flag.
//
// Safety rails:
//   1. AI_CODER_ENABLED=1 must be set (kill switch)
//   2. adminAuthMiddleware on every endpoint
//   3. Path traversal guard: every file path resolved under CLIENT_SRC_ROOT
//   4. File extension allowlist (.ts/.tsx/.css/.js/.jsx/.json/.md/.html)
//   5. Per-file size cap (100KB) and per-session file-count cap (20)
//   6. Rate limit: 10 generations / day / admin actor
//   7. Build is NOT auto-run on apply — admin reviews dev workflow logs
//      in the existing Workflow panel and rolls back from this tab if needed.
// =====================================================================
import type { Express } from "express";
import path from "node:path";
import fs from "node:fs/promises";
import OpenAI from "openai";
import { db } from "./db";
import { aiCoderSessions } from "@shared/schema";
import { eq, desc, and, gte, sql } from "drizzle-orm";

const CLIENT_SRC_ROOT = path.resolve(process.cwd(), "client/src");
const ALLOWED_EXT = new Set([".ts", ".tsx", ".css", ".js", ".jsx", ".json", ".md", ".html"]);
const MAX_FILE_BYTES = 100 * 1024;            // 100 KB per file (read/list cap)
const MAX_GENERATED_FILE_BYTES = 200 * 1024;  // 200 KB per generated file (model may grow a file)
const MAX_FILES_PER_SESSION = 20;             // model can touch at most 20 files
const MAX_GENERATIONS_PER_ACTOR_PER_DAY = 10;
const MODEL = "gpt-4o-mini";

// Per-file in-memory mutex. Prevents two concurrent apply / rollback
// requests on different sessions from interleaving writes against the
// same file. Lives only for the lifetime of this server process —
// across restarts the DB status field (proposed/applied/rolledback)
// is the durable lock and re-entry is blocked by the 409 status check.
const fileLocks = new Map<string, Promise<void>>();
async function withFileLocks<T>(absPaths: string[], fn: () => Promise<T>): Promise<T> {
  const sorted = [...absPaths].sort(); // deterministic order avoids lock-cycle deadlock
  const previous = sorted.map((p) => fileLocks.get(p)).filter(Boolean) as Promise<void>[];
  let release!: () => void;
  const gate = new Promise<void>((r) => { release = r; });
  for (const p of sorted) fileLocks.set(p, gate);
  try {
    await Promise.all(previous);
    return await fn();
  } finally {
    release();
    for (const p of sorted) if (fileLocks.get(p) === gate) fileLocks.delete(p);
  }
}

type GeneratedFile = { path: string; newContent: string };
type OldContent = { path: string; oldContent: string };

function isEnabled(): boolean {
  return process.env.AI_CODER_ENABLED === "1";
}

// Resolve a user-supplied relative path safely under client/src/.
// Returns the absolute path on success, throws on traversal attempts
// or disallowed extensions. Path is expected client-relative, e.g.
// "client/src/pages/admin.tsx" or "pages/admin.tsx".
function safeResolve(rel: string): string {
  if (typeof rel !== "string" || rel.length === 0 || rel.length > 500) {
    throw new Error(`Bad path: ${rel}`);
  }
  let normalised = rel.replace(/^\/+/, "").trim();
  if (normalised.startsWith("client/src/")) {
    normalised = normalised.slice("client/src/".length);
  }
  // Reject explicit traversal segments and NUL bytes BEFORE resolve, so a
  // crafted "../../server/routes.ts" can't even reach path.resolve.
  if (normalised.includes("\0")) throw new Error(`Bad path (NUL): ${rel}`);
  const segments = normalised.split(/[\\/]+/);
  if (segments.some((s) => s === ".." || s === ".")) {
    throw new Error(`Path traversal blocked: ${rel}`);
  }
  const abs = path.resolve(CLIENT_SRC_ROOT, normalised);
  // Belt-and-braces: even if the segment check missed something,
  // the resolved path must still be inside CLIENT_SRC_ROOT.
  if (abs !== CLIENT_SRC_ROOT && !abs.startsWith(CLIENT_SRC_ROOT + path.sep)) {
    throw new Error(`Path traversal blocked: ${rel}`);
  }
  const ext = path.extname(abs).toLowerCase();
  if (!ALLOWED_EXT.has(ext)) {
    throw new Error(`Disallowed extension ${ext} for ${rel}`);
  }
  return abs;
}

// Walk client/src/ recursively and return a flat list of {path, bytes}
// where path is normalised to "client/src/..." for display + selection.
async function listClientSrcFiles(): Promise<Array<{ path: string; bytes: number }>> {
  const out: Array<{ path: string; bytes: number }> = [];
  async function walk(dir: string): Promise<void> {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name.startsWith(".")) continue;
        await walk(full);
      } else if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (!ALLOWED_EXT.has(ext)) continue;
        const stat = await fs.stat(full);
        if (stat.size > MAX_FILE_BYTES) continue;
        const rel = path.relative(process.cwd(), full).replace(/\\/g, "/");
        out.push({ path: rel, bytes: stat.size });
      }
    }
  }
  await walk(CLIENT_SRC_ROOT);
  out.sort((a, b) => a.path.localeCompare(b.path));
  return out;
}

// Build the actor identifier — last 6 chars of the admin session token,
// matching the existing audit-log convention so traces line up.
function actorOf(req: any): string {
  const token = (req.headers["x-admin-token"] as string | undefined) || "";
  return token.slice(-6) || "unknown";
}

// Compose the OpenAI prompt: a strict JSON-output system message + the
// admin's request + the current contents of every selected file. The
// model is told (a) it may only edit files we explicitly include, and
// (b) it must return full file contents (not patches) so we never have
// to interpret a malformed unified diff at apply time.
function buildPrompt(prompt: string, files: Array<{ path: string; content: string }>): {
  system: string; user: string;
} {
  const system = [
    "You are a senior React + TypeScript engineer working on the Vedic Tatva codebase.",
    "Brand colours: cream #FBF7EE, maroon #6D2B35, gold #D4AF37. Premium spiritual aesthetic.",
    "Hard rules:",
    "  • Output JSON exactly matching this schema: { summary: string, files: [{ path: string, newContent: string }] }",
    "  • You MAY ONLY return file paths that the user included in the context below. Do NOT propose edits to files outside that list.",
    "  • Return the COMPLETE new content of each file you edit (not a diff). Preserve existing imports and exports unless the change requires removing them.",
    "  • If a file does not need to change, omit it from `files` entirely.",
    "  • Do not introduce emojis. Use lucide-react icons.",
    "  • Do not import packages that aren't already used elsewhere in the codebase unless absolutely necessary; if you must, name them in `summary`.",
    "  • Maintain existing data-testid attributes; add new ones for new interactive elements following the existing pattern.",
    "  • Keep TypeScript strict-mode safe.",
    "  • `summary` must be 1–3 sentences explaining WHAT you changed and WHY.",
  ].join("\n");

  const user = [
    `## Admin request\n${prompt}`,
    `\n## Files in scope (${files.length})\n`,
    ...files.map((f) => `\n### ${f.path}\n\`\`\`\n${f.content}\n\`\`\`\n`),
  ].join("\n");

  return { system, user };
}

export function registerAiCoderRoutes(app: Express, adminAuthMiddleware: any) {
  // Status — does the kill-switch flag let this feature run?
  app.get("/api/admin/ai-coder/status", adminAuthMiddleware, async (_req, res) => {
    res.json({
      enabled: isEnabled(),
      hasOpenAiKey: Boolean(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY),
      model: MODEL,
      scope: "client/src/",
      limits: {
        maxFileBytes: MAX_FILE_BYTES,
        maxFilesPerSession: MAX_FILES_PER_SESSION,
        maxGenerationsPerDay: MAX_GENERATIONS_PER_ACTOR_PER_DAY,
      },
    });
  });

  // Recursive file list under client/src/, used by the file picker.
  app.get("/api/admin/ai-coder/files", adminAuthMiddleware, async (_req, res) => {
    if (!isEnabled()) return res.status(403).json({ message: "AI Coder disabled" });
    try {
      const files = await listClientSrcFiles();
      res.json({ files });
    } catch (err: any) {
      res.status(500).json({ message: err?.message || "Failed to list files" });
    }
  });

  // Read a single file — used to preview the "before" side of a diff
  // and to assemble the prompt context.
  app.get("/api/admin/ai-coder/file", adminAuthMiddleware, async (req, res) => {
    if (!isEnabled()) return res.status(403).json({ message: "AI Coder disabled" });
    try {
      const rel = String(req.query.path || "");
      const abs = safeResolve(rel);
      const content = await fs.readFile(abs, "utf8");
      res.json({ path: rel, content });
    } catch (err: any) {
      res.status(400).json({ message: err?.message || "Read failed" });
    }
  });

  // List past sessions (most recent first, capped at 50).
  app.get("/api/admin/ai-coder/sessions", adminAuthMiddleware, async (_req, res) => {
    const rows = await db.select().from(aiCoderSessions)
      .orderBy(desc(aiCoderSessions.createdAt))
      .limit(50);
    res.json({ sessions: rows });
  });

  // Single session detail (includes the full diff payload).
  app.get("/api/admin/ai-coder/sessions/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const [row] = await db.select().from(aiCoderSessions).where(eq(aiCoderSessions.id, id));
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json({ session: row });
  });

  // The big one — create a session: load context, call OpenAI, persist
  // the proposed diff. Status starts as "proposed". Apply / Reject /
  // Rollback are separate explicit POSTs.
  app.post("/api/admin/ai-coder/sessions", adminAuthMiddleware, async (req: any, res) => {
    if (!isEnabled()) return res.status(403).json({ message: "AI Coder disabled — set AI_CODER_ENABLED=1" });
    if (!process.env.OPENAI_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
      return res.status(503).json({ message: "OPENAI_API_KEY not configured" });
    }
    const actor = actorOf(req);
    const prompt = String(req.body?.prompt || "").trim();
    const contextPaths: string[] = Array.isArray(req.body?.contextPaths) ? req.body.contextPaths : [];
    if (prompt.length < 10) return res.status(400).json({ message: "Prompt too short (min 10 chars)" });
    if (prompt.length > 4000) return res.status(400).json({ message: "Prompt too long (max 4000 chars)" });
    if (contextPaths.length === 0) return res.status(400).json({ message: "Select at least one file for context" });
    if (contextPaths.length > MAX_FILES_PER_SESSION) {
      return res.status(400).json({ message: `Too many files (max ${MAX_FILES_PER_SESSION})` });
    }

    // Rate limit: count this actor's generations in the trailing 24h.
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recent = await db.select({ c: sql<number>`count(*)` }).from(aiCoderSessions)
      .where(and(eq(aiCoderSessions.adminActor, actor), gte(aiCoderSessions.createdAt, since)));
    const used = Number(recent[0]?.c || 0);
    if (used >= MAX_GENERATIONS_PER_ACTOR_PER_DAY) {
      return res.status(429).json({ message: `Daily limit reached (${MAX_GENERATIONS_PER_ACTOR_PER_DAY}/day). Try again tomorrow.` });
    }

    // Load + validate every selected file. Reject the whole request on
    // the first traversal / extension / size violation so we never even
    // call OpenAI on a malformed payload.
    const loaded: Array<{ path: string; content: string }> = [];
    for (const p of contextPaths) {
      const abs = safeResolve(p);
      const stat = await fs.stat(abs).catch(() => null);
      if (!stat || !stat.isFile()) return res.status(400).json({ message: `Not a file: ${p}` });
      if (stat.size > MAX_FILE_BYTES) return res.status(400).json({ message: `File too large: ${p}` });
      const content = await fs.readFile(abs, "utf8");
      loaded.push({ path: p, content });
    }

    const { system, user } = buildPrompt(prompt, loaded);

    let generated: GeneratedFile[] = [];
    let summary = "";
    let usage: any = null;
    try {
      const openai = new OpenAI();
      const completion = await openai.chat.completions.create({
        model: MODEL,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
      }, { timeout: 90_000 });
      usage = completion.usage || null;
      const raw = completion.choices?.[0]?.message?.content || "{}";
      const parsed = JSON.parse(raw);
      summary = String(parsed.summary || "");
      const files = Array.isArray(parsed.files) ? parsed.files : [];
      // Validate each proposed file — must be a file we sent in context,
      // must respect path-resolve safety, must have string newContent.
      const allowed = new Set(loaded.map((f) => f.path));
      for (const f of files) {
        const p = String(f?.path || "");
        const c = String(f?.newContent ?? "");
        if (!allowed.has(p)) {
          throw new Error(`Model proposed change to file not in scope: ${p}`);
        }
        safeResolve(p); // throws on bad path/extension
        if (Buffer.byteLength(c, "utf8") > MAX_GENERATED_FILE_BYTES) {
          throw new Error(`Generated content too large for ${p} (limit ${MAX_GENERATED_FILE_BYTES} bytes)`);
        }
        generated.push({ path: p, newContent: c });
      }
    } catch (err: any) {
      const [errRow] = await db.insert(aiCoderSessions).values({
        adminActor: actor,
        prompt,
        contextPaths,
        generatedFiles: [],
        oldContents: [],
        summary: null,
        model: MODEL,
        status: "error",
        errorMessage: err?.message?.slice(0, 500) || "Generation failed",
        tokenUsage: usage,
      }).returning();
      return res.status(500).json({ message: errRow.errorMessage, session: errRow });
    }

    const [row] = await db.insert(aiCoderSessions).values({
      adminActor: actor,
      prompt,
      contextPaths,
      generatedFiles: generated,
      oldContents: [],
      summary,
      model: MODEL,
      status: generated.length === 0 ? "rejected" : "proposed",
      tokenUsage: usage,
    }).returning();

    res.json({ session: row });
  });

  // Apply — snapshot the current on-disk content of every generated
  // file, then write the new content. Both halves are stored on the
  // session row so rollback is byte-perfect.
  app.post("/api/admin/ai-coder/sessions/:id/apply", adminAuthMiddleware, async (req, res) => {
    if (!isEnabled()) return res.status(403).json({ message: "AI Coder disabled" });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const [row] = await db.select().from(aiCoderSessions).where(eq(aiCoderSessions.id, id));
    if (!row) return res.status(404).json({ message: "Not found" });
    if (row.status !== "proposed") return res.status(409).json({ message: `Cannot apply (status: ${row.status})` });

    const generated = (row.generatedFiles as GeneratedFile[]) || [];
    if (generated.length === 0) return res.status(400).json({ message: "Nothing to apply" });

    const snapshot: OldContent[] = [];
    const absPaths = generated.map((f) => safeResolve(f.path));
    try {
      await withFileLocks(absPaths, async () => {
        // Snapshot first — read every file's current content. If any
        // read fails we abort before writing anything.
        for (let i = 0; i < generated.length; i++) {
          const oldContent = await fs.readFile(absPaths[i], "utf8");
          snapshot.push({ path: generated[i].path, oldContent });
        }
        // Two-phase write: stage every new content into a sibling .aic-tmp
        // file first. Only after ALL stages succeed do we rename them
        // into place. A tmp-write failure aborts before a single live
        // file is touched. A rename failure mid-batch still triggers
        // best-effort rollback from the in-memory snapshot.
        const tmpPaths = absPaths.map((p) => p + ".aic-tmp");
        try {
          for (let i = 0; i < generated.length; i++) {
            await fs.writeFile(tmpPaths[i], generated[i].newContent, "utf8");
          }
          const renamed: number[] = [];
          try {
            for (let i = 0; i < generated.length; i++) {
              await fs.rename(tmpPaths[i], absPaths[i]);
              renamed.push(i);
            }
          } catch (renameErr) {
            for (const i of renamed) {
              try { await fs.writeFile(absPaths[i], snapshot[i].oldContent, "utf8"); } catch { /* best-effort */ }
            }
            throw renameErr;
          }
        } finally {
          // Clean up any leftover .aic-tmp files (success path will have
          // renamed them away, failure path may have orphans).
          for (const tp of tmpPaths) {
            await fs.unlink(tp).catch(() => { /* ignore */ });
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Apply failed" });
    }

    const [updated] = await db.update(aiCoderSessions)
      .set({ status: "applied", oldContents: snapshot, appliedAt: new Date() })
      .where(eq(aiCoderSessions.id, id))
      .returning();
    res.json({ session: updated });
  });

  // Reject — mark a proposed session as rejected (no disk writes).
  app.post("/api/admin/ai-coder/sessions/:id/reject", adminAuthMiddleware, async (req, res) => {
    if (!isEnabled()) return res.status(403).json({ message: "AI Coder disabled" });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const [row] = await db.select().from(aiCoderSessions).where(eq(aiCoderSessions.id, id));
    if (!row) return res.status(404).json({ message: "Not found" });
    if (row.status !== "proposed") return res.status(409).json({ message: `Cannot reject (status: ${row.status})` });
    const [updated] = await db.update(aiCoderSessions)
      .set({ status: "rejected" })
      .where(eq(aiCoderSessions.id, id))
      .returning();
    res.json({ session: updated });
  });

  // Rollback — restore the snapshot taken at apply time.
  app.post("/api/admin/ai-coder/sessions/:id/rollback", adminAuthMiddleware, async (req, res) => {
    if (!isEnabled()) return res.status(403).json({ message: "AI Coder disabled" });
    const id = Number(req.params.id);
    if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
    const [row] = await db.select().from(aiCoderSessions).where(eq(aiCoderSessions.id, id));
    if (!row) return res.status(404).json({ message: "Not found" });
    if (row.status !== "applied") return res.status(409).json({ message: `Cannot rollback (status: ${row.status})` });

    const snapshot = (row.oldContents as OldContent[]) || [];
    if (snapshot.length === 0) return res.status(400).json({ message: "No snapshot stored" });

    const absPaths = snapshot.map((s) => safeResolve(s.path));
    try {
      await withFileLocks(absPaths, async () => {
        const tmpPaths = absPaths.map((p) => p + ".aic-tmp");
        try {
          for (let i = 0; i < snapshot.length; i++) {
            await fs.writeFile(tmpPaths[i], snapshot[i].oldContent, "utf8");
          }
          for (let i = 0; i < snapshot.length; i++) {
            await fs.rename(tmpPaths[i], absPaths[i]);
          }
        } finally {
          for (const tp of tmpPaths) {
            await fs.unlink(tp).catch(() => { /* ignore */ });
          }
        }
      });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message || "Rollback failed" });
    }

    const [updated] = await db.update(aiCoderSessions)
      .set({ status: "rolledback", rolledbackAt: new Date() })
      .where(eq(aiCoderSessions.id, id))
      .returning();
    res.json({ session: updated });
  });
}
