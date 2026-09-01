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