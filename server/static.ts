import express, { type Express } from "express";
import fs from "fs";
import path from "path";

/**
 * Serve the production SPA build.
 *
 * Knows nothing about SEO/OG. The single source of truth for per-route
 * <head> rewriting is `seoHeadMiddleware` in server/seo-ssr.ts, which is
 * mounted earlier in the chain (see registerRoutes in server/routes.ts).
 *
 * Two things make seo-ssr's `res.send` wrapper actually fire on every
 * SPA route — including `/`:
 *
 *   1. `express.static(..., { index: false })` so requests for `/` are
 *      NOT auto-served by the static layer's directory-index handler
 *      (which uses sendFile + stream pipe and bypasses seo-ssr).
 *
 *   2. The catch-all sends the cached `index.html` STRING via res.send
 *      instead of res.sendFile. Strings flow through Express's wrapped
 *      res.send → seo-ssr injects the per-route head.
 *
 * The HTML is read once at boot. A new deploy triggers a PM2 reload, so
 * a stale in-memory copy is not a concern.
 */
export function serveStatic(app: Express) {
  const distPath = path.resolve(__dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`,
    );
  }

  const indexPath = path.resolve(distPath, "index.html");
  const indexHtml = fs.readFileSync(indexPath, "utf-8");

  // Real assets only. `index: false` keeps the SPA fallback in our hands.
  app.use(express.static(distPath, { index: false }));

  app.use("/{*path}", (req, res) => {
    // A missing hashed asset must stay a 404. Returning index.html here makes
    // browsers report "text/html is not a valid JavaScript MIME type" for
    // stale admin chunks after a deployment.
    if (/\.(?:js|mjs|cjs|css|map|json|wasm)$/i.test(req.path)) {
      return res.status(404).type("text/plain").send("Asset not found");
    }
    res.type("html").send(indexHtml);
  });
}
