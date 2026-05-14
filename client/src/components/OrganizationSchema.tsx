import { useEffect } from "react";
import { useSiteSettings } from "@/lib/site-settings";

// OrganizationSchema injects a site-wide JSON-LD block so Google can connect
// the Business Profile (GMB), social accounts, and contact points to this
// domain. This augments page-specific schemaMarkup — never replaces it.
//
// When a street address is present we upgrade to LocalBusiness; otherwise we
// emit Organization. Both types use the same @id so Google treats them as one
// entity regardless of which a specific page emits.
export default function OrganizationSchema() {
  const site = useSiteSettings();

  useEffect(() => {
    if (!site || !site.siteName) return;
    const origin = typeof window !== "undefined" ? window.location.origin : "";
    const id = `${origin}/#organization`;

    const sameAs = [
      site.socialInstagram,
      site.socialFacebook,
      site.socialYoutube,
      (site as any).socialTwitter,
      (site as any).socialLinkedin,
      (site as any).googleBusinessProfileUrl,
    ].filter(Boolean);

    const contactPoint = site.contactPhone
      ? [{
          "@type": "ContactPoint",
          telephone: site.contactPhone,
          contactType: "customer service",
          email: site.contactEmail || undefined,
          areaServed: "IN",
          availableLanguage: ["en", "hi"],
        }]
      : undefined;

    const hasAddress = !!(site as any).businessStreet;
    const address = hasAddress
      ? {
          "@type": "PostalAddress",
          streetAddress: (site as any).businessStreet,
          addressLocality: (site as any).businessCity || undefined,
          addressRegion: (site as any).businessRegion || undefined,
          postalCode: (site as any).businessPostalCode || undefined,
          addressCountry: (site as any).businessCountry || "IN",
        }
      : undefined;

    const payload: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": hasAddress ? "LocalBusiness" : "Organization",
      "@id": id,
      name: site.siteName,
      url: origin || undefined,
      description: site.tagline || undefined,
      logo: site.logoUrl || undefined,
      image: site.heroImageUrl || site.logoUrl || undefined,
      email: site.contactEmail || undefined,
      telephone: site.contactPhone || undefined,
      sameAs: sameAs.length > 0 ? sameAs : undefined,
      contactPoint,
      address,
    };
    // Remove undefined keys for a clean payload.
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    let el = document.getElementById("ld-org-schema") as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement("script");
      el.id = "ld-org-schema";
      el.type = "application/ld+json";
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(payload);
  }, [site]);

  return null;
}
