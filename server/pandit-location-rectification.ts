import { and, eq, inArray } from "drizzle-orm";
import { db } from "./db";
import {
  indianCities,
  indianStates,
  panditLocationRectificationProposals,
  pandits, panditServices, masterServices, panditStorefronts,
} from "@shared/schema";
import { CANONICAL_LOCATION_ALIASES } from "./locations";
import { effectivePanditGovernance, isPanditPubliclyEligible } from "./pandit-public-eligibility";
import { evaluatePanditBookingEligibility } from "./pandit-booking-eligibility";

export type LocationState = { id: number; name: string; isActive?: boolean | null };
export type LocationCity = {
  id: number; stateId: number; name: string; aliases?: string[] | null; isActive?: boolean | null;
};

/** Coordinates are trusted only when supplied by a verified catalogue or
 * geocoder adapter. AI output can never satisfy this interface. */
export type VerifiedCoordinateEvidence = {
  latitude: number;
  longitude: number;
  source: string;
  confidence: number;
  verified: true;
  verifiedAt?: Date | string;
  scope: "address" | "city_centroid";
};

export type VerifiedCoordinateResolver = (candidate: {
  stateId: number; cityId: number; state: string; city: string;
}) => Promise<VerifiedCoordinateEvidence | null> | VerifiedCoordinateEvidence | null;

/** Interpretation is intentionally an ID-only suggestion constrained by the
 * active candidate list supplied to the adapter. It is never coordinate data. */
export type LocationAiInterpreter = (input: {
  stateText: string | null;
  cityText: string | null;
  candidates: Array<{ stateId: number; cityId: number; state: string; city: string }>;
}) => Promise<{ stateId: number; cityId: number; confidence: number; reason?: string } | null>;
export type AiLocationInterpretationAdapter = LocationAiInterpreter;
export type VerifiedGeocoder = VerifiedCoordinateResolver;

export type RectificationPandit = {
  id: number;
  stateId?: number | null; cityId?: number | null;
  state?: string | null; city?: string | null;
  originalState?: string | null; originalCity?: string | null;
  latitude?: number | null; longitude?: number | null;
  coordinateSource?: string | null; coordinateConfidence?: number | null;
  coordinateVerifiedAt?: Date | string | null;
  verified?: boolean | null; onLeave?: boolean | null; accountStatus?: string | null;
  suspendedUntil?: Date | null; locationReviewStatus?: string | null;
  directoryVisible?: boolean | null; searchEligible?: boolean | null;
  bookingEnabled?: boolean | null; indexingMode?: string | null;
  archived?: boolean | null; tier?: string | null;
};

export type LocationSnapshot = {
  stateId: number | null; cityId: number | null; state: string | null; city: string | null;
  latitude: number | null; longitude: number | null;
  coordinatesVerified?: boolean; coordinateSource?: string; coordinateConfidence?: number;
  coordinateScope?: "address";
  coordinateVerifiedAt?: string | null;
};

export type LocationRectification = {
  panditId: number;
  status: "verified" | "auto_corrected" | "needs_review";
  confidence: number;
  issueCategories: string[];
  source: string;
  reason: string;
  before: LocationSnapshot;
  proposed: LocationSnapshot | null;
  candidates: Array<{ stateId: number; cityId: number; state: string; city: string; match: string }>;
  autoApply: boolean;
  coordinateStatus: "verified" | "city_validated" | "unverified" | "needs_review";
  coordinateEvidence: VerifiedCoordinateEvidence | null;
  cityIdentityEvidence?: VerifiedCoordinateEvidence | null;
  discovery?: PanditDiscoveryAudit;
};

export type PanditDiscoveryAudit = {
  publicEligible: boolean;
  visibleInDirectory: boolean;
  eligibleForSearch: boolean;
  published: boolean;
  indexable: boolean;
  bookingEnabled: boolean;
  locationResolved: boolean;
  hiddenReasons: string[];
};

const clean = (value: unknown) => typeof value === "string"
  ? value.trim().toLocaleLowerCase("en-IN").replace(/\s+/g, " ")
  : "";
const same = (a: unknown, b: unknown) => clean(a) !== "" && clean(a) === clean(b);
export const normalizeLocationValue = (value: string) => clean(value);

/** Public-safe location values suitable for audit output and JSON storage. */
export function locationSnapshot(pandit: RectificationPandit): LocationSnapshot {
  return {
    stateId: pandit.stateId ?? null,
    cityId: pandit.cityId ?? null,
    state: typeof pandit.state === "string" ? pandit.state.trim() || null : null,
    city: typeof pandit.city === "string" ? pandit.city.trim() || null : null,
    latitude: typeof pandit.latitude === "number" && Number.isFinite(pandit.latitude) ? pandit.latitude : null,
    longitude: typeof pandit.longitude === "number" && Number.isFinite(pandit.longitude) ? pandit.longitude : null,
    coordinateSource: typeof pandit.coordinateSource === "string" ? pandit.coordinateSource : undefined,
    coordinateConfidence: typeof pandit.coordinateConfidence === "number" ? pandit.coordinateConfidence : undefined,
    coordinateVerifiedAt: pandit.coordinateVerifiedAt
      ? new Date(pandit.coordinateVerifiedAt).toISOString() : null,
  };
}

function aliasesFor(city: LocationCity) {
  return new Set([
    city.name,
    ...(city.aliases || []),
    ...(CANONICAL_LOCATION_ALIASES[city.name] || []),
  ].map(clean).filter(Boolean));
}

function activeState(state: LocationState | undefined) {
  return !!state && state.isActive !== false;
}
function activeCity(city: LocationCity | undefined) {
  return !!city && city.isActive !== false;
}

function candidateSnapshot(city: LocationCity, state: LocationState, current: LocationSnapshot): LocationSnapshot {
  const validCoordinates = current.latitude !== null && current.longitude !== null
    && current.latitude >= -90 && current.latitude <= 90
    && current.longitude >= -180 && current.longitude <= 180;
  return {
    stateId: state.id, cityId: city.id, state: state.name, city: city.name,
    // A rectification engine never invents coordinates. Invalid pairs are
    // removed rather than carried into distance/ranking queries.
    latitude: validCoordinates ? current.latitude : null,
    longitude: validCoordinates ? current.longitude : null,
    coordinateSource: current.coordinateSource,
    coordinateConfidence: current.coordinateConfidence,
    coordinateVerifiedAt: current.coordinateVerifiedAt,
  };
}

function validCoordinateEvidence(evidence: VerifiedCoordinateEvidence | null | undefined) {
  return !!evidence && evidence.verified === true
    && (evidence.scope === "address" || evidence.scope === "city_centroid")
    && typeof evidence.source === "string" && evidence.source.trim().length > 0
    && Number.isFinite(evidence.confidence) && evidence.confidence >= 0.9
    && Number.isFinite(evidence.latitude) && evidence.latitude >= -90 && evidence.latitude <= 90
    && Number.isFinite(evidence.longitude) && evidence.longitude >= -180 && evidence.longitude <= 180;
}

export function sameLocationSnapshot(a: LocationSnapshot, b: LocationSnapshot) {
  return a.stateId === b.stateId && a.cityId === b.cityId
    && a.state === b.state && a.city === b.city
    && a.latitude === b.latitude && a.longitude === b.longitude
    && (a.coordinateSource ?? null) === (b.coordinateSource ?? null)
    && (a.coordinateConfidence ?? null) === (b.coordinateConfidence ?? null)
    && (a.coordinateVerifiedAt ?? null) === (b.coordinateVerifiedAt ?? null);
}

function roundConfidence(value: number) {
  return Math.round(Math.max(0, Math.min(1, value)) * 100) / 100;
}

/**
 * Resolve one row against an explicit catalogue snapshot. Keeping this
 * function pure makes dry runs deterministic and prevents geocoders/AI from
 * silently becoming a source of truth.
 */
export function evaluatePanditLocation(
  pandit: RectificationPandit,
  states: readonly LocationState[],
  cities: readonly LocationCity[],
  options: { coordinateEvidence?: VerifiedCoordinateEvidence | null } = {},
): LocationRectification {
  const before = locationSnapshot(pandit);
  const stateById = new Map(states.map(state => [state.id, state]));
  const cityById = new Map(cities.map(city => [city.id, city]));
  const issues: string[] = [];
  const stateText = pandit.state || pandit.originalState;
  const cityText = pandit.city || pandit.originalCity;
  const state = before.stateId == null ? undefined : stateById.get(before.stateId);
  const city = before.cityId == null ? undefined : cityById.get(before.cityId);
  let selected: { city: LocationCity; state: LocationState; match: string } | undefined;
  let aliasMatch = false;
  let catalogueAgreement = false;

  if (before.stateId == null && !clean(stateText)) issues.push("missing_state");
  if (before.cityId == null && !clean(cityText)) issues.push("missing_city");
  if (before.stateId != null && !activeState(state)) issues.push("unknown_or_inactive_state");
  if (before.cityId != null && !activeCity(city)) issues.push("unknown_or_inactive_city");
  if (city && state && city.stateId !== state.id) issues.push("city_state_mismatch");

  // A valid city reference is authoritative for its parent state. This is
  // safe even when the legacy state text/ID is stale.
  if (activeCity(city)) {
    const parent = stateById.get(city!.stateId);
    if (activeState(parent)) {
      selected = { city: city!, state: parent!, match: "catalogue_id" };
      catalogueAgreement = state?.id === parent!.id;
    }
  }
  if (!selected && clean(cityText)) {
    const wantedCity = clean(cityText);
    const wantedState = clean(stateText);
    const matches = cities.filter(item => activeCity(item) && aliasesFor(item).has(wantedCity))
      .map(item => ({ city: item, state: stateById.get(item.stateId)! }))
      .filter(item => activeState(item.state) && (!wantedState || same(item.state.name, wantedState)));
    if (matches.length === 1) {
      const match = matches[0];
      aliasMatch = !same(match.city.name, cityText);
      selected = { ...match, match: aliasMatch ? "catalogue_alias" : "catalogue_name" };
      catalogueAgreement = !!wantedState;
    } else if (matches.length > 1) {
      issues.push("conflicting_address");
    }
  }
  if (!selected && clean(cityText)) issues.push("unrecognized_spelling_or_alias");
  if (selected && stateText && !same(selected.state.name, stateText)) {
    // A matching city with stale state text is a deterministic relationship
    // repair. A different explicit state ID is still reported above.
    if (before.stateId != null && selected.state.id !== before.stateId) issues.push("city_state_mismatch");
  }

  const hasLat = typeof pandit.latitude === "number" && Number.isFinite(pandit.latitude);
  const hasLng = typeof pandit.longitude === "number" && Number.isFinite(pandit.longitude);
  const validCoordinates = hasLat && hasLng
    && pandit.latitude! >= -90 && pandit.latitude! <= 90
    && pandit.longitude! >= -180 && pandit.longitude! <= 180;
  if (hasLat !== hasLng) issues.push("missing_coordinates");
  else if (hasLat && hasLng && !validCoordinates) issues.push("invalid_coordinate_range");
  else if (!hasLat && !hasLng) issues.push("missing_coordinates");

  const proposed = selected ? candidateSnapshot(selected.city, selected.state, before) : null;
  const hasCoordinatePair = hasLat && hasLng;
  const coordinateRepairRequired = !hasCoordinatePair || !validCoordinates;
  const coordinateEvidence = validCoordinateEvidence(options.coordinateEvidence) ? options.coordinateEvidence! : null;
  const addressEvidence = coordinateEvidence?.scope === "address" ? coordinateEvidence : null;
  let coordinateStatus: LocationRectification["coordinateStatus"] = hasCoordinatePair && validCoordinates ? "unverified" : "needs_review";
  if (addressEvidence) {
    coordinateStatus = "verified";
    if (proposed) {
      proposed.latitude = addressEvidence.latitude;
      proposed.longitude = addressEvidence.longitude;
      proposed.coordinatesVerified = true;
      proposed.coordinateScope = "address";
      proposed.coordinateSource = addressEvidence.source;
      proposed.coordinateConfidence = addressEvidence.confidence;
      proposed.coordinateVerifiedAt = addressEvidence.verifiedAt
        ? new Date(addressEvidence.verifiedAt).toISOString() : null;
    }
    // A valid pair that disagrees materially with verified city evidence is
    // a consistency issue, not a reason to trust the old value.
    if (hasCoordinatePair && validCoordinates
      && (Math.abs(pandit.latitude! - addressEvidence.latitude) > 0.1
        || Math.abs(pandit.longitude! - addressEvidence.longitude) > 0.1)) {
      issues.push("coordinates_inconsistent_with_canonical_location");
    }
  } else if (coordinateEvidence?.scope === "city_centroid") {
    // A city centroid can validate the canonical city and flag a wildly
    // out-of-region existing point, but can never replace that point.
    if (hasCoordinatePair && validCoordinates
      && (Math.abs(pandit.latitude! - coordinateEvidence.latitude) > 2
        || Math.abs(pandit.longitude! - coordinateEvidence.longitude) > 2)) {
      issues.push("coordinates_inconsistent_with_canonical_location");
    }
    coordinateStatus = hasCoordinatePair && validCoordinates ? "city_validated" : "needs_review";
    if (coordinateRepairRequired) issues.push("verified_coordinate_evidence_unavailable");
  } else if (coordinateRepairRequired && selected) {
    // No coordinate is proposed without verified catalogue/geocoder evidence.
    issues.push("verified_coordinate_evidence_unavailable");
  }
  if (proposed && selected
    && (selected.state.id !== pandit.stateId || selected.city.id !== pandit.cityId)
    && !addressEvidence) {
    // Do not carry the old point or its provenance into a different
    // canonical city/state. Apply handlers also clear the persisted fields.
    proposed.latitude = null;
    proposed.longitude = null;
    delete proposed.coordinatesVerified;
    delete proposed.coordinateScope;
    delete proposed.coordinateSource;
    delete proposed.coordinateConfidence;
    delete proposed.coordinateVerifiedAt;
  }
  const changed = !!proposed && !sameLocationSnapshot(proposed, before);
  const source = selected?.match || "unresolved";
  // Confidence weights source completeness, alias certainty, and catalogue
  // agreement. Geocoding/containment are intentionally zero until verified
  // evidence is supplied by a future adapter.
  let confidence = selected ? (selected.match === "catalogue_id" ? 0.99 : aliasMatch ? 0.95 : 0.93) : 0;
  if (!catalogueAgreement && selected && stateText) confidence -= 0.03;
  if (!validCoordinates) confidence -= 0.05;
  if (coordinateEvidence) confidence = Math.min(confidence, coordinateEvidence.confidence);
  if (coordinateRepairRequired && !addressEvidence) confidence = 0;
  confidence = roundConfidence(confidence);
  const ambiguous = issues.some(issue => [
    "conflicting_address", "unrecognized_spelling_or_alias", "unknown_or_inactive_state",
    "unknown_or_inactive_city",
  ].includes(issue));
  const autoApply = !!proposed && changed && confidence >= 0.9 && !ambiguous
    && (!coordinateRepairRequired || !!addressEvidence);
  const status = autoApply ? "auto_corrected" : issues.length ? "needs_review" : "verified";
  const reason = issues.length
    ? `Location audit found: ${issues.join(", ")}`
    : changed ? `Canonical ${source} relationship matched the active catalogue`
      : "Canonical location agrees with the active catalogue";

  return {
    panditId: pandit.id, status, confidence, issueCategories: Array.from(new Set(issues)),
    source, reason, before, proposed: changed ? proposed : null,
    candidates: selected ? [{ stateId: selected.state.id, cityId: selected.city.id, state: selected.state.name, city: selected.city.name, match: selected.match }] : [],
    autoApply, coordinateStatus, coordinateEvidence: addressEvidence,
    cityIdentityEvidence: coordinateEvidence?.scope === "city_centroid" ? coordinateEvidence : null,
  };
}

export async function evaluatePanditLocationWithAdapters(
  pandit: RectificationPandit,
  states: readonly LocationState[],
  cities: readonly LocationCity[],
  options: {
    aiInterpreter?: LocationAiInterpreter;
    aiAdapter?: LocationAiInterpreter;
    coordinateResolver?: VerifiedCoordinateResolver;
    verifiedGeocoder?: VerifiedCoordinateResolver;
  } = {},
): Promise<LocationRectification> {
  let deterministic = evaluatePanditLocation(pandit, states, cities);
  const stateById = new Map(states.map(state => [state.id, state]));
  const coordinateResolver = options.coordinateResolver || options.verifiedGeocoder;
  const aiInterpreter = options.aiInterpreter || options.aiAdapter;
  const coordinateFor = async (result: LocationRectification) => {
    if (!coordinateResolver || !result.candidates[0]) return null;
    const candidate = result.candidates[0];
    const evidence = await coordinateResolver(candidate);
    return validCoordinateEvidence(evidence) ? evidence : null;
  };

  // Deterministic catalogue relationships always win. Coordinates may be
  // repaired only through independently verified evidence, never AI output.
  if (deterministic.candidates.length) {
    const evidence = await coordinateFor(deterministic);
    if (evidence) {
      deterministic = evaluatePanditLocation(pandit, states, cities, { coordinateEvidence: evidence });
    }
    return deterministic;
  }
  if (!aiInterpreter) return deterministic;

  const candidates = cities
    .filter(city => activeCity(city) && activeState(stateById.get(city.stateId)))
    .map(city => {
      const state = stateById.get(city.stateId)!;
      return { stateId: state.id, cityId: city.id, state: state.name, city: city.name };
    });
  const interpretation = await aiInterpreter({
    stateText: typeof (pandit.state || pandit.originalState) === "string" ? (pandit.state || pandit.originalState)!.trim() || null : null,
    cityText: typeof (pandit.city || pandit.originalCity) === "string" ? (pandit.city || pandit.originalCity)!.trim() || null : null,
    candidates,
  });
  if (!interpretation || !Number.isInteger(interpretation.stateId) || !Number.isInteger(interpretation.cityId)) return deterministic;
  const candidate = candidates.find(item => item.stateId === interpretation.stateId && item.cityId === interpretation.cityId);
  if (!candidate || !Number.isFinite(interpretation.confidence)) return deterministic;
  // Re-evaluate the canonical IDs, then cap AI-assisted confidence below the
  // automatic threshold. This preserves a review queue even when a model is
  // unusually certain and ensures the model cannot select an inactive row.
  const aiPandit = { ...pandit, stateId: candidate.stateId, cityId: candidate.cityId };
  const evidence = coordinateResolver
    ? await coordinateResolver(candidate)
    : null;
  const assisted = evaluatePanditLocation(aiPandit, states, cities, {
    coordinateEvidence: validCoordinateEvidence(evidence) ? evidence : null,
  });
  return {
    ...assisted,
    status: "needs_review",
    confidence: roundConfidence(Math.min(0.89, interpretation.confidence, assisted.confidence || 0.89)),
    source: "ai_interpretation",
    reason: `AI interpretation requires admin review${interpretation.reason ? `: ${interpretation.reason.slice(0, 300)}` : ""}`,
    autoApply: false,
    candidates: [{ ...candidate, match: "ai_interpretation" }],
  };
}

export function rectificationDedupeKey(result: LocationRectification) {
  // Key the proposal to the canonical target and issue set rather than the
  // mutable legacy spelling. Re-running an audit after applying a proposal
  // therefore does not create a second correction for the same row.
  const target = result.proposed || result.before;
  return `pandit:${result.panditId}:${target.stateId || "none"}:${target.cityId || "none"}:${result.issueCategories.slice().sort().join(",")}`;
}

export function summarizeLocationAudit(results: readonly LocationRectification[]) {
  const summary = {
    total: results.length, verified: 0, autoCorrectable: 0, needsReview: 0,
    issues: {} as Record<string, number>,
  };
  for (const result of results) {
    if (result.status === "verified") summary.verified++;
    else if (result.autoApply) summary.autoCorrectable++;
    else summary.needsReview++;
    for (const issue of result.issueCategories) summary.issues[issue] = (summary.issues[issue] || 0) + 1;
  }
  return summary;
}

type AuditCounts = {
  total: number; publicEligible: number; visibleInDirectory: number; eligibleForSearch: number;
  published: number; indexable: number; bookingEnabled: number; locationResolved: number;
};

function countDiscovery(results: readonly LocationRectification[]): AuditCounts {
  const counts: AuditCounts = {
    total: results.length, publicEligible: 0, visibleInDirectory: 0, eligibleForSearch: 0,
    published: 0, indexable: 0, bookingEnabled: 0, locationResolved: 0,
  };
  for (const result of results) {
    const discovery = result.discovery;
    if (!discovery) continue;
    for (const key of Object.keys(counts).filter(key => key !== "total") as Array<keyof Omit<AuditCounts, "total">>) {
      if (discovery[key]) counts[key]++;
    }
  }
  return counts;
}

export function buildDiscoveryAudit(
  pandit: any,
  stateIds: ReadonlySet<number>,
  cityById: ReadonlyMap<number, { id: number; stateId: number; isActive?: boolean | null }>,
  published: boolean,
  services: Array<{ mode?: string | null; serviceAreas?: string[] | null }>,
): PanditDiscoveryAudit {
  const governance = effectivePanditGovernance(pandit, stateIds, cityById);
  const publicEligible = isPanditPubliclyEligible(pandit, stateIds, cityById);
  const locationResolved = pandit.locationReviewStatus === "resolved"
    && pandit.stateId != null && pandit.cityId != null
    && stateIds.has(pandit.stateId)
    && cityById.get(pandit.cityId)?.isActive !== false
    && cityById.get(pandit.cityId)?.stateId === pandit.stateId;
  const bookingDiagnostics = evaluatePanditBookingEligibility(pandit, {
    services, pujaSupported: services.length > 0,
  });
  const bookingEnabled = governance.booking && bookingDiagnostics.result.passed;
  const hiddenReasons = new Set<string>();
  if (!locationResolved) hiddenReasons.add("location_unresolved");
  for (const reason of governance.reasons) hiddenReasons.add(reason);
  if (!published) hiddenReasons.add("not_published");
  if (!bookingEnabled) {
    hiddenReasons.add(governance.booking ? "booking_ineligible" : "booking_disabled");
    for (const exclusion of bookingDiagnostics.exclusions) hiddenReasons.add(`booking:${exclusion.split(":")[0]}`);
  }
  return {
    publicEligible,
    visibleInDirectory: governance.directory,
    eligibleForSearch: governance.search,
    published,
    indexable: governance.indexable,
    bookingEnabled,
    locationResolved,
    hiddenReasons: Array.from(hiddenReasons).sort(),
  };
}

export async function runPanditLocationAudit(options: {
  persist?: boolean; batchId?: string; aiInterpreter?: LocationAiInterpreter;
  aiAdapter?: LocationAiInterpreter; coordinateResolver?: VerifiedCoordinateResolver;
  verifiedGeocoder?: VerifiedCoordinateResolver;
} = {}) {
  const [rows, states, cities] = await Promise.all([
    db.select().from(pandits),
    db.select().from(indianStates),
    db.select().from(indianCities),
  ]);
  const activeStates = states
    .filter(state => state.isActive === true)
    .map(state => ({ id: state.id, name: state.name, isActive: state.isActive }));
  const activeCities = cities
    .filter(city => city.isActive === true)
    .map(city => ({ id: city.id, stateId: city.stateId, name: city.name, aliases: city.aliases, isActive: city.isActive }));
  const stateIds = new Set(activeStates.filter(state => state.isActive !== false).map(state => state.id));
  const cityById = new Map(activeCities.map(city => [city.id, city]));
  const ids = rows.map(row => row.id);
  const [storefrontRows, serviceRows] = await Promise.all([
    ids.length ? db.select({ panditId: panditStorefronts.panditId, isPublished: panditStorefronts.isPublished, status: panditStorefronts.status })
      .from(panditStorefronts).where(inArray(panditStorefronts.panditId, ids)) : [],
    ids.length ? db.select({ panditId: panditServices.panditId, mode: panditServices.mode, serviceAreas: panditServices.serviceAreas })
      .from(panditServices).innerJoin(masterServices, and(eq(panditServices.masterServiceId, masterServices.id), eq(masterServices.isActive, true)))
      .where(and(inArray(panditServices.panditId, ids), eq(panditServices.isActive, true))) : [],
  ]);
  const publishedById = new Map(storefrontRows.map(row => [row.panditId, !!row.isPublished && row.status === "published"]));
  const servicesById = new Map<number, Array<{ mode?: string | null; serviceAreas?: string[] | null }>>();
  for (const service of serviceRows) servicesById.set(service.panditId, [...(servicesById.get(service.panditId) || []), service]);
  const results: LocationRectification[] = [];
  // Keep optional external adapters serialized. This avoids an audit burst
  // becoming an OpenAI/geocoder rate-limit event for the whole catalogue.
  for (const row of rows) {
    results.push(await evaluatePanditLocationWithAdapters({
      id: row.id, stateId: row.stateId, cityId: row.cityId, state: row.state, city: row.city,
      originalState: row.originalState, originalCity: row.originalCity, latitude: row.latitude, longitude: row.longitude,
      coordinateSource: row.coordinateSource, coordinateConfidence: row.coordinateConfidence,
      coordinateVerifiedAt: row.coordinateVerifiedAt,
    }, activeStates, activeCities, {
      aiInterpreter: options.aiInterpreter, aiAdapter: options.aiAdapter,
      coordinateResolver: options.coordinateResolver, verifiedGeocoder: options.verifiedGeocoder,
    }));
    const discovery = buildDiscoveryAudit(row, stateIds, cityById, publishedById.get(row.id) === true, servicesById.get(row.id) || []);
    results[results.length - 1].discovery = discovery;
  }
  const beforeCounts = countDiscovery(results);
  const afterResults = results.map(result => {
    if (!result.autoApply || !result.proposed) return result;
    const row = rows.find(candidate => candidate.id === result.panditId)!;
    const after = { ...row, stateId: result.proposed.stateId, cityId: result.proposed.cityId, locationReviewStatus: "resolved" };
    return { ...result, discovery: buildDiscoveryAudit(after, stateIds, cityById, publishedById.get(row.id) === true, servicesById.get(row.id) || []) };
  });
  const afterCounts = countDiscovery(afterResults);
  const countReconciliation = Object.fromEntries(Object.keys(beforeCounts).map(key => [
    key, { before: beforeCounts[key as keyof AuditCounts], after: afterCounts[key as keyof AuditCounts], delta: afterCounts[key as keyof AuditCounts] - beforeCounts[key as keyof AuditCounts] },
  ]));
  if (options.persist) {
    for (const result of results) {
      if (!result.proposed && !result.issueCategories.length) continue;
      await db.insert(panditLocationRectificationProposals).values({
        panditId: result.panditId, dedupeKey: rectificationDedupeKey(result), batchId: options.batchId || null,
        status: "pending", issueCategories: result.issueCategories, before: result.before,
        proposed: result.proposed || {}, candidates: result.candidates, source: result.source,
        confidence: result.confidence, reason: result.reason,
      }).onConflictDoNothing({ target: panditLocationRectificationProposals.dedupeKey });
    }
  }
  return { results, summary: summarizeLocationAudit(results), beforeCounts, afterCounts, countReconciliation, batchId: options.batchId || null };
}

export async function resolveActiveCityState(cityId: number) {
  const [row] = await db.select({ stateId: indianCities.stateId })
    .from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
    .where(and(eq(indianCities.id, cityId), eq(indianCities.isActive, true), eq(indianStates.isActive, true)))
    .limit(1);
  return row?.stateId;
}