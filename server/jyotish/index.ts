// Public API for the Jyotish module — Vedic astronomy / astrology.
//
// Everything here is deterministic and replayable. Given the same inputs you will
// always get the same outputs (no randomness, no AI). Astronomical positions come
// from Swiss Ephemeris with the Lahiri ayanamsa (the standard Indian sidereal zodiac).

export * from "./data";
export * from "./ephemeris";
export * from "./panchang";
export * from "./dasha";
export * from "./kundli";
export * from "./cities";

import { db } from "../db";
import { aiCache } from "@shared/schema";
import { and, eq } from "drizzle-orm";
import { findCityLocal, defaultCity, type CityRecord } from "./cities";

/**
 * Resolve a place name to lat/lon/tz. Strategy:
 * 1. Look up in curated city DB (fast, offline)
 * 2. If miss, try OSM Nominatim — cached in ai_cache for 1 year
 * 3. If still miss, return Delhi as a documented fallback (with warning flag)
 */
export async function geocodePlace(query: string): Promise<{ city: CityRecord; warning?: string }> {
  if (!query?.trim()) return { city: defaultCity(), warning: "No place provided — defaulted to Delhi (IST)." };
  const local = findCityLocal(query);
  if (local) return { city: local };

  const cacheKey = `geo:${query.trim().toLowerCase().slice(0, 100)}`;
  try {
    const cached = await db.select().from(aiCache)
      .where(and(eq(aiCache.cacheType, "geocode"), eq(aiCache.cacheKey, cacheKey)))
      .limit(1);
    if (cached.length > 0) {
      const data = cached[0].data as any;
      if (data?.found) return { city: data.city as CityRecord };
      if (data?.notFound) return { city: defaultCity(), warning: `Place "${query}" not recognised — defaulted to Delhi (IST).` };
    }
  } catch { /* cache miss is fine */ }

  // OSM Nominatim — must include a real User-Agent per their policy.
  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&addressdetails=1&q=${encodeURIComponent(query)}`;
    const resp = await fetch(url, {
      headers: {
        "User-Agent": "VedicTatva/1.0 (spiritual-ecommerce; contact via vedictatva.com)",
        "Accept-Language": "en",
      },
    });
    if (resp.ok) {
      const arr = await resp.json() as any[];
      if (Array.isArray(arr) && arr.length > 0) {
        const r = arr[0];
        const lat = parseFloat(r.lat), lon = parseFloat(r.lon);
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          // Resolve tz from coords using tz-lookup
          const tzlookup = (await import("tz-lookup")).default;
          const tz = (() => { try { return tzlookup(lat, lon); } catch { return "Asia/Kolkata"; } })();
          const city: CityRecord = {
            name: r.display_name?.split(",")[0]?.trim() || query,
            country: r.address?.country || "Unknown",
            state: r.address?.state || r.address?.region,
            lat, lon, tz,
          };
          await db.insert(aiCache).values({
            cacheType: "geocode",
            cacheKey,
            data: { found: true, city },
            expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
          }).onConflictDoNothing();
          return { city };
        }
      }
      // Cache the not-found result for 30 days to avoid hammering Nominatim
      await db.insert(aiCache).values({
        cacheType: "geocode",
        cacheKey,
        data: { notFound: true },
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      }).onConflictDoNothing();
    }
  } catch (e) {
    console.error("[geocodePlace] Nominatim error:", e);
  }
  return { city: defaultCity(), warning: `Place "${query}" not recognised — defaulted to Delhi (IST). Add lat/lon explicitly for precision.` };
}

/**
 * Parse various date input shapes used by the existing routes.
 */
export function parseBirthInput(raw: {
  birthDate?: string; birthTime?: string;
  date?: string; time?: string;
  year?: number; month?: number; day?: number; hour?: number; minute?: number;
}): { year: number; month: number; day: number; hour: number; minute: number } | null {
  if (raw.year != null && raw.month != null && raw.day != null) {
    return {
      year: Number(raw.year), month: Number(raw.month), day: Number(raw.day),
      hour: Number(raw.hour ?? 12), minute: Number(raw.minute ?? 0),
    };
  }
  const dateStr = raw.birthDate ?? raw.date;
  const timeStr = raw.birthTime ?? raw.time;
  if (!dateStr) return null;
  // Accepts YYYY-MM-DD or DD/MM/YYYY or DD-MM-YYYY
  let y: number, m: number, d: number;
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(dateStr)) {
    const [yy, mm, dd] = dateStr.split("-").map(s => parseInt(s, 10));
    y = yy; m = mm; d = dd;
  } else if (/^\d{1,2}[\/\-]\d{1,2}[\/\-]\d{4}/.test(dateStr)) {
    const [dd, mm, yy] = dateStr.split(/[\/\-]/).map(s => parseInt(s, 10));
    y = yy; m = mm; d = dd;
  } else {
    const dt = new Date(dateStr);
    if (Number.isNaN(dt.getTime())) return null;
    y = dt.getUTCFullYear(); m = dt.getUTCMonth() + 1; d = dt.getUTCDate();
  }
  let hour = 12, minute = 0;
  if (timeStr) {
    // Accepts HH:MM (24h) or HH:MM AM/PM
    const m24 = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?$/);
    if (m24) {
      hour = parseInt(m24[1], 10);
      minute = parseInt(m24[2], 10);
      if (m24[3]) {
        const isPm = /PM/i.test(m24[3]);
        if (isPm && hour !== 12) hour += 12;
        if (!isPm && hour === 12) hour = 0;
      }
    }
  }
  return { year: y, month: m, day: d, hour, minute };
}
