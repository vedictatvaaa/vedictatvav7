import type { Express } from "express";
import { db } from "./db";
import { products, seoPages } from "@shared/schema";
import { eq, sql } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";
import { storage } from "./storage";
import { generateSeoForPage } from "./seo-ai";
import { auditPage } from "./seo-auditor";
import { pingIndexNowAsync } from "./indexnow";
import { z } from "zod";

const productSeoPatchSchema = z.object({
  seoFocusKeyword: z.string().max(120).nullable().optional(),
  seoFaq: z.array(z.object({
    question: z.string().min(1).max(300),
    answer: z.string().min(1).max(2000),
  })).max(20).nullable().optional(),
  seoVideoUrl: z.string().url().max(500).nullable().or(z.literal("")).optional(),
  seoPage: z.record(z.any()).optional(),
}).strict();

function productPath(slug: string | null | undefined, id: number) {
  return `/product/${slug || id}`;
}

export function registerProductSeoRoutes(app: Express) {
  // GET — combined SEO record for a product
  app.get("/api/admin/products/:id/seo", adminAuthMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      const path = productPath(product.slug, product.id);
      const seoPage = await storage.getSeoPageByPath(path);
      res.json({
        product: {
          id: product.id,
          name: product.name,
          slug: product.slug,
          path,
          seoFocusKeyword: (product as any).seoFocusKeyword || null,
          seoFaq: (product as any).seoFaq || null,
          seoVideoUrl: (product as any).seoVideoUrl || null,
        },
        seoPage: seoPage || null,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // PATCH — upsert SEO settings for a product
  app.patch("/api/admin/products/:id/seo", adminAuthMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      const path = productPath(product.slug, product.id);

      const parsed = productSeoPatchSchema.safeParse(req.body || {});
      if (!parsed.success) {
        return res.status(400).json({ message: "Invalid SEO payload", errors: parsed.error.issues });
      }
      const { seoFocusKeyword, seoFaq, seoVideoUrl, seoPage } = parsed.data;

      // Update product extras
      const productPatch: any = {};
      if (seoFocusKeyword !== undefined) productPatch.seoFocusKeyword = seoFocusKeyword;
      if (seoFaq !== undefined) productPatch.seoFaq = seoFaq;
      if (seoVideoUrl !== undefined) productPatch.seoVideoUrl = seoVideoUrl;
      if (Object.keys(productPatch).length > 0) {
        await db.update(products).set(productPatch).where(eq(products.id, id));
      }

      // Upsert seoPages row keyed by path
      let seo = await storage.getSeoPageByPath(path);
      if (seoPage && typeof seoPage === "object") {
        const allowed = [
          "metaTitle", "metaDescription", "metaKeywords", "canonicalUrl",
          "ogTitle", "ogDescription", "ogImage", "ogType",
          "twitterTitle", "twitterDescription", "twitterImage",
          "robotsIndex", "robotsFollow", "priority", "changeFreq",
          "schemaMarkup", "h1Override", "breadcrumbLabel", "isActive",
        ];
        const data: any = { pagePath: path };
        for (const k of allowed) if (seoPage[k] !== undefined) data[k] = seoPage[k];
        if (seo) {
          seo = await storage.updateSeoPage(seo.id, data);
        } else if (Object.keys(data).length > 1) {
          seo = await storage.createSeoPage(data);
        }
      }

      // Notify search engines of update
      const baseUrl = (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      pingIndexNowAsync([`${baseUrl}${path}`]);

      const updated = await storage.getProduct(id);
      res.json({
        product: {
          id: updated!.id,
          slug: updated!.slug,
          path,
          seoFocusKeyword: (updated as any).seoFocusKeyword,
          seoFaq: (updated as any).seoFaq,
          seoVideoUrl: (updated as any).seoVideoUrl,
        },
        seoPage: seo || null,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // POST — AI generate SEO for a single product
  app.post("/api/admin/products/:id/seo/generate", adminAuthMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const product = await storage.getProduct(id);
      if (!product) return res.status(404).json({ message: "Product not found" });
      const path = productPath(product.slug, product.id);
      const focusKw = (product as any).seoFocusKeyword;
      const ai = await generateSeoForPage(path, {
        product,
        extra: focusKw ? `Primary focus keyword to rank for: "${focusKw}".` : undefined,
      });
      if (!ai) return res.status(503).json({ message: "AI generator unavailable. Set OPENAI_API_KEY." });

      const data: any = {
        pagePath: path,
        metaTitle: ai.metaTitle,
        metaDescription: ai.metaDescription,
        metaKeywords: ai.metaKeywords,
        ogTitle: ai.ogTitle,
        ogDescription: ai.ogDescription,
        twitterTitle: ai.twitterTitle,
        twitterDescription: ai.twitterDescription,
        ogImage: product.image,
      };

      let row = await storage.getSeoPageByPath(path);
      if (row) row = await storage.updateSeoPage(row.id, data);
      else row = await storage.createSeoPage(data);

      res.json({ product: { id, path }, seoPage: row, ai });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // GET — per-product SEO audit summary across catalog
  app.get("/api/admin/products/seo-audit", adminAuthMiddleware, async (_req, res) => {
    try {
      const all = await storage.getProducts();
      const seoRows = await db.select().from(seoPages);
      const byPath = new Map(seoRows.map((s) => [s.pagePath, s]));
      const items = all.map((p) => {
        const path = productPath(p.slug, p.id);
        const seo = byPath.get(path);
        const audit = auditPage(path, seo, { hasContent: true, hasImage: !!(seo?.ogImage || p.image) });
        return {
          id: p.id,
          name: p.name,
          slug: p.slug,
          path,
          score: audit.score,
          grade: audit.grade,
          hasMeta: !!seo,
          missing: audit.checks.filter((c: any) => c.severity !== "ok").map((c: any) => c.label),
          focusKeyword: (p as any).seoFocusKeyword || null,
          hasFaq: !!(p as any).seoFaq,
          hasVideo: !!(p as any).seoVideoUrl,
        };
      });
      const avg = items.length ? Math.round(items.reduce((a, b) => a + b.score, 0) / items.length) : 0;
      const noMeta = items.filter((i) => !i.hasMeta).length;
      res.json({
        averageScore: avg,
        totalProducts: items.length,
        productsWithoutMeta: noMeta,
        productsWithFaq: items.filter((i) => i.hasFaq).length,
        productsWithVideo: items.filter((i) => i.hasVideo).length,
        items: items.sort((a, b) => a.score - b.score),
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // POST — AI bulk generate for products missing meta
  app.post("/api/admin/products/seo-bulk-generate", adminAuthMiddleware, async (req, res) => {
    try {
      const limit = Math.min(Number(req.body?.limit || 20), 50);
      const overwrite = !!req.body?.overwrite;
      const all = await storage.getProducts();
      let processed = 0, ok = 0, failed = 0;
      const results: any[] = [];
      for (const p of all) {
        if (processed >= limit) break;
        const path = productPath(p.slug, p.id);
        const existing = await storage.getSeoPageByPath(path);
        if (existing && !overwrite && existing.metaTitle && existing.metaDescription) continue;
        processed++;
        try {
          const focusKw = (p as any).seoFocusKeyword;
          const ai = await generateSeoForPage(path, {
            product: p,
            extra: focusKw ? `Primary focus keyword to rank for: "${focusKw}".` : undefined,
          });
          if (!ai) { failed++; continue; }
          const data: any = {
            pagePath: path,
            metaTitle: ai.metaTitle,
            metaDescription: ai.metaDescription,
            metaKeywords: ai.metaKeywords,
            ogTitle: ai.ogTitle,
            ogDescription: ai.ogDescription,
            ogImage: p.image,
          };
          if (existing) await storage.updateSeoPage(existing.id, data);
          else await storage.createSeoPage(data);
          ok++;
          results.push({ id: p.id, path, status: "ok" });
        } catch (e: any) {
          failed++;
          results.push({ id: p.id, path, status: "fail", error: e?.message });
        }
      }
      res.json({ processed, ok, failed, results });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });
}
