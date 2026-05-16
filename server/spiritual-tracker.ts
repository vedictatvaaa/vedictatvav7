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

// =====================================================================
// One-shot seed — populates `festivals` from the canonical list mirrored
// from client/src/lib/festivals.ts so admin DB and homepage decor share
// the same calendar. Runs once at boot if the table is empty; admins can
// add/edit/delete freely after that — we never overwrite.
// =====================================================================
const FESTIVAL_SEED: Array<{ slug: string; name: string; date: string; description: string; preparationNotes: string }> = [
  { slug: "makar-sankranti",  name: "Makar Sankranti",        date: "2026-01-14", description: "Sun enters Capricorn — harvest & til-gud.", preparationNotes: "Til-gud, kite flying, Surya namaskar, dakshina to pandit." },
  { slug: "vasant-panchami",  name: "Vasant Panchami",        date: "2026-01-23", description: "Saraswati Puja — knowledge & arts.", preparationNotes: "Yellow flowers, books on mandir, kheer prasad." },
  { slug: "mahashivratri",    name: "Maha Shivratri",         date: "2026-02-15", description: "Great night of Shiva — fasting & jagran.", preparationNotes: "Bilva leaves, milk, gangajal for Rudrabhishek." },
  { slug: "holi",             name: "Holi",                   date: "2026-03-04", description: "Festival of colours — burn ego with Holika.", preparationNotes: "Organic gulal, gujiya, Holika Dahan samagri." },
  { slug: "ram-navami",       name: "Ram Navami",             date: "2026-04-05", description: "Birth of Lord Rama — Ramayana paath.", preparationNotes: "Tulsi, kheer, Ramayana recital, charanamrit." },
  { slug: "akshaya-tritiya",  name: "Akshaya Tritiya",        date: "2026-04-20", description: "Day of eternal prosperity — gold & gifting.", preparationNotes: "Gold/silver, donations, Lakshmi-Narayan puja." },
  { slug: "ganga-dussehra",   name: "Ganga Dussehra",         date: "2026-05-26", description: "Descent of Ma Ganga — purifying ablution.", preparationNotes: "Gangajal, white flowers, lamps for visarjan." },
  { slug: "rath-yatra",       name: "Jagannath Rath Yatra",   date: "2026-06-27", description: "Jagannath rides through Puri.", preparationNotes: "Khichdi prasad, peda, jagannath katha." },
  { slug: "guru-purnima",     name: "Guru Purnima",           date: "2026-07-10", description: "Honour your guru — sacred lineage.", preparationNotes: "Guru dakshina, paduka puja, white sweets." },
  { slug: "raksha-bandhan",   name: "Raksha Bandhan",         date: "2026-08-28", description: "Sacred thread of protection.", preparationNotes: "Rakhi thread, roli-akshat, sweets." },
  { slug: "janmashtami",      name: "Krishna Janmashtami",    date: "2026-09-04", description: "Birth of Lord Krishna — midnight abhishek.", preparationNotes: "Makhan-mishri, panjiri, jhula decoration." },
  { slug: "ganesh-chaturthi", name: "Ganesh Chaturthi",       date: "2026-09-14", description: "Ganesha utsav — modak & sthapana.", preparationNotes: "Modak, durva grass, eco Ganesha murti." },
  { slug: "navratri",         name: "Sharadiya Navratri",     date: "2026-09-22", description: "Nine nights of Devi worship.", preparationNotes: "Akhand jyot, kalash sthapana, vrat samagri." },
  { slug: "dussehra",         name: "Vijayadashami",          date: "2026-10-02", description: "Victory of Rama over Ravana.", preparationNotes: "Shami leaves, weapon puja, Ravana-dahan." },
  { slug: "karva-chauth",     name: "Karva Chauth",           date: "2026-10-09", description: "Sacred fast for spousal longevity.", preparationNotes: "Karva, sieve, mehendi, sargi thali." },
  { slug: "diwali",           name: "Diwali (Lakshmi Puja)",  date: "2026-11-08", description: "Festival of lights — Lakshmi-Ganesh puja.", preparationNotes: "Diyas, rangoli, Lakshmi-Ganesh murti, kuber yantra." },
  { slug: "chhath",           name: "Chhath Puja",            date: "2026-11-14", description: "Surya & Chhathi Maiya — purest fast.", preparationNotes: "Sup, daura, thekua, sugarcane, ghat preparation." },
  { slug: "tulsi-vivah",      name: "Tulsi Vivah",            date: "2026-11-23", description: "Sacred marriage of Tulsi & Shaligram.", preparationNotes: "Tulsi plant, mandap, shaligram, wedding samagri." },
  { slug: "geeta-jayanti",    name: "Geeta Jayanti",          date: "2026-12-01", description: "Birth of the Bhagavad Gita.", preparationNotes: "Gita paath, yellow flowers, Krishna bhog." },
];

export async function seedFestivalsIfEmpty(): Promise<number> {
  try {
    const existing = await db.select({ id: festivals.id }).from(festivals).limit(1);
    if (existing.length) return 0;
    let inserted = 0;
    for (const f of FESTIVAL_SEED) {
      try {
        await db.insert(festivals).values({
          slug: f.slug, name: f.name, date: f.date,
          description: f.description, preparationNotes: f.preparationNotes,
          notifyUsers: true, notifyPandits: true, isActive: true,
        }).onConflictDoNothing();
        inserted++;
      } catch (e) { /* slug collision — fine */ }
    }
    console.log(`[festivals] seeded ${inserted} festivals from canonical list`);
    return inserted;
  } catch (e) {
    console.error("[festivals] seed failed:", e);
    return 0;
  }
}
