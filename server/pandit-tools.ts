import type { Express, Response } from "express";
import { db } from "./db";
import { pujaBookings, pandits } from "@shared/schema";
import { and, eq, desc } from "drizzle-orm";
import { panditAuthMiddleware, type PanditRequest } from "./pandit-portal";

type CustomerRow = {
  key: string;            // userId or phone
  userId: number | null;
  name: string;
  phone: string;
  totalBookings: number;
  totalSpent: number;
  completedCount: number;
  pendingCount: number;
  cancelledCount: number;
  lastBookingDate: string | null;
  lastPujaType: string | null;
};

type ReachKind = "nearby" | "city" | "state" | "national";

// Annual price (INR) for each paid tier. `free` is 0; UI uses `priceInr === 0`
// to render "Current plan" instead of a Buy button. Server is the source of
// truth — any client-side price is for display only and re-checked on /order.
export const TIER_PRICE_INR: Record<string, number> = {
  free: 0,
  silver: 1999,
  gold: 3999,
  guru_elite: 6999,
};

const TIER_BENEFITS: Record<string, {
  label: string; priceInr: number; commissionPct: number; referralPct: number;
  reach: ReachKind; reachLabel: string;
  visibilityBoost: string; supportSla: string; features: string[];
}> = {
  free: {
    label: "Free",
    priceInr: TIER_PRICE_INR.free,
    commissionPct: 25, referralPct: 0,
    reach: "nearby", reachLabel: "Within 20 km of client",
    visibilityBoost: "Local listing only",
    supportSla: "48-hour email",
    features: [
      "Visible to clients within 20 km of your location",
      "Basic profile listing",
      "Email + SMS notifications",
      "Up to 50 active bookings/month",
      "Affiliate commissions: not enabled",
    ],
  },
  silver: {
    label: "Silver",
    priceInr: TIER_PRICE_INR.silver,
    commissionPct: 20, referralPct: 8,
    reach: "city", reachLabel: "Citywide visibility",
    visibilityBoost: "Featured across your city",
    supportSla: "36-hour email",
    features: [
      "Visible to anyone searching in your city",
      "Affiliate commissions enabled (8% on referrals)",
      "Silver badge on profile",
      "WhatsApp notifications",
      "Up to 150 active bookings/month",
    ],
  },
  gold: {
    label: "Gold",
    priceInr: TIER_PRICE_INR.gold,
    commissionPct: 15, referralPct: 12,
    reach: "state", reachLabel: "Statewide visibility",
    visibilityBoost: "Festival boosts + better rankings",
    supportSla: "24-hour priority email",
    features: [
      "Visible across your entire state",
      "Festival boosts on Diwali, Navratri, Holi, etc.",
      "Higher placement in search rankings",
      "Affiliate commissions (12% on referrals)",
      "Gold pandit badge on profile",
      "Unlimited monthly bookings",
    ],
  },
  guru_elite: {
    label: "Guru Elite",
    priceInr: TIER_PRICE_INR.guru_elite,
    commissionPct: 10, referralPct: 15,
    reach: "national", reachLabel: "National + international (NRI)",
    visibilityBoost: "Top of every search, anywhere",
    supportSla: "Same-day phone support",
    features: [
      "National + international visibility",
      "NRI booking access (overseas clients)",
      "Priority search ranking (above all other tiers)",
      "Premium Guru Elite badge",
      "Highest affiliate commission (15% on referrals)",
      "Dedicated account manager",
      "Top of homepage carousel rotation",
    ],
  },
};

export function registerPanditToolsRoutes(app: Express) {
  // ----- Customers (CRM aggregation from pujaBookings) -----
  app.get("/api/pandit/customers", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const rows = await db.select().from(pujaBookings)
        .where(eq(pujaBookings.panditId, req.panditId!))
        .orderBy(desc(pujaBookings.createdAt));

      const map = new Map<string, CustomerRow>();
      for (const b of rows) {
        const key = b.userId ? `u:${b.userId}` : `p:${b.contactPhone}`;
        let c = map.get(key);
        if (!c) {
          c = {
            key, userId: b.userId || null,
            name: b.contactName, phone: b.contactPhone,
            totalBookings: 0, totalSpent: 0,
            completedCount: 0, pendingCount: 0, cancelledCount: 0,
            lastBookingDate: null, lastPujaType: null,
          };
          map.set(key, c);
        }
        c.totalBookings++;
        if (b.status === "completed") {
          c.completedCount++;
          c.totalSpent += b.totalAmount || 0;
        } else if (b.status === "cancelled" || b.status === "declined") {
          c.cancelledCount++;
        } else {
          c.pendingCount++;
        }
        const when = b.createdAt ? new Date(b.createdAt).toISOString() : null;
        if (when && (!c.lastBookingDate || when > c.lastBookingDate)) {
          c.lastBookingDate = when;
          c.lastPujaType = b.pujaType;
        }
      }

      const customers = Array.from(map.values()).sort((a, b) => b.totalSpent - a.totalSpent);
      res.json({
        customers,
        summary: {
          totalCustomers: customers.length,
          repeatCustomers: customers.filter((c) => c.totalBookings > 1).length,
          lifetimeValue: customers.reduce((s, c) => s + c.totalSpent, 0),
        },
      });
    } catch (e: any) {
      res.status(500).json({ error: e?.message || "Failed to load customers" });
    }
  });

  app.get("/api/pandit/customers/:key/bookings", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const key = String(req.params.key || "");
      const all = await db.select().from(pujaBookings)
        .where(eq(pujaBookings.panditId, req.panditId!))
        .orderBy(desc(pujaBookings.createdAt));
      const matched = all.filter((b) => {
        const k = b.userId ? `u:${b.userId}` : `p:${b.contactPhone}`;
        return k === key;
      });
      res.json({ bookings: matched });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });

  // ----- Membership -----
  app.get("/api/pandit/membership", panditAuthMiddleware, async (req: PanditRequest, res: Response) => {
    try {
      const [p] = await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1);
      if (!p) return res.status(404).json({ error: "Pandit not found" });
      // Backwards-compat: legacy "platinum" rows are surfaced as "guru_elite".
      const raw = (p.tier || "free") === "platinum" ? "guru_elite" : (p.tier || "free");
      const tier: keyof typeof TIER_BENEFITS = (raw === "free" || raw === "silver" || raw === "gold" || raw === "guru_elite") ? raw : "free";
      // Tier expiry: if past the expiry date, treat as free until renewed.
      const expired = p.tierExpiresAt && new Date(p.tierExpiresAt as any) < new Date();
      const effective: keyof typeof TIER_BENEFITS = expired ? "free" : tier;
      res.json({
        currentTier: effective,
        rawTier: tier,
        tierExpiresAt: p.tierExpiresAt,
        expired: !!expired,
        commissionPct: typeof p.commissionPct === "number" ? p.commissionPct : TIER_BENEFITS[effective].commissionPct,
        tiers: TIER_BENEFITS,
      });
    } catch (e: any) { res.status(500).json({ error: e?.message }); }
  });
}
