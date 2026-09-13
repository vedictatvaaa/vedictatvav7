import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import {
  canTransitionPanditContent,
  hashPublicFacts,
  authoritativePanditLastmod,
  registerPanditStorefrontContentRoutes,
  validatePanditContentDraft,
} from "./pandit-storefront-content";

test("content lifecycle requires Admin review before publication", () => {
  assert.equal(canTransitionPanditContent("draft", "published"), false);
  assert.equal(canTransitionPanditContent("draft", "reviewed"), true);
  assert.equal(canTransitionPanditContent("reviewed", "published"), true);
  assert.equal(canTransitionPanditContent("published", "draft"), false);
  assert.equal(canTransitionPanditContent("published", "reviewed"), true);
});

test("public source snapshot hashing is deterministic and order independent", () => {
  const a = {
    panditId: 7,
    canonicalUrl: "/pandit/example",
    profile: { name: "Example", languages: "Hindi" },
    location: { city: "Gaya", state: "Bihar" },
    services: [{ name: "Puja", price: 500 }],
    catalogue: [],
    reviewAggregate: { rating: 4.8, reviewCount: 3 },
  };
  const b = {
    ...a,
    profile: { languages: "Hindi", name: "Example" },
  };
  assert.equal(hashPublicFacts(a), hashPublicFacts(b));
});

test("draft validation rejects unsupported outcomes and private contact values", () => {
  const valid = {
    profileIntroduction: "A Pandit offering the listed puja service in Gaya.",
    tagline: "Puja services in Gaya",
    serviceOverview: "The listed puja service is available in the published catalogue.",
    seoTitle: "Puja services in Gaya",
    metaDescription: "Review the published services and request a booking.",
    faqs: [{ question: "Where is this service offered?", answer: "The profile lists Gaya." }],
    aiSummary: "A public profile with a listed puja service.",
  };
  assert.deepEqual(validatePanditContentDraft(valid), valid);
  assert.throws(() => validatePanditContentDraft({ ...valid, tagline: "Guaranteed results" }));
  assert.throws(() => validatePanditContentDraft({ ...valid, tagline: "Call +91 9876543210" }));
});

test("draft validation rejects invented factual entities", () => {
  const facts = {
    panditId: 7, canonicalUrl: "/pandit/example",
    profile: { name: "Example", languages: "Hindi", experience: 8, verified: true },
    location: { city: "Gaya", state: "Bihar" },
    services: [{ name: "Puja", slug: "puja", category: "Puja", serviceType: "puja", price: 500, durationMinutes: 60 }],
    catalogue: [], reviewAggregate: { rating: 4.8, reviewCount: 3 },
  };
  const base = {
    profileIntroduction: "Example offers Puja services in Gaya.",
    tagline: "Puja services in Gaya",
    serviceOverview: "The listed Puja service costs 500.",
    seoTitle: "Puja services in Gaya",
    metaDescription: "A public profile for Puja services in Gaya.",
    faqs: [{ question: "What is offered?", answer: "Puja is listed." }],
    aiSummary: "A public Puja profile in Gaya.",
  };
  assert.deepEqual(validatePanditContentDraft(base, facts), base);
  assert.throws(() => validatePanditContentDraft({ ...base, profileIntroduction: "Example has 20 years of experience." }, facts));
  assert.throws(() => validatePanditContentDraft({ ...base, serviceOverview: "Offers astrology services." }, facts));
  assert.throws(() => validatePanditContentDraft({ ...base, serviceOverview: "The service costs 999." }, facts));
  assert.throws(() => validatePanditContentDraft({ ...base, profileIntroduction: "Example offers Puja services in Delhi." }, facts));
  assert.throws(() => validatePanditContentDraft({ ...base, profileIntroduction: "Example speaks English." }, facts));
  assert.throws(() => validatePanditContentDraft({ ...base, profileIntroduction: "Rated 5 stars for this service." }, { ...facts, reviewAggregate: { rating: null, reviewCount: 0 } }));
  assert.throws(() => validatePanditContentDraft({ ...base, profileIntroduction: "A qualified Vedic scholar." }, facts));
  assert.throws(() => validatePanditContentDraft({ ...base, profileIntroduction: "Pandit Ramesh offers Puja." }, facts));
  assert.throws(() => validatePanditContentDraft({
    ...base,
    profileIntroduction: "Verified Harvard-trained expert offers lunar Puja in Gaya.",
  }, facts));
});

test("content migration is additive and has stale/audit lifecycle columns", () => {
  const migration = readFileSync("migrations/0032_pandit_storefront_content.sql", "utf8");
  assert.match(migration, /CREATE TABLE IF NOT EXISTS/);
  assert.match(migration, /source_snapshot_hash/);
  assert.match(migration, /published_source_snapshot_hash/);
  assert.match(migration, /model_identifier/);
  assert.match(migration, /stale_reason/);
  assert.match(migration, /reviewed_by/);
  assert.match(migration, /published_by/);
  assert.match(migration, /CHECK \("status" IN \('draft', 'reviewed', 'published', 'rejected'\)\)/);
  assert.match(migration, /pandit_storefront_content_generations/);
  assert.match(migration, /generation_key/);
  assert.match(migration, /generationKeyUnique|generations_key_unique/);
});

test("people sitemap lastmod is authoritative and never falls back to today", () => {
  assert.equal(authoritativePanditLastmod({}, {}), null);
  assert.equal(authoritativePanditLastmod(
    { createdAt: "2025-01-01T00:00:00Z" },
    { createdAt: "2025-01-02T00:00:00Z", updatedAt: "2025-02-01T00:00:00Z" },
    { publishedAt: "2025-03-01T00:00:00Z" },
  ), "2025-03-01");
});

test("Admin collection endpoint is registered behind the supplied auth middleware", () => {
  const routes: Array<{ path: string; middleware: unknown; handler: unknown }> = [];
  const app = {
    get(path: string, middleware: unknown, handler: unknown) {
      routes.push({ path, middleware, handler });
    },
    post() {},
    patch() {},
  } as any;
  const adminAuth = () => {};
  registerPanditStorefrontContentRoutes(app, adminAuth);
  const collection = routes.find((route) => route.path === "/api/admin/pandit-storefront-content");
  assert.ok(collection);
  assert.equal(collection.middleware, adminAuth);
  assert.equal(typeof collection.handler, "function");
});
