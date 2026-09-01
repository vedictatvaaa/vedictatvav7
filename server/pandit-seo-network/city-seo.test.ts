import assert from "node:assert/strict";
import test from "node:test";
import { buildPanditCitySeoHead } from "./city-seo";

const provider = {
  canonicalUrl: "/pandit/acharya-one",
  pandit: { name: "Acharya One" },
};
const city = {
  canonicalUrl: "/book-pandit-online/varanasi",
  city: { name: "Varanasi" },
  state: { name: "Uttar Pradesh" },
  providers: [provider],
  indexability: { indexable: true },
  services: [],
} as any;

test("indexable city SSR is self-canonical with Breadcrumb and ItemList only", () => {
  const head = buildPanditCitySeoHead(city, "https://vedictatva.com");
  assert.equal(head.canonical, city.canonicalUrl);
  assert.equal(head.robotsIndex, true);
  assert.deepEqual(head.jsonLd.map((schema) => schema.payload["@type"]), ["BreadcrumbList", "ItemList"]);
  assert.equal(head.jsonLd.some((schema) => schema.payload["@type"] === "Organization"), false);
});

test("city-service SSR follows central robots and adds Service schema", () => {
  const service = {
    canonicalUrl: `${city.canonicalUrl}/rudrabhishek-puja`,
    service: { name: "Rudrabhishek Puja" },
    providers: [provider],
    indexability: { indexable: false },
  } as any;
  const head = buildPanditCitySeoHead(city, "https://vedictatva.com", service);
  assert.equal(head.canonical, service.canonicalUrl);
  assert.equal(head.robotsIndex, false);
  assert.deepEqual(head.jsonLd.map((schema) => schema.payload["@type"]), ["BreadcrumbList", "ItemList", "Service"]);
});