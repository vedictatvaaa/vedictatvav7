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
