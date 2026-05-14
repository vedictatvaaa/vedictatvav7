import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  setMetaTag,
  setLinkTag,
  setJsonLd,
  incrementPageSeo,
  decrementPageSeo,
} from "@/lib/seo-dom";
import type { Schema } from "@/lib/seo-schemas";

interface PageSeoProps {
  title: string;
  description: string;
  keywords?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: "website" | "article" | "product" | "profile" | "video.other";
  twitterCard?: "summary" | "summary_large_image";
  canonical?: string;
  noindex?: boolean;
  schemas?: Array<Schema | null | undefined | false>;
  /** Optional extra meta-tag pairs (e.g. product:price:amount, article:author) */
  extraMeta?: Array<{ name: string; content: string; property?: boolean }>;
}

export default function PageSeo({
  title,
  description,
  keywords,
  ogTitle,
  ogDescription,
  ogImage,
  ogType,
  twitterCard,
  canonical,
  noindex,
  schemas,
  extraMeta,
}: PageSeoProps) {
  const [location] = useLocation();

  useEffect(() => {
    incrementPageSeo();
    return () => decrementPageSeo();
  }, []);

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    // Detect the actual browser URL (including any /hi locale prefix) since
    // wouter's `location` is base-stripped when inside <Router base="/hi">.
    const actualPath =
      typeof window !== "undefined" ? window.location.pathname : location;
    const isHiUrl = /^\/hi(\/|$)/.test(actualPath);
    // Build EN and HI variant paths so canonical and hreflang stay aligned for
    // every language variant of the same page.
    const basePath = canonical && !canonical.startsWith("http")
      ? canonical.replace(/^\/hi(?=\/|$)/, "") || "/"
      : actualPath.replace(/^\/hi(?=\/|$)/, "") || "/";
    const enPath = basePath;
    const hiPath = enPath === "/" ? "/hi" : `/hi${enPath}`;
    const finalCanonical = canonical && canonical.startsWith("http")
      ? canonical
      : origin
        ? `${origin}${isHiUrl ? hiPath : enPath}`
        : "";
    const enCanonical = origin ? `${origin}${enPath}` : enPath;
    const hiCanonical = origin ? `${origin}${hiPath}` : hiPath;

    document.title = title;
    setMetaTag("description", description);
    if (keywords) setMetaTag("keywords", keywords);
    setMetaTag("og:title", ogTitle || title, true);
    setMetaTag("og:description", ogDescription || description, true);
    if (ogImage) setMetaTag("og:image", ogImage, true);
    if (ogType) setMetaTag("og:type", ogType, true);
    if (twitterCard) setMetaTag("twitter:card", twitterCard);
    if (ogTitle || title) setMetaTag("twitter:title", ogTitle || title);
    if (ogDescription || description) setMetaTag("twitter:description", ogDescription || description);
    if (ogImage) setMetaTag("twitter:image", ogImage);
    if (finalCanonical) {
      // Self-referential canonical per language variant: Hindi pages canonicalise
      // to /hi/<path>, English pages to /<path>. Reciprocal hreflang alternates
      // declare the other language twin so Google can pair them.
      setLinkTag("canonical", finalCanonical);
      setLinkTag("alternate", enCanonical, { hreflang: "en-IN" });
      setLinkTag("alternate", hiCanonical, { hreflang: "hi-IN" });
      setLinkTag("alternate", enCanonical, { hreflang: "x-default" });
    }
    if (noindex) {
      setMetaTag("robots", "noindex, nofollow");
    } else {
      setMetaTag("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // Reconcile optional tags so absent props don't leak between PageSeo navigations
    if (!keywords) setMetaTag("keywords", "");
    if (!ogImage) {
      setMetaTag("og:image", "", true);
      setMetaTag("twitter:image", "");
    }
    if (!ogType) setMetaTag("og:type", "", true);
    if (!twitterCard) setMetaTag("twitter:card", "");

    extraMeta?.forEach((m) => setMetaTag(m.name, m.content, m.property));

    const activeSchemas = (schemas || []).filter(Boolean) as Schema[];
    activeSchemas.forEach((s) => setJsonLd(s.id, s.payload));

    return () => {
      activeSchemas.forEach((s) => setJsonLd(s.id, null));
      extraMeta?.forEach((m) => setMetaTag(m.name, "", m.property));
    };
  }, [title, description, keywords, ogTitle, ogDescription, ogImage, ogType, twitterCard, canonical, noindex, location, JSON.stringify(schemas), JSON.stringify(extraMeta)]);

  return null;
}
