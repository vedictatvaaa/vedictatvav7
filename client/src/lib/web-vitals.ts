import type { Metric } from "web-vitals";
import { hasConsent } from "./consent";

const ENDPOINT = "/api/vitals";

function getRating(metric: Metric): "good" | "needs-improvement" | "poor" {
  return metric.rating ?? "needs-improvement";
}

function send(metric: Metric) {
  if (!hasConsent("analytics")) return;
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    delta: metric.delta,
    rating: getRating(metric),
    id: metric.id,
    navigationType: metric.navigationType,
  });

  if (navigator.sendBeacon) {
    navigator.sendBeacon(ENDPOINT, new Blob([body], { type: "application/json" }));
  } else {
    fetch(ENDPOINT, { method: "POST", body, headers: { "Content-Type": "application/json" }, keepalive: true }).catch(() => {});
  }
}

export async function reportWebVitals() {
  if (typeof window === "undefined" || !hasConsent("analytics")) return;

  try {
    const { onCLS, onFID, onFCP, onLCP, onTTFB, onINP } = await import("web-vitals");
    onCLS(send);
    onFID(send);
    onFCP(send);
    onLCP(send);
    onTTFB(send);
    onINP(send);
  } catch {
    // web-vitals not available in old browsers — fail silently
  }
}
