import { useMemo, useRef, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Music, Plus, Pencil, Trash2, Upload, Link as LinkIcon, Volume2 } from "lucide-react";

type AdminMantra = {
  id: number;
  slug: string;
  label: string;
  sanskrit: string | null;
  transliteration: string | null;
  meaning: string | null;
  deity: string | null;
  category: string | null;
  audioUrl: string | null;
  audioMimeType: string | null;
  accentColor: string | null;
  isActive: boolean;
  sortOrder: number;
};

type Draft = {
  id?: number;
  slug: string;
  label: string;
  sanskrit: string;
  transliteration: string;
  meaning: string;
  deity: string;
  category: string;
  audioUrl: string;
  audioMimeType: string;
  accentColor: string;
  isActive: boolean;
  sortOrder: number;
};

const EMPTY: Draft = {
  slug: "",
  label: "",
  sanskrit: "",
  transliteration: "",
  meaning: "",
  deity: "",
  category: "",
  audioUrl: "",
  audioMimeType: "",
  accentColor: "",
  isActive: true,
  sortOrder: 0,
};

function toDraft(m: AdminMantra): Draft {
  return {
    id: m.id,
    slug: m.slug,
    label: m.label,
    sanskrit: m.sanskrit || "",
    transliteration: m.transliteration || "",
    meaning: m.meaning || "",
    deity: m.deity || "",
    category: m.category || "",
    audioUrl: m.audioUrl || "",
    audioMimeType: m.audioMimeType || "",
    accentColor: m.accentColor || "",
    isActive: m.isActive,
    sortOrder: m.sortOrder ?? 0,
  };
}

export default function MantrasTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const headers = useMemo(
    () => (adminToken ? { "x-admin-token": adminToken } : {}) as Record<string, string>,
    [adminToken],
  );

  const { data: mantras = [], isLoading } = useQuery<AdminMantra[]>({
    queryKey: ["/api/admin/mantras"],
    queryFn: async () => {
      const r = await fetch("/api/admin/mantras", { headers });
      if (!r.ok) throw new Error("Failed to load mantras");
      return r.json();
    },
  });

  const [editorOpen, setEditorOpen] = useState(false);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [audioMode, setAudioMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  function openCreate() {
    setDraft({ ...EMPTY });
    setAudioMode("url");
    setEditorOpen(true);
  }
  function openEdit(m: AdminMantra) {
    setDraft(toDraft(m));
    setAudioMode("url");
    setEditorOpen(true);
  }

  const saveMutation = useMutation({
    mutationFn: async (d: Draft) => {
      const url = d.id ? `/api/admin/mantras/${d.id}` : "/api/admin/mantras";
      const method = d.id ? "PATCH" : "POST";
      const r = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(d),
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || "Failed to save mantra");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/mantras"] });
      qc.invalidateQueries({ queryKey: ["/api/mantras"] });
      toast({ title: "Saved", description: "Mantra updated successfully." });
      setEditorOpen(false);
    },
    onError: (err: any) => {
      toast({ title: "Save failed", description: err?.message || String(err), variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/admin/mantras/${id}`, { method: "DELETE", headers });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || "Delete failed");
      }
      return r.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/mantras"] });
      qc.invalidateQueries({ queryKey: ["/api/mantras"] });
      toast({ title: "Deleted", description: "Mantra removed." });
    },
    onError: (err: any) => {
      toast({ title: "Delete failed", description: err?.message || String(err), variant: "destructive" });
    },
  });

  async function handleAudioFile(file: File) {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("audio", file);
      const r = await fetch("/api/admin/mantras/upload-audio", {
        method: "POST",
        headers,
        body: fd,
      });
      if (!r.ok) {
        const err = await r.json().catch(() => ({}));
        throw new Error(err.message || "Upload failed");
      }
      const j = await r.json();
      setDraft((d) => ({ ...d, audioUrl: j.url, audioMimeType: j.mimeType || "" }));
      toast({ title: "Uploaded", description: "Audio file is ready." });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err?.message || String(err), variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4 space-y-0 pb-3">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Music className="h-5 w-5 text-[#6D2B35]" />
              Mantras &amp; Chants
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Add new mantras with optional chant audio. Active mantras appear globally
              in the Japa Counter for every visitor.
            </p>
          </div>
          <Button onClick={openCreate} className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#6D2B35]" data-testid="button-add-mantra">
            <Plus className="h-4 w-4 mr-1.5" /> Add mantra
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-sm text-muted-foreground py-6 text-center">Loading…</p>
          ) : mantras.length === 0 ? (
            <div className="text-center py-10 border border-dashed rounded-md">
              <Music className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground">No admin-managed mantras yet.</p>
              <p className="text-xs text-muted-foreground/80 mt-1">
                The 12 built-in mantras still show in the counter — add new ones to extend the list.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left border-b text-xs uppercase tracking-wide text-muted-foreground">
                    <th className="py-2 pr-2">Label</th>
                    <th className="py-2 pr-2">Slug</th>
                    <th className="py-2 pr-2">Deity</th>
                    <th className="py-2 pr-2">Audio</th>
                    <th className="py-2 pr-2">Status</th>
                    <th className="py-2 pr-2 w-[140px]">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {mantras.map((m) => (
                    <tr key={m.id} className="border-b last:border-b-0" data-testid={`row-mantra-${m.id}`}>
                      <td className="py-2 pr-2">
                        <div className="font-medium">{m.label}</div>
                        {m.sanskrit && <div className="text-xs text-muted-foreground">{m.sanskrit}</div>}
                      </td>
                      <td className="py-2 pr-2 font-mono text-xs">{m.slug}</td>
                      <td className="py-2 pr-2 text-xs">{m.deity || "—"}</td>
                      <td className="py-2 pr-2">
                        {m.audioUrl ? (
                          <a
                            href={m.audioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs text-[#6D2B35] hover:underline"
                          >
                            <Volume2 className="h-3 w-3" /> Listen
                          </a>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        {m.isActive ? (
                          <Badge variant="default" className="bg-emerald-100 text-emerald-700 border-emerald-200">Active</Badge>
                        ) : (
                          <Badge variant="outline">Hidden</Badge>
                        )}
                      </td>
                      <td className="py-2 pr-2">
                        <div className="flex items-center gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(m)} data-testid={`button-edit-mantra-${m.id}`}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Delete mantra "${m.label}"? This cannot be undone.`)) {
                                deleteMutation.mutate(m.id);
                              }
                            }}
                            data-testid={`button-delete-mantra-${m.id}`}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{draft.id ? "Edit mantra" : "Add new mantra"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mantra-label">Label *</Label>
                <Input
                  id="mantra-label"
                  value={draft.label}
                  onChange={(e) => setDraft({ ...draft, label: e.target.value })}
                  placeholder="e.g. Gayatri Mantra"
                  data-testid="input-mantra-label"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mantra-slug">Slug</Label>
                <Input
                  id="mantra-slug"
                  value={draft.slug}
                  onChange={(e) => setDraft({ ...draft, slug: e.target.value })}
                  placeholder="auto-generated from label"
                  data-testid="input-mantra-slug"
                />
                <p className="text-[11px] text-muted-foreground">Used as the storage id. Lowercase, hyphens only.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mantra-sanskrit">Sanskrit (Devanagari)</Label>
              <Textarea
                id="mantra-sanskrit"
                value={draft.sanskrit}
                onChange={(e) => setDraft({ ...draft, sanskrit: e.target.value })}
                placeholder="ॐ भूर्भुवः स्वः …"
                rows={2}
                data-testid="input-mantra-sanskrit"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mantra-translit">Transliteration</Label>
              <Input
                id="mantra-translit"
                value={draft.transliteration}
                onChange={(e) => setDraft({ ...draft, transliteration: e.target.value })}
                placeholder="Om Bhur Bhuvaḥ Svaḥ …"
                data-testid="input-mantra-translit"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="mantra-deity">Deity</Label>
                <Input
                  id="mantra-deity"
                  value={draft.deity}
                  onChange={(e) => setDraft({ ...draft, deity: e.target.value })}
                  placeholder="e.g. Surya"
                  data-testid="input-mantra-deity"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mantra-category">Category</Label>
                <Input
                  id="mantra-category"
                  value={draft.category}
                  onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                  placeholder="e.g. Healing, Prosperity"
                  data-testid="input-mantra-category"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="mantra-meaning">Meaning</Label>
              <Textarea
                id="mantra-meaning"
                value={draft.meaning}
                onChange={(e) => setDraft({ ...draft, meaning: e.target.value })}
                placeholder="Brief 1-2 sentence English meaning shown to devotees."
                rows={3}
                data-testid="input-mantra-meaning"
              />
            </div>

            <div className="rounded-md border border-[#D4AF37]/40 bg-[#FBF7EE] p-3 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-semibold flex items-center gap-1.5">
                  <Volume2 className="h-4 w-4" /> Chant audio (optional)
                </Label>
                <div className="inline-flex rounded-md border border-[#D4AF37]/40 overflow-hidden text-xs">
                  <button
                    type="button"
                    onClick={() => setAudioMode("url")}
                    className={`px-3 py-1 ${audioMode === "url" ? "bg-[#6D2B35] text-[#D4AF37]" : "bg-white text-[#6D2B35]"}`}
                    data-testid="button-audio-mode-url"
                  >
                    <LinkIcon className="h-3 w-3 inline mr-1" /> URL
                  </button>
                  <button
                    type="button"
                    onClick={() => setAudioMode("upload")}
                    className={`px-3 py-1 ${audioMode === "upload" ? "bg-[#6D2B35] text-[#D4AF37]" : "bg-white text-[#6D2B35]"}`}
                    data-testid="button-audio-mode-upload"
                  >
                    <Upload className="h-3 w-3 inline mr-1" /> Upload
                  </button>
                </div>
              </div>

              {audioMode === "url" ? (
                <div className="space-y-1.5">
                  <Input
                    value={draft.audioUrl}
                    onChange={(e) => setDraft({ ...draft, audioUrl: e.target.value })}
                    placeholder="https://example.com/chant.mp3"
                    data-testid="input-mantra-audio-url"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Paste a direct link to an mp3 / m4a / ogg / wav file.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  <input
                    ref={fileRef}
                    type="file"
                    accept="audio/mpeg,audio/mp3,audio/mp4,audio/x-m4a,audio/m4a,audio/ogg,audio/wav,audio/aac"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleAudioFile(f);
                    }}
                    className="block w-full text-xs file:mr-3 file:rounded-md file:border-0 file:bg-[#6D2B35] file:text-[#D4AF37] file:px-3 file:py-1.5 file:text-xs file:font-semibold"
                    disabled={uploading}
                    data-testid="input-mantra-audio-file"
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Max 25 MB. Allowed: MP3, M4A, OGG, WAV, AAC.
                  </p>
                  {uploading && <p className="text-xs text-[#6D2B35]">Uploading…</p>}
                </div>
              )}

              {draft.audioUrl && (
                <div className="space-y-1">
                  <p className="text-[11px] text-muted-foreground">Current:</p>
                  <audio src={draft.audioUrl} controls className="w-full h-9" />
                  <button
                    type="button"
                    onClick={() => setDraft({ ...draft, audioUrl: "", audioMimeType: "" })}
                    className="text-[11px] text-destructive hover:underline"
                    data-testid="button-clear-audio"
                  >
                    Remove audio
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
              <div className="space-y-1.5">
                <Label htmlFor="mantra-accent">Accent color (hex)</Label>
                <Input
                  id="mantra-accent"
                  value={draft.accentColor}
                  onChange={(e) => setDraft({ ...draft, accentColor: e.target.value })}
                  placeholder="#D4AF37"
                  data-testid="input-mantra-accent"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="mantra-sort">Sort order</Label>
                <Input
                  id="mantra-sort"
                  type="number"
                  value={draft.sortOrder}
                  onChange={(e) => setDraft({ ...draft, sortOrder: Number(e.target.value) || 0 })}
                  data-testid="input-mantra-sort"
                />
              </div>
              <div className="flex items-center justify-between rounded-md border px-3 h-9">
                <Label htmlFor="mantra-active" className="text-sm">Active</Label>
                <Switch
                  id="mantra-active"
                  checked={draft.isActive}
                  onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                  data-testid="switch-mantra-active"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditorOpen(false)} data-testid="button-cancel-mantra">Cancel</Button>
            <Button
              onClick={() => {
                if (!draft.label.trim()) {
                  toast({ title: "Missing label", description: "Mantra label is required.", variant: "destructive" });
                  return;
                }
                saveMutation.mutate(draft);
              }}
              disabled={saveMutation.isPending}
              className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#6D2B35]"
              data-testid="button-save-mantra"
            >
              {saveMutation.isPending ? "Saving…" : "Save mantra"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
