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

export function isPanditSeoNetworkEnabled(settings: { panditSeoNetworkEnabled?: boolean } | undefined) {
  return settings?.panditSeoNetworkEnabled === true;
}

export function selectPublicProfile(
  projection: PanditSeoNetworkProjection,
  slug: string,
): PanditProfileProjection | null {
  return projection.profiles.find((profile) =>
    profile.pandit?.slug === slug && profile.indexability.status !== "not_found",
  ) || null;
}

export function selectCityHub(
  projection: PanditSeoNetworkProjection,
  citySlug: string,
): CityHubProjection | null {
  return projection.cities.find((city) => city.city.slug === citySlug) || null;
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
      if (!isPanditSeoNetworkEnabled(await storage.getSiteSettings())) {
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
      cachePublicProjection(res);
      return res.json(city);
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
      cachePublicProjection(res);
      return res.json(service);
    } catch (error) {
      return next(error);
    }
  });
}