// AstroTalk-style real-time astrologer marketplace.
// Wallet, recharge, per-minute consultation sessions, polling chat,
// astrologer portal (login + online toggle + inbox + earnings), free-first-chat.
//
// Voice/video is intentionally deferred — needs Exotel/Twilio creds.
// Persistence model:
//   * Wallet balances + ledger live in user_wallets / wallet_transactions.
//   * Sessions live in astrologer_sessions; messages in session_messages.
//   * A 30-second cron tick deducts per-minute charges from active sessions
//     and auto-ends them at zero balance (with a 30s grace).

import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { z } from "zod";
import Razorpay from "razorpay";
import { db } from "./db";
import {
  astrologers,
  astrologerPortalSessions,
  userWallets,
  walletTransactions,
  astrologerSessions,
  sessionMessages,
  sessionRatings,
  freeChatGrants,
} from "@shared/schema";
import { and, desc, eq, gt, gte, sql } from "drizzle-orm";

const SESSION_TTL_DAYS = 30;
const HEARTBEAT_TTL_MS = 5 * 60 * 1000;
const MIN_RECHARGE_PAISE = 5000;       // ₹50 min
const MAX_RECHARGE_PAISE = 5000000;    // ₹50,000 max
const ZERO_BALANCE_GRACE_SEC = 30;
const SESSION_TIMEOUT_WAITING_MS = 5 * 60 * 1000;

// In-memory heartbeat for astrologer "online now" — same pattern as pandit-portal.
const heartbeats = new Map<number, number>();
function markAstrologerSeen(id: number) { heartbeats.set(id, Date.now()); }
export function isAstrologerOnline(id: number): boolean {
  const t = heartbeats.get(id);
  return !!t && Date.now() - t < HEARTBEAT_TTL_MS;
}

interface AstrologerRequest extends Request { astrologerId?: number; }

async function validateAstrologerToken(token?: string): Promise<number | null> {
  if (!token) return null;
  const rows = await db.select().from(astrologerPortalSessions)
    .where(and(eq(astrologerPortalSessions.token, token), gt(astrologerPortalSessions.expiresAt, new Date())))
    .limit(1);
  return rows.length ? rows[0].astrologerId : null;
}

function astrologerAuthMiddleware(req: AstrologerRequest, res: Response, next: NextFunction) {
  const token = (req.headers["x-astrologer-token"] as string | undefined);
  validateAstrologerToken(token)
    .then(id => {
      if (!id) return res.status(401).json({ error: "Astrologer authentication required" });
      req.astrologerId = id;
      next();
    })
    .catch(() => res.status(500).json({ error: "Auth check failed" }));
}

// Identify the calling user. Reuses the same identity-email pattern the rest
// of the app uses (matches /api/my-bookings/:userId style). Production should
// upgrade this to bearer-token sessions; this preserves parity with the
// existing /api/auth/profile/:id and order-lookup patterns.
async function resolveUserId(req: Request): Promise<number | null> {
  const headerId = Number(req.headers["x-user-id"]);
  const bodyId = Number((req.body as any)?.userId);
  const id = Number.isFinite(headerId) && headerId > 0 ? headerId
           : Number.isFinite(bodyId) && bodyId > 0 ? bodyId
           : null;
  if (!id) return null;
  // Lightweight identity check — body/header email must match the user record's email.
  const claimedEmail = String(req.headers["x-user-email"] || (req.body as any)?.identityEmail || "").trim().toLowerCase();
  if (!claimedEmail) return null;
  const { users } = await import("@shared/schema");
  const rows = await db.select({ id: users.id, email: users.email }).from(users).where(eq(users.id, id)).limit(1);
  if (!rows.length) return null;
  if ((rows[0].email || "").trim().toLowerCase() !== claimedEmail) return null;
  return id;
}

function bonusForRecharge(amountPaise: number): number {
  if (amountPaise >= 200000) return Math.floor(amountPaise * 0.15); // ≥₹2000 → +15%
  if (amountPaise >= 100000) return Math.floor(amountPaise * 0.10); // ≥₹1000 → +10%
  if (amountPaise >= 50000)  return Math.floor(amountPaise * 0.05); // ≥₹500  → +5%
  return 0;
}

async function ensureWallet(userId: number): Promise<{ balancePaise: number; totalRechargedPaise: number; totalSpentPaise: number }> {
  const rows = await db.select().from(userWallets).where(eq(userWallets.userId, userId)).limit(1);
  if (rows.length) return rows[0];
  const [created] = await db.insert(userWallets).values({ userId }).returning();
  return created;
}

// Atomic wallet mutation. The UPDATE statement increments balance in a single
// SQL expression with an inline non-negative guard, so concurrent debits/credits
// never lose updates and never go below zero. The ledger insert lives in the
// same transaction so balance + ledger move together.
async function applyWalletDelta(
  userId: number,
  deltaPaise: number,
  kind: string,
  opts: { refType?: string; refId?: string; note?: string } = {},
) {
  return await db.transaction(async (tx) => {
    // Ensure wallet row exists (no-op if already present).
    await tx.insert(userWallets).values({ userId, balancePaise: 0 }).onConflictDoNothing();

    const isCredit = deltaPaise > 0;
    const isRechargeCredit = isCredit && (kind === "recharge" || kind === "bonus");
    const spendDelta = !isCredit ? Math.abs(deltaPaise) : 0;

    // Single-statement atomic update with non-negativity guard. If the row
    // wouldn't satisfy `balance + delta >= 0`, no rows return → insufficient.
    const updated = await tx.update(userWallets)
      .set({
        balancePaise: sql`${userWallets.balancePaise} + ${deltaPaise}`,
        totalRechargedPaise: isRechargeCredit
          ? sql`${userWallets.totalRechargedPaise} + ${deltaPaise}`
          : userWallets.totalRechargedPaise,
        totalSpentPaise: spendDelta > 0
          ? sql`${userWallets.totalSpentPaise} + ${spendDelta}`
          : userWallets.totalSpentPaise,
        updatedAt: new Date(),
      })
      .where(and(
        eq(userWallets.userId, userId),
        gte(sql`${userWallets.balancePaise} + ${deltaPaise}`, 0),
      ))
      .returning();

    if (!updated.length) throw new Error("INSUFFICIENT_BALANCE");
    const row = updated[0];
    await tx.insert(walletTransactions).values({
      userId,
      kind,
      amountPaise: deltaPaise,
      balanceAfterPaise: row.balancePaise,
      refType: opts.refType ?? null,
      refId: opts.refId ?? null,
      note: opts.note ?? null,
    });
    return row;
  });
}

function newToken() { return crypto.randomBytes(32).toString("hex"); }

// ---------- Per-minute deduction tick ----------
// Runs every 30s. For each ACTIVE session, computes elapsed paid minutes
// since lastTickAt, deducts wallet (consuming free minutes first), and
// auto-ends if the wallet hits zero (after a 30s grace).
// Single-writer finalize. Atomically flips status active→ended only once and
// returns the post-flip row; concurrent callers see no row and become no-ops.
// The astrologer aggregate is incremented from the FINAL session's recorded
// earnings, not a stale snapshot.
async function finalizeSession(sessionId: number, endedBy: string): Promise<boolean> {
  const ended = await db.update(astrologerSessions).set({
    status: "ended", endedAt: new Date(), endedBy,
  }).where(and(
    eq(astrologerSessions.id, sessionId),
    eq(astrologerSessions.status, "active"),
  )).returning();
  if (!ended.length) return false;
  const final = ended[0];
  await db.update(astrologers).set({
    totalEarningsPaise: sql`${astrologers.totalEarningsPaise} + ${final.astrologerEarningsPaise}`,
    totalSessions: sql`${astrologers.totalSessions} + 1`,
  }).where(eq(astrologers.id, final.astrologerId));
  return true;
}

async function runSessionTick() {
  const now = new Date();
  const active = await db.select().from(astrologerSessions).where(eq(astrologerSessions.status, "active"));
  for (const s of active) {
    try {
      const lastTick = s.lastTickAt ?? s.acceptedAt ?? s.startedAt ?? s.createdAt;
      const elapsedMs = now.getTime() - new Date(lastTick).getTime();
      if (elapsedMs < 60_000) continue; // wait for full minute boundary
      const minutesElapsed = Math.floor(elapsedMs / 60_000);

      // Use free minutes first.
      const freeRemaining = Math.max(0, s.freeMinutesGranted - s.freeMinutesUsed);
      const freeToUse = Math.min(freeRemaining, minutesElapsed);
      const paidMinutes = minutesElapsed - freeToUse;
      const chargePaise = paidMinutes * s.ratePaisePerMin;

      // Pull wallet.
      const wRows = await db.select().from(userWallets).where(eq(userWallets.userId, s.userId)).limit(1);
      const balance = wRows[0]?.balancePaise ?? 0;
      const canPay = Math.min(chargePaise, balance);
      const actualPaidMinutes = s.ratePaisePerMin > 0 ? Math.floor(canPay / s.ratePaisePerMin) : 0;
      const actualCharge = actualPaidMinutes * s.ratePaisePerMin;
      const actualMinutes = freeToUse + actualPaidMinutes;
      const advanceMs = actualMinutes * 60_000;
      const newLastTick = new Date(new Date(lastTick).getTime() + advanceMs);

      if (actualCharge > 0) {
        try {
          await applyWalletDelta(s.userId, -actualCharge, "session_debit", {
            refType: "session", refId: String(s.id), note: `Astro session #${s.id}`,
          });
        } catch (debitErr) {
          // Wallet went insufficient between our read and the debit — fall
          // through to the shouldEnd path; we don't double-bill.
          console.warn("[astro-tick] debit failed session", s.id, (debitErr as Error).message);
          continue;
        }
      }

      const willHaveBalance = (balance - actualCharge) >= s.ratePaisePerMin;
      const shouldEnd = !willHaveBalance && (chargePaise > actualCharge);

      // Atomically advance counters only if session is still active. Using
      // sql increments + status='active' guard so a concurrent end (user or
      // astrologer) is a no-op here.
      await db.update(astrologerSessions).set({
        freeMinutesUsed: sql`${astrologerSessions.freeMinutesUsed} + ${freeToUse}`,
        paidMinutes: sql`${astrologerSessions.paidMinutes} + ${actualPaidMinutes}`,
        amountChargedPaise: sql`${astrologerSessions.amountChargedPaise} + ${actualCharge}`,
        astrologerEarningsPaise: sql`${astrologerSessions.astrologerEarningsPaise} + ${Math.floor(actualCharge * 0.7)}`,
        lastTickAt: newLastTick,
        durationSec: sql`${astrologerSessions.durationSec} + ${actualMinutes * 60}`,
      }).where(and(
        eq(astrologerSessions.id, s.id),
        eq(astrologerSessions.status, "active"),
      ));

      // Decrement the user's free-chat grant by the minutes we actually consumed.
      if (freeToUse > 0) {
        await db.update(freeChatGrants).set({
          minutesUsed: sql`${freeChatGrants.minutesUsed} + ${freeToUse}`,
        }).where(and(
          eq(freeChatGrants.userId, s.userId),
          eq(freeChatGrants.reason, "first_chat"),
        ));
      }

      if (shouldEnd) {
        const graceMs = ZERO_BALANCE_GRACE_SEC * 1000;
        const graceUp = (now.getTime() - newLastTick.getTime()) >= graceMs;
        await db.insert(sessionMessages).values({
          sessionId: s.id, senderType: "system",
          body: graceUp
            ? "Session ended — wallet balance exhausted. Recharge to continue."
            : "Low balance — session will end in 30 seconds. Recharge to continue.",
        });
        if (graceUp) {
          await finalizeSession(s.id, "system_zero_balance");
        }
      }
    } catch (e) {
      console.error("[astro-tick] session", s.id, e);
    }
  }

  // Time out long-waiting sessions.
  const cutoff = new Date(Date.now() - SESSION_TIMEOUT_WAITING_MS);
  await db.update(astrologerSessions).set({
    status: "timeout", endedAt: new Date(), endedBy: "system_timeout",
  }).where(and(eq(astrologerSessions.status, "waiting"), sql`${astrologerSessions.createdAt} < ${cutoff}`));
}

let tickerStarted = false;
function startTicker() {
  if (tickerStarted) return;
  tickerStarted = true;
  const t = setInterval(() => { runSessionTick().catch(e => console.error("[astro-tick]", e)); }, 30_000);
  t.unref?.();
}

// ---------- Razorpay helper (keys may be absent in dev) ----------
function getRazorpay() {
  const id = process.env.RAZORPAY_KEY_ID;
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!id || !secret) return null;
  return new Razorpay({ key_id: id, key_secret: secret });
}

export function registerAstroRealtimeRoutes(app: Express) {
  startTicker();

  // ============================================================
  // WALLET
  // ============================================================
  app.get("/api/wallet", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const w = await ensureWallet(userId);
      const recent = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(10);
      res.json({ wallet: w, recent });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/wallet/transactions", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const limit = Math.min(100, Number(req.query.limit) || 50);
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const rows = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.userId, userId))
        .orderBy(desc(walletTransactions.createdAt))
        .limit(limit).offset(offset);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/wallet/recharge/order", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const schema = z.object({ amountPaise: z.number().int().min(MIN_RECHARGE_PAISE).max(MAX_RECHARGE_PAISE) });
      const { amountPaise } = schema.parse(req.body);
      const rzp = getRazorpay();
      if (!rzp) {
        if (process.env.NODE_ENV === "production") {
          return res.status(503).json({ error: "Payment provider not configured" });
        }
        // Dev mock: produce a fake order id.
        return res.json({
          orderId: `mock_${Date.now()}`,
          amountPaise,
          bonusPaise: bonusForRecharge(amountPaise),
          mock: true,
        });
      }
      const order = await rzp.orders.create({
        amount: amountPaise,
        currency: "INR",
        notes: { kind: "wallet_recharge", userId: String(userId) },
      });
      res.json({
        orderId: order.id,
        amountPaise,
        bonusPaise: bonusForRecharge(amountPaise),
        keyId: process.env.RAZORPAY_KEY_ID,
      });
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid amount", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/wallet/recharge/verify", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const schema = z.object({
        razorpay_order_id: z.string(),
        razorpay_payment_id: z.string(),
        razorpay_signature: z.string(),
      });
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = schema.parse(req.body);
      const secret = process.env.RAZORPAY_KEY_SECRET;
      const rzp = getRazorpay();

      let amountPaise = 0;
      const isMock = razorpay_order_id.startsWith("mock_");

      if (isMock) {
        if (process.env.NODE_ENV === "production") {
          return res.status(400).json({ error: "Mock payment not allowed in production" });
        }
        amountPaise = Number((req.body as any).amountPaise) || 0;
        if (amountPaise < MIN_RECHARGE_PAISE) return res.status(400).json({ error: "Invalid amount" });
      } else {
        if (!secret || !rzp) return res.status(503).json({ error: "Payment provider not configured" });
        const expected = crypto.createHmac("sha256", secret)
          .update(razorpay_order_id + "|" + razorpay_payment_id).digest("hex");
        if (expected !== razorpay_signature) return res.status(400).json({ error: "Signature mismatch" });
        const payment = await rzp.payments.fetch(razorpay_payment_id);
        if (payment.status !== "captured" && payment.status !== "authorized") {
          return res.status(400).json({ error: "Payment not captured" });
        }
        amountPaise = Number(payment.amount);
      }

      // Idempotency: serialize concurrent verifies for the same user via a
      // pessimistic row lock on user_wallets, then check inside the lock.
      // Two parallel /verify calls with the same razorpay_payment_id will:
      //   - both grab the wallet row in turn (FOR UPDATE serializes them)
      //   - the first inserts the recharge ledger row + credits
      //   - the second sees the existing ledger row and returns alreadyCredited
      // No DB schema change required, no double-credit possible.
      await ensureWallet(userId);
      const bonus = bonusForRecharge(amountPaise);
      const result = await db.transaction(async (tx) => {
        await tx.execute(sql`SELECT user_id FROM user_wallets WHERE user_id = ${userId} FOR UPDATE`);
        const already = await tx.select({ id: walletTransactions.id }).from(walletTransactions)
          .where(and(
            eq(walletTransactions.userId, userId),
            eq(walletTransactions.kind, "recharge"),
            eq(walletTransactions.refId, razorpay_payment_id),
          )).limit(1);
        if (already.length) {
          const [w] = await tx.select().from(userWallets).where(eq(userWallets.userId, userId)).limit(1);
          return { balancePaise: w.balancePaise, alreadyCredited: true };
        }
        // Inline atomic increments — same as applyWalletDelta but reusing this
        // serialized transaction so the idempotency check + writes are atomic.
        const totalCredit = amountPaise + bonus;
        const [updated] = await tx.update(userWallets).set({
          balancePaise: sql`${userWallets.balancePaise} + ${totalCredit}`,
          totalRechargedPaise: sql`${userWallets.totalRechargedPaise} + ${totalCredit}`,
          updatedAt: new Date(),
        }).where(eq(userWallets.userId, userId)).returning();
        await tx.insert(walletTransactions).values({
          userId, kind: "recharge", amountPaise,
          balanceAfterPaise: updated.balancePaise - bonus,
          refType: "razorpay", refId: razorpay_payment_id,
          note: `Wallet recharge ₹${amountPaise / 100}`,
        });
        if (bonus > 0) {
          await tx.insert(walletTransactions).values({
            userId, kind: "bonus", amountPaise: bonus,
            balanceAfterPaise: updated.balancePaise,
            refType: "promo", refId: razorpay_payment_id,
            note: `Bonus on ₹${amountPaise / 100} recharge`,
          });
        }
        return { balancePaise: updated.balancePaise, alreadyCredited: false };
      });

      if (result.alreadyCredited) {
        return res.json({ ok: true, balancePaise: result.balancePaise, creditedPaise: 0, bonusPaise: 0, alreadyCredited: true });
      }
      res.json({ ok: true, balancePaise: result.balancePaise, creditedPaise: amountPaise + bonus, bonusPaise: bonus });
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  // ============================================================
  // FREE CHAT GRANTS
  // ============================================================
  app.get("/api/free-chat/eligibility", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const grants = await db.select().from(freeChatGrants)
        .where(and(eq(freeChatGrants.userId, userId), eq(freeChatGrants.reason, "first_chat")))
        .limit(1);
      if (grants.length) {
        const g = grants[0];
        const remaining = Math.max(0, g.minutesGranted - g.minutesUsed);
        return res.json({ eligible: remaining > 0, minutesRemaining: remaining, alreadyClaimed: true });
      }
      res.json({ eligible: true, minutesRemaining: 5, alreadyClaimed: false });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // ============================================================
  // CONSULTATION SESSIONS
  // ============================================================
  app.post("/api/astrology-sessions", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const schema = z.object({
        astrologerId: z.number().int().positive(),
        mode: z.enum(["chat", "call"]),
      });
      const { astrologerId, mode } = schema.parse(req.body);
      if (mode === "call") {
        return res.status(503).json({ error: "Voice consultations launching soon — chat is live now." });
      }

      const aRows = await db.select().from(astrologers).where(eq(astrologers.id, astrologerId)).limit(1);
      if (!aRows.length) return res.status(404).json({ error: "Astrologer not found" });
      const a = aRows[0];
      if (!a.acceptingChat) return res.status(400).json({ error: "Astrologer is not accepting chat right now" });
      if (!a.online) return res.status(400).json({ error: "Astrologer is offline" });

      const ratePaise = mode === "chat" ? a.chatRatePaisePerMin : a.callRatePaisePerMin;

      // Free first chat?
      let freeMinutes = 0;
      const grants = await db.select().from(freeChatGrants)
        .where(and(eq(freeChatGrants.userId, userId), eq(freeChatGrants.reason, "first_chat")))
        .limit(1);
      if (!grants.length) {
        await db.insert(freeChatGrants).values({ userId, minutesGranted: 5, minutesUsed: 0, reason: "first_chat" });
        freeMinutes = 5;
      } else {
        freeMinutes = Math.max(0, grants[0].minutesGranted - grants[0].minutesUsed);
      }

      // Need balance for at least 1 minute OR free minutes.
      const w = await ensureWallet(userId);
      if (freeMinutes <= 0 && w.balancePaise < ratePaise) {
        return res.status(402).json({ error: "Recharge wallet to start chat", minBalancePaise: ratePaise });
      }

      const [s] = await db.insert(astrologerSessions).values({
        userId, astrologerId, mode,
        status: "active",
        ratePaisePerMin: ratePaise,
        freeMinutesGranted: freeMinutes,
        startedAt: new Date(),
        acceptedAt: new Date(),
        lastTickAt: new Date(),
      }).returning();

      await db.insert(sessionMessages).values({
        sessionId: s.id, senderType: "system",
        body: freeMinutes > 0
          ? `Connected with ${a.name}. First ${freeMinutes} minutes are FREE, then ₹${(ratePaise / 100).toFixed(2)}/min.`
          : `Connected with ${a.name}. Chat at ₹${(ratePaise / 100).toFixed(2)}/min.`,
      });

      res.json({ session: s, astrologer: { id: a.id, name: a.name, image: a.image } });
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  app.get("/api/astrology-sessions/:id", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const id = Number(req.params.id);
      const rows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
      if (!rows.length) return res.status(404).json({ error: "Session not found" });
      const s = rows[0];
      if (s.userId !== userId) return res.status(403).json({ error: "Forbidden" });
      const w = await ensureWallet(userId);
      const aRows = await db.select({ id: astrologers.id, name: astrologers.name, image: astrologers.image })
        .from(astrologers).where(eq(astrologers.id, s.astrologerId)).limit(1);
      res.json({ session: s, walletBalancePaise: w.balancePaise, astrologer: aRows[0] ?? null });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.get("/api/astrology-sessions/:id/messages", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const id = Number(req.params.id);
      const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
      if (!sRows.length) return res.status(404).json({ error: "Not found" });
      if (sRows[0].userId !== userId) return res.status(403).json({ error: "Forbidden" });
      const sinceId = Number(req.query.sinceId) || 0;
      const msgs = await db.select().from(sessionMessages)
        .where(and(eq(sessionMessages.sessionId, id), gt(sessionMessages.id, sinceId)))
        .orderBy(sessionMessages.id);
      res.json(msgs);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/astrology-sessions/:id/messages", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const id = Number(req.params.id);
      const schema = z.object({ body: z.string().trim().min(1).max(2000) });
      const { body } = schema.parse(req.body);
      const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
      if (!sRows.length) return res.status(404).json({ error: "Not found" });
      if (sRows[0].userId !== userId) return res.status(403).json({ error: "Forbidden" });
      if (sRows[0].status !== "active") return res.status(400).json({ error: "Session not active" });
      const [m] = await db.insert(sessionMessages).values({ sessionId: id, senderType: "user", body }).returning();
      res.json(m);
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/astrology-sessions/:id/end", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const id = Number(req.params.id);
      const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
      if (!sRows.length) return res.status(404).json({ error: "Not found" });
      if (sRows[0].userId !== userId) return res.status(403).json({ error: "Forbidden" });
      if (sRows[0].status !== "active") return res.json({ ok: true, alreadyEnded: true });
      // Force final tick before ending so partial-minute counters are flushed.
      await runSessionTick().catch(() => {});
      // Single-writer finalize — also updates astrologer aggregate from the
      // post-tick session row (not a stale snapshot).
      const did = await finalizeSession(id, "user");
      res.json({ ok: true, alreadyEnded: !did });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/astrology-sessions/:id/rate", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const id = Number(req.params.id);
      const schema = z.object({ rating: z.number().int().min(1).max(5), comment: z.string().max(2000).optional() });
      const { rating, comment } = schema.parse(req.body);
      const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
      if (!sRows.length) return res.status(404).json({ error: "Not found" });
      if (sRows[0].userId !== userId) return res.status(403).json({ error: "Forbidden" });
      const [r] = await db.insert(sessionRatings).values({
        sessionId: id, userId, astrologerId: sRows[0].astrologerId, rating, comment: comment ?? null,
      }).onConflictDoUpdate({
        target: sessionRatings.sessionId,
        set: { rating, comment: comment ?? null },
      }).returning();
      // Recompute astrologer aggregate.
      const allRatings = await db.select({ r: sessionRatings.rating }).from(sessionRatings)
        .where(eq(sessionRatings.astrologerId, sRows[0].astrologerId));
      const avg = allRatings.reduce((a, x) => a + x.r, 0) / allRatings.length;
      await db.update(astrologers).set({
        rating: avg, reviewCount: allRatings.length,
      }).where(eq(astrologers.id, sRows[0].astrologerId));
      res.json(r);
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  // ============================================================
  // ASTROLOGER PORTAL
  // ============================================================
  app.post("/api/astrologer/auth/login", async (req, res) => {
    try {
      const schema = z.object({ phone: z.string().min(6), password: z.string().min(1) });
      const { phone, password } = schema.parse(req.body);
      const norm = phone.replace(/\D/g, "").slice(-10);
      const rows = await db.select().from(astrologers).where(eq(astrologers.phone, norm)).limit(1);
      if (!rows.length) return res.status(401).json({ error: "Invalid phone or password" });
      const a = rows[0];
      if (!a.password) return res.status(401).json({ error: "Account not activated. Contact admin to set password." });
      const ok = await bcrypt.compare(password, a.password);
      if (!ok) return res.status(401).json({ error: "Invalid phone or password" });
      const token = newToken();
      await db.insert(astrologerPortalSessions).values({
        astrologerId: a.id, token,
        expiresAt: new Date(Date.now() + SESSION_TTL_DAYS * 86400_000),
      });
      const { password: _p, ...safe } = a;
      res.json({ token, astrologer: safe });
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  app.post("/api/astrologer/auth/logout", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const token = (req.headers["x-astrologer-token"] as string | undefined);
    if (token) await db.delete(astrologerPortalSessions).where(eq(astrologerPortalSessions.token, token));
    res.json({ ok: true });
  });

  app.get("/api/astrologer/me", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const rows = await db.select().from(astrologers).where(eq(astrologers.id, req.astrologerId!)).limit(1);
    if (!rows.length) return res.status(404).json({ error: "Astrologer not found" });
    markAstrologerSeen(req.astrologerId!);
    const { password: _p, ...safe } = rows[0];
    res.json({ ...safe, liveOnline: isAstrologerOnline(req.astrologerId!) });
  });

  app.post("/api/astrologer/me/online", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const schema = z.object({
      online: z.boolean().optional(),
      acceptingChat: z.boolean().optional(),
      acceptingCall: z.boolean().optional(),
    });
    const data = schema.parse(req.body);
    const updates: any = { lastSeenAt: new Date() };
    if (data.online !== undefined) updates.online = data.online;
    if (data.acceptingChat !== undefined) updates.acceptingChat = data.acceptingChat;
    if (data.acceptingCall !== undefined) updates.acceptingCall = data.acceptingCall;
    const [r] = await db.update(astrologers).set(updates).where(eq(astrologers.id, req.astrologerId!)).returning();
    markAstrologerSeen(req.astrologerId!);
    const { password: _p, ...safe } = r;
    res.json(safe);
  });

  app.post("/api/astrologer/me/heartbeat", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    markAstrologerSeen(req.astrologerId!);
    await db.update(astrologers).set({ lastSeenAt: new Date() }).where(eq(astrologers.id, req.astrologerId!));
    res.json({ ok: true });
  });

  app.get("/api/astrologer/me/sessions", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const rows = await db.select().from(astrologerSessions)
      .where(eq(astrologerSessions.astrologerId, req.astrologerId!))
      .orderBy(desc(astrologerSessions.createdAt))
      .limit(50);
    res.json(rows);
  });

  app.get("/api/astrologer/me/earnings", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const rows = await db.select().from(astrologerSessions)
      .where(and(eq(astrologerSessions.astrologerId, req.astrologerId!), eq(astrologerSessions.status, "ended")));
    const totalPaise = rows.reduce((a, s) => a + s.astrologerEarningsPaise, 0);
    const totalSessions = rows.length;
    const totalMinutes = rows.reduce((a, s) => a + Math.floor(s.durationSec / 60), 0);
    const last30CutoffMs = Date.now() - 30 * 86400_000;
    const last30 = rows.filter(s => s.endedAt && new Date(s.endedAt).getTime() > last30CutoffMs);
    const last30Paise = last30.reduce((a, s) => a + s.astrologerEarningsPaise, 0);
    res.json({ totalEarningsPaise: totalPaise, totalSessions, totalMinutes, last30DaysPaise: last30Paise });
  });

  app.get("/api/astrologer/sessions/:id/messages", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const id = Number(req.params.id);
    const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
    if (!sRows.length) return res.status(404).json({ error: "Not found" });
    if (sRows[0].astrologerId !== req.astrologerId!) return res.status(403).json({ error: "Forbidden" });
    const sinceId = Number(req.query.sinceId) || 0;
    const msgs = await db.select().from(sessionMessages)
      .where(and(eq(sessionMessages.sessionId, id), gt(sessionMessages.id, sinceId)))
      .orderBy(sessionMessages.id);
    res.json(msgs);
  });

  app.post("/api/astrologer/sessions/:id/messages", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const id = Number(req.params.id);
    const schema = z.object({ body: z.string().trim().min(1).max(2000) });
    const { body } = schema.parse(req.body);
    const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
    if (!sRows.length) return res.status(404).json({ error: "Not found" });
    if (sRows[0].astrologerId !== req.astrologerId!) return res.status(403).json({ error: "Forbidden" });
    if (sRows[0].status !== "active") return res.status(400).json({ error: "Session not active" });
    const [m] = await db.insert(sessionMessages).values({ sessionId: id, senderType: "astrologer", body }).returning();
    res.json(m);
  });

  app.post("/api/astrologer/sessions/:id/end", astrologerAuthMiddleware, async (req: AstrologerRequest, res) => {
    const id = Number(req.params.id);
    const sRows = await db.select().from(astrologerSessions).where(eq(astrologerSessions.id, id)).limit(1);
    if (!sRows.length) return res.status(404).json({ error: "Not found" });
    if (sRows[0].astrologerId !== req.astrologerId!) return res.status(403).json({ error: "Forbidden" });
    if (sRows[0].status !== "active") return res.json({ ok: true, alreadyEnded: true });
    await runSessionTick().catch(() => {});
    const did = await finalizeSession(id, "astrologer");
    if (did) {
      await db.insert(sessionMessages).values({
        sessionId: id, senderType: "system", body: "Astrologer has ended the session. Please rate your experience.",
      });
    }
    res.json({ ok: true, alreadyEnded: !did });
  });

  // Admin: set or reset astrologer password (uses existing admin middleware via header check;
  // we don't import adminAuthMiddleware to avoid circular, so we re-validate inline via the
  // same admin_sessions table the rest of the app uses).
  app.post("/api/admin/astrologers/:id/set-password", async (req, res) => {
    try {
      const token = req.headers["x-admin-token"] as string | undefined;
      if (!token) return res.status(401).json({ error: "Admin auth required" });
      const { adminSessions } = await import("@shared/schema");
      const adminRows = await db.select().from(adminSessions)
        .where(and(eq(adminSessions.token, token), gt(adminSessions.expiresAt, new Date()))).limit(1);
      if (!adminRows.length) return res.status(401).json({ error: "Invalid admin token" });
      const id = Number(req.params.id);
      const schema = z.object({ password: z.string().min(8) });
      const { password } = schema.parse(req.body);
      const hash = await bcrypt.hash(password, 10);
      await db.update(astrologers).set({ password: hash }).where(eq(astrologers.id, id));
      res.json({ ok: true });
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });
}
