import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import { normalizePanditPhone } from "./pandit-phone";

test("Pandit phone normalization accepts the advertised formats and rejects invalid numbers", () => {
  assert.equal(normalizePanditPhone("+91 90000-12345"), "9000012345");
  assert.equal(normalizePanditPhone("90000 12345"), "9000012345");
  assert.equal(normalizePanditPhone("12345"), null);
  assert.equal(normalizePanditPhone("00000-12345"), null);
});

test("Pandit auth contract is cookie-only and invalidates sessions on password change", () => {
  const portal = readFileSync("server/pandit-portal.ts", "utf8");
  const client = readFileSync("client/src/lib/panditAuth.ts", "utf8");
  const schema = readFileSync("shared/schema.ts", "utf8");
  const migration = readFileSync("migrations/0018_pandit_terms_acceptance.sql", "utf8");
  assert.match(portal, /secure: process\.env\.NODE_ENV === "production"/);
  assert.match(portal, /path: "\/"/);
  assert.match(portal, /await tx\.delete\(panditSessions\)\.where\(eq\(panditSessions\.panditId, req\.panditId!\)\)/);
  assert.doesNotMatch(portal, /res\.json\(\{ ok: true, token,/);
  assert.doesNotMatch(client, /localStorage\.(getItem|setItem|removeItem)\(/);
  assert.match(schema, /termsAcceptedAt: timestamp\("terms_accepted_at"\)/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS terms_accepted_at timestamp/);
});

test("Pandit application and admin contracts reject invalid identity/status input", () => {
  const routes = readFileSync("server/routes.ts", "utf8");
  const admin = readFileSync("server/admin-auth.ts", "utf8");
  const adminUi = readFileSync("client/src/pages/admin-tabs/PanditsTab.tsx", "utf8");
  assert.match(routes, /termsAccepted: z\.literal\(true\)/);
  assert.match(routes, /termsAcceptedAt: new Date\(\)/);
  assert.match(routes, /normalizePanditPhone\(d\.phone\)/);
  assert.match(routes, /return res\.status\(400\)\.json\(\{ message: "Invalid application status" \}\)/);
  assert.match(admin, /const cookieUserId = cookieToken/);
  assert.match(adminUi, /\.cities\.filter\(c=>c\.isActive\)/);
  assert.match(adminUi, /if \(!res\.ok\) throw new Error\(body\.message \|\| "Safe location resolution failed"\)/);
});

test("Pandit signup returns applicant-safe requirement messages", () => {
  const routes = readFileSync("server/routes.ts", "utf8");
  const start = routes.indexOf('app.post("/api/pandit-applications"');
  const end = routes.indexOf("// Admin: list pandit applications", start);
  assert.ok(start >= 0 && end > start);
  const signupRoute = routes.slice(start, end);
  assert.match(signupRoute, /Select exactly five specialist Pujas \(you selected \$\{count\}\)/);
  assert.match(signupRoute, /Share your exact location before submitting/);
  assert.match(signupRoute, /Confirm that the selected Pujas are services you personally offer/);
  assert.match(signupRoute, /Upload a profile photo before submitting/);
  assert.doesNotMatch(signupRoute, /message: parsed\.error\.issues\.map\(i => i\.message\)\.join\(", "\)/);
});