import assert from "node:assert/strict";
import test from "node:test";
import { mergeCompatibility, mergeDestinationScalars } from "./destination-compat";
import { expandCompatibilityItems } from "../../../server/knowledge-graph/destination-routes";

const legacy = { id: "ayodhya", name: "Legacy", description: "Legacy description", nested: { reach: "retain" }, famousFor: ["retain"] };

test("canonical compatibility leaves empty, error-equivalent, and unmapped static data unchanged", () => {
  assert.deepEqual(mergeCompatibility([legacy], undefined, (row) => `temple-tourism:${row.id}`), [legacy]);
  assert.deepEqual(mergeCompatibility([legacy], [], (row) => `temple-tourism:${row.id}`), [legacy]);
  assert.deepEqual(mergeCompatibility([legacy], [{ sourceKey: "temple-tourism:legacy-only", destination: { slug: "x", name: "No" } }], (row) => `temple-tourism:${row.id}`), [legacy]);
});

test("published mapped destination replaces allowlisted scalars and preserves nested static guide fields", () => {
  const result = mergeCompatibility([legacy], [{ sourceKey: "temple-tourism:ayodhya", destination: { slug: "new-slug", name: "Canonical", description: "Canonical description" } }], (row) => `temple-tourism:${row.id}`);
  assert.equal(result[0].name, "Canonical");
  assert.equal(result[0].description, "Canonical description");
  assert.equal(result[0].id, "ayodhya");
  assert.equal(result[0].nested.reach, "retain");
  assert.deepEqual(result[0].famousFor, ["retain"]);
});

test("expanded consolidated Temple Tourism key updates legacy lat/lng without replacing identity", () => {
  const site = { ...legacy, lat: 1, lng: 2 };
  const result = mergeCompatibility([site], [{ sourceKey: "temple-tourism:ayodhya", destination: { slug: "canonical", name: "Canonical", latitude: 25.1, longitude: 82.9 } }], (row) => `temple-tourism:${row.id}`);
  assert.equal(result[0].name, "Canonical");
  assert.equal(result[0].lat, 25.1);
  assert.equal(result[0].lng, 82.9);
  assert.equal(result[0].id, "ayodhya");
});

test("expanded published consolidated Tirth drives guide and secondary compatibility while legacy-only stays static", () => {
  const items = expandCompatibilityItems("TIRTH", [{
    migrationSourceKey: "tirth-guide:ayodhya-ram-mandir-yatra", id: 1, slug: "ayodhya",
    name: "Canonical Ayodhya", latitude: 25.3, longitude: 82.1,
  }]);
  const sites = mergeCompatibility([{ ...legacy, lat: 0, lng: 0 }, { ...legacy, id: "legacy-only", name: "Keep", lat: 3, lng: 4 }],
    items, (row) => `temple-tourism:${row.id}`);
  assert.deepEqual([sites[0].name, sites[0].lat, sites[0].lng], ["Canonical Ayodhya", 25.3, 82.1]);
  assert.equal(sites[1].name, "Keep");
  const guides = mergeCompatibility([{ id: "ayodhya-ram-mandir-yatra", name: "Guide", nested: { retained: true } }],
    items, (row) => `tirth-guide:${row.id}`);
  assert.equal(guides[0].name, "Canonical Ayodhya");
  assert.equal(guides[0].nested.retained, true);
});

test("consolidated secondary Tirth mapping uses the explicit guide source key", () => {
  const guide = { id: "ayodhya-ram-mandir-yatra", name: "Legacy guide", nested: { itinerary: true } };
  const result = mergeCompatibility([guide], [{ sourceKey: "tirth-guide:ayodhya-ram-mandir-yatra", destination: { slug: "canonical", name: "Canonical guide" } }], (row) => `tirth-guide:${row.id}`);
  assert.equal(result[0].name, "Canonical guide");
  assert.equal(result[0].nested.itinerary, true);
});

test("merge does not accept arbitrary or route-identity fields", () => {
  const result = mergeDestinationScalars(legacy, { slug: "changed", name: "Safe", editorial: { nope: true } } as any);
  assert.equal(result.id, "ayodhya");
  assert.equal((result as any).slug, undefined);
  assert.equal((result as any).editorial, undefined);
});