import { db } from "./db";
import { pandits, panditReviews } from "@shared/schema";
import { and, eq, isNull } from "drizzle-orm";
import { resolveLocationName } from "./locations";

type SeedPandit = {
  name: string;
  slug: string;
  city: string;
  regionalOrigin: string;
  specialization: string;
  languages: string;
  experience: number;
  fees: number;
  rating: number;
  reviewCount: number;
  bio: string;
  education: string;
  image: string;
};

const SEED_PANDITS: SeedPandit[] = [
  {
    name: "Pt. Ramesh Sharma",
    slug: "pt-ramesh-sharma-delhi",
    city: "Delhi",
    regionalOrigin: "North Indian",
    specialization: "Marriage, Griha Pravesh, Satyanarayan Katha",
    languages: "Hindi, Sanskrit, English",
    experience: 15,
    fees: 5100,
    rating: 4.9,
    reviewCount: 124,
    bio: "Pt. Ramesh Sharma ji has been performing Vedic ceremonies across Delhi NCR for over 15 years. Trained in the Smartha sampradaya, he specialises in Hindu wedding rituals (vivaha sanskar), Griha Pravesh and Satyanarayan Katha. Known for explaining each step of the ritual to families in simple Hindi.",
    education: "Vedic Acharya, Shri Lal Bahadur Shastri Sanskrit Vidyapeeth",
    image: "/attached_assets/pandits/pandit_01.png",
  },
  {
    name: "Pt. Anand Shastri",
    slug: "pt-anand-shastri-mumbai",
    city: "Mumbai",
    regionalOrigin: "Maharashtrian",
    specialization: "Ganesh Puja, Satyanarayan, Lakshmi Puja",
    languages: "Marathi, Hindi, Sanskrit",
    experience: 22,
    fees: 7100,
    rating: 5.0,
    reviewCount: 89,
    bio: "With over 22 years of practice in Mumbai, Pt. Anand Shastri ji is a respected purohit specialising in Ganesh Puja, Satyanarayan Mahapuja and Lakshmi Puja. He serves Maharashtrian and North Indian families across Mumbai, Thane and Navi Mumbai.",
    education: "Acharya in Karmakand, Tilak Maharashtra Vidyapeeth",
    image: "/attached_assets/pandits/pandit_02.png",
  },
  {
    name: "Pt. Vishnu Tiwari",
    slug: "pt-vishnu-tiwari-bangalore",
    city: "Bangalore",
    regionalOrigin: "North Indian",
    specialization: "Vastu Shanti, Havan, Griha Pravesh",
    languages: "Kannada, English, Hindi",
    experience: 10,
    fees: 4500,
    rating: 4.8,
    reviewCount: 210,
    bio: "Pt. Vishnu Tiwari ji serves families across Bangalore in three languages and is best known for Vastu Shanti, Havan and Griha Pravesh ceremonies. His clear, calm style is appreciated by first-time home owners and IT-sector families.",
    education: "MA Sanskrit, BHU Varanasi",
    image: "/attached_assets/pandits/pandit_03.png",
  },
  {
    name: "Pt. Sanjay Pandey",
    slug: "pt-sanjay-pandey-varanasi",
    city: "Varanasi",
    regionalOrigin: "North Indian",
    specialization: "Rudrabhishek, Mahamrityunjay Jaap, Kaal Sarp Dosh Nivaran",
    languages: "Sanskrit, Hindi",
    experience: 30,
    fees: 11000,
    rating: 4.9,
    reviewCount: 450,
    bio: "From the ghats of Kashi, Pt. Sanjay Pandey ji has 30 years of practice in Rudrabhishek, Mahamrityunjay Jaap and Kaal Sarp Dosh Nivaran at Trambakeshwar and Varanasi. Devotees travel from across India for his services and he also performs virtual puja for NRI families.",
    education: "Vyakaranacharya, Sampurnanand Sanskrit Vishwavidyalaya",
    image: "/attached_assets/pandits/pandit_04.png",
  },
  {
    name: "Pt. Gopal Mishra",
    slug: "pt-gopal-mishra-jaipur",
    city: "Jaipur",
    regionalOrigin: "North Indian",
    specialization: "Navgraha Shanti, Sunderkand, Aarti",
    languages: "Hindi, Rajasthani, Sanskrit",
    experience: 12,
    fees: 3500,
    rating: 4.7,
    reviewCount: 78,
    bio: "Pt. Gopal Mishra ji is a Jaipur-based purohit known for Navgraha Shanti, Sunderkand paath and aarti gatherings. He works closely with families during festivals like Navratri, Diwali and Holi.",
    education: "Shastri, Jagadguru Ramanandacharya Sanskrit University",
    image: "/attached_assets/pandits/pandit_05.png",
  },
  {
    name: "Pt. Suresh Dikshit",
    slug: "pt-suresh-dikshit-pune",
    city: "Pune",
    regionalOrigin: "Maharashtrian",
    specialization: "Vivaha (Marriage), Namkaran, Upanayana",
    languages: "Marathi, Hindi, Sanskrit",
    experience: 18,
    fees: 6000,
    rating: 4.8,
    reviewCount: 135,
    bio: "Pt. Suresh Dikshit ji performs samskara ceremonies across Pune — particularly Marathi vivaha, Namkaran and Upanayana (thread ceremony). He coordinates closely with families to plan muhurat and ritual logistics.",
    education: "Acharya in Karmakand, Deccan College Pune",
    image: "/attached_assets/pandits/pandit_06.png",
  },
  {
    name: "Pt. Krishna Acharya",
    slug: "pt-krishna-acharya-chennai",
    city: "Chennai",
    regionalOrigin: "South Indian",
    specialization: "Lakshmi Narayan Puja, Navagraha Homam, Ayushya Homam",
    languages: "Tamil, Sanskrit, English, Hindi",
    experience: 20,
    fees: 6500,
    rating: 4.9,
    reviewCount: 162,
    bio: "Pt. Krishna Acharya ji is a Shri Vaishnava purohit serving devotees across Chennai. He specialises in Lakshmi Narayan Puja, Navagraha Homam and birthday Ayushya Homam, and is fluent in Tamil, Sanskrit, English and Hindi — much appreciated by NRI families.",
    education: "Vedic Studies, Madurai Adheenam Veda Pathasala",
    image: "/attached_assets/pandits/pandit_07.png",
  },
  {
    name: "Pt. Mahesh Joshi",
    slug: "pt-mahesh-joshi-haridwar",
    city: "Haridwar",
    regionalOrigin: "North Indian",
    specialization: "Ganga Aarti, Pitru Paksha Shradh, Tarpan",
    languages: "Hindi, Sanskrit",
    experience: 25,
    fees: 4500,
    rating: 4.9,
    reviewCount: 308,
    bio: "Pt. Mahesh Joshi ji serves at Har Ki Pauri, Haridwar and conducts Ganga Aarti, Pitru Paksha Shradh and Tarpan rituals on behalf of families across India and abroad. NRI families regularly engage him for ancestral rites they cannot attend in person.",
    education: "Karmakand Visharad, Gurukul Kangri Vishwavidyalaya",
    image: "/attached_assets/pandits/pandit_08.png",
  },
];

export async function seedPanditProfiles() {
  // One-time cleanup: remove legacy slugless rows that duplicate a current seed entry
  for (const p of SEED_PANDITS) {
    const dupes = await db
      .select()
      .from(pandits)
      .where(and(eq(pandits.name, p.name), eq(pandits.city, p.city), isNull(pandits.slug)));
    for (const d of dupes) {
      await db.delete(panditReviews).where(eq(panditReviews.panditId, d.id));
      await db.delete(pandits).where(eq(pandits.id, d.id));
    }
  }

  let inserted = 0;
  let updated = 0;
  for (const p of SEED_PANDITS) {
    const location = await resolveLocationName(p.city);
    const locationFields = location ? {
      city: location.city.name, state: location.state.name, stateId: location.state.id,
      cityId: location.city.id, originalCity: p.city, originalState: p.state, locationReviewStatus: "resolved",
    } : { originalCity: p.city, originalState: p.state, locationReviewStatus: "needs_review" };
    // Match by slug first, then fall back to legacy hardcoded rows that have no slug
    let [existing] = await db.select().from(pandits).where(eq(pandits.slug, p.slug));
    if (!existing) {
      const [legacy] = await db
        .select()
        .from(pandits)
        .where(and(eq(pandits.name, p.name), eq(pandits.city, p.city)));
      existing = legacy;
    }
    if (existing) {
      // Idempotent refresh of image and bio so re-seeds keep them current
      await db.update(pandits).set({
        slug: p.slug,
        image: p.image,
        bio: p.bio,
        education: p.education,
        regionalOrigin: p.regionalOrigin,
        languages: p.languages,
        specialization: p.specialization,
        verified: true,
        ...locationFields,
      }).where(eq(pandits.id, existing.id));
      updated += 1;
      continue;
    }
    await db.insert(pandits).values({
      name: p.name,
      slug: p.slug,
      city: p.city,
      regionalOrigin: p.regionalOrigin,
      specialization: p.specialization,
      languages: p.languages,
      experience: p.experience,
      fees: p.fees,
      rating: p.rating,
      reviewCount: p.reviewCount,
      bio: p.bio,
      education: p.education,
      image: p.image,
      verified: true,
      ...locationFields,
    });
    inserted += 1;
  }
  console.log(`Pandits seed: ${inserted} inserted, ${updated} refreshed (total ${SEED_PANDITS.length}).`);
}
