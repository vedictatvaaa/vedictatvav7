import type { Express, Request } from "express";
import { and, asc, eq, ilike, or } from "drizzle-orm";
import { z } from "zod";
import { adminAuditLogs, destinationSlugAliases, temples, tirths } from "@shared/schema";
import { db } from "../db";
import { KnowledgeGraphConflictError, KnowledgeGraphValidationError } from "./types";
import { safeMetadata } from "./validation";
import { TIRTH_SOURCE_CONSOLIDATION_MANIFEST } from "@shared/destination-consolidation-manifest";
import { advanceKnowledgeGraphGeneration } from "./public-state";

type DestinationType = "TIRTH" | "TEMPLE";
type AdminRequest = Request & { adminUserId?: number };
class DestinationNotFoundError extends Error {}
const text = (max: number) => z.string().trim().min(1).max(max);
const optionalText = (max: number) => z.string().trim().max(max).nullable().optional();

/** Normalizes editorial input to the database slug grammar without accepting empty slugs. */
export function normalizeDestinationSlug(value: unknown): string {
  if (typeof value !== "string") throw new KnowledgeGraphValidationError("slug must be a string");
  const slug = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase()
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!slug || slug.length > 160) throw new KnowledgeGraphValidationError("slug must normalize to 1-160 lowercase letters, numbers, and hyphens");
  return slug;
}

const commonCreate = z.object({
  migrationSourceKey: text(200), slug: z.string().max(500), name: text(300), nameHindi: optionalText(300),
  provenance: z.enum(["TIRTH_GUIDE", "TEMPLE_TOURISM", "EDITORIAL"]),
  state: optionalText(160), deity: optionalText(160), category: optionalText(160),
  shortDescription: optionalText(1000), description: optionalText(50000), heroMediaUrl: optionalText(2048),
  latitude: z.number().finite().min(-90).max(90).nullable().optional(),
  longitude: z.number().finite().min(-180).max(180).nullable().optional(),
  editorial: z.unknown().optional(),
}).strict();
const tirthCreate = commonCreate.extend({ region: optionalText(160) }).strict();
const templeCreate = commonCreate.extend({ location: optionalText(300) }).strict();
const patchBase = commonCreate.omit({ migrationSourceKey: true, provenance: true }).partial().extend({
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
}).strict();

const tableFor = (type: DestinationType) => type === "TIRTH" ? tirths : temples;
const actor = (req: AdminRequest) => {
  if (!Number.isSafeInteger(req.adminUserId) || req.adminUserId! < 1) throw new Error("Authenticated Admin identity is required");
  return req.adminUserId!;
};
const ip = (req: Request) => (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || null;
const dto = (type: DestinationType, row: any) => ({
  id: row.id, type, slug: row.slug, name: row.name, nameHindi: row.nameHindi ?? null, status: row.status,
  provenance: row.provenance, state: row.state ?? null, deity: row.deity ?? null, category: row.category ?? null,
  shortDescription: row.shortDescription ?? null, description: row.description ?? null, heroMediaUrl: row.heroMediaUrl ?? null,
  latitude: row.latitude ?? null, longitude: row.longitude ?? null, region: row.region ?? null, location: row.location ?? null,
  editorial: row.editorial ?? {}, updatedAt: row.updatedAt,
});
export const publicDestinationDto = (type: DestinationType, row: any) => ({
  id: row.id, type, slug: row.slug, name: row.name, nameHindi: row.nameHindi ?? null,
  state: row.state ?? null, deity: row.deity ?? null, category: row.category ?? null,
  shortDescription: row.shortDescription ?? null, description: row.description ?? null,
  heroMediaUrl: row.heroMediaUrl ?? null, latitude: row.latitude ?? null, longitude: row.longitude ?? null,
  ...(type === "TIRTH" ? { region: row.region ?? null } : { location: row.location ?? null }),
});

export function validateCoordinates(input: { latitude?: number | null; longitude?: number | null }, existing?: { latitude: number | null; longitude: number | null }) {
  const latitude = input.latitude === undefined ? existing?.latitude : input.latitude;
  const longitude = input.longitude === undefined ? existing?.longitude : input.longitude;
  if ((latitude === undefined) !== (longitude === undefined) || (latitude === null) !== (longitude === null)) {
    throw new KnowledgeGraphValidationError("latitude and longitude must be supplied together");
  }
  return { latitude, longitude };
}

export function validateDestinationInput(type: DestinationType, body: unknown, creating: boolean) {
  const patch = (type === "TIRTH" ? patchBase.extend({ region: optionalText(160) }) : patchBase.extend({ location: optionalText(300) })).strict();
  const parsed = (creating ? (type === "TIRTH" ? tirthCreate : templeCreate) : patch).safeParse(body);
  if (!parsed.success) throw new KnowledgeGraphValidationError(parsed.error.issues.map((i) => i.message).join(", "));
  const value: any = parsed.data;
  if (creating && type === "TEMPLE" && value.provenance === "TIRTH_GUIDE") throw new KnowledgeGraphValidationError("TEMPLE provenance must be TEMPLE_TOURISM or EDITORIAL");
  if ("slug" in value && value.slug !== undefined) value.slug = normalizeDestinationSlug(value.slug);
  if ("editorial" in value) value.editorial = safeMetadata(value.editorial);
  if (creating) validateCoordinates(value);
  return value;
}

export function validateDestinationTransition(from: string, to: string) {
  if (from === to) return;
  const valid: Record<string, string[]> = { DRAFT: ["PUBLISHED", "ARCHIVED"], PUBLISHED: ["DRAFT", "ARCHIVED"], ARCHIVED: ["DRAFT"] };
  if (!valid[from]?.includes(to)) throw new KnowledgeGraphValidationError(`Cannot transition ${from} to ${to}`);
}

async function mutate(type: DestinationType, id: number | null, input: any, req: AdminRequest, action: string) {
  const table: any = tableFor(type);
  return db.transaction(async (tx: any) => {
    let row: any;
    if (id === null) {
      const [aliasOwner] = await tx.select({ id: destinationSlugAliases.id }).from(destinationSlugAliases)
        .where(and(eq(destinationSlugAliases.entityType, type), eq(destinationSlugAliases.aliasSlug, input.slug))).limit(1);
      if (aliasOwner) throw new KnowledgeGraphConflictError("Canonical slug is already owned as an alias");
      const [created] = await tx.insert(table).values({ ...input, status: "DRAFT" }).returning();
      row = created;
    } else {
      const [current] = await tx.select().from(table).where(eq(table.id, id)).limit(1);
      if (!current) return null;
      if (input.slug && input.slug !== current.slug) {
        const [canonicalOwner] = await tx.select({ id: table.id }).from(table).where(eq(table.slug, input.slug)).limit(1);
        if (canonicalOwner) throw new KnowledgeGraphConflictError("Canonical slug is already owned");
        const [aliasOwner] = await tx.select({ id: destinationSlugAliases.id }).from(destinationSlugAliases)
          .where(and(eq(destinationSlugAliases.entityType, type), eq(destinationSlugAliases.aliasSlug, input.slug))).limit(1);
        if (aliasOwner) throw new KnowledgeGraphConflictError("Canonical slug is already owned as an alias");
      }
      validateCoordinates(input, current);
      if (input.status) validateDestinationTransition(current.status, input.status);
      const oldSlug = input.slug && input.slug !== current.slug ? current.slug : null;
      const [updated] = await tx.update(table).set({ ...input, updatedAt: new Date() }).where(eq(table.id, id)).returning();
      if (oldSlug) await tx.insert(destinationSlugAliases).values({ entityType: type, entityId: id, aliasSlug: oldSlug, canonicalSlug: updated.slug });
      row = updated;
    }
    // Audit only record identity and changed field names: never editorial/body content.
    await tx.insert(adminAuditLogs).values({
      actor: `admin-user:${actor(req)}`, action, target: `${type.toLowerCase()}:${row.id}`,
      details: { fields: Object.keys(input).filter((key) => key !== "editorial"), status: row.status },
      ipAddress: ip(req),
    });
    return row;
  });
}

export function registerDestinationAdminRoutes(app: Express, adminAuthMiddleware: any) {
  const guarded = (handler: (req: AdminRequest, res: any) => Promise<any>) => async (req: AdminRequest, res: any, next: any) => {
    try { await handler(req, res); } catch (error: any) {
      if (error instanceof KnowledgeGraphValidationError || error instanceof z.ZodError) return res.status(400).json({ message: error.message });
      if (error instanceof DestinationNotFoundError) return res.status(404).json({ message: "Destination not found" });
      if (error instanceof KnowledgeGraphConflictError || error?.code === "23505") return res.status(409).json({ message: "Destination slug, source key, or alias already exists" });
      return next(error);
    }
  };
  for (const type of ["TIRTH", "TEMPLE"] as const) {
    const base = `/api/admin/${type.toLowerCase()}s`;
    app.get(base, adminAuthMiddleware, guarded(async (req, res) => {
      const rawLimit = req.query.limit;
      const limit = rawLimit === undefined ? 25 : (typeof rawLimit === "string" && /^\d+$/.test(rawLimit) ? Number(rawLimit) : NaN);
      if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) throw new KnowledgeGraphValidationError("limit must be an integer between 1 and 100");
      if (req.query.term !== undefined && typeof req.query.term !== "string") throw new KnowledgeGraphValidationError("term must be a string");
      const term = typeof req.query.term === "string" ? req.query.term.trim() : "";
      if (term.length > 120) throw new KnowledgeGraphValidationError("term is too long");
      const table: any = tableFor(type);
      const rows = await db.select().from(table).where(term ? or(ilike(table.name, `%${term}%`), ilike(table.slug, `%${term}%`)) : undefined).orderBy(asc(table.name)).limit(limit);
      res.json({ items: rows.map((row: any) => dto(type, row)), limit });
    }));
    app.get(`${base}/:id`, adminAuthMiddleware, guarded(async (req, res) => {
      const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) throw new KnowledgeGraphValidationError("id must be a positive integer");
      const table: any = tableFor(type); const [row] = await db.select().from(table).where(eq(table.id, id)).limit(1);
      if (!row) return res.status(404).json({ message: "Destination not found" });
      res.json(dto(type, row));
    }));
    app.post(base, adminAuthMiddleware, guarded(async (req, res) => {
      const row = await mutate(type, null, validateDestinationInput(type, req.body, true), req, `destination.${type.toLowerCase()}.create`);
      res.status(201).json(dto(type, row));
    }));
    app.patch(`${base}/:id`, adminAuthMiddleware, guarded(async (req, res) => {
      const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) throw new KnowledgeGraphValidationError("id must be a positive integer");
      const input = validateDestinationInput(type, req.body, false); if (!Object.keys(input).length) throw new KnowledgeGraphValidationError("Patch cannot be empty");
      const row = await mutate(type, id, input, req, `destination.${type.toLowerCase()}.update`);
      if (!row) return res.status(404).json({ message: "Destination not found" }); res.json(dto(type, row));
    }));
    app.post(`${base}/:id/aliases`, adminAuthMiddleware, guarded(async (req, res) => {
      const id = Number(req.params.id); if (!Number.isSafeInteger(id) || id < 1) throw new KnowledgeGraphValidationError("id must be a positive integer");
      const aliasSlug = normalizeDestinationSlug(req.body?.aliasSlug);
      const table: any = tableFor(type);
      await db.transaction(async (tx: any) => {
        const [row] = await tx.select().from(table).where(eq(table.id, id)).limit(1);
        if (!row) throw new DestinationNotFoundError();
        if (row.slug === aliasSlug) throw new KnowledgeGraphValidationError("Alias cannot be the canonical slug");
        const [canonicalOwner] = await tx.select({ id: table.id }).from(table).where(eq(table.slug, aliasSlug)).limit(1);
        if (canonicalOwner) throw new KnowledgeGraphConflictError("Alias is already a canonical slug");
        await tx.insert(destinationSlugAliases).values({ entityType: type, entityId: id, aliasSlug, canonicalSlug: row.slug });
        await tx.insert(adminAuditLogs).values({ actor: `admin-user:${actor(req)}`, action: `destination.${type.toLowerCase()}.alias.create`, target: `${type.toLowerCase()}:${id}`, details: { aliasSlug }, ipAddress: ip(req) });
        await advanceKnowledgeGraphGeneration(tx);
      });
      res.status(201).json({ aliasSlug });
    }));
  }
}

/** Public projection is intentionally limited to published canonical destinations. */
export async function resolvePublicDestination(type: DestinationType, slug: string) {
  const normalized = normalizeDestinationSlug(slug); const table: any = tableFor(type);
  let [row] = await db.select().from(table).where(and(eq(table.slug, normalized), eq(table.status, "PUBLISHED"))).limit(1);
  if (!row) {
    const [alias] = await db.select().from(destinationSlugAliases).where(and(eq(destinationSlugAliases.entityType, type), eq(destinationSlugAliases.aliasSlug, normalized))).limit(1);
    if (alias) [row] = await db.select().from(table).where(and(eq(table.id, alias.entityId), eq(table.status, "PUBLISHED"))).limit(1);
  }
  return row ? publicDestinationDto(type, row) : null;
}

/**
 * Compatibility boundary for the static pilgrimage sources. Callers retain a
 * legacy item unless a published canonical record explicitly owns its immutable
 * migration key. This makes LEGACY_ONLY records and all draft imports inert.
 */
export async function canonicalDestinationCompatibility<T extends { id?: string; slug?: string }>(
  type: DestinationType, legacy: T, migrationSourceKey: string,
): Promise<{ source: "LEGACY" | "CANONICAL"; item: T | ReturnType<typeof publicDestinationDto> }> {
  const table: any = tableFor(type);
  const sourceKey = consolidatedDestinationSourceKey(type, migrationSourceKey);
  const [row] = await db.select().from(table).where(and(
    eq(table.migrationSourceKey, sourceKey), eq(table.status, "PUBLISHED"),
  )).limit(1);
  return row ? { source: "CANONICAL", item: publicDestinationDto(type, row) } : { source: "LEGACY", item: legacy };
}

export function consolidatedDestinationSourceKey(type: DestinationType, migrationSourceKey: string): string {
  const suffix = migrationSourceKey.replace(/^temple-tourism:/, "");
  const consolidated = type === "TIRTH"
    ? TIRTH_SOURCE_CONSOLIDATION_MANIFEST[suffix as keyof typeof TIRTH_SOURCE_CONSOLIDATION_MANIFEST]
    : undefined;
  return consolidated ? `tirth-guide:${consolidated}` : migrationSourceKey;
}

export function registerDestinationPublicRoutes(app: Express) {
  app.get("/api/destination-compatibility/:type", async (req, res, next) => {
    try {
      const type = req.params.type.toUpperCase() as DestinationType;
      if (type !== "TIRTH" && type !== "TEMPLE") return res.status(404).json({ message: "Destination type not found" });
      const table: any = tableFor(type);
      const rows = await db.select().from(table).where(eq(table.status, "PUBLISHED")).orderBy(asc(table.id)).limit(100);
      // Source key is an immutable non-editorial matching token, never provenance.
      res.json({ items: expandCompatibilityItems(type, rows) });
    } catch (error) { next(error); }
  });
  for (const type of ["TIRTH", "TEMPLE"] as const) {
    const base = `/api/${type.toLowerCase()}s`;
    app.get(base, async (req, res, next) => {
      try {
        const rawLimit = req.query.limit;
        const limit = rawLimit === undefined ? 25 : (typeof rawLimit === "string" && /^\d+$/.test(rawLimit) ? Number(rawLimit) : NaN);
        if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) return res.status(400).json({ message: "limit must be an integer between 1 and 100" });
        const table: any = tableFor(type);
        const rows = await db.select().from(table).where(eq(table.status, "PUBLISHED")).orderBy(asc(table.name)).limit(limit);
        res.json({ items: rows.map((row: any) => publicDestinationDto(type, row)), limit });
      } catch (error) { next(error); }
    });
    app.get(`${base}/:slug`, async (req, res, next) => {
      try {
        const result = await resolvePublicDestination(type, req.params.slug);
        if (!result) return res.status(404).json({ message: "Destination not found" });
        // Alias is intentionally resolved server-side; callers receive only the
        // canonical safe DTO and can use slug to canonicalize their URL.
        res.json(result);
      } catch (error) {
        if (error instanceof KnowledgeGraphValidationError) return res.status(404).json({ message: "Destination not found" });
        next(error);
      }
    });
  }
}

/** Expands only reviewed, explicit consolidation aliases; never fuzzy-matches names/slugs. */
export function expandCompatibilityItems(type: DestinationType, rows: readonly any[]) {
  const byKey = new Map<string, { sourceKey: string; destination: ReturnType<typeof publicDestinationDto> }>();
  for (const row of [...rows].sort((a, b) => String(a.migrationSourceKey).localeCompare(String(b.migrationSourceKey)))) {
    const destination = publicDestinationDto(type, row);
    const keys = [row.migrationSourceKey];
    if (type === "TIRTH" && typeof row.migrationSourceKey === "string" && row.migrationSourceKey.startsWith("tirth-guide:")) {
      const guideKey = row.migrationSourceKey.slice("tirth-guide:".length);
      for (const [secondary, guide] of Object.entries(TIRTH_SOURCE_CONSOLIDATION_MANIFEST)) {
        if (guide === guideKey) keys.push(`temple-tourism:${secondary}`);
      }
    }
    for (const sourceKey of keys.sort()) {
      const existing = byKey.get(sourceKey);
      if (existing) throw new KnowledgeGraphConflictError(`Published destinations ambiguously own source key ${sourceKey}`);
      byKey.set(sourceKey, { sourceKey, destination });
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.sourceKey.localeCompare(b.sourceKey));
}