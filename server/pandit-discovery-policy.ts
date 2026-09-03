import { matchesCanonicalCityReach, type CanonicalCitySelection } from "./pandit-location-reach";

export type DiscoveryPandit = {
  id: number;
  verified?: boolean | null;
  onLeave?: boolean | null;
  locationReviewStatus?: string | null;
  stateId?: number | null;
  cityId?: number | null;
  tier?: string | null;
  tierExpiresAt?: Date | string | null;
  specialization?: string | null;
  languages?: string | null;
  regionalOrigin?: string | null;
  [key: string]: unknown;
};

export type DiscoveryState = {
  id: number;
  name: string;
  code: string;
  isActive?: boolean;
};

export type DiscoveryCity = {
  id: number;
  stateId: number;
  name: string;
  slug: string;
  isActive?: boolean;
};

export type DiscoverySummary = {
  states: Array<{
    id: number;
    name: string;
    code: string;
    slug: string;
    count: number;
    stateWideCount: number;
    cityCount: number;
    cities: Array<{ id: number; name: string; slug: string; count: number }>;
  }>;
  facets: {
    services: string[];
    languages: string[];
    traditions: string[];
  };
};

export function effectivePanditTier(
  pandit: Pick<DiscoveryPandit, "tier" | "tierExpiresAt">,
  now = Date.now(),
): string {
  let tier = (pandit.tier || "free").toLowerCase();
  if (tier === "platinum") tier = "guru_elite";
  if (pandit.tierExpiresAt && new Date(pandit.tierExpiresAt).getTime() < now) tier = "free";
  return tier;
}

export function matchesPanditDiscoveryReach(
  pandit: Pick<DiscoveryPandit, "stateId" | "cityId" | "tier" | "tierExpiresAt">,
  selection?: CanonicalCitySelection,
  stateId?: number,
  now = Date.now(),
): boolean {
  const tier = effectivePanditTier(pandit, now);
  if (selection) {
    return matchesCanonicalCityReach(
      tier,
      { stateId: pandit.stateId ?? null, cityId: pandit.cityId ?? null },
      selection,
    );
  }
  if (stateId) return tier === "guru_elite" || (tier === "gold" && pandit.stateId === stateId);
  return true;
}

export function facetValues(value: string | null | undefined): string[] {
  return (value || "").split(",").map((v) => v.trim()).filter(Boolean);
}

function normalizedService(value: string): string {
  return value
    .toLocaleLowerCase("en-IN")
    .replace(/\bnavagraha\b/g, "navgraha")
    .replace(/\bpooja\b/g, "puja")
    .replace(/\b(?:puja|mahapuja)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function matchesPanditService(
  pandit: Pick<DiscoveryPandit, "specialization">,
  service: string,
): boolean {
  const wanted = normalizedService(service);
  return !wanted || facetValues(pandit.specialization).some(
    (value) => {
      const offered = normalizedService(value);
      return offered.includes(wanted) || wanted.includes(offered);
    },
  );
}

export function matchesPanditListingFilters(
  pandit: Pick<DiscoveryPandit, "specialization" | "languages" | "regionalOrigin">,
  filters: { service?: string; language?: string; region?: string },
): boolean {
  const service = normalizedService(filters.service || "");
  const language = (filters.language || "").trim().toLocaleLowerCase("en-IN");
  const region = (filters.region || "").trim().toLocaleLowerCase("en-IN");
  return (!service || facetValues(pandit.specialization).some((value) => {
    const offered = normalizedService(value);
    return offered.includes(service) || service.includes(offered);
  }))
    && (!language || facetValues(pandit.languages).some((value) => value.toLocaleLowerCase("en-IN").includes(language)))
    && (!region || facetValues(pandit.regionalOrigin).some((value) => value.toLocaleLowerCase("en-IN").includes(region)));
}

export async function canViewAllPandits(
  showAll: boolean,
  token: string | undefined,
  validateAdminSession: (token: string) => Promise<number | null>,
): Promise<boolean> {
  if (!showAll) return true;
  return !!token && !!(await validateAdminSession(token));
}

export function publicPanditDto(
  pandit: DiscoveryPandit,
  isOnline: boolean,
  distance?: number,
) {
  // Public discovery must never expose contact, moderation, membership,
  // commercial, provenance, or exact GPS fields.
  const {
    phone, email, passwordHash, lastLoginAt, latitude, longitude, leaveNote, leaveStartedAt,
    accountStatus, suspendedUntil, moderationReason, mustChangePassword,
    verified, onLeave, tier, tierExpiresAt, commissionPct, productCommissionPct, membershipNo,
    legacyRegistrationNo, registrationNo,
    documents, application, applicationId,
    cardIssued, cardIssuedAt, originalCity, originalState, locationReviewStatus, boostType,
    boostStartDate, boostEndDate, boostActive,
    ...safe
  } = pandit;
  return {
    ...safe,
    registrationNo,
    verified: true,
    onLeave: false,
    isOnline,
    ...(distance === undefined ? {} : { distance }),
  };
}

export function adminPanditDto(
  pandit: DiscoveryPandit,
  isOnline: boolean,
  distance?: number,
) {
  const { passwordHash, ...safe } = pandit;
  return { ...safe, isOnline, ...(distance === undefined ? {} : { distance }) };
}

function locationSlug(name: string): string {
  return name.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export function buildPanditDiscoverySummary(
  pandits: DiscoveryPandit[],
  states: DiscoveryState[],
  cities: DiscoveryCity[],
  service = "",
  now = Date.now(),
): DiscoverySummary {
  const visible = service
    ? pandits.filter((pandit) => matchesPanditService(pandit, service))
    : pandits;
  const facets = { services: new Set<string>(), languages: new Set<string>(), traditions: new Set<string>() };

  for (const pandit of pandits) {
    facetValues(pandit.specialization).forEach((value) => facets.services.add(value));
    facetValues(pandit.languages).forEach((value) => facets.languages.add(value));
    facetValues(pandit.regionalOrigin).forEach((value) => facets.traditions.add(value));
  }

  return {
    states: states
      .map((state) => {
        const statePandits = visible.filter((pandit) => pandit.stateId === state.id);
        const stateCities = cities.filter(
          (city) => city.stateId === state.id && statePandits.some((pandit) => pandit.cityId === city.id),
        );
        const stateWideCount = visible.filter((pandit) =>
          matchesPanditDiscoveryReach(pandit, undefined, state.id, now),
        ).length;
        return {
          id: state.id,
          name: state.name,
          code: state.code,
          slug: locationSlug(state.name),
          count: statePandits.length,
          stateWideCount,
          cityCount: stateCities.length,
          cities: stateCities
            .sort((a, b) => a.name.localeCompare(b.name, "en-IN"))
            .map((city) => ({
              id: city.id,
              name: city.name,
              slug: city.slug,
              count: statePandits.filter((pandit) => pandit.cityId === city.id).length,
            })),
        };
      })
      .filter((state) => state.count > 0)
      .sort((a, b) => a.name.localeCompare(b.name, "en-IN")),
    facets: {
      services: Array.from(facets.services).sort(),
      languages: Array.from(facets.languages).sort(),
      traditions: Array.from(facets.traditions).sort(),
    },
  };
}