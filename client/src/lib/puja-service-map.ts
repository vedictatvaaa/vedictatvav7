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
  if (city && /^[a-z][a-z0-9-]{0,79}$/.test(city)) params.set("city", city);
  if (service && pujaTypeForService(service)) params.set("service", service);
  if (mode === "online" || mode === "offline" || mode === "hybrid") params.set("mode", mode);
  if (["city", "puja_city", "profile", "directory", "storefront"].includes(contextSource || "")) {
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