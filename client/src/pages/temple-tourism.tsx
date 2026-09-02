import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import PageSeo from "@/components/PageSeo";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, X, Navigation, Star, Clock, Calendar, ChevronDown, ChevronUp, Filter, Search, Compass, Mountain, Waves, Flame, Crown, Heart, Sun, Sparkles, ArrowRight, Building, Train, Plane, Car, Bus, Info, BookOpen, Route, Globe, Map as MapIcon, Users, Eye, Share2, ChevronRight, Footprints, Trophy, Target, CheckCircle2, Instagram, Twitter, Facebook, Link2, Download, Award, Zap, TrendingUp } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import templeHeroImg from "@/assets/images/temple-hero.jpg";
import jyotirlingaImg from "@/assets/images/jyotirlinga.jpg";
import holyRiverImg from "@/assets/images/holy-river.jpg";
import himalayanTrekImg from "@/assets/images/himalayan-trek.jpg";
import yatraPilgrimsImg from "@/assets/images/yatra-pilgrims.jpg";
import southTempleImg from "@/assets/images/south-temple.jpg";
import shaktiPeethaImg from "@/assets/images/shakti-peetha.jpg";
import { pilgrimageSites, type PilgrimageSite } from "@shared/temple-tourism-data";
import { mergeCompatibility, type CompatibilityItem } from "@/lib/destination-compat";
export { pilgrimageSites } from "@shared/temple-tourism-data";
export type { PilgrimageSite } from "@shared/temple-tourism-data";

const categories = [
  { id: "all", label: "All Sites", labelHindi: "सभी स्थल", icon: MapPin, color: "bg-[#6D2B35]", count: 0 },
  { id: "jyotirlinga", label: "12 Jyotirlingas", labelHindi: "१२ ज्योतिर्लिंग", icon: Flame, color: "bg-orange-600", count: 0 },
  { id: "shaktiPeetha", label: "Shakti Peethas", labelHindi: "शक्तिपीठ", icon: Crown, color: "bg-purple-600", count: 0 },
  { id: "charDham", label: "Char Dham", labelHindi: "चार धाम", icon: Mountain, color: "bg-blue-600", count: 0 },
  { id: "holyRiver", label: "Holy Rivers", labelHindi: "पवित्र नदियाँ", icon: Waves, color: "bg-cyan-600", count: 0 },
  { id: "holyCity", label: "Holy Cities & Birthplaces", labelHindi: "पवित्र नगर", icon: Sparkles, color: "bg-rose-600", count: 0 },
  { id: "famousYatra", label: "Famous Yatras", labelHindi: "प्रसिद्ध यात्राएं", icon: Footprints, color: "bg-amber-600", count: 0 },
  { id: "famousTemple", label: "Renowned Temples", labelHindi: "प्रसिद्ध मंदिर", icon: Building, color: "bg-emerald-600", count: 0 },
  { id: "trek", label: "Treks & Trails", labelHindi: "ट्रेक और मार्ग", icon: Route, color: "bg-teal-600", count: 0 },
];

const categoryImages: Record<string, string> = {
  jyotirlinga: jyotirlingaImg,
  shaktiPeetha: shaktiPeethaImg,
  charDham: himalayanTrekImg,
  holyRiver: holyRiverImg,
  holyCity: yatraPilgrimsImg,
  famousYatra: yatraPilgrimsImg,
  famousTemple: southTempleImg,
  trek: himalayanTrekImg,
};

categories.forEach(cat => {
  cat.count = cat.id === "all" ? pilgrimageSites.length : pilgrimageSites.filter(s => s.category === cat.id).length;
});

interface StateInfo {
  name: string;
  nameHindi: string;
  sites: PilgrimageSite[];
  color: string;
}

function getStateMap(): StateInfo[] {
  const stateMap: Record<string, { nameHindi: string; color: string }> = {
    "Gujarat": { nameHindi: "गुजरात", color: "#EA580C" },
    "Andhra Pradesh": { nameHindi: "आंध्र प्रदेश", color: "#9333EA" },
    "Madhya Pradesh": { nameHindi: "मध्य प्रदेश", color: "#3B82F6" },
    "Uttarakhand": { nameHindi: "उत्तराखंड", color: "#059669" },
    "Maharashtra": { nameHindi: "महाराष्ट्र", color: "#D97706" },
    "Uttar Pradesh": { nameHindi: "उत्तर प्रदेश", color: "#E11D48" },
    "Tamil Nadu": { nameHindi: "तमिल नाडु", color: "#7C3AED" },
    "Jharkhand": { nameHindi: "झारखंड", color: "#0891B2" },
    "J&K": { nameHindi: "जम्मू-कश्मीर", color: "#6366F1" },
    "Assam": { nameHindi: "असम", color: "#10B981" },
    "West Bengal": { nameHindi: "पश्चिम बंगाल", color: "#F59E0B" },
    "Punjab": { nameHindi: "पंजाब", color: "#EF4444" },
    "Odisha": { nameHindi: "ओडिशा", color: "#8B5CF6" },
    "Kerala": { nameHindi: "केरल", color: "#14B8A6" },
    "Multiple States": { nameHindi: "बहु-राज्य", color: "#6D2B35" },
    "MP, Maharashtra, Gujarat": { nameHindi: "म.प्र., महाराष्ट्र, गुजरात", color: "#0891B2" },
    "MH, Telangana, AP": { nameHindi: "म.रा., तेलंगाना, आं.प्र.", color: "#D97706" },
    "Karnataka, Tamil Nadu": { nameHindi: "कर्नाटक, तमिल नाडु", color: "#7C3AED" },
    "Tibet, China": { nameHindi: "तिब्बत, चीन", color: "#6366F1" },
  };
  const grouped: Record<string, PilgrimageSite[]> = {};
  pilgrimageSites.forEach(site => {
    if (!grouped[site.state]) grouped[site.state] = [];
    grouped[site.state].push(site);
  });
  return Object.entries(grouped)
    .map(([name, sites]) => ({ name, nameHindi: stateMap[name]?.nameHindi || name, sites, color: stateMap[name]?.color || "#6D2B35" }))
    .sort((a, b) => b.sites.length - a.sites.length);
}

const pilgrimageGoals = [
  { id: "all12jyotirlinga", title: "Complete 12 Jyotirlingas", titleHindi: "सम्पूर्ण १२ ज्योतिर्लिंग", icon: Flame, color: "#EA580C", siteIds: pilgrimageSites.filter(s => s.category === "jyotirlinga").map(s => s.id), badge: "Jyotirlinga Champion" },
  { id: "shaktipeethas", title: "Shakti Peetha Darshan", titleHindi: "शक्तिपीठ दर्शन", icon: Crown, color: "#9333EA", siteIds: pilgrimageSites.filter(s => s.category === "shaktiPeetha").map(s => s.id), badge: "Shakti Sadhak" },
  { id: "charDham", title: "Char Dham Yatra", titleHindi: "चार धाम यात्रा", icon: Mountain, color: "#3B82F6", siteIds: ["badrinath", "kedarnath", "gangotri", "yamunotri"], badge: "Char Dham Yatri" },
  { id: "holyRivers", title: "Holy Rivers Pilgrimage", titleHindi: "पवित्र नदी तीर्थ", icon: Waves, color: "#0891B2", siteIds: pilgrimageSites.filter(s => s.category === "holyRiver").map(s => s.id), badge: "Nadi Sevak" },
  { id: "famousYatras", title: "Great Yatras of India", titleHindi: "भारत की महान यात्राएं", icon: Footprints, color: "#D97706", siteIds: pilgrimageSites.filter(s => s.category === "famousYatra").map(s => s.id), badge: "Maha Yatri" },
  { id: "templeExplorer", title: "Renowned Temples Tour", titleHindi: "प्रसिद्ध मंदिर दर्शन", icon: Building, color: "#059669", siteIds: pilgrimageSites.filter(s => s.category === "famousTemple").map(s => s.id), badge: "Temple Explorer" },
];

function createMarkerIcon(color: string, isSelected: boolean) {
  const s = isSelected ? 40 : 30;
  const glow = isSelected ? 14 : 8;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${s}" height="${s}" viewBox="0 0 100 100">
    <defs>
      <filter id="glow-${color.replace('#','')}" x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="${glow}" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="bg-${color.replace('#','')}" cx="50%" cy="40%" r="50%">
        <stop offset="0%" stop-color="${color}" stop-opacity="0.9"/>
        <stop offset="100%" stop-color="${color}" stop-opacity="0.6"/>
      </radialGradient>
    </defs>
    <circle cx="50" cy="50" r="42" fill="url(#bg-${color.replace('#','')})" stroke="${color}" stroke-width="3" filter="url(#glow-${color.replace('#','')})" opacity="0.85"/>
    <circle cx="50" cy="50" r="42" fill="none" stroke="white" stroke-width="2" opacity="0.6"/>
    <!-- Temple shikhara -->
    <path d="M50 12 L44 30 L56 30 Z" fill="white" opacity="0.95"/>
    <!-- Temple flag -->
    <line x1="50" y1="8" x2="50" y2="14" stroke="white" stroke-width="2" opacity="0.9"/>
    <path d="M50 8 L57 11 L50 13" fill="#FFD700" opacity="0.9"/>
    <!-- Temple body -->
    <rect x="38" y="30" width="24" height="22" rx="2" fill="white" opacity="0.95"/>
    <!-- Temple pillars -->
    <rect x="41" y="34" width="3" height="18" rx="1" fill="${color}" opacity="0.7"/>
    <rect x="48.5" y="34" width="3" height="18" rx="1" fill="${color}" opacity="0.7"/>
    <rect x="56" y="34" width="3" height="18" rx="1" fill="${color}" opacity="0.7"/>
    <!-- Temple door -->
    <path d="M47 52 L47 42 Q50 38 53 42 L53 52 Z" fill="${color}" opacity="0.8"/>
    <!-- Temple base/steps -->
    <rect x="34" y="52" width="32" height="4" rx="1" fill="white" opacity="0.9"/>
    <rect x="30" y="56" width="40" height="4" rx="1" fill="white" opacity="0.8"/>
    <!-- Side domes -->
    <ellipse cx="36" cy="32" rx="5" ry="4" fill="white" opacity="0.85"/>
    <ellipse cx="64" cy="32" rx="5" ry="4" fill="white" opacity="0.85"/>
    <!-- Om symbol at base -->
    <text x="50" y="72" text-anchor="middle" font-size="14" fill="white" font-weight="bold" opacity="0.9">Om</text>
  </svg>`;
  return L.divIcon({
    html: `<div style="display:flex;align-items:center;justify-content:center;filter:drop-shadow(0 0 ${isSelected ? '8' : '4'}px ${color});">${svg}</div>`,
    className: '',
    iconSize: [s, s],
    iconAnchor: [s / 2, s / 2],
    popupAnchor: [0, -s / 2],
  });
}

function MapUpdater({ selectedSite }: { selectedSite: PilgrimageSite | null }) {
  const map = useMap();
  useEffect(() => {
    if (selectedSite) {
      map.flyTo([selectedSite.lat, selectedSite.lng], 8, { duration: 0.8 });
    }
  }, [selectedSite, map]);
  return null;
}

function LeafletMap({ sites, selectedSite, onSelectSite }: {
  sites: PilgrimageSite[];
  selectedSite: PilgrimageSite | null;
  onSelectSite: (site: PilgrimageSite) => void;
}) {
  return (
    <MapContainer
      center={[22.5, 79.0]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      className="rounded-b-none z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapUpdater selectedSite={selectedSite} />
      {sites.map((site) => (
        <Marker
          key={site.id}
          position={[site.lat, site.lng]}
          icon={createMarkerIcon(site.color, selectedSite?.id === site.id)}
          eventHandlers={{ click: () => onSelectSite(site) }}
        >
          <Popup>
            <div className="min-w-[200px]">
              <h3 className="font-bold text-sm" style={{ color: site.color }}>{site.name}</h3>
              <p className="text-xs text-gray-500">{site.nameHindi}</p>
              <p className="text-xs mt-1">{site.significance}</p>
              <p className="text-xs text-gray-400 mt-1">{site.location}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-xs text-yellow-600">★ {site.rating}</span>
                <span className="text-[10px] text-gray-400">| {site.bestTime}</span>
              </div>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

export default function TempleTourism() {
  const { data: canonicalTemples } = useQuery<{ items: CompatibilityItem[] }>({ queryKey: ["/api/destination-compatibility/temple"] });
  const { data: canonicalTirths } = useQuery<{ items: CompatibilityItem[] }>({ queryKey: ["/api/destination-compatibility/tirth"] });
  // Static source is immediate/failure fallback. Only server-published,
  // explicitly source-keyed records can alter scalar display fields.
  const displayedSites = useMemo(() => mergeCompatibility(
    pilgrimageSites,
    [...(canonicalTemples?.items || []), ...(canonicalTirths?.items || [])],
    (site) => `temple-tourism:${site.id}`,
  ), [canonicalTemples, canonicalTirths]);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedSite, setSelectedSite] = useState<PilgrimageSite | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [hoveredSite, setHoveredSite] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [expandedCircuit, setExpandedCircuit] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<"map" | "list">("map");
  const [expandedState, setExpandedState] = useState<string | null>(null);
  const [visitedSites, setVisitedSites] = useState<Set<string>>(() => {
    try { const saved = localStorage.getItem("vedictatva_visited_sites"); return saved ? new Set(JSON.parse(saved)) : new Set<string>(); } catch { return new Set<string>(); }
  });
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareGoal, setShareGoal] = useState<typeof pilgrimageGoals[0] | null>(null);

  const stateData = useMemo(() => getStateMap(), []);

  const toggleVisited = useCallback((siteId: string) => {
    setVisitedSites(prev => {
      const next = new Set(prev);
      if (next.has(siteId)) next.delete(siteId); else next.add(siteId);
      localStorage.setItem("vedictatva_visited_sites", JSON.stringify(Array.from(next)));
      return next;
    });
  }, []);

  const handleShare = useCallback((platform: string, goal: typeof pilgrimageGoals[0]) => {
    const completed = goal.siteIds.filter(id => visitedSites.has(id)).length;
    const total = goal.siteIds.length;
    const pct = Math.round((completed / total) * 100);
    const text = `I've completed ${completed}/${total} (${pct}%) of the ${goal.title} on my spiritual journey with Vedic Tatva! #VedicTatva #SpiritualJourney #${goal.id.replace(/([A-Z])/g, '_$1').toUpperCase()}`;
    const url = "https://vedictatva.com/temple-tourism";
    const encodedText = encodeURIComponent(text);
    const encodedUrl = encodeURIComponent(url);
    let shareUrl = "";
    if (platform === "twitter") shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
    else if (platform === "facebook") shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
    else if (platform === "whatsapp") shareUrl = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
    else if (platform === "copy") { navigator.clipboard.writeText(`${text}\n${url}`); return; }
    if (shareUrl) window.open(shareUrl, "_blank", "width=600,height=400");
  }, [visitedSites]);

  const filteredSites = useMemo(() => {
    return displayedSites.filter(site => {
      const matchesCategory = selectedCategory === "all" || site.category === selectedCategory;
      const matchesSearch = !searchQuery ||
        site.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.nameHindi.includes(searchQuery) ||
        site.state.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.deity.toLowerCase().includes(searchQuery.toLowerCase()) ||
        site.famousFor.some(f => f.toLowerCase().includes(searchQuery.toLowerCase()));
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery, displayedSites]);

  return (
    <>
      <PageSeo
        title="Sacred Pilgrimage Map of India — Temple Tourism | Vedic Tatva"
        description="Explore 50+ sacred pilgrimage sites across India including 12 Jyotirlingas, Shakti Peethas, Char Dham, Holy Rivers, Famous Yatras, and renowned temples. Plan your spiritual journey with how-to-reach guides, best visiting times, and insider tips."
        canonical="/temple-tourism"
        twitterCard="summary_large_image"
        schemas={[{
          id: "tourist-attraction",
          payload: {
            "@context": "https://schema.org",
            "@type": "TouristAttraction",
            name: "Sacred Pilgrimage Sites of India — Interactive Temple Tourism Map",
            description: "Explore 50+ sacred pilgrimage sites across India including 12 Jyotirlingas, Shakti Peethas, Char Dham, Holy Rivers, Famous Yatras, and renowned temples. Plan your spiritual journey with how-to-reach guides, best visiting times, and insider tips.",
            url: "https://vedictatva.com/temple-tourism",
            touristType: ["Pilgrimage", "Religious Tourism", "Spiritual Tourism"],
            geo: { "@type": "GeoCoordinates", latitude: "20.5937", longitude: "78.9629" },
            isAccessibleForFree: true,
          },
        }]}
      />
      <div className="min-h-screen bg-[#F5F0E6]" data-testid="temple-tourism-page">
        <header className="relative overflow-hidden border-b border-[#D4AF37]/30">
          <div className="absolute inset-0">
            <img src={templeHeroImg} alt="Sacred temples of India" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-[#1a1118]/80" />
            <div className="absolute inset-0 bg-gradient-to-b from-[#6D2B35]/70 via-[#3a1a20]/85 to-[#1a1118]/95" />
          </div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
          <div className="relative z-10 max-w-7xl mx-auto px-4 py-12 md:py-16">
            <div className="text-center max-w-3xl mx-auto">
              <div className="flex items-center justify-center gap-2.5 mb-3">
                <span className="h-px w-6 bg-[#D4AF37]" />
                <span className="text-[#D4AF37] font-semibold tracking-[0.3em] text-[10px] uppercase">Temple Tourism Encyclopedia</span>
                <span className="h-px w-6 bg-[#D4AF37]" />
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-semibold text-white mb-3 leading-tight" data-testid="temple-tourism-title">
                Sacred Pilgrimage Map of India
                <span className="block text-[#D4AF37] text-base md:text-xl mt-2 font-normal tracking-wide">भारत का पवित्र तीर्थ यात्रा मानचित्र</span>
              </h1>
              <p className="text-white/70 mx-auto text-[13px] md:text-sm leading-relaxed max-w-2xl">
                Your complete spiritual travel encyclopedia — 12 Jyotirlingas, Shakti Peethas, Char Dham, sacred rivers, famous yatras, holy cities, renowned temples and ancient trek trails.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 mt-6 text-white/65 text-[12px]">
                <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> {pilgrimageSites.length}+ Sacred Sites</span>
                <span className="inline-flex items-center gap-1.5"><Flame className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> All 12 Jyotirlingas</span>
                <span className="inline-flex items-center gap-1.5"><Crown className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Major Shakti Peethas</span>
                <span className="inline-flex items-center gap-1.5"><Waves className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Holy Rivers & Yatras</span>
              </div>
            </div>
          </div>
        </header>

        <nav className="sticky top-0 z-40 bg-[#FBF7EE]/95 backdrop-blur-md border-b border-[#D4AF37]/25" aria-label="Pilgrimage categories">
          <div className="max-w-7xl mx-auto px-4">
            <div className="flex items-center gap-1.5 py-2.5 overflow-x-auto scrollbar-hide">
              {categories.map((cat) => {
                const active = selectedCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[12px] font-semibold whitespace-nowrap transition-colors border ${
                      active
                        ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]"
                        : "bg-white text-[#6D2B35] border-[#D4AF37]/25 hover:bg-[#FBF7EE]"
                    }`}
                    data-testid={`category-filter-${cat.id}`}
                  >
                    <cat.icon className="h-3.5 w-3.5" strokeWidth={1.8} />
                    {cat.label}
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${active ? "bg-[#D4AF37]/20 text-[#D4AF37]" : "bg-[#FBF7EE] text-[#6D2B35]/70 border border-[#D4AF37]/20"}`}>{cat.count}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-2.5 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/45" strokeWidth={1.8} />
              <input
                type="text"
                placeholder="Search temples, cities, deities, rivers, yatras…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 h-10 rounded-md border border-[#D4AF37]/30 bg-white text-[13px] text-[#3a1a20] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]"
                data-testid="temple-search-input"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("map")}
                className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider border transition-colors ${viewMode === "map" ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30 hover:bg-[#FBF7EE]"}`}
                data-testid="view-map-btn"
              >
                <MapIcon className="h-4 w-4" strokeWidth={1.8} /> Map
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`inline-flex items-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider border transition-colors ${viewMode === "list" ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-white text-[#6D2B35] border-[#D4AF37]/30 hover:bg-[#FBF7EE]"}`}
                data-testid="view-list-btn"
              >
                <BookOpen className="h-4 w-4" strokeWidth={1.8} /> Encyclopedia
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {viewMode === "map" && (
              <div className="lg:col-span-2">
                <div className="relative overflow-hidden bg-white border border-[#D4AF37]/25 rounded-lg" data-testid="india-map-container">
                  <div className="p-3.5 border-b border-[#D4AF37]/20 flex items-center justify-between bg-[#FBF7EE]">
                    <h2 className="font-serif font-semibold text-[15px] text-[#6D2B35]">Sacred Pilgrimage Map <span className="text-[11px] font-normal text-[#5a4a3a]/55 ml-1">भारत का तीर्थ मानचित्र</span></h2>
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">{filteredSites.length} sites</span>
                  </div>
                  <div className="relative" style={{ height: '600px' }}>
                    <LeafletMap sites={filteredSites} selectedSite={selectedSite} onSelectSite={setSelectedSite} />
                  </div>
                  <div className="px-4 py-2.5 flex flex-wrap gap-x-3 gap-y-1.5 border-t border-[#D4AF37]/20 bg-[#FBF7EE]/70">
                    {categories.filter(c => c.id !== "all").map(cat => (
                      <div key={cat.id} className="flex items-center gap-1.5 text-[10px] text-[#5a4a3a]/65"><div className={`w-2 h-2 rounded-full ${cat.color}`} /><span>{cat.label}</span></div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className={viewMode === "list" ? "lg:col-span-3" : "lg:col-span-1"}>
              <AnimatePresence mode="wait">
                {selectedSite ? (
                  <motion.div key="detail" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}>
                    <div className="overflow-hidden border border-[#D4AF37]/30 bg-white rounded-lg" data-testid="site-detail-card">
                      <div className="relative p-5 text-white overflow-hidden border-b border-[#D4AF37]/30" style={{ backgroundColor: selectedSite.color }}>
                        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                        <button onClick={() => setSelectedSite(null)} className="absolute top-3 right-3 w-7 h-7 rounded-md bg-white/15 hover:bg-white/25 flex items-center justify-center transition-colors z-10" data-testid="close-site-detail" aria-label="Close"><X className="h-3.5 w-3.5" strokeWidth={1.8} /></button>
                        <span className="text-[10px] uppercase tracking-[0.25em] font-semibold opacity-85">{categories.find(c => c.id === selectedSite.category)?.label}</span>
                        <h2 className="font-serif font-semibold text-xl mt-1.5" data-testid="site-detail-name">{selectedSite.name}</h2>
                        <p className="text-[13px] opacity-80">{selectedSite.nameHindi}</p>
                        <div className="flex items-center gap-1.5 mt-2 text-[12px] opacity-80"><MapPin className="h-3.5 w-3.5" strokeWidth={1.8} />{selectedSite.location}</div>
                        {selectedSite.annualVisitors && <div className="flex items-center gap-1.5 mt-1 text-[11px] opacity-70"><Users className="h-3 w-3" strokeWidth={1.8} />{selectedSite.annualVisitors} annual visitors</div>}
                      </div>
                      <div className="p-5 space-y-4">
                        <p className="text-[13px] text-[#5a4a3a]/80 leading-relaxed" data-testid="site-detail-description">{selectedSite.description}</p>
                        <div>
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">Famous For</h4>
                          <div className="flex flex-wrap gap-1.5">
                            {selectedSite.famousFor.map((f, i) => (
                              <span key={i} className="text-[11px] px-2 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${selectedSite.color}10`, color: selectedSite.color, borderColor: `${selectedSite.color}40` }}>{f}</span>
                            ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2.5">
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Deity</span><p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedSite.deity}</p></div>
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Rating</span><div className="flex items-center gap-1 mt-0.5"><Star className="h-3.5 w-3.5 text-[#D4AF37] fill-[#D4AF37]" /><span className="text-[13px] font-semibold text-[#6D2B35]">{selectedSite.rating}</span></div></div>
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Best Time</span><p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedSite.bestTime}</p></div>
                          <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3"><span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold">Established</span><p className="text-[13px] font-semibold text-[#6D2B35] mt-0.5">{selectedSite.established}</p></div>
                        </div>
                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-4">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-3 flex items-center gap-1.5"><Navigation className="h-3 w-3" strokeWidth={1.8} /> How to Reach</h4>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2 text-[12px]"><Plane className="h-3.5 w-3.5 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /><div><span className="font-semibold text-[#6D2B35]">By Air: </span><span className="text-[#5a4a3a]/75">{selectedSite.howToReach.air}</span></div></div>
                            <div className="flex items-start gap-2 text-[12px]"><Train className="h-3.5 w-3.5 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /><div><span className="font-semibold text-[#6D2B35]">By Rail: </span><span className="text-[#5a4a3a]/75">{selectedSite.howToReach.rail}</span></div></div>
                            <div className="flex items-start gap-2 text-[12px]"><Car className="h-3.5 w-3.5 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /><div><span className="font-semibold text-[#6D2B35]">By Road: </span><span className="text-[#5a4a3a]/75">{selectedSite.howToReach.road}</span></div></div>
                          </div>
                        </div>
                        <div className="bg-[#6D2B35]/5 rounded-md p-4 border border-[#D4AF37]/30">
                          <h4 className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2 flex items-center gap-1.5"><Info className="h-3 w-3" strokeWidth={1.8} /> Insider Tips & Know-How</h4>
                          <p className="text-[12px] text-[#5a4a3a]/80 leading-relaxed">{selectedSite.knowHow}</p>
                        </div>
                        <div className="flex items-center gap-2 pt-2">
                          <button onClick={() => toggleVisited(selectedSite.id)} className={`flex-1 inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider border transition-colors ${visitedSites.has(selectedSite.id) ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600" : "bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] border-[#6D2B35]"}`} data-testid="mark-visited-btn">
                            <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={1.8} />
                            {visitedSites.has(selectedSite.id) ? "Visited" : "Mark Visited"}
                          </button>
                          <button onClick={() => { const text = `I visited ${selectedSite.name} (${selectedSite.nameHindi}) — ${selectedSite.significance}! #VedicTatva #SpiritualJourney`; const url = "https://vedictatva.com/temple-tourism"; window.open(`https://wa.me/?text=${encodeURIComponent(text + "\n" + url)}`, "_blank"); }} className="inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-[12px] font-semibold uppercase tracking-wider bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/40 hover:bg-[#6D2B35]/5 transition-colors" data-testid="share-site-btn">
                            <Share2 className="h-3.5 w-3.5" strokeWidth={1.8} /> Share
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="yatras" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                    <div className="border border-[#D4AF37]/25 rounded-lg overflow-hidden bg-white" data-testid="yatra-circuits-card">
                      <div className="p-4 border-b border-[#D4AF37]/20 bg-[#FBF7EE]">
                        <h3 className="font-serif font-semibold text-[15px] text-[#6D2B35] flex items-center gap-2"><Route className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} /> Major Yatras & Darshan Circuits</h3>
                        <p className="text-[11px] text-[#5a4a3a]/55 mt-0.5">Clubbed pilgrimages & famous yatra routes</p>
                      </div>
                      <div className="divide-y divide-[#D4AF37]/15">
                        {[
                          { name: "Char Dham Yatra", nameHindi: "चार धाम यात्रा", description: "The supreme Hindu pilgrimage — Badrinath, Kedarnath, Gangotri & Yamunotri in the Himalayas.", sites: ["Yamunotri → Gangotri → Kedarnath → Badrinath"], duration: "10-12 Days", difficulty: "Moderate to Difficult", color: "#3B82F6", season: "May - October", icon: Mountain, howToReach: "Start from Haridwar/Rishikesh. Book GMVN packages or private tours. Helicopter options available.", tips: "Open only 6 months. Start from Yamunotri. Carry warm clothes, rain gear. Altitude sickness above 3,000m possible." },
                          { name: "12 Jyotirlinga Darshan", nameHindi: "१२ ज्योतिर्लिंग दर्शन", description: "Visit all 12 divine Jyotirlingas where Lord Shiva manifested as infinite pillars of light across 10+ states.", sites: ["Somnath → Nageshwar → Mahakaleshwar → Omkareshwar → Bhimashankar → Trimbakeshwar → Grishneshwar → Vaidyanath → Kashi Vishwanath → Kedarnath → Rameshwaram → Mallikarjuna"], duration: "20-30 Days", difficulty: "Moderate", color: "#EA580C", season: "October - March", icon: Flame, howToReach: "Plan region-wise: Western (Gujarat-Maharashtra), Central (MP), Northern (UP-Uttarakhand), Eastern (Jharkhand), Southern (TN-AP)", tips: "Somnath → clockwise is traditional. Can be done in segments over multiple trips." },
                          { name: "Shakti Peetha Yatra", nameHindi: "शक्तिपीठ यात्रा", description: "Visit the sacred shrines of the Divine Mother — where parts of Goddess Sati's body fell across the subcontinent.", sites: ["Vaishno Devi → Vindhyavasini → Kalighat → Kamakhya → Ambaji → Srisailam"], duration: "12-15 Days", difficulty: "Moderate", color: "#9333EA", season: "Navratri (March/October)", icon: Crown, howToReach: "Multiple routes possible — plan region-wise. All major Shakti Peethas well connected by road/rail.", tips: "Visit during Navratri for the most powerful experience. Kamakhya during Ambubachi Mela (June) is extraordinary." },
                          { name: "Kawad Yatra", nameHindi: "काँवड़ यात्रा", description: "The massive Shravan month pilgrimage carrying sacred Ganga water from Haridwar. Millions walk barefoot chanting 'Bol Bam!'", sites: ["Haridwar → Meerut → Delhi → Deoghar"], duration: "3-15 Days", difficulty: "Moderate", color: "#D97706", season: "July - August (Shravan)", icon: Footprints, howToReach: "Start from Haridwar. Ganga water collected at Har Ki Pauri. Return to local temples or Baidyanath Dham.", tips: "Kawad must not touch ground once filled. Free food camps line the route." },
                          { name: "Narmada Parikrama", nameHindi: "नर्मदा परिक्रमा", description: "The epic 2,600 km circumambulation of River Narmada on foot — takes 3+ years for the full journey.", sites: ["Amarkantak → Omkareshwar → Maheshwar → Bharuch → Back along south bank"], duration: "3 Years (full) / 108 Days (short)", difficulty: "Extreme / Moderate", color: "#0891B2", season: "Year-round", icon: Waves, howToReach: "Start at Amarkantak in Madhya Pradesh. Most walk. Some ashrams provide basic amenities along the route.", tips: "Walk with river on right (clockwise). Never cross the river by bridge. Short versions covering key sites exist." },
                          { name: "South India Temple Circuit", nameHindi: "दक्षिण भारत मंदिर परिक्रमा", description: "Explore magnificent Dravidian temples — towering gopurams, ancient rituals, and 2,000+ years of architectural wonders.", sites: ["Tirupati → Srirangam → Thanjavur → Madurai → Rameshwaram → Guruvayur"], duration: "10-15 Days", difficulty: "Easy", color: "#059669", season: "October - March", icon: Building, howToReach: "Fly into Chennai or Madurai. Well-connected rail network. KSRTC/TNSTC buses available.", tips: "South Indian temples have strict dress codes. Most close 12-4 PM. Eat at temple Annadanam for authentic experience." },
                          { name: "Om Parvat Yatra", nameHindi: "ॐ पर्वत यात्रा", description: "Trek to witness the sacred Om symbol naturally formed by snow on Om Parvat (6,191m) in the Kumaon Himalayas near Adi Kailash.", sites: ["Dharchula → Gala → Budhi → Gunji → Nabhidhang → Om Parvat viewpoint"], duration: "12-14 Days", difficulty: "Difficult", color: "#7C3AED", season: "June - September", icon: Mountain, howToReach: "Reach Dharchula from Delhi via Kathgodam/Pithoragarh. Inner Line Permit required. KMVN organizes group treks.", tips: "Altitude reaches 5,000m+. Carry all essentials. Limited mobile connectivity. Inner Line Permit mandatory from SDM Dharchula." },
                          { name: "Panch Kedar Yatra", nameHindi: "पंच केदार यात्रा", description: "Visit all five Kedars in Uttarakhand where different body parts of Lord Shiva appeared — an advanced Himalayan pilgrimage.", sites: ["Kedarnath → Tungnath → Rudranath → Madhyamaheshwar → Kalpeshwar"], duration: "14-18 Days", difficulty: "Difficult", color: "#B45309", season: "May - October", icon: Mountain, howToReach: "Start from Rishikesh/Haridwar. Each Kedar requires separate treks. Kalpeshwar is the only one accessible year-round.", tips: "Tungnath is the highest Shiva temple in the world (3,680m). Do Kalpeshwar last as it's easiest. Rudranath trek is the most challenging." },
                        ].map((circuit, i) => {
                          const isOpen = expandedCircuit === i;
                          const CircuitIcon = circuit.icon;
                          return (
                            <div key={i} data-testid={`yatra-dropdown-${i}`}>
                              <button onClick={() => setExpandedCircuit(isOpen ? null : i)} className="w-full text-left px-4 py-3 hover:bg-[#FBF7EE] transition-colors">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: `${circuit.color}10`, color: circuit.color, borderColor: `${circuit.color}30` }}>
                                    <CircuitIcon className="h-4 w-4" strokeWidth={1.8} />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <p className="text-[13px] font-semibold text-[#6D2B35]">{circuit.name}</p>
                                      <span className="text-[10px] text-[#5a4a3a]/40">{circuit.nameHindi}</span>
                                    </div>
                                    <p className="text-[11px] text-[#5a4a3a]/55 truncate mt-0.5">{circuit.duration} · {circuit.season}</p>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] px-2 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${circuit.color}10`, color: circuit.color, borderColor: `${circuit.color}30` }}>{circuit.difficulty}</span>
                                    {isOpen ? <ChevronUp className="h-4 w-4 text-[#6D2B35]/40" /> : <ChevronDown className="h-4 w-4 text-[#6D2B35]/40" />}
                                  </div>
                                </div>
                              </button>
                              <AnimatePresence>
                                {isOpen && (
                                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                    <div className="px-4 pb-4 space-y-2.5">
                                      <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{circuit.description}</p>
                                      {circuit.sites.map((s, j) => (
                                        <div key={j} className="text-[11px] px-3 py-2 rounded-md font-semibold" style={{ backgroundColor: `${circuit.color}08`, color: circuit.color, borderLeft: `2px solid ${circuit.color}` }}>
                                          <Route className="h-3 w-3 inline mr-1.5" strokeWidth={1.8} />{s}
                                        </div>
                                      ))}
                                      <div className="grid grid-cols-3 gap-1.5">
                                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-2"><span className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Duration</span><p className="text-[11px] font-semibold text-[#6D2B35] mt-0.5">{circuit.duration}</p></div>
                                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-2"><span className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Level</span><p className="text-[11px] font-semibold text-[#6D2B35] mt-0.5">{circuit.difficulty}</p></div>
                                        <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-2"><span className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold">Season</span><p className="text-[11px] font-semibold text-[#6D2B35] mt-0.5">{circuit.season}</p></div>
                                      </div>
                                      <div className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3">
                                        <span className="text-[9px] uppercase tracking-[0.25em] text-[#5a4a3a]/55 font-semibold flex items-center gap-1"><Navigation className="h-2.5 w-2.5" strokeWidth={1.8} /> How to Reach</span>
                                        <p className="text-[11px] text-[#5a4a3a]/70 mt-1 leading-relaxed">{circuit.howToReach}</p>
                                      </div>
                                      <div className="bg-[#6D2B35]/5 rounded-md p-3 border border-[#D4AF37]/30">
                                        <span className="text-[9px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold flex items-center gap-1"><Info className="h-2.5 w-2.5" strokeWidth={1.8} /> Insider Tips</span>
                                        <p className="text-[11px] text-[#5a4a3a]/70 mt-1 leading-relaxed">{circuit.tips}</p>
                                      </div>
                                    </div>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* ===== EXPLORE BY STATE ===== */}
          <section className="mt-12 mb-8" aria-labelledby="explore-by-state">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-[#D4AF37]/30" />
              <h2 id="explore-by-state" className="font-serif text-lg font-semibold text-[#6D2B35]">Explore by State</h2>
              <div className="h-px flex-1 bg-[#D4AF37]/30" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {stateData.map((st) => {
                const isExpanded = expandedState === st.name;
                const groupedByCat: Record<string, PilgrimageSite[]> = {};
                st.sites.forEach(s => { const cat = categories.find(c => c.id === s.category); const label = cat?.label || s.category; if (!groupedByCat[label]) groupedByCat[label] = []; groupedByCat[label].push(s); });
                return (
                  <motion.div key={st.name} layout className={isExpanded ? "col-span-2 md:col-span-3 lg:col-span-4" : ""}>
                    <div className={`bg-white border border-[#D4AF37]/25 rounded-lg overflow-hidden transition-colors cursor-pointer ${isExpanded ? '' : 'hover:border-[#D4AF37]/45'}`} data-testid={`state-card-${st.name}`}>
                      <button onClick={() => setExpandedState(isExpanded ? null : st.name)} className="w-full text-left p-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-md flex items-center justify-center text-white font-bold text-[12px] border" style={{ backgroundColor: st.color, borderColor: st.color }}>{st.sites.length}</div>
                            <div>
                              <h3 className="text-[13px] font-semibold text-[#6D2B35]">{st.name}</h3>
                              <p className="text-[10px] text-[#5a4a3a]/45 mt-0.5">{st.nameHindi}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="flex -space-x-1">
                              {st.sites.slice(0, 3).map((s, i) => {
                                const CatIcon = categories.find(c => c.id === s.category)?.icon || MapPin;
                                return <div key={i} className="w-4 h-4 rounded-sm flex items-center justify-center text-white border border-white" style={{ backgroundColor: s.color }}><CatIcon className="h-2 w-2" strokeWidth={2} /></div>;
                              })}
                              {st.sites.length > 3 && <div className="w-4 h-4 rounded-sm flex items-center justify-center bg-[#FBF7EE] text-[#6D2B35] text-[8px] font-bold border border-white">+{st.sites.length - 3}</div>}
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-[#6D2B35]/40" /> : <ChevronDown className="h-4 w-4 text-[#6D2B35]/40" />}
                          </div>
                        </div>
                      </button>
                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-[#D4AF37]/15">
                            <div className="px-4 py-4 space-y-4">
                              {Object.entries(groupedByCat).map(([catLabel, sites]) => {
                                const catObj = categories.find(c => c.label === catLabel);
                                const CatIcon = catObj?.icon || MapPin;
                                return (
                                  <div key={catLabel}>
                                    <div className="flex items-center gap-2 mb-2.5 pb-2 border-b border-[#D4AF37]/15">
                                      <div className={`w-5 h-5 rounded-sm ${catObj?.color || 'bg-[#6D2B35]'} flex items-center justify-center`}>
                                        <CatIcon className="h-2.5 w-2.5 text-white" strokeWidth={2} />
                                      </div>
                                      <span className="text-[11px] font-semibold text-[#6D2B35] uppercase tracking-wider">{catLabel}</span>
                                      <span className="text-[10px] text-[#5a4a3a]/40">({sites.length})</span>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5">
                                      {sites.map(site => (
                                        <div
                                          key={site.id}
                                          onClick={(e) => { e.stopPropagation(); setSelectedSite(site); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
                                          className="p-3 rounded-md bg-white border border-[#D4AF37]/20 hover:border-[#D4AF37]/55 transition-colors cursor-pointer group"
                                          data-testid={`state-site-${site.id}`}
                                        >
                                          <div className="flex items-start gap-2.5">
                                            <div className="w-8 h-8 rounded-md flex items-center justify-center flex-shrink-0 border" style={{ backgroundColor: `${site.color}10`, color: site.color, borderColor: `${site.color}30` }}>
                                              <CatIcon className="h-3.5 w-3.5" strokeWidth={1.8} />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <p className="text-[12px] font-semibold text-[#6D2B35] truncate group-hover:text-[#D4AF37] transition-colors">{site.name}</p>
                                                <span className="text-[10px] text-[#5a4a3a]/40">{site.nameHindi}</span>
                                              </div>
                                              <p className="text-[10px] text-[#5a4a3a]/55 truncate mt-0.5">{site.location}</p>
                                            </div>
                                            <div className="flex items-center gap-1 flex-shrink-0">
                                              {visitedSites.has(site.id) && <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" strokeWidth={1.8} />}
                                              <Star className="h-3 w-3 text-[#D4AF37] fill-[#D4AF37]" />
                                              <span className="text-[10px] font-semibold text-[#6D2B35]">{site.rating}</span>
                                            </div>
                                          </div>
                                          <p className="text-[10px] text-[#5a4a3a]/60 mt-2 line-clamp-2 leading-relaxed">{site.description.slice(0, 120)}…</p>
                                          <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                            <span className="text-[9px] px-1.5 py-0.5 rounded-md font-semibold border" style={{ backgroundColor: `${site.color}10`, color: site.color, borderColor: `${site.color}30` }}>{site.significance.split("—")[0].trim()}</span>
                                            <span className="text-[10px] text-[#5a4a3a]/40 flex items-center gap-0.5"><Clock className="h-2.5 w-2.5" strokeWidth={1.8} /> {site.bestTime}</span>
                                            {site.annualVisitors && <span className="text-[10px] text-[#5a4a3a]/40 flex items-center gap-0.5"><Users className="h-2.5 w-2.5" strokeWidth={1.8} /> {site.annualVisitors}</span>}
                                          </div>
                                          <div className="flex items-center gap-2 mt-2 pt-2 border-t border-[#D4AF37]/15">
                                            <span className="text-[10px] text-[#5a4a3a]/45 flex items-center gap-1"><Sparkles className="h-2.5 w-2.5" strokeWidth={1.8} /> {site.deity}</span>
                                            <span className="ml-auto text-[10px] text-[#6D2B35]/45 group-hover:text-[#D4AF37] transition-colors flex items-center gap-0.5 font-semibold">View <ChevronRight className="h-3 w-3" /></span>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>

          {/* ===== PILGRIMAGE GOALS & SOCIAL SHOWOFF ===== */}
          <section className="mt-12 mb-8" aria-labelledby="pilgrimage-goals">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-[#6D2B35]/10" />
              <h2 id="pilgrimage-goals" className="font-['Playfair_Display'] text-xl text-[#6D2B35] flex items-center gap-2"><Trophy className="h-5 w-5 text-[#D4AF37]" /> Pilgrimage Goals & Achievements</h2>
              <div className="h-px flex-1 bg-[#6D2B35]/10" />
            </div>
            <p className="text-center text-sm text-[#5a4a3a]/50 mb-6 max-w-2xl mx-auto">Track your spiritual journey by marking temples you've visited. Complete goals to earn badges and share your progress with friends and family!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {pilgrimageGoals.map((goal) => {
                const completed = goal.siteIds.filter(id => visitedSites.has(id)).length;
                const total = goal.siteIds.length;
                const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
                const isComplete = completed === total;
                const GoalIcon = goal.icon;
                return (
                  <div key={goal.id} className={`overflow-hidden bg-white rounded-lg border ${isComplete ? 'border-[#D4AF37]/55' : 'border-[#D4AF37]/25 hover:border-[#D4AF37]/45'} transition-colors`} data-testid={`goal-card-${goal.id}`}>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-9 h-9 rounded-md flex items-center justify-center border" style={{ backgroundColor: `${goal.color}10`, color: goal.color, borderColor: `${goal.color}30` }}>
                            <GoalIcon className="h-4 w-4" strokeWidth={1.8} />
                          </div>
                          <div>
                            <h3 className="text-[13px] font-semibold text-[#6D2B35]">{goal.title}</h3>
                            <p className="text-[10px] text-[#5a4a3a]/45 mt-0.5">{goal.titleHindi}</p>
                          </div>
                        </div>
                        {isComplete && (
                          <div className="flex items-center gap-1 px-2 py-0.5 bg-[#D4AF37]/15 border border-[#D4AF37]/40 rounded-md">
                            <Award className="h-3 w-3 text-[#D4AF37]" strokeWidth={1.8} />
                            <span className="text-[9px] font-bold text-[#D4AF37] uppercase tracking-wider">{goal.badge}</span>
                          </div>
                        )}
                      </div>
                      <div className="mb-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-[11px] text-[#5a4a3a]/55 font-medium">{completed}/{total} completed</span>
                          <span className="text-[11px] font-bold" style={{ color: goal.color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-[#FBF7EE] rounded-sm overflow-hidden border border-[#D4AF37]/15">
                          <motion.div initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, ease: "easeOut" }} className="h-full" style={{ backgroundColor: goal.color }} />
                        </div>
                      </div>
                      <div className="space-y-1">
                        {goal.siteIds.map(siteId => {
                          const site = pilgrimageSites.find(s => s.id === siteId);
                          if (!site) return null;
                          const visited = visitedSites.has(siteId);
                          return (
                            <div key={siteId} className="flex items-center gap-2 group">
                              <button onClick={() => toggleVisited(siteId)} className={`w-4 h-4 rounded-sm border flex items-center justify-center transition-colors flex-shrink-0 ${visited ? 'border-emerald-600 bg-emerald-600' : 'border-[#5a4a3a]/25 hover:border-emerald-500'}`} data-testid={`visit-check-${siteId}`}>
                                {visited && <CheckCircle2 className="h-3 w-3 text-white" strokeWidth={2} />}
                              </button>
                              <button onClick={() => { setSelectedSite(site); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className={`text-[11px] flex-1 text-left truncate transition-colors ${visited ? 'text-emerald-600 line-through opacity-65' : 'text-[#5a4a3a]/75 hover:text-[#6D2B35]'}`}>
                                {site.name} <span className="text-[10px] text-[#5a4a3a]/35">— {site.nameHindi}</span>
                              </button>
                            </div>
                          );
                        })}
                      </div>
                      <div className="flex items-center gap-1 mt-3 pt-3 border-t border-[#D4AF37]/15">
                        <span className="text-[10px] text-[#5a4a3a]/45 mr-auto uppercase tracking-wider font-semibold">Share</span>
                        <button onClick={() => handleShare("twitter", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-twitter-${goal.id}`}><Twitter className="h-3.5 w-3.5 text-[#1DA1F2]" strokeWidth={1.8} /></button>
                        <button onClick={() => handleShare("facebook", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-fb-${goal.id}`}><Facebook className="h-3.5 w-3.5 text-[#4267B2]" strokeWidth={1.8} /></button>
                        <button onClick={() => handleShare("whatsapp", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-wa-${goal.id}`}>
                          <svg className="h-3.5 w-3.5 text-[#25D366]" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492l4.638-1.467A11.932 11.932 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75c-2.17 0-4.207-.614-5.963-1.672l-.427-.254-2.755.872.856-2.688-.278-.442A9.724 9.724 0 012.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75z" /></svg>
                        </button>
                        <button onClick={() => handleShare("copy", goal)} className="w-7 h-7 rounded-md border border-[#D4AF37]/20 hover:bg-[#FBF7EE] flex items-center justify-center transition-colors" data-testid={`share-copy-${goal.id}`}><Link2 className="h-3.5 w-3.5 text-[#5a4a3a]/55" strokeWidth={1.8} /></button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="mt-6">
              <div className="border border-[#D4AF37]/30 bg-white rounded-lg overflow-hidden" data-testid="overall-progress-card">
                <div className="p-5 md:p-6">
                  <div className="flex flex-col md:flex-row items-center gap-5">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-md bg-[#6D2B35] border border-[#D4AF37]/40 flex items-center justify-center">
                        <TrendingUp className="h-5 w-5 text-[#D4AF37]" strokeWidth={1.8} />
                      </div>
                      <div>
                        <h3 className="font-serif font-semibold text-base text-[#6D2B35]">Your Spiritual Journey</h3>
                        <p className="text-[11px] text-[#5a4a3a]/60 mt-0.5">Overall pilgrimage progress across all goals</p>
                      </div>
                    </div>
                    <div className="flex-1 w-full">
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-2">
                        {[
                          { v: visitedSites.size, l: "Sites Visited", c: "#6D2B35" },
                          { v: pilgrimageSites.length, l: "Total Sites", c: "#6D2B35" },
                          { v: pilgrimageGoals.filter(g => g.siteIds.every(id => visitedSites.has(id))).length, l: "Goals Done", c: "#D4AF37" },
                          { v: pilgrimageGoals.length, l: "Total Goals", c: "#6D2B35" },
                          { v: new Set(pilgrimageSites.filter(s => visitedSites.has(s.id)).map(s => s.state)).size, l: "States Covered", c: "#6D2B35" },
                          { v: `${Math.round((visitedSites.size / pilgrimageSites.length) * 100)}%`, l: "Complete", c: "#6D2B35" },
                        ].map((s) => (
                          <div key={s.l} className="text-center p-2.5 bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md">
                            <p className="text-xl font-bold font-serif" style={{ color: s.c }}>{s.v}</p>
                            <p className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] font-semibold mt-1">{s.l}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2 justify-center pt-4 border-t border-[#D4AF37]/20">
                    <button onClick={() => { const text = `I've visited ${visitedSites.size}/${pilgrimageSites.length} sacred sites across India on my spiritual journey with @VedicTatva! #SpiritualJourney #VedicTatva #TempleTourism`; window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent("https://vedictatva.com/temple-tourism")}`, "_blank"); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-[#1DA1F2] hover:bg-[#1a91da] text-white border border-[#1DA1F2] transition-colors" data-testid="share-overall-twitter"><Twitter className="h-3.5 w-3.5" strokeWidth={1.8} /> Twitter</button>
                    <button onClick={() => { const text = `I've visited ${visitedSites.size}/${pilgrimageSites.length} sacred sites across India! Check out the Vedic Tatva pilgrimage map: https://vedictatva.com/temple-tourism #SpiritualJourney`; window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank"); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-[#25D366] hover:bg-[#1faa54] text-white border border-[#25D366] transition-colors" data-testid="share-overall-whatsapp">
                      <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" /></svg>
                      WhatsApp
                    </button>
                    <button onClick={() => { const text = `My Vedic Tatva Pilgrimage Progress:\n${visitedSites.size}/${pilgrimageSites.length} sacred sites visited\n${pilgrimageGoals.filter(g => g.siteIds.every(id => visitedSites.has(id))).length}/${pilgrimageGoals.length} goals completed\n\nTrack your spiritual journey: https://vedictatva.com/temple-tourism`; navigator.clipboard.writeText(text); }} className="inline-flex items-center gap-1.5 h-9 px-3 rounded-md text-[11px] font-semibold uppercase tracking-wider bg-white text-[#6D2B35] border border-[#D4AF37]/40 hover:bg-[#FBF7EE] transition-colors" data-testid="share-overall-copy"><Link2 className="h-3.5 w-3.5" strokeWidth={1.8} /> Copy</button>
                  </div>
                </div>
              </div>
            </div>
          </section>


          <section className="mb-10">
            <Link href="/route-planner">
              <div className="cursor-pointer group" data-testid="route-planner-cta">
                <div className="relative overflow-hidden rounded-lg border border-[#D4AF37]/40 hover:border-[#D4AF37]/65 transition-colors" style={{ backgroundColor: "#6D2B35" }}>
                  <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                  <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                  <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 p-5 sm:p-6">
                    <div className="flex-shrink-0 w-12 h-12 rounded-md bg-white/10 border border-[#D4AF37]/40 flex items-center justify-center">
                      <Navigation className="w-5 h-5 text-[#D4AF37]" strokeWidth={1.8} />
                    </div>
                    <div className="flex-1 text-center sm:text-left">
                      <span className="inline-block text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1">AI-Powered</span>
                      <h3 className="font-serif font-semibold text-lg sm:text-xl text-white">Plan Your Pilgrimage Route</h3>
                      <p className="text-[12px] text-white/70 leading-relaxed max-w-xl mt-1">AI-generated personalised itineraries with travel tips, accommodation, local food, packing lists and sacred mantras for your journey.</p>
                    </div>
                    <div className="flex-shrink-0">
                      <div className="inline-flex items-center gap-1.5 h-10 px-4 rounded-md bg-[#D4AF37] hover:bg-[#c19c2e] text-[#3a1a20] font-semibold text-[12px] uppercase tracking-wider border border-[#D4AF37] transition-colors">
                        Plan Now <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" strokeWidth={1.8} />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </section>

          <section className="mb-8" aria-labelledby="yatra-tips">
            <div className="border border-[#D4AF37]/25 rounded-lg overflow-hidden bg-white" data-testid="yatra-tips-section">
              <div className="p-5 bg-[#6D2B35] text-white border-b border-[#D4AF37]/40 relative">
                <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/50 to-transparent" aria-hidden="true" />
                <h2 id="yatra-tips" className="font-serif font-semibold text-lg text-white">Essential Yatra Planning Guide</h2>
                <p className="text-[12px] text-white/70 mt-0.5">Everything you need to know before starting your pilgrimage</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-px bg-[#D4AF37]/15">
                {[
                  { icon: Calendar, title: "Plan Around Festivals", desc: "Visiting during festivals like Navratri, Shivaratri, or Janmashtami enhances the spiritual experience manifold. Book accommodation months in advance for popular festivals." },
                  { icon: Clock, title: "Early Morning Darshan", desc: "Most temples open at 4-5 AM. Early morning darshan has shortest queues and the most peaceful, meditative atmosphere. Bhasma Aarti, Mangla Aarti — all happen at dawn." },
                  { icon: Heart, title: "Respect Local Customs", desc: "Dress modestly (no shorts/sleeveless), remove footwear, cover head at Gurdwaras. Some temples don't allow leather items. Non-veg food is prohibited in many holy cities." },
                  { icon: Mountain, title: "Altitude Preparation", desc: "For Himalayan pilgrimages (Char Dham, Amarnath, Hemkund), acclimatize properly. Carry medicines for altitude sickness. Get medical fitness certificate for high-altitude treks." },
                  { icon: Train, title: "Book Transport Early", desc: "Train tickets sell out 60-120 days before for popular routes. IRCTC Tatkal opens at 10 AM. Consider helicopter services for Kedarnath, Vaishno Devi, Amarnath — book weeks ahead." },
                  { icon: Footprints, title: "Walking Pilgrimages", desc: "For Kawad Yatra, Govardhan Parikrama, Narmada Parikrama — break in your footwear beforehand. Carry minimal luggage. Many routes have free food camps (langar/bhandara)." },
                  { icon: Sun, title: "Weather & Seasons", desc: "Most North Indian temples: Oct-Mar best. South Indian temples: Year-round. Himalayan temples: May-Oct only. Monsoon adds beauty to Western Ghat temples. Summer in plains can be extreme." },
                  { icon: Globe, title: "Digital Tools", desc: "IRCTC for trains, Shrine Board apps for Vaishno Devi/Amarnath, TTD app for Tirupati, online Aarti booking for Mahakaleshwar. Google Maps works for most locations. Keep offline maps for remote treks." },
                ].map((tip, i) => (
                  <div key={i} className="bg-white p-4" data-testid={`yatra-tip-${i}`}>
                    <div className="w-7 h-7 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center mb-2.5">
                      <tip.icon className="h-3.5 w-3.5 text-[#6D2B35]" strokeWidth={1.8} />
                    </div>
                    <h4 className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1">{tip.title}</h4>
                    <p className="text-[11px] text-[#5a4a3a]/70 leading-relaxed">{tip.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <PageAPlusContent
            eyebrow="Why Plan Temple Yatra With Vedic Tatva"
            title="Hindu Temple Tourism — Char Dham, Jyotirlinga, Shakti Peeth Yatra"
            intro="Temple yatra is the highest pilgrimage in Sanatan tradition. From Char Dham (Kedarnath, Badrinath, Gangotri, Yamunotri) to 12 Jyotirlingas, 51 Shakti Peeths, Tirupati, Vaishno Devi, Jagannath Puri, Rameshwaram and Shirdi — Vedic Tatva helps you plan complete yatra with darshan timings, route maps, accommodation and special puja booking."
            trustBadges={[
              { value: "500+", label: "Sacred Temples" },
              { value: "12", label: "Jyotirlingas" },
              { value: "51", label: "Shakti Peeths" },
              { value: "Live", label: "Darshan Timings" },
            ]}
            benefits={[
              { icon: Mountain, title: "Char Dham Yatra Planning", body: "Complete itinerary for Char Dham (Uttarakhand) and Chota Char Dham — Kedarnath, Badrinath, Gangotri, Yamunotri — with helicopter, road & trek options, weather alerts and seasonal opening dates." },
              { icon: Flame, title: "12 Jyotirlinga Tour", body: "Plan Dwadash Jyotirlinga yatra — Somnath, Mallikarjuna, Mahakaleshwar, Omkareshwar, Kedarnath, Bhimashankar, Vishweshwar (Kashi), Trimbakeshwar, Vaidyanath, Nageshwar, Rameshwaram, Grishneshwar." },
              { icon: Crown, title: "51 Shakti Peeths", body: "Discover all 51 Shakti Peeths across India, Nepal, Bangladesh, Sri Lanka, Pakistan and Tibet — with shloka, presiding Devi name, body part legend and travel guidance." },
              { icon: Clock, title: "Live Darshan Timings", body: "Real-time darshan timings, abhishek slot booking, special puja windows, festival schedules and crowd advisories for major temples." },
              { icon: Route, title: "Detailed Route Planner", body: "Train, flight, road and trek route guidance with distance, duration, recommended stops and budget estimates for every major pilgrimage." },
              { icon: BookOpen, title: "Sthala Purana & History", body: "Read the authentic sthala purana (temple legend), history, presiding deity story, and ritual significance of every temple — deepen your darshan experience." },
            ]}
            steps={[
              { title: "Choose Yatra Type", body: "Pick from Char Dham, 12 Jyotirlinga, 51 Shakti Peeth, Sapta Puri, Pancharama Kshetra, single-temple visit or custom multi-temple yatra." },
              { title: "Plan Route & Dates", body: "Build your itinerary with route maps, transport options, accommodation suggestions and seasonal best-time advisories." },
              { title: "Book Special Puja", body: "Reserve Rudra Abhishek (Jyotirlinga), Maha Aarti, Sahasranama Archana or special darshan slots in advance." },
              { title: "Travel & Darshan", body: "Receive day-by-day yatra checklist, dress code, samagri and prasad guidance. Track darshan, share with family back home." },
            ]}
            faqs={[
              { q: "Which is the best time for Char Dham Yatra?", a: "Char Dham (Kedarnath, Badrinath, Gangotri, Yamunotri) opens around late April/early May (Akshaya Tritiya for some) and closes by mid-November (around Diwali) due to heavy snowfall. Best months are May-June and September-October — avoiding peak monsoon (July-August) when landslides are common." },
              { q: "What are the 12 Jyotirlingas?", a: "Somnath (Gujarat), Mallikarjuna (Andhra Pradesh), Mahakaleshwar (Ujjain, MP), Omkareshwar (MP), Kedarnath (Uttarakhand), Bhimashankar (Maharashtra), Kashi Vishweshwar (Varanasi, UP), Trimbakeshwar (Maharashtra), Vaidyanath (Jharkhand), Nageshwar (Gujarat), Rameshwaram (Tamil Nadu), Grishneshwar (Maharashtra)." },
              { q: "What are the 51 Shakti Peeths?", a: "The 51 Shakti Peeths are sacred sites associated with parts of Devi Sati's body falling during Lord Shiva's tandav. The lists vary slightly across traditions (Devi Bhagavata Purana, Pithanirnaya, Tantra Chudamani). Widely venerated peeths include Kamakhya (Assam), Kalighat (Kolkata), Jwalamukhi (HP), Mahalakshmi (Kolhapur), Hinglaj (Pakistan), Tara Tarini (Odisha) and Dakshineswar Kali (Kolkata)." },
              { q: "How do I book darshan at Tirupati or Vaishno Devi?", a: "For Tirupati Balaji, online darshan booking is available 60-90 days in advance via TTD. For Vaishno Devi, RFID yatra registration is mandatory. Vedic Tatva integrates with both — book special darshan slots, accommodation and helicopter directly through our platform." },
              { q: "Can I do Kedarnath yatra without trekking?", a: "Yes — helicopter services from Phata, Sersi and Guptkashi operate during yatra season (May-Nov). Booking opens 3 months in advance via IRCTC heli services. Vedic Tatva helps plan helicopter combo packages that cover Kedarnath in a single day from Dehradun/Haridwar." },
              { q: "What is the dress code for temple darshan?", a: "Most major South Indian temples (Tirupati, Padmanabhaswamy, Guruvayur, Sabarimala) require traditional dress — dhoti for men, saree/sari or salwar for women. Many temples disallow leather items, photography inside sanctum, and require head-cover. We provide temple-specific dress codes for every yatra." },
              { q: "Can I book special pujas in advance?", a: "Yes — Vedic Tatva partners with major temples for advance booking of Rudra Abhishek (Jyotirlinga temples), Maha Aarti (Kashi, Ujjain), Sahasranama Archana (Tirupati), Suprabhata Seva and other special rituals. Book online before your yatra." },
              { q: "Is there a recommended yatra order for spiritual benefit?", a: "Traditionally: (1) Sapta Puri (7 holy cities — Ayodhya, Mathura, Haridwar, Kashi, Kanchipuram, Ujjain, Dwarka), (2) Char Dham (Badrinath, Dwarka, Puri, Rameshwaram), (3) Chota Char Dham (Uttarakhand), (4) 12 Jyotirlingas. Many devotees do Kashi-Prayagraj-Ayodhya as their first major yatra." },
            ]}
            keywordsBlurb="Hindu temple tourism and pilgrimage yatra — Char Dham yatra (Kedarnath, Badrinath, Gangotri, Yamunotri), 12 Jyotirlinga darshan (Somnath, Mahakaleshwar, Kashi Vishwanath, Rameshwaram, Trimbakeshwar), 51 Shakti Peeth (Kamakhya, Vaishno Devi, Kalighat, Jwalamukhi), Sapta Puri (Ayodhya, Mathura, Haridwar, Kashi, Kanchipuram, Ujjain, Dwarka). Tirupati Balaji darshan booking, Vaishno Devi RFID registration, Kedarnath helicopter booking, Sabarimala yatra. Live darshan timings, special puja booking, sthala purana, dress code, accommodation and complete pilgrimage planning for every Hindu temple in India."
          />
        </div>
      </div>
    </>
  );
}