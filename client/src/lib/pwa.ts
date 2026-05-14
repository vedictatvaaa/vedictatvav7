import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "vt-pwa-install-dismissed-at";
const DISMISS_DAYS = 14;

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

export function useInstallPrompt() {
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
      const ts = Number(localStorage.getItem(DISMISS_KEY) || "0");
      if (!ts) return false;
      return Date.now() - ts < DISMISS_DAYS * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  })();

  return {
    canInstall: !!deferred && !installed && !recentlyDismissed,
    installed,
    install: async () => {
      if (!deferred) return false;
      await deferred.prompt();
      const choice = await deferred.userChoice;
      cachedPrompt = null;
      setDeferred(null);
      return choice.outcome === "accepted";
    },
    dismiss: () => {
      try { localStorage.setItem(DISMISS_KEY, String(Date.now())); } catch {}
      cachedPrompt = null;
      setDeferred(null);
    },
  };
}
