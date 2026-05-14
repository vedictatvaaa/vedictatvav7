import { Link } from "wouter";
import { motion } from "framer-motion";
import { Heart, Shield, CheckCircle, Users, Star, Crown, Eye, FileCheck, Phone, ArrowRight, Sparkles, UserCheck, Lock, Award, ShieldCheck, Globe, BookOpen } from "lucide-react";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageAPlusContent from "@/components/PageAPlusContent";

const FEATURES = [
  {
    icon: Shield,
    title: "Rigorous Verification",
    desc: "Every profile undergoes thorough background verification including identity proof, education, employment, and family details before listing.",
  },
  {
    icon: FileCheck,
    title: "Handpicked Profiles",
    desc: "Our team manually reviews each profile to ensure authenticity, completeness, and genuineness — no fake or incomplete profiles.",
  },
  {
    icon: Crown,
    title: "Premium Hindu Families",
    desc: "Exclusively for Hindu families seeking traditional values-based alliances. Profiles include gotra, kundli, rashi, nakshatra, and manglik status.",
  },
  {
    icon: Lock,
    title: "Privacy & Confidentiality",
    desc: "Your personal contact details are never shared publicly. Communication happens only with mutual consent through our verified channels.",
  },
  {
    icon: UserCheck,
    title: "Dedicated Relationship Manager",
    desc: "Each premium member is assigned a personal relationship manager who guides you through the entire matchmaking journey.",
  },
  {
    icon: Award,
    title: "Kundli Matching",
    desc: "AI-powered kundli matching with traditional Ashtakoot analysis to ensure astrological compatibility between prospective matches.",
  },
];

const PROCESS_STEPS = [
  { step: 1, title: "Register & Submit Profile", desc: "Fill the comprehensive registration form with personal, educational, professional, family, and partner preference details." },
  { step: 2, title: "Document Verification", desc: "Our team verifies all submitted documents — Aadhaar, PAN, education certificates, and employment details." },
  { step: 3, title: "Manual Review & Approval", desc: "Each profile is manually reviewed by our matrimony experts for authenticity and completeness before approval." },
  { step: 4, title: "Profile Goes Live", desc: "Once approved, your premium profile is displayed to verified members seeking compatible matches." },
  { step: 5, title: "Curated Matches", desc: "Our relationship managers share curated matches based on your preferences, gotra compatibility, and kundli analysis." },
  { step: 6, title: "Connect & Meet", desc: "Initiate communication with mutual interest. We facilitate introductions and support families through the process." },
];

const STATS = [
  { value: "100%", label: "Verified Profiles" },
  { value: "Premium", label: "Hindu Only" },
  { value: "Manual", label: "Review Process" },
  { value: "Trusted", label: "By Families" },
];

export default function Matrimony() {
  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white py-14 sm:py-20 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-6 right-10 text-9xl font-serif">ॐ</div>
        </div>
        <div className="container mx-auto px-4 relative z-10 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm px-4 py-1.5 rounded-full text-xs text-[#D4AF37] mb-4">
            <Heart className="w-3.5 h-3.5" /> Premium Hindu Matrimony
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold mb-4 leading-tight" data-testid="heading-matrimony">
            Vedic Tatva <span className="text-[#D4AF37]">Matrimony</span>
          </h1>
          <p className="text-white/70 max-w-2xl mx-auto text-sm sm:text-base leading-relaxed mb-8">
            India's most trusted premium Hindu matrimony service. Every profile is handpicked, 
            rigorously verified, and manually approved — delivering authentic, values-based alliances 
            rooted in Sanatan Dharma traditions.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/matrimony/register">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-[#D4AF37] text-white rounded-full font-semibold text-sm shadow-lg hover:bg-[#c4a030] transition-colors flex items-center gap-2"
                data-testid="btn-register-matrimony"
              >
                <Heart className="w-4 h-4" /> Register Now
              </motion.button>
            </Link>
            <Link href="/matrimony/profiles">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-3 bg-white/10 backdrop-blur-sm text-white rounded-full font-semibold text-sm border border-white/20 hover:bg-white/20 transition-colors flex items-center gap-2"
                data-testid="btn-browse-profiles"
              >
                <Eye className="w-4 h-4" /> Browse Profiles
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 -mt-8 relative z-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {STATS.map((stat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * i }}
              className="bg-white rounded-2xl shadow-lg p-4 text-center border border-[#D4AF37]/10"
              data-testid={`stat-${i}`}
            >
              <p className="text-xl sm:text-2xl font-bold text-[#6D2B35]">{stat.value}</p>
              <p className="text-xs text-[#5a4a3a]/50">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold mb-2">Why Choose Vedic Tatva Matrimony?</h2>
          <p className="text-sm text-[#5a4a3a]/60 max-w-xl mx-auto">
            We don't just list profiles — we curate authentic, verified matrimonial matches with the sanctity and respect your family deserves.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feat, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.08 * i }}
              className="bg-white rounded-2xl p-6 shadow-sm border border-[#6D2B35]/5 hover:shadow-md transition-shadow"
              data-testid={`feature-${i}`}
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#D4AF37]/10 to-[#6D2B35]/5 flex items-center justify-center mb-4">
                <feat.icon className="w-6 h-6 text-[#D4AF37]" />
              </div>
              <h3 className="font-serif text-lg text-[#6D2B35] font-semibold mb-2">{feat.title}</h3>
              <p className="text-sm text-[#5a4a3a]/60 leading-relaxed">{feat.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="bg-gradient-to-br from-[#6D2B35]/5 to-[#D4AF37]/5 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold mb-2">How It Works</h2>
            <p className="text-sm text-[#5a4a3a]/60 max-w-lg mx-auto">
              Our premium 6-step process ensures only genuine, verified profiles reach you.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {PROCESS_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.08 * i }}
                className="bg-white rounded-2xl p-6 shadow-sm border border-[#D4AF37]/10 relative"
                data-testid={`step-${i}`}
              >
                <div className="absolute -top-3 -left-2 w-8 h-8 rounded-full bg-gradient-to-br from-[#6D2B35] to-[#8B3A47] text-white text-sm font-bold flex items-center justify-center shadow-lg">
                  {step.step}
                </div>
                <h3 className="font-serif text-lg text-[#6D2B35] font-semibold mb-2 mt-2">{step.title}</h3>
                <p className="text-sm text-[#5a4a3a]/60 leading-relaxed">{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-12">
        <div className="bg-white rounded-3xl shadow-lg border border-[#D4AF37]/15 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 sm:p-12 flex flex-col justify-center">
              <div className="inline-flex items-center gap-2 bg-[#6D2B35]/5 px-3 py-1 rounded-full text-xs text-[#6D2B35] mb-4 w-fit">
                <Heart className="w-3.5 h-3.5 text-[#D4AF37]" /> For Bride & Groom
              </div>
              <h2 className="font-serif text-2xl sm:text-3xl text-[#6D2B35] font-bold mb-4">
                Register Your Profile Today
              </h2>
              <p className="text-sm text-[#5a4a3a]/60 leading-relaxed mb-6">
                Join thousands of verified Hindu families who trust Vedic Tatva Matrimony for 
                finding the perfect life partner. Our paid premium listing ensures your profile 
                gets maximum visibility among serious, family-oriented prospects.
              </p>
              <ul className="space-y-3 mb-6">
                {[
                  "Comprehensive profile with kundli & horoscope details",
                  "Background-verified and manually approved",
                  "Dedicated relationship manager assigned",
                  "Priority matching with compatible profiles",
                  "Privacy-protected contact sharing",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-[#5a4a3a]/70">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link href="/matrimony/register">
                <button className="w-full sm:w-auto px-8 py-3 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] text-white rounded-xl font-semibold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2" data-testid="btn-register-cta">
                  Register as Bride / Groom <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="bg-gradient-to-br from-[#6D2B35] to-[#8B3A47] p-8 sm:p-12 flex flex-col justify-center text-white">
              <Sparkles className="w-10 h-10 text-[#D4AF37] mb-4" />
              <h3 className="font-serif text-xl font-bold mb-3">Premium Paid Listing</h3>
              <p className="text-white/70 text-sm leading-relaxed mb-6">
                Our premium paid model ensures only serious, committed families register — 
                eliminating casual browsers and fake profiles. This creates a curated, 
                high-quality matchmaking environment.
              </p>
              <div className="space-y-4">
                {[
                  { icon: Eye, text: "Enhanced profile visibility to verified members" },
                  { icon: Star, text: "Priority listing in search results" },
                  { icon: Phone, text: "Personal consultation with our matchmaking experts" },
                  { icon: Users, text: "Access to premium verified profiles database" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
                      <item.icon className="w-4 h-4 text-[#D4AF37]" />
                    </div>
                    <p className="text-sm text-white/80">{item.text}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] py-10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-serif text-2xl text-white font-bold mb-2">Ready to Find Your Perfect Match?</h2>
          <p className="text-white/60 text-sm mb-6 max-w-lg mx-auto">
            Register today and let our verified matchmaking service connect you with the right family.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link href="/matrimony/register">
              <button className="px-8 py-3 bg-[#D4AF37] text-white rounded-full font-semibold text-sm hover:bg-[#c4a030] transition-colors" data-testid="btn-footer-register">
                Register Now
              </button>
            </Link>
            <Link href="/contact">
              <button className="px-8 py-3 bg-white/10 text-white rounded-full font-semibold text-sm border border-white/20 hover:bg-white/20 transition-colors" data-testid="btn-footer-contact">
                Contact Us
              </button>
            </Link>
          </div>
        </div>
      </section>

      <PageAPlusContent
        eyebrow="Why Choose Vedic Tatva Matrimony"
        title="Hindu Matrimony — Find Your Sanskari Life Partner With Free Kundli Match"
        intro="Marriage in Sanatan Dharma is a sacred samskara, not just a personal choice. Vedic Tatva matrimony connects sanskari families with verified profiles, integrated 36-point kundli matching, gotra & nakshatra filters, and astrology-aligned compatibility — making the search both faster and more dharmic."
        trustBadges={[
          { value: "100%", label: "Verified Profiles" },
          { value: "36-Pt", label: "Free Kundli Match" },
          { value: "Pan", label: "India + NRI" },
          { value: "Privacy", label: "Family-Safe" },
        ]}
        benefits={[
          { icon: ShieldCheck, title: "100% Verified Profiles", body: "Every profile is verified — government ID, photo, family details, education and employment. No fake profiles, no time-wasters." },
          { icon: Heart, title: "Free Kundli Matching Built-In", body: "Instantly check 36-point Ashtakoot Guna Milan with any profile — Mangal Dosha, Nadi Dosha and Bhakoot Dosha highlighted. No need to leave the platform." },
          { icon: BookOpen, title: "Gotra, Nakshatra & Rashi Filters", body: "Filter by gotra (avoid sagotra marriage), preferred nakshatra, rashi, manglik status, vegetarian preference, sect (Smarta, Vaishnava, Shaiva, Shakta) and parampara." },
          { icon: Users, title: "Family-Centred Search", body: "Designed for parents, siblings and the prospective partner together — share profiles within family, manage shortlists collaboratively." },
          { icon: Lock, title: "Privacy & Safety First", body: "Photos & contact details visible only after both sides express interest. Block, report and family-only viewing options for full control." },
          { icon: Globe, title: "Pan-India + NRI", body: "Profiles from across India and Hindu/Indian-origin singles in USA, UK, Canada, Australia, Singapore, UAE and more — for global Sanatan matrimony." },
        ]}
        steps={[
          { title: "Create Free Profile", body: "Register with basic details, photos, education, employment and family background. Profile verified within 24 hours." },
          { title: "Set Partner Preferences", body: "Filter by age, height, education, profession, gotra, nakshatra, manglik status, sect, language and city." },
          { title: "Browse & Match Kundlis", body: "Browse suggested profiles. Run free 36-point kundli matching with anyone of interest — no extra charge." },
          { title: "Express Interest & Connect", body: "Send interest. When both sides accept, contact details are revealed. Take the next step with family involvement." },
        ]}
        faqs={[
          { q: "Is Vedic Tatva matrimony really for sanskari families?", a: "Yes — every aspect is designed around dharmic values: integrated kundli matching, gotra filtering (preventing sagotra marriage), family-centred profile sharing, sect/parampara filters, and verified profiles only. We don't allow casual dating profiles or non-marriage intent." },
          { q: "Is the kundli matching really free?", a: "Yes — full 36-point Ashtakoot Guna Milan with any profile is completely free, with Mangal Dosha, Nadi Dosha and Bhakoot Dosha automatically flagged. No premium tier, no per-match charge." },
          { q: "How are profiles verified?", a: "Every profile undergoes a multi-step verification: government ID check (Aadhaar or Passport), photo verification via live selfie matching, and family/employment cross-check where available. The Verified badge appears on profiles only after these checks complete successfully." },
          { q: "Can my parents/family help with the search?", a: "Yes — that's the core of our design. Profiles can be shared within your family group. Parents and siblings can suggest matches, run kundli compatibility, and shortlist together. Many of our successful matches start with family-led search." },
          { q: "What does Sagotra mean and why is it avoided?", a: "Sagotra means belonging to the same gotra (paternal lineage from a common rishi). In dharmic tradition, marriage within the same gotra is considered like marrying a sibling. Our gotra filter automatically excludes same-gotra profiles unless you explicitly opt in." },
          { q: "Can NRIs use Vedic Tatva matrimony?", a: "Yes — we have profiles from Indian-origin Hindus settled in USA, UK, Canada, Australia, Singapore, UAE, Germany and more. NRI profiles can specifically filter for India-based or country-of-residence preference." },
          { q: "What is the difference between Vedic Tatva and other matrimony sites?", a: "Three things: (1) free integrated kundli matching with every profile (others charge separately), (2) gotra/nakshatra/sect filters built-in (others lack dharmic depth), (3) verified profiles only with sanskari-family focus (others have casual/dating crossover). We exist purely for dharmic Hindu marriage." },
          { q: "Is the basic matrimony service free?", a: "Yes — creating your profile, browsing matches, running kundli matching and sending limited interest are all free. Premium membership unlocks unlimited interest, contact details viewing without mutual acceptance, and priority profile boost." },
        ]}
        keywordsBlurb="Hindu matrimony for sanskari families — verified profiles with integrated free kundli matching (36-point Ashtakoot Guna Milan, Mangal Dosha, Bhakoot Dosha, Nadi Dosha). Gotra-wise matchmaking for Brahmin, Kshatriya, Vaishya communities. Filter by sect (Smarta, Vaishnava, Shaiva, Shakta), nakshatra, rashi, manglik status, language and parampara. Pan-India profiles plus NRI matrimony for USA, UK, Canada, Australia, Singapore, UAE Hindus. Tamil matrimony, Telugu matrimony, Kannada matrimony, Bengali matrimony, Marathi matrimony, Gujarati matrimony, Punjabi matrimony — all one platform. Family-centred shaadi search with verified profiles only."
      />

      <div className="container mx-auto px-4 pb-12">
        <RelatedServicesSection context="matrimony" currentPath="/matrimony" />
      </div>
    </div>
  );
}
