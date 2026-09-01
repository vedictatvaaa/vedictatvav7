export const SEO_SITE_NAME = "Vedic Tatva";
export const SEO_CANONICAL_ORIGIN = "https://vedictatva.com";
export const SEO_DEFAULT_OG_IMAGE = "/attached_assets/og-default.png";
export const SEO_ROBOTS_INDEX = "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1";
export const SEO_ROBOTS_NOINDEX = "noindex, nofollow";

export type SeoMetadataInput = {
  title: string;
  description: string;
  canonical: string;
  requestPath: string;
  origin: string;
  siteName?: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  noindex?: boolean;
  robotsIndex?: boolean;
  robotsFollow?: boolean;
};

export type ResolvedSeoMetadata = {
  isFallback?: boolean;
  pathname: string;
  title: string;
  description: string;
  keywords?: string;
  robots: string;
  canonical: string;
  alternates: {
    "en-IN": string;
    "hi-IN": string;
    "x-default": string;
  };
  openGraph: {
    siteName: string;
    title: string;
    description: string;
    url: string;
    type: string;
    image: string;
    locale: string;
    alternateLocale: string;
  };
  twitter: {
    card: string;
    site: string;
    title: string;
    description: string;
    image: string;
  };
};

function trimOrigin(origin: string): string {
  return origin.replace(/\/+$/, "");
}

export function absoluteSeoUrl(origin: string, value: string): string {
  if (/^https?:\/\//i.test(value)) return value;
  const normalized = value.startsWith("/") ? value : `/${value}`;
  return `${trimOrigin(origin)}${normalized}`;
}

export function normalizeSeoPath(value: string): string {
  let pathname = value || "/";
  if (/^https?:\/\//i.test(pathname)) {
    try {
      pathname = new URL(pathname).pathname;
    } catch {
      pathname = "/";
    }
  }
  pathname = pathname.split(/[?#]/, 1)[0] || "/";
  if (!pathname.startsWith("/")) pathname = `/${pathname}`;
  return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") || "/";
}

export function buildSeoAlternates(origin: string, canonical: string, requestPath: string) {
  const canonicalPath = normalizeSeoPath(canonical);
  const currentPath = normalizeSeoPath(requestPath);
  const isHindi = currentPath === "/hi" || currentPath.startsWith("/hi/");
  const basePath = canonicalPath.replace(/^\/hi(?=\/|$)/, "") || "/";
  const enPath = basePath;
  const hiPath = basePath === "/" ? "/hi" : `/hi${basePath}`;
  return {
    canonical: /^https?:\/\//i.test(canonical)
      ? canonical
      : absoluteSeoUrl(origin, isHindi ? hiPath : enPath),
    alternates: {
      "en-IN": absoluteSeoUrl(origin, enPath),
      "hi-IN": absoluteSeoUrl(origin, hiPath),
      "x-default": absoluteSeoUrl(origin, enPath),
    },
  };
}

export function resolveSeoMetadata(input: SeoMetadataInput): ResolvedSeoMetadata {
  const urls = buildSeoAlternates(input.origin, input.canonical, input.requestPath);
  const image = absoluteSeoUrl(input.origin, input.ogImage || SEO_DEFAULT_OG_IMAGE);
  const robotsIndex = input.robotsIndex ?? !input.noindex;
  const robotsFollow = input.robotsFollow ?? !input.noindex;
  const robots = [
    robotsIndex ? "index" : "noindex",
    robotsFollow ? "follow" : "nofollow",
    ...(robotsIndex
      ? ["max-image-preview:large", "max-snippet:-1", "max-video-preview:-1"]
      : []),
  ].join(", ");
  return {
    pathname: normalizeSeoPath(input.requestPath),
    title: input.title,
    description: input.description,
    ...(input.keywords ? { keywords: input.keywords } : {}),
    robots,
    canonical: urls.canonical,
    alternates: urls.alternates,
    openGraph: {
      siteName: input.siteName || SEO_SITE_NAME,
      title: input.ogTitle || input.title,
      description: input.ogDescription || input.description,
      url: urls.canonical,
      type: input.ogType || "website",
      image,
      locale: input.requestPath === "/hi" || input.requestPath.startsWith("/hi/") ? "hi_IN" : "en_IN",
      alternateLocale: input.requestPath === "/hi" || input.requestPath.startsWith("/hi/") ? "en_IN" : "hi_IN",
    },
    twitter: {
      card: input.twitterCard || "summary_large_image",
      site: "@vedictatva",
      title: input.twitterTitle || input.ogTitle || input.title,
      description: input.twitterDescription || input.ogDescription || input.description,
      image: absoluteSeoUrl(input.origin, input.twitterImage || input.ogImage || SEO_DEFAULT_OG_IMAGE),
    },
  };
}