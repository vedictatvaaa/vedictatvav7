// Pandit-portal: Storefront editor + membership-card history + Referrals.
// Panels are backed by their respective authenticated Pandit APIs. Storefront
// edits are auto-saved on submit (no debounce noise).
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
import { Download, ExternalLink, Plus, X, Loader2, Truck, BadgeCheck, ShieldAlert, BookOpen, Pencil, EyeOff, RotateCcw, Wallet, CreditCard, Package, Image, CalendarDays, Trash2 } from "lucide-react";
import { getPanditToken } from "@/lib/panditAuth";
import { useCart } from "@/lib/cart";
import type { Product } from "@shared/schema";
import { PanditEmptyState, PanditErrorState, PanditInlineLoading, PanditKpi, PanditKpiGrid, PanditLoadingState, PanditSectionHeader } from "@/components/pandit/PanditSection";
import { PanditMembershipCard } from "@/components/pandit/PanditMembershipCard";

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
  pandit: { id: number; name: string; slug: string; tier: string; productCommissionPct: number; registrationNo?: string | null; membershipNo?: string | null; cardIssued?: boolean; cardIssuedAt?: string | null };
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

type ServiceForm = {
  masterServiceId: number;
  price: number;
  durationMinutes: number;
  mode: PanditServiceLite["mode"];
  description: string;
  preparation: string;
  inclusions: string;
  serviceAreas: string;
  availability: string;
  displayOrder: number;
};

const EMPTY_SERVICE_FORM: ServiceForm = {
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
        ) : offerings.isError ? (
          <PanditErrorState title="Services could not be loaded" onRetry={() => void offerings.refetch()} />
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

type PanditPackage = { id: number; name: string; slug: string; description: string; price: number; compareAtPrice: number | null; displayOrder: number; isActive: boolean; isPublished: boolean; items: Array<{ panditServiceId: number; displayOrder: number }> };
type GalleryItem = { id: number; mediaKind: "image"; mediaUrl: string; altText: string; caption: string | null; displayOrder: number; isPublished: boolean };
type AvailabilityRule = { id: number; weekday: number; startMinutes: number; endMinutes: number; timezone: string; mode: "in_person" | "online" | "hybrid"; isActive: boolean };
type PackageForm = { name: string; slug: string; description: string; price: number; compareAtPrice: number | ""; displayOrder: number; isActive: boolean; serviceIds: number[] };
type GalleryForm = { mediaUrl: string; altText: string; caption: string; displayOrder: number };
type AvailabilityForm = { weekday: number; start: string; end: string; timezone: string; mode: AvailabilityRule["mode"]; isActive: boolean };
const weekdays = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const minutesToTime = (value: number) => `${String(Math.floor(value / 60)).padStart(2, "0")}:${String(value % 60).padStart(2, "0")}`;
const timeToMinutes = (value: string) => { const [hours, minutes] = value.split(":").map(Number); return hours * 60 + minutes; };
const emptyPackage: PackageForm = { name: "", slug: "", description: "", price: 0, compareAtPrice: "", displayOrder: 0, isActive: true, serviceIds: [] };
const emptyGallery: GalleryForm = { mediaUrl: "", altText: "", caption: "", displayOrder: 0 };
const emptyAvailability: AvailabilityForm = { weekday: 0, start: "09:00", end: "17:00", timezone: "Asia/Kolkata", mode: "in_person", isActive: true };

function PanditOwnerTools() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const services = useQuery<PanditServiceLite[]>({ queryKey: ["pandit-services"], queryFn: () => api("/api/pandit/services") });
  const packages = useQuery<PanditPackage[]>({ queryKey: ["pandit-packages"], queryFn: () => api("/api/pandit/packages") });
  const gallery = useQuery<GalleryItem[]>({ queryKey: ["pandit-gallery"], queryFn: () => api("/api/pandit/gallery") });
  const availability = useQuery<AvailabilityRule[]>({ queryKey: ["pandit-availability"], queryFn: () => api("/api/pandit/availability") });
  const [packageForm, setPackageForm] = useState(emptyPackage); const [packageId, setPackageId] = useState<number | null>(null); const [packageOpen, setPackageOpen] = useState(false);
  const [galleryForm, setGalleryForm] = useState(emptyGallery); const [galleryId, setGalleryId] = useState<number | null>(null); const [galleryOpen, setGalleryOpen] = useState(false);
  const [availabilityForm, setAvailabilityForm] = useState(emptyAvailability); const [availabilityId, setAvailabilityId] = useState<number | null>(null); const [availabilityOpen, setAvailabilityOpen] = useState(false);
  const invalidate = (key: string) => qc.invalidateQueries({ queryKey: [key] });
  const mutation = <T,>(key: string, fn: () => Promise<T>, success: string) => useMutation({ mutationFn: fn, onSuccess: () => { invalidate(key); toast({ title: success }); }, onError: (error: unknown) => toast({ title: "Could not save changes", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }) });
  const savePackage = mutation("pandit-packages", () => api(packageId ? `/api/pandit/packages/${packageId}` : "/api/pandit/packages", { method: packageId ? "PATCH" : "POST", body: JSON.stringify({ ...packageForm, price: Number(packageForm.price), compareAtPrice: packageForm.compareAtPrice === "" ? null : Number(packageForm.compareAtPrice), items: packageForm.serviceIds.map((panditServiceId, displayOrder) => ({ panditServiceId, displayOrder })) }) }), packageId ? "Package updated" : "Package added");
  const saveGallery = mutation("pandit-gallery", () => api(galleryId ? `/api/pandit/gallery/${galleryId}` : "/api/pandit/gallery", { method: galleryId ? "PATCH" : "POST", body: JSON.stringify({ ...galleryForm, mediaKind: "image", caption: galleryForm.caption.trim() || null, displayOrder: Number(galleryForm.displayOrder) }) }), galleryId ? "Gallery item updated" : "Gallery item added");
  const saveAvailability = mutation("pandit-availability", () => api(availabilityId ? `/api/pandit/availability/${availabilityId}` : "/api/pandit/availability", { method: availabilityId ? "PATCH" : "POST", body: JSON.stringify({ ...availabilityForm, startMinutes: timeToMinutes(availabilityForm.start), endMinutes: timeToMinutes(availabilityForm.end) }) }), availabilityId ? "Availability updated" : "Availability added");
  const remove = (key: string, path: string) => api(path, { method: "DELETE" }).then(() => { invalidate(key); toast({ title: "Item removed" }); }).catch((error: unknown) => toast({ title: "Could not remove item", description: error instanceof Error ? error.message : "Please try again.", variant: "destructive" }));
  const closePackage = () => { setPackageOpen(false); setPackageId(null); setPackageForm(emptyPackage); };
  const closeGallery = () => { setGalleryOpen(false); setGalleryId(null); setGalleryForm(emptyGallery); };
  const closeAvailability = () => { setAvailabilityOpen(false); setAvailabilityId(null); setAvailabilityForm(emptyAvailability); };
  const activeServices = (services.data || []).filter(service => service.isActive);
  const status = (published: boolean) => <Badge className={published ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}>{published ? "Published" : "Draft / pending review"}</Badge>;
  return <div className="space-y-5">
    <Card className="overflow-hidden border-[#D4AF37]/35"><div className="bg-gradient-to-r from-[#4a1a22] to-[#6D2B35] px-5 py-4 text-[#FFFAEC]"><div className="flex items-center gap-2"><Package className="h-5 w-5 text-[#D4AF37]" /><h3 className="font-bold">Ceremony packages</h3></div><p className="mt-1 text-xs text-[#FFFAEC]/75">Bundle your active services. Publication is handled by moderation.</p></div><CardContent className="space-y-3 p-5">{packages.isLoading ? <PanditInlineLoading label="Loading packages…" /> : packages.isError ? <PanditErrorState title="Packages could not be loaded" onRetry={() => void packages.refetch()} /> : <div className="grid gap-3 sm:grid-cols-2">{(packages.data || []).map(item => <div key={item.id} className="rounded-lg border border-stone-200 p-4"><div className="flex justify-between gap-2"><div><b className="text-[#4a1a22]">{item.name}</b><p className="text-xs text-stone-500">₹{item.price.toLocaleString("en-IN")} · {item.items.length} services</p></div>{status(item.isPublished)}</div><div className="mt-3 flex gap-2"><Button size="sm" variant="outline" onClick={() => { setPackageId(item.id); setPackageForm({ name: item.name, slug: item.slug, description: item.description, price: item.price, compareAtPrice: item.compareAtPrice ?? "", displayOrder: item.displayOrder, isActive: item.isActive, serviceIds: item.items.map(x => x.panditServiceId) }); setPackageOpen(true); }}><Pencil className="mr-1 h-3.5 w-3.5" />Edit</Button><Button size="sm" variant="ghost" onClick={() => void remove("pandit-packages", `/api/pandit/packages/${item.id}`)}><Trash2 className="mr-1 h-3.5 w-3.5" />Remove</Button></div></div>)}</div>}<Button className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#4a1a22]" onClick={() => setPackageOpen(true)}><Plus className="mr-2 h-4 w-4" />Add package</Button></CardContent></Card>
    <Card className="border-[#D4AF37]/35"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-2"><Image className="h-5 w-5 text-[#6D2B35]" /><div><h3 className="font-bold text-[#4a1a22]">Gallery</h3><p className="text-xs text-stone-500">Images remain drafts until moderated.</p></div></div>{gallery.isLoading ? <PanditInlineLoading label="Loading gallery…" /> : gallery.isError ? <PanditErrorState title="Gallery could not be loaded" onRetry={() => void gallery.refetch()} /> : <div className="grid gap-3 sm:grid-cols-2">{(gallery.data || []).map(item => <div key={item.id} className="rounded-lg border border-stone-200 p-3"><div className="flex gap-3"><img src={item.mediaUrl} alt={item.altText} className="h-16 w-16 rounded object-cover" /><div className="min-w-0 flex-1"><b className="block truncate text-[#4a1a22]">{item.altText}</b>{status(item.isPublished)}<div className="mt-2 flex gap-2"><Button size="sm" variant="outline" onClick={() => { setGalleryId(item.id); setGalleryForm({ mediaUrl: item.mediaUrl, altText: item.altText, caption: item.caption || "", displayOrder: item.displayOrder }); setGalleryOpen(true); }}>Edit</Button><Button size="sm" variant="ghost" onClick={() => void remove("pandit-gallery", `/api/pandit/gallery/${item.id}`)}>Remove</Button></div></div></div></div>)}</div>}<Button variant="outline" onClick={() => setGalleryOpen(true)}><Plus className="mr-2 h-4 w-4" />Add image</Button></CardContent></Card>
    <Card className="border-[#D4AF37]/35"><CardContent className="space-y-3 p-5"><div className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-[#6D2B35]" /><div><h3 className="font-bold text-[#4a1a22]">Recurring availability</h3><p className="text-xs text-stone-500">Set weekly booking windows in your timezone.</p></div></div>{availability.isLoading ? <PanditInlineLoading label="Loading availability…" /> : availability.isError ? <PanditErrorState title="Availability could not be loaded" onRetry={() => void availability.refetch()} /> : <div className="grid gap-3 sm:grid-cols-2">{(availability.data || []).map(rule => <div key={rule.id} className="flex items-center justify-between rounded-lg border border-stone-200 p-3"><div><b className="text-[#4a1a22]">{weekdays[rule.weekday]}</b><p className="text-sm text-stone-600">{minutesToTime(rule.startMinutes)}–{minutesToTime(rule.endMinutes)} · {rule.timezone}</p><p className="text-xs text-stone-500">{rule.mode.replace("_", " ")} · {rule.isActive ? "Active" : "Inactive"}</p></div><Button size="sm" variant="outline" onClick={() => { setAvailabilityId(rule.id); setAvailabilityForm({ weekday: rule.weekday, start: minutesToTime(rule.startMinutes), end: minutesToTime(rule.endMinutes), timezone: rule.timezone, mode: rule.mode, isActive: rule.isActive }); setAvailabilityOpen(true); }}>Edit</Button></div>)}</div>}<Button variant="outline" onClick={() => setAvailabilityOpen(true)}><Plus className="mr-2 h-4 w-4" />Add availability</Button></CardContent></Card>
    <Dialog open={packageOpen} onOpenChange={open => open ? setPackageOpen(true) : closePackage()}><DialogContent data-lenis-prevent className="max-h-[calc(100dvh-2rem)] overflow-y-auto bg-[#FFFAEC]"><DialogHeader><DialogTitle>{packageId ? "Edit package" : "Add package"}</DialogTitle><DialogDescription>Only active services can be included. An administrator reviews publication.</DialogDescription></DialogHeader><div className="grid gap-4"><div><Label htmlFor="package-name">Package name</Label><Input id="package-name" value={packageForm.name} onChange={e => setPackageForm(p => ({ ...p, name: e.target.value }))} /></div><div><Label htmlFor="package-slug">Slug</Label><Input id="package-slug" value={packageForm.slug} onChange={e => setPackageForm(p => ({ ...p, slug: e.target.value }))} placeholder="festival-puja-package" /></div><div><Label htmlFor="package-description">Description</Label><Textarea id="package-description" value={packageForm.description} onChange={e => setPackageForm(p => ({ ...p, description: e.target.value }))} /></div><div className="grid grid-cols-2 gap-3"><div><Label htmlFor="package-price">Price (₹)</Label><Input id="package-price" type="number" min={0} value={packageForm.price} onChange={e => setPackageForm(p => ({ ...p, price: Number(e.target.value) }))} /></div><div><Label htmlFor="package-compare">Compare-at price (₹)</Label><Input id="package-compare" type="number" min={1} value={packageForm.compareAtPrice} onChange={e => setPackageForm(p => ({ ...p, compareAtPrice: e.target.value === "" ? "" : Number(e.target.value) }))} /></div></div><div><Label htmlFor="package-order">Display order</Label><Input id="package-order" type="number" min={0} value={packageForm.displayOrder} onChange={e => setPackageForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} /></div><fieldset><legend className="text-sm font-medium">Active services</legend><div className="mt-2 space-y-2">{activeServices.map(service => <label key={service.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={packageForm.serviceIds.includes(service.id)} onChange={e => setPackageForm(p => ({ ...p, serviceIds: e.target.checked ? [...p.serviceIds, service.id] : p.serviceIds.filter(id => id !== service.id) }))} />{service.name} — ₹{service.price}</label>)}</div></fieldset><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={packageForm.isActive} onChange={e => setPackageForm(p => ({ ...p, isActive: e.target.checked }))} />Active in my catalogue</label></div><DialogFooter><Button variant="outline" onClick={closePackage}>Cancel</Button><Button disabled={!packageForm.name.trim() || !packageForm.slug.trim() || !packageForm.serviceIds.length || savePackage.isPending} onClick={() => savePackage.mutate()} className="bg-[#6D2B35] text-[#D4AF37]">Save package</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={galleryOpen} onOpenChange={open => open ? setGalleryOpen(true) : closeGallery()}><DialogContent data-lenis-prevent className="bg-[#FFFAEC]"><DialogHeader><DialogTitle>{galleryId ? "Edit gallery image" : "Add gallery image"}</DialogTitle><DialogDescription>Use a managed upload URL. Images are reviewed before publication.</DialogDescription></DialogHeader><div className="grid gap-4"><div><Label htmlFor="gallery-url">Image URL</Label><Input id="gallery-url" value={galleryForm.mediaUrl} onChange={e => setGalleryForm(p => ({ ...p, mediaUrl: e.target.value }))} placeholder="/uploads/…" /></div><div><Label htmlFor="gallery-alt">Alt text</Label><Input id="gallery-alt" value={galleryForm.altText} onChange={e => setGalleryForm(p => ({ ...p, altText: e.target.value }))} /></div><div><Label htmlFor="gallery-caption">Caption</Label><Textarea id="gallery-caption" value={galleryForm.caption} onChange={e => setGalleryForm(p => ({ ...p, caption: e.target.value }))} /></div><div><Label htmlFor="gallery-order">Display order</Label><Input id="gallery-order" type="number" min={0} value={galleryForm.displayOrder} onChange={e => setGalleryForm(p => ({ ...p, displayOrder: Number(e.target.value) }))} /></div></div><DialogFooter><Button variant="outline" onClick={closeGallery}>Cancel</Button><Button disabled={!galleryForm.mediaUrl.trim() || !galleryForm.altText.trim() || saveGallery.isPending} onClick={() => saveGallery.mutate()} className="bg-[#6D2B35] text-[#D4AF37]">Save image</Button></DialogFooter></DialogContent></Dialog>
    <Dialog open={availabilityOpen} onOpenChange={open => open ? setAvailabilityOpen(true) : closeAvailability()}><DialogContent data-lenis-prevent className="bg-[#FFFAEC]"><DialogHeader><DialogTitle>{availabilityId ? "Edit availability" : "Add availability"}</DialogTitle><DialogDescription>Times are saved as minutes and displayed in 24-hour HH:MM format.</DialogDescription></DialogHeader><div className="grid gap-4 sm:grid-cols-2"><div><Label htmlFor="availability-day">Weekday</Label><select id="availability-day" className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm" value={availabilityForm.weekday} onChange={e => setAvailabilityForm(p => ({ ...p, weekday: Number(e.target.value) }))}>{weekdays.map((day, value) => <option key={day} value={value}>{day}</option>)}</select></div><div><Label htmlFor="availability-timezone">Timezone</Label><Input id="availability-timezone" value={availabilityForm.timezone} onChange={e => setAvailabilityForm(p => ({ ...p, timezone: e.target.value }))} /></div><div><Label htmlFor="availability-start">Start time</Label><Input id="availability-start" type="time" value={availabilityForm.start} onChange={e => setAvailabilityForm(p => ({ ...p, start: e.target.value }))} /></div><div><Label htmlFor="availability-end">End time</Label><Input id="availability-end" type="time" value={availabilityForm.end} onChange={e => setAvailabilityForm(p => ({ ...p, end: e.target.value }))} /></div><div><Label htmlFor="availability-mode">Mode</Label><select id="availability-mode" className="mt-1 h-10 w-full rounded-md border border-input bg-white px-3 text-sm" value={availabilityForm.mode} onChange={e => setAvailabilityForm(p => ({ ...p, mode: e.target.value as AvailabilityRule["mode"] }))}><option value="in_person">In person</option><option value="online">Online</option><option value="hybrid">Hybrid</option></select></div><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={availabilityForm.isActive} onChange={e => setAvailabilityForm(p => ({ ...p, isActive: e.target.checked }))} />Active</label></div><DialogFooter><Button variant="outline" onClick={closeAvailability}>Cancel</Button><Button disabled={!availabilityForm.timezone.trim() || timeToMinutes(availabilityForm.end) <= timeToMinutes(availabilityForm.start) || saveAvailability.isPending} onClick={() => saveAvailability.mutate()} className="bg-[#6D2B35] text-[#D4AF37]">Save availability</Button></DialogFooter></DialogContent></Dialog>
  </div>;
}

export function PanditStorefrontEditor({ focus = "storefront" }: { focus?: "storefront" | "services" }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data, isLoading, isError, refetch } = useQuery<SfData>({ queryKey: ["pandit-storefront"], queryFn: () => api("/api/pandit/storefront") });
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

  if (isLoading) return <PanditLoadingState label="Loading storefront…" />;
  if (isError) return <div className="space-y-5"><PanditSectionHeader title={focus === "services" ? "Services" : "My storefront"} description={focus === "services" ? "Set clear offerings, prices, preparation details, and availability." : "Shape the public profile yajamanas see before they book."} /><PanditErrorState detail="Your storefront details could not be loaded." onRetry={() => void refetch()} /></div>;
  if (!form || !data) return <PanditLoadingState label="Preparing storefront…" />;

  const productOptions: ProductLite[] = (allProducts.data || []).filter((p) => !form.productIds.includes(p.id));
  const sectionTitle = focus === "services" ? "Services" : "My storefront";
  const sectionDescription = focus === "services" ? "Set clear offerings, prices, preparation details, and availability." : "Shape the public profile yajamanas see before they book.";

  return (
    <div className="min-w-0 space-y-5" data-testid="pandit-storefront">
      <PanditSectionHeader title={sectionTitle} description={sectionDescription} actions={<Button onClick={() => save.mutate(form)} disabled={save.isPending} size="sm" className="bg-[#55252d] text-[#fff8e9] hover:bg-[#3e1b20]" data-testid="btn-save-storefront">{save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save storefront</Button>} />
      <Card className="border-[#d8c8ae]/75 bg-[#fffdf8]">
        <CardContent className="p-5 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-stone-500">Public URL</div>
            <a href={data.publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex max-w-full items-center gap-1 break-all rounded-md px-1 font-semibold text-[#6D2B35] hover-elevate" data-testid="link-public-storefront">
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
      <PanditOwnerTools />

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

type MembershipCardProduct = {
  id: number;
  slug: string | null;
  name: string;
  description: string;
  image: string;
  category: string;
  productType: "pandit_membership_card";
  price: number;
  stock: number;
  available: boolean;
  variationGroupId: string;
  variationLabel: string | null;
};

function PanditMembershipCardStore() {
  const { items, addToCart } = useCart();
  const { toast } = useToast();
  const products = useQuery<{ variationGroupId: string; products: MembershipCardProduct[] }>({
    queryKey: ["pandit-membership-card-products"],
    queryFn: () => api("/api/pandit/membership-card-products"),
  });
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const cardQuantityInCart = items.reduce((sum, item) =>
    sum + (item.product.productType === "pandit_membership_card" ? item.quantity : 0), 0);
  const selected = (products.data?.products || []).find(product => product.id === selectedId)
    || (products.data?.products || []).find(product => product.available) || null;
  const selectedExistingQuantity = selected
    ? items.filter(item => item.product.id === selected.id).reduce((sum, item) => sum + item.quantity, 0)
    : 0;
  const quantityLimit = selected
    ? Math.max(0, Math.min(10 - cardQuantityInCart, selected.stock - selectedExistingQuantity))
    : 0;
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    if (selectedId === null && selected) setSelectedId(selected.id);
  }, [selected, selectedId]);
  useEffect(() => {
    setQuantity(current => Math.max(1, Math.min(current, Math.max(1, quantityLimit))));
  }, [quantityLimit]);

  const addSelectedToCart = () => {
    if (!selected || !selected.available || quantityLimit < 1) return;
    // The membership-card endpoint is the source of the live price, stock and
    // variation; no Pandit ownership data is placed in the client cart.
    addToCart(selected as unknown as Product, Math.min(quantity, quantityLimit), selected.variationLabel || undefined);
    toast({ title: "Membership card added", description: "Your physical card is ready in the cart." });
  };

  const errorMessage = products.error instanceof Error ? products.error.message : "";
  const accessDenied = /authentication|required|approved Pandit membership/i.test(errorMessage);

  return (
    <Card className="border-[#D4AF37]/40 bg-gradient-to-br from-[#FFFAEC] to-white" data-testid="pandit-membership-card-store">
      <CardContent className="space-y-4 p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-bold text-[#4a1a22]">Physical membership card</h3>
            <p className="mt-1 text-sm text-stone-600">Choose your Plastic or Metal membership card. It is added to your regular cart for checkout and delivery.</p>
          </div>
          <Button asChild variant="outline" className="border-[#6D2B35]/30 text-[#6D2B35]">
            <a href="/cart">View cart</a>
          </Button>
        </div>

        {products.isLoading ? (
          <PanditInlineLoading label="Loading membership card options…" />
        ) : products.isError ? (
          <div className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <p className="font-semibold">{accessDenied ? "Membership card access is unavailable" : "Membership card options could not be loaded"}</p>
            <p className="mt-1">{accessDenied ? "Please sign in with an approved Pandit membership to order a physical card." : errorMessage || "Please try again."}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => void products.refetch()}>Try again</Button>
          </div>
        ) : !products.data?.products.length ? (
          <div className="rounded-md border border-dashed border-[#D4AF37]/50 p-4 text-sm text-stone-600">Membership cards are not available to order right now. Please check back later.</div>
        ) : (
          <>
            <fieldset>
              <legend className="text-sm font-semibold text-[#4a1a22]">Card material</legend>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                {products.data.products.map(product => {
                  const outOfStock = product.stock <= 0;
                  const unavailable = !product.available && !outOfStock;
                  const selectedOption = selected?.id === product.id;
                  return (
                    <button
                      key={product.id}
                      type="button"
                      disabled={unavailable || outOfStock}
                      aria-pressed={selectedOption}
                      onClick={() => setSelectedId(product.id)}
                      className={`rounded-lg border p-4 text-left transition-colors ${selectedOption ? "border-[#6D2B35] bg-[#FFFAEC] ring-1 ring-[#D4AF37]" : "border-stone-200 bg-white"} ${unavailable || outOfStock ? "cursor-not-allowed opacity-60" : "hover:border-[#D4AF37]"}`}
                    >
                      <div className="flex gap-3">
                        <img src={product.image} alt="" className="h-14 w-14 rounded object-cover" />
                        <div className="min-w-0">
                          <p className="font-semibold text-[#4a1a22]">{product.variationLabel || product.name}</p>
                          <p className="mt-0.5 text-sm font-bold text-[#6D2B35]">₹{product.price.toLocaleString("en-IN")}</p>
                          <p className="mt-1 text-xs text-stone-500">{outOfStock ? "Out of stock" : unavailable ? "Unavailable" : `${product.stock} available`}</p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </fieldset>
            {selected && (
              <div className="flex flex-wrap items-end justify-between gap-3 border-t border-[#D4AF37]/25 pt-4">
                <div>
                  <Label htmlFor="membership-card-quantity">Quantity</Label>
                  <Input id="membership-card-quantity" className="mt-1 w-24" type="number" min={1} max={Math.max(1, quantityLimit)} value={quantity} disabled={!selected.available || quantityLimit < 1} onChange={event => setQuantity(Math.max(1, Math.min(Math.max(1, quantityLimit), Number(event.target.value) || 1)))} />
                  <p className="mt-1 text-xs text-stone-500">{quantityLimit > 0 ? `${quantityLimit} more can be added (maximum 10 membership cards per order).` : "You already have the maximum of 10 membership cards in your cart."}</p>
                </div>
                <Button onClick={addSelectedToCart} disabled={!selected.available || quantityLimit < 1} className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29]" data-testid="btn-add-membership-card">
                  Add to cart · ₹{(selected.price * Math.min(quantity, quantityLimit || quantity)).toLocaleString("en-IN")}
                </Button>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

type PanditMe = { pandit: { name?: string; phone?: string; city?: string; state?: string; registrationNo?: string | null; membershipNo?: string | null; specialization?: string | string[] | null; image?: string | null; slug?: string | null } };

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

export function PanditCardOrders() {
  const orders = useQuery<{ items: CardOrderRow[] }>({ queryKey: ["pandit-card-orders"], queryFn: () => api("/api/pandit/card-orders") });
  const me = useQuery<PanditMe>({ queryKey: ["pandit-me"], queryFn: () => api("/api/pandit/me") });

  const items = orders.data?.items || [];

  if (orders.isLoading || me.isLoading) return <PanditLoadingState label="Loading Pandit card…" />;
  if (orders.isError || me.isError) return <div className="space-y-5"><PanditSectionHeader title="Pandit card" description="Order physical membership cards through your cart and review previous card orders." /><PanditErrorState detail="Your card details could not be loaded." onRetry={() => { void orders.refetch(); void me.refetch(); }} /></div>;

  return (
    <div className="min-w-0 space-y-5" data-testid="pandit-card">
      <PanditSectionHeader title="Pandit card" description="Order physical membership cards through your cart and track earlier card orders." />
      {me.data?.pandit?.registrationNo && /^\d{10}$/.test(me.data.pandit.registrationNo) ? <PanditMembershipCard credential={{ registrationNo: me.data.pandit.registrationNo, name: me.data.pandit.name, city: me.data.pandit.city, state: me.data.pandit.state, specialization: me.data.pandit.specialization, image: me.data.pandit.image, status: "verified", profilePath: me.data.pandit.slug ? `/pandit/${me.data.pandit.slug}` : null }} /> : null}
      <PanditMembershipCardStore />
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-[#4a1a22] mb-1">Previous Printed/NFC card orders</h3>
          <p className="mb-3 text-sm text-stone-600">This read-only history is retained for tracking earlier card purchases. New cards are ordered above through your regular cart.</p>
          {items.length === 0 ? (
            <PanditEmptyState icon={CreditCard} title="No previous Printed/NFC card orders" detail="New Plastic or Metal membership cards can be ordered through your regular cart above." />
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

    </div>
  );
}

export function PanditReferralsPanel({ embedded = false }: { embedded?: boolean }) {
  const { data, isLoading, isError, refetch } = useQuery<{ items: any[]; summary: { totalCommission: number; pending: number; approved: number; paid: number; count: number } }>({
    queryKey: ["pandit-referrals"],
    queryFn: () => api("/api/pandit/referrals"),
  });
  const payouts = useQuery<{ items: any[] }>({
    queryKey: ["pandit-payouts"],
    queryFn: () => api("/api/pandit/payouts"),
  });
  if (isLoading) return <PanditLoadingState label="Loading referrals…" />;
  if (isError) return <div className="space-y-5">{!embedded && <PanditSectionHeader title="Referrals" description="Track shop referrals and the commission your storefront has earned." />}<PanditErrorState detail="Referral activity could not be loaded." onRetry={() => void refetch()} /></div>;
  const items = data?.items || [];
  const s = data?.summary || { totalCommission: 0, pending: 0, approved: 0, paid: 0, count: 0 };
  const payoutItems = payouts.data?.items || [];
  return (
    <div className="min-w-0 space-y-5">
      {!embedded && <PanditSectionHeader title="Referrals" description="Track shop referrals and the commission your storefront has earned." />}
      <PanditKpiGrid className="sm:grid-cols-3 xl:grid-cols-5">
        <PanditKpi label="Lifetime commission" value={`₹${s.totalCommission.toLocaleString("en-IN")}`} icon={Wallet} />
        <PanditKpi label="Pending review" value={`₹${s.pending.toLocaleString("en-IN")}`} icon={Wallet} tone="gold" />
        <PanditKpi label="Awaiting payout" value={`₹${(s.approved || 0).toLocaleString("en-IN")}`} icon={Wallet} />
        <PanditKpi label="Paid out" value={`₹${s.paid.toLocaleString("en-IN")}`} icon={Wallet} tone="green" />
        <PanditKpi label="Conversions" value={s.count} icon={ExternalLink} />
      </PanditKpiGrid>
      <Card>
        <CardContent className="p-5">
          <h3 className="font-bold text-[#4a1a22] mb-3">Referral activity</h3>
          {items.length === 0 ? (
            <PanditEmptyState icon={ExternalLink} title="No referrals yet" detail="Share your storefront link or QR card to start earning." />
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
            <PanditInlineLoading label="Loading payout history…" />
          ) : payouts.isError ? (
            <PanditErrorState title="Payout history could not be loaded" onRetry={() => void payouts.refetch()} />
          ) : payoutItems.length === 0 ? (
            <PanditEmptyState icon={Wallet} title="No payouts yet" detail="Approved commissions are paid out in batches." />
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
