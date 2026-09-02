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

export function isPanditStorefrontPublished(storefront: any) {
  if (!storefront?.isPublished) return false;
  return (storefront.status || "published") === "published";
}

export async function getPubliclyPublishedPanditBySlug(slug: string) {
  const pandit = await getPubliclyEligiblePanditBySlug(slug);
  if (!pandit) return null;
  const storefront = await storage.getPanditStorefrontByPanditId(pandit.id);
  return isPanditStorefrontPublished(storefront) ? pandit : null;
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
    cityId: pandit.cityId,
    stateId: pandit.stateId,
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
    verified: pandit.verified === true,
    image: pandit.image,
    bio: pandit.bio,
  };
}

export function publicPanditPackageDto(pkg: any, items: any[]) {
  return {
    id: pkg.id, name: pkg.name, slug: pkg.slug, description: pkg.description,
    price: pkg.price, compareAtPrice: pkg.compareAtPrice, displayOrder: pkg.displayOrder,
    items: items.map(item => ({ panditServiceId: item.panditServiceId, displayOrder: item.displayOrder })),
  };
}
export function publicPanditGalleryItemDto(item: any) {
  return { id: item.id, mediaKind: item.mediaKind, mediaUrl: item.mediaUrl, altText: item.altText, caption: item.caption, displayOrder: item.displayOrder };
}
export function publicPanditAvailabilityRuleDto(rule: any) {
  return { weekday: rule.weekday, startMinutes: rule.startMinutes, endMinutes: rule.endMinutes, timezone: rule.timezone, mode: rule.mode };
}

export function publicPanditReviewDto(review: any) {
  return {
    id: review.id,
    panditId: review.panditId,
    reviewerName: review.reviewerName,
    reviewerCity: review.reviewerCity,
    rating: review.rating,
    comment: review.comment,
    serviceType: review.serviceType,
    panditReply: review.panditReply,
    panditRepliedAt: review.panditRepliedAt,
    createdAt: review.createdAt,
  };
}

export function publicPanditServiceDto(row: any) {
  const service = row.service || row;
  const master = row.master || row.masterService;
  return {
    id: service.id,
    masterServiceId: service.masterServiceId,
    name: master?.name || null,
    slug: master?.slug || null,
    category: master?.category || null,
    serviceType: master?.serviceType || null,
    description: service.description,
    price: service.price,
    durationMinutes: service.durationMinutes,
    mode: service.mode,
    preparation: service.preparation,
    inclusions: service.inclusions || [],
    serviceAreas: service.serviceAreas || [],
    availability: service.availability,
    displayOrder: service.displayOrder,
  };
}