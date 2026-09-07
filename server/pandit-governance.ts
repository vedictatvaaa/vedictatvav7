import type { Express } from "express";
import { and, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import { adminAuditLogs, indianCities, indianStates, panditContactReveals, panditServices, panditStorefronts, pandits } from "@shared/schema";
import { effectivePanditGovernance } from "./pandit-public-eligibility";

const controls = z.object({
  directoryVisible: z.boolean().optional(), searchEligible: z.boolean().optional(),
  bookingEnabled: z.boolean().optional(),
}).refine(v => Object.keys(v).length > 0, "At least one control is required");
const write = z.object({
  action: z.enum(["set_controls", "verify", "revoke_verification", "suspend", "reactivate", "start_leave", "end_leave", "publish", "unpublish", "archive", "set_location", "set_indexing"]),
  reason: z.string().trim().max(500).optional(),
  directoryVisible: z.boolean().optional(), searchEligible: z.boolean().optional(), bookingEnabled: z.boolean().optional(),
  stateId: z.number().int().positive().optional(), cityId: z.number().int().positive().optional(),
  indexingMode: z.enum(["auto", "noindex"]).optional(),
});
const reasonActions = new Set(["suspend", "revoke_verification", "archive"]);
const bulkActions = new Set(["set_controls", "start_leave", "end_leave", "unpublish", "set_indexing"]);

export function governanceCompleteness(p: any, extras: { serviceCount: number; published: boolean }) {
  const checks: Record<string, boolean> = {
    slug: !!p.slug, photo: !!p.image, bio: !!p.bio, canonical_location: !!p.stateId && !!p.cityId && p.locationReviewStatus === "resolved",
    coordinates: p.latitude != null && p.longitude != null, services: extras.serviceCount > 0, storefront: extras.published,
    specialization: !!p.specialization, languages: !!p.languages, experience: Number(p.experience) > 0,
  };
  const missing = Object.entries(checks).filter(([, ok]) => !ok).map(([key]) => key);
  return { score: Math.round((Object.keys(checks).length - missing.length) / Object.keys(checks).length * 100), missing };
}

export function registerPanditGovernanceRoutes(app: Express, adminAuthMiddleware: any) {
  app.get("/api/admin/pandit-governance", adminAuthMiddleware, async (req: any, res) => {
    const page = Math.max(1, Number(req.query.page) || 1), pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const q = String(req.query.q || "").trim().slice(0, 120), status = String(req.query.status || ""), issue = String(req.query.issue || "");
    const where: any[] = [];
    if (q) where.push(or(ilike(pandits.name, `%${q}%`), ilike(pandits.city, `%${q}%`), ilike(pandits.slug, `%${q}%`)));
    if (status) where.push(eq(pandits.accountStatus, status));
    const rows = await db.select({ pandit: pandits, state: indianStates, city: indianCities, storefront: panditStorefronts })
      .from(pandits).leftJoin(indianStates, eq(pandits.stateId, indianStates.id)).leftJoin(indianCities, eq(pandits.cityId, indianCities.id))
      .leftJoin(panditStorefronts, eq(panditStorefronts.panditId, pandits.id)).where(where.length ? and(...where) : undefined);
    const ids = rows.map(r => r.pandit.id);
    const [serviceRows, revealRows, activeStates, activeCities] = await Promise.all([
      ids.length ? db.select({ panditId: panditServices.panditId, count: sql<number>`count(*)::int` }).from(panditServices).where(and(inArray(panditServices.panditId, ids), eq(panditServices.isActive, true))).groupBy(panditServices.panditId) : [],
      ids.length ? db.select({ panditId: panditContactReveals.panditId, count: sql<number>`count(*)::int` }).from(panditContactReveals).where(inArray(panditContactReveals.panditId, ids)).groupBy(panditContactReveals.panditId) : [],
      db.select().from(indianStates).where(eq(indianStates.isActive, true)), db.select().from(indianCities).where(eq(indianCities.isActive, true)),
    ]);
    const serviceCount = new Map(serviceRows.map(x => [x.panditId, Number(x.count)])), reveals = new Map(revealRows.map(x => [x.panditId, Number(x.count)]));
    const states = new Set(activeStates.map(x => x.id)), cities = new Map(activeCities.map(x => [x.id, x]));
    let items = rows.map(({ pandit: p, state, city, storefront }) => {
      const effective = effectivePanditGovernance(p, states, cities);
      return { id: p.id, name: p.name, slug: p.slug, image: p.image, specialization: p.specialization, languages: p.languages, experience: p.experience,
        verified: p.verified, onLeave: p.onLeave, accountStatus: p.accountStatus, location: { stateId: p.stateId, state: state?.name || null, cityId: p.cityId, city: city?.name || null, reviewStatus: p.locationReviewStatus },
        storefront: { published: !!storefront?.isPublished && (storefront.status || "published") === "published", status: storefront?.status || null },
        directoryVisible: p.directoryVisible, searchEligible: p.searchEligible, bookingEnabled: p.bookingEnabled, indexingMode: p.indexingMode,
        completeness: governanceCompleteness(p, { serviceCount: serviceCount.get(p.id) || 0, published: !!storefront?.isPublished }), effective,
        contact: { override: storefront?.contactAccessOverride || "use_global", revealCount: reveals.get(p.id) || 0 } };
    });
    if (issue) items = items.filter(x => x.completeness.missing.includes(issue) || x.effective.reasons.includes(issue));
    const total = items.length, start = (page - 1) * pageSize;
    res.json({ items: items.slice(start, start + pageSize), pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }, summary: { total, directoryVisible: items.filter(x => x.effective.directory).length, searchEligible: items.filter(x => x.effective.search).length, bookingEnabled: items.filter(x => x.effective.booking).length, incomplete: items.filter(x => x.completeness.missing.length).length } });
  });

  async function mutate(req: any, id: number, input: z.infer<typeof write>, batchId?: string) {
    if (reasonActions.has(input.action) && !input.reason) throw new Error("A reason is required for this action");
    const before = await db.select().from(pandits).where(eq(pandits.id, id)).limit(1);
    if (!before[0]) throw new Error("Pandit not found");
    const p = before[0]; let change: any = {};
    if (input.action === "set_controls") change = controls.parse(input);
    else if (input.action === "verify") change = { verified: true };
    else if (input.action === "revoke_verification") change = { verified: false };
    else if (input.action === "suspend") change = { accountStatus: "suspended", moderationReason: input.reason };
    else if (input.action === "reactivate") change = { accountStatus: "active", suspendedUntil: null };
    else if (input.action === "start_leave") change = { onLeave: true, leaveStartedAt: new Date() };
    else if (input.action === "end_leave") change = { onLeave: false, leaveStartedAt: null, leaveNote: null };
    else if (input.action === "archive") change = { accountStatus: "banned", moderationReason: input.reason };
    else if (input.action === "set_indexing") { if (!input.indexingMode) throw new Error("indexingMode is required"); change = { indexingMode: input.indexingMode }; }
    else if (input.action === "set_location") {
      if (!input.stateId || !input.cityId) throw new Error("stateId and cityId are required");
      const city = await db.select().from(indianCities).where(eq(indianCities.id, input.cityId)).limit(1);
      const state = await db.select().from(indianStates).where(eq(indianStates.id, input.stateId)).limit(1);
      if (!city[0] || !state[0] || city[0].stateId !== input.stateId) throw new Error("Invalid state/city pair");
      change = { stateId: input.stateId, cityId: input.cityId, state: state[0].name, city: city[0].name, locationReviewStatus: "resolved" };
    }
    await db.transaction(async tx => {
      if (input.action === "publish" || input.action === "unpublish") {
        await tx.update(panditStorefronts).set({ isPublished: input.action === "publish", status: input.action === "publish" ? "published" : "draft", updatedAt: new Date() }).where(eq(panditStorefronts.panditId, id));
      } else await tx.update(pandits).set(change).where(eq(pandits.id, id));
      await tx.insert(adminAuditLogs).values({ actor: `admin:${req.adminUserId}`, action: `pandit_governance.${input.action}`, target: `pandit:${id}`, ipAddress: req.ip, details: { reason: input.reason || null, batchId: batchId || null, before: { verified: p.verified, accountStatus: p.accountStatus, onLeave: p.onLeave, directoryVisible: p.directoryVisible, searchEligible: p.searchEligible, bookingEnabled: p.bookingEnabled, indexingMode: p.indexingMode }, after: change } });
    });
    return { id, ok: true };
  }
  app.patch("/api/admin/pandit-governance/:id", adminAuthMiddleware, async (req: any, res) => {
    const parsed = write.safeParse(req.body); if (!parsed.success || !Number.isInteger(Number(req.params.id))) return res.status(400).json({ message: "Invalid governance request" });
    try { res.json(await mutate(req, Number(req.params.id), parsed.data)); } catch (e: any) { res.status(e.message === "Pandit not found" ? 404 : 400).json({ message: e.message }); }
  });
  app.post("/api/admin/pandit-governance/bulk", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({ ids: z.array(z.number().int().positive()).min(1).max(100), action: z.string(), value: z.any().optional(), reason: z.string().trim().min(1).max(500) }).safeParse(req.body);
    if (!parsed.success || !bulkActions.has(parsed.data.action)) return res.status(400).json({ message: "Invalid bulk governance request" });
    const batchId = cryptoRandomBatch(); const input = { action: parsed.data.action, reason: parsed.data.reason, ...(typeof parsed.data.value === "object" && parsed.data.value ? parsed.data.value : {}) } as any;
    const results = await Promise.all(parsed.data.ids.map(async id => { try { return await mutate(req, id, input, batchId); } catch (e: any) { return { id, ok: false, message: e.message }; } }));
    res.json({ batchId, results });
  });
}
function cryptoRandomBatch() { return `pgov-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`; }