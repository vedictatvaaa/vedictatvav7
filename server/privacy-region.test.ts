import assert from "node:assert/strict";
import test from "node:test";
import { resolvePrivacyRegion } from "./privacy-region";

test("confirmed India bypasses privacy acknowledgement", () => {
  assert.equal(resolvePrivacyRegion({ "cf-ipcountry": "IN" }), "india");
  assert.equal(resolvePrivacyRegion({}, "Asia/Kolkata"), "india");
  assert.equal(resolvePrivacyRegion({}, "Asia/Calcutta"), "india");
});

test("confirmed non-India remains subject to acknowledgement", () => {
  assert.equal(resolvePrivacyRegion({ "cf-ipcountry": "US" }, "Asia/Kolkata"), "outside_india");
  assert.equal(resolvePrivacyRegion({ "cloudfront-viewer-country": "GB" }), "outside_india");
});

test("missing or malformed detection fails closed", () => {
  assert.equal(resolvePrivacyRegion({}), "unknown");
  assert.equal(resolvePrivacyRegion({ "cf-ipcountry": "not-a-country" }, "America/New_York"), "unknown");
  assert.equal(resolvePrivacyRegion({ "cf-ipcountry": ["IN"] }, "America/New_York"), "unknown");
});