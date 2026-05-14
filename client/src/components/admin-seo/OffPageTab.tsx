import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Link2, ExternalLink } from "lucide-react";

interface BacklinkData {
  total: number; active: number; dofollow: number; nofollow: number; avgDomainAuthority: number;
  topTargets: { path: string; count: number }[];
  items: any[];
}

export function OffPageTab({ adminFetch }: { adminFetch: (url: string, init?: RequestInit) => Promise<any> }) {
  const { toast } = useToast();
  const [adding, setAdding] = useState(false);

  const { data, isLoading, refetch } = useQuery<BacklinkData>({
    queryKey: ["/api/admin/seo/backlinks"],
    queryFn: () => adminFetch("/api/admin/seo/backlinks"),
  });

  const del = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/seo/backlinks/${id}`, { method: "DELETE" }),
    onSuccess: () => { toast({ title: "Backlink deleted" }); refetch(); },
  });

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Stat label="Total backlinks" value={data?.total || 0} />
        <Stat label="Active" value={data?.active || 0} />
        <Stat label="Dofollow" value={data?.dofollow || 0} />
        <Stat label="Nofollow" value={data?.nofollow || 0} />
        <Stat label="Avg DA" value={data?.avgDomainAuthority || 0} />
      </div>

      {data && data.topTargets.length > 0 && (
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Top backlink targets</CardTitle></CardHeader>
          <CardContent className="pt-0 grid sm:grid-cols-2 gap-2">
            {data.topTargets.map((t, i) => (
              <div key={i} className="flex items-center justify-between text-sm rounded-md border bg-card px-3 py-2">
                <span className="font-mono text-xs truncate">{t.path}</span>
                <Badge variant="secondary">{t.count} links</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" /> Backlink tracker</CardTitle>
              <p className="text-xs text-muted-foreground mt-1">Track external links pointing to your site for off-page SEO monitoring.</p>
            </div>
            <Button onClick={() => setAdding(true)} data-testid="button-add-backlink"><Plus className="h-4 w-4 mr-2" /> Add backlink</Button>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          {isLoading ? <div className="py-12 text-center text-muted-foreground">Loading…</div> :
           data?.items.length ? (
            <ScrollArea className="h-[500px] pr-2">
              <div className="space-y-1.5">
                {data.items.map((b: any) => (
                  <div key={b.id} className="rounded-md border bg-card p-3 flex items-center gap-3" data-testid={`row-backlink-${b.id}`}>
                    <Badge variant={b.linkType === "dofollow" ? "default" : "outline"} className="shrink-0">{b.linkType}</Badge>
                    <div className="flex-1 min-w-0 text-sm">
                      <a href={b.sourceUrl} target="_blank" rel="noreferrer" className="font-medium truncate flex items-center gap-1 hover:underline">
                        {b.sourceUrl} <ExternalLink className="h-3 w-3 shrink-0 text-muted-foreground" />
                      </a>
                      <div className="text-[11px] text-muted-foreground flex flex-wrap gap-2">
                        <span>→ {b.targetPath}</span>
                        {b.anchorText && <span>· "{b.anchorText}"</span>}
                        {b.domainAuthority && <span>· DA {b.domainAuthority}</span>}
                        <span>· {b.status}</span>
                      </div>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => del.mutate(b.id)} data-testid={`button-del-backlink-${b.id}`}>
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : <div className="py-12 text-center text-sm text-muted-foreground">No backlinks tracked yet. Add ones from guest posts, directories, social profiles.</div>}
        </CardContent>
      </Card>

      {adding && <BacklinkDialog adminFetch={adminFetch} onClose={() => { setAdding(false); refetch(); }} />}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-md border bg-card p-3">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-xl font-semibold mt-0.5">{value}</div>
    </div>
  );
}

function BacklinkDialog({ adminFetch, onClose }: { adminFetch: any; onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({
    sourceUrl: "", targetPath: "/", anchorText: "", domainAuthority: 0,
    linkType: "dofollow", status: "active", note: "",
  });
  const save = useMutation({
    mutationFn: () => adminFetch("/api/admin/seo/backlinks", {
      method: "POST",
      body: JSON.stringify({ ...form, domainAuthority: form.domainAuthority || null }),
    }),
    onSuccess: () => { toast({ title: "Backlink added" }); onClose(); },
    onError: (e: any) => toast({ title: "Failed", description: e?.message, variant: "destructive" }),
  });
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Add backlink</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label className="text-xs">Source URL (the page linking to you)</Label>
            <Input value={form.sourceUrl} onChange={(e) => setForm({ ...form, sourceUrl: e.target.value })} placeholder="https://example.com/blog/post" data-testid="input-bl-source" /></div>
          <div><Label className="text-xs">Target path on our site</Label>
            <Input value={form.targetPath} onChange={(e) => setForm({ ...form, targetPath: e.target.value })} placeholder="/product/some-slug" data-testid="input-bl-target" /></div>
          <div><Label className="text-xs">Anchor text</Label>
            <Input value={form.anchorText} onChange={(e) => setForm({ ...form, anchorText: e.target.value })} data-testid="input-bl-anchor" /></div>
          <div className="grid grid-cols-3 gap-3">
            <div><Label className="text-xs">Domain Authority</Label>
              <Input type="number" min={0} max={100} value={form.domainAuthority} onChange={(e) => setForm({ ...form, domainAuthority: parseInt(e.target.value || "0") })} data-testid="input-bl-da" /></div>
            <div><Label className="text-xs">Link type</Label>
              <Select value={form.linkType} onValueChange={(v) => setForm({ ...form, linkType: v })}>
                <SelectTrigger data-testid="select-bl-type"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="dofollow">Dofollow</SelectItem><SelectItem value="nofollow">Nofollow</SelectItem><SelectItem value="ugc">UGC</SelectItem><SelectItem value="sponsored">Sponsored</SelectItem></SelectContent>
              </Select>
            </div>
            <div><Label className="text-xs">Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                <SelectTrigger data-testid="select-bl-status"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="active">Active</SelectItem><SelectItem value="lost">Lost</SelectItem><SelectItem value="pending">Pending</SelectItem></SelectContent>
              </Select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => save.mutate()} disabled={save.isPending} className="bg-[#6D2B35] hover:bg-[#5a2129]" data-testid="button-save-backlink">
            {save.isPending ? "Saving…" : "Save backlink"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
