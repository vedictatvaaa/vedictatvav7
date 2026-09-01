import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import { REGISTERED_SPA_ROUTE_PATTERNS } from "@shared/spa-route-patterns";
import {
  isRegisteredSpaPath,
  resolvePublicRouteDecision,
} from "./seo-route-integrity";
import { stripNotFoundHeadConflicts } from "./seo-ssr";

const baseDependencies = {
  getProductBySlug: async (_slug: string) => undefined,
  getProductById: async (_id: number) => undefined,
  getPublishedPanditBySlug: async (_slug: string) => null,
  getBlogPostBySlug: async (_slug: string) => undefined,
};

test("server route manifest stays synchronized with App route declarations", () => {
  const source = fs.readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
  const clientPatterns = Array.from(source.matchAll(/<Route\s+path="([^"]+)"/g), (match) => match[1]);
  assert.deepEqual(
    Array.from(new Set(REGISTERED_SPA_ROUTE_PATTERNS)).sort(),
    Array.from(new Set(clientPatterns)).sort(),
  );
});

test("registered static and dynamic SPA routes are recognized", () => {
  assert.equal(isRegisteredSpaPath("/about"), true);
  assert.equal(isRegisteredSpaPath("/tools/tithi-calculator"), true);
  assert.equal(isRegisteredSpaPath("/track-order/VT-123"), true);
  assert.equal(isRegisteredSpaPath("/definitely-not-a-route"), false);
  assert.equal(isRegisteredSpaPath("/about/unregistered-child"), false);
});

test("product routes resolve by slug and numeric id", async () => {
  const bySlug = await resolvePublicRouteDecision("/product/rudraksha", {
    ...baseDependencies,
    getProductBySlug: async (slug) => slug === "rudraksha" ? { id: 1 } : undefined,
  });
  assert.deepEqual(bySlug, { kind: "entity", family: "product", found: true });

  const byId = await resolvePublicRouteDecision("/product/42", {
    ...baseDependencies,
    getProductById: async (id) => id === 42 ? { id } : undefined,
  });
  assert.deepEqual(byId, { kind: "entity", family: "product", found: true });
});

test("Pandit storefronts require the authoritative published resolver", async () => {
  const missing = await resolvePublicRouteDecision("/pandit/private-pandit", baseDependencies);
  assert.deepEqual(missing, { kind: "entity", family: "pandit", found: false });

  const published = await resolvePublicRouteDecision("/pandit/public-pandit", {
    ...baseDependencies,
    getPublishedPanditBySlug: async () => ({ id: 7 }),
  });
  assert.deepEqual(published, { kind: "entity", family: "pandit", found: true });
});

test("blog routes reject drafts and accept published posts", async () => {
  const draft = await resolvePublicRouteDecision("/blog/draft-post", {
    ...baseDependencies,
    getBlogPostBySlug: async () => ({ isPublished: false }),
  });
  assert.deepEqual(draft, { kind: "entity", family: "blog", found: false });

  const published = await resolvePublicRouteDecision("/blog/published-post", {
    ...baseDependencies,
    getBlogPostBySlug: async () => ({ isPublished: true }),
  });
  assert.deepEqual(published, { kind: "entity", family: "blog", found: true });
});

test("resolver failures stay errors instead of becoming false 404 decisions", async () => {
  await assert.rejects(
    resolvePublicRouteDecision("/product/storage-failure", {
      ...baseDependencies,
      getProductBySlug: async () => { throw new Error("database unavailable"); },
    }),
    /database unavailable/,
  );
});

test("404 HTML strips crawler-specific index directives and structured data", () => {
  const html = `<head>
    <meta name="googlebot" content="index, follow">
    <meta name="bingbot" content="index, follow">
    <script type="application/ld+json">{"@type":"Product"}</script>
  </head>`;
  const clean = stripNotFoundHeadConflicts(html);
  assert.doesNotMatch(clean, /googlebot|bingbot|application\/ld\+json|Product/i);
});
