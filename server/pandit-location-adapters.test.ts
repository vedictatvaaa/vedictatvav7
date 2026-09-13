import test from "node:test";
import assert from "node:assert/strict";
import { createOpenAILocationInterpreter } from "./pandit-location-ai";
import { createVerifiedCityGeocoder } from "./pandit-location-geocoder";

test("OpenAI location adapter sends only candidate IDs and caps confidence for review", async () => {
  let request: any;
  const adapter = createOpenAILocationInterpreter({
    client: {
      chat: { completions: { create: async (input: any) => {
        request = input;
        return { choices: [{ message: { content: JSON.stringify({ stateId: 2, cityId: 20, confidence: 0.99, reason: "spelling" }) } }] };
      } } },
    },
  });
  const result = await adapter({
    stateText: "Karnataka", cityText: "Bengaluru area",
    candidates: [{ stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru" }],
  });
  assert.equal(result?.stateId, 2);
  assert.equal(result?.cityId, 20);
  assert.equal(result?.confidence, 0.89);
  assert.equal(request.response_format.type, "json_schema");
  const userPayload = JSON.parse(request.messages[1].content);
  assert.deepEqual(userPayload.candidates, [{ stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru" }]);
  assert.equal("phone" in userPayload, false);
  assert.equal("latitude" in userPayload, false);
});

test("verified city geocoder validates India and canonical city/state, caches, and never accepts street input", async () => {
  let calls = 0;
  const geocoder = createVerifiedCityGeocoder({
    minIntervalMs: 0,
    fetchImpl: async (url) => {
      calls++;
      assert.match(url, /Bengaluru%2C%20Karnataka%2C%20India/);
      return new Response(JSON.stringify([{
        lat: "12.9716", lon: "77.5946",
        address: { country_code: "in", city: "Bengaluru", state: "Karnataka" },
      }]), { status: 200, headers: { "content-type": "application/json" } });
    },
  });
  const candidate = { stateId: 2, cityId: 20, state: "Karnataka", city: "Bengaluru" };
  const first = await geocoder(candidate);
  const second = await geocoder(candidate);
  assert.equal(first?.verified, true);
  assert.equal(first?.scope, "city_centroid");
  assert.equal(first?.source, "nominatim:city-identity");
  assert.equal(first?.latitude, 12.9716);
  assert.equal(second?.longitude, 77.5946);
  assert.equal(calls, 1);

  const rejected = createVerifiedCityGeocoder({
    minIntervalMs: 0,
    fetchImpl: async () => new Response(JSON.stringify([{
      lat: "12.9716", lon: "77.5946",
      address: { country_code: "us", city: "Bengaluru", state: "Karnataka" },
    }]), { status: 200 }),
  });
  assert.equal(await rejected(candidate), null);
});