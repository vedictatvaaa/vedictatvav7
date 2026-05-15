import type { Express, Request, Response, NextFunction } from "express";
import bcrypt from "bcryptjs";
import { randomBytes } from "crypto";
import { db } from "./db";
import {
  pandits,
  panditSessions,
  pujaBookings,
  pujaBookingMessages,
  pujaTips,
  insertPujaBookingMessageSchema,
} from "@shared/schema";
import { and, desc, eq, gt, gte, inArray, lte, sql } from "drizzle-orm";
import { z } from "zod";

const SESSION_TTL_DAYS = 30;

function newToken() {
  return randomBytes(32).toString("hex");
}

// ---------------------------------------------------------------------------
// In-memory live availability heartbeat. Pandit's portal pings every 60s while
// the tab is open; pandit is "online now" if last heartbeat was within 5 min.
// Intentionally non-persistent: process restart = everyone offline until they
// re-open the portal. Avoids a DB write storm from 100s of pandit tabs.
// ---------------------------------------------------------------------------
const HEARTBEAT_TTL_MS = 5 * 60 * 1000; // 5 minutes
const heartbeats = new Map<number, number>();
export function isPanditOnline(panditId: number): boolean {
  const ts = heartbeats.get(panditId);
  return !!ts && Date.now() - ts < HEARTBEAT_TTL_MS;
}
export function panditLastSeenSecondsAgo(panditId: number): number | null {
  const ts = heartbeats.get(panditId);
  return ts ? Math.floor((Date.now() - ts) / 1000) : null;
}

export interface PanditRequest extends Request {
  panditId?: number;
}

export async function validatePanditSession(token?: string): Promise<number | null> {
  if (!token) return null;
  const rows = await db
    .select()
    .from(panditSessions)
    .where(and(eq(panditSessions.token, token), gt(panditSessions.expiresAt, new Date())))
    .limit(1);
  if (!rows.length) return null;
  return rows[0].panditId;
}

export function panditAuthMiddleware(req: PanditRequest, res: Response, next: NextFunction) {
  const token = (req.headers["x-pandit-token"] as string | undefined) || (req.cookies?.pandit_token as string | undefined);
  validatePanditSession(token)
    .then((id) => {
      if (!id) return res.status(401).json({ error: "Pandit authentication required" });
      req.panditId = id;
      next();
    })
    .catch(() => res.status(500).json({ error: "Auth check failed" }));
}

async function ensureMessagesAccessForBooking(bookingId: number, panditId: number) {
  const rows = await db.select().from(pujaBookings).where(eq(pujaBookings.id, bookingId)).limit(1);
  if (!rows.length) return null;
  if (rows[0].panditId !== panditId) return null;
  return rows[0];
}

export function registerPanditPortalRoutes(app: Express) {
  // ----- Auth -----
  app.post("/api/pandit/login", async (req, res) => {
    try {
      const schema = z.object({ phone: z.string().min(6), password: z.string().min(1) });
      const { phone, password } = schema.parse(req.body);
      const norm = phone.replace(/\D/g, "").slice(-10);
      const rows = await db.select().from(pandits).where(eq(pandits.phone, norm)).limit(1);
      if (!rows.length) return res.status(401).json({ error: "Invalid phone or password" });
      const p = rows[0];
      let firstTime = false;
      if (!p.passwordHash) {
        // First-time login bootstrap. Disabled in production by default to prevent account hijacking.
        const allowBootstrap = process.env.PANDIT_ALLOW_PHONE_BOOTSTRAP === "true" || process.env.NODE_ENV !== "production";
        if (!allowBootstrap) {
          return res.status(401).json({ error: "Account not yet activated. Please ask admin to set your initial password." });
        }
        if (password.replace(/\D/g, "").slice(-10) !== norm) {
          return res.status(401).json({ error: "First-time login: use your phone number as password" });
        }
        firstTime = true;
      } else {
        const ok = await bcrypt.compare(password, p.passwordHash);
        if (!ok) return res.status(401).json({ error: "Invalid phone or password" });
      }
      const token = newToken();
      const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400 * 1000);
      await db.insert(panditSessions).values({ panditId: p.id, token, expiresAt });
      await db.update(pandits).set({ lastLoginAt: new Date() }).where(eq(pandits.id, p.id));
      res.cookie("pandit_token", token, { httpOnly: true, sameSite: "lax", maxAge: SESSION_TTL_DAYS * 86400 * 1000 });
      res.json({ ok: true, token, mustChangePassword: firstTime, pandit: { id: p.id, name: p.name, city: p.city, image: p.image } });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: e.issues });
      res.status(500).json({ error: e?.message });
    }
  });

  app.post("/api/pandit/logout", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const token = (req.headers["x-pandit-token"] as string | undefined) || (req.cookies?.pandit_token as string | undefined);
    if (token) await db.delete(panditSessions).where(eq(panditSessions.token, token));
    res.clearCookie("pandit_token");
    res.json({ ok: true });
  });

  app.post("/api/pandit/change-password", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const schema = z.object({ newPassword: z.string().min(6) });
      const { newPassword } = schema.parse(req.body);
      const hash = await bcrypt.hash(newPassword, 10);
      await db.update(pandits).set({ passwordHash: hash }).where(eq(pandits.id, req.panditId!));
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Password must be 6+ chars" });
      res.status(500).json({ error: e?.message });
    }
  });

  app.get("/api/pandit/me", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const rows = await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1);
    if (!rows.length) return res.status(404).json({ error: "Not found" });
    const { passwordHash, ...safe } = rows[0] as any;
    res.json({ pandit: safe, mustChangePassword: !passwordHash, isOnline: isPanditOnline(req.panditId!) });
  });

  // Live heartbeat — called from the pandit portal every ~60s.
  app.post("/api/pandit/heartbeat", panditAuthMiddleware, (req: PanditRequest, res) => {
    heartbeats.set(req.panditId!, Date.now());
    res.json({ ok: true, ttlMs: HEARTBEAT_TTL_MS });
  });

  // Manual "go offline" toggle — pandit can hide their live dot without logging out.
  app.post("/api/pandit/availability/offline", panditAuthMiddleware, (req: PanditRequest, res) => {
    heartbeats.delete(req.panditId!);
    res.json({ ok: true });
  });

  // On-leave toggle. Persists to DB so the public listing + admin tools see
  // it across devices; complements (does not replace) the in-memory heartbeat.
  app.post("/api/pandit/availability/leave", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const schema = z.object({
        onLeave: z.boolean(),
        leaveNote: z.string().max(240).optional().or(z.literal("")),
      });
      const body = schema.parse(req.body || {});
      const note = (body.leaveNote || "").trim();
      const now = new Date();
      await db.update(pandits)
        .set({
          onLeave: body.onLeave,
          leaveNote: body.onLeave ? (note || null) : null,
          leaveStartedAt: body.onLeave ? now : null,
        })
        .where(eq(pandits.id, req.panditId!));
      // While on leave, drop any active heartbeat so the public "online" dot
      // turns off immediately without waiting for the 5-min TTL.
      if (body.onLeave) heartbeats.delete(req.panditId!);
      res.json({ ok: true, onLeave: body.onLeave, leaveNote: body.onLeave ? (note || null) : null });
    } catch (e: any) {
      res.status(400).json({ error: e?.message || "Invalid request" });
    }
  });

  // ----- Bookings list (calendar + dashboard) -----
  app.get("/api/pandit/bookings", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const status = (req.query.status as string | undefined)?.toLowerCase();
      const conditions = [eq(pujaBookings.panditId, req.panditId!)];
      if (status && ["pending", "accepted", "completed", "declined", "cancelled"].includes(status)) {
        conditions.push(eq(pujaBookings.status, status));
      }
      const rows = await db
        .select()
        .from(pujaBookings)
        .where(and(...conditions))
        .orderBy(desc(pujaBookings.date), desc(pujaBookings.id))
        .limit(200);
      res.json({ bookings: rows });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.get("/api/pandit/bookings/calendar", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const month = (req.query.month as string) || new Date().toISOString().slice(0, 7);
      const start = `${month}-01`;
      const endDate = new Date(`${month}-01T00:00:00Z`);
      endDate.setUTCMonth(endDate.getUTCMonth() + 1);
      const end = endDate.toISOString().slice(0, 10);
      const rows = await db
        .select()
        .from(pujaBookings)
        .where(and(eq(pujaBookings.panditId, req.panditId!), gte(pujaBookings.date, start), lte(pujaBookings.date, end)));
      res.json({ month, bookings: rows });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.get("/api/pandit/stats", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const all = await db.select().from(pujaBookings).where(eq(pujaBookings.panditId, req.panditId!));
      const pending = all.filter((b) => b.status === "pending").length;
      const upcoming = all.filter((b) => b.status === "accepted").length;
      const completed = all.filter((b) => b.status === "completed").length;
      const totalEarn = all.filter((b) => b.status === "completed").reduce((s, b) => s + (b.totalAmount || 0), 0);
      const tips = await db.select().from(pujaTips).where(and(eq(pujaTips.panditId, req.panditId!), eq(pujaTips.status, "paid")));
      const tipsTotal = tips.reduce((s, t) => s + (t.amountInr || 0), 0);
      res.json({ pending, upcoming, completed, totalEarningsInr: totalEarn, tipsInr: tipsTotal, tipsCount: tips.length });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ----- Booking actions -----
  app.post("/api/pandit/bookings/:id/accept", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const id = Number(req.params.id);
      const schema = z.object({ confirmedTimeSlot: z.string().min(1).optional(), message: z.string().optional() });
      const { confirmedTimeSlot, message } = schema.parse(req.body);
      const booking = await ensureMessagesAccessForBooking(id, req.panditId!);
      if (!booking) return res.status(404).json({ error: "Booking not found or not assigned to you" });
      const slot = confirmedTimeSlot || booking.timeSlot;
      // Atomic transition guard: only accept from pending/requested. Prevents
      // re-firing notifications on duplicate clicks or stale tabs.
      const updated = await db.update(pujaBookings)
        .set({ status: "accepted", acceptedAt: new Date(), confirmedTimeSlot: slot })
        .where(and(eq(pujaBookings.id, id), inArray(pujaBookings.status, ["pending", "requested", "assigned"])))
        .returning({ id: pujaBookings.id });
      if (updated.length === 0) {
        return res.status(409).json({ error: "Booking is no longer pending — refresh to see the latest status." });
      }
      const pandit = (await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1))[0];
      await db.insert(pujaBookingMessages).values({
        bookingId: id,
        senderType: "system",
        senderName: "Vedic Tatva",
        message: `🙏 ${pandit?.name || "Panditji"} has accepted your booking. Time confirmed: ${slot}.`,
      });
      if (message) {
        await db.insert(pujaBookingMessages).values({ bookingId: id, senderType: "pandit", senderName: pandit?.name || "Panditji", message });
      }
      try {
        const { pushUserNotification } = await import("./dashboard-routes");
        await pushUserNotification({
          userId: booking.userId,
          kind: "booking_accepted",
          title: `${pandit?.name || "Panditji"} accepted your booking`,
          body: `Time confirmed: ${slot}. Tap to open chat.`,
          link: `/my-puja-booking/${id}`,
          meta: { bookingId: id },
        });
      } catch {}
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
      res.status(500).json({ error: e?.message });
    }
  });

  app.post("/api/pandit/bookings/:id/decline", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const id = Number(req.params.id);
      const reason = String(req.body?.reason || "Pandit unavailable");
      const booking = await ensureMessagesAccessForBooking(id, req.panditId!);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      const updated = await db.update(pujaBookings)
        .set({ status: "declined", declineReason: reason })
        .where(and(eq(pujaBookings.id, id), inArray(pujaBookings.status, ["pending", "requested", "assigned"])))
        .returning({ id: pujaBookings.id });
      if (updated.length === 0) {
        return res.status(409).json({ error: "Booking is no longer pending — refresh to see the latest status." });
      }
      await db.insert(pujaBookingMessages).values({ bookingId: id, senderType: "system", senderName: "Vedic Tatva", message: `Booking declined. Reason: ${reason}. Our team will reassign another panditji.` });
      try {
        const { pushUserNotification } = await import("./dashboard-routes");
        await pushUserNotification({
          userId: booking.userId,
          kind: "booking_declined",
          title: "Your booking needs reassignment",
          body: `Reason: ${reason}. We are arranging another panditji for you.`,
          link: `/my-puja-booking/${id}`,
          meta: { bookingId: id },
        });
      } catch {}
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pandit/bookings/:id/complete", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await ensureMessagesAccessForBooking(id, req.panditId!);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      const updated = await db.update(pujaBookings)
        .set({ status: "completed", completedAt: new Date() })
        .where(and(eq(pujaBookings.id, id), eq(pujaBookings.status, "accepted")))
        .returning({ id: pujaBookings.id });
      if (updated.length === 0) {
        return res.status(409).json({ error: "Booking must be accepted before it can be completed." });
      }
      const pandit = (await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1))[0];
      await db.insert(pujaBookingMessages).values({ bookingId: id, senderType: "system", senderName: "Vedic Tatva", message: `Puja completed by ${pandit?.name || "Panditji"} 🪔. Thank you for choosing Vedic Tatva.` });
      try {
        const { pushUserNotification } = await import("./dashboard-routes");
        await pushUserNotification({
          userId: booking.userId,
          kind: "booking_completed",
          title: "Your puja is complete",
          body: `${pandit?.name || "Panditji"} marked the puja complete. Please rate your experience.`,
          link: `/my-bookings`,
          meta: { bookingId: id },
        });
      } catch {}
      // Award loyalty points for completed puja
      if (booking.userId) {
        try {
          const { awardPoints } = await import("./wave1");
          const earned = await awardPoints(booking.userId, booking.totalAmount || 0, "puja_completed", "puja_booking", booking.id);
          if (earned > 0) {
            await db.insert(pujaBookingMessages).values({ bookingId: id, senderType: "system", senderName: "Vedic Tatva", message: `🎁 You earned ${earned} loyalty points for this puja.` });
          }
        } catch (e: any) { console.warn("[loyalty] award failed:", e?.message); }
      }
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pandit/bookings/:id/samagri", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const id = Number(req.params.id);
      const schema = z.object({
        items: z.array(z.object({ name: z.string().min(1), qty: z.string().optional(), note: z.string().optional() })),
        notifyCustomer: z.boolean().default(true),
      });
      const { items, notifyCustomer } = schema.parse(req.body);
      const booking = await ensureMessagesAccessForBooking(id, req.panditId!);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      await db.update(pujaBookings).set({ samagriList: items, samagriSentAt: new Date() }).where(eq(pujaBookings.id, id));
      if (notifyCustomer) {
        const pandit = (await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1))[0];
        const list = items.map((i) => `• ${i.name}${i.qty ? ` — ${i.qty}` : ""}`).join("\n");
        await db.insert(pujaBookingMessages).values({
          bookingId: id,
          senderType: "pandit",
          senderName: pandit?.name || "Panditji",
          message: `🪷 Samagri list for your puja:\n\n${list}\n\nPlease arrange these before the muhurat. You can also order them from Vedic Tatva.`,
        });
      }
      res.json({ ok: true });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
      res.status(500).json({ error: e?.message });
    }
  });

  // ----- Messaging (pandit side) -----
  app.get("/api/pandit/bookings/:id/messages", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await ensureMessagesAccessForBooking(id, req.panditId!);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      const msgs = await db.select().from(pujaBookingMessages).where(eq(pujaBookingMessages.bookingId, id)).orderBy(pujaBookingMessages.id);
      // mark customer-sent as read by pandit
      await db.update(pujaBookingMessages).set({ readByPandit: true }).where(and(eq(pujaBookingMessages.bookingId, id), eq(pujaBookingMessages.senderType, "customer")));
      res.json({ booking, messages: msgs });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pandit/bookings/:id/messages", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const id = Number(req.params.id);
      const booking = await ensureMessagesAccessForBooking(id, req.panditId!);
      if (!booking) return res.status(404).json({ error: "Booking not found" });
      if (booking.status === "completed" || booking.status === "declined" || booking.status === "cancelled") {
        return res.status(403).json({ error: "Chat closed for this booking" });
      }
      const schema = z.object({ message: z.string().min(1).max(2000) });
      const { message } = schema.parse(req.body);
      const pandit = (await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1))[0];
      const [row] = await db.insert(pujaBookingMessages).values({
        bookingId: id,
        senderType: "pandit",
        senderName: pandit?.name || "Panditji",
        message,
      }).returning();
      res.json({ message: row });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
      res.status(500).json({ error: e?.message });
    }
  });

  // ----- Customer-facing booking endpoints -----
  app.get("/api/puja-bookings/:id/messages", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const phone = (req.query.phone as string | undefined)?.replace(/\D/g, "").slice(-10);
      const token = (req.query.t as string | undefined) || undefined;
      const rows = await db.select().from(pujaBookings).where(eq(pujaBookings.id, id)).limit(1);
      if (!rows.length) return res.status(404).json({ error: "Booking not found" });
      const uid = req.query.uid ? Number(req.query.uid) : null;
      const email = String(req.query.email || "").toLowerCase().trim();
      const phoneOk = phone && rows[0].contactPhone.replace(/\D/g, "").slice(-10) === phone;
      const tokenOk = token && rows[0].accessToken && token === rows[0].accessToken;
      // Logged-in owner check: must own the booking AND prove identity by email matching the user record
      let userOk = false;
      if (uid && email && rows[0].userId === uid) {
        const { storage } = await import("./storage");
        const u = await storage.getUser(uid);
        if (u && u.email.toLowerCase() === email) userOk = true;
      }
      // Logged-in owner OR (token+phone) for new bookings OR phone-only for legacy bookings.
      const allowed = userOk || (rows[0].accessToken ? (phoneOk && tokenOk) : phoneOk);
      if (!allowed) {
        return res.status(403).json({ error: "Access denied — open this page from the link in your booking SMS/email." });
      }
      const msgs = await db.select().from(pujaBookingMessages).where(eq(pujaBookingMessages.bookingId, id)).orderBy(pujaBookingMessages.id);
      await db.update(pujaBookingMessages).set({ readByCustomer: true }).where(and(eq(pujaBookingMessages.bookingId, id), inArray(pujaBookingMessages.senderType, ["pandit", "system"])));
      let panditPublic: any = null;
      if (rows[0].panditId) {
        const p = (await db.select().from(pandits).where(eq(pandits.id, rows[0].panditId)).limit(1))[0];
        if (p) panditPublic = { id: p.id, name: p.name, city: p.city, image: p.image, phone: p.phone, rating: p.rating };
      }
      res.json({ booking: rows[0], messages: msgs, pandit: panditPublic });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/puja-bookings/:id/messages", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const schema = z.object({ phone: z.string().min(6), token: z.string().optional(), message: z.string().min(1).max(2000) });
      const { phone, token, message } = schema.parse(req.body);
      const rows = await db.select().from(pujaBookings).where(eq(pujaBookings.id, id)).limit(1);
      if (!rows.length) return res.status(404).json({ error: "Booking not found" });
      const p10 = phone.replace(/\D/g, "").slice(-10);
      const phoneOk = rows[0].contactPhone.replace(/\D/g, "").slice(-10) === p10;
      const tokenOk = token && rows[0].accessToken && token === rows[0].accessToken;
      const allowed = rows[0].accessToken ? (phoneOk && tokenOk) : phoneOk;
      if (!allowed) return res.status(403).json({ error: "Access denied" });
      if (rows[0].status === "completed" || rows[0].status === "declined" || rows[0].status === "cancelled") {
        return res.status(403).json({ error: "Chat closed for this booking" });
      }
      const [row] = await db.insert(pujaBookingMessages).values({
        bookingId: id,
        senderType: "customer",
        senderName: rows[0].contactName,
        message,
      }).returning();

      // Cross-surface handshake: drop a notification into the assigned
      // pandit's inbox so they don't have to keep refreshing the chat tab.
      try {
        const { notifyPanditOnCustomerMessage } = await import("./portal-sync");
        await notifyPanditOnCustomerMessage({
          panditId: rows[0].panditId,
          bookingId: id,
          customerName: rows[0].contactName,
          preview: message,
        });
      } catch {}

      res.json({ message: row });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
      res.status(500).json({ error: e?.message });
    }
  });

  // ----- Tip system -----
  app.post("/api/puja-bookings/:id/tip", async (req, res) => {
    try {
      const id = Number(req.params.id);
      const schema = z.object({
        phone: z.string().min(6),
        token: z.string().optional(),
        amountInr: z.number().int().min(11).max(100000),
        message: z.string().max(280).optional(),
        paymentRef: z.string().optional(),
      });
      const { phone, token, amountInr, message, paymentRef } = schema.parse(req.body);
      const rows = await db.select().from(pujaBookings).where(eq(pujaBookings.id, id)).limit(1);
      if (!rows.length) return res.status(404).json({ error: "Booking not found" });
      const p10 = phone.replace(/\D/g, "").slice(-10);
      const phoneOk = rows[0].contactPhone.replace(/\D/g, "").slice(-10) === p10;
      const tokenOk = token && rows[0].accessToken && token === rows[0].accessToken;
      const allowed = rows[0].accessToken ? (phoneOk && tokenOk) : phoneOk;
      if (!allowed) return res.status(403).json({ error: "Access denied" });
      if (!rows[0].panditId) return res.status(400).json({ error: "No pandit assigned yet" });

      const status = paymentRef ? "paid" : "pending";
      const [tip] = await db.insert(pujaTips).values({
        bookingId: id,
        panditId: rows[0].panditId,
        userId: rows[0].userId || null,
        amountInr,
        paymentMethod: "razorpay",
        paymentRef: paymentRef || null,
        status,
        message: message || null,
      } as any).returning();

      if (status === "paid") {
        await db.update(pujaBookings).set({
          tipAmountInr: sql`${pujaBookings.tipAmountInr} + ${amountInr}`,
          tipPaidAt: new Date(),
        }).where(eq(pujaBookings.id, id));
        await db.insert(pujaBookingMessages).values({
          bookingId: id,
          senderType: "system",
          senderName: "Vedic Tatva",
          message: `🙏 ${rows[0].contactName} sent ₹${amountInr} dakshina to Panditji${message ? `: "${message}"` : ""}.`,
        });
      }
      res.json({ ok: true, tip });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed" });
      res.status(500).json({ error: e?.message });
    }
  });

  app.get("/api/pandit/tips", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const tips = await db.select().from(pujaTips).where(eq(pujaTips.panditId, req.panditId!)).orderBy(desc(pujaTips.id)).limit(100);
      res.json({ tips });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ----- Admin helper -----
  app.post("/api/admin/pandits/:id/reset-password", async (req, res) => {
    try {
      const adminToken = req.headers["x-admin-token"] as string | undefined;
      const { validateAdminSession } = await import("./admin-auth");
      const adminId = await validateAdminSession(adminToken || "");
      if (!adminId) return res.status(401).json({ error: "Admin auth required" });
      const id = Number(req.params.id);
      await db.update(pandits).set({ passwordHash: null }).where(eq(pandits.id, id));
      res.json({ ok: true, note: "Pandit can now login with their phone number as initial password and must change it." });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });
}
