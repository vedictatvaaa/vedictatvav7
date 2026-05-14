import { GoogleAuth } from "google-auth-library";

// Google Indexing API + Search Console API helpers.
// Both require a Google service-account JSON in GOOGLE_SERVICE_ACCOUNT_JSON
// (the same env var the Merchant Center integration uses). The service
// account email must also be added as an Owner of the Search Console
// property at https://search.google.com/search-console/users for the
// sitemap-submit + URL-ping calls to succeed.

const INDEXING_SCOPE = "https://www.googleapis.com/auth/indexing";
const SEARCHCONSOLE_SCOPE = "https://www.googleapis.com/auth/webmasters";

let cached:
  | { auth: GoogleAuth; serviceAccountEmail: string }
  | null = null;

function getAuth(): { auth: GoogleAuth; serviceAccountEmail: string } | null {
  if (cached) return cached;
  const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (!raw) return null;
  let creds: any;
  try {
    creds = JSON.parse(raw);
  } catch {
    console.warn("[google-indexing] GOOGLE_SERVICE_ACCOUNT_JSON is not valid JSON");
    return null;
  }
  if (!creds.client_email || !creds.private_key) {
    console.warn("[google-indexing] service account JSON missing client_email/private_key");
    return null;
  }
  const auth = new GoogleAuth({
    credentials: {
      client_email: creds.client_email,
      private_key: creds.private_key,
    },
    scopes: [INDEXING_SCOPE, SEARCHCONSOLE_SCOPE],
  });
  cached = { auth, serviceAccountEmail: creds.client_email };
  return cached;
}

export function isGoogleIndexingConfigured(): boolean {
  return !!getAuth();
}

export interface GoogleIndexingResult {
  ok: boolean;
  configured: boolean;
  submitted: number;
  succeeded: number;
  failed: number;
  errors: Array<{ url: string; status?: number; message: string }>;
  serviceAccountEmail?: string;
}

// Push a list of URLs to Google's Indexing API. Each URL is submitted
// individually as URL_UPDATED. Quota: 200 per day per service account by
// default — keep the slice small.
export async function pushUrlsToGoogle(
  urls: string[],
  type: "URL_UPDATED" | "URL_DELETED" = "URL_UPDATED",
): Promise<GoogleIndexingResult> {
  const ctx = getAuth();
  if (!ctx) {
    return {
      ok: false,
      configured: false,
      submitted: 0,
      succeeded: 0,
      failed: 0,
      errors: [{ url: "", message: "GOOGLE_SERVICE_ACCOUNT_JSON not set" }],
    };
  }
  const cleaned = Array.from(new Set(urls.filter((u) => /^https?:\/\//.test(u)))).slice(0, 200);
  if (cleaned.length === 0) {
    return {
      ok: false,
      configured: true,
      submitted: 0,
      succeeded: 0,
      failed: 0,
      errors: [{ url: "", message: "No URLs to submit" }],
      serviceAccountEmail: ctx.serviceAccountEmail,
    };
  }

  const client = await ctx.auth.getClient();
  const errors: GoogleIndexingResult["errors"] = [];
  let succeeded = 0;
  // Sequential with small concurrency — Indexing API responds fast and the
  // daily quota is small enough that batching in parallel buys little.
  const concurrency = 5;
  for (let i = 0; i < cleaned.length; i += concurrency) {
    const batch = cleaned.slice(i, i + concurrency);
    const results = await Promise.all(
      batch.map(async (url) => {
        try {
          const resp = await client.request({
            url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
            method: "POST",
            data: { url, type },
            // Don't throw on non-2xx so we can collect all failures.
            validateStatus: () => true,
          } as any);
          if (resp.status >= 200 && resp.status < 300) return { url, ok: true };
          const message =
            (resp.data as any)?.error?.message ||
            `HTTP ${resp.status}`;
          return { url, ok: false, status: resp.status, message };
        } catch (e: any) {
          return { url, ok: false, message: e?.message || "Request failed" };
        }
      }),
    );
    for (const r of results) {
      if (r.ok) succeeded++;
      else errors.push({ url: r.url, status: (r as any).status, message: (r as any).message });
    }
  }

  return {
    ok: succeeded > 0,
    configured: true,
    submitted: cleaned.length,
    succeeded,
    failed: errors.length,
    errors: errors.slice(0, 20),
    serviceAccountEmail: ctx.serviceAccountEmail,
  };
}

export interface GoogleSitemapResult {
  ok: boolean;
  configured: boolean;
  siteUrl: string;
  sitemapUrl: string;
  status?: number;
  message?: string;
  serviceAccountEmail?: string;
}

// Submit (or re-submit) a sitemap to Google Search Console for the given
// verified property. Replaces the deprecated /ping?sitemap= endpoint.
// `siteUrl` must be the exact property URL as it appears in Search Console
// (e.g. "https://vedictatva.com/" — note trailing slash for URL-prefix
// properties, or "sc-domain:vedictatva.com" for domain properties).
export async function submitSitemapToGoogle(
  siteUrl: string,
  sitemapUrl: string,
): Promise<GoogleSitemapResult> {
  const ctx = getAuth();
  if (!ctx) {
    return {
      ok: false,
      configured: false,
      siteUrl,
      sitemapUrl,
      message: "GOOGLE_SERVICE_ACCOUNT_JSON not set",
    };
  }
  try {
    const client = await ctx.auth.getClient();
    const apiUrl = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(
      siteUrl,
    )}/sitemaps/${encodeURIComponent(sitemapUrl)}`;
    const resp = await client.request({
      url: apiUrl,
      method: "PUT",
      validateStatus: () => true,
    } as any);
    if (resp.status >= 200 && resp.status < 300) {
      return {
        ok: true,
        configured: true,
        siteUrl,
        sitemapUrl,
        status: resp.status,
        message: "Sitemap submitted",
        serviceAccountEmail: ctx.serviceAccountEmail,
      };
    }
    const errMsg =
      (resp.data as any)?.error?.message || `HTTP ${resp.status}`;
    return {
      ok: false,
      configured: true,
      siteUrl,
      sitemapUrl,
      status: resp.status,
      message: errMsg,
      serviceAccountEmail: ctx.serviceAccountEmail,
    };
  } catch (e: any) {
    return {
      ok: false,
      configured: true,
      siteUrl,
      sitemapUrl,
      message: e?.message || "Request failed",
      serviceAccountEmail: ctx.serviceAccountEmail,
    };
  }
}
