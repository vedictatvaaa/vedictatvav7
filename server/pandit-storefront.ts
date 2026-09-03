// =====================================================================
// Pandit storefronts at /p/<slug> with referrals + card orders
// Three audiences:
//   • Public visitors — read storefront, follow ?ref=<slug> attribution.
//   • Pandits (panditAuthMiddleware) — manage own storefront, see referrals,
//     download QR card, order physical card.
//   • Admins (adminAuthMiddleware) — settle commissions, fulfil card orders.
// =====================================================================
import type { Express, Request, Response, NextFunction } from "express";
import crypto from "crypto";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import Razorpay from "razorpay";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import { z } from "zod";
import { storage } from "./storage";
import { db } from "./db";
import { pandits, panditMembershipPurchases } from "@shared/schema";
import { eq, desc, and, sql, gte, isNotNull } from "drizzle-orm";
import { panditAuthMiddleware, type PanditRequest } from "./pandit-portal";
import type { AdminRequest } from "./admin-auth";
import { buildPanditPayoutEmail, sendEmailAsync } from "./email";
import {
  getPubliclyEligiblePanditBySlug,
  getPubliclyPublishedPanditBySlug,
  isPanditStorefrontPublished,
  publicPanditReviewDto,
  publicPanditPackageDto,
  publicPanditGalleryItemDto,
  publicPanditAvailabilityRuleDto,
  publicPanditServiceDto,
  publicStorefrontPanditDto,
} from "./pandit-public-access";
import { panditServiceWriteSchema, panditPackageWriteSchema, panditGalleryWriteSchema, panditAvailabilityWriteSchema } from "./catalog-validation";
import { getConsentedReferralSlug, hasAnalyticsConsent, hasMarketingConsent } from "./consent";
import {
  resolvePublicPanditProfile,
} from "./pandit-seo-network/public-api";
import type { PanditProfileProjection } from "./pandit-seo-network/project";
import { buildPanditProfileSeoHead } from "./pandit-seo-network/seo";
import { canonicalPanditRedirectTarget } from "./pandit-route-context";
import { assertRateCompliant, modeAllowed } from "./puja-booking/pricing";
import { canonicalBookingMode } from "@shared/puja-booking";

// Annual price (INR) for each paid pandit tier. Server is the source of
// truth — any client-side amount is re-checked here on /membership/order.
const TIER_PRICE_INR: Record<string, number> = {
  silver: 1999,
  gold: 3999,
  guru_elite: 6999,
};
const PAID_TIERS = ["silver", "gold", "guru_elite"] as const;
type PaidTier = typeof PAID_TIERS[number];

const REF_COOKIE = "vt_ref";
const REF_COOKIE_DAYS = 30;

// Slug-validation cache for refCookieMiddleware. Pandits change rarely, so
// a 5-minute TTL keeps the per-request cost at ~zero while still picking up
// new/disabled slugs reasonably quickly. Negative results (unknown slugs)
// are cached too to absorb random ?ref= probes without DB load.
const SLUG_CACHE_TTL_MS = 5 * 60 * 1000;
const slugValidCache = new Map<string, { valid: boolean; expiresAt: number }>();
async function isSlugAttributable(slug: string): Promise<boolean> {
  const hit = slugValidCache.get(slug);
  const now = Date.now();
  if (hit && hit.expiresAt > now) return hit.valid;
  let valid = false;
  try {
    const pandit = await getPubliclyEligiblePanditBySlug(slug);
    valid = Boolean(pandit?.id);
  } catch {
    valid = false;
  }
  slugValidCache.set(slug, { valid, expiresAt: now + SLUG_CACHE_TTL_MS });
  // Soft cap to prevent unbounded growth from random probes.
  if (slugValidCache.size > 5000) {
    const cutoff = now;
    slugValidCache.forEach((v, k) => { if (v.expiresAt < cutoff) slugValidCache.delete(k); });
  }
  return valid;
}

// Per-IP throttle on the storefront landing endpoint. Caps cookie-stamp
// abuse (someone spraying ?ref= probes to seed cookies on shared devices)
// without affecting normal browsing — 60/min is well above any human pace.
const storefrontLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: "Too many requests. Please slow down." },
  keyGenerator: (req) => ipKeyGenerator(req.ip || req.socket?.remoteAddress || "unknown"),
});

// Tier → product-commission % map. Pandits override per-pandit via
// pandits.product_commission_pct; if 0/null we fall back to this map.
const TIER_COMMISSION: Record<string, number> = {
  free: 0,
  silver: 8,
  gold: 12,
  guru_elite: 15,
  // Back-compat: legacy "platinum" rows map to guru_elite commission.
  platinum: 15,
};

function commissionForPandit(p: { tier?: string | null; productCommissionPct?: number | null; tierExpiresAt?: Date | string | null }): number {
  // Tier expiry: an expired paid tier behaves as free for commission too,
  // mirroring the reach-filter behavior in /api/book-pandit-online.
  const expired = p.tierExpiresAt && new Date(p.tierExpiresAt as any) < new Date();
  const rawTier = (p.tier || "free").toLowerCase();
  const tier = expired ? "free" : rawTier;
  // Hard rule: free-tier pandits never earn commission, regardless of any
  // admin-set override. Override only applies to paid tiers.
  if (tier === "free") return 0;
  const override = Number(p.productCommissionPct || 0);
  if (override > 0) return Math.min(override, 50); // safety cap 50%
  return TIER_COMMISSION[tier] ?? 0;
}

// ---------------------------------------------------------------------
// Pandit card → Shiprocket. Best-effort: returns true on success, false on
// failure (and writes the error message back to the row so admin can see).
// Idempotent under concurrent calls (verify hook + admin re-push) via
// per-order in-process lock. Same Node process serves both code paths so
// a Map lock is sufficient — multi-worker setups would need a DB lock.
// ---------------------------------------------------------------------
const dispatchInflight = new Map<number, Promise<boolean>>();

export function dispatchCardOrderToShiprocket(orderId: number): Promise<boolean> {
  const existing = dispatchInflight.get(orderId);
  if (existing) return existing;
  const p = _dispatchCardOrderToShiprocket(orderId).finally(() => {
    dispatchInflight.delete(orderId);
  });
  dispatchInflight.set(orderId, p);
  return p;
}

async function _dispatchCardOrderToShiprocket(orderId: number): Promise<boolean> {
  try {
    const ord = await storage.getPanditCardOrder(orderId);
    if (!ord) return false;
    if (ord.paymentStatus !== "paid") return false;
    if (ord.shiprocketOrderId) return true; // already dispatched
    const sr = await import("./services/shiprocket");
    if (!sr.isShiprocketConfigured()) {
      await storage.updatePanditCardOrder(orderId, {
        shiprocketError: "Shiprocket credentials not configured",
      });
      return false;
    }
    const orderDate = (ord.createdAt ?? new Date()).toISOString().slice(0, 16).replace("T", " ");
    const [firstName, ...rest] = String(ord.shippingName || "Pandit").split(" ");
    const cardLabel = ord.cardType === "nfc" ? "Pandit NFC Card" : "Pandit Printed Card";
    const payload = {
      order_id: `VT-CARD-${ord.id}`,
      order_date: orderDate,
      pickup_location: sr.getPickupLocation(),
      billing_customer_name: firstName || "Pandit",
      billing_last_name: rest.join(" ") || ".",
      billing_address: ord.shippingAddress,
      billing_city: ord.shippingCity,
      billing_pincode: ord.shippingPincode,
      billing_state: ord.shippingState,
      billing_country: "India",
      billing_email: "fulfilment@vedictatva.com",
      billing_phone: ord.shippingPhone,
      shipping_is_billing: true,
      order_items: [{
        name: cardLabel,
        sku: `PANDIT-CARD-${ord.cardType}`,
        units: ord.quantity || 1,
        selling_price: ord.unitPrice || ord.totalAmount,
      }],
      payment_method: "Prepaid" as const,
      sub_total: ord.totalAmount,
      // Single business card in a small mailer.
      length: 12,
      breadth: 9,
      height: 1,
      weight: 0.05,
    };
    const result = await sr.createOrder(payload);
    await storage.updatePanditCardOrder(orderId, {
      shiprocketOrderId: String(result.order_id),
      shiprocketShipmentId: String(result.shipment_id),
      trackingNumber: result.awb_code || null,
      status: "printing",
      shiprocketError: null,
    });
    return true;
  } catch (e: any) {
    const msg = e?.message || "Shiprocket dispatch failed";
    try {
      await storage.updatePanditCardOrder(orderId, { shiprocketError: msg.slice(0, 500) });
    } catch {}
    console.warn(`[card-order] shiprocket dispatch failed id=${orderId}:`, msg);
    return false;
  }
}

function siteUrl(req: Request): string {
  const env = process.env.PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const proto = (req.headers["x-forwarded-proto"] as string) || req.protocol || "https";
  const host = (req.headers["x-forwarded-host"] as string) || req.get("host") || "localhost:5000";
  return `${proto}://${host}`;
}

// ---------------------------------------------------------------------
// Referral cookie middleware. When ?ref=<slug> appears on any URL we
// stamp a 30-day cookie. A later checkout/booking/donation reads this
// cookie to attribute the conversion. Anonymous (no login required).
// ---------------------------------------------------------------------
// Express Request augmentation — refSlug is set by refCookieMiddleware and
// read by attributeReferral. Declared once here so we never need to cast.
declare module "express-serve-static-core" {
  interface Request {
    refSlug?: string;
  }
}

export function refCookieMiddleware(req: Request, res: Response, next: NextFunction) {
  if (!hasMarketingConsent(req)) {
    if (req.cookies?.[REF_COOKIE]) res.clearCookie(REF_COOKIE, { path: "/" });
    next();
    return;
  }
  const ref = String(req.query?.ref || "").trim().toLowerCase().slice(0, 80);
  if (ref && /^[a-z0-9-]+$/.test(ref)) {
    // Validate the slug against the pandits table before stamping a cookie.
    // Caches result for 5 min so this is effectively free per request and
    // does not wedge the response loop on DB latency.
    isSlugAttributable(ref)
      .then((valid) => {
        if (valid) {
          res.cookie(REF_COOKIE, ref, {
            maxAge: REF_COOKIE_DAYS * 24 * 60 * 60 * 1000,
            httpOnly: false,
            sameSite: "lax",
            path: "/",
          });
          req.refSlug = ref;
        } else if (req.cookies?.[REF_COOKIE]) {
          req.refSlug = String(req.cookies[REF_COOKIE]).toLowerCase();
        }
        next();
      })
      .catch(() => {
        if (req.cookies?.[REF_COOKIE]) req.refSlug = String(req.cookies[REF_COOKIE]).toLowerCase();
        next();
      });
    return;
  }
  if (req.cookies?.[REF_COOKIE]) {
    req.refSlug = String(req.cookies[REF_COOKIE]).toLowerCase();
  }
  next();
}

// ---------------------------------------------------------------------
// Public attribution helper. Called from order/booking/donation creation
// sites to write a pandit_referrals row when a referral cookie exists.
// Soft-fails: never throws, never blocks the parent request.
// ---------------------------------------------------------------------
export async function attributeReferral(
  req: Request,
  kind: "order" | "booking" | "donation",
  refId: number,
  grossAmount: number,
  refEmail?: string | null,
): Promise<void> {
  try {
    const slug = getConsentedReferralSlug(req);
    if (!slug) return;
    const pandit = await getPubliclyEligiblePanditBySlug(slug);
    if (!pandit) return;
    // Block self-referral — a pandit cannot earn commission off their own
    // email/phone purchases. Compare normalized identity fields. Phone match
    // is digits-only to ignore +91 / spaces / formatting differences.
    const buyerEmail = (refEmail || "").trim().toLowerCase();
    const panditEmail = (pandit.email || "").trim().toLowerCase();
    if (buyerEmail && panditEmail && buyerEmail === panditEmail) return;
    const normPhone = (s?: string | null) => String(s || "").replace(/\D+/g, "").slice(-10);
    const buyerPhone = normPhone(
      (req.body?.customerPhone as string) || (req.body?.phone as string) || (req.body?.donorPhone as string) || ""
    );
    const panditPhone = normPhone(pandit.phone);
    if (buyerPhone && panditPhone && buyerPhone === panditPhone) return;
    // Always write a referral ledger row when the visit is attributable —
    // even for free-tier pandits whose commission is 0. This preserves
    // platform-side attribution analytics ("how many orders flowed through
    // pandit X's storefront") without paying out commission.
    const pct = Math.max(0, commissionForPandit(pandit));
    const commissionAmount = pct > 0
      ? Math.round((Number(grossAmount) || 0) * pct / 100)
      : 0;
    await storage.createPanditReferral({
      panditId: pandit.id,
      kind,
      refId,
      refEmail: (refEmail || "").toLowerCase() || null,
      grossAmount: Math.round(Number(grossAmount) || 0),
      commissionPct: pct,
      commissionAmount,
      // Free-tier rows are immediately "confirmed" (no payout owed); paid-tier
      // rows start "pending" and admin marks them paid after settlement.
      status: pct > 0 ? "pending" : "confirmed",
      notes: pct > 0 ? null : "platform-attribution",
    });
  } catch (e: any) {
    console.warn(`[referral] attribution failed kind=${kind} refId=${refId}:`, e?.message);
  }
}

// ---------------------------------------------------------------------
// Public storefront DTO — assembled from pandit + storefront + curated
// products. Keeps DB joins out of the route handler.
// ---------------------------------------------------------------------
async function buildStorefrontDto(slug: string, authoritativeProfile?: PanditProfileProjection) {
  const pandit = authoritativeProfile?.pandit || await getPubliclyPublishedPanditBySlug(slug);
  if (!pandit) return null;
  const sf = await storage.getPanditStorefrontByPanditId(pandit.id);
  if (!authoritativeProfile && !isPanditStorefrontPublished(sf)) return null;
  // Tier gating: free-tier pandits get a services-only storefront — no
  // curated products and no referral commission section. Paid tiers get
  // up to 12 curated products.
  const tier = String((pandit as any).tier || "free").toLowerCase();
  const productIds: number[] = tier === "free"
    ? []
    : ((sf?.productIds as number[]) || []).slice(0, 12);
  const products = productIds.length
    ? (await Promise.all(productIds.map((id) => storage.getProduct(id)))).filter(Boolean)
    : [];
  const reviews = await storage.getPanditReviews(pandit.id).catch(() => []);
  const [storedServices, packages, gallery, availability] = await Promise.all([
    authoritativeProfile
      ? Promise.resolve([])
      : storage.listPanditServicesWithMaster(pandit.id, true).catch(() => []),
    storage.listPanditPackages(pandit.id, true).catch(() => []),
    storage.listPanditGalleryItems(pandit.id, true).catch(() => []),
    storage.listPanditAvailabilityRules(pandit.id, true).catch(() => []),
  ]);
  const services = authoritativeProfile?.services || storedServices.map(publicPanditServiceDto);
  const activeServiceIds = new Set(services.map(service => service.id));
  const packageDtos = (await Promise.all(packages.map(async pkg => {
    const items = await storage.listPanditPackageItems(pkg.id);
    // A stale package is not public if an included offering was subsequently
    // disabled; this prevents public bundles from advertising unbookable items.
    return items.length && items.every(item => activeServiceIds.has(item.panditServiceId))
      ? publicPanditPackageDto(pkg, items)
      : null;
  }))).filter(Boolean);
  return {
    pandit: publicStorefrontPanditDto(pandit),
    storefront: sf
      ? {
          bio: sf.bio,
          tagline: sf.tagline,
          themeColor: sf.themeColor,
          bannerImage: sf.bannerImage,
          featuredPujas: sf.featuredPujas || [],
          social: {
            youtube: sf.youtubeUrl,
            instagram: sf.instagramUrl,
            facebook: sf.facebookUrl,
            website: sf.websiteUrl,
          },
        }
      : null,
    products,
    services,
    reviews: reviews.slice(0, 10).map(publicPanditReviewDto),
    packages: packageDtos,
    gallery: gallery.map(publicPanditGalleryItemDto),
    availability: availability.map(publicPanditAvailabilityRuleDto),
    canonicalUrl: `/pandit/${encodeURIComponent(String(pandit.slug || ""))}`,
    share: { canonicalUrl: `/pandit/${encodeURIComponent(String(pandit.slug || ""))}`, referralSlug: pandit.slug },
    indexability: authoritativeProfile?.indexability,
  };
}

// ---------------------------------------------------------------------
// QR code → SVG buffer. Encodes the public storefront URL with the
// referral param baked in so every scan is attributable.
// ---------------------------------------------------------------------
async function storefrontQrPng(req: Request, slug: string, size = 512): Promise<Buffer> {
  const url = `${siteUrl(req)}/pandit/${encodeURIComponent(slug)}?ref=${encodeURIComponent(slug)}`;
  return QRCode.toBuffer(url, {
    type: "png",
    width: size,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#4a1a22", light: "#FFFAEC" },
  });
}

// ---------------------------------------------------------------------
// Pandit photo fetcher with SSRF guard. Mirrors the allowlist used by the
// per-pandit OG card route. Returns a circle-masked PNG (size×size) ready
// for jsPDF.addImage(), or null if the photo is missing/unreachable.
// ---------------------------------------------------------------------
const CARD_IMAGE_HOST_ALLOWLIST = new Set<string>([
  "vedictatva.com",
  "www.vedictatva.com",
  "images.unsplash.com",
  "res.cloudinary.com",
  "ucarecdn.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
]);

async function fetchPanditPhotoCircle(req: Request, image: string | null | undefined, size = 360): Promise<Buffer | null> {
  if (!image) return null;
  try {
    const ownHost = (() => { try { return new URL(siteUrl(req)).hostname.toLowerCase(); } catch { return ""; } })();
    let imgUrl: string | null = null;
    if (!image.startsWith("http")) {
      imgUrl = `${siteUrl(req)}${image.startsWith("/") ? "" : "/"}${image}`;
    } else {
      const u = new URL(image);
      if (u.protocol !== "http:" && u.protocol !== "https:") return null;
      const host = u.hostname.toLowerCase();
      const isPrivate =
        host === "localhost" || host === "0.0.0.0" ||
        /^127\./.test(host) || /^10\./.test(host) ||
        /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
        /^169\.254\./.test(host) || host.endsWith(".local") || host.endsWith(".internal");
      if (isPrivate) return null;
      if (host !== ownHost && !CARD_IMAGE_HOST_ALLOWLIST.has(host)) return null;
      imgUrl = u.toString();
    }
    if (!imgUrl) return null;
    const r = await fetch(imgUrl, { signal: AbortSignal.timeout(4000), redirect: "error" });
    if (!r.ok) return null;
    const ab = await r.arrayBuffer();
    const sharp = (await import("sharp")).default;
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size/2}" cy="${size/2}" r="${size/2}" fill="#fff"/></svg>`);
    return await sharp(Buffer.from(ab))
      .resize(size, size, { fit: "cover" })
      .composite([{ input: mask, blend: "dest-in" }])
      .png()
      .toBuffer();
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------
// Dual-sided business card PDF — A6 portrait, 2 pages.
//   Page 1 (Front): brand header, pandit photo, name, contact number,
//                   specialization, city.
//   Page 2 (Back):  brand header, membership no, large storefront QR,
//                   storefront URL, languages/experience, verified badge,
//                   brand watermark footer.
// ---------------------------------------------------------------------
async function storefrontCardPdf(
  req: Request,
  slug: string,
  authoritativeProfile?: PanditProfileProjection,
): Promise<Buffer> {
  const dto = await buildStorefrontDto(slug, authoritativeProfile);
  if (!dto) throw new Error("Storefront not found");
  const qrPng = await storefrontQrPng(req, slug, 720);
  const photoPng = await fetchPanditPhotoCircle(req, dto.pandit.image);
  const W = 105, H = 148; // A6 portrait, mm

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: [W, H] });

  // Shared brand header — used on both pages.
  const drawHeader = (subtitle: string) => {
    doc.setFillColor(255, 250, 236);
    doc.rect(0, 0, W, H, "F");
    doc.setFillColor(109, 43, 53); // maroon
    doc.rect(0, 0, W, 22, "F");
    doc.setFillColor(212, 175, 55); // gold accent stripe
    doc.rect(0, 22, W, 1.2, "F");
    doc.setTextColor(212, 175, 55);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.text("VEDIC TATVA", W / 2, 11, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(255, 250, 236);
    doc.text(subtitle, W / 2, 17.5, { align: "center" });
  };

  // ============== FRONT (page 1) ==============
  drawHeader("Verified Vedic Pandit");

  // Photo (circle) — top center. Falls back to a gold ring placeholder.
  const photoSize = 42;
  const photoX = (W - photoSize) / 2;
  const photoY = 30;
  if (photoPng) {
    doc.addImage(photoPng, "PNG", photoX, photoY, photoSize, photoSize);
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.circle(W / 2, photoY + photoSize / 2, photoSize / 2 + 0.4, "S");
  } else {
    doc.setFillColor(245, 233, 207);
    doc.circle(W / 2, photoY + photoSize / 2, photoSize / 2, "F");
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.circle(W / 2, photoY + photoSize / 2, photoSize / 2, "S");
    doc.setTextColor(109, 43, 53);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text((dto.pandit.name?.[0] || "P").toUpperCase(), W / 2, photoY + photoSize / 2 + 3, { align: "center" });
  }

  // Name
  doc.setTextColor(74, 26, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(15);
  doc.text(String(dto.pandit.name || "").slice(0, 36), W / 2, photoY + photoSize + 9, { align: "center" });

  // Specialization (subtle)
  if (dto.pandit.specialization) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(109, 43, 53);
    doc.text(String(dto.pandit.specialization).slice(0, 50), W / 2, photoY + photoSize + 16, { align: "center" });
  }

  // Divider
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(0.3);
  doc.line(25, photoY + photoSize + 22, W - 25, photoY + photoSize + 22);

  // Keep contact details private; direct customers through the platform.
  doc.setTextColor(90, 74, 58);
  doc.setFontSize(7.5);
  doc.setFont("helvetica", "normal");
  doc.text("BOOK SECURELY", W / 2, photoY + photoSize + 28, { align: "center" });
  doc.setTextColor(74, 26, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(`vedictatva.com/pandit/${slug}`, W / 2, photoY + photoSize + 36, { align: "center" });

  // City footer line
  if (dto.pandit.city) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(109, 43, 53);
    doc.text(
      `${dto.pandit.city}${dto.pandit.state ? ", " + dto.pandit.state : ""}`,
      W / 2, H - 10, { align: "center" }
    );
  }

  // ============== BACK (page 2) ==============
  doc.addPage([W * (72 / 25.4), H * (72 / 25.4)], "portrait");
  drawHeader("Scan · Book · Shop · Connect");

  // Public card label. Membership identifiers remain private.
  doc.setTextColor(90, 74, 58);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.text("VERIFIED VEDIC PANDIT", W / 2, 32, { align: "center" });
  doc.setTextColor(74, 26, 34);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.text("Book securely on Vedic Tatva", W / 2, 39, { align: "center" });

  // QR — large center
  const qrSize = 56;
  doc.addImage(qrPng, "PNG", (W - qrSize) / 2, 45, qrSize, qrSize);

  // Storefront URL under QR
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(109, 43, 53);
  doc.text(`vedictatva.com/pandit/${slug}`, W / 2, 45 + qrSize + 6, { align: "center" });

  // Meta line: experience · languages
  const metaParts: string[] = [];
  if (dto.pandit.experience) metaParts.push(`${dto.pandit.experience}+ yrs experience`);
  if (dto.pandit.languages) metaParts.push(String(dto.pandit.languages).split(",").slice(0, 3).map((s) => s.trim()).filter(Boolean).join(" · "));
  if (metaParts.length) {
    doc.setFontSize(7.5);
    doc.setTextColor(90, 74, 58);
    doc.text(metaParts.join("  ·  "), W / 2, 45 + qrSize + 12, { align: "center" });
  }

  // Verified badge (bottom-center, gold)
  if (dto.pandit.verified) {
    const badgeW = 40, badgeH = 7;
    const bx = (W - badgeW) / 2, by = H - 22;
    doc.setFillColor(212, 175, 55);
    doc.roundedRect(bx, by, badgeW, badgeH, 1.5, 1.5, "F");
    doc.setTextColor(74, 26, 34);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text("VERIFIED PANDIT", W / 2, by + 4.8, { align: "center" });
  }

  // Brand watermark footer
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6);
  doc.setTextColor(120, 100, 80);
  doc.text("vedictatva.com  ·  Authentic Vedic Services  ·  Made in India", W / 2, H - 6, { align: "center" });

  return Buffer.from(doc.output("arraybuffer"));
}

// ---------------------------------------------------------------------
// Route registration
// ---------------------------------------------------------------------
export function registerPanditStorefrontRoutes(app: Express, adminAuthMiddleware: any) {
  // Cookie attribution runs on every request (cheap, no DB).
  app.use(refCookieMiddleware);

  // ===== PUBLIC =====
  app.get("/api/storefront/:slug", storefrontLimiter, async (req, res, next) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase().trim();
      if (!slug) return res.status(400).json({ message: "Slug required" });
      const resolution = await resolvePublicPanditProfile({ slug });
      const networkEnabled = resolution.enabled;
      const profile = resolution.profile || undefined;
      // With rollout enabled the projection is authoritative. Do not fall
      // through to legacy storage, which could disclose an unpublished row.
      if (networkEnabled && !profile) {
        return res.status(404).json({ message: "Storefront not found" });
      }
      const dto = await buildStorefrontDto(slug, profile || undefined);
      if (!dto) return res.status(404).json({ message: "Storefront not found" });
      const responseDto = profile
        ? { ...dto, seo: buildPanditProfileSeoHead(profile, siteUrl(req)) }
        : dto;
      // Server-side attribution: any visit to /p/<slug> (which the SPA loads
      // by hitting this endpoint) stamps the vt_ref cookie for 30 days, so
      // attribution survives even when the browser blocks document.cookie
      // writes from React.
      if (hasMarketingConsent(req)) {
        res.cookie(REF_COOKIE, slug, {
          maxAge: REF_COOKIE_DAYS * 24 * 60 * 60 * 1000,
          httpOnly: false,
          sameSite: "lax",
          path: "/",
        });
      }
      res.setHeader("Cache-Control", "no-store");
      // Fire-and-forget view count bump.
      if (hasAnalyticsConsent(req)) {
        storage.incrementStorefrontView(dto.pandit.id).catch(() => {});
      }
      res.json(responseDto);
    } catch (e: any) {
      console.error("[storefront] fetch failed:", e?.message);
      return next(e);
    }
  });

  // Per-pandit OG share image — 1200x630 JPEG with the pandit's actual
  // photo composited next to brand-styled text (name + city + rating +
  // verified badge). First request renders + caches to
  // client/public/og/p-<slug>.jpg so subsequent requests are static.
  app.get("/api/og/p/:slug.jpg", async (req, res, next) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase().trim();
      const resolution = await resolvePublicPanditProfile({ slug });
      const p = resolution.enabled
        ? resolution.profile?.pandit
        : await getPubliclyPublishedPanditBySlug(slug);
      if (!p) return res.status(404).end();
      const path = await import("path");
      const fs = await import("fs/promises");
      const cachePath = path.resolve("/tmp/vedic-tatva-og", `p-${slug}.jpg`);
      try {
        const cached = await fs.readFile(cachePath);
        res.setHeader("Content-Type", "image/jpeg");
        res.setHeader("Cache-Control", "no-store");
        res.setHeader("X-OG-Cache", "HIT");
        return res.send(cached);
      } catch {}

      const sharp = (await import("sharp")).default;
      const esc = (s: string) => String(s || "").replace(/[<&>"']/g, (c) => ({ "<": "&lt;", "&": "&amp;", ">": "&gt;", '"': "&quot;", "'": "&apos;" }[c]!));
      const ratingLine = p.rating && p.reviewCount
        ? `${Number(p.rating).toFixed(1)} stars · ${p.reviewCount} reviews`
        : "Verified by Vedic Tatva";
      const cityLine = [p.city, p.state].filter(Boolean).join(", ");
      const verifiedBadge = p.verified
        ? `<rect x="540" y="500" width="220" height="46" rx="6" fill="#D4AF37"/><text x="650" y="530" font-family="serif" font-size="22" font-weight="700" fill="#4a1a22" text-anchor="middle">VERIFIED PANDIT</text>`
        : "";
      const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#FFFAEC"/>
      <stop offset="1" stop-color="#F5E9CF"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <rect x="0" y="0" width="1200" height="90" fill="#6D2B35"/>
  <text x="60" y="60" font-family="Georgia,serif" font-size="36" font-weight="700" fill="#D4AF37">Vedic Tatva</text>
  <text x="1140" y="60" font-family="serif" font-size="22" fill="#FFFAEC" text-anchor="end">vedictatva.com/pandit/${esc(slug)}</text>
  <text x="540" y="220" font-family="Georgia,serif" font-size="56" font-weight="700" fill="#4a1a22">${esc(p.name).slice(0, 22)}</text>
  <text x="540" y="280" font-family="serif" font-size="32" fill="#6D2B35">${esc(cityLine)}</text>
  <text x="540" y="340" font-family="serif" font-size="26" fill="#5a4a3a">${esc(ratingLine)}</text>
  <text x="540" y="420" font-family="serif" font-size="24" fill="#5a4a3a">Book pujas · Curated samagri · Direct WhatsApp</text>
  ${verifiedBadge}
  <rect x="0" y="610" width="1200" height="20" fill="#D4AF37"/>
  <circle cx="270" cy="315" r="208" fill="#FFFAEC" stroke="#D4AF37" stroke-width="6"/>
</svg>`;

      // Try to fetch + circle-mask the pandit photo. Fall back gracefully
      // to text-only card if photo is missing or unreachable.
      let photoBuf: Buffer | null = null;
      if (p.image) {
        try {
          // SSRF guard: only allow same-origin (relative or our own host) and
          // an explicit allowlist of trusted CDNs. Block private/loopback
          // ranges and non-http(s) schemes.
          const OG_IMAGE_HOST_ALLOWLIST = new Set<string>([
            "vedictatva.com",
            "www.vedictatva.com",
            "images.unsplash.com",
            "res.cloudinary.com",
            "ucarecdn.com",
            "lh3.googleusercontent.com",
            "lh4.googleusercontent.com",
            "lh5.googleusercontent.com",
            "lh6.googleusercontent.com",
          ]);
          const ownHost = (() => {
            try { return new URL(siteUrl(req)).hostname.toLowerCase(); } catch { return ""; }
          })();
          let imgUrl: string | null = null;
          if (!p.image.startsWith("http")) {
            // Same-origin static asset path — safe.
            imgUrl = `${siteUrl(req)}${p.image.startsWith("/") ? "" : "/"}${p.image}`;
          } else {
            try {
              const u = new URL(p.image);
              if (u.protocol !== "http:" && u.protocol !== "https:") throw new Error("scheme");
              const host = u.hostname.toLowerCase();
              const isPrivate =
                host === "localhost" ||
                host === "0.0.0.0" ||
                /^127\./.test(host) ||
                /^10\./.test(host) ||
                /^192\.168\./.test(host) ||
                /^172\.(1[6-9]|2\d|3[01])\./.test(host) ||
                /^169\.254\./.test(host) ||
                host.endsWith(".local") ||
                host.endsWith(".internal");
              if (isPrivate) throw new Error("private host");
              if (host !== ownHost && !OG_IMAGE_HOST_ALLOWLIST.has(host)) throw new Error("host not allowlisted");
              imgUrl = u.toString();
            } catch {
              imgUrl = null;
            }
          }
          if (!imgUrl) throw new Error("blocked");
          const r = await fetch(imgUrl, { signal: AbortSignal.timeout(4000), redirect: "error" });
          if (r.ok) {
            const ab = await r.arrayBuffer();
            const mask = Buffer.from(`<svg width="400" height="400"><circle cx="200" cy="200" r="200" fill="#fff"/></svg>`);
            photoBuf = await sharp(Buffer.from(ab))
              .resize(400, 400, { fit: "cover" })
              .composite([{ input: mask, blend: "dest-in" }])
              .png()
              .toBuffer();
          }
        } catch {}
      }

      const composites: { input: Buffer; left?: number; top?: number }[] = [];
      if (photoBuf) composites.push({ input: photoBuf, left: 70, top: 115 });
      const buf = await sharp(Buffer.from(svg))
        .composite(composites)
        .jpeg({ quality: 86, mozjpeg: true })
        .toBuffer();

      // Best-effort cache write — never block the response.
      fs.mkdir(path.dirname(cachePath), { recursive: true })
        .then(() => fs.writeFile(cachePath, buf))
        .catch((e) => console.warn("[og-pandit] cache write failed:", e?.message));

      res.setHeader("Content-Type", "image/jpeg");
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("X-OG-Cache", "MISS");
      res.send(buf);
    } catch (e: any) {
      console.warn("[og-pandit] failed:", e?.message);
      return next(e);
    }
  });

  // Legacy URL → canonical storefront URL. During rollout, the public
  // projection is the only authority; legacy storage is used only while the
  // feature is disabled.
  app.get("/pandit/:id", async (req, res, next) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return next();
      const resolution = await resolvePublicPanditProfile({ panditId: id });
      if (resolution.enabled) {
        const profile = resolution.profile;
        if (!profile?.pandit?.slug) return next();
        return res.redirect(301, canonicalPanditRedirectTarget(
          `/pandit/${encodeURIComponent(profile.pandit.slug)}`,
          req.query,
        ));
      }
      const p = await storage.getPandit(id);
      if (!p?.slug) return next();
      if (!(await getPubliclyPublishedPanditBySlug(p.slug))) return next();
      return res.redirect(301, canonicalPanditRedirectTarget(
        `/pandit/${encodeURIComponent(p.slug)}`,
        req.query,
      ));
    } catch (error) {
      return next(error);
    }
  });
  for (const legacyPath of ["/p/:slug", "/store/:slug"]) {
    app.get(legacyPath, async (req, res, next) => {
      try {
        const slug = String(req.params.slug || "").toLowerCase().trim();
        if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) return next();
        const resolution = await resolvePublicPanditProfile({ slug });
        if (resolution.enabled) {
          const profile = resolution.profile;
          if (!profile?.pandit?.slug) return next();
          return res.redirect(301, canonicalPanditRedirectTarget(
            `/pandit/${encodeURIComponent(profile.pandit.slug)}`,
            req.query,
          ));
        }
        if (!(await getPubliclyPublishedPanditBySlug(slug))) return next();
        return res.redirect(301, canonicalPanditRedirectTarget(
          `/pandit/${encodeURIComponent(slug)}`,
          req.query,
        ));
      } catch (error) { return next(error); }
    });
  }

  app.get("/api/storefront/:slug/qr.png", async (req, res, next) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase().trim();
      if (!slug) return res.status(400).end();
      const resolution = await resolvePublicPanditProfile({ slug });
      const pandit = resolution.enabled
        ? resolution.profile?.pandit
        : await getPubliclyPublishedPanditBySlug(slug);
      if (!pandit) return res.status(404).end();
      const buf = await storefrontQrPng(req, slug, 512);
      res.setHeader("Content-Type", "image/png");
      res.setHeader("Cache-Control", "no-store");
      res.send(buf);
    } catch (e: any) {
      console.error("[storefront] qr failed:", e?.message);
      return next(e);
    }
  });

  app.get("/api/storefront/:slug/card.pdf", async (req, res, next) => {
    try {
      const slug = String(req.params.slug || "").toLowerCase().trim();
      const resolution = await resolvePublicPanditProfile({ slug });
      const profile = resolution.profile || undefined;
      const pandit = resolution.enabled
        ? profile?.pandit
        : await getPubliclyPublishedPanditBySlug(slug);
      if (!pandit) return res.status(404).json({ message: "Not found" });
      const buf = await storefrontCardPdf(req, slug, profile);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="vedic-tatva-${slug}.pdf"`);
      res.setHeader("Cache-Control", "no-store");
      res.send(buf);
    } catch (e: any) {
      console.error("[storefront] pdf failed:", e?.message);
      return next(e);
    }
  });

  // ===== PANDIT-AUTHED =====
  app.get("/api/pandit/storefront", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const sf = await storage.ensurePanditStorefront(req.panditId!);
      const pandit = await storage.getPandit(req.panditId!);
      if (!pandit) return res.status(404).json({ message: "Pandit not found" });
      const products = sf.productIds?.length
        ? (await Promise.all(sf.productIds.map((id) => storage.getProduct(id)))).filter(Boolean)
        : [];
      const memberNo = await storage.ensurePanditMembershipNo(pandit.id);
      res.json({
        storefront: sf,
        pandit: {
          id: pandit.id, name: pandit.name, slug: pandit.slug, tier: pandit.tier,
          productCommissionPct: pandit.productCommissionPct,
          membershipNo: memberNo,
          cardIssued: pandit.cardIssued !== false,
          cardIssuedAt: pandit.cardIssuedAt,
        },
        products,
        commissionPct: commissionForPandit(pandit),
          publicUrl: `${siteUrl(req)}/pandit/${pandit.slug || ""}`,
      });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.patch("/api/pandit/storefront", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const schema = z.object({
        bio: z.string().max(2000).nullable().optional(),
        tagline: z.string().max(160).nullable().optional(),
        whatsappNumber: z.string().max(20).nullable().optional(),
        youtubeUrl: z.string().url().max(300).nullable().optional().or(z.literal("")),
        instagramUrl: z.string().url().max(300).nullable().optional().or(z.literal("")),
        facebookUrl: z.string().url().max(300).nullable().optional().or(z.literal("")),
        websiteUrl: z.string().url().max(300).nullable().optional().or(z.literal("")),
        themeColor: z.string().max(20).nullable().optional(),
        bannerImage: z.string().max(500).nullable().optional(),
        productIds: z.array(z.number().int().positive()).max(12).optional(),
        featuredPujas: z.array(z.string().min(1).max(80)).max(20).optional(),
        status: z.enum(["draft", "pending_review"]).optional(),
        isPublished: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const patch: any = { ...parsed.data };
      if (patch.status) patch.isPublished = false;
      if (patch.isPublished === true) patch.status = "published";
      if (patch.isPublished === false && !patch.status) patch.status = "draft";
      const out = await storage.updatePanditStorefront(req.panditId!, patch);
      res.json({ storefront: out });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.get("/api/pandit/catalog/master-services", panditAuthMiddleware, async (_req: PanditRequest, res) => {
    const services = await storage.listActiveMasterServices();
    res.json(services.map(service => ({
      id: service.id,
      name: service.name,
      slug: service.slug,
      category: service.category,
      description: service.description,
      serviceType: service.serviceType,
      supportedModes: service.supportedModes,
      onlineAvailable: service.onlineAvailable,
      physicalAvailable: service.physicalAvailable,
    })));
  });

  app.get("/api/pandit/services", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const services = await storage.listPanditServicesWithMaster(req.panditId!);
    res.json(services.map(row => ({ ...publicPanditServiceDto(row), isActive: row.service.isActive })));
  });

  app.post("/api/pandit/services", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const parsed = panditServiceWriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid service", errors: parsed.error.flatten() });
    const master = await storage.getMasterService(parsed.data.masterServiceId);
    if (!master?.isActive) return res.status(400).json({ message: "Select an active catalogue service" });
    if (!master.supportedModes.includes(parsed.data.mode)) {
      return res.status(400).json({ message: "Selected mode is not supported by this service" });
    }
    try {
      assertRateCompliant(parsed.data.price, master);
      const requestedMode = parsed.data.mode === "hybrid" ? null : canonicalBookingMode(parsed.data.mode);
      if (requestedMode && !modeAllowed(master, requestedMode)) return res.status(400).json({ message: "Selected mode is not allowed by the active service policy" });
    } catch (error: any) { return res.status(400).json({ message: error.message, policy: { minRate: master.minRate, maxRate: master.maxRate } }); }
    try {
      const service = await storage.createPanditService({ ...parsed.data, panditId: req.panditId!, isActive: true });
      const row = { service, master };
      res.status(201).json(publicPanditServiceDto(row));
    } catch (error: any) {
      if (error?.code === "23505") return res.status(409).json({ message: "This service is already in your store" });
      throw error;
    }
  });

  app.patch("/api/pandit/services/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid service ID" });
    const existing = await storage.getPanditService(id);
    if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ message: "Service not found" });
    const parsed = panditServiceWriteSchema.omit({ masterServiceId: true }).partial()
      .extend({ isActive: z.boolean().optional() })
      .safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid service", errors: parsed.error.flatten() });
    const master = await storage.getMasterService(existing.masterServiceId);
    if (!master?.isActive) return res.status(400).json({ message: "Catalogue service is inactive" });
    if (parsed.data.mode && !master.supportedModes.includes(parsed.data.mode)) {
      return res.status(400).json({ message: "Selected mode is not supported by this service" });
    }
    try {
      const price = parsed.data.price ?? existing.price;
      assertRateCompliant(price, master);
      const mode = parsed.data.mode ?? existing.mode;
      const requestedMode = mode === "hybrid" ? null : canonicalBookingMode(mode);
      if (requestedMode && !modeAllowed(master, requestedMode)) return res.status(400).json({ message: "Selected mode is not allowed by the active service policy" });
    } catch (error: any) { return res.status(400).json({ message: error.message, policy: { minRate: master.minRate, maxRate: master.maxRate } }); }
    const service = await storage.updatePanditService(id, parsed.data);
    res.json(publicPanditServiceDto({ service, master }));
  });

  app.delete("/api/pandit/services/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid service ID" });
    const existing = await storage.getPanditService(id);
    if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ message: "Service not found" });
    await storage.updatePanditService(id, { isActive: false });
    res.status(204).end();
  });

  // Packages, gallery, and recurring availability are strictly owner-scoped.
  // The token-derived panditId is deliberately the only owner selector.
  const packageItemsAreOwnedActive = async (panditId: number, items: Array<{ panditServiceId: number }>) => {
    const ids = new Set(items.map(item => item.panditServiceId));
    if (ids.size !== items.length) return false;
    const services = await Promise.all(Array.from(ids).map(id => storage.getPanditService(id)));
    const valid = await Promise.all(services.map(async service => {
      if (!service || service.panditId !== panditId || !service.isActive) return false;
      const master = await storage.getMasterService(service.masterServiceId);
      try { return !!master?.isActive && (assertRateCompliant(service.price, master), true); } catch { return false; }
    }));
    return valid.every(Boolean);
  };
  app.get("/api/pandit/packages", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const packages = await storage.listPanditPackages(req.panditId!);
    res.json(await Promise.all(packages.map(async pkg => ({ ...pkg, items: await storage.listPanditPackageItems(pkg.id) }))));
  });
  app.post("/api/pandit/packages", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const parsed = panditPackageWriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid package", errors: parsed.error.flatten() });
    if (!(await packageItemsAreOwnedActive(req.panditId!, parsed.data.items))) return res.status(400).json({ message: "Packages require your active services" });
    try {
      const { items, ...data } = parsed.data;
      const { isPublished: _ignored, ...panditData } = data;
      const pkg = await storage.createPanditPackage({ ...panditData, panditId: req.panditId!, isActive: data.isActive ?? true, isPublished: false });
      const savedItems = await storage.replacePanditPackageItems(pkg.id, items);
      res.status(201).json({ ...pkg, items: savedItems });
    } catch (error: any) {
      if (error?.code === "23505") return res.status(409).json({ message: "This package slug is already in your store" });
      throw error;
    }
  });
  app.patch("/api/pandit/packages/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ message: "Invalid package ID" });
    const existing = await storage.getPanditPackage(id);
    if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ message: "Package not found" });
    const parsed = (panditPackageWriteSchema as any).partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid package", errors: parsed.error.flatten() });
    if (parsed.data.items && (!(await packageItemsAreOwnedActive(req.panditId!, parsed.data.items)))) return res.status(400).json({ message: "Packages require your active services" });
    const { items, isPublished: _ignored, ...patch } = parsed.data;
    const pkg = await storage.updatePanditPackage(id, patch);
    const savedItems = items ? await storage.replacePanditPackageItems(id, items) : await storage.listPanditPackageItems(id);
    res.json({ ...pkg, items: savedItems });
  });
  app.delete("/api/pandit/packages/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const existing = await storage.getPanditPackage(Number(req.params.id));
    if (!existing || existing.panditId !== req.panditId) return res.status(404).json({ message: "Package not found" });
    await storage.updatePanditPackage(existing.id, { isActive: false, isPublished: false }); res.status(204).end();
  });
  app.get("/api/pandit/gallery", panditAuthMiddleware, async (req: PanditRequest, res) => res.json(await storage.listPanditGalleryItems(req.panditId!)));
  app.post("/api/pandit/gallery", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const parsed = panditGalleryWriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid gallery item", errors: parsed.error.flatten() });
    res.status(201).json(await storage.createPanditGalleryItem({ ...parsed.data, panditId: req.panditId!, isPublished: false }));
  });
  app.patch("/api/pandit/gallery/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const item = await storage.getPanditGalleryItem(Number(req.params.id));
    if (!item || item.panditId !== req.panditId || item.removedAt) return res.status(404).json({ message: "Gallery item not found" });
    const parsed = panditGalleryWriteSchema.partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid gallery item", errors: parsed.error.flatten() });
    // Publication is admin moderation territory; Pandits can only submit media as drafts.
    const { isPublished: _ignored, ...patch } = parsed.data;
    res.json(await storage.updatePanditGalleryItem(item.id, patch));
  });
  app.delete("/api/pandit/gallery/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const item = await storage.getPanditGalleryItem(Number(req.params.id));
    if (!item || item.panditId !== req.panditId) return res.status(404).json({ message: "Gallery item not found" });
    await storage.updatePanditGalleryItem(item.id, { removedAt: new Date(), isPublished: false } as any); res.status(204).end();
  });
  app.get("/api/pandit/availability", panditAuthMiddleware, async (req: PanditRequest, res) => res.json(await storage.listPanditAvailabilityRules(req.panditId!)));
  app.post("/api/pandit/availability", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const parsed = panditAvailabilityWriteSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid availability rule", errors: parsed.error.flatten() });
    res.status(201).json(await storage.createPanditAvailabilityRule({ ...parsed.data, panditId: req.panditId!, isActive: parsed.data.isActive ?? true }));
  });
  app.patch("/api/pandit/availability/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const rule = await storage.getPanditAvailabilityRule(Number(req.params.id));
    if (!rule || rule.panditId !== req.panditId) return res.status(404).json({ message: "Availability rule not found" });
    const parsed = (panditAvailabilityWriteSchema as any).partial().safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ message: "Invalid availability rule", errors: parsed.error.flatten() });
    const candidate = { ...rule, ...parsed.data };
    if (candidate.endMinutes <= candidate.startMinutes) return res.status(400).json({ message: "End must be after start" });
    res.json(await storage.updatePanditAvailabilityRule(rule.id, parsed.data));
  });
  app.delete("/api/pandit/availability/:id", panditAuthMiddleware, async (req: PanditRequest, res) => {
    const rule = await storage.getPanditAvailabilityRule(Number(req.params.id));
    if (!rule || rule.panditId !== req.panditId) return res.status(404).json({ message: "Availability rule not found" });
    await storage.updatePanditAvailabilityRule(rule.id, { isActive: false }); res.status(204).end();
  });

  app.get("/api/pandit/storefront/qr.png", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const p = await storage.getPandit(req.panditId!);
      if (!p?.slug) return res.status(404).end();
      const buf = await storefrontQrPng(req, p.slug, 720);
      res.setHeader("Content-Type", "image/png");
      res.send(buf);
    } catch { res.status(500).end(); }
  });

  app.get("/api/pandit/storefront/card.pdf", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const p = await storage.getPandit(req.panditId!);
      if (!p?.slug) return res.status(404).json({ message: "Set up your slug first" });
      // Cards are issued by admins. Until then the pandit can see their
      // membership no but cannot download/share the official card.
      if (p.cardIssued === false) {
        return res.status(403).json({ message: "Your card is awaiting admin issuance" });
      }
      const buf = await storefrontCardPdf(req, p.slug);
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="vedic-tatva-card.pdf"`);
      res.send(buf);
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // Referrals — pandit can see their own ledger + summary.
  app.get("/api/pandit/referrals", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const [items, summary] = await Promise.all([
        storage.listPanditReferrals(req.panditId!, { status, limit: 200 }),
        storage.panditReferralSummary(req.panditId!),
      ]);
      res.json({ items, summary });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // Pandit-facing payout history. Each row is an admin-recorded payout that
  // settles one or more referral commissions.
  app.get("/api/pandit/payouts", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const items = await storage.listPanditPayouts(req.panditId!, { limit: 200 });
      res.json({ items });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ===== Card orders =====
  // One ₹999 physical card per membership. Razorpay checkout, HMAC-verified,
  // then admin transitions paid → printing → shipped → delivered.
  const CARD_PRICE_INR = 999;
  app.post("/api/pandit/card-order", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const schema = z.object({
        cardType: z.enum(["printed", "nfc"]).default("printed"),
        shippingName: z.string().min(1).max(120),
        shippingPhone: z.string().min(6).max(20),
        shippingAddress: z.string().min(5).max(500),
        shippingCity: z.string().min(1).max(80),
        shippingState: z.string().min(1).max(80),
        shippingPincode: z.string().min(4).max(10),
        notes: z.string().max(500).optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });

      // One card per membership: block if ANY paid/in-fulfilment OR delivered
      // card already exists. Unpaid `pending` rows from abandoned checkouts
      // are allowed to be retried so a dropped Razorpay session doesn't lock
      // the pandit out.
      const existing = await storage.listPanditCardOrders(req.panditId!);
      const blocked = (existing || []).find((o) =>
        ["paid", "printing", "shipped", "delivered"].includes(String(o.status)),
      );
      if (blocked) {
        return res.status(409).json({ message: "Your Pandit card is already on its way (or delivered). Only one card is issued per membership." });
      }

      const order = await storage.createPanditCardOrder({
        panditId: req.panditId!,
        ...parsed.data,
        quantity: 1,
        unitPrice: CARD_PRICE_INR,
        totalAmount: CARD_PRICE_INR,
        paymentStatus: "pending",
        status: "pending",
      });

      // Create the Razorpay order (or surface a clear error in production).
      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      let razorpayOrderId: string;
      let publishableKey: string;
      let mock = false;

      if (!keyId || !keySecret) {
        if (process.env.NODE_ENV === "production") {
          return res.status(503).json({ message: "Payment gateway is not configured. Please contact support." });
        }
        razorpayOrderId = "order_mock_card_" + Date.now();
        publishableKey = "rzp_test_mock";
        mock = true;
      } else {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzp = await razorpay.orders.create({
          amount: CARD_PRICE_INR * 100, // paise
          currency: "INR",
          receipt: `pcard_${order.id}`,
          notes: { panditCardOrderId: String(order.id), product: "Pandit Card" },
        });
        razorpayOrderId = rzp.id;
        publishableKey = keyId;
      }

      await storage.updatePanditCardOrder(order.id, { razorpayOrderId });

      res.json({
        orderId: order.id,
        razorpayOrderId,
        amount: CARD_PRICE_INR * 100,
        currency: "INR",
        key: publishableKey,
        unitPrice: CARD_PRICE_INR,
        totalAmount: CARD_PRICE_INR,
        ...(mock ? { mock: true } : {}),
      });
    } catch (e: any) {
      console.error("[card-order] create failed:", e?.message);
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  // HMAC-verify the Razorpay payment for a pandit card order.
  // Idempotent: replaying the same verify call after success is a no-op.
  app.post("/api/pandit/card-order/verify", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      const ord = await storage.getPanditCardOrder(Number(orderId));
      if (!ord || ord.panditId !== req.panditId) return res.status(404).json({ message: "Order not found" });

      // Idempotency: if we've already marked this order paid, return success
      // without re-running signature checks. Blocks verify-replay churn.
      if (ord.paymentStatus === "paid") {
        return res.json({ success: true, order: ord, idempotent: true });
      }

      if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({ success: false, message: "Missing Razorpay proof" });
      }
      if (!ord.razorpayOrderId || razorpay_order_id !== ord.razorpayOrderId) {
        return res.status(400).json({ success: false, message: "Razorpay order mismatch" });
      }
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret) {
        if (!razorpay_signature) {
          await storage.updatePanditCardOrder(ord.id, { paymentStatus: "failed" });
          return res.status(400).json({ success: false, message: "Missing payment signature" });
        }
        const expected = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        if (expected !== razorpay_signature) {
          await storage.updatePanditCardOrder(ord.id, { paymentStatus: "failed" });
          return res.status(400).json({ success: false, message: "Signature verification failed" });
        }
      } else if (process.env.NODE_ENV === "production") {
        return res.status(503).json({ success: false, message: "Payment gateway is not configured" });
      }
      // Dev only: when keySecret is not set we accept the mock payment for local testing.

      const updated = await storage.updatePanditCardOrder(ord.id, {
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: "paid",
        status: "paid",
      });
      // Fire-and-forget Shiprocket dispatch. Failure is logged on the row
      // (shiprocketError) so admin can see + retry from the affiliate tab.
      // Never blocks the verify response — payment success is independent
      // of fulfilment provider availability.
      dispatchCardOrderToShiprocket(ord.id).catch((e) => {
        console.warn(`[card-order] shiprocket auto-push failed id=${ord.id}:`, e?.message);
      });
      res.json({ success: true, order: updated });
    } catch (e: any) {
      res.status(500).json({ message: e?.message });
    }
  });

  app.get("/api/pandit/card-orders", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const items = await storage.listPanditCardOrders(req.panditId!);
      res.json({ items });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // ===== Membership tier upgrade =====
  // Pandits buy Silver/Gold/Guru Elite via Razorpay. The /order endpoint
  // creates a Razorpay order and a pending purchase row; /verify HMAC-checks
  // the payment proof, then flips pandits.tier and stamps tier_expires_at
  // (365 days from activation). Idempotent on replay.
  app.post("/api/pandit/membership/order", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const schema = z.object({ tier: z.enum(PAID_TIERS) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid tier" });
      const targetTier = parsed.data.tier as PaidTier;
      const amount = TIER_PRICE_INR[targetTier];

      const [pandit] = await db.select().from(pandits).where(eq(pandits.id, req.panditId!)).limit(1);
      if (!pandit) return res.status(404).json({ message: "Pandit not found" });

      const fromTier = ((pandit.tier || "free") === "platinum" ? "guru_elite" : (pandit.tier || "free"));

      const [purchase] = await db.insert(panditMembershipPurchases).values({
        panditId: req.panditId!,
        fromTier,
        toTier: targetTier,
        amount,
        paymentStatus: "pending",
      }).returning();

      const keyId = process.env.RAZORPAY_KEY_ID;
      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      let razorpayOrderId: string;
      let publishableKey: string;
      let mock = false;

      if (!keyId || !keySecret) {
        if (process.env.NODE_ENV === "production") {
          return res.status(503).json({ message: "Payment gateway is not configured. Please contact support." });
        }
        razorpayOrderId = "order_mock_mem_" + Date.now();
        publishableKey = "rzp_test_mock";
        mock = true;
      } else {
        const razorpay = new Razorpay({ key_id: keyId, key_secret: keySecret });
        const rzp = await razorpay.orders.create({
          amount: amount * 100,
          currency: "INR",
          receipt: `pmem_${purchase.id}`,
          notes: { panditMembershipPurchaseId: String(purchase.id), tier: targetTier, panditId: String(req.panditId) },
        });
        razorpayOrderId = rzp.id;
        publishableKey = keyId;
      }

      await db.update(panditMembershipPurchases)
        .set({ razorpayOrderId })
        .where(eq(panditMembershipPurchases.id, purchase.id));

      res.json({
        purchaseId: purchase.id,
        razorpayOrderId,
        amount: amount * 100,
        currency: "INR",
        key: publishableKey,
        tier: targetTier,
        priceInr: amount,
        ...(mock ? { mock: true } : {}),
      });
    } catch (e: any) {
      console.error("[membership] create failed:", e?.message);
      res.status(500).json({ message: e?.message || "Failed" });
    }
  });

  app.post("/api/pandit/membership/verify", panditAuthMiddleware, async (req: PanditRequest, res) => {
    try {
      const { purchaseId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body || {};
      const [purchase] = await db.select().from(panditMembershipPurchases)
        .where(eq(panditMembershipPurchases.id, Number(purchaseId))).limit(1);
      if (!purchase || purchase.panditId !== req.panditId) {
        return res.status(404).json({ message: "Purchase not found" });
      }
      if (purchase.paymentStatus === "paid") {
        return res.json({ success: true, idempotent: true, tier: purchase.toTier });
      }
      if (!razorpay_order_id || !razorpay_payment_id) {
        return res.status(400).json({ success: false, message: "Missing Razorpay proof" });
      }
      if (!purchase.razorpayOrderId || razorpay_order_id !== purchase.razorpayOrderId) {
        return res.status(400).json({ success: false, message: "Razorpay order mismatch" });
      }

      const keySecret = process.env.RAZORPAY_KEY_SECRET;
      if (keySecret) {
        if (!razorpay_signature || typeof razorpay_signature !== "string") {
          await db.update(panditMembershipPurchases).set({ paymentStatus: "failed" }).where(eq(panditMembershipPurchases.id, purchase.id));
          return res.status(400).json({ success: false, message: "Missing payment signature" });
        }
        const expected = crypto
          .createHmac("sha256", keySecret)
          .update(`${razorpay_order_id}|${razorpay_payment_id}`)
          .digest("hex");
        // Timing-safe HMAC compare. Length mismatch and any malformed hex
        // are treated as a verification failure (no early throw leak).
        let signatureOk = false;
        try {
          const a = Buffer.from(expected, "hex");
          const b = Buffer.from(razorpay_signature, "hex");
          signatureOk = a.length === b.length && crypto.timingSafeEqual(a, b);
        } catch { signatureOk = false; }
        if (!signatureOk) {
          await db.update(panditMembershipPurchases).set({ paymentStatus: "failed" }).where(eq(panditMembershipPurchases.id, purchase.id));
          return res.status(400).json({ success: false, message: "Signature verification failed" });
        }
      } else if (process.env.NODE_ENV === "production") {
        return res.status(503).json({ success: false, message: "Payment gateway is not configured" });
      }

      // Activate: flip pandit tier, stamp 365-day expiry, set commission to
      // tier default unless admin already set a custom value (we leave
      // commissionPct alone — admin overrides win).
      const now = new Date();
      const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
      await db.update(panditMembershipPurchases).set({
        razorpayPaymentId: razorpay_payment_id,
        paymentStatus: "paid",
        activatedAt: now,
        expiresAt: expires,
      }).where(eq(panditMembershipPurchases.id, purchase.id));

      await storage.updatePandit(req.panditId!, {
        tier: purchase.toTier,
        tierExpiresAt: expires,
      } as any);

      res.json({ success: true, tier: purchase.toTier, expiresAt: expires });
    } catch (e: any) {
      console.error("[membership] verify failed:", e?.message);
      res.status(500).json({ success: false, message: e?.message });
    }
  });

  // ===== ADMIN: pandit memberships =====
  // List every paid/refunded membership purchase, joined with the pandit's
  // name. Admin-only — surfaces who paid what, when, and when their tier
  // expires. Newest first.
  app.get("/api/admin/pandit-memberships", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const rows = await db.select({
        id: panditMembershipPurchases.id,
        panditId: panditMembershipPurchases.panditId,
        fromTier: panditMembershipPurchases.fromTier,
        toTier: panditMembershipPurchases.toTier,
        amount: panditMembershipPurchases.amount,
        razorpayPaymentId: panditMembershipPurchases.razorpayPaymentId,
        paymentStatus: panditMembershipPurchases.paymentStatus,
        activatedAt: panditMembershipPurchases.activatedAt,
        expiresAt: panditMembershipPurchases.expiresAt,
        lastReminderStage: panditMembershipPurchases.lastReminderStage,
        lastReminderAt: panditMembershipPurchases.lastReminderAt,
        createdAt: panditMembershipPurchases.createdAt,
      })
        .from(panditMembershipPurchases)
        .orderBy(desc(panditMembershipPurchases.createdAt))
        .limit(2000);

      const ps = await db.select({ id: pandits.id, name: pandits.name, city: pandits.city, tier: pandits.tier, tierExpiresAt: pandits.tierExpiresAt, email: pandits.email, phone: pandits.phone })
        .from(pandits);
      const byId = new Map(ps.map((p) => [p.id, p]));
      const items = rows.map((r) => {
        const p = byId.get(r.panditId);
        return { ...r, panditName: p?.name, panditCity: p?.city, panditEmail: p?.email, panditPhone: p?.phone, currentTier: p?.tier, currentTierExpiresAt: p?.tierExpiresAt };
      });
      res.json({ items });
    } catch (e: any) { res.status(500).json({ message: e?.message || "Failed" }); }
  });

  // Aggregate revenue + active subscriber stats by tier. Used by the
  // admin "Pandit Memberships" dashboard cards.
  app.get("/api/admin/pandit-memberships/stats", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const now = new Date();
      const since30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Lifetime paid revenue + count by tier
      const totals = await db.select({
        toTier: panditMembershipPurchases.toTier,
        revenue: sql<number>`coalesce(sum(${panditMembershipPurchases.amount}), 0)::int`,
        purchases: sql<number>`count(*)::int`,
      })
        .from(panditMembershipPurchases)
        .where(eq(panditMembershipPurchases.paymentStatus, "paid"))
        .groupBy(panditMembershipPurchases.toTier);

      const last30 = await db.select({
        revenue: sql<number>`coalesce(sum(${panditMembershipPurchases.amount}), 0)::int`,
        purchases: sql<number>`count(*)::int`,
      })
        .from(panditMembershipPurchases)
        .where(and(
          eq(panditMembershipPurchases.paymentStatus, "paid"),
          gte(panditMembershipPurchases.createdAt, since30),
        ));

      // Currently-active subscribers by tier (paid + not yet expired)
      const active = await db.select({
        tier: pandits.tier,
        count: sql<number>`count(*)::int`,
      })
        .from(pandits)
        .where(and(
          isNotNull(pandits.tier),
          isNotNull(pandits.tierExpiresAt),
          gte(pandits.tierExpiresAt, now),
        ))
        .groupBy(pandits.tier);

      // Renewals coming up in next 30 days (for the admin to nudge)
      const upcoming = await db.select({
        id: panditMembershipPurchases.id,
        panditId: panditMembershipPurchases.panditId,
        toTier: panditMembershipPurchases.toTier,
        expiresAt: panditMembershipPurchases.expiresAt,
      })
        .from(panditMembershipPurchases)
        .where(and(
          eq(panditMembershipPurchases.paymentStatus, "paid"),
          isNotNull(panditMembershipPurchases.expiresAt),
          gte(panditMembershipPurchases.expiresAt, now),
        ))
        .orderBy(panditMembershipPurchases.expiresAt)
        .limit(50);

      res.json({
        totalsByTier: totals,
        last30Days: last30[0] || { revenue: 0, purchases: 0 },
        activeByTier: active,
        upcomingRenewals: upcoming,
      });
    } catch (e: any) { res.status(500).json({ message: e?.message || "Failed" }); }
  });

  // Manually extend a pandit's current paid tier by N days (1..3650).
  // Useful when the admin wants to comp a renewal, apologise for an
  // outage, or reward a top performer. Audited.
  app.post("/api/admin/pandit-memberships/:panditId/extend", adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
    try {
      const schema = z.object({ days: z.number().int().min(1).max(3650), note: z.string().max(500).optional() });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid days" });
      const { days } = parsed.data;
      const panditId = Number(req.params.panditId);

      const [pandit] = await db.select().from(pandits).where(eq(pandits.id, panditId)).limit(1);
      if (!pandit) return res.status(404).json({ message: "Pandit not found" });

      const now = new Date();
      const base = pandit.tierExpiresAt && new Date(pandit.tierExpiresAt as any) > now
        ? new Date(pandit.tierExpiresAt as any)
        : now;
      const newExpiry = new Date(base.getTime() + days * 24 * 60 * 60 * 1000);

      await storage.updatePandit(panditId, { tierExpiresAt: newExpiry } as any);

      // Reset reminder stage so future reminders fire fresh.
      const [latest] = await db.select().from(panditMembershipPurchases)
        .where(and(eq(panditMembershipPurchases.panditId, panditId), eq(panditMembershipPurchases.paymentStatus, "paid")))
        .orderBy(desc(panditMembershipPurchases.createdAt))
        .limit(1);
      if (latest) {
        await db.update(panditMembershipPurchases)
          .set({ expiresAt: newExpiry, lastReminderStage: null, lastReminderAt: null })
          .where(eq(panditMembershipPurchases.id, latest.id));
      }

      res.json({ success: true, panditId, newExpiry });
    } catch (e: any) { res.status(500).json({ message: e?.message || "Failed" }); }
  });

  // ===== ADMIN =====
  // Storefront package and gallery publication is explicitly moderated by an
  // admin. Pandits can submit drafts but cannot promote their own content.
  app.get("/api/admin/storefront-submissions", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const [packages, gallery] = await Promise.all([
        storage.listAllPanditPackagesForModeration(),
        storage.listAllPanditGalleryItemsForModeration(),
      ]);
      const items = [
        ...packages.map(({ package: pkg, pandit }) => ({ type: "package" as const, ...pkg, pandit })),
        ...gallery.map(({ item, pandit }) => ({ type: "gallery" as const, ...item, pandit })),
      ].sort((a, b) => Number(new Date(b.createdAt)) - Number(new Date(a.createdAt)));
      res.json({ items });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to load storefront submissions" });
    }
  });

  app.patch("/api/admin/storefront-submissions/:type/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const type = z.enum(["package", "gallery"]).safeParse(req.params.type);
      const id = Number(req.params.id);
      const body = z.object({ isPublished: z.boolean() }).strict().safeParse(req.body);
      if (!type.success || !Number.isInteger(id) || id <= 0 || !body.success) {
        return res.status(400).json({ message: "Only an isPublished boolean may be changed" });
      }

      if (type.data === "package") {
        const pkg = await storage.getPanditPackage(id);
        if (!pkg) return res.status(404).json({ message: "Package not found" });
        if (body.data.isPublished) {
          if (!pkg.isActive) return res.status(400).json({ message: "Inactive packages cannot be approved" });
          const packageItems = await storage.listPanditPackageItems(pkg.id);
          if (!(await packageItemsAreOwnedActive(pkg.panditId, packageItems))) {
            return res.status(400).json({ message: "Packages require at least one active service owned by the pandit before approval" });
          }
        }
        const updated = await storage.updatePanditPackage(pkg.id, { isPublished: body.data.isPublished });
        return res.json({ item: { type: "package", ...updated } });
      }

      const galleryItem = await storage.getPanditGalleryItem(id);
      if (!galleryItem) return res.status(404).json({ message: "Gallery item not found" });
      if (galleryItem.removedAt) return res.status(409).json({ message: "Removed gallery items cannot be published or changed" });
      const updated = await storage.updatePanditGalleryItem(galleryItem.id, { isPublished: body.data.isPublished });
      return res.json({ item: { type: "gallery", ...updated } });
    } catch (e: any) {
      res.status(500).json({ message: e?.message || "Failed to update storefront submission" });
    }
  });

  app.get("/api/admin/referrals", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const panditId = req.query.panditId ? Number(req.query.panditId) : undefined;
      const rows = await storage.listAllPanditReferrals({ status, panditId, limit: 1000 });
      const pandits = await storage.getPandits();
      const nameById = new Map<number, string>(pandits.map((p) => [p.id, p.name]));
      const items = rows.map((r) => ({ ...r, panditName: nameById.get(r.panditId) }));
      res.json({ items });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.patch("/api/admin/referrals/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        status: z.enum(["pending", "confirmed", "approved", "paid", "rejected", "reversed"]).optional(),
        notes: z.string().max(500).nullable().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid" });
      const out = await storage.updatePanditReferral(Number(req.params.id), parsed.data);
      res.json({ referral: out });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // Bulk approve / reject / reverse referral commissions. Used by the admin
  // affiliate tab "Approve selected" action — moves rows from pending →
  // approved (eligible for batch payout) without writing a payout row yet.
  app.post("/api/admin/referrals/bulk", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        ids: z.array(z.number().int().positive()).min(1).max(500),
        status: z.enum(["pending", "approved", "rejected", "reversed"]),
        notes: z.string().max(500).nullable().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const updated = await storage.bulkUpdatePanditReferrals(parsed.data.ids, {
        status: parsed.data.status,
        notes: parsed.data.notes ?? undefined,
      });
      res.json({ updated });
    } catch (e: any) { res.status(500).json({ message: e?.message || "Failed" }); }
  });

  // Record a payout that settles one-or-more referral commissions in one
  // transaction. The amount is computed server-side from the referral rows
  // (we never trust a client total) and rows already paid/reversed/rejected
  // are silently skipped, preventing double-payment if two admins race.
  app.post("/api/admin/payouts", adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
    try {
      const schema = z.object({
        panditId: z.number().int().positive(),
        referralIds: z.array(z.number().int().positive()).min(1).max(500),
        method: z.enum(["upi", "bank", "cash", "other"]).default("upi"),
        reference: z.string().max(120).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid", errors: parsed.error.flatten() });
      const out = await storage.payoutPanditReferrals({
        panditId: parsed.data.panditId,
        referralIds: parsed.data.referralIds,
        method: parsed.data.method,
        reference: parsed.data.reference ?? null,
        notes: parsed.data.notes ?? null,
        createdByAdminId: req.adminUserId ?? null,
      });
      // Task #69: notify the pandit by email so they know the money is on the
      // way and can flag mistakes early. Fire-and-forget — logged but never
      // blocks or fails the payout response.
      try {
        const pandit = await storage.getPandit(parsed.data.panditId);
        if (pandit?.email) {
          sendEmailAsync(buildPanditPayoutEmail({
            to: pandit.email,
            fullName: pandit.name || "",
            amountInr: out.payout.amountInr,
            method: out.payout.method,
            reference: out.payout.reference,
            referralCount: out.settledIds.length,
            paidAt: out.payout.paidAt || new Date(),
          }), "pandit-payout-email");
        }
      } catch (e: any) { console.error("[payout] email notify error:", e?.message || e); }
      res.json({ payout: out.payout, settledIds: out.settledIds });
    } catch (e: any) {
      const msg = e?.message || "Failed";
      const code = /eligible|No referrals|₹0|Concurrent payout/.test(msg) ? 400 : 500;
      res.status(code).json({ message: msg });
    }
  });

  // Task #70: reverse a recorded payout. Restores the settled referrals to
  // 'approved' (clears payout_id) and stamps reversed_at + reverse_reason on
  // the payout row so the audit trail is preserved. Notifies the pandit by
  // email so a wrong-VPA payout doesn't silently disappear from their view.
  app.post("/api/admin/payouts/:id/reverse", adminAuthMiddleware, async (req: AdminRequest, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
      const schema = z.object({ reason: z.string().max(500).nullable().optional() });
      const parsed = schema.safeParse(req.body || {});
      if (!parsed.success) return res.status(400).json({ message: "Invalid" });
      const result = await storage.reversePanditPayout(id, parsed.data.reason ?? null);
      if (!result) return res.status(409).json({ message: "Payout not found or already reversed" });
      try {
        const pandit = await storage.getPandit(result.payout.panditId);
        if (pandit?.email) {
          sendEmailAsync(buildPanditPayoutEmail({
            to: pandit.email,
            fullName: pandit.name || "",
            amountInr: result.payout.amountInr,
            method: result.payout.method,
            reference: result.payout.reference,
            referralCount: result.restoredIds.length,
            paidAt: result.payout.paidAt || new Date(),
            reversed: true,
            reverseReason: parsed.data.reason ?? null,
          }), "pandit-payout-reverse-email");
        }
      } catch (e: any) { console.error("[payout] reverse email error:", e?.message || e); }
      res.json({ payout: result.payout, restoredIds: result.restoredIds });
    } catch (e: any) { res.status(500).json({ message: e?.message || "Failed" }); }
  });

  app.get("/api/admin/payouts", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const panditId = req.query.panditId ? Number(req.query.panditId) : undefined;
      const rows = await storage.listAllPanditPayouts({ panditId, limit: 1000 });
      const pandits = await storage.getPandits();
      const nameById = new Map<number, string>(pandits.map((p) => [p.id, p.name]));
      const items = rows.map((r) => ({ ...r, panditName: nameById.get(r.panditId) }));
      res.json({ items });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.get("/api/admin/card-orders", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const status = typeof req.query.status === "string" ? req.query.status : undefined;
      const items = await storage.listAllPanditCardOrders({ status, limit: 500 });
      res.json({ items });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // Storefront governance — top performers + per-pandit commission override.
  app.get("/api/admin/storefronts", adminAuthMiddleware, async (_req: Request, res: Response) => {
    try {
      const list = await storage.getPandits();
      const enriched = await Promise.all((list || []).map(async (p) => {
        const sf = await storage.getPanditStorefrontByPanditId(p.id).catch(() => null);
        const summary = await storage.panditReferralSummary(p.id).catch(() => ({ totalCommission: 0, count: 0 }));
        return {
          panditId: p.id, name: p.name, slug: p.slug, tier: p.tier, city: p.city,
          productCommissionPct: p.productCommissionPct ?? 0,
          isPublished: !!sf?.isPublished,
          productCount: Array.isArray(sf?.productIds) ? sf!.productIds.length : 0,
          viewCount: sf?.viewCount ?? 0,
          totalCommission: summary.totalCommission || 0,
          referralCount: summary.count || 0,
          membershipNo: p.membershipNo || `VT-PND-${String(p.id).padStart(5, "0")}`,
          cardIssued: p.cardIssued !== false,
        };
      }));
      enriched.sort((a, b) => (b.totalCommission - a.totalCommission) || (b.viewCount - a.viewCount));
      res.json({ items: enriched });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.patch("/api/admin/storefronts/:panditId", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        productCommissionPct: z.number().int().min(0).max(50).optional(),
        isPublished: z.boolean().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid" });
      const panditId = Number(req.params.panditId);
      if (parsed.data.productCommissionPct !== undefined) {
        await storage.updatePandit(panditId, { productCommissionPct: parsed.data.productCommissionPct });
      }
      if (parsed.data.isPublished !== undefined) {
        await storage.updatePanditStorefront(panditId, { isPublished: parsed.data.isPublished });
      }
      res.json({ ok: true });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // Admin issues / revokes a pandit's card. When issued, pandit can
  // download + share the dual-sided business card from their dashboard.
  app.post("/api/admin/pandits/:id/issue-card", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({ issued: z.boolean().default(true) });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid" });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
      // Make sure membershipNo exists for the pandit before flipping the
      // flag so the resulting card always has a stable member id.
      await storage.ensurePanditMembershipNo(id).catch(() => {});
      const updated = await storage.setPanditCardIssued(id, parsed.data.issued);
      if (!updated) return res.status(404).json({ message: "Pandit not found" });
      res.json({ pandit: { id: updated.id, cardIssued: updated.cardIssued, cardIssuedAt: updated.cardIssuedAt, membershipNo: updated.membershipNo } });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  app.patch("/api/admin/card-orders/:id", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const schema = z.object({
        status: z.enum(["pending", "paid", "printing", "shipped", "delivered", "cancelled"]).optional(),
        trackingNumber: z.string().max(80).nullable().optional(),
        trackingUrl: z.string().max(500).nullable().optional(),
        shiprocketOrderId: z.string().max(80).nullable().optional(),
        shiprocketShipmentId: z.string().max(80).nullable().optional(),
        notes: z.string().max(500).nullable().optional(),
      });
      const parsed = schema.safeParse(req.body);
      if (!parsed.success) return res.status(400).json({ message: "Invalid" });
      const out = await storage.updatePanditCardOrder(Number(req.params.id), parsed.data);
      res.json({ order: out });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });

  // Admin "Push to Shiprocket" — manual retry / first push for paid card
  // orders. Used when the auto-dispatch from /verify failed (Shiprocket
  // outage, mis-configured creds) or when the order was paid before this
  // feature shipped. Idempotent — returns 409 if already dispatched.
  app.post("/api/admin/card-orders/:id/shiprocket", adminAuthMiddleware, async (req: Request, res: Response) => {
    try {
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ message: "Bad id" });
      const ord = await storage.getPanditCardOrder(id);
      if (!ord) return res.status(404).json({ message: "Order not found" });
      if (ord.paymentStatus !== "paid") {
        return res.status(400).json({ message: "Order is not paid yet" });
      }
      if (ord.shiprocketOrderId) {
        return res.status(409).json({ message: "Order already pushed to Shiprocket", order: ord });
      }
      const ok = await dispatchCardOrderToShiprocket(id);
      const fresh = await storage.getPanditCardOrder(id);
      if (!ok) {
        return res.status(502).json({ message: fresh?.shiprocketError || "Shiprocket dispatch failed", order: fresh });
      }
      res.json({ order: fresh });
    } catch (e: any) { res.status(500).json({ message: e?.message }); }
  });
}
