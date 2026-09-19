let bootstrapToken = "";

export function capturePanditCorrectionToken(): void {
  if (typeof window === "undefined" || window.location.pathname !== "/pandit/application-corrections") return;
  const raw = window.location.hash.replace(/^#/, "");
  const token = new URLSearchParams(raw).get("token") || "";
  if (/^[A-Za-z0-9_-]{40,80}$/.test(token)) bootstrapToken = token;
  window.history.replaceState({}, document.title, `${window.location.pathname}${window.location.search}`);
}

export function consumePanditCorrectionToken(): string {
  const token = bootstrapToken;
  bootstrapToken = "";
  return token;
}