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
  entityType: panditSeoEditorialEntityTypeSchema,
  entityKey: z.string().trim().min(1).max(200),
  introduction: safeText(8000),
  faqs: z.array(z.object({
    question: requiredSafeText(240),
    answer: requiredSafeText(1600),
  }).strict()).max(12),
}).strict();

const statusBodySchema = z.object({
  status: panditSeoEditorialStatusSchema,
}).strict();

export type EditorialStatus = z.infer<typeof panditSeoEditorialStatusSchema>;

/** Publishing always requires the preceding reviewed state. */
export function canTransitionEditorialStatus(from: EditorialStatus, to: EditorialStatus) {
  if (from === to) return true;
  return (from === "draft" && to === "reviewed")
    || (from === "reviewed" && (to === "draft" || to === "published"))
    || (from === "published" && to === "reviewed");
}

function actorFor(req: Request) {
  const token = (req.headers["x-admin-token"] as string) || "";
  return token ? `admin:${token.slice(-6)}` : "unknown";
}

function auditDetails(req: Request) {
  return (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
}

function countCoverage(rows: Array<{ indexability: { status: string; reasons: string[] } }>) {
  const byStatus: Record<string, number> = {};
  const byReason: Record<string, number> = {};
  rows.forEach((row) => {
    byStatus[row.indexability.status] = (byStatus[row.indexability.status] || 0) + 1;
    row.indexability.reasons.forEach((reason) => {
      byReason[reason] = (byReason[reason] || 0) + 1;
    });
  });
  return { total: rows.length, byStatus, byReason };
}

export function projectPanditSeoCoverage(projection: Awaited<ReturnType<typeof getPanditSeoNetworkProjection>>) {
  const profiles = projection.profiles.map((profile) => ({
    entityType: "profile",
    // not_found profiles are deliberately opaque: no ID, URL, or public DTO.
    ...(profile.indexability.status === "not_found" ? {} : {
      entityKey: profile.entityId,
      canonicalUrl: profile.canonicalUrl,
    }),
    indexability: profile.indexability,
  }));
  const cities = projection.cities.map((city) => ({
    entityType: "city",
    entityKey: city.entityId,
    canonicalUrl: city.canonicalUrl,
    canonicalUrlPending: city.canonicalUrl === null,
    indexability: city.canonicalUrl === null
      ? { ...city.indexability, reasons: [...city.indexability.reasons, "canonical_url_pending"] }
      : city.indexability,
  }));
  const services = projection.cities.flatMap((city) => city.services.map((service) => ({
    entityType: "city_service",
    entityKey: service.entityId,
    canonicalUrl: service.canonicalUrl,
    canonicalUrlPending: service.canonicalUrl === null,
    indexability: service.canonicalUrl === null
      ? { ...service.indexability, reasons: [...service.indexability.reasons, "canonical_url_pending"] }
      : service.indexability,
  })));
  const rows = [...profiles, ...cities, ...services];
  return { rows, counts: countCoverage(rows) };
}

export function registerPanditSeoNetworkAdminRoutes(app: Express, adminAuthMiddleware: any) {
  app.get("/api/admin/pandit-seo-network/coverage", adminAuthMiddleware, async (_req, res, next) => {
    try {
      const [projection, settings] = await Promise.all([
        getPanditSeoNetworkProjection(),
        storage.getSiteSettings(),
      ]);
      res.json({
        evaluatedAt: new Date().toISOString(),
        enabled: settings?.panditSeoNetworkEnabled === true,
        ...projectPanditSeoCoverage(projection),
      });
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/admin/pandit-seo-network/editorials", adminAuthMiddleware, async (_req, res, next) => {
    try {
      res.json(await storage.listPanditSeoEditorials());
    } catch (error) {
      next(error);
    }
  });

  app.put("/api/admin/pandit-seo-network/editorials", adminAuthMiddleware, async (req: Request, res: Response, next) => {
    try {
      const parsed = editorialBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: parsed.error.issues.map((i) => i.message).join(", ") });
      const existing = await storage.getPanditSeoEditorial(parsed.data.entityType, parsed.data.entityKey);
      // Editing approved copy puts it back in draft; an editor must review it again.
      const editorial = await storage.upsertPanditSeoEditorial({
        ...parsed.data,
        status: "draft",
      }, actorFor(req));
      invalidatePanditSeoNetworkCache();
      await storage.logAdminAction({
        actor: actorFor(req),
        action: "pandit-seo-editorial.save",
        target: `${parsed.data.entityType}:${parsed.data.entityKey}`,
        details: { revision: editorial.revision, previousStatus: existing?.status || null },
        ipAddress: auditDetails(req),
      });
      return res.json(editorial);
    } catch (error) {
      return next(error);
    }
  });

  app.patch("/api/admin/pandit-seo-network/editorials/:entityType/:entityKey/status", adminAuthMiddleware, async (req, res, next) => {
    try {
      const type = panditSeoEditorialEntityTypeSchema.safeParse(req.params.entityType);
      const key = z.string().trim().min(1).max(200).safeParse(req.params.entityKey);
      const body = statusBodySchema.safeParse(req.body);
      if (!type.success || !key.success || !body.success) return res.status(400).json({ message: "Invalid editorial status request" });
      const existing = await storage.getPanditSeoEditorial(type.data, key.data);
      if (!existing) return res.status(404).json({ message: "Editorial record not found" });
      if (!canTransitionEditorialStatus(existing.status as EditorialStatus, body.data.status)) {
        return res.status(409).json({ message: `Cannot transition ${existing.status} to ${body.data.status}` });
      }
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
}