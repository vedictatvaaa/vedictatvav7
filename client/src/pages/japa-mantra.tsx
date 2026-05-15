import { useEffect, useMemo } from "react";
import { useParams, Link } from "wouter";
import JapCounter from "@/components/JapCounter";
import PageSeo from "@/components/PageSeo";
import { faqPage, breadcrumbList, type Schema } from "@/lib/seo-schemas";
import { MANTRA_LIBRARY, type LibraryMantra } from "@/data/mantra-library";
import { ChevronLeft } from "lucide-react";
import NotFound from "@/pages/not-found";

function escAttr(s: string) {
  return s.replace(/"/g, "&quot;");
}

function mantraFaqs(m: LibraryMantra) {
  return [
    {
      question: `What is the meaning of the ${m.label}?`,
      answer: `${m.meaning} It is traditionally chanted in honour of ${m.deity}.`,
    },
    {
      question: `How many times should I chant the ${m.label}?`,
      answer: `The classical baseline is ${m.recommendedCount} repetitions — one full mala. Many sadhanas prescribe 3, 11, or 16 malas daily for 40 days as a sankalpa cycle.`,
    },
    {
      question: `When is the best time to chant ${m.label}?`,
      answer:
        "Brahma muhurta — the 96 minutes before sunrise — is the most potent window. Sunrise, midday, and sunset (the three sandhyas) are also auspicious. Pick a time you can hold daily; consistency beats timing.",
    },
    {
      question: `Can I chant ${m.label} silently?`,
      answer:
        "Yes. The three modes are vaikhari (aloud), upamshu (whispered, lips moving), and manasa (mental). Mental japa is considered the highest. Many sadhakas alternate — first round aloud to settle the breath, the rest silent.",
    },
    {
      question: "Is this counter saved if I close the browser?",
      answer:
        "Yes. Your mantra choice, current count, daily streak, and lifetime totals are saved privately in this browser using localStorage. Nothing is sent to a server.",
    },
  ];
}

export default function JapaMantraPage() {
  const params = useParams<{ slug: string }>();
  const slug = (params?.slug || "").toLowerCase();
  const mantra = useMemo<LibraryMantra | undefined>(
    () => MANTRA_LIBRARY.find((m) => m.id === slug),
    [slug],
  );

  useEffect(() => {
    window.scrollTo(0, 0);
    // Same Devanagari font hook as /japa.
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Sanskrit:ital@0;1&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
    return () => { try { document.head.removeChild(link); } catch {} };
  }, []);

  // ---- All hooks above this guard ----
  const faqs = useMemo(() => (mantra ? mantraFaqs(mantra) : []), [mantra]);
  const faqSchema = useMemo(
    () => (mantra ? faqPage(faqs, `japa-${mantra.id}-faq`) : null),
    [mantra, faqs],
  );
  const breadcrumb = useMemo(
    () =>
      mantra
        ? breadcrumbList([
            { name: "Home", url: "/" },
            { name: "Japa", url: "/japa" },
            { name: mantra.label, url: `/japa/${mantra.id}` },
          ])
        : null,
    [mantra],
  );
  const howToSchema = useMemo<Schema | null>(() => {
    if (!mantra) return null;
    return {
      id: `howto-japa-${mantra.id}`,
      payload: {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `How to chant the ${mantra.label}`,
        description: `Step-by-step japa instructions for the ${mantra.label} (${mantra.deity}) — ${mantra.recommendedCount} repetitions on a mala using the free Vedic Tatva counter.`,
        totalTime: mantra.recommendedCount === 1008 ? "PT90M" : mantra.recommendedCount === 108 ? "PT12M" : "PT6M",
        tool: [{ "@type": "HowToTool", name: "108-bead mala (rudraksha, tulsi, or sphatik) — or this digital counter" }],
        step: [
          { name: "Sit facing east, spine tall", text: "East invites the rising prana of Surya. A long, relaxed spine keeps the breath even." },
          { name: "Set your sankalpa", text: `One short intention — a healing, a person, an offering to ${mantra.deity}.` },
          { name: "Tap the orb for each repetition", text: `Chant '${mantra.transliteration}' silently or aloud as you tap. Stay with this mantra for the full mala.` },
          { name: `Complete ${mantra.recommendedCount} repetitions`, text: "When the mala completes, the bell rings. Sit in silence for a few breaths before rising." },
        ],
      },
    };
  }, [mantra]);

  if (!mantra) {
    return <NotFound />;
  }

  const title = `${mantra.label} Online Japa Counter — ${mantra.recommendedCount} Mala | Vedic Tatva`;
  const description = `Chant the ${mantra.label} (${mantra.deity}) on a free ${mantra.recommendedCount}-bead japa counter with temple bell and vibration. ${mantra.meaning.slice(0, 110)}…`;
  const keywords = [
    `${mantra.label} mantra`,
    `${mantra.label} japa`,
    `${mantra.label} counter`,
    `${mantra.label} ${mantra.recommendedCount} times`,
    `${mantra.deity} mantra`,
    `${mantra.transliteration} japa`,
    "online jap counter",
    "mala counter",
    "free mantra counter",
    "जप काउंटर",
  ].join(", ");

  return (
    <div
      className="min-h-screen bg-[#3D0A12] text-[#FBF7EE] relative overflow-x-hidden selection:bg-[#5B7FB8] selection:text-white"
      data-testid={`page-japa-mantra-${mantra.id}`}
    >
      <PageSeo
        title={title}
        description={description}
        keywords={keywords}
        canonical={`/japa/${mantra.id}`}
        ogType="website"
        twitterCard="summary_large_image"
        ogImage="/og/og-japa.jpg"
        schemas={[breadcrumb!, howToSchema!, faqSchema!].filter(Boolean) as Schema[]}
      />

      {/* Aurora wash — same as /japa */}
      <div className="fixed inset-0 pointer-events-none z-0 hidden sm:block" aria-hidden="true">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-[#D4AF37]/[0.06] rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-[#5B7FB8]/[0.08] rounded-full blur-[100px]" />
      </div>

      <div className="relative z-10 flex flex-col gap-6 sm:gap-10 pt-2 sm:pt-6 pb-12">
        {/* Slim crumb back to the hub */}
        <div className="px-3 sm:px-5 max-w-3xl mx-auto w-full">
          <Link
            href="/japa"
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm text-[#D4AF37]/80 hover:text-[#D4AF37]"
            data-testid="link-back-japa"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            All mantras
          </Link>
        </div>

        {/* Counter — pre-loaded with this mantra */}
        <section className="px-2 sm:px-5 scroll-mt-16">
          <div className="max-w-3xl mx-auto">
            <JapCounter
              ownerKey="guest"
              title={`${mantra.label} Japa`}
              subtitle={`${mantra.recommendedCount} repetitions · ${mantra.deity}`}
              initialMantraId={mantra.id}
            />
          </div>
        </section>

        {/* Mantra detail — Devanagari + meaning + deity. Indexable body
            content so the page ranks for "<mantra> meaning", "<mantra>
            lyrics", "<mantra> Sanskrit". */}
        <section className="px-3 sm:px-5">
          <div className="max-w-3xl mx-auto rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE]/[0.04] p-5 sm:p-7">
            <h1 className="font-serif text-2xl sm:text-3xl text-[#D4AF37] leading-tight">
              {mantra.label} — Online Japa Counter
            </h1>
            <p className="mt-2 text-sm sm:text-base text-[#FBF7EE]/80">
              Deity: <span className="text-[#D4AF37]">{mantra.deity}</span> · Recommended:{" "}
              <span className="text-[#D4AF37]">{mantra.recommendedCount} repetitions</span>
            </p>

            <div
              className="mt-5 text-2xl sm:text-3xl leading-relaxed text-[#FBF7EE]"
              style={{ fontFamily: '"Tiro Devanagari Sanskrit", serif' }}
              lang="sa"
              data-testid={`text-devanagari-${mantra.id}`}
            >
              {mantra.devanagari}
            </div>
            <div
              className="mt-3 text-base sm:text-lg italic text-[#D4AF37]/90"
              data-testid={`text-transliteration-${mantra.id}`}
            >
              {mantra.transliteration}
            </div>
            <p
              className="mt-4 text-sm sm:text-base text-[#FBF7EE]/85 leading-relaxed"
              data-testid={`text-meaning-${mantra.id}`}
            >
              {mantra.meaning}
            </p>
          </div>
        </section>

        {/* FAQ — server-rendered HTML so crawlers see it without JS. The
            FAQPage JSON-LD above mirrors this list 1:1. */}
        <section className="px-3 sm:px-5">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl text-[#D4AF37] mb-4">
              Frequently asked questions
            </h2>
            <div className="flex flex-col gap-3">
              {faqs.map((f, i) => (
                <details
                  key={i}
                  className="rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE]/[0.04] p-4"
                  data-testid={`faq-${mantra.id}-${i}`}
                >
                  <summary className="cursor-pointer font-medium text-[#FBF7EE]">
                    {f.question}
                  </summary>
                  <p className="mt-2 text-sm text-[#FBF7EE]/80 leading-relaxed">
                    {f.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Related mantras — internal links boost crawl depth and let
            visitors hop between landings without going back through /japa. */}
        <section className="px-3 sm:px-5">
          <div className="max-w-3xl mx-auto">
            <h2 className="font-serif text-xl sm:text-2xl text-[#D4AF37] mb-4">
              Other {mantra.category} mantras
            </h2>
            <div className="flex flex-wrap gap-2">
              {MANTRA_LIBRARY.filter(
                (m) => m.category === mantra.category && m.id !== mantra.id,
              )
                .slice(0, 8)
                .map((m) => (
                  <Link
                    key={m.id}
                    href={`/japa/${m.id}`}
                    className="inline-flex items-center rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE]/[0.04] px-3 py-1.5 text-xs sm:text-sm text-[#FBF7EE] hover-elevate active-elevate-2"
                    data-testid={`link-related-${m.id}`}
                    title={escAttr(m.deity)}
                  >
                    {m.label}
                  </Link>
                ))}
              <Link
                href="/japa"
                className="inline-flex items-center rounded-md border border-[#D4AF37]/60 bg-[#6D2B35] px-3 py-1.5 text-xs sm:text-sm text-[#D4AF37] hover-elevate active-elevate-2"
                data-testid="link-all-mantras"
              >
                See all 30 mantras →
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
