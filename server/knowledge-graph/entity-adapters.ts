import { asc, eq, ilike, or } from "drizzle-orm";
import {
  blogPosts, indianCities, indianStates, masterServices, pandits, productReviews,
  products, pujaTypes, temples, tirths, tirthYatraTours,
} from "@shared/schema";
import type { AdminEntityDto, EntityAdapter, EntityRef, EntitySearch, EntityType, LocationKind } from "./types";
import { UnsupportedEntitySourceError } from "./types";
import { boundedSearch, positiveEntityId } from "./validation";

// This deliberately describes only the small Drizzle surface adapters use,
// keeping adapters independently testable and preventing reliance on storage
// methods which return full, private source rows.
export interface KnowledgeGraphDatabase {
  select(selection: Record<string, unknown>): any;
}

type SourceConfig = {
  type: Exclude<EntityType, "LOCATION">;
  table: any;
  selection: Record<string, unknown>;
  idColumn: any;
  searchColumns: any[];
  toDto: (row: any) => AdminEntityDto;
};

function tableAdapter(database: KnowledgeGraphDatabase, config: SourceConfig): EntityAdapter {
  const base = () => database.select(config.selection).from(config.table);
  return {
    type: config.type,
    async get(ref) {
      positiveEntityId(ref.id);
      const [row] = await base().where(eq(config.idColumn, ref.id)).limit(1);
      return row ? config.toDto(row) : null;
    },
    async exists(ref) {
      positiveEntityId(ref.id);
      const [row] = await database.select({ id: config.idColumn }).from(config.table)
        .where(eq(config.idColumn, ref.id)).limit(1);
      return Boolean(row);
    },
    async search(input) {
      const { term, limit, offset } = boundedSearch(input);
      const query = base()
        .where(term ? or(...config.searchColumns.map((column) => ilike(column, `%${term}%`))) : undefined)
        .orderBy(asc(config.idColumn))
        .limit(limit)
        .offset(offset);
      return (await query).map(config.toDto);
    },
  };
}

function iso(value: Date | string | null | undefined): string | null {
  if (!value) return null;
  return value instanceof Date ? value.toISOString() : new Date(value).toISOString();
}

export function locationDto(row: any, kind: LocationKind): AdminEntityDto {
  const stateName = kind === "CITY" ? row.stateName : undefined;
  return {
    type: "LOCATION",
    id: row.id,
    discriminator: kind,
    name: stateName ? `${row.name}, ${stateName}` : row.name,
    status: row.isActive ? "ACTIVE" : "INACTIVE",
    url: kind === "CITY" ? `/pandit/city/${row.slug}` : null,
    updatedAt: iso(row.updatedAt),
    summary: kind === "CITY"
      ? { kind, state: stateName, slug: row.slug }
      : { kind, code: row.code, unionTerritory: row.isUnionTerritory },
  };
}

/** The only projection of source-table rows that may leave graph internals. */
export function adminEntityDto(type: Exclude<EntityType, "LOCATION">, r: any): AdminEntityDto {
  switch (type) {
    case "PUJA": return { type, id: r.id, name: r.name, status: r.isPublished ? "PUBLISHED" : "DRAFT", url: `/puja/${r.slug}`, updatedAt: iso(r.updatedAt), summary: { category: r.category } };
    case "PANDIT": return { type, id: r.id, name: r.name, status: r.availability === "unavailable" ? "INACTIVE" : (r.verified ? "VERIFIED" : "UNVERIFIED"), url: r.slug ? `/pandit/${r.slug}` : null, updatedAt: iso(r.createdAt), summary: { city: r.city, specialization: r.specialization, verified: r.verified } };
    case "PRODUCT": return { type, id: r.id, name: r.name, status: r.stock > 0 ? "ACTIVE" : "OUT_OF_STOCK", url: r.slug ? `/product/${r.slug}` : null, updatedAt: null, summary: { category: r.category, productType: r.productType, inStock: r.stock > 0 } };
    case "ARTICLE": return { type, id: r.id, name: r.title, status: String(r.status).toUpperCase(), url: `/blog/${r.slug}`, updatedAt: iso(r.publishedAt || r.createdAt), summary: { category: r.category } };
    case "SERVICE": return { type, id: r.id, name: r.name, status: r.isActive ? "ACTIVE" : "INACTIVE", url: null, updatedAt: iso(r.updatedAt), summary: { category: r.category, serviceType: r.serviceType } };
    case "REVIEW": return { type, id: r.id, name: r.title, status: String(r.status).toUpperCase(), url: null, updatedAt: iso(r.createdAt), summary: { rating: r.rating, productId: r.productId } };
    case "YATRA": return { type, id: r.id, name: r.name, status: r.isActive ? "ACTIVE" : "INACTIVE", url: `/tirth-yatra/${r.slug}`, updatedAt: iso(r.createdAt), summary: { route: r.route, durationDays: r.durationDays } };
    case "TIRTH": return { type, id: r.id, name: r.name, status: r.status, url: `/tirth/${r.slug}`, updatedAt: iso(r.updatedAt), summary: { slug: r.slug, state: r.state || null, provenance: r.provenance } };
    case "TEMPLE": return { type, id: r.id, name: r.name, status: r.status, url: `/temple/${r.slug}`, updatedAt: iso(r.updatedAt), summary: { slug: r.slug, state: r.state || null, provenance: r.provenance } };
  }
}

function locationAdapter(database: KnowledgeGraphDatabase): EntityAdapter {
  const getByKind = async (id: number, kind: LocationKind): Promise<AdminEntityDto | null> => {
    if (kind === "STATE") {
      const [row] = await database.select({
        id: indianStates.id, name: indianStates.name, code: indianStates.code,
        isUnionTerritory: indianStates.isUnionTerritory, isActive: indianStates.isActive,
        updatedAt: indianStates.updatedAt,
      }).from(indianStates).where(eq(indianStates.id, id)).limit(1);
      return row ? locationDto(row, "STATE") : null;
    }
    const [row] = await database.select({
      id: indianCities.id, name: indianCities.name, slug: indianCities.slug,
      isActive: indianCities.isActive, updatedAt: indianCities.updatedAt,
      stateName: indianStates.name,
    }).from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
      .where(eq(indianCities.id, id)).limit(1);
    return row ? locationDto(row, "CITY") : null;
  };
  return {
    type: "LOCATION",
    async get(ref) {
      positiveEntityId(ref.id);
      if (!ref.discriminator) throw new Error("LOCATION requires an explicit discriminator");
      return getByKind(ref.id, ref.discriminator);
    },
    async exists(ref) { return Boolean(await this.get(ref)); },
    async search(input) {
      const { term, limit, offset } = boundedSearch(input);
      const kinds: LocationKind[] = input.discriminator ? [input.discriminator] : ["STATE", "CITY"];
      // Both source streams are independently ordered.  Fetching the bounded
      // requested window from each before merging prevents CITY/STATE pages
      // after 100 from being silently empty.
      const fetchLimit = limit + offset;
      const groups = await Promise.all(kinds.map(async (kind) => {
        if (kind === "STATE") {
          const rows = await database.select({
            id: indianStates.id, name: indianStates.name, code: indianStates.code,
            isUnionTerritory: indianStates.isUnionTerritory, isActive: indianStates.isActive,
            updatedAt: indianStates.updatedAt,
          }).from(indianStates)
            .where(term ? or(ilike(indianStates.name, `%${term}%`), ilike(indianStates.code, `%${term}%`)) : undefined)
            .orderBy(asc(indianStates.name)).limit(fetchLimit);
          return rows.map((row: any) => locationDto(row, "STATE"));
        }
        const rows = await database.select({
          id: indianCities.id, name: indianCities.name, slug: indianCities.slug,
          isActive: indianCities.isActive, updatedAt: indianCities.updatedAt,
          stateName: indianStates.name,
        }).from(indianCities).innerJoin(indianStates, eq(indianCities.stateId, indianStates.id))
          .where(term ? or(ilike(indianCities.name, `%${term}%`), ilike(indianCities.slug, `%${term}%`), ilike(indianStates.name, `%${term}%`)) : undefined)
          .orderBy(asc(indianCities.name)).limit(fetchLimit);
        return rows.map((row: any) => locationDto(row, "CITY"));
      }));
      return groups.flat().sort((a, b) => a.name.localeCompare(b.name)).slice(offset, offset + limit);
    },
  };
}

export function createEntityAdapters(database: KnowledgeGraphDatabase): ReadonlyMap<EntityType, EntityAdapter> {
  const adapters: EntityAdapter[] = [
    tableAdapter(database, {
      type: "PUJA", table: pujaTypes, idColumn: pujaTypes.id,
      selection: { id: pujaTypes.id, name: pujaTypes.name, slug: pujaTypes.slug, category: pujaTypes.category, isPublished: pujaTypes.isPublished, updatedAt: pujaTypes.updatedAt },
      searchColumns: [pujaTypes.name, pujaTypes.slug],
      toDto: (r) => adminEntityDto("PUJA", r),
    }),
    tableAdapter(database, {
      type: "PANDIT", table: pandits, idColumn: pandits.id,
      selection: { id: pandits.id, name: pandits.name, slug: pandits.slug, city: pandits.city, specialization: pandits.specialization, verified: pandits.verified, availability: pandits.availability, createdAt: pandits.createdAt },
      searchColumns: [pandits.name, pandits.slug, pandits.city],
      toDto: (r) => adminEntityDto("PANDIT", r),
    }),
    locationAdapter(database),
    tableAdapter(database, {
      type: "TIRTH", table: tirths, idColumn: tirths.id,
      selection: { id: tirths.id, name: tirths.name, slug: tirths.slug, status: tirths.status, state: tirths.state, provenance: tirths.provenance, updatedAt: tirths.updatedAt },
      searchColumns: [tirths.name, tirths.slug, tirths.state],
      toDto: (r) => adminEntityDto("TIRTH", r),
    }),
    tableAdapter(database, {
      type: "TEMPLE", table: temples, idColumn: temples.id,
      selection: { id: temples.id, name: temples.name, slug: temples.slug, status: temples.status, state: temples.state, provenance: temples.provenance, updatedAt: temples.updatedAt },
      searchColumns: [temples.name, temples.slug, temples.state],
      toDto: (r) => adminEntityDto("TEMPLE", r),
    }),
    tableAdapter(database, {
      type: "PRODUCT", table: products, idColumn: products.id,
      selection: { id: products.id, name: products.name, slug: products.slug, category: products.category, productType: products.productType, stock: products.stock },
      searchColumns: [products.name, products.slug],
      toDto: (r) => adminEntityDto("PRODUCT", r),
    }),
    tableAdapter(database, {
      type: "ARTICLE", table: blogPosts, idColumn: blogPosts.id,
      selection: { id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, category: blogPosts.category, status: blogPosts.status, createdAt: blogPosts.createdAt, publishedAt: blogPosts.publishedAt },
      searchColumns: [blogPosts.title, blogPosts.slug],
      toDto: (r) => adminEntityDto("ARTICLE", r),
    }),
    tableAdapter(database, {
      type: "SERVICE", table: masterServices, idColumn: masterServices.id,
      selection: { id: masterServices.id, name: masterServices.name, slug: masterServices.slug, category: masterServices.category, serviceType: masterServices.serviceType, isActive: masterServices.isActive, updatedAt: masterServices.updatedAt },
      searchColumns: [masterServices.name, masterServices.slug],
      toDto: (r) => adminEntityDto("SERVICE", r),
    }),
    tableAdapter(database, {
      type: "REVIEW", table: productReviews, idColumn: productReviews.id,
      selection: { id: productReviews.id, title: productReviews.title, rating: productReviews.rating, status: productReviews.status, productId: productReviews.productId, createdAt: productReviews.createdAt },
      searchColumns: [productReviews.title],
      toDto: (r) => adminEntityDto("REVIEW", r),
    }),
    tableAdapter(database, {
      type: "YATRA", table: tirthYatraTours, idColumn: tirthYatraTours.id,
      selection: { id: tirthYatraTours.id, name: tirthYatraTours.name, slug: tirthYatraTours.slug, route: tirthYatraTours.route, durationDays: tirthYatraTours.durationDays, isActive: tirthYatraTours.isActive, createdAt: tirthYatraTours.createdAt },
      searchColumns: [tirthYatraTours.name, tirthYatraTours.slug, tirthYatraTours.route],
      toDto: (r) => adminEntityDto("YATRA", r),
    }),
  ];
  return new Map(adapters.map((adapter) => [adapter.type, adapter]));
}

export async function resolveEntity(adapter: EntityAdapter, ref: EntityRef): Promise<AdminEntityDto | null> {
  return adapter.get(ref);
}