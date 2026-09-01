import type { PanditSeoNetworkProjection } from "./project";

export function indexableProfileSlugs(projection: PanditSeoNetworkProjection): Set<string> {
  return new Set(
    projection.profiles
      .filter((profile) => profile.indexability.indexable && profile.pandit?.slug)
      .map((profile) => profile.pandit!.slug!),
  );
}