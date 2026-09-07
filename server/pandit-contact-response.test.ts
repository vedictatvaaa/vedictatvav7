import test from "node:test";
import assert from "node:assert/strict";
import { contactStatusDto, setPrivateContactResponse } from "./pandit-contact-response";

test("contact status DTO never includes a contact value", () => {
  const payload = contactStatusDto("open", true, false, null);
  assert.equal(payload.state, "open");
  assert.deepEqual(payload, { policy: "open", available: true, authenticated: false, state: "open", quota: null });
  assert.equal(JSON.stringify(payload).match(/phone|whatsapp/i), null);
});

test("contact responses are explicitly private and no-store", () => {
  const headers = new Map<string, string>();
  setPrivateContactResponse({ setHeader: (key: string, value: string) => headers.set(key, value) } as any);
  assert.equal(headers.get("Cache-Control"), "private, no-store");
});