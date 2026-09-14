import test from "node:test";
import assert from "node:assert/strict";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { once } from "node:events";
import { mkdtemp, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createAiClient, getAiProviderConfig, getAiProviderStatus } from "./ai-provider";
import { editImages, generateImageBuffer } from "./replit_integrations/image/client";
import {
  speechToText,
  textToSpeech,
  voiceChatStream,
} from "./replit_integrations/audio/client";
import {
  answerProductQuestionWithClient,
  rerankProductRecommendationsWithClient,
} from "./wave3";

type MockRequest = {
  path: string;
  body: string;
  authorization: string | undefined;
};

const ENV_KEYS = [
  "OPENAI_API_KEY",
  "OPENAI_BASE_URL",
  "OPENAI_MODEL",
  "AI_ENABLED",
  "AI_REQUEST_TIMEOUT_MS",
  "AI_MAX_RETRIES",
];

async function withEnv<T>(values: Record<string, string | undefined>, fn: () => Promise<T>): Promise<T> {
  const previous = Object.fromEntries(ENV_KEYS.map((key) => [key, process.env[key]]));
  try {
    for (const key of ENV_KEYS) {
      if (!(key in values)) continue;
      const value = values[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    return await fn();
  } finally {
    for (const key of ENV_KEYS) {
      const value = previous[key];
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
}

function jsonResponse(res: ServerResponse, payload: unknown) {
  const body = JSON.stringify(payload);
  res.writeHead(200, { "content-type": "application/json" });
  res.end(body);
}

async function startMockProvider() {
  const requests: MockRequest[] = [];
  const audioBase64 = Buffer.from("mock-audio").toString("base64");
  const imageBase64 = Buffer.from("mock-image").toString("base64");
  let retryFailuresRemaining = 1;

  const server = createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const chunks: Buffer[] = [];
    for await (const chunk of req) chunks.push(Buffer.from(chunk));
    const body = Buffer.concat(chunks).toString("utf8");
    requests.push({
      path: req.url || "",
      body,
      authorization: typeof req.headers.authorization === "string" ? req.headers.authorization : undefined,
    });

    if (req.url?.endsWith("/chat/completions")) {
      const payload = JSON.parse(body || "{}");
      if (payload.messages?.some((message: any) => String(message.content).includes("retry-check")) && retryFailuresRemaining > 0) {
        retryFailuresRemaining -= 1;
        res.writeHead(500, { "content-type": "application/json" });
        return res.end(JSON.stringify({ error: { message: "controlled transient failure" } }));
      }
      if (payload.stream) {
        res.writeHead(200, {
          "content-type": "text/event-stream",
          "cache-control": "no-cache",
          connection: "keep-alive",
        });
        if (payload.model === "gpt-audio") {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { audio: { transcript: "voice transcript" } } }] })}\n\n`);
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { audio: { data: audioBase64 } } }] })}\n\n`);
        } else {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "mock " } }] })}\n\n`);
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: "stream" } }] })}\n\n`);
        }
        res.write("data: [DONE]\n\n");
        return res.end();
      }
      if (payload.model === "gpt-audio") {
        return jsonResponse(res, {
          choices: [{ message: { audio: { transcript: "voice transcript", data: audioBase64 } } }],
        });
      }
      if (payload.messages?.some((message: any) => String(message.content).includes("recent buying patterns"))) {
        return jsonResponse(res, {
          choices: [{ message: { content: "[2,1]" } }],
        });
      }
      return jsonResponse(res, {
        choices: [{ message: { content: "mock provider answer" } }],
      });
    }

    if (req.url?.endsWith("/images/generations") || req.url?.endsWith("/images/edits")) {
      return jsonResponse(res, { data: [{ b64_json: imageBase64 }] });
    }

    if (req.url?.endsWith("/audio/transcriptions")) {
      return jsonResponse(res, { text: "mock transcript" });
    }

    res.writeHead(404);
    res.end("not found");
  });
  server.listen(0, "127.0.0.1");
  await once(server, "listening");
  const address = server.address();
  assert.ok(address && typeof address !== "string");
  return {
    server,
    requests,
    baseUrl: `http://127.0.0.1:${address.port}/v1`,
  };
}

test("all AI channels reach a local OpenAI-compatible provider", async () => {
  const mock = await startMockProvider();
  const tempDir = await mkdtemp(join(tmpdir(), "ai-provider-smoke-"));
  const imageInput = join(tempDir, "input.png");
  const imageOutput = join(tempDir, "output.png");
  await writeFile(imageInput, Buffer.from("not-a-real-image"));

  try {
    await withEnv({
      OPENAI_API_KEY: "smoke-test-secret",
      OPENAI_BASE_URL: mock.baseUrl,
      OPENAI_MODEL: "mock-text-model",
      AI_ENABLED: "true",
      AI_REQUEST_TIMEOUT_MS: "4321",
      AI_MAX_RETRIES: "2",
    }, async () => {
      const client = createAiClient({ task: "smoke-suite" }) as any;
      const config = getAiProviderConfig();
      assert.equal(config.baseURL, mock.baseUrl);
      assert.equal(config.model, "mock-text-model");
      assert.equal(client.baseURL, mock.baseUrl);
      assert.equal(client.timeout, 4321);
      assert.equal(client.maxRetries, 2);

      const completion = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: "hello" }],
      });
      assert.equal(completion.choices[0].message.content, "mock provider answer");

      const retriedCompletion = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: "retry-check" }],
      });
      assert.equal(retriedCompletion.choices[0].message.content, "mock provider answer");

      const stream = await client.chat.completions.create({
        model: config.model,
        messages: [{ role: "user", content: "stream hello" }],
        stream: true,
      });
      let streamed = "";
      for await (const chunk of stream) streamed += chunk.choices[0]?.delta?.content || "";
      assert.equal(streamed, "mock stream");

      assert.deepEqual(await generateImageBuffer("a temple", "256x256"), Buffer.from("mock-image"));
      assert.deepEqual(await editImages([imageInput], "add flowers", imageOutput), Buffer.from("mock-image"));

      assert.equal(await speechToText(Buffer.from("wav bytes"), "wav"), "mock transcript");
      assert.deepEqual(await textToSpeech("Namaste"), Buffer.from("mock-audio"));

      const voiceStream = await voiceChatStream(Buffer.from("wav bytes"), "alloy", "wav");
      const voiceEvents: Array<{ type: string; data: string }> = [];
      for await (const event of voiceStream) voiceEvents.push(event);
      assert.deepEqual(voiceEvents, [
        { type: "transcript", data: "voice transcript" },
        { type: "audio", data: Buffer.from("mock-audio").toString("base64") },
      ]);

      const productAnswer = await answerProductQuestionWithClient({
        name: "Mock Rudraksha",
        category: "Mala",
        price: 1200,
        stock: 4,
        description: "A test product used only by the smoke suite.",
        highlights: ["Natural beads"],
        features: ["Meditation support"],
      }, "What is this?", client);
      assert.equal(productAnswer, "mock provider answer");

      const recommendationOne = { id: 1, name: "First Mala", category: "Mala", price: 100 };
      const recommendationTwo = { id: 2, name: "Second Yantra", category: "Yantra", price: 200 };
      const reranked = await rerankProductRecommendationsWithClient(
        [{ product: recommendationOne }, { product: recommendationTwo }],
        ["Mala"],
        1,
        2,
        client,
      );
      assert.deepEqual(reranked, [recommendationTwo, recommendationOne]);

      const status = getAiProviderStatus();
      assert.equal(status.baseUrlHost, new URL(mock.baseUrl).host);
      assert.equal("apiKey" in status, false);
      assert.doesNotMatch(JSON.stringify(status), /smoke-test-secret/);
    });

    const chatRequests = mock.requests.filter((request) => request.path.endsWith("/chat/completions"));
    assert.ok(chatRequests.length >= 4);
    assert.ok(chatRequests.some((request) => request.body.includes('"model":"mock-text-model"')));
    assert.ok(chatRequests.some((request) => request.body.includes('"model":"gpt-audio"')));
    assert.equal(chatRequests.filter((request) => request.body.includes("retry-check")).length, 2);
    const imageGeneration = mock.requests.find((request) => request.path.endsWith("/images/generations"));
    const imageEdit = mock.requests.find((request) => request.path.endsWith("/images/edits"));
    const transcription = mock.requests.find((request) => request.path.endsWith("/audio/transcriptions"));
    assert.ok(imageGeneration);
    assert.ok(imageGeneration.body.includes('"model":"gpt-image-1"'));
    assert.ok(imageEdit);
    assert.match(imageEdit.body, /gpt-image-1/);
    assert.ok(transcription);
    assert.match(transcription.body, /gpt-4o-mini-transcribe/);
    assert.ok(mock.requests.every((request) => request.authorization === "Bearer smoke-test-secret"));
  } finally {
    await unlink(imageInput).catch(() => {});
    await unlink(imageOutput).catch(() => {});
    await new Promise<void>((resolve, reject) => mock.server.close((error) => error ? reject(error) : resolve()));
  }
});