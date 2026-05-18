import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Search, Plus, Trash2, Edit, Image, Type } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product, SeoPage } from "@shared/schema";

import { createFetcher } from "../admin-shared";

function SeoManagerTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: seoPages } = useQuery<SeoPage[]>({ queryKey: ["/api/seo-pages"], queryFn: () => fetcher("/api/seo-pages") });
  const [editing, setEditing] = useState<SeoPage | null>(null);
  const [creating, setCreating] = useState(false);
  const [searchFilter, setSearchFilter] = useState("");
  const [form, setForm] = useState({
    pagePath: "", metaTitle: "", metaDescription: "", metaKeywords: "",
    canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", ogType: "website",
    twitterTitle: "", twitterDescription: "", twitterImage: "",
    robotsIndex: true, robotsFollow: true, priority: 0.5, changeFreq: "weekly",
    schemaMarkup: "", customHeadTags: "", h1Override: "", breadcrumbLabel: "", isActive: true,
  });

  const resetForm = () => {
    setForm({
      pagePath: "", metaTitle: "", metaDescription: "", metaKeywords: "",
      canonicalUrl: "", ogTitle: "", ogDescription: "", ogImage: "", ogType: "website",
      twitterTitle: "", twitterDescription: "", twitterImage: "",
      robotsIndex: true, robotsFollow: true, priority: 0.5, changeFreq: "weekly",
      schemaMarkup: "", customHeadTags: "", h1Override: "", breadcrumbLabel: "", isActive: true,
    });
  };

  const openEdit = (page: SeoPage) => {
    setEditing(page);
    setCreating(false);
    setForm({
      pagePath: page.pagePath || "",
      metaTitle: page.metaTitle || "",
      metaDescription: page.metaDescription || "",
      metaKeywords: page.metaKeywords || "",
      canonicalUrl: page.canonicalUrl || "",
      ogTitle: page.ogTitle || "",
      ogDescription: page.ogDescription || "",
      ogImage: page.ogImage || "",
      ogType: page.ogType || "website",
      twitterTitle: page.twitterTitle || "",
      twitterDescription: page.twitterDescription || "",
      twitterImage: page.twitterImage || "",
      robotsIndex: page.robotsIndex ?? true,
      robotsFollow: page.robotsFollow ?? true,
      priority: page.priority ?? 0.5,
      changeFreq: page.changeFreq || "weekly",
      schemaMarkup: page.schemaMarkup || "",
      customHeadTags: page.customHeadTags || "",
      h1Override: page.h1Override || "",
      breadcrumbLabel: page.breadcrumbLabel || "",
      isActive: page.isActive ?? true,
    });
  };

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    resetForm();
  };

  const saveMut = useMutation({
    mutationFn: async () => {
      const url = editing ? `/api/seo-pages/${editing.id}` : "/api/seo-pages";
      const method = editing ? "PATCH" : "POST";
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      if (!res.ok) { const err = await res.json(); throw new Error(err.error || "Save failed"); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-pages"] });
      toast({ title: editing ? "SEO page updated" : "SEO page created" });
      setEditing(null);
      setCreating(false);
      resetForm();
    },
    onError: (err: Error) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/seo-pages/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/seo-pages"] });
      toast({ title: "SEO page deleted" });
    },
  });

  const filtered = (seoPages || []).filter(p =>
    p.pagePath.toLowerCase().includes(searchFilter.toLowerCase()) ||
    (p.metaTitle || "").toLowerCase().includes(searchFilter.toLowerCase())
  );

  const FREQ_OPTIONS = ["always", "hourly", "daily", "weekly", "monthly", "yearly", "never"];

  if (editing || creating) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{editing ? "Edit SEO Settings" : "Add New Page SEO"}</h3>
          <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); resetForm(); }} data-testid="button-cancel-seo">Cancel</Button>
        </div>

        <Card>
          <CardHeader><CardTitle className="text-base">Basic Meta Tags</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Page Path *</Label>
              <Input value={form.pagePath} onChange={e => setForm(f => ({ ...f, pagePath: e.target.value }))} placeholder="/puja-samagri-online or /book-pandit-online" disabled={!!editing} data-testid="input-seo-page-path" />
              <p className="text-xs text-muted-foreground mt-1">URL path like /puja-samagri-online, /astrology, /product/rudraksha-mala</p>
            </div>
            <div>
              <Label>Meta Title</Label>
              <Input value={form.metaTitle} onChange={e => setForm(f => ({ ...f, metaTitle: e.target.value }))} placeholder="Page Title | Vedic Tatva" data-testid="input-seo-meta-title" />
              <p className="text-xs text-muted-foreground mt-1">{form.metaTitle.length}/60 characters (recommended 50-60)</p>
            </div>
            <div>
              <Label>Meta Description</Label>
              <Textarea value={form.metaDescription} onChange={e => setForm(f => ({ ...f, metaDescription: e.target.value }))} placeholder="Brief description for search results..." rows={3} data-testid="input-seo-meta-description" />
              <p className="text-xs text-muted-foreground mt-1">{form.metaDescription.length}/160 characters (recommended 120-160)</p>
            </div>
            <div>
              <Label>Meta Keywords</Label>
              <Input value={form.metaKeywords} onChange={e => setForm(f => ({ ...f, metaKeywords: e.target.value }))} placeholder="spiritual products, puja items, vedic" data-testid="input-seo-meta-keywords" />
            </div>
            <div>
              <Label>Canonical URL</Label>
              <Input value={form.canonicalUrl} onChange={e => setForm(f => ({ ...f, canonicalUrl: e.target.value }))} placeholder="https://vedictatva.com/puja-samagri-online" data-testid="input-seo-canonical" />
            </div>
            <div>
              <Label>H1 Override</Label>
              <Input value={form.h1Override} onChange={e => setForm(f => ({ ...f, h1Override: e.target.value }))} placeholder="Custom H1 heading for the page" data-testid="input-seo-h1" />
            </div>
            <div>
              <Label>Breadcrumb Label</Label>
              <Input value={form.breadcrumbLabel} onChange={e => setForm(f => ({ ...f, breadcrumbLabel: e.target.value }))} placeholder="Shop" data-testid="input-seo-breadcrumb" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Open Graph (Social Sharing)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>OG Title</Label>
              <Input value={form.ogTitle} onChange={e => setForm(f => ({ ...f, ogTitle: e.target.value }))} placeholder="Title for social sharing" data-testid="input-seo-og-title" />
            </div>
            <div>
              <Label>OG Description</Label>
              <Textarea value={form.ogDescription} onChange={e => setForm(f => ({ ...f, ogDescription: e.target.value }))} placeholder="Description for social sharing..." rows={2} data-testid="input-seo-og-description" />
            </div>
            <div>
              <Label>OG Image URL</Label>
              <Input value={form.ogImage} onChange={e => setForm(f => ({ ...f, ogImage: e.target.value }))} placeholder="https://vedictatva.com/images/og-image.jpg" data-testid="input-seo-og-image" />
            </div>
            <div>
              <Label>OG Type</Label>
              <Select value={form.ogType} onValueChange={v => setForm(f => ({ ...f, ogType: v }))}>
                <SelectTrigger data-testid="select-seo-og-type"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="article">Article</SelectItem>
                  <SelectItem value="product">Product</SelectItem>
                  <SelectItem value="profile">Profile</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Twitter Card</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Twitter Title</Label>
              <Input value={form.twitterTitle} onChange={e => setForm(f => ({ ...f, twitterTitle: e.target.value }))} data-testid="input-seo-twitter-title" />
            </div>
            <div>
              <Label>Twitter Description</Label>
              <Textarea value={form.twitterDescription} onChange={e => setForm(f => ({ ...f, twitterDescription: e.target.value }))} rows={2} data-testid="input-seo-twitter-description" />
            </div>
            <div>
              <Label>Twitter Image URL</Label>
              <Input value={form.twitterImage} onChange={e => setForm(f => ({ ...f, twitterImage: e.target.value }))} data-testid="input-seo-twitter-image" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Indexing & Sitemap</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Switch checked={form.robotsIndex} onCheckedChange={v => setForm(f => ({ ...f, robotsIndex: v }))} data-testid="switch-seo-robots-index" />
                <Label>Allow Indexing</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.robotsFollow} onCheckedChange={v => setForm(f => ({ ...f, robotsFollow: v }))} data-testid="switch-seo-robots-follow" />
                <Label>Allow Following Links</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.isActive} onCheckedChange={v => setForm(f => ({ ...f, isActive: v }))} data-testid="switch-seo-active" />
                <Label>Active</Label>
              </div>
            </div>
            <div>
              <Label>Sitemap Priority (0.0 - 1.0)</Label>
              <Input type="number" step="0.1" min="0" max="1" value={form.priority} onChange={e => setForm(f => ({ ...f, priority: parseFloat(e.target.value) || 0.5 }))} data-testid="input-seo-priority" />
            </div>
            <div>
              <Label>Change Frequency</Label>
              <Select value={form.changeFreq} onValueChange={v => setForm(f => ({ ...f, changeFreq: v }))}>
                <SelectTrigger data-testid="select-seo-change-freq"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {FREQ_OPTIONS.map(f => <SelectItem key={f} value={f}>{f.charAt(0).toUpperCase() + f.slice(1)}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Advanced</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>JSON-LD Schema Markup</Label>
              <Textarea value={form.schemaMarkup} onChange={e => setForm(f => ({ ...f, schemaMarkup: e.target.value }))} rows={5} placeholder='{"@context":"https://schema.org",...}' className="font-mono text-xs" data-testid="input-seo-schema" />
            </div>
            <div>
              <Label>Custom Head Tags</Label>
              <Textarea value={form.customHeadTags} onChange={e => setForm(f => ({ ...f, customHeadTags: e.target.value }))} rows={3} placeholder='<meta name="author" content="Vedic Tatva" />' className="font-mono text-xs" data-testid="input-seo-custom-head" />
            </div>
          </CardContent>
        </Card>

        <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.pagePath} className="bg-primary hover:bg-primary" data-testid="button-save-seo">
          {saveMut.isPending ? "Saving..." : editing ? "Update SEO Settings" : "Create SEO Page"}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h3 className="text-lg font-semibold" data-testid="text-seo-title">SEO Manager</h3>
          <p className="text-sm text-muted-foreground">Control meta tags, indexing, sitemap, and schema markup for every page</p>
        </div>
        <Button onClick={openCreate} data-testid="button-add-seo-page">
          <Plus className="w-4 h-4 mr-2" /> Add Page SEO
        </Button>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
        <Input value={searchFilter} onChange={e => setSearchFilter(e.target.value)} placeholder="Search by page path or title..." className="pl-10" data-testid="input-seo-search" />
      </div>

      <div className="grid gap-3">
        {filtered.length === 0 && (
          <Card><CardContent className="py-8 text-center text-muted-foreground">No SEO pages configured yet. Click "Add Page SEO" to get started.</CardContent></Card>
        )}
        {filtered.map(page => (
          <Card key={page.id} className={`${!page.isActive ? "opacity-60" : ""}`}>
            <CardContent className="py-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-sm font-medium text-primary" data-testid={`text-seo-path-${page.id}`}>{page.pagePath}</span>
                    {!page.isActive && <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded">Inactive</span>}
                    {!page.robotsIndex && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded">No Index</span>}
                    {page.priority !== null && page.priority !== undefined && <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">Priority: {page.priority}</span>}
                  </div>
                  {page.metaTitle && <p className="text-sm font-medium truncate" data-testid={`text-seo-title-${page.id}`}>{page.metaTitle}</p>}
                  {page.metaDescription && <p className="text-xs text-muted-foreground truncate mt-0.5">{page.metaDescription}</p>}
                  <div className="flex gap-2 mt-1 flex-wrap">
                    {page.ogTitle && <span className="text-xs text-muted-foreground/60">OG</span>}
                    {page.schemaMarkup && <span className="text-xs text-muted-foreground/60">Schema</span>}
                    {page.canonicalUrl && <span className="text-xs text-muted-foreground/60">Canonical</span>}
                    {page.h1Override && <span className="text-xs text-muted-foreground/60">H1</span>}
                  </div>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Button size="sm" variant="outline" onClick={() => openEdit(page)} data-testid={`button-edit-seo-${page.id}`}>
                    <Edit className="w-3 h-3 mr-1" /> Edit
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => { if (confirm("Delete this SEO configuration?")) deleteMut.mutate(page.id); }} data-testid={`button-delete-seo-${page.id}`}>
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="py-4">
          <h4 className="font-medium text-amber-800 mb-2">SEO Tips</h4>
          <ul className="text-xs text-amber-700 space-y-1">
            <li>Keep meta titles under 60 characters and descriptions under 160 characters</li>
            <li>Set priority 1.0 for homepage, 0.8 for key pages, 0.5 for regular pages</li>
            <li>Use JSON-LD schema markup to help Google understand your content</li>
            <li>Disable indexing for admin, cart, checkout pages to focus crawl budget</li>
            <li>Add canonical URLs to prevent duplicate content issues</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}


export default SeoManagerTab;
