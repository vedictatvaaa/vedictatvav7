// =====================================================================
// Karma & Dharma tracker — backend.
//   - POST /api/spiritual/log              — log an activity
//   - GET  /api/spiritual/activities       — paginated history
//   - GET  /api/spiritual/dashboard        — aggregated scores + streaks
//   - GET  /api/festivals                  — public list of upcoming
//   - POST /api/admin/festivals (+ PATCH/DELETE) — admin CRUD
//   - Scheduler: runFestivalReminderSweep() runs hourly + on boot, sends
//     one reminder email per (festival, recipient) when a festival is
//     exactly 7 days out. Idempotent via festivalReminderLog unique index.
// User identity uses the project's existing x-user-id + x-user-email pair.
// =====================================================================
import type { Express, Request, Response, NextFunction } from "express";
import { and, desc, eq, gte, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "./db";
import {
  spiritualActivities, festivals, festivalReminderLog,
  users, pandits, SPIRITUAL_ACTIVITY_TYPES,
  insertFestivalSchema,
} from "@shared/schema";
import { sendEmailAsync } from "./email";
import { adminAuthMiddleware } from "./admin-auth";

// --- Karma / Dharma weights ---------------------------------------------
// Tuned so every action moves the needle but heavy spiritual acts dominate.
// Karma = personal merit, Dharma = service-to-others / ancestral duty.
type ActivityType = (typeof SPIRITUAL_ACTIVITY_TYPES)[number];
const WEIGHTS: Record<ActivityType, (value: number) => { karma: number; dharma: number }> = {
  japa:      (v) => ({ karma: Math.floor(v / 108) * 1, dharma: 0 }),       // 1 karma per mala (108)
  charity:   (v) => ({ karma: Math.floor(v / 100) * 5, dharma: Math.floor(v / 100) * 5 }), // ₹100 → +5/+5
  fasting:   (v) => ({ karma: v * 10, dharma: v * 2 }),                   // per day
  temple:    (v) => ({ karma: v * 3, dharma: v * 2 }),                    // per visit
  gauseva:   (v) => ({ karma: v * 15, dharma: v * 15 }),
  pind_daan: (v) => ({ karma: v * 25, dharma: v * 50 }),
};

// --- Identity (mirrors astro-realtime.ts pattern) -----------------------
async function resolveUserId(req: Request): Promise<number | null> {
  const idHdr = (req.headers["x-user-id"] || "").toString();
  const emailHdr = (req.headers["x-user-email"] || "").toString().trim().toLowerCase();
  if (!idHdr || !emailHdr) return null;
  const userId = Number(idHdr);
  if (!Number.isFinite(userId)) return null;
  const rows = await db.select({ id: users.id, email: users.email })
    .from(users).where(eq(users.id, userId)).limit(1);
  if (!rows.length) return null;
  if ((rows[0].email || "").toLowerCase() !== emailHdr) return null;
  return userId;
}

// Admin gate: project's shared adminAuthMiddleware — validates token AND
// confirms users.role === 'admin'. Cast satisfies the AdminRequest type
// while still receiving plain Express Request callers.
const adminGate = adminAuthMiddleware as unknown as (req: Request, res: Response, next: NextFunction) => void;

// --- Streak helper: count consecutive UTC-day-boundaries ending today ---
function computeStreak(dates: Date[]): number {
  if (!dates.length) return 0;
  const days = new Set(dates.map((d) => d.toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  for (;;) {
    const key = cursor.toISOString().slice(0, 10);
    if (days.has(key)) { streak++; cursor.setUTCDate(cursor.getUTCDate() - 1); }
    else break;
  }
  return streak;
}

// =====================================================================
// Routes
// =====================================================================
export function registerSpiritualTrackerRoutes(app: Express) {
  // --- Log an activity ------------------------------------------------
  app.post("/api/spiritual/log", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const schema = z.object({
        activityType: z.enum(SPIRITUAL_ACTIVITY_TYPES),
        value: z.number().int().positive().max(1_000_000),
        notes: z.string().max(500).optional(),
        performedAt: z.string().datetime().optional(),
      });
      const body = schema.parse(req.body);
      const w = WEIGHTS[body.activityType](body.value);
      const [row] = await db.insert(spiritualActivities).values({
        userId,
        activityType: body.activityType,
        value: body.value,
        karmaPoints: w.karma,
        dharmaPoints: w.dharma,
        notes: body.notes ?? null,
        performedAt: body.performedAt ? new Date(body.performedAt) : new Date(),
      }).returning();
      res.json({ ok: true, activity: row });
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid payload", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  // --- Activity history (paginated) ----------------------------------
  app.get("/api/spiritual/activities", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });
      const limit = Math.min(100, Number(req.query.limit) || 30);
      const offset = Math.max(0, Number(req.query.offset) || 0);
      const rows = await db.select().from(spiritualActivities)
        .where(eq(spiritualActivities.userId, userId))
        .orderBy(desc(spiritualActivities.performedAt))
        .limit(limit).offset(offset);
      res.json({ activities: rows, limit, offset });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- Aggregated dashboard payload ----------------------------------
  app.get("/api/spiritual/dashboard", async (req, res) => {
    try {
      const userId = await resolveUserId(req);
      if (!userId) return res.status(401).json({ error: "Authentication required" });

      // One scan; aggregate in code so we get per-type breakdown + totals
      // in a single round-trip.
      const all = await db.select().from(spiritualActivities)
        .where(eq(spiritualActivities.userId, userId))
        .orderBy(desc(spiritualActivities.performedAt));

      const totals = {
        karma: 0, dharma: 0,
        japa: 0, charity: 0, fasting: 0, temple: 0, gauseva: 0, pind_daan: 0,
      } as Record<string, number>;
      for (const a of all) {
        totals.karma += a.karmaPoints;
        totals.dharma += a.dharmaPoints;
        totals[a.activityType] = (totals[a.activityType] || 0) + a.value;
      }
      const fastingDates = all
        .filter((a) => a.activityType === "fasting")
        .map((a) => new Date(a.performedAt));
      const fastingStreak = computeStreak(fastingDates);

      // Level: every 500 karma = +1 level, capped display at 50.
      const level = Math.min(50, Math.floor(totals.karma / 500) + 1);
      const nextLevelAt = level * 500;
      const recent = all.slice(0, 10);

      // Surface upcoming festivals here too so the dashboard is one call.
      const today = new Date().toISOString().slice(0, 10);
      const upcoming = await db.select().from(festivals)
        .where(and(eq(festivals.isActive, true), gte(festivals.date, today)))
        .orderBy(festivals.date).limit(5);

      res.json({
        totals,
        level,
        nextLevelAt,
        karmaToNextLevel: Math.max(0, nextLevelAt - totals.karma),
        fastingStreak,
        activityCount: all.length,
        recent,
        upcomingFestivals: upcoming,
      });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- Public festivals ----------------------------------------------
  app.get("/api/festivals", async (req, res) => {
    try {
      const today = new Date().toISOString().slice(0, 10);
      const upcomingOnly = req.query.upcoming !== "false";
      const rows = upcomingOnly
        ? await db.select().from(festivals)
            .where(and(eq(festivals.isActive, true), gte(festivals.date, today)))
            .orderBy(festivals.date)
        : await db.select().from(festivals).orderBy(festivals.date);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  // --- Admin festivals CRUD ------------------------------------------
  app.get("/api/admin/festivals", adminGate, async (_req, res) => {
    try {
      const rows = await db.select().from(festivals).orderBy(festivals.date);
      res.json(rows);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.post("/api/admin/festivals", adminGate, async (req, res) => {
    try {
      const body = insertFestivalSchema.parse(req.body);
      const [row] = await db.insert(festivals).values(body as any).returning();
      res.json(row);
    } catch (e: any) {
      if (e.issues) return res.status(400).json({ error: "Invalid", details: e.issues });
      res.status(500).json({ error: e.message });
    }
  });

  app.patch("/api/admin/festivals/:id", adminGate, async (req, res) => {
    try {
      const id = Number(req.params.id);
      const [row] = await db.update(festivals).set(req.body).where(eq(festivals.id, id)).returning();
      if (!row) return res.status(404).json({ error: "Not found" });
      res.json(row);
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });

  app.delete("/api/admin/festivals/:id", adminGate, async (req, res) => {
    try {
      await db.delete(festivals).where(eq(festivals.id, Number(req.params.id)));
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ error: e.message }); }
  });
}

// =====================================================================
// Scheduler — daily festival reminders, fired 7 days before each.
// Idempotent: a unique (festivalId, recipientType, recipientId) index
// guarantees we never email the same person twice for the same festival.
// =====================================================================
export async function runFestivalReminderSweep(): Promise<{ sent: number; skipped: number }> {
  // Compute the target date: today + 7 days, in UTC YYYY-MM-DD.
  const target = new Date();
  target.setUTCDate(target.getUTCDate() + 7);
  const targetDate = target.toISOString().slice(0, 10);

  const due = await db.select().from(festivals)
    .where(and(eq(festivals.isActive, true), eq(festivals.date, targetDate)));

  let sent = 0; let skipped = 0;
  for (const f of due) {
    // Recipients: optionally users + pandits, depending on flags.
    const recipients: Array<{ type: "user" | "pandit"; id: number; email: string; name: string }> = [];
    if (f.notifyUsers) {
      const us = await db.select({ id: users.id, email: users.email, name: users.name }).from(users);
      for (const u of us) if (u.email) recipients.push({ type: "user", id: u.id, email: u.email, name: u.name });
    }
    if (f.notifyPandits) {
      const ps = await db.select({ id: pandits.id, email: pandits.email, name: pandits.name }).from(pandits);
      for (const p of ps) if (p.email) recipients.push({ type: "pandit", id: p.id, email: p.email, name: p.name });
    }

    for (const r of recipients) {
      try {
        // Atomic dedup: insert-on-conflict-do-nothing returns 0 rows if already sent.
        const ins = await db.insert(festivalReminderLog).values({
          festivalId: f.id, recipientType: r.type, recipientId: r.id,
        }).onConflictDoNothing().returning();
        if (!ins.length) { skipped++; continue; }
        const subject = `${f.name} is in 7 days — prepare your sadhana`;
        const html = `
          <div style="font-family:Inter,system-ui,sans-serif;max-width:560px;margin:auto">
            <h2 style="color:#7a1d1d;font-family:'Playfair Display',serif">${f.name}</h2>
            <p>Namaste ${r.name || ""},</p>
            <p><strong>${f.name}</strong> falls on <strong>${f.date}</strong> — exactly one week away.</p>
            ${f.description ? `<p>${f.description}</p>` : ""}
            ${f.preparationNotes ? `<div style="background:#fdf6e9;border:1px solid #e6d3a3;border-radius:8px;padding:12px 16px;margin:16px 0">
              <strong style="color:#7a1d1d">Preparation</strong><br/>${f.preparationNotes}
            </div>` : ""}
            <p style="font-size:13px;color:#666;margin-top:20px">
              ${r.type === "pandit"
                ? "Block your calendar early — bookings spike before festivals."
                : 'Plan your puja, samagri & pandit booking now at <a href="https://vedictatva.com">vedictatva.com</a>.'}
            </p>
          </div>`;
        sendEmailAsync({
          to: r.email,
          subject,
          text: `${f.name} is in 7 days (${f.date}). ${f.preparationNotes || ""}`,
          html,
        }, "festival-reminder", { kind: "customer" });
        sent++;
      } catch (err) {
        console.error("[festival-reminder] failed for", r.email, err);
        skipped++;
      }
    }
  }
  return { sent, skipped };
}
