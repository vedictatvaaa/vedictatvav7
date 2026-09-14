import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("onboarding migration stores location consent and performs the directory-only rollout", () => {
  const migration = readFileSync(new URL("../migrations/0036_pandit_onboarding_requirements.sql", import.meta.url), "utf8");
  assert.match(migration, /registered_address/);
  assert.match(migration, /location_permission_granted/);
  assert.match(migration, /latitude/);
  assert.match(migration, /longitude/);
  assert.match(migration, /directory_visible" = true/);
  assert.match(migration, /search_eligible" = true/);
  assert.match(migration, /account_status" NOT IN \('banned', 'suspended'\)/);
  assert.doesNotMatch(migration, /booking_enabled"\s*=\s*true/);
});