// portal-sync.ts
// ────────────────────────────────────────────────────────────────────────
// Cross-surface handshake routes that close the loops between the three
// dashboards (customer, pandit, admin). Everything in this file is purely
// additive — it never mutates an existing route's behaviour, only listens
// for important events and pushes the matching notification, plus exposes
// the read endpoints each surface needs to render its inbox.
//
// What lives here:
//   - pushPanditNotification(): writes into pandit_notifications inbox
//   - notifyUserForPandit*():   helpers used by other modules to push to
//                               the customer when a pandit-side event fires
//   - GET    /api/pandit/notifications              (list + unread count)
//   - PATCH  /api/pandit/notifications/:id/read
//   - POST   /api/pandit/notifications/read-all
//   - GET    /api/pandit/reviews                    (my reviews + KPIs)
//   - PATCH  /api/pandit/reviews/:id/reply          (post a public reply)
//   - GET    /api/my/payment-requests               (customer inbox)
//   - GET    /api/my/pandit-memories                ("your pandit remembers")
//   - POST   /api/admin/users/:id/loyalty/adjust    (admin manual award/deduct)
//   - GET    /api/admin/pandits/online              (live indicator for admin)
// ────────────────────────────────────────────────────────────────────────
import type { Express, Request, Response } from "express";
import { db } from "./db";
import {
  panditNotifications,
  panditReviews,
  panditPaymentRequests,
  panditClientMemories,
  pandits,
  pujaBookings,
  pujaBookingMessages,
  users,
  loyaltyTransactions,
} from "@shared/schema";
import { and, eq, gt, sql, desc, isNull, inArray, or } from "drizzle-orm";
import { z } from "zod";
import { panditAuthMiddleware, type PanditRequest } from "./pandit-portal";
import { adminAuthMiddleware } from "./admin-auth";

// ──────────────────────────── Pandit-side push ─────────────────────────
export async function pushPanditNotification(input: {
  panditId: number | null | undefined;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  meta?: Record<string, unknown> | null;
  dedupeKey?: string;
  dedupeWindowMin?: number;
}): Promise<void> {
  try {
    if (!input.panditId || !Number.isFinite(input.panditId)) return;
    const dedupeKey = input.dedupeKey || null;
    if (dedupeKey) {
      const windowMin = input.dedupeWindowMin ?? 30;
      const cutoff = new Date(Date.now() - windowMin * 60 * 1000);
      const dup = await db.select({ id: panditNotifications.id })
        .from(panditNotifications)
        .where(and(
          eq(panditNotifications.panditId, input.panditId),
          eq(panditNotifications.kind, input.kind),
          gt(panditNotifications.createdAt, cutoff),
          sql`${panditNotifications.meta}->>'dedupeKey' = ${dedupeKey}`,
        ))
        .limit(1);
      if (dup.length > 0) return;
    }
    const meta = { ...(input.meta || {}), ...(dedupeKey ? { dedupeKey } : {}) };
    await db.insert(panditNotifications).values({
      panditId: input.panditId,
      kind: input.kind,
      title: input.title,
      body: input.body || null,
      link: input.link || null,
      meta: meta as any,
    } as any);
  } catch (err: any) {
    // Best-effort. Never let a notification failure poison the caller.
    console.warn("[pandit-notifications] push failed:", err?.message || err);
  }
}

// ────────────── Customer identity for /api/my/* (mirror) ───────────────
async function verifyUserIdentity(req: Request, userId: number): Promise<{ ok: boolean; user?: { id: number; email: string; phone: string | null } }> {
  if (!Number.isFinite(userId) || userId <= 0) return { ok: false };
  const claimed = String(req.body?.identityEmail || req.query?.email || req.header("x-user-email") || "")
    .trim().toLowerCase();
  if (!claimed) return { ok: false };
  const [u] = await db.select({ id: users.id, email: users.email, phone: users.phone })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!u?.email) return { ok: false };
  if (u.email.trim().toLowerCase() !== claimed) return { ok: false };
  return { ok: true, user: u as any };
}

// Resolve a userId from a payment-request row's customer fields. The pandit
// CRM stores customerKey as either "u:<id>" (logged-in yajamana) or "p:<phone>"
// (walk-in / phone-only client). When the key is "u:<id>", the user is known
// directly; when it's a phone-only client we attempt a phone-suffix match
// against the users table so a customer who later signs up still sees the
// payment requests their pandit has been raising for them.
export async function resolveUserIdForCustomer(opts: {
  customerKey?: string | null;
  customerPhone?: string | null;
}): Promise<number | null> {
  try {
    const key = opts.customerKey || "";
    if (key.startsWith("u:")) {
      const id = Number(key.slice(2));
      if (Number.isFinite(id) && id > 0) return id;
    }
    const phone = (opts.customerPhone || "").replace(/\D/g, "").slice(-10);
    if (phone.length === 10) {
      // Match the last-10-digits of any stored phone — guards against
      // "+91" prefixes vs raw 10-digit storage. We pick the most recent
      // user to avoid surfacing requests to a deleted/duplicate row.
      const rows = await db.select({ id: users.id, phone: users.phone })
        .from(users)
        .where(sql`right(regexp_replace(coalesce(${users.phone}, ''), '\\D', '', 'g'), 10) = ${phone}`)
        .orderBy(desc(users.id))
        .limit(1);
      if (rows.length) return rows[0].id;
    }
    return null;
  } catch { return null; }
}

// ────────────────────────────── Routes ─────────────────────────────────
export function registerPortalSyncRoutes(app: Express): void {
  // ─────────── Pandit inbox ───────────
  app.get("/api/pandit/notifications", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await db.select().from(panditNotifications)
        .where(eq(panditNotifications.panditId, req.panditId!))
        .orderBy(desc(panditNotifications.createdAt))
        .limit(50);
      const unread = rows.filter((r) => !r.readAt).length;
      res.json({ notifications: rows, unread });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.patch("/api/pandit/notifications/:id/read", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const upd = await db.update(panditNotifications)
        .set({ readAt: new Date() })
        .where(and(
          eq(panditNotifications.id, id),
          eq(panditNotifications.panditId, req.panditId!),
        ))
        .returning();
      if (!upd.length) return res.status(404).json({ error: "Not found" });
      res.json({ notification: upd[0] });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pandit/notifications/read-all", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      await db.update(panditNotifications)
        .set({ readAt: new Date() })
        .where(and(
          eq(panditNotifications.panditId, req.panditId!),
          isNull(panditNotifications.readAt),
        ));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ─────────── Pandit reviews (read + reply) ───────────
  app.get("/api/pandit/reviews", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await db.select().from(panditReviews)
        .where(eq(panditReviews.panditId, req.panditId!))
        .orderBy(desc(panditReviews.createdAt));
      const ratings = rows.map((r) => r.rating).filter((n) => Number.isFinite(n)) as number[];
      const avg = ratings.length ? ratings.reduce((s, n) => s + n, 0) / ratings.length : 0;
      const breakdown = [5, 4, 3, 2, 1].map((star) => ({
        star, count: rows.filter((r) => Math.round(r.rating) === star).length,
      }));
      const unanswered = rows.filter((r) => !r.panditReply).length;
      res.json({ reviews: rows, summary: { count: rows.length, avg, breakdown, unanswered } });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  const replySchema = z.object({ reply: z.string().min(1).max(1000) });
  app.patch("/api/pandit/reviews/:id/reply", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const parsed = replySchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      // Atomic: only update if the row belongs to this pandit. Returns the
      // updated row so the UI can re-render without a follow-up GET.
      const upd = await db.update(panditReviews)
        .set({ panditReply: parsed.data.reply.trim(), panditRepliedAt: new Date() })
        .where(and(
          eq(panditReviews.id, id),
          eq(panditReviews.panditId, req.panditId!),
        ))
        .returning();
      if (!upd.length) return res.status(404).json({ error: "Review not found" });
      res.json({ review: upd[0] });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ─────────── Customer: payment requests inbox ───────────
  app.get("/api/my/payment-requests", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      const id = await verifyUserIdentity(req, userId);
      if (!id.ok || !id.user) return res.status(403).json({ error: "Identity check failed" });
      const phone10 = (id.user.phone || "").replace(/\D/g, "").slice(-10);
      // Match by either explicit customerKey "u:<id>" OR phone-suffix so a
      // request raised against a phone-only client still surfaces once the
      // user signs up using that same phone number.
      const conditions = [eq(panditPaymentRequests.customerKey, `u:${userId}`)];
      if (phone10.length === 10) {
        conditions.push(sql`right(regexp_replace(coalesce(${panditPaymentRequests.customerPhone}, ''), '\\D', '', 'g'), 10) = ${phone10}`);
      }
      const rows = await db.select().from(panditPaymentRequests)
        .where(or(...conditions))
        .orderBy(desc(panditPaymentRequests.createdAt))
        .limit(50);
      // Join pandit display info so the UI can render a card without N+1.
      const panditIds = Array.from(new Set(rows.map((r) => r.panditId)));
      const panditRows = panditIds.length
        ? await db.select({ id: pandits.id, name: pandits.name, slug: pandits.slug, image: pandits.image })
            .from(pandits)
            .where(inArray(pandits.id, panditIds as any))
        : [];
      const byId = new Map(panditRows.map((p) => [p.id, p]));
      const requests = rows.map((r) => ({
        id: r.id,
        panditId: r.panditId,
        pandit: byId.get(r.panditId) || null,
        amountInr: r.amountInr,
        purpose: r.purpose,
        notes: r.notes,
        status: r.status,
        rpShortUrl: r.status === "pending" ? r.rpShortUrl : null,
        publicToken: r.status === "pending" ? r.publicToken : null,
        expiresAt: r.expiresAt,
        paidAt: r.paidAt,
        createdAt: r.createdAt,
      }));
      const summary = {
        pendingCount: requests.filter((r) => r.status === "pending").length,
        pendingValue: requests.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amountInr || 0), 0),
        paidCount: requests.filter((r) => r.status === "paid").length,
        paidValue: requests.filter((r) => r.status === "paid").reduce((s, r) => s + (r.amountInr || 0), 0),
      };
      res.json({ requests, summary });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ─────────── Customer: "your pandit remembers" feed ───────────
  app.get("/api/my/pandit-memories", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      const id = await verifyUserIdentity(req, userId);
      if (!id.ok || !id.user) return res.status(403).json({ error: "Identity check failed" });
      const phone10 = (id.user.phone || "").replace(/\D/g, "").slice(-10);
      const conditions = [eq(panditClientMemories.customerKey, `u:${userId}`)];
      if (phone10.length === 10) {
        conditions.push(sql`right(regexp_replace(coalesce(${panditClientMemories.customerPhone}, ''), '\\D', '', 'g'), 10) = ${phone10}`);
      }
      const rows = await db.select().from(panditClientMemories)
        .where(or(...conditions));
      const panditIds = Array.from(new Set(rows.map((r) => r.panditId)));
      const panditRows = panditIds.length
        ? await db.select({ id: pandits.id, name: pandits.name, slug: pandits.slug, image: pandits.image })
            .from(pandits)
            .where(inArray(pandits.id, panditIds as any))
        : [];
      const byId = new Map(panditRows.map((p) => [p.id, p]));
      // Compute next-occurrence and daysAway for the customer-facing card.
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const enriched = rows.map((r) => {
        let nextDate: string | null = null; let daysAway: number | null = null;
        if (r.dateText) {
          const d = new Date(r.dateText);
          if (!Number.isNaN(d.getTime())) {
            const ty = new Date(today.getFullYear(), d.getMonth(), d.getDate());
            const next = ty.getTime() < today.getTime()
              ? new Date(today.getFullYear() + 1, d.getMonth(), d.getDate())
              : ty;
            nextDate = next.toISOString().slice(0, 10);
            daysAway = Math.round((next.getTime() - today.getTime()) / 86400000);
          }
        }
        return {
          id: r.id, kind: r.kind, label: r.label, dateText: r.dateText, tithi: r.tithi,
          notes: r.notes, pandit: byId.get(r.panditId) || null, nextDate, daysAway,
        };
      }).sort((a, b) => (a.daysAway ?? 9999) - (b.daysAway ?? 9999));
      res.json({ memories: enriched });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ─────────── Admin: manual loyalty adjust ───────────
  const loyaltyAdjustSchema = z.object({
    delta: z.number().int().refine((n) => n !== 0, "delta cannot be zero"),
    reason: z.string().min(3).max(500),
  });
  app.post("/api/admin/users/:id/loyalty/adjust", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const parsed = loyaltyAdjustSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [u] = await db.select().from(users).where(eq(users.id, id)).limit(1);
      if (!u) return res.status(404).json({ error: "User not found" });

      // Atomic delta: never let a deduct take the balance below zero. We
      // use SQL GREATEST so two concurrent admins can't race into a negative.
      const [updated] = await db.update(users)
        .set({ loyaltyPoints: sql`GREATEST(0, COALESCE(${users.loyaltyPoints}, 0) + ${parsed.data.delta})` })
        .where(eq(users.id, id))
        .returning({ loyaltyPoints: users.loyaltyPoints });

      // Mirror entry into the ledger for an auditable trail.
      await db.insert(loyaltyTransactions).values({
        userId: id,
        points: parsed.data.delta,
        type: parsed.data.delta > 0 ? "admin_credit" : "admin_debit",
        reason: parsed.data.reason,
      } as any).catch(() => { /* non-fatal */ });

      // Best-effort customer notification.
      try {
        const { pushUserNotification } = await import("./dashboard-routes");
        await pushUserNotification({
          userId: id,
          kind: "loyalty_adjusted",
          title: parsed.data.delta > 0
            ? `You earned ${parsed.data.delta} loyalty points`
            : `${Math.abs(parsed.data.delta)} loyalty points adjusted`,
          body: parsed.data.reason,
          link: "/dashboard?tab=overview",
          meta: { delta: parsed.data.delta },
        });
      } catch {}

      res.json({ user: { id, loyaltyPoints: updated?.loyaltyPoints ?? 0 } });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ─────────── Admin: live pandit fleet ───────────
  app.get("/api/admin/pandits/online", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const cutoff = new Date(Date.now() - 5 * 60 * 1000);
      const rows = await db.select({ id: pandits.id, name: pandits.name, lastSeenAt: pandits.lastSeenAt })
        .from(pandits)
        .where(gt(pandits.lastSeenAt, cutoff));
      res.json({ online: rows, cutoff: cutoff.toISOString() });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });
}

// ──────────────── External wiring helpers (called from elsewhere) ──────
// Called by pandit-portal.ts when the customer drops a message into a
// booking chat — the pandit gets a notification with a deep link back to
// that booking's chat tab.
export async function notifyPanditOnCustomerMessage(opts: {
  panditId: number | null | undefined;
  bookingId: number;
  customerName: string;
  preview: string;
}): Promise<void> {
  if (!opts.panditId) return;
  await pushPanditNotification({
    panditId: opts.panditId,
    kind: "booking_message",
    title: `New message from ${opts.customerName}`,
    body: opts.preview.slice(0, 140),
    link: `/pandit-portal?tab=bookings&booking=${opts.bookingId}`,
    // 15-minute dedupe so a chat burst doesn't flood the inbox.
    dedupeKey: `chat:${opts.bookingId}`,
    dedupeWindowMin: 15,
  });
}

// Called when a new public review is posted for the pandit.
export async function notifyPanditOnNewReview(opts: {
  panditId: number;
  reviewerName: string;
  rating: number;
}): Promise<void> {
  await pushPanditNotification({
    panditId: opts.panditId,
    kind: "review_new",
    title: `New ${opts.rating}-star review from ${opts.reviewerName}`,
    body: "Tap to read and reply publicly.",
    link: "/pandit-portal?tab=reviews",
  });
}

// Called by pandit-crm.ts when a payment request is created — push to
// the matching customer (if we can identify them).
export async function notifyUserOnPaymentRequest(opts: {
  userId: number | null;
  panditName: string;
  amountInr: number;
  purpose: string;
  requestId: number;
}): Promise<void> {
  if (!opts.userId) return;
  try {
    const { pushUserNotification } = await import("./dashboard-routes");
    await pushUserNotification({
      userId: opts.userId,
      kind: "payment_request",
      title: `${opts.panditName} requested ₹${opts.amountInr}`,
      body: opts.purpose,
      link: "/dashboard?tab=payments",
      meta: { requestId: opts.requestId, amountInr: opts.amountInr },
      dedupeKey: `payreq:${opts.requestId}`,
    });
  } catch {}
}
