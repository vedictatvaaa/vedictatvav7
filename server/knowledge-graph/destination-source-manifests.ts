import {
  TEMPLE_TOURISM_SOURCE_ROWS,
  TIRTH_GUIDE_SOURCE_ROWS,
} from "@shared/pilgrimage-source-contract";

export type TempleTourismClassification = "TEMPLE" | "TIRTH" | "LEGACY_ONLY";

/**
 * Reviewed editorial decisions, keyed by the immutable Temple Tourism source
 * id. Do not replace this manifest with name, category, or slug inference.
 */
export const TEMPLE_TOURISM_CLASSIFICATION_MANIFEST: Readonly<Record<string, TempleTourismClassification>> = {
  somnath: "TEMPLE", mallikarjuna: "TEMPLE", mahakaleshwar: "TEMPLE", omkareshwar: "TEMPLE",
  kedarnath: "TEMPLE", bhimashankar: "TEMPLE", kashivishwanath: "TEMPLE", trimbakeshwar: "TEMPLE",
  vaidyanath: "TEMPLE", nageshwar: "TEMPLE", rameshwaram: "TEMPLE", grishneshwar: "TEMPLE",
  vaishno: "TEMPLE", kamakhya: "TEMPLE", kalighat: "TEMPLE", vindhyavasini: "TEMPLE", ambaji: "TEMPLE",
  badrinath: "TEMPLE", gangotri: "TEMPLE", yamunotri: "TEMPLE",
  tirupati: "TEMPLE", jagannath: "TEMPLE", meenakshi: "TEMPLE", shirdi: "TEMPLE", konark: "TEMPLE", sabarimala: "TEMPLE",
  gangaRiver: "TIRTH", yamunaRiver: "TIRTH", narmadaRiver: "TIRTH", godavariRiver: "TIRTH", kaveriRiver: "TIRTH",
  ayodhya: "TIRTH", mathuraVrindavan: "TIRTH", haridwar: "TIRTH", dwarka: "TIRTH", mansarovar: "TIRTH",
  kawadYatra: "LEGACY_ONLY", amarnathYatra: "LEGACY_ONLY", narmadaParikrama: "LEGACY_ONLY",
  goldenTemple: "LEGACY_ONLY", hemkundSahib: "LEGACY_ONLY", govardhanParikrama: "LEGACY_ONLY",
};

/** Only a reviewed, singular destination mapping is represented. */
export const YATRA_TO_TIRTH_MAPPING_MANIFEST = [
  { yatraSourceKey: "delhi-haridwar-yatra", tirthSourceKey: "haridwar" },
] as const;

export const DESTINATION_SOURCE_COUNTS = {
  tirthGuides: TIRTH_GUIDE_SOURCE_ROWS.length,
  templeTourism: TEMPLE_TOURISM_SOURCE_ROWS.length,
  temple: 26,
  tirth: 10,
  legacyOnly: 6,
} as const;

export const LEGACY_ONLY_TEMPLE_TOURISM_SOURCE_KEYS = [
  "kawadYatra", "amarnathYatra", "narmadaParikrama", "goldenTemple", "hemkundSahib", "govardhanParikrama",
] as const;