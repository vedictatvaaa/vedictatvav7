import assert from "node:assert/strict";
import test from "node:test";
import {
  canTransitionEditorialStatus,
  editorialBodySchema,
  actorFor,
  projectPanditSeoCoverage,
  registerPanditSeoNetworkAdminRoutes,
} from "./admin-routes";
import { isPanditSeoNetworkEnabled } from "./public-api";
import { panditSeoEditorialLifecycle } from "../storage";

test("editorial validation permits bounded plain text and rejects HTML/too many FAQs", () => {
  const valid = editorialBodySchema.safeParse({
    introduction: "Useful local guidance.",
    faqs: [{ question: "How does booking work?", answer: "Choose an available Pandit." }],
  });
  assert.equal(valid.success, true);
  assert.equal(editorialBodySchema.safeParse({
    introduction: "<b>unsafe</b>", faqs: [],
  }).success, false);
  assert.equal(editorialBodySchema.safeParse({
    introduction: "", faqs: Array.from({ length: 13 }, () => ({ question: "Q", answer: "A" })),
  }).success, false);
});

test("editorial publication requires review and supports deliberate unpublish", () => {
  assert.equal(canTransitionEditorialStatus("draft", "published"), false);
  assert.equal(canTransitionEditorialStatus("draft", "reviewed"), true);
  assert.equal(canTransitionEditorialStatus("reviewed", "published"), true);
  assert.equal(canTransitionEditorialStatus("published", "reviewed"), true);
  assert.equal(canTransitionEditorialStatus("published", "draft"), false);
});

test("admin governance routes use the canonical API contract", () => {
  const routes: string[] = [];
  const app = {
    get: (path: string) => routes.push(`GET ${path}`),
    put: (path: string) => routes.push(`PUT ${path}`),
    patch: (path: string) => routes.push(`PATCH ${path}`),
  };
  registerPanditSeoNetworkAdminRoutes(app as any, () => undefined);
  assert.deepEqual(routes, [
    "GET /api/admin/pandit-seo-network",
    "GET /api/admin/pandit-seo-editorial",
    "PUT /api/admin/pandit-seo-editorial/:entityType/:entityKey",
    "PATCH /api/admin/pandit-seo-editorial/:entityType/:entityKey/status",
    "PATCH /api/admin/pandit-seo-network/rollout",
  ]);
});

test("audit actors use the authenticated Admin identity and never credentials", () => {
  const token = "super-secret-admin-session-token";
  const actor = actorFor({
    adminUserId: 42,
    headers: { "x-admin-token": token },
  } as any);
  assert.equal(actor, "admin-user:42");
  assert.equal(actor.includes(token), false);
  assert.equal(actor.includes(token.slice(-6)), false);
  assert.throws(() => actorFor({ headers: { "x-admin-token": token } } as any), /identity is required/);
});

test("rollout gate is opt-in", () => {
  assert.equal(isPanditSeoNetworkEnabled(undefined), false);
  assert.equal(isPanditSeoNetworkEnabled({ panditSeoNetworkEnabled: false }), false);
  assert.equal(isPanditSeoNetworkEnabled({ panditSeoNetworkEnabled: true }), true);
});

test("draft and reviewed lifecycle states clear stale approval metadata", () => {
  const at = new Date("2026-09-01T00:00:00Z");
  const reviewedAt = new Date("2026-08-31T00:00:00Z");
  assert.deepEqual(panditSeoEditorialLifecycle("draft", "admin:test", at), {
    reviewedBy: null, reviewedAt: null, publishedBy: null, publishedAt: null,
  });
  assert.deepEqual(panditSeoEditorialLifecycle("reviewed", "admin:test", at), {
    reviewedBy: "admin:test", reviewedAt: at, publishedBy: null, publishedAt: null,
  });
  assert.deepEqual(panditSeoEditorialLifecycle("published", "admin:test", at), {
    reviewedBy: "admin:test", reviewedAt: at, publishedBy: "admin:test", publishedAt: at,
  });
  assert.deepEqual(panditSeoEditorialLifecycle("reviewed", "admin:rollback", at, {
    status: "published", reviewedBy: "admin:reviewer", reviewedAt,
  }), {
    reviewedBy: "admin:reviewer", reviewedAt, publishedBy: null, publishedAt: null,
  });
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
  const privateProfile = coverage.profiles[0] as Record<string, unknown>;
  assert.equal(privateProfile.entityKey, null);
  assert.equal(privateProfile.label, "Private profile");
  assert.equal(coverage.cities[0].indexability.reasons.includes("canonical_url_pending"), true);
  assert.equal(coverage.cityServices[0].indexability.reasons.includes("canonical_url_pending"), true);
  assert.equal(coverage.summary.notFound, 1);
  assert.equal(coverage.reasonCounts.canonical_url_pending, 2);
});