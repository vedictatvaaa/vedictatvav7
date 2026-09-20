import { createStructuredCompletion, isAiProviderConfigured } from "./ai-provider";

export type CoordinateSuggestion = {
  label: string;
  latitude: number;
  longitude: number;
  source: "nominatim:address" | "ai_fallback";
  confidence: number;
  scope: "address" | "approximate";
  placeId?: string;
  reason?: string;
};

const normalize = (value: unknown) => typeof value === "string"
  ? value.trim().toLocaleLowerCase("en-IN").replace(/\s+/g, " ")
  : "";

const validIndiaCoordinate = (latitude: number, longitude: number) =>
  Number.isFinite(latitude) && latitude >= 6 && latitude <= 38
  && Number.isFinite(longitude) && longitude >= 68 && longitude <= 98;

export async function findVerifiedAddressCoordinate(input: {
  state?: string;
  city?: string;
  query: string;
  fetchImpl?: typeof fetch;
  endpoint?: string;
}): Promise<CoordinateSuggestion | null> {
  const fetchImpl = input.fetchImpl || fetch;
  const search = [input.query.trim(), input.city?.trim(), input.state?.trim(), "India"].filter(Boolean).join(", ");
  const url = new URL(input.endpoint || "https://nominatim.openstreetmap.org/search");
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("countrycodes", "in");
  url.searchParams.set("limit", "5");
  url.searchParams.set("q", search);

  const response = await fetchImpl(url, {
    headers: { "User-Agent": "VedicTatva/1.0 (pandit location verification)" },
    signal: AbortSignal.timeout(5_000),
  });
  if (!response.ok) throw new Error(`address provider returned ${response.status}`);
  const results = await response.json() as Array<{
    place_id?: number;
    display_name?: string;
    lat?: string;
    lon?: string;
    address?: { country_code?: string; state?: string; city?: string; town?: string; municipality?: string };
  }>;
  const wantedState = normalize(input.state);
  const wantedCity = normalize(input.city);
  const match = results.find((row) => {
    const address = row.address || {};
    const rowState = normalize(address.state);
    const rowCity = normalize(address.city || address.town || address.municipality);
    return normalize(address.country_code) === "in"
      && (!wantedState || rowState.includes(wantedState) || wantedState.includes(rowState))
      && (!wantedCity || rowCity === wantedCity || rowCity.includes(wantedCity) || wantedCity.includes(rowCity));
  });
  const latitude = Number(match?.lat);
  const longitude = Number(match?.lon);
  if (!match?.display_name || !validIndiaCoordinate(latitude, longitude)) return null;
  return {
    label: String(match.display_name).slice(0, 300),
    latitude,
    longitude,
    source: "nominatim:address",
    confidence: 0.92,
    scope: "address",
    placeId: match.place_id != null ? String(match.place_id) : undefined,
  };
}

export async function findAiCoordinateSuggestion(input: {
  state?: string;
  city?: string;
  query: string;
}): Promise<CoordinateSuggestion | null> {
  if (!isAiProviderConfigured()) return null;
  const parsed = await createStructuredCompletion({
    task: "pandit_admin_location_coordinate_fallback",
    timeoutMs: 8_000,
    maxTokens: 220,
    schemaName: "pandit_admin_location_coordinate_fallback",
    system: "Suggest only an approximate location for an Admin reviewing a Pandit registration. Never use or infer a person's identity, contact information, credentials, or private facts. Return a place label, coordinates within India, confidence, and a short reason. This is a draft for explicit human confirmation, not a verified address.",
    user: {
      state: input.state?.trim() || null,
      city: input.city?.trim() || null,
      location: input.query.trim(),
    },
    schema: {
      type: "object",
      additionalProperties: false,
      properties: {
        label: { type: "string", minLength: 1, maxLength: 300 },
        latitude: { type: "number", minimum: 6, maximum: 38 },
        longitude: { type: "number", minimum: 68, maximum: 98 },
        confidence: { type: "number", minimum: 0, maximum: 1 },
        reason: { type: "string", maxLength: 300 },
      },
      required: ["label", "latitude", "longitude", "confidence", "reason"],
    },
  }) as any;
  const latitude = Number(parsed?.latitude);
  const longitude = Number(parsed?.longitude);
  const label = typeof parsed?.label === "string" ? parsed.label.trim().slice(0, 300) : "";
  const city = normalize(input.city);
  if (!label || !validIndiaCoordinate(latitude, longitude)
    || !Number.isFinite(parsed?.confidence)
    || (city && !normalize(label).includes(city))) return null;
  return {
    label,
    latitude,
    longitude,
    source: "ai_fallback",
    confidence: Math.min(0.89, Math.max(0, Number(parsed.confidence))),
    scope: "approximate",
    reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 300) : undefined,
  };
}