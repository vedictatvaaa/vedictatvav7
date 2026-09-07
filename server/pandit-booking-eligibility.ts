export type BookingEligibilityService = {
  mode?: string | null;
  serviceAreas?: string[] | null;
};

export type BookingEligibilityCandidate = {
  accountStatus?: string | null;
  onLeave?: boolean | null;
  archived?: boolean | null;
  verified?: boolean | null;
  directoryVisible?: boolean | null;
  bookingEnabled?: boolean | null;
  availability?: string | null;
};

/**
 * The shared general booking gate. Selected service/package ownership, mode,
 * rate and catalogue context are validated separately before booking creation.
 */
export function evaluatePanditBookingEligibility(
  pandit: BookingEligibilityCandidate,
  input: {
    published: boolean;
    canonicalLocation: boolean;
    services: BookingEligibilityService[];
    pujaSupported: boolean;
  },
) {
  const active = pandit.accountStatus === "active" && !pandit.onLeave && !pandit.archived;
  const verified = pandit.verified === true;
  const directoryPublished = input.published && pandit.directoryVisible === true && input.canonicalLocation && verified;
  const serviceApproved = input.services.length > 0;
  const serviceAreaApproved = input.services.some(service => {
    const mode = String(service.mode || "").toLowerCase();
    return ["online", "virtual", "hybrid", "both"].includes(mode) || (service.serviceAreas || []).length > 0;
  });
  const availability = String(pandit.availability || "").toLowerCase() === "available" && !pandit.onLeave;
  const entries: Array<[string, boolean, string]> = [
    ["active", active, active ? "Account is active." : "Account is not active, is on leave, or is archived."],
    ["verified", verified, verified ? "Verification is active." : "Pandit is not verified."],
    ["directoryPublished", directoryPublished, directoryPublished ? "Published storefront and directory requirements are met." : "Requires published storefront, directory visibility, verification, and a valid canonical location."],
    ["bookingEnabled", pandit.bookingEnabled === true, pandit.bookingEnabled ? "Booking switch is enabled." : "Booking switch is disabled."],
    ["serviceApproved", serviceApproved, serviceApproved ? "At least one active assignment uses an active master service." : "No active assignment to an active master service."],
    ["serviceAreaApproved", serviceAreaApproved, serviceAreaApproved ? "Service coverage is configured (or service supports online/virtual delivery)." : "No configured service area on an eligible service; online/virtual service also qualifies."],
    ["pujaSupported", input.pujaSupported, input.pujaSupported ? "The selected/general Puja has an active master-service assignment." : "No active master-service assignment supports this Puja."],
    ["availability", availability, availability ? "Profile availability is available." : "Profile availability is not available or Pandit is on leave."],
  ];
  const checks = Object.fromEntries(entries.map(([key, passed, reason]) => [
    key,
    { passed, label: key.replace(/([A-Z])/g, " $1").toUpperCase(), reason },
  ]));
  const exclusions = entries.filter(([, passed]) => !passed).map(([key, , reason]) => `${key}: ${reason}`);
  return {
    checks,
    result: {
      passed: exclusions.length === 0,
      label: "RESULT",
      reason: exclusions.length ? exclusions.join(" ") : "All general booking eligibility checks passed.",
    },
    exclusions,
  };
}