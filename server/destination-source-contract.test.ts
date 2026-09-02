import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import {
  PILGRIMAGE_SOURCE_ROUTE_PARITY,
  TEMPLE_TOURISM_SOURCE_ROWS,
  TIRTH_GUIDE_SOURCE_ROWS,
  YATRA_PERSISTENCE_CONTRACT,
  YATRA_TOUR_SOURCE_KEYS,
} from "@shared/pilgrimage-source-contract";
import {
  DESTINATION_SOURCE_COUNTS,
  LEGACY_ONLY_TEMPLE_TOURISM_SOURCE_KEYS,
  TEMPLE_TOURISM_CLASSIFICATION_MANIFEST,
  YATRA_TO_TIRTH_MAPPING_MANIFEST,
} from "./knowledge-graph/destination-source-manifests";
import { isValidRelationshipCombination } from "./knowledge-graph";

const keys = (rows: readonly (readonly [string, string])[]) => rows.map(([key]) => key);

test("server-safe inventories exactly freeze the current client and seeded source keys", async () => {
  const [tirthGuideFile, templeTourismFile, yatraSourceFile] = await Promise.all([
    readFile(new URL("../client/src/lib/tirth-yatras-data.ts", import.meta.url), "utf8"),
    readFile(new URL("../client/src/pages/temple-tourism.tsx", import.meta.url), "utf8"),
    readFile(new URL("./yatra-pilgrimage.ts", import.meta.url), "utf8"),
  ]);
  const sourceKeys = (source: string, start: string, end: string, field: string) =>
    [...source.slice(source.indexOf(start), source.indexOf(end)).matchAll(new RegExp(`\\b${field}: "([^"]+)"`, "g"))]
      .map((match) => match[1]);

  assert.deepEqual(
    keys(TIRTH_GUIDE_SOURCE_ROWS),
    sourceKeys(tirthGuideFile, "export const TIRTH_YATRAS", "export const TIRTH_YATRAS_BY_SLUG", "slug"),
  );
  assert.deepEqual(
    keys(TEMPLE_TOURISM_SOURCE_ROWS),
    sourceKeys(templeTourismFile, "const pilgrimageSites", "const categoryImages", "id"),
  );
  assert.deepEqual(
    [...YATRA_TOUR_SOURCE_KEYS],
    sourceKeys(yatraSourceFile, "const SEED_TOURS", "export async function seedTirthYatraTours", "slug"),
  );
});

test("frozen destination source inventories have unique stable keys and display names", () => {
  for (const rows of [TIRTH_GUIDE_SOURCE_ROWS, TEMPLE_TOURISM_SOURCE_ROWS]) {
    assert.equal(new Set(keys(rows)).size, rows.length);
    assert.equal(new Set(rows.map(([, slug]) => slug)).size, rows.length);
  }
  assert.equal(TIRTH_GUIDE_SOURCE_ROWS.length, DESTINATION_SOURCE_COUNTS.tirthGuides);
  assert.equal(TEMPLE_TOURISM_SOURCE_ROWS.length, DESTINATION_SOURCE_COUNTS.templeTourism);
  assert.equal(new Set(YATRA_TOUR_SOURCE_KEYS).size, YATRA_TOUR_SOURCE_KEYS.length);
  assert.equal(YATRA_PERSISTENCE_CONTRACT.tourTable, "tirth_yatra_tours");
  assert.equal(YATRA_PERSISTENCE_CONTRACT.inquiryTable, "tirth_yatra_inquiries");
});

test("every Temple Tourism row has one explicit reviewed classification without inference", () => {
  const sourceKeys = keys(TEMPLE_TOURISM_SOURCE_ROWS);
  assert.deepEqual(Object.keys(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST).sort(), [...sourceKeys].sort());
  const counts = { TEMPLE: 0, TIRTH: 0, LEGACY_ONLY: 0 };
  for (const sourceKey of sourceKeys) counts[TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[sourceKey]]++;
  assert.deepEqual(counts, {
    TEMPLE: DESTINATION_SOURCE_COUNTS.temple,
    TIRTH: DESTINATION_SOURCE_COUNTS.tirth,
    LEGACY_ONLY: DESTINATION_SOURCE_COUNTS.legacyOnly,
  });
  assert.deepEqual(
    sourceKeys.filter((key) => TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[key] === "LEGACY_ONLY"),
    LEGACY_ONLY_TEMPLE_TOURISM_SOURCE_KEYS,
  );
});

test("reviewed Yatra mappings resolve only to reviewed Tirth sources and preserve Yatra separation", () => {
  const tirthKeys = new Set(keys(TEMPLE_TOURISM_SOURCE_ROWS).filter(
    (key) => TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[key] === "TIRTH",
  ));
  for (const mapping of YATRA_TO_TIRTH_MAPPING_MANIFEST) {
    assert.ok(YATRA_TOUR_SOURCE_KEYS.includes(mapping.yatraSourceKey));
    assert.ok(tirthKeys.has(mapping.tirthSourceKey));
    assert.notEqual(mapping.yatraSourceKey, mapping.tirthSourceKey);
  }
  assert.equal(isValidRelationshipCombination("YATRA", "associated_with", "TIRTH"), true);
  assert.equal(isValidRelationshipCombination("YATRA", "associated_with", "TEMPLE"), false);
});

test("public route and inquiry compatibility fixtures retain established shapes", () => {
  assert.deepEqual(PILGRIMAGE_SOURCE_ROUTE_PARITY.tirthGuide, {
    index: "/tirth-yatra", detail: "/tirth-yatra/:slug", headingTestId: "text-page-title",
  });
  assert.equal(PILGRIMAGE_SOURCE_ROUTE_PARITY.templeTourism.index, "/temple-tourism");
  assert.deepEqual(PILGRIMAGE_SOURCE_ROUTE_PARITY.yatraTours.inquiryFields.slice(0, 4), ["tourId", "tourSlug", "name", "phone"]);
});