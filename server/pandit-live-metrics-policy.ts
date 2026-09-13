/**
 * The public metrics contract deliberately uses an allow-list for booking
 * statuses.  The puja_bookings table has no test/deleted flags, so accepting
 * only statuses used by the booking lifecycle is safer than trying to infer
 * whether a row is genuine from contact fields.
 */
export const QUALIFYING_BOOKING_STATUSES = [
  "pending",
  "requested",
  "assigned",
  "offered",
  "accepted",
  "confirmed",
  "in_progress",
  "completed",
] as const;

export const ACTIVE_BOOKING_STATUSES = [
  "pending",
  "requested",
  "assigned",
  "offered",
  "accepted",
  "confirmed",
  "in_progress",
] as const;

export const EXCLUDED_BOOKING_STATUSES = [
  "cancelled",
  "declined",
  "rejected",
  "expired",
  "deleted",
  "test",
] as const;

/** The Pandit schema's complete account-status vocabulary. */
export const ENROLLED_ACCOUNT_STATUSES = ["active", "suspended", "banned"] as const;

export type QualifyingBookingStatus = typeof QUALIFYING_BOOKING_STATUSES[number];

export type MetricValue = {
  value: number | null;
  state: "available" | "unavailable";
  /** Mirrors state for consumers that model metric health separately. */
  health: "available" | "unavailable";
  /** Presence is process-local; it must never be presented as a global count. */
  scope?: "global" | "this_instance";
  reason?: string;
};

export type PanditLiveMetrics = {
  health: "available" | "unavailable";
  updatedAt: string | null;
  metrics: {
    servingNow: MetricValue;
    servedLast24h: MetricValue;
    pujasBooked: MetricValue;
    totalEnrolledPandits: MetricValue;
    discoverablePandits: MetricValue;
    availableToBook: MetricValue;
    onlineNow: MetricValue;
  };
  definitions: {
    servingNow: string;
    servedLast24h: string;
    pujasBooked: string;
    totalEnrolledPandits: string;
    discoverablePandits: string;
    availableToBook: string;
    onlineNow: string;
  };
};

export const METRIC_DEFINITIONS: PanditLiveMetrics["definitions"] = {
  servingNow: "Distinct registered devotees on Puja bookings whose lifecycle status is in_progress.",
  servedLast24h: "Distinct registered devotees on qualifying active or completed Puja bookings in the rolling previous 24 hours.",
  pujasBooked: "Qualifying Puja booking rows in the booking lifecycle; cancelled, declined, rejected, expired, deleted, test, and unknown statuses are excluded.",
  totalEnrolledPandits: "All non-archived Pandit records with the schema's accountStatus active, suspended, or banned (unverified and inactive are included); unknown/test/deleted status values are excluded defensively because the schema has no separate test/deleted flag. Enrollment does not imply verification, publication, discoverability, availability, or online presence.",
  discoverablePandits: "Pandits passing the public directory safety and governance policy with an active canonical State and City.",
  availableToBook: "Published, verified Pandits passing the shared general booking eligibility policy, including an active Puja service with coverage and profile availability.",
  onlineNow: "This server instance's discoverable Pandits with a heartbeat inside the existing five-minute presence window; not a universal multi-instance count.",
};

export function isQualifyingBooking(status: string | null | undefined): status is QualifyingBookingStatus {
  return (QUALIFYING_BOOKING_STATUSES as readonly string[]).includes(status || "");
}

export function isLegitimateEnrolledPandit(record: { archived?: boolean | null; accountStatus?: string | null }): boolean {
  return record.archived === false
    && (ENROLLED_ACCOUNT_STATUSES as readonly string[]).includes(record.accountStatus || "");
}

export function metric(value: number, scope: "global" | "this_instance" = "global"): MetricValue {
  return { value: Math.max(0, Math.trunc(value)), state: "available", health: "available", scope };
}

export function unavailableMetric(reason: string): MetricValue {
  return { value: null, state: "unavailable", health: "unavailable", reason };
}

export function unavailablePanditLiveMetrics(reason: string): PanditLiveMetrics {
  const unavailable = unavailableMetric(reason);
  return {
    health: "unavailable",
    updatedAt: null,
    metrics: {
      servingNow: unavailable,
      servedLast24h: unavailable,
      pujasBooked: unavailable,
      totalEnrolledPandits: unavailable,
      discoverablePandits: unavailable,
      availableToBook: unavailable,
      onlineNow: unavailable,
    },
    definitions: METRIC_DEFINITIONS,
  };
}