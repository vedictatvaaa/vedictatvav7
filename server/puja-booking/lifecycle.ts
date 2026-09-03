import type { BookingLifecycle } from "@shared/puja-booking";
const next: Record<BookingLifecycle, BookingLifecycle[]> = {
  requested: ["offered", "cancelled", "expired"], offered: ["accepted", "declined", "cancelled", "expired", "reassignment_required"],
  accepted: ["confirmed", "cancelled", "reassignment_required"], confirmed: ["in_progress", "cancelled", "reassignment_required"],
  in_progress: ["completed", "cancelled"], completed: [], declined: ["reassignment_required"], cancelled: [], reassignment_required: ["offered", "cancelled", "expired"], expired: [],
};
export function canTransition(from: BookingLifecycle, to: BookingLifecycle) { return next[from].includes(to); }
export function contactMayBeReleased(status: string) { return ["accepted", "confirmed", "in_progress", "completed"].includes(status); }
export function isTerminalBookingStatus(status: string) { return ["completed", "cancelled", "expired"].includes(status); }