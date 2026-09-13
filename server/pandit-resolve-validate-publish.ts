import type { Express, Request } from "express";
import { and, eq, inArray } from "drizzle-orm";
import {
  adminAuditLogs,
  indianCities,
  indianStates,
  masterServices,
  panditServices,
  panditStorefrontContent,
  panditStorefronts,
  pandits,
} from "@shared/schema";
import { db } from "./db";
import {
  evaluatePanditLocation,
  type LocationCity,
  type LocationState,
} from "./pandit-location-rectification";
import { effectivePanditGovernance, isPanditPubliclyEligible } from "./pandit-public-eligibility";
import { evaluatePanditBookingEligibility } from "./pandit-booking-eligibility";
import { isPanditStorefrontPublished } from "./pandit-public-access";
import { createPanditContentDraftForAdmin } from "./pandit-storefront-content";
import { notifyPublish } from "./publish-notify";
import { evaluatePanditProfileIndexability } from "./pandit-seo-network/quality";

const BOOKABLE_MODES = new Set(["online", "in_person", "hybrid"]);
const AMBIGUOUS_LOCATION_ISSUES = new Set([
  "conflicting_address", "unrecognized_spelling_or_alias",
  "unknown_or_inactive_state", "unknown_or_inactive_city", "city_state_mismatch",
]);

export type ResolveService = {
  mode?: string | null;
  serviceAreas?: string[] | null;
  isActive?: boolean | null;
  masterActive?: boolean | null;
  masterSlug?: string | null;
  supportedModes?: string[] | null;
};

export type ResolveValidationInput = {
  pandit: any;
  storefront?: any | null;
  content?: any | null;
  services: ResolveService[];
  activeStateIds: ReadonlySet<number>;
  activeCityById: ReadonlyMap<number, { id: number; stateId: number }>;
};

export type ResolveValidation = {
  publicEligible: boolean;
  storefrontPublished: boolean;
  canonicalLocation: boolean;
  activeCanonicalService: boolean;
  bookableMode: boolean;
  image: boolean;
  bio: boolean;
  languages: boolean;
  governanceFlags: boolean;
  indexable: boolean;
  reasons: string[];
};

/** Pure, fail-closed publication gates shared by the one-click workflow. */
export function validateResolvePublish(input: ResolveValidationInput): ResolveValidation {
  const { pandit, storefront, services, activeStateIds, activeCityById } = input;
  const publicEligible = isPanditPubliclyEligible(pandit, activeStateIds, activeCityById);
  const storefrontPublished = isPanditStorefrontPublished(storefront);
  const canonicalLocation = pandit.locationReviewStatus === "resolved"
    && pandit.stateId != null && pandit.cityId != null
    && activeStateIds.has(pandit.stateId)
    && activeCityById.get(pandit.cityId)?.stateId === pandit.stateId;
  const canonicalServices = services.filter(service =>
    service.isActive !== false && service.masterActive !== false
    && Boolean(service.masterSlug?.trim()));
  const activeCanonicalService = canonicalServices.length > 0;
  const bookableMode = canonicalServices.some(service =>
    BOOKABLE_MODES.has(String(service.mode || "").toLowerCase())
    && (service.supportedModes || []).map(String).includes(String(service.mode || "").toLowerCase()));
  const governance = effectivePanditGovernance(pandit, activeStateIds, activeCityById);
  const bioValue = String(storefront?.bio || pandit.bio || "").trim();
  const profileQuality = evaluatePanditProfileIndexability({
    eligible: publicEligible,
    published: storefrontPublished,
    name: pandit.name,
    slug: pandit.slug,
    image: pandit.image,
    cityId: pandit.cityId,
    stateId: pandit.stateId,
    bio: bioValue,
    languages: pandit.languages,
    activeCanonicalServiceCount: canonicalServices.length,
    hasBookableMode: bookableMode,
  });
  const booking = evaluatePanditBookingEligibility(pandit, {
    services: services.filter(service => service.isActive !== false && service.masterActive !== false),
    pujaSupported: activeCanonicalService,
  });
  const reasons = new Set<string>();
  if (pandit.verified !== true) reasons.add("not_verified");
  if (pandit.onLeave) reasons.add("on_leave");
  if (pandit.archived) reasons.add("archived");
  if (pandit.accountStatus === "banned") reasons.add("banned");
  // Unlike the ordinary public-directory predicate, this governed repair
  // action never treats an expired suspension as publishable implicitly.
  if (pandit.accountStatus === "suspended") reasons.add("suspended");
  if (!publicEligible) {
    if (!canonicalLocation) reasons.add("location_unresolved");
  }
  if (!storefrontPublished) reasons.add("storefront_not_published");
  if (!canonicalLocation) reasons.add("canonical_location_missing");
  if (!activeCanonicalService) reasons.add("active_canonical_service_missing");
  if (!bookableMode) reasons.add("bookable_mode_missing");
  if (!pandit.image) reasons.add("profile_image_missing");
  if (bioValue.length < 80) reasons.add("bio_under_80_characters");
  if (!String(pandit.languages || "").trim()) reasons.add("languages_missing");
  if (!governance.directory) reasons.add("directory_disabled");
  if (!governance.search) reasons.add("search_disabled");
  if (!governance.booking || !booking.result.passed) reasons.add("booking_ineligible");
  if (pandit.indexingMode === "noindex") reasons.add("governance_noindex");
  for (const reason of profileQuality.reasons) reasons.add(reason);
  return {
    publicEligible, storefrontPublished, canonicalLocation, activeCanonicalService,
    bookableMode, image: Boolean(pandit.image), bio: bioValue.length >= 80,
    languages: Boolean(String(pandit.languages || "").trim()),
    governanceFlags: governance.directory && governance.search && governance.booking
      && pandit.indexingMode !== "noindex",
    indexable: profileQuality.indexable && governance.indexable,
    reasons: Array.from(reasons).sort(),
  };
}

export function deterministicLocationChange(pandit: any, states: LocationState[], cities: LocationCity[]) {
  const result = evaluatePanditLocation(pandit, states, cities);
  const ambiguous = result.issueCategories.some(issue => AMBIGUOUS_LOCATION_ISSUES.has(issue));
  // Coordinate completeness is intentionally not a prerequisite for a
  // canonical alias repair. Existing coordinate columns are never written.
  const autoApply = Boolean(result.candidates.length) && !ambiguous
    && ["catalogue_id", "catalogue_alias", "catalogue_name"].includes(result.source);
  return { ...result, autoApply };
}

function actor(req: Request) {
  return `admin:${(req as Request & { adminUserId?: number }).adminUserId || "authenticated"}`;
}

function contentPublishColumns(content: any, publisher: string) {
  return {
    status: "published",
    publishedProfileIntroduction: content.generatedProfileIntroduction,
    publishedTagline: content.generatedTagline,
    publishedServiceOverview: content.generatedServiceOverview,
    publishedSeoTitle: content.generatedSeoTitle,
    publishedMetaDescription: content.generatedMetaDescription,
    publishedFaqs: content.generatedFaqs || [],
    publishedAiSummary: content.generatedAiSummary,
    publishedSourceSnapshotHash: content.sourceSnapshotHash,
    publishedBy: publisher,
    publishedAt: new Date(),
    stale: false,
    staleReason: null,
    updatedAt: new Date(),
  };
}

export type ResolvePublishReport = {
  batchId: string;
  published: Array<{ panditId: number; reasons: string[] }>;
  review: Array<{ panditId: number; reasons: string[] }>;
  blocked: Array<{ panditId: number; reasons: string[] }>;
};

/**
 * Resolve, validate & publish is intentionally fail-closed. It audits every
 * real Pandit that is not currently both public and indexable, changes only
 * deterministic catalogue location values, and never enables a governance
 * switch or replaces coordinates.
 */
export async function runResolveValidatePublish(req: Request, batchId = `prvp-${Date.now()}`): Promise<ResolvePublishReport> {
  const [rows, states, cities] = await Promise.all([
    db.select().from(pandits),
    db.select().from(indianStates).where(eq(indianStates.isActive, true)),
    db.select().from(indianCities).where(eq(indianCities.isActive, true)),
  ]);
  const stateIds = new Set(states.map(state => state.id));
  const cityById = new Map(cities.map(city => [city.id, city]));
  const ids = rows.map(row => row.id);
  const [storefrontRows, contentRows, serviceRows] = await Promise.all([
    ids.length ? db.select().from(panditStorefronts).where(inArray(panditStorefronts.panditId, ids)) : [],
    ids.length ? db.select().from(panditStorefrontContent).where(inArray(panditStorefrontContent.panditId, ids)) : [],
    ids.length ? db.select({ service: panditServices, master: masterServices })
      .from(panditServices).innerJoin(masterServices, eq(panditServices.masterServiceId, masterServices.id))
      .where(and(inArray(panditServices.panditId, ids), eq(panditServices.isActive, true))) : [],
  ]);
  const storefrontById = new Map(storefrontRows.map(row => [row.panditId, row]));
  const contentById = new Map(contentRows.map(row => [row.panditId, row]));
  const servicesById = new Map<number, ResolveService[]>();
  for (const row of serviceRows) {
    const service = row.service;
    const master = row.master;
    const list = servicesById.get(service.panditId) || [];
    list.push({
      mode: service.mode, serviceAreas: service.serviceAreas,
      isActive: service.isActive, masterActive: master.isActive,
      masterSlug: master.slug, supportedModes: master.supportedModes,
    });
    servicesById.set(service.panditId, list);
  }
  const report: ResolvePublishReport = { batchId, published: [], review: [], blocked: [] };
  const seoPaths: string[] = [];

  for (const row of rows) {
    const currentStorefront = storefrontById.get(row.id);
    const currentContent = contentById.get(row.id);
    const beforeValidation = validateResolvePublish({
      pandit: row, storefront: currentStorefront, content: currentContent,
      services: servicesById.get(row.id) || [], activeStateIds: stateIds, activeCityById: cityById,
    });
    if (beforeValidation.publicEligible && beforeValidation.indexable
      && beforeValidation.storefrontPublished) continue;

    let normalized = row;
    const location = deterministicLocationChange(row, states, cities);
    const candidate = location.candidates[0];
    if (location.autoApply && candidate
      && (row.stateId !== candidate.stateId || row.cityId !== candidate.cityId
        || row.state !== candidate.state || row.city !== candidate.city
        || row.locationReviewStatus !== "resolved")) {
      await db.update(pandits).set({
        stateId: candidate.stateId, cityId: candidate.cityId,
        state: candidate.state, city: candidate.city,
        locationReviewStatus: "resolved",
      }).where(eq(pandits.id, row.id));
      // Deliberately carry coordinates through unchanged, including their
      // provenance and exact floating-point values.
      normalized = {
        ...row, stateId: candidate.stateId, cityId: candidate.cityId,
        state: candidate.state, city: candidate.city, locationReviewStatus: "resolved",
      };
    }
    // Storefront publication is the controlled output of this workflow. A
    // present draft storefront is validated as the projected published row;
    // it is still written only after every other authoritative gate passes.
    const projectedStorefront = currentStorefront
      ? { ...currentStorefront, isPublished: true, status: "published" }
      : null;
    const validation = validateResolvePublish({
      pandit: normalized, storefront: projectedStorefront, content: currentContent,
      services: servicesById.get(row.id) || [], activeStateIds: stateIds, activeCityById: cityById,
    });
    const reasons = new Set(validation.reasons);
    if (!currentStorefront) reasons.add("storefront_missing");
    if (location.issueCategories.some(issue => AMBIGUOUS_LOCATION_ISSUES.has(issue))) {
      reasons.add("location_requires_admin_review");
    }

    let content = currentContent;
    if (validation.publicEligible && validation.storefrontPublished && !content) {
      try {
        const draft = await createPanditContentDraftForAdmin(row.id, actor(req));
        content = draft.row;
        reasons.add("draft_created_requires_admin_review");
      } catch {
        reasons.add("draft_generation_unavailable");
      }
    } else if (content && (content.status === "draft" || content.status === "rejected" || content.stale)) {
      reasons.add(content.stale ? "content_source_changed" : "content_requires_admin_review");
    }
    if (content && !content.stale
      && (content.status === "reviewed" || content.status === "published")
      && !content.generatedProfileIntroduction?.trim()) {
      reasons.add("content_profile_introduction_missing");
    }

    const authoritativeBlocked = reasons.has("banned") || reasons.has("suspended")
      || reasons.has("archived") || reasons.has("on_leave")
      || reasons.has("location_unresolved") || !validation.publicEligible
      || !validation.indexable || !currentStorefront;
    const contentReady = Boolean(content
      && (content.status === "reviewed" || content.status === "published")
      && !content.stale && content.generatedProfileIntroduction?.trim());
    if (!authoritativeBlocked && reasons.size === 0 && contentReady) {
      await db.transaction(async tx => {
        await tx.insert(panditStorefronts).values({
          panditId: row.id, isPublished: true, status: "published",
        }).onConflictDoUpdate({
          target: panditStorefronts.panditId,
          set: { isPublished: true, status: "published", updatedAt: new Date() },
        });
        if (content && content.status !== "published") {
          await tx.update(panditStorefrontContent).set(contentPublishColumns(content, actor(req)))
            .where(eq(panditStorefrontContent.id, content.id));
        }
        await tx.insert(adminAuditLogs).values({
          actor: actor(req), action: "pandit.resolve_validate_publish.published",
          target: `pandit:${row.id}`, ipAddress: req.ip,
          details: { batchId, reasons: [], location: location.proposed || location.before },
        });
      });
      if (normalized.slug) seoPaths.push(`/pandit/${encodeURIComponent(normalized.slug)}`);
      report.published.push({ panditId: row.id, reasons: [] });
    } else if (authoritativeBlocked) {
      const exact = Array.from(reasons);
      await db.insert(adminAuditLogs).values({
        actor: actor(req), action: "pandit.resolve_validate_publish.blocked",
        target: `pandit:${row.id}`, ipAddress: req.ip,
        details: { batchId, reasons: exact, location: location.before },
      });
      report.blocked.push({ panditId: row.id, reasons: exact });
    } else {
      const exact = Array.from(reasons);
      await db.insert(adminAuditLogs).values({
        actor: actor(req), action: "pandit.resolve_validate_publish.review",
        target: `pandit:${row.id}`, ipAddress: req.ip,
        details: { batchId, reasons: exact, location: location.before },
      });
      report.review.push({ panditId: row.id, reasons: exact });
    }
  }
  if (seoPaths.length) notifyPublish(req, seoPaths, { pingSitemap: true });
  return report;
}

export function registerPanditResolveValidatePublishRoutes(app: Express, adminAuthMiddleware: any) {
  const handler = async (req: Request, res: any) => {
    if (req.body?.confirmed !== true) {
      return res.status(400).json({ message: "Explicit Admin confirmation is required" });
    }
    try {
      return res.json(await runResolveValidatePublish(req));
    } catch (error: any) {
      return res.status(400).json({ message: error?.message || "Resolve, validate & publish failed" });
    }
  };
  app.post("/api/admin/pandit-resolve-validate-publish", adminAuthMiddleware, handler);
  app.post("/api/admin/pandits/resolve-validate-publish", adminAuthMiddleware, handler);
  app.post("/api/admin/pandit-location-rectification/resolve-validate-publish", adminAuthMiddleware, handler);
}