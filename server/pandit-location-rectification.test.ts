import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  evaluatePanditLocation,
  evaluatePanditLocationWithAdapters,
  buildDiscoveryAudit,
  sameLocationSnapshot,
  summarizeLocationAudit,
} from "./pandit-location-rectification";

const states = [
  { id: 1, name: "Delhi", isActive: true },
  { id: 2, name: "Karnataka", isActive: true },
  { id: 3, name: "Assam", isActive: true },
  { id: 4, name: "Chandigarh", isActive: true },
];
const cities = [
  { id: 10, stateId: 1, name: "New Delhi", aliases: ["Delhi"], isActive: true },
  { id: 20, stateId: 2, name: "Bengaluru", aliases: ["Bangalore", "Banglore"], isActive: true },
  { id: 30, stateId: 3, name: "Guwahati", aliases: ["Gauhati", "Guwahatii"], isActive: true },
  { id: 40, stateId: 4, name: "Chandigarh", aliases: [], isActive: true },
];

test("canonical aliases deterministically auto-correct without inventing coordinates", () => {
  const result = evaluatePanditLocation({
    id: 7, state: "Karnataka", city: "Bangalore", latitude: null, longitude: null,
  }, states, cities);
  assert.equal(result.status, "needs_review");
  assert.equal(result.autoApply, false);
  assert.equal(result.proposed?.city, "Bengaluru");
  assert.equal(result.proposed?.latitude, null);
  assert.ok(result.issueCategories.includes("missing_coordinates"));
  assert.ok(result.issueCategories.includes("verified_coordinate_evidence_unavailable"));
});

test("verified geocoder evidence repairs coordinates, while model output cannot", () => {
  const result = evaluatePanditLocation({
    id: 70, state: "Karnataka", city: "Bangalore", latitude: null, longitude: null,
  }, states, cities, {
    coordinateEvidence: {
      latitude: 12.9716, longitude: 77.5946, source: "verified-test-geocoder",
      confidence: 0.98, verified: true, scope: "address",
    },
  });
  assert.equal(result.status, "auto_corrected");
  assert.equal(result.autoApply, true);
  assert.equal(result.coordinateStatus, "verified");
  assert.equal(result.proposed?.coordinatesVerified, true);
  assert.equal(result.proposed?.latitude, 12.9716);
});

test("verified evidence replaces inconsistent in-range coordinates", () => {
  const result = evaluatePanditLocation({
    id: 71, stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru",
    latitude: 28.6, longitude: 77.2,
  }, states, cities, {
    coordinateEvidence: {
      latitude: 12.9716, longitude: 77.5946, source: "verified-test-geocoder",
      confidence: 0.97, verified: true, scope: "address",
    },
  });
  assert.equal(result.status, "auto_corrected");
  assert.ok(result.issueCategories.includes("coordinates_inconsistent_with_canonical_location"));
  assert.equal(result.proposed?.longitude, 77.5946);
});

test("city centroid evidence validates only and never proposes a Pandit coordinate", () => {
  const result = evaluatePanditLocation({
    id: 73, stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru",
    latitude: 12.97, longitude: 77.59,
  }, states, cities, {
    coordinateEvidence: {
      latitude: 12.9716, longitude: 77.5946, source: "nominatim:city-identity",
      confidence: 0.95, verified: true, scope: "city_centroid",
    },
  });
  assert.equal(result.coordinateStatus, "city_validated");
  assert.equal(result.coordinateEvidence, null);
  assert.equal(result.cityIdentityEvidence?.scope, "city_centroid");
  assert.equal(result.proposed, null);
  assert.equal(result.autoApply, false);
});

test("existing coordinates without independent evidence remain explicitly unverified", () => {
  const result = evaluatePanditLocation({
    id: 72, stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru",
    latitude: 12.97, longitude: 77.59,
  }, states, cities);
  assert.equal(result.coordinateStatus, "unverified");
  assert.equal(result.coordinateEvidence, null);
});

test("New Delhi, Gurugram, Bengaluru, and Guwahati aliases resolve to one canonical city", () => {
  const catalogueStates = [
    ...states,
    { id: 5, name: "Haryana", isActive: true },
  ];
  const catalogueCities = [
    ...cities,
    { id: 50, stateId: 5, name: "Gurugram", aliases: ["Gurgaon"], isActive: true },
  ];
  for (const [id, stateId, city] of [[1, 1, "Delhi"], [2, 5, "Gurgaon"], [3, 2, "Banglore"], [4, 3, "Gauhati"]] as const) {
    const result = evaluatePanditLocation({ id, stateId, city, state: catalogueStates.find(s => s.id === stateId)!.name, latitude: 1, longitude: 1 }, catalogueStates, catalogueCities);
    assert.equal(result.status, "auto_corrected");
    assert.equal(result.candidates.length, 1);
  }
});

test("ambiguous or unknown locations go to review and expose safe candidates only", () => {
  const result = evaluatePanditLocation({
    id: 8, state: "Unknown State", city: "Somewhere", latitude: 200, longitude: 91,
  }, states, cities);
  assert.equal(result.status, "needs_review");
  assert.equal(result.autoApply, false);
  assert.ok(result.issueCategories.includes("unrecognized_spelling_or_alias"));
  assert.ok(result.issueCategories.includes("invalid_coordinate_range"));
  assert.equal("phone" in result.before, false);
});

test("AI interpretation is constrained to active candidates and remains review-only", async () => {
  const result = await evaluatePanditLocationWithAdapters({
    id: 81, state: "A model may not choose this", city: "free form Bengaluru area",
  }, states, cities, {
    aiInterpreter: async ({ candidates }) => ({
      stateId: candidates.find(candidate => candidate.city === "Bengaluru")!.stateId,
      cityId: candidates.find(candidate => candidate.city === "Bengaluru")!.cityId,
      confidence: 0.99,
      reason: "candidate interpretation",
    }),
  });
  assert.equal(result.status, "needs_review");
  assert.equal(result.autoApply, false);
  assert.equal(result.source, "ai_interpretation");
  assert.equal(result.candidates[0]?.city, "Bengaluru");
});

test("out-of-range or inconsistent coordinates are never proposed without verified evidence", () => {
  const result = evaluatePanditLocation({
    id: 82, stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru",
    latitude: 95, longitude: 77,
  }, states, cities);
  assert.equal(result.status, "needs_review");
  assert.equal(result.proposed?.latitude, null);
  assert.ok(result.issueCategories.includes("invalid_coordinate_range"));
  assert.ok(result.issueCategories.includes("verified_coordinate_evidence_unavailable"));
});

test("proposal application uses the original location snapshot as a conflict guard", () => {
  const before = { stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru", latitude: 12, longitude: 77 };
  assert.equal(sameLocationSnapshot(before, { ...before }), true);
  assert.equal(sameLocationSnapshot(before, { ...before, latitude: 13 }), false);
  const routes = readFileSync(new URL("./pandit-location-rectification-routes.ts", import.meta.url), "utf8");
  assert.match(routes, /source_changed_since_audit/);
  assert.match(routes, /coordinatesVerified === true/);
  assert.match(routes, /\.for\("update"\)/);
  assert.match(routes, /locationOnlyProposal/);
  assert.match(routes, /change\.coordinateSource = null/);
  assert.match(routes, /parsed\.data\.useAi \|\| parsed\.data\.useGeocoder/);
  assert.match(routes, /isOpenAILocationInterpreterConfigured/);
});

test("discovery audit exposes every governance dimension and explicit hidden reasons", () => {
  const audit = buildDiscoveryAudit({
    id: 91, verified: false, onLeave: false, archived: false, accountStatus: "active",
    locationReviewStatus: "needs_review", stateId: 99, cityId: 999,
    directoryVisible: false, searchEligible: false, bookingEnabled: false, indexingMode: "noindex",
    availability: "unavailable",
  }, new Set([1]), new Map([[10, { id: 10, stateId: 1, isActive: true }]]), false, []);
  assert.equal(audit.publicEligible, false);
  assert.equal(audit.visibleInDirectory, false);
  assert.equal(audit.eligibleForSearch, false);
  assert.equal(audit.published, false);
  assert.equal(audit.indexable, false);
  assert.equal(audit.bookingEnabled, false);
  assert.equal(audit.locationResolved, false);
  assert.ok(audit.hiddenReasons.length > 0);
});

test("catalogue IDs repair stale parent state while preserving governance outside the engine", () => {
  const result = evaluatePanditLocation({
    id: 9, stateId: 1, cityId: 20, state: "Delhi", city: "Bangalore",
    latitude: 12.97, longitude: 77.59,
  }, states, cities);
  assert.equal(result.status, "auto_corrected");
  assert.equal(result.proposed?.state, "Karnataka");
  assert.equal(result.proposed?.city, "Bengaluru");
  assert.ok(result.issueCategories.includes("city_state_mismatch"));
});

test("audit summary counts review and auto-correction outcomes", () => {
  const rows = [
    evaluatePanditLocation({ id: 1, state: "Delhi", city: "New Delhi", stateId: 1, cityId: 10, latitude: 28.6, longitude: 77.2 }, states, cities),
    evaluatePanditLocation({ id: 2, state: "Karnataka", city: "Bangalore", latitude: 12.97, longitude: 77.59 }, states, cities),
  ];
  const summary = summarizeLocationAudit(rows);
  assert.equal(summary.total, 2);
  assert.equal(summary.verified, 1);
  assert.equal(summary.autoCorrectable, 1);
});

test("rectification migration is additive and rerunnable", () => {
  const migration = readFileSync(new URL("../migrations/0031_pandit_location_rectification_proposals.sql", import.meta.url), "utf8");
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "coordinate_source"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "coordinate_confidence"/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS "coordinate_verified_at"/);
  assert.match(migration, /CREATE TABLE IF NOT EXISTS/);
  assert.match(migration, /CREATE UNIQUE INDEX IF NOT EXISTS/);
  assert.match(migration, /dedupe_key/);
  assert.doesNotMatch(migration, /\bDROP TABLE\b|\bTRUNCATE\b/);
  const routes = readFileSync(new URL("./pandit-location-rectification-routes.ts", import.meta.url), "utf8");
  assert.match(routes, /coordinateSource/);
  assert.match(routes, /coordinateVerifiedAt/);
});