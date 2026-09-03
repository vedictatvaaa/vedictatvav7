import { useMemo } from "react";
import { Link, useParams, useSearch } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Clock, IndianRupee, Calendar, ShoppingBag, ChevronRight, MapPin } from "lucide-react";
import PageSeo from "@/components/PageSeo";
import { sanitizeHtml } from "@/lib/sanitize-html";

interface PujaListItem {
  id: number;
  slug: string;
  name: string;
  deity: string;
  category: string;
  shortDescription: string;
  difficulty: string | null;
  estimatedCost: string | null;
  durationMinutes: number | null;
}
interface PujaDetailFields extends PujaListItem {
  whyPerformed: string;
  storyMyth: string;
  howCelebrated: string;
  ethics: string;
  benefits: string;
  requirements: Array<{ item: string; qty: string; note?: string }>;
  faq: Array<{ q: string; a: string }>;
  metaTitle: string | null;
  metaDescription: string | null;
  bookingShopUrl: string | null;
  bookingShopLabel: string | null;
}
interface MuhuratEntry { date: string; tithi?: string; time?: string; note?: string; muhuratLabel?: string }
interface PujaDetailResponse {
  puja: PujaDetailFields;
  muhurats: Array<{ year: number; muhurats: MuhuratEntry[] }>;
  questions?: Array<{ id: number; slug: string; title: string }>;
}

const CATEGORY_LABELS: Record<string, string> = {
  deity: "Deity worship",
  occasion: "Occasions & festivals",
  remedial: "Remedial pujas",
  samskara: "Samskaras",
};

export default function PujaGuidePage() {
  const params = useParams<{ slug?: string }>();
  if (params.slug) return <PujaDetailView slug={params.slug} />;
  return <PujaGuideHub />;
}

function PujaGuideHub() {
  const { data: pujas = [], isLoading } = useQuery<PujaListItem[]>({
    queryKey: ["/api/pujas"],
    queryFn: () => fetch("/api/pujas").then((r) => r.json()),
  });

  const grouped = useMemo(() => {
    const out: Record<string, PujaListItem[]> = {};
    pujas.forEach((p) => {
      const k = p.category || "deity";
      if (!out[k]) out[k] = [];
      out[k].push(p);
    });
    return out;
  }, [pujas]);

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <PageSeo
        canonical="/puja-guide"
        title="Puja Guide — Vidhi, Samagri, Muhurats for Every Major Hindu Puja"
        description="Authentic guide to Hindu pujas — Satyanarayan, Rudrabhishek, Lakshmi, Navagraha, Griha Pravesh and more. Vidhi, story, samagri checklist, and yearly muhurats."
      />
      <div className="max-w-6xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center space-y-4 mb-12">
          <Badge className="bg-[#6D2B35] text-white">Puja library</Badge>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#6D2B35]" data-testid="heading-puja-guide">
            Authentic Guide to Hindu Pujas
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Each guide includes the story, vidhi, samagri checklist, ethics, and auspicious dates for the year — sourced from practising pandits.
          </p>
        </div>

        {isLoading && <p className="text-center text-muted-foreground py-10">Loading pujas…</p>}

        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="mb-10">
            <h2 className="text-xl md:text-2xl font-serif font-bold text-[#6D2B35] mb-4">
              {CATEGORY_LABELS[cat] || cat}
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {items.map((p) => (
                <Link key={p.id} href={`/puja-guide/${p.slug}`}>
                  <Card className="hover-elevate cursor-pointer h-full" data-testid={`card-puja-${p.slug}`}>
                    <CardContent className="pt-6 space-y-3">
                      <div className="flex flex-row items-center gap-2 flex-wrap">
                        {p.difficulty && <Badge variant="outline" className="text-xs capitalize">{p.difficulty}</Badge>}
                        {p.durationMinutes && <Badge variant="secondary" className="text-xs"><Clock className="w-3 h-3 mr-1" />{p.durationMinutes} min</Badge>}
                      </div>
                      <h3 className="font-serif font-bold text-[#6D2B35] text-lg leading-tight">{p.name}</h3>
                      <p className="text-xs text-[#D4AF37] uppercase tracking-wider">{p.deity}</p>
                      <p className="text-sm text-muted-foreground line-clamp-3">{p.shortDescription}</p>
                      <div className="flex flex-row items-center justify-between gap-2 flex-wrap pt-2 border-t border-[#E8DCC4]">
                        {p.estimatedCost && <span className="text-xs text-muted-foreground"><IndianRupee className="w-3 h-3 inline -mt-0.5" />{p.estimatedCost.replace(/₹/g, "")}</span>}
                        <span className="text-xs text-[#6D2B35] font-semibold inline-flex items-center">Read guide<ChevronRight className="w-3 h-3" /></span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PujaDetailView({ slug }: { slug: string }) {
  const search = new URLSearchParams(useSearch());
  const requestedMode = search.get("mode");
  const preferredMode = requestedMode === "online" || requestedMode === "offline"
    ? requestedMode
    : undefined;
  const { data, isLoading } = useQuery<PujaDetailResponse>({
    queryKey: ["/api/pujas", slug],
    queryFn: () => fetch(`/api/pujas/${encodeURIComponent(slug)}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  const muhuratsByYear = useMemo(() => {
    const out: Record<number, MuhuratEntry[]> = {};
    if (!data?.muhurats) return out;
    const today = new Date().toISOString().slice(0, 10);
    data.muhurats.forEach((group) => {
      const list = Array.isArray(group.muhurats) ? group.muhurats.filter((item) => item.date >= today) : [];
      if (list.length === 0) return;
      if (!out[group.year]) out[group.year] = [];
      out[group.year].push(...list);
    });
    Object.values(out).forEach((arr) =>
      arr.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    );
    return out;
  }, [data]);

  if (isLoading) return <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  if (!data?.puja) return <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center"><p className="text-muted-foreground">Puja not found.</p></div>;

  const puja = data.puja;
  const years = Object.keys(muhuratsByYear).map(Number).sort();

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <PageSeo
        canonical={`/puja-guide/${slug}`}
        title={puja.metaTitle || `${puja.name} — Vidhi, Muhurat | Vedic Tatva`}
        description={puja.metaDescription || puja.shortDescription}
      />
      <article className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <Link href="/puja-guide" className="inline-flex items-center gap-1 text-sm text-[#6D2B35] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />All pujas
        </Link>

        <div className="flex flex-row items-center gap-2 flex-wrap mb-3">
          <Badge variant="secondary" className="text-xs capitalize">{CATEGORY_LABELS[puja.category] || puja.category}</Badge>
          {puja.difficulty && <Badge variant="outline" className="text-xs capitalize">{puja.difficulty}</Badge>}
          {puja.durationMinutes && <Badge variant="outline" className="text-xs"><Clock className="w-3 h-3 mr-1" />{puja.durationMinutes} min</Badge>}
        </div>

        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#6D2B35] mb-2" data-testid="heading-puja">{puja.name}</h1>
        <p className="text-sm text-[#D4AF37] uppercase tracking-wider mb-4">{puja.deity}</p>
        <p className="text-lg text-muted-foreground mb-8 leading-relaxed">{puja.shortDescription}</p>

         <PujaActions puja={puja} mode={preferredMode} className="mb-8" />

        {years.length > 0 && (
          <Card className="mb-8 border-[#D4AF37]/40">
            <CardContent className="pt-6">
              <h2 className="text-xl font-serif font-bold text-[#6D2B35] mb-4 inline-flex items-center gap-2">
                <Calendar className="w-5 h-5" />Auspicious dates
              </h2>
              {years.map((year) => (
                <div key={year} className="mb-4 last:mb-0">
                  <p className="text-sm font-semibold text-[#6D2B35] mb-2">{year}</p>
                  <div className="grid sm:grid-cols-2 gap-2">
                    {muhuratsByYear[year]!.slice(0, 12).map((m, i) => (
                      <div key={i} className="text-sm border border-[#E8DCC4] rounded-md p-2.5" data-testid={`muhurat-${year}-${i}`}>
                        <p className="font-semibold text-[#6D2B35]">
                          {new Date(m.date).toLocaleDateString("en-IN", { day: "numeric", month: "long", weekday: "short" })}
                        </p>
                        {(m.muhuratLabel || m.tithi || m.note) && (
                          <p className="text-xs text-muted-foreground">{m.muhuratLabel || m.tithi || m.note}</p>
                        )}
                        {m.time && <p className="text-xs text-muted-foreground">{m.time}</p>}
                        <Link href={`/book-pandit-online?${new URLSearchParams({ service: puja.name, pujaSlug: slug, date: m.date, ...(m.time ? { muhurat: m.time } : {}), ...(preferredMode ? { mode: preferredMode } : {}), source: "puja-guide" })}`} className="mt-2 inline-flex min-h-8 items-center text-xs font-semibold text-[#6D2B35] underline underline-offset-4">
                          Match eligible Pandits
                        </Link>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        {years.length === 0 && (
          <Card className="mb-8 border-[#D4AF37]/40 bg-[#FFFBF0]">
            <CardContent className="pt-6">
              <h2 className="text-xl font-serif font-bold text-[#6D2B35] inline-flex items-center gap-2"><Calendar className="w-5 h-5" />Auspicious dates</h2>
              <p className="mt-2 text-sm text-muted-foreground">No upcoming catalogue-reviewed Muhurat window is available for this Puja. We will not suggest an unreviewed date.</p>
            </CardContent>
          </Card>
        )}

        {puja.whyPerformed && <Section title="Why this puja is performed" html={puja.whyPerformed} />}
        {puja.storyMyth && <Section title="The story behind it" html={puja.storyMyth} />}
        {puja.howCelebrated && <Section title="How it is celebrated" html={puja.howCelebrated} />}
        {puja.ethics && <Section title="Do's & don'ts" html={puja.ethics} />}

        {puja.requirements && puja.requirements.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-serif font-bold text-[#6D2B35] mb-3">Samagri checklist</h2>
            <Card>
              <CardContent className="pt-6">
                <ul className="space-y-2">
                  {puja.requirements.map((r, i) => (
                    <li key={i} className="flex flex-row items-start gap-2 text-sm border-b border-[#E8DCC4] pb-2 last:border-b-0 last:pb-0">
                      <span className="font-semibold text-[#6D2B35] flex-1">{r.item}</span>
                      <span className="text-muted-foreground whitespace-nowrap">{r.qty}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>
        )}

        {puja.benefits && (
          <div className="mb-8">
            <h2 className="text-xl font-serif font-bold text-[#6D2B35] mb-3">Benefits</h2>
            <p className="text-base text-foreground leading-relaxed">{puja.benefits}</p>
          </div>
        )}

        {puja.faq && puja.faq.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-serif font-bold text-[#6D2B35] mb-3">Frequently asked</h2>
            <div className="space-y-3">
              {puja.faq.map((f, i) => (
                <Card key={i} data-testid={`faq-${i}`}>
                  <CardContent className="pt-6">
                    <p className="font-semibold text-[#6D2B35] mb-2">{f.q}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

         <Card className="border-[#D4AF37]/40 bg-[#FFFBF0]">
           <CardContent className="pt-6 text-center">
             <p className="text-base text-foreground mb-4">Ready to take the next step?</p>
             <PujaActions puja={puja} mode={preferredMode} centered />
           </CardContent>
         </Card>
      </article>
    </div>
  );
}

function PujaActions({ puja, mode, className = "", centered = false }: { puja: PujaDetailFields; mode?: "online" | "offline"; className?: string; centered?: boolean }) {
  const params = new URLSearchParams({ service: puja.name });
  if (mode) params.set("mode", mode);
  const panditQuery = params.toString();
  return (
    <div className={`flex flex-wrap gap-3 ${centered ? "justify-center" : ""} ${className}`}>
      <Link href={`/book-pandit-online?${panditQuery}`} className="inline-flex min-h-11 items-center rounded-md bg-[#6D2B35] px-4 text-sm font-semibold text-white hover:bg-[#54212a]" data-testid={centered ? "button-book-puja-final" : "button-book-puja"}>
        <MapPin className="mr-2 h-4 w-4" />Choose a Pandit to book
      </Link>
      {puja.bookingShopUrl && puja.bookingShopLabel && (
        <a href={puja.bookingShopUrl} className="inline-flex min-h-11 items-center rounded-md border border-[#D4AF37]/60 px-4 text-sm font-semibold text-[#6D2B35] hover:bg-[#F5EBDD]" data-testid="button-cta-puja">
          <ShoppingBag className="mr-2 h-4 w-4" />{puja.bookingShopLabel}
        </a>
      )}
    </div>
  );
}

function Section({ title, html }: { title: string; html: string }) {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-serif font-bold text-[#6D2B35] mb-3">{title}</h2>
      <div className="prose prose-base max-w-none text-foreground prose-p:leading-relaxed prose-strong:text-[#6D2B35]" dangerouslySetInnerHTML={{ __html: sanitizeHtml(html) }} />
    </div>
  );
}
