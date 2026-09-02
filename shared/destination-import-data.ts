import { TEMPLE_TOURISM_SOURCE_ROWS, TIRTH_GUIDE_SOURCE_ROWS } from "./pilgrimage-source-contract";
import { TEMPLE_TOURISM_CLASSIFICATION_MANIFEST } from "./destination-classification-manifest";
import { TIRTH_SOURCE_CONSOLIDATION_MANIFEST } from "./destination-consolidation-manifest";
import {
  TEMPLE_TOURISM_SERIALIZABLE_SOURCE_DATA,
  TIRTH_GUIDE_SERIALIZABLE_SOURCE_DATA,
} from "./canonical-destination-source-data";

/** Client-safe, serializable source snapshots used by the Phase 2 importer. */
export type CanonicalDestinationImportRow = {
  sourceKey: string;
  preferredSlug: string;
  name: string;
  provenance: "TIRTH_GUIDE" | "TEMPLE_TOURISM";
  classification: "TIRTH" | "TEMPLE";
  editorial: Record<string, unknown>;
  aliases: readonly string[];
  nameHindi?: string;
  region?: string;
  state?: string;
  deity?: string;
  category?: string;
  location?: string;
  shortDescription?: string;
  description?: string;
  latitude?: number;
  longitude?: number;
};

export function canonicalSlug(value: string): string {
  const slug = value.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error(`Unsafe canonical slug: ${value}`);
  return slug;
}

type TempleSourceFields = {
  id: string; name: string; nameHindi: string; location: string; state: string;
  deity: string; category: string; description: string; lat: number; lng: number;
};
type TirthGuideSourceFields = {
  slug: string; name: string; nameHi?: string; region: string; state: string;
  deity: string; category: string; shortInfo: string; significance: string;
};
const templeByKey = new Map(TEMPLE_TOURISM_SERIALIZABLE_SOURCE_DATA.map((row) => [row.id, row]));
const tirthGuideByKey = new Map(TIRTH_GUIDE_SERIALIZABLE_SOURCE_DATA.map((row) => [row.slug, row]));
function requiredSource<T>(value: T | undefined, sourceKey: string): T {
  if (!value) throw new Error(`Missing full editorial source record: ${sourceKey}`);
  return value;
}
function sourceRecord<T extends { name: string }>(sourceKey: string, source: T) {
  return { sourceKey, name: source.name, content: source };
}
function templeColumns(source: TempleSourceFields) {
  return {
    nameHindi: source.nameHindi, location: source.location, state: source.state, deity: source.deity,
    category: source.category, description: source.description, shortDescription: source.description,
    latitude: source.lat, longitude: source.lng,
  };
}
function guideColumns(source: TirthGuideSourceFields) {
  return {
    nameHindi: source.nameHi, region: source.region, state: source.state, deity: source.deity,
    category: source.category, shortDescription: source.shortInfo, description: source.significance,
  };
}
const consolidatedTempleEditorial = new Map<string, ReturnType<typeof sourceRecord>[]>();
for (const [sourceKey] of TEMPLE_TOURISM_SOURCE_ROWS) {
  const guideSourceKey = TIRTH_SOURCE_CONSOLIDATION_MANIFEST[sourceKey as keyof typeof TIRTH_SOURCE_CONSOLIDATION_MANIFEST];
  if (guideSourceKey) {
    const current = consolidatedTempleEditorial.get(guideSourceKey) ?? [];
    current.push(sourceRecord(sourceKey, requiredSource(templeByKey.get(sourceKey), sourceKey)));
    consolidatedTempleEditorial.set(guideSourceKey, current);
  }
}

export const CANONICAL_DESTINATION_IMPORT_ROWS: readonly CanonicalDestinationImportRow[] = [
  ...TIRTH_GUIDE_SOURCE_ROWS.map(([sourceKey]) => {
    const source = requiredSource(tirthGuideByKey.get(sourceKey), sourceKey);
    return {
    sourceKey: `tirth-guide:${sourceKey}`, preferredSlug: canonicalSlug(sourceKey), name: source.name,
    provenance: "TIRTH_GUIDE" as const, classification: "TIRTH" as const,
    editorial: {
      sourceKey, sourceCollection: "tirth-guide",
      sourceRecords: [sourceRecord(sourceKey, source), ...(consolidatedTempleEditorial.get(sourceKey) ?? [])],
    },
    aliases: Object.entries(TIRTH_SOURCE_CONSOLIDATION_MANIFEST)
      .filter(([, guideKey]) => guideKey === sourceKey).map(([secondaryKey]) => canonicalSlug(secondaryKey)),
    ...guideColumns(source),
  };
  }),
  ...TEMPLE_TOURISM_SOURCE_ROWS.flatMap(([sourceKey]) => {
    const classification = TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[sourceKey];
    if (classification === "LEGACY_ONLY" || (classification === "TIRTH" && sourceKey in TIRTH_SOURCE_CONSOLIDATION_MANIFEST)) return [];
    const source = requiredSource(templeByKey.get(sourceKey), sourceKey);
    return [{
      sourceKey: `temple-tourism:${sourceKey}`, preferredSlug: canonicalSlug(sourceKey), name: source.name,
      provenance: "TEMPLE_TOURISM" as const, classification,
      editorial: { sourceKey, sourceCollection: "temple-tourism", sourceRecords: [sourceRecord(sourceKey, source)] },
      aliases: [],
      ...templeColumns(source),
    }];
  }),
];

export const CANONICAL_DESTINATION_COUNTS = {
  tirth: CANONICAL_DESTINATION_IMPORT_ROWS.filter((row) => row.classification === "TIRTH").length,
  temple: CANONICAL_DESTINATION_IMPORT_ROWS.filter((row) => row.classification === "TEMPLE").length,
  alias: CANONICAL_DESTINATION_IMPORT_ROWS.reduce((total, row) => total + row.aliases.length, 0),
} as const;

/** Resolve a reviewed raw Tirth source key to its one canonical source key. */
export function canonicalTirthSourceKey(rawSourceKey: string): string {
  const consolidated = TIRTH_SOURCE_CONSOLIDATION_MANIFEST[rawSourceKey as keyof typeof TIRTH_SOURCE_CONSOLIDATION_MANIFEST];
  return `tirth-guide:${consolidated ?? rawSourceKey}`;
}