import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { Sparkles, Search, Pencil, ExternalLink, FileQuestion, Video, Wand2, Plus, Trash2 } from "lucide-react";

interface ProductSeoItem {
  id: number; name: string; slug: string | null; path: string;
  score: number; grade: string; hasMeta: boolean; missing: string[];
  focusKeyword: string | null; hasFaq: boolean; hasVideo: boolean;
}
interface ProductSeoAudit {
  averageScore: number; totalProducts: number; productsWithoutMeta: number;
  productsWithFaq: number; productsWithVideo: number; items: ProductSeoItem[];
}
interface FaqItem { question: string; answer: string }

export function ProductSeoTab({ adminFetch }: { adminFetch: (url: string, init?: RequestInit) => Promise<any> }) {
  const { toast } = useToast();
  const [filter, setFilter] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [bulkLimit, setBulkLimit] = useState(20);
  const [bulkOverwrite, setBulkOverwrite] = useState(false);

  const { data: audit, isLoading, refetch } = useQuery<ProductSeoAudit>({
    queryKey: ["/api/admin/products/seo-audit"],
    queryFn: () => adminFetch("/api/admin/products/seo-audit"),
  });

  const bulk = useMutation({
    mutationFn: () => adminFetch("/api/admin/products/seo-bulk-generate", {
      method: "POST", body: JSON.stringify({ limit: bulkLimit, overwrite: bulkOverwrite }),
    }),
    onSuccess: (d: any) => {
      toast({ title: "Bulk generation done", description: `${d.ok} ok · ${d.failed} failed (of ${d.processed})` });
      refetch();
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const filtered = (audit?.items || []).filter((p) =>
    !filter ? true : (p.name + " " + (p.slug || "")).toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="space-y-4">
      {/* Summary */}
      {audit && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          <Stat label="Avg score" value={audit.averageScore} suffix="/100" />
          <Stat label="Products" value={audit.totalProducts} />
          <Stat label="No meta" value={audit.productsWithoutMeta} warn />
          <Stat label="With FAQ" value={audit.productsWithFaq} />
          <Stat label="With video" value={audit.productsWithVideo} />
        </div>
      )}

      {/* Bulk generator */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base flex items-center gap-2"><Wand2 className="h-4 w-4 text-[#6D2B35]" /> Bulk AI generate product SEO</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap items-end gap-3">
          <div>
            <Label htmlFor="bulk-limit" className="text-xs">Batch size</Label>
            <Input id="bulk-limit" type="number" min={1} max={50} value={bulkLimit}
              onChange={(e) => setBulkLimit(Math.max(1, Math.min(50, parseInt(e.target.value || "1"))))}
              data-testid="input-bulk-limit" className="w-32" />
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={bulkOverwrite} onCheckedChange={setBulkOverwrite} id="bulk-ow" />
            <Label htmlFor="bulk-ow" className="text-sm cursor-pointer">Overwrite existing</Label>
          </div>
          <Button onClick={() => bulk.mutate()} disabled={bulk.isPending} className="bg-[#6D2B35] hover:bg-[#5a2129]" data-testid="button-bulk-product-seo">
            <Sparkles className="h-4 w-4 mr-2" /> {bulk.isPending ? "Generating…" : "Generate now"}
          </Button>
        </CardContent>
      </Card>

      {/* List */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="text-base">Per-product SEO</CardTitle>
            <div className="relative w-full sm:w-72">
              <Search className="h-4 w-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={filter} onChange={(e) => setFilter(e.target.value)} placeholder="Filter products…" className="pl-8" data-testid="input-product-seo-filter" />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : (
            <ScrollArea className="h-[520px] pr-2">
              <div className="space-y-1.5">
                {filtered.map((p) => (
                  <div key={p.id} className="rounded-md border bg-card p-3 flex items-center gap-3" data-testid={`row-prod-seo-${p.id}`}>
                    <div className={`text-lg font-semibold w-12 text-center ${gradeColor(p.grade)}`}>{p.grade}</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{p.name}</div>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap items-center gap-2">
                        <span className="truncate">{p.path}</span>
                        <span>·</span><span>{p.score}/100</span>
                        {!p.hasMeta && <Badge variant="outline" className="h-4 text-[9px]">no meta</Badge>}
                        {p.hasFaq && <Badge variant="secondary" className="h-4 text-[9px] gap-1"><FileQuestion className="h-2.5 w-2.5" />FAQ</Badge>}
                        {p.hasVideo && <Badge variant="secondary" className="h-4 text-[9px] gap-1"><Video className="h-2.5 w-2.5" />Video</Badge>}
                        {p.focusKeyword && <Badge variant="secondary" className="h-4 text-[9px]">"{p.focusKeyword}"</Badge>}
                      </div>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(p.id)} data-testid={`button-edit-prod-seo-${p.id}`}>
                      <Pencil className="h-3.5 w-3.5 mr-1.5" /> Edit
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <a href={p.path} target="_blank" rel="noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                    </Button>
                  </div>
                ))}
                {filtered.length === 0 && <div className="py-12 text-center text-sm text-muted-foreground">No products match.</div>}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {editingId !== null && (
        <ProductSeoEditor productId={editingId} adminFetch={adminFetch} onClose={() => { setEditingId(null); refetch(); }} />
      )}
    </div>
  );
}

function gradeColor(g: string) {
  if (g === "A+" || g === "A") return "text-green-600 dark:text-green-400";
  if (g === "B") return "text-emerald-600 dark:text-emerald-400";
  if (g === "C") return "text-amber-600 dark:text-amber-400";
  if (g === "D") return "text-orange-600 dark:text-orange-400";
  return "text-red-600 dark:text-red-400";
}

function Stat({ label, value, warn, suffix }: { label: string; value: number; warn?: boolean; suffix?: string }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={`text-xl font-semibold mt-0.5 ${warn && value > 0 ? "text-amber-600 dark:text-amber-400" : ""}`}>
        {value}{suffix && <span className="text-xs text-muted-foreground">{suffix}</span>}
      </div>
    </div>
  );
}

function ProductSeoEditor({ productId, adminFetch, onClose }: { productId: number; adminFetch: any; onClose: () => void }) {
  const { toast } = useToast();
  const { data, isLoading } = useQuery<any>({
    queryKey: ["/api/admin/products", productId, "seo"],
    queryFn: () => adminFetch(`/api/admin/products/${productId}/seo`),
  });
  const [form, setForm] = useState<any>(null);

  // Initialize form once data arrives
  if (data && !form) {
    setForm({
      seoFocusKeyword: data.product.seoFocusKeyword || "",
      seoVideoUrl: data.product.seoVideoUrl || "",
      seoFaq: Array.isArray(data.product.seoFaq) ? data.product.seoFaq : [],
      metaTitle: data.seoPage?.metaTitle || "",
      metaDescription: data.seoPage?.metaDescription || "",
      metaKeywords: data.seoPage?.metaKeywords || "",
      ogImage: data.seoPage?.ogImage || "",
      canonicalUrl: data.seoPage?.canonicalUrl || "",
      h1Override: data.seoPage?.h1Override || "",
      robotsIndex: data.seoPage?.robotsIndex ?? true,
      robotsFollow: data.seoPage?.robotsFollow ?? true,
    });
  }

  const save = useMutation({
    mutationFn: async () => adminFetch(`/api/admin/products/${productId}/seo`, {
      method: "PATCH",
      body: JSON.stringify({
        seoFocusKeyword: form.seoFocusKeyword || null,
        seoVideoUrl: form.seoVideoUrl || null,
        seoFaq: form.seoFaq.length > 0 ? form.seoFaq : null,
        seoPage: {
          metaTitle: form.metaTitle, metaDescription: form.metaDescription,
          metaKeywords: form.metaKeywords, ogImage: form.ogImage || null,
          canonicalUrl: form.canonicalUrl || null, h1Override: form.h1Override || null,
          robotsIndex: form.robotsIndex, robotsFollow: form.robotsFollow,
        },
      }),
    }),
    onSuccess: () => {
      toast({ title: "SEO saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/products/seo-audit"] });
      onClose();
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const aiGen = useMutation({
    mutationFn: async () => adminFetch(`/api/admin/products/${productId}/seo/generate`, { method: "POST", body: JSON.stringify({}) }),
    onSuccess: (d: any) => {
      const ai = d.ai;
      setForm((f: any) => ({
        ...f,
        metaTitle: ai.metaTitle || ai.title || f.metaTitle,
        metaDescription: ai.metaDescription || ai.description || f.metaDescription,
        metaKeywords: typeof ai.metaKeywords === "string"
          ? ai.metaKeywords
          : Array.isArray(ai.keywords) ? ai.keywords.join(", ")
          : (ai.metaKeywords ? String(ai.metaKeywords) : f.metaKeywords),
        ogImage: ai.ogImage || f.ogImage,
      }));
      toast({ title: "AI suggestions filled" });
    },
    onError: (e: any) => toast({ title: "AI generation failed", description: e?.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Product SEO Editor</DialogTitle></DialogHeader>
        {isLoading || !form ? (
          <div className="py-10 text-center text-muted-foreground">Loading…</div>
        ) : (
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">{data.product.name} · <code className="text-xs">{data.product.path}</code></div>

            <div className="flex justify-end">
              <Button size="sm" variant="outline" onClick={() => aiGen.mutate()} disabled={aiGen.isPending} data-testid="button-ai-fill-product">
                <Sparkles className="h-3.5 w-3.5 mr-1.5" /> {aiGen.isPending ? "Generating…" : "Fill with AI"}
              </Button>
            </div>

            <Field label="Focus keyword (1 primary keyword you want to rank for)">
              <Input value={form.seoFocusKeyword} onChange={(e) => setForm({ ...form, seoFocusKeyword: e.target.value })} placeholder="e.g. 5 Mukhi Rudraksha original" data-testid="input-focus-keyword" />
            </Field>

            <Field label={`Meta title (${form.metaTitle.length}/60)`}>
              <Input value={form.metaTitle} onChange={(e) => setForm({ ...form, metaTitle: e.target.value })} maxLength={70} data-testid="input-meta-title" />
            </Field>

            <Field label={`Meta description (${form.metaDescription.length}/160)`}>
              <Textarea value={form.metaDescription} onChange={(e) => setForm({ ...form, metaDescription: e.target.value })} maxLength={200} rows={3} data-testid="input-meta-desc" />
            </Field>

            <div className="grid sm:grid-cols-2 gap-3">
              <Field label="Meta keywords (comma-sep)">
                <Input value={form.metaKeywords} onChange={(e) => setForm({ ...form, metaKeywords: e.target.value })} data-testid="input-meta-kw" />
              </Field>
              <Field label="H1 override">
                <Input value={form.h1Override} onChange={(e) => setForm({ ...form, h1Override: e.target.value })} data-testid="input-h1" />
              </Field>
              <Field label="Canonical URL">
                <Input value={form.canonicalUrl} onChange={(e) => setForm({ ...form, canonicalUrl: e.target.value })} placeholder="https://…" data-testid="input-canonical" />
              </Field>
              <Field label="OG image URL">
                <Input value={form.ogImage} onChange={(e) => setForm({ ...form, ogImage: e.target.value })} placeholder="https://… or /uploads/…" data-testid="input-og-image" />
              </Field>
              <Field label="YouTube/video URL">
                <Input value={form.seoVideoUrl} onChange={(e) => setForm({ ...form, seoVideoUrl: e.target.value })} placeholder="https://youtu.be/…" data-testid="input-video-url" />
              </Field>
              <div className="flex items-center gap-4 mt-5">
                <div className="flex items-center gap-2">
                  <Switch checked={form.robotsIndex} onCheckedChange={(v) => setForm({ ...form, robotsIndex: v })} id="r-index" />
                  <Label htmlFor="r-index" className="text-sm cursor-pointer">Index</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={form.robotsFollow} onCheckedChange={(v) => setForm({ ...form, robotsFollow: v })} id="r-follow" />
                  <Label htmlFor="r-follow" className="text-sm cursor-pointer">Follow</Label>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-semibold flex items-center gap-2"><FileQuestion className="h-4 w-4" /> FAQ schema</h4>
                <Button size="sm" variant="outline" onClick={() => setForm({ ...form, seoFaq: [...form.seoFaq, { question: "", answer: "" }] })} data-testid="button-add-faq">
                  <Plus className="h-3.5 w-3.5 mr-1" /> Add FAQ
                </Button>
              </div>
              <div className="space-y-2">
                {form.seoFaq.map((faq: FaqItem, i: number) => (
                  <div key={i} className="rounded-md border p-2 space-y-2 bg-muted/30">
                    <div className="flex gap-2">
                      <Input value={faq.question} onChange={(e) => {
                        const next = [...form.seoFaq]; next[i].question = e.target.value; setForm({ ...form, seoFaq: next });
                      }} placeholder="Question" data-testid={`input-faq-q-${i}`} />
                      <Button size="icon" variant="ghost" onClick={() => {
                        setForm({ ...form, seoFaq: form.seoFaq.filter((_: any, j: number) => j !== i) });
                      }} data-testid={`button-del-faq-${i}`}>
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                    <Textarea value={faq.answer} onChange={(e) => {
                      const next = [...form.seoFaq]; next[i].answer = e.target.value; setForm({ ...form, seoFaq: next });
                    }} placeholder="Answer" rows={2} data-testid={`input-faq-a-${i}`} />
                  </div>
                ))}
                {form.seoFaq.length === 0 && <p className="text-xs text-muted-foreground">No FAQs yet — adding 3-5 helps Google show rich FAQ snippets.</p>}
              </div>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="button-cancel-prod-seo">Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending || !form} className="bg-[#6D2B35] hover:bg-[#5a2129]" data-testid="button-save-prod-seo">
            {save.isPending ? "Saving…" : "Save SEO"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <Label className="text-xs">{label}</Label>
      <div className="mt-1">{children}</div>
    </div>
  );
}
