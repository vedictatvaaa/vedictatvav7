import { useEffect } from "react";
import { useLocation } from "wouter";
import {
  setMetaTag,
  setJsonLd,
  incrementPageSeo,
  decrementPageSeo,
  applySeoMetadata,
  getInitialSsrMetadata,
} from "@/lib/seo-dom";
import type { Schema } from "@/lib/seo-schemas";
import { normalizeSeoPath, resolveSeoMetadata } from "@shared/seo-metadata";

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
    const pathname = normalizeSeoPath(actualPath);
    const metadata = getInitialSsrMetadata(pathname) || resolveSeoMetadata({
      title,
      description,
      keywords,
      ogTitle,
      ogDescription,
      ogImage,
      ogType,
      twitterCard,
      canonical: canonical || pathname,
      requestPath: pathname,
      origin,
      noindex,
    });
    applySeoMetadata(metadata);

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
