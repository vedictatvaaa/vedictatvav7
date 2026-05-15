import type { Express, Request, Response } from "express";
import path from "path";
import fs from "fs";
import multer from "multer";
import rateLimit from "express-rate-limit";
import OpenAI from "openai";
import { z } from "zod";
import { db } from "./db";
import { sacredTexts, insertSacredTextSchema } from "@shared/schema";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";
import { sanitizeRichHtml } from "./html-sanitizer";

const TEXT_TYPES = ["chalisa", "mantra", "katha", "aarti", "stotra", "book"] as const;
type TextType = typeof TEXT_TYPES[number];

const updateSacredTextSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  deity: z.string().min(1).max(80).optional(),
  textType: z.enum(TEXT_TYPES).optional(),
  language: z.string().max(40).optional(),
  lyrics: z.string().max(50_000).optional(),
  transliteration: z.string().max(50_000).optional(),
  translation: z.string().max(50_000).optional(),
  meaning: z.string().max(20_000).optional(),
  excerpt: z.string().max(500).optional(),
  metaTitle: z.string().max(120).optional(),
  metaDescription: z.string().max(300).optional(),
  coverImage: z.string().max(500).optional().nullable(),
  audioUrl: z.string().max(500).optional().nullable(),
  tags: z.array(z.string().max(40)).max(15).optional(),
  durationSeconds: z.number().int().nonnegative().optional().nullable(),
  verseCount: z.number().int().nonnegative().optional(),
  status: z.enum(["pending", "published", "rejected", "draft"]).optional(),
  isPublished: z.boolean().optional(),
}).strict();

const generateSchema = z.object({
  deity: z.string().min(2).max(60).regex(/^[A-Za-z\s.'-]+$/, "Letters only"),
  types: z.array(z.enum(["chalisa", "mantra", "katha", "aarti", "stotra"])).min(1).max(5).optional(),
});

const aiGenerateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1h
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many AI generation requests. Try again later." },
});

const aiGenerateAllLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24h
  max: 2,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "generate-all is limited to 2/day to control AI cost." },
});

let generateAllInFlight = false;

const sacredAudioDir = path.join(process.cwd(), "uploads", "sacred-audio");
if (!fs.existsSync(sacredAudioDir)) fs.mkdirSync(sacredAudioDir, { recursive: true });
const sacredAudioStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, sacredAudioDir),
  filename: (_req, file, cb) => {
    const safe = file.originalname.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 80);
    cb(null, `${Date.now()}-${safe}`);
  },
});
const uploadSacredAudio = multer({
  storage: sacredAudioStorage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50 MB
  fileFilter: (_req, file, cb) => {
    if (/^audio\//.test(file.mimetype) || /\.(mp3|m4a|wav|ogg|aac)$/i.test(file.originalname)) {
      cb(null, true);
    } else cb(new Error("Only audio files are allowed."));
  },
});

function slugify(s: string): string {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

// Curated list of major deities + canonical text types we want covered.
export const DEITY_CATALOG: Array<{ deity: string; types: Array<"chalisa" | "mantra" | "katha" | "aarti" | "stotra"> }> = [
  { deity: "Hanuman", types: ["chalisa", "mantra", "katha", "aarti"] },
  { deity: "Shiva", types: ["chalisa", "mantra", "stotra", "aarti"] },
  { deity: "Ganesha", types: ["chalisa", "mantra", "stotra", "aarti"] },
  { deity: "Durga", types: ["chalisa", "mantra", "stotra", "aarti"] },
  { deity: "Lakshmi", types: ["chalisa", "mantra", "aarti"] },
  { deity: "Saraswati", types: ["chalisa", "mantra", "aarti"] },
  { deity: "Krishna", types: ["chalisa", "mantra", "aarti", "katha"] },
  { deity: "Rama", types: ["chalisa", "mantra", "aarti", "katha"] },
  { deity: "Vishnu", types: ["chalisa", "mantra", "stotra"] },
  { deity: "Kali", types: ["chalisa", "mantra", "stotra"] },
  { deity: "Surya", types: ["chalisa", "mantra", "stotra"] },
  { deity: "Sai Baba", types: ["chalisa", "aarti"] },
  { deity: "Santoshi Maa", types: ["chalisa", "katha"] },
  { deity: "Shani", types: ["chalisa", "mantra"] },
  { deity: "Khatu Shyam", types: ["chalisa", "aarti"] },
];

interface AiTextDraft {
  title: string;
  lyrics: string; // Devanagari lines, \n separated
  transliteration: string;
  translation: string;
  meaning: string;
  excerpt: string;
  metaTitle: string;
  metaDescription: string;
  tags: string[];
  verseCount: number;
}

const SYSTEM_PROMPT = `You are a senior Vedic scholar and devotional poet writing canonical-style Hindu sacred texts.
Output ONLY valid JSON matching the schema. No markdown, no commentary.
Tone: reverent, calm, traditional. No emoji. No modern slang.
For chalisa: 40 chaupais (4-line stanzas) is canonical, but if generating a fresh chalisa, produce 20 well-formed couplets in Devanagari.
For mantra: 1–3 short mantras with the bija and meaning.
For aarti: traditional aarti format with refrain.
For katha: short prose narrative (300–500 words) of a famous story.
For stotra: 8–12 verses in Sanskrit/Devanagari.`;

const USER_PROMPT_TEMPLATE = (deity: string, type: string) => `Generate a ${type} for Lord/Devi ${deity}.
Return JSON with this exact shape (use Devanagari for lyrics; IAST roman for transliteration; clean English for translation/meaning):
{
  "title": "Full traditional title in English (e.g. Shri Hanuman Chalisa)",
  "lyrics": "Devanagari verses, each verse separated by a single newline",
  "transliteration": "Same verses in IAST/Roman, line-by-line matching lyrics",
  "translation": "English meaning, line-by-line matching lyrics",
  "meaning": "2–3 sentence overall significance and phala (benefits of recitation)",
  "excerpt": "One-sentence devotional summary (<= 160 chars)",
  "metaTitle": "SEO title (<= 70 chars)",
  "metaDescription": "SEO description (<= 160 chars)",
  "tags": ["3–6 short tags"],
  "verseCount": 0
}`;

let openai: OpenAI | null = null;
function getOpenAI(): OpenAI {
  if (!openai) {
    if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY not configured");
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

async function generateOneText(deity: string, type: string): Promise<AiTextDraft> {
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    response_format: { type: "json_object" },
    temperature: 0.5,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: USER_PROMPT_TEMPLATE(deity, type) },
    ],
  });
  const raw = completion.choices[0]?.message?.content || "{}";
  const parsed = JSON.parse(raw) as Partial<AiTextDraft>;
  const lyrics = String(parsed.lyrics || "").trim();
  if (!lyrics) throw new Error("AI returned empty lyrics");
  const verseCount = Number(parsed.verseCount) || lyrics.split(/\n+/).filter(Boolean).length;
  return {
    title: String(parsed.title || `${deity} ${type}`).slice(0, 200),
    lyrics,
    transliteration: String(parsed.transliteration || ""),
    translation: String(parsed.translation || ""),
    meaning: String(parsed.meaning || ""),
    excerpt: String(parsed.excerpt || "").slice(0, 200),
    metaTitle: String(parsed.metaTitle || `${deity} ${type} — Vedic Tatva`).slice(0, 80),
    metaDescription: String(parsed.metaDescription || "").slice(0, 200),
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String).slice(0, 8) : [],
    verseCount,
  };
}

export async function generateSacredTextsForDeity(
  deity: string,
  types: Array<"chalisa" | "mantra" | "katha" | "aarti" | "stotra">,
): Promise<{ inserted: number; skipped: number; errors: string[]; ids: number[] }> {
  const result = { inserted: 0, skipped: 0, errors: [] as string[], ids: [] as number[] };
  for (const type of types) {
    try {
      const baseSlug = slugify(`${deity}-${type}`);
      const existing = await db.select({ id: sacredTexts.id }).from(sacredTexts).where(eq(sacredTexts.slug, baseSlug));
      if (existing.length) { result.skipped += 1; continue; }
      const draft = await generateOneText(deity, type);
      const [created] = await db.insert(sacredTexts).values({
        slug: baseSlug,
        title: draft.title,
        deity,
        textType: type,
        language: "hindi",
        lyrics: draft.lyrics,
        transliteration: draft.transliteration,
        translation: draft.translation,
        meaning: draft.meaning,
        excerpt: draft.excerpt,
        metaTitle: draft.metaTitle,
        metaDescription: draft.metaDescription,
        tags: draft.tags,
        verseCount: draft.verseCount,
        aiGenerated: true,
        sourcePrompt: `${deity}/${type}`,
        status: "pending",
        isPublished: false,
      }).returning({ id: sacredTexts.id });
      if (created) { result.inserted += 1; result.ids.push(created.id); }
    } catch (e: any) {
      result.errors.push(`${deity}/${type}: ${e?.message || "unknown"}`);
    }
  }
  return result;
}

function sanitizeTextPayload<T extends Record<string, any>>(body: T): T {
  const out: any = { ...body };
  for (const f of ["meaning", "translation"]) {
    if (typeof out[f] === "string" && /<[a-z][\s\S]*>/i.test(out[f])) {
      out[f] = sanitizeRichHtml(out[f]);
    }
  }
  return out;
}

export function registerSacredLibraryRoutes(app: Express) {
  // ---------- Public ----------
  app.get("/api/sacred-texts", async (req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=300, stale-while-revalidate=86400");
      const deity = req.query.deity ? String(req.query.deity) : null;
      const type = req.query.type ? String(req.query.type) : null;
      const limit = Math.min(120, parseInt(String(req.query.limit || "60")) || 60);
      const conds = [eq(sacredTexts.isPublished, true), eq(sacredTexts.status, "published")];
      if (deity) conds.push(eq(sacredTexts.deity, deity));
      if (type) conds.push(eq(sacredTexts.textType, type));
      const rows = await db.select({
        id: sacredTexts.id,
        slug: sacredTexts.slug,
        title: sacredTexts.title,
        deity: sacredTexts.deity,
        textType: sacredTexts.textType,
        language: sacredTexts.language,
        excerpt: sacredTexts.excerpt,
        coverImage: sacredTexts.coverImage,
        audioUrl: sacredTexts.audioUrl,
        verseCount: sacredTexts.verseCount,
        durationSeconds: sacredTexts.durationSeconds,
        viewCount: sacredTexts.viewCount,
        tags: sacredTexts.tags,
      }).from(sacredTexts).where(and(...conds))
        .orderBy(asc(sacredTexts.deity), asc(sacredTexts.textType))
        .limit(limit);
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.get("/api/sacred-texts/deities", async (_req: Request, res: Response) => {
    try {
      res.setHeader("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
      const rows = await db.select({
        deity: sacredTexts.deity,
        c: sql<number>`count(*)::int`,
      }).from(sacredTexts)
        .where(and(eq(sacredTexts.isPublished, true), eq(sacredTexts.status, "published")))
        .groupBy(sacredTexts.deity)
        .orderBy(asc(sacredTexts.deity));
      res.json(rows.map((r) => ({ deity: r.deity, count: Number(r.c) || 0 })));
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.get("/api/sacred-texts/:slug", async (req: Request, res: Response) => {
    try {
      const [row] = await db.select().from(sacredTexts).where(eq(sacredTexts.slug, String(req.params.slug)));
      if (!row || !row.isPublished || row.status !== "published") {
        return res.status(404).json({ message: "Not found" });
      }
      res.setHeader("Cache-Control", "public, max-age=600, stale-while-revalidate=86400");
      // Skip view counter on hover/touch prefetches — only count real reader loads.
      if (req.query.prefetch !== "1") {
        db.update(sacredTexts).set({ viewCount: sql`${sacredTexts.viewCount} + 1` })
          .where(eq(sacredTexts.id, row.id)).catch(() => {});
      }
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ---------- Admin: list (all statuses) ----------
  app.get("/api/admin/sacred-texts", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const status = req.query.status ? String(req.query.status) : null;
      const rows = status
        ? await db.select().from(sacredTexts).where(eq(sacredTexts.status, status)).orderBy(desc(sacredTexts.createdAt))
        : await db.select().from(sacredTexts).orderBy(desc(sacredTexts.createdAt));
      res.json(rows);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.get("/api/admin/sacred-texts/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const [row] = await db.select().from(sacredTexts).where(eq(sacredTexts.id, id));
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ---------- Admin: create ----------
  app.post("/api/admin/sacred-texts", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const parsed = insertSacredTextSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const data = sanitizeTextPayload(parsed.data as any);
      if (!data.slug) data.slug = slugify(`${data.deity}-${data.textType}-${Date.now()}`);
      const [created] = await db.insert(sacredTexts).values(data).returning();
      res.json(created);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ---------- Admin: update ----------
  app.patch("/api/admin/sacred-texts/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const parsed = updateSacredTextSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const data = sanitizeTextPayload(parsed.data as any);
      const [u] = await db.update(sacredTexts)
        .set({ ...data, updatedAt: new Date() } as any)
        .where(eq(sacredTexts.id, id))
        .returning();
      if (!u) return res.status(404).json({ message: "Not found" });
      res.json(u);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.delete("/api/admin/sacred-texts/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      await db.delete(sacredTexts).where(eq(sacredTexts.id, id));
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ---------- Admin: approve / reject ----------
  app.post("/api/admin/sacred-texts/:id/approve", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const [u] = await db.update(sacredTexts)
        .set({ status: "published", isPublished: true, updatedAt: new Date() })
        .where(eq(sacredTexts.id, id)).returning();
      if (!u) return res.status(404).json({ message: "Not found" });
      res.json(u);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/sacred-texts/:id/reject", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = parseInt(String(req.params.id));
      const [u] = await db.update(sacredTexts)
        .set({ status: "rejected", isPublished: false, updatedAt: new Date() })
        .where(eq(sacredTexts.id, id)).returning();
      if (!u) return res.status(404).json({ message: "Not found" });
      res.json(u);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // ---------- Admin: audio upload ----------
  app.post(
    "/api/admin/sacred-texts/:id/audio",
    adminAuthMiddleware,
    uploadSacredAudio.single("audio"),
    async (req: Request, res: Response) => {
      try {
        const id = parseInt(String(req.params.id));
        if (!req.file) return res.status(400).json({ message: "No audio file uploaded" });
        // Magic-byte sniff: verify the file is actually audio (not a renamed payload).
        const filePath = path.join(sacredAudioDir, req.file.filename);
        const fd = fs.openSync(filePath, "r");
        const buf = Buffer.alloc(12);
        fs.readSync(fd, buf, 0, 12, 0);
        fs.closeSync(fd);
        const isMp3 = buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0; // MPEG frame sync
        const isId3 = buf.slice(0, 3).toString("ascii") === "ID3"; // mp3 with ID3
        const isOgg = buf.slice(0, 4).toString("ascii") === "OggS";
        const isWav = buf.slice(0, 4).toString("ascii") === "RIFF" && buf.slice(8, 12).toString("ascii") === "WAVE";
        const isM4a = buf.slice(4, 8).toString("ascii") === "ftyp";
        const isFlac = buf.slice(0, 4).toString("ascii") === "fLaC";
        if (!(isMp3 || isId3 || isOgg || isWav || isM4a || isFlac)) {
          fs.unlink(filePath, () => {});
          return res.status(400).json({ message: "File is not a valid audio file." });
        }
        const url = `/uploads/sacred-audio/${req.file.filename}`;
        const [u] = await db.update(sacredTexts)
          .set({ audioUrl: url, updatedAt: new Date() })
          .where(eq(sacredTexts.id, id)).returning();
        if (!u) return res.status(404).json({ message: "Not found" });
        res.json({ audioUrl: url, text: u });
      } catch (e: any) {
        res.status(500).json({ message: e?.message || "Failed" });
      }
    },
  );

  // ---------- Admin: AI generate ----------
  app.post("/api/admin/sacred-texts/generate", adminAuthMiddleware, aiGenerateLimiter, async (req: Request, res: Response) => {
    try {
      const parsed = generateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const { deity, types } = parsed.data;
      const useTypes = (types && types.length ? types : ["chalisa", "mantra", "aarti"] as const) as Array<"chalisa" | "mantra" | "katha" | "aarti" | "stotra">;
      const result = await generateSacredTextsForDeity(deity.trim(), useTypes);
      res.json(result);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.post("/api/admin/sacred-texts/generate-all", adminAuthMiddleware, aiGenerateAllLimiter, async (_req: Request, res: Response) => {
    if (generateAllInFlight) {
      return res.status(429).json({ message: "A catalog generation is already running. Please wait." });
    }
    generateAllInFlight = true;
    try {
      const summary = { inserted: 0, skipped: 0, errors: [] as string[] };
      for (const entry of DEITY_CATALOG) {
        const r = await generateSacredTextsForDeity(entry.deity, entry.types);
        summary.inserted += r.inserted;
        summary.skipped += r.skipped;
        summary.errors.push(...r.errors);
      }
      res.json(summary);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    } finally {
      generateAllInFlight = false;
    }
  });

  app.get("/api/admin/sacred-texts/catalog/list", adminAuthMiddleware, async (_req: Request, res: Response) => {
    res.json(DEITY_CATALOG);
  });
}
