// Full birth chart (Kundli) computation — sidereal Lahiri, whole-sign Vedic houses,
// Navamsa (D9), classical doshas (Manglik, Kalsarpa) and key yogas.
// Zero AI involvement in any astronomical fact.

import {
  julianDayUT, localToJulianDayUT, tzOffsetHours, planetPosition,
  ascendantSidereal, allPlanets, ayanamsa, type PlanetPos, type PlanetName,
} from "./ephemeris";
import {
  SIGNS_EN, SIGNS_HI, SIGN_LORDS, SIGN_ELEMENTS, SIGN_QUALITY,
  NAKSHATRAS, PLANET_NAMES_HI, PLANET_DEITY_HI, PLANET_DIGNITY,
  MANGLIK_HOUSES,
} from "./data";
import { computeVimshottariDasha, type DashaSnapshot } from "./dasha";

export interface ChartPlanet {
  name: PlanetName;
  nameHi: string;
  longitude: number;
  signIndex: number;
  sign: string;
  signHi: string;
  signLord: string;
  signDegree: number;
  nakshatraIndex: number;
  nakshatra: string;
  nakshatraHi: string;
  nakshatraLord: string;
  pada: number;
  house: number;          // 1..12 from ascendant (whole-sign)
  retrograde: boolean;
  dignity: "Exalted" | "Debilitated" | "Own Sign" | "Mooltrikona" | "Friendly" | "Neutral" | "Enemy" | "—";
  combust?: boolean;
}

export interface ChartHouse {
  number: number;          // 1..12
  signIndex: number;
  sign: string;
  signHi: string;
  signLord: string;
  cuspDegree: number;      // start of the sign (whole-sign)
  planets: PlanetName[];
}

export interface BirthChart {
  birth: { datetimeISO: string; tz: string; tzOffsetHours: number; place: { name: string; lat: number; lon: number } };
  ayanamsaDeg: number;
  ascendant: { longitude: number; signIndex: number; sign: string; signHi: string; signLord: string; nakshatra: string; nakshatraLord: string; pada: number };
  moonSign: { signIndex: number; sign: string; signHi: string; signLord: string };
  sunSign: { signIndex: number; sign: string; signHi: string; signLord: string };
  nakshatra: { name: string; nameHi: string; lord: string; deity: string; pada: number; symbol: string; gana: string; guna: string };
  planets: ChartPlanet[];
  houses: ChartHouse[];
  navamsa: { ascendantSign: number; planets: { name: PlanetName; signIndex: number; sign: string }[] };
  doshas: {
    manglik: { present: boolean; severity: "None" | "Low" | "Moderate" | "High"; reasons: string[] };
    kalsarpa: { present: boolean; type: string | null; explanation: string };
    sadeSati: { active: boolean; phase: "Rising" | "Peak" | "Setting" | null; explanation: string };
  };
  yogas: { name: string; description: string }[];
  dasha: DashaSnapshot;
  method: string;
}

export interface BirthInput {
  year: number; month: number; day: number;
  hour: number; minute: number;            // local time
  lat: number; lon: number; tz: string;    // IANA tz name
  placeName: string;
}

function dignityOf(planet: PlanetName, signIndex: number, signDegree: number): ChartPlanet["dignity"] {
  const d = PLANET_DIGNITY[planet];
  if (!d) return "—";
  if (signIndex === d.exaltSign) return "Exalted";
  if (signIndex === d.debilSign) return "Debilitated";
  if (d.mooltrikonaSign === signIndex && d.mooltrikonaRange && signDegree >= d.mooltrikonaRange[0] && signDegree < d.mooltrikonaRange[1]) return "Mooltrikona";
  if (d.ownSigns.includes(signIndex)) return "Own Sign";
  return "—";
}

function houseFromAsc(planetSign: number, ascSign: number): number {
  return ((planetSign - ascSign + 12) % 12) + 1;
}

/**
 * Navamsa (D9) sign calculation — divides each sign into 9 parts of 3°20' each.
 * Standard formula (Parashari):
 *   For Movable signs (0,3,6,9): D9 starts from same sign
 *   For Fixed signs   (1,4,7,10): D9 starts from 9th sign from itself
 *   For Dual signs    (2,5,8,11): D9 starts from 5th sign from itself
 */
function navamsaSign(longitude: number): number {
  const sign = Math.floor(longitude / 30);
  const degInSign = longitude - sign * 30;
  const navamsaIdx = Math.floor(degInSign / (30 / 9)); // 0..8
  let startSign: number;
  const quality = sign % 3; // 0=movable, 1=fixed, 2=dual
  if (quality === 0) startSign = sign;
  else if (quality === 1) startSign = (sign + 8) % 12;
  else startSign = (sign + 4) % 12;
  return (startSign + navamsaIdx) % 12;
}

function detectKalsarpa(planets: ChartPlanet[]): { present: boolean; type: string | null; explanation: string } {
  const rahu = planets.find(p => p.name === "Rahu")!;
  const ketu = planets.find(p => p.name === "Ketu")!;
  const others = planets.filter(p => p.name !== "Rahu" && p.name !== "Ketu");
  // Determine which "side" of the Rahu-Ketu axis each planet falls on.
  // Rahu and Ketu are 180° apart. Check if all 7 planets are on the same arc between them.
  const rahuLon = rahu.longitude;
  const ketuLon = ketu.longitude;
  // Normalize: arc1 = from Rahu to Ketu going forward (180°), arc2 = the other 180°
  function inArc(lon: number, start: number, end: number) {
    // returns true if lon is in arc [start -> start+180] going forward (modulo 360)
    let d = (lon - start + 360) % 360;
    return d > 0 && d < 180;
  }
  const sideA = others.every(p => inArc(p.longitude, rahuLon, ketuLon));
  const sideB = others.every(p => inArc(p.longitude, ketuLon, rahuLon));
  if (sideA || sideB) {
    return { present: true, type: sideA ? "Forward axis (Rahu leading)" : "Reverse axis (Ketu leading)",
      explanation: "All seven planets lie on one side of the Rahu-Ketu axis, forming Kalsarpa Yoga. Effects manifest as karmic challenges that, when navigated with sadhana and remedies, lead to extraordinary spiritual growth." };
  }
  return { present: false, type: null, explanation: "Planets are distributed on both sides of the Rahu-Ketu axis — no Kalsarpa Yoga." };
}

function detectManglik(marsHouseFromLagna: number, marsHouseFromMoon: number): { present: boolean; severity: "None" | "Low" | "Moderate" | "High"; reasons: string[] } {
  const reasons: string[] = [];
  let count = 0;
  if (MANGLIK_HOUSES.has(marsHouseFromLagna)) { count++; reasons.push(`Mars in house ${marsHouseFromLagna} from Lagna`); }
  if (MANGLIK_HOUSES.has(marsHouseFromMoon))  { count++; reasons.push(`Mars in house ${marsHouseFromMoon} from Moon`); }
  if (count === 0) return { present: false, severity: "None", reasons: ["Mars not in any of houses 1, 4, 7, 8, 12 from Lagna or Moon"] };
  return { present: true, severity: count === 2 ? "High" : "Moderate", reasons };
}

function detectSadeSati(moonSignIndex: number, saturnSignIndex: number): { active: boolean; phase: "Rising" | "Peak" | "Setting" | null; explanation: string } {
  // Sade Sati = Saturn transiting the sign before, of, and after natal Moon (~7.5 years total).
  const before = (moonSignIndex - 1 + 12) % 12;
  const after = (moonSignIndex + 1) % 12;
  if (saturnSignIndex === before) return { active: true, phase: "Rising", explanation: "Saturn currently transits the sign before your Moon — the rising phase of Sade Sati. A period of testing and inner restructuring." };
  if (saturnSignIndex === moonSignIndex) return { active: true, phase: "Peak", explanation: "Saturn currently transits over your natal Moon — the peak phase of Sade Sati. Intense transformation through karmic lessons." };
  if (saturnSignIndex === after) return { active: true, phase: "Setting", explanation: "Saturn currently transits the sign after your Moon — the setting phase of Sade Sati. The lessons mature and ease begins to return." };
  return { active: false, phase: null, explanation: "Saturn is not transiting through Sade Sati positions for your Moon at present." };
}

function detectYogas(planets: ChartPlanet[], asc: { signIndex: number }): { name: string; description: string }[] {
  const yogas: { name: string; description: string }[] = [];
  const get = (n: PlanetName) => planets.find(p => p.name === n)!;
  const moon = get("Moon");
  const jupiter = get("Jupiter");
  const sun = get("Sun");

  // Gaja Kesari Yoga: Jupiter in 1, 4, 7, 10 from Moon (kendra from Moon)
  const jupHouseFromMoon = ((jupiter.signIndex - moon.signIndex + 12) % 12) + 1;
  if ([1, 4, 7, 10].includes(jupHouseFromMoon)) {
    yogas.push({ name: "Gaja Kesari Yoga", description: "Jupiter in a kendra (1/4/7/10) from Moon. Bestows fame, intelligence, prosperity and a magnetic personality." });
  }

  // Chandra Mangal Yoga: Moon and Mars conjunct
  const mars = get("Mars");
  if (Math.abs(((moon.longitude - mars.longitude + 540) % 360) - 180) > 170) {
    // they're within 10° (conjunct or opposite within 10) — actually let's just check sign conjunction
  }
  if (moon.signIndex === mars.signIndex) {
    yogas.push({ name: "Chandra-Mangal Yoga", description: "Moon and Mars conjunct in the same sign. Brings business acumen and the ability to earn through bold initiative." });
  }

  // Budha-Aditya Yoga: Sun + Mercury conjunct
  const mercury = get("Mercury");
  if (sun.signIndex === mercury.signIndex) {
    yogas.push({ name: "Budha-Aditya Yoga", description: "Sun and Mercury conjunct. Sharp intellect, eloquence, success in scholarship and government service." });
  }

  // Hamsa Yoga: Jupiter exalted/own/mooltrikona in a kendra from Lagna
  if ((jupiter.dignity === "Exalted" || jupiter.dignity === "Own Sign" || jupiter.dignity === "Mooltrikona")
      && [1, 4, 7, 10].includes(jupiter.house)) {
    yogas.push({ name: "Hamsa Yoga (Pancha Mahapurusha)", description: "Jupiter strong in a kendra. Confers wisdom, righteousness, respected status and spiritual inclination." });
  }

  // Ruchaka Yoga: Mars exalted/own in a kendra from Lagna
  if ((mars.dignity === "Exalted" || mars.dignity === "Own Sign" || mars.dignity === "Mooltrikona")
      && [1, 4, 7, 10].includes(mars.house)) {
    yogas.push({ name: "Ruchaka Yoga (Pancha Mahapurusha)", description: "Mars strong in a kendra. Grants courage, leadership, athletic prowess, and victory over enemies." });
  }

  // Bhadra Yoga: Mercury similarly
  if ((mercury.dignity === "Exalted" || mercury.dignity === "Own Sign" || mercury.dignity === "Mooltrikona")
      && [1, 4, 7, 10].includes(mercury.house)) {
    yogas.push({ name: "Bhadra Yoga (Pancha Mahapurusha)", description: "Mercury strong in a kendra. Eloquent speech, business intelligence, success in trade and writing." });
  }

  // Malavya Yoga: Venus similarly
  const venus = get("Venus");
  if ((venus.dignity === "Exalted" || venus.dignity === "Own Sign" || venus.dignity === "Mooltrikona")
      && [1, 4, 7, 10].includes(venus.house)) {
    yogas.push({ name: "Malavya Yoga (Pancha Mahapurusha)", description: "Venus strong in a kendra. Beauty, artistic gifts, marital happiness, luxurious living." });
  }

  // Shasha Yoga: Saturn similarly
  const saturn = get("Saturn");
  if ((saturn.dignity === "Exalted" || saturn.dignity === "Own Sign" || saturn.dignity === "Mooltrikona")
      && [1, 4, 7, 10].includes(saturn.house)) {
    yogas.push({ name: "Shasha Yoga (Pancha Mahapurusha)", description: "Saturn strong in a kendra. Discipline, longevity, leadership in service and traditional fields." });
  }

  return yogas;
}

/**
 * Compute a complete birth chart.
 */
export function computeBirthChart(input: BirthInput, atJD?: number): BirthChart {
  const noonLocalUtcMs = Date.UTC(input.year, input.month - 1, input.day, 12, 0, 0);
  const tzOff = tzOffsetHours(input.tz, new Date(noonLocalUtcMs));
  const birthHourLocal = input.hour + input.minute / 60;
  const birthJD = localToJulianDayUT(input.year, input.month, input.day, birthHourLocal, tzOff);

  const positions = allPlanets(birthJD);
  const ascDeg = ascendantSidereal(birthJD, input.lat, input.lon);
  const ascSign = Math.floor(ascDeg / 30);
  const nakSize = 360 / 27;
  const ascNakIdx = Math.floor(ascDeg / nakSize);
  const ascNakInfo = NAKSHATRAS[ascNakIdx];
  const ascPada = Math.floor((ascDeg - ascNakIdx * nakSize) / (nakSize / 4)) + 1;

  const moon = positions.find(p => p.name === "Moon")!;
  const sun = positions.find(p => p.name === "Sun")!;

  // Combust check: planets within ~6° (Mars 17°, Mercury 12°, Jupiter 11°, Venus 10°, Saturn 15°) of Sun.
  // Use simplified 8° threshold for general flagging.
  function combust(p: PlanetPos): boolean {
    if (p.name === "Sun" || p.name === "Moon" || p.name === "Rahu" || p.name === "Ketu") return false;
    const d = Math.min(Math.abs(p.longitude - sun.longitude), 360 - Math.abs(p.longitude - sun.longitude));
    return d < 8;
  }

  const chartPlanets: ChartPlanet[] = positions.map(p => ({
    name: p.name,
    nameHi: PLANET_NAMES_HI[p.name] ?? p.name,
    longitude: Math.round(p.longitude * 10000) / 10000,
    signIndex: p.sign,
    sign: SIGNS_EN[p.sign],
    signHi: SIGNS_HI[p.sign],
    signLord: SIGN_LORDS[p.sign],
    signDegree: Math.round(p.signDegree * 100) / 100,
    nakshatraIndex: p.nakshatra,
    nakshatra: NAKSHATRAS[p.nakshatra].name,
    nakshatraHi: NAKSHATRAS[p.nakshatra].nameHi,
    nakshatraLord: NAKSHATRAS[p.nakshatra].lord,
    pada: p.nakshatraPada,
    house: houseFromAsc(p.sign, ascSign),
    retrograde: p.retrograde,
    dignity: dignityOf(p.name, p.sign, p.signDegree),
    combust: combust(p),
  }));

  // Build whole-sign houses
  const houses: ChartHouse[] = [];
  for (let i = 0; i < 12; i++) {
    const signIdx = (ascSign + i) % 12;
    const planetsInHouse = chartPlanets.filter(cp => cp.signIndex === signIdx).map(cp => cp.name);
    houses.push({
      number: i + 1,
      signIndex: signIdx,
      sign: SIGNS_EN[signIdx],
      signHi: SIGNS_HI[signIdx],
      signLord: SIGN_LORDS[signIdx],
      cuspDegree: signIdx * 30,
      planets: planetsInHouse,
    });
  }

  // Navamsa
  const navAscSign = navamsaSign(ascDeg);
  const navamsa = {
    ascendantSign: navAscSign,
    planets: positions.map(p => {
      const ns = navamsaSign(p.longitude);
      return { name: p.name, signIndex: ns, sign: SIGNS_EN[ns] };
    }),
  };

  // Doshas
  const mars = chartPlanets.find(p => p.name === "Mars")!;
  const marsHouseFromMoon = ((mars.signIndex - moon.sign + 12) % 12) + 1;
  const manglik = detectManglik(mars.house, marsHouseFromMoon);
  const kalsarpa = detectKalsarpa(chartPlanets);

  // Sade Sati at present moment
  const nowJD = atJD ?? (Date.now() / 86400000 + 2440587.5);
  const saturnNow = planetPosition(nowJD, "Saturn");
  const sadeSati = detectSadeSati(moon.sign, saturnNow.sign);

  const yogas = detectYogas(chartPlanets, { signIndex: ascSign });

  const dasha = computeVimshottariDasha(moon.longitude, birthJD, atJD);

  // Build birth ISO timestamp
  const birthDate = new Date(Date.UTC(input.year, input.month - 1, input.day, Math.floor(birthHourLocal - tzOff), Math.round(((birthHourLocal - tzOff) % 1) * 60)));
  // Safer: just store as local ISO string + tz
  const localIso = `${input.year.toString().padStart(4, "0")}-${input.month.toString().padStart(2, "0")}-${input.day.toString().padStart(2, "0")}T${input.hour.toString().padStart(2, "0")}:${input.minute.toString().padStart(2, "0")}:00`;

  return {
    birth: {
      datetimeISO: localIso,
      tz: input.tz,
      tzOffsetHours: tzOff,
      place: { name: input.placeName, lat: input.lat, lon: input.lon },
    },
    ayanamsaDeg: Math.round(ayanamsa(birthJD) * 10000) / 10000,
    ascendant: {
      longitude: Math.round(ascDeg * 10000) / 10000,
      signIndex: ascSign,
      sign: SIGNS_EN[ascSign],
      signHi: SIGNS_HI[ascSign],
      signLord: SIGN_LORDS[ascSign],
      nakshatra: ascNakInfo.name,
      nakshatraLord: ascNakInfo.lord,
      pada: ascPada,
    },
    moonSign: { signIndex: moon.sign, sign: SIGNS_EN[moon.sign], signHi: SIGNS_HI[moon.sign], signLord: SIGN_LORDS[moon.sign] },
    sunSign:  { signIndex: sun.sign,  sign: SIGNS_EN[sun.sign],  signHi: SIGNS_HI[sun.sign],  signLord: SIGN_LORDS[sun.sign]  },
    nakshatra: {
      name: NAKSHATRAS[moon.nakshatra].name,
      nameHi: NAKSHATRAS[moon.nakshatra].nameHi,
      lord: NAKSHATRAS[moon.nakshatra].lord,
      deity: NAKSHATRAS[moon.nakshatra].deity,
      pada: moon.nakshatraPada,
      symbol: NAKSHATRAS[moon.nakshatra].symbol,
      gana: NAKSHATRAS[moon.nakshatra].gana,
      guna: NAKSHATRAS[moon.nakshatra].guna,
    },
    planets: chartPlanets,
    houses,
    navamsa,
    doshas: { manglik, kalsarpa, sadeSati },
    yogas,
    dasha,
    method: "Swiss Ephemeris (Lahiri ayanamsa, Moshier built-in) — sidereal whole-sign houses",
  };
}
