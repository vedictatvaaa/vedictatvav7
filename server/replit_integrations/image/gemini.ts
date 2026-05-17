import { Buffer } from "node:buffer";

const IMAGEN_MODEL = "imagen-3.0-generate-002";
const IMAGEN_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${IMAGEN_MODEL}:predict`;

function getKey(): string {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY || "";
  if (!key) {
    throw new Error(
      "GEMINI_API_KEY is not set. Add it in the admin Secrets panel to enable Gemini image generation."
    );
  }
  return key;
}

function aspectFromSize(size: string): "1:1" | "16:9" | "9:16" | "4:3" | "3:4" {
  switch (size) {
    case "1792x1024":
    case "1536x864":
    case "16x9":
      return "16:9";
    case "1024x1792":
    case "9x16":
      return "9:16";
    case "4x3":
      return "4:3";
    case "3x4":
      return "3:4";
    default:
      return "1:1";
  }
}

export async function generateGeminiImageBuffer(
  prompt: string,
  size: string = "1024x1024"
): Promise<Buffer> {
  const key = getKey();
  const body = {
    instances: [{ prompt }],
    parameters: {
      sampleCount: 1,
      aspectRatio: aspectFromSize(size),
      personGeneration: "allow_adult",
    },
  };

  const res = await fetch(`${IMAGEN_ENDPOINT}?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = "";
    try {
      const j: any = await res.json();
      detail = j?.error?.message || JSON.stringify(j).slice(0, 400);
    } catch {
      detail = await res.text().then((t) => t.slice(0, 400)).catch(() => "");
    }
    throw new Error(`Gemini Imagen ${res.status}: ${detail}`);
  }

  const json: any = await res.json();
  const b64 =
    json?.predictions?.[0]?.bytesBase64Encoded ||
    json?.predictions?.[0]?.image?.bytesBase64Encoded ||
    "";
  if (!b64) {
    throw new Error("Gemini returned no image bytes. The prompt may have been blocked by safety filters.");
  }
  return Buffer.from(b64, "base64");
}

export function isGeminiConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_API_KEY);
}
