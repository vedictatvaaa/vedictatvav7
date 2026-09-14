import crypto from "crypto";

export type ProfileServiceInput = {
  id: number;
  masterServiceId: number;
  name: string | null;
  slug: string | null;
  mode: string | null;
  serviceAreas: string[];
  isActive: boolean;
};

export type LegacyPanditInput = {
  id: number;
  name: string;
  slug: string | null;
  city: string | null;
  state: string | null;
  specialization: string | null;
  languages: string | null;
  experience: number | null;
  bio: string | null;
  education: string | null;
  serviceArea: string | null;
  verified: boolean;
  archived: boolean;
  directoryVisible: boolean;
  searchEligible: boolean;
  bookingEnabled: boolean;
  indexingMode: string | null;
  services: ProfileServiceInput[];
};

export type ProfileProposal = {
  fieldKey: string;
  proposalClass: "deterministic" | "ai_draft";
  safeBatch: boolean;
  before: unknown;
  proposed: unknown;
  sourcePaths: string[];
  confidence: number;
  reason: string;
  generationKey?: string;
};

export type ProfileFinding = {
  fieldKey: string;
  state: "missing" | "proposal" | "blocked";
  proposalClass: "deterministic" | "ai_draft" | "unknown";
  currentValue: unknown;
  sourcePaths: string[];
  reason: string;
  proposal?: ProfileProposal;
};

export type ProfileAnalysis = {
  panditId: number;
  name: string;
  city: string | null;
  state: string | null;
  visibility: { archived: boolean; directory: boolean; search: boolean; booking: boolean; indexingMode: string | null };
  sourceSnapshot: Record<string, unknown>;
  sourceSnapshotHash: string;
  missingFields: string[];
  findings: ProfileFinding[];
};

const clean = (value: unknown): string | null => {
  if (typeof value !== "string") return value == null ? null : String(value).trim() || null;
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized || null;
};

function normalizeList(value: string): string {
  return value.split(/[|;,]/g).map((item) => item.trim()).filter(Boolean).join(", ");
}

function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).sort().reduce<Record<string, unknown>>((out, key) => {
      out[key] = stableValue((value as Record<string, unknown>)[key]);
      return out;
    }, {});
  }
  return value;
}

export function profileSnapshot(input: LegacyPanditInput): Record<string, unknown> {
  return {
    panditId: input.id,
    name: clean(input.name),
    slug: clean(input.slug),
    city: clean(input.city),
    state: clean(input.state),
    specialization: clean(input.specialization),
    languages: clean(input.languages),
    experience: input.experience,
    bio: clean(input.bio),
    education: clean(input.education),
    serviceArea: clean(input.serviceArea),
    services: input.services.filter((service) => service.isActive).map((service) => ({
      id: service.id,
      masterServiceId: service.masterServiceId,
      name: clean(service.name),
      slug: clean(service.slug),
      mode: clean(service.mode),
      serviceAreas: service.serviceAreas.map((area) => clean(area)).filter(Boolean),
    })),
  };
}

export function hashProfileSnapshot(snapshot: Record<string, unknown>): string {
  return crypto.createHash("sha256").update(JSON.stringify(stableValue(snapshot))).digest("hex");
}

function proposal(
  fieldKey: string,
  before: unknown,
  proposed: unknown,
  sourcePaths: string[],
  reason: string,
): ProfileFinding {
  return {
    fieldKey,
    state: "proposal",
    proposalClass: "deterministic",
    currentValue: before,
    sourcePaths,
    reason,
    proposal: {
      fieldKey,
      proposalClass: "deterministic",
      safeBatch: true,
      before,
      proposed,
      sourcePaths,
      confidence: 1,
      reason,
    },
  };
}

function missing(
  fieldKey: string,
  currentValue: unknown,
  sourcePaths: string[],
  reason: string,
  proposalClass: ProfileFinding["proposalClass"] = "unknown",
): ProfileFinding {
  return { fieldKey, state: proposalClass === "ai_draft" ? "missing" : "missing", proposalClass, currentValue, sourcePaths, reason };
}

export function analyzeProfileCompletion(input: LegacyPanditInput): ProfileAnalysis {
  const snapshot = profileSnapshot(input);
  const hash = hashProfileSnapshot(snapshot);
  const findings: ProfileFinding[] = [];
  const addNormalization = (fieldKey: string, value: string | null, sourcePath: string) => {
    if (!value) return;
    const normalized = normalizeList(value);
    if (normalized !== value) findings.push(proposal(fieldKey, value, normalized, [sourcePath], "Normalized an already supplied value without adding facts"));
  };

  addNormalization("pandits.languages", clean(input.languages), "pandits.languages");
  addNormalization("pandits.serviceArea", clean(input.serviceArea), "pandits.serviceArea");
  addNormalization("pandits.education", clean(input.education), "pandits.education");
  for (const service of input.services.filter((item) => item.isActive)) {
    const rawAreas = service.serviceAreas.filter(Boolean);
    const normalizedAreas = rawAreas.map((area) => clean(area)).filter(Boolean) as string[];
    if (rawAreas.some((area, index) => area !== normalizedAreas[index])) {
      findings.push(proposal(
        `panditServices:${service.id}.serviceAreas`,
        rawAreas,
        normalizedAreas,
        [`pandit_services:${service.id}.serviceAreas`],
        "Trimmed already supplied service areas without adding facts",
      ));
    }
  }

  const sources = [
    "pandits.name", "pandits.specialization", "pandits.city", "pandits.state",
    ...(clean(input.languages) ? ["pandits.languages"] : []),
    ...(input.experience != null ? ["pandits.experience"] : []),
    ...input.services.filter((service) => service.isActive).flatMap((service) => [
      ...(service.name ? [`master_services:${service.masterServiceId}.name`] : []),
      ...(service.mode ? [`pandit_services:${service.id}.mode`] : []),
      ...(service.serviceAreas.length ? [`pandit_services:${service.id}.serviceAreas`] : []),
    ]),
  ];
  const aiEligible = Boolean(clean(input.name) && (clean(input.specialization) || input.services.some((service) => service.isActive && service.name)));

  if (!clean(input.bio)) {
    findings.push(missing("pandits.bio", input.bio, sources, aiEligible ? "Biography is missing; a source-grounded draft may be generated" : "Biography is missing and supplied facts are insufficient for a grounded draft", aiEligible ? "ai_draft" : "unknown"));
  }
  if (!clean(input.education)) findings.push(missing("pandits.education", input.education, [], "Education or qualifications were not supplied; do not infer them"));
  if (!clean(input.languages)) findings.push(missing("pandits.languages", input.languages, [], "Languages were not supplied; do not infer them"));

  const activeServices = input.services.filter((service) => service.isActive);
  if (!activeServices.length) {
    findings.push(missing("panditServices", [], [], "No active service assignment was supplied; Admin must confirm a catalogue service"));
  } else {
    const areasFromServices = activeServices.flatMap((service) => service.serviceAreas).filter(Boolean);
    if (!clean(input.serviceArea) && areasFromServices.length) {
      findings.push(proposal("pandits.serviceArea", input.serviceArea, Array.from(new Set(areasFromServices.map((area) => normalizeList(area)))).join(", "), activeServices.map((service) => `pandit_services:${service.id}.serviceAreas`), "Copied already supplied active service areas into the missing profile service area"));
    } else if (!clean(input.serviceArea)) {
      findings.push(missing("pandits.serviceArea", input.serviceArea, [], "Service area was not supplied and active services contain no areas"));
    }
    for (const service of activeServices) {
      if (!clean(service.mode)) findings.push(missing(`panditServices:${service.id}.mode`, service.mode, [], "Service mode is missing; do not infer online or in-person availability"));
      if (!service.serviceAreas.length && clean(service.mode)?.toLowerCase() !== "online" && clean(service.mode)?.toLowerCase() !== "virtual") {
        findings.push(missing(`panditServices:${service.id}.serviceAreas`, service.serviceAreas, [], "Service areas are missing for a non-virtual service"));
      }
    }
  }

  if (aiEligible) {
    const aiFields = [
      ["storefront.profileIntroduction", "Biography is missing; generate only source-grounded draft copy"],
      ["storefront.seoTitle", "SEO title can be drafted from supplied identity, specialization, and location facts"],
      ["storefront.metaDescription", "Meta description can be drafted from supplied identity, specialization, and service facts"],
    ] as const;
    for (const [fieldKey, reason] of aiFields) {
      if (!findings.some((finding) => finding.fieldKey === fieldKey)) {
        findings.push(missing(fieldKey, null, sources, reason, "ai_draft"));
      }
    }
  }

  return {
    panditId: input.id,
    name: input.name,
    city: input.city,
    state: input.state,
    visibility: {
      archived: input.archived,
      directory: input.directoryVisible,
      search: input.searchEligible,
      booking: input.bookingEnabled,
      indexingMode: input.indexingMode,
    },
    sourceSnapshot: snapshot,
    sourceSnapshotHash: hash,
    missingFields: Array.from(new Set(findings.filter((finding) => finding.state === "missing").map((finding) => finding.fieldKey))),
    findings,
  };
}

export function inputFromRows(pandit: any, services: any[]): LegacyPanditInput {
  return {
    id: Number(pandit.id),
    name: String(pandit.name || ""),
    slug: pandit.slug ?? null,
    city: pandit.city ?? null,
    state: pandit.state ?? null,
    specialization: pandit.specialization ?? null,
    languages: pandit.languages ?? null,
    experience: pandit.experience == null ? null : Number(pandit.experience),
    bio: pandit.bio ?? null,
    education: pandit.education ?? null,
    serviceArea: pandit.serviceArea ?? null,
    verified: Boolean(pandit.verified),
    archived: Boolean(pandit.archived),
    directoryVisible: Boolean(pandit.directoryVisible),
    searchEligible: Boolean(pandit.searchEligible),
    bookingEnabled: Boolean(pandit.bookingEnabled),
    indexingMode: pandit.indexingMode ?? null,
    services: services.map((service) => ({
      id: Number(service.id),
      masterServiceId: Number(service.masterServiceId),
      name: service.name ?? null,
      slug: service.slug ?? null,
      mode: service.mode ?? null,
      serviceAreas: Array.isArray(service.serviceAreas) ? service.serviceAreas : [],
      isActive: service.isActive !== false,
    })),
  };
}