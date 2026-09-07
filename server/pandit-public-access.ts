import { eq } from "drizzle-orm";
import { z } from "zod";
import { indianCities, indianStates } from "@shared/schema";
import { db } from "./db";
import { storage } from "./storage";
import { isPanditPubliclyEligible, effectivePanditGovernance } from "./pandit-public-eligibility";

const ADMIN_TRUST_BADGES = {
  vedic_scholar: { label: "Vedic Scholar", detailAllowed: false },
  ritual_specialist: { label: "Ritual Specialist", detailAllowed: true },
  online_puja_ready: { label: "Online Puja Ready", detailAllowed: false },
  regional_expert: { label: "Regional Expert", detailAllowed: true },
  community_choice: { label: "Community Choice", detailAllowed: false },
} as const;

export const adminTrustBadgeSchema = z.object({
  key: z.enum(["vedic_scholar", "ritual_specialist", "online_puja_ready", "regional_expert", "community_choice"]),
  detail: z.string().trim().min(1).max(120).regex(/^[^<>\u0000-\u001F\u007F]*$/, "HTML and control characters are not allowed").optional(),
}).superRefine((badge, ctx) => {
  if (badge.detail && !ADMIN_TRUST_BADGES[badge.key].detailAllowed) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: "This badge does not permit a detail" });
  }
});
export const adminTrustBadgesSchema = z.array(adminTrustBadgeSchema).max(5)
  .superRefine((badges, ctx) => {
    if (new Set(badges.map(badge => badge.key)).size !== badges.length) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Badge keys must be unique" });
    }
  });

export function publicAdminTrustBadges(value: unknown) {
  const parsed = adminTrustBadgesSchema.safeParse(value);
  if (!parsed.success) return [];
  return parsed.data.map(badge => ({
    key: badge.key,
    label: ADMIN_TRUST_BADGES[badge.key].label,
    ...(badge.detail ? { detail: badge.detail } : {}),
  }));
}

export function storefrontServiceEnrichment(services: Array<{ category?: string | null; slug?: string | null; serviceAreas?: string[] | null; mode?: string | null }>, pandit: { city?: string | null; state?: string | null }) {
  const categoryCounts = new Map<string, { name: string; slug: string; serviceCount: number }>();
  const areas = new Map<string, string>();
  let onlineAvailable = false;
  for (const service of services) {
    const mode = String(service.mode || "").toLowerCase();
    if (service.category && service.slug) {
      const slug = service.category.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      if (slug) {
        const existing = categoryCounts.get(slug);
        if (existing) existing.serviceCount++;
        else categoryCounts.set(slug, { name: service.category.trim(), slug, serviceCount: 1 });
      }
    }
    if (!["online", "virtual"].includes(mode)) {
      for (const area of service.serviceAreas || []) {
        const normalized = area.trim().replace(/\s+/g, " ");
        const key = normalized.toLocaleLowerCase("en-IN");
        if (normalized && !areas.has(key)) areas.set(key, normalized);
      }
    }
    if (["online", "virtual", "both", "hybrid"].includes(mode)) onlineAvailable = true;
  }
  const primaryLocation = pandit.city || pandit.state
    ? { ...(pandit.city ? { city: pandit.city } : {}), ...(pandit.state ? { state: pandit.state } : {}) }
    : undefined;
  return {
    serviceCatalog: {
      categories: Array.from(categoryCounts.values()).sort((a, b) => a.name.localeCompare(b.name)),
      totalActiveServices: services.length,
    },
    serviceCoverage: {
      ...(primaryLocation ? { primaryLocation } : {}),
      inPersonAreas: Array.from(areas.values()).sort((a, b) => a.localeCompare(b)),
      onlineAvailable,
    },
  };
}

export function storefrontVerifiedFacts(input: { verified?: boolean; registrationNo?: string | null; experience?: number | null; reviewCount?: number; completedBookingCount?: number; activeMembership?: boolean }) {
  const facts: Array<{ key: string; label: string; detail?: string }> = [];
  if (input.verified) facts.push({ key: "identity_verified", label: "Identity verified by Vedic Tatva" });
  if (input.registrationNo) facts.push({ key: "registration", label: "Public registration credential" });
  if (input.activeMembership) facts.push({ key: "active_membership", label: "Active Vedic Tatva membership" });
  if (Number(input.experience) > 0) facts.push({ key: "experience", label: "Years of experience", detail: `${input.experience} years` });
  if (Number(input.reviewCount) > 0) facts.push({ key: "published_reviews", label: "Published Pandit reviews", detail: String(input.reviewCount) });
  if (Number(input.completedBookingCount) > 0) facts.push({ key: "completed_bookings", label: "Completed bookings", detail: String(input.completedBookingCount) });
  return facts;
}

export async function getPubliclyEligiblePanditBySlug(slug: string) {
  const pandit = await storage.getPanditBySlug(slug);
  if (!pandit) return null;

  const { stateIds, cityById } = await loadActiveLocationContext();
  return effectivePanditGovernance(pandit, stateIds, cityById).directory ? pandit : null;
}

/** Safety/publication profile gate. Deliberately does not apply directory or search switches. */
export async function getPubliclySafePanditBySlug(slug: string) {
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
  const pandit = await getPubliclySafePanditBySlug(slug);
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
  return all.filter(pandit => effectivePanditGovernance(pandit, context.stateIds, context.cityById).directory);
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
    registrationNo: pandit.registrationNo,
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