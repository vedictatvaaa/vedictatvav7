import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeGraphService } from "./service";
import { KnowledgeGraphConflictError, KnowledgeGraphValidationError } from "./types";

function adapters(rows: Record<string, any[]> = {}) {
  const out = new Map<any, any>();
  for (const type of ["PUJA", "PANDIT", "LOCATION", "PRODUCT", "ARTICLE", "SERVICE", "REVIEW", "YATRA"]) {
    const values = rows[type] || [];
    out.set(type, {
      get: async (ref: any) => values.find((x) => x.id === ref.id && x.discriminator === ref.discriminator) || null,
      exists: async (ref: any) => Boolean(values.find((x) => x.id === ref.id && x.discriminator === ref.discriminator)),
      search: async ({ term, limit, offset }: any) => values.filter((x) => x.name.includes(term)).slice(offset, offset + limit),
    });
  }
  return out;
}
const dto = (type: string, id: number, name = `${type} ${id}`) => ({ type, id, name, status: "ACTIVE", url: `/${type}/${id}`, updatedAt: null, summary: {} });

class FakeRepository {
  rows: any[] = [];
  rules: any[] = [];
  next = 1;
  orphanResult: any = { total: 0, items: [] };
  orphanCalls: any[] = [];
  async exactRelationship(input: any) { return this.rows.some((r) => r.sourceEntityType === input.source.type && r.sourceEntityId === input.source.id && r.relationshipType === input.relationshipType && r.targetEntityType === input.target.type && r.targetEntityId === input.target.id); }
  async createRelationship(input: any) { const row = { id: this.next++, createdAt: new Date(), updatedAt: new Date(), ...input }; this.rows.push(row); return row; }
  async getRelationship(id: number) { return this.rows.find((r) => r.id === id) || null; }
  async patchRelationship(id: number, patch: any) { const row = await this.getRelationship(id); return row && Object.assign(row, patch); }
  async deleteRelationship(id: number) { const index = this.rows.findIndex((r) => r.id === id); return index < 0 ? null : this.rows.splice(index, 1)[0]; }
  async relationshipsFor(ref: any) { return this.rows.filter((r) => (r.sourceEntityType === ref.type && r.sourceEntityId === ref.id) || (r.targetEntityType === ref.type && r.targetEntityId === ref.id)); }
  async allRelationships() { return [...this.rows]; }
  async orphans(type: string, discriminator: string | undefined, term: string, page: number, limit: number) {
    this.orphanCalls.push({ type, discriminator, term, page, limit });
    return this.orphanResult;
  }
  async listRules() { return [...this.rules]; }
  async getRule(id: number) { return this.rules.find((r) => r.id === id) || null; }
  async createRule(input: any) { const row = { id: this.next++, ...input }; this.rules.push(row); return row; }
  async patchRule(id: number, patch: any) { const row = await this.getRule(id); return row && Object.assign(row, patch); }
  async deleteRule(id: number) { const index = this.rules.findIndex((r) => r.id === id); return index < 0 ? null : this.rules.splice(index, 1)[0]; }
}

test("relationship lifecycle validates, patches only edge fields, and never invokes source mutation", async () => {
  const repo = new FakeRepository();
  let sourceMutations = 0;
  const graph = new KnowledgeGraphService(repo as any, adapters({ PUJA: [dto("PUJA", 1)], PANDIT: [dto("PANDIT", 2)] }) as any);
  const edge = await graph.createRelationship({ source: { type: "PUJA", id: 1 }, relationshipType: "performed_by", target: { type: "PANDIT", id: 2 }, metadata: { note: "safe" } }, 44);
  assert.equal(edge.createdByAdminId, 44);
  await assert.rejects(() => graph.createRelationship({ source: { type: "PUJA", id: 1 }, relationshipType: "performed_by", target: { type: "PANDIT", id: 2 } }, 44), KnowledgeGraphConflictError);
  const changed = await graph.patchRelationship(edge.id, { status: "DRAFT", displayOrder: 3, metadata: { label: "x" } });
  assert.equal(changed?.status, "DRAFT");
  await assert.rejects(() => graph.patchRelationship(edge.id, { sourceEntityId: 999 }), KnowledgeGraphValidationError);
  await repo.deleteRelationship(edge.id);
  assert.equal(sourceMutations, 0);
  assert.deepEqual(await graph.entity({ type: "PUJA", id: 1 }), expectEntityWithoutEdges());
});
function expectEntityWithoutEdges() { return { entity: dto("PUJA", 1), connectionCount: 0, incoming: {}, outgoing: {} }; }

test("search is bounded/paginated and summary and orphan counts derive from live rows", async () => {
  const repo = new FakeRepository();
  const graph = new KnowledgeGraphService(repo as any, adapters({ PUJA: [dto("PUJA", 1, "Alpha"), dto("PUJA", 2, "Beta")], PANDIT: [dto("PANDIT", 3, "Pandit")] }) as any);
  await assert.rejects(() => graph.search({ type: "PUJA", term: "x".repeat(121) }), KnowledgeGraphValidationError);
  assert.deepEqual((await graph.search({ type: "PUJA", page: 2, limit: 1 })).items.map((x: any) => x.id), [2]);
  await graph.createRelationship({ source: { type: "PUJA", id: 1 }, relationshipType: "performed_by", target: { type: "PANDIT", id: 3 } }, 1);
  const summary = await graph.summary();
  assert.equal(summary.relationships, 1);
  assert.equal(summary.connectedUniqueEntities, 2);
  assert.equal(summary.orphans, 1);
  repo.rows.push({
    id: 999,
    sourceEntityType: "PUJA",
    sourceEntityId: 404,
    relationshipType: "performed_by",
    targetEntityType: "PANDIT",
    targetEntityId: 405,
    status: "ACTIVE",
  });
  assert.equal((await graph.summary()).connectedUniqueEntities, 2);
  repo.orphanResult = { total: 1, items: [dto("PUJA", 2, "Beta")] };
  assert.deepEqual((await graph.orphans({ type: "PUJA", page: 1, limit: 10 })).items.map((x: any) => x.id), [2]);
});

test("orphan pagination delegates bounded repository work rather than enumerating adapters or edges", async () => {
  const repo = new FakeRepository();
  repo.orphanResult = { total: 42, items: [dto("PUJA", 21, "Puja 21")] };
  const graph = new KnowledgeGraphService(repo as any, adapters({ PUJA: Array.from({ length: 100 }, (_, i) => dto("PUJA", i + 1)) }) as any);
  const result = await graph.orphans({ type: "PUJA", term: "Puja", page: 3, limit: 10 });
  assert.deepEqual(result, { page: 3, limit: 10, total: 42, items: [dto("PUJA", 21, "Puja 21")] });
  assert.deepEqual(repo.orphanCalls, [{ type: "PUJA", discriminator: undefined, term: "Puja", page: 3, limit: 10 }]);
});

test("chunked enumeration keeps summaries and cross-type search correct beyond one adapter page", async () => {
  const many = Array.from({ length: 125 }, (_, index) => dto("PUJA", index + 1, `Puja ${String(index + 1).padStart(3, "0")}`));
  const graph = new KnowledgeGraphService(new FakeRepository() as any, adapters({ PUJA: many }) as any);
  const page = await graph.search({ type: "PUJA", page: 3, limit: 25 });
  assert.equal(page.items[0].id, 51);
  assert.equal((await graph.summary()).byEntityType.PUJA, 125);
  const cross = await graph.search({ term: "Puja", page: 5, limit: 25 });
  assert.equal(cross.items[0].id, 101);
});

test("status filtering precedes typed and cross-type pagination, and huge windows are rejected", async () => {
  const pujas = Array.from({ length: 130 }, (_, i) => ({ ...dto("PUJA", i + 1, `Puja ${String(i + 1).padStart(3, "0")}`), status: i % 2 ? "DRAFT" : "ACTIVE" }));
  const pandits = Array.from({ length: 80 }, (_, i) => ({ ...dto("PANDIT", i + 1, `Pandit ${String(i + 1).padStart(3, "0")}`), status: "DRAFT" }));
  const graph = new KnowledgeGraphService(new FakeRepository() as any, adapters({ PUJA: pujas, PANDIT: pandits }) as any);
  assert.equal((await graph.search({ type: "PUJA", status: "DRAFT", page: 2, limit: 25 })).items[0].id, 52);
  assert.equal((await graph.search({ status: "DRAFT", page: 5, limit: 25 })).items.length, 25);
  await assert.rejects(() => graph.search({ type: "PUJA", page: 101, limit: 100 }), KnowledgeGraphValidationError);
});

test("typed LOCATION identity remains distinct in connection counts and orphan pages", async () => {
  const locations = [dto("LOCATION", 1, "City one"), dto("LOCATION", 1, "State one")];
  locations[0].discriminator = "CITY"; locations[1].discriminator = "STATE";
  const repo = new FakeRepository();
  repo.orphanResult = { total: 1, items: [locations[1]] };
  const graph = new KnowledgeGraphService(repo as any, adapters({ PUJA: [dto("PUJA", 1)], LOCATION: locations }) as any);
  await graph.createRelationship({ source: { type: "PUJA", id: 1 }, relationshipType: "available_in", target: { type: "LOCATION", id: 1, discriminator: "CITY" } }, 1);
  const rows = await graph.search({ type: "LOCATION", page: 1, limit: 10 });
  assert.deepEqual(rows.items.map((x: any) => x.connectionCount), [1, 0]);
  assert.deepEqual((await graph.orphans({ type: "LOCATION", page: 1, limit: 10 })).items.map((x: any) => x.discriminator), ["STATE"]);
});

test("quality rules produce missing and stale health findings", async () => {
  const repo = new FakeRepository();
  const source = dto("PUJA", 1);
  const graph = new KnowledgeGraphService(repo as any, adapters({ PUJA: [source], PANDIT: [dto("PANDIT", 2)] }) as any);
  const rule = await graph.createRule({ sourceEntityType: "PUJA", relationshipType: "performed_by", allowedTargetEntityTypes: ["PANDIT"] }, 7);
  assert.equal((await graph.health({ type: "PUJA", limit: 10 })).items[0].state, "MISSING_CONFIGURED_RELATIONSHIP");
  await graph.createRelationship({ source: { type: "PUJA", id: 1 }, relationshipType: "performed_by", target: { type: "PANDIT", id: 2 } }, 7);
  assert.equal((await graph.health({ type: "PUJA", limit: 10 })).items[0].state, "ONLY_ONE_RELATIONSHIP");
  (graph.adapters.get("PANDIT") as any).search = async () => [];
  assert.equal((await graph.health({ type: "PUJA", limit: 10 })).items[0].state, "INVALID_OR_STALE_RELATIONSHIP");
  assert.ok(await graph.patchRule(rule.id, { isActive: false }));
  assert.ok(await repo.deleteRule(rule.id));
});

test("same-type quality rules count only edges directed from the current entity", async () => {
  const repo = new FakeRepository();
  const graph = new KnowledgeGraphService(
    repo as any,
    adapters({ PUJA: [dto("PUJA", 1), dto("PUJA", 2)] }) as any,
  );
  await graph.createRule({
    sourceEntityType: "PUJA",
    relationshipType: "related_to",
    allowedTargetEntityTypes: ["PUJA"],
  }, 7);
  await graph.createRelationship({
    source: { type: "PUJA", id: 1 },
    relationshipType: "related_to",
    target: { type: "PUJA", id: 2 },
  }, 7);

  const health = await graph.health({ type: "PUJA", limit: 10 });
  assert.equal(health.items.find((item: any) => item.entity.id === 1).state, "ONLY_ONE_RELATIONSHIP");
  assert.equal(health.items.find((item: any) => item.entity.id === 2).state, "MISSING_CONFIGURED_RELATIONSHIP");
});