const KEY = "vt_pandit_token";

export function getPanditToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setPanditToken(token: string) {
  try { localStorage.setItem(KEY, token); } catch {}
}
export function clearPanditToken() {
  try { localStorage.removeItem(KEY); } catch {}
}

export async function panditApi(method: string, url: string, body?: any) {
  const tok = getPanditToken();
  const r = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(tok ? { "x-pandit-token": tok } : {}),
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
