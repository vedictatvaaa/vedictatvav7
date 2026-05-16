import { useEffect } from "react";
import { useLocation } from "wouter";
import { useSiteSettings } from "@/lib/site-settings";

// SiteSchemas emits WebSite (with SearchAction for the Google sitelinks search box)
// and SiteNavigationElement schema listing primary nav so Google can pick rich
// sitelinks for brand queries like "vedic tatva". Both schemas are emitted on
// every page so any landing page is eligible for sitelinks treatment.

const PRIMARY_NAV: Array<{ name: string; url: string }> = [
  { name: "Home", url: "/" },
  { name: "Shop", url: "/shop" },
  { name: "Puja Essentials", url: "/spiritual-essentials" },
  { name: "Book a Pandit", url: "/pandits" },
  { name: "Book a Puja", url: "/online-puja-booking" },
  { name: "Pind Daan", url: "/pind-daan" },
  { name: "Astrology", url: "/astrology" },
  { name: "AI Kundli", url: "/ai-kundli" },
  { name: "Panchang", url: "/panchang-calendar" },
  { name: "Matrimony", url: "/matrimony" },
  { name: "Become a Pandit", url: "/become-pandit" },
  { name: "Become an Astrologer", url: "/become-astrologer" },
];

function setJsonLd(id: string, payload: any) {
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

export default function SiteSchemas() {
  const site = useSiteSettings();
  const [location] = useLocation();

  useEffect(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    if (!origin) return;
    const siteName = site?.siteName || "Vedic Tatva";

    // WebSite schema with SearchAction = required pattern for Google sitelinks search box.
    setJsonLd("website", {
      "@context": "https://schema.org",
      "@type": "WebSite",
      "@id": `${origin}/#website`,
      url: `${origin}/`,
      name: siteName,
      alternateName: ["Vedic Tatva", "VedicTatva"],
      description: site?.tagline || "India's premium Hindu spiritual ecommerce — puja samagri, pandit booking, astrology",
      inLanguage: "en-IN",
      publisher: { "@id": `${origin}/#organization` },
      potentialAction: {
        "@type": "SearchAction",
        target: {
          "@type": "EntryPoint",
          urlTemplate: `${origin}/shop?q={search_term_string}`,
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
    if (location.startsWith("/category/") || location === "/shop" || location === "/spiritual-essentials") {
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
