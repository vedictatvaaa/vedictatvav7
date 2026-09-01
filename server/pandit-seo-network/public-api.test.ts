import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";
import {
  getPanditSeoNetworkProjection,
  invalidatePanditSeoNetworkCache,
} from "./cache";
import {
  selectCityHub,
  selectCityService,
  selectPublicProfile,
  selectPublicProfileByPanditId,
  resolvePublicPanditProfile,
  filterBySelectablePublicPandits,
  shouldInvalidatePanditSeoNetwork,
} from "./public-api";
import type { PanditSeoNetworkDependencies } from "./resolver";

const pandit = {
  id: 1,
  name: "Pandit One",
  slug: "pandit-one",
  image: "/pandit.webp",
  city: "Varanasi",
  state: "Uttar Pradesh",
  cityId: 10,
  stateId: 1,
  bio: "A reviewed public biography with sufficient professional information for visitors and families.",
  languages: "Hindi, Sanskrit",
  specialization: "Rudrabhishek",
  experience: 15,
  fees: 2100,
  rating: 5,
  reviewCount: 1,
  verified: true,
  onLeave: false,
  locationReviewStatus: "resolved",
};

function dependencies(calls: { count: number }): PanditSeoNetworkDependencies {
  return {
    getPandits: async () => {
      calls.count += 1;
      return [pandit];
    },
    getStates: async () => [{ id: 1, name: "Uttar Pradesh", code: "UP", isActive: true }],
    getCities: async () => [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi", isActive: true }],
    getStorefront: async () => ({ isPublished: true, status: "published", bio: pandit.bio }),
    getServices: async () => [{
      service: {
        id: 20,
        masterServiceId: 100,
        isActive: true,
        mode: "hybrid",
        price: 2100,
        durationMinutes: 90,
      },
      master: {
        id: 100,
        name: "Rudrabhishek Puja",
        slug: "rudrabhishek-puja",
        isActive: true,
        supportedModes: ["hybrid"],
      },
    }],
  };
}

test("public selectors expose known published entities and preserve noindex decisions", async () => {
  invalidatePanditSeoNetworkCache();
  const projection = await getPanditSeoNetworkProjection({
    now: 1,
    dependencies: dependencies({ count: 0 }),
  });
  assert.equal(selectPublicProfile(projection, "pandit-one")?.pandit?.name, "Pandit One");
  assert.equal(selectPublicProfileByPanditId(projection, 1)?.pandit?.slug, "pandit-one");
  assert.equal(selectPublicProfileByPanditId(projection, 999), null);
  assert.equal(selectPublicProfile(projection, "missing"), null);
  assert.equal(selectCityHub(projection, "varanasi")?.indexability.status, "noindex_insufficient_supply");
  assert.equal(selectCityService(projection, "varanasi", "rudrabhishek-puja")?.indexability.status, "noindex_insufficient_supply");
});

test("opaque not_found projections cannot be selected by slug or numeric identity", () => {
  const projection = {
    profiles: [{
      entityId: null,
      canonicalUrl: null,
      pandit: null,
      cityId: null,
      stateId: null,
      services: [],
      indexability: {
        status: "not_found",
        indexable: false,
        reasons: ["storefront_not_published"],
      },
    }],
    cities: [],
  } as any;
  assert.equal(selectPublicProfile(projection, "private-pandit"), null);
  assert.equal(selectPublicProfileByPanditId(projection, 42), null);
});

test("review collection excludes legacy-eligible Pandits that are projection not_found", () => {
  const projection = {
    profiles: [
      {
        entityId: "pandit:1",
        canonicalUrl: "/pandit/public-pandit",
        pandit: { id: 1, slug: "public-pandit" },
        cityId: 10,
        stateId: 1,
        services: [],
        indexability: { status: "noindex_incomplete_profile", indexable: false, reasons: [] },
      },
      {
        // Pandit 2 may still pass the legacy eligibility policy, but the
        // projection intentionally erases its identity when not public.
        entityId: null,
        canonicalUrl: null,
        pandit: null,
        cityId: null,
        stateId: null,
        services: [],
        indexability: { status: "not_found", indexable: false, reasons: ["storefront_not_published"] },
      },
    ],
    cities: [],
  } as any;
  const reviews = [
    { id: 10, panditId: 1, comment: "Public review" },
    { id: 11, panditId: 2, comment: "Must remain opaque" },
  ];
  assert.deepEqual(filterBySelectablePublicPandits(reviews, projection), [reviews[0]]);
});

test("shared public profile resolver is opaque, skips projection while disabled, and forwards failures", async () => {
  const opaqueProjection = {
    profiles: [{
      entityId: null, canonicalUrl: null, pandit: null, cityId: null, stateId: null, services: [],
      indexability: { status: "not_found", indexable: false, reasons: ["storefront_not_published"] },
    }],
    cities: [],
  } as any;
  let reads = 0;
  const disabled = await resolvePublicPanditProfile({ slug: "private-pandit" }, {
    getSettings: async () => ({ panditSeoNetworkEnabled: false }),
    getProjection: async () => { reads += 1; return opaqueProjection; },
  });
  assert.deepEqual(disabled, { enabled: false, profile: null });
  assert.equal(reads, 0);

  const enabled = await resolvePublicPanditProfile({ panditId: 42 }, {
    getSettings: async () => ({ panditSeoNetworkEnabled: true }),
    getProjection: async () => opaqueProjection,
  });
  assert.deepEqual(enabled, { enabled: true, profile: null });
  await assert.rejects(
    resolvePublicPanditProfile({ slug: "any" }, {
      getSettings: async () => ({ panditSeoNetworkEnabled: true }),
      getProjection: async () => { throw new Error("projection unavailable"); },
    }),
    /projection unavailable/,
  );
});

test("profile-adjacent public endpoints share the authoritative resolver boundary", () => {
  const storefrontRoutes = fs.readFileSync(new URL("../pandit-storefront.ts", import.meta.url), "utf8");
  for (const path of [
    '/api/storefront/:slug"',
    '/api/og/p/:slug.jpg"',
    '/api/storefront/:slug/qr.png"',
    '/api/storefront/:slug/card.pdf"',
  ]) {
    const start = storefrontRoutes.indexOf(path);
    assert.notEqual(start, -1, `missing ${path}`);
    assert.match(storefrontRoutes.slice(start, start + 900), /resolvePublicPanditProfile/);
  }
  const publicRoutes = fs.readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  for (const path of ['"/api/pandits/:id"', '"/api/pandits/public/:slug"', '"/api/pandits/slug/:slug"', '"/api/pandit-reviews/:panditId"']) {
    const start = publicRoutes.indexOf(path);
    assert.notEqual(start, -1, `missing ${path}`);
    assert.match(publicRoutes.slice(start, start + 1200), /resolvePublicPanditProfile/);
  }
});

test("review creation resolves public projection before any review write or aggregate update", () => {
  const source = fs.readFileSync(new URL("../routes.ts", import.meta.url), "utf8");
  const start = source.indexOf('app.post("/api/pandit-reviews"');
  const end = source.indexOf('app.delete("/api/pandit-reviews/:id"', start);
  assert.notEqual(start, -1);
  assert.notEqual(end, -1);
  const route = source.slice(start, end);
  const boundary = route.indexOf("resolvePublicPanditProfile");
  const create = route.indexOf("storage.createPanditReview");
  const update = route.indexOf("storage.updatePandit");
  assert.ok(boundary >= 0, "POST review route must resolve the public projection");
  assert.ok(create > boundary, "projection boundary must run before creating a review");
  assert.ok(update > boundary, "projection boundary must run before updating aggregates");
  assert.match(route, /if \(resolution\.enabled\)[\s\S]*if \(!resolution\.profile\?\.pandit\)[\s\S]*status\(404\)/);
});

test("cache deduplicates reads, invalidates explicitly, and never caches failures", async () => {
  invalidatePanditSeoNetworkCache();
  const calls = { count: 0 };
  const deps = dependencies(calls);
  const [first, second] = await Promise.all([
    getPanditSeoNetworkProjection({ now: 10, dependencies: deps }),
    getPanditSeoNetworkProjection({ now: 10, dependencies: deps }),
  ]);
  assert.equal(first, second);
  assert.equal(calls.count, 1);

  await getPanditSeoNetworkProjection({ now: 20, dependencies: deps });
  assert.equal(calls.count, 1);
  invalidatePanditSeoNetworkCache();
  await getPanditSeoNetworkProjection({ now: 30, dependencies: deps });
  assert.equal(calls.count, 2);

  invalidatePanditSeoNetworkCache();
  const failing = {
    ...deps,
    getPandits: async () => {
      calls.count += 1;
      throw new Error("database unavailable");
    },
  };
  await assert.rejects(
    getPanditSeoNetworkProjection({ now: 40, dependencies: failing }),
    /database unavailable/,
  );
  await assert.rejects(
    getPanditSeoNetworkProjection({ now: 41, dependencies: failing }),
    /database unavailable/,
  );
  assert.equal(calls.count, 4);
});

test("an invalidated in-flight read cannot repopulate the next cache generation", async () => {
  invalidatePanditSeoNetworkCache();
  let releaseOldRead!: () => void;
  const oldReadBlocked = new Promise<void>((resolve) => {
    releaseOldRead = resolve;
  });
  const oldCalls = { count: 0 };
  const oldDependencies = dependencies(oldCalls);
  const oldRead = getPanditSeoNetworkProjection({
    now: 100,
    dependencies: {
      ...oldDependencies,
      getPandits: async () => {
        oldCalls.count += 1;
        await oldReadBlocked;
        return [pandit];
      },
    },
  });

  invalidatePanditSeoNetworkCache();
  const freshCalls = { count: 0 };
  const fresh = await getPanditSeoNetworkProjection({
    now: 101,
    dependencies: dependencies(freshCalls),
  });
  releaseOldRead();
  await oldRead;

  const cachedFresh = await getPanditSeoNetworkProjection({
    now: 102,
    dependencies: dependencies({ count: 0 }),
  });
  assert.equal(cachedFresh, fresh);
  assert.equal(freshCalls.count, 1);
});

test("successful relevant mutations are the only requests eligible for cache invalidation", () => {
  [
    ["PATCH", "/api/pandit/storefront"],
    ["POST", "/api/pandit/services"],
    ["DELETE", "/api/pandit/services/7"],
    ["PATCH", "/api/pandits/12"],
    ["POST", "/api/pandit-reviews"],
    ["PATCH", "/api/admin/master-services/4"],
    ["PATCH", "/api/admin/locations/cities/8"],
    ["PATCH", "/api/admin/pandit-storefronts/2/status"],
  ].forEach(([method, requestPath]) => {
    assert.equal(shouldInvalidatePanditSeoNetwork(method, requestPath), true);
  });
  assert.equal(shouldInvalidatePanditSeoNetwork("GET", "/api/pandit/services"), false);
  assert.equal(shouldInvalidatePanditSeoNetwork("PATCH", "/api/products/1"), false);
});