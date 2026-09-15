import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "vt-pwa-install-dismissed-at";
const DISMISS_DAYS = 14;
const GENERAL_MANIFEST_URL = "/manifest.webmanifest";
const PANDIT_MANIFEST_URL = "/pandit-manifest.webmanifest";

export function isPanditPwaPath(pathname: string): boolean {
  const path = pathname.split(/[?#]/, 1)[0] || "/";
  return path === "/pandit/login" || path.startsWith("/pandit/portal");
}

export function syncPwaManifest(pathname?: string): void {
  if (typeof document === "undefined") return;
  const manifest = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
  if (!manifest) return;
  const next = isPanditPwaPath(pathname || window.location.pathname)
    ? PANDIT_MANIFEST_URL
    : GENERAL_MANIFEST_URL;
  if (manifest.getAttribute("href") !== next) manifest.setAttribute("href", next);
  document.documentElement.dataset.pwaApp = next === PANDIT_MANIFEST_URL ? "pandit" : "general";
}

export function usePwaManifest(pathname: string): void {
  useEffect(() => {
    syncPwaManifest(pathname);
  }, [pathname]);
}

// Capture beforeinstallprompt at module load so deferred-mounted subscribers don't miss it.
let cachedPrompt: BeforeInstallPromptEvent | null = null;
let cachedInstalled = false;
const subscribers = new Set<() => void>();

if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e: Event) => {
    e.preventDefault();
    cachedPrompt = e as BeforeInstallPromptEvent;
    subscribers.forEach(cb => cb());
  });
  window.addEventListener("appinstalled", () => {
    cachedInstalled = true;
    cachedPrompt = null;
    subscribers.forEach(cb => cb());
  });
}

export function registerServiceWorker() {
  if (typeof window === "undefined") return;
  if (!("serviceWorker" in navigator)) return;
  if (import.meta.env.DEV) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}

export function useInstallPrompt(options: { dismissKey?: string } = {}) {
  const dismissKey = options.dismissKey || DISMISS_KEY;
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(cachedPrompt);
  const [installed, setInstalled] = useState<boolean>(() => {
    if (typeof window === "undefined") return cachedInstalled;
    return cachedInstalled || (window.matchMedia?.("(display-mode: standalone)").matches ?? false);
  });

  useEffect(() => {
    setDeferred(cachedPrompt);
    setInstalled(prev => prev || cachedInstalled);
    const cb = () => {
      setDeferred(cachedPrompt);
      setInstalled(prev => prev || cachedInstalled);
    };
    subscribers.add(cb);
    return () => { subscribers.delete(cb); };
  }, []);

  const recentlyDismissed = (() => {
    try {
      const ts = Number(localStorage.getItem(dismissKey) || "0");
      if (!ts) return false;
      return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  return {
    canInstall: !!deferred && !installed && !recentlyDismissed,
    installed,
    recentlyDismissed,
    isIOS: typeof navigator !== "undefined" && (
      /iPad|iPhone|iPod/.test(navigator.platform) ||
      (navigator.userAgent.includes("Mac") && "ontouchend" in document)
    ),
    install: async () => {
      if (!deferred) return false;
      await deferred.prompt();
      const choice = await deferred.userChoice;
      cachedPrompt = null;
      setDeferred(null);
      return choice.outcome === "accepted";
    },
    dismiss: () => {
      try { localStorage.setItem(dismissKey, String(Date.now())); } catch {}
      cachedPrompt = null;
      setDeferred(null);
    },
  };
}
