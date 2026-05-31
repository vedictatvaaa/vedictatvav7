import type { Request } from "express";
import { pingIndexNow, pingSitemap, getIndexNowKey } from "./indexnow";
import {
  pushUrlsToGoogle,
  isGoogleIndexingConfigured,
  submitSitemapToGoogle,
} from "./google-indexing";
import { getGoogleQuotaState, baseUrlFromReq } from "./publish-notify";

// ---------------------------------------------------------------------------
// Content Distribution Hub — one fan-out surface that pushes URLs to every
// search engine and AI-crawler discovery channel we support. Each channel
// returns a structured result so the admin UI can show exactly what happened.
//
// Channels:
//  - google       Google Indexing API (URL_UPDATED), 200/day quota.
//  - indexnow     IndexNow → Bing, Yahoo, Yandex, Seznam, Naver, Yep.
//  - google-news  Submit the rolling 48h news sitemap to Search Console.
//  - sitemap      Submit / ping the master sitemap (Google SC + Bing).
//  - ai-agents    llms.txt + IndexNow nudge so ChatGPT/Perplexity/Gemini/
//                 Copilot (Bing-backed) discover fresh content.
// ---------------------------------------------------------------------------

export type ChannelId =
  | "google"
  | "indexnow"
  | "google-news"
  | "sitemap"
  | "ai-agents";

export interface ChannelInfo {
  id: ChannelId;
  label: string;
  description: string;
  reach: string[];
  configured: boolean;
  note?: string;
}

export interface ChannelResult extends ChannelInfo {
  ok: boolean;
  detail: string;
  submitted?: number;
}

export const ALL_CHANNELS: ChannelId[] = [
  "google",
  "indexnow",
  "google-news",
  "sitemap",
  "ai-agents",
];

function toAbsolute(req: Request, paths: string[]): string[] {
  const base = baseUrlFromReq(req);
  const out: string[] = [];
  const seen = new Set<string>();
  for (const p of paths) {
    if (!p || typeof p !== "string") continue;
    const url = /^https?:\/\//i.test(p)
      ? p
      : `${base}${p.startsWith("/") ? "" : "/"}${p}`;
    if (!seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

// Snapshot of which channels are ready to fire and what they reach.
export function distributionStatus(req: Request): {
  baseUrl: string;
  indexNowKey: string;
  googleConfigured: boolean;
  googleQuota: ReturnType<typeof getGoogleQuotaState>;
  channels: ChannelInfo[];
} {
  const baseUrl = baseUrlFromReq(req);
  const googleConfigured = isGoogleIndexingConfigured();
  const channels: ChannelInfo[] = [
    {
      id: "google",
      label: "Google Search",
      description: "Direct Indexing API submission for instant crawl.",
      reach: ["Google Search", "Google Discover"],
      configured: googleConfigured,
      note: googleConfigured
        ? undefined
        : "Set GOOGLE_SERVICE_ACCOUNT_JSON to enable.",
    },
    {
      id: "indexnow",
      label: "IndexNow Network",
      description: "One push fans out to every IndexNow engine.",
      reach: ["Bing", "Yahoo", "Yandex", "Seznam", "Naver", "Yep"],
      configured: true,
    },
    {
      id: "google-news",
      label: "Google News",
      description: "Rolling 48-hour news sitemap for fresh articles.",
      reach: ["Google News", "Google Discover"],
      configured: googleConfigured,
      note: googleConfigured
        ? undefined
        : "Search Console API needed for sitemap submit.",
    },
    {
      id: "sitemap",
      label: "Master Sitemap",
      description: "Re-submit the full sitemap to Google + Bing.",
      reach: ["Google", "Bing"],
      configured: true,
    },
    {
      id: "ai-agents",
      label: "AI Assistants",
      description: "llms.txt + index nudge for AI answer engines.",
      reach: ["ChatGPT", "Perplexity", "Gemini", "Copilot", "Claude"],
      configured: true,
    },
  ];
  return {
    baseUrl,
    indexNowKey: getIndexNowKey(),
    googleConfigured,
    googleQuota: getGoogleQuotaState(),
    channels,
  };
}

// Fan out the given URLs across the selected channels and collect per-channel
// results. Best-effort: a single channel failing never aborts the others.
export async function broadcast(
  req: Request,
  paths: string[],
  channels: ChannelId[],
): Promise<{ urls: string[]; results: ChannelResult[] }> {
  const urls = toAbsolute(req, paths);
  const base = baseUrlFromReq(req);
  // Google Search Console may register the property as a URL-prefix
  // ("https://site/") or domain ("sc-domain:site"). Match the rest of the
  // codebase: prefer the explicit GSC_SITE_URL override, else URL-prefix form.
  const gscSiteUrl = process.env.GSC_SITE_URL || `${base.replace(/\/$/, "")}/`;
  const info = distributionStatus(req).channels;
  const pick = (id: ChannelId) => info.find((c) => c.id === id)!;
  const selected = channels.filter((c) => ALL_CHANNELS.includes(c));
  const results: ChannelResult[] = [];

  const tasks = selected.map(async (id): Promise<ChannelResult> => {
    const meta = pick(id);
    try {
      if (id === "google") {
        if (!isGoogleIndexingConfigured()) {
          return { ...meta, ok: false, detail: "Google Indexing API not configured." };
        }
        if (urls.length === 0) {
          return { ...meta, ok: false, detail: "Select at least one URL to push to Google." };
        }
        const r = await pushUrlsToGoogle(urls, "URL_UPDATED");
        return {
          ...meta,
          ok: r.ok,
          submitted: r.submitted,
          detail: r.ok
            ? `${r.succeeded}/${r.submitted} URLs accepted by Google.`
            : r.errors[0]?.message || "Google submission failed.",
        };
      }

      if (id === "indexnow") {
        if (urls.length === 0) {
          return { ...meta, ok: false, detail: "Select at least one URL to push." };
        }
        const r = await pingIndexNow(urls);
        return {
          ...meta,
          ok: r.ok,
          submitted: r.submitted,
          detail: r.ok
            ? `${r.submitted} URLs broadcast to ${meta.reach.join(", ")}.`
            : r.error || `IndexNow returned HTTP ${r.status ?? "?"}.`,
        };
      }

      if (id === "google-news") {
        const newsSitemap = `${base}/sitemap-news.xml`;
        if (!isGoogleIndexingConfigured()) {
          // Still ping Bing for the news sitemap.
          await pingSitemap(newsSitemap);
          return {
            ...meta,
            ok: false,
            detail: "News sitemap refreshed; connect Search Console to submit to Google News.",
          };
        }
        const r = await submitSitemapToGoogle(gscSiteUrl, newsSitemap);
        return {
          ...meta,
          ok: r.ok,
          detail: r.ok
            ? "News sitemap submitted to Google News."
            : (r as any).message || "News sitemap submission failed.",
        };
      }

      if (id === "sitemap") {
        const sitemap = `${base}/sitemap.xml`;
        const ping = await pingSitemap(sitemap);
        let googleOk = false;
        let googleNote = "";
        if (isGoogleIndexingConfigured()) {
          const g = await submitSitemapToGoogle(gscSiteUrl, sitemap);
          googleOk = g.ok;
          if (!g.ok) googleNote = (g as any).message || "";
        }
        const parts: string[] = [];
        if (ping.bing) parts.push("Bing pinged");
        if (googleOk) parts.push("Google SC submitted");
        return {
          ...meta,
          ok: ping.bing || googleOk,
          detail: parts.length
            ? `${parts.join(" · ")}.`
            : googleNote || "Sitemap ping attempted.",
        };
      }

      // ai-agents
      const llms = `${base}/llms.txt`;
      const r = await pingIndexNow([llms, `${base}/sitemap.xml`, ...urls]);
      return {
        ...meta,
        ok: r.ok,
        submitted: r.submitted,
        detail: r.ok
          ? `llms.txt + ${urls.length} pages nudged into the AI-crawler index.`
          : r.error || "AI-agent nudge failed.",
      };
    } catch (e: any) {
      return { ...meta, ok: false, detail: e?.message || "Channel failed." };
    }
  });

  const settled = await Promise.all(tasks);
  results.push(...settled);
  return { urls, results };
}
