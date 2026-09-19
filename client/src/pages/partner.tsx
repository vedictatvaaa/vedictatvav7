import { ArrowUpRight, BookOpen, Flower2, ShieldCheck } from "lucide-react";
import { Link } from "wouter";
import PageSeo from "@/components/PageSeo";
import { activePartnerProviders } from "@/lib/partner-providers";

export default function PartnerPage() {
  const provider = activePartnerProviders[0];

  if (!provider) return null;

  return (
    <div className="relative min-h-[calc(100dvh-10rem)] overflow-hidden bg-[#f8f1e6] text-[#351e20]" data-testid="partner-entry-page">
      <PageSeo
        title="Join Vedic Tatva as a Partner"
        description="Share your knowledge and spiritual services with devotees through Vedic Tatva."
        ogType="website"
      />

      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        <div className="absolute -right-24 -top-24 h-72 w-72 rounded-full border border-[#b9924b]/20" />
        <div className="absolute -right-12 -top-12 h-48 w-48 rounded-full border border-[#b9924b]/15" />
        <div className="absolute bottom-[-11rem] left-[-8rem] h-96 w-96 rounded-full bg-[#ead8bd]/45 blur-3xl" />
        <div className="absolute inset-x-0 top-0 h-1 bg-[#7b2937]" />
      </div>

      <div className="relative mx-auto flex min-h-[calc(100dvh-10rem)] w-full max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        <div className="flex flex-1 items-center justify-center py-12 sm:py-16">
          <section className="grid w-full max-w-5xl items-center gap-12 lg:grid-cols-[0.82fr_1.18fr] lg:gap-20">
            <div className="relative text-center lg:text-left">
              <div className="mx-auto mb-7 flex h-24 w-24 items-center justify-center rounded-full border border-[#b9924b]/55 bg-[#f2e2c4] text-[#7b2937] shadow-[0_12px_32px_rgba(94,49,39,0.10)] lg:mx-0">
                <div className="grid h-16 w-16 place-items-center rounded-full border border-[#b9924b]/45">
                  <Flower2 className="h-8 w-8" strokeWidth={1.15} />
                </div>
              </div>
              <p className="mb-4 text-[10px] font-extrabold uppercase tracking-[0.34em] text-[#a17a2d]">
                A trusted spiritual institution
              </p>
              <h1 className="max-w-xl font-serif text-[clamp(2.7rem,7vw,5.3rem)] font-semibold leading-[0.98] tracking-[-0.055em] text-[#632532]">
                Join Vedic Tatva
                <span className="mt-2 block text-[#9b762c]">as a Partner</span>
              </h1>
              <p className="mx-auto mt-6 max-w-md text-[15px] leading-7 text-[#765e50] lg:mx-0">
                Share your knowledge and spiritual services with devotees.
                Bring your practice to a platform built on reverence, trust
                and the enduring wisdom of the Vedic tradition.
              </p>
            </div>

            <div className="relative">
              <div className="absolute -inset-3 rounded-[2rem] border border-[#b9924b]/15" aria-hidden="true" />
              <div className="relative overflow-hidden rounded-[1.5rem] border border-[#b9924b]/40 bg-[#fffaf1] shadow-[0_24px_70px_rgba(87,46,35,0.13)]">
                <div className="h-1 bg-gradient-to-r from-[#8d5e1e] via-[#e3c36e] to-[#8d5e1e]" />
                <div className="p-7 sm:p-10">
                  <div className="mb-9 flex items-start justify-between gap-5">
                    <div>
                      <p className="mb-2 text-[10px] font-extrabold uppercase tracking-[0.25em] text-[#a17a2d]">
                        Partner portal
                      </p>
                      <h2 className="font-serif text-3xl font-semibold tracking-[-0.035em] text-[#632532] sm:text-4xl">
                        {provider.label}
                      </h2>
                    </div>
                    <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl border border-[#d1b36a]/50 bg-[#f4e5c8] text-[#7b2937]">
                      <BookOpen className="h-5 w-5" strokeWidth={1.55} />
                    </div>
                  </div>

                  <p className="max-w-md text-sm leading-6 text-[#765e50]">
                    {provider.description} Your learning deserves a dignified
                    home and a thoughtful digital presence.
                  </p>

                  <div className="my-8 h-px bg-[#b9924b]/25" />

                  <div className="mb-8 flex items-center gap-3 text-[11px] leading-5 text-[#80685a]">
                    <ShieldCheck className="h-4 w-4 shrink-0 text-[#8d6823]" strokeWidth={1.7} />
                    <span>For verified spiritual practitioners and Panditjis</span>
                  </div>

                  <Link
                    href={provider.destination}
                    className="group inline-flex min-h-14 w-full items-center justify-between rounded-xl bg-[#742b39] px-5 text-sm font-bold text-[#fff6e5] shadow-[0_12px_24px_rgba(116,43,57,0.18)] transition-all hover:bg-[#5f202d] hover:shadow-[0_15px_28px_rgba(116,43,57,0.24)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf1]"
                    data-testid="link-pandit-login"
                  >
                    <span>Continue to Panditji Portal</span>
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-[#edcf84]/45 transition-transform group-hover:translate-x-0.5">
                      <ArrowUpRight className="h-4 w-4" strokeWidth={1.8} />
                    </span>
                  </Link>
                </div>
              </div>
            </div>
          </section>
        </div>

        <footer className="flex flex-col items-center justify-between gap-3 border-t border-[#b9924b]/25 pt-5 text-center sm:flex-row sm:text-left">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#9a806b]">
            Tradition · trust · service
          </p>
          <Link
            href="/"
            className="text-xs font-semibold text-[#742b39] underline decoration-[#b9924b]/60 underline-offset-4 transition-colors hover:text-[#a17a2d] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b9924b]"
            data-testid="link-back-home"
          >
            Back to Vedic Tatva
          </Link>
        </footer>
      </div>
    </div>
  );
}