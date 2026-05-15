import { db } from "./db";
import { pujaTypes, pujaMuhurats } from "@shared/schema";
import { eq, and } from "drizzle-orm";

// Lightweight, deterministic muhurat generator. Uses Hindu month / tithi
// rules attached to each puja_type via muhuratRules. Produces a list of
// auspicious dates for a given calendar year. Does NOT call any external
// panchang API — instead uses a curated table of well-known festival dates
// per Gregorian year (admin can override per puja with manual entries).

// Curated festival → Gregorian date table. Maintained by hand for
// upcoming years. Add more years here as needed.
const FESTIVAL_DATES: Record<number, Record<string, string>> = {
  2026: {
    "makar-sankranti": "2026-01-14",
    "vasant-panchami": "2026-01-23",
    "maha-shivratri": "2026-02-15",
    "holi": "2026-03-04",
    "ram-navami": "2026-03-26",
    "hanuman-jayanti": "2026-04-02",
    "akshaya-tritiya": "2026-04-19",
    "guru-purnima": "2026-07-29",
    "raksha-bandhan": "2026-08-28",
    "krishna-janmashtami": "2026-09-04",
    "ganesh-chaturthi": "2026-09-14",
    "navratri-start": "2026-10-11",
    "dussehra": "2026-10-20",
    "karwa-chauth": "2026-10-29",
    "dhanteras": "2026-11-07",
    "diwali": "2026-11-09",
    "lakshmi-puja": "2026-11-09",
    "govardhan-puja": "2026-11-10",
    "bhai-dooj": "2026-11-11",
    "tulsi-vivah": "2026-11-22",
    "kartik-purnima": "2026-11-24",
  },
  2027: {
    "makar-sankranti": "2027-01-14",
    "vasant-panchami": "2027-02-11",
    "maha-shivratri": "2027-03-06",
    "holi": "2027-03-23",
    "ram-navami": "2027-04-15",
    "hanuman-jayanti": "2027-04-21",
    "akshaya-tritiya": "2027-05-09",
    "guru-purnima": "2027-07-19",
    "raksha-bandhan": "2027-08-17",
    "krishna-janmashtami": "2027-08-25",
    "ganesh-chaturthi": "2027-09-04",
    "navratri-start": "2027-10-01",
    "dussehra": "2027-10-09",
    "karwa-chauth": "2027-10-18",
    "dhanteras": "2027-10-27",
    "diwali": "2027-10-29",
    "lakshmi-puja": "2027-10-29",
    "govardhan-puja": "2027-10-30",
    "bhai-dooj": "2027-10-31",
    "tulsi-vivah": "2027-11-12",
    "kartik-purnima": "2027-11-14",
  },
};

// Approximate Ekadashi dates per year. Used by deity pujas tied to Ekadashi
// (e.g. Vishnu, Krishna). Curated; no astronomical calc.
const EKADASHI_DATES: Record<number, string[]> = {
  2026: [
    "2026-01-09", "2026-01-25", "2026-02-08", "2026-02-23",
    "2026-03-09", "2026-03-25", "2026-04-08", "2026-04-23",
    "2026-05-08", "2026-05-22", "2026-06-06", "2026-06-21",
    "2026-07-05", "2026-07-20", "2026-08-04", "2026-08-19",
    "2026-09-02", "2026-09-17", "2026-10-02", "2026-10-17",
    "2026-10-31", "2026-11-15", "2026-11-30", "2026-12-15", "2026-12-29",
  ],
  2027: [
    "2027-01-13", "2027-01-28", "2027-02-12", "2027-02-27",
    "2027-03-13", "2027-03-28", "2027-04-12", "2027-04-27",
    "2027-05-12", "2027-05-26", "2027-06-10", "2027-06-25",
    "2027-07-10", "2027-07-24", "2027-08-08", "2027-08-23",
    "2027-09-07", "2027-09-21", "2027-10-06", "2027-10-21",
    "2027-11-04", "2027-11-19", "2027-12-04", "2027-12-19",
  ],
};

// Pradosh Vrat dates (Trayodashi) — Shiva pujas
const PRADOSH_DATES: Record<number, string[]> = {
  2026: [
    "2026-01-11", "2026-01-26", "2026-02-09", "2026-02-25",
    "2026-03-11", "2026-03-26", "2026-04-09", "2026-04-25",
    "2026-05-09", "2026-05-24", "2026-06-08", "2026-06-23",
    "2026-07-07", "2026-07-22", "2026-08-06", "2026-08-21",
    "2026-09-04", "2026-09-19", "2026-10-04", "2026-10-19",
    "2026-11-02", "2026-11-17", "2026-12-02", "2026-12-17", "2026-12-31",
  ],
  2027: [
    "2027-01-15", "2027-01-30", "2027-02-14", "2027-03-01",
    "2027-03-15", "2027-03-30", "2027-04-14", "2027-04-29",
    "2027-05-14", "2027-05-28", "2027-06-12", "2027-06-27",
    "2027-07-12", "2027-07-26", "2027-08-10", "2027-08-25",
    "2027-09-09", "2027-09-23", "2027-10-08", "2027-10-23",
    "2027-11-06", "2027-11-21", "2027-12-06", "2027-12-21",
  ],
};

// Purnima (full moon) — Lakshmi, Satyanarayan
const PURNIMA_DATES: Record<number, string[]> = {
  2026: [
    "2026-01-22", "2026-02-21", "2026-03-22", "2026-04-21",
    "2026-05-20", "2026-06-19", "2026-07-29", "2026-08-28",
    "2026-09-26", "2026-10-25", "2026-11-24", "2026-12-23",
  ],
  2027: [
    "2027-01-22", "2027-02-20", "2027-03-21", "2027-04-20",
    "2027-05-19", "2027-06-18", "2027-07-18", "2027-08-16",
    "2027-09-15", "2027-10-14", "2027-11-13", "2027-12-13",
  ],
};

interface MuhuratEntry {
  date: string;       // YYYY-MM-DD
  label: string;      // human-readable
  time?: string;      // optional auspicious window
  note?: string;
}

interface MuhuratRule {
  type: "festival" | "ekadashi" | "pradosh" | "purnima" | "weekday" | "amavasya";
  festival?: string;  // festival key when type=festival
  weekday?: number;   // 0-6 (Sun-Sat)
  label?: string;
  time?: string;
  limit?: number;     // cap weekday entries to N occurrences
}

// Friday + (Amavasya / Purnima) for Lakshmi style; weekday rules used sparingly
function generateWeekdayDates(year: number, weekday: number, limit = 12): string[] {
  const out: string[] = [];
  const d = new Date(Date.UTC(year, 0, 1));
  while (d.getUTCFullYear() === year && out.length < limit * 4) {
    if (d.getUTCDay() === weekday) {
      out.push(d.toISOString().slice(0, 10));
    }
    d.setUTCDate(d.getUTCDate() + 1);
  }
  // Pick evenly spaced dates so we don't dump 52 Fridays
  const step = Math.max(1, Math.floor(out.length / limit));
  return out.filter((_, i) => i % step === 0).slice(0, limit);
}

const WEEKDAY_LABELS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export function computeMuhuratsForPuja(
  rules: MuhuratRule[],
  year: number,
): MuhuratEntry[] {
  const entries: MuhuratEntry[] = [];
  const seen = new Set<string>();

  for (const rule of rules || []) {
    switch (rule.type) {
      case "festival": {
        const date = FESTIVAL_DATES[year]?.[rule.festival || ""];
        if (date && !seen.has(date)) {
          entries.push({
            date,
            label: rule.label || (rule.festival || "Festival").replace(/-/g, " "),
            time: rule.time,
            note: "Major festival muhurat",
          });
          seen.add(date);
        }
        break;
      }
      case "ekadashi": {
        const list = EKADASHI_DATES[year] || [];
        for (const date of list.slice(0, rule.limit || 12)) {
          if (!seen.has(date)) {
            entries.push({ date, label: rule.label || "Ekadashi Vrat", time: rule.time });
            seen.add(date);
          }
        }
        break;
      }
      case "pradosh": {
        const list = PRADOSH_DATES[year] || [];
        for (const date of list.slice(0, rule.limit || 12)) {
          if (!seen.has(date)) {
            entries.push({ date, label: rule.label || "Pradosh Vrat", time: rule.time || "Pradosh Kaal (sunset ± 45 min)" });
            seen.add(date);
          }
        }
        break;
      }
      case "purnima": {
        const list = PURNIMA_DATES[year] || [];
        for (const date of list.slice(0, rule.limit || 12)) {
          if (!seen.has(date)) {
            entries.push({ date, label: rule.label || "Purnima", time: rule.time });
            seen.add(date);
          }
        }
        break;
      }
      case "weekday": {
        if (typeof rule.weekday !== "number") break;
        const dates = generateWeekdayDates(year, rule.weekday, rule.limit || 12);
        for (const date of dates) {
          if (!seen.has(date)) {
            entries.push({
              date,
              label: rule.label || `${WEEKDAY_LABELS[rule.weekday]} muhurat`,
              time: rule.time,
            });
            seen.add(date);
          }
        }
        break;
      }
    }
  }

  // Sort chronologically
  entries.sort((a, b) => a.date.localeCompare(b.date));
  return entries;
}

export interface RegenerateResult {
  pujasProcessed: number;
  yearsProcessed: number[];
  inserted: number;
  updated: number;
  skipped: number;
}

export async function regenerateMuhuratsForYear(year: number): Promise<RegenerateResult> {
  const result: RegenerateResult = { pujasProcessed: 0, yearsProcessed: [year], inserted: 0, updated: 0, skipped: 0 };
  const allPujas = await db.select().from(pujaTypes);
  for (const puja of allPujas) {
    result.pujasProcessed += 1;
    const rules = (puja.muhuratRules as MuhuratRule[]) || [];
    if (!Array.isArray(rules) || rules.length === 0) {
      result.skipped += 1;
      continue;
    }
    const muhurats = computeMuhuratsForPuja(rules, year);
    if (muhurats.length === 0) {
      result.skipped += 1;
      continue;
    }
    const existing = await db.select().from(pujaMuhurats).where(
      and(eq(pujaMuhurats.pujaId, puja.id), eq(pujaMuhurats.year, year)),
    );
    if (existing.length) {
      await db.update(pujaMuhurats)
        .set({ muhurats: muhurats as any, generatedAt: new Date() })
        .where(eq(pujaMuhurats.id, existing[0].id));
      result.updated += 1;
    } else {
      await db.insert(pujaMuhurats).values({
        pujaId: puja.id,
        year,
        muhurats: muhurats as any,
      });
      result.inserted += 1;
    }
  }
  return result;
}

export async function regenerateForCurrentAndNextYear(): Promise<RegenerateResult> {
  const y = new Date().getFullYear();
  const a = await regenerateMuhuratsForYear(y);
  const b = await regenerateMuhuratsForYear(y + 1);
  return {
    pujasProcessed: Math.max(a.pujasProcessed, b.pujasProcessed),
    yearsProcessed: [y, y + 1],
    inserted: a.inserted + b.inserted,
    updated: a.updated + b.updated,
    skipped: a.skipped + b.skipped,
  };
}
