import { useEffect, useState } from "react";
import type { FestivalTheme } from "@/lib/festivals";

function pad(n: number) { return String(Math.max(0, n)).padStart(2, "0"); }

function diff(target: Date) {
  const ms = Math.max(0, target.getTime() - Date.now());
  const d = Math.floor(ms / 86400000);
  const h = Math.floor((ms % 86400000) / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return { d, h, m, s, done: ms === 0 };
}

export function FestivalCountdown({
  startsAt,
  theme,
  compact = false,
  label = "starts in",
}: {
  startsAt: Date;
  theme: FestivalTheme;
  compact?: boolean;
  label?: string;
}) {
  const [t, setT] = useState(() => diff(startsAt));

  useEffect(() => {
    setT(diff(startsAt));
    const id = setInterval(() => setT(diff(startsAt)), 1000);
    return () => clearInterval(id);
  }, [startsAt]);

  if (compact) {
    return (
      <span
        className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wide"
        style={{ color: theme.palette.ink }}
        data-testid="festival-countdown-compact"
      >
        <span className="opacity-80">{label}</span>
        <span style={{ color: theme.palette.accent }}>
          {t.d}d {pad(t.h)}h {pad(t.m)}m {pad(t.s)}s
        </span>
      </span>
    );
  }

  const Cell = ({ n, l }: { n: number; l: string }) => (
    <div className="flex flex-col items-center min-w-[64px]">
      <div
        className="text-2xl sm:text-4xl font-bold tabular-nums leading-none px-3 py-2 rounded-md"
        style={{ background: `${theme.palette.accent}26`, color: theme.palette.ink }}
        data-testid={`countdown-${l.toLowerCase()}`}
      >
        {pad(n)}
      </div>
      <span
        className="text-[10px] uppercase tracking-widest mt-1.5"
        style={{ color: theme.palette.accentSoft }}
      >
        {l}
      </span>
    </div>
  );

  return (
    <div className="flex items-center gap-2 sm:gap-3" data-testid="festival-countdown">
      <Cell n={t.d} l="Days" />
      <span className="text-2xl font-bold opacity-50" style={{ color: theme.palette.accent }}>:</span>
      <Cell n={t.h} l="Hours" />
      <span className="text-2xl font-bold opacity-50" style={{ color: theme.palette.accent }}>:</span>
      <Cell n={t.m} l="Mins" />
      <span className="text-2xl font-bold opacity-50" style={{ color: theme.palette.accent }}>:</span>
      <Cell n={t.s} l="Secs" />
    </div>
  );
}
