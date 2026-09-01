import { type Express } from "express";
import { createServer as createViteServer, createLogger } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express) {
  const clientRoot = path.resolve(import.meta.dirname, "..", "client");
  const publicRoot = path.resolve(clientRoot, "public");
  const workspaceRoot = path.resolve(clientRoot, "..");

  const isExistingFileBelow = (root: string, requestPath: string) => {
    const candidate = path.resolve(root, `.${requestPath}`);
    if (candidate !== root && !candidate.startsWith(`${root}${path.sep}`)) return false;
    try {
      return fs.statSync(candidate).isFile();
    } catch {
      return false;
    }
  };

  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  // Vite's development middleware can transform an unknown dotted URL into
  // index.html before our SPA fallback sees it. Let real source/public files
  // and Vite virtual modules through, but keep missing asset-like URLs as 404.
  app.use((req, res, next) => {
    if (
      req.method === "GET"
      && /\.[a-z0-9]{1,12}$/i.test(req.path)
      && !req.path.startsWith("/@")
      && !req.path.startsWith("/src/")
      && !isExistingFileBelow(publicRoot, req.path)
      && !isExistingFileBelow(workspaceRoot, req.path)
    ) {
      return res.status(404).type("text/plain").send("Asset not found");
    }
    return next();
  });

  app.use(vite.middlewares);

  app.use("/{*path}", async (req, res, next) => {
    const url = req.originalUrl;

    try {
      // Never turn a missing JavaScript/CSS chunk into index.html. Browsers
      // reject the HTML response as a module because it has text/html MIME
      // type, which commonly happens when an admin tab is open across a
      // deployment and requests an old Vite hash.
      if (/\.[a-z0-9]{1,12}$/i.test(req.path)) {
        return res.status(404).type("text/plain").send("Asset not found");
      }

      const clientTemplate = path.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html",
      );

      // always reload the index.html file from disk incase it changes
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`,
      );
      const page = await vite.transformIndexHtml(url, template);
      if (res.statusCode < 400) res.status(200);
      res.set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e as Error);
      next(e);
    }
  });
}
