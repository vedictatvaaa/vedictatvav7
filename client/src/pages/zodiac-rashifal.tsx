import { useMemo, useState, useRef, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Download, Star, Sun, Sparkles, Gem, Heart, Briefcase, Wallet, Activity, BookOpen, Palette, Hash, Calendar, Moon, Compass, Clock, ThumbsUp, ShieldAlert, Loader2, Copy, Check, ArrowRight } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import { RelatedServicesSection } from "@/components/RelatedServices";
import { useToast } from "@/hooks/use-toast";
import { faqPage as faqPageSchema, breadcrumbList as breadcrumbListSchema, abs } from "@/lib/seo-schemas";

type DailyRashifalResponse = {
  date: string;
  sign: { slug: string; name: string; english: string; sanskrit?: string; symbol: string; ruler: string; element: string };
  system: "vedic" | "western";
  astro: {
    weekday: string; weekdayHi: string; weekdayLord: string;
    tithi: string; tithiHi: string; tithiNumber: number;
    paksha: string; pakshaHi: string;
    nakshatra: string; nakshatraHi: string; nakshatraLord: string; nakshatraDeity: string;
    yoga: string; rahuKaal: string; abhijit: string;
  };
  prediction: {
    dayScore: number; mood: string;
    overview: string; love: string; career: string; finance: string; health: string;
    luckyColor: string; luckyNumber: string; luckyTime: string; luckyDirection: string;
    doToday: string; avoidToday: string;
  };
  surprise: { title: string; message: string };
  source: "ai" | "fallback";
};

function signSlug(name: string): string {
  return name.split(" (")[0].trim().toLowerCase();
}

// ---------- Scratch-to-reveal canvas ----------
function ScratchToReveal({ title, message }: { title: string; message: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const [revealed, setRevealed] = useState(false);
  const [percent, setPercent] = useState(0);
  const drawingRef = useRef(false);
  const erasedAreaRef = useRef(0);
  const lastPosRef = useRef<{ x: number; y: number } | null>(null);

  // Reset whenever the message changes (e.g. user picks a different sign)
  useEffect(() => {
    setRevealed(false);
    setPercent(0);
    erasedAreaRef.current = 0;
    paintCover();
  }, [message]);

  const paintCover = useCallback(() => {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    canvas.width = Math.round(cssW * dpr);
    canvas.height = Math.round(cssH * dpr);
    canvas.style.width = `${cssW}px`;
    canvas.style.height = `${cssH}px`;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.globalCompositeOperation = "source-over";
    const grad = ctx.createLinearGradient(0, 0, cssW, cssH);
    grad.addColorStop(0, "#D4AF37");
    grad.addColorStop(0.5, "#F4E4A1");
    grad.addColorStop(1, "#B8941F");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, cssW, cssH);
    // Decorative shimmer dots
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 14; i++) {
      const x = (i * 73) % cssW;
      const y = (i * 41) % cssH;
      ctx.beginPath();
      ctx.arc(x, y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    }
    // Prompt text
    ctx.fillStyle = "#6D2B35";
    ctx.font = "600 14px 'Inter', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("✦  SCRATCH HERE TO REVEAL  ✦", cssW / 2, cssH / 2 - 10);
    ctx.font = "italic 12px 'Inter', sans-serif";
    ctx.fillStyle = "rgba(109,43,53,0.7)";
    ctx.fillText("a cosmic surprise just for your sign today", cssW / 2, cssH / 2 + 12);
  }, []);

  useEffect(() => {
    paintCover();
    const onResize = () => paintCover();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [paintCover]);

  const getPos = (e: MouseEvent | TouchEvent | React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const t = "touches" in e ? (e.touches[0] || (e as any).changedTouches?.[0]) : (e as MouseEvent);
    if (!t) return null;
    return { x: (t as any).clientX - rect.left, y: (t as any).clientY - rect.top };
  };

  const erase = (x: number, y: number) => {
    const canvas = canvasRef.current!;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const wrap = wrapRef.current!;
    const cssW = wrap.clientWidth;
    const cssH = wrap.clientHeight;
    const r = 26;
    ctx.globalCompositeOperation = "destination-out";
    // If we have a previous point, draw a thick line to fill the gap
    const last = lastPosRef.current;
    if (last) {
      ctx.lineWidth = r * 2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(last.x, last.y);
      ctx.lineTo(x, y);
      ctx.stroke();
      const dx = x - last.x;
      const dy = y - last.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      erasedAreaRef.current += dist * r * 2 + Math.PI * r * r;
    } else {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      erasedAreaRef.current += Math.PI * r * r;
    }
    lastPosRef.current = { x, y };
    const total = cssW * cssH;
    const pct = Math.min(100, Math.round((erasedAreaRef.current / total) * 100));
    if (pct !== percent) setPercent(pct);
    if (pct >= 38 && !revealed) {
      setRevealed(true);
      // Fade the cover out by clearing fully
      setTimeout(() => {
        const c = canvasRef.current?.getContext("2d");
        if (c && canvasRef.current) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }, 220);
    }
  };

  const onDown = (e: React.MouseEvent | React.TouchEvent) => {
    if (revealed) return;
    drawingRef.current = true;
    lastPosRef.current = null;
    const p = getPos(e);
    if (p) erase(p.x, p.y);
  };
  const onMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!drawingRef.current || revealed) return;
    e.preventDefault?.();
    const p = getPos(e);
    if (p) erase(p.x, p.y);
  };
  const onUp = () => {
    drawingRef.current = false;
    lastPosRef.current = null;
  };

  return (
    <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md p-5 md:p-6" data-testid="scratch-card">
      <div className="flex items-center gap-2 mb-3">
        <div className="h-px w-6 bg-[#D4AF37]" />
        <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-semibold">Daily Surprise</span>
        <div className="h-px w-6 bg-[#D4AF37]" />
      </div>
      <h3 className="font-serif text-lg md:text-xl text-[#6D2B35] font-bold mb-1">{title}</h3>
      <p className="text-[11px] text-[#5a4a3a]/60 mb-4">A sealed cosmic message — scratch the gold to reveal it. Refreshes every 24 hours.</p>
      <div
        ref={wrapRef}
        className="relative w-full h-[180px] md:h-[200px] rounded-md overflow-hidden border border-[#D4AF37]/40 select-none"
        style={{ touchAction: "none" }}
      >
        <div className="absolute inset-0 flex items-center justify-center px-5 md:px-7 text-center bg-gradient-to-br from-white via-[#FBF7EE] to-[#F8EFD9]">
          <p className="font-serif text-[#6D2B35] text-[14px] md:text-[15px] leading-relaxed" data-testid="scratch-message">
            <Sparkles className="inline-block w-4 h-4 mr-1.5 text-[#D4AF37] -translate-y-px" strokeWidth={1.6} />
            {message}
          </p>
        </div>
        <canvas
          ref={canvasRef}
          className={`absolute inset-0 w-full h-full transition-opacity duration-300 ${revealed ? "opacity-0 pointer-events-none" : "opacity-100 cursor-grab active:cursor-grabbing"}`}
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
          data-testid="scratch-canvas"
        />
      </div>
      <div className="flex items-center justify-between mt-3">
        <p className="text-[11px] text-[#5a4a3a]/55">
          {revealed ? "✦ Revealed — may it bless your day" : `Scratched ${percent}%`}
        </p>
        {!revealed && (
          <button
            type="button"
            onClick={() => { setRevealed(true); const c = canvasRef.current?.getContext("2d"); if (c && canvasRef.current) c.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); }}
            className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#6D2B35] hover:text-[#D4AF37] transition-colors"
            data-testid="btn-reveal-all"
          >
            Reveal all
          </button>
        )}
      </div>
    </div>
  );
}

// ---------- Daily Rashifal block ----------
function DailyRashifalBlock({ system, sign }: { system: "vedic" | "western"; sign: { name: string; symbol: string; ruler: string; element: string } }) {
  const slug = signSlug(sign.name);
  const { data, isLoading, isError } = useQuery<DailyRashifalResponse>({
    queryKey: ["/api/daily-rashifal", system, slug],
    queryFn: async () => {
      const r = await fetch(`/api/daily-rashifal?system=${system}&sign=${slug}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    staleTime: 1000 * 60 * 60, // 1h client cache
    retry: 1,
  });

  const [tab, setTab] = useState<"overview" | "love" | "career" | "finance" | "health">("overview");

  if (isLoading) {
    return (
      <div className="bg-white border border-[#D4AF37]/25 rounded-md p-8 text-center" data-testid="daily-rashifal-loading">
        <Loader2 className="w-6 h-6 text-[#6D2B35] mx-auto mb-3 animate-spin" />
        <p className="text-sm text-[#5a4a3a]/70">Reading today's planetary positions for {sign.name}…</p>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className="bg-white border border-[#D4AF37]/25 rounded-md p-6 text-center" data-testid="daily-rashifal-error">
        <p className="text-sm text-[#5a4a3a]/70">Today's rashifal is resting. Please try again in a moment.</p>
      </div>
    );
  }

  const p = data.prediction;
  const a = data.astro;
  const tabs = [
    { key: "overview", label: "Overview", text: p.overview, Icon: BookOpen },
    { key: "love", label: "Love", text: p.love, Icon: Heart },
    { key: "career", label: "Career", text: p.career, Icon: Briefcase },
    { key: "finance", label: "Finance", text: p.finance, Icon: Wallet },
    { key: "health", label: "Health", text: p.health, Icon: Activity },
  ] as const;
  const active = tabs.find(t => t.key === tab)!;
  const ActiveIcon = active.Icon;
  const ringPct = (p.dayScore / 10) * 100;
  const todayLabel = new Date(data.date + "T12:00:00Z").toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="bg-white border border-[#D4AF37]/25 rounded-md overflow-hidden" data-testid="daily-rashifal-block">
      {/* Header strip */}
      <div className="bg-gradient-to-br from-[#6D2B35] to-[#5a1f29] text-white p-5 md:p-6 border-b border-[#D4AF37]/30">
        <div className="flex items-center gap-4 md:gap-5">
          {/* Day score ring */}
          <div className="relative shrink-0 w-16 h-16 md:w-20 md:h-20">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.9" fill="none" stroke="rgba(212,175,55,0.2)" strokeWidth="3" />
              <circle
                cx="18" cy="18" r="15.9" fill="none" stroke="#D4AF37" strokeWidth="3"
                strokeDasharray={`${ringPct} 100`} strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="font-serif text-xl md:text-2xl font-bold text-[#D4AF37] leading-none">{p.dayScore}</span>
              <span className="text-[8px] uppercase tracking-[0.2em] text-white/60 mt-0.5">/ 10</span>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold">Aaj Ka Rashifal</span>
              <span className="text-white/40">|</span>
              <span className="text-[11px] text-white/70">{todayLabel}</span>
            </div>
            <h3 className="font-serif text-xl md:text-2xl font-bold leading-tight">
              {sign.symbol} {sign.name} <span className="text-[#D4AF37]/85 text-base md:text-lg font-normal">— {p.mood}</span>
            </h3>
            <p className="text-[11px] text-white/60 mt-0.5">{data.source === "ai" ? "AI-crafted from today's panchang" : "Generated from today's panchang"}</p>
          </div>
        </div>

        {/* Astronomy chips */}
        <div className="flex flex-wrap gap-1.5 mt-4">
          {data.system === "vedic" && (
            <>
              <AstroChip Icon={Moon} label={`${a.tithi} (${a.paksha.split(" ")[0]})`} />
              <AstroChip Icon={Star} label={`${a.nakshatra} · ${a.nakshatraLord}`} />
              <AstroChip Icon={Sun} label={`${a.weekday} · ${a.weekdayLord}'s day`} />
            </>
          )}
          {data.system === "western" && (
            <>
              <AstroChip Icon={Sun} label={`${a.weekday} · ruled by ${a.weekdayLord}`} />
              <AstroChip Icon={Star} label={`${sign.element} · ${sign.ruler}`} />
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="p-5 md:p-6">
        <div className="flex overflow-x-auto gap-2 mb-4 pb-1">
          {tabs.map(t => {
            const isActive = tab === t.key;
            const Icon = t.Icon;
            return (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border ${
                  isActive
                    ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                    : "bg-[#FBF7EE] text-[#6D2B35] border-[#D4AF37]/25 hover-elevate"
                }`}
                data-testid={`btn-daily-tab-${t.key}`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5 mb-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-9 h-9 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center">
              <ActiveIcon className="w-4 h-4 text-[#6D2B35]" />
            </div>
            <h4 className="font-serif text-base font-bold text-[#6D2B35]">{active.label}</h4>
          </div>
          <p className="text-[#5a4a3a]/85 leading-relaxed text-sm" data-testid={`text-daily-${active.key}`}>{active.text}</p>
        </div>

        {/* Do / Avoid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
          <div className="bg-white border border-[#D4AF37]/25 rounded-md p-4 flex gap-3">
            <ThumbsUp className="w-4 h-4 text-[#1f7a3d] mt-0.5 shrink-0" strokeWidth={1.8} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#1f7a3d] font-semibold mb-1">Do today</p>
              <p className="text-[13px] text-[#5a4a3a]/85 leading-snug" data-testid="text-do-today">{p.doToday}</p>
            </div>
          </div>
          <div className="bg-white border border-[#D4AF37]/25 rounded-md p-4 flex gap-3">
            <ShieldAlert className="w-4 h-4 text-[#9a4d1f] mt-0.5 shrink-0" strokeWidth={1.8} />
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a4d1f] font-semibold mb-1">Avoid today</p>
              <p className="text-[13px] text-[#5a4a3a]/85 leading-snug" data-testid="text-avoid-today">{p.avoidToday}</p>
            </div>
          </div>
        </div>

        {/* Lucky panel */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#D4AF37]/25 rounded-md overflow-hidden border border-[#D4AF37]/25 mb-5">
          {[
            { Icon: Palette, label: "Lucky Color", value: p.luckyColor },
            { Icon: Hash, label: "Lucky Number", value: p.luckyNumber },
            { Icon: Clock, label: "Lucky Time", value: p.luckyTime },
            { Icon: Compass, label: "Direction", value: p.luckyDirection },
          ].map((item, i) => (
            <div key={i} className="bg-white p-3.5 text-center">
              <item.Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-1.5" strokeWidth={1.6} />
              <p className="text-[9px] uppercase tracking-[0.2em] text-[#5a4a3a]/55 font-medium mb-0.5">{item.label}</p>
              <p className="text-[12px] font-semibold text-[#6D2B35] leading-snug">{item.value}</p>
            </div>
          ))}
        </div>

        {/* Scratch surprise */}
        <ScratchToReveal title={data.surprise.title} message={data.surprise.message} />

        {/* Rahu Kaal note (vedic only) */}
        {data.system === "vedic" && a.rahuKaal !== "—" && (
          <p className="text-[11px] text-[#5a4a3a]/55 mt-3 text-center">
            Today's Rahu Kaal: <span className="text-[#6D2B35] font-medium">{a.rahuKaal}</span> · Abhijit Muhurat: <span className="text-[#6D2B35] font-medium">{a.abhijit}</span>
          </p>
        )}
      </div>
    </div>
  );
}

function AstroChip({ Icon, label }: { Icon: any; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 bg-white/10 border border-[#D4AF37]/25 rounded-md px-2.5 py-1 text-[11px] text-white/85">
      <Icon className="w-3 h-3 text-[#D4AF37]" />
      {label}
    </span>
  );
}

const PRIMARY_BTN = "bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2";

const vedicSigns = [
  { name: "Mesh (Aries)", sanskrit: "मेष", symbol: "♈", ruler: "Mars (Mangal)", element: "Fire", dates: "Apr 14 – May 14" },
  { name: "Vrishabh (Taurus)", sanskrit: "वृषभ", symbol: "♉", ruler: "Venus (Shukra)", element: "Earth", dates: "May 15 – Jun 14" },
  { name: "Mithun (Gemini)", sanskrit: "मिथुन", symbol: "♊", ruler: "Mercury (Budh)", element: "Air", dates: "Jun 15 – Jul 16" },
  { name: "Kark (Cancer)", sanskrit: "कर्क", symbol: "♋", ruler: "Moon (Chandra)", element: "Water", dates: "Jul 17 – Aug 16" },
  { name: "Singh (Leo)", sanskrit: "सिंह", symbol: "♌", ruler: "Sun (Surya)", element: "Fire", dates: "Aug 17 – Sep 16" },
  { name: "Kanya (Virgo)", sanskrit: "कन्या", symbol: "♍", ruler: "Mercury (Budh)", element: "Earth", dates: "Sep 17 – Oct 17" },
  { name: "Tula (Libra)", sanskrit: "तुला", symbol: "♎", ruler: "Venus (Shukra)", element: "Air", dates: "Oct 18 – Nov 15" },
  { name: "Vrishchik (Scorpio)", sanskrit: "वृश्चिक", symbol: "♏", ruler: "Mars (Mangal)", element: "Water", dates: "Nov 16 – Dec 15" },
  { name: "Dhanu (Sagittarius)", sanskrit: "धनु", symbol: "♐", ruler: "Jupiter (Guru)", element: "Fire", dates: "Dec 16 – Jan 14" },
  { name: "Makar (Capricorn)", sanskrit: "मकर", symbol: "♑", ruler: "Saturn (Shani)", element: "Earth", dates: "Jan 15 – Feb 12" },
  { name: "Kumbh (Aquarius)", sanskrit: "कुम्भ", symbol: "♒", ruler: "Saturn (Shani)", element: "Air", dates: "Feb 13 – Mar 14" },
  { name: "Meen (Pisces)", sanskrit: "मीन", symbol: "♓", ruler: "Jupiter (Guru)", element: "Water", dates: "Mar 15 – Apr 13" },
];

const westernSigns = [
  { name: "Aries", symbol: "♈", ruler: "Mars", element: "Fire", dates: "Mar 21 – Apr 19" },
  { name: "Taurus", symbol: "♉", ruler: "Venus", element: "Earth", dates: "Apr 20 – May 20" },
  { name: "Gemini", symbol: "♊", ruler: "Mercury", element: "Air", dates: "May 21 – Jun 20" },
  { name: "Cancer", symbol: "♋", ruler: "Moon", element: "Water", dates: "Jun 21 – Jul 22" },
  { name: "Leo", symbol: "♌", ruler: "Sun", element: "Fire", dates: "Jul 23 – Aug 22" },
  { name: "Virgo", symbol: "♍", ruler: "Mercury", element: "Earth", dates: "Aug 23 – Sep 22" },
  { name: "Libra", symbol: "♎", ruler: "Venus", element: "Air", dates: "Sep 23 – Oct 22" },
  { name: "Scorpio", symbol: "♏", ruler: "Mars/Pluto", element: "Water", dates: "Oct 23 – Nov 21" },
  { name: "Sagittarius", symbol: "♐", ruler: "Jupiter", element: "Fire", dates: "Nov 22 – Dec 21" },
  { name: "Capricorn", symbol: "♑", ruler: "Saturn", element: "Earth", dates: "Dec 22 – Jan 19" },
  { name: "Aquarius", symbol: "♒", ruler: "Saturn/Uranus", element: "Air", dates: "Jan 20 – Feb 18" },
  { name: "Pisces", symbol: "♓", ruler: "Jupiter/Neptune", element: "Water", dates: "Feb 19 – Mar 20" },
];

const yearlyPredictions: Record<string, { overview: string; love: string; career: string; finance: string; health: string; luckyColor: string; luckyNumber: string; luckyGem: string; mantra: string }> = {
  "Mesh (Aries)": {
    overview: "2026 brings transformative energy for Mesh rashi. With Jupiter transiting your 2nd house until May and then moving to your 3rd house, expect growth in wealth and communication. Saturn in Kumbh rashi continues to influence your 11th house of gains, bringing steady income from multiple sources. Rahu in Meen adds spiritual depth to your personality.",
    love: "Relationships deepen significantly this year. Single natives may find a compatible partner between March and July. Married couples experience renewed romance, especially during Venus transits in April and September. Communication will be key — express your feelings openly.",
    career: "Professional growth accelerates from May onwards. New opportunities emerge in leadership roles. Those in business see expansion, particularly in technology and creative fields. A career change considered around August-September yields positive results by year end.",
    finance: "Financial stability improves steadily. Investments made in the first quarter show returns by Q3. Avoid speculative trading during eclipses in March and September. Property purchases favored between June and August. Unexpected gains possible in November.",
    health: "Energy levels remain high throughout the year. Focus on digestive health during summer months. Regular yoga and pranayama recommended. Avoid overexertion during Mars retrograde periods. Mental health improves with meditation practice.",
    luckyColor: "Red & Coral", luckyNumber: "9, 18, 27", luckyGem: "Red Coral (Moonga)", mantra: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः"
  },
  "Vrishabh (Taurus)": {
    overview: "2026 is a year of stability and growth for Vrishabh rashi. Jupiter blesses your sign with wisdom and expansion until May, then moves to enhance your financial house. Saturn's transit through your 10th house brings career recognition. This is your year to build lasting foundations.",
    love: "Love life blossoms beautifully. Venus, your ruling planet, brings magnetic charm especially in March, May, and October. Committed relationships reach new milestones — engagement or marriage possible. Family harmony improves significantly in the second half.",
    career: "Saturn rewards hard work with promotions and recognition. Leadership opportunities arise in Q2. Creative professionals gain widespread appreciation. Business expansion into new markets is favored. Academic pursuits yield excellent results.",
    finance: "Wealth accumulation is strong this year. Real estate investments are highly favorable. Savings increase substantially. Avoid lending large sums during Rahu-Ketu transit periods. Gold and silver investments bring good returns. Inheritance or property gains possible.",
    health: "Overall health remains stable. Throat and neck areas need attention. Incorporate singing or chanting for therapeutic benefits. Ayurvedic diet routines benefit greatly. Outdoor activities and nature walks boost wellbeing.",
    luckyColor: "White & Cream", luckyNumber: "6, 15, 24", luckyGem: "Diamond (Heera)", mantra: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः"
  },
  "Mithun (Gemini)": {
    overview: "2026 brings intellectual stimulation and social expansion for Mithun rashi. Mercury's favorable transits enhance your communication skills manifold. Jupiter's movement into your sign from May brings luck, wisdom, and new beginnings. This is a transformative year for personal growth.",
    love: "Social connections multiply, bringing romantic possibilities. Mercury-Venus conjunctions in spring and autumn create perfect conditions for romance. Existing relationships benefit from better communication. Travel with partner brings joy.",
    career: "Communication-based careers thrive. Writing, teaching, media, and technology sectors bring exceptional opportunities. Networking opens doors to unexpected positions. Entrepreneurial ventures in digital domains are highly favored. Skill upgradation leads to promotions.",
    finance: "Multiple income streams develop. Freelance and consulting work brings additional revenue. Short-term investments perform well. Avoid financial commitments during Mercury retrograde periods. Collaborative business ventures are profitable.",
    health: "Nervous system health needs attention. Regular breaks from screen time essential. Breathing exercises and mindfulness meditation are highly beneficial. Arms and shoulders may need care. Mental agility remains sharp with proper rest.",
    luckyColor: "Green & Yellow", luckyNumber: "5, 14, 23", luckyGem: "Emerald (Panna)", mantra: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः"
  },
  "Kark (Cancer)": {
    overview: "2026 emphasizes home, family, and emotional growth for Kark rashi. The Moon's cycles bring heightened intuition and creativity. Jupiter's transit supports spiritual development and foreign connections. Saturn encourages building strong financial foundations.",
    love: "Deep emotional bonds form or strengthen. Family life brings immense joy. Those seeking marriage find suitable alliances through family connections. Nurturing relationships receive cosmic support. Children bring pride and happiness.",
    career: "Careers in hospitality, healthcare, real estate, and nurturing professions flourish. Work-from-home opportunities increase. Property-related businesses boom. Emotional intelligence becomes your greatest professional asset. Government sector opportunities arise.",
    finance: "Property investments yield excellent returns. Savings through systematic plans grow substantially. Mother's side brings financial support or inheritance. Avoid impulsive spending during full moon periods. Long-term financial security strengthens.",
    health: "Digestive health requires attention throughout the year. Emotional eating patterns need awareness. Water-based therapies and swimming are beneficial. Chest and stomach areas need care. Moon-phase-aligned fasting brings positive results.",
    luckyColor: "Silver & White", luckyNumber: "2, 11, 20", luckyGem: "Pearl (Moti)", mantra: "ॐ श्रां श्रीं श्रौं सः चन्द्राय नमः"
  },
  "Singh (Leo)": {
    overview: "2026 is a powerful year for Singh rashi. The Sun's energy amplifies your natural leadership qualities. Jupiter's transit brings recognition and honors. Saturn teaches patience while rewarding persistence. Creative expression reaches new heights.",
    love: "Romance is vibrant and passionate. Grand gestures in love bring reciprocal warmth. Creative partnerships thrive. Those in relationships experience loyalty and devotion. Social gatherings bring new romantic interests for singles.",
    career: "Leadership positions become available. Entertainment, politics, and management careers peak. Recognition and awards are likely. Creative projects gain widespread attention. Mentoring others brings personal satisfaction and professional growth.",
    finance: "Generous spending tendencies need balance with savings. Investments in entertainment and luxury sectors perform well. Speculation during favorable Sun transits brings gains. Children's education investments are well-starred. Gold investments favored.",
    health: "Heart health and spine care are priorities. Regular cardiovascular exercise essential. Vitamin D through morning sun exposure benefits greatly. Back strengthening exercises recommended. Overall vitality remains high.",
    luckyColor: "Gold & Orange", luckyNumber: "1, 10, 19", luckyGem: "Ruby (Manik)", mantra: "ॐ ह्रां ह्रीं ह्रौं सः सूर्याय नमः"
  },
  "Kanya (Virgo)": {
    overview: "2026 brings precision, health consciousness, and service orientation for Kanya rashi. Mercury's multiple transits enhance analytical abilities. Jupiter encourages expansion through partnerships. Saturn in your 6th house helps overcome obstacles and enemies.",
    love: "Practical approaches to love yield the best results. Shared routines and health activities strengthen bonds. Analytical nature should be balanced with emotional expression. Service to partner deepens connection. Autumn brings romantic opportunities.",
    career: "Healthcare, analytics, accounting, and service industries flourish. Attention to detail brings exceptional recognition. Research and documentation projects succeed. Quality improvement initiatives lead to promotions. Teaching and training roles expand.",
    finance: "Methodical financial planning pays dividends. Health-related investments are profitable. Debt reduction strategies work effectively. Mutual funds and SIPs perform well. Avoid risky ventures — steady growth is your path.",
    health: "Health consciousness peaks positively. Digestive system optimization through diet brings vitality. Ayurvedic cleansing routines are highly effective. Intestinal health needs seasonal attention. Mental health improves with structured routines.",
    luckyColor: "Green & Earth tones", luckyNumber: "5, 14, 32", luckyGem: "Emerald (Panna)", mantra: "ॐ ब्रां ब्रीं ब्रौं सः बुधाय नमः"
  },
  "Tula (Libra)": {
    overview: "2026 is about balance, beauty, and partnerships for Tula rashi. Venus graces your sign with charm and artistic abilities. Jupiter's transit enhances education and spiritual growth. Saturn brings restructuring in home and family matters.",
    love: "Love and partnerships are the central theme. Venus transits create magical romantic periods in April, July, and November. Marriage prospects are excellent. Existing relationships find new harmony. Artistic collaborations with partners flourish.",
    career: "Arts, diplomacy, law, and fashion industries bring success. Partnership-based businesses thrive. Mediation and counseling roles expand. Interior design and aesthetics careers peak. Justice and fairness in workplace earn respect.",
    finance: "Partner or spouse contributes significantly to financial growth. Joint investments perform well. Art and beauty-related investments are profitable. Balance between spending on luxury and saving is key. Legal settlements favor you.",
    health: "Kidney and lower back health need attention. Adequate water intake is crucial. Skin care routines bring positive results. Balance in all aspects — diet, exercise, rest — is essential. Couples' wellness activities benefit both partners.",
    luckyColor: "Pink & Pastel Blue", luckyNumber: "6, 15, 24", luckyGem: "Diamond (Heera)", mantra: "ॐ द्रां द्रीं द्रौं सः शुक्राय नमः"
  },
  "Vrishchik (Scorpio)": {
    overview: "2026 brings deep transformation and rebirth for Vrishchik rashi. Mars and Ketu's influences create intense spiritual awakening. Jupiter's transit supports financial gains through others. Saturn encourages building disciplined daily routines.",
    love: "Intense and passionate connections characterize the year. Trust-building exercises strengthen relationships. Past relationship patterns are healed. Physical and emotional intimacy deepens. Transformative love experiences in March and October.",
    career: "Research, investigation, psychology, and occult sciences bring career breakthroughs. Insurance and finance sectors are highly favorable. Healing professions thrive. Deep analytical work brings recognition. Power dynamics at work shift in your favor.",
    finance: "Inheritance, insurance payouts, and joint finances bring unexpected gains. Tax-related benefits materialize. Investment in real estate through others' resources is favored. Avoid unauthorized financial dealings. Hidden sources of income emerge.",
    health: "Reproductive and excretory system health needs attention. Detox programs are highly beneficial. Emotional healing through therapy or spiritual practices is transformative. Tantric practices and yoga bring extraordinary benefits.",
    luckyColor: "Maroon & Deep Red", luckyNumber: "9, 18, 27", luckyGem: "Red Coral (Moonga)", mantra: "ॐ क्रां क्रीं क्रौं सः भौमाय नमः"
  },
  "Dhanu (Sagittarius)": {
    overview: "2026 expands horizons for Dhanu rashi. Jupiter, your ruling planet, brings wisdom and growth in multiple areas. Foreign travel and higher education are highly favored. Saturn encourages building lasting family foundations and emotional security.",
    love: "Long-distance relationships and cross-cultural romances are highlighted. Philosophical compatibility matters more than physical attraction. Teacher-student dynamics evolve into deeper bonds. Adventure and travel with partner strengthen relationship.",
    career: "Education, philosophy, law, publishing, and international trade sectors flourish. Foreign assignments bring growth. Academic achievements peak. Religious and spiritual leadership roles emerge. Entrepreneurial ventures in travel sector succeed.",
    finance: "Foreign income sources develop. Educational investments bring long-term returns. Publishing royalties and intellectual property income increase. Avoid over-optimistic financial projections. Father's business or property brings benefits.",
    health: "Liver and thigh areas need attention. Outdoor sports and horse riding bring joy and fitness. Avoid excess in food and drink. Travel-related health precautions important. Spiritual retreats bring holistic healing.",
    luckyColor: "Yellow & Purple", luckyNumber: "3, 12, 21", luckyGem: "Yellow Sapphire (Pukhraj)", mantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः"
  },
  "Makar (Capricorn)": {
    overview: "2026 is about structure, ambition, and achievement for Makar rashi. Saturn continues to bless your 2nd house with steady wealth accumulation. Jupiter enhances creativity and romantic expression. This is a year of building lasting legacy.",
    love: "Mature and committed relationships deepen. Professional partnerships evolve into personal bonds. Father figures play important role in love life decisions. Patience in love is rewarded. Traditional courtship brings the best results.",
    career: "Corporate leadership, government positions, and structured industries bring peak success. Long-term projects reach completion. Authority and respect increase. Real estate and construction careers thrive. Administrative skills are recognized and rewarded.",
    finance: "Systematic wealth building reaches milestones. Fixed deposits and bonds perform well. Property portfolio grows. Conservative investment strategies pay off. Tax planning brings significant savings. Business expansion through methodical approach succeeds.",
    health: "Bone and joint health need regular attention. Calcium-rich diet essential. Knee and dental care important. Cold-weather precautions necessary. Discipline in health routines brings longevity. Walking and structured exercise programs excel.",
    luckyColor: "Black & Dark Blue", luckyNumber: "8, 17, 26", luckyGem: "Blue Sapphire (Neelam)", mantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः"
  },
  "Kumbh (Aquarius)": {
    overview: "2026 brings innovation and humanitarian focus for Kumbh rashi. Saturn's presence in your sign continues personal transformation. Jupiter brings stability in home and property matters. Unique ideas and inventions gain recognition.",
    love: "Unconventional romantic connections bring joy. Friendship-based romances are most fulfilling. Community and group activities lead to meeting like-minded partners. Technology facilitates long-distance relationships. Freedom within commitment is the ideal balance.",
    career: "Technology, social media, humanitarian work, and innovation sectors peak. Startups and disruptive ventures succeed. Scientific research brings breakthroughs. Community leadership roles expand. Freelance and remote work arrangements thrive.",
    finance: "Cryptocurrency and tech investments show potential. Crowdfunding and community-based financial models succeed. Irregular but significant income patterns emerge. Humanitarian investments bring karmic returns. Group investments are favored.",
    health: "Circulatory system and ankle health need attention. Electronic device radiation awareness important. Grounding exercises and barefoot walking beneficial. Meditation and pranayama for mental clarity. Sleep patterns need regulation.",
    luckyColor: "Electric Blue & Silver", luckyNumber: "8, 17, 26", luckyGem: "Blue Sapphire (Neelam)", mantra: "ॐ प्रां प्रीं प्रौं सः शनैश्चराय नमः"
  },
  "Meen (Pisces)": {
    overview: "2026 is deeply spiritual and creative for Meen rashi. Jupiter blesses communication and short travels. Rahu in your sign brings unique experiences and spiritual growth. Neptune's influence enhances artistic and intuitive abilities to extraordinary levels.",
    love: "Soulmate connections intensify. Spiritual bonds transcend ordinary relationships. Creative collaborations with partners bring mutual growth. Empathic connections deepen. Dreams and intuition guide romantic decisions accurately.",
    career: "Arts, music, film, healing, and spiritual professions peak. Hospital and retreat center careers expand. Photography and visual arts bring recognition. Charitable work opens unexpected career doors. Counseling and therapy roles multiply.",
    finance: "Intuitive financial decisions often prove correct. Charitable giving returns multiplied blessings. Avoid lending without documentation. Creative projects generate passive income. Spiritual commerce and wellness businesses are profitable.",
    health: "Feet and lymphatic system health need care. Water-based healing therapies are highly effective. Avoid intoxicants strictly. Sleep quality and dream analysis bring insights. Meditation retreats bring transformative healing.",
    luckyColor: "Sea Green & Lavender", luckyNumber: "3, 12, 21", luckyGem: "Yellow Sapphire (Pukhraj)", mantra: "ॐ ग्रां ग्रीं ग्रौं सः गुरवे नमः"
  },
  "Aries": {
    overview: "2026 ignites bold new beginnings for Aries. Mars energizes your ambitions while Jupiter expands opportunities in communication and learning. Expect a dynamic year of action, leadership, and personal breakthroughs. The spring equinox marks a powerful reset for your goals.",
    love: "Passionate encounters define your love life. New relationships spark quickly and burn bright. Existing partners appreciate your renewed energy and initiative. Summer brings especially romantic opportunities. Be mindful of impatience in conflicts.",
    career: "Entrepreneurial energy peaks. Leadership roles call you with irresistible force. Military, sports, and competitive fields bring glory. Quick decision-making leads to wins. Avoid burning bridges — diplomacy alongside action brings lasting success.",
    finance: "Action-oriented investments yield returns. Startup investments are favored. Avoid impulsive spending during retrograde periods. Physical assets like vehicles and equipment are good investments. Emergency fund building is essential.",
    health: "High energy needs proper channeling through exercise. Head and face areas need protection. Combat sports and martial arts bring excellent fitness. Avoid overheating. Iron-rich diet supports your ruling planet Mars.",
    luckyColor: "Red & Scarlet", luckyNumber: "1, 9, 17", luckyGem: "Diamond", mantra: "I am the pioneer, I lead with courage"
  },
  "Taurus": {
    overview: "2026 brings material abundance and sensory pleasures for Taurus. Venus ensures beauty surrounds you in all forms. Financial growth is steady and reliable. Relationships deepen with loyalty and devotion as cornerstones.",
    love: "Stable, nurturing love defines the year. Sensual experiences bring couples closer. Singles attract partners through authenticity. Patience in courtship rewards with lasting bonds. Home-based romantic gestures are most appreciated.",
    career: "Finance, agriculture, art, and luxury goods sectors flourish. Real estate brings exceptional returns. Culinary careers gain recognition. Patience-based work strategies outperform aggressive tactics. Voice and music-related talents shine.",
    finance: "Steady wealth accumulation through traditional means. Real estate is your strongest investment. Savings accounts and fixed deposits grow reliably. Avoid get-rich-quick schemes. Luxury purchases that hold value are wise investments.",
    health: "Throat and thyroid health need monitoring. Singing and vocal exercises are therapeutic. Sensory pleasures should be enjoyed in moderation. Nature walks and gardening bring peace. Weight management through balanced diet is key.",
    luckyColor: "Green & Pink", luckyNumber: "6, 15, 24", luckyGem: "Emerald", mantra: "I build with patience, I grow with grace"
  },
  "Gemini": {
    overview: "2026 stimulates your intellectual curiosity to extraordinary levels, Gemini. Mercury's rapid movements bring constant new information and connections. Jupiter's entry into your sign mid-year marks a major life expansion cycle.",
    love: "Intellectual compatibility drives romantic attraction. Witty conversations lead to deep connections. Variety in dating brings clarity about true desires. Communication skills make you irresistible. Autumn romances have lasting potential.",
    career: "Media, technology, writing, and education careers soar. Social media influence grows exponentially. Multilingual skills become valuable assets. Teaching and tutoring bring fulfillment. Podcasting and content creation open new revenue streams.",
    finance: "Diverse income streams multiply. Side hustles and gig economy work prosper. Information products and digital assets generate passive income. Avoid financial advice from unreliable sources. Quick trading brings mixed results.",
    health: "Respiratory health and arm/shoulder care are priorities. Journaling reduces anxiety effectively. Hand exercises prevent repetitive strain. Variety in exercise routines prevents boredom. Breathing exercises are your best medicine.",
    luckyColor: "Yellow & Light Green", luckyNumber: "5, 14, 23", luckyGem: "Agate", mantra: "I communicate with clarity and connect with purpose"
  },
  "Cancer": {
    overview: "2026 nurtures your emotional world beautifully, Cancer. The Moon's phases deeply influence your yearly rhythm. Home and family themes dominate with positive outcomes. Inner security builds the foundation for external success.",
    love: "Emotional depth in relationships brings fulfillment. Family approval matters in romantic choices. Nurturing gestures win hearts. Home-making activities strengthen bonds. Mother figures play important roles in love guidance.",
    career: "Real estate, food industry, childcare, and healthcare sectors bring success. Hotel and restaurant businesses expand. Interior decoration talents are recognized. Emotional intelligence becomes your leadership superpower. Government welfare roles suit you.",
    finance: "Property is your strongest asset class. Family wealth grows through collective effort. Home-based businesses generate steady income. Silver investments are profitable. Insurance policies bring peace of mind. Kitchen renovation adds property value.",
    health: "Stomach and breast health need regular check-ups. Emotional eating patterns require awareness. Water therapy and swimming bring healing. Moon-phase fasting yields excellent results. Home-cooked meals are your best medicine.",
    luckyColor: "White & Silver", luckyNumber: "2, 7, 11", luckyGem: "Moonstone", mantra: "I nurture myself and others with boundless love"
  },
  "Leo": {
    overview: "2026 puts you center stage, Leo. The Sun's brilliance amplifies your natural charisma. Creative expression reaches spectacular heights. Leadership opportunities arrive from multiple directions. Romance and children bring immense joy.",
    love: "Grand romantic gestures define your love story. Theater, art, and creative pursuits attract like-minded partners. Children or the desire for them strengthen partnerships. Loyalty is both given and received. Celebrate love openly and proudly.",
    career: "Entertainment, politics, education of children, and creative arts careers peak. Acting, directing, and producing bring recognition. Sports management and coaching roles expand. Heart-centered leadership earns lasting respect.",
    finance: "Creative investments and entertainment industry ventures are profitable. Children's education funds grow well. Stock market participation in luxury brands is favored. Generous spending should be balanced with royal savings.",
    health: "Heart health is paramount — both physical and emotional. Back exercises strengthen your core. Sun exposure (moderate) is beneficial. Creative expression acts as therapy. Dramatic physical activities like dance boost vitality.",
    luckyColor: "Gold & Royal Purple", luckyNumber: "1, 10, 19", luckyGem: "Ruby", mantra: "I shine my light generously upon the world"
  },
  "Virgo": {
    overview: "2026 refines your life systems with precision, Virgo. Mercury's analytical gifts help optimize every area of life. Health and wellness routines reach peak effectiveness. Service to others brings unexpected personal rewards.",
    love: "Practical love languages — acts of service, quality time — bring deepest connection. Health-conscious partners attract you. Analytical approach to dating finds compatible matches. Clean, organized environments set the mood for romance.",
    career: "Healthcare, data analytics, editing, and quality assurance roles flourish. Nutrition and wellness businesses grow. Administrative excellence gets recognized. Environmental and sustainability careers attract. Detail-oriented work brings premium compensation.",
    finance: "Meticulous budgeting and financial planning pay off handsomely. Health-related expense tracking prevents waste. Systematic investment plans (SIPs) are your best tool. Accounting accuracy prevents losses. Frugality without deprivation is the balance.",
    health: "This is your strongest health year. Digestive optimization through probiotics and fiber. Vitamin and mineral balance through whole foods. Neurological health supported by puzzles and mental exercises. Preventive health check-ups yield excellent results.",
    luckyColor: "Navy Blue & Forest Green", luckyNumber: "5, 14, 23", luckyGem: "Peridot", mantra: "I perfect my world through mindful service"
  },
  "Libra": {
    overview: "2026 harmonizes all areas of life for Libra. Venus ensures beauty, art, and balanced relationships. Partnerships — both personal and professional — bring the greatest growth. Justice and fairness themes play out favorably.",
    love: "Partnership is your keyword. Marriage proposals and engagements are highly starred. Couple activities bring joy. Compromise and balance in relationships feel natural. Art and beauty shared with a partner create lasting memories.",
    career: "Law, diplomacy, fashion, interior design, and mediation careers thrive. Partnership-based businesses succeed. Beauty industry ventures expand. Public relations and event management bring recognition. Fair dealing builds lasting reputation.",
    finance: "Joint finances and partnerships drive wealth growth. Art investments appreciate significantly. Fashion and beauty product investments perform well. Legal settlements favor you. Marriage or partnership brings financial uplift.",
    health: "Kidney and adrenal health need attention. Sugar and salt balance is crucial. Partner-based exercise routines motivate consistency. Spa and beauty treatments aren't luxury — they're health investments. Hormonal balance through natural methods.",
    luckyColor: "Rose Pink & Light Blue", luckyNumber: "6, 15, 24", luckyGem: "Opal", mantra: "I create harmony in every space I touch"
  },
  "Scorpio": {
    overview: "2026 brings profound transformation and power for Scorpio. Pluto's deep influence continues to reshape your life fundamentally. Hidden truths surface, and personal power reaches new levels. Rebirth themes dominate the year.",
    love: "Intensity and depth characterize romance. Soul-level connections form or deepen. Trust becomes the foundation of lasting love. Past relationship karma resolves. Physical and emotional intimacy reach extraordinary depths.",
    career: "Psychology, investigation, research, and finance bring career peaks. Surgery and healing professions thrive. Crisis management skills are in high demand. Insurance and investment banking sectors favor you. Power dynamics shift positively.",
    finance: "Others' resources benefit you — insurance, inheritance, joint investments. Tax returns are favorable. Deep financial analysis reveals hidden opportunities. Debt transformation strategies succeed. Passive income through investments grows.",
    health: "Reproductive and elimination system health are priorities. Emotional detox through therapy or journaling is essential. Kundalini yoga and tantric practices bring extraordinary vitality. Hydration and waste elimination support overall health.",
    luckyColor: "Black & Dark Maroon", luckyNumber: "9, 18, 27", luckyGem: "Topaz", mantra: "I transform darkness into light, fear into power"
  },
  "Sagittarius": {
    overview: "2026 expands your world view dramatically, Sagittarius. Jupiter's blessings bring adventure, wisdom, and luck. Travel and higher education open new dimensions of understanding. Philosophical growth shapes life decisions positively.",
    love: "Cross-cultural romances bring exciting connections. Shared adventures strengthen bonds. Freedom-loving approach to love attracts compatible partners. Teacher-student dynamics evolve. Long-distance relationships thrive with trust.",
    career: "International trade, education, law, and travel industries bring success. Publishing and broadcasting reach wider audiences. Philosophical and religious teaching roles expand. Coaching and mentoring bring fulfillment. Equestrian and outdoor careers peak.",
    finance: "Foreign investments and international business bring profits. Educational investments yield long-term returns. Travel industry investments are timely. Avoid over-extension — optimism needs grounding. Lottery and gambling have occasional luck.",
    health: "Liver health and hip flexibility need attention. Horse riding, hiking, and outdoor sports bring vitality. Avoid dietary excess especially during celebrations. Philosophical contentment supports mental health. Leg exercises prevent stiffness.",
    luckyColor: "Royal Blue & Purple", luckyNumber: "3, 12, 21", luckyGem: "Turquoise", mantra: "I explore with wonder and teach with wisdom"
  },
  "Capricorn": {
    overview: "2026 builds your legacy brick by brick, Capricorn. Saturn rewards your discipline with lasting achievements. Professional recognition peaks. Authority and responsibility grow hand in hand. Patience continues to be your greatest virtue.",
    love: "Mature, committed relationships bring deep satisfaction. Age-gap relationships may feature. Professional connections evolve into personal ones. Family traditions in courtship bring best results. Building a home together strengthens bonds.",
    career: "Corporate leadership, government, architecture, and engineering careers reach summits. Long-term projects complete with recognition. Authority positions are offered. Real estate development brings success. Legacy projects gain support.",
    finance: "Conservative investment strategies bring the best returns. Real estate portfolio grows significantly. Retirement planning shows excellent progress. Family business expansion is favored. Government bonds and fixed income securities perform well.",
    health: "Skeletal system, especially knees and joints, need care. Calcium supplements and weight-bearing exercise essential. Dental health requires attention. Cold-weather joint care is important. Disciplined health routines bring longevity.",
    luckyColor: "Charcoal & Dark Brown", luckyNumber: "8, 17, 26", luckyGem: "Garnet", mantra: "I build mountains one stone at a time"
  },
  "Aquarius": {
    overview: "2026 electrifies your innovative spirit, Aquarius. Uranus continues to disrupt conventional paths in favor of breakthrough solutions. Community leadership and humanitarian work bring deep fulfillment. Technology becomes your greatest tool.",
    love: "Unconventional love stories write themselves. Online connections lead to meaningful relationships. Community involvement introduces compatible partners. Friendship as the foundation of romance works perfectly. Freedom and space within commitment is essential.",
    career: "Technology, social media, humanitarian organizations, and innovation sectors peak. Startup culture suits your energy. Scientific breakthroughs are possible. Community organizing and activism create career paths. Space and aviation technologies attract.",
    finance: "Tech and innovation investments bring volatile but significant returns. Crowdfunding projects succeed. Community-based economic models attract. Cryptocurrency awareness grows (proceed with caution). Unconventional income sources emerge.",
    health: "Circulatory system and ankle health need attention. Electronic detox periods are essential. Grounding exercises and nature immersion balance tech-heavy lifestyle. Sleep regulation through consistent routines. Group fitness activities motivate.",
    luckyColor: "Electric Blue & Violet", luckyNumber: "4, 13, 22", luckyGem: "Amethyst", mantra: "I innovate for the benefit of all humanity"
  },
  "Pisces": {
    overview: "2026 deepens your spiritual ocean, Pisces. Neptune enhances intuition and creativity to mystical levels. Jupiter supports wealth and communication. Artistic expression becomes a channel for spiritual messages. Compassion guides all decisions.",
    love: "Soulmate energies are strongest this year. Spiritual connections transcend ordinary romance. Creative collaborations with partners bring mutual inspiration. Empathic bonds deepen. Dreams guide you to your true love.",
    career: "Music, film, art, healing, and spiritual counseling careers peak. Hospital and retreat work brings fulfillment. Photography captures souls. Charitable organizations value your compassion. Marine-related careers thrive. Dance and movement therapy roles expand.",
    finance: "Intuitive financial decisions often prove profitable. Charitable giving returns multiplied blessings. Creative and artistic income sources grow. Avoid lending without proper documentation. Water and beverage industry investments are favorable.",
    health: "Feet, lymphatic system, and immune health are focus areas. Aquatic exercise is the best medicine. Avoid all intoxicants. Sleep quality directly affects overall health. Art therapy and music therapy bring healing. Meditation is essential.",
    luckyColor: "Sea Green & Violet", luckyNumber: "3, 7, 12", luckyGem: "Aquamarine", mantra: "I flow with universal compassion and infinite creativity"
  },
};

function generatePDFContent(sign: any, prediction: any, system: string) {
  const systemLabel = system === "vedic" ? "Vedic (Indian)" : "Western";
  const year = new Date().getFullYear();
  let content = `VEDIC TATVA - ${systemLabel} Yearly Rashifal ${year}\n`;
  content += `${"=".repeat(60)}\n\n`;
  content += `Sign: ${sign.name}${sign.sanskrit ? ` (${sign.sanskrit})` : ""}\n`;
  content += `Symbol: ${sign.symbol} | Element: ${sign.element}\n`;
  content += `Ruler: ${sign.ruler} | Period: ${sign.dates}\n`;
  content += `${"─".repeat(60)}\n\n`;
  content += `YEARLY OVERVIEW\n${prediction.overview}\n\n`;
  content += `LOVE & RELATIONSHIPS\n${prediction.love}\n\n`;
  content += `CAREER & PROFESSION\n${prediction.career}\n\n`;
  content += `FINANCE & WEALTH\n${prediction.finance}\n\n`;
  content += `HEALTH & WELLNESS\n${prediction.health}\n\n`;
  content += `${"─".repeat(60)}\n`;
  content += `Lucky Color: ${prediction.luckyColor}\n`;
  content += `Lucky Numbers: ${prediction.luckyNumber}\n`;
  content += `Lucky Gemstone: ${prediction.luckyGem}\n`;
  content += `Mantra: ${prediction.mantra}\n\n`;
  content += `${"─".repeat(60)}\n`;
  content += `Generated by Vedic Tatva | vedictatva.com\n`;
  content += `Heritage of Nature, Wellness & Purity\n`;
  return content;
}

function downloadPrediction(sign: any, prediction: any, system: string) {
  const content = generatePDFContent(sign, prediction, system);
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${sign.name.replace(/[^a-zA-Z0-9]/g, "_")}_Rashifal_2026.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const categoryIcons: Record<string, any> = {
  love: Heart,
  career: Briefcase,
  finance: Wallet,
  health: Activity,
  overview: BookOpen,
};

export default function ZodiacRashifal() {
  const [system, setSystem] = useState<"vedic" | "western">("vedic");
  const [selectedSign, setSelectedSign] = useState<number | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string>("overview");
  const detailRef = useRef<HTMLDivElement>(null);

  const signs = system === "vedic" ? vedicSigns : westernSigns;
  const currentSign = selectedSign !== null ? signs[selectedSign] : null;
  const prediction = currentSign ? yearlyPredictions[currentSign.name] : null;

  const handleSelectSign = (index: number) => {
    setSelectedSign(index);
    setExpandedCategory("overview");
    setTimeout(() => detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 100);
  };

  // "Find my rashi/sign" DOB helper: resolves a date to the matching sign using each sign's `dates` range.
  const [dob, setDob] = useState<string>("");

  // ---- Janma Rashi (Vedic Moon Sign at birth) ----
  const [showJanma, setShowJanma] = useState(false);
  const [jrTime, setJrTime] = useState<string>("");
  const [jrPlace, setJrPlace] = useState<string>("");
  const [jrLoading, setJrLoading] = useState(false);
  const [jrError, setJrError] = useState<string | null>(null);
  const [jrResult, setJrResult] = useState<null | {
    rashi: string; rashiHi: string; signIndex: number; rashiLord: string; element: string;
    nakshatra: string; nakshatraHi: string; nakshatraLord: string; nakshatraDeity: string; pada: number;
    timeKnown: boolean; place: string; note: string;
  }>(null);
  const lookupJanmaRashi = async () => {
    setJrError(null); setJrResult(null);
    if (!dob) { setJrError("Please enter your date of birth above first."); return; }
    if (!jrPlace.trim()) { setJrError("Please enter your birth city."); return; }
    setJrLoading(true);
    try {
      const params = new URLSearchParams({ date: dob, place: jrPlace.trim() });
      if (jrTime) params.set("time", jrTime);
      const r = await fetch(`/api/janma-rashi?${params}`);
      if (!r.ok) {
        const e = await r.json().catch(() => ({}));
        throw new Error(e?.message || "Could not compute your Janma Rashi.");
      }
      const data = await r.json();
      setJrResult({
        rashi: data.moon.rashi, rashiHi: data.moon.rashiHi, signIndex: data.moon.signIndex,
        rashiLord: data.moon.rashiLord, element: data.moon.element,
        nakshatra: data.moon.nakshatra, nakshatraHi: data.moon.nakshatraHi,
        nakshatraLord: data.moon.nakshatraLord, nakshatraDeity: data.moon.nakshatraDeity,
        pada: data.moon.pada, timeKnown: data.input.timeKnown, place: data.input.place, note: data.note,
      });
    } catch (err: any) {
      setJrError(err?.message || "Could not compute your Janma Rashi.");
    } finally {
      setJrLoading(false);
    }
  };
  const MONTHS: Record<string, number> = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5, jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };
  const parseRangeToken = (tok: string): [number, number] | null => {
    const m = tok.trim().match(/^([A-Za-z]{3})\s+(\d{1,2})$/);
    if (!m) return null;
    const mo = MONTHS[m[1].toLowerCase()];
    if (mo == null) return null;
    return [mo, parseInt(m[2], 10)];
  };
  const dobMatch = useMemo(() => {
    if (!dob) return null;
    // Parse YYYY-MM-DD manually to avoid Date() UTC parsing shifting the day in negative tz offsets.
    const parts = dob.split("-");
    if (parts.length !== 3) return null;
    const m = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    if (Number.isNaN(m) || Number.isNaN(day) || m < 0 || m > 11 || day < 1 || day > 31) return null;
    const dayOfYear = (mo: number, dy: number) => mo * 31 + dy;
    const target = dayOfYear(m, day);
    for (let i = 0; i < signs.length; i++) {
      const range = signs[i].dates.split(/[–-]/);
      if (range.length !== 2) continue;
      const a = parseRangeToken(range[0]);
      const b = parseRangeToken(range[1]);
      if (!a || !b) continue;
      const start = dayOfYear(a[0], a[1]);
      const end = dayOfYear(b[0], b[1]);
      const inRange = start <= end ? target >= start && target <= end : target >= start || target <= end;
      if (inRange) return { idx: i, sign: signs[i] };
    }
    return null;
  }, [dob, signs]);

  const categories = [
    { key: "overview", label: "Yearly Overview", icon: BookOpen },
    { key: "love", label: "Love & Relationships", icon: Heart },
    { key: "career", label: "Career & Profession", icon: Briefcase },
    { key: "finance", label: "Finance & Wealth", icon: Wallet },
    { key: "health", label: "Health & Wellness", icon: Activity },
  ];

  return (
    <div className="min-h-screen bg-white">
      <PageSeo
        title="Aaj Ka Rashifal & Zodiac Predictions — Daily, Weekly, Monthly, Yearly Horoscope | Vedic Tatva"
        description="Read accurate daily rashifal in Hindi & English for all 12 zodiac signs. Aaj ka rashifal, weekly, monthly and yearly horoscope predictions covering love, career, finance and health — Vedic Jyotish & Western astrology, lucky number, lucky colour, lucky gemstone, kundli-based forecasts and astrology remedies."
        keywords="zodiac signs, astrology predictions, horoscope today, daily horoscope, weekly horoscope, monthly horoscope, yearly horoscope, vedic astrology, rashifal today, rashifal in hindi, horoscope prediction, zodiac compatibility, zodiac personality traits, future prediction astrology, online astrology guidance, aaj ka rashifal, kal ka rashifal, saptahik rashifal, maasik rashifal, varshik rashifal, mesh rashi today, vrishabh rashi prediction, mithun rashifal, kark rashi today, singh rashi future, kanya rashi career, tula rashi love life, vrishchik rashi today, dhanu rashi prediction, makar rashi astrology, kumbh rashi rashifal, meen rashi today, Aries horoscope today, Taurus horoscope today, Gemini horoscope today, Cancer horoscope today, Leo horoscope today, Virgo horoscope today, Libra horoscope today, Scorpio horoscope today, Sagittarius horoscope today, Capricorn horoscope today, Aquarius horoscope today, Pisces horoscope today, today horoscope for all zodiac signs, accurate vedic astrology predictions, free daily rashifal online, zodiac sign future prediction, love marriage astrology prediction, career horoscope by zodiac sign, money horoscope today, health astrology predictions, lucky color and lucky number today, astrology remedies for zodiac signs, best zodiac compatibility guide, kundli based horoscope prediction, mercury retrograde effects, saturn transit predictions, rahu ketu transit, shani sade sati prediction, numerology and zodiac, moon sign astrology, vedic moon horoscope, lucky gemstone astrology, zodiac lucky color today"
        canonical="/zodiac-rashifal"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Zodiac & Rashifal", url: abs("/zodiac-rashifal") },
          ]),
          faqPageSchema([
            { question: "What is the difference between Vedic and Western rashifal?", answer: "Vedic rashifal uses your Moon sign (Chandra Rashi) calculated from your birth time and is considered more accurate for personal predictions. Western horoscope uses your Sun sign based on date of birth alone." },
            { question: "How accurate is aaj ka rashifal?", answer: "Daily rashifal gives the cosmic 'weather forecast' for your sign. For deeper life predictions, pair it with a full Vedic kundli reading." },
            { question: "Is the daily horoscope free?", answer: "Yes — Vedic Tatva offers free daily, weekly, monthly and yearly rashifal for all 12 zodiac signs in both Vedic and Western systems." },
          ], "rashifal-faq"),
        ]}
      />
      <section className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-10 sm:py-14 max-w-4xl text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#D4AF37]/60" />
            <Star className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">Aaj Ka Rashifal · Daily Horoscope · Yearly Forecast 2026</span>
            <div className="h-px w-8 bg-[#D4AF37]/60" />
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-3" data-testid="zodiac-heading">
            Aaj Ka Rashifal & Zodiac Predictions
          </h1>
          <p className="text-white/75 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-6">
            Free daily, weekly, monthly and yearly horoscope for all 12 zodiac signs — accurate Vedic Jyotish and Western astrology predictions for love, career, finance and health.
          </p>

          <div className="inline-flex bg-white/5 rounded-md p-1 border border-[#D4AF37]/30" data-testid="zodiac-system-toggle">
            <button
              onClick={() => { setSystem("vedic"); setSelectedSign(null); }}
              className={`px-5 h-9 rounded-md text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors inline-flex items-center gap-2 ${
                system === "vedic" ? "bg-[#D4AF37] text-[#6D2B35]" : "text-white/70 hover:text-white"
              }`}
              data-testid="btn-vedic-system"
            >
              <Sun className="w-3.5 h-3.5" /> Vedic
            </button>
            <button
              onClick={() => { setSystem("western"); setSelectedSign(null); }}
              className={`px-5 h-9 rounded-md text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors inline-flex items-center gap-2 ${
                system === "western" ? "bg-[#D4AF37] text-[#6D2B35]" : "text-white/70 hover:text-white"
              }`}
              data-testid="btn-western-system"
            >
              <Star className="w-3.5 h-3.5" /> Western
            </button>
          </div>
        </div>
      </section>

      <section className="py-8 md:py-10 bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="bg-white border border-[#D4AF37]/30 rounded-md p-5 md:p-6" data-testid="rashi-dob-helper">
            <div className="flex items-start gap-3 mb-3">
              <div className="h-9 w-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center shrink-0">
                <Calendar className="h-4 w-4 text-[#6D2B35]" />
              </div>
              <div>
                <h3 className="font-serif text-lg text-[#6D2B35] leading-tight">Don't know your {system === "vedic" ? "rashi" : "sign"}?</h3>
                <p className="text-xs text-[#5a4a3a]/70 mt-0.5">Enter your date of birth and we'll find it for you.</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="date"
                value={dob}
                max={new Date().toISOString().slice(0, 10)}
                onChange={(e) => setDob(e.target.value)}
                className="flex-1 h-10 px-3 rounded-md border border-[#D4AF37]/30 bg-white text-[13px] text-[#5a4a3a] focus:outline-none focus:border-[#6D2B35]"
                data-testid="input-rashi-dob"
                aria-label="Date of birth"
              />
              {dobMatch && (
                <button
                  type="button"
                  onClick={() => handleSelectSign(dobMatch.idx)}
                  className="h-10 px-4 rounded-md bg-[#6D2B35] text-[#D4AF37] text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#5a1f29] transition-colors"
                  data-testid="btn-show-my-rashi"
                >
                  Show my reading <Sparkles className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
            {dob && !dobMatch && (
              <p className="text-xs text-[#5a4a3a]/70 mt-2" data-testid="text-rashi-no-match">Please enter a valid date of birth.</p>
            )}
            {dobMatch && (
              <p className="text-sm text-[#5a4a3a] mt-3" data-testid="text-rashi-result">
                Your {system === "vedic" ? "Sun sign (Vedic & Western)" : "sun sign"} is{" "}
                <strong className="text-[#6D2B35]">{dobMatch.sign.name} {dobMatch.sign.symbol}</strong>
                {" "}— ruled by {dobMatch.sign.ruler}, {dobMatch.sign.element} element.
              </p>
            )}

            {system === "vedic" && (
              <div className="mt-4 pt-4 border-t border-[#D4AF37]/20">
                <button
                  type="button"
                  onClick={() => setShowJanma(v => !v)}
                  className="w-full flex items-center justify-between text-left group"
                  data-testid="btn-toggle-janma-rashi"
                >
                  <span className="flex items-center gap-2">
                    <Moon className="h-4 w-4 text-[#6D2B35]" />
                    <span className="text-sm font-semibold text-[#6D2B35]">Find my <em>true</em> Janma Rashi (Moon sign)</span>
                  </span>
                  <span className="text-xs text-[#5a4a3a]/60 group-hover:text-[#6D2B35]">{showJanma ? "Hide" : "Show"}</span>
                </button>
                <p className="text-[11px] text-[#5a4a3a]/65 mt-1 leading-relaxed">
                  In Vedic tradition, your <strong>rashi</strong> usually means the Moon's sign at your birth — not the Sun's. It needs your birth time and city.
                </p>

                {showJanma && (
                  <div className="mt-3 space-y-2" data-testid="janma-rashi-panel">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-[#5a4a3a]/70 mb-1">Birth time (24h)</label>
                        <input
                          type="time"
                          value={jrTime}
                          onChange={(e) => setJrTime(e.target.value)}
                          className="w-full h-10 px-3 rounded-md border border-[#D4AF37]/30 bg-white text-[13px] text-[#5a4a3a] focus:outline-none focus:border-[#6D2B35]"
                          data-testid="input-janma-time"
                          aria-label="Birth time"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] uppercase tracking-wide text-[#5a4a3a]/70 mb-1">Birth city</label>
                        <input
                          type="text"
                          value={jrPlace}
                          onChange={(e) => setJrPlace(e.target.value)}
                          placeholder="e.g. Guwahati, Delhi, Mumbai"
                          className="w-full h-10 px-3 rounded-md border border-[#D4AF37]/30 bg-white text-[13px] text-[#5a4a3a] focus:outline-none focus:border-[#6D2B35]"
                          data-testid="input-janma-place"
                          aria-label="Birth city"
                        />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={lookupJanmaRashi}
                      disabled={jrLoading || !dob || !jrPlace.trim()}
                      className="w-full h-10 rounded-md bg-[#6D2B35] text-[#D4AF37] text-[13px] font-semibold inline-flex items-center justify-center gap-2 hover:bg-[#5a1f29] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      data-testid="btn-compute-janma-rashi"
                    >
                      {jrLoading ? (<><Loader2 className="h-3.5 w-3.5 animate-spin" /> Computing…</>) : (<><Moon className="h-3.5 w-3.5" /> Compute my Janma Rashi</>)}
                    </button>
                    {!dob && (
                      <p className="text-[11px] text-[#5a4a3a]/70" data-testid="text-janma-need-dob">Tip: enter your date of birth in the field above first.</p>
                    )}
                    {jrError && (
                      <p className="text-xs text-[#9a1a2a]" data-testid="text-janma-error">{jrError}</p>
                    )}
                    {jrResult && (
                      <div className="mt-2 p-3 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30" data-testid="janma-rashi-result">
                        <div className="flex items-start justify-between gap-3 mb-2">
                          <div>
                            <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/70">Your Janma Rashi (Moon sign)</div>
                            <div className="font-serif text-xl text-[#6D2B35] leading-tight">
                              {jrResult.rashiHi} <span className="text-base text-[#5a4a3a]">({jrResult.rashi})</span>
                            </div>
                            <div className="text-[12px] text-[#5a4a3a]/80 mt-0.5">
                              Ruled by <strong>{jrResult.rashiLord}</strong> · {jrResult.element} element
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleSelectSign(jrResult.signIndex)}
                            className="h-9 px-3 rounded-md bg-[#6D2B35] text-[#D4AF37] text-[12px] font-semibold inline-flex items-center justify-center gap-1.5 hover:bg-[#5a1f29] transition-colors shrink-0"
                            data-testid="btn-load-janma-reading"
                          >
                            Load reading <Sparkles className="h-3 w-3" />
                          </button>
                        </div>
                        <div className="text-[12px] text-[#5a4a3a]/85 border-t border-[#D4AF37]/20 pt-2">
                          Nakshatra: <strong>{jrResult.nakshatra} ({jrResult.nakshatraHi})</strong> · Pada {jrResult.pada}
                          <span className="text-[#5a4a3a]/65"> · Lord {jrResult.nakshatraLord} · Deity {jrResult.nakshatraDeity}</span>
                        </div>
                        {!jrResult.timeKnown && (
                          <p className="text-[11px] text-[#9a6a1a] mt-2 flex items-start gap-1.5">
                            <Clock className="h-3 w-3 mt-0.5 shrink-0" />
                            <span>{jrResult.note}</span>
                          </p>
                        )}
                        {dobMatch && jrResult.signIndex !== dobMatch.idx && (
                          <p className="text-[11px] text-[#5a4a3a]/75 mt-2 italic">
                            Different from your Sun sign ({dobMatch.sign.name})? That's normal — most Indian families call the <strong>Moon sign</strong> your "rashi".
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </section>

      <section className="py-10 md:py-12" data-testid="zodiac-signs-grid">
        <div className="container mx-auto px-4">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <div className="h-px w-6 bg-[#D4AF37]/60" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">All Signs</span>
              <div className="h-px w-6 bg-[#D4AF37]/60" />
            </div>
            <h2 className="font-serif text-xl md:text-2xl font-bold text-[#6D2B35] mb-1">
              {system === "vedic" ? "Select Your Rashi" : "Select Your Sun Sign"}
            </h2>
            <p className="text-xs text-[#5a4a3a]/55">Tap a sign to view detailed yearly predictions.</p>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 max-w-4xl mx-auto">
            {signs.map((sign, i) => {
              const isSelected = selectedSign === i;
              return (
                <button
                  key={`${system}-${i}`}
                  onClick={() => handleSelectSign(i)}
                  className={`w-full text-center py-3.5 px-2 rounded-md transition-colors border ${
                    isSelected
                      ? "bg-[#6D2B35] border-[#D4AF37]/60 text-white"
                      : "bg-white border-[#D4AF37]/25 text-[#6D2B35] hover-elevate"
                  }`}
                  data-testid={`zodiac-card-${sign.name.toLowerCase().replace(/[^a-z]/g, "-")}`}
                >
                  <div className={`text-3xl mb-1.5 leading-none font-serif ${isSelected ? "text-[#D4AF37]" : "text-[#6D2B35]"}`}>
                    {sign.symbol}
                  </div>
                  <h3 className={`text-[11px] font-semibold leading-tight ${isSelected ? "text-white" : "text-[#6D2B35]"}`}>
                    {sign.name.split(" (")[0]}
                  </h3>
                  {"sanskrit" in sign && (
                    <p className={`text-[10px] mt-0.5 font-serif ${isSelected ? "text-[#D4AF37]/80" : "text-[#5a4a3a]/55"}`}>
                      {(sign as any).sanskrit}
                    </p>
                  )}
                  <p className={`text-[9px] mt-1 ${isSelected ? "text-white/60" : "text-[#5a4a3a]/50"}`}>
                    {sign.dates}
                  </p>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {currentSign && prediction && (
        <section ref={detailRef} className="pb-8" data-testid="daily-rashifal-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto mb-8">
              <DailyRashifalBlock system={system} sign={currentSign} />
            </div>
          </div>
        </section>
      )}

      {currentSign && prediction && (
        <section className="pb-12" data-testid="zodiac-detail-section">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white border border-[#D4AF37]/25 rounded-md overflow-hidden">
              <div className="bg-[#6D2B35] text-white p-6 md:p-7 border-b border-[#D4AF37]/30">
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-5">
                  <div className="w-14 h-14 rounded-md bg-white/5 border border-[#D4AF37]/40 flex items-center justify-center font-serif text-3xl text-[#D4AF37]">
                    {currentSign.symbol}
                  </div>
                  <div className="text-center sm:text-left flex-1">
                    <div className="flex items-center justify-center sm:justify-start gap-2 mb-1.5">
                      <div className="h-px w-6 bg-[#D4AF37]/60" />
                      <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">2026 Forecast</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-bold mb-1">{currentSign.name}</h2>
                    <div className="flex flex-wrap items-center justify-center sm:justify-start gap-x-3 gap-y-1 text-white/65 text-xs">
                      <span>{currentSign.element}</span>
                      <span className="text-[#D4AF37]/40">|</span>
                      <span>Ruler: {currentSign.ruler}</span>
                      <span className="text-[#D4AF37]/40">|</span>
                      <span>{currentSign.dates}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => downloadPrediction(currentSign, prediction, system)}
                    className="bg-[#D4AF37] text-[#6D2B35] hover:bg-[#c9a432] rounded-md h-10 px-5 text-[13px] font-semibold inline-flex items-center gap-2 transition-colors"
                    data-testid="btn-download-prediction"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                </div>
              </div>

              <div className="p-5 md:p-6 bg-white">
                <div className="flex overflow-x-auto gap-2 mb-5 pb-1">
                  {categories.map(cat => {
                    const Icon = cat.icon;
                    const isActive = expandedCategory === cat.key;
                    return (
                      <button
                        key={cat.key}
                        onClick={() => setExpandedCategory(cat.key)}
                        className={`inline-flex items-center gap-2 px-3.5 h-9 rounded-md text-xs font-semibold whitespace-nowrap transition-colors border ${
                          isActive
                            ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                            : "bg-[#FBF7EE] text-[#6D2B35] border-[#D4AF37]/25 hover-elevate"
                        }`}
                        data-testid={`btn-category-${cat.key}`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {cat.label}
                      </button>
                    );
                  })}
                </div>

                <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5 md:p-6">
                  {(() => {
                    const cat = categories.find(c => c.key === expandedCategory)!;
                    const Icon = cat.icon;
                    const text = prediction[expandedCategory as keyof typeof prediction];
                    return (
                      <div>
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-9 h-9 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center">
                            <Icon className="w-4 h-4 text-[#6D2B35]" />
                          </div>
                          <h3 className="font-serif text-base font-bold text-[#6D2B35]">{cat.label}</h3>
                        </div>
                        <p className="text-[#5a4a3a]/85 leading-relaxed text-sm">{text}</p>
                      </div>
                    );
                  })()}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#D4AF37]/25 mt-5 rounded-md overflow-hidden border border-[#D4AF37]/25">
                  {[
                    { label: "Lucky Color", value: prediction.luckyColor, Icon: Palette },
                    { label: "Lucky Numbers", value: prediction.luckyNumber, Icon: Hash },
                    { label: "Lucky Gemstone", value: prediction.luckyGem, Icon: Gem },
                    { label: "Mantra", value: prediction.mantra, Icon: Sparkles },
                  ].map((item, i) => (
                    <div key={i} className="bg-white p-4 text-center">
                      <item.Icon className="w-4 h-4 text-[#D4AF37] mx-auto mb-1.5" strokeWidth={1.6} />
                      <p className="text-[9px] uppercase tracking-[0.2em] text-[#5a4a3a]/55 font-medium mb-1">{item.label}</p>
                      <p className="text-xs font-semibold text-[#6D2B35] leading-snug">{item.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {selectedSign === null && (
        <section className="pb-12">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto bg-white border border-[#D4AF37]/25 rounded-md p-6 md:p-8">
              <div className="text-center mb-5">
                <div className="w-11 h-11 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center mx-auto mb-3">
                  <Sparkles className="w-5 h-5 text-[#6D2B35]" strokeWidth={1.6} />
                </div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="h-px w-6 bg-[#D4AF37]/60" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Tradition</span>
                  <div className="h-px w-6 bg-[#D4AF37]/60" />
                </div>
                <h3 className="font-serif text-xl font-bold text-[#6D2B35]">
                  {system === "vedic" ? "About Vedic Astrology (Jyotish)" : "About Western Astrology"}
                </h3>
              </div>
              {system === "vedic" ? (
                <div className="space-y-3 text-sm text-[#5a4a3a]/85 leading-relaxed">
                  <p>Vedic astrology, known as Jyotish Shastra, is an ancient Indian science of celestial influence dating back over 5,000 years. Unlike Western astrology which uses the tropical zodiac, Vedic astrology employs the sidereal zodiac that accounts for the precession of equinoxes, making it astronomically more precise.</p>
                  <p>The Vedic system divides the zodiac into 12 rashis (signs), each ruled by a graha (planet). The birth chart or Kundli maps the exact positions of celestial bodies at the moment of birth, revealing one's dharma (life purpose), karma (life lessons), and spiritual evolution path.</p>
                  <p>Key concepts include Nakshatras (27 lunar mansions), Dashas (planetary periods), Yogas (planetary combinations), and Doshas (afflictions). Remedies include gemstone therapy, mantra chanting, yagna (fire rituals), and charitable acts aligned with planetary energies.</p>
                </div>
              ) : (
                <div className="space-y-3 text-sm text-[#5a4a3a]/85 leading-relaxed">
                  <p>Western astrology traces its roots to ancient Mesopotamia and was refined by Greek, Roman, and medieval European scholars. It uses the tropical zodiac, based on the seasons and the relationship between Earth and the Sun.</p>
                  <p>The Western system focuses on the Sun sign as the primary indicator of personality and life themes. It also considers the Moon sign (emotions), Rising sign (outward personality), and the positions of planets in 12 houses representing different life areas.</p>
                  <p>Modern Western astrology incorporates outer planets (Uranus, Neptune, Pluto) discovered in later centuries, adding dimensions of generational influence, spiritual evolution, and deep psychological transformation to chart interpretation.</p>
                </div>
              )}
            </div>
          </div>
        </section>
      )}

      <TrendingAstrologyTopics />

      <MoreAstrologyTools />

      <RashifalHashtagStrip />

      <PageAPlusContent
        eyebrow="Why Read Your Rashifal Daily"
        title="Aaj Ka Rashifal — Daily Horoscope for All 12 Zodiac Signs"
        intro="Your rashifal is the daily map of how planetary movements influence your sign. Vedic Tatva combines authentic Vedic Jyotish (moon-sign based) with Western tropical astrology — giving you the deepest, most accurate daily horoscope in Hindi and English for love, career, finance and health."
        trustBadges={[
          { value: "12", label: "Rashis Covered" },
          { value: "Daily", label: "Fresh Predictions" },
          { value: "2", label: "Vedic + Western" },
          { value: "Free", label: "Forever" },
        ]}
        benefits={[
          { icon: Sun, title: "Vedic + Western Both", body: "Read your rashifal in both authentic Vedic (Moon sign) and Western (Sun sign) systems — switch with one tap to see what each tradition reveals." },
          { icon: Heart, title: "Love & Relationships", body: "Daily insights on romance, marriage and family bonds — including ideal compatible signs and lucky days for love." },
          { icon: Briefcase, title: "Career & Business", body: "Know which days favour new ventures, contract signing, job interviews and business expansion based on your rashi." },
          { icon: Wallet, title: "Money & Finance", body: "Daily financial guidance — when to invest, when to save, lucky numbers and favourable days for money matters." },
          { icon: Activity, title: "Health & Wellness", body: "Health predictions tailored to your rashi — what to eat, what to avoid, and which planetary energies need balancing." },
          { icon: Gem, title: "Lucky Gems & Colours", body: "Discover your sign's lucky gemstone, colour, number and direction — small daily choices that align you with cosmic flow." },
        ]}
        steps={[
          { title: "Choose Your Rashi", body: "Pick from 12 zodiac signs — Mesh, Vrishabh, Mithun, Kark, Singh, Kanya, Tula, Vrishchik, Dhanu, Makar, Kumbh, Meen." },
          { title: "Switch Vedic/Western", body: "Toggle between Vedic Moon-sign rashifal and Western Sun-sign horoscope to see both perspectives." },
          { title: "Read Today's Forecast", body: "Get detailed predictions across love, career, finance, health and overall day rating." },
          { title: "Apply Daily Tips", body: "Use lucky colour, number and gemstone guidance to make small choices that resonate with the day's energy." },
        ]}
        faqs={[
          { q: "What is the difference between Vedic and Western rashifal?", a: "Vedic rashifal uses your Moon sign (Chandra Rashi) calculated from your birth time — considered more accurate for personal predictions in Indian tradition. Western horoscope uses your Sun sign (date of birth only). Vedic Tatva offers both — toggle between them with one tap." },
          { q: "How do I know my exact Vedic rashi?", a: "Your Vedic rashi is your Moon sign at birth — calculated from your exact date, time and place of birth. Generate your free kundli on Vedic Tatva to discover it. Most people's Vedic Moon sign differs from their Western Sun sign." },
          { q: "Is the daily rashifal really free?", a: "Yes — completely free for all 12 rashis, in both Vedic and Western systems. No login required to read your daily horoscope. Premium 1-on-1 astrologer consultations are optional add-ons." },
          { q: "How often is aaj ka rashifal updated?", a: "Daily — fresh predictions are published every morning based on the day's planetary positions, tithi, nakshatra and current dasha periods." },
          { q: "Can rashifal predict my future accurately?", a: "Daily rashifal gives you the cosmic 'weather forecast' — useful for planning your day. For deeper life predictions (marriage, career, major decisions), pair it with your full Vedic kundli analysis or consult one of our verified astrologers." },
          { q: "What are the 12 Vedic rashis?", a: "Mesh (Aries), Vrishabh (Taurus), Mithun (Gemini), Kark (Cancer), Singh (Leo), Kanya (Virgo), Tula (Libra), Vrishchik (Scorpio), Dhanu (Sagittarius), Makar (Capricorn), Kumbh (Aquarius) and Meen (Pisces) — each ruled by a different planet (graha)." },
          { q: "How do I check love compatibility between rashis?", a: "Use our free Kundli Matching tool for full 36-point Ashtakoot Guna Milan compatibility. The daily rashifal also highlights ideal compatible signs and favourable days for love and marriage discussions." },
          { q: "Can I read my weekly or monthly rashifal too?", a: "Yes — beyond aaj ka rashifal (daily), Vedic Tatva offers weekly and monthly forecasts. Monthly rashifal is especially useful for planning major events, travel and financial decisions." },
        ]}
        keywordsBlurb="Aaj ka rashifal in Hindi & English for all 12 zodiac signs. Daily horoscope with Vedic and Western astrology — Mesh rashi, Vrishabh rashi, Mithun rashi, Kark rashi, Singh rashi, Kanya rashi, Tula rashi, Vrishchik rashi, Dhanu rashi, Makar rashi, Kumbh rashi and Meen rashi. Free daily, weekly and monthly horoscope predictions for love, career, money, health and family. Lucky number, lucky colour, lucky gemstone and compatible signs for every rashi."
      />

      <div className="container mx-auto px-4 py-8">
        <RelatedServicesSection context="rashifal" currentPath="/zodiac-rashifal" />
      </div>
    </div>
  );
}

const TRENDING_TOPICS: { icon: any; title: string; body: string }[] = [
  { icon: Compass, title: "Mercury Retrograde Effects", body: "Communication slows, contracts get re-read, ex-lovers reappear. The Vedic remedy: chant Budh Beej Mantra and avoid signing fresh agreements during Vakri Budh." },
  { icon: Clock, title: "Saturn Transit Predictions", body: "Shani Gochar through your rashi tests discipline and karma. Know which house Saturn is moving through and what it means for your career and dharma." },
  { icon: Moon, title: "Rahu Ketu Transit", body: "The Nodal axis shifts every 18 months and rewires desire and detachment. See how the current Rahu-Ketu transit reshapes your moon sign." },
  { icon: ShieldAlert, title: "Shani Sade Sati Prediction", body: "The 7.5-year Sade Sati phase touches Vrishchik, Dhanu and Makar rashis. Know your phase, the lessons, and the right Shani remedies." },
  { icon: Hash, title: "Numerology & Zodiac", body: "Your moolank (birth number) and bhagyank (destiny number) combine with your rashi to reveal your most favourable career path and compatible partners." },
  { icon: Moon, title: "Moon Sign Astrology", body: "In Vedic astrology your Janma Rashi (Moon sign) is more accurate than your Sun sign. Use our Janma Rashi calculator above to know yours." },
  { icon: Gem, title: "Lucky Gemstone Astrology", body: "Each rashi has a primary gemstone — ruby for Singh, pearl for Kark, blue sapphire for Makar. Wear yours after a proper energising puja." },
  { icon: Palette, title: "Zodiac Lucky Color Today", body: "Your rashi's lucky colour shifts daily based on the planetary lord of the day. Wearing the right shade aligns you with the day's energy." },
];

function TrendingAstrologyTopics() {
  return (
    <section className="py-12 bg-white" aria-labelledby="trending-astro-heading" data-testid="section-trending-astrology">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-2">Trending in Vedic Astrology</div>
          <h2 id="trending-astro-heading" className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-3">
            Planetary transits shaping your rashifal right now
          </h2>
          <p className="text-[15px] text-[#5a4a3a]/80 leading-relaxed">
            From Mercury retrograde to Shani Sade Sati, here's the Vedic context behind every aaj ka rashifal — the actual planetary movements driving your daily horoscope.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TRENDING_TOPICS.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.title}
                className="rounded-xl bg-[#FBF7EE] border border-[#D4AF37]/25 p-5 hover-elevate"
                data-testid={`card-trending-${t.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}`}
              >
                <div className="w-10 h-10 rounded-lg bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center mb-3">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="text-[15px] font-serif font-semibold text-[#6D2B35] mb-1.5 leading-snug">{t.title}</h3>
                <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">{t.body}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const MORE_TOOLS: { href: string; icon: any; title: string; body: string }[] = [
  { href: "/ai-kundli", icon: BookOpen, title: "Free Kundli & Birth Chart", body: "Generate your full Vedic kundli with dasha, yogas and remedies in 30 seconds." },
  { href: "/premium-kundli-pdf", icon: Sparkles, title: "Premium Kundli PDF", body: "60-page astrologer-grade horoscope PDF for marriage, career and life predictions." },
  { href: "/panchang-calendar", icon: Calendar, title: "Panchang Today", body: "Tithi, nakshatra, yoga, karana, rahu kaal and abhijit muhurat for every date." },
  { href: "/muhurat-finder", icon: Clock, title: "Shubh Muhurat Finder", body: "Find auspicious timings for marriage, griha pravesh, business, travel and namkaran." },
  { href: "/astrology", icon: Compass, title: "Talk to a Vedic Astrologer", body: "1-on-1 consultation with verified jyotishis — call, chat or video, in your language." },
  { href: "/ai-baby-names", icon: Heart, title: "Nakshatra Baby Names", body: "Auspicious baby names matched to your child's nakshatra and rashi at birth." },
  { href: "/ai-palm-reading", icon: Star, title: "AI Palm Reading", body: "Upload a palm photo for an instant Hast Rekha reading — life, love and career lines." },
  { href: "/vastu-compass", icon: Globe2Fallback, title: "Vastu Compass", body: "Check your home or office direction alignment for prosperity and harmony." },
];

function Globe2Fallback(props: any) {
  return <Compass {...props} />;
}

function MoreAstrologyTools() {
  return (
    <section className="py-12 bg-[#FBF7EE] border-y border-[#D4AF37]/15" aria-labelledby="more-tools-heading" data-testid="section-more-astrology-tools">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-10">
          <div className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-2">More from Vedic Tatva</div>
          <h2 id="more-tools-heading" className="text-2xl md:text-3xl font-serif font-semibold text-[#6D2B35] mb-3">
            Beyond the daily rashifal — your full astrology toolkit
          </h2>
          <p className="text-[15px] text-[#5a4a3a]/80 leading-relaxed">
            Kundli matching, panchang, muhurat, nakshatra naming and 1-on-1 astrologer consultations — every Vedic tool you need to plan your life.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {MORE_TOOLS.map((tool) => {
            const Icon = tool.icon;
            return (
              <Link
                key={tool.href}
                href={tool.href}
                className="group block rounded-xl bg-white border border-[#D4AF37]/25 p-5 hover-elevate"
                data-testid={`link-tool-${tool.href.replace(/^\//, "").replace(/\//g, "-")}`}
              >
                <div className="flex items-start gap-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-[15px] font-serif font-semibold text-[#6D2B35] leading-snug pt-1.5">{tool.title}</h3>
                </div>
                <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed mb-3">{tool.body}</p>
                <span className="inline-flex items-center gap-1 text-[12px] font-semibold text-[#6D2B35] group-hover:gap-1.5 transition-all">
                  Open <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

const RASHIFAL_HASHTAGS = [
  "#Rashifal", "#HoroscopeToday", "#ZodiacSigns", "#VedicAstrology", "#AajKaRashifal",
  "#AstrologyPrediction", "#DailyHoroscope", "#SanatanAstrology", "#VedicTatva", "#LuckyNumberToday",
];

function RashifalHashtagStrip() {
  const { toast } = useToast();
  const [copied, setCopied] = useState<string | null>(null);
  const copyText = async (text: string, key: string, successTitle: string, successDesc: string) => {
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
      setCopied(key);
      toast({ title: successTitle, description: successDesc });
      setTimeout(() => setCopied(null), 1400);
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    }
  };
  const handleCopy = (tag: string) => copyText(tag, tag, "Copied", `${tag} copied to clipboard`);
  const handleCopyAll = () => copyText(RASHIFAL_HASHTAGS.join(" "), "all", "All hashtags copied", `${RASHIFAL_HASHTAGS.length} hashtags copied`);
  return (
    <section className="container mx-auto px-4 py-8" aria-labelledby="rashifal-hashtag-heading" data-testid="rashifal-hashtag-strip">
      <div className="rounded-2xl bg-[#FBF7EE] border border-[#D4AF37]/25 p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <div>
            <div className="text-[10px] uppercase tracking-[0.3em] font-semibold text-[#D4AF37] mb-1">Share your rashifal</div>
            <h2 id="rashifal-hashtag-heading" className="text-xl font-serif font-semibold text-[#6D2B35] flex items-center gap-2">
              <Hash className="w-5 h-5" /> Tag your reading
            </h2>
            <p className="text-[13px] text-[#5a4a3a]/70 mt-1">Tap any tag to copy — share your daily rashifal with friends and family.</p>
          </div>
          <button
            type="button"
            onClick={handleCopyAll}
            className="inline-flex items-center justify-center h-9 px-4 rounded-md border border-[#6D2B35]/40 text-[#6D2B35] text-[13px] font-semibold hover-elevate"
            data-testid="btn-copy-all-rashifal-hashtags"
          >
            {copied === "all" ? <Check className="w-4 h-4 mr-1.5" /> : <Copy className="w-4 h-4 mr-1.5" />}
            Copy all
          </button>
        </div>
        <div className="sr-only" role="status" aria-live="polite" data-testid="rashifal-hashtag-copy-status">
          {copied ? (copied === "all" ? "All hashtags copied to clipboard" : `${copied} copied to clipboard`) : ""}
        </div>
        <div className="flex flex-wrap gap-2">
          {RASHIFAL_HASHTAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => handleCopy(tag)}
              className="inline-flex items-center gap-1.5 h-8 px-3 rounded-full bg-white border border-[#D4AF37]/30 text-[13px] font-medium text-[#6D2B35] hover-elevate active-elevate-2"
              data-testid={`hashtag-${tag.replace("#", "").toLowerCase()}`}
            >
              {copied === tag ? <Check className="w-3.5 h-3.5 text-[#D4AF37]" /> : null}
              {tag}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
