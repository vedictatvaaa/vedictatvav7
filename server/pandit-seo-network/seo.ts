import type { PanditProfileProjection } from "./project";

type SeoHead = {
  title: string;
  description: string;
  canonical: string;
  ogImage?: string;
  ogType: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  jsonLd: Array<{ id: string; payload: Record<string, any> }>;
};

function asList(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === "string");
  if (typeof value === "string") return value.split(",").map((item) => item.trim()).filter(Boolean);
  return [];
}

export function buildPanditProfileSeoHead(
  profile: PanditProfileProjection,
  baseUrl: string,
): SeoHead {
  if (!profile.pandit?.slug) throw new Error("Public Pandit profile slug is required");
  const pandit = profile.pandit;
  const canonical = profile.canonicalUrl || `/pandit/${pandit.slug}`;
  const canonicalUrl = `${baseUrl}${canonical}`;
  const cityPart = pandit.city ? ` in ${pandit.city}` : "";
  const ratingPart = pandit.rating && pandit.reviewCount
    ? ` · ${Number(pandit.rating).toFixed(1)}★ (${pandit.reviewCount})`
    : "";
  const languages = asList(pandit.languages);
  const specializations = asList(pandit.specialization);
  const description = pandit.bio?.slice(0, 200)
    || `View published Vedic puja services from ${pandit.name}${cityPart} and request a booking through Vedic Tatva.`;
  const person: Record<string, any> = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${canonicalUrl}#person`,
    name: pandit.name,
    url: canonicalUrl,
    description,
    image: pandit.image
      ? (/^https?:\/\//i.test(pandit.image) ? pandit.image : `${baseUrl}${pandit.image.startsWith("/") ? "" : "/"}${pandit.image}`)
      : undefined,
    jobTitle: "Vedic Pandit",
    knowsLanguage: languages.length ? languages : undefined,
    knowsAbout: specializations.length ? specializations : undefined,
    address: pandit.city || pandit.state ? {
      "@type": "PostalAddress",
      addressLocality: pandit.city || undefined,
      addressRegion: pandit.state || undefined,
      addressCountry: "IN",
    } : undefined,
  };
  if (Number(pandit.rating) > 0 && Number(pandit.reviewCount) > 0) {
    person.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: Number(pandit.rating),
      reviewCount: Number(pandit.reviewCount),
      bestRating: 5,
      worstRating: 1,
    };
  }
  const offers = profile.services.map((service) => ({
    "@type": "Offer",
    url: `${canonicalUrl}#${service.slug}`,
    priceCurrency: "INR",
    ...(Number(service.price) > 0 ? { price: Number(service.price) } : {}),
    itemOffered: {
      "@type": "Service",
      name: service.name,
      description: service.description || undefined,
      serviceType: service.serviceType || service.category || undefined,
      areaServed: service.serviceAreas?.length ? service.serviceAreas : undefined,
      availableChannel: service.mode === "online" ? {
        "@type": "ServiceChannel",
        serviceUrl: canonicalUrl,
      } : undefined,
    },
  }));
  if (offers.length) person.makesOffer = offers;

  return {
    title: `${pandit.name} — ${pandit.verified ? "Verified " : ""}Vedic Pandit${cityPart}${ratingPart} · Vedic Tatva`,
    description,
    canonical,
    ogImage: `/api/og/p/${pandit.slug}.jpg`,
    ogType: "profile",
    robotsIndex: profile.indexability.indexable,
    robotsFollow: true,
    jsonLd: [
      { id: "pandit-person", payload: person },
      {
        id: "pandit-breadcrumb",
        payload: {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "@id": `${canonicalUrl}#breadcrumb`,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "Home", item: `${baseUrl}/` },
            { "@type": "ListItem", position: 2, name: "Pandits", item: `${baseUrl}/book-pandit-online` },
            { "@type": "ListItem", position: 3, name: pandit.name, item: canonicalUrl },
          ],
        },
      },
    ],
  };
}