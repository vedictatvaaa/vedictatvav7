import assert from "node:assert/strict";
import test from "node:test";
import { KnowledgeGraphService } from "./service";
import type { CsvRow } from "./relationship-csv";

const csvRow = (patch: Partial<CsvRow> = {}): CsvRow => ({
  line: 2, action: "create", source: { type: "PUJA", id: 1 }, relationshipType: "related_to",
  target: { type: "TEMPLE", id: 2 }, status: "DRAFT", displayOrder: 0, metadata: {}, ...patch,
});
const edge = (patch: any = {}) => ({
  id: 10, sourceEntityType: "PUJA", sourceEntityId: 1, sourceDiscriminator: null,
  relationshipType: "related_to", targetEntityType: "TEMPLE", targetEntityId: 2, targetDiscriminator: null,
  status: "DRAFT", updatedAt: new Date("2024-01-01"), ...patch,
});
function fixture(edges: any[] = [], entities: Record<string, any> = {}) {
  const repository: any = { allRelationships: async () => edges };
  const get = async (ref: any) => entities[`${ref.type}:${ref.id}`] === undefined ? { status: "PUBLISHED", updatedAt: "v1" } : entities[`${ref.type}:${ref.id}`];
  const exists = async (ref: any) => Boolean(await get(ref));
  const adapters: any = new Map([["PUJA", { get, exists }], ["TEMPLE", { get, exists }]]);
  return new KnowledgeGraphService(repository, adapters);
}

test("CSV validation fingerprints canonical edge and endpoint state", async () => {
  const rows = [csvRow({ source: { type: "PUJA", id: 3 }, target: { type: "TEMPLE", id: 4 } })];
  const endpoints = { "PUJA:3": { status: "PUBLISHED", updatedAt: "a" }, "TEMPLE:4": { status: "ACTIVE", updatedAt: "b" } };
  const edges = [edge({ id: 2 }), edge({ id: 1, sourceEntityId: 8, targetEntityId: 9 })];
  const a = await fixture(edges, endpoints).validateCsvRows(rows);
  const b = await fixture([...edges].reverse(), { "TEMPLE:4": endpoints["TEMPLE:4"], "PUJA:3": endpoints["PUJA:3"] }).validateCsvRows([...rows].reverse());
  assert.equal(a.fingerprint, b.fingerprint);
  for (const changed of [
    fixture([edge({ id: 2, status: "ACTIVE" }), edges[1]], endpoints),
    fixture([edge({ id: 2, updatedAt: new Date("2025-01-01") }), edges[1]], endpoints),
    fixture(edges, { ...endpoints, "PUJA:3": null }),
    fixture(edges, { ...endpoints, "PUJA:3": { status: "DRAFT", updatedAt: "a" } }),
    fixture(edges, { ...endpoints, "PUJA:3": { status: "PUBLISHED", updatedAt: "changed" } }),
  ]) assert.notEqual(a.fingerprint, (await changed.validateCsvRows(rows)).fingerprint);
});

test("CSV validation reports endpoint eligibility, identity, duplicates, and source errors", async () => {
  const service = fixture([edge()], { "PUJA:1": { status: "DRAFT", updatedAt: "a" }, "TEMPLE:2": { status: "PUBLISHED", updatedAt: "b" }, "PUJA:6": null });
  const result = await service.validateCsvRows([
    csvRow(), csvRow({ line: 3, action: "update", relationshipId: 99 }),
    csvRow({ line: 4, action: "update", relationshipId: 10, target: { type: "TEMPLE", id: 3 } }),
    csvRow({ line: 5 }), csvRow({ line: 6, action: "skip" }),
    csvRow({ line: 7, source: { type: "PUJA", id: 5 }, target: { type: "PUJA", id: 5 } }),
    csvRow({ line: 8, relationshipType: "related_temple" as any, source: { type: "TEMPLE", id: 2 }, target: { type: "PUJA", id: 1 } }),
    csvRow({ line: 9, source: { type: "PUJA", id: 6 }, target: { type: "TEMPLE", id: 7 } }),
    csvRow({ line: 10, action: "skip", source: { type: "PUJA", id: 8 }, target: { type: "TEMPLE", id: 9 } }),
    csvRow({ line: 11, source: { type: "PUJA", id: 8 }, target: { type: "TEMPLE", id: 9 } }),
  ]);
  assert.match(result.rows[0].errors.join(), /already exists/);
  assert.match(result.rows[0].warnings.join(), /not publicly eligible/);
  assert.match(result.rows[1].errors.join(), /does not exist/);
  assert.match(result.rows[2].errors.join(), /cannot change/);
  assert.match(result.rows[3].errors.join(), /Duplicate relationship/);
  assert.equal(result.rows[4].action, "skip");
  assert.match(result.rows[5].errors.join(), /Self-links/);
  assert.match(result.rows[6].errors.join(), /Invalid source/);
  assert.match(result.rows[7].errors.join(), /entity does not exist/);
  assert.equal(result.rows[9].action, "create", "a skipped identity must not poison a later create");
});