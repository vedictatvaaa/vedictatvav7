import assert from "node:assert/strict";
import test from "node:test";
import { redirectTargetWithQuery, resolvePanditCityCanonicalization } from "./pandit-city-canonicalization";

const projection = { cities: [{ city: { slug: "delhi", name: "Delhi" }, state: { name: "NCT of Delhi" }, canonicalUrl: "/book-pandit-online/delhi", services: [
  { canonicalUrl: "/book-pandit-online/delhi/navgraha-shanti-puja", service: { slug: "navgraha-shanti-puja", name: "Navgraha Shanti Puja" } },
] }] };

test("flat city-service inputs permanently consolidate to the hierarchy", () => {
  assert.equal(resolvePanditCityCanonicalization(projection, "canonical", "delhi", "navgraha-shanti-puja"), "/book-pandit-online/nct-of-delhi/delhi");
  assert.equal(resolvePanditCityCanonicalization(projection, "canonical", "delhi", "navgraha-shanti"), "/book-pandit-online/nct-of-delhi/delhi");
  assert.equal(resolvePanditCityCanonicalization(projection, "legacy", "delhi", "navgraha-shanti-puja"), "/book-pandit-online/nct-of-delhi/delhi");
});

test("unmapped services deliberately fall back to the known city hub and retain queries", () => {
  assert.equal(resolvePanditCityCanonicalization(projection, "canonical", "delhi", "unknown"), "/book-pandit-online/nct-of-delhi/delhi");
  assert.equal(redirectTargetWithQuery("/book-pandit-online/nct-of-delhi/delhi", "/pandits/delhi/unknown?ref=old&x=1"), "/book-pandit-online/nct-of-delhi/delhi?ref=old&x=1");
});