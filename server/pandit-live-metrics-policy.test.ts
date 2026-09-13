import test from "node:test";
import assert from "node:assert/strict";
import {
  EXCLUDED_BOOKING_STATUSES,
  isLegitimateEnrolledPandit,
  isQualifyingBooking,
  metric,
  unavailablePanditLiveMetrics,
} from "./pandit-live-metrics-policy";

test("booking metrics use a lifecycle allow-list and exclude non-genuine statuses", () => {
  assert.equal(isQualifyingBooking("completed"), true);
  assert.equal(isQualifyingBooking("in_progress"), true);
  for (const status of EXCLUDED_BOOKING_STATUSES) {
    assert.equal(isQualifyingBooking(status), false, status);
  }
  assert.equal(isQualifyingBooking("future_status"), false);
});

test("zero remains an available value and unavailable data never becomes zero", () => {
  assert.deepEqual(metric(0), { value: 0, state: "available", health: "available", scope: "global" });
  const payload = unavailablePanditLiveMetrics("database unavailable");
  assert.equal(payload.health, "unavailable");
  assert.equal(payload.updatedAt, null);
  assert.equal(payload.metrics.onlineNow.value, null);
  assert.equal(payload.metrics.onlineNow.state, "unavailable");
});

test("enrollment includes unverified and inactive account states but excludes archived and unknown records", () => {
  assert.equal(isLegitimateEnrolledPandit({ archived: false, verified: false, accountStatus: "active" }), true);
  assert.equal(isLegitimateEnrolledPandit({ archived: false, verified: true, accountStatus: "suspended" }), true);
  assert.equal(isLegitimateEnrolledPandit({ archived: false, verified: false, accountStatus: "banned" }), true);
  assert.equal(isLegitimateEnrolledPandit({ archived: true, verified: true, accountStatus: "active" }), false);
  assert.equal(isLegitimateEnrolledPandit({ archived: false, accountStatus: "deleted" }), false);
  assert.equal(isLegitimateEnrolledPandit({ archived: false, accountStatus: "test" }), false);
});