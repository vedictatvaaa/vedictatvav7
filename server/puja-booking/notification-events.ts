import { createHash } from "crypto";
import { pujaBookingDeliveries, pujaBookingEvents } from "@shared/schema";

export type BookingNotificationChannel = "portal" | "email" | "whatsapp" | "sms";

function stablePart(value: string | number | null | undefined): string {
  return value == null ? "none" : String(value).trim().toLowerCase();
}

export function bookingEventKey(input: {
  bookingId: number;
  eventType: string;
  recipientParty: string;
  recipientId?: number | null;
  occurrence?: string | number;
}): string {
  return [
    "booking", input.bookingId, input.eventType, input.recipientParty,
    stablePart(input.recipientId), stablePart(input.occurrence),
  ].join(":");
}

export function bookingDeliveryKey(input: {
  eventKey: string;
  recipient: string | number;
  channel: BookingNotificationChannel;
  templateVersion?: string;
}): string {
  const canonical = [
    input.eventKey,
    stablePart(input.recipient),
    input.channel,
    stablePart(input.templateVersion || "v1"),
  ].join("|");
  return createHash("sha256").update(canonical).digest("hex");
}

export function safeDeliveryError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "Delivery failed");
  return raw
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[redacted-email]")
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/g, "[redacted-phone]")
    .slice(0, 500);
}

export async function enqueueBookingNotificationEvent(
  client: any,
  input: {
    bookingId: number;
    eventType: string;
    recipientParty: string;
    recipientId?: number | null;
    occurrence?: string | number;
    payload?: Record<string, unknown>;
    channels?: BookingNotificationChannel[];
    templateVersion?: string;
  },
) {
  const eventKey = bookingEventKey(input);
  const inserted = await client.insert(pujaBookingEvents).values({
    bookingId: input.bookingId,
    eventType: input.eventType,
    recipientParty: input.recipientParty,
    recipientId: input.recipientId ?? null,
    eventKey,
    payload: input.payload || null,
  }).onConflictDoNothing().returning({ id: pujaBookingEvents.id });
  if (!inserted.length) return { eventKey, created: false };
  for (const channel of input.channels || []) {
    if (channel === "portal") continue;
    await client.insert(pujaBookingDeliveries).values({
      eventId: inserted[0].id,
      channel,
      templateVersion: input.templateVersion || "v1",
      idempotencyKey: bookingDeliveryKey({
        eventKey,
        recipient: input.recipientId ?? input.recipientParty,
        channel,
        templateVersion: input.templateVersion,
      }),
      status: "queued",
    }).onConflictDoNothing();
  }
  return { eventKey, created: true, eventId: inserted[0].id };
}