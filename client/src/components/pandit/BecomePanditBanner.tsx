// =====================================================================
// CTA banner inviting Pandits to register on Vedic Tatva.
// Used across /pandits, /pandits/:city, /pandits/:city/:puja so any
// visiting Pandit (or someone who knows one) lands on /become-pandit.
//
// Two variants:
//   • <BecomePanditStrip />  — slim top-of-page acknowledgement strip
//   • <BecomePanditBanner /> — full mid/bottom-of-page CTA card
// =====================================================================
import { Link } from "wouter";
import { ArrowRight, BadgeCheck, IndianRupee, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function BecomePanditStrip({ className = "" }: { className?: string }) {
  return (
    <div
      className={`bg-[#6D2B35] text-[#FBE9B7] ${className}`}
      data-testid="strip-become-pandit"
    >
      <div className="container max-w-7xl mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <p className="text-xs sm:text-sm flex items-center gap-2 leading-snug">
          <BadgeCheck className="h-4 w-4 text-[#D4AF37] shrink-0" />
          <span>
            Are you a Vedic Pandit? Earn ₹50,000+/mo with verified bookings on Vedic Tatva.
          </span>
        </p>
        <Link href="/become-pandit">
          <Button
            size="sm"
            className="bg-[#D4AF37] text-[#3a1518] hover:bg-[#c49d2c] h-8 rounded-md text-[12px] font-semibold"
            data-testid="link-strip-become-pandit"
          >
            Register as Pandit <ArrowRight className="h-3.5 w-3.5 ml-1" />
          </Button>
        </Link>
      </div>
    </div>
  );
}

export function BecomePanditBanner({ className = "" }: { className?: string }) {
  return (
    <section className={`container max-w-7xl mx-auto px-4 py-10 ${className}`}>
      <div
        className="rounded-lg border border-[#D4AF37]/40 bg-gradient-to-br from-[#6D2B35] via-[#5a1f29] to-[#3a1518] text-[#FBE9B7] overflow-hidden relative"
        data-testid="banner-become-pandit"
      >
        <div className="absolute inset-0 opacity-[0.04] pointer-events-none" aria-hidden>
          <div className="absolute -top-10 -right-10 h-64 w-64 rounded-full bg-[#D4AF37] blur-3xl" />
          <div className="absolute -bottom-16 -left-16 h-72 w-72 rounded-full bg-[#D4AF37] blur-3xl" />
        </div>
        <div className="relative grid md:grid-cols-[1.5fr_1fr] gap-6 p-6 sm:p-8 items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold tracking-wider uppercase text-[#D4AF37] mb-3">
              <Sparkles className="h-3.5 w-3.5" /> For Pandits
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif font-semibold leading-tight">
              Yat karoshi tat kuru — turn your sadhana into a livelihood
            </h2>
            <p className="text-sm sm:text-base text-[#FBE9B7]/85 mt-3 leading-relaxed max-w-2xl">
              Join 1,200+ verified Vedic Pandits on India's premium spiritual marketplace.
              Free verification, instant payouts after each puja, transparent booking
              calendar — no commission until your 5th booking.
            </p>
            <ul className="grid sm:grid-cols-2 gap-2 mt-5 text-sm">
              {[
                "Free profile setup + verification",
                "Average ₹50,000+/month for active Pandits",
                "Bookings in your city & expertise",
                "Instant UPI payout after each puja",
              ].map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <BadgeCheck className="h-4 w-4 text-[#D4AF37] shrink-0 mt-0.5" />
                  <span className="text-[#FBE9B7]/90">{b}</span>
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 mt-6">
              <Link href="/become-pandit">
                <Button
                  className="bg-[#D4AF37] text-[#3a1518] hover:bg-[#c49d2c] font-semibold rounded-md"
                  data-testid="button-banner-register"
                >
                  Start Free Registration <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
              <Link href="/become-pandit#how-it-works">
                <Button
                  variant="outline"
                  className="border-[#D4AF37]/50 bg-transparent text-[#FBE9B7] hover:bg-[#FBE9B7]/10 rounded-md"
                  data-testid="button-banner-learn-more"
                >
                  How it works
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden md:block">
            <div className="rounded-md border border-[#D4AF37]/30 bg-black/15 p-5 backdrop-blur-sm">
              <div className="flex items-center gap-2 text-[#D4AF37] font-semibold text-sm">
                <IndianRupee className="h-4 w-4" /> Earnings calculator
              </div>
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#FBE9B7]/75">2 pujas / week</span>
                  <span className="font-semibold">₹20,000–₹35,000/mo</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#FBE9B7]/75">4 pujas / week</span>
                  <span className="font-semibold">₹45,000–₹70,000/mo</span>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[#FBE9B7]/75">6+ pujas / week</span>
                  <span className="font-semibold">₹75,000+/mo</span>
                </div>
              </div>
              <p className="text-[11px] text-[#FBE9B7]/60 mt-4 leading-relaxed">
                Based on average dakshina across Satyanarayan, Griha Pravesh,
                Rudrabhishek and wedding ceremonies in Tier-1/2 cities.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
