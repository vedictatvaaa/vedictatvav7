import type { PanditSeoNetworkProjection } from "./project";

export function indexableProfileSlugs(projection: PanditSeoNetworkProjection): Set<string> {
  return new Set(
    projection.profiles
      .filter((profile) => profile.indexability.indexable && profile.pandit?.slug)
      .map((profile) => profile.pandit!.slug!),
  );
}

/** The sole selector used by sitemaps and public internal recommendations. */
export function indexablePanditLocationPaths(projection: PanditSeoNetworkProjection): Set<string> {
  const paths = new Set<string>();
  projection.cities.forEach((city) => {
    if (city.indexability.indexable && city.canonicalUrl) paths.add(city.canonicalUrl);
    city.services.forEach((service) => {
      if (service.indexability.indexable && service.canonicalUrl) paths.add(service.canonicalUrl);
    });
  });
  return paths;
}