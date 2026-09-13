import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ChevronDown, ChevronUp, Compass, MapPin, Search, Sparkles, Video } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import PageSeo from "@/components/PageSeo";
import { PanditDirectoryView } from "@/components/pandit/PanditDirectoryView";
import { BecomePanditBanner, BecomePanditStrip } from "@/components/pandit/BecomePanditBanner";
import { trackDiscoveryEvent } from "@/lib/analytics";

type City = { id: number; name: string; slug: string; count: number };
type State = { id: number; name: string; code: string; slug: string; count: number; stateWideCount: number; cityCount: number; cities: City[] };
type Summary = { states: State[]; facets: { services: string[]; languages: string[]; traditions: string[] } };
type MetricValue = { value: number | null; state: "available" | "unavailable"; health: "available" | "unavailable"; scope?: "global" | "this_instance"; reason?: string };
type LiveMetrics = {
  health: "available" | "unavailable";
  updatedAt: string | null;
  metrics: {
    servingNow: MetricValue;
    servedLast24h: MetricValue;
    pujasBooked: MetricValue;
    totalEnrolledPandits: MetricValue;
    discoverablePandits: MetricValue;
    availableToBook: MetricValue;
    onlineNow: MetricValue;
  };
};

const APPROVED_METROS = ["new delhi", "noida", "gurugram", "chandigarh", "mumbai", "bengaluru", "kolkata", "pune", "guwahati", "chennai", "hyderabad", "ahmedabad"];
const METRO_CITIES = new Set(APPROVED_METROS);
const CITY_ALIASES: Record<string, string[]> = {
  "mumbai": ["bombay"],
  "kolkata": ["calcutta"],
  "chennai": ["madras"],
  "gurugram": ["gurgaon"],
  "gurgaon": ["gurugram"],
  "bengaluru": ["bangalore", "bengalooru"],
  "bangalore": ["bengaluru"],
  "new delhi": ["delhi"],
  "delhi": ["new delhi"],
  "guwahati": ["gowahati", "guwhati", "guwhahati"],
};

const cleanSlug = (name: string) => name.trim().toLowerCase()
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

const linkFor = (state: State, city?: City, service?: string, mode?: "online" | "offline", context = "") => {
  const q = new URLSearchParams(context);
  q.set("stateId", String(state.id));
  // Discovery's slugs come from the active location catalogue.  Do not
  // manufacture a second city identity from the display name (catalogue
  // slugs are often state-prefixed, e.g. mh-pune).
  const stateSlug = state.slug || cleanSlug(state.name);
  q.set("state", stateSlug);
  if (city) {
    const citySlug = city.slug || cleanSlug(city.name);
    q.set("cityId", String(city.id));
    q.set("city", citySlug);
  }
  if (service) q.set("service", service);
  if (mode) q.set("mode", mode);
  const base = city
    ? `/book-pandit-online/${stateSlug}/${city.slug || cleanSlug(city.name)}`
    : `/book-pandit-online/${stateSlug}`;
  return q.toString() ? `${base}?${q}` : base;
};

export default function PanditDirectory() {
  const routeParams = useParams<{ stateSlug?: string }>();
  const search = new URLSearchParams(useSearch());
  const stateId = search.get("stateId") || "";
  const cityId = search.get("cityId") || "";
  const mode = search.get("mode") || "";
  const scope = search.get("scope") || "";
  const service = search.get("service") || "";
  const language = search.get("language") || "";
  const tradition = search.get("tradition") || "";
  const date = search.get("date") || "";
  const muhurat = search.get("muhurat") || "";
  const pujaSlug = search.get("pujaSlug") || "";
  const context = new URLSearchParams();
  ["service", "pujaSlug", "mode", "language", "tradition", "date", "muhurat", "source", "location"].forEach((key) => {
    const value = search.get(key);
    if (value) context.set(key, value);
  });
  const contextQuery = context.toString();
  const preferredMode = mode === "online" || mode === "offline" ? mode : undefined;
  const [, setLocation] = useLocation();
  const { data, isLoading, isError, refetch } = useQuery<Summary>({
    queryKey: ["/api/pandit-discovery", service],
    queryFn: async () => { const r = await fetch(`/api/pandit-discovery${service ? `?service=${encodeURIComponent(service)}` : ""}`); if (!r.ok) throw new Error("Unable to load discovery"); return r.json(); },
  });
  const { data: liveMetrics } = useQuery<LiveMetrics>({
    queryKey: ["/api/pandit-metrics"],
    queryFn: async () => {
      const response = await fetch("/api/pandit-metrics");
      return response.json();
    },
    staleTime: 30_000,
    refetchInterval: 30_000,
  });
  const state = data?.states.find((s) => String(s.id) === stateId || cleanSlug(s.name) === (routeParams.stateSlug || search.get("state")) || s.slug === (routeParams.stateSlug || search.get("state")));
  const city = state?.cities.find((c) => String(c.id) === cityId || c.slug === search.get("city"));
  if (isLoading && (stateId || cityId)) {
    return <div className="min-h-[60vh] bg-[#F5F0E6] px-5 py-20"><Skeleton className="mx-auto h-72 max-w-5xl bg-[#E9DEC9]" /></div>;
  }
  if ((stateId && !state) || (cityId && !city)) {
    return <main className="min-h-[70vh] bg-[#F5F0E6] px-5 py-20 text-center text-[#2B1115]"><h1 className="font-serif text-3xl text-[#6D2B35]">Location not available</h1><p className="mt-3 text-[#5a4a3a]/70">This State or City is inactive, invalid, or has no eligible Pandits.</p><Button className="mt-6 bg-[#6D2B35]" onClick={() => setLocation("/book-pandit-online")}>Browse active locations</Button></main>;
  }
  if (mode === "nearMe" || city || (state && scope === "state")) {
    return <PanditDirectoryView stateId={state?.id} cityId={city?.id} cityLabel={city?.name} stateLabel={state?.name} stateSlug={state?.slug} cityOptions={state?.cities} mode={mode === "nearMe" ? "nearMe" : city ? "city" : "state"} service={service} pujaSlug={pujaSlug} language={language} tradition={tradition} date={date} muhurat={muhurat} facetOptions={data?.facets} />;
  }
  if (state) {
    return <StateChooser state={state} service={service} preferredMode={preferredMode} context={contextQuery} onNavigate={setLocation} />;
  }
  return <DiscoveryHome data={data} liveMetrics={liveMetrics} selectedService={service} preferredMode={preferredMode} date={date} muhurat={muhurat} context={contextQuery} isLoading={isLoading} isError={isError} retry={refetch} onNavigate={setLocation} />;
}

function StateChooser({ state, service, preferredMode, context, onNavigate }: { state: State; service?: string; preferredMode?: "online" | "offline"; context: string; onNavigate: (path: string) => void }) {
  const [showAllCities, setShowAllCities] = useState(false);
  const metroCities = state.cities.filter((city) => METRO_CITIES.has(city.name.toLowerCase()));
  const otherCities = state.cities
    .filter((city) => !METRO_CITIES.has(city.name.toLowerCase()))
    .sort((a, b) => a.name.localeCompare(b.name, "en-IN"));
  const visibleOtherCities = showAllCities ? otherCities : otherCities.slice(0, 9);
  const cityGroups = [
    ...(metroCities.length ? [{ title: "Major metro cities", cities: metroCities }] : []),
    { title: metroCities.length ? "Other cities" : "Cities", cities: visibleOtherCities },
  ];
  const stateWide = new URLSearchParams(context);
  stateWide.set("stateId", String(state.id));
  stateWide.set("state", state.slug);
  stateWide.set("scope", "state");
  if (service) stateWide.set("service", service);
  if (preferredMode) stateWide.set("mode", preferredMode);
  return <main className="min-h-screen bg-[#F5F0E6] px-5 py-10 text-[#2B1115] sm:px-8">
    <PageSeo title={`Find a Pandit in ${state.name} | Vedic Tatva`} description={`Browse genuine, discoverable Vedic Pandits by city in ${state.name}. Counts reflect the public directory.`} canonical={`/book-pandit-online/${cleanSlug(state.name)}`} noindex />
    <div className="mx-auto max-w-5xl">
      <button onClick={() => onNavigate("/book-pandit-online")} className="text-sm font-semibold text-[#6D2B35]">← All States</button>
      <p className="mt-8 text-[11px] uppercase tracking-[.24em] text-[#9A7218]">{state.code} · {state.count} Pandits based here</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-[#6D2B35]">Choose a City in {state.name}</h1>
      {service ? <p className="mt-3 text-sm text-[#5a4a3a]/70">Service: <strong>{service}</strong></p> : null}
      {cityGroups.map((group) => <section key={group.title} className="mt-8">
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-[.2em] text-[#9A7218]">{group.title}</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {group.cities.map(city => <button key={city.id} onClick={() => { trackDiscoveryEvent("city_selected", { state_id: state.id, city_id: city.id, has_service: !!service }); onNavigate(linkFor(state, city, service, preferredMode, context)); }} className="group rounded-xl border border-[#D4AF37]/25 bg-[#FBF7EE] p-5 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-[#9A7218]/50 hover:shadow-md">
            <span className="flex items-center justify-between"><strong className="font-serif text-xl text-[#6D2B35]">{city.name}</strong><MapPin className="h-5 w-5 text-[#9A7218] transition-transform group-hover:scale-110" /></span>
            <span className="mt-2 block text-sm text-[#5a4a3a]/70">{city.count} eligible {city.count === 1 ? "Pandit" : "Pandits"} based here</span>
          </button>)}
        </div>
      </section>)}
      {otherCities.length > 9 ? <button type="button" onClick={() => setShowAllCities((value) => !value)} className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#9A7218]/30 bg-[#FBF7EE] px-5 text-sm font-semibold text-[#6D2B35] hover:bg-[#F2E8D5]" aria-expanded={showAllCities}>
        {showAllCities ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
        {showAllCities ? "Show fewer cities" : `More cities (${otherCities.length - 9})`}
      </button> : null}
      <div className="mt-8 rounded-md border border-[#D4AF37]/30 bg-[#6D2B35] p-5 text-[#FBF7EE] sm:flex sm:items-center sm:justify-between">
        <div><h2 className="font-serif text-xl">Browse across {state.name}</h2><p className="mt-1 text-sm text-[#FBF7EE]/70">{state.stateWideCount} {state.stateWideCount === 1 ? "Pandit has" : "Pandits have"} State-wide or national reach.</p></div>
        <Button disabled={state.stateWideCount === 0} onClick={() => { trackDiscoveryEvent("state_wide_selected", { state_id: state.id, has_service: !!service }); onNavigate(`/book-pandit-online?${stateWide}`); }} className="mt-4 bg-[#E9C96A] text-[#6D2B35] hover:bg-[#F4D983] sm:mt-0">View State-wide</Button>
      </div>
    </div>
  </main>;
}

function CityBrowser({
  states,
  selectedService,
  preferredMode,
  context,
  onNavigate,
}: {
  states: State[];
  selectedService?: string;
  preferredMode?: "online" | "offline";
  context: string;
  onNavigate: (path: string) => void;
}) {
  const [term, setTerm] = useState("");
  const [expanded, setExpanded] = useState<Set<number>>(() => new Set(states.length ? [states[0].id] : []));
  const [showMore, setShowMore] = useState<Set<number>>(() => new Set());
  const query = term.trim().toLowerCase();

  const matches = (state: State, city?: City) => {
    if (!query) return true;
    const aliases = city ? (CITY_ALIASES[city.name.toLowerCase()] || []) : [];
    const haystack = [city?.name, state.name, state.code, ...aliases].filter(Boolean).join(" ").toLowerCase();
    return haystack.includes(query);
  };

  const visibleStates = useMemo(() => states
    .map((state) => {
      const stateMatch = matches(state);
      const cities = stateMatch
        ? state.cities
        : state.cities.filter((city) => matches(state, city));
      return { state, cities };
    })
    .filter(({ cities }) => !query || cities.length > 0), [states, query]);

  useEffect(() => {
    if (query) setExpanded(new Set(visibleStates.map(({ state }) => state.id)));
    else if (states.length) setExpanded(new Set([states[0].id]));
  }, [query, states, visibleStates]);

  const toggle = (stateId: number) => {
    const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;
    setExpanded((current) => {
      if (isMobile) return current.has(stateId) ? new Set() : new Set([stateId]);
      const next = new Set(current);
      if (next.has(stateId)) next.delete(stateId);
      else next.add(stateId);
      return next;
    });
  };

  return (
    <section className="mb-12 rounded-2xl border border-[#D4AF37]/25 bg-[#FBF7EE] shadow-sm" aria-labelledby="all-cities-heading">
      <div className="sticky top-0 z-20 rounded-t-2xl border-b border-[#D4AF37]/20 bg-[#FBF7EE]/95 px-5 py-5 backdrop-blur sm:px-7">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[.24em] text-[#9A7218]">Search the full directory</p>
            <h2 id="all-cities-heading" className="mt-1 text-2xl font-semibold text-[#6D2B35]">Find your city</h2>
            <p className="mt-1 text-sm text-[#5a4a3a]/70">Counts are current discoverable Pandits, not promises of availability.</p>
          </div>
          <div className="relative w-full sm:max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A7218]" />
            <Input value={term} onChange={(event) => setTerm(event.target.value)} placeholder="Search a state, city, or alias" aria-label="Search states and cities" className="h-12 border-[#D4AF37]/35 bg-[#F5F0E6] pl-9 text-base focus-visible:ring-[#9A7218]" />
          </div>
        </div>
        <div className="-mx-1 mt-5 flex gap-2 overflow-x-auto px-1 pb-1" data-lenis-prevent aria-label="Popular metro shortcuts">
          {APPROVED_METROS.map((metro) => {
            const match = states.flatMap((state) => state.cities.map((city) => ({ state, city }))).find(({ city }) => city.name.toLowerCase() === metro);
            return match ? (
              <Link key={metro} href={linkFor(match.state, match.city, selectedService, preferredMode, context)} onClick={() => trackDiscoveryEvent("city_selected", { state_id: match.state.id, city_id: match.city.id, has_service: !!selectedService })} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-[#D4AF37]/35 bg-[#F5F0E6] px-4 text-sm font-semibold text-[#6D2B35] transition hover:border-[#9A7218] hover:bg-[#F2E8D5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7218]">
                <MapPin className="h-4 w-4 text-[#9A7218]" /><span>{match.city.name}</span><span className="text-xs font-normal text-[#806a61]">{match.city.count}</span>
              </Link>
            ) : <span key={metro} className="inline-flex min-h-11 shrink-0 items-center gap-2 rounded-full border border-dashed border-[#D4AF37]/35 px-4 text-sm text-[#806a61]"><MapPin className="h-4 w-4 text-[#9A7218]" />{metro}<span className="text-xs">0</span></span>;
          })}
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2 sm:p-6 lg:grid-cols-3">
        {visibleStates.map(({ state, cities }) => {
          const isOpen = expanded.has(state.id);
          return (
            <section key={state.id} className={`overflow-hidden rounded-xl border border-[#D4AF37]/25 bg-[#F5F0E6] ${isOpen ? "sm:col-span-2 lg:col-span-1" : ""}`}>
              <button type="button" aria-expanded={isOpen} aria-controls={`state-cities-${state.id}`} onClick={() => toggle(state.id)} className="flex min-h-14 w-full items-center justify-between gap-3 px-4 text-left text-[#6D2B35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9A7218]">
                <span><strong className="font-serif text-lg">{state.name}</strong><span className="ml-2 text-xs text-[#806a61]">{state.count} eligible · {state.cityCount} cities</span></span>
                {isOpen ? <ChevronUp className="h-5 w-5 shrink-0 text-[#9A7218]" /> : <ChevronDown className="h-5 w-5 shrink-0 text-[#9A7218]" />}
              </button>
              {isOpen && <div id={`state-cities-${state.id}`} className="border-t border-[#D4AF37]/20 px-2 pb-2">
                {cities.length ? (showMore.has(state.id) || query ? cities : cities.slice(0, 8)).map((city) => <Link key={city.id} href={linkFor(state, city, selectedService, preferredMode, context)} onClick={() => trackDiscoveryEvent("city_selected", { state_id: state.id, city_id: city.id, has_service: !!selectedService })} className="flex min-h-12 items-center justify-between gap-3 rounded-lg px-3 text-sm text-[#2B1115] transition hover:bg-[#FBF7EE] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#9A7218]">
                  <span className="flex min-w-0 items-center gap-2"><MapPin className="h-4 w-4 shrink-0 text-[#9A7218]" /><span className="truncate">{city.name}</span></span>
                  <span className={`shrink-0 text-xs ${city.count > 0 ? "font-semibold text-[#9A7218]" : "text-[#806a61]"}`}>{city.count > 0 ? `${city.count} ${city.count === 1 ? "Pandit" : "Pandits"}` : "0 eligible · browse page"}</span>
                </Link>) : <p className="px-3 py-4 text-sm text-[#806a61]">No matching cities in this state.</p>}
                {cities.length > 8 && !query && <button type="button" aria-expanded={showMore.has(state.id)} onClick={() => setShowMore((current) => { const next = new Set(current); if (next.has(state.id)) next.delete(state.id); else next.add(state.id); return next; })} className="mt-1 min-h-11 px-3 text-sm font-semibold text-[#6D2B35] underline underline-offset-4 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7218]">{showMore.has(state.id) ? "Show fewer cities" : `Show ${cities.length - 8} more cities`}</button>}
              </div>}
            </section>
          );
        })}
        {!visibleStates.length && <div className="col-span-full rounded-xl border border-dashed border-[#D4AF37]/40 px-5 py-8 text-center"><p className="font-serif text-lg text-[#6D2B35]">No city matches “{term}”.</p><p className="mt-1 text-sm text-[#806a61]">Try a state name, canonical city, or a familiar name such as Bombay.</p></div>}
      </div>
    </section>
  );
}

function DiscoveryHome({ data, liveMetrics, selectedService, preferredMode, date, muhurat, context, isLoading, isError, retry, onNavigate }: { data?: Summary; liveMetrics?: LiveMetrics; selectedService?: string; preferredMode?: "online" | "offline"; date?: string; muhurat?: string; context: string; isLoading: boolean; isError: boolean; retry: () => void; onNavigate: (path: string) => void }) {
  const [term, setTerm] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);
  const results = useMemo(() => {
    if (!data || !term.trim()) return [];
    const q = term.toLowerCase();
    return data.states.flatMap((s) => [
      ...([s.name.toLowerCase(), ...(s.name.toLowerCase() === "delhi" ? ["new delhi"] : [])].some((name) => name.includes(q)) ? [{ label: s.name, meta: `${s.count} eligible pandits · ${s.cityCount} cities`, href: linkFor(s, undefined, selectedService, preferredMode, context) }] : []),
      ...s.cities.filter((c) => [c.name.toLowerCase(), ...(CITY_ALIASES[c.name.toLowerCase()] || [])].some((name) => name.includes(q))).map((c) => ({ label: c.name, meta: `${s.name} · ${c.count} eligible pandits`, href: linkFor(s, c, selectedService, preferredMode, context) })),
    ]).slice(0, 6);
  }, [data, term, selectedService, preferredMode, context]);
  const nearby = () => { const params = new URLSearchParams(context); params.set("mode", "nearMe"); trackDiscoveryEvent("near_me_selected"); onNavigate(`/book-pandit-online?${params}`); };
  const popularMetros = useMemo(() => {
    const indexed = new Map((data?.states || []).flatMap((state) => state.cities.map((city) => [city.name.toLowerCase(), { state, city }] as const)));
    return APPROVED_METROS.map((name) => indexed.get(name) || null);
  }, [data]);
  return <main className="min-h-screen bg-[#F5F0E6] text-[#2B1115]">
    <PageSeo title="Find a Vedic Pandit | Vedic Tatva" description="Find an eligible Vedic pandit by service, state, city, or your location." canonical="/book-pandit-online" />
    <section className="relative overflow-hidden bg-[#6D2B35] text-[#FBF7EE]">
      <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full border border-[#D4AF37]/25" />
      <div className="absolute right-16 -bottom-32 h-72 w-72 rounded-full border border-[#D4AF37]/15" />
      <div className="relative mx-auto max-w-6xl px-5 pb-12 pt-14 sm:px-8 sm:pt-20">
        <p className="mb-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[.28em] text-[#E9C96A]"><Sparkles className="h-3.5 w-3.5" /> Vedic Tatva · trusted ritual care</p>
        <h1 className="max-w-3xl text-4xl font-semibold leading-[1.06] sm:text-6xl">Find the right pandit<br /><span className="text-[#E9C96A]">for your family’s ritual.</span></h1>
        <p className="mt-5 max-w-xl text-sm leading-6 text-[#FBF7EE]/70 sm:text-base">Search the places and services represented by eligible pandits. Choose with clarity, then book through the same secure Vedic Tatva flow.</p>
        <div className="relative mt-8 max-w-2xl">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#6D2B35]" />
          <Input value={term} onChange={(e) => setTerm(e.target.value)} placeholder="Search a State or City" className="h-14 rounded-md border-0 bg-[#FBF7EE] pl-12 text-[#2B1115] shadow-xl placeholder:text-[#5a4a3a]/55" aria-label="Search states and cities" />
          {results.length > 0 && <div className="absolute z-10 mt-2 w-full overflow-hidden rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] text-[#2B1115] shadow-xl">{results.map((r) => <button key={r.href} onClick={() => { trackDiscoveryEvent("location_search_selected", { has_service: !!selectedService }); onNavigate(r.href); }} className="flex w-full items-center justify-between border-b border-[#D4AF37]/15 px-4 py-3 text-left last:border-0 hover:bg-[#F2E8D5]"><span className="font-serif font-semibold">{r.label}</span><span className="text-xs text-[#5a4a3a]/65">{r.meta}</span></button>)}</div>}
        </div>
        <button onClick={nearby} className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#E9C96A] hover:text-[#FBF7EE]"><Compass className="h-4 w-4" /> Use my location <span className="text-xs font-normal text-[#FBF7EE]/50">only when you choose</span></button>
      </div>
    </section>
    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <LiveActivityStrip metrics={liveMetrics} />
      {date ? <div className="mb-6 rounded-md border border-[#D4AF37]/40 bg-[#FBF7EE] p-4 text-sm text-[#6D2B35]" data-testid="muhurat-location-prompt"><strong>Selected auspicious window:</strong> {date}{muhurat ? ` · ${muhurat}` : ""}. Choose a location to find Pandits eligible for this ritual. Calendar availability will be confirmed during booking.</div> : null}
      {data?.states.length && popularMetros.some(Boolean) ? <section className="mb-10" aria-labelledby="popular-cities-heading">
        <div className="flex items-end justify-between gap-3"><div><p className="text-[11px] uppercase tracking-[.24em] text-[#9A7218]">Start with a major city</p><h2 id="popular-cities-heading" className="mt-1 text-2xl font-semibold text-[#6D2B35]">Popular cities</h2></div><span className="hidden text-xs text-[#806a61] sm:block">12 trusted shortcuts</span></div>
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popularMetros.map((item, index) => item ? <Link key={item.city.id} href={linkFor(item.state, item.city, selectedService, preferredMode, context)} onClick={() => trackDiscoveryEvent("city_selected", { state_id: item.state.id, city_id: item.city.id, has_service: !!selectedService })} className="group flex min-h-[84px] flex-col justify-between rounded-xl border border-[#D4AF37]/30 bg-[#FBF7EE] p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-[#9A7218] hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7218]">
            <span className="flex items-start justify-between gap-2"><strong className="font-serif text-base leading-tight text-[#6D2B35]">{item.city.name}</strong><MapPin className="h-4 w-4 shrink-0 text-[#9A7218]" /></span>
            <span className={`text-xs ${item.city.count > 0 ? "font-semibold text-[#9A7218]" : "text-[#806a61]"}`}>{item.city.count > 0 ? `${item.city.count} eligible` : "0 eligible · browse page"}</span>
          </Link> : <div key={APPROVED_METROS[index]} className="flex min-h-[84px] flex-col justify-between rounded-xl border border-dashed border-[#D4AF37]/35 bg-[#FBF7EE]/60 p-4 text-[#806a61]"><span className="font-serif text-base">{APPROVED_METROS[index]}</span><span className="text-xs">0 eligible · browse page</span></div>)}
        </div>
      </section> : null}
      {isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 bg-[#E9DEC9]" />)}</div> :
      isError ? <div className="rounded-md border border-[#D4AF37]/35 bg-[#FBF7EE] p-8 text-center"><p className="font-serif text-xl text-[#6D2B35]">The directory is taking a moment.</p><Button onClick={retry} className="mt-4 bg-[#6D2B35]">Try again</Button></div> :
      data?.states.length === 0 ? <div className="rounded-md border border-[#D4AF37]/35 bg-[#FBF7EE] p-8 text-center">No eligible locations are available yet.</div> :
      data?.states.length ? <div>
         <Link href={`/book-pandit-online/all${context ? `?${context}` : ""}`} className="mb-4 inline-flex min-h-11 items-center gap-2 rounded-full border border-[#9A7218]/35 bg-[#FBF7EE] px-4 text-sm font-semibold text-[#6D2B35] hover:bg-[#F2E8D5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7218]">
           <Search className="h-4 w-4" /> Browse all Pandits
         </Link>
      </div> : null}
      {data?.facets.services.length ? <div className="mt-12 rounded-md bg-[#6D2B35] p-6 text-[#FBF7EE]"><p className="text-[11px] uppercase tracking-[.24em] text-[#E9C96A]">Start with a service</p><h2 className="mt-1 text-2xl font-semibold">What brings you here?</h2><div className="mt-4 flex flex-wrap gap-2">{data.facets.services.slice(0, showAllServices ? undefined : 8).map(s => <button key={s} onClick={() => { trackDiscoveryEvent("service_selected", { service: s }); onNavigate(`/book-pandit-online?service=${encodeURIComponent(s)}`); }} className="rounded-full border border-[#E9C96A]/45 px-3 py-1.5 text-sm hover:bg-[#E9C96A] hover:text-[#6D2B35]">{s}</button>)}</div>{data.facets.services.length > 8 ? <button className="mt-4 text-sm font-semibold text-[#E9C96A] underline underline-offset-4" onClick={() => setShowAllServices(value => !value)}>{showAllServices ? "Show fewer services" : `View all ${data.facets.services.length} services`}</button> : null}</div> : null}
      <div className="mt-8 grid gap-3 sm:grid-cols-2"><Link href="/online-puja-booking?mode=online" className="flex min-h-11 items-center gap-4 rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-5"><Video className="h-6 w-6 text-[#6D2B35]" /><span><b className="block text-[#6D2B35]">Need a ritual from anywhere?</b><small className="text-[#5a4a3a]/65">Explore online Puja guides</small></span></Link><Link href="/pind-daan-booking" className="flex min-h-11 items-center gap-4 rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-5"><MapPin className="h-6 w-6 text-[#6D2B35]" /><span><b className="block text-[#6D2B35]">Sacred ancestor rites</b><small className="text-[#5a4a3a]/65">Pind daan and tarpan services</small></span></Link></div>
    </section><BecomePanditBanner />
  </main>;
}

function LiveActivityStrip({ metrics }: { metrics?: LiveMetrics }) {
  const entries = metrics ? [
    ["Serving now", metrics.metrics.servingNow],
    ["Served · 24h", metrics.metrics.servedLast24h],
    ["Pujas booked", metrics.metrics.pujasBooked],
    ["Pandits", metrics.metrics.totalEnrolledPandits],
    ["Discoverable", metrics.metrics.discoverablePandits],
    ["Bookable", metrics.metrics.availableToBook],
    ["Online now · this server", metrics.metrics.onlineNow],
  ] as const : [];
  return <section className="mb-8 overflow-hidden rounded-2xl border border-[#D4AF37]/25 bg-[#FBF7EE] py-4 shadow-sm" aria-label="Pandit network activity" data-testid="pandit-live-metrics">
    <div className="mb-3 flex items-center justify-between px-4 sm:hidden">
      <span className="text-[10px] font-semibold uppercase tracking-[.18em] text-[#9A7218]">Live network</span>
      <span className="text-[10px] text-[#806a61]">Swipe to explore →</span>
    </div>
    <div className="flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:grid sm:grid-cols-4 sm:overflow-visible sm:pb-0 lg:grid-cols-7" data-lenis-prevent>
      {entries.map(([label, value], index) => <div key={label} className="group relative min-w-[132px] snap-start rounded-xl border border-[#D4AF37]/20 bg-[#F5F0E6] px-4 py-3 text-left transition duration-300 motion-safe:hover:-translate-y-1 sm:min-w-0 sm:text-center">
        <span className={`absolute right-3 top-3 h-2 w-2 rounded-full ${value.health === "available" ? "bg-emerald-500 motion-safe:animate-pulse" : "bg-[#B8AA9F]"}`} aria-hidden="true" />
        <div className={`font-serif text-2xl font-semibold tabular-nums transition-transform duration-300 motion-safe:group-hover:scale-105 ${value.health === "available" ? "text-[#6D2B35]" : "text-[#806a61]"}`} data-testid={`metric-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`}>{value.health === "available" ? value.value : "—"}</div>
        <div className="mt-1 pr-3 text-[10px] font-semibold uppercase leading-4 tracking-[.11em] text-[#806a61]">{label}</div>
        {index === 0 && value.health === "available" ? <div className="mt-1 text-[10px] text-emerald-700">Updated live</div> : null}
      </div>)}
      {!metrics && <p className="w-full text-center text-xs text-[#806a61]">Network activity is temporarily unavailable.</p>}
    </div>
    {metrics?.health === "unavailable" && <p className="mt-3 text-center text-xs text-[#806a61]">Network activity is temporarily unavailable.</p>}
  </section>;
}
export { BecomePanditBanner, BecomePanditStrip };