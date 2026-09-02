import type { Express, Request } from "express";
import { db } from "../db";
import { createEntityAdapters } from "./entity-adapters";
import { KnowledgeGraphRepository } from "./repository";
import { KnowledgeGraphService } from "./service";
import { KnowledgeGraphConflictError, KnowledgeGraphValidationError, UnsupportedEntitySourceError } from "./types";
import { positiveEntityId } from "./validation";

type AdminRequest = Request & { adminUserId?: number };
const actor = (req: AdminRequest) => {
  if (!Number.isInteger(req.adminUserId) || req.adminUserId! < 1) throw new Error("Authenticated Admin identity is required for audit writes");
  return req.adminUserId!;
};
const ip = (req: Request) => (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
const id = (value: unknown) => positiveEntityId(Number(value));

export function registerKnowledgeGraphAdminRoutes(app: Express, adminAuthMiddleware: any, dependencies?: {
  service?: KnowledgeGraphService;
}) {
  const service = dependencies?.service || new KnowledgeGraphService(new KnowledgeGraphRepository(db), createEntityAdapters(db));
  const guarded = (handler: (req: AdminRequest, res: any) => Promise<any>) => async (req: AdminRequest, res: any, next: any) => {
    try { await handler(req, res); } catch (error: any) {
      if (error instanceof KnowledgeGraphConflictError || error?.code === "23505") return res.status(409).json({ message: "Relationship or quality rule already exists" });
      if (error instanceof KnowledgeGraphValidationError) return res.status(400).json({ message: error.message });
      if (error instanceof UnsupportedEntitySourceError) return res.status(422).json({ message: error.message, entityType: error.entityType });
      return next(error);
    }
  };
  const audit = (req: AdminRequest, action: string, details: object) => ({ actor: `admin-user:${actor(req)}`, action, details, ipAddress: ip(req) });
  app.get("/api/admin/knowledge-graph/summary", adminAuthMiddleware, guarded(async (_req, res) => res.json(await service.summary())));
  app.get("/api/admin/knowledge-graph/relationship-definitions", adminAuthMiddleware, guarded(async (_req, res) => res.json(service.definitions())));
  app.get("/api/admin/knowledge-graph/entities/search", adminAuthMiddleware, guarded(async (req, res) => res.json(await service.search(req.query))));
  app.get("/api/admin/knowledge-graph/entities", adminAuthMiddleware, guarded(async (req, res) => res.json(await service.search(req.query))));
  app.get("/api/admin/knowledge-graph/entities/:type/:id", adminAuthMiddleware, guarded(async (req, res) => {
    const entity = await service.entity({ type: req.params.type as any, id: id(req.params.id), discriminator: req.query.discriminator as any });
    return entity ? res.json(entity) : res.status(404).json({ message: "Entity not found" });
  }));
  app.get("/api/admin/knowledge-graph/orphans", adminAuthMiddleware, guarded(async (req, res) => res.json(await service.orphans(req.query))));
  app.get("/api/admin/knowledge-graph/health", adminAuthMiddleware, guarded(async (req, res) => res.json(await service.health(req.query))));
  app.post("/api/admin/knowledge-graph/relationships", adminAuthMiddleware, guarded(async (req, res) => {
    const row = await service.createRelationship(req.body, actor(req), audit(req, "knowledge-graph.relationship.create", { relationshipType: req.body?.relationshipType }));
    res.status(201).json(service.edgeDto(row));
  }));
  app.patch("/api/admin/knowledge-graph/relationships/:id", adminAuthMiddleware, guarded(async (req, res) => {
    actor(req); const row = await service.patchRelationship(id(req.params.id), req.body, audit(req, "knowledge-graph.relationship.update", {})); if (!row) return res.status(404).json({ message: "Relationship not found" });
    res.json(service.edgeDto(row));
  }));
  app.delete("/api/admin/knowledge-graph/relationships/:id", adminAuthMiddleware, guarded(async (req, res) => {
    actor(req); const row = await service.deleteRelationship(id(req.params.id), audit(req, "knowledge-graph.relationship.delete", {})); if (!row) return res.status(404).json({ message: "Relationship not found" });
    res.status(204).end();
  }));
  app.get("/api/admin/knowledge-graph/quality-rules", adminAuthMiddleware, guarded(async (_req, res) => res.json(await service.repository.listRules())));
  app.post("/api/admin/knowledge-graph/quality-rules", adminAuthMiddleware, guarded(async (req, res) => {
    const row = await service.createRule(req.body, actor(req), audit(req, "knowledge-graph.quality-rule.create", {})); res.status(201).json(row);
  }));
  app.patch("/api/admin/knowledge-graph/quality-rules/:id", adminAuthMiddleware, guarded(async (req, res) => {
    actor(req); const row = await service.patchRule(id(req.params.id), req.body, audit(req, "knowledge-graph.quality-rule.update", {})); if (!row) return res.status(404).json({ message: "Quality rule not found" });
    res.json(row);
  }));
  app.delete("/api/admin/knowledge-graph/quality-rules/:id", adminAuthMiddleware, guarded(async (req, res) => {
    actor(req); const row = await service.deleteRule(id(req.params.id), audit(req, "knowledge-graph.quality-rule.delete", {})); if (!row) return res.status(404).json({ message: "Quality rule not found" });
    res.status(204).end();
  }));
}