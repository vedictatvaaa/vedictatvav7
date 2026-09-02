type Service = { canonicalUrl: string | null; service: { slug: string; name: string } };
type City = { canonicalUrl: string | null; city: { slug: string }; services: Service[] };
type Projection = { cities: City[] };

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
  const city = projection.cities.find((item) => item.city.slug === citySlug);
  if (!city?.canonicalUrl) return null;
  if (!serviceSlug) return family === "legacy" ? city.canonicalUrl : null;
  const exact = city.services.find((service) => service.service.slug === serviceSlug && service.canonicalUrl);
  if (exact) return family === "legacy" ? exact.canonicalUrl : null;
  const mapped = LEGACY_SERVICE_SLUGS[serviceSlug] || [];
  const target = city.services.find((service) =>
    (mapped.includes(service.service.slug)
      || normaliseServiceName(service.service.name) === LEGACY_SERVICE_NAMES[serviceSlug])
    && service.canonicalUrl,
  );
  return target?.canonicalUrl || city.canonicalUrl;
}

export function redirectTargetWithQuery(path: string, originalUrl: string) {
  const queryIndex = originalUrl.indexOf("?");
  return `${path}${queryIndex >= 0 ? originalUrl.slice(queryIndex) : ""}`;
}