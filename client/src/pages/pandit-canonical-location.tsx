import { useEffect, useMemo } from "react";
import { useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import PageSeo from "@/components/PageSeo";
import { appendPanditRouteContext, discoveryServiceForPujaSlug } from "@/lib/puja-service-map";

type LocationCity = { id: number; name: string; slug: string; aliases?: string[] };
type LocationState = { id: number; name: string; slug?: string; cities: LocationCity[] };
type DiscoveryCity = { id: number; name: string; slug: string };
type DiscoveryState = { id: number; name: string; slug: string; cities: DiscoveryCity[] };

const slugify = (value: string) => value
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-|-$/g, "");

export default function PanditCanonicalLocation() {
  const { citySlug = "", pujaSlug = "" } = useParams<{ citySlug: string; pujaSlug?: string }>();
  const [, navigate] = useLocation();
  const locations = useQuery<LocationState[]>({
    queryKey: ["/api/locations"],
    queryFn: async () => {
      const response = await fetch("/api/locations");
      if (!response.ok) throw new Error("Locations unavailable");
      return response.json();
    },
  });
  const discovery = useQuery<{ states: DiscoveryState[] }>({
    queryKey: ["/api/pandit-discovery"],
    queryFn: async () => {
      const response = await fetch("/api/pandit-discovery");
      if (!response.ok) throw new Error("Discovery unavailable");
      return response.json();
    },
  });

  const target = useMemo(() => {
    const requested = slugify(citySlug);
    for (const state of locations.data || []) {
      const city = state.cities.find(candidate => [
        candidate.slug,
        candidate.name,
        ...(candidate.aliases || []),
      ].some(value => slugify(value) === requested));
      if (city) return { state, city };
    }
    return undefined;
  }, [citySlug, locations.data]);

  const canonical = useMemo(() => {
    if (!target) return undefined;
    const state = discovery.data?.states.find(candidate => candidate.id === target.state.id);
    const city = state?.cities.find(candidate => candidate.id === target.city.id);
    return state && city ? { state, city } : undefined;
  }, [discovery.data, target]);

  useEffect(() => {
    if (!canonical) return;
    const query = new URLSearchParams({
      stateId: String(canonical.state.id),
      state: canonical.state.slug,
      cityId: String(canonical.city.id),
      city: canonical.city.slug,
    });
    const service = discoveryServiceForPujaSlug(pujaSlug);
    if (service) query.set("service", service);
    appendPanditRouteContext(
      query,
      typeof window !== "undefined" ? window.location.search : "",
      pujaSlug ? "puja_city" : "city",
    );
    navigate(`/book-pandit-online?${query}`, { replace: true });
  }, [canonical, navigate, pujaSlug]);

  if (locations.isLoading || discovery.isLoading || canonical) {
    return <main className="min-h-[70vh] bg-[#F5F0E6] px-5 py-20"><Skeleton className="mx-auto h-72 max-w-5xl bg-[#E9DEC9]" /></main>;
  }

  const unavailable = !target || !canonical;
  return <main className="min-h-[70vh] bg-[#F5F0E6] px-5 py-20 text-center text-[#2B1115]">
    <PageSeo title="Pandit location unavailable | Vedic Tatva" description="Browse active locations with eligible Vedic Pandits." canonical="/book-pandit-online" noindex />
    <h1 className="font-serif text-3xl text-[#6D2B35]">{unavailable ? "Location not available" : "Opening Pandit discovery"}</h1>
    <p className="mt-3 text-[#5a4a3a]/70">This City is inactive, unknown, or currently has no eligible Pandits.</p>
    <Button className="mt-6 bg-[#6D2B35]" onClick={() => navigate("/book-pandit-online", { replace: true })}>Browse active locations</Button>
  </main>;
}