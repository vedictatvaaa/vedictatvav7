import type { Express, Request, Response } from "express";
import { storage } from "./storage";
import { adminAuthMiddleware } from "./admin-auth";

const TIER1_CITIES = [
  "Mumbai", "Delhi", "Bangalore", "Hyderabad", "Chennai", "Kolkata", "Pune", "Ahmedabad",
  "Jaipur", "Lucknow", "Varanasi", "Ujjain", "Haridwar", "Rishikesh", "Tirupati",
  "Vrindavan", "Mathura", "Ayodhya", "Puri", "Dwarka", "Gaya", "Nashik",
  "Surat", "Indore", "Bhopal", "Patna", "Chandigarh", "Coimbatore", "Mysore",
];

const NRI_CITIES = [
  "USA", "UK", "Canada", "Australia", "Singapore", "UAE", "Dubai", "New Jersey", "London", "Toronto", "Sydney",
];

const CATEGORY_TEMPLATES: { slug: string; label: string; intent: string }[] = [
  { slug: "puja-samagri", label: "Puja Samagri", intent: "buy authentic puja samagri online" },
  { slug: "hawan-samagri", label: "Hawan Samagri", intent: "shop premium hawan samagri" },
  { slug: "agarbatti-dhoop", label: "Agarbatti & Dhoop", intent: "natural sandalwood agarbatti and dhoop" },
  { slug: "rudraksha", label: "Rudraksha Mala", intent: "certified Nepali rudraksha" },
  { slug: "spiritual-books", label: "Spiritual Books", intent: "Hindu scriptures and spiritual books" },
  { slug: "puja-thali", label: "Puja Thali Set", intent: "complete puja thali sets" },
  { slug: "yantra", label: "Yantras", intent: "energized yantras for prosperity" },
  { slug: "deity-idols", label: "Deity Idols", intent: "brass and marble deity idols" },
];

const SERVICE_TEMPLATES: { slug: string; label: string; intent: string }[] = [
  { slug: "online-puja", label: "Online Puja Booking", intent: "book online puja with verified pandits" },
  { slug: "pind-daan", label: "Pind Daan", intent: "book Pind Daan for ancestor moksha" },
  { slug: "satyanarayan-katha", label: "Satyanarayan Katha", intent: "book Satyanarayan katha at home" },
  { slug: "griha-pravesh", label: "Griha Pravesh Puja", intent: "book griha pravesh puja with experienced pandit" },
  { slug: "rudrabhishek", label: "Rudrabhishek Puja", intent: "book rudrabhishek with traditional vidhi" },
  { slug: "navagraha-shanti", label: "Navagraha Shanti", intent: "navagraha shanti puja for grah dosha" },
  { slug: "vivah-puja", label: "Vivah Puja", intent: "book vivah puja for marriage" },
];

function buildLandingMeta(category: string, city: string, intent: string, kind: "product" | "service") {
  const titleSuffix = kind === "product" ? "Online — Same Day Delivery" : "with Verified Pandits";
  const action = kind === "product" ? "Order online" : "Book online";
  return {
    metaTitle: `${category} in ${city} — ${titleSuffix} | Vedic Tatva`,
    metaDescription: `${action} ${intent} in ${city}. ${kind === "product" ? "Free delivery on orders above ₹999." : "Live video call with experienced pandits."} Trusted by ${10000 + Math.floor(Math.random() * 50000)}+ devotees across ${city}.`,
    metaKeywords: `${category.toLowerCase()} ${city.toLowerCase()}, ${intent.toLowerCase()}, ${category.toLowerCase()} delivery ${city.toLowerCase()}, vedic tatva ${city.toLowerCase()}, ${category.toLowerCase()} near me`,
    ogTitle: `${category} in ${city} | Vedic Tatva`,
    ogDescription: `${action} ${intent} in ${city}. Authentic, sacred, blessed.`,
    ogType: "website",
    h1Override: `${category} in ${city}`,
    breadcrumbLabel: `${category} ${city}`,
    priority: kind === "service" ? 0.7 : 0.6,
    changeFreq: "weekly" as const,
    robotsIndex: true,
    robotsFollow: true,
    isActive: true,
  };
}

interface GenerateOptions { dryRun?: boolean; includeNri?: boolean; productSlugs?: string[]; serviceSlugs?: string[] }

let generateInFlight = false;

async function generateProgrammaticPages(opts: GenerateOptions = {}) {
  const cities = opts.includeNri ? [...TIER1_CITIES, ...NRI_CITIES] : TIER1_CITIES;
  const products = (opts.productSlugs && opts.productSlugs.length)
    ? CATEGORY_TEMPLATES.filter((c) => opts.productSlugs!.includes(c.slug))
    : CATEGORY_TEMPLATES;
  const services = (opts.serviceSlugs && opts.serviceSlugs.length)
    ? SERVICE_TEMPLATES.filter((s) => opts.serviceSlugs!.includes(s.slug))
    : SERVICE_TEMPLATES;

  const created: string[] = [];
  const updated: string[] = [];
  const skipped: string[] = [];
  const planned: string[] = [];

  for (const cat of products) {
    for (const city of cities) {
      const citySlug = city.toLowerCase().replace(/\s+/g, "-");
      const path = `/buy/${cat.slug}-in-${citySlug}`;
      planned.push(path);
      if (opts.dryRun) continue;
      const meta = buildLandingMeta(cat.label, city, cat.intent, "product");
      const existing = await storage.getSeoPageByPath(path);
      if (existing) {
        await storage.updateSeoPage(existing.id, meta as any);
        updated.push(path);
      } else {
        try {
          await storage.createSeoPage({ pagePath: path, ...meta } as any);
          created.push(path);
        } catch (e: any) {
          // unique constraint race — fall back to update
          const again = await storage.getSeoPageByPath(path);
          if (again) { await storage.updateSeoPage(again.id, meta as any); updated.push(path); }
          else { skipped.push(path); }
        }
      }
    }
  }

  for (const svc of services) {
    for (const city of cities) {
      const citySlug = city.toLowerCase().replace(/\s+/g, "-");
      const path = `/book/${svc.slug}-in-${citySlug}`;
      planned.push(path);
      if (opts.dryRun) continue;
      const meta = buildLandingMeta(svc.label, city, svc.intent, "service");
      const existing = await storage.getSeoPageByPath(path);
      if (existing) {
        await storage.updateSeoPage(existing.id, meta as any);
        updated.push(path);
      } else {
        try {
          await storage.createSeoPage({ pagePath: path, ...meta } as any);
          created.push(path);
        } catch (e: any) {
          const again = await storage.getSeoPageByPath(path);
          if (again) { await storage.updateSeoPage(again.id, meta as any); updated.push(path); }
          else { skipped.push(path); }
        }
      }
    }
  }

  return { totalPlanned: planned.length, created: created.length, updated: updated.length, skipped: skipped.length, sample: planned.slice(0, 10) };
}

// Public endpoint: serve landing page metadata + content for the SPA
async function buildLandingContent(path: string) {
  const meta = await storage.getSeoPageByPath(path);
  if (!meta || !meta.isActive) return null;

  // Parse the path to extract category and city
  const productMatch = path.match(/^\/buy\/(.+?)-in-([a-z-]+)$/);
  const serviceMatch = path.match(/^\/book\/(.+?)-in-([a-z-]+)$/);
  const m = productMatch || serviceMatch;
  if (!m) return { meta, content: null };

  const [, slug, citySlug] = m;
  const city = citySlug.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const kind = productMatch ? "product" : "service";
  const template = (kind === "product" ? CATEGORY_TEMPLATES : SERVICE_TEMPLATES).find((t) => t.slug === slug);
  if (!template) return { meta, content: null };

  let products: any[] = [];
  if (kind === "product") {
    const all = await storage.getProducts();
    products = all
      .filter((p) => (p.stock ?? 0) > 0)
      .filter((p) => {
        const t = `${p.name} ${p.category} ${(p.tags || []).join(" ")}`.toLowerCase();
        return t.includes(slug.replace(/-/g, " ")) || t.includes(template.label.toLowerCase().split(" ")[0]);
      })
      .slice(0, 12);
    if (products.length < 4) products = all.filter((p) => (p.stock ?? 0) > 0).slice(0, 8);
  }

  return {
    meta,
    content: {
      kind,
      city,
      categoryLabel: template.label,
      categorySlug: template.slug,
      intent: template.intent,
      products,
      faqs: kind === "product" ? [
        { q: `Do you deliver ${template.label} in ${city}?`, a: `Yes — Vedic Tatva delivers ${template.label.toLowerCase()} across ${city} typically within 2-4 business days. Free shipping on orders above ₹999.` },
        { q: `Is the ${template.label} authentic and Vedic-grade?`, a: `Every product is sourced traditionally, hand-checked, blessed before despatch and rated 4.8/5 by our ${city} devotees.` },
        { q: `Can I return ${template.label} if not satisfied?`, a: "Yes — 7-day return on unopened items, with full refund or replacement at your choice." },
      ] : [
        { q: `Are pandits available in ${city} for ${template.label}?`, a: `Yes — our verified pandits perform ${template.label.toLowerCase()} live via secure HD video call from anywhere, with full vidhi explained in your preferred language. Same pandit for repeat bookings on request.` },
        { q: `What is included in the ${template.label}?`, a: `The booking includes the complete ${template.label.toLowerCase()} ritual, sankalp, all mantras, prasad blessing, and a recorded copy of the puja for your records.` },
        { q: `Do I need to arrange the samagri myself?`, a: `Optional — you can either prepare samagri at home (we'll send a checklist) or order our pre-packed ${city} delivery samagri kit at booking.` },
      ],
    },
  };
}

export function registerProgrammaticSeoRoutes(app: Express) {
  // Admin: dry-run preview
  app.get("/api/admin/seo/programmatic/preview", adminAuthMiddleware, async (req, res) => {
    try {
      const includeNri = req.query.nri === "1";
      const r = await generateProgrammaticPages({ dryRun: true, includeNri });
      res.json(r);
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // Admin: generate / refresh (single-flight guard — prevents two admins running concurrently)
  app.post("/api/admin/seo/programmatic/generate", adminAuthMiddleware, async (req, res) => {
    if (generateInFlight) return res.status(409).json({ error: "Generation already in progress, try again in a moment" });
    generateInFlight = true;
    try {
      const includeNri = req.body?.includeNri === true || req.query.nri === "1";
      const r = await generateProgrammaticPages({ includeNri });
      res.json({ ok: true, ...r });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    } finally {
      generateInFlight = false;
    }
  });

  // Public: get landing data (metadata + products + FAQs) for SPA route
  app.get("/api/local-landing", async (req: Request, res: Response) => {
    try {
      const path = String(req.query.path || "");
      if (!path.startsWith("/buy/") && !path.startsWith("/book/")) return res.status(400).json({ error: "Invalid path" });
      const data = await buildLandingContent(path);
      if (!data) return res.status(404).json({ error: "Not found" });
      res.set("Cache-Control", "public, max-age=600");
      res.json(data);
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  // List all programmatic paths for sitemap inclusion
  app.get("/api/local-landing/paths", async (_req, res) => {
    try {
      const paths: string[] = [];
      for (const cat of CATEGORY_TEMPLATES) for (const city of TIER1_CITIES) {
        paths.push(`/buy/${cat.slug}-in-${city.toLowerCase().replace(/\s+/g, "-")}`);
      }
      for (const svc of SERVICE_TEMPLATES) for (const city of TIER1_CITIES) {
        paths.push(`/book/${svc.slug}-in-${city.toLowerCase().replace(/\s+/g, "-")}`);
      }
      res.set("Cache-Control", "public, max-age=3600");
      res.json({ paths, total: paths.length });
    } catch (e: any) {
      res.status(500).json({ error: e?.message });
    }
  });

  console.log(`[seo-programmatic] registered: ${TIER1_CITIES.length} cities × ${CATEGORY_TEMPLATES.length + SERVICE_TEMPLATES.length} categories = ${TIER1_CITIES.length * (CATEGORY_TEMPLATES.length + SERVICE_TEMPLATES.length)} potential pages`);
}
