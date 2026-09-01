import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionEditorialStatus,
  editorialBodySchema,
  projectPanditSeoCoverage,
} from "./admin-routes";
import { isPanditSeoNetworkEnabled } from "./public-api";

test("editorial validation permits bounded plain text and rejects HTML/too many FAQs", () => {
  const valid = editorialBodySchema.safeParse({
    entityType: "city", entityKey: "city:1", introduction: "Useful local guidance.",
    faqs: [{ question: "How does booking work?", answer: "Choose an available Pandit." }],
  });
  assert.equal(valid.success, true);
  assert.equal(editorialBodySchema.safeParse({
    entityType: "city", entityKey: "city:1", introduction: "<b>unsafe</b>", faqs: [],
  }).success, false);
  assert.equal(editorialBodySchema.safeParse({
    entityType: "city", entityKey: "city:1", introduction: "", faqs: Array.from({ length: 13 }, () => ({ question: "Q", answer: "A" })),
  }).success, false);
});

test("editorial publication requires review and supports deliberate unpublish", () => {
  assert.equal(canTransitionEditorialStatus("draft", "published"), false);
  assert.equal(canTransitionEditorialStatus("draft", "reviewed"), true);
  assert.equal(canTransitionEditorialStatus("reviewed", "published"), true);
  assert.equal(canTransitionEditorialStatus("published", "reviewed"), true);
  assert.equal(canTransitionEditorialStatus("published", "draft"), false);
});

test("rollout gate is opt-in", () => {
  assert.equal(isPanditSeoNetworkEnabled(undefined), false);
  assert.equal(isPanditSeoNetworkEnabled({ panditSeoNetworkEnabled: false }), false);
  assert.equal(isPanditSeoNetworkEnabled({ panditSeoNetworkEnabled: true }), true);
});

test("coverage keeps not-found profiles opaque and marks pending canonical URLs", () => {
  const decision = (status: string, reasons: string[] = []) => ({ status, indexable: status === "indexable", reasons });
  const coverage = projectPanditSeoCoverage({
    profiles: [
      { entityId: null, canonicalUrl: null, pandit: null, cityId: null, stateId: null, services: [], indexability: decision("not_found", ["storefront_not_published"]) },
    ],
    cities: [{
      entityId: "city:1", canonicalUrl: null, city: { id: 1, stateId: 1, name: "Pune", slug: "pune" },
      state: { id: 1, name: "Maharashtra", code: "MH" }, providers: [],
      indexability: decision("noindex_insufficient_supply", ["insufficient_provider_supply"]),
      services: [{
        entityId: "city-service:1:2", canonicalUrl: null, service: { id: 2, name: "Puja", slug: "puja" },
        providers: [], indexability: decision("noindex_insufficient_supply", ["insufficient_provider_supply"]),
      }],
    }],
  } as any);
  const privateProfile = coverage.rows[0] as Record<string, unknown>;
  assert.equal("entityKey" in privateProfile, false);
  assert.equal((coverage.rows[1] as any).canonicalUrlPending, true);
  assert.equal((coverage.rows[2] as any).canonicalUrlPending, true);
  assert.equal(coverage.counts.byStatus.not_found, 1);
  assert.equal(coverage.counts.byReason.canonical_url_pending, 2);
});