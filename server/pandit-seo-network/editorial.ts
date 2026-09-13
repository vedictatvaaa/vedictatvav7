import { storage } from "../storage";
import type { HierarchicalLocation, LocationEditorial } from "./state-city-seo";

/** Persisted review gate shared by SSR, APIs, and sitemap generation. */
export async function getPublishedLocationEditorial(
  location: HierarchicalLocation,
): Promise<LocationEditorial | null> {
  const entityType = location.kind === "state" ? "state" : "city";
  const entityKey = location.kind === "state"
    ? `state:${location.state?.id}`
    : location.city?.entityId || "";
  const row = await storage.getPanditSeoEditorial(entityType as any, entityKey);
  if (!row || row.status !== "published" || !row.introduction?.trim()) return null;
  return {
    introduction: row.introduction,
    faqs: Array.isArray(row.faqs) ? row.faqs as LocationEditorial["faqs"] : [],
    status: row.status,
  };
}

export function locationEditorialIsIndexable(
  location: HierarchicalLocation,
  editorial: LocationEditorial | null,
) {
  return location.indexability.indexable
    && editorial?.status === "published"
    && Boolean(editorial.introduction?.trim());
}