import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { BookOpen, Clock, ArrowRight, Search, Sparkles } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import PageSeo from "@/components/PageSeo";
import { blogListing } from "@/lib/seo-schemas";

function Hashtags({ tags, max = 3 }: { tags: string[] | null | undefined; max?: number }) {
  if (!tags || tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.slice(0, max).map((t) => (
        <span
          key={t}
          className="text-[10px] font-semibold uppercase tracking-wider text-[#6D2B35] bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-full px-2 py-0.5"
        >
          {t.startsWith("#") ? t : `#${t}`}
        </span>
      ))}
    </div>
  );
}

export default function Blog() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then((r) => r.json()),
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const categories = useMemo(() => {
    if (!posts) return [];
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["All", ...Array.from(set).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (activeCategory !== "All" && p.category !== activeCategory) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        (p.excerpt || "").toLowerCase().includes(q) ||
        (p.tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [posts, activeCategory, search]);

  const showFeatured = activeCategory === "All" && !search;
  const featured = showFeatured ? filteredPosts[0] : undefined;
  const rest = showFeatured ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="w-full pb-20 bg-[#FBF7EE]" data-testid="page-blog">
      <PageSeo
        title="Vedic Tatva Journal — Puja Guides, Astrology & Daily Wisdom"
        description="Sacred wisdom for daily life — puja guides, panchang, astrology, festivals and spiritual remedies — written by Vedic scholars, distilled for modern devotees."
        canonical="/blog"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={
          posts && posts.length > 0
            ? [blogListing(posts.slice(0, 10).map((p) => ({ title: p.title, url: `/blog/${p.slug}` })))]
            : []
        }
      />

      {/* Hero */}
      <div className="bg-gradient-to-b from-[#6D2B35] to-[#5A1F2A] text-white py-16 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] uppercase tracking-[0.2em] mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vedic Tatva Journal</span>
          </div>
          <h1
            className="text-3xl md:text-5xl font-serif font-bold mb-3"
            data-testid="text-blog-heading"
          >
            Sacred Wisdom for Daily Life
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg mb-6">
            Puja guides, panchang timings, astrology insights, festival rituals and authentic spiritual
            remedies — curated by our editorial team.
          </p>

          <div className="max-w-xl mx-auto relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6D2B35]" />
            <Input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search articles, hashtags, topics..."
              className="pl-10 h-11 bg-white text-[#3a2c20] border-0 rounded-full shadow-sm focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
              data-testid="input-blog-search"
            />
          </div>

          {posts && posts.length > 0 && (
            <p className="text-white/60 text-xs mt-4 inline-flex items-center gap-1.5">
              <Sparkles className="w-3 h-3" />
              {posts.length} articles · refreshed daily
            </p>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10">
        {/* Category pills */}
        {!isLoading && categories.length > 1 && (
          <div
            className="flex flex-wrap items-center gap-2 mb-8"
            data-testid="filter-categories"
          >
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center h-9 px-4 rounded-full text-[12px] font-semibold transition-colors ${
                    isActive
                      ? "bg-[#6D2B35] text-[#D4AF37] border border-[#6D2B35]"
                      : "bg-white text-[#5a4a3a] border border-[#D4AF37]/30 hover:border-[#D4AF37]/55 hover:bg-[#FBF7EE]"
                  }`}
                  data-testid={`btn-category-${cat.toLowerCase().replace(/\s+/g, "-")}`}
                  aria-pressed={isActive}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        )}

        {isLoading && (
          <div className="grid md:grid-cols-3 gap-6">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div
                key={i}
                className="bg-white rounded-md h-72 animate-pulse"
                data-testid={`skeleton-blog-${i}`}
              />
            ))}
          </div>
        )}

        {/* Featured (only on default view) */}
        {!isLoading && featured && (
          <Link href={`/blog/${featured.slug}`}>
            <Card
              className="overflow-hidden hover-elevate cursor-pointer mb-10"
              data-testid={`card-blog-featured-${featured.slug}`}
            >
              <div className="grid md:grid-cols-2 gap-0">
                {featured.coverImage && (
                  <div className="h-64 md:h-auto bg-[#F5EFE0] overflow-hidden">
                    <img
                      src={featured.coverImage}
                      alt={featured.title}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
                <div className="p-6 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                    <Badge>Featured</Badge>
                    {featured.category && (
                      <Badge variant="outline">{featured.category}</Badge>
                    )}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#6D2B35] mb-3 leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-[#5a4a3a] mb-4 line-clamp-3">{featured.excerpt}</p>
                  <Hashtags tags={featured.tags as string[] | null} max={4} />
                  <div className="flex items-center gap-4 text-xs text-[#5a4a3a]/70 mt-4">
                    <span className="flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5" /> {featured.readMinutes || 5} min read
                    </span>
                    <span>By {featured.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-[#6D2B35]">
                    Read article <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {/* Grid */}
        {!isLoading && rest.length > 0 && (
          <div
            className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
            data-testid="grid-blog-posts"
          >
            {rest.map((post) => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card
                  className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col"
                  data-testid={`card-blog-${post.slug}`}
                >
                  {post.coverImage && (
                    <div className="h-44 bg-[#F5EFE0] overflow-hidden">
                      <img
                        src={post.coverImage}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1 gap-2">
                    {post.category && (
                      <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-semibold">
                        {post.category}
                      </span>
                    )}
                    <h3 className="text-base font-serif font-bold text-[#6D2B35] leading-snug line-clamp-2">
                      {post.title}
                    </h3>
                    <p className="text-xs text-[#5a4a3a] line-clamp-2">{post.excerpt}</p>
                    <Hashtags tags={post.tags as string[] | null} />
                    <div className="mt-auto pt-2 flex items-center gap-3 text-[11px] text-[#5a4a3a]/70">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {post.readMinutes || 5} min
                      </span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && filteredPosts.length === 0 && (
          <div
            className="text-center py-20 text-[#5a4a3a]"
            data-testid="text-blog-empty"
          >
            {search
              ? `No articles match "${search}". Try a different search.`
              : "No articles yet. Check back soon for sacred wisdom."}
          </div>
        )}
      </div>
    </div>
  );
}
