import assert from "node:assert/strict";
import test from "node:test";
import {
  citationSchema,
  findPujaConflicts,
  normalizeGovernance,
  publicPujaEligible,
  pujaCreateSchema,
  pujaCompleteness,
  pujaPatchSchema,
} from "./puja-governance";

function completePuja(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    slug: "lakshmi-puja",
    name: "Lakshmi Puja",
    shortDescription: "A complete guide.",
    whyPerformed: "Purpose",
    storyMyth: "Traditional background",
    howCelebrated: "Vidhi",
    ethics: "Guidance",
    benefits: "Benefits",
    requirements: [{ item: "Diya", qty: "1" }],
    faq: [{ q: "When?", a: "At an approved time." }],
    intents: ["Prosperity"],
    deities: ["Lakshmi"],
    ceremonies: [],
    festivals: ["Diwali"],
    aliases: ["Mahalakshmi Puja"],
    sourceNotes: "Reviewed traditional practice.",
    metaTitle: "Lakshmi Puja guide",
    metaDescription: "A reviewed guide to Lakshmi Puja.",
    citations: [{ label: "Reviewer notes", sourceType: "reviewer" }],
    onlineEligible: true,
    inPersonEligible: true,
    reviewStatus: "approved",
    reviewedByPanditId: 7,
    isPublished: true,
    ...overrides,
  };
}

test("taxonomy normalization trims and removes case-insensitive duplicates", () => {
  const normalized = normalizeGovernance({
    intents: [" Prosperity ", "prosperity", "Protection"],
    aliases: ["Lakshmi Pooja", " lakshmi pooja "],
  });
  assert.deepEqual(normalized.intents, ["Prosperity", "Protection"]);
  assert.deepEqual(normalized.aliases, ["Lakshmi Pooja"]);
});

test("completeness reports actionable missing governance fields", () => {
  const result = pujaCompleteness(completePuja({ citations: [], sourceNotes: "" }));
  assert.equal(result.complete, false);
  assert.ok(result.missing.includes("Source notes"));
  assert.ok(result.missing.includes("At least one citation"));
});

test("name and alias collisions are blocking conflicts", () => {
  const candidate = completePuja({ id: 2, slug: "mahalakshmi", name: "Mahalakshmi Puja", aliases: [] });
  const conflicts = findPujaConflicts(candidate, [completePuja()], candidate.id);
  assert.ok(conflicts.some(conflict => conflict.type === "alias" && conflict.recordId === 1));
});

test("public eligibility requires approval, completeness, publication and no conflict", () => {
  const puja = completePuja();
  assert.equal(publicPujaEligible(puja), true);
  assert.equal(publicPujaEligible(puja, [], false), false);
  assert.equal(publicPujaEligible({ ...puja, reviewStatus: "in_review" }), false);
  assert.equal(publicPujaEligible(puja, [{ type: "name", recordId: 2, recordName: "Duplicate", value: "lakshmi puja", blocking: true }]), false);
});

test("citation validation rejects stored-script and non-HTTPS URLs across write schemas", () => {
  const unsafeUrls = [
    "javascript:alert(1)",
    "data:text/html,<script>alert(1)</script>",
    "http://example.com/source",
  ];
  for (const url of unsafeUrls) {
    const citation = { label: "Unsafe source", url, sourceType: "other" as const };
    assert.equal(citationSchema.safeParse(citation).success, false);
    assert.equal(pujaCreateSchema.safeParse({
      ...completePuja(),
      citations: [citation],
    }).success, false);
    assert.equal(pujaPatchSchema.safeParse({ citations: [citation] }).success, false);
  }
  assert.equal(citationSchema.safeParse({
    label: "Safe source",
    url: "https://example.com/source",
    sourceType: "other",
  }).success, true);
});