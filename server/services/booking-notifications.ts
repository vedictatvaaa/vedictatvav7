import { storage } from "../storage";
import { sendSms, sendWhatsApp } from "./msg91";
import { sendEmail, buildBookingNotificationEmail } from "../email";
import type { PujaBooking } from "@shared/schema";

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

function panditMessage(opts: { panditName: string; pujaName: string; pujaDate: string; timeSlot: string; mode: string; customerName: string; customerPhone: string; }): string {
  const modeLine = opts.mode === "online" ? "Mode: Online (video call)" : "Mode: Offline (in-person)";
  return [
    `Namaste ${opts.panditName} ji,`,
    `New booking on Vedic Tatva:`,
    `Puja: ${opts.pujaName}`,
    `Date: ${opts.pujaDate} (${opts.timeSlot})`,
    modeLine,
    `Customer: ${opts.customerName}`,
    `Mobile: ${opts.customerPhone}`,
    `Please confirm and contact the customer.`,
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
      const text = panditMessage({ panditName: panditName || "Pandit ji", pujaName, pujaDate, timeSlot, mode, customerName, customerPhone });
      sendSms({
        mobile: panditPhone,
        templateIdOverride: process.env.MSG91_SMS_TEMPLATE_ID_PANDIT || process.env.MSG91_SMS_TEMPLATE_ID,
        variables: {
          var1: panditName || "Pandit ji",
          var2: pujaName,
          var3: pujaDate,
          var4: timeSlot,
          var5: customerName,
          var6: customerPhone,
          message: text,
        },
      }).then((r) => log("sms", "pandit", r)).catch((e) => console.error("[notify] pandit sms err", e));

      sendWhatsApp({
        mobile: panditPhone,
        templateName: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_PANDIT,
        bodyVariables: [panditName || "Pandit ji", pujaName, `${pujaDate} (${timeSlot})`, customerName, customerPhone],
      }).then((r) => log("whatsapp", "pandit", r)).catch((e) => console.error("[notify] pandit wa err", e));
    } else {
      console.log("[notify] no pandit phone available; skipping pandit alert");
    }

    if (panditEmail) {
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
        .then((r) => log("email", "pandit", { ok: r.sent, reason: r.error }))
        .catch((e) => console.error("[notify] pandit email err", e));
    } else {
      console.log("[notify] no pandit email available; skipping pandit email");
    }

    if (customerPhone) {
      const text = customerMessage({ customerName, pujaName, pujaDate, timeSlot, mode, panditName, panditPhone });
      sendSms({
        mobile: customerPhone,
        templateIdOverride: process.env.MSG91_SMS_TEMPLATE_ID_CUSTOMER || process.env.MSG91_SMS_TEMPLATE_ID,
        variables: {
          var1: customerName,
          var2: pujaName,
          var3: pujaDate,
          var4: timeSlot,
          var5: panditName || "TBD",
          var6: panditPhone || "",
          message: text,
        },
      }).then((r) => log("sms", "customer", r)).catch((e) => console.error("[notify] customer sms err", e));

      sendWhatsApp({
        mobile: customerPhone,
        templateName: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_CUSTOMER,
        bodyVariables: [customerName, pujaName, `${pujaDate} (${timeSlot})`, panditName || "Will be assigned", panditPhone || ""],
      }).then((r) => log("whatsapp", "customer", r)).catch((e) => console.error("[notify] customer wa err", e));
    } else {
      console.log("[notify] no customer phone available; skipping customer alert");
    }
  } catch (err) {
    console.error("[notify] notifyPujaBooking error", err);
  }
}
