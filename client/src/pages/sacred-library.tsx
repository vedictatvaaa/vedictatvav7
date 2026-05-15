import { useState, useMemo, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useRoute } from "wouter";
import PageSeo from "@/components/PageSeo";
import { breadcrumbList, abs } from "@/lib/seo-schemas";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Music, ArrowLeft, Type, Languages, Eye, EyeOff, ChevronUp, ChevronDown, Search } from "lucide-react";

const MAROON = "#6D2B35";
const GOLD = "#D4AF37";
const BEIGE = "#FBF7EE";
const BORDER = "#E8DCC4";

interface SacredTextLite {
  id: number;
  slug: string;
  title: string;
  deity: string;
  textType: string;
  language: string;
  excerpt?: string | null;
  coverImage?: string | null;
  audioUrl?: string | null;
  verseCount?: number | null;
  durationSeconds?: number | null;
  viewCount?: number | null;
  tags?: string[] | null;
}

function toHashtag(tag: string): string {
  const cleaned = tag.replace(/[^A-Za-z0-9\u0900-\u097F]+/g, "");
  return cleaned ? `#${cleaned}` : "";
}

interface SacredText extends SacredTextLite {
  lyrics: string;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[] | null;
}

interface DeityCount {
  deity: string;
  count: number;
}

const TYPE_LABEL: Record<string, string> = {
  chalisa: "Chalisa",
  mantra: "Mantra",
  katha: "Katha",
  aarti: "Aarti",
  stotra: "Stotra",
  book: "Book",
};

export default function SacredLibraryPage() {
  const [, params] = useRoute("/sacred-library/:slug");
  const slug = params?.slug;
  if (slug) return <Reader slug={slug} />;
  return <Catalog />;
}

function Catalog() {
  const [deity, setDeity] = useState<string>("all");
  const [type, setType] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    const t = new URLSearchParams(window.location.search).get("tag");
    return t || null;
  });

  const qc = useQueryClient();
  const deitiesQuery = useQuery<DeityCount[]>({
    queryKey: ["/api/sacred-texts/deities"],
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const prefetchText = (slug: string) => {
    qc.prefetchQuery({
      queryKey: ["/api/sacred-texts", slug],
      queryFn: async () => {
        const r = await fetch(`/api/sacred-texts/${slug}?prefetch=1`);
        if (!r.ok) throw new Error("Not found");
        return r.json();
      },
      staleTime: 10 * 60 * 1000,
    });
  };

  const listQuery = useQuery<SacredTextLite[]>({
    queryKey: ["/api/sacred-texts", deity, type],
    queryFn: async () => {
      const qs = new URLSearchParams();
      if (deity !== "all") qs.set("deity", deity);
      if (type !== "all") qs.set("type", type);
      const res = await fetch(`/api/sacred-texts?${qs.toString()}`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const allTags = useMemo(() => {
    const set = new Map<string, number>();
    (listQuery.data || []).forEach((t) => (t.tags || []).forEach((tag) => {
      const h = toHashtag(tag);
      if (h) set.set(h, (set.get(h) || 0) + 1);
    }));
    return Array.from(set.entries()).sort((a, b) => b[1] - a[1]).slice(0, 24).map(([h]) => h);
  }, [listQuery.data]);

  const items = useMemo(() => {
    let all = listQuery.data || [];
    if (activeTag) {
      all = all.filter((t) => (t.tags || []).some((tag) => toHashtag(tag) === activeTag));
    }
    if (!search.trim()) return all;
    const q = search.toLowerCase();
    return all.filter((t) =>
      t.title.toLowerCase().includes(q) ||
      t.deity.toLowerCase().includes(q) ||
      (t.tags || []).some((tag) => tag.toLowerCase().includes(q))
    );
  }, [listQuery.data, search, activeTag]);

  const seoTitle = "Sacred Library — Chalisas, Mantras, Aartis, Kathas, Stotras | Vedic Tatva";
  const seoDesc = "Read every Hindu Chalisa, Mantra, Aarti, Katha and Stotra with Devanagari script, transliteration, English meaning and Pandit-narrated audio. Free Kindle-style sacred reader from Vedic Tatva.";
  const itemListSchema = useMemo(() => {
    const data = (listQuery.data || []).slice(0, 30);
    if (data.length === 0) return null;
    return {
      id: "sacred-library-list",
      payload: {
        "@context": "https://schema.org",
        "@type": "ItemList",
        name: "Sacred Library — Chalisas, Mantras, Aartis, Kathas, Stotras",
        numberOfItems: data.length,
        itemListElement: data.map((t, i) => ({
          "@type": "ListItem",
          position: i + 1,
          name: t.title,
          url: abs(`/sacred-library/${t.slug}`),
        })),
      },
    };
  }, [listQuery.data]);
  const collectionSchema = {
    id: "sacred-library-collection",
    payload: {
      "@context": "https://schema.org",
      "@type": "CollectionPage",
      name: seoTitle,
      description: seoDesc,
      url: abs("/sacred-library"),
      isPartOf: { "@type": "WebSite", name: "Vedic Tatva", url: abs("/") },
      inLanguage: ["en-IN", "hi-IN"],
    },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BEIGE }}>
      <PageSeo
        title={seoTitle}
        description={seoDesc}
        keywords="hindu chalisa, hanuman chalisa lyrics, sanskrit mantra meaning, aarti pdf, durga stotra, ram katha, vedic library online"
        canonical="/sacred-library"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbList([
            { name: "Home", url: abs("/") },
            { name: "Sacred Library", url: abs("/sacred-library") },
          ]),
          collectionSchema,
          itemListSchema,
        ]}
      />
      <header className="py-12 px-4 text-center border-b" style={{ borderColor: BORDER }}>
        <h1 className="font-serif text-4xl md:text-5xl font-bold mb-3" style={{ color: MAROON }}>
          Sacred Library
        </h1>
        <p className="max-w-2xl mx-auto text-base text-muted-foreground">
          Read, listen and meditate with chalisas, mantras, kathas, aartis and stotras for every god and goddess. Like a Kindle for sacred Hindu texts.
        </p>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        <div className="flex flex-row items-center gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by title or deity…"
              className="pl-9"
              data-testid="input-library-search"
            />
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Filter by deity</h2>
          <div className="flex flex-row flex-wrap gap-2">
            <Button
              size="sm"
              variant={deity === "all" ? "default" : "outline"}
              onClick={() => setDeity("all")}
              style={deity === "all" ? { backgroundColor: MAROON, color: BEIGE } : { borderColor: BORDER }}
              data-testid="button-deity-all"
            >
              All deities
            </Button>
            {(deitiesQuery.data || []).map((d) => (
              <Button
                key={d.deity}
                size="sm"
                variant={deity === d.deity ? "default" : "outline"}
                onClick={() => setDeity(d.deity)}
                style={deity === d.deity ? { backgroundColor: MAROON, color: BEIGE } : { borderColor: BORDER }}
                data-testid={`button-deity-${d.deity.toLowerCase().replace(/\s+/g, "-")}`}
              >
                {d.deity} <span className="ml-1 opacity-60">{d.count}</span>
              </Button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Filter by type</h2>
          <div className="flex flex-row flex-wrap gap-2">
            <Button
              size="sm"
              variant={type === "all" ? "default" : "outline"}
              onClick={() => setType("all")}
              style={type === "all" ? { backgroundColor: MAROON, color: BEIGE } : { borderColor: BORDER }}
              data-testid="button-type-all"
            >
              All
            </Button>
            {Object.entries(TYPE_LABEL).map(([k, v]) => (
              <Button
                key={k}
                size="sm"
                variant={type === k ? "default" : "outline"}
                onClick={() => setType(k)}
                style={type === k ? { backgroundColor: MAROON, color: BEIGE } : { borderColor: BORDER }}
                data-testid={`button-type-${k}`}
              >
                {v}
              </Button>
            ))}
          </div>

          {allTags.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="text-xs uppercase tracking-wide text-muted-foreground mr-1">Hashtags</span>
              {activeTag && (
                <button
                  type="button"
                  onClick={() => setActiveTag(null)}
                  className="text-xs px-2 py-1 rounded-md border hover-elevate"
                  style={{ borderColor: BORDER, color: MAROON }}
                  data-testid="button-clear-tag"
                >
                  Clear {activeTag}
                </button>
              )}
              {allTags.map((h) => (
                <button
                  key={h}
                  type="button"
                  onClick={() => setActiveTag(activeTag === h ? null : h)}
                  className="text-xs px-2 py-1 rounded-md hover-elevate"
                  style={
                    activeTag === h
                      ? { backgroundColor: MAROON, color: BEIGE }
                      : { color: MAROON, backgroundColor: "rgba(212,175,55,0.12)" }
                  }
                  data-testid={`filter-tag-${h.slice(1)}`}
                >
                  {h}
                </button>
              ))}
            </div>
          )}
        </div>

        {listQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!listQuery.isLoading && items.length === 0 && (
          <Card style={{ borderColor: BORDER }}>
            <CardContent className="p-10 text-center text-muted-foreground">
              <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
              <p className="text-sm">No texts published yet for this filter. Please check back soon.</p>
            </CardContent>
          </Card>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((t) => (
            <Link key={t.id} href={`/sacred-library/${t.slug}`}>
              <Card
                className="h-full cursor-pointer hover-elevate"
                style={{ borderColor: BORDER, backgroundColor: "#fff" }}
                data-testid={`card-text-${t.slug}`}
                onMouseEnter={() => prefetchText(t.slug)}
                onTouchStart={() => prefetchText(t.slug)}
              >
                <CardContent className="p-5 space-y-3">
                  <div className="flex items-start justify-between gap-2 flex-wrap">
                    <Badge variant="outline" style={{ borderColor: GOLD, color: MAROON }}>{t.deity}</Badge>
                    <Badge variant="outline">{TYPE_LABEL[t.textType] || t.textType}</Badge>
                  </div>
                  <h3 className="font-serif text-lg font-bold leading-snug" style={{ color: MAROON }}>
                    {t.title}
                  </h3>
                  {t.excerpt && <p className="text-sm text-muted-foreground line-clamp-3">{t.excerpt}</p>}
                  {t.tags && t.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {t.tags.slice(0, 5).map((tag, i) => {
                        const h = toHashtag(tag);
                        if (!h) return null;
                        return (
                          <button
                            key={`${h}-${i}`}
                            type="button"
                            onClick={(e) => { e.preventDefault(); e.stopPropagation(); setActiveTag(activeTag === h ? null : h); }}
                            className="text-xs px-1.5 py-0.5 rounded-md hover-elevate"
                            style={{ color: MAROON, backgroundColor: "rgba(212,175,55,0.12)" }}
                            data-testid={`tag-${h.slice(1)}-${t.id}`}
                          >
                            {h}
                          </button>
                        );
                      })}
                    </div>
                  )}
                  <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1 border-t" style={{ borderColor: BORDER }}>
                    {t.verseCount ? <span>{t.verseCount} verses</span> : null}
                    {t.audioUrl ? <span className="flex items-center gap-1"><Music className="w-3 h-3" />Audio</span> : null}
                    <span className="ml-auto flex items-center gap-1"><BookOpen className="w-3 h-3" />Read</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

type ScriptMode = "all" | "lyrics" | "transliteration" | "translation";

function Reader({ slug }: { slug: string }) {
  const textQuery = useQuery<SacredText>({
    queryKey: ["/api/sacred-texts", slug],
    queryFn: async () => {
      const res = await fetch(`/api/sacred-texts/${slug}`);
      if (!res.ok) throw new Error("Not found");
      return res.json();
    },
    staleTime: 10 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const [fontSize, setFontSize] = useState<number>(() => {
    if (typeof window === "undefined") return 20;
    return parseInt(window.localStorage.getItem("sl-font-size") || "20") || 20;
  });
  const [scriptMode, setScriptMode] = useState<ScriptMode>(() => {
    if (typeof window === "undefined") return "all";
    return (window.localStorage.getItem("sl-script-mode") as ScriptMode) || "all";
  });

  useEffect(() => { window.localStorage.setItem("sl-font-size", String(fontSize)); }, [fontSize]);
  useEffect(() => { window.localStorage.setItem("sl-script-mode", scriptMode); }, [scriptMode]);


  const verses = useMemo(() => {
    const t = textQuery.data;
    if (!t) return [] as Array<{ lyric: string; trans?: string; mean?: string }>;
    const lyrics = t.lyrics.split(/\n+/).filter(Boolean);
    const trans = (t.transliteration || "").split(/\n+/).filter(Boolean);
    const mean = (t.translation || "").split(/\n+/).filter(Boolean);
    return lyrics.map((l, i) => ({ lyric: l, trans: trans[i], mean: mean[i] }));
  }, [textQuery.data]);

  if (textQuery.isLoading) {
    return <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: BEIGE }}><p className="text-muted-foreground">Loading…</p></div>;
  }
  if (!textQuery.data) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4" style={{ backgroundColor: BEIGE }}>
        <p className="text-muted-foreground">This sacred text could not be found.</p>
        <Link href="/sacred-library"><Button variant="outline">Back to library</Button></Link>
      </div>
    );
  }
  const t = textQuery.data;

  const showLyrics = scriptMode === "all" || scriptMode === "lyrics";
  const showTrans = (scriptMode === "all" || scriptMode === "transliteration") && !!t.transliteration;
  const showMean = (scriptMode === "all" || scriptMode === "translation") && !!t.translation;

  const seoTitle = t.metaTitle || `${t.title} — Lyrics, Meaning & Audio | Vedic Tatva`;
  const seoDesc = t.metaDescription
    || t.excerpt
    || `Read the full ${t.title} (${TYPE_LABEL[t.textType] || t.textType} of ${t.deity}) in Devanagari with English transliteration, meaning and Pandit-narrated audio. Free on Vedic Tatva.`;
  const creativeWorkSchema = {
    id: "sacred-text",
    payload: {
      "@context": "https://schema.org",
      "@type": "CreativeWork",
      name: t.title,
      headline: t.title,
      description: seoDesc,
      url: abs(`/sacred-library/${t.slug}`),
      inLanguage: t.language || "sa",
      genre: TYPE_LABEL[t.textType] || t.textType,
      about: { "@type": "Thing", name: t.deity },
      ...(t.audioUrl
        ? {
            associatedMedia: {
              "@type": "AudioObject",
              contentUrl: t.audioUrl.startsWith("http") ? t.audioUrl : abs(t.audioUrl),
              encodingFormat: "audio/mpeg",
              name: `${t.title} — audio`,
            },
          }
        : {}),
      isPartOf: { "@type": "CollectionPage", name: "Vedic Tatva Sacred Library", url: abs("/sacred-library") },
      publisher: { "@type": "Organization", name: "Vedic Tatva", url: abs("/") },
      keywords: (t.tags || []).join(", ") || undefined,
    },
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: BEIGE }}>
      <PageSeo
        title={seoTitle}
        description={seoDesc}
        keywords={(t.tags || []).join(", ")}
        canonical={`/sacred-library/${t.slug}`}
        ogType="article"
        ogImage={t.coverImage || undefined}
        twitterCard="summary_large_image"
        schemas={[
          breadcrumbList([
            { name: "Home", url: abs("/") },
            { name: "Sacred Library", url: abs("/sacred-library") },
            { name: t.deity, url: abs(`/sacred-library?deity=${encodeURIComponent(t.deity)}`) },
            { name: t.title, url: abs(`/sacred-library/${t.slug}`) },
          ]),
          creativeWorkSchema,
        ]}
      />
      {/* Sticky reader controls */}
      <div className="sticky top-0 z-50 border-b backdrop-blur" style={{ borderColor: BORDER, backgroundColor: "rgba(251,247,238,0.95)" }}>
        <div className="max-w-3xl mx-auto px-4 py-3 flex flex-row items-center gap-2 flex-wrap">
          <Link href="/sacred-library">
            <Button size="sm" variant="ghost" data-testid="button-back-library">
              <ArrowLeft className="w-4 h-4 mr-1" />Library
            </Button>
          </Link>
          <div className="flex-1 min-w-[120px]">
            <p className="text-xs text-muted-foreground">{t.deity} · {TYPE_LABEL[t.textType] || t.textType}</p>
            <h1 className="font-serif font-bold text-base md:text-lg leading-tight truncate" style={{ color: MAROON }}>{t.title}</h1>
          </div>
          <div className="flex flex-row items-center gap-1">
            <Button size="icon" variant="outline" onClick={() => setFontSize((s) => Math.max(14, s - 2))} data-testid="button-font-down" title="Smaller text">
              <ChevronDown className="w-4 h-4" />
            </Button>
            <span className="text-xs text-muted-foreground tabular-nums w-8 text-center"><Type className="w-3 h-3 inline" />{fontSize}</span>
            <Button size="icon" variant="outline" onClick={() => setFontSize((s) => Math.min(36, s + 2))} data-testid="button-font-up" title="Larger text">
              <ChevronUp className="w-4 h-4" />
            </Button>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              const all: ScriptMode[] = ["all", "lyrics", "transliteration", "translation"];
              const available = all.filter((m) => {
                if (m === "all" || m === "lyrics") return true;
                if (m === "transliteration") return !!t.transliteration;
                if (m === "translation") return !!t.translation;
                return false;
              });
              const idx = available.indexOf(scriptMode);
              setScriptMode(available[(idx + 1) % available.length]);
            }}
            data-testid="button-script-mode"
            title="Toggle script view"
          >
            <Languages className="w-4 h-4 mr-1" />
            {scriptMode === "all" ? "All scripts" : scriptMode}
          </Button>
        </div>
        {t.tags && t.tags.length > 0 && (
          <div className="max-w-3xl mx-auto px-4 pb-2 flex flex-wrap gap-1.5">
            {t.tags.map((tag, i) => {
              const h = toHashtag(tag);
              if (!h) return null;
              return (
                <Link key={`${h}-${i}`} href={`/sacred-library?tag=${encodeURIComponent(h)}`}>
                  <span
                    className="text-xs px-2 py-0.5 rounded-md hover-elevate inline-block cursor-pointer"
                    style={{ color: MAROON, backgroundColor: "rgba(212,175,55,0.12)" }}
                    data-testid={`reader-tag-${h.slice(1)}`}
                  >
                    {h}
                  </span>
                </Link>
              );
            })}
          </div>
        )}
        {t.audioUrl && (
          <div className="max-w-3xl mx-auto px-4 pb-3">
            <audio controls src={t.audioUrl} className="w-full h-10" data-testid="audio-player" />
          </div>
        )}
      </div>

      {/* Reader body */}
      <article className="max-w-3xl mx-auto px-4 py-10">
        {t.excerpt && <p className="text-base italic text-muted-foreground mb-6 text-center">{t.excerpt}</p>}

        <div className="space-y-6">
          {verses.map((v, i) => (
            <div key={i} className="space-y-1.5" data-testid={`verse-${i}`}>
              {showLyrics && (
                <p className="font-serif leading-relaxed" style={{ color: MAROON, fontSize: `${fontSize}px` }}>
                  {v.lyric}
                </p>
              )}
              {showTrans && v.trans && (
                <p className="italic text-foreground/80" style={{ fontSize: `${Math.max(13, fontSize - 4)}px` }}>
                  {v.trans}
                </p>
              )}
              {showMean && v.mean && (
                <p className="text-muted-foreground" style={{ fontSize: `${Math.max(13, fontSize - 5)}px` }}>
                  {v.mean}
                </p>
              )}
            </div>
          ))}
        </div>

        {t.meaning && (
          <div className="mt-12 pt-6 border-t" style={{ borderColor: BORDER }}>
            <h3 className="font-serif text-xl font-bold mb-2" style={{ color: MAROON }}>Meaning &amp; Phala</h3>
            <p className="text-base leading-relaxed text-foreground/80">{t.meaning}</p>
          </div>
        )}
      </article>
    </div>
  );
}
