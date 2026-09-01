import type { Request } from "express";

const INDIA_TIME_ZONES = new Set(["Asia/Kolkata", "Asia/Calcutta"]);
const COUNTRY_HEADERS = [
  "cf-ipcountry",
  "x-vercel-ip-country",
  "x-appengine-country",
  "cloudfront-viewer-country",
] as const;

export type PrivacyRegion = "india" | "outside_india" | "unknown";

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const code = value.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : null;
}

export function resolvePrivacyRegion(
  headers: Record<string, unknown>,
  timeZone?: unknown,
): PrivacyRegion {
  for (const header of COUNTRY_HEADERS) {
    const country = normalizeCountryCode(headers[header]);
    if (country) return country === "IN" ? "india" : "outside_india";
  }

  // Browsers in India normally expose one of these IANA aliases. This is only
  // used to confirm India; every other or unavailable value remains unknown
  // and therefore keeps the acknowledgement visible.
  if (typeof timeZone === "string" && INDIA_TIME_ZONES.has(timeZone)) {
    return "india";
  }
  return "unknown";
}

export function privacyRegionForRequest(req: Request): PrivacyRegion {
  const timeZone = typeof req.query.timeZone === "string" ? req.query.timeZone : undefined;
  return resolvePrivacyRegion(req.headers as Record<string, unknown>, timeZone);
}