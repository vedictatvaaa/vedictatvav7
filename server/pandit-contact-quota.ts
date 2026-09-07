import { and, eq, gte, sql } from "drizzle-orm";
import { db } from "./db";
import { panditContactReveals } from "@shared/schema";
import { contactQuotaMetadata, PANDIT_CONTACT_ALLOWANCE } from "./pandit-contact-policy";

async function quotaState(executor: any, userId: number, now: Date) {
  const windowStart = new Date(now);
  windowStart.setFullYear(windowStart.getFullYear() - 1);
  const where = and(eq(panditContactReveals.userId, userId), gte(panditContactReveals.revealedAt, windowStart));
  const count = await executor.select({ used: sql<number>`count(*)::int` }).from(panditContactReveals).where(where);
  const earliest = await executor.select({ revealedAt: panditContactReveals.revealedAt }).from(panditContactReveals)
    .where(where).orderBy(panditContactReveals.revealedAt).limit(1);
  return contactQuotaMetadata(Number(count[0]?.used || 0), earliest[0]?.revealedAt, now);
}

export async function getPanditContactQuota(userId: number, now = new Date()) {
  return quotaState(db, userId, now);
}

export type ContactQuotaClaim = {
  kind: "revealed" | "repeat" | "exhausted";
  quota: ReturnType<typeof contactQuotaMetadata>;
};

/**
 * Claims a contact reveal without allowing concurrent requests for the same
 * customer to overspend the rolling allowance. The unique index remains the
 * database-level duplicate guard if another writer bypasses this path.
 */
export async function claimPanditContactQuota(userId: number, panditId: number, now = new Date()): Promise<ContactQuotaClaim> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    const existing = await tx.select({ id: panditContactReveals.id }).from(panditContactReveals)
      .where(and(eq(panditContactReveals.userId, userId), eq(panditContactReveals.panditId, panditId))).limit(1);
    if (existing.length) return { kind: "repeat" as const, quota: await quotaState(tx, userId, now) };

    const before = await quotaState(tx, userId, now);
    if (before.used >= PANDIT_CONTACT_ALLOWANCE) return { kind: "exhausted" as const, quota: before };

    await tx.insert(panditContactReveals).values({ userId, panditId });
    return { kind: "revealed" as const, quota: await quotaState(tx, userId, now) };
  });
}