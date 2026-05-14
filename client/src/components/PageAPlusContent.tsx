import { useState } from "react";
import { motion } from "framer-motion";
import { ChevronDown, CheckCircle2, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";

export type Benefit = { icon: LucideIcon; title: string; body: string };
export type Step = { title: string; body: string };
export type Faq = { q: string; a: string };
export type TrustBadge = { label: string; value: string };

export type PageAPlusContentProps = {
  eyebrow?: string;
  title: string;
  intro: string;
  benefits?: Benefit[];
  steps?: Step[];
  trustBadges?: TrustBadge[];
  faqs?: Faq[];
  keywordsBlurb?: string;
};

export default function PageAPlusContent({
  eyebrow = "Why Vedic Tatva",
  title,
  intro,
  benefits = [],
  steps = [],
  trustBadges = [],
  faqs = [],
  keywordsBlurb,
}: PageAPlusContentProps) {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <section className="bg-[#FBF7EE]/40 py-12 sm:py-16 mt-12 border-y border-[#E8DDC4]" data-testid="section-aplus-content">
      <div className="max-w-5xl mx-auto px-4">
        {/* Heading */}
        <div className="text-center mb-10 sm:mb-12">
          {eyebrow && (
            <span className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#D4AF37] font-semibold mb-3">
              <Sparkles className="w-3 h-3" /> {eyebrow}
            </span>
          )}
          <h2 className="font-serif text-2xl sm:text-3xl md:text-4xl text-[#6D2B35] font-bold leading-tight mb-3" data-testid="text-aplus-title">
            {title}
          </h2>
          <p className="text-[#5a4a3a]/75 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">{intro}</p>
        </div>

        {/* Trust badges */}
        {trustBadges.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10 max-w-3xl mx-auto">
            {trustBadges.map((b, i) => (
              <div
                key={i}
                className="bg-white rounded-xl border border-[#E8DDC4] px-3 py-3 text-center hover:border-[#D4AF37]/50 transition-colors"
                data-testid={`trust-badge-${i}`}
              >
                <div className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-bold">{b.value}</div>
                <div className="text-[10.5px] sm:text-[11px] uppercase tracking-wider text-[#5a4a3a]/60 mt-0.5">{b.label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Benefits */}
        {benefits.length > 0 && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-12">
            {benefits.map((b, i) => {
              const Icon = b.icon;
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white rounded-xl border border-[#E8DDC4] p-5 hover:border-[#D4AF37] hover:shadow-[0_4px_20px_-8px_rgba(109,43,53,0.18)] transition-all"
                  data-testid={`benefit-${i}`}
                >
                  <div className="w-11 h-11 rounded-lg bg-[#FBF7EE] border border-[#E8DDC4] flex items-center justify-center mb-3">
                    <Icon className="w-[20px] h-[20px] text-[#6D2B35]" strokeWidth={1.6} />
                  </div>
                  <h3 className="font-serif text-base sm:text-lg text-[#6D2B35] font-bold mb-1.5 leading-snug">{b.title}</h3>
                  <p className="text-[13px] text-[#5a4a3a]/75 leading-relaxed">{b.body}</p>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* How it works */}
        {steps.length > 0 && (
          <div className="mb-12">
            <h3 className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-bold text-center mb-7">How It Works</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {steps.map((s, i) => (
                <div
                  key={i}
                  className="relative bg-white rounded-xl border border-[#E8DDC4] p-4 sm:p-5"
                  data-testid={`step-${i}`}
                >
                  <div className="absolute -top-2.5 left-4 w-7 h-7 rounded-full bg-[#6D2B35] text-white text-xs font-bold flex items-center justify-center">
                    {i + 1}
                  </div>
                  <h4 className="font-serif text-[15px] text-[#6D2B35] font-bold mt-2 mb-1.5">{s.title}</h4>
                  <p className="text-[12.5px] text-[#5a4a3a]/75 leading-relaxed">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQs */}
        {faqs.length > 0 && (
          <div className="max-w-3xl mx-auto">
            <h3 className="font-serif text-xl sm:text-2xl text-[#6D2B35] font-bold text-center mb-6">Frequently Asked Questions</h3>
            <div className="space-y-2.5">
              {faqs.map((f, i) => {
                const isOpen = openFaq === i;
                return (
                  <div
                    key={i}
                    className="bg-white rounded-xl border border-[#E8DDC4] overflow-hidden"
                    data-testid={`faq-${i}`}
                  >
                    <button
                      onClick={() => setOpenFaq(isOpen ? null : i)}
                      className="w-full flex items-center justify-between gap-3 p-4 sm:p-5 text-left hover-elevate"
                      data-testid={`faq-toggle-${i}`}
                      aria-expanded={isOpen}
                      aria-controls={`faq-answer-${i}`}
                    >
                      <span className="font-serif text-[14.5px] sm:text-[15px] text-[#6D2B35] font-semibold leading-snug pr-2">
                        {f.q}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 shrink-0 text-[#6D2B35] transition-transform ${isOpen ? "rotate-180" : ""}`}
                      />
                    </button>
                    <div
                      id={`faq-answer-${i}`}
                      role="region"
                      className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-[600px]" : "max-h-0"}`}
                    >
                      <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-[13.5px] text-[#5a4a3a]/85 leading-relaxed border-t border-[#E8DDC4]/70 pt-3">
                        {f.a}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SEO content blurb (visible body text for keyword density) */}
        {keywordsBlurb && (
          <div className="max-w-3xl mx-auto mt-10 text-[12.5px] sm:text-[13px] text-[#5a4a3a]/65 leading-relaxed text-center" data-testid="text-keywords-blurb">
            {keywordsBlurb}
          </div>
        )}
      </div>
    </section>
  );
}

export { CheckCircle2, ShieldCheck };
