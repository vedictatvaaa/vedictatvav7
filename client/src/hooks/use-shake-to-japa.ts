import { useEffect, useRef } from "react";
import { useLocation } from "wouter";

const SHAKE_THRESHOLD = 16;
const SHAKES_REQUIRED = 3;
const WINDOW_MS = 1500;
const MIN_GAP_MS = 180;
const COOLDOWN_MS = 4000;
const OPT_OUT_KEY = "vt-shake-japa-disabled";
const PERMISSION_KEY = "vt-shake-japa-permission";

type IOSMotion = typeof DeviceMotionEvent & {
  requestPermission?: () => Promise<"granted" | "denied">;
};

export function shakeToJapaDisabled(): boolean {
  try { return localStorage.getItem(OPT_OUT_KEY) === "1"; } catch { return false; }
}

export function setShakeToJapaDisabled(disabled: boolean) {
  try {
    if (disabled) localStorage.setItem(OPT_OUT_KEY, "1");
    else localStorage.removeItem(OPT_OUT_KEY);
  } catch {}
}

export function needsIOSMotionPermission(): boolean {
  const M = (typeof window !== "undefined" ? (window as any).DeviceMotionEvent : null) as IOSMotion | null;
  return !!M && typeof M.requestPermission === "function";
}

export async function requestIOSMotionPermission(): Promise<boolean> {
  const M = (typeof window !== "undefined" ? (window as any).DeviceMotionEvent : null) as IOSMotion | null;
  if (!M || typeof M.requestPermission !== "function") return true;
  try {
    const r = await M.requestPermission();
    const granted = r === "granted";
    try { localStorage.setItem(PERMISSION_KEY, granted ? "granted" : "denied"); } catch {}
    return granted;
  } catch {
    return false;
  }
}

/**
 * Global shake listener — navigates to /japa when the device is shaken
 * SHAKES_REQUIRED times within WINDOW_MS. No-op when:
 *   - already on /japa (or aliases)
 *   - DeviceMotion API unsupported
 *   - user has opted out
 *   - on iOS where permission was never granted
 */
export function useShakeToJapa() {
  const [location, navigate] = useLocation();
  const lastFire = useRef(0);
  const events = useRef<number[]>([]);
  const lastShake = useRef(0);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const path = (location.split("?")[0] || "").replace(/\/+$/, "") || "/";
    const onJapa = path === "/japa" || path === "/jap" || path === "/japa-counter";
    if (onJapa) return;
    if (shakeToJapaDisabled()) return;
    if (!("DeviceMotionEvent" in window)) return;

    // iOS gating: we cannot request permission here (no user gesture). Only
    // attach the listener if permission was previously granted on the Japa
    // page. Android + most desktops just work.
    if (needsIOSMotionPermission()) {
      let stored: string | null = null;
      try { stored = localStorage.getItem(PERMISSION_KEY); } catch {}
      if (stored !== "granted") return;
    }

    const handler = (e: DeviceMotionEvent) => {
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
      const a = e.accelerationIncludingGravity;
      if (!a) return;
      const x = a.x ?? 0, y = a.y ?? 0, z = a.z ?? 0;
      // Magnitude minus ~gravity: a sharp jolt yields > THRESHOLD.
      const magnitude = Math.sqrt(x * x + y * y + z * z) - 9.8;
      const now = Date.now();
      if (Math.abs(magnitude) < SHAKE_THRESHOLD) return;
      if (now - lastShake.current < MIN_GAP_MS) return;
      lastShake.current = now;

      events.current = events.current.filter((t) => now - t < WINDOW_MS);
      events.current.push(now);

      if (events.current.length >= SHAKES_REQUIRED && now - lastFire.current > COOLDOWN_MS) {
        lastFire.current = now;
        events.current = [];
        try { (navigator as any).vibrate?.(80); } catch {}
        navigate("/japa");
      }
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [location, navigate]);
}
