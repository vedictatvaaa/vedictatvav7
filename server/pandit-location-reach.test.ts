import assert from "node:assert/strict";
import test from "node:test";
import {
  buildPanditDiscoverySummary,
  canViewAllPandits,
  matchesPanditDiscoveryReach,
  matchesPanditListingFilters,
  publicPanditDto,
  type DiscoveryPandit,
} from "./pandit-discovery-policy";
import { matchesCanonicalCityReach } from "./pandit-location-reach";
import { isPanditPubliclyEligible } from "./pandit-public-eligibility";

const NOW = Date.parse("2026-09-01T00:00:00.000Z");
const haryanaChandigarh = { cityId: 10, stateId: 1 };
const gurugram = { cityId: 11, stateId: 1 };
const punjabChandigarh = { cityId: 20, stateId: 2 };
const states = [
  { id: 1, name: "Haryana", code: "HR" },
  { id: 2, name: "Punjab", code: "PB" },
];
const cities = [
  { ...haryanaChandigarh, id: 10, name: "Chandigarh", slug: "hr-chandigarh" },
  { ...gurugram, id: 11, name: "Gurugram", slug: "hr-gurugram" },
  { ...punjabChandigarh, id: 20, name: "Chandigarh", slug: "pb-chandigarh" },
];
const validBase: DiscoveryPandit = {
  id: 1,
  name: "Eligible Pandit",
  verified: true,
  onLeave: false,
  locationReviewStatus: "resolved",
  stateId: 1,
  cityId: 10,
  tier: "free",
  specialization: "Griha Pravesh",
  languages: "Hindi",
  regionalOrigin: "North India",
};

const eligiblePandits: DiscoveryPandit[] = [
  { ...validBase, id: 1, tier: "free" },
  { ...validBase, id: 2, tier: "silver" },
  { ...validBase, id: 3, cityId: 11, tier: "gold", specialization: "Griha Pravesh, Wedding" },
  { ...validBase, id: 4, stateId: 2, cityId: 20, tier: "guru_elite" },
  { ...validBase, id: 5, cityId: 11, tier: "free", specialization: "Wedding" },
  { ...validBase, id: 6, cityId: 11, tier: "gold", tierExpiresAt: "2026-08-31T23:59:59.000Z" },
  { ...validBase, id: 7, tier: "gold", tierExpiresAt: "2026-08-31T23:59:59.000Z" },
  { ...validBase, id: 8, stateId: 2, cityId: 20, tier: "gold", specialization: "Wedding" },
];

test("public eligibility excludes every unresolved or ineligible location/status case", () => {
  const activeStateIds = new Set(states.map((state) => state.id));
  const activeCityById = new Map(cities.map((city) => [city.id, city]));
  const candidates: DiscoveryPandit[] = [
    ...eligiblePandits,
    { ...validBase, id: 101, verified: false },
    { ...validBase, id: 102, onLeave: true },
    { ...validBase, id: 103, locationReviewStatus: "needs_review" },
    { ...validBase, id: 104, stateId: 3, cityId: 30 },
    { ...validBase, id: 105, cityId: 30 },
    { ...validBase, id: 106, stateId: 1, cityId: 20 },
    { ...validBase, id: 107, stateId: null, cityId: null },
  ];

  const visibleIds = candidates
    .filter((pandit) => isPanditPubliclyEligible(pandit, activeStateIds, activeCityById))
    .map((pandit) => pandit.id);

  assert.deepEqual(visibleIds, eligiblePandits.map((pandit) => pandit.id));
});

test("city-scoped tiers do not cross duplicate canonical city names", () => {
  assert.equal(matchesCanonicalCityReach("silver", punjabChandigarh, haryanaChandigarh), false);
  assert.equal(matchesCanonicalCityReach("free", punjabChandigarh, haryanaChandigarh), false);
  assert.equal(matchesCanonicalCityReach("silver", haryanaChandigarh, haryanaChandigarh), true);
});

test("city queries apply exact-City, State, and global membership reach", () => {
  const ids = eligiblePandits
    .filter((pandit) => matchesPanditDiscoveryReach(pandit, haryanaChandigarh, undefined, NOW))
    .map((pandit) => pandit.id);

  assert.deepEqual(ids, [
    1, // Free: exact city.
    2, // Silver: exact city.
    3, // Gold: another city in the selected State.
    4, // Guru Elite: global.
    7, // Expired Gold: downgraded to Free, but still in the exact city.
  ]);
});

test("expired Gold loses State reach while active Gold and Guru Elite retain it", () => {
  const ids = eligiblePandits
    .filter((pandit) => matchesPanditDiscoveryReach(pandit, undefined, 1, NOW))
    .map((pandit) => pandit.id);

  assert.deepEqual(ids, [3, 4]);
  assert.equal(matchesPanditDiscoveryReach(eligiblePandits[5], undefined, 1, NOW), false);
});

test("State-wide discovery counts use the same reach semantics as listing results", () => {
  const summary = buildPanditDiscoverySummary(eligiblePandits, states, cities, "", NOW);

  for (const state of summary.states) {
    const listingCount = eligiblePandits.filter((pandit) =>
      matchesPanditDiscoveryReach(pandit, undefined, state.id, NOW),
    ).length;
    assert.equal(state.stateWideCount, listingCount, state.name);
  }
});

test("service-filtered State and City counts match the filtered eligible records", () => {
  const summary = buildPanditDiscoverySummary(eligiblePandits, states, cities, "griha pravesh", NOW);
  const haryana = summary.states.find((state) => state.id === 1);
  assert.ok(haryana);

  const filtered = eligiblePandits.filter((pandit) =>
    matchesPanditListingFilters(pandit, { service: "griha pravesh" }),
  );
  assert.equal(haryana.count, filtered.filter((pandit) => pandit.stateId === 1).length);
  for (const city of haryana.cities) {
    assert.equal(city.count, filtered.filter((pandit) => pandit.cityId === city.id).length, city.name);
  }
  assert.equal(
    haryana.stateWideCount,
    filtered.filter((pandit) => matchesPanditDiscoveryReach(pandit, undefined, 1, NOW)).length,
  );
});

test("catalogue Puja suffixes and Navagraha spelling variants match Pandit offerings", () => {
  assert.equal(
    matchesPanditListingFilters(
      { specialization: "Marriage, Griha Pravesh, Satyanarayan Katha", languages: "Hindi", regionalOrigin: "North Indian" },
      { service: "Griha Pravesh Puja" },
    ),
    true,
  );
  assert.equal(
    matchesPanditListingFilters(
      { specialization: "Navgraha Shanti, Sunderkand", languages: "Hindi", regionalOrigin: "North Indian" },
      { service: "Navagraha Shanti Puja" },
    ),
    true,
  );
});

test("public listing DTO rejects private and internal fields", () => {
  const dto = publicPanditDto({
    ...validBase,
    phone: "private",
    email: "private",
    passwordHash: "private",
    lastLoginAt: "private",
    latitude: 30.7333,
    longitude: 76.7794,
    leaveNote: "private",
    leaveStartedAt: "private",
    tierExpiresAt: "private",
    commissionPct: 25,
    productCommissionPct: 12,
    membershipNo: "private",
    cardIssued: true,
    cardIssuedAt: "private",
    originalCity: "private",
    originalState: "private",
    boostType: "private",
    boostStartDate: "private",
    boostEndDate: "private",
    boostActive: true,
    fees: 5100,
  }, true, 7.4);
  const forbidden = [
    "phone", "email", "passwordHash", "lastLoginAt",
    "latitude", "longitude",
    "leaveNote", "leaveStartedAt", "locationReviewStatus",
    "tier", "tierExpiresAt", "membershipNo", "cardIssued", "cardIssuedAt",
    "commissionPct", "productCommissionPct", "boostType", "boostStartDate", "boostEndDate", "boostActive",
    "originalCity", "originalState",
  ];

  for (const field of forbidden) assert.equal(field in dto, false, field);
  assert.equal(dto.id, validBase.id);
  assert.equal(dto.fees, 5100);
  assert.equal(dto.verified, true);
  assert.equal(dto.onLeave, false);
  assert.equal(dto.isOnline, true);
  assert.equal(dto.distance, 7.4);
});

test("all=true remains unavailable without a valid Admin session", async () => {
  const seenTokens: string[] = [];
  const validate = async (token: string) => {
    seenTokens.push(token);
    return token === "valid-admin" ? 42 : null;
  };

  assert.equal(await canViewAllPandits(false, undefined, validate), true);
  assert.equal(await canViewAllPandits(true, undefined, validate), false);
  assert.equal(await canViewAllPandits(true, "invalid", validate), false);
  assert.equal(await canViewAllPandits(true, "valid-admin", validate), true);
  assert.deepEqual(seenTokens, ["invalid", "valid-admin"]);
});