import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, CheckCircle2, XCircle, Trash2, Upload, Music, BookOpen, Eye, EyeOff, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

interface SacredText {
  id: number;
  slug: string;
  title: string;
  deity: string;
  textType: string;
  language: string;
  lyrics: string;
  transliteration?: string | null;
  translation?: string | null;
  meaning?: string | null;
  excerpt?: string | null;
  audioUrl?: string | null;
  coverImage?: string | null;
  verseCount?: number | null;
  status: string;
  isPublished?: boolean | null;
  aiGenerated?: boolean | null;
  createdAt: string;
}

const TYPE_OPTIONS = ["chalisa", "mantra", "katha", "aarti", "stotra", "book"];
const STATUS_OPTIONS = ["all", "pending", "published", "rejected"];

const statusBadge: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 border-amber-300",
  published: "bg-emerald-100 text-emerald-800 border-emerald-300",
  rejected: "bg-rose-100 text-rose-800 border-rose-300",
};

export default function SacredLibraryTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const adminWrite = async (url: string, init?: { method?: string; body?: any }) => {
    const headers: Record<string, string> = { "x-admin-token": adminToken || "" };
    if (init?.body !== undefined) headers["Content-Type"] = "application/json";
    const res = await fetch(url, {
      method: init?.method || "POST",
      headers,
      body: init?.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      throw new Error(j?.message || `HTTP ${res.status}`);
    }
    return res.json();
  };
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [previewFor, setPreviewFor] = useState<number | null>(null);
  const [editFor, setEditFor] = useState<number | null>(null);
  const [editDraft, setEditDraft] = useState<Partial<SacredText>>({});
  const [genDeity, setGenDeity] = useState("");
  const [genTypes, setGenTypes] = useState<string>("chalisa,mantra,aarti");
  const [showCreate, setShowCreate] = useState(false);
  const [createDraft, setCreateDraft] = useState<Partial<SacredText>>({
    deity: "", textType: "chalisa", language: "hindi", title: "", lyrics: "",
  });

  const listQuery = useQuery<SacredText[]>({
    queryKey: ["/api/admin/sacred-texts", statusFilter],
    queryFn: () => fetcher(`/api/admin/sacred-texts${statusFilter !== "all" ? `?status=${statusFilter}` : ""}`),
  });

  const generateMutation = useMutation({
    mutationFn: async (vars: { deity: string; types: string[] }) =>
      (await adminWrite("/api/admin/sacred-texts/generate", { body: vars })) as { inserted: number; skipped: number; errors: string[] },
    onSuccess: (res) => {
      toast({ title: "Generation complete", description: `Inserted ${res.inserted}, skipped ${res.skipped}, errors ${res.errors.length}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
      setGenDeity("");
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e?.message || "Unknown", variant: "destructive" }),
  });

  const generateAllMutation = useMutation({
    mutationFn: async () =>
      (await adminWrite("/api/admin/sacred-texts/generate-all")) as { inserted: number; skipped: number; errors: string[] },
    onSuccess: (res) => {
      toast({ title: "Catalog generation complete", description: `Inserted ${res.inserted}, skipped ${res.skipped}` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => adminWrite(`/api/admin/sacred-texts/${id}/approve`),
    onSuccess: () => {
      toast({ title: "Published" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async (id: number) => adminWrite(`/api/admin/sacred-texts/${id}/reject`),
    onSuccess: () => {
      toast({ title: "Rejected" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => adminWrite(`/api/admin/sacred-texts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      toast({ title: "Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<SacredText> }) =>
      adminWrite(`/api/admin/sacred-texts/${id}`, { method: "PATCH", body: data }),
    onSuccess: () => {
      toast({ title: "Saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
      setEditFor(null);
    },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  const createMutation = useMutation({
    mutationFn: async (data: Partial<SacredText>) =>
      adminWrite("/api/admin/sacred-texts", { body: data }),
    onSuccess: () => {
      toast({ title: "Created", description: "Saved as pending — approve to publish" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
      setShowCreate(false);
      setCreateDraft({ deity: "", textType: "chalisa", language: "hindi", title: "", lyrics: "" });
    },
    onError: (e: any) => toast({ title: "Create failed", description: e?.message, variant: "destructive" }),
  });

  async function handleAudioUpload(id: number, file: File) {
    const fd = new FormData();
    fd.append("audio", file);
    const headers: Record<string, string> = {};
    if (adminToken) headers["x-admin-token"] = adminToken;
    const res = await fetch(`/api/admin/sacred-texts/${id}/audio`, { method: "POST", body: fd, headers });
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast({ title: "Audio upload failed", description: j?.message || `HTTP ${res.status}`, variant: "destructive" });
      return;
    }
    toast({ title: "Audio uploaded" });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/sacred-texts"] });
  }

  function startEdit(t: SacredText) {
    setEditFor(t.id);
    setEditDraft({
      title: t.title, deity: t.deity, textType: t.textType, language: t.language,
      lyrics: t.lyrics, transliteration: t.transliteration || "",
      translation: t.translation || "", meaning: t.meaning || "",
      excerpt: t.excerpt || "",
    });
  }

  const items = listQuery.data || [];

  return (
    <div className="space-y-6">
      <Card style={{ borderColor: "#E8DCC4" }}>
        <CardHeader className="pb-3">
          <CardTitle className="font-serif text-xl" style={{ color: "#6D2B35" }}>
            Sacred Library
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Kindle-style reader for chalisas, mantras, kathas, stotras, and aartis. AI-generate per deity, edit lyrics, upload audio, and publish.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-row flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[180px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Deity (e.g. Hanuman, Shiva)</label>
              <Input
                value={genDeity}
                onChange={(e) => setGenDeity(e.target.value)}
                placeholder="Hanuman"
                data-testid="input-generate-deity"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-xs font-medium text-muted-foreground block mb-1">Types (comma-separated)</label>
              <Input
                value={genTypes}
                onChange={(e) => setGenTypes(e.target.value)}
                placeholder="chalisa,mantra,aarti"
                data-testid="input-generate-types"
              />
            </div>
            <Button
              onClick={() => {
                const types = genTypes.split(",").map((t) => t.trim()).filter(Boolean);
                if (!genDeity || !types.length) {
                  toast({ title: "Provide deity and at least one type", variant: "destructive" });
                  return;
                }
                generateMutation.mutate({ deity: genDeity, types });
              }}
              disabled={generateMutation.isPending}
              style={{ backgroundColor: "#6D2B35", color: "#FBF7EE" }}
              data-testid="button-generate-deity"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateMutation.isPending ? "Generating..." : "Generate for deity"}
            </Button>
            <Button
              variant="outline"
              onClick={() => generateAllMutation.mutate()}
              disabled={generateAllMutation.isPending}
              style={{ borderColor: "#D4AF37", color: "#6D2B35" }}
              data-testid="button-generate-catalog"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              {generateAllMutation.isPending ? "Generating catalog..." : "Generate full catalog"}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowCreate((s) => !s)}
              data-testid="button-toggle-create"
            >
              <Plus className="w-4 h-4 mr-2" />New manually
            </Button>
          </div>

          {showCreate && (
            <div className="border rounded-md p-3 space-y-2" style={{ borderColor: "#E8DCC4", backgroundColor: "#FBF7EE" }}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                <Input placeholder="Title" value={createDraft.title || ""} onChange={(e) => setCreateDraft({ ...createDraft, title: e.target.value })} data-testid="input-create-title" />
                <Input placeholder="Deity" value={createDraft.deity || ""} onChange={(e) => setCreateDraft({ ...createDraft, deity: e.target.value })} data-testid="input-create-deity" />
                <Select value={createDraft.textType || "chalisa"} onValueChange={(v) => setCreateDraft({ ...createDraft, textType: v })}>
                  <SelectTrigger data-testid="select-create-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <Textarea
                placeholder="Lyrics (Devanagari, line-separated verses)"
                rows={6}
                value={createDraft.lyrics || ""}
                onChange={(e) => setCreateDraft({ ...createDraft, lyrics: e.target.value })}
                data-testid="textarea-create-lyrics"
              />
              <Textarea
                placeholder="Translation (English)"
                rows={3}
                value={createDraft.translation || ""}
                onChange={(e) => setCreateDraft({ ...createDraft, translation: e.target.value })}
              />
              <div className="flex flex-row gap-2">
                <Button
                  onClick={() => {
                    if (!createDraft.title || !createDraft.deity || !createDraft.lyrics) {
                      toast({ title: "Title, deity, and lyrics are required", variant: "destructive" });
                      return;
                    }
                    createMutation.mutate({
                      ...createDraft,
                      slug: `${(createDraft.deity || "").toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${(createDraft.textType || "")}-${Date.now().toString(36)}`,
                      status: "pending",
                      isPublished: false,
                      aiGenerated: false,
                    });
                  }}
                  disabled={createMutation.isPending}
                  style={{ backgroundColor: "#6D2B35", color: "#FBF7EE" }}
                  data-testid="button-create-text"
                >
                  Create
                </Button>
                <Button variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="flex flex-row gap-2 flex-wrap">
            {STATUS_OPTIONS.map((s) => (
              <Button
                key={s}
                size="sm"
                variant={statusFilter === s ? "default" : "outline"}
                onClick={() => setStatusFilter(s)}
                style={statusFilter === s ? { backgroundColor: "#6D2B35", color: "#FBF7EE" } : { borderColor: "#E8DCC4" }}
                data-testid={`button-filter-${s}`}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        {listQuery.isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
        {!listQuery.isLoading && items.length === 0 && (
          <Card style={{ borderColor: "#E8DCC4" }}>
            <CardContent className="p-8 text-center text-muted-foreground text-sm">
              No texts yet. Use "Generate for deity" or "Generate full catalog" above to seed the library.
            </CardContent>
          </Card>
        )}
        {items.map((t) => (
          <Card key={t.id} style={{ borderColor: "#E8DCC4" }}>
            <CardContent className="p-4 space-y-3">
              <div className="flex flex-row items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-row items-center gap-2 flex-wrap">
                    <Badge className={`${statusBadge[t.status] || ""} border`}>{t.status}</Badge>
                    <Badge variant="outline" style={{ borderColor: "#D4AF37", color: "#6D2B35" }}>{t.deity}</Badge>
                    <Badge variant="outline">{t.textType}</Badge>
                    {t.aiGenerated ? <Badge variant="outline" className="gap-1"><Sparkles className="w-3 h-3" />AI</Badge> : null}
                    {t.audioUrl ? <Badge variant="outline" className="gap-1"><Music className="w-3 h-3" />Audio</Badge> : null}
                    <span className="text-xs text-muted-foreground">{t.verseCount || 0} verses</span>
                  </div>
                  <h3 className="font-serif font-bold mt-1" style={{ color: "#6D2B35" }}>{t.title}</h3>
                  {t.excerpt && <p className="text-sm text-muted-foreground line-clamp-2">{t.excerpt}</p>}
                </div>
                <div className="flex flex-row gap-2 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => setPreviewFor(previewFor === t.id ? null : t.id)} data-testid={`button-preview-${t.id}`}>
                    {previewFor === t.id ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {previewFor === t.id ? "Hide" : "Preview"}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => startEdit(t)} data-testid={`button-edit-${t.id}`}>
                    <BookOpen className="w-3 h-3 mr-1" />Edit
                  </Button>
                  <label className="inline-flex">
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const f = e.target.files?.[0];
                        if (f) handleAudioUpload(t.id, f);
                        e.target.value = "";
                      }}
                      data-testid={`input-audio-${t.id}`}
                    />
                    <span className="inline-flex items-center justify-center min-h-9 px-3 text-sm border rounded-md cursor-pointer hover-elevate" style={{ borderColor: "#E8DCC4" }}>
                      <Upload className="w-3 h-3 mr-1" />Audio
                    </span>
                  </label>
                  {t.status !== "published" && (
                    <Button size="sm" onClick={() => approveMutation.mutate(t.id)} style={{ backgroundColor: "#6D2B35", color: "#FBF7EE" }} data-testid={`button-approve-${t.id}`}>
                      <CheckCircle2 className="w-3 h-3 mr-1" />Publish
                    </Button>
                  )}
                  {t.status !== "rejected" && (
                    <Button size="sm" variant="outline" onClick={() => rejectMutation.mutate(t.id)} data-testid={`button-reject-${t.id}`}>
                      <XCircle className="w-3 h-3 mr-1" />Reject
                    </Button>
                  )}
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { if (confirm(`Delete "${t.title}"?`)) deleteMutation.mutate(t.id); }}
                    data-testid={`button-delete-${t.id}`}
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>

              {previewFor === t.id && (
                <div className="border-t pt-3 space-y-3" style={{ borderColor: "#E8DCC4" }}>
                  {t.audioUrl && (
                    <audio controls src={t.audioUrl} className="w-full" data-testid={`audio-preview-${t.id}`} />
                  )}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Lyrics</h4>
                      <pre className="font-serif text-base whitespace-pre-wrap leading-relaxed" style={{ color: "#6D2B35" }}>{t.lyrics}</pre>
                    </div>
                    {t.transliteration && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Transliteration</h4>
                        <pre className="text-sm whitespace-pre-wrap leading-relaxed italic">{t.transliteration}</pre>
                      </div>
                    )}
                    {t.translation && (
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-1">Translation</h4>
                        <pre className="text-sm whitespace-pre-wrap leading-relaxed">{t.translation}</pre>
                      </div>
                    )}
                  </div>
                  {t.meaning && <p className="text-sm text-muted-foreground italic border-t pt-3" style={{ borderColor: "#E8DCC4" }}>{t.meaning}</p>}
                </div>
              )}

              {editFor === t.id && (
                <div className="border-t pt-3 space-y-2" style={{ borderColor: "#E8DCC4" }}>
                  <Input value={editDraft.title || ""} onChange={(e) => setEditDraft({ ...editDraft, title: e.target.value })} placeholder="Title" />
                  <div className="grid grid-cols-3 gap-2">
                    <Input value={editDraft.deity || ""} onChange={(e) => setEditDraft({ ...editDraft, deity: e.target.value })} placeholder="Deity" />
                    <Select value={editDraft.textType || "chalisa"} onValueChange={(v) => setEditDraft({ ...editDraft, textType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{TYPE_OPTIONS.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                    </Select>
                    <Input value={editDraft.language || "hindi"} onChange={(e) => setEditDraft({ ...editDraft, language: e.target.value })} placeholder="Language" />
                  </div>
                  <Textarea rows={6} value={editDraft.lyrics || ""} onChange={(e) => setEditDraft({ ...editDraft, lyrics: e.target.value })} placeholder="Lyrics (Devanagari)" />
                  <Textarea rows={4} value={editDraft.transliteration || ""} onChange={(e) => setEditDraft({ ...editDraft, transliteration: e.target.value })} placeholder="Transliteration (Roman)" />
                  <Textarea rows={4} value={editDraft.translation || ""} onChange={(e) => setEditDraft({ ...editDraft, translation: e.target.value })} placeholder="Translation (English)" />
                  <Textarea rows={2} value={editDraft.meaning || ""} onChange={(e) => setEditDraft({ ...editDraft, meaning: e.target.value })} placeholder="Overall meaning / phala-shruti" />
                  <div className="flex gap-2">
                    <Button onClick={() => updateMutation.mutate({ id: t.id, data: editDraft })} disabled={updateMutation.isPending} style={{ backgroundColor: "#6D2B35", color: "#FBF7EE" }} data-testid={`button-save-${t.id}`}>Save</Button>
                    <Button variant="outline" onClick={() => setEditFor(null)}>Cancel</Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
