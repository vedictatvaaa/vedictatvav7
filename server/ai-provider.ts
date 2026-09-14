import OpenAI from "openai";

// Compatibility bridge for deployments that still provide the legacy
// integration variable names. All AI clients now resolve through this module.
if (!process.env.OPENAI_API_KEY && process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  process.env.OPENAI_API_KEY = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
}
if (!process.env.AI_INTEGRATIONS_OPENAI_BASE_URL && process.env.OPENAI_BASE_URL) {
  process.env.AI_INTEGRATIONS_OPENAI_BASE_URL = process.env.OPENAI_BASE_URL;
}

export type AiProviderStatus = {
  enabled: boolean;
  configured: boolean;
  provider: "openai-compatible";
  baseUrlHost: string | null;
  model: string;
  lastFailureCategory?: string;
};

export type AiRequestOptions = {
  task: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
};

const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find(value => typeof value === "string" && value.trim())?.trim() || undefined;

export function getAiProviderConfig() {
  const apiKey = firstNonEmpty(
    process.env.OPENAI_API_KEY,
    process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  );
  const baseURL = firstNonEmpty(
    process.env.OPENAI_BASE_URL,
    process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  ) || "https://api.openai.com/v1";
  const model = firstNonEmpty(
    process.env.OPENAI_MODEL,
    process.env.AI_INTEGRATIONS_OPENAI_MODEL,
    process.env.OPENAI_LOCATION_MODEL,
  ) || "gpt-4o-mini";
  const enabledValue = process.env.AI_ENABLED?.trim().toLowerCase();
  const enabled = enabledValue === undefined
    ? Boolean(apiKey)
    : enabledValue === "true" || enabledValue === "1" || enabledValue === "yes";

  return {
    apiKey,
    baseURL,
    model,
    enabled,
    timeoutMs: Math.max(1_000, Number(process.env.AI_REQUEST_TIMEOUT_MS) || 15_000),
    maxRetries: Math.min(3, Math.max(0, Number(process.env.AI_MAX_RETRIES) || 1)),
  };
}

export function isAiProviderConfigured() {
  const config = getAiProviderConfig();
  return config.enabled && Boolean(config.apiKey);
}

export function getAiProviderStatus(): AiProviderStatus {
  const config = getAiProviderConfig();
  let baseUrlHost: string | null = null;
  try {
    baseUrlHost = new URL(config.baseURL).host;
  } catch {
    baseUrlHost = null;
  }
  return {
    enabled: config.enabled,
    configured: Boolean(config.apiKey),
    provider: "openai-compatible",
    baseUrlHost,
    model: config.model,
  };
}

export function createAiClient(options: AiRequestOptions = { task: "default" }) {
  const config = getAiProviderConfig();
  if (!config.enabled || !config.apiKey) {
    throw new Error("ai_provider_unavailable");
  }
  return new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    organization: firstNonEmpty(process.env.OPENAI_ORG, process.env.OPENAI_ORGANIZATION),
    timeout: options.timeoutMs ?? config.timeoutMs,
    maxRetries: options.maxRetries ?? config.maxRetries,
  });
}

export function classifyAiProviderError(error: unknown) {
  const status = Number((error as any)?.status);
  const message = String((error as any)?.message || "").toLowerCase();
  if (message.includes("ai_provider_unavailable")) return "unavailable";
  if (status === 429 || message.includes("rate limit")) return "rate_limit";
  if (status === 408 || message.includes("timeout") || message.includes("aborted")) return "timeout";
  if (status >= 500) return "upstream";
  if (message.includes("json") || message.includes("schema")) return "invalid_output";
  return "request_failed";
}

export async function createStructuredCompletion(
  options: AiRequestOptions & {
    system: string;
    user: unknown;
    schemaName: string;
    schema: Record<string, unknown>;
    temperature?: number;
    maxTokens?: number;
  },
) {
  const client = createAiClient(options);
  const config = getAiProviderConfig();
  const completion = await client.chat.completions.create({
    model: options.model || config.model,
    temperature: options.temperature ?? 0,
    max_tokens: options.maxTokens ?? 500,
    response_format: {
      type: "json_schema",
      json_schema: {
        name: options.schemaName,
        strict: true,
        schema: options.schema,
      },
    },
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: JSON.stringify(options.user) },
    ],
  });
  const content = completion.choices?.[0]?.message?.content;
  if (typeof content !== "string" || !content.trim()) throw new Error("ai_invalid_output");
  try {
    return JSON.parse(content);
  } catch {
    throw new Error("ai_invalid_output");
  }
}