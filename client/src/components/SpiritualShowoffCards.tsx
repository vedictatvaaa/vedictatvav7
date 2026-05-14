import { useEffect, useMemo, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Award, Flame, Sparkles, Heart, Timer, Trophy, Download, Share2 } from "lucide-react";

// Mirrors JapCounter's persisted shape, intentionally narrow so this
// component never imports the counter and stays render-only.
type Persist = {
  count: number;
  malas: number;
  total: number;
  todayDate: string;
  todayCount: number;
  todayMalas: number;
  streak: number;
  lastDay: string;
  history?: Array<{ day: string; malas: number }>;
};

type Aggregate = {
  totalJapas: number;
  totalMalas: number;
  currentStreak: number;
  favoriteMantraId: string | null;
  favoriteMantraTotal: number;
  estimatedDhyanaMinutes: number;
  milestones: { k1: boolean; k10: boolean; k108: boolean };
};

const STORAGE_PREFIX = "vt-jap";
const BRAND_BG = "#FBF7EE";
const BRAND_PRIMARY = "#6D2B35";
const BRAND_ACCENT = "#D4AF37";

function readAggregate(ownerKey: string): Aggregate {
  let totalJapas = 0;
  let totalMalas = 0;
  let bestStreak = 0;
  let favId: string | null = null;
  let favTotal = 0;

  try {
    const prefix = `${STORAGE_PREFIX}:data:${ownerKey}:`;
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith(prefix)) continue;
      const mantraId = key.slice(prefix.length);
      try {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const p = JSON.parse(raw) as Persist;
        const t = Number(p.total) || 0;
        totalJapas += t;
        totalMalas += Number(p.malas) || 0;
        const streak = Number(p.streak) || 0;
        if (streak > bestStreak) bestStreak = streak;
        if (t > favTotal) {
          favTotal = t;
          favId = mantraId;
        }
      } catch {
        // skip malformed rows
      }
    }
  } catch {
    // localStorage unavailable (SSR / privacy mode) — return zeros
  }

  // 5 seconds of focused chanting per japa is a conservative estimate
  // — used purely for the dhyana-minutes display, never persisted.
  const estimatedDhyanaMinutes = Math.round((totalJapas * 5) / 60);
  return {
    totalJapas,
    totalMalas,
    currentStreak: bestStreak,
    favoriteMantraId: favId,
    favoriteMantraTotal: favTotal,
    estimatedDhyanaMinutes,
    milestones: {
      k1: totalJapas >= 1000,
      k10: totalJapas >= 10000,
      k108: totalJapas >= 108000,
    },
  };
}

function prettyMantraName(slug: string | null): string {
  if (!slug) return "Not started";
  return slug
    .split("-")
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : ""))
    .join(" ");
}

function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-IN").format(n);
}

// --------------------------------------------------------------------
// Shareable square card (1080×1080) drawn on a hidden canvas. We avoid
// html2canvas entirely so the bundle stays small and there's no DOM →
// raster mismatch on mobile.
// --------------------------------------------------------------------
function drawShareCard(ctx: CanvasRenderingContext2D, agg: Aggregate, devoteeName?: string) {
  const W = 1080;
  const H = 1080;

  // Background
  ctx.fillStyle = BRAND_BG;
  ctx.fillRect(0, 0, W, H);

  // Outer gold border
  ctx.strokeStyle = BRAND_ACCENT;
  ctx.lineWidth = 6;
  ctx.strokeRect(40, 40, W - 80, H - 80);

  // Maroon header band
  ctx.fillStyle = BRAND_PRIMARY;
  ctx.fillRect(40, 40, W - 80, 200);

  // Header text
  ctx.fillStyle = BRAND_ACCENT;
  ctx.textAlign = "center";
  ctx.font = "600 28px serif";
  ctx.fillText("VEDIC TATVA · DAILY SADHANA", W / 2, 110);

  ctx.fillStyle = "#FFFFFF";
  ctx.font = "700 56px serif";
  ctx.fillText(devoteeName ? `${devoteeName}'s Sadhana` : "My Sacred Sadhana", W / 2, 190);

  // Stat grid: 2 cols × 3 rows below header
  const stats: Array<{ label: string; value: string }> = [
    { label: "Total Japas", value: formatNumber(agg.totalJapas) },
    { label: "Malas Completed", value: formatNumber(agg.totalMalas) },
    { label: "Current Streak", value: `${formatNumber(agg.currentStreak)} ${agg.currentStreak === 1 ? "day" : "days"}` },
    { label: "Dhyana Time", value: agg.estimatedDhyanaMinutes >= 60
      ? `${Math.floor(agg.estimatedDhyanaMinutes / 60)}h ${agg.estimatedDhyanaMinutes % 60}m`
      : `${agg.estimatedDhyanaMinutes} min` },
    { label: "Favorite Mantra", value: prettyMantraName(agg.favoriteMantraId).slice(0, 22) },
    { label: "Milestones", value: [
      agg.milestones.k108 ? "108k" : null,
      agg.milestones.k10 ? "10k" : null,
      agg.milestones.k1 ? "1k" : null,
    ].filter(Boolean).join(" · ") || "On the path" },
  ];

  const gridTop = 290;
  const cellW = (W - 80 - 40) / 2;
  const cellH = 200;
  const gap = 20;

  ctx.textAlign = "left";
  for (let i = 0; i < stats.length; i++) {
    const col = i % 2;
    const row = Math.floor(i / 2);
    const x = 60 + col * (cellW + gap);
    const y = gridTop + row * (cellH + gap);

    // cell background (cream + gold border)
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(x, y, cellW, cellH);
    ctx.strokeStyle = `${BRAND_ACCENT}55`;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, cellW, cellH);

    // label
    ctx.fillStyle = `${BRAND_PRIMARY}AA`;
    ctx.font = "600 22px sans-serif";
    ctx.fillText(stats[i].label.toUpperCase(), x + 24, y + 50);

    // value
    ctx.fillStyle = BRAND_PRIMARY;
    ctx.font = "700 56px serif";
    ctx.fillText(stats[i].value, x + 24, y + 130);
  }

  // Footer band
  ctx.fillStyle = BRAND_PRIMARY;
  ctx.fillRect(40, H - 130, W - 80, 90);
  ctx.fillStyle = BRAND_ACCENT;
  ctx.textAlign = "center";
  ctx.font = "600 28px serif";
  ctx.fillText("Begin your own sadhana · vedictatva.com", W / 2, H - 75);
}

async function generateShareImage(agg: Aggregate, devoteeName?: string): Promise<Blob | null> {
  return new Promise((resolve) => {
    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1080;
    const ctx = canvas.getContext("2d");
    if (!ctx) return resolve(null);
    drawShareCard(ctx, agg, devoteeName);
    canvas.toBlob((b) => resolve(b), "image/png", 0.95);
  });
}

// --------------------------------------------------------------------

export type SpiritualShowoffCardsProps = {
  ownerKey?: string;
  devoteeName?: string;
};

export default function SpiritualShowoffCards({
  ownerKey = "public",
  devoteeName,
}: SpiritualShowoffCardsProps) {
  const { toast } = useToast();
  const [agg, setAgg] = useState<Aggregate>(() => ({
    totalJapas: 0,
    totalMalas: 0,
    currentStreak: 0,
    favoriteMantraId: null,
    favoriteMantraTotal: 0,
    estimatedDhyanaMinutes: 0,
    milestones: { k1: false, k10: false, k108: false },
  }));
  const [sharing, setSharing] = useState(false);
  const tickRef = useRef<number | null>(null);

  // Re-read every 5s while mounted so taps in JapCounter (same page)
  // are reflected near-real-time without prop wiring.
  useEffect(() => {
    setAgg(readAggregate(ownerKey));
    tickRef.current = window.setInterval(() => setAgg(readAggregate(ownerKey)), 5000);
    return () => {
      if (tickRef.current) window.clearInterval(tickRef.current);
    };
  }, [ownerKey]);

  const cards = useMemo(
    () => [
      { icon: Sparkles, label: "Total Japas", value: formatNumber(agg.totalJapas) },
      { icon: Award, label: "Malas Completed", value: formatNumber(agg.totalMalas) },
      { icon: Flame, label: "Current Streak", value: `${agg.currentStreak} ${agg.currentStreak === 1 ? "day" : "days"}` },
      {
        icon: Timer,
        label: "Dhyana Time",
        value:
          agg.estimatedDhyanaMinutes >= 60
            ? `${Math.floor(agg.estimatedDhyanaMinutes / 60)}h ${agg.estimatedDhyanaMinutes % 60}m`
            : `${agg.estimatedDhyanaMinutes} min`,
      },
      { icon: Heart, label: "Favorite Mantra", value: prettyMantraName(agg.favoriteMantraId) },
      {
        icon: Trophy,
        label: "Milestones",
        value:
          [agg.milestones.k108 ? "108k" : null, agg.milestones.k10 ? "10k" : null, agg.milestones.k1 ? "1k" : null]
            .filter(Boolean)
            .join(" · ") || "On the path",
      },
    ],
    [agg],
  );

  async function handleShare() {
    setSharing(true);
    try {
      const blob = await generateShareImage(agg, devoteeName);
      if (!blob) throw new Error("Could not render image");
      const file = new File([blob], "vedic-tatva-sadhana.png", { type: "image/png" });

      // Native share sheet (WhatsApp / IG etc.) when available — falls back
      // to a download otherwise.
      const nav: any = navigator;
      if (nav.canShare && nav.canShare({ files: [file] }) && nav.share) {
        try {
          await nav.share({
            title: "My Sacred Sadhana",
            text: `${formatNumber(agg.totalJapas)} japas · ${formatNumber(agg.totalMalas)} malas · ${agg.currentStreak}-day streak. Begin yours at vedictatva.com`,
            files: [file],
          });
          return;
        } catch {
          // user dismissed — fall through to download
        }
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "vedic-tatva-sadhana.png";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      toast({
        title: "Image saved",
        description: "Share it on WhatsApp, Instagram or wherever you like.",
      });
    } catch (err: any) {
      toast({ title: "Could not generate image", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setSharing(false);
    }
  }

  const hasProgress = agg.totalJapas > 0;

  return (
    <Card className="border-[#D4AF37]/30 bg-[#FBF7EE]">
      <CardContent className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
          <div>
            <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.28em] text-[#6D2B35]/70 font-semibold">Your Sacred Stats</p>
            <h2 className="text-lg sm:text-xl font-serif text-[#6D2B35] mt-1" data-testid="text-showoff-title">
              {devoteeName ? `${devoteeName}'s Sadhana` : "Your Sadhana"}
            </h2>
          </div>
          <Button
            onClick={handleShare}
            disabled={sharing || !hasProgress}
            className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#6D2B35]"
            size="sm"
            data-testid="button-share-sadhana"
          >
            {sharing ? (
              "Generating…"
            ) : (
              <>
                <Share2 className="h-4 w-4 mr-1.5" />
                Share as image
              </>
            )}
          </Button>
        </div>

        {!hasProgress && (
          <p className="text-xs text-[#5a4a3a] mb-3">
            Tap your first japa below — your stats and shareable card will appear here.
          </p>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3">
          {cards.map((c) => (
            <div
              key={c.label}
              className="rounded-md border border-[#D4AF37]/30 bg-white px-3 py-3 sm:px-4 sm:py-4"
              data-testid={`card-stat-${c.label.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide text-[#6D2B35]/70 font-semibold mb-1.5">
                <c.icon className="h-3.5 w-3.5" />
                {c.label}
              </div>
              <div className="text-lg sm:text-xl font-serif font-semibold text-[#6D2B35] truncate" title={c.value}>
                {c.value}
              </div>
            </div>
          ))}
        </div>

        {hasProgress && (
          <p className="mt-3 text-[11px] text-[#5a4a3a]/80 flex items-center gap-1.5">
            <Download className="h-3 w-3" />
            Tap “Share as image” to download a 1080×1080 card ready for WhatsApp or Instagram.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
