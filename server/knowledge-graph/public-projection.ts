import { eq } from "drizzle-orm";
import {
  destinationSlugAliases, knowledgeGraphPublicState, knowledgeGraphQualityRules, temples, tirths,
} from "@shared/schema";
import type { AdminEntityDto, EntityAdapter, EntityRef, EntityType } from "./types";
import { validateEntityRef } from "./validation";
import { isValidRelationshipCombination, type RelationshipType } from "./registry";
import type { KnowledgeGraphRepository } from "./repository";
import { CANONICAL_DESTINATION_COUNTS } from "@shared/destination-import-data";

export const PUBLIC_PROJECTION_CONTRACT_VERSION = "kg-public-v1";
export const PUBLIC_PROJECTION_MAX_GROUPS = 8;
export const PUBLIC_PROJECTION_MAX_ITEMS = 12;
const CACHE_TTL_MS = 15_000;
const CACHE_MAX_ENTRIES = 500;

export interface PublicRelatedItem {
  type: EntityType;
  name: string;
  url: string;
  summary: Readonly<Record<string, string | number | boolean | null>>;
  relationshipLabel: string;
}
export interface PublicRelationshipGroup {
  relationshipType: RelationshipType;
  label: string;
  items: PublicRelatedItem[];
}
export interface PublicProjection { groups: PublicRelationshipGroup[] }
export interface EnablementFinding { code: string; entityType?: EntityType }
export interface EnablementReport {
  canEnable: boolean;
  blockerCount: number;
  findings: EnablementFinding[];
  findingsTruncated: boolean;
  contractVersion: string;
}

const LABELS: Readonly<Record<RelationshipType, string>> = {
  performed_by: "Performed by", specializes_in: "Specializes in", available_in: "Available in",
  located_in: "Located in", offers: "Offers", related_to: "Related",
  related_article: "Related articles", related_product: "Related products",
  associated_with: "Associated with", contains: "Includes", available_puja: "Available pujas",
  related_service: "Related services", related_tirth: "Related tirths",
  related_temple: "Related temples", related_yatra: "Related yatras", discusses: "Discusses",
};
const PUBLIC_STATUSES: Readonly<Record<EntityType, readonly string[]>> = {
  PUJA: ["PUBLISHED"], PANDIT: ["VERIFIED"], LOCATION: ["ACTIVE"], TIRTH: ["PUBLISHED"],
  TEMPLE: ["PUBLISHED"], PRODUCT: ["ACTIVE"], ARTICLE: ["PUBLISHED"], SERVICE: ["ACTIVE"],
  REVIEW: ["APPROVED", "PUBLISHED"], YATRA: ["ACTIVE"],
};
const SUMMARY_KEYS: Readonly<Record<EntityType, readonly string[]>> = {
  PUJA: ["category"], PANDIT: ["city", "specialization", "registrationNo"], LOCATION: ["kind", "state"],
  TIRTH: ["state"], TEMPLE: ["state"], PRODUCT: ["category", "productType"],
  ARTICLE: ["category"], SERVICE: ["category", "serviceType"], REVIEW: ["rating"],
  YATRA: ["route", "durationDays"],
};
const URL_GRAMMAR: Readonly<Partial<Record<EntityType, RegExp>>> = {
  PUJA: /^\/puja\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PANDIT: /^\/pandit\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  LOCATION: /^\/pandit\/city\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  TIRTH: /^\/tirth\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  TEMPLE: /^\/temple\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  PRODUCT: /^\/product\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  ARTICLE: /^\/blog\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
  YATRA: /^\/tirth-yatra\/[a-z0-9]+(?:-[a-z0-9]+)*$/,
};
const empty = (): PublicProjection => ({ groups: [] });
const refKey = (ref: EntityRef) => `${ref.type}:${ref.id}:${ref.discriminator || ""}`;
const refOf = (row: any, side: "source" | "target"): EntityRef => ({
  type: row[`${side}EntityType`], id: row[`${side}EntityId`],
  discriminator: row[`${side}Discriminator`] || undefined,
});

export function isPubliclyEligible(entity: AdminEntityDto): boolean {
  return PUBLIC_STATUSES[entity.type].includes(entity.status);
}
export function validCanonicalPublicUrl(type: EntityType, value: unknown): value is string {
  return typeof value === "string" && value.startsWith("/") && !value.startsWith("//")
    && !value.includes("?") && !value.includes("#") && Boolean(URL_GRAMMAR[type]?.test(value));
}
function safeSummary(entity: AdminEntityDto) {
  const result: Record<string, string | number | boolean | null> = {};
  for (const field of SUMMARY_KEYS[entity.type]) {
    const value = entity.summary[field];
    if (field === "registrationNo" && (typeof value !== "string" || !/^[0-9]{10}$/.test(value))) continue;
    if (value === null || ["string", "number", "boolean"].includes(typeof value)) result[field] = value as any;
  }
  return result;
}
function endpointIsStale(edge: any, revision: any): boolean {
  if (!revision?.updatedAt) return true;
  const edgeTime = new Date(edge.updatedAt).getTime(), revisionTime = new Date(revision.updatedAt).getTime();
  return !Number.isFinite(edgeTime) || !Number.isFinite(revisionTime) || revisionTime > edgeTime;
}

export class KnowledgeGraphPublicProjector {
  private readonly cache = new Map<string, { expires: number; value: PublicProjection }>();
  constructor(
    readonly repository: KnowledgeGraphRepository,
    readonly adapters: ReadonlyMap<EntityType, EntityAdapter>,
    readonly now: () => number = Date.now,
  ) {}

  async state() {
    const [row] = await this.repository.database.select().from(knowledgeGraphPublicState)
      .where(eq(knowledgeGraphPublicState.id, 1)).limit(1);
    if (!row) throw new Error("Knowledge Graph public state singleton is missing");
    return row;
  }

  async project(ref: EntityRef, options: { bypassGate?: boolean } = {}): Promise<PublicProjection> {
    validateEntityRef(ref);
    const state = await this.state();
    if (!options.bypassGate && !state.isPublicEnabled) return empty();
    const cacheKey = `${PUBLIC_PROJECTION_CONTRACT_VERSION}|${state.generation}|${refKey(ref)}`;
    const hit = this.cache.get(cacheKey);
    if (hit && hit.expires > this.now()) return hit.value;
    const value = await this.compute(ref);
    if (this.cache.size >= CACHE_MAX_ENTRIES) this.cache.delete(this.cache.keys().next().value!);
    this.cache.set(cacheKey, { expires: this.now() + CACHE_TTL_MS, value });
    return value;
  }

  private async compute(ref: EntityRef): Promise<PublicProjection> {
    const sourceAdapter = this.adapters.get(ref.type);
    if (!sourceAdapter) return empty();
    const source = await sourceAdapter.get(ref);
    if (!source || !isPubliclyEligible(source)) return empty();
    const scanned = await this.repository.activeOutgoingRelationships(ref, 500);
    const edges = scanned.slice(0, 500);
    const endpointRefs = [ref, ...edges.map((edge: any) => refOf(edge, "target"))];
    const revisions = new Map((await this.repository.revisionsFor(endpointRefs))
      .map((row: any) => [`${row.entityType}:${row.entityId}:${row.discriminator || ""}`, row]));
    const candidates: Array<{ edge: any; entity: AdminEntityDto }> = [];
    for (let offset = 0; offset < edges.length; offset += 20) {
      const batch = edges.slice(offset, offset + 20);
      const resolved = await Promise.all(batch.map(async (edge: any) => {
        const targetRef = refOf(edge, "target"), adapter = this.adapters.get(targetRef.type);
        if (!adapter || !isValidRelationshipCombination(ref.type, edge.relationshipType, targetRef.type)) return null;
        const target = await adapter.get(targetRef);
        if (!target || !isPubliclyEligible(target) || endpointIsStale(edge, revisions.get(refKey(ref)))
            || endpointIsStale(edge, revisions.get(refKey(targetRef))) || !validCanonicalPublicUrl(target.type, target.url)) return null;
        return { edge, entity: target };
      }));
      candidates.push(...resolved.filter(Boolean) as Array<{ edge: any; entity: AdminEntityDto }>);
    }
    candidates.sort((a, b) => a.edge.displayOrder - b.edge.displayOrder
      || a.entity.name.localeCompare(b.entity.name) || a.entity.id - b.entity.id);
    const seen = new Set<string>(), groups = new Map<RelationshipType, PublicRelationshipGroup>();
    for (const { edge, entity } of candidates) {
      if (seen.has(entity.url!)) continue;
      const relationshipType = edge.relationshipType as RelationshipType;
      let group = groups.get(relationshipType);
      if (!group) {
        if (groups.size >= PUBLIC_PROJECTION_MAX_GROUPS) continue;
        group = { relationshipType, label: LABELS[relationshipType], items: [] };
        groups.set(relationshipType, group);
      }
      if (group.items.length >= PUBLIC_PROJECTION_MAX_ITEMS) continue;
      seen.add(entity.url!);
      group.items.push({ type: entity.type, name: entity.name, url: entity.url!,
        summary: safeSummary(entity), relationshipLabel: LABELS[relationshipType] });
    }
    return { groups: Array.from(groups.values()) };
  }

  /** Full server-side launch check. Findings never contain record IDs, names, URLs, or private state. */
  async enablementReport(): Promise<EnablementReport> {
    const findings: EnablementFinding[] = []; let blockerCount = 0;
    const add = (code: string, entityType?: EntityType) => {
      blockerCount++; if (findings.length < 100) findings.push({ code, ...(entityType ? { entityType } : {}) });
    };
    const [scannedEdges, rules, tirthRows, templeRows, aliases] = await Promise.all([
      this.repository.activeRelationships(5000), this.repository.database.select().from(knowledgeGraphQualityRules).limit(501),
      this.repository.database.select().from(tirths).limit(501),
      this.repository.database.select().from(temples).limit(501),
      this.repository.database.select().from(destinationSlugAliases).limit(1001),
    ]);
    if (scannedEdges.length > 5000) add("GRAPH_SCAN_LIMIT");
    if (rules.length > 500 || tirthRows.length > 500 || templeRows.length > 500 || aliases.length > 1000) add("ENABLEMENT_SCAN_LIMIT");
    const edges = scannedEdges.slice(0, 5000);
    const activeBySource = new Map<string, any[]>();
    for (const edge of edges) {
      const sourceKey = refKey(refOf(edge, "source"));
      const sourceEdges = activeBySource.get(sourceKey) || [];
      sourceEdges.push(edge); activeBySource.set(sourceKey, sourceEdges);
    }
    for (const sourceEdges of Array.from(activeBySource.values())) {
      if (sourceEdges.length > 500) add("SOURCE_PROJECTION_SCAN_LIMIT", refOf(sourceEdges[0], "source").type);
    }
    if (tirthRows.filter((r: any) => r.provenance !== "EDITORIAL").length !== CANONICAL_DESTINATION_COUNTS.tirth) add("CANONICAL_MIGRATION_COUNT", "TIRTH");
    if (templeRows.filter((r: any) => r.provenance !== "EDITORIAL").length !== CANONICAL_DESTINATION_COUNTS.temple) add("CANONICAL_MIGRATION_COUNT", "TEMPLE");
    if (aliases.length !== CANONICAL_DESTINATION_COUNTS.alias) add("CANONICAL_ALIAS_COUNT");
    for (const [type, rows] of [["TIRTH", tirthRows], ["TEMPLE", templeRows]] as const) {
      const sourceKeys = new Set<string>(), slugs = new Set<string>();
      for (const row of rows) {
        if (typeof row.migrationSourceKey !== "string" || !row.migrationSourceKey
            || typeof row.slug !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(row.slug)
            || sourceKeys.has(row.migrationSourceKey) || slugs.has(row.slug)) add("CANONICAL_MIGRATION_INTEGRITY", type);
        sourceKeys.add(row.migrationSourceKey); slugs.add(row.slug);
      }
    }
    const destinations = new Map<string, any>();
    [...tirthRows.map((r: any) => ({ ...r, type: "TIRTH" })), ...templeRows.map((r: any) => ({ ...r, type: "TEMPLE" }))]
      .forEach((r: any) => destinations.set(`${r.type}:${r.id}`, r));
    for (const alias of aliases) {
      const owner = destinations.get(`${alias.entityType}:${alias.entityId}`);
      const canonicalCollision = destinations.get(`${alias.entityType}:${Array.from(destinations.values())
        .find((row: any) => row.type === alias.entityType && row.slug === alias.aliasSlug)?.id || 0}`);
      if (!owner || owner.slug !== alias.canonicalSlug || owner.slug === alias.aliasSlug || canonicalCollision) {
        add("ALIAS_OWNERSHIP", alias.entityType);
      }
    }
    const entities = new Map<string, AdminEntityDto | null>();
    const resolve = async (ref: EntityRef) => {
      const k = refKey(ref); if (entities.has(k)) return entities.get(k)!;
      const value = await this.adapters.get(ref.type)?.get(ref) || null; entities.set(k, value); return value;
    };
    const active = edges;
    const edgeRefs = active.flatMap((edge: any) => [refOf(edge, "source"), refOf(edge, "target")]);
    const revisionRows: any[] = [];
    for (let offset = 0; offset < edgeRefs.length; offset += 500) {
      revisionRows.push(...await this.repository.revisionsFor(edgeRefs.slice(offset, offset + 500)));
    }
    const revisionMap = new Map(revisionRows.map(row => [`${row.entityType}:${row.entityId}:${row.discriminator || ""}`, row]));
    for (let offset = 0; offset < active.length; offset += 20) {
      const batch = active.slice(offset, offset + 20);
      const endpoints = await Promise.all(batch.flatMap((edge: any) => [refOf(edge, "source"), refOf(edge, "target")]).map(resolve));
      for (let index = 0; index < batch.length; index++) {
      const edge = batch[index];
      const sourceRef = refOf(edge, "source"), targetRef = refOf(edge, "target");
      const source = endpoints[index * 2], target = endpoints[index * 2 + 1];
      if (!this.adapters.has(sourceRef.type) || !this.adapters.has(targetRef.type)) add("UNSUPPORTED_ENTITY_ADAPTER", !this.adapters.has(sourceRef.type) ? sourceRef.type : targetRef.type);
      if (!source || !target || endpointIsStale(edge, revisionMap.get(refKey(sourceRef)))
          || endpointIsStale(edge, revisionMap.get(refKey(targetRef)))) add("STALE_ACTIVE_EDGE", targetRef.type);
      if (!source || !isPubliclyEligible(source)) add("SOURCE_NOT_PUBLICLY_ELIGIBLE", sourceRef.type);
      if (!target || !isPubliclyEligible(target)) add("TARGET_NOT_PUBLICLY_ELIGIBLE", targetRef.type);
      if (!isValidRelationshipCombination(sourceRef.type, edge.relationshipType, targetRef.type)) add("UNSUPPORTED_REGISTRY_COMBINATION", targetRef.type);
      if (!target || !validCanonicalPublicUrl(target.type, target.url)) add("INVALID_CANONICAL_TARGET_URL", targetRef.type);
      }
    }
    for (const rule of rules.slice(0, 500).filter((r: any) => r.isActive)) {
      const sourceRefs = new Map<string, EntityRef>();
      for (const [sourceKey, sourceEdges] of Array.from(activeBySource.entries())) {
        if (sourceEdges[0].sourceEntityType === rule.sourceEntityType) sourceRefs.set(sourceKey, refOf(sourceEdges[0], "source"));
      }
      const sourceAdapter = this.adapters.get(rule.sourceEntityType);
      if (sourceAdapter) {
        for (const discriminator of rule.sourceEntityType === "LOCATION" ? ["STATE", "CITY"] as const : [undefined]) {
          for (let offset = 0; offset < 500; offset += 100) {
            const page = await sourceAdapter.search({ term: "", limit: 100, offset, discriminator });
            for (const entity of page) {
              if (isPubliclyEligible(entity)) sourceRefs.set(refKey(entity), entity);
            }
            if (page.length < 100) break;
            if (offset === 400) add("ENABLEMENT_SCAN_LIMIT", rule.sourceEntityType);
          }
        }
      }
      for (const sourceRef of Array.from(sourceRefs.values())) {
        const count = (activeBySource.get(refKey(sourceRef)) || []).filter((e: any) =>
          e.relationshipType === rule.relationshipType && rule.allowedTargetEntityTypes.includes(e.targetEntityType)).length;
        if (count < rule.minimumRequiredCount) add("ACTIVE_QUALITY_RULE_FAILURE", sourceRef.type);
      }
    }
    const contractSamples: Partial<Record<EntityType, string>> = {
      PUJA: "/puja/a", PANDIT: "/pandit/a", LOCATION: "/pandit/city/a", TIRTH: "/tirth/a",
      TEMPLE: "/temple/a", PRODUCT: "/product/a", ARTICLE: "/blog/a", YATRA: "/tirth-yatra/a",
    };
    if (Object.keys(LABELS).length !== 16 || Object.entries(contractSamples)
      .some(([type, url]) => !validCanonicalPublicUrl(type as EntityType, url))) {
      add("PROJECTION_CONTRACT_SELF_CHECK");
    }
    return { canEnable: blockerCount === 0, blockerCount, findings,
      findingsTruncated: blockerCount > findings.length, contractVersion: PUBLIC_PROJECTION_CONTRACT_VERSION };
  }
}
