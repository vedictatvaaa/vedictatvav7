// Pandit slug helpers — deterministic generation + uniqueness enforcement.
// Used by storage.createPandit / updatePandit and by the startup backfill so
// every pandit gets a unique, usable /p/<slug> URL.

import { db } from "./db";
import { pandits } from "@shared/schema";
import { eq, and, ne, isNull, or, sql } from "drizzle-orm";

export function slugifyName(s: string): string {
  return (s || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export function baseSlugFor(name: string, city?: string | null): string {
  const n = slugifyName(name);
  const c = slugifyName(city || "");
  const base = c ? `${n}-${c}` : n;
  return base || "pandit";
}

// Returns a slug guaranteed unique in the pandits table. If the candidate is
// taken by a different pandit, appends -2, -3, ... until free.
export async function ensureUniqueSlug(candidate: string, excludeId?: number): Promise<string> {
  const base = candidate || "pandit";
  let attempt = base;
  for (let i = 2; i < 1000; i++) {
    const conflict = await db
      .select({ id: pandits.id })
      .from(pandits)
      .where(
        excludeId
          ? and(eq(pandits.slug, attempt), ne(pandits.id, excludeId))
          : eq(pandits.slug, attempt),
      )
      .limit(1);
    if (conflict.length === 0) return attempt;
    attempt = `${base}-${i}`;
  }
  // Extremely unlikely fallback — random suffix
  return `${base}-${Math.random().toString(36).slice(2, 7)}`;
}

// One-shot startup backfill: assigns slugs to rows where slug IS NULL or ''
// and de-duplicates any pre-existing collisions deterministically (lower
// id wins the canonical slug; later rows get a numeric suffix).
export async function backfillPanditSlugs(): Promise<{ filled: number; deduped: number }> {
  let filled = 0;
  let deduped = 0;

  // 1) Fill missing slugs.
  const missing = await db
    .select()
    .from(pandits)
    .where(or(isNull(pandits.slug), eq(pandits.slug, "")));
  for (const p of missing) {
    const base = baseSlugFor(p.name, p.city);
    const unique = await ensureUniqueSlug(base, p.id);
    await db.update(pandits).set({ slug: unique }).where(eq(pandits.id, p.id));
    filled++;
  }

  // 2) De-duplicate any pre-existing collisions.
  const dupRows = await db.execute(sql`
    SELECT slug FROM pandits
    WHERE slug IS NOT NULL AND slug <> ''
    GROUP BY slug HAVING COUNT(*) > 1
  `);
  const dupSlugs: string[] = (dupRows.rows as Array<{ slug: string }>).map((r) => r.slug);
  for (const slug of dupSlugs) {
    const conflicting = await db.select().from(pandits).where(eq(pandits.slug, slug));
    // Keep the lowest id as-is; rename the rest with numeric suffix.
    const sorted = [...conflicting].sort((a, b) => a.id - b.id);
    for (let i = 1; i < sorted.length; i++) {
      const row = sorted[i];
      const base = baseSlugFor(row.name, row.city);
      const fresh = await ensureUniqueSlug(base, row.id);
      await db.update(pandits).set({ slug: fresh }).where(eq(pandits.id, row.id));
      deduped++;
    }
  }

  return { filled, deduped };
}
