import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ChevronRight, MapPin, ShoppingBag, Sparkles, UserPlus } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { PanditDirectoryView } from "@/components/pandit/PanditDirectoryView";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { buildPanditCitySeo, panditCitySeoOrigin } from "@shared/pandit-city-seo";

type Indexability = { indexable: boolean; status: string; reasons: string[] };
type Editorial = {
  introduction?: string | null;
  faqs?: Array<{ question: string; answer: string }> | null;
};
type ProjectedService = {
  id: number;
  masterServiceId: number;
  name: string;
  slug: string;
  price?: number | null;
  durationMinutes?: number | null;
  mode: "online" | "in_person" | "hybrid";
};
type ProjectedProvider = {
  canonicalUrl: string | null;
  cityId: number;
  stateId: number;
  pandit: {
    id: number;
    name: string;
    slug: string;
    image?: string | null;
    experience?: number | null;
    rating?: number | null;
    reviewCount?: number | null;
    languages?: string | null;
    verified: boolean;
  };
  services: ProjectedService[];
};
type ProjectedCityService = {
  canonicalUrl: string;
  service: { id: number; name: string; slug: string };
  providers: ProjectedProvider[];
  indexability: Indexability;
  editorial?: Editorial | null;
};
type ProjectedCity = {
  canonicalUrl: string;
  city: { id: number; stateId: number; name: string; slug: string };
  state: { id: number; name: string; code: string };
  providers: ProjectedProvider[];
  providerCount?: number;
  services: ProjectedCityService[];
  indexability: Indexability;
  editorial?: Editorial | null;
};

type DiscoverySummary = {
  states: Array<{
    id: number;
    name: string;
    slug: string;
    cities: Array<{ id: number; name: string; slug: string; count: number }>;
  }>;
};

type PublicProduct = { id: number; category?: string | null };

const STORE_CATEGORIES = [
  { name: "Puja Samagri", description: "Daily worship and ritual essentials" },
  { name: "Havan Samagri", description: "Ingredients and supplies for homa and yajna" },
  { name: "Brass & Copperware", description: "Diyas, bells, lotas and puja thalis" },
  { name: "Idols", description: "Deity murtis for home and ritual spaces" },
];

function CityEnrichment({
  cityName,
  stateName,
  stateSlug,
  citySlug,
  services = [],
  editorial,
  discovery,
}: {
  cityName: string;
  stateName: string;
  stateSlug: string;
  citySlug: string;
  services?: ProjectedCityService[];
  editorial?: Editorial | null;
  discovery?: DiscoverySummary;
}) {
  const productsQuery = useQuery<PublicProduct[]>({
    queryKey: ["/api/products", "city-enrichment"],
    queryFn: async () => {
      const response = await fetch("/api/products");
      if (!response.ok) throw new Error("Unable to load store categories");
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
  });
  const state = discovery?.states.find((item) => item.slug === stateSlug);
  const nearby = state?.cities.filter((item) => item.slug !== citySlug).slice(0, 6) || [];
  const categories = STORE_CATEGORIES.map((category) => ({
    ...category,
    count: productsQuery.data?.filter((product) => product.category === category.name).length || 0,
  })).filter((category) => category.count > 0);
  const localServices = services.filter((service) => service.providers.length > 0).slice(0, 8);

  return <div className="border-t border-[#D4AF37]/20 bg-[#FBF7EE]">
    {editorial?.introduction && <section className="mx-auto max-w-4xl px-5 py-14 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6F19]">Local booking guide</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-[#6D2B35]">Planning a Vedic ceremony in {cityName}</h2>
      <p className="mt-5 whitespace-pre-line leading-8 text-[#594A43]">{editorial.introduction}</p>
    </section>}

    {!!localServices.length && <section className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6F19]">Verified local supply</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-[#6D2B35]">Vedic services available in {cityName}</h2>
      <p className="mt-3 max-w-3xl text-[#6F5A50]">These links appear only when an eligible published Pandit offers the canonical service locally. Exact timing and availability are confirmed during booking.</p>
      <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {localServices.map((service) => <Link key={service.service.id} href={service.canonicalUrl}>
          <article className="group h-full rounded-2xl border border-[#DCCBAA] bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-[#B68B32] hover:shadow-md">
            <Sparkles className="h-5 w-5 text-[#B68B32]" />
            <h3 className="mt-4 font-semibold text-[#3B2025]">{service.service.name}</h3>
            <p className="mt-2 text-sm text-[#705E55]">{service.providers.length} eligible {service.providers.length === 1 ? "Pandit" : "Pandits"} listed</p>
            <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-[#6D2B35]">View service <ArrowRight className="h-4 w-4" /></span>
          </article>
        </Link>)}
      </div>
    </section>}

    {!!categories.length && <section className="bg-[#F1E8D7]">
      <div className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6F19]">Vedic Tatva store</p>
        <h2 className="mt-3 font-serif text-3xl font-semibold text-[#6D2B35]">Prepare for your puja</h2>
        <p className="mt-3 max-w-3xl text-[#6F5A50]">Browse currently listed store categories. Store availability is nationwide and is not a claim of local stock in {cityName}.</p>
        <div className="mt-7 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {categories.map((category) => <Link key={category.name} href={`/puja-samagri-online?category=${encodeURIComponent(category.name)}`}>
            <article className="h-full rounded-2xl border border-[#D8C6A5] bg-[#FFFDF8] p-5">
              <ShoppingBag className="h-5 w-5 text-[#8D343D]" />
              <h3 className="mt-4 font-semibold text-[#3B2025]">{category.name}</h3>
              <p className="mt-2 text-sm leading-6 text-[#705E55]">{category.description}</p>
              <span className="mt-4 block text-xs font-semibold uppercase tracking-wide text-[#8D343D]">{category.count} listed items</span>
            </article>
          </Link>)}
        </div>
      </div>
    </section>}

    <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8">
      <div className="grid gap-6 rounded-3xl bg-[#6D2B35] p-7 text-[#FBF7EE] sm:p-10 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <UserPlus className="h-7 w-7 text-[#E9C96A]" />
          <h2 className="mt-4 font-serif text-3xl font-semibold">Are you a qualified Pandit serving {cityName}?</h2>
          <p className="mt-3 max-w-2xl text-[#FBF7EE]/75">Apply to join Vedic Tatva. Every application is reviewed, and registration does not guarantee approval, publication, or bookings.</p>
        </div>
        <Link href="/pandit/signup"><Button className="bg-[#E9C96A] text-[#5A2029] hover:bg-[#F2D989]">Start Pandit registration <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
      </div>
    </section>

    {!!nearby.length && <section className="mx-auto max-w-6xl px-5 pb-14 sm:px-8">
      <h2 className="font-serif text-2xl font-semibold text-[#6D2B35]">Browse Pandits in other {stateName} cities</h2>
      <div className="mt-5 flex flex-wrap gap-2">
        {nearby.map((item) => <Link key={item.id} href={`/book-pandit-online/${stateSlug}/${item.slug}`}>
          <Badge variant="outline" className="bg-white px-4 py-2 text-sm">{item.name} · {item.count}</Badge>
        </Link>)}
      </div>
    </section>}

    {!!editorial?.faqs?.length && <section className="mx-auto max-w-4xl px-5 pb-16 sm:px-8">
      <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[#9A6F19]">Helpful answers</p>
      <h2 className="mt-3 font-serif text-3xl font-semibold text-[#6D2B35]">Booking a Pandit in {cityName}: FAQs</h2>
      <div className="mt-7 space-y-3">
        {editorial.faqs.map((faq) => <details key={faq.question} className="group rounded-xl border border-[#DCCBAA] bg-white p-5">
          <summary className="cursor-pointer list-none font-semibold text-[#3B2025]">{faq.question}</summary>
          <p className="mt-3 leading-7 text-[#66544C]">{faq.answer}</p>
        </details>)}
      </div>
    </section>}
  </div>;
}

const cleanLocationSlug = (value: string) => value.trim().toLowerCase()
  .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
  .replace(/&/g, "and").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

function discoveryLocation(data: DiscoverySummary | undefined, stateSlug: string, citySlug: string) {
  const state = data?.states.find((candidate) =>
    candidate.slug === stateSlug || cleanLocationSlug(candidate.name) === cleanLocationSlug(stateSlug),
  );
  if (!state) return null;
  const city = state.cities.find((candidate) =>
    candidate.slug === citySlug || cleanLocationSlug(candidate.name) === cleanLocationSlug(citySlug),
  );
  return city ? { state, city } : null;
}

export default function PanditCanonicalLocation() {
  const { stateSlug = "", citySlug: nestedCitySlug, serviceSlug } = useParams<{ stateSlug?: string; citySlug?: string; serviceSlug?: string }>();
  const citySlug = nestedCitySlug || stateSlug;
  useEffect(() => {
    if (!window.location.pathname.startsWith("/pandits/")) return;
    const suffix = window.location.pathname.slice("/pandits".length);
    window.location.replace(`/book-pandit-online${suffix}${window.location.search}`);
  }, []);
  const cityQuery = useQuery<ProjectedCity>({
    queryKey: ["/api/pandit-seo-network/cities", citySlug, stateSlug],
    queryFn: async () => {
      const endpoint = stateSlug && nestedCitySlug
        ? `/api/pandit-seo-network/locations/${encodeURIComponent(stateSlug)}/${encodeURIComponent(citySlug)}`
        : `/api/pandit-seo-network/cities/${encodeURIComponent(citySlug)}`;
      const response = await fetch(endpoint);
      if (!response.ok) throw new Error(response.status === 404 ? "City not found" : "Unable to load this city");
      return response.json();
    },
    retry: false,
  });
  // The SEO projection is optional rollout infrastructure. Discovery remains
  // the authoritative availability source for a useful city results page.
  const discoveryQuery = useQuery<DiscoverySummary>({
    queryKey: ["/api/pandit-discovery", "canonical-location"],
    queryFn: async () => {
      const response = await fetch("/api/pandit-discovery");
      if (!response.ok) throw new Error("Unable to load this location");
      return response.json();
    },
    enabled: true,
    retry: false,
  });
  const serviceQuery = useQuery<ProjectedCityService>({
    queryKey: ["/api/pandit-seo-network/cities", citySlug, "services", serviceSlug],
    enabled: Boolean(serviceSlug),
    queryFn: async () => {
      const response = await fetch(
        `/api/pandit-seo-network/cities/${encodeURIComponent(citySlug)}/services/${encodeURIComponent(serviceSlug!)}`,
      );
      if (!response.ok) throw new Error(response.status === 404 ? "City service not found" : "Unable to load this service");
      return response.json();
    },
    retry: false,
  });
  const selectedService = serviceSlug ? serviceQuery.data : undefined;

  const discoveryCity = discoveryLocation(discoveryQuery.data, stateSlug, citySlug);
  const liveDirectoryCountQuery = useQuery<{ pagination?: { total?: number } }>({
    queryKey: ["/api/book-pandit-online", "city-description-count", cityQuery.data?.city.id, selectedService?.service.name || ""],
    enabled: Boolean(cityQuery.data?.city.id),
    queryFn: async () => {
      const params = new URLSearchParams({
        cityId: String(cityQuery.data!.city.id),
        page: "1",
        pageSize: "1",
        ...(selectedService?.service.name ? { service: selectedService.service.name } : {}),
      });
      const response = await fetch(`/api/book-pandit-online?${params.toString()}`);
      if (!response.ok) throw new Error("Unable to load live Pandit count");
      return response.json();
    },
    staleTime: 60 * 1000,
    retry: false,
  });
  if (
    cityQuery.isLoading
    || (serviceSlug && serviceQuery.isLoading)
    || (cityQuery.isError && discoveryQuery.isLoading)
  ) {
    return <main className="min-h-[70vh] bg-[#F5F0E6] px-5 py-20"><Skeleton className="mx-auto h-72 max-w-5xl bg-[#E9DEC9]" /></main>;
  }
  if (cityQuery.isError && discoveryCity) {
    const city = discoveryCity.city;
    const state = discoveryCity.state;
    const canonical = `/book-pandit-online/${state.slug}/${city.slug}`;
    return <main className="min-h-screen bg-[#F5F0E6] text-[#2B1115]">
      <PageSeo
        title={`Pandits in ${city.name} | Vedic Tatva`}
        description={`Compare ${discoveryCity.city.count} available Vedic Pandits in ${city.name}, ${state.name}. Explore their exact services and request a booking through Vedic Tatva.`}
        canonical={canonical}
        noindex
      />
      <section className="border-b border-[#D4AF37]/25 bg-[#6D2B35] text-[#FBF7EE]">
        <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
          <Badge className="mb-3 bg-[#E9C96A] text-[#6D2B35]"><MapPin className="mr-1 h-3 w-3" />{city.name}, {state.name}</Badge>
          <h1 className="font-serif text-4xl font-semibold sm:text-5xl">Pandits in {city.name}</h1>
          <p className="mt-4 max-w-2xl text-[#FBF7EE]/75">Browse eligible Pandits in this active catalogue city. This page is not indexed while local profile publishing is being completed.</p>
        </div>
      </section>
      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
        <PanditDirectoryView
          cityId={city.id}
          stateId={state.id}
          cityLabel={city.name}
          stateLabel={state.name}
          stateSlug={state.slug}
          mode="city"
          embedded
        />
      </section>
       <CityEnrichment
         cityName={city.name}
         stateName={state.name}
         stateSlug={state.slug}
         citySlug={city.slug}
         discovery={discoveryQuery.data}
       />
    </main>;
  }
  if (cityQuery.isError || (serviceSlug && serviceQuery.isError) || !cityQuery.data || (serviceSlug && !selectedService)) {
    return <main className="min-h-[70vh] bg-[#F5F0E6] px-5 py-20 text-center">
      <PageSeo title="Pandit page unavailable | Vedic Tatva" description="Browse active cities and published Vedic Pandits." canonical="/book-pandit-online" noindex />
      <h1 className="font-serif text-3xl text-[#6D2B35]">Pandit page unavailable</h1>
      <p className="mt-3 text-muted-foreground">This city or exact service is not currently available.</p>
      <Link href="/book-pandit-online"><Button className="mt-6">Browse active locations</Button></Link>
    </main>;
  }

  const city = cityQuery.data;
  const routeCanonical = city.canonicalUrl;
  const providers = selectedService?.providers || city.providers;
  const editorial = selectedService?.editorial || city.editorial;
  const liveDirectoryCount = liveDirectoryCountQuery.data?.pagination?.total;
  const seo = buildPanditCitySeo({
    canonicalUrl: selectedService?.canonicalUrl || routeCanonical,
    city: { name: city.city.name, canonicalUrl: routeCanonical },
    state: { name: city.state.name },
    providers,
    providerCount: liveDirectoryCount ?? discoveryCity?.city.count ?? city.providerCount ?? providers.length,
    indexable: selectedService?.indexability.indexable ?? city.indexability.indexable,
    ...(selectedService ? { service: { name: selectedService.service.name } } : {}),
  }, typeof window === "undefined"
    ? ""
    : panditCitySeoOrigin(document.querySelector('link[rel="canonical"]')?.getAttribute("href"), window.location.origin));
  const { title, description, indexable } = seo;

  return <main className="min-h-screen bg-[#F5F0E6] text-[#2B1115]">
       <PageSeo
      title={title}
      description={description}
      canonical={seo.canonical}
      noindex={!indexable}
      schemas={seo.schemas}
    />
    <section className="border-b border-[#D4AF37]/25 bg-[#6D2B35] text-[#FBF7EE]">
      <div className="mx-auto max-w-6xl px-5 py-12 sm:px-8">
        <nav aria-label="Breadcrumb" className="mb-5 flex flex-wrap items-center gap-1 text-xs text-[#FBF7EE]/70">
          <Link href="/">Home</Link><ChevronRight className="h-3 w-3" />
           <Link href="/book-pandit-online">Pandits</Link><ChevronRight className="h-3 w-3" />
           {stateSlug && <><Link href={`/book-pandit-online/${stateSlug}`}>{city.state.name}</Link><ChevronRight className="h-3 w-3" /></>}
           {selectedService ? <><Link href={routeCanonical}>{city.city.name}</Link><ChevronRight className="h-3 w-3" /><span>{selectedService.service.name}</span></> : <span>{city.city.name}</span>}
        </nav>
        <Badge className="mb-3 bg-[#E9C96A] text-[#6D2B35]"><MapPin className="mr-1 h-3 w-3" />{city.city.name}, {city.state.name}</Badge>
        <h1 className="font-serif text-4xl font-semibold sm:text-5xl">
          {selectedService ? `${selectedService.service.name} Pandits in ${city.city.name}` : `Pandits in ${city.city.name}`}
        </h1>
        <p className="mt-4 max-w-2xl text-[#FBF7EE]/75">{description}</p>
        {!indexable && <p className="mt-4 text-sm text-[#E9C96A]">This useful page is available while our local published network grows.</p>}
      </div>
    </section>

    {!selectedService && city.services.some((service) => service.indexability.indexable) && <section className="mx-auto max-w-6xl px-5 pt-10 sm:px-8">
      <h2 className="font-serif text-2xl font-semibold text-[#6D2B35]">Services with established local availability</h2>
      <div className="mt-4 flex flex-wrap gap-2">
        {city.services.filter((service) => service.indexability.indexable).map((service) =>
          <Link key={service.service.id} href={service.canonicalUrl}>
            <Badge variant="outline" className="bg-white px-3 py-2">{service.service.name} · {service.providers.length} Pandits</Badge>
          </Link>)}
      </div>
    </section>}

    <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8">
      <h2 className="font-serif text-2xl font-semibold text-[#6D2B35]">
        Browse eligible Pandits in {city.city.name}
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Results below come from the same public directory query used by discovery. Profile catalogue quality controls indexability, not whether an active city browse page is useful.
      </p>
      <div className="mt-5 -mx-5 sm:-mx-8">
        <PanditDirectoryView
          cityId={city.city.id}
          stateId={city.state.id}
          cityLabel={city.city.name}
          stateLabel={city.state.name}
          stateSlug={stateSlug || city.state.name.toLowerCase().replace(/\s+/g, "-")}
          service={selectedService?.service.name}
          mode="city"
          embedded
        />
      </div>
    </section>

    <CityEnrichment
      cityName={city.city.name}
      stateName={city.state.name}
      stateSlug={stateSlug || cleanLocationSlug(city.state.name)}
      citySlug={city.city.slug}
      services={selectedService ? [selectedService] : city.services}
      editorial={editorial}
      discovery={discoveryQuery.data}
    />
  </main>;
}