import test from "node:test";
import assert from "node:assert/strict";
import { evaluateSelectedBookingEligibility } from "./pandit-selected-booking-eligibility";

const future = "2030-01-07"; // Monday
const rule = { weekday: 1, startMinutes: 9 * 60, endMinutes: 17 * 60, mode: "hybrid", isActive: true };

test("selected booking requires each package component, coverage, and an active slot", () => {
  const accepted = evaluateSelectedBookingEligibility({
    mode: "in_person", offerings: [{ mode: "hybrid", serviceAreas: ["Varanasi"] }, { mode: "in_person", serviceAreas: ["Varanasi"] }],
    addressCity: "Varanasi", date: future, timeSlot: "10:00", rules: [rule], now: new Date("2029-01-01"),
  });
  assert.equal(accepted.passed, true);
  const rejected = evaluateSelectedBookingEligibility({
    mode: "online", offerings: [{ mode: "online" }, { mode: "in_person" }],
    date: future, timeSlot: "10:00", rules: [rule], now: new Date("2029-01-01"),
  });
  assert.equal(rejected.checks.selectedOfferingMode, false);
  assert.equal(rejected.passed, false);
});

test("selected booking rejects past, outside-hours, and uncovered at-home slots", () => {
  const result = evaluateSelectedBookingEligibility({
    mode: "in_person", offerings: [{ mode: "in_person", serviceAreas: ["Varanasi"] }],
    addressCity: "Delhi", date: "2020-01-06", timeSlot: "20:00", rules: [rule], now: new Date("2029-01-01"),
  });
  assert.equal(result.checks.coverage, false);
  assert.equal(result.checks.slot, false);
});

test("selected booking compares the slot instant in the availability rule timezone", () => {
  const result = evaluateSelectedBookingEligibility({
    mode: "online",
    offerings: [{ mode: "online", serviceAreas: [] }],
    date: "2026-09-14",
    timeSlot: "09:00",
    rules: [{
      weekday: 1,
      startMinutes: 8 * 60,
      endMinutes: 12 * 60,
      mode: "online",
      timezone: "Asia/Kolkata",
      isActive: true,
    }],
    // 09:00 IST is 03:30 UTC, so this request is already in the past.
    now: new Date("2026-09-14T04:00:00Z"),
  });
  assert.equal(result.checks.slot, false);
  assert.equal(result.passed, false);
});