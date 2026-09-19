import { useEffect, useState } from "react";

import type { SiteSettings } from "@shared/schema";

export type BrandPlacement = "desktop" | "mobile" | "menu" | "footer";

type BrandMarkProps = {
  settings?: Partial<SiteSettings> | null;
  placement?: BrandPlacement;
  className?: string;
  testId?: string;
};

const defaults = {
  siteName: "Vedic Tatva",
  tagline: "Heritage of Nature Wellness & Purity",
  logoDisplayMode: "both",
  logoSizePx: 27,
  logoScalePercent: 100,
  logoPosition: "left",
  logoTextColor: "#6D2B35",
  taglineVisible: false,
  taglineColor: "#6B5B52",
  taglineSizePx: 14,
  logoFontSource: "curated",
  logoFontFamily: "Tiro Devanagari Sanskrit",
  customLogoFontUrl: "",
  logoFontWeight: 400,
  logoLetterSpacing: 0,
} as const;

export function BrandMark({ settings, placement = "desktop", className = "", testId }: BrandMarkProps) {
  const s = { ...defaults, ...(settings || {}) };
  const fontUrl = s.logoFontSource === "custom" ? s.customLogoFontUrl : "";
  const [imageFailed, setImageFailed] = useState(false);
  const fontHash = Array.from(fontUrl || "").reduce((value, character) => ((value * 31) + character.charCodeAt(0)) >>> 0, 0);
  const customFontFamily = `VedicCustomLogo${fontHash}`;

  useEffect(() => setImageFailed(false), [s.logoUrl]);

  useEffect(() => {
    if (!fontUrl || typeof document === "undefined") return;
    const id = `vt-custom-logo-font-${fontHash}`;
    let style = document.getElementById(id) as HTMLStyleElement | null;
    if (!style) {
      style = document.createElement("style");
      style.id = id;
      style.dataset.references = "0";
      const format = fontUrl.toLowerCase().endsWith(".woff2") ? "woff2" : "woff";
      style.textContent = `@font-face{font-family:"${customFontFamily}";src:url("${fontUrl}") format("${format}");font-display:swap;font-weight:400 700;}`;
      document.head.appendChild(style);
    }
    style.dataset.references = String(Number(style.dataset.references || 0) + 1);
    return () => {
      if (!style) return;
      const references = Math.max(0, Number(style.dataset.references || 1) - 1);
      if (references === 0) style.remove();
      else style.dataset.references = String(references);
    };
  }, [customFontFamily, fontHash, fontUrl]);

  if (!settings?.brandStudioConfigured) {
    const siteName = settings?.siteName || defaults.siteName;
    const logoUrl = settings?.logoUrl;
    if (placement === "footer") {
      return (
        <span className={`flex w-full max-w-[310px] items-center gap-2 ${className}`} data-testid={testId}>
          {logoUrl ? <img src={logoUrl} alt={`${siteName} logo`} className="h-8 w-auto object-contain" /> : null}
          <span className="bg-gradient-to-r from-[#f5d76e] via-[#D4AF37] to-[#f5d76e] bg-clip-text font-serif text-2xl font-bold tracking-tight text-transparent">
            {siteName}
          </span>
          <span className="text-lg leading-none text-[#D4AF37]" aria-hidden="true">ॐ</span>
        </span>
      );
    }
    if (placement === "menu") {
      return (
        <span className={`font-vedic block w-full truncate text-[27px] font-normal leading-none tracking-[0.015em] text-[#6D2B35] ${className}`} data-testid={testId}>
          {siteName}
        </span>
      );
    }
    return (
      <span
        className={`flex h-full w-full min-w-0 items-center gap-2 ${placement === "mobile" ? "justify-center" : "justify-start"} ${className}`}
        data-testid={testId}
      >
        {logoUrl ? <img src={logoUrl} alt={`${siteName} logo`} className="h-[75%] max-h-[75%] w-auto shrink-0 object-contain" /> : null}
        <span className={`font-vedic min-w-0 truncate font-normal leading-none tracking-[0.015em] text-[#6D2B35] ${placement === "mobile" ? "text-[22px]" : "text-[24px] lg:text-[27px]"}`}>
          {siteName}
        </span>
      </span>
    );
  }

  const mode = s.logoDisplayMode === "text" || s.logoDisplayMode === "image" ? s.logoDisplayMode : "both";
  const showImage = mode !== "text" && Boolean(s.logoUrl) && !imageFailed;
  const showText = mode !== "image" || !s.logoUrl || imageFailed;
  const scale = Math.max(0.5, Math.min(2, Number(s.logoScalePercent) / 100 || 1));
  const size = Math.max(16, Math.min(160, Number(s.logoSizePx) || 27)) * scale;
  const maxWidth = placement === "mobile" ? 170 : placement === "menu" ? 245 : placement === "footer" ? 310 : 360;
  const placementCap = placement === "mobile" ? 34 : placement === "desktop" ? 52 : placement === "menu" ? 56 : 64;
  const renderedSize = Math.min(placement === "desktop" ? Math.max(size, 44) : size, placementCap);
  const align = placement === "mobile"
    ? "center"
    : s.logoPosition === "center"
      ? "center"
      : s.logoPosition === "right"
        ? "flex-end"
        : "flex-start";
  const textColor = settings?.logoTextColor || (placement === "footer" ? "#D4AF37" : defaults.logoTextColor);

  return (
    <span
      className={`flex h-full w-full min-w-0 max-w-full flex-col ${className}`}
      style={{ alignItems: align, maxWidth }}
      data-testid={testId}
    >
      <span className="flex h-full min-w-0 max-w-full items-center gap-2" style={{ justifyContent: align }}>
        {showImage && <img src={s.logoUrl || ""} alt={`${s.siteName || defaults.siteName} logo`} onError={() => setImageFailed(true)} style={{ height: placement === "desktop" || placement === "mobile" ? "100%" : renderedSize, maxHeight: placement === "desktop" || placement === "mobile" ? "100%" : undefined, maxWidth: maxWidth * (showText ? 0.48 : 0.9) }} className="w-auto shrink-0 object-contain" />}
        {showText && <span className="min-w-0 truncate leading-none" style={{ color: textColor, fontFamily: s.logoFontSource === "custom" && fontUrl ? `"${customFontFamily}"` : `"${s.logoFontFamily}", "Fraunces", Georgia, serif`, fontSize: renderedSize, fontWeight: s.logoFontWeight, letterSpacing: `${s.logoLetterSpacing}px` }}>{s.siteName || defaults.siteName}</span>}
      </span>
      {s.taglineVisible && s.tagline && <span className="mt-1 max-w-full truncate leading-tight" style={{ color: s.taglineColor, fontSize: Math.min(Number(s.taglineSizePx) || 14, placement === "mobile" ? 11 : 18), letterSpacing: ".04em" }}>{s.tagline}</span>}
    </span>
  );
}

export default BrandMark;