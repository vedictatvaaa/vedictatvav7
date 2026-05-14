import type { Express } from "express";
import { db } from "./db";
import { seoBacklinks } from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";

export function registerBacklinkRoutes(app: Express) {
  app.get("/api/admin/seo/backlinks", adminAuthMiddleware, async (_req, res) => {
    const rows = await db.select().from(seoBacklinks).orderBy(desc(seoBacklinks.discoveredAt));
    const total = rows.length;
    const active = rows.filter((r) => r.status === "active").length;
    const dofollow = rows.filter((r) => r.linkType === "dofollow").length;
    const avgDA = rows.length
      ? Math.round(rows.reduce((a, b) => a + (b.domainAuthority || 0), 0) / rows.length)
      : 0;
    const byTarget = new Map<string, number>();
    for (const r of rows) byTarget.set(r.targetPath, (byTarget.get(r.targetPath) || 0) + 1);
    res.json({
      total,
      active,
      dofollow,
      nofollow: total - dofollow,
      avgDomainAuthority: avgDA,
      topTargets: Array.from(byTarget.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count })),
      items: rows,
    });
  });

  app.post("/api/admin/seo/backlinks", adminAuthMiddleware, async (req, res) => {
    try {
      const { sourceUrl, targetPath, anchorText, domainAuthority, linkType, status, note } = req.body || {};
      if (!sourceUrl || !targetPath) return res.status(400).json({ message: "sourceUrl and targetPath are required" });
      try { new URL(sourceUrl); } catch { return res.status(400).json({ message: "sourceUrl must be a valid URL" }); }
      if (!targetPath.startsWith("/")) return res.status(400).json({ message: "targetPath must start with /" });
      const [row] = await db.insert(seoBacklinks).values({
        sourceUrl, targetPath, anchorText, domainAuthority,
        linkType: linkType || "dofollow",
        status: status || "active",
        note,
      }).returning();
      res.status(201).json(row);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.patch("/api/admin/seo/backlinks/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const patch: any = {};
    for (const k of ["sourceUrl", "targetPath", "anchorText", "domainAuthority", "linkType", "status", "note"]) {
      if (req.body[k] !== undefined) patch[k] = req.body[k];
    }
    const [row] = await db.update(seoBacklinks).set(patch).where(eq(seoBacklinks.id, id)).returning();
    if (!row) return res.status(404).json({ message: "Not found" });
    res.json(row);
  });

  app.delete("/api/admin/seo/backlinks/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    const result = await db.delete(seoBacklinks).where(eq(seoBacklinks.id, id)).returning();
    res.json({ success: result.length > 0 });
  });

  // Bulk import from CSV-style array
  app.post("/api/admin/seo/backlinks/bulk", adminAuthMiddleware, async (req, res) => {
    try {
      const items: any[] = Array.isArray(req.body?.items) ? req.body.items : [];
      if (items.length === 0) return res.status(400).json({ message: "items array required" });
      let created = 0, failed = 0;
      for (const it of items) {
        try {
          if (!it.sourceUrl || !it.targetPath) { failed++; continue; }
          await db.insert(seoBacklinks).values({
            sourceUrl: it.sourceUrl,
            targetPath: it.targetPath,
            anchorText: it.anchorText,
            domainAuthority: it.domainAuthority,
            linkType: it.linkType || "dofollow",
            status: it.status || "active",
            note: it.note,
          });
          created++;
        } catch { failed++; }
      }
      res.json({ created, failed });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });
}
