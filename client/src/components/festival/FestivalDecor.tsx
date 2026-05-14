import { useMemo } from "react";
import { Link } from "wouter";
import { Sparkles } from "lucide-react";
import { getActiveFestival, getNextFestival, type FestivalTheme } from "@/lib/festivals";
import { FestivalCountdown } from "@/components/festival/FestivalCountdown";
import { FESTIVAL_KITS } from "@/lib/festival-kits";

function MotifSVG({ motif, color, size = 18 }: { motif: FestivalTheme["motif"]; color: string; size?: number }) {
  const props = { width: size, height: size, viewBox: "0 0 24 24", fill: "none", stroke: color, strokeWidth: 1.6, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (motif) {
    case "diya":
      return (
        <svg {...props}>
          <path d="M3 16c2 2 5 3 9 3s7-1 9-3c0-1.5-2-2-9-2s-9 .5-9 2Z" fill={color} fillOpacity="0.25" />
          <path d="M12 14c0-3 0-6 0-9 1.5 1 3 3 3 5s-1.5 4-3 4Z" fill={color} fillOpacity="0.55" stroke="none" />
          <path d="M12 5v-3" />
        </svg>
      );
    case "peacock":
      return (
        <svg {...props}>
          <path d="M12 21c-4 0-7-3-7-7 0-3 2-5 5-5 0 0 1-3 4-3s4 3 4 3" />
          <circle cx="12" cy="9" r="1.5" fill={color} />
          <path d="M5 14c1 1 3 2 7 2s6-1 7-2" />
        </svg>
      );
    case "lotus":
      return (
        <svg {...props}>
          <path d="M12 4c-1 3-1 6 0 9 1-3 1-6 0-9Z" fill={color} fillOpacity="0.55" />
          <path d="M5 9c2 1 4 3 7 4-1-3-3-5-7-4Z" fill={color} fillOpacity="0.4" />
          <path d="M19 9c-2 1-4 3-7 4 1-3 3-5 7-4Z" fill={color} fillOpacity="0.4" />
          <path d="M3 16c3 2 6 3 9 3s6-1 9-3" />
        </svg>
      );
    case "modak":
      return (
        <svg {...props}>
          <path d="M12 3c-2 4-5 7-7 9 2 5 5 8 7 8s5-3 7-8c-2-2-5-5-7-9Z" fill={color} fillOpacity="0.3" />
          <path d="M12 3l-1.5 3M12 3l1.5 3M12 3l-3 4M12 3l3 4" />
        </svg>
      );
    case "rakhi":
      return (
        <svg {...props}>
          <circle cx="12" cy="12" r="3.5" fill={color} fillOpacity="0.45" />
          <circle cx="12" cy="12" r="1.4" fill={color} />
          <path d="M3 12h6M15 12h6" />
          <path d="M5 9l1 3-1 3M19 9l-1 3 1 3" />
        </svg>
      );
    case "trishul":
      return (
        <svg {...props}>
          <path d="M12 22V8" />
          <path d="M7 8c0-3 2-5 5-5s5 2 5 5" />
          <path d="M7 8v3M17 8v3M12 3V1" />
        </svg>
      );
    case "color":
      return (
        <svg {...props}>
          <circle cx="7" cy="9" r="3" fill="#F088B5" stroke="none" />
          <circle cx="17" cy="9" r="3" fill="#F4D03F" stroke="none" />
          <circle cx="9" cy="16" r="3" fill="#5BC0DE" stroke="none" />
          <circle cx="16" cy="16" r="3" fill="#7AC74F" stroke="none" />
        </svg>
      );
    case "swastik":
      return (
        <svg {...props}>
          <path d="M12 5v7h7M12 19v-7h-7" />
          <path d="M19 12V5h-7M5 12v7h7" />
        </svg>
      );
    case "leaf":
      return (
        <svg {...props}>
          <path d="M5 19c0-8 6-14 14-14 0 8-6 14-14 14Z" fill={color} fillOpacity="0.35" />
          <path d="M5 19l9-9" />
        </svg>
      );
    case "kalash":
      return (
        <svg {...props}>
          <path d="M9 8h6l-1 2h-4z" fill={color} fillOpacity="0.5" />
          <path d="M8 10c0 5 1 9 4 9s4-4 4-9z" fill={color} fillOpacity="0.4" />
          <path d="M10 8V6c0-1 1-2 2-2s2 1 2 2v2" />
          <path d="M12 4V2" />
        </svg>
      );
    case "om":
    default:
      return (
        <svg {...props}>
          <path d="M14 9c-2-2-5-1-5 2 0 2 2 3 4 3s3-1 3-3" />
          <path d="M9 14c-1 1-2 2-2 4M16 11c2 1 3 2 3 4" />
          <circle cx="17" cy="6" r="1.2" fill={color} />
        </svg>
      );
  }
}

function ToranBorder({ accent, accentSoft }: { accent: string; accentSoft: string }) {
  const items = Array.from({ length: 14 });
  return (
    <div className="absolute inset-x-0 -top-[11px] h-[12px] flex items-end justify-around pointer-events-none">
      {items.map((_, i) => (
        <svg key={i} width="14" height="11" viewBox="0 0 14 11" className="opacity-90">
          <path d="M7 0c-3 1-5 4-5 7 0 2 1 4 2 4 1-2 3-3 3-5 0 2 2 3 3 5 1 0 2-2 2-4 0-3-2-6-5-7Z" fill={accentSoft} stroke={accent} strokeWidth="0.7" />
        </svg>
      ))}
    </div>
  );
}

export function FestivalRibbon() {
  const next = useMemo(() => getNextFestival(), []);
  const theme = next.festival;
  const hasKit = !!FESTIVAL_KITS[theme.id];
  const { palette, name, nameHi, tagline, date, motif } = theme;

  return (
    <div
      className="relative w-full overflow-hidden"
      style={{
        background: `linear-gradient(90deg, ${palette.from} 0%, ${palette.via} 50%, ${palette.to} 100%)`,
        color: palette.ink,
      }}
      data-testid="festival-ribbon"
    >
      <div
        className="absolute inset-0 opacity-30 pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle at 10% 50%, ${palette.accent}33 0 12%, transparent 13%), radial-gradient(circle at 90% 50%, ${palette.accent}33 0 12%, transparent 13%)`,
        }}
      />
      <div className="relative max-w-7xl mx-auto px-3 sm:px-6 py-1.5 flex items-center justify-center sm:justify-between gap-2 text-[11px] sm:text-xs">
        <div className="hidden sm:flex items-center gap-2 min-w-0">
          <MotifSVG motif={motif} color={palette.accent} size={16} />
          <span className="font-semibold tracking-wide truncate" style={{ color: palette.accent }}>
            {nameHi}
          </span>
          <span className="opacity-70 truncate">{tagline}</span>
        </div>
        <div className="flex items-center gap-2 sm:gap-3">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" style={{ color: palette.accent }} />
          <span className="font-semibold uppercase tracking-[0.14em]">{name}</span>
          <FestivalCountdown startsAt={next.startsAt} theme={theme} compact />
          {date && (
            <span
              className="hidden md:inline px-2 py-[1px] rounded-sm text-[10px] font-semibold"
              style={{ background: `${palette.accent}22`, color: palette.accent, border: `1px solid ${palette.accent}55` }}
            >
              {date}
            </span>
          )}
          {hasKit && (
            <Link
              href={`/festival/${theme.id}`}
              className="hidden sm:inline px-2 py-[1px] rounded-sm text-[10px] font-bold uppercase tracking-wider hover-elevate"
              style={{ background: palette.accent, color: "#1a1a1a" }}
              data-testid="link-festival-landing"
            >
              Open kit
            </Link>
          )}
        </div>
        <div className="sm:hidden flex items-center gap-1.5">
          <MotifSVG motif={motif} color={palette.accent} size={14} />
        </div>
      </div>
    </div>
  );
}

export function useFestivalTheme() {
  return useMemo(() => getActiveFestival(), []);
}

export { MotifSVG, ToranBorder };
