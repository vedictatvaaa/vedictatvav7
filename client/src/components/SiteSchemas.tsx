import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSiteSettings } from "@/lib/site-settings";
import { setJsonLd } from "@/lib/seo-dom";
import { SEO_CANONICAL_ORIGIN } from "@shared/seo-metadata";

// SiteSchemas emits WebSite (with SearchAction for the Google sitelinks search box)
// and SiteNavigationElement schema listing primary nav so Google can pick rich
// sitelinks for brand queries like "vedic tatva". Both schemas are emitted on
// every page so any landing page is eligible for sitelinks treatment.

const PRIMARY_NAV: Array<{ name: string; url: string }> = [
  { name: "Home", url: "/" },
  { name: "Shop", url: "/puja-samagri-online" },
  { name: "Puja Essentials", url: "/spiritual-essentials" },
  { name: "Book a Pandit", url: "/book-pandit-online" },
  { name: "Book a Puja", url: "/online-puja-booking" },
  { name: "Pind Daan", url: "/pind-daan-booking" },
  { name: "Astrology", url: "/astrology" },
  { name: "AI Kundli", url: "/ai-kundli" },
  { name: "Panchang", url: "/panchang-calendar" },
  { name: "Matrimony", url: "/matrimony" },
  { name: "Become a Pandit", url: "/become-pandit" },
  { name: "Become an Astrologer", url: "/become-astrologer" },
];

export default function SiteSchemas() {
  const site = useSiteSettings();
  const [location] = useLocation();

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return;
    const siteName = site?.siteName || "Vedic Tatva";

    // NOTE: the Organization (#organization) node is emitted by OrganizationSchema.tsx
    // (mounted alongside this in App.tsx). Do not duplicate it here — the WebSite
    // schema below references it by @id and Google consolidates the two.

    // WebSite schema with SearchAction = required pattern for Google sitelinks search box.
    setJsonLd("website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${SEO_CANONICAL_ORIGIN}/#website`,
      url: `${SEO_CANONICAL_ORIGIN}/`,
      name: siteName,
      alternateName: ["Vedic Tatva", "VedicTatva"],
      description: site?.tagline || "India's premium Hindu spiritual ecommerce — puja samagri, pandit booking, astrology",
      inLanguage: "en-IN",
      publisher: { "@id": `${SEO_CANONICAL_ORIGIN}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${SEO_CANONICAL_ORIGIN}/puja-samagri-online?q={search_term_string}`,
        },
        "query-input": "required name=search_term_string",
      },
    });

    // SiteNavigationElement — gives Google a hint about top-level sitelink candidates.
    setJsonLd("site-nav", {
      "@context": "https://schema.org",
      "@type": "ItemList",
      itemListElement: PRIMARY_NAV.map((item, idx) => ({
        "@type": "SiteNavigationElement",
        position: idx + 1,
        name: item.name,
        url: `${origin}${item.url}`,
      })),
    });

    // CollectionPage hint on category landing pages helps sitelink selection
    if (location.startsWith("/category/") || location === "/puja-samagri-online" || location === "/spiritual-essentials") {
      setJsonLd("collection-page", {
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        url: `${origin}${location}`,
        name: siteName,
        isPartOf: { "@id": `${origin}/#website` },
      });
    } else {
      setJsonLd("collection-page", null);
    }

    return () => {
      // Keep schemas across navigations; only collection-page is per-route.
    };
  }, [site, location]);

  return null;
}
