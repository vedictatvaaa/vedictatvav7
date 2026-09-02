import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { isValidStoredProfilePhoto } from "./profile-photo-validation";

const migration = readFileSync("migrations/0010_pandit_lifetime_registration.sql", "utf8");
const successorMigration = readFileSync("migrations/0011_finalize_pandit_registration_numbers.sql", "utf8");
const schema = readFileSync("shared/schema.ts", "utf8");
const routes = readFileSync("server/routes.ts", "utf8");
const photoValidator = readFileSync("server/profile-photo-validation.ts", "utf8");

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
  assert.match(migration, /MINVALUE 1001000156 MAXVALUE 9999999999 START WITH 1001000156 NO CYCLE/);
  assert.match(migration, /\^\[0-9\]\{10\}\$/);
  assert.match(migration, /COALESCE\(MAX\(registration_no::bigint\), 1001000155\)/);
  assert.match(migration, /\(existing\.max_no \+ eligible\.ordinal\)::text/);
  assert.doesNotMatch(migration, /VT-PAN/);
  assert.match(migration, /pandits_registration_no_unique/);
  assert.match(migration, /Pandit registration number is immutable/);
  assert.match(migration, /pandit_registration_numbers[\s\S]+registration_no text PRIMARY KEY/);
  assert.match(migration, /WHERE verified = true AND registration_no IS NULL/);
  assert.match(migration, /ORDER BY created_at NULLS LAST, id/);
  assert.match(routes, /\.for\("update"\)/);
  assert.match(routes, /pending\.status === "approved" && pending\.panditId/);
  assert.match(routes, /registrationNo: sql`nextval\('pandit_registration_no_seq'\)::text`/);
  assert.doesNotMatch(routes, /VT-PAN/);
});

test("0011 safely upgrades either numeric 0010 or legacy prefixed 0010 state", () => {
  assert.match(successorMigration, /ALTER TABLE pandits ADD COLUMN IF NOT EXISTS legacy_registration_no text/);
  assert.match(successorMigration, /VT-PAN-\[0-9\]\{6,\}/);
  assert.match(successorMigration, /legacy_registration_no = COALESCE\(p\.legacy_registration_no, p\.registration_no\)/);
  assert.match(successorMigration, /registration_no = \(ceiling\.value \+ legacy\.ordinal\)::text/);
  assert.match(successorMigration, /ORDER BY created_at NULLS LAST, id/);
  assert.match(successorMigration, /Pandit registration\/ledger history is invalid; aborting 0011/);
  assert.match(successorMigration, /Pandit legacy registration number is immutable/);
});

test("0011 uses ledger history, including deleted Pandits, as the sequence ceiling", () => {
  assert.match(successorMigration, /FROM pandit_registration_numbers WHERE registration_no ~ '\^\[0-9\]\{10\}\$'/);
  assert.match(successorMigration, /SELECT MAX\(registration_no::bigint\)[\s\S]+FROM pandit_registration_numbers WHERE registration_no ~ '\^\[0-9\]\{10\}\$'/);
  assert.match(successorMigration, /setval\([\s\S]+pandit_registration_numbers/);
  assert.match(successorMigration, /1001000156/);
  assert.match(successorMigration, /DO NOTHING/);
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
  assert.equal((routes.match(/isValidStoredProfilePhoto\(/g) || []).length >= 3, true);
  assert.match(routes, /A valid successfully uploaded profile photo is required before approval/);
  assert.match(routes, /expectedMime\[extension\] === file\.mimetype\.toLowerCase\(\)/);
  assert.match(photoValidator, /profilePhotoKind\(header\) === kind/);
  assert.match(photoValidator, /return profilePhotoKind\(bytes\) === match\[1\]/);
});

test("photo validation rejects spoofed stored files and mismatched data URL MIME", () => {
  const directory = mkdtempSync(path.join(os.tmpdir(), "pandit-photo-"));
  const png = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0]);
  try {
    writeFileSync(path.join(directory, "valid.png"), png);
    writeFileSync(path.join(directory, "spoofed.jpg"), png);
    writeFileSync(path.join(directory, "text.jpg"), "not an image");
    assert.equal(isValidStoredProfilePhoto("/uploads/valid.png", directory), true);
    assert.equal(isValidStoredProfilePhoto("/uploads/spoofed.jpg", directory), false);
    assert.equal(isValidStoredProfilePhoto("/uploads/text.jpg", directory), false);
    const encoded = png.toString("base64");
    assert.equal(isValidStoredProfilePhoto(`data:image/png;base64,${encoded}`, directory), true);
    assert.equal(isValidStoredProfilePhoto(`data:image/jpeg;base64,${encoded}`, directory), false);
    assert.equal(isValidStoredProfilePhoto("data:image/jpeg;base64,bm90IGFuIGltYWdl", directory), false);
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
});

test("admin APIs are protected and expose registration and location review data", () => {
  assert.match(routes, /"\/api\/admin\/pandits", adminAuthMiddleware/);
  assert.match(routes, /\/\^\\d\{10\}\$\/\.test\(search\) \? eq\(pandits\.registrationNo, search\)/);
  assert.match(routes, /"\/api\/admin\/pandit-city-requests", adminAuthMiddleware/);
  assert.match(routes, /cityRequest:/);
  assert.match(routes, /Invalid location request resolution/);
});