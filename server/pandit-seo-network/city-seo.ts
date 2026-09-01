import type { CityHubProjection, CityServiceProjection } from "./project";

type CitySeoHead = {
  title: string;
  description: string;
  canonical: string;
  ogType: string;
  robotsIndex: boolean;
  robotsFollow: boolean;
  jsonLd: Array<{ id: string; payload: Record<string, any> }>;
};

export function buildPanditCitySeoHead(
  city: CityHubProjection,
  baseUrl: string,
  service?: CityServiceProjection,
): CitySeoHead {
  const canonical = service?.canonicalUrl || city.canonicalUrl;
  if (!canonical) throw new Error("Canonical Pandit location URL is required");
  const url = `${baseUrl}${canonical}`;
  const name = service
    ? `${service.service.name} Pandits in ${city.city.name}`
    : `Pandits in ${city.city.name}`;
  const providers = service?.providers || city.providers;
  const description = service
    ? `View published Pandits offering ${service.service.name} in ${city.city.name}, ${city.state.name}, and continue to booking.`
    : `View published Pandits and canonical puja services in ${city.city.name}, ${city.state.name}, and continue to booking.`;
  const crumbs = [
    { name: "Home", item: `${baseUrl}/` },
    { name: "Pandits", item: `${baseUrl}/book-pandit-online` },
    { name: city.city.name, item: `${baseUrl}${city.canonicalUrl}` },
    ...(service ? [{ name: service.service.name, item: url }] : []),
  ];
  const schemas: CitySeoHead["jsonLd"] = [{
    id: "pandit-location-breadcrumb",
    payload: {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "@id": `${url}#breadcrumb`,
      itemListElement: crumbs.map((crumb, index) => ({
        "@type": "ListItem", position: index + 1, ...crumb,
      })),
    },
  }, {
    id: "pandit-location-list",
    payload: {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "@id": `${url}#pandits`,
      name,
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: provider.pandit!.name,
        url: `${baseUrl}${provider.canonicalUrl}`,
      })),
    },
  }];
  if (service) {
    schemas.push({
      id: "pandit-location-service",
      payload: {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${url}#service`,
        name: service.service.name,
        serviceType: service.service.name,
        areaServed: {
          "@type": "City",
          name: city.city.name,
          containedInPlace: { "@type": "State", name: city.state.name },
        },
        provider: { "@id": `${baseUrl}/#organization` },
        url,
      },
    });
  }
  return {
    title: `${name} | Vedic Tatva`,
    description,
    canonical,
    ogType: "website",
    robotsIndex: (service || city).indexability.indexable,
    robotsFollow: true,
    jsonLd: schemas,
  };
}