import { eq } from "drizzle-orm";
import { indianCities, indianStates } from "@shared/schema";
import { db } from "./db";
import { storage } from "./storage";
import { isPanditPubliclyEligible } from "./pandit-public-eligibility";

export async function getPubliclyEligiblePanditBySlug(slug: string) {
  const pandit = await storage.getPanditBySlug(slug);
  if (!pandit) return null;

  const { stateIds, cityById } = await loadActiveLocationContext();
  return isPanditPubliclyEligible(pandit, stateIds, cityById) ? pandit : null;
}

async function loadActiveLocationContext() {
  const [states, cities] = await Promise.all([
    db.select().from(indianStates).where(eq(indianStates.isActive, true)),
    db.select().from(indianCities).where(eq(indianCities.isActive, true)),
  ]);
  return {
    stateIds: new Set(states.map(state => state.id)),
    cityById: new Map(cities.map(city => [city.id, city])),
  };
}

export async function getPubliclyEligiblePandits() {
  const [all, context] = await Promise.all([
    storage.getPandits(),
    loadActiveLocationContext(),
  ]);
  return all.filter(pandit => isPanditPubliclyEligible(pandit, context.stateIds, context.cityById));
}

export function publicStorefrontPanditDto(pandit: any) {
  return {
    id: pandit.id,
    name: pandit.name,
    slug: pandit.slug,
    city: pandit.city,
    state: pandit.state,
    regionalOrigin: pandit.regionalOrigin,
    specialization: pandit.specialization,
    languages: pandit.languages,
    experience: pandit.experience,
    fees: pandit.fees,
    rating: pandit.rating,
    reviewCount: pandit.reviewCount,
    verified: true,
    image: pandit.image,
    bio: pandit.bio,
  };
}