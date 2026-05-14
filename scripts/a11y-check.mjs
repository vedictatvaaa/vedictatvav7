#!/usr/bin/env node
// Lightweight accessibility regression guard.
//
// Runs axe-core via Puppeteer against critical public pages and fails the
// process with a readable report on any "critical" or "serious" violation.
//
// Usage:
//   BASE_URL=http://localhost:5000 node scripts/a11y-check.mjs
//
// Notes:
//   - Puppeteer + @axe-core/puppeteer are loaded dynamically so the script
//     does not block CI when those dev-deps are not installed.
//   - Add new routes to ROUTES below as features ship.

// Covers the page archetypes called out in the accessibility task:
// home, shop, category, product, service landing, pind-daan, checkout,
// /accessibility statement, and the /reviews/submit token page.
//
// The product route is resolved at runtime against `/api/products` so the
// script does not depend on a hard-coded seed id; if the API is unreachable
// we skip the product page and continue with the rest.
const STATIC_ROUTES = [
  "/",
  "/shop",
  "/category/home-essentials",
  "/pandits", // closest equivalent to /book-pandit in this app
  "/puja",
  "/puja/satyanarayan-katha",
  "/pind-daan",
  "/pind-daan/gaya",
  "/checkout",
  "/accessibility",
  "/reviews/submit",
];

async function resolveProductRoute(baseUrl) {
  try {
    const res = await fetch(`${baseUrl}/api/products`, { signal: AbortSignal.timeout(8000) });
    if (!res.ok) return null;
    const products = await res.json();
    const first = Array.isArray(products) ? products.find((p) => p?.id != null) : null;
    return first ? `/product/${first.id}` : null;
  } catch {
    return null;
  }
}

const BASE_URL = (process.env.BASE_URL || "http://localhost:5000").replace(/\/$/, "");
const FAIL_IMPACTS = new Set(["critical", "serious"]);

async function loadDeps() {
  try {
    const puppeteer = (await import("puppeteer")).default;
    const { AxePuppeteer } = await import("@axe-core/puppeteer");
    return { puppeteer, AxePuppeteer };
  } catch (err) {
    console.error("[a11y] Missing dev-deps. Install with:");
    console.error("       npm i -D puppeteer @axe-core/puppeteer");
    console.error("Underlying error:", err?.message || err);
    process.exit(2);
  }
}

(async () => {
  const { puppeteer, AxePuppeteer } = await loadDeps();
  const productRoute = await resolveProductRoute(BASE_URL);
  const ROUTES = productRoute
    ? [...STATIC_ROUTES.slice(0, 3), productRoute, ...STATIC_ROUTES.slice(3)]
    : STATIC_ROUTES;
  if (!productRoute) {
    console.warn("[a11y] /api/products unreachable — skipping product detail route");
  }
  const browser = await puppeteer.launch({
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  let totalFailures = 0;
  try {
    for (const route of ROUTES) {
      const url = `${BASE_URL}${route}`;
      const page = await browser.newPage();
      console.log(`\n[a11y] checking ${url}`);
      try {
        await page.goto(url, { waitUntil: "networkidle2", timeout: 30000 });
        const results = await new AxePuppeteer(page)
          .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
          .analyze();
        const blocking = results.violations.filter((v) => FAIL_IMPACTS.has(v.impact));
        if (blocking.length === 0) {
          console.log(`  ok — ${results.violations.length} non-blocking issues`);
        } else {
          totalFailures += blocking.length;
          for (const v of blocking) {
            console.log(`  [${v.impact}] ${v.id} — ${v.help}`);
            console.log(`     ${v.helpUrl}`);
            for (const node of v.nodes.slice(0, 3)) {
              console.log(`     • ${node.target.join(" ")}`);
            }
          }
        }
      } catch (err) {
        totalFailures++;
        console.error(`  navigation failed: ${err?.message || err}`);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  if (totalFailures > 0) {
    console.error(`\n[a11y] FAILED with ${totalFailures} blocking violation(s)`);
    process.exit(1);
  }
  console.log("\n[a11y] all routes passed (no critical/serious violations)");
})();
