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

/** Custom event fired when the user shakes the device while ON the /japa
 *  page. JapCounter listens for it and counts a tap — the spiritual
 *  equivalent of nodding the bead in your hand. Decoupled via an event so
 *  the hook stays global while the counter stays self-contained. */
export const SHAKE_TAP_EVENT = "vt:japa-shake-tap";

/**
 * Global shake listener.
 *   - Off /japa: navigates to /japa after 3 shakes in 1.5s.
 *   - On  /japa: dispatches SHAKE_TAP_EVENT so the counter increments
 *     (single shake — no triple-shake gate, that would kill the rhythm).
 * No-op when:
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
    const onJapa = path === "/digital-japa-counter" || path === "/japa" || path === "/jap" || path === "/japa-counter";
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

      // On /japa: every clean shake counts a bead. Tighter min-gap (handled
      // above) plus the JapCounter's own 250ms tap debounce keeps it sane.
      if (onJapa) {
        try { window.dispatchEvent(new CustomEvent(SHAKE_TAP_EVENT)); } catch {}
        return;
      }

      events.current = events.current.filter((t) => now - t < WINDOW_MS);
      events.current.push(now);

      if (events.current.length >= SHAKES_REQUIRED && now - lastFire.current > COOLDOWN_MS) {
        lastFire.current = now;
        events.current = [];
        try { (navigator as any).vibrate?.(80); } catch {}
        navigate("/digital-japa-counter");
      }
    };

    window.addEventListener("devicemotion", handler);
    return () => window.removeEventListener("devicemotion", handler);
  }, [location, navigate]);
}
