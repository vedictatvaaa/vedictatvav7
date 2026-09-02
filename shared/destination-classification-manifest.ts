/** Reviewed, static classification decisions; safe to import from client code. */
export type TempleTourismClassification = "TEMPLE" | "TIRTH" | "LEGACY_ONLY";

export const TEMPLE_TOURISM_CLASSIFICATION_MANIFEST: Readonly<Record<string, TempleTourismClassification>> = {
  somnath: "TEMPLE", mallikarjuna: "TEMPLE", mahakaleshwar: "TEMPLE", omkareshwar: "TEMPLE",
  kedarnath: "TEMPLE", bhimashankar: "TEMPLE", kashivishwanath: "TEMPLE", trimbakeshwar: "TEMPLE",
  vaidyanath: "TEMPLE", nageshwar: "TEMPLE", rameshwaram: "TEMPLE", grishneshwar: "TEMPLE",
  vaishno: "TEMPLE", kamakhya: "TEMPLE", kalighat: "TEMPLE", vindhyavasini: "TEMPLE", ambaji: "TEMPLE",
  badrinath: "TEMPLE", gangotri: "TEMPLE", yamunotri: "TEMPLE", tirupati: "TEMPLE", jagannath: "TEMPLE",
  meenakshi: "TEMPLE", shirdi: "TEMPLE", konark: "TEMPLE", sabarimala: "TEMPLE",
  gangaRiver: "TIRTH", yamunaRiver: "TIRTH", narmadaRiver: "TIRTH", godavariRiver: "TIRTH", kaveriRiver: "TIRTH",
  ayodhya: "TIRTH", mathuraVrindavan: "TIRTH", haridwar: "TIRTH", dwarka: "TIRTH", mansarovar: "TIRTH",
  kawadYatra: "LEGACY_ONLY", amarnathYatra: "LEGACY_ONLY", narmadaParikrama: "LEGACY_ONLY",
  goldenTemple: "LEGACY_ONLY", hemkundSahib: "LEGACY_ONLY", govardhanParikrama: "LEGACY_ONLY",
};