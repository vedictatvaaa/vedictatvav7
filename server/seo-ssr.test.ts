import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import {
  buildHeadHtml,
  injectHead,
  resolveHeadMetadata,
  type Head,
} from "./seo-ssr";

const ORIGIN = "https://vedictatva.com";

function decodeHtml(value: string): string {
  return value
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
}

function tagContent(html: string, pattern: RegExp): string {
  const match = html.match(pattern);
  assert.ok(match, `missing tag matching ${pattern}`);
  return decodeHtml(match[1]);
}

function rawMetadata(html: string) {
  const alternates = Object.fromEntries(
    Array.from(html.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g))
      .map((match) => [match[1], decodeHtml(match[2])]),
  );
  return {
    title: tagContent(html, /<title>([\s\S]*?)<\/title>/),
    description: tagContent(html, /<meta name="description" content="([^"]*)"/),
    ...(html.includes('<meta name="keywords"')
      ? { keywords: tagContent(html, /<meta name="keywords" content="([^"]*)"/) }
      : {}),
    robots: tagContent(html, /<meta name="robots" content="([^"]*)"/),
    canonical: tagContent(html, /<link rel="canonical" href="([^"]*)"/),
    alternates,
    openGraph: {
      siteName: tagContent(html, /<meta property="og:site_name" content="([^"]*)"/),
      title: tagContent(html, /<meta property="og:title" content="([^"]*)"/),
      description: tagContent(html, /<meta property="og:description" content="([^"]*)"/),
      url: tagContent(html, /<meta property="og:url" content="([^"]*)"/),
      type: tagContent(html, /<meta property="og:type" content="([^"]*)"/),
      image: tagContent(html, /<meta property="og:image" content="([^"]*)"/),
      locale: tagContent(html, /<meta property="og:locale" content="([^"]*)"/),
      alternateLocale: tagContent(html, /<meta property="og:locale:alternate" content="([^"]*)"/),
    },
    twitter: {
      card: tagContent(html, /<meta name="twitter:card" content="([^"]*)"/),
      site: tagContent(html, /<meta name="twitter:site" content="([^"]*)"/),
      title: tagContent(html, /<meta name="twitter:title" content="([^"]*)"/),
      description: tagContent(html, /<meta name="twitter:description" content="([^"]*)"/),
      image: tagContent(html, /<meta name="twitter:image" content="([^"]*)"/),
    },
  };
}

const representativeRoutes: Array<{ name: string; path: string; head: Head }> = [
  {
    name: "homepage",
    path: "/",
    head: {
      title: "Puja Samagri, Online Puja Booking & Panditji Services",
      description: "Every sacred need, one trusted app.",
      canonical: "/",
      ogImage: "/og/og-prime-services.jpg",
    },
  },
  {
    name: "product",
    path: "/product/rudraksha-mala",
    head: {
      title: "Rudraksha Mala — Buy Online | Vedic Tatva",
      description: "Authentic five-mukhi Rudraksha mala.",
      canonical: "/product/rudraksha-mala",
      ogImage: "/uploads/rudraksha.jpg",
      ogType: "product",
    },
  },
  {
    name: "category",
    path: "/puja-samagri-online/rudraksha",
    head: {
      title: "Original Rudraksha Online | Vedic Tatva",
      description: "Shop lab-certified Rudraksha.",
      canonical: "/puja-samagri-online/rudraksha",
    },
  },
  {
    name: "Pandit",
    path: "/pandit/acharya-sharma",
    head: {
      title: "Acharya Sharma — Verified Vedic Pandit · Vedic Tatva",
      description: "Book pujas with Acharya Sharma.",
      canonical: "/pandit/acharya-sharma",
      ogImage: "/api/og/p/acharya-sharma.jpg",
      ogType: "profile",
    },
  },
  {
    name: "booking",
    path: "/online-puja-booking",
    head: {
      title: "Online Puja with Live Vedic Pandits · Vedic Tatva",
      description: "Book an authentic live Vedic puja.",
      canonical: "/online-puja-booking",
    },
  },
  {
    name: "blog listing",
    path: "/blog",
    head: {
      title: "Vedic Wisdom Blog · Vedic Tatva",
      description: "Festival, puja and Jyotish guidance.",
      canonical: "/blog",
    },
  },
  {
    name: "blog article",
    path: "/blog/how-to-perform-lakshmi-puja",
    head: {
      title: "How to Perform Lakshmi Puja | Vedic Tatva",
      description: "A step-by-step Lakshmi Puja guide.",
      canonical: "/blog/how-to-perform-lakshmi-puja",
      ogType: "article",
    },
  },
];

test("raw and hydrated metadata models match for representative routes", () => {
  for (const route of representativeRoutes) {
    const headHtml = buildHeadHtml(route.head, ORIGIN, route.path);
    const stateJson = tagContent(
      headHtml,
      /<script id="ssr-seo-state" type="application\/json">([\s\S]*?)<\/script>/,
    );
    const hydrated = JSON.parse(stateJson);
    const raw = rawMetadata(headHtml);
    const expected = resolveHeadMetadata(route.head, ORIGIN, route.path);

    assert.deepEqual(hydrated, expected, `${route.name}: hydration state`);
    assert.deepEqual(raw, {
      title: hydrated.title,
      description: hydrated.description,
      robots: hydrated.robots,
      canonical: hydrated.canonical,
      alternates: hydrated.alternates,
      openGraph: hydrated.openGraph,
      twitter: hydrated.twitter,
    }, `${route.name}: raw tags`);
  }
});

test("SSR preserves the complete admin-managed search and share contract", () => {
  const head: Head = {
    title: "Configured title",
    description: "Configured description",
    keywords: "vedic, puja",
    canonical: "/configured",
    ogTitle: "Configured OG title",
    ogDescription: "Configured OG description",
    ogImage: "/configured-og.jpg",
    ogType: "article",
    twitterCard: "summary",
    twitterTitle: "Configured Twitter title",
    twitterDescription: "Configured Twitter description",
    twitterImage: "/configured-twitter.jpg",
  };
  const html = buildHeadHtml(head, ORIGIN, "/configured");
  const state = JSON.parse(tagContent(
    html,
    /<script id="ssr-seo-state" type="application\/json">([\s\S]*?)<\/script>/,
  ));

  assert.equal(state.keywords, "vedic, puja");
  assert.equal(state.openGraph.title, "Configured OG title");
  assert.equal(state.openGraph.description, "Configured OG description");
  assert.equal(state.openGraph.type, "article");
  assert.equal(state.twitter.card, "summary");
  assert.equal(state.twitter.title, "Configured Twitter title");
  assert.equal(state.twitter.description, "Configured Twitter description");
  assert.equal(state.twitter.image, `${ORIGIN}/configured-twitter.jpg`);
  assert.ok(html.includes('<meta name="keywords" content="vedic, puja"'));
});

test("SSR preserves independent robots index and follow policies", () => {
  const base: Head = {
    title: "Robots policy",
    description: "Robots policy test",
    canonical: "/robots-policy",
  };

  assert.equal(
    resolveHeadMetadata({ ...base, robotsIndex: true, robotsFollow: false }, ORIGIN).robots,
    "index, nofollow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
  );
  assert.equal(
    resolveHeadMetadata({ ...base, robotsIndex: false, robotsFollow: true }, ORIGIN).robots,
    "noindex, follow",
  );
  assert.equal(
    resolveHeadMetadata({ ...base, robotsIndex: false, robotsFollow: false }, ORIGIN).robots,
    "noindex, nofollow",
  );
});

test("Hindi metadata keeps self-canonical and reciprocal hreflang", () => {
  const metadata = resolveHeadMetadata({
    title: "हिंदी पूजा",
    description: "पूजा विवरण",
    canonical: "/hi/online-puja-booking",
  }, ORIGIN, "/hi/online-puja-booking/");

  assert.equal(metadata.canonical, `${ORIGIN}/hi/online-puja-booking`);
  assert.equal(metadata.alternates["en-IN"], `${ORIGIN}/online-puja-booking`);
  assert.equal(metadata.alternates["hi-IN"], `${ORIGIN}/hi/online-puja-booking`);
  assert.equal(metadata.openGraph.locale, "hi_IN");
});

test("head injection removes conflicting generic metadata", () => {
  const template = `<!doctype html><html><head>
    <title>Generic</title>
    <meta name="description" content="Generic">
    <meta name="robots" content="index">
    <link rel="canonical" href="https://example.com">
    <link rel="alternate" hreflang="en-IN" href="https://example.com">
    <meta property="og:title" content="Generic">
    <meta name="twitter:title" content="Generic">
  </head><body></body></html>`;
  const output = injectHead(template, buildHeadHtml(representativeRoutes[0].head, ORIGIN, "/"));

  assert.equal((output.match(/<title>/g) || []).length, 1);
  assert.equal((output.match(/<meta name="description"/g) || []).length, 1);
  assert.equal((output.match(/<meta name="robots"/g) || []).length, 1);
  assert.equal((output.match(/<link rel="canonical"/g) || []).length, 1);
  assert.equal((output.match(/<meta property="og:title"/g) || []).length, 1);
  assert.equal((output.match(/<meta name="twitter:title"/g) || []).length, 1);
});

test("SSR page schemas use stable DOM slots and safe JSON", () => {
  const html = buildHeadHtml({
    title: "Product",
    description: "Safe",
    canonical: "/product/test",
    jsonLd: [{
      id: "product",
      payload: {
        "@context": "https://schema.org",
        "@type": "Product",
        "@id": `${ORIGIN}/product/test#product`,
        name: "</script><script>alert(1)</script>",
      },
    }],
  }, ORIGIN, "/product/test");

  assert.equal((html.match(/data-jsonld="product"/g) || []).length, 1);
  assert.ok(html.includes(`${ORIGIN}/product/test#product`));
  assert.ok(!html.includes("</script><script>alert(1)</script>"));
});

test("the static template has one canonical Organization and WebSite graph", () => {
  const html = readFileSync(new URL("../client/index.html", import.meta.url), "utf8");
  const payloads = Array.from(
    html.matchAll(/<script type="application\/ld\+json" data-jsonld="([^"]+)">([\s\S]*?)<\/script>/g),
  ).map((match) => ({ slot: match[1], payload: JSON.parse(match[2]) }));

  assert.equal(payloads.filter((schema) => schema.slot === "organization").length, 1);
  assert.equal(payloads.filter((schema) => schema.slot === "website").length, 1);
  assert.equal(payloads.filter((schema) => schema.slot === "online-store").length, 1);
  assert.equal(payloads.filter((schema) => schema.payload["@id"] === `${ORIGIN}/#organization`).length, 1);
  assert.equal(payloads.filter((schema) => schema.payload["@id"] === `${ORIGIN}/#website`).length, 1);
});