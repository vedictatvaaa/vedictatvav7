# Threat Model

## Project Overview

Vedic Tatva is a full-stack spiritual ecommerce + services platform built on
Express (Node 20, TypeScript) with a React/Vite SPA frontend and PostgreSQL
(Drizzle ORM). It sells physical spiritual products, books pandits and
astrologers, accepts donations, and runs SEO/social-proof/loyalty surfaces.

External services in use:

- **Razorpay** — payment processing (server-side signature verification)
- **SendGrid** (via `./email`) — transactional email
- **MSG91** — SMS/OTP delivery
- **Shiprocket** — shipping label + tracking
- **Google OAuth** — federated sign-in
- **Google Tag Manager / GA4 / Meta Pixel** — analytics (admin-configurable)
- **OpenAI** — content generation in admin tools

Hosting: Replit (deployed from main branch). Single Express process serves the
API, the SPA, and `/uploads` static assets on one port.

## Assets

- **Customer accounts** — name, email, hashed password (bcrypt cost 10), phone,
  birth chart (date/time/city), Google linkage, referral code, password-reset
  token. Compromise → impersonation, PII leak, account takeover.
- **Order data** — items, prices, shipping address, payment status, invoice
  PDF, GST breakdown. Contains PII and revenue-sensitive pricing. Tampering
  → financial loss; disclosure → competitive intel + privacy breach.
- **Pandit/astrologer accounts** — separate bcrypt-hashed login (cost 10),
  bookings, payouts, boost-paid promotion status. Spoofing → fake bookings;
  EoP → free promotion / fraudulent payout.
- **Coupons & loyalty points** — admin-defined promo codes with discount
  caps and per-coupon usage counts; user point balances. Tampering →
  unlimited discounts.
- **Admin sessions** — `admin_sessions` rows keyed by random token in the
  `x-admin-token` header. Compromise → full site control.
- **Application secrets** — `DATABASE_URL`, `RAZORPAY_KEY_SECRET`,
  `MSG91_AUTH_KEY`, `SHIPROCKET_*`, `GOOGLE_CLIENT_ID`, `OPENAI_API_KEY`,
  `ORDER_LOOKUP_SECRET`. Held only in Replit secrets, never returned to the
  client.
- **Site settings & SEO content** — admin-controlled theme variables, GTM/GA
  IDs, custom `<head>` tags, JSON-LD, redirect map. Injection here = stored
  XSS or open-redirect across every page.
- **Uploaded media** — product images, invoice PDFs, banner images under
  `/uploads`. Served as static; must not become an XSS / RCE vector.
- **Audit log** — `admin_audit_log` rows describing every admin write.
  Repudiation defense.

## Trust Boundaries

- **Browser ↔ API** — all `/api/*` requests cross this boundary. The browser
  is hostile; every payload, header, and cookie must be validated server-side.
- **API ↔ PostgreSQL** — single pooled connection. SQL injection here = full
  data breach. All queries go through Drizzle parameterized builders.
- **API ↔ Razorpay / SendGrid / MSG91 / Shiprocket** — outbound only, with
  secrets held server-side. Razorpay payment signatures are HMAC-verified
  before an order is marked paid. Mock paths exist when keys are absent — these
  must never reach production.
- **Public ↔ Authenticated user** — the storefront, product detail, blog,
  pandit listing, donation pages are public. Cart, profile, order-history,
  loyalty, my-bookings require either a session-style identity check or an
  email-OTP token.
- **User ↔ Admin** — admins are flagged by `users.role = 'admin'` and prove
  identity with a 2FA-gated login that issues an `adminSessions` token. All
  destructive routes pass through `adminAuthMiddleware` from
  `server/admin-auth.ts`.
- **User ↔ Pandit (vendor)** — pandits log in to a separate portal and may
  only view/modify their own bookings + profile.

## Scan Anchors

- Production entry point: `server/index.ts` (helmet, global rate limit, body
  caps, daily pg_dump backup) → `server/routes.ts` (~7,600 LOC, single file
  with the bulk of API routes) plus modular routers in
  `server/seo-*.ts`, `server/wave1.ts`, `server/wave3.ts`,
  `server/yatra*.ts`, `server/pandit-portal.ts`.
- Highest-risk surfaces:
  - Payment / order: `/api/checkout`, `/api/orders`, `/api/razorpay/*`
    (price tamper + signature verify).
  - Auth: `/api/auth/*` (login, register, google, forgot/reset password,
    profile patch with identity-email check).
  - Admin: every route guarded by `adminAuthMiddleware` (search
    `adminAuthMiddleware` in `server/routes.ts` and `server/seo-*.ts`).
  - Order lookup OTP: `/api/orders/request-otp`, `/api/orders/verify-otp`,
    `/api/orders/by-email` — HMAC-signed bearer token pattern.
- Public-by-design routes: storefront reads (`/api/products`, `/api/reviews`,
  `/api/coupons` GET, `/api/site-settings` GET, `/api/social-proof/*` GET,
  `/api/pandits` GET, `/api/donations` GET, `/api/donation-orders` POST),
  newsletter signup, abandoned-cart capture, public booking POSTs.
- Dev-only / out-of-scope for production threat surface: `.local/skills/**`,
  `.agents/skills/**`, `attached_assets/**` static files, and the
  mockup-sandbox preview server.
- Admin auth source of truth: `server/admin-auth.ts` (`validateAdminSession`,
  `adminAuthMiddleware`).

## Threat Categories

### Spoofing

User passwords are bcrypt-hashed (cost 10) on register and verified on login;
any legacy plaintext rows are migrated on first successful sign-in. Google
Sign-In tokens are verified through `google-auth-library` and rejected if
`email_verified === false` or if the email already belongs to a different
Google account. Order-history lookups never trust an email alone — the caller
must complete a 6-digit OTP (HMAC-SHA256 over email|code, IP-rate-limited)
and present the resulting HMAC-signed bearer token, which is timing-safely
compared and email-bound. Razorpay webhooks are verified using HMAC
(`crypto.createHmac("sha256", RAZORPAY_KEY_SECRET)`) before the order is
marked confirmed. Admin sessions are random opaque tokens stored server-side
with an explicit `expiresAt`; they are never returned to non-admin callers.

**Required guarantees:**

- All admin write endpoints MUST go through `adminAuthMiddleware`.
- Razorpay payments MUST NOT confirm an order without HMAC signature match.
- Google credentials MUST be verified server-side; unverified emails MUST be
  rejected.
- Order lookup MUST require a valid OTP-derived token bound to the requested
  email.

### Tampering

The single largest historical risk was price tampering at checkout — the
client posted `totalAmount` and `price` per item and the server stored what
it received. Mitigation now in place: `/api/checkout` re-fetches each
product from the DB, substitutes the trusted price (`salePrice` if set, else
`price`), recomputes `itemsSubtotal − discounts + shipping + COD charges`,
and rejects the order if the client total diverges by more than ₹1.

Coupon validation runs entirely server-side (`/api/coupons/validate`) with
expiry, max-uses, and min-order-amount enforcement. Coupon CRUD endpoints
require admin auth so a customer cannot mint their own discount codes. Order
status transitions are admin-only (`PATCH /api/orders/:id`,
`adminAuthMiddleware`) — a customer cannot self-promote an order to "paid"
or "delivered".

JSON request bodies are capped at 1 MB; URL-encoded bodies at 256 KB. All
DB writes go through Drizzle parameterized queries — there are no raw SQL
string concatenations against user input.

**Required guarantees:**

- `/api/checkout` and `/api/razorpay/verify-payment` MUST recompute the
  order total from product-table prices.
- Coupon, pandit boost, site-settings, and bestseller mutations MUST require
  admin auth.
- Order status updates MUST require admin auth.
- All DB queries MUST use Drizzle's parameterized API.

### Repudiation

`server/routes.ts` ships an `auditAdmin(req, action, target, details)` helper
that writes to `admin_audit_log` (actor = last 6 chars of session token,
action, target, JSON details, IP from `x-forwarded-for`). It is invoked from
high-impact admin routes (site-settings save, integrations ping, return-ticket
update, sales-popup CRUD). Best-effort: a logging failure must never block
the underlying operation.

**Required guarantees:**

- Admin destructive actions (delete coupon/product/pandit, change site
  settings, mark order paid/cancelled, refund) SHOULD call `auditAdmin`.
- Customer order placement MUST persist the order row before email notify.

### Information Disclosure

Customer responses scrub the password field (`const { password: _, ...safe }`)
on every user object that crosses the API boundary. The admin order list and
single-order GET are gated by `adminAuthMiddleware`; the public order endpoint
exposes only an OTP-gated by-email route. The forgot-password endpoint always
returns the same success response so an attacker cannot enumerate registered
emails. The newsletter subscribe endpoint redacts the local-part in server
logs (`a***@domain`).

Static `/uploads` is now served with a `Content-Disposition: attachment` for
HTML/JS/SVG extensions to neutralize a future bug that allowed planting an
executable asset there. Helmet sets a `Content-Security-Policy` that forbids
`object-src`, locks `base-uri` to self, and only allows scripts from the
known third-party origins (Razorpay, GTM, GA4, Google Sign-In, Meta, YouTube).
HSTS with a one-year max-age is enabled in production.

The `Internal Server Error` handler returns only `{ message }` to the client
— the full stack remains in server logs.

**Required guarantees:**

- API responses MUST NOT include the `password` field for any user record.
- Stack traces and DB error details MUST NOT be returned to the client.
- Admin-only data (full order list, audit log, integrations status) MUST
  pass through `adminAuthMiddleware`.
- `/uploads` MUST NOT serve user-uploaded HTML/JS/SVG inline.

### Denial of Service

Helmet runs on every request. A global IP-keyed rate limiter caps every
`/api/*` route at 240 requests/minute. Stricter per-route limiters layer on
top: 20 OTP-request/15min and 30 OTP-verify/15min per IP for the order
lookup flow, plus a 3-second per-(admin, integration) throttle on integration
ping. JSON bodies are capped at 1 MB.

External provider calls (Razorpay, SendGrid, Shiprocket, OpenAI) all use the
provider SDK's default timeouts and run inside try/catch so a provider hang
degrades gracefully (mock fallback or fire-and-forget warning) without
crashing the request loop. Periodic schedulers (`setInterval`) for OTP
cleanup, abandoned-cart sweep, SEO engine, and the new daily DB backup all
call `.unref()` so they never block process shutdown.

**Required guarantees:**

- Every public POST/PATCH/DELETE MUST be subject to either the global limiter
  or a stricter per-route limiter.
- Outbound third-party calls MUST be wrapped in try/catch and MUST NOT block
  the response loop.
- Body size limits MUST be set explicitly (no relying on framework defaults).

### Elevation of Privilege

`adminAuthMiddleware` is the sole authorization gate — it validates the
`x-admin-token` header against the `admin_sessions` table, joins `users` to
require `role = 'admin'`, and then sets `req.adminUserId`. As of this audit,
all known unauthenticated admin write endpoints have been gated:

- `/api/pandits` POST/PATCH/DELETE
- `/api/pandit-reviews/:id` DELETE
- `/api/pandits/:id/boost` and `/boost/deactivate` POST
- `/api/social-proof/settings` and `/events` POST
- `/api/coupons` POST/PATCH/DELETE
- `/api/subscriptions/:id` PATCH
- `/api/donations/:id` PATCH/DELETE
- `/api/puja-bookings/:id` PATCH

Profile updates (`PATCH /api/auth/profile/:id`) previously had an IDOR — any
caller knowing a `userId` could rewrite that user's profile. They now require
an `identityEmail` body field (or `x-user-email` header) that must match the
target user's stored email, mirroring the existing `/api/my-bookings/:userId`
pattern.

`/uploads` and `/attached_assets` static handlers are restricted to the
`uploads/` and `attached_assets/` directories — there is no `path.join`-based
file resolver against user input that could enable directory traversal.

**Required guarantees:**

- Every route that mutates global state (products, coupons, site-settings,
  pandits, integrations, SEO, audit) MUST require `adminAuthMiddleware`.
- Routes that mutate a specific user's data MUST verify the caller owns that
  user record (identity email match or future bearer token).
- File system access MUST be limited to known static directories — no
  user-controlled path concatenation.
- Admin role MUST be checked server-side, never inferred from client state.

## Operational Security

- **Backups** — `server/index.ts` runs `pg_dump --no-owner --no-privileges
  | gzip` to `./backups/vedictatva-<timestamp>.sql.gz` once at boot (after a
  5 min warm-up) and every 24h after that, retaining the last 7 days.
  Replit's automatic checkpoints provide a second layer.
- **Secrets** — held in Replit Secrets (`DATABASE_URL`, `RAZORPAY_KEY_*`,
  `MSG91_AUTH_KEY`, `SHIPROCKET_*`, `GOOGLE_CLIENT_ID`, `ORDER_LOOKUP_SECRET`,
  `OPENAI_API_KEY`, `SENDGRID_API_KEY`). Never echoed back to the browser.
- **Dependency hygiene** — `jspdf`, `multer`, `lodash`, `axios`, `dompurify`,
  `path-to-regexp`, `picomatch` were upgraded as part of this audit to clear
  the critical/high CVEs surfaced by the dependency scanner. Re-run
  `npm audit` quarterly.
- **Site-clone defense** — `helmet` sets `frame-ancestors 'self'` (CSP) and
  `X-Frame-Options: SAMEORIGIN`, blocking the public site from being
  embedded on attacker domains. The `robots.txt` already disallows `/admin`
  and `/api/`. Static HTML scraping is unblockable but rate-limiting raises
  the cost.
