// Email marketing engine — schedules and dispatches the cart abandonment
// sequence, the welcome series, and admin-composed broadcasts. Marketing
// emails respect the unsubscribe table; transactional emails (handled
// elsewhere) are unaffected.

import crypto from "node:crypto";
import { sendEmail } from "./email";
import { storage } from "./storage";
import {
  buildAbandonedCartEmail1, buildAbandonedCartEmail2, buildAbandonedCartEmail3,
  buildWelcomeEmail1, buildWelcomeEmail2,
  buildBroadcastEmail,
} from "./email-marketing-templates";
import { buildReviewRequestEmail } from "./email";
import type { AbandonedCart, EmailSend, NewsletterSubscriber } from "@shared/schema";

const SITE_URL = (process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "");

// HMAC-signed token so unsubscribe links can't be forged. We deliberately
// fall back to a derived secret so the engine still works in dev where the
// admin hasn't set UNSUBSCRIBE_SECRET yet — but in production an explicit
// value should always be configured.
function unsubSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET || process.env.SESSION_SECRET;
  if (secret && secret.length >= 16) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("UNSUBSCRIBE_SECRET (or SESSION_SECRET) must be set to a value of >=16 chars in production");
  }
  // Dev-only fallback derived per-process so dev tokens don't survive restarts
  // and can never accidentally validate against a production install.
  if (!devSecretCache) devSecretCache = crypto.randomBytes(32).toString("hex");
  return devSecretCache;
}
let devSecretCache: string | null = null;

// Returns true when ANY outbound email transport is configured (Hostinger
// SMTP for the customer mailbox, the admin mailbox, or SendGrid as a
// fallback). Without any of these, queued sends are marked "skipped" so
// the engine quietly does nothing in dev/staging.
function emailDeliveryEnabled(): boolean {
  return !!(
    (process.env.ECOM_SMTP_USER && process.env.ECOM_SMTP_PASS) ||
    (process.env.SMTP_USER && process.env.SMTP_PASS) ||
    process.env.SENDGRID_API_KEY
  );
}

export function signUnsubscribeToken(email: string, kind: string): string {
  const payload = `${email.toLowerCase()}|${kind}`;
  const sig = crypto.createHmac("sha256", unsubSecret()).update(payload).digest("hex").slice(0, 32);
  return Buffer.from(`${payload}|${sig}`).toString("base64url");
}

export function verifyUnsubscribeToken(token: string): { email: string; kind: string } | null {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split("|");
    if (parts.length !== 3) return null;
    const [email, kind, sig] = parts;
    const expected = crypto.createHmac("sha256", unsubSecret()).update(`${email}|${kind}`).digest("hex").slice(0, 32);
    if (sig.length !== expected.length) return null;
    if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
    return { email, kind };
  } catch {
    return null;
  }
}

export function unsubscribeUrlFor(email: string, kind: string): string {
  return `${SITE_URL}/api/email/unsubscribe?token=${signUnsubscribeToken(email, kind)}`;
}

// ============================================================
// Cart abandonment sequence
// ============================================================

// Deliberately short for development convenience. Override in env if you want
// to mirror production cadence (e.g. 60 / 1440 / 4320 minutes).
// Production cadence: 4h / 24h / 72h after the cart's updatedAt. Override via
// env if you want to test a faster cadence in dev.
const CART_DELAYS_MIN = {
  abandoned_cart_1: Number(process.env.CART_EMAIL_1_DELAY_MIN || 4 * 60),
  abandoned_cart_2: Number(process.env.CART_EMAIL_2_DELAY_MIN || 24 * 60),
  abandoned_cart_3: Number(process.env.CART_EMAIL_3_DELAY_MIN || 72 * 60),
};

const CART_KINDS = ["abandoned_cart_1", "abandoned_cart_2", "abandoned_cart_3"] as const;
type CartKind = (typeof CART_KINDS)[number];

function buildCartMessage(kind: CartKind, cart: AbandonedCart, unsubUrl: string) {
  const items = Array.isArray(cart.items) ? (cart.items as any[]) : [];
  const params = {
    to: cart.email,
    customerName: cart.customerName,
    items,
    cartTotal: cart.cartTotal || 0,
    unsubscribeUrl: unsubUrl,
  };
  if (kind === "abandoned_cart_1") return buildAbandonedCartEmail1(params);
  if (kind === "abandoned_cart_2") return buildAbandonedCartEmail2(params);
  return buildAbandonedCartEmail3(params);
}

export async function runAbandonedCartSequence(): Promise<{ scanned: number; sent: number; skipped: number }> {
  let scanned = 0, sent = 0, skipped = 0;
  try {
    const carts = await storage.getAbandonedCarts();
    for (const cart of carts) {
      scanned++;
      if (cart.recovered) { skipped++; continue; }
      const baseTime = cart.updatedAt ? new Date(cart.updatedAt).getTime() : 0;
      if (!baseTime) { skipped++; continue; }

      // If this email placed an order on or after the cart's updatedAt,
      // mark recovered and stop the sequence.
      const orders = await storage.getOrdersByEmail(cart.email);
      const recovered = orders.some(o => {
        const t = o.createdAt ? new Date(o.createdAt).getTime() : 0;
        return t >= baseTime;
      });
      if (recovered) {
        await storage.markAbandonedCartRecovered(cart.email);
        skipped++;
        continue;
      }

      if (await storage.isEmailUnsubscribed(cart.email)) { skipped++; continue; }

      // Single WhatsApp ping ~2h after cart abandonment (deduped per phone/day
      // by the notifier itself). We look up the customer phone via their user
      // account or most-recent order — we don't store phone on the cart row.
      const WA_PING_MIN = Number(process.env.CART_WA_PING_DELAY_MIN || 2 * 60);
      if (Date.now() >= baseTime + WA_PING_MIN * 60 * 1000) {
        try {
          let phone: string | null = null;
          const u = await storage.getUserByEmail(cart.email).catch(() => undefined);
          if (u?.phone) phone = u.phone;
          if (!phone) {
            const past = await storage.getOrdersByEmail(cart.email).catch(() => []);
            const last = past.sort((a, b) => (new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()))[0];
            if (last?.customerPhone) phone = last.customerPhone;
          }
          if (phone) {
            const { notifyAbandonedCartWa } = await import("./services/order-notifications");
            notifyAbandonedCartWa({ phone, email: cart.email, customerName: cart.customerName, cartTotal: cart.cartTotal || 0 });
          }
        } catch (e) { console.error("[email-marketing] cart WA ping err", e); }
      }

      const existing = await storage.getEmailSendsForRelated(cart.id, CART_KINDS as unknown as string[]);
      // Treat "sent" and "skipped" as terminal: we don't want to keep
      // re-attempting (or accumulating skip rows) every sweep.
      const alreadyHandled = new Set(
        existing.filter(e => e.status === "sent" || e.status === "skipped").map(e => e.kind),
      );

      for (const kind of CART_KINDS) {
        if (alreadyHandled.has(kind)) continue;
        const dueAt = baseTime + CART_DELAYS_MIN[kind] * 60 * 1000;
        if (Date.now() < dueAt) break; // not due yet, and later kinds aren't either
        // No-op gracefully when SendGrid isn't configured: record one "skipped"
        // row per kind so we don't keep retrying every sweep.
        if (!emailDeliveryEnabled()) {
          await storage.createEmailSend({
            recipientEmail: cart.email,
            kind,
            relatedId: cart.id,
            scheduledFor: new Date(dueAt),
            sentAt: null,
            status: "skipped",
            error: "email delivery disabled",
          });
          skipped++;
          break;
        }
        const unsubUrl = unsubscribeUrlFor(cart.email, kind);
        const msg = buildCartMessage(kind, cart, unsubUrl);
        const result = await sendEmail(msg);
        await storage.createEmailSend({
          recipientEmail: cart.email,
          kind,
          relatedId: cart.id,
          scheduledFor: new Date(dueAt),
          sentAt: result.sent ? new Date() : null,
          status: result.sent ? "sent" : "failed",
          error: result.error || null,
        });
        if (result.sent) {
          sent++;
          if (kind === "abandoned_cart_1") {
            // Maintain compat with existing nudgeSentAt column.
            await storage.markAbandonedCartNudged(cart.id);
          }
        }
        // Send only one email per sweep per cart to keep volume sane.
        break;
      }
    }
  } catch (err: any) {
    console.error("[email-marketing] cart sweep failed:", err?.message || err);
  }
  return { scanned, sent, skipped };
}

// ============================================================
// Welcome series
// ============================================================

const WELCOME_DELAYS_MIN = {
  welcome_1: 0,
  welcome_2: Number(process.env.WELCOME_EMAIL_2_DELAY_MIN || 3 * 24 * 60),
};

export async function enqueueWelcomeSeries(sub: NewsletterSubscriber): Promise<void> {
  try {
    if (await storage.isEmailUnsubscribed(sub.email)) return;
    const existing = await storage.getEmailSendsForRelated(sub.id, ["welcome_1", "welcome_2"]);
    const has = new Set(existing.map(e => e.kind));
    const now = Date.now();
    for (const kind of ["welcome_1", "welcome_2"] as const) {
      if (has.has(kind)) continue;
      await storage.createEmailSend({
        recipientEmail: sub.email,
        kind,
        relatedId: sub.id,
        scheduledFor: new Date(now + WELCOME_DELAYS_MIN[kind] * 60 * 1000),
        sentAt: null,
        status: "queued",
        error: null,
      });
    }
  } catch (err: any) {
    console.error("[email-marketing] enqueueWelcomeSeries failed:", err?.message || err);
  }
}

export async function runWelcomeSeries(): Promise<{ sent: number; skipped: number }> {
  let sent = 0, skipped = 0;
  try {
    const due = await storage.getDueQueuedEmailSends(["welcome_1", "welcome_2"], new Date());
    for (const row of due) {
      if (await storage.isEmailUnsubscribed(row.recipientEmail)) {
        await storage.markEmailSendStatus(row.id, "skipped", "unsubscribed");
        skipped++;
        continue;
      }
      if (!emailDeliveryEnabled()) {
        await storage.markEmailSendStatus(row.id, "skipped", "email delivery disabled");
        skipped++;
        continue;
      }
      const unsubUrl = unsubscribeUrlFor(row.recipientEmail, row.kind);
      const msg = row.kind === "welcome_1"
        ? buildWelcomeEmail1({ to: row.recipientEmail, unsubscribeUrl: unsubUrl })
        : buildWelcomeEmail2({ to: row.recipientEmail, unsubscribeUrl: unsubUrl });
      msg.headers = {
        ...(msg.headers || {}),
        "List-Unsubscribe": `<${unsubUrl}>, <mailto:ecom@vedictatva.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      };
      const result = await sendEmail(msg);
      await storage.markEmailSendStatus(
        row.id,
        result.sent ? "sent" : "failed",
        result.sent ? null : (result.error || "send failed"),
      );
      if (result.sent) sent++;
    }
  } catch (err: any) {
    console.error("[email-marketing] welcome sweep failed:", err?.message || err);
  }
  return { sent, skipped };
}

// ============================================================
// Broadcast — admin compose
// ============================================================

export interface BroadcastSendResult {
  recipientCount: number;
  sentCount: number;
  failureCount: number;
}

export async function dispatchBroadcast(campaignId: number, recipients: string[]): Promise<BroadcastSendResult> {
  const seen = new Set<string>();
  const targets = recipients
    .map(e => (e || "").trim().toLowerCase())
    .filter(e => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e))
    .filter(e => { if (seen.has(e)) return false; seen.add(e); return true; });

  // Filter out unsubscribed recipients.
  const eligible: string[] = [];
  for (const email of targets) {
    if (!(await storage.isEmailUnsubscribed(email))) eligible.push(email);
  }

  const campaign = await storage.getNewsletterCampaign(campaignId);
  if (!campaign) throw new Error("Campaign not found");

  await storage.updateNewsletterCampaign(campaignId, {
    status: "sending",
    recipientCount: eligible.length,
  });

  let sentCount = 0, failureCount = 0;
  const BATCH = 100;
  for (let i = 0; i < eligible.length; i += BATCH) {
    const batch = eligible.slice(i, i + BATCH);
    await Promise.all(batch.map(async (email) => {
      const unsubUrl = unsubscribeUrlFor(email, "broadcast");
      const msg = buildBroadcastEmail({
        to: email,
        subject: campaign.subject,
        previewText: campaign.previewText,
        bodyHtml: campaign.bodyHtml,
        bodyText: campaign.bodyText,
        unsubscribeUrl: unsubUrl,
      });
      msg.headers = {
        ...(msg.headers || {}),
        "List-Unsubscribe": `<${unsubUrl}>, <mailto:ecom@vedictatva.com?subject=unsubscribe>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      };
      const r = await sendEmail(msg);
      await storage.createEmailSend({
        recipientEmail: email,
        kind: "broadcast",
        relatedId: campaignId,
        scheduledFor: new Date(),
        sentAt: r.sent ? new Date() : null,
        status: r.sent ? "sent" : "failed",
        error: r.error || null,
      });
      if (r.sent) sentCount++; else failureCount++;
    }));
    await storage.updateNewsletterCampaign(campaignId, { sentCount, failureCount });
  }

  await storage.updateNewsletterCampaign(campaignId, {
    sentCount,
    failureCount,
    status: failureCount === eligible.length && eligible.length > 0 ? "failed" : "sent",
    sentAt: new Date(),
  });

  return { recipientCount: eligible.length, sentCount, failureCount };
}

export async function recordUnsubscribe(email: string, source?: string | null): Promise<void> {
  await storage.recordEmailUnsubscribe(email, source || null);
}

// Helper used by the scheduler entry point so that index.ts stays small.
// Returns aggregate counts so callers can log meaningful sweep activity.
export async function runMarketingSweep(): Promise<{
  abandoned: number; welcome: number; queued: number;
}> {
  const cart = await runAbandonedCartSequence();
  const welcome = await runWelcomeSeries();
  const reviews = await runReviewRequestQueue();
  return {
    abandoned: cart.sent,
    welcome: welcome.sent,
    queued: reviews.sent,
  };
}

// Delay between the first review request and the gentle reminder. Default
// ~10 days; override via env for tests. Falls back to the default if the
// env value is missing, non-numeric, or non-positive.
const REVIEW_REMINDER_DEFAULT_MIN = 10 * 24 * 60;
const REVIEW_REMINDER_DELAY_MIN = (() => {
  const raw = Number(process.env.REVIEW_REQUEST_2_DELAY_MIN);
  return Number.isFinite(raw) && raw > 0 ? raw : REVIEW_REMINDER_DEFAULT_MIN;
})();

// Returns true if the customer has already left a verified review for any
// item in the given order. Used to suppress the second nudge.
async function hasVerifiedReviewForOrder(order: any): Promise<boolean> {
  const customerEmail = (order?.customerEmail || "").toLowerCase();
  if (!customerEmail) return false;
  const items = Array.isArray(order.items) ? (order.items as any[]) : [];
  const productIds = Array.from(new Set(
    items.map((it: any) => Number(it?.productId ?? it?.id)).filter((n) => Number.isFinite(n) && n > 0),
  ));
  for (const pid of productIds) {
    try {
      const reviews = await storage.getProductReviews(pid);
      if (reviews.some(r => r.verified && (r.customerEmail || "").toLowerCase() === customerEmail)) {
        return true;
      }
    } catch { /* ignore per-product lookup failures */ }
  }
  return false;
}

// Sends queued post-delivery review request emails (initial + gentle
// reminder). Skips if email delivery is not configured, the recipient has
// unsubscribed, or — for the reminder — a verified review already exists.
export async function runReviewRequestQueue(): Promise<{ sent: number; skipped: number }> {
  let sent = 0, skipped = 0;
  try {
    const due = await storage.getDueQueuedEmailSends(["review_request_1", "review_request_2"], new Date());
    for (const row of due) {
      try {
        if (await storage.isEmailUnsubscribed(row.recipientEmail)) {
          await storage.markEmailSendStatus(row.id, "skipped", "unsubscribed");
          skipped++;
          continue;
        }
        if (!emailDeliveryEnabled()) {
          await storage.markEmailSendStatus(row.id, "skipped", "email delivery disabled");
          skipped++;
          continue;
        }
        if (!row.relatedId) {
          await storage.markEmailSendStatus(row.id, "skipped", "missing order id");
          skipped++;
          continue;
        }
        const order = await storage.getOrder(row.relatedId);
        if (!order || !order.customerEmail || order.customerEmail.toLowerCase() !== row.recipientEmail.toLowerCase()) {
          await storage.markEmailSendStatus(row.id, "skipped", "order mismatch");
          skipped++;
          continue;
        }
        const customerEmail = order.customerEmail;
        const isReminder = row.kind === "review_request_2";
        if (isReminder && await hasVerifiedReviewForOrder(order)) {
          await storage.markEmailSendStatus(row.id, "skipped", "verified review already exists");
          skipped++;
          continue;
        }
        const items = Array.isArray((order as any).items) ? ((order as any).items as any[]) : [];
        const productNames: string[] = [];
        for (const it of items) {
          const name = (it?.productName || it?.name || "").toString().trim();
          if (name && !productNames.includes(name)) productNames.push(name);
        }
        const msg = buildReviewRequestEmail({
          to: customerEmail,
          customerName: order.customerName,
          orderId: order.id,
          productNames,
          variant: isReminder ? "reminder" : "first",
        });
        const unsubUrl = unsubscribeUrlFor(customerEmail, row.kind);
        msg.headers = {
          ...(msg.headers || {}),
          "List-Unsubscribe": `<${unsubUrl}>, <mailto:ecom@vedictatva.com?subject=unsubscribe>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        };
        const result = await sendEmail(msg);
        await storage.markEmailSendStatus(
          row.id,
          result.sent ? "sent" : "failed",
          result.sent ? null : (result.error || "send failed"),
        );
        if (result.sent) {
          sent++;
          // Companion WhatsApp nudge for the second reminder (Task #41).
          // Deduped per order in dispatch via notification_log; no-op when
          // MSG91_WHATSAPP_TEMPLATE_REVIEW_REMINDER is not configured.
          if (isReminder && order.customerPhone) {
            try {
              const productNames: string[] = [];
              for (const it of items) {
                const name = (it?.productName || it?.name || "").toString().trim();
                if (name && !productNames.includes(name)) productNames.push(name);
              }
              const { notifyReviewReminderWa } = await import("./services/order-notifications");
              notifyReviewReminderWa({
                orderId: order.id,
                phone: order.customerPhone,
                email: customerEmail,
                customerName: order.customerName,
                productNames,
              });
            } catch (e: any) {
              console.warn("[email-marketing] review reminder WA dispatch failed:", e?.message);
            }
          }
          // After the first request goes out, queue the gentle reminder so
          // the next sweep (~10 days later) can decide whether to send it.
          if (row.kind === "review_request_1") {
            try {
              const existing = await storage.getEmailSendsForRelated(order.id, ["review_request_2"]);
              // Skip queueing if the customer has already left a verified
              // review for any item in this order. Sweep-time also checks
              // this, but skipping at queue-time avoids stale rows.
              const alreadyReviewed = await hasVerifiedReviewForOrder(order);
              if (!existing.length && !alreadyReviewed) {
                await storage.createEmailSend({
                  recipientEmail: customerEmail,
                  kind: "review_request_2",
                  relatedId: order.id,
                  scheduledFor: new Date(Date.now() + REVIEW_REMINDER_DELAY_MIN * 60 * 1000),
                  sentAt: null,
                  status: "queued",
                  error: null,
                });
              }
            } catch (e: any) {
              console.warn("[email-marketing] enqueue review_request_2 failed:", e?.message);
            }
          }
        }
      } catch (innerErr: any) {
        await storage.markEmailSendStatus(row.id, "failed", innerErr?.message || "send threw").catch(() => {});
      }
    }
  } catch (err: any) {
    console.error("[email-marketing] review request sweep failed:", err?.message || err);
  }
  return { sent, skipped };
}
