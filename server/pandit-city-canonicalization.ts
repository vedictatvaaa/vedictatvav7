type Service = { canonicalUrl: string | null; service: { slug: string; name: string } };
type City = {
  canonicalUrl: string | null;
  city: { slug: string; name?: string; aliases?: string[] | null };
  state?: { name?: string; code?: string };
  services: Service[];
};
type Projection = { cities: City[] };

const cleanSlug = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const canonicalCityPath = (city: City) => city.state?.name && city.city.name
  ? `/book-pandit-online/${encodeURIComponent(cleanSlug(city.state.name))}/${encodeURIComponent(cleanSlug(city.city.name))}`
  : city.canonicalUrl;

const LEGACY_SERVICE_SLUGS: Record<string, string[]> = {
  "satyanarayan-puja": ["satyanarayan-puja", "satyanarayan"],
  "satyanarayan-katha": ["satyanarayan-katha", "satyanarayan"],
  "griha-pravesh": ["griha-pravesh", "grihapravesh"],
  rudrabhishek: ["rudrabhishek"],
  "mahamrityunjay-jaap": ["mahamrityunjay-jaap", "mahamrityunjay"],
  "navgraha-shanti": ["navgraha-shanti-puja", "navgraha"],
  "navagraha-homam": ["navagraha-homam", "navgraha"],
  "ganesh-puja": ["ganesh-puja", "ganesh"],
  "pitru-paksha-shradh": ["pitru-paksha-shradh"],
  tarpan: ["tarpan"],
};
const LEGACY_SERVICE_NAMES: Record<string, string> = {
  "satyanarayan-puja": "satyanarayan",
  "satyanarayan-katha": "satyanarayan katha",
  "griha-pravesh": "griha pravesh",
  rudrabhishek: "rudrabhishek",
  "mahamrityunjay-jaap": "mahamrityunjay jaap",
  "navgraha-shanti": "navgraha shanti",
  "navagraha-homam": "navagraha homam",
  "ganesh-puja": "ganesh puja",
  "pitru-paksha-shradh": "pitru paksha shradh",
  tarpan: "tarpan",
};
const normaliseServiceName = (value: string) => value.trim().toLocaleLowerCase("en-IN").replace(/\s+puja$/, "");

/** Returns null only when an already-canonical exact service URL must pass through. */
export function resolvePanditCityCanonicalization(
  projection: Projection,
  family: "canonical" | "legacy",
  citySlug: string,
  serviceSlug?: string,
): string | null {
  const wanted = cleanSlug(citySlug);
  // A two-segment hierarchy route is handled by the canonical location
  // projection, not this legacy city/service compatibility resolver.
  if (projection.cities.some((item) =>
    item.state?.name && cleanSlug(item.state.name) === wanted,
  )) return null;
  const city = projection.cities.find((item) => [
    item.city.slug,
    item.city.name,
    ...(item.city.aliases || []),
  ].filter((value): value is string => Boolean(value)).map(cleanSlug).includes(wanted));
  if (!city?.canonicalUrl) return null;
  const canonical = canonicalCityPath(city);
  if (!canonical) return null;
  if (!serviceSlug) return family === "legacy" ? canonical : null;
  const exact = city.services.find((service) => service.service.slug === serviceSlug && service.canonicalUrl);
  // Location pages no longer have a flat city/service canonical. All legacy
  // service URLs consolidate into the state/city page.
  if (exact) return canonical;
  const mapped = LEGACY_SERVICE_SLUGS[serviceSlug] || [];
  const target = city.services.find((service) =>
    (mapped.includes(service.service.slug)
      || normaliseServiceName(service.service.name) === LEGACY_SERVICE_NAMES[serviceSlug])
    && service.canonicalUrl,
  );
  return canonical;
}

export function redirectTargetWithQuery(path: string, originalUrl: string) {
  const queryIndex = originalUrl.indexOf("?");
  return `${path}${queryIndex >= 0 ? originalUrl.slice(queryIndex) : ""}`;
}