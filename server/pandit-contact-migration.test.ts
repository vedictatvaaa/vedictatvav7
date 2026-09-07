import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

test("protected contact migration keeps required default and lookup constraints", () => {
  const migration = readFileSync(new URL("../migrations/0022_pandit_protected_contacts.sql", import.meta.url), "utf8");
  assert.match(migration, /pandit_contact_mode" text NOT NULL DEFAULT 'login_required'/);
  assert.match(migration, /contact_access_override" text NOT NULL DEFAULT 'use_global'/);
  assert.match(migration, /user_id" integer NOT NULL REFERENCES "users"/);
  assert.match(migration, /pandit_id" integer NOT NULL REFERENCES "pandits"/);
  assert.match(migration, /UNIQUE INDEX IF NOT EXISTS "pandit_contact_reveals_user_pandit_unique"[\s\S]*\("user_id", "pandit_id"\)/);
  assert.match(migration, /INDEX IF NOT EXISTS "pandit_contact_reveals_user_revealed_idx"[\s\S]*\("user_id", "revealed_at"\)/);
});