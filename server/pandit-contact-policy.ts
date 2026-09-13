export const PANDIT_CONTACT_ALLOWANCE = 3;
export const PANDIT_CONTACT_WINDOW_DAYS = 30;
export const DEFAULT_PANDIT_CONTACT_UNLOCK_PRICE_PAISE = 1000;

export type GlobalContactMode = "open" | "login_required" | "disabled";
export type ContactOverride = "use_global" | "always_open" | "login_required" | "never_display";

export function effectivePanditContactPolicy(globalMode: unknown, override: unknown): GlobalContactMode {
  const global: GlobalContactMode = ["open", "login_required", "disabled"].includes(String(globalMode))
    ? String(globalMode) as GlobalContactMode : "login_required";
  // A global shutdown is a hard safety ceiling, not a default that a
  // storefront-level preference can bypass.
  if (global === "disabled") return "disabled";
  switch (override) {
    // Contact access is always protected by a registered customer session.
    // Keep the historical override value for admin compatibility, but never
    // let it turn a public storefront into a contact disclosure boundary.
    case "always_open": return "login_required";
    case "login_required": return "login_required";
    case "never_display": return "disabled";
    // The feature's contact boundary is registration-protected regardless of
    // the legacy global "open" value.
    default: return global === "disabled" ? "disabled" : "login_required";
  }
}

export function contactQuotaMetadata(used: number, earliestRevealAt?: Date | null, now = new Date()) {
  const safeUsed = Math.max(0, Math.floor(used));
  const resetsAt = earliestRevealAt ? new Date(earliestRevealAt) : null;
  if (resetsAt) resetsAt.setDate(resetsAt.getDate() + PANDIT_CONTACT_WINDOW_DAYS);
  return {
    used: safeUsed,
    remaining: Math.max(0, PANDIT_CONTACT_ALLOWANCE - safeUsed),
    resetsAt: resetsAt && resetsAt > now ? resetsAt.toISOString() : null,
  };
}