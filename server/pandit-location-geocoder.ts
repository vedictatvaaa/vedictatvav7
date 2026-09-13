import type {
  VerifiedCoordinateEvidence,
  VerifiedCoordinateResolver,
} from "./pandit-location-rectification";

type GeocoderResponse = {
  lat?: string; lon?: string; type?: string; address?: {
    country_code?: string; state?: string; city?: string; town?: string;
    municipality?: string; county?: string;
  };
};

const normalize = (value: unknown) => typeof value === "string"
  ? value.trim().toLocaleLowerCase("en-IN").replace(/\s+/g, " ") : "";

export function isVerifiedCityGeocoderAvailable() {
  return typeof fetch === "function";
}

/**
 * Nominatim is used only for canonical city centroids. This adapter never
 * accepts a Pandit street address and never returns model-derived locations.
 * Callers must opt in explicitly because this performs external requests.
 */
export function createVerifiedCityGeocoder(options: {
  fetchImpl?: typeof fetch;
  endpoint?: string;
  timeoutMs?: number;
  minIntervalMs?: number;
  cacheTtlMs?: number;
  now?: () => number;
  userAgent?: string;
} = {}): VerifiedCoordinateResolver {
  const fetchImpl = options.fetchImpl || fetch;
  const endpoint = options.endpoint || "https://nominatim.openstreetmap.org/search";
  const timeoutMs = options.timeoutMs ?? 5_000;
  const minIntervalMs = options.minIntervalMs ?? 1_100;
  const cacheTtlMs = options.cacheTtlMs ?? 24 * 60 * 60 * 1000;
  const now = options.now || (() => Date.now());
  const cache = new Map<string, { expiresAt: number; value: VerifiedCoordinateEvidence | null }>();
  let lastRequestAt = 0;
  let queue: Promise<void> = Promise.resolve();

  const waitTurn = async () => {
    let release!: () => void;
    const previous = queue;
    queue = new Promise<void>(resolve => { release = resolve; });
    await previous;
    const delay = Math.max(0, minIntervalMs - (now() - lastRequestAt));
    if (delay) await new Promise(resolve => setTimeout(resolve, delay));
    lastRequestAt = now();
    release();
  };

  return async (candidate) => {
    const key = `${normalize(candidate.state)}|${normalize(candidate.city)}`;
    const cached = cache.get(key);
    if (cached && cached.expiresAt > now()) return cached.value;
    const query = `${candidate.city}, ${candidate.state}, India`;
    let value: VerifiedCoordinateEvidence | null = null;
    try {
      await waitTurn();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);
      const url = `${endpoint}?format=json&limit=3&addressdetails=1&q=${encodeURIComponent(query)}`;
      const response = await fetchImpl(url, {
        headers: { "User-Agent": options.userAgent || "VedicTatva-pandit-location-audit/1.0" },
        signal: controller.signal,
      });
      clearTimeout(timer);
      if (!response.ok) throw new Error(`geocoder_http_${response.status}`);
      const rows = await response.json() as GeocoderResponse[];
      const match = rows.find(row => {
        const address = row.address || {};
        const addressCity = address.city || address.town || address.municipality;
        return normalize(address.country_code) === "in"
          && normalize(addressCity) === normalize(candidate.city)
          && normalize(address.state) === normalize(candidate.state);
      });
      const latitude = Number(match?.lat), longitude = Number(match?.lon);
      if (match && Number.isFinite(latitude) && latitude >= -90 && latitude <= 90
        && Number.isFinite(longitude) && longitude >= -180 && longitude <= 180) {
        value = {
          latitude, longitude, source: "nominatim:city-identity",
          confidence: 0.95, verified: true, scope: "city_centroid", verifiedAt: new Date(now()),
        };
      }
    } catch {
      value = null;
    }
    cache.set(key, { expiresAt: now() + cacheTtlMs, value });
    return value;
  };
}