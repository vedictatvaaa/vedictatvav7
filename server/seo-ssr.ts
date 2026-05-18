// Pragmatic head-injection SSR for SEO.
//
// Vite/static serves the same client/index.html for every SPA route, which
// means the *initial* HTML that crawlers and link-unfurl bots see has the
// generic site-wide title and meta. <PageSeo> only updates the <head> after
// React mounts — too late for many crawlers (and absolutely too late for
// social-media unfurlers like Twitter, LinkedIn, WhatsApp, Slack).
//
// This middleware sits BETWEEN the API routes and the Vite/static catch-all.
// For top SEO routes (/, /puja-samagri-online, /shop/:slug, /product/:slug, /pind-daan-booking*,
// /astrology, /book-pandit-online, /puja, /blog, /blog/:slug, etc.), it:
//
//   1. Looks up the SEO data ahead of time (seo_pages row / category content
//      / product row).
//   2. Wraps res.send so when Vite/static returns the index.html, we splice
//      route-specific <title>, meta description, canonical and OG tags
//      directly into <head>, replacing the placeholders.
//
// We intentionally do NOT render the React body server-side — that would
// require a full SSR build pipeline. Body content for crawlers comes from
// the visible static HTML the page already contains (hero text, structured
// content blocks) once React hydrates. The head-injection is enough to fix
// title/description/canonical/og across every public page.
//
// Skipped paths: API routes, static asset prefixes, sitemap routes,
// admin/checkout/auth flows, and any non-GET request.

import type { NextFunction, Request, Response } from "express";
import { storage } from "./storage";
import { CATEGORY_HEAD, resolveCategorySlug } from "./seo-category-head";
import { resolveExplicitOgCard } from "./og-meta";

const SKIP_PREFIXES = [
  "/api/", "/assets/", "/uploads/", "/attached_assets/",
  "/sitemap", "/robots.txt", "/llms.txt", "/manifest.webmanifest",
  "/sw.js", "/service-worker.js", "/__vite", "/@",
  "/admin", "/checkout", "/cart", "/order-confirmation", "/login",
  "/register", "/reset-password", "/my-profile", "/my-bookings",
  "/pandit/login", "/pandit/portal",
];

const SITE_NAME = "Vedic Tatva";
const DEFAULT_OG_IMAGE = "/attached_assets/og-default.png";

type Head = {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType?: string;
  noindex?: boolean;
  jsonLd?: Array<Record<string, any>>;
};

function abs(baseUrl: string, p: string | undefined | null): string {
  if (!p) return "";
  if (/^https?:\/\//i.test(p)) return p;
  return `${baseUrl}${p.startsWith("/") ? "" : "/"}${p}`;
}

function escapeHtmlAttr(s: string): string {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function buildHeadHtml(h: Head, baseUrl: string): string {
  const can = h.canonical.startsWith("http") ? h.canonical : `${baseUrl}${h.canonical}`;
  const og = abs(baseUrl, h.ogImage || DEFAULT_OG_IMAGE);
  const robots = h.noindex
    ? "noindex, nofollow"
    : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
  // Build the en/hi hreflang pair so server-rendered HTML matches the
  // client-side <PageSeo> component (which emits all three alternates).
  // Without the hi-IN entry here, crawlers see only English alternates and
  // Google will discard the hreflang cluster for the Hindi pages entirely.
  // Path layout matches client/src/components/PageSeo.tsx: Hindi pages live
  // under /hi/<path>, English pages at /<path>; canonical = self.
  // Normalize trailing slashes so SSR matches the client `PageSeo`
  // output exactly (`/hi`, never `/hi/`; `/blog`, never `/blog/`).
  // The single exception is the root `/` which must stay as-is.
  const rawPath = h.canonical.replace(/^https?:\/\/[^/]+/, "") || "/";
  const cleanPath = rawPath === "/" ? "/" : rawPath.replace(/\/+$/, "") || "/";
  const isHindi = cleanPath === "/hi" || cleanPath.startsWith("/hi/");
  const enPath = isHindi
    ? (cleanPath === "/hi" ? "/" : cleanPath.replace(/^\/hi/, ""))
    : cleanPath;
  const hiPath = isHindi ? cleanPath : (cleanPath === "/" ? "/hi" : `/hi${cleanPath}`);
  const enHref = enPath.startsWith("http") ? enPath : `${baseUrl}${enPath}`;
  const hiHref = hiPath.startsWith("http") ? hiPath : `${baseUrl}${hiPath}`;
  const lines = [
    `<title>${escapeHtmlAttr(h.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(h.description)}" />`,
    `<meta name="robots" content="${robots}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(can)}" />`,
    `<link rel="alternate" hreflang="en-IN" href="${escapeHtmlAttr(enHref)}" />`,
    `<link rel="alternate" hreflang="hi-IN" href="${escapeHtmlAttr(hiHref)}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(enHref)}" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(SITE_NAME)}" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(h.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(h.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(can)}" />`,
    `<meta property="og:type" content="${escapeHtmlAttr(h.ogType || "website")}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(og)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(h.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(h.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(og)}" />`,
  ];
  for (const j of h.jsonLd || []) {
    // Stringify safely — no </script> escape needed because JSON.stringify
    // escapes < as \u003c only in some engines; do it explicitly.
    const json = JSON.stringify(j).replace(/</g, "\\u003c");
    lines.push(`<script type="application/ld+json">${json}</script>`);
  }
  return `<!--ssr-seo-->\n    ${lines.join("\n    ")}\n    <!--/ssr-seo-->`;
}

// Replace the static <title>...</title> in the template (the generic site
// title from index.html) with the per-route head block. Also strip the
// site-wide canonical, robots, og:*, twitter:* and JSON-LD tags that ship
// in the static template so crawlers don't see two competing values.
function injectHead(html: string, headHtml: string): string {
  let out = html;
  // Remove generic title.
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "");
  // Remove existing canonical, alternate, robots, og:*, twitter:* tags so
  // there is exactly one of each in the head we ship. Preserve the
  // /llms.txt alternate (rel="alternate" type="text/markdown") which is
  // not an i18n alternate and should remain on every page.
  out = out.replace(/<link\s+[^>]*\brel=["'](?:canonical|alternate)["'][^>]*>\s*/gi, (m) => {
    if (/llms\.txt/i.test(m) || /type=["']text\/markdown["']/i.test(m)) return m;
    return "";
  });
  out = out.replace(/<meta\s+[^>]*\bname=["']robots["'][^>]*>\s*/gi, "");
  out = out.replace(/<meta\s+[^>]*\bproperty=["']og:[^"']+["'][^>]*>\s*/gi, "");
  out = out.replace(/<meta\s+[^>]*\bname=["']twitter:[^"']+["'][^>]*>\s*/gi, "");
  // Insert the new head block right after the opening <head>.
  out = out.replace(/<head([^>]*)>/i, (m, attrs) => `<head${attrs}>\n    ${headHtml}\n`);
  return out;
}

async function resolveHead(reqPath: string, baseUrl: string): Promise<Head | null> {
  // 0) Bespoke WhatsApp/social share cards (server/og-meta.ts).
  // These are hand-curated for the highest-intent routes (homepage,
  // /become-pandit, /puja-samagri-online, /spiritual-essentials, /book-pandit-online, /puja,
  // /pind-daan-booking*, /membership) with FOMO copy + Sanskrit mantra +
  // dedicated 1200x630 imagery. They override seo_pages because the
  // share-preview is a marketing surface, not an SEO body-content surface.
  // /shop/:slug and /product/:slug still fall through to the richer
  // category/product blocks below for proper Schema.org JSON-LD.
  const isCategoryOrProduct =
    /^\/puja-samagri-online\/[^/?#]+$/.test(reqPath) || /^\/product\/[^/?#]+$/.test(reqPath);

  // Per-pandit dynamic OG card for /p/<slug> — overrides the static fallback
  // in og-meta.ts so each share preview shows the real pandit's name, city,
  // rating, and photo.
  const panditMatch = reqPath.match(/^\/p\/([a-z0-9-]+)\/?$/);
  if (panditMatch) {
    try {
      const p = await storage.getPanditBySlug(panditMatch[1]);
      if (p) {
        const ratingPart = p.rating && p.reviewCount
          ? ` · ${Number(p.rating).toFixed(1)}★ (${p.reviewCount})`
          : "";
        const cityPart = p.city ? ` in ${p.city}` : "";
        const verified = p.verified ? "Verified " : "";
        return {
          title: `${p.name} — ${verified}Vedic Pandit${cityPart}${ratingPart} · Vedic Tatva`,
          description: (p.bio?.slice(0, 200))
            || `Book pujas with ${p.name}${cityPart}. ${verified}by Vedic Tatva. Speaks ${((Array.isArray(p.languages) ? p.languages : []) as string[]).slice(0, 3).join(", ") || "Sanskrit"}.`,
          canonical: reqPath,
          ogImage: `/api/og/p/${panditMatch[1]}.jpg`,
          ogType: "profile",
        };
      }
    } catch {}
  }

  if (!isCategoryOrProduct) {
    const card = resolveExplicitOgCard(reqPath);
    if (card) {
      return {
        title: card.title,
        description: card.description,
        canonical: reqPath === "/" ? "/" : reqPath,
        ogImage: card.image,
        ogType: "website",
      };
    }
  }

  // 1) Curated category landings — /shop/:slug (alias-aware so /shop/malas
  // resolves to the wearables block, matching client behaviour).
  const shopMatch = reqPath.match(/^\/puja-samagri-online\/([^/?#]+)$/);
  if (shopMatch) {
    const urlSlug = shopMatch[1];
    const canonicalKey = resolveCategorySlug(urlSlug);
    const c = CATEGORY_HEAD[canonicalKey];
    if (c) {
      // Always canonicalise to the canonical-key URL so alias paths point
      // crawlers at the primary URL.
      const canonicalPath = `/shop/${canonicalKey}`;

      // Pull up to 12 in-category products for the ItemList JSON-LD so
      // crawlers see a real category index even before React hydrates.
      let itemListSchema: Record<string, any> | null = null;
      try {
        const all = await storage.getProducts();
        const matches = all.filter((p: any) => {
          const pc = String(p.category || "").toLowerCase().trim();
          return pc === c.category.toLowerCase().trim();
        }).slice(0, 12);
        if (matches.length) {
          itemListSchema = {
            "@context": "https://schema.org",
            "@type": "ItemList",
            name: c.category,
            numberOfItems: matches.length,
            itemListElement: matches.map((p: any, idx: number) => ({
              "@type": "ListItem",
              position: idx + 1,
              url: `${baseUrl}/product/${p.slug || p.id}`,
              name: p.name,
            })),
          };
        }
      } catch {
        // ItemList is best-effort — never block page load on a storage hiccup.
      }

      const faqSchema = c.faqs.length
        ? {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: c.faqs.map((f) => ({
              "@type": "Question",
              name: f.q,
              acceptedAnswer: { "@type": "Answer", text: f.a },
            })),
          }
        : null;

      const breadcrumbSchema = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${baseUrl}/puja-samagri-online` },
          { "@type": "ListItem", position: 3, name: c.category, item: `${baseUrl}${canonicalPath}` },
        ],
      };

      const jsonLd = [breadcrumbSchema, itemListSchema, faqSchema].filter(
        (x): x is Record<string, any> => Boolean(x)
      );

      return {
        title: c.metaTitle,
        description: c.metaDescription,
        canonical: canonicalPath,
        ogType: "website",
        jsonLd,
      };
    }
  }

  // 2) Product detail — /product/:slug-or-id
  const productMatch = reqPath.match(/^\/product\/([^/?#]+)$/);
  if (productMatch) {
    const key = decodeURIComponent(productMatch[1]);
    let p: any = await storage.getProductBySlug(key).catch(() => undefined);
    if (!p && /^\d+$/.test(key)) {
      p = await storage.getProduct(Number(key)).catch(() => undefined);
    }
    if (p) {
      const desc = (p.description || `Buy ${p.name} online at ${SITE_NAME}.`)
        .replace(/<[^>]*>/g, " ")
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 230);
      const title = `${p.name} — Buy Online | ${SITE_NAME}`;
      const canonical = `/product/${p.slug || p.id}`;
      const offer = p.price !== undefined && p.price !== null
        ? {
            "@type": "Offer",
            price: String(p.price),
            priceCurrency: "INR",
            availability: `https://schema.org/${(p.stock ?? 0) > 0 ? "InStock" : "OutOfStock"}`,
            url: `${baseUrl}${canonical}`,
          }
        : undefined;
      return {
        title,
        description: desc,
        canonical,
        ogImage: p.image,
        ogType: "product",
        jsonLd: [
          {
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: desc,
            image: p.image ? abs(baseUrl, p.image) : undefined,
            sku: p.sku ? String(p.sku) : String(p.id),
            brand: { "@type": "Brand", name: p.brand || SITE_NAME },
            category: p.category,
            offers: offer,
          },
        ],
      };
    }
  }

  // 3) Anything in seo_pages (admin-managed: hero/SEO copy for landings)
  try {
    const seo = await storage.getSeoPageByPath(reqPath);
    if (seo && seo.isActive) {
      return {
        title: seo.metaTitle || `${SITE_NAME}`,
        description: seo.metaDescription || "",
        canonical: seo.canonical || reqPath,
        ogImage: seo.ogImage || undefined,
        ogType: "website",
        noindex: seo.robotsIndex === false,
      };
    }
  } catch {}

  return null;
}

export function seoHeadMiddleware() {
  return async function seoHead(req: Request, res: Response, next: NextFunction) {
    if (req.method !== "GET") return next();
    // Many bots and link unfurlers send `*/*` or no Accept header at all.
    // Skip only when Accept clearly opts out of HTML (e.g. application/json
    // for XHR-style requests). The body-side `<head` check in tryInject is
    // the final guard that prevents us from corrupting non-HTML responses.
    const accept = String(req.headers.accept || "").toLowerCase();
    if (accept && !accept.includes("text/html") && !accept.includes("*/*") && !accept.includes("text/*")) {
      return next();
    }
    const path = req.path;
    if (path.includes(".") && !path.endsWith(".html") && !path.endsWith("/")) return next();
    if (SKIP_PREFIXES.some((p) => path === p || path.startsWith(p))) return next();

    const baseUrl =
      process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`;

    let head: Head | null = null;
    try {
      head = await resolveHead(path, baseUrl);
    } catch (err) {
      // SEO is best-effort — never crash a page load over a missing meta lookup.
      console.warn("[seo-ssr] resolveHead failed:", (err as any)?.message);
    }
    if (!head) return next();

    const headHtml = buildHeadHtml(head, baseUrl);

    // Wrap both res.send and res.end so HTML emitted by Vite (which calls
    // res.end(page) directly) AND by static/express handlers (res.send) get
    // the head injected on its way out. Non-HTML responses pass through.
    const tryInject = (body: any): any => {
      try {
        const ctype = String(res.getHeader("Content-Type") || "");
        if (typeof body === "string" && body.includes("<head") && (ctype.includes("html") || !ctype)) {
          const out = injectHead(body, headHtml);
          // Length changed — drop any precomputed Content-Length so the
          // runtime recomputes it (Express normally does this for strings,
          // but be explicit to avoid mismatches when called via res.end).
          if (out !== body) res.removeHeader("Content-Length");
          return out;
        }
      } catch (e) {
        console.warn("[seo-ssr] inject failed:", (e as any)?.message);
      }
      return body;
    };

    const originalSend = res.send.bind(res);
    res.send = function patchedSend(body: any) {
      return originalSend(tryInject(body));
    } as any;

    const originalEnd = res.end.bind(res);
    res.end = function patchedEnd(chunk?: any, ...rest: any[]) {
      if (typeof chunk === "string") {
        chunk = tryInject(chunk);
      } else if (chunk && Buffer.isBuffer(chunk)) {
        const ctype = String(res.getHeader("Content-Type") || "");
        if (ctype.includes("html")) {
          const str = chunk.toString("utf-8");
          if (str.includes("<head")) chunk = injectHead(str, headHtml);
        }
      }
      return (originalEnd as any)(chunk, ...rest);
    } as any;

    next();
  };
}
