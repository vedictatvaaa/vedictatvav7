import test from "node:test";
import assert from "node:assert/strict";
import { and, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { panditContactReveals, pandits, users } from "@shared/schema";
import { claimPanditContactQuota, getPanditContactQuota } from "./pandit-contact-quota";

// 0022 has FKs, so these tests create and remove their own parent rows rather
// than relying on unsafe orphaned high-range IDs.
const enabled = Boolean(process.env.DATABASE_URL);
const integration = enabled ? test : test.skip;

integration("Postgres quota claims are repeat-safe and capacity-safe", async () => {
  const base = 900_000_000 + (Date.now() % 10_000_000);
  const userId = base;
  const concurrentUserId = base + 100;
  const panditIds = Array.from({ length: 12 }, (_, index) => base + index + 1);
  try {
    await db.execute(sql.raw(`insert into users (id, name, email) overriding system value values (${userId}, 'Contact quota integration', 'contact-quota-${userId}@example.invalid')`));
    for (const panditId of panditIds) {
      await db.execute(sql.raw(`insert into pandits (id, name, city, specialization, languages, experience, fees) overriding system value values (${panditId}, 'Contact quota integration', 'Test City', 'Test', 'en', 1, 1)`));
    }

    assert.equal((await claimPanditContactQuota(userId, panditIds[0])).kind, "revealed");
    assert.equal((await claimPanditContactQuota(userId, panditIds[0])).kind, "repeat");
    const firstQuota = await getPanditContactQuota(userId);
    assert.equal(firstQuota.used, 1);
    assert.equal(firstQuota.remaining, 9);
    assert.ok(firstQuota.resetsAt);

    for (const panditId of panditIds.slice(1, 10)) assert.equal((await claimPanditContactQuota(userId, panditId)).kind, "revealed");
    assert.equal((await getPanditContactQuota(userId)).used, 10);
    assert.equal((await claimPanditContactQuota(userId, panditIds[10])).kind, "exhausted");

    // A separate customer at nine claims races two distinct Pandits: exactly
    // one transaction may consume the last slot.
    await db.execute(sql.raw(`insert into users (id, name, email) overriding system value values (${concurrentUserId}, 'Contact quota concurrent', 'contact-quota-concurrent-${userId}@example.invalid')`));
    for (const panditId of panditIds.slice(0, 9)) await claimPanditContactQuota(concurrentUserId, panditId);
    const concurrent = await Promise.all([
      claimPanditContactQuota(concurrentUserId, panditIds[9]),
      claimPanditContactQuota(concurrentUserId, panditIds[10]),
    ]);
    assert.deepEqual(concurrent.map(result => result.kind).sort(), ["exhausted", "revealed"]);
    assert.equal((await getPanditContactQuota(concurrentUserId)).used, 10);
  } finally {
    await db.delete(panditContactReveals).where(eq(panditContactReveals.userId, concurrentUserId));
    await db.delete(users).where(eq(users.id, concurrentUserId));
    await db.delete(panditContactReveals).where(eq(panditContactReveals.userId, userId));
    await db.delete(pandits).where(and(...panditIds.map(id => eq(pandits.id, id))));
    await db.delete(users).where(eq(users.id, userId));
  }
});