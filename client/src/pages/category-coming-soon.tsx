import { Link, useRoute } from "wouter";
import { Home as HomeIcon, Sparkles, Wheat, Nut, Bell, ChevronRight } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import QuickAnswer from "@/components/QuickAnswer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

type Category = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  Icon: React.ComponentType<{ className?: string }>;
  accent: string;
  accentSoft: string;
  highlights: string[];
  quickAnswer: string;
};

const CATEGORIES: Record<string, Category> = {
  "home-essentials": {
    slug: "home-essentials",
    title: "Home Essentials",
    tagline: "Sacred touches for your everyday home",
    description:
      "Curated daily-use essentials for a Vedic home — copper bottles, pure-cotton aasan, brass utensils, ghee diyas, eco-friendly cleaning, and more, sourced from trusted Indian artisans.",
    Icon: HomeIcon,
    accent: "#B45F4D",
    accentSoft: "rgba(180,95,77,0.10)",
    highlights: ["Copper & brass kitchenware", "Pure-cotton aasan & textiles", "Ghee diyas & incense", "Eco-friendly cleaning"],
    quickAnswer: "Vedic Tatva Home Essentials brings traditional copper, brass, cotton and ghee-based daily-use items to your home — sourced from trusted Indian artisans. The collection launches soon; join the waitlist to receive a one-time launch invite.",
  },
  "hair-skin-care": {
    slug: "hair-skin-care",
    title: "Hair & Skin Care",
    tagline: "Ancient Ayurvedic beauty rituals",
    description:
      "Time-tested Ayurvedic and herbal formulations for hair and skin — cold-pressed oils, ubtan powders, herbal shampoos, kumkumadi tailam, and natural face care made the traditional way.",
    Icon: Sparkles,
    accent: "#C2825F",
    accentSoft: "rgba(194,130,95,0.12)",
    highlights: ["Cold-pressed hair oils", "Ubtan & herbal powders", "Kumkumadi & saffron care", "100% natural formulas"],
    quickAnswer: "Our Hair & Skin Care line revives time-tested Ayurvedic formulations — cold-pressed oils, ubtan powders, kumkumadi tailam and herbal cleansers, made the traditional way without synthetic additives. Launching soon.",
  },
  "grains-pulses": {
    slug: "grains-pulses",
    title: "Grains & Pulses",
    tagline: "Pure, single-origin pantry staples",
    description:
      "Stone-milled atta, hand-pounded rice, single-origin dals, millets and legumes — sourced directly from Indian farmers, naturally grown, and delivered fresh to your kitchen.",
    Icon: Wheat,
    accent: "#A8741A",
    accentSoft: "rgba(168,116,26,0.12)",
    highlights: ["Stone-milled atta & flours", "Hand-pounded rice", "Single-origin dals", "Millets & ancient grains"],
    quickAnswer: "Stone-milled atta, hand-pounded rice, single-origin dals and ancient millets — sourced directly from Indian farmers and delivered fresh, with no polishing or chemical treatment. Coming soon to your kitchen.",
  },
  "dry-fruits": {
    slug: "dry-fruits",
    title: "Dry Fruits",
    tagline: "Premium kernels & sacred offerings",
    description:
      "Hand-picked Kashmiri walnuts, Mamra almonds, Kashmiri kesar, premium cashews, dates and fox-nuts — naturally grown and ideal both for daily nourishment and bhog offerings.",
    Icon: Nut,
    accent: "#8C5A2B",
    accentSoft: "rgba(140,90,43,0.12)",
    highlights: ["Kashmiri walnuts & almonds", "Premium kesar & cashews", "Dates & makhana (fox-nuts)", "Pooja-grade purity"],
    quickAnswer: "Hand-picked Kashmiri walnuts, Mamra almonds, premium kesar, cashews, dates and fox-nuts — naturally grown and pooja-grade pure, ideal for both daily nourishment and bhog offerings. Launching soon.",
  },
};

export default function CategoryComingSoon() {
  const [, params] = useRoute<{ slug: string }>("/category/:slug");
  const slug = params?.slug ?? "home-essentials";
  const cat = CATEGORIES[slug] ?? CATEGORIES["home-essentials"];

  const Icon = cat.Icon;

  return (
    <div className="min-h-screen bg-[#faf7f2] flex flex-col">
      <PageSeo
        title={`${cat.title} — Coming Soon | Vedic Tatva`}
        description={cat.description}
        canonical={`/category/${cat.slug}`}
      />
      <Navbar />
      <main className="flex-1">
        <section
          className="relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${cat.accentSoft} 0%, rgba(255,255,255,0.85) 60%, ${cat.accentSoft} 100%)`,
          }}
        >
          <div className="max-w-5xl mx-auto px-5 sm:px-8 py-14 sm:py-20 text-center">
            <div
              className="inline-flex items-center justify-center w-20 h-20 rounded-full mb-6"
              style={{
                background: `linear-gradient(135deg, ${cat.accent} 0%, ${cat.accent}cc 100%)`,
                boxShadow: `0 10px 30px -10px ${cat.accent}80`,
              }}
              data-testid={`icon-category-${cat.slug}`}
            >
              <Icon className="w-10 h-10 text-white" />
            </div>
            <span
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-[0.2em] mb-4"
              style={{
                background: "white",
                color: cat.accent,
                border: `1px solid ${cat.accent}40`,
              }}
              data-testid={`badge-coming-soon-${cat.slug}`}
            >
              <Bell className="w-3 h-3" /> Coming Soon
            </span>
            <h1
              className="font-serif text-3xl sm:text-5xl font-bold leading-tight mb-3"
              style={{ color: "#3a1a1f" }}
              data-testid={`heading-${cat.slug}`}
            >
              {cat.title}
            </h1>
            <p className="text-base sm:text-lg text-[#5a4a3a] mb-2" data-testid={`tagline-${cat.slug}`}>
              {cat.tagline}
            </p>
            <p className="text-sm sm:text-base text-[#5a4a3a]/80 max-w-2xl mx-auto" data-testid={`description-${cat.slug}`}>
              {cat.description}
            </p>
          </div>
          <QuickAnswer text={cat.quickAnswer} testId={`quick-answer-${cat.slug}`} className="px-5 sm:px-8 pb-8" />
        </section>

        <section className="max-w-5xl mx-auto px-5 sm:px-8 py-10 sm:py-14">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mb-10">
            {cat.highlights.map((h, i) => (
              <Card
                key={i}
                className="p-4 sm:p-5 flex items-start gap-3 hover-elevate"
                data-testid={`highlight-${cat.slug}-${i}`}
              >
                <span
                  className="mt-0.5 inline-flex items-center justify-center w-8 h-8 rounded-md shrink-0"
                  style={{ background: cat.accentSoft, color: cat.accent }}
                >
                  <ChevronRight className="w-4 h-4" />
                </span>
                <p className="text-sm sm:text-[15px] text-[#3a1a1f] font-medium leading-snug">{h}</p>
              </Card>
            ))}
          </div>

          <Card className="p-6 sm:p-8 text-center" data-testid={`card-notify-${cat.slug}`}>
            <h2 className="font-serif text-xl sm:text-2xl font-semibold text-[#3a1a1f] mb-2">
              Be first to know when we launch
            </h2>
            <p className="text-sm text-[#5a4a3a] mb-5 max-w-lg mx-auto">
              We're hand-curating every product in this collection. Drop your details and we'll send you a one-time launch invite — no spam, ever.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-lg mx-auto">
              <Link href="/" className="flex-1">
                <Button
                  variant="outline"
                  className="w-full"
                  data-testid={`button-back-home-${cat.slug}`}
                >
                  Back to Home
                </Button>
              </Link>
              <Link href="/shop" className="flex-1">
                <Button
                  className="w-full text-white"
                  style={{ background: cat.accent }}
                  data-testid={`button-explore-shop-${cat.slug}`}
                >
                  Explore Spiritual Store
                </Button>
              </Link>
            </div>
          </Card>
        </section>
      </main>
      <Footer />
    </div>
  );
}
