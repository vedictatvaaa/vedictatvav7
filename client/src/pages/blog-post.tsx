import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Clock, ShoppingBag, Share2, MessageCircle, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { BlogPost, Product } from "@shared/schema";
import { getProductUrl } from "@/lib/utils";
import { optImg } from "@/lib/optImg";
import PageSeo from "@/components/PageSeo";
import { blogPosting, abs } from "@/lib/seo-schemas";

export default function BlogPostPage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const { toast } = useToast();

  const { data: post, isLoading } = useQuery<BlogPost>({
    queryKey: ["/api/blog-posts/slug", slug],
    queryFn: () => fetch(`/api/blog-posts/slug/${encodeURIComponent(slug)}`).then(r => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  const { data: related } = useQuery<BlogPost[]>({
    queryKey: ["/api/blog-posts"],
    queryFn: () => fetch("/api/blog-posts").then(r => r.json()),
  });

  useEffect(() => {
    if (!post) return;
    // Fire-and-forget view increment
    fetch(`/api/blog-posts/slug/${encodeURIComponent(post.slug)}/view`, { method: "POST" }).catch(() => {});
  }, [post]);

  // Pull related products by category derived from the relatedShopUrl (e.g. /shop/sambrani-cups)
  const shopCategory = post?.relatedShopUrl?.match(/\/shop\/([^/?#]+)/)?.[1];
  const { data: shopProducts } = useQuery<Product[]>({
    queryKey: ["/api/products"],
    queryFn: () => fetch("/api/products").then(r => r.json()),
    enabled: !!shopCategory,
    staleTime: 10 * 60 * 1000,
  });
  const relatedProducts = (shopProducts || [])
    .filter(p => {
      if (!shopCategory) return false;
      const haystack = `${p.category || ""} ${p.name || ""} ${(p as any).tags || ""}`.toLowerCase();
      const needle = shopCategory.replace(/-/g, " ").toLowerCase();
      const tokens = needle.split(" ").filter(Boolean);
      return tokens.some(t => haystack.includes(t));
    })
    .slice(0, 4);

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try { await navigator.share({ title: post?.title, url }); } catch {}
    } else {
      try { await navigator.clipboard.writeText(url); toast({ title: "Link copied" }); } catch {}
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20" data-testid="loading-blog-post">
        <div className="h-8 bg-[#F5EFE0] rounded animate-pulse mb-4" />
        <div className="h-64 bg-[#F5EFE0] rounded animate-pulse mb-6" />
        <div className="space-y-3">
          {[0, 1, 2, 3, 4].map(i => <div key={i} className="h-4 bg-[#F5EFE0] rounded animate-pulse" />)}
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center" data-testid="text-blog-not-found">
        <h1 className="text-2xl font-serif font-bold text-[#6D2B35] mb-4">Article not found</h1>
        <Link href="/blog">
          <Button variant="outline" data-testid="link-back-to-blog">Back to Journal</Button>
        </Link>
      </div>
    );
  }

  const relatedPosts = (related || []).filter(p => p.slug !== post.slug).slice(0, 3);

  // Build TOC from H2 headings in the post body and inject stable ids onto each H2.
  const { tocItems, bodyWithIds } = useMemo(() => {
    const items: Array<{ id: string; text: string }> = [];
    const used = new Set<string>();
    const slugify = (s: string) =>
      s.toLowerCase().replace(/<[^>]+>/g, "").replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-").slice(0, 60) || "section";
    const html = (post.body || "").replace(/<h2(\s[^>]*)?>([\s\S]*?)<\/h2>/gi, (_m, attrs = "", inner) => {
      const text = String(inner).replace(/<[^>]+>/g, "").trim();
      // Reuse an existing id on the heading if present, so TOC anchors always resolve.
      const existing = String(attrs || "").match(/\sid=["']([^"']+)["']/i);
      let id: string;
      if (existing) {
        id = existing[1];
      } else {
        id = slugify(text);
        let n = 2;
        while (used.has(id)) { id = `${slugify(text)}-${n++}`; }
      }
      used.add(id);
      items.push({ id, text });
      return `<h2${existing ? attrs : `${attrs || ""} id="${id}"`}>${inner}</h2>`;
    });
    return { tocItems: items, bodyWithIds: html };
  }, [post.body]);

  return (
    <article className="w-full pb-20 bg-[#FBF7EE]" data-testid={`page-blog-post-${post.slug}`}>
      <PageSeo
        title={post.metaTitle || `${post.title} | Vedic Tatva`}
        description={post.metaDescription || post.excerpt || ""}
        keywords={post.metaKeywords || (post.tags || []).join(", ") || undefined}
        canonical={`/blog/${post.slug}`}
        ogType="article"
        ogImage={post.coverImage ? abs(post.coverImage) : undefined}
        twitterCard="summary_large_image"
        schemas={[
          blogPosting({
            title: post.title,
            description: post.metaDescription || post.excerpt || "",
            url: `/blog/${post.slug}`,
            image: post.coverImage ? abs(post.coverImage) : abs("/opengraph.jpg"),
            datePublished: (post.publishedAt || post.createdAt)?.toString(),
            dateModified: (post.publishedAt || post.createdAt)?.toString(),
            authorName: post.authorName || "Vedic Tatva",
            publisherName: "Vedic Tatva",
            publisherLogo: abs("/logo.png"),
          }),
        ]}
      />
      <div className="max-w-3xl mx-auto px-4 pt-8">
        <Link href="/blog">
          <Button variant="ghost" size="sm" className="mb-6" data-testid="link-back-to-blog">
            <ArrowLeft className="w-4 h-4" /> Back to Journal
          </Button>
        </Link>

        <div className="flex items-center gap-2 mb-4">
          {post.category && <Badge variant="outline" data-testid="badge-blog-category">{post.category}</Badge>}
          <span className="text-xs text-[#5a4a3a]/70 flex items-center gap-1">
            <Clock className="w-3 h-3" /> {post.readMinutes || 5} min read
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#6D2B35] mb-4 leading-tight" data-testid="text-blog-title">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-[#5a4a3a] mb-6 leading-relaxed" data-testid="text-blog-excerpt">{post.excerpt}</p>
        )}

        <div className="flex items-center justify-between mb-8 pb-6 border-b border-[#E8DCC4]">
          <div className="text-sm text-[#5a4a3a]">
            By <span className="font-semibold text-[#6D2B35]">{post.authorName}</span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleShare} data-testid="button-share-blog">
            <Share2 className="w-4 h-4" /> Share
          </Button>
        </div>

        {post.coverImage && (
          <img
            src={post.coverImage}
            alt={post.title}
            className="w-full rounded-md mb-8"
            data-testid="img-blog-cover"
          />
        )}

        <div className="lg:grid lg:grid-cols-[1fr_220px] lg:gap-10">
          <div
            className="prose prose-stone max-w-none text-[#3d3328] leading-relaxed [&_h2]:font-serif [&_h2]:text-[#6D2B35] [&_h2]:text-2xl [&_h2]:mt-10 [&_h2]:mb-3 [&_h2]:scroll-mt-24 [&_h3]:font-serif [&_h3]:text-[#6D2B35] [&_h3]:text-xl [&_h3]:mt-6 [&_h3]:mb-2 [&_p]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-4 [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-4 [&_li]:mb-1.5 [&_strong]:text-[#6D2B35] [&_a]:text-[#6D2B35] [&_a]:underline"
            dangerouslySetInnerHTML={{ __html: bodyWithIds }}
            data-testid="content-blog-body"
          />
          {tocItems.length >= 2 && (
            <aside className="hidden lg:block" aria-label="Article contents" data-testid="blog-toc">
              <div className="sticky top-24">
                <p className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-semibold mb-2">On this page</p>
                <nav>
                  <ul className="space-y-1.5 border-l-2 border-[#E8DCC4] pl-3">
                    {tocItems.map((t) => (
                      <li key={t.id}>
                        <a
                          href={`#${t.id}`}
                          className="block text-xs text-[#5a4a3a] hover:text-[#6D2B35] hover:underline leading-snug"
                          data-testid={`toc-link-${t.id}`}
                        >
                          {t.text}
                        </a>
                      </li>
                    ))}
                  </ul>
                </nav>
              </div>
            </aside>
          )}
        </div>

        {post.relatedShopUrl && post.relatedShopLabel && (
          <Card className="p-6 md:p-8 mt-12 bg-[#F5EFE0] border-[#D4AF37]/40" data-testid="card-blog-cta">
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-1">Shop the Article</div>
                <h3 className="text-xl font-serif font-bold text-[#6D2B35]">{post.relatedShopLabel}</h3>
              </div>
              <Link href={post.relatedShopUrl}>
                <Button data-testid="link-related-shop">
                  <ShoppingBag className="w-4 h-4" /> Browse Now
                </Button>
              </Link>
            </div>
          </Card>
        )}

        {relatedProducts.length > 0 && (
          <div className="mt-14 pt-8 border-t border-[#E8DCC4]" data-testid="section-blog-related-products">
            <div className="flex items-end justify-between mb-5">
              <h2 className="text-2xl font-serif font-bold text-[#6D2B35]">Shop What You Just Read</h2>
              {post.relatedShopUrl && (
                <Link href={post.relatedShopUrl} className="text-sm text-[#6D2B35] hover:underline font-semibold" data-testid="link-blog-shop-all">
                  View all
                </Link>
              )}
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedProducts.map(p => (
                <Link key={p.id} href={getProductUrl(p.id, p.name)}>
                  <Card className="overflow-hidden hover-elevate cursor-pointer h-full flex flex-col" data-testid={`card-blog-product-${p.id}`}>
                    <div className="aspect-square bg-[#FBF7EE] overflow-hidden">
                      <img src={optImg(p.image, 400)} alt={p.name} loading="lazy" className="w-full h-full object-contain p-2 mix-blend-multiply" />
                    </div>
                    <div className="p-3 flex flex-col flex-1">
                      <h3 className="text-xs font-medium text-[#3a2a1a] line-clamp-2 leading-snug min-h-[2.4em]">{p.name}</h3>
                      <div className="mt-auto pt-2 font-bold text-sm text-[#6D2B35]">₹{p.price.toLocaleString()}</div>
                    </div>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        {relatedPosts.length > 0 && (
          <div className="mt-16 pt-10 border-t border-[#E8DCC4]" data-testid="section-related-posts">
            <h2 className="text-2xl font-serif font-bold text-[#6D2B35] mb-6">Continue Reading</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {relatedPosts.map(p => (
                <Link key={p.id} href={`/blog/${p.slug}`}>
                  <Card className="p-4 hover-elevate cursor-pointer h-full" data-testid={`card-related-${p.slug}`}>
                    {p.category && <span className="text-[10px] text-[#D4AF37] uppercase tracking-[0.2em] font-semibold">{p.category}</span>}
                    <h3 className="font-serif font-bold text-[#6D2B35] mt-1.5 leading-snug line-clamp-2">{p.title}</h3>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
        <BlogCommentsSection postSlug={post.slug} />
        <BlogQuestionWidget postId={post.id} postSlug={post.slug} />
      </div>
    </article>
  );
}

interface PublicComment {
  id: number;
  name: string;
  body: string;
  createdAt: string;
}

function BlogCommentsSection({ postSlug }: { postSlug: string }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", body: "", website: "" });

  const { data: comments = [] } = useQuery<PublicComment[]>({
    queryKey: ["/api/blog-posts", postSlug, "comments"],
    queryFn: () => fetch(`/api/blog-posts/${encodeURIComponent(postSlug)}/comments`).then((r) => r.json()),
  });

  const submit = useMutation({
    mutationFn: () =>
      fetch(`/api/blog-posts/${encodeURIComponent(postSlug)}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j?.message || "Submit failed")));
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Submitted", description: "Your comment is awaiting moderation." });
      setForm({ name: "", email: "", body: "", website: "" });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts", postSlug, "comments"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <section className="mt-16 pt-10 border-t border-[#E8DCC4]" data-testid="section-blog-comments">
      <h2 className="text-2xl font-serif font-bold text-[#6D2B35] mb-6 inline-flex items-center gap-2">
        <MessageCircle className="w-5 h-5" />Comments ({comments.length})
      </h2>

      <div className="space-y-3 mb-6">
        {comments.length === 0 && <p className="text-sm text-muted-foreground">No comments yet. Be the first.</p>}
        {comments.map((c) => (
          <Card key={c.id}>
            <CardContent className="pt-5 pb-5">
              <div className="flex flex-row items-center gap-2 flex-wrap mb-1">
                <p className="font-semibold text-sm text-[#6D2B35]">{c.name}</p>
                <p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleDateString()}</p>
              </div>
              <p className="text-sm whitespace-pre-wrap leading-relaxed">{c.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-[#D4AF37]/40">
        <CardContent className="pt-6 space-y-3">
          <h3 className="font-serif font-bold text-[#6D2B35]">Leave a comment</h3>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-comment-name" /></div>
            <div><Label>Email (not published)</Label><Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} data-testid="input-comment-email" /></div>
          </div>
          <div><Label>Comment</Label><Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} data-testid="input-comment-body" /></div>
          <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
          <Button onClick={() => submit.mutate()} disabled={!form.name.trim() || !form.email.trim() || !form.body.trim() || submit.isPending} data-testid="button-submit-comment">
            {submit.isPending ? "Submitting…" : "Post comment"}
          </Button>
        </CardContent>
      </Card>
    </section>
  );
}

function BlogQuestionWidget({ postId, postSlug }: { postId: number; postSlug: string }) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: "", body: "", authorName: "", authorEmail: "", website: "" });

  const submit = useMutation({
    mutationFn: () =>
      fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, category: "general", postId }),
      }).then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j?.message || "Submit failed")));
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Question submitted", description: "Awaiting moderation. Thank you." });
      setForm({ title: "", body: "", authorName: "", authorEmail: "", website: "" });
      setOpen(false);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <section className="mt-12 pt-8 border-t border-[#E8DCC4]" data-testid="section-blog-question">
      <Card className="border-[#D4AF37]/40 bg-[#FFFBF0]">
        <CardContent className="pt-6">
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <h3 className="font-serif font-bold text-[#6D2B35] inline-flex items-center gap-2"><HelpCircle className="w-5 h-5" />Have a question on this topic?</h3>
              <p className="text-sm text-muted-foreground mt-1">Our pandits review and answer every question publicly on our Q&A.</p>
            </div>
            <div className="flex flex-row gap-2 flex-wrap">
              <Button variant="outline" asChild><Link href="/qa">Browse Q&A</Link></Button>
              <Button onClick={() => setOpen(!open)} data-testid="button-open-ask">Ask a question</Button>
            </div>
          </div>
          {open && (
            <div className="space-y-3 mt-5 pt-5 border-t border-[#E8DCC4]">
              <div><Label>Question</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short, specific question" data-testid="input-blog-q-title" /></div>
              <div><Label>More detail (optional)</Label><Textarea rows={2} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <Input placeholder="Your name" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} data-testid="input-blog-q-name" />
                <Input type="email" placeholder="Email (not published)" value={form.authorEmail} onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} data-testid="input-blog-q-email" />
              </div>
              <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
              <Button onClick={() => submit.mutate()} disabled={!form.title.trim() || !form.authorName.trim() || !form.authorEmail.trim() || submit.isPending} data-testid="button-submit-blog-question">
                {submit.isPending ? "Submitting…" : "Submit question"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
