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

export function pujaTypeForService(service?: string | null) {
  return service ? PUJA_TYPE_BY_SERVICE[service.trim().toLocaleLowerCase("en-IN")] : undefined;
}

export function bookingContextParams(source: string, panditId: number) {
  const params = new URLSearchParams(source);
  params.set("pandit", String(panditId));
  const mappedType = pujaTypeForService(params.get("service"));
  if (mappedType) params.set("pujaType", mappedType);
  return params;
}