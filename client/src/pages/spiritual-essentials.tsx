import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ChevronDown, ShieldCheck, Award, Truck, Heart, Sparkles, Flame, Leaf } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import PageAPlusContent from "@/components/PageAPlusContent";
import HubTopPicks from "@/components/HubTopPicks";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CATEGORY_THEMES, ORDERED_THEME_SLUGS, type CategoryTheme } from "@/data/category-themes";
import { CATEGORY_CONTENT } from "@/data/category-content";

const CREAM = "#FBF7EE";
const CREAM_DEEP = "#F3ECD9";
const INK = "#2C1F0E";
const MAROON = "#5A1F22";
const GOLD = "#B8860B";

// Hub-page FAQs (separate from per-category FAQs which live on /shop/<slug>)
const HUB_FAQS: { q: string; a: string }[] = [
  { q: "What is the difference between Puja Essentials and the Shop?", a: "Puja Essentials is the curated front door — eight beautifully themed category landings (Rudraksha, Gemstones, Idols, Havan Samagri, Brass & Copperware, Wearables, Dhoti & Kurta, Puja Samagri) each with its own AI advisor and shastra-aligned guidance. The Shop is the underlying catalogue. You will land on the same products either way — Puja Essentials simply gives you a guided, premium experience." },
  { q: "Do all 8 categories have an AI advisor?", a: "Yes. Each category landing carries a dedicated AI advisor — Rudraksha mukhi finder, gemstone matcher by kundli, puja kit builder, havan planner, mala recommender, dhoti-kurta size guide, brass thali builder and idol selector. They are guided by Vedic shastra and free to use." },
  { q: "Are all products lab-certified and energised?", a: "Every Rudraksha is X-ray verified and energised in our Banaras workshop. Every gemstone ships with a third-party gemological lab certificate. Every idol can be optionally pranapratishthit by a verified pandit before dispatch. Every samagri batch is purity-tested. We never compromise on authenticity." },
  { q: "Do you ship outside India?", a: "Yes — we ship to USA, UK, Canada, Australia, Singapore, UAE, Germany and most countries with a significant Hindu diaspora. International rates and timelines vary; expect 7-15 business days for most destinations." },
  { q: "Can I get a pandit recommendation along with my essentials?", a: "Yes — every category landing links to our verified pandit and astrologer marketplace. For major rituals (Satyanarayan Katha, Griha Pravesh, Rudra Abhishek, Wedding) you can add a pandit visit at checkout." },
  { q: "What is your return policy on energised items?", a: "Unenergised items (raw beads, unactivated yantras, plain idols) can be returned within 7 days, unused, in original packaging. Energised items (post-pranapratishtha) are non-returnable per shastra — once the deity is invited into the form, the bond cannot be transferred." },
];

function CategoryTile({ theme, position }: { theme: CategoryTheme; position: number }) {
  const Icon = theme.icon;
  const content = CATEGORY_CONTENT[theme.slug];
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: position * 0.05 }}
    >
      <Link href={`/shop/${theme.slug}`} data-testid={`tile-category-${theme.slug}`}>
        <Card className="group relative overflow-hidden border-2 hover-elevate active-elevate-2 cursor-pointer h-full"
          style={{ borderColor: `${theme.palette.accent}33` }}>
          {/* Themed gradient background */}
          <div
            className="absolute inset-0"
            style={{ background: `linear-gradient(135deg, ${theme.palette.bgFrom} 0%, ${theme.palette.bgVia} 60%, ${theme.palette.bgTo} 100%)` }}
          />
          {/* Decorative motif */}
          <div
            aria-hidden="true"
            className="absolute -right-4 -bottom-8 sm:-right-6 sm:-bottom-10 text-[140px] sm:text-[180px] opacity-[0.12] leading-none select-none pointer-events-none font-serif text-white"
          >
            {theme.motifEmoji}
          </div>
          <div
            aria-hidden="true"
            className="absolute -left-12 -top-12 w-40 h-40 rounded-full blur-3xl opacity-25"
            style={{ background: theme.palette.accent }}
          />
          {/* Content */}
          <div className="relative z-10 p-5 sm:p-6 lg:p-7 text-white h-full flex flex-col min-h-[260px] sm:min-h-[300px]">
            <div className="flex items-start justify-between gap-3 mb-4 sm:mb-5">
              <span
                className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-full"
                style={{ background: theme.palette.chip, border: `1.5px solid ${theme.palette.accent}66` }}
              >
                <Icon className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: theme.palette.accent }} />
              </span>
              <span
                className="text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-1 rounded"
                style={{ background: theme.palette.chip, color: theme.palette.accent, border: `1px solid ${theme.palette.accent}44` }}
              >
                AI Advisor
              </span>
            </div>

            <h3 className="font-serif text-2xl sm:text-3xl leading-tight mb-2">
              {theme.label}
            </h3>
            <p className="text-white/80 text-sm leading-relaxed mb-4 sm:mb-5">
              {theme.tagline}
            </p>
            {content && (
              <p className="text-white/65 text-xs leading-relaxed mb-5 sm:mb-6 line-clamp-3">
                {content.intro}
              </p>
            )}

            <div className="mt-auto inline-flex items-center gap-1.5 text-sm font-semibold group-hover:gap-2.5 transition-all"
              style={{ color: theme.palette.accent }}>
              Explore {theme.label}
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </Card>
      </Link>
    </motion.div>
  );
}

export default function SpiritualEssentials() {
  try { sessionStorage.setItem("lastShopPage", "/spiritual-essentials"); } catch {}

  const themes = ORDERED_THEME_SLUGS.map(slug => CATEGORY_THEMES[slug]);

  return (
    <div className="w-full pb-20" style={{ background: CREAM, color: INK }}>
      <PageSeo
        title="Puja Essentials Online — Premium Spiritual Marketplace | Vedic Tatva"
        description="Premium spiritual marketplace — 8 curated verticals: certified Rudraksha, lab-tested Gemstones, shilpa-shastra Idols, pure Havan Samagri, hand-crafted Brass & Copperware, energised Wearables, traditional Dhoti & Kurta, complete Puja Samagri. Each category guided by AI, blessed by pandits, delivered Pan-India + worldwide."
        keywords="puja essentials online, hindu puja samagri, rudraksha online india, navaratna gemstones, panchaloha murti, havan samagri, brass diyas, japa mala, dhoti kurta puja, ai puja advisor, vedic spiritual marketplace, vedictatva, ai mukhi finder, gemstone matcher kundli"
        canonical="/spiritual-essentials"
        ogType="website"
        twitterCard="summary_large_image"
      />

      {/* Premium hero */}
      <section className="relative overflow-hidden text-white"
        style={{ background: `linear-gradient(135deg, ${MAROON} 0%, #3A0F12 50%, #1A0608 100%)` }}>
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{ backgroundImage: "radial-gradient(circle at 25% 30%, white 1px, transparent 1px), radial-gradient(circle at 75% 70%, white 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div aria-hidden="true" className="absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl opacity-20"
          style={{ background: GOLD }} />
        <div aria-hidden="true" className="absolute -bottom-32 -left-32 w-96 h-96 rounded-full blur-3xl opacity-15"
          style={{ background: GOLD }} />

        <div className="container mx-auto px-4 py-14 sm:py-20 lg:py-28 relative z-10 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[11px] sm:text-xs uppercase tracking-[0.22em] font-semibold mb-5 sm:mb-7"
              style={{ background: `${GOLD}1F`, color: GOLD, border: `1px solid ${GOLD}55` }}>
              <Sparkles className="w-3.5 h-3.5" />
              The Sacred Marketplace
            </span>

            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl xl:text-7xl leading-[1.05] mb-5 sm:mb-7 max-w-4xl mx-auto">
              Puja Essentials
            </h1>
            <p className="text-base sm:text-lg lg:text-xl text-white/85 max-w-2xl mx-auto leading-relaxed mb-8 sm:mb-10">
              Eight sacred verticals. Each with its own AI advisor, shastra-aligned guidance, and a personality of its own.
              Every Rudraksha X-ray verified. Every gemstone lab certified. Every idol shilpa-shastra correct.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-[11px] sm:text-xs text-white/70">
              {[
                { Icon: ShieldCheck, t: "Lab Certified" },
                { Icon: Award, t: "Pandit Energised" },
                { Icon: Truck, t: "Pan-India + NRI" },
                { Icon: Heart, t: "7-Day Returns" },
              ].map(({ Icon, t }) => (
                <span key={t} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <Icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
                  {t}
                </span>
              ))}
            </div>

            <div className="mt-8 sm:mt-10 flex justify-center animate-bounce">
              <ChevronDown className="w-5 h-5 text-white/50" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* H2: Section eyebrow */}
      <section className="container mx-auto px-4 pt-12 sm:pt-16 lg:pt-20 pb-4 text-center">
        <div className="inline-flex items-center gap-2.5 mb-3">
          <span className="h-px w-8" style={{ background: `${GOLD}66` }} />
          <span className="text-[11px] uppercase tracking-[0.3em] font-semibold" style={{ color: GOLD }}>
            Browse by Category
          </span>
          <span className="h-px w-8" style={{ background: `${GOLD}66` }} />
        </div>
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl mb-3 sm:mb-4" style={{ color: MAROON }}>
          Eight Sacred Verticals
        </h2>
        <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed" style={{ color: `${INK}cc` }}>
          Each category carries its own visual identity, its own shastra references, its own AI advisor.
          Tap a tile to enter a dedicated landing crafted around that tradition.
        </p>
      </section>

      {/* 8 themed category tiles — mobile-first 1col → 2col → 4col */}
      <section className="container mx-auto px-4 pb-16 sm:pb-20" data-testid="section-category-grid">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {themes.map((theme, i) => (
            <CategoryTile key={theme.slug} theme={theme} position={i} />
          ))}
        </div>
      </section>

      {/* Curator's Top Picks — 1 product per themed vertical, restores click-through */}
      <HubTopPicks />

      {/* AI advisor highlight strip */}
      <section className="bg-gradient-to-br from-[#FAF1DC] via-[#F5E6C9] to-[#F0D8B0] py-12 sm:py-16">
        <div className="container mx-auto px-4 text-center">
          <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] uppercase tracking-[0.2em] font-semibold mb-4"
            style={{ background: `${MAROON}10`, color: MAROON, border: `1px solid ${MAROON}33` }}>
            <Sparkles className="w-3.5 h-3.5" />
            Powered by Vedic Tatva AI
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl mb-4 max-w-3xl mx-auto leading-tight" style={{ color: MAROON }}>
            Every category has a guide. Yours is one tap away.
          </h2>
          <p className="text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-7" style={{ color: `${INK}cc` }}>
            Don't know which Rudraksha mukhi suits your rashi? Confused which gemstone matches your kundli?
            Need a complete samagri checklist for tomorrow's Satyanarayan? Each category page has a free
            AI advisor that asks the right questions and gives you a shastra-aligned answer in seconds.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 max-w-3xl mx-auto">
            {[
              "Mukhi finder",
              "Gemstone matcher",
              "Puja kit builder",
              "Havan planner",
              "Mala recommender",
              "Dhoti size guide",
              "Thali builder",
              "Murti selector",
            ].map((t) => (
              <span key={t} className="text-xs sm:text-sm px-3 py-1.5 rounded-full font-medium"
                style={{ background: "white", color: MAROON, border: `1px solid ${GOLD}55` }}>
                {t}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* A+ Why-shop content */}
      <PageAPlusContent
        eyebrow="Why Vedic Tatva"
        title="The premium home for sacred spiritual essentials"
        intro="Vedic Tatva exists because authentic puja items have become hard to find. Plastic flowers replace mogra. Synthetic dye replaces natural kumkum. Machine-stamped figurines replace shilpa-shastra murtis. We work directly with traditional artisan families — Banaras brass workers, Channapatna idol carvers, Tirupati silk weavers, Kumbakonam panchaloha craftsmen, Nepal Rudraksha collectors, Jaipur gemstone certifiers — to bring you the real thing, every time."
        trustBadges={[
          { value: "100%", label: "Lab Certified" },
          { value: "180+", label: "Master Artisans" },
          { value: "Pan", label: "India Delivery" },
          { value: "8", label: "Sacred Verticals" },
        ]}
        benefits={[
          { icon: ShieldCheck, title: "Shastra-Aligned Sourcing", body: "Every Rudraksha X-ray verified. Every gemstone third-party lab tested. Every idol reviewed against the Manasara and Vishnudharmottara before listing. We do not sell 'inspired-by' figurines or chemical-dye samagri." },
          { icon: Sparkles, title: "AI-Guided Discovery", body: "Eight free AI advisors — one per category — trained on Vedic shastra. Get a personal mukhi recommendation, a kundli-matched gemstone, an auto-built puja kit or a havan plan in seconds." },
          { icon: Award, title: "Pandit-Energised Ready", body: "Optional pranapratishtha for idols and yantras at our Banaras workshop. Every Rudraksha pre-energised with the appropriate beej mantra. Every shipment carries a certificate." },
          { icon: Flame, title: "Festival-Ready Kits", body: "Pre-bundled boxes for Diwali, Navratri, Ganesh Chaturthi, Satyanarayan Katha, Griha Pravesh and Rudra Abhishek. Each kit includes a printed step-by-step vidhi card in Hindi and English." },
          { icon: Heart, title: "Direct From Source", body: "We pay artisans fair prices and pass the saving to you. No middlemen, no machine-stamped imports. The brass diya you receive was hammered by a craftsman whose family has done this for four generations." },
          { icon: Truck, title: "Pan-India + NRI Delivery", body: "Free shipping above ₹499 across India. International shipping to USA, UK, Canada, Australia, UAE and Singapore. Your sacred items reach you safely, packed in red cloth and shock-foam." },
        ]}
        steps={[
          { title: "Pick Your Category", body: "Tap one of the eight verticals above — each one a curated landing with its own AI advisor and a story." },
          { title: "Ask the AI Advisor", body: "Tell the advisor your rashi, your goal, your occasion. Get a shastra-aligned recommendation in under 10 seconds." },
          { title: "Order with Confidence", body: "Secure payment, transparent product pages with source + material + shastra reference, COD across India, 7-day easy return." },
          { title: "Perform With Sanctity", body: "Every shipment includes a small ritual guide — sankalpa mantra, item placement and the puja vidhi for the occasion." },
        ]}
        faqs={HUB_FAQS}
        keywordsBlurb="Buy authentic Hindu puja essentials online — X-ray certified Nepal & Indonesian Rudraksha (1 mukhi to 21 mukhi), lab-tested Navaratna gemstones (Manik, Moti, Moonga, Panna, Pukhraj, Neelam, Gomed, Lehsuniya, Heera), brass and panchaloha murtis (Ganesh, Lakshmi, Saraswati, Shiva, Hanuman, Krishna, Durga), 32-herb havan samagri with A2 cow ghee, 108-bead japa malas (tulsi, sphatik, sandalwood, coral), pure cotton dhoti-kurta sets, complete puja samagri kits for daily worship and major festivals (Diwali, Navratri, Ganesh Chaturthi, Satyanarayan Katha, Griha Pravesh, Rudra Abhishek). Pan-India delivery and international shipping for NRI Hindus across USA, UK, Canada, Australia, UAE and Singapore. AI-guided product discovery, pandit-energised, shastra-aligned. The premium home of Vedic Tatva."
      />
    </div>
  );
}
