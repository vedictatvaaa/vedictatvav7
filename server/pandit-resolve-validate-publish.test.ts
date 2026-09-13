import assert from "node:assert/strict";
import test from "node:test";
import {
  deterministicLocationChange,
  validateResolvePublish,
} from "./pandit-resolve-validate-publish";

const states = [{ id: 1, name: "Delhi", isActive: true }];
const cities = [{ id: 2, stateId: 1, name: "New Delhi", aliases: ["Delhi"], isActive: true }];
const activeStateIds = new Set([1]);
const activeCityById = new Map([[2, { id: 2, stateId: 1 }]]);
const services = [{
  mode: "online", serviceAreas: [], isActive: true, masterActive: true,
  masterSlug: "satyanarayan-puja", supportedModes: ["online"],
}];

function completePandit(overrides: Record<string, unknown> = {}) {
  return {
    id: 1, name: "Pandit Example", slug: "pandit-example", image: "/p.jpg",
    bio: "A factual profile biography that is deliberately longer than eighty characters for this gate.",
    languages: "Hindi", verified: true, onLeave: false, archived: false,
    accountStatus: "active", suspendedUntil: null, locationReviewStatus: "resolved",
    stateId: 1, cityId: 2, directoryVisible: true, searchEligible: true,
    bookingEnabled: true, indexingMode: "auto", availability: "available",
    ...overrides,
  };
}

test("deterministic alias repair never changes exact coordinates", () => {
  const pandit = completePandit({
    state: "Delhi", city: "Delhi", latitude: 28.6139, longitude: 77.209,
    stateId: null, cityId: null, locationReviewStatus: "needs_review",
  });
  const result = deterministicLocationChange(pandit, states, cities);
  assert.equal(result.autoApply, true);
  assert.equal(result.candidates[0]?.city, "New Delhi");
  assert.equal(pandit.latitude, 28.6139);
  assert.equal(pandit.longitude, 77.209);
});

test("validation blocks banned, leave, noindex, and incomplete profiles with exact reasons", () => {
  const result = validateResolvePublish({
    pandit: completePandit({
      accountStatus: "banned", onLeave: true, indexingMode: "noindex",
      image: null, languages: "", bio: "short",
    }),
    storefront: { isPublished: true, status: "published", bio: "short" },
    content: null, services, activeStateIds, activeCityById,
  });
  assert.equal(result.indexable, false);
  assert.ok(result.reasons.includes("banned"));
  assert.ok(result.reasons.includes("on_leave"));
  assert.ok(result.reasons.includes("governance_noindex"));
  assert.ok(result.reasons.includes("profile_image_missing"));
  assert.ok(result.reasons.includes("bio_under_80_characters"));
  assert.ok(result.reasons.includes("languages_missing"));
});

test("canonical service and bookable mode are authoritative gates", () => {
  const result = validateResolvePublish({
    pandit: completePandit(),
    storefront: { isPublished: true, status: "published" },
    content: null,
    services: [{ mode: "online", serviceAreas: [], isActive: true, masterActive: false, masterSlug: "inactive", supportedModes: ["online"] }],
    activeStateIds, activeCityById,
  });
  assert.equal(result.activeCanonicalService, false);
  assert.equal(result.bookableMode, false);
  assert.ok(result.reasons.includes("active_canonical_service_missing"));
  assert.ok(result.reasons.includes("bookable_mode_missing"));
});