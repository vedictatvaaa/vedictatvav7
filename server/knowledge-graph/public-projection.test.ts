import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeGraphPublicProjector } from "./public-projection";
import { destinationSlugAliases, knowledgeGraphQualityRules, temples, tirths } from "@shared/schema";
import { CANONICAL_DESTINATION_COUNTS } from "@shared/destination-import-data";

const entity = (id: number, overrides: any = {}) => ({
  type: "TEMPLE", id, name: `Temple ${id}`, status: "PUBLISHED",
  url: `/temple/temple-${id}`, updatedAt: "2026-01-01T00:00:00.000Z",
  summary: { state: "UP", provenance: "PRIVATE", secret: "no" }, ...overrides,
});
function fixture() {
  const state = { isPublicEnabled: false, generation: 1 };
  const records = new Map<string, any>([
    ["PUJA:1:", { type: "PUJA", id: 1, name: "Puja", status: "PUBLISHED",
      url: "/puja/puja", updatedAt: null, summary: { category: "vedic" } }],
    ["TEMPLE:2:", entity(2)], ["TEMPLE:3:", entity(3)],
  ]);
  let relationshipReads = 0, entityReads = 0;
  const database: any = {
    select: () => ({ from: () => ({ where: () => ({ limit: async () => [state] }) }) }),
  };
  const edges: any[] = [];
  const repository: any = {
    database,
    activeOutgoingRelationships: async (ref: any, limit: number) => {
      relationshipReads++;
      return edges
        .filter(edge => edge.status === "ACTIVE"
          && edge.sourceEntityType === ref.type
          && edge.sourceEntityId === ref.id
          && (edge.sourceDiscriminator || "") === (ref.discriminator || ""))
        .sort((a, b) => a.displayOrder - b.displayOrder
          || a.relationshipType.localeCompare(b.relationshipType)
          || a.id - b.id)
        .slice(0, limit + 1);
    },
    revisionsFor: async (refs: any[]) => refs.map(ref => ({
      entityType: ref.type, entityId: ref.id, discriminator: ref.discriminator || "",
      updatedAt: records.get(`${ref.type}:${ref.id}:${ref.discriminator || ""}`)?.updatedAt || "2026-01-01T00:00:00.000Z",
    })),
  };
  const adapter = (type: string): any => ({
    type,
    get: async (ref: any) => { entityReads++; return records.get(`${ref.type}:${ref.id}:${ref.discriminator || ""}`) || null; },
    exists: async () => true, search: async () => [],
  });
  const adapters: any = new Map([["PUJA", adapter("PUJA")], ["TEMPLE", adapter("TEMPLE")]]);
  return { state, records, edges, repository, adapters,
    reads: () => ({ relationshipReads, entityReads }) };
}
const edge = (id: number, targetId: number, overrides: any = {}) => ({
  id, sourceEntityType: "PUJA", sourceEntityId: 1, sourceDiscriminator: null,
  relationshipType: "related_temple", targetEntityType: "TEMPLE", targetEntityId: targetId,
  targetDiscriminator: null, status: "ACTIVE", displayOrder: 0,
  updatedAt: "2026-02-01T00:00:00.000Z", ...overrides,
});

test("public projection is empty while gate is off and preview bypasses only that gate", async () => {
  const f = fixture(); f.edges.push(edge(1, 2));
  const projector = new KnowledgeGraphPublicProjector(f.repository, f.adapters);
  assert.deepEqual(await projector.project({ type: "PUJA", id: 1 }), { groups: [] });
  const preview = await projector.project({ type: "PUJA", id: 1 }, { bypassGate: true });
  assert.equal(preview.groups[0].items[0].url, "/temple/temple-2");
  f.state.isPublicEnabled = true;
  assert.deepEqual(await projector.project({ type: "PUJA", id: 1 }), preview);
});

test("projection applies eligibility, active, stale, registry, and URL rules", async () => {
  const f = fixture(); f.state.isPublicEnabled = true;
  f.records.set("TEMPLE:4:", entity(4, { status: "DRAFT" }));
  f.records.set("TEMPLE:5:", entity(5, { url: "https://evil.example/a" }));
  f.records.set("TEMPLE:6:", entity(6, { updatedAt: "2027-01-01T00:00:00.000Z" }));
  f.edges.push(edge(1, 2), edge(2, 3, { status: "DRAFT" }), edge(3, 4), edge(4, 5),
    edge(5, 6), edge(6, 3, { relationshipType: "performed_by" }));
  const result = await new KnowledgeGraphPublicProjector(f.repository, f.adapters)
    .project({ type: "PUJA", id: 1 });
  assert.deepEqual(result.groups.flatMap(g => g.items.map(i => i.url)), ["/temple/temple-2"]);
  f.records.get("PUJA:1:").status = "DRAFT";
  f.state.generation++;
  assert.deepEqual(await new KnowledgeGraphPublicProjector(f.repository, f.adapters)
    .project({ type: "PUJA", id: 1 }), { groups: [] });
});

test("a revision newer than an edge on either endpoint removes it", async () => {
  const f = fixture(); f.state.isPublicEnabled = true; f.edges.push(edge(1, 2));
  f.records.get("PUJA:1:").updatedAt = "2027-01-01T00:00:00.000Z";
  let result = await new KnowledgeGraphPublicProjector(f.repository, f.adapters).project({ type: "PUJA", id: 1 });
  assert.deepEqual(result, { groups: [] });
  f.records.get("PUJA:1:").updatedAt = null;
  f.records.get("TEMPLE:2:").updatedAt = "2027-01-01T00:00:00.000Z";
  f.state.generation++;
  result = await new KnowledgeGraphPublicProjector(f.repository, f.adapters).project({ type: "PUJA", id: 1 });
  assert.deepEqual(result, { groups: [] });
});

test("ordering, URL dedupe, safe DTO, cache hit, and generation key are deterministic", async () => {
  const f = fixture(); f.state.isPublicEnabled = true;
  f.records.set("TEMPLE:3:", entity(3, { name: "A Temple", url: "/temple/shared" }));
  f.records.set("TEMPLE:2:", entity(2, { name: "B Temple", url: "/temple/shared" }));
  f.edges.push(edge(2, 2, { displayOrder: 4 }), edge(1, 3, { displayOrder: 1 }));
  const projector = new KnowledgeGraphPublicProjector(f.repository, f.adapters);
  const first = await projector.project({ type: "PUJA", id: 1 });
  assert.equal(first.groups[0].items.length, 1);
  assert.deepEqual(first.groups[0].items[0], {
    type: "TEMPLE", name: "A Temple", url: "/temple/shared", summary: { state: "UP" },
    relationshipLabel: "Related temples",
  });
  assert.equal("id" in first.groups[0].items[0], false);
  await projector.project({ type: "PUJA", id: 1 });
  assert.equal(f.reads().relationshipReads, 1);
  f.state.generation++;
  await projector.project({ type: "PUJA", id: 1 });
  assert.equal(f.reads().relationshipReads, 2);
});

test("enablement blocks a missing canonical alias and accepts the complete five-alias contract", async () => {
  assert.equal(CANONICAL_DESTINATION_COUNTS.alias, 5);
  const tirthRows = Array.from({ length: CANONICAL_DESTINATION_COUNTS.tirth }, (_, index) => ({
    id: index + 1, provenance: "TIRTH_GUIDE", migrationSourceKey: `tirth:${index + 1}`, slug: `tirth-${index + 1}`,
  }));
  const templeRows = Array.from({ length: CANONICAL_DESTINATION_COUNTS.temple }, (_, index) => ({
    id: index + 1, provenance: "TEMPLE_TOURISM", migrationSourceKey: `temple:${index + 1}`, slug: `temple-${index + 1}`,
  }));
  const completeAliases = Array.from({ length: 5 }, (_, index) => ({
    entityType: "TIRTH", entityId: index + 1, aliasSlug: `legacy-${index + 1}`,
    canonicalSlug: `tirth-${index + 1}`,
  }));
  const report = async (aliases: any[]) => {
    const database: any = {
      select: () => ({ from: (table: any) => ({ limit: async () => {
        if (table === knowledgeGraphQualityRules) return [];
        if (table === tirths) return tirthRows;
        if (table === temples) return templeRows;
        if (table === destinationSlugAliases) return aliases;
        throw new Error("unexpected enablement table");
      } }) }),
    };
    const repository: any = { database, activeRelationships: async () => [], revisionsFor: async () => [] };
    return new KnowledgeGraphPublicProjector(repository, new Map()).enablementReport();
  };
  const missing = await report(completeAliases.slice(0, 4));
  assert.equal(missing.canEnable, false);
  assert.ok(missing.findings.some(finding => finding.code === "CANONICAL_ALIAS_COUNT"));
  const complete = await report(completeAliases);
  assert.equal(complete.findings.some(finding => finding.code === "CANONICAL_ALIAS_COUNT"), false);
  assert.equal(complete.canEnable, true);
});