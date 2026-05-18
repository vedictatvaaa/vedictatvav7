import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import {
  ArrowLeft, Calendar, Clock, Star, Sparkles, Loader2, Baby, Home as HomeIcon,
  Scissors, Store, Heart, BookOpen, ChevronRight, Gem, Users, Flame, Crown,
  MapPin, Sunrise, Sunset, Compass,
} from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { useToast } from "@/hooks/use-toast";
import { RelatedServicesSection } from "@/components/RelatedServices";

interface MuhuratCeremony {
  id: string;
  name: string;
  nameHindi: string;
  icon: typeof Calendar;
  description: string;
}

const CEREMONIES: MuhuratCeremony[] = [
  { id: "mundan", name: "Mundan Sanskar", nameHindi: "मुंडन संस्कार", icon: Scissors, description: "First hair-cutting ceremony for the child" },
  { id: "marriage", name: "Vivah / Marriage", nameHindi: "विवाह", icon: Heart, description: "Find the most auspicious wedding date" },
  { id: "annaprashan", name: "Annaprashan", nameHindi: "अन्नप्राशन", icon: Baby, description: "First solid food ceremony for baby" },
  { id: "namkaran", name: "Namkaran Sanskar", nameHindi: "नामकरण संस्कार", icon: BookOpen, description: "Naming ceremony for the newborn" },
  { id: "griha_pravesh", name: "Griha Pravesh", nameHindi: "गृह प्रवेश", icon: HomeIcon, description: "House warming / new home entry ceremony" },
  { id: "shop_opening", name: "Shop / Office Opening", nameHindi: "दुकान / कार्यालय उद्घाटन", icon: Store, description: "Auspicious time for business inauguration" },
  { id: "ear_piercing", name: "Karnvedh / Ear Piercing", nameHindi: "कर्णवेध संस्कार", icon: Gem, description: "Traditional ear piercing ceremony" },
  { id: "upanayana", name: "Upanayana / Janeu", nameHindi: "उपनयन / जनेऊ संस्कार", icon: Crown, description: "Sacred thread ceremony" },
  { id: "vehicle_purchase", name: "Vehicle Purchase", nameHindi: "वाहन खरीद", icon: Star, description: "Best time to buy a new vehicle" },
  { id: "property_purchase", name: "Property Purchase", nameHindi: "संपत्ति खरीद", icon: HomeIcon, description: "Auspicious time for real estate deals" },
  { id: "engagement", name: "Sagai / Engagement", nameHindi: "सगाई", icon: Heart, description: "Ring ceremony and engagement" },
  { id: "havan", name: "Havan / Yagna", nameHindi: "हवन / यज्ञ", icon: Flame, description: "Sacred fire ceremony for blessings" },
  { id: "godh_bharai", name: "Godh Bharai / Baby Shower", nameHindi: "गोद भराई", icon: Baby, description: "Blessings ceremony for expecting mother" },
  { id: "graha_shanti", name: "Graha Shanti Puja", nameHindi: "ग्रह शांति पूजा", icon: Sparkles, description: "Planetary peace puja timing" },
  { id: "vidya_arambh", name: "Vidya Arambh", nameHindi: "विद्या आरंभ", icon: BookOpen, description: "Starting education / school admission" },
  { id: "travel", name: "Travel / Yatra", nameHindi: "यात्रा", icon: Star, description: "Auspicious time for starting a journey" },
  { id: "naamkaran_business", name: "Business Name Registration", nameHindi: "व्यापार नाम पंजीकरण", icon: Store, description: "Register a new company or brand name" },
  { id: "wedding_anniversary", name: "Wedding Anniversary Puja", nameHindi: "विवाह वर्षगांठ पूजा", icon: Users, description: "Renewal of wedding vows and blessings" },
];

const NAKSHATRAS_27 = [
  "Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu",
  "Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta",
  "Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha",
  "Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada",
  "Uttara Bhadrapada","Revati",
];

interface MuhuratDate {
  date: string;
  day: string;
  tithi: string;
  nakshatra: string;
  yoga?: string;
  karana?: string;
  paksha?: string;
  muhurat: string;
  sunrise?: string;
  sunset?: string;
  avoidWindow?: string;
  tara?: string | null;
  quality: string;
  notes: string;
}

interface MuhuratResult {
  ceremony: string;
  ceremonyHindi: string;
  location?: { name: string; country: string; tz: string };
  locationWarning?: string;
  dates: MuhuratDate[];
  generalGuidelines: string[];
  avoidDays: string[];
  rituals: string[];
  mantras: string[];
}

interface PlaceHit { name: string; state?: string; country: string; lat: number; lon: number; tz: string }

const PRIMARY_BTN = "bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed";
const OUTLINE_BTN = "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/25 hover:bg-[#f4eedd] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2";
const FIELD = "w-full h-10 rounded-md border border-[#D4AF37]/25 bg-white px-3 text-sm text-[#6D2B35] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30";
const LABEL = "text-[10px] font-semibold text-[#6D2B35] uppercase tracking-[0.2em]";

export default function MuhuratFinder() {
  const { toast } = useToast();
  const [selectedCeremony, setSelectedCeremony] = useState<MuhuratCeremony | null>(null);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [place, setPlace] = useState("Delhi");
  const [placeOptions, setPlaceOptions] = useState<PlaceHit[]>([]);
  const [showPlaceList, setShowPlaceList] = useState(false);
  const [birthNakshatra, setBirthNakshatra] = useState("");
  const [result, setResult] = useState<MuhuratResult | null>(null);

  // Debounced city autocomplete from server's geocoder
  useEffect(() => {
    if (!place || place.length < 2) { setPlaceOptions([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await fetch(`/api/tools/places?q=${encodeURIComponent(place)}`);
        if (r.ok) setPlaceOptions(await r.json());
      } catch {/* ignore */}
    }, 250);
    return () => clearTimeout(t);
  }, [place]);

  const muhuratMutation = useMutation({
    mutationFn: async (data: {
      ceremony: string; ceremonyHindi: string; fromDate: string; toDate: string;
      place: string; birthNakshatra?: string;
    }): Promise<MuhuratResult> => {
      const res = await fetch("/api/muhurat/find", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
      return json as MuhuratResult;
    },
    onSuccess: (data) => setResult(data),
    onError: (e: Error) => {
      toast({ title: "Could not find muhurat", description: e.message, variant: "destructive" });
    },
  });

  const handleFind = () => {
    if (!selectedCeremony || !fromDate || !toDate) {
      toast({ title: "Missing details", description: "Please select dates", variant: "destructive" });
      return;
    }
    if (!place.trim()) {
      toast({ title: "City required", description: "Enter your city for accurate sunrise & panchang", variant: "destructive" });
      return;
    }
    muhuratMutation.mutate({
      ceremony: selectedCeremony.name,
      ceremonyHindi: selectedCeremony.nameHindi,
      fromDate,
      toDate,
      place: place.trim(),
      birthNakshatra: birthNakshatra || undefined,
    });
  };

  if (selectedCeremony && result) {
    return (
      <div className="min-h-screen bg-white">
        <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
          <div className="container mx-auto px-4 py-8 md:py-10">
            <button onClick={() => { setResult(null); setSelectedCeremony(null); }} className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-white text-[11px] uppercase tracking-[0.2em] mb-4 transition-colors" data-testid="btn-back-ceremonies">
              <ArrowLeft className="h-3.5 w-3.5" /> All Ceremonies
            </button>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-px w-8 bg-[#D4AF37]/60" />
              <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
              <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">Muhurat Result</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-result-title">
              {result.ceremony} Muhurat
            </h1>
            <p className="text-white/70 text-sm mt-1">{result.ceremonyHindi}</p>
            {result.location && (
              <p className="text-white/60 text-[11px] mt-2 flex items-center gap-1.5">
                <MapPin className="h-3 w-3" /> {result.location.name}, {result.location.country} · {result.location.tz}
                {birthNakshatra && <span className="ml-2 inline-flex items-center gap-1"><Compass className="h-3 w-3" /> Tarabal personalised for {birthNakshatra}</span>}
              </p>
            )}
            {result.locationWarning && (
              <p className="text-amber-300 text-[11px] mt-1">{result.locationWarning}</p>
            )}
          </div>
        </div>

        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto space-y-5">
            <section className="bg-white border border-[#D4AF37]/25 rounded-md p-5 sm:p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-6 bg-[#D4AF37]/60" />
                <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Auspicious Dates</span>
              </div>
              {result.dates.length === 0 ? (
                <p className="text-sm text-[#5a4a3a]/70">No fully auspicious window in this range. Try a wider window or different city.</p>
              ) : (
                <div className="space-y-3">
                  {result.dates.map((d, i) => {
                    const isExcellent = d.quality === "Excellent";
                    const isGood = d.quality === "Good";
                    const containerCls = isExcellent
                      ? "border border-emerald-200 bg-emerald-50"
                      : isGood
                      ? "border border-[#D4AF37]/40 bg-[#FBF7EE]"
                      : "border border-[#D4AF37]/20 bg-white";
                    const badgeCls = isExcellent
                      ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                      : isGood
                      ? "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/40"
                      : "bg-white text-[#5a4a3a]/70 border border-[#D4AF37]/25";
                    return (
                      <div key={i} className={`p-4 rounded-md ${containerCls}`} data-testid={`muhurat-date-${i}`}>
                        <div className="flex items-start justify-between gap-3 flex-wrap">
                          <div>
                            <p className="font-bold text-[#6D2B35] font-serif">{d.date} <span className="text-[#5a4a3a]/60 text-sm font-normal">({d.day})</span></p>
                            <p className="text-xs text-[#5a4a3a]/70 mt-0.5">Tithi: {d.tithi} · Nakshatra: {d.nakshatra}</p>
                            {(d.yoga || d.karana || d.paksha) && (
                              <p className="text-xs text-[#5a4a3a]/55 mt-0.5">
                                {d.paksha ? <>Paksha: {d.paksha}{(d.yoga || d.karana) ? " · " : ""}</> : null}
                                {d.yoga ? <>Yoga: {d.yoga}{d.karana ? " · " : ""}</> : null}
                                {d.karana ? <>Karana: {d.karana}</> : null}
                              </p>
                            )}
                            {d.tara && (
                              <p className="text-[11px] text-[#6D2B35] mt-1">
                                <Compass className="inline h-3 w-3 mr-1 -mt-0.5" />
                                Tarabal: <span className="font-semibold">{d.tara}</span>
                              </p>
                            )}
                          </div>
                          <span className={`text-[10px] font-bold px-2 h-6 inline-flex items-center rounded-md uppercase tracking-wider ${badgeCls}`}>{d.quality}</span>
                        </div>
                        <div className="mt-2 flex items-center gap-2 text-sm">
                          <Clock className="h-3.5 w-3.5 text-[#D4AF37]" />
                          <span className="font-medium text-[#6D2B35]">{d.muhurat}</span>
                        </div>
                        {(d.sunrise || d.sunset) && (
                          <div className="mt-1 flex items-center gap-3 text-[11px] text-[#5a4a3a]/70">
                            {d.sunrise && <span className="inline-flex items-center gap-1"><Sunrise className="h-3 w-3 text-[#D4AF37]" /> {d.sunrise}</span>}
                            {d.sunset && <span className="inline-flex items-center gap-1"><Sunset className="h-3 w-3 text-[#D4AF37]" /> {d.sunset}</span>}
                            {d.avoidWindow && <span className="text-rose-700/80">{d.avoidWindow}</span>}
                          </div>
                        )}
                        {d.notes && <p className="text-xs text-[#5a4a3a]/60 mt-1.5 italic">{d.notes}</p>}
                      </div>
                    );
                  })}
                </div>
              )}
            </section>

            {result.generalGuidelines.length > 0 && (
              <section className="bg-white border border-[#D4AF37]/25 rounded-md p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-6 bg-[#D4AF37]/60" />
                  <Star className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Guidelines</span>
                </div>
                <ul className="space-y-2">
                  {result.generalGuidelines.map((g, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#5a4a3a]/80">
                      <ChevronRight className="h-4 w-4 text-[#D4AF37] flex-shrink-0 mt-0.5" /> {g}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.rituals.length > 0 && (
              <section className="bg-white border border-[#D4AF37]/25 rounded-md p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-6 bg-[#D4AF37]/60" />
                  <Flame className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Rituals to Follow</span>
                </div>
                <ul className="space-y-2">
                  {result.rituals.map((r, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-[#5a4a3a]/80">
                      <span className="text-[#D4AF37] mt-0.5">·</span> {r}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            {result.mantras.length > 0 && (
              <section className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-6 bg-[#D4AF37]/60" />
                  <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Sacred Mantras</span>
                </div>
                <div className="space-y-2">
                  {result.mantras.map((m, i) => (
                    <p key={i} className="font-serif text-[#6D2B35] text-sm bg-white rounded-md p-3 border border-[#D4AF37]/25">{m}</p>
                  ))}
                </div>
              </section>
            )}

            {result.avoidDays.length > 0 && (
              <section className="bg-rose-50 border border-rose-200 rounded-md p-5 sm:p-6">
                <div className="flex items-center gap-2 mb-2">
                  <div className="h-px w-6 bg-rose-400/50" />
                  <span className="text-rose-700 text-[10px] uppercase tracking-[0.25em] font-medium">Days to Avoid</span>
                </div>
                <ul className="space-y-1">
                  {result.avoidDays.map((d, i) => (
                    <li key={i} className="text-xs text-rose-700/80 flex items-start gap-2">
                      <span className="mt-0.5">·</span> {d}
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <div className="flex flex-wrap gap-3 justify-center pt-4">
              <button onClick={() => { setResult(null); }} className={PRIMARY_BTN} data-testid="btn-change-dates">
                Change Inputs
              </button>
              <button onClick={() => { setResult(null); setSelectedCeremony(null); }} className={OUTLINE_BTN} data-testid="btn-other-ceremony">
                Other Ceremonies
              </button>
              <Link href="/book-pandit-online">
                <button className={OUTLINE_BTN} data-testid="btn-book-pandit">
                  Book a Pandit
                </button>
              </Link>
            </div>
          </div>

          <RelatedServicesSection context="panchang" currentPath="/muhurat-finder" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <Link href="/" className="inline-flex items-center gap-1.5 text-[#D4AF37] hover:text-white text-[11px] uppercase tracking-[0.2em] mb-5 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="h-3.5 w-3.5" /> Home
          </Link>
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#D4AF37]/60" />
            <Calendar className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">Vedic Muhurat Engine · Swiss Ephemeris</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" data-testid="text-muhurat-title">Muhurat Finder</h1>
          <p className="text-white/70 max-w-lg text-sm">Find the most auspicious date and time for your ceremony — based on your city's sunrise, real panchang (tithi/nakshatra/yoga/karana) and optionally your janma nakshatra (Tarabal).</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {selectedCeremony ? (
          <div className="max-w-xl mx-auto">
            <button onClick={() => setSelectedCeremony(null)} className="inline-flex items-center gap-1.5 text-[#5a4a3a]/60 hover:text-[#6D2B35] text-[11px] uppercase tracking-[0.2em] mb-4 transition-colors" data-testid="btn-back-list">
              <ArrowLeft className="h-3.5 w-3.5" /> Change Ceremony
            </button>

            <div className="bg-white border border-[#D4AF37]/25 rounded-md overflow-hidden">
              <div className="bg-[#FBF7EE] border-b border-[#D4AF37]/25 p-5">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-md bg-white border border-[#D4AF37]/25 flex items-center justify-center">
                    <selectedCeremony.icon className="h-5 w-5 text-[#6D2B35]" />
                  </div>
                  <div>
                    <h2 className="font-serif text-xl font-bold text-[#6D2B35]">{selectedCeremony.name}</h2>
                    <p className="text-[#D4AF37] text-xs font-medium">{selectedCeremony.nameHindi}</p>
                  </div>
                </div>
              </div>
              <div className="p-5 space-y-4">
                <p className="text-sm text-[#5a4a3a]/70">{selectedCeremony.description}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className={LABEL}>From Date</label>
                    <input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className={FIELD} data-testid="input-from-date" />
                  </div>
                  <div className="space-y-1.5">
                    <label className={LABEL}>To Date</label>
                    <input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className={FIELD} data-testid="input-to-date" />
                  </div>
                </div>

                <div className="space-y-1.5 relative">
                  <label className={LABEL}>City (for sunrise &amp; panchang)</label>
                  <input
                    value={place}
                    onChange={(e) => { setPlace(e.target.value); setShowPlaceList(true); }}
                    onFocus={() => setShowPlaceList(true)}
                    onBlur={() => setTimeout(() => setShowPlaceList(false), 150)}
                    placeholder="e.g. Delhi, Mumbai, Varanasi"
                    className={FIELD}
                    data-testid="input-place"
                  />
                  {showPlaceList && placeOptions.length > 0 && (
                    <ul className="absolute z-10 left-0 right-0 mt-1 bg-white border border-[#D4AF37]/25 rounded-md shadow-md max-h-48 overflow-auto">
                      {placeOptions.map((p, i) => (
                        <li
                          key={i}
                          className="px-3 py-2 text-sm text-[#5a4a3a] hover:bg-[#FBF7EE] cursor-pointer flex items-center gap-2"
                          onMouseDown={(e) => { e.preventDefault(); setPlace(p.name); setShowPlaceList(false); }}
                          data-testid={`place-option-${i}`}
                        >
                          <MapPin className="h-3 w-3 text-[#D4AF37]" />
                          <span>{p.name}{p.state ? `, ${p.state}` : ""}, {p.country}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className={LABEL}>Janma Nakshatra (optional — enables Tarabal)</label>
                  <select
                    value={birthNakshatra}
                    onChange={(e) => setBirthNakshatra(e.target.value)}
                    className={FIELD}
                    data-testid="select-nakshatra"
                  >
                    <option value="">Skip personalisation</option>
                    {NAKSHATRAS_27.map(n => <option key={n} value={n}>{n}</option>)}
                  </select>
                  <p className="text-[10px] text-[#5a4a3a]/50">When set, dates are scored against your janma nakshatra using the 9-Tara cycle.</p>
                </div>

                <button
                  onClick={handleFind}
                  disabled={muhuratMutation.isPending || !fromDate || !toDate || !place.trim()}
                  className={`${PRIMARY_BTN} w-full h-11`}
                  data-testid="btn-find-muhurat"
                >
                  {muhuratMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /> Finding Best Muhurat...</>
                  ) : (
                    <><Sparkles className="h-4 w-4" /> Find Auspicious Muhurat</>
                  )}
                </button>
                <p className="text-[10px] text-center text-[#5a4a3a]/40 uppercase tracking-[0.2em]">Swiss Ephemeris · Lahiri Ayanamsa · AI Narrative</p>
              </div>
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 mb-6">
              <div className="h-px flex-1 bg-[#D4AF37]/25" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Select a Ceremony</span>
              <div className="h-px flex-1 bg-[#D4AF37]/25" />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
              {CEREMONIES.map((ceremony) => (
                <button
                  key={ceremony.id}
                  onClick={() => setSelectedCeremony(ceremony)}
                  className="w-full bg-white rounded-md p-4 border border-[#D4AF37]/25 hover-elevate transition-all text-left"
                  data-testid={`ceremony-${ceremony.id}`}
                >
                  <div className="w-10 h-10 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center mb-3">
                    <ceremony.icon className="w-5 h-5 text-[#6D2B35]" />
                  </div>
                  <h3 className="font-medium text-sm text-[#6D2B35] mb-0.5">{ceremony.name}</h3>
                  <p className="text-[10px] text-[#D4AF37] font-medium mb-1">{ceremony.nameHindi}</p>
                  <p className="text-[10px] text-[#5a4a3a]/55 leading-relaxed">{ceremony.description}</p>
                </button>
              ))}
            </div>

            <div className="mt-10 bg-white rounded-md p-6 border border-[#D4AF37]/25 max-w-2xl mx-auto">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="h-px w-6 bg-[#D4AF37]/60" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Why Muhurat Matters</span>
                <div className="h-px w-6 bg-[#D4AF37]/60" />
              </div>
              <p className="text-sm text-[#5a4a3a]/70 text-center mb-5">In Vedic tradition, starting important events during auspicious planetary alignments (muhurat) ensures success, prosperity, and divine blessings.</p>
              <div className="grid grid-cols-3 gap-px bg-[#D4AF37]/25 rounded-md overflow-hidden border border-[#D4AF37]/25">
                {[
                  { icon: Star, label: "Planetary Alignment" },
                  { icon: Sparkles, label: "Tithi & Nakshatra" },
                  { icon: BookOpen, label: "Vedic Calculations" },
                ].map((item, i) => (
                  <div key={i} className="bg-white p-4 text-center">
                    <item.icon className="h-5 w-5 text-[#D4AF37] mx-auto mb-1.5" />
                    <p className="text-[11px] font-medium text-[#6D2B35]">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        <PageAPlusContent
          eyebrow="Why Use Vedic Tatva Muhurat Finder"
          title="Shubh Muhurat Finder — Auspicious Timing for Every Ceremony"
          intro="In Sanatan tradition, the right time is as important as the right action. Our Muhurat Finder uses authentic Vedic Jyotish to identify the most auspicious window for weddings, griha pravesh, mundan, namkaran, business launch, vehicle purchase and 30+ other life events — based on tithi, nakshatra, yoga, karana and your specific kundli."
          trustBadges={[
            { value: "30+", label: "Muhurat Types" },
            { value: "365", label: "Days Coverage" },
            { value: "City", label: "Location Based" },
            { value: "Free", label: "Basic Lookup" },
          ]}
          benefits={[
            { icon: Heart, title: "Wedding Vivah Muhurat", body: "Auspicious shaadi muhurat with full panchang factors — Guru-Shukra status, Tarabal, Chandrabal, Nakshatra suitability for both bride and groom." },
            { icon: HomeIcon, title: "Griha Pravesh Muhurat", body: "Best dates for housewarming based on tithi, nakshatra, vaar and exclusion of Bhadra, Rahu Kaal, Yamaganda and inauspicious yogas." },
            { icon: Baby, title: "Mundan & Namkaran", body: "Auspicious dates for baby's first haircut (mundan/chudakarana) and naming ceremony (namkaran) — aligned with child's nakshatra." },
            { icon: Store, title: "Business & Vehicle", body: "Best muhurat for new business launch, shop opening, vehicle purchase, foundation laying and signing major contracts." },
            { icon: Scissors, title: "Surgery & Travel", body: "Auspicious dates for elective surgery, important travel and educational beginnings (vidyarambha) — avoiding doshas that delay recovery or create obstacles." },
            { icon: Sparkles, title: "Personalised to Your Kundli", body: "Premium muhurat checks Tarabal, Chandrabal and Vaarsha based on your birth nakshatra — not just generic dates." },
          ]}
          steps={[
            { title: "Choose Event Type", body: "Pick from wedding, griha pravesh, mundan, namkaran, business launch, vehicle purchase, surgery, travel or 25+ other life events." },
            { title: "Set Date Range & City", body: "Enter your preferred 1-3 month window and your city — calculations adjust for your geographic location." },
            { title: "Get Ranked Muhurat List", body: "Receive a list of auspicious windows ranked by quality (Sarvottam, Uttam, Madhyam) with exact start/end times." },
            { title: "Cross-Check Your Kundli", body: "Optionally enter your birth details for personalised Tarabal/Chandrabal verification — ensuring the muhurat aligns with your nakshatra." },
          ]}
          faqs={[
            { q: "What is a shubh muhurat and why does it matter?", a: "A shubh muhurat is an auspicious time window when planetary positions, tithi, nakshatra, yoga and karana combine to maximise positive outcomes. In Vedic tradition, important life events done in shubh muhurat carry blessings and minimise obstacles — millions of Hindu families still consult muhurat for weddings, housewarmings and business launches." },
            { q: "How do you calculate the muhurat?", a: "We use Swiss Ephemeris with Lahiri ayanamsa (the standard for Vedic astrology in India) to compute tithi, nakshatra, yoga, karana, sunrise/sunset, Rahu Kaal and Abhijit muhurat for your selected city. Each candidate date is scored deterministically; AI then writes the ritual & mantra narrative." },
            { q: "What is Tarabal?", a: "Tarabal is the 9-Tara cycle that compares the day's nakshatra to your janma (birth) nakshatra. Sampat, Kshema, Sadhaka, Mitra and Ati Mitra are favourable; Janma, Vipat, Pratyak and Naidhana are best avoided. When you select your janma nakshatra, we apply this scoring on top of the general panchang." },
          ]}
        />
      </div>
    </div>
  );
}
