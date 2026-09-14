import { and, eq } from "drizzle-orm";
import { db } from "./db";
import { enqueueTransactionalEmail } from "./email-outbox";
import { panditServices, pandits } from "@shared/schema";

const reminderMissingFields = (pandit: any, services: any[]) => {
  const missing: string[] = [];
  if (!String(pandit.name || "").trim()) missing.push("name");
  if (!String(pandit.phone || "").trim()) missing.push("phone");
  if (!String(pandit.email || "").trim()) missing.push("email");
  if (!String(pandit.image || "").trim()) missing.push("profile photo");
  if (!String(pandit.bio || "").trim()) missing.push("biography");
  if (!String(pandit.education || "").trim()) missing.push("education");
  if (!String(pandit.languages || "").trim()) missing.push("languages");
  if (!String(pandit.city || "").trim() || !String(pandit.state || "").trim()) missing.push("registered location");
  if (!services.length) missing.push("at least one active service");
  return missing;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character] || character));
}

export async function runPanditProfileReminderSweep() {
  const rows = await db.select({ pandit: pandits, service: panditServices })
    .from(pandits)
    .leftJoin(panditServices, and(eq(panditServices.panditId, pandits.id), eq(panditServices.isActive, true)));
  const grouped = new Map<number, { pandit: any; services: any[] }>();
  for (const row of rows) {
    const existing = grouped.get(row.pandit.id) || { pandit: row.pandit, services: [] };
    if (row.service) existing.services.push(row.service);
    grouped.set(row.pandit.id, existing);
  }

  const dayKey = new Date().toISOString().slice(0, 10);
  let queued = 0;
  let skipped = 0;
  for (const { pandit, services } of Array.from(grouped.values())) {
    if (pandit.archived || pandit.accountStatus === "banned" || !String(pandit.email || "").trim()) {
      skipped += 1;
      continue;
    }
    const missing = reminderMissingFields(pandit, services);
    if (!missing.length) {
      skipped += 1;
      continue;
    }
    const list = missing.map(escapeHtml).join(", ");
    const displayName = escapeHtml(String(pandit.name || "Pandit"));
    const result = await enqueueTransactionalEmail({
      eventKey: `pandit-profile-completion-reminder:${pandit.id}:${dayKey}`,
      kind: "pandit_profile_completion_reminder",
      recipientName: pandit.name,
      relatedType: "pandit",
      relatedId: pandit.id,
      message: {
        to: pandit.email,
        subject: "Please complete your Vedic Tatva Pandit profile",
        text: `Namaste ${pandit.name || "Pandit"},\n\nPlease update your Vedic Tatva profile. Missing details: ${missing.join(", ")}.\n\nSign in to your Pandit portal to complete your profile. Booking remains gated until the required details are complete.\n\nVedic Tatva`,
        html: `<p>Namaste ${displayName},</p><p>Please update your Vedic Tatva Pandit profile. The following details are still missing:</p><p><strong>${list}</strong></p><p>Sign in to your Pandit portal to complete your profile. Booking remains gated until the required details are complete.</p><p>Vedic Tatva</p>`,
      },
    });
    if (result.created) queued += 1;
  }
  return { scanned: grouped.size, queued, skipped };
}