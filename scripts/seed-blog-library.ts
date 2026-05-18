// One-shot seeder: generates and publishes the initial blog library.
// Usage: tsx scripts/seed-blog-library.ts [count]
// Default count: 50. Skips existing slugs. Safe to re-run.
import { seedInitialBlogLibrary } from "../server/blog-ai";

const target = parseInt(process.argv[2] || "50", 10);

(async () => {
  const t0 = Date.now();
  console.log(`[seed] starting — target ${target} posts`);
  const r = await seedInitialBlogLibrary(target);
  const dt = ((Date.now() - t0) / 1000).toFixed(1);
  console.log(`[seed] done in ${dt}s — attempted=${r.attempted} inserted=${r.inserted} skippedDup=${r.skippedDuplicateSlug} errors=${r.errors.length}`);
  if (r.errors.length) console.log("[seed] errors:", r.errors.slice(0, 5));
  process.exit(0);
})().catch((e) => {
  console.error("[seed] fatal:", e);
  process.exit(1);
});
