// Vimshottari Dasha — deterministic computation from Moon's birth nakshatra.
// Total cycle = 120 years. Each nakshatra (13°20') is governed by one of 9 dasha lords.
// Balance of birth dasha = (lord's full years) * (remaining fraction of nakshatra).

import { VIMSHOTTARI, NAKSHATRA_DASHA_LORDS } from "./data";

export interface DashaPeriod {
  lord: string;
  startISO: string;       // ISO timestamp UTC
  endISO: string;
  startJD: number;
  endJD: number;
  lengthYears: number;
}

export interface DashaSnapshot {
  current: { mahadasha: DashaPeriod; antardasha: DashaPeriod; pratyantardasha: DashaPeriod };
  mahadashas: DashaPeriod[];                 // full sequence covering ~120 years from birth
  upcomingAntardashas: DashaPeriod[];         // antardashas inside the current mahadasha
}

const SOLAR_YEAR_DAYS = 365.2422; // tropical year

function cycleLordsFrom(startLord: string): string[] {
  const idx = VIMSHOTTARI.findIndex(v => v.lord === startLord);
  if (idx < 0) throw new Error("Unknown dasha lord " + startLord);
  return [...VIMSHOTTARI.slice(idx), ...VIMSHOTTARI.slice(0, idx)].map(v => v.lord);
}

function yearsOfLord(lord: string): number {
  const v = VIMSHOTTARI.find(x => x.lord === lord);
  if (!v) throw new Error("Unknown dasha lord " + lord);
  return v.years;
}

function jdToISO(jd: number): string {
  const ms = (jd - 2440587.5) * 86400000;
  return new Date(ms).toISOString();
}

/**
 * Compute Vimshottari Dasha sequence from birth Moon longitude.
 * @param moonLongitude sidereal longitude of Moon at birth (degrees, 0..360)
 * @param birthJD birth Julian Day (UT)
 * @param atJD optional "now" JD for current dasha lookup; defaults to current moment
 */
export function computeVimshottariDasha(moonLongitude: number, birthJD: number, atJD?: number): DashaSnapshot {
  const nakSize = 360 / 27;
  const nakIdx = Math.floor(moonLongitude / nakSize);
  const portionTraversed = (moonLongitude - nakIdx * nakSize) / nakSize; // 0..1
  const portionRemaining = 1 - portionTraversed;

  const birthLord = NAKSHATRA_DASHA_LORDS[nakIdx];
  const balanceYears = yearsOfLord(birthLord) * portionRemaining;

  // Build all mahadashas starting from birth
  const lords = cycleLordsFrom(birthLord);
  const mahadashas: DashaPeriod[] = [];
  let cursorJD = birthJD;

  // First mahadasha is partial (only the balance)
  const firstLen = balanceYears;
  const firstEndJD = cursorJD + firstLen * SOLAR_YEAR_DAYS;
  mahadashas.push({
    lord: lords[0],
    startJD: cursorJD,
    endJD: firstEndJD,
    startISO: jdToISO(cursorJD),
    endISO: jdToISO(firstEndJD),
    lengthYears: firstLen,
  });
  cursorJD = firstEndJD;

  // Remaining mahadashas (full duration each), enough to cover 120 years total
  for (let i = 1; i < lords.length; i++) {
    const len = yearsOfLord(lords[i]);
    const endJD = cursorJD + len * SOLAR_YEAR_DAYS;
    mahadashas.push({
      lord: lords[i],
      startJD: cursorJD,
      endJD,
      startISO: jdToISO(cursorJD),
      endISO: jdToISO(endJD),
      lengthYears: len,
    });
    cursorJD = endJD;
  }

  const nowJD = atJD ?? (Date.now() / 86400000 + 2440587.5);
  const currentMd = mahadashas.find(m => nowJD >= m.startJD && nowJD < m.endJD) ?? mahadashas[0];

  // Build antardashas inside the current mahadasha. The antardasha sequence within
  // a mahadasha starts with the mahadasha's own lord, and each antardasha length
  // is mahadasha_years * antardasha_lord_years / 120.
  const antarLords = cycleLordsFrom(currentMd.lord);
  const antardashas: DashaPeriod[] = [];
  let aCursor = currentMd.startJD;
  for (const al of antarLords) {
    const lenYears = (currentMd.lengthYears * yearsOfLord(al)) / 120;
    const endJD = aCursor + lenYears * SOLAR_YEAR_DAYS;
    antardashas.push({
      lord: al,
      startJD: aCursor,
      endJD,
      startISO: jdToISO(aCursor),
      endISO: jdToISO(endJD),
      lengthYears: lenYears,
    });
    aCursor = endJD;
  }
  const currentAd = antardashas.find(a => nowJD >= a.startJD && nowJD < a.endJD) ?? antardashas[0];

  // Pratyantardashas inside the current antardasha
  const pratLords = cycleLordsFrom(currentAd.lord);
  let pCursor = currentAd.startJD;
  let currentPd: DashaPeriod = { lord: pratLords[0], startJD: pCursor, endJD: pCursor, startISO: jdToISO(pCursor), endISO: jdToISO(pCursor), lengthYears: 0 };
  for (const pl of pratLords) {
    const lenYears = (currentAd.lengthYears * yearsOfLord(pl)) / 120;
    const endJD = pCursor + lenYears * SOLAR_YEAR_DAYS;
    if (nowJD >= pCursor && nowJD < endJD) {
      currentPd = { lord: pl, startJD: pCursor, endJD, startISO: jdToISO(pCursor), endISO: jdToISO(endJD), lengthYears: lenYears };
      break;
    }
    pCursor = endJD;
  }

  return {
    current: { mahadasha: currentMd, antardasha: currentAd, pratyantardasha: currentPd },
    mahadashas,
    upcomingAntardashas: antardashas,
  };
}
