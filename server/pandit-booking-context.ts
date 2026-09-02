export type CanonicalBookingContext = {
  masterServiceId?: unknown;
  cityId?: unknown;
  stateId?: unknown;
};

function positiveInteger(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  return Number.isInteger(number) && number > 0 ? number : null;
}

/** Validates URL context as a claim, never as an authority for an offering. */
export function validateCanonicalServiceBookingContext(
  context: CanonicalBookingContext,
  authoritative: { masterServiceId: number; cityId?: number | null; stateId?: number | null },
): string | null {
  const masterServiceId = positiveInteger(context.masterServiceId);
  const cityId = positiveInteger(context.cityId);
  const stateId = positiveInteger(context.stateId);
  if (!masterServiceId || !cityId || !stateId) {
    return "Canonical master service, city, and state context is required for this service booking";
  }
  if (masterServiceId !== authoritative.masterServiceId) {
    return "The selected service does not match the canonical service context";
  }
  if (cityId !== authoritative.cityId || stateId !== authoritative.stateId) {
    return "The selected Pandit does not match the canonical location context";
  }
  return null;
}