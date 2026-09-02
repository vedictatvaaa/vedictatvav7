import type { Express } from "express";
import { db } from "./db";
import {
  tirthYatraTours,
  tirths,
  temples,
  destinationSlugAliases,
  tirthYatraInquiries,
  luckyDrawEntries,
  pilgrimageCardApplications,
  insertTirthYatraInquirySchema,
  insertLuckyDrawEntrySchema,
  insertPilgrimageCardApplicationSchema,
} from "@shared/schema";
import { and, eq, desc, sql } from "drizzle-orm";
import { z } from "zod";

export function publicInquiryResponse(row: any) {
  const { canonicalDestinationType: _type, canonicalDestinationId: _id, ...legacy } = row;
  return legacy;
}

const SEED_TOURS = [
  {
    slug: "delhi-char-dham-yatra",
    name: "Char Dham Yatra (Yamunotri • Gangotri • Kedarnath • Badrinath)",
    shortName: "Char Dham Yatra",
    route: "Delhi → Yamunotri → Gangotri → Kedarnath → Badrinath → Delhi",
    departureCity: "Delhi",
    durationDays: 11,
    durationNights: 10,
    priceInr: 42500,
    mrpInr: 55000,
    groupSize: 22,
    isFlagship: true,
    sortOrder: 1,
    inclusions: [
      "AC Volvo / Tempo Traveller transport",
      "Comfortable hotels & dharamshalas (twin sharing)",
      "Daily sattvic meals (breakfast + dinner)",
      "Helicopter shuttle for Kedarnath (optional add-on)",
      "Experienced Vedic Tatva pandit & guide",
      "VIP darshan assistance at all 4 dhams",
      "Aarti & puja arrangements",
      "Travel insurance + 24/7 helpline",
    ],
    highlights: [
      "All 4 sacred dhams in one yatra",
      "Small batch (22 pilgrims max) for personal attention",
      "Pandit-led morning prayers daily",
      "Flexible Kedarnath helicopter upgrade",
    ],
    description: "The most sacred Hindu pilgrimage circuit. Covers Yamunotri (source of Yamuna), Gangotri (source of Ganga), Kedarnath (Lord Shiva), and Badrinath (Lord Vishnu). Privately organized with comfortable stays, Vedic Tatva pandit-led prayers, and assured darshan support.",
  },
  {
    slug: "delhi-rishikesh-yatra",
    name: "Rishikesh Spiritual Retreat",
    shortName: "Rishikesh",
    route: "Delhi → Rishikesh → Delhi",
    departureCity: "Delhi",
    durationDays: 3,
    durationNights: 2,
    priceInr: 6500,
    mrpInr: 8500,
    groupSize: 25,
    sortOrder: 2,
    inclusions: [
      "AC bus / tempo traveller from Delhi",
      "2 nights in riverside ashram / hotel",
      "All sattvic meals included",
      "Triveni Ghat Ganga Aarti experience",
      "Beatles Ashram & Ram Jhula visit",
      "Yoga & meditation morning sessions",
      "Vedic Tatva guide throughout",
    ],
    highlights: [
      "Ganga Aarti at Parmarth Niketan",
      "Yoga capital of the world",
      "Optional river rafting add-on",
    ],
    description: "A short, deeply rejuvenating spiritual retreat to Rishikesh — yoga capital of the world. Stay riverside, attend the famous Ganga Aarti, and meditate on the banks of the holy river.",
  },
  {
    slug: "delhi-haridwar-yatra",
    name: "Haridwar Ganga Snan & Aarti",
    shortName: "Haridwar",
    route: "Delhi → Haridwar → Delhi",
    departureCity: "Delhi",
    durationDays: 2,
    durationNights: 1,
    priceInr: 5500,
    mrpInr: 7000,
    groupSize: 25,
    sortOrder: 3,
    inclusions: [
      "AC transport from Delhi",
      "1 night riverside hotel stay",
      "All meals (breakfast, lunch, dinner)",
      "Har Ki Pauri Ganga snan & aarti",
      "Mansa Devi & Chandi Devi temple visits (ropeway included)",
      "Pandit-led puja & sankalp at Har Ki Pauri",
      "Vedic Tatva guide throughout",
    ],
    highlights: [
      "Holy Ganga snan with sankalp",
      "Famous Har Ki Pauri evening aarti",
      "Mansa Devi + Chandi Devi darshan",
    ],
    description: "The gateway to the gods. A short weekend yatra to Haridwar for sacred Ganga snan, evening aarti at Har Ki Pauri, and darshan of Mansa Devi & Chandi Devi.",
  },
  {
    slug: "delhi-badrinath-yatra",
    name: "Badrinath Dham Yatra",
    shortName: "Badrinath",
    route: "Delhi → Haridwar → Joshimath → Badrinath → Delhi",
    departureCity: "Delhi",
    durationDays: 6,
    durationNights: 5,
    priceInr: 18500,
    mrpInr: 24000,
    groupSize: 22,
    sortOrder: 4,
    inclusions: [
      "AC Tempo Traveller throughout",
      "5 nights in vetted hotels (twin sharing)",
      "All sattvic meals",
      "Mana village (last Indian village) visit",
      "Vyas & Ganesh Gufa darshan",
      "Tapt Kund holy bath at Badrinath",
      "VIP darshan assistance",
      "Pandit-led prayers daily",
    ],
    highlights: [
      "Sacred Badri Vishal darshan",
      "Tapt Kund hot springs",
      "Mana — last village of India",
    ],
    description: "Pilgrimage to one of the four sacred Char Dhams of India — Lord Vishnu's holy abode at Badrinath. Includes the famous Tapt Kund and a visit to Mana, India's last village before Tibet.",
  },
  {
    slug: "delhi-gangotri-yatra",
    name: "Gangotri Dham Yatra",
    shortName: "Gangotri",
    route: "Delhi → Haridwar → Uttarkashi → Gangotri → Delhi",
    departureCity: "Delhi",
    durationDays: 5,
    durationNights: 4,
    priceInr: 14500,
    mrpInr: 19000,
    groupSize: 22,
    sortOrder: 5,
    inclusions: [
      "AC Tempo Traveller throughout",
      "4 nights in mountain hotels",
      "All sattvic meals",
      "Bhagirathi Ganga snan",
      "Surya Kund visit",
      "Pandit-led puja at Gangotri temple",
      "VIP darshan support",
    ],
    highlights: [
      "Source of holy river Ganga",
      "Bhagirathi snan & sankalp",
      "Himalayan scenic beauty",
    ],
    description: "Visit the sacred origin of the Ganga at Gangotri. Pandit-led prayers, holy snan in the Bhagirathi, and breathtaking Himalayan vistas.",
  },
  {
    slug: "delhi-yamunotri-yatra",
    name: "Yamunotri Dham Yatra",
    shortName: "Yamunotri",
    route: "Delhi → Barkot → Yamunotri → Delhi",
    departureCity: "Delhi",
    durationDays: 5,
    durationNights: 4,
    priceInr: 13500,
    mrpInr: 17500,
    groupSize: 22,
    sortOrder: 6,
    inclusions: [
      "AC Tempo Traveller throughout",
      "4 nights in vetted hotels",
      "All sattvic meals",
      "Janki Chatti to Yamunotri trek (ponies/palanquins available)",
      "Surya Kund hot spring darshan",
      "Pandit-led puja at Yamunotri temple",
    ],
    highlights: [
      "Source of holy Yamuna",
      "Surya Kund hot spring",
      "Trek through pristine Himalayas",
    ],
    description: "Sacred pilgrimage to Yamunotri — origin of the river Yamuna and one of the four Char Dhams. Trek (or ride) the final stretch and bathe in the natural hot spring of Surya Kund.",
  },
  {
    slug: "delhi-kashi-vishwanath-yatra",
    name: "Kashi Vishwanath & Ayodhya Yatra",
    shortName: "Kashi Vishwanath",
    route: "Delhi → Varanasi → Ayodhya → Delhi",
    departureCity: "Delhi",
    durationDays: 5,
    durationNights: 4,
    priceInr: 17500,
    mrpInr: 22500,
    groupSize: 25,
    sortOrder: 7,
    inclusions: [
      "Flight Delhi-Varanasi-Delhi",
      "4 nights in heritage hotels",
      "All sattvic meals",
      "Kashi Vishwanath VIP darshan (sugam pass included)",
      "Ganga Aarti at Dashashwamedh Ghat",
      "Subah-e-Banaras boat ride",
      "Sarnath & Annapurna temple",
      "Ram Mandir Ayodhya darshan",
      "Pandit-led puja & abhishek",
    ],
    highlights: [
      "VIP Kashi Vishwanath darshan",
      "World-famous Ganga Aarti",
      "Newly opened Ram Mandir Ayodhya",
    ],
    description: "Two of Hinduism's most revered cities in one yatra — Kashi (Varanasi) for Lord Vishwanath darshan with VIP sugam pass, and Ayodhya for the new Ram Mandir. Includes morning Ganga boat ride and famous evening aarti.",
  },
  {
    slug: "delhi-kamakhya-darshan-yatra",
    name: "Maa Kamakhya Darshan (Guwahati)",
    shortName: "Kamakhya Darshan",
    route: "Delhi → Guwahati → Kamakhya → Delhi",
    departureCity: "Delhi",
    durationDays: 5,
    durationNights: 4,
    priceInr: 27500,
    mrpInr: 35000,
    groupSize: 20,
    sortOrder: 8,
    inclusions: [
      "Flight Delhi-Guwahati-Delhi",
      "4 nights in premium hotels",
      "All sattvic meals",
      "Kamakhya Devi Shaktipeeth VIP darshan",
      "Umananda Island temple",
      "Brahmaputra evening cruise",
      "Bhuvaneshwari & Navagraha temples",
      "Pandit-led shakti puja",
    ],
    highlights: [
      "One of 51 Shaktipeeths",
      "Pandit-led Shakti puja",
      "Brahmaputra river cruise",
    ],
    description: "Pilgrimage to the supremely sacred Kamakhya Shaktipeeth in Guwahati — the seat of Goddess Kamakhya. Includes VIP darshan, special pandit-led shakti puja, and an evening cruise on the mighty Brahmaputra.",
  },
];

export async function seedTirthYatraTours() {
  let inserted = 0;
  for (const t of SEED_TOURS) {
    try {
      const existing = await db.select().from(tirthYatraTours).where(eq(tirthYatraTours.slug, t.slug)).limit(1);
      if (existing.length === 0) {
        await db.insert(tirthYatraTours).values(t as any);
        inserted += 1;
      } else {
        await db.update(tirthYatraTours).set(t as any).where(eq(tirthYatraTours.slug, t.slug));
      }
    } catch (e) { /* ignore individual failures */ }
  }
  return { inserted, total: SEED_TOURS.length };
}

export function registerYatraPilgrimageRoutes(app: Express) {
  app.get("/api/yatra/tours", async (_req, res) => {
    try {
      const tours = await db.select().from(tirthYatraTours).where(eq(tirthYatraTours.isActive, true)).orderBy(tirthYatraTours.sortOrder);
      res.json(tours);
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.get("/api/yatra/tours/:slug", async (req, res) => {
    try {
      const r = await db.select().from(tirthYatraTours).where(eq(tirthYatraTours.slug, req.params.slug)).limit(1);
      if (!r.length) return res.status(404).json({ error: "Tour not found" });
      res.json(r[0]);
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/yatra/inquire", async (req, res) => {
    try {
      const parsed = insertTirthYatraInquirySchema.parse(req.body);
      const data = parsed as Omit<typeof tirthYatraInquiries.$inferInsert, "canonicalDestinationType" | "canonicalDestinationId"> & { tourSlug?: string | null };
      // Keep tourId/tourSlug exactly as submitted for old consumers, while
      // attaching a canonical destination only when the familiar slug resolves.
      let canonicalDestinationType: "TIRTH" | "TEMPLE" | null = null;
      let canonicalDestinationId: number | null = null;
      if (data.tourSlug) {
        const slug = data.tourSlug.trim().toLowerCase();
        for (const [type, table] of [["TIRTH", tirths], ["TEMPLE", temples]] as const) {
          let [destination] = await db.select({ id: table.id }).from(table).where(and(eq(table.slug, slug), eq(table.status, "PUBLISHED"))).limit(1);
          if (!destination) {
            const [alias] = await db.select().from(destinationSlugAliases)
              .where(and(eq(destinationSlugAliases.entityType, type), eq(destinationSlugAliases.aliasSlug, slug))).limit(1);
            if (alias) [destination] = await db.select({ id: table.id }).from(table).where(and(eq(table.id, alias.entityId), eq(table.status, "PUBLISHED"))).limit(1);
          }
          if (destination) { canonicalDestinationType = type; canonicalDestinationId = destination.id; break; }
        }
      }
      const [row] = await db.insert(tirthYatraInquiries).values({ ...data, canonicalDestinationType, canonicalDestinationId }).returning();
      res.json({ ok: true, inquiry: publicInquiryResponse(row) });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: e.issues });
      res.status(500).json({ error: e?.message });
    }
  });

  app.post("/api/lucky-draw/enter", async (req, res) => {
    try {
      const data = insertLuckyDrawEntrySchema.parse({
        ...req.body,
        drawYear: req.body.drawYear ?? new Date().getFullYear() + 1,
      }) as typeof luckyDrawEntries.$inferInsert & { productSerial: string; drawYear: number };
      const dup = await db
        .select()
        .from(luckyDrawEntries)
        .where(sql`${luckyDrawEntries.productSerial} = ${data.productSerial} AND ${luckyDrawEntries.drawYear} = ${data.drawYear}`)
        .limit(1);
      if (dup.length) return res.status(409).json({ error: "This serial number is already entered for this year's draw." });
      const [row] = await db.insert(luckyDrawEntries).values(data).returning();
      res.json({ ok: true, entry: row });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: e.issues });
      res.status(500).json({ error: e?.message });
    }
  });

  app.get("/api/lucky-draw/recent", async (_req, res) => {
    try {
      const rows = await db
        .select({ id: luckyDrawEntries.id, serial: luckyDrawEntries.productSerial, name: luckyDrawEntries.name, drawYear: luckyDrawEntries.drawYear })
        .from(luckyDrawEntries)
        .orderBy(desc(luckyDrawEntries.id))
        .limit(120);
      const masked = rows.map((r) => ({ id: r.id, serial: r.serial, firstName: (r.name || "").split(" ")[0] || "Devotee", drawYear: r.drawYear }));
      const yr = new Date().getFullYear() + 1;
      const totalRows = await db.select({ c: sql<number>`count(*)` }).from(luckyDrawEntries).where(eq(luckyDrawEntries.drawYear, yr));
      const total = Number(totalRows[0]?.c || 0);
      res.json({ entries: masked, totalThisYear: total, drawYear: yr });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  app.post("/api/pilgrimage-card/apply", async (req, res) => {
    try {
      const data = insertPilgrimageCardApplicationSchema.parse(req.body) as typeof pilgrimageCardApplications.$inferInsert;
      const [row] = await db.insert(pilgrimageCardApplications).values(data).returning();
      res.json({ ok: true, application: row });
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ error: "Validation failed", issues: e.issues });
      res.status(500).json({ error: e?.message });
    }
  });
}
