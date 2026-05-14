import type { Express, Request, Response } from "express";
import { db } from "./db";
import { pandits, pujaBookings, pujaTips, panditPayouts, panditReferrals } from "@shared/schema";
import { and, desc, eq, gte, lte, inArray, sql } from "drizzle-orm";
import { z } from "zod";
import { storage } from "./storage";
import { panditAuthMiddleware, type PanditRequest } from "./pandit-portal";

const DEFAULT_COMMISSION_PCT = 15;

type Tx =
  | { kind: "booking"; id: number; date: string; refId: number; description: string; gross: number; commission: number; net: number }
  | { kind: "tip"; id: number; date: string; refId: number; description: string; gross: number; commission: 0; net: number }
  | { kind: "referral"; id: number; date: string; refId: number; description: string; gross: number; commission: 0; net: number }
  | { kind: "payout"; id: number; date: string; refId: number; description: string; gross: 0; commission: 0; net: number };

function commissionPctFor(p: { commissionPct: number | null }): number {
  return typeof p.commissionPct === "number" ? p.commissionPct : DEFAULT_COMMISSION_PCT;
}

function ymKey(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function buildSummary(panditId: number) {
  const pandit = (await db.select().from(pandits).where(eq(pandits.id, panditId)).limit(1))[0];
  if (!pandit) throw new Error("Pandit not found");
  const pct = commissionPctFor(pandit);

  const completed = await db.select().from(pujaBookings).where(
    and(eq(pujaBookings.panditId, panditId), eq(pujaBookings.status, "completed")),
  );
  const tips = await db.select().from(pujaTips).where(
    and(eq(pujaTips.panditId, panditId), eq(pujaTips.status, "paid")),
  );
  const recentPayoutRows = await storage.listPanditPayouts(panditId, { limit: 10 });
  const paidOut = await storage.totalPanditPayouts(panditId);
  const refSummary = await storage.panditReferralSummary(panditId);
  // refSummary.pending = sum of (pending + confirmed) per storage.ts:1600.
  // Split into "accruing" (status=pending, awaiting admin confirm) and
  // "payable" (status=confirmed, ready to settle).
  const accruingRow = await db.select({ s: sql<number>`coalesce(sum(${panditReferrals.commissionAmount}), 0)` })
    .from(panditReferrals)
    .where(and(eq(panditReferrals.panditId, panditId), eq(panditReferrals.status, "pending")));
  const referralAccruing = Number(accruingRow[0]?.s || 0);
  const referralConfirmed = Math.max(0, refSummary.pending - referralAccruing);
  const referralPaid = refSummary.paid;
  const referralPayable = referralConfirmed + referralPaid;

  // Per-booking rounding for ledger-consistent totals (matches transaction list).
  let grossBookings = 0;
  let commission = 0;
  for (const b of completed) {
    const g = b.totalAmount || 0;
    const c = Math.round((g * pct) / 100);
    grossBookings += g;
    commission += c;
  }
  const netBookings = grossBookings - commission;
  const tipsTotal = tips.reduce((s, t) => s + (t.amountInr || 0), 0);
  const netEarned = netBookings + tipsTotal + referralPayable;
  const pending = netEarned - paidOut;
  const payoutsCount = await db.select({ c: sql<number>`count(*)::int` }).from(panditPayouts).where(eq(panditPayouts.panditId, panditId));

  // Last 12 months breakdown (net earnings only).
  const monthly: Record<string, { month: string; gross: number; commission: number; tips: number; net: number }> = {};
  const now = new Date();
  for (let i = 11; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = ymKey(d);
    monthly[k] = { month: k, gross: 0, commission: 0, tips: 0, net: 0 };
  }
  for (const b of completed) {
    const when = b.completedAt || b.acceptedAt || b.createdAt || new Date();
    const k = ymKey(new Date(when));
    if (!monthly[k]) continue;
    const g = b.totalAmount || 0;
    const c = Math.round((g * pct) / 100);
    monthly[k].gross += g;
    monthly[k].commission += c;
    monthly[k].net += g - c;
  }
  for (const t of tips) {
    const when = t.createdAt || new Date();
    const k = ymKey(new Date(when));
    if (!monthly[k]) continue;
    monthly[k].tips += t.amountInr || 0;
    monthly[k].net += t.amountInr || 0;
  }
  return {
    commissionPct: pct,
    summary: {
      grossBookings, commission, netBookings, tipsTotal, netEarned, paidOut, pending,
      completedCount: completed.length, tipsCount: tips.length,
      payoutsCount: Number(payoutsCount[0]?.c || 0),
      referralPayable, referralConfirmed, referralPaid, referralAccruing,
      referralCount: refSummary.count,
    },
    monthly: Object.values(monthly),
    recentPayouts: recentPayoutRows,
  };
}

async function buildTransactions(panditId: number, from?: Date, to?: Date): Promise<Tx[]> {
  const pandit = (await db.select().from(pandits).where(eq(pandits.id, panditId)).limit(1))[0];
  if (!pandit) throw new Error("Pandit not found");
  const pct = commissionPctFor(pandit);

  const completedFilters = [eq(pujaBookings.panditId, panditId), eq(pujaBookings.status, "completed")];
  if (from) completedFilters.push(gte(pujaBookings.completedAt, from));
  if (to) completedFilters.push(lte(pujaBookings.completedAt, to));
  const completed = await db.select().from(pujaBookings).where(and(...completedFilters)).orderBy(desc(pujaBookings.completedAt));

  const tipFilters = [eq(pujaTips.panditId, panditId), eq(pujaTips.status, "paid")];
  if (from) tipFilters.push(gte(pujaTips.createdAt, from));
  if (to) tipFilters.push(lte(pujaTips.createdAt, to));
  const tips = await db.select().from(pujaTips).where(and(...tipFilters)).orderBy(desc(pujaTips.createdAt));

  const payouts = await storage.listPanditPayouts(panditId, { from, to, limit: 1000 });

  const refFilters = [
    eq(panditReferrals.panditId, panditId),
    inArray(panditReferrals.status, ["confirmed", "paid"]),
  ];
  if (from) refFilters.push(gte(panditReferrals.createdAt, from));
  if (to) refFilters.push(lte(panditReferrals.createdAt, to));
  const refs = await db.select().from(panditReferrals).where(and(...refFilters)).orderBy(desc(panditReferrals.createdAt));

  const txs: Tx[] = [];
  for (const b of completed) {
    const g = b.totalAmount || 0;
    const c = Math.round((g * pct) / 100);
    const when = b.completedAt || b.acceptedAt || b.createdAt || new Date();
    txs.push({
      kind: "booking", id: b.id, refId: b.id,
      date: new Date(when).toISOString(),
      description: `${b.pujaType || "Puja"} — ${b.mode || "online"}`,
      gross: g, commission: c, net: g - c,
    });
  }
  for (const t of tips) {
    const when = t.createdAt || new Date();
    txs.push({
      kind: "tip", id: t.id, refId: t.bookingId || 0,
      date: new Date(when).toISOString(),
      description: `Tip from yajamana${t.bookingId ? ` (booking #${t.bookingId})` : ""}`,
      gross: t.amountInr || 0, commission: 0, net: t.amountInr || 0,
    });
  }
  for (const r of refs) {
    const when = r.createdAt || new Date();
    const label = r.kind === "order" ? "Product referral" : r.kind === "donation" ? "Donation referral" : "Booking referral";
    txs.push({
      kind: "referral", id: r.id, refId: r.refId,
      date: new Date(when).toISOString(),
      description: `${label} (${r.commissionPct}% of ₹${r.grossAmount})${r.status === "paid" ? " · settled" : " · awaiting payout"}`,
      gross: r.grossAmount || 0, commission: 0, net: r.commissionAmount || 0,
    });
  }
  for (const p of payouts) {
    txs.push({
      kind: "payout", id: p.id, refId: p.id,
      date: new Date(p.paidAt).toISOString(),
      description: `Payout via ${p.method}${p.reference ? ` · ${p.reference}` : ""}`,
      gross: 0, commission: 0, net: -(p.amountInr || 0),
    });
  }
  txs.sort((a, b) => (a.date < b.date ? 1 : -1));
  return txs;
}

export function registerPanditEarningsRoutes(app: Express, adminAuthMiddleware: any) {
  // ---- Pandit-side ----
  app.get("/api/pandit/earnings", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      res.json(await buildSummary(req.panditId!));
    } catch (e: any) { res.status(500).json({ error: e?.message || "Failed to load earnings" }); }
  });

  app.get("/api/pandit/earnings/transactions", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const from = req.query.from ? new Date(String(req.query.from)) : undefined;
      const to = req.query.to ? new Date(String(req.query.to)) : undefined;
      const txs = await buildTransactions(req.panditId!, from, to);
      res.json({ transactions: txs });
    } catch (e: any) { res.status(500).json({ error: e?.message || "Failed to load transactions" }); }
  });

  app.get("/api/pandit/payouts", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await storage.listPanditPayouts(req.panditId!, { limit: 200 });
      res.json({ payouts: rows });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ---- Admin-side ----
  app.get("/api/admin/pandits/:id/earnings", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid pandit id" });
      res.json(await buildSummary(id));
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/admin/pandits/:id/payouts", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid pandit id" });
      const rows = await storage.listPanditPayouts(id, { limit: 500 });
      res.json({ payouts: rows });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.post("/api/admin/pandits/:id/payouts", adminAuthMiddleware, async (req: Request & { adminUserId?: number }, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid pandit id" });
      const schema = z.object({
        amountInr: z.coerce.number().int().positive(),
        method: z.enum(["upi", "bank", "cash", "other"]).default("upi"),
        reference: z.string().max(120).optional().nullable(),
        notes: z.string().max(500).optional().nullable(),
        paidAt: z.coerce.date().optional(),
      });
      const parsed = schema.parse(req.body);
      const paidAt = parsed.paidAt || new Date();
      const row = await storage.createPanditPayout({
        panditId: id,
        amountInr: parsed.amountInr,
        method: parsed.method,
        reference: parsed.reference || null,
        notes: parsed.notes || null,
        paidAt,
        createdByAdminId: req.adminUserId || null,
      } as any);
      // Auto-settle confirmed referral commissions oldest-first, greedy up to
      // the payout amount. We pick whole rows (no partial settlement) and
      // stop once the next row would exceed the remaining headroom. Pending
      // (not yet admin-confirmed) and reversed rows are left alone.
      const candidates = await db.select({ id: panditReferrals.id, amt: panditReferrals.commissionAmount })
        .from(panditReferrals)
        .where(and(eq(panditReferrals.panditId, id), eq(panditReferrals.status, "confirmed")))
        .orderBy(panditReferrals.createdAt);
      const toSettle: number[] = [];
      let budget = parsed.amountInr;
      for (const c of candidates) {
        const amt = c.amt || 0;
        if (amt === 0) { toSettle.push(c.id); continue; } // free-tier rows: free to flip
        if (amt > budget) break;
        toSettle.push(c.id);
        budget -= amt;
      }
      if (toSettle.length) {
        await db.update(panditReferrals)
          .set({ status: "paid", paidAt })
          .where(inArray(panditReferrals.id, toSettle));
      }
      res.status(201).json({ payout: row, settledReferrals: toSettle.length });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid payout", issues: e.issues });
      res.status(500).json({ message: e?.message });
    }
  });

  app.delete("/api/admin/pandit-payouts/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Invalid id" });
      const ok = await storage.deletePanditPayout(id);
      if (!ok) return res.status(404).json({ message: "Payout not found" });
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });
}
