// Thin REST helpers shared across user dashboard tabs.
// Every mutation route requires the caller's email for identity verification
// (mirrors the existing /api/my-bookings pattern). The user's email is
// resolved by the caller from useAuth() and threaded through these calls.
import type { FamilyMember, UserNotification, InsertFamilyMember, AlertPreferences } from "@shared/schema";

async function jfetch(url: string, init?: RequestInit) {
  const res = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data?.message || `HTTP ${res.status}`);
  return data;
}

// ──────── Family Profiles ────────
export async function listFamily(userId: number, email: string): Promise<FamilyMember[]> {
  const d = await jfetch(`/api/family-members?userId=${userId}&email=${encodeURIComponent(email)}`);
  return d.members || [];
}
export async function createFamily(input: InsertFamilyMember, identityEmail: string) {
  const d = await jfetch(`/api/family-members`, {
    method: "POST",
    body: JSON.stringify({ ...input, identityEmail }),
  });
  return d.member as FamilyMember;
}
export async function updateFamily(id: number, userId: number, patch: Partial<InsertFamilyMember>, identityEmail: string) {
  const d = await jfetch(`/api/family-members/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ ...patch, userId, identityEmail }),
  });
  return d.member as FamilyMember;
}
export async function deleteFamily(id: number, userId: number, email: string) {
  await jfetch(`/api/family-members/${id}?userId=${userId}&email=${encodeURIComponent(email)}`, {
    method: "DELETE",
  });
}

// ──────── Notifications inbox ────────
export async function listNotifications(userId: number, email: string, opts: { limit?: number; unreadOnly?: boolean } = {}) {
  const q = new URLSearchParams({ userId: String(userId), email });
  if (opts.limit) q.set("limit", String(opts.limit));
  if (opts.unreadOnly) q.set("unread", "1");
  const d = await jfetch(`/api/notifications?${q.toString()}`);
  return { items: (d.items || []) as UserNotification[], unread: Number(d.unread || 0) };
}

// ──────── Pandit-side handshakes (read-only on the customer surface) ────────
export interface MyPaymentRequest {
  id: number; panditId: number;
  pandit: { id: number; name: string; slug: string; image: string | null } | null;
  amountInr: number; purpose: string; notes: string | null;
  status: "pending" | "paid" | "cancelled" | "expired";
  rpShortUrl: string | null; publicToken: string | null;
  expiresAt: string | null; paidAt: string | null; createdAt: string;
}
export async function listMyPaymentRequests(userId: number, email: string) {
  const d = await jfetch(`/api/my/payment-requests?userId=${userId}&email=${encodeURIComponent(email)}`);
  return {
    requests: (d.requests || []) as MyPaymentRequest[],
    summary: d.summary as { pendingCount: number; pendingValue: number; paidCount: number; paidValue: number },
  };
}

export interface MyPanditMemory {
  id: number; kind: string; label: string; dateText: string | null; tithi: string | null;
  notes: string | null;
  pandit: { id: number; name: string; slug: string; image: string | null } | null;
  nextDate: string | null; daysAway: number | null;
}
export async function listMyPanditMemories(userId: number, email: string) {
  const d = await jfetch(`/api/my/pandit-memories?userId=${userId}&email=${encodeURIComponent(email)}`);
  return (d.memories || []) as MyPanditMemory[];
}
export async function markNotificationRead(id: number, userId: number, identityEmail: string) {
  await jfetch(`/api/notifications/${id}/read`, {
    method: "POST",
    body: JSON.stringify({ userId, identityEmail }),
  });
}
export async function markAllNotificationsRead(userId: number, identityEmail: string) {
  const d = await jfetch(`/api/notifications/mark-all-read`, {
    method: "POST",
    body: JSON.stringify({ userId, identityEmail }),
  });
  return Number(d.updated || 0);
}

// ──────── Unified alert preferences ────────
export async function getAlertPreferences(userId: number, email: string): Promise<AlertPreferences> {
  const d = await jfetch(`/api/alert-preferences?userId=${userId}&email=${encodeURIComponent(email)}`);
  return d.preferences as AlertPreferences;
}

export async function updateAlertPreferences(
  userId: number,
  identityEmail: string,
  patch: Partial<Omit<AlertPreferences, "id" | "userId" | "updatedAt">>,
): Promise<AlertPreferences> {
  const d = await jfetch("/api/alert-preferences", {
    method: "PUT",
    body: JSON.stringify({ userId, identityEmail, ...patch }),
  });
  return d.preferences as AlertPreferences;
}

export async function registerAlertDevice(input: {
  userId: number;
  identityEmail: string;
  platform: "web" | "android";
  endpoint: string;
  permissionState?: string;
  appVersion?: string;
}) {
  const d = await jfetch("/api/alert-devices", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return d.device;
}
