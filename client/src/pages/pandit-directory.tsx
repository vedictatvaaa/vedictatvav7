import { useMemo, useState } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Compass, MapPin, Search, Sparkles, Video } from "lucide-react";
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

const linkFor = (state: State, city?: City, service?: string, mode?: "online" | "offline", context = "") => {
  const q = new URLSearchParams(context);
  q.set("stateId", String(state.id));
  q.set("state", state.slug);
  if (city) { q.set("cityId", String(city.id)); q.set("city", city.slug); }
  if (service) q.set("service", service);
  if (mode) q.set("mode", mode);
  return `/book-pandit-online?${q}`;
};

export default function PanditDirectory() {
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
  const state = data?.states.find((s) => String(s.id) === stateId || s.slug === search.get("state"));
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
  return <DiscoveryHome data={data} selectedService={service} preferredMode={preferredMode} date={date} muhurat={muhurat} context={contextQuery} isLoading={isLoading} isError={isError} retry={refetch} onNavigate={setLocation} />;
}

function StateChooser({ state, service, preferredMode, context, onNavigate }: { state: State; service?: string; preferredMode?: "online" | "offline"; context: string; onNavigate: (path: string) => void }) {
  const stateWide = new URLSearchParams(context);
  stateWide.set("stateId", String(state.id));
  stateWide.set("state", state.slug);
  stateWide.set("scope", "state");
  if (service) stateWide.set("service", service);
  if (preferredMode) stateWide.set("mode", preferredMode);
  return <main className="min-h-screen bg-[#F5F0E6] px-5 py-10 text-[#2B1115] sm:px-8">
    <div className="mx-auto max-w-5xl">
      <button onClick={() => onNavigate("/book-pandit-online")} className="text-sm font-semibold text-[#6D2B35]">← All States</button>
      <p className="mt-8 text-[11px] uppercase tracking-[.24em] text-[#9A7218]">{state.code} · {state.count} Pandits based here</p>
      <h1 className="mt-2 font-serif text-4xl font-semibold text-[#6D2B35]">Choose a City in {state.name}</h1>
      {service ? <p className="mt-3 text-sm text-[#5a4a3a]/70">Service: <strong>{service}</strong></p> : null}
      <div className="mt-8 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {state.cities.map(city => <button key={city.id} onClick={() => { trackDiscoveryEvent("city_selected", { state_id: state.id, city_id: city.id, has_service: !!service }); onNavigate(linkFor(state, city, service, preferredMode, context)); }} className="rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-5 text-left transition-transform hover:-translate-y-0.5">
          <span className="flex items-center justify-between"><strong className="font-serif text-xl text-[#6D2B35]">{city.name}</strong><MapPin className="h-5 w-5 text-[#9A7218]" /></span>
          <span className="mt-2 block text-sm text-[#5a4a3a]/70">{city.count} eligible {city.count === 1 ? "Pandit" : "Pandits"} based here</span>
        </button>)}
      </div>
      <div className="mt-8 rounded-md border border-[#D4AF37]/30 bg-[#6D2B35] p-5 text-[#FBF7EE] sm:flex sm:items-center sm:justify-between">
        <div><h2 className="font-serif text-xl">Browse across {state.name}</h2><p className="mt-1 text-sm text-[#FBF7EE]/70">{state.stateWideCount} {state.stateWideCount === 1 ? "Pandit has" : "Pandits have"} State-wide or national reach.</p></div>
        <Button disabled={state.stateWideCount === 0} onClick={() => { trackDiscoveryEvent("state_wide_selected", { state_id: state.id, has_service: !!service }); onNavigate(`/book-pandit-online?${stateWide}`); }} className="mt-4 bg-[#E9C96A] text-[#6D2B35] hover:bg-[#F4D983] sm:mt-0">View State-wide</Button>
      </div>
    </div>
  </main>;
}

function DiscoveryHome({ data, selectedService, preferredMode, date, muhurat, context, isLoading, isError, retry, onNavigate }: { data?: Summary; selectedService?: string; preferredMode?: "online" | "offline"; date?: string; muhurat?: string; context: string; isLoading: boolean; isError: boolean; retry: () => void; onNavigate: (path: string) => void }) {
  const [term, setTerm] = useState("");
  const [showAllServices, setShowAllServices] = useState(false);
  const results = useMemo(() => {
    if (!data || !term.trim()) return [];
    const q = term.toLowerCase();
    return data.states.flatMap((s) => [
      ...(s.name.toLowerCase().includes(q) ? [{ label: s.name, meta: `${s.count} eligible pandits · ${s.cityCount} cities`, href: linkFor(s, undefined, selectedService, preferredMode, context) }] : []),
      ...s.cities.filter((c) => c.name.toLowerCase().includes(q)).map((c) => ({ label: c.name, meta: `${s.name} · ${c.count} eligible pandits`, href: linkFor(s, c, selectedService, preferredMode, context) })),
    ]).slice(0, 6);
  }, [data, term, selectedService, preferredMode, context]);
  const nearby = () => { const params = new URLSearchParams(context); params.set("mode", "nearMe"); trackDiscoveryEvent("near_me_selected"); onNavigate(`/book-pandit-online?${params}`); };
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
      {date ? <div className="mb-6 rounded-md border border-[#D4AF37]/40 bg-[#FBF7EE] p-4 text-sm text-[#6D2B35]" data-testid="muhurat-location-prompt"><strong>Selected auspicious window:</strong> {date}{muhurat ? ` · ${muhurat}` : ""}. Choose a location to find Pandits eligible for this ritual. Calendar availability will be confirmed during booking.</div> : null}
      <div className="mb-6 flex items-end justify-between gap-4"><div><p className="text-[11px] uppercase tracking-[.24em] text-[#9A7218]">A considered beginning</p><h2 className="mt-1 text-3xl font-semibold text-[#6D2B35]">Browse by State</h2>{selectedService ? <p className="mt-2 text-sm text-[#5a4a3a]/70">Showing locations for <strong>{selectedService}</strong> <button className="ml-2 underline" onClick={() => onNavigate("/book-pandit-online")}>Clear</button></p> : null}</div><span className="hidden text-sm text-[#5a4a3a]/60 sm:block">Counts reflect eligible pandits</span></div>
      {isLoading ? <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{[1,2,3,4,5,6].map(i => <Skeleton key={i} className="h-32 bg-[#E9DEC9]" />)}</div> :
      isError ? <div className="rounded-md border border-[#D4AF37]/35 bg-[#FBF7EE] p-8 text-center"><p className="font-serif text-xl text-[#6D2B35]">The directory is taking a moment.</p><Button onClick={retry} className="mt-4 bg-[#6D2B35]">Try again</Button></div> :
      data?.states.length === 0 ? <div className="rounded-md border border-[#D4AF37]/35 bg-[#FBF7EE] p-8 text-center">No eligible locations are available yet.</div> :
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{data?.states.map((s) => <div key={s.id} className="rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-5 transition-transform hover:-translate-y-0.5">
        <button onClick={() => { trackDiscoveryEvent("state_selected", { state_id: s.id, has_service: !!selectedService }); onNavigate(linkFor(s, undefined, selectedService, preferredMode, context)); }} className="w-full text-left"><div className="flex items-start justify-between"><div><p className="text-xs uppercase tracking-[.2em] text-[#9A7218]">{s.code}</p><h3 className="mt-1 text-xl font-semibold text-[#6D2B35]">{s.name}</h3></div><Building2 className="h-5 w-5 text-[#9A7218]" /></div><p className="mt-4 text-sm text-[#5a4a3a]/70">{s.count} eligible pandits · {s.cityCount} cities</p><span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-[#6D2B35]">Explore state <ArrowRight className="h-3.5 w-3.5" /></span></button>
      </div>)}</div>}
      {data?.facets.services.length ? <div className="mt-12 rounded-md bg-[#6D2B35] p-6 text-[#FBF7EE]"><p className="text-[11px] uppercase tracking-[.24em] text-[#E9C96A]">Start with a service</p><h2 className="mt-1 text-2xl font-semibold">What brings you here?</h2><div className="mt-4 flex flex-wrap gap-2">{data.facets.services.slice(0, showAllServices ? undefined : 8).map(s => <button key={s} onClick={() => { trackDiscoveryEvent("service_selected", { service: s }); onNavigate(`/book-pandit-online?service=${encodeURIComponent(s)}`); }} className="rounded-full border border-[#E9C96A]/45 px-3 py-1.5 text-sm hover:bg-[#E9C96A] hover:text-[#6D2B35]">{s}</button>)}</div>{data.facets.services.length > 8 ? <button className="mt-4 text-sm font-semibold text-[#E9C96A] underline underline-offset-4" onClick={() => setShowAllServices(value => !value)}>{showAllServices ? "Show fewer services" : `View all ${data.facets.services.length} services`}</button> : null}</div> : null}
      <div className="mt-8 grid gap-3 sm:grid-cols-2"><Link href="/online-puja-booking?mode=online" className="flex min-h-11 items-center gap-4 rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-5"><Video className="h-6 w-6 text-[#6D2B35]" /><span><b className="block text-[#6D2B35]">Need a ritual from anywhere?</b><small className="text-[#5a4a3a]/65">Explore online Puja guides</small></span></Link><Link href="/pind-daan-booking" className="flex min-h-11 items-center gap-4 rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-5"><MapPin className="h-6 w-6 text-[#6D2B35]" /><span><b className="block text-[#6D2B35]">Sacred ancestor rites</b><small className="text-[#5a4a3a]/65">Pind daan and tarpan services</small></span></Link></div>
    </section><BecomePanditBanner />
  </main>;
}
export { BecomePanditBanner, BecomePanditStrip };