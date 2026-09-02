import assert from "node:assert/strict";
import test from "node:test";
import { buildPanditCitySeo, panditCitySeoOrigin } from "./pandit-city-seo";

const base = {
  canonicalUrl: "/book-pandit-online/delhi",
  city: { name: "Delhi", canonicalUrl: "/book-pandit-online/delhi" },
  state: { name: "Delhi" },
  providers: [{ canonicalUrl: "/pandit/a", pandit: { name: "A" } }],
  indexable: true,
};

test("city SEO builder produces stable canonical facts and schemas", () => {
  const result = buildPanditCitySeo(base, "https://example.test");
  assert.equal(result.title, "Pandits in Delhi | Vedic Tatva");
  assert.equal(result.schemas[0].payload["@id"], "https://example.test/book-pandit-online/delhi#breadcrumb");
  assert.equal(result.schemas[1].payload.name, "Pandits in Delhi");
});

test("city-service SEO builder includes stable Service organization and location facts", () => {
  const result = buildPanditCitySeo({ ...base, canonicalUrl: "/book-pandit-online/delhi/griha", service: { name: "Griha Pravesh" } }, "https://example.test");
  assert.equal(result.schemas[2].payload["@id"], "https://example.test/book-pandit-online/delhi/griha#service");
  assert.deepEqual(result.schemas[2].payload.areaServed.containedInPlace, { "@type": "State", name: "Delhi" });
  assert.deepEqual(result.schemas[2].payload.provider, { "@id": "https://example.test/#organization" });
});

test("SEO origin retains the SSR canonical origin during hydration", () => {
  assert.equal(panditCitySeoOrigin("https://public.example/book-pandit-online/delhi", "https://request.example"), "https://public.example");
  assert.equal(panditCitySeoOrigin(null, "https://request.example"), "https://request.example");
});