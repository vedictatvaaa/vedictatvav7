import assert from "node:assert/strict";
import test from "node:test";
import { buildPanditProfileSeoHead } from "./seo";

const profile = {
  canonicalUrl: "/pandit/acharya-test",
  pandit: {
    slug: "acharya-test",
    name: "Acharya Test",
    city: "Varanasi",
    state: "Uttar Pradesh",
    languages: ["Hindi", "Sanskrit"],
    specialization: ["Griha Pravesh"],
    bio: "An experienced Vedic Pandit serving families with clear guidance and traditional rituals.",
    image: "/pandit.jpg",
    rating: 4.9,
    reviewCount: 12,
    verified: true,
  },
  services: [{ slug: "griha-pravesh", name: "Griha Pravesh", price: 5100, mode: "in_person" }],
  indexability: { indexable: true },
} as any;

test("profile SEO follows the central indexability decision and emits factual schemas", () => {
  const head = buildPanditProfileSeoHead(profile, "https://vedictatva.com");
  assert.equal(head.robotsIndex, true);
  assert.equal(head.robotsFollow, true);
  assert.equal(head.canonical, "/pandit/acharya-test");
  assert.equal(head.jsonLd[0].payload.name, "Acharya Test");
  assert.equal(head.jsonLd[0].payload.makesOffer[0].itemOffered.name, "Griha Pravesh");
  assert.equal(head.jsonLd[1].payload.itemListElement[2].item, "https://vedictatva.com/pandit/acharya-test");
});

test("incomplete public profiles remain useful noindex follow pages", () => {
  const head = buildPanditProfileSeoHead({
    ...profile,
    indexability: { indexable: false, status: "noindex_incomplete_profile" },
  }, "https://vedictatva.com");
  assert.equal(head.robotsIndex, false);
  assert.equal(head.robotsFollow, true);
});

test("verified Pandit SEO includes only an exact canonical registration credential", () => {
  const head = buildPanditProfileSeoHead({
    ...profile,
    pandit: { ...profile.pandit, registrationNo: "1001000156" },
  }, "https://vedictatva.com/");
  const person = head.jsonLd[0].payload;
  assert.equal(person.identifier, "1001000156");
  assert.deepEqual(person.hasCredential, {
    "@type": "EducationalOccupationalCredential",
    "@id": "https://vedictatva.com/pandit/acharya-test#credential",
    credentialCategory: "Pandit Registration",
    recognizedBy: { "@id": "https://vedictatva.com/#organization" },
  });

  for (const registrationNo of ["100100015", "１００１０００１５６", undefined]) {
    const invalid = buildPanditProfileSeoHead({
      ...profile,
      pandit: { ...profile.pandit, registrationNo },
    }, "https://vedictatva.com").jsonLd[0].payload;
    assert.equal("identifier" in invalid, false);
    assert.equal("hasCredential" in invalid, false);
  }
  const unverified = buildPanditProfileSeoHead({
    ...profile,
    pandit: { ...profile.pandit, verified: false, registrationNo: "1001000156" },
  }, "https://vedictatva.com").jsonLd[0].payload;
  assert.equal("identifier" in unverified, false);
  assert.equal("hasCredential" in unverified, false);
});