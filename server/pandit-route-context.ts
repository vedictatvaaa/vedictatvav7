export function panditRedirectTarget(
  destination: string,
  query: Record<string, unknown>,
): string {
  const params = new URLSearchParams();
  const mode = typeof query.mode === "string" ? query.mode : "";
  const pandit = typeof query.pandit === "string" ? query.pandit : "";
  if (mode === "online" || mode === "offline" || mode === "hybrid") {
    params.set("mode", mode);
  }
  if (/^[1-9]\d{0,9}$/.test(pandit)) {
    params.set("pandit", pandit);
  }
  const suffix = params.toString();
  return suffix ? `${destination}?${suffix}` : destination;
}

/** Preserve only non-sensitive discovery/booking context on profile redirects. */
export function canonicalPanditRedirectTarget(
  destination: string,
  query: Record<string, unknown>,
): string {
  const params = new URLSearchParams();
  const value = (key: string) => typeof query[key] === "string" ? String(query[key]) : "";
  const city = value("city");
  const service = value("service");
  const mode = value("mode");
  const source = value("source");
  if (/^[a-z][a-z0-9-]{0,79}$/.test(city)) params.set("city", city);
  if (/^[a-z0-9][a-z0-9-]{0,79}$/.test(service)) params.set("service", service);
  if (mode === "online" || mode === "offline" || mode === "hybrid") params.set("mode", mode);
  if (["city", "puja_city", "profile", "directory", "storefront"].includes(source)) {
    params.set("source", source);
  }
  const suffix = params.toString();
  return suffix ? `${destination}?${suffix}` : destination;
}