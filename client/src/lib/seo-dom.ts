import { useSyncExternalStore } from "react";

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
