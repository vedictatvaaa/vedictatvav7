import { storage } from "./storage";
import type { SeoPage } from "@shared/schema";

export type SeoCheckSeverity = "ok" | "warn" | "fail";

export interface SeoCheck {
  id: string;
  label: string;
  severity: SeoCheckSeverity;
  detail?: string;
  weight: number;
}

export interface PageAuditResult {
  path: string;
  category: "home" | "product" | "category" | "service" | "static" | "other";
  score: number;
  grade: "A+" | "A" | "B" | "C" | "D" | "F";
  checks: SeoCheck[];
  recommendations: string[];
  hasSeoRecord: boolean;
  indexable: boolean;
}

export interface SiteAuditResult {
  generatedAt: string;
  overallScore: number;
  overallGrade: PageAuditResult["grade"];
  totals: {
    pages: number;
    indexable: number;
    withMeta: number;
    missingTitle: number;
    missingDescription: number;
    missingOgImage: number;
    missingKeywords: number;
    missingSchema: number;
  };
  byCategory: Record<string, { count: number; avgScore: number }>;
  topIssues: { issue: string; count: number }[];
  pages: PageAuditResult[];
}

const TITLE_MIN = 30;
const TITLE_MAX = 65;
const DESC_MIN = 110;
const DESC_MAX = 165;

function gradeFor(score: number): PageAuditResult["grade"] {
  if (score >= 95) return "A+";
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  if (score >= 40) return "D";
  return "F";
}

function check(
  id: string,
  label: string,
  weight: number,
  passed: boolean,
  partial: boolean,
  detail?: string,
): SeoCheck {
  const severity: SeoCheckSeverity = passed ? "ok" : partial ? "warn" : "fail";
  return { id, label, severity, detail, weight };
}

function categorize(path: string): PageAuditResult["category"] {
  if (path === "/") return "home";
  if (path.startsWith("/product/")) return "product";
  if (path.startsWith("/category/") || path === "/shop" || path === "/spiritual-essentials") return "category";
  if (
    path.startsWith("/pandit") ||
    path.startsWith("/astrologer") ||
    path.startsWith("/puja") ||
    path.startsWith("/astrology") ||
    path.startsWith("/ai-") ||
    path.startsWith("/pind-daan") ||
    path.startsWith("/temple-tourism")
  )
    return "service";
  if (
    path === "/about" ||
    path === "/contact" ||
    path === "/careers" ||
    path === "/franchise" ||
    path.endsWith("policy") ||
    path === "/terms-conditions"
  )
    return "static";
  return "other";
}

export function auditPage(
  path: string,
  seo: SeoPage | undefined,
  context?: { hasContent?: boolean; hasImage?: boolean },
): PageAuditResult {
  const checks: SeoCheck[] = [];
  const recs: string[] = [];

  const title = seo?.metaTitle?.trim() || "";
  const desc = seo?.metaDescription?.trim() || "";
  const keywords = seo?.metaKeywords?.trim() || "";
  const ogImage = seo?.ogImage?.trim() || "";
  const canonical = seo?.canonicalUrl?.trim() || "";
  const schema = seo?.schemaMarkup?.trim() || "";
  const hasOgTitle = !!(seo?.ogTitle || title);
  const hasOgDesc = !!(seo?.ogDescription || desc);
  const hasTwitter = !!(seo?.twitterTitle || seo?.twitterDescription || seo?.twitterImage);

  // Title (20)
  if (!title) {
    checks.push(check("title", "Meta title present", 20, false, false, "Missing"));
    recs.push("Add a unique, keyword-rich meta title (30–65 chars).");
  } else if (title.length < TITLE_MIN) {
    checks.push(check("title", "Meta title length", 20, false, true, `${title.length} chars (too short)`));
    recs.push(`Lengthen title to ${TITLE_MIN}–${TITLE_MAX} characters.`);
  } else if (title.length > TITLE_MAX) {
    checks.push(check("title", "Meta title length", 20, false, true, `${title.length} chars (too long)`));
    recs.push(`Shorten title to under ${TITLE_MAX} characters.`);
  } else {
    checks.push(check("title", "Meta title length", 20, true, false, `${title.length} chars`));
  }

  // Description (20)
  if (!desc) {
    checks.push(check("desc", "Meta description present", 20, false, false, "Missing"));
    recs.push("Add a compelling meta description (110–165 chars) with primary keyword.");
  } else if (desc.length < DESC_MIN) {
    checks.push(check("desc", "Meta description length", 20, false, true, `${desc.length} chars`));
    recs.push(`Expand description to ${DESC_MIN}–${DESC_MAX} characters.`);
  } else if (desc.length > DESC_MAX) {
    checks.push(check("desc", "Meta description length", 20, false, true, `${desc.length} chars`));
    recs.push(`Trim description to under ${DESC_MAX} characters.`);
  } else {
    checks.push(check("desc", "Meta description length", 20, true, false, `${desc.length} chars`));
  }

  // Keywords (5)
  if (keywords && keywords.split(",").length >= 3) {
    checks.push(check("keywords", "Keywords list", 5, true, false));
  } else {
    checks.push(check("keywords", "Keywords list", 5, false, true, "Add 3+ targeted keywords"));
    recs.push("Add at least 3 targeted keywords (comma-separated).");
  }

  // OG image (10)
  if (ogImage) {
    checks.push(check("og-image", "Open Graph image", 10, true, false));
  } else {
    checks.push(check("og-image", "Open Graph image", 10, false, false, "Missing"));
    recs.push("Add an Open Graph image (1200×630) for rich social previews.");
  }

  // OG title/desc (5)
  if (hasOgTitle && hasOgDesc) {
    checks.push(check("og-meta", "OG title & description", 5, true, false));
  } else {
    checks.push(check("og-meta", "OG title & description", 5, false, true));
    recs.push("Set explicit OG title & description for sharing previews.");
  }

  // Twitter card (5)
  if (hasTwitter) {
    checks.push(check("twitter", "Twitter card meta", 5, true, false));
  } else {
    checks.push(check("twitter", "Twitter card meta", 5, false, true, "Falls back to OG"));
  }

  // Canonical (10)
  if (canonical) {
    checks.push(check("canonical", "Canonical URL", 10, true, false));
  } else {
    checks.push(check("canonical", "Canonical URL", 10, false, true, "Falls back to current URL"));
  }

  // Schema (10)
  if (schema) {
    checks.push(check("schema", "Structured data (JSON-LD)", 10, true, false));
  } else {
    checks.push(check("schema", "Structured data (JSON-LD)", 10, false, true, "Add page-specific schema"));
    recs.push("Add JSON-LD structured data appropriate for this page type.");
  }

  // Indexability (10) - punish noindex on pages that should be indexed
  const robotsIndex = seo?.robotsIndex !== false;
  if (robotsIndex) {
    checks.push(check("index", "Indexable", 10, true, false));
  } else {
    checks.push(check("index", "Indexable", 10, false, false, "robots: noindex"));
    recs.push("Page is set to noindex — verify this is intentional.");
  }

  // Content/image hints (5)
  if (context?.hasContent) {
    checks.push(check("content", "Content depth signal", 5, true, false));
  } else if (context?.hasContent === false) {
    checks.push(check("content", "Content depth signal", 5, false, true, "Thin content"));
    recs.push("Increase on-page content depth (aim 300+ meaningful words).");
  }

  const totalWeight = checks.reduce((s, c) => s + c.weight, 0);
  const earned = checks.reduce(
    (s, c) => s + (c.severity === "ok" ? c.weight : c.severity === "warn" ? c.weight * 0.5 : 0),
    0,
  );
  const score = Math.round((earned / totalWeight) * 100);

  return {
    path,
    category: categorize(path),
    score,
    grade: gradeFor(score),
    checks,
    recommendations: recs,
    hasSeoRecord: !!seo,
    indexable: robotsIndex,
  };
}

const STATIC_PATHS = [
  "/",
  "/spiritual-essentials",
  "/shop",
  "/pandits",
  "/puja",
  "/astrology",
  "/pind-daan",
  "/pind-daan/kashi",
  "/pind-daan/gaya",
  "/pind-daan/haridwar",
  "/pind-daan/why-important",
  "/pind-daan/sites-in-india",
  "/pind-daan/yearly-remote",
  "/donations",
  "/ai-kundli",
  "/ai-baby-names",
  "/ai-palm-reading",
  "/about",
  "/contact",
  "/careers",
  "/franchise",
  "/become-pandit",
  "/become-astrologer",
  "/panchang-calendar",
  "/spiritual-dashboard",
  "/virtual-puja",
  "/kathas",
  "/membership",
  "/temple-tourism",
  "/route-planner",
  "/zodiac-rashifal",
  "/scripture-search",
  "/muhurat-finder",
  "/matrimony",
  "/terms-conditions",
  "/privacy-policy",
  "/refund-policy",
  "/shipping-policy",
];

export async function auditSite(): Promise<SiteAuditResult> {
  const [seoPagesList, products] = await Promise.all([
    storage.getSeoPages(),
    storage.getProducts(),
  ]);
  const seoMap = new Map(seoPagesList.map((s) => [s.pagePath, s]));

  const productPaths = products.map((p) => `/product/${p.slug || p.id}`);
  const productSeoCtx = new Map(
    products.map((p) => [
      `/product/${p.slug || p.id}`,
      { hasContent: !!(p.description && p.description.length > 200), hasImage: !!p.image },
    ]),
  );

  const allPaths = Array.from(new Set([...STATIC_PATHS, ...productPaths]));
  const results = allPaths.map((path) =>
    auditPage(path, seoMap.get(path), productSeoCtx.get(path) || { hasContent: true }),
  );

  const indexable = results.filter((r) => r.indexable);
  const overallScore = Math.round(
    indexable.reduce((s, r) => s + r.score, 0) / Math.max(indexable.length, 1),
  );

  const byCategory: Record<string, { count: number; avgScore: number }> = {};
  for (const r of results) {
    const c = byCategory[r.category] || { count: 0, avgScore: 0 };
    c.count += 1;
    c.avgScore += r.score;
    byCategory[r.category] = c;
  }
  for (const k of Object.keys(byCategory)) {
    byCategory[k].avgScore = Math.round(byCategory[k].avgScore / byCategory[k].count);
  }

  // Top issues
  const issueCounts = new Map<string, number>();
  for (const r of results) {
    for (const rec of r.recommendations) issueCounts.set(rec, (issueCounts.get(rec) || 0) + 1);
  }
  const topIssues = Array.from(issueCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([issue, count]) => ({ issue, count }));

  return {
    generatedAt: new Date().toISOString(),
    overallScore,
    overallGrade: gradeFor(overallScore),
    totals: {
      pages: results.length,
      indexable: indexable.length,
      withMeta: results.filter((r) => r.hasSeoRecord).length,
      missingTitle: results.filter((r) => !seoMap.get(r.path)?.metaTitle).length,
      missingDescription: results.filter((r) => !seoMap.get(r.path)?.metaDescription).length,
      missingOgImage: results.filter((r) => !seoMap.get(r.path)?.ogImage).length,
      missingKeywords: results.filter((r) => !seoMap.get(r.path)?.metaKeywords).length,
      missingSchema: results.filter((r) => !seoMap.get(r.path)?.schemaMarkup).length,
    },
    byCategory,
    topIssues,
    pages: results.sort((a, b) => a.score - b.score),
  };
}
