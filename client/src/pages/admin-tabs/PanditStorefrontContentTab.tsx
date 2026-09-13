import { useMemo, useState } from "react";
import { AlertTriangle, Check, ExternalLink, FileSearch, Loader2, Pencil, RefreshCw, Search, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { createFetcher } from "../admin-shared";

type Row = { panditId: number; name: string; slug?: string | null; city?: string | null; canonicalUrl?: string | null; generationStatus?: string | null; publicationStatus?: string | null; stale?: boolean; staleReason?: string | null; indexingStatus?: string | null; sourceFacts?: Record<string, unknown>; current?: Record<string, string | null>; draft?: Record<string, string | null>; record?: any; currentSourceSnapshotHash?: string; };
const fields = ["introduction", "tagline", "serviceOverview", "seoTitle", "metaDescription", "aiSearchSummary"];
const labels: Record<string, string> = { introduction: "Profile introduction", tagline: "Professional tagline", serviceOverview: "Service overview", seoTitle: "SEO title", metaDescription: "Meta description", aiSearchSummary: "AI-search summary" };

function pill(value?: string | null) { const v = (value || "not_started").toLowerCase(); return <Badge variant={v === "published" || v === "approved" ? "default" : v === "stale" || v === "rejected" ? "destructive" : "secondary"}>{value || "Not started"}</Badge>; }

export default function PanditStorefrontContentTab() {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(token); const qc = useQueryClient();
  const [search, setSearch] = useState(""); const [status, setStatus] = useState("all"); const [selected, setSelected] = useState<Row | null>(null); const [confirm, setConfirm] = useState<"generate" | "publish" | "reject" | "review" | "regenerate" | null>(null); const [edit, setEdit] = useState<Record<string, string>>({}); const [actionError, setActionError] = useState("");
  const query = useQuery<Row[]>({
    queryKey: ["/api/admin/pandit-storefront-content", "existing-contracts"],
    queryFn: async () => {
      const response = await fetcher("/api/admin/pandit-storefront-content?limit=200&offset=0") as { items?: Array<any> };
      return (response.items || []).map((item) => {
        const content = item.content || {};
        const eligibility = item.eligibility || {};
        return {
          panditId: Number(item.panditId),
          name: item.name || "Pandit profile",
          canonicalUrl: item.canonicalUrl,
          publicationStatus: content.status || "not_started",
          generationStatus: content.status || "not_started",
          stale: !!content.stale,
          staleReason: content.staleReason,
          indexingStatus: eligibility.indexable ? "Indexable" : "Not indexable",
          record: content.revision == null ? null : { revision: content.revision, status: content.status, stale: content.stale, staleReason: content.staleReason },
          eligibility,
        } as Row;
      });
    },
  });
  const rows = useMemo(() => (query.data || []).filter(row => `${row.name} ${row.city || ""} ${row.slug || ""}`.toLowerCase().includes(search.toLowerCase()) && (status === "all" || (row.publicationStatus || row.generationStatus) === status)), [query.data, search, status]);
  const request = async (url: string, method: string, body?: unknown) => { const res = await fetch(url, { method, headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) }, body: body === undefined ? undefined : JSON.stringify(body) }); const data = await res.json().catch(() => ({})); if (!res.ok) throw new Error(data.message || data.error || "Request failed"); return data; };
  const action = useMutation({
    mutationFn: async ({ kind, row }: { kind: string; row: Row }) => {
      const base = `/api/admin/pandit-storefront-content/${row.panditId}`;
      const revision = row.record?.revision;
      if ((kind === "generate") && !row.record) return request(`${base}/generate`, "POST", { confirm: true });
      if (!Number.isSafeInteger(revision)) throw new Error("Reload the content record before taking this action.");
      if (kind === "generate" || kind === "regenerate") return request(`${base}/generate`, "POST", { confirm: true, expectedRevision: revision, regenerate: kind === "regenerate" });
      if (kind === "publish" || kind === "review" || kind === "reject") return request(`${base}/status`, "POST", { expectedRevision: revision, status: kind === "publish" ? "published" : kind === "review" ? "reviewed" : "rejected", reason: kind === "reject" ? "Rejected by Admin" : undefined });
      throw new Error("Unsupported action");
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/admin/pandit-storefront-content"] }); setConfirm(null); setActionError(""); },
    onError: (error: Error) => setActionError(error.message || "The content action could not be completed."),
  });
  const save = useMutation({
    mutationFn: ({ row, content }: { row: Row; content: Record<string, string> }) => request(`/api/admin/pandit-storefront-content/${row.panditId}/draft`, "PATCH", { expectedRevision: row.record?.revision, draft: { profileIntroduction: content.introduction || "", tagline: content.tagline || "", serviceOverview: content.serviceOverview || "", seoTitle: content.seoTitle || "", metaDescription: content.metaDescription || "", faqs: [], aiSummary: content.aiSearchSummary || "" } }),
    onSuccess: (data) => { setSelected((current) => current ? { ...current, record: data, publicationStatus: data.status, generationStatus: data.status, stale: !!data.stale, staleReason: data.staleReason } : current); setEdit({}); qc.invalidateQueries({ queryKey: ["/api/admin/pandit-storefront-content"] }); },
  });
  const open = async (row: Row) => {
    setSelected({ ...row });
    try {
      const detail = await fetcher(`/api/admin/pandit-storefront-content/${row.panditId}`) as any;
      const record = detail.record;
      const current = record ? { introduction: record.publishedProfileIntroduction || "", tagline: record.publishedTagline || "", serviceOverview: record.publishedServiceOverview || "", seoTitle: record.publishedSeoTitle || "", metaDescription: record.publishedMetaDescription || "", aiSearchSummary: record.publishedAiSummary || "" } : {};
      const draft = record ? { introduction: record.generatedProfileIntroduction || "", tagline: record.generatedTagline || "", serviceOverview: record.generatedServiceOverview || "", seoTitle: record.generatedSeoTitle || "", metaDescription: record.generatedMetaDescription || "", aiSearchSummary: record.generatedAiSummary || "" } : {};
      const hydrated = { ...row, record, current, draft, sourceFacts: detail.sourceFacts, currentSourceSnapshotHash: detail.currentSourceSnapshotHash, canonicalUrl: record?.canonicalUrl || `/pandit/${row.slug || row.panditId}`, publicationStatus: record?.status || "not_started", generationStatus: record?.status || "not_started", stale: !!record?.stale, staleReason: record?.staleReason };
      setSelected(hydrated);
      qc.setQueryData<Row[]>(["/api/admin/pandit-storefront-content", "existing-contracts"], (items) => items?.map((item) => item.panditId === hydrated.panditId ? hydrated : item));
      setEdit(Object.fromEntries(fields.map(field => [field, draft[field] || current[field] || ""])));
    } catch {
      setSelected(null);
    }
  };

  if (query.isLoading) return <div className="space-y-4"><Skeleton className="h-12 w-80" /><Skeleton className="h-16 w-full" /><Skeleton className="h-80 w-full" /></div>;
  if (query.isError) return <Card><CardContent className="py-12 text-center"><AlertTriangle className="mx-auto mb-3 h-8 w-8 text-destructive" /><h2 className="font-medium">Storefront content could not be loaded</h2><Button className="mt-4" variant="outline" onClick={() => query.refetch()}>Try again</Button></CardContent></Card>;
  return <div className="space-y-6" data-testid="pandit-storefront-content">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground/70">Editorial governance</p><h1 className="mt-1 text-3xl text-primary">Pandit Storefront Content</h1><p className="mt-1 text-sm text-muted-foreground">Improve only verified Pandit and catalogue facts. Publication never happens from generation.</p></div><Button variant="outline" onClick={() => query.refetch()} disabled={query.isFetching}><RefreshCw className={`mr-2 h-4 w-4 ${query.isFetching ? "animate-spin" : ""}`} />Refresh</Button></div>
    <Card><CardContent className="flex flex-col gap-3 p-4 md:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name, city, or slug" aria-label="Search Pandit storefront content" /></div><select className="h-10 rounded-md border border-input bg-background px-3 text-sm" value={status} onChange={e => setStatus(e.target.value)} aria-label="Filter content status"><option value="all">All editorial states</option><option value="not_started">Not started</option><option value="draft">Draft</option><option value="reviewed">Reviewed</option><option value="published">Published</option><option value="stale">Stale</option></select></CardContent></Card>
    <Card><CardHeader><CardTitle className="text-base">Eligible storefronts <span className="ml-2 text-sm font-normal text-muted-foreground">{rows.length} records</span></CardTitle></CardHeader><CardContent className="p-0"><div className="overflow-x-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="border-y bg-muted/30 text-xs uppercase text-muted-foreground"><tr><th className="p-3">Pandit</th><th className="p-3">Editorial</th><th className="p-3">Indexing</th><th className="p-3">Source</th><th className="p-3" /></tr></thead><tbody>{rows.map(row => <tr key={row.panditId} className="border-b last:border-0"><td className="p-3"><div className="font-medium">{row.name}</div><div className="text-xs text-muted-foreground">{row.city || "Location not supplied"}</div>{row.stale && <div className="mt-1 flex items-center gap-1 text-xs text-amber-800"><AlertTriangle className="h-3 w-3" />{row.staleReason || "Source facts changed"}</div>}</td><td className="p-3">{pill(row.publicationStatus || row.generationStatus)}</td><td className="p-3 text-xs">{row.indexingStatus || "Not evaluated"}</td><td className="p-3"><Button size="sm" variant="ghost" onClick={() => open(row)}><FileSearch className="mr-1 h-4 w-4" />Review</Button></td><td className="p-3 text-right">{row.canonicalUrl ? <a className="inline-flex items-center gap-1 text-xs text-primary underline" href={row.canonicalUrl} target="_blank" rel="noreferrer">Canonical <ExternalLink className="h-3 w-3" /></a> : <span className="text-xs text-muted-foreground">Canonical pending</span>}</td></tr>)}</tbody></table></div>{!rows.length && <div className="py-12 text-center text-sm text-muted-foreground">No storefront content matches these filters.</div>}</CardContent></Card>
    <Dialog open={!!selected} onOpenChange={openState => !openState && setSelected(null)}><DialogContent className="max-h-[90dvh] max-w-5xl overflow-y-auto"><DialogHeader><DialogTitle>{selected?.name} · source-grounded editorial</DialogTitle><DialogDescription>Canonical: {selected?.canonicalUrl || "Not available"} · Current safe text remains live until approval.</DialogDescription></DialogHeader>{selected && <div className="space-y-5"><div className="rounded-md border bg-muted/30 p-4"><h3 className="text-sm font-semibold">Verified source facts</h3><pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(selected.sourceFacts || {}, null, 2)}</pre></div>{selected.stale && <div role="alert" className="flex gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="h-4 w-4 shrink-0" />{selected.staleReason || "Source facts changed. Review a fresh draft before publishing."}</div>}<div className="grid gap-4 lg:grid-cols-2">{fields.map(field => <div key={field} className="space-y-2"><Label>{labels[field]}</Label><div className="grid gap-2 md:grid-cols-2"><div><span className="mb-1 block text-[11px] uppercase text-muted-foreground">Current</span><div className="min-h-20 rounded-md border bg-muted/20 p-2 text-sm">{selected.current?.[field] || "No published text"}</div></div><div><span className="mb-1 block text-[11px] uppercase text-muted-foreground">Generated draft</span><Textarea value={edit[field] || ""} onChange={e => setEdit(v => ({ ...v, [field]: e.target.value }))} rows={4} aria-label={`Edit ${labels[field]}`} /></div></div></div>)}</div><div className="flex flex-wrap gap-2 border-t pt-4"><Button variant="outline" disabled={save.isPending} onClick={() => save.mutate({ row: selected, content: edit })}><Pencil className="mr-2 h-4 w-4" />Save edit</Button><Button variant="outline" onClick={() => setConfirm("regenerate")}><RefreshCw className="mr-2 h-4 w-4" />Regenerate</Button><Button variant="outline" onClick={() => setConfirm("reject")}><X className="mr-2 h-4 w-4" />Reject</Button><Button variant="secondary" onClick={() => setConfirm("generate")}><FileSearch className="mr-2 h-4 w-4" />Generate draft</Button><Button variant="secondary" onClick={() => setConfirm("review")} disabled={selected.publicationStatus !== "draft"}><Check className="mr-2 h-4 w-4" />Mark reviewed</Button><Button onClick={() => setConfirm("publish")} disabled={selected.publicationStatus !== "reviewed"}><Check className="mr-2 h-4 w-4" />Publish</Button></div>{selected.publicationStatus !== "reviewed" && <p className="text-xs text-muted-foreground">Publish is locked until this draft has been reviewed.</p>}</div>}</DialogContent></Dialog>
    <Dialog open={!!confirm} onOpenChange={openState => { if (!openState) { setConfirm(null); setActionError(""); } }}><DialogContent><DialogHeader><DialogTitle>{confirm === "publish" ? "Publish reviewed content?" : confirm === "review" ? "Mark this draft reviewed?" : confirm === "reject" ? "Reject this draft?" : confirm === "regenerate" ? "Regenerate this draft?" : "Generate a factual draft?"}</DialogTitle><DialogDescription>{confirm === "publish" ? "Only a reviewed, non-stale record can be published. This action is audited and notifies sitemap publication." : confirm === "review" ? "Review confirms this copy can proceed to the existing publish transition." : confirm === "reject" ? "This records a rejected editorial state. It can be deliberately regenerated or returned to draft." : "Generation sends only the approved public source snapshot. The backend will reject unpublished or ineligible Pandits honestly."}</DialogDescription></DialogHeader>{actionError && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">Generation or content action failed: {actionError}{/unpublished|eligible|published/i.test(actionError) && <span className="mt-1 block text-xs">Only a publicly eligible Pandit with a published storefront can generate content.</span>}</div>}<DialogFooter><Button variant="outline" onClick={() => { setConfirm(null); setActionError(""); }}>Cancel</Button>{confirm && <Button disabled={action.isPending || !selected} onClick={() => { setActionError(""); selected && action.mutate({ kind: confirm!, row: selected }); }}>{action.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Confirm</Button>}</DialogFooter></DialogContent></Dialog>
  </div>;
}