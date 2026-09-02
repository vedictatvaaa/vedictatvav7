import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  ENTITY_TYPES, RELATIONSHIP_TYPES, UnsupportedEntitySourceError,
  createEntityAdapters, isEntityType, isRelationshipType,
  isValidRelationshipCombination, boundedSearch, pagination, positiveEntityId,
  rejectDuplicateInput, safeMetadata, validateEntityRef,
} from "./knowledge-graph";

test("entity and relationship registries reject arbitrary strings", () => {
  assert.equal(ENTITY_TYPES.length, 10);
  assert.equal(RELATIONSHIP_TYPES.length, 16);
  assert.equal(isEntityType("PUJA"), true);
  assert.equal(isEntityType("puja"), false);
  assert.equal(isRelationshipType("performed_by"), true);
  assert.equal(isRelationshipType("frontend_custom_link"), false);
});

test("approved combinations are accepted and invalid combinations rejected", () => {
  assert.equal(isValidRelationshipCombination("PUJA", "performed_by", "PANDIT"), true);
  assert.equal(isValidRelationshipCombination("PANDIT", "offers", "SERVICE"), true);
  assert.equal(isValidRelationshipCombination("ARTICLE", "discusses", "PUJA"), true);
  assert.equal(isValidRelationshipCombination("PRODUCT", "performed_by", "PANDIT"), false);
  assert.equal(isValidRelationshipCombination("PANDIT", "contains", "TEMPLE"), false);
});

test("metadata accepts bounded JSON objects and rejects pollution and unsafe values", () => {
  assert.deepEqual(safeMetadata({ note: "editorial", flags: [true, 2] }), { note: "editorial", flags: [true, 2] });
  assert.throws(() => safeMetadata([]), /plain object/);
  assert.throws(() => safeMetadata(new Date()), /plain object/);
  assert.throws(() => safeMetadata({ nested: { constructor: "bad" } }), /prohibited key/);
  assert.throws(() => safeMetadata({ value: Infinity }), /unsupported number/);
  assert.throws(() => safeMetadata({ value: "x".repeat(9_000) }), /too large/);
  const polluted = Object.create({ inherited: true });
  polluted.ok = true;
  assert.throws(() => safeMetadata(polluted), /plain object/);
});

test("IDs, LOCATION identity, pagination, and duplicate inputs are bounded", () => {
  assert.equal(positiveEntityId(1), 1);
  assert.throws(() => positiveEntityId(0), /positive/);
  assert.throws(() => positiveEntityId(Number.MAX_SAFE_INTEGER), /positive/);
  assert.deepEqual(pagination({ page: 2, limit: 50 }), { page: 2, limit: 50, offset: 50 });
  assert.throws(() => pagination({ page: 1, limit: 101 }), /limit/);
  assert.throws(() => boundedSearch({ term: "", limit: 1_000, offset: 0 }), /limit/);
  assert.doesNotThrow(() => validateEntityRef({ type: "LOCATION", id: 1, discriminator: "CITY" }));
  assert.throws(() => validateEntityRef({ type: "LOCATION", id: 1 }), /discriminator/);
  assert.throws(() => rejectDuplicateInput([{ id: 1 }, { id: 1 }], (x) => String(x.id)), /Duplicate/);
});

test("migration contract has duplicate protection, checks, and all lookup indexes", async () => {
  const sql = await readFile(new URL("../migrations/0006_knowledge_graph_foundation.sql", import.meta.url), "utf8");
  assert.match(sql, /CREATE UNIQUE INDEX IF NOT EXISTS knowledge_graph_relationships_exact_edge_unique/);
  assert.match(sql, /COALESCE\(source_discriminator, ''\)/);
  assert.match(sql, /knowledge_graph_relationships_metadata_check/);
  assert.match(sql, /source_discriminator IS NOT NULL/);
  assert.match(sql, /target_discriminator IS NOT NULL/);
  for (const suffix of ["source_idx", "target_idx", "relationship_type_idx", "source_relationship_idx", "target_relationship_idx", "status_idx"]) {
    assert.match(sql, new RegExp(`knowledge_graph_relationships_${suffix}`));
  }
});

function fakeDatabase(rows: any[], failure?: Error): any {
  return {
    select() {
      if (failure) throw failure;
      const query: any = {
        from() { return query; }, where() { return query; }, limit() { return query; },
        offset() { return query; }, orderBy() { return query; }, innerJoin() { return query; },
        then(resolve: (value: any[]) => void) { resolve(rows); },
      };
      return query;
    },
  };
}

test("adapters return normalized Admin-safe DTOs and never leak source privacy fields", async () => {
  const adapters = createEntityAdapters(fakeDatabase([{
    id: 9, name: "Safe product", slug: "safe-product", category: "Puja",
    productType: "product", stock: 3, customerEmail: "private@example.com",
    passwordHash: "secret", description: "not selected",
  }]));
  const dto = await adapters.get("PRODUCT")!.get({ type: "PRODUCT", id: 9 });
  assert.equal(dto?.url, "/product/safe-product");
  assert.deepEqual(Object.keys(dto || {}).sort(), ["id", "name", "status", "summary", "type", "updatedAt", "url"]);
  assert.equal("customerEmail" in (dto as object), false);
  assert.equal("passwordHash" in (dto as object), false);
});

test("missing source types are explicit and database failures propagate", async () => {
  const adapters = createEntityAdapters(fakeDatabase([]));
  await assert.rejects(() => adapters.get("TIRTH")!.search({ term: "", limit: 10, offset: 0 }), UnsupportedEntitySourceError);
  assert.equal(await adapters.get("PRODUCT")!.get({ type: "PRODUCT", id: 10 }), null);

  const failure = new Error("database unavailable");
  const failed = createEntityAdapters(fakeDatabase([], failure));
  await assert.rejects(() => failed.get("PRODUCT")!.get({ type: "PRODUCT", id: 1 }), failure);
});