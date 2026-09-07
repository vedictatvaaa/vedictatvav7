type PublicPanditCandidate = {
  verified?: boolean | null;
  onLeave?: boolean | null;
  accountStatus?: string | null;
  suspendedUntil?: Date | null;
  locationReviewStatus?: string | null;
  stateId?: number | null;
  cityId?: number | null;
  directoryVisible?: boolean | null;
  searchEligible?: boolean | null;
  bookingEnabled?: boolean | null;
  indexingMode?: string | null;
  archived?: boolean | null;
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
  if (pandit.archived || pandit.accountStatus === "banned") return false;
  if (pandit.accountStatus === "suspended" && (!pandit.suspendedUntil || pandit.suspendedUntil.getTime() > Date.now())) return false;
  if (pandit.stateId == null || pandit.cityId == null || !activeStateIds.has(pandit.stateId)) return false;
  return activeCityById.get(pandit.cityId)?.stateId === pandit.stateId;
}

/** Applies explicit governance switches after the authoritative safety gate. */
export function effectivePanditGovernance(
  pandit: PublicPanditCandidate,
  activeStateIds: ReadonlySet<number>,
  activeCityById: ReadonlyMap<number, ActiveCity>,
) {
  const eligible = isPanditPubliclyEligible(pandit, activeStateIds, activeCityById);
  const directory = eligible && pandit.directoryVisible === true;
  const search = directory && pandit.searchEligible === true;
  const booking = eligible && pandit.bookingEnabled === true;
  return {
    directory, search, booking,
    indexable: directory && pandit.indexingMode !== "noindex",
    reasons: [
      ...(!eligible ? ["authoritative_ineligible"] : []),
      ...(pandit.directoryVisible !== true ? ["directory_disabled"] : []),
      ...(pandit.searchEligible !== true ? ["search_disabled"] : []),
      ...(pandit.bookingEnabled !== true ? ["booking_disabled"] : []),
      ...(pandit.indexingMode === "noindex" ? ["noindex"] : []),
    ],
  };
}