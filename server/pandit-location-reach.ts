export type CanonicalCitySelection = {
  cityId: number;
  stateId: number;
};

export type PanditLocationIdentity = {
  cityId: number | null;
  stateId: number | null;
};

/**
 * Applies paid-tier reach to a canonical city selection without consulting
 * legacy city/state strings. Guru Elite is national, Gold is state-wide, and
 * Silver/Free remain scoped to the exact selected city.
 */
export function matchesCanonicalCityReach(
  tier: string,
  pandit: PanditLocationIdentity,
  selection: CanonicalCitySelection,
): boolean {
  if (tier === "guru_elite") return true;
  if (tier === "gold") return pandit.stateId === selection.stateId;
  return pandit.cityId === selection.cityId;
}