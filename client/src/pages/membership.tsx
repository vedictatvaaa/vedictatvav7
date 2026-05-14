import { Link } from "wouter";
import { Crown, Star, Shield, Sparkles, Check, ArrowRight, Heart, BookOpen, Video, Gift, Users, ChevronRight } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import PageSeo from "@/components/PageSeo";
import { Button } from "@/components/ui/button";
import { faqPage as faqPageSchema, breadcrumbList as breadcrumbListSchema, service as serviceSchema, abs } from "@/lib/seo-schemas";

const MEMBERSHIP_H1 = "Vedic Tatva Prime Membership — Premium Spiritual Subscription";

const MEMBERSHIP_FAQS = [
  { q: "Is membership available right now?", a: "Membership tiers (Devotee, Sadhaka, Premium) are listed as Coming Soon. Most of Vedic Tatva is already free — kundli, daily rashifal, panchang, kundli matching, baby names, palm reading, kathas streaming and scripture search require no membership. You can join the waitlist on the plan card." },
  { q: "Will I lose my free access when membership launches?", a: "No — every feature currently free will remain free. Membership tiers add premium-only benefits (offline downloads, deeper kundli sections, priority booking, samagri box) on top, without removing existing functionality." },
  { q: "What is currently free vs what will be in membership?", a: "Free today: full Janam Kundli, daily/weekly/monthly rashifal, panchang, 36-point kundli matching, baby names, AI palm reading, Vastu compass, muhurat finder, scripture search and katha streaming. Planned for membership: ad-free + offline kathas, deeper dasha analysis, priority astrologer/pandit booking, samagri box, live acharya webinars." },
  { q: "When will paid memberships launch?", a: "We're rolling membership out in phases — Devotee tier first (digital-only benefits), then Sadhaka and Premium (with monthly samagri box). Join the waitlist by tapping any Coming Soon plan card and we'll email you the moment it opens." },
  { q: "Will membership pricing be transparent?", a: "Yes — we plan transparent monthly and annual pricing with no hidden charges. Annual is expected to offer meaningful savings vs monthly, and one-click cancellation will be available from your dashboard." },
  { q: "Will members get discounts on shop and consultations?", a: "Planned — yes. Members are expected to receive a percentage discount on shop purchases and a member rate on astrologer/pandit consultations. Exact percentages will be confirmed at launch." },
  { q: "Is there a lifetime membership planned?", a: "We are exploring a lifetime tier for committed devotees and families, but it is not confirmed yet. We'll announce timing and pricing on the membership page when finalised." },
  { q: "Will NRI devotees be supported?", a: "Yes — digital benefits (kathas, kundli, scriptures, webinars, priority booking) work globally. For physical samagri box delivery, we plan quarterly shipping options to USA, UK, Canada, Australia, Singapore and UAE." },
];

const plans = [
  {
    name: "Devotee",
    nameHindi: "भक्त",
    price: 0,
    period: "Free Forever",
    description: "Begin your spiritual journey with essential access",
    icon: Star,
    features: [
      "Browse all products & services",
      "Book Pandits & Puja",
      "Astrology consultations",
      "Order tracking",
      "Basic customer support",
    ],
    cta: "Current Plan",
    disabled: true,
  },
  {
    name: "Sadhak",
    nameHindi: "साधक",
    price: 299,
    period: "/month",
    description: "For devoted practitioners seeking deeper blessings",
    icon: Shield,
    popular: true,
    features: [
      "Everything in Devotee",
      "5% off all products",
      "Priority Pandit booking",
      "Free monthly Kundli report",
      "Exclusive puja invitations",
      "Early access to new arrivals",
      "Priority customer support",
    ],
    cta: "Coming Soon",
    disabled: true,
  },
  {
    name: "Siddha",
    nameHindi: "सिद्ध",
    price: 999,
    period: "/month",
    description: "Premium spiritual experience with exclusive privileges",
    icon: Crown,
    features: [
      "Everything in Sadhak",
      "15% off all products",
      "Free shipping on all orders",
      "Personal astrology advisor",
      "VIP Pandit access",
      "Monthly personalized puja",
      "Exclusive spiritual retreats",
      "Dedicated account manager",
    ],
    cta: "Coming Soon",
    disabled: true,
  },
];

const benefits = [
  { icon: Sparkles, title: "Spiritual Growth", description: "Curated resources and guidance for your spiritual journey" },
  { icon: Shield, title: "Exclusive Access", description: "Priority bookings, early access, and members-only events" },
  { icon: Star, title: "Savings", description: "Significant discounts on products, services, and consultations" },
  { icon: Crown, title: "Premium Support", description: "Dedicated support team for all your spiritual needs" },
];

export default function Membership() {
  return (
    <div className="w-full pb-20 bg-white min-h-screen">
      <PageSeo
        title="Vedic Tatva Prime — Premium Spiritual Membership for Devotees & NRI Families"
        description="Vedic Tatva Prime — premium spiritual membership with priority pandit & astrologer booking, ad-free unlimited katha streaming (Sundarkand, Hanuman Chalisa, Bhagavad Gita), deeper Janam Kundli analysis, monthly puja samagri box, member-only festival kits and live acharya webinars. Most core tools remain free."
        keywords="vedic tatva membership, hindu spiritual subscription, premium puja membership, ad-free hindu kathas, offline kundli download, priority pandit booking, monthly puja samagri box, vedic prime membership, sadhaka premium plan, lifetime spiritual membership, nri hindu membership"
        canonical="/membership"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbListSchema([
            { name: "Home", url: abs("/") },
            { name: "Membership", url: abs("/membership") },
          ]),
          faqPageSchema(MEMBERSHIP_FAQS.map(f => ({ question: f.q, answer: f.a })), "membership-faq"),
          serviceSchema({
            name: "Vedic Tatva Prime Membership",
            description: "Premium spiritual subscription with priority pandit & astrologer booking, ad-free katha streaming, deeper kundli, monthly samagri box and live acharya webinars.",
            url: abs("/membership"),
            providerName: "Vedic Tatva",
            areaServed: ["IN", "US", "GB", "CA", "AU", "SG", "AE"],
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="bg-[#FBF7EE] border-b border-[#D4AF37]/15">
        <ol className="container mx-auto px-4 py-1.5 flex items-center gap-1 text-[11px] sm:text-[12px] text-[#5a4a3a]/75">
          <li><Link href="/" className="hover:text-[#6D2B35]" data-testid="link-breadcrumb-home">Home</Link></li>
          <li aria-hidden="true"><ChevronRight className="w-3 h-3 inline" /></li>
          <li aria-current="page" className="text-[#6D2B35] font-semibold">Membership</li>
        </ol>
      </nav>
      {/* Slim hero — solid maroon, no gradient, no faded ॐ */}
      <section className="bg-[#6D2B35] border-b border-[#D4AF37]/30 text-white">
        <div className="container mx-auto px-4 py-7 sm:py-10 md:py-14 text-center">
          <div className="flex items-center justify-center gap-2 mb-2.5">
            <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[9px] sm:text-[11px] uppercase tracking-[0.28em] sm:tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Crown className="w-3 h-3" /> Vedic Tatva Membership
            </span>
            <span className="h-px w-6 sm:w-8 bg-[#D4AF37]/60" />
          </div>
          <h1 className="text-[19px] leading-[1.2] sm:text-2xl md:text-3xl lg:text-4xl font-serif mb-2 sm:mb-3 font-semibold tracking-tight" data-testid="text-membership-title">
            {MEMBERSHIP_H1}
          </h1>
          <p className="text-white/70 max-w-xl mx-auto text-[13px] sm:text-sm md:text-[15px] leading-snug sm:leading-relaxed">
            Sacred community, divine blessings, premium spiritual services.
          </p>
        </div>
      </section>

      {/* Plan cards */}
      <section className="container mx-auto px-4 mt-10 sm:mt-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 max-w-5xl mx-auto">
          {plans.map((plan) => {
            const isPopular = plan.popular;
            return (
              <div
                key={plan.name}
                className={`relative h-full bg-white rounded-md overflow-hidden border ${
                  isPopular ? "border-[#D4AF37] ring-1 ring-[#D4AF37]/30" : "border-[#D4AF37]/25"
                } transition-colors hover:border-[#D4AF37]/55`}
                data-testid={`card-plan-${plan.name.toLowerCase()}`}
              >
                {isPopular && (
                  <div className="absolute top-0 right-0 bg-[#D4AF37] text-[#6D2B35] text-[10px] font-bold uppercase tracking-[0.2em] px-3 py-1 rounded-bl-md">
                    Most Popular
                  </div>
                )}
                <div className="p-5 sm:p-6 flex flex-col h-full">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                      <plan.icon className="h-5 w-5 text-[#6D2B35]" strokeWidth={1.6} />
                    </div>
                    <div>
                      <h3 className="font-serif text-base text-[#6D2B35] font-semibold leading-tight">{plan.name}</h3>
                      <p className="text-[11px] text-[#5a4a3a]/55 mt-0.5">{plan.nameHindi}</p>
                    </div>
                  </div>

                  <div className="mb-3">
                    <span className="text-3xl font-bold text-[#6D2B35] font-serif">
                      {plan.price === 0 ? "Free" : `₹${plan.price}`}
                    </span>
                    {plan.price > 0 && <span className="text-xs text-[#5a4a3a]/60 ml-1">{plan.period}</span>}
                    {plan.price === 0 && <span className="text-xs text-[#5a4a3a]/60 ml-1">{plan.period}</span>}
                  </div>

                  <p className="text-sm text-[#5a4a3a]/75 mb-5 leading-relaxed">{plan.description}</p>

                  <ul className="space-y-2 mb-6 flex-grow">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-2 text-sm text-[#5a4a3a]/85">
                        <Check className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" strokeWidth={2.2} />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    disabled={plan.disabled}
                    className={`w-full rounded-md h-10 text-[13px] font-semibold ${
                      isPopular
                        ? "bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
                        : "bg-[#FBF7EE] hover:bg-[#f0e9d4] text-[#6D2B35] border border-[#D4AF37]/30"
                    }`}
                    data-testid={`btn-plan-${plan.name.toLowerCase()}`}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Benefits grid */}
      <section className="container mx-auto px-4 py-16 sm:py-20">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-6 bg-[#D4AF37]" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">Member Privileges</span>
            <span className="h-px w-6 bg-[#D4AF37]" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif text-[#6D2B35] mb-2 font-semibold tracking-tight" data-testid="text-benefits-title">Why Join Vedic Tatva?</h2>
          <p className="text-[#5a4a3a]/65 max-w-md mx-auto text-sm">Experience the divine difference with exclusive member benefits</p>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-px bg-[#D4AF37]/25 rounded-md overflow-hidden border border-[#D4AF37]/25 max-w-5xl mx-auto">
          {benefits.map((benefit) => (
            <div
              key={benefit.title}
              className="bg-white p-5 sm:p-6 text-center"
              data-testid={`benefit-${benefit.title.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="w-11 h-11 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-3">
                <benefit.icon className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.6} />
              </div>
              <h3 className="font-serif text-[#6D2B35] mb-1.5 font-semibold text-sm sm:text-base">{benefit.title}</h3>
              <p className="text-xs sm:text-[13px] text-[#5a4a3a]/65 leading-relaxed">{benefit.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA panel */}
      <section className="container mx-auto px-4 pb-12">
        <div className="bg-[#6D2B35] border border-[#D4AF37]/30 rounded-md p-8 md:p-10 text-center text-white max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2.5 mb-3">
            <span className="h-px w-6 bg-[#D4AF37]/60" />
            <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">Continue Exploring</span>
            <span className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="text-xl md:text-2xl font-serif mb-2 font-semibold tracking-tight">Browse Our Sacred Collection</h2>
          <p className="text-white/65 mb-6 max-w-md mx-auto text-sm">
            Membership plans are being prepared — explore everything else in the meantime
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center">
            <Link href="/shop">
              <Button className="bg-[#D4AF37] hover:bg-[#c4a030] text-[#6D2B35] rounded-md h-10 px-5 text-[13px] font-semibold" data-testid="btn-browse-shop">
                Shop Now <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>
            </Link>
            <Link href="/donations">
              <Button variant="outline" className="border-white/40 text-white bg-transparent hover:bg-white/10 rounded-md h-10 px-5 text-[13px] font-semibold" data-testid="btn-browse-donations">
                Sacred Donations
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 pb-12">
        <PageAPlusContent
          eyebrow="What Membership Will Unlock (Coming Soon)"
          title="Vedic Tatva Membership — Full-Access Sanatan Lifestyle Pass"
          intro="Most of Vedic Tatva is already free — kundli, rashifal, panchang, kundli matching, baby names, palm reading, scripture search, kathas streaming. Paid membership tiers (Devotee, Sadhaka, Premium) are launching soon, designed to unlock deeper sadhana benefits for committed devotees and families. Here's what we are building."
          trustBadges={[
            { value: "Free", label: "Core Tools Today" },
            { value: "Soon", label: "Devotee Tier" },
            { value: "Soon", label: "Sadhaka Tier" },
            { value: "Soon", label: "Premium Tier" },
          ]}
          benefits={[
            { icon: BookOpen, title: "Unlimited Katha & Scriptures", body: "Planned: ad-free katha streaming with offline download for Sundarkand, Hanuman Chalisa, Bhagavad Gita, Sahasranamas, Ramcharitmanas, plus premium scripture study notes." },
            { icon: Sparkles, title: "Deeper Kundli Reports", body: "Planned: detailed Vimshottari Antardasha and Pratyantardasha, Yogini Dasha, Char Dasha, Ashtakavarga and additional divisional charts (Navamsa, Dasamsa, Saptamsa)." },
            { icon: Video, title: "Priority Astrologer & Pandit", body: "Planned: priority booking slots and member discounts when consulting our verified astrologers and booking pandits — especially valuable around festival peaks." },
            { icon: Gift, title: "Monthly Samagri Box", body: "Planned: a curated daily puja samagri box (agarbatti, ghee, camphor, vatti, roli, kumkum) shipped to members every month, included in higher tiers." },
            { icon: Heart, title: "Member-Only Festival Kits", body: "Planned: Diwali, Navratri, Ganesh Chaturthi and Janmashtami kits curated for members — better quality at lower price, with advance delivery." },
            { icon: Users, title: "Live Webinars & Satsang", body: "Planned: monthly live Jyotish, Vedanta, Bhagavad Gita and Vastu webinars by traditional acharyas — interactive Q&A and recordings in your library." },
          ]}
          steps={[
            { title: "Use Free Tools Today", body: "Start with what's live — free kundli, rashifal, kundli matching, panchang, baby names, palm reading, kathas streaming and scripture search." },
            { title: "Join the Waitlist", body: "Tap the Coming Soon plan that fits your needs (Devotee / Sadhaka / Premium) — we'll notify you the moment that tier opens." },
            { title: "Activate When Live", body: "Once your chosen tier launches, premium features unlock immediately on payment — no migration friction." },
            { title: "Cancel Anytime", body: "Membership will be one-click cancellable from your dashboard. No long-term lock-in is planned." },
          ]}
          faqs={MEMBERSHIP_FAQS}
          keywordsBlurb="Vedic Tatva membership — planned premium tiers (Devotee, Sadhaka, Premium) to unlock unlimited ad-free Hindu katha streaming and offline download (Sundarkand, Hanuman Chalisa, Bhagavad Gita, Vishnu Sahasranama, Ramcharitmanas), deeper Janam Kundli analysis (Vimshottari Antardasha, Yogini Dasha, Ashtakavarga, divisional charts), priority booking with verified astrologers and pandits, monthly puja samagri box, member-only Diwali and Navratri festival kits, and live monthly Jyotish and Vedanta webinars by traditional acharyas. Most core tools (kundli, rashifal, panchang, kundli matching, baby names, palm reading, scripture search) remain free for everyone."
        />
      </div>
    </div>
  );
}
