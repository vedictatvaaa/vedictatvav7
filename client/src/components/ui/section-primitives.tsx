import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { optImg, optImgSrcSet, SIZES } from "@/lib/optImg";

export const slimCard =
  "rounded-lg border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 transition-colors bg-white";

export const slimPanel =
  "rounded-lg border border-[#D4AF37]/20 bg-white";

interface SectionHeaderProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  rails?: boolean;
  className?: string;
  testIdPrefix?: string;
  font?: "serif" | "sans";
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  align = "center",
  rails = true,
  className = "",
  testIdPrefix,
  font = "serif",
}: SectionHeaderProps) {
  const isCenter = align === "center";
  return (
    <div
      className={`${isCenter ? "text-center mx-auto" : "text-left"} max-w-2xl ${className}`}
    >
      {eyebrow && (
        <div
          className={`flex items-center gap-2.5 mb-3 ${isCenter ? "justify-center" : ""}`}
        >
          {rails && <span className="h-px w-6 bg-[#D4AF37]" />}
          <span
            className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold"
            data-testid={testIdPrefix ? `${testIdPrefix}-eyebrow` : undefined}
          >
            {eyebrow}
          </span>
          {rails && isCenter && <span className="h-px w-6 bg-[#D4AF37]" />}
        </div>
      )}
      <h2
        className={`${font === "serif" ? "font-serif text-2xl md:text-3xl" : "font-sans text-xl md:text-2xl tracking-tight"} font-semibold text-[#6D2B35] mb-2 leading-tight`}
        data-testid={testIdPrefix ? `${testIdPrefix}-title` : undefined}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          className="text-[13px] text-[#5a4a3a]/65 leading-relaxed"
          data-testid={testIdPrefix ? `${testIdPrefix}-subtitle` : undefined}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

interface IconTileProps {
  icon: LucideIcon;
  size?: "sm" | "md";
  tone?: "cream" | "maroon" | "gold";
  className?: string;
}

export function IconTile({ icon: Icon, size = "md", tone = "cream", className = "" }: IconTileProps) {
  const box =
    size === "sm" ? "w-7 h-7" : "w-8 h-8";
  const iconCls = size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4";
  const tones: Record<string, string> = {
    cream: "bg-[#FBF7EE] border-[#D4AF37]/20 text-[#6D2B35]",
    maroon: "bg-[#6D2B35]/8 border-[#6D2B35]/15 text-[#6D2B35]",
    gold: "bg-[#D4AF37]/10 border-[#D4AF37]/30 text-[#D4AF37]",
  };
  return (
    <div
      className={`${box} rounded-md border ${tones[tone]} flex items-center justify-center shrink-0 ${className}`}
    >
      <Icon className={iconCls} strokeWidth={1.8} />
    </div>
  );
}

interface PageHeroProps {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  children?: ReactNode;
  variant?: "maroon" | "dark" | "cream";
  testId?: string;
  font?: "serif" | "sans";
  /** When provided, hero becomes a unified full-bleed cinematic image with dark wash overlay. */
  bgImage?: string;
  bgImageAlt?: string;
}

export function PageHero({ eyebrow, title, subtitle, children, variant = "maroon", testId, font = "serif", bgImage, bgImageAlt }: PageHeroProps) {
  const variants: Record<string, string> = {
    maroon: "bg-[#6D2B35] text-white",
    dark: "bg-[#1a1118] text-white",
    cream: "bg-[#FBF7EE] text-[#6D2B35]",
  };
  const isLight = !bgImage && variant === "cream";
  const useImage = Boolean(bgImage);
  return (
    <section
      className={`${useImage ? "bg-[#1a0a0e] text-white" : variants[variant]} relative overflow-hidden ${useImage ? "py-14 md:py-20 lg:py-24" : "py-10 md:py-14"}`}
      data-testid={testId}
    >
      {useImage && (
        <>
          <img
            src={optImg(bgImage, 1080) || bgImage}
            srcSet={optImgSrcSet(bgImage, [320, 480, 768, 1080, 1440])}
            sizes={SIZES.hero}
            alt={bgImageAlt || ""}
            className="absolute inset-0 w-full h-full object-cover object-[70%_center]"
            loading="eager"
            fetchPriority="high"
            decoding="async"
            aria-hidden={!bgImageAlt}
          />
          {/* Left-to-right dark wash anchors text on the dark bokeh side; bottom fade reinforces contrast. */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#1a0a0e]/85 via-[#1a0a0e]/55 to-[#1a0a0e]/15" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-2/5 bg-gradient-to-t from-[#1a0a0e]/65 to-transparent" aria-hidden="true" />
        </>
      )}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {eyebrow && (
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-6 bg-[#D4AF37]" />
              <span
                className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold"
                style={useImage ? { textShadow: "0 1px 8px rgba(0,0,0,0.55)" } : undefined}
              >
                {eyebrow}
              </span>
              <span className="h-px w-6 bg-[#D4AF37]" />
            </div>
          )}
          <h1
            className={`${font === "serif" ? "font-serif text-3xl md:text-4xl lg:text-5xl" : "font-sans text-2xl md:text-3xl lg:text-4xl tracking-tight"} font-semibold mb-2 leading-tight ${isLight ? "text-[#6D2B35]" : "text-white"}`}
            style={useImage ? { textShadow: "0 2px 18px rgba(0,0,0,0.7), 0 1px 3px rgba(0,0,0,0.5)" } : undefined}
          >
            {title}
          </h1>
          {subtitle && (
            <p
              className={`text-[13px] md:text-sm leading-relaxed max-w-xl mx-auto ${isLight ? "text-[#5a4a3a]/65" : useImage ? "text-white/90" : "text-white/65"}`}
              style={useImage ? { textShadow: "0 1px 12px rgba(0,0,0,0.6)" } : undefined}
            >
              {subtitle}
            </p>
          )}
          {children && <div className="mt-5">{children}</div>}
        </div>
      </div>
    </section>
  );
}
