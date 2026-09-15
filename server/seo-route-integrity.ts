import type { NextFunction, Request, Response } from "express";
import { REGISTERED_SPA_ROUTE_PATTERNS } from "@shared/spa-route-patterns";
import { getPubliclyPublishedPanditBySlug } from "./pandit-public-access";
import { storage } from "./storage";
import { db } from "./db";
import { pandits, panditSlugHistory } from "@shared/schema";
import { eq } from "drizzle-orm";
import { getPanditSeoNetworkProjection } from "./pandit-seo-network/cache";
import {
  isPanditSeoNetworkEnabled,
  selectCityHub,
  selectCityService,
  selectPublicProfile,
} from "./pandit-seo-network/public-api";
import type { PanditSeoNetworkProjection } from "./pandit-seo-network/project";
import {
  getHierarchicalLocation,
  resolveLegacyCityLocation,
} from "./pandit-seo-network/state-city-seo";
import {
  getPublishedLocationEditorial,
  locationEditorialIsIndexable,
} from "./pandit-seo-network/editorial";
import { resolveActiveCatalogueLocation } from "./pandit-location-catalogue";

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
  getKnownPanditLocation: async (stateSlug, citySlug) =>
    Boolean(citySlug && await resolveActiveCatalogueLocation(stateSlug, citySlug)),
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

  // These authenticated Pandit workspace routes share the /pandit/:slug
  // namespace used by public storefronts. Resolve them before the storefront
  // matcher so a missing/expired session still receives the SPA login shell
  // with HTTP 200 instead of being classified as a missing public Pandit.
  if (cleanPath === "/pandit/login" || cleanPath === "/pandit/portal" || cleanPath === "/pandit/reset-password") {
    return { kind: "registered" };
  }

  if (cleanPath === "/book-pandit-online/all") {
    return { kind: "pandit-network", found: true, indexable: false };
  }

  const networkMatch = cleanPath.match(/^\/(?:book-pandit-online|pandits)\/([^/]+)(?:\/([^/]+))?$/);
  if (networkMatch) {
    const first = decodeRouteSegment(networkMatch[1]);
    const second = networkMatch[2] ? decodeRouteSegment(networkMatch[2]) : null;
    if (!first || (networkMatch[2] && !second)) {
      return { kind: "pandit-network", found: false, indexable: false };
    }
    if (!await dependencies.getPanditNetworkEnabled()) {
      // The directory is authoritative for active city availability.  A
      // location route must still resolve while the optional SEO projection
      // rollout is off; the client will render a noindex results page from
      // discovery.  Unknown locations remain real 404s.
      if (
        cleanPath.startsWith("/book-pandit-online/")
        && second
        && await dependencies.getKnownPanditLocation?.(first, second)
      ) {
        return { kind: "pandit-network", found: true, indexable: false };
      }
      return { kind: "pandit-network", found: false, indexable: false, disabled: true };
    }
    const projection = await dependencies.getPanditNetwork();
    const hierarchical = getHierarchicalLocation(projection, first, second || undefined);
    const legacyCity = second ? selectCityHub(projection, first) : null;
    const entity = hierarchical || (second
      ? selectCityService(projection, first, second)
      : selectCityHub(projection, first));
    if (!entity && second && await dependencies.getKnownPanditLocation?.(first, second)) {
      return { kind: "pandit-network", found: true, indexable: false };
    }
    // Before the hierarchy rollout, a known city/service route was a useful
    // noindex landing even when its provider supply was empty. Preserve that
    // hard-navigation contract while keeping unknown locations as 404s.
    if (!entity && second && legacyCity) {
      return { kind: "pandit-network", found: true, indexable: false };
    }
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
    if (!["GET", "HEAD"].includes(req.method) || !acceptsHtml(req)) return next();
    // This middleware governs public SPA navigations only. Browser fetch()
    // defaults to Accept: */*, so API routes must be excluded by path rather
    // than inferred from Accept headers. Otherwise an API registered later in
    // the stack can return valid JSON with a poisoned 404 status.
    if (req.path === "/api" || req.path.startsWith("/api/")) return next();
    if (req.path.includes(".") && !req.path.endsWith(".html") && !req.path.endsWith("/")) return next();

    try {
      // Optional nested profile-like URLs never become duplicate documents.
      // Redirect only after the authoritative public resolver confirms the
      // profile, so a private/suspended slug cannot be enumerated.
      const nestedProfile = req.path.match(
        /^\/book-pandit-online\/[^/]+\/[^/]+\/([^/]+)\/?$/,
      );
      if (nestedProfile && await dependencies.getPanditNetworkEnabled()) {
        const slug = decodeRouteSegment(nestedProfile[1]);
        const profile = slug ? await dependencies.getPublishedPanditBySlug(slug) : null;
        if (profile) {
          const query = req.originalUrl.includes("?")
            ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
            : "";
          return res.redirect(301, `/pandit/${encodeURIComponent(slug!)}${query}`);
        }
      }

      // /pandits is the retired alias family. Resolve both state/city aliases
      // and old flat city spellings to the one canonical hierarchy.
      const legacy = req.path.match(/^\/pandits\/([^/]+)(?:\/([^/]+))?\/?$/);
      if (legacy && await dependencies.getPanditNetworkEnabled()) {
        const projection = await dependencies.getPanditNetwork();
        const first = decodeRouteSegment(legacy[1]);
        const second = legacy[2] ? decodeRouteSegment(legacy[2]) : null;
        const location = first
          ? getHierarchicalLocation(projection, first, second || undefined)
            || (!second ? resolveLegacyCityLocation(projection, first) : null)
          : null;
        if (location) {
          const query = req.originalUrl.includes("?")
            ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
            : "";
          return res.redirect(301, `${location.canonicalUrl}${query}`);
        }
      }

      const flatLocation = req.path.match(/^\/book-pandit-online\/([^/]+)\/?$/);
      if (flatLocation && await dependencies.getPanditNetworkEnabled()) {
        const value = decodeRouteSegment(flatLocation[1]);
        if (value) {
          const projection = await dependencies.getPanditNetwork();
          const location = resolveLegacyCityLocation(projection, value);
          // Flat city URLs are all legacy inputs now, including the clean
          // city-name spelling. They must never remain alternate canonicals.
          if (location) {
            const query = req.originalUrl.includes("?")
              ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
              : "";
            return res.redirect(301, `${location.canonicalUrl}${query}`);
          }
        }
      }

      const hierarchicalPath = req.path.match(
        /^\/book-pandit-online\/([^/]+)(?:\/([^/]+))?\/?$/,
      );
      if (hierarchicalPath && await dependencies.getPanditNetworkEnabled()) {
        const first = decodeRouteSegment(hierarchicalPath[1]);
        const second = hierarchicalPath[2] ? decodeRouteSegment(hierarchicalPath[2]) : null;
        if (first) {
          const projection = await dependencies.getPanditNetwork();
          const location = getHierarchicalLocation(projection, first, second || undefined);
          if (location && normalisePath(req.path) !== normalisePath(location.canonicalUrl)) {
            const query = req.originalUrl.includes("?")
              ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
              : "";
            return res.redirect(301, `${location.canonicalUrl}${query}`);
          }
        }
      }

      // A retired flat city/service URL can use either the catalogue slug
      // (for example up-noida) or the clean city name (noida). Resolve it
      // before the generic network decision and consolidate to hierarchy.
      const flatService = req.path.match(
        /^\/book-pandit-online\/([^/]+)\/([^/]+)\/?$/,
      );
      if (flatService && await dependencies.getPanditNetworkEnabled()) {
        const cityValue = decodeRouteSegment(flatService[1]);
        if (cityValue) {
          const projection = await dependencies.getPanditNetwork();
          const location = resolveLegacyCityLocation(projection, cityValue);
          if (location) {
            const query = req.originalUrl.includes("?")
              ? req.originalUrl.slice(req.originalUrl.indexOf("?"))
              : "";
            return res.redirect(301, `${location.canonicalUrl}${query}`);
          }
        }
      }

      // A retired slug is never reassigned. Redirect only when its current
      // profile remains public, so a later suspension cannot leak existence.
      const oldSlug = req.path.match(/^\/pandit\/([^/]+)\/?$/)?.[1];
      if (oldSlug) {
        const old = await db.select({ slug: pandits.slug }).from(panditSlugHistory)
          .innerJoin(pandits, eq(panditSlugHistory.panditId, pandits.id))
          .where(eq(panditSlugHistory.slug, decodeRouteSegment(oldSlug) || "")).limit(1);
        if (old[0]?.slug && await getPubliclyPublishedPanditBySlug(old[0].slug)) {
          const query = req.originalUrl.includes("?") ? req.originalUrl.slice(req.originalUrl.indexOf("?")) : "";
          return res.redirect(301, `/pandit/${encodeURIComponent(old[0].slug)}${query}`);
        }
      }
      const decision = await resolvePublicRouteDecision(req.path, dependencies);
      if (decision.kind === "pandit-network" && decision.found) {
        let indexable = decision.indexable;
        const hierarchy = req.path.match(
          /^\/book-pandit-online\/([^/]+)(?:\/([^/]+))?\/?$/,
        );
        if (indexable && hierarchy) {
          try {
            const location = getHierarchicalLocation(
              await dependencies.getPanditNetwork(),
              decodeRouteSegment(hierarchy[1]) || "",
              hierarchy[2] ? decodeRouteSegment(hierarchy[2]) || undefined : undefined,
            );
            if (location) {
              const editorial = await getPublishedLocationEditorial(location);
              indexable = locationEditorialIsIndexable(location, editorial);
            }
          } catch {
            indexable = false;
          }
        }
        if (!indexable) res.setHeader("X-Robots-Tag", "noindex, follow");
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
  getKnownPanditLocation?: (stateSlug: string, citySlug?: string) => Promise<boolean>;
};
