import crypto from "crypto";
import OpenAI from "openai";
import type { Express, Request } from "express";
import { and, eq, isNotNull, sql } from "drizzle-orm";
import {
  panditStorefrontContent,
  panditStorefrontContentGenerations,
  adminAuditLogs,
  pandits,
  panditStorefronts,
  indianStates,
  indianCities,
  panditStorefrontContentDraftSchema,
  panditStorefrontContentStatusSchema,
  type PanditStorefrontContent,
} from "@shared/schema";
import { db } from "./db";
import { storage } from "./storage";
import {
  getPubliclyEligiblePanditBySlug,
  getPubliclyEligiblePandits,
  isPanditStorefrontPublished,
  publicPanditServiceDto,
  publicStorefrontPanditDto,
} from "./pandit-public-access";
import { notifyPublish } from "./publish-notify";
import { effectivePanditGovernance } from "./pandit-public-eligibility";

export const PANDIT_CONTENT_PROMPT_VERSION = "pandit-storefront-factual-v1";

type PublicFacts = {
  panditId: number;
  canonicalUrl: string;
  profile: Record<string, unknown>;
  location: { city: string | null; state: string | null };
  services: unknown[];
  catalogue: unknown[];
  reviewAggregate: { rating: number | null; reviewCount: number };
};

const text = (value: unknown) => typeof value === "string" ? value.trim() : "";

/** Stable JSON is used so equivalent database snapshots have one hash. */
function stableValue(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stableValue);
  if (value && typeof value === "object") {
    return Object.keys(value as Record<string, unknown>).sort()
      .reduce<Record<string, unknown>>((out, key) => {
        out[key] = stableValue((value as Record<string, unknown>)[key]);
        return out;
      }, {});
  }
  return value;
}

export function hashPublicFacts(facts: PublicFacts): string {
  return crypto.createHash("sha256")
    .update(JSON.stringify(stableValue(facts)))
    .digest("hex");
}

/**
 * Build the exact allow-listed payload sent to an AI provider. Do not replace
 * this with a spread of a Pandit/storefront row: those rows contain contacts,
 * credentials, authentication state, and private application data.
 */
export async function buildPanditPublicFacts(panditId: number): Promise<{
  facts: PublicFacts;
  hash: string;
}> {
  const pandit = await storage.getPandit(panditId);
  if (!pandit?.slug) throw new Error("Public Pandit profile not found");
  const eligible = await getPubliclyEligiblePanditBySlug(pandit.slug);
  if (!eligible || eligible.id !== panditId) throw new Error("Pandit is not publicly eligible");
  const storefront = await storage.getPanditStorefrontByPanditId(panditId);
  if (!isPanditStorefrontPublished(storefront)) throw new Error("Pandit storefront is not published");

  const [serviceRows, packages, reviews] = await Promise.all([
    storage.listPanditServicesWithMaster(panditId, true).catch(() => []),
    storage.listPanditPackages(panditId, true).catch(() => []),
    storage.getPanditReviews(panditId).catch(() => []),
  ]);
  const services = serviceRows.map(publicPanditServiceDto).map((service) => ({
    id: service.id, name: service.name, slug: service.slug, category: service.category,
    serviceType: service.serviceType, description: service.description,
    price: service.price, durationMinutes: service.durationMinutes, mode: service.mode,
    serviceAreas: service.serviceAreas,
  }));
  const catalogue = [];
  for (const pkg of packages) {
    const items = await storage.listPanditPackageItems(pkg.id).catch(() => []);
    catalogue.push({
      id: pkg.id, name: pkg.name, slug: pkg.slug, description: pkg.description,
      price: pkg.price, compareAtPrice: pkg.compareAtPrice,
      items: items.map((item) => ({ panditServiceId: item.panditServiceId })),
    });
  }
  const approvedReviews = reviews.filter((review) => review.status === "approved");
  const reviewCount = approvedReviews.length;
  const rating = reviewCount
    ? Math.round(approvedReviews.reduce((sum, review) => sum + Number(review.rating || 0), 0) / reviewCount * 10) / 10
    : null;
  const publicPandit = publicStorefrontPanditDto(eligible);
  const facts: PublicFacts = {
    panditId,
    canonicalUrl: `/pandit/${encodeURIComponent(String(eligible.slug))}`,
    profile: {
      name: publicPandit.name,
      bio: storefront?.bio || publicPandit.bio || null,
      tagline: storefront?.tagline || null,
      specialization: publicPandit.specialization,
      languages: publicPandit.languages,
      experience: publicPandit.experience,
      verified: publicPandit.verified,
      ...(publicPandit.verified && publicPandit.registrationNo
        ? { registrationNo: publicPandit.registrationNo }
        : {}),
    },
    location: { city: publicPandit.city || null, state: publicPandit.state || null },
    services,
    catalogue,
    reviewAggregate: { rating, reviewCount },
  };
  return { facts, hash: hashPublicFacts(facts) };
}

export type PanditContentDraft = {
  profileIntroduction: string;
  tagline: string;
  serviceOverview: string;
  seoTitle: string;
  metaDescription: string;
  faqs: Array<{ question: string; answer: string }>;
  aiSummary: string;
};

const FORBIDDEN_CLAIMS = /\b(guarantee(?:d|s)?|cure(?:s|d)?|heal(?:s|ed)?|medical advice|financial advice|legal advice|miracle|100% success|best in india|number one|award[- ]winning|certified|unpublished|available now|always available)\b/i;
const PRIVATE_VALUE = /(?:[\w.+-]+@[\w.-]+\.[a-z]{2,}|\+?\d[\d\s().-]{8,})/i;

function factNumbers(facts: PublicFacts): Set<string> {
  const values: number[] = [];
  const profile = facts.profile;
  for (const key of ["experience"] as const) if (typeof profile[key] === "number") values.push(profile[key] as number);
  if (facts.reviewAggregate.rating != null) values.push(facts.reviewAggregate.rating);
  values.push(facts.reviewAggregate.reviewCount);
  for (const service of facts.services as Array<Record<string, unknown>>) {
    for (const key of ["price", "durationMinutes"]) if (typeof service[key] === "number") values.push(service[key] as number);
  }
  for (const item of facts.catalogue as Array<Record<string, unknown>>) {
    for (const key of ["price", "compareAtPrice"]) if (typeof item[key] === "number") values.push(item[key] as number);
  }
  return new Set(values.flatMap((value) => [String(value), String(value).replace(/\.0+$/, "")]));
}

/**
 * Claims are checked against the same allow-listed snapshot that is sent to
 * the model. This intentionally errs toward rejection: prose may paraphrase
 * facts, but it may not introduce a new entity, number, location, service,
 * price, rating, experience claim, or credential.
 */
export function validatePanditContentDraft(value: unknown, facts?: PublicFacts): PanditContentDraft {
  const parsed = panditStorefrontContentDraftSchema.safeParse(value);
  if (!parsed.success) throw new Error("AI draft has an invalid shape");
  const strings = [
    parsed.data.profileIntroduction, parsed.data.tagline, parsed.data.serviceOverview,
    parsed.data.seoTitle, parsed.data.metaDescription, parsed.data.aiSummary,
    ...parsed.data.faqs.flatMap((faq) => [faq.question, faq.answer]),
  ];
  if (strings.some((item) => /<[^>]*>/.test(item) || FORBIDDEN_CLAIMS.test(item) || PRIVATE_VALUE.test(item))) {
    throw new Error("AI draft contains an unsupported claim or private contact value");
  }
  if (facts) {
    const all = strings.join(" ");
    const numbers = all.match(/\b\d+(?:\.\d+)?\b/g) || [];
    const allowedNumbers = factNumbers(facts);
    if (numbers.some((number) => !allowedNumbers.has(number))) {
      throw new Error("AI draft contains a number not present in the verified source facts");
    }
    const locationNames = [facts.location.city, facts.location.state].filter(Boolean).map((item) => String(item).toLocaleLowerCase("en-IN"));
    const locationClaims = all.match(/\b(?:in|from|based in|located in|serves)\s+([A-Za-z][A-Za-z -]{1,40})/gi) || [];
    for (const claim of locationClaims) {
      const place = claim.replace(/^(?:in|from|based in|located in|serves)\s+/i, "").trim().toLocaleLowerCase("en-IN");
      if (!locationNames.some((allowed) => place.startsWith(allowed))) {
        throw new Error("AI draft contains a location not present in the verified source facts");
      }
    }
    const normalizePhrase = (value: string) => value.toLocaleLowerCase("en-IN")
      .replace(/[^a-z0-9\s]+/g, " ").replace(/\s+/g, " ").trim();
    const languageNames = String(facts.profile.languages || "").split(/[,/&]| and /i)
      .map((item) => normalizePhrase(item)).filter(Boolean);
    const languageClaims = all.match(/\b(?:speaks?|languages?|fluent in|communicates? in)\s+([^.!?;]+)/gi) || [];
    for (const claim of languageClaims) {
      const value = claim.replace(/^(?:speaks?|languages?|fluent in|communicates? in)\s+/i, "")
        .replace(/\b(fluently|language|languages)\b/gi, "").trim().toLocaleLowerCase("en-IN");
      const claimedLanguages = value.split(/\s*(?:,|&|\band\b)\s*/i).map((item) => item.trim()).filter(Boolean);
      if (claimedLanguages.some((claimed) => !languageNames.includes(normalizePhrase(claimed)))) {
        throw new Error("AI draft contains a language not present in the verified source facts");
      }
    }
    const serviceNames = (facts.services as Array<Record<string, unknown>>)
      .flatMap((service) => [service.name, service.slug, service.category, service.serviceType])
      .filter((item): item is string => typeof item === "string" && Boolean(item.trim()))
      .map((item) => normalizePhrase(item));
    const genericServiceWords = new Set(["puja", "service", "services", "ritual", "rituals", "ceremony", "ceremonies", "booking", "book", "vedic", "pandit"]);
    const serviceClaims = all.match(/\b(?:offers?|provides?|performs?|speciali[sz]es?\s+in)\s+([^.!?;]+)/gi) || [];
    for (const claim of serviceClaims) {
      const words = claim.replace(/^(?:offers?|provides?|performs?|speciali[sz]es?\s+in)\s+/i, "")
        .replace(/\s+(?:in|from|based in|located in)\s+[A-Za-z][A-Za-z -]*$/i, "")
        .toLocaleLowerCase("en-IN").split(/[^a-z0-9]+/).filter(Boolean);
      const claimCore = words.filter((word) => !genericServiceWords.has(word)).join(" ");
      const allowedCores = serviceNames.map((name) => name.split(" ").filter((word) => !genericServiceWords.has(word)).join(" "));
      if (words.length && !serviceNames.some((name, index) => {
        const allowedCore = allowedCores[index];
        return claimCore === allowedCore && (claimCore.length > 0 || words.every((word) => genericServiceWords.has(word)));
      })) {
        throw new Error("AI draft contains a service not present in the verified catalogue");
      }
    }
    const profileName = String(facts.profile.name || "").toLocaleLowerCase("en-IN");
    const credentialClaims = /\b(qualified|scholar|degree|trained|expert|affiliated|affiliation|credential|registration|certification|specialist)\b/i;
    const registrationNumber = typeof facts.profile.registrationNo === "string"
      ? normalizePhrase(facts.profile.registrationNo) : "";
    const registrationClaim = /\bregistration\b/i.test(all) && registrationNumber && normalizePhrase(all).includes(registrationNumber);
    if (credentialClaims.test(all) && !registrationClaim) {
      throw new Error("AI draft contains a qualification or affiliation not present in the verified source facts");
    }
    if (/\bverified\b/i.test(all) && facts.profile.verified !== true) {
      throw new Error("AI draft contains an unsupported verification claim");
    }
    if (/\b(?:years?|yrs?)\s+(?:of\s+)?experience\b/i.test(all)
      && !new RegExp(`\\b${String(facts.profile.experience || 0)}\\+?\\s+(?:years?|yrs?)\\s+(?:of\\s+)?experience\\b`, "i").test(all)) {
      throw new Error("AI draft contains an unsupported experience claim");
    }
    if (/\b(?:rating|rated|stars?)\b/i.test(all)
      && facts.reviewAggregate.rating == null) {
      throw new Error("AI draft contains an unsupported rating claim");
    }
    // Avoid an unused allow-list being optimized away and make name checking
    // explicit: a supplied Pandit name is the only personal name permitted.
    const namedClaims = all.match(/\b(?:Pandit|Acharya|Guru)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*/g) || [];
    if (profileName && namedClaims.some((claim) => !claim.toLocaleLowerCase("en-IN").includes(profileName))
      || (profileName && /\b(?:by|with)\s+[A-Z][a-z]+/.test(all)
      && !all.toLocaleLowerCase("en-IN").includes(profileName))) {
      throw new Error("AI draft contains a person name not present in the verified source facts");
    }
  }
  return parsed.data;
}

function openAiClient() {
  const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OpenAI is not configured");
  return new OpenAI({ apiKey, baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL });
}

export async function generatePanditContentDraft(facts: PublicFacts): Promise<{
  draft: PanditContentDraft;
  modelIdentifier: string;
}> {
  const modelIdentifier = process.env.PANDIT_STOREFRONT_AI_MODEL || "gpt-4o-mini";
  const response = await openAiClient().chat.completions.create({
    model: modelIdentifier,
    messages: [
      {
        role: "system",
        content: [
          "You create a conservative factual draft for one Vedic Tatva Pandit storefront.",
          "Return only JSON with profileIntroduction, tagline, serviceOverview, seoTitle, metaDescription, faqs, and aiSummary.",
          "Use only the VERIFIED_PUBLIC_FACTS object. Every name, service, price, language, location, experience, review aggregate, and credential must be copied from it.",
          "Never infer qualifications, availability, travel coverage, awards, affiliations, outcomes, guarantees, ratings beyond the supplied aggregate, or services not listed.",
          "Never include phone numbers, email addresses, passwords, authentication data, application data, or private notes.",
          "Do not make medical, legal, financial, or guaranteed spiritual claims. This is a draft for Admin review.",
        ].join(" "),
      },
      { role: "user", content: `VERIFIED_PUBLIC_FACTS:\n${JSON.stringify(facts)}` },
    ],
    response_format: { type: "json_object" },
    temperature: 0.1,
    max_tokens: 1400,
  });
  const raw = response.choices[0]?.message?.content;
  if (!raw) throw new Error("AI returned an empty draft");
  return { draft: validatePanditContentDraft(JSON.parse(raw), facts), modelIdentifier };
}

let injectedDraftGenerator: typeof generatePanditContentDraft | null = null;
/** Test/integration seam; production leaves the model-backed generator intact. */
export function setPanditContentDraftGenerator(
  generator: typeof generatePanditContentDraft | null,
) {
  injectedDraftGenerator = generator;
}

function rowDraft(row: PanditStorefrontContent): PanditContentDraft {
  return {
    profileIntroduction: row.generatedProfileIntroduction || "",
    tagline: row.generatedTagline || "",
    serviceOverview: row.generatedServiceOverview || "",
    seoTitle: row.generatedSeoTitle || "",
    metaDescription: row.generatedMetaDescription || "",
    faqs: (row.generatedFaqs || []) as PanditContentDraft["faqs"],
    aiSummary: row.generatedAiSummary || "",
  };
}

function draftColumns(draft: PanditContentDraft) {
  return {
    generatedProfileIntroduction: draft.profileIntroduction,
    generatedTagline: draft.tagline,
    generatedServiceOverview: draft.serviceOverview,
    generatedSeoTitle: draft.seoTitle,
    generatedMetaDescription: draft.metaDescription,
    generatedFaqs: draft.faqs,
    generatedAiSummary: draft.aiSummary,
  };
}

function publishedColumns(draft: PanditContentDraft) {
  return {
    publishedProfileIntroduction: draft.profileIntroduction,
    publishedTagline: draft.tagline,
    publishedServiceOverview: draft.serviceOverview,
    publishedSeoTitle: draft.seoTitle,
    publishedMetaDescription: draft.metaDescription,
    publishedFaqs: draft.faqs,
    publishedAiSummary: draft.aiSummary,
  };
}

export async function getPublishedPanditContent(panditId: number) {
  const [row] = await db.select().from(panditStorefrontContent).where(and(
    eq(panditStorefrontContent.panditId, panditId),
    isNotNull(panditStorefrontContent.publishedProfileIntroduction),
  )).limit(1);
  if (!row) return null;
  try {
    const { hash } = await buildPanditPublicFacts(panditId);
    return await markStaleIfChanged(row, hash);
  } catch {
    // A failed governance/source check must never expose a previously
    // published editorial through feeds or storefront SEO.
    return null;
  }
}

export type PanditDiscoveryFeedItem = {
  name: string;
  url: string;
  canonicalUrl: string;
  location: { city: string | null; state: string | null };
  specialization: string | null;
  languages: string | null;
  services: Array<Record<string, unknown>>;
  summary: string | null;
  source: string;
  updatedAt: Date | null;
};

export function authoritativePanditLastmod(
  pandit: { createdAt?: Date | string | null },
  storefront: { createdAt?: Date | string | null; updatedAt?: Date | string | null },
  content?: { publishedAt?: Date | string | null } | null,
): string | null {
  const dates = [pandit.createdAt, storefront.createdAt, storefront.updatedAt, content?.publishedAt]
    .filter((value): value is Date | string => Boolean(value))
    .map((value) => new Date(value))
    .filter((value) => !Number.isNaN(value.getTime()));
  return dates.length
    ? new Date(Math.max(...dates.map((value) => value.getTime()))).toISOString().split("T")[0]
    : null;
}

let discoveryFeedCache: {
  siteUrl: string;
  expiresAt: number;
  value?: PanditDiscoveryFeedItem[];
  pending?: Promise<PanditDiscoveryFeedItem[]>;
} | null = null;
const DISCOVERY_FEED_TTL_MS = 5 * 60 * 1000;

/** One bounded aggregate snapshot is shared by /llms.txt and the JSON feed. */
export async function getPanditDiscoveryFeed(siteUrl: string): Promise<PanditDiscoveryFeedItem[]> {
  const now = Date.now();
  if (discoveryFeedCache?.siteUrl === siteUrl && discoveryFeedCache.value && discoveryFeedCache.expiresAt > now) return discoveryFeedCache.value;
  if (discoveryFeedCache?.siteUrl === siteUrl && discoveryFeedCache.pending && discoveryFeedCache.expiresAt > now) return discoveryFeedCache.pending;
  const pending = (async () => {
    let candidates;
    try { candidates = await getPubliclyEligiblePandits(); }
    catch (error) { throw new Error(`Pandit eligibility check failed: ${error instanceof Error ? error.message : "unknown error"}`); }
    const profiles: PanditDiscoveryFeedItem[] = [];
    for (const pandit of candidates) {
      if (!pandit.slug) continue;
      const storefront = await storage.getPanditStorefrontByPanditId(pandit.id);
      if (!isPanditStorefrontPublished(storefront)) continue;
      // Re-run the authoritative source/governance check; a failed check
      // rejects the aggregate rather than silently publishing a partial feed.
      await buildPanditPublicFacts(pandit.id);
      const editorial = await getPublishedPanditContent(pandit.id);
      if (editorial?.stale) continue;
      const services = (await storage.listPanditServicesWithMaster(pandit.id, true))
        .map(publicPanditServiceDto)
        .map((service) => ({
          name: service.name, slug: service.slug, category: service.category,
          serviceType: service.serviceType, priceINR: service.price,
          durationMinutes: service.durationMinutes, mode: service.mode,
          serviceAreas: service.serviceAreas,
        }));
      const publicProfile = publicStorefrontPanditDto(pandit);
      profiles.push({
        name: publicProfile.name,
        url: `${siteUrl}/pandit/${encodeURIComponent(String(publicProfile.slug))}`,
        canonicalUrl: `/pandit/${encodeURIComponent(String(publicProfile.slug))}`,
        location: { city: publicProfile.city || null, state: publicProfile.state || null },
        specialization: publicProfile.specialization,
        languages: publicProfile.languages,
        services,
        summary: editorial?.publishedAiSummary || null,
        source: "Vedic Tatva public Pandit profile",
        updatedAt: editorial?.publishedAt || storefront?.updatedAt || pandit.createdAt || null,
      });
      if (profiles.length >= 100) break;
    }
    return profiles;
  })();
  discoveryFeedCache = { siteUrl, expiresAt: now + DISCOVERY_FEED_TTL_MS, pending };
  try {
    const value = await pending;
    discoveryFeedCache = { siteUrl, expiresAt: Date.now() + DISCOVERY_FEED_TTL_MS, value };
    return value;
  } catch (error) {
    discoveryFeedCache = null;
    throw error;
  }
}

async function markStaleIfChanged(row: PanditStorefrontContent, hash: string) {
  const publishedHash = row.publishedSourceSnapshotHash || row.sourceSnapshotHash;
  if (publishedHash === hash || row.stale) return row;
  const updated = await db.transaction(async (tx) => {
    const [next] = await tx.update(panditStorefrontContent).set({
      stale: true,
      staleReason: "Approved public profile, service, catalogue, review, or location facts changed",
      updatedAt: new Date(),
      revision: sql`${panditStorefrontContent.revision} + 1`,
    }).where(and(eq(panditStorefrontContent.id, row.id), eq(panditStorefrontContent.revision, row.revision))).returning();
    if (next) {
      await tx.insert(adminAuditLogs).values({
        actor: "system:stale-detection", action: "pandit-storefront-content.stale",
        target: `pandit:${row.panditId}`,
        details: { previousHash: publishedHash, currentHash: hash, revision: next.revision },
      });
    }
    return next;
  });
  return updated || row;
}

async function loadRow(panditId: number) {
  const [row] = await db.select().from(panditStorefrontContent)
    .where(eq(panditStorefrontContent.panditId, panditId)).limit(1);
  if (!row) return null;
  const { hash } = await buildPanditPublicFacts(panditId);
  return markStaleIfChanged(row, hash);
}

function actor(req: Request) {
  const id = Number((req as Request & { adminUserId?: number }).adminUserId);
  if (!Number.isSafeInteger(id) || id < 1) throw new Error("Authenticated Admin identity is required");
  return `admin-user:${id}`;
}

function auditIp(req: Request) {
  return String(req.headers["x-forwarded-for"] || req.ip || "").split(",")[0].trim() || null;
}

async function auditTx(tx: any, req: Request, action: string, target: string, details: Record<string, unknown>) {
  await tx.insert(adminAuditLogs).values({
    actor: actor(req), action, target, details, ipAddress: auditIp(req),
  });
}

export function canTransitionPanditContent(from: string, to: string) {
  if (from === to) return true;
  return (from === "draft" && to === "reviewed")
    || (from === "reviewed" && (to === "draft" || to === "published"))
    || (from === "published" && to === "reviewed")
    || (from === "draft" && to === "rejected")
    || (from === "reviewed" && to === "rejected")
    || (from === "rejected" && to === "draft");
}

export function registerPanditStorefrontContentRoutes(app: Express, adminAuthMiddleware: any) {
  app.get("/api/admin/pandit-storefront-content", adminAuthMiddleware, async (req, res, next) => {
    try {
      const limit = Math.min(200, Math.max(1, Number(req.query.limit) || 50));
      const offset = Math.min(100000, Math.max(0, Number(req.query.offset) || 0));
      const [states, cities, rows] = await Promise.all([
        db.select({ id: indianStates.id }).from(indianStates).where(eq(indianStates.isActive, true)),
        db.select({ id: indianCities.id, stateId: indianCities.stateId }).from(indianCities).where(eq(indianCities.isActive, true)),
        db.select({ pandit: pandits, storefront: panditStorefronts, content: panditStorefrontContent })
          .from(pandits)
          .leftJoin(panditStorefronts, eq(panditStorefronts.panditId, pandits.id))
          .leftJoin(panditStorefrontContent, eq(panditStorefrontContent.panditId, pandits.id))
          .orderBy(pandits.id)
          .limit(limit)
          .offset(offset),
      ]);
      const stateIds = new Set(states.map((state) => state.id));
      const cityById = new Map(cities.map((city) => [city.id, city]));
      const items = rows.map(({ pandit, storefront, content }) => {
        const governance = effectivePanditGovernance(pandit, stateIds, cityById);
        const storefrontPublished = isPanditStorefrontPublished(storefront);
        const canonicalUrl = pandit.slug ? `/pandit/${encodeURIComponent(pandit.slug)}` : null;
        return {
          panditId: pandit.id,
          name: pandit.name,
          canonicalUrl,
          content: content ? {
            status: content.status, stale: content.stale, staleReason: content.staleReason,
            revision: content.revision, updatedAt: content.updatedAt,
            generatedAt: content.generatedAt, publishedAt: content.publishedAt,
          } : null,
          eligibility: {
            publicDirectory: governance.directory,
            storefrontPublished,
            indexable: governance.directory && storefrontPublished && Boolean(canonicalUrl) && pandit.indexingMode !== "noindex",
          },
        };
      });
      return res.json({ items, limit, offset, nextOffset: rows.length === limit ? offset + limit : null });
    } catch (error) { return next(error); }
  });

  app.get("/api/admin/pandit-storefront-content/:panditId", adminAuthMiddleware, async (req, res, next) => {
    try {
      const panditId = Number(req.params.panditId);
      if (!Number.isSafeInteger(panditId) || panditId < 1) return res.status(400).json({ message: "Invalid Pandit id" });
      const row = await loadRow(panditId);
      const { facts, hash } = await buildPanditPublicFacts(panditId);
      if (!row) return res.json({ record: null, currentSourceSnapshotHash: hash, sourceFacts: facts });
      return res.json({ record: row, currentSourceSnapshotHash: hash, sourceFacts: facts });
    } catch (error) { return next(error); }
  });

  app.post("/api/admin/pandit-storefront-content/:panditId/generate", adminAuthMiddleware, async (req, res, next) => {
    try {
      const panditId = Number(req.params.panditId);
      if (!Number.isSafeInteger(panditId) || panditId < 1) return res.status(400).json({ message: "Invalid Pandit id" });
      if (req.body?.confirm !== true) return res.status(400).json({ message: "Explicit Admin confirmation is required to generate a draft" });
      const expectedRevision = req.body?.expectedRevision == null ? null : Number(req.body.expectedRevision);
      const deliberateRegeneration = req.body?.regenerate === true;
      const { facts, hash } = await buildPanditPublicFacts(panditId);
      const existing = await loadRow(panditId);
      if (existing && expectedRevision === null) {
        return res.status(409).json({ message: "expectedRevision is required to regenerate existing content", current: existing });
      }
      if (existing && expectedRevision !== null && existing.revision !== expectedRevision) {
        return res.status(409).json({ message: "Content changed; reload before generating", current: existing });
      }
      if (existing && !deliberateRegeneration && !existing.stale && existing.sourceSnapshotHash === hash
        && existing.status !== "rejected" && existing.generatedProfileIntroduction) {
        return res.json(existing);
      }
      const generationKey = `${hash}:${PANDIT_CONTENT_PROMPT_VERSION}${deliberateRegeneration ? `:${crypto.randomUUID()}` : ""}`;
      const reservation = await db.transaction(async (tx) => {
        const [created] = await tx.insert(panditStorefrontContentGenerations).values({
          panditId, contentId: existing?.id || null, generationKey,
          sourceSnapshotHash: hash, sourceFields: facts,
          promptVersion: PANDIT_CONTENT_PROMPT_VERSION, actor: actor(req),
        }).onConflictDoNothing({ target: panditStorefrontContentGenerations.generationKey }).returning();
        if (!created) {
          const [prior] = await tx.select().from(panditStorefrontContentGenerations)
            .where(eq(panditStorefrontContentGenerations.generationKey, generationKey)).limit(1);
          return { inserted: false, prior, content: existing };
        }
        let content = existing;
        if (!content) {
          const [inserted] = await tx.insert(panditStorefrontContent).values({
            panditId, canonicalUrl: facts.canonicalUrl, sourceSnapshotHash: hash, sourceFields: facts,
            promptVersion: PANDIT_CONTENT_PROMPT_VERSION, status: "draft",
            generationKey, createdBy: actor(req), updatedBy: actor(req), updatedAt: new Date(),
          }).onConflictDoNothing({ target: panditStorefrontContent.panditId }).returning();
          content = inserted;
        }
        await auditTx(tx, req, "pandit-storefront-content.generate.reserve", `pandit:${panditId}`, {
          generationKey, sourceSnapshotHash: hash,
        });
        return { inserted: true, prior: created, content };
      });
      if (!reservation.inserted && reservation.prior?.status === "pending") {
        return res.status(409).json({ message: "A generation for this source snapshot is already in progress" });
      }
      if (!reservation.inserted && reservation.prior?.status === "completed" && reservation.content) {
        return res.json(reservation.content);
      }
      const { draft, modelIdentifier } = await (injectedDraftGenerator || generatePanditContentDraft)(facts);
      const now = new Date();
      let row: PanditStorefrontContent | undefined;
      try {
        row = await db.transaction(async (tx) => {
          const [updated] = await tx.update(panditStorefrontContent).set({
          canonicalUrl: facts.canonicalUrl, sourceSnapshotHash: hash, sourceFields: facts,
          promptVersion: PANDIT_CONTENT_PROMPT_VERSION, modelIdentifier, ...draftColumns(draft),
          status: "draft", stale: false, staleReason: null, generationKey,
          generatedAt: now, updatedBy: actor(req), updatedAt: now, reviewedBy: null, reviewedAt: null,
          rejectedBy: null, rejectedAt: null, rejectionReason: null,
          revision: sql`${panditStorefrontContent.revision} + 1`,
          }).where(and(
            eq(panditStorefrontContent.id, reservation.content!.id),
            eq(panditStorefrontContent.revision, reservation.content!.revision),
          )).returning();
          if (!updated) throw new Error("Content changed during generation; retry");
          await tx.update(panditStorefrontContentGenerations).set({
            status: "completed", contentId: updated.id, draft, modelIdentifier,
            revision: updated.revision, completedAt: now,
          }).where(eq(panditStorefrontContentGenerations.id, reservation.prior!.id));
          await auditTx(tx, req, "pandit-storefront-content.generate", `pandit:${panditId}`, {
            revision: updated.revision, sourceSnapshotHash: hash, deliberateRegeneration,
            generationKey, promptVersion: PANDIT_CONTENT_PROMPT_VERSION, modelIdentifier,
          });
          return updated;
        });
      } catch (error) {
        await db.transaction(async (tx) => {
          await tx.update(panditStorefrontContentGenerations).set({
            status: "failed", error: String(error instanceof Error ? error.message : error).slice(0, 500),
          }).where(eq(panditStorefrontContentGenerations.id, reservation.prior!.id));
          await auditTx(tx, req, "pandit-storefront-content.generate.failed", `pandit:${panditId}`, { generationKey });
        }).catch(() => {});
        throw error;
      }
      if (!row) return res.status(409).json({ message: "Content changed during generation; retry" });
      return res.status(existing ? 200 : 201).json(row);
    } catch (error) { return next(error); }
  });

  app.patch("/api/admin/pandit-storefront-content/:panditId/draft", adminAuthMiddleware, async (req, res, next) => {
    try {
      const panditId = Number(req.params.panditId);
      const expectedRevision = Number(req.body?.expectedRevision);
      if (!Number.isSafeInteger(panditId) || !Number.isSafeInteger(expectedRevision)) return res.status(400).json({ message: "Revision is required" });
      const row = await loadRow(panditId);
      if (!row) return res.status(404).json({ message: "Storefront content record not found" });
      if (row.revision !== expectedRevision) return res.status(409).json({ message: "Content changed; reload before editing", current: row });
      const { facts, hash } = await buildPanditPublicFacts(panditId);
      const draft = validatePanditContentDraft(req.body?.draft, facts);
      const updated = await db.transaction(async (tx) => {
        const [next] = await tx.update(panditStorefrontContent).set({
          ...draftColumns(draft), status: "draft", updatedBy: actor(req), updatedAt: new Date(),
          canonicalUrl: facts.canonicalUrl, sourceSnapshotHash: hash, sourceFields: facts,
          stale: false, staleReason: null,
          reviewedBy: null, reviewedAt: null, revision: sql`${panditStorefrontContent.revision} + 1`,
        }).where(and(eq(panditStorefrontContent.id, row.id), eq(panditStorefrontContent.revision, expectedRevision))).returning();
        if (next) await auditTx(tx, req, "pandit-storefront-content.edit", `pandit:${panditId}`, { revision: next.revision });
        return next;
      });
      if (!updated) return res.status(409).json({ message: "Content changed; retry" });
      return res.json(updated);
    } catch (error) { return next(error); }
  });

  app.post("/api/admin/pandit-storefront-content/:panditId/status", adminAuthMiddleware, async (req, res, next) => {
    try {
      const panditId = Number(req.params.panditId);
      const expectedRevision = Number(req.body?.expectedRevision);
      const requested = panditStorefrontContentStatusSchema.safeParse(req.body?.status);
      if (!Number.isSafeInteger(panditId) || !Number.isSafeInteger(expectedRevision) || !requested.success) return res.status(400).json({ message: "Invalid status request" });
      const row = await loadRow(panditId);
      if (!row) return res.status(404).json({ message: "Storefront content record not found" });
      if (row.revision !== expectedRevision) return res.status(409).json({ message: "Content changed; reload before reviewing", current: row });
      if (!canTransitionPanditContent(row.status, requested.data)) return res.status(409).json({ message: `Cannot transition ${row.status} to ${requested.data}` });
      if (requested.data === "published" && (row.status !== "reviewed" || row.stale)) return res.status(409).json({ message: "Only a reviewed, non-stale draft can be published" });
      if (requested.data === "reviewed" && !row.generatedProfileIntroduction?.trim()) return res.status(409).json({ message: "A factual profile introduction is required for review" });
      const now = new Date();
      const update: Record<string, unknown> = {
        status: requested.data, updatedBy: actor(req), updatedAt: now,
        revision: sql`${panditStorefrontContent.revision} + 1`,
      };
      if (requested.data === "reviewed") { update.reviewedBy = actor(req); update.reviewedAt = now; }
      if (requested.data === "rejected") { update.rejectedBy = actor(req); update.rejectedAt = now; update.rejectionReason = text(req.body?.reason).slice(0, 500) || "Rejected by Admin"; }
      if (requested.data === "published") {
        Object.assign(update, publishedColumns(rowDraft(row)));
        update.publishedSourceSnapshotHash = row.sourceSnapshotHash;
        update.publishedBy = actor(req); update.publishedAt = now; update.stale = false; update.staleReason = null;
      }
      const updated = await db.transaction(async (tx) => {
        const [next] = await tx.update(panditStorefrontContent).set(update as any)
          .where(and(eq(panditStorefrontContent.id, row.id), eq(panditStorefrontContent.revision, expectedRevision))).returning();
        if (next) await auditTx(tx, req, `pandit-storefront-content.${requested.data}`, `pandit:${panditId}`, {
          from: row.status, to: next.status, revision: next.revision,
        });
        return next;
      });
      if (!updated) return res.status(409).json({ message: "Content changed; retry" });
      if (requested.data === "published") notifyPublish(req, [updated.canonicalUrl], { pingSitemap: true });
      return res.json(updated);
    } catch (error) { return next(error); }
  });
}
