import type { Express, Request, Response } from "express";
import { db } from "./db";
import { seoPages, seoKeywordTargets, products } from "@shared/schema";
import { eq, asc, desc, sql, and, isNull, or } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";
import { generateSeoForPage } from "./seo-ai";
import { auditPage } from "./seo-auditor";
import { storage } from "./storage";
import { pingIndexNowAsync } from "./indexnow";

// 24/7 Active SEO Engine
// ---------------------------------------------------------------
// Continuous on-page healer. Every 6 hours it:
//   1. Detects duplicate metaTitle / metaDescription across the site
//      (a known Google quality signal that suppresses rankings).
//   2. Picks the highest-priority puja-targeted pages that are
//      missing meta or scoring low on the auditor and rewrites them
//      with the AI generator (gated by OPENAI_API_KEY).
//   3. Submits ONLY changed URLs to IndexNow (spam-safe).
//
// Every action is rate-limited per cycle so we never look spammy
// to search engines or burn through OpenAI budget.

const MAX_AI_PER_CYCLE = 5;
const MAX_INDEXNOW_PER_CYCLE = 25;
const INTERVAL_HOURS = 6;

interface EngineStatus {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  nextRunAt: string | null;
  totalCycles: number;
  lastCycle: {
    duplicatesFound: number;
    pagesOptimized: number;
    urlsPinged: number;
    aiAvailable: boolean;
    actions: Array<{ path: string; action: string; detail?: string }>;
    durationMs: number;
  } | null;
  lastError: string | null;
}

const status: EngineStatus = {
  enabled: false,
  intervalHours: INTERVAL_HOURS,
  lastRunAt: null,
  nextRunAt: null,
  totalCycles: 0,
  lastCycle: null,
  lastError: null,
};

let timer: NodeJS.Timeout | null = null;

export interface DuplicateGroup {
  field: "metaTitle" | "metaDescription";
  value: string;
  paths: string[];
}

export async function detectDuplicateMeta(): Promise<DuplicateGroup[]> {
  const rows = await db.select().from(seoPages);
  const titleMap = new Map<string, string[]>();
  const descMap = new Map<string, string[]>();
  for (const r of rows) {
    if (r.metaTitle) {
      const k = r.metaTitle.trim().toLowerCase();
      titleMap.set(k, [...(titleMap.get(k) || []), r.pagePath]);
    }
    if (r.metaDescription) {
      const k = r.metaDescription.trim().toLowerCase();
      descMap.set(k, [...(descMap.get(k) || []), r.pagePath]);
    }
  }
  const groups: DuplicateGroup[] = [];
  for (const [value, paths] of Array.from(titleMap.entries())) {
    if (paths.length > 1) groups.push({ field: "metaTitle", value, paths });
  }
  for (const [value, paths] of Array.from(descMap.entries())) {
    if (paths.length > 1) groups.push({ field: "metaDescription", value, paths });
  }
  return groups;
}

interface OptimizeCandidate {
  path: string;
  reason: "missing-meta" | "duplicate" | "low-score";
  priority: number;
  cluster: string;
  keyword?: string;
  currentScore?: number;
}

async function buildCandidates(): Promise<OptimizeCandidate[]> {
  const candidates = new Map<string, OptimizeCandidate>();

  // Puja keyword targets — highest signal
  const targets = await db.select().from(seoKeywordTargets)
    .where(eq(seoKeywordTargets.status, "active"))
    .orderBy(desc(seoKeywordTargets.priority));

  for (const t of targets) {
    const existing = await storage.getSeoPageByPath(t.targetPath);
    if (!existing || !existing.metaTitle || !existing.metaDescription) {
      candidates.set(t.targetPath, {
        path: t.targetPath,
        reason: "missing-meta",
        priority: t.priority,
        cluster: t.cluster,
        keyword: t.keyword,
      });
      continue;
    }
    // Score audit
    const result = auditPage(t.targetPath, existing, { hasContent: true, hasImage: !!existing.ogImage });
    if (result.score < 80 && !candidates.has(t.targetPath)) {
      candidates.set(t.targetPath, {
        path: t.targetPath,
        reason: "low-score",
        priority: t.priority,
        cluster: t.cluster,
        keyword: t.keyword,
        currentScore: result.score,
      });
    }
  }

  // Duplicates outrank low-score puja pages — fix structural issues first
  const dups = await detectDuplicateMeta();
  for (const g of dups) {
    for (const p of g.paths) {
      if (!candidates.has(p)) {
        candidates.set(p, { path: p, reason: "duplicate", priority: 7, cluster: "duplicate" });
      } else {
        candidates.get(p)!.reason = "duplicate";
        candidates.get(p)!.priority = Math.max(candidates.get(p)!.priority, 8);
      }
    }
  }

  return Array.from(candidates.values()).sort((a, b) => b.priority - a.priority);
}

async function optimizePath(c: OptimizeCandidate): Promise<{ ok: boolean; detail: string }> {
  // Look up product context if it's a product path
  let product: any | undefined;
  if (c.path.startsWith("/product/")) {
    const slug = c.path.replace("/product/", "");
    const all = await storage.getProducts();
    product = all.find((p) => p.slug === slug || String(p.id) === slug);
  }

  const ai = await generateSeoForPage(c.path, {
    product,
    extra: c.keyword ? `Primary focus keyword to win SERP for: "${c.keyword}". Cluster: ${c.cluster}.` : undefined,
  });
  if (!ai) return { ok: false, detail: "ai-unavailable" };

  const data: any = {
    pagePath: c.path,
    metaTitle: ai.metaTitle,
    metaDescription: ai.metaDescription,
    metaKeywords: ai.metaKeywords,
    ogTitle: ai.ogTitle,
    ogDescription: ai.ogDescription,
    twitterTitle: ai.twitterTitle,
    twitterDescription: ai.twitterDescription,
  };
  if (product?.image) data.ogImage = product.image;

  const existing = await storage.getSeoPageByPath(c.path);

  // Spam-safe: only count as "changed" if title or description actually differs
  const isChanged = !existing
    || existing.metaTitle !== data.metaTitle
    || existing.metaDescription !== data.metaDescription;

  if (existing) await storage.updateSeoPage(existing.id, data);
  else await storage.createSeoPage(data);

  // Update keyword target audit timestamp
  if (c.keyword) {
    try {
      await db.update(seoKeywordTargets)
        .set({ lastOptimizedAt: new Date(), lastError: null })
        .where(eq(seoKeywordTargets.keyword, c.keyword));
    } catch {}
  }

  return { ok: isChanged, detail: isChanged ? c.reason : "no-content-change" };
}

export async function runEngineCycle(siteUrl: string | null): Promise<EngineStatus["lastCycle"]> {
  const start = Date.now();
  const cycle: NonNullable<EngineStatus["lastCycle"]> = {
    duplicatesFound: 0,
    pagesOptimized: 0,
    urlsPinged: 0,
    aiAvailable: !!process.env.OPENAI_API_KEY,
    actions: [],
    durationMs: 0,
  };

  status.lastRunAt = new Date().toISOString();
  status.totalCycles += 1;
  status.lastError = null;

  try {
    const dups = await detectDuplicateMeta();
    cycle.duplicatesFound = dups.length;

    const candidates = await buildCandidates();
    const changedPaths: string[] = [];

    for (const c of candidates.slice(0, MAX_AI_PER_CYCLE)) {
      if (!cycle.aiAvailable) {
        cycle.actions.push({ path: c.path, action: "skipped", detail: "no-openai-key" });
        continue;
      }
      try {
        const r = await optimizePath(c);
        if (r.ok) {
          cycle.pagesOptimized += 1;
          changedPaths.push(c.path);
          cycle.actions.push({ path: c.path, action: "optimized", detail: `${c.reason}${c.keyword ? ` · kw: ${c.keyword}` : ""}` });
        } else if (r.detail === "no-content-change") {
          cycle.actions.push({ path: c.path, action: "skipped", detail: "no-change-not-pinged" });
        } else {
          cycle.actions.push({ path: c.path, action: "failed", detail: r.detail });
        }
      } catch (e: any) {
        cycle.actions.push({ path: c.path, action: "error", detail: e?.message?.slice(0, 100) });
      }
    }

    // Spam-safe: only ping URLs that actually changed this cycle
    if (siteUrl && changedPaths.length > 0) {
      const base = siteUrl.replace(/\/$/, "");
      const urls = Array.from(new Set(changedPaths)).slice(0, MAX_INDEXNOW_PER_CYCLE).map((p) => `${base}${p}`);
      pingIndexNowAsync(urls);
      cycle.urlsPinged = urls.length;
    }
  } catch (e: any) {
    status.lastError = e?.message || "Cycle failed";
  } finally {
    cycle.durationMs = Date.now() - start;
    status.lastCycle = cycle;
    status.nextRunAt = new Date(Date.now() + status.intervalHours * 60 * 60 * 1000).toISOString();
  }

  return cycle;
}

export function startSeoEngine() {
  if (timer) return;
  status.enabled = true;
  const siteUrl = process.env.PUBLIC_SITE_URL || null;
  // First cycle ~10 min after boot, then every 6h
  setTimeout(() => runEngineCycle(siteUrl).catch(() => {}), 10 * 60 * 1000);
  timer = setInterval(() => runEngineCycle(siteUrl).catch(() => {}), status.intervalHours * 60 * 60 * 1000);
  status.nextRunAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
}

export function registerSeoEngineRoutes(app: Express) {
  app.get("/api/admin/seo/engine/status", adminAuthMiddleware, (_req: Request, res: Response) => {
    res.json(status);
  });

  app.post("/api/admin/seo/engine/run", adminAuthMiddleware, async (req: Request, res: Response) => {
    const siteUrl = process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;
    const cycle = await runEngineCycle(siteUrl);
    res.json({ success: true, status, cycle });
  });

  app.get("/api/admin/seo/engine/duplicates", adminAuthMiddleware, async (_req: Request, res: Response) => {
    const groups = await detectDuplicateMeta();
    res.json({ count: groups.length, groups });
  });

  app.get("/api/admin/seo/engine/candidates", adminAuthMiddleware, async (_req: Request, res: Response) => {
    const candidates = await buildCandidates();
    res.json({ count: candidates.length, items: candidates.slice(0, 50) });
  });
}
