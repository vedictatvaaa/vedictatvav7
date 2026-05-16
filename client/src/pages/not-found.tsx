import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { Home, Search, ShoppingBag, UserCheck, Sparkles, Calendar, BookOpen, HandHeart, Brain, Flame, ArrowRight, Compass, HeartHandshake } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const popularPages = [
  { title: "Home", href: "/", icon: Home, desc: "Back to homepage" },
  { title: "Shop", href: "/shop", icon: ShoppingBag, desc: "Browse spiritual products" },
  { title: "Book Pandit", href: "/pandits", icon: UserCheck, desc: "Find verified pandits" },
  { title: "Puja Services", href: "/online-puja-booking", icon: Calendar, desc: "Schedule a puja" },
  { title: "Astrology", href: "/astrology", icon: Sparkles, desc: "Kundli & consultations" },
  { title: "AI Kundli", href: "/ai-kundli", icon: Brain, desc: "Free AI kundli report" },
  { title: "Donations", href: "/donations", icon: HandHeart, desc: "Sacred donations" },
  { title: "Kathas", href: "/kathas", icon: BookOpen, desc: "Spiritual stories" },
  { title: "Virtual Puja", href: "/virtual-puja", icon: Flame, desc: "Live online pujas" },
  { title: "Vastu Compass", href: "/vastu-compass", icon: Compass, desc: "AI vastu analysis" },
  { title: "Matrimony", href: "/matrimony", icon: HeartHandshake, desc: "Hindu matrimony" },
];

export default function NotFound() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = () => {
    if (searchQuery.trim()) {
      window.location.href = `/shop?search=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  return (
    <div className="min-h-[80vh] bg-[#F5F0E6] flex flex-col items-center justify-center px-4 py-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-2xl mx-auto"
      >
        <div className="mb-6">
          <motion.div
            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-[#6D2B35]/10 mb-4"
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          >
            <span className="text-5xl font-serif text-[#6D2B35]">ॐ</span>
          </motion.div>
        </div>

        <h1 className="text-4xl md:text-5xl font-serif text-[#6D2B35] mb-3" data-testid="text-404-heading">
          Page Not Found
        </h1>
        <p className="text-[#5a4a3a]/60 mb-2 text-sm">
          The path <span className="font-mono text-xs bg-white px-2 py-0.5 rounded border border-[#6D2B35]/10">{location}</span> doesn't exist.
        </p>
        <p className="text-[#5a4a3a]/50 mb-8 text-sm max-w-md mx-auto">
          Perhaps the sacred path you seek leads elsewhere. Let us guide you to the right destination.
        </p>

        <div className="relative max-w-md mx-auto mb-10">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/30" />
          <input
            type="text"
            placeholder="Search products, services..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            className="w-full pl-11 pr-28 py-3.5 bg-white rounded-full text-sm text-[#5a4a3a] placeholder:text-[#5a4a3a]/35 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30 border border-[#6D2B35]/10 shadow-sm"
            data-testid="input-404-search"
          />
          <Button
            size="sm"
            onClick={handleSearch}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 bg-[#6D2B35] hover:bg-[#5a2430] text-white rounded-full px-5 h-9 text-xs font-medium"
            data-testid="btn-404-search"
          >
            Search
          </Button>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-center gap-3 mb-5">
            <div className="h-px w-8 bg-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-medium">Popular Pages</span>
            <div className="h-px w-8 bg-[#D4AF37]" />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 max-w-xl mx-auto">
            {popularPages.map((page, i) => (
              <motion.div
                key={page.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.05 }}
              >
                <Link href={page.href}>
                  <div className="group cursor-pointer bg-white rounded-xl p-3 border border-[#6D2B35]/5 hover:border-[#D4AF37]/30 hover:shadow-md transition-all text-center" data-testid={`link-404-${page.title.toLowerCase().replace(/\s/g, "-")}`}>
                    <div className="w-9 h-9 rounded-lg bg-[#6D2B35]/5 flex items-center justify-center mx-auto mb-2 group-hover:bg-[#D4AF37]/10 transition-colors">
                      <page.icon className="w-4 h-4 text-[#6D2B35] group-hover:text-[#D4AF37] transition-colors" />
                    </div>
                    <h4 className="text-xs font-medium text-[#6D2B35] mb-0.5">{page.title}</h4>
                    <p className="text-[10px] text-[#5a4a3a]/40">{page.desc}</p>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>

        <Link href="/">
          <Button className="rounded-full bg-[#6D2B35] hover:bg-[#5a2430] text-white px-8 h-11 text-sm font-medium" data-testid="btn-404-home">
            <Home className="h-4 w-4 mr-2" /> Go to Homepage <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </Link>
      </motion.div>
    </div>
  );
}
