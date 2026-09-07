import { createCipheriv, createDecipheriv, createHash, randomBytes } from "crypto";
import { and, asc, eq, inArray, lte, sql } from "drizzle-orm";
import { db } from "./db";
import { emailOutbox, pujaBookingDeliveries, type EmailOutbox } from "@shared/schema";
import { sendEmail, type EmailMessage } from "./email";

const MAX_ATTEMPTS = 8;
const WORKER_INTERVAL_MS = 15_000;
const PROCESSING_LEASE_MS = 10 * 60 * 1000;

function encryptionKey(): Buffer {
  // Hostinger's SMTP password is only for SMTP authentication. Payload
  // encryption uses the existing application secret with a separate purpose.
  const secret = process.env.SESSION_SECRET || "development-only-email-outbox-secret";
  return createHash("sha256").update(`${secret}\0vedictatva-email-outbox-v1`).digest();
}

function encryptMessage(message: EmailMessage): { ciphertext: string; iv: string; authTag: string } {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(message), "utf8"), cipher.final()]);
  return {
    ciphertext: ciphertext.toString("base64"),
    iv: iv.toString("base64"),
    authTag: cipher.getAuthTag().toString("base64"),
  };
}

function decryptMessage(row: EmailOutbox): EmailMessage {
  if (!row.payloadCiphertext || !row.payloadIv || !row.payloadAuthTag) {
    throw new Error("Email payload is missing");
  }
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(row.payloadIv, "base64"));
  decipher.setAuthTag(Buffer.from(row.payloadAuthTag, "base64"));
  const plaintext = Buffer.concat([
    decipher.update(Buffer.from(row.payloadCiphertext, "base64")),
    decipher.final(),
  ]).toString("utf8");
  const parsed = JSON.parse(plaintext);
  if (!parsed || typeof parsed.to !== "string" || typeof parsed.subject !== "string") {
    throw new Error("Email payload is invalid");
  }
  return parsed as EmailMessage;
}

function safeError(error: unknown): string {
  const raw = error instanceof Error ? error.message : String(error || "Email delivery failed");
  return raw
    .replace(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/g, "[redacted-email]")
    .replace(/(?:\+?91[\s-]?)?[6-9]\d{9}/g, "[redacted-phone]")
    .replace(/(?:password|pass|token|secret|auth)[^,\s:]*(?:\s*[:=]\s*)?\S+/gi, "[redacted-secret]")
    .slice(0, 500);
}

function recipientPreview(email: string): string {
  const [local, domain] = email.toLowerCase().split("@");
  return local && domain ? `${local.slice(0, 2)}***@${domain}` : "***";
}

export async function enqueueTransactionalEmail(input: {
  eventKey: string;
  kind: string;
  message: EmailMessage;
  recipientName?: string | null;
  relatedType?: string | null;
  relatedId?: number | null;
  bookingDeliveryId?: number | null;
}): Promise<{ created: boolean; row: EmailOutbox }> {
  if (!input.message.to?.trim()) throw new Error("Transactional email recipient is missing");
  const encrypted = encryptMessage(input.message);
  const [created] = await db.insert(emailOutbox).values({
    eventKey: input.eventKey,
    kind: input.kind,
    recipientEmail: input.message.to.trim().toLowerCase(),
    recipientName: input.recipientName || null,
    relatedType: input.relatedType || null,
    relatedId: input.relatedId ?? null,
    bookingDeliveryId: input.bookingDeliveryId ?? null,
    subject: input.message.subject,
    payloadCiphertext: encrypted.ciphertext,
    payloadIv: encrypted.iv,
    payloadAuthTag: encrypted.authTag,
    status: "queued",
    nextAttemptAt: new Date(),
  }).onConflictDoNothing().returning();

  if (created) return { created: true, row: created };
  const [existing] = await db.select().from(emailOutbox).where(eq(emailOutbox.eventKey, input.eventKey)).limit(1);
  if (!existing) throw new Error("Email outbox idempotency record could not be loaded");
  return { created: false, row: existing };
}

async function updateBookingDelivery(row: EmailOutbox, status: "sent" | "failed", error?: string | null) {
  if (!row.bookingDeliveryId) return;
  await db.update(pujaBookingDeliveries).set({
    status,
    lastError: status === "sent" ? null : error || "Email delivery failed",
    sentAt: status === "sent" ? new Date() : null,
    updatedAt: new Date(),
  }).where(eq(pujaBookingDeliveries.id, row.bookingDeliveryId));
}

async function markFailure(row: EmailOutbox, error: unknown): Promise<void> {
  const message = safeError(error);
  const attempts = row.attemptCount;
  if (attempts >= MAX_ATTEMPTS) {
    await db.update(emailOutbox).set({
      status: "failed",
      lastError: message,
      lockedAt: null,
      updatedAt: new Date(),
    }).where(eq(emailOutbox.id, row.id));
    await updateBookingDelivery(row, "failed", message);
    return;
  }
  const delayMs = Math.min(24 * 60 * 60 * 1000, Math.max(30_000, 30_000 * (2 ** Math.min(attempts - 1, 8))));
  await db.update(emailOutbox).set({
    status: "retrying",
    lastError: message,
    nextAttemptAt: new Date(Date.now() + delayMs),
    lockedAt: null,
    updatedAt: new Date(),
  }).where(eq(emailOutbox.id, row.id));
}

export async function processEmailOutboxOnce(limit = 10): Promise<{ processed: number; sent: number; retried: number; failed: number }> {
  const now = new Date();
  const stale = new Date(now.getTime() - PROCESSING_LEASE_MS);
  await db.update(emailOutbox).set({
    status: "retrying",
    lockedAt: null,
    nextAttemptAt: now,
    updatedAt: now,
  }).where(and(eq(emailOutbox.status, "processing"), lte(emailOutbox.lockedAt, stale)));

  const candidates = await db.select().from(emailOutbox)
    .where(and(
      inArray(emailOutbox.status, ["queued", "retrying"]),
      lte(emailOutbox.nextAttemptAt, now),
    ))
    .orderBy(asc(emailOutbox.id))
    .limit(limit);

  const result = { processed: 0, sent: 0, retried: 0, failed: 0 };
  for (const candidate of candidates) {
    const [claimed] = await db.update(emailOutbox).set({
      status: "processing",
      lockedAt: now,
      attemptCount: sql`${emailOutbox.attemptCount} + 1`,
      updatedAt: now,
    }).where(and(
      eq(emailOutbox.id, candidate.id),
      inArray(emailOutbox.status, ["queued", "retrying"]),
      lte(emailOutbox.nextAttemptAt, now),
    )).returning();
    if (!claimed) continue;

    result.processed += 1;
    try {
      const message = decryptMessage(claimed);
      const delivery = await sendEmail(message);
      if (!delivery.sent) {
        await markFailure(claimed, delivery.error || "Hostinger SMTP delivery failed");
        if (claimed.attemptCount >= MAX_ATTEMPTS) result.failed += 1;
        else result.retried += 1;
        continue;
      }
      await db.update(emailOutbox).set({
        status: "sent",
        payloadCiphertext: null,
        payloadIv: null,
        payloadAuthTag: null,
        lastError: null,
        lockedAt: null,
        sentAt: new Date(),
        updatedAt: new Date(),
      }).where(eq(emailOutbox.id, claimed.id));
      await updateBookingDelivery(claimed, "sent");
      result.sent += 1;
    } catch (error) {
      await markFailure(claimed, error);
      if (claimed.attemptCount >= MAX_ATTEMPTS) result.failed += 1;
      else result.retried += 1;
    }
  }
  return result;
}

let workerStarted = false;
export function startEmailOutboxWorker(): void {
  if (workerStarted) return;
  workerStarted = true;
  const tick = () => {
    processEmailOutboxOnce().catch((error) => console.error("[email-outbox] worker failed:", safeError(error)));
  };
  setTimeout(tick, 2_000);
  const timer = setInterval(tick, WORKER_INTERVAL_MS);
  if (typeof (timer as any).unref === "function") (timer as any).unref();
  console.log("[email-outbox] Hostinger transactional email worker started");
}

export async function getEmailOutboxSummary() {
  const rows = await db.select({
    status: emailOutbox.status,
    count: sql<number>`count(*)::int`,
  }).from(emailOutbox).groupBy(emailOutbox.status);
  const counts: Record<string, number> = {};
  for (const row of rows) counts[row.status] = Number(row.count || 0);
  const [oldest] = await db.select({
    createdAt: emailOutbox.createdAt,
    status: emailOutbox.status,
  }).from(emailOutbox)
    .where(inArray(emailOutbox.status, ["queued", "retrying", "processing"]))
    .orderBy(asc(emailOutbox.createdAt)).limit(1);
  return { counts, oldestQueuedAt: oldest?.createdAt || null };
}

export async function listEmailOutbox(input: {
  limit: number;
  offset: number;
  status?: string;
  kind?: string;
  recipient?: string;
}) {
  const conditions = [];
  if (input.status && input.status !== "all") conditions.push(eq(emailOutbox.status, input.status));
  if (input.kind && input.kind !== "all") conditions.push(eq(emailOutbox.kind, input.kind));
  if (input.recipient) conditions.push(sql`lower(${emailOutbox.recipientEmail}) like ${`%${input.recipient.toLowerCase()}%`}`);
  const where = conditions.length ? and(...conditions) : undefined;
  const [rows, total] = await Promise.all([
    db.select({
      id: emailOutbox.id,
      eventKey: emailOutbox.eventKey,
      kind: emailOutbox.kind,
      recipientEmail: emailOutbox.recipientEmail,
      subject: emailOutbox.subject,
      relatedType: emailOutbox.relatedType,
      relatedId: emailOutbox.relatedId,
      status: emailOutbox.status,
      attemptCount: emailOutbox.attemptCount,
      lastError: emailOutbox.lastError,
      sentAt: emailOutbox.sentAt,
      createdAt: emailOutbox.createdAt,
      updatedAt: emailOutbox.updatedAt,
    }).from(emailOutbox).where(where).orderBy(sql`${emailOutbox.id} desc`).limit(input.limit).offset(input.offset),
    db.select({ count: sql<number>`count(*)::int` }).from(emailOutbox).where(where),
  ]);
  return {
    rows: rows.map(row => ({ ...row, recipientEmail: recipientPreview(row.recipientEmail) })),
    total: Number(total[0]?.count || 0),
  };
}

export async function retryEmailOutbox(id: number): Promise<EmailOutbox | undefined> {
  const [row] = await db.update(emailOutbox).set({
    status: "queued",
    nextAttemptAt: new Date(),
    lockedAt: null,
    lastError: null,
    updatedAt: new Date(),
  }).where(eq(emailOutbox.id, id)).returning();
  return row;
}