import { useState, useRef, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus, Trash2, Edit, ArrowUp, ArrowDown, Sparkles, ImagePlus,
  Upload, Wand2, Image as ImageIcon, Loader2, Monitor, Smartphone,
  Library, Crosshair, ChevronDown, ChevronUp, Eye, EyeOff,
  RefreshCw, Zap, ArrowRight, X, CheckCircle2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import type { HeroSlide } from "@shared/schema";
import { createFetcher } from "../admin-shared";

const ICON_OPTIONS = [
  "ShoppingBag", "Sparkles", "UserCheck", "HandHeart", "Star",
  "Map", "MapPinned", "Gem", "Calendar", "Heart", "Flame",
  "Sun", "Moon", "Music", "BookOpen", "Gift",
];

const MOBILE_POSITION_OPTIONS = [
  { label: "Center", value: "center center" },
  { label: "Top", value: "center top" },
  { label: "Bottom", value: "center bottom" },
  { label: "Left", value: "left center" },
  { label: "Right", value: "right center" },
  { label: "25% left", value: "25% center" },
  { label: "75% right", value: "75% center" },
];

type FormState = {
  imageUrl: string;
  imageAlt: string;
  mobileImageUrl: string;
  mobilePosition: string;
  focalX: number;
  focalY: number;
  overlayOpacity: number;
  mobileOverlayOpacity: number;
  tagline: string;
  title1: string;
  title2: string;
  title2Highlight: string;
  subtitle: string;
  cta1Label: string;
  cta1Href: string;
  cta1Icon: string;
  cta1Style: "filled" | "outline";
  cta2Label: string;
  cta2Href: string;
  cta2Icon: string;
  cta2Style: "filled" | "outline";
  enabled: boolean;
};

const blankForm = (): FormState => ({
  imageUrl: "",
  imageAlt: "",
  mobileImageUrl: "",
  mobilePosition: "center center",
  focalX: 50,
  focalY: 50,
  overlayOpacity: 50,
  mobileOverlayOpacity: 60,
  tagline: "",
  title1: "",
  title2: "",
  title2Highlight: "",
  subtitle: "",
  cta1Label: "Shop Now",
  cta1Href: "/puja-samagri-online",
  cta1Icon: "ShoppingBag",
  cta1Style: "filled",
  cta2Label: "Learn More",
  cta2Href: "/about",
  cta2Icon: "Sparkles",
  cta2Style: "outline",
  enabled: true,
});

type LibraryImage = { filename: string; url: string; sizeBytes: number; mtime: number };

/* ── Focal Point Picker ── */
function FocalPicker({
  imageUrl, focalX, focalY, onChange,
}: { imageUrl: string; focalX: number; focalY: number; onChange: (x: number, y: number) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = Math.round(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.round(((e.clientY - rect.top) / rect.height) * 100);
    onChange(Math.max(0, Math.min(100, x)), Math.max(0, Math.min(100, y)));
  }, [onChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Crosshair className="w-4 h-4 text-primary" />
        <span className="text-sm font-medium">Focal Point</span>
        <span className="text-xs text-muted-foreground ml-auto">({focalX}%, {focalY}%) — click image to set</span>
      </div>
      <div
        ref={containerRef}
        className="relative w-full aspect-[16/9] rounded-md overflow-hidden border cursor-crosshair bg-muted"
        onClick={handleClick}
        data-testid="focal-picker"
      >
        {imageUrl ? (
          <img src={imageUrl} alt="" className="w-full h-full object-cover pointer-events-none" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">
            Set image first, then click to pick focal point
          </div>
        )}
        {imageUrl && (
          <>
            {/* crosshair lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-0 bottom-0 w-px bg-white/40" style={{ left: `${focalX}%` }} />
              <div className="absolute left-0 right-0 h-px bg-white/40" style={{ top: `${focalY}%` }} />
              <div
                className="absolute w-5 h-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow-lg bg-primary/60"
                style={{ left: `${focalX}%`, top: `${focalY}%` }}
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Live Slide Preview ── */
function SlidePreview({ form, mode }: { form: FormState; mode: "desktop" | "mobile" }) {
  const isDesktop = mode === "desktop";
  const imageUrl = !isDesktop && form.mobileImageUrl ? form.mobileImageUrl : form.imageUrl;
  const opacity = (isDesktop ? form.overlayOpacity : form.mobileOverlayOpacity) / 100;

  return (
    <div
      className={`relative overflow-hidden rounded-lg border bg-gray-900 ${isDesktop ? "aspect-[16/9] w-full" : "aspect-[9/16] max-w-[180px] mx-auto"}`}
    >
      {imageUrl ? (
        <img
          src={imageUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          style={{ objectPosition: `${form.focalX}% ${form.focalY}%` }}
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center text-white/40 text-xs">No image</div>
      )}
      <div className="absolute inset-0" style={{ background: `rgba(0,0,0,${opacity})` }} />
      <div className={`absolute inset-0 flex flex-col justify-center ${isDesktop ? "px-10 max-w-[60%]" : "px-4 pb-6 justify-end"}`}>
        {form.tagline && (
          <p className="text-[8px] uppercase tracking-[0.2em] text-amber-300 font-bold mb-1 truncate">{form.tagline}</p>
        )}
        {form.title1 && (
          <p className={`font-bold text-white leading-tight mb-0.5 truncate ${isDesktop ? "text-sm" : "text-[10px]"}`}>{form.title1}</p>
        )}
        {(form.title2 || form.title2Highlight) && (
          <p className={`font-bold leading-tight mb-1 truncate ${isDesktop ? "text-sm" : "text-[10px]"}`}>
            <span className="text-white">{form.title2}</span>
            <span className="text-amber-400"> {form.title2Highlight}</span>
          </p>
        )}
        {form.subtitle && (
          <p className={`text-white/70 mb-2 line-clamp-2 ${isDesktop ? "text-[8px]" : "text-[7px]"}`}>{form.subtitle}</p>
        )}
        <div className="flex gap-1.5 flex-wrap">
          {form.cta1Label && (
            <span className={`text-[7px] font-semibold px-2 py-0.5 rounded-full ${form.cta1Style === "filled" ? "bg-amber-500 text-black" : "border border-white/60 text-white"}`}>
              {form.cta1Label}
            </span>
          )}
          {form.cta2Label && (
            <span className={`text-[7px] font-semibold px-2 py-0.5 rounded-full ${form.cta2Style === "filled" ? "bg-amber-500 text-black" : "border border-white/60 text-white"}`}>
              {form.cta2Label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Image Library Panel ── */
function ImageLibraryPanel({
  adminToken, onPick, onClose,
}: { adminToken: string; onPick: (url: string) => void; onClose: () => void }) {
  const { data, isLoading } = useQuery<{ images: LibraryImage[] }>({
    queryKey: ["/api/admin/hero-slides/library"],
    queryFn: () => fetch("/api/admin/hero-slides/library", { headers: { "x-admin-token": adminToken } }).then(r => r.json()),
  });

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardContent className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Library className="w-4 h-4 text-primary" />
            <span className="font-medium text-sm">Image Library</span>
          </div>
          <Button size="icon" variant="ghost" onClick={onClose} className="h-7 w-7">
            <X className="w-3.5 h-3.5" />
          </Button>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-video rounded" />)}
          </div>
        ) : !data?.images?.length ? (
          <p className="text-xs text-muted-foreground text-center py-4">No images uploaded yet. Upload one first.</p>
        ) : (
          <div className="grid grid-cols-4 gap-2 max-h-52 overflow-y-auto pr-1">
            {data.images.map((img) => (
              <button
                key={img.url}
                type="button"
                onClick={() => { onPick(img.url); onClose(); }}
                className="group relative aspect-video rounded overflow-hidden border border-border hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition-all"
                title={img.filename}
                data-testid={`lib-img-${img.filename}`}
              >
                <img src={img.url} alt={img.filename} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            ))}
          </div>
        )}
        <p className="text-[10px] text-muted-foreground">{data?.images?.length ?? 0} images · Click to select</p>
      </CardContent>
    </Card>
  );
}

/* ── AI Generation Panel ── */
function AIGenerationPanel({
  adminToken, form, onImageGenerated, targetField,
}: {
  adminToken: string;
  form: FormState;
  onImageGenerated: (url: string) => void;
  targetField: "desktop" | "mobile";
}) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "gemini">("openai");
  const [aiSize, setAiSize] = useState(targetField === "mobile" ? "1024x1536" : "1536x1024");
  const [aiBusy, setAiBusy] = useState(false);
  const { toast } = useToast();

  const autoPrompt = () => {
    const parts: string[] = [];
    if (form.tagline) parts.push(form.tagline.toLowerCase());
    if (form.title1) parts.push(form.title1);
    if (form.title2Highlight) parts.push(form.title2Highlight);
    if (form.subtitle) parts.push(form.subtitle);
    const base = parts.filter(Boolean).join(" — ");
    const suffix = targetField === "mobile"
      ? "Vedic spiritual background, warm golden bokeh, portrait 9:16, photorealistic, premium cinematic."
      : "Vedic spiritual scene, warm temple light, incense smoke, brass diyas, panoramic 16:9 hero banner, photorealistic, cinematic.";
    setAiPrompt(base ? `${base}. ${suffix}` : suffix);
  };

  const handleGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < 4) { toast({ title: "Prompt too short", variant: "destructive" }); return; }
    setAiBusy(true);
    try {
      const res = await fetch("/api/admin/hero-slides/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ prompt, provider: aiProvider, size: aiSize }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Generation failed");
      onImageGenerated(j.url);
      toast({ title: "Image generated", description: `${aiProvider} · saved to library` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as any)}>
          <SelectTrigger data-testid={`select-ai-provider-${targetField}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI (gpt-image-1)</SelectItem>
            <SelectItem value="gemini">Gemini (Imagen 3)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={aiSize} onValueChange={setAiSize}>
          <SelectTrigger data-testid={`select-ai-size-${targetField}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1536x1024">16:9 landscape (desktop)</SelectItem>
            <SelectItem value="1024x1024">1:1 square</SelectItem>
            <SelectItem value="1024x1536">2:3 portrait (mobile)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        rows={3}
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
        placeholder="A Vedic pandit performing Rudrabhishek with brass kalash, diyas, and rudraksha mala. Warm golden light, cinematic 16:9 hero banner."
        data-testid={`input-ai-prompt-${targetField}`}
      />
      <div className="flex gap-2 flex-wrap">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={autoPrompt}
          className="gap-1.5 text-xs"
          data-testid={`btn-auto-prompt-${targetField}`}
        >
          <Zap className="w-3.5 h-3.5 text-amber-500" />
          Auto-fill from slide content
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={aiBusy || aiPrompt.trim().length < 4}
          className="gap-1.5 bg-primary text-white text-xs flex-1"
          data-testid={`btn-generate-${targetField}`}
        >
          {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {aiBusy ? "Generating…" : "Generate Image"}
        </Button>
      </div>
    </div>
  );
}

/* ── Image Source Panel ── */
function ImageSourcePanel({
  label, imageUrl, onUrlChange, adminToken, targetField,
}: {
  label: string;
  imageUrl: string;
  onUrlChange: (url: string) => void;
  adminToken: string;
  targetField: "desktop" | "mobile";
}) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const [expanded, setExpanded] = useState(!imageUrl);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUpload = async (file: File) => {
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/hero-slides/upload-image", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Upload failed");
      onUrlChange(j.url);
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => setExpanded(v => !v)}
        className="w-full flex items-center justify-between text-sm font-medium hover:text-primary transition-colors"
        data-testid={`toggle-image-source-${targetField}`}
      >
        <span className="flex items-center gap-2">
          {targetField === "desktop" ? <Monitor className="w-4 h-4 text-primary" /> : <Smartphone className="w-4 h-4 text-primary" />}
          {label}
        </span>
        {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {expanded && (
        <div className="space-y-3 pl-2 border-l-2 border-primary/20">
          {/* Preview thumbnail */}
          {imageUrl && (
            <div className={`relative rounded-md overflow-hidden border bg-muted ${targetField === "desktop" ? "aspect-[16/9]" : "aspect-[9/16] max-w-[120px]"}`}>
              <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => onUrlChange("")}
                className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive transition-colors"
                data-testid={`btn-clear-image-${targetField}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* URL input */}
          <div className="space-y-1.5">
            <Label className="text-xs">Image URL</Label>
            <Input
              value={imageUrl}
              onChange={(e) => onUrlChange(e.target.value)}
              placeholder={targetField === "mobile" ? "/uploads/hero/mobile-... (optional)" : "/uploads/hero/..."}
              data-testid={`input-image-url-${targetField}`}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              hidden
              onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={uploadBusy}
              onClick={() => fileRef.current?.click()}
              className="gap-1.5 text-xs"
              data-testid={`btn-upload-${targetField}`}
            >
              {uploadBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              {uploadBusy ? "Uploading…" : "Upload"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowLibrary(v => !v)}
              className={`gap-1.5 text-xs ${showLibrary ? "border-primary text-primary" : ""}`}
              data-testid={`btn-library-${targetField}`}
            >
              <Library className="w-3.5 h-3.5" />
              Library
            </Button>
          </div>

          {showLibrary && (
            <ImageLibraryPanel
              adminToken={adminToken}
              onPick={onUrlChange}
              onClose={() => setShowLibrary(false)}
            />
          )}

          {/* AI generation */}
          <div className="pt-1 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1.5">
              <Sparkles className="w-3 h-3 text-amber-500" />
              Generate with AI
            </p>
            <AIGenerationPanel
              adminToken={adminToken}
              targetField={targetField}
              onImageGenerated={onUrlChange}
              form={{ tagline: "", title1: "", title2: "", title2Highlight: "", subtitle: "", imageUrl: "", imageAlt: "", mobileImageUrl: "", mobilePosition: "center center", focalX: 50, focalY: 50, overlayOpacity: 50, mobileOverlayOpacity: 60, cta1Label: "", cta1Href: "", cta1Icon: "", cta1Style: "filled", cta2Label: "", cta2Href: "", cta2Icon: "", cta2Style: "outline", enabled: true }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

/* ── AIGenerationPanel with form context ── */
function AIGenerationPanelWithForm({
  adminToken, form, onImageGenerated, targetField,
}: {
  adminToken: string;
  form: FormState;
  onImageGenerated: (url: string) => void;
  targetField: "desktop" | "mobile";
}) {
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiProvider, setAiProvider] = useState<"openai" | "gemini">("openai");
  const [aiSize, setAiSize] = useState(targetField === "mobile" ? "1024x1536" : "1536x1024");
  const [aiBusy, setAiBusy] = useState(false);
  const { toast } = useToast();

  const autoPrompt = () => {
    const parts: string[] = [];
    if (form.tagline) parts.push(form.tagline.toLowerCase());
    if (form.title1) parts.push(form.title1);
    if (form.title2) parts.push(form.title2);
    if (form.title2Highlight) parts.push(form.title2Highlight);
    if (form.subtitle) parts.push(form.subtitle.slice(0, 120));
    const base = parts.filter(Boolean).join(" — ");
    const suffix = targetField === "mobile"
      ? "Vedic spiritual, warm golden bokeh, portrait 9:16, photorealistic, premium cinematic."
      : "Vedic spiritual scene, warm temple light, incense smoke, brass diyas, panoramic 16:9 hero, photorealistic, cinematic.";
    setAiPrompt(base ? `${base}. ${suffix}` : suffix);
  };

  const handleGenerate = async () => {
    const prompt = aiPrompt.trim();
    if (prompt.length < 4) { toast({ title: "Prompt too short", variant: "destructive" }); return; }
    setAiBusy(true);
    try {
      const res = await fetch("/api/admin/hero-slides/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ prompt, provider: aiProvider, size: aiSize }),
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Generation failed");
      onImageGenerated(j.url);
      toast({ title: "Image generated ✓", description: `${aiProvider} · saved to library` });
    } catch (e: any) {
      toast({ title: "Generation failed", description: e?.message || "", variant: "destructive" });
    } finally { setAiBusy(false); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <Select value={aiProvider} onValueChange={(v) => setAiProvider(v as any)}>
          <SelectTrigger data-testid={`select-ai-provider-${targetField}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI (gpt-image-1)</SelectItem>
            <SelectItem value="gemini">Gemini (Imagen 3)</SelectItem>
          </SelectContent>
        </Select>
        <Select value={aiSize} onValueChange={setAiSize}>
          <SelectTrigger data-testid={`select-ai-size-${targetField}`}><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="1536x1024">16:9 landscape (desktop)</SelectItem>
            <SelectItem value="1024x1024">1:1 square</SelectItem>
            <SelectItem value="1024x1536">2:3 portrait (mobile)</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Textarea
        rows={3}
        value={aiPrompt}
        onChange={(e) => setAiPrompt(e.target.value)}
        placeholder="Describe the image you want. Be specific about mood, lighting, and elements."
        data-testid={`input-ai-prompt-ctx-${targetField}`}
      />
      <div className="flex gap-2 flex-wrap">
        <Button type="button" size="sm" variant="outline" onClick={autoPrompt} className="gap-1.5 text-xs" data-testid={`btn-auto-prompt-ctx-${targetField}`}>
          <Zap className="w-3.5 h-3.5 text-amber-500" /> Auto-fill from slide
        </Button>
        <Button
          type="button"
          size="sm"
          onClick={handleGenerate}
          disabled={aiBusy || aiPrompt.trim().length < 4}
          className="gap-1.5 bg-primary text-white text-xs flex-1"
          data-testid={`btn-generate-ctx-${targetField}`}
        >
          {aiBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5" />}
          {aiBusy ? "Generating…" : "Generate Image"}
        </Button>
      </div>
    </div>
  );
}

/* ── Upload + Library panel (context-aware) ── */
function ImagePanel({
  imageUrl, onUrlChange, adminToken, targetField, form,
}: {
  imageUrl: string;
  onUrlChange: (url: string) => void;
  adminToken: string;
  targetField: "desktop" | "mobile";
  form: FormState;
}) {
  const [showLibrary, setShowLibrary] = useState(false);
  const [uploadBusy, setUploadBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const qc = useQueryClient();

  const handleUpload = async (file: File) => {
    setUploadBusy(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch("/api/admin/hero-slides/upload-image", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: fd,
      });
      const j = await res.json();
      if (!res.ok) throw new Error(j?.message || "Upload failed");
      onUrlChange(j.url);
      qc.invalidateQueries({ queryKey: ["/api/admin/hero-slides/library"] });
      toast({ title: "Image uploaded" });
    } catch (e: any) {
      toast({ title: "Upload failed", description: e?.message || "", variant: "destructive" });
    } finally {
      setUploadBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-3">
      {/* Thumbnail */}
      {imageUrl && (
        <div className={`relative rounded-md overflow-hidden border bg-muted ${targetField === "desktop" ? "aspect-[16/9] w-full" : "aspect-[9/16] max-w-[160px]"}`}>
          <img src={imageUrl} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onUrlChange("")}
            className="absolute top-1 right-1 bg-black/60 rounded-full p-0.5 text-white hover:bg-destructive transition-colors"
            data-testid={`btn-clear-${targetField}`}
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      {!imageUrl && (
        <div className={`rounded-md border-2 border-dashed bg-muted/40 flex flex-col items-center justify-center text-muted-foreground text-xs gap-1 ${targetField === "desktop" ? "aspect-[16/9] w-full" : "aspect-[9/16] max-w-[160px]"}`}>
          <ImageIcon className="w-8 h-8 opacity-30" />
          {targetField === "mobile" ? "Optional portrait image" : "No image yet"}
        </div>
      )}

      {/* URL */}
      <div className="space-y-1.5">
        <Label className="text-xs text-muted-foreground">Image URL</Label>
        <Input
          value={imageUrl}
          onChange={(e) => onUrlChange(e.target.value)}
          placeholder={targetField === "mobile" ? "/uploads/hero/... (optional — uses desktop if blank)" : "/uploads/hero/..."}
          data-testid={`input-img-url-${targetField}`}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-wrap">
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp,image/gif,image/avif" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
        <Button type="button" variant="outline" size="sm" disabled={uploadBusy} onClick={() => fileRef.current?.click()} className="gap-1.5 text-xs" data-testid={`btn-upload-${targetField}`}>
          {uploadBusy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
          {uploadBusy ? "Uploading…" : "Upload"}
        </Button>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowLibrary(v => !v)} className={`gap-1.5 text-xs ${showLibrary ? "border-primary text-primary bg-primary/5" : ""}`} data-testid={`btn-lib-${targetField}`}>
          <Library className="w-3.5 h-3.5" />
          {showLibrary ? "Close Library" : "Library"}
        </Button>
      </div>

      {showLibrary && (
        <ImageLibraryPanel adminToken={adminToken} onPick={(url) => { onUrlChange(url); setShowLibrary(false); }} onClose={() => setShowLibrary(false)} />
      )}

      {/* AI */}
      <div className="pt-2 border-t border-border space-y-2">
        <p className="text-xs font-medium flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Generate with AI
        </p>
        <AIGenerationPanelWithForm adminToken={adminToken} form={form} onImageGenerated={(url) => { onUrlChange(url); qc.invalidateQueries({ queryKey: ["/api/admin/hero-slides/library"] }); }} targetField={targetField} />
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════
   MAIN TAB
══════════════════════════════════════════════════════════ */
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
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");

  const setF = (patch: Partial<FormState>) => setForm(f => ({ ...f, ...patch }));

  const openCreate = () => { setEditing(null); setForm(blankForm()); setPreviewMode("desktop"); setDialogOpen(true); };

  const openEdit = (s: HeroSlide) => {
    setEditing(s);
    setForm({
      imageUrl: s.imageUrl ?? "",
      imageAlt: s.imageAlt ?? "",
      mobileImageUrl: s.mobileImageUrl ?? "",
      mobilePosition: s.mobilePosition ?? "center center",
      focalX: s.focalX ?? 50,
      focalY: s.focalY ?? 50,
      overlayOpacity: s.overlayOpacity ?? 50,
      mobileOverlayOpacity: s.mobileOverlayOpacity ?? 60,
      tagline: s.tagline ?? "",
      title1: s.title1 ?? "",
      title2: s.title2 ?? "",
      title2Highlight: s.title2Highlight ?? "",
      subtitle: s.subtitle ?? "",
      cta1Label: s.cta1Label ?? "",
      cta1Href: s.cta1Href ?? "",
      cta1Icon: s.cta1Icon ?? "ShoppingBag",
      cta1Style: (s.cta1Style as "filled" | "outline") ?? "filled",
      cta2Label: s.cta2Label ?? "",
      cta2Href: s.cta2Href ?? "",
      cta2Icon: s.cta2Icon ?? "Sparkles",
      cta2Style: (s.cta2Style as "filled" | "outline") ?? "outline",
      enabled: s.enabled ?? true,
    });
    setPreviewMode("desktop");
    setDialogOpen(true);
  };

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: ["/api/admin/hero-slides"] });
    qc.invalidateQueries({ queryKey: ["/api/hero-slides"] });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!form.imageUrl.trim()) throw new Error("A desktop image is required.");
      const payload = {
        ...form,
        mobileImageUrl: form.mobileImageUrl.trim() || null,
      };
      const url = editing ? `/api/admin/hero-slides/${editing.id}` : "/api/admin/hero-slides";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(payload),
      });
      if (!res.ok) { const j = await res.json().catch(() => ({})); throw new Error(j?.message || `Save failed (${res.status})`); }
      return res.json();
    },
    onSuccess: () => { invalidate(); setDialogOpen(false); toast({ title: editing ? "Slide updated ✓" : "Slide created ✓" }); },
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
      const res = await fetch(`/api/admin/hero-slides/${id}`, { method: "DELETE", headers: { "x-admin-token": adminToken } });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => { invalidate(); toast({ title: "Slide deleted" }); },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const reorderMutation = useMutation({
    mutationFn: async (ids: number[]) => {
      const res = await fetch("/api/admin/hero-slides/reorder", {
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-hero-slider">Hero Slider</h1>
          <p className="text-sm text-muted-foreground">
            Homepage hero carousel — dual images (desktop&nbsp;+&nbsp;mobile), content-aware focal point, AI generation, overlay control, CTA styles.
          </p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white gap-2" data-testid="btn-new-hero-slide">
          <Plus className="w-4 h-4" /> New Slide
        </Button>
      </div>

      {/* Slide list */}
      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-md" />)}</div>
      ) : !slides?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <ImageIcon className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No hero slides yet. Create one — until you do the site shows bundled defaults.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {slides.map((s, idx) => (
            <Card key={s.id} className="bg-card border-border" data-testid={`card-hero-slide-${s.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start gap-4 flex-wrap">
                  {/* Thumbnails */}
                  <div className="flex gap-2 flex-shrink-0">
                    <div className="w-28 h-16 rounded-md overflow-hidden bg-muted border relative">
                      {s.imageUrl
                        ? <img src={s.imageUrl} alt={s.imageAlt || ""} className="w-full h-full object-cover" style={{ objectPosition: `${s.focalX ?? 50}% ${s.focalY ?? 50}%` }} />
                        : <div className="w-full h-full flex items-center justify-center text-muted-foreground"><ImageIcon className="w-5 h-5" /></div>
                      }
                      <span className="absolute bottom-0.5 left-0.5 text-[8px] bg-black/50 text-white px-1 rounded">Desktop</span>
                    </div>
                    {s.mobileImageUrl && (
                      <div className="w-9 h-16 rounded-md overflow-hidden bg-muted border relative">
                        <img src={s.mobileImageUrl} alt="" className="w-full h-full object-cover" />
                        <span className="absolute bottom-0.5 left-0 right-0 text-center text-[7px] bg-black/50 text-white">Mob</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="space-y-1.5 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">#{idx + 1}</Badge>
                      <h3 className="font-serif text-lg text-primary truncate" data-testid={`text-hero-title-${s.id}`}>
                        {s.title1 || s.tagline || "(untitled)"}
                      </h3>
                      {!s.enabled && <Badge className="bg-muted text-muted-foreground">Disabled</Badge>}
                      {s.mobileImageUrl && <Badge variant="outline" className="text-[10px] gap-1"><Smartphone className="w-2.5 h-2.5" />Mobile img</Badge>}
                    </div>
                    {s.subtitle && <p className="text-sm text-muted-foreground line-clamp-1">{s.subtitle}</p>}
                    <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap pt-0.5">
                      {s.cta1Label && <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{s.cta1Label}</span>}
                      {s.cta2Label && <span className="flex items-center gap-1"><ArrowRight className="w-3 h-3" />{s.cta2Label}</span>}
                      <span className="text-[10px]">Focal: {s.focalX ?? 50}% {s.focalY ?? 50}%</span>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button size="icon" variant="outline" disabled={idx === 0 || reorderMutation.isPending} onClick={() => move(idx, -1)} data-testid={`btn-up-${s.id}`} aria-label="Move up">
                      <ArrowUp className="w-3.5 h-3.5" />
                    </Button>
                    <Button size="icon" variant="outline" disabled={idx === slides.length - 1 || reorderMutation.isPending} onClick={() => move(idx, 1)} data-testid={`btn-down-${s.id}`} aria-label="Move down">
                      <ArrowDown className="w-3.5 h-3.5" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch checked={s.enabled} onCheckedChange={(checked) => toggleMutation.mutate({ id: s.id, enabled: checked })} data-testid={`switch-hero-enabled-${s.id}`} />
                      <span className="text-xs text-muted-foreground">{s.enabled ? "On" : "Off"}</span>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)} data-testid={`btn-edit-hero-${s.id}`}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="outline" data-testid={`btn-delete-hero-${s.id}`}><Trash2 className="w-3.5 h-3.5" /></Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete this slide?</AlertDialogTitle>
                          <AlertDialogDescription>This removes the slide record permanently. Uploaded images remain on disk in the library.</AlertDialogDescription>
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

      {/* ── Editor Dialog ── */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">{editing ? "Edit Hero Slide" : "New Hero Slide"}</DialogTitle>
            <DialogDescription>Configure image, copy, focal point, overlays, and call-to-action buttons.</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="images" className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="images" className="text-xs"><ImageIcon className="w-3.5 h-3.5 mr-1" />Images</TabsTrigger>
              <TabsTrigger value="content" className="text-xs"><Edit className="w-3.5 h-3.5 mr-1" />Content</TabsTrigger>
              <TabsTrigger value="display" className="text-xs"><Monitor className="w-3.5 h-3.5 mr-1" />Display</TabsTrigger>
              <TabsTrigger value="ctas" className="text-xs"><Sparkles className="w-3.5 h-3.5 mr-1" />CTAs</TabsTrigger>
            </TabsList>

            {/* ── IMAGES TAB ── */}
            <TabsContent value="images" className="space-y-6">
              {/* Live Preview */}
              <Card className="border-border bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Live Preview</span>
                    <div className="flex gap-1">
                      <Button
                        size="sm" variant={previewMode === "desktop" ? "default" : "outline"}
                        onClick={() => setPreviewMode("desktop")}
                        className={`gap-1.5 text-xs h-7 ${previewMode === "desktop" ? "bg-primary text-white" : ""}`}
                        data-testid="btn-preview-desktop"
                      >
                        <Monitor className="w-3.5 h-3.5" />Desktop
                      </Button>
                      <Button
                        size="sm" variant={previewMode === "mobile" ? "default" : "outline"}
                        onClick={() => setPreviewMode("mobile")}
                        className={`gap-1.5 text-xs h-7 ${previewMode === "mobile" ? "bg-primary text-white" : ""}`}
                        data-testid="btn-preview-mobile"
                      >
                        <Smartphone className="w-3.5 h-3.5" />Mobile
                      </Button>
                    </div>
                  </div>
                  <SlidePreview form={form} mode={previewMode} />
                  <p className="text-[10px] text-muted-foreground text-center">
                    {previewMode === "mobile" && form.mobileImageUrl ? "Using separate mobile image" : previewMode === "mobile" ? "No mobile image — will use desktop image" : "Desktop image preview"}
                    {" "}· Focal: {form.focalX}% {form.focalY}% · Overlay: {previewMode === "desktop" ? form.overlayOpacity : form.mobileOverlayOpacity}%
                  </p>
                </CardContent>
              </Card>

              {/* Desktop Image */}
              <Card className="border-border">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-medium flex items-center gap-2"><Monitor className="w-4 h-4 text-primary" />Desktop Image <span className="text-xs text-destructive ml-1">*required</span></h3>
                  <ImagePanel imageUrl={form.imageUrl} onUrlChange={(url) => setF({ imageUrl: url })} adminToken={adminToken} targetField="desktop" form={form} />
                </CardContent>
              </Card>

              {/* Mobile Image */}
              <Card className="border-border">
                <CardContent className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium flex items-center gap-2"><Smartphone className="w-4 h-4 text-primary" />Mobile Image <span className="text-xs text-muted-foreground ml-1">optional</span></h3>
                    {form.mobileImageUrl && (
                      <Badge variant="outline" className="text-xs text-green-600 border-green-600/30 bg-green-50">Portrait image set ✓</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">A separate portrait-oriented image looks much better on phones. Leave blank to use the desktop image with focal-point cropping.</p>
                  <ImagePanel imageUrl={form.mobileImageUrl} onUrlChange={(url) => setF({ mobileImageUrl: url })} adminToken={adminToken} targetField="mobile" form={form} />
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── CONTENT TAB ── */}
            <TabsContent value="content" className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Tagline <span className="text-muted-foreground text-xs">(small uppercase badge above headline)</span></Label>
                  <Input value={form.tagline} onChange={(e) => setF({ tagline: e.target.value })} placeholder="SHOP PUJA SAMAGRI" data-testid="input-hero-tagline" />
                </div>
                <div className="space-y-2">
                  <Label>Headline line 1</Label>
                  <Input value={form.title1} onChange={(e) => setF({ title1: e.target.value })} placeholder="Shop Puja Samagri" data-testid="input-hero-title1" />
                </div>
                <div className="space-y-2">
                  <Label>Headline line 2 (prefix)</Label>
                  <Input value={form.title2} onChange={(e) => setF({ title2: e.target.value })} placeholder="& Puja Essentials " data-testid="input-hero-title2" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Headline line 2 <span className="text-amber-500 font-semibold">gold highlight word</span></Label>
                  <Input value={form.title2Highlight} onChange={(e) => setF({ title2Highlight: e.target.value })} placeholder="Online" data-testid="input-hero-title2hl" />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <Label>Subtitle / body text</Label>
                  <Textarea rows={2} value={form.subtitle} onChange={(e) => setF({ subtitle: e.target.value })} placeholder="Buy puja kits, havan samagri, diyas..." data-testid="input-hero-subtitle" />
                </div>
                <div className="space-y-2">
                  <Label>Image alt text <span className="text-muted-foreground text-xs">(SEO + accessibility)</span></Label>
                  <Input value={form.imageAlt} onChange={(e) => setF({ imageAlt: e.target.value })} placeholder="Vedic Pandit performing puja" data-testid="input-hero-alt" />
                </div>
              </div>
            </TabsContent>

            {/* ── DISPLAY TAB ── */}
            <TabsContent value="display" className="space-y-6">
              {/* Focal Point */}
              <Card className="border-border">
                <CardContent className="p-4 space-y-4">
                  <FocalPicker
                    imageUrl={form.imageUrl}
                    focalX={form.focalX}
                    focalY={form.focalY}
                    onChange={(x, y) => setF({ focalX: x, focalY: y })}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs">Focal X: {form.focalX}%</Label>
                      <Slider min={0} max={100} step={1} value={[form.focalX]} onValueChange={([v]) => setF({ focalX: v })} data-testid="slider-focal-x" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs">Focal Y: {form.focalY}%</Label>
                      <Slider min={0} max={100} step={1} value={[form.focalY]} onValueChange={([v]) => setF({ focalY: v })} data-testid="slider-focal-y" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Overlays */}
              <Card className="border-border">
                <CardContent className="p-4 space-y-4">
                  <h3 className="font-medium text-sm flex items-center gap-2"><RefreshCw className="w-4 h-4 text-primary" />Dark Overlay Opacity</h3>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <Label className="text-xs flex items-center gap-1.5"><Monitor className="w-3.5 h-3.5" />Desktop: {form.overlayOpacity}%</Label>
                      <Slider min={0} max={90} step={5} value={[form.overlayOpacity]} onValueChange={([v]) => setF({ overlayOpacity: v })} data-testid="slider-overlay-desktop" />
                      <p className="text-[10px] text-muted-foreground">Lower = more image visible, higher = text more readable</p>
                    </div>
                    <div className="space-y-3">
                      <Label className="text-xs flex items-center gap-1.5"><Smartphone className="w-3.5 h-3.5" />Mobile: {form.mobileOverlayOpacity}%</Label>
                      <Slider min={0} max={90} step={5} value={[form.mobileOverlayOpacity]} onValueChange={([v]) => setF({ mobileOverlayOpacity: v })} data-testid="slider-overlay-mobile" />
                      <p className="text-[10px] text-muted-foreground">Phones typically need higher contrast</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Mobile position fallback */}
              <Card className="border-border">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium text-sm">Mobile Crop Fallback</h3>
                  <p className="text-xs text-muted-foreground">When no separate mobile image is set, this CSS object-position is used to crop the desktop image on phones.</p>
                  <Select value={form.mobilePosition} onValueChange={(v) => setF({ mobilePosition: v })}>
                    <SelectTrigger data-testid="select-mobile-pos"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {MOBILE_POSITION_OPTIONS.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </CardContent>
              </Card>

              {/* Side-by-side preview */}
              <Card className="border-border bg-muted/30">
                <CardContent className="p-4 space-y-3">
                  <h3 className="font-medium text-sm flex items-center gap-2"><Eye className="w-4 h-4 text-primary" />Side-by-Side Preview</h3>
                  <div className="flex gap-4 items-start">
                    <div className="flex-1 space-y-1">
                      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1"><Monitor className="w-3 h-3" />Desktop</p>
                      <SlidePreview form={form} mode="desktop" />
                    </div>
                    <div className="space-y-1 flex-shrink-0">
                      <p className="text-xs text-center text-muted-foreground flex items-center justify-center gap-1"><Smartphone className="w-3 h-3" />Mobile</p>
                      <SlidePreview form={form} mode="mobile" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* ── CTAs TAB ── */}
            <TabsContent value="ctas" className="space-y-4">
              {[1, 2].map((n) => {
                const labelKey = `cta${n}Label` as keyof FormState;
                const hrefKey = `cta${n}Href` as keyof FormState;
                const iconKey = `cta${n}Icon` as keyof FormState;
                const styleKey = `cta${n}Style` as keyof FormState;
                return (
                  <Card key={n} className="border-border">
                    <CardContent className="p-4 space-y-4">
                      <h4 className="font-medium flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />CTA Button {n}
                        {n === 1 && <Badge variant="secondary" className="text-xs">Primary</Badge>}
                        {n === 2 && <Badge variant="outline" className="text-xs">Secondary</Badge>}
                      </h4>
                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label>Button label</Label>
                          <Input value={form[labelKey] as string} onChange={(e) => setF({ [labelKey]: e.target.value } as any)} placeholder={n === 1 ? "Shop Now" : "Learn More"} data-testid={`input-cta${n}-label`} />
                        </div>
                        <div className="space-y-2">
                          <Label>Link (href)</Label>
                          <Input value={form[hrefKey] as string} onChange={(e) => setF({ [hrefKey]: e.target.value } as any)} placeholder="/puja-samagri-online" data-testid={`input-cta${n}-href`} />
                        </div>
                        <div className="space-y-2">
                          <Label>Icon</Label>
                          <Select value={form[iconKey] as string} onValueChange={(v) => setF({ [iconKey]: v } as any)}>
                            <SelectTrigger data-testid={`select-cta${n}-icon`}><SelectValue /></SelectTrigger>
                            <SelectContent>{ICON_OPTIONS.map(i => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label>Style</Label>
                          <div className="flex gap-2">
                            {(["filled", "outline"] as const).map(style => (
                              <button
                                key={style}
                                type="button"
                                onClick={() => setF({ [styleKey]: style } as any)}
                                className={`flex-1 py-2 px-3 rounded-md text-sm font-medium border transition-all ${
                                  form[styleKey] === style
                                    ? "border-primary bg-primary text-primary-foreground"
                                    : "border-border text-muted-foreground hover:border-primary/60"
                                }`}
                                data-testid={`btn-cta${n}-style-${style}`}
                              >
                                {style === "filled" ? "● Filled" : "○ Outline"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Preview pill */}
                      {(form[labelKey] as string) && (
                        <div className="flex gap-2 flex-wrap pt-1">
                          <span className="text-xs text-muted-foreground">Preview:</span>
                          <span className={`text-xs font-semibold px-3 py-1 rounded-full ${
                            form[styleKey] === "filled"
                              ? "bg-amber-500 text-black"
                              : "border border-primary/60 text-primary"
                          }`}>
                            {form[labelKey] as string}
                          </span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          </Tabs>

          {/* Enable + Save */}
          <div className="flex items-center justify-between pt-4 border-t border-border flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <Switch checked={form.enabled} onCheckedChange={(checked) => setF({ enabled: checked })} data-testid="switch-hero-enabled" />
              <Label className="text-sm">{form.enabled ? <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5 text-green-500" />Enabled — visible on homepage</span> : <span className="flex items-center gap-1.5"><EyeOff className="w-3.5 h-3.5 text-muted-foreground" />Disabled</span>}</Label>
            </div>
            <DialogFooter className="gap-2 flex-row">
              <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending || !form.imageUrl.trim()}
                className="bg-primary text-white gap-2"
                data-testid="btn-save-hero-slide"
              >
                {saveMutation.isPending ? <><Loader2 className="w-4 h-4 animate-spin" />Saving…</> : editing ? "Save Changes" : "Create Slide"}
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default HeroSliderTab;
