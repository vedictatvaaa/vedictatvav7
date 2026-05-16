import type { Express } from "express";
import { db } from "./db";
import { searchQueries } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { storage } from "./storage";
import { adminAuthMiddleware } from "./admin-auth";
import rateLimit from "express-rate-limit";

const suggestLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

const STATIC_SUGGESTIONS: { label: string; url: string; type: string }[] = [
  { label: "Book a Pandit", url: "/pandits", type: "service" },
  { label: "Online Puja", url: "/online-puja-booking", type: "service" },
  { label: "Pind Daan in Gaya", url: "/pind-daan", type: "service" },
  { label: "AI Kundli", url: "/ai-kundli", type: "service" },
  { label: "Astrology Consultation", url: "/astrology", type: "service" },
  { label: "Daily Panchang", url: "/panchang", type: "service" },
  { label: "Matrimony", url: "/matrimony", type: "service" },
  { label: "Puja Essentials", url: "/spiritual-essentials", type: "category" },
  { label: "Idols & Murtis", url: "/category/idols", type: "category" },
  { label: "Puja Samagri", url: "/category/puja-samagri", type: "category" },
  { label: "Havan Samagri", url: "/category/havan-samagri", type: "category" },
  { label: "Rudraksha & Mala", url: "/category/wearables", type: "category" },
  { label: "Brass & Copperware", url: "/category/brass-copperware", type: "category" },
];

// Scrub PII before persisting search queries (emails, phone numbers, long digit strings, Aadhaar/PAN-like tokens)
function scrubPii(s: string): string {
  return s
    .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/gi, "[email]")
    .replace(/\b(?:\+?\d[\s-]?){10,15}\b/g, "[phone]")
    .replace(/\b[A-Z]{5}\d{4}[A-Z]\b/g, "[pan]")
    .replace(/\b\d{12}\b/g, "[aadhaar]")
    .replace(/\b\d{6,}\b/g, "[num]");
}

function normalize(q: string) {
  return scrubPii(q).toLowerCase().trim().replace(/\s+/g, " ").slice(0, 80);
}

async function trackQuery(query: string, resultCount: number) {
  const norm = normalize(query);
  if (!norm) return;
  // Skip queries that look like only-PII (entirely scrubbed)
  if (/^(\[(email|phone|pan|aadhaar|num)\]\s*)+$/.test(norm)) return;
  const safeQuery = scrubPii(query).slice(0, 200);
  try {
    const existing = await db.select().from(searchQueries).where(eq(searchQueries.normalized, norm)).limit(1);
    if (existing.length) {
      await db.update(searchQueries).set({
        hits: sql`${searchQueries.hits} + 1`,
        lastSeenAt: new Date(),
        resultCount,
      }).where(eq(searchQueries.id, existing[0].id));
    } else {
      await db.insert(searchQueries).values({ query: safeQuery, normalized: norm, resultCount }).onConflictDoNothing();
    }
  } catch { /* best-effort */ }
}

export function registerSearchSuggestRoutes(app: Express) {
  // Public autocomplete — used by sitelinks searchbox + on-site search
  app.get("/api/search/suggest", suggestLimiter, async (req, res) => {
    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json({ query: "", suggestions: STATIC_SUGGESTIONS.slice(0, 8), products: [] });
    }
    const lower = q.toLowerCase();
    const allProducts = await storage.getProducts();
    const products = allProducts
      .filter((p) => p.name.toLowerCase().includes(lower) || (p.category || "").toLowerCase().includes(lower))
      .slice(0, 8)
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price: p.price,
        image: p.image,
        url: `/product/${p.slug || p.id}`,
      }));

    const staticHits = STATIC_SUGGESTIONS.filter((s) => s.label.toLowerCase().includes(lower)).slice(0, 5);

    // Track for popular searches (fire and forget)
    trackQuery(q, products.length).catch(() => {});

    res.json({
      query: q,
      suggestions: staticHits,
      products,
    });
  });

  // OpenSearch description for browser-level search integration
  app.get("/opensearch.xml", (req, res) => {
    const siteUrl = (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
    res.type("application/opensearchdescription+xml").send(`<?xml version="1.0" encoding="UTF-8"?>
<OpenSearchDescription xmlns="http://a9.com/-/spec/opensearch/1.1/">
  <ShortName>Vedic Tatva</ShortName>
  <Description>Search Vedic Tatva — Hindu puja products, pandits, astrology</Description>
  <InputEncoding>UTF-8</InputEncoding>
  <Image width="16" height="16" type="image/x-icon">${siteUrl}/favicon.ico</Image>
  <Url type="text/html" template="${siteUrl}/search?q={searchTerms}"/>
  <Url type="application/json" template="${siteUrl}/api/search/suggest?q={searchTerms}"/>
  <moz:SearchForm xmlns:moz="http://www.mozilla.org/2006/browser/search/">${siteUrl}</moz:SearchForm>
</OpenSearchDescription>`);
  });

  // Public "did you mean?" — fuzzy suggestion when search yields zero results.
  // Uses Levenshtein distance against product names, categories, and popular queries.
  app.get("/api/search/did-you-mean", suggestLimiter, async (req, res) => {
    const q = String(req.query.q || "").trim().toLowerCase();
    if (!q || q.length < 3) return res.json({ suggestion: null });

    function lev(a: string, b: string): number {
      const m = a.length, n = b.length;
      if (!m) return n; if (!n) return m;
      const dp: number[] = Array(n + 1).fill(0).map((_, i) => i);
      for (let i = 1; i <= m; i++) {
        let prev = dp[0]; dp[0] = i;
        for (let j = 1; j <= n; j++) {
          const tmp = dp[j];
          dp[j] = a[i - 1] === b[j - 1] ? prev : Math.min(prev, dp[j], dp[j - 1]) + 1;
          prev = tmp;
        }
      }
      return dp[n];
    }

    const candidates = new Set<string>();
    try {
      const products = await storage.getProducts();
      products.forEach((p) => {
        candidates.add(p.name.toLowerCase());
        if (p.category) candidates.add(p.category.toLowerCase());
      });
    } catch {}
    try {
      const popular = await db.select().from(searchQueries)
        .where(sql`${searchQueries.resultCount} > 0`)
        .orderBy(desc(searchQueries.hits))
        .limit(50);
      popular.forEach((r) => candidates.add(r.normalized));
    } catch {}
    STATIC_SUGGESTIONS.forEach((s) => candidates.add(s.label.toLowerCase()));

    let best: { term: string; dist: number } | null = null;
    const maxDist = Math.max(2, Math.floor(q.length / 3));
    candidates.forEach((c) => {
      // Compare against the closest sliding window of the same length to avoid penalizing long product names
      const target = c.length > q.length + 4 ? c.slice(0, q.length + 4) : c;
      const d = lev(q, target);
      if (d > 0 && d <= maxDist && (!best || d < best.dist)) best = { term: c, dist: d };
    });

    res.json({ suggestion: best ? (best as { term: string; dist: number }).term : null });
  });

  // Public popular searches (cached, no PII)
  app.get("/api/search/popular", async (_req, res) => {
    try {
      const rows = await db.select().from(searchQueries)
        .where(sql`${searchQueries.resultCount} > 0`)
        .orderBy(desc(searchQueries.hits))
        .limit(12);
      res.json(rows.map((r) => ({ query: r.query, hits: r.hits })));
    } catch (e: any) {
      res.json([]);
    }
  });

  // Admin: full search analytics
  app.get("/api/admin/search/queries", adminAuthMiddleware, async (req, res) => {
    const limit = Math.min(Number(req.query.limit || 100), 500);
    const rows = await db.select().from(searchQueries).orderBy(desc(searchQueries.hits)).limit(limit);
    const totalQueries = rows.reduce((a, b) => a + b.hits, 0);
    const zeroResult = rows.filter((r) => r.resultCount === 0);
    res.json({
      total: rows.length,
      totalSearches: totalQueries,
      zeroResultCount: zeroResult.length,
      zeroResults: zeroResult.slice(0, 30).map((r) => ({ query: r.query, hits: r.hits, lastSeenAt: r.lastSeenAt })),
      top: rows.slice(0, 50),
    });
  });

  app.delete("/api/admin/search/queries/:id", adminAuthMiddleware, async (req, res) => {
    await db.delete(searchQueries).where(eq(searchQueries.id, Number(req.params.id)));
    res.json({ success: true });
  });
}
