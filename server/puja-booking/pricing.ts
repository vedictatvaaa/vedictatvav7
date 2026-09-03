import { canonicalBookingMode, type BookingMode } from "@shared/puja-booking";

export type RatePolicy = { minRate: number | null; maxRate: number | null; allowedBookingMode?: string | null; currency?: string | null; ratePolicyVersion?: number | null };
export type TravelBand = { id: number; minDistanceKm: number; maxDistanceKm: number; charge: number; currency?: string | null; requiresDistantConfirmation?: boolean | null };
export function modeAllowed(policy: RatePolicy, mode: BookingMode): boolean {
  const configured = policy.allowedBookingMode;
  if (configured === "both" || !configured) return true;
  return canonicalBookingMode(configured) === mode;
}
export function assertRateCompliant(price: number, policy: RatePolicy): void {
  if (!Number.isSafeInteger(price) || price < 0) throw new Error("Service price must be a non-negative whole number");
  if (policy.minRate != null && price < policy.minRate) throw new Error(`Service price must be at least ${policy.minRate}`);
  if (policy.maxRate != null && price > policy.maxRate) throw new Error(`Service price must not exceed ${policy.maxRate}`);
}
export function findTravelBand(distanceKm: number | null | undefined, bands: TravelBand[]): TravelBand | null {
  if (distanceKm == null || !Number.isFinite(distanceKm) || distanceKm < 0) return null;
  return bands.filter(b => b.minDistanceKm <= distanceKm && distanceKm <= b.maxDistanceKm)
    .sort((a, b) => a.maxDistanceKm - b.maxDistanceKm)[0] || null;
}
export function authoritativeBookingPrice(input: { baseAmount: number; mode: BookingMode; policy: RatePolicy; distanceKm?: number | null; travelBands?: TravelBand[]; samagriAmount?: number }): { baseAmount: number; samagriAmount: number; travelAmount: number | null; totalAmount: number | null; travelBandId: number | null; pricingPolicyVersion: number | null } {
  assertRateCompliant(input.baseAmount, input.policy);
  if (!modeAllowed(input.policy, input.mode)) throw new Error("This booking mode is not available for the selected service");
  const samagriAmount = input.samagriAmount || 0;
  if (!Number.isSafeInteger(samagriAmount) || samagriAmount < 0) throw new Error("Invalid samagri amount");
  const band = input.mode === "at_home" ? findTravelBand(input.distanceKm, input.travelBands || []) : null;
  const travelAmount = input.mode === "at_home" ? (band ? band.charge : null) : 0;
  return { baseAmount: input.baseAmount, samagriAmount, travelAmount, totalAmount: travelAmount == null ? null : input.baseAmount + samagriAmount + travelAmount, travelBandId: band?.id || null, pricingPolicyVersion: input.policy.ratePolicyVersion ?? null };
}