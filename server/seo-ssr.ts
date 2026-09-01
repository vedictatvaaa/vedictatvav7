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
import { getPubliclyPublishedPanditBySlug } from "./pandit-public-access";
import {
  resolveSeoMetadata,
  type ResolvedSeoMetadata,
} from "../shared/seo-metadata";

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

export type HeadSchema = {
  id: string;
  payload: Record<string, any>;
};

export type Head = {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
  preserveOnHydration?: boolean;
  jsonLd?: HeadSchema[];
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

export function resolveHeadMetadata(h: Head, baseUrl: string, requestPath = h.canonical): ResolvedSeoMetadata {
  const metadata = resolveSeoMetadata({
    title: h.title,
    description: h.description,
    canonical: h.canonical,
    requestPath,
    origin: baseUrl,
    siteName: SITE_NAME,
    keywords: h.keywords,
    ogTitle: h.ogTitle,
    ogDescription: h.ogDescription,
    ogImage: h.ogImage || DEFAULT_OG_IMAGE,
    ogType: h.ogType,
    twitterCard: h.twitterCard,
    twitterTitle: h.twitterTitle,
    twitterDescription: h.twitterDescription,
    twitterImage: h.twitterImage,
    noindex: h.noindex,
    robotsIndex: h.robotsIndex,
    robotsFollow: h.robotsFollow,
  });
  return h.preserveOnHydration === false
    ? { ...metadata, isFallback: true }
    : metadata;
}

export function buildHeadHtml(h: Head, baseUrl: string, requestPath = h.canonical): string {
  const metadata = resolveHeadMetadata(h, baseUrl, requestPath);
  const lines = [
    `<title>${escapeHtmlAttr(metadata.title)}</title>`,
    `<meta name="description" content="${escapeHtmlAttr(metadata.description)}" />`,
    ...(metadata.keywords
      ? [`<meta name="keywords" content="${escapeHtmlAttr(metadata.keywords)}" />`]
      : []),
    `<meta name="robots" content="${metadata.robots}" />`,
    `<link rel="canonical" href="${escapeHtmlAttr(metadata.canonical)}" />`,
    `<link rel="alternate" hreflang="en-IN" href="${escapeHtmlAttr(metadata.alternates["en-IN"])}" />`,
    `<link rel="alternate" hreflang="hi-IN" href="${escapeHtmlAttr(metadata.alternates["hi-IN"])}" />`,
    `<link rel="alternate" hreflang="x-default" href="${escapeHtmlAttr(metadata.alternates["x-default"])}" />`,
    `<meta property="og:site_name" content="${escapeHtmlAttr(metadata.openGraph.siteName)}" />`,
    `<meta property="og:title" content="${escapeHtmlAttr(metadata.openGraph.title)}" />`,
    `<meta property="og:description" content="${escapeHtmlAttr(metadata.openGraph.description)}" />`,
    `<meta property="og:url" content="${escapeHtmlAttr(metadata.openGraph.url)}" />`,
    `<meta property="og:type" content="${escapeHtmlAttr(metadata.openGraph.type)}" />`,
    `<meta property="og:image" content="${escapeHtmlAttr(metadata.openGraph.image)}" />`,
    `<meta property="og:locale" content="${metadata.openGraph.locale}" />`,
    `<meta property="og:locale:alternate" content="${metadata.openGraph.alternateLocale}" />`,
    `<meta name="twitter:card" content="${metadata.twitter.card}" />`,
    `<meta name="twitter:site" content="${metadata.twitter.site}" />`,
    `<meta name="twitter:title" content="${escapeHtmlAttr(metadata.twitter.title)}" />`,
    `<meta name="twitter:description" content="${escapeHtmlAttr(metadata.twitter.description)}" />`,
    `<meta name="twitter:image" content="${escapeHtmlAttr(metadata.twitter.image)}" />`,
    `<script id="ssr-seo-state" type="application/json">${JSON.stringify(metadata).replace(/</g, "\\u003c")}</script>`,
  ];
  for (const schema of h.jsonLd || []) {
    // Stringify safely — no </script> escape needed because JSON.stringify
    // escapes < as \u003c only in some engines; do it explicitly.
    const json = JSON.stringify(schema.payload).replace(/</g, "\\u003c");
    lines.push(`<script type="application/ld+json" data-jsonld="${escapeHtmlAttr(schema.id)}">${json}</script>`);
  }
  return `<!--ssr-seo-->\n    ${lines.join("\n    ")}\n    <!--/ssr-seo-->`;
}

// Replace the static <title>...</title> in the template (the generic site
// title from index.html) with the per-route head block. Also strip the
// site-wide canonical, robots, og:*, twitter:* and JSON-LD tags that ship
// in the static template so crawlers don't see two competing values.
export function injectHead(html: string, headHtml: string): string {
  let out = html;
  // Remove generic title.
  out = out.replace(/<title>[\s\S]*?<\/title>/i, "");
  out = out.replace(/<meta\s+[^>]*\bname=["']description["'][^>]*>\s*/gi, "");
  out = out.replace(/<meta\s+[^>]*\bname=["']keywords["'][^>]*>\s*/gi, "");
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
  const staticHeads: Record<string, Head> = {
    "/qa": {
      title: "Spiritual Q&A — Pujas, Mantras, Vedic Wisdom | Vedic Tatva",
      description: "Hundreds of answered questions on Hindu pujas, fasting, festivals, mantras, astrology and dharma — sourced from practising pandits and editorial review.",
      canonical: "/qa",
    },
    "/puja-guide": {
      title: "Puja Guide — Vidhi, Samagri, Muhurats for Every Major Hindu Puja",
      description: "Authentic guide to Hindu pujas — Satyanarayan, Rudrabhishek, Lakshmi, Navagraha, Griha Pravesh and more. Vidhi, story, samagri checklist, and yearly muhurats.",
      canonical: "/puja-guide",
    },
    "/accessibility": {
      title: "Accessibility Statement | Vedic Tatva",
      description: "Vedic Tatva is committed to WCAG 2.1 Level AA accessibility — keyboard navigation, screen reader support, color contrast, and an open feedback channel.",
      canonical: "/accessibility",
    },
    "/product-compare": {
      title: "Compare Sacred Puja Products Side-by-Side | Vedic Tatva",
      description: "Compare up to 4 sacred Vedic Tatva products side-by-side — price, category, highlights, availability and more. Make informed choices for your puja and home.",
      canonical: "/compare",
    },
    "/investors": {
      title: "Investors — Vedic Tatva | Building India's Spiritual Operating System",
      description: "Vedic Tatva is the premium platform unifying verified pandits, authentic spiritual products, AI consultations and the Sacred Library. Investor relations, market opportunity, traction and contact for funds, family offices and angels.",
      canonical: "/investors",
    },
    "/puja-kit": {
      title: "Build Your Puja Kit · Vedic Tatva",
      description: "Pick your deity — get a curated kit of diyas, hawan samagri, akhand jot and everything you need, added to cart in one click.",
      canonical: "/puja-kit",
    },
    "/japa": {
      title: "Mantra Japa Counter — Free 108 Mala Counter Online | Vedic Tatva",
      description: "Free online japa mala counter (108 / 54 / 27 beads) with bell, vibration, daily streaks, and 30+ Vedic mantras — Mahamrityunjaya, Gayatri, Om Namah Shivaya, Hare Krishna and more. AI mantra oracle. Saved privately on your device.",
      canonical: "/digital-japa-counter",
      keywords: "japa counter, jaap counter, mala counter, online jap counter, 108 mala counter, 1008 mala counter, mantra counter, mantra japa online, Vedic mantra counter, Mahamrityunjaya mantra, Gayatri mantra, Om Namah Shivaya, Hare Krishna counter, Shiva mantra counter, chanting counter app, japa mala app, free mantra counter, sadhana tracker, ऑनलाइन माला जप, जप काउंटर, मंत्र जप",
      twitterCard: "summary_large_image",
    },
    "/digital-japa-counter": {
      title: "Mantra Japa Counter — Free 108 Mala Counter Online | Vedic Tatva",
      description: "Free online japa mala counter (108 / 54 / 27 beads) with bell, vibration, daily streaks, and 30+ Vedic mantras — Mahamrityunjaya, Gayatri, Om Namah Shivaya, Hare Krishna and more. AI mantra oracle. Saved privately on your device.",
      canonical: "/digital-japa-counter",
      keywords: "japa counter, jaap counter, mala counter, online jap counter, 108 mala counter, 1008 mala counter, mantra counter, mantra japa online, Vedic mantra counter, Mahamrityunjaya mantra, Gayatri mantra, Om Namah Shivaya, Hare Krishna counter, Shiva mantra counter, chanting counter app, japa mala app, free mantra counter, sadhana tracker, ऑनलाइन माला जप, जप काउंटर, मंत्र जप",
      twitterCard: "summary_large_image",
    },
  };
  if (staticHeads[reqPath]) return staticHeads[reqPath];

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

  // Per-pandit dynamic OG card for the canonical /pandit/<slug> storefront.
  // in og-meta.ts so each share preview shows the real pandit's name, city,
  // rating, and photo.
  const panditMatch = reqPath.match(/^\/pandit\/([a-z0-9-]+)\/?$/);
  if (panditMatch) {
    try {
      const p = await getPubliclyPublishedPanditBySlug(panditMatch[1]);
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
      const canonicalPath = `/puja-samagri-online/${canonicalKey}`;

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
            "@id": `${baseUrl}${canonicalPath}#item-list`,
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
            "@id": `${baseUrl}${canonicalPath}#faq`,
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
        "@id": `${baseUrl}${canonicalPath}#breadcrumb`,
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
          { "@type": "ListItem", position: 2, name: "Shop", item: `${baseUrl}/puja-samagri-online` },
          { "@type": "ListItem", position: 3, name: c.category, item: `${baseUrl}${canonicalPath}` },
        ],
      };

      const jsonLd: HeadSchema[] = [
        { id: "breadcrumb", payload: breadcrumbSchema },
        ...(itemListSchema ? [{ id: "item-list", payload: itemListSchema }] : []),
        ...(faqSchema ? [{ id: `faq-${canonicalKey}`, payload: faqSchema }] : []),
      ];

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
            id: "product",
            payload: {
            "@context": "https://schema.org",
            "@type": "Product",
            "@id": `${baseUrl}${canonical}#product`,
            url: `${baseUrl}${canonical}`,
            name: p.name,
            description: desc,
            image: p.image ? abs(baseUrl, p.image) : undefined,
            sku: p.sku ? String(p.sku) : String(p.id),
            brand: { "@type": "Brand", name: p.brand || SITE_NAME },
            category: p.category,
            offers: offer,
            },
          },
        ],
      };
    }
  }

  // 3) Published blog article — align the first response with BlogPostPage.
  const blogMatch = reqPath.match(/^\/blog\/([^/?#]+)$/);
  if (blogMatch) {
    try {
      const post = await storage.getBlogPostBySlug(decodeURIComponent(blogMatch[1]));
      if (post && post.isPublished) {
        const canonical = `/blog/${post.slug}`;
        const description = post.metaDescription || post.excerpt || "";
        const articleUrl = `${baseUrl}${canonical}`;
        const bodyText = String(post.body || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        const published = (post.publishedAt || post.createdAt)?.toISOString();
        return {
          title: post.metaTitle || `${post.title} | ${SITE_NAME}`,
          description,
          canonical,
          ogImage: post.coverImage || undefined,
          ogType: "article",
          jsonLd: [
            {
              id: "article",
              payload: {
                "@context": "https://schema.org",
                "@type": "BlogPosting",
                "@id": `${articleUrl}#article`,
                headline: post.title,
                description,
                image: [abs(baseUrl, post.coverImage || "/opengraph.jpg")],
                mainEntityOfPage: { "@type": "WebPage", "@id": articleUrl },
                datePublished: published,
                dateModified: published,
                author: {
                  "@type": "Person",
                  name: post.authorName || SITE_NAME,
                  url: `${baseUrl}/blog`,
                  worksFor: { "@id": `${baseUrl}/#organization` },
                },
                publisher: { "@id": `${baseUrl}/#organization` },
                wordCount: bodyText ? bodyText.split(" ").length : undefined,
                articleSection: post.category || undefined,
                keywords: post.tags?.length ? post.tags.join(", ") : undefined,
              },
            },
            {
              id: "breadcrumb",
              payload: {
                "@context": "https://schema.org",
                "@type": "BreadcrumbList",
                "@id": `${articleUrl}#breadcrumb`,
                itemListElement: [
                  { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
                  { "@type": "ListItem", position: 2, name: "Journal", item: `${baseUrl}/blog` },
                  { "@type": "ListItem", position: 3, name: post.title, item: articleUrl },
                ],
              },
            },
          ],
        };
      }
    } catch {}
  }

  // 4) Anything in seo_pages (admin-managed: hero/SEO copy for landings)
  try {
    const seo = await storage.getSeoPageByPath(reqPath);
    if (seo && seo.isActive) {
      return {
        title: seo.metaTitle || `${SITE_NAME}`,
        description: seo.metaDescription || "",
        canonical: seo.canonicalUrl || reqPath,
        keywords: seo.metaKeywords || undefined,
        ogTitle: seo.ogTitle || undefined,
        ogDescription: seo.ogDescription || undefined,
        ogImage: seo.ogImage || undefined,
        ogType: seo.ogType || "website",
        twitterTitle: seo.twitterTitle || undefined,
        twitterDescription: seo.twitterDescription || undefined,
        twitterImage: seo.twitterImage || undefined,
        robotsIndex: seo.robotsIndex,
        robotsFollow: seo.robotsFollow,
      };
    }
  } catch {}

  return null;
}

function fallbackHead(reqPath: string): Head {
  const cleanPath = reqPath.replace(/^\/hi(?=\/|$)/, "").replace(/\/+$/, "") || "/";
  const segment = cleanPath.split("/").filter(Boolean).pop();
  const label = segment
    ? decodeURIComponent(segment)
        .replace(/[-_]+/g, " ")
        .replace(/\b\w/g, (letter) => letter.toUpperCase())
    : SITE_NAME;
  return {
    title: label === SITE_NAME ? SITE_NAME : `${label} | ${SITE_NAME}`,
    description: "Explore authentic Vedic services, spiritual guidance, puja bookings, and sacred products from Vedic Tatva.",
    canonical: reqPath,
    preserveOnHydration: false,
  };
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
    if (!head) head = fallbackHead(path);

    const headHtml = buildHeadHtml(head, baseUrl, path);

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
