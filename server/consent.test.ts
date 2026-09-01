import assert from "node:assert/strict";
import test from "node:test";
import { hasAnalyticsConsent, hasMarketingConsent, parseConsentCookie } from "./consent";

test("consent cookie parser rejects missing and malformed values", () => {
  assert.equal(parseConsentCookie(undefined), null);
  assert.equal(parseConsentCookie("v1.a1"), null);
  assert.equal(parseConsentCookie("v2.a1.m1"), null);
});

test("analytics and marketing require their explicit grant", () => {
  assert.deepEqual(parseConsentCookie("v1.a1.m0"), { analytics: true, marketing: false });
  assert.equal(hasAnalyticsConsent({ cookies: { vt_consent: "v1.a1.m0" } } as any), true);
  assert.equal(hasMarketingConsent({ cookies: { vt_consent: "v1.a1.m0" } } as any), false);
  assert.equal(hasAnalyticsConsent({ cookies: { vt_consent: "v1.a0.m1" } } as any), false);
  assert.equal(hasMarketingConsent({ cookies: { vt_consent: "v1.a0.m1" } } as any), true);
});
