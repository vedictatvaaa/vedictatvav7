import type { Express } from "express";
import { and, desc, eq, ilike, inArray, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  adminAuditLogs, indianCities, indianStates, masterServices, panditContactReveals,
   panditFunnelEvents, panditMembershipPurchases, panditReviews, panditServices, panditStorefronts, pandits,
} from "@shared/schema";
import { effectivePanditGovernance } from "./pandit-public-eligibility";
import { evaluatePanditBookingEligibility } from "./pandit-booking-eligibility";

const actionSchema = z.enum(["publish", "unpublish", "directory_show", "directory_hide", "search_enable", "search_disable", "booking_enable", "booking_disable", "verify",
  "revoke_verification", "archive", "restore", "suspend", "reactivate", "start_leave", "end_leave",
  "set_location", "set_indexing", "set_contact_override"]);
const write = z.object({
  action: actionSchema, reason: z.string().trim().max(500).optional(), confirmed: z.literal(true).optional(),
  stateId: z.number().int().positive().optional(), cityId: z.number().int().positive().optional(),
  indexingMode: z.enum(["auto", "noindex"]).optional(),
  contactAccessOverride: z.enum(["use_global", "always_open", "login_required", "never_display"]).optional(),
});
const sensitiveActions = new Set<z.infer<typeof actionSchema>>(["publish", "unpublish", "directory_show", "directory_hide", "search_enable", "search_disable", "booking_enable",
  "booking_disable", "verify", "revoke_verification", "archive", "restore", "suspend", "reactivate"]);
const bulkActions = new Set(["publish", "unpublish", "directory_show", "directory_hide", "search_enable", "search_disable", "booking_enable", "booking_disable", "verify",
  "revoke_verification", "archive", "restore"]);

type ServiceFact = { id: number; name: string; slug: string; mode: string; price: number; serviceAreas: string[] };
export function governanceCompleteness(p: any, extras: { services: ServiceFact[]; membership: boolean; hasContact: boolean; canonicalLocation: boolean; bookingReady: boolean }) {
  const languages = typeof p.languages === "string" ? p.languages.trim() : "";
  const checks: Record<string, boolean> = {
    name: !!p.name?.trim(), image: !!p.image, bio: !!p.bio?.trim(), canonical_location: extras.canonicalLocation,
    languages: !!languages, experience: Number(p.experience) > 0, active_service_assignment: extras.services.length > 0,
    configured_service_area: extras.services.some(s => ["online", "virtual", "hybrid", "both"].includes(s.mode) || s.serviceAreas.length > 0),
    contact_availability: extras.hasContact, verification: p.verified === true, membership: extras.membership,
    booking_readiness: extras.bookingReady,
  };
  const missing = Object.entries(checks).filter(([, passed]) => !passed).map(([key]) => key);
  return { score: Math.round((Object.keys(checks).length - missing.length) * 100 / Object.keys(checks).length), missing, checks };
}

export function bookingDiagnostics(p: any, input: { services: ServiceFact[] }) {
  return evaluatePanditBookingEligibility(p, {
    services: input.services,
    pujaSupported: input.services.length > 0,
  });
}

/** Audit payloads never retain credentials, contact values, or customer identity. */
export function safeGovernanceAuditState(p: any) {
  return { verified: !!p.verified, accountStatus: p.accountStatus, archived: !!p.archived, onLeave: !!p.onLeave,
    directoryVisible: !!p.directoryVisible, searchEligible: !!p.searchEligible, bookingEnabled: !!p.bookingEnabled,
    indexingMode: p.indexingMode || "auto", stateId: p.stateId || null, cityId: p.cityId || null,
    storefrontPublished: !!p.storefrontPublished };
}

export function safeGovernanceAuditDetails(details: unknown) {
  const value = details && typeof details === "object" ? details as Record<string, unknown> : {};
  const reason = typeof value.reason === "string" ? value.reason.slice(0, 500) : null;
  const batchId = typeof value.batchId === "string" ? value.batchId.slice(0, 100) : null;
  const before = value.before && typeof value.before === "object" ? safeGovernanceAuditState(value.before) : undefined;
  const after = value.after && typeof value.after === "object" ? safeGovernanceAuditState(value.after) : undefined;
  return { reason, batchId, ...(before ? { before } : {}), ...(after ? { after } : {}) };
}

export function registerPanditGovernanceRoutes(app: Express, adminAuthMiddleware: any) {
  app.get("/api/admin/pandit-governance", adminAuthMiddleware, async (req: any, res) => {
    const page = Math.max(1, Number(req.query.page) || 1), pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize) || 25));
    const q = String(req.query.q || "").trim().slice(0, 120), status = String(req.query.status || "");
    const issue = String(req.query.issue || "");
    const where: any[] = [];
    if (q) where.push(or(ilike(pandits.name, `%${q}%`), ilike(pandits.city, `%${q}%`), ilike(pandits.slug, `%${q}%`)));
    if (status === "verified") where.push(eq(pandits.verified, true));
    if (status === "unverified") where.push(eq(pandits.verified, false));
    if (status === "suspended") where.push(eq(pandits.accountStatus, "suspended"));
    if (status === "archived") where.push(eq(pandits.archived, true));
    if (status === "published") where.push(sql`exists (select 1 from pandit_storefronts sf where sf.pandit_id = ${pandits.id} and sf.is_published = true and sf.status = 'published')`);
    if (status === "unpublished") where.push(sql`not exists (select 1 from pandit_storefronts sf where sf.pandit_id = ${pandits.id} and sf.is_published = true and sf.status = 'published')`);
    const validIssues = new Set(["", "incomplete", "location", "contact", "discovery"]);
    if (!validIssues.has(issue)) return res.status(400).json({ message: "Invalid governance issue filter" });
    const needsDiagnosticFilter = ["complete", "incomplete", "booking_eligible", "booking_ineligible"].includes(status) || !!issue;
    const globalRows = await db.select({ count: sql<number>`count(*)::int` }).from(pandits);
    const totalRows = await db.select({ count: sql<number>`count(*)::int` }).from(pandits).where(where.length ? and(...where) : undefined);
    const baseRows = db.select({ pandit: pandits, state: indianStates, city: indianCities, storefront: panditStorefronts })
      .from(pandits).leftJoin(indianStates, eq(pandits.stateId, indianStates.id)).leftJoin(indianCities, eq(pandits.cityId, indianCities.id))
      .leftJoin(panditStorefronts, eq(panditStorefronts.panditId, pandits.id)).where(where.length ? and(...where) : undefined).orderBy(pandits.id);
    const rows = needsDiagnosticFilter
      ? await baseRows
      : await baseRows.limit(pageSize).offset((page - 1) * pageSize);
    const ids = rows.map(r => r.pandit.id);
    const [serviceRows, reveals, reviews, memberships, audits, states, cities, funnel] = await Promise.all([
      ids.length ? db.select({ service: panditServices, master: masterServices }).from(panditServices).innerJoin(masterServices, and(eq(panditServices.masterServiceId, masterServices.id), eq(masterServices.isActive, true))).where(and(inArray(panditServices.panditId, ids), eq(panditServices.isActive, true))) : [],
      ids.length ? db.select({ panditId: panditContactReveals.panditId, count: sql<number>`count(*)::int` }).from(panditContactReveals).where(inArray(panditContactReveals.panditId, ids)).groupBy(panditContactReveals.panditId) : [],
      ids.length ? db.select().from(panditReviews).where(inArray(panditReviews.panditId, ids)).orderBy(desc(panditReviews.createdAt)) : [],
      ids.length ? db.select({ panditId: panditMembershipPurchases.panditId }).from(panditMembershipPurchases).where(and(inArray(panditMembershipPurchases.panditId, ids), eq(panditMembershipPurchases.paymentStatus, "paid"))) : [],
      ids.length ? db.select().from(adminAuditLogs).where(inArray(adminAuditLogs.target, ids.map(id => `pandit:${id}`))).orderBy(desc(adminAuditLogs.createdAt)).limit(ids.length * 10) : [],
      db.select().from(indianStates).where(eq(indianStates.isActive, true)), db.select().from(indianCities).where(eq(indianCities.isActive, true)),
      ids.length ? db.select({ panditId: panditFunnelEvents.panditId, event: panditFunnelEvents.event, count: sql<number>`count(*)::int` }).from(panditFunnelEvents).where(inArray(panditFunnelEvents.panditId, ids)).groupBy(panditFunnelEvents.panditId, panditFunnelEvents.event) : [],
    ]);
    const servicesBy = new Map<number, ServiceFact[]>(), revealBy = new Map(reveals.map(x => [x.panditId, Number(x.count)])), memberBy = new Set(memberships.map(x => x.panditId));
    for (const row of serviceRows) { const v = servicesBy.get(row.service.panditId) || []; v.push({ id: row.service.id, name: row.master.name, slug: row.master.slug, mode: row.service.mode, price: row.service.price, serviceAreas: row.service.serviceAreas || [] }); servicesBy.set(row.service.panditId, v); }
    const reviewsBy = new Map<number, any[]>(); for (const row of reviews) reviewsBy.set(row.panditId, [...(reviewsBy.get(row.panditId) || []), row]);
    const funnelBy = new Map<number, Record<string, number>>(); for (const row of funnel) { const values = funnelBy.get(row.panditId!) || {}; values[row.event] = Number(row.count); funnelBy.set(row.panditId!, values); }
    const auditBy = new Map<number, any[]>(); for (const a of audits) { const id = Number(String(a.target).replace("pandit:", "")); const values = auditBy.get(id) || []; if (values.length < 10) values.push({ action: a.action, createdAt: a.createdAt, details: safeGovernanceAuditDetails(a.details) }); auditBy.set(id, values); }
    const activeStates = new Set(states.map(s => s.id)), activeCities = new Map(cities.map(c => [c.id, c]));
    let items = rows.map(({ pandit: p, state, city, storefront }) => {
      const services = servicesBy.get(p.id) || [], published = !!storefront?.isPublished && storefront.status === "published";
      const canonicalLocation = p.locationReviewStatus === "resolved" && !!p.stateId && activeStates.has(p.stateId) && activeCities.get(p.cityId || -1)?.stateId === p.stateId;
      const diagnostics = bookingDiagnostics(p, { services });
      const reviewRows = reviewsBy.get(p.id) || [], reviewCount = reviewRows.length, averageRating = reviewCount ? Math.round(reviewRows.reduce((n, r) => n + Number(r.rating), 0) * 10 / reviewCount) / 10 : null;
      return { id: p.id, name: p.name, slug: p.slug, image: p.image, bio: p.bio, languages: p.languages, experience: p.experience, specialization: p.specialization,
        accountStatus: p.accountStatus, archived: p.archived, onLeave: p.onLeave, verified: p.verified, availability: p.availability,
        location: { stateId: p.stateId, cityId: p.cityId, state: state?.name || null, city: city?.name || null, canonical: canonicalLocation },
        publication: { published, directoryVisible: p.directoryVisible, searchEligible: p.searchEligible }, bookingEnabled: p.bookingEnabled,
        services, serviceCounts: { active: services.length, configuredAreas: services.filter(s => s.serviceAreas.length).length },
        membership: { status: memberBy.has(p.id) ? "active" : "none", tier: p.tier, membershipNo: p.membershipNo, registrationNo: p.registrationNo },
        contact: { override: storefront?.contactAccessOverride || "use_global", hasPhone: !!p.phone, hasWhatsapp: !!storefront?.whatsappNumber, revealCount: revealBy.get(p.id) || 0 },
        reviews: { count: reviewCount, averageRating, latest: reviewRows.slice(0, 3).map(r => ({ rating: r.rating, comment: r.comment, createdAt: r.createdAt })) },
         funnel: funnelBy.get(p.id) || {},
        seo: { indexingMode: p.indexingMode, effectiveIndexable: effectivePanditGovernance(p, activeStates, activeCities).indexable, canonicalUrl: `/pandit/${encodeURIComponent(p.slug || "")}` },
        completeness: governanceCompleteness(p, { services, membership: memberBy.has(p.id), hasContact: !!p.phone || !!storefront?.whatsappNumber, canonicalLocation, bookingReady: diagnostics.result.passed }),
        bookingDiagnostics: diagnostics, auditHistory: auditBy.get(p.id) || [] };
    });
    if (status === "complete") items = items.filter(x => x.completeness.missing.length === 0);
    if (status === "incomplete") items = items.filter(x => x.completeness.missing.length > 0);
    if (status === "booking_eligible") items = items.filter(x => x.bookingDiagnostics.result.passed);
    if (status === "booking_ineligible") items = items.filter(x => !x.bookingDiagnostics.result.passed);
    if (issue === "incomplete") items = items.filter(x => x.completeness.missing.length > 0);
    if (issue === "location") items = items.filter(x => !x.location.canonical);
    if (issue === "contact") items = items.filter(x => !x.contact.hasPhone && !x.contact.hasWhatsapp);
    if (issue === "discovery") items = items.filter(x => !x.publication.published || !x.publication.directoryVisible || !x.verified || x.archived);
    const total = needsDiagnosticFilter ? items.length : Number(totalRows[0]?.count || 0);
    const pagedItems = needsDiagnosticFilter ? items.slice((page - 1) * pageSize, page * pageSize) : items;
    res.json({ items: pagedItems, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) }, summary: { scope: "global", total: Number(globalRows[0]?.count || 0), filteredTotal: total } });
  });

  async function mutate(req: any, id: number, input: z.infer<typeof write>, batchId?: string) {
    if (sensitiveActions.has(input.action) && (!input.reason || !input.confirmed)) throw new Error("Reason and confirmation are required for this sensitive action");
    const p = (await db.select().from(pandits).where(eq(pandits.id, id)).limit(1))[0]; if (!p) throw new Error("Pandit not found");
    let change: any = {};
    if (input.action === "verify") change = { verified: true }; else if (input.action === "revoke_verification") change = { verified: false };
    else if (input.action === "directory_show") change = { directoryVisible: true }; else if (input.action === "directory_hide") change = { directoryVisible: false };
    else if (input.action === "search_enable") change = { searchEligible: true }; else if (input.action === "search_disable") change = { searchEligible: false };
    else if (input.action === "booking_enable") change = { bookingEnabled: true }; else if (input.action === "booking_disable") change = { bookingEnabled: false };
    else if (input.action === "archive") change = { archived: true }; else if (input.action === "restore") change = { archived: false };
    else if (input.action === "suspend") change = { accountStatus: "suspended", moderationReason: input.reason }; else if (input.action === "reactivate") change = { accountStatus: "active", suspendedUntil: null };
    else if (input.action === "start_leave") change = { onLeave: true, leaveStartedAt: new Date() }; else if (input.action === "end_leave") change = { onLeave: false, leaveStartedAt: null, leaveNote: null };
    else if (input.action === "set_indexing") { if (!input.indexingMode) throw new Error("indexingMode is required"); change = { indexingMode: input.indexingMode }; }
    else if (input.action === "set_location") {
      if (!input.stateId || !input.cityId) throw new Error("stateId and cityId are required");
      const [state, city] = await Promise.all([db.select().from(indianStates).where(and(eq(indianStates.id, input.stateId), eq(indianStates.isActive, true))).limit(1), db.select().from(indianCities).where(and(eq(indianCities.id, input.cityId), eq(indianCities.isActive, true))).limit(1)]);
      if (!state[0] || !city[0] || city[0].stateId !== input.stateId) throw new Error("State and city must be active and matching");
      change = { stateId: input.stateId, cityId: input.cityId, state: state[0].name, city: city[0].name, locationReviewStatus: "resolved" };
    }
    await db.transaction(async tx => {
      if (input.action === "publish" || input.action === "unpublish") await tx.insert(panditStorefronts).values({ panditId: id, isPublished: input.action === "publish", status: input.action === "publish" ? "published" : "draft" }).onConflictDoUpdate({ target: panditStorefronts.panditId, set: { isPublished: input.action === "publish", status: input.action === "publish" ? "published" : "draft", updatedAt: new Date() } });
      else if (input.action === "set_contact_override") { if (!input.contactAccessOverride) throw new Error("contactAccessOverride is required"); await tx.insert(panditStorefronts).values({ panditId: id, contactAccessOverride: input.contactAccessOverride }).onConflictDoUpdate({ target: panditStorefronts.panditId, set: { contactAccessOverride: input.contactAccessOverride, updatedAt: new Date() } }); }
      else await tx.update(pandits).set(change).where(eq(pandits.id, id));
       await tx.insert(adminAuditLogs).values({ actor: `admin:${req.adminUserId || "authenticated"}`, action: `pandit_governance.${input.action}`, target: `pandit:${id}`, ipAddress: req.ip, details: { reason: input.reason || null, batchId: batchId || null, before: safeGovernanceAuditState(p), after: safeGovernanceAuditState({ ...p, ...change, storefrontPublished: input.action === "publish" ? true : input.action === "unpublish" ? false : undefined }) } });
    }); return { id, ok: true };
  }
  app.patch("/api/admin/pandit-governance/:id", adminAuthMiddleware, async (req: any, res) => { const parsed = write.safeParse(req.body); if (!parsed.success || !Number.isInteger(Number(req.params.id))) return res.status(400).json({ message: "Invalid governance request" }); try { res.json(await mutate(req, Number(req.params.id), parsed.data)); } catch (e: any) { res.status(e.message === "Pandit not found" ? 404 : 400).json({ message: e.message }); } });
  app.post("/api/admin/pandit-governance/bulk", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({ ids: z.array(z.number().int().positive()).min(1).max(100), action: actionSchema, reason: z.string().trim().min(1).max(500), confirmed: z.literal(true) }).safeParse(req.body);
    if (!parsed.success || !bulkActions.has(parsed.data.action)) return res.status(400).json({ message: "Invalid bulk governance request" });
    const ids = Array.from(new Set(parsed.data.ids));
    const existing = await db.select().from(pandits).where(inArray(pandits.id, ids));
    if (existing.length !== ids.length) return res.status(404).json({ message: "One or more Pandits were not found; no records were changed" });
    const byId = new Map(existing.map(p => [p.id, p]));
    const batchId = `pgov-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    try {
      await db.transaction(async tx => {
        for (const id of ids) {
          const p = byId.get(id)!;
          const action = parsed.data.action;
          const change =
            action === "directory_show" ? { directoryVisible: true } :
            action === "directory_hide" ? { directoryVisible: false } :
            action === "search_enable" ? { searchEligible: true } :
            action === "search_disable" ? { searchEligible: false } :
            action === "booking_enable" ? { bookingEnabled: true } :
            action === "booking_disable" ? { bookingEnabled: false } :
            action === "verify" ? { verified: true } :
            action === "revoke_verification" ? { verified: false } :
            action === "archive" ? { archived: true } :
            action === "restore" ? { archived: false } : null;
          if (action === "publish" || action === "unpublish") {
            await tx.insert(panditStorefronts).values({ panditId: id, isPublished: action === "publish", status: action === "publish" ? "published" : "draft" })
              .onConflictDoUpdate({ target: panditStorefronts.panditId, set: { isPublished: action === "publish", status: action === "publish" ? "published" : "draft", updatedAt: new Date() } });
          } else if (change) {
            await tx.update(pandits).set(change).where(eq(pandits.id, id));
          } else {
            throw new Error("Unsupported bulk action");
          }
          await tx.insert(adminAuditLogs).values({
            actor: `admin:${req.adminUserId}`,
            action: `pandit_governance.${action}`,
            target: `pandit:${id}`,
            ipAddress: req.ip,
            details: {
              reason: parsed.data.reason,
              batchId,
              before: safeGovernanceAuditState(p),
              after: safeGovernanceAuditState({ ...p, ...change, storefrontPublished: action === "publish" ? true : action === "unpublish" ? false : undefined }),
            },
          });
        }
      });
      res.json({ batchId, results: ids.map(id => ({ id, ok: true })), updated: ids.length });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Bulk governance update failed; no records were changed" });
    }
  });
}