import { useSyncExternalStore } from "react";

export type ConsentCategory = "analytics" | "marketing";

export interface ConsentPreferences {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
}

const CONSENT_EVENT = "vt:consent-changed";
export const OPEN_CONSENT_EVENT = "vt:open-consent";

const ALWAYS_GRANTED: ConsentPreferences = {
  necessary: true,
  analytics: true,
  marketing: true,
};
const listeners = new Set<() => void>();

function notify() {
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
  return ALWAYS_GRANTED;
}

export function hasConsent(category: ConsentCategory): boolean {
  return ALWAYS_GRANTED[category];
}

export function useConsentPreferences(): ConsentPreferences | null {
  return useSyncExternalStore(subscribe, () => ALWAYS_GRANTED, () => ALWAYS_GRANTED);
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
  applyGoogleConsent(ALWAYS_GRANTED);
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
  void preferences;
  notify();
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CONSENT_EVENT));
}

export function openConsentPreferences() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_CONSENT_EVENT));
}
