import test from "node:test";
import assert from "node:assert/strict";
import { contactQuotaMetadata, effectivePanditContactPolicy } from "./pandit-contact-policy";

test("every global and override combination obeys the disabled ceiling", () => {
  const cases: Array<[string, string, string]> = [
    ["open", "use_global", "open"], ["open", "always_open", "open"], ["open", "login_required", "login_required"], ["open", "never_display", "disabled"],
    ["login_required", "use_global", "login_required"], ["login_required", "always_open", "open"], ["login_required", "login_required", "login_required"], ["login_required", "never_display", "disabled"],
    ["disabled", "use_global", "disabled"], ["disabled", "always_open", "disabled"], ["disabled", "login_required", "disabled"], ["disabled", "never_display", "disabled"],
  ];
  for (const [global, override, expected] of cases) assert.equal(effectivePanditContactPolicy(global, override), expected, `${global}/${override}`);
  assert.equal(effectivePanditContactPolicy("invalid", "use_global"), "login_required");
});

test("rolling quota metadata cannot become negative and reset follows earliest reveal", () => {
  const revealed = new Date("2025-06-01T00:00:00.000Z");
  const state = contactQuotaMetadata(12, revealed, new Date("2025-06-02T00:00:00.000Z"));
  assert.equal(state.remaining, 0);
  assert.equal(state.resetsAt, "2026-06-01T00:00:00.000Z");
});