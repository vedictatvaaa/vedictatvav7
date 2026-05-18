// Pitru Tithi calculator + reminder system.
//
// Public:
//   POST /api/tools/tithi-calculator       — compute tithi/paksha/nakshatra + dosh + next 5 Shradh dates
// User-scoped (verifyUser uid+email pattern matching wave1):
//   GET    /api/pitru/ancestors            — list ancestors for the signed-in user
//   POST   /api/pitru/ancestors            — save one (recomputes tithi)
//   PATCH  /api/pitru/ancestors/:id        — edit (recomputes tithi if departure changed)
//   DELETE /api/pitru/ancestors/:id        — delete + cascade reminder rows
// Admin:
//   GET    /api/admin/pitru/jobs           — recent reminder dispatches
//
// Background:
//   startPitruReminderScheduler()          — runs hourly; picks up T-7, T-1, T-0 windows; idempotent.
//
// All astronomy is delegated to server/jyotish/* (Swiss Ephemeris, Lahiri).

import type { Express, Request, Response } from "express";
import { z } from "zod";
import { db } from "./db";
import { storage } from "./storage";
import {
  pitruAncestors, pitruReminderJobs, users,
  type PitruAncestor,
} from "@shared/schema";
import { and, desc, eq, sql } from "drizzle-orm";
import { adminAuthMiddleware } from "./admin-auth";
import { CITIES } from "./jyotish/cities";
import { computeDailyPanchang, aparahnaTithiOn } from "./jyotish/panchang";
import { localToJulianDayUT, planetPosition, tzOffsetHours } from "./jyotish/ephemeris";
import { NAKSHATRAS } from "./jyotish/data";
import { sendWhatsApp } from "./services/msg91";
import { sendEmail } from "./email";

// ---------------------------------------------------------------------------
// Geo resolution — strict match against the curated CITIES list.
// Returns null for unknown places so callers can surface a clear error
// rather than silently guessing the timezone.
// ---------------------------------------------------------------------------
type Place = { name: string; lat: number; lon: number; tz: string };

// Strict, exact-only city resolution. We deliberately do NOT use findCityLocal
// here because it falls back to fuzzy substring matching ("Atlantis" → Surat),
// which is unsafe when the timezone of the result drives a Vedic computation.
function normCity(s: string): string {
  return (s || "").toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, " ").trim();
}
function resolvePlace(name: string): Place | null {
  const q = normCity(name);
  if (!q) return null;
  for (const c of CITIES) {
    if (normCity(c.name) === q) return { name: c.name, lat: c.lat, lon: c.lon, tz: c.tz };
    if ((c.aliases || []).some(a => normCity(a) === q)) return { name: c.name, lat: c.lat, lon: c.lon, tz: c.tz };
    // Allow "Varanasi, Uttar Pradesh" (city, state) as the autocomplete may
    // surface this form — match on first segment only.
    const first = q.split(",")[0].trim();
    if (first && (normCity(c.name) === first || (c.aliases || []).some(a => normCity(a) === first))) {
      return { name: c.name, lat: c.lat, lon: c.lon, tz: c.tz };
    }
  }
  return null;
}

function searchCities(q: string, limit = 12) {
  const needle = (q || "").trim().toLowerCase();
  if (!needle) return CITIES.slice(0, limit).map(c => ({ name: c.name, state: c.state, country: c.country, lat: c.lat, lon: c.lon, tz: c.tz }));
  const out: typeof CITIES = [];
  for (const c of CITIES) {
    const hay = (c.name + " " + (c.state || "") + " " + (c.aliases || []).join(" ")).toLowerCase();
    if (hay.includes(needle)) out.push(c);
    if (out.length >= limit) break;
  }
  return out.map(c => ({ name: c.name, state: c.state, country: c.country, lat: c.lat, lon: c.lon, tz: c.tz }));
}

// ---------------------------------------------------------------------------
// Tithi at a precise moment (departure date+time at place).
// ---------------------------------------------------------------------------
export interface DepartureTithi {
  tithiNumber: number;          // 1..30 absolute
  tithiInPaksha: number;        // 1..15
  tithiName: string;
  paksha: "Shukla Paksha" | "Krishna Paksha";
  nakshatraName: string;
  hinduMonth: string;
}

const TITHI_NAMES = [
  "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami",
  "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Purnima",
  "Pratipada","Dwitiya","Tritiya","Chaturthi","Panchami","Shashthi","Saptami","Ashtami","Navami","Dashami",
  "Ekadashi","Dwadashi","Trayodashi","Chaturdashi","Amavasya",
];

function computeDepartureTithi(
  date: string, time: string, place: Place,
): DepartureTithi {
  const [y, m, d] = date.split("-").map(Number);
  const [hh, mm] = (time || "12:00").split(":").map(Number);
  const tz = place.tz;
  const noonGuess = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
  const tzOff = tzOffsetHours(tz, noonGuess);
  const jd = localToJulianDayUT(y, m, d, (hh || 12) + (mm || 0) / 60, tzOff);
  const moon = planetPosition(jd, "Moon");

  // Nakshatra at the EXACT departure JD (not sunrise) — moon longitude / (360/27).
  const nakIdx = Math.floor(((moon.longitude % 360) + 360) % 360 / (360 / 27));
  const nakshatraName = NAKSHATRAS[nakIdx]?.name || "";

  // CANONICAL SHRADH TITHI: the tithi prevailing during APARAHNA KAAL of the death date.
  // This is what shastra (Garuda Purana, Nirnaya Sindhu) prescribes for shradh observance —
  // NOT the instant tithi at the moment of death and NOT the sunrise tithi. Using aparahna
  // here ensures the death tithi the calculator reports matches every standard panchang
  // and that the next-shradh-date scan (which also matches against aparahna) is consistent.
  const aparahna = aparahnaTithiOn(y, m, d, place);
  const tithiNumber = aparahna.number;
  const tithiInPaksha = ((tithiNumber - 1) % 15) + 1;
  const paksha = aparahna.paksha;

  // Hindu month is a sunrise/lunar-month concept — use the panchang helper at noon.
  const panchang = computeDailyPanchang(y, m, d, place);

  return {
    tithiNumber,
    tithiInPaksha,
    tithiName: TITHI_NAMES[tithiNumber - 1],
    paksha,
    nakshatraName,
    hinduMonth: panchang.hinduMonth.name,
  };
}

// ---------------------------------------------------------------------------
// Annual Shradh dates — Pitru Paksha (Krishna paksha of Bhadrapada amanta).
// For death tithi N (absolute 1..30), we look for the matching Krishna-paksha
// tithi during Aug 25 – Oct 25 of the target year. Special-case Purnima/Amavasya.
// ---------------------------------------------------------------------------

function targetAbsoluteTithi(deathTithi: number): number {
  if (deathTithi === 15) return 15;       // Bhadrapada Purnima (the day before Pitru Paksha begins)
  if (deathTithi === 30) return 30;       // Sarva Pitru Amavasya
  if (deathTithi <= 14) return deathTithi + 15;  // Shukla N → Krishna N
  return deathTithi;                       // Krishna N stays
}

export interface ShradhDate {
  year: number;
  date: string;        // YYYY-MM-DD
  weekday: string;
  tithiName: string;
  paksha: string;
  isPitruPaksha: boolean;
}

export type ShradhTradition = "pitru-paksha" | "pratisamvatsarik";

export function computeNextShradhDates(
  deathTithi: number,
  startYear: number,
  count: number,
  place: Place,
  tradition: ShradhTradition = "pitru-paksha",
  context?: { deathDate?: string; deathHinduMonth?: string | null },
): ShradhDate[] {
  if (tradition === "pratisamvatsarik") {
    return computePratisamvatsarikDates(deathTithi, startYear, count, place, context);
  }
  const out: ShradhDate[] = [];
  const target = targetAbsoluteTithi(deathTithi);

  for (let yi = 0; yi < count; yi++) {
    const year = startYear + yi;
    const candidates: ShradhDate[] = [];

    // Scan Aug 20 – Oct 20 — Pitru Paksha (Bhadrapada Krishna) always inside this range.
    const start = new Date(Date.UTC(year, 7, 20));
    const end   = new Date(Date.UTC(year, 9, 20));
    for (let t = start.getTime(); t <= end.getTime(); t += 86400000) {
      const d = new Date(t);
      const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate();
      try {
        // Match against the APARAHNA tithi — this is the kaal at which shradh is performed,
        // so it is the tithi that determines which civil date is the correct shradh date.
        const ap = aparahnaTithiOn(Y, M, D, place);
        if (ap.number !== target) continue;
        const p = computeDailyPanchang(Y, M, D, place);
        // For Purnima (15) we want Bhadrapada Purnima (the day before Pitru Paksha begins).
        // For all other targets, paksha must be Krishna AND month must be Bhadrapada or Ashwin
        // (the lunar-month names that bracket Pitru Paksha across amanta/purnimanta calendars).
        const monthOk = ["Bhadrapada", "Ashwin"].includes(p.hinduMonth.name);
        const pakshaOk = target === 15 ? true : ap.paksha === "Krishna Paksha";
        if (!pakshaOk || !monthOk) continue;
        candidates.push({
          year,
          date: p.date,
          weekday: p.weekday.en,
          tithiName: ap.name,
          paksha: ap.paksha,
          isPitruPaksha: true,
        });
      } catch { /* ephemeris glitch — skip */ }
    }
    // If multiple matches (rare adhik-maas years), prefer the one in mid-Sept (closest to Sep 20).
    if (candidates.length > 0) {
      const target0 = Date.UTC(year, 8, 20); // Sep 20
      candidates.sort((a, b) => Math.abs(new Date(a.date + "T00:00:00Z").getTime() - target0) - Math.abs(new Date(b.date + "T00:00:00Z").getTime() - target0));
      out.push(candidates[0]);
    }
  }
  return out;
}

// Pratisamvatsarik Shradh — observed every year on the same lunar tithi
// in the same Hindu lunar month the person died in. We scan a ±35-day
// window around the same Gregorian anniversary and return the day whose
// absolute tithi (1..30) matches deathTithi and whose Hindu month matches
// the recorded death-month. This is the convention for many Bengali,
// Maithili, Marathi and South Indian families.
function computePratisamvatsarikDates(
  deathTithi: number,
  startYear: number,
  count: number,
  place: Place,
  context?: { deathDate?: string; deathHinduMonth?: string | null },
): ShradhDate[] {
  const out: ShradhDate[] = [];
  if (!context?.deathDate) return out;
  const [, dmStr, ddStr] = context.deathDate.split("-");
  const dm = Number(dmStr); const dd = Number(ddStr);
  if (!dm || !dd) return out;
  const targetMonth = context.deathHinduMonth || null;

  for (let yi = 0; yi < count; yi++) {
    const year = startYear + yi;
    const anchor = Date.UTC(year, dm - 1, dd);
    const candidates: { date: string; tithiName: string; paksha: string; weekday: string; deltaDays: number }[] = [];
    for (let off = -35; off <= 35; off++) {
      const t = anchor + off * 86400000;
      const d = new Date(t);
      const Y = d.getUTCFullYear(), M = d.getUTCMonth() + 1, D = d.getUTCDate();
      try {
        // Match aparahna tithi (shradh kaal), not sunrise — see computeDepartureTithi note.
        const ap = aparahnaTithiOn(Y, M, D, place);
        if (ap.number !== deathTithi) continue;
        const p = computeDailyPanchang(Y, M, D, place);
        if (targetMonth && p.hinduMonth.name !== targetMonth) continue;
        candidates.push({
          date: p.date, tithiName: ap.name, paksha: ap.paksha, weekday: p.weekday.en, deltaDays: Math.abs(off),
        });
      } catch {}
    }
    if (candidates.length > 0) {
      candidates.sort((a, b) => a.deltaDays - b.deltaDays);
      const c = candidates[0];
      out.push({ year, date: c.date, weekday: c.weekday, tithiName: c.tithiName, paksha: c.paksha, isPitruPaksha: false });
    }
  }
  return out;
}

// ---------------------------------------------------------------------------
// Pitru Dosh advisor — rules-based interpretation. No AI involvement.
// ---------------------------------------------------------------------------
export interface DoshAssessment {
  hasPitruDosh: boolean;
  severity: "low" | "moderate" | "high";
  indicators: string[];
  recommendations: { title: string; body: string; href?: string }[];
  recommendedPackage: { slug: string; title: string; href: string };
}

function buildDoshAssessment(t: DepartureTithi): DoshAssessment {
  const indicators: string[] = [];
  let severity: "low" | "moderate" | "high" = "low";

  // Krishna Paksha Chaturdashi (death on Naraka Chaturdashi tithi) — strong indicator.
  if (t.tithiNumber === 29) {
    indicators.push("Departure on Krishna Chaturdashi (Naraka Chaturdashi) — classically associated with unrest of the departed soul if last rites were incomplete.");
    severity = "high";
  }
  // Amavasya departures — Pitru loka indicator; needs Tarpan on every Amavasya.
  if (t.tithiNumber === 30) {
    indicators.push("Amavasya departure — the soul is believed to belong directly to Pitru Loka; monthly Amavasya Tarpan is strongly recommended.");
    severity = severity === "high" ? "high" : "moderate";
  }
  // Departure during Pitru-bhakshana nakshatras (Magha, Mula, Ashlesha) — indicates Pitru attention.
  if (["Magha", "Mula", "Ashlesha", "Jyeshtha"].includes(t.nakshatraName)) {
    indicators.push(`Departure nakshatra is ${t.nakshatraName} — these nakshatras are linked to Pitru influence and call for Tripindi Shradh.`);
    severity = severity === "high" ? "high" : "moderate";
  }
  // Krishna Ekadashi / Dwadashi — vrat days; departing on these has special shradh requirements.
  if (t.tithiNumber === 26 || t.tithiNumber === 27) {
    indicators.push("Departure on Krishna Ekadashi/Dwadashi — annual Shradh on the same Ekadashi is shastric.");
  }

  // If nothing flagged, low severity.
  const hasPitruDosh = indicators.length > 0;
  if (!hasPitruDosh) {
    indicators.push("No specific shastric indicators of Pitru Dosh were detected from the departure tithi/nakshatra alone. A full kundli check is required for a complete diagnosis.");
  }

  // Recommendations always include three pillars: tarpan, annual Pind Daan, Brahman bhojan.
  const recommendations = [
    { title: "Annual Pind Daan during Pitru Paksha", body: "Perform Pind Daan with a karmakandi pandit on the death tithi during Pitru Paksha. We can do this remotely on your behalf at Gaya, Kashi or Haridwar.", href: "/pind-daan-booking" },
    { title: "Monthly Amavasya Tarpan", body: "Offer water with black sesame, kusha grass and barley on every Amavasya facing south, taking the departed soul’s name and gotra.", href: "/panchang-calendar" },
    { title: "Tripindi Shradh at Pishachmochan", body: severity === "high"
      ? "Strongly indicated — the special Tripindi Shradh at Pishachmochan Kund in Kashi is prescribed for ancestors with unfinished karma."
      : "If the next two Pitru Paksha Shradhs are not enough, escalate to Tripindi Shradh at Pishachmochan Kund.",
      href: "/pind-daan-kashi" },
    { title: "Daily Pitru Stotra path", body: "Recite the Pitru Stotra (Garuda Purana) every morning facing south, especially during Pitru Paksha." },
  ];

  // Recommended package: high → Kashi (most powerful for dosh), Amavasya → Gaya, otherwise → Haridwar.
  let recommendedPackage = { slug: "haridwar", title: "Pind Daan in Haridwar", href: "/pind-daan-haridwar" };
  if (severity === "high") recommendedPackage = { slug: "kashi", title: "Tripindi Shradh in Kashi", href: "/pind-daan-kashi" };
  else if (t.tithiNumber === 30) recommendedPackage = { slug: "gaya", title: "Pind Daan in Gaya", href: "/pind-daan-gaya" };

  return { hasPitruDosh, severity, indicators, recommendations, recommendedPackage };
}

// ---------------------------------------------------------------------------
// Identity helper — same client-trust shape as wave1.verifyUser.
// ---------------------------------------------------------------------------
async function verifyUser(req: Request): Promise<number | null> {
  const uid = Number(req.query.uid || req.body?.uid || 0);
  const email = String(req.query.email || req.body?.email || "").toLowerCase().trim();
  if (!uid || !email) return null;
  const u = await storage.getUser(uid);
  if (!u || u.email.toLowerCase() !== email) return null;
  return uid;
}

// ---------------------------------------------------------------------------
// Templates — short copy used for email + WhatsApp.
// ---------------------------------------------------------------------------
function reminderSubject(a: PitruAncestor, offset: number): string {
  if (offset === 0) return `Today is the Shradh tithi for ${a.name}`;
  if (offset === 1) return `Tomorrow is the Shradh tithi for ${a.name}`;
  return `Shradh of ${a.name} in ${offset} days`;
}

function reminderText(a: PitruAncestor, offset: number, shradhDate: string, siteUrl: string, bookingPath: string = "/pind-daan-booking"): string {
  const when = new Date(shradhDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const heading = offset === 0
    ? `Today (${when}) is the annual Shradh tithi for your ${a.relation}, ${a.name}.`
    : offset === 1
    ? `Tomorrow (${when}) is the annual Shradh tithi for your ${a.relation}, ${a.name}.`
    : `In one week (${when}) is the annual Shradh tithi for your ${a.relation}, ${a.name}.`;
  return [
    `Pranam,`,
    ``,
    heading,
    ``,
    `Tithi: ${a.tithiName} • ${a.paksha}${a.nakshatraName ? ` • Nakshatra: ${a.nakshatraName}` : ""}`,
    ``,
    `Per shastra, the day calls for Tarpan, Pind Daan and Brahman Bhojan in the name and gotra of the departed.`,
    ``,
    `If you cannot perform it yourself, our karmakandi pandits can do it on your behalf at Gaya, Kashi or Haridwar — with a Sankalp video call in your name and recorded proof.`,
    ``,
    `Book the right ritual: ${siteUrl}${bookingPath}`,
    ``,
    `— Vedic Tatva`,
  ].join("\n");
}

function reminderHtml(a: PitruAncestor, offset: number, shradhDate: string, siteUrl: string, bookingPath: string = "/pind-daan-booking"): string {
  const when = new Date(shradhDate).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" });
  const heading = offset === 0
    ? `Today (<strong>${when}</strong>) is the annual Shradh tithi for your ${a.relation}, <strong>${a.name}</strong>.`
    : offset === 1
    ? `Tomorrow (<strong>${when}</strong>) is the annual Shradh tithi for your ${a.relation}, <strong>${a.name}</strong>.`
    : `In one week (<strong>${when}</strong>) is the annual Shradh tithi for your ${a.relation}, <strong>${a.name}</strong>.`;
  return `<!doctype html><html><body style="margin:0;background:#FBF7EE;font-family:Georgia,serif;color:#3a2e25;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="border-top:3px solid #D4AF37;background:#fff;padding:28px 26px;border-radius:6px;border:1px solid #ead9a8;">
      <h1 style="margin:0 0 8px;font-size:18px;color:#6D2B35;font-weight:700;">Pitru Shradh Reminder</h1>
      <p style="margin:0 0 16px;font-size:14px;line-height:1.55;">${heading}</p>
      <table style="width:100%;font-size:13px;color:#5a4a3a;margin:0 0 20px;">
        <tr><td style="padding:4px 0;">Tithi</td><td style="padding:4px 0;text-align:right;color:#6D2B35;font-weight:600;">${a.tithiName} • ${a.paksha}</td></tr>
        ${a.nakshatraName ? `<tr><td style="padding:4px 0;">Nakshatra</td><td style="padding:4px 0;text-align:right;color:#6D2B35;font-weight:600;">${a.nakshatraName}</td></tr>` : ""}
        ${a.gotra ? `<tr><td style="padding:4px 0;">Gotra</td><td style="padding:4px 0;text-align:right;color:#6D2B35;font-weight:600;">${a.gotra}</td></tr>` : ""}
      </table>
      <p style="margin:0 0 16px;font-size:13px;line-height:1.55;">Per shastra, the day calls for Tarpan, Pind Daan and Brahman Bhojan in the name and gotra of the departed.</p>
      <a href="${siteUrl}${bookingPath}" style="display:inline-block;background:#6D2B35;color:#D4AF37;text-decoration:none;padding:10px 20px;border-radius:4px;font-size:13px;font-weight:700;letter-spacing:0.04em;">Book a Shradh Ritual</a>
      <p style="margin:24px 0 0;font-size:11px;color:#999;">Manage saved ancestors at <a href="${siteUrl}/spiritual-dashboard" style="color:#6D2B35;">your Vedic Tatva dashboard</a>.</p>
    </div>
  </div>
</body></html>`;
}

// ---------------------------------------------------------------------------
// Recompute & persist tithi metadata for an ancestor row.
// ---------------------------------------------------------------------------
async function refreshAncestorTithi(id: number) {
  const [row] = await db.select().from(pitruAncestors).where(eq(pitruAncestors.id, id));
  if (!row) return;
  const place: Place | null = (row.departureLat != null && row.departureLon != null && row.departureTz)
    ? { name: row.departurePlace, lat: row.departureLat, lon: row.departureLon, tz: row.departureTz }
    : resolvePlace(row.departurePlace);
  if (!place) return;
  const t = computeDepartureTithi(row.departureDate, row.departureTime || "12:00", place);
  await db.update(pitruAncestors).set({
    tithiNumber: t.tithiNumber,
    tithiName: t.tithiName,
    paksha: t.paksha,
    nakshatraName: t.nakshatraName,
    hinduMonth: t.hinduMonth,
    departureLat: place.lat,
    departureLon: place.lon,
    departureTz: place.tz,
    updatedAt: new Date(),
  }).where(eq(pitruAncestors.id, id));
}

// ---------------------------------------------------------------------------
// Scheduler — once an hour, look for any (ancestor, year) whose Shradh date
// is exactly {7, 1, 0} days away. Idempotency (unique index on
// ancestor/year/offset/channel) means hourly re-runs on the same day never
// produce duplicates. We deliberately do NOT dispatch reminders for
// intermediate days (T-6..T-2): those are not part of the product spec, and
// catching up on a missed T-7 by sending it on T-5 would feel like spam and
// give the user less than 7 days of lead time.
// ---------------------------------------------------------------------------
const REMINDER_OFFSETS = [7, 1, 0];

async function dispatchReminderTick() {
  try {
    const ancestors = await db.select().from(pitruAncestors);
    const now = new Date();
    const todayY = now.getUTCFullYear();
    const siteUrl = (process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "");

    for (const a of ancestors) {
      if (!a.tithiNumber) {
        await refreshAncestorTithi(a.id).catch(() => {});
        continue;
      }
      // Compute up to 2 candidate Shradh dates (this year & next) so end-of-year wraps work.
      const place: Place | null = (a.departureLat != null && a.departureLon != null && a.departureTz)
        ? { name: a.departurePlace, lat: a.departureLat, lon: a.departureLon, tz: a.departureTz }
        : resolvePlace(a.departurePlace);
      if (!place) continue;
      const dates = computeNextShradhDates(a.tithiNumber, todayY, 2, place, (a.shradhTradition as ShradhTradition) || "pitru-paksha", { deathDate: a.departureDate, deathHinduMonth: a.hinduMonth });
      // Derive per-ancestor recommended booking deep link from the dosh
      // assessment so reminders link to the right city/package
      // (Pishachmochan/Kashi for high severity, Gaya for Amavasya, etc).
      let bookingPath = "/pind-daan-booking";
      try {
        const tithiSnap: DepartureTithi = {
          tithiNumber: a.tithiNumber,
          tithiInPaksha: ((a.tithiNumber - 1) % 15) + 1,
          tithiName: a.tithiName || "",
          paksha: (a.paksha as "Shukla Paksha" | "Krishna Paksha") || "Krishna Paksha",
          nakshatraName: a.nakshatraName || "",
          hinduMonth: a.hinduMonth || "",
        };
        bookingPath = buildDoshAssessment(tithiSnap).recommendedPackage.href;
      } catch {}
      for (const sd of dates) {
        const shradhDay = new Date(sd.date + "T00:00:00Z");
        const todayUtc = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
        const diffDays = Math.round((shradhDay.getTime() - todayUtc.getTime()) / 86400000);
        if (!REMINDER_OFFSETS.includes(diffDays)) continue;

        const user = await storage.getUser(a.userId);
        if (!user) continue;

        // For each enabled channel, send if not already logged for this (ancestor, year, offset, channel).
        const channels: { name: "whatsapp" | "email"; enabled: boolean }[] = [
          { name: "whatsapp", enabled: !!a.notifyWhatsapp && !!user.phone },
          { name: "email", enabled: !!a.notifyEmail && !!user.email },
        ];

        for (const ch of channels) {
          if (!ch.enabled) continue;
          // Claim-first idempotency: insert a 'pending' row with the unique key.
          // If the unique index rejects, another worker/tick already owns this dispatch.
          let claimed = false;
          try {
            await db.insert(pitruReminderJobs).values({
              ancestorId: a.id,
              userId: a.userId,
              year: sd.year,
              offsetDays: diffDays,
              shradhDate: sd.date,
              channel: ch.name,
              status: "pending",
            });
            claimed = true;
          } catch { /* unique violation — another worker owns it */ }
          if (!claimed) continue;

          let status: "sent" | "failed" | "skipped" = "sent";
          let reason: string | null = null;

          try {
            if (ch.name === "email") {
              const subject = reminderSubject(a, diffDays);
              const r = await sendEmail({
                to: user.email,
                subject,
                text: reminderText(a, diffDays, sd.date, siteUrl, bookingPath),
                html: reminderHtml(a, diffDays, sd.date, siteUrl, bookingPath),
              });
              if (!r.sent) { status = "failed"; reason = r.error || "email send failed"; }
            } else {
              // WhatsApp — uses the existing MSG91 template.
              const when = new Date(sd.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
              const r = await sendWhatsApp({
                mobile: user.phone || "",
                bodyVariables: [
                  user.name || "Yajman",
                  a.name,
                  a.tithiName || "Shradh",
                  when,
                  diffDays === 0 ? "today" : diffDays === 1 ? "tomorrow" : `in ${diffDays} days`,
                ],
              });
              if (!r.ok) {
                // MSG91 returns approval/template errors as plain reason
                // strings — classify these as "skipped" so ops dashboards
                // don't treat a missing template approval as a real failure.
                const reasonLower = (r.reason || "").toLowerCase();
                const isConfigOrApproval =
                  reasonLower.includes("template") ||
                  reasonLower.includes("not configured") ||
                  reasonLower.includes("not approved") ||
                  reasonLower.includes("auth_key");
                status = isConfigOrApproval ? "skipped" : "failed";
                reason = r.reason || "wa send failed";
              }
            }
          } catch (e) {
            status = "failed";
            reason = e instanceof Error ? e.message : "dispatch threw";
          }

          // Finalise the claimed row with real status.
          await db.update(pitruReminderJobs)
            .set({ status, reason, sentAt: new Date() })
            .where(and(
              eq(pitruReminderJobs.ancestorId, a.id),
              eq(pitruReminderJobs.year, sd.year),
              eq(pitruReminderJobs.offsetDays, diffDays),
              eq(pitruReminderJobs.channel, ch.name),
            ))
            .catch(() => {});
        }
      }
    }
  } catch (e) {
    console.warn("[pitru-scheduler] tick error:", e instanceof Error ? e.message : e);
  }
}

export function startPitruReminderScheduler() {
  // First run after 90s (lets startup + DB migrations settle), then hourly.
  setTimeout(dispatchReminderTick, 90_000);
  setInterval(dispatchReminderTick, 60 * 60 * 1000);
  console.log("[pitru-scheduler] started (hourly tick, idempotent per ancestor+year+offset+channel)");
}

// ---------------------------------------------------------------------------
// Routes
// ---------------------------------------------------------------------------
const calculatorBodySchema = z.object({
  departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  departureTime: z.string().regex(/^\d{1,2}:\d{2}$/).optional(),
  departurePlace: z.string().min(1).max(120),
  shradhTradition: z.enum(["pitru-paksha", "pratisamvatsarik"]).optional(),
});

export function registerPitruRoutes(app: Express) {
  // ---- Public city autocomplete (no auth) ----
  app.get("/api/tools/places", (req: Request, res: Response) => {
    const q = String(req.query.q || "");
    res.json(searchCities(q, 12));
  });

  // ---- Public calculator (no auth) ----
  app.post("/api/tools/tithi-calculator", async (req: Request, res: Response) => {
    try {
      const parsed = calculatorBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: "Provide departureDate (YYYY-MM-DD), departurePlace, and optional departureTime (HH:MM)." });
      const place = resolvePlace(parsed.data.departurePlace);
      if (!place) return res.status(400).json({ error: `Place "${parsed.data.departurePlace}" not recognised. Please pick a city from the list — we use its IANA timezone for an accurate calculation.` });
      const tithi = computeDepartureTithi(parsed.data.departureDate, parsed.data.departureTime || "12:00", place);
      const dosh = buildDoshAssessment(tithi);
      const startYear = new Date().getUTCFullYear();
      const tradition = parsed.data.shradhTradition || "pitru-paksha";
      const shradhDates = computeNextShradhDates(tithi.tithiNumber, startYear, 5, place, tradition, {
        deathDate: parsed.data.departureDate,
        deathHinduMonth: tithi.hinduMonth,
      });
      res.json({ place, tithi, dosh, shradhDates, tradition, computedAt: new Date().toISOString() });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "calculation failed";
      console.error("[pitru calc]", msg);
      res.status(500).json({ error: msg });
    }
  });

  // ---- Ancestor CRUD (user-scoped) ----
  // Defined inline (rather than chaining .omit/.extend on the drizzle-zod
  // insert schema) because chained transforms lose field-level type inference
  // for fields whose columns have defaults (notifyWhatsapp / notifyEmail).
  const ancestorBodySchema = z.object({
    name: z.string().min(1).max(120),
    relation: z.string().min(1).max(60),
    gotra: z.string().max(120).nullable().optional(),
    departureDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    departureTime: z.string().regex(/^\d{1,2}:\d{2}$/).nullable().optional(),
    departurePlace: z.string().min(1).max(120),
    departureLat: z.number().nullable().optional(),
    departureLon: z.number().nullable().optional(),
    departureTz: z.string().nullable().optional(),
    notifyWhatsapp: z.boolean().optional(),
    notifyEmail: z.boolean().optional(),
    notes: z.string().max(2000).nullable().optional(),
    shradhTradition: z.enum(["pitru-paksha", "pratisamvatsarik"]).optional(),
  });

  app.get("/api/pitru/ancestors", async (req, res) => {
    try {
      const uid = await verifyUser(req);
      if (!uid) return res.status(403).json({ error: "Identity check failed" });
      const rows = await db.select().from(pitruAncestors).where(eq(pitruAncestors.userId, uid)).orderBy(desc(pitruAncestors.id));

      // Hydrate next Shradh date for each ancestor so the UI can show it.
      const startYear = new Date().getUTCFullYear();
      const out = await Promise.all(rows.map(async (a) => {
        let nextShradh: ShradhDate | null = null;
        if (a.tithiNumber) {
          const place: Place | null = (a.departureLat != null && a.departureLon != null && a.departureTz)
            ? { name: a.departurePlace, lat: a.departureLat, lon: a.departureLon, tz: a.departureTz }
            : resolvePlace(a.departurePlace);
          if (place) {
            try {
              const next = computeNextShradhDates(a.tithiNumber, startYear, 2, place, (a.shradhTradition as ShradhTradition) || "pitru-paksha", { deathDate: a.departureDate, deathHinduMonth: a.hinduMonth });
              const today = new Date(); const t0 = today.toISOString().slice(0, 10);
              nextShradh = next.find(d => d.date >= t0) || next[0] || null;
            } catch {}
          }
        }
        let recommendedHref = "/pind-daan-booking";
        try {
          if (a.tithiNumber) {
            recommendedHref = buildDoshAssessment({
              tithiNumber: a.tithiNumber,
              tithiInPaksha: ((a.tithiNumber - 1) % 15) + 1,
              tithiName: a.tithiName || "",
              paksha: (a.paksha as "Shukla Paksha" | "Krishna Paksha") || "Krishna Paksha",
              nakshatraName: a.nakshatraName || "",
              hinduMonth: a.hinduMonth || "",
            }).recommendedPackage.href;
          }
        } catch {}
        // Next concrete reminder date = next of T-7 / T-1 / T-0 still in
        // the future, relative to the upcoming Shradh.
        let nextReminder: { date: string; offsetDays: number } | null = null;
        if (nextShradh) {
          const todayMs = Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), new Date().getUTCDate());
          const shradhMs = Date.parse(nextShradh.date + "T00:00:00Z");
          for (const off of [7, 1, 0]) {
            const d = new Date(shradhMs - off * 86400000);
            if (d.getTime() >= todayMs) {
              nextReminder = { date: d.toISOString().slice(0, 10), offsetDays: off };
              break;
            }
          }
        }
        return { ...a, nextShradh, nextReminder, recommendedHref };
      }));
      res.json(out);
    } catch (e) { const msg = e instanceof Error ? e.message : "error"; res.status(500).json({ error: msg }); }
  });

  app.post("/api/pitru/ancestors", async (req, res) => {
    try {
      const uid = await verifyUser(req);
      if (!uid) return res.status(403).json({ error: "Identity check failed" });
      const parsed = ancestorBodySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const place = resolvePlace(parsed.data.departurePlace);
      if (!place) return res.status(400).json({ error: `Place "${parsed.data.departurePlace}" not recognised. Please pick a city from the list.` });
      const t = computeDepartureTithi(parsed.data.departureDate, parsed.data.departureTime || "12:00", place);
      const [row] = await db.insert(pitruAncestors).values({
        ...parsed.data,
        userId: uid,
        departureLat: place.lat,
        departureLon: place.lon,
        departureTz: place.tz,
        tithiNumber: t.tithiNumber,
        tithiName: t.tithiName,
        paksha: t.paksha,
        nakshatraName: t.nakshatraName,
        hinduMonth: t.hinduMonth,
      }).returning();
      res.json(row);
    } catch (e) { const msg = e instanceof Error ? e.message : "error"; res.status(500).json({ error: msg }); }
  });

  app.patch("/api/pitru/ancestors/:id", async (req, res) => {
    try {
      const uid = await verifyUser(req);
      if (!uid) return res.status(403).json({ error: "Identity check failed" });
      const id = Number(req.params.id);
      const [existing] = await db.select().from(pitruAncestors).where(and(eq(pitruAncestors.id, id), eq(pitruAncestors.userId, uid)));
      if (!existing) return res.status(404).json({ error: "Not found" });
      const parsed = ancestorBodySchema.partial().safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const merged: PitruAncestor = { ...existing, ...parsed.data, updatedAt: new Date() } as PitruAncestor;
      // If departure details changed, recompute place + tithi.
      if (parsed.data.departureDate || parsed.data.departureTime || parsed.data.departurePlace) {
        const place = resolvePlace(merged.departurePlace);
        if (!place) return res.status(400).json({ error: `Place "${merged.departurePlace}" not recognised. Please pick a city from the list.` });
        const t = computeDepartureTithi(merged.departureDate, merged.departureTime || "12:00", place);
        merged.departureLat = place.lat;
        merged.departureLon = place.lon;
        merged.departureTz = place.tz;
        merged.tithiNumber = t.tithiNumber;
        merged.tithiName = t.tithiName;
        merged.paksha = t.paksha;
        merged.nakshatraName = t.nakshatraName;
        merged.hinduMonth = t.hinduMonth;
      }
      const { id: _omit, createdAt: _c, ...patch } = merged;
      const [updated] = await db.update(pitruAncestors).set(patch).where(eq(pitruAncestors.id, id)).returning();
      res.json(updated);
    } catch (e) { const msg = e instanceof Error ? e.message : "error"; res.status(500).json({ error: msg }); }
  });

  app.delete("/api/pitru/ancestors/:id", async (req, res) => {
    try {
      const uid = await verifyUser(req);
      if (!uid) return res.status(403).json({ error: "Identity check failed" });
      const id = Number(req.params.id);
      const result = await db.delete(pitruAncestors).where(and(eq(pitruAncestors.id, id), eq(pitruAncestors.userId, uid))).returning({ id: pitruAncestors.id });
      if (result.length === 0) return res.status(404).json({ error: "Not found" });
      // Cascade — remove logged jobs so the user does not see history of a deleted ancestor.
      await db.delete(pitruReminderJobs).where(eq(pitruReminderJobs.ancestorId, id));
      res.json({ ok: true });
    } catch (e) { const msg = e instanceof Error ? e.message : "error"; res.status(500).json({ error: msg }); }
  });

  // ---- Admin telemetry ----
  app.get("/api/admin/pitru/jobs", adminAuthMiddleware, async (_req, res) => {
    try {
      const rows = await db.select().from(pitruReminderJobs).orderBy(desc(pitruReminderJobs.sentAt)).limit(200);
      const totals = await db.select({ status: pitruReminderJobs.status, n: sql<number>`count(*)::int` })
        .from(pitruReminderJobs).groupBy(pitruReminderJobs.status);
      // Last-30-days metrics so the admin sees recent dispatch volume
      // (not just lifetime counts) — matches the task acceptance text.
      const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
      const totals30d = await db.select({ status: pitruReminderJobs.status, n: sql<number>`count(*)::int` })
        .from(pitruReminderJobs)
        .where(sql`${pitruReminderJobs.sentAt} >= ${thirtyDaysAgo}`)
        .groupBy(pitruReminderJobs.status);
      const ancestorTotal = await db.select({ n: sql<number>`count(*)::int` }).from(pitruAncestors);
      res.json({ rows, totals, totals30d, ancestors: ancestorTotal[0]?.n || 0 });
    } catch (e) { const msg = e instanceof Error ? e.message : "error"; res.status(500).json({ error: msg }); }
  });
}
