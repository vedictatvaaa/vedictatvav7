import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("governance migration is fail-closed for new Pandits and preserves eligible live rows", () => {
  const migration = readFileSync(new URL("../migrations/0024_pandit_directory_governance.sql", import.meta.url), "utf8");
  assert.match(migration, /directory_visible" boolean NOT NULL DEFAULT false/);
  assert.match(migration, /search_eligible" boolean NOT NULL DEFAULT false/);
  assert.match(migration, /booking_enabled" boolean NOT NULL DEFAULT false/);
  assert.match(migration, /archived" boolean NOT NULL DEFAULT false/);
  assert.match(migration, /UPDATE "pandits"[\s\S]*SET "directory_visible" = true,[\s\S]*"search_eligible" = true,[\s\S]*"booking_enabled" = \(/);
  assert.match(migration, /EXISTS \([\s\S]*FROM "pandit_services"[\s\S]*JOIN "master_services"/);
  assert.match(migration, /NOT EXISTS \([\s\S]*FROM "admin_audit_logs"[\s\S]*pandit_governance/);
  assert.match(migration, /CHECK \("indexing_mode" IN \('auto', 'noindex'\)\)/);
});