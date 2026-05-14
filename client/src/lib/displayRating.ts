function hash(seed: string): number {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  return h >>> 0;
}

export interface DisplayRating {
  avg: number;
  count: number;
  realCount: number;
}

export function getDisplayRating(
  productId: number | string,
  real?: { avg: number; count: number } | null,
): DisplayRating {
  const seed = String(productId);
  const baseline = 338 + (hash(seed + ":count") % 463);
  const avgSeed = (hash(seed + ":avg") % 6) / 10;
  const baselineAvg = 4.4 + avgSeed;

  const realCount = real?.count ?? 0;
  if (realCount > 0 && real) {
    const totalCount = baseline + realCount;
    const blendedAvg =
      (baselineAvg * baseline + real.avg * realCount) / totalCount;
    return {
      avg: Math.round(blendedAvg * 10) / 10,
      count: totalCount,
      realCount,
    };
  }

  return {
    avg: Math.round(baselineAvg * 10) / 10,
    count: baseline,
    realCount: 0,
  };
}
