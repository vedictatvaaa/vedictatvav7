import type { ServiceLandingEntry, ServiceVertical } from "./types";
import { RUDRAKSHA_LANDINGS } from "./rudraksha";
import { GEMSTONE_LANDINGS } from "./gemstones";
import { PUJA_LANDINGS } from "./pujas";
import { ASTROLOGY_LANDINGS } from "./astrology-services";

export * from "./types";

export const SERVICE_LANDINGS_BY_VERTICAL: Record<ServiceVertical, ServiceLandingEntry[]> = {
  rudraksha: RUDRAKSHA_LANDINGS,
  gemstones: GEMSTONE_LANDINGS,
  puja: PUJA_LANDINGS,
  astrology: ASTROLOGY_LANDINGS,
  "pind-daan": [],
};

export const ALL_SERVICE_LANDINGS: ServiceLandingEntry[] = [
  ...RUDRAKSHA_LANDINGS,
  ...GEMSTONE_LANDINGS,
  ...PUJA_LANDINGS,
  ...ASTROLOGY_LANDINGS,
];

export function findEntry(vertical: ServiceVertical, slug: string): ServiceLandingEntry | undefined {
  return SERVICE_LANDINGS_BY_VERTICAL[vertical]?.find((e) => e.slug === slug);
}

export function findRelated(entry: ServiceLandingEntry): ServiceLandingEntry[] {
  if (!entry.relatedSlugs?.length) return [];
  const pool = SERVICE_LANDINGS_BY_VERTICAL[entry.vertical] || [];
  return entry.relatedSlugs
    .map((s) => pool.find((e) => e.slug === s))
    .filter((e): e is ServiceLandingEntry => !!e);
}
