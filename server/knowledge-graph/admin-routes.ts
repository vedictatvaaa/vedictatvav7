import type { Express, Request } from "express";
import { db } from "../db";
import { createEntityAdapters } from "./entity-adapters";
import { KnowledgeGraphRepository } from "./repository";
import { KnowledgeGraphService } from "./service";
import { KnowledgeGraphConflictError, KnowledgeGraphValidationError, UnsupportedEntitySourceError } from "./types";
import { positiveEntityId } from "./validation";
import multer from "multer";
import { CsvApplyConflictError, CsvPreviewStore, parseRelationshipCsv, RELATIONSHIP_CSV_HEADERS, RELATIONSHIP_CSV_VERSION, serializeRelationshipCsv } from "./relationship-csv";

type AdminRequest = Request & { adminUserId?: number };
const actor = (req: AdminRequest) => {
  if (!Number.isInteger(req.adminUserId) || req.adminUserId! < 1) throw new Error("Authenticated Admin identity is required for audit writes");
  return req.adminUserId!;
};
const ip = (req: Request) => (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
const id = (value: unknown) => positiveEntityId(Number(value));

export function registerKnowledgeGraphAdminRoutes(app: Express, adminAuthMiddleware: any, dependencies?: {
  service?: KnowledgeGraphService;
  previewStore?: CsvPreviewStore;
}) {
  const service = dependencies?.service || new KnowledgeGraphService(new KnowledgeGraphRepository(db), createEntityAdapters(db));
  const previews = dependencies?.previewStore || new CsvPreviewStore();
  const csvUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024, files: 1, fields: 4 } });
  const guarded = (handler: (req: AdminRequest, res: any) => Promise<any>) => async (req: AdminRequest, res: any, next: any) => {
    try { await handler(req, res); } catch (error: any) {
       if (error instanceof KnowledgeGraphConflictError || error instanceof CsvApplyConflictError || error?.code === "23505" || error?.code === "40001") return res.status(409).json({ message: "Relationship or CSV preview state conflicts with current data" });
      if (error instanceof KnowledgeGraphValidationError) return res.status(400).json({ message: error.message });
      if (error instanceof UnsupportedEntitySourceError) return res.status(422).json({ message: error.message, entityType: error.entityType });
      return next(error);
    }
  };
  const audit = (req: AdminRequest, action: string, details: object) => ({ actor: `admin-user:${actor(req)}`, action, details, ipAddress: ip(req) });
  const csvName = (name: string) => {
    const safe = name.replace(/[^a-z0-9._-]/gi, "_");
    return `attachment; filename="${safe}"; filename*=UTF-8''${encodeURIComponent(safe)}`;
  };
  const download = (res: any, name: string, content: string) => {
    res.setHeader("Content-Type", "text/csv; charset=utf-8"); res.setHeader("Content-Disposition", csvName(name)); res.send(content);
  };
  const exportInteger = (value: unknown, fallback: number, max: number, label: string) => {
    if (value === undefined) return fallback;
    if (typeof value !== "string" || !/^(?:0|[1-9]\d*)$/.test(value)) throw new KnowledgeGraphValidationError(`${label} must be a decimal integer`);
    const result = Number(value);
    if (!Number.isSafeInteger(result) || result < 0 || result > max) throw new KnowledgeGraphValidationError(`${label} is out of range`);
    return result;
  };
  const uploaded = (handler: (req: AdminRequest, res: any, next: any) => any) => (req: AdminRequest, res: any, next: any) => csvUpload.single("file")(req as any, res, (error: any) => {
    if (error) return res.status(error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE" ? 413 : 400).json({ message: error instanceof multer.MulterError ? "Invalid CSV upload" : "CSV upload rejected" });
    return handler(req, res, next);
  });
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
  app.get("/api/admin/knowledge-graph/relationships/csv/template", adminAuthMiddleware, guarded(async (_req, res) => {
    download(res, "knowledge-graph-relationships-template.csv", serializeRelationshipCsv([{
      schema_version: RELATIONSHIP_CSV_VERSION, action: "create", relationship_id: "", source_type: "PUJA", source_id: "", source_discriminator: "",
      relationship_type: "related_to", target_type: "TEMPLE", target_id: "", target_discriminator: "", status: "DRAFT", display_order: "0", metadata: "{}",
    }]));
  }));
  app.get("/api/admin/knowledge-graph/relationships/csv/export", adminAuthMiddleware, guarded(async (req, res) => {
    const afterId = exportInteger(req.query.afterId, 0, 2_147_483_647, "afterId");
    const limit = exportInteger(req.query.limit, 5_000, 5_000, "limit");
    if (limit < 1) throw new KnowledgeGraphValidationError("limit must be an integer between 1 and 5000");
    const fetched = await service.repository.exportRelationships(afterId, limit);
    const hasMore = fetched.length > limit; const rows = fetched.slice(0, limit);
    res.setHeader("X-Export-Has-More", hasMore ? "true" : "false");
    if (hasMore && rows.length) res.setHeader("X-Next-Cursor", String(rows[rows.length - 1].id));
    res.setHeader("Access-Control-Expose-Headers", "X-Export-Has-More, X-Next-Cursor");
    download(res, "knowledge-graph-relationships-export.csv", serializeRelationshipCsv(rows.map((row: any) => ({
      schema_version: RELATIONSHIP_CSV_VERSION, action: "update", relationship_id: row.id, source_type: row.sourceEntityType, source_id: row.sourceEntityId,
      source_discriminator: row.sourceDiscriminator || "", relationship_type: row.relationshipType, target_type: row.targetEntityType, target_id: row.targetEntityId,
      target_discriminator: row.targetDiscriminator || "", status: row.status, display_order: row.displayOrder, metadata: JSON.stringify(row.metadata || {}),
    }))));
  }));
  app.post("/api/admin/knowledge-graph/relationships/csv/preview", adminAuthMiddleware, uploaded(guarded(async (req, res) => {
    const file = (req as any).file;
    if (!file?.buffer) throw new KnowledgeGraphValidationError("A CSV file is required");
    const parsed = parseRelationshipCsv(file.buffer);
    const validation = await service.validateCsvRows(parsed.rows);
    const errors = [...parsed.errors, ...validation.rows.flatMap(row => row.errors.map(message => ({ line: row.line, message })))];
    if (errors.length) return res.json({ previewToken: null, expiresInSeconds: 0,
      rows: validation.rows.map(row => ({ line: row.line, action: row.action, errors: row.errors, warnings: row.warnings })),
      errors, warnings: validation.rows.flatMap(row => row.warnings.map(message => ({ line: row.line, message }))),
      counts: { ...validation.counts, invalid: validation.counts.invalid + parsed.errors.length } });
    const token = previews.create(actor(req), parsed.rows, validation.fingerprint);
    res.json({ previewToken: token, expiresInSeconds: 600, rows: validation.rows.map(row => ({ line: row.line, action: row.action, errors: [], warnings: row.warnings })), counts: validation.counts });
  })));
  app.post("/api/admin/knowledge-graph/relationships/csv/errors", adminAuthMiddleware, uploaded(guarded(async (req, res) => {
    const file = (req as any).file;
    if (!file?.buffer) throw new KnowledgeGraphValidationError("A CSV file is required");
    const parsed = parseRelationshipCsv(file.buffer);
    const validation = await service.validateCsvRows(parsed.rows);
    const errors = [...parsed.errors, ...validation.rows.flatMap(row => row.errors.map(message => ({ line: row.line, message })))];
    download(res, "knowledge-graph-relationships-errors.csv", serializeRelationshipCsv(errors.map(error => ({
      schema_version: RELATIONSHIP_CSV_VERSION, action: "skip", relationship_id: "", source_type: "", source_id: "", source_discriminator: "",
      relationship_type: "", target_type: "", target_id: "", target_discriminator: "", status: "", display_order: "", metadata: JSON.stringify({ line: error.line, error: error.message }),
    }))));
  })));
  app.post("/api/admin/knowledge-graph/relationships/csv/apply", adminAuthMiddleware, guarded(async (req, res) => {
    const token = req.body?.previewToken; const found = previews.take(token, actor(req));
    if (found.status === "missing") return res.status(410).json({ message: "CSV preview token expired or is unknown" });
    if (found.status === "foreign") return res.status(403).json({ message: "CSV preview belongs to another Admin" });
    if (found.status === "used") return res.status(409).json({ message: "CSV preview was already applied" });
    if (!previews.claim(token)) return res.status(409).json({ message: "CSV preview is already being applied" });
    try {
    if ((await service.csvFingerprint(found.entry.rows)) !== found.entry.fingerprint) { previews.release(token); return res.status(409).json({ message: "CSV preview is stale; database relationships changed" }); }
    const validation = await service.validateCsvRows(found.entry.rows);
    if (validation.counts.invalid) { previews.release(token); return res.status(409).json({ message: "CSV preview no longer validates", errors: validation.rows.filter(r => r.errors.length) }); }
    const applyRows = found.entry.rows.filter(row => row.action !== "skip").map(row => ({
      action: row.action as "create" | "update", relationshipId: row.relationshipId,
      input: { sourceEntityType: row.source.type, sourceEntityId: row.source.id, sourceDiscriminator: row.source.discriminator || null, relationshipType: row.relationshipType,
        targetEntityType: row.target.type, targetEntityId: row.target.id, targetDiscriminator: row.target.discriminator || null, status: row.status, displayOrder: row.displayOrder,
        metadata: row.metadata, ...(row.action === "create" ? { createdByAdminId: actor(req) } : {}) },
    }));
    const result = await service.repository.applyCsvRelationships(applyRows, audit(req, "knowledge-graph.relationship.csv.apply", { create: validation.counts.create, update: validation.counts.update, skip: validation.counts.skip }), async (tx) => {
      // Reconstruct all reads through the transaction. No source adapter has a
      // write path, so this is also the explicit source-preservation boundary.
      const txService = new KnowledgeGraphService(new KnowledgeGraphRepository(tx), createEntityAdapters(tx));
      if ((await txService.csvFingerprint(found.entry.rows)) !== found.entry.fingerprint) throw new CsvApplyConflictError("CSV preview is stale");
      const current = await txService.validateCsvRows(found.entry.rows);
      if (current.counts.invalid) throw new CsvApplyConflictError("CSV preview no longer validates");
    });
    previews.consume(token); res.json(result);
    } catch (error) { previews.release(token); throw error; }
  }));
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