// Astrologer-portal client auth helpers — mirrors panditAuth pattern.
const KEY = "vt_astrologer_token";

export function getAstrologerToken(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}
export function setAstrologerToken(t: string) {
  try { localStorage.setItem(KEY, t); } catch {}
}
export function clearAstrologerToken() {
  try { localStorage.removeItem(KEY); } catch {}
}

export async function astrologerApi<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const token = getAstrologerToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as any),
  };
  if (token) headers["x-astrologer-token"] = token;
  const res = await fetch(path, { ...init, headers });
  if (res.status === 401) {
    clearAstrologerToken();
    throw new Error("Authentication required");
  }
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error((body as any)?.error || `HTTP ${res.status}`);
  return body as T;
}
