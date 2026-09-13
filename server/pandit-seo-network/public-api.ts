import type { Express, NextFunction, Request, Response } from "express";
import type {
  CityHubProjection,
  CityServiceProjection,
  PanditProfileProjection,
  PanditSeoNetworkProjection,
} from "./project";
import {
  getPanditSeoNetworkProjection,
  invalidatePanditSeoNetworkCache,
} from "./cache";
import { storage } from "../storage";
import {
  cleanLocationSlug,
  getHierarchicalLocation,
  resolveLegacyCityLocation,
} from "./state-city-seo";
import {
  getPublishedLocationEditorial,
  locationEditorialIsIndexable,
} from "./editorial";
import { resolveActiveCatalogueLocation } from "../pandit-location-catalogue";

export function isPanditSeoNetworkEnabled(settings: { panditSeoNetworkEnabled?: boolean } | undefined) {
  return settings?.panditSeoNetworkEnabled === true;
}

export async function getPanditSeoNetworkSitemapPages() {
  if (!isPanditSeoNetworkEnabled(await storage.getSiteSettings())) return [];
  const projection = await getPanditSeoNetworkProjection();
  const locations = new Map<string, ReturnType<typeof getHierarchicalLocation>>();
  for (const city of projection.cities) {
    const state = getHierarchicalLocation(projection, city.state.name);
    const location = getHierarchicalLocation(projection, city.state.name, city.city.name);
    if (state) locations.set(state.canonicalUrl, state);
    if (location) locations.set(location.canonicalUrl, location);
  }
  const pages = [];
  for (const location of Array.from(locations.values())) {
    if (!location) continue;
    let editorial = null;
    try {
      editorial = await getPublishedLocationEditorial(location);
    } catch {
      continue;
    }
    if (!locationEditorialIsIndexable(location, editorial)) continue;
    pages.push({
      loc: location.canonicalUrl,
      priority: location.kind === "state" ? "0.9" : "0.85",
      changefreq: "weekly",
    });
  }
  return pages;
}
export function selectPublicProfile(
  projection: PanditSeoNetworkProjection,
  slug: string,
): PanditProfileProjection | null {
  return projection.profiles.find((profile) =>
    profile.pandit?.slug === slug && profile.indexability.status !== "not_found",
  ) || null;
}

export function selectPublicProfileByPanditId(
  projection: PanditSeoNetworkProjection,
  panditId: number,
): PanditProfileProjection | null {
  return projection.profiles.find((profile) =>
    profile.entityId === `pandit:${panditId}`
    && Boolean(profile.pandit?.slug)
    && profile.indexability.status !== "not_found",
  ) || null;
}

export function selectablePublicPanditIds(
  projection: PanditSeoNetworkProjection,
): ReadonlySet<number> {
  return new Set(
    projection.profiles.flatMap((profile) =>
      profile.indexability.status !== "not_found"
      && profile.pandit?.slug
      && Number.isSafeInteger(profile.pandit.id)
        ? [profile.pandit.id]
        : [],
    ),
  );
}

export function filterBySelectablePublicPandits<T extends { panditId: number }>(
  rows: T[],
  projection: PanditSeoNetworkProjection,
): T[] {
  const allowedIds = selectablePublicPanditIds(projection);
  return rows.filter((row) => allowedIds.has(row.panditId));
}

/** Resolves the rollout boundary once per request for every public profile surface. */
type PublicProfileResolverDependencies = {
  getSettings: () => Promise<{ panditSeoNetworkEnabled?: boolean } | undefined>;
  getProjection: () => Promise<PanditSeoNetworkProjection>;
};

const publicProfileResolverDependencies: PublicProfileResolverDependencies = {
  getSettings: () => storage.getSiteSettings(),
  getProjection: () => getPanditSeoNetworkProjection(),
};

export async function resolvePublicPanditProfile(
  input: { slug?: string; panditId?: number },
  dependencies: PublicProfileResolverDependencies = publicProfileResolverDependencies,
): Promise<{ enabled: boolean; profile: PanditProfileProjection | null }> {
  const enabled = isPanditSeoNetworkEnabled(await dependencies.getSettings());
  if (!enabled) return { enabled: false, profile: null };
  if (!input.slug && !input.panditId) return { enabled: true, profile: null };
  const projection = await dependencies.getProjection();
  return {
    enabled: true,
    profile: input.slug
      ? selectPublicProfile(projection, input.slug)
      : input.panditId
        ? selectPublicProfileByPanditId(projection, input.panditId)
        : null,
  };
}

export function selectCityHub(
  projection: PanditSeoNetworkProjection,
  citySlug: string,
): CityHubProjection | null {
  const wanted = cleanLocationSlug(citySlug);
  if (!wanted) return null;
  return projection.cities.find((city) => {
    const candidates = [
      city.city.slug,
      city.city.name,
      ...(city.city.aliases || []),
    ]
      .filter((value): value is string => typeof value === "string" && value.trim().length > 0)
      .map(cleanLocationSlug)
      .filter(Boolean);
    return candidates.includes(wanted);
  }) || null;
}

export function selectCityService(
  projection: PanditSeoNetworkProjection,
  citySlug: string,
  serviceSlug: string,
): CityServiceProjection | null {
  return selectCityHub(projection, citySlug)?.services.find(
    (service) => service.service.slug === serviceSlug,
  ) || null;
}

export function selectHierarchicalPanditLocation(
  projection: PanditSeoNetworkProjection,
  stateSlug: string,
  citySlug?: string,
) {
  return getHierarchicalLocation(projection, stateSlug, citySlug);
}

export function selectLegacyPanditCityLocation(
  projection: PanditSeoNetworkProjection,
  citySlug: string,
) {
  return resolveLegacyCityLocation(projection, citySlug);
}

export async function resolvePublicPanditLocation(
  input: { citySlug: string; serviceSlug?: string },
  dependencies: PublicProfileResolverDependencies = publicProfileResolverDependencies,
): Promise<{ enabled: boolean; location: CityHubProjection | CityServiceProjection | null }> {
  const enabled = isPanditSeoNetworkEnabled(await dependencies.getSettings());
  if (!enabled) return { enabled: false, location: null };
  const projection = await dependencies.getProjection();
  return {
    enabled: true,
    location: input.serviceSlug
      ? selectCityService(projection, input.citySlug, input.serviceSlug)
      : selectCityHub(projection, input.citySlug),
  };
}

function cachePublicProjection(res: Response) {
  res.setHeader("Cache-Control", "no-store");
}

function routeParam(value: string | string[]) {
  return Array.isArray(value) ? value[0] || "" : value;
}

export function shouldInvalidatePanditSeoNetwork(method: string, requestPath: string) {
  if (!["POST", "PUT", "PATCH", "DELETE"].includes(method.toUpperCase())) return false;
  return [
    /^\/api\/pandit\/(?:storefront|services)(?:\/|$)/,
    /^\/api\/pandits(?:\/|$)/,
    /^\/api\/book-pandit-online(?:\/|$)/,
    /^\/api\/pandit-reviews(?:\/|$)/,
    /^\/api\/admin\/master-services(?:\/|$)/,
    /^\/api\/admin\/locations\/(?:states|cities)(?:\/|$)/,
    /^\/api\/admin\/pandit-storefronts(?:\/|$)/,
  ].some((pattern) => pattern.test(requestPath));
}

export function registerPanditSeoNetworkInvalidation(app: Express) {
  app.use((req, res, next) => {
    if (shouldInvalidatePanditSeoNetwork(req.method, req.path)) {
      res.once("finish", () => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          invalidatePanditSeoNetworkCache();
        }
      });
    }
    next();
  });
}

export function registerPanditSeoNetworkRoutes(app: Express) {
  // Keep this gate at the route boundary rather than in the pure projection
  // selectors, so tests and internal coverage evaluation remain available.
  app.use("/api/pandit-seo-network", async (_req, res, next) => {
    try {
      // Hierarchical location pages back the public directory, not only the
      // optional editorial SEO rollout.  Keep these resolvable so discovery
      // cards can always reach a known active city (including useful zero
      // supply/noindex pages); the profile/editorial endpoints remain gated.
      const isLocation = _req.path.startsWith("/locations/");
      if (!isLocation && !isPanditSeoNetworkEnabled(await storage.getSiteSettings())) {
        return res.status(404).json({ message: "Not found" });
      }
      return next();
    } catch (error) {
      return next(error);
    }
  });
  app.get("/api/pandit-seo-network/profiles/:slug", async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const profile = selectPublicProfile(
        await getPanditSeoNetworkProjection(),
        routeParam(req.params.slug),
      );
      if (!profile) return res.status(404).json({ message: "Pandit profile not found" });
      cachePublicProjection(res);
      return res.json(profile);
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/pandit-seo-network/cities/:citySlug", async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const city = selectCityHub(
        await getPanditSeoNetworkProjection(),
        routeParam(req.params.citySlug),
      );
      if (!city) return res.status(404).json({ message: "City not found" });
      const editorial = await storage.getPanditSeoEditorial("city", city.entityId);
      cachePublicProjection(res);
      return res.json({
        ...city,
        editorial: editorial?.status === "published"
          ? { introduction: editorial.introduction, faqs: editorial.faqs }
          : null,
      });
    } catch (error) {
      return next(error);
    }
  });

  // The discovery links carry a state and city identity. Resolve those
  // together so a catalogue slug such as "mh-mumbai" and the public spelling
  // "mumbai" address the same active city (and duplicate city names in
  // different states cannot collide).
  app.get("/api/pandit-seo-network/locations/:stateSlug/:citySlug", async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const location = selectHierarchicalPanditLocation(
        await getPanditSeoNetworkProjection(),
        routeParam(req.params.stateSlug),
        routeParam(req.params.citySlug),
      );
      if (!location || location.kind !== "city") {
        const catalogue = await resolveActiveCatalogueLocation(
          routeParam(req.params.stateSlug),
          routeParam(req.params.citySlug),
        );
        if (!catalogue) return res.status(404).json({ message: "City not found" });
        cachePublicProjection(res);
        return res.json({
          kind: "city",
          state: {
            id: catalogue.state.id,
            name: catalogue.state.name,
            code: catalogue.state.code,
          },
          city: {
            id: catalogue.city.id,
            stateId: catalogue.city.stateId,
            name: catalogue.city.name,
            slug: catalogue.city.slug,
          },
          canonicalUrl: `/book-pandit-online/${cleanLocationSlug(catalogue.state.name)}/${cleanLocationSlug(catalogue.city.name)}`,
          providers: [],
          services: [],
          indexability: {
            status: "noindex_projection_pending",
            indexable: false,
            reasons: ["seo_projection_pending"],
          },
          editorial: null,
        });
      }
      const editorial = await getPublishedLocationEditorial(location);
      cachePublicProjection(res);
      return res.json({
        kind: location.kind,
        state: location.state,
        city: location.city?.city,
        canonicalUrl: location.canonicalUrl,
        providers: location.providers,
        services: location.city?.services || [],
        indexability: location.indexability,
        editorial: editorial?.status === "published"
          ? { introduction: editorial.introduction, faqs: editorial.faqs }
          : null,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/pandit-seo-network/states/:stateSlug", async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const location = selectHierarchicalPanditLocation(
        await getPanditSeoNetworkProjection(),
        routeParam(req.params.stateSlug),
      );
      if (!location || location.kind !== "state") {
        return res.status(404).json({ message: "State not found" });
      }
      const editorial = await getPublishedLocationEditorial(location);
      cachePublicProjection(res);
      return res.json({
        kind: location.kind,
        state: location.state,
        canonicalUrl: location.canonicalUrl,
        providers: location.providers,
        indexability: location.indexability,
        editorial: editorial
          ? { introduction: editorial.introduction, faqs: editorial.faqs }
          : null,
      });
    } catch (error) {
      return next(error);
    }
  });

  app.get("/api/pandit-seo-network/cities/:citySlug/services/:serviceSlug", async (
    req: Request,
    res: Response,
    next: NextFunction,
  ) => {
    try {
      const service = selectCityService(
        await getPanditSeoNetworkProjection(),
        routeParam(req.params.citySlug),
        routeParam(req.params.serviceSlug),
      );
      if (!service) return res.status(404).json({ message: "City service not found" });
      const editorial = await storage.getPanditSeoEditorial("city_service", service.entityId);
      cachePublicProjection(res);
      return res.json({
        ...service,
        editorial: editorial?.status === "published"
          ? { introduction: editorial.introduction, faqs: editorial.faqs }
          : null,
      });
    } catch (error) {
      return next(error);
    }
  });
}
