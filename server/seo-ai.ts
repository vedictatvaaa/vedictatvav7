import OpenAI from "openai";
import { storage } from "./storage";
import type { Product } from "@shared/schema";

export interface AiSeoResult {
  metaTitle: string;
  metaDescription: string;
  metaKeywords: string;
  ogTitle: string;
  ogDescription: string;
  twitterTitle: string;
  twitterDescription: string;
  schemaMarkup?: string;
}

const PAGE_HINTS: Record<string, { topic: string; intent: string; primaryKw: string[] }> = {
  "/": {
    topic: "Vedic Tatva home — premium spiritual ecommerce in India",
    intent: "Brand discovery + transactional",
    primaryKw: ["spiritual products", "puja samagri online", "rudraksha", "online pandit booking"],
  },
  "/puja-samagri-online": {
    topic: "Full shop catalog of spiritual products",
    intent: "Transactional",
    primaryKw: ["buy spiritual products online", "puja samagri", "rudraksha", "idols brass", "yantra"],
  },
  "/spiritual-essentials": {
    topic: "Curated spiritual essentials catalog",
    intent: "Transactional",
    primaryKw: ["spiritual essentials", "puja kit online", "daily puja items"],
  },
  "/book-pandit-online": {
    topic: "Verified pandit booking directory",
    intent: "Service booking",
    primaryKw: ["book pandit online", "verified pandit", "puja pandit near me"],
  },
  "/online-puja-booking": {
    topic: "Online and at-home puja booking",
    intent: "Service booking",
    primaryKw: ["online puja booking", "book puja at home", "vedic puja"],
  },
  "/astrology": {
    topic: "AI + expert astrology consultations",
    intent: "Service booking",
    primaryKw: ["online astrology consultation", "astrologer near me", "kundli matching"],
  },
  "/ai-kundli": { topic: "Free AI Kundli generator", intent: "Tool", primaryKw: ["free kundli online", "ai kundli", "janam kundli"] },
  "/ai-baby-names": { topic: "AI-powered baby name generator", intent: "Tool", primaryKw: ["baby name by date of birth", "rashi baby names"] },
  "/ai-palm-reading": { topic: "AI palm reading", intent: "Tool", primaryKw: ["ai palmistry", "palm reading online"] },
  "/pind-daan-booking": {
    topic: "Pind Daan booking — Kashi, Gaya, Haridwar",
    intent: "Service booking",
    primaryKw: ["pind daan online", "gaya pind daan booking", "kashi pind daan"],
  },
  "/temple-tourism": { topic: "Temple tourism packages", intent: "Travel booking", primaryKw: ["temple tour packages", "char dham yatra"] },
  "/franchise": { topic: "Franchise opportunity with Vedic Tatva", intent: "Lead gen", primaryKw: ["spiritual franchise india", "puja shop franchise"] },
  "/careers": { topic: "Careers at Vedic Tatva", intent: "Recruiting", primaryKw: ["vedic tatva careers", "spiritual startup jobs"] },
  "/about": { topic: "About Vedic Tatva — heritage, wellness, purity", intent: "Brand", primaryKw: ["about vedic tatva"] },
  "/contact": { topic: "Contact Vedic Tatva customer support", intent: "Support", primaryKw: ["vedic tatva contact"] },
  "/zodiac-rashifal": { topic: "Daily zodiac rashifal predictions", intent: "Content", primaryKw: ["aaj ka rashifal", "daily horoscope"] },
  "/panchang-calendar": { topic: "Daily panchang & festival calendar", intent: "Content", primaryKw: ["aaj ka panchang", "hindu calendar"] },
  "/muhurat-finder": { topic: "Auspicious muhurat finder", intent: "Tool", primaryKw: ["shubh muhurat", "auspicious time today"] },
  "/scripture-search": { topic: "Search Vedic scriptures with AI", intent: "Tool", primaryKw: ["bhagavad gita search", "vedic scriptures online"] },
  "/kathas": { topic: "Hindu kathas and stories collection", intent: "Content", primaryKw: ["hindu katha", "satya narayan katha"] },
  "/donations": { topic: "Donate to temples and noble causes", intent: "Donation", primaryKw: ["temple donation online", "annadanam donation"] },
  "/membership": { topic: "Vedic Tatva membership benefits", intent: "Subscription", primaryKw: ["spiritual membership india"] },
  "/matrimony": { topic: "Spiritual matrimony for like-minded souls", intent: "Service", primaryKw: ["spiritual matrimony india"] },
  "/become-pandit": { topic: "Register as a pandit on Vedic Tatva", intent: "Recruiting", primaryKw: ["become pandit online", "register as pandit"] },
  "/become-astrologer": { topic: "Register as an astrologer on Vedic Tatva", intent: "Recruiting", primaryKw: ["register as astrologer", "online astrologer signup"] },
};

function getOpenAI(): OpenAI | null {
  try {
    return new OpenAI();
  } catch {
    return null;
  }
}

function buildPrompt(
  path: string,
  context?: { product?: Product; extra?: string },
): string {
  const hint = PAGE_HINTS[path];
  const productCtx = context?.product
    ? `\n\nPRODUCT CONTEXT:\nName: ${context.product.name}\nCategory: ${context.product.category}\nPrice: ₹${context.product.price}\nBrand: ${context.product.brand || "Vedic Tatva"}\nDescription: ${(context.product.description || "").slice(0, 500).replace(/<[^>]*>/g, " ")}`
    : "";
  const hintText = hint
    ? `Topic: ${hint.topic}\nUser intent: ${hint.intent}\nPriority keywords: ${hint.primaryKw.join(", ")}`
    : `Page path: ${path}`;

  return `You are an expert SEO copywriter for "Vedic Tatva", a premium spiritual ecommerce brand in India (puja samagri, rudraksha, idols, pandit booking, astrology, pind daan).

Generate JSON SEO meta for this page.

PAGE:
${hintText}${productCtx}${context?.extra ? `\n\nADDITIONAL CONTEXT:\n${context.extra}` : ""}

CONSTRAINTS:
- metaTitle: 50–60 chars, includes brand or primary keyword, compelling.
- metaDescription: 140–160 chars, action-oriented, includes a primary keyword + USP (authentic / verified / shipped pan-India).
- metaKeywords: 6–10 comma-separated targeted phrases (mix of head + long-tail, India market).
- ogTitle / ogDescription: shareable, slightly more emotive than meta.
- twitterTitle / twitterDescription: same vibe but ≤ 70 / ≤ 200 chars.
- Tone: respectful, authentic, modern.
- Do NOT use emojis.
- Do NOT mention competitors.

Return STRICT JSON with keys: metaTitle, metaDescription, metaKeywords, ogTitle, ogDescription, twitterTitle, twitterDescription.`;
}

export async function generateSeoForPage(
  path: string,
  context?: { product?: Product; extra?: string },
): Promise<AiSeoResult | null> {
  const openai = getOpenAI();
  if (!openai) return null;

  const prompt = buildPrompt(path, context);
  try {
    const resp = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: "You output only valid JSON. No prose." },
        { role: "user", content: prompt },
      ],
      response_format: { type: "json_object" },
      temperature: 0.7,
      max_tokens: 700,
    });
    const text = resp.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(text);
    return {
      metaTitle: String(parsed.metaTitle || "").slice(0, 70),
      metaDescription: String(parsed.metaDescription || "").slice(0, 175),
      metaKeywords: String(parsed.metaKeywords || ""),
      ogTitle: String(parsed.ogTitle || parsed.metaTitle || ""),
      ogDescription: String(parsed.ogDescription || parsed.metaDescription || ""),
      twitterTitle: String(parsed.twitterTitle || parsed.metaTitle || "").slice(0, 70),
      twitterDescription: String(parsed.twitterDescription || parsed.metaDescription || "").slice(0, 200),
    };
  } catch (err) {
    console.error("[seo-ai] generation failed for", path, err);
    return null;
  }
}

export interface BulkResult {
  attempted: number;
  generated: number;
  upserted: number;
  failed: number;
  details: { path: string; status: "created" | "updated" | "failed" | "skipped"; reason?: string }[];
}

export async function autoFillMissingSeo(opts: {
  limit?: number;
  includeProducts?: boolean;
  overwrite?: boolean;
} = {}): Promise<BulkResult> {
  const { limit = 25, includeProducts = true, overwrite = false } = opts;
  const result: BulkResult = { attempted: 0, generated: 0, upserted: 0, failed: 0, details: [] };

  const seoPagesList = await storage.getSeoPages();
  const seoMap = new Map(seoPagesList.map((s) => [s.pagePath, s]));

  const paths: { path: string; product?: Product }[] = [];
  for (const path of Object.keys(PAGE_HINTS)) {
    const existing = seoMap.get(path);
    if (!overwrite && existing?.metaTitle && existing?.metaDescription) continue;
    paths.push({ path });
  }

  if (includeProducts) {
    const products = await storage.getProducts();
    for (const p of products) {
      const path = `/product/${p.slug || p.id}`;
      const existing = seoMap.get(path);
      if (!overwrite && existing?.metaTitle && existing?.metaDescription) continue;
      paths.push({ path, product: p });
    }
  }

  const slice = paths.slice(0, limit);
  result.attempted = slice.length;

  for (const item of slice) {
    const ai = await generateSeoForPage(item.path, item.product ? { product: item.product } : undefined);
    if (!ai) {
      result.failed += 1;
      result.details.push({ path: item.path, status: "failed", reason: "AI generation failed" });
      continue;
    }
    result.generated += 1;
    const existing = seoMap.get(item.path);
    try {
      if (existing) {
        await storage.updateSeoPage(existing.id, {
          metaTitle: ai.metaTitle,
          metaDescription: ai.metaDescription,
          metaKeywords: ai.metaKeywords,
          ogTitle: ai.ogTitle,
          ogDescription: ai.ogDescription,
          twitterTitle: ai.twitterTitle,
          twitterDescription: ai.twitterDescription,
          isActive: true,
        });
        result.upserted += 1;
        result.details.push({ path: item.path, status: "updated" });
      } else {
        await storage.createSeoPage({
          pagePath: item.path,
          metaTitle: ai.metaTitle,
          metaDescription: ai.metaDescription,
          metaKeywords: ai.metaKeywords,
          ogTitle: ai.ogTitle,
          ogDescription: ai.ogDescription,
          twitterTitle: ai.twitterTitle,
          twitterDescription: ai.twitterDescription,
          robotsIndex: true,
          robotsFollow: true,
          priority: item.product ? 0.8 : 0.6,
          changeFreq: item.product ? "weekly" : "monthly",
          isActive: true,
        } as any);
        result.upserted += 1;
        result.details.push({ path: item.path, status: "created" });
      }
    } catch (err: any) {
      result.failed += 1;
      result.details.push({ path: item.path, status: "failed", reason: err?.message || "DB upsert failed" });
    }
  }

  return result;
}

export const KNOWN_SEO_PATHS = Object.keys(PAGE_HINTS);
