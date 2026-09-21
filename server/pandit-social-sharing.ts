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
  membershipNo: string | null;
  registrationNo: string | null;
  experience: number | null;
  languages: string[];
  revision: string;
};

const CACHE_DIR = "/tmp/vedic-tatva-social";
const SOCIAL_TEMPLATE_VERSION = "v7";
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

function publicLanguages(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).map((part) => part.trim()).filter(Boolean).slice(0, 3);
  return String(value || "").split(",").map((part) => part.trim()).filter(Boolean).slice(0, 3);
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
    membershipNo: String(pandit.membershipNo || "").trim()
      || (Number.isInteger(Number(pandit.id)) ? `VT-PND-${String(pandit.id).padStart(5, "0")}` : null),
    registrationNo: /^\d{10}$/.test(String(pandit.registrationNo || "")) ? String(pandit.registrationNo) : null,
    experience: Number.isFinite(Number(pandit.experience)) && Number(pandit.experience) > 0 ? Number(pandit.experience) : null,
    languages: publicLanguages(pandit.languages),
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
  const photo = await fetchAsset(baseUrl, projection.image || projection.bannerImage, format === "og" ? 300 : 540);
  const qr = await QRCode.toDataURL(`${baseUrl}${projection.canonicalPath}`, {
    width: format === "og" ? 180 : 360,
    margin: 2,
    errorCorrectionLevel: "H",
    color: { dark: "#4a1a22", light: "#FFFAEC" },
  });
  const city = [projection.city, projection.state].filter(Boolean).join(", ");
  const rating = projection.rating && projection.reviewCount
    ? `${projection.rating.toFixed(1)} stars · ${projection.reviewCount} reviews`
    : "Verified by Vedic Tatva";
  const specs = projection.specializations.slice(0, 3).join(" · ");
  const practice = specs || "Vedic puja and ceremony services";
  const languages = projection.languages.join(" · ") || "Hindi · Sanskrit";
  const experience = projection.experience ? `${projection.experience}+ years` : "Experienced practitioner";
  const membership = projection.membershipNo || "Public profile";
  const initials = projection.name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase() || "VT";
  const bg = format === "og"
    ? `<rect width="1200" height="630" fill="url(#bg)"/><rect x="0" y="0" width="350" height="630" fill="#4B1720"/><rect x="350" y="0" width="850" height="82" fill="#6D2B35"/><circle cx="175" cy="295" r="146" fill="#FFF8E8" stroke="#D4AF37" stroke-width="6"/>`
    : `<rect width="1080" height="1920" fill="url(#bg)"/><rect x="0" y="0" width="1080" height="170" fill="#6D2B35"/>`;
  const text = format === "og"
    ? `
      <text x="175" y="48" font-family="Georgia,serif" font-size="26" font-weight="700" fill="#D4AF37" text-anchor="middle">Vedic Tatva</text>
      <text x="175" y="72" font-family="sans-serif" font-size="11" letter-spacing="2" fill="#FFF8E8" text-anchor="middle">PANDITJI STORE</text>
      <text x="175" y="500" font-family="sans-serif" font-size="12" letter-spacing="1.5" fill="#F2D27A" text-anchor="middle">PUBLIC VEDIC PROFILE</text>
      <text x="175" y="528" font-family="Georgia,serif" font-size="18" font-weight="700" fill="#FFF8E8" text-anchor="middle">${esc(membership)}</text>
      <text x="175" y="557" font-family="sans-serif" font-size="12" fill="#F9EEDC" text-anchor="middle">Verified on Vedic Tatva</text>
      <text x="175" y="592" font-family="sans-serif" font-size="11" fill="#F9EEDC" text-anchor="middle">Contact securely via storefront</text>
      <text x="400" y="47" font-family="sans-serif" font-size="12" letter-spacing="2" fill="#F2D27A">VEDIC PANDIT PROFILE</text>
      <text x="400" y="125" font-family="Georgia,serif" font-size="43" font-weight="700" fill="#4a1a22">${esc(projection.name).slice(0, 25)}</text>
      ${projection.verified ? `<rect x="402" y="145" width="158" height="28" rx="14" fill="#D4AF37"/><text x="481" y="164" font-family="sans-serif" font-size="12" font-weight="700" fill="#4a1a22" text-anchor="middle">✓ VERIFIED PANDIT</text>` : ""}
      <text x="400" y="205" font-family="sans-serif" font-size="19" font-weight="700" fill="#6D2B35">${esc(practice).slice(0, 48)}</text>
      <line x1="400" y1="228" x2="950" y2="228" stroke="#DCCAAE" stroke-width="2"/>
      <text x="400" y="260" font-family="sans-serif" font-size="11" letter-spacing="1.2" fill="#9A641F">PRACTISING DETAILS</text>
      <text x="400" y="285" font-family="sans-serif" font-size="17" fill="#5A4A3A">${esc(experience)} · ${esc(languages).slice(0, 42)}</text>
      <text x="400" y="327" font-family="sans-serif" font-size="11" letter-spacing="1.2" fill="#9A641F">AREA &amp; LOCATION</text>
      <text x="400" y="352" font-family="sans-serif" font-size="17" fill="#5A4A3A">${esc(city || "India")}</text>
      <text x="400" y="394" font-family="sans-serif" font-size="11" letter-spacing="1.2" fill="#9A641F">STORE DETAILS</text>
      <text x="400" y="419" font-family="sans-serif" font-size="17" fill="#5A4A3A">Puja services · Vedic Tatva storefront</text>
      <text x="400" y="456" font-family="sans-serif" font-size="15" fill="#6D2B35">Contact Panditji securely through Vedic Tatva</text>
      <text x="400" y="492" font-family="monospace" font-size="15" fill="#5A4A3A">vedictatva.com${esc(projection.canonicalPath)}</text>
      <rect x="988" y="248" width="174" height="218" rx="16" fill="#FFFDF7" stroke="#D8B878" stroke-width="2"/>
      <image href="${esc(qr)}" x="1000" y="260" width="150" height="150"/>
      <text x="1075" y="435" font-family="sans-serif" font-size="12" font-weight="700" fill="#4a1a22" text-anchor="middle">SCAN PROFILE</text>
      <text x="1075" y="452" font-family="sans-serif" font-size="10" fill="#735E54" text-anchor="middle">Book · Shop · Connect</text>
      <rect x="350" y="585" width="850" height="45" fill="#D4AF37"/>
      <text x="775" y="614" font-family="sans-serif" font-size="14" font-weight="700" fill="#4a1a22" text-anchor="middle">Vedic Tatva · Authentic Vedic Services · View storefront</text>`
    : `
      <text x="540" y="72" font-family="Arial,sans-serif" font-size="48" font-weight="700" fill="#D4AF37" text-anchor="middle">Vedic Tatva</text>
      <text x="540" y="108" font-family="Arial,sans-serif" font-size="14" letter-spacing="3" fill="#FFF8E8" text-anchor="middle">PANDITJI STORE</text>
      <text x="540" y="225" font-family="Georgia,serif" font-size="58" font-weight="700" fill="#4a1a22" text-anchor="middle">${esc(projection.name).slice(0, 25)}</text>
      ${projection.verified ? `<rect x="390" y="252" width="300" height="42" rx="21" fill="#D4AF37"/><text x="540" y="279" font-family="Arial,sans-serif" font-size="17" font-weight="700" fill="#4a1a22" text-anchor="middle">✓ VERIFIED PANDIT</text>` : ""}
      <text x="540" y="350" font-family="Arial,sans-serif" font-size="28" font-weight="700" fill="#6D2B35" text-anchor="middle">${esc(practice).slice(0, 44)}</text>
      <text x="540" y="395" font-family="Arial,sans-serif" font-size="23" fill="#5a4a3a" text-anchor="middle">${esc(city || "India")}</text>
      <line x1="180" y1="430" x2="900" y2="430" stroke="#DCCAAE" stroke-width="2"/>
      <text x="540" y="475" font-family="Arial,sans-serif" font-size="13" letter-spacing="2" fill="#9A641F" text-anchor="middle">PRACTISING DETAILS</text>
      <text x="540" y="510" font-family="Arial,sans-serif" font-size="23" fill="#5a4a3a" text-anchor="middle">${esc(experience)} · ${esc(languages).slice(0, 42)}</text>
      <text x="540" y="1110" font-family="Arial,sans-serif" font-size="13" letter-spacing="2" fill="#9A641F" text-anchor="middle">VEDIC TATVA MEMBERSHIP</text>
      <text x="540" y="1150" font-family="Georgia,serif" font-size="30" font-weight="700" fill="#4a1a22" text-anchor="middle">${esc(membership)}</text>
      <text x="540" y="1200" font-family="Arial,sans-serif" font-size="19" fill="#6D2B35" text-anchor="middle">Contact securely via Vedic Tatva</text>
      <image href="${esc(qr)}" x="360" y="1250" width="360" height="360"/>
      <text x="540" y="1665" font-family="Arial,sans-serif" font-size="22" font-weight="700" fill="#6D2B35" text-anchor="middle">SCAN TO VIEW PROFILE</text>
      <text x="540" y="1720" font-family="monospace" font-size="20" fill="#5a4a3a" text-anchor="middle">vedictatva.com${esc(projection.canonicalPath)}</text>
      <rect x="0" y="1885" width="1080" height="35" fill="#D4AF37"/>`;
  const svg = `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs><linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFFAEC"/><stop offset="1" stop-color="#F5E9CF"/></linearGradient></defs>
    ${bg}${text}
    ${format === "og" ? `<text x="175" y="306" font-family="Georgia,serif" font-size="64" font-weight="700" fill="#6D2B35" text-anchor="middle">${esc(initials)}</text>` : `<circle cx="540" cy="790" r="270" fill="#FFFAEC" stroke="#D4AF37" stroke-width="8"/><text x="540" y="812" font-family="Arial,sans-serif" font-size="80" font-weight="700" fill="#6D2B35" text-anchor="middle">${esc(initials)}</text>`}
  </svg>`;
  const composites: { input: Buffer; left?: number; top?: number }[] = [];
  if (photo) composites.push({ input: photo, left: format === "og" ? 25 : 270, top: format === "og" ? 145 : 520 });
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