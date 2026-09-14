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
  state: "ready" | "disabled" | "missing_credentials" | "invalid_base_url" | "degraded";
  message: string;
  action: string;
  lastFailureCategory: string | null;
  lastFailureAt: string | null;
};

export type AiRequestOptions = {
  task: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
};

const firstNonEmpty = (...values: Array<string | undefined>) =>
  values.find(value => typeof value === "string" && value.trim())?.trim() || undefined;

let lastFailure: { category: string; at: string } | null = null;

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
  let validBaseUrl = true;
  try {
    baseUrlHost = new URL(config.baseURL).host;
  } catch {
    validBaseUrl = false;
    baseUrlHost = null;
  }
  const state = !config.enabled
    ? "disabled"
    : !config.apiKey
      ? "missing_credentials"
      : !validBaseUrl
        ? "invalid_base_url"
        : lastFailure
          ? "degraded"
          : "ready";
  const stateCopy = {
    disabled: {
      message: "AI generation is disabled by configuration.",
      action: "Set AI_ENABLED=true when an AI provider should be available.",
    },
    missing_credentials: {
      message: "AI is enabled but no server-side provider key is configured.",
      action: "Add OPENAI_API_KEY in the server environment; never paste it into the Admin page.",
    },
    invalid_base_url: {
      message: "The configured AI provider URL is not valid.",
      action: "Set OPENAI_BASE_URL to a valid OpenAI-compatible /v1 endpoint.",
    },
    degraded: {
      message: `The provider recently reported ${lastFailure?.category.replace(/_/g, " ")}.`,
      action: "Review the provider availability and retry after correcting the reported condition.",
    },
    ready: {
      message: "The shared AI provider is configured and ready.",
      action: "No action required.",
    },
  }[state];
  return {
    enabled: config.enabled,
    configured: Boolean(config.apiKey),
    provider: "openai-compatible",
    baseUrlHost,
    model: config.model,
    state,
    message: stateCopy.message,
    action: stateCopy.action,
    lastFailureCategory: lastFailure?.category || null,
    lastFailureAt: lastFailure?.at || null,
  };
}

export function recordAiProviderFailure(error: unknown) {
  lastFailure = { category: classifyAiProviderError(error), at: new Date().toISOString() };
}

function instrumentClientMethod(owner: any, method: string) {
  const original = owner?.[method];
  if (typeof original !== "function") return;
  owner[method] = async (...args: any[]) => {
    try {
      return await original.apply(owner, args);
    } catch (error) {
      recordAiProviderFailure(error);
      throw error;
    }
  };
}

export function createAiClient(options: AiRequestOptions = { task: "default" }) {
  const config = getAiProviderConfig();
  if (!config.enabled || !config.apiKey) {
    const error = new Error("ai_provider_unavailable");
    recordAiProviderFailure(error);
    throw error;
  }
  const client = new OpenAI({
    apiKey: config.apiKey,
    baseURL: config.baseURL,
    organization: firstNonEmpty(process.env.OPENAI_ORG, process.env.OPENAI_ORGANIZATION),
    timeout: options.timeoutMs ?? config.timeoutMs,
    maxRetries: options.maxRetries ?? config.maxRetries,
  });
  instrumentClientMethod(client.chat?.completions, "create");
  instrumentClientMethod(client.images, "generate");
  instrumentClientMethod(client.images, "edit");
  instrumentClientMethod(client.audio?.speech, "create");
  instrumentClientMethod(client.audio?.transcriptions, "create");
  return client;
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
  if (typeof content !== "string" || !content.trim()) {
    const error = new Error("ai_invalid_output");
    recordAiProviderFailure(error);
    throw error;
  }
  try {
    return JSON.parse(content);
  } catch {
    const error = new Error("ai_invalid_output");
    recordAiProviderFailure(error);
    throw error;
  }
}