import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { CANONICAL_DESTINATION_COUNTS, CANONICAL_DESTINATION_IMPORT_ROWS, canonicalSlug } from "@shared/destination-import-data";
import { TEMPLE_TOURISM_SOURCE_ROWS } from "@shared/pilgrimage-source-contract";
import { TEMPLE_TOURISM_CLASSIFICATION_MANIFEST, YATRA_TO_TIRTH_MAPPING_MANIFEST } from "./knowledge-graph/destination-source-manifests";
import { TEMPLE_TOURISM_SERIALIZABLE_SOURCE_DATA, TIRTH_GUIDE_SERIALIZABLE_SOURCE_DATA } from "@shared/canonical-destination-source-data";
import { TIRTH_SOURCE_CONSOLIDATION_MANIFEST } from "@shared/destination-consolidation-manifest";

test("canonical destination manifests are complete, deterministic, and keep tours separate", () => {
  assert.equal(Object.keys(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST).length, TEMPLE_TOURISM_SOURCE_ROWS.length);
  assert.equal(CANONICAL_DESTINATION_IMPORT_ROWS.filter((row) => row.classification === "TIRTH").length, 23);
  assert.equal(CANONICAL_DESTINATION_IMPORT_ROWS.filter((row) => row.classification === "TEMPLE").length, 26);
  assert.deepEqual(CANONICAL_DESTINATION_COUNTS, { tirth: 23, temple: 26, alias: 5 });
  assert.equal(new Set(CANONICAL_DESTINATION_IMPORT_ROWS.map((row) => row.sourceKey)).size, CANONICAL_DESTINATION_IMPORT_ROWS.length);
  for (const row of CANONICAL_DESTINATION_IMPORT_ROWS) assert.equal(row.preferredSlug, canonicalSlug(row.preferredSlug));
  assert.deepEqual(YATRA_TO_TIRTH_MAPPING_MANIFEST, [{ yatraSourceKey: "delhi-haridwar-yatra", tirthSourceKey: "haridwar" }]);
  assert.deepEqual(TIRTH_SOURCE_CONSOLIDATION_MANIFEST, {
    ayodhya: "ayodhya-ram-mandir-yatra", mathuraVrindavan: "mathura-vrindavan-yatra",
    haridwar: "haridwar-rishikesh-yatra", dwarka: "dwarka-yatra", mansarovar: "kailash-mansarovar-yatra",
  });
  const aliases = CANONICAL_DESTINATION_IMPORT_ROWS.flatMap((row) => row.aliases);
  assert.equal(aliases.length, 5);
  assert.equal(new Set(aliases).size, aliases.length);
  assert.equal(CANONICAL_DESTINATION_IMPORT_ROWS.some((row) => row.sourceKey.startsWith("yatra:")), false);
});

test("canonical payloads preserve every classified source record and exclude legacy-only records", () => {
  const templeByKey = new Map(TEMPLE_TOURISM_SERIALIZABLE_SOURCE_DATA.map((source) => [source.id, source]));
  const guideByKey = new Map(TIRTH_GUIDE_SERIALIZABLE_SOURCE_DATA.map((source) => [source.slug, source]));
  for (const [sourceKey, source] of guideByKey) {
    const row = CANONICAL_DESTINATION_IMPORT_ROWS.find((candidate) => candidate.sourceKey === `tirth-guide:${sourceKey}`);
    assert.ok(row, `missing guide import for ${sourceKey}`);
    assert.deepEqual((row.editorial.sourceRecords as { content: unknown }[])[0].content, source);
  }
  for (const [sourceKey, source] of templeByKey) {
    const classification = TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[sourceKey];
    const targetGuide = TIRTH_SOURCE_CONSOLIDATION_MANIFEST[sourceKey as keyof typeof TIRTH_SOURCE_CONSOLIDATION_MANIFEST];
    const row = classification === "LEGACY_ONLY" ? undefined : targetGuide
      ? CANONICAL_DESTINATION_IMPORT_ROWS.find((candidate) => candidate.sourceKey === `tirth-guide:${targetGuide}`)
      : CANONICAL_DESTINATION_IMPORT_ROWS.find((candidate) => candidate.sourceKey === `temple-tourism:${sourceKey}`);
    if (classification === "LEGACY_ONLY") {
      assert.equal(row, undefined, `legacy-only record imported: ${sourceKey}`);
      assert.ok(source, `legacy-only source is unavailable to the client: ${sourceKey}`);
      continue;
    }
    assert.ok(row, `missing classified import for ${sourceKey}`);
    assert.ok((row.editorial.sourceRecords as { sourceKey: string; content: unknown }[])
      .some((record) => record.sourceKey === sourceKey && JSON.stringify(record.content) === JSON.stringify(source)),
    `full source content missing for ${sourceKey}`);
  }
});

test("importer data is plain JSON and never depends on client components or browser globals", () => {
  for (const row of CANONICAL_DESTINATION_IMPORT_ROWS) {
    assert.doesNotThrow(() => JSON.stringify(row));
    const inspect = (value: unknown): void => {
      assert.notEqual(typeof value, "function");
      if (value && typeof value === "object") for (const child of Object.values(value)) inspect(child);
    };
    inspect(row);
  }
  const sourceModule = readFileSync("shared/canonical-destination-source-data.ts", "utf8");
  assert.doesNotMatch(sourceModule, /temple-tourism\.tsx|client\/src\/pages|react-leaflet|lucide-react|window/);
  assert.match(readFileSync("client/src/pages/temple-tourism.tsx", "utf8"), /from "@shared\/temple-tourism-data"/);
  assert.match(readFileSync("client/src/lib/tirth-yatras-data.ts", "utf8"), /from "@shared\/tirth-yatras-data"/);
});

test("migration is fail-closed for coordinates, aliases, and public gate", () => {
  const migration = readFileSync("migrations/0007_canonical_destinations.sql", "utf8");
  assert.match(migration, /is_public_enabled boolean NOT NULL DEFAULT false/);
  assert.match(migration, /alias_slug <> canonical_slug/);
  assert.match(migration, /latitude IS NULL AND longitude IS NULL/);
  assert.match(migration, /latitude IS NOT NULL AND longitude IS NOT NULL/);
  assert.match(migration, /latitude IS NULL OR latitude BETWEEN -90 AND 90/);
  assert.match(migration, /longitude IS NULL OR longitude BETWEEN -180 AND 180/);
  assert.match(migration, /migration_source_key is immutable/);
  assert.match(migration, /validate_destination_slug_alias/);
  assert.match(migration, /destination alias endpoint does not exist/);
  assert.match(migration, /canonical slug does not match endpoint slug/);
  for (const name of ["tirths_migration_source_key_unique", "tirths_slug_unique", "temples_migration_source_key_unique", "temples_slug_unique", "destination_slug_aliases_entity_alias_unique"]) {
    assert.match(migration, new RegExp(`CREATE UNIQUE INDEX ${name}`));
  }
  assert.match(migration, /sync_destination_alias_canonical_slug/);
  assert.match(migration, /AFTER UPDATE OF slug ON tirths/);
  assert.match(migration, /AFTER UPDATE OF slug ON temples/);
  assert.match(migration, /entity_type = TG_ARGV\[0\] AND entity_id = NEW\.id AND canonical_slug = OLD\.slug/);
  assert.match(migration, /prevent_referenced_destination_delete/);
  assert.match(migration, /BEFORE DELETE ON tirths/);
  assert.match(migration, /BEFORE DELETE ON temples/);
  assert.match(migration, /entity_type = TG_ARGV\[0\] AND entity_id = OLD\.id/);
  assert.match(migration, /\(source_entity_type = TG_ARGV\[0\] AND source_entity_id = OLD\.id\)[\s\S]*target_entity_type = TG_ARGV\[0\] AND target_entity_id = OLD\.id/);
  assert.match(migration, /INSERT INTO knowledge_graph_public_state[\s\S]*false, 0/);
});

test("backfill documents one transaction and an idempotent source-key upsert", () => {
  const script = readFileSync("script/backfill-canonical-destinations.ts", "utf8");
  assert.match(script, /await db\.transaction/);
  assert.match(script, /target: tirths\.migrationSourceKey/);
  assert.match(script, /target: temples\.migrationSourceKey/);
  assert.match(script, /onConflictDoNothing/);
  assert.match(script, /--apply requires --actor-admin-id/);
  assert.match(script, /actor\[0\]\.role === "admin"/);
  assert.match(script, /existing alias has a different binding/);
  assert.doesNotMatch(script, /destinationSlugAliases\)[\s\S]{0,500}onConflictDoNothing/);
});