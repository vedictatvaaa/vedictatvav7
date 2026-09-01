import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import puppeteer, { type Page } from "puppeteer";

const devDomain = process.env.REPLIT_DEV_DOMAIN;

function findChromium(): string | null {
  if (process.env.PUPPETEER_EXECUTABLE_PATH) {
    return process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  const store = "/nix/store";
  if (!fs.existsSync(store)) return null;

  const candidates = fs.readdirSync(store)
    .map((entry) => {
      const match = entry.match(/(?:ungoogled-)?chromium-(\d+)\./);
      return match
        ? { version: Number(match[1]), executable: path.join(store, entry, "bin/chromium") }
        : null;
    })
    .filter((candidate): candidate is { version: number; executable: string } =>
      Boolean(candidate && fs.existsSync(candidate.executable))
    )
    .sort((a, b) => b.version - a.version);

  return candidates[0]?.executable || null;
}

async function readMetadata(page: Page) {
  return page.evaluate(`(() => {
    const meta = (key, property = false) =>
      document.querySelector(
        'meta[' + (property ? 'property' : 'name') + '="' + key + '"]'
      )?.content || null;
    const metadata = {
      title: document.title,
      description: meta("description"),
      keywords: meta("keywords"),
      robots: meta("robots"),
      canonical: document.querySelector('link[rel=canonical]')?.href || null,
      alternates: Object.fromEntries(
        Array.from(document.querySelectorAll('link[rel=alternate][hreflang]'))
          .map((link) => [link.hreflang, link.href])
      ),
      openGraph: {
        siteName: meta("og:site_name", true),
        title: meta("og:title", true),
        description: meta("og:description", true),
        url: meta("og:url", true),
        type: meta("og:type", true),
        image: meta("og:image", true),
        locale: meta("og:locale", true),
        alternateLocale: meta("og:locale:alternate", true),
      },
      twitter: {
        card: meta("twitter:card"),
        site: meta("twitter:site"),
        title: meta("twitter:title"),
        description: meta("twitter:description"),
        image: meta("twitter:image"),
      },
    };

    const schemas = Array.from(
      document.querySelectorAll('script[type="application/ld+json"][data-jsonld]')
    ).map((script) => ({
      slot: script.dataset.jsonld,
      payload: JSON.parse(script.textContent || "{}"),
    }));

    return { metadata, schemas };
  })()`) as Promise<{
    metadata: Record<string, unknown>;
    schemas: Array<{ slot: string; payload: Record<string, unknown> }>;
  }>;
}

test("raw responses and hydrated DOM keep representative SEO metadata identical", {
  skip: !devDomain ? "requires the running Replit application workflow" : false,
  timeout: 180_000,
}, async () => {
  const executablePath = findChromium();
  assert.ok(executablePath, "A Chromium executable is required for the hydration regression test");

  const origin = `https://${devDomain}`;
  const browser = await puppeteer.launch({
    headless: true,
    executablePath,
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });

  try {
    const routes = [
      { path: "/" },
      { path: "/online-puja-booking" },
      { path: "/blog" },
      { path: "/puja-samagri-online/rudraksha" },
      { path: "/product/1" },
      {
        path: "/qa",
        expectedTitle: "Spiritual Q&A — Pujas, Mantras, Vedic Wisdom | Vedic Tatva",
      },
      {
        path: "/puja-guide",
        expectedTitle: "Puja Guide — Vidhi, Samagri, Muhurats for Every Major Hindu Puja",
      },
      {
        path: "/accessibility",
        expectedTitle: "Accessibility Statement | Vedic Tatva",
      },
      {
        path: "/product-compare",
        expectedTitle: "Compare Sacred Puja Products Side-by-Side | Vedic Tatva",
      },
      {
        path: "/japa",
        expectedTitle: "Mantra Japa Counter — Free 108 Mala Counter Online | Vedic Tatva",
      },
      {
        path: "/investors",
        expectedTitle: "Investors — Vedic Tatva | Building India's Spiritual Operating System",
      },
      {
        path: "/puja-kit",
        expectedTitle: "Build Your Puja Kit · Vedic Tatva",
      },
    ];

    for (const route of routes) {
      const response = await fetch(`${origin}${route.path}`, {
        headers: { accept: "text/html" },
      });
      assert.equal(response.status, 200, `${route.path} must return HTML`);
      const rawHtml = await response.text();

      const rawPage = await browser.newPage();
      await rawPage.setJavaScriptEnabled(false);
      await rawPage.setRequestInterception(true);
      rawPage.on("request", (request) => request.abort());
      await rawPage.setContent(rawHtml, { waitUntil: "domcontentloaded" });
      const raw = await readMetadata(rawPage);
      await rawPage.close();

      const hydratedPage = await browser.newPage();
      await hydratedPage.goto(`${origin}${route.path}`, {
        waitUntil: "networkidle2",
        timeout: 90_000,
      });
      const hydrated = await readMetadata(hydratedPage);
      await hydratedPage.close();

      assert.deepEqual(
        hydrated.metadata,
        raw.metadata,
        `${route.path} metadata changed after hydration`
      );
      if (route.expectedTitle) {
        assert.equal(
          hydrated.metadata.title,
          route.expectedTitle,
          `${route.path} must keep its page-specific title`
        );
      }

      const slotCounts = hydrated.schemas.reduce<Record<string, number>>((counts, schema) => {
        counts[schema.slot] = (counts[schema.slot] || 0) + 1;
        return counts;
      }, {});
      assert.ok(
        Object.values(slotCounts).every((count) => count === 1),
        `${route.path} contains duplicate JSON-LD slots`
      );

      const graphIds = Object.fromEntries(
        hydrated.schemas
          .filter((schema) => ["organization", "website", "online-store"].includes(schema.slot))
          .map((schema) => [schema.slot, schema.payload["@id"]])
      );
      assert.deepEqual(graphIds, {
        organization: "https://vedictatva.com/#organization",
        website: "https://vedictatva.com/#website",
        "online-store": "https://vedictatva.com/#online-store",
      });
    }

    const navigationPage = await browser.newPage();
    await navigationPage.goto(`${origin}/`, {
      waitUntil: "networkidle2",
      timeout: 90_000,
    });
    await navigationPage.evaluate(() => {
      history.pushState({}, "", "/investors");
      window.dispatchEvent(new PopStateEvent("popstate"));
    });
    await navigationPage.waitForFunction(
      () => document.title.startsWith("Investors — Vedic Tatva"),
      { timeout: 30_000 },
    );
    const spaMetadata = (await readMetadata(navigationPage)).metadata;
    await navigationPage.reload({ waitUntil: "networkidle2", timeout: 90_000 });
    const directMetadata = (await readMetadata(navigationPage)).metadata;
    await navigationPage.close();
    assert.deepEqual(
      directMetadata,
      spaMetadata,
      "/investors metadata must match after SPA navigation and direct reload",
    );
  } finally {
    await browser.close();
  }
});