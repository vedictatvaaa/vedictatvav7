import test from "node:test";
import assert from "node:assert/strict";
import { evaluatePanditBookingEligibility } from "./pandit-booking-eligibility";

test("managed booking does not require storefront or directory governance", () => {
  const result = evaluatePanditBookingEligibility({
    accountStatus: "active", verified: true, bookingEnabled: true,
    onLeave: false, archived: false, availability: "available",
  }, {
    services: [{ mode: "in_person", serviceAreas: ["Varanasi"] }],
    pujaSupported: true,
  });
  assert.equal(result.result.passed, true);
  assert.equal("directoryPublished" in result.checks, false);
});

test("managed booking retains its own account, service, coverage, and availability gates", () => {
  const result = evaluatePanditBookingEligibility({
    accountStatus: "suspended", verified: true, bookingEnabled: false,
    onLeave: false, archived: false, availability: "unavailable",
  }, { services: [{ mode: "in_person", serviceAreas: [] }], pujaSupported: false });
  assert.equal(result.checks.active.passed, false);
  assert.equal(result.checks.bookingEnabled.passed, false);
  assert.equal(result.checks.serviceAreaApproved.passed, false);
  assert.equal(result.checks.pujaSupported.passed, false);
  assert.equal(result.checks.availability.passed, false);
});