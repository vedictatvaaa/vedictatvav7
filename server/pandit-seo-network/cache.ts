import {
  resolvePanditSeoNetworkProjection,
  type PanditSeoNetworkDependencies,
} from "./resolver";
import type { PanditSeoNetworkProjection } from "./project";

export const PANDIT_SEO_NETWORK_CACHE_TTL_MS = 30_000;

let cached: { value: PanditSeoNetworkProjection; expiresAt: number } | null = null;
let inFlight: Promise<PanditSeoNetworkProjection> | null = null;
let generation = 0;

export function invalidatePanditSeoNetworkCache() {
  generation += 1;
  cached = null;
  inFlight = null;
}

export async function getPanditSeoNetworkProjection(
  options: {
    now?: number;
    dependencies?: PanditSeoNetworkDependencies;
  } = {},
) {
  const now = options.now ?? Date.now();
  if (cached && cached.expiresAt > now) return cached.value;
  if (inFlight) return inFlight;

  const requestGeneration = generation;
  const resolving = resolvePanditSeoNetworkProjection(options.dependencies)
    .then((value) => {
      if (requestGeneration === generation) {
        cached = { value, expiresAt: now + PANDIT_SEO_NETWORK_CACHE_TTL_MS };
      }
      return value;
    })
    .finally(() => {
      if (inFlight === resolving) inFlight = null;
    });
  inFlight = resolving;
  return resolving;
}