import type { Express, Response } from "express";
import { db } from "./db";
import {
  panditClientMemories, panditPaymentRequests, pujaBookings, pandits,
  insertPanditClientMemorySchema, insertPanditPaymentRequestSchema,
} from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { z } from "zod";
import { randomBytes } from "crypto";
import { panditAuthMiddleware, type PanditRequest } from "./pandit-portal";
import Razorpay from "razorpay";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

const writeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: any) => `${req.panditId || "anon"}:${ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown")}`,
});

const memoryUpdateSchema = insertPanditClientMemorySchema.partial().omit({ panditId: true });
const paymentUpdateSchema = z.object({
  status: z.enum(["cancelled", "paid"]).optional(),
  manualPaidNote: z.string().max(400).optional(),
});

function getRazorpayClient(): Razorpay | null {
  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keyId || !keySecret) return null;
  try { return new Razorpay({ key_id: keyId, key_secret: keySecret }); } catch { return null; }
}

export function registerPanditCrmRoutes(app: Express) {
  // ----- Client memories (special tithis / anniversaries) -----
  app.get("/api/pandit/memories", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await db.select().from(panditClientMemories)
        .where(eq(panditClientMemories.panditId, req.panditId!))
        .orderBy(desc(panditClientMemories.createdAt));
      res.json({ memories: rows });
    } catch (e: any) { res.status(500).json({ error: e?.message || "Failed to load memories" }); }
  });

  app.get("/api/pandit/memories/upcoming", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await db.select().from(panditClientMemories)
        .where(eq(panditClientMemories.panditId, req.panditId!));
      const now = new Date();
      // Normalize "today" to local-midnight so an event whose date == today
      // shows as daysAway=0 instead of being treated as already passed.
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const horizon = 60;
      const upcoming = rows
        .map((r) => {
          if (!r.dateText) return null;
          const d = new Date(r.dateText);
          if (Number.isNaN(d.getTime())) return null;
          const thisYear = new Date(today.getFullYear(), d.getMonth(), d.getDate());
          const next = thisYear.getTime() < today.getTime()
            ? new Date(today.getFullYear() + 1, d.getMonth(), d.getDate())
            : thisYear;
          const daysAway = Math.round((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          return daysAway <= horizon ? { memory: r, nextDate: next.toISOString().slice(0, 10), daysAway } : null;
        })
        .filter(Boolean)
        .sort((a: any, b: any) => a.daysAway - b.daysAway);
      res.json({ upcoming });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pandit/memories", panditAuthMiddleware, writeLimiter, async (req: PanditRequest, res: Response) => {
    try {
      const parsed = insertPanditClientMemorySchema.safeParse({ ...req.body, panditId: req.panditId });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [row] = await db.insert(panditClientMemories).values(parsed.data).returning();
      res.json({ memory: row });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.patch("/api/pandit/memories/:id", panditAuthMiddleware, writeLimiter, async (req: PanditRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const parsed = memoryUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      const [existing] = await db.select().from(panditClientMemories).where(eq(panditClientMemories.id, id)).limit(1);
      if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ error: "Not found" });
      const [row] = await db.update(panditClientMemories).set(parsed.data).where(eq(panditClientMemories.id, id)).returning();
      res.json({ memory: row });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.delete("/api/pandit/memories/:id", panditAuthMiddleware, writeLimiter, async (req: PanditRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const [existing] = await db.select().from(panditClientMemories).where(eq(panditClientMemories.id, id)).limit(1);
      if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ error: "Not found" });
      await db.delete(panditClientMemories).where(eq(panditClientMemories.id, id));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // Convenience: list memories scoped to one customer key (used inside the
  // customer drill dialog).
  app.get("/api/pandit/customers/:key/memories", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const key = String(req.params.key || "");
      const rows = await db.select().from(panditClientMemories)
        .where(and(eq(panditClientMemories.panditId, req.panditId!), eq(panditClientMemories.customerKey, key)))
        .orderBy(desc(panditClientMemories.createdAt));
      res.json({ memories: rows });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ----- Payment requests -----
  app.get("/api/pandit/payment-requests", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await db.select().from(panditPaymentRequests)
        .where(eq(panditPaymentRequests.panditId, req.panditId!))
        .orderBy(desc(panditPaymentRequests.createdAt));
      res.json({
        requests: rows,
        summary: {
          pendingCount: rows.filter((r) => r.status === "pending").length,
          paidCount: rows.filter((r) => r.status === "paid").length,
          pendingValue: rows.filter((r) => r.status === "pending").reduce((s, r) => s + (r.amountInr || 0), 0),
          paidValue: rows.filter((r) => r.status === "paid").reduce((s, r) => s + (r.amountInr || 0), 0),
        },
      });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pandit/payment-requests", panditAuthMiddleware, writeLimiter, async (req: PanditRequest, res: Response) => {
    try {
      const parsed = insertPanditPaymentRequestSchema.safeParse({ ...req.body, panditId: req.panditId });
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });
      if (parsed.data.amountInr < 1 || parsed.data.amountInr > 200000) {
        return res.status(400).json({ error: "Amount must be between ₹1 and ₹2,00,000" });
      }

      const [pandit] = await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1);
      const expiresAt = parsed.data.expiresAt ? new Date(parsed.data.expiresAt as any) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      const publicToken = randomBytes(16).toString("hex");
      const initialValues = { ...parsed.data, expiresAt, status: "pending" as const, publicToken };

      // Try to mint a Razorpay payment link. If the SDK or keys are missing,
      // fall back to a row without a hosted link — the pandit can still share
      // UPI details manually and mark paid.
      const rp = getRazorpayClient();
      let rpLinkId: string | null = null;
      let rpShortUrl: string | null = null;
      if (rp) {
        try {
          const link: any = await (rp as any).paymentLink.create({
            amount: parsed.data.amountInr * 100,
            currency: "INR",
            accept_partial: false,
            description: `${parsed.data.purpose} — ${pandit?.name || "Vedic Tatva pandit"}`,
            customer: {
              name: parsed.data.customerName,
              contact: parsed.data.customerPhone,
              email: parsed.data.customerEmail || undefined,
            },
            notify: {
              sms: !!parsed.data.customerPhone,
              email: !!parsed.data.customerEmail,
            },
            reminder_enable: true,
            notes: { panditId: String(req.panditId), purpose: parsed.data.purpose.slice(0, 200) },
            expire_by: Math.floor(expiresAt.getTime() / 1000),
          });
          rpLinkId = link?.id || null;
          rpShortUrl = link?.short_url || null;
        } catch (e: any) {
          console.warn("[pandit-crm] payment-link create failed:", e?.message || e);
        }
      }

      const [row] = await db.insert(panditPaymentRequests).values({
        ...initialValues, rpLinkId, rpShortUrl,
      } as any).returning();

      // Cross-surface handshake: try to identify the matching customer and
      // push a notification into their dashboard inbox so they can pay
      // straight from /dashboard?tab=payments instead of relying on SMS/email.
      try {
        const { resolveUserIdForCustomer, notifyUserOnPaymentRequest } = await import("./portal-sync");
        const userId = await resolveUserIdForCustomer({
          customerKey: parsed.data.customerKey,
          customerPhone: parsed.data.customerPhone,
        });
        await notifyUserOnPaymentRequest({
          userId,
          panditName: pandit?.name || "Your pandit",
          amountInr: parsed.data.amountInr,
          purpose: parsed.data.purpose,
          requestId: row.id,
        });
      } catch {}

      res.json({ request: row });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.patch("/api/pandit/payment-requests/:id", panditAuthMiddleware, writeLimiter, async (req: PanditRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      const parsed = paymentUpdateSchema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

      // Atomic conditional update: only flip status if it is still "pending"
      // AND the row belongs to this pandit. If 0 rows are returned, the
      // request was already paid/cancelled by a concurrent call (or doesn't
      // belong to this pandit) — return 409 Conflict so the UI can refresh.
      const patch: Record<string, any> = {};
      if (parsed.data.status === "cancelled") {
        patch.status = "cancelled";
      } else if (parsed.data.status === "paid") {
        patch.status = "paid";
        patch.paidAt = new Date();
        patch.manualPaidNote = parsed.data.manualPaidNote || "Marked paid by pandit (cash/UPI received off-platform)";
      } else {
        return res.status(400).json({ error: "Status must be 'cancelled' or 'paid'" });
      }

      const updated = await db.update(panditPaymentRequests)
        .set(patch)
        .where(and(
          eq(panditPaymentRequests.id, id),
          eq(panditPaymentRequests.panditId, req.panditId!),
          eq(panditPaymentRequests.status, "pending"),
        ))
        .returning();
      if (!updated.length) {
        // Distinguish "not yours" from "already finalized" for a friendlier error.
        const [existing] = await db.select().from(panditPaymentRequests).where(eq(panditPaymentRequests.id, id)).limit(1);
        if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ error: "Not found" });
        return res.status(409).json({ error: `Request is already ${existing.status}` });
      }
      const row = updated[0];

      // Best-effort cancel the upstream Razorpay link AFTER we own the
      // transition so a duplicate request can't fire a second cancel.
      if (parsed.data.status === "cancelled" && row.rpLinkId) {
        const rp = getRazorpayClient();
        if (rp) {
          try { await (rp as any).paymentLink.cancel(row.rpLinkId); } catch (e: any) {
            console.warn("[pandit-crm] payment-link cancel failed:", e?.message || e);
          }
        }
      }

      // If the pandit just marked this paid, push a confirmation into the
      // customer's dashboard so they see the receipt close on their side too.
      if (parsed.data.status === "paid") {
        try {
          const { resolveUserIdForCustomer } = await import("./portal-sync");
          const userId = await resolveUserIdForCustomer({
            customerKey: row.customerKey, customerPhone: row.customerPhone,
          });
          if (userId) {
            const { pushUserNotification } = await import("./dashboard-routes");
            await pushUserNotification({
              userId,
              kind: "payment_request_paid",
              title: `Payment of ₹${row.amountInr} confirmed`,
              body: row.purpose,
              link: "/dashboard?tab=payments",
              meta: { requestId: row.id },
              dedupeKey: `payreq:${row.id}:paid`,
            });
          }
        } catch {}
      }
      res.json({ request: row });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // Public lookup keyed by an opaque token (not the numeric id) so the URL
  // is unguessable. Returns only the minimal fields needed to render a
  // payment landing page; once the request is no longer pending, we hide
  // amount/purpose to prevent leaking history of past transactions.
  app.get("/api/payment-requests/by-token/:token", async (req, res) => {
    try {
      const token = String(req.params.token || "");
      if (!/^[a-f0-9]{32}$/.test(token)) return res.status(404).json({ error: "Not found" });
      const [row] = await db.select().from(panditPaymentRequests)
        .where(eq(panditPaymentRequests.publicToken, token)).limit(1);
      if (!row) return res.status(404).json({ error: "Not found" });
      const [pandit] = await db.select().from(pandits).where(eq(pandits.id, row.panditId)).limit(1);
      const isOpen = row.status === "pending";
      res.json({
        request: {
          status: row.status,
          // Only expose payment-link details + amount while the request is
          // still actionable. Once paid/cancelled, the response collapses to
          // status only so a leaked URL discloses nothing useful.
          amountInr: isOpen ? row.amountInr : null,
          purpose: isOpen ? row.purpose : null,
          rpShortUrl: isOpen ? row.rpShortUrl : null,
          expiresAt: isOpen ? row.expiresAt : null,
        },
        pandit: pandit ? { name: pandit.name, slug: pandit.slug } : null,
      });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });
}
