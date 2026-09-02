import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import { consolidatedDestinationSourceKey, expandCompatibilityItems, normalizeDestinationSlug, publicDestinationDto, validateCoordinates, validateDestinationTransition } from "./knowledge-graph/destination-routes";
import { publicInquiryResponse } from "./yatra-pilgrimage";
import { KnowledgeGraphService } from "./knowledge-graph/service";

test("destination validation normalizes safe slugs and rejects unsafe/empty values", () => {
  assert.equal(normalizeDestinationSlug(" Kāshi  Vishwanāth! "), "kashi-vishwanath");
  assert.throws(() => normalizeDestinationSlug("***"), /normalize/);
  assert.throws(() => normalizeDestinationSlug("x".repeat(161)), /normalize/);
});

test("coordinates validate create and merged patch states, and transitions are explicit", () => {
  assert.deepEqual(validateCoordinates({}), { latitude: undefined, longitude: undefined });
  assert.throws(() => validateCoordinates({ latitude: 10 }), /together/);
  assert.deepEqual(validateCoordinates({ latitude: 11 }, { latitude: 10, longitude: 20 }), { latitude: 11, longitude: 20 });
  assert.throws(() => validateCoordinates({ latitude: 11 }, { latitude: null, longitude: null }), /together/);
  assert.deepEqual(validateCoordinates({ latitude: null, longitude: null }, { latitude: 10, longitude: 20 }), { latitude: null, longitude: null });
  assert.doesNotThrow(() => validateDestinationTransition("DRAFT", "PUBLISHED"));
  assert.throws(() => validateDestinationTransition("ARCHIVED", "PUBLISHED"), /Cannot transition/);
});

test("public and inquiry DTO helpers strip private/internal properties", () => {
  const destination = publicDestinationDto("TIRTH", { id: 1, slug: "kashi", name: "Kashi", status: "PUBLISHED", provenance: "EDITORIAL", editorial: { secret: true }, updatedAt: new Date() });
  assert.equal("status" in destination, false);
  assert.equal("provenance" in destination, false);
  assert.equal("editorial" in destination, false);
  const inquiry = publicInquiryResponse({ id: 1, tourSlug: "kashi", canonicalDestinationType: "TIRTH", canonicalDestinationId: 5 });
  assert.deepEqual(inquiry, { id: 1, tourSlug: "kashi" });
});

test("reviewed Temple Tourism secondary Tirth keys consolidate to guide keys only", () => {
  assert.equal(consolidatedDestinationSourceKey("TIRTH", "temple-tourism:ayodhya"), "tirth-guide:ayodhya-ram-mandir-yatra");
  assert.equal(consolidatedDestinationSourceKey("TEMPLE", "temple-tourism:ayodhya"), "temple-tourism:ayodhya");
});

test("published consolidated Tirth compatibility keys expand deterministically without ambiguity", () => {
  const row = { id: 1, migrationSourceKey: "tirth-guide:ayodhya-ram-mandir-yatra", slug: "ayodhya", name: "Ayodhya" };
  assert.deepEqual(expandCompatibilityItems("TIRTH", [row]).map((item) => item.sourceKey), ["temple-tourism:ayodhya", "tirth-guide:ayodhya-ram-mandir-yatra"]);
  assert.throws(() => expandCompatibilityItems("TIRTH", [row, { ...row, id: 2, slug: "other" }]), /ambiguously/);
});

test("destination routes are protected, transactional, redacted, and expose no hard-delete route", async () => {
  const source = await readFile(new URL("./knowledge-graph/destination-routes.ts", import.meta.url), "utf8");
  assert.match(source, /registerDestinationAdminRoutes/);
  assert.match(source, /adminAuthMiddleware/);
  assert.match(source, /db\.transaction/);
  assert.match(source, /actor: `admin-user:\$\{actor\(req\)\}`/);
  assert.match(source, /fields: Object\.keys\(input\)\.filter\(\(key\) => key !== "editorial"\)/);
  assert.doesNotMatch(source, /app\.delete\(/i);
  assert.match(source, /Cannot transition/);
  assert.match(source, /Alias is already a canonical slug/);
});

test("public destination compatibility is published-only and strips admin editorial/provenance", async () => {
  const source = await readFile(new URL("./knowledge-graph/destination-routes.ts", import.meta.url), "utf8");
  assert.match(source, /eq\(table\.status, "PUBLISHED"\)/);
  assert.match(source, /canonicalDestinationCompatibility/);
  assert.match(source, /source: "LEGACY"/);
  const publicDto = source.slice(source.indexOf("publicDestinationDto"), source.indexOf("export function validateCoordinates"));
  assert.doesNotMatch(publicDto, /editorial/);
  assert.doesNotMatch(publicDto, /provenance/);
});

test("inquiry migration has nullable paired canonical destination identity and indexes", async () => {
  const migration = await readFile(new URL("../migrations/0008_tirth_yatra_inquiry_canonical_destination.sql", import.meta.url), "utf8");
  assert.match(migration, /canonical_destination_type IN \('TIRTH','TEMPLE'\)/);
  assert.match(migration, /canonical_destination_type IS NULL AND canonical_destination_id IS NULL/);
  assert.match(migration, /canonical_destination_id > 0/);
  assert.match(migration, /CREATE INDEX tirth_yatra_inquiries_canonical_destination_idx/);
  const inquiry = await readFile(new URL("./yatra-pilgrimage.ts", import.meta.url), "utf8");
  assert.match(inquiry, /canonicalDestinationType/);
  assert.match(inquiry, /canonicalDestinationType, canonicalDestinationId/);
});

test("TIRTH and TEMPLE graph identities participate when adapters are supplied", async () => {
  const dto = (type: "TIRTH" | "TEMPLE", id: number) => ({ type, id, name: type, status: "PUBLISHED", url: null, updatedAt: null, summary: {} });
  const adapter = (row: any) => ({ get: async () => row, exists: async () => true, search: async () => [row] });
  const graph = new KnowledgeGraphService({ allRelationships: async () => [], listRules: async () => [] } as any,
    new Map([["TIRTH", adapter(dto("TIRTH", 1))], ["TEMPLE", adapter(dto("TEMPLE", 2))]]) as any);
  const result = await graph.search({ page: 1, limit: 10 });
  assert.deepEqual(result.items.map((row: any) => `${row.type}:${row.id}`).sort(), ["TEMPLE:2", "TIRTH:1"]);
  assert.equal((await graph.summary()).byEntityType.TIRTH, 1);
});