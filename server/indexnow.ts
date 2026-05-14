import crypto from "crypto";

// IndexNow protocol — push URL updates to Bing, Yandex, Seznam, Naver, Yep.
// Submitting to bing.com endpoint propagates to all participating engines.

const KEY_ENV = "INDEXNOW_KEY";

export function getIndexNowKey(): string {
  let key = process.env[KEY_ENV];
  if (!key) {
    // Generate a stable per-process key so /<key>.txt remains servable.
    key = crypto.createHash("sha256").update(process.env.PUBLIC_SITE_URL || "vedic-tatva-default-key").digest("hex").slice(0, 32);
    process.env[KEY_ENV] = key;
  }
  return key;
}

export interface IndexNowResult {
  ok: boolean;
  status?: number;
  endpoint: string;
  submitted: number;
  error?: string;
}

export async function pingIndexNow(urls: string[], opts?: { host?: string }): Promise<IndexNowResult> {
  const cleaned = Array.from(new Set(urls.filter(Boolean))).slice(0, 10000);
  if (cleaned.length === 0) return { ok: false, endpoint: "", submitted: 0, error: "No URLs" };

  const baseHost = opts?.host || (() => {
    try {
      return new URL(cleaned[0]).host;
    } catch {
      return "";
    }
  })();
  if (!baseHost) return { ok: false, endpoint: "", submitted: 0, error: "Missing host" };

  const key = getIndexNowKey();
  const keyLocation = `https://${baseHost}/${key}.txt`;

  try {
    const resp = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        Accept: "application/json",
        // Some IndexNow nodes 403 requests without an identifiable UA.
        "User-Agent": "VedicTatvaBot/1.0 (+https://vedictatva.com)",
      },
      body: JSON.stringify({
        host: baseHost,
        key,
        keyLocation,
        urlList: cleaned,
      }),
    });
    return {
      ok: resp.ok || resp.status === 202,
      status: resp.status,
      endpoint: "https://api.indexnow.org/IndexNow",
      submitted: cleaned.length,
    };
  } catch (err: any) {
    return { ok: false, endpoint: "https://api.indexnow.org/IndexNow", submitted: 0, error: err?.message };
  }
}

// Best-effort, non-blocking
export function pingIndexNowAsync(urls: string[], opts?: { host?: string }) {
  pingIndexNow(urls, opts).catch((e) => console.warn("[indexnow] ping failed", e?.message || e));
}

// Ping Bing sitemap endpoint. Google's `/ping?sitemap=` was deprecated in
// June 2023 and now returns 404 — submitting sitemaps to Google requires the
// Search Console API (see `server/google-indexing.ts`).
export async function pingSitemap(sitemapUrl: string): Promise<{ google?: boolean; googleNote?: string; bing?: boolean }> {
  const out: { google?: boolean; googleNote?: string; bing?: boolean } = {};
  out.google = false;
  out.googleNote = "Google /ping endpoint deprecated (June 2023). Use Search Console API via google-indexing.ts.";
  try {
    const b = await fetch(`https://www.bing.com/ping?sitemap=${encodeURIComponent(sitemapUrl)}`);
    out.bing = b.ok;
  } catch {}
  return out;
}
