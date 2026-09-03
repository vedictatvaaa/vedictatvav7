import { canonicalBookingMode } from "@shared/puja-booking";

type Booking = Record<string, any>;
type Pandit = Record<string, any> | null | undefined;
const privateBookingKeys = new Set([
  "contactPhone", "contactEmail", "location", "addressHouse", "addressStreet",
  "addressLandmark", "customerLatitude", "customerLongitude", "accessToken",
  "pricingSnapshot", "contactReleasedAt",
]);
function omit(source: Booking, hidden: Set<string>) {
  return Object.fromEntries(Object.entries(source).filter(([key]) => !hidden.has(key)));
}
export function candidatePanditBookingProjection(booking: Booking) {
  const safe = omit(booking, privateBookingKeys);
  return {
    ...safe,
    mode: canonicalBookingMode(booking.mode),
    approximateArea: [booking.addressLocality, booking.addressCity].filter(Boolean).join(", ") || null,
    contactName: booking.contactName ? String(booking.contactName).split(/\s+/)[0] : null,
  };
}
export function assignedPanditBookingProjection(booking: Booking, panditId: number) {
  if (booking.panditId !== panditId || !booking.contactReleasedAt) return candidatePanditBookingProjection(booking);
  return { ...omit(booking, new Set(["accessToken"])), mode: canonicalBookingMode(booking.mode) };
}
export function customerBookingProjection(booking: Booking, pandit?: Pandit) {
  const safe = omit(booking, new Set(["accessToken", "contactReleasedAt"]));
  const accepted = Boolean(booking.contactReleasedAt) && ["accepted", "confirmed", "in_progress", "completed"].includes(booking.status);
  return {
    ...safe, mode: canonicalBookingMode(booking.mode),
    assignedPandit: accepted && pandit?.verified ? { id: pandit.id, name: pandit.name, phone: pandit.phone || null, email: pandit.email || null } : null,
  };
}
export function accessTokenBookingProjection(booking: Booking) {
  return omit(customerBookingProjection(booking), new Set(["userId", "contactPhone", "contactEmail", "addressHouse", "addressStreet", "addressLandmark", "customerLatitude", "customerLongitude"]));
}