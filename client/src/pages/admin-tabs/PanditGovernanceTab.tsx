import { useDeferredValue, useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { AlertTriangle, CheckCircle2, ChevronLeft, ChevronRight, Loader2, MapPin, Search, ShieldCheck, SlidersHorizontal, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { createFetcher } from "../admin-shared";

type Effective = Record<string, unknown>;
type GovernanceRow = {
  id: number;
  name: string;
  slug?: string | null;
  completeness?: { score?: number; missingFields?: string[] } | number;
  missingFields?: string[];
  effective?: Effective;
  currentLocation?: { id?: number; name?: string; city?: string; state?: string } | string | null;
  location?: { id?: number; name?: string; city?: string; state?: string } | string | null;
  publicationStatus?: string;
  accountStatus?: string;
  contactOverride?: string | null;
  contactRevealCount?: number;
  revealCount?: number;
  status?: string;
  issue?: string | string[];
};
type GovernanceResponse = {
  items: GovernanceRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages?: number };
  summary: Record<string, number>;
};

const PAGE_SIZE = 25;
const RISKY_ACTIONS = new Set(["publish", "unpublish", "verify", "revoke", "suspend", "reactivate"]);
const ACTIONS = [
  { value: "publish", label: "Publish directory", bulk: false },
  { value: "unpublish", label: "Unpublish directory", bulk: false },
  { value: "verify", label: "Verify account", bulk: false },
  { value: "revoke", label: "Revoke verification", bulk: false },
  { value: "suspend", label: "Suspend account", bulk: false },
  { value: "reactivate", label: "Reactivate account", bulk: false },
  { value: "leave", label: "Set leave status", bulk: false },
  { value: "index_mode", label: "Set index mode", bulk: true },
  { value: "contact_override", label: "Set contact override", bulk: true },
  { value: "canonical_location", label: "Set canonical location", bulk: false },
] as const;

function readable(value: unknown, fallback = "Not set") {
  if (typeof value !== "string" || !value.trim()) return fallback;
  return value.replace(/[_-]/g, " ");
}
function locationLabel(row: GovernanceRow) {
  const location = row.currentLocation || row.location;
  if (!location) return "Not assigned";
  if (typeof location === "string") return location;
  return [location.name, location.city, location.state].filter(Boolean).join(" · ") || "Not assigned";
}
function effectiveStatus(effective: Effective | undefined, key: string, fallback?: string) {
  const item = effective?.[key];
  if (typeof item === "object" && item) {
    const value = item as Record<string, unknown>;
    return { value: readable(value.status ?? value.value ?? value.effective), reason: readable(value.reason, "No override reason") };
  }
  return { value: readable(item ?? fallback), reason: "No override reason" };
}

export default function PanditGovernanceTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = useMemo(() => createFetcher(adminToken), [adminToken]);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const deferredQ = useDeferredValue(q);
  const [status, setStatus] = useState("all");
  const [issue, setIssue] = useState("all");
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [target, setTarget] = useState<GovernanceRow | null>(null);
  const [action, setAction] = useState<string>("");
  const [value, setValue] = useState("");
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  const url = useMemo(() => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(PAGE_SIZE) });
    if (deferredQ.trim()) params.set("q", deferredQ.trim());
    if (status !== "all") params.set("status", status);
    if (issue !== "all") params.set("issue", issue);
    return `/api/admin/pandit-governance?${params}`;
  }, [page, deferredQ, status, issue]);
  const governance = useQuery<GovernanceResponse>({ queryKey: ["/api/admin/pandit-governance", url], queryFn: () => fetcher(url) });
  const rows = governance.data?.items || [];
  const selectedRows = rows.filter(row => selected.has(row.id));
  const selectedCount = selectedRows.length;
  const bulkActions = ACTIONS.filter(item => item.bulk);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-governance"] });
  const updateOne = useMutation({
    mutationFn: ({ id, action: nextAction, value: nextValue, reason: nextReason }: { id: number; action: string; value?: string; reason?: string }) =>
      apiRequest("PATCH", `/api/admin/pandit-governance/${id}`, { action: nextAction, ...(nextValue ? { value: nextValue } : {}), ...(nextReason ? { reason: nextReason } : {}) }, { "x-admin-token": adminToken || "" }),
    onSuccess: () => { refresh(); closeDialog(); toast({ title: "Governance update saved" }); },
    onError: (error: Error) => toast({ title: "Governance update failed", description: error.message, variant: "destructive" }),
  });
  const updateBulk = useMutation({
    mutationFn: ({ ids, action: nextAction, value: nextValue, reason: nextReason }: { ids: number[]; action: string; value?: string; reason?: string }) =>
      apiRequest("POST", "/api/admin/pandit-governance/bulk", { ids, action: nextAction, ...(nextValue ? { value: nextValue } : {}), ...(nextReason ? { reason: nextReason } : {}) }, { "x-admin-token": adminToken || "" }),
    onSuccess: (_data, variables) => { refresh(); setSelected(new Set()); closeDialog(); toast({ title: `Updated ${variables.ids.length} pandit${variables.ids.length === 1 ? "" : "s"}` }); },
    onError: (error: Error) => toast({ title: "Bulk update failed", description: error.message, variant: "destructive" }),
  });
  const closeDialog = () => { setTarget(null); setAction(""); setValue(""); setReason(""); setConfirmed(false); };
  const openAction = (row: GovernanceRow | null, nextAction = "") => { setTarget(row); setAction(nextAction); setValue(""); setReason(""); setConfirmed(false); };
  const isBulk = target === null && !!action;
  const requiresReason = RISKY_ACTIONS.has(action);
  const requiresValue = action === "index_mode" || action === "contact_override" || action === "canonical_location";
  const canSubmit = !!action && (!requiresReason || reason.trim().length > 0) && (!requiresValue || value) && (!requiresReason || confirmed) && (!isBulk || selectedCount > 0) && !updateOne.isPending && !updateBulk.isPending;
  const submitAction = () => {
    if (!canSubmit) return;
    if (target) updateOne.mutate({ id: target.id, action, value, reason: reason.trim() || undefined });
    else updateBulk.mutate({ ids: selectedRows.map(row => row.id), action, value, reason: reason.trim() || undefined });
  };
  const totalPages = governance.data?.pagination.totalPages || Math.max(1, Math.ceil((governance.data?.pagination.total || 0) / PAGE_SIZE));
  const setFilter = (setter: (value: string) => void, next: string) => { setter(next); setPage(1); setSelected(new Set()); };

  return (
    <div className="space-y-5 min-w-0" data-testid="pandit-governance-workspace">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="font-serif text-2xl text-primary">Pandit Governance</h1><p className="text-sm text-muted-foreground">Operational controls for discovery, eligibility and privacy-safe contact access.</p></div>
        <Badge variant="outline" className="w-fit gap-1"><ShieldCheck className="h-3.5 w-3.5" />Server-governed</Badge>
      </div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Object.entries(governance.data?.summary || {}).slice(0, 4).map(([label, count]) => <Card key={label}><CardContent className="p-4"><p className="text-xs text-muted-foreground capitalize">{readable(label)}</p><p className="mt-1 text-2xl font-semibold text-primary">{count}</p></CardContent></Card>)}
        {!governance.data?.summary && <><Card><CardContent className="p-4 text-sm text-muted-foreground">Loading summary…</CardContent></Card></>}
      </div>
      <Card><CardContent className="p-4 sm:p-5">
        <div className="grid gap-2 md:grid-cols-[minmax(0,1fr)_180px_180px]">
          <div className="relative"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="Search pandit governance records" className="pl-9" value={q} onChange={event => setFilter(setQ, event.target.value)} placeholder="Search by name or profile identifier" /></div>
          <Select value={status} onValueChange={next => setFilter(setStatus, next)}><SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="unpublished">Unpublished</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
          <Select value={issue} onValueChange={next => setFilter(setIssue, next)}><SelectTrigger aria-label="Filter by issue"><SelectValue placeholder="All issues" /></SelectTrigger><SelectContent><SelectItem value="all">All issues</SelectItem><SelectItem value="incomplete">Incomplete profile</SelectItem><SelectItem value="location">Location issue</SelectItem><SelectItem value="contact">Contact policy</SelectItem><SelectItem value="discovery">Discovery issue</SelectItem></SelectContent></Select>
        </div>
        <div className="mt-4 flex flex-col gap-2 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">{selectedCount ? <><strong className="text-foreground">{selectedCount}</strong> selected (maximum 100)</> : "Select matching records for one supported, homogeneous safe action."}</p>
          <div className="flex gap-2"><Button size="sm" variant="outline" disabled={!selectedCount} onClick={() => setSelected(new Set())}>Clear selection</Button><Button size="sm" disabled={!selectedCount || selectedCount > 100} onClick={() => openAction(null)}><SlidersHorizontal className="mr-1.5 h-4 w-4" />Bulk action</Button></div>
        </div>
      </CardContent></Card>

      {governance.isLoading ? <div className="py-12 text-center text-sm text-muted-foreground"><Loader2 className="mr-2 inline h-4 w-4 animate-spin" />Loading governance records…</div> : governance.isError ? <div role="alert" className="py-10 text-center text-sm text-destructive">Governance records could not be loaded. Please try again.</div> : rows.length === 0 ? <div className="py-12 text-center text-sm text-muted-foreground">No records match these filters.</div> : <>
        <div className="hidden overflow-x-auto rounded-lg border md:block"><table className="w-full min-w-[980px] text-sm"><thead className="bg-muted/40 text-left text-xs text-muted-foreground"><tr><th className="w-12 p-3"><Checkbox aria-label="Select all visible rows" checked={rows.length > 0 && rows.every(row => selected.has(row.id))} onCheckedChange={checked => setSelected(checked ? new Set(rows.map(row => row.id)) : new Set())} /></th><th className="p-3">Pandit / completeness</th><th className="p-3">Effective access</th><th className="p-3">Location & account</th><th className="p-3 text-right">Controls</th></tr></thead><tbody>{rows.map(row => <GovernanceTableRow key={row.id} row={row} selected={selected.has(row.id)} onToggle={() => setSelected(current => { const next = new Set(current); next.has(row.id) ? next.delete(row.id) : next.add(row.id); return next; })} onManage={() => openAction(row)} />)}</tbody></table></div>
        <div className="space-y-3 md:hidden">{rows.map(row => <GovernanceCard key={row.id} row={row} selected={selected.has(row.id)} onToggle={() => setSelected(current => { const next = new Set(current); next.has(row.id) ? next.delete(row.id) : next.add(row.id); return next; })} onManage={() => openAction(row)} />)}</div>
      </>}
      <div className="flex items-center justify-between"><p className="text-xs text-muted-foreground">Page {page} of {totalPages} · {governance.data?.pagination.total || 0} records</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft className="h-4 w-4" />Previous</Button><Button size="sm" variant="outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next<ChevronRight className="h-4 w-4" /></Button></div></div>

      <Dialog open={!!target || !!action} onOpenChange={open => { if (!open) closeDialog(); }}><DialogContent data-lenis-prevent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-lg"><DialogHeader><DialogTitle>{isBulk ? "Bulk governance action" : "Manage pandit governance"}</DialogTitle><DialogDescription>{isBulk ? `${selectedCount} selected record${selectedCount === 1 ? "" : "s"} will receive the same safe control.` : target?.name}</DialogDescription></DialogHeader><div className="space-y-4">
        <div><Label htmlFor="governance-action">Action</Label><Select value={action} onValueChange={setAction}><SelectTrigger id="governance-action"><SelectValue placeholder="Choose an action" /></SelectTrigger><SelectContent>{(isBulk ? bulkActions : ACTIONS).map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        {action === "index_mode" && <div><Label htmlFor="governance-value">Index mode</Label><Select value={value} onValueChange={setValue}><SelectTrigger id="governance-value"><SelectValue placeholder="Choose index mode" /></SelectTrigger><SelectContent><SelectItem value="index">Allow indexing</SelectItem><SelectItem value="noindex">Prevent indexing</SelectItem></SelectContent></Select></div>}
        {action === "contact_override" && <div><Label htmlFor="governance-value">Contact override</Label><Select value={value} onValueChange={setValue}><SelectTrigger id="governance-value"><SelectValue placeholder="Choose contact policy" /></SelectTrigger><SelectContent><SelectItem value="use_global">Use global policy</SelectItem><SelectItem value="always_open">Always open</SelectItem><SelectItem value="login_required">Login required</SelectItem><SelectItem value="never_display">Never display</SelectItem></SelectContent></Select></div>}
        {action === "canonical_location" && <div><Label htmlFor="governance-value">Canonical location</Label><Input id="governance-value" value={value} onChange={event => setValue(event.target.value)} placeholder="Canonical location identifier" /><p className="mt-1 text-xs text-muted-foreground">Use the approved canonical location identifier for this record.</p></div>}
        {action === "leave" && <div><Label htmlFor="governance-value">Leave status</Label><Select value={value} onValueChange={setValue}><SelectTrigger id="governance-value"><SelectValue placeholder="Choose leave status" /></SelectTrigger><SelectContent><SelectItem value="on_leave">On leave</SelectItem><SelectItem value="active">Active</SelectItem></SelectContent></Select></div>}
        {requiresReason && <div><Label htmlFor="governance-reason">Reason <span className="text-destructive">*</span></Label><Textarea id="governance-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder="Record the operational reason for this change" /><label className="mt-3 flex items-start gap-2 text-sm"><Checkbox checked={confirmed} onCheckedChange={checked => setConfirmed(checked === true)} />I confirm this governance action and its impact.</label></div>}
      </div><DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button disabled={!canSubmit} onClick={submitAction}>{(updateOne.isPending || updateBulk.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply action</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function GovernanceTableRow({ row, selected, onToggle, onManage }: { row: GovernanceRow; selected: boolean; onToggle: () => void; onManage: () => void }) {
  const score = typeof row.completeness === "number" ? row.completeness : row.completeness?.score ?? 0;
  const missing = (typeof row.completeness === "object" ? row.completeness?.missingFields : row.missingFields) || [];
  const directory = effectiveStatus(row.effective, "directory", row.publicationStatus);
  const search = effectiveStatus(row.effective, "search");
  const booking = effectiveStatus(row.effective, "booking");
  const index = effectiveStatus(row.effective, "index");
  return <tr className="border-t align-top"><td className="p-3"><Checkbox aria-label={`Select ${row.name}`} checked={selected} onCheckedChange={onToggle} /></td><td className="p-3"><p className="font-medium text-foreground">{row.name}</p><p className="mt-1 text-xs"><span className="font-semibold">{score}% complete</span>{missing.length ? ` · Missing: ${missing.join(", ")}` : " · No missing fields reported"}</p></td><td className="p-3"><EffectiveList entries={[["Directory", directory], ["Search", search], ["Booking", booking], ["Index", index]]} /></td><td className="p-3"><p className="flex items-center gap-1 text-xs"><MapPin className="h-3.5 w-3.5" />{locationLabel(row)}</p><p className="mt-1 text-xs">Publication: {readable(row.publicationStatus)}</p><p className="text-xs">Account: {readable(row.accountStatus ?? row.status)}</p><p className="mt-1 text-xs text-muted-foreground">Contact: {readable(row.contactOverride, "Use global")} · {row.contactRevealCount ?? row.revealCount ?? 0} reveals</p></td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={onManage}>Manage</Button></td></tr>;
}
function EffectiveList({ entries }: { entries: Array<[string, { value: string; reason: string }]> }) {
  return <div className="space-y-1 text-xs">{entries.map(([label, item]) => <div key={label}><span className="font-medium">{label}:</span> {item.value}<span className="text-muted-foreground"> · {item.reason}</span></div>)}</div>;
}
function GovernanceCard({ row, selected, onToggle, onManage }: { row: GovernanceRow; selected: boolean; onToggle: () => void; onManage: () => void }) {
  const score = typeof row.completeness === "number" ? row.completeness : row.completeness?.score ?? 0;
  const missing = (typeof row.completeness === "object" ? row.completeness?.missingFields : row.missingFields) || [];
  return <Card><CardContent className="p-4"><div className="flex items-start gap-3"><Checkbox aria-label={`Select ${row.name}`} checked={selected} onCheckedChange={onToggle} /><div className="min-w-0 flex-1"><div className="flex flex-wrap items-start justify-between gap-2"><div><p className="font-medium">{row.name}</p><p className="text-xs">{score}% complete{missing.length ? ` · Missing: ${missing.join(", ")}` : ""}</p></div><Button size="sm" variant="outline" onClick={onManage}>Manage</Button></div><div className="mt-3"><EffectiveList entries={[["Directory", effectiveStatus(row.effective, "directory", row.publicationStatus)], ["Search", effectiveStatus(row.effective, "search")], ["Booking", effectiveStatus(row.effective, "booking")], ["Index", effectiveStatus(row.effective, "index")]]} /></div><div className="mt-3 border-t pt-3 text-xs"><p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{locationLabel(row)}</p><p>Publication: {readable(row.publicationStatus)} · Account: {readable(row.accountStatus ?? row.status)}</p><p className="mt-1 text-muted-foreground">Contact: {readable(row.contactOverride, "Use global")} · {row.contactRevealCount ?? row.revealCount ?? 0} reveals</p></div></div></div></CardContent></Card>;
}