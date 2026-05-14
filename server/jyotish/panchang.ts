// Deterministic Panchang for any local date + location.
// Computes tithi, nakshatra, yoga, karana, paksha, sunrise/sunset, rahu kaal, yamaganda,
// gulika, abhijit muhurat, brahma muhurat, hindu month (amanta), Vikram Samvat.
//
// All times are calculated from Swiss Ephemeris using Lahiri ayanamsa — zero AI involved
// for any astronomical fact. AI may be layered on top for narrative/interpretation only.

import {
  julianDayUT, localToJulianDayUT, tzOffsetHours, planetPosition, jdToDate,
  formatJDLocal12h, ayanamsa, nextSunrise, nextSunset, nextMeridianTransit,
  nextMoonrise, nextMoonset,
} from "./ephemeris";
import {
  TITHI_NAMES, TITHI_NAMES_HI, NAKSHATRAS, YOGAS, YOGAS_HI, KARANA_NAMES, KARANA_NAMES_HI,
  WEEKDAYS_EN, WEEKDAYS_HI, WEEKDAY_LORDS,
  RAHU_KAAL_SEGMENT, YAMAGANDA_SEGMENT, GULIKA_SEGMENT,
  LUNAR_MONTH_FROM_SUN_SIGN, LUNAR_MONTH_FROM_SUN_SIGN_HI,
} from "./data";

export interface DailyPanchang {
  date: string;          // YYYY-MM-DD local
  location: { name: string; lat: number; lon: number; tz: string };
  weekday: { en: string; hi: string; lord: string };
  sunrise: string;
  sunset: string;
  solarNoon: string;
  moonrise: string;
  moonset: string;
  dayLengthHours: number;
  tithi: { number: number; name: string; nameHi: string; paksha: string; pakshaHi: string; endsAt: string; endsAtISO: string | null };
  nakshatra: { number: number; name: string; nameHi: string; lord: string; deity: string; pada: number; endsAt: string; endsAtISO: string | null };
  yoga: { number: number; name: string; nameHi: string; endsAt: string; endsAtISO: string | null };
  karana: { number: number; name: string; nameHi: string; endsAt: string; endsAtISO: string | null };
  hinduMonth: { name: string; nameHi: string; scheme: "Amanta" };
  vikramSamvat: number;
  shakaSamvat: number;
  rahuKaal: { start: string; end: string };
  yamaganda: { start: string; end: string };
  gulikaKaal: { start: string; end: string };
  abhijitMuhurat: { start: string; end: string };
  brahmaMuhurat: { start: string; end: string };
  ayanamsaDeg: number;
  method: string;
  computedAt: string;
}

function fmtRange(startJD: number | null, endJD: number | null, tz: string) {
  return { start: formatJDLocal12h(startJD, tz), end: formatJDLocal12h(endJD, tz) };
}

function jdToISO(jd: number | null): string | null {
  if (jd == null) return null;
  return jdToDate(jd).toISOString();
}

/**
 * Find the JD where Sun-Moon angular difference next reaches the next multiple of `step` degrees.
 * Used for tithi (step=12), nakshatra (Moon only, step=360/27), yoga (step=360/27).
 */
function findNextEvent(jdStart: number, currentValue: number, step: number, derive: (jd: number) => { value: number; rate: number }, maxIters = 25): number | null {
  let jd = jdStart;
  // target = next multiple of step strictly greater than currentValue
  const targetIndex = Math.floor(currentValue / step) + 1;
  const target = targetIndex * step;
  let iters = 0;
  while (iters++ < maxIters) {
    const { value, rate } = derive(jd);
    let delta = target - value;
    // Handle 360 wrap: if rate is positive but value has wrapped past 360, we've already passed target
    if (rate > 0 && delta < -180) delta += 360;
    if (rate > 0 && delta > 360) delta -= 360;
    if (Math.abs(delta) < 0.001 || Math.abs(rate) < 1e-6) return jd;
    const dt = delta / rate; // days
    jd += dt;
    if (Math.abs(dt) < 1e-5) return jd;
  }
  return jd; // approximate
}

function tithiAt(jd: number) {
  const sun = planetPosition(jd, "Sun");
  const moon = planetPosition(jd, "Moon");
  const diff = ((moon.longitude - sun.longitude) % 360 + 360) % 360;
  return { value: diff, rate: moon.speed - sun.speed, sun, moon };
}

function nakshatraAt(jd: number) {
  const moon = planetPosition(jd, "Moon");
  return { value: moon.longitude, rate: moon.speed, moon };
}

function yogaAt(jd: number) {
  const sun = planetPosition(jd, "Sun");
  const moon = planetPosition(jd, "Moon");
  const sumLon = ((sun.longitude + moon.longitude) % 360 + 360) % 360;
  return { value: sumLon, rate: sun.speed + moon.speed };
}

/**
 * Compute karana index (0..10). 60 karanas span a lunar month; 7 movable repeat 8 times,
 * sandwiched by 4 fixed. We map the 60 half-tithis to the 11 karana names.
 */
function karanaFromTithiHalfIndex(halfIndex: number): { idx: number; nameIdx: number } {
  // halfIndex is 0..59 within the lunar month
  // Sequence: positions 0..56 = movable (Bava..Vishti repeating 8 times)
  // positions 57=Shakuni, 58=Chatushpada, 59=Naga, 0 (start of next month)=Kimstughna
  // But karana #0 of a new month is Kimstughna and then Bava etc.
  // To match Drik convention: half 0 = Kimstughna (lord of the very first half after amavasya end)
  // ... this gets nuanced. Simpler accepted scheme:
  //   half 1..56 => (half-1) mod 7 => Bava..Vishti (movable indices 0..6)
  //   half 57 => Shakuni (idx 7)
  //   half 58 => Chatushpada (idx 8)
  //   half 59 => Naga (idx 9)
  //   half 0  => Kimstughna (idx 10) — only the FIRST half-tithi of new month
  if (halfIndex === 0) return { idx: halfIndex, nameIdx: 10 }; // Kimstughna
  if (halfIndex === 57) return { idx: halfIndex, nameIdx: 7 }; // Shakuni
  if (halfIndex === 58) return { idx: halfIndex, nameIdx: 8 }; // Chatushpada
  if (halfIndex === 59) return { idx: halfIndex, nameIdx: 9 }; // Naga
  return { idx: halfIndex, nameIdx: ((halfIndex - 1) % 7) }; // Bava..Vishti
}

/**
 * Find the JD of the most recent amavasya (Sun-Moon angle returning to 0/360) before given JD.
 * Used to determine lunar month start.
 */
function findPrevAmavasya(jd: number): number {
  // Step back day by day looking for a day where (M-S) wraps from <12 to >348 going backward
  // Better: look for the day where current diff = small or just-after-360 going forward.
  // Strategy: scan backward at 1-day steps for ~30 days, find an interval [d-1, d] where
  // (diff at d-1) > (diff at d), implying wrap; then refine by Newton.
  let best = jd;
  for (let i = 0; i < 35; i++) {
    const j2 = jd - i;
    const j1 = j2 - 1;
    const v2 = ((planetPosition(j2, "Moon").longitude - planetPosition(j2, "Sun").longitude) % 360 + 360) % 360;
    const v1 = ((planetPosition(j1, "Moon").longitude - planetPosition(j1, "Sun").longitude) % 360 + 360) % 360;
    // amavasya happens when value crosses from ~360 down to ~0 (going forward in time)
    // i.e., v1 high (~340-360), v2 low (~0-20)
    if (v1 > 340 && v2 < 20) {
      // refine: find when diff = 0 between j1 and j2
      let lo = j1, hi = j2;
      for (let k = 0; k < 30; k++) {
        const mid = (lo + hi) / 2;
        const vm = ((planetPosition(mid, "Moon").longitude - planetPosition(mid, "Sun").longitude) % 360 + 360) % 360;
        // We want the first crossing where diff jumps from ~360 to ~0
        if (vm > 180) lo = mid; else hi = mid;
        if (hi - lo < 1e-4) break;
      }
      best = (lo + hi) / 2;
      return best;
    }
  }
  return jd; // fallback
}

function vikramSamvat(year: number, month: number): number {
  // Vikram Samvat = Greg + 57 from approx Mar 22 (Chaitra Pratipada) onwards, else +56.
  // Approximation: month >= 4 -> +57; month == 3 and day >= 22 -> +57; else +56.
  return month >= 4 ? year + 57 : year + 56;
}

function shakaSamvat(year: number, month: number): number {
  return month >= 4 ? year - 78 : year - 79;
}

/**
 * Main function — produces a complete deterministic panchang.
 *
 * @param year, month, day local civil date
 * @param location includes lat, lon, tz IANA name, display name
 */
/**
 * Tithi prevailing during APARAHNA KAAL (4th of 5 equal day-divisions from sunrise to sunset).
 * This is the canonical kaal for shradh observance — every shastra (Garuda Purana, Nirnaya Sindhu)
 * states the death-tithi for shradh is the tithi present at aparahna, NOT at sunrise nor at the
 * exact instant of death. We use the midpoint of the aparahna window (3.5/5 of day length after sunrise).
 * Returns 1..30 absolute tithi.
 */
export function aparahnaTithiOn(
  year: number, month: number, day: number,
  location: { lat: number; lon: number; tz: string },
): { number: number; name: string; paksha: "Shukla Paksha" | "Krishna Paksha" } {
  const noonLocalGuessUtcMs = Date.UTC(year, month - 1, day, 12, 0, 0);
  const tzOff = tzOffsetHours(location.tz, new Date(noonLocalGuessUtcMs));
  const midnightJD = localToJulianDayUT(year, month, day, 0.0, tzOff);
  let sunriseJD = nextSunrise(midnightJD - 0.05, location.lat, location.lon);
  if (sunriseJD) {
    const localStr = jdToDate(sunriseJD).toLocaleDateString("en-CA", { timeZone: location.tz });
    const targetStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    if (localStr !== targetStr) sunriseJD = nextSunrise(midnightJD + 0.5, location.lat, location.lon);
  }
  const sunsetJD = sunriseJD ? nextSunset(sunriseJD, location.lat, location.lon) : null;
  // Aparahna midpoint = sunrise + 3.5/5 of day length. If sunrise/sunset unavailable, fall back to local 15:00.
  const aparahnaJD = (sunriseJD && sunsetJD) ? sunriseJD + (sunsetJD - sunriseJD) * 0.7 : localToJulianDayUT(year, month, day, 15.0, tzOff);
  const t = tithiAt(aparahnaJD);
  const idx = Math.floor(t.value / 12); // 0..29
  return {
    number: idx + 1,
    name: TITHI_NAMES[idx],
    paksha: idx < 15 ? "Shukla Paksha" : "Krishna Paksha",
  };
}

export function computeDailyPanchang(
  year: number, month: number, day: number,
  location: { name: string; lat: number; lon: number; tz: string },
): DailyPanchang {
  const tz = location.tz;
  // Build a Date at noon local on the given day to derive the tz offset reliably (avoids DST edge cases at midnight)
  const noonLocalGuessUtcMs = Date.UTC(year, month - 1, day, 12, 0, 0); // pretend UTC
  const tzOff = tzOffsetHours(tz, new Date(noonLocalGuessUtcMs));

  // JD at local midnight (start of day)
  const midnightJD = localToJulianDayUT(year, month, day, 0.0, tzOff);
  // JD at solar noon local (handy reference instant)
  const localNoonJD = localToJulianDayUT(year, month, day, 12.0, tzOff);

  // Find the SUNRISE that occurs on this local civil date.
  // Strategy: search for sunrise within a 30-hour window starting from local midnight.
  let sunriseJD = nextSunrise(midnightJD - 0.05, location.lat, location.lon);
  // Validate it falls on the same local date; if not, search forward
  if (sunriseJD) {
    const localStr = jdToDate(sunriseJD).toLocaleDateString("en-CA", { timeZone: tz });
    const targetStr = `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
    if (localStr !== targetStr) sunriseJD = nextSunrise(midnightJD + 0.5, location.lat, location.lon);
  }
  let sunsetJD = sunriseJD ? nextSunset(sunriseJD, location.lat, location.lon) : nextSunset(midnightJD, location.lat, location.lon);
  const noonJD = sunriseJD ? nextMeridianTransit(sunriseJD, location.lat, location.lon) : nextMeridianTransit(midnightJD, location.lat, location.lon);
  const moonriseJD = nextMoonrise(midnightJD - 0.05, location.lat, location.lon);
  const moonsetJD  = nextMoonset(midnightJD - 0.05, location.lat, location.lon);

  const referenceJD = sunriseJD ?? localNoonJD; // use sunrise-anchored panchang values
  const t = tithiAt(referenceJD);
  const tithiNumber = Math.floor(t.value / 12); // 0..29
  const tithiEndJD = findNextEvent(referenceJD, t.value, 12, (jd) => {
    const tt = tithiAt(jd);
    return { value: tt.value, rate: tt.rate };
  });

  const n = nakshatraAt(referenceJD);
  const nakNumber = Math.floor(n.value / (360 / 27));
  const nakInfo = NAKSHATRAS[nakNumber];
  const nakEndJD = findNextEvent(referenceJD, n.value, 360 / 27, (jd) => {
    const nn = nakshatraAt(jd);
    return { value: nn.value, rate: nn.rate };
  });
  const padaSize = (360 / 27) / 4;
  const pada = Math.floor((n.value - nakNumber * (360 / 27)) / padaSize) + 1;

  const y = yogaAt(referenceJD);
  const yogaNumber = Math.floor(y.value / (360 / 27));
  const yogaEndJD = findNextEvent(referenceJD, y.value, 360 / 27, (jd) => yogaAt(jd));

  // Karana: each tithi has 2 karanas (each spans 6° of Sun-Moon difference).
  // halfIndex = floor(diff / 6) gives 0..59 across a lunar month.
  const halfIndex = Math.floor(t.value / 6);
  const k = karanaFromTithiHalfIndex(halfIndex);
  const karanaEndJD = findNextEvent(referenceJD, t.value, 6, (jd) => {
    const tt = tithiAt(jd);
    return { value: tt.value, rate: tt.rate };
  });

  // Lunar month (Amanta): find sun's sign at the most recent amavasya BEFORE this date.
  const prevAmavasyaJD = findPrevAmavasya(referenceJD);
  const sunAtAmavasya = planetPosition(prevAmavasyaJD, "Sun");
  const monthIdx = sunAtAmavasya.sign;
  const hinduMonthEn = LUNAR_MONTH_FROM_SUN_SIGN[monthIdx];
  const hinduMonthHi = LUNAR_MONTH_FROM_SUN_SIGN_HI[monthIdx];

  // Day-of-week from local civil date
  const localDow = new Date(`${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}T12:00:00Z`).getUTCDay();
  // ^ Date construction in UTC noon is safe since we're just labeling the calendar day.
  // For accurate Vedic "day starts at sunrise", the weekday is the day in which sunrise occurs — same day for our local civil date.

  // Day-segment muhurats (Rahu/Yama/Gulika)
  let rahuRange = { start: "—", end: "—" };
  let yamaRange = { start: "—", end: "—" };
  let gulikaRange = { start: "—", end: "—" };
  let abhijitRange = { start: "—", end: "—" };
  let brahmaRange = { start: "—", end: "—" };
  let dayLen = 0;

  if (sunriseJD && sunsetJD) {
    const segLen = (sunsetJD - sunriseJD) / 8; // 1/8th of day length, in JD days
    dayLen = (sunsetJD - sunriseJD) * 24;

    const rIdx = RAHU_KAAL_SEGMENT[localDow] - 1; // 0-indexed
    rahuRange = fmtRange(sunriseJD + rIdx * segLen, sunriseJD + (rIdx + 1) * segLen, tz);
    const yIdx = YAMAGANDA_SEGMENT[localDow] - 1;
    yamaRange = fmtRange(sunriseJD + yIdx * segLen, sunriseJD + (yIdx + 1) * segLen, tz);
    const gIdx = GULIKA_SEGMENT[localDow] - 1;
    gulikaRange = fmtRange(sunriseJD + gIdx * segLen, sunriseJD + (gIdx + 1) * segLen, tz);

    // Abhijit Muhurat: the 8th muhurta of the day (out of 15 muhurtas dividing day length).
    // Equivalently: 24 minutes centered on solar noon. Use noonJD if present.
    if (noonJD) {
      const halfWindow = (24 / (60 * 24)) / 2; // 12 minutes in days = 12/(60*24)
      abhijitRange = fmtRange(noonJD - halfWindow, noonJD + halfWindow, tz);
    } else {
      const muhurtaLen = (sunsetJD - sunriseJD) / 15;
      abhijitRange = fmtRange(sunriseJD + 7 * muhurtaLen, sunriseJD + 8 * muhurtaLen, tz);
    }

    // Brahma Muhurat: 1h 36m before sunrise, lasts 48 minutes.
    const oneMinJD = 1 / (24 * 60);
    brahmaRange = fmtRange(sunriseJD - 96 * oneMinJD, sunriseJD - 48 * oneMinJD, tz);
  }

  const paksha = tithiNumber < 15 ? "Shukla Paksha" : "Krishna Paksha";
  const pakshaHi = tithiNumber < 15 ? "शुक्ल पक्ष" : "कृष्ण पक्ष";

  return {
    date: `${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`,
    location,
    weekday: { en: WEEKDAYS_EN[localDow], hi: WEEKDAYS_HI[localDow], lord: WEEKDAY_LORDS[localDow] },
    sunrise: formatJDLocal12h(sunriseJD, tz),
    sunset: formatJDLocal12h(sunsetJD, tz),
    solarNoon: formatJDLocal12h(noonJD, tz),
    moonrise: formatJDLocal12h(moonriseJD, tz),
    moonset: formatJDLocal12h(moonsetJD, tz),
    dayLengthHours: Math.round(dayLen * 100) / 100,
    tithi: {
      number: tithiNumber + 1,
      name: TITHI_NAMES[tithiNumber],
      nameHi: TITHI_NAMES_HI[tithiNumber],
      paksha, pakshaHi,
      endsAt: formatJDLocal12h(tithiEndJD, tz),
      endsAtISO: jdToISO(tithiEndJD),
    },
    nakshatra: {
      number: nakNumber + 1,
      name: nakInfo.name,
      nameHi: nakInfo.nameHi,
      lord: nakInfo.lord,
      deity: nakInfo.deity,
      pada,
      endsAt: formatJDLocal12h(nakEndJD, tz),
      endsAtISO: jdToISO(nakEndJD),
    },
    yoga: {
      number: yogaNumber + 1,
      name: YOGAS[yogaNumber],
      nameHi: YOGAS_HI[yogaNumber],
      endsAt: formatJDLocal12h(yogaEndJD, tz),
      endsAtISO: jdToISO(yogaEndJD),
    },
    karana: {
      number: k.idx + 1,
      name: KARANA_NAMES[k.nameIdx],
      nameHi: KARANA_NAMES_HI[k.nameIdx],
      endsAt: formatJDLocal12h(karanaEndJD, tz),
      endsAtISO: jdToISO(karanaEndJD),
    },
    hinduMonth: { name: hinduMonthEn, nameHi: hinduMonthHi, scheme: "Amanta" },
    vikramSamvat: vikramSamvat(year, month),
    shakaSamvat: shakaSamvat(year, month),
    rahuKaal: rahuRange,
    yamaganda: yamaRange,
    gulikaKaal: gulikaRange,
    abhijitMuhurat: abhijitRange,
    brahmaMuhurat: brahmaRange,
    ayanamsaDeg: Math.round(ayanamsa(referenceJD) * 10000) / 10000,
    method: "Swiss Ephemeris (Lahiri ayanamsa, Moshier built-in)",
    computedAt: new Date().toISOString(),
  };
}

/**
 * Lightweight monthly panchang for calendar views — one row per day with key fields.
 * Avoids the per-day muhurat computations to stay cheap (still ~31 swisseph calls).
 */
export interface MonthDay {
  date: number;
  weekdayEn: string;
  weekdayHi: string;
  tithi: string;
  tithiHi: string;
  paksha: string;
  nakshatra: string;
  nakshatraHi: string;
  yoga: string;
  isAuspicious: boolean;
  festival: string | null;
}

export interface MonthlyPanchang {
  year: number;
  month: number;
  monthName: string;
  hinduMonth: string;
  hinduMonthHi: string;
  samvatVikram: number;
  samvatShaka: number;
  location: { name: string; lat: number; lon: number; tz: string };
  days: MonthDay[];
  method: string;
  computedAt: string;
}

const MONTH_NAMES = ["", "January","February","March","April","May","June","July","August","September","October","November","December"];

export function computeMonthlyPanchang(year: number, month: number, location: { name: string; lat: number; lon: number; tz: string }): MonthlyPanchang {
  const days: MonthDay[] = [];
  const lastDay = new Date(year, month, 0).getDate();
  let hinduMonth = "—";
  let hinduMonthHi = "—";

  for (let d = 1; d <= lastDay; d++) {
    // Use local noon as the reference instant to avoid DST/midnight quirks
    const noonLocalUtcMs = Date.UTC(year, month - 1, d, 12, 0, 0);
    const tzOff = tzOffsetHours(location.tz, new Date(noonLocalUtcMs));
    const refJD = localToJulianDayUT(year, month, d, 6, tzOff); // ~ sunrise

    const t = tithiAt(refJD);
    const tithiNumber = Math.floor(t.value / 12);
    const n = nakshatraAt(refJD);
    const nakNumber = Math.floor(n.value / (360 / 27));
    const y = yogaAt(refJD);
    const yogaNumber = Math.floor(y.value / (360 / 27));

    if (d === 1) {
      const prevAm = findPrevAmavasya(refJD);
      const sunSign = planetPosition(prevAm, "Sun").sign;
      hinduMonth = LUNAR_MONTH_FROM_SUN_SIGN[sunSign];
      hinduMonthHi = LUNAR_MONTH_FROM_SUN_SIGN_HI[sunSign];
    }

    const dow = new Date(`${year.toString().padStart(4, "0")}-${month.toString().padStart(2, "0")}-${d.toString().padStart(2, "0")}T12:00:00Z`).getUTCDay();
    const tithiName = TITHI_NAMES[tithiNumber];
    const nakInfo = NAKSHATRAS[nakNumber];

    let festival: string | null = null;
    // Recognize key tithis as festivals/vrats:
    if (tithiNumber === 10 || tithiNumber === 25) festival = "Ekadashi";       // Shukla & Krishna Ekadashi
    else if (tithiNumber === 14) festival = "Purnima";
    else if (tithiNumber === 29) festival = "Amavasya";
    else if (tithiNumber === 12 || tithiNumber === 27) festival = "Pradosh Vrat";
    else if (tithiNumber === 18) festival = "Sankashti Chaturthi";
    else if (tithiNumber === 5)  festival = "Naga Panchami / Vasant Panchami window";

    const isAuspicious = !["Vyatipata", "Vaidhriti", "Atiganda", "Vishkumbha", "Vyaghata", "Parigha", "Vajra", "Shoola", "Ganda"].includes(YOGAS[yogaNumber]);

    days.push({
      date: d,
      weekdayEn: WEEKDAYS_EN[dow],
      weekdayHi: WEEKDAYS_HI[dow],
      tithi: tithiName,
      tithiHi: TITHI_NAMES_HI[tithiNumber],
      paksha: tithiNumber < 15 ? "Shukla" : "Krishna",
      nakshatra: nakInfo.name,
      nakshatraHi: nakInfo.nameHi,
      yoga: YOGAS[yogaNumber],
      isAuspicious,
      festival,
    });
  }

  return {
    year, month,
    monthName: MONTH_NAMES[month],
    hinduMonth, hinduMonthHi,
    samvatVikram: vikramSamvat(year, month),
    samvatShaka: shakaSamvat(year, month),
    location,
    days,
    method: "Swiss Ephemeris (Lahiri ayanamsa, Moshier built-in)",
    computedAt: new Date().toISOString(),
  };
}
