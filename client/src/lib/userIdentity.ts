// Shared identity helper for the wallet + session APIs that require
// (userId, identityEmail) to match the user record server-side.
// Reads from the existing localStorage shape used elsewhere in the app.

export type Identity = { userId: number; email: string } | null;

export function getIdentity(): Identity {
  try {
    const raw = localStorage.getItem("vt_user");
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (!u?.id || !u?.email) return null;
    return { userId: Number(u.id), email: String(u.email) };
  } catch { return null; }
}

export function identityHeaders(): Record<string, string> {
  const id = getIdentity();
  if (!id) return {};
  return { "x-user-id": String(id.userId), "x-user-email": id.email };
}

export async function identityFetch<T = any>(path: string, init: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...identityHeaders(),
    ...(init.headers as any),
  };
  const res = await fetch(path, { ...init, headers });
  const ct = res.headers.get("content-type") || "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) throw new Error((body as any)?.error || `HTTP ${res.status}`);
  return body as T;
}
