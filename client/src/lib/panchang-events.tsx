import type { ComponentType, ReactNode, SVGProps } from "react";
import { FESTIVALS, type FestivalTheme } from "./festivals";

export type EventCategory =
  | "maha-shivratri"
  | "shivratri"
  | "purnima"
  | "amavasya"
  | "ekadashi"
  | "pradosh"
  | "sankashti"
  | "navratri"
  | "festival"
  | "auspicious"
  | "ordinary";

export interface EventStyle {
  category: EventCategory;
  label: string;
  labelHi?: string;
  cellBg: string;
  cellRing: string;
  chipBg: string;
  chipInk: string;
  chipBorder: string;
  motif: MotifKey;
  rank: number;
}

export type MotifKey =
  | "moon-full"
  | "moon-new"
  | "lotus"
  | "diya"
  | "modak"
  | "trishul"
  | "om"
  | "kalash"
  | "leaf"
  | "rakhi"
  | "peacock"
  | "swastik"
  | "color"
  | "sparkle";

export const STYLES: Record<EventCategory, Omit<EventStyle, "category" | "label" | "rank">> = {
  "maha-shivratri": {
    cellBg: "bg-gradient-to-br from-indigo-950/95 via-indigo-900/90 to-slate-900/90 text-white",
    cellRing: "ring-1 ring-amber-300/60 ring-inset",
    chipBg: "bg-indigo-950 text-amber-200",
    chipInk: "text-amber-200",
    chipBorder: "border-amber-300/40",
    motif: "trishul",
  },
  "shivratri": {
    cellBg: "bg-gradient-to-br from-indigo-100 via-indigo-50 to-white",
    cellRing: "ring-1 ring-indigo-300/50 ring-inset",
    chipBg: "bg-indigo-100",
    chipInk: "text-indigo-900",
    chipBorder: "border-indigo-300/60",
    motif: "trishul",
  },
  "purnima": {
    cellBg: "bg-gradient-to-br from-amber-50 via-yellow-50 to-white",
    cellRing: "ring-1 ring-amber-300/50 ring-inset",
    chipBg: "bg-amber-100",
    chipInk: "text-amber-900",
    chipBorder: "border-amber-300/60",
    motif: "moon-full",
  },
  "amavasya": {
    cellBg: "bg-gradient-to-br from-slate-200 via-slate-100 to-white",
    cellRing: "ring-1 ring-slate-400/40 ring-inset",
    chipBg: "bg-slate-200",
    chipInk: "text-slate-800",
    chipBorder: "border-slate-400/50",
    motif: "moon-new",
  },
  "ekadashi": {
    cellBg: "bg-gradient-to-br from-orange-50 via-amber-50 to-white",
    cellRing: "ring-1 ring-orange-300/50 ring-inset",
    chipBg: "bg-orange-100",
    chipInk: "text-orange-900",
    chipBorder: "border-orange-300/60",
    motif: "lotus",
  },
  "pradosh": {
    cellBg: "bg-gradient-to-br from-violet-50 via-purple-50 to-white",
    cellRing: "ring-1 ring-violet-300/50 ring-inset",
    chipBg: "bg-violet-100",
    chipInk: "text-violet-900",
    chipBorder: "border-violet-300/60",
    motif: "diya",
  },
  "sankashti": {
    cellBg: "bg-gradient-to-br from-rose-50 via-orange-50 to-white",
    cellRing: "ring-1 ring-rose-300/50 ring-inset",
    chipBg: "bg-rose-100",
    chipInk: "text-rose-900",
    chipBorder: "border-rose-300/60",
    motif: "modak",
  },
  "navratri": {
    cellBg: "bg-gradient-to-br from-pink-50 via-rose-50 to-white",
    cellRing: "ring-1 ring-pink-300/50 ring-inset",
    chipBg: "bg-pink-100",
    chipInk: "text-pink-900",
    chipBorder: "border-pink-300/60",
    motif: "trishul",
  },
  "festival": {
    cellBg: "bg-gradient-to-br from-amber-100 via-amber-50 to-white",
    cellRing: "ring-1 ring-[#D4AF37]/60 ring-inset",
    chipBg: "bg-[#FFF4D6]",
    chipInk: "text-[#6D2B35]",
    chipBorder: "border-[#D4AF37]/60",
    motif: "kalash",
  },
  "auspicious": {
    cellBg: "bg-gradient-to-br from-emerald-50 via-green-50 to-white",
    cellRing: "ring-1 ring-emerald-300/40 ring-inset",
    chipBg: "bg-emerald-100",
    chipInk: "text-emerald-900",
    chipBorder: "border-emerald-300/60",
    motif: "sparkle",
  },
  "ordinary": {
    cellBg: "bg-white",
    cellRing: "",
    chipBg: "bg-[#FBF7EE]",
    chipInk: "text-[#5a4a3a]",
    chipBorder: "border-[#D4AF37]/30",
    motif: "om",
  },
};

const RANK: Record<EventCategory, number> = {
  "maha-shivratri": 100,
  "festival": 90,
  "navratri": 85,
  "shivratri": 80,
  "purnima": 70,
  "amavasya": 65,
  "ekadashi": 60,
  "sankashti": 55,
  "pradosh": 50,
  "auspicious": 20,
  "ordinary": 0,
};

// Festivals whose date is purely lunar (computed elsewhere) — don't overlay
// from the FESTIVALS Gregorian range, since it drifts by ~11 days every year.
const LUNAR_ONLY_IDS = new Set(["mahashivratri", "maha-shivratri"]);

const FESTIVAL_BY_MD: Map<string, FestivalTheme> = (() => {
  const m = new Map<string, FestivalTheme>();
  for (const f of FESTIVALS) {
    if (LUNAR_ONLY_IDS.has(f.id)) continue;
    const [start, end] = f.mdRange;
    const [sm, sd] = start.split("-").map(n => parseInt(n, 10));
    const [em, ed] = end.split("-").map(n => parseInt(n, 10));
    const stamps: string[] = [];
    if (sm === em) {
      for (let d = sd; d <= ed; d++) stamps.push(`${String(sm).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    } else {
      const lastOfStart = new Date(2025, sm, 0).getDate();
      for (let d = sd; d <= lastOfStart; d++) stamps.push(`${String(sm).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
      for (let d = 1; d <= ed; d++) stamps.push(`${String(em).padStart(2, "0")}-${String(d).padStart(2, "0")}`);
    }
    for (const s of stamps) if (!m.has(s)) m.set(s, f);
  }
  return m;
})();

const MOTIF_BY_FESTIVAL_MOTIF: Record<FestivalTheme["motif"], MotifKey> = {
  diya: "diya", peacock: "peacock", lotus: "lotus", modak: "modak",
  rakhi: "rakhi", trishul: "trishul", color: "color", swastik: "swastik",
  leaf: "leaf", kalash: "kalash", om: "om",
};

export interface DayLike {
  date: number;
  tithi: string;
  paksha: string;
  festival: string | null;
  auspicious: boolean;
}

export interface ClassifiedEvent {
  category: EventCategory;
  label: string;
  labelHi?: string;
  motif: MotifKey;
  style: EventStyle;
}

export function classifyDay(
  d: DayLike,
  ctx: { month: number; hinduMonth?: string },
): ClassifiedEvent {
  const tithi = (d.tithi || "").toLowerCase();
  const paksha = (d.paksha || "").toLowerCase();
  const fest = (d.festival || "").toLowerCase();
  const hinduMo = (ctx.hinduMonth || "").toLowerCase();

  // 1. Maha Shivratri — Phalguna Krishna Chaturdashi
  if (
    paksha.includes("krishna") &&
    (tithi.includes("chaturdashi") || tithi.includes("चतुर्दशी")) &&
    (hinduMo.includes("phalguna") || hinduMo.includes("फाल्गुन"))
  ) {
    return build("maha-shivratri", "Maha Shivratri", "महाशिवरात्रि");
  }

  // 2. Major festival from FESTIVALS lib (overlay by Gregorian m-d)
  const mdKey = `${String(ctx.month).padStart(2, "0")}-${String(d.date).padStart(2, "0")}`;
  const fLib = FESTIVAL_BY_MD.get(mdKey);
  if (fLib) {
    const isNavratri = fLib.id === "navratri";
    const cat: EventCategory = isNavratri ? "navratri" : "festival";
    const e = build(cat, fLib.name, fLib.nameHi);
    e.motif = MOTIF_BY_FESTIVAL_MOTIF[fLib.motif] ?? e.motif;
    e.style = { ...e.style, motif: e.motif };
    return e;
  }

  // 3. Masik Shivratri — any Krishna Chaturdashi
  if (paksha.includes("krishna") && (tithi.includes("chaturdashi") || tithi.includes("चतुर्दशी"))) {
    return build("shivratri", "Masik Shivratri", "मासिक शिवरात्रि");
  }

  // 4. Server-tagged tithi events
  if (fest.includes("purnima")) return build("purnima", "Purnima", "पूर्णिमा");
  if (fest.includes("amavasya")) return build("amavasya", "Amavasya", "अमावस्या");
  if (fest.includes("ekadashi")) {
    const which = paksha.includes("shukla") ? "Shukla Ekadashi" : paksha.includes("krishna") ? "Krishna Ekadashi" : "Ekadashi";
    return build("ekadashi", which, "एकादशी");
  }
  if (fest.includes("pradosh")) return build("pradosh", "Pradosh Vrat", "प्रदोष व्रत");
  if (fest.includes("sankashti")) return build("sankashti", "Sankashti Chaturthi", "संकष्टी चतुर्थी");
  if (d.festival) return build("festival", d.festival);

  if (d.auspicious) return build("auspicious", "Auspicious Day", "शुभ दिन");
  return build("ordinary", "");
}

function build(category: EventCategory, label: string, labelHi?: string): ClassifiedEvent {
  const base = STYLES[category];
  return {
    category,
    label,
    labelHi,
    motif: base.motif,
    style: { ...base, category, label, labelHi, rank: RANK[category] },
  };
}

// ─────────── motif SVG components (24x24 viewBox) ───────────

type IconProps = SVGProps<SVGSVGElement> & { size?: number };

const make = (path: ReactNode): ComponentType<IconProps> => {
  const C = ({ size = 16, ...rest }: IconProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="currentColor"
      {...rest}
    >
      {path}
    </svg>
  );
  return C;
};

export const MotifMoonFull = make(
  <>
    <circle cx="12" cy="12" r="8" opacity="0.95" />
    <circle cx="9" cy="10" r="0.9" fill="#fff" opacity="0.45" />
    <circle cx="14" cy="13" r="0.7" fill="#fff" opacity="0.4" />
    <circle cx="11" cy="15" r="0.5" fill="#fff" opacity="0.35" />
  </>
);
export const MotifMoonNew = make(
  <>
    <circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" strokeWidth="1.4" opacity="0.6" />
    <path d="M16 5.5a8 8 0 1 0 2.5 7A6 6 0 0 1 16 5.5z" />
  </>
);
export const MotifLotus = make(
  <>
    <path d="M12 4c1.7 2.6 1.7 5.4 0 8-1.7-2.6-1.7-5.4 0-8z" />
    <path d="M5.5 8.5c2.8.5 4.6 2.4 5.5 5-2.8-.5-4.6-2.4-5.5-5z" opacity="0.85" />
    <path d="M18.5 8.5c-2.8.5-4.6 2.4-5.5 5 2.8-.5 4.6-2.4 5.5-5z" opacity="0.85" />
    <path d="M3 13c3 2 6 2 9 0-3 4-6 5-9 0z" opacity="0.7" />
    <path d="M21 13c-3 2-6 2-9 0 3 4 6 5 9 0z" opacity="0.7" />
    <path d="M6 16h12l-1 3H7l-1-3z" opacity="0.55" />
  </>
);
export const MotifDiya = make(
  <>
    <path d="M12 3c1 2 2 3 2 5a2 2 0 1 1-4 0c0-2 1-3 2-5z" />
    <path d="M3 14c2 4 6 5 9 5s7-1 9-5H3z" />
    <path d="M2 14h20l-1 1.6H3L2 14z" opacity="0.7" />
  </>
);
export const MotifModak = make(
  <>
    <path d="M12 3l1.7 3 3.3.5-2.4 2.3.6 3.3L12 10.5 8.8 12.1l.6-3.3L7 6.5l3.3-.5L12 3z" opacity="0.55" />
    <path d="M5 14c0-4 3-6 7-6s7 2 7 6c0 4-3 7-7 7s-7-3-7-7z" />
    <path d="M12 14l1.5 2-1.5 1.5L10.5 16 12 14z" fill="#fff" opacity="0.4" />
  </>
);
export const MotifTrishul = make(
  <>
    <path d="M12 2v20" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 7c0 3 2 5 6 5s6-2 6-5" fill="none" stroke="currentColor" strokeWidth="1.4" />
    <path d="M6 7l-1-2M18 7l1-2M12 2l-0.7-1M12 2l0.7-1" stroke="currentColor" strokeWidth="1.4" />
    <circle cx="12" cy="14" r="1.2" />
  </>
);
export const MotifOm = make(
  <>
    <text x="12" y="18" textAnchor="middle" fontSize="18" fontFamily="serif" fill="currentColor">ॐ</text>
  </>
);
export const MotifKalash = make(
  <>
    <path d="M9 5h6l-1 2h-4L9 5z" />
    <path d="M8 7h8v2H8z" opacity="0.7" />
    <path d="M7 9h10c0 5-2 8-5 11-3-3-5-6-5-11z" />
    <path d="M12 2c1 1.5 1 3 0 4-1-1-1-2.5 0-4z" />
  </>
);
export const MotifLeaf = make(<path d="M5 19c0-9 6-14 14-14 0 9-6 14-14 14zm0 0L19 5" stroke="currentColor" strokeWidth="1.5" fill="none" />);
export const MotifRakhi = make(
  <>
    <circle cx="12" cy="12" r="3.5" />
    <circle cx="12" cy="12" r="1.2" fill="#fff" opacity="0.6" />
    <path d="M2 12h6M16 12h6" stroke="currentColor" strokeWidth="1.6" />
  </>
);
export const MotifPeacock = make(
  <>
    <circle cx="12" cy="6" r="2" />
    <path d="M10 6c-3 4-3 8 0 12M14 6c3 4 3 8 0 12" stroke="currentColor" strokeWidth="1.4" fill="none" />
    <ellipse cx="12" cy="20" rx="6" ry="1.5" opacity="0.6" />
  </>
);
export const MotifSwastik = make(
  <>
    <path d="M11 3h2v8h8v2h-8v8h-2v-8H3v-2h8V3z" />
    <path d="M13 3h4v2h-2v2h-2V3zM13 21h4v-2h-2v-2h-2v4zM3 13v-4h2v2h2v2H3zM21 13v-4h-2v2h-2v2h4z" opacity="0.85" />
  </>
);
export const MotifColor = make(
  <>
    <circle cx="7" cy="9" r="3" opacity="0.7" />
    <circle cx="14" cy="7" r="2.5" opacity="0.7" />
    <circle cx="17" cy="14" r="3" opacity="0.7" />
    <circle cx="10" cy="16" r="2.5" opacity="0.7" />
  </>
);
export const MotifSparkle = make(
  <>
    <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3z" />
    <path d="M19 16l.7 2L22 19l-2.3 1L19 22l-.7-2L16 19l2.3-1L19 16z" opacity="0.7" />
  </>
);

export const MOTIF_COMPONENTS: Record<MotifKey, ComponentType<IconProps>> = {
  "moon-full": MotifMoonFull,
  "moon-new": MotifMoonNew,
  lotus: MotifLotus,
  diya: MotifDiya,
  modak: MotifModak,
  trishul: MotifTrishul,
  om: MotifOm,
  kalash: MotifKalash,
  leaf: MotifLeaf,
  rakhi: MotifRakhi,
  peacock: MotifPeacock,
  swastik: MotifSwastik,
  color: MotifColor,
  sparkle: MotifSparkle,
};

export function Motif({ name, size = 16, className }: { name: MotifKey; size?: number; className?: string }) {
  const C = MOTIF_COMPONENTS[name];
  return <C size={size} className={className} aria-hidden="true" />;
}
