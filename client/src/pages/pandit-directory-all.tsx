import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { MapPin, Search, SlidersHorizontal, X } from "lucide-react";
import { useLocation, useSearch } from "wouter";
import PageSeo from "@/components/PageSeo";
import { PanditDirectoryView } from "@/components/pandit/PanditDirectoryView";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

type City = { id: number; name: string; slug: string; count: number };
type State = { id: number; name: string; slug: string; cities: City[]; count: number };
type DiscoverySummary = { states: State[]; facets: { services: string[]; languages: string[]; traditions: string[] } };

const clean = (value: string) => value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-");

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button type="button" onClick={onRemove} className="inline-flex min-h-11 items-center gap-2 rounded-full border border-[#D4AF37]/40 bg-[#FBF7EE] px-3 text-sm font-medium text-[#6D2B35] hover:bg-[#F2E8D5] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9A7218]">
      {label}<X className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}

export default function AllPanditsDirectory() {
  const [, navigate] = useLocation();
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search), [search]);
  const selectedStateId = params.get("stateId") || "";
  const selectedCityId = params.get("cityId") || "";
  const [sheetOpen, setSheetOpen] = useState(false);
  const { data, isLoading, isError, refetch } = useQuery<DiscoverySummary>({
    queryKey: ["/api/pandit-discovery", "all"],
    queryFn: async () => {
      const response = await fetch("/api/pandit-discovery");
      if (!response.ok) throw new Error("Unable to load locations");
      return response.json();
    },
    staleTime: 60_000,
  });
  const state = data?.states.find((item) => String(item.id) === selectedStateId);
  const city = state?.cities.find((item) => String(item.id) === selectedCityId);

  const updateLocation = (stateId: string, cityId = "") => {
    const next = new URLSearchParams(params);
    if (stateId) {
      const chosen = data?.states.find((item) => String(item.id) === stateId);
      next.set("stateId", stateId);
      if (chosen) next.set("state", clean(chosen.slug || chosen.name));
    } else {
      next.delete("stateId"); next.delete("state");
    }
    if (cityId) {
      const chosen = data?.states.find((item) => String(item.id) === stateId)?.cities.find((item) => String(item.id) === cityId);
      next.set("cityId", cityId);
      if (chosen) next.set("city", chosen.slug || clean(chosen.name));
    } else {
      next.delete("cityId"); next.delete("city");
    }
    next.delete("page");
    navigate(`/book-pandit-online/all${next.toString() ? `?${next}` : ""}`);
    setSheetOpen(false);
  };

  const clearAll = () => navigate("/book-pandit-online/all");
  const chips = [
    state ? { label: state.name, remove: () => updateLocation("") } : null,
    city ? { label: city.name, remove: () => updateLocation(selectedStateId) } : null,
    params.get("service") ? { label: `Service: ${params.get("service")}`, remove: () => remove("service") } : null,
    params.get("language") ? { label: `Language: ${params.get("language")}`, remove: () => remove("language") } : null,
    params.get("onlineOnly") === "true" ? { label: "Online now", remove: () => remove("onlineOnly") } : null,
  ].filter(Boolean) as { label: string; remove: () => void }[];

  function remove(key: string) {
    const next = new URLSearchParams(params);
    next.delete(key); next.delete("page");
    navigate(`/book-pandit-online/all${next.toString() ? `?${next}` : ""}`);
  }

  const locationPanel = (
    <div className="space-y-4">
      <div>
        <label htmlFor="all-state" className="mb-1.5 block text-xs font-semibold uppercase tracking-[.14em] text-[#806A61]">State</label>
        <Select value={selectedStateId || "all"} onValueChange={(value) => updateLocation(value === "all" ? "" : value)}>
          <SelectTrigger id="all-state" className="min-h-11 border-[#D4AF37]/35 bg-[#FBF7EE]"><SelectValue placeholder="All states" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All states</SelectItem>{(data?.states || []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div>
        <label htmlFor="all-city" className="mb-1.5 block text-xs font-semibold uppercase tracking-[.14em] text-[#806A61]">City</label>
        <Select disabled={!state} value={selectedCityId || "all"} onValueChange={(value) => updateLocation(selectedStateId, value === "all" ? "" : value)}>
          <SelectTrigger id="all-city" className="min-h-11 border-[#D4AF37]/35 bg-[#FBF7EE]"><SelectValue placeholder={state ? "All cities" : "Choose a state first"} /></SelectTrigger>
          <SelectContent><SelectItem value="all">All cities</SelectItem>{(state?.cities || []).map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name}</SelectItem>)}</SelectContent>
        </Select>
      </div>
    </div>
  );

  return (
    <main className="min-h-screen bg-[#F5F0E6] pb-28 text-[#2B1115]">
      <PageSeo title="Browse all Pandits | Vedic Tatva" description="Search discoverable Vedic Pandits by location, service, language, and verified directory data." canonical="/book-pandit-online/all" />
      <header className="border-b border-[#D4AF37]/25 bg-[#6D2B35] text-[#FBF7EE]">
        <div className="mx-auto max-w-7xl px-5 py-10 sm:px-8 sm:py-14">
          <p className="text-[11px] font-semibold uppercase tracking-[.28em] text-[#E9C96A]">The Vedic Tatva directory</p>
          <h1 className="mt-3 max-w-3xl font-serif text-4xl font-semibold leading-tight sm:text-6xl">Find a Pandit who fits the moment.</h1>
          <p className="mt-4 max-w-2xl text-sm leading-6 text-[#FBF7EE]/72 sm:text-base">Search the authoritative public directory. Every result below has passed our current discovery checks; availability is confirmed during booking.</p>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-5 py-7 sm:px-8">
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-[#806A61]"><Search className="h-4 w-4 text-[#9A7218]" /> Search by name, service, city, or specialization below.</div>
          <Button type="button" variant="outline" onClick={() => setSheetOpen(true)} className="min-h-11 gap-2 border-[#9A7218]/40 bg-[#FBF7EE] lg:hidden"><SlidersHorizontal className="h-4 w-4" /> Location filters</Button>
        </div>
        <div className="grid gap-7 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="hidden rounded-2xl border border-[#D4AF37]/30 bg-[#FBF7EE] p-5 lg:block" aria-label="Location filters">
            <div className="mb-4 flex items-center gap-2 font-serif text-xl text-[#6D2B35]"><MapPin className="h-5 w-5 text-[#9A7218]" /> Browse by place</div>
            {isLoading ? <div className="space-y-3"><Skeleton className="h-11 bg-[#E9DEC9]" /><Skeleton className="h-11 bg-[#E9DEC9]" /></div> : locationPanel}
          </aside>
          <section className="min-h-[720px] min-w-0">
            {chips.length > 0 && <div className="mb-5 flex flex-wrap items-center gap-2" aria-label="Active filters">
              {chips.map((chip) => <FilterChip key={chip.label} label={chip.label} onRemove={chip.remove} />)}
              <button type="button" onClick={clearAll} className="min-h-11 px-2 text-sm font-semibold text-[#6D2B35] underline underline-offset-4">Clear all</button>
            </div>}
            {isError && <div className="mb-5 rounded-xl border border-[#B45F4D]/35 bg-[#FBF7EE] p-6 text-center"><p className="font-serif text-xl text-[#6D2B35]">Locations are taking a moment.</p><Button onClick={() => refetch()} className="mt-4 min-h-11 bg-[#6D2B35]">Try again</Button></div>}
            <PanditDirectoryView mode="state" stateId={state?.id} stateLabel={state?.name} cityId={city?.id} cityLabel={city?.name} cityOptions={state?.cities || []} facetOptions={data?.facets} embedded />
          </section>
        </div>
      </div>
      {sheetOpen && <div className="fixed inset-0 z-50 bg-[#2B1115]/35 lg:hidden" role="presentation" onClick={() => setSheetOpen(false)}>
        <section role="dialog" aria-modal="true" aria-labelledby="mobile-location-title" className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-[#F5F0E6] p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] shadow-2xl" onClick={(event) => event.stopPropagation()}>
          <div className="mb-5 flex items-center justify-between"><h2 id="mobile-location-title" className="font-serif text-2xl text-[#6D2B35]">Choose a place</h2><button type="button" aria-label="Close filters" onClick={() => setSheetOpen(false)} className="flex h-11 w-11 items-center justify-center rounded-full hover:bg-[#E9DEC9]"><X className="h-5 w-5" /></button></div>
          {locationPanel}
          <Button type="button" onClick={() => setSheetOpen(false)} className="mt-6 min-h-11 w-full bg-[#6D2B35]">Show results</Button>
        </section>
      </div>}
    </main>
  );
}