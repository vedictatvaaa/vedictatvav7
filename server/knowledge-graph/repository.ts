import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { adminAuditLogs, blogPosts, indianCities, indianStates, knowledgeGraphQualityRules, knowledgeGraphRelationships, masterServices, pandits, productReviews, products, pujaTypes, temples, tirths, tirthYatraTours } from "@shared/schema";
import { adminEntityDto, locationDto } from "./entity-adapters";
import type { AdminEntityDto, EntityType, LocationKind } from "./types";

export type GraphAudit = { actor: string; action: string; details: object; ipAddress: string | null };

/** Persistence boundary for graph rows.  It intentionally has no source-table writes. */
export class KnowledgeGraphRepository {
  constructor(private readonly database: any) {}

  async relationshipsFor(ref: { type: string; id: number; discriminator?: string }) {
    const source = and(eq(knowledgeGraphRelationships.sourceEntityType, ref.type), eq(knowledgeGraphRelationships.sourceEntityId, ref.id),
      ref.discriminator ? eq(knowledgeGraphRelationships.sourceDiscriminator, ref.discriminator) : sql`${knowledgeGraphRelationships.sourceDiscriminator} IS NULL`);
    const target = and(eq(knowledgeGraphRelationships.targetEntityType, ref.type), eq(knowledgeGraphRelationships.targetEntityId, ref.id),
      ref.discriminator ? eq(knowledgeGraphRelationships.targetDiscriminator, ref.discriminator) : sql`${knowledgeGraphRelationships.targetDiscriminator} IS NULL`);
    return this.database.select().from(knowledgeGraphRelationships).where(or(source, target)).orderBy(knowledgeGraphRelationships.displayOrder);
  }
  async allRelationships() { return this.database.select().from(knowledgeGraphRelationships).orderBy(desc(knowledgeGraphRelationships.updatedAt)); }
  /**
   * Counts and fetches orphan candidates in the database.  In particular, this
   * must not be implemented by loading relationship rows into the service:
   * the discriminator is part of the correlated identity comparison.
   */
  async orphans(type: EntityType, discriminator: LocationKind | undefined, term: string, page: number, limit: number): Promise<{ total: number; items: AdminEntityDto[] }> {
    const offset = (page - 1) * limit;
    const orphan = (id: any, kind: LocationKind | undefined) => sql`NOT EXISTS (
      SELECT 1 FROM ${knowledgeGraphRelationships}
      WHERE ${knowledgeGraphRelationships.status} = 'ACTIVE' AND (
        (${knowledgeGraphRelationships.sourceEntityType} = ${type} AND ${knowledgeGraphRelationships.sourceEntityId} = ${id}
          AND ${kind ? knowledgeGraphRelationships.sourceDiscriminator : sql`${knowledgeGraphRelationships.sourceDiscriminator} IS NULL`} ${kind ? sql`= ${kind}` : sql``})
        OR
        (${knowledgeGraphRelationships.targetEntityType} = ${type} AND ${knowledgeGraphRelationships.targetEntityId} = ${id}
          AND ${kind ? knowledgeGraphRelationships.targetDiscriminator : sql`${knowledgeGraphRelationships.targetDiscriminator} IS NULL`} ${kind ? sql`= ${kind}` : sql``})
      )
    )`;
    const query = async (table: any, selection: any, id: any, name: any, search: any[], map: (row: any) => AdminEntityDto, kind?: LocationKind, join?: (q: any) => any) => {
      const filters = [orphan(id, kind), term ? or(...search.map((column) => ilike(column, `%${term}%`))) : undefined].filter(Boolean);
      const where = and(...filters);
      const from = (selectionArg: any) => {
        const q = this.database.select(selectionArg).from(table);
        return join ? join(q) : q;
      };
      const [countRows, rows] = await Promise.all([
        from({ total: sql<number>`count(*)` }).where(where),
        from(selection).where(where).orderBy(asc(name), asc(id)).limit(limit).offset(offset),
      ]);
      return { total: Number(countRows[0]?.total || 0), items: rows.map(map) };
    };
    switch (type) {
      case "PUJA": return query(pujaTypes, { id: pujaTypes.id, name: pujaTypes.name, slug: pujaTypes.slug, category: pujaTypes.category, isPublished: pujaTypes.isPublished, updatedAt: pujaTypes.updatedAt }, pujaTypes.id, pujaTypes.name, [pujaTypes.name, pujaTypes.slug], (r) => adminEntityDto("PUJA", r));
      case "PANDIT": return query(pandits, { id: pandits.id, name: pandits.name, slug: pandits.slug, city: pandits.city, specialization: pandits.specialization, verified: pandits.verified, availability: pandits.availability, createdAt: pandits.createdAt }, pandits.id, pandits.name, [pandits.name, pandits.slug, pandits.city], (r) => adminEntityDto("PANDIT", r));
      case "PRODUCT": return query(products, { id: products.id, name: products.name, slug: products.slug, category: products.category, productType: products.productType, stock: products.stock }, products.id, products.name, [products.name, products.slug], (r) => adminEntityDto("PRODUCT", r));
      case "ARTICLE": return query(blogPosts, { id: blogPosts.id, title: blogPosts.title, slug: blogPosts.slug, category: blogPosts.category, status: blogPosts.status, createdAt: blogPosts.createdAt, publishedAt: blogPosts.publishedAt }, blogPosts.id, blogPosts.title, [blogPosts.title, blogPosts.slug], (r) => adminEntityDto("ARTICLE", r));
      case "SERVICE": return query(masterServices, { id: masterServices.id, name: masterServices.name, slug: masterServices.slug, category: masterServices.category, serviceType: masterServices.serviceType, isActive: masterServices.isActive, updatedAt: masterServices.updatedAt }, masterServices.id, masterServices.name, [masterServices.name, masterServices.slug], (r) => adminEntityDto("SERVICE", r));
      case "REVIEW": return query(productReviews, { id: productReviews.id, title: productReviews.title, rating: productReviews.rating, status: productReviews.status, productId: productReviews.productId, createdAt: productReviews.createdAt }, productReviews.id, productReviews.title, [productReviews.title], (r) => adminEntityDto("REVIEW", r));
      case "YATRA": return query(tirthYatraTours, { id: tirthYatraTours.id, name: tirthYatraTours.name, slug: tirthYatraTours.slug, route: tirthYatraTours.route, durationDays: tirthYatraTours.durationDays, isActive: tirthYatraTours.isActive, createdAt: tirthYatraTours.createdAt }, tirthYatraTours.id, tirthYatraTours.name, [tirthYatraTours.name, tirthYatraTours.slug, tirthYatraTours.route], (r) => adminEntityDto("YATRA", r));
      case "TIRTH": return query(tirths, { id: tirths.id, name: tirths.name, slug: tirths.slug, status: tirths.status, state: tirths.state, provenance: tirths.provenance, updatedAt: tirths.updatedAt }, tirths.id, tirths.name, [tirths.name, tirths.slug, tirths.state], (r) => adminEntityDto("TIRTH", r));
      case "TEMPLE": return query(temples, { id: temples.id, name: temples.name, slug: temples.slug, status: temples.status, state: temples.state, provenance: temples.provenance, updatedAt: temples.updatedAt }, temples.id, temples.name, [temples.name, temples.slug, temples.state], (r) => adminEntityDto("TEMPLE", r));
      case "LOCATION": {
        if (!discriminator) {
          // A merged LOCATION window needs only offset + limit rows from each
          // independently sorted source; no source or edge table is enumerated.
          const requested = offset + limit;
          const [states, cities] = await Promise.all([
            this.orphans("LOCATION", "STATE", term, 1, requested),
            this.orphans("LOCATION", "CITY", term, 1, requested),
          ]);
          return {
            total: states.total + cities.total,
            items: [...states.items, ...cities.items]
              .sort((a, b) => a.name.localeCompare(b.name) || a.id - b.id)
              .slice(offset, offset + limit),
          };
        }
        if (discriminator === "STATE") return query(indianStates, { id: indianStates.id, name: indianStates.name, code: indianStates.code, isUnionTerritory: indianStates.isUnionTerritory, isActive: indianStates.isActive, updatedAt: indianStates.updatedAt }, indianStates.id, indianStates.name, [indianStates.name, indianStates.code], (r) => locationDto(r, "STATE"), "STATE");
        return query(indianCities, { id: indianCities.id, name: indianCities.name, slug: indianCities.slug, isActive: indianCities.isActive, updatedAt: indianCities.updatedAt, stateName: indianStates.name }, indianCities.id, indianCities.name, [indianCities.name, indianCities.slug, indianStates.name], (r) => locationDto(r, "CITY"), "CITY", (q) => q.innerJoin(indianStates, eq(indianCities.stateId, indianStates.id)));
      }
      default: throw new Error("Entity source is unsupported");
    }
  }
  async getRelationship(id: number) {
    const [row] = await this.database.select().from(knowledgeGraphRelationships).where(eq(knowledgeGraphRelationships.id, id)).limit(1);
    return row || null;
  }
  async exactRelationship(input: any, excludeId?: number) {
    const rows = await this.database.select({ id: knowledgeGraphRelationships.id }).from(knowledgeGraphRelationships).where(and(
      eq(knowledgeGraphRelationships.sourceEntityType, input.source.type), eq(knowledgeGraphRelationships.sourceEntityId, input.source.id),
      input.source.discriminator ? eq(knowledgeGraphRelationships.sourceDiscriminator, input.source.discriminator) : sql`${knowledgeGraphRelationships.sourceDiscriminator} IS NULL`,
      eq(knowledgeGraphRelationships.relationshipType, input.relationshipType),
      eq(knowledgeGraphRelationships.targetEntityType, input.target.type), eq(knowledgeGraphRelationships.targetEntityId, input.target.id),
      input.target.discriminator ? eq(knowledgeGraphRelationships.targetDiscriminator, input.target.discriminator) : sql`${knowledgeGraphRelationships.targetDiscriminator} IS NULL`,
    ));
    return rows.some((row: any) => row.id !== excludeId);
  }
  async createRelationship(input: any) {
    const [row] = await this.database.insert(knowledgeGraphRelationships).values(input).returning();
    return row;
  }
  async patchRelationship(id: number, patch: any) {
    const [row] = await this.database.update(knowledgeGraphRelationships).set({ ...patch, updatedAt: new Date() })
      .where(eq(knowledgeGraphRelationships.id, id)).returning();
    return row || null;
  }
  async deleteRelationship(id: number) {
    const rows = await this.database.delete(knowledgeGraphRelationships).where(eq(knowledgeGraphRelationships.id, id)).returning();
    return rows[0] || null;
  }
  async listRules() { return this.database.select().from(knowledgeGraphQualityRules).orderBy(knowledgeGraphQualityRules.id); }
  async getRule(id: number) {
    const [row] = await this.database.select().from(knowledgeGraphQualityRules).where(eq(knowledgeGraphQualityRules.id, id)).limit(1);
    return row || null;
  }
  async createRule(input: any) { const [row] = await this.database.insert(knowledgeGraphQualityRules).values(input).returning(); return row; }
  async patchRule(id: number, patch: any) {
    const [row] = await this.database.update(knowledgeGraphQualityRules).set({ ...patch, updatedAt: new Date() })
      .where(eq(knowledgeGraphQualityRules.id, id)).returning();
    return row || null;
  }
  async deleteRule(id: number) {
    const rows = await this.database.delete(knowledgeGraphQualityRules).where(eq(knowledgeGraphQualityRules.id, id)).returning();
    return rows[0] || null;
  }
  private async writeAudit(tx: any, audit: GraphAudit, target: string) {
    await tx.insert(adminAuditLogs).values({ ...audit, target });
  }
  async createRelationshipWithAudit(input: any, audit: GraphAudit) {
    return this.database.transaction(async (tx: any) => {
      const [row] = await tx.insert(knowledgeGraphRelationships).values(input).returning();
      await this.writeAudit(tx, audit, `relationship:${row.id}`); return row;
    });
  }
  async patchRelationshipWithAudit(id: number, patch: any, audit: GraphAudit) {
    return this.database.transaction(async (tx: any) => {
      const [row] = await tx.update(knowledgeGraphRelationships).set({ ...patch, updatedAt: new Date() }).where(eq(knowledgeGraphRelationships.id, id)).returning();
      if (!row) return null;
      await this.writeAudit(tx, audit, `relationship:${row.id}`); return row;
    });
  }
  async deleteRelationshipWithAudit(id: number, audit: GraphAudit) {
    return this.database.transaction(async (tx: any) => {
      const rows = await tx.delete(knowledgeGraphRelationships).where(eq(knowledgeGraphRelationships.id, id)).returning();
      if (!rows[0]) return null;
      await this.writeAudit(tx, audit, `relationship:${rows[0].id}`); return rows[0];
    });
  }
  async createRuleWithAudit(input: any, audit: GraphAudit) {
    return this.database.transaction(async (tx: any) => {
      const [row] = await tx.insert(knowledgeGraphQualityRules).values(input).returning();
      await this.writeAudit(tx, audit, `quality-rule:${row.id}`); return row;
    });
  }
  async patchRuleWithAudit(id: number, patch: any, audit: GraphAudit) {
    return this.database.transaction(async (tx: any) => {
      const [row] = await tx.update(knowledgeGraphQualityRules).set({ ...patch, updatedAt: new Date() }).where(eq(knowledgeGraphQualityRules.id, id)).returning();
      if (!row) return null;
      await this.writeAudit(tx, audit, `quality-rule:${row.id}`); return row;
    });
  }
  async deleteRuleWithAudit(id: number, audit: GraphAudit) {
    return this.database.transaction(async (tx: any) => {
      const rows = await tx.delete(knowledgeGraphQualityRules).where(eq(knowledgeGraphQualityRules.id, id)).returning();
      if (!rows[0]) return null;
      await this.writeAudit(tx, audit, `quality-rule:${rows[0].id}`); return rows[0];
    });
  }
}