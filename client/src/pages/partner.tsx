import { ArrowLeft, ArrowRight, Flame, Flower2, MoonStar, type LucideIcon } from "lucide-react";
import { Link, useLocation } from "wouter";
import PageSeo from "@/components/PageSeo";
import { partnerProviders } from "@/lib/partner-providers";
import { useI18n } from "@/lib/i18n";

const roleIcons: Record<string, LucideIcon> = {
  pandit: Flame,
  astrologer: MoonStar,
};

function DevotionalMark() {
  return (
    <div className="relative grid h-14 w-14 place-items-center rounded-full border border-[#D4AF37]/35 bg-[#F1DFB5]/70 text-[#7F5A15] shadow-[0_10px_22px_rgba(127,90,21,.10)]">
      <span className="absolute inset-1.5 rounded-full border border-[#D4AF37]/45" />
      <Flower2 className="h-6 w-6" strokeWidth={1.25} aria-hidden="true" />
      <span className="absolute bottom-1 text-[7px] font-semibold tracking-[0.22em]" aria-hidden="true">ॐ</span>
    </div>
  );
}

export default function PartnerPage() {
  const [, setLocation] = useLocation();
  const { language } = useI18n();
  const hindi = language === "hi";

  const copy = hindi
    ? {
        eyebrow: "पार्टनर पोर्टल",
        title: "अपने डैशबोर्ड में साइन इन करें",
        intro: "अपनी भूमिका चुनें और अपने Vedic Tatva कार्यक्षेत्र में आगे बढ़ें।",
        back: "वापस",
        backAria: "पिछले पृष्ठ पर जाएं",
        panditTitle: "पंडितजी पोर्टल",
        panditDescription: "बुकिंग, कैलेंडर, कमाई और अपनी सेवाओं को संभालें।",
        panditAction: "साइन इन या आवेदन करें",
        astrologerTitle: "ज्योतिषी पोर्टल",
        astrologerDescription: "कंसल्टेशन, संदेश और कमाई अपने डैशबोर्ड से संभालें।",
        astrologerAction: "ज्योतिषी पोर्टल खोलें",
        newPartner: "पहली बार जुड़ रहे हैं?",
        apply: "पंडितजी के रूप में आवेदन करें",
        help: "सहायता चाहिए? हमसे संपर्क करें",
        privacy: "गोपनीयता",
        terms: "नियम",
      }
    : {
        eyebrow: "PARTNER PORTAL",
        title: "Sign in to your dashboard",
        intro: "Choose your role to continue to your Vedic Tatva workspace.",
        back: "Back",
        backAria: "Go back",
        panditTitle: "Panditji portal",
        panditDescription: "Manage bookings, calendar, earnings and your services.",
        panditAction: "Sign in or apply",
        astrologerTitle: "Astrologer portal",
        astrologerDescription: "Manage consultations, messages and earnings from your dashboard.",
        astrologerAction: "Open astrologer portal",
        newPartner: "New to Vedic Tatva?",
        apply: "Apply as a Panditji",
        help: "Need help? Contact us",
        privacy: "Privacy",
        terms: "Terms",
      };

  const roleContent = {
    pandit: {
      title: copy.panditTitle,
      description: copy.panditDescription,
      action: copy.panditAction,
    },
    astrologer: {
      title: copy.astrologerTitle,
      description: copy.astrologerDescription,
      action: copy.astrologerAction,
    },
  };

  const handleBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1) {
      window.history.back();
      return;
    }
    setLocation("/");
  };

  return (
    <main className="relative isolate min-h-full overflow-hidden bg-[#F7F9F5] text-[#5A4A3A]" data-testid="partner-entry-page">
      <PageSeo
        title={hindi ? "पार्टनर पोर्टल | Vedic Tatva" : "Partner Portal | Vedic Tatva"}
        description={copy.intro}
        ogType="website"
      />

      <div className="pointer-events-none absolute -left-24 top-40 h-64 w-64 rounded-full bg-[#DCE8D8]/60 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute -right-20 top-10 h-72 w-72 rounded-full bg-[#F1DFB5]/45 blur-3xl" aria-hidden="true" />
      <div className="pointer-events-none absolute right-[-5rem] top-28 h-64 w-64 rounded-full border border-[#D4AF37]/15" aria-hidden="true" />

      <div className="relative z-10 mx-auto flex min-h-full w-full max-w-[620px] flex-col px-4 pb-8 pt-3 sm:px-6 sm:pt-6">
        <button
          type="button"
          onClick={handleBack}
          className="group inline-flex min-h-10 w-fit items-center gap-2 rounded-full px-1 text-[12px] font-semibold text-[#6B5B52] transition-colors hover:text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 focus-visible:ring-offset-[#F7F9F5]"
          aria-label={copy.backAria}
          data-testid="button-partner-back"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" aria-hidden="true" />
          {copy.back}
        </button>

        <section className="mt-5 rounded-[1.75rem] border border-white/85 bg-white/60 p-5 text-center shadow-[0_18px_55px_rgba(77,40,36,.08)] backdrop-blur-xl sm:mt-8 sm:p-8" aria-labelledby="partner-page-heading">
          <div className="flex justify-center">
            <DevotionalMark />
          </div>
          <p className="mt-4 text-[9px] font-bold uppercase tracking-[0.24em] text-[#A67817]">{copy.eyebrow}</p>
          <h1 id="partner-page-heading" className="mx-auto mt-2 max-w-[440px] font-serif text-[clamp(2rem,9vw,3.1rem)] font-semibold leading-[1] tracking-[-0.05em] text-[#6D2B35]">
            {copy.title}
          </h1>
          <p className="mx-auto mt-3 max-w-[390px] text-[13px] leading-[1.45] text-[#6B5B52] sm:text-[14px]">
            {copy.intro}
          </p>

          <div className="mt-6 space-y-3 text-left">
            {partnerProviders.map((provider, index) => {
              const ProviderIcon = roleIcons[provider.id];
              const content = roleContent[provider.id];
              const isPrimary = index === 0;

              return (
                <Link
                  key={provider.id}
                  href={provider.destination || "/"}
                  className={`group flex min-h-[88px] items-center gap-3 rounded-2xl border p-3 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37] focus-visible:ring-offset-2 ${
                    isPrimary
                      ? "border-[#D4AF37]/45 bg-[#FFFDF8] shadow-[0_10px_24px_rgba(77,40,36,.08)] hover:-translate-y-0.5 hover:shadow-[0_15px_30px_rgba(77,40,36,.12)]"
                      : "border-white/90 bg-white/45 hover:border-[#D4AF37]/35 hover:bg-white/70"
                  }`}
                  data-testid={`partner-provider-card-${provider.id}`}
                >
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-full border ${
                    isPrimary
                      ? "border-[#D4AF37]/35 bg-[#F1DFB5] text-[#7F5A15]"
                      : "border-[#8EA98B]/25 bg-[#DCE8D8]/55 text-[#56745B]"
                  }`}>
                    <ProviderIcon className="h-6 w-6" strokeWidth={1.35} aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-serif text-[17px] font-semibold leading-none text-[#6D2B35]">{content.title}</span>
                    <span className="mt-1.5 block text-[11px] leading-[1.35] text-[#6B5B52]">{content.description}</span>
                    <span className={`mt-1.5 inline-flex text-[9px] font-bold uppercase tracking-[0.08em] ${isPrimary ? "text-[#A67817]" : "text-[#56745B]"}`}>
                      {content.action}
                    </span>
                  </span>
                  <ArrowRight className="h-4 w-4 shrink-0 text-[#A67817] transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                </Link>
              );
            })}
          </div>

          <div className="mt-6 border-t border-[#D4AF37]/20 pt-5">
            <p className="text-[11px] text-[#806F5E]">{copy.newPartner}</p>
            <Link
              href="/pandit/signup"
              className="mt-1 inline-flex min-h-9 items-center rounded-full px-3 text-[11px] font-bold text-[#6D2B35] underline decoration-[#D4AF37]/70 underline-offset-4 transition-colors hover:text-[#A67817] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              data-testid="link-partner-pandit-signup"
            >
              {copy.apply}
            </Link>
          </div>
        </section>

        <footer className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-2 pb-3 text-[10px] text-[#806F5E]">
          <Link href="/contact" className="hover:text-[#6D2B35]">{copy.help}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/privacy-policy" className="hover:text-[#6D2B35]">{copy.privacy}</Link>
          <span aria-hidden="true">·</span>
          <Link href="/terms-conditions" className="hover:text-[#6D2B35]">{copy.terms}</Link>
        </footer>
      </div>
    </main>
  );
}