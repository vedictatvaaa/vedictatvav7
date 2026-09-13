import * as cheerio from "cheerio";
import { writeFile } from "node:fs/promises";

type Result = {
  url: string;
  status: number;
  finalUrl: string;
  contentType: string;
  canonical: string | null;
  robots: string | null;
  title: string | null;
  h1Count: number;
  redirects: number;
  issues: string[];
};

const base = new URL(process.argv[2] || `https://${process.env.REPLIT_DEV_DOMAIN}`);
const output = process.argv[3] || "docs/audits/public-route-audit.json";
const maxPages = Math.max(1, Math.min(1_000, Number(process.argv[4] || 400)));
const queue = new Set<string>([
  new URL("/", base).href,
  new URL("/robots.txt", base).href,
  new URL("/sitemap.xml", base).href,
  new URL("/sitemap-index.xml", base).href,
  new URL("/book-pandit-online", base).href,
  new URL("/book-pandit-online/all", base).href,
  new URL("/shop", base).href,
]);
const seen = new Set<string>();
const results: Result[] = [];

function sameOrigin(value: string) {
  try {
    const url = new URL(value, base);
    url.hash = "";
    if (url.origin !== base.origin) return null;
    return url.href;
  } catch {
    return null;
  }
}

async function fetchWithRedirectEvidence(url: string) {
  let current = url;
  let redirects = 0;
  while (redirects < 10) {
    const response = await fetch(current, {
      redirect: "manual",
      headers: { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" },
    });
    if (![301, 302, 303, 307, 308].includes(response.status)) {
      return { response, finalUrl: current, redirects };
    }
    const location = response.headers.get("location");
    if (!location) return { response, finalUrl: current, redirects };
    current = new URL(location, current).href;
    redirects += 1;
  }
  throw new Error(`redirect loop or chain over 10 hops: ${url}`);
}

while (queue.size && seen.size < maxPages) {
  const url = queue.values().next().value as string;
  queue.delete(url);
  if (seen.has(url)) continue;
  seen.add(url);
  try {
    const { response, finalUrl, redirects } = await fetchWithRedirectEvidence(url);
    const contentType = response.headers.get("content-type") || "";
    const body = await response.text();
    const issues: string[] = [];
    let canonical: string | null = null;
    let robots: string | null = response.headers.get("x-robots-tag");
    let title: string | null = null;
    let h1Count = 0;
    if (contentType.includes("html")) {
      const $ = cheerio.load(body);
      const clientRenderedShell = $("#root").length > 0 && $("body").text().trim().length === 0;
      canonical = $("link[rel='canonical']").first().attr("href") || null;
      robots = robots || $("meta[name='robots']").first().attr("content") || null;
      title = $("title").first().text().trim() || null;
      h1Count = $("h1").length;
      $("a[href]").each((_index, element) => {
        const href = sameOrigin($(element).attr("href") || "");
        if (href && !seen.has(href) && queue.size + seen.size < maxPages * 2) queue.add(href);
      });
      if (!title) issues.push("missing_title");
      if (!canonical) issues.push("missing_canonical");
      if (!clientRenderedShell && h1Count !== 1 && response.status === 200) {
        issues.push(h1Count ? "multiple_h1" : "missing_h1");
      }
    } else if (contentType.includes("xml")) {
      const $ = cheerio.load(body, { xmlMode: true });
      $("loc").each((_index, element) => {
        const href = sameOrigin($(element).text().trim());
        if (href && !seen.has(href)) queue.add(href);
      });
    }
    if (response.status >= 400) issues.push(`http_${response.status}`);
    if (redirects > 1) issues.push("redirect_chain");
    if (url.startsWith(`${base.origin}/api/`) && contentType.includes("html")) issues.push("api_returned_html");
    if (canonical) {
      const resolvedCanonical = sameOrigin(canonical);
      if (!resolvedCanonical) issues.push("external_or_invalid_canonical");
      else if (resolvedCanonical !== finalUrl && response.status === 200) issues.push("non_self_canonical");
    }
    results.push({
      url,
      status: response.status,
      finalUrl,
      contentType,
      canonical,
      robots,
      title,
      h1Count,
      redirects,
      issues,
    });
  } catch (error) {
    results.push({
      url,
      status: 0,
      finalUrl: url,
      contentType: "",
      canonical: null,
      robots: null,
      title: null,
      h1Count: 0,
      redirects: 0,
      issues: [`fetch_error:${error instanceof Error ? error.message : String(error)}`],
    });
  }
}

const summary = {
  baseUrl: base.origin,
  generatedAt: new Date().toISOString(),
  crawled: results.length,
  issueUrls: results.filter((result) => result.issues.length).length,
  statuses: Object.fromEntries(
    Array.from(new Set(results.map((result) => result.status))).sort().map((status) => [
      status,
      results.filter((result) => result.status === status).length,
    ]),
  ),
};
await writeFile(output, `${JSON.stringify({ summary, results }, null, 2)}\n`);
console.log(JSON.stringify(summary, null, 2));