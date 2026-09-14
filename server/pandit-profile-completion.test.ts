import assert from "node:assert/strict";
import test from "node:test";
import { analyzeProfileCompletion, hashProfileSnapshot, profileSnapshot, type LegacyPanditInput } from "./pandit-profile-completion";

const legacy = (overrides: Partial<LegacyPanditInput> = {}): LegacyPanditInput => ({
  id: 7,
  name: "Acharya Sharma",
  slug: "acharya-sharma",
  city: "New Delhi",
  state: "Delhi",
  specialization: "Satyanarayan Katha; Griha Pravesh",
  languages: "Hindi; Sanskrit",
  experience: 12,
  bio: null,
  education: null,
  serviceArea: "New Delhi; Gurugram",
  verified: true,
  archived: false,
  directoryVisible: true,
  searchEligible: true,
  bookingEnabled: false,
  indexingMode: "default",
  services: [{
    id: 9,
    masterServiceId: 11,
    name: "Satyanarayan Katha",
    slug: "satyanarayan-katha",
    mode: "in_person",
    serviceAreas: ["New Delhi"],
    isActive: true,
  }],
  ...overrides,
});

test("profile completion only proposes deterministic normalization from supplied facts", () => {
  const result = analyzeProfileCompletion(legacy());
  const language = result.findings.find((finding) => finding.fieldKey === "pandits.languages");
  assert.equal(language?.proposal?.proposed, "Hindi, Sanskrit");
  assert.equal(language?.proposal?.confidence, 1);
  assert.equal(result.findings.some((finding) => finding.fieldKey === "pandits.education" && finding.proposal), false);
  assert.ok(result.sourceSnapshotHash);
});

test("missing education, language, and service facts remain unknown instead of being invented", () => {
  const result = analyzeProfileCompletion(legacy({
    languages: null,
    specialization: null,
    services: [],
    serviceArea: null,
  }));
  assert.equal(result.findings.find((finding) => finding.fieldKey === "pandits.education")?.proposalClass, "unknown");
  assert.equal(result.findings.find((finding) => finding.fieldKey === "pandits.languages")?.proposalClass, "unknown");
  assert.equal(result.findings.find((finding) => finding.fieldKey === "panditServices")?.proposalClass, "unknown");
  assert.equal(result.findings.some((finding) => finding.fieldKey === "storefront.seoTitle" && finding.proposal), false);
});

test("source hashes change when governed profile facts change", () => {
  const before = profileSnapshot(legacy());
  const after = profileSnapshot(legacy({ city: "Gurugram" }));
  assert.notEqual(hashProfileSnapshot(before), hashProfileSnapshot(after));
});