import { useEffect, useMemo } from "react";
import { Link, useLocation, useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, MapPin, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import PageSeo from "@/components/PageSeo";
import { trackPanditSeoEvent } from "@/lib/analytics";
import {
  appendPanditRouteContext,
  bookingContextParams,
  discoveryServiceForPujaSlug,
  pujaTypeForService,
} from "@/lib/puja-service-map";

type Indexability = { status: string; indexable: boolean; reasons: string[] };
type Service = {
  id: number; masterServiceId: number; name: string; slug: string;
  mode?: string; price?: number; durationMinutes?: number; description?: string;
};
type Provider = {
  canonicalUrl: string;
  pandit: {
    id: number; name: string; slug: string; image?: string; bio?: string;
    city?: string; state?: string; verified?: boolean; languages?: string[] | string;
  };
  services: Service[];
};
type CityService = {
  entityId: string; canonicalUrl: string;
  service: { id: number; name: string; slug: string };
  providers: Provider[]; indexability: Indexability;
  editorial?: Editorial | null;
};
type Editorial = { introduction?: string; faqs?: Array<{ question: string; answer: string }> };
type CityPage = {
  entityId: string; canonicalUrl: string;
  city: { id: number; name: string; slug: string };
  state: { id: number; name: string; code: string };
  providers: Provider[]; services: CityService[]; indexability: Indexability;
  editorial?: Editorial | null;
};

class LocationRequestError extends Error {
  constructor(public status: number, public responseMessage: string) {
    super(responseMessage);
  }
}

const displayMode = (mode?: string) =>
  mode === "in_person" ? "In person" : mode === "hybrid" ? "Hybrid" : mode === "online" ? "Online" : "Booking";
const bookingMode = (mode?: string) =>
  mode === "in_person" ? "offline" : mode === "hybrid" ? "hybrid" : mode === "online" ? "online" : undefined;

async function fetchLocation(url: string) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new LocationRequestError(response.status, body?.message || "Location unavailable");
  return body;
}

function bookingHref(city: CityPage, provider: Provider, service?: Service) {
  const mode = bookingMode(service?.mode);
  const source = new URLSearchParams({ city: city.city.slug, source: service ? "puja_city" : "city" });
  if (mode) source.set("mode", mode);
  const params = bookingContextParams(source.toString(), provider.pandit.id);
  params.delete("packageId");
  if (service) {
    params.set("service", service.slug);
    params.set("serviceId", String(service.id));
    const pujaType = pujaTypeForService(service.name) || pujaTypeForService(service.slug);
    if (pujaType) params.set("pujaType", pujaType);
  }
  return `/online-puja-booking?${params.toString()}`;
}

function schemas(city: CityPage, service: CityService | undefined, canonical: string) {
  const origin = typeof window === "undefined" ? "" : window.location.origin;
  const providers = service?.providers || city.providers;
  const crumbs = [
    ["Home", "/"],
    ["Pandits", "/book-pandit-online"],
    [city.city.name, city.canonicalUrl],
    ...(service ? [[service.service.name, canonical]] : []),
  ];
  const result: any[] = [{
    id: "pandit-location-breadcrumb",
    payload: {
      "@context": "https://schema.org", "@type": "BreadcrumbList", "@id": `${origin}${canonical}#breadcrumb`,
      itemListElement: crumbs.map(([name, item], index) => ({
        "@type": "ListItem", position: index + 1, name, item: `${origin}${item}`,
      })),
    },
  }, {
    id: "pandit-location-list",
    payload: {
      "@context": "https://schema.org", "@type": "ItemList", "@id": `${origin}${canonical}#pandits`,
      name: service ? `${service.service.name} Pandits in ${city.city.name}` : `Pandits in ${city.city.name}`,
      numberOfItems: providers.length,
      itemListElement: providers.map((provider, index) => ({
        "@type": "ListItem", position: index + 1, name: provider.pandit.name,
        url: `${origin}${provider.canonicalUrl}`,
      })),
    },
  }];
  if (service) result.push({
    id: "pandit-location-service",
    payload: {
      "@context": "https://schema.org", "@type": "Service", "@id": `${origin}${canonical}#service`,
      name: service.service.name, serviceType: service.service.name,
      areaServed: { "@type": "City", name: city.city.name, containedInPlace: { "@type": "State", name: city.state.name } },
      provider: { "@id": `${origin}/#organization` }, url: `${origin}${canonical}`,
    },
  });
  return result;
}

export default function PanditCanonicalLocation() {
  const { citySlug = "", pujaSlug } = useParams<{ citySlug: string; pujaSlug?: string }>();
  const [, navigate] = useLocation();
  const cityQuery = useQuery<CityPage>({
    queryKey: ["/api/pandit-seo-network/cities", citySlug],
    queryFn: () => fetchLocation(`/api/pandit-seo-network/cities/${encodeURIComponent(citySlug)}`),
    retry: false,
  });
  const serviceQuery = useQuery<CityService>({
    queryKey: ["/api/pandit-seo-network/cities", citySlug, "services", pujaSlug],
    enabled: Boolean(pujaSlug),
    queryFn: () => fetchLocation(`/api/pandit-seo-network/cities/${encodeURIComponent(citySlug)}/services/${encodeURIComponent(pujaSlug!)}`),
    retry: false,
  });

  const disabled = cityQuery.error instanceof LocationRequestError
    && cityQuery.error.status === 404
    && cityQuery.error.responseMessage === "Not found";
  useEffect(() => {
    if (!disabled) return;
    const params = new URLSearchParams({ city: citySlug });
    const legacyService = discoveryServiceForPujaSlug(pujaSlug);
    if (legacyService) params.set("service", legacyService);
    appendPanditRouteContext(params, window.location.search, pujaSlug ? "puja_city" : "city");
    navigate(`/book-pandit-online?${params}`, { replace: true });
  }, [citySlug, disabled, navigate, pujaSlug]);

  const city = cityQuery.data;
  const service = pujaSlug ? serviceQuery.data : undefined;
  const providers = service?.providers || city?.providers || [];
  const canonical = service?.canonicalUrl || city?.canonicalUrl || `/book-pandit-online/${citySlug}${pujaSlug ? `/${pujaSlug}` : ""}`;
  const source = service ? "puja_city" : "city";
  useEffect(() => {
    if (city && (!pujaSlug || service)) {
      trackPanditSeoEvent("discovery_impression", { slug: service?.service.slug || city.city.slug, source });
    }
  }, [city, pujaSlug, service, source]);

  const pageSchemas = useMemo(
    () => city ? schemas(city, service, canonical) : [],
    [canonical, city, service],
  );

  if (cityQuery.isLoading || (pujaSlug && serviceQuery.isLoading)) {
    return <main aria-busy="true" className="min-h-[70vh] bg-[#F8F2E5] px-5 py-16">
      <span className="sr-only">Loading Pandits</span>
      <Skeleton className="mx-auto h-80 max-w-6xl bg-[#E9DEC9]" />
    </main>;
  }
  if (cityQuery.isError || (pujaSlug && serviceQuery.isError) || !city || (pujaSlug && !service)) {
    return <main className="grid min-h-[70vh] place-items-center bg-[#F8F2E5] px-5 text-center">
      <PageSeo title="Pandit location unavailable | Vedic Tatva" description="Browse active locations with published Pandits." canonical={canonical} noindex />
      <div><h1 className="font-serif text-4xl text-[#5B1D27]">Pandit location unavailable</h1>
        <p className="mt-3 text-[#715F55]">This city or service is not available.</p>
        <Link href="/book-pandit-online"><Button className="mt-6 bg-[#7C291F]">Browse Pandits</Button></Link>
      </div>
    </main>;
  }

  const name = service ? `${service.service.name} Pandits in ${city.city.name}` : `Pandits in ${city.city.name}`;
  const description = service
    ? `View published Pandits offering ${service.service.name} in ${city.city.name}, ${city.state.name}, and continue to booking.`
    : `View published Pandits and canonical puja services in ${city.city.name}, ${city.state.name}, and continue to booking.`;
  const editorial = service?.editorial || city.editorial;

  return <main className="min-h-screen bg-[#F8F2E5] text-[#4D312A]">
    <PageSeo title={`${name} | Vedic Tatva`} description={description} canonical={canonical}
      noindex={!(service || city).indexability.indexable} schemas={pageSchemas} />
    <section className="border-b border-[#D5AE59]/35 bg-[#6D2632] px-5 py-14 text-[#FFF8E8] sm:py-20">
      <div className="mx-auto max-w-6xl">
        <nav aria-label="Breadcrumb" className="mb-6 flex flex-wrap gap-2 text-xs text-[#FBE9C9]/75">
          <Link href="/">Home</Link><span aria-hidden="true">/</span>
          <Link href="/book-pandit-online">Pandits</Link><span aria-hidden="true">/</span>
          {service ? <><Link href={city.canonicalUrl}>{city.city.name}</Link><span aria-hidden="true">/</span><span>{service.service.name}</span></> : <span>{city.city.name}</span>}
        </nav>
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.18em] text-[#F2C75C]"><MapPin className="h-4 w-4" />{city.city.name}, {city.state.name}</div>
        <h1 className="mt-4 max-w-4xl font-serif text-4xl sm:text-6xl">{name}</h1>
        <p className="mt-5 max-w-2xl leading-7 text-[#FBE9C9]/80">{description}</p>
      </div>
    </section>

    <section aria-labelledby="providers-heading" className="mx-auto max-w-6xl px-5 py-14 sm:py-20">
      <h2 id="providers-heading" className="font-serif text-3xl text-[#5B1D27]">Published Pandits</h2>
      {providers.length ? <div className="mt-7 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {providers.map(provider => {
          const exactService = service
            ? provider.services.find(item => item.masterServiceId === service.service.id)
            : undefined;
          const mode = bookingMode(exactService?.mode);
          return <Card key={provider.pandit.id} className="flex flex-col rounded-none border-[#D5AE59]/45 bg-[#FFFDF7] p-5">
            <div className="flex items-center gap-4">
              {provider.pandit.image ? <img className="h-16 w-16 rounded-full object-cover" src={provider.pandit.image} alt="" /> : null}
              <div><h3 className="text-xl text-[#5B1D27]"><Link href={provider.canonicalUrl}>{provider.pandit.name}</Link></h3>
                <p className="mt-1 text-xs text-[#715F55]">{city.city.name}{provider.pandit.verified ? " · Verified profile" : ""}</p></div>
            </div>
            {exactService && <div className="mt-5 border-t border-[#E8D9B7] pt-4 text-sm">
              <p className="font-semibold text-[#6D2632]">{exactService.name}</p>
              <p className="mt-1 text-[#715F55]">{displayMode(exactService.mode)}{exactService.durationMinutes ? ` · ${exactService.durationMinutes} minutes` : ""}{typeof exactService.price === "number" ? ` · ₹${exactService.price.toLocaleString("en-IN")}` : ""}</p>
            </div>}
            <div className="mt-auto flex gap-2 pt-6">
              <Link className="inline-flex flex-1" href={provider.canonicalUrl}><Button variant="outline" className="w-full rounded-none border-[#7C291F] text-[#7C291F]">View profile</Button></Link>
              <Link className="inline-flex flex-1" href={bookingHref(city, provider, exactService)}
                onClick={() => { trackPanditSeoEvent("discovery_cta", { slug: service?.service.slug || city.city.slug, mode, source }); trackPanditSeoEvent("booking_handoff", { slug: service?.service.slug || city.city.slug, mode, source }); }}>
                <Button className="w-full rounded-none bg-[#7C291F]">Book <ArrowRight className="ml-1 h-4 w-4" /></Button>
              </Link>
            </div>
          </Card>;
        })}
      </div> : <div className="mt-7 border border-dashed border-[#C9A55A] p-8 text-center">
        <ShieldCheck className="mx-auto h-7 w-7 text-[#8A5A1F]" /><p className="mt-3">No published Pandits currently match this service.</p>
      </div>}
    </section>

    {!service && city.services.filter(item => item.indexability.indexable).length > 0 && <section className="border-y border-[#D5AE59]/35 bg-[#F1DFC0] px-5 py-12">
      <div className="mx-auto max-w-6xl"><h2 className="font-serif text-3xl text-[#5B1D27]">Available puja services</h2>
        <div className="mt-6 flex flex-wrap gap-3">{city.services.filter(item => item.indexability.indexable).map(item =>
          <Link key={item.entityId} href={item.canonicalUrl} className="border border-[#9C6B31] bg-[#FFF8E8] px-4 py-3 text-sm font-semibold text-[#6D2632] hover:bg-white">{item.service.name}</Link>)}
        </div></div>
    </section>}

    {editorial?.introduction && <section className="mx-auto max-w-3xl px-5 py-14"><h2 className="font-serif text-3xl text-[#5B1D27]">About booking in {city.city.name}</h2><p className="mt-5 whitespace-pre-line leading-8 text-[#715F55]">{editorial.introduction}</p></section>}
    {!!editorial?.faqs?.length && <section className="mx-auto max-w-3xl px-5 pb-16"><h2 className="font-serif text-3xl text-[#5B1D27]">Questions and answers</h2><div className="mt-6 space-y-5">{editorial.faqs.map(faq => <div key={faq.question}><h3 className="font-semibold text-[#5B1D27]">{faq.question}</h3><p className="mt-2 leading-7 text-[#715F55]">{faq.answer}</p></div>)}</div></section>}
  </main>;
}