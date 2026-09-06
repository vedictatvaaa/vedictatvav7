export function getPanditToken(): string | null {
  // Pandit sessions are HttpOnly-cookie-only. Keeping a bearer token in
  // localStorage would make the 30-day session stealable by XSS.
  return null;
}
export function setPanditToken(token: string) {
  void token;
}
export function clearPanditToken() {
  // The server clears the HttpOnly cookie on logout.
}

export async function panditApi(method: string, url: string, body?: any) {
  const r = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!r.ok) {
    let msg = `${r.status}`;
    try { const j = await r.json(); msg = j.error || j.message || msg; } catch {}
    throw new Error(msg);
  }
  if (r.status === 204) return null;
  return r.json();
}
