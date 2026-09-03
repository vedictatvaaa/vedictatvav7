import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ExternalLink, Plus, RefreshCw, Calendar, Edit2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

interface PujaType {
  id: number;
  slug: string;
  name: string;
  deity: string;
  category: string;
  shortDescription: string;
  isPublished: boolean | null;
  difficulty: string | null;
  estimatedCost: string | null;
  reviewStatus: string;
  reviewerName?: string | null;
  completeness?: { complete: boolean; missing: string[] };
  conflicts?: Array<{ type: string; recordName: string; value: string }>;
}

export default function PujaLibraryTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const [editing, setEditing] = useState<PujaType | null>(null);
  const [creating, setCreating] = useState(false);
  const [search, setSearch] = useState("");

  const { data: pujas = [], isLoading } = useQuery<PujaType[]>({
    queryKey: ["/api/admin/pujas"],
    queryFn: () => fetcher("/api/admin/pujas"),
  });

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return pujas;
    return pujas.filter((p) =>
      p.name.toLowerCase().includes(q) ||
      p.slug.toLowerCase().includes(q) ||
      p.deity.toLowerCase().includes(q),
    );
  }, [pujas, search]);

  const { data: masterServices = [], refetch: refetchMasters } = useQuery<any[]>({ queryKey: ["/api/admin/master-services"], queryFn: () => fetcher("/api/admin/master-services") });
  const { data: travelBands = [], refetch: refetchBands } = useQuery<any[]>({ queryKey: ["/api/admin/travel-bands"], queryFn: () => fetcher("/api/admin/travel-bands") });
  const saveOps = async (url: string, method: string, body: any, done: () => void) => {
    try { const r = await fetch(url, { method, body: JSON.stringify(body), credentials: "include", headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) } }); if (!r.ok) throw new Error("Save failed"); toast({ title: "Booking settings saved" }); done(); }
    catch (e: any) { toast({ title: "Could not save booking settings", description: e.message, variant: "destructive" }); }
  };

  const regenMutation = useMutation({
    mutationFn: ({ pujaId, year }: { pujaId: number; year: number }) =>
      fetch("/api/admin/muhurats/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ pujaId, year }),
      }).then((r) => {
        if (!r.ok) throw new Error("Regen failed");
        return r.json();
      }),
    onSuccess: (res: any) => toast({ title: "Muhurats regenerated", description: `${res?.count ?? 0} dates` }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const regenAllMutation = useMutation({
    mutationFn: (year: number) =>
      fetch("/api/admin/muhurats/regenerate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ year, all: true }),
      }).then((r) => {
        if (!r.ok) throw new Error("Bulk regen failed");
        return r.json();
      }),
    onSuccess: (res: any) => toast({ title: "All muhurats regenerated", description: `${res?.totalCount ?? 0} dates across ${res?.pujaCount ?? 0} pujas` }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6" data-testid="tab-puja-library">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#6D2B35]">Puja Library</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rich SEO content pages for each puja — deity, story, ethics, samagri, FAQ, and yearly muhurats.
          </p>
        </div>
        <div className="flex flex-row gap-2 flex-wrap">
          <Button variant="outline" onClick={() => regenAllMutation.mutate(new Date().getFullYear())} disabled={regenAllMutation.isPending}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regen muhurats {new Date().getFullYear()}
          </Button>
          <Button variant="outline" onClick={() => regenAllMutation.mutate(new Date().getFullYear() + 1)} disabled={regenAllMutation.isPending}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Regen muhurats {new Date().getFullYear() + 1}
          </Button>
          <Dialog open={creating} onOpenChange={setCreating}>
            <DialogTrigger asChild>
              <Button data-testid="button-create-puja"><Plus className="w-4 h-4 mr-2" />New puja</Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader><DialogTitle>Create puja</DialogTitle></DialogHeader>
              <PujaEditor
                adminToken={adminToken}
                onSaved={() => {
                  setCreating(false);
                  queryClient.invalidateQueries({ queryKey: ["/api/admin/pujas"] });
                }}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Input
        placeholder="Search by name, slug, deity"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
        data-testid="input-search-puja"
      />
      <BookingOperations masterServices={masterServices} travelBands={travelBands} save={saveOps} refresh={() => { void refetchMasters(); void refetchBands(); }} />

      <Card>
        <CardHeader><CardTitle className="text-lg">{filtered.length} pujas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-row items-center justify-between gap-3 flex-wrap p-3 border border-[#E8DCC4] rounded-md" data-testid={`row-puja-${p.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-row items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                   <Badge className={`text-xs ${p.reviewStatus === "approved" ? "bg-emerald-100 text-emerald-900" : "bg-amber-100 text-amber-900"}`}>{(p.reviewStatus || "draft").replace("_", " ")}</Badge>
                   {!p.isPublished && <Badge variant="outline" className="text-xs">Not public</Badge>}
                   {p.completeness && !p.completeness.complete && <Badge className="text-xs bg-rose-100 text-rose-900">{p.completeness.missing.length} incomplete</Badge>}
                   {!!p.conflicts?.length && <Badge className="text-xs bg-rose-100 text-rose-900">{p.conflicts.length} conflict{p.conflicts.length === 1 ? "" : "s"}</Badge>}
                  {p.difficulty && <Badge variant="outline" className="text-xs">{p.difficulty}</Badge>}
                </div>
                <p className="font-serif font-semibold text-[#6D2B35]">{p.name}</p>
                <p className="text-xs text-muted-foreground">{p.deity} · /{p.slug}</p>
              </div>
              <div className="flex flex-row gap-2 flex-wrap">
                <Button size="sm" variant="outline" asChild>
                  <a href={`/puja-guide/${p.slug}`} target="_blank" rel="noreferrer"><ExternalLink className="w-3 h-3 mr-1" />Open</a>
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => regenMutation.mutate({ pujaId: p.id, year: new Date().getFullYear() + 1 })}
                  disabled={regenMutation.isPending}
                  data-testid={`button-regen-${p.id}`}
                >
                  <Calendar className="w-3 h-3 mr-1" />Regen muhurats
                </Button>
                <Button size="sm" onClick={() => setEditing(p)} data-testid={`button-edit-${p.id}`}>
                  <Edit2 className="w-3 h-3 mr-1" />Edit
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle>Edit puja</DialogTitle></DialogHeader>
          {editing && (
            <PujaEditor
              adminToken={adminToken}
              existingId={editing.id}
              onSaved={() => {
                setEditing(null);
                queryClient.invalidateQueries({ queryKey: ["/api/admin/pujas"] });
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function BookingOperations({ masterServices, travelBands, save, refresh }: { masterServices: any[]; travelBands: any[]; save: (url: string, method: string, body: any, done: () => void) => void; refresh: () => void }) {
  const [band, setBand] = useState<any>({ minDistanceKm: "", maxDistanceKm: "", charge: "", currency: "INR", isActive: true, requiresDistantConfirmation: false });
  const [editingBand, setEditingBand] = useState<number | null>(null);
  return <Card className="border-[#D4AF37]/30 bg-[#FFFBF0]">
    <CardHeader><CardTitle className="text-lg text-[#6D2B35]">Booking operations</CardTitle><p className="text-xs text-[#5a4a3a]/70">Server-authoritative rate, mode, samagri and travel controls.</p></CardHeader>
    <CardContent className="space-y-4">
      <div className="space-y-2"><p className="text-sm font-semibold text-[#6D2B35]">Puja rate and mode governance</p>{masterServices.map((s: any) => <MasterServiceEditor key={s.id} service={s} save={save} refresh={refresh} />)}</div>
      <div className="border-t border-[#D4AF37]/20 pt-4"><p className="text-sm font-semibold text-[#6D2B35]">At-home travel bands</p><div className="mt-2 grid grid-cols-2 gap-2 md:grid-cols-5"><Input placeholder="Min km" value={band.minDistanceKm} onChange={e => setBand({ ...band, minDistanceKm: e.target.value })} /><Input placeholder="Max km" value={band.maxDistanceKm} onChange={e => setBand({ ...band, maxDistanceKm: e.target.value })} /><Input placeholder="Charge" value={band.charge} onChange={e => setBand({ ...band, charge: e.target.value })} /><Input placeholder="Currency" value={band.currency} onChange={e => setBand({ ...band, currency: e.target.value.toUpperCase() })} /><Button onClick={() => save(editingBand ? `/api/admin/travel-bands/${editingBand}` : "/api/admin/travel-bands", editingBand ? "PATCH" : "POST", { ...band, minDistanceKm: Number(band.minDistanceKm), maxDistanceKm: Number(band.maxDistanceKm), charge: Number(band.charge) }, () => { setBand({ minDistanceKm: "", maxDistanceKm: "", charge: "", currency: "INR", isActive: true, requiresDistantConfirmation: false }); setEditingBand(null); refresh(); })}>{editingBand ? "Save band" : "Add band"}</Button></div><label className="mt-2 flex items-center gap-2 text-xs text-[#5a4a3a]"><input type="checkbox" checked={band.requiresDistantConfirmation} onChange={e => setBand({ ...band, requiresDistantConfirmation: e.target.checked })} />Require customer confirmation for this distant band</label><div className="mt-3 space-y-2">{travelBands.map((b: any) => <div key={b.id} className="flex flex-wrap items-center justify-between gap-2 rounded border border-[#E8DCC4] bg-white p-3 text-xs"><span>{b.minDistanceKm}–{b.maxDistanceKm} km · {b.currency || "INR"} {b.charge}</span><Badge variant="outline">{b.isActive === false ? "Inactive" : "Active"}</Badge>{b.requiresDistantConfirmation && <Badge variant="outline">Confirmation required</Badge>}<div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { setEditingBand(b.id); setBand({ minDistanceKm: b.minDistanceKm, maxDistanceKm: b.maxDistanceKm, charge: b.charge, currency: b.currency || "INR", isActive: b.isActive !== false, requiresDistantConfirmation: Boolean(b.requiresDistantConfirmation) }); }}>Edit</Button>{b.isActive !== false && <Button size="sm" variant="outline" onClick={() => save(`/api/admin/travel-bands/${b.id}`, "PATCH", { isActive: false }, refresh)}>Deactivate</Button>}</div></div>)}</div></div>
    </CardContent>
  </Card>;
}

function MasterServiceEditor({ service, save, refresh }: { service: any; save: (url: string, method: string, body: any, done: () => void) => void; refresh: () => void }) {
  const existingTemplate = Array.isArray(service.defaultSamagriTemplate)
    ? service.defaultSamagriTemplate.map((item: any) => [item.name, item.quantity, item.unit].filter(Boolean).join(" | ")).join("\n")
    : "";
  const [form, setForm] = useState({ minRate: service.minRate ?? "", maxRate: service.maxRate ?? "", allowedBookingMode: service.allowedBookingMode || "both", defaultSamagriText: existingTemplate });
  const template = form.defaultSamagriText.split("\n").map((line: string) => line.trim()).filter(Boolean).map((line: string) => {
    const [name, quantity, unit] = line.split("|").map((part: string) => part.trim());
    return { name, quantity: quantity || undefined, unit: unit || undefined, required: true, arrangedBy: "customer" };
  });
  return <div className="grid grid-cols-1 gap-2 rounded border border-[#E8DCC4] bg-white p-3 md:grid-cols-[1.4fr_1fr_1fr_1fr_auto]"><div><p className="text-sm font-semibold text-[#55252d]">{service.name || service.pujaName}</p><p className="text-[11px] text-muted-foreground">#{service.id}</p></div><Input placeholder="Min rate" value={form.minRate} onChange={e => setForm({ ...form, minRate: e.target.value })} /><Input placeholder="Max rate" value={form.maxRate} onChange={e => setForm({ ...form, maxRate: e.target.value })} /><select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={form.allowedBookingMode} onChange={e => setForm({ ...form, allowedBookingMode: e.target.value })}><option value="virtual">Virtual</option><option value="at_home">At-home</option><option value="both">Virtual + At-home</option></select><Button onClick={() => save(`/api/admin/master-services/${service.id}`, "PATCH", { minRate: Number(form.minRate), maxRate: Number(form.maxRate), allowedBookingMode: form.allowedBookingMode, defaultSamagriTemplate: template }, refresh)}>Save</Button><div className="md:col-span-5"><Label>Default samagri template</Label><Textarea rows={2} placeholder="One item per line: name | quantity | unit" value={form.defaultSamagriText} onChange={e => setForm({ ...form, defaultSamagriText: e.target.value })} /></div></div>;
}

function PujaEditor({ adminToken, existingId, onSaved }: { adminToken?: string; existingId?: number; onSaved: () => void }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const { data: existing } = useQuery<any>({
    queryKey: ["/api/admin/pujas", existingId],
    queryFn: () => fetcher(`/api/admin/pujas`).then((rows: any[]) => rows.find((r) => r.id === existingId)),
    enabled: !!existingId,
  });
  const { data: reviewers = [] } = useQuery<any[]>({
    queryKey: ["/api/admin/puja-reviewers"],
    queryFn: () => fetcher("/api/admin/puja-reviewers"),
  });

  const [form, setForm] = useState<any>({
    slug: "",
    name: "",
    deity: "",
    category: "deity",
    shortDescription: "",
    whyPerformed: "",
    storyMyth: "",
    howCelebrated: "",
    ethics: "",
    benefits: "",
    metaTitle: "",
    metaDescription: "",
    isPublished: false,
    reviewStatus: "draft",
    reviewedByPanditId: null,
    reviewNotes: "",
    sourceNotes: "",
    citations: [],
    intents: [],
    deities: [],
    ceremonies: [],
    festivals: [],
    aliases: [],
    regionalVariations: [],
    onlineEligible: false,
    inPersonEligible: true,
    difficulty: "moderate",
    durationMinutes: 60,
    estimatedCost: "",
    requirements: [],
    faq: [],
    muhuratRules: [],
  });

  // Hydrate from existing
  useEffect(() => {
    if (existing) setForm({ ...existing });
  }, [existing]);

  const saveMutation = useMutation({
    mutationFn: () => {
      const url = existingId ? `/api/admin/pujas/${existingId}` : "/api/admin/pujas";
      const method = existingId ? "PATCH" : "POST";
      return fetch(url, {
        method,
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify(form),
      }).then(async (r) => {
        const body = await r.json().catch(() => ({}));
        if (!r.ok) {
          const missing = body?.completeness?.missing?.join(", ");
          const conflict = body?.conflicts?.map((item: any) => `${item.value} conflicts with ${item.recordName}`).join("; ");
          throw new Error([body.message || "Save failed", missing, conflict].filter(Boolean).join(": "));
        }
        return body;
      });
    },
    onSuccess: () => {
      toast({ title: existingId ? "Updated" : "Created" });
      onSaved();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const listValue = (key: string) => Array.isArray(form[key]) ? form[key].join(", ") : "";
  const setList = (key: string, value: string) => set(key, value.split(",").map(item => item.trim()).filter(Boolean));
  const requirementsText = Array.isArray(form.requirements) ? form.requirements.map((item: any) => [item.item, item.qty, item.note].filter(Boolean).join(" | ")).join("\n") : "";
  const faqText = Array.isArray(form.faq) ? form.faq.map((item: any) => `${item.q} | ${item.a}`).join("\n") : "";
  const variationsText = Array.isArray(form.regionalVariations) ? form.regionalVariations.map((item: any) => `${item.name} | ${item.regionOrTradition} | ${item.note}`).join("\n") : "";
  const citationsText = Array.isArray(form.citations) ? form.citations.map((item: any) => [item.label, item.url, item.sourceType].filter(Boolean).join(" | ")).join("\n") : "";

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Slug</Label><Input value={form.slug || ""} onChange={(e) => set("slug", e.target.value)} disabled={!!existingId} /></div>
        <div><Label>Name</Label><Input value={form.name || ""} onChange={(e) => set("name", e.target.value)} /></div>
        <div><Label>Deity</Label><Input value={form.deity || ""} onChange={(e) => set("deity", e.target.value)} /></div>
        <div>
          <Label>Category</Label>
          <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.category || "deity"} onChange={(e) => set("category", e.target.value)}>
            <option value="deity">Deity</option>
            <option value="occasion">Occasion</option>
            <option value="remedial">Remedial</option>
            <option value="samskara">Samskara</option>
          </select>
        </div>
      </div>
      <div><Label>Short description</Label><Textarea rows={2} value={form.shortDescription || ""} onChange={(e) => set("shortDescription", e.target.value)} /></div>
      <div><Label>Why performed (HTML)</Label><Textarea rows={4} value={form.whyPerformed || ""} onChange={(e) => set("whyPerformed", e.target.value)} /></div>
      <div><Label>Story / myth (HTML)</Label><Textarea rows={4} value={form.storyMyth || ""} onChange={(e) => set("storyMyth", e.target.value)} /></div>
      <div><Label>How celebrated (HTML)</Label><Textarea rows={4} value={form.howCelebrated || ""} onChange={(e) => set("howCelebrated", e.target.value)} /></div>
      <div><Label>Ethics — do's & don'ts (HTML)</Label><Textarea rows={3} value={form.ethics || ""} onChange={(e) => set("ethics", e.target.value)} /></div>
      <div><Label>Benefits</Label><Textarea rows={2} value={form.benefits || ""} onChange={(e) => set("benefits", e.target.value)} /></div>
      <div className="rounded-md border border-[#D4AF37]/30 bg-[#FFFBF0] p-4 space-y-3">
        <div><p className="font-serif font-semibold text-[#6D2B35]">Discovery taxonomy</p><p className="text-xs text-muted-foreground">Comma-separated values are normalized and deduplicated by the server.</p></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Intentions</Label><Input value={listValue("intents")} onChange={e => setList("intents", e.target.value)} placeholder="prosperity, protection" /></div>
          <div><Label>Deities</Label><Input value={listValue("deities")} onChange={e => setList("deities", e.target.value)} placeholder="Lakshmi, Ganesha" /></div>
          <div><Label>Ceremonies</Label><Input value={listValue("ceremonies")} onChange={e => setList("ceremonies", e.target.value)} placeholder="house blessing" /></div>
          <div><Label>Festivals</Label><Input value={listValue("festivals")} onChange={e => setList("festivals", e.target.value)} placeholder="Diwali" /></div>
          <div className="sm:col-span-2"><Label>Aliases</Label><Input value={listValue("aliases")} onChange={e => setList("aliases", e.target.value)} placeholder="alternate names and spellings" /></div>
        </div>
        <div><Label>Regional or traditional variations</Label><Textarea rows={3} value={variationsText} onChange={e => set("regionalVariations", e.target.value.split("\n").map(line => { const [name, regionOrTradition, note] = line.split("|").map(part => part.trim()); return { name, regionOrTradition, note }; }).filter(item => item.name && item.regionOrTradition && item.note))} placeholder="Variation name | Region or tradition | Explanation" /></div>
      </div>
      <div><Label>Samagri checklist</Label><Textarea rows={3} value={requirementsText} onChange={e => set("requirements", e.target.value.split("\n").map(line => { const [item, qty, note] = line.split("|").map(part => part.trim()); return { item, qty, note: note || undefined }; }).filter(item => item.item && item.qty))} placeholder="Item | Quantity | Optional note" /></div>
      <div><Label>Frequently asked questions</Label><Textarea rows={3} value={faqText} onChange={e => set("faq", e.target.value.split("\n").map(line => { const [q, ...answer] = line.split("|").map(part => part.trim()); return { q, a: answer.join(" | ") }; }).filter(item => item.q && item.a))} placeholder="Question | Answer" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Meta title</Label><Input value={form.metaTitle || ""} onChange={(e) => set("metaTitle", e.target.value)} /></div>
        <div><Label>Estimated cost</Label><Input value={form.estimatedCost || ""} onChange={(e) => set("estimatedCost", e.target.value)} /></div>
      </div>
      <div><Label>Meta description</Label><Textarea rows={2} value={form.metaDescription || ""} onChange={(e) => set("metaDescription", e.target.value)} /></div>
      <div className="rounded-md border border-[#D4AF37]/30 bg-[#FFFBF0] p-4 space-y-3">
        <div><p className="font-serif font-semibold text-[#6D2B35]">Religious review and sources</p><p className="text-xs text-muted-foreground">Approval requires complete content, a verified Pandit reviewer, sources, and no catalogue conflicts.</p></div>
        {existing?.completeness && !existing.completeness.complete && <div className="rounded border border-amber-200 bg-amber-50 p-2 text-xs text-amber-900">Missing: {existing.completeness.missing.join(", ")}</div>}
        {!!existing?.conflicts?.length && <div className="rounded border border-rose-200 bg-rose-50 p-2 text-xs text-rose-900">{existing.conflicts.map((item: any) => `${item.value} conflicts with ${item.recordName}`).join("; ")}</div>}
        <div className="grid gap-3 sm:grid-cols-2">
          <div><Label>Review status</Label><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.reviewStatus || "draft"} onChange={e => set("reviewStatus", e.target.value)}><option value="draft">Draft</option><option value="in_review">In review</option><option value="changes_requested">Changes requested</option><option value="approved">Approved</option></select></div>
          <div><Label>Reviewing verified Pandit</Label><select className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.reviewedByPanditId || ""} onChange={e => set("reviewedByPanditId", e.target.value ? Number(e.target.value) : null)}><option value="">Select reviewer</option>{reviewers.map((reviewer: any) => <option key={reviewer.id} value={reviewer.id}>{reviewer.name}{reviewer.city ? ` — ${reviewer.city}` : ""}</option>)}</select></div>
        </div>
        <div><Label>Source notes</Label><Textarea rows={3} value={form.sourceNotes || ""} onChange={e => set("sourceNotes", e.target.value)} placeholder="Explain the textual, traditional, and practitioner basis used for this guide." /></div>
        <div><Label>Citations</Label><Textarea rows={3} value={citationsText} onChange={e => set("citations", e.target.value.split("\n").map(line => { const [label, url, sourceType] = line.split("|").map(part => part.trim()); return { label, url: url || undefined, sourceType: sourceType || "other" }; }).filter(item => item.label))} placeholder="Source label | Optional https:// URL | scripture/commentary/tradition/reviewer/other" /></div>
        <div><Label>Internal review notes</Label><Textarea rows={2} value={form.reviewNotes || ""} onChange={e => set("reviewNotes", e.target.value)} /></div>
        <div className="flex flex-wrap gap-4 text-sm"><label className="flex items-center gap-2"><input type="checkbox" checked={!!form.onlineEligible} onChange={e => set("onlineEligible", e.target.checked)} />Virtual eligible</label><label className="flex items-center gap-2"><input type="checkbox" checked={!!form.inPersonEligible} onChange={e => set("inPersonEligible", e.target.checked)} />At-home eligible</label></div>
      </div>
      <div className="rounded-md border border-[#D4AF37]/30 bg-[#FFFBF0] p-4">
        <p className="font-serif font-semibold text-[#6D2B35]">Booking operations</p>
        <p className="mt-1 text-xs text-[#5a4a3a]/70">Rate bands, allowed service modes, travel bands and the versioned default samagri template require the booking-operations admin API. They are intentionally not persisted through this editorial Puja endpoint.</p>
        <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div><Label>Approved rate range</Label><Input disabled value="Available when booking governance is enabled" /></div>
          <div><Label>Allowed mode</Label><Input disabled value="Available when booking governance is enabled" /></div>
          <div><Label>Travel distance bands</Label><Input disabled value="Managed by booking operations" /></div>
          <div><Label>Default samagri template</Label><Input disabled value="Managed by booking operations" /></div>
        </div>
      </div>
      <div className="flex flex-row items-center gap-2">
        <input type="checkbox" id="published" checked={!!form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
        <Label htmlFor="published">Publish after approval</Label>
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-puja">
        {saveMutation.isPending ? "Saving…" : existingId ? "Save changes" : "Create puja"}
      </Button>
    </div>
  );
}
