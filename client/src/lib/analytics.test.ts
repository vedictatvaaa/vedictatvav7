import assert from "node:assert/strict";
import test from "node:test";
import { normalizeAnalyticsSlug } from "./analytics";

test("analytics accepts canonical-looking slugs but rejects identifiers and arbitrary query payloads", () => {
  assert.equal(normalizeAnalyticsSlug("satyanarayan-puja"), "satyanarayan-puja");
  assert.equal(normalizeAnalyticsSlug("123456"), "unspecified");
  assert.equal(normalizeAnalyticsSlug("contact@example.com"), "unspecified");
  assert.equal(normalizeAnalyticsSlug("user supplied words"), "unspecified");
  assert.equal(normalizeAnalyticsSlug(undefined), "unspecified");
});