import type { NextFunction, Request, Response } from "express";
import { REGISTERED_SPA_ROUTE_PATTERNS } from "@shared/spa-route-patterns";
import { getPubliclyPublishedPanditBySlug } from "./pandit-public-access";
import { storage } from "./storage";
import { getPanditSeoNetworkProjection } from "./pandit-seo-network/cache";
import {
  isPanditSeoNetworkEnabled,
  selectCityHub,
  selectCityService,
  selectPublicProfile,
} from "./pandit-seo-network/public-api";

type PublicEntityDependencies = {
  getProductBySlug: (slug: string) => Promise<unknown | undefined>;
  getProductById: (id: number) => Promise<unknown | undefined>;
  getPublishedPanditBySlug: (slug: string) => Promise<unknown | null>;
  getBlogPostBySlug: (slug: string) => Promise<{ isPublished?: boolean } | undefined>;
};

export type PublicRouteDecision =
  | { kind: "registered" }
  | { kind: "entity"; family: "product" | "pandit" | "blog"; found: boolean }
  | { kind: "not-found" };

const defaultDependencies: PublicEntityDependencies = {
  getProductBySlug: (slug) => storage.getProductBySlug(slug),
  getProductById: (id) => storage.getProduct(id),
  getPublishedPanditBySlug: async (slug) => {
    const settings = await storage.getSiteSettings();
    if (isPanditSeoNetworkEnabled(settings)) {
      return selectPublicProfile(await getPanditSeoNetworkProjection(), slug);
    }
    return getPubliclyPublishedPanditBySlug(slug);
  },
  getBlogPostBySlug: (slug) => storage.getBlogPostBySlug(slug),
};

function normalisePath(path: string): string {
  if (!path || path === "/") return "/";
  return `/${path.replace(/^\/+|\/+$/g, "")}`;
}

function compileRoutePattern(pattern: string): RegExp {
  if (pattern === "/") return /^\/$/;
  const source = pattern
    .split("/")
    .filter(Boolean)
    .map((segment) => segment.startsWith(":") ? "[^/]+" : segment.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("/");
  return new RegExp(`^/${source}/?$`);
}

const registeredMatchers = REGISTERED_SPA_ROUTE_PATTERNS.map(compileRoutePattern);

export function isRegisteredSpaPath(path: string): boolean {
  const cleanPath = normalisePath(path);
  return registeredMatchers.some((matcher) => matcher.test(cleanPath));
}

function decodeRouteSegment(value: string): string | null {
  try {
    const decoded = decodeURIComponent(value).trim();
    return decoded && !decoded.includes("/") ? decoded : null;
  } catch {
    return null;
  }
}

export async function resolvePublicRouteDecision(
  path: string,
  dependencies: PublicEntityDependencies = defaultDependencies,
): Promise<PublicRouteDecision> {
  const cleanPath = normalisePath(path);

  const productMatch = cleanPath.match(/^\/product\/([^/]+)$/);
  if (productMatch) {
    const key = decodeRouteSegment(productMatch[1]);
    if (!key) return { kind: "entity", family: "product", found: false };
    const product = await dependencies.getProductBySlug(key)
      || (/^\d+$/.test(key) ? await dependencies.getProductById(Number(key)) : undefined);
    return { kind: "entity", family: "product", found: Boolean(product) };
  }

  const panditMatch = cleanPath.match(/^\/(?:pandit|p|store)\/([^/]+)$/);
  if (panditMatch) {
    const slug = decodeRouteSegment(panditMatch[1]);
    if (!slug) return { kind: "entity", family: "pandit", found: false };
    const pandit = await dependencies.getPublishedPanditBySlug(slug);
    return { kind: "entity", family: "pandit", found: Boolean(pandit) };
  }

  const blogMatch = cleanPath.match(/^\/blog\/([^/]+)$/);
  if (blogMatch) {
    const slug = decodeRouteSegment(blogMatch[1]);
    if (!slug) return { kind: "entity", family: "blog", found: false };
    const post = await dependencies.getBlogPostBySlug(slug);
    return { kind: "entity", family: "blog", found: Boolean(post?.isPublished) };
  }

  return isRegisteredSpaPath(cleanPath) ? { kind: "registered" } : { kind: "not-found" };
}

function acceptsHtml(req: Request): boolean {
  const accept = String(req.headers.accept || "").toLowerCase();
  return !accept || accept.includes("text/html") || accept.includes("*/*") || accept.includes("text/*");
}

export function publicRouteIntegrityMiddleware(dependencies: PublicEntityDependencies = defaultDependencies) {
  return async function publicRouteIntegrity(req: Request, res: Response, next: NextFunction) {
    if (req.method !== "GET" || !acceptsHtml(req)) return next();
    if (req.path.includes(".") && !req.path.endsWith(".html") && !req.path.endsWith("/")) return next();

    try {
      const locationMatch = req.path.match(/^\/book-pandit-online\/([^/]+)(?:\/([^/]+))?\/?$/);
      if (locationMatch) {
        const settings = await storage.getSiteSettings();
        if (!isPanditSeoNetworkEnabled(settings)) return next();
        const projection = await getPanditSeoNetworkProjection();
        const location = locationMatch[2]
          ? selectCityService(projection, locationMatch[1], locationMatch[2])
          : selectCityHub(projection, locationMatch[1]);
        if (location) return next();
        res.locals.seoNotFound = true;
        res.status(404);
        res.setHeader("X-Robots-Tag", "noindex, follow");
        return next();
      }
      const decision = await resolvePublicRouteDecision(req.path, dependencies);
      if (decision.kind === "registered" || (decision.kind === "entity" && decision.found)) {
        return next();
      }

      res.locals.seoNotFound = true;
      res.status(404);
      res.setHeader("X-Robots-Tag", "noindex, follow");
      return next();
    } catch (error) {
      return next(error);
    }
  };
}
