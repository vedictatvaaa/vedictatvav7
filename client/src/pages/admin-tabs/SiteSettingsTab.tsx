import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Settings, Search, Plus, Trash2, Calendar, Globe, Phone, Mail, MessageCircle, Image, Type, Tag, Sparkles, BarChart3, Flame, Palette } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import type { Pandit, SiteSettings } from "@shared/schema";

import { createFetcher } from "../admin-shared";
import { BrandMark } from "@/components/brand/BrandMark";

// ============================================================
// Site Settings Tab
// ============================================================
function SiteSettingsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<SiteSettings>({
    queryKey: ["/api/site-settings"],
    queryFn: () => fetcher("/api/site-settings"),
  });

  const [form, setForm] = useState({
    siteName: "", tagline: "", heroHeading: "", heroSubheading: "",
    contactEmail: "", contactPhone: "", whatsappNumber: "",
    socialInstagram: "", socialFacebook: "", socialYoutube: "",
    logoUrl: "", heroImageUrl: "",
    logoDisplayMode: "both", logoSizePx: 27, logoScalePercent: 100, logoPosition: "left",
    logoTextColor: "#6D2B35", taglineVisible: false, taglineColor: "#6B5B52", taglineSizePx: 14,
    logoFontSource: "curated", logoFontFamily: "Tiro Devanagari Sanskrit", customLogoFontUrl: "",
    logoFontWeight: 400, logoLetterSpacing: 0,
    brandStudioConfigured: false,
    primaryColor: "hsl(var(--primary))", secondaryColor: "hsl(var(--secondary))", accentColor: "hsl(var(--secondary))",
    backgroundColor: "hsl(var(--muted))", foregroundColor: "#2B1115",
    bodyFont: "Inter", headingFont: "Playfair Display",
    faviconUrl: "", googleAnalyticsId: "", facebookPixelId: "",
    gtmContainerId: "", gscVerification: "", googleBusinessProfileUrl: "",
    businessStreet: "", businessCity: "", businessRegion: "",
    businessPostalCode: "", businessCountry: "IN",
    ambientFloralEnabled: false,
    ribbonEnabled: true,
    ribbonRotationMs: 5000,
    ribbonItems: [] as Array<{ id: string; iconName: string; eyebrow: string; title: string; detail: string; href: string; cta: string }>,
    maintenanceMode: false,
    panditContactMode: "login_required",
    panditContactUnlockPricePaise: 1000,
  });
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "font" | null>(null);
  const [baseline, setBaseline] = useState<string | null>(null);
  const hasHydrated = useRef(false);

  useEffect(() => {
    if (settings && !hasHydrated.current) {
      const normalized = {
        siteName: settings.siteName || "",
        tagline: settings.tagline || "",
        heroHeading: settings.heroHeading || "",
        heroSubheading: settings.heroSubheading || "",
        contactEmail: settings.contactEmail || "",
        contactPhone: settings.contactPhone || "",
        whatsappNumber: settings.whatsappNumber || "",
        socialInstagram: settings.socialInstagram || "",
        socialFacebook: settings.socialFacebook || "",
        socialYoutube: settings.socialYoutube || "",
        logoUrl: settings.logoUrl || "",
        heroImageUrl: settings.heroImageUrl || "",
        logoDisplayMode: (settings as any).logoDisplayMode || "both",
        logoSizePx: Number((settings as any).logoSizePx) || 27,
        logoScalePercent: Number((settings as any).logoScalePercent) || 100,
        logoPosition: (settings as any).logoPosition || "left",
        logoTextColor: (settings as any).logoTextColor || "#6D2B35",
        taglineVisible: Boolean((settings as any).taglineVisible),
        taglineColor: (settings as any).taglineColor || "#6B5B52",
        taglineSizePx: Number((settings as any).taglineSizePx) || 14,
        logoFontSource: (settings as any).logoFontSource || "curated",
        logoFontFamily: (settings as any).logoFontFamily || "Tiro Devanagari Sanskrit",
        customLogoFontUrl: (settings as any).customLogoFontUrl || "",
        logoFontWeight: Number((settings as any).logoFontWeight) || 400,
        logoLetterSpacing: Number((settings as any).logoLetterSpacing) || 0,
        brandStudioConfigured: Boolean((settings as any).brandStudioConfigured),
        primaryColor: settings.primaryColor || "hsl(var(--primary))",
        secondaryColor: settings.secondaryColor || "hsl(var(--secondary))",
        accentColor: settings.accentColor || "hsl(var(--secondary))",
        backgroundColor: settings.backgroundColor || "hsl(var(--muted))",
        foregroundColor: settings.foregroundColor || "#2B1115",
        bodyFont: settings.bodyFont || "Inter",
        headingFont: settings.headingFont || "Playfair Display",
        faviconUrl: settings.faviconUrl || "",
        googleAnalyticsId: settings.googleAnalyticsId || "",
        facebookPixelId: settings.facebookPixelId || "",
        gtmContainerId: (settings as any).gtmContainerId || "",
        gscVerification: (settings as any).gscVerification || "",
        googleBusinessProfileUrl: (settings as any).googleBusinessProfileUrl || "",
        businessStreet: (settings as any).businessStreet || "",
        businessCity: (settings as any).businessCity || "",
        businessRegion: (settings as any).businessRegion || "",
        businessPostalCode: (settings as any).businessPostalCode || "",
        businessCountry: (settings as any).businessCountry || "IN",
        ambientFloralEnabled: Boolean((settings as any).ambientFloralEnabled),
        ribbonEnabled: (settings as any).ribbonEnabled !== false,
        ribbonRotationMs: Number((settings as any).ribbonRotationMs) || 5000,
        ribbonItems: Array.isArray((settings as any).ribbonItems) ? (settings as any).ribbonItems : [],
        maintenanceMode: Boolean((settings as any).maintenanceMode),
        panditContactMode: (settings as any).panditContactMode || "login_required",
        panditContactUnlockPricePaise: Number((settings as any).panditContactUnlockPricePaise) || 1000,
      };
      setForm(normalized);
      setBaseline(JSON.stringify(normalized));
      hasHydrated.current = true;
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/site-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Admin token is required by the backend; without it the save
          // silently fails with a 401 and the UI showed a generic error.
          "x-admin-token": adminToken || "",
        },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      return res.json();
    },
    onSuccess: (savedSettings) => {
      setBaseline(JSON.stringify(form));
      queryClient.setQueryData(["/api/site-settings"], savedSettings);
      toast({ title: "Settings Saved", description: "Site settings have been updated." });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message || "Failed to save settings.", variant: "destructive" }),
  });

  const updateField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));
  const updateBrandField = (key: string, value: any) => setForm((f) => ({
    ...f,
    [key]: value,
    brandStudioConfigured: true,
  }));

  const uploadBrandAsset = async (file: File, kind: "logo" | "font") => {
    const allowed = kind === "logo"
      ? ["image/png", "image/jpeg", "image/webp"]
      : ["font/woff", "font/woff2", "application/font-woff", "application/octet-stream"];
    if (!allowed.includes(file.type) && !file.name.toLowerCase().match(kind === "logo" ? /\.(png|jpe?g|webp)$/ : /\.woff2?$/)) {
       toast({ title: "Unsupported file", description: kind === "logo" ? "Use PNG, JPG, or WebP." : "Use a WOFF or WOFF2 font.", variant: "destructive" });
      return;
    }
    if (file.size > (kind === "logo" ? 5 : 2) * 1024 * 1024) {
      toast({ title: "File is too large", description: `Maximum ${kind === "logo" ? "5 MB" : "2 MB"}.`, variant: "destructive" });
      return;
    }
    const body = new FormData();
    body.append("file", file);
    setUploadingAsset(kind);
    try {
      const res = await fetch(`/api/site-settings/brand-${kind}`, { method: "POST", headers: { "x-admin-token": adminToken }, body });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok || !payload.url) throw new Error(payload.message || `Upload failed (${res.status})`);
      setForm((current) => ({
        ...current,
        [kind === "logo" ? "logoUrl" : "customLogoFontUrl"]: payload.url,
        ...(kind === "font" ? { logoFontSource: "custom" } : {}),
        brandStudioConfigured: true,
      }));
      toast({ title: `${kind === "logo" ? "Logo" : "Font"} uploaded`, description: "The preview is ready. Save when you are satisfied." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error?.message || "Please try again.", variant: "destructive" });
    } finally {
      setUploadingAsset(null);
    }
  };

  const resetBrandDefaults = () => setForm((f) => ({
    ...f, logoDisplayMode: "both", logoSizePx: 27, logoScalePercent: 100, logoPosition: "left",
    logoTextColor: "#6D2B35", taglineVisible: false, taglineColor: "#6B5B52", taglineSizePx: 14,
    logoFontSource: "curated", logoFontFamily: "Tiro Devanagari Sanskrit", customLogoFontUrl: "",
    logoFontWeight: 400, logoLetterSpacing: 0,
    brandStudioConfigured: true,
  }));

  // ----- Ribbon item helpers -----
  const RIBBON_ICON_OPTIONS = [
    { name: "CalendarDays", label: "Calendar" },
    { name: "Flame", label: "Flame" },
    { name: "UserRound", label: "Person" },
    { name: "Phone", label: "Phone" },
    { name: "Sparkles", label: "Sparkles" },
    { name: "Gift", label: "Gift" },
    { name: "Store", label: "Store" },
    { name: "Music2", label: "Mala / Japa" },
  ];
  const addRibbonItem = () => setForm((f) => ({
    ...f,
    ribbonItems: [
      ...f.ribbonItems,
      { id: `item-${Date.now()}`, iconName: "Sparkles", eyebrow: "", title: "New announcement", detail: "", href: "/", cta: "Open" },
    ],
  }));
  const updateRibbonItem = (i: number, patch: Partial<typeof form.ribbonItems[number]>) => setForm((f) => ({
    ...f,
    ribbonItems: f.ribbonItems.map((it, idx) => idx === i ? { ...it, ...patch } : it),
  }));
  const removeRibbonItem = (i: number) => setForm((f) => ({ ...f, ribbonItems: f.ribbonItems.filter((_, idx) => idx !== i) }));
  const moveRibbonItem = (i: number, delta: number) => setForm((f) => {
    const arr = [...f.ribbonItems];
    const j = i + delta;
    if (j < 0 || j >= arr.length) return f;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    return { ...f, ribbonItems: arr };
  });
  const resetRibbonDefaults = () => setForm((f) => ({
    ...f,
    ribbonItems: [
      { id: "tithi-calculator", iconName: "CalendarDays", eyebrow: "Free tool", title: "Pitru Tithi & Annual Shradh Calculator", detail: "Pitru Paksha or Pratisamvatsarik · Free yearly reminders", href: "/tools/tithi-calculator", cta: "Open" },
      { id: "pind-daan-gaya", iconName: "Flame", eyebrow: "Sacred seva", title: "Online Pind Daan at Gaya", detail: "Verified Gayawal Pandits · Live Sankalp · Worldwide prasad", href: "/pind-daan-gaya", cta: "Book" },
      { id: "book-pandit", iconName: "UserRound", eyebrow: "On demand", title: "Book a verified Pandit at home", detail: "Satyanarayan, Griha Pravesh, Rudrabhishek & more", href: "/book-pandit", cta: "Book" },
      { id: "puja-call", iconName: "Phone", eyebrow: "Talk now", title: "Speak to a Vedic Acharya", detail: "Free 5-min call · muhurat, dosha & ritual guidance", href: "/puja-call", cta: "Call" },
      { id: "essentials", iconName: "Gift", eyebrow: "Free shipping", title: "Authentic Puja Samagri & Rudraksha", detail: "Hand-curated, lab-certified · Worldwide delivery", href: "/category/puja-essentials", cta: "Shop" },
    ],
  }));

  // Baseline snapshot: the form state as it looked right after settings loaded.
  // Any subsequent edit that diverges from this baseline marks the form dirty.
  const isDirty = baseline !== null && baseline !== JSON.stringify(form);

  // Attach beforeunload only while actually dirty.
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [isDirty]);

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />)}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-site-settings">Site Settings</h1>
        <p className="text-sm text-muted-foreground">Configure your website appearance and contact information</p>
      </div>

      <fieldset disabled={saveMutation.isPending} className="contents">
      {/* Branding */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Type className="w-5 h-5" /> Logo &amp; Wordmark Studio</CardTitle>
          <CardDescription>One safe brand system for every header, menu, and footer. Changes stay local until you save.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={form.siteName} onChange={(e) => updateBrandField("siteName", e.target.value)} data-testid="input-site-name" />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => updateBrandField("tagline", e.target.value)} data-testid="input-tagline" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand-display-mode">Display mode</Label>
              <select id="brand-display-mode" value={form.logoDisplayMode} onChange={(e) => updateBrandField("logoDisplayMode", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="select-logo-display-mode">
                <option value="both">Image + text</option><option value="text">Text only</option><option value="image">Image only</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label>Logo image URL</Label>
              <Input value={form.logoUrl} onChange={(e) => updateBrandField("logoUrl", e.target.value)} placeholder="https://..." data-testid="input-logo-url" />
              <Input type="file" disabled={uploadingAsset !== null} accept="image/png,image/jpeg,image/webp" onChange={(e) => e.target.files?.[0] && uploadBrandAsset(e.target.files[0], "logo")} aria-label="Upload logo image" data-testid="input-logo-upload" />
              {uploadingAsset === "logo" && <p className="text-xs text-primary" role="status">Uploading logo…</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-size">Logo size: {form.logoSizePx}px</Label>
              <input id="logo-size" type="range" min="16" max="160" value={form.logoSizePx} onChange={(e) => updateBrandField("logoSizePx", Number(e.target.value))} className="w-full accent-primary" data-testid="input-logo-size" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="logo-scale">Responsive scale: {form.logoScalePercent}%</Label>
              <input id="logo-scale" type="range" min="50" max="200" value={form.logoScalePercent} onChange={(e) => updateBrandField("logoScalePercent", Number(e.target.value))} className="w-full accent-primary" data-testid="input-logo-scale" />
            </div>
            <div className="space-y-2"><Label>Position</Label><select value={form.logoPosition} onChange={(e) => updateBrandField("logoPosition", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="select-logo-position"><option value="left">Left</option><option value="center">Center</option><option value="right">Right</option></select></div>
            <div className="space-y-2"><Label>Logo text color</Label><div className="flex gap-2"><input type="color" value={form.logoTextColor} onChange={(e) => updateBrandField("logoTextColor", e.target.value)} className="h-10 w-10" aria-label="Logo text color" /><Input value={form.logoTextColor} onChange={(e) => updateBrandField("logoTextColor", e.target.value)} /></div></div>
            <div className="flex items-center justify-between rounded-md border border-border p-3"><div><Label>Show tagline</Label><p className="text-xs text-muted-foreground">Keep supporting copy visible below the wordmark.</p></div><Switch checked={form.taglineVisible} onCheckedChange={(v) => updateBrandField("taglineVisible", v)} data-testid="switch-tagline-visible" /></div>
            <div className="space-y-2"><Label>Tagline color / size</Label><div className="flex gap-2"><Input value={form.taglineColor} onChange={(e) => updateBrandField("taglineColor", e.target.value)} /><Input type="number" min="8" max="32" value={form.taglineSizePx} onChange={(e) => updateBrandField("taglineSizePx", Number(e.target.value))} aria-label="Tagline size in pixels" /></div></div>
            <div className="space-y-2"><Label>Wordmark font</Label><select value={form.logoFontFamily} onChange={(e) => updateBrandField("logoFontFamily", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option>Playfair Display</option><option>Fraunces</option><option>Tiro Devanagari Sanskrit</option><option>Plus Jakarta Sans</option><option>DM Mono</option></select></div>
            <div className="space-y-2"><Label>Font source</Label><select value={form.logoFontSource} onChange={(e) => updateBrandField("logoFontSource", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"><option value="curated">Curated font</option><option value="custom">Uploaded custom font</option></select><Input type="file" disabled={uploadingAsset !== null} accept=".woff,.woff2,font/woff,font/woff2" onChange={(e) => e.target.files?.[0] && uploadBrandAsset(e.target.files[0], "font")} aria-label="Upload WOFF font" data-testid="input-logo-font-upload" />{uploadingAsset === "font" && <p className="text-xs text-primary" role="status">Uploading font…</p>}</div>
            <div className="space-y-2"><Label>Weight / letter spacing</Label><div className="flex gap-2"><select value={form.logoFontWeight} onChange={(e) => updateBrandField("logoFontWeight", Number(e.target.value))} className="h-10 rounded-md border border-input bg-background px-3 text-sm"><option value="400">Regular</option><option value="500">Medium</option><option value="600">Semi-bold</option></select><Input type="number" min="-4" max="20" value={form.logoLetterSpacing} onChange={(e) => updateBrandField("logoLetterSpacing", Number(e.target.value))} aria-label="Letter spacing in pixels" /></div></div>
            <div className="md:col-span-2 flex justify-between items-center"><Button type="button" variant="outline" onClick={resetBrandDefaults} data-testid="btn-brand-reset">Reset brand defaults</Button><span className="text-xs text-muted-foreground">Preview updates instantly</span></div>
            <div className="md:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-lg bg-muted/40 p-4">
              {(["desktop", "mobile", "menu", "footer"] as const).map((placement) => <div key={placement} className="min-h-20 rounded-md border border-border bg-background p-3 flex items-center overflow-hidden"><div><p className="mb-2 text-[10px] uppercase tracking-widest text-muted-foreground">{placement} preview</p><BrandMark settings={form as any} placement={placement} /></div></div>)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Hero Section */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Image className="w-5 h-5" /> Hero Section</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Hero Heading</Label>
              <Input value={form.heroHeading} onChange={(e) => updateField("heroHeading", e.target.value)} data-testid="input-hero-heading" />
            </div>
            <div className="space-y-2">
              <Label>Hero Subheading</Label>
              <Input value={form.heroSubheading} onChange={(e) => updateField("heroSubheading", e.target.value)} data-testid="input-hero-subheading" />
            </div>
            <div className="space-y-2">
              <Label>Hero Image URL</Label>
              <Input value={form.heroImageUrl} onChange={(e) => updateField("heroImageUrl", e.target.value)} data-testid="input-hero-image-url" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Phone className="w-5 h-5" /> Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Mail className="w-3 h-3" /> Email</Label>
              <Input value={form.contactEmail} onChange={(e) => updateField("contactEmail", e.target.value)} data-testid="input-contact-email" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><Phone className="w-3 h-3" /> Phone</Label>
              <Input value={form.contactPhone} onChange={(e) => updateField("contactPhone", e.target.value)} data-testid="input-contact-phone" />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> WhatsApp</Label>
              <Input value={form.whatsappNumber} onChange={(e) => updateField("whatsappNumber", e.target.value)} data-testid="input-whatsapp" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Social Media */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Globe className="w-5 h-5" /> Social Media Links</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Instagram</Label>
              <Input value={form.socialInstagram} onChange={(e) => updateField("socialInstagram", e.target.value)} placeholder="https://instagram.com/..." data-testid="input-instagram" />
            </div>
            <div className="space-y-2">
              <Label>Facebook</Label>
              <Input value={form.socialFacebook} onChange={(e) => updateField("socialFacebook", e.target.value)} placeholder="https://facebook.com/..." data-testid="input-facebook" />
            </div>
            <div className="space-y-2">
              <Label>YouTube</Label>
              <Input value={form.socialYoutube} onChange={(e) => updateField("socialYoutube", e.target.value)} placeholder="https://youtube.com/..." data-testid="input-youtube" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Appearance Studio — colors, fonts, favicon */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Palette className="w-5 h-5" /> Appearance Studio</CardTitle>
          <CardDescription>Colors and fonts apply site-wide the moment you save. Live preview below reflects current form values.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {[
              { key: "primaryColor", label: "Primary" },
              { key: "secondaryColor", label: "Secondary" },
              { key: "accentColor", label: "Accent" },
              { key: "backgroundColor", label: "Background" },
              { key: "foregroundColor", label: "Text" },
            ].map(({ key, label }) => (
              <div key={key} className="space-y-2">
                <Label className="text-xs">{label}</Label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={(form as any)[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="h-9 w-9 rounded border border-border cursor-pointer shrink-0"
                    data-testid={`color-${key}`}
                  />
                  <Input
                    value={(form as any)[key]}
                    onChange={(e) => updateField(key, e.target.value)}
                    className="font-mono text-xs"
                    data-testid={`input-${key}`}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Body Font (Google Fonts name)</Label>
              <Input value={form.bodyFont} onChange={(e) => updateField("bodyFont", e.target.value)} placeholder="Inter" data-testid="input-body-font" />
            </div>
            <div className="space-y-2">
              <Label>Heading Font (Google Fonts name)</Label>
              <Input value={form.headingFont} onChange={(e) => updateField("headingFont", e.target.value)} placeholder="Playfair Display" data-testid="input-heading-font" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label>Favicon URL</Label>
              <Input value={form.faviconUrl} onChange={(e) => updateField("faviconUrl", e.target.value)} placeholder="https://.../favicon.png" data-testid="input-favicon-url" />
            </div>
          </div>

          {/* Live preview */}
          <div
            className="rounded-md border p-5 space-y-2"
            style={{
              background: form.backgroundColor,
              color: form.foregroundColor,
              borderColor: form.accentColor,
              fontFamily: `'${form.bodyFont}', sans-serif`,
            }}
            data-testid="theme-preview"
          >
            <div style={{ fontFamily: `'${form.headingFont}', serif`, fontSize: 22, fontWeight: 600 }}>
              {form.siteName || "Your Site"} — Live Preview
            </div>
            <div style={{ opacity: 0.8, fontSize: 14 }}>{form.tagline || "Tagline goes here"}</div>
            <div className="flex gap-2 pt-2">
              <span style={{ background: form.primaryColor, color: "#fff", padding: "6px 14px", borderRadius: 6, fontSize: 13 }}>Primary Button</span>
              <span style={{ background: form.secondaryColor, color: form.foregroundColor, padding: "6px 14px", borderRadius: 6, fontSize: 13 }}>Secondary</span>
              <span style={{ background: form.accentColor, color: form.foregroundColor, padding: "6px 14px", borderRadius: 6, fontSize: 13 }}>Accent Chip</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Analytics */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><BarChart3 className="w-5 h-5" /> Analytics</CardTitle>
          <CardDescription>Snippets are injected only when an ID is present. Changing an ID requires a page reload.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Google Analytics ID (GA4)</Label>
            <Input value={form.googleAnalyticsId} onChange={(e) => updateField("googleAnalyticsId", e.target.value)} placeholder="G-XXXXXXXXXX" data-testid="input-ga-id" />
          </div>
          <div className="space-y-2">
            <Label>Facebook Pixel ID</Label>
            <Input value={form.facebookPixelId} onChange={(e) => updateField("facebookPixelId", e.target.value)} placeholder="123456789012345" data-testid="input-fb-pixel" />
          </div>
          <div className="space-y-2">
            <Label>Google Tag Manager Container ID</Label>
            <Input value={form.gtmContainerId} onChange={(e) => updateField("gtmContainerId", e.target.value)} placeholder="GTM-XXXXXXX" data-testid="input-gtm-id" />
          </div>
          <div className="space-y-2">
            <Label>Search Console Verification</Label>
            <Input value={form.gscVerification} onChange={(e) => updateField("gscVerification", e.target.value)} placeholder="HTML-tag content value" data-testid="input-gsc" />
          </div>
        </CardContent>
      </Card>

      {/* Google Business Profile / LocalBusiness schema */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Search className="w-5 h-5" /> Google Business Profile & Local SEO</CardTitle>
          <CardDescription>
            Powers the Organization / LocalBusiness structured data Google uses for knowledge-panel and map listings. Fill in the address to upgrade the schema from Organization to LocalBusiness.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2 md:col-span-2">
            <Label>Google Business Profile URL</Label>
            <Input value={form.googleBusinessProfileUrl} onChange={(e) => updateField("googleBusinessProfileUrl", e.target.value)} placeholder="https://g.page/your-business" data-testid="input-gmb-url" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Street Address</Label>
            <Input value={form.businessStreet} onChange={(e) => updateField("businessStreet", e.target.value)} placeholder="123 Temple Road" data-testid="input-business-street" />
          </div>
          <div className="space-y-2">
            <Label>City</Label>
            <Input value={form.businessCity} onChange={(e) => updateField("businessCity", e.target.value)} placeholder="Varanasi" data-testid="input-business-city" />
          </div>
          <div className="space-y-2">
            <Label>State / Region</Label>
            <Input value={form.businessRegion} onChange={(e) => updateField("businessRegion", e.target.value)} placeholder="Uttar Pradesh" data-testid="input-business-region" />
          </div>
          <div className="space-y-2">
            <Label>Postal Code</Label>
            <Input value={form.businessPostalCode} onChange={(e) => updateField("businessPostalCode", e.target.value)} placeholder="221001" data-testid="input-business-postal" />
          </div>
          <div className="space-y-2">
            <Label>Country (ISO)</Label>
            <Input value={form.businessCountry} onChange={(e) => updateField("businessCountry", e.target.value)} placeholder="IN" data-testid="input-business-country" />
          </div>
        </CardContent>
      </Card>

      {/* Maintenance Mode */}
      <Card className="bg-card border-border">
        <CardHeader><CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Phone className="w-5 h-5" /> Pandit contact access</CardTitle><CardDescription>Controls direct contact across storefronts. Protected details are never included in public profile data.</CardDescription></CardHeader>
        <CardContent>
          <div className="max-w-md space-y-2">
            <Label htmlFor="pandit-contact-mode">Global contact mode</Label>
            <select id="pandit-contact-mode" value={form.panditContactMode} onChange={(event) => updateField("panditContactMode", event.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" data-testid="select-pandit-contact-mode">
              <option value="open">Open — show only where the Pandit permits it</option>
              <option value="login_required">Login required — use the rolling contact allowance</option>
              <option value="disabled">Disabled — direct users to book through Vedic Tatva</option>
            </select>
            <p className="text-xs text-muted-foreground">Registration is always required. Per-Pandit never_display safety remains enforceable; always_open cannot make contact public.</p>
            <Label htmlFor="pandit-contact-price">Additional Pandit contact price (₹)</Label>
            <Input id="pandit-contact-price" type="number" min={1} max={10000} step="0.01"
              value={(form.panditContactUnlockPricePaise / 100).toFixed(2)}
              onChange={(event) => updateField("panditContactUnlockPricePaise", Math.round(Math.max(1, Math.min(10000, Number(event.target.value) || 1)) * 100))}
              data-testid="input-pandit-contact-price" />
            <p className="text-xs text-muted-foreground">Stored in paise; applies only to new paid unlock orders. Default ₹10.</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Sparkles className="w-5 h-5" /> Maintenance Mode</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show branded outage page to all visitors</Label>
              <p className="text-xs text-muted-foreground">
                When ON, every public page is replaced with the branded "We're catching our breath" page (with the Sacred Symbols mini-game). API calls and the admin panel keep working so you can flip this back off. Use during deploys or DB migrations. Changes propagate within 30 seconds.
              </p>
            </div>
            <Switch
              checked={form.maintenanceMode}
              onCheckedChange={(checked) => updateField("maintenanceMode", checked)}
              data-testid="switch-maintenance-mode"
            />
          </div>
        </CardContent>
      </Card>

      {/* Promo Ribbon */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Sparkles className="w-5 h-5" /> Site-wide Promo Ribbon</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Show ribbon on every page</Label>
              <p className="text-xs text-muted-foreground">
                Slim maroon strip under the navbar that auto-rotates through promos. Hidden on the calculator page, admin, pandit portal, cart and checkout.
              </p>
            </div>
            <Switch
              checked={form.ribbonEnabled}
              onCheckedChange={(checked) => updateField("ribbonEnabled", checked)}
              data-testid="switch-ribbon-enabled"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Auto-rotate every (ms)</Label>
              <Input
                type="number"
                min={1500}
                step={500}
                value={form.ribbonRotationMs}
                onChange={(e) => updateField("ribbonRotationMs", Math.max(1500, Number(e.target.value) || 5000))}
                data-testid="input-ribbon-rotation"
              />
              <p className="text-[11px] text-muted-foreground">Minimum 1500 ms. Default 5000 ms (5 s).</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Ribbon slides ({form.ribbonItems.length})</Label>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" type="button" onClick={resetRibbonDefaults} data-testid="btn-ribbon-reset">
                  Reset to defaults
                </Button>
                <Button size="sm" type="button" onClick={addRibbonItem} className="gap-1" data-testid="btn-ribbon-add">
                  <Plus className="w-3.5 h-3.5" /> Add slide
                </Button>
              </div>
            </div>

            {form.ribbonItems.length === 0 && (
              <p className="text-xs text-muted-foreground italic" data-testid="text-ribbon-empty">
                No custom slides — the ribbon will fall back to the built-in defaults. Click "Reset to defaults" to start editing them.
              </p>
            )}

            <div className="space-y-3">
              {form.ribbonItems.map((it, i) => (
                <div key={it.id || i} className="border border-border rounded-md p-3 bg-background/40 space-y-3" data-testid={`ribbon-item-${i}`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="font-mono">#{i + 1}</span>
                      <span className="text-foreground font-semibold truncate max-w-[200px] sm:max-w-xs">{it.title || "(untitled)"}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveRibbonItem(i, -1)} disabled={i === 0} data-testid={`btn-ribbon-up-${i}`}>↑</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => moveRibbonItem(i, 1)} disabled={i === form.ribbonItems.length - 1} data-testid={`btn-ribbon-down-${i}`}>↓</Button>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeRibbonItem(i)} data-testid={`btn-ribbon-delete-${i}`}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[11px]">Icon</Label>
                      <select
                        className="w-full h-9 px-2 rounded-md border border-input bg-background text-sm"
                        value={it.iconName}
                        onChange={(e) => updateRibbonItem(i, { iconName: e.target.value })}
                        data-testid={`select-ribbon-icon-${i}`}
                      >
                        {RIBBON_ICON_OPTIONS.map((opt) => (
                          <option key={opt.name} value={opt.name}>{opt.label}</option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Eyebrow (optional)</Label>
                      <Input value={it.eyebrow} onChange={(e) => updateRibbonItem(i, { eyebrow: e.target.value })} placeholder="Free tool" data-testid={`input-ribbon-eyebrow-${i}`} />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[11px]">Button label</Label>
                      <Input value={it.cta} onChange={(e) => updateRibbonItem(i, { cta: e.target.value })} placeholder="Open" data-testid={`input-ribbon-cta-${i}`} />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Title (main message)</Label>
                    <Input value={it.title} onChange={(e) => updateRibbonItem(i, { title: e.target.value })} placeholder="Pitru Tithi & Annual Shradh Calculator" data-testid={`input-ribbon-title-${i}`} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Detail (shown on desktop only)</Label>
                    <Input value={it.detail} onChange={(e) => updateRibbonItem(i, { detail: e.target.value })} placeholder="Pitru Paksha or Pratisamvatsarik · Free yearly reminders" data-testid={`input-ribbon-detail-${i}`} />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-[11px]">Link (relative path or full URL)</Label>
                    <Input value={it.href} onChange={(e) => updateRibbonItem(i, { href: e.target.value })} placeholder="/tools/tithi-calculator" data-testid={`input-ribbon-href-${i}`} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Ambient Floral Backdrop */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Sparkles className="w-5 h-5" /> Ambient Floral Backdrop</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-1">
              <Label className="text-sm font-medium">Drifting flowers across every page</Label>
              <p className="text-xs text-muted-foreground">
                Marigolds, lotus, jasmine, champa, hibiscus, rose petals and bel patra leaves slowly drift behind the content. Adds a festive devotional feel — turn off for a calmer, faster page.
              </p>
            </div>
            <Switch
              checked={form.ambientFloralEnabled}
              onCheckedChange={(checked) => updateField("ambientFloralEnabled", checked)}
              data-testid="switch-ambient-floral"
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary text-white gap-2" data-testid="btn-save-site-settings">
          {saveMutation.isPending ? "Saving..." : "Save All Settings"}
        </Button>
      </div>
      </fieldset>
    </div>
  );
}


export default SiteSettingsTab;
