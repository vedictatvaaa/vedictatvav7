import type { PanditSeoNetworkProjection } from "./project";
import { cleanLocationSlug } from "./state-city-seo";

export function indexableProfileSlugs(projection: PanditSeoNetworkProjection): Set<string> {
  return new Set(
    projection.profiles
      .filter((profile) => profile.indexability.indexable && profile.pandit?.slug)
      .map((profile) => profile.pandit!.slug!),
  );
}

/** Returns hierarchy candidates only; editorial publication is applied by the
 * async public sitemap selector before these are emitted. */
export function indexablePanditLocationPaths(projection: PanditSeoNetworkProjection): Set<string> {
  const paths = new Set<string>();
  projection.cities.forEach((city) => {
    if (!city.indexability.indexable) return;
    const stateSlug = cleanLocationSlug(city.state?.name || "");
    const citySlug = cleanLocationSlug(city.city?.name || "");
    if (stateSlug) paths.add(`/book-pandit-online/${stateSlug}`);
    if (stateSlug && citySlug) paths.add(`/book-pandit-online/${stateSlug}/${citySlug}`);
  });
  return paths;
}