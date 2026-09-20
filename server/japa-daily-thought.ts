import {
  createStructuredCompletion,
  isAiProviderConfigured,
} from "./ai-provider";

export type DailyThoughtSource = "ai" | "curated";
export type DailyThoughtPayload = {
  thought: string;
  date: string;
  source: DailyThoughtSource;
};

// Reviewed, non-predictive copy. Keep these short because they are spoken aloud.
export const CURATED_DAILY_THOUGHTS = [
  "आज श्रद्धा से उठाया गया छोटा कदम भी मन में बड़ी शांति जगाता है।",
  "ईश्वर का स्मरण हृदय को सरल बनाता है और दिन को उजले भाव से भरता है।",
  "आज अपने कर्म में प्रेम और अपने शब्दों में करुणा रखें।",
  "शांत मन से किया गया जप भीतर के प्रकाश को पहचानने में सहारा देता है।",
  "हर सांस कृतज्ञता का अवसर है; आज इसे सहजता से जीएँ।",
  "भक्ति में टिके मन को साधारण क्षणों में भी आनंद दिखाई देता है।",
  "आज धैर्य, सेवा और मधुरता को अपने दिन का संकल्प बनाइए।",
  "प्रभु का स्मरण करते हुए आगे बढ़ें और अपने भीतर की शांति को सँजोएँ।",
] as const;

const cache = new Map<string, DailyThoughtPayload>();

export function istDateKey(date: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function curatedThoughtForDate(date: Date = new Date()): string {
  const key = istDateKey(date);
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return CURATED_DAILY_THOUGHTS[hash % CURATED_DAILY_THOUGHTS.length];
}

const prohibited = [
  /भविष्य|भविष्यवाणी|चमत्कार|दिव्य संदेश|गारंटी|निश्चित रूप से फल/,
  /इलाज|दवा|रोग|स्वास्थ्य सलाह|पैसा|धन लाभ|निवेश|कर्ज/,
  /डर|भय|दोष|पाप|शाप|अपराधबोध/,
  /\b(prediction|guarantee|cure|medical|financial|divine message)\b/i,
];

export function validateDailyThought(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const thought = value.trim();
  if (!thought || thought.length > 280 || !/[\u0900-\u097F]/.test(thought)) return false;
  const sentences = thought.split(/[.!?।]+/).map((part) => part.trim()).filter(Boolean);
  if (sentences.length < 1 || sentences.length > 2) return false;
  return !prohibited.some((pattern) => pattern.test(thought));
}

export function clearDailyThoughtCache() {
  cache.clear();
}

export async function getDailyThought(now: Date = new Date()): Promise<DailyThoughtPayload> {
  const date = istDateKey(now);
  const existing = cache.get(date);
  if (existing) return existing;

  let thought: string | undefined;
  let source: DailyThoughtSource = "curated";
  if (isAiProviderConfigured()) {
    try {
      const result = await createStructuredCompletion({
        task: "japa_daily_thought",
        timeoutMs: 5_000,
        maxRetries: 0,
        system: [
          "Write one short Hindi devotional positive thought for spoken delivery after Japa.",
          "Return strict JSON with only this field: {\"thought\":\"...\"}.",
          "Use one or two short sentences. Be warm, devotional, and uplifting.",
          "Do not make predictions, invoke fear or guilt, give medical or financial advice,",
          "promise outcomes, or claim this is a divine message. Use Hindi in Devanagari.",
        ].join(" "),
        user: { purpose: "daily devotional thought" },
        schemaName: "japa_daily_thought",
        schema: {
          type: "object",
          additionalProperties: false,
          properties: { thought: { type: "string", maxLength: 280 } },
          required: ["thought"],
        },
        temperature: 0.7,
        maxTokens: 120,
      });
      if (validateDailyThought((result as { thought?: unknown })?.thought)) {
        thought = (result as { thought: string }).thought.trim();
        source = "ai";
      }
    } catch {
      // Provider failures deliberately fall through to the deterministic copy.
    }
  }
  const payload = { thought: thought || curatedThoughtForDate(now), date, source };
  cache.set(date, payload);
  return payload;
}