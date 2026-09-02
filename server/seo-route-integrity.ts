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
import type { PanditSeoNetworkProjection } from "./pandit-seo-network/project";

export type PublicRouteDecision =
  | { kind: "registered" }
  | { kind: "entity"; family: "product" | "pandit" | "blog"; found: boolean }
  | { kind: "pandit-network"; found: boolean; indexable: boolean; disabled?: boolean }
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
  getPanditNetwork: () => getPanditSeoNetworkProjection(),
  getPanditNetworkEnabled: async () =>
    isPanditSeoNetworkEnabled(await storage.getSiteSettings()),
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

  const networkMatch = cleanPath.match(/^\/(?:book-pandit-online|pandits)\/([^/]+)(?:\/([^/]+))?$/);
  if (networkMatch) {
    const citySlug = decodeRouteSegment(networkMatch[1]);
    const serviceSlug = networkMatch[2] ? decodeRouteSegment(networkMatch[2]) : null;
    if (!citySlug || (networkMatch[2] && !serviceSlug)) {
      return { kind: "pandit-network", found: false, indexable: false };
    }
    if (!await dependencies.getPanditNetworkEnabled()) {
      return { kind: "pandit-network", found: false, indexable: false, disabled: true };
    }
    const projection = await dependencies.getPanditNetwork();
    const entity = serviceSlug
      ? selectCityService(projection, citySlug, serviceSlug)
      : selectCityHub(projection, citySlug);
    return {
      kind: "pandit-network",
      found: Boolean(entity),
      indexable: Boolean(entity?.indexability.indexable),
    };
  }

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
      const decision = await resolvePublicRouteDecision(req.path, dependencies);
      if (decision.kind === "pandit-network" && decision.found) {
        if (!decision.indexable) res.setHeader("X-Robots-Tag", "noindex, follow");
        return next();
      }
      if (decision.kind === "registered" || (decision.kind === "entity" && decision.found)) {
        return next();
      }

      res.locals.seoNotFound = true;
      const nofollow = decision.kind === "pandit-network" && decision.disabled;
      if (nofollow) {
        res.locals.seoNotFoundRobotsFollow = false;
      }
      res.status(404);
      res.setHeader("X-Robots-Tag", nofollow ? "noindex, nofollow" : "noindex, follow");
      return next();
    } catch (error) {
      return next(error);
    }
  };
}

type PublicEntityDependencies = {
  getProductBySlug: (slug: string) => Promise<unknown | undefined>;
  getProductById: (id: number) => Promise<unknown | undefined>;
  getPublishedPanditBySlug: (slug: string) => Promise<unknown | null>;
  getBlogPostBySlug: (slug: string) => Promise<{ isPublished?: boolean } | undefined>;
  getPanditNetwork: () => Promise<PanditSeoNetworkProjection>;
  getPanditNetworkEnabled: () => Promise<boolean>;
};
