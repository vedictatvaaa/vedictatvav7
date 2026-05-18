import type { Express, Request, Response } from "express";
import { db } from "./db";
import { seoKeywordTargets } from "@shared/schema";
import { eq, desc, asc, sql } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";

export interface CuratedKeyword {
  keyword: string;
  targetPath: string;
  intent: "transactional" | "informational" | "branded" | "local" | "navigational";
  priority: number;
  cluster: string;
}

export const PUJA_PRIORITY_KEYWORDS: CuratedKeyword[] = [
  { keyword: "online pandit booking", targetPath: "/book-pandit-online", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "book pandit for puja", targetPath: "/book-pandit-online", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "verified pandit near me", targetPath: "/book-pandit-online", intent: "local", priority: 9, cluster: "puja" },
  { keyword: "online vedic puja", targetPath: "/online-puja-booking", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "satyanarayan puja booking", targetPath: "/online-puja-booking", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "griha pravesh puja booking", targetPath: "/online-puja-booking", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "rudrabhishek puja online", targetPath: "/online-puja-booking", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "mahamrityunjaya jaap online", targetPath: "/online-puja-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "navagraha shanti puja", targetPath: "/online-puja-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "kaal sarp dosh puja", targetPath: "/online-puja-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "vastu shanti puja online", targetPath: "/online-puja-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "annaprashan samskar puja", targetPath: "/online-puja-booking", intent: "transactional", priority: 8, cluster: "puja" },
  { keyword: "namkaran puja online", targetPath: "/online-puja-booking", intent: "transactional", priority: 8, cluster: "puja" },
  { keyword: "mundan ceremony pandit", targetPath: "/online-puja-booking", intent: "transactional", priority: 8, cluster: "puja" },
  { keyword: "wedding pandit booking", targetPath: "/book-pandit-online", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "pind daan in gaya online", targetPath: "/pind-daan-booking", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "kashi pind daan booking", targetPath: "/pind-daan-booking", intent: "transactional", priority: 10, cluster: "puja" },
  { keyword: "haridwar pind daan", targetPath: "/pind-daan-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "shradh puja booking", targetPath: "/pind-daan-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "tarpan online booking", targetPath: "/pind-daan-booking", intent: "transactional", priority: 8, cluster: "puja" },
  { keyword: "pitru paksha puja online", targetPath: "/pind-daan-booking", intent: "transactional", priority: 9, cluster: "puja" },
  { keyword: "diwali puja samagri kit", targetPath: "/category/puja-samagri", intent: "transactional", priority: 10, cluster: "samagri" },
  { keyword: "navratri puja samagri", targetPath: "/category/puja-samagri", intent: "transactional", priority: 9, cluster: "samagri" },
  { keyword: "ganesh chaturthi samagri", targetPath: "/category/puja-samagri", intent: "transactional", priority: 9, cluster: "samagri" },
  { keyword: "raksha bandhan puja kit", targetPath: "/category/puja-samagri", intent: "transactional", priority: 8, cluster: "samagri" },
  { keyword: "karwa chauth puja samagri", targetPath: "/category/puja-samagri", intent: "transactional", priority: 8, cluster: "samagri" },
  { keyword: "online pooja samagri", targetPath: "/category/puja-samagri", intent: "transactional", priority: 10, cluster: "samagri" },
  { keyword: "puja samagri online india", targetPath: "/category/puja-samagri", intent: "transactional", priority: 10, cluster: "samagri" },
  { keyword: "havan samagri buy online", targetPath: "/category/havan-samagri", intent: "transactional", priority: 9, cluster: "samagri" },
  { keyword: "panchamrut samagri", targetPath: "/category/puja-samagri", intent: "transactional", priority: 7, cluster: "samagri" },
  { keyword: "rudraksha online india", targetPath: "/category/wearables", intent: "transactional", priority: 10, cluster: "rudraksha" },
  { keyword: "1 mukhi rudraksha", targetPath: "/category/wearables", intent: "transactional", priority: 9, cluster: "rudraksha" },
  { keyword: "5 mukhi rudraksha price", targetPath: "/category/wearables", intent: "transactional", priority: 9, cluster: "rudraksha" },
  { keyword: "rudraksha mala 108 beads", targetPath: "/category/wearables", intent: "transactional", priority: 8, cluster: "rudraksha" },
  { keyword: "tulsi mala original", targetPath: "/category/wearables", intent: "transactional", priority: 8, cluster: "rudraksha" },
  { keyword: "navagraha mala original", targetPath: "/category/wearables", intent: "transactional", priority: 7, cluster: "rudraksha" },
  { keyword: "rudraksha for shani dosh", targetPath: "/category/wearables", intent: "transactional", priority: 7, cluster: "rudraksha" },
  { keyword: "brass diya online", targetPath: "/category/brass-copperware", intent: "transactional", priority: 8, cluster: "idols" },
  { keyword: "ganesh idol for home", targetPath: "/category/idols", intent: "transactional", priority: 9, cluster: "idols" },
  { keyword: "lakshmi idol brass", targetPath: "/category/idols", intent: "transactional", priority: 8, cluster: "idols" },
  { keyword: "shivling for puja", targetPath: "/category/idols", intent: "transactional", priority: 8, cluster: "idols" },
  { keyword: "online astrology consultation", targetPath: "/astrology", intent: "transactional", priority: 9, cluster: "astrology" },
  { keyword: "online kundli matching", targetPath: "/astrology", intent: "transactional", priority: 9, cluster: "astrology" },
  { keyword: "free kundli online", targetPath: "/ai-kundli", intent: "informational", priority: 9, cluster: "astrology" },
  { keyword: "ai kundli analysis", targetPath: "/ai-kundli", intent: "informational", priority: 8, cluster: "astrology" },
  { keyword: "manglik dosh puja", targetPath: "/astrology", intent: "transactional", priority: 8, cluster: "astrology" },
  { keyword: "panchang today", targetPath: "/panchang-calendar", intent: "informational", priority: 9, cluster: "calendar" },
  { keyword: "shubh muhurat finder", targetPath: "/muhurat-finder", intent: "informational", priority: 8, cluster: "calendar" },
  { keyword: "spiritual ecommerce india", targetPath: "/", intent: "branded", priority: 9, cluster: "brand" },
  { keyword: "vedic tatva", targetPath: "/", intent: "branded", priority: 10, cluster: "brand" },
  { keyword: "buy spiritual products online", targetPath: "/puja-samagri-online", intent: "transactional", priority: 9, cluster: "brand" },
];

export async function seedKeywordTargets(): Promise<{ inserted: number; total: number }> {
  let inserted = 0;
  for (const k of PUJA_PRIORITY_KEYWORDS) {
    try {
      await db.insert(seoKeywordTargets).values({
        keyword: k.keyword,
        targetPath: k.targetPath,
        intent: k.intent,
        priority: k.priority,
        cluster: k.cluster,
      }).onConflictDoNothing();
      inserted++;
    } catch {}
  }
  const totalRow = await db.select({ c: sql<number>`count(*)::int` }).from(seoKeywordTargets);
  return { inserted, total: totalRow[0]?.c || 0 };
}

export function registerKeywordTargetRoutes(app: Express) {
  app.get("/api/admin/seo/keyword-targets", adminAuthMiddleware, async (_req, res) => {
    const rows = await db.select().from(seoKeywordTargets)
      .orderBy(desc(seoKeywordTargets.priority), asc(seoKeywordTargets.cluster), asc(seoKeywordTargets.keyword));
    const byCluster = new Map<string, number>();
    for (const r of rows) byCluster.set(r.cluster, (byCluster.get(r.cluster) || 0) + 1);
    res.json({
      total: rows.length,
      clusters: Array.from(byCluster.entries()).map(([cluster, count]) => ({ cluster, count })),
      items: rows,
    });
  });

  app.post("/api/admin/seo/keyword-targets", adminAuthMiddleware, async (req, res) => {
    try {
      const { keyword, targetPath, intent, priority, cluster, language, notes } = req.body || {};
      if (!keyword || !targetPath) return res.status(400).json({ message: "keyword and targetPath required" });
      const [row] = await db.insert(seoKeywordTargets).values({
        keyword: String(keyword).trim().toLowerCase(),
        targetPath: String(targetPath).trim(),
        intent: intent || "transactional",
        priority: Math.min(Math.max(Number(priority) || 5, 1), 10),
        cluster: cluster || "general",
        language: language || "en",
        notes: notes || null,
      }).returning();
      res.json(row);
    } catch (e: any) {
      res.status(400).json({ message: e?.message || "Insert failed (keyword may already exist)" });
    }
  });

  app.patch("/api/admin/seo/keyword-targets/:id", adminAuthMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const allowed = ["targetPath", "intent", "priority", "cluster", "language", "status", "notes"];
      const data: any = {};
      for (const k of allowed) if (req.body[k] !== undefined) data[k] = req.body[k];
      if (data.priority !== undefined) data.priority = Math.min(Math.max(Number(data.priority), 1), 10);
      const [row] = await db.update(seoKeywordTargets).set(data).where(eq(seoKeywordTargets.id, id)).returning();
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json(row);
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Update failed" });
    }
  });

  app.delete("/api/admin/seo/keyword-targets/:id", adminAuthMiddleware, async (req, res) => {
    const id = Number(req.params.id);
    await db.delete(seoKeywordTargets).where(eq(seoKeywordTargets.id, id));
    res.json({ ok: true });
  });

  app.post("/api/admin/seo/keyword-targets/seed-puja", adminAuthMiddleware, async (_req, res) => {
    const result = await seedKeywordTargets();
    res.json(result);
  });
}
