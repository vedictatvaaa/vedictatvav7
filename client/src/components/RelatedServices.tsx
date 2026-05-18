import { Link } from "wouter";
import { motion } from "framer-motion";
import { ArrowRight, ShoppingBag, UserCheck, Sparkles, Calendar, BookOpen, HandHeart, Brain, Flame, Hand, Baby, Compass, HeartHandshake, CalendarDays, Trophy, Scale, Leaf, Clock } from "lucide-react";

type ServiceLink = {
  title: string;
  description: string;
  href: string;
  icon: typeof Sparkles;
  color: string;
};

const ALL_SERVICES: ServiceLink[] = [
  { title: "Shop Products", description: "Browse authentic spiritual products", href: "/puja-samagri-online", icon: ShoppingBag, color: "bg-amber-50 text-amber-600" },
  { title: "Puja Essentials", description: "Curated puja items & ritual needs", href: "/spiritual-essentials", icon: Leaf, color: "bg-lime-50 text-lime-600" },
  { title: "Book a Pandit", description: "Verified pandits for all ceremonies", href: "/book-pandit-online", icon: UserCheck, color: "bg-orange-50 text-orange-600" },
  { title: "Book Puja", description: "Schedule sacred puja ceremonies", href: "/online-puja-booking", icon: Calendar, color: "bg-red-50 text-red-600" },
  { title: "Astrology", description: "Expert Vedic astrology consultations", href: "/astrology", icon: Sparkles, color: "bg-purple-50 text-purple-600" },
  { title: "AI Kundli", description: "Free AI-powered kundli analysis", href: "/ai-kundli", icon: Brain, color: "bg-indigo-50 text-indigo-600" },
  { title: "AI Baby Names", description: "Find names by rashi & nakshatra", href: "/ai-baby-names", icon: Baby, color: "bg-pink-50 text-pink-600" },
  { title: "AI Palm Reading", description: "Discover insights from your palm", href: "/ai-palm-reading", icon: Hand, color: "bg-teal-50 text-teal-600" },
  { title: "Virtual Puja", description: "Join live online puja ceremonies", href: "/virtual-puja", icon: Flame, color: "bg-red-50 text-red-600" },
  { title: "Donations", description: "Support temples & sacred causes", href: "/donations", icon: HandHeart, color: "bg-rose-50 text-rose-600" },
  { title: "Kathas", description: "Read AI-narrated spiritual stories", href: "/kathas", icon: BookOpen, color: "bg-orange-50 text-orange-600" },
  { title: "Panchang", description: "Daily Hindu calendar & muhurat", href: "/panchang-calendar", icon: CalendarDays, color: "bg-emerald-50 text-emerald-600" },
  { title: "Vastu Compass", description: "AI-powered Vastu analysis", href: "/vastu-compass", icon: Compass, color: "bg-sky-50 text-sky-600" },
  { title: "Matrimony", description: "Premium Hindu matrimony profiles", href: "/matrimony", icon: HeartHandshake, color: "bg-rose-50 text-rose-600" },
  { title: "My Journey", description: "Track your spiritual progress", href: "/spiritual-dashboard", icon: Trophy, color: "bg-violet-50 text-violet-600" },
  { title: "Compare", description: "Compare spiritual products side by side", href: "/compare", icon: Scale, color: "bg-cyan-50 text-cyan-600" },
  { title: "Muhurat Finder", description: "Find auspicious dates for ceremonies", href: "/muhurat-finder", icon: Clock, color: "bg-purple-50 text-purple-600" },
];

const RELATED_MAP: Record<string, string[]> = {
  "rudraksha": ["/astrology", "/ai-kundli", "/online-puja-booking", "/book-pandit-online", "/spiritual-essentials"],
  "incense": ["/online-puja-booking", "/book-pandit-online", "/virtual-puja", "/spiritual-essentials", "/vastu-compass"],
  "puja": ["/book-pandit-online", "/online-puja-booking", "/virtual-puja", "/donations", "/panchang-calendar", "/puja-samagri-online"],
  "idol": ["/online-puja-booking", "/vastu-compass", "/book-pandit-online", "/donations", "/puja-samagri-online"],
  "wearable": ["/astrology", "/ai-kundli", "/ai-palm-reading", "/puja-samagri-online"],
  "havan": ["/online-puja-booking", "/book-pandit-online", "/virtual-puja", "/puja-samagri-online", "/panchang-calendar"],
  "astrology": ["/ai-kundli", "/ai-palm-reading", "/ai-baby-names", "/book-pandit-online", "/online-puja-booking", "/puja-samagri-online"],
  "pandit": ["/online-puja-booking", "/virtual-puja", "/astrology", "/puja-samagri-online", "/donations", "/panchang-calendar"],
  "puja-booking": ["/book-pandit-online", "/puja-samagri-online", "/virtual-puja", "/astrology", "/donations", "/muhurat-finder"],
  "kundli": ["/astrology", "/ai-palm-reading", "/ai-baby-names", "/book-pandit-online", "/matrimony"],
  "palm": ["/astrology", "/ai-kundli", "/ai-baby-names", "/book-pandit-online"],
  "baby-names": ["/ai-kundli", "/astrology", "/ai-palm-reading", "/book-pandit-online"],
  "donation": ["/online-puja-booking", "/book-pandit-online", "/virtual-puja", "/kathas", "/puja-samagri-online"],
  "katha": ["/donations", "/online-puja-booking", "/book-pandit-online", "/panchang-calendar", "/puja-samagri-online"],
  "vastu": ["/astrology", "/ai-kundli", "/book-pandit-online", "/online-puja-booking", "/puja-samagri-online"],
  "matrimony": ["/astrology", "/ai-kundli", "/book-pandit-online", "/online-puja-booking"],
  "virtual-puja": ["/online-puja-booking", "/book-pandit-online", "/donations", "/puja-samagri-online", "/panchang-calendar"],
  "panchang": ["/astrology", "/online-puja-booking", "/book-pandit-online", "/ai-kundli", "/muhurat-finder"],
  "dashboard": ["/astrology", "/ai-kundli", "/online-puja-booking", "/book-pandit-online", "/puja-samagri-online", "/kathas"],
  "shop": ["/spiritual-essentials", "/online-puja-booking", "/book-pandit-online", "/astrology", "/compare"],
};

function getRelatedServices(context: string, currentPath: string, count: number = 4): ServiceLink[] {
  const relatedPaths = RELATED_MAP[context] || RELATED_MAP["shop"] || [];
  return ALL_SERVICES
    .filter(s => relatedPaths.includes(s.href) && s.href !== currentPath)
    .slice(0, count);
}

function getCategoryContext(category?: string): string {
  if (!category) return "shop";
  const lower = category.toLowerCase();
  if (lower.includes("rudraksha")) return "rudraksha";
  if (lower.includes("incense") || lower.includes("dhoop")) return "incense";
  if (lower.includes("puja") || lower.includes("samagri")) return "puja";
  if (lower.includes("idol") || lower.includes("murti")) return "idol";
  if (lower.includes("wearable") || lower.includes("mala") || lower.includes("bracelet")) return "wearable";
  if (lower.includes("havan")) return "havan";
  return "shop";
}

export function RelatedServicesSection({
  context,
  currentPath = "",
  title = "Explore Related Services",
  count = 4,
}: {
  context: string;
  currentPath?: string;
  title?: string;
  count?: number;
}) {
  const services = getRelatedServices(context, currentPath, count);
  if (services.length === 0) return null;

  return (
    <div className="mt-8" data-testid="section-related-services">
      <div className="flex items-center gap-3 mb-4">
        <div className="h-px flex-1 bg-[#D4AF37]/15" />
        <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium whitespace-nowrap">{title}</span>
        <div className="h-px flex-1 bg-[#D4AF37]/15" />
      </div>
      <div className={`grid grid-cols-2 ${count > 3 ? "md:grid-cols-4" : "md:grid-cols-3"} gap-3`}>
        {services.map((service, i) => (
          <motion.div
            key={service.href}
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
          >
            <Link href={service.href}>
              <div className="group cursor-pointer bg-white rounded-xl p-3.5 border border-[#6D2B35]/5 hover:border-[#D4AF37]/25 hover:shadow-md transition-all duration-300" data-testid={`related-service-${service.href.slice(1)}`}>
                <div className={`w-9 h-9 rounded-lg ${service.color} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}>
                  <service.icon className="w-4 h-4" />
                </div>
                <h4 className="font-medium text-xs text-[#6D2B35] mb-0.5">{service.title}</h4>
                <p className="text-[10px] text-[#5a4a3a]/45 leading-relaxed mb-2">{service.description}</p>
                <span className="text-[10px] font-medium text-[#D4AF37] flex items-center gap-0.5 group-hover:gap-1.5 transition-all">
                  Explore <ArrowRight className="w-2.5 h-2.5" />
                </span>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function ProductRelatedServices({ category }: { category?: string }) {
  const context = getCategoryContext(category);
  return (
    <RelatedServicesSection
      context={context}
      title="Related Spiritual Services"
      count={4}
    />
  );
}

export { getCategoryContext, getRelatedServices, ALL_SERVICES };
