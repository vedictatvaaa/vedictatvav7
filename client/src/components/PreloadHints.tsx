import { useEffect } from "react";
import { useLocation } from "wouter";

type PreloadEntry = { src: string; widths: number[] };

function preloadHref(src: string, width: number): string {
  return `/api/img?src=${encodeURIComponent(src)}&w=${width}&fmt=webp&q=75`;
}

function preloadImageset(src: string, widths: number[]): string {
  return widths.map(w => `${preloadHref(src, w)} ${w}w`).join(", ");
}

const STATIC_TABLE: Record<string, PreloadEntry> = {
  // Homepage LCP is now slide 1 of the rotating hero — "Shop Puja Samagri &
  // Puja Essentials Online" — backed by hero-scene-essentials.png. Must stay
  // in lockstep with `heroSlides[0].src` in client/src/pages/home.tsx.
  "/":               { src: "/attached_assets/heroes/hero-scene-essentials.png", widths: [320, 480, 768, 1080, 1440] },
  "/puja-samagri-online":           { src: "/attached_assets/heroes/hero-scene-essentials.png", widths: [320, 480, 768, 1080, 1440] },
  "/pind-daan-booking":      { src: "/attached_assets/heroes/hero-scene-pind-daan.png",  widths: [320, 480, 768, 1080, 1440] },
  "/tirth-yatra":    { src: "/attached_assets/heroes/hero-scene-tirth-yatra.png",widths: [320, 480, 768, 1080, 1440] },
  "/astrology":      { src: "/attached_assets/heroes/hero-scene-astrology.png",  widths: [320, 480, 768, 1080, 1440] },
};

const PREFIX_TABLE: Array<{ prefix: string; entry: PreloadEntry }> = [
  { prefix: "/puja-samagri-online/", entry: { src: "/attached_assets/heroes/hero-scene-essentials.png", widths: [320, 480, 768, 1080, 1440] } },
  { prefix: "/pind-daan-booking/",   entry: { src: "/attached_assets/heroes/hero-scene-pind-daan.png",  widths: [320, 480, 768, 1080, 1440] } },
  { prefix: "/tirth-yatra/", entry: { src: "/attached_assets/heroes/hero-scene-tirth-yatra.png",widths: [320, 480, 768, 1080, 1440] } },
];

function entryForRoute(pathname: string): PreloadEntry | null {
  if (STATIC_TABLE[pathname]) return STATIC_TABLE[pathname];
  for (const { prefix, entry } of PREFIX_TABLE) {
    if (pathname.startsWith(prefix)) return entry;
  }
  return null;
}

export default function PreloadHints() {
  const [location] = useLocation();
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.head.querySelectorAll('link[data-route-preload="1"]').forEach(n => n.parentNode?.removeChild(n));

    const entry = entryForRoute(location);
    if (!entry) return;

    // Respect the user's data budget — Save-Data and 2g/slow-2g connections
    // skip the high-priority hero preload entirely; the lazy <img> below the
    // fold still loads, just without contending for early bandwidth.
    const conn = (navigator as any).connection;
    if (conn) {
      if (conn.saveData === true) return;
      const eff = String(conn.effectiveType || "");
      if (eff === "slow-2g" || eff === "2g") return;
    }

    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = preloadHref(entry.src, entry.widths[Math.floor(entry.widths.length / 2)]);
    link.setAttribute("imagesrcset", preloadImageset(entry.src, entry.widths));
    link.setAttribute("imagesizes", "100vw");
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("data-route-preload", "1");
    document.head.appendChild(link);

    return () => { if (link.parentNode) link.parentNode.removeChild(link); };
  }, [location]);

  return null;
}
