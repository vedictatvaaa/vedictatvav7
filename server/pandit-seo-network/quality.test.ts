import assert from "node:assert/strict";
import test from "node:test";
import {
  PANDIT_CITY_INDEX_MIN_PROVIDERS,
  PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS,
  evaluatePanditProfileIndexability,
  evaluateSupplyIndexability,
} from "./quality";
import {
  buildPanditSeoNetworkProjection,
  type PanditNetworkCandidate,
} from "./project";
import { resolvePanditSeoNetworkProjection } from "./resolver";

const completeBio = "A reviewed public biography with enough meaningful information for visitors to understand this Pandit's professional background and services.";

function candidate(
  id: number,
  overrides: Partial<PanditNetworkCandidate> = {},
): PanditNetworkCandidate {
  return {
    pandit: {
      id,
      name: `Pandit ${id}`,
      slug: `pandit-${id}`,
      image: `/images/pandit-${id}.webp`,
      cityId: 10,
      stateId: 1,
      bio: completeBio,
      languages: "Hindi, Sanskrit",
      verified: true,
      onLeave: false,
      locationReviewStatus: "resolved",
      phone: "private",
      email: "private@example.com",
      passwordHash: "private",
    },
    storefront: { isPublished: true, status: "published", bio: completeBio },
    services: [{
      service: {
        id: id * 10,
        masterServiceId: 100,
        isActive: true,
        mode: "in_person",
        price: 2100,
        durationMinutes: 90,
        description: "Public service description",
      },
      master: {
        id: 100,
        name: "Rudrabhishek Puja",
        slug: "rudrabhishek-puja",
        isActive: true,
        supportedModes: ["in_person", "online", "hybrid"],
      },
    }],
    ...overrides,
  };
}

test("profile quality keeps unpublished and ineligible entities authoritative not-found", () => {
  assert.equal(evaluatePanditProfileIndexability({
    eligible: false,
    published: true,
    activeCanonicalServiceCount: 1,
    hasBookableMode: true,
  }).status, "not_found");
  assert.equal(evaluatePanditProfileIndexability({
    eligible: true,
    published: false,
    activeCanonicalServiceCount: 1,
    hasBookableMode: true,
  }).status, "not_found");
});

test("profile completeness returns actionable reasons and passes a complete profile", () => {
  const incompleteNetwork = buildPanditSeoNetworkProjection({
    candidates: [candidate(1, {
      pandit: {
        ...candidate(1).pandit,
        image: null,
        bio: null,
        languages: null,
      },
      storefront: { isPublished: true, status: "published", bio: null },
      services: [],
    })],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  });
  const incomplete = incompleteNetwork.profiles[0];
  assert.equal(incomplete.indexability.status, "noindex_incomplete_profile");
  assert.deepEqual(incomplete.indexability.reasons.sort(), [
    "missing_active_canonical_service",
    "missing_bookable_service_mode",
    "missing_languages",
    "missing_profile_image",
    "public_bio_too_short",
  ]);

  const completeNetwork = buildPanditSeoNetworkProjection({
    candidates: [candidate(2)],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  });
  assert.equal(completeNetwork.profiles[0]?.indexability.status, "indexable");
});

test("public profile projection excludes private Pandit fields", () => {
  const profile = buildPanditSeoNetworkProjection({
    candidates: [candidate(1)],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  }).profiles[0]!;
  assert.ok(profile.pandit);
  assert.equal("phone" in profile.pandit, false);
  assert.equal("email" in profile.pandit, false);
  assert.equal("passwordHash" in profile.pandit, false);
});

test("ineligible and unpublished candidates expose no public profile payload", () => {
  const ineligible = candidate(1, {
    pandit: { ...candidate(1).pandit, verified: false },
  });
  const unpublished = candidate(2, {
    storefront: { isPublished: false, status: "draft", bio: "Private draft storefront biography" },
  });
  const projection = buildPanditSeoNetworkProjection({
    candidates: [ineligible, unpublished],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  });

  projection.profiles.forEach((profile) => {
    assert.equal(profile.indexability.status, "not_found");
    assert.equal(profile.entityId, null);
    assert.equal(profile.canonicalUrl, null);
    assert.equal(profile.pandit, null);
    assert.equal(profile.cityId, null);
    assert.equal(profile.stateId, null);
    assert.deepEqual(profile.services, []);
  });
  assert.equal(JSON.stringify(projection).includes("Private draft storefront biography"), false);
});

test("city and city-service thresholds enforce the approved 3/2 boundary", () => {
  assert.equal(evaluateSupplyIndexability(
    PANDIT_CITY_INDEX_MIN_PROVIDERS - 1,
    PANDIT_CITY_INDEX_MIN_PROVIDERS,
  ).indexable, false);
  assert.equal(evaluateSupplyIndexability(
    PANDIT_CITY_INDEX_MIN_PROVIDERS,
    PANDIT_CITY_INDEX_MIN_PROVIDERS,
  ).indexable, true);
  assert.equal(evaluateSupplyIndexability(
    PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS - 1,
    PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS,
  ).indexable, false);
  assert.equal(evaluateSupplyIndexability(
    PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS,
    PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS,
  ).indexable, true);
});

test("network projection scopes providers by canonical city and service identity", () => {
  const projection = buildPanditSeoNetworkProjection({
    candidates: [
      candidate(1),
      candidate(2),
      candidate(3),
      candidate(4, {
        pandit: { ...candidate(4).pandit, cityId: 11 },
      }),
    ],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [
      { id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" },
      { id: 11, stateId: 1, name: "Prayagraj", slug: "prayagraj" },
    ],
  });

  const varanasi = projection.cities.find((city) => city.city.id === 10);
  const prayagraj = projection.cities.find((city) => city.city.id === 11);
  assert.equal(varanasi?.providers.length, 3);
  assert.equal(varanasi?.indexability.status, "indexable");
  assert.equal(varanasi?.services[0]?.providers.length, 3);
  assert.equal(varanasi?.services[0]?.indexability.status, "indexable");
  assert.equal(prayagraj?.providers.length, 1);
  assert.equal(prayagraj?.indexability.status, "noindex_insufficient_supply");
  assert.equal(prayagraj?.services[0]?.indexability.status, "noindex_insufficient_supply");
  assert.equal(varanasi?.canonicalUrl, "/book-pandit-online/varanasi");
  assert.equal(varanasi?.services[0]?.canonicalUrl, "/book-pandit-online/varanasi/rudrabhishek-puja");
});

test("inactive and free-text services never satisfy canonical supply", () => {
  const first = candidate(1);
  const second = candidate(2, {
    services: [{
      service: { id: 20, masterServiceId: 100, isActive: false, mode: "online" },
      master: { id: 100, name: "Rudrabhishek Puja", slug: "rudrabhishek-puja", isActive: true, supportedModes: ["online"] },
    }],
  });
  const projection = buildPanditSeoNetworkProjection({
    candidates: [first, second],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  });

  assert.equal(projection.cities[0]?.providers.length, 1);
  assert.equal(projection.cities[0]?.services[0]?.providers.length, 1);
  assert.equal(projection.cities[0]?.services[0]?.indexability.indexable, false);
});

test("multiple modes from one Pandit count as one exact-service provider", () => {
  const first = candidate(1);
  const projection = buildPanditSeoNetworkProjection({
    candidates: [{
      ...first,
      services: [
        first.services[0],
        {
          service: { ...first.services[0].service, id: 999, mode: "online" },
          master: first.services[0].master,
        },
      ],
    }],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  });
  assert.equal(projection.cities[0]?.services[0]?.providers.length, 1);
  assert.equal(projection.cities[0]?.services[0]?.indexability.indexable, false);
});

test("eligibility is derived from authoritative active canonical locations", () => {
  const inactiveLocation = buildPanditSeoNetworkProjection({
    candidates: [candidate(1)],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi", isActive: false }],
  });
  assert.equal(inactiveLocation.profiles[0]?.indexability.status, "not_found");
  assert.equal(inactiveLocation.cities.length, 0);

  const mismatchedLocation = buildPanditSeoNetworkProjection({
    candidates: [candidate(1)],
    states: [
      { id: 1, name: "Uttar Pradesh", code: "UP" },
      { id: 2, name: "Bihar", code: "BR" },
    ],
    cities: [{ id: 10, stateId: 2, name: "Gaya", slug: "gaya" }],
  });
  assert.equal(mismatchedLocation.profiles[0]?.indexability.status, "not_found");
});

test("hybrid is bookable and unsupported per-service modes never count as supply", () => {
  const hybrid = candidate(1, {
    services: [{
      service: { id: 10, masterServiceId: 100, isActive: true, mode: "hybrid" },
      master: {
        id: 100,
        name: "Rudrabhishek Puja",
        slug: "rudrabhishek-puja",
        isActive: true,
        supportedModes: ["hybrid"],
      },
    }],
  });
  const unsupported = candidate(2, {
    services: [{
      service: { id: 20, masterServiceId: 100, isActive: true, mode: "online" },
      master: {
        id: 100,
        name: "Rudrabhishek Puja",
        slug: "rudrabhishek-puja",
        isActive: true,
        supportedModes: ["in_person"],
      },
    }],
  });
  const projection = buildPanditSeoNetworkProjection({
    candidates: [hybrid, unsupported],
    states: [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
    cities: [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
  });
  assert.equal(projection.profiles[0]?.indexability.status, "indexable");
  assert.equal(projection.profiles[1]?.indexability.status, "noindex_incomplete_profile");
  assert.equal(projection.cities[0]?.services[0]?.providers.length, 1);
});

test("resolver failures propagate instead of becoming empty or noindex projections", async () => {
  await assert.rejects(
    resolvePanditSeoNetworkProjection({
      getPandits: async () => [candidate(1).pandit],
      getStates: async () => [{ id: 1, name: "Uttar Pradesh", code: "UP" }],
      getCities: async () => [{ id: 10, stateId: 1, name: "Varanasi", slug: "varanasi" }],
      getStorefront: async () => { throw new Error("storefront database unavailable"); },
      getServices: async () => candidate(1).services,
    }),
    /storefront database unavailable/,
  );
});