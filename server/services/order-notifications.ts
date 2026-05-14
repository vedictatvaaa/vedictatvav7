import { sendSms, sendWhatsApp } from "./msg91";
import { storage } from "../storage";
import type { Order, NotificationSettings, NotificationChannel, NotificationStatus } from "@shared/schema";

type OrderItem = { name?: string };

export type NotifKind =
  | "payment_received"
  | "order_confirmed"
  | "order_shipped"
  | "out_for_delivery"
  | "delivered"
  | "refund_initiated"
  | "abandoned_cart_wa"
  | "review_request_2"
  | "test";

function fmtINR(n: number): string {
  try { return `Rs ${(n || 0).toLocaleString("en-IN")}`; } catch { return `Rs ${n}`; }
}

function firstName(name: string | null | undefined): string {
  return (name || "Devotee").split(" ")[0] || "Devotee";
}

function itemsSummary(items: OrderItem[]): string {
  if (!Array.isArray(items) || items.length === 0) return "your items";
  const first = items[0]?.name || "items";
  const rest = items.length - 1;
  return rest > 0 ? `${first} +${rest} more` : first;
}

const KIND_TO_SETTING: Record<NotifKind, keyof NotificationSettings | null> = {
  payment_received: "paymentReceived",
  order_confirmed: "orderConfirmed",
  order_shipped: "orderShipped",
  out_for_delivery: "outForDelivery",
  delivered: "delivered",
  refund_initiated: "refundInitiated",
  abandoned_cart_wa: "abandonedCartWa",
  review_request_2: "reviewRequest2",
  test: null,
};

async function isKindEnabled(kind: NotifKind): Promise<boolean> {
  const key = KIND_TO_SETTING[kind];
  if (!key) return true;
  try {
    const settings = await storage.getNotificationSettings();
    const value = settings[key];
    return value !== false;
  } catch { return true; }
}

async function recordSafe(entry: {
  orderId: number | null;
  recipientPhone: string | null;
  recipientEmail?: string | null;
  channel: NotificationChannel;
  kind: NotifKind;
  status: NotificationStatus;
  reason?: string | null;
}) {
  try {
    await storage.recordNotificationLog({
      orderId: entry.orderId ?? null,
      recipientPhone: entry.recipientPhone ?? null,
      recipientEmail: entry.recipientEmail ?? null,
      channel: entry.channel,
      kind: entry.kind,
      status: entry.status,
      reason: entry.reason ?? null,
    });
  } catch (e) { console.error("[order-notify] log err", e); }
}

type SendArgs = {
  orderId: number | null;
  phone: string;
  email?: string | null;
  kind: NotifKind;
  whatsappTemplate?: string;
  whatsappVars: string[];
  smsTemplate?: string;
  smsVars: Record<string, string>;
};

/**
 * WhatsApp-first dispatch with SMS fallback.
 *
 * Behaviour (per Task #20 spec):
 *   1. If a successful send already exists for (orderId, kind), skip entirely
 *      (channel-blind dedupe — one milestone, one notification).
 *   2. Otherwise attempt WhatsApp when a template is configured. Record the
 *      attempt in notification_log.
 *   3. If WA was not attempted (no template) or failed, fall back to SMS.
 *      Otherwise SMS is suppressed so we don't double-message the customer.
 *
 * Non-blocking — caller must not await.
 */
function dispatchWaAndSms(args: SendArgs): void {
  const { orderId, phone, email, kind, whatsappTemplate, whatsappVars, smsTemplate, smsVars } = args;
  void (async () => {
    try {
      if (orderId != null && await storage.hasNotificationLog(orderId, kind, "sent")) return;

      let waSucceeded = false;
      if (whatsappTemplate) {
        try {
          const r = await sendWhatsApp({ mobile: phone, templateName: whatsappTemplate, bodyVariables: whatsappVars });
          waSucceeded = !!r.ok;
          await recordSafe({
            orderId, recipientPhone: phone, recipientEmail: email,
            channel: "whatsapp", kind,
            status: r.ok ? "sent" : "failed", reason: r.reason || null,
          });
        } catch (e: any) {
          await recordSafe({
            orderId, recipientPhone: phone, recipientEmail: email,
            channel: "whatsapp", kind, status: "failed", reason: String(e?.message || e),
          });
        }
      } else {
        await recordSafe({
          orderId, recipientPhone: phone, recipientEmail: email,
          channel: "whatsapp", kind, status: "skipped", reason: "no whatsapp template configured",
        });
      }

      // SMS fallback only when WA did not succeed.
      if (waSucceeded) return;
      if (!smsTemplate) {
        await recordSafe({
          orderId, recipientPhone: phone, recipientEmail: email,
          channel: "sms", kind, status: "skipped", reason: "no sms template configured",
        });
        return;
      }
      try {
        const r = await sendSms({ mobile: phone, templateIdOverride: smsTemplate, variables: smsVars });
        await recordSafe({
          orderId, recipientPhone: phone, recipientEmail: email,
          channel: "sms", kind,
          status: r.ok ? "sent" : "failed", reason: r.reason || null,
        });
      } catch (e: any) {
        await recordSafe({
          orderId, recipientPhone: phone, recipientEmail: email,
          channel: "sms", kind, status: "failed", reason: String(e?.message || e),
        });
      }
    } catch (e) {
      console.error("[order-notify] dispatchWaAndSms outer error", e);
    }
  })();
}

// ─── Order Confirmed ────────────────────────────────────────────────
export function notifyOrderConfirmed(order: Order): void {
  void (async () => {
    try {
      const phone = order.customerPhone;
      if (!phone) return;
      if (!(await isKindEnabled("order_confirmed"))) {
        await recordSafe({ orderId: order.id, recipientPhone: phone, channel: "whatsapp", kind: "order_confirmed", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const name = firstName(order.customerName);
      const summary = itemsSummary((order.items as OrderItem[] | null) || []);
      const total = fmtINR(order.totalAmount || 0);
      const orderId = String(order.id);
      dispatchWaAndSms({
        orderId: order.id, phone, email: order.customerEmail || null, kind: "order_confirmed",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_ORDER_CONFIRMED,
        whatsappVars: [name, orderId, summary, total],
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_ORDER_CONFIRMED || process.env.MSG91_SMS_TEMPLATE_ID,
        smsVars: { var1: name, var2: orderId, var3: summary, var4: total },
      });
    } catch (e) { console.error("[order-notify] notifyOrderConfirmed", e); }
  })();
}

// ─── Payment Received ───────────────────────────────────────────────
export function notifyPaymentReceived(order: Order): void {
  void (async () => {
    try {
      const phone = order.customerPhone;
      if (!phone) return;
      if (!(await isKindEnabled("payment_received"))) {
        await recordSafe({ orderId: order.id, recipientPhone: phone, channel: "whatsapp", kind: "payment_received", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const name = firstName(order.customerName);
      const total = fmtINR(order.totalAmount || 0);
      const orderId = String(order.id);
      dispatchWaAndSms({
        orderId: order.id, phone, email: order.customerEmail || null, kind: "payment_received",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_PAYMENT_RECEIVED,
        whatsappVars: [name, orderId, total],
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_PAYMENT_RECEIVED || process.env.MSG91_SMS_TEMPLATE_ID,
        smsVars: { var1: name, var2: orderId, var3: total },
      });
    } catch (e) { console.error("[order-notify] notifyPaymentReceived", e); }
  })();
}

// ─── Order Shipped ──────────────────────────────────────────────────
export function notifyOrderShipped(order: Order, awb: string, courierName?: string): void {
  void (async () => {
    try {
      const phone = order.customerPhone;
      if (!phone) return;
      if (!(await isKindEnabled("order_shipped"))) {
        await recordSafe({ orderId: order.id, recipientPhone: phone, channel: "whatsapp", kind: "order_shipped", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const name = firstName(order.customerName);
      const orderId = String(order.id);
      const courier = courierName || "our partner";
      const trackUrl = `https://shiprocket.co/tracking/${awb}`;
      dispatchWaAndSms({
        orderId: order.id, phone, email: order.customerEmail || null, kind: "order_shipped",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_ORDER_SHIPPED,
        whatsappVars: [name, orderId, courier, awb, trackUrl],
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_ORDER_SHIPPED || process.env.MSG91_SMS_TEMPLATE_ID,
        smsVars: { var1: name, var2: orderId, var3: courier, var4: awb, var5: trackUrl },
      });
    } catch (e) { console.error("[order-notify] notifyOrderShipped", e); }
  })();
}

// ─── Out For Delivery ───────────────────────────────────────────────
export function notifyOutForDelivery(order: Order, awb?: string | null, courierName?: string | null): void {
  void (async () => {
    try {
      const phone = order.customerPhone;
      if (!phone) return;
      if (!(await isKindEnabled("out_for_delivery"))) {
        await recordSafe({ orderId: order.id, recipientPhone: phone, channel: "whatsapp", kind: "out_for_delivery", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const name = firstName(order.customerName);
      const orderId = String(order.id);
      const courier = courierName || "our partner";
      const trackUrl = awb ? `https://shiprocket.co/tracking/${awb}` : "";
      dispatchWaAndSms({
        orderId: order.id, phone, email: order.customerEmail || null, kind: "out_for_delivery",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_OUT_FOR_DELIVERY,
        whatsappVars: [name, orderId, courier, trackUrl],
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_OUT_FOR_DELIVERY || process.env.MSG91_SMS_TEMPLATE_ID,
        smsVars: { var1: name, var2: orderId, var3: courier, var4: trackUrl },
      });
    } catch (e) { console.error("[order-notify] notifyOutForDelivery", e); }
  })();
}

// ─── Delivered ──────────────────────────────────────────────────────
export function notifyDelivered(order: Order): void {
  void (async () => {
    try {
      const phone = order.customerPhone;
      if (!phone) return;
      if (!(await isKindEnabled("delivered"))) {
        await recordSafe({ orderId: order.id, recipientPhone: phone, channel: "whatsapp", kind: "delivered", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const name = firstName(order.customerName);
      const orderId = String(order.id);
      const reviewUrl = `${(process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "")}/account/orders/${order.id}/review`;
      dispatchWaAndSms({
        orderId: order.id, phone, email: order.customerEmail || null, kind: "delivered",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_DELIVERED,
        whatsappVars: [name, orderId, reviewUrl],
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_DELIVERED || process.env.MSG91_SMS_TEMPLATE_ID,
        smsVars: { var1: name, var2: orderId, var3: reviewUrl },
      });
    } catch (e) { console.error("[order-notify] notifyDelivered", e); }
  })();
}

// ─── Refund Initiated ───────────────────────────────────────────────
export function notifyRefundInitiated(order: Order, amountPaise: number): void {
  void (async () => {
    try {
      const phone = order.customerPhone;
      if (!phone) return;
      if (!(await isKindEnabled("refund_initiated"))) {
        await recordSafe({ orderId: order.id, recipientPhone: phone, channel: "whatsapp", kind: "refund_initiated", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const name = firstName(order.customerName);
      const orderId = String(order.id);
      const amount = fmtINR(Math.round((amountPaise || 0) / 100));
      dispatchWaAndSms({
        orderId: order.id, phone, email: order.customerEmail || null, kind: "refund_initiated",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_REFUND_INITIATED,
        whatsappVars: [name, orderId, amount],
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_REFUND_INITIATED || process.env.MSG91_SMS_TEMPLATE_ID,
        smsVars: { var1: name, var2: orderId, var3: amount },
      });
    } catch (e) { console.error("[order-notify] notifyRefundInitiated", e); }
  })();
}

// ─── Abandoned Cart WA Ping ─────────────────────────────────────────
export function notifyAbandonedCartWa(args: { phone: string; email?: string | null; customerName?: string | null; cartTotal?: number | null }): void {
  void (async () => {
    try {
      const { phone } = args;
      if (!phone) return;
      if (!(await isKindEnabled("abandoned_cart_wa"))) {
        await recordSafe({ orderId: null, recipientPhone: phone, channel: "whatsapp", kind: "abandoned_cart_wa", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      // Dedupe per (phone, kind, day): one ping per phone per calendar day (IST midnight bucket).
      const dayStart = new Date();
      dayStart.setHours(0, 0, 0, 0);
      if (await storage.hasRecentNotificationByPhone(phone, "abandoned_cart_wa", dayStart)) return;
      const name = firstName(args.customerName);
      const total = fmtINR(args.cartTotal || 0);
      const cartUrl = `${(process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "")}/cart`;
      dispatchWaAndSms({
        orderId: null, phone, email: args.email || null, kind: "abandoned_cart_wa",
        whatsappTemplate: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_ABANDONED_CART,
        whatsappVars: [name, total, cartUrl],
        // No SMS for abandoned cart ping (marketing) unless explicit template id provided.
        smsTemplate: process.env.MSG91_SMS_TEMPLATE_ID_ABANDONED_CART,
        smsVars: { var1: name, var2: total, var3: cartUrl },
      });
    } catch (e) { console.error("[order-notify] notifyAbandonedCartWa", e); }
  })();
}

// ─── Review Reminder WhatsApp (Task #41) ────────────────────────────
// Companion WA ping fired alongside the review_request_2 email reminder
// so we lift verified-review yield in markets where WA open rates beat
// email. Deduped per (orderId, kind) via the same notification_log
// constraints used by the other order milestones. No-op if the template
// env var is not configured.
export function notifyReviewReminderWa(args: {
  orderId: number;
  phone: string;
  email?: string | null;
  customerName?: string | null;
  productNames?: string[];
}): void {
  void (async () => {
    try {
      const phone = (args.phone || "").trim();
      if (!phone) return;
      if (!(await isKindEnabled("review_request_2"))) {
        await recordSafe({ orderId: args.orderId, recipientPhone: phone, channel: "whatsapp", kind: "review_request_2", status: "skipped", reason: "kind disabled in settings" });
        return;
      }
      const tplName = (process.env.MSG91_WHATSAPP_TEMPLATE_REVIEW_REMINDER || "").trim();
      if (!tplName) {
        // No-op when WA template is not configured. Record a skipped log so
        // future sweeps don't keep retrying for this order.
        await recordSafe({ orderId: args.orderId, recipientPhone: phone, recipientEmail: args.email || null, channel: "whatsapp", kind: "review_request_2", status: "skipped", reason: "no whatsapp template configured" });
        return;
      }
      // Per-order dedupe — one successful WA review reminder per order.
      if (await storage.hasNotificationLog(args.orderId, "review_request_2", "sent")) return;

      const name = firstName(args.customerName);
      const orderId = String(args.orderId);
      const product = (args.productNames || []).find((n) => !!n) || "your order";
      const reviewUrl = `${(process.env.PUBLIC_SITE_URL || "https://vedictatva.com").replace(/\/$/, "")}/account/orders/${args.orderId}/review`;
      try {
        const r = await sendWhatsApp({ mobile: phone, templateName: tplName, bodyVariables: [name, orderId, product, reviewUrl] });
        await recordSafe({
          orderId: args.orderId, recipientPhone: phone, recipientEmail: args.email || null,
          channel: "whatsapp", kind: "review_request_2",
          status: r.ok ? "sent" : "failed", reason: r.reason || null,
        });
      } catch (e: any) {
        await recordSafe({ orderId: args.orderId, recipientPhone: phone, recipientEmail: args.email || null, channel: "whatsapp", kind: "review_request_2", status: "failed", reason: String(e?.message || e) });
      }
    } catch (e) { console.error("[order-notify] notifyReviewReminderWa", e); }
  })();
}

// Test send used by admin Notifications panel.
export function sendTestNotification(opts: {
  channel: "whatsapp" | "sms";
  kind: NotifKind | string;
  phone: string;
  email?: string | null;
  orderId?: number | null;
  templateName?: string;
  templateId?: string;
  variables?: string[];
}): Promise<{ ok: boolean; reason?: string }> {
  const vars = opts.variables && opts.variables.length ? opts.variables : ["Test", "12345", "Vedic Tatva"];
  const record = (channel: "whatsapp" | "sms", r: { ok: boolean; reason?: string }) =>
    recordSafe({
      orderId: opts.orderId ?? null,
      recipientPhone: opts.phone,
      recipientEmail: opts.email ?? null,
      channel,
      kind: (opts.kind as NotifKind) || "test",
      status: r.ok ? "sent" : "failed",
      reason: r.reason || null,
    });
  if (opts.channel === "whatsapp") {
    if (!opts.templateName) {
      const r = { ok: false, reason: "no whatsapp template configured for this kind" };
      return record("whatsapp", r).then(() => r);
    }
    return sendWhatsApp({ mobile: opts.phone, templateName: opts.templateName, bodyVariables: vars })
      .then(async (r) => { await record("whatsapp", r); return r; });
  }
  if (!opts.templateId) {
    const r = { ok: false, reason: "no sms template configured for this kind" };
    return record("sms", r).then(() => r);
  }
  const smsVars: Record<string, string> = { var1: vars[0] || "", var2: vars[1] || "", var3: vars[2] || "", var4: vars[3] || "", var5: vars[4] || "", var6: vars[5] || "" };
  return sendSms({ mobile: opts.phone, templateIdOverride: opts.templateId, variables: smsVars })
    .then(async (r) => { await record("sms", r); return r; });
}
