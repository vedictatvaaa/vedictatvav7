import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const migration = readFileSync("migrations/0010_pandit_lifetime_registration.sql", "utf8");
const schema = readFileSync("shared/schema.ts", "utf8");
const routes = readFileSync("server/routes.ts", "utf8");

test("0010 is additive and preserves legacy membership and card-order systems", () => {
  assert.match(migration, /ADD COLUMN IF NOT EXISTS registration_no text/);
  assert.match(migration, /ADD COLUMN IF NOT EXISTS pandit_id integer REFERENCES pandits\(id\)/);
  assert.doesNotMatch(migration, /\bDROP TABLE\b|\bTRUNCATE\b/);
  assert.doesNotMatch(migration, /ALTER TABLE (?:pandit_card_orders|pandits) DROP COLUMN/);
  assert.match(schema, /membershipNo: text\("membership_no"\)/);
  assert.match(schema, /export const panditCardOrders = pgTable\("pandit_card_orders"/);
});

test("registration allocation is formatted, unique, immutable, retry-safe, and never reused", () => {
  assert.match(migration, /CREATE SEQUENCE IF NOT EXISTS pandit_registration_no_seq/);
  assert.match(migration, /\^VT-PAN-\[0-9\]\{6,\}\$/);
  assert.match(migration, /pandits_registration_no_unique/);
  assert.match(migration, /Pandit registration number is immutable/);
  assert.match(migration, /pandit_registration_numbers[\s\S]+registration_no text PRIMARY KEY/);
  assert.match(migration, /WHERE verified = true AND registration_no IS NULL/);
  assert.match(migration, /ORDER BY created_at NULLS LAST, id/);
  assert.match(routes, /\.for\("update"\)/);
  assert.match(routes, /pending\.status === "approved" && pending\.panditId/);
  assert.match(routes, /nextval\('pandit_registration_no_seq'\)/);
});

test("missing-city lifecycle remains governed by canonical State and City IDs", () => {
  assert.match(migration, /status IN \('pending','mapped','created','rejected'\)/);
  assert.match(migration, /application_id integer NOT NULL UNIQUE/);
  assert.match(routes, /Choose a canonical city or submit one missing-city request/);
  assert.match(routes, /City must be active and belong to the requested State/);
  assert.match(routes, /pandit_location_request\.\$\{parsed\.data\.action\}/);
  assert.match(routes, /Resolve the application's active State and City request before approval/);
});

test("application submission and approval both reject absent or invalid photos", () => {
  assert.match(routes, /photo: z\.string\(\)\.min\(1\)/);
  assert.equal((routes.match(/isValidStoredProfilePhoto\(/g) || []).length >= 4, true);
  assert.match(routes, /A valid successfully uploaded profile photo is required before approval/);
  assert.match(routes, /data:image\\\/\(jpeg\|png\|gif\|webp\);base64/);
});

test("admin APIs are protected and expose registration and location review data", () => {
  assert.match(routes, /"\/api\/admin\/pandits", adminAuthMiddleware/);
  assert.match(routes, /ilike\(pandits\.registrationNo/);
  assert.match(routes, /"\/api\/admin\/pandit-city-requests", adminAuthMiddleware/);
  assert.match(routes, /cityRequest:/);
  assert.match(routes, /Invalid location request resolution/);
});