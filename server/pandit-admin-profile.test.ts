import assert from "node:assert/strict";
import test from "node:test";
import { adminPanditProfilePatchSchema } from "./pandit-admin-profile";

test("admin profile patch converts an ISO coordinate timestamp to Date", () => {
  const parsed = adminPanditProfilePatchSchema.safeParse({
    latitude: 28.6139,
    longitude: 77.209,
    coordinateSource: "admin:manual",
    coordinateConfidence: 0.5,
    coordinateVerifiedAt: "2026-09-20T06:00:00.000Z",
  });
  assert.equal(parsed.success, true);
  if (parsed.success) {
    assert.ok(parsed.data.coordinateVerifiedAt instanceof Date);
    assert.equal(parsed.data.coordinateVerifiedAt.toISOString(), "2026-09-20T06:00:00.000Z");
  }
});

test("admin profile patch rejects a malformed coordinate timestamp", () => {
  const parsed = adminPanditProfilePatchSchema.safeParse({
    coordinateVerifiedAt: "not-a-date",
  });
  assert.equal(parsed.success, false);
});

test("admin profile patch keeps nullable coordinate evidence valid", () => {
  assert.equal(adminPanditProfilePatchSchema.safeParse({ coordinateVerifiedAt: null }).success, true);
});
