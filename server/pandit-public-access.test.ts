import assert from "node:assert/strict";
import test from "node:test";
import {
  isPanditStorefrontPublished,
  publicPanditReviewDto,
  publicPanditServiceDto,
  publicStorefrontPanditDto,
  adminTrustBadgesSchema,
  publicAdminTrustBadges,
  storefrontServiceEnrichment,
  storefrontVerifiedFacts,
} from "./pandit-public-access";
import { isPanditPubliclyEligible } from "./pandit-public-eligibility";

test("public safety is independent from directory/search switches for published-profile contact", () => {
  const states = new Set([1]);
  const cities = new Map([[2, { id: 2, stateId: 1 }]]);
  const safeButHidden = { verified: true, onLeave: false, archived: false, accountStatus: "active", locationReviewStatus: "resolved", stateId: 1, cityId: 2, directoryVisible: false, searchEligible: false };
  assert.equal(isPanditPubliclyEligible(safeButHidden, states, cities), true);
  assert.equal(isPanditPubliclyEligible({ ...safeButHidden, accountStatus: "banned" }, states, cities), false);
  assert.equal(isPanditPubliclyEligible({ ...safeButHidden, verified: false }, states, cities), false);
});

test("public storefront DTO excludes private and commercial Pandit fields", () => {
  const dto = publicStorefrontPanditDto({
    id: 7,
    name: "Pandit Test",
    slug: "pandit-test",
    city: "Mumbai",
    state: "Maharashtra",
    regionalOrigin: "North Indian",
    specialization: "Griha Pravesh",
    languages: "Hindi, Sanskrit",
    experience: 12,
    fees: 5100,
    rating: 4.9,
    reviewCount: 10,
    verified: true,
    image: "/pandit.jpg",
    bio: "Bio",
    phone: "9999999999",
    email: "private@example.com",
    latitude: 19.1,
    longitude: 72.9,
    tier: "gold",
    membershipNo: "VT-123",
    locationReviewStatus: "resolved",
  });

  assert.equal(dto.verified, true);
  for (const field of ["phone", "email", "latitude", "longitude", "tier", "membershipNo", "locationReviewStatus"]) {
    assert.equal(field in dto, false, `${field} must not be public`);
  }
});

test("public review DTO excludes reviewer email", () => {
  const dto = publicPanditReviewDto({
    id: 9,
    panditId: 7,
    reviewerName: "Customer",
    reviewerEmail: "private@example.com",
    reviewerCity: "Mumbai",
    rating: 5,
    comment: "Excellent",
    serviceType: "Griha Pravesh",
    panditReply: null,
    panditRepliedAt: null,
    createdAt: new Date("2026-09-01T00:00:00Z"),
  });

  assert.equal("reviewerEmail" in dto, false);
  assert.equal(dto.reviewerName, "Customer");
});

test("store publication requires both the legacy flag and published status", () => {
  assert.equal(isPanditStorefrontPublished({ isPublished: true, status: "published" }), true);
  assert.equal(isPanditStorefrontPublished({ isPublished: true, status: "draft" }), false);
  assert.equal(isPanditStorefrontPublished({ isPublished: false, status: "published" }), false);
});

test("public service DTO exposes catalogue identity and offering fields only", () => {
  const dto = publicPanditServiceDto({
    service: {
      id: 14,
      panditId: 7,
      masterServiceId: 3,
      price: 5100,
      durationMinutes: 90,
      mode: "in_person",
      description: "Traditional vidhi",
      preparation: "Keep the puja area clean",
      inclusions: ["Sankalp", "Havan"],
      serviceAreas: ["Varanasi"],
      availability: "Morning",
      displayOrder: 1,
      internalNote: "private",
    },
    master: {
      name: "Griha Pravesh",
      slug: "griha-pravesh",
      category: "Home ceremonies",
      serviceType: "puja",
    },
  });

  assert.equal(dto.name, "Griha Pravesh");
  assert.equal(dto.price, 5100);
  assert.equal("panditId" in dto, false);
  assert.equal("internalNote" in dto, false);
});

test("storefront service facets and coverage derive only from active public DTOs", () => {
  const enrichment = storefrontServiceEnrichment([
    { category: "Home Ceremonies", slug: "griha-pravesh", serviceAreas: [" Mumbai ", "mumbai"], mode: "in_person" },
    { category: "Home Ceremonies", slug: "satyanarayan-puja", serviceAreas: ["Pune"], mode: "online" },
    { category: "Life Events", slug: "wedding", serviceAreas: [], mode: "virtual" },
  ], { city: "Mumbai", state: "Maharashtra" });
  assert.deepEqual(enrichment.serviceCatalog, {
    categories: [
      { name: "Home Ceremonies", slug: "home-ceremonies", serviceCount: 2 },
      { name: "Life Events", slug: "life-events", serviceCount: 1 },
    ],
    totalActiveServices: 3,
  });
  assert.deepEqual(enrichment.serviceCoverage, {
    primaryLocation: { city: "Mumbai", state: "Maharashtra" },
    inPersonAreas: ["Mumbai"],
    onlineAvailable: true,
  });
});

test("trust badge validation allows only controlled safe admin endorsements", () => {
  assert.equal(adminTrustBadgesSchema.safeParse([{ key: "regional_expert", detail: "North India" }]).success, true);
  assert.equal(adminTrustBadgesSchema.safeParse([{ key: "vedic_scholar", detail: "Unsupported" }]).success, false);
  assert.equal(adminTrustBadgesSchema.safeParse([{ key: "regional_expert", detail: "<b>HTML</b>" }]).success, false);
  assert.equal(adminTrustBadgesSchema.safeParse([{ key: "not_real" }]).success, false);
  assert.deepEqual(publicAdminTrustBadges([{ key: "regional_expert", detail: "North India" }]), [
    { key: "regional_expert", label: "Regional Expert", detail: "North India" },
  ]);
});

test("verified facts expose only public-safe authoritative values", () => {
  const facts = storefrontVerifiedFacts({
    verified: true,
    registrationNo: "VT-REG-1",
    experience: 10,
    reviewCount: 3,
    completedBookingCount: 4,
    activeMembership: true,
  });
  assert.deepEqual(facts.map(fact => fact.key), [
    "identity_verified", "registration", "active_membership", "experience", "published_reviews", "completed_bookings",
  ]);
  assert.equal(JSON.stringify(facts).includes("VT-REG-1"), false, "registration identifiers must not be disclosed");
});