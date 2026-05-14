import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, ArrowRight, Trash2, Pencil } from "lucide-react";

interface Redirect {
  id: number; fromPath: string; toPath: string; statusCode: number;
  hits: number; isActive: boolean; note: string | null;
  createdAt: string; updatedAt: string;
}

export function RedirectsTab({ adminFetch }: { adminFetch: (url: string, init?: RequestInit) => Promise<any> }) {
  const { toast } = useToast();
  const [editing, setEditing] = useState<Redirect | null>(null);
  const [adding, setAdding] = useState(false);

  const { data, isLoading, refetch } = useQuery<Redirect[]>({
    queryKey: ["/api/admin/seo/redirects"],
    queryFn: () => adminFetch("/api/admin/seo/redirects"),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/seo/redirects/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Redirect deleted" }); refetch(); },
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">URL Redirects (301 / 302)</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Preserve link equity when slugs/URLs change. Caught before SPA routing.</p>
            </div>
            <Button onClick={() => setAdding(true)} data-testid="button-add-redirect">
              <Plus className="h-4 w-4 mr-2" /> Add redirect
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : data && data.length > 0 ? (
            <ScrollArea className="h-[520px] pr-2">
              <div className="space-y-1.5">
                {data.map((r) => (
                  <div key={r.id} className="rounded-md border bg-card p-3 flex items-center gap-3" data-testid={`row-redirect-${r.id}`}>
                    <Badge variant={r.statusCode === 301 ? "default" : "secondary"} className="shrink-0">{r.statusCode}</Badge>
                    <div className="flex-1 min-w-0 text-sm font-mono">
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-muted-foreground truncate">{r.fromPath}</span>
                        <ArrowRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                        <span className="text-foreground truncate">{r.toPath}</span>
                      </div>
                      {r.note && <div className="text-[11px] text-muted-foreground truncate">{r.note}</div>}
                    </div>
                    <Badge variant="outline" className="shrink-0">{r.hits} hits</Badge>
                    {!r.isActive && <Badge variant="destructive" className="shrink-0">disabled</Badge>}
                    <Button size="icon" variant="ghost" onClick={() => setEditing(r)} data-testid={`button-edit-redirect-${r.id}`}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(r.id)} data-testid={`button-del-redirect-${r.id}`}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="py-12 text-center text-sm text-muted-foreground">No redirects yet. Add one to preserve SEO equity from old URLs.</div>
          )}
        </CardContent>
      </Card>

      {(adding || editing) && (
        <RedirectDialog
          adminFetch={adminFetch}
          existing={editing}
          onClose={() => { setAdding(false); setEditing(null); refetch(); }}
        />
      )}
    </div>
  );
}

function RedirectDialog({ adminFetch, existing, onClose }: { adminFetch: any; existing: Redirect | null; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    fromPath: existing?.fromPath || "",
    toPath: existing?.toPath || "",
    statusCode: existing?.statusCode || 301,
    note: existing?.note || "",
    isActive: existing?.isActive ?? true,
  });

  const save = useMutation({
    mutationFn: () => existing
      ? adminFetch(`/api/admin/seo/redirects/${existing.id}`, { method: "PATCH", body: JSON.stringify(form) })
      : adminFetch("/api/admin/seo/redirects", { method: "POST", body: JSON.stringify(form) }),
    onSuccess: () => { toast({ title: existing ? "Redirect updated" : "Redirect added" }); onClose(); },
    onError: (e: any) => toast({ title: "Save failed", description: e?.message, variant: "destructive" }),
  });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>{existing ? "Edit redirect" : "Add redirect"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label className="text-xs">From path (must start with /)</Label>
            <Input value={form.fromPath} onChange={(e) => setForm({ ...form, fromPath: e.target.value })} placeholder="/old-product-url" data-testid="input-redirect-from" />
          </div>
          <div>
            <Label className="text-xs">To path</Label>
            <Input value={form.toPath} onChange={(e) => setForm({ ...form, toPath: e.target.value })} placeholder="/product/new-slug" data-testid="input-redirect-to" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Status code</Label>
              <Select value={String(form.statusCode)} onValueChange={(v) => setForm({ ...form, statusCode: Number(v) })}>
                <SelectTrigger data-testid="select-redirect-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="301">301 — Permanent (recommended)</SelectItem>
                  <SelectItem value="302">302 — Temporary</SelectItem>
                  <SelectItem value="307">307 — Temp (preserve method)</SelectItem>
                  <SelectItem value="308">308 — Permanent (preserve method)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 mt-5">
              <Switch checked={form.isActive} onCheckedChange={(v) => setForm({ ...form, isActive: v })} id="r-active" />
              <Label htmlFor="r-active" className="text-sm cursor-pointer">Active</Label>
            </div>
          </div>
          <div>
            <Label className="text-xs">Note (internal)</Label>
            <Input value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} placeholder="Optional reason" data-testid="input-redirect-note" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#6D2B35] hover:bg-[#5a2129]" data-testid="button-save-redirect">
            {save.isPending ? "Saving…" : "Save redirect"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
