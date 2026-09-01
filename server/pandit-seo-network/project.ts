import {
  isPanditStorefrontPublished,
  publicPanditServiceDto,
  publicStorefrontPanditDto,
} from "../pandit-public-access";
import { isPanditPubliclyEligible } from "../pandit-public-eligibility";
import {
  PANDIT_CITY_INDEX_MIN_PROVIDERS,
  PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS,
  evaluatePanditProfileIndexability,
  evaluateSupplyIndexability,
  type IndexabilityDecision,
} from "./quality";

type PanditSource = {
  id: number;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
  cityId?: number | null;
  stateId?: number | null;
  bio?: string | null;
  languages?: string | null;
  verified?: boolean | null;
  onLeave?: boolean | null;
  locationReviewStatus?: string | null;
  [key: string]: unknown;
};

type StorefrontSource = {
  bio?: string | null;
  isPublished?: boolean | null;
  status?: string | null;
};

type ServiceSource = {
  service: {
    id: number;
    masterServiceId: number;
    isActive?: boolean | null;
    mode?: string | null;
    [key: string]: unknown;
  };
  master: {
    id: number;
    name: string;
    slug: string;
    isActive?: boolean | null;
    supportedModes?: string[] | null;
    [key: string]: unknown;
  };
};

export type PanditNetworkCandidate = {
  pandit: PanditSource;
  storefront?: StorefrontSource | null;
  services: ServiceSource[];
};

export type NetworkCity = {
  id: number;
  stateId: number;
  name: string;
  slug: string;
  isActive?: boolean;
};

export type NetworkState = {
  id: number;
  name: string;
  code: string;
  isActive?: boolean;
};

export type PanditProfileProjection = {
  entityId: string | null;
  canonicalUrl: string | null;
  pandit: ReturnType<typeof publicStorefrontPanditDto> | null;
  cityId: number | null;
  stateId: number | null;
  services: Array<ReturnType<typeof publicPanditServiceDto>>;
  indexability: IndexabilityDecision;
};

export type CityServiceProjection = {
  entityId: string;
  canonicalUrl: string | null;
  service: { id: number; name: string; slug: string };
  providers: PanditProfileProjection[];
  indexability: IndexabilityDecision;
};

export type CityHubProjection = {
  entityId: string;
  canonicalUrl: string | null;
  city: NetworkCity;
  state: NetworkState;
  providers: PanditProfileProjection[];
  services: CityServiceProjection[];
  indexability: IndexabilityDecision;
};

export type PanditSeoNetworkProjection = {
  profiles: PanditProfileProjection[];
  cities: CityHubProjection[];
};

const BOOKABLE_MODES = new Set(["online", "in_person", "hybrid"]);

function activeCanonicalServices(candidate: PanditNetworkCandidate) {
  return candidate.services.filter(({ service, master }) =>
    service.isActive !== false
    && master.isActive !== false
    && Boolean(master.slug?.trim()),
    // Kept as a separate predicate below for readability.
  ).filter(({ service, master }) => {
    const mode = String(service.mode || "");
    return BOOKABLE_MODES.has(mode) && (master.supportedModes || []).includes(mode);
  });
}

type ActiveLocationContext = {
  activeStateIds: ReadonlySet<number>;
  activeCityById: ReadonlyMap<number, { id: number; stateId: number }>;
};

function profileFromCandidate(
  candidate: PanditNetworkCandidate,
  locations: ActiveLocationContext,
): PanditProfileProjection {
  const eligible = isPanditPubliclyEligible(
    candidate.pandit,
    locations.activeStateIds,
    locations.activeCityById,
  );
  const activeServices = activeCanonicalServices(candidate);
  const bio = candidate.storefront?.bio || candidate.pandit.bio;
  const indexability = evaluatePanditProfileIndexability({
    eligible,
    published: isPanditStorefrontPublished(candidate.storefront),
    name: candidate.pandit.name,
    slug: candidate.pandit.slug,
    image: candidate.pandit.image,
    cityId: candidate.pandit.cityId,
    stateId: candidate.pandit.stateId,
    bio,
    languages: candidate.pandit.languages,
    activeCanonicalServiceCount: activeServices.length,
    hasBookableMode: activeServices.some(({ service }) => BOOKABLE_MODES.has(String(service.mode || ""))),
  });

  if (indexability.status === "not_found") {
    return {
      entityId: null,
      canonicalUrl: null,
      pandit: null,
      cityId: null,
      stateId: null,
      services: [],
      indexability,
    };
  }

  return {
    entityId: `pandit:${candidate.pandit.id}`,
    canonicalUrl: candidate.pandit.slug
      ? `/pandit/${encodeURIComponent(candidate.pandit.slug)}`
      : null,
    pandit: publicStorefrontPanditDto({
      ...candidate.pandit,
      bio,
    }),
    cityId: candidate.pandit.cityId ?? null,
    stateId: candidate.pandit.stateId ?? null,
    services: activeServices.map(publicPanditServiceDto),
    indexability,
  };
}

export function buildPanditSeoNetworkProjection(input: {
  candidates: PanditNetworkCandidate[];
  cities: NetworkCity[];
  states: NetworkState[];
}): PanditSeoNetworkProjection {
  const activeStates = input.states.filter((state) => state.isActive !== false);
  const activeStateIds = new Set(activeStates.map((state) => state.id));
  const activeCities = input.cities.filter((city) =>
    city.isActive !== false && activeStateIds.has(city.stateId),
  );
  const activeCityById = new Map(activeCities.map((city) => [
    city.id,
    { id: city.id, stateId: city.stateId },
  ]));
  const profiles = input.candidates.map((candidate) => profileFromCandidate(candidate, {
    activeStateIds,
    activeCityById,
  }));
  const indexableProfiles = profiles.filter((profile) => profile.indexability.indexable);
  const stateById = new Map(activeStates.map((state) => [state.id, state]));

  const cities = activeCities.flatMap((city): CityHubProjection[] => {
    const state = stateById.get(city.stateId);
    if (!state) return [];

    const providers = indexableProfiles.filter((profile) =>
      profile.cityId === city.id && profile.stateId === city.stateId,
    );
    const servicesById = new Map<number, {
      service: { id: number; name: string; slug: string };
      providers: PanditProfileProjection[];
    }>();

    providers.forEach((provider) => {
      provider.services.forEach((service) => {
        if (!service.masterServiceId || !service.name || !service.slug) return;
        const existing = servicesById.get(service.masterServiceId) || {
          service: {
            id: service.masterServiceId,
            name: service.name,
            slug: service.slug,
          },
          providers: [] as PanditProfileProjection[],
        };
        existing.providers.push(provider);
        servicesById.set(service.masterServiceId, existing);
      });
    });

    const services = Array.from(servicesById.values())
      .map(({ service, providers: serviceProviders }): CityServiceProjection => ({
        entityId: `city-service:${city.id}:${service.id}`,
        // The current route redirects into query-based discovery and does not
        // yet own projection-backed SSR or canonical booking context.
        canonicalUrl: null,
        service,
        providers: serviceProviders,
        indexability: evaluateSupplyIndexability(
          serviceProviders.length,
          PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS,
        ),
      }))
      .sort((a, b) => a.service.name.localeCompare(b.service.name, "en-IN"));

    return [{
      entityId: `city:${city.id}`,
      canonicalUrl: null,
      city,
      state,
      providers,
      services,
      indexability: evaluateSupplyIndexability(
        providers.length,
        PANDIT_CITY_INDEX_MIN_PROVIDERS,
      ),
    }];
  });

  return {
    profiles,
    cities: cities.sort((a, b) =>
      a.city.name.localeCompare(b.city.name, "en-IN")
      || a.state.name.localeCompare(b.state.name, "en-IN"),
    ),
  };
}