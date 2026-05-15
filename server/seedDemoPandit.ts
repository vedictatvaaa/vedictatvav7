import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "./db";
import { pandits } from "@shared/schema";

export const DEMO_PANDIT_PHONE = "9000012345";
export const DEMO_PANDIT_PASSWORD = "demo1234";

export async function seedDemoPandit() {
  try {
    const passwordHash = await bcrypt.hash(DEMO_PANDIT_PASSWORD, 10);
    const existing = await db
      .select()
      .from(pandits)
      .where(eq(pandits.phone, DEMO_PANDIT_PHONE))
      .limit(1);

    const payload = {
      name: "Pt. Demo Acharya",
      slug: "pt-demo-acharya",
      city: "Varanasi",
      regionalOrigin: "North Indian",
      specialization: "Satyanarayan Katha, Griha Pravesh, Marriage, Online Puja",
      languages: "Hindi, Sanskrit, English",
      experience: 18,
      fees: 5100,
      rating: 4.9,
      reviewCount: 56,
      bio: "This is a demo profile so prospective Panditji can experience the full Vedic Tatva portal — bookings, earnings, customer chat, online puja and tools. Replace with your own details after registering.",
      education: "Vedacharya, Sampurnanand Sanskrit Vishwavidyalaya, Varanasi",
      image: "/attached_assets/pandits/pandit_03.png",
      verified: true,
      phone: DEMO_PANDIT_PHONE,
      email: "demo@vedictatva.com",
      passwordHash,
      // tier=free + null lat/lng keeps this account out of every public
      // /pandits search (the listing filter requires GPS proximity for
      // free pandits and rejects them when lat/lng are missing). The
      // account is still fully usable through the Pandit Portal login.
      tier: "free" as const,
      latitude: null,
      longitude: null,
    };

    if (existing.length === 0) {
      await db.insert(pandits).values(payload);
      console.log(`[seedDemoPandit] inserted demo pandit (phone ${DEMO_PANDIT_PHONE}).`);
    } else {
      // Always re-hash the password + force back to free/no-GPS so demo creds
      // stay valid even if a tester changed them or an admin upgraded the tier.
      await db
        .update(pandits)
        .set({
          passwordHash,
          verified: true,
          tier: "free",
          latitude: null,
          longitude: null,
          bio: payload.bio,
        })
        .where(eq(pandits.id, existing[0].id));
      console.log(`[seedDemoPandit] refreshed demo pandit credentials.`);
    }
  } catch (e: any) {
    console.warn(`[seedDemoPandit] skipped: ${e?.message || "unknown"}`);
  }
}
