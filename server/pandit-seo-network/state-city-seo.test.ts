import assert from "node:assert/strict";
import test from "node:test";
import {
  buildHierarchicalLocationSeo,
  getHierarchicalLocation,
  hierarchicalLocationSitemapPaths,
  resolveLegacyCityLocation,
} from "./state-city-seo";
import { locationEditorialIsIndexable } from "./editorial";

const provider = {
  entityId: "pandit:1",
  canonicalUrl: "/pandit/acharya-one",
  pandit: { id: 1, name: "Acharya One", slug: "acharya-one" },
};

const projection = {
  profiles: [],
  cities: [{
    entityId: "city:10",
    canonicalUrl: "/book-pandit-online/up-noida",
    city: { id: 10, stateId: 1, name: "Noida", slug: "up-noida", aliases: ["noida"] },
    state: { id: 1, name: "Uttar Pradesh", code: "UP" },
    providers: [provider],
    services: [],
    indexability: { status: "noindex_insufficient_supply", indexable: false, reasons: ["requires_3_qualifying_providers"] },
  }],
} as any;

test("state and city locations have one canonical hierarchy and aliases resolve", () => {
  const state = getHierarchicalLocation(projection, "up");
  assert.equal(state?.canonicalUrl, "/book-pandit-online/uttar-pradesh");
  const city = getHierarchicalLocation(projection, "uttar-pradesh", "up-noida");
  assert.equal(city?.canonicalUrl, "/book-pandit-online/uttar-pradesh/noida");
  assert.equal(resolveLegacyCityLocation(projection, "noida")?.canonicalUrl, city?.canonicalUrl);
});

test("hierarchical SEO is fact grounded and noindexes unpublished thin copy", () => {
  const city = getHierarchicalLocation(projection, "uttar-pradesh", "noida")!;
  const head = buildHierarchicalLocationSeo(city, "https://vedictatva.com", {
    introduction: "",
    status: "draft",
  });
  assert.equal(head.indexable, false);
  assert.equal(head.canonical, "/book-pandit-online/uttar-pradesh/noida");
  assert.deepEqual(
    head.schemas.map((schema) => schema.payload["@type"]),
    ["BreadcrumbList", "ItemList", "City"],
  );
});

test("location sitemap emits only indexable hierarchy pages", () => {
  assert.deepEqual(
    [...hierarchicalLocationSitemapPaths(projection)],
    [],
  );
});

test("editorial publication is required in addition to supply for indexing", () => {
  const city = {
    ...getHierarchicalLocation(projection, "uttar-pradesh", "noida")!,
    indexability: { status: "indexable" as const, indexable: true, reasons: [] },
  };
  assert.equal(locationEditorialIsIndexable(city, null), false);
  assert.equal(locationEditorialIsIndexable(city, {
    status: "draft",
    introduction: "Draft facts",
  }), false);
  assert.equal(locationEditorialIsIndexable(city, {
    status: "published",
    introduction: "Reviewed facts",
  }), true);
});