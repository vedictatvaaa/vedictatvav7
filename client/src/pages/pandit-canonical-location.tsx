import { useEffect } from "react";
import { Link, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Calendar, ChevronRight, MapPin, ShieldCheck } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
  services: ProjectedCityService[];
  indexability: Indexability;
  editorial?: Editorial | null;
};

function bookingHref(
  city: ProjectedCity,
  provider: ProjectedProvider,
  service: ProjectedService,
) {
  const params = new URLSearchParams({
    cityId: String(city.city.id),
    stateId: String(city.state.id),
    masterServiceId: String(service.masterServiceId),
    mode: service.mode,
    pandit: String(provider.pandit.id),
    serviceId: String(service.id),
  });
  return `/online-puja-booking?${params}`;
}

export default function PanditCanonicalLocation() {
  const { citySlug = "", serviceSlug } = useParams<{ citySlug: string; serviceSlug?: string }>();
  useEffect(() => {
    if (!window.location.pathname.startsWith("/pandits/")) return;
    const suffix = window.location.pathname.slice("/pandits".length);
    window.location.replace(`/book-pandit-online${suffix}${window.location.search}`);
  }, []);
  const cityQuery = useQuery<ProjectedCity>({
    queryKey: ["/api/pandit-seo-network/cities", citySlug],
    queryFn: async () => {
      const response = await fetch(`/api/pandit-seo-network/cities/${encodeURIComponent(citySlug)}`);
      if (!response.ok) throw new Error(response.status === 404 ? "City not found" : "Unable to load this city");
      return response.json();
    },
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

  if (cityQuery.isLoading || (serviceSlug && serviceQuery.isLoading)) {
    return <main className="min-h-[70vh] bg-[#F5F0E6] px-5 py-20"><Skeleton className="mx-auto h-72 max-w-5xl bg-[#E9DEC9]" /></main>;
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
  const providers = selectedService?.providers || city.providers;
  const editorial = selectedService?.editorial || city.editorial;
  const seo = buildPanditCitySeo({
    canonicalUrl: selectedService?.canonicalUrl || city.canonicalUrl,
    city: { name: city.city.name, canonicalUrl: city.canonicalUrl },
    state: { name: city.state.name },
    providers,
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
          {selectedService ? <><Link href={city.canonicalUrl}>{city.city.name}</Link><ChevronRight className="h-3 w-3" /><span>{selectedService.service.name}</span></> : <span>{city.city.name}</span>}
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
        {providers.length} published {providers.length === 1 ? "Pandit" : "Pandits"} available
      </h2>
      {providers.length === 0 && <Card className="mt-5 border-[#D4AF37]/35 bg-white">
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-semibold text-[#6D2B35]">Find the next available verified Pandit</h3>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            No published Pandit currently matches this exact page. Browse active locations and services while the local network grows.
          </p>
          <Link href="/book-pandit-online"><Button className="mt-5">Browse available Pandits</Button></Link>
        </CardContent>
      </Card>}
      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        {providers.map((provider) => {
          const exactServices = selectedService
            ? provider.services.filter((item) => item.masterServiceId === selectedService.service.id)
            : provider.services;
          const bookingService = exactServices[0];
          return <Card key={provider.pandit.id}>
            <CardContent className="p-5">
              <div className="flex gap-4">
                <Avatar className="h-16 w-16"><AvatarImage src={provider.pandit.image || undefined} /><AvatarFallback>{provider.pandit.name[0]}</AvatarFallback></Avatar>
                <div>
                  <h3 className="flex items-center gap-1 font-serif text-xl font-semibold">{provider.pandit.name}{provider.pandit.verified && <ShieldCheck className="h-4 w-4 text-green-700" />}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{provider.pandit.experience || 0}+ years · {provider.pandit.rating || 0} ({provider.pandit.reviewCount || 0} reviews)</p>
                  <p className="mt-1 text-xs text-muted-foreground">{provider.pandit.languages}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {exactServices.map((service) => <Badge key={service.id} variant="secondary">{service.name} · {service.mode.replace("_", " ")}</Badge>)}
              </div>
              <div className="mt-5 flex gap-2">
                {provider.canonicalUrl && <Link href={provider.canonicalUrl}><Button variant="outline">View profile</Button></Link>}
                {bookingService && <a href={bookingHref(city, provider, bookingService)}><Button><Calendar className="mr-1.5 h-4 w-4" />Book exact service</Button></a>}
              </div>
            </CardContent>
          </Card>;
        })}
      </div>
    </section>

    {editorial?.introduction && <section className="mx-auto max-w-3xl px-5 py-12 sm:px-8">
      <h2 className="font-serif text-3xl font-semibold text-[#6D2B35]">
        {selectedService ? `About ${selectedService.service.name} in ${city.city.name}` : `About booking a Pandit in ${city.city.name}`}
      </h2>
      <p className="mt-5 whitespace-pre-line leading-8 text-[#594A43]">{editorial.introduction}</p>
    </section>}

    {!!editorial?.faqs?.length && <section className="mx-auto max-w-3xl px-5 pb-16 sm:px-8">
      <h2 className="font-serif text-3xl font-semibold text-[#6D2B35]">Questions and answers</h2>
      <div className="mt-6 space-y-5">
        {editorial.faqs.map((faq) => <article key={faq.question} className="border-t border-[#D4AF37]/30 pt-5">
          <h3 className="font-semibold text-[#2B1115]">{faq.question}</h3>
          <p className="mt-2 leading-7 text-[#594A43]">{faq.answer}</p>
        </article>)}
      </div>
    </section>}
  </main>;
}