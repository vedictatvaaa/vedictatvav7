import type { Request, Response, NextFunction, Express } from "express";
import { db } from "./db";
import { seoRedirects } from "@shared/schema";
import { eq, desc, sql, and } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";

const cache = new Map<string, { to: string; statusCode: number; id: number }>();
let cacheLoaded = false;
let lastReload = 0;
const RELOAD_MS = 60_000;

async function loadCache() {
  const rows = await db.select().from(seoRedirects).where(eq(seoRedirects.isActive, true));
  cache.clear();
  for (const r of rows) cache.set(r.fromPath, { to: r.toPath, statusCode: r.statusCode, id: r.id });
  cacheLoaded = true;
  lastReload = Date.now();
}

export function invalidateRedirectCache() {
  cacheLoaded = false;
}

export function redirectMiddleware() {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Skip API and asset routes
    const p = req.path;
    if (p.startsWith("/api/") || p.startsWith("/assets/") || p.startsWith("/uploads/") ||
        p.startsWith("/attached_assets/") || p === "/sitemap.xml" || p === "/robots.txt" ||
        p === "/llms.txt" || p.endsWith(".txt") || p.endsWith(".xml")) {
      return next();
    }
    try {
      if (!cacheLoaded || Date.now() - lastReload > RELOAD_MS) await loadCache();
    } catch (e) {
      return next();
    }
    const hit = cache.get(p);
    if (!hit) return next();
    // Increment hits asynchronously
    db.update(seoRedirects).set({ hits: sql`${seoRedirects.hits} + 1` }).where(eq(seoRedirects.id, hit.id)).catch(() => {});
    return res.redirect(hit.statusCode, hit.to);
  };
}

export function registerRedirectAdminRoutes(app: Express) {
  app.get("/api/admin/seo/redirects", adminAuthMiddleware, async (_req, res) => {
    const rows = await db.select().from(seoRedirects).orderBy(desc(seoRedirects.updatedAt));
    res.json(rows);
  });

  app.post("/api/admin/seo/redirects", adminAuthMiddleware, async (req, res) => {
    try {
      const { fromPath, toPath, statusCode = 301, note, isActive = true } = req.body || {};
      if (!fromPath || !toPath) return res.status(400).json({ message: "fromPath and toPath are required" });
      if (![301, 302, 307, 308].includes(Number(statusCode))) return res.status(400).json({ message: "statusCode must be 301/302/307/308" });
      if (fromPath === toPath) return res.status(400).json({ message: "fromPath and toPath must differ" });
      if (!fromPath.startsWith("/") || !toPath.startsWith("/")) return res.status(400).json({ message: "Paths must start with /" });
      const [row] = await db.insert(seoRedirects).values({
        fromPath, toPath, statusCode: Number(statusCode), note, isActive,
      }).returning();
      invalidateRedirectCache();
      res.status(201).json(row);
    } catch (e: any) {
      if (e?.message?.includes("duplicate")) return res.status(409).json({ message: "fromPath already exists" });
      res.status(500).json({ message: e?.message || "Failed to create redirect" });
    }
  });

  app.patch("/api/admin/seo/redirects/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const patch: any = {};
      for (const k of ["fromPath", "toPath", "statusCode", "note", "isActive"]) {
        if (req.body[k] !== undefined) patch[k] = req.body[k];
      }
      if (patch.statusCode !== undefined) {
        const sc = Number(patch.statusCode);
        if (![301, 302, 307, 308].includes(sc)) return res.status(400).json({ message: "statusCode must be 301/302/307/308" });
        patch.statusCode = sc;
      }
      if (patch.fromPath !== undefined && (typeof patch.fromPath !== "string" || !patch.fromPath.startsWith("/")))
        return res.status(400).json({ message: "fromPath must start with /" });
      if (patch.toPath !== undefined && (typeof patch.toPath !== "string" || !patch.toPath.startsWith("/")))
        return res.status(400).json({ message: "toPath must start with /" });
      // Resolve final values to compare from!=to using existing row when only one side changes
      let finalFrom = patch.fromPath;
      let finalTo = patch.toPath;
      if (finalFrom === undefined || finalTo === undefined) {
        const [existing] = await db.select().from(seoRedirects).where(eq(seoRedirects.id, id));
        if (!existing) return res.status(404).json({ message: "Not found" });
        finalFrom = finalFrom ?? existing.fromPath;
        finalTo = finalTo ?? existing.toPath;
      }
      if (finalFrom === finalTo) return res.status(400).json({ message: "fromPath and toPath must differ" });
      patch.updatedAt = new Date();
      const [row] = await db.update(seoRedirects).set(patch).where(eq(seoRedirects.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      invalidateRedirectCache();
      res.json(row);
    } catch (e: any) {
      if (e?.message?.includes("duplicate")) return res.status(409).json({ message: "fromPath already exists" });
      res.status(500).json({ message: e?.message || "Failed to update redirect" });
    }
  });

  app.delete("/api/admin/seo/redirects/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const result = await db.delete(seoRedirects).where(eq(seoRedirects.id, id)).returning();
    invalidateRedirectCache();
    res.json({ success: result.length > 0 });
  });
}
