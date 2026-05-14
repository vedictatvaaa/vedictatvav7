import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";
import OpenAI from "openai";
import * as jyotish from "./jyotish";
import type { PdfKundliOrder } from "@shared/schema";
import type { BirthChart } from "./jyotish/kundli";

// Brand colours
const MAROON = "#6D2B35";
const GOLD = "#D4AF37";
const CREAM = "#FBF7EE";
const INK = "#3a2c2f";
const MUTED = "#7a6a6e";
const RULE = "#E6D9B0";

const PAGE_MARGIN = 48;

function fmtDate(iso?: string | null): string {
  if (!iso) return "—";
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch { return iso || "—"; }
}

function fmtBirth(date: string, time: string): string {
  try {
    const [y, m, d] = date.split("-").map(Number);
    const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    return `${String(d).padStart(2,"0")} ${months[m-1] || ""} ${y}, ${time}`;
  } catch { return `${date} ${time}`; }
}

// Password used to encrypt the kundli PDF — derived deterministically from the user's
// date of birth (DDMMYYYY) so the user always knows it without us having to store it.
// e.g. birthDate "1985-11-07" → password "07111985".
export function derivePdfPassword(birthDate: string): string {
  const [y, m, d] = (birthDate || "").split("-");
  if (!y || !m || !d) return "vedictatva";
  return `${d.padStart(2, "0")}${m.padStart(2, "0")}${y.padStart(4, "0")}`;
}

interface PdfBuildResult {
  filePath: string;
  fileName: string;
}

// Two-letter abbreviations used inside the visual chart cells (planets occupy little space).
const PLANET_ABBR: Record<string, string> = {
  Sun: "Su", Moon: "Mo", Mars: "Ma", Mercury: "Me", Jupiter: "Ju",
  Venus: "Ve", Saturn: "Sa", Rahu: "Ra", Ketu: "Ke",
};

// Sign abbreviation used inside the visual chart cells (we show sign number 1-12 instead).
function signNumber(signIndex: number): number { return ((signIndex % 12) + 12) % 12 + 1; }

// English root name for a person — used in numerology Naamank calculation (Chaldean).
const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Q: 1, Y: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};
function reduceNumerology(n: number): number {
  while (n > 9) n = String(n).split("").reduce((a, b) => a + Number(b), 0);
  return n;
}
function computeMulank(birthDate: string): number {
  const day = Number(birthDate.split("-")[2]);
  return reduceNumerology(day);
}
function computeBhagyank(birthDate: string): number {
  const sum = birthDate.replace(/-/g, "").split("").reduce((a, b) => a + Number(b), 0);
  return reduceNumerology(sum);
}
function computeNaamank(name: string): number {
  const sum = name.toUpperCase().split("").reduce((a, ch) => a + (CHALDEAN[ch] || 0), 0);
  return reduceNumerology(sum);
}
const NUMEROLOGY_LORD: Record<number, string> = {
  1: "Sun (Surya)", 2: "Moon (Chandra)", 3: "Jupiter (Guru)", 4: "Rahu",
  5: "Mercury (Budha)", 6: "Venus (Shukra)", 7: "Ketu", 8: "Saturn (Shani)", 9: "Mars (Mangal)",
};
const NUMEROLOGY_NATURE: Record<number, string> = {
  1: "Leadership, originality, ambition, individualism, and a fiercely independent spirit.",
  2: "Sensitivity, intuition, partnership, emotional depth, and a maternal/nurturing instinct.",
  3: "Wisdom, expansion, optimism, teaching, and natural attraction to dharma and learning.",
  4: "Unconventionality, rebellion, sudden gains and losses, magnetism with a chaotic edge.",
  5: "Sharp intellect, communication skills, adaptability, commerce, and quick thinking.",
  6: "Beauty, harmony, art, luxury, relationships, and a love for refined pleasures.",
  7: "Mysticism, introspection, spirituality, research, and a tendency toward solitude.",
  8: "Discipline, hard work, longevity, justice, karma, and slow but enduring success.",
  9: "Courage, energy, action, warrior-spirit, and a powerful drive that needs channelling.",
};

const lordToColor: Record<string, string> = { Sun: "Deep Red / Maroon", Moon: "Pearl White", Mars: "Coral Red", Mercury: "Emerald Green", Jupiter: "Golden Yellow", Venus: "Pure White / Pastel", Saturn: "Indigo / Deep Blue", Rahu: "Smoky Grey", Ketu: "Variegated / Flame" };
const lordToDay: Record<string, string> = { Sun: "Sunday", Moon: "Monday", Mars: "Tuesday", Mercury: "Wednesday", Jupiter: "Thursday", Venus: "Friday", Saturn: "Saturday", Rahu: "Saturday", Ketu: "Tuesday" };
const lordToGem: Record<string, string> = { Sun: "Ruby (Manik)", Moon: "Pearl (Moti)", Mars: "Red Coral (Munga)", Mercury: "Emerald (Panna)", Jupiter: "Yellow Sapphire (Pukhraj)", Venus: "Diamond (Heera)", Saturn: "Blue Sapphire (Neelam)", Rahu: "Hessonite (Gomed)", Ketu: "Cat's Eye (Lehsunia)" };
const lordToMetal: Record<string, string> = { Sun: "Gold / Copper", Moon: "Silver", Mars: "Copper", Mercury: "Brass / Bronze", Jupiter: "Gold", Venus: "Silver / Platinum", Saturn: "Iron / Steel", Rahu: "Lead", Ketu: "Mixed metals" };
const lordToDirection: Record<string, string> = { Sun: "East", Moon: "North-West", Mars: "South", Mercury: "North", Jupiter: "North-East", Venus: "South-East", Saturn: "West", Rahu: "South-West", Ketu: "South-West" };
const lordToNumber: Record<string, number | string> = { Sun: 1, Moon: 2, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 6, Saturn: 8, Rahu: 4, Ketu: 7 };

// ─────────────────────── DIVISIONAL CHART HELPERS ───────────────────────────
// Each helper returns the sign-index (0..11) of a planet's position in the
// requested divisional chart, given its absolute sidereal longitude in degrees.
function divisionalSign(longitude: number, division: "D1" | "D9" | "D7" | "D10"): number {
  const lon = ((longitude % 360) + 360) % 360;
  const sign = Math.floor(lon / 30);
  const degInSign = lon - sign * 30;
  if (division === "D1") return sign;
  if (division === "D9") {
    const idx = Math.floor(degInSign / (30 / 9));
    const q = sign % 3;
    let start: number;
    if (q === 0) start = sign; else if (q === 1) start = (sign + 8) % 12; else start = (sign + 4) % 12;
    return (start + idx) % 12;
  }
  if (division === "D7") {
    const idx = Math.floor(degInSign / (30 / 7));
    const start = sign % 2 === 0 ? sign : (sign + 6) % 12;
    return (start + idx) % 12;
  }
  if (division === "D10") {
    const idx = Math.floor(degInSign / 3);
    const start = sign % 2 === 0 ? sign : (sign + 8) % 12;
    return (start + idx) % 12;
  }
  return sign;
}

// ─────────────────────── NORTH-INDIAN CHART DRAWING ─────────────────────────
// Renders a classic North-Indian Vedic kundli (the diamond style used across
// Bengal, Bihar, UP, Odisha, etc.) — outer square + inner diamond + diagonals,
// twelve houses arranged with the ascendant in the top diamond and houses
// running counter-clockwise. Sign numbers (1..12) are written into each house;
// planet abbreviations stack inside the same house.
interface ChartCell { planets: string[]; signIdx: number; }
function drawNorthIndianChart(
  doc: PDFKit.PDFDocument,
  ox: number, oy: number, size: number,
  title: string,
  _ascSignIdx: number,         // ascendant sign — implicit in cells[0].signIdx
  cells: ChartCell[],          // index 0 = house 1, index 11 = house 12
) {
  const W = size, H = size;
  const cx = ox + W / 2, cy = oy + H / 2;
  // Title
  doc.fillColor(MAROON).font("Helvetica-Bold").fontSize(10).text(title, ox, oy - 16, { width: W, align: "center" });
  // Outer square + diagonals + inner diamond
  doc.save();
  doc.lineWidth(1).strokeColor(MAROON);
  doc.rect(ox, oy, W, H).stroke();
  doc.moveTo(ox, oy).lineTo(ox + W, oy + H).stroke();
  doc.moveTo(ox + W, oy).lineTo(ox, oy + H).stroke();
  doc.moveTo(ox + W / 2, oy).lineTo(ox + W, oy + H / 2).lineTo(ox + W / 2, oy + H).lineTo(ox, oy + H / 2).closePath().stroke();
  doc.restore();
  // Centroids for each of the 12 houses (approximate)
  const centroids: Array<{ x: number; y: number }> = [
    { x: cx,            y: oy + H * 0.22 }, // 1
    { x: ox + W * 0.22, y: oy + H * 0.10 }, // 2
    { x: ox + W * 0.10, y: oy + H * 0.22 }, // 3
    { x: ox + W * 0.22, y: cy            }, // 4
    { x: ox + W * 0.10, y: oy + H * 0.78 }, // 5
    { x: ox + W * 0.22, y: oy + H * 0.90 }, // 6
    { x: cx,            y: oy + H * 0.78 }, // 7
    { x: ox + W * 0.78, y: oy + H * 0.90 }, // 8
    { x: ox + W * 0.90, y: oy + H * 0.78 }, // 9
    { x: ox + W * 0.78, y: cy            }, // 10
    { x: ox + W * 0.90, y: oy + H * 0.22 }, // 11
    { x: ox + W * 0.78, y: oy + H * 0.10 }, // 12
  ];
  for (let h = 0; h < 12; h++) {
    const c = cells[h];
    const pt = centroids[h];
    // Sign number (small, gold)
    doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(7).text(String(signNumber(c.signIdx)), pt.x - 12, pt.y - 14, { width: 24, align: "center" });
    // Planets stacked in two columns of two (max 4 visible)
    if (c.planets.length) {
      const planetText = c.planets.map(p => PLANET_ABBR[p] || p.slice(0, 2)).join("  ");
      doc.fillColor(INK).font("Helvetica-Bold").fontSize(7.5).text(planetText, pt.x - 32, pt.y - 4, { width: 64, align: "center" });
    }
  }
}

function buildD1Cells(chart: BirthChart): ChartCell[] {
  const cells: ChartCell[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = (chart.ascendant.signIndex + h - 1) % 12;
    const planets = chart.planets.filter(p => p.signIndex === signIdx).map(p => p.name);
    cells.push({ planets, signIdx });
  }
  return cells;
}
function buildChandraCells(chart: BirthChart): ChartCell[] {
  // Chandra Lagna: rotate so the Moon's sign is house 1
  const moonSignIdx = chart.moonSign.signIndex;
  const cells: ChartCell[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = (moonSignIdx + h - 1) % 12;
    const planets = chart.planets.filter(p => p.signIndex === signIdx).map(p => p.name);
    cells.push({ planets, signIdx });
  }
  return cells;
}
function buildDivisionalCells(chart: BirthChart, division: "D9" | "D7" | "D10", longitudes: { name: string; longitude: number }[]): ChartCell[] {
  // Divisional ascendant
  const ascDiv = divisionalSign(chart.ascendant.longitude, division);
  const cells: ChartCell[] = [];
  for (let h = 1; h <= 12; h++) {
    const signIdx = (ascDiv + h - 1) % 12;
    const planets = longitudes.filter(p => divisionalSign(p.longitude, division) === signIdx).map(p => p.name);
    cells.push({ planets, signIdx });
  }
  return cells;
}

// ─────────────────────────── AI PREDICTIONS ─────────────────────────────────
// Calls OpenAI once to produce ~9 personalised prediction blocks. Returns
// templated fallback text if AI is unavailable / fails so PDF generation never
// blocks on network issues.
const PREDICTION_KEYS = [
  "personality", "education", "career", "wealth", "marriage",
  "children", "health", "foreign", "spiritual",
] as const;
type PredictionKey = typeof PREDICTION_KEYS[number];
type Predictions = Record<PredictionKey, string>;

function fallbackPredictions(chart: BirthChart, order: PdfKundliOrder): Predictions {
  const asc = chart.ascendant.sign;
  const ascLord = chart.ascendant.signLord;
  const moon = chart.moonSign.sign;
  const moonLord = chart.moonSign.signLord;
  const sun = chart.sunSign.sign;
  const nak = chart.nakshatra.name;
  const nakLord = chart.nakshatra.lord;
  const nakDeity = chart.nakshatra.deity;
  const pad = chart.ascendant.pada;

  const find = (name: string) => chart.planets.find(p => p.name === name);
  const sunP = find("Sun")!;
  const merP = find("Mercury")!, jupP = find("Jupiter")!;
  const venP = find("Venus")!, satP = find("Saturn")!;
  const rahP = find("Rahu")!, ketP = find("Ketu")!;

  const h = chart.houses;
  const fifthLord = h[4].signLord, fifthSign = h[4].sign;
  const seventhLord = h[6].signLord, seventhSign = h[6].sign;
  const tenthLord = h[9].signLord, tenthSign = h[9].sign;
  const ninthLord = h[8].signLord, ninthSign = h[8].sign;
  const secondLord = h[1].signLord, secondSign = h[1].sign;
  const eleventhLord = h[10].signLord, eleventhSign = h[10].sign;
  const sixthLord = h[5].signLord, sixthSign = h[5].sign;
  const twelfthLord = h[11].signLord, twelfthSign = h[11].sign;
  const fourthLord = h[3].signLord, fourthSign = h[3].sign;

  const md = chart.dasha.current.mahadasha.lord;
  const ad = chart.dasha.current.antardasha.lord;
  const mdEnd = new Date(chart.dasha.current.mahadasha.endISO).getFullYear();

  return {
    personality: `Your ascendant is ${asc} with its lord ${ascLord} carrying the imprint of your physical body, your way of presenting yourself in the world, and the broad arc of vitality across this lifetime. ${ascLord} sits in house ${find(ascLord)?.house ?? "—"} (sign ${find(ascLord)?.sign ?? "—"}), and so the affairs of that bhava colour the very texture of your selfhood. The Moon in ${moon}, ruled by ${moonLord}, is the seat of your inner mind — your manas — and shapes how you instinctively respond to people, food, family and the rhythms of nature. Sun in ${sun} carries your atma-karaka light, the steady inner authority you grow into across decades. Born under nakshatra ${nak} (pada ${pad}, deity ${nakDeity}, lord ${nakLord}), you carry a specific spiritual signature: the energy of ${nakLord} runs through every layer of your being, and the deity ${nakDeity} is your most natural devata-doorway. People feel in you a blend of ${asc}'s outer poise and ${moon}'s inner sensitivity — a combination that can seem quietly confident on the surface while housing rich emotional depth underneath. The placements of your three luminaries (Lagna, Moon, Sun) form the personality triangle. When all three are honoured through self-care, satsang and dharma, you radiate the quiet magnetism that ${asc} natives are known for.`,

    education: `Education is governed by Mercury (the karaka of intellect and learning), Jupiter (the karaka of wisdom and dharma), the 4th house (formal schooling, mother's blessings, comfort while studying) and the 5th house (intellect, memory, examinations, mantra). In your chart the 4th house is ${fourthSign} ruled by ${fourthLord}, while the 5th house is ${fifthSign} ruled by ${fifthLord} — currently placed in house ${find(fifthLord)?.house ?? "—"}. Mercury sits in ${merP.sign} (house ${merP.house}, ${merP.dignity}${merP.retrograde ? ", retrograde" : ""}) and Jupiter in ${jupP.sign} (house ${jupP.house}, ${jupP.dignity}${jupP.retrograde ? ", retrograde" : ""}). When these placements are well-supported you absorb material easily and retain it for life; when stressed, study requires more discipline and a quieter environment to bear the same fruit. Subjects that resonate with the natures of ${fifthLord} and ${jupP.dignity === "Exalted" || jupP.dignity === "Own Sign" ? "your strong Jupiter" : "Jupiter"} tend to call to you most authentically. During exams, regular japa of the Saraswati mantra and a steady ${nakDeity}-mantra at dawn improve clarity, recall and composure under pressure. Higher education abroad becomes likely whenever the 4th, 5th, 9th or 12th lords run in dasha together. Your karmic study-pattern favours depth over breadth — you learn most when you can sit with one subject for long stretches.`,

    career: `The 10th house — Karma Bhava, the field of public action and worldly accomplishment — is ${tenthSign}, ruled by ${tenthLord}, currently placed in house ${find(tenthLord)?.house ?? "—"}. Saturn (karaka of profession and discipline) sits in ${satP.sign}, house ${satP.house} (${satP.dignity}${satP.retrograde ? ", retrograde" : ""}); Sun (karaka of authority and recognition) in ${sunP.sign}, house ${sunP.house}. Your professional dharma carries the colour of ${tenthSign}: you do your best work when the day-to-day rhythm of the role expresses those qualities. Career advancement traditionally accelerates in three windows — when the 10th lord runs in dasha; when Jupiter or the 9th lord (currently ${ninthLord} in house ${find(ninthLord)?.house ?? "—"}) transits the 10th; and when Saturn moves through the 10th from the Moon. You are presently in the ${md} mahadasha (until ${mdEnd}) with ${ad} antardasha — this is the karmic backdrop against which your professional choices are unfolding. ${md === "Jupiter" ? "Jupiter periods favour teaching, advisory work, dharmic service and expansion of reputation." : md === "Saturn" ? "Saturn periods favour structured work, slow steady climbs, leadership earned through patience." : md === "Venus" ? "Venus periods favour artistic, beauty, hospitality, luxury, partnership-based work." : md === "Mercury" ? "Mercury periods favour communication, commerce, writing, analytics and fast learning roles." : md === "Sun" ? "Sun periods favour authority, government, leadership, father-figure roles." : md === "Moon" ? "Moon periods favour public-facing, hospitality, women-centric, food and water-related work." : md === "Mars" ? "Mars periods favour action, defence, engineering, sports, surgery, real estate." : md === "Rahu" ? "Rahu periods favour foreign, technology, unconventional, large-scale ambition-driven work." : "Ketu periods favour research, occult studies, healing, withdrawal from the spotlight to do meaningful niche work."} Choose work that lets your dharma express itself — not just work that pays.`,

    wealth: `The 2nd house (Dhana — accumulated wealth, savings, family money, food, voice) is ${secondSign} ruled by ${secondLord} (in house ${find(secondLord)?.house ?? "—"}). The 11th house (Labha — gains, income flow, fulfilled desires, elder siblings, large gatherings) is ${eleventhSign} ruled by ${eleventhLord} (in house ${find(eleventhLord)?.house ?? "—"}). Jupiter — the karaka of wealth and abundance — is in ${jupP.sign}, house ${jupP.house} (${jupP.dignity}); Venus — karaka of luxury, comfort, vehicles — is in ${venP.sign}, house ${venP.house} (${venP.dignity}). Your income architecture has two engines: the steady earning channel shown by the 2nd-lord, and the gain-amplifier shown by the 11th-lord. When both lords are activated by dasha or transit, money builds rapidly; otherwise it accumulates slowly through one channel at a time. Lakshmi-yogas in your chart are best honoured by Friday Lakshmi-puja, Sri Sukta recitation, donation of cooked food on Thursdays, and never speaking ill of money or those who possess it. Avoid lending to siblings or in-laws during the antardasha of malefics. Real-estate and tangible-asset wealth (gold, land) tend to suit you better than speculation, given your ${secondLord}-ruled second house. Long-term financial security comes from disciplined saving (the Saturn principle) combined with generous giving (the Jupiter principle) — the two together attract Lakshmi most reliably.`,

    marriage: `The 7th house — Yuvati Bhava, the realm of partnership and marriage — is ${seventhSign}, ruled by ${seventhLord} (in house ${find(seventhLord)?.house ?? "—"}). Venus, the karaka of marriage and romantic love, sits in ${venP.sign}, house ${venP.house} (${venP.dignity}). ${order.gender === "Female" ? `For women, Jupiter is the karaka of husband — placed in ${jupP.sign} (house ${jupP.house}, ${jupP.dignity}).` : order.gender === "Male" ? `For men, Venus carries the additional weight of describing the wife — her placement in ${venP.sign}, house ${venP.house} reveals much about the woman who comes into your life.` : ""} The Navamsa (D9) chart shown earlier in this report is the deeper indicator of marital quality and is read alongside the D1. Your partner is most often described by the qualities of ${seventhSign} and the placements aspecting your 7th house. Marriage typically activates during the dasha of the 7th lord, Venus, or the lord of the 2nd / 8th (which extend longevity of the bond). Manglik analysis: ${chart.doshas.manglik.present ? `Mars sits in a manglik position with severity "${chart.doshas.manglik.severity}" — match with another manglik chart or perform classical remedies (Mangal Shanti, Hanuman Chalisa on Tuesdays).` : "Mars is not creating a manglik dosha in your chart, which simplifies matchmaking."} Healthy partnership grows through three Vedic principles: shared dharma (purpose), mutual respect (each honouring the other's swadharma), and regular satsang together. Avoid hasty decisions during retrograde Venus or 7th-lord debilitation transits.`,

    children: `The 5th house — Putra Bhava — is ${fifthSign} ruled by ${fifthLord} (in house ${find(fifthLord)?.house ?? "—"}). Jupiter, the karaka of progeny in classical Jyotish, sits in ${jupP.sign}, house ${jupP.house} (${jupP.dignity}${jupP.retrograde ? ", retrograde" : ""}). The Saptamsa (D7) divisional chart shown earlier is the dedicated lens for children — its lagna and 5th lord describe the soul-quality of children destined to enter your family. The blessings of children typically time with the dasha or antardasha of the 5th lord, Jupiter, or the lord of the Saptamsa lagna. Your relationship with children — your own, students, or the children of close family — carries the colour of ${fifthLord}: ${fifthLord === "Jupiter" ? "wisdom, teaching, abundance and natural ease" : fifthLord === "Mercury" ? "playful curiosity, learning, conversation and intellect" : fifthLord === "Venus" ? "artistic warmth, beauty, sweetness and indulgence" : fifthLord === "Sun" ? "leadership, discipline, dignity and pride in offspring" : fifthLord === "Mars" ? "energy, courage, sports and protective fierceness" : fifthLord === "Saturn" ? "patience, discipline, slow-bonding but deeply loyal connection" : fifthLord === "Moon" ? "emotional bonding, nurturing, mother-like care" : "an unconventional, karmic and somewhat mysterious connection"} are themes that recur. Honour the 5th house through Santana-Gopala mantra japa, donating to schools or orphanages, and serving Brahmin children with food on Thursdays. The relationship with one's children is one of the most refined sadhanas of householder life and ripens slowly over decades.`,

    health: `The 1st house — Tanu Bhava, the physical body — is ${asc} ruled by ${ascLord} (in house ${find(ascLord)?.house ?? "—"}). The 6th house (Shatru / Roga Bhava — diseases, debts, daily-life enemies, recovery) is ${sixthSign} ruled by ${sixthLord} (in house ${find(sixthLord)?.house ?? "—"}). Your constitutional dosha (per Jyotish-Ayurveda correspondences) leans toward ${asc === "Aries" || asc === "Leo" || asc === "Sagittarius" ? "Pitta — fiery, sharp digestion, prone to inflammation, heat and acidity when out of balance" : asc === "Taurus" || asc === "Virgo" || asc === "Capricorn" ? "Kapha-dominant earth — steady, robust, but prone to weight gain, sluggishness and water retention if untended" : asc === "Gemini" || asc === "Libra" || asc === "Aquarius" ? "Vata — airy, mobile, prone to anxiety, dryness, irregular sleep when stressed" : "Kapha-Vata — cool, watery, prone to congestion, lymphatic and emotional accumulation"}. The 6th lord ${sixthLord} placed in house ${find(sixthLord)?.house ?? "—"} indicates the kind of health themes most likely to recur — when its dasha or antardasha runs, give extra attention to the body. Your ascendant lord ${ascLord} thrives on a daily routine (dinacharya) appropriate to its nature: rise early, follow a regular meal pattern, practise pranayama, and protect quality of sleep. Honour the rhythms of ${nak} (your nakshatra) by doing serious sadhana on the days the Moon transits this nakshatra. Annual abhyanga (oil massage), seasonal panchakarma cleansing, and a sattvic vegetarian diet protect long-term vitality far more reliably than reactive medication. ${chart.doshas.sadeSati.active ? `Note: Sade Sati is currently active in the ${chart.doshas.sadeSati.phase} phase — extra attention to bones, joints, sleep and emotional resilience is wise during this period.` : ""}`,

    foreign: `Foreign travel and settlement are read from the 9th house (long journeys, dharma, higher pilgrimages) — ${ninthSign} ruled by ${ninthLord} — and the 12th house (foreign lands, expenses, isolated places) — ${twelfthSign} ruled by ${twelfthLord}. Rahu (the karaka of foreign and unconventional ambition) is placed in ${rahP.sign}, house ${rahP.house}; Ketu in ${ketP.sign}, house ${ketP.house}. Where the 9th-lord, 12th-lord, or Rahu sits indicates the kind of foreign exposure most likely to call you. ${rahP.house === 7 || rahP.house === 9 || rahP.house === 12 ? "Rahu's placement in a key foreign-significator house particularly amplifies the pull toward overseas opportunities." : "Rahu's placement is not in a primary foreign-significator house, so foreign travel tends to be purposeful rather than constant."} Foreign opportunities classically activate during the dasha or antardasha of the 9th lord, 12th lord, or Rahu. Your dharma in foreign lands is to serve, learn, and represent the highest of your tradition wherever you go — purposeless wandering dissipates the karmic gift, while travel aligned with your dharma multiplies it. Carry a small altar with you, maintain daily japa wherever you sleep, and never forget to send back support to your roots — these three keep the foreign placement auspicious. Real-estate and business interests in foreign locations are favoured when Jupiter transits the 9th or 12th from your Moon.`,

    spiritual: `The 9th house (Dharma Bhava — guru, father, pilgrimage, higher truth) is ${ninthSign} ruled by ${ninthLord}; the 12th house (Moksha Bhava — liberation, dissolution of ego, hidden practice) is ${twelfthSign} ruled by ${twelfthLord}. Ketu, the karaka of moksha and detachment, sits in ${ketP.sign}, house ${ketP.house}. Jupiter (guru-karaka) in ${jupP.sign}, house ${jupP.house} reveals the kind of teacher and teaching that will most reliably ripen your soul. Your janma nakshatra ${nak} (deity ${nakDeity}, lord ${nakLord}) is the personal devata-doorway most likely to bear fruit through devoted practice — daily mantra of ${nakDeity}, even just 108 repetitions, slowly opens the karmic gates the chart describes. Brahma-muhurat (the 96 minutes before sunrise) is when your subtle body is most porous to the divine; consistent practice in this window during the ${md} mahadasha is especially fruitful. Pilgrimage to ${ninthLord === "Jupiter" || ninthLord === "Sun" ? "established Vaishnava or Shaiva temples" : ninthLord === "Venus" ? "Devi shrines and beautiful temple complexes" : ninthLord === "Mars" ? "Hanuman, Subrahmanya or Devi shrines of fierce form" : ninthLord === "Saturn" ? "Shani temples and ancient stone shrines in remote locations" : ninthLord === "Mercury" ? "Vishnu temples and learning-centres of pilgrimage" : ninthLord === "Moon" ? "Shiva temples on hills, water-side shrines, Tirupati" : ninthLord === "Rahu" ? "ancient lesser-known shrines, foreign pilgrimage sites" : "ancient and somewhat unknown shrines that find you when you are ready"} during favourable transits anchors the spiritual current strongly. The deepest teaching of Jyotish: the chart is karma; sadhana is the freedom to respond to that karma with wisdom rather than reactivity. Your liberation is in your daily practice.`,
  };
}

// ─────────────── PREDICTION EXTRAS (snapshot, favourable, mantras, etc) ────
// For each life-area we surface 4-6 chart facts, 3-4 favourable upcoming periods
// (computed from current dasha), 4-5 remedies, and a mantra. These fill out
// each prediction page with structured Vedic content blocks.
type PredictionExtras = {
  snapshot: Array<[string, string]>;
  favourable: string[];
  practices: string[];
  mantra: { sanskrit: string; meaning: string };
  gemstoneTip?: string;
};

const TOPIC_FAVOURABLE_LORDS: Record<PredictionKey, string[]> = {
  personality: ["Sun", "Moon", "Jupiter"],
  education:   ["Mercury", "Jupiter"],
  career:      ["Sun", "Saturn", "Jupiter"],
  wealth:      ["Jupiter", "Venus", "Mercury"],
  marriage:    ["Venus", "Jupiter", "Moon"],
  children:    ["Jupiter", "Moon"],
  health:      ["Sun", "Mars", "Jupiter"],
  foreign:     ["Rahu", "Saturn", "Mercury"],
  spiritual:   ["Jupiter", "Ketu", "Saturn"],
};

function listFavourablePeriods(chart: BirthChart, lords: string[]): string[] {
  const out: string[] = [];
  const now = Date.now();
  const horizon = now + 15 * 365.25 * 24 * 3600 * 1000; // 15 years

  // Mahadasha matches
  (chart.dasha.mahadashas ?? []).forEach(md => {
    const start = new Date(md.startISO).getTime();
    const end = new Date(md.endISO).getTime();
    if (end < now || start > horizon) return;
    if (lords.includes(md.lord)) {
      out.push(`${md.lord} Mahadasha — ${fmtDate(md.startISO)} to ${fmtDate(md.endISO)} (${md.lengthYears.toFixed(1)} yrs of strong support).`);
    }
  });

  // Antardasha matches in the current/next mahadasha (next 5 years)
  const ads = chart.dasha.upcomingAntardashas ?? [];
  ads.forEach(a => {
    const end = new Date(a.endISO).getTime();
    if (end < now) return;
    if (lords.includes(a.lord)) {
      out.push(`${chart.dasha.current.mahadasha.lord}/${a.lord} Antardasha — ${fmtDate(a.startISO)} to ${fmtDate(a.endISO)}.`);
    }
  });

  if (out.length === 0) {
    out.push(`The lords ${lords.join(", ")} do not run as Mahadasha in the next 15 years; favourable phases come through transits — note Jupiter and Saturn passages over the relevant houses each year.`);
  }
  return out.slice(0, 4);
}

function predictionExtras(key: PredictionKey, chart: BirthChart, order: PdfKundliOrder): PredictionExtras {
  const find = (n: string) => chart.planets.find(p => p.name === n)!;
  const h = chart.houses;
  const asc = chart.ascendant.sign, ascLord = chart.ascendant.signLord;
  const moonP = find("Moon"), sunP = find("Sun"), marsP = find("Mars");
  const merP = find("Mercury"), jupP = find("Jupiter"), venP = find("Venus");
  const satP = find("Saturn"), rahP = find("Rahu"), ketP = find("Ketu");
  const fav = (k: PredictionKey) => listFavourablePeriods(chart, TOPIC_FAVOURABLE_LORDS[k]);

  const planetLine = (p: ReturnType<typeof find>) => `${p.sign}, House ${p.house}${p.dignity && p.dignity !== "Neutral" ? " · " + p.dignity : ""}${p.retrograde ? " · Retro" : ""}`;

  switch (key) {
    case "personality": return {
      snapshot: [
        ["Lagna (Ascendant)", `${asc} · Lord ${ascLord} in House ${find(ascLord).house}`],
        ["Moon Sign (Rashi)", `${chart.moonSign.sign} · ${planetLine(moonP)}`],
        ["Sun Sign (Atma)", `${chart.sunSign.sign} · ${planetLine(sunP)}`],
        ["Janma Nakshatra", `${chart.nakshatra.name} · Pada ${chart.nakshatra.pada} · Lord ${chart.nakshatra.lord}`],
        ["Presiding Deity", chart.nakshatra.deity],
        ["Lagnesh Disposition", `${ascLord} placed in House ${find(ascLord).house} (${find(ascLord).dignity})`],
      ],
      favourable: fav("personality"),
      practices: [
        `Begin every day with 12 rounds of Surya Namaskar facing East at sunrise — strengthens the Sun, the karaka of self-vitality.`,
        `Offer water (arghya) to the rising Sun while reciting "Om Suryaya Namah" 11 times — three drops of pure copper-pot water.`,
        `Wear ${lordToGem[ascLord] ?? "your ascendant lord's gem"} after a proper Pran Pratishtha ceremony — strengthens the lord of your body.`,
        `Maintain Mauna (silence) for one hour each morning during Brahma Muhurat — anchors your ${chart.nakshatra.name} energy.`,
        `Donate ${(lordToColor[ascLord] || "white").toLowerCase().split(/[\s\/]/)[0]} food on ${lordToDay[ascLord] || "Sunday"} to a Brahmin or temple — honours your ascendant lord.`,
      ],
      mantra: {
        sanskrit: `Om ${chart.nakshatra.deity} Devataye Namah`,
        meaning: `Salutations to ${chart.nakshatra.deity}, the divine deity who presides over your janma nakshatra ${chart.nakshatra.name} and is your most natural devata-doorway.`,
      },
      gemstoneTip: `Primary: ${lordToGem[ascLord] ?? "—"} (worn in ${lordToMetal[ascLord] ?? "—"}, ${lordToDay[ascLord] ?? "—"} sunrise activation).`,
    };

    case "education": return {
      snapshot: [
        ["4th House (Schooling)", `${h[3].sign} · Lord ${h[3].signLord} in House ${find(h[3].signLord).house}`],
        ["5th House (Intellect)", `${h[4].sign} · Lord ${h[4].signLord} in House ${find(h[4].signLord).house}`],
        ["Mercury (Learning Karaka)", planetLine(merP)],
        ["Jupiter (Wisdom Karaka)", planetLine(jupP)],
        ["Saraswati Indicator", merP.dignity === "Exalted" || jupP.dignity === "Exalted" || merP.dignity === "Own Sign" || jupP.dignity === "Own Sign" ? "Strong — natural scholarship" : "Moderate — discipline rewards study"],
      ],
      favourable: fav("education"),
      practices: [
        `Begin every study session with "Saraswati Namastubhyam" — invokes the goddess of learning before opening any book.`,
        `On Wednesdays (Mercury's day) chant "Om Bum Budhaya Namah" 108 times before exams or important presentations.`,
        `Donate green moong dal, books, or pens to needy children every Wednesday — strengthens Mercury's grace.`,
        `Wear an Emerald (Panna) of 3-5 carats in silver on the little finger of the right hand if Mercury permits — consult before activation.`,
        `Face East or North while studying; keep the study desk uncluttered and never study facing South (the direction of Yama).`,
      ],
      mantra: {
        sanskrit: "Saraswati Namastubhyam, Varade Kamarupini · Vidyarambham Karishyami, Siddhir Bhavatu Me Sada",
        meaning: "Salutations to Saraswati, granter of boons, embodiment of beauty. As I begin study, may success always be mine.",
      },
      gemstoneTip: `For students: Emerald (Panna) for Mercury — 3 to 5 ratti, mounted in silver, worn on little finger of right hand on Wednesday at sunrise.`,
    };

    case "career": return {
      snapshot: [
        ["10th House (Karma Bhava)", `${h[9].sign} · Lord ${h[9].signLord} in House ${find(h[9].signLord).house}`],
        ["Saturn (Profession Karaka)", planetLine(satP)],
        ["Sun (Authority Karaka)", planetLine(sunP)],
        ["Current Mahadasha", `${chart.dasha.current.mahadasha.lord} until ${fmtDate(chart.dasha.current.mahadasha.endISO)}`],
        ["Current Antardasha", `${chart.dasha.current.antardasha.lord} until ${fmtDate(chart.dasha.current.antardasha.endISO)}`],
        ["Career Tone", `${h[9].sign}-flavoured field; thrives on the qualities of ${h[9].signLord}`],
      ],
      favourable: fav("career"),
      practices: [
        `Recite the first 7 verses of the Aditya Hridayam each morning facing the Sun — the classical Vedic prescription for victory in profession and authority.`,
        `On Saturdays, light a sesame-oil lamp in the South-West corner of your office or home; donate iron or black sesame seeds to the needy.`,
        `Keep a small Surya Yantra at your work desk; cleanse it weekly with milk and turmeric water on Sundays.`,
        `Avoid wearing strict black or dark blue while signing important contracts — choose maroon, gold or warm earth tones instead.`,
        `On the start of every Wednesday and Thursday, write down three professional intentions in a saffron-paper notebook — anchors Mercury and Jupiter to your karma.`,
      ],
      mantra: {
        sanskrit: "Om Hraam Hreem Hraum Sah Suryaya Namah",
        meaning: "Beej mantra of the Sun — strengthens Atma-bala, leadership presence, recognition from authorities and the courage to lead.",
      },
      gemstoneTip: `Career boost: Yellow Sapphire (Pukhraj) for Jupiter, OR Ruby (Manik) for Sun — choose based on which of the two karakas needs more strength in your chart. Always consult a qualified jyotishi before activation.`,
    };

    case "wealth": return {
      snapshot: [
        ["2nd House (Dhana — savings)", `${h[1].sign} · Lord ${h[1].signLord} in House ${find(h[1].signLord).house}`],
        ["11th House (Labha — gains)", `${h[10].sign} · Lord ${h[10].signLord} in House ${find(h[10].signLord).house}`],
        ["Jupiter (Wealth Karaka)", planetLine(jupP)],
        ["Venus (Luxury Karaka)", planetLine(venP)],
        ["Lakshmi Indicator", (h[1].planets.includes("Jupiter") || h[10].planets.includes("Jupiter") || h[1].planets.includes("Venus") || h[10].planets.includes("Venus")) ? "Strong — Lakshmi-yoga support" : "Steady — built through discipline + giving"],
      ],
      favourable: fav("wealth"),
      practices: [
        `Recite the Sri Sukta or Kanakadhara Stotram every Friday evening — the two most powerful Lakshmi-stotras for material abundance.`,
        `Light a ghee lamp in front of Goddess Lakshmi on every Purnima (full moon) and on every Friday with white flowers and rice.`,
        `Donate cooked food (annadanam) to at least one needy person on every Thursday — opens the Jupiter channel of wealth.`,
        `Keep a small silver pot of water in the North or North-East corner of your home — the direction of Kubera, the treasurer of the gods.`,
        `Never speak ill of money, of wealthy people, or of those who beg from you — Lakshmi withdraws from places of contempt.`,
      ],
      mantra: {
        sanskrit: "Om Shreem Mahalakshmiyei Namah",
        meaning: "Beej mantra of Mahalakshmi — invokes the eight-fold abundance (Ashta-Lakshmi) into one's home and life.",
      },
      gemstoneTip: `Wealth combinations: Yellow Sapphire (Pukhraj) for Jupiter and Diamond (Heera) — or natural White Sapphire as substitute — for Venus. Wear separately, not together, on prescribed fingers.`,
    };

    case "marriage": return {
      snapshot: [
        ["7th House (Yuvati Bhava)", `${h[6].sign} · Lord ${h[6].signLord} in House ${find(h[6].signLord).house}`],
        ["Venus (Marriage Karaka)", planetLine(venP)],
        [order.gender === "Female" ? "Jupiter (Husband Karaka)" : "Venus (Wife Karaka)", planetLine(order.gender === "Female" ? jupP : venP)],
        ["Manglik Status", chart.doshas.manglik.present ? `Present — ${chart.doshas.manglik.severity}` : "Not Present"],
        ["Navamsa Lagna", chart.navamsa ? jyotish.SIGNS_EN[chart.navamsa.ascendantSign] : "—"],
        ["7th from Moon", h[(chart.moonSign.signIndex + 6) % 12]?.sign ?? "—"],
      ],
      favourable: fav("marriage"),
      practices: [
        `Unmarried natives: recite the Swayamvara Parvati Mantra daily — 108 times for 41 days — the classical practice for finding a suitable spouse.`,
        `On Fridays, light a ghee lamp before Goddess Parvati or Lakshmi-Narayan with rose petals and white sweets.`,
        `Married natives: every full moon (Purnima) night, share a sweet dish with your spouse and offer one to the Moon — strengthens marital harmony.`,
        `Visit a Devi temple (preferably Parvati or Lalita) on every Friday or Tuesday with red flowers and a coconut.`,
        chart.doshas.manglik.present ? `Manglik remedy: recite the Mangal Stotram on Tuesdays; perform Mangal Shanti Puja before marriage; pair-match with another Manglik chart for compatibility.` : `Match-making note: your chart is non-Manglik, simplifying compatibility analysis. Always insist on full Ashtakoota Guna Milan (36-point) matching before fixing the alliance.`,
      ],
      mantra: {
        sanskrit: "Om Hreem Yogini Yogini Yogeshwari Yoga Bhayankari · Sakala Sthavara Jangamasya · Mukhah Hridayam Mama Vasham Akarshaya Akarshaya Swaha",
        meaning: "Swayamvara Parvati Mantra — invokes Devi Parvati to bring the right life-partner whose heart and mind are aligned with yours.",
      },
      gemstoneTip: `Marriage support: Diamond (Heera) or White Sapphire for Venus, in silver or platinum, on the middle finger. For women seeking husband: Yellow Sapphire for Jupiter. Activation must be done on a Friday at sunrise.`,
    };

    case "children": return {
      snapshot: [
        ["5th House (Putra Bhava)", `${h[4].sign} · Lord ${h[4].signLord} in House ${find(h[4].signLord).house}`],
        ["Jupiter (Progeny Karaka)", planetLine(jupP)],
        ["Saptamsa Lagna (D7)", `${chart.navamsa ? "(see Saptamsa chart in this report)" : "—"}`],
        ["5th Lord Strength", h[4].signLord ? `${h[4].signLord} in ${find(h[4].signLord).sign} (${find(h[4].signLord).dignity})` : "—"],
        ["Putra Karaka Influence", `${jupP.sign}, House ${jupP.house}, ${jupP.dignity}`],
        ["Aspect on 5th", h[4].planets.length ? `Occupied by: ${h[4].planets.join(", ")}` : "Empty (read by aspects)"],
      ],
      favourable: fav("children"),
      practices: [
        `Recite the Santana Gopala Mantra 108 times daily for 48 days — the classical Vedic prescription for begetting healthy, virtuous children.`,
        `On Thursdays (Jupiter's day), donate yellow sweets, books, or yellow lentils to needy children or orphanages.`,
        `Visit a Krishna or Lakshmi-Narayana temple on every Thursday and Ekadashi with yellow flowers and a small banana offering.`,
        `Couples trying for a child: sleep with the head pointing East (toward sunrise) and never South — and avoid quarrelling near or before bed.`,
        `On the 11th day of every bright fortnight (Shukla Ekadashi), observe partial fasting and recite the Vishnu Sahasranama — opens the Jupiter blessing for progeny.`,
      ],
      mantra: {
        sanskrit: "Devakisuta Govinda Vasudeva Jagatpate · Dehi Me Tanayam Krishna Twamaham Sharanam Gatah",
        meaning: "Santana Gopala Mantra — O Krishna, son of Devaki, lord of the universe, grant me a child; I have taken refuge in you.",
      },
      gemstoneTip: `For progeny: Yellow Sapphire (Pukhraj) for Jupiter, 3 to 5 ratti, mounted in gold, worn on the index finger of the right hand on Thursday at sunrise after proper energization.`,
    };

    case "health": return {
      snapshot: [
        ["1st House (Body)", `${asc} · Lord ${ascLord} in House ${find(ascLord).house}`],
        ["6th House (Disease & Recovery)", `${h[5].sign} · Lord ${h[5].signLord} in House ${find(h[5].signLord).house}`],
        ["Sun (Vitality Karaka)", planetLine(sunP)],
        ["Mars (Energy & Surgery)", planetLine(marsP)],
        ["Constitutional Type", ["Aries","Leo","Sagittarius"].includes(asc) ? "Pitta-dominant (fiery, sharp)" : ["Taurus","Virgo","Capricorn"].includes(asc) ? "Kapha-dominant (steady, robust)" : ["Gemini","Libra","Aquarius"].includes(asc) ? "Vata-dominant (mobile, airy)" : "Kapha-Vata (cool, watery)"],
        ["Sade Sati Status", chart.doshas.sadeSati.active ? `Active — ${chart.doshas.sadeSati.phase} phase` : "Not active"],
      ],
      favourable: fav("health"),
      practices: [
        `Daily Surya Namaskar (12 rounds) at sunrise — the single most effective Vedic prescription for whole-body vitality.`,
        `Self-abhyanga (warm sesame-oil massage) twice a week before bath — pacifies all three doshas, strengthens immunity, slows ageing.`,
        `Recite the Maha Mrityunjaya Mantra 11, 21 or 108 times every morning — classical protection against illness and untimely death.`,
        `Eat your largest meal at midday when Agni (digestive fire) is strongest; finish dinner before sunset on at least 3 days a week.`,
        `Sleep by 10 PM and rise before 6 AM — synchronises pranic flow with the natural sandhi (twilight) periods of dawn and dusk.`,
        chart.doshas.sadeSati.active ? `Sade Sati additional: worship Hanuman every Saturday with sesame-oil lamp; recite Hanuman Chalisa twice daily.` : `Maintain seasonal Panchakarma cleansing once a year for long-term immunity.`,
      ],
      mantra: {
        sanskrit: "Om Tryambakam Yajamahe Sugandhim Pushtivardhanam · Urvarukamiva Bandhanan Mrityor Mukshiya Maamritat",
        meaning: "Maha Mrityunjaya Mantra — we worship the three-eyed Lord Shiva, the fragrant nourisher of all beings; may he liberate us from the bondage of death and grant immortality.",
      },
      gemstoneTip: `Health support: Red Coral (Munga) for Mars when energy needs strengthening, OR Ruby (Manik) for Sun for general vitality. NEVER wear Blue Sapphire (Neelam) without strict consultation — it can act swiftly either way.`,
    };

    case "foreign": return {
      snapshot: [
        ["9th House (Long Journeys)", `${h[8].sign} · Lord ${h[8].signLord} in House ${find(h[8].signLord).house}`],
        ["12th House (Foreign Lands)", `${h[11].sign} · Lord ${h[11].signLord} in House ${find(h[11].signLord).house}`],
        ["Rahu (Foreign Karaka)", planetLine(rahP)],
        ["Ketu (Detachment from Roots)", planetLine(ketP)],
        ["Foreign Pull Indicator", [7, 9, 12].includes(rahP.house) ? "Strong — Rahu activates foreign houses" : "Moderate — depends on transit timing"],
        ["Moon Dispositor", `Moon in ${chart.moonSign.sign} ruled by ${chart.moonSign.signLord}`],
      ],
      favourable: fav("foreign"),
      practices: [
        `Before any foreign travel, perform Ganapati puja with 21 modaks and recite "Vakratunda Mahakaya..." 21 times.`,
        `Carry a small Hanuman idol or yantra in your travel bag — protects against accidents, theft and miscommunication abroad.`,
        `On Saturdays, donate to migrant workers, refugees, or those displaced from home — softens malefic Rahu in the foreign houses.`,
        `Maintain a small altar wherever you sleep abroad — light a ghee lamp on full moon and new moon nights even in a hotel room.`,
        `Always send back a portion of foreign earnings to your roots (parents, native temple, ancestral village) — preserves the auspiciousness of the 9th and 12th houses.`,
      ],
      mantra: {
        sanskrit: "Vakratunda Mahakaya Suryakoti Samaprabha · Nirvighnam Kuru Me Deva Sarva Karyeshu Sarvada",
        meaning: "O Ganesha, of curved trunk and great body, with the brilliance of a thousand suns — make my work obstacle-free in all undertakings, always.",
      },
      gemstoneTip: `For overseas success: Hessonite (Gomed) for Rahu — 5 to 7 ratti, in silver, on middle finger, activated on Saturday at twilight. Test for 7 days before permanent wear.`,
    };

    case "spiritual": return {
      snapshot: [
        ["9th House (Dharma)", `${h[8].sign} · Lord ${h[8].signLord} in House ${find(h[8].signLord).house}`],
        ["12th House (Moksha)", `${h[11].sign} · Lord ${h[11].signLord} in House ${find(h[11].signLord).house}`],
        ["Jupiter (Guru Karaka)", planetLine(jupP)],
        ["Ketu (Moksha Karaka)", planetLine(ketP)],
        ["Janma Nakshatra Deity", chart.nakshatra.deity],
        ["Ishta Devata Pointer", `Look at the lord of the 12th from the Atmakaraka in the Navamsa — for now, follow ${chart.nakshatra.deity}, your nakshatra deity.`],
      ],
      favourable: fav("spiritual"),
      practices: [
        `Begin every day with 10 minutes of silent meditation in Brahma Muhurat (the 96 minutes before sunrise) — the most spiritually receptive window.`,
        `Daily japa of the Gayatri Mantra 108 times facing East — universally recommended for all spiritual seekers regardless of tradition.`,
        `Maintain Ekadashi vrata (partial fast on the 11th day of each lunar fortnight) — accelerates karmic burning.`,
        `Visit a temple of ${chart.nakshatra.deity} at least once a month — your most direct devata-doorway.`,
        `Read or listen to a verse of the Bhagavad Gita each evening before sleep — even one verse a day completes the text in two years.`,
      ],
      mantra: {
        sanskrit: "Om Bhur Bhuvah Svaha · Tat Savitur Varenyam · Bhargo Devasya Dhimahi · Dhiyo Yo Nah Prachodayat",
        meaning: "Gayatri Mantra — we meditate on the radiant divine effulgence of the supreme Sun; may it illumine our intellect.",
      },
      gemstoneTip: `For sadhana: Yellow Sapphire (Pukhraj) for Jupiter strengthens dharma; Cat's Eye (Lehsunia) for Ketu deepens detachment and meditation. Choose with discernment based on current dasha.`,
    };
  }
}

function yearlyOutlook(key: PredictionKey, chart: BirthChart): string {
  const md = chart.dasha.current.mahadasha?.lord ?? "Jupiter";
  const ad = chart.dasha.current.antardasha?.lord ?? md;
  const lens = `${md}/${ad}`;
  switch (key) {
    case "personality": return `Over the next twelve months, your inner life is filtered through the ${lens} lens — expect a focus on the qualities that ${ad} naturally activates: clarity of voice, the courage to say what you mean, and the slow refinement of how you present yourself in the world. Identity work done now (journaling, satsang, regular silence) will yield results far beyond the year.`;
    case "education":   return `In the coming year the study faculties most active under ${lens} are concentration and synthesis — bigger ideas come together faster, but only if you sit with them. Books in your field, structured courses, and one consistent teacher will outperform scattered learning. Expect at least one significant breakthrough in understanding around the ${ad} sub-period.`;
    case "career":      return `Career karma over the next twelve months runs through ${lens}. The dasha asks you to commit to a single direction rather than hedging. Expect visibility through aligned action, not through self-promotion. The work you do quietly, with integrity, attracts the right opportunity in due time — particularly during the ${ad} antardasha window.`;
    case "wealth":      return `Wealth flows in this year are shaped by ${lens}. Steady channels (salary, contracts, recurring revenue) are favoured over speculation. A modest, disciplined Lakshmi sadhana on Fridays — combined with weekly review of finances and at least one charitable act per month — will visibly shift income flow within 90-120 days.`;
    case "marriage":    return `Relationship karma in the next twelve months operates under ${lens}. For the unmarried, partnership opportunities arise through traditional channels (family, work, community satsang) more than through chance encounters. For the married, the year asks for conscious tending — shared rituals, weekly dedicated time, and deliberate choosing of each other anew.`;
    case "children":    return `Matters of progeny over the year unfold through the ${lens} window. Whether you are seeking conception, raising young children, or guiding adolescents, the dasha rewards patience and the establishment of small daily rituals (storytelling, evening prayer, shared meals). Significant developments cluster around the ${ad} sub-period.`;
    case "health":      return `Vitality in the coming year operates under ${lens}. The body asks you to honour your constitutional rhythms — early sleep, warm meals, daily oil, and one form of pranayama practised without fail. Preventive sadhana now prevents the need for corrective intervention later. The ${ad} antardasha is a particularly good window for any cleansing programme.`;
    case "foreign":     return `Foreign-related karma in the next twelve months runs through ${lens}. Whether the question is travel, immigration, foreign clients or distant studies, the dasha will reveal whether the pattern is supportive — keep documents in order, maintain Rahu-pacifying remedies, and expect movement (sometimes sudden) particularly during the ${ad} sub-period.`;
    case "spiritual":   return `The spiritual current of the next twelve months flows through ${lens}. Sadhana that is established now will carry you through subsequent years; sadhana left unestablished will keep getting postponed. One mantra, one teacher, one daily window of silence — these three commitments transform the chart faster than any external remedy.`;
  }
}

function closingReflection(key: PredictionKey): string {
  switch (key) {
    case "personality": return "The chart maps the soil; you are still the gardener. Read the placements as tendencies, not verdicts. The sustained practice of self-observation in silence (svadhyaya) is what slowly transforms karma into character.";
    case "education":   return "True learning is a Saraswati-current — it requires regularity more than intensity. A focused 90 minutes daily for a year will transform you more than 12 hours a day for a month. Begin with the mantra; let the goddess do the work.";
    case "career":      return "The 10th house is karma, not career. Choose work that lets you act with integrity, then let recognition arrive in its own dasha-time. Saturn rewards those who master one craft over a decade more than those who chase a dozen in a year.";
    case "wealth":      return "Lakshmi follows two things — gratitude and giving. Recite the Sri Sukta on Fridays, give one-tenth of what you receive, and never speak ill of money or those who beg from you. The Vedic equation of wealth is internal long before it manifests.";
    case "marriage":    return "The 7th house describes the partner you are ready for, not the partner you wish for. Marriage is sadhana — the daily polishing of two egos against each other until both become softer. Pray for harmony more than for excitement.";
    case "children":    return "Children come not when we want them, but when the fifth house and Jupiter open the karmic gate together. Continue the mantra and the practice; trust the timing of the unseen.";
    case "health":      return "The body is the temple of the atma. Maintain it with the same reverence you would offer to a temple deity — daily oil, daily breath, daily silence. The Vedic prescription for long life is simple, but it must be daily.";
    case "foreign":     return "Rahu carries you to where you do not belong, so that you can discover who you are. Foreign lands sharpen the soul more than comfortable ones — receive the experience as karma, not as opportunity alone.";
    case "spiritual":   return "All other questions about the chart are preparation for this one. The chart is karma; sadhana is the freedom to respond to that karma with wisdom rather than reactivity. Your moksha is in your daily practice.";
  }
}

async function generateAIPredictions(chart: BirthChart, order: PdfKundliOrder): Promise<Predictions> {
  if (!process.env.OPENAI_API_KEY) return fallbackPredictions(chart, order);
  try {
    const openai = new OpenAI();
    const planetSummary = chart.planets.map(p => `${p.name} in ${p.sign} (house ${p.house}, ${p.dignity}${p.retrograde ? ", retrograde" : ""}${p.combust ? ", combust" : ""}, nakshatra ${p.nakshatra})`).join("; ");
    const houseSummary = chart.houses.map(h => `H${h.number}=${h.sign}(L:${h.signLord})${h.planets.length ? "[" + h.planets.join(",") + "]" : ""}`).join(" | ");
    const prompt = `You are a senior Jyotish acharya in the Parashari tradition writing a premium birth-chart report for a paying customer. Speak warmly and directly to the native, weaving classical Vedic concepts (graha, bhava, dasha, nakshatra) with modern relevance. NO Sanskrit-only sentences — translate. NO disclaimers about "this is general advice". NO emojis.

Native: ${order.fullName} (${order.gender ?? "—"}), born ${order.birthDate} ${order.birthTime} at ${chart.birth.place.name}.
Lagna: ${chart.ascendant.sign} (lord ${chart.ascendant.signLord}, nakshatra ${chart.ascendant.nakshatra} pada ${chart.ascendant.pada}).
Moon: ${chart.moonSign.sign} | Sun: ${chart.sunSign.sign} | Janma Nakshatra: ${chart.nakshatra.name} (deity ${chart.nakshatra.deity}, lord ${chart.nakshatra.lord}).
Planets: ${planetSummary}.
Houses: ${houseSummary}.
Doshas: Manglik=${chart.doshas.manglik.present ? chart.doshas.manglik.severity : "No"}, Kalsarpa=${chart.doshas.kalsarpa.present ? "Yes" : "No"}, SadeSati=${chart.doshas.sadeSati.active ? chart.doshas.sadeSati.phase : "No"}.
Current Dasha: ${chart.dasha.current.mahadasha.lord} mahadasha → ${chart.dasha.current.antardasha.lord} antardasha.

Write nine prediction blocks. Each block must be 180-240 words, single paragraph, no bullet points, no headings inside the text. Reference specific planets and houses from the chart above so it feels personal — never generic. Return STRICT JSON in this exact shape:

{
  "personality": "...",
  "education": "...",
  "career": "...",
  "wealth": "...",
  "marriage": "...",
  "children": "...",
  "health": "...",
  "foreign": "...",
  "spiritual": "..."
}`;
    const res = await openai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      temperature: 0.85,
      max_tokens: 4000,
      messages: [
        { role: "system", content: "You write premium personalised Vedic Jyotish predictions. Output strict JSON only." },
        { role: "user", content: prompt },
      ],
    });
    const txt = res.choices?.[0]?.message?.content ?? "{}";
    const parsed = JSON.parse(txt) as Partial<Predictions>;
    const out = fallbackPredictions(chart, order);
    for (const k of PREDICTION_KEYS) {
      if (typeof parsed[k] === "string" && (parsed[k] as string).length > 80) out[k] = parsed[k] as string;
    }
    return out;
  } catch (e) {
    console.error("[kundli-pdf] AI predictions failed, using template:", e);
    return fallbackPredictions(chart, order);
  }
}

export async function generatePremiumKundliPDF(order: PdfKundliOrder): Promise<PdfBuildResult> {
  // 1. Resolve birthplace
  const { city, warning } = await jyotish.geocodePlace(order.birthCity);

  // 2. Parse birth date/time using jyotish helper for consistency with /api/ai/kundli
  const parsedDt = jyotish.parseBirthInput({ birthDate: order.birthDate, birthTime: order.birthTime });
  if (!parsedDt) throw new Error("Could not parse birth date/time");

  // 3. Compute the full chart
  const chart = jyotish.computeBirthChart({
    ...parsedDt,
    lat: city.lat, lon: city.lon, tz: city.tz, placeName: city.name,
  });
  const moon = chart.planets.find(p => p.name === "Moon")!;
  const nak = chart.nakshatra;
  const currentDasha = chart.dasha.current;
  const mahadashaList = chart.dasha.mahadashas;

  // 3b. Janma Panchang at birth (Tithi/Vara/Yoga/Karana on the day of birth at the birth place)
  let birthPanchang: jyotish.DailyPanchang | null = null;
  try {
    birthPanchang = jyotish.computeDailyPanchang(
      parsedDt.year, parsedDt.month, parsedDt.day,
      { name: city.name, lat: city.lat, lon: city.lon, tz: city.tz },
    );
  } catch (e) {
    console.error("[kundli-pdf] panchang computation failed:", e);
  }

  // 3c. Numerology
  const numerology = {
    mulank: computeMulank(order.birthDate),
    bhagyank: computeBhagyank(order.birthDate),
    naamank: computeNaamank(order.fullName),
  };

  // 3d. AI predictions (parallel-safe; falls back to template on failure)
  const predictions = await generateAIPredictions(chart, order);

  // 4. Prepare output path
  const dir = path.join(process.cwd(), "uploads", "kundli-pdfs");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  const safeName = order.fullName.replace(/[^A-Za-z0-9_-]+/g, "_").slice(0, 40) || "kundli";
  const fileName = `VedicTatva_Kundli_${safeName}_${order.id}.pdf`;
  const filePath = path.join(dir, fileName);

  // 5. Render the PDF
  await new Promise<void>((resolve, reject) => {
    // Password-protect the PDF using the user's DOB in DDMMYYYY. Owner password is a
    // separate random string so we (the issuer) retain full edit/print rights while
    // the customer uses their DOB as a memorable, never-stored user password.
    const userPassword = derivePdfPassword(order.birthDate);
    const ownerPassword = `vt-${order.id}-${Math.random().toString(36).slice(2, 14)}`;
    const doc = new PDFDocument({
      size: "A4",
      margin: PAGE_MARGIN,
      bufferPages: true,
      info: { Title: `Vedic Kundli — ${order.fullName}`, Author: "Vedic Tatva", Subject: "Premium Vedic Birth Chart" },
      userPassword,
      ownerPassword,
      permissions: { printing: "highResolution", copying: false, modifying: false, annotating: false },
      pdfVersion: "1.7",
    });
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);
    stream.on("finish", () => resolve());
    stream.on("error", (e) => reject(e));

    const W = doc.page.width;
    const H = doc.page.height;
    const contentW = W - PAGE_MARGIN * 2;

    const setFill = (c: string) => doc.fillColor(c);
    const setStroke = (c: string) => doc.strokeColor(c);
    const heading = (text: string, opts: { size?: number; spaceBefore?: number; spaceAfter?: number; color?: string } = {}) => {
      const { size = 15, spaceBefore = 14, spaceAfter = 6, color = MAROON } = opts;
      doc.moveDown(spaceBefore / 12);
      setFill(color).font("Helvetica-Bold").fontSize(size).text(text, { align: "left" });
      const y = doc.y + 2;
      setStroke(GOLD).lineWidth(0.6).moveTo(PAGE_MARGIN, y).lineTo(PAGE_MARGIN + 60, y).stroke();
      doc.moveDown(spaceAfter / 12);
      setFill(INK).font("Helvetica").fontSize(10);
    };
    const para = (text: string) => {
      setFill(INK).font("Helvetica").fontSize(10).text(text, { align: "justify", lineGap: 2 });
      doc.moveDown(0.4);
    };
    const kv = (label: string, value: string) => {
      const startY = doc.y;
      setFill(MUTED).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), PAGE_MARGIN, startY, { width: 150, continued: false });
      setFill(INK).font("Helvetica").fontSize(10).text(value || "—", PAGE_MARGIN + 150, startY, { width: contentW - 150 });
      doc.moveDown(0.15);
    };
    const ensureRoom = (need: number) => {
      if (doc.y + need > H - PAGE_MARGIN - 30) doc.addPage();
    };
    const sectionDivider = () => {
      doc.moveDown(0.5);
      setStroke(RULE).lineWidth(0.4).moveTo(PAGE_MARGIN, doc.y).lineTo(W - PAGE_MARGIN, doc.y).stroke();
      doc.moveDown(0.5);
    };

    // ---------- Rich layout helpers (used by prediction pages, doshas, gems) ----------
    // Bordered card with a maroon title bar and a list of label/value rows on cream.
    const contentBlock = (title: string, rows: Array<[string, string]>) => {
      const titleBarH = 22;
      const rowH = 16;
      const padY = 10;
      const blockH = titleBarH + rows.length * rowH + padY;
      ensureRoom(blockH + 8);
      const startY = doc.y;
      // background
      doc.save();
      doc.rect(PAGE_MARGIN, startY, contentW, blockH).fill(CREAM);
      doc.restore();
      // border
      doc.save();
      doc.strokeColor(RULE).lineWidth(0.6).rect(PAGE_MARGIN, startY, contentW, blockH).stroke();
      doc.restore();
      // title bar
      doc.save();
      doc.rect(PAGE_MARGIN, startY, contentW, titleBarH).fill(MAROON);
      doc.restore();
      setFill(GOLD).font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), PAGE_MARGIN + 12, startY + 7, { width: contentW - 24 });
      // rows
      let ry = startY + titleBarH + 6;
      rows.forEach(([k, v]) => {
        setFill(MUTED).font("Helvetica-Bold").fontSize(7.5).text(k.toUpperCase(), PAGE_MARGIN + 14, ry + 1, { width: 150 });
        setFill(INK).font("Helvetica").fontSize(9).text(v || "—", PAGE_MARGIN + 168, ry, { width: contentW - 184 });
        ry += rowH;
      });
      doc.y = startY + blockH + 8;
    };

    // Bordered card with a maroon title bar and a bulleted list on cream.
    const bulletBlock = (title: string, items: string[]) => {
      const titleBarH = 22;
      // Estimate per-item height conservatively (multi-line items wrap)
      let estH = titleBarH + 14;
      items.forEach(it => {
        const h = doc.heightOfString(it, { width: contentW - 36, lineGap: 1.5 });
        estH += h + 6;
      });
      ensureRoom(estH + 8);
      const startY = doc.y;
      doc.save();
      doc.rect(PAGE_MARGIN, startY, contentW, estH).fill(CREAM);
      doc.restore();
      doc.save();
      doc.strokeColor(RULE).lineWidth(0.6).rect(PAGE_MARGIN, startY, contentW, estH).stroke();
      doc.restore();
      doc.save();
      doc.rect(PAGE_MARGIN, startY, contentW, titleBarH).fill(MAROON);
      doc.restore();
      setFill(GOLD).font("Helvetica-Bold").fontSize(9).text(title.toUpperCase(), PAGE_MARGIN + 12, startY + 7);
      let by = startY + titleBarH + 8;
      items.forEach(it => {
        setFill(GOLD).circle(PAGE_MARGIN + 14, by + 5, 2.4).fill();
        setFill(INK).font("Helvetica").fontSize(9.5).text(it, PAGE_MARGIN + 24, by, { width: contentW - 36, align: "left", lineGap: 1.5 });
        by = doc.y + 4;
      });
      doc.y = startY + estH + 8;
    };

    // Gold-bordered cream callout for mantras.
    const mantraCallout = (sanskrit: string, meaning: string) => {
      const padding = 14;
      const sansH = doc.heightOfString(sanskrit, { width: contentW - padding * 2, lineGap: 2 });
      const meanH = doc.heightOfString(meaning, { width: contentW - padding * 2, lineGap: 1.5 });
      const blockH = 18 + sansH + 10 + meanH + 14;
      ensureRoom(blockH + 8);
      const startY = doc.y;
      doc.save();
      doc.rect(PAGE_MARGIN, startY, contentW, blockH).fill("#FFF8E1");
      doc.restore();
      doc.save();
      doc.strokeColor(GOLD).lineWidth(0.9).rect(PAGE_MARGIN, startY, contentW, blockH).stroke();
      doc.restore();
      setFill(MAROON).font("Helvetica-Bold").fontSize(8).text("RECOMMENDED MANTRA", PAGE_MARGIN, startY + 6, { width: contentW, align: "center" });
      setFill(MAROON).font("Helvetica-BoldOblique").fontSize(11).text(sanskrit, PAGE_MARGIN + padding, startY + 20, { width: contentW - padding * 2, align: "center", lineGap: 2 });
      setFill(MUTED).font("Helvetica-Oblique").fontSize(8.5).text(meaning, PAGE_MARGIN + padding, startY + 24 + sansH, { width: contentW - padding * 2, align: "center", lineGap: 1.5 });
      doc.y = startY + blockH + 8;
    };

    // ============ COVER PAGE ============
    doc.save();
    doc.rect(0, 0, W, 220).fill(CREAM);
    doc.restore();

    doc.save();
    doc.rect(0, 0, W, 70).fill(MAROON);
    doc.restore();
    setFill(GOLD).font("Helvetica-Bold").fontSize(20).text("VEDIC TATVA", PAGE_MARGIN, 24, { align: "left" });
    setFill("#F5E9C7").font("Helvetica").fontSize(9).text("Authentic Vedic Astrology  ·  vedictatva.com", PAGE_MARGIN, 50, { align: "left" });

    doc.y = 110;
    setFill(MAROON).font("Helvetica-Bold").fontSize(30).text("Premium Kundli Report", PAGE_MARGIN, doc.y, { align: "center" });
    setFill(GOLD).font("Helvetica-Oblique").fontSize(13).text("Sidereal Vedic Birth Chart  ·  Lahiri Ayanamsa", PAGE_MARGIN, doc.y + 6, { align: "center" });
    setStroke(GOLD).lineWidth(0.8).moveTo(W / 2 - 60, doc.y + 18).lineTo(W / 2 + 60, doc.y + 18).stroke();

    doc.y = 260;
    const cardX = PAGE_MARGIN + 30, cardY = doc.y, cardW = contentW - 60;
    setStroke(GOLD).lineWidth(1).rect(cardX, cardY, cardW, 210).stroke();
    setFill(MAROON).font("Helvetica-Bold").fontSize(11).text("PREPARED FOR", cardX + 20, cardY + 18);
    setFill(INK).font("Helvetica-Bold").fontSize(22).text(order.fullName, cardX + 20, cardY + 38);

    let cy = cardY + 80;
    const cardKv = (label: string, value: string) => {
      setFill(MUTED).font("Helvetica-Bold").fontSize(8).text(label.toUpperCase(), cardX + 20, cy);
      setFill(INK).font("Helvetica").fontSize(10).text(value, cardX + 130, cy, { width: cardW - 150 });
      cy += 18;
    };
    cardKv("Date of Birth", fmtBirth(order.birthDate, order.birthTime));
    cardKv("Place of Birth", `${city.name}${city.country ? ", " + city.country : ""}`);
    cardKv("Lat / Lon / TZ", `${city.lat.toFixed(4)}°, ${city.lon.toFixed(4)}°  ·  ${city.tz}`);
    if (order.gender) cardKv("Gender", order.gender);
    cardKv("Lagna", `${chart.ascendant.signHi} / ${chart.ascendant.sign}`);
    cardKv("Janma Nakshatra", `${nak.nameHi} / ${nak.name} (Pada ${nak.pada})`);
    cardKv("Report Issued", fmtDate(new Date().toISOString()));

    doc.y = H - 110;
    setFill(MUTED).font("Helvetica-Oblique").fontSize(9).text(
      "This report is computed using the Swiss Ephemeris with Lahiri ayanamsa — the standard sidereal method used across India for authentic Vedic astrology. The interpretation honours classical Jyotish texts and the living tradition of Indian acharyas.",
      PAGE_MARGIN + 40, doc.y, { width: contentW - 80, align: "center", lineGap: 2 }
    );
    if (warning) {
      doc.moveDown(0.6);
      setFill("#A35C00").fontSize(8).text(`Note: ${warning}`, { align: "center" });
    }

    // ============ PAGE 2 — SUMMARY ============
    doc.addPage();
    pageHeader(doc, "Birth Chart Summary");

    heading("Astrological Identity");
    kv("Lagna (Ascendant)", `${chart.ascendant.signHi} / ${chart.ascendant.sign}  ·  Lord: ${chart.ascendant.signLord}`);
    kv("Lagna Nakshatra", `${chart.ascendant.nakshatra}  ·  Pada ${chart.ascendant.pada}`);
    kv("Moon Sign (Rashi)", `${chart.moonSign.signHi} / ${chart.moonSign.sign}`);
    kv("Janma Nakshatra", `${nak.nameHi} / ${nak.name}  ·  Pada ${nak.pada}`);
    kv("Nakshatra Lord", nak.lord);
    kv("Presiding Deity", nak.deity);
    kv("Gana / Guna", `${nak.gana} / ${nak.guna}`);
    kv("Symbol", nak.symbol);
    kv("Sun Sign", `${chart.sunSign.signHi} / ${chart.sunSign.sign}`);
    kv("Ayanamsa Used", `${chart.ayanamsaDeg.toFixed(4)}° (Lahiri)`);

    heading("What this means");
    para(
      `This chart marks the beginning of a Vedic life-path under the ${chart.ascendant.sign} ascendant, with the Moon resting in the constellation of ${nak.name} — presided by ${nak.deity} and ruled by ${nak.lord}. ` +
      `The placement of the seven grahas and the lunar nodes (Rahu and Ketu) at the moment of your first breath forms the unique signature of your dharma, karma, and svabhava.`
    );
    para(
      `The interpretations on the following pages are grounded in classical Jyotish — Brihat Parashara Hora Shastra, Phaladeepika, and Saravali — and contextualised for contemporary life. They are not predictions of fixed destiny; they are a map of tendencies, gifts, and growth-edges that an awakened soul can work with skilfully.`
    );

    // ============ PAGE 2b — JANMA PANCHANG (BIRTH PANCHANG) ============
    if (birthPanchang) {
      doc.addPage();
      pageHeader(doc, "Janma Panchang — The Five Limbs at Your Birth");
      para("The Panchang ('five limbs') describes the qualitative texture of a moment in time using Tithi (lunar day), Vara (weekday), Nakshatra (lunar mansion), Yoga, and Karana. The Panchang at the moment of your first breath remains a subtle signature carried throughout life.");

      heading("Calendar Coordinates");
      kv("Hindu Month (Amanta)", `${birthPanchang.hinduMonth.nameHi} / ${birthPanchang.hinduMonth.name}`);
      kv("Vikram Samvat", String(birthPanchang.vikramSamvat));
      kv("Shaka Samvat", String(birthPanchang.shakaSamvat));
      kv("Vara (Weekday)", `${birthPanchang.weekday.hi} / ${birthPanchang.weekday.en}  ·  Lord: ${birthPanchang.weekday.lord}`);

      heading("The Five Limbs at Birth");
      kv("Tithi (Lunar Day)", `${birthPanchang.tithi.nameHi} / ${birthPanchang.tithi.name}  ·  ${birthPanchang.tithi.pakshaHi} (${birthPanchang.tithi.paksha})`);
      kv("Nakshatra", `${birthPanchang.nakshatra.nameHi} / ${birthPanchang.nakshatra.name}  ·  Pada ${birthPanchang.nakshatra.pada}  ·  Lord ${birthPanchang.nakshatra.lord}  ·  Deity ${birthPanchang.nakshatra.deity}`);
      kv("Yoga", `${birthPanchang.yoga.nameHi} / ${birthPanchang.yoga.name}`);
      kv("Karana", `${birthPanchang.karana.nameHi} / ${birthPanchang.karana.name}`);

      heading("Solar / Lunar Times on Day of Birth");
      kv("Sunrise", birthPanchang.sunrise);
      kv("Sunset", birthPanchang.sunset);
      kv("Moonrise", birthPanchang.moonrise);
      kv("Moonset", birthPanchang.moonset);
      kv("Day Length", `${birthPanchang.dayLengthHours} hours`);

      heading("Auspicious & Inauspicious Periods (Birth Day)");
      kv("Brahma Muhurat", `${birthPanchang.brahmaMuhurat.start}  →  ${birthPanchang.brahmaMuhurat.end}`);
      kv("Abhijit Muhurat", `${birthPanchang.abhijitMuhurat.start}  →  ${birthPanchang.abhijitMuhurat.end}`);
      kv("Rahu Kaal", `${birthPanchang.rahuKaal.start}  →  ${birthPanchang.rahuKaal.end}`);
      kv("Yamaganda", `${birthPanchang.yamaganda.start}  →  ${birthPanchang.yamaganda.end}`);
      kv("Gulika Kaal", `${birthPanchang.gulikaKaal.start}  →  ${birthPanchang.gulikaKaal.end}`);
    }

    // ============ PAGE 3 — PLANETARY POSITIONS ============
    doc.addPage();
    pageHeader(doc, "Planetary Positions (Graha Sthiti)");

    para("Each graha at the moment of birth carries a specific sign, house, dignity and nakshatra placement. This is the foundation on which everything else rests.");
    doc.moveDown(0.3);

    const cols = [
      { label: "Planet", w: 80 },
      { label: "Sign", w: 78 },
      { label: "House", w: 38 },
      { label: "Degree", w: 60 },
      { label: "Nakshatra", w: 96 },
      { label: "Dignity", w: 60 },
      { label: "Status", w: 86 },
    ];
    const tableX = PAGE_MARGIN;
    let ty = doc.y;
    doc.save();
    doc.rect(tableX, ty, contentW, 22).fill(MAROON);
    doc.restore();
    let cx = tableX;
    setFill("#F5E9C7").font("Helvetica-Bold").fontSize(8.5);
    cols.forEach((c) => { doc.text(c.label.toUpperCase(), cx + 6, ty + 7, { width: c.w - 6 }); cx += c.w; });
    ty += 22;

    chart.planets.forEach((p, i) => {
      ensureTableRoom(doc, ty, 22, () => { pageHeader(doc, "Planetary Positions (continued)"); ty = doc.y; });
      if (i % 2 === 0) {
        doc.save(); doc.rect(tableX, ty, contentW, 22).fill(CREAM); doc.restore();
      }
      cx = tableX;
      const status = [p.retrograde ? "Retro" : "", p.combust ? "Combust" : ""].filter(Boolean).join(" · ") || "Direct";
      const cells = [
        `${p.nameHi} / ${p.name}`,
        p.sign,
        String(p.house),
        `${Math.floor(p.signDegree)}° ${Math.round((p.signDegree % 1) * 60)}'`,
        `${p.nakshatra} (${p.nakshatraLord})`,
        p.dignity === "—" ? "Neutral" : p.dignity,
        status,
      ];
      setFill(INK).font("Helvetica").fontSize(8.5);
      cells.forEach((val, idx) => { doc.text(val, cx + 6, ty + 7, { width: cols[idx].w - 8, ellipsis: true }); cx += cols[idx].w; });
      ty += 22;
      doc.y = ty;
    });

    // ============ PAGE 3b — VISUAL CHARTS (LAGNA, CHANDRA, NAVAMSA, DASAMSA) ============
    doc.addPage();
    pageHeader(doc, "Astrological Charts (Bengali / North-Indian Style)");
    para("Below are the four most-consulted Vedic charts drawn in the classical North-Indian diamond style used across Bengal and northern India. The Lagna chart (D1) is the foundation; Chandra Lagna re-orients the same planets around the Moon; Navamsa (D9) reveals the soul's path and marriage; Dasamsa (D10) speaks of career and public life.");

    const planetLongs = chart.planets.map(p => ({ name: p.name, longitude: p.longitude }));
    const chartSize = (contentW - 30) / 2; // 2 charts per row
    const row1Y = doc.y + 24;
    const col2X = PAGE_MARGIN + chartSize + 30;

    drawNorthIndianChart(doc, PAGE_MARGIN, row1Y, chartSize, "LAGNA KUNDLI (D-1 RASHI CHART)", chart.ascendant.signIndex, buildD1Cells(chart));
    drawNorthIndianChart(doc, col2X, row1Y, chartSize, "CHANDRA LAGNA (MOON CHART)", chart.moonSign.signIndex, buildChandraCells(chart));

    const row2Y = row1Y + chartSize + 36;
    drawNorthIndianChart(doc, PAGE_MARGIN, row2Y, chartSize, "NAVAMSA (D-9) — MARRIAGE & DHARMA", divisionalSign(chart.ascendant.longitude, "D9"), buildDivisionalCells(chart, "D9", planetLongs));
    drawNorthIndianChart(doc, col2X, row2Y, chartSize, "DASAMSA (D-10) — CAREER & STATUS", divisionalSign(chart.ascendant.longitude, "D10"), buildDivisionalCells(chart, "D10", planetLongs));

    doc.y = row2Y + chartSize + 30;
    doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(8).text(
      "Sign abbreviations: 1=Aries, 2=Taurus, 3=Gemini, 4=Cancer, 5=Leo, 6=Virgo, 7=Libra, 8=Scorpio, 9=Sagittarius, 10=Capricorn, 11=Aquarius, 12=Pisces.   Planet abbreviations: Su=Sun, Mo=Moon, Ma=Mars, Me=Mercury, Ju=Jupiter, Ve=Venus, Sa=Saturn, Ra=Rahu, Ke=Ketu.",
      PAGE_MARGIN, doc.y, { width: contentW, align: "center", lineGap: 1 }
    );

    // ============ PAGE 3c — SAPTAMSA (D7) for progeny ============
    doc.addPage();
    pageHeader(doc, "Additional Divisional Charts");
    para("These divisional (varga) charts magnify specific life-areas. Studying them alongside the Lagna chart is the hallmark of classical Parashari Jyotish.");

    const row3Y = doc.y + 24;
    drawNorthIndianChart(doc, PAGE_MARGIN, row3Y, chartSize, "SAPTAMSA (D-7) — CHILDREN & PROGENY", divisionalSign(chart.ascendant.longitude, "D7"), buildDivisionalCells(chart, "D7", planetLongs));
    // Bhava chart side-by-side (whole-sign houses anchored to ascendant — same as D1 here)
    drawNorthIndianChart(doc, col2X, row3Y, chartSize, "BHAVA CHART (HOUSES FROM LAGNA)", chart.ascendant.signIndex, buildD1Cells(chart));
    doc.y = row3Y + chartSize + 30;
    doc.fillColor(MUTED).font("Helvetica-Oblique").fontSize(8).text(
      "Saptamsa (D-7) is studied for matters of children, fertility and creative offspring. The Bhava chart shows the same planetary placements organised by the twelve life-area houses (1–12) measured from your ascendant.",
      PAGE_MARGIN, doc.y, { width: contentW, lineGap: 1 }
    );

    // ============ PAGE 4 — HOUSES ============
    doc.addPage();
    pageHeader(doc, "Bhava (House) Significations");

    const houseDefs: Array<{ n: number; name: string; theme: string }> = [
      { n: 1, name: "Tanu Bhava", theme: "Self, body, identity, vitality, life direction" },
      { n: 2, name: "Dhana Bhava", theme: "Wealth, family, speech, food, savings, values" },
      { n: 3, name: "Sahaja Bhava", theme: "Courage, siblings, hands, communication, short journeys" },
      { n: 4, name: "Sukha Bhava", theme: "Mother, home, comforts, vehicles, inner peace" },
      { n: 5, name: "Putra Bhava", theme: "Progeny, intelligence, mantras, romance, speculation" },
      { n: 6, name: "Ari Bhava", theme: "Service, debts, enemies, health, daily routine" },
      { n: 7, name: "Yuvati Bhava", theme: "Marriage, partnerships, public, foreign travel" },
      { n: 8, name: "Ayur Bhava", theme: "Longevity, occult, transformation, inheritance" },
      { n: 9, name: "Dharma Bhava", theme: "Father, guru, dharma, higher learning, fortune" },
      { n: 10, name: "Karma Bhava", theme: "Career, status, public deeds, authority" },
      { n: 11, name: "Labha Bhava", theme: "Gains, friends, elder siblings, fulfilment of desires" },
      { n: 12, name: "Vyaya Bhava", theme: "Moksha, expenses, foreign lands, sleep, isolation" },
    ];
    const houseByNumber = new Map<number, typeof chart.houses[0]>();
    chart.houses.forEach(h => houseByNumber.set(h.number, h));

    houseDefs.forEach(h => {
      ensureRoom(64);
      const houseInfo = houseByNumber.get(h.n);
      const occupants = (houseInfo?.planets?.length ? houseInfo.planets.join(", ") : "Empty");
      const startY = doc.y;
      setFill(MAROON).font("Helvetica-Bold").fontSize(10).text(`House ${h.n} — ${h.name}`, PAGE_MARGIN, startY);
      setFill(MUTED).font("Helvetica-Oblique").fontSize(8.5).text(h.theme, PAGE_MARGIN, doc.y);
      setFill(INK).font("Helvetica").fontSize(9).text(
        `Sign: ${houseInfo ? houseInfo.signHi + " / " + houseInfo.sign + " (Lord: " + houseInfo.signLord + ")" : "—"}   ·   Occupants: ${occupants}`,
        PAGE_MARGIN, doc.y + 1
      );
      doc.moveDown(0.4);
      sectionDivider();
    });

    // ============ PAGE 5 — DASHAS ============
    doc.addPage();
    pageHeader(doc, "Vimshottari Dasha — Your Planetary Periods");

    para(
      `The Vimshottari Dasha system — anchored to the position of your Moon at birth — divides life into karmic chapters governed by each graha. ` +
      `Knowing which dasha lord rules a given period helps you align effort with the cosmic season.`
    );

    heading("Current Dasha Period");
    kv("Mahadasha (major period)", `${currentDasha.mahadasha.lord}  ·  ${fmtDate(currentDasha.mahadasha.startISO)}  →  ${fmtDate(currentDasha.mahadasha.endISO)}`);
    kv("Antardasha (sub-period)", `${currentDasha.antardasha.lord}  ·  until ${fmtDate(currentDasha.antardasha.endISO)}`);
    kv("Pratyantardasha (minor)", `${currentDasha.pratyantardasha.lord}  ·  until ${fmtDate(currentDasha.pratyantardasha.endISO)}`);

    heading("Mahadasha Sequence (120-Year Cycle)");
    let dy = doc.y;
    doc.save(); doc.rect(PAGE_MARGIN, dy, contentW, 20).fill(MAROON); doc.restore();
    setFill("#F5E9C7").font("Helvetica-Bold").fontSize(9);
    doc.text("PLANET", PAGE_MARGIN + 8, dy + 6, { width: 110 });
    doc.text("FROM", PAGE_MARGIN + 130, dy + 6, { width: 130 });
    doc.text("TO", PAGE_MARGIN + 270, dy + 6, { width: 130 });
    doc.text("DURATION", PAGE_MARGIN + 410, dy + 6, { width: 90 });
    dy += 20;
    mahadashaList.forEach((d, i) => {
      ensureTableRoom(doc, dy, 18, () => { pageHeader(doc, "Mahadasha Sequence (continued)"); dy = doc.y; });
      if (i % 2 === 0) { doc.save(); doc.rect(PAGE_MARGIN, dy, contentW, 18).fill(CREAM); doc.restore(); }
      setFill(INK).font("Helvetica").fontSize(9);
      doc.text(d.lord, PAGE_MARGIN + 8, dy + 5, { width: 110 });
      doc.text(fmtDate(d.startISO), PAGE_MARGIN + 130, dy + 5, { width: 130 });
      doc.text(fmtDate(d.endISO), PAGE_MARGIN + 270, dy + 5, { width: 130 });
      doc.text(`${d.lengthYears.toFixed(2)} yr`, PAGE_MARGIN + 410, dy + 5, { width: 90 });
      dy += 18;
      doc.y = dy;
    });

    // Antardashas of current mahadasha
    if (chart.dasha.upcomingAntardashas?.length) {
      doc.moveDown(0.6);
      heading(`Antardashas inside the current ${currentDasha.mahadasha.lord} Mahadasha`);
      let ady = doc.y;
      doc.save(); doc.rect(PAGE_MARGIN, ady, contentW, 20).fill(MAROON); doc.restore();
      setFill("#F5E9C7").font("Helvetica-Bold").fontSize(9);
      doc.text("ANTARDASHA LORD", PAGE_MARGIN + 8, ady + 6, { width: 150 });
      doc.text("FROM", PAGE_MARGIN + 170, ady + 6, { width: 130 });
      doc.text("TO", PAGE_MARGIN + 310, ady + 6, { width: 130 });
      ady += 20;
      chart.dasha.upcomingAntardashas.forEach((a, i) => {
        ensureTableRoom(doc, ady, 18, () => { pageHeader(doc, "Antardasha Sequence (continued)"); ady = doc.y; });
        if (i % 2 === 0) { doc.save(); doc.rect(PAGE_MARGIN, ady, contentW, 18).fill(CREAM); doc.restore(); }
        setFill(INK).font("Helvetica").fontSize(9);
        doc.text(a.lord, PAGE_MARGIN + 8, ady + 5, { width: 150 });
        doc.text(fmtDate(a.startISO), PAGE_MARGIN + 170, ady + 5, { width: 130 });
        doc.text(fmtDate(a.endISO), PAGE_MARGIN + 310, ady + 5, { width: 130 });
        ady += 18;
        doc.y = ady;
      });
    }

    // ============ PAGE 5b — NUMEROLOGY ============
    doc.addPage();
    pageHeader(doc, "Numerology — Mulank, Bhagyank, Naamank");
    para("Vedic numerology assigns a single-digit signature to each individual through three numbers: Mulank (root number from birth-day), Bhagyank (destiny number from full birth date), and Naamank (name number from given name).");

    heading(`Mulank (Root Number) — ${numerology.mulank}`);
    kv("Ruling Planet", NUMEROLOGY_LORD[numerology.mulank] ?? "—");
    para(NUMEROLOGY_NATURE[numerology.mulank] ?? "");
    para(`Your Mulank is the planetary signature of your day-to-day character — how you instinctively respond when life acts on you. It is most powerful between birthdays of your own Mulank's lord and during transits of that planet over key houses.`);

    heading(`Bhagyank (Destiny Number) — ${numerology.bhagyank}`);
    kv("Ruling Planet", NUMEROLOGY_LORD[numerology.bhagyank] ?? "—");
    para(NUMEROLOGY_NATURE[numerology.bhagyank] ?? "");
    para(`Your Bhagyank reveals the destiny that the totality of your birth date sets in motion — the long arc of your karmic journey. It is the deeper engine running underneath the personality of the Mulank.`);

    heading(`Naamank (Name Number) — ${numerology.naamank}`);
    kv("Ruling Planet", NUMEROLOGY_LORD[numerology.naamank] ?? "—");
    para(NUMEROLOGY_NATURE[numerology.naamank] ?? "");
    para(`Your Naamank — calculated from "${order.fullName}" using the Chaldean system — is how the world perceives and addresses you. If your Naamank harmonises with your Mulank and Bhagyank, your name itself becomes a daily mantra of support. If they conflict, a slight spelling refinement (the practice of "name correction") is sometimes recommended.`);

    heading("Compatibility of Your Three Numbers");
    const trio = `${numerology.mulank} · ${numerology.bhagyank} · ${numerology.naamank}`;
    kv("Your Number Trio", trio);
    const harmonyMap: Record<string, string> = {
      "1": "Sun: harmonises with 1, 3, 5, 9.",
      "2": "Moon: harmonises with 1, 4, 7.",
      "3": "Jupiter: harmonises with 1, 3, 9.",
      "4": "Rahu: harmonises with 5, 6, 8.",
      "5": "Mercury: harmonises with 1, 3, 4, 5.",
      "6": "Venus: harmonises with 3, 4, 5, 9.",
      "7": "Ketu: harmonises with 1, 2, 4.",
      "8": "Saturn: harmonises with 3, 5, 6.",
      "9": "Mars: harmonises with 1, 3, 6.",
    };
    [numerology.mulank, numerology.bhagyank, numerology.naamank].forEach(n => kv(`Number ${n}`, harmonyMap[String(n)] ?? "—"));

    // ============ PAGES 6+ — PERSONALISED PREDICTIONS ============
    const predBlocks: Array<{ key: PredictionKey; title: string; subtitle: string }> = [
      { key: "personality", title: "Your Nature & Personality",      subtitle: "Lagna · Moon · Janma Nakshatra" },
      { key: "education",   title: "Education & Intellect",          subtitle: "5th house · Mercury · Jupiter" },
      { key: "career",      title: "Career & Profession (Karma)",    subtitle: "10th house · Saturn · Sun" },
      { key: "wealth",      title: "Wealth & Finance (Dhana)",       subtitle: "2nd & 11th houses · Jupiter · Venus" },
      { key: "marriage",    title: "Marriage & Partnership",         subtitle: "7th house · Venus · Navamsa" },
      { key: "children",    title: "Children & Family (Putra)",      subtitle: "5th house · Jupiter · Saptamsa" },
      { key: "health",      title: "Health & Vitality",              subtitle: "1st & 6th houses · Ascendant lord" },
      { key: "foreign",     title: "Foreign Travel & Settlement",    subtitle: "9th & 12th houses · Rahu" },
      { key: "spiritual",   title: "Spiritual Life (Moksha)",        subtitle: "9th & 12th houses · Ketu · Jupiter" },
    ];
    // Each prediction is rendered as a deliberate 2-page spread so both pages
    // are naturally full. Page 1 = the reading + planetary snapshot + favourable
    // periods. Page 2 = practical guidance + gemstone box + mantra callout +
    // a brief closing reflection.
    predBlocks.forEach((b) => {
      const ex = predictionExtras(b.key, chart, order);

      // ---- Page 1 of 2 ----
      doc.addPage();
      pageHeader(doc, b.title);
      setFill(MUTED).font("Helvetica-Oblique").fontSize(9).text(b.subtitle, PAGE_MARGIN, doc.y);
      doc.moveDown(0.25);
      setStroke(GOLD).lineWidth(0.6).moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + 80, doc.y).stroke();
      doc.moveDown(0.4);

      // Main personalised reading
      setFill(INK).font("Helvetica").fontSize(10).text(predictions[b.key], { align: "justify", lineGap: 2.5 });
      doc.moveDown(0.5);

      contentBlock("Key Planetary Influences", ex.snapshot);
      bulletBlock("Favourable Periods Ahead", ex.favourable);

      // Twelve-Month Outlook callout — fills page 1 nicely
      const outlook = yearlyOutlook(b.key, chart);
      const outlookH = doc.heightOfString(outlook, { width: contentW - 24, lineGap: 2 });
      ensureRoom(outlookH + 36);
      doc.moveDown(0.4);
      const oy = doc.y;
      doc.save();
      doc.rect(PAGE_MARGIN, oy, contentW, outlookH + 30).fill(CREAM);
      doc.restore();
      doc.save();
      doc.strokeColor(GOLD).lineWidth(0.6).rect(PAGE_MARGIN, oy, contentW, outlookH + 30).stroke();
      doc.restore();
      setFill(MAROON).font("Helvetica-Bold").fontSize(8.5).text("TWELVE-MONTH OUTLOOK FOR THIS AREA", PAGE_MARGIN + 12, oy + 7);
      setFill(INK).font("Helvetica-Oblique").fontSize(9.5).text(outlook, PAGE_MARGIN + 12, oy + 20, { width: contentW - 24, lineGap: 2 });
      doc.y = oy + outlookH + 38;

      // ---- Page 2 of 2 ----
      doc.addPage();
      pageHeader(doc, `${b.title} — Practices, Remedies & Mantra`);
      setFill(MUTED).font("Helvetica-Oblique").fontSize(9).text(`Continued from previous page · ${b.subtitle}`, PAGE_MARGIN, doc.y);
      doc.moveDown(0.25);
      setStroke(GOLD).lineWidth(0.6).moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + 80, doc.y).stroke();
      doc.moveDown(0.5);

      bulletBlock("Recommendations & Spiritual Practices", ex.practices);

      if (ex.gemstoneTip) {
        const gemH = doc.heightOfString(ex.gemstoneTip, { width: contentW - 28, lineGap: 1.5 });
        ensureRoom(gemH + 32);
        const gy = doc.y;
        doc.save();
        doc.rect(PAGE_MARGIN, gy, contentW, gemH + 26).fill(CREAM);
        doc.restore();
        doc.save();
        doc.strokeColor(GOLD).lineWidth(0.6).rect(PAGE_MARGIN, gy, contentW, gemH + 26).stroke();
        doc.restore();
        setFill(MAROON).font("Helvetica-Bold").fontSize(8.5).text("GEMSTONE GUIDANCE", PAGE_MARGIN + 12, gy + 7);
        setFill(INK).font("Helvetica").fontSize(9.5).text(ex.gemstoneTip, PAGE_MARGIN + 12, gy + 19, { width: contentW - 24, lineGap: 1.5 });
        doc.y = gy + gemH + 34;
      }

      mantraCallout(ex.mantra.sanskrit, ex.mantra.meaning);

      // Closing reflection — fills remaining space gracefully
      const closing = closingReflection(b.key);
      doc.moveDown(0.4);
      setFill(MAROON).font("Helvetica-BoldOblique").fontSize(10).text("A Note for Your Sadhana", PAGE_MARGIN, doc.y);
      setStroke(GOLD).lineWidth(0.5).moveTo(PAGE_MARGIN, doc.y + 2).lineTo(PAGE_MARGIN + 60, doc.y + 2).stroke();
      doc.moveDown(0.3);
      setFill(INK).font("Helvetica-Oblique").fontSize(9.5).text(closing, { align: "justify", lineGap: 2 });
    });

    // ============ 5-YEAR FORECAST ============
    doc.addPage();
    pageHeader(doc, "Five-Year Dasha Forecast");
    para("The Vimshottari Dasha unfolds in mahadasha → antardasha → pratyantardasha layers. Below is a chronological list of the antardasha periods you will pass through over the coming years — read alongside the personalised predictions to anticipate the dominant themes of each season.");

    const nowMs = Date.now();
    const fiveYearMs = nowMs + 5 * 365.25 * 24 * 3600 * 1000;
    type APeriod = { lord: string; startISO: string; endISO: string; mdLord: string };
    const upcoming: APeriod[] = [];
    const ads = chart.dasha.upcomingAntardashas ?? [];
    ads.forEach(a => {
      const aEnd = new Date(a.endISO).getTime();
      if (aEnd > nowMs && new Date(a.startISO).getTime() < fiveYearMs) {
        upcoming.push({ lord: a.lord, startISO: a.startISO, endISO: a.endISO, mdLord: chart.dasha.current.mahadasha.lord });
      }
    });
    // Add antardashas from following mahadashas if needed
    const mds = chart.dasha.mahadashas ?? [];
    const currentMdEnd = new Date(chart.dasha.current.mahadasha.endISO).getTime();
    if (currentMdEnd < fiveYearMs) {
      const VIMSHOTTARI_YEARS: Record<string, number> = { Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17, Ketu: 7, Venus: 20 };
      mds.forEach(md => {
        if (new Date(md.startISO).getTime() < currentMdEnd) return; // skip past
        if (new Date(md.startISO).getTime() > fiveYearMs) return;
        const mdLen = md.lengthYears;
        const mdStart = new Date(md.startISO).getTime();
        // Standard antardasha sequence starting from md.lord
        const VIM_LORDS = ["Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury","Ketu","Venus"];
        const startIdx = VIM_LORDS.indexOf(md.lord);
        let cursor = mdStart;
        for (let i = 0; i < 9; i++) {
          const adLord = VIM_LORDS[(startIdx + i) % 9];
          const adLen = (mdLen * VIMSHOTTARI_YEARS[adLord]) / 120; // years
          const adEnd = cursor + adLen * 365.25 * 24 * 3600 * 1000;
          if (cursor < fiveYearMs && adEnd > nowMs) {
            upcoming.push({
              lord: adLord,
              startISO: new Date(cursor).toISOString(),
              endISO: new Date(adEnd).toISOString(),
              mdLord: md.lord,
            });
          }
          cursor = adEnd;
          if (cursor > fiveYearMs) break;
        }
      });
    }

    // Render forecast table
    let fy = doc.y;
    doc.save(); doc.rect(PAGE_MARGIN, fy, contentW, 20).fill(MAROON); doc.restore();
    setFill("#F5E9C7").font("Helvetica-Bold").fontSize(8.5);
    doc.text("MAHADASHA", PAGE_MARGIN + 8, fy + 6, { width: 80 });
    doc.text("ANTARDASHA", PAGE_MARGIN + 90, fy + 6, { width: 80 });
    doc.text("FROM", PAGE_MARGIN + 175, fy + 6, { width: 110 });
    doc.text("TO", PAGE_MARGIN + 290, fy + 6, { width: 110 });
    doc.text("KEY INFLUENCE", PAGE_MARGIN + 405, fy + 6, { width: 130 });
    fy += 20;

    const planetTone: Record<string, string> = {
      Sun: "Authority, recognition, father", Moon: "Mind, mother, emotional cycles",
      Mars: "Energy, conflict, courage", Mercury: "Communication, commerce, learning",
      Jupiter: "Wisdom, expansion, dharma, children", Venus: "Love, art, comfort, marriage",
      Saturn: "Discipline, delay, karmic lessons", Rahu: "Ambition, foreign, sudden change",
      Ketu: "Detachment, spirituality, isolation",
    };
    upcoming.slice(0, 25).forEach((p, i) => {
      ensureTableRoom(doc, fy, 22, () => { pageHeader(doc, "Five-Year Forecast (continued)"); fy = doc.y; });
      if (i % 2 === 0) { doc.save(); doc.rect(PAGE_MARGIN, fy, contentW, 22).fill(CREAM); doc.restore(); }
      setFill(INK).font("Helvetica").fontSize(8.5);
      doc.text(p.mdLord, PAGE_MARGIN + 8, fy + 7, { width: 80 });
      doc.text(p.lord, PAGE_MARGIN + 90, fy + 7, { width: 80 });
      doc.text(fmtDate(p.startISO), PAGE_MARGIN + 175, fy + 7, { width: 110 });
      doc.text(fmtDate(p.endISO), PAGE_MARGIN + 290, fy + 7, { width: 110 });
      doc.text(planetTone[p.lord] ?? "—", PAGE_MARGIN + 405, fy + 7, { width: 130, ellipsis: true });
      fy += 22;
      doc.y = fy;
    });

    if (upcoming.length === 0) {
      para("Forecast not available for the requested window.");
    }

    // ============ PAGE 6 — DOSHAS ============
    doc.addPage();
    pageHeader(doc, "Doshas — Karmic Frictions & Their Remedies");
    para("In Vedic astrology a 'dosha' is a planetary configuration that creates a karmic friction in a specific area of life. Doshas are not curses — they are signposts that point to where conscious effort, sadhana and shastric remedies are most needed. The traditional remedies below combine mantra (vibrational), daana (charity), puja (devotional) and behavioural disciplines, drawn from classical sources such as the Brihat Parashara Hora Shastra, Phaladeepika and Saravali. Each dosha is examined in detail on the pages that follow, with status, severity, full body explanation, classical remedies and the recommended beej mantra.");
    doc.moveDown(0.4);
    contentBlock("DOSHAS EXAMINED IN THIS REPORT", [
      ["Mangal Dosha", "Mars in 1/4/7/8/12 from Lagna or Moon — affects marriage harmony"],
      ["Kalsarpa Yoga", "All seven planets between Rahu and Ketu — delays results, then unlocks"],
      ["Sade Sati", "Saturn transiting 12th, 1st, 2nd from Moon — 7.5-year karmic cleanse"],
      ["Pitra Dosha", "Sun-Rahu/Saturn afflictions — ancestral karma (covered if active)"],
      ["Guru Chandala", "Jupiter conjunct Rahu — distorted teachers/wisdom (covered if active)"],
      ["Shrapit Dosha", "Saturn-Rahu conjunction — past-life curse pattern (covered if active)"],
    ]);
    doc.moveDown(0.3);
    setFill(MAROON).font("Helvetica-Bold").fontSize(10).text("How to Read Dosha Pages", PAGE_MARGIN, doc.y);
    doc.moveDown(0.2);
    setFill(INK).font("Helvetica").fontSize(9.5).text(
      "Each dosha page begins with a coloured status badge (red = present, green = not present) and the severity classification. The body explains exactly why the dosha is or is not active in your chart, drawing on the actual planetary placements computed from your birth data. The Recommended Remedies section lists classical prescriptions in priority order — begin with the first two and add others as practice deepens. The Recommended Mantra is the beej (seed) mantra of the deity who pacifies that planetary energy. Consistency over 40-90 days is the classical minimum for a remedy to begin showing results.",
      { width: contentW, align: "justify", lineGap: 2.5 }
    );

    type DoshaSpec = {
      title: string;
      present: boolean;
      severity: string;
      body: string;
      remedies: string[];
      mantra?: { sanskrit: string; meaning: string };
    };

    const doshaBlocks: DoshaSpec[] = [
      {
        title: "Mangal Dosha (Manglik Status)",
        present: chart.doshas.manglik.present,
        severity: chart.doshas.manglik.severity || "—",
        body: chart.doshas.manglik.present
          ? `Mars occupies a Manglik-trigger house in your chart: ${chart.doshas.manglik.reasons.join("; ")}. Mangal dosha intensifies passion, assertion and friction in close partnerships, especially marriage. Severity is ${chart.doshas.manglik.severity}. Classical Jyotish prescribes specific remedies before fixing an alliance, and pair-matching with another Manglik chart neutralises the dosha.`
          : "Mars does not occupy any of the Manglik trigger houses (1st, 4th, 7th, 8th, 12th) from either the Lagna or the Moon — your chart is non-Manglik. This simplifies marriage compatibility considerably: you may marry either a Manglik or a non-Manglik partner without the need for cancellation rituals (Kumbha Vivah, Mangal Shanti Puja, etc.) that are otherwise classically prescribed.\n\nFor your understanding: Mangal dosha is the placement of Mars in those five houses, counted both from the Ascendant and from the Moon. Mars in these houses tends to amplify the warrior-energy of the planet — assertion, friction, passion, even physical heat — directly into the spheres of marriage (7th), home (4th), longevity-of-spouse (8th), happiness (12th) and self-presentation (1st). Without this placement, Mars expresses its courage, leadership and protective instinct in healthier directions in your life — typically through career, sports, surgery, defence, real-estate or any field requiring decisive action.\n\nAs general harmonising practice for Mars in any chart, Hanuman worship on Tuesdays, the Mangal Stotram during the Mars antardasha, and avoidance of red-hot speech in close relationships are all classically supportive — even when no formal dosha exists.",
        remedies: chart.doshas.manglik.present ? [
          "Recite the Hanuman Chalisa daily — Hanuman is the supreme pacifier of Mangal dosha; ideally read it after sunset facing South.",
          "Worship Lord Hanuman every Tuesday and Saturday with red flowers, sindoor, and a sesame-oil lamp.",
          "Recite the Mangal Stotram or 'Om Angarakaya Namah' 108 times every Tuesday morning.",
          "Donate red lentils (masoor dal), red cloth, jaggery, or copper to a temple or to needy people on Tuesdays.",
          "Fast on Tuesdays for 21 consecutive weeks; eat only one sattvic meal after sunset.",
          "Perform a Mangal Shanti Puja or Kumbha Vivah (ritual marriage to a clay pot) before the actual marriage — the classical remedy for high-severity Manglik charts.",
          "Match-making: pair with another Manglik chart, or with a chart where Mars does not occupy the same trigger houses — Ashtakoota matching is essential.",
        ] : [
          "No corrective action needed for Mangal dosha. As a general harmoniser, you may still recite the Hanuman Chalisa on Tuesdays for marital well-being.",
        ],
        mantra: chart.doshas.manglik.present ? {
          sanskrit: "Om Kram Kreem Kraum Sah Bhaumaya Namah",
          meaning: "Beej mantra of Mangal — pacifies the harshness of Mars and channels its courage and energy constructively into relationships.",
        } : undefined,
      },
      {
        title: "Kalsarpa Yoga (Rahu–Ketu Axis Constraint)",
        present: chart.doshas.kalsarpa.present,
        severity: chart.doshas.kalsarpa.present ? "Moderate to Significant" : "None",
        body: chart.doshas.kalsarpa.explanation +
          (chart.doshas.kalsarpa.present
            ? " Kalsarpa typically delays results — you work hard, but rewards come after struggle. Once the karmic 'unlock' happens (often through specific sadhana), the very same Rahu–Ketu axis becomes a powerful engine of unconventional achievement. Many of history's most original thinkers, scientists, mystics and revolutionaries had Kalsarpa charts — the dosha forces the soul to break with convention and find its own path. The remedies below are aimed at smoothing the timing of results and reducing the friction of the breaking-with-convention years."
            : "\n\nFor your understanding: Kalsarpa Yoga is one of the most discussed (and most misunderstood) configurations in Vedic astrology. It forms when all seven traditional planets — Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn — fall on one side of the Rahu–Ketu axis. The classical interpretation is that the entire planetary parliament is metaphorically swallowed by the cosmic serpent, leading to delays, struggle and karmic obstruction in the dasha periods of the planets so swallowed. When the planets are distributed on both sides of the axis (as in your chart), the karmic load on the Rahu–Ketu axis is balanced — your nodes operate as normal indicators of past-life desire (Rahu) and past-life renunciation (Ketu) without the additional burden of holding the entire chart hostage. Continue with general nodal-balance practices: Naga Panchami observance, occasional visits to a Naga shrine, and Saturday rotis given to dogs (Ketu) are all classically beneficial preventive sadhana that keep the nodes pacified."),
        remedies: chart.doshas.kalsarpa.present ? [
          "Perform a Kalsarpa Shanti Puja at one of the classical sites: Trimbakeshwar (Nashik), Kalahasti, or any Naga temple.",
          "Recite the Maha Mrityunjaya Mantra 108 times daily — especially during the 27-day cycle following Naga Panchami.",
          "Worship Lord Shiva every Monday with white flowers, raw milk, bilva leaves, and a sesame-oil lamp.",
          "Feed cobras (silver naga idols immersed in milk on Naga Panchami), or donate to Naga temples.",
          "Recite 'Om Namah Shivaya' or the Rudrashtakam on every Pradosha tithi (13th day of each lunar fortnight).",
          "Avoid taking major decisions during Rahu Kaal each day; consult a panchang for the daily Rahu Kaal window.",
          "Donate black sesame seeds, blankets, and mustard oil to the elderly and needy on Saturdays.",
        ] : [
          "Naga Panchami (5th day of Shravan, July-Aug) — visit any Naga temple, offer raw milk, white flowers and a few grains of unbroken rice. Even a brief darshan strengthens the Rahu-Ketu axis.",
          "Recite 'Om Namah Shivaya' 108 times every Monday — Shiva is the cosmic master of all nagas; daily Shiva remembrance keeps the nodal energies aligned.",
          "Feed the first roti of the day to a dog (the vehicle of Ketu) and place water out for crows on Saturdays — both classical preventive practices for the Rahu-Ketu axis.",
          "On every Pradosha tithi (the 13th day of each lunar fortnight), light a sesame-oil lamp under any tree and chant the Mahamrityunjaya mantra 11 times.",
          "Avoid eclipses (especially solar) for major decisions — eclipses temporarily activate the nodal axis even in non-Kalsarpa charts; use eclipse hours for silent japa instead.",
          "If a Kalsarpa puja is ever performed in your family or community, attend or sponsor a small portion of it — preventive merit on this axis is one of the easiest karmic investments to make.",
        ],
        mantra: chart.doshas.kalsarpa.present ? {
          sanskrit: "Om Tryambakam Yajamahe · Sugandhim Pushtivardhanam · Urvarukamiva Bandhanan · Mrityor Mukshiya Maamritat",
          meaning: "Maha Mrityunjaya Mantra — the supreme remedy for Kalsarpa, granting protection from untimely obstacles and freeing the soul from karmic bondage.",
        } : {
          sanskrit: "Om Namah Shivaya",
          meaning: "Panchakshara mantra of Shiva — the lord of all nagas; recited preventively on Mondays and Pradosha tithi, it keeps the Rahu-Ketu axis pacified between any future activations.",
        },
      },
      {
        title: "Sade Sati (Saturn's 7.5-Year Transit Over Moon)",
        present: chart.doshas.sadeSati.active,
        severity: chart.doshas.sadeSati.active ? (chart.doshas.sadeSati.phase === "Peak" ? "High (Peak Phase)" : "Moderate") : "None (Currently)",
        body: chart.doshas.sadeSati.explanation +
          (chart.doshas.sadeSati.active
            ? " Sade Sati is misunderstood as purely negative — in reality it is a karmic cleansing window during which Saturn slowly removes that which no longer serves your dharma and forces a more honest, mature inner life. Those who cooperate with Saturn's discipline emerge from Sade Sati with deep, lasting strength. The remedies below are aimed not at escaping the lessons of Saturn, but at carrying them with grace, integrity and the right vibrational support."
            : "\n\nFor your understanding: Sade Sati is the seven-and-a-half-year period when Saturn transits the 12th, 1st and 2nd houses from the natal Moon, taking roughly two-and-a-half years in each. Every individual experiences three to four Sade Sati cycles in a typical 90-year lifespan. The cycle is famous for its difficulty, but Vedic seers were unanimous that its real function is karmic ripening — Saturn slows life down so that we can no longer postpone the inner work that the soul came here to do. Honest dealings prosper; cut corners are exposed; relationships built on convenience dissolve; relationships built on truth deepen. The 12th-house phase tends to bring losses-of-illusion and inner reorganisation; the 1st-house (peak) phase tests the body, identity and self-honesty; the 2nd-house phase tests speech, family and accumulated resources. Maintaining Saturn's good graces between cycles — through Saturday Hanuman Chalisa, monthly donation of black sesame and blankets to the needy, and a generally simple, disciplined lifestyle — is the classical preventive sadhana that softens the next cycle considerably."),
        remedies: chart.doshas.sadeSati.active ? [
          "Worship Lord Shani every Saturday — visit a Shani temple, offer black sesame seeds, mustard oil, and a black cloth garment.",
          "Worship Lord Hanuman every Saturday and Tuesday — recite the Hanuman Chalisa twice daily; Hanuman is the deity who can directly pacify Saturn.",
          "Recite the Shani Stotram or 'Om Sham Shanaye Namah' 108 times every Saturday at twilight.",
          "Maintain absolute integrity in financial dealings, in speech, and with employees and elders — Saturn rewards integrity and punishes deceit.",
          "Donate cooked food (especially khichdi or roti-sabzi) to manual labourers, the elderly, or the homeless every Saturday.",
          "Avoid alcohol, non-vegetarian food, gambling, and confrontation during the peak phase — Saturn amplifies the consequences of all such actions.",
          "Light a sesame-oil lamp under a Peepal tree every Saturday evening; circumambulate the tree seven times reciting the Shani mantra.",
          "Fast on Saturdays for 19 consecutive weeks (the Vimshottari period of Saturn) — eat only one black-sesame-and-jaggery meal after sunset.",
        ] : [
          "Recite the Hanuman Chalisa every Saturday evening — Hanuman is the protector who carries us through every Sade Sati that will eventually return; weekly practice now builds the karmic reservoir.",
          "Donate black sesame, mustard oil, urad dal, or warm blankets to the elderly or homeless on the first Saturday of every month — modest, sustained giving to Shani's domain.",
          "Light a sesame-oil lamp under a Peepal tree on Saturday evenings — circumambulate seven times in silence; an excellent practice even outside Sade Sati.",
          "Maintain absolute integrity in financial dealings, in speech, and with employees and elders — Saturn observes everything, and rewards consistent dharmic conduct between cycles.",
          "Visit a Shani temple at least once a year — Shani Shingnapur (Maharashtra), Tirunallar (Tamil Nadu), or any local Shani shrine; offer black til, mustard oil and a few minutes of silent darshan.",
          "Avoid taking on excessive debt, speculative trading and quick-rich schemes — Saturn's house is built only by patient, dharmic accumulation.",
          "Live simply, eat regularly, sleep early, and observe at least one weekly day of restraint (Saturday is ideal) — the natural Shani-friendly rhythm of life.",
        ],
        mantra: chart.doshas.sadeSati.active ? {
          sanskrit: "Om Praam Preem Praum Sah Shanaischaraya Namah",
          meaning: "Beej mantra of Saturn — invokes Shani Maharaj's grace, asks for the strength to bear his discipline with integrity, and softens the karmic ripening of Sade Sati into lasting maturity.",
        } : {
          sanskrit: "Om Praam Preem Praum Sah Shanaischaraya Namah",
          meaning: "Beej mantra of Saturn — recited weekly between Sade Sati cycles, this mantra builds the reservoir of Shani-grace that softens the next cycle when it eventually returns.",
        },
      },
    ];

    doshaBlocks.forEach((d) => {
      doc.addPage();
      pageHeader(doc, d.title);
      // Status badge
      const badgeY = doc.y + 4;
      const badgeColor = d.present ? "#A4001E" : "#0F7A3F";
      const badgeText = `${d.present ? "PRESENT" : "NOT PRESENT"}   ·   SEVERITY: ${d.severity}`;
      const badgeW = doc.widthOfString(badgeText) + 28;
      doc.save();
      doc.roundedRect(PAGE_MARGIN, badgeY, badgeW, 22, 3).fill(badgeColor);
      doc.restore();
      setFill("#FFFFFF").font("Helvetica-Bold").fontSize(8.5).text(badgeText, PAGE_MARGIN + 14, badgeY + 7);
      doc.y = badgeY + 36;
      doc.x = PAGE_MARGIN;

      setFill(INK).font("Helvetica").fontSize(10.5).text(d.body, PAGE_MARGIN, doc.y, { width: contentW, align: "justify", lineGap: 2.5 });
      doc.moveDown(0.6);

      bulletBlock(d.present ? "Recommended Remedies (Classical Prescription)" : "Preventive Sadhana & Educational Notes", d.remedies);
      if (d.mantra) {
        mantraCallout(d.mantra.sanskrit, d.mantra.meaning);
      }

      // Closing dosha note — fills remaining page space
      doc.moveDown(0.3);
      setFill(MAROON).font("Helvetica-BoldOblique").fontSize(10).text("Understanding Doshas Correctly", PAGE_MARGIN, doc.y);
      setStroke(GOLD).lineWidth(0.5).moveTo(PAGE_MARGIN, doc.y + 2).lineTo(PAGE_MARGIN + 60, doc.y + 2).stroke();
      doc.moveDown(0.3);
      setFill(INK).font("Helvetica-Oblique").fontSize(9.5).text(d.present
          ? `A 'dosha' is never a verdict. It is a karmic frequency the chart is asking you to attend to with conscious sadhana. The remedies above are the classical Vedic prescription — combining mantra (vibrational), daana (charitable), puja (devotional) and behavioural discipline. Practised regularly for 40-90 days, they shift the frequency of the dosha into a creative force. The point is not to escape karma, but to transform our relationship to it.`
          : `Even when a dosha is not currently active, it is wise to know how it functions in the Vedic system — because transits and progressed dashas can activate latent patterns later in life. The educational notes above provide a foundation. Maintain general harmonising practices (daily Surya Namaskar, weekly Hanuman Chalisa, Ekadashi observance) as preventive sadhana that strengthens the chart against future activations.`,
        { align: "justify", lineGap: 2 });
    });

    // ============ PAGE 7 — YOGAS ============
    doc.addPage();
    pageHeader(doc, "Yogas — Powerful Combinations in Your Chart");

    para("A 'yoga' in Vedic astrology is a special planetary combination that produces a distinct life-result. Some are gifts of past karma; others are activated through dedicated practice.");

    if (chart.yogas?.length) {
      chart.yogas.forEach(y => {
        ensureRoom(60);
        setFill(MAROON).font("Helvetica-Bold").fontSize(11).text(y.name, PAGE_MARGIN);
        setFill(INK).font("Helvetica").fontSize(10).text(y.description, { align: "justify", lineGap: 1.5 });
        doc.moveDown(0.5);
      });
    } else {
      para("No headline classical yogas detected by automated analysis. Your chart's strength flows through the individual placements of planets and the unfolding dasha sequence — both of which are detailed throughout this report.");
    }

    // Navamsa positions
    if (chart.navamsa?.planets?.length) {
      heading("Navamsa (D9) — The Soul's Chart");
      para("The Navamsa or D9 chart is the divisional chart that reveals the dharmic and marital potential of the soul. Planet positions in the Navamsa are studied alongside the main chart to confirm or modify its findings.");
      doc.moveDown(0.3);
      let nx = doc.y;
      doc.save(); doc.rect(PAGE_MARGIN, nx, contentW, 20).fill(MAROON); doc.restore();
      setFill("#F5E9C7").font("Helvetica-Bold").fontSize(9);
      doc.text("PLANET", PAGE_MARGIN + 8, nx + 6, { width: 150 });
      doc.text("NAVAMSA SIGN", PAGE_MARGIN + 170, nx + 6, { width: 200 });
      nx += 20;
      chart.navamsa.planets.forEach((p, i) => {
        ensureTableRoom(doc, nx, 18, () => { pageHeader(doc, "Navamsa (continued)"); nx = doc.y; });
        if (i % 2 === 0) { doc.save(); doc.rect(PAGE_MARGIN, nx, contentW, 18).fill(CREAM); doc.restore(); }
        setFill(INK).font("Helvetica").fontSize(9);
        doc.text(p.name, PAGE_MARGIN + 8, nx + 5, { width: 150 });
        doc.text(p.sign, PAGE_MARGIN + 170, nx + 5, { width: 200 });
        nx += 18;
        doc.y = nx;
      });
    }

    // ============ PAGE 8 — LUCKY ELEMENTS ============
    doc.addPage();
    pageHeader(doc, "Your Lucky Elements & Personal Auspiciousness");
    para(`Lucky elements in Vedic astrology are not superstitions — they are vibrational allies. The colour, number, day, direction and gemstone associated with the lord of your Janma Nakshatra (and the lord of your Lagna) carry the same subtle frequency as those planets. Surrounding yourself with these elements during important undertakings creates a quiet harmonic resonance that supports the karma you are trying to act upon.`);

    contentBlock("Your Janma Nakshatra Profile", [
      ["Nakshatra (Star)", `${nak.nameHi} / ${nak.name}`],
      ["Pada (Quarter)", String(nak.pada)],
      ["Nakshatra Lord", nak.lord],
      ["Presiding Deity", nak.deity],
      ["Symbol & Nature", `Star ${nak.name} carries the energy of ${nak.deity} — daily chant of the deity's name is your personal devata-doorway.`],
    ]);

    contentBlock("Lucky Elements (from Nakshatra Lord)", [
      ["Lucky Number", String(lordToNumber[nak.lord] ?? "—")],
      ["Lucky Colour", lordToColor[nak.lord] ?? "—"],
      ["Lucky Day", lordToDay[nak.lord] ?? "—"],
      ["Auspicious Metal", lordToMetal[nak.lord] ?? "—"],
      ["Auspicious Direction", lordToDirection[nak.lord] ?? "—"],
      ["Best Time of Day", `Sunrise to 9 AM (Brahma Muhurat) — universally fortunate; especially on ${lordToDay[nak.lord] ?? "your lucky day"}.`],
    ]);

    contentBlock("Lucky Elements (from Ascendant Lord)", [
      ["Ascendant", `${chart.ascendant.signHi} / ${chart.ascendant.sign}`],
      ["Ascendant Lord", chart.ascendant.signLord],
      ["Lord's Lucky Colour", lordToColor[chart.ascendant.signLord] ?? "—"],
      ["Lord's Lucky Day", lordToDay[chart.ascendant.signLord] ?? "—"],
      ["Lord's Number", String(lordToNumber[chart.ascendant.signLord] ?? "—")],
    ]);

    bulletBlock("How To Use Your Lucky Elements", [
      `Sign important contracts, file applications and start new ventures on your lucky day (${lordToDay[nak.lord] ?? "—"}) — ideally between sunrise and 9 AM.`,
      `Wear or carry your lucky colour (${lordToColor[nak.lord] ?? "—"}) when attending interviews, court appearances, exams, or first meetings.`,
      `Face your auspicious direction (${lordToDirection[nak.lord] ?? "—"}) while taking important decisions, while studying, and while sleeping (head pointing in this direction).`,
      `Use your lucky number (${lordToNumber[nak.lord] ?? "—"}) wherever you have a choice — vehicle plates, mobile-number suffixes, account numbers, house numbers.`,
      `Keep a small piece of the auspicious metal (${lordToMetal[nak.lord] ?? "—"}) on your person — a ring, locket, or coin in your wallet.`,
    ]);

    // ============ NEW PAGE — DETAILED GEMSTONE RECOMMENDATIONS ============
    doc.addPage();
    pageHeader(doc, "Gemstone Recommendations (Ratna-Vidya)");
    para(`Gemstones (ratnas) are crystallised condensations of planetary light. Worn on the correct finger, in the correct metal, after Pran Pratishtha (life-installation puja) at the correct time, a gemstone can amplify a benefic planet by 50-100%. The science is precise — wrong gemstones can also amplify malefic effects, so always consult a qualified jyotishi before activation. Below are three categorised recommendations from your chart.`);

    const ascLordPlanet = chart.planets.find(p => p.name === chart.ascendant.signLord);
    const yogaKarakas: Record<string, string> = {
      Aries: "—", Taurus: "Saturn", Gemini: "—", Cancer: "Mars", Leo: "Mars",
      Virgo: "—", Libra: "Saturn", Scorpio: "—", Sagittarius: "—",
      Capricorn: "Venus", Aquarius: "Venus", Pisces: "—",
    };
    const yogaKarakaName = yogaKarakas[chart.ascendant.sign];

    contentBlock("Primary Stone — Ascendant Lord (Lagnesh)", [
      ["Recommended Stone", lordToGem[chart.ascendant.signLord] ?? "—"],
      ["Strengthens", `${chart.ascendant.signLord} (lord of your body, vitality, identity)`],
      ["Recommended Weight", "3 to 5 ratti (1 ratti ≈ 0.18 grams)"],
      ["Mounting Metal", lordToMetal[chart.ascendant.signLord] ?? "—"],
      ["Finger", chart.ascendant.signLord === "Sun" ? "Ring finger (right hand)" : chart.ascendant.signLord === "Moon" ? "Little finger (right hand)" : chart.ascendant.signLord === "Mars" ? "Ring finger (right hand)" : chart.ascendant.signLord === "Mercury" ? "Little finger (right hand)" : chart.ascendant.signLord === "Jupiter" ? "Index finger (right hand)" : chart.ascendant.signLord === "Venus" ? "Middle finger (right hand)" : chart.ascendant.signLord === "Saturn" ? "Middle finger (right hand)" : "—"],
      ["Activation Day", `${lordToDay[chart.ascendant.signLord] ?? "—"} at sunrise`],
    ]);

    contentBlock("Secondary Stone — Janma Nakshatra Lord", [
      ["Recommended Stone", lordToGem[nak.lord] ?? "—"],
      ["Strengthens", `${nak.lord} (lord of your birth star — the texture of your inner emotional life)`],
      ["Recommended Weight", "3 to 5 ratti"],
      ["Mounting Metal", lordToMetal[nak.lord] ?? "—"],
      ["Activation Day", `${lordToDay[nak.lord] ?? "—"} at sunrise`],
      ["When to Wear", `Most beneficial during the ${nak.lord} mahadasha or antardasha; otherwise as supporting energy.`],
    ]);

    if (yogaKarakaName !== "—") {
      contentBlock(`Yoga-Karaka Stone — ${yogaKarakaName}`, [
        ["Recommended Stone", lordToGem[yogaKarakaName] ?? "—"],
        ["Strengthens", `${yogaKarakaName} — the supreme yoga-karaka for ${chart.ascendant.sign} ascendant; rules both a kendra and a trikona house.`],
        ["Effect", "Multiplies success in career, wealth, relationships and dharma simultaneously — the single most important stone for your ascendant."],
        ["Recommended Weight", "5 to 7 ratti for full effect"],
        ["Mounting Metal", lordToMetal[yogaKarakaName] ?? "—"],
        ["Activation Day", `${lordToDay[yogaKarakaName] ?? "—"} at sunrise`],
      ]);
    }

    bulletBlock("Important Cautions Before Wearing Any Gemstone", [
      "ALWAYS test a new gemstone for 7 days first — wear it provisionally and observe sleep, mood, dreams, and minor incidents. If anything feels disturbed, do not proceed with permanent wear.",
      "NEVER wear two gemstones of mutually inimical planets together — e.g. Ruby (Sun) + Diamond (Venus); Pearl (Moon) + Hessonite (Rahu); Yellow Sapphire (Jupiter) + Diamond (Venus).",
      "Blue Sapphire (Neelam) for Saturn is the fastest-acting gemstone — it can produce visible results in 24-72 hours, either way. Never wear it without strict consultation and a 7-day test.",
      "Always perform Pran Pratishtha (energization puja) before first wear — wash the stone in raw milk, then in Ganga jal, recite the planetary mantra 108 times, and wear at sunrise on the correct day.",
      "Synthetic, heat-treated, or fracture-filled stones do NOT carry planetary vibration — only natural, untreated stones above 3 ratti are jyotish-grade.",
      "Remove the stone temporarily during cremation, after childbirth (10 days), or during major mourning periods — the stone should not absorb such energies.",
    ]);

    // ============ NEW PAGE — FAVOURABLE YEARS (10-YEAR HORIZON) ============
    doc.addPage();
    pageHeader(doc, "Favourable Years — Your Next Decade");
    para(`The Vimshottari Dasha system identifies which planet is the 'tone-setter' for each year of your life. By tracing the mahadasha and antardasha (sub-period) lord active during each year, we can describe the dominant theme and the level of opportunity that year is likely to carry. The table below outlines the next 10 years of your life with the operative period, theme and opportunity rating for each year.`);

    type YearForecast = { year: number; mdLord: string; adLord: string; theme: string; rating: string; ratingColor: string };
    const yearRows: YearForecast[] = [];
    const startYear = new Date().getFullYear();
    const TOPIC_PLANET_THEMES: Record<string, string> = {
      Sun: "Authority, recognition, leadership, father", Moon: "Emotions, home, mother, public connect",
      Mars: "Energy, courage, real estate, surgery", Mercury: "Commerce, travel, learning, communication",
      Jupiter: "Wisdom, expansion, dharma, children, marriage", Venus: "Love, art, luxury, relationships",
      Saturn: "Discipline, delays, karmic lessons, structure", Rahu: "Ambition, foreign, sudden change, technology",
      Ketu: "Detachment, spirituality, research, surgery",
    };
    const POSITIVE_PLANETS = ["Jupiter", "Venus", "Mercury", "Moon"];
    const CHALLENGING_PLANETS = ["Saturn", "Rahu", "Ketu", "Mars"];

    for (let yIdx = 0; yIdx < 10; yIdx++) {
      const targetYear = startYear + yIdx;
      const targetMid = new Date(`${targetYear}-06-15T00:00:00Z`).getTime();
      // Find mahadasha at midpoint of year
      const md = (chart.dasha.mahadashas ?? []).find(m =>
        new Date(m.startISO).getTime() <= targetMid && new Date(m.endISO).getTime() > targetMid
      );
      if (!md) continue;
      // Compute antardasha within that md at the year midpoint
      const VIM_LORDS = ["Sun","Moon","Mars","Rahu","Jupiter","Saturn","Mercury","Ketu","Venus"];
      const VIMSHOTTARI_YEARS: Record<string, number> = { Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17, Ketu: 7, Venus: 20 };
      const startIdx = VIM_LORDS.indexOf(md.lord);
      let cursor = new Date(md.startISO).getTime();
      let adLord = md.lord;
      for (let i = 0; i < 9; i++) {
        const lord = VIM_LORDS[(startIdx + i) % 9];
        const adLen = (md.lengthYears * VIMSHOTTARI_YEARS[lord]) / 120;
        const adEnd = cursor + adLen * 365.25 * 24 * 3600 * 1000;
        if (cursor <= targetMid && adEnd > targetMid) { adLord = lord; break; }
        cursor = adEnd;
      }
      const isFav = POSITIVE_PLANETS.includes(md.lord) || POSITIVE_PLANETS.includes(adLord);
      const isChall = CHALLENGING_PLANETS.includes(md.lord) && CHALLENGING_PLANETS.includes(adLord);
      const rating = isFav && !isChall ? "Favourable" : isChall ? "Challenging" : "Mixed";
      const ratingColor = rating === "Favourable" ? "#0F7A3F" : rating === "Challenging" ? "#A4001E" : "#B5832C";
      yearRows.push({
        year: targetYear,
        mdLord: md.lord,
        adLord,
        theme: TOPIC_PLANET_THEMES[adLord] ?? "—",
        rating,
        ratingColor,
      });
    }

    // Render year-by-year table
    let yy = doc.y;
    doc.save(); doc.rect(PAGE_MARGIN, yy, contentW, 22).fill(MAROON); doc.restore();
    setFill("#F5E9C7").font("Helvetica-Bold").fontSize(8.5);
    doc.text("YEAR", PAGE_MARGIN + 8, yy + 7, { width: 50 });
    doc.text("MAHADASHA", PAGE_MARGIN + 60, yy + 7, { width: 70 });
    doc.text("ANTARDASHA", PAGE_MARGIN + 132, yy + 7, { width: 70 });
    doc.text("DOMINANT THEME", PAGE_MARGIN + 204, yy + 7, { width: 200 });
    doc.text("OUTLOOK", PAGE_MARGIN + 408, yy + 7, { width: 90 });
    yy += 22;

    yearRows.forEach((r, i) => {
      ensureTableRoom(doc, yy, 26, () => { pageHeader(doc, "Favourable Years (continued)"); yy = doc.y; });
      if (i % 2 === 0) { doc.save(); doc.rect(PAGE_MARGIN, yy, contentW, 26).fill(CREAM); doc.restore(); }
      setFill(MAROON).font("Helvetica-Bold").fontSize(11).text(String(r.year), PAGE_MARGIN + 8, yy + 8, { width: 50 });
      setFill(INK).font("Helvetica").fontSize(9).text(r.mdLord, PAGE_MARGIN + 60, yy + 9, { width: 70 });
      doc.text(r.adLord, PAGE_MARGIN + 132, yy + 9, { width: 70 });
      doc.text(r.theme, PAGE_MARGIN + 204, yy + 9, { width: 200, ellipsis: true });
      // Outlook badge
      doc.save();
      doc.roundedRect(PAGE_MARGIN + 408, yy + 6, 80, 14, 2).fill(r.ratingColor);
      doc.restore();
      setFill("#FFFFFF").font("Helvetica-Bold").fontSize(7.5).text(r.rating.toUpperCase(), PAGE_MARGIN + 408, yy + 10, { width: 80, align: "center" });
      yy += 26;
      doc.y = yy;
    });

    doc.moveDown(0.6);
    bulletBlock("How To Read This Forecast", [
      "Favourable years are best for new ventures, marriage, property purchase, business launches, and major life moves — Jupiter and Venus periods especially.",
      "Mixed years demand discernment — review every important decision twice; favourable transits within these years still produce results, just with care.",
      "Challenging years are not 'bad' — they are years of pruning, consolidation and karmic work. Conserve resources, avoid speculation, double down on sadhana.",
      "Saturn periods (often labelled challenging) reward integrity and discipline more than any other — those who do the work emerge with deep, lasting strength.",
      "This is a strategic overview; combine with the 5-year forecast table earlier in this report for month-by-month timing precision.",
    ]);

    // ============ PAGE 9 — REMEDIES & CLOSING ============
    doc.addPage();
    pageHeader(doc, "Remedies & Spiritual Practice");

    const colorWord = (lordToColor[nak.lord] || "white").toLowerCase().split(/[\s\/]/)[0];
    const remedies = [
      `Daily japa of the ${nak.lord} mantra (108 repetitions) to strengthen the lord of your janma nakshatra and stabilise emotional life.`,
      `Worship ${nak.deity} — the deity who presides over your birth nakshatra — every Monday with white flowers, milk, and a ghee lamp.`,
      `Begin your day with Surya Namaskar facing East at sunrise. Twelve rounds align the prana with the natural rhythm of the day.`,
      `Maintain Brahma Muhurat sadhana (4:00 – 6:00 AM) for at least 21 consecutive days during your current ${currentDasha.mahadasha.lord} mahadasha.`,
      `Donate ${colorWord} cloth or food to the needy on ${lordToDay[nak.lord] || "Saturday"} — the day governed by your nakshatra lord.`,
      `Recite the Hanuman Chalisa on Tuesdays and Saturdays for protection from malefic transits.`,
      `Visit a temple of ${nak.deity} on full moon (Purnima) days when possible.`,
    ];
    remedies.forEach((r) => {
      ensureRoom(40);
      setFill(GOLD).circle(PAGE_MARGIN + 4, doc.y + 5, 3).fill();
      setFill(INK).font("Helvetica").fontSize(10).text(r, PAGE_MARGIN + 18, doc.y, { width: contentW - 18, align: "justify", lineGap: 1.5 });
      doc.moveDown(0.4);
    });

    heading("A Word from Vedic Tatva");
    para(
      `An astrology report is a mirror, not a script. The grahas describe the tendencies in the soil; you are still the gardener. ` +
      `Use this map to know yourself more deeply, to act with awareness during demanding planetary periods, and to cooperate with the gifts your janma nakshatra carries.`
    );
    para(
      `If you would like a one-on-one consultation with a senior Jyotish acharya — to ask specific questions about marriage timing, career direction, gemstone activation, or upcoming transits — please write to ecom@vedictatva.com or call 8447-8447-02 and we will arrange a private session.`
    );

    // ---------- Footer + page numbers on every page ----------
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
      doc.switchToPage(range.start + i);
      const footerY = H - 30;
      setStroke(GOLD).lineWidth(0.4).moveTo(PAGE_MARGIN, footerY - 6).lineTo(W - PAGE_MARGIN, footerY - 6).stroke();
      setFill(MUTED).font("Helvetica").fontSize(8);
      doc.text(`Vedic Tatva Premium Kundli  ·  ${order.fullName}`, PAGE_MARGIN, footerY, { width: contentW / 2, align: "left" });
      doc.text(`Page ${i + 1} of ${range.count}`, PAGE_MARGIN + contentW / 2, footerY, { width: contentW / 2, align: "right" });
    }

    doc.end();
  });

  return { filePath, fileName };
}

function pageHeader(doc: PDFKit.PDFDocument, title: string) {
  const W = doc.page.width;
  doc.save();
  doc.rect(0, 0, W, 50).fill(MAROON);
  doc.restore();
  doc.fillColor(GOLD).font("Helvetica-Bold").fontSize(13).text("VEDIC TATVA  ·  PREMIUM KUNDLI", PAGE_MARGIN, 18, { align: "left" });
  doc.fillColor("#F5E9C7").font("Helvetica").fontSize(9).text(title, PAGE_MARGIN, 32, { align: "left" });
  doc.y = 70;
  doc.fillColor(INK).font("Helvetica").fontSize(10);
}

function ensureTableRoom(doc: PDFKit.PDFDocument, ty: number, rowH: number, onNewPage: () => void) {
  if (ty + rowH > doc.page.height - PAGE_MARGIN - 30) {
    doc.addPage();
    onNewPage();
  }
}

// Helper used by the route to send the email with the PDF attached
export function buildKundliEmailHtml(order: PdfKundliOrder): { html: string; text: string } {
  const text = `Namaste ${order.fullName} ji,

Your premium Vedic Kundli report from Vedic Tatva is ready and attached to this email as a PDF.

This report is computed using the Swiss Ephemeris with Lahiri ayanamsa and includes:
  • Lagna, Moon Sign, Sun Sign and Janma Nakshatra
  • Janma Panchang — Tithi, Vara, Nakshatra, Yoga, Karana at the moment of birth
  • Visual North-Indian astrology charts: Lagna (D1), Chandra Lagna, Navamsa (D9), Dasamsa (D10), Saptamsa (D7), Bhava chart
  • Detailed planetary positions (Graha Sthiti) with dignities and nakshatras
  • All 12 Bhava (House) significations with occupants
  • Numerology — Mulank, Bhagyank, and Naamank with planetary lords
  • Vimshottari Mahadasha sequence + current Dasha + 5-year forecast
  • Personalised predictions across nine life-areas: nature, education, career, wealth, marriage, children, health, foreign travel, spiritual life
  • Mangal, Kalsarpa, and Sade Sati dosha analysis with remedies
  • Classical yogas detected in your chart
  • Lucky elements (number, colour, day, gemstone, metal, direction)
  • Personalised remedies and spiritual practice

If you have any questions about the report or would like a private consultation with a Jyotish acharya, simply reply to this email or call us on 8447-8447-02.

Thank you for trusting Vedic Tatva with this sacred enquiry.

— Vedic Tatva
ecom@vedictatva.com  ·  vedictatva.com`;

  const html = `<!doctype html>
<html><body style="margin:0;padding:0;background:#FBF7EE;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#3a2c2f;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7EE;padding:24px 0;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border:1px solid #E6D9B0;border-radius:8px;overflow:hidden;">
      <tr><td style="background:#6D2B35;padding:22px 28px;color:#D4AF37;font-size:18px;font-weight:700;letter-spacing:0.4px;">VEDIC TATVA  ·  Premium Kundli</td></tr>
      <tr><td style="padding:28px;">
        <h1 style="margin:0 0 14px;font-size:22px;color:#6D2B35;">Namaste ${escapeHtml(order.fullName)} ji,</h1>
        <p style="margin:0 0 14px;line-height:1.6;font-size:14px;">Your premium Vedic Kundli report is ready. The full PDF is attached to this email — please open the attachment to view your complete birth-chart analysis.</p>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FFF8E1;border:1px solid #D4AF37;border-radius:6px;margin:0 0 14px;">
          <tr><td style="padding:12px 18px;font-size:13px;color:#6D2B35;line-height:1.6;">
            <strong>Your PDF is password protected.</strong><br/>
            Password: your date of birth in <strong>DDMMYYYY</strong> format — e.g. ${escapeHtml(derivePdfPassword(order.birthDate))} for your records (${escapeHtml(fmtBirth(order.birthDate, order.birthTime))}).
          </td></tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#FBF7EE;border:1px solid #E6D9B0;border-radius:6px;margin:14px 0;">
          <tr><td style="padding:14px 18px;font-size:13px;color:#3a2c2f;line-height:1.7;">
            <strong style="color:#6D2B35;">Your report contains:</strong><br/>
            ·  Lagna, Moon Sign, Sun Sign &amp; Janma Nakshatra summary<br/>
            ·  Janma Panchang at birth (Tithi, Vara, Nakshatra, Yoga, Karana)<br/>
            ·  Visual North-Indian charts: Lagna, Chandra, Navamsa, Dasamsa, Saptamsa<br/>
            ·  Planetary positions with dignities &amp; nakshatras<br/>
            ·  Numerology — Mulank, Bhagyank, Naamank<br/>
            ·  Vimshottari Mahadasha + current period + 5-year forecast<br/>
            ·  Detailed predictions: nature, education, career, wealth, marriage, children, health, foreign travel, spiritual life<br/>
            ·  Mangal, Kalsarpa &amp; Sade Sati dosha analysis<br/>
            ·  Classical yogas, lucky elements &amp; personalised remedies
          </td></tr>
        </table>
        <p style="margin:14px 0;line-height:1.6;font-size:14px;">If you would like a private consultation with a Jyotish acharya, simply reply to this email or call us on <a href="tel:+918447844702" style="color:#6D2B35;">8447-8447-02</a>.</p>
        <p style="margin:18px 0 0;font-size:13px;color:#7a6a6e;font-style:italic;">Thank you for trusting Vedic Tatva with this sacred enquiry.</p>
      </td></tr>
      <tr><td style="padding:18px 28px;background:#FBF7EE;border-top:1px solid #E6D9B0;font-size:12px;color:#7a6a6e;line-height:1.6;">
        Vedic Tatva Private Limited  ·  ecom@vedictatva.com  ·  vedictatva.com
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`;

  return { html, text };
}

function escapeHtml(s: string): string {
  return String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
