import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import rateLimit from "express-rate-limit";
import { getPanditDiscoveryFeed } from "./pandit-storefront-content";
import { FOOTER_DESTINATIONS } from "@shared/footer-links";

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

export async function buildLlmsTxt(siteUrl: string, generatedAt = new Date()): Promise<string> {
  const products = (await storage.getProducts()).slice(0, 50);
  const pandits = (await getPanditDiscoveryFeed(siteUrl)).slice(0, 20);
  const lines: string[] = [];
  lines.push(`# Vedic Tatva`);
  lines.push("");
  lines.push("> Vedic Tatva is an India-focused spiritual commerce and services platform offering puja samagri, idols, gemstones, Pandit booking, online and at-home pujas, Pind Daan in Gaya/Kashi/Haridwar, and Vedic astrology tools.");
  lines.push(`> Generated ${generatedAt.toISOString()}. Product prices, stock, service availability, and Pandit eligibility can change; verify the linked page before relying on them.`);
  lines.push("> AI-generated astrology and spiritual guidance is informational and may be inaccurate; it is not a substitute for qualified professional advice.");
  lines.push("");
  lines.push("## Core Services");
  lines.push(`- [Book a Pandit](${siteUrl}${FOOTER_DESTINATIONS.services[0].href}): Browse Pandit profiles and booking options for puja at home or online`);
  lines.push(`- [Book a Puja](${siteUrl}${FOOTER_DESTINATIONS.services[1].href}): Online and at-home Vedic pujas`);
  lines.push(`- [Pind Daan](${siteUrl}/pind-daan-booking): Ancestral rituals in Gaya, Kashi, Haridwar`);
  lines.push(`- [Astrology](${siteUrl}${FOOTER_DESTINATIONS.services[3].href}): Kundli, matchmaking, dosha analysis`);
  lines.push(`- [AI Kundli](${siteUrl}${FOOTER_DESTINATIONS.tools[5].href}): Generate a Vedic birth chart with an AI-assisted interpretation`);
  lines.push(`- [Panchang](${siteUrl}${FOOTER_DESTINATIONS.tools[0].href}): Daily Hindu calendar with tithi, nakshatra, muhurat`);
  lines.push("");
  lines.push("## Spiritual Shop");
  lines.push(`- [Puja Samagri & Essentials](${siteUrl}${FOOTER_DESTINATIONS.shop[0].href})`);
  lines.push(`- [Rudraksha Collection](${siteUrl}${FOOTER_DESTINATIONS.shop[1].href})`);
  lines.push(`- [Rudraksha Malas](${siteUrl}${FOOTER_DESTINATIONS.shop[2].href})`);
  lines.push(`- [Havan Samagri](${siteUrl}${FOOTER_DESTINATIONS.shop[3].href})`);
  lines.push(`- [Puja Kits](${siteUrl}${FOOTER_DESTINATIONS.shop[4].href})`);
  lines.push(`- [Brass Diyas](${siteUrl}${FOOTER_DESTINATIONS.shop[5].href})`);
  lines.push(`- [Spiritual Jewelry](${siteUrl}${FOOTER_DESTINATIONS.shop[6].href})`);
  lines.push(`- [Temple Decor](${siteUrl}${FOOTER_DESTINATIONS.shop[7].href})`);
  lines.push("");
  lines.push("## Featured Products");
  for (const p of products) {
    const path = p.slug ? `/product/${p.slug}` : `/product/${p.id}`;
    lines.push(`- [${p.name}](${siteUrl}${path}): ₹${p.price} — ${p.category}`);
  }
  lines.push("");
  lines.push("## Verified Pandits");
  for (const pa of pandits) {
    const summary = pa.summary || `${pa.name} offers published Vedic puja services${pa.location.city ? ` in ${pa.location.city}` : ""}.`;
    lines.push(`- [${pa.name}](${pa.url}): ${summary}`);
  }
  lines.push(`\n- [Factual Pandit discovery feed](${siteUrl}/api/ai/pandit-feed): Public profiles only; eligibility and availability can change.`);
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
      const body = await buildLlmsTxt(siteUrl);
      res.set("Cache-Control", "no-store");
      res.type("text/plain; charset=utf-8").send(body);
    } catch (e: any) {
      res.status(500).type("text/plain").send(`# Error\n${e?.message || "failed to generate"}`);
    }
  });

  // AI-friendly product summary — clean JSON LLMs can consume reliably
  app.get("/api/ai/product-summary/:slug", aiCrawlerLimiter, async (req, res) => {
    try {
    const slug = String(req.params.slug || "");
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
         spiritualContext: `Listed for use in Hindu puja and Vedic rituals. Category: ${product.category}.`,
        ratings: product.salesCount ? { salesCount: product.salesCount } : null,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // Factual AI-discovery feed. It is deliberately assembled from allow-listed
  // public DTOs and never serializes a Pandit/storefront database row.
  app.get("/api/ai/pandit-feed", aiCrawlerLimiter, async (req, res) => {
    try {
      const siteUrl = (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      const profiles = await getPanditDiscoveryFeed(siteUrl);
      res.set("Cache-Control", "public, max-age=300, s-maxage=900");
      res.json({ generatedAt: new Date().toISOString(), profiles });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to generate Pandit feed" });
    }
  });
}
