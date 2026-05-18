# Vedic Tatva

Vedic Tatva is a premium spiritual e-commerce and service marketplace offering spiritual products, pandit/astrologer bookings, AI-powered consultations, and a comprehensive spiritual journey experience.

## Run & Operate

*   `npm run dev`: Starts the development server.
*   `npm run build`: Builds the application for production.
*   `npm run check`: Runs TypeScript type checking.
*   `npm run generate`: Regenerates Drizzle ORM schema.
*   `npm run db:push`: Pushes schema changes to the database.

**Required Environment Variables:**

*   `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`
*   `OPENAI_API_KEY`
*   `PG_DATABASE_URL`
*   `SESSION_SECRET`
*   `UNSUBSCRIBE_SECRET`
*   `SHIPROCKET_WEBHOOK_TOKEN`

**Optional Environment Variables:**

*   `PUBLIC_SITE_URL` (activates daily scheduler)
*   `GSC_SITE_URL` (overrides default Search Console property)
*   `GOOGLE_SERVICE_ACCOUNT_JSON` (enables Google Indexing API)
*   `GOOGLE_SITE_VERIFICATION_FILE` (for GSC HTML file verification)
*   `BACKUP_DIR`, `BACKUP_RETENTION_DAYS`
*   `DEPLOY_FROM_BROWSER` (legacy — was for the now-decommissioned VPS deploy.sh flow; leave unset under Coolify)

## Stack

*   **Frontend:** React + Vite, wouter, TanStack Query, Tailwind CSS, Framer Motion
*   **Backend:** Express.js, Drizzle ORM
*   **Database:** PostgreSQL
*   **Validation:** Zod
*   **Build Tool:** Vite
*   **Payment Gateway:** Razorpay
*   **AI:** OpenAI
*   **Other APIs:** `sunrise-sunset.org`

## Where things live

*   **Database Schema:** `shared/schema.ts`
*   **API Contracts:** Defined implicitly by Drizzle schema and Zod validation in `shared/schema.ts`.
*   **Shared Utilities:** `shared/`
*   **Frontend Source:** `client/src/`
*   **Admin Panel:**
    *   `client/src/pages/admin.tsx` — shell only (~370 lines): auth gate, sidebar, URL-persisted tab routing, Cmd-K palette, "?" shortcuts, persisted sidebar collapse.
    *   `client/src/pages/admin-tabs/*.tsx` — 26 per-tab modules, each `React.lazy()`-loaded as its own JS chunk. Co-located helpers stay with their parent tab.
    *   `client/src/components/admin/{InventoryHealthTab,CustomersTab,BlogTab,EmailMarketingTab}.tsx` — 4 additional tabs that pre-date this refactor (also lazy-loaded by the shell).
    *   `client/src/pages/admin-tab-registry.ts` — single source of truth for `TABS` + `TAB_SECTIONS` (consumed by both sidebar and palette).
    *   `client/src/pages/admin-shared.ts` — `TabId`, `TabSection`, `createFetcher`, `STATUS_COLORS`.
*   **Admin Primitives:** `client/src/components/admin/primitives/` — `PageHeader`, `StatCard`, `EmptyState`, `SectionCard`, `SkeletonTable`, `AdminDataTable` (sort/filter/search/pagination/multi-select/CSV export). Use these for new admin tabs and incremental migrations.
*   **Backend Source:** `server/src/`
*   **SEO Utilities:** `client/src/lib/seo-dom.ts`, `client/src/lib/seo-schemas.ts`
*   **PWA Manifest:** `client/public/manifest.webmanifest`
*   **Service Worker:** `client/public/sw.js`
*   **Accessibility Checks:** `scripts/a11y-check.mjs`, `scripts/release-a11y.mjs`
*   **Threat Model:** `threat_model.md`

## Architecture decisions

*   **Shared Schema:** Database schema and Zod validation are co-located in `shared/schema.ts` for type safety across frontend and backend.
*   **Premium Aesthetic:** Beige, Maroon, Gold color scheme with Playfair Display (headings) and Inter (body) to convey a sophisticated spiritual brand.
*   **Mobile-First Design:** Prioritizes responsiveness with specific mobile UI enhancements (e.g., sticky navigation, 2-column grids).
*   **Decentralized SEO Management:** Admin panel allows per-page SEO overrides, while `PageSeo` component and `seo-seed.ts` provide robust defaults and fallback mechanisms.
*   **Hybrid Notification System:** Order-journey notifications are WhatsApp-first with SMS fallback, ensured by database-level deduplication and channel preference.
*   **Browser-triggered Deploys (legacy):** Admin → Deploy tab spawns `scripts/deploy.sh` server-side. Gated by `adminAuthMiddleware` + `DEPLOY_FROM_BROWSER=1`, rate-limited 5/hour, audited (`deploy.start`). Status + live log in `server/deploy-runner.ts`. **No longer used** — production is on Coolify; this tab is dead code from the old VPS PM2 flow.
*   **Performance budget:** LCP images ship explicit `width`/`height` (CLS guard), `optImgSrcSet` everywhere, `/api/img` negotiates AVIF→WebP→JPEG via `Accept` (`Vary: Accept`, 30-day immutable cache), `DeferredWidgets` mounts chat/FOMO/social-proof/install-banner only after first interaction or `requestIdleCallback` (4s safety), `PreloadHints` skips the LCP preload on Save-Data and 2g, and the ambient floral backdrop drops every second SVG node on `<= 640px`.
*   **Per-route OG/WhatsApp share previews (no-JS crawlers):** `server/static.ts` intercepts every SPA-fallback HTML response and runs `injectOgMeta(html, path)` from `server/og-meta.ts`, swapping `<title>`, `og:*`, `twitter:*` and canonical based on a route → card map (exact, `prefix:/foo`, or RegExp). Bespoke 1200×630 JPEGs (<300 KB) live in `client/public/og/`. Production-only — dev still uses `vite.ts` (forbidden file) and crawlers don't hit dev anyway. `Cache-Control: max-age=300` keeps admin SEO edits fresh.

## Product

*   **Spiritual E-commerce:** Online shop for spiritual products with Amazon-style listings, product comparison, coupons, and subscription ordering.
*   **Pandit & Astrologer Marketplace:** Directory with booking systems, location-based matching, and advanced filtering.
*   **AI Consultations:** AI-powered Kundli generation, baby names, palm reading, Vastu analysis, and AI-generated Kathas with audio narration.
*   **Personalized Spiritual Journey:** User dashboard, gamified rewards, interactive virtual pujas, and a yearly Panchang calendar.
*   **Advanced Search & Filtering:** Comprehensive search for products, pandits, astrologers, and kathas, including location-based services.
*   **Smart Checkout & Delivery:** Auto-applying best coupons, live pincode delivery checks, and `Frequently Bought Together` recommendations based on co-purchase history.
*   **Social Proof:** Product reviews, FOMO elements, and recent purchase tickers, integrated with JSON-LD for SEO.
*   **GST Invoice System:** Automatic generation of GST-compliant PDF invoices.
*   **Admin Analytics:** Dashboard with sales trends, product/service revenue, customer insights, and stock alerts.
*   **Progressive Web App (PWA):** Installable app with offline capabilities and app shortcuts.
*   **Comprehensive SEO:** Dynamic sitemap, IndexNow integration, Google Indexing API, and robust on-page SEO controls.

## User preferences

*   Premium spiritual branding (not cheap religious portal)
*   Beige, maroon, gold color scheme
*   Icon-based homepage navigation
*   Razorpay payment gateway (not Stripe)
*   Domain: vedictatva.com

## Gotchas

*   **Accessibility Release Gate:** `node scripts/release-a11y.mjs` runs axe-core checks on the built production server and will block deployment if critical/serious violations are found. Use `A11Y_SKIP=1` to bypass.
*   **Shiprocket Integration:** Shiprocket webhook requires `SHIPROCKET_WEBHOOK_TOKEN` to be set. By default the endpoint requires an HMAC-SHA256 signature header (`x-api-signature` / `x-shiprocket-signature` / `x-webhook-signature`, hex or base64, optional `sha256=` prefix) computed over the raw body. Set `SHIPROCKET_WEBHOOK_ALLOW_LEGACY=1` to temporarily re-accept the legacy shared-token header (`x-api-key` / `x-token`) during cutover; query-param auth is never accepted.
*   **Google Indexing API Quota:** Capped at 200 URLs/day; requires `GOOGLE_SERVICE_ACCOUNT_JSON` to be set.
*   **AI Baby Name Generation:** Issues multiple parallel OpenAI calls; ensure `OPENAI_API_KEY` is valid and sufficient quota is available.
*   **Razorpay Webhook Security:** Webhook signatures are HMAC-verified server-side; ensure `RAZORPAY_KEY_SECRET` is correctly configured.
*   **Browser Deploy (decommissioned):** The "Deploy" admin tab was wired to the old VPS deploy.sh path. Coolify replaced this in May 2026; the tab and its `DEPLOY_FROM_BROWSER` env var are inert in production. Safe to delete in a future cleanup pass.
*   **Production schema drift (under Coolify):** The old `deploy.sh` used to run `npm run db:push` between build and restart. Coolify does NOT do this automatically. After any schema change in `shared/schema.ts`, SSH into the Coolify-managed container (or run from any host with the prod `DATABASE_URL`) and run `npm run db:push` manually. Symptom of skipping this: API endpoints 500 with `column "..." does not exist` after deploy, and dependent SPA pages render blank. Drizzle-kit will refuse destructive changes (column drop / rename) without confirmation — handle those interactively, never auto.

## Agent Handoff Notes

This section is the source of truth for any future agent (Replit, Claude,
GPT, human) picking up this codebase. Read it before making changes.

### How a request flows through the OG/SEO pipeline

Every public HTML route shares one rewriter so we never get competing tag
sets. Order of layers:

```
request
  → registerRoutes() in server/routes.ts
    → seoHeadMiddleware()  in server/seo-ssr.ts   ← wraps res.send + res.end
  → serveStatic() in server/static.ts
    → express.static(distPath, { index: false })  ← real assets only
    → catch-all res.send(indexHtml STRING)        ← seo-ssr intercepts here
  → seo-ssr.tryInject() runs resolveHead() in this order:
      0. resolveExplicitOgCard()        from server/og-meta.ts
         (FLAGSHIP_CARD for "/", ROUTE_CARDS for /pandits, /membership,
          /become-pandit, /puja, /spiritual-essentials, /pind-daan*,
          /shop prefix; bypassed for /shop/:slug + /product/:slug)
      1. CATEGORY_HEAD                  for /shop/:slug + ItemList JSON-LD
      2. Product schema                 for /product/:slug
      3. seo_pages DB row               for admin-managed landings
  → injectHead() strips old tags + inserts the new <head> block right
    after <head>, marker comment <!--ssr-seo-->.
```

If `resolveHead` returns null, the unmodified `client/index.html` ships
as-is. That template carries FLAGSHIP_CARD content as the graceful
default, so even unmatched routes get a presentable share card.

### OG card content lives in two places (intentionally)

| File                     | Role                                                     |
|--------------------------|----------------------------------------------------------|
| `client/index.html`      | Static defaults — flagship title/description/og:image.   |
|                          | Used as-is when no override applies.                     |
| `server/og-meta.ts`      | All bespoke per-route cards (FLAGSHIP_CARD + ROUTE_CARDS)|
|                          | + `resolveExplicitOgCard(pathname)`. Pure data, no HTML. |
| `server/seo-ssr.ts`      | The ONLY HTML rewriter. Consumes og-meta.ts.             |
| `server/static.ts`       | Serves files. Knows nothing about OG.                    |

`og-meta.ts` still exports `injectOgMeta()` and `shouldInjectOg()` with
`@deprecated` banners. They are dead code, kept for one release as a
hot-rollback safety net (the previously-deployed VPS static.ts imported
them). Delete in next cleanup pass.

### OG card images

* Spec: 1200×630 JPEG, ≤ 300 KB, served at `/og/<file>.jpg`.
* Files: `client/public/og/og-{prime-services,pandit-booking,pandit-registration,puja-essentials}.jpg`
* All four are 1200×630 and ≤ 156 KB. Verified live via curl.

### Cards verified live in production (last check: this session)

| Route                      | Title                                                       |
|----------------------------|-------------------------------------------------------------|
| `/`                        | Pandits · Puja · Samagri · Jyotish — All Sacred, One App    |
| `/pandits`                 | Book a Verified Vedic Pandit Near You · Vedic Tatva         |
| `/membership`              | Vedic Tatva Prime — Your Sacred Inner Circle                |
| `/become-pandit`           | Earn ₹50,000+/mo as a Verified Pandit · Vedic Tatva         |
| `/puja`                    | Online Puja with Live Vedic Pandits · Vedic Tatva           |
| `/spiritual-essentials`    | Authentic Puja Samagri the Pandit Uses · Vedic Tatva        |
| `/pind-daan-gaya`          | Sacred Pind Daan in Gaya, Kashi & Haridwar · Vedic Tatva    |

### Deploy flow (Replit → GitHub → Coolify)

Production is served by **Coolify** on the VPS. Coolify watches the
`vedictatvav7` branch of GitHub repo
`https://github.com/vedictatvaaa/vedictatvav7` and auto-deploys on
every push. `vedictatva.com` and `www.vedictatva.com` are routed by
Coolify (no CDN, no caching layer in front).

To ship a change end-to-end:

1. Make the edit in Replit (it auto-checkpoints to the local
   `gitsafe-backup` remote).
2. Open the **Version Control** panel in Replit's left sidebar (git
   icon). Confirm you see "N commits ahead" of `origin/vedictatvav7`.
   Click **Push** (NOT "Sync Changes" — Sync tries to pull first and
   can stall on phantom conflicts).
3. Coolify picks up the push automatically. Watch the deployment in
   the Coolify dashboard.
4. Verify with `curl -A "WhatsApp/2" -H "Accept: text/html"
   "https://vedictatva.com/<path>?v=now"` and grep `og:title`, or a
   simple `curl -s -o /dev/null -w "%{http_code}\n" https://vedictatva.com/`
   for a 200.

**Critical gotcha:** Replit's git layer auto-pushes only to a
`gitsafe-backup` remote, NOT to GitHub `origin`. If you skip step 2,
Coolify never sees your change and "why is the site still old?"
becomes very confusing. This bit us multiple times — always confirm
step 2 happened.

**Decommissioned old path (May 2026):** Before Coolify, the VPS had a
manual flow at `/var/www/vedicTattva-replit` with a PM2 process
`vedictatva` and a `scripts/deploy.sh` that pulled from a different
GitHub repo (`suresh7724/vedicTattva-replit`, branch `main`). That
process has been stopped and deleted from PM2, and the directory was
renamed to `/var/www/vedicTattva-replit.OLD-do-not-use`. The Admin
"Deploy" tab and the `DEPLOY_FROM_BROWSER` env var are leftovers from
that flow and no longer relevant.

### WhatsApp / link unfurler cache busting

WhatsApp caches share previews per exact URL string for ~7 days, with a
soft per-domain rate limit on a single phone (~5–10 cache-busts then
silent backoff for hours).

* To force a fresh fetch: append `?v=anything-unique` to the URL.
* `vedictatva.com` and `www.vedictatva.com` are TWO separate cache keys
  to WhatsApp. Bust both.
* Real-time inspection without WhatsApp throttle: paste the URL into
  https://www.opengraph.xyz/.
* Facebook/Instagram cache: https://developers.facebook.com/tools/debug/.
* LinkedIn cache: https://www.linkedin.com/post-inspector/.

### Daily DB backup (already wired, no UI yet)

`server/index.ts` lines 211–262 spawn `pg_dump --no-owner --no-privileges
| gzip -9` to `./backups/vedictatva-<timestamp>.sql.gz`:

* Runs once 5 minutes after boot, then every 24 hours.
* Retains 7 days, prunes older.
* Best-effort — backup failure never blocks request loop.
* On the VPS, files land in `/var/www/vedicTattva-replit/backups/`.
* Configurable via `BACKUP_DIR` and `BACKUP_RETENTION_DAYS` env vars.

Restore manually:

```
gunzip -c /var/www/vedicTattva-replit/backups/vedictatva-<ts>.sql.gz \
  | psql "$DATABASE_URL"
```

There is currently NO admin-panel UI to list / download / trigger
backups. That's a clean 1-tab addition if you want it (proposed
endpoint: `GET /api/admin/backups` listing files, `POST /api/admin/backups/run`
triggering on-demand, both behind `adminAuthMiddleware`).

### Forbidden files (do not edit)

* `vite.config.ts`, `server/vite.ts` — Vite is pre-configured for the
  shared port + dev HMR.
* `package.json` — use the package manager tools, not direct edits.
* `drizzle.config.ts` — the schema generator is calibrated for the
  shared Drizzle setup.

## Pointers

*   [Tailwind CSS Documentation](https://tailwindcss.com/docs)
*   [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview/postgresql)
*   [React Documentation](https://react.dev/docs)
*   [Vite Documentation](https://vitejs.dev/guide/)
*   [Razorpay API Documentation](https://razorpay.com/docs/api/)
*   [OpenAI API Documentation](https://platform.openai.com/docs/overview)
*   [WCAG 2.1 Guidelines](https://www.w3.org/TR/WCAG21/)