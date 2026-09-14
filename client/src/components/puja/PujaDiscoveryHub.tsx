import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useLocation, useSearch } from "wouter";
import { ArrowRight, BookOpen, Clock, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageSeo from "@/components/PageSeo";
import { isIntentLikePujaQuery, rankPujaSearchResults } from "@shared/puja-smart-search";

export interface PujaListItem {
  id: number;
  slug: string;
  name: string;
  deity: string;
  category: string;
  shortDescription: string;
  difficulty: string | null;
  estimatedCost: string | null;
  durationMinutes: number | null;
  intents: string[];
  deities: string[];
  ceremonies: string[];
  festivals: string[];
  aliases: string[];
  onlineEligible: boolean;
  inPersonEligible: boolean;
}

const categoryLabel = (category: string) => ({
  deity: "Deity worship",
  occasion: "Occasions & festivals",
  remedial: "Remedial pujas",
  samskara: "Samskaras",
}[category] || category);

const panditHref = (name?: string, mode?: "online" | "offline") => {
  const query = new URLSearchParams();
  if (name) query.set("service", name);
  if (mode) query.set("mode", mode);
  const suffix = query.toString();
  return `/book-pandit-online${suffix ? `?${suffix}` : ""}`;
};

export function PujaDiscoveryHub() {
  const incomingMode = new URLSearchParams(useSearch()).get("mode");
  const preferredMode = incomingMode === "online" || incomingMode === "offline" ? incomingMode : undefined;
  const [, navigate] = useLocation();
  const searchRef = useRef<HTMLDivElement>(null);
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [intent, setIntent] = useState("all");
  const [showAll, setShowAll] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const [aiSlugs, setAiSlugs] = useState<string[]>([]);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const { data: pujas = [], isLoading, isError, refetch } = useQuery<PujaListItem[]>({
    queryKey: ["/api/pujas"],
    queryFn: async () => {
      const response = await fetch("/api/pujas");
      if (!response.ok) throw new Error("Unable to load pujas");
      return response.json();
    },
  });
  const categories = useMemo(() => Array.from(new Set(pujas.map((puja) => puja.category).filter(Boolean))).sort(), [pujas]);
  const intents = useMemo(() => Array.from(new Set(pujas.flatMap((puja) => puja.intents || []).filter(Boolean))).sort(), [pujas]);
  const results = useMemo(() => {
    const query = term.trim().toLowerCase();
    return pujas.filter((puja) => {
      const matchesCategory = category === "all" || puja.category === category;
      const matchesIntent = intent === "all" || puja.intents?.includes(intent);
      const matchesMode = preferredMode === "online" ? puja.onlineEligible : preferredMode === "offline" ? puja.inPersonEligible : true;
      const matchesTerm = !query || [puja.name, puja.deity, puja.category, puja.shortDescription, ...(puja.intents || []), ...(puja.deities || []), ...(puja.ceremonies || []), ...(puja.festivals || []), ...(puja.aliases || [])]
        .filter(Boolean).join(" ").toLowerCase().includes(query);
      return matchesCategory && matchesIntent && matchesMode && matchesTerm;
    });
  }, [category, intent, preferredMode, pujas, term]);
  const suggestionPool = useMemo(() => pujas.filter((puja) => {
    const matchesCategory = category === "all" || puja.category === category;
    const matchesIntent = intent === "all" || puja.intents?.includes(intent);
    return matchesCategory && matchesIntent;
  }), [category, intent, pujas]);
  const localSuggestions = useMemo(
    () => rankPujaSearchResults(suggestionPool, term, preferredMode, 6),
    [preferredMode, suggestionPool, term],
  );
  const aiSuggestions = useMemo(() => {
    const bySlug = new Map(pujas.map((puja) => [puja.slug, puja]));
    return aiSlugs.map((slug) => bySlug.get(slug)).filter((puja): puja is PujaListItem => {
      if (!puja) return false;
      return preferredMode === "online" ? puja.onlineEligible : preferredMode === "offline" ? puja.inPersonEligible : true;
    });
  }, [aiSlugs, preferredMode, pujas]);
  const localSlugs = useMemo(() => new Set(localSuggestions.map((puja) => puja.slug)), [localSuggestions]);
  const intentSuggestions = useMemo(
    () => aiSuggestions.filter((puja) => !localSlugs.has(puja.slug)),
    [aiSuggestions, localSlugs],
  );
  const panelSuggestions = useMemo(
    () => [...localSuggestions, ...intentSuggestions],
    [intentSuggestions, localSuggestions],
  );
  const visibleResults = showAll ? results : results.slice(0, 9);
  const featuredGroups = useMemo(() => {
    const bySlug = new Map(pujas.map((puja) => [puja.slug, puja]));
    return [
      {
        eyebrow: "Home & prosperity",
        title: "Begin well. Build with blessing.",
        body: "Housewarming, family vows, and prosperity observances presented as distinct decisions—not interchangeable labels.",
        slugs: ["griha-pravesh-puja", "satyanarayan-puja", "ganesh-lakshmi-puja", "vastu-shanti-puja", "lakshmi-puja"],
      },
      {
        eyebrow: "Shiva & graha support",
        title: "Focused paths for prayer and resilience.",
        body: "Separate Shiva, mantra, and traditional Jyotisha services with clear scope and eligibility.",
        slugs: ["rudrabhishek-puja", "maha-mrityunjaya-jaap", "navagraha-shanti-puja", "kaal-sarp-dosh-puja"],
      },
      {
        eyebrow: "Pitru services",
        title: "Choose the ancestral rite by purpose.",
        body: "Shradh, Tarpan, Pind Daan, pilgrimage rites, and final observances remain individually discoverable.",
        slugs: ["shradh", "tarpan", "pind-daan", "gaya-pind-daan", "narayan-bali", "asthi-visarjan"],
      },
    ].map(group => ({ ...group, pujas: group.slugs.map(slug => bySlug.get(slug)).filter((puja): puja is PujaListItem => Boolean(puja)) }));
  }, [pujas]);
  const reset = () => { setTerm(""); setCategory("all"); setIntent("all"); setShowAll(false); };
  useEffect(() => {
    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!searchRef.current?.contains(event.target as Node)) setSearchOpen(false);
    };
    document.addEventListener("pointerdown", closeOnOutsidePointer);
    return () => document.removeEventListener("pointerdown", closeOnOutsidePointer);
  }, []);
  useEffect(() => {
    const query = term.trim();
    setAiSlugs([]);
    if (!searchOpen || query.length < 3 || (!isIntentLikePujaQuery(query) && localSuggestions.length > 0)) {
      setIsAiLoading(false);
      return;
    }
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setIsAiLoading(true);
      try {
        const response = await fetch("/api/pujas/smart-search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query, mode: preferredMode }),
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Smart search unavailable");
        const data = await response.json() as { matches?: Array<{ slug?: unknown }> };
        setAiSlugs(Array.isArray(data.matches)
          ? data.matches.map((match) => typeof match?.slug === "string" ? match.slug : "").filter(Boolean)
          : []);
      } catch {
        if (!controller.signal.aborted) setAiSlugs([]);
      } finally {
        if (!controller.signal.aborted) setIsAiLoading(false);
      }
    }, 320);
    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [localSuggestions.length, preferredMode, searchOpen, term]);
  useEffect(() => {
    setActiveSuggestion(0);
  }, [panelSuggestions.length, term]);
  const openPujaGuide = (slug: string) => {
    setSearchOpen(false);
    navigate(`/puja-guide/${slug}`);
  };
  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!searchOpen || !panelSuggestions.length) {
      if (event.key === "Escape") setSearchOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveSuggestion((current) => (current + 1) % panelSuggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveSuggestion((current) => (current - 1 + panelSuggestions.length) % panelSuggestions.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const selected = panelSuggestions[activeSuggestion];
      if (selected) openPujaGuide(selected.slug);
    } else if (event.key === "Escape") {
      event.preventDefault();
      setSearchOpen(false);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-[#f7f0e2] text-[#2b1716]">
      <PageSeo
        title="Find a Puja & Choose a Verified Pandit | Vedic Tatva"
        description="Explore Puja guides, understand each ritual, then choose a verified Pandit for your preferred setting."
        canonical="/online-puja-booking"
      />
      <section className="relative overflow-hidden border-b border-[#b8893f]/30 bg-[#681f2b] text-[#fff8e9]">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full border border-[#d9b666]/30" />
        <div className="pointer-events-none absolute bottom-[-12rem] left-[12%] h-80 w-80 rounded-full border border-[#d9b666]/15" />
        <div className="relative mx-auto max-w-6xl px-5 py-14 sm:px-8 md:py-20">
          <p className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[.26em] text-[#e5c675]"><Sparkles className="h-3.5 w-3.5" /> Puja atlas</p>
          <div className="mt-5 max-w-3xl">
            <h1 className="font-serif text-4xl font-semibold leading-[1.03] sm:text-6xl">Find the right Puja<br /><span className="text-[#e5c675]">for this moment.</span></h1>
            <p className="mt-5 max-w-2xl text-sm leading-6 text-[#fff8e9]/75 sm:text-base">Begin with meaning. Read a guide, understand what the ritual involves, then choose how you would like to proceed.</p>
          </div>
          <div className="mt-8 max-w-2xl" ref={searchRef}>
            <label className="sr-only" htmlFor="puja-search">Search the Puja atlas</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#681f2b]" />
              <Input
                id="puja-search"
                value={term}
                onFocus={() => setSearchOpen(true)}
                onKeyDown={handleSearchKeyDown}
                onChange={(event) => { setTerm(event.target.value); setShowAll(false); setSearchOpen(true); }}
                placeholder="Try “moving into a new home” or search a Puja"
                className="h-14 border-0 bg-[#fff8e9] pl-12 pr-24 text-[#2b1716] shadow-lg placeholder:text-[#725c52]"
                role="combobox"
                aria-autocomplete="list"
                aria-expanded={searchOpen}
                aria-controls="puja-smart-suggestions"
                aria-activedescendant={searchOpen && panelSuggestions[activeSuggestion] ? `puja-suggestion-${panelSuggestions[activeSuggestion].slug}` : undefined}
              />
              <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-1 text-[10px] font-bold uppercase tracking-[.12em] text-[#977025]"><Sparkles className="h-3 w-3" /> Smart</span>
              {searchOpen && !isLoading && (panelSuggestions.length > 0 || isAiLoading) && (
                <div id="puja-smart-suggestions" role="listbox" aria-label="Puja search suggestions" className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-md border border-[#b8893f]/35 bg-[#fffaf0] text-[#2b1716] shadow-2xl">
                  <div className="max-h-[min(28rem,calc(100vh-10rem))] overflow-y-auto p-2">
                    <p className="px-3 pb-2 pt-1 text-[10px] font-bold uppercase tracking-[.18em] text-[#977025]">
                      {term.trim() ? "Puja matches" : "Popular Puja guides"}
                    </p>
                    {localSuggestions.map((puja, index) => (
                      <SuggestionRow
                        key={puja.slug}
                        puja={puja}
                        active={activeSuggestion === index}
                        onFocus={() => setActiveSuggestion(index)}
                        onOpen={() => openPujaGuide(puja.slug)}
                        onClose={() => setSearchOpen(false)}
                        mode={preferredMode}
                      />
                    ))}
                    {intentSuggestions.length > 0 && (
                      <>
                        <p className="border-t border-[#b8893f]/20 px-3 pb-2 pt-3 text-[10px] font-bold uppercase tracking-[.18em] text-[#977025]">Based on what you described</p>
                        {intentSuggestions.map((puja, index) => (
                          <SuggestionRow
                            key={puja.slug}
                            puja={puja}
                            active={activeSuggestion === localSuggestions.length + index}
                            onFocus={() => setActiveSuggestion(localSuggestions.length + index)}
                            onOpen={() => openPujaGuide(puja.slug)}
                            onClose={() => setSearchOpen(false)}
                            mode={preferredMode}
                          />
                        ))}
                      </>
                    )}
                    {isAiLoading && <p className="flex items-center gap-2 px-3 py-3 text-xs text-[#725c52]"><Sparkles className="h-3.5 w-3.5 text-[#977025]" /> Understanding your intention…</p>}
                  </div>
                </div>
              )}
            </div>
            <p aria-live="polite" className="sr-only">
              {isAiLoading ? "Understanding your Puja intention." : searchOpen && panelSuggestions.length ? `${panelSuggestions.length} Puja suggestions available.` : ""}
            </p>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#puja-catalogue" className="inline-flex h-10 items-center rounded-md bg-[#e5c675] px-4 text-sm font-bold text-[#681f2b] hover:bg-[#f2d98c]">Explore the catalogue <ArrowRight className="ml-2 h-4 w-4" /></a>
            <Link href={panditHref(undefined, preferredMode)} className="inline-flex min-h-11 items-center rounded-md border border-[#e5c675]/60 px-4 text-sm font-bold text-[#fff8e9] hover:bg-white/10">Choose a Pandit to book</Link>
          </div>
          <div className="mt-7 flex items-center gap-2 text-sm text-[#fff8e9]/72"><ShieldCheck className="h-4 w-4 text-[#e5c675]" /> Guides and booking paths are kept together, so you can decide with context.</div>
          <Link href={panditHref(undefined, preferredMode)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#e5c675] underline underline-offset-4 hover:text-[#fff8e9]"><MapPin className="h-4 w-4" /> Find a Pandit by location</Link>
        </div>
      </section>

      {!isLoading && !isError && featuredGroups.some(group => group.pujas.length > 0) && (
        <section id="signature-puja-pathways" className="scroll-mt-8 border-b border-[#b8893f]/25 bg-[#efe1c7]">
          <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
            <div className="max-w-2xl">
              <p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#977025]">Signature Puja pathways</p>
              <h2 className="mt-2 font-serif text-3xl font-semibold text-[#681f2b]">Start with the decision that matters most.</h2>
              <p className="mt-3 text-sm leading-6 text-[#725c52]">These high-intent services have dedicated guides, booking paths, eligibility, and source context.</p>
            </div>
            <div className="mt-8 grid gap-px overflow-hidden rounded-md border border-[#b8893f]/30 bg-[#b8893f]/30 lg:grid-cols-3">
              {featuredGroups.map((group, index) => group.pujas.length > 0 && (
                <article key={group.eyebrow} className="relative bg-[#fffaf0] p-6">
                  <span className="font-mono text-xs text-[#977025]">0{index + 1}</span>
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[.2em] text-[#977025]">{group.eyebrow}</p>
                  <h3 className="mt-2 font-serif text-2xl font-semibold leading-tight text-[#681f2b]">{group.title}</h3>
                  <p className="mt-3 min-h-16 text-sm leading-6 text-[#725c52]">{group.body}</p>
                  <div className="mt-5 border-t border-[#b8893f]/20 pt-3">
                    {group.pujas.map(puja => (
                      <Link key={puja.slug} href={`/puja-guide/${puja.slug}`} className="group flex min-h-11 items-center justify-between border-b border-[#b8893f]/15 text-sm font-semibold text-[#681f2b] last:border-0">
                        <span>{puja.name}</span>
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                      </Link>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

      <section id="puja-catalogue" className="mx-auto max-w-6xl scroll-mt-8 px-5 py-12 sm:px-8">
        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
          <div><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#977025]">The catalogue</p><h2 className="mt-2 font-serif text-3xl font-semibold text-[#681f2b]">Explore by intention</h2></div>
          <p aria-live="polite" className="text-sm text-[#725c52]">{isLoading ? "Loading the catalogue…" : `${results.length} ${results.length === 1 ? "Puja" : "Pujas"} found`}</p>
        </div>
        <div className="mt-6 flex flex-wrap gap-2" aria-label="Puja category filters">
          <button onClick={() => { setCategory("all"); setShowAll(false); }} aria-pressed={category === "all"} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${category === "all" ? "border-[#681f2b] bg-[#681f2b] text-[#fff8e9]" : "border-[#b8893f]/35 bg-[#fffaf0] text-[#681f2b]"}`}>All</button>
          {categories.map((item) => <button key={item} onClick={() => { setCategory(item); setShowAll(false); }} aria-pressed={category === item} className={`rounded-full border px-3 py-1.5 text-sm font-semibold ${category === item ? "border-[#681f2b] bg-[#681f2b] text-[#fff8e9]" : "border-[#b8893f]/35 bg-[#fffaf0] text-[#681f2b]"}`}>{categoryLabel(item)}</button>)}
          {(term || category !== "all") && <button onClick={reset} className="px-2 text-sm font-semibold text-[#681f2b] underline underline-offset-4">Reset</button>}
        </div>
        {intents.length > 0 && <div className="mt-3 flex flex-wrap gap-2" aria-label="Puja intention filters"><button onClick={() => { setIntent("all"); setShowAll(false); }} aria-pressed={intent === "all"} className={`rounded-full border px-3 py-1.5 text-sm ${intent === "all" ? "border-[#977025] bg-[#f1e5ce] font-bold text-[#681f2b]" : "border-[#b8893f]/25 bg-transparent text-[#725c52]"}`}>Every intention</button>{intents.map(item => <button key={item} onClick={() => { setIntent(item); setShowAll(false); }} aria-pressed={intent === item} className={`rounded-full border px-3 py-1.5 text-sm ${intent === item ? "border-[#977025] bg-[#f1e5ce] font-bold text-[#681f2b]" : "border-[#b8893f]/25 bg-transparent text-[#725c52]"}`}>{item}</button>)}</div>}
        {isLoading ? <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{[1, 2, 3, 4, 5, 6].map((item) => <Skeleton key={item} className="h-72 bg-[#e9dcc3]" />)}</div> :
          isError ? <div className="mt-8 rounded-md border border-[#b8893f]/35 bg-[#fffaf0] p-8 text-center"><p className="font-serif text-xl text-[#681f2b]">The Puja catalogue is taking a moment.</p><Button onClick={() => refetch()} className="mt-4 bg-[#681f2b] text-[#fff8e9] hover:bg-[#531622]">Try again</Button></div> :
          results.length === 0 ? <div className="mt-8 rounded-md border border-dashed border-[#b8893f]/45 bg-[#fffaf0] p-10 text-center"><BookOpen className="mx-auto h-6 w-6 text-[#977025]" /><p className="mt-3 font-serif text-xl text-[#681f2b]">No Puja matches that search.</p><button onClick={reset} className="mt-3 text-sm font-bold text-[#681f2b] underline underline-offset-4">Clear filters</button></div> :
          <><div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">{visibleResults.map((puja) => <PujaCard key={puja.id} puja={puja} mode={preferredMode} />)}</div>
          {results.length > 9 && <div className="mt-8 text-center"><Button variant="outline" onClick={() => setShowAll((value) => !value)} className="border-[#681f2b]/35 text-[#681f2b]">{showAll ? "Show fewer Puja guides" : `Show all ${results.length} Puja guides`}</Button></div>}</>}
      </section>
      <section className="border-y border-[#b8893f]/25 bg-[#fffaf0]"><div className="mx-auto grid max-w-6xl gap-8 px-5 py-12 sm:px-8 md:grid-cols-3"><div className="md:col-span-3"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#977025]">A clear next step</p><h2 className="mt-2 font-serif text-3xl font-semibold text-[#681f2b]">How booking works</h2></div>{[["01", "Choose with context", "Read the guide and select the Puja that fits your purpose."], ["02", "Share your preferences", "Choose a mode and complete the existing booking details."], ["03", "Arrange with care", "Use the booking flow or find a Pandit by location."]].map(([number, title, body]) => <div key={number} className="border-l border-[#b8893f]/45 pl-4"><p className="font-mono text-xs text-[#977025]">{number}</p><h3 className="mt-2 font-serif text-xl font-semibold text-[#681f2b]">{title}</h3><p className="mt-2 text-sm leading-6 text-[#725c52]">{body}</p></div>)}</div></section>
      <section className="mx-auto grid max-w-6xl gap-5 px-5 py-12 sm:px-8 md:grid-cols-2"><div className="rounded-md bg-[#681f2b] p-7 text-[#fff8e9]"><p className="text-[11px] font-bold uppercase tracking-[.24em] text-[#e5c675]">Choose your setting</p><h2 className="mt-2 font-serif text-3xl">A ritual, where it suits you.</h2><p className="mt-3 text-sm leading-6 text-[#fff8e9]/72">Choose a verified Pandit for the setting that suits your family.</p><div className="mt-6 flex flex-wrap gap-3"><Link href={panditHref(undefined, "online")} className="inline-flex min-h-11 items-center rounded-md bg-[#e5c675] px-4 py-2 text-sm font-bold text-[#681f2b]">Choose an online Pandit</Link><Link href={panditHref(undefined, "offline")} className="inline-flex min-h-11 items-center rounded-md border border-[#e5c675]/60 px-4 py-2 text-sm font-bold">Choose a home-visit Pandit</Link></div></div><div className="rounded-md border border-[#b8893f]/30 bg-[#f1e5ce] p-7"><BookOpen className="h-6 w-6 text-[#681f2b]" /><h2 className="mt-4 font-serif text-3xl font-semibold text-[#681f2b]">Looking for the fuller story?</h2><p className="mt-3 text-sm leading-6 text-[#725c52]">The Puja Guide brings vidhi, samagri, ethics, and available auspicious-date references into one reading experience.</p><Link href="/puja-guide" className="mt-6 inline-flex min-h-11 items-center text-sm font-bold text-[#681f2b] underline underline-offset-4">Visit the Puja Guide <ArrowRight className="ml-2 h-4 w-4" /></Link></div></section>
    </main>
  );
}

function PujaCard({ puja, mode }: { puja: PujaListItem; mode?: "online" | "offline" }) {
  return <article className="flex min-h-72 flex-col rounded-md border border-[#b8893f]/28 bg-[#fffaf0] p-5 [content-visibility:auto]">
    <div className="flex flex-wrap gap-2 text-[11px] font-bold uppercase tracking-[.14em] text-[#977025]"><span>{categoryLabel(puja.category)}</span>{puja.difficulty && <span className="border-l border-[#b8893f]/40 pl-2 capitalize">{puja.difficulty}</span>}</div>
    <h3 className="mt-4 font-serif text-2xl font-semibold leading-tight text-[#681f2b]">{puja.name}</h3>
    {puja.deity && <p className="mt-1 text-sm text-[#977025]">{puja.deity}</p>}
    <p className="mt-4 line-clamp-3 text-sm leading-6 text-[#725c52]">{puja.shortDescription}</p>
    <div className="mt-auto pt-5 text-xs text-[#725c52]">{puja.durationMinutes && <span className="mr-3 inline-flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{puja.durationMinutes} min</span>}{puja.estimatedCost && <span>Estimated cost: {puja.estimatedCost}</span>}</div>
    <div className="mt-5 grid gap-2 border-t border-[#b8893f]/20 pt-4"><Link href={`/puja-guide/${puja.slug}`} className="inline-flex min-h-11 items-center text-sm font-bold text-[#681f2b] underline underline-offset-4">Understand this Puja</Link><Link href={panditHref(puja.name, mode)} className="inline-flex min-h-11 items-center text-sm font-bold text-[#681f2b]">Choose a Pandit to book <ArrowRight className="ml-1 inline h-3.5 w-3.5" /></Link></div>
  </article>;
}

function SuggestionRow({
  puja,
  active,
  onFocus,
  onOpen,
  onClose,
  mode,
}: {
  puja: PujaListItem;
  active: boolean;
  onFocus: () => void;
  onOpen: () => void;
  onClose: () => void;
  mode?: "online" | "offline";
}) {
  return (
    <div
      id={`puja-suggestion-${puja.slug}`}
      role="option"
      aria-selected={active}
      onMouseEnter={onFocus}
      className={`rounded-md px-3 py-2.5 ${active ? "bg-[#f1e5ce]" : "bg-transparent"}`}
    >
      <div className="flex items-start gap-3">
        <button type="button" onClick={onOpen} className="min-w-0 flex-1 text-left">
          <span className="block font-serif text-base font-semibold text-[#681f2b]">{puja.name}</span>
          <span className="mt-0.5 block line-clamp-2 text-xs leading-5 text-[#725c52]">{puja.shortDescription}</span>
        </button>
        <Link
          href={panditHref(puja.name, mode)}
          onClick={onClose}
          className="mt-0.5 shrink-0 rounded border border-[#b8893f]/45 px-2 py-1.5 text-[10px] font-bold uppercase tracking-[.08em] text-[#681f2b] hover:bg-[#e5c675]"
        >
          Book
        </Link>
      </div>
      <Link href={`/puja-guide/${puja.slug}`} onClick={onClose} className="mt-1 inline-flex min-h-9 items-center text-xs font-bold text-[#681f2b] underline underline-offset-4">
        Understand this Puja <ArrowRight className="ml-1 h-3 w-3" />
      </Link>
    </div>
  );
}