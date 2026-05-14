import express, { type Request, Response, NextFunction } from "express";
import compression from "compression";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { registerRoutes } from "./routes";
import { serveStatic } from "./static";
import { createServer } from "http";
import { spawn } from "child_process";
import { mkdirSync, readdirSync, statSync, unlinkSync } from "fs";
import { join } from "path";

const app = express();
const httpServer = createServer(app);

// Hide framework fingerprint
app.disable("x-powered-by");

// Trust the first proxy (Replit's edge / any load balancer) so req.ip reflects
// the real client IP, which is required for IP-based rate limiting on OTP routes.
app.set("trust proxy", 1);

// ---- Security headers (helmet) ----
// CSP is permissive enough for our existing third-party scripts (Razorpay,
// GA4, GTM, FB Pixel, Google Fonts, Google Sign-In, YouTube embeds) but blocks
// arbitrary script injection. frameguard SAMEORIGIN allows admin previews but
// stops the public site from being embedded on attacker domains (clickjack +
// "site copy via iframe" defense). HSTS is enabled in production only.
app.use(
  helmet({
    contentSecurityPolicy: {
      useDefaults: true,
      directives: {
        "default-src": ["'self'"],
        "script-src": [
          "'self'",
          "'unsafe-inline'",
          "'unsafe-eval'",
          "https://checkout.razorpay.com",
          "https://*.razorpay.com",
          "https://www.googletagmanager.com",
          "https://www.google-analytics.com",
          "https://*.googletagmanager.com",
          "https://*.google-analytics.com",
          "https://accounts.google.com",
          "https://apis.google.com",
          "https://connect.facebook.net",
          "https://www.youtube.com",
          "https://s.ytimg.com",
        ],
        "style-src": ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
        "img-src": ["'self'", "data:", "blob:", "https:", "http:"],
        "connect-src": [
          "'self'",
          "https://*.razorpay.com",
          "https://api.razorpay.com",
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
          "https://*.googletagmanager.com",
          "https://accounts.google.com",
          "https://www.facebook.com",
          "https://*.facebook.com",
          "https://api.sunrise-sunset.org",
          "wss:",
          "blob:",
        ],
        "worker-src": ["'self'", "blob:"],
        "frame-src": [
          "'self'",
          "https://*.razorpay.com",
          "https://accounts.google.com",
          "https://www.googletagmanager.com",
          "https://www.youtube.com",
          "https://www.youtube-nocookie.com",
        ],
        "frame-ancestors": ["'self'"],
        "object-src": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'", "https://*.razorpay.com"],
        "upgrade-insecure-requests": process.env.NODE_ENV === "production" ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: "cross-origin" },
    hsts:
      process.env.NODE_ENV === "production"
        ? { maxAge: 31536000, includeSubDomains: true, preload: false }
        : false,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  }),
);

// ---- Global rate limit ----
// Protects every /api endpoint from brute force and crawler-style scraping.
// Per-route limiters (OTP, login) layer on top of this with stricter caps.
const globalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 240,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown"),
  skip: (req) => {
    // Skip the OTP verify lookup itself — it has its own stricter limiter.
    return req.path.startsWith("/api/orders/verify-otp");
  },
});
app.use("/api", globalApiLimiter);

app.use(compression());
app.use(cookieParser());

app.use("/assets", express.static("client/src/assets", {
  maxAge: "7d",
  immutable: true,
}));

app.use("/uploads", express.static("uploads", {
  maxAge: "30d",
  // Block executable / dangerous extensions from being served from /uploads
  // even if an attacker manages to plant one there via a future bug.
  setHeaders: (res, path) => {
    if (/\.(html?|js|mjs|cjs|svg)$/i.test(path)) {
      res.setHeader("Content-Disposition", "attachment");
    }
  },
}));

app.use("/attached_assets", express.static("attached_assets", {
  maxAge: "30d",
}));

declare module "http" {
  interface IncomingMessage {
    rawBody: unknown;
  }
}

// Explicit body-size caps. Default express.json is 100kb; we make it explicit
// and bump urlencoded down to a small value since we never accept large forms.
app.use(
  express.json({
    limit: "1mb",
    verify: (req, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

app.use(express.urlencoded({ extended: false, limit: "256kb" }));

export function log(message: string, source = "express") {
  const formattedTime = new Date().toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true,
  });

  console.log(`${formattedTime} [${source}] ${message}`);
}

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const { seedDatabase } = await import("./seed");
  await seedDatabase();
  const { seedSeoPages } = await import("./seo-seed");
  await seedSeoPages();
  await registerRoutes(httpServer, app);

  // One-shot pandit slug backfill — guarantees every /p/<slug> URL exists
  // and is unique. Idempotent + cheap (only touches rows missing a slug or
  // sharing one), but wrapped in try/catch so a failure never blocks boot.
  try {
    const { backfillPanditSlugs } = await import("./pandit-slug");
    const r = await backfillPanditSlugs();
    if (r.filled || r.deduped) {
      log(`pandit slugs backfilled: filled=${r.filled} deduped=${r.deduped}`);
    }
  } catch (err) {
    console.error("[pandit-slug backfill] failed:", err);
  }

  // Email marketing sweep: drives the 3-email abandoned-cart sequence,
  // welcome series, and any due queued sends. Runs every 15 minutes after a
  // 5-minute warm-up so app startup is not blocked.
  const runMarketingSweepJob = async () => {
    try {
      const { runMarketingSweep } = await import("./email-marketing");
      const r = await runMarketingSweep();
      if (r.abandoned + r.welcome + r.queued > 0) {
        log(`marketing sweep: abandoned=${r.abandoned} welcome=${r.welcome} queued=${r.queued}`);
      }
    } catch (err) {
      console.error("[marketing sweep] failed:", err);
    }
  };
  setTimeout(() => {
    runMarketingSweepJob();
    setInterval(runMarketingSweepJob, 15 * 60 * 1000);
  }, 5 * 60 * 1000);

  // ---- Automated DB backups (pg_dump, daily, 7-day rotation) ----
  // Writes to ./backups/vedictatva-YYYY-MM-DDTHH-MM-SS.sql.gz. Runs once at
  // boot (5 min after start) and then every 24h. Best-effort — backup failure
  // never crashes the server. Replit also keeps automatic checkpoints; this
  // is an extra app-level safety net so an admin can do a point-in-time
  // restore without leaving the project.
  const BACKUP_DIR = process.env.BACKUP_DIR || "./backups";
  const BACKUP_RETENTION_DAYS = Number(process.env.BACKUP_RETENTION_DAYS || 7);
  const BACKUP_INTERVAL_MS = 24 * 60 * 60 * 1000;
  const runDbBackup = () => {
    if (!process.env.DATABASE_URL) {
      log("[backup] skipped — DATABASE_URL not set");
      return;
    }
    try {
      mkdirSync(BACKUP_DIR, { recursive: true });
    } catch {}
    const stamp = new Date().toISOString().replace(/[:.]/g, "-");
    const outFile = join(BACKUP_DIR, `vedictatva-${stamp}.sql.gz`);
    // Use shell pipe so the dump streams straight into gzip — no temp file.
    const cmd = `pg_dump --no-owner --no-privileges "$DATABASE_URL" | gzip -9 > "${outFile}"`;
    const child = spawn("sh", ["-c", cmd], {
      env: { ...process.env },
      stdio: ["ignore", "ignore", "pipe"],
    });
    let stderr = "";
    child.stderr.on("data", (d) => { stderr += d.toString(); });
    child.on("close", (code) => {
      if (code === 0) {
        log(`[backup] wrote ${outFile}`);
        // Best-effort cloud push (no-op when BACKUP_CLOUD_PROVIDER unset).
        import("./backup-cloud")
          .then((m) => m.uploadBackupInBackground(outFile, outFile.split("/").pop() || "backup.sql.gz"))
          .catch(() => {});
        // Rotate: delete .sql.gz files older than retention window.
        try {
          const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000;
          for (const f of readdirSync(BACKUP_DIR)) {
            if (!f.endsWith(".sql.gz")) continue;
            const p = join(BACKUP_DIR, f);
            try {
              if (statSync(p).mtimeMs < cutoff) unlinkSync(p);
            } catch {}
          }
        } catch (e: any) {
          console.warn("[backup] rotation failed:", e?.message);
        }
      } else {
        console.warn(`[backup] pg_dump exited ${code}: ${stderr.trim().slice(0, 500)}`);
      }
    });
    child.on("error", (e) => console.warn("[backup] spawn failed:", e.message));
  };
  setTimeout(() => {
    runDbBackup();
    const t = setInterval(runDbBackup, BACKUP_INTERVAL_MS);
    if (typeof (t as any).unref === "function") (t as any).unref();
  }, 5 * 60 * 1000);

  // ---- Pandit membership renewal reminders (daily) ----
  // Sweeps paid memberships expiring in 14d / 3d / today and emails the
  // pandit. Idempotent — each stage is recorded so a re-run never
  // double-sends.
  const runMembershipReminders = async () => {
    try {
      const { runMembershipReminderSweep } = await import("./pandit-membership-reminders");
      const r = await runMembershipReminderSweep();
      if (r.sent > 0) log(`pandit membership reminders: sent=${r.sent} skipped=${r.skipped}`);
    } catch (err: any) {
      console.error("[pandit-membership-reminders] failed:", err?.message || err);
    }
  };
  setTimeout(() => {
    runMembershipReminders();
    const t = setInterval(runMembershipReminders, 24 * 60 * 60 * 1000);
    if (typeof (t as any).unref === "function") (t as any).unref();
  }, 7 * 60 * 1000);

  app.use((err: any, req: Request, res: Response, next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    console.error("Internal Server Error:", err);

    if (res.headersSent) {
      return next(err);
    }

    // For HTML page navigations (not API/JSON requests) on a 5xx, send the
    // user to the branded outage page (with the Sacred Symbols mini-game)
    // instead of a raw JSON error.
    const wantsHtml =
      status >= 500 &&
      !req.path.startsWith("/api/") &&
      req.path !== "/offline.html" &&
      req.method === "GET" &&
      (req.headers.accept || "").includes("text/html") &&
      (req.headers["x-requested-with"] || "") !== "XMLHttpRequest";

    if (wantsHtml) {
      return res.redirect(302, "/offline.html");
    }

    return res.status(status).json({ message });
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (process.env.NODE_ENV === "production") {
    serveStatic(app);
  } else {
    const { setupVite } = await import("./vite");
    await setupVite(httpServer, app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || "5000", 10);
  httpServer.listen(
    {
      port,
      host: "0.0.0.0",
      reusePort: true,
    },
    () => {
      log(`serving on port ${port}`);
    },
  );
})();
