// Daily renewal-reminder sweep for paid pandit tiers. Sends three emails
// per active membership: T-14d, T-3d, day-of-expiry. Each stage is
// recorded on `pandit_membership_purchases.last_reminder_stage` so a
// re-run of the sweep never double-sends.
//
// Wired into server/index.ts as a once-per-24h scheduler with a small
// boot delay so app startup is not blocked.

import { and, eq, isNotNull, lte, gte, desc } from "drizzle-orm";
import { db } from "./db";
import { panditMembershipPurchases, pandits } from "@shared/schema";
import { sendEmailAsync, buildPanditMembershipExpiringEmail } from "./email";

type Stage = "14d" | "3d" | "expired";

function computeStage(expiresAt: Date, now: Date): Stage | null {
  const ms = expiresAt.getTime() - now.getTime();
  const days = ms / (24 * 60 * 60 * 1000);
  if (days <= 0 && days > -2) return "expired";       // day-of (and one day after, in case sweep was missed)
  if (days > 0 && days <= 3) return "3d";
  if (days > 3 && days <= 14) return "14d";
  return null;
}

const STAGE_ORDER: Record<Stage, number> = { "14d": 1, "3d": 2, "expired": 3 };

export async function runMembershipReminderSweep(): Promise<{ sent: number; skipped: number }> {
  const now = new Date();
  // Only consider paid memberships expiring within the next 14 days OR
  // up to 1 day past expiry (catches overnight gap).
  const upper = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000);
  const lower = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);

  const candidates = await db.select()
    .from(panditMembershipPurchases)
    .where(and(
      eq(panditMembershipPurchases.paymentStatus, "paid"),
      isNotNull(panditMembershipPurchases.expiresAt),
      lte(panditMembershipPurchases.expiresAt, upper),
      gte(panditMembershipPurchases.expiresAt, lower),
    ));

  let sent = 0;
  let skipped = 0;

  // Group by pandit so we only act on the LATEST paid purchase per pandit
  // (older ones become moot once the pandit renews).
  const latestByPandit = new Map<number, typeof candidates[number]>();
  for (const p of candidates) {
    const existing = latestByPandit.get(p.panditId);
    const expiresAt = p.expiresAt ? new Date(p.expiresAt as any).getTime() : 0;
    const existingExpires = existing?.expiresAt ? new Date(existing.expiresAt as any).getTime() : 0;
    if (!existing || expiresAt > existingExpires) latestByPandit.set(p.panditId, p);
  }

  for (const purchase of Array.from(latestByPandit.values())) {
    if (!purchase.expiresAt) continue;
    const stage = computeStage(new Date(purchase.expiresAt as any), now);
    if (!stage) { skipped++; continue; }

    const lastStage = (purchase.lastReminderStage || null) as Stage | null;
    if (lastStage && STAGE_ORDER[lastStage] >= STAGE_ORDER[stage]) {
      skipped++;
      continue;
    }

    // Look up pandit email + name (best-effort — skip if no email on file).
    const [pandit] = await db.select().from(pandits).where(eq(pandits.id, purchase.panditId)).limit(1);
    if (!pandit?.email) { skipped++; continue; }

    sendEmailAsync(buildPanditMembershipExpiringEmail({
      to: pandit.email,
      panditName: pandit.name || "Pandit ji",
      tier: purchase.toTier,
      expiresAt: new Date(purchase.expiresAt as any),
      stage,
      priceInr: purchase.amount,
    }), "pandit-membership-reminder");

    await db.update(panditMembershipPurchases)
      .set({ lastReminderAt: now, lastReminderStage: stage })
      .where(eq(panditMembershipPurchases.id, purchase.id));
    sent++;
  }

  return { sent, skipped };
}
