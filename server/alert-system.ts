import { and, asc, eq, inArray, isNull, lte, sql } from "drizzle-orm";
import {
  ALERT_CHANNELS,
  type AlertCategory,
  type AlertChannel,
  alertDeliveries,
  alertEvents,
  alertPreferences,
  alertDeviceSubscriptions,
  users,
  userNotifications,
  type AlertPreferences,
} from "@shared/schema";
import { db } from "./db";
import { sendSms, sendWhatsApp } from "./services/msg91";
import { enqueueTransactionalEmail } from "./email-outbox";
import * as jyotish from "./jyotish";

const DEFAULT_TIMEZONE = "Asia/Kolkata";
const WORKER_INTERVAL_MS = 15_000;
const PANCHANG_SWEEP_INTERVAL_MS = 15 * 60_000;
const EXTERNAL_DELIVERY_ENABLED = process.env.ALERT_EXTERNAL_DELIVERY_ENABLED === "true";

const CATEGORY_PREFERENCE: Record<AlertCategory, keyof AlertPreferences> = {
  panchang: "panchangEnabled",
  booking: "bookingEnabled",
  order: "orderEnabled",
  account: "accountEnabled",
  operations: "operationsEnabled",
  recommendations: "recommendationsEnabled",
  promotions: "promotionsEnabled",
};

const CHANNEL_PREFERENCE: Record<AlertChannel, keyof AlertPreferences> = {
  in_app: "inAppEnabled",
  visual_overlay: "visualOverlayEnabled",
  email: "emailEnabled",
  sms: "smsEnabled",
  whatsapp: "whatsappEnabled",
  web_push: "webPushEnabled",
  android_push: "androidPushEnabled",
};

const PANCHANG_CHANNELS: AlertChannel[] = [...ALERT_CHANNELS];

function safeTimezone(value: string | null | undefined): string {
  const candidate = String(value || DEFAULT_TIMEZONE).trim() || DEFAULT_TIMEZONE;
  try {
    new Intl.DateTimeFormat("en-CA", { timeZone: candidate }).format();
    return candidate;
  } catch {
    return DEFAULT_TIMEZONE;
  }
}

function localParts(date: Date, timezone: string): { ymd: string; hour: number; minute: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: safeTimezone(timezone),
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
  return {
    ymd: `${get("year")}-${String(get("month")).padStart(2, "0")}-${String(get("day")).padStart(2, "0")}`,
    hour: get("hour"),
    minute: get("minute"),
  };
}

function addDays(ymd: string, days: number): string {
  const [year, month, day] = ymd.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
}

function dayDistance(fromYmd: string, toYmd: string): number {
  const from = Date.parse(`${fromYmd}T00:00:00Z`);
  const to = Date.parse(`${toYmd}T00:00:00Z`);
  return Math.round((to - from) / 86_400_000);
}

function localDateTimeToUtc(ymd: string, hhmm: string, timezone: string): Date {
  const [year, month, day] = ymd.split("-").map(Number);
  const [hour, minute] = hhmm.split(":").map(Number);
  const targetMs = Date.UTC(year, month - 1, day, hour || 0, minute || 0);
  let guessMs = targetMs;
  for (let i = 0; i < 2; i += 1) {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone: safeTimezone(timezone),
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    }).formatToParts(new Date(guessMs));
    const get = (type: string) => Number(parts.find((part) => part.type === type)?.value || 0);
    const displayedMs = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"), get("second"));
    guessMs = targetMs - (displayedMs - guessMs);
  }
  return new Date(guessMs);
}

function isCategoryEnabled(prefs: AlertPreferences, category: AlertCategory): boolean {
  return Boolean(prefs[CATEGORY_PREFERENCE[category]]);
}

function isChannelEnabled(prefs: AlertPreferences, channel: AlertChannel): boolean {
  return Boolean(prefs[CHANNEL_PREFERENCE[channel]]);
}

export async function getAlertPreferences(userId: number): Promise<AlertPreferences> {
  const [existing] = await db.select().from(alertPreferences)
    .where(eq(alertPreferences.userId, userId)).limit(1);
  if (existing) return existing;

  await db.insert(alertPreferences).values({ userId }).onConflictDoNothing();
  const [created] = await db.select().from(alertPreferences)
    .where(eq(alertPreferences.userId, userId)).limit(1);
  if (!created) throw new Error("Alert preferences could not be created");
  return created;
}

export async function updateAlertPreferences(
  userId: number,
  patch: Partial<Omit<AlertPreferences, "id" | "userId" | "updatedAt">>,
): Promise<AlertPreferences> {
  await getAlertPreferences(userId);
  const [updated] = await db.update(alertPreferences)
    .set({ ...patch, timezone: patch.timezone ? safeTimezone(patch.timezone) : undefined, updatedAt: new Date() })
    .where(eq(alertPreferences.userId, userId))
    .returning();
  if (!updated) throw new Error("Alert preferences could not be updated");
  return updated;
}

export async function registerAlertDevice(input: {
  userId: number;
  platform: "web" | "android";
  endpoint: string;
  permissionState?: string;
  appVersion?: string | null;
}) {
  const [row] = await db.insert(alertDeviceSubscriptions).values({
    userId: input.userId,
    platform: input.platform,
    endpoint: input.endpoint,
    permissionState: input.permissionState || "granted",
    appVersion: input.appVersion || null,
    lastSeenAt: new Date(),
    revokedAt: null,
    updatedAt: new Date(),
  }).onConflictDoUpdate({
    target: [alertDeviceSubscriptions.platform, alertDeviceSubscriptions.endpoint],
    set: {
      userId: input.userId,
      permissionState: input.permissionState || "granted",
      appVersion: input.appVersion || null,
      lastSeenAt: new Date(),
      revokedAt: null,
      updatedAt: new Date(),
    },
  }).returning({
    id: alertDeviceSubscriptions.id,
    platform: alertDeviceSubscriptions.platform,
    permissionState: alertDeviceSubscriptions.permissionState,
    lastSeenAt: alertDeviceSubscriptions.lastSeenAt,
  });
  return row;
}

export async function enqueueUserAlert(input: {
  eventKey: string;
  eventType: string;
  category: AlertCategory;
  userId: number;
  title: string;
  body?: string | null;
  link?: string | null;
  payload?: Record<string, unknown> | null;
  scheduledFor?: Date;
  relatedType?: string | null;
  relatedId?: number | null;
  channels?: AlertChannel[];
}): Promise<{ created: boolean; eventId?: number }> {
  const prefs = await getAlertPreferences(input.userId);
  const scheduledFor = input.scheduledFor || new Date();
  const channels = input.channels || PANCHANG_CHANNELS;
  const payload = {
    ...(input.payload || {}),
    title: input.title,
    body: input.body || null,
    link: input.link || null,
  };

  return db.transaction(async (tx) => {
    const [event] = await tx.insert(alertEvents).values({
      eventKey: input.eventKey,
      eventType: input.eventType,
      category: input.category,
      audience: "customer",
      userId: input.userId,
      relatedType: input.relatedType || null,
      relatedId: input.relatedId ?? null,
      payload,
      scheduledFor,
    }).onConflictDoNothing().returning({ id: alertEvents.id });

    if (!event) return { created: false };

    const categoryEnabled = isCategoryEnabled(prefs, input.category);
    const rows = channels.map((channel) => {
      const enabled = categoryEnabled && isChannelEnabled(prefs, channel);
      return {
        eventId: event.id,
        userId: input.userId,
        channel,
        status: enabled ? "queued" as const : "skipped" as const,
        lastError: enabled ? null : "Disabled by alert preference",
        scheduledFor,
        idempotencyKey: `alert:${event.id}:${input.userId}:${channel}`,
      };
    });
    if (rows.length) await tx.insert(alertDeliveries).values(rows).onConflictDoNothing();
    return { created: true, eventId: event.id };
  });
}

async function markDelivery(
  deliveryId: number,
  status: "sent" | "skipped" | "failed" | "retrying",
  error?: string | null,
  providerMessageId?: string | null,
) {
  await db.update(alertDeliveries).set({
    status,
    lastError: error || null,
    providerMessageId: providerMessageId || null,
    sentAt: status === "sent" ? new Date() : undefined,
    updatedAt: new Date(),
  }).where(eq(alertDeliveries.id, deliveryId));
}

function safeAlertError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "Alert delivery failed");
  return raw
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[redacted-email]")
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/g, "[redacted-phone]")
    .replace(/(?:password|pass|token|secret|auth)[^,\s:]*(?:\s*[:=]\s*)?\S+/gi, "[redacted-secret]")
    .slice(0, 500);
}

async function createInAppNotification(delivery: typeof alertDeliveries.$inferSelect, event: typeof alertEvents.$inferSelect) {
  if (!delivery.userId) return;
  const existing = await db.select({ id: userNotifications.id })
    .from(userNotifications)
    .where(sql`${userNotifications.meta}->>'alertEventId' = ${String(event.id)}`)
    .limit(1);
  if (existing.length) return;

  const payload = (event.payload || {}) as Record<string, unknown>;
  await db.insert(userNotifications).values({
    userId: delivery.userId,
    kind: event.eventType,
    title: String(payload.title || event.eventType),
    body: payload.body ? String(payload.body) : null,
    link: payload.link ? String(payload.link) : null,
    meta: {
      ...payload,
      alertEventId: event.id,
      alertEventKey: event.eventKey,
      visualOverlay: true,
      category: event.category,
    },
  });
}

async function processDelivery(delivery: typeof alertDeliveries.$inferSelect): Promise<void> {
  const [event] = await db.select().from(alertEvents).where(eq(alertEvents.id, delivery.eventId)).limit(1);
  if (!event) {
    await markDelivery(delivery.id, "failed", "Alert event is missing");
    return;
  }

  if (delivery.channel === "in_app" || delivery.channel === "visual_overlay") {
    await createInAppNotification(delivery, event);
    await markDelivery(delivery.id, "sent");
    return;
  }

  if (!EXTERNAL_DELIVERY_ENABLED) {
    await markDelivery(delivery.id, "skipped", "External alert delivery is disabled");
    return;
  }

  const [user] = delivery.userId
    ? await db.select({ name: users.name, email: users.email, phone: users.phone })
      .from(users).where(eq(users.id, delivery.userId)).limit(1)
    : [];
  const payload = (event.payload || {}) as Record<string, unknown>;
  const title = String(payload.title || event.eventType);
  const body = String(payload.body || "");
  const name = user?.name || "Devotee";

  if (delivery.channel === "email") {
    if (!user?.email) return markDelivery(delivery.id, "skipped", "Email recipient not configured");
    const outbox = await enqueueTransactionalEmail({
      eventKey: `alert_delivery:${delivery.id}`,
      kind: `alert_${event.eventType}`,
      relatedType: "alert_event",
      relatedId: event.id,
      recipientName: name,
      message: {
        to: user.email,
        subject: title,
        text: `Namaste ${name} ji,\n\n${body}\n\nOpen Vedic Tatva to view the complete update.`,
        html: `<p>Namaste ${name} ji,</p><p>${body.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]!))}</p><p>Open Vedic Tatva to view the complete update.</p>`,
      },
    });
    await markDelivery(delivery.id, "sent", null, `email-outbox:${outbox.row.id}`);
    return;
  }

  if (delivery.channel === "sms") {
    if (!user?.phone) return markDelivery(delivery.id, "skipped", "SMS recipient not configured");
    const result = await sendSms({
      mobile: user.phone,
      templateIdOverride: process.env.MSG91_SMS_TEMPLATE_ID_ALERT || process.env.MSG91_SMS_TEMPLATE_ID,
      variables: { var1: name, var2: title, var3: body, message: `${title}\n${body}` },
    });
    return markDelivery(delivery.id, result.ok ? "sent" : result.reason?.toLowerCase().includes("not configured") ? "skipped" : "failed", result.ok ? null : safeAlertError(result.reason));
  }

  if (delivery.channel === "whatsapp") {
    if (!user?.phone) return markDelivery(delivery.id, "skipped", "WhatsApp recipient not configured");
    const result = await sendWhatsApp({
      mobile: user.phone,
      templateName: process.env.MSG91_WHATSAPP_TEMPLATE_NAME_ALERT || process.env.MSG91_WHATSAPP_TEMPLATE_NAME,
      bodyVariables: [name, title, body],
    });
    return markDelivery(delivery.id, result.ok ? "sent" : result.reason?.toLowerCase().includes("not configured") ? "skipped" : "failed", result.ok ? null : safeAlertError(result.reason));
  }

  await markDelivery(delivery.id, "skipped", "Push provider adapter is not configured");
}

async function markProcessedIfComplete(eventId: number): Promise<void> {
  const active = await db.select({ id: alertDeliveries.id }).from(alertDeliveries).where(and(
    eq(alertDeliveries.eventId, eventId),
    inArray(alertDeliveries.status, ["queued", "processing", "retrying"]),
  )).limit(1);
  if (!active.length) {
    await db.update(alertEvents).set({ processedAt: new Date() })
      .where(and(eq(alertEvents.id, eventId), isNull(alertEvents.processedAt)));
  }
}

export async function processAlertDeliveriesOnce(limit = 50): Promise<{ processed: number; sent: number; skipped: number; failed: number }> {
  const now = new Date();
  const rows = await db.select().from(alertDeliveries)
    .where(and(
      inArray(alertDeliveries.status, ["queued", "retrying"]),
      lte(alertDeliveries.scheduledFor, now),
    ))
    .orderBy(asc(alertDeliveries.id))
    .limit(limit);
  const result = { processed: 0, sent: 0, skipped: 0, failed: 0 };

  for (const candidate of rows) {
    const [claimed] = await db.update(alertDeliveries).set({
      status: "processing",
      attemptCount: sql`${alertDeliveries.attemptCount} + 1`,
      updatedAt: now,
    }).where(and(
      eq(alertDeliveries.id, candidate.id),
      inArray(alertDeliveries.status, ["queued", "retrying"]),
      lte(alertDeliveries.scheduledFor, now),
    )).returning();
    if (!claimed) continue;
    result.processed += 1;
    try {
      await processDelivery(claimed);
      const [updated] = await db.select({ status: alertDeliveries.status })
        .from(alertDeliveries).where(eq(alertDeliveries.id, claimed.id)).limit(1);
      if (updated?.status === "sent") result.sent += 1;
      else if (updated?.status === "skipped") result.skipped += 1;
      else if (updated?.status === "failed") result.failed += 1;
    } catch (error) {
      await markDelivery(claimed.id, claimed.attemptCount >= 5 ? "failed" : "retrying", safeAlertError(error));
      if (claimed.attemptCount >= 5) result.failed += 1;
    }
    await markProcessedIfComplete(claimed.eventId);
  }
  return result;
}

async function monthlyForUser(userCity: string | null | undefined, year: number, month: number) {
  const { city } = await jyotish.geocodePlace(userCity || "Delhi");
  return jyotish.computeMonthlyPanchang(year, month, city);
}

const monthlyCache = new Map<string, { expiresAt: number; data: ReturnType<typeof jyotish.computeMonthlyPanchang> }>();

async function getMonthly(cityName: string | null | undefined, year: number, month: number) {
  const key = `${cityName || "Delhi"}:${year}-${month}`;
  const cached = monthlyCache.get(key);
  if (cached && cached.expiresAt > Date.now()) return cached.data;
  const data = await monthlyForUser(cityName, year, month);
  monthlyCache.set(key, { data, expiresAt: Date.now() + 6 * 60 * 60 * 1000 });
  return data;
}

function eventLabel(day: { festival: string | null; tithi: string; paksha: string }): string | null {
  if (day.festival) return day.festival;
  if (day.paksha.toLowerCase().includes("krishna") && day.tithi.toLowerCase().includes("chaturdashi")) {
    return "Masik Shivratri";
  }
  return null;
}

export async function runPanchangAlertSweep(): Promise<{ users: number; queued: number }> {
  const allUsers = await db.select({
    id: users.id,
    city: users.city,
  }).from(users).limit(10_000);
  const now = new Date();
  let queued = 0;

  for (const user of allUsers) {
    const prefs = await getAlertPreferences(user.id);
    if (!prefs.panchangEnabled) continue;
    const timezone = safeTimezone(prefs.timezone);
    const today = localParts(now, timezone).ymd;
    const [year, month] = today.split("-").map(Number);
    const months = new Map<string, ReturnType<typeof jyotish.computeMonthlyPanchang>>();
    const current = await getMonthly(user.city, year, month);
    months.set(`${year}-${month}`, current);
    const nextYmd = addDays(today, 3);
    const [nextYear, nextMonth] = nextYmd.split("-").map(Number);
    if (nextYear !== year || nextMonth !== month) {
      months.set(`${nextYear}-${nextMonth}`, await getMonthly(user.city, nextYear, nextMonth));
    }

    for (const monthData of Array.from(months.values())) {
      for (const day of monthData.days) {
        const eventDate = `${monthData.year}-${String(monthData.month).padStart(2, "0")}-${String(day.date).padStart(2, "0")}`;
        const offset = dayDistance(today, eventDate);
        if (offset < 0 || offset > 2) continue;
        const label = eventLabel(day);
        if (!label) continue;
        const scheduledFor = localDateTimeToUtc(today, prefs.dailySendTime, timezone);
        const result = await enqueueUserAlert({
          eventKey: `panchang:${user.id}:${eventDate}:${offset}`,
          eventType: "panchang.sacred_day_upcoming",
          category: "panchang",
          userId: user.id,
          title: `${label} ${offset === 0 ? "today" : offset === 1 ? "tomorrow" : "in 2 days"}`,
          body: `${label} falls on ${eventDate}. Open your Panchang for the tithi, nakshatra, and observance details.`,
          link: `/panchang-calendar?date=${eventDate}`,
          payload: {
            eventDate,
            reminderOffsetDays: offset,
            label,
            tithi: day.tithi,
            paksha: day.paksha,
            nakshatra: day.nakshatra,
            motif: label.toLowerCase().includes("ekadashi") ? "lotus" : label.toLowerCase().includes("shiv") ? "trishul" : "kalash",
          },
          scheduledFor,
          relatedType: "panchang_day",
        });
        if (result.created) queued += 1;
      }
    }
  }
  return { users: allUsers.length, queued };
}

let workerStarted = false;
export function startAlertSystemWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  const deliverTick = () => {
    processAlertDeliveriesOnce().catch((error) => console.error("[alerts] delivery worker failed:", safeAlertError(error)));
  };
  const sweepTick = () => {
    runPanchangAlertSweep().catch((error) => console.error("[alerts] Panchang sweep failed:", safeAlertError(error)));
  };
  setTimeout(deliverTick, 3_000);
  setInterval(deliverTick, WORKER_INTERVAL_MS);
  setTimeout(sweepTick, 8_000);
  setInterval(sweepTick, PANCHANG_SWEEP_INTERVAL_MS);
  console.log("[alerts] unified alert worker started");
}