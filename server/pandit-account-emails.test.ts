import assert from "node:assert/strict";
import test from "node:test";
import { buildPanditApprovalEmail, buildPanditPasswordResetEmail } from "./pandit-account-emails";

test("approval email contains account guidance and never contains a password", () => {
  const message = buildPanditApprovalEmail({
    to: "pandit@example.com",
    fullName: "Acharya Test",
    city: "Pune",
    registrationNo: "1001000999",
    setupUrl: "https://vedictatva.com/pandit/reset-password?token=safe-token",
    storefrontUrl: "https://vedictatva.com/pandit/acharya-test",
    storefrontPublished: false,
    adminNote: "Complete your service list.",
  });
  assert.match(message.text, /Registration number: 1001000999/);
  assert.match(message.text, /Create your private password/);
  assert.match(message.text, /storefront starts as a draft/);
  assert.match(message.text, /Do not:/);
  assert.doesNotMatch(message.text, /Temporary password|password:\s+\S+/i);
  assert.doesNotMatch(message.html || "", /Temporary password|password:\s+\S+/i);
});

test("password reset email includes only the secure link", () => {
  const message = buildPanditPasswordResetEmail({
    to: "pandit@example.com",
    fullName: "Acharya Test",
    resetUrl: "https://vedictatva.com/pandit/reset-password?token=safe-token",
  });
  assert.match(message.text, /safe-token/);
  assert.doesNotMatch(message.text, /Temporary password/i);
});