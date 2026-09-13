import type { PanditSeoNetworkProjection, CityHubProjection, NetworkState } from "./project";
import { evaluateSupplyIndexability } from "./quality";

/**
 * The public location URL is deliberately derived from the location catalogue,
 * never from the free-form city/state fields on a Pandit record.  This keeps
 * aliases useful for discovery while giving every location one URL.
 */
export type HierarchicalLocation = {
  kind: "state" | "city";
  state?: NetworkState;
  city?: CityHubProjection;
  stateSlug: string;
  citySlug?: string;
  canonicalUrl: string;
  providers: CityHubProjection["providers"];
  indexability: ReturnType<typeof evaluateSupplyIndexability>;
};

export type LocationEditorial = {
  introduction?: string | null;
  faqs?: Array<{ question: string; answer: string }> | null;
  status?: string | null;
};

export const cleanLocationSlug = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .trim()
  .replace(/&/g, " and ")
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

const path = (...parts: string[]) => `/book-pandit-online/${parts.map(encodeURIComponent).join("/")}`;

function aliases(value: string | null | undefined) {
  return String(value || "").split(",").map((item) => cleanLocationSlug(item)).filter(Boolean);
}

function stateSlug(state: NetworkState) {
  return cleanLocationSlug(state.name) || cleanLocationSlug(state.code);
}

function cityMatches(city: CityHubProjection, value: string) {
  const wanted = cleanLocationSlug(value);
  const candidates = [
    city.city.slug,
    city.city.name,
    ...(Array.isArray((city.city as any).aliases) ? (city.city as any).aliases : []),
  ].flatMap((item) => [cleanLocationSlug(String(item)), ...aliases(String(item))]);
  // Canonical spellings required by the location design.  These are aliases,
  // not extra catalogue records.
  if (wanted === "gurgaon" && city.city.name.toLowerCase() === "gurugram") return true;
  if (wanted === "bangalore" && city.city.name.toLowerCase() === "bengaluru") return true;
  if (
    (wanted === "new-delhi" && city.city.name.toLowerCase() === "delhi")
    || (wanted === "delhi" && city.city.name.toLowerCase() === "new delhi")
  ) return true;
  return candidates.includes(wanted);
}

function stateMatches(state: NetworkState, value: string) {
  const wanted = cleanLocationSlug(value);
  return [stateSlug(state), cleanLocationSlug(state.code), cleanLocationSlug(state.name)].includes(wanted)
    || (wanted === "delhi" && state.name.toLowerCase() === "nct of delhi");
}

export function getHierarchicalLocation(
  projection: PanditSeoNetworkProjection,
  stateValue: string,
  cityValue?: string,
): HierarchicalLocation | null {
  const states = new Map<number, NetworkState>();
  projection.cities.forEach((entry) => states.set(entry.state.id, entry.state));
  const state = Array.from(states.values()).find((candidate) => stateMatches(candidate, stateValue));

  if (cityValue !== undefined) {
    const city = projection.cities.find((entry) =>
      entry.state.id === state?.id && cityMatches(entry, cityValue),
    );
    if (!state || !city) return null;
    const canonicalStateSlug = stateSlug(state);
    const canonicalCitySlug = cleanLocationSlug(city.city.name);
    return {
      kind: "city",
      state,
      city,
      stateSlug: canonicalStateSlug,
      citySlug: canonicalCitySlug,
      canonicalUrl: path(canonicalStateSlug, canonicalCitySlug),
      providers: city.providers,
      indexability: city.indexability,
    };
  }

  if (!state) return null;
  const cities = projection.cities.filter((entry) => entry.state.id === state.id);
  const providers = Array.from(
    new Map(cities.flatMap((entry) => entry.providers).map((provider) => [
      provider.entityId || provider.canonicalUrl || String(provider.pandit?.id),
      provider,
    ])).values(),
  );
  return {
    kind: "state",
    state,
    stateSlug: stateSlug(state),
    canonicalUrl: path(stateSlug(state)),
    providers,
    indexability: evaluateSupplyIndexability(providers.length, 3),
  };
}

export function canonicalCityLocationPath(city: CityHubProjection) {
  return path(stateSlug(city.state), cleanLocationSlug(city.city.name));
}

export function resolveLegacyCityLocation(
  projection: PanditSeoNetworkProjection,
  value: string,
) {
  const city = projection.cities.find((entry) => cityMatches(entry, value));
  if (!city) return null;
  return getHierarchicalLocation(projection, city.state.name, city.city.slug);
}

export function parsePanditLocationPath(pathname: string) {
  const match = pathname.match(/^\/book-pandit-online\/([^/?#]+)(?:\/([^/?#]+))?\/?$/);
  if (!match) return null;
  return { stateValue: decode(match[1]), cityValue: match[2] ? decode(match[2]) : undefined };
}

function decode(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function buildHierarchicalLocationSeo(
  location: HierarchicalLocation,
  origin: string,
  editorial?: LocationEditorial | null,
) {
  const canonical = location.canonicalUrl;
  const site = origin.replace(/\/+$/, "");
  const url = `${site}${canonical}`;
  const stateName = location.state?.name || "";
  const cityName = location.city?.city.name;
  const label = cityName ? `Pandits in ${cityName}` : `Pandits in ${stateName}`;
  const count = location.providers.length;
  const description = cityName
    ? `Compare ${count} published Vedic Pandits in ${cityName}, ${stateName}. Explore their exact services and request a booking through Vedic Tatva.`
    : `Compare ${count} published Vedic Pandits across ${stateName}. Explore canonical city pages and request a booking through Vedic Tatva.`;
  const crumbs = [
    { name: "Home", item: `${site}/` },
    { name: "Pandits", item: `${site}/book-pandit-online` },
    ...(cityName
      ? [
        { name: stateName, item: `${site}${path(location.stateSlug)}` },
        { name: cityName, item: url },
      ]
      : [{ name: stateName, item: url }]),
  ];
  const schemas: Array<{ id: string; payload: Record<string, any> }> = [
    {
      id: "pandit-location-breadcrumb",
      payload: {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        "@id": `${url}#breadcrumb`,
        itemListElement: crumbs.map((item, index) => ({
          "@type": "ListItem", position: index + 1, ...item,
        })),
      },
    },
    {
      id: "pandit-location-list",
      payload: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        "@id": `${url}#pandits`,
        name: label,
        numberOfItems: count,
        itemListElement: location.providers.map((provider, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: provider.pandit?.name || "",
          ...(provider.canonicalUrl ? { url: `${site}${provider.canonicalUrl}` } : {}),
        })),
      },
    },
    {
      id: "pandit-location-place",
      payload: cityName
        ? {
          "@context": "https://schema.org",
          "@type": "City",
          "@id": `${url}#place`,
          name: cityName,
          containedInPlace: { "@type": "State", name: stateName },
          url,
        }
        : {
          "@context": "https://schema.org",
          "@type": "State",
          "@id": `${url}#place`,
          name: stateName,
          containedInPlace: { "@type": "Country", name: "India" },
          url,
        },
    },
  ];
  const publishedEditorial = editorial?.status === "published";
  if (publishedEditorial && editorial?.faqs?.length) {
    schemas.push({
      id: "pandit-location-faq",
      payload: {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "@id": `${url}#faq`,
        mainEntity: editorial.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    });
  }
  return {
    title: `${label} | Vedic Tatva`,
    description,
    canonical,
    introduction: publishedEditorial ? editorial?.introduction || "" : "",
    indexable: location.indexability.indexable
      && publishedEditorial
      && Boolean(editorial?.introduction?.trim()),
    schemas,
  };
}

export function hierarchicalLocationSitemapPaths(projection: PanditSeoNetworkProjection) {
  const paths = new Set<string>();
  const states = new Set<number>();
  projection.cities.forEach((city) => states.add(city.state.id));
  states.forEach((id) => {
    const state = projection.cities.find((city) => city.state.id === id)?.state;
    if (!state) return;
    const stateLocation = getHierarchicalLocation(projection, state.name);
    if (stateLocation?.indexability.indexable) paths.add(stateLocation.canonicalUrl);
  });
  projection.cities.forEach((city) => {
    const location = getHierarchicalLocation(projection, city.state.name, city.city.name);
    if (location?.indexability.indexable) paths.add(location.canonicalUrl);
  });
  return paths;
}