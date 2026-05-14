import type { Express, Request, Response } from "express";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { users, userNotifications, insertFamilyMemberSchema, insertUserNotificationSchema } from "@shared/schema";
import { and, eq, gt, sql } from "drizzle-orm";

// ─────────────────────────────────────────────────────────────────────
// Helper: confirm caller owns the userId being mutated. Mirrors the
// existing /api/my-bookings/:userId pattern used elsewhere in the app:
// the caller must supply the email currently on the user row, either
// in the body (`identityEmail`) or the `x-user-email` header. Raw body
// bypass is rejected for any mutation route.
// ─────────────────────────────────────────────────────────────────────
async function verifyUserIdentity(req: Request, userId: number): Promise<boolean> {
  if (!Number.isFinite(userId) || userId <= 0) return false;
  const claimed =
    String(req.body?.identityEmail || req.query?.email || req.header("x-user-email") || "")
      .trim()
      .toLowerCase();
  if (!claimed) return false;
  const [u] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u?.email) return false;
  return u.email.trim().toLowerCase() === claimed;
}

// Public helper used elsewhere in the codebase to push a notification
// into the user-facing inbox. Best-effort: a failure here MUST never
// block the underlying booking/order/payment flow.
export async function pushUserNotification(input: {
  userId: number | null | undefined;
  kind: string;
  title: string;
  body?: string;
  link?: string;
  meta?: Record<string, unknown> | null;
  dedupeKey?: string; // any stable string (e.g. `order:123:dispatched`)
  dedupeWindowMin?: number; // default 30
}): Promise<void> {
  try {
    if (!input.userId || !Number.isFinite(input.userId)) return;
    // Dedupe: skip if same userId+kind+dedupeKey was inserted within window.
    const dedupeKey = input.dedupeKey
      || (input.meta && (input.meta as any).orderId ? `order:${(input.meta as any).orderId}:${input.kind}` : null)
      || (input.meta && (input.meta as any).bookingId ? `booking:${(input.meta as any).bookingId}:${input.kind}` : null);
    if (dedupeKey) {
      const windowMin = input.dedupeWindowMin ?? 30;
      const cutoff = new Date(Date.now() - windowMin * 60 * 1000);
      const dup = await db.select({ id: userNotifications.id })
        .from(userNotifications)
        .where(and(
          eq(userNotifications.userId, input.userId),
          eq(userNotifications.kind, input.kind),
          gt(userNotifications.createdAt, cutoff),
          sql`${userNotifications.meta}->>'dedupeKey' = ${dedupeKey}`,
        ))
        .limit(1);
      if (dup.length > 0) return;
    }
    const meta = { ...(input.meta || {}), ...(dedupeKey ? { dedupeKey } : {}) };
    await storage.createUserNotification({
      userId: input.userId,
      kind: input.kind,
      title: input.title,
      body: input.body || null,
      link: input.link || null,
      meta: meta as any,
    } as any);
  } catch (err: any) {
    console.warn("[user-notifications] push failed:", err?.message || err);
  }
}

// Single source of truth for order-status notifications. Safe to call
// from any code path that mutates orders.status; the dedupe in
// pushUserNotification prevents duplicates within a 30-minute window.
const ORDER_STATUS_NOTIF: Record<string, { kind: string; title: (id: number) => string; body: string }> = {
  paid:             { kind: "order_paid",      title: (id) => `Payment received for order #${id}`, body: "Your order is confirmed. We will dispatch it shortly." },
  confirmed:        { kind: "order_confirmed", title: (id) => `Order #${id} confirmed`,            body: "Thank you. Your order is in the queue for dispatch." },
  dispatched:       { kind: "order_shipped",   title: (id) => `Order #${id} dispatched`,           body: "Your order is on its way. Tap to track delivery." },
  out_for_delivery: { kind: "order_shipped",   title: (id) => `Order #${id} out for delivery`,     body: "Your order is out for delivery today." },
  delivered:        { kind: "order_delivered", title: (id) => `Order #${id} delivered`,            body: "Hope you love it. Please leave a review when you have a moment." },
  cancelled:        { kind: "order_cancelled", title: (id) => `Order #${id} cancelled`,            body: "Your order has been cancelled." },
  refunded:         { kind: "refund_initiated",title: (id) => `Refund for order #${id} initiated`, body: "The refund will reflect in 5–7 business days." },
  failed:           { kind: "order_failed",    title: (id) => `Payment for order #${id} failed`,   body: "Please retry payment from your order history." },
};

export async function notifyOrderStatusChange(
  order: { id: number; userId?: number | null } | null | undefined,
  newStatus: string | null | undefined,
  extra?: { reason?: string | null },
): Promise<void> {
  try {
    if (!order || !order.id || !order.userId || !newStatus) return;
    const cfg = ORDER_STATUS_NOTIF[newStatus];
    if (!cfg) return;
    await pushUserNotification({
      userId: order.userId,
      kind: cfg.kind,
      title: cfg.title(order.id),
      body: extra?.reason ? `${cfg.body} Reason: ${extra.reason}` : cfg.body,
      link: `/order-history`,
      meta: { orderId: order.id, status: newStatus },
      dedupeKey: `order:${order.id}:${newStatus}`,
    });
  } catch {}
}

export function registerDashboardRoutes(app: Express): void {
  // ─────────────── Family Profiles ───────────────
  app.get("/api/family-members", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (!(await verifyUserIdentity(req, userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const rows = await storage.listFamilyMembers(userId);
      res.json({ members: rows });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to load family members" });
    }
  });

  app.post("/api/family-members", async (req: Request, res: Response) => {
    try {
      const parsed = insertFamilyMemberSchema.parse(req.body) as { userId: number; [k: string]: unknown };
      if (!(await verifyUserIdentity(req, parsed.userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const row = await storage.createFamilyMember(parsed as any);
      res.status(201).json({ member: row });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", issues: e.issues });
      res.status(500).json({ message: e?.message || "Failed to create family member" });
    }
  });

  app.patch("/api/family-members/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = Number(req.body?.userId);
      if (!(await verifyUserIdentity(req, userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const partial = insertFamilyMemberSchema.partial().parse(req.body);
      const row = await storage.updateFamilyMember(id, userId, partial);
      if (!row) return res.status(404).json({ message: "Not found" });
      res.json({ member: row });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Invalid input", issues: e.issues });
      res.status(500).json({ message: e?.message || "Failed to update family member" });
    }
  });

  app.delete("/api/family-members/:id", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = Number(req.query?.userId);
      if (!(await verifyUserIdentity(req, userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const ok = await storage.deleteFamilyMember(id, userId);
      if (!ok) return res.status(404).json({ message: "Not found" });
      res.json({ ok: true });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to delete family member" });
    }
  });

  // ─────────────── User Notifications inbox ───────────────
  app.get("/api/notifications", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      if (!(await verifyUserIdentity(req, userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const limit = Math.min(Math.max(Number(req.query.limit ?? 50), 1), 200);
      const unreadOnly = String(req.query.unread || "") === "1";
      const [items, unread] = await Promise.all([
        storage.listUserNotifications(userId, { limit, unreadOnly }),
        storage.unreadNotificationCount(userId),
      ]);
      res.json({ items, unread });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to load notifications" });
    }
  });

  app.post("/api/notifications/:id/read", async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      const userId = Number(req.body?.userId);
      if (!(await verifyUserIdentity(req, userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const ok = await storage.markUserNotificationRead(id, userId);
      res.json({ ok });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.post("/api/notifications/mark-all-read", async (req: Request, res: Response) => {
    try {
      const userId = Number(req.body?.userId);
      if (!(await verifyUserIdentity(req, userId))) {
        return res.status(403).json({ message: "Identity check failed" });
      }
      const n = await storage.markAllUserNotificationsRead(userId);
      res.json({ updated: n });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });
}
