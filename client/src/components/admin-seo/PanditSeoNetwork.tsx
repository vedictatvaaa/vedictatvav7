import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, ChevronRight, FileText, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Indexability = { status?: string; reasons?: string[] };
type NetworkRow = {
  entityType: string;
  entityKey: string | null;
  label: string;
  indexability?: Indexability;
  canonicalUrl?: string | null;
  editorialStatus?: string | null;
};
type Editorial = {
  entityType: string;
  entityKey: string;
  introduction?: string | null;
  faqs?: Array<{ question?: string; answer?: string }> | null;
  status?: string | null;
};
type Network = {
  enabled: boolean;
  evaluatedAt?: string | null;
  summary: { profiles: number; cities: number; cityServices: number; indexable: number; noindex: number; notFound: number };
  reasonCounts?: Record<string, number>;
  profiles?: NetworkRow[];
  cities?: NetworkRow[];
  cityServices?: NetworkRow[];
  editorials?: Editorial[];
};

const entityNames: Record<string, string> = {
  profile: "Profile", city: "City", city_service: "City service",
};

function statusClass(status?: string | null) {
  const value = status?.toLowerCase();
  if (value === "indexable" || value === "published" || value === "reviewed") return "bg-emerald-100 text-emerald-900";
  if (value === "noindex" || value?.startsWith("noindex_") || value === "blocked") return "bg-amber-100 text-amber-900";
  return "bg-muted text-muted-foreground";
}

export function PanditSeoNetwork({ adminToken, fetcher }: { adminToken: string; fetcher: (url: string) => Promise<unknown> }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [entityFilter, setEntityFilter] = useState("all");
  const [selected, setSelected] = useState<NetworkRow | null>(null);
  const [introduction, setIntroduction] = useState("");
  const [faqs, setFaqs] = useState<Array<{ question: string; answer: string }>>([]);

  const networkQuery = useQuery<Network>({ queryKey: ["/api/admin/pandit-seo-network"], queryFn: () => fetcher("/api/admin/pandit-seo-network") as Promise<Network> });
  const editorialQuery = useQuery<Editorial[]>({ queryKey: ["/api/admin/pandit-seo-editorial"], queryFn: () => fetcher("/api/admin/pandit-seo-editorial") as Promise<Editorial[]> });
  const network = networkQuery.data;
  const editorials = editorialQuery.data || network?.editorials || [];
  const rows = useMemo(() => [...(network?.profiles || []), ...(network?.cities || []), ...(network?.cityServices || [])], [network]);
  const visibleRows = useMemo(() => rows.filter(row => {
    const haystack = `${row.label} ${row.entityKey} ${(row.indexability?.reasons || []).join(" ")}`.toLowerCase();
    return (entityFilter === "all" || row.entityType === entityFilter) && haystack.includes(search.toLowerCase());
  }), [rows, entityFilter, search]);

  const selectRow = (row: NetworkRow) => {
    if (!["profile", "city", "city_service"].includes(row.entityType)) return;
    if (!row.entityKey) return;
    const editorial = editorials.find(item => item.entityType === row.entityType && item.entityKey === row.entityKey);
    setSelected(row);
    setIntroduction(editorial?.introduction || "");
    setFaqs((editorial?.faqs || []).slice(0, 12).map(faq => ({ question: faq.question || "", answer: faq.answer || "" })));
  };

  const request = async (url: string, method: "PUT" | "PATCH", body: unknown) => {
    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.message || payload.error || "Request failed");
    }
    return response.json();
  };
  const rolloutMutation = useMutation({
    mutationFn: (enabled: boolean) => request("/api/admin/pandit-seo-network/rollout", "PATCH", { enabled }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-seo-network"] }); toast({ title: "Pandit SEO rollout updated" }); },
    onError: (error: Error) => toast({ title: "Could not update rollout", description: error.message, variant: "destructive" }),
  });
  const editorialMutation = useMutation({
    mutationFn: async (action: "draft" | "reviewed" | "published") => {
      if (!selected?.entityKey) throw new Error("Select an eligible coverage row before saving editorial content");
      const url = `/api/admin/pandit-seo-editorial/${encodeURIComponent(selected.entityType)}/${encodeURIComponent(selected.entityKey)}`;
      await request(url, "PUT", {
        introduction, faqs: faqs.filter(faq => faq.question.trim() || faq.answer.trim()), status,
      });
      if (action === "reviewed" || action === "published") {
        await request(`${url}/status`, "PATCH", { status: "reviewed" });
      }
      if (action === "published") {
        await request(`${url}/status`, "PATCH", { status: "published" });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-seo-editorial"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-seo-network"] });
      toast({ title: "Editorial saved" });
    },
    onError: (error: Error) => toast({ title: "Could not save editorial", description: error.message, variant: "destructive" }),
  });

  if (networkQuery.isLoading) return <Card><CardContent className="py-8 text-sm text-muted-foreground">Loading Pandit SEO Network…</CardContent></Card>;
  if (networkQuery.isError || !network) return <Card><CardContent className="py-8 text-sm text-destructive">Pandit SEO Network could not be loaded. Please try again.</CardContent></Card>;

  return <div className="space-y-6">
    <Card className="border-amber-200 bg-amber-50/50">
      <CardContent className="flex flex-col gap-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2 font-medium text-amber-950"><AlertTriangle className="h-4 w-4" /> Search rollout is off by default</div>
          <p className="mt-1 text-sm text-amber-900/80">Enable only after eligibility and canonical blockers are resolved. Editorial copy never overrides supply or eligibility rules.</p>
        </div>
        <div className="flex items-center gap-3">
          <Label htmlFor="pandit-seo-rollout">{network.enabled ? "Network enabled" : "Network disabled"}</Label>
          <Switch id="pandit-seo-rollout" checked={network.enabled} disabled={rolloutMutation.isPending} onCheckedChange={enabled => rolloutMutation.mutate(enabled)} aria-label="Enable Pandit SEO Network rollout" />
        </div>
      </CardContent>
    </Card>

    <div className="grid grid-cols-2 gap-3 lg:grid-cols-6">
      {[["Profiles", network.summary.profiles], ["Cities", network.summary.cities], ["City services", network.summary.cityServices], ["Indexable", network.summary.indexable], ["Noindex", network.summary.noindex], ["Not found", network.summary.notFound]].map(([label, count]) =>
        <Card key={String(label)}><CardContent className="p-4"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-semibold">{count}</p></CardContent></Card>)}
    </div>

    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_390px]">
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-3"><CardTitle className="text-base">Coverage & eligibility</CardTitle><CardDescription>Last evaluated: {network.evaluatedAt ? new Date(network.evaluatedAt).toLocaleString() : "Not available"}</CardDescription></CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input aria-label="Search Pandit SEO coverage" className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search name, key, or blocker" /></div>
              <select aria-label="Filter coverage by entity type" value={entityFilter} onChange={event => setEntityFilter(event.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="all">All entities</option><option value="profile">Profiles</option><option value="city">Cities</option><option value="city_service">City services</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm"><thead className="border-b text-xs uppercase text-muted-foreground"><tr><th className="p-2">Entity</th><th className="p-2">Indexability</th><th className="p-2">Blockers</th><th className="p-2">Canonical</th><th className="p-2">Editorial</th><th className="p-2" /></tr></thead>
                <tbody>{visibleRows.map(row => { const eligible = ["profile", "city", "city_service"].includes(row.entityType) && Boolean(row.entityKey); return <tr key={`${row.entityType}-${row.entityKey || row.label}`} className="border-b last:border-0"><td className="p-2"><div className="font-medium">{row.label}</div><div className="text-xs text-muted-foreground">{entityNames[row.entityType] || row.entityType}</div></td><td className="p-2"><span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClass(row.indexability?.status)}`}>{row.indexability?.status || "Unknown"}</span></td><td className="p-2 text-xs text-muted-foreground">{row.indexability?.reasons?.join(", ") || "—"}</td><td className="p-2">{row.canonicalUrl ? <span className="text-xs text-emerald-800">Present</span> : <span className="text-xs font-medium text-amber-800">Canonical pending</span>}</td><td className="p-2"><span className={`rounded-full px-2 py-1 text-xs ${statusClass(row.editorialStatus)}`}>{row.editorialStatus || "Not started"}</span></td><td className="p-2">{eligible && <Button size="sm" variant="ghost" onClick={() => selectRow(row)} aria-label={`Edit editorial for ${row.label}`}><ChevronRight className="h-4 w-4" /></Button>}</td></tr>; })}</tbody>
              </table>
            </div>
            {visibleRows.length === 0 && <p className="py-8 text-center text-sm text-muted-foreground">No coverage records match these filters.</p>}
          </CardContent>
        </Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-base">Blocker reasons</CardTitle></CardHeader><CardContent className="flex flex-wrap gap-2">{Object.entries(network.reasonCounts || {}).length ? Object.entries(network.reasonCounts || {}).map(([reason, count]) => <span key={reason} className="rounded-md bg-muted px-2.5 py-1.5 text-xs"><strong>{count}</strong> {reason}</span>) : <p className="text-sm text-muted-foreground">No blocker reasons reported.</p>}</CardContent></Card>
      </div>

      <Card className="h-fit xl:sticky xl:top-4">
        <CardHeader><CardTitle className="flex items-center gap-2 text-base"><FileText className="h-4 w-4" /> Editorial workspace</CardTitle><CardDescription>{selected ? `${selected.label} · ${entityNames[selected.entityType] || selected.entityType}` : "Select an eligible row to edit its content."}</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          {selected ? <><p className="rounded-md bg-muted p-3 text-xs text-muted-foreground">Copy is editorial only. It cannot override supply, eligibility, indexability, or canonical requirements.</p>
            <div><Label htmlFor="seo-introduction">Introduction</Label><Textarea id="seo-introduction" value={introduction} onChange={event => setIntroduction(event.target.value)} rows={5} placeholder="Write approved editorial introduction…" /></div>
            <div className="space-y-3"><div className="flex items-center justify-between"><Label>FAQs</Label><span className="text-xs text-muted-foreground">{faqs.length}/12</span></div>{faqs.map((faq, index) => <div className="space-y-2 rounded-md border p-3" key={index}><Input aria-label={`FAQ ${index + 1} question`} value={faq.question} onChange={event => setFaqs(current => current.map((item, i) => i === index ? { ...item, question: event.target.value } : item))} placeholder={`Question ${index + 1}`} /><Textarea aria-label={`FAQ ${index + 1} answer`} value={faq.answer} onChange={event => setFaqs(current => current.map((item, i) => i === index ? { ...item, answer: event.target.value } : item))} placeholder="Answer" rows={2} /><Button size="sm" variant="ghost" className="text-destructive" onClick={() => setFaqs(current => current.filter((_, i) => i !== index))}>Remove</Button></div>)}{faqs.length < 12 && <Button type="button" variant="outline" size="sm" onClick={() => setFaqs(current => [...current, { question: "", answer: "" }])}>Add FAQ</Button>}</div>
            <div className="flex flex-wrap gap-2 border-t pt-4"><Button size="sm" variant="outline" disabled={editorialMutation.isPending} onClick={() => editorialMutation.mutate("draft")}>Save Draft</Button><Button size="sm" variant="secondary" disabled={editorialMutation.isPending} onClick={() => editorialMutation.mutate("reviewed")}>Mark Reviewed</Button><Button size="sm" disabled={editorialMutation.isPending} onClick={() => editorialMutation.mutate("published")}>Publish</Button></div>
          </> : <p className="py-12 text-center text-sm text-muted-foreground">Choose a profile, city, or city service from the coverage table.</p>}
        </CardContent>
      </Card>
    </div>
  </div>;
}