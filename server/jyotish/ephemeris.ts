// Thin, well-typed wrapper over swisseph-v2 configured for sidereal Vedic (Lahiri) calculations.
// All functions return values in degrees (0..360) for longitudes; Julian Days are UT.

import sweph from "swisseph-v2";

let initialized = false;
function ensureInit() {
  if (initialized) return;
  // Empty ephe path => use built-in Moshier ephemeris (no external files required).
  // Accuracy: arc-second level for Sun/Moon, sub-arc-minute for planets — far better than any AI output.
  sweph.swe_set_ephe_path("");
  sweph.swe_set_sid_mode(sweph.SE_SIDM_LAHIRI, 0, 0);
  initialized = true;
}

export const FLAGS_SIDEREAL = sweph.SEFLG_MOSEPH | sweph.SEFLG_SIDEREAL | sweph.SEFLG_SPEED;
export const FLAGS_TROPICAL = sweph.SEFLG_MOSEPH | sweph.SEFLG_SPEED;

export const PLANET_IDS = {
  Sun:     sweph.SE_SUN,
  Moon:    sweph.SE_MOON,
  Mars:    sweph.SE_MARS,
  Mercury: sweph.SE_MERCURY,
  Jupiter: sweph.SE_JUPITER,
  Venus:   sweph.SE_VENUS,
  Saturn:  sweph.SE_SATURN,
  Rahu:    sweph.SE_TRUE_NODE, // True Node (Rahu)
} as const;

export type PlanetName = keyof typeof PLANET_IDS | "Ketu";

export interface PlanetPos {
  name: PlanetName;
  longitude: number;       // sidereal longitude 0..360
  latitude: number;
  speed: number;           // degrees per day; negative = retrograde
  retrograde: boolean;
  sign: number;            // 0..11 (0=Aries)
  signDegree: number;      // 0..30 within sign
  nakshatra: number;       // 0..26
  nakshatraPada: number;   // 1..4
}

/**
 * Convert calendar date + UT hour (decimal) to Julian Day (UT).
 */
export function julianDayUT(year: number, month: number, day: number, hourUT: number): number {
  ensureInit();
  return sweph.swe_julday(year, month, day, hourUT, sweph.SE_GREG_CAL);
}

/**
 * Convert local date+time to Julian Day UT given timezone offset in hours (e.g. +5.5 for IST).
 * Negative offsets accepted; swe_julday handles fractional days correctly.
 */
export function localToJulianDayUT(year: number, month: number, day: number, hourLocal: number, tzOffsetHours: number): number {
  return julianDayUT(year, month, day, hourLocal - tzOffsetHours);
}

/**
 * Get the timezone offset in hours for an IANA tz name on a particular UTC instant.
 * Honors DST. e.g. tzOffsetHours("America/New_York", new Date("2024-07-01")) === -4.
 */
export function tzOffsetHours(tz: string, when: Date): number {
  // Use Intl to get the offset string ("GMT-04:00") and parse it.
  const fmt = new Intl.DateTimeFormat("en-US", { timeZone: tz, timeZoneName: "longOffset" });
  const parts = fmt.formatToParts(when);
  const tzn = parts.find(p => p.type === "timeZoneName")?.value || "GMT+0";
  const m = tzn.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/);
  if (!m) return 0;
  const sign = m[1] === "-" ? -1 : 1;
  const h = parseInt(m[2], 10);
  const mm = m[3] ? parseInt(m[3], 10) : 0;
  return sign * (h + mm / 60);
}

function _splitLon(lon: number) {
  const n = ((lon % 360) + 360) % 360;
  const sign = Math.floor(n / 30);
  const signDegree = n - sign * 30;
  const nakSize = 360 / 27; // 13.333...
  const nakshatra = Math.floor(n / nakSize);
  const padaSize = nakSize / 4; // 3.333...
  const nakshatraPada = Math.floor((n - nakshatra * nakSize) / padaSize) + 1;
  return { sign, signDegree, nakshatra, nakshatraPada };
}

/**
 * Compute sidereal (Lahiri) position of a single planet.
 */
export function planetPosition(jd: number, planet: PlanetName): PlanetPos {
  ensureInit();
  if (planet === "Ketu") {
    const r = sweph.swe_calc_ut(jd, PLANET_IDS.Rahu, FLAGS_SIDEREAL);
    if (r.error) throw new Error("Ephemeris error: " + r.error);
    const lon = ((r.longitude + 180) % 360 + 360) % 360;
    const split = _splitLon(lon);
    return {
      name: "Ketu",
      longitude: lon,
      latitude: -r.latitude,
      speed: r.longitudeSpeed,
      retrograde: r.longitudeSpeed < 0,
      ...split,
    };
  }
  const id = PLANET_IDS[planet];
  const r = sweph.swe_calc_ut(jd, id, FLAGS_SIDEREAL);
  if (r.error) throw new Error("Ephemeris error: " + r.error);
  const split = _splitLon(r.longitude);
  return {
    name: planet,
    longitude: r.longitude,
    latitude: r.latitude,
    speed: r.longitudeSpeed,
    // Sun/Moon never retrograde; Rahu/Ketu always considered retrograde in Vedic.
    retrograde: planet === "Rahu" ? true : (planet === "Sun" || planet === "Moon" ? false : r.longitudeSpeed < 0),
    ...split,
  };
}

/**
 * Compute all 9 grahas at the given Julian Day.
 */
export function allPlanets(jd: number): PlanetPos[] {
  return [
    planetPosition(jd, "Sun"),
    planetPosition(jd, "Moon"),
    planetPosition(jd, "Mars"),
    planetPosition(jd, "Mercury"),
    planetPosition(jd, "Jupiter"),
    planetPosition(jd, "Venus"),
    planetPosition(jd, "Saturn"),
    planetPosition(jd, "Rahu"),
    planetPosition(jd, "Ketu"),
  ];
}

/**
 * Sidereal ascendant (Lagna) longitude in degrees, using Placidus house system
 * (whole-sign houses are derived from the Lagna sign separately in kundli.ts).
 */
export function ascendantSidereal(jd: number, lat: number, lon: number): number {
  ensureInit();
  const h = sweph.swe_houses_ex(jd, FLAGS_SIDEREAL, lat, lon, "P");
  return h.ascendant;
}

/**
 * Find the next sunrise (UT Julian Day) after `searchStartJD` for given lat/lon.
 * Returns null if not found in next 36 hours.
 */
export function nextSunrise(searchStartJD: number, lat: number, lon: number): number | null {
  ensureInit();
  const r = sweph.swe_rise_trans(
    searchStartJD,
    sweph.SE_SUN,
    "",
    sweph.SEFLG_MOSEPH,
    sweph.SE_CALC_RISE | sweph.SE_BIT_DISC_CENTER,
    lon, lat, 0,
    1013.25, 15,
  );
  if (r.transitTime && r.transitTime - searchStartJD < 1.5) return r.transitTime;
  return null;
}

export function nextSunset(searchStartJD: number, lat: number, lon: number): number | null {
  ensureInit();
  const r = sweph.swe_rise_trans(
    searchStartJD,
    sweph.SE_SUN,
    "",
    sweph.SEFLG_MOSEPH,
    sweph.SE_CALC_SET | sweph.SE_BIT_DISC_CENTER,
    lon, lat, 0,
    1013.25, 15,
  );
  if (r.transitTime && r.transitTime - searchStartJD < 1.5) return r.transitTime;
  return null;
}

export function nextMeridianTransit(searchStartJD: number, lat: number, lon: number): number | null {
  ensureInit();
  const r = sweph.swe_rise_trans(
    searchStartJD,
    sweph.SE_SUN,
    "",
    sweph.SEFLG_MOSEPH,
    sweph.SE_CALC_MTRANSIT,
    lon, lat, 0,
    1013.25, 15,
  );
  if (r.transitTime && r.transitTime - searchStartJD < 1.5) return r.transitTime;
  return null;
}

export function nextMoonrise(searchStartJD: number, lat: number, lon: number): number | null {
  ensureInit();
  const r = sweph.swe_rise_trans(
    searchStartJD,
    sweph.SE_MOON,
    "",
    sweph.SEFLG_MOSEPH,
    sweph.SE_CALC_RISE | sweph.SE_BIT_DISC_CENTER,
    lon, lat, 0,
    1013.25, 15,
  );
  if (r.transitTime && r.transitTime - searchStartJD < 2) return r.transitTime;
  return null;
}

export function nextMoonset(searchStartJD: number, lat: number, lon: number): number | null {
  ensureInit();
  const r = sweph.swe_rise_trans(
    searchStartJD,
    sweph.SE_MOON,
    "",
    sweph.SEFLG_MOSEPH,
    sweph.SE_CALC_SET | sweph.SE_BIT_DISC_CENTER,
    lon, lat, 0,
    1013.25, 15,
  );
  if (r.transitTime && r.transitTime - searchStartJD < 2) return r.transitTime;
  return null;
}

/**
 * Convert a JD UT to a JS Date (UTC instant).
 */
export function jdToDate(jd: number): Date {
  // JD 2440587.5 = 1970-01-01 00:00 UTC
  const ms = (jd - 2440587.5) * 86400000;
  return new Date(ms);
}

/**
 * Format a JD UT as local time string in given tz: "h:mm AM/PM" (12-hour).
 */
export function formatJDLocal12h(jd: number | null, tz: string): string {
  if (jd == null) return "—";
  const d = jdToDate(jd);
  return d.toLocaleTimeString("en-US", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true });
}

/**
 * Format a JD UT as "h:mm AM/PM" with seconds for precision listings.
 */
export function formatJDLocalLong(jd: number | null, tz: string): string {
  if (jd == null) return "—";
  const d = jdToDate(jd);
  return d.toLocaleString("en-IN", { timeZone: tz, hour: "numeric", minute: "2-digit", hour12: true, weekday: "short", day: "2-digit", month: "short" });
}

/**
 * Current Lahiri ayanamsa value at a given JD (in degrees).
 */
export function ayanamsa(jd: number): number {
  ensureInit();
  const v = sweph.swe_get_ayanamsa_ut(jd);
  return typeof v === "number" ? v : (v as any).ayanamsa ?? 0;
}
