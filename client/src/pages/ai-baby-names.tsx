import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles, Star, Copy, Check, Loader2, Info, User, Hash, Globe, Heart, BookOpen, Moon,
  Tag,
} from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageSeo from "@/components/PageSeo";
import { faqPage } from "@/lib/seo-schemas";

// High-volume long-tail keyword categories — Indian parents' real search patterns.
// Rendered as visible tag cloud + injected into FAQ/WebApp JSON-LD for Google rich results.
const POPULAR_SEARCHES: { group: string; tags: string[] }[] = [
  {
    group: "Hindu Boy Names",
    tags: [
      "Hindu baby boy names A to Z", "modern Hindu boy names 2026", "unique Sanskrit boy names",
      "baby boy names starting with A", "baby boy names starting with S", "baby boy names starting with K",
      "Lord Krishna names for boys", "Lord Shiva names for boys", "Lord Vishnu names for boys",
      "Lord Rama names for boys", "Lord Ganesha names for boys", "Lord Hanuman names for boys",
      "Vedic boy names with meaning", "rare Hindu boy names", "trending boy names 2026",
    ],
  },
  {
    group: "Hindu Girl Names",
    tags: [
      "Hindu baby girl names A to Z", "modern Hindu girl names 2026", "unique Sanskrit girl names",
      "baby girl names starting with A", "baby girl names starting with S", "baby girl names starting with R",
      "Goddess Lakshmi names for girls", "Goddess Saraswati names for girls", "Goddess Durga names for girls",
      "Goddess Parvati names for girls", "Devi names for baby girl", "Radha names for girls",
      "beautiful Vedic girl names", "rare Hindu girl names", "trending girl names 2026",
    ],
  },
  {
    group: "By Nakshatra (27 Birth Stars)",
    tags: [
      "Ashwini nakshatra baby names", "Bharani nakshatra baby names", "Krittika nakshatra baby names",
      "Rohini nakshatra baby names", "Mrigashira nakshatra baby names", "Ardra nakshatra baby names",
      "Punarvasu nakshatra baby names", "Pushya nakshatra baby names", "Ashlesha nakshatra baby names",
      "Magha nakshatra baby names", "Purva Phalguni baby names", "Uttara Phalguni baby names",
      "Hasta nakshatra baby names", "Chitra nakshatra baby names", "Swati nakshatra baby names",
      "Vishakha nakshatra baby names", "Anuradha nakshatra baby names", "Jyeshtha nakshatra baby names",
      "Mula nakshatra baby names", "Purva Ashadha baby names", "Uttara Ashadha baby names",
      "Shravana nakshatra baby names", "Dhanishta nakshatra baby names", "Shatabhisha baby names",
      "Purva Bhadrapada names", "Uttara Bhadrapada names", "Revati nakshatra baby names",
    ],
  },
  {
    group: "By Rashi (Moon Sign)",
    tags: [
      "Mesh rashi baby names (Aries)", "Vrishabh rashi baby names (Taurus)", "Mithun rashi baby names (Gemini)",
      "Kark rashi baby names (Cancer)", "Singh rashi baby names (Leo)", "Kanya rashi baby names (Virgo)",
      "Tula rashi baby names (Libra)", "Vrishchik rashi baby names (Scorpio)", "Dhanu rashi baby names (Sagittarius)",
      "Makar rashi baby names (Capricorn)", "Kumbh rashi baby names (Aquarius)", "Meen rashi baby names (Pisces)",
    ],
  },
  {
    group: "Regional Indian Names",
    tags: [
      "Tamil baby names with meaning", "Telugu baby names with meaning", "Kannada baby names",
      "Malayalam baby names", "Bengali baby names", "Marathi baby names", "Gujarati baby names",
      "Punjabi Sikh baby names", "Rajasthani baby names", "Odia baby names", "Assamese baby names",
      "South Indian baby names", "North Indian baby names",
    ],
  },
  {
    group: "By Theme & Meaning",
    tags: [
      "baby names meaning blessing", "baby names meaning gift of God", "baby names meaning lotus",
      "baby names meaning sun", "baby names meaning moon", "baby names meaning star",
      "baby names meaning peace", "baby names meaning warrior", "baby names meaning king",
      "baby names meaning queen", "baby names meaning love", "baby names meaning wisdom",
      "baby names meaning victory", "baby names meaning strength", "baby names meaning wealth",
      "spiritual baby names", "Vedic mantra-based names", "Puranic baby names",
    ],
  },
  {
    group: "Naming Ceremony & Tradition",
    tags: [
      "Namkaran ceremony name finder", "Cradle ceremony names", "Annaprashan baby names",
      "12th day naam karan", "namakarana samskara names", "Hindu naming ceremony names",
      "Sikh naming ceremony Naam Karan", "Jain baby naming tradition", "name numerology calculator",
      "Chaldean numerology baby name", "Bhagyank Mulank match", "lucky name number calculator",
    ],
  },
];

const BABY_NAMES_FAQS = [
  { question: "How is a baby's name chosen in Hindu tradition?", answer: "In Sanatan tradition, the baby's name is chosen during the Namkaran samskara on the 12th day after birth. The first syllable is determined by the baby's birth nakshatra and pada (quarter). Each of the 27 nakshatras has 4 padas, each with a specific Sanskrit syllable — giving 108 sacred starting sounds to choose from." },
  { question: "What is nakshatra-based baby naming?", answer: "Each nakshatra has 4 padas, and each pada has an auspicious starting syllable (e.g. Ashwini pada-1 starts with 'Chu', Ashwini pada-2 with 'Che'). Naming your baby with this exact syllable aligns the name's vibration with the baby's birth star — bringing lifelong harmony per Vedic tradition." },
  { question: "Can I find baby names by rashi (moon sign)?", answer: "Yes — names can be filtered by Vedic rashi: Mesh, Vrishabh, Mithun, Kark, Singh, Kanya, Tula, Vrishchik, Dhanu, Makar, Kumbh, Meen. Each rashi has its own letter set based on the four nakshatras within it." },
  { question: "Do you offer regional baby names beyond Sanskrit?", answer: "Yes — we have authentic Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Sikh, Rajasthani and Odia baby names. Each carries deep cultural and dharmic meaning." },
  { question: "Is the Vedic Tatva baby name generator really free?", answer: "Yes — completely free. Browse thousands of names, filter by nakshatra, rashi or starting letter, see meanings and shortlist favourites without any payment." },
  { question: "What is name numerology and does Vedic Tatva calculate it?", answer: "Each Sanskrit/Hindi letter has a numeric value. Adding them gives the name's number (Naamank). Combined with the date of birth (Mulank) and life path (Bhagyank), the right name balances destiny. Our generator returns the numerology for every suggested name." },
  { question: "When is the Namkaran ceremony performed?", answer: "Traditionally on the 12th day after birth. Some traditions perform it on the 11th day, 16th day or 1st month based on family custom. Book a verified pandit on Vedic Tatva to perform the full Namkaran samskara at home." },
  { question: "How accurate is the nakshatra calculation?", answer: "We use Swiss Ephemeris with the Lahiri ayanamsa — the same astronomical engine used by professional Vedic astrologers. The Moon's exact longitude at birth is computed and mapped to the precise nakshatra and pada." },
];

const BABY_NAMES_WEBAPP_SCHEMA = {
  id: "webapp",
  payload: {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Vedic Tatva AI Baby Name Generator",
    applicationCategory: "LifestyleApplication",
    operatingSystem: "All",
    description: "Free AI-powered Hindu baby name generator. Find authentic Sanskrit, Tamil, Telugu, Bengali and regional Indian baby names matched to your child's nakshatra, rashi and pada — with meaning, origin, deity and numerology.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "INR" },
    url: "https://vedictatva.com/ai-baby-names",
    provider: { "@type": "Organization", name: "Vedic Tatva", url: "https://vedictatva.com" },
    featureList: [
      "Nakshatra-based name generation (27 nakshatras × 4 padas)",
      "Rashi (moon sign) matched names",
      "Regional Indian naming traditions",
      "Sanskrit etymology with deity association",
      "Chaldean numerology for every name",
      "Free unlimited generations",
    ],
  },
};

interface BabyName {
  name: string;
  nameInHindi: string;
  nameInScript?: string;
  pronunciation?: string;
  syllables?: number;
  meaning: string;
  origin: string;
  deity?: string;
  numerology: number;
  popularity: string;
  gender: string;
}

interface BabyNamesResult {
  nakshatraInfo: {
    nakshatra: string;
    nakshatraLord: string;
    rashi: string;
    recommendedLetters: string[];
  };
  astrologicalNote: string;
  names: BabyName[];
}

const PRIMARY_BTN = "bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-11 px-6 text-sm font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50";
const FIELD_INPUT = "w-full h-10 rounded-md border border-[#D4AF37]/25 bg-white px-3 text-sm text-[#6D2B35] focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30";
const LABEL_CLS = "text-[10px] font-semibold text-[#6D2B35] uppercase tracking-[0.2em]";

export default function AIBabyNames() {
  const { toast } = useToast();
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [gender, setGender] = useState("Boy");
  const [religion, setReligion] = useState("Hindu");
  const [startingLetter, setStartingLetter] = useState("");
  const [language, setLanguage] = useState("Hindu-English");
  const [syllableCount, setSyllableCount] = useState("any");
  const [copiedName, setCopiedName] = useState<string | null>(null);

  const generateMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/ai/baby-names", {
        method: "POST",
        body: JSON.stringify({
          birthDate,
          birthTime: birthTime || null,
          birthCity: birthCity || null,
          gender,
          religion,
          startingLetter: startingLetter || null,
          language,
          syllableCount,
        }),
      }) as Promise<BabyNamesResult>;
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Could not generate names. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleCopy = (name: string) => {
    navigator.clipboard.writeText(name);
    setCopiedName(name);
    toast({ title: "Copied!", description: `"${name}" copied to clipboard.` });
    setTimeout(() => setCopiedName(null), 2000);
  };

  const popularityToken = (p: string) => {
    switch (p.toLowerCase()) {
      case "common": return "bg-emerald-50 text-emerald-700 border border-emerald-200";
      case "unique": return "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/40";
      case "rare": return "bg-amber-50 text-amber-700 border border-amber-200";
      default: return "bg-white text-[#5a4a3a] border border-[#D4AF37]/25";
    }
  };

  const result = generateMutation.data;

  return (
    <div className="w-full pb-16 bg-white">
      <PageSeo
        title="Free AI Baby Name Generator — Hindu, Sanskrit & Regional Names by Nakshatra | Vedic Tatva"
        description="Free AI-powered Hindu baby name generator. Find authentic Sanskrit, Tamil, Telugu, Bengali and regional Indian baby names matched to your child's nakshatra, rashi and pada — with meaning, origin, deity and numerology."
        keywords="baby name generator, hindu baby names, nakshatra baby names, sanskrit baby names, rashi baby names, tamil baby names, telugu baby names, bengali baby names, namkaran"
        canonical="/ai-baby-names"
        twitterCard="summary_large_image"
        schemas={[faqPage(BABY_NAMES_FAQS), BABY_NAMES_WEBAPP_SCHEMA]}
      />
      <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-10 sm:py-14 max-w-3xl">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#D4AF37]/60" />
            <Sparkles className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium" data-testid="badge-free">Free Vedic Tool</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold leading-tight mb-2" data-testid="heading-hero">
            AI Baby Name Generator
          </h1>
          <p className="text-white/75 text-sm sm:text-base max-w-2xl leading-relaxed" data-testid="text-hero-subtitle">
            Discover the perfect name for your little one based on Vedic Nakshatra, Rashi and ancient naming traditions.
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 mt-8">
        <div className="max-w-3xl mx-auto bg-white border border-[#D4AF37]/25 rounded-md p-6 sm:p-8" data-testid="card-birth-form">
          <div className="flex items-center gap-2 mb-5">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Birth Details</span>
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#6D2B35] mb-5">Enter Birth Details</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="birthDate" className={LABEL_CLS}>Date of Birth *</label>
              <input id="birthDate" type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className={FIELD_INPUT} data-testid="input-birth-date" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="birthTime" className={LABEL_CLS}>Time of Birth (optional)</label>
              <input id="birthTime" type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className={FIELD_INPUT} data-testid="input-birth-time" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="birthCity" className={LABEL_CLS}>Place of Birth (optional)</label>
              <input id="birthCity" type="text" placeholder="e.g. New Delhi" value={birthCity} onChange={(e) => setBirthCity(e.target.value)} className={FIELD_INPUT} data-testid="input-birth-city" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="gender" className={LABEL_CLS}>Gender</label>
              <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} className={FIELD_INPUT} data-testid="select-gender">
                <option value="Boy">Boy</option>
                <option value="Girl">Girl</option>
                <option value="Unisex">Unisex</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="religion" className={LABEL_CLS}>Religion / Tradition</label>
              <select id="religion" value={religion} onChange={(e) => setReligion(e.target.value)} className={FIELD_INPUT} data-testid="select-religion">
                <option value="Hindu">Hindu</option>
                <option value="Sikh">Sikh</option>
                <option value="Jain">Jain</option>
                <option value="Buddhist">Buddhist</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="startingLetter" className={LABEL_CLS}>Starting Letter (optional)</label>
              <input id="startingLetter" type="text" placeholder="Leave blank for nakshatra" value={startingLetter} onChange={(e) => setStartingLetter(e.target.value)} className={FIELD_INPUT} data-testid="input-starting-letter" />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="language" className={LABEL_CLS}>Name Style / Language</label>
              <select id="language" value={language} onChange={(e) => setLanguage(e.target.value)} className={FIELD_INPUT} data-testid="select-language">
                <option value="Hindu-English">Hindu — English script (Aarav, Aanya)</option>
                <option value="Hindu-Hindi">Hindu — Devanagari (आरव, अनन्या)</option>
                <option value="Sanskrit">Pure Sanskrit (Vedic / Puranic)</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Telugu">Telugu (తెలుగు)</option>
                <option value="Kannada">Kannada (ಕನ್ನಡ)</option>
                <option value="Malayalam">Malayalam (മലയാളം)</option>
                <option value="Bengali">Bengali (বাংলা)</option>
                <option value="Marathi">Marathi (मराठी)</option>
                <option value="Gujarati">Gujarati (ગુજરાતી)</option>
                <option value="Punjabi">Punjabi (ਪੰਜਾਬੀ)</option>
                <option value="Sikh">Sikh (Gurmukhi)</option>
                <option value="Mixed">Mixed Indian (all traditions)</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label htmlFor="syllableCount" className={LABEL_CLS}>Name Length / Syllables</label>
              <select id="syllableCount" value={syllableCount} onChange={(e) => setSyllableCount(e.target.value)} className={FIELD_INPUT} data-testid="select-syllable-count">
                <option value="any">Any length (mix of short and medium)</option>
                <option value="2">Short — 2 syllables (Aarav, Diya)</option>
                <option value="3">Medium — 3 syllables (Ananya, Arjun-veer)</option>
                <option value="4">Long — 4+ syllables (Mahipati, Padmavati)</option>
              </select>
            </div>
          </div>

          <div className="mt-6 text-center">
            <button
              className={PRIMARY_BTN}
              onClick={() => generateMutation.mutate()}
              disabled={!birthDate || generateMutation.isPending}
              data-testid="button-generate-names"
            >
              {generateMutation.isPending ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Consulting the stars...</>
              ) : (
                <><Sparkles className="w-4 h-4" /> Generate Names</>
              )}
            </button>
          </div>
        </div>

        {result && (
          <div className="mt-10 max-w-5xl mx-auto space-y-6">
            <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-6 sm:p-8" data-testid="card-nakshatra-info">
              <div className="flex items-center gap-2 mb-4">
                <div className="h-px w-6 bg-[#D4AF37]/60" />
                <Star className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Nakshatra Details</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#D4AF37]/25 rounded-md overflow-hidden border border-[#D4AF37]/25 mb-5">
                <div className="bg-white p-4">
                  <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] mb-1">Nakshatra</p>
                  <p className="text-base font-semibold text-[#6D2B35]" data-testid="text-nakshatra">{result.nakshatraInfo.nakshatra}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] mb-1">Nakshatra Lord</p>
                  <p className="text-base font-semibold text-[#6D2B35]" data-testid="text-nakshatra-lord">{result.nakshatraInfo.nakshatraLord}</p>
                </div>
                <div className="bg-white p-4">
                  <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] mb-1">Rashi</p>
                  <p className="text-base font-semibold text-[#6D2B35]" data-testid="text-rashi">{result.nakshatraInfo.rashi}</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] text-[#5a4a3a]/55 uppercase tracking-[0.2em] mb-2">Recommended Starting Syllables</p>
                <div className="flex flex-wrap gap-2" data-testid="container-recommended-letters">
                  {result.nakshatraInfo.recommendedLetters.map((letter, i) => (
                    <span key={i} className="inline-flex items-center bg-white text-[#6D2B35] text-xs font-semibold px-2.5 h-7 rounded-md border border-[#D4AF37]/40" data-testid={`badge-letter-${i}`}>
                      {letter}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 sm:p-5" data-testid="card-astrological-note">
              <div className="flex items-start gap-3">
                <Info className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <p className="text-sm text-amber-900 leading-relaxed" data-testid="text-astrological-note">{result.astrologicalNote}</p>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-center gap-2 mb-5">
                <div className="h-px w-6 bg-[#D4AF37]/60" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Suggested Names</span>
                <div className="h-px w-6 bg-[#D4AF37]/60" />
              </div>
              <h3 className="font-serif text-xl sm:text-2xl font-bold text-[#6D2B35] mb-5 text-center" data-testid="heading-names-grid">
                Names Matched to Your Baby
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" data-testid="grid-names">
                {result.names.map((name, i) => (
                  <div key={i} className="bg-white border border-[#D4AF37]/25 rounded-md p-5 hover-elevate transition-all" data-testid={`card-name-${i}`}>
                    <div className="flex items-start justify-between mb-1.5 gap-2">
                      <div className="min-w-0 flex-1">
                        <h4 className="font-serif text-lg font-bold text-[#6D2B35] break-words" data-testid={`text-name-english-${i}`}>{name.name}</h4>
                        {name.nameInScript && name.nameInScript !== name.nameInHindi && (
                          <p className="text-sm text-[#6D2B35]/90 font-semibold mt-0.5 break-words" data-testid={`text-name-script-${i}`}>{name.nameInScript}</p>
                        )}
                        {name.nameInHindi && (
                          <p className="text-xs text-[#D4AF37] font-medium mt-0.5 break-words" data-testid={`text-name-hindi-${i}`}>{name.nameInHindi}</p>
                        )}
                        {name.pronunciation && (
                          <p className="text-[11px] text-[#5a4a3a]/65 italic mt-1" data-testid={`text-pronunciation-${i}`}>
                            <span className="not-italic font-semibold text-[#5a4a3a]/55">say:</span> {name.pronunciation}
                          </p>
                        )}
                      </div>
                      <button onClick={() => handleCopy(name.name)} className="p-1.5 rounded-md hover:bg-[#FBF7EE] transition-colors shrink-0" title="Copy name" data-testid={`button-copy-${i}`}>
                        {copiedName === name.name ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-[#5a4a3a]/50" />}
                      </button>
                    </div>
                    <p className="text-sm text-[#5a4a3a]/85 mt-2 mb-3 leading-relaxed" data-testid={`text-meaning-${i}`}>{name.meaning}</p>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className="inline-flex items-center bg-[#FBF7EE] text-[#6D2B35] text-[10px] font-medium px-2 h-6 rounded-md border border-[#D4AF37]/40" data-testid={`badge-origin-${i}`}>
                        {name.origin}
                      </span>
                      <span className={`inline-flex items-center text-[10px] font-medium px-2 h-6 rounded-md ${popularityToken(name.popularity)}`} data-testid={`badge-popularity-${i}`}>
                        {name.popularity}
                      </span>
                      <span className="inline-flex items-center gap-1 bg-white text-[#5a4a3a] text-[10px] font-medium px-2 h-6 rounded-md border border-[#D4AF37]/25" data-testid={`badge-gender-${i}`}>
                        <User className="w-2.5 h-2.5" />{name.gender}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-[#5a4a3a]/55 pt-2 border-t border-[#D4AF37]/15">
                      {name.deity && (
                        <span className="inline-flex items-center gap-1" data-testid={`text-deity-${i}`}>
                          <Star className="w-2.5 h-2.5 text-[#D4AF37]" />{name.deity}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1" data-testid={`text-numerology-${i}`}>
                        <Hash className="w-2.5 h-2.5" />Numerology: {name.numerology}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <PageAPlusContent
          eyebrow="Why Use Vedic Tatva Baby Names"
          title="Free Hindu Baby Names by Nakshatra, Rashi & Meaning"
          intro="Choosing your baby's name is one of life's most sacred decisions. Our AI suggests authentic Hindu, Sanskrit and regional baby names matched to your child's nakshatra, rashi and birth syllable (akshar) — with deep meaning, scriptural origin and numerological balance."
          trustBadges={[
            { value: "10,000+", label: "Authentic Names" },
            { value: "27", label: "Nakshatra Matched" },
            { value: "12+", label: "Languages" },
            { value: "Free", label: "Forever" },
          ]}
          benefits={[
            { icon: Star, title: "Nakshatra-Based Names", body: "Names matched to your baby's exact birth nakshatra — using the auspicious starting syllable (akshar) for each pada (quarter) of the nakshatra." },
            { icon: Moon, title: "Rashi & Moon Sign", body: "Names aligned with your baby's Vedic moon sign (rashi) — bringing planetary harmony from the very first sound called out." },
            { icon: BookOpen, title: "Scriptural Origin", body: "Every name traced to authentic source — Vedas, Puranas, Ramayana, Mahabharata or Sanskrit grammar — with deep meaning explained." },
            { icon: Globe, title: "All Indian Traditions", body: "Hindu, Sanskrit, Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Sikh — names from every Indian tradition." },
            { icon: Heart, title: "Boy & Girl Names", body: "Thousands of beautiful names for boys and girls — ancient, classic, modern, unique — all rooted in dharmic tradition." },
            { icon: Hash, title: "Numerology Balanced", body: "Optional name numerology check — balance the Bhagyank (destiny number) and Mulank (root number) for prosperity." },
          ]}
          steps={[
            { title: "Enter Birth Details", body: "Provide your baby's date, time and place of birth — used to calculate exact nakshatra and rashi." },
            { title: "Choose Tradition", body: "Select your preferred tradition — Hindu/Sanskrit, Tamil, Telugu, Bengali, Marathi or any regional style." },
            { title: "Get Name Suggestions", body: "Receive 50+ matched names with meaning, origin, syllable and gender — both classic and modern options." },
            { title: "Save Favourites", body: "Shortlist your favourite names, share with family via WhatsApp, and choose the perfect name for your child." },
          ]}
          faqs={[
            { q: "How is a baby's name chosen in Hindu tradition?", a: "In Sanatan tradition, the baby's name is chosen during the Namkaran samskara (12th day after birth). The first syllable is determined by the baby's birth nakshatra and pada (quarter). Each of the 27 nakshatras has 4 padas, each with a specific Sanskrit syllable — giving 108 sacred starting sounds." },
            { q: "What is nakshatra-based naming?", a: "Each nakshatra has 4 padas, and each pada has an auspicious starting syllable (e.g. Ashwini pada-1 starts with 'Chu', pada-2 with 'Che'). Naming your baby with this syllable aligns the name's vibration with the baby's birth star — bringing lifelong harmony." },
            { q: "Can I find names by rashi (zodiac sign)?", a: "Yes — names can be filtered by Vedic rashi (Mesh, Vrishabh, Mithun, Kark, Singh, Kanya, Tula, Vrishchik, Dhanu, Makar, Kumbh, Meen). Each rashi has its own letter set based on the four nakshatras within it." },
            { q: "Do you offer regional names beyond Sanskrit?", a: "Yes — we have authentic Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi and Sikh names. Each carries deep cultural and dharmic meaning, beyond just sound." },
            { q: "Is the baby names tool really free?", a: "Yes — completely free. Browse thousands of names, filter by nakshatra/rashi/tradition, see meanings and shortlist favourites without any payment. Premium consultations with naming experts are optional add-ons." },
            { q: "What is name numerology?", a: "Each Sanskrit/Hindi letter has a numeric value. Adding them gives the name's number (Naamank). When combined with the date of birth (Mulank) and life path (Bhagyank), the right name balances destiny — a tradition followed for centuries by Vedic numerologists." },
            { q: "Should the name match the father's, mother's or grandparent's name?", a: "Many traditions name the child to honour grandparents — common in South Indian families. The most important factor is the nakshatra-based starting syllable. Our tool can suggest names that honour family tradition while still aligning with the baby's birth nakshatra." },
            { q: "When is the Namkaran ceremony performed?", a: "Traditionally on the 12th day after birth. Some traditions perform it on the 11th day, 16th day or 1st month based on family custom. Book a verified pandit on Vedic Tatva to perform the full Namkaran samskara — including the formal naming ritual at home." },
          ]}
          keywordsBlurb="Free AI baby name generator for Hindu, Sanskrit and Indian parents — find perfect baby boy names and baby girl names by nakshatra, rashi, pada and starting syllable. Generate authentic Hindu baby names A to Z, modern Hindu names 2026, unique Sanskrit names, rare Vedic names and trending Indian names. Search names by all 27 nakshatras — Ashwini, Bharani, Krittika, Rohini, Mrigashira, Ardra, Punarvasu, Pushya, Ashlesha, Magha, Purva Phalguni, Uttara Phalguni, Hasta, Chitra, Swati, Vishakha, Anuradha, Jyeshtha, Mula, Purva Ashadha, Uttara Ashadha, Shravana, Dhanishta, Shatabhisha, Purva Bhadrapada, Uttara Bhadrapada and Revati. Find names by all 12 rashis — Mesh (Aries), Vrishabh (Taurus), Mithun (Gemini), Kark (Cancer), Singh (Leo), Kanya (Virgo), Tula (Libra), Vrishchik (Scorpio), Dhanu (Sagittarius), Makar (Capricorn), Kumbh (Aquarius), Meen (Pisces). Regional Indian baby names — Tamil, Telugu, Kannada, Malayalam, Bengali, Marathi, Gujarati, Punjabi, Sikh, Rajasthani, Odia, Assamese — South Indian and North Indian traditions. Names of Lord Krishna, Lord Rama, Lord Shiva, Lord Vishnu, Lord Ganesha, Lord Hanuman, Goddess Lakshmi, Goddess Saraswati, Goddess Durga, Goddess Parvati, Devi and Radha — drawn from Vedas, Puranas, Ramayana, Mahabharata and Bhagavata. Namkaran samskara naming, 12th day cradle ceremony, Annaprashan baby names, Chaldean numerology calculator, Bhagyank Mulank match, lucky name number — calculated using Swiss Ephemeris with Lahiri ayanamsa for 100% accurate Vedic results. Hindi baby names, English transliteration, Sanskrit meaning, deity association — completely free, instantly downloadable."
        />

        <section className="mt-12 max-w-5xl mx-auto" data-testid="section-popular-searches">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-6 bg-[#D4AF37]/60" />
            <Tag className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Popular Baby Name Searches</span>
            <div className="h-px w-6 bg-[#D4AF37]/60" />
          </div>
          <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#6D2B35] mb-1 text-center">Find Hindu Baby Names by Category</h2>
          <p className="text-center text-[12.5px] text-[#5a4a3a]/65 mb-6 max-w-2xl mx-auto">Browse the most-searched Hindu baby name categories on Vedic Tatva — by nakshatra, rashi, deity, region and theme.</p>
          <div className="space-y-5">
            {POPULAR_SEARCHES.map((cat) => (
              <div key={cat.group} data-testid={`group-${cat.group.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`}>
                <h3 className="text-[11px] uppercase tracking-[0.18em] font-semibold text-[#6D2B35] mb-2">{cat.group}</h3>
                <div className="flex flex-wrap gap-1.5">
                  {cat.tags.map((tag, j) => (
                    <span
                      key={j}
                      className="inline-flex items-center bg-white text-[#5a4a3a] text-[11px] px-2.5 h-7 rounded-md border border-[#D4AF37]/25 hover-elevate"
                      data-testid={`tag-${j}`}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        <RelatedServicesSection context="baby-names" currentPath="/ai-baby-names" />
      </div>
    </div>
  );
}
