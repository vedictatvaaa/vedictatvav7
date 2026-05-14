import { useState, useEffect } from "react";
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
  });

  useEffect(() => {
    if (settings && settings.siteName) {
      setForm({
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
      });
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/site-settings"] });
      toast({ title: "Settings Saved", description: "Site settings have been updated." });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message || "Failed to save settings.", variant: "destructive" }),
  });

  const updateField = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

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
  const [baseline, setBaseline] = useState<string | null>(null);
  useEffect(() => {
    if (settings && baseline === null) {
      setBaseline(JSON.stringify(form));
    }
    // We intentionally only want to capture the baseline once — right after
    // the settings query resolves — so 'form' is read at that moment.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);
  const isDirty = baseline !== null && baseline !== JSON.stringify(form);

  // After a successful save, reset the baseline so the form is no longer dirty.
  useEffect(() => {
    if (saveMutation.isSuccess) setBaseline(JSON.stringify(form));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [saveMutation.isSuccess]);

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

      {/* Branding */}
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif flex items-center gap-2"><Type className="w-5 h-5" /> Branding</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Site Name</Label>
              <Input value={form.siteName} onChange={(e) => updateField("siteName", e.target.value)} data-testid="input-site-name" />
            </div>
            <div className="space-y-2">
              <Label>Tagline</Label>
              <Input value={form.tagline} onChange={(e) => updateField("tagline", e.target.value)} data-testid="input-tagline" />
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
              <Label>Logo URL</Label>
              <Input value={form.logoUrl} onChange={(e) => updateField("logoUrl", e.target.value)} data-testid="input-logo-url" />
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
    </div>
  );
}


export default SiteSettingsTab;
