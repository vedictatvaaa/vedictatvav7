export const PANDIT_PROFILE_MIN_BIO_CHARACTERS = 80;
export const PANDIT_CITY_INDEX_MIN_PROVIDERS = 3;
export const PANDIT_CITY_SERVICE_INDEX_MIN_PROVIDERS = 2;

export type IndexabilityStatus =
  | "indexable"
  | "noindex_incomplete_profile"
  | "noindex_insufficient_supply"
  | "not_found";

export type IndexabilityDecision = {
  status: IndexabilityStatus;
  indexable: boolean;
  reasons: string[];
};

export type ProfileQualityInput = {
  eligible: boolean;
  published: boolean;
  name?: string | null;
  slug?: string | null;
  image?: string | null;
  cityId?: number | null;
  stateId?: number | null;
  bio?: string | null;
  languages?: string | null;
  activeCanonicalServiceCount: number;
  hasBookableMode: boolean;
};

function hasText(value: string | null | undefined) {
  return Boolean(value?.trim());
}

export function evaluatePanditProfileIndexability(
  input: ProfileQualityInput,
): IndexabilityDecision {
  if (!input.eligible || !input.published) {
    return {
      status: "not_found",
      indexable: false,
      reasons: [!input.eligible ? "pandit_not_publicly_eligible" : "storefront_not_published"],
    };
  }

  const reasons = [
    !hasText(input.name) ? "missing_public_name" : null,
    !hasText(input.slug) ? "missing_canonical_slug" : null,
    !hasText(input.image) ? "missing_profile_image" : null,
    input.cityId == null || input.stateId == null ? "missing_canonical_location" : null,
    (input.bio?.trim().length || 0) < PANDIT_PROFILE_MIN_BIO_CHARACTERS
      ? "public_bio_too_short"
      : null,
    !hasText(input.languages) ? "missing_languages" : null,
    input.activeCanonicalServiceCount < 1 ? "missing_active_canonical_service" : null,
    !input.hasBookableMode ? "missing_bookable_service_mode" : null,
  ].filter((reason): reason is string => Boolean(reason));

  return reasons.length
    ? { status: "noindex_incomplete_profile", indexable: false, reasons }
    : { status: "indexable", indexable: true, reasons: [] };
}

export function evaluateSupplyIndexability(
  providerCount: number,
  minimumProviders: number,
): IndexabilityDecision {
  return providerCount >= minimumProviders
    ? { status: "indexable", indexable: true, reasons: [] }
    : {
        status: "noindex_insufficient_supply",
        indexable: false,
        reasons: [`requires_${minimumProviders}_qualifying_providers`, `has_${providerCount}_qualifying_providers`],
      };
}