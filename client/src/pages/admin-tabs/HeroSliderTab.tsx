import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit, ArrowUp, ArrowDown, Sparkles, ImagePlus,
  Upload, Wand2, Image as ImageIcon, Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { HeroSlide } from "@shared/schema";
import { createFetcher } from "../admin-shared";

const ICON_OPTIONS = [
  "ShoppingBag", "Sparkles", "UserCheck", "HandHeart", "Star",
  "Map", "MapPinned", "Gem", "Calendar", "Heart",
];

type FormState = {
  imageUrl: string;
  imageAlt: string;
  mobilePosition: string;
  tagline: string;
  title1: string;
  title2: string;
  title2Highlight: string;
  subtitle: string;
  cta1Label: string;
  cta1Href: string;
  cta1Icon: string;
  cta2Label: string;
  cta2Href: string;
  cta2Icon: string;
  enabled: boolean;
};

const blankForm = (): FormState => ({
  imageUrl: "",
  imageAlt: "",
  mobilePosition: "center center",
  tagline: "",
  title1: "",
  title2: "",
  title2Highlight: "",
  subtitle: "",
  cta1Label: "Shop Now",
  cta1Href: "/puja-samagri-online",
  cta1Icon: "ShoppingBag",
  cta2Label: "Learn More",
  cta2Href: "/about",
  cta2Icon: "Sparkles",
  enabled: true,
});

function HeroSliderTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: slides, isLoading } = useQuery<HeroSlide[]>({
    queryKey: ["/api/admin/hero-slides"],
    queryFn: () => fetcher("/api/admin/hero-slides"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<HeroSlide | null>(null);
  const [form, setForm] = useState<FormState>(blankForm());

  // AI generation panel state
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "gemini">("openai");
  const [aiSize, setAiSize] = useState("1792x1024");
  const [aiBusy, setAiBusy] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadBusy, setUploadBusy] = useState(false);

  const openCreate = () => {
    setEditing(null);
    setForm(blankForm());
    setAiPrompt("");
    setDialogOpen(true);
  };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({
      imageUrl: s.imageUrl ?? "",
      imageAlt: s.imageAlt ?? "",
      mobilePosition: s.mobilePosition ?? "center center",
      tagline: s.tagline ?? "",
      title1: s.title1 ?? "",
      title2: s.title2 ?? "",
      title2Highlight: s.title2Highlight ?? "",
      subtitle: s.subtitle ?? "",
      cta1Label: s.cta1Label ?? "",
      cta1Href: s.cta1Href ?? "",
      cta1Icon: s.cta1Icon ?? "ShoppingBag",
      cta2Label: s.cta2Label ?? "",
      cta2Href: s.cta2Href ?? "",
      cta2Icon: s.cta2Icon ?? "Sparkles",
      enabled: s.enabled ?? true,
    });
    setAiPrompt("");
    setDialogOpen(true);
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
    qc.invalidateQueries({ queryKey: ["/api/hero-slides"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.imageUrl.trim()) throw new Error("An image is required. Upload or generate one first.");
      const url = editing ? `/api/admin/hero-slides/${editing.id}` : `/api/admin/hero-slides`;
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(form),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j?.message || `Save failed (${res.status})`);
      }
      return res.json();
    },
    onSuccess: () => {
      invalidate();
      setDialogOpen(false);
      toast({ title: editing ? "Slide updated" : "Slide created" });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message || "Failed", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Error", description: "Failed to toggle.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/admin/hero-slides/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: "Slide deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch(`/api/admin/hero-slides/reorder`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ ids }),
      });
      if (!res.ok) throw new Error("Reorder failed");
      return res.json();
    },
    onSuccess: invalidate,
    onError: () => toast({ title: "Error", description: "Failed to reorder.", variant: "destructive" }),
  });

  const move = (idx: number, dir: -1 | 1) => {
    if (!slides) return;
    const j = idx + dir;
    if (j < 0 || j >= slides.length) return;
    const ids = slides.map(s => s.id);
    [ids[idx], ids[j]] = [ids[j], ids[idx]];
    reorderMutation.mutate(ids);
  };

  const handleUpload = async (file: File) => {
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`/api/admin/hero-slides/upload-image`, {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Upload failed");
      setForm(f => ({ ...f, imageUrl: j.url }));
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setUploadBusy(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < 4) {
      toast({ title: "Prompt too short", description: "Describe the image you want in at least a few words.", variant: "destructive" });
      return;
    }
    setAiBusy(true);
    try {
      const res = await fetch(`/api/admin/hero-slides/generate-image`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ prompt, provider: aiProvider, size: aiSize }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Generation failed");
      setForm(f => ({ ...f, imageUrl: j.url }));
      toast({ title: `Image generated`, description: `Provider: ${aiProvider}` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-hero-slider">Hero Slider</h1>
          <p className="text-sm text-muted-foreground">
            Homepage hero carousel. Upload images, generate with AI (OpenAI / Gemini), reorder, enable per slide.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white gap-2" data-testid="btn-new-hero-slide">
          <Plus className="w-4 h-4" /> New Slide
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : !slides?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hero slides yet. Create one — until you do, the site falls back to bundled default slides.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slides.map((s, idx) => (
            <Card key={s.id} className="bg-card border-border" data-testid={`card-hero-slide-${s.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  <div className="w-28 h-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.imageAlt || ""} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                        <ImageIcon className="w-5 h-5" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      <h3 className="font-serif text-lg text-primary truncate" data-testid={`text-hero-title-${s.id}`}>
                        {s.title1 || s.tagline || "(untitled slide)"}
                      </h3>
                      {!s.enabled && <Badge className="bg-muted text-muted-foreground">Disabled</Badge>}
                    </div>
                    {s.subtitle && <p className="text-sm text-muted-foreground line-clamp-2">{s.subtitle}</p>}
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap pt-1">
                      {s.cta1Label && <span>CTA 1: {s.cta1Label} → {s.cta1Href}</span>}
                      {s.cta2Label && <span>CTA 2: {s.cta2Label} → {s.cta2Href}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="icon" variant="outline" disabled={idx === 0 || reorderMutation.isPending}
                      onClick={() => move(idx, -1)} data-testid={`btn-up-${s.id}`} aria-label="Move up">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" disabled={idx === slides.length - 1 || reorderMutation.isPending}
                      onClick={() => move(idx, 1)} data-testid={`btn-down-${s.id}`} aria-label="Move down">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={s.enabled}
                        onCheckedChange={(checked) => toggleMutation.mutate({ id: s.id, enabled: checked })}
                        data-testid={`switch-hero-enabled-${s.id}`}
                      />
                      <span className="text-xs text-muted-foreground">{s.enabled ? "On" : "Off"}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)} data-testid={`btn-edit-hero-${s.id}`}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" data-testid={`btn-delete-hero-${s.id}`}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
                          <AlertDialogDescription>This removes the slide permanently. The uploaded image stays on disk.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteMutation.mutate(s.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Hero Slide" : "New Hero Slide"}</DialogTitle>
            <DialogDescription>Configure the image, copy, and two call-to-action buttons for this slide.</DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-2">
            {/* Image picker */}
            <Card className="bg-card border-border">
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <ImagePlus className="w-4 h-4 text-primary" />
                  <h3 className="font-medium">Image</h3>
                </div>

                {form.imageUrl ? (
                  <div className="relative w-full aspect-[16/9] rounded-md overflow-hidden border bg-muted">
                    <img src={form.imageUrl} alt="Slide preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-full aspect-[16/9] rounded-md border border-dashed bg-muted flex items-center justify-center text-muted-foreground text-sm">
                    No image yet — upload one or generate with AI below.
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Image URL</Label>
                  <Input
                    value={form.imageUrl}
                    onChange={(e) => setForm(f => ({ ...f, imageUrl: e.target.value }))}
                    placeholder="/uploads/hero/... or absolute URL"
                    data-testid="input-hero-image-url"
                  />
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  {/* Upload */}
                  <div className="space-y-2">
                    <Label className="text-xs">Upload from disk</Label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      hidden
                      onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
                    />
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      disabled={uploadBusy}
                      onClick={() => fileInputRef.current?.click()}
                      data-testid="btn-hero-upload"
                    >
                      {uploadBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                      {uploadBusy ? "Uploading..." : "Choose file"}
                    </Button>
                  </div>

                  {/* AI Generate */}
                  <div className="space-y-2">
                    <Label className="text-xs">Generate with AI</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as any)}>
                        <SelectTrigger data-testid="select-hero-ai-provider"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="openai">OpenAI (gpt-image-1)</SelectItem>
                          <SelectItem value="gemini">Gemini (Imagen 3)</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={aiSize} onValueChange={setAiSize}>
                        <SelectTrigger data-testid="select-hero-ai-size"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1792x1024">16:9 wide (hero)</SelectItem>
                          <SelectItem value="1024x1024">1:1 square</SelectItem>
                          <SelectItem value="1024x1536">2:3 portrait</SelectItem>
                          <SelectItem value="1536x1024">3:2 landscape</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>AI prompt</Label>
                  <Textarea
                    rows={3}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="A Vedic pandit performing Rudrabhishek with brass kalash, diyas, and rudraksha mala. Warm golden light, photorealistic, cinematic, 16:9 hero banner."
                    data-testid="input-hero-ai-prompt"
                  />
                  <Button
                    onClick={handleGenerate}
                    disabled={aiBusy || aiPrompt.trim().length < 4}
                    className="gap-2 bg-primary text-white"
                    data-testid="btn-hero-generate"
                  >
                    {aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
                    {aiBusy ? "Generating..." : "Generate Image"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Copy */}
            <div className="grid sm:grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Image alt text</Label>
                <Input value={form.imageAlt} onChange={(e) => setForm(f => ({ ...f, imageAlt: e.target.value }))} placeholder="Vedic Pandit performing puja" data-testid="input-hero-alt" />
              </div>
              <div className="space-y-2">
                <Label>Mobile crop position</Label>
                <Select value={form.mobilePosition} onValueChange={(v) => setForm(f => ({ ...f, mobilePosition: v }))}>
                  <SelectTrigger data-testid="select-hero-mobile-pos"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="center center">Center</SelectItem>
                    <SelectItem value="center top">Top</SelectItem>
                    <SelectItem value="center bottom">Bottom</SelectItem>
                    <SelectItem value="left center">Left</SelectItem>
                    <SelectItem value="right center">Right</SelectItem>
                    <SelectItem value="25% center">25% left</SelectItem>
                    <SelectItem value="75% center">75% right</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Tagline (small uppercase line above title)</Label>
                <Input value={form.tagline} onChange={(e) => setForm(f => ({ ...f, tagline: e.target.value }))} placeholder="SHOP PUJA SAMAGRI" data-testid="input-hero-tagline" />
              </div>
              <div className="space-y-2">
                <Label>Headline line 1</Label>
                <Input value={form.title1} onChange={(e) => setForm(f => ({ ...f, title1: e.target.value }))} placeholder="Shop Puja Samagri" data-testid="input-hero-title1" />
              </div>
              <div className="space-y-2">
                <Label>Headline line 2 (prefix)</Label>
                <Input value={form.title2} onChange={(e) => setForm(f => ({ ...f, title2: e.target.value }))} placeholder="& Puja Essentials " data-testid="input-hero-title2" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Headline line 2 (gold highlight word)</Label>
                <Input value={form.title2Highlight} onChange={(e) => setForm(f => ({ ...f, title2Highlight: e.target.value }))} placeholder="Online" data-testid="input-hero-title2hl" />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label>Subtitle</Label>
                <Textarea rows={2} value={form.subtitle} onChange={(e) => setForm(f => ({ ...f, subtitle: e.target.value }))} placeholder="Buy puja kits, havan samagri, diyas..." data-testid="input-hero-subtitle" />
              </div>
            </div>

            {/* CTAs */}
            <div className="grid sm:grid-cols-2 gap-4">
              {[1, 2].map((n) => {
                const labelKey = `cta${n}Label` as keyof FormState;
                const hrefKey = `cta${n}Href` as keyof FormState;
                const iconKey = `cta${n}Icon` as keyof FormState;
                return (
                  <Card key={n} className="bg-card border-border">
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        <h4 className="font-medium">CTA Button {n}</h4>
                      </div>
                      <div className="space-y-2">
                        <Label>Label</Label>
                        <Input value={form[labelKey] as string} onChange={(e) => setForm(f => ({ ...f, [labelKey]: e.target.value }))} data-testid={`input-hero-cta${n}-label`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Link</Label>
                        <Input value={form[hrefKey] as string} onChange={(e) => setForm(f => ({ ...f, [hrefKey]: e.target.value }))} placeholder="/puja-samagri-online" data-testid={`input-hero-cta${n}-href`} />
                      </div>
                      <div className="space-y-2">
                        <Label>Icon</Label>
                        <Select value={form[iconKey] as string} onValueChange={(v) => setForm(f => ({ ...f, [iconKey]: v }))}>
                          <SelectTrigger data-testid={`select-hero-cta${n}-icon`}><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <div className="flex items-center gap-3">
              <Switch checked={form.enabled} onCheckedChange={(checked) => setForm(f => ({ ...f, enabled: checked }))} data-testid="switch-hero-enabled" />
              <Label>Enabled (show on homepage)</Label>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.imageUrl.trim()}
              className="bg-primary text-white"
              data-testid="btn-save-hero-slide"
            >
              {saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Create Slide"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HeroSliderTab;
