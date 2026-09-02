export type PublicDestination = {
  slug: string; name: string; nameHindi?: string | null; state?: string | null;
  deity?: string | null; category?: string | null; shortDescription?: string | null;
  description?: string | null; heroMediaUrl?: string | null; latitude?: number | null; longitude?: number | null;
};
export type CompatibilityItem = { sourceKey: string; destination: PublicDestination };

/** Preserve nested/static guide data; canonical API may replace only known scalar display fields. */
export function mergeDestinationScalars<T extends Record<string, any>>(legacy: T, destination?: PublicDestination): T {
  if (!destination) return legacy;
  // Legacy slug remains the route identity until explicit client-route aliases
  // are introduced; replacing it would break static detail route lookup.
  const allowed = ["name", "nameHindi", "state", "deity", "category", "shortDescription", "description", "heroMediaUrl"];
  const patch: Record<string, unknown> = {};
  for (const key of allowed) if (destination[key as keyof PublicDestination] !== undefined && destination[key as keyof PublicDestination] !== null) patch[key] = destination[key as keyof PublicDestination];
  // Temple Tourism's static contract uses short coordinate names. Do not
  // introduce latitude/longitude keys into a legacy record.
  if (destination.latitude !== undefined && destination.latitude !== null && "lat" in legacy) patch.lat = destination.latitude;
  if (destination.longitude !== undefined && destination.longitude !== null && "lng" in legacy) patch.lng = destination.longitude;
  return { ...legacy, ...patch };
}
export function mergeCompatibility<T extends Record<string, any>>(legacy: readonly T[], items: readonly CompatibilityItem[] | undefined, key: (row: T) => string): T[] {
  if (!items?.length) return [...legacy];
  const mapped = new Map(items.map((item) => [item.sourceKey, item.destination]));
  return legacy.map((row) => mergeDestinationScalars(row, mapped.get(key(row))));
}