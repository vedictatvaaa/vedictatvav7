import { useState, useCallback } from "react";
import { Search, BookOpen, Sparkles, Loader2, Copy, Bookmark, BookMarked, ChevronDown, ChevronUp, Star, Lightbulb, Heart, Quote, Globe, Share2, ArrowRight, ScrollText, Flame, Sun, Moon, Compass, Brain } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { useToast } from "@/hooks/use-toast";

type ScriptureResult = {
  title: string;
  scripture: string;
  verses: { reference: string; sanskrit: string; transliteration: string; meaning: string; chapter?: string }[];
  interpretation: string;
  context: string;
  application: string;
  relatedTeachings: { text: string; source: string }[];
  keywords: string[];
  mood: string;
};

const scriptures = [
  { id: "all", label: "All Scriptures", labelHindi: "सभी शास्त्र", icon: BookOpen },
  { id: "Bhagavad Gita", label: "Bhagavad Gita", labelHindi: "भगवद्गीता", icon: Flame },
  { id: "Vedas", label: "Vedas", labelHindi: "वेद", icon: Sun },
  { id: "Upanishads", label: "Upanishads", labelHindi: "उपनिषद", icon: Lightbulb },
  { id: "Ramayana", label: "Ramayana", labelHindi: "रामायण", icon: Heart },
  { id: "Mahabharata", label: "Mahabharata", labelHindi: "महाभारत", icon: Star },
  { id: "Puranas", label: "Puranas", labelHindi: "पुराण", icon: ScrollText },
  { id: "Yoga Sutras", label: "Yoga Sutras", labelHindi: "योग सूत्र", icon: Compass },
];

const suggestedQueries = [
  { query: "What does the Gita say about karma and duty?", icon: Flame },
  { query: "Meaning of Om and its significance", icon: Sun },
  { query: "What is dharma according to Hindu scriptures?", icon: Star },
  { query: "Teachings about meditation and inner peace", icon: Moon },
  { query: "What do Vedas say about creation of universe?", icon: Globe },
  { query: "Path to moksha and liberation", icon: Sparkles },
  { query: "Importance of truth and righteousness", icon: Lightbulb },
  { query: "Love and devotion in Ramayana", icon: Heart },
];

const moodIcons: Record<string, typeof Brain> = {
  contemplative: Moon,
  inspirational: Sun,
  devotional: Heart,
  philosophical: Brain,
  practical: Lightbulb,
};

const PRIMARY_BTN = "bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2 disabled:opacity-50";
const OUTLINE_BTN = "bg-[#FBF7EE] text-[#6D2B35] border border-[#D4AF37]/25 hover:bg-[#f4eedd] rounded-md h-10 px-5 text-[13px] font-semibold transition-colors inline-flex items-center justify-center gap-2";

export default function ScriptureSearch() {
  const [query, setQuery] = useState("");
  const [selectedScripture, setSelectedScripture] = useState("all");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScriptureResult | null>(null);
  const [savedVerses, setSavedVerses] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("vedictatva_saved_verses");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch { return new Set(); }
  });
  const [history, setHistory] = useState<{ query: string; title: string }[]>(() => {
    try {
      const h = localStorage.getItem("vedictatva_scripture_history");
      return h ? JSON.parse(h) : [];
    } catch { return []; }
  });
  const [expandedVerse, setExpandedVerse] = useState<number | null>(null);
  const [showRelated, setShowRelated] = useState(false);
  const { toast } = useToast();

  const searchScriptures = useCallback(async (searchQuery?: string) => {
    const q = searchQuery || query;
    if (!q.trim() || q.trim().length < 2) {
      toast({ title: "Please enter a search query", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/scripture/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: q.trim(), scripture: selectedScripture }),
      });
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResult(data);
      const newHistory = [{ query: q.trim(), title: data.title }, ...history.filter(h => h.query !== q.trim())].slice(0, 10);
      setHistory(newHistory);
      localStorage.setItem("vedictatva_scripture_history", JSON.stringify(newHistory));
    } catch {
      toast({ title: "Failed to search scriptures", description: "Please try again", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [query, selectedScripture, history, toast]);

  const toggleSaveVerse = (ref: string) => {
    const next = new Set(savedVerses);
    if (next.has(ref)) next.delete(ref); else next.add(ref);
    setSavedVerses(next);
    localStorage.setItem("vedictatva_saved_verses", JSON.stringify(Array.from(next)));
    toast({ title: next.has(ref) ? "Verse bookmarked" : "Bookmark removed" });
  };

  const copyVerse = (verse: ScriptureResult["verses"][0]) => {
    const text = `${verse.reference}\n\n${verse.sanskrit}\n\n${verse.transliteration}\n\n"${verse.meaning}"\n\n— via Vedic Tatva`;
    navigator.clipboard.writeText(text);
    toast({ title: "Verse copied to clipboard" });
  };

  const MoodIcon = result ? (moodIcons[result.mood] || Sparkles) : Sparkles;

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-[#6D2B35] text-white border-b border-[#D4AF37]/30">
        <div className="container mx-auto px-4 py-10 sm:py-14">
          <div className="flex items-center gap-2 mb-3">
            <div className="h-px w-8 bg-[#D4AF37]/60" />
            <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[11px] uppercase tracking-[0.25em] font-medium">Divine Scripture Search</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl font-bold mb-2" data-testid="scripture-search-title">Explore Sacred Wisdom</h1>
          <p className="text-white/70 text-sm max-w-2xl leading-relaxed">
            Search across Bhagavad Gita, Vedas, Upanishads, Ramayana, Mahabharata and more — with AI-powered interpretations connecting ancient wisdom to modern life.
          </p>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white border border-[#D4AF37]/25 rounded-md p-4 md:p-5" data-testid="scripture-search-card">
          <div className="flex flex-col gap-4">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#6D2B35]/40" />
                <input
                  placeholder="Ask about karma, dharma, moksha, meditation, truth, love..."
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && searchScriptures()}
                  className="w-full h-10 pl-10 pr-3 rounded-md border border-[#D4AF37]/25 bg-white text-sm text-[#6D2B35] placeholder:text-[#6D2B35]/40 focus:outline-none focus:border-[#D4AF37] focus:ring-1 focus:ring-[#D4AF37]/30"
                  data-testid="scripture-search-input"
                />
              </div>
              <button
                onClick={() => searchScriptures()}
                disabled={loading || !query.trim()}
                className={PRIMARY_BTN}
                data-testid="scripture-search-btn"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                Search
              </button>
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {scriptures.map(s => {
                const active = selectedScripture === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setSelectedScripture(s.id)}
                    className={`flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium whitespace-nowrap transition-colors border ${active ? "bg-[#6D2B35] text-[#D4AF37] border-[#6D2B35]" : "bg-[#FBF7EE] text-[#5a4a3a] border-[#D4AF37]/25 hover-elevate"}`}
                    data-testid={`scripture-filter-${s.id}`}
                  >
                    <s.icon className="h-3 w-3" />
                    {s.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {!result && !loading && (
          <div className="mt-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px flex-1 bg-[#D4AF37]/25" />
              <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Popular Questions</span>
              <div className="h-px flex-1 bg-[#D4AF37]/25" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {suggestedQueries.map((sq, i) => (
                <button
                  key={i}
                  onClick={() => { setQuery(sq.query); searchScriptures(sq.query); }}
                  className="flex items-center gap-3 p-4 bg-white rounded-md border border-[#D4AF37]/25 hover-elevate transition-all text-left group"
                  data-testid={`suggested-query-${i}`}
                >
                  <div className="w-9 h-9 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center flex-shrink-0">
                    <sq.icon className="h-4 w-4 text-[#6D2B35]" />
                  </div>
                  <span className="text-sm text-[#5a4a3a] flex-1">{sq.query}</span>
                  <ArrowRight className="h-4 w-4 text-[#D4AF37]/50 group-hover:text-[#D4AF37] transition-colors" />
                </button>
              ))}
            </div>

            {history.length > 0 && (
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-3">
                  <div className="h-px w-5 bg-[#D4AF37]/60" />
                  <ScrollText className="h-3 w-3 text-[#D4AF37]" />
                  <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Recent Searches</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {history.map((h, i) => (
                    <button
                      key={i}
                      onClick={() => { setQuery(h.query); searchScriptures(h.query); }}
                      className="px-3 h-7 inline-flex items-center bg-white rounded-md text-xs text-[#5a4a3a] border border-[#D4AF37]/25 hover-elevate transition-all"
                      data-testid={`history-item-${i}`}
                    >
                      {h.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {loading && (
          <div className="mt-12 text-center py-16">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 rounded-full border border-[#D4AF37]/25" />
              <div className="absolute inset-0 rounded-full border-2 border-t-[#D4AF37] border-r-transparent border-b-transparent border-l-transparent animate-spin" />
              <div className="absolute inset-3 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center">
                <BookOpen className="h-5 w-5 text-[#6D2B35]" />
              </div>
            </div>
            <p className="text-[#6D2B35] font-medium font-serif">Searching sacred texts...</p>
            <p className="text-xs text-[#5a4a3a]/50 mt-1 uppercase tracking-[0.2em]">Finding relevant shlokas and interpretations</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-8 space-y-5 pb-16">
            <div className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className="px-2 h-6 inline-flex items-center gap-1 rounded-md text-[10px] font-semibold uppercase tracking-wider border border-[#D4AF37]/30 bg-[#FBF7EE] text-[#6D2B35]">
                    <MoodIcon className="h-3 w-3" />{result.mood?.charAt(0).toUpperCase() + result.mood?.slice(1)}
                  </span>
                  <span className="text-xs text-[#D4AF37] font-medium">{result.scripture}</span>
                </div>
                <h2 className="font-serif text-2xl font-bold text-[#6D2B35]" data-testid="result-title">{result.title}</h2>
              </div>
              <button onClick={() => {
                const text = `${result.title}\n\n${result.verses.map(v => `${v.reference}: "${v.meaning}"`).join("\n\n")}\n\n— via Vedic Tatva`;
                navigator.clipboard.writeText(text);
                toast({ title: "Result copied!" });
              }} className={`${OUTLINE_BTN} h-9 px-3 text-xs`} data-testid="copy-result-btn">
                <Share2 className="h-3 w-3" /> Share
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="h-px w-6 bg-[#D4AF37]/60" />
                <Quote className="h-3 w-3 text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">Sacred Verses ({result.verses?.length || 0})</span>
              </div>
              {result.verses?.map((verse, i) => (
                <div key={i} className="bg-white border border-[#D4AF37]/25 rounded-md overflow-hidden" data-testid={`verse-card-${i}`}>
                  <div className="bg-[#6D2B35] px-4 h-10 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <BookOpen className="h-3.5 w-3.5 text-[#D4AF37]" />
                      <span className="text-[#D4AF37] text-sm font-medium">{verse.reference}</span>
                      {verse.chapter && <span className="text-white/50 text-xs">• {verse.chapter}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      <button onClick={() => toggleSaveVerse(verse.reference)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors" data-testid={`bookmark-verse-${i}`}>
                        {savedVerses.has(verse.reference) ? <BookMarked className="h-3.5 w-3.5 text-[#D4AF37]" /> : <Bookmark className="h-3.5 w-3.5 text-white/60" />}
                      </button>
                      <button onClick={() => copyVerse(verse)} className="p-1.5 rounded-md hover:bg-white/10 transition-colors" data-testid={`copy-verse-${i}`}>
                        <Copy className="h-3.5 w-3.5 text-white/60" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4 space-y-3">
                    <div className="bg-[#FBF7EE] rounded-md p-3 border border-[#D4AF37]/25">
                      <p className="text-[#6D2B35] font-medium text-base leading-relaxed font-serif">{verse.sanskrit}</p>
                    </div>
                    {expandedVerse === i && (
                      <p className="text-xs text-[#5a4a3a]/60 italic px-1">{verse.transliteration}</p>
                    )}
                    <p className="text-sm text-[#5a4a3a] leading-relaxed px-1">
                      <span className="text-[#D4AF37] font-serif text-lg leading-none mr-1">"</span>
                      {verse.meaning}
                      <span className="text-[#D4AF37] font-serif text-lg leading-none ml-1">"</span>
                    </p>
                    <button onClick={() => setExpandedVerse(expandedVerse === i ? null : i)} className="text-[11px] uppercase tracking-[0.2em] text-[#6D2B35]/60 flex items-center gap-1 hover:text-[#6D2B35] transition-colors">
                      {expandedVerse === i ? <><ChevronUp className="h-3 w-3" /> Hide transliteration</> : <><ChevronDown className="h-3 w-3" /> Show transliteration</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-5" data-testid="interpretation-card">
              <div className="flex items-center gap-2 mb-3">
                <div className="h-px w-6 bg-[#D4AF37]/60" />
                <Brain className="h-3.5 w-3.5 text-[#D4AF37]" />
                <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.25em] font-medium">AI Interpretation</span>
              </div>
              <p className="text-sm text-[#5a4a3a] leading-relaxed whitespace-pre-line">{result.interpretation}</p>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white border border-[#D4AF37]/25 rounded-md p-5" data-testid="context-card">
                <div className="flex items-center gap-2 mb-3">
                  <ScrollText className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-[#6D2B35] text-[11px] uppercase tracking-[0.2em] font-semibold">Spiritual Context</span>
                </div>
                <p className="text-sm text-[#5a4a3a]/80 leading-relaxed">{result.context}</p>
              </div>
              <div className="bg-white border border-[#D4AF37]/25 rounded-md p-5" data-testid="application-card">
                <div className="flex items-center gap-2 mb-3">
                  <Lightbulb className="h-3.5 w-3.5 text-[#D4AF37]" />
                  <span className="text-[#6D2B35] text-[11px] uppercase tracking-[0.2em] font-semibold">Practical Application</span>
                </div>
                <p className="text-sm text-[#5a4a3a]/80 leading-relaxed">{result.application}</p>
              </div>
            </div>

            {result.relatedTeachings?.length > 0 && (
              <div className="bg-white border border-[#D4AF37]/25 rounded-md p-5" data-testid="related-card">
                <button onClick={() => setShowRelated(!showRelated)} className="w-full flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3.5 w-3.5 text-[#D4AF37]" />
                    <span className="text-[#6D2B35] text-[11px] uppercase tracking-[0.2em] font-semibold">Related Teachings ({result.relatedTeachings.length})</span>
                  </div>
                  {showRelated ? <ChevronUp className="h-4 w-4 text-[#D4AF37]" /> : <ChevronDown className="h-4 w-4 text-[#D4AF37]" />}
                </button>
                {showRelated && (
                  <div className="mt-3 space-y-2">
                    {result.relatedTeachings.map((rt, i) => (
                      <div key={i} className="flex items-start gap-2 p-3 bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md">
                        <Quote className="h-3.5 w-3.5 text-[#D4AF37] mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-sm text-[#5a4a3a]">{rt.text}</p>
                          <p className="text-xs text-[#6D2B35]/70 mt-0.5 font-medium">— {rt.source}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {result.keywords?.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {result.keywords.map((kw, i) => (
                  <button key={i} onClick={() => { setQuery(kw); searchScriptures(kw); }}
                    className="px-3 h-7 inline-flex items-center bg-white rounded-md text-xs text-[#6D2B35] border border-[#D4AF37]/25 hover-elevate transition-all"
                    data-testid={`keyword-${i}`}
                  >
                    #{kw}
                  </button>
                ))}
              </div>
            )}

            <div className="text-center pt-4">
              <button onClick={() => { setResult(null); setQuery(""); }} className={OUTLINE_BTN} data-testid="new-search-btn">
                <Search className="h-4 w-4" /> New Search
              </button>
            </div>
          </div>
        )}

        <PageAPlusContent
          eyebrow="Why Search Scriptures on Vedic Tatva"
          title="Vedic Scripture Search — Vedas, Upanishads, Bhagavad Gita Online"
          intro="The wisdom of Sanatan Dharma lies in our scriptures — the four Vedas, 108 Upanishads, 18 Puranas, Bhagavad Gita, Ramayana, Mahabharata, Brahma Sutras and dharma shastras. Vedic Tatva's AI-powered search lets you find any shloka, verse or teaching across millions of pages — with original Sanskrit, transliteration, translation and contextual commentary."
          trustBadges={[
            { value: "AI", label: "Semantic Search" },
            { value: "100+", label: "Sacred Texts" },
            { value: "Sanskrit", label: "+ Translation" },
            { value: "Free", label: "Forever" },
          ]}
          benefits={[
            { icon: BookOpen, title: "All Major Scriptures", body: "Search across Rig Veda, Yajur Veda, Sama Veda, Atharva Veda, 108 Upanishads, 18 Puranas, Bhagavad Gita, Ramayana, Mahabharata, Brahma Sutras and dharma shastras." },
            { icon: Sparkles, title: "AI-Powered Semantic Search", body: "Search by meaning, not just keywords. Ask 'what does Gita say about karma?' or 'shlokas on detachment' — AI finds relevant verses across all texts." },
            { icon: Quote, title: "Original Sanskrit + Translation", body: "Every result shows original Devanagari Sanskrit, IAST transliteration, English translation and contextual commentary by traditional acharyas." },
            { icon: Brain, title: "Topic-Based Browsing", body: "Browse by topic — karma, dharma, moksha, bhakti, jnana, atman, brahman, gunas, varna ashrama — with curated shloka collections." },
            { icon: Share2, title: "Cite & Share", body: "Get accurate citations (text, chapter, verse) for every shloka. Share via WhatsApp with formatted Sanskrit + translation in one tap." },
            { icon: Bookmark, title: "Bookmark & Build Library", body: "Save favourite shlokas to your personal library, organise by topic, add personal notes — build your spiritual study collection over time." },
          ]}
          steps={[
            { title: "Enter Your Query", body: "Type any keyword (karma, dharma, moksha), specific shloka reference (BG 2.47), or natural question ('what is jnana yoga?')." },
            { title: "Choose Scripture Filter", body: "Search across all texts or filter — only Vedas, only Upanishads, only Bhagavad Gita, only Puranas — based on your study focus." },
            { title: "Read with Translation", body: "Get matched verses with original Sanskrit, transliteration, English translation and contextual meaning by traditional commentators." },
            { title: "Bookmark & Share", body: "Save important verses, build study lists, share insights with friends and family — turn scripture study into a daily practice." },
          ]}
          faqs={[
            { q: "Which Hindu scriptures are searchable?", a: "Four Vedas (Rig, Yajur, Sama, Atharva) including Samhitas, Brahmanas, Aranyakas, Upanishads. All 108 Upanishads (10 principal + 98 minor). 18 Mahapuranas (Vishnu, Bhagavata, Shiva, Garuda, Markandeya, etc.) plus key Upapuranas. Bhagavad Gita (all 18 chapters, 700 shlokas). Ramayana (Valmiki + Ramcharitmanas). Mahabharata. Brahma Sutras. Dharma shastras (Manu Smriti, etc.). Yoga Sutras of Patanjali. Narada Bhakti Sutras." },
            { q: "How does AI semantic search work?", a: "Traditional keyword search finds exact word matches. Our AI semantic search understands meaning — so asking 'what does Gita say about giving up worry?' returns shlokas on yoga, surrender (sharanagati), karma yoga and detachment (vairagya), even if those exact words aren't in your query." },
            { q: "Are translations authentic?", a: "Yes — translations are sourced from authoritative editions: Swami Gambhirananda (Upanishads), Swami Prabhupada (Bhagavad Gita), Swami Tapasyananda (Bhagavata), Ralph T.H. Griffith (Vedas), and traditional Sanskrit-to-English commentaries by recognised acharyas. Multiple translations available where available." },
            { q: "Can I search in Hindi or regional languages?", a: "Yes — search query can be in English, Hindi or other regional languages. Translations also available in Hindi, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati and Malayalam for major texts (Bhagavad Gita, Upanishads, Ramayana)." },
            { q: "What is the difference between Vedas and Upanishads?", a: "Vedas (Rig, Yajur, Sama, Atharva) are the oldest scriptures — primarily mantras, rituals (karma kanda) and hymns to deities. Upanishads form the philosophical conclusion (jnana kanda) of the Vedas — they are the Vedanta, exploring atman, brahman, moksha. Both are shruti (revealed)." },
            { q: "How do I cite a shloka properly?", a: "Vedic Tatva auto-generates the standard citation for every shloka — e.g., 'Bhagavad Gita 2.47' or 'Isha Upanishad mantra 1' or 'Rig Veda 10.129.7'. You can copy citation in standard scholarly format with one click." },
            { q: "Can I find shlokas on specific topics like karma or dharma?", a: "Yes — beyond keyword search, we have curated topic collections: karma (action and consequence), dharma (right conduct), moksha (liberation), bhakti (devotion), jnana (knowledge), yoga, varna ashrama, the four purusharthas, ahimsa, satya — each with hand-picked shlokas from across scriptures." },
            { q: "Is the scripture search really free?", a: "Yes — completely free. Search, read, translate, bookmark and share across all 100+ scriptures without payment. Premium membership unlocks advanced features like personal study notes, group study, expert Q&A and offline downloads." },
          ]}
          keywordsBlurb="Search Hindu scriptures online — Bhagavad Gita verses, Upanishad mantras, Vedic shlokas, Puranic stories, Ramayana, Mahabharata, Brahma Sutras and dharma shastras. AI-powered semantic search across Rig Veda, Yajur Veda, Sama Veda, Atharva Veda, 108 Upanishads, 18 Mahapuranas. Original Sanskrit Devanagari with IAST transliteration, English and Hindi translation, traditional commentary. Find shlokas on karma, dharma, moksha, bhakti, jnana, yoga, atman, brahman. Bhagavad Gita chapter-wise search, Upanishad mantra finder, Veda mantra search. Free Hindu scripture library with citations and bookmarking."
        />

      </div>
    </div>
  );
}
