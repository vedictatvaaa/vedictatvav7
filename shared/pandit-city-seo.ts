export type PanditCitySeoProvider = {
  canonicalUrl?: string | null;
  pandit?: { name?: string | null } | null;
};

export type PanditCitySeoInput = {
  canonicalUrl: string;
  city: { name: string; canonicalUrl: string };
  state: { name: string };
  providers: PanditCitySeoProvider[];
  indexable: boolean;
  service?: { name: string };
};

const absolute = (origin: string, path: string) => `${origin}${path.startsWith("/") ? "" : "/"}${path}`;

export function panditCitySeoOrigin(canonicalHref: string | null | undefined, fallbackOrigin: string) {
  try {
    return canonicalHref ? new URL(canonicalHref).origin : fallbackOrigin;
  } catch {
    return fallbackOrigin;
  }
}

/** The single source of SEO facts for canonical city and city-service pages. */
export function buildPanditCitySeo(input: PanditCitySeoInput, origin: string) {
  const url = absolute(origin, input.canonicalUrl);
  const pageName = input.service
    ? `${input.service.name} Pandits in ${input.city.name}`
    : `Pandits in ${input.city.name}`;
  const description = input.service
    ? `Compare ${input.providers.length} published Vedic Pandits in ${input.city.name} who offer ${input.service.name}. View exact services and book with canonical location context.`
    : `Compare ${input.providers.length} published Vedic Pandits in ${input.city.name}, ${input.state.name}. Explore their exact services and book with verified location context.`;
  const breadcrumbs = [
    { name: "Home", item: absolute(origin, "/") },
    { name: "Pandits", item: absolute(origin, "/book-pandit-online") },
    { name: input.city.name, item: absolute(origin, input.city.canonicalUrl) },
    ...(input.service ? [{ name: input.service.name, item: url }] : []),
  ];
  const schemas = [
    {
      id: "breadcrumb",
      payload: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: breadcrumbs.map((item, index) => ({
          "@type": "ListItem", position: index + 1, name: item.name, item: item.item,
        })),
      },
    },
    {
      id: "item-list",
      payload: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${url}#pandits`,
        name: pageName,
        numberOfItems: input.providers.length,
        itemListElement: input.providers.map((provider, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: provider.pandit?.name || "",
          ...(provider.canonicalUrl ? { url: absolute(origin, provider.canonicalUrl) } : {}),
        })),
      },
    },
    ...(input.service ? [{
      id: "service",
      payload: {
        "@context": "https://schema.org",
        "@type": "Service",
        "@id": `${url}#service`,
        name: `${input.service.name} in ${input.city.name}`,
        serviceType: input.service.name,
        areaServed: {
          "@type": "City",
          name: input.city.name,
          containedInPlace: { "@type": "State", name: input.state.name },
        },
        provider: { "@id": `${origin}/#organization` },
        url,
      },
    }] : []),
  ];
  return {
    title: `${pageName} | Vedic Tatva`,
    description,
    canonical: input.canonicalUrl,
    indexable: input.indexable,
    schemas,
  };
}