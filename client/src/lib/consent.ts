import { useSyncExternalStore } from "react";

export type ConsentCategory = "analytics" | "marketing";

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

const COOKIE_NAME = "vt_consent";
const COOKIE_MAX_AGE_SECONDS = 180 * 24 * 60 * 60;
const CONSENT_EVENT = "vt:consent-changed";
export const OPEN_CONSENT_EVENT = "vt:open-consent";

function readCookie(): ConsentPreferences | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`))
    ?.split("=")
    .slice(1)
    .join("=");
  if (!raw) return null;
  const match = decodeURIComponent(raw).match(/^v1\.a([01])\.m([01])$/);
  if (!match) return null;
  return {
    necessary: true,
    analytics: match[1] === "1",
    marketing: match[2] === "1",
  };
}

let currentPreferences = readCookie();
const listeners = new Set<() => void>();

function notify() {
  currentPreferences = readCookie();
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener(CONSENT_EVENT, listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener(CONSENT_EVENT, listener);
  };
}

export function getConsentPreferences(): ConsentPreferences | null {
  return currentPreferences;
}

export function hasConsent(category: ConsentCategory): boolean {
  return currentPreferences?.[category] === true;
}

export function useConsentPreferences(): ConsentPreferences | null {
  return useSyncExternalStore(subscribe, () => currentPreferences, () => null);
}

export function initializeGoogleConsentMode() {
  if (typeof window === "undefined") return;
  const w = window as any;
  w.dataLayer = Array.isArray(w.dataLayer) ? w.dataLayer : [];
  w.gtag = typeof w.gtag === "function"
    ? w.gtag
    : function gtag() { w.dataLayer.push(arguments); };
  w.gtag("consent", "default", {
    ad_storage: "denied",
    analytics_storage: "denied",
    ad_user_data: "denied",
    ad_personalization: "denied",
    wait_for_update: 500,
  });
  applyGoogleConsent(currentPreferences);
}

export function applyGoogleConsent(preferences: ConsentPreferences | null) {
  if (typeof window === "undefined") return;
  const gtag = (window as any).gtag;
  if (typeof gtag !== "function") return;
  gtag("consent", "update", {
    analytics_storage: preferences?.analytics ? "granted" : "denied",
    ad_storage: preferences?.marketing ? "granted" : "denied",
    ad_user_data: preferences?.marketing ? "granted" : "denied",
    ad_personalization: preferences?.marketing ? "granted" : "denied",
  });
}

export function saveConsentPreferences(
  preferences: Pick<ConsentPreferences, "analytics" | "marketing">,
) {
  if (typeof document === "undefined") return;
  const value = `v1.a${preferences.analytics ? 1 : 0}.m${preferences.marketing ? 1 : 0}`;
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; Max-Age=${COOKIE_MAX_AGE_SECONDS}; SameSite=Lax${secure}`;
  notify();
  applyGoogleConsent(currentPreferences);
  window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function openConsentPreferences() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
