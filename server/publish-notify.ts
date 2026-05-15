import type { Request } from "express";
import { pingIndexNowAsync } from "./indexnow";
import { pushUrlsToGoogle, isGoogleIndexingConfigured } from "./google-indexing";

// Single fan-out helper invoked from every admin publish endpoint so that
// brand-new and just-edited pages are pushed to search engines within
// seconds instead of waiting for the next sitemap crawl.
//
// - IndexNow: free, unlimited, fans out to Bing/Yandex/Seznam/Naver/Yep.
// - Google Indexing API: 200 URLs/day quota per service account. We track
//   it in-process and silently skip once the daily budget is exhausted so
//   the deploy never throws.
//
// Always best-effort and non-blocking; a failure here MUST never affect
// the underlying admin write.

interface QuotaState {
  day: string; // YYYY-MM-DD in UTC
  used: number;
}

const DAILY_GOOGLE_CAP = 190; // leave 10 headroom for manual admin pings
let quota: QuotaState = { day: today(), used: 0 };

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function rolloverIfNeeded() {
  const d = today();
  if (quota.day !== d) quota = { day: d, used: 0 };
}

export function getGoogleQuotaState() {
  rolloverIfNeeded();
  return { ...quota, cap: DAILY_GOOGLE_CAP };
}

export function baseUrlFromReq(req: Request): string {
  const env = process.env.PUBLIC_SITE_URL?.replace(/\/$/, "");
  if (env) return env;
  return `${req.protocol}://${req.get("host")}`;
}

function toAbsoluteUrls(req: Request, paths: string[]): string[] {
  const base = baseUrlFromReq(req);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    if (!p) continue;
    const url = /^https?:\/\//i.test(p) ? p : `${base}${p.startsWith("/") ? "" : "/"}${p}`;
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

interface NotifyOptions {
  // Skip Google submission for this call (e.g. low-priority bulk edits).
  skipGoogle?: boolean;
  // Always include /sitemap.xml in the IndexNow ping.
  pingSitemap?: boolean;
}

// Fire-and-forget. Pings IndexNow immediately and submits to Google's
// Indexing API in the background, capped at the daily quota.
export function notifyPublish(req: Request, paths: string[], opts: NotifyOptions = {}) {
  try {
    const urls = toAbsoluteUrls(req, paths);
    if (urls.length === 0) return;

    const indexNowUrls = opts.pingSitemap
      ? [...urls, `${baseUrlFromReq(req)}/sitemap.xml`]
      : urls;
    pingIndexNowAsync(indexNowUrls);

    if (opts.skipGoogle || !isGoogleIndexingConfigured()) return;
    rolloverIfNeeded();
    const remaining = DAILY_GOOGLE_CAP - quota.used;
    if (remaining <= 0) return;
    const slice = urls.slice(0, remaining);
    quota.used += slice.length;
    pushUrlsToGoogle(slice, "URL_UPDATED").catch((e) =>
      console.warn("[publish-notify] Google Indexing API failed:", e?.message || e),
    );
  } catch (e: any) {
    console.warn("[publish-notify] failed:", e?.message || e);
  }
}

// Convenience for delete events — push URL_DELETED to Google so the URL
// drops from the index; IndexNow has no separate "removed" signal so the
// 410/404 the next crawler sees handles that side.
export function notifyUnpublish(req: Request, paths: string[]) {
  try {
    const urls = toAbsoluteUrls(req, paths);
    if (urls.length === 0 || !isGoogleIndexingConfigured()) return;
    rolloverIfNeeded();
    const remaining = DAILY_GOOGLE_CAP - quota.used;
    if (remaining <= 0) return;
    const slice = urls.slice(0, remaining);
    quota.used += slice.length;
    pushUrlsToGoogle(slice, "URL_DELETED").catch((e) =>
      console.warn("[publish-notify] Google delete failed:", e?.message || e),
    );
  } catch (e: any) {
    console.warn("[publish-notify] failed:", e?.message || e);
  }
}
