import type { Request } from "express";

export interface ServerConsentPreferences {
  analytics: boolean;
  marketing: boolean;
}

export function parseConsentCookie(value: unknown): ServerConsentPreferences | null {
  const match = String(value || "").match(/^v1\.a([01])\.m([01])$/);
  if (!match) return null;
  return {
    analytics: match[1] === "1",
    marketing: match[2] === "1",
  };
}

export function hasAnalyticsConsent(req: Pick<Request, "cookies">): boolean {
  return parseConsentCookie(req.cookies?.vt_consent)?.analytics === true;
}

export function hasMarketingConsent(req: Pick<Request, "cookies">): boolean {
  return parseConsentCookie(req.cookies?.vt_consent)?.marketing === true;
}

export function getConsentedReferralSlug(req: {
  cookies?: Record<string, unknown>;
  refSlug?: string;
}): string | null {
  if (!hasMarketingConsent(req as Pick<Request, "cookies">)) return null;
  const slug = String(req.refSlug || req.cookies?.vt_ref || "").trim().toLowerCase();
  return /^[a-z0-9-]{1,80}$/.test(slug) ? slug : null;
}
