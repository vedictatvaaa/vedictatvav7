import assert from "node:assert/strict";
import test from "node:test";
import {
  isPanditStorefrontPublished,
  publicPanditReviewDto,
  publicPanditServiceDto,
  publicStorefrontPanditDto,
} from "./pandit-public-access";

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