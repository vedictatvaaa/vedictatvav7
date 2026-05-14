import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import type { SeoPage } from "@shared/schema";
import { useSiteSettings } from "@/lib/site-settings";
import { setMetaTag, setLinkTag, setJsonLd, usePageSeoActive } from "@/lib/seo-dom";

function buildBreadcrumbs(pathname: string, origin: string, siteName: string) {
  if (!pathname || pathname === "/") return null;
  const segments = pathname.split("/").filter(Boolean);
  const items: any[] = [
    { "@type": "ListItem", position: 1, name: siteName, item: `${origin}/` },
  ];
  let cumulative = "";
  segments.forEach((seg, idx) => {
    cumulative += "/" + seg;
    const label = decodeURIComponent(seg)
      .replace(/[-_]+/g, " ")
      .replace(/\b\w/g, (c) => c.toUpperCase());
    items.push({
      "@type": "ListItem",
      position: idx + 2,
      name: label,
      item: `${origin}${cumulative}`,
    });
  });
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items,
  };
}

const DEFAULTS = {
  title: "Vedic Tatva - Premium Spiritual Products & Services",
  description: "Shop authentic spiritual products, book verified pandits, get AI-powered astrology services, and explore sacred rituals at Vedic Tatva.",
  ogImage: "",
};

export default function SeoHead() {
  const [location] = useLocation();
  const site = useSiteSettings();
  // When any <PageSeo /> is mounted, this page owns its own meta/title/og/canonical.
  // SeoHead only fills auto-breadcrumb + GSC verification + safe defaults so the page
  // never appears with stale meta from a previous route.
  const pageManaged = usePageSeoActive() > 0;

  const { data: seoData } = useQuery<SeoPage | null>({
    queryKey: ["/api/seo-pages/by-path", location],
    queryFn: async () => {
      const res = await fetch(`/api/seo-pages/by-path?path=${encodeURIComponent(location)}`);
      if (!res.ok) return null;
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    enabled: !pageManaged,
  });

  // For product pages, fetch the product so we can emit FAQPage + VideoObject schema.
  // URL pattern is /product/{slug-or-id} — try slug first, fall back to numeric id.
  const productKey = location.startsWith("/product/") ? location.slice("/product/".length).split("?")[0].split("#")[0] : null;
  const { data: productData } = useQuery<any>({
    queryKey: ["/api/products/lookup", productKey],
    queryFn: async () => {
      if (!productKey) return null;
      const slugRes = await fetch(`/api/products/slug/${encodeURIComponent(productKey)}`);
      if (slugRes.ok) return slugRes.json();
      if (/^\d+$/.test(productKey)) {
        const idRes = await fetch(`/api/products/${productKey}`);
        if (idRes.ok) return idRes.json();
      }
      return null;
    },
    enabled: !!productKey,
    staleTime: 5 * 60 * 1000,
  });

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const defaultCanonical = origin ? `${origin}${location}` : "";
    const siteName = site?.siteName || "Vedic Tatva";

    // Auto-breadcrumb only when no PageSeo owns the page — otherwise the
    // page's own breadcrumb schema (same id="breadcrumb") would race this one.
    if (origin && !pageManaged) {
      setJsonLd("breadcrumb", buildBreadcrumbs(location, origin, siteName));
    }

    // Google Search Console meta-tag verification — always present if configured.
    if (site?.gscVerification) {
      setMetaTag("google-site-verification", site.gscVerification);
    }

    // If a <PageSeo /> is mounted, the page owns the rest of head — bail.
    if (pageManaged) return;

    const fallbackTitle = site?.siteName ? `${site.siteName} — ${site.tagline || DEFAULTS.description.split(",")[0]}` : DEFAULTS.title;
    const fallbackDesc = site?.tagline || DEFAULTS.description;
    const fallbackOgImage = site?.heroImageUrl || site?.logoUrl || DEFAULTS.ogImage;

    if (!seoData || !seoData.isActive) {
      document.title = fallbackTitle;
      setMetaTag("description", fallbackDesc);
      setMetaTag("og:title", fallbackTitle, true);
      setMetaTag("og:description", fallbackDesc, true);
      setMetaTag("og:site_name", siteName, true);
      if (fallbackOgImage) setMetaTag("og:image", fallbackOgImage, true);
      if (defaultCanonical) {
        setLinkTag("canonical", defaultCanonical);
        setLinkTag("alternate", defaultCanonical, { hreflang: "en-IN" });
        setLinkTag("alternate", defaultCanonical, { hreflang: "x-default" });
      }
      setMetaTag("robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
      return;
    }

    document.title = seoData.metaTitle || fallbackTitle;
    setMetaTag("description", seoData.metaDescription || fallbackDesc);
    if (seoData.metaKeywords) setMetaTag("keywords", seoData.metaKeywords);

    setMetaTag("og:site_name", siteName, true);
    setMetaTag("og:title", seoData.ogTitle || seoData.metaTitle || fallbackTitle, true);
    setMetaTag("og:description", seoData.ogDescription || seoData.metaDescription || fallbackDesc, true);
    setMetaTag("og:image", seoData.ogImage || fallbackOgImage, true);
    if (seoData.ogType) setMetaTag("og:type", seoData.ogType, true);

    if (seoData.twitterTitle) setMetaTag("twitter:title", seoData.twitterTitle);
    if (seoData.twitterDescription) setMetaTag("twitter:description", seoData.twitterDescription);
    if (seoData.twitterImage) setMetaTag("twitter:image", seoData.twitterImage);

    setLinkTag("canonical", seoData.canonicalUrl || defaultCanonical);
    if (defaultCanonical) {
      setLinkTag("alternate", defaultCanonical, { hreflang: "en-IN" });
      setLinkTag("alternate", defaultCanonical, { hreflang: "x-default" });
    }

    const robotsParts: string[] = [];
    robotsParts.push(seoData.robotsIndex ? "index" : "noindex");
    robotsParts.push(seoData.robotsFollow ? "follow" : "nofollow");
    setMetaTag("robots", robotsParts.join(", "));

    if (seoData.schemaMarkup) {
      let scriptEl = document.querySelector('script[data-seo-schema]') as HTMLScriptElement;
      if (!scriptEl) {
        scriptEl = document.createElement("script");
        scriptEl.type = "application/ld+json";
        scriptEl.setAttribute("data-seo-schema", "true");
        document.head.appendChild(scriptEl);
      }
      scriptEl.textContent = seoData.schemaMarkup;
    }

    if (seoData.customHeadTags) {
      // Sanitize: only allow <meta> and <link> tags. Strip <script>, on* handlers, and javascript: URLs.
      const tmp = document.createElement("template");
      tmp.innerHTML = seoData.customHeadTags;
      const safeFragment = document.createDocumentFragment();
      tmp.content.querySelectorAll("meta, link").forEach((node) => {
        const tag = node.tagName.toLowerCase();
        const safe = document.createElement(tag);
        for (const attr of Array.from(node.attributes)) {
          const an = attr.name.toLowerCase();
          const av = attr.value;
          if (an.startsWith("on")) continue;
          if (/^(href|src)$/.test(an) && /^\s*javascript:/i.test(av)) continue;
          safe.setAttribute(attr.name, av);
        }
        safeFragment.appendChild(safe);
      });
      let container = document.querySelector('[data-seo-custom]');
      if (!container) {
        container = document.createElement("div");
        container.setAttribute("data-seo-custom", "true");
        container.setAttribute("style", "display:none");
        document.head.appendChild(container);
      }
      container.textContent = "";
      container.appendChild(safeFragment);
    }

    return () => {
      document.querySelector('script[data-seo-schema]')?.remove();
      document.querySelector('[data-seo-custom]')?.remove();
    };
  }, [seoData, location, pageManaged, site?.siteName, site?.tagline, site?.heroImageUrl, site?.logoUrl, site?.gscVerification]);

  // Inject FAQPage + VideoObject JSON-LD for products with seoFaq / seoVideoUrl
  useEffect(() => {
    if (!productData) {
      setJsonLd("product-faq", null);
      setJsonLd("product-video", null);
      return;
    }

    const faqs = Array.isArray(productData.seoFaq) ? productData.seoFaq : null;
    if (faqs && faqs.length > 0) {
      setJsonLd("product-faq", {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqs
          .filter((f: any) => f && f.question && f.answer)
          .map((f: any) => ({
            "@type": "Question",
            name: f.question,
            acceptedAnswer: { "@type": "Answer", text: f.answer },
          })),
      });
    } else {
      setJsonLd("product-faq", null);
    }

    const videoUrl: string | null = productData.seoVideoUrl || null;
    if (videoUrl) {
      const ytMatch = videoUrl.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{6,})/);
      const ytId = ytMatch?.[1];
      const thumbnail = ytId
        ? `https://i.ytimg.com/vi/${ytId}/hqdefault.jpg`
        : (productData.imageUrl || productData.image || "");
      setJsonLd("product-video", {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: `${productData.name} — Product Video`,
        description: productData.shortDescription || productData.description || productData.name,
        thumbnailUrl: thumbnail,
        uploadDate: productData.createdAt || new Date().toISOString(),
        contentUrl: videoUrl,
        embedUrl: ytId ? `https://www.youtube.com/embed/${ytId}` : videoUrl,
      });
    } else {
      setJsonLd("product-video", null);
    }

    return () => {
      setJsonLd("product-faq", null);
      setJsonLd("product-video", null);
    };
  }, [productData]);

  return null;
}
