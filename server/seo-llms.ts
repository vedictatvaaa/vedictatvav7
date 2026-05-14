import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";

// llms.txt — convention for AI crawlers (ChatGPT/Claude/Perplexity) to discover
// site structure and authoritative content.
// Spec: https://llmstxt.org/

const stripHtml = (html: string): string =>
  (html || "")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();

// Public AI-crawler endpoints — generous but bounded to prevent abuse.
const aiCrawlerLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// In-process cache for /llms.txt (it scans 50 products + 20 pandits per call).
let llmsTxtCache: { siteUrl: string; body: string; expires: number } | null = null;
const LLMS_TXT_TTL_MS = 5 * 60_000;

export async function buildLlmsTxt(siteUrl: string): Promise<string> {
  const products = (await storage.getProducts()).slice(0, 50);
  const allPandits = await storage.getPandits();
  const pandits = allPandits.filter((p: any) => p.verified === true).slice(0, 20);
  const lines: string[] = [];
  lines.push(`# Vedic Tatva`);
  lines.push("");
  lines.push("> Vedic Tatva is India's premium spiritual ecommerce platform offering authentic puja samagri, idols, gemstones, and verified pandit booking for online and at-home pujas, Pind Daan in Gaya/Kashi/Haridwar, and AI-powered Vedic astrology services.");
  lines.push("");
  lines.push("## Core Services");
  lines.push(`- [Book a Pandit](${siteUrl}/pandits): Verified Vedic pandits for puja at home or online`);
  lines.push(`- [Book a Puja](${siteUrl}/puja): Online and at-home Vedic pujas`);
  lines.push(`- [Pind Daan](${siteUrl}/pind-daan): Ancestral rituals in Gaya, Kashi, Haridwar`);
  lines.push(`- [Astrology](${siteUrl}/astrology): Kundli, matchmaking, dosha analysis`);
  lines.push(`- [AI Kundli](${siteUrl}/ai-kundli): Free AI-powered Vedic birth chart analysis`);
  lines.push(`- [Panchang](${siteUrl}/panchang): Daily Hindu calendar with tithi, nakshatra, muhurat`);
  lines.push(`- [Matrimony](${siteUrl}/matrimony): Vedic-aligned matrimonial profiles`);
  lines.push("");
  lines.push("## Spiritual Shop");
  lines.push(`- [Spiritual Essentials](${siteUrl}/spiritual-essentials)`);
  lines.push(`- [Idols & Murtis](${siteUrl}/category/idols)`);
  lines.push(`- [Puja Samagri](${siteUrl}/category/puja-samagri)`);
  lines.push(`- [Havan Samagri](${siteUrl}/category/havan-samagri)`);
  lines.push(`- [Wearables (Rudraksha, Mala)](${siteUrl}/category/wearables)`);
  lines.push(`- [Brass & Copperware](${siteUrl}/category/brass-copperware)`);
  lines.push("");
  lines.push("## Featured Products");
  for (const p of products) {
    const path = p.slug ? `/product/${p.slug}` : `/product/${p.id}`;
    lines.push(`- [${p.name}](${siteUrl}${path}): ₹${p.price} — ${p.category}`);
  }
  lines.push("");
  lines.push("## Verified Pandits");
  for (const pa of pandits) {
    const path = pa.slug ? `/pandit/${pa.slug}` : `/pandit/${pa.id}`;
    lines.push(`- [${pa.name}](${siteUrl}${path}): ${pa.specialization || "Vedic Pandit"}`);
  }
  lines.push("");
  lines.push("## Optional");
  lines.push(`- [Sitemap](${siteUrl}/sitemap.xml)`);
  lines.push(`- [Become a Pandit](${siteUrl}/become-pandit)`);
  lines.push(`- [Become an Astrologer](${siteUrl}/become-astrologer)`);
  return lines.join("\n");
}

export function registerLlmsRoutes(app: Express) {
  app.get("/llms.txt", aiCrawlerLimiter, async (req: Request, res: Response) => {
    try {
      const siteUrl = (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const now = Date.now();
      if (!llmsTxtCache || llmsTxtCache.expires < now || llmsTxtCache.siteUrl !== siteUrl) {
        const body = await buildLlmsTxt(siteUrl);
        llmsTxtCache = { siteUrl, body, expires: now + LLMS_TXT_TTL_MS };
      }
      res.set("Cache-Control", "public, max-age=300, s-maxage=900, stale-while-revalidate=86400");
      res.type("text/plain; charset=utf-8").send(llmsTxtCache.body);
    } catch (e: any) {
      res.status(500).type("text/plain").send(`# Error\n${e?.message || "failed to generate"}`);
    }
  });

  // AI-friendly product summary — clean JSON LLMs can consume reliably
  app.get("/api/ai/product-summary/:slug", aiCrawlerLimiter, async (req, res) => {
    try {
      const slug = req.params.slug;
      const product = (await storage.getProductBySlug(slug)) ||
        (Number.isFinite(Number(slug)) ? await storage.getProduct(Number(slug)) : undefined);
      if (!product) return res.status(404).json({ message: "Product not found" });
      const siteUrl = (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const descPlain = stripHtml(product.description || "");
      res.set("Cache-Control", "public, max-age=300, s-maxage=900, stale-while-revalidate=86400");
      res.json({
        name: product.name,
        url: `${siteUrl}/product/${product.slug || product.id}`,
        category: product.category,
        brand: product.brand || "Vedic Tatva",
        priceINR: product.price,
        mrpINR: product.mrp || null,
        currency: "INR",
        availability: (product.stock ?? 0) > 0 ? "in_stock" : "out_of_stock",
        descriptionShort: descPlain.slice(0, 280),
        descriptionPlain: descPlain,
        descriptionFull: product.description,
        highlights: product.highlights || [],
        features: product.features || [],
        // focusKeyword intentionally NOT exposed — internal SEO targeting only
        faq: (product as any).seoFaq || null,
        videoUrl: (product as any).seoVideoUrl || null,
        images: [product.image, ...(product.images || [])].filter(Boolean),
        spiritualContext: `Used in Hindu puja and Vedic rituals. Authentic ${product.category} sourced and curated by Vedic Tatva.`,
        ratings: product.salesCount ? { salesCount: product.salesCount } : null,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });
}
