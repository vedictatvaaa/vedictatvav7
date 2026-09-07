import test from "node:test";
import assert from "node:assert/strict";
import { bookingDiagnostics, governanceCompleteness, safeGovernanceAuditDetails, safeGovernanceAuditState } from "./pandit-governance";

const service = {
  id: 1,
  name: "Satyanarayan Puja",
  slug: "satyanarayan-puja",
  mode: "in_person",
  price: 5100,
  serviceAreas: ["Varanasi"],
};

test("profile completeness uses the fixed real-field checklist without auto-verifying", () => {
  const complete = governanceCompleteness({
    name: "Pt. Test",
    image: "/test.jpg",
    bio: "Experienced priest.",
    languages: "Hindi, Sanskrit",
    experience: 12,
    verified: true,
  }, {
    services: [service],
    membership: true,
    hasContact: true,
    canonicalLocation: true,
    bookingReady: true,
  });
  assert.equal(complete.score, 100);
  assert.deepEqual(complete.missing, []);

  const incomplete = governanceCompleteness({
    name: "Pt. Test",
    languages: "Hindi",
    experience: 1,
    verified: false,
  }, {
    services: [],
    membership: false,
    hasContact: false,
    canonicalLocation: false,
    bookingReady: false,
  });
  assert.ok(incomplete.score < 100);
  assert.ok(incomplete.missing.includes("verification"));
  assert.ok(incomplete.missing.includes("active_service_assignment"));
});

test("booking diagnostics report every failed gate and never infer calendar availability", () => {
  const diagnostics = bookingDiagnostics({
    accountStatus: "active",
    onLeave: false,
    archived: false,
    bookingEnabled: true,
    availability: "unavailable",
  }, {
    services: [{ ...service, serviceAreas: [] }],
  });
  assert.equal(diagnostics.checks.active.passed, true);
  assert.equal(diagnostics.checks.verified.passed, false);
  assert.equal(diagnostics.checks.serviceAreaApproved.passed, false);
  assert.equal(diagnostics.checks.availability.passed, false);
  assert.equal(diagnostics.result.passed, false);
  assert.ok(diagnostics.exclusions.some(value => value.startsWith("availability:")));
  assert.equal(JSON.stringify(diagnostics).includes("calendar"), false);
});

test("booking diagnostics pass only when every shared general gate passes", () => {
  const diagnostics = bookingDiagnostics({
    accountStatus: "active",
    onLeave: false,
    archived: false,
    verified: true,
    bookingEnabled: true,
    availability: "available",
  }, {
    services: [service],
  });
  assert.equal(diagnostics.result.passed, true);
  assert.deepEqual(diagnostics.exclusions, []);
});

test("governance audit projections redact contact values and customer identity", () => {
  const state = safeGovernanceAuditState({
    verified: true,
    accountStatus: "active",
    phone: "+91-secret",
    whatsappNumber: "+91-secret",
    email: "private@example.invalid",
    userId: 99,
  });
  assert.equal(JSON.stringify(state).match(/phone|whatsapp|email|userId|secret/i), null);

  const details = safeGovernanceAuditDetails({
    reason: "Approved by operations",
    batchId: "batch-1",
    before: { verified: false, phone: "+91-secret", userId: 99 },
    contact: "+91-secret",
  });
  assert.equal(JSON.stringify(details).match(/phone|whatsapp|email|userId|secret|contact/i), null);
});