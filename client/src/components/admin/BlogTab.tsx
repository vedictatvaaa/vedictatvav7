import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage,
} from "@/components/ui/form";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, Edit, Trash2, Upload, ExternalLink, Eye, EyeOff, BookOpen, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { insertBlogPostSchema, type BlogPost } from "@shared/schema";

const blogFormSchema = insertBlogPostSchema.partial().extend({
  title: z.string().trim().min(1, "Title is required"),
  slug: z.string().trim().min(1, "Slug is required").regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  body: z.string().trim().min(1, "Body is required"),
  excerpt: z.string().default(""),
  coverImage: z.string().default(""),
  category: z.string().default(""),
  metaTitle: z.string().default(""),
  metaDescription: z.string().default(""),
  metaKeywords: z.string().default(""),
  relatedShopUrl: z.string().default(""),
  relatedShopLabel: z.string().default(""),
  tagsCsv: z.string().default(""),
  readMinutes: z.coerce.number().int().min(1).default(5),
  authorName: z.string().trim().min(1).default("Vedic Tatva"),
  isPublished: z.boolean().default(true),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

const EMPTY: BlogFormValues = {
  slug: "", title: "", excerpt: "", body: "", coverImage: "",
  category: "", tagsCsv: "", metaTitle: "", metaDescription: "", metaKeywords: "",
  relatedShopUrl: "", relatedShopLabel: "", authorName: "Vedic Tatva",
  readMinutes: 5, isPublished: true,
};

function slugify(s: string) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

function fromPost(p: BlogPost): BlogFormValues {
  return {
    slug: p.slug || "",
    title: p.title || "",
    excerpt: p.excerpt || "",
    body: p.body || "",
    coverImage: p.coverImage || "",
    category: p.category || "",
    tagsCsv: (p.tags || []).join(", "),
    metaTitle: p.metaTitle || "",
    metaDescription: p.metaDescription || "",
    metaKeywords: p.metaKeywords || "",
    relatedShopUrl: p.relatedShopUrl || "",
    relatedShopLabel: p.relatedShopLabel || "",
    authorName: p.authorName || "Vedic Tatva",
    readMinutes: p.readMinutes ?? 5,
    isPublished: !!p.isPublished,
  };
}

function toPayload(f: BlogFormValues) {
  return {
    slug: f.slug.trim(),
    title: f.title.trim(),
    excerpt: f.excerpt?.trim() || null,
    body: f.body,
    coverImage: f.coverImage?.trim() || null,
    category: f.category?.trim() || null,
    tags: (f.tagsCsv || "").split(",").map(t => t.trim()).filter(Boolean),
    metaTitle: f.metaTitle?.trim() || null,
    metaDescription: f.metaDescription?.trim() || null,
    metaKeywords: f.metaKeywords?.trim() || null,
    relatedShopUrl: f.relatedShopUrl?.trim() || null,
    relatedShopLabel: f.relatedShopLabel?.trim() || null,
    authorName: f.authorName?.trim() || "Vedic Tatva",
    readMinutes: Math.max(1, Number(f.readMinutes) || 5),
    isPublished: f.isPublished,
  };
}

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  return "Something went wrong";
}

export function BlogTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<BlogPost | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [slugTouched, setSlugTouched] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const adminHeaders = adminToken ? { "x-admin-token": adminToken } : undefined;

  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: EMPTY,
  });

  const { data: posts = [], isLoading } = useQuery<BlogPost[]>({
    queryKey: ["/api/admin/blog-posts"],
    queryFn: async () => {
      const res = await fetch("/api/admin/blog-posts", { headers: adminHeaders });
      if (!res.ok) throw new Error("Failed to load blog posts");
      return res.json();
    },
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return posts;
    return posts.filter(p =>
      p.title.toLowerCase().includes(q) ||
      (p.slug || "").toLowerCase().includes(q) ||
      (p.category || "").toLowerCase().includes(q)
    );
  }, [posts, search]);

  const upsertMut = useMutation({
    mutationFn: async (values: BlogFormValues) => {
      const payload = toPayload(values);
      const res = editing
        ? await apiRequest("PATCH", `/api/blog-posts/${editing.id}`, payload, adminHeaders)
        : await apiRequest("POST", `/api/blog-posts`, payload, adminHeaders);
      return res.json();
    },
    onSuccess: async () => {
      toast({ title: editing ? "Post updated" : "Post created" });
      await qc.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      await qc.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      setOpen(false);
      setEditing(null);
      form.reset(EMPTY);
    },
    onError: (e: unknown) => toast({ title: "Save failed", description: errorMessage(e), variant: "destructive" }),
  });

  const publishMut = useMutation({
    mutationFn: async ({ id, publish }: { id: number; publish: boolean }) => {
      const res = await apiRequest("PATCH", `/api/blog-posts/${id}`, { isPublished: publish }, adminHeaders);
      return res.json();
    },
    onSuccess: async (_d, vars) => {
      toast({ title: vars.publish ? "Post published" : "Post unpublished" });
      await qc.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      await qc.invalidateQueries({ queryKey: ["/api/blog-posts"] });
    },
    onError: (e: unknown) => toast({ title: "Failed", description: errorMessage(e), variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/blog-posts/${id}`, undefined, adminHeaders);
    },
    onSuccess: async () => {
      toast({ title: "Post deleted" });
      await qc.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      await qc.invalidateQueries({ queryKey: ["/api/blog-posts"] });
      setDeleteId(null);
    },
    onError: (e: unknown) => toast({ title: "Delete failed", description: errorMessage(e), variant: "destructive" }),
  });

  // ---- Bulk selection + actions ----
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const toggleOne = (id: number) =>
    setSelectedIds(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allFilteredSelected = filtered.length > 0 && filtered.every(p => selectedIds.has(p.id));
  const toggleAll = () =>
    setSelectedIds(prev => (filtered.length && filtered.every(p => prev.has(p.id)) ? new Set() : new Set(filtered.map(p => p.id))));

  const bulkMut = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: "publish" | "unpublish" | "delete" }) => {
      const res = await apiRequest("POST", "/api/admin/blog-posts/bulk", { ids, action }, adminHeaders);
      return res.json() as Promise<{ affected: number; action: string }>;
    },
    onSuccess: async (data) => {
      const verb = data.action === "delete" ? "deleted" : data.action === "publish" ? "published" : "unpublished";
      toast({ title: `${data.affected} post${data.affected === 1 ? "" : "s"} ${verb}` });
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      await qc.invalidateQueries({ queryKey: ["/api/admin/blog-posts"] });
      await qc.invalidateQueries({ queryKey: ["/api/blog-posts"] });
    },
    onError: (e: unknown) => toast({ title: "Bulk action failed", description: errorMessage(e), variant: "destructive" }),
  });

  // ---- Automation settings (site-settings subset) ----
  const { data: settings } = useQuery<Record<string, any>>({ queryKey: ["/api/site-settings"] });
  const autoGen = settings?.blogAutoGenerate ?? true;
  const autoPub = settings?.blogAutoPublish ?? false;
  const festAware = settings?.blogFestivalAware ?? true;

  const settingsMut = useMutation({
    mutationFn: async (patch: Record<string, unknown>) => {
      const res = await apiRequest("POST", "/api/site-settings", patch, adminHeaders);
      return res.json();
    },
    onSuccess: async () => { await qc.invalidateQueries({ queryKey: ["/api/site-settings"] }); },
    onError: (e: unknown) => toast({ title: "Couldn't save automation settings", description: errorMessage(e), variant: "destructive" }),
  });

  const [countDraft, setCountDraft] = useState("3");
  useEffect(() => { if (settings?.blogDailyCount != null) setCountDraft(String(settings.blogDailyCount)); }, [settings?.blogDailyCount]);
  const saveCount = () => {
    const n = Math.max(1, Math.min(12, parseInt(countDraft) || 3));
    setCountDraft(String(n));
    if (n !== (settings?.blogDailyCount ?? 3)) settingsMut.mutate({ blogDailyCount: n });
  };

  const openCreate = () => { setEditing(null); setSlugTouched(false); form.reset(EMPTY); setOpen(true); };
  const openEdit = (p: BlogPost) => { setEditing(p); setSlugTouched(true); form.reset(fromPost(p)); setOpen(true); };

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("images", file);
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        headers: adminHeaders,
        body: fd,
      });
      if (!res.ok) throw new Error("Upload failed");
      const data = (await res.json()) as { urls: string[] };
      form.setValue("coverImage", data.urls[0], { shouldDirty: true });
      toast({ title: "Image uploaded" });
    } catch (e: unknown) {
      toast({ title: "Upload failed", description: errorMessage(e), variant: "destructive" });
    }
    setUploading(false);
  };

  const onTitleChange = (v: string) => {
    form.setValue("title", v, { shouldDirty: true, shouldValidate: true });
    if (!editing && !slugTouched) {
      form.setValue("slug", slugify(v), { shouldValidate: true });
    }
  };

  const isPublishedWatch = form.watch("isPublished");
  const coverWatch = form.watch("coverImage");

  return (
    <div className="space-y-4" data-testid="tab-blog">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Journal</h2>
          <p className="text-sm text-muted-foreground">Write articles for the Vedic Tatva Journal — drafts, SEO, related-shop links.</p>
        </div>
        <Button onClick={openCreate} data-testid="button-new-blog-post">
          <Plus className="w-4 h-4" /> New Post
        </Button>
      </div>

      <Card>
        <CardContent className="pt-4 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h3 className="text-sm font-semibold text-foreground">Blog Automation</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Auto-generate SEO articles each day — optionally timed to upcoming festivals, Ekadashi, Purnima and Amavasya.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">Daily auto-generate</div>
                <div className="text-xs text-muted-foreground">Create new draft articles automatically every day.</div>
              </div>
              <Switch checked={autoGen} onCheckedChange={(v) => settingsMut.mutate({ blogAutoGenerate: v })} data-testid="switch-auto-generate" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">Auto-publish</div>
                <div className="text-xs text-muted-foreground">Publish generated posts instantly instead of queuing for review.</div>
              </div>
              <Switch checked={autoPub} onCheckedChange={(v) => settingsMut.mutate({ blogAutoPublish: v })} data-testid="switch-auto-publish" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">Festival-aware topics</div>
                <div className="text-xs text-muted-foreground">Prioritise upcoming festivals &amp; lunar days as topics.</div>
              </div>
              <Switch checked={festAware} onCheckedChange={(v) => settingsMut.mutate({ blogFestivalAware: v })} data-testid="switch-festival-aware" />
            </div>
            <div className="flex items-center justify-between gap-3 rounded-md border border-border p-3">
              <div>
                <div className="text-sm font-medium">Posts per day</div>
                <div className="text-xs text-muted-foreground">Articles to generate each run (1–12).</div>
              </div>
              <Input
                type="number" min={1} max={12}
                value={countDraft}
                onChange={(e) => setCountDraft(e.target.value)}
                onBlur={saveCount}
                className="w-20"
                data-testid="input-daily-count"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4">
          <div className="relative max-w-md">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by title, slug, or category"
              className="pl-7"
              data-testid="input-search-blog"
            />
          </div>
        </CardContent>
      </Card>

      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-2" data-testid="bar-bulk-actions">
          <span className="text-sm font-medium" data-testid="text-bulk-count">{selectedIds.size} selected</span>
          <div className="flex items-center gap-2 ml-auto flex-wrap">
            <Button size="sm" variant="outline" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate({ ids: Array.from(selectedIds), action: "publish" })} data-testid="button-bulk-publish">
              <Eye className="w-3.5 h-3.5" /> Publish
            </Button>
            <Button size="sm" variant="outline" disabled={bulkMut.isPending} onClick={() => bulkMut.mutate({ ids: Array.from(selectedIds), action: "unpublish" })} data-testid="button-bulk-unpublish">
              <EyeOff className="w-3.5 h-3.5" /> Unpublish
            </Button>
            <Button size="sm" variant="destructive" disabled={bulkMut.isPending} onClick={() => setBulkDeleteOpen(true)} data-testid="button-bulk-delete">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setSelectedIds(new Set())} data-testid="button-bulk-clear">Clear</Button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto rounded-md border border-border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
            <tr>
              <th className="px-3 py-2 w-8">
                <Checkbox
                  checked={allFilteredSelected}
                  onCheckedChange={toggleAll}
                  aria-label="Select all posts"
                  data-testid="checkbox-select-all-blog"
                />
              </th>
              <th className="text-left px-3 py-2">Title</th>
              <th className="text-left px-3 py-2 hidden md:table-cell">Category</th>
              <th className="text-left px-3 py-2 hidden lg:table-cell">Published</th>
              <th className="text-right px-3 py-2 hidden md:table-cell">Views</th>
              <th className="text-center px-3 py-2">Status</th>
              <th className="text-right px-3 py-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-8">Loading posts...</td></tr>
            )}
            {!isLoading && filtered.length === 0 && (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-10" data-testid="text-blog-empty">
                <BookOpen className="w-8 h-8 mx-auto mb-2 opacity-40" />
                {search ? "No posts match your search." : "No posts yet. Create your first article."}
              </td></tr>
            )}
            {filtered.map(p => (
              <tr key={p.id} className="border-t border-border" data-testid={`row-blog-${p.id}`}>
                <td className="px-3 py-2">
                  <Checkbox
                    checked={selectedIds.has(p.id)}
                    onCheckedChange={() => toggleOne(p.id)}
                    aria-label={`Select ${p.title}`}
                    data-testid={`checkbox-blog-${p.id}`}
                  />
                </td>
                <td className="px-3 py-2">
                  <div className="font-medium text-foreground">{p.title}</div>
                  <div className="text-xs text-muted-foreground">/{p.slug}</div>
                </td>
                <td className="px-3 py-2 hidden md:table-cell text-muted-foreground">{p.category || "—"}</td>
                <td className="px-3 py-2 hidden lg:table-cell text-muted-foreground" data-testid={`text-published-${p.id}`}>
                  {p.isPublished && p.publishedAt
                    ? new Date(p.publishedAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
                    : "—"}
                </td>
                <td className="px-3 py-2 hidden md:table-cell text-right">{p.viewCount}</td>
                <td className="px-3 py-2 text-center">
                  {p.isPublished ? (
                    <Badge data-testid={`badge-published-${p.id}`}>Published</Badge>
                  ) : (
                    <Badge variant="outline" data-testid={`badge-draft-${p.id}`}>Draft</Badge>
                  )}
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1 flex-wrap">
                    <Button
                      size="sm"
                      variant={p.isPublished ? "ghost" : "default"}
                      onClick={() => publishMut.mutate({ id: p.id, publish: !p.isPublished })}
                      disabled={publishMut.isPending}
                      title={p.isPublished ? "Unpublish (hide from public blog)" : "Publish now"}
                      data-testid={`button-toggle-publish-${p.id}`}
                    >
                      {p.isPublished ? <><EyeOff className="w-3.5 h-3.5" /> Unpublish</> : <><Eye className="w-3.5 h-3.5" /> Publish</>}
                    </Button>
                    <Button asChild size="icon" variant="ghost" data-testid={`button-view-blog-${p.id}`}>
                      <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" title="View live">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => openEdit(p)} data-testid={`button-edit-blog-${p.id}`}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => setDeleteId(p.id)} data-testid={`button-delete-blog-${p.id}`}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) { setEditing(null); form.reset(EMPTY); } }}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Post" : "New Post"}</DialogTitle>
            <DialogDescription>
              Body accepts HTML. Use &lt;h2&gt;, &lt;h3&gt;, &lt;p&gt;, &lt;ul&gt;, &lt;ol&gt;, &lt;strong&gt;, &lt;a&gt; — they render with brand styles automatically.
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit((v) => upsertMut.mutate(v))} className="space-y-4 py-2">
              <div className="grid md:grid-cols-2 gap-3">
                <FormField name="title" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Title</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} onChange={e => onTitleChange(e.target.value)} placeholder="The Sacred Science of Sambrani" data-testid="input-blog-title" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="slug" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Slug</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} onChange={e => { setSlugTouched(true); field.onChange(slugify(e.target.value)); }} placeholder="sacred-science-sambrani" data-testid="input-blog-slug" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField name="excerpt" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Excerpt</FormLabel>
                  <FormControl>
                    <Textarea {...field} value={field.value ?? ""} rows={2} placeholder="A short summary shown on the listing and as fallback meta description." data-testid="input-blog-excerpt" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField name="body" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Body (HTML)</FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      value={field.value ?? ""}
                      rows={14}
                      className="font-mono text-xs"
                      placeholder={`<h2>Why sambrani matters</h2>\n<p>For thousands of years...</p>\n<ul><li>...</li></ul>`}
                      data-testid="input-blog-body"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid md:grid-cols-[1fr_auto] gap-3 items-end">
                <FormField name="coverImage" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Cover Image URL</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value ?? ""} placeholder="/uploads/cover.jpg" data-testid="input-blog-cover" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); e.target.value = ""; }}
                    data-testid="input-blog-cover-file"
                  />
                  <Button type="button" variant="outline" disabled={uploading} onClick={() => fileRef.current?.click()} data-testid="button-blog-upload">
                    <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload"}
                  </Button>
                </div>
              </div>
              {coverWatch && (
                <div className="rounded-md overflow-hidden border border-border max-w-xs">
                  <img src={coverWatch} alt="Cover preview" className="w-full h-40 object-cover" data-testid="img-blog-cover-preview" />
                </div>
              )}

              <div className="grid md:grid-cols-3 gap-3">
                <FormField name="category" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Category</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="Sambrani" data-testid="input-blog-category" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="authorName" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Author</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} data-testid="input-blog-author" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="readMinutes" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Read time (min)</FormLabel>
                    <FormControl><Input type="number" min={1} {...field} value={field.value ?? 5} onChange={e => field.onChange(parseInt(e.target.value) || 5)} data-testid="input-blog-read-minutes" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField name="tagsCsv" control={form.control} render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs">Tags (comma-separated)</FormLabel>
                  <FormControl><Input {...field} value={field.value ?? ""} placeholder="sambrani, puja, dhoop" data-testid="input-blog-tags" /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid md:grid-cols-2 gap-3">
                <FormField name="relatedShopUrl" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Related shop URL</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="/shop/sambrani-cups" data-testid="input-blog-shop-url" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="relatedShopLabel" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Related shop label</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="Shop Sambrani Cups" data-testid="input-blog-shop-label" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="rounded-md border border-border p-3 space-y-3 bg-muted/20">
                <div className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">SEO</div>
                <FormField name="metaTitle" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Meta title</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="Defaults to article title | Vedic Tatva" data-testid="input-blog-meta-title" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="metaDescription" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Meta description</FormLabel>
                    <FormControl><Textarea {...field} value={field.value ?? ""} rows={2} placeholder="Defaults to excerpt. 150–160 characters recommended." data-testid="input-blog-meta-desc" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField name="metaKeywords" control={form.control} render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-xs">Meta keywords</FormLabel>
                    <FormControl><Input {...field} value={field.value ?? ""} placeholder="sambrani benefits, puja dhoop" data-testid="input-blog-meta-keywords" /></FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField name="isPublished" control={form.control} render={({ field }) => (
                <FormItem className="flex items-center justify-between rounded-md border border-border p-3 space-y-0">
                  <div className="flex items-center gap-2">
                    {isPublishedWatch ? <Eye className="w-4 h-4 text-emerald-700" /> : <EyeOff className="w-4 h-4 text-muted-foreground" />}
                    <div>
                      <FormLabel className="text-sm font-medium">{isPublishedWatch ? "Published" : "Draft"}</FormLabel>
                      <FormDescription className="text-xs">
                        Drafts are hidden from the public blog and sitemap. Saving a draft as Published sets the publish date to now.
                      </FormDescription>
                    </div>
                  </div>
                  <FormControl>
                    <Switch checked={!!field.value} onCheckedChange={field.onChange} data-testid="switch-blog-published" />
                  </FormControl>
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="ghost" onClick={() => setOpen(false)} data-testid="button-blog-cancel">Cancel</Button>
                <Button type="submit" disabled={upsertMut.isPending} data-testid="button-blog-save">
                  {upsertMut.isPending ? "Saving..." : editing ? "Save Changes" : "Create Post"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={o => !o && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this post?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the article. The URL will start returning 404 and it will drop from your sitemap on the next refresh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete-blog">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteId && deleteMut.mutate(deleteId)} data-testid="button-confirm-delete-blog">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={bulkDeleteOpen} onOpenChange={o => !o && setBulkDeleteOpen(false)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {selectedIds.size} post{selectedIds.size === 1 ? "" : "s"}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the selected articles. Their URLs will start returning 404 and they will drop from your sitemap on the next refresh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-bulk-delete">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => bulkMut.mutate({ ids: Array.from(selectedIds), action: "delete" })}
              data-testid="button-confirm-bulk-delete"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
