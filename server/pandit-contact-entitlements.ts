import { and, desc, eq, gte, inArray, sql } from "drizzle-orm";
import { db } from "./db";
import {
  panditContactEntitlementEvents,
  panditContactUnlockPurchases,
} from "@shared/schema";
import {
  contactQuotaMetadata,
  DEFAULT_PANDIT_CONTACT_UNLOCK_PRICE_PAISE,
  PANDIT_CONTACT_ALLOWANCE,
  PANDIT_CONTACT_WINDOW_DAYS,
} from "./pandit-contact-policy";

const windowStartFor = (now: Date, resetAt?: Date | null) => {
  const natural = new Date(now.getTime() - PANDIT_CONTACT_WINDOW_DAYS * 24 * 60 * 60 * 1000);
  return resetAt && resetAt.getTime() > natural.getTime() ? resetAt : natural;
};

async function latestReset(executor: any, userId: number) {
  const rows = await executor.select({ eventTime: panditContactEntitlementEvents.eventTime })
    .from(panditContactEntitlementEvents)
    .where(and(
      eq(panditContactEntitlementEvents.userId, userId),
      eq(panditContactEntitlementEvents.eventType, "booking_reset"),
    ))
    .orderBy(desc(panditContactEntitlementEvents.eventTime)).limit(1);
  return rows[0]?.eventTime ? new Date(rows[0].eventTime) : null;
}

async function quotaState(executor: any, userId: number, now: Date) {
  const resetAt = await latestReset(executor, userId);
  const start = windowStartFor(now, resetAt);
  const freeRows = await executor.select({ panditId: panditContactEntitlementEvents.panditId, eventTime: panditContactEntitlementEvents.eventTime })
    .from(panditContactEntitlementEvents)
    .where(and(
      eq(panditContactEntitlementEvents.userId, userId),
      eq(panditContactEntitlementEvents.eventType, "free_reveal"),
      gte(panditContactEntitlementEvents.eventTime, start),
    ))
    .orderBy(panditContactEntitlementEvents.eventTime);
  const uniquePandits = new Set(freeRows.map((row: any) => row.panditId).filter((id: unknown): id is number => Number.isInteger(id)));
  const metadata = contactQuotaMetadata(uniquePandits.size, freeRows[0]?.eventTime || null, now);
  if (resetAt && resetAt.getTime() > now.getTime() - PANDIT_CONTACT_WINDOW_DAYS * 24 * 60 * 60 * 1000) {
    metadata.resetsAt = new Date(start.getTime() + PANDIT_CONTACT_WINDOW_DAYS * 24 * 60 * 60 * 1000).toISOString();
  }
  return {
    ...metadata,
    windowStartedAt: start.toISOString(),
    resetAt: resetAt?.toISOString() || null,
    windowSource: resetAt && resetAt.getTime() > now.getTime() - PANDIT_CONTACT_WINDOW_DAYS * 24 * 60 * 60 * 1000
      ? "booking_reset" as const : "rolling" as const,
  };
}

export async function getPanditContactQuota(userId: number, now = new Date()) {
  return quotaState(db, userId, now);
}

export async function hasPanditContactEntitlement(userId: number, panditId: number, now = new Date()) {
  const resetAt = await latestReset(db, userId);
  const start = windowStartFor(now, resetAt);
  const free = await db.select({ id: panditContactEntitlementEvents.id })
    .from(panditContactEntitlementEvents)
    .where(and(
      eq(panditContactEntitlementEvents.userId, userId),
      eq(panditContactEntitlementEvents.panditId, panditId),
      eq(panditContactEntitlementEvents.eventType, "free_reveal"),
      gte(panditContactEntitlementEvents.eventTime, start),
    )).limit(1);
  if (free.length) return true;
  const paid = await db.select({ id: panditContactEntitlementEvents.id })
    .from(panditContactEntitlementEvents)
    .innerJoin(panditContactUnlockPurchases, eq(panditContactUnlockPurchases.id, panditContactEntitlementEvents.sourcePurchaseId))
    .where(and(
      eq(panditContactEntitlementEvents.userId, userId),
      eq(panditContactEntitlementEvents.panditId, panditId),
      eq(panditContactEntitlementEvents.eventType, "paid_reveal"),
      gte(panditContactEntitlementEvents.eventTime, start),
      inArray(panditContactUnlockPurchases.status, ["paid"]),
    )).limit(1);
  return paid.length > 0;
}

export type ContactQuotaClaim = {
  kind: "revealed" | "repeat" | "exhausted";
  quota: Awaited<ReturnType<typeof getPanditContactQuota>>;
};

export async function claimPanditContactQuota(userId: number, panditId: number, now = new Date()): Promise<ContactQuotaClaim> {
  return db.transaction(async (tx) => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    if (await hasEntitlementWithExecutor(tx, userId, panditId, now)) {
      return { kind: "repeat" as const, quota: await quotaState(tx, userId, now) };
    }
    const before = await quotaState(tx, userId, now);
    if (before.used >= PANDIT_CONTACT_ALLOWANCE) return { kind: "exhausted" as const, quota: before };
    await tx.insert(panditContactEntitlementEvents).values({
      userId, panditId, eventType: "free_reveal", eventTime: now,
    });
    return { kind: "revealed" as const, quota: await quotaState(tx, userId, now) };
  });
}

async function hasEntitlementWithExecutor(executor: any, userId: number, panditId: number, now: Date) {
  const resetAt = await latestReset(executor, userId);
  const start = windowStartFor(now, resetAt);
  const free = await executor.select({ id: panditContactEntitlementEvents.id })
    .from(panditContactEntitlementEvents)
    .where(and(eq(panditContactEntitlementEvents.userId, userId), eq(panditContactEntitlementEvents.panditId, panditId),
      eq(panditContactEntitlementEvents.eventType, "free_reveal"), gte(panditContactEntitlementEvents.eventTime, start))).limit(1);
  if (free.length) return true;
  const paid = await executor.select({ id: panditContactEntitlementEvents.id })
    .from(panditContactEntitlementEvents)
    .innerJoin(panditContactUnlockPurchases, eq(panditContactUnlockPurchases.id, panditContactEntitlementEvents.sourcePurchaseId))
    .where(and(eq(panditContactEntitlementEvents.userId, userId), eq(panditContactEntitlementEvents.panditId, panditId),
      eq(panditContactEntitlementEvents.eventType, "paid_reveal"), gte(panditContactEntitlementEvents.eventTime, start),
      inArray(panditContactUnlockPurchases.status, ["paid"]))).limit(1);
  return paid.length > 0;
}

export async function createContactUnlockPurchase(
  userId: number, panditId: number, amountPaise: number, razorpayOrderId: string, now = new Date(),
) {
  const expiresAt = new Date(now.getTime() + 20 * 60 * 1000);
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    if (await hasEntitlementWithExecutor(tx, userId, panditId, now)) return { existingEntitlement: true as const };
    const pending = await tx.select().from(panditContactUnlockPurchases).where(and(
      eq(panditContactUnlockPurchases.userId, userId), eq(panditContactUnlockPurchases.panditId, panditId),
      eq(panditContactUnlockPurchases.status, "pending"), gte(panditContactUnlockPurchases.expiresAt, now),
    )).orderBy(desc(panditContactUnlockPurchases.createdAt)).limit(1);
    if (pending.length) return { purchase: pending[0], existingEntitlement: false as const };
    const [purchase] = await tx.insert(panditContactUnlockPurchases).values({
      userId, panditId, amountPaise, currency: "INR", razorpayOrderId, expiresAt,
    }).returning();
    return { purchase, existingEntitlement: false as const };
  });
}

export async function verifyContactUnlockPurchase(
  purchaseId: number, userId: number, paymentId: string, now = new Date(),
) {
  return db.transaction(async tx => {
    await tx.execute(sql`select pg_advisory_xact_lock(${userId})`);
    const rows = await tx.select().from(panditContactUnlockPurchases)
      .where(eq(panditContactUnlockPurchases.id, purchaseId)).limit(1);
    const purchase = rows[0];
    if (!purchase || purchase.userId !== userId) return null;
    if (purchase.status === "refunded" || purchase.expiresAt < now) return null;
    if (purchase.status === "paid") {
      return purchase.razorpayPaymentId === paymentId ? purchase : null;
    }
    const [updated] = await tx.update(panditContactUnlockPurchases).set({
      status: "paid", razorpayPaymentId: paymentId, paidAt: now,
    }).where(and(eq(panditContactUnlockPurchases.id, purchaseId), eq(panditContactUnlockPurchases.status, "pending"))).returning();
    if (!updated) return null;
    await tx.insert(panditContactEntitlementEvents).values({
      userId: updated.userId, panditId: updated.panditId, eventType: "paid_reveal",
      sourcePurchaseId: updated.id, eventTime: now, amountPaise: updated.amountPaise, currency: updated.currency,
    }).onConflictDoNothing();
    return updated;
  });
}

export async function recordBookingContactResetInTransaction(
  executor: any,
  userId: number,
  bookingId: number,
  now = new Date(),
) {
  await executor.execute(sql`select pg_advisory_xact_lock(${userId})`);
  const [row] = await executor.insert(panditContactEntitlementEvents).values({
    userId, eventType: "booking_reset", sourceBookingId: bookingId, eventTime: now,
  }).onConflictDoNothing().returning();
  return row || null;
}

export async function recordBookingContactReset(userId: number, bookingId: number, now = new Date()) {
  return db.transaction((tx) => recordBookingContactResetInTransaction(tx, userId, bookingId, now));
}

export async function revokeContactUnlockByPaymentId(paymentId: string, now = new Date()) {
  const [purchase] = await db.update(panditContactUnlockPurchases).set({ status: "refunded", revokedAt: now })
    .where(eq(panditContactUnlockPurchases.razorpayPaymentId, paymentId)).returning();
  return purchase || null;
}

export const contactUnlockPrice = (value: unknown): number | null => {
  if (value === undefined || value === null) return DEFAULT_PANDIT_CONTACT_UNLOCK_PRICE_PAISE;
  const amount = Number(value);
  return Number.isInteger(amount) && amount >= 100 && amount <= 1_000_000 ? amount : null;
};