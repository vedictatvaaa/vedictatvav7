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

type BookingCheck = { passed: boolean; label: string; reason: string };
type GovernanceAction = "publish" | "unpublish" | "booking_enable" | "booking_disable" | "verify" | "revoke_verification" | "archive" | "restore" | "suspend" | "reactivate" | "start_leave" | "end_leave" | "set_indexing" | "set_contact_override" | "set_location";
type GovernanceRow = {
  id: number;
  name: string;
  slug?: string | null;
  image?: string | null; bio?: string | null; languages?: string | null; experience?: number;
  verified?: boolean; archived?: boolean; onLeave?: boolean; bookingEnabled?: boolean;
  completeness: { score: number; missing: string[]; checks: Record<string, boolean> };
  bookingDiagnostics: { checks: Record<string, BookingCheck>; result: BookingCheck; exclusions: string[] };
  currentLocation?: { id?: number; name?: string; city?: string; state?: string } | string | null;
  location?: { id?: number; name?: string; city?: string; state?: string } | string | null;
  publication: { published: boolean; directoryVisible: boolean; searchEligible: boolean };
  accountStatus?: string;
  contact: { override: string; hasPhone: boolean; hasWhatsapp: boolean; revealCount: number };
  services: Array<{ id: number; name: string; slug: string; mode: string; price: number; serviceAreas: string[] }>;
  reviews: { count: number; averageRating: number | null; latest: Array<{ rating: number; comment: string | null; createdAt: string }> };
  membership: { status: string; tier: string; membershipNo: string | null; registrationNo: string | null };
  seo: { indexingMode: string; effectiveIndexable: boolean; canonicalUrl: string };
  auditHistory: Array<{ action: string; createdAt: string; details: { reason?: string | null; batchId?: string | null } }>;
};
type GovernanceResponse = {
  items: GovernanceRow[];
  pagination: { page: number; pageSize: number; total: number; totalPages?: number };
  summary: Record<string, number>;
};

const PAGE_SIZE = 25;
const RISKY_ACTIONS = new Set<GovernanceAction>(["publish", "unpublish", "booking_enable", "booking_disable", "verify", "revoke_verification", "archive", "restore", "suspend", "reactivate"]);
const ACTIONS = [
  { value: "publish", label: "Publish storefront", bulk: true }, { value: "unpublish", label: "Unpublish storefront", bulk: true },
  { value: "booking_enable", label: "Enable booking", bulk: true }, { value: "booking_disable", label: "Disable booking", bulk: true },
  { value: "verify", label: "Verify account", bulk: true }, { value: "revoke_verification", label: "Revoke verification", bulk: true },
  { value: "archive", label: "Archive", bulk: true }, { value: "restore", label: "Restore", bulk: true },
  { value: "suspend", label: "Suspend account", bulk: false }, { value: "reactivate", label: "Reactivate account", bulk: false },
  { value: "start_leave", label: "Start leave", bulk: false }, { value: "end_leave", label: "End leave", bulk: false },
  { value: "set_indexing", label: "Set index mode", bulk: false }, { value: "set_contact_override", label: "Set contact override", bulk: false },
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
  const [bulkOpen, setBulkOpen] = useState(false);
  const [action, setAction] = useState<GovernanceAction | "">("");
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
    mutationFn: ({ id, action: nextAction, value: nextValue, reason: nextReason }: { id: number; action: GovernanceAction; value?: string; reason?: string }) =>
      apiRequest("PATCH", `/api/admin/pandit-governance/${id}`, { action: nextAction, ...(nextAction === "set_indexing" ? { indexingMode: nextValue } : {}), ...(nextAction === "set_contact_override" ? { contactAccessOverride: nextValue } : {}), ...(nextReason ? { reason: nextReason, confirmed: true } : {}) }, { "x-admin-token": adminToken || "" }),
    onSuccess: () => { refresh(); closeDialog(); toast({ title: "Governance update saved" }); },
    onError: (error: Error) => toast({ title: "Governance update failed", description: error.message, variant: "destructive" }),
  });
  const updateBulk = useMutation({
    mutationFn: ({ ids, action: nextAction, reason: nextReason }: { ids: number[]; action: GovernanceAction; reason: string }) =>
      apiRequest("POST", "/api/admin/pandit-governance/bulk", { ids, action: nextAction, reason: nextReason, confirmed: true }, { "x-admin-token": adminToken || "" }),
    onSuccess: (data: any, variables) => { refresh(); setSelected(new Set()); closeDialog(); toast({ title: `Updated ${Number(data?.updated ?? variables.ids.length)} pandit${variables.ids.length === 1 ? "" : "s"}` }); },
    onError: (error: Error) => toast({ title: "Bulk update failed", description: error.message, variant: "destructive" }),
  });
  const closeDialog = () => { setTarget(null); setBulkOpen(false); setAction(""); setValue(""); setReason(""); setConfirmed(false); };
  const openAction = (row: GovernanceRow | null, nextAction: GovernanceAction | "" = "") => { setTarget(row); setBulkOpen(row === null); setAction(nextAction); setValue(""); setReason(""); setConfirmed(false); };
  const isBulk = bulkOpen;
  const requiresReason = action !== "" && RISKY_ACTIONS.has(action);
  const requiresValue = action === "set_indexing" || action === "set_contact_override";
  const canSubmit = !!action && (!requiresReason || reason.trim().length > 0) && (!requiresValue || value) && (!requiresReason || confirmed) && (!isBulk || selectedCount > 0) && !updateOne.isPending && !updateBulk.isPending;
  const submitAction = () => {
    if (!canSubmit) return;
    if (target) updateOne.mutate({ id: target.id, action, value, reason: reason.trim() || undefined });
    else updateBulk.mutate({ ids: selectedRows.map(row => row.id), action: action as GovernanceAction, reason: reason.trim() });
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
          <Select value={status} onValueChange={next => setFilter(setStatus, next)}><SelectTrigger aria-label="Filter by status"><SelectValue placeholder="All statuses" /></SelectTrigger><SelectContent><SelectItem value="all">All statuses</SelectItem><SelectItem value="complete">Complete</SelectItem><SelectItem value="incomplete">Incomplete</SelectItem><SelectItem value="published">Published</SelectItem><SelectItem value="unpublished">Unpublished</SelectItem><SelectItem value="verified">Verified</SelectItem><SelectItem value="unverified">Unverified</SelectItem><SelectItem value="booking_eligible">Booking eligible</SelectItem><SelectItem value="booking_ineligible">Booking ineligible</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent></Select>
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

      <Dialog open={!!target || bulkOpen} onOpenChange={open => { if (!open) closeDialog(); }}><DialogContent data-lenis-prevent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-2xl"><DialogHeader><DialogTitle>{isBulk ? "Bulk governance action" : "Manage pandit governance"}</DialogTitle><DialogDescription>{isBulk ? `${selectedCount} selected record${selectedCount === 1 ? "" : "s"} will receive the same atomic control. If any record fails, none are changed.` : target?.name}</DialogDescription></DialogHeader><div className="space-y-4">
        {target && <GovernanceDetail row={target} />}
        <div><Label htmlFor="governance-action">Action</Label><Select value={action} onValueChange={next => setAction(next as GovernanceAction)}><SelectTrigger id="governance-action"><SelectValue placeholder="Choose an action" /></SelectTrigger><SelectContent>{(isBulk ? bulkActions : ACTIONS).map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
        {action === "set_indexing" && <div><Label htmlFor="governance-value">Index mode</Label><Select value={value} onValueChange={setValue}><SelectTrigger id="governance-value"><SelectValue placeholder="Choose index mode" /></SelectTrigger><SelectContent><SelectItem value="auto">Allow indexing</SelectItem><SelectItem value="noindex">Prevent indexing</SelectItem></SelectContent></Select></div>}
        {action === "set_contact_override" && <div><Label htmlFor="governance-value">Contact override</Label><Select value={value} onValueChange={setValue}><SelectTrigger id="governance-value"><SelectValue placeholder="Choose contact policy" /></SelectTrigger><SelectContent><SelectItem value="use_global">Use global policy</SelectItem><SelectItem value="always_open">Always open</SelectItem><SelectItem value="login_required">Login required</SelectItem><SelectItem value="never_display">Never display</SelectItem></SelectContent></Select></div>}
        {requiresReason && <div><Label htmlFor="governance-reason">Reason <span className="text-destructive">*</span></Label><Textarea id="governance-reason" value={reason} onChange={event => setReason(event.target.value)} placeholder="Record the operational reason for this change" /><label className="mt-3 flex items-start gap-2 text-sm"><Checkbox checked={confirmed} onCheckedChange={checked => setConfirmed(checked === true)} />I confirm this governance action and its impact.</label></div>}
      </div><DialogFooter><Button variant="outline" onClick={closeDialog}>Cancel</Button><Button disabled={!canSubmit} onClick={submitAction}>{(updateOne.isPending || updateBulk.isPending) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Apply action</Button></DialogFooter></DialogContent></Dialog>
    </div>
  );
}

function GovernanceTableRow({ row, selected, onToggle, onManage }: { row: GovernanceRow; selected: boolean; onToggle: () => void; onManage: () => void }) {
  return <tr className="border-t align-top"><td className="p-3"><Checkbox aria-label={`Select ${row.name}`} checked={selected} onCheckedChange={onToggle} /></td><td className="p-3"><p className="font-medium">{row.name}</p><p className="text-xs">{row.completeness.score}% complete · {row.completeness.missing.join(", ") || "complete"}</p></td><td className="p-3 text-xs"><Badge>{row.publication.published ? "Published" : "Unpublished"}</Badge> <Badge variant="outline">{row.bookingDiagnostics.result.passed ? "Booking eligible" : "Booking blocked"}</Badge><p className="mt-1">Directory {row.publication.directoryVisible ? "on" : "off"} · Search {row.publication.searchEligible ? "on" : "off"}</p></td><td className="p-3 text-xs"><p className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{locationLabel(row)}</p><p>{readable(row.accountStatus)}{row.archived ? " · archived" : ""}</p><p className="text-muted-foreground">Contact configured: {row.contact.hasPhone || row.contact.hasWhatsapp ? "yes" : "no"} · {row.contact.revealCount} reveals</p></td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={onManage}>Manage</Button></td></tr>;
}
function GovernanceCard({ row, selected, onToggle, onManage }: { row: GovernanceRow; selected: boolean; onToggle: () => void; onManage: () => void }) {
  return <Card><CardContent className="p-4"><div className="flex items-start gap-3"><Checkbox aria-label={`Select ${row.name}`} checked={selected} onCheckedChange={onToggle} /><div className="min-w-0 flex-1"><div className="flex justify-between gap-2"><div><p className="font-medium">{row.name}</p><p className="text-xs">{row.completeness.score}% complete · {row.bookingDiagnostics.result.passed ? "booking eligible" : "booking blocked"}</p></div><Button size="sm" variant="outline" onClick={onManage}>Manage</Button></div><p className="mt-3 text-xs"><MapPin className="mr-1 inline h-3.5 w-3.5" />{locationLabel(row)} · {row.publication.published ? "Published" : "Unpublished"}</p></div></div></CardContent></Card>;
}
function GovernanceDetail({ row }: { row: GovernanceRow }) {
  const checks = Object.entries(row.bookingDiagnostics.checks);
  const Section = ({ title, children }: { title: string; children: React.ReactNode }) =>
    <section className="rounded-md border bg-background p-3"><h3 className="mb-1 font-semibold text-foreground">{title}</h3>{children}</section>;
  return <div className="grid gap-2 text-xs sm:grid-cols-2">
    <Section title="1. Profile"><p>{row.name} · {row.bio ? "bio present" : "bio missing"} · {row.languages || "languages missing"} · {row.experience || 0} years</p><p><MapPin className="mr-1 inline h-3.5 w-3.5" />{locationLabel(row)}</p></Section>
    <Section title="2. Publication status"><StatusLine passed={row.publication.published} yes="Storefront published" no="Storefront unpublished" /></Section>
    <Section title="3. Directory visibility"><StatusLine passed={row.publication.directoryVisible} yes="Directory visible" no="Directory hidden" /><p>Search eligibility: {row.publication.searchEligible ? "enabled" : "disabled"}</p></Section>
    <Section title="4. Verification status"><StatusLine passed={!!row.verified} yes="Verified" no="Unverified" /><p>Completeness never changes verification automatically.</p></Section>
    <section className="rounded-md border bg-background p-3 sm:col-span-2"><h3 className="mb-1 font-semibold text-foreground">5. Booking eligibility</h3>{checks.map(([key, check]) => <p key={key} className={check.passed ? "" : "text-destructive"}>{check.label}: {check.passed ? "PASS" : "FAIL"} — {check.reason}</p>)}<p className={row.bookingDiagnostics.result.passed ? "mt-1 font-semibold" : "mt-1 font-semibold text-destructive"}>RESULT: {row.bookingDiagnostics.result.passed ? "ELIGIBLE" : "NOT ELIGIBLE"} — {row.bookingDiagnostics.result.reason}</p></section>
    <Section title="6. Services"><p className="text-muted-foreground">Pandit assignments to active master-catalogue services; this does not modify the master Puja catalogue.</p>{row.services.length ? row.services.map(service => <p key={service.id}>{service.name} · {service.mode} · ₹{service.price}</p>) : <p>No active approved master-service assignment.</p>}</Section>
    <Section title="7. Service areas">{row.services.length ? row.services.map(service => <p key={service.id}>{service.name}: {service.serviceAreas.join(", ") || (["online", "virtual", "hybrid", "both"].includes(service.mode) ? "online/virtual coverage" : "not configured")}</p>) : <p>No service coverage configured.</p>}</Section>
    <Section title="8. Contact / privacy"><p>Policy override: {readable(row.contact.override)}</p><p>Phone configured: {row.contact.hasPhone ? "yes" : "no"} · WhatsApp configured: {row.contact.hasWhatsapp ? "yes" : "no"}</p></Section>
    <Section title="9. Membership status"><p>{readable(row.membership.status)} · tier {readable(row.membership.tier)}</p><p>Membership no: {row.membership.membershipNo || "not assigned"} · registration: {row.membership.registrationNo || "not assigned"}</p></Section>
    <Section title="10. Profile completeness"><p className="font-semibold">{row.completeness.score}% complete</p><p>Missing: {row.completeness.missing.join(", ") || "none"}</p></Section>
    <Section title="11. Reviews"><p>{row.reviews.averageRating ?? "New"} · {row.reviews.count} genuine review{row.reviews.count === 1 ? "" : "s"}</p>{row.reviews.latest.map((review, i) => <p key={i}>★{review.rating}: {review.comment || "No comment"}</p>)}</Section>
    <Section title="12. SEO / indexing status"><StatusLine passed={row.seo.effectiveIndexable} yes="Indexable" no="Not indexable" /><p>Mode: {readable(row.seo.indexingMode)}</p></Section>
    <Section title="13. Slug / current URL"><p className="break-all">Slug: {row.slug || "not assigned"}</p><p className="break-all">{row.seo.canonicalUrl || "No canonical URL"}</p></Section>
    <Section title="14. Contact reveal usage"><p>{row.contact.revealCount} unique customer reveal record{row.contact.revealCount === 1 ? "" : "s"}. Customer identities and contact values are not shown.</p></Section>
    <section className="rounded-md border bg-background p-3 sm:col-span-2"><h3 className="mb-1 font-semibold text-foreground">15. Audit history</h3>{row.auditHistory.length ? row.auditHistory.map((audit, i) => <p key={i}>{readable(audit.action)} · {audit.details?.reason || "No reason recorded"}</p>) : <p>No governance events.</p>}</section>
  </div>;
}

function StatusLine({ passed, yes, no }: { passed: boolean; yes: string; no: string }) {
  return <p className={passed ? "text-emerald-700" : "text-destructive"}>{passed ? <CheckCircle2 className="mr-1 inline h-3.5 w-3.5" /> : <AlertTriangle className="mr-1 inline h-3.5 w-3.5" />}{passed ? yes : no}</p>;
}