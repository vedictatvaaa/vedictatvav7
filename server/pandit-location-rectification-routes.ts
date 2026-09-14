import type { Express } from "express";
import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  adminAuditLogs,
  indianCities,
  indianStates,
  panditLocationRectificationProposals,
  pandits,
} from "@shared/schema";
import {
  runPanditLocationAudit,
  sameLocationSnapshot,
  locationSnapshot,
} from "./pandit-location-rectification";
import { createOpenAILocationInterpreter, isOpenAILocationInterpreterConfigured } from "./pandit-location-ai";
import { createVerifiedCityGeocoder, isVerifiedCityGeocoderAvailable } from "./pandit-location-geocoder";

const auditRequest = z.object({
  // A write requires an explicit confirmation. The default is a read-only
  // audit so an accidental admin request cannot alter rows.
  persist: z.boolean().optional().default(false),
  useAi: z.boolean().optional().default(false),
  useGeocoder: z.boolean().optional().default(false),
  confirmed: z.literal(true).optional(),
}).strict();
const reviewRequest = z.object({
  confirmed: z.literal(true),
  reason: z.string().trim().min(1).max(500),
}).strict();

export function registerPanditLocationRectificationRoutes(app: Express, adminAuthMiddleware: any) {
  app.get("/api/admin/pandit-location-rectification", adminAuthMiddleware, async (req: any, res) => {
    const status = String(req.query.status || "");
    if (status && !["pending", "approved", "rejected", "applied"].includes(status)) {
      return res.status(400).json({ message: "Invalid rectification status" });
    }
    const rows = await db.select().from(panditLocationRectificationProposals)
      .where(status ? eq(panditLocationRectificationProposals.status, status) : undefined)
      .orderBy(desc(panditLocationRectificationProposals.createdAt))
      .limit(Math.min(100, Math.max(1, Number(req.query.limit) || 50)));
    // Proposal rows contain only canonical location evidence. Never join or
    // return Pandit contact fields from this admin audit surface.
    res.json({ items: rows, summary: {
      pending: rows.filter(row => row.status === "pending").length,
      approved: rows.filter(row => row.status === "approved").length,
      rejected: rows.filter(row => row.status === "rejected").length,
      applied: rows.filter(row => row.status === "applied").length,
    } });
  });

  app.post("/api/admin/pandit-location-rectification/audit", adminAuthMiddleware, async (req: any, res) => {
    const parsed = auditRequest.safeParse(req.body || {});
    if (!parsed.success || ((parsed.data.persist || parsed.data.useAi || parsed.data.useGeocoder) && parsed.data.confirmed !== true)) {
      return res.status(400).json({ message: "Writes and external adapters require explicit confirmation" });
    }
    if (parsed.data.useAi && !isOpenAILocationInterpreterConfigured()) {
      return res.status(503).json({ message: "OpenAI location interpretation is not configured" });
    }
    if (parsed.data.useGeocoder && !isVerifiedCityGeocoderAvailable()) {
      return res.status(503).json({ message: "Verified city geocoder is unavailable in this runtime" });
    }
    try {
      const batchId = `plr-${Date.now()}`;
      const report = await runPanditLocationAudit({
        persist: parsed.data.persist, batchId,
        aiInterpreter: parsed.data.useAi ? createOpenAILocationInterpreter() : undefined,
        coordinateResolver: parsed.data.useGeocoder ? createVerifiedCityGeocoder() : undefined,
      });
      res.json({ dryRun: !parsed.data.persist, ...report });
    } catch (error: any) {
      res.status(500).json({ message: error?.message || "Location audit failed" });
    }
  });

  // Applies only deterministic catalogue matches. This operation deliberately
  // does not geocode or write coordinates: a city match is not evidence for a
  // Pandit's exact position.
  app.post("/api/admin/pandit-location-rectification/resolve-safe", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({
      confirmed: z.literal(true),
      reason: z.string().trim().min(1).max(500).default("Admin requested deterministic location resolution"),
    }).strict().safeParse(req.body || {});
    if (!parsed.success) return res.status(400).json({ message: "Confirmation and reason are required" });
    try {
      const report = await runPanditLocationAudit({ persist: false, batchId: `plr-safe-${Date.now()}` });
      const candidates = report.results.filter(result => result.autoApply && result.proposed);
      const result = await db.transaction(async tx => {
        const applied: number[] = [];
        const skipped: Array<{ panditId: number; reason: string }> = [];
        for (const candidate of candidates) {
          const proposed = candidate.proposed!;
          const [current] = await tx.select().from(pandits).where(eq(pandits.id, candidate.panditId)).for("update").limit(1);
          if (!current || !sameLocationSnapshot(locationSnapshot(current), candidate.before)) {
            skipped.push({ panditId: candidate.panditId, reason: "source_changed_since_scan" });
            continue;
          }
          const stateId = Number(proposed.stateId);
          const cityId = Number(proposed.cityId);
          if (!Number.isInteger(stateId) || !Number.isInteger(cityId) || stateId < 1 || cityId < 1) {
            skipped.push({ panditId: candidate.panditId, reason: "missing_canonical_location" });
            continue;
          }
          const [location] = await tx.select({ state: indianStates, city: indianCities })
            .from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
            .where(and(
              eq(indianCities.id, cityId),
              eq(indianCities.stateId, stateId),
              eq(indianCities.isActive, true),
              eq(indianStates.isActive, true),
            )).limit(1);
          if (!location) {
            skipped.push({ panditId: candidate.panditId, reason: "catalogue_location_inactive" });
            continue;
          }
          await tx.update(pandits).set({
            stateId: location.state.id,
            cityId: location.city.id,
            state: location.state.name,
            city: location.city.name,
            locationReviewStatus: "resolved",
          } as any).where(eq(pandits.id, candidate.panditId));
          await tx.insert(adminAuditLogs).values({
            actor: `admin:${req.adminUserId || "authenticated"}`,
            action: "pandit_location_rectification.safe_applied",
            target: `pandit:${candidate.panditId}`,
            ipAddress: req.ip,
            details: { reason: parsed.data.reason, before: candidate.before, after: proposed, coordinatesPreserved: true },
          });
          applied.push(candidate.panditId);
        }
        return { applied, skipped };
      });
      res.json({ ok: true, scanned: report.results.length, ...result });
    } catch (error: any) {
      console.error("safe location resolution error:", error);
      res.status(500).json({ ok: false, message: "Safe location resolution failed", code: "safe_location_resolution_failed" });
    }
  });

  // Applies only proposals that the deterministic engine marked high
  // confidence. Ambiguous rows remain in the review queue; they cannot be
  // smuggled through a bulk request by changing a client-side confidence.
  app.post("/api/admin/pandit-location-rectification/apply", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({
      proposalIds: z.array(z.number().int().positive()).min(1).max(100),
      confirmed: z.literal(true),
      reason: z.string().trim().min(1).max(500),
    }).strict().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Preview confirmation, proposalIds, and reason are required" });
    const ids = Array.from(new Set(parsed.data.proposalIds));
    try {
      const result = await db.transaction(async tx => {
        const proposals = await tx.select().from(panditLocationRectificationProposals)
          .where(inArray(panditLocationRectificationProposals.id, ids))
          .orderBy(asc(panditLocationRectificationProposals.id)).for("update");
        const byId = new Map(proposals.map(proposal => [proposal.id, proposal]));
        const applied: number[] = [], skipped: Array<{ id: number; reason: string }> = [];
        for (const id of ids) {
          const proposal = byId.get(id);
          if (!proposal) { skipped.push({ id, reason: "not_found" }); continue; }
          if (proposal.status === "applied") { applied.push(id); continue; }
          if (proposal.status !== "pending" || Number(proposal.confidence) < 0.9) {
            skipped.push({ id, reason: "needs_review" }); continue;
          }
          const proposed = proposal.proposed && typeof proposal.proposed === "object" ? proposal.proposed as Record<string, unknown> : {};
          const stateId = Number(proposed.stateId), cityId = Number(proposed.cityId);
          const [location] = await tx.select({ state: indianStates, city: indianCities })
            .from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
            .where(and(eq(indianCities.id, cityId), eq(indianCities.stateId, stateId), eq(indianCities.isActive, true), eq(indianStates.isActive, true))).limit(1);
          if (!location) { skipped.push({ id, reason: "catalogue_location_inactive" }); continue; }
          const [current] = await tx.select().from(pandits).where(eq(pandits.id, proposal.panditId)).for("update").limit(1);
          if (!current || !sameLocationSnapshot(locationSnapshot(current), proposal.before as any)) {
            skipped.push({ id, reason: "source_changed_since_audit" }); continue;
          }
          const change: Record<string, unknown> = {
            stateId, cityId, state: location.state.name, city: location.city.name,
            locationReviewStatus: "resolved",
          };
          const locationChanged = current.stateId !== stateId || current.cityId !== cityId;
          // Only verified catalogue/geocoder evidence may write coordinates.
          if (proposed.coordinatesVerified === true) {
            const latitude = Number(proposed.latitude), longitude = Number(proposed.longitude);
            if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
              || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
              || proposed.coordinateScope !== "address"
              || typeof proposed.coordinateSource !== "string"
              || proposed.coordinateSource === "nominatim:city-identity"
              || Number(proposed.coordinateConfidence) < 0.9) {
              skipped.push({ id, reason: "unverified_coordinates" }); continue;
            }
            change.latitude = latitude;
            change.longitude = longitude;
            change.coordinateSource = proposed.coordinateSource;
            change.coordinateConfidence = Number(proposed.coordinateConfidence);
            change.coordinateVerifiedAt = proposed.coordinateVerifiedAt
              ? new Date(String(proposed.coordinateVerifiedAt)) : new Date();
          } else if (locationChanged) {
            change.latitude = null;
            change.longitude = null;
            change.coordinateSource = null;
            change.coordinateConfidence = null;
            change.coordinateVerifiedAt = null;
          }
          await tx.update(pandits).set(change as any).where(eq(pandits.id, proposal.panditId));
          await tx.update(panditLocationRectificationProposals).set({
            status: "applied", reviewedBy: `admin:${req.adminUserId || "authenticated"}`,
            reviewedAt: new Date(), appliedAt: new Date(), updatedAt: new Date(),
          }).where(eq(panditLocationRectificationProposals.id, id));
          await tx.insert(adminAuditLogs).values({
            actor: `admin:${req.adminUserId || "authenticated"}`,
            action: "pandit_location_rectification.auto_applied",
            target: `pandit:${proposal.panditId}`, ipAddress: req.ip,
            details: {
              proposalId: id, reason: parsed.data.reason, source: proposal.source,
              confidence: proposal.confidence, before: proposal.before, after: proposal.proposed,
            },
          });
          applied.push(id);
        }
        return { applied, skipped };
      });
      res.json({ ...result, updated: result.applied.length });
    } catch (error: any) {
      res.status(400).json({ message: error?.message || "Unable to apply rectifications" });
    }
  });

  app.patch("/api/admin/pandit-location-rectification/:id", adminAuthMiddleware, async (req: any, res) => {
    const parsed = z.object({
      stateId: z.number().int().positive(),
      cityId: z.number().int().positive(),
      confirmed: z.literal(true),
      reason: z.string().trim().min(1).max(500),
    }).strict().safeParse(req.body);
    const id = Number(req.params.id);
    if (!parsed.success || !Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid rectification edit" });
    const [location] = await db.select({ state: indianStates, city: indianCities })
      .from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
      .where(and(eq(indianCities.id, parsed.data.cityId), eq(indianCities.stateId, parsed.data.stateId), eq(indianCities.isActive, true), eq(indianStates.isActive, true))).limit(1);
    if (!location) return res.status(400).json({ message: "State and city must be active and matching" });
    const [proposal] = await db.select().from(panditLocationRectificationProposals)
      .where(eq(panditLocationRectificationProposals.id, id)).limit(1);
    if (!proposal) return res.status(404).json({ message: "Rectification proposal not found" });
    if (proposal.status === "applied") return res.status(409).json({ message: "Applied proposals cannot be edited" });
    const beforeProposed = proposal.proposed && typeof proposal.proposed === "object" ? proposal.proposed as Record<string, unknown> : {};
    // A city/state edit invalidates every coordinate claim attached to the
    // old location. Coordinates are reintroduced only by a later verified
    // address-level evidence proposal.
    const {
      latitude: _latitude, longitude: _longitude, coordinatesVerified: _coordinatesVerified,
      coordinateScope: _coordinateScope, coordinateSource: _coordinateSource,
      coordinateConfidence: _coordinateConfidence, coordinateVerifiedAt: _coordinateVerifiedAt,
      coordinateEvidence: _coordinateEvidence, cityIdentityEvidence: _cityIdentityEvidence,
      ...locationOnlyProposal
    } = beforeProposed;
    const proposed = {
      ...locationOnlyProposal, stateId: location.state.id, cityId: location.city.id,
      state: location.state.name, city: location.city.name,
    };
    await db.transaction(async tx => {
      const [updated] = await tx.update(panditLocationRectificationProposals).set({
        proposed, candidates: [{ stateId: location.state.id, cityId: location.city.id, state: location.state.name, city: location.city.name, match: "admin_edit" }],
        status: "pending", source: "admin_edit", confidence: 1, reason: parsed.data.reason, updatedAt: new Date(),
      }).where(and(eq(panditLocationRectificationProposals.id, id), inArray(panditLocationRectificationProposals.status, ["pending", "approved"])))
        .returning({ id: panditLocationRectificationProposals.id });
      if (!updated) throw new Error("Proposal changed while it was being edited");
      await tx.insert(adminAuditLogs).values({
        actor: `admin:${req.adminUserId || "authenticated"}`,
        action: "pandit_location_rectification.edited", target: `pandit:${proposal.panditId}`, ipAddress: req.ip,
        details: { proposalId: id, reason: parsed.data.reason, before: proposal.proposed, after: proposed },
      });
    });
    res.json({ id, status: "pending", proposed });
  });

  app.post("/api/admin/pandit-location-rectification/:id/approve", adminAuthMiddleware, async (req: any, res) => {
    const parsed = reviewRequest.safeParse(req.body);
    const id = Number(req.params.id);
    if (!parsed.success || !Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid rectification approval" });
    try {
      const result = await db.transaction(async tx => {
        const [proposal] = await tx.select().from(panditLocationRectificationProposals)
          .where(eq(panditLocationRectificationProposals.id, id)).for("update").limit(1);
        if (!proposal) throw new Error("Rectification proposal not found");
        if (proposal.status === "applied") return { id, status: "applied", alreadyApplied: true };
        if (proposal.status !== "pending" && proposal.status !== "approved") throw new Error("Only pending proposals can be approved");
        const proposed = proposal.proposed && typeof proposal.proposed === "object" ? proposal.proposed as Record<string, unknown> : {};
        const stateId = Number(proposed.stateId), cityId = Number(proposed.cityId);
        if (!Number.isInteger(stateId) || !Number.isInteger(cityId)) throw new Error("Proposal has no canonical location");
        const [location] = await tx.select({ state: indianStates, city: indianCities })
          .from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
          .where(and(eq(indianCities.id, cityId), eq(indianCities.stateId, stateId), eq(indianCities.isActive, true), eq(indianStates.isActive, true))).limit(1);
        if (!location) throw new Error("Proposed location is no longer active");
        const [current] = await tx.select().from(pandits).where(eq(pandits.id, proposal.panditId)).for("update").limit(1);
        if (!current) throw new Error("Pandit not found");
        if (!sameLocationSnapshot(locationSnapshot(current), proposal.before as any)) {
          throw new Error("Pandit location changed since this proposal was created");
        }
        const change: Record<string, unknown> = {
          stateId, cityId, state: location.state.name, city: location.city.name,
          locationReviewStatus: "resolved",
        };
        const locationChanged = current.stateId !== stateId || current.cityId !== cityId;
        if (proposed.coordinatesVerified === true) {
          const latitude = Number(proposed.latitude), longitude = Number(proposed.longitude);
          if (!Number.isFinite(latitude) || latitude < -90 || latitude > 90
            || !Number.isFinite(longitude) || longitude < -180 || longitude > 180
            || proposed.coordinateScope !== "address"
            || typeof proposed.coordinateSource !== "string"
            || proposed.coordinateSource === "nominatim:city-identity"
            || Number(proposed.coordinateConfidence) < 0.9) {
            throw new Error("Proposal contains unverified coordinates");
          }
          change.latitude = latitude;
          change.longitude = longitude;
          change.coordinateSource = proposed.coordinateSource;
          change.coordinateConfidence = Number(proposed.coordinateConfidence);
          change.coordinateVerifiedAt = proposed.coordinateVerifiedAt
            ? new Date(String(proposed.coordinateVerifiedAt)) : new Date();
        } else if (locationChanged) {
          change.latitude = null;
          change.longitude = null;
          change.coordinateSource = null;
          change.coordinateConfidence = null;
          change.coordinateVerifiedAt = null;
        }
        await tx.update(pandits).set(change as any).where(eq(pandits.id, proposal.panditId));
        await tx.update(panditLocationRectificationProposals).set({
          status: "applied", reviewedBy: `admin:${req.adminUserId || "authenticated"}`,
          reviewedAt: new Date(), appliedAt: new Date(), updatedAt: new Date(),
        }).where(eq(panditLocationRectificationProposals.id, id));
        await tx.insert(adminAuditLogs).values({
          actor: `admin:${req.adminUserId || "authenticated"}`,
          action: "pandit_location_rectification.applied",
          target: `pandit:${proposal.panditId}`,
          ipAddress: req.ip,
          details: {
            proposalId: id, reason: parsed.data.reason, source: proposal.source,
            confidence: proposal.confidence, before: proposal.before, after: proposal.proposed,
          },
        });
        return { id, panditId: proposal.panditId, status: "applied" };
      });
      res.json(result);
    } catch (error: any) {
      res.status(error?.message === "Rectification proposal not found" ? 404 : 400)
        .json({ message: error?.message || "Unable to apply rectification" });
    }
  });

  app.post("/api/admin/pandit-location-rectification/:id/reject", adminAuthMiddleware, async (req: any, res) => {
    const parsed = reviewRequest.safeParse(req.body);
    const id = Number(req.params.id);
    if (!parsed.success || !Number.isInteger(id) || id < 1) return res.status(400).json({ message: "Invalid rectification rejection" });
    const [proposal] = await db.select().from(panditLocationRectificationProposals)
      .where(eq(panditLocationRectificationProposals.id, id)).limit(1);
    if (!proposal) return res.status(404).json({ message: "Rectification proposal not found" });
    if (proposal.status === "applied") return res.status(409).json({ message: "Applied proposals cannot be rejected" });
    await db.update(panditLocationRectificationProposals).set({
      status: "rejected", reviewedBy: `admin:${req.adminUserId || "authenticated"}`,
      reviewedAt: new Date(), updatedAt: new Date(),
    }).where(eq(panditLocationRectificationProposals.id, id));
    res.json({ id, status: "rejected" });
  });
}