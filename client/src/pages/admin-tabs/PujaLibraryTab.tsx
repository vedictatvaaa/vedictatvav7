import { useState, useMemo } from "react";
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

      <Card>
        <CardHeader><CardTitle className="text-lg">{filtered.length} pujas</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {filtered.map((p) => (
            <div key={p.id} className="flex flex-row items-center justify-between gap-3 flex-wrap p-3 border border-[#E8DCC4] rounded-md" data-testid={`row-puja-${p.id}`}>
              <div className="flex-1 min-w-0">
                <div className="flex flex-row items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                  {!p.isPublished && <Badge className="text-xs bg-amber-100 text-amber-900">Draft</Badge>}
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

function PujaEditor({ adminToken, existingId, onSaved }: { adminToken?: string; existingId?: number; onSaved: () => void }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const { data: existing } = useQuery<any>({
    queryKey: ["/api/admin/pujas", existingId],
    queryFn: () => fetcher(`/api/admin/pujas`).then((rows: any[]) => rows.find((r) => r.id === existingId)),
    enabled: !!existingId,
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
    isPublished: true,
    difficulty: "moderate",
    durationMinutes: 60,
    estimatedCost: "",
    requirements: [],
    faq: [],
    muhuratRules: [],
  });

  // Hydrate from existing
  useMemo(() => {
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
      }).then((r) => {
        if (!r.ok) throw new Error("Save failed");
        return r.json();
      });
    },
    onSuccess: () => {
      toast({ title: existingId ? "Updated" : "Created" });
      onSaved();
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const set = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));

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
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Meta title</Label><Input value={form.metaTitle || ""} onChange={(e) => set("metaTitle", e.target.value)} /></div>
        <div><Label>Estimated cost</Label><Input value={form.estimatedCost || ""} onChange={(e) => set("estimatedCost", e.target.value)} /></div>
      </div>
      <div><Label>Meta description</Label><Textarea rows={2} value={form.metaDescription || ""} onChange={(e) => set("metaDescription", e.target.value)} /></div>
      <div className="flex flex-row items-center gap-2">
        <input type="checkbox" id="published" checked={!!form.isPublished} onChange={(e) => set("isPublished", e.target.checked)} />
        <Label htmlFor="published">Published</Label>
      </div>
      <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} data-testid="button-save-puja">
        {saveMutation.isPending ? "Saving…" : existingId ? "Save changes" : "Create puja"}
      </Button>
    </div>
  );
}
