import assert from "node:assert/strict";
import test from "node:test";
import { sql } from "drizzle-orm";
import { db } from "./db";
import { clearPanditLiveMetricsCache, getPanditLiveMetrics } from "./pandit-live-metrics";

const integration = process.env.DATABASE_URL ? test : test.skip;

integration("live metric aggregates follow booking lifecycle and enrolled-account definitions", async () => {
  const base = 950_000_000 + (Date.now() % 10_000_000);
  const bookingIds = [base + 1, base + 2, base + 3, base + 4, base + 5];
  const panditIds = [base + 11, base + 12, base + 13, base + 14];
  try {
    clearPanditLiveMetricsCache();
    const before = await getPanditLiveMetrics();

    // Three qualifying rows: one completed devotee, one in-progress devotee,
    // and a second pending row for the completed devotee. Cancelled and test
    // lifecycle values must not inflate any public aggregate.
    await db.execute(sql`
      insert into puja_bookings
        (id, user_id, pandit_id, puja_type, mode, date, time_slot, contact_name, contact_phone, status, total_amount, created_at, completed_at)
      overriding system value values
        (${bookingIds[0]}, ${base + 101}, ${panditIds[0]}, 'metrics-completed', 'online', current_date::text, '10:00', 'Metrics Test', '0000000000', 'completed', 1, now(), now()),
        (${bookingIds[1]}, ${base + 102}, ${panditIds[1]}, 'metrics-serving', 'online', current_date::text, '10:00', 'Metrics Test', '0000000000', 'in_progress', 1, now(), null),
        (${bookingIds[2]}, ${base + 101}, ${panditIds[0]}, 'metrics-pending', 'online', current_date::text, '10:00', 'Metrics Test', '0000000000', 'pending', 1, now(), null),
        (${bookingIds[3]}, ${base + 103}, ${panditIds[2]}, 'metrics-cancelled', 'online', current_date::text, '10:00', 'Metrics Test', '0000000000', 'cancelled', 1, now(), null),
        (${bookingIds[4]}, ${base + 104}, ${panditIds[3]}, 'metrics-test', 'online', current_date::text, '10:00', 'Metrics Test', '0000000000', 'test', 1, now(), null)
    `);
    await db.execute(sql`
      insert into pandits
        (id, name, city, specialization, languages, experience, fees, verified, account_status, archived)
      overriding system value values
        (${panditIds[0]}, 'Metrics unverified', 'Metrics City', 'Test', 'en', 1, 1, false, 'active', false),
        (${panditIds[1]}, 'Metrics suspended', 'Metrics City', 'Test', 'en', 1, 1, false, 'suspended', false),
        (${panditIds[2]}, 'Metrics banned', 'Metrics City', 'Test', 'en', 1, 1, true, 'banned', false),
        (${panditIds[3]}, 'Metrics archived', 'Metrics City', 'Test', 'en', 1, 1, true, 'active', true)
    `);

    clearPanditLiveMetricsCache();
    const after = await getPanditLiveMetrics();
    assert.equal(after.metrics.servingNow.value! - before.metrics.servingNow.value!, 1);
    assert.equal(after.metrics.servedLast24h.value! - before.metrics.servedLast24h.value!, 2);
    assert.equal(after.metrics.pujasBooked.value! - before.metrics.pujasBooked.value!, 3);
    assert.equal(after.metrics.totalEnrolledPandits.value! - before.metrics.totalEnrolledPandits.value!, 3);
    // Presence is intentionally asserted in the pure failure-state test: an
    // integration worker may have received a heartbeat from another test
    // before this query, but it must still carry an explicit local scope.
    if (after.metrics.onlineNow.health === "available") {
      assert.equal(after.metrics.onlineNow.scope, "this_instance");
    }
  } finally {
    await db.execute(sql`delete from puja_bookings where id in (${sql.join(bookingIds.map(id => sql`${id}`), sql`, `)})`);
    await db.execute(sql`delete from pandits where id in (${sql.join(panditIds.map(id => sql`${id}`), sql`, `)})`);
    clearPanditLiveMetricsCache();
  }
});