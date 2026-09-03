const PUJA_TYPE_BY_SERVICE: Record<string, string> = {
  "satyanarayan": "satyanarayan",
  "satyanarayan katha": "satyanarayan",
  "griha pravesh": "grihapravesh",
  "rudrabhishek": "rudrabhishek",
  "mahamrityunjay jaap": "mahamrityunjay",
  "navgraha shanti": "navgraha",
  "navagraha homam": "navgraha",
  "ganesh puja": "ganesh",
  "pitru paksha shradh": "pind-daan-yearly-remote",
  "tarpan": "pind-daan-yearly-remote",
};

const DISCOVERY_SERVICE_BY_PUJA_SLUG: Record<string, string> = {
  "satyanarayan-puja": "Satyanarayan",
  "satyanarayan-katha": "Satyanarayan Katha",
  "griha-pravesh": "Griha Pravesh",
  "rudrabhishek": "Rudrabhishek",
  "mahamrityunjay-jaap": "Mahamrityunjay Jaap",
  "navgraha-shanti": "Navgraha Shanti",
  "navagraha-homam": "Navagraha Homam",
  "ganesh-puja": "Ganesh Puja",
  "pitru-paksha-shradh": "Pitru Paksha Shradh",
  "tarpan": "Tarpan",
};

export function pujaTypeForService(service?: string | null) {
  return service ? PUJA_TYPE_BY_SERVICE[service.trim().toLocaleLowerCase("en-IN")] : undefined;
}

export function discoveryServiceForPujaSlug(slug?: string | null) {
  if (!slug) return undefined;
  const normalized = slug.trim().toLocaleLowerCase("en-IN");
  return DISCOVERY_SERVICE_BY_PUJA_SLUG[normalized] || normalized.replace(/-/g, " ");
}

export function bookingContextParams(source: string, panditId: number) {
  const incoming = new URLSearchParams(source);
  const params = new URLSearchParams();
  const city = incoming.get("city");
  const service = incoming.get("service");
  const mode = incoming.get("mode");
  const contextSource = incoming.get("source");
  const date = incoming.get("date");
  const muhurat = incoming.get("muhurat");
  const language = incoming.get("language");
  const tradition = incoming.get("tradition");
  const location = incoming.get("location");
  const pujaSlug = incoming.get("pujaSlug");
  if (city && /^[a-z][a-z0-9-]{0,79}$/.test(city)) params.set("city", city);
  if (service && pujaTypeForService(service)) params.set("service", service);
  if (mode === "online" || mode === "offline" || mode === "hybrid") params.set("mode", mode);
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) params.set("date", date);
  if (muhurat && muhurat.length <= 160) params.set("muhurat", muhurat);
  if (language && language.length <= 80) params.set("language", language);
  if (tradition && tradition.length <= 80) params.set("tradition", tradition);
  if (location && location.length <= 120) params.set("location", location);
  if (pujaSlug && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(pujaSlug)) params.set("pujaSlug", pujaSlug);
  if (service && !pujaTypeForService(service) && service.length <= 120) params.set("requestedService", service);
  if (["city", "puja_city", "profile", "directory", "storefront", "muhurat", "puja-guide"].includes(contextSource || "")) {
    params.set("source", contextSource!);
  }
  params.set("pandit", String(panditId));
  const mappedType = pujaTypeForService(service);
  if (mappedType) params.set("pujaType", mappedType);
  return params;
}

export function appendPanditRouteContext(
  target: URLSearchParams,
  source: string,
  contextSource: "city" | "puja_city",
) {
  const incoming = new URLSearchParams(source);
  const mode = incoming.get("mode");
  const pandit = incoming.get("pandit");
  if (mode === "online" || mode === "offline" || mode === "hybrid") {
    target.set("mode", mode);
  }
  if (pandit && /^[1-9]\d{0,9}$/.test(pandit)) {
    target.set("pandit", pandit);
  }
  target.set("source", contextSource);
  return target;
}