export type DashboardState = "available" | "empty" | "unavailable";

export type StorefrontPublication = {
  status?: string | null;
  isPublished?: boolean | null;
};

/**
 * The booking engine stores appointment dates as YYYY-MM-DD without a time
 * zone. Treat those values as India business dates everywhere in the Home
 * summary rather than mixing the server's local time zone into the result.
 */
export function indiaDateKey(now = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const value = (type: string) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
}

export function indiaDayBounds(dateKey: string): { start: Date; end: Date } {
  // dateKey originates from indiaDateKey, not an untrusted route parameter.
  const start = new Date(`${dateKey}T00:00:00.000+05:30`);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

export function isPendingBookingStatus(status: string | null | undefined): boolean {
  return ["pending", "requested", "assigned"].includes((status || "").toLowerCase());
}

// Operational appointments scheduled for today. Cancelled and declined
// bookings are deliberately excluded, while the booking workflow's pending
// transitional states remain visible to the Pandit.
export const operationalTodayBookingStatuses = ["pending", "requested", "assigned", "accepted", "completed"] as const;

export function storefrontPublicationState(storefront: StorefrontPublication | null): "published" | "draft" | "pending_review" | "suspended" | "unavailable" {
  if (!storefront) return "unavailable";
  const status = (storefront.status || "published").toLowerCase();
  if (status === "suspended") return "suspended";
  if (status === "pending_review") return "pending_review";
  if (status === "draft") return "draft";
  return storefront.isPublished ? "published" : "draft";
}

export function storefrontPublicPath(slug: string | null | undefined, storefront: StorefrontPublication | null): string | null {
  return slug && storefrontPublicationState(storefront) === "published"
    ? `/p/${encodeURIComponent(slug)}`
    : null;
}

export function buildChecklistStates(input: {
  hasProfile: boolean;
  activeServiceCount: number;
  hasAvailability: boolean;
}): Record<"profile" | "services" | "gallery" | "availability" | "googleBusiness", DashboardState> {
  return {
    profile: input.hasProfile ? "available" : "empty",
    services: input.activeServiceCount > 0 ? "available" : "empty",
    // There is no Pandit gallery data model yet. Do not call a missing model
    // empty, as that would imply the Pandit can add data through this product.
    gallery: "unavailable",
    availability: input.hasAvailability ? "available" : "empty",
    // No per-Pandit Google Business integration is configured in this system.
    googleBusiness: "unavailable",
  };
}

export function dashboardIdentity(pandit: {
  id: number;
  name: string;
  city?: string | null;
  experience?: number | null;
  image?: string | null;
  verified?: boolean | null;
}) {
  return {
    id: pandit.id,
    name: pandit.name,
    city: pandit.city || null,
    experience: typeof pandit.experience === "number" ? pandit.experience : null,
    image: pandit.image || null,
    verification: pandit.verified ? "verified" : "unverified",
    // The current system has no separate approval field; verification is the
    // server-authoritative public-eligibility approval signal.
    approval: pandit.verified ? "approved" : "pending",
  };
}