import crypto from "crypto";
import { createAiClient } from "./ai-provider";

const cache = new Map<string, Buffer>();
const MAX_CACHE_ENTRIES = 80;

export type JapaNarrationPurpose = "mantra_benefit" | "completion";

export async function getJapaDevotionalNarration(input: {
  purpose: JapaNarrationPurpose;
  text: string;
  cacheKey: string;
}): Promise<Buffer> {
  const contentHash = crypto.createHash("sha256").update(input.text).digest("hex").slice(0, 16);
  const key = `${input.purpose}:${input.cacheKey}:${contentHash}`;
  const existing = cache.get(key);
  if (existing) return existing;

  const client = createAiClient({ task: "japa_devotional_narration", model: "tts-1" });
  const response = await client.audio.speech.create({
    model: "tts-1",
    voice: "onyx",
    input: input.text,
    response_format: "mp3",
    speed: 0.9,
  });
  const audio = Buffer.from(await response.arrayBuffer());
  if (!audio.length) throw new Error("Narration provider returned empty audio");

  if (cache.size >= MAX_CACHE_ENTRIES) {
    const oldest = cache.keys().next().value;
    if (oldest) cache.delete(oldest);
  }
  cache.set(key, audio);
  return audio;
}