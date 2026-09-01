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
  const params = new URLSearchParams(source);
  params.set("pandit", String(panditId));
  const mappedType = pujaTypeForService(params.get("service"));
  if (mappedType) params.set("pujaType", mappedType);
  return params;
}