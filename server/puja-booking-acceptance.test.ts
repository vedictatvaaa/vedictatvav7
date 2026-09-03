import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";

test("acceptance serializes booking and uniquely records contact release and events", async () => {
  const source = await readFile(new URL("./pandit-portal.ts", import.meta.url), "utf8");
  const migration = await readFile(new URL("../migrations/0015_puja_booking_operations.sql", import.meta.url), "utf8");
  assert.match(source, /select \* from puja_bookings where id = \$\{id\} for update/);
  assert.match(source, /db\.transaction/);
  assert.match(migration, /puja_booking_contact_releases_booking_unique/);
  assert.match(migration, /puja_booking_events_event_key_unique/);
});