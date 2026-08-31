import test from "node:test";
import assert from "node:assert/strict";
import { isPanditPubliclyEligible } from "./pandit-public-eligibility";

const states = new Set([1]);
const cities = new Map([[10, { id: 10, stateId: 1 }]]);
const valid = {
  verified: true,
  onLeave: false,
  locationReviewStatus: "resolved",
  stateId: 1,
  cityId: 10,
};

test("eligible Pandit can be booked publicly", () => {
  assert.equal(isPanditPubliclyEligible(valid, states, cities), true);
});

test("unverified and on-leave Pandits are rejected", () => {
  assert.equal(isPanditPubliclyEligible({ ...valid, verified: false }, states, cities), false);
  assert.equal(isPanditPubliclyEligible({ ...valid, onLeave: true }, states, cities), false);
});

test("unresolved and missing locations are rejected", () => {
  assert.equal(isPanditPubliclyEligible({ ...valid, locationReviewStatus: "needs_review" }, states, cities), false);
  assert.equal(isPanditPubliclyEligible({ ...valid, stateId: null }, states, cities), false);
  assert.equal(isPanditPubliclyEligible({ ...valid, cityId: null }, states, cities), false);
});

test("inactive and mismatched State/City locations are rejected", () => {
  assert.equal(isPanditPubliclyEligible(valid, new Set(), cities), false);
  assert.equal(isPanditPubliclyEligible(valid, states, new Map()), false);
  assert.equal(isPanditPubliclyEligible(valid, states, new Map([[10, { id: 10, stateId: 2 }]])), false);
});