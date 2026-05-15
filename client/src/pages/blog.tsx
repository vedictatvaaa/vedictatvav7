import { useState, useMemo } from "react";
import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Clock, ArrowRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";
import PageSeo from "@/components/PageSeo";
import { blogListing } from "@/lib/seo-schemas";

export default function Blog() {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then(r => r.json()),
  });

  const [activeCategory, setActiveCategory] = useState<string>("All");

  const categories = useMemo(() => {
    if (!posts) return [];
    const set = new Set<string>();
    posts.forEach((p) => { if (p.category) set.add(p.category); });
    return ["All", ...Array.from(set).sort()];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    if (!posts) return [];
    return activeCategory === "All" ? posts : posts.filter((p) => p.category === activeCategory);
  }, [posts, activeCategory]);

  const featured = activeCategory === "All" ? filteredPosts[0] : undefined;
  const rest = activeCategory === "All" ? filteredPosts.slice(1) : filteredPosts;

  return (
    <div className="w-full pb-20 bg-[#FBF7EE]" data-testid="page-blog">
      <PageSeo
        title="Vedic Tatva Journal — Puja Guides, Sambrani & Cow Dung Wisdom"
        description="Sacred wisdom for daily life — puja guides, sambrani science, cow-dung benefits, dhoop traditions written by Vedic scholars, distilled for modern devotees."
        canonical="/blog"
        ogType="website"
        twitterCard="summary_large_image"
        schemas={
          posts && posts.length > 0
            ? [blogListing(posts.slice(0, 10).map((p) => ({ title: p.title, url: `/blog/${p.slug}` })))]
            : []
        }
      />
      <div className="bg-gradient-to-b from-[#6D2B35] to-[#5A1F2A] text-white py-14 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[11px] uppercase tracking-[0.2em] mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span>Vedic Tatva Journal</span>
          </div>
          <h1 className="text-3xl md:text-5xl font-serif font-bold mb-3" data-testid="text-blog-heading">
            Sacred Wisdom for Daily Life
          </h1>
          <p className="text-white/80 max-w-2xl mx-auto text-base md:text-lg">
            Puja guides, sambrani science, cow-dung benefits, dhoop traditions — written by Vedic scholars,
            distilled for modern devotees.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-10">
        {!isLoading && categories.length > 1 && (
          <div className="flex flex-wrap items-center gap-2 mb-8" data-testid="filter-categories">
            {categories.map((cat) => {
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setActiveCategory(cat)}
                  className={`inline-flex items-center h-8 px-3.5 rounded-full text-[12px] font-semibold transition-colors ${
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
            {[0, 1, 2].map(i => (
              <div key={i} className="bg-white rounded-md h-72 animate-pulse" data-testid={`skeleton-blog-${i}`} />
            ))}
          </div>
        )}

        {!isLoading && featured && (
          <Link href={`/blog/${featured.slug}`}>
            <Card className="overflow-hidden hover-elevate cursor-pointer mb-10" data-testid={`card-blog-featured-${featured.slug}`}>
              <div className="grid md:grid-cols-2 gap-0">
                {featured.coverImage && (
                  <div className="h-64 md:h-auto bg-[#F5EFE0] overflow-hidden">
                    <img src={featured.coverImage} alt={featured.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <div className="p-6 md:p-10 flex flex-col justify-center">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge>Featured</Badge>
                    {featured.category && <Badge variant="outline">{featured.category}</Badge>}
                  </div>
                  <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#6D2B35] mb-3 leading-tight">
                    {featured.title}
                  </h2>
                  <p className="text-[#5a4a3a] mb-4 line-clamp-3">{featured.excerpt}</p>
                  <div className="flex items-center gap-4 text-xs text-[#5a4a3a]/70">
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> {featured.readMinutes || 5} min read</span>
                    <span className="flex items-center gap-1.5">By {featured.authorName}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-5 text-sm font-semibold text-[#6D2B35]">
                    Read article <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            </Card>
          </Link>
        )}

        {!isLoading && rest.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6" data-testid="grid-blog-posts">
            {rest.map(post => (
              <Link key={post.id} href={`/blog/${post.slug}`}>
                <Card className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-blog-${post.slug}`}>
                  {post.coverImage && (
                    <div className="h-44 bg-[#F5EFE0] overflow-hidden">
                      <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div className="p-5 flex flex-col flex-1">
                    {post.category && <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-semibold mb-1.5">{post.category}</span>}
                    <h3 className="text-base font-serif font-bold text-[#6D2B35] mb-2 leading-snug line-clamp-2">{post.title}</h3>
                    <p className="text-xs text-[#5a4a3a] mb-3 line-clamp-2">{post.excerpt}</p>
                    <div className="mt-auto flex items-center gap-3 text-[11px] text-[#5a4a3a]/70">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {post.readMinutes || 5} min</span>
                    </div>
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {!isLoading && (!posts || posts.length === 0) && (
          <div className="text-center py-20 text-[#5a4a3a]" data-testid="text-blog-empty">
            No articles yet. Check back soon for sacred wisdom.
          </div>
        )}
      </div>
    </div>
  );
}
