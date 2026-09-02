import assert from "node:assert/strict";
import test from "node:test";
import { redirectTargetWithQuery, resolvePanditCityCanonicalization } from "./pandit-city-canonicalization";

const projection = { cities: [{ city: { slug: "delhi" }, canonicalUrl: "/book-pandit-online/delhi", services: [
  { canonicalUrl: "/book-pandit-online/delhi/navgraha-shanti-puja", service: { slug: "navgraha-shanti-puja", name: "Navgraha Shanti Puja" } },
] }] };

test("canonical city-service passes through exact projected slug and aliases resolve", () => {
  assert.equal(resolvePanditCityCanonicalization(projection, "canonical", "delhi", "navgraha-shanti-puja"), null);
  assert.equal(resolvePanditCityCanonicalization(projection, "canonical", "delhi", "navgraha-shanti"), "/book-pandit-online/delhi/navgraha-shanti-puja");
  assert.equal(resolvePanditCityCanonicalization(projection, "legacy", "delhi", "navgraha-shanti-puja"), "/book-pandit-online/delhi/navgraha-shanti-puja");
});

test("unmapped services deliberately fall back to the known city hub and retain queries", () => {
  assert.equal(resolvePanditCityCanonicalization(projection, "canonical", "delhi", "unknown"), "/book-pandit-online/delhi");
  assert.equal(redirectTargetWithQuery("/book-pandit-online/delhi", "/pandits/delhi/unknown?ref=old&x=1"), "/book-pandit-online/delhi?ref=old&x=1");
});