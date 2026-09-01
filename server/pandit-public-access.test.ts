import assert from "node:assert/strict";
import test from "node:test";
import { publicPanditReviewDto, publicStorefrontPanditDto } from "./pandit-public-access";

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