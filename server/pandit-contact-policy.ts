export const PANDIT_CONTACT_ALLOWANCE = 10;

export type GlobalContactMode = "open" | "login_required" | "disabled";
export type ContactOverride = "use_global" | "always_open" | "login_required" | "never_display";

export function effectivePanditContactPolicy(globalMode: unknown, override: unknown): GlobalContactMode {
  const global: GlobalContactMode = ["open", "login_required", "disabled"].includes(String(globalMode))
    ? String(globalMode) as GlobalContactMode : "login_required";
  switch (override) {
    case "always_open": return "open";
    case "login_required": return "login_required";
    case "never_display": return "disabled";
    default: return global;
  }
}

export function contactQuotaMetadata(used: number, earliestRevealAt?: Date | null, now = new Date()) {
  const safeUsed = Math.max(0, Math.floor(used));
  const resetsAt = earliestRevealAt ? new Date(earliestRevealAt) : null;
  if (resetsAt) resetsAt.setFullYear(resetsAt.getFullYear() + 1);
  return {
    used: safeUsed,
    remaining: Math.max(0, PANDIT_CONTACT_ALLOWANCE - safeUsed),
    resetsAt: resetsAt && resetsAt > now ? resetsAt.toISOString() : null,
  };
}