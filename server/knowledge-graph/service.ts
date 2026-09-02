import { ENTITY_TYPES, type AdminEntityDto, type EntityRef, type EntityType, KnowledgeGraphValidationError, UnsupportedEntitySourceError } from "./types";
import { isEntityType, isRelationshipType, isValidRelationshipCombination, RELATIONSHIP_DEFINITIONS } from "./registry";
import { displayOrder, pagination, positiveEntityId, safeMetadata, validateEntityRef, validateRelationship } from "./validation";
import { KnowledgeGraphRepository } from "./repository";
import type { GraphAudit } from "./repository";

const supported: EntityType[] = ENTITY_TYPES.filter((type) => type !== "TIRTH" && type !== "TEMPLE");
const refOf = (row: any, side: "source" | "target"): EntityRef => ({
  type: row[`${side}EntityType`], id: row[`${side}EntityId`], discriminator: row[`${side}Discriminator`] || undefined,
});
const key = (ref: EntityRef) => `${ref.type}:${ref.id}:${ref.discriminator || ""}`;
const status = (value: unknown) => {
  if (value !== "ACTIVE" && value !== "DRAFT") throw new KnowledgeGraphValidationError("status must be ACTIVE or DRAFT");
  return value;
};

export class KnowledgeGraphService {
  constructor(readonly repository: KnowledgeGraphRepository, readonly adapters: ReadonlyMap<EntityType, any>) {}
  private adapter(type: EntityType) {
    const adapter = this.adapters.get(type);
    if (!adapter) throw new KnowledgeGraphValidationError("Entity source is unsupported");
    return adapter;
  }
  async createRelationship(input: any, actorId: number, audit?: GraphAudit) {
    if (!input || typeof input !== "object" || !input.source || typeof input.source !== "object" || !input.target || typeof input.target !== "object") {
      throw new KnowledgeGraphValidationError("Relationship source and target are required");
    }
    const relationshipType = input.relationshipType;
    if (!isRelationshipType(relationshipType)) throw new KnowledgeGraphValidationError("Unknown relationship type");
    const valid = await validateRelationship({ ...input, relationshipType }, this.adapters, () => this.repository.exactRelationship(input));
    const row = {
      sourceEntityType: valid.source.type, sourceEntityId: valid.source.id, sourceDiscriminator: valid.source.discriminator || null,
      relationshipType, targetEntityType: valid.target.type, targetEntityId: valid.target.id, targetDiscriminator: valid.target.discriminator || null,
      status: input.status === undefined ? "ACTIVE" : status(input.status), displayOrder: valid.displayOrder, metadata: valid.metadata, createdByAdminId: actorId,
    };
    return audit && (this.repository as any).createRelationshipWithAudit
      ? (this.repository as any).createRelationshipWithAudit(row, audit) : this.repository.createRelationship(row);
  }
  async patchRelationship(id: number, patch: any, audit?: GraphAudit) {
    positiveEntityId(id);
    const allowed = new Set(["status", "displayOrder", "metadata"]);
    if (!patch || typeof patch !== "object" || Object.keys(patch).length === 0 || Object.keys(patch).some((k) => !allowed.has(k))) {
      throw new KnowledgeGraphValidationError("Only status, displayOrder, and metadata may be updated");
    }
    const existing = await this.repository.getRelationship(id);
    if (!existing) return null;
    const update = {
      ...(patch.status !== undefined ? { status: status(patch.status) } : {}),
      ...(patch.displayOrder !== undefined ? { displayOrder: displayOrder(patch.displayOrder) } : {}),
      ...(patch.metadata !== undefined ? { metadata: safeMetadata(patch.metadata) } : {}),
    };
    return audit && (this.repository as any).patchRelationshipWithAudit
      ? (this.repository as any).patchRelationshipWithAudit(id, update, audit) : this.repository.patchRelationship(id, update);
  }
  async entity(ref: EntityRef) {
    this.checkedType(ref.type);
    validateEntityRef(ref);
    const entity = await this.adapter(ref.type).get(ref);
    if (!entity) return null;
    const edges = await this.repository.relationshipsFor(ref);
    const resolved = await Promise.all(edges.map(async (edge: any) => {
      const outgoing = key(refOf(edge, "source")) === key(ref);
      const other = refOf(edge, outgoing ? "target" : "source");
      try {
        const related = await this.adapter(other.type).get(other);
        return { ...edge, direction: outgoing ? "outgoing" : "incoming", entity: related, stale: related === null };
      }
      catch (error) { if (error instanceof UnsupportedEntitySourceError) return { ...edge, direction: outgoing ? "outgoing" : "incoming", entity: null, stale: true }; throw error; }
    }));
    const group = (direction: string) => resolved.filter((e) => e.direction === direction).reduce((groups: Record<string, any[]>, edge) => {
      (groups[edge.relationshipType] ||= []).push(this.edgeDto(edge)); return groups;
    }, {});
    return { entity, connectionCount: resolved.length, incoming: group("incoming"), outgoing: group("outgoing") };
  }
  edgeDto(row: any) {
    return { id: row.id, relationshipType: row.relationshipType, status: row.status, displayOrder: row.displayOrder, metadata: row.metadata,
      createdAt: row.createdAt, updatedAt: row.updatedAt, stale: Boolean(row.stale), entity: row.entity || null };
  }
  async search(input: { type?: unknown; term?: unknown; page?: unknown; limit?: unknown; discriminator?: unknown; status?: unknown }) {
    const { page, limit, offset } = pagination(input);
    const types = input.type === undefined ? supported : [this.checkedType(input.type)];
    const discriminator = input.discriminator === "CITY" || input.discriminator === "STATE" ? input.discriminator : undefined;
    if (input.discriminator !== undefined && !discriminator) throw new KnowledgeGraphValidationError("Invalid location discriminator");
    if (discriminator && types.some((type) => type !== "LOCATION")) throw new KnowledgeGraphValidationError("Only LOCATION accepts a discriminator");
    const term = typeof input.term === "string" ? input.term.trim() : input.term === undefined ? "" : (() => { throw new KnowledgeGraphValidationError("Search term must be a string"); })();
    if (term.length > 120) throw new KnowledgeGraphValidationError("Search term is too long");
    const entityStatus = input.status;
    if (entityStatus !== undefined && typeof entityStatus !== "string") throw new KnowledgeGraphValidationError("status must be a string");
    // Status is normalized by adapters, so it must be filtered before page
    // slicing. Chunk raw adapter pages until this bounded request window has
    // enough matching candidates.
    const rows = (await Promise.all(types.map((type) => this.fromAdapterUntil(type, term, offset + limit, discriminator, entityStatus)))).flat()
      .sort((a: AdminEntityDto, b: AdminEntityDto) => a.name.localeCompare(b.name));
    const edges = await this.repository.allRelationships();
    const connectionCounts = new Map<string, number>();
    edges.forEach((edge: any) => {
      connectionCounts.set(key(refOf(edge, "source")), (connectionCounts.get(key(refOf(edge, "source"))) || 0) + 1);
      connectionCounts.set(key(refOf(edge, "target")), (connectionCounts.get(key(refOf(edge, "target"))) || 0) + 1);
    });
    const pageItems = rows.slice(offset, offset + limit);
    return { page, limit, items: pageItems.map((entity: AdminEntityDto) => ({ ...entity, connectionCount: connectionCounts.get(key(entity)) || 0 })) };
  }
  async summary() {
    const edges = await this.repository.allRelationships();
    const entities = (await Promise.all(supported.map(async (type) => this.allFromAdapter(type, "")))).flat();
    const liveEntityKeys = new Set(entities.map((entity) => key(entity)));
    const activeKeys = new Set(
      edges
        .filter((edge: any) => edge.status === "ACTIVE")
        .flatMap((edge: any) => [key(refOf(edge, "source")), key(refOf(edge, "target"))])
        .filter((entityKey: string) => liveEntityKeys.has(entityKey)),
    );
    const byEntityType = Object.fromEntries(ENTITY_TYPES.map((type) => [type, entities.filter((e) => e.type === type).length]));
    const byRelationshipType: Record<string, number> = {};
    edges.forEach((e: any) => { byRelationshipType[e.relationshipType] = (byRelationshipType[e.relationshipType] || 0) + 1; });
    return { totalSupportedEntities: entities.length, relationships: edges.length, connectedUniqueEntities: activeKeys.size,
      orphans: entities.filter((e) => !activeKeys.has(key(e))).length, draftRelationships: edges.filter((e: any) => e.status === "DRAFT").length,
      byEntityType, byRelationshipType, recentActivity: edges.slice(0, 20).map((e: any) => this.edgeDto(e)) };
  }
  async orphans(input: any) {
    const type = this.checkedType(input.type);
    const { page, limit } = pagination(input);
    const term = typeof input.term === "string" ? input.term.trim() : input.term === undefined ? "" : (() => { throw new KnowledgeGraphValidationError("Search term must be a string"); })();
    if (term.length > 120) throw new KnowledgeGraphValidationError("Search term is too long");
    const discriminator = input.discriminator === "CITY" || input.discriminator === "STATE" ? input.discriminator : undefined;
    if (input.discriminator !== undefined && !discriminator) throw new KnowledgeGraphValidationError("Invalid location discriminator");
    if (discriminator && type !== "LOCATION") throw new KnowledgeGraphValidationError("Only LOCATION accepts a discriminator");
    const result = await this.repository.orphans(type, discriminator, term, page, limit);
    return { page, limit, ...result };
  }
  async health(input: any = {}) {
    const type = input.type === undefined ? undefined : this.checkedType(input.type);
    const { page, limit } = pagination(input);
    const allEntities = (await Promise.all(supported.map((t) => this.allFromAdapter(t, "")))).flat();
    const entities = type ? allEntities.filter((entity) => entity.type === type) : allEntities;
    const [edges, rules] = await Promise.all([this.repository.allRelationships(), this.repository.listRules()]);
    // The complete source enumeration above is also an existence index.  This
    // avoids an adapter round trip for every edge and preserves LOCATION's
    // discriminator as part of its identity.
    const existing = new Set(allEntities.map(key));
    const adjacency = new Map<string, any[]>();
    for (const edge of edges) {
      if (edge.status !== "ACTIVE") continue;
      const sourceKey = key(refOf(edge, "source")); const targetKey = key(refOf(edge, "target"));
      (adjacency.get(sourceKey) || (adjacency.set(sourceKey, []), adjacency.get(sourceKey)!)).push(edge);
      (adjacency.get(targetKey) || (adjacency.set(targetKey, []), adjacency.get(targetKey)!)).push(edge);
    }
    const findings = entities.map((entity) => {
      const connected = adjacency.get(key(entity)) || [];
      let state = connected.length === 0 ? "NO_RELATIONSHIPS" : connected.length === 1 ? "ONLY_ONE_RELATIONSHIP" : "CONNECTED";
      const stale = connected.some((edge: any) => !existing.has(key(refOf(edge, "source"))) || !existing.has(key(refOf(edge, "target"))));
      if (stale) state = "INVALID_OR_STALE_RELATIONSHIP";
      else if (rules.some((rule: any) => rule.isActive && rule.sourceEntityType === entity.type &&
        connected.filter((e: any) => key(refOf(e, "source")) === key(entity) && e.relationshipType === rule.relationshipType && rule.allowedTargetEntityTypes.includes(refOf(e, "target").type)).length < rule.minimumRequiredCount)) state = "MISSING_CONFIGURED_RELATIONSHIP";
      return { entity, state, connectionCount: connected.length };
    });
    return { page, limit, total: findings.length, items: findings.slice((page - 1) * limit, page * limit) };
  }
  async createRule(input: any, actorId: number, audit?: GraphAudit) {
    if (!isEntityType(input?.sourceEntityType) || !isRelationshipType(input?.relationshipType) || !Array.isArray(input?.allowedTargetEntityTypes) || input.allowedTargetEntityTypes.length < 1 || input.allowedTargetEntityTypes.length > 10 || !input.allowedTargetEntityTypes.every((type: unknown) => isEntityType(type) && isValidRelationshipCombination(input.sourceEntityType, input.relationshipType, type))) throw new KnowledgeGraphValidationError("Invalid quality rule");
    const min = input.minimumRequiredCount === undefined ? 1 : input.minimumRequiredCount;
    if (!Number.isSafeInteger(min) || min < 1 || min > 100) throw new KnowledgeGraphValidationError("minimumRequiredCount must be between 1 and 100");
    if (input.isActive !== undefined && typeof input.isActive !== "boolean") throw new KnowledgeGraphValidationError("isActive must be a boolean");
    const row = { sourceEntityType: input.sourceEntityType, relationshipType: input.relationshipType, allowedTargetEntityTypes: Array.from(new Set(input.allowedTargetEntityTypes)), minimumRequiredCount: min, isActive: input.isActive === undefined ? true : input.isActive, createdByAdminId: actorId };
    return audit && (this.repository as any).createRuleWithAudit ? (this.repository as any).createRuleWithAudit(row, audit) : this.repository.createRule(row);
  }
  async patchRule(id: number, patch: any, audit?: GraphAudit) {
    positiveEntityId(id); const allowed = new Set(["allowedTargetEntityTypes", "minimumRequiredCount", "isActive"]);
    if (!patch || typeof patch !== "object" || Object.keys(patch).length === 0 || Object.keys(patch).some((k) => !allowed.has(k))) throw new KnowledgeGraphValidationError("Invalid quality rule update");
    const existing = await this.repository.getRule(id); if (!existing) return null;
    const merged = { ...existing, ...patch };
    if (!Array.isArray(merged.allowedTargetEntityTypes) || merged.allowedTargetEntityTypes.length < 1 || merged.allowedTargetEntityTypes.length > 10 || !merged.allowedTargetEntityTypes.every((type: unknown) => isEntityType(type) && isValidRelationshipCombination(existing.sourceEntityType as EntityType, existing.relationshipType as any, type))) throw new KnowledgeGraphValidationError("Invalid quality rule");
    if (!Number.isSafeInteger(merged.minimumRequiredCount) || merged.minimumRequiredCount < 1 || merged.minimumRequiredCount > 100) throw new KnowledgeGraphValidationError("minimumRequiredCount must be between 1 and 100");
    if (typeof merged.isActive !== "boolean") throw new KnowledgeGraphValidationError("isActive must be a boolean");
    const update = { allowedTargetEntityTypes: Array.from(new Set(merged.allowedTargetEntityTypes)), minimumRequiredCount: merged.minimumRequiredCount, isActive: merged.isActive };
    return audit && (this.repository as any).patchRuleWithAudit ? (this.repository as any).patchRuleWithAudit(id, update, audit) : this.repository.patchRule(id, update);
  }
  async deleteRelationship(id: number, audit?: GraphAudit) {
    positiveEntityId(id);
    return audit && (this.repository as any).deleteRelationshipWithAudit ? (this.repository as any).deleteRelationshipWithAudit(id, audit) : this.repository.deleteRelationship(id);
  }
  async deleteRule(id: number, audit?: GraphAudit) {
    positiveEntityId(id);
    return audit && (this.repository as any).deleteRuleWithAudit ? (this.repository as any).deleteRuleWithAudit(id, audit) : this.repository.deleteRule(id);
  }
  checkedType(value: unknown): EntityType {
    if (!isEntityType(value)) throw new KnowledgeGraphValidationError("Unknown entity type");
    if (!supported.includes(value)) throw new UnsupportedEntitySourceError(value);
    return value;
  }
  private async allFromAdapter(type: EntityType, term: string, discriminator?: unknown): Promise<AdminEntityDto[]> {
    const safeDiscriminator = discriminator === "CITY" || discriminator === "STATE" ? discriminator : undefined;
    if (discriminator !== undefined && !safeDiscriminator) throw new KnowledgeGraphValidationError("Invalid location discriminator");
    const items: AdminEntityDto[] = [];
    for (let offset = 0; ; offset += 100) {
      const page = await this.adapter(type).search({ term, limit: 100, offset, discriminator: safeDiscriminator });
      items.push(...page);
      if (page.length < 100) return items;
    }
  }
  private async fromAdapterUntil(type: EntityType, term: string, required: number, discriminator?: "CITY" | "STATE", entityStatus?: unknown): Promise<AdminEntityDto[]> {
    const items: AdminEntityDto[] = [];
    for (let offset = 0; items.length < required; offset += 100) {
      const rows = await this.adapter(type).search({ term, limit: 100, offset, discriminator, status: entityStatus });
      items.push(...rows.filter((entity: AdminEntityDto) => entityStatus === undefined || entity.status === entityStatus));
      if (rows.length < 100 || items.length >= required) return items;
    }
    return items;
  }
  definitions() { return RELATIONSHIP_DEFINITIONS; }
}