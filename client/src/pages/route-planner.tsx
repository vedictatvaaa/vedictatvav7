import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Navigation, Search, Loader2, ChevronDown, ChevronUp, Clock, IndianRupee, Star, Flame, Mountain, Waves, Sun, Compass, ArrowRight, ArrowDown, CheckCircle2, Plus, X, Sparkles, Train, Car, Plane, Utensils, Bed, Lightbulb, Package, Phone, BookOpen, Share2, Route, Heart, Shield, Footprints, Milestone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { PageHero, SectionHeader, slimPanel } from "@/components/ui/section-primitives";

type RouteStop = {
  order: number;
  name: string;
  nameHindi: string;
  type: string;
  stayDuration: string;
  highlights: string[];
  mustDo: string;
  accommodation: string;
  localFood: string;
  travelFromPrevious: { distance: string; duration: string; mode: string; details: string };
  tips: string[];
  bestTime: string;
};

type RouteResult = {
  routeName: string;
  routeNameHindi: string;
  totalDistance: string;
  totalDuration: string;
  estimatedBudget: { economy: string; comfort: string; premium: string };
  bestSeason: string;
  difficulty: string;
  spiritualSignificance: string;
  stops: RouteStop[];
  packingList: string[];
  importantTips: string[];
  mantrasForJourney: { mantra: string; meaning: string; when: string }[];
  emergencyContacts: string;
};

const popularDestinations = [
  { name: "Varanasi (Kashi)", category: "city", icon: Flame },
  { name: "Haridwar", category: "city", icon: Waves },
  { name: "Rishikesh", category: "city", icon: Mountain },
  { name: "Puri (Jagannath)", category: "temple", icon: Star },
  { name: "Tirupati (Tirumala)", category: "temple", icon: Star },
  { name: "Somnath", category: "temple", icon: Flame },
  { name: "Dwarka", category: "temple", icon: Star },
  { name: "Rameshwaram", category: "temple", icon: Flame },
  { name: "Kedarnath", category: "temple", icon: Mountain },
  { name: "Badrinath", category: "temple", icon: Mountain },
  { name: "Gangotri", category: "temple", icon: Waves },
  { name: "Yamunotri", category: "temple", icon: Waves },
  { name: "Amarnath", category: "temple", icon: Mountain },
  { name: "Vaishno Devi", category: "temple", icon: Mountain },
  { name: "Shirdi (Sai Baba)", category: "temple", icon: Heart },
  { name: "Ayodhya (Ram Mandir)", category: "city", icon: Star },
  { name: "Mathura-Vrindavan", category: "city", icon: Heart },
  { name: "Ujjain (Mahakaleshwar)", category: "temple", icon: Flame },
  { name: "Allahabad (Prayagraj)", category: "city", icon: Waves },
  { name: "Bodh Gaya", category: "city", icon: Sun },
  { name: "Konark (Sun Temple)", category: "temple", icon: Sun },
  { name: "Madurai (Meenakshi)", category: "temple", icon: Star },
  { name: "Amritsar (Golden Temple)", category: "temple", icon: Star },
  { name: "Pushkar", category: "city", icon: Waves },
];

const presetRoutes = [
  { name: "Char Dham Yatra", destinations: ["Yamunotri", "Gangotri", "Kedarnath", "Badrinath"], duration: "12 days", icon: Mountain },
  { name: "Dwadash Jyotirlinga (North)", destinations: ["Somnath", "Ujjain (Mahakaleshwar)", "Varanasi (Kashi)", "Kedarnath"], duration: "10 days", icon: Flame },
  { name: "Sapta Puri Circuit", destinations: ["Varanasi (Kashi)", "Ayodhya (Ram Mandir)", "Mathura-Vrindavan", "Haridwar", "Dwarka", "Puri (Jagannath)", "Rameshwaram"], duration: "18 days", icon: Star },
  { name: "South India Temple Trail", destinations: ["Tirupati (Tirumala)", "Rameshwaram", "Madurai (Meenakshi)", "Konark (Sun Temple)"], duration: "10 days", icon: Sun },
  { name: "Himalayan Spiritual Trek", destinations: ["Haridwar", "Rishikesh", "Kedarnath", "Badrinath"], duration: "10 days", icon: Mountain },
  { name: "Krishna Circuit", destinations: ["Mathura-Vrindavan", "Dwarka", "Puri (Jagannath)"], duration: "8 days", icon: Heart },
];

const startCities = ["Delhi", "Mumbai", "Kolkata", "Chennai", "Bangalore", "Hyderabad", "Ahmedabad", "Lucknow", "Jaipur", "Pune"];

const travelModes = [
  { id: "train", label: "Train", icon: Train },
  { id: "road", label: "Road / Car", icon: Car },
  { id: "flight", label: "Flight + Local", icon: Plane },
  { id: "mixed", label: "Mixed (Best)", icon: Navigation },
];

const budgetLevels = [
  { id: "budget", label: "Budget", desc: "Dharamshalas & basic transport" },
  { id: "moderate", label: "Moderate", desc: "Clean hotels & comfortable travel" },
  { id: "premium", label: "Premium", desc: "Best hotels & private transport" },
];

const stopTypeIcons: Record<string, typeof MapPin> = {
  temple: Star,
  river: Waves,
  mountain: Mountain,
  city: MapPin,
  ashram: Sun,
};

const difficultyColors: Record<string, string> = {
  Easy: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Moderate: "bg-amber-50 text-amber-700 border-amber-200",
  Challenging: "bg-orange-50 text-orange-700 border-orange-200",
  Strenuous: "bg-rose-50 text-rose-700 border-rose-200",
};

const inputCls = "h-10 w-full rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 text-[13px] text-[#5a4a3a] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]";
const primaryBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-5 rounded-md text-[13px] font-semibold bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";
const outlineBtn = "inline-flex items-center justify-center gap-1.5 h-10 px-4 rounded-md text-[13px] font-semibold bg-white text-[#6D2B35] border border-[#D4AF37]/30 hover:bg-[#FBF7EE] disabled:opacity-50 disabled:cursor-not-allowed transition-colors";

export default function RoutePlanner() {
  const [selected, setSelected] = useState<string[]>([]);
  const [customDest, setCustomDest] = useState("");
  const [startCity, setStartCity] = useState("Delhi");
  const [duration, setDuration] = useState("7 days");
  const [travelMode, setTravelMode] = useState("mixed");
  const [budget, setBudget] = useState("moderate");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<RouteResult | null>(null);
  const [expandedStop, setExpandedStop] = useState<number | null>(null);
  const [showPacking, setShowPacking] = useState(false);
  const [showMantras, setShowMantras] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const { toast } = useToast();

  const filteredDestinations = useMemo(() => {
    if (!searchFilter) return popularDestinations;
    return popularDestinations.filter(d => d.name.toLowerCase().includes(searchFilter.toLowerCase()));
  }, [searchFilter]);

  const toggleDest = (name: string) => {
    setSelected(prev => prev.includes(name) ? prev.filter(d => d !== name) : [...prev, name]);
  };

  const addCustomDest = () => {
    if (customDest.trim() && !selected.includes(customDest.trim())) {
      setSelected(prev => [...prev, customDest.trim()]);
      setCustomDest("");
    }
  };

  const loadPreset = (preset: typeof presetRoutes[0]) => {
    setSelected(preset.destinations);
    setDuration(preset.duration);
    toast({ title: `${preset.name} loaded`, description: `${preset.destinations.length} destinations selected` });
  };

  const planRoute = async () => {
    if (selected.length < 1) {
      toast({ title: "Select at least one destination", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    setStep(3);
    try {
      const res = await fetch("/api/pilgrimage/plan-route", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ destinations: selected, startCity, duration, travelMode, budget }),
      });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      setResult(data);
    } catch {
      toast({ title: "Failed to plan route", description: "Please try again", variant: "destructive" });
      setStep(2);
    } finally {
      setLoading(false);
    }
  };

  const shareRoute = () => {
    if (!result) return;
    const text = `${result.routeName}\n\n${result.stops.map((s, i) => `${i + 1}. ${s.name} (${s.stayDuration})`).join("\n")}\n\nTotal: ${result.totalDistance} | ${result.totalDuration}\n\nPlanned on Vedic Tatva`;
    navigator.clipboard.writeText(text);
    toast({ title: "Route copied to clipboard" });
  };

  const StopIcon = (type: string) => stopTypeIcons[type] || MapPin;

  return (
    <div className="min-h-screen bg-white pb-16">
      <PageHero
        eyebrow="Pilgrimage Route Planner"
        title="Plan your sacred journey"
        subtitle="Select holy destinations and get an AI-powered itinerary with travel tips, budget estimates and spiritual guidance."
        variant="maroon"
        testId="hero-route-planner"
      />

      <div className="max-w-5xl mx-auto px-4 mt-8">
        {!result && (
          <div className="flex items-center justify-center gap-2 mb-7" data-testid="route-planner-title">
            {[1, 2, 3].map(s => (
              <div key={s} className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-md flex items-center justify-center text-[12px] font-semibold transition-colors ${step >= s ? "bg-[#6D2B35] text-[#D4AF37] border border-[#D4AF37]/40" : "bg-white text-[#5a4a3a]/45 border border-[#D4AF37]/25"}`}>
                  {step > s ? <CheckCircle2 className="h-3.5 w-3.5" strokeWidth={2} /> : s}
                </div>
                <span className={`text-[11px] font-semibold uppercase tracking-wider hidden sm:block ${step >= s ? "text-[#6D2B35]" : "text-[#5a4a3a]/45"}`}>
                  {s === 1 ? "Destinations" : s === 2 ? "Preferences" : "Your Route"}
                </span>
                {s < 3 && <div className={`w-8 h-px ${step > s ? "bg-[#6D2B35]" : "bg-[#D4AF37]/25"}`} />}
              </div>
            ))}
          </div>
        )}

        <AnimatePresence mode="wait">
          {step === 1 && !result && (
            <motion.div key="step1" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} className="space-y-5">
              <div className={slimPanel} data-testid="preset-routes-card">
                <div className="px-5 py-4 border-b border-[#D4AF37]/20 flex items-center gap-2.5">
                  <Compass className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
                  <h2 className="font-serif font-semibold text-base text-[#6D2B35]">Popular pilgrimage routes</h2>
                </div>
                <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {presetRoutes.map((pr, i) => (
                    <button key={i} onClick={() => loadPreset(pr)}
                      className="flex items-center gap-3 p-3 rounded-md border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 hover:bg-[#FBF7EE] text-left group transition-colors"
                      data-testid={`preset-route-${i}`}
                    >
                      <div className="w-8 h-8 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                        <pr.icon className="h-4 w-4 text-[#6D2B35]" strokeWidth={1.8} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-[#6D2B35] truncate">{pr.name}</p>
                        <p className="text-[11px] text-[#5a4a3a]/55 mt-0.5">{pr.destinations.length} stops · {pr.duration}</p>
                      </div>
                      <ArrowRight className="h-3.5 w-3.5 text-[#D4AF37]/50 group-hover:text-[#D4AF37]" strokeWidth={1.8} />
                    </button>
                  ))}
                </div>
              </div>

              <div className={slimPanel} data-testid="destination-picker-card">
                <div className="px-5 py-4 border-b border-[#D4AF37]/20">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
                    <h2 className="font-serif font-semibold text-base text-[#6D2B35]">Select your destinations</h2>
                  </div>
                  <p className="text-[12px] text-[#5a4a3a]/60 mt-1 ml-6">Pick sacred places you want to visit or add your own</p>
                </div>
                <div className="p-5">
                  {selected.length > 0 && (
                    <div className="mb-4 p-3 rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE]">
                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2">Selected ({selected.length})</p>
                      <div className="flex flex-wrap gap-1.5">
                        {selected.map((d, i) => (
                          <span key={i} className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-[#6D2B35] text-white rounded-md text-[11px] font-semibold">
                            {d}
                            <button onClick={() => toggleDest(d)} className="hover:bg-white/20 rounded-sm p-0.5" data-testid={`remove-dest-${i}`}>
                              <X className="h-3 w-3" strokeWidth={2} />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2 mb-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#6D2B35]/40" strokeWidth={1.8} />
                      <input placeholder="Search destinations..." value={searchFilter} onChange={e => setSearchFilter(e.target.value)}
                        className={`${inputCls} pl-9`} data-testid="destination-search-input" />
                    </div>
                    <div className="flex gap-1.5">
                      <input placeholder="Add custom place" value={customDest} onChange={e => setCustomDest(e.target.value)}
                        onKeyDown={e => e.key === "Enter" && addCustomDest()}
                        className={`${inputCls} w-36 md:w-44`} data-testid="custom-dest-input" />
                      <button onClick={addCustomDest} disabled={!customDest.trim()} className={`${primaryBtn} h-10 w-10 px-0`} data-testid="add-custom-btn">
                        <Plus className="h-4 w-4" strokeWidth={2} />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {filteredDestinations.map((d, i) => {
                      const isSelected = selected.includes(d.name);
                      return (
                        <button key={i} onClick={() => toggleDest(d.name)}
                          className={`flex items-center gap-2 p-2.5 rounded-md border text-left text-[12px] font-semibold transition-colors ${isSelected ? "bg-[#6D2B35] text-white border-[#6D2B35]" : "bg-white border-[#D4AF37]/25 text-[#5a4a3a] hover:border-[#D4AF37]/45 hover:bg-[#FBF7EE]"}`}
                          data-testid={`dest-${i}`}
                        >
                          <d.icon className={`h-3.5 w-3.5 flex-shrink-0 ${isSelected ? "text-[#D4AF37]" : "text-[#6D2B35]/55"}`} strokeWidth={1.8} />
                          <span className="truncate">{d.name}</span>
                          {isSelected && <CheckCircle2 className="h-3 w-3 ml-auto flex-shrink-0 text-[#D4AF37]" strokeWidth={2} />}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex justify-end mt-6 pt-5 border-t border-[#D4AF37]/20">
                    <button onClick={() => setStep(2)} disabled={selected.length < 1}
                      className={primaryBtn}
                      data-testid="next-step-btn"
                    >
                      Next: Travel preferences <ArrowRight className="h-3.5 w-3.5" strokeWidth={1.8} />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {step === 2 && !result && (
            <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
              <div className={slimPanel} data-testid="preferences-card">
                <div className="px-5 py-4 border-b border-[#D4AF37]/20 flex items-center gap-2.5">
                  <Navigation className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
                  <h2 className="font-serif font-semibold text-base text-[#6D2B35]">Travel preferences</h2>
                </div>
                <div className="p-5 space-y-5">
                  <div>
                    <label className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-[0.3em] mb-2 block">Starting city</label>
                    <div className="flex flex-wrap gap-1.5">
                      {startCities.map(city => (
                        <button key={city} onClick={() => setStartCity(city)}
                          className={`h-8 px-3 rounded-md text-[12px] font-semibold border transition-colors ${startCity === city ? "bg-[#6D2B35] text-white border-[#6D2B35]" : "bg-white text-[#5a4a3a] border-[#D4AF37]/25 hover:bg-[#FBF7EE]"}`}
                          data-testid={`city-${city}`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-[0.3em] mb-2 block">Trip duration</label>
                    <div className="flex flex-wrap gap-1.5">
                      {["3 days", "5 days", "7 days", "10 days", "14 days", "21 days"].map(d => (
                        <button key={d} onClick={() => setDuration(d)}
                          className={`inline-flex items-center gap-1 h-8 px-3 rounded-md text-[12px] font-semibold border transition-colors ${duration === d ? "bg-[#6D2B35] text-white border-[#6D2B35]" : "bg-white text-[#5a4a3a] border-[#D4AF37]/25 hover:bg-[#FBF7EE]"}`}
                          data-testid={`duration-${d}`}
                        >
                          <Clock className="h-3 w-3" strokeWidth={1.8} /> {d}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-[0.3em] mb-2 block">Travel mode</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                      {travelModes.map(tm => (
                        <button key={tm.id} onClick={() => setTravelMode(tm.id)}
                          className={`flex items-center gap-2 p-3 rounded-md border text-[12px] font-semibold transition-colors ${travelMode === tm.id ? "bg-[#6D2B35] text-white border-[#6D2B35]" : "bg-white border-[#D4AF37]/25 text-[#5a4a3a] hover:border-[#D4AF37]/45 hover:bg-[#FBF7EE]"}`}
                          data-testid={`mode-${tm.id}`}
                        >
                          <tm.icon className={`h-4 w-4 ${travelMode === tm.id ? "text-[#D4AF37]" : "text-[#6D2B35]/55"}`} strokeWidth={1.8} />
                          {tm.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-semibold text-[#D4AF37] uppercase tracking-[0.3em] mb-2 block">Budget level</label>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                      {budgetLevels.map(bl => (
                        <button key={bl.id} onClick={() => setBudget(bl.id)}
                          className={`flex flex-col items-start p-3 rounded-md border text-left transition-colors ${budget === bl.id ? "bg-[#6D2B35] text-white border-[#6D2B35]" : "bg-white border-[#D4AF37]/25 text-[#5a4a3a] hover:border-[#D4AF37]/45 hover:bg-[#FBF7EE]"}`}
                          data-testid={`budget-${bl.id}`}
                        >
                          <span className="text-[13px] font-serif font-semibold">{bl.label}</span>
                          <span className={`text-[11px] ${budget === bl.id ? "text-white/70" : "text-[#5a4a3a]/55"} mt-0.5`}>{bl.desc}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-md p-3 border border-[#D4AF37]/25 bg-[#FBF7EE]">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1">Your pilgrimage</p>
                    <p className="text-[12px] text-[#5a4a3a]">
                      <strong>{selected.length}</strong> destinations from <strong>{startCity}</strong> · <strong>{duration}</strong> · <strong>{travelMode}</strong> travel · <strong>{budget}</strong> budget
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {selected.map((d, i) => (
                        <span key={i} className="px-2 py-0.5 bg-white border border-[#D4AF37]/25 text-[#6D2B35] rounded-sm text-[10px] font-semibold">{d}</span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between p-5 border-t border-[#D4AF37]/20">
                  <button onClick={() => setStep(1)} className={outlineBtn} data-testid="back-btn">
                    Back
                  </button>
                  <button onClick={planRoute} disabled={loading} className={primaryBtn} data-testid="plan-route-btn">
                    {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" strokeWidth={1.8} /> : <Sparkles className="h-3.5 w-3.5" strokeWidth={1.8} />}
                    Plan my route
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {loading && step === 3 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 text-center py-16">
            <div className="relative w-14 h-14 mx-auto mb-5">
              <div className="absolute inset-0 rounded-md border border-[#D4AF37]/30 animate-ping" />
              <div className="absolute inset-0 rounded-md border border-[#D4AF37] animate-pulse" />
              <div className="absolute inset-2 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center">
                <Route className="h-5 w-5 text-[#6D2B35]" strokeWidth={1.8} />
              </div>
            </div>
            <p className="text-[#6D2B35] font-serif font-semibold text-[13px]">Planning your sacred journey…</p>
            <p className="text-[12px] text-[#5a4a3a]/55 mt-1">Optimizing route, calculating distances and preparing travel tips</p>
          </motion.div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className={slimPanel} data-testid="route-overview-card">
              <div className="p-5 md:p-6">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="h-px w-6 bg-[#D4AF37]" />
                      <span className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-[0.3em]">Your pilgrimage route</span>
                    </div>
                    <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#6D2B35] leading-tight" data-testid="route-name">{result.routeName}</h2>
                    {result.routeNameHindi && <p className="text-[13px] text-[#5a4a3a]/60 font-serif mt-0.5">{result.routeNameHindi}</p>}
                    <p className="text-[13px] text-[#5a4a3a]/70 mt-2 leading-relaxed max-w-xl">{result.spiritualSignificance}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className={outlineBtn} onClick={shareRoute} data-testid="share-route-btn">
                      <Share2 className="h-3.5 w-3.5" strokeWidth={1.8} /> Share
                    </button>
                    <button className={outlineBtn} onClick={() => { setResult(null); setStep(1); }} data-testid="new-plan-btn">
                      <Plus className="h-3.5 w-3.5" strokeWidth={1.8} /> New plan
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 mt-5">
                  {[
                    { icon: Milestone, label: "Distance", v: result.totalDistance },
                    { icon: Clock, label: "Duration", v: result.totalDuration },
                    { icon: Sun, label: "Best season", v: result.bestSeason },
                    { icon: Shield, label: "Difficulty", v: result.difficulty, isDifficulty: true },
                  ].map((s) => (
                    <div key={s.label} className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-3 text-center">
                      <s.icon className="h-4 w-4 text-[#D4AF37] mx-auto mb-1" strokeWidth={1.8} />
                      <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider font-semibold">{s.label}</p>
                      {s.isDifficulty ? (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-sm border inline-block mt-1 ${difficultyColors[result.difficulty] || difficultyColors.Moderate}`}>{result.difficulty}</span>
                      ) : (
                        <p className="text-[13px] font-serif font-semibold text-[#6D2B35] mt-0.5">{s.v}</p>
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-4 rounded-md p-4 border border-[#D4AF37]/25 bg-[#FBF7EE]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-2 inline-flex items-center gap-1"><IndianRupee className="h-3 w-3" strokeWidth={1.8} /> Estimated budget per person</p>
                  <div className="grid grid-cols-3 gap-3">
                    <div><p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider">Economy</p><p className="text-[12px] font-serif font-semibold text-[#6D2B35]">{result.estimatedBudget?.economy}</p></div>
                    <div><p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider">Comfort</p><p className="text-[12px] font-serif font-semibold text-[#6D2B35]">{result.estimatedBudget?.comfort}</p></div>
                    <div><p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider">Premium</p><p className="text-[12px] font-serif font-semibold text-[#6D2B35]">{result.estimatedBudget?.premium}</p></div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <SectionHeader
                eyebrow={`${result.stops?.length || 0} Stops`}
                title="Route stops"
                align="left"
                rails={false}
              />
              <div className="space-y-2 mt-5">
                {result.stops?.map((stop, i) => {
                  const Icon = StopIcon(stop.type);
                  const isExpanded = expandedStop === i;
                  return (
                    <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}>
                      {i > 0 && (
                        <div className="flex items-center gap-3 py-2 px-2">
                          <div className="w-8 flex justify-center"><ArrowDown className="h-3.5 w-3.5 text-[#D4AF37]/45" strokeWidth={1.8} /></div>
                          <div className="flex items-center gap-1.5 text-[10px] text-[#5a4a3a]/55 uppercase tracking-wider font-semibold">
                            <Navigation className="h-3 w-3" strokeWidth={1.8} />
                            {stop.travelFromPrevious?.distance} · {stop.travelFromPrevious?.duration} by {stop.travelFromPrevious?.mode}
                          </div>
                        </div>
                      )}
                      <div className="border border-[#D4AF37]/20 hover:border-[#D4AF37]/45 transition-colors rounded-md overflow-hidden bg-white" data-testid={`stop-card-${i}`}>
                        <button onClick={() => setExpandedStop(isExpanded ? null : i)} className="w-full text-left p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-md bg-[#6D2B35] border border-[#D4AF37]/40 flex items-center justify-center flex-shrink-0">
                              <span className="text-[#D4AF37] text-[13px] font-serif font-semibold">{stop.order || i + 1}</span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <Icon className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} />
                                <h4 className="font-serif font-semibold text-[#6D2B35] text-[13px]">{stop.name}</h4>
                                {stop.nameHindi && <span className="text-[11px] text-[#5a4a3a]/45 font-serif">({stop.nameHindi})</span>}
                              </div>
                              <div className="flex items-center gap-3 mt-1">
                                <span className="text-[10px] text-[#5a4a3a]/55 inline-flex items-center gap-1 uppercase tracking-wider font-semibold"><Clock className="h-3 w-3" strokeWidth={1.8} /> {stop.stayDuration}</span>
                                <span className="text-[10px] text-[#5a4a3a]/55 inline-flex items-center gap-1 uppercase tracking-wider font-semibold"><Sun className="h-3 w-3" strokeWidth={1.8} /> {stop.bestTime}</span>
                              </div>
                              <p className="text-[12px] text-[#6D2B35] font-semibold mt-1 inline-flex items-center gap-1">
                                <Star className="h-3 w-3 text-[#D4AF37]" strokeWidth={1.8} /> {stop.mustDo}
                              </p>
                            </div>
                            {isExpanded ? <ChevronUp className="h-4 w-4 text-[#D4AF37] flex-shrink-0" strokeWidth={1.8} /> : <ChevronDown className="h-4 w-4 text-[#D4AF37]/45 flex-shrink-0" strokeWidth={1.8} />}
                          </div>
                        </button>
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                              <div className="px-4 pb-4 space-y-2.5 border-t border-[#D4AF37]/20 pt-3">
                                <div className="grid md:grid-cols-2 gap-2.5">
                                  <div className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-3">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1.5 inline-flex items-center gap-1"><Star className="h-3 w-3" strokeWidth={1.8} /> Highlights</p>
                                    <ul className="space-y-1">
                                      {stop.highlights?.map((h, j) => (
                                        <li key={j} className="text-[12px] text-[#5a4a3a]/75 flex items-start gap-1.5">
                                          <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0 mt-0.5" strokeWidth={2} /> {h}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-3">
                                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1 inline-flex items-center gap-1"><Bed className="h-3 w-3" strokeWidth={1.8} /> Stay</p>
                                      <p className="text-[12px] text-[#5a4a3a]/75">{stop.accommodation}</p>
                                    </div>
                                    <div className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-3">
                                      <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1 inline-flex items-center gap-1"><Utensils className="h-3 w-3" strokeWidth={1.8} /> Local food</p>
                                      <p className="text-[12px] text-[#5a4a3a]/75">{stop.localFood}</p>
                                    </div>
                                  </div>
                                </div>
                                {i > 0 && stop.travelFromPrevious && (
                                  <div className="rounded-md p-3 border border-[#D4AF37]/25 bg-white">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold mb-1 inline-flex items-center gap-1"><Navigation className="h-3 w-3" strokeWidth={1.8} /> How to get here</p>
                                    <p className="text-[12px] text-[#5a4a3a]/75">{stop.travelFromPrevious.details}</p>
                                  </div>
                                )}
                                {stop.tips?.length > 0 && (
                                  <div className="rounded-md p-3 border border-amber-200 bg-amber-50">
                                    <p className="text-[10px] uppercase tracking-[0.3em] text-amber-700 font-semibold mb-1.5 inline-flex items-center gap-1"><Lightbulb className="h-3 w-3" strokeWidth={1.8} /> Travel tips</p>
                                    <ul className="space-y-1">
                                      {stop.tips.map((tip, j) => (
                                        <li key={j} className="text-[12px] text-[#5a4a3a]/75 flex items-start gap-1.5">
                                          <Lightbulb className="h-3 w-3 text-amber-600 flex-shrink-0 mt-0.5" strokeWidth={1.8} /> {tip}
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className={`${slimPanel} p-5`} data-testid="packing-card">
                <button onClick={() => setShowPacking(!showPacking)} className="w-full flex items-center justify-between">
                  <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] inline-flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Packing list ({result.packingList?.length || 0})
                  </h3>
                  {showPacking ? <ChevronUp className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} /> : <ChevronDown className="h-4 w-4 text-[#D4AF37]/45" strokeWidth={1.8} />}
                </button>
                <AnimatePresence>
                  {showPacking && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3">
                      <ul className="space-y-1.5">
                        {result.packingList?.map((item, i) => (
                          <li key={i} className="text-[12px] text-[#5a4a3a]/75 flex items-center gap-2">
                            <CheckCircle2 className="h-3 w-3 text-emerald-600 flex-shrink-0" strokeWidth={2} /> {item}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div className={`${slimPanel} p-5`} data-testid="tips-card">
                <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] inline-flex items-center gap-1.5 mb-3">
                  <Lightbulb className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Important tips
                </h3>
                <ul className="space-y-1.5">
                  {result.importantTips?.map((tip, i) => (
                    <li key={i} className="text-[12px] text-[#5a4a3a]/75 flex items-start gap-2">
                      <Shield className="h-3 w-3 text-[#6D2B35] flex-shrink-0 mt-0.5" strokeWidth={1.8} /> {tip}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {result.mantrasForJourney?.length > 0 && (
              <div className={`${slimPanel} p-5`} data-testid="mantras-card">
                <button onClick={() => setShowMantras(!showMantras)} className="w-full flex items-center justify-between">
                  <h3 className="text-[13px] font-serif font-semibold text-[#6D2B35] inline-flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" strokeWidth={1.8} /> Mantras for the journey ({result.mantrasForJourney.length})
                  </h3>
                  {showMantras ? <ChevronUp className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} /> : <ChevronDown className="h-4 w-4 text-[#D4AF37]/45" strokeWidth={1.8} />}
                </button>
                <AnimatePresence>
                  {showMantras && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden mt-3 space-y-2">
                      {result.mantrasForJourney.map((m, i) => (
                        <div key={i} className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-3">
                          <p className="text-[#6D2B35] font-serif font-semibold text-[13px]" style={{ fontFamily: '"Noto Sans Devanagari", serif' }}>{m.mantra}</p>
                          <p className="text-[12px] text-[#5a4a3a]/75 mt-1">{m.meaning}</p>
                          <p className="text-[10px] text-[#D4AF37] font-semibold uppercase tracking-wider mt-1">{m.when}</p>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}

            {result.emergencyContacts && (
              <div className="text-center text-[11px] text-[#5a4a3a]/55 inline-flex items-center justify-center gap-1 w-full">
                <Phone className="h-3 w-3" strokeWidth={1.8} /> {result.emergencyContacts}
              </div>
            )}

            <div className="text-center pt-2">
              <Footprints className="h-4 w-4 text-[#D4AF37]/40 mx-auto" strokeWidth={1.8} />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
