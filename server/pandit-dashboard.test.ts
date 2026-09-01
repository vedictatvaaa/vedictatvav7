import assert from "node:assert/strict";
import test from "node:test";
import {
  buildChecklistStates,
  indiaDateKey,
  indiaDayBounds,
  isPendingBookingStatus,
  operationalTodayBookingStatuses,
  storefrontPublicPath,
  storefrontPublicationState,
} from "./pandit-dashboard";

test("India business dates and timestamp bounds do not cross midnight", () => {
  assert.equal(indiaDateKey(new Date("2026-09-01T18:29:59.000Z")), "2026-09-01");
  assert.equal(indiaDateKey(new Date("2026-09-01T18:30:00.000Z")), "2026-09-02");
  const { start, end } = indiaDayBounds("2026-09-02");
  assert.equal(start.toISOString(), "2026-09-01T18:30:00.000Z");
  assert.equal(end.toISOString(), "2026-09-02T18:30:00.000Z");
});

test("pending classifications and publication states stay explicit", () => {
  assert.equal(isPendingBookingStatus("requested"), true);
  assert.equal(isPendingBookingStatus("accepted"), false);
  assert.equal(storefrontPublicationState({ status: "published", isPublished: true }), "published");
  assert.equal(storefrontPublicationState({ status: "pending_review", isPublished: false }), "pending_review");
  assert.equal(storefrontPublicationState({ status: "suspended", isPublished: true }), "suspended");
  assert.equal(storefrontPublicationState(null), "unavailable");
  assert.equal(storefrontPublicPath("Pandit ji/Delhi", { status: "published", isPublished: true }), "/p/Pandit%20ji%2FDelhi");
  assert.equal(storefrontPublicPath("pandit-ji", { status: "draft", isPublished: true }), null);
  assert.equal(storefrontPublicPath("pandit-ji", { status: "published", isPublished: false }), null);
  assert.equal(storefrontPublicPath(null, { status: "published", isPublished: true }), null);
  assert.deepEqual(operationalTodayBookingStatuses, ["pending", "requested", "assigned", "accepted", "completed"]);
  assert.equal(operationalTodayBookingStatuses.includes("declined" as never), false);
  assert.equal(operationalTodayBookingStatuses.includes("cancelled" as never), false);
});

test("checklist differentiates empty configurable data from unavailable systems", () => {
  assert.deepEqual(buildChecklistStates({ hasProfile: false, activeServiceCount: 0, hasAvailability: false }), {
    profile: "empty", services: "empty", gallery: "unavailable", availability: "empty", googleBusiness: "unavailable",
  });
});