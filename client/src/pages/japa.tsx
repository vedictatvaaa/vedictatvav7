import { useEffect, useMemo, useState, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import JapCounter from "@/components/JapCounter";
import PageSeo from "@/components/PageSeo";
import SpiritualShowoffCards from "@/components/SpiritualShowoffCards";
import { faqPage, breadcrumbList, type Schema } from "@/lib/seo-schemas";
import { MANTRA_LIBRARY, type LibraryMantra } from "@/data/mantra-library";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, Zap, Copy, Check, ChevronDown, Loader2, Flame } from "lucide-react";

// Tiny haptic helper. Wraps navigator.vibrate so we can fire short pulses on
// every meaningful tap (mantra chip, oracle submit, copy, accordion toggle).
// JapCounter already drives its own vibration on each bead — these are for
// the surrounding controls so the whole page feels physical on mobile.
//
// Pattern guide:
//   tap       — 10ms      (chip selection, accordion toggle)
//   confirm   — [12,40,18] (success: oracle returned, copied)
//   error     — [40,30,40] (oracle failed)
function haptic(pattern: number | number[] = 10) {
  if (typeof navigator === "undefined") return;
  const v = (navigator as any).vibrate;
  if (typeof v === "function") {
    try { v.call(navigator, pattern); } catch {}
  }
}

type OracleResponse = {
  label: string;
  devanagari: string;
  transliteration: string;
  deity: string;
  meaning: string;
  recommendedCount: number;
  color: "gold" | "saffron" | "maroon" | "white" | "green" | "blue";
};

const ORACLE_PROMPTS = [
  "peace of mind",
  "Mahamrityunjaya",
  "abundance",
  "Hanuman",
  "remove obstacles",
  "courage",
];

// 8 most-chanted starters surfaced as horizontally-scrollable chips. Curated
// out of MANTRA_LIBRARY (which already has 30) so the chip strip stays
// glanceable on a 360px viewport.
const POPULAR_MANTRA_IDS = [
  "om",
  "om-namah-shivaya",
  "mahamrityunjaya",
  "om-gam-ganapataye",
  "hare-krishna",
  "om-shrim-mahalakshmi",
  "hanuman-mantra",
  "gayatri",
];

const HOW_TO_STEPS: Array<{ title: string; body: string }> = [
  {
    title: "Sit facing east, spine tall",
    body: "East invites the rising prana of Surya. Cross-legged on the floor or upright on a chair — what matters is a long, relaxed spine.",
  },
  {
    title: "Hold a mala in your right hand",
    body: "Drape the mala over the middle finger; move each bead with the thumb. Skip the index finger. Begin from the bead next to the meru (Guru bead).",
  },
  {
    title: "Set your sankalpa (intention)",
    body: "One short sentence — a deity, a healing, a person you wish well. The intention shapes where the mantra-energy lands.",
  },
  {
    title: "Tap the orb for each repetition",
    body: "Chant the mantra silently or aloud as you tap. Stay with one mantra for the full mala — switching mid-cycle scatters the prana.",
  },
  {
    title: "Bow the bell, do not cross the meru",
    body: "When the mala completes, the bell rings. To begin another round, flip the mala and start back — never cross over the Guru bead.",
  },
];

const FAQS: Array<{ question: string; answer: string }> = [
  {
    question: "How many malas of japa should I do daily?",
    answer:
      "One mala (108 repetitions) daily is the classical baseline and takes most people 8–12 minutes. Sadhakas under a guru's guidance often do 3, 11, or 16 malas. Start with one mala for 40 days before scaling.",
  },
  {
    question: "What is the best time for japa?",
    answer:
      "Brahma muhurta — the 96 minutes before sunrise — is considered the most potent. The next best windows are sunrise, midday, and sunset (the three sandhyas). Pick the time you can hold daily; consistency beats timing.",
  },
  {
    question: "Can I do japa without a physical mala?",
    answer:
      "Yes. Mental count (manasa japa) is considered the highest form. A digital counter like this one is a perfect bridge — it removes the bookkeeping so your mind stays on the mantra. Once your count is stable, try without the device.",
  },
  {
    question: "Should I chant aloud or silently?",
    answer:
      "Three modes: vaikhari (aloud), upamshu (whispered, lips moving), and manasa (mental). Aloud is best when learning a new mantra; mental is highest in stillness. Many sadhanas alternate — first mala aloud to settle, the rest silent.",
  },
  {
    question: "Which mantra should a beginner start with?",
    answer:
      "Om, Om Namah Shivaya, or the Gayatri mantra — all are universally chantable without initiation. If you have a family deity (kuldevta) or a guru-given mantra, that takes precedence.",
  },
  {
    question: "Is this counter saved if I close the browser?",
    answer:
      "Yes. Your mantra choice, current count, daily streak, and lifetime totals are all saved privately in this browser using localStorage. Nothing is sent to a server. Clearing your browser data will reset it.",
  },
];

export default function JapaPage() {
  const { toast } = useToast();
  const [oracleInput, setOracleInput] = useState("");
  const [oracleResult, setOracleResult] = useState<OracleResponse | null>(null);
  const [copied, setCopied] = useState(false);

  // Inject the Devanagari display font once. Same approach as before — the
  // mantra display text uses Tiro Devanagari Sanskrit and that family is not
  // bundled in the global CSS.
  useEffect(() => {
    window.scrollTo(0, 0);
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  const oracleMutation = useMutation<OracleResponse, Error, string>({
    mutationFn: async (input: string) => {
      const res = await fetch("/api/japa/mantra-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || "Could not interpret that mantra.");
      return data as OracleResponse;
    },
    onSuccess: (data) => {
      setOracleResult(data);
      haptic([12, 40, 18]);
    },
    onError: (err) => {
      haptic([40, 30, 40]);
      toast({
        title: "Oracle paused",
        description: err.message || "Try a deity name like 'Shiva' or an intention like 'peace of mind'.",
        variant: "destructive",
      });
    },
  });

  const onOracleSubmit = useCallback((value?: string) => {
    const q = (value ?? oracleInput).trim();
    if (q.length < 2) return;
    haptic(10);
    setOracleInput(q);
    oracleMutation.mutate(q);
  }, [oracleInput, oracleMutation]);

  const popularMantras = useMemo<LibraryMantra[]>(
    () =>
      POPULAR_MANTRA_IDS
        .map((id) => MANTRA_LIBRARY.find((m) => m.id === id))
        .filter((m): m is LibraryMantra => Boolean(m)),
    [],
  );

  const showMantraDetail = useCallback((m: LibraryMantra) => {
    haptic(10);
    setOracleResult({
      label: m.label,
      devanagari: m.devanagari,
      transliteration: m.transliteration,
      deity: m.deity,
      meaning: m.meaning,
      recommendedCount: m.recommendedCount,
      color: m.color,
    });
    // Smooth-scroll to the result card so the small chip tap reveals the
    // expanded card immediately below the chip strip.
    requestAnimationFrame(() => {
      document.getElementById("japa-oracle-result")?.scrollIntoView({
        behavior: "smooth", block: "center",
      });
    });
  }, []);

  const copyMantra = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      haptic([12, 40, 18]);
      setTimeout(() => setCopied(false), 1400);
    } catch {
      haptic([40, 30, 40]);
    }
  }, []);

  // ---- JSON-LD ----
  // BreadcrumbList + HowTo + FAQPage. The HowTo is built inline (the helper
  // file doesn't ship one) but conforms to schema.org/HowTo exactly.
  const howToSchema: Schema = useMemo(() => ({
    id: "howto-japa",
    payload: {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: "How to do Mantra Japa",
      description:
        "A step-by-step guide to traditional Vedic mantra japa using a mala — posture, mala handling, intention, and bell etiquette.",
      totalTime: "PT12M",
      tool: [{ "@type": "HowToTool", name: "108-bead mala (rudraksha, tulsi, or sphatik)" }],
      step: HOW_TO_STEPS.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.title,
        text: s.body,
      })),
    },
  }), []);
  const faqSchema = useMemo(() => faqPage(FAQS, "japa-faq"), []);
  const breadcrumb = useMemo(() => breadcrumbList([
    { name: "Home", url: "/" },
    { name: "Japa Sadhana", url: "/japa" },
  ]), []);

  return (
    <div
      className="min-h-screen bg-[#3D0A12] text-[#FBF7EE] relative overflow-x-hidden selection:bg-[#5B7FB8] selection:text-white"
      data-testid="page-japa"
    >
      <PageSeo
        title="Mantra Japa Counter — Free 108 Mala Counter Online | Vedic Tatva"
        description="Free online japa mala counter (108 / 54 / 27 beads) with bell, vibration, daily streaks, and 30+ Vedic mantras — Mahamrityunjaya, Gayatri, Om Namah Shivaya, Hare Krishna and more. AI mantra oracle. Saved privately on your device."
        keywords="japa counter, mala counter, online japa, 108 mala counter, mantra japa, Vedic mantra, Mahamrityunjaya mantra, Gayatri mantra, Om Namah Shivaya, japa mala app, free mantra counter, sadhana tracker"
        canonical="/japa"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[breadcrumb, howToSchema, faqSchema]}
      />

      {/* Aurora wash — desktop only, small mobile keeps it crisp + fast LCP */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden sm:block" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#5B7FB8]/[0.08] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 sm:gap-10 pt-2 sm:pt-6 pb-12">

        {/* Zone 1 — The counter is the FACE of the page.
            On mobile the orb must be the first thing the user sees, so we
            ship the page with no header above the counter. The wrapper
            chrome is also minimised on mobile (no shadow card / no
            outer rounded border) so the orb sits flush at the top of
            the viewport. The full SEO H1 + intro paragraph live as a
            section heading directly under the counter — still indexable
            by Google, but visually demoted below the interactive orb. */}
        <section className="px-2 sm:px-5 scroll-mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="relative sm:rounded-3xl sm:overflow-hidden sm:shadow-[0_0_70px_rgba(212,175,55,0.22)] sm:border sm:border-[#D4AF37]/35">
              <div
                className="relative bg-[#FBF7EE] rounded-2xl sm:rounded-none overflow-hidden"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                <div className="px-2 sm:px-6 py-3 sm:py-8 max-w-3xl mx-auto space-y-3 text-[#2c2c2c]">
                  <JapCounter
                    ownerKey="public"
                    title="Begin Your Sādhanā"
                    subtitle="Tap the orb each time you complete one mantra. Lock the screen to avoid stray taps."
                  />
                  {/* Sadhana stats — restored from previous page. Collapsed
                      by default so the counter stays the visual anchor; the
                      stats live one tap away inside a tight disclosure. */}
                  <details
                    className="group rounded-xl border border-[#6D2B35]/15 bg-white/70 overflow-hidden"
                    data-testid="disclosure-sadhana-stats"
                  >
                    <summary
                      onClick={() => haptic(10)}
                      className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 sm:px-5 py-3 select-none hover-elevate active-elevate-2 outline-none focus-visible:ring-2 focus-visible:ring-[#6D2B35]/40"
                      data-testid="button-toggle-sadhana-stats"
                    >
                      <span className="flex items-center gap-2 text-[#6D2B35]">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span className="text-[12.5px] font-semibold tracking-wide">Your Sadhana Stats</span>
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#6D2B35]/60 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="px-3 sm:px-5 pb-4 pt-2 border-t border-[#6D2B35]/10">
                      <SpiritualShowoffCards ownerKey="public" />
                    </div>
                  </details>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Page heading — sits directly under the orb so the counter is
            the first visual on page open while the H1 + intro stay on the
            page for SEO and screen-reader landmarks. */}
        <header className="px-4 sm:px-5 text-center">
          <div className="max-w-xl mx-auto">
            <p className="text-[10px] sm:text-[11px] tracking-[0.28em] uppercase text-[#D4AF37]/80 mb-2">
              Mantra · Sadhana · Streak
            </p>
            <h1
              className="text-[20px] leading-tight sm:text-3xl font-bold tracking-tight text-[#FBF7EE] mb-2"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="text-japa-headline"
            >
              Mantra Japa Counter
            </h1>
            <p className="text-[12.5px] sm:text-sm text-[#FBF7EE]/70 leading-relaxed">
              Pick a sacred mantra and tap the orb for each repetition.
              Bell + vibration on every full mala. Streak saved privately on this device.
            </p>
          </div>
        </header>

        {/* Zone 3 — Popular mantras (horizontal pill scroll, miniature) */}
        <section className="px-0 sm:px-5" aria-labelledby="japa-popular-h2">
          <div className="max-w-3xl mx-auto">
            <div className="px-4 sm:px-0 flex items-end justify-between mb-2.5">
              <h2
                id="japa-popular-h2"
                className="text-[15px] sm:text-lg font-semibold text-[#FBF7EE]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Popular Mantras
              </h2>
              <span className="text-[10px] uppercase tracking-[0.2em] text-[#FBF7EE]/40">Tap to preview</span>
            </div>
            <div
              className="flex gap-2 overflow-x-auto px-4 sm:px-0 pb-2 -mx-0 snap-x snap-mandatory scrollbar-thin"
              data-testid="strip-popular-mantras"
            >
              {popularMantras.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => showMantraDetail(m)}
                  className="snap-start flex-shrink-0 group min-w-[150px] sm:min-w-[170px] text-left rounded-xl bg-[#1A0407]/70 hover:bg-[#1A0407]/90 active:bg-[#1A0407] border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 transition-colors px-3 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                  data-testid={`chip-mantra-${m.id}`}
                  aria-label={`Preview ${m.label}`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <Flame className="w-3 h-3 text-[#D4AF37]/80" />
                    <span className="text-[10px] uppercase tracking-[0.16em] text-[#D4AF37]/75 truncate">
                      {m.deity}
                    </span>
                  </div>
                  <div className="text-[12.5px] font-semibold text-[#FBF7EE] leading-tight truncate">
                    {m.label}
                  </div>
                  <div
                    className="mt-1 text-[12px] text-[#FBF7EE]/65 truncate"
                    style={{ fontFamily: "'Tiro Devanagari Sanskrit', serif" }}
                  >
                    {m.devanagari}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Zone 4 — Mantra Oracle (real, working) */}
        <section className="px-4 sm:px-5" aria-labelledby="japa-oracle-h2">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-2 text-[#5B7FB8]">
              <Sparkles className="w-4 h-4" />
              <h2
                id="japa-oracle-h2"
                className="text-[15px] sm:text-lg font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Mantra Oracle
              </h2>
            </div>
            <p
              id="japa-oracle-help"
              className="text-center text-[11.5px] sm:text-xs text-[#FBF7EE]/55 mb-3 px-2"
            >
              Tell the Oracle a deity, a known mantra, or what you seek — it returns the canonical mantra with meaning + count.
            </p>

            <form
              onSubmit={(e) => { e.preventDefault(); onOracleSubmit(); }}
              className="relative"
            >
              <label htmlFor="japa-oracle-input" className="sr-only">
                Ask the Mantra Oracle for a deity, mantra, or intention
              </label>
              <input
                id="japa-oracle-input"
                type="text"
                value={oracleInput}
                onChange={(e) => setOracleInput(e.target.value)}
                placeholder="e.g. Shiva, abundance, Mahamrityunjaya"
                maxLength={200}
                aria-describedby="japa-oracle-help"
                className="w-full bg-[#1A0407]/80 border border-[#5B7FB8]/30 rounded-2xl py-3 pl-4 pr-28 text-[#FBF7EE] placeholder:text-[#FBF7EE]/30 outline-none focus-visible:border-[#5B7FB8] focus-visible:shadow-[0_0_20px_rgba(91,127,184,0.18)] transition-colors backdrop-blur-md text-sm"
                data-testid="input-oracle"
              />
              <button
                type="submit"
                disabled={oracleMutation.isPending || oracleInput.trim().length < 2}
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#5B7FB8]/25 hover:bg-[#5B7FB8]/40 active:bg-[#5B7FB8]/55 text-[#FBF7EE] px-3.5 rounded-xl font-medium transition-colors flex items-center gap-1.5 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#5B7FB8] disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="button-oracle-suggest"
              >
                {oracleMutation.isPending ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Asking</>
                ) : (
                  <>Suggest <Zap className="w-3.5 h-3.5" /></>
                )}
              </button>
            </form>

            {/* Quick-prompt chips (fully tappable, haptic on touch) */}
            <div className="flex flex-wrap gap-1.5 justify-center mt-3">
              {ORACLE_PROMPTS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => onOracleSubmit(p)}
                  className="px-2.5 py-1 rounded-full text-[10.5px] sm:text-[11px] bg-[#5B7FB8]/10 hover:bg-[#5B7FB8]/20 active:bg-[#5B7FB8]/30 border border-[#5B7FB8]/25 text-[#FBF7EE]/75 transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#5B7FB8]"
                  data-testid={`chip-oracle-prompt-${p.replace(/\s+/g, "-")}`}
                >
                  {p}
                </button>
              ))}
            </div>

            {/* Result card */}
            {oracleResult && (
              <div
                id="japa-oracle-result"
                className="mt-5 bg-gradient-to-br from-[#1A0407]/85 to-[#2A0D14]/85 border border-[#5B7FB8]/35 p-4 sm:p-5 rounded-2xl backdrop-blur-md"
                data-testid="card-oracle-result"
              >
                <div className="flex justify-between items-start mb-3 gap-3 flex-wrap">
                  <div className="min-w-0">
                    <h3
                      className="text-lg sm:text-xl font-bold text-[#FBF7EE] mb-0.5 truncate"
                      style={{ fontFamily: "'Playfair Display', serif" }}
                      data-testid="text-oracle-label"
                    >
                      {oracleResult.label}
                    </h3>
                    <p className="text-[#5B7FB8] text-[11.5px] sm:text-xs">
                      {oracleResult.deity}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[#D4AF37] font-bold text-sm sm:text-base" data-testid="text-oracle-count">
                      {oracleResult.recommendedCount}{" "}
                      <span className="text-[10px] font-normal text-[#D4AF37]/70">reps</span>
                    </div>
                    <div className="text-[#FBF7EE]/50 text-[10.5px]">
                      ~ {Math.max(2, Math.round(oracleResult.recommendedCount * 0.08))} mins
                    </div>
                  </div>
                </div>

                <div className="border-t border-[#5B7FB8]/20 pt-3">
                  <p
                    className="text-base sm:text-lg text-[#FBF7EE] mb-1.5 leading-relaxed"
                    style={{ fontFamily: "'Tiro Devanagari Sanskrit', serif" }}
                    data-testid="text-oracle-devanagari"
                  >
                    {oracleResult.devanagari}
                  </p>
                  {oracleResult.transliteration && (
                    <p className="text-[11.5px] sm:text-xs text-[#FBF7EE]/55 italic mb-2">
                      {oracleResult.transliteration}
                    </p>
                  )}
                  <p className="text-[#FBF7EE]/75 text-[12.5px] sm:text-sm leading-relaxed">
                    {oracleResult.meaning}
                  </p>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => copyMantra(oracleResult.devanagari)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37]/15 hover:bg-[#D4AF37]/25 active:bg-[#D4AF37]/35 border border-[#D4AF37]/40 text-[#D4AF37] text-[11.5px] sm:text-xs font-semibold transition-colors outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
                      data-testid="button-copy-mantra"
                    >
                      {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy mantra</>}
                    </button>
                    <span className="text-[10.5px] text-[#FBF7EE]/45">
                      Pick this in the counter's mantra dropdown above, then tap the orb.
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Zone 5 — How to do Japa (compact accordion, fully indexable) */}
        <section className="px-4 sm:px-5" aria-labelledby="japa-howto-h2">
          <div className="max-w-2xl mx-auto">
            <h2
              id="japa-howto-h2"
              className="text-[15px] sm:text-lg font-semibold text-[#FBF7EE] mb-3 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              How to Do Japa — 5 Steps
            </h2>
            <ol className="space-y-1.5">
              {HOW_TO_STEPS.map((s, i) => (
                <li key={s.title}>
                  <details
                    className="group rounded-xl border border-[#D4AF37]/18 bg-[#1A0407]/55 hover:bg-[#1A0407]/75 transition-colors overflow-hidden"
                    data-testid={`disclosure-howto-${i + 1}`}
                  >
                    <summary
                      onClick={() => haptic(10)}
                      className="list-none cursor-pointer flex items-center gap-2.5 px-3.5 py-2.5 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#D4AF37]/20 text-[#D4AF37] text-[10.5px] font-bold flex items-center justify-center shrink-0">
                        {i + 1}
                      </span>
                      <span className="flex-1 min-w-0 text-[12.5px] sm:text-sm font-semibold text-[#FBF7EE] truncate">
                        {s.title}
                      </span>
                      <ChevronDown className="w-3.5 h-3.5 text-[#FBF7EE]/45 shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <p className="px-3.5 pt-1.5 pb-3 text-[12px] sm:text-[12.5px] leading-relaxed text-[#FBF7EE]/70">
                      {s.body}
                    </p>
                  </details>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* Zone 6 — FAQ accordion (drives FAQPage rich result) */}
        <section className="px-4 sm:px-5" aria-labelledby="japa-faq-h2">
          <div className="max-w-2xl mx-auto">
            <h2
              id="japa-faq-h2"
              className="text-[15px] sm:text-lg font-semibold text-[#FBF7EE] mb-3 text-center"
              style={{ fontFamily: "'Playfair Display', serif" }}
            >
              Japa — Frequently Asked
            </h2>
            <div className="space-y-1.5">
              {FAQS.map((f, i) => (
                <details
                  key={f.question}
                  className="group rounded-xl border border-[#D4AF37]/18 bg-[#1A0407]/55 hover:bg-[#1A0407]/75 transition-colors overflow-hidden"
                  data-testid={`disclosure-faq-${i + 1}`}
                >
                  <summary
                    onClick={() => haptic(10)}
                    className="list-none cursor-pointer flex items-center gap-2.5 px-3.5 py-2.5 select-none outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/50"
                  >
                    <span className="flex-1 min-w-0 text-[12.5px] sm:text-sm font-semibold text-[#FBF7EE]">
                      {f.question}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#FBF7EE]/45 shrink-0 transition-transform group-open:rotate-180" />
                  </summary>
                  <p className="px-3.5 pt-1.5 pb-3 text-[12px] sm:text-[12.5px] leading-relaxed text-[#FBF7EE]/70">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Zone 7 — Slim related-products line (text only, no card sprawl) */}
        <section className="px-4 sm:px-5">
          <div className="max-w-2xl mx-auto text-center">
            <p className="text-[11.5px] sm:text-xs text-[#FBF7EE]/50 leading-relaxed">
              Want a real mala?{" "}
              <a
                href="/spiritual-essentials/wearables"
                onClick={() => haptic(10)}
                className="text-[#D4AF37]/85 hover:text-[#D4AF37] underline underline-offset-2 transition-colors"
                data-testid="link-shop-malas"
              >
                Shop authentic Rudraksha & Tulsi malas
              </a>{" "}
              · Need a guided puja?{" "}
              <a
                href="/pandits"
                onClick={() => haptic(10)}
                className="text-[#D4AF37]/85 hover:text-[#D4AF37] underline underline-offset-2 transition-colors"
                data-testid="link-book-pandit"
              >
                Book a verified pandit
              </a>
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
