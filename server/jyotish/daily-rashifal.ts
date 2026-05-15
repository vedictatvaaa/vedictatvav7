import OpenAI from "openai";
import { computeDailyPanchang } from "./panchang";

export type RashifalSystem = "vedic" | "western";

type SignMeta = {
  slug: string;
  name: string;
  english: string;
  sanskrit?: string;
  symbol: string;
  ruler: string;
  element: string;
};

const VEDIC_SIGNS: SignMeta[] = [
  { slug: "mesh", name: "Mesh", english: "Aries", sanskrit: "मेष", symbol: "♈", ruler: "Mars (Mangal)", element: "Fire" },
  { slug: "vrishabh", name: "Vrishabh", english: "Taurus", sanskrit: "वृषभ", symbol: "♉", ruler: "Venus (Shukra)", element: "Earth" },
  { slug: "mithun", name: "Mithun", english: "Gemini", sanskrit: "मिथुन", symbol: "♊", ruler: "Mercury (Budh)", element: "Air" },
  { slug: "kark", name: "Kark", english: "Cancer", sanskrit: "कर्क", symbol: "♋", ruler: "Moon (Chandra)", element: "Water" },
  { slug: "singh", name: "Singh", english: "Leo", sanskrit: "सिंह", symbol: "♌", ruler: "Sun (Surya)", element: "Fire" },
  { slug: "kanya", name: "Kanya", english: "Virgo", sanskrit: "कन्या", symbol: "♍", ruler: "Mercury (Budh)", element: "Earth" },
  { slug: "tula", name: "Tula", english: "Libra", sanskrit: "तुला", symbol: "♎", ruler: "Venus (Shukra)", element: "Air" },
  { slug: "vrishchik", name: "Vrishchik", english: "Scorpio", sanskrit: "वृश्चिक", symbol: "♏", ruler: "Mars (Mangal)", element: "Water" },
  { slug: "dhanu", name: "Dhanu", english: "Sagittarius", sanskrit: "धनु", symbol: "♐", ruler: "Jupiter (Guru)", element: "Fire" },
  { slug: "makar", name: "Makar", english: "Capricorn", sanskrit: "मकर", symbol: "♑", ruler: "Saturn (Shani)", element: "Earth" },
  { slug: "kumbh", name: "Kumbh", english: "Aquarius", sanskrit: "कुम्भ", symbol: "♒", ruler: "Saturn (Shani)", element: "Air" },
  { slug: "meen", name: "Meen", english: "Pisces", sanskrit: "मीन", symbol: "♓", ruler: "Jupiter (Guru)", element: "Water" },
];

const WESTERN_SIGNS: SignMeta[] = [
  { slug: "aries", name: "Aries", english: "Aries", symbol: "♈", ruler: "Mars", element: "Fire" },
  { slug: "taurus", name: "Taurus", english: "Taurus", symbol: "♉", ruler: "Venus", element: "Earth" },
  { slug: "gemini", name: "Gemini", english: "Gemini", symbol: "♊", ruler: "Mercury", element: "Air" },
  { slug: "cancer", name: "Cancer", english: "Cancer", symbol: "♋", ruler: "Moon", element: "Water" },
  { slug: "leo", name: "Leo", english: "Leo", symbol: "♌", ruler: "Sun", element: "Fire" },
  { slug: "virgo", name: "Virgo", english: "Virgo", symbol: "♍", ruler: "Mercury", element: "Earth" },
  { slug: "libra", name: "Libra", english: "Libra", symbol: "♎", ruler: "Venus", element: "Air" },
  { slug: "scorpio", name: "Scorpio", english: "Scorpio", symbol: "♏", ruler: "Mars / Pluto", element: "Water" },
  { slug: "sagittarius", name: "Sagittarius", english: "Sagittarius", symbol: "♐", ruler: "Jupiter", element: "Fire" },
  { slug: "capricorn", name: "Capricorn", english: "Capricorn", symbol: "♑", ruler: "Saturn", element: "Earth" },
  { slug: "aquarius", name: "Aquarius", english: "Aquarius", symbol: "♒", ruler: "Saturn / Uranus", element: "Air" },
  { slug: "pisces", name: "Pisces", english: "Pisces", symbol: "♓", ruler: "Jupiter / Neptune", element: "Water" },
];

export function resolveSign(system: RashifalSystem, slugRaw: string): SignMeta | null {
  const list = system === "vedic" ? VEDIC_SIGNS : WESTERN_SIGNS;
  const slug = (slugRaw || "").toLowerCase().trim();
  return list.find(s => s.slug === slug) || null;
}

export type DailyRashifal = {
  date: string;
  sign: SignMeta;
  system: RashifalSystem;
  astro: {
    weekday: string;
    weekdayHi: string;
    weekdayLord: string;
    tithi: string;
    tithiHi: string;
    tithiNumber: number;
    paksha: string;
    pakshaHi: string;
    nakshatra: string;
    nakshatraHi: string;
    nakshatraLord: string;
    nakshatraDeity: string;
    yoga: string;
    rahuKaal: string;
    abhijit: string;
  };
  prediction: {
    dayScore: number;
    mood: string;
    overview: string;
    love: string;
    career: string;
    finance: string;
    health: string;
    luckyColor: string;
    luckyNumber: string;
    luckyTime: string;
    luckyDirection: string;
    doToday: string;
    avoidToday: string;
  };
  surprise: {
    title: string;
    message: string;
  };
  source: "ai" | "fallback";
};

export async function generateDailyRashifal(
  system: RashifalSystem,
  slug: string,
): Promise<DailyRashifal> {
  const sign = resolveSign(system, slug);
  if (!sign) throw new Error(`Unknown sign: ${slug}`);

  // Astronomy basis: today's panchang for Delhi (national reference).
  const tzNow = new Date();
  const ymd = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric", month: "2-digit", day: "2-digit",
  }).format(tzNow);
  const [yyyy, mm, dd] = ymd.split("-").map(s => parseInt(s, 10));
  const city = { name: "Delhi", lat: 28.6139, lon: 77.209, tz: "Asia/Kolkata" };

  let astro: DailyRashifal["astro"];
  try {
    const p = computeDailyPanchang(yyyy, mm, dd, city);
    astro = {
      weekday: p.weekday.en,
      weekdayHi: p.weekday.hi,
      weekdayLord: p.weekday.lord,
      tithi: p.tithi.name,
      tithiHi: p.tithi.nameHi,
      tithiNumber: p.tithi.number,
      paksha: p.tithi.paksha,
      pakshaHi: p.tithi.pakshaHi,
      nakshatra: p.nakshatra.name,
      nakshatraHi: p.nakshatra.nameHi,
      nakshatraLord: p.nakshatra.lord,
      nakshatraDeity: p.nakshatra.deity,
      yoga: p.yoga.name,
      rahuKaal: `${p.rahuKaal.start} – ${p.rahuKaal.end}`,
      abhijit: `${p.abhijitMuhurat.start} – ${p.abhijitMuhurat.end}`,
    };
  } catch (e) {
    console.warn("[daily-rashifal] panchang fallback:", e);
    const wd = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
    const wdLord = ["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn"];
    const dow = new Date(`${ymd}T12:00:00Z`).getUTCDay();
    astro = {
      weekday: wd[dow], weekdayHi: wd[dow], weekdayLord: wdLord[dow],
      tithi: "—", tithiHi: "—", tithiNumber: 0, paksha: "—", pakshaHi: "—",
      nakshatra: "—", nakshatraHi: "—", nakshatraLord: "—", nakshatraDeity: "—",
      yoga: "—", rahuKaal: "—", abhijit: "—",
    };
  }

  const aiOut = await generateWithAI(sign, astro, system, ymd);

  return {
    date: ymd,
    sign,
    system,
    astro,
    prediction: aiOut.prediction,
    surprise: aiOut.surprise,
    source: aiOut.source,
  };
}

async function generateWithAI(
  sign: SignMeta,
  astro: DailyRashifal["astro"],
  system: RashifalSystem,
  dateISO: string,
): Promise<{ prediction: DailyRashifal["prediction"]; surprise: DailyRashifal["surprise"]; source: "ai" | "fallback" }> {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) return { ...fallbackPrediction(sign, astro, dateISO), source: "fallback" };

  try {
    const openai = new OpenAI({ apiKey, baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL });
    const sysPrompt = system === "vedic"
      ? `You are a learned Vedic Jyotishi writing today's rashifal for ${sign.name} (${sign.english}) rashi natives. Ground every line in the live panchang context provided. Be specific, warm, and uplifting — no doom. Reference the day's tithi, nakshatra, weekday lord, and the sign's ruling planet to justify guidance. Avoid generic horoscope cliches. Write in clear, polished English that an Indian audience will love. Return STRICT JSON only — no markdown, no code fences.`
      : `You are an expert Western astrologer writing today's daily horoscope for ${sign.name}. Be specific and warm — no doom. Reference the day's planetary ruler, the sign's element and ruler, and the date to justify guidance. Avoid generic horoscope cliches. Return STRICT JSON only — no markdown, no code fences.`;

    const userPrompt = [
      `Date: ${dateISO} (${astro.weekday}, ruled by ${astro.weekdayLord})`,
      `Sign: ${sign.name}${sign.sanskrit ? ` / ${sign.sanskrit}` : ""} ${sign.symbol} — ruled by ${sign.ruler}, ${sign.element} element`,
      ...(system === "vedic" ? [
        `Tithi: ${astro.tithi} (${astro.paksha})`,
        `Nakshatra: ${astro.nakshatra} (lord: ${astro.nakshatraLord}, deity: ${astro.nakshatraDeity})`,
        `Yoga: ${astro.yoga}`,
        `Rahu Kaal today: ${astro.rahuKaal} (avoid auspicious starts in this window)`,
        `Abhijit Muhurat today: ${astro.abhijit} (most shubh window)`,
      ] : [
        `Day ruled by ${astro.weekdayLord}`,
      ]),
      ``,
      `Return JSON with these EXACT keys:`,
      `{`,
      `  "dayScore": <integer 1-10, today's overall vibe for this sign>,`,
      `  "mood": "<two-word mood, e.g. 'Bold & Magnetic'>",`,
      `  "overview": "<2-3 sentences: today's overall energy for this sign, grounded in the panchang/planetary context>",`,
      `  "love": "<2 sentences on romance, partnership, family today>",`,
      `  "career": "<2 sentences on work, projects, decisions today>",`,
      `  "finance": "<2 sentences on money, transactions, purchases today>",`,
      `  "health": "<2 sentences on body, energy, mind today>",`,
      `  "luckyColor": "<one or two color words>",`,
      `  "luckyNumber": "<1 to 3 digits, comma separated>",`,
      `  "luckyTime": "<a clock window like '11:20 AM – 12:40 PM' — use Abhijit if vedic and available, else a sensible window>",`,
      `  "luckyDirection": "<one of: North, North-East, East, South-East, South, South-West, West, North-West>",`,
      `  "doToday": "<one short imperative — what to actually do today, max 14 words>",`,
      `  "avoidToday": "<one short imperative — what to avoid, max 14 words>",`,
      `  "surpriseTitle": "<a short evocative phrase, max 4 words, e.g. 'Cosmic Whisper' / 'Today's Sealed Verse' / 'Hidden Blessing'>",`,
      `  "surpriseMessage": "<a 2-3 sentence intimate, poetic message just for ${sign.name} natives today — feels like a sealed letter from the cosmos. Reference today's planetary lord or nakshatra deity as a subtle anchor. Warm, hopeful, specific.>"`,
      `}`,
    ].join("\n");

    // 25s hard timeout so a hung provider can never stall the request loop
    const aiRes = await openai.chat.completions.create(
      {
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: sysPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: { type: "json_object" },
        max_tokens: 900,
        temperature: 0.75,
      },
      { timeout: 25_000 },
    );

    const parsed = JSON.parse(aiRes.choices[0]?.message?.content || "{}");
    const dayScore = clampInt(parsed.dayScore, 1, 10, seededScore(sign.slug, dateISO));
    return {
      prediction: {
        dayScore,
        mood: trimStr(parsed.mood, 40, "Steady & Centered"),
        overview: trimStr(parsed.overview, 600, "A balanced day to listen to your inner rhythm and act with quiet confidence."),
        love: trimStr(parsed.love, 400, "Speak warmly and listen longer. Small gestures land better than grand ones today."),
        career: trimStr(parsed.career, 400, "Steady focus pays. Finish what's open before chasing the new."),
        finance: trimStr(parsed.finance, 400, "Hold large decisions for tomorrow. Track small spends carefully."),
        health: trimStr(parsed.health, 400, "Hydrate, walk after meals, and protect your sleep."),
        luckyColor: trimStr(parsed.luckyColor, 40, "Maroon"),
        luckyNumber: trimStr(parsed.luckyNumber, 20, "7"),
        luckyTime: trimStr(parsed.luckyTime, 40, astro.abhijit !== "—" ? astro.abhijit : "11:48 AM – 12:36 PM"),
        luckyDirection: trimStr(parsed.luckyDirection, 20, "North-East"),
        doToday: trimStr(parsed.doToday, 120, "Light a diya at sunset and chant your ishta mantra 11 times."),
        avoidToday: trimStr(parsed.avoidToday, 120, `Avoid important starts during Rahu Kaal (${astro.rahuKaal}).`),
      },
      surprise: {
        title: trimStr(parsed.surpriseTitle, 40, "Cosmic Whisper"),
        message: trimStr(
          parsed.surpriseMessage,
          600,
          `The cosmos has held a small blessing for you today, ${sign.name}. Notice the unexpected smile — it is the universe nodding back.`,
        ),
      },
      source: "ai" as const,
    };
  } catch (e) {
    console.warn("[daily-rashifal] AI failed, using fallback:", e);
    return { ...fallbackPrediction(sign, astro, dateISO), source: "fallback" };
  }
}

function trimStr(v: any, max: number, dflt: string): string {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s) return dflt;
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function clampInt(v: any, min: number, max: number, dflt: number): number {
  const n = Math.round(Number(v));
  if (!Number.isFinite(n)) return dflt;
  return Math.min(max, Math.max(min, n));
}

function seededScore(slug: string, dateISO: string): number {
  // Deterministic 5–9 score (never below 5 — keep things hopeful)
  let h = 0;
  const s = slug + "|" + dateISO;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return 5 + (Math.abs(h) % 5);
}

function fallbackPrediction(
  sign: SignMeta,
  astro: DailyRashifal["astro"],
  dateISO: string,
): { prediction: DailyRashifal["prediction"]; surprise: DailyRashifal["surprise"] } {
  const score = seededScore(sign.slug, dateISO);
  const moods = ["Steady & Bright", "Quietly Powerful", "Open & Receptive", "Focused & Grounded", "Soft & Reflective"];
  const colors = ["Maroon", "Saffron", "Gold", "Forest Green", "Pearl White", "Sky Blue"];
  const dirs = ["North-East", "East", "North", "South-East"];
  const pick = <T,>(arr: T[]) => arr[Math.abs(hash(sign.slug + dateISO + arr.length)) % arr.length];
  return {
    prediction: {
      dayScore: score,
      mood: pick(moods),
      overview: `Today carries ${astro.weekday}'s rhythm under ${astro.weekdayLord}'s rulership for ${sign.name} natives. The day favours considered action over haste — your ruling ${sign.ruler.split(" ")[0]} energy aligns well with quiet, deliberate moves.`,
      love: `Speak from the heart, but speak gently. A small honest gesture lands deeper today than any grand promise.`,
      career: `Close the loops you've been postponing. A senior or mentor's nod arrives quietly — be ready to receive it.`,
      finance: `Track every small spend; postpone any large commitment by 24 hours. Patience compounds today.`,
      health: `Hydrate, walk after meals, and guard your sleep. Your body asks for rhythm, not intensity.`,
      luckyColor: pick(colors),
      luckyNumber: String(((Math.abs(hash(sign.slug)) % 9) + 1)),
      luckyTime: astro.abhijit !== "—" ? astro.abhijit : "11:48 AM – 12:36 PM",
      luckyDirection: pick(dirs),
      doToday: `Light a diya at sunset and chant your ishta mantra 11 times.`,
      avoidToday: astro.rahuKaal !== "—" ? `Avoid auspicious starts during Rahu Kaal (${astro.rahuKaal}).` : `Avoid impulsive promises and unplanned spends.`,
    },
    surprise: {
      title: "Cosmic Whisper",
      message: `Dear ${sign.name}, today ${astro.nakshatraDeity !== "—" ? `${astro.nakshatraDeity} watches over your nakshatra` : `your ruling ${sign.ruler.split(" ")[0]} smiles softly upon you`}. A small unexpected kindness will arrive — receive it without explaining yourself. The day has already chosen you.`,
    },
  };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return h;
}
