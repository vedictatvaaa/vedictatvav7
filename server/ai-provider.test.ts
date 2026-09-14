import test from "node:test";
import assert from "node:assert/strict";
import {
  classifyAiProviderError,
  createAiClient,
  getAiProviderConfig,
  getAiProviderStatus,
  isAiProviderConfigured,
  recordAiProviderFailure,
} from "./ai-provider";

const ENV_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "AI_ENABLED",
  "AI_REQUEST_TIMEOUT_MS",
  "AI_MAX_RETRIES",
];

function withEnv(values: Record<string, string | undefined>, fn: () => void) {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  try {
    for (const key of ENV_KEYS) {
      if (key in values) {
        const value = values[key];
        if (value === undefined) delete process.env[key];
        else process.env[key] = value;
      }
    }
    fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

test("provider uses self-hosted configuration consistently without exposing the key", () => {
  withEnv({
    OPENAI_API_KEY: "test-only-key",
    OPENAI_BASE_URL: "https://llm.example.test/v1",
    OPENAI_MODEL: "local-chat-model",
    AI_ENABLED: "true",
    AI_REQUEST_TIMEOUT_MS: "23000",
    AI_MAX_RETRIES: "3",
  }, () => {
    const config = getAiProviderConfig();
    const status = getAiProviderStatus();
    const client = createAiClient({ task: "provider-test" }) as any;

    assert.equal(config.baseURL, "https://llm.example.test/v1");
    assert.equal(config.model, "local-chat-model");
    assert.equal(config.timeoutMs, 23000);
    assert.equal(config.maxRetries, 3);
    assert.equal(status.baseUrlHost, "llm.example.test");
    assert.equal(status.model, "local-chat-model");
    assert.equal(status.configured, true);
    assert.equal("apiKey" in status, false);
    assert.equal(client.baseURL, "https://llm.example.test/v1");
    assert.equal(client.timeout, 23000);
    assert.equal(client.maxRetries, 3);
  });
});

test("disabled or missing provider fails before a network request", () => {
  withEnv({ OPENAI_API_KEY: "test-only-key", AI_ENABLED: "false" }, () => {
    assert.equal(isAiProviderConfigured(), false);
    assert.throws(() => createAiClient({ task: "disabled-test" }), /ai_provider_unavailable/);
  });

  withEnv({ OPENAI_API_KEY: undefined, AI_ENABLED: undefined }, () => {
    assert.equal(isAiProviderConfigured(), false);
    assert.throws(() => createAiClient({ task: "missing-key-test" }), /ai_provider_unavailable/);
  });
});

test("provider failures are normalized into stable categories", () => {
  assert.equal(classifyAiProviderError(new Error("ai_provider_unavailable")), "unavailable");
  assert.equal(classifyAiProviderError({ status: 429 }), "rate_limit");
  assert.equal(classifyAiProviderError({ status: 408 }), "timeout");
  assert.equal(classifyAiProviderError({ status: 503 }), "upstream");
  assert.equal(classifyAiProviderError(new Error("invalid JSON schema")), "invalid_output");
});

test("Admin status exposes actionable failure state without provider credentials", () => {
  withEnv({ OPENAI_API_KEY: "test-only-key", AI_ENABLED: "true" }, () => {
    recordAiProviderFailure({ status: 429, message: "rate limit reached; secret-key-must-not-appear" });
    const status = getAiProviderStatus();

    assert.equal(status.state, "degraded");
    assert.equal(status.lastFailureCategory, "rate_limit");
    assert.ok(status.lastFailureAt);
    assert.match(status.message, /rate limit/);
    assert.doesNotMatch(JSON.stringify(status), /secret-key-must-not-appear/);
    assert.doesNotMatch(JSON.stringify(status), /apiKey|authorization|token/i);
  });
});