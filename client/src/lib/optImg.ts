export type ImgFormat = "avif" | "webp" | "jpeg";

export function optImg(src: string | undefined | null, width = 600, format: ImgFormat = "webp", quality = 75): string | undefined {
  if (!src) return undefined;
  if (typeof src !== "string") return undefined;
  if (src.startsWith("data:") || src.startsWith("blob:")) return src;
  if (/^https?:\/\//i.test(src)) return src;
  if (!src.startsWith("/attached_assets/") && !src.startsWith("/uploads/")) return src;
  const w = Math.max(16, Math.min(2000, Math.round(width)));
  const q = Math.max(40, Math.min(95, Math.round(quality)));
  return `/api/img?src=${encodeURIComponent(src)}&w=${w}&fmt=${format}&q=${q}`;
}

export function optImgSrcSet(src: string | undefined | null, widths: number[] = [320, 600, 900, 1200], format: ImgFormat = "webp"): string | undefined {
  if (!src || typeof src !== "string") return undefined;
  if (src.startsWith("data:") || src.startsWith("blob:")) return undefined;
  if (/^https?:\/\//i.test(src)) return undefined;
  if (!src.startsWith("/attached_assets/") && !src.startsWith("/uploads/")) return undefined;
  return widths.map(w => `${optImg(src, w, format)} ${w}w`).join(", ");
}

// Common sizes attribute presets — keep in one place so all responsive
// images stay in sync as the layout evolves.
export const SIZES = {
  productCard: "(min-width: 1280px) 280px, (min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  productHero: "(min-width: 1024px) 600px, 100vw",
  hero: "100vw",
  thumbnail: "120px",
} as const;
