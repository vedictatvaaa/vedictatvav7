import test from "node:test";
import assert from "node:assert/strict";
import { contactQuotaMetadata, effectivePanditContactPolicy } from "./pandit-contact-policy";

test("Pandit contact override takes precedence over global mode", () => {
  assert.equal(effectivePanditContactPolicy("open", "never_display"), "disabled");
  assert.equal(effectivePanditContactPolicy("disabled", "always_open"), "open");
  assert.equal(effectivePanditContactPolicy("disabled", "use_global"), "disabled");
  assert.equal(effectivePanditContactPolicy("invalid", "use_global"), "login_required");
});

test("rolling quota metadata cannot become negative and reset follows earliest reveal", () => {
  const revealed = new Date("2025-06-01T00:00:00.000Z");
  const state = contactQuotaMetadata(12, revealed, new Date("2025-06-02T00:00:00.000Z"));
  assert.equal(state.remaining, 0);
  assert.equal(state.resetsAt, "2026-06-01T00:00:00.000Z");
});