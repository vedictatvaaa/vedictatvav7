import { storage } from "../storage";
import { sendSms, sendWhatsApp } from "./msg91";
import { sendEmail, buildBookingNotificationEmail } from "../email";
import type { PujaBooking } from "@shared/schema";
import { pujaBookingDeliveries, pujaBookingEvents } from "@shared/schema";
import { db } from "../db";
import { and, eq, sql } from "drizzle-orm";
import { bookingEventKey, safeDeliveryError } from "../puja-booking/notification-events";

const PUJA_LABELS: Record<string, string> = {
  satyanarayan: "Satyanarayan Katha",
  grihapravesh: "Griha Pravesh",
  rudrabhishek: "Rudrabhishek",
  mahamrityunjay: "Mahamrityunjay Jaap",
  navgraha: "Navgraha Shanti",
  ganesh: "Ganesh Puja",
  "pind-daan-kashi": "Pind Daan in Kashi",
  "pind-daan-gaya": "Pind Daan in Gaya",
  "pind-daan-haridwar": "Pind Daan in Haridwar",
  "pind-daan-yearly-remote": "Yearly Remote Tarpan & Shradh",
};

function pujaLabel(value: string): string {
  return PUJA_LABELS[value] || value.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string): string {
  try {
    const date = new Date(d);
    if (isNaN(date.getTime())) return d;
    return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
  } catch {
    return d;
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, character => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]!);
}

function panditMessage(opts: { panditName: string; pujaName: string; pujaDate: string; timeSlot: string; mode: string; customerName?: string; customerPhone?: string; area?: string; contactReleased: boolean; }): string {
  const modeLine = opts.mode === "online" ? "Mode: Online (video call)" : "Mode: Offline (in-person)";
  return [
    `Namaste ${opts.panditName} ji,`,
    `New booking on Vedic Tatva:`,
    `Puja: ${opts.pujaName}`,
    `Date: ${opts.pujaDate} (${opts.timeSlot})`,
    modeLine,
    ...(opts.contactReleased ? [
      `Customer: ${opts.customerName || "Yajman"}`,
      `Mobile: ${opts.customerPhone || ""}`,
      `Please confirm and contact the customer.`,
    ] : [
      `Approximate area: ${opts.area || "Provided after acceptance"}`,
      `Customer contact details will be released only after acceptance.`,
    ]),
  ].join("\n");
}

function customerMessage(opts: { customerName: string; pujaName: string; pujaDate: string; timeSlot: string; mode: string; panditName: string; panditPhone: string; }): string {
  const modeLine = opts.mode === "online" ? "Mode: Online (video call)" : "Mode: Offline (in-person)";
  const panditLine = opts.panditName
    ? `Pandit: ${opts.panditName}${opts.panditPhone ? ` (${opts.panditPhone})` : ""}`
    : `Pandit: will be assigned shortly`;
  return [
    `Namaste ${opts.customerName} ji,`,
    `Your puja booking is confirmed on Vedic Tatva:`,
    `Puja: ${opts.pujaName}`,
    `Date: ${opts.pujaDate} (${opts.timeSlot})`,
    modeLine,
    panditLine,
    `Thank you. Har Har Mahadev.`,
  ].join("\n");
}

export async function notifyPujaBooking(booking: PujaBooking): Promise<void> {
  try {
    const pujaName = pujaLabel(booking.pujaType);
    const pujaDate = formatDate(booking.date);
    const timeSlot = booking.timeSlot || "";
    const mode = booking.mode || "offline";
    const customerName = booking.contactName || "Yajman";
    const customerPhone = booking.contactPhone || "";
    const contactReleased = Boolean(booking.contactReleasedAt)
      && ["accepted", "confirmed", "in_progress", "completed"].includes(booking.status);
    const approximateArea = [booking.addressLocality, booking.addressCity].filter(Boolean).join(", ");
    const eventType = contactReleased ? "booking_accepted" : "booking_requested";
    const recordDelivery = async (
      party: "customer" | "pandit",
      recipientId: number | null | undefined,
      channel: "email" | "whatsapp",
      result: { ok: boolean; reason?: string },
    ) => {
      const key = bookingEventKey({
        bookingId: booking.id,
        eventType: contactReleased || party === "customer" ? eventType : "booking_offered",
        recipientParty: party,
        recipientId,
      });
      const [event] = await db.select({ id: pujaBookingEvents.id }).from(pujaBookingEvents)
        .where(eq(pujaBookingEvents.eventKey, key)).limit(1);
      if (!event) return;
      const unavailable = Boolean(result.reason?.toLowerCase().includes("not configured"));
      await db.update(pujaBookingDeliveries).set({
        status: result.ok ? "sent" : unavailable ? "skipped" : "failed",
        attemptCount: sql`${pujaBookingDeliveries.attemptCount} + 1`,
        lastError: result.ok ? null : safeDeliveryError(result.reason),
        sentAt: result.ok ? new Date() : null,
        updatedAt: new Date(),
      }).where(and(eq(pujaBookingDeliveries.eventId, event.id), eq(pujaBookingDeliveries.channel, channel)));
    };

    let panditName = "";
    let panditPhone = "";
    let panditEmail = "";
    if (booking.panditId) {
      try {
        const pandit = await storage.getPandit(booking.panditId);
        if (pandit) {
          panditName = pandit.name || "";
          panditPhone = pandit.phone || "";
          panditEmail = (pandit as any).email || "";
        }
      } catch (err) {
        console.error("[notify] failed to fetch pandit", err);
      }
    }

    const log = (channel: string, who: string, r: { ok: boolean; reason?: string }) => {
      if (r.ok) console.log(`[notify] ${channel} -> ${who}: sent`);
      else console.log(`[notify] ${channel} -> ${who}: skipped (${r.reason})`);
    };

    if (panditPhone) {
      const text = panditMessage({ panditName: panditName || "Pandit ji", pujaName, pujaDate, timeSlot, mode, customerName, customerPhone, area: approximateArea, contactReleased });
      sendSms({
        mobile: panditPhone,
        templateIdOverride: process.env.MSG91_SMS_TEMPLATE_ID_PANDIT || process.env.MSG91_SMS_TEMPLATE_ID,
        variables: {
          var1: panditName || "Pandit ji",
          var2: pujaName,
          var3: pujaDate,
          var4: timeSlot,
          var5: contactReleased ? customerName : (approximateArea || "Area shared in portal"),
          var6: contactReleased ? customerPhone : "",
          message: text,
        },
      }).then((r) => log("sms", "pandit", r)).catch((e) => console.error("[notify] pandit sms err", e));

      sendWhatsApp({
        mobile: panditPhone,
        templateName: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_PANDIT,
        bodyVariables: [panditName || "Pandit ji", pujaName, `${pujaDate} (${timeSlot})`, contactReleased ? customerName : (approximateArea || "Area shared in portal"), contactReleased ? customerPhone : ""],
      }).then(async (r) => { log("whatsapp", "pandit", r); await recordDelivery("pandit", booking.panditId, "whatsapp", r); })
        .catch(async (e) => recordDelivery("pandit", booking.panditId, "whatsapp", { ok: false, reason: safeDeliveryError(e) }));
    } else {
      console.log("[notify] no pandit phone available; skipping pandit alert");
    }

    if (panditEmail && contactReleased) {
      const emailMsg = buildBookingNotificationEmail({
        to: panditEmail,
        panditName: panditName || "Pandit ji",
        pujaName,
        pujaDate,
        timeSlot,
        mode,
        customerName,
        customerPhone,
        location: booking.location,
      });
      sendEmail(emailMsg)
        .then(async (r) => {
          const result = { ok: r.sent, reason: r.error };
          log("email", "pandit", result);
          await recordDelivery("pandit", booking.panditId, "email", result);
        })
        .catch(async (e) => recordDelivery("pandit", booking.panditId, "email", { ok: false, reason: safeDeliveryError(e) }));
    } else {
      console.log("[notify] no pandit email available; skipping pandit email");
      await recordDelivery("pandit", booking.panditId, "email", { ok: false, reason: "Email recipient or accepted template not configured" });
    }

    if (customerPhone) {
      const text = customerMessage({ customerName, pujaName, pujaDate, timeSlot, mode, panditName: contactReleased ? panditName : "", panditPhone: contactReleased ? panditPhone : "" });
      sendSms({
        mobile: customerPhone,
        templateIdOverride: process.env.MSG91_SMS_TEMPLATE_ID_CUSTOMER || process.env.MSG91_SMS_TEMPLATE_ID,
        variables: {
          var1: customerName,
          var2: pujaName,
          var3: pujaDate,
          var4: timeSlot,
          var5: contactReleased ? (panditName || "TBD") : "TBD",
          var6: contactReleased ? (panditPhone || "") : "",
          message: text,
        },
      }).then((r) => log("sms", "customer", r)).catch((e) => console.error("[notify] customer sms err", e));

      sendWhatsApp({
        mobile: customerPhone,
        templateName: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_CUSTOMER,
        bodyVariables: [customerName, pujaName, `${pujaDate} (${timeSlot})`, contactReleased ? (panditName || "Will be assigned") : "Will be assigned", contactReleased ? (panditPhone || "") : ""],
      }).then(async (r) => { log("whatsapp", "customer", r); await recordDelivery("customer", booking.userId, "whatsapp", r); })
        .catch(async (e) => recordDelivery("customer", booking.userId, "whatsapp", { ok: false, reason: safeDeliveryError(e) }));
    } else {
      console.log("[notify] no customer phone available; skipping customer alert");
      await recordDelivery("customer", booking.userId, "whatsapp", { ok: false, reason: "WhatsApp recipient not configured" });
    }
    // The legacy adapter has no customer-email template. Record this honestly
    // rather than leaving a queued delivery that can never be processed.
    await recordDelivery("customer", booking.userId, "email", { ok: false, reason: "Customer email template not configured" });
  } catch (err) {
    console.error("[notify] notifyPujaBooking error", err);
  }
}

export async function notifyPujaSamagri(
  booking: PujaBooking,
  version: number,
  items: Array<{ name: string; quantity?: string; unit?: string }>,
): Promise<void> {
  const eventType = version === 1 ? "samagri_sent" : "samagri_updated";
  const eventKey = bookingEventKey({
    bookingId: booking.id,
    eventType,
    recipientParty: "customer",
    recipientId: booking.userId,
    occurrence: version,
  });
  const [event] = await db.select({ id: pujaBookingEvents.id })
    .from(pujaBookingEvents)
    .where(eq(pujaBookingEvents.eventKey, eventKey))
    .limit(1);
  if (!event) return;

  const deliver = async (
    channel: "email" | "whatsapp",
    send: () => Promise<{ ok: boolean; reason?: string }>,
  ) => {
    const [delivery] = await db.select().from(pujaBookingDeliveries)
      .where(and(
        eq(pujaBookingDeliveries.eventId, event.id),
        eq(pujaBookingDeliveries.channel, channel),
      ))
      .limit(1);
    if (!delivery || delivery.status === "sent") return;
    await db.update(pujaBookingDeliveries).set({
      status: "retrying",
      attemptCount: sql`${pujaBookingDeliveries.attemptCount} + 1`,
      updatedAt: new Date(),
    }).where(eq(pujaBookingDeliveries.id, delivery.id));
    try {
      const result = await send();
      const unavailable = Boolean(result.reason?.toLowerCase().includes("not configured"));
      await db.update(pujaBookingDeliveries).set({
        status: result.ok ? "sent" : unavailable ? "skipped" : "failed",
        lastError: result.ok ? null : safeDeliveryError(result.reason),
        sentAt: result.ok ? new Date() : null,
        updatedAt: new Date(),
      }).where(eq(pujaBookingDeliveries.id, delivery.id));
    } catch (error) {
      await db.update(pujaBookingDeliveries).set({
        status: "failed",
        lastError: safeDeliveryError(error),
        updatedAt: new Date(),
      }).where(eq(pujaBookingDeliveries.id, delivery.id));
    }
  };

  const pujaName = pujaLabel(booking.pujaType);
  const itemLines = items
    .map(item => `${item.name}${item.quantity ? ` — ${item.quantity}${item.unit ? ` ${item.unit}` : ""}` : ""}`)
    .join("\n");
  const customerName = booking.contactName || "Yajman";

  await Promise.all([
    deliver("whatsapp", () => {
      if (!booking.contactPhone) return Promise.resolve({ ok: false, reason: "WhatsApp recipient not configured" });
      return sendWhatsApp({
        mobile: booking.contactPhone,
        templateName: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_SAMAGRI,
        bodyVariables: [customerName, pujaName, String(version), itemLines],
      });
    }),
    deliver("email", async () => {
      if (!booking.contactEmail) return { ok: false, reason: "Email recipient not configured" };
      const result = await sendEmail({
        to: booking.contactEmail,
        subject: `${pujaName} samagri list — version ${version}`,
        text: `Namaste ${customerName} ji,\n\nPanditji has sent version ${version} of the samagri list for ${pujaName}:\n\n${itemLines}\n\nPlease open your Vedic Tatva booking for the complete record.`,
        html: `<p>Namaste ${escapeHtml(customerName)} ji,</p><p>Panditji has sent version ${version} of the samagri list for <strong>${escapeHtml(pujaName)}</strong>.</p><pre>${escapeHtml(itemLines)}</pre><p>Please open your Vedic Tatva booking for the complete record.</p>`,
      });
      return { ok: result.sent, reason: result.error };
    }),
  ]);
}
