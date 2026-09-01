// Pandit-portal: Storefront editor + Card orders + Referrals.
// Three thin panels backed by /api/pandit/storefront, /api/pandit/card-order,
// /api/pandit/referrals. All edits are auto-saved on submit (no debounce noise).
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Download, ExternalLink, Plus, X, Loader2, Truck, BadgeCheck, ShieldAlert, BookOpen, Pencil, EyeOff, RotateCcw } from "lucide-react";
import { getPanditToken } from "@/lib/panditAuth";

const headers = () => ({
  "Content-Type": "application/json",
  ...(getPanditToken() ? { "x-pandit-token": getPanditToken() as string } : {}),
});

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(path, { ...init, headers: { ...headers(), ...((init.headers || {}) as Record<string, string>) }, credentials: "include" });
  if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || res.statusText);
  return res.json();
}

type ProductLite = { id: number; name: string; price: number; image?: string };

interface SfData {
  storefront: {
    bio: string | null; tagline: string | null;
    whatsappNumber: string | null; youtubeUrl: string | null; instagramUrl: string | null; facebookUrl: string | null; websiteUrl: string | null;
    themeColor: string | null; bannerImage: string | null;
    productIds: number[]; featuredPujas: string[]; status: "draft" | "pending_review" | "published" | "suspended"; isPublished: boolean; viewCount: number;
  };
  pandit: { id: number; name: string; slug: string; tier: string; productCommissionPct: number; membershipNo?: string | null; cardIssued?: boolean; cardIssuedAt?: string | null };
  products: ProductLite[];
  commissionPct: number;
  publicUrl: string;
}

type SfForm = {
  bio: string;
  tagline: string;
  whatsappNumber: string;
  youtubeUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  websiteUrl: string;
  themeColor: string;
  productIds: number[];
  featuredPujas: string[];
};

type MasterServiceLite = {
  id: number;
  name: string;
  category: string;
  supportedModes: Array<"in_person" | "online" | "hybrid">;
};

type PanditServiceLite = {
  id: number;
  masterServiceId: number;
  name: string;
  category: string;
  price: number;
  durationMinutes: number;
  mode: "in_person" | "online" | "hybrid";
  description: string;
  preparation: string;
  inclusions: string[];
  serviceAreas: string[];
  availability?: string | null;
  displayOrder: number;
  isActive: boolean;
};

const EMPTY_SERVICE_FORM = {
  masterServiceId: 0,
  price: 1100,
  durationMinutes: 60,
  mode: "in_person" as const,
  description: "",
  preparation: "",
  inclusions: "",
  serviceAreas: "",
  availability: "",
  displayOrder: 0,
};

function PanditServicesEditor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const masters = useQuery<MasterServiceLite[]>({
    queryKey: ["pandit-master-services"],
    queryFn: () => api("/api/pandit/catalog/master-services"),
  });
  const offerings = useQuery<PanditServiceLite[]>({
    queryKey: ["pandit-services"],
    queryFn: () => api("/api/pandit/services"),
  });
  const [editingId, setEditingId] = useState<number | null>(null);
  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_SERVICE_FORM);

  const reset = () => {
    setEditingId(null);
    setForm(EMPTY_SERVICE_FORM);
  };
  const serialize = () => ({
    masterServiceId: form.masterServiceId,
    price: Number(form.price),
    durationMinutes: Number(form.durationMinutes),
    mode: form.mode,
    description: form.description.trim(),
    preparation: form.preparation.trim(),
    inclusions: form.inclusions.split("\n").map(value => value.trim()).filter(Boolean),
    serviceAreas: form.serviceAreas.split(",").map(value => value.trim()).filter(Boolean),
    availability: form.availability.trim() || null,
    displayOrder: Number(form.displayOrder),
  });
  const saveService = useMutation({
    mutationFn: () => {
      const payload = serialize();
      if (!editingId) return api("/api/pandit/services", { method: "POST", body: JSON.stringify(payload) });
      const { masterServiceId: _ignored, ...editable } = payload;
      return api(`/api/pandit/services/${editingId}`, { method: "PATCH", body: JSON.stringify(editable) });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pandit-services"] });
      toast({ title: editingId ? "Service updated" : "Service added" });
      reset();
      setServiceDialogOpen(false);
    },
    onError: (error: unknown) => toast({
      title: "Could not save service",
      description: error instanceof Error ? error.message : "Please check the details and try again.",
      variant: "destructive",
    }),
  });
  const visibility = useMutation({
    mutationFn: ({ id, isActive }: { id: number; isActive: boolean }) =>
      api(`/api/pandit/services/${id}`, { method: "PATCH", body: JSON.stringify({ isActive }) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["pandit-services"] }),
  });

  const startEdit = (service: PanditServiceLite) => {
    setEditingId(service.id);
    setForm({
      masterServiceId: service.masterServiceId,
      price: service.price,
      durationMinutes: service.durationMinutes,
      mode: service.mode,
      description: service.description || "",
      preparation: service.preparation || "",
      inclusions: (service.inclusions || []).join("\n"),
      serviceAreas: (service.serviceAreas || []).join(", "),
      availability: service.availability || "",
      displayOrder: service.displayOrder || 0,
    });
    setServiceDialogOpen(true);
  };
  const startAdd = () => {
    reset();
    setServiceDialogOpen(true);
  };
  const closeServiceDialog = () => {
    setServiceDialogOpen(false);
    reset();
  };

  const master = (masters.data || []).find(item => item.id === form.masterServiceId);
  const usedMasterIds = new Set((offerings.data || []).filter(item => item.id !== editingId).map(item => item.masterServiceId));
  const availableMasters = (masters.data || []).filter(item => !usedMasterIds.has(item.id));
  const canSave = form.masterServiceId > 0 && form.price >= 0 && form.durationMinutes >= 15 && !saveService.isPending;

  return (
    <Card className="overflow-hidden border-[#D4AF37]/35">
      <div className="bg-gradient-to-r from-[#4a1a22] to-[#6D2B35] px-5 py-4 text-[#FFFAEC]">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-[#D4AF37]" />
          <h3 className="font-bold">Service catalogue</h3>
        </div>
        <p className="mt-1 text-xs text-[#FFFAEC]/75">Choose approved ceremonies and set your own price, duration and service details.</p>
      </div>
      <CardContent className="space-y-5 p-5">
        {offerings.isLoading ? (
          <div className="py-4 text-center text-sm text-stone-500"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading services…</div>
        ) : (offerings.data || []).length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {(offerings.data || []).map(service => (
              <div key={service.id} className={`rounded-lg border p-4 ${service.isActive ? "border-stone-200 bg-white" : "border-stone-200 bg-stone-50 opacity-70"}`}>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-stone-500">{service.category}</div>
                    <div className="font-bold text-[#4a1a22]">{service.name}</div>
                    <div className="mt-1 text-sm text-stone-600">₹{service.price.toLocaleString("en-IN")} · {service.durationMinutes} min</div>
                  </div>
                  <Badge variant="outline">{service.mode === "in_person" ? "In person" : service.mode === "online" ? "Online" : "Hybrid"}</Badge>
                </div>
                <div className="mt-3 flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => startEdit(service)}><Pencil className="mr-1.5 h-3.5 w-3.5" />Edit</Button>
                  <Button size="sm" variant="ghost" onClick={() => visibility.mutate({ id: service.id, isActive: !service.isActive })}>
                    {service.isActive ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" />Hide</> : <><RotateCcw className="mr-1.5 h-3.5 w-3.5" />Restore</>}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-[#D4AF37]/50 bg-[#FFFAEC]/60 p-5 text-sm text-stone-600">
            Add your first service so devotees can compare clear prices and book the right ceremony.
          </div>
        )}

        <Button className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#4a1a22]" onClick={startAdd}>
          <Plus className="mr-2 h-4 w-4" />
          Add a service
        </Button>
      </CardContent>
      <Dialog open={serviceDialogOpen} onOpenChange={open => open ? setServiceDialogOpen(true) : closeServiceDialog()}>
        <DialogContent
          className="z-[60] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border-stone-200 bg-[#FFFAEC] p-0"
          data-lenis-prevent
        >
          <DialogHeader className="border-b border-[#D4AF37]/30 px-5 py-4 pr-12 text-left">
            <DialogTitle className="text-[#4a1a22]">{editingId ? "Edit service" : "Add a service"}</DialogTitle>
            <DialogDescription className="text-stone-600">
              Choose an approved ceremony and set the details devotees see on your storefront.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 px-5 py-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label htmlFor="service-master">Approved ceremony</Label>
              <select
                id="service-master"
                className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm"
                value={form.masterServiceId}
                disabled={!!editingId}
                onChange={event => {
                  const nextId = Number(event.target.value);
                  const nextMaster = (masters.data || []).find(item => item.id === nextId);
                  setForm(current => ({ ...current, masterServiceId: nextId, mode: nextMaster?.supportedModes[0] || "in_person" }));
                }}
              >
                <option value={0}>Select a service…</option>
                {availableMasters.map(item => <option key={item.id} value={item.id}>{item.category} — {item.name}</option>)}
              </select>
            </div>
            <div><Label htmlFor="service-price">Price (₹)</Label><Input id="service-price" type="number" min={0} max={10000000} value={form.price} onChange={event => setForm(current => ({ ...current, price: Number(event.target.value) }))} /></div>
            <div><Label htmlFor="service-duration">Duration (minutes)</Label><Input id="service-duration" type="number" min={15} max={1440} value={form.durationMinutes} onChange={event => setForm(current => ({ ...current, durationMinutes: Number(event.target.value) }))} /></div>
            <div>
              <Label htmlFor="service-mode">Mode</Label>
              <select id="service-mode" className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm" value={form.mode} onChange={event => setForm(current => ({ ...current, mode: event.target.value as typeof current.mode }))}>
                {(master?.supportedModes || ["in_person"]).map(mode => <option key={mode} value={mode}>{mode === "in_person" ? "In person" : mode === "online" ? "Online" : "Hybrid"}</option>)}
              </select>
            </div>
            <div><Label htmlFor="service-availability">Availability note</Label><Input id="service-availability" maxLength={500} value={form.availability} onChange={event => setForm(current => ({ ...current, availability: event.target.value }))} placeholder="e.g. Weekday mornings" /></div>
            <div className="sm:col-span-2"><Label htmlFor="service-description">Description</Label><Textarea id="service-description" rows={3} maxLength={2000} value={form.description} onChange={event => setForm(current => ({ ...current, description: event.target.value }))} placeholder="Explain what the devotee can expect." /></div>
            <div><Label htmlFor="service-inclusions">Inclusions (one per line)</Label><Textarea id="service-inclusions" rows={3} value={form.inclusions} onChange={event => setForm(current => ({ ...current, inclusions: event.target.value }))} placeholder={"Sankalp\nHavan\nAarti"} /></div>
            <div><Label htmlFor="service-areas">Service areas (comma separated)</Label><Textarea id="service-areas" rows={3} value={form.serviceAreas} onChange={event => setForm(current => ({ ...current, serviceAreas: event.target.value }))} placeholder="Varanasi, Sarnath" /></div>
          </div>
          <DialogFooter className="border-t border-stone-200 px-5 py-4">
            <Button variant="outline" onClick={closeServiceDialog} disabled={saveService.isPending}>Cancel</Button>
            <Button className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#4a1a22]" disabled={!canSave} onClick={() => saveService.mutate()}>
              {saveService.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
              {editingId ? "Save service" : "Add to storefront"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

export function PanditStorefrontEditor() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<SfData>({ queryKey: ["pandit-storefront"], queryFn: () => api("/api/pandit/storefront") });
  const allProducts = useQuery<ProductLite[]>({ queryKey: ["all-products"], queryFn: async () => (await fetch("/api/products")).json() });

  const [form, setForm] = useState<SfForm | null>(null);
  const [pujaInput, setPujaInput] = useState("");

  useEffect(() => {
    if (data && !form) {
      setForm({
        bio: data.storefront.bio || "",
        tagline: data.storefront.tagline || "",
        whatsappNumber: data.storefront.whatsappNumber || "",
        youtubeUrl: data.storefront.youtubeUrl || "",
        instagramUrl: data.storefront.instagramUrl || "",
        facebookUrl: data.storefront.facebookUrl || "",
        websiteUrl: data.storefront.websiteUrl || "",
        themeColor: data.storefront.themeColor || "#6D2B35",
        productIds: data.storefront.productIds || [],
        featuredPujas: data.storefront.featuredPujas || [],
      });
    }
  }, [data, form]);

  const save = useMutation({
    mutationFn: (patch: Partial<SfForm>) => api("/api/pandit/storefront", { method: "PATCH", body: JSON.stringify(patch) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pandit-storefront"] });
      toast({ title: "Storefront saved" });
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Save failed", description: msg, variant: "destructive" });
    },
  });
  const updateStatus = useMutation({
    mutationFn: (status: "draft" | "pending_review") => api("/api/pandit/storefront", { method: "PATCH", body: JSON.stringify({ status }) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["pandit-storefront"] });
      toast({ title: "Store status updated" });
    },
    onError: (e: unknown) => toast({ title: "Status update failed", description: e instanceof Error ? e.message : "Please try again.", variant: "destructive" }),
  });

  if (isLoading || !form || !data) {
    return <div className="p-8 text-center text-stone-500"><Loader2 className="w-5 h-5 animate-spin inline" /> Loading…</div>;
  }

  const productOptions: ProductLite[] = (allProducts.data || []).filter((p) => !form.productIds.includes(p.id));

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-500">Public URL</div>
            <a href={data.publicUrl} target="_blank" rel="noopener noreferrer" className="text-[#6D2B35] font-semibold inline-flex items-center gap-1 hover-elevate rounded-md px-1" data-testid="link-public-storefront">
              {data.publicUrl} <ExternalLink className="w-4 h-4" />
            </a>
            <div className="text-xs text-stone-500 mt-1">{data.storefront.viewCount} views · Tier <span className="capitalize font-medium text-[#4a1a22]">{data.pandit.tier}</span> · Commission <span className="font-medium text-[#4a1a22]">{data.commissionPct}%</span> on referred shop sales</div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="capitalize">{data.storefront.status.replace("_", " ")}</Badge>
            {data.storefront.status === "published" ? (
              <Button size="sm" variant="outline" onClick={() => updateStatus.mutate("draft")} disabled={updateStatus.isPending}>Move to draft</Button>
            ) : data.storefront.status !== "pending_review" ? (
              <Button size="sm" onClick={() => updateStatus.mutate("pending_review")} disabled={updateStatus.isPending} className="bg-[#6D2B35] text-white">Submit for review</Button>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <PanditServicesEditor />

      <Card>
        <CardContent className="p-5 space-y-4">
          <h3 className="font-bold text-[#4a1a22]">Profile</h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <Label>Tagline (one line)</Label>
              <Input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} maxLength={160} placeholder="Verified Pandit · Chennai · 18 yrs experience" data-testid="input-tagline" />
            </div>
            <div>
              <Label>WhatsApp number</Label>
              <Input value={form.whatsappNumber} onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })} placeholder="91XXXXXXXXXX" data-testid="input-whatsapp" />
            </div>
          </div>
          <div>
            <Label>About (shown on storefront)</Label>
            <Textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={5} maxLength={2000} placeholder="A short story about your practice, lineage and the pujas you specialize in." data-testid="input-bio" />
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div><Label>YouTube URL</Label><Input value={form.youtubeUrl} onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })} placeholder="https://youtube.com/@…" /></div>
            <div><Label>Instagram URL</Label><Input value={form.instagramUrl} onChange={(e) => setForm({ ...form, instagramUrl: e.target.value })} placeholder="https://instagram.com/…" /></div>
            <div><Label>Facebook URL</Label><Input value={form.facebookUrl} onChange={(e) => setForm({ ...form, facebookUrl: e.target.value })} placeholder="https://facebook.com/…" /></div>
            <div><Label>Personal website</Label><Input value={form.websiteUrl} onChange={(e) => setForm({ ...form, websiteUrl: e.target.value })} placeholder="https://…" /></div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[#4a1a22]">Featured pujas</h3>
          <p className="text-xs text-stone-500">Up to 20. Shown above the generic booking CTA.</p>
          <div className="flex flex-wrap gap-2">
            {form.featuredPujas.map((p: string, i: number) => (
              <Badge key={i} className="gap-1 pr-1">{p}<button onClick={() => setForm({ ...form, featuredPujas: form.featuredPujas.filter((_, j) => j !== i) })} className="ml-1 hover:text-red-700"><X className="w-3 h-3" /></button></Badge>
            ))}
          </div>
          <div className="flex gap-2">
            <Input value={pujaInput} onChange={(e) => setPujaInput(e.target.value)} placeholder="e.g. Satyanarayan Katha" data-testid="input-puja-add" />
            <Button type="button" disabled={!pujaInput.trim() || form.featuredPujas.length >= 20} onClick={() => { setForm({ ...form, featuredPujas: [...form.featuredPujas, pujaInput.trim()] }); setPujaInput(""); }}><Plus className="w-4 h-4" /></Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5 space-y-3">
          <h3 className="font-bold text-[#4a1a22]">Curated samagri (referral commission: {data.commissionPct}%)</h3>
          <p className="text-xs text-stone-500">Pick up to 12 products. Anyone arriving from your storefront and buying any product earns you commission.</p>
          {data.pandit.tier === "free" ? (
            <div className="rounded-md border border-[#D4AF37]/50 bg-[#FFFAEC] p-4 text-sm text-[#4a1a22]" data-testid="card-storefront-free-lock">
              <div className="font-semibold">Curated samagri is a paid-tier feature</div>
              <p className="text-xs text-stone-600 mt-1">Free-tier storefronts can share your profile + bookings, but commissioned product picks unlock on Silver and above. Upgrade to start earning on every referral.</p>
              <Button asChild size="sm" className="mt-3 bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-upgrade-tier">
                <a href="/pandit/portal?tab=membership">Upgrade tier</a>
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-wrap gap-2">
                {form.productIds.map((id: number) => {
                  const p = (allProducts.data || []).find((x) => x.id === id);
                  return (
                    <Badge key={id} className="gap-1 pr-1 max-w-[260px]"><span className="truncate">{p?.name || `Product #${id}`}</span><button onClick={() => setForm({ ...form, productIds: form.productIds.filter((x: number) => x !== id) })} className="ml-1 hover:text-red-700"><X className="w-3 h-3" /></button></Badge>
                  );
                })}
              </div>
              <select className="w-full border rounded-md px-2 py-2 text-sm bg-white" defaultValue="" onChange={(e) => { const v = Number(e.target.value); if (v && !form.productIds.includes(v) && form.productIds.length < 12) setForm({ ...form, productIds: [...form.productIds, v] }); e.target.value = ""; }} data-testid="select-add-product">
                <option value="">Add a product…</option>
                {productOptions.map((p) => <option key={p.id} value={p.id}>{p.name} — ₹{p.price}</option>)}
              </select>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="border-[#D4AF37]/40 bg-gradient-to-br from-[#FFFAEC] to-white">
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs uppercase tracking-wide text-[#6D2B35] font-semibold">Membership number</div>
              <div className="text-2xl font-bold text-[#4a1a22] tracking-wider mt-1" data-testid="text-membership-no">{data.pandit.membershipNo || `VT-PND-${String(data.pandit.id).padStart(5, "0")}`}</div>
              <div className="text-xs text-stone-500 mt-1">Lifelong identifier — same across all your cards.</div>
            </div>
            <div>
              {data.pandit.cardIssued ? (
                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 gap-1"><BadgeCheck className="w-3 h-3" />Card issued</Badge>
              ) : (
                <Badge className="bg-amber-100 text-amber-800 border border-amber-200 gap-1"><ShieldAlert className="w-3 h-3" />Awaiting admin issuance</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={() => save.mutate(form)} disabled={save.isPending} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-save-storefront">
          {save.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save storefront
        </Button>
        <a href="/api/pandit/storefront/qr.png" target="_blank" rel="noopener noreferrer">
          <Button variant="outline">View QR code</Button>
        </a>
        {data.pandit.cardIssued ? (
          <a href="/api/pandit/storefront/card.pdf" download>
            <Button variant="outline" data-testid="btn-download-card"><Download className="w-4 h-4 mr-2" />Download business card (front + back PDF)</Button>
          </a>
        ) : (
          <Button variant="outline" disabled title="Admin will issue your card shortly" data-testid="btn-download-card-disabled">
            <Download className="w-4 h-4 mr-2" />Card awaiting issuance
          </Button>
        )}
      </div>
    </div>
  );
}

// One ₹999 physical card per membership. Razorpay checkout, then admin
// prints and ships from the affiliate panel.
declare global {
  interface Window { Razorpay: any }
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (document.getElementById("razorpay-script")) { resolve(true); return; }
    const s = document.createElement("script");
    s.id = "razorpay-script";
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.onload = () => resolve(true);
    s.onerror = () => resolve(false);
    document.body.appendChild(s);
  });
}

const CARD_PRICE_INR = 999;

type PanditMe = { pandit: { name?: string; phone?: string; city?: string; state?: string } };

type CardOrderRow = {
  id: number;
  cardType: "printed" | "nfc";
  status: string;
  paymentStatus: string;
  totalAmount: number;
  trackingNumber: string | null;
  trackingUrl: string | null;
  createdAt: string;
};

type CreateCardOrderResponse = {
  orderId: number;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  key: string;
  unitPrice: number;
  totalAmount: number;
  mock?: boolean;
};

type CardOrderForm = {
  cardType: "printed" | "nfc";
  shippingName: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingState: string;
  shippingPincode: string;
  notes: string;
};

export function PanditCardOrders() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const orders = useQuery<{ items: CardOrderRow[] }>({ queryKey: ["pandit-card-orders"], queryFn: () => api("/api/pandit/card-orders") });
  const me = useQuery<PanditMe>({ queryKey: ["pandit-me"], queryFn: () => api("/api/pandit/me") });
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<CardOrderForm>({
    cardType: "printed",
    shippingName: "", shippingPhone: "", shippingAddress: "",
    shippingCity: "", shippingState: "", shippingPincode: "",
    notes: "",
  });
  const [busy, setBusy] = useState(false);

  const items = orders.data?.items || [];
  const hasIssuedCard = items.some((o) => ["paid", "printing", "shipped", "delivered"].includes(o.status));

  const openCheckout = () => {
    const p = me.data?.pandit;
    setForm((f) => ({
      ...f,
      shippingName: f.shippingName || p?.name || "",
      shippingPhone: f.shippingPhone || p?.phone || "",
      shippingCity: f.shippingCity || p?.city || "",
      shippingState: f.shippingState || p?.state || "",
    }));
    setOpen(true);
  };

  const checkoutAndPay = async () => {
    try {
      setBusy(true);
      const scriptOk = await loadRazorpayScript();
      if (!scriptOk) {
        toast({ title: "Payment gateway error", description: "Could not load the payment gateway. Please try again.", variant: "destructive" });
        setBusy(false);
        return;
      }
      const created = await api<CreateCardOrderResponse>("/api/pandit/card-order", {
        method: "POST",
        body: JSON.stringify(form),
      });

      const options = {
        key: created.key,
        amount: created.amount,
        currency: created.currency,
        name: "Vedic Tatva",
        description: "Pandit Card (printed + shipped to your address)",
        order_id: created.razorpayOrderId,
        prefill: { name: form.shippingName, contact: form.shippingPhone },
        theme: { color: "#6D2B35" },
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          try {
            const verify = await api<{ success: boolean; idempotent?: boolean; message?: string }>("/api/pandit/card-order/verify", {
              method: "POST",
              body: JSON.stringify({
                orderId: created.orderId,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });
            if (verify.success) {
              toast({ title: "Payment successful", description: "Admin will print and ship your card within 5-7 working days." });
              setOpen(false);
              qc.invalidateQueries({ queryKey: ["pandit-card-orders"] });
            } else {
              toast({ title: "Payment verification failed", description: verify.message || "Please contact support.", variant: "destructive" });
            }
          } catch (verr) {
            const msg = verr instanceof Error ? verr.message : "Please contact support.";
            toast({ title: "Verification error", description: msg, variant: "destructive" });
          } finally { setBusy(false); }
        },
        modal: { ondismiss: () => setBusy(false) },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", (resp: { error?: { description?: string } }) => {
        toast({ title: "Payment failed", description: resp.error?.description || "Please try again.", variant: "destructive" });
        setBusy(false);
      });
      rzp.open();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Please try again.";
      toast({ title: "Could not start checkout", description: msg, variant: "destructive" });
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h3 className="font-bold text-[#4a1a22]">Order your physical Pandit card</h3>
              <p className="text-sm text-stone-600 mt-1">Premium printed or NFC card with your membership number, QR code and contact details — shipped to your door.</p>
              <div className="text-xs text-stone-500 mt-2">₹{CARD_PRICE_INR} · One card per membership · Ships within 5-7 working days after payment</div>
            </div>
            <Button
              onClick={openCheckout}
              disabled={hasIssuedCard}
              className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
              data-testid="btn-order-card"
            >
              {hasIssuedCard ? "Card already issued" : `Order card · ₹${CARD_PRICE_INR}`}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-[#4a1a22] mb-3">Card order</h3>
          {orders.isLoading ? (
            <div className="text-sm text-stone-500"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</div>
          ) : items.length === 0 ? (
            <div className="text-sm text-stone-500">No card ordered yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-stone-500"><th className="py-2">#</th><th>Type</th><th>Amount</th><th>Submitted</th><th>Payment</th><th>Status</th><th>Tracking</th></tr></thead>
                <tbody>
                  {items.map((o) => (
                    <tr key={o.id} className="border-t" data-testid={`row-card-order-${o.id}`}>
                      <td className="py-2">{o.id}</td>
                      <td className="capitalize">{o.cardType}</td>
                      <td>₹{o.totalAmount}</td>
                      <td className="text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                      <td><Badge variant="outline" className="capitalize">{o.paymentStatus}</Badge></td>
                      <td><Badge className="capitalize">{o.status}</Badge></td>
                      <td className="text-xs">{o.trackingUrl ? <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="text-[#6D2B35] underline inline-flex items-center gap-1"><Truck className="w-3 h-3" />{o.trackingNumber || "Track"}</a> : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {open && (
        <div className="fixed inset-0 bg-black/40 z-50 grid place-items-center p-4" onClick={() => !busy && setOpen(false)}>
          <Card className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <CardContent className="p-5 space-y-3">
              <div>
                <h3 className="font-bold text-[#4a1a22]">Order Pandit card</h3>
                <p className="text-xs text-stone-500 mt-1">One card per membership. ₹{CARD_PRICE_INR} including printing and shipping.</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setForm({ ...form, cardType: "printed" })} className={`p-3 rounded-md border text-left text-sm ${form.cardType === "printed" ? "border-[#6D2B35] bg-[#FFFAEC]" : "border-stone-200"}`} data-testid="opt-printed"><div className="font-semibold">Printed</div><div className="text-xs text-stone-500">Premium card stock</div></button>
                <button onClick={() => setForm({ ...form, cardType: "nfc" })} className={`p-3 rounded-md border text-left text-sm ${form.cardType === "nfc" ? "border-[#6D2B35] bg-[#FFFAEC]" : "border-stone-200"}`} data-testid="opt-nfc"><div className="font-semibold">NFC</div><div className="text-xs text-stone-500">Tap-to-share</div></button>
              </div>
              <div><Label>Full name</Label><Input value={form.shippingName} onChange={(e) => setForm({ ...form, shippingName: e.target.value })} /></div>
              <div><Label>Phone</Label><Input value={form.shippingPhone} onChange={(e) => setForm({ ...form, shippingPhone: e.target.value })} /></div>
              <div><Label>Address</Label><Textarea rows={2} value={form.shippingAddress} onChange={(e) => setForm({ ...form, shippingAddress: e.target.value })} /></div>
              <div className="grid grid-cols-3 gap-2">
                <Input placeholder="City" value={form.shippingCity} onChange={(e) => setForm({ ...form, shippingCity: e.target.value })} />
                <Input placeholder="State" value={form.shippingState} onChange={(e) => setForm({ ...form, shippingState: e.target.value })} />
                <Input placeholder="Pincode" value={form.shippingPincode} onChange={(e) => setForm({ ...form, shippingPincode: e.target.value })} />
              </div>
              <div><Label>Notes (optional)</Label><Textarea rows={2} maxLength={500} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Any special instructions?" /></div>
              <div className="flex items-center justify-between pt-2 border-t">
                <div className="text-sm"><span className="text-stone-500">Total:</span> <span className="font-semibold text-[#4a1a22]">₹{CARD_PRICE_INR}</span></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setOpen(false)} disabled={busy}>Cancel</Button>
                  <Button
                    onClick={checkoutAndPay}
                    disabled={busy || !form.shippingName || !form.shippingPhone || !form.shippingAddress || !form.shippingCity || !form.shippingState || !form.shippingPincode}
                    className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
                    data-testid="btn-place-card-order"
                  >
                    {busy && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Pay ₹{CARD_PRICE_INR}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export function PanditReferralsPanel() {
  const { data, isLoading } = useQuery<{ items: any[]; summary: { totalCommission: number; pending: number; approved: number; paid: number; count: number } }>({
    queryKey: ["pandit-referrals"],
    queryFn: () => api("/api/pandit/referrals"),
  });
  const payouts = useQuery<{ items: any[] }>({
    queryKey: ["pandit-payouts"],
    queryFn: () => api("/api/pandit/payouts"),
  });
  if (isLoading) return <div className="p-8 text-center text-stone-500"><Loader2 className="w-5 h-5 animate-spin inline" /> Loading…</div>;
  const items = data?.items || [];
  const s = data?.summary || { totalCommission: 0, pending: 0, approved: 0, paid: 0, count: 0 };
  const payoutItems = payouts.data?.items || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Lifetime commission</div><div className="text-lg font-bold text-[#4a1a22]">₹{s.totalCommission.toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Pending review</div><div className="text-lg font-bold text-amber-700">₹{s.pending.toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Approved (awaiting payout)</div><div className="text-lg font-bold text-sky-700">₹{(s.approved || 0).toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Paid out</div><div className="text-lg font-bold text-emerald-700">₹{s.paid.toLocaleString("en-IN")}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Conversions</div><div className="text-lg font-bold text-[#4a1a22]">{s.count}</div></CardContent></Card>
      </div>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-[#4a1a22] mb-3">Referral activity</h3>
          {items.length === 0 ? (
            <div className="text-sm text-stone-500">No referrals yet. Share your storefront link or QR card to start earning.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-stone-500"><th className="py-2">Date</th><th>Type</th><th>Email</th><th>Gross</th><th>Commission</th><th>Status</th></tr></thead>
                <tbody>
                  {items.map((r) => (
                    <tr key={r.id} className="border-t" data-testid={`row-referral-${r.id}`}>
                      <td className="py-2 text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                      <td className="capitalize">{r.kind}</td>
                      <td className="text-xs">{r.refEmail || "—"}</td>
                      <td>₹{r.grossAmount.toLocaleString("en-IN")}</td>
                      <td className="font-semibold">₹{r.commissionAmount.toLocaleString("en-IN")} <span className="text-xs text-stone-400">({r.commissionPct}%)</span></td>
                      <td><Badge className="capitalize">{r.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-[#4a1a22] mb-3">Payout history</h3>
          {payouts.isLoading ? (
            <div className="text-sm text-stone-500"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</div>
          ) : payoutItems.length === 0 ? (
            <div className="text-sm text-stone-500">No payouts yet. Approved commissions are paid out in batches.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-left text-xs text-stone-500"><th className="py-2">Date</th><th>Amount</th><th>Method</th><th>Reference</th><th>Settles</th><th>Notes</th></tr></thead>
                <tbody>
                  {payoutItems.map((p: any) => (
                    <tr key={p.id} className="border-t align-top" data-testid={`row-payout-${p.id}`}>
                      <td className="py-2 text-xs">{new Date(p.paidAt).toLocaleDateString("en-IN")}</td>
                      <td className="font-semibold text-emerald-700">₹{p.amountInr.toLocaleString("en-IN")}</td>
                      <td className="capitalize">{p.method}</td>
                      <td className="text-xs">{p.reference || "—"}</td>
                      <td className="text-xs text-stone-500">{(p.referralIds || []).length} referral{(p.referralIds || []).length === 1 ? "" : "s"}</td>
                      <td className="text-xs text-stone-500 max-w-xs truncate">{p.notes || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
