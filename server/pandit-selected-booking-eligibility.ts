export type SelectedOffering = { mode?: string | null; serviceAreas?: string[] | null };
export type AvailabilityRule = { weekday: number; startMinutes: number; endMinutes: number; mode: string; timezone?: string | null; isActive?: boolean; effectiveFrom?: Date | null; effectiveUntil?: Date | null };

function minutes(value: unknown) {
  const match = String(value || "").trim().match(/^([01]\d|2[0-3]):([0-5]\d)/);
  return match ? Number(match[1]) * 60 + Number(match[2]) : null;
}
function supports(service: SelectedOffering, mode: "online" | "in_person") {
  const value = String(service.mode || "").toLowerCase();
  return value === "hybrid" || value === mode || (mode === "online" && value === "virtual");
}

function localSlotInstant(date: string, slotMinutes: number, timezone: string) {
  try {
    const [year, month, day] = date.split("-").map(Number);
    const hour = Math.floor(slotMinutes / 60);
    const minute = slotMinutes % 60;
    const desired = Date.UTC(year, month - 1, day, hour, minute);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone: timezone, year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    });
    let instant = desired;
    for (let i = 0; i < 3; i += 1) {
      const parts = Object.fromEntries(formatter.formatToParts(new Date(instant))
        .filter(part => part.type !== "literal").map(part => [part.type, Number(part.value)]));
      const observed = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
      instant += desired - observed;
    }
    return new Date(instant);
  } catch {
    return null;
  }
}

/** Selected-offering gate; internal reasons are safe only for server/Admin diagnostics. */
export function evaluateSelectedBookingEligibility(input: {
  mode: "online" | "in_person"; offerings: SelectedOffering[]; addressCity?: string | null;
  date: string; timeSlot: string; rules: AvailabilityRule[]; now?: Date;
}) {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(input.date) ? new Date(`${input.date}T00:00:00Z`) : null;
  const slotMinutes = minutes(input.timeSlot);
  const now = input.now || new Date();
  const componentModes = input.offerings.length > 0 && input.offerings.every(s => supports(s, input.mode));
  const city = String(input.addressCity || "").trim().toLowerCase();
  const coverage = input.mode === "online" || (!!city && input.offerings.every(s =>
    (s.serviceAreas || []).some(area => String(area).trim().toLowerCase() === city)));
  const activeRules = input.rules.filter(rule => rule.isActive !== false);
  const available = !!date && slotMinutes != null && activeRules.some(rule => {
    const timezone = String(rule.timezone || "Asia/Kolkata");
    const slot = localSlotInstant(input.date, slotMinutes!, timezone);
    if (!slot || slot <= now) return false;
    const starts = rule.effectiveFrom ? new Date(rule.effectiveFrom) : null;
    const ends = rule.effectiveUntil ? new Date(rule.effectiveUntil) : null;
    return rule.weekday === date.getUTCDay() && supports({ mode: rule.mode }, input.mode)
      && slotMinutes! >= rule.startMinutes && slotMinutes! < rule.endMinutes
      && (!starts || slot >= starts)
      && (!ends || slot <= ends);
  });
  const checks = { selectedOfferingMode: componentModes, coverage, slot: available };
  return { checks, passed: Object.values(checks).every(Boolean) };
}