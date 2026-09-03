import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { ArrowRight, BookOpen, Clock, MapPin, Search, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageSeo from "@/components/PageSeo";

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
  const [term, setTerm] = useState("");
  const [category, setCategory] = useState("all");
  const [intent, setIntent] = useState("all");
  const [showAll, setShowAll] = useState(false);
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
  const visibleResults = showAll ? results : results.slice(0, 9);
  const reset = () => { setTerm(""); setCategory("all"); setIntent("all"); setShowAll(false); };

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
          <div className="mt-8 max-w-2xl">
            <label className="sr-only" htmlFor="puja-search">Search the Puja atlas</label>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#681f2b]" />
              <Input id="puja-search" value={term} onChange={(event) => { setTerm(event.target.value); setShowAll(false); }} placeholder="Search by Puja, deity, category, or purpose" className="h-14 border-0 bg-[#fff8e9] pl-12 text-[#2b1716] shadow-lg placeholder:text-[#725c52]" />
            </div>
          </div>
          <div className="mt-5 flex flex-wrap gap-3">
            <a href="#puja-catalogue" className="inline-flex h-10 items-center rounded-md bg-[#e5c675] px-4 text-sm font-bold text-[#681f2b] hover:bg-[#f2d98c]">Explore the catalogue <ArrowRight className="ml-2 h-4 w-4" /></a>
            <Link href={panditHref(undefined, preferredMode)} className="inline-flex min-h-11 items-center rounded-md border border-[#e5c675]/60 px-4 text-sm font-bold text-[#fff8e9] hover:bg-white/10">Choose a Pandit to book</Link>
          </div>
          <div className="mt-7 flex items-center gap-2 text-sm text-[#fff8e9]/72"><ShieldCheck className="h-4 w-4 text-[#e5c675]" /> Guides and booking paths are kept together, so you can decide with context.</div>
          <Link href={panditHref(undefined, preferredMode)} className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#e5c675] underline underline-offset-4 hover:text-[#fff8e9]"><MapPin className="h-4 w-4" /> Find a Pandit by location</Link>
        </div>
      </section>

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