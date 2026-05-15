import type { Express, Request, Response } from "express";
import { db } from "./db";
import { products, seoPages } from "@shared/schema";
import { eq } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";
import { pingIndexNowAsync, pingSitemap } from "./indexnow";
import { pushUrlsToGoogle, submitSitemapToGoogle, isGoogleIndexingConfigured } from "./google-indexing";
import { runDailyBlogGeneration } from "./blog-ai";
import { regenerateForCurrentAndNextYear } from "./muhurat-engine";

// Builds the canonical list of high-priority URLs the search engines should
// recheck on a daily basis. Mirrors the sitemap but stays within IndexNow's
// rate-friendly bounds by capping product URLs.
async function buildPriorityUrls(siteUrl: string): Promise<string[]> {
  const base = siteUrl.replace(/\/$/, "");
  const staticPaths = [
    "/", "/shop", "/spiritual-essentials", "/pandits", "/puja", "/pind-daan",
    "/astrology", "/ai-kundli", "/ai-baby-names", "/ai-palm-reading",
    "/panchang-calendar", "/matrimony", "/become-pandit", "/become-astrologer",
    "/category/idols", "/category/puja-samagri", "/category/havan-samagri",
    "/category/wearables", "/category/brass-copperware",
  ];

  const urls = new Set<string>(staticPaths.map((p) => `${base}${p}`));

  try {
    const rows = await db.select({ slug: products.slug, id: products.id }).from(products);
    for (const r of rows) {
      const key = r.slug || String(r.id);
      urls.add(`${base}/product/${key}`);
    }
  } catch (e) {
    console.warn("[seo-scheduler] failed to enumerate product slugs", (e as any)?.message);
  }

  try {
    const pages = await db.select({ path: seoPages.pagePath }).from(seoPages).where(eq(seoPages.isActive, true));
    for (const p of pages) {
      if (p.path && p.path.startsWith("/")) urls.add(`${base}${p.path}`);
    }
  } catch {}

  return Array.from(urls);
}

interface ScheduleStatus {
  enabled: boolean;
  intervalHours: number;
  lastRunAt: string | null;
  lastUrlsSubmitted: number;
  lastIndexNowOk: boolean | null;
  lastSitemapResult: { google?: boolean; bing?: boolean; googleNote?: string } | null;
  lastGoogleIndexing: { configured: boolean; submitted: number; succeeded: number; failed: number } | null;
  lastGoogleSitemap: { ok: boolean; status?: number; message?: string } | null;
  lastError: string | null;
  nextRunAt: string | null;
  totalRuns: number;
}

const status: ScheduleStatus = {
  enabled: false,
  intervalHours: 24,
  lastRunAt: null,
  lastUrlsSubmitted: 0,
  lastIndexNowOk: null,
  lastSitemapResult: null,
  lastGoogleIndexing: null,
  lastGoogleSitemap: null,
  lastError: null,
  nextRunAt: null,
  totalRuns: 0,
};

let timer: NodeJS.Timeout | null = null;

async function runOnce(siteUrl: string) {
  status.lastRunAt = new Date().toISOString();
  status.totalRuns += 1;
  status.lastError = null;
  try {
    const urls = await buildPriorityUrls(siteUrl);
    status.lastUrlsSubmitted = urls.length;
    pingIndexNowAsync(urls);
    status.lastIndexNowOk = true;
    const sitemapUrl = `${siteUrl.replace(/\/$/, "")}/sitemap.xml`;
    status.lastSitemapResult = await pingSitemap(sitemapUrl);

    // Google: only call when service account is configured. The Indexing API
    // has a 200/day quota, so submit the highest-value 200 URLs (front-of-list
    // contains the static landing pages + freshest products).
    if (isGoogleIndexingConfigured()) {
      try {
        const gscSiteUrl = process.env.GSC_SITE_URL || `${siteUrl.replace(/\/$/, "")}/`;
        const [g, gs] = await Promise.all([
          pushUrlsToGoogle(urls.slice(0, 200)),
          submitSitemapToGoogle(gscSiteUrl, sitemapUrl),
        ]);
        status.lastGoogleIndexing = {
          configured: g.configured,
          submitted: g.submitted,
          succeeded: g.succeeded,
          failed: g.failed,
        };
        status.lastGoogleSitemap = { ok: gs.ok, status: gs.status, message: gs.message };
      } catch (e: any) {
        console.warn("[seo-scheduler] google push failed:", e?.message);
      }
    } else {
      status.lastGoogleIndexing = { configured: false, submitted: 0, succeeded: 0, failed: 0 };
      status.lastGoogleSitemap = { ok: false, message: "GOOGLE_SERVICE_ACCOUNT_JSON not set" };
    }
  } catch (e: any) {
    status.lastError = e?.message || "Unknown error";
    status.lastIndexNowOk = false;
  } finally {
    status.nextRunAt = new Date(Date.now() + status.intervalHours * 60 * 60 * 1000).toISOString();
  }
}

// Daily blog auto-generation (drafts go to admin queue, not auto-published).
let blogTimer: NodeJS.Timeout | null = null;
export const blogGenStatus = {
  enabled: false,
  lastRunAt: null as string | null,
  lastInserted: 0,
  lastErrors: [] as string[],
  totalRuns: 0,
};
async function runBlogGenOnce() {
  blogGenStatus.lastRunAt = new Date().toISOString();
  blogGenStatus.totalRuns += 1;
  try {
    const r = await runDailyBlogGeneration(3);
    blogGenStatus.lastInserted = r.inserted;
    blogGenStatus.lastErrors = r.errors;
  } catch (e: any) {
    blogGenStatus.lastErrors = [e?.message || "unknown"];
  }
}

// Yearly muhurat refresh (current + next year). Idempotent — safe to re-run.
let muhuratTimer: NodeJS.Timeout | null = null;
export const muhuratStatus = {
  enabled: false,
  lastRunAt: null as string | null,
  lastResult: null as Record<string, unknown> | null,
};
async function runMuhuratOnce() {
  muhuratStatus.lastRunAt = new Date().toISOString();
  try {
    muhuratStatus.lastResult = await regenerateForCurrentAndNextYear() as any;
  } catch (e: any) {
    muhuratStatus.lastResult = { error: e?.message || "unknown" };
  }
}

export function startSeoScheduler() {
  if (timer) return;
  status.enabled = true;
  const siteUrl = process.env.PUBLIC_SITE_URL || "";

  // Daily blog generation runs locally (no PUBLIC_SITE_URL needed) and is .unref()'d
  // so it never blocks shutdown. First run delayed 10 minutes.
  blogGenStatus.enabled = !!(process.env.OPENAI_API_KEY || process.env.AI_INTEGRATIONS_OPENAI_API_KEY);
  if (blogGenStatus.enabled) {
    setTimeout(() => runBlogGenOnce(), 10 * 60 * 1000).unref();
    blogTimer = setInterval(() => runBlogGenOnce(), 24 * 60 * 60 * 1000);
    blogTimer.unref();
  }

  // Muhurat regen — once at boot (5 min delay), then every 7 days.
  muhuratStatus.enabled = true;
  setTimeout(() => runMuhuratOnce(), 5 * 60 * 1000).unref();
  muhuratTimer = setInterval(() => runMuhuratOnce(), 7 * 24 * 60 * 60 * 1000);
  muhuratTimer.unref();

  // SEO ping scheduler (existing) — only when we know the public URL.
  if (!siteUrl) {
    status.enabled = false;
    status.lastError = "PUBLIC_SITE_URL not set; ping scheduler idle";
    return;
  }
  setTimeout(() => runOnce(siteUrl), 5 * 60 * 1000);
  timer = setInterval(() => runOnce(siteUrl), status.intervalHours * 60 * 60 * 1000);
  status.nextRunAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
}

export function registerSeoSchedulerRoutes(app: Express) {
  app.get("/api/admin/seo/scheduler/status", adminAuthMiddleware, (_req: Request, res: Response) => {
    res.json({ ping: status, blogGen: blogGenStatus, muhurat: muhuratStatus });
  });

  app.post("/api/admin/blog-gen/run-now", adminAuthMiddleware, async (_req: Request, res: Response) => {
    await runBlogGenOnce();
    res.json({ success: true, status: blogGenStatus });
  });

  app.post("/api/admin/muhurat/run-now", adminAuthMiddleware, async (_req: Request, res: Response) => {
    await runMuhuratOnce();
    res.json({ success: true, status: muhuratStatus });
  });

  app.post("/api/admin/seo/scheduler/run", adminAuthMiddleware, async (req: Request, res: Response) => {
    const siteUrl = process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;
    await runOnce(siteUrl);
    res.json({ success: true, status });
  });

  app.get("/api/admin/seo/sitelinks/preview", adminAuthMiddleware, async (req: Request, res: Response) => {
    const siteUrl = process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;
    const urls = await buildPriorityUrls(siteUrl);
    res.json({
      siteUrl,
      totalUrls: urls.length,
      sample: urls.slice(0, 25),
      schemas: ["Organization", "WebSite + SearchAction", "SiteNavigationElement", "BreadcrumbList"],
    });
  });
}
