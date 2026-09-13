import assert from "node:assert/strict";
import fs from "node:fs";
import type { AddressInfo } from "node:net";
import test from "node:test";
import express from "express";
import { REGISTERED_SPA_ROUTE_PATTERNS } from "@shared/spa-route-patterns";
import {
  isRegisteredSpaPath,
  publicRouteIntegrityMiddleware,
  resolvePublicRouteDecision,
} from "./seo-route-integrity";
import { seoHeadMiddleware, stripNotFoundHeadConflicts } from "./seo-ssr";
import { storage } from "./storage";
import {
  getPanditSeoNetworkProjection,
  invalidatePanditSeoNetworkCache,
} from "./pandit-seo-network/cache";
import { getPanditSeoNetworkSitemapPages } from "./pandit-seo-network/public-api";
import { getHierarchicalLocation } from "./pandit-seo-network/state-city-seo";

const baseDependencies = {
  getProductBySlug: async (_slug: string) => undefined,
  getProductById: async (_id: number) => undefined,
  getPublishedPanditBySlug: async (_slug: string) => null,
  getBlogPostBySlug: async (_slug: string) => undefined,
  getPanditNetworkEnabled: async () => true,
  getPanditNetwork: async () => ({
    profiles: [],
    cities: [{
      entityId: "city:10",
      canonicalUrl: "/book-pandit-online/varanasi",
      city: { id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" },
      state: { id: 1, name: "Uttar Pradesh", code: "UP" },
      providers: [],
      indexability: { status: "noindex_insufficient_supply" as const, indexable: false, reasons: ["insufficient_supply"] },
      services: [],
    }],
  }),
};

test("server route manifest stays synchronized with App route declarations", () => {
  const source = fs.readFileSync(new URL("../client/src/App.tsx", import.meta.url), "utf8");
  const clientPatterns = Array.from(source.matchAll(/<Route\s+path="([^"]+)"/g), (match) => match[1]);
  assert.deepEqual(
    Array.from(new Set(REGISTERED_SPA_ROUTE_PATTERNS)).sort(),
    Array.from(new Set(clientPatterns)).sort(),
  );
  assert.equal(clientPatterns.includes("/puja/:type/:city"), false);
});

test("production pages sitemap is wired to the rollout-gated Pandit network source", () => {
  const source = fs.readFileSync(new URL("./routes.ts", import.meta.url), "utf8");
  assert.match(
    source,
    /import\s*\{[\s\S]*?\bgetPanditSeoNetworkSitemapPages\b[\s\S]*?\}\s*from\s*["']\.\/pandit-seo-network\/public-api["']/,
  );
  assert.match(source, /const networkPages = await getPanditSeoNetworkSitemapPages\(\)/);
  assert.doesNotMatch(source, /const sections = \[[^\]]*["']puja-cities["']/);
  assert.match(
    source,
    /app\.get\(["']\/sitemap-puja-cities\.xml["'][\s\S]*?await getPanditSeoNetworkSitemapPages\(\)/,
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

  const incomplete = await resolvePublicRouteDecision("/pandit/incomplete-pandit", {
    ...baseDependencies,
    getPublishedPanditBySlug: async () => ({
      indexability: { status: "noindex_incomplete_profile", indexable: false },
    }),
  });
  assert.deepEqual(incomplete, { kind: "entity", family: "pandit", found: true });
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

test("canonical city routes distinguish useful noindex pages from missing entities", async () => {
  assert.deepEqual(
    await resolvePublicRouteDecision("/book-pandit-online/varanasi", baseDependencies),
    { kind: "pandit-network", found: true, indexable: false },
  );
  assert.deepEqual(
    await resolvePublicRouteDecision("/book-pandit-online/missing", baseDependencies),
    { kind: "pandit-network", found: false, indexable: false },
  );
  assert.deepEqual(
    await resolvePublicRouteDecision("/book-pandit-online/uttar-pradesh/varanasi", baseDependencies),
    { kind: "pandit-network", found: true, indexable: false },
  );
});

test("every approved metro card href resolves through the public resolver and location query", async () => {
  const metros = [
    ["new-delhi", "new-delhi"], ["noida", "noida"], ["gurugram", "gurugram"],
    ["chandigarh", "chandigarh"], ["mumbai", "mumbai"], ["bengaluru", "bengaluru"],
    ["kolkata", "kolkata"], ["pune", "pune"], ["guwahati", "guwahati"],
    ["chennai", "chennai"], ["hyderabad", "hyderabad"], ["ahmedabad", "ahmedabad"],
  ] as const;
  const cities = metros.map(([stateSlug, citySlug], index) => ({
    entityId: `city:${index + 1}`,
    canonicalUrl: `/book-pandit-online/${stateSlug}/${citySlug}`,
    city: { id: index + 1, stateId: index + 1, name: citySlug.replace(/-/g, " "), slug: `in-${citySlug}` },
    state: { id: index + 1, name: stateSlug.replace(/-/g, " "), code: `S${index + 1}` },
    providers: [],
    services: [],
    indexability: { status: "noindex_insufficient_supply" as const, indexable: false, reasons: ["insufficient_supply"] },
  }));
  const dependencies = {
    ...baseDependencies,
    getPanditNetwork: async () => ({ profiles: [], cities }),
  };
  for (const [index, [stateSlug, citySlug]] of metros.entries()) {
    const href = `/book-pandit-online/${stateSlug}/${citySlug}`;
    const decision = await resolvePublicRouteDecision(href, dependencies);
    assert.deepEqual(decision, { kind: "pandit-network", found: true, indexable: false }, href);
    const location = getHierarchicalLocation(await dependencies.getPanditNetwork(), stateSlug, citySlug);
    assert.equal(location?.kind, "city", href);
    assert.equal(location?.city?.city.id, index + 1);
  }
});

test("disabled canonical city hard navigation stays useful for known locations and rejects unknowns", async () => {
  const app = express();
  app.use(publicRouteIntegrityMiddleware({
    ...baseDependencies,
    getPanditNetworkEnabled: async () => false,
    getKnownPanditLocation: async (stateSlug, citySlug) =>
      stateSlug === "uttar-pradesh" && citySlug === "varanasi",
  }));
  app.use(seoHeadMiddleware());
  app.use((_req, res) => res.type("html").send("<html><head><title>Vedic Tatva</title></head><body></body></html>"));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of [
      "/book-pandit-online/uttar-pradesh/varanasi",
      "/book-pandit-online/uttar-pradesh/unknown-city",
    ]) {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: "text/html" } });
      if (path.endsWith("unknown-city")) {
        assert.equal(response.status, 404);
        assert.equal(response.headers.get("x-robots-tag"), "noindex, nofollow");
        assert.match(await response.text(), /<meta name="robots" content="noindex, nofollow"/);
      } else {
        assert.equal(response.status, 200);
        assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
        assert.match(await response.text(), /<meta name="robots" content="noindex, follow"/);
      }
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("public route integrity never poisons late API responses with an SEO 404", async () => {
  const app = express();
  app.use(publicRouteIntegrityMiddleware(baseDependencies));
  app.get("/api/late-report", (_req, res) => res.json({ ok: true }));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    const response = await fetch(`${baseUrl}/api/late-report`, {
      headers: { accept: "*/*" },
    });
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("x-robots-tag"), null);
    assert.deepEqual(await response.json(), { ok: true });
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
});

test("disabled rollout rejects canonical and legacy city routes before projection lookup", async () => {
  let projectionRead = false;
  const dependencies = {
    ...baseDependencies,
    getPanditNetworkEnabled: async () => false,
    getPanditNetwork: async () => {
      projectionRead = true;
      return baseDependencies.getPanditNetwork();
    },
  };
  assert.deepEqual(
    await resolvePublicRouteDecision("/book-pandit-online/varanasi/rudrabhishek", dependencies),
    { kind: "pandit-network", found: false, indexable: false, disabled: true },
  );
  assert.deepEqual(
    await resolvePublicRouteDecision("/pandits/varanasi/rudrabhishek", dependencies),
    { kind: "pandit-network", found: false, indexable: false, disabled: true },
  );
  assert.equal(projectionRead, false);
});

test("enabled canonical city and service hard navigations retain noindex-follow SSR metadata", async () => {
  const originalSettings = storage.getSiteSettings;
  (storage as any).getSiteSettings = async () => ({ panditSeoNetworkEnabled: true });
  invalidatePanditSeoNetworkCache();
  await getPanditSeoNetworkProjection({
    dependencies: {
      getPandits: async () => [{
        id: 1, name: "Pandit One", slug: "pandit-one", cityId: 10, stateId: 1,
        image: "/images/pandit-one.webp",
        bio: "A reviewed public biography with enough meaningful information for visitors to understand this Pandit's professional background and services.",
        languages: "Hindi", verified: true, onLeave: false, locationReviewStatus: "resolved",
        directoryVisible: true, searchEligible: true, bookingEnabled: true,
      }],
      getStates: async () => [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
      getCities: async () => [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
      getStorefront: async () => ({ isPublished: true, status: "published", bio: "A reviewed public biography with enough meaningful information for visitors to understand this Pandit's professional background and services." }),
      getServices: async () => [{
        service: { id: 10, masterServiceId: 100, isActive: true, mode: "online" },
        master: { id: 100, name: "Rudrabhishek Puja", slug: "rudrabhishek-puja", isActive: true, supportedModes: ["online"] },
      }],
    },
  });
  const app = express();
  app.use(publicRouteIntegrityMiddleware());
  app.use(seoHeadMiddleware());
  app.use((_req, res) => res.type("html").send("<html><head><title>Vedic Tatva</title></head><body></body></html>"));
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of ["/book-pandit-online/uttar-pradesh/varanasi"]) {
      const response = await fetch(`${baseUrl}${path}`, { headers: { accept: "text/html" } });
      const html = await response.text();
      assert.equal(response.status, 200);
      assert.equal(response.headers.get("x-robots-tag"), "noindex, follow");
      assert.match(html, new RegExp(`<meta name="robots" content="noindex, follow"`));
      assert.match(html, new RegExp(`<link rel="canonical" href="${baseUrl}${path}"`));
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    (storage as any).getSiteSettings = originalSettings;
    invalidatePanditSeoNetworkCache();
  }
});

test("HTTP sitemap emission follows the persisted Pandit SEO rollout setting", async () => {
  const originalSettings = storage.getSiteSettings;
  const originalEditorial = storage.getPanditSeoEditorial;
  let enabled = false;
  (storage as any).getSiteSettings = async () => ({ panditSeoNetworkEnabled: enabled });
  (storage as any).getPanditSeoEditorial = async (type: string, key: string) => ({
    entityType: type,
    entityKey: key,
    introduction: `Reviewed facts for ${type}:${key}.`,
    faqs: [],
    status: "published",
  });
  invalidatePanditSeoNetworkCache();
  const bio = "A reviewed public biography with enough meaningful information for visitors to understand this Pandit's professional background and services.";
  await getPanditSeoNetworkProjection({
    dependencies: {
      getPandits: async () => [1, 2, 3].map((id) => ({
        id, name: `Pandit ${id}`, slug: `pandit-${id}`, cityId: 10, stateId: 1, bio,
        image: `/images/pandit-${id}.webp`,
        languages: "Hindi", verified: true, onLeave: false, locationReviewStatus: "resolved",
        directoryVisible: true, searchEligible: true, bookingEnabled: true,
      })),
      getStates: async () => [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
      getCities: async () => [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
      getStorefront: async () => ({ isPublished: true, status: "published", bio }),
      getServices: async (id) => [{
        service: { id: id * 10, masterServiceId: 100, isActive: true, mode: "online" },
        master: { id: 100, name: "Rudrabhishek Puja", slug: "rudrabhishek-puja", isActive: true, supportedModes: ["online"] },
      }],
    },
  });
  const app = express();
  app.get(["/sitemap-pages.xml", "/sitemap-puja-cities.xml"], async (_req, res, next) => {
    try {
      const pages = await getPanditSeoNetworkSitemapPages();
      res.type("application/xml").send(pages.map((page) => `<loc>${page.loc}</loc>`).join(""));
    } catch (error) {
      next(error);
    }
  });
  const server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const baseUrl = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  try {
    for (const path of ["/sitemap-pages.xml", "/sitemap-puja-cities.xml"]) {
      const body = await (await fetch(`${baseUrl}${path}`)).text();
      assert.doesNotMatch(body, /\/(?:hi\/)?puja\/[^<]+/);
      assert.doesNotMatch(body, /book-pandit-online\/(?:varanasi|uttar-pradesh\/varanasi)/);
    }
    enabled = true;
    for (const path of ["/sitemap-pages.xml", "/sitemap-puja-cities.xml"]) {
      const body = await (await fetch(`${baseUrl}${path}`)).text();
      assert.doesNotMatch(body, /\/(?:hi\/)?puja\/[^<]+/);
      assert.match(body, /book-pandit-online\/uttar-pradesh\/varanasi/);
      assert.doesNotMatch(body, /book-pandit-online\/varanasi(?:\/|<)/);
      assert.doesNotMatch(body, /rudrabhishek-puja/);
    }
  } finally {
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    (storage as any).getSiteSettings = originalSettings;
    (storage as any).getPanditSeoEditorial = originalEditorial;
    invalidatePanditSeoNetworkCache();
  }
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

test("all-Pandits directory is a useful noindex route, not a state lookup", async () => {
  assert.deepEqual(
    await resolvePublicRouteDecision("/book-pandit-online/all", baseDependencies),
    { kind: "pandit-network", found: true, indexable: false },
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