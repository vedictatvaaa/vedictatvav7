import type { Express } from "express";
import { adminAuthMiddleware } from "./admin-auth";
import { storage } from "./storage";

interface ProductDiagnostic {
  id: number;
  name: string;
  slug: string | null;
  score: number;
  errors: string[];
  warnings: string[];
  ready: boolean;
}

function diagnose(p: any): ProductDiagnostic {
  const errors: string[] = [];
  const warnings: string[] = [];
  let score = 100;
  if (!p.name || p.name.length < 3) { errors.push("title is missing or too short"); score -= 15; }
  if (!p.description || p.description.length < 60) { errors.push("description is too short (need ≥60 chars)"); score -= 15; }
  if (!p.image) { errors.push("primary image is missing"); score -= 15; }
  if (!p.price || p.price <= 0) { errors.push("price must be > 0"); score -= 15; }
  if ((p.stock ?? 0) <= 0) { warnings.push("out of stock — feed will mark unavailable"); score -= 5; }
  if (!p.brand) { warnings.push("brand missing — defaults to 'Vedic Tatva'"); score -= 4; }
  if (!p.upcEan) { warnings.push("GTIN/UPC missing — set identifier_exists=no (allowed for handcrafted but limits ad coverage)"); score -= 5; }
  if (!p.category) { warnings.push("category missing — Google product category required"); score -= 6; }
  if (!p.gstPercent && p.gstPercent !== 0) { warnings.push("GST percent not set — tax info incomplete"); score -= 3; }
  if (!p.hsnCode) { warnings.push("HSN code missing — required for India tax compliance"); score -= 3; }
  if (!p.images || p.images.length === 0) { warnings.push("no additional images — listings with 3+ images perform better"); score -= 3; }
  if (!p.imageAlts || p.imageAlts.length === 0) { warnings.push("image alt texts missing — accessibility & SEO loss"); score -= 3; }
  if (!p.slug) { warnings.push("URL slug missing — using numeric ID hurts SEO"); score -= 4; }
  if (p.mrp && p.mrp < p.price) { warnings.push("MRP < price — discount badge will not display"); score -= 2; }
  return {
    id: p.id, name: p.name, slug: p.slug,
    score: Math.max(0, score), errors, warnings,
    ready: errors.length === 0,
  };
}

export function registerMerchantHealthRoutes(app: Express) {
  app.get("/api/admin/merchant/health", adminAuthMiddleware, async (_req, res) => {
    try {
      const all = await storage.getProducts();
      const diagnostics = all.map(diagnose);
      const ready = diagnostics.filter((d) => d.ready).length;
      const blocked = diagnostics.filter((d) => !d.ready).length;
      const avg = diagnostics.length ? Math.round(diagnostics.reduce((a, b) => a + b.score, 0) / diagnostics.length) : 0;
      const errorCounts = new Map<string, number>();
      const warningCounts = new Map<string, number>();
      for (const d of diagnostics) {
        for (const e of d.errors) errorCounts.set(e, (errorCounts.get(e) || 0) + 1);
        for (const w of d.warnings) warningCounts.set(w, (warningCounts.get(w) || 0) + 1);
      }
      res.json({
        total: diagnostics.length,
        ready,
        blocked,
        avgScore: avg,
        topErrors: Array.from(errorCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([issue, count]) => ({ issue, count })),
        topWarnings: Array.from(warningCounts.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([issue, count]) => ({ issue, count })),
        items: diagnostics.sort((a, b) => a.score - b.score).slice(0, 200),
        feedConfigured: !!(process.env.GOOGLE_MERCHANT_ID && process.env.GOOGLE_SERVICE_ACCOUNT_JSON),
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.get("/api/admin/merchant/diagnose/:id", adminAuthMiddleware, async (req, res) => {
    const product = await storage.getProduct(Number(req.params.id));
    if (!product) return res.status(404).json({ message: "Not found" });
    res.json(diagnose(product));
  });
}
