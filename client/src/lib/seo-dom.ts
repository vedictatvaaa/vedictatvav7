import { useSyncExternalStore } from "react";
import type { ResolvedSeoMetadata } from "@shared/seo-metadata";

export function setMetaTag(name: string, content: string | undefined | null, property = false) {
  if (typeof document === "undefined") return;
  const attr = property ? "property" : "name";
  let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.content = content;
}

export function setLinkTag(rel: string, href: string | undefined | null, attrs?: Record<string, string>) {
  if (typeof document === "undefined") return;
  const selectorParts = [`link[rel="${rel}"]`];
  if (attrs?.hreflang) selectorParts.push(`[hreflang="${attrs.hreflang}"]`);
  let el = document.querySelector(selectorParts.join("")) as HTMLLinkElement | null;
  if (!href) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("link");
    el.rel = rel;
    document.head.appendChild(el);
  }
  el.href = href;
  if (attrs) for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
}

export function setJsonLd(id: string, payload: any | null) {
  if (typeof document === "undefined") return;
  let el = document.querySelector(`script[data-jsonld="${id}"]`) as HTMLScriptElement | null;
  if (!payload) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.setAttribute("data-jsonld", id);
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(payload);
}

let initialSsrMetadata: ResolvedSeoMetadata | null | undefined;

export function getInitialSsrMetadata(
  pathname: string,
  includeFallback = true,
): ResolvedSeoMetadata | null {
  if (typeof document === "undefined") return null;
  if (initialSsrMetadata === undefined) {
    const el = document.getElementById("ssr-seo-state");
    try {
      initialSsrMetadata = el?.textContent
        ? JSON.parse(el.textContent) as ResolvedSeoMetadata
        : null;
    } catch {
      initialSsrMetadata = null;
    }
  }
  if (initialSsrMetadata?.pathname !== pathname) return null;
  if (!includeFallback && initialSsrMetadata.isFallback) return null;
  return initialSsrMetadata;
}

export function applySeoMetadata(metadata: ResolvedSeoMetadata) {
  if (typeof document === "undefined") return;
  document.title = metadata.title;
  setMetaTag("description", metadata.description);
  setMetaTag("keywords", metadata.keywords || "");
  setMetaTag("robots", metadata.robots);
  setLinkTag("canonical", metadata.canonical);
  setLinkTag("alternate", metadata.alternates["en-IN"], { hreflang: "en-IN" });
  setLinkTag("alternate", metadata.alternates["hi-IN"], { hreflang: "hi-IN" });
  setLinkTag("alternate", metadata.alternates["x-default"], { hreflang: "x-default" });
  setMetaTag("og:site_name", metadata.openGraph.siteName, true);
  setMetaTag("og:title", metadata.openGraph.title, true);
  setMetaTag("og:description", metadata.openGraph.description, true);
  setMetaTag("og:url", metadata.openGraph.url, true);
  setMetaTag("og:type", metadata.openGraph.type, true);
  setMetaTag("og:image", metadata.openGraph.image, true);
  setMetaTag("og:locale", metadata.openGraph.locale, true);
  setMetaTag("og:locale:alternate", metadata.openGraph.alternateLocale, true);
  setMetaTag("twitter:card", metadata.twitter.card);
  setMetaTag("twitter:site", metadata.twitter.site);
  setMetaTag("twitter:title", metadata.twitter.title);
  setMetaTag("twitter:description", metadata.twitter.description);
  setMetaTag("twitter:image", metadata.twitter.image);
}

let pageSeoActiveCount = 0;
const pageSeoListeners = new Set<() => void>();

export function incrementPageSeo() {
  pageSeoActiveCount += 1;
  pageSeoListeners.forEach((l) => l());
}

export function decrementPageSeo() {
  pageSeoActiveCount = Math.max(0, pageSeoActiveCount - 1);
  pageSeoListeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  pageSeoListeners.add(listener);
  return () => pageSeoListeners.delete(listener);
}

function getSnapshot() {
  return pageSeoActiveCount;
}

function getServerSnapshot() {
  return 0;
}

export function usePageSeoActive(): number {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
