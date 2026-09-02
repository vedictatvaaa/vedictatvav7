/**
 * Phase 2 destination backfill.
 *
 * Default mode is a no-write deterministic preflight.  `--apply` performs all
 * writes in one transaction. Operational rollback is deliberately non-
 * destructive: disable the public gate, retain route aliases, then investigate
 * records. Never auto-delete canonical rows, particularly rows referenced by
 * knowledge_graph_relationships.
 */
import { createHash } from "node:crypto";
import { eq, sql } from "drizzle-orm";
import { CANONICAL_DESTINATION_IMPORT_ROWS, canonicalTirthSourceKey } from "../shared/destination-import-data";
import { TIRTH_SOURCE_CONSOLIDATION_MANIFEST } from "../shared/destination-consolidation-manifest";
import {
  DESTINATION_SOURCE_COUNTS, TEMPLE_TOURISM_CLASSIFICATION_MANIFEST, YATRA_TO_TIRTH_MAPPING_MANIFEST,
} from "../server/knowledge-graph/destination-source-manifests";
import { TEMPLE_TOURISM_SOURCE_ROWS, TIRTH_GUIDE_SOURCE_ROWS } from "../shared/pilgrimage-source-contract";

const apply = process.argv.includes("--apply");
const actorArg = process.argv.find((arg) => arg.startsWith("--actor-admin-id="));
const actorAdminId = actorArg ? Number(actorArg.slice("--actor-admin-id=".length)) : undefined;

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Canonical destination preflight failed: ${message}`);
}
function digest(rows: readonly unknown[]) {
  return createHash("sha256").update(JSON.stringify(rows)).digest("hex");
}
function preflight() {
  const sourceKeys = new Set<string>();
  const slugsByType = new Map<string, Set<string>>();
  const rawTempleKeys = new Set(TEMPLE_TOURISM_SOURCE_ROWS.map(([key]) => key));
  assert(Object.keys(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST).length === rawTempleKeys.size, "classification manifest count drift");
  for (const key of rawTempleKeys) assert(
    ["TIRTH", "TEMPLE", "LEGACY_ONLY"].includes(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[key]),
    `missing or invalid classification for ${key}`,
  );
  for (const key of Object.keys(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST)) assert(rawTempleKeys.has(key), `unknown classification key ${key}`);
  for (const [secondaryKey, guideKey] of Object.entries(TIRTH_SOURCE_CONSOLIDATION_MANIFEST)) {
    assert(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST[secondaryKey] === "TIRTH", `consolidation source is not a TIRTH: ${secondaryKey}`);
    assert(TIRTH_GUIDE_SOURCE_ROWS.some(([key]) => key === guideKey), `consolidation target guide missing: ${guideKey}`);
  }
  for (const row of CANONICAL_DESTINATION_IMPORT_ROWS) {
    assert(!sourceKeys.has(row.sourceKey), `duplicate source key ${row.sourceKey}`);
    sourceKeys.add(row.sourceKey);
    const type = row.classification;
    const slugs = slugsByType.get(type) ?? new Set<string>();
    assert(!slugs.has(row.preferredSlug), `duplicate ${type} slug ${row.preferredSlug}`);
    slugs.add(row.preferredSlug); slugsByType.set(type, slugs);
  }
  const aliases = new Set<string>();
  for (const row of CANONICAL_DESTINATION_IMPORT_ROWS) {
    for (const alias of row.aliases) {
      const key = `${row.classification}:${alias}`;
      assert(alias !== row.preferredSlug, `self alias ${key}`);
      assert(!aliases.has(key), `duplicate alias ${key}`);
      assert(!(slugsByType.get(row.classification)?.has(alias)), `alias conflicts with canonical slug ${key}`);
      aliases.add(key);
    }
  }
  const classifiedTempleCount = [...Object.values(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST)].filter((v) => v === "TEMPLE").length;
  const classifiedTirthCount = [...Object.values(TEMPLE_TOURISM_CLASSIFICATION_MANIFEST)].filter((v) => v === "TIRTH").length;
  assert(classifiedTempleCount === DESTINATION_SOURCE_COUNTS.temple, "temple count manifest drift");
  assert(classifiedTirthCount === DESTINATION_SOURCE_COUNTS.tirth, "tirth count manifest drift");
  assert(TIRTH_GUIDE_SOURCE_ROWS.length === DESTINATION_SOURCE_COUNTS.tirthGuides, "tirth guide source drift");
  assert(TEMPLE_TOURISM_SOURCE_ROWS.length === DESTINATION_SOURCE_COUNTS.templeTourism, "temple tourism source drift");
  for (const mapping of YATRA_TO_TIRTH_MAPPING_MANIFEST) {
    assert(!mapping.tirthSourceKey.startsWith("tirth-guide:"), "mapping keys must be raw reviewed source keys");
    assert(rawTempleKeys.has(mapping.tirthSourceKey) || TIRTH_GUIDE_SOURCE_ROWS.some(([key]) => key === mapping.tirthSourceKey), `mapping Tirth source missing: ${mapping.tirthSourceKey}`);
    assert(CANONICAL_DESTINATION_IMPORT_ROWS.some((row) => row.classification === "TIRTH" && row.sourceKey === canonicalTirthSourceKey(mapping.tirthSourceKey)),
    `mapping Tirth source is not an imported TIRTH: ${mapping.tirthSourceKey}`);
  }
  return {
    tirths: CANONICAL_DESTINATION_IMPORT_ROWS.filter((row) => row.classification === "TIRTH"),
    temples: CANONICAL_DESTINATION_IMPORT_ROWS.filter((row) => row.classification === "TEMPLE"),
    aliases: CANONICAL_DESTINATION_IMPORT_ROWS.flatMap((row) => row.aliases.map((aliasSlug) => ({ entityType: row.classification, sourceKey: row.sourceKey, aliasSlug, canonicalSlug: row.preferredSlug }))),
    hash: digest(CANONICAL_DESTINATION_IMPORT_ROWS.map(({ sourceKey, preferredSlug, classification, name, editorial, aliases }) => [sourceKey, preferredSlug, classification, name, editorial, aliases])),
  };
}

async function main() {
  const verified = preflight();
  if (!apply) {
    console.log(JSON.stringify({ mode: "preflight", tirthCount: verified.tirths.length, templeCount: verified.temples.length, aliasCount: verified.aliases.length, contentHash: verified.hash }));
    return;
  }
  assert(Number.isSafeInteger(actorAdminId) && actorAdminId! > 0, "--apply requires --actor-admin-id=<positive integer>");
  // Keep no-write preflight usable without DATABASE_URL or a database driver.
  const { db } = await import("../server/db");
  const { destinationSlugAliases, knowledgeGraphRelationships, temples, tirths, tirthYatraTours, users } = await import("../shared/schema");
  await db.transaction(async (tx) => {
    const actor = await tx.select({ id: users.id, role: users.role }).from(users).where(eq(users.id, actorAdminId!)).limit(1);
    assert(actor.length === 1 && actor[0].role === "admin", `admin ${actorAdminId} does not exist or is not an admin`);
    for (const row of verified.tirths) {
      const payload = {
        name: row.name, nameHindi: row.nameHindi, provenance: row.provenance, region: row.region,
        state: row.state, deity: row.deity, category: row.category, shortDescription: row.shortDescription,
        description: row.description, latitude: row.latitude, longitude: row.longitude, editorial: row.editorial,
      };
      await tx.insert(tirths).values({ migrationSourceKey: row.sourceKey, slug: row.preferredSlug, ...payload, status: "DRAFT" })
        .onConflictDoUpdate({ target: tirths.migrationSourceKey, set: { ...payload, slug: row.preferredSlug, updatedAt: sql`now()` } });
    }
    for (const row of verified.temples) {
      const payload = {
        name: row.name, nameHindi: row.nameHindi, provenance: "TEMPLE_TOURISM" as const, location: row.location,
        state: row.state, deity: row.deity, category: row.category, shortDescription: row.shortDescription,
        description: row.description, latitude: row.latitude, longitude: row.longitude, editorial: row.editorial,
      };
      await tx.insert(temples).values({ migrationSourceKey: row.sourceKey, slug: row.preferredSlug, ...payload, status: "DRAFT" })
        .onConflictDoUpdate({ target: temples.migrationSourceKey, set: { ...payload, slug: row.preferredSlug, updatedAt: sql`now()` } });
    }
    for (const alias of verified.aliases) {
      const table = alias.entityType === "TIRTH" ? tirths : temples;
      const entity = await tx.select({ id: table.id }).from(table).where(eq(table.migrationSourceKey, alias.sourceKey)).limit(1);
      assert(entity.length === 1, `alias endpoint missing: ${alias.sourceKey}`);
      const existingAlias = await tx.select({
        entityId: destinationSlugAliases.entityId, canonicalSlug: destinationSlugAliases.canonicalSlug,
      }).from(destinationSlugAliases).where(sql`${destinationSlugAliases.entityType} = ${alias.entityType} AND ${destinationSlugAliases.aliasSlug} = ${alias.aliasSlug}`).limit(1);
      if (existingAlias.length) {
        assert(existingAlias[0].entityId === entity[0].id && existingAlias[0].canonicalSlug === alias.canonicalSlug,
          `existing alias has a different binding: ${alias.entityType}:${alias.aliasSlug}`);
      } else {
        await tx.insert(destinationSlugAliases).values({ entityType: alias.entityType, entityId: entity[0].id, aliasSlug: alias.aliasSlug, canonicalSlug: alias.canonicalSlug });
      }
    }
    for (const mapping of YATRA_TO_TIRTH_MAPPING_MANIFEST) {
      const yatra = await tx.select({ id: tirthYatraTours.id }).from(tirthYatraTours).where(eq(tirthYatraTours.slug, mapping.yatraSourceKey)).limit(1);
      const tirth = await tx.select({ id: tirths.id }).from(tirths)
        .where(eq(tirths.migrationSourceKey, canonicalTirthSourceKey(mapping.tirthSourceKey))).limit(2);
      assert(yatra.length === 1, `mapping Yatra endpoint missing: ${mapping.yatraSourceKey}`);
      assert(tirth.length === 1, `mapping Tirth endpoint missing or ambiguous: ${mapping.tirthSourceKey}`);
      await tx.insert(knowledgeGraphRelationships).values({ sourceEntityType: "YATRA", sourceEntityId: yatra[0].id, relationshipType: "associated_with", targetEntityType: "TIRTH", targetEntityId: tirth[0].id, createdByAdminId: actorAdminId! })
        .onConflictDoNothing();
    }
  });
  console.log(JSON.stringify({ mode: "applied", tirthCount: verified.tirths.length, templeCount: verified.temples.length, aliasCount: verified.aliases.length, contentHash: verified.hash }));
}
main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });