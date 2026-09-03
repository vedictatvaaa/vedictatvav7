import assert from "node:assert/strict";
import test from "node:test";
import {
  assertPackagePriceCompliant,
  assertRateCompliant,
  authoritativeBookingPrice,
  findTravelBand,
} from "./puja-booking/pricing";

test("rate policy accepts exact boundaries and rejects adjacent values", () => {
  const policy = { minRate: 1000, maxRate: 5000 };
  assert.doesNotThrow(() => assertRateCompliant(1000, policy));
  assert.doesNotThrow(() => assertRateCompliant(5000, policy));
  assert.throws(() => assertRateCompliant(999, policy), /at least 1000/);
  assert.throws(() => assertRateCompliant(5001, policy), /not exceed 5000/);
});

test("package price cannot bypass component policy totals", () => {
  const policies = [{ minRate: 1000, maxRate: 2000 }, { minRate: 500, maxRate: 1500 }];
  assert.doesNotThrow(() => assertPackagePriceCompliant(1500, policies));
  assert.doesNotThrow(() => assertPackagePriceCompliant(3500, policies));
  assert.throws(() => assertPackagePriceCompliant(1499, policies));
  assert.throws(() => assertPackagePriceCompliant(3501, policies));
});

test("travel bands include exact edges and virtual travel is always zero", () => {
  const bands = [
    { id: 1, minDistanceKm: 0, maxDistanceKm: 10, charge: 100 },
    { id: 2, minDistanceKm: 10.01, maxDistanceKm: 20, charge: 200 },
  ];
  assert.equal(findTravelBand(10, bands)?.id, 1);
  assert.equal(findTravelBand(10.01, bands)?.id, 2);
  assert.equal(findTravelBand(20.01, bands), null);
  assert.equal(authoritativeBookingPrice({
    baseAmount: 1000, mode: "virtual", policy: { minRate: 1000, maxRate: 1000 },
    distanceKm: null, travelBands: bands,
  }).travelAmount, 0);
  assert.equal(authoritativeBookingPrice({
    baseAmount: 1000, mode: "at_home", policy: { minRate: 1000, maxRate: 1000 },
    distanceKm: null, travelBands: bands,
  }).totalAmount, null);
});