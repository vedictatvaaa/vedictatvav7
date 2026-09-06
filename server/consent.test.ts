import assert from "node:assert/strict";
import test from "node:test";
import {
  getConsentedReferralSlug,
  hasAnalyticsConsent,
  hasMarketingConsent,
  parseConsentCookie,
} from "./consent";

test("consent cookie parser rejects missing and malformed values", () => {
  assert.equal(parseConsentCookie(undefined), null);
  assert.equal(parseConsentCookie("v1.a1"), null);
  assert.equal(parseConsentCookie("v2.a1.m1"), null);
});

test("analytics and marketing are always enabled without a permission cookie", () => {
  assert.deepEqual(parseConsentCookie("v1.a1.m0"), { analytics: true, marketing: false });
  assert.equal(hasAnalyticsConsent({ cookies: { vt_consent: "v1.a1.m0" } } as any), true);
  assert.equal(hasMarketingConsent({ cookies: { vt_consent: "v1.a1.m0" } } as any), true);
  assert.equal(hasAnalyticsConsent({ cookies: { vt_consent: "v1.a0.m1" } } as any), true);
  assert.equal(hasMarketingConsent({ cookies: { vt_consent: "v1.a0.m1" } } as any), true);
  assert.equal(hasAnalyticsConsent({ cookies: {} } as any), true);
  assert.equal(hasMarketingConsent({ cookies: {} } as any), true);
});

test("referral cookies attribute without requiring a permission cookie", () => {
  const staleReferral = { cookies: { vt_ref: "pt-example", vt_consent: "v1.a1.m0" } };
  assert.equal(getConsentedReferralSlug(staleReferral), "pt-example");
  assert.equal(
    getConsentedReferralSlug({
      cookies: { vt_ref: "pt-example" },
    }),
    "pt-example",
  );
  assert.equal(
    getConsentedReferralSlug({
      cookies: { vt_ref: "pt-example" },
      refSlug: "pt-example",
    }),
    "pt-example",
  );
});
