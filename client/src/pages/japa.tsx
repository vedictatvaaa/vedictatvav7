import { useEffect, useState } from "react";
import JapCounter from "@/components/JapCounter";
import PageSeo from "@/components/PageSeo";
import SpiritualShowoffCards from "@/components/SpiritualShowoffCards";
import { Sparkles, Users, Zap } from "lucide-react";

export default function JapaPage() {
  const [mounted, setMounted] = useState(false);
  const [oracleInput, setOracleInput] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
    setMounted(true);
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => {
      try {
        document.head.removeChild(link);
      } catch {}
    };
  }, []);

  return (
    <div
      className="min-h-screen bg-[#3D0A12] text-[#FBF7EE] relative overflow-x-hidden selection:bg-[#5B7FB8] selection:text-white"
      data-testid="page-japa"
    >
      <PageSeo
        title="Mantra Japa Sādhanā — Daily Mantra Practice · Vedic Tatva"
        description="A free, distraction-free Japa Mala counter. Pick from sacred mantras, set your mala (3/11/21/51/108), tap to count, and watch your daily streak grow. Bell + vibration on each completed mala. Saved privately on your device."
      />

      {/* Aurora wash — light, only on larger screens to keep mobile crisp */}
      {mounted && (
        <div className="fixed inset-0 pointer-events-none z-0 hidden sm:block" aria-hidden="true">
          <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/[0.06] rounded-full blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#5B7FB8]/[0.08] rounded-full blur-[100px]" />
        </div>
      )}

      <div className="relative z-10 flex flex-col gap-10 sm:gap-14">

        {/* Zone 1 — Tight title block */}
        <header className="px-4 sm:px-5 pt-5 sm:pt-8 text-center">
          <div className="max-w-xl mx-auto">
            <h1
              className="text-[22px] leading-tight sm:text-4xl font-bold tracking-tight text-[#FBF7EE] mb-2 sm:mb-3"
              style={{ fontFamily: "'Playfair Display', serif" }}
              data-testid="text-japa-headline"
            >
              Mantra Japa Sādhanā
            </h1>
            <p className="text-[12.5px] sm:text-base text-[#FBF7EE]/75 leading-relaxed">
              Pick a sacred mantra and tap the orb for each repetition.
              <br className="hidden sm:inline" />
              A bell rings on every full mala — your streak stays saved on this device.
            </p>
          </div>
        </header>

        {/* Zone 2 — The counter is the main scene */}
        <section className="px-4 sm:px-5 scroll-mt-16">
          <div className="max-w-3xl mx-auto">
            <div className="relative rounded-2xl sm:rounded-3xl overflow-hidden shadow-[0_0_70px_rgba(212,175,55,0.22)] border border-[#D4AF37]/35">
              <div
                className="relative bg-[#FBF7EE]"
                style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
              >
                <div className="px-3 sm:px-6 py-6 sm:py-10 max-w-3xl mx-auto space-y-6 text-[#2c2c2c]">
                  <JapCounter
                    ownerKey="public"
                    title="Begin Your Sādhanā"
                    subtitle="Tap the orb each time you complete one mantra. Lock the screen to avoid stray taps."
                  />
                  <details
                    className="group rounded-xl border border-[#6D2B35]/15 bg-white/70 overflow-hidden"
                    data-testid="disclosure-sadhana-stats"
                  >
                    <summary
                      className="list-none cursor-pointer flex items-center justify-between gap-3 px-4 sm:px-5 py-3.5 select-none hover-elevate active-elevate-2 outline-none focus-visible:ring-2 focus-visible:ring-[#6D2B35]/40"
                      data-testid="button-toggle-sadhana-stats"
                    >
                      <span className="flex items-center gap-2.5 text-[#6D2B35]">
                        <Sparkles className="w-4 h-4" />
                        <span className="text-sm font-semibold tracking-wide">Your Sadhana Stats</span>
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[#6D2B35]/70 group-open:hidden">
                        View
                      </span>
                      <span className="text-xs uppercase tracking-[0.18em] text-[#6D2B35]/70 hidden group-open:inline">
                        Hide
                      </span>
                    </summary>
                    <div className="px-3 sm:px-5 pb-5 pt-2 border-t border-[#6D2B35]/10">
                      <SpiritualShowoffCards ownerKey="public" />
                    </div>
                  </details>
                </div>
              </div>
            </div>
            <p
              className="text-center mt-5 text-sm sm:text-base text-[#D4AF37]/85 leading-snug px-2"
              style={{ fontFamily: "'Tiro Devanagari Sanskrit', serif" }}
              data-testid="text-japa-mantra"
            >
              ॐ त्र्यम्बकं यजामहे सुगन्धिं पुष्टिवर्धनम्
            </p>
          </div>
        </section>

        {/* Zone 3 — Divine Oracle (Preview) */}
        <section className="px-5">
          <div className="max-w-2xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-3 text-[#5B7FB8]">
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <h2
                className="text-lg sm:text-xl font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Divine Oracle
              </h2>
              <span className="ml-1 px-2 py-0.5 rounded-full text-[9px] sm:text-[10px] tracking-[0.2em] uppercase border border-[#5B7FB8]/40 text-[#5B7FB8]/85">
                Preview
              </span>
            </div>
            <p className="text-center text-xs sm:text-sm text-[#FBF7EE]/55 mb-6">
              Soon: tell the Oracle what you seek and it will recommend a mantra and mala.
            </p>

            <div className="relative">
              <input
                type="text"
                value={oracleInput}
                onChange={(e) => setOracleInput(e.target.value)}
                placeholder="What do you seek today?"
                className="w-full bg-[#1A0407]/80 border border-[#5B7FB8]/30 rounded-2xl py-4 pl-5 pr-32 text-[#FBF7EE] placeholder:text-[#FBF7EE]/30 outline-none focus-visible:border-[#5B7FB8] focus-visible:shadow-[0_0_20px_rgba(91,127,184,0.18)] transition-colors backdrop-blur-md text-sm"
                data-testid="input-oracle"
              />
              <button
                type="button"
                className="absolute right-1.5 top-1.5 bottom-1.5 bg-[#5B7FB8]/20 hover:bg-[#5B7FB8]/30 active:bg-[#5B7FB8]/40 text-[#5B7FB8] hover:text-[#FBF7EE] px-4 rounded-xl font-medium transition-colors flex items-center gap-1.5 text-xs sm:text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#5B7FB8] disabled:opacity-50"
                disabled
                data-testid="button-oracle-suggest"
                aria-label="Get mantra suggestion (coming soon)"
              >
                Suggest
                <Zap className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="mt-6 bg-gradient-to-br from-[#1A0407]/80 to-[#2A0D14]/80 border border-[#5B7FB8]/30 p-5 sm:p-6 rounded-2xl backdrop-blur-md">
              <div className="flex justify-between items-start mb-4 gap-3 flex-wrap">
                <div>
                  <h3
                    className="text-xl sm:text-2xl font-bold text-[#FBF7EE] mb-1"
                    style={{ fontFamily: "'Playfair Display', serif" }}
                  >
                    Kuber Mantra
                  </h3>
                  <p className="text-[#5B7FB8] text-xs sm:text-sm">For abundance and stability</p>
                </div>
                <div className="text-right">
                  <div className="text-[#D4AF37] font-bold text-base sm:text-lg">
                    108 <span className="text-xs font-normal text-[#D4AF37]/70">reps</span>
                  </div>
                  <div className="text-[#FBF7EE]/50 text-xs">~ 15 mins</div>
                </div>
              </div>

              <div className="border-t border-[#5B7FB8]/20 pt-4">
                <p
                  className="text-base sm:text-lg text-[#FBF7EE] mb-2 leading-relaxed"
                  style={{ fontFamily: "'Tiro Devanagari Sanskrit', serif" }}
                >
                  ॐ श्रीं ह्रीं क्लीं श्रीं क्लीं वित्तेश्वराय नमः
                </p>
                <p className="text-[#FBF7EE]/60 text-xs sm:text-sm italic">
                  "May the divine wealth flow to me, bringing peace and generosity."
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Zone 4 — Sangha Ribbon */}
        <footer className="px-5 pb-10">
          <div className="max-w-2xl mx-auto bg-[#1A0407]/70 backdrop-blur-xl border border-[#D4AF37]/15 rounded-2xl p-5 sm:p-6 text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full bg-[#D4AF37] border-2 border-[#1A0407] flex items-center justify-center text-[#1A0407] text-xs font-bold">P</div>
                <div className="w-8 h-8 rounded-full bg-[#5B7FB8] border-2 border-[#1A0407] flex items-center justify-center text-[#1A0407] text-xs font-bold">R</div>
                <div className="w-8 h-8 rounded-full bg-[#FBF7EE] border-2 border-[#1A0407] flex items-center justify-center text-[#1A0407] text-xs font-bold">K</div>
              </div>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-[#FBF7EE]/75">
                <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse motion-reduce:animate-none" />
                <span>
                  <span className="font-bold text-[#FBF7EE]">147 devotees</span> in our sangha today
                </span>
              </div>
            </div>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-[#D4AF37]/10 hover:bg-[#D4AF37]/20 active:bg-[#D4AF37]/30 border border-[#D4AF37]/40 text-[#D4AF37] hover:text-[#FBF7EE] transition-colors text-sm font-semibold outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              data-testid="button-join-group"
            >
              <Users className="w-4 h-4" />
              Join Live Group
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
