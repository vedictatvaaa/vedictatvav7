import OpenAI from "openai";
import type { LocationAiInterpreter } from "./pandit-location-rectification";

const apiKey = () => process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;

export function isOpenAILocationInterpreterConfigured() {
  return Boolean(apiKey());
}

/**
 * Creates the optional interpretation adapter. It receives only free-form
 * state/city text and a public active catalogue; no Pandit identity, contact,
 * address, credentials, or coordinates are sent to OpenAI.
 */
export function createOpenAILocationInterpreter(options: {
  client?: any; model?: string; timeoutMs?: number;
} = {}): LocationAiInterpreter {
  const client = options.client || new OpenAI({
    apiKey: apiKey(),
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    timeout: options.timeoutMs ?? 8_000,
  });
  const model = options.model || process.env.OPENAI_LOCATION_MODEL || "gpt-4o-mini";
  return async ({ stateText, cityText, candidates }) => {
    if (!candidates.length) return null;
    const completion = await client.chat.completions.create({
      model,
      temperature: 0,
      max_tokens: 180,
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "pandit_location_interpretation",
          strict: true,
          schema: {
            type: "object",
            additionalProperties: false,
            properties: {
              stateId: { type: "integer" }, cityId: { type: "integer" },
              confidence: { type: "number", minimum: 0, maximum: 1 },
              reason: { type: "string", maxLength: 300 },
            },
            required: ["stateId", "cityId", "confidence", "reason"],
          },
        },
      },
      messages: [
        {
          role: "system",
          content: "Interpret only the location spelling. Select exactly one active candidate ID. Never infer coordinates or any other Pandit information. Your confidence is advisory only and this result always requires human review.",
        },
        {
          role: "user",
          content: JSON.stringify({ stateText: stateText || null, cityText: cityText || null, candidates }),
        },
      ],
    });
    const content = completion.choices?.[0]?.message?.content;
    if (typeof content !== "string") return null;
    let parsed: any;
    try { parsed = JSON.parse(content); } catch { return null; }
    const candidate = candidates.find(item => item.stateId === parsed?.stateId && item.cityId === parsed?.cityId);
    if (!candidate || !Number.isFinite(parsed.confidence)) return null;
    // Keep all model suggestions below the engine's automatic threshold.
    return {
      stateId: candidate.stateId,
      cityId: candidate.cityId,
      confidence: Math.min(0.89, Math.max(0, Number(parsed.confidence))),
      reason: typeof parsed.reason === "string" ? parsed.reason.slice(0, 300) : "Model-selected active catalogue candidate",
    };
  };
}