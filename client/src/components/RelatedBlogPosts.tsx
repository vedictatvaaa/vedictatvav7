import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { BookOpen, Clock, ChevronRight } from "lucide-react";
import type { BlogPost } from "@shared/schema";

interface RelatedBlogPostsProps {
  category?: string | null;
  productName?: string | null;
  limit?: number;
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  "sambrani": ["sambrani"],
  "sambrani-cups": ["sambrani"],
  "dhoop": ["dhoop", "loban", "guggal"],
  "loban-dhoop": ["loban"],
  "guggal-dhoop": ["guggal"],
  "agarbatti": ["agarbatti", "incense"],
  "incense-sticks": ["agarbatti", "incense"],
  "rudraksha": ["rudraksha", "mukhi"],
  "puja-samagri": ["puja", "vidhi"],
  "havan-samagri": ["hawan", "guggal", "yagna"],
  "cow-dung-products": ["cow dung", "gobar", "panchgavya"],
  "gobar-products": ["cow dung", "gobar"],
  "idols": ["puja"],
  "brass-copperware": ["puja"],
  "wearables": ["rudraksha", "mukhi"],
  "dhoti-kurta": ["puja"],
  "pind-daan": ["pind", "shradh", "shraadh", "pitru", "tarpan", "tripindi", "moksha", "ancestor", "gaya", "kashi", "haridwar"],
  "pind-daan-gaya": ["pind", "gaya", "phalgu", "vishnupad", "akshayavat", "shradh", "pitru"],
  "pind-daan-kashi": ["pind", "kashi", "varanasi", "manikarnika", "pishachmochan", "shradh", "pitru"],
  "pind-daan-haridwar": ["pind", "haridwar", "har ki pauri", "narayani shila", "daksh", "shradh", "pitru"],
};

function findKeywordsForProduct(category?: string | null, productName?: string | null): string[] {
  const slugCat = (category || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  if (CATEGORY_KEYWORDS[slugCat]) return CATEGORY_KEYWORDS[slugCat];
  for (const [slug, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (slugCat.includes(slug) || slug.includes(slugCat)) return kws;
  }
  const name = (productName || "").toLowerCase();
  for (const [slug, kws] of Object.entries(CATEGORY_KEYWORDS)) {
    if (kws.some(kw => name.includes(kw))) return kws;
  }
  return [];
}

export default function RelatedBlogPosts({ category, productName, limit = 3 }: RelatedBlogPostsProps) {
  const { data: posts, isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then(r => r.json()),
    staleTime: 10 * 60 * 1000,
  });

  if (isLoading || !posts || posts.length === 0) return null;

  const keywords = findKeywordsForProduct(category, productName);
  let matched = posts;
  if (keywords.length > 0) {
    matched = posts.filter(p => {
      const haystack = `${p.title} ${p.excerpt || ""} ${(p.tags || []).join(" ")} ${p.category || ""}`.toLowerCase();
      return keywords.some(kw => haystack.includes(kw));
    });
  }
  if (matched.length < limit) {
    const seen = new Set(matched.map(p => p.id));
    for (const p of posts) {
      if (matched.length >= limit) break;
      if (!seen.has(p.id)) matched.push(p);
    }
  }
  matched = matched.slice(0, limit);
  if (matched.length === 0) return null;

  return (
    <section className="mt-14" data-testid="section-related-blog-posts">
      <div className="flex items-end justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <BookOpen className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold">From the Journal</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif text-[#6D2B35]" data-testid="text-related-blog-heading">
            Read Before You Buy
          </h2>
        </div>
        <Link href="/blog" className="text-xs sm:text-sm text-[#6D2B35] hover:underline font-semibold flex items-center gap-1" data-testid="link-all-blog">
          All articles <ChevronRight className="h-3 w-3" />
        </Link>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {matched.map(post => (
          <Link key={post.id} href={`/blog/${post.slug}`}>
            <Card className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-related-blog-${post.slug}`}>
              {post.coverImage && (
                <div className="h-32 bg-[#F5EFE0] overflow-hidden">
                  <img src={post.coverImage} alt={post.title} loading="lazy" className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-4 flex flex-col flex-1">
                {post.category && (
                  <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-semibold mb-1">{post.category}</span>
                )}
                <h3 className="text-sm font-serif font-bold text-[#6D2B35] leading-snug line-clamp-2">{post.title}</h3>
                <div className="mt-auto flex items-center gap-1.5 pt-3 text-[11px] text-[#5a4a3a]/70">
                  <Clock className="w-3 h-3" /> {post.readMinutes || 5} min read
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </section>
  );
}
