type PublicPanditCandidate = {
  verified?: boolean | null;
  onLeave?: boolean | null;
  locationReviewStatus?: string | null;
  stateId?: number | null;
  cityId?: number | null;
};

type ActiveCity = {
  id: number;
  stateId: number;
};

export function isPanditPubliclyEligible(
  pandit: PublicPanditCandidate,
  activeStateIds: ReadonlySet<number>,
  activeCityById: ReadonlyMap<number, ActiveCity>,
) {
  if (!pandit.verified || pandit.onLeave || pandit.locationReviewStatus !== "resolved") return false;
  if (pandit.stateId == null || pandit.cityId == null || !activeStateIds.has(pandit.stateId)) return false;
  return activeCityById.get(pandit.cityId)?.stateId === pandit.stateId;
}