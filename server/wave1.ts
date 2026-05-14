// Wave 1: Loyalty points, referrals, auto-reassign scheduler, live ops board
import type { Express, Request, Response } from "express";
import crypto from "crypto";
import { db } from "./db";
import { users, loyaltyTransactions, pujaBookings, products, orders } from "@shared/schema";
import { eq, desc, sql, and, gte, lt } from "drizzle-orm";
import { storage } from "./storage";
import { adminAuthMiddleware } from "./admin-auth";

// -------- Identity helper (matches existing client-trust + email verify pattern) --------
async function verifyUser(req: Request): Promise<number | null> {
  const uid = Number(req.query.uid || req.body?.uid || 0);
  const email = String(req.query.email || req.body?.email || "").toLowerCase().trim();
  if (!uid || !email) return null;
  const u = await storage.getUser(uid);
  if (!u || u.email.toLowerCase() !== email) return null;
  return uid;
}

// -------- Loyalty engine --------
const POINTS_PER_RUPEE = 0.01; // 1 point per ₹100 spent
const REDEMPTION_RATE = 1; // 1 point = ₹1
const REDEMPTION_MAX_PCT = 0.20; // up to 20% of order
const REFERRAL_BONUS_POINTS = 50;

export async function awardPoints(userId: number, amountInr: number, reason: string, refType: string, refId: string | number) {
  if (!userId || amountInr <= 0) return 0;
  const points = Math.floor(amountInr * POINTS_PER_RUPEE);
  if (points <= 0) return 0;
  const u = await storage.getUser(userId);
  if (!u) return 0;
  const newBal = (u.loyaltyPoints || 0) + points;
  await db.update(users).set({ loyaltyPoints: newBal }).where(eq(users.id, userId));
  await db.insert(loyaltyTransactions).values({
    userId, delta: points, reason, refType, refId: String(refId), balanceAfter: newBal,
    note: `Earned ${points} points on ₹${amountInr}`,
  });
  // Referral bonus: if this user was referred and hasn't paid out yet, credit referrer
  if (u.referredByUserId && !u.referralBonusPaid) {
    const ref = await storage.getUser(u.referredByUserId);
    if (ref) {
      const refBal = (ref.loyaltyPoints || 0) + REFERRAL_BONUS_POINTS;
      await db.update(users).set({ loyaltyPoints: refBal }).where(eq(users.id, ref.id));
      await db.insert(loyaltyTransactions).values({
        userId: ref.id, delta: REFERRAL_BONUS_POINTS, reason: "referral_bonus",
        refType: "user", refId: String(u.id), balanceAfter: refBal,
        note: `${u.name} (your referral) made first qualifying purchase`,
      });
      await db.update(users).set({ referralBonusPaid: true }).where(eq(users.id, u.id));
    }
  }
  return points;
}

export async function redeemPoints(userId: number, requestedPoints: number, orderTotalInr: number, refId: string | number) {
  if (!userId || requestedPoints <= 0) return { applied: 0, discountInr: 0 };
  const maxByPct = Math.floor(orderTotalInr * REDEMPTION_MAX_PCT);
  const cap = Math.min(requestedPoints, maxByPct);
  if (cap <= 0) return { applied: 0, discountInr: 0 };
  // Atomic conditional update — only deducts if current balance >= cap, prevents race
  const updated = await db
    .update(users)
    .set({ loyaltyPoints: sql`${users.loyaltyPoints} - ${cap}` })
    .where(and(eq(users.id, userId), gte(users.loyaltyPoints, cap)))
    .returning({ newBalance: users.loyaltyPoints });
  if (updated.length === 0) {
    // Either user missing or insufficient balance for full `cap` — try a smaller fallback equal to current balance
    const u = await storage.getUser(userId);
    if (!u) return { applied: 0, discountInr: 0 };
    const fallback = Math.min(cap, u.loyaltyPoints || 0);
    if (fallback <= 0) return { applied: 0, discountInr: 0 };
    const retry = await db
      .update(users)
      .set({ loyaltyPoints: sql`${users.loyaltyPoints} - ${fallback}` })
      .where(and(eq(users.id, userId), gte(users.loyaltyPoints, fallback)))
      .returning({ newBalance: users.loyaltyPoints });
    if (retry.length === 0) return { applied: 0, discountInr: 0 };
    await db.insert(loyaltyTransactions).values({
      userId, delta: -fallback, reason: "redeemed_at_checkout",
      refType: "order", refId: String(refId), balanceAfter: retry[0].newBalance,
      note: `Redeemed ${fallback} points for \u20B9${fallback} off`,
    });
    return { applied: fallback, discountInr: fallback * REDEMPTION_RATE };
  }
  await db.insert(loyaltyTransactions).values({
    userId, delta: -cap, reason: "redeemed_at_checkout",
    refType: "order", refId: String(refId), balanceAfter: updated[0].newBalance,
    note: `Redeemed ${cap} points for \u20B9${cap} off`,
  });
  return { applied: cap, discountInr: cap * REDEMPTION_RATE };
}

// -------- Referral code generator --------
function makeReferralCode(name: string): string {
  const slug = (name || "VT").replace(/[^A-Za-z]/g, "").slice(0, 4).toUpperCase().padEnd(4, "X");
  const rand = crypto.randomBytes(2).toString("hex").toUpperCase();
  return `${slug}${rand}`;
}

export async function ensureReferralCode(userId: number): Promise<string> {
  const u = await storage.getUser(userId);
  if (!u) return "";
  if (u.referralCode) return u.referralCode;
  for (let i = 0; i < 5; i++) {
    const code = makeReferralCode(u.name);
    try {
      await db.update(users).set({ referralCode: code }).where(eq(users.id, userId));
      return code;
    } catch { /* unique collision, retry */ }
  }
  return "";
}

// -------- Auto-reassign scheduler --------
const REASSIGN_AFTER_MIN = 30;
async function flagOverdueBookings() {
  const cutoff = new Date(Date.now() - REASSIGN_AFTER_MIN * 60 * 1000);
  try {
    const result = await db.update(pujaBookings)
      .set({ needsReassignment: true, reassignmentFlaggedAt: new Date() })
      .where(and(
        eq(pujaBookings.status, "pending"),
        eq(pujaBookings.needsReassignment, false),
        lt(pujaBookings.createdAt, cutoff)
      ))
      .returning({ id: pujaBookings.id });
    if (result.length > 0) {
      console.log(`[wave1] Flagged ${result.length} overdue booking(s) for reassignment:`, result.map(r => r.id).join(","));
    }
  } catch (e: any) {
    console.warn("[wave1] flag-overdue error:", e?.message);
  }
}

export function startWave1Scheduler() {
  // Initial run after 30s; then every 5 min
  setTimeout(flagOverdueBookings, 30_000);
  setInterval(flagOverdueBookings, 5 * 60 * 1000);
  console.log("[wave1] Auto-reassign scheduler started (every 5 min)");
}

// -------- Routes --------
export function registerWave1Routes(app: Express) {
  // ===== Loyalty =====
  app.get("/api/loyalty/balance/:userId", async (req, res) => {
    try {
      const uid = await verifyUser(req);
      if (!uid || uid !== Number(req.params.userId)) return res.status(403).json({ error: "Identity check failed" });
      const u = await storage.getUser(uid);
      const txns = await db.select().from(loyaltyTransactions).where(eq(loyaltyTransactions.userId, uid)).orderBy(desc(loyaltyTransactions.id)).limit(50);
      res.json({
        balance: u?.loyaltyPoints || 0,
        worth: `₹${u?.loyaltyPoints || 0}`,
        rateInfo: { earnRate: "1 point per ₹100 spent", redemptionRate: "1 point = ₹1 off", maxPerOrder: "Up to 20% off" },
        recentTransactions: txns,
      });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ===== Referrals =====
  app.get("/api/referrals/me/:userId", async (req, res) => {
    try {
      const uid = await verifyUser(req);
      if (!uid || uid !== Number(req.params.userId)) return res.status(403).json({ error: "Identity check failed" });
      const code = await ensureReferralCode(uid);
      const referredUsers = await db.select({ id: users.id, name: users.name, joinedAt: sql<Date>`null`, bonusPaid: users.referralBonusPaid }).from(users).where(eq(users.referredByUserId, uid));
      const bonusEarned = referredUsers.filter((u: any) => u.bonusPaid).length * REFERRAL_BONUS_POINTS;
      const siteUrl = (process.env.PUBLIC_SITE_URL || `${req.protocol}://${req.get("host")}`).replace(/\/$/, "");
      res.json({
        code,
        shareUrl: `${siteUrl}/?ref=${code}`,
        totalReferred: referredUsers.length,
        bonusEarned,
        bonusPerReferral: REFERRAL_BONUS_POINTS,
        referredUsers,
      });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/referrals/apply", async (req, res) => {
    try {
      const { newUserId, code } = req.body || {};
      if (!newUserId || !code) return res.status(400).json({ error: "newUserId and code required" });
      const newUser = await storage.getUser(Number(newUserId));
      if (!newUser) return res.status(404).json({ error: "User not found" });
      if (newUser.referredByUserId) return res.json({ ok: true, message: "Already credited" });
      const refRows = await db.select().from(users).where(eq(users.referralCode, String(code).trim().toUpperCase())).limit(1);
      if (!refRows.length) return res.status(404).json({ error: "Invalid referral code" });
      if (refRows[0].id === newUser.id) return res.status(400).json({ error: "Cannot refer yourself" });
      await db.update(users).set({ referredByUserId: refRows[0].id }).where(eq(users.id, newUser.id));
      res.json({ ok: true, referrer: refRows[0].name });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ===== Live Ops (admin only) =====
  app.get("/api/admin/live-ops", adminAuthMiddleware, async (_req, res) => {
    try {
      const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const today = new Date(); today.setHours(0, 0, 0, 0);

      const [needsReassignRows, todayOnlinePujas, lowStock, recentOrders, pendingPandits] = await Promise.all([
        db.select().from(pujaBookings).where(eq(pujaBookings.needsReassignment, true)).orderBy(desc(pujaBookings.id)).limit(25),
        db.select().from(pujaBookings).where(and(
          eq(pujaBookings.mode, "online"),
          eq(pujaBookings.status, "accepted"),
          gte(pujaBookings.date, today.toISOString().slice(0, 10))
        )).orderBy(pujaBookings.date).limit(25),
        db.select().from(products).where(lt(products.stock, 10)).limit(25),
        db.select().from(orders).where(gte(orders.createdAt, dayAgo)).orderBy(desc(orders.id)).limit(20),
        db.select().from(pujaBookings).where(eq(pujaBookings.status, "pending")).orderBy(desc(pujaBookings.id)).limit(15),
      ]);

      res.json({
        needsReassignment: needsReassignRows,
        liveOnlinePujas: todayOnlinePujas,
        lowStockProducts: lowStock,
        recentOrders,
        pendingBookings: pendingPandits,
        stats: {
          flaggedCount: needsReassignRows.length,
          liveCallsCount: todayOnlinePujas.length,
          lowStockCount: lowStock.length,
          last24hOrders: recentOrders.length,
          pendingBookingsCount: pendingPandits.length,
        },
      });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // Admin: clear pandit assignment so booking is reopened to other pandits
  app.post("/api/admin/live-ops/reassign/:bookingId", adminAuthMiddleware, async (req, res) => {
    try {
      const id = Number(req.params.bookingId);
      await db.update(pujaBookings).set({
        panditId: null, status: "pending",
        needsReassignment: false, reassignmentFlaggedAt: null,
      }).where(eq(pujaBookings.id, id));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });
}
