import assert from "node:assert/strict";
import test from "node:test";
import {
  getPanditSeoNetworkProjection,
  invalidatePanditSeoNetworkCache,
} from "./cache";
import {
  selectCityHub,
  selectCityService,
  selectPublicProfile,
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
  assert.equal(selectPublicProfile(projection, "missing"), null);
  assert.equal(selectCityHub(projection, "varanasi")?.indexability.status, "noindex_insufficient_supply");
  assert.equal(selectCityService(projection, "varanasi", "rudrabhishek-puja")?.indexability.status, "noindex_insufficient_supply");
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