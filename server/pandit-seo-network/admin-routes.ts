import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "../storage";
import {
  panditSeoEditorialEntityTypeSchema,
  panditSeoEditorialFaqSchema,
  panditSeoEditorialStatusSchema,
} from "@shared/schema";
import { getPanditSeoNetworkProjection, invalidatePanditSeoNetworkCache } from "./cache";

const safeText = (max: number) => z.string().trim().max(max).refine(
  (value) => !/<[^>]*>/.test(value),
  "HTML is not permitted",
);
const requiredSafeText = (max: number) => z.string().trim().min(1).max(max).refine(
  (value) => !/<[^>]*>/.test(value),
  "HTML is not permitted",
);

export const editorialBodySchema = z.object({
  introduction: safeText(8000),
  faqs: z.array(z.object({
    question: requiredSafeText(240),
    answer: requiredSafeText(1600),
  }).strict()).max(12),
}).strict();

const statusBodySchema = z.object({
  status: panditSeoEditorialStatusSchema,
}).strict();
const rolloutBodySchema = z.object({ enabled: z.boolean() }).strict();
const entityKeySchema = z.string().trim().min(1).max(200);

export type EditorialStatus = z.infer<typeof panditSeoEditorialStatusSchema>;

/** Publishing always requires the preceding reviewed state. */
export function canTransitionEditorialStatus(from: EditorialStatus, to: EditorialStatus) {
  if (from === to) return true;
  return (from === "draft" && to === "reviewed")
    || (from === "reviewed" && (to === "draft" || to === "published"))
    || (from === "published" && to === "reviewed");
}

type AuthenticatedAdminRequest = Request & { adminUserId?: number };

export function actorFor(req: AuthenticatedAdminRequest) {
  if (!Number.isInteger(req.adminUserId) || req.adminUserId! <= 0) {
    throw new Error("Authenticated Admin identity is required for audit writes");
  }
  return `admin-user:${req.adminUserId}`;
}

function auditDetails(req: Request) {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
}

function countReasons(rows: Array<{ indexability: { reasons: string[] } }>) {
  const byReason: Record<string, number> = {};
  rows.forEach((row) => {
    row.indexability.reasons.forEach((reason) => {
      byReason[reason] = (byReason[reason] || 0) + 1;
    });
  });
  return byReason;
}

type EditorialSummary = { entityType: string; entityKey: string; status: string };

export function projectPanditSeoCoverage(
  projection: Awaited<ReturnType<typeof getPanditSeoNetworkProjection>>,
  editorials: EditorialSummary[] = [],
) {
  const statuses = new Map(editorials.map((item) => [`${item.entityType}:${item.entityKey}`, item.status]));
  const editorialStatus = (type: string, key: string | null) => key ? statuses.get(`${type}:${key}`) || null : null;
  const profiles = projection.profiles.map((profile) => ({
    entityType: "profile",
    // Opaque entries reveal neither identity nor marketplace/private fields.
    entityKey: profile.indexability.status === "not_found" ? null : profile.entityId,
    label: profile.indexability.status === "not_found"
      ? "Private profile"
      : String(profile.pandit?.name || "Public Pandit profile"),
    canonicalUrl: profile.indexability.status === "not_found" ? null : profile.canonicalUrl,
    indexability: profile.indexability,
    editorialStatus: editorialStatus("profile", profile.indexability.status === "not_found" ? null : profile.entityId),
  }));
  const cities = projection.cities.map((city) => ({
    entityType: "city",
    entityKey: city.entityId,
    label: `${city.city.name}, ${city.state.name}`,
    canonicalUrl: city.canonicalUrl,
    indexability: city.canonicalUrl === null
      ? { ...city.indexability, reasons: [...city.indexability.reasons, "canonical_url_pending"] }
      : city.indexability,
    editorialStatus: editorialStatus("city", city.entityId),
  }));
  const cityServices = projection.cities.flatMap((city) => city.services.map((service) => ({
    entityType: "city_service",
    entityKey: service.entityId,
    label: `${service.service.name} in ${city.city.name}`,
    canonicalUrl: service.canonicalUrl,
    indexability: service.canonicalUrl === null
      ? { ...service.indexability, reasons: [...service.indexability.reasons, "canonical_url_pending"] }
      : service.indexability,
    editorialStatus: editorialStatus("city_service", service.entityId),
  })));
  const rows = [...profiles, ...cities, ...cityServices];
  return {
    profiles,
    cities,
    cityServices,
    summary: {
      profiles: profiles.length,
      cities: cities.length,
      cityServices: cityServices.length,
      indexable: rows.filter((row) => row.indexability.status === "indexable").length,
      noindex: rows.filter((row) => row.indexability.status.startsWith("noindex")).length,
      notFound: rows.filter((row) => row.indexability.status === "not_found").length,
    },
    reasonCounts: countReasons(rows),
  };
}

export function registerPanditSeoNetworkAdminRoutes(app: Express, adminAuthMiddleware: any) {
  app.get("/api/admin/pandit-seo-network", adminAuthMiddleware, async (_req, res, next) => {
    try {
      const [projection, settings, editorials] = await Promise.all([
        getPanditSeoNetworkProjection(),
        storage.getSiteSettings(),
        storage.listPanditSeoEditorials(),
      ]);
      res.json({
        evaluatedAt: new Date().toISOString(),
        enabled: settings?.panditSeoNetworkEnabled === true,
        ...projectPanditSeoCoverage(projection, editorials),
        editorials,
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/pandit-seo-editorial", adminAuthMiddleware, async (_req, res, next) => {
    try {
      res.json(await storage.listPanditSeoEditorials());
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/pandit-seo-editorial/:entityType/:entityKey", adminAuthMiddleware, async (req: Request, res: Response, next) => {
    try {
      const type = panditSeoEditorialEntityTypeSchema.safeParse(req.params.entityType);
      const key = entityKeySchema.safeParse(req.params.entityKey);
      const parsed = editorialBodySchema.safeParse(req.body);
      if (!type.success || !key.success || !parsed.success) {
        return res.status(400).json({ message: "Invalid editorial content request" });
      }
      const existing = await storage.getPanditSeoEditorial(type.data, key.data);
      // Editing approved copy puts it back in draft; an editor must review it again.
      const editorial = await storage.upsertPanditSeoEditorial({
        entityType: type.data,
        entityKey: key.data,
        ...parsed.data,
        status: "draft",
      }, actorFor(req));
      invalidatePanditSeoNetworkCache();
      await storage.logAdminAction({
        actor: actorFor(req),
        action: "pandit-seo-editorial.save",
        target: `${type.data}:${key.data}`,
        details: { revision: editorial.revision, previousStatus: existing?.status || null },
        ipAddress: auditDetails(req),
      });
      return res.json(editorial);
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/admin/pandit-seo-editorial/:entityType/:entityKey/status", adminAuthMiddleware, async (req, res, next) => {
    try {
      const type = panditSeoEditorialEntityTypeSchema.safeParse(req.params.entityType);
      const key = entityKeySchema.safeParse(req.params.entityKey);
      const body = statusBodySchema.safeParse(req.body);
      if (!type.success || !key.success || !body.success) return res.status(400).json({ message: "Invalid editorial status request" });
      const existing = await storage.getPanditSeoEditorial(type.data, key.data);
      if (!existing) return res.status(404).json({ message: "Editorial record not found" });
      if (!canTransitionEditorialStatus(existing.status as EditorialStatus, body.data.status)) {
        return res.status(409).json({ message: `Cannot transition ${existing.status} to ${body.data.status}` });
      }
      if (existing.status === body.data.status) return res.json(existing);
      const editorial = await storage.upsertPanditSeoEditorial({
        entityType: existing.entityType as z.infer<typeof panditSeoEditorialEntityTypeSchema>,
        entityKey: existing.entityKey,
        introduction: existing.introduction,
        faqs: existing.faqs as z.infer<typeof panditSeoEditorialFaqSchema>[],
        status: body.data.status,
      }, actorFor(req));
      invalidatePanditSeoNetworkCache();
      await storage.logAdminAction({
        actor: actorFor(req), action: "pandit-seo-editorial.status",
        target: `${existing.entityType}:${existing.entityKey}`,
        details: { from: existing.status, to: editorial.status, revision: editorial.revision },
        ipAddress: auditDetails(req),
      });
      return res.json(editorial);
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/admin/pandit-seo-network/rollout", adminAuthMiddleware, async (req, res, next) => {
    try {
      const body = rolloutBodySchema.safeParse(req.body);
      if (!body.success) return res.status(400).json({ message: "Invalid rollout request" });
      const settings = await storage.upsertSiteSettings({ panditSeoNetworkEnabled: body.data.enabled });
      invalidatePanditSeoNetworkCache();
      await storage.logAdminAction({
        actor: actorFor(req),
        action: "pandit-seo-network.rollout",
        target: "siteSettings",
        details: { enabled: body.data.enabled },
        ipAddress: auditDetails(req),
      });
      return res.json({ enabled: settings.panditSeoNetworkEnabled });
    } catch (error) {
      return next(error);
    }
  });
}