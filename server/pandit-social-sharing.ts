import crypto from "node:crypto";
import fsSync from "node:fs";
import fs from "node:fs/promises";
import path from "node:path";
import QRCode from "qrcode";
import puppeteer from "puppeteer";
import { storage } from "./storage";
import { getPublishedPanditContent } from "./pandit-storefront-content";
import { getPubliclyPublishedPanditBySlug } from "./pandit-public-access";

export type PanditSocialProjection = {
  slug: string;
  canonicalPath: string;
  name: string;
  image: string | null;
  bannerImage: string | null;
  city: string | null;
  state: string | null;
  verified: boolean;
  specialization: string | null;
  specializations: string[];
  rating: number | null;
  reviewCount: number;
  tagline: string | null;
  revision: string;
};

const CACHE_DIR = "/tmp/vedic-tatva-social";
const SOCIAL_TEMPLATE_VERSION = "v4";
const DEFAULT_PUBLIC_ORIGIN = "https://vedictatva.com";
const STORY_VIEWPORT = { width: 360, height: 640, deviceScaleFactor: 3 };
const IMAGE_HOST_ALLOWLIST = new Set([
  "vedictatva.com", "www.vedictatva.com", "images.unsplash.com",
  "res.cloudinary.com", "ucarecdn.com", "lh3.googleusercontent.com",
  "lh4.googleusercontent.com", "lh5.googleusercontent.com",
]);
let browserPromise: ReturnType<typeof puppeteer.launch> | null = null;

function esc(value: unknown): string {
  return String(value || "").replace(/[<&>"']/g, (c) => ({
    "<": "&lt;", "&": "&amp;", ">": "&gt;", '"': "&quot;", "'": "&apos;",
  }[c]!));
}

function safeSlug(value: string): string {
  return value.toLowerCase().trim().replace(/[^a-z0-9-]/g, "").slice(0, 100);
}

export async function resolvePanditSocialProjection(slug: string): Promise<PanditSocialProjection | null> {
  const normalized = safeSlug(slug);
  if (!normalized) return null;
  const pandit = await getPubliclyPublishedPanditBySlug(normalized);
  if (!pandit) return null;
  const storefront = await storage.getPanditStorefrontByPanditId(pandit.id);
  const editorial = await getPublishedPanditContent(pandit.id).catch(() => null);
  const specialization = typeof pandit.specialization === "string" ? pandit.specialization.trim() : "";
  const tagline = editorial?.publishedTagline || storefront?.tagline || null;
  const publicFields = {
    slug: normalized,
    name: pandit.name,
    image: pandit.image || null,
    bannerImage: storefront?.bannerImage || null,
    city: pandit.city || null,
    state: pandit.state || null,
    verified: pandit.verified === true,
    specialization: specialization || null,
    tagline,
    rating: pandit.rating == null ? null : Number(pandit.rating),
    reviewCount: Number(pandit.reviewCount || 0),
  };
  const revision = crypto.createHash("sha256").update(JSON.stringify(publicFields)).digest("hex").slice(0, 16);
  return {
    ...publicFields,
    canonicalPath: `/pandit/${encodeURIComponent(normalized)}`,
    specializations: specialization ? [specialization] : [],
    revision,
  };
}

function resolveAssetUrl(baseUrl: string, image: string): string | null {
  try {
    if (!image.startsWith("http")) return `${baseUrl}${image.startsWith("/") ? "" : "/"}${image}`;
    const u = new URL(image);
    if (!["http:", "https:"].includes(u.protocol)) return null;
    const host = u.hostname.toLowerCase();
    const privateHost = host === "localhost" || host === "0.0.0.0"
      || /^127\./.test(host) || /^10\./.test(host) || /^192\.168\./.test(host)
      || /^172\.(1[6-9]|2\d|3[01])\./.test(host) || /^169\.254\./.test(host)
      || host.endsWith(".local") || host.endsWith(".internal");
    const ownHost = new URL(baseUrl).hostname.toLowerCase();
    if (privateHost || (host !== ownHost && !IMAGE_HOST_ALLOWLIST.has(host))) return null;
    return u.toString();
  } catch {
    return null;
  }
}

async function fetchAsset(baseUrl: string, image: string | null, size: number): Promise<Buffer | null> {
  if (!image) return null;
  const assetUrl = resolveAssetUrl(baseUrl, image);
  if (!assetUrl) return null;
  try {
    const response = await fetch(assetUrl, { signal: AbortSignal.timeout(4000), redirect: "error" });
    if (!response.ok) return null;
    const bytes = Buffer.from(await response.arrayBuffer());
    const sharp = (await import("sharp")).default;
    const mask = Buffer.from(`<svg width="${size}" height="${size}"><circle cx="${size / 2}" cy="${size / 2}" r="${size / 2}" fill="#fff"/></svg>`);
    return await sharp(bytes).resize(size, size, { fit: "cover" })
      .composite([{ input: mask, blend: "dest-in" }]).png().toBuffer();
  } catch {
    return null;
  }
}

function revisionCachePath(projection: PanditSocialProjection, baseUrl: string, format: "og" | "story"): string {
  const originHash = crypto.createHash("sha256").update(baseUrl).digest("hex").slice(0, 8);
  return path.join(CACHE_DIR, `${SOCIAL_TEMPLATE_VERSION}-${format}-${safeSlug(projection.slug)}-${projection.revision}-${originHash}.jpg`);
}

function captureOrigin(): string {
  const port = Number(process.env.PORT || 5000);
  return `http://127.0.0.1:${Number.isFinite(port) && port > 0 ? port : 5000}`;
}

function chromiumExecutablePath(): string {
  const configured = process.env.PUPPETEER_EXECUTABLE_PATH;
  if (configured && fsSync.existsSync(configured)) return configured;
  const knownPaths = [
    "/repl/tools/bin/chromium",
    "/usr/bin/chromium",
    "/usr/bin/chromium-browser",
    "/usr/bin/google-chrome",
  ];
  const knownExecutable = knownPaths.find((candidate) => fsSync.existsSync(candidate));
  if (knownExecutable) return knownExecutable;
  return puppeteer.executablePath();
}

async function storefrontStoryScreenshot(projection: PanditSocialProjection): Promise<Buffer> {
  browserPromise ||= puppeteer.launch({
    headless: true,
    executablePath: chromiumExecutablePath(),
    args: ["--no-sandbox", "--disable-dev-shm-usage"],
  });
  const browser = await browserPromise;
  const page = await browser.newPage();
  await page.setViewport(STORY_VIEWPORT);
  try {
    const storefrontUrl = new URL(projection.canonicalPath, `${captureOrigin()}/`).toString();
    await page.goto(storefrontUrl, {
      waitUntil: "domcontentloaded",
      timeout: 20_000,
    });
    await page.waitForSelector("#overview", { visible: true, timeout: 20_000 });
    await page.evaluate(async () => {
      await document.fonts?.ready;
      await new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      });
    });
    return Buffer.from(await page.screenshot({
      type: "jpeg",
      quality: 90,
      captureBeyondViewport: false,
    }));
  } finally {
    await page.close().catch(() => {});
  }
}

export async function renderPanditSocialImage(
  projection: PanditSocialProjection,
  baseUrl: string,
  format: "og" | "story",
  options: { captureStorefront?: boolean } = {},
): Promise<{ buffer: Buffer; cacheHit: boolean }> {
  const width = format === "og" ? 1200 : 1080;
  const height = format === "og" ? 630 : 1920;
  const cachePath = revisionCachePath(projection, baseUrl, format);
  try {
    return { buffer: await fs.readFile(cachePath), cacheHit: true };
  } catch {}

  if (format === "story" && options.captureStorefront) {
    try {
      const buffer = await storefrontStoryScreenshot(projection);
      await fs.mkdir(CACHE_DIR, { recursive: true }).then(() => fs.writeFile(cachePath, buffer)).catch(() => {});
      return { buffer, cacheHit: false };
    } catch (error) {
      console.warn("[social-story] storefront screenshot unavailable; using fallback card:", (error as Error)?.message);
    }
  }

  const sharp = (await import("sharp")).default;
  const photo = await fetchAsset(baseUrl, projection.image || projection.bannerImage, format === "og" ? 400 : 700);
  const qr = format === "story"
    ? await QRCode.toDataURL(`${baseUrl}${projection.canonicalPath}`, {
      width: 360, margin: 2, errorCorrectionLevel: "H",
      color: { dark: "#4a1a22", light: "#FFFAEC" },
    })
    : "";
  const city = [projection.city, projection.state].filter(Boolean).join(", ");
  const rating = projection.rating && projection.reviewCount
    ? `${projection.rating.toFixed(1)} stars · ${projection.reviewCount} reviews`
    : "Verified by Vedic Tatva";
  const specs = projection.specializations.slice(0, 3).join(" · ");
  const bg = format === "og"
    ? `<rect width="1200" height="630" fill="url(#bg)"/><rect x="0" y="0" width="1200" height="90" fill="#6D2B35"/>`
    : `<rect width="1080" height="1920" fill="url(#bg)"/><rect x="0" y="0" width="1080" height="170" fill="#6D2B35"/>`;
  const text = format === "og"
    ? `
      <text x="60" y="60" font-family="Georgia,serif" font-size="36" font-weight="700" fill="#D4AF37">Vedic Tatva</text>
      <text x="1140" y="60" font-family="serif" font-size="22" fill="#FFFAEC" text-anchor="end">vedictatva.com${esc(projection.canonicalPath)}</text>
      <text x="540" y="220" font-family="Georgia,serif" font-size="56" font-weight="700" fill="#4a1a22">${esc(projection.name).slice(0, 22)}</text>
      <text x="540" y="280" font-family="serif" font-size="32" fill="#6D2B35">${esc(city)}</text>
      <text x="540" y="340" font-family="serif" font-size="26" fill="#5a4a3a">${esc(rating)}</text>
      <text x="540" y="395" font-family="serif" font-size="23" fill="#5a4a3a">${esc(specs).slice(0, 42)}</text>
      <text x="540" y="445" font-family="serif" font-size="22" fill="#5a4a3a">Book this Panditji on Vedic Tatva</text>
      ${projection.verified ? `<rect x="540" y="500" width="220" height="46" rx="6" fill="#D4AF37"/><text x="650" y="530" font-family="serif" font-size="22" font-weight="700" fill="#4a1a22" text-anchor="middle">VERIFIED PANDIT</text>` : ""}
      <rect x="0" y="610" width="1200" height="20" fill="#D4AF37"/>`
    : `
      <text x="540" y="72" font-family="Georgia,serif" font-size="48" font-weight="700" fill="#D4AF37" text-anchor="middle">Vedic Tatva</text>
      <text x="540" y="245" font-family="Georgia,serif" font-size="58" font-weight="700" fill="#4a1a22" text-anchor="middle">${esc(projection.name).slice(0, 25)}</text>
      <text x="540" y="305" font-family="serif" font-size="31" fill="#6D2B35" text-anchor="middle">${esc(city)}</text>
      <text x="540" y="365" font-family="serif" font-size="26" fill="#5a4a3a" text-anchor="middle">${esc(rating)}</text>
      <text x="540" y="430" font-family="serif" font-size="25" fill="#5a4a3a" text-anchor="middle">${esc(specs).slice(0, 40)}</text>
      <text x="540" y="490" font-family="serif" font-size="28" font-weight="700" fill="#4a1a22" text-anchor="middle">Book this Panditji on Vedic Tatva</text>
      ${projection.tagline ? `<text x="540" y="550" font-family="serif" font-size="23" fill="#5a4a3a" text-anchor="middle">${esc(projection.tagline).slice(0, 58)}</text>` : ""}
      <image href="${esc(qr)}" x="360" y="1350" width="360" height="360"/>
      <text x="540" y="1770" font-family="serif" font-size="24" fill="#6D2B35" text-anchor="middle">Scan to view profile</text>
      <text x="540" y="1830" font-family="serif" font-size="22" fill="#5a4a3a" text-anchor="middle">vedictatva.com${esc(projection.canonicalPath)}</text>
      <rect x="0" y="1885" width="1080" height="35" fill="#D4AF37"/>`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFAEC"/><stop offset="1" stop-color="#F5E9CF"/></linearGradient></defs>
    ${bg}${text}
    ${format === "og" ? `<circle cx="270" cy="315" r="208" fill="#FFFAEC" stroke="#D4AF37" stroke-width="6"/>` : `<circle cx="540" cy="820" r="270" fill="#FFFAEC" stroke="#D4AF37" stroke-width="8"/>`}
  </svg>`;
  const composites: { input: Buffer; left?: number; top?: number }[] = [];
  if (photo) composites.push({ input: photo, left: format === "og" ? 70 : 190, top: format === "og" ? 115 : 550 });
  const buffer = await sharp(Buffer.from(svg)).composite(composites).jpeg({ quality: 86, mozjpeg: true }).toBuffer();
  await fs.mkdir(CACHE_DIR, { recursive: true }).then(() => fs.writeFile(cachePath, buffer)).catch(() => {});
  return { buffer, cacheHit: false };
}

export function socialSiteUrl(req: { headers: Record<string, any>; protocol?: string; get(name: string): string | undefined }): string {
  const configured = process.env.PUBLIC_SITE_URL || DEFAULT_PUBLIC_ORIGIN;
  try {
    const url = new URL(configured);
    if (url.protocol !== "https:" && url.hostname !== "localhost") return DEFAULT_PUBLIC_ORIGIN;
    return url.origin;
  } catch {
    return DEFAULT_PUBLIC_ORIGIN;
  }
}