import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, Check, FileSearch, Loader2, RefreshCw, Sparkles, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { createFetcher } from "../admin-shared";

type Finding = {
  fieldKey: string;
  state: "missing" | "proposal" | "blocked";
  proposalClass: "deterministic" | "ai_draft" | "unknown";
  currentValue: unknown;
  sourcePaths: string[];
  reason: string;
  proposal?: {
    fieldKey: string;
    proposalClass: "deterministic" | "ai_draft";
    safeBatch: boolean;
    before: unknown;
    proposed: unknown;
    sourcePaths: string[];
    confidence: number;
    reason: string;
    generationKey?: string;
  };
};
type DryRunRow = {
  panditId: number;
  name: string;
  city: string | null;
  state: string | null;
  visibility: { archived: boolean; directory: boolean; search: boolean; booking: boolean; indexingMode: string | null };
  sourceSnapshot: Record<string, unknown>;
  sourceSnapshotHash: string;
  missingFields: string[];
  findings: Finding[];
};
type Review = {
  id: number;
  panditId: number;
  fieldKey: string;
  proposalClass: "deterministic" | "ai_draft";
  status: string;
  safeBatch: boolean;
  sourceSnapshotHash: string;
  proposed: unknown;
  sourcePaths: string[];
  pandit: { name: string; city: string | null; state: string | null; archived: boolean; directoryVisible: boolean; searchEligible: boolean; bookingEnabled: boolean };
};

export default function PanditProfileCompletionTab() {
  const token = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(token);
  const qc = useQueryClient();
  const [includeAi, setIncludeAi] = useState(false);
  const [running, setRunning] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [run, setRun] = useState<{ batchId: string; scanned: number; incomplete: number; summary: Record<string, number>; results: DryRunRow[]; aiError?: string | null } | null>(null);

  const reviews = useQuery<{ items: Review[] }>({
    queryKey: ["/api/admin/pandit-profile-completion/reviews", "pending"],
    queryFn: () => fetcher("/api/admin/pandit-profile-completion/reviews?status=pending&limit=200"),
  });

  const proposalCount = useMemo(() => run?.results.reduce((count, row) => count + row.findings.filter((finding) => finding.proposal).length, 0) || 0, [run]);

  const runDry = async () => {
    setRunning(true);
    setError("");
    try {
      const response = await fetch("/api/admin/pandit-profile-completion/dry-run", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
        body: JSON.stringify({ includeAi }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Dry-run failed");
      setRun(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Dry-run failed");
    } finally {
      setRunning(false);
    }
  };

  const saveReview = async () => {
    if (!run || proposalCount === 0) return;
    setSaving(true);
    setError("");
    try {
      const proposals = run.results.flatMap((row) => row.findings.filter((finding) => finding.proposal).map((finding) => ({
        panditId: row.panditId,
        fieldKey: finding.proposal!.fieldKey,
        proposalClass: finding.proposal!.proposalClass,
        safeBatch: finding.proposal!.safeBatch,
        before: finding.proposal!.before,
        proposed: finding.proposal!.proposed,
        sourceSnapshot: row.sourceSnapshot,
        sourceSnapshotHash: row.sourceSnapshotHash,
        sourcePaths: finding.proposal!.sourcePaths,
        confidence: finding.proposal!.confidence,
        reason: finding.proposal!.reason,
        generationKey: finding.proposal!.generationKey,
      })));
      const response = await fetch("/api/admin/pandit-profile-completion/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
        body: JSON.stringify({ batchId: run.batchId, confirmed: true, reason: "Admin saved the reviewed legacy profile dry-run", proposals }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Unable to save review");
      await qc.invalidateQueries({ queryKey: ["/api/admin/pandit-profile-completion/reviews", "pending"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to save review");
    } finally {
      setSaving(false);
    }
  };

  const reviewAction = async (review: Review, action: "approve" | "reject") => {
    const reason = window.prompt(`${action === "approve" ? "Approval" : "Rejection"} reason`, action === "approve" ? "Admin approved after source review" : "Admin rejected after source review");
    if (!reason?.trim()) return;
    setError("");
    try {
      const response = await fetch(`/api/admin/pandit-profile-completion/proposals/${review.id}/${action}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
        body: JSON.stringify({ reason, expectedSourceSnapshotHash: review.sourceSnapshotHash }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Unable to ${action} proposal`);
      await qc.invalidateQueries({ queryKey: ["/api/admin/pandit-profile-completion/reviews", "pending"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to ${action} proposal`);
    }
  };

  const applyApproved = async () => {
    const rows = await fetcher("/api/admin/pandit-profile-completion/reviews?status=approved&limit=200") as { items: Review[] };
    if (!rows.items.length) return;
    const reason = window.prompt("Reason for applying approved profile changes", "Admin applied reviewed profile completion changes");
    if (!reason?.trim()) return;
    const response = await fetch("/api/admin/pandit-profile-completion/apply", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { "x-admin-token": token } : {}) },
      body: JSON.stringify({ proposalIds: rows.items.map((row) => row.id), confirmed: true, reason }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) setError(data.message || "Unable to apply approved changes");
    await qc.invalidateQueries({ queryKey: ["/api/admin/pandit-profile-completion/reviews", "pending"] });
  };

  return (
    <div className="space-y-6" data-testid="pandit-profile-completion">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-secondary-foreground/70">Profile governance</p>
          <h1 className="mt-1 text-3xl text-primary">Legacy Pandit profile completion</h1>
          <p className="mt-1 max-w-3xl text-sm text-muted-foreground">Review supplied facts without inventing missing qualifications, services, locations, or availability. Approval never publishes a hidden profile and booking remains independently gated.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
            <Checkbox checked={includeAi} onCheckedChange={(checked) => setIncludeAi(checked === true)} />
            <Sparkles className="h-4 w-4" /> Include cited AI drafts
          </label>
          <Button onClick={runDry} disabled={running}>{running ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileSearch className="mr-2 h-4 w-4" />}Run dry-run</Button>
          <Button variant="outline" onClick={applyApproved}>Apply approved</Button>
        </div>
      </div>
      {error && <div role="alert" className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</div>}
      {run && <Card><CardHeader><CardTitle className="flex flex-wrap items-center gap-2 text-base">Dry-run results <Badge variant="outline">{run.scanned} scanned</Badge><Badge variant="outline">{run.incomplete} incomplete</Badge><Badge variant="secondary">{proposalCount} proposals</Badge></CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-3 sm:grid-cols-4">{Object.entries(run.summary).map(([key, value]) => <div key={key} className="rounded-md border bg-muted/20 p-3"><p className="text-xs uppercase text-muted-foreground">{key}</p><p className="mt-1 text-xl font-semibold">{value}</p></div>)}</div>{run.aiError && <p className="text-sm text-amber-800">AI drafts were not created: {run.aiError}. Deterministic findings and unknown fields remain available.</p>}<Button variant="secondary" onClick={saveReview} disabled={saving || proposalCount === 0}>{saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}Save proposals for review</Button></CardContent></Card>}
      {run?.results.map((row) => <Card key={row.panditId}><CardHeader><CardTitle className="flex flex-wrap items-center gap-2 text-base">{row.name}<span className="text-sm font-normal text-muted-foreground">{[row.city, row.state].filter(Boolean).join(", ") || "Location not supplied"}</span><Badge variant={row.visibility.archived ? "destructive" : "outline"}>{row.visibility.archived ? "Archived" : row.visibility.directory ? "Directory switch on" : "Directory switch off"}</Badge></CardTitle></CardHeader><CardContent className="space-y-3"><p className="text-xs text-muted-foreground">Missing: {row.missingFields.join(", ") || "No missing source field; review proposals below."}</p>{row.findings.map((finding) => <div key={finding.fieldKey} className="rounded-md border p-3"><div className="flex flex-wrap items-center gap-2"><span className="font-medium">{finding.fieldKey}</span><Badge variant={finding.proposal ? "secondary" : finding.state === "blocked" ? "destructive" : "outline"}>{finding.proposal ? finding.proposal.proposalClass : finding.proposalClass}</Badge>{finding.proposal?.safeBatch && <Badge variant="outline">Safe batch</Badge>}</div><p className="mt-1 text-sm text-muted-foreground">{finding.reason}</p>{finding.proposal && <p className="mt-2 break-words rounded bg-muted/30 p-2 text-sm">{String(finding.proposal.proposed)}</p>}{finding.sourcePaths.length > 0 && <p className="mt-2 text-xs text-muted-foreground">Sources: {finding.sourcePaths.join(", ")}</p>}</div>)}</CardContent></Card>)}
      <Card><CardHeader><CardTitle className="flex items-center justify-between text-base">Pending saved proposals <Button size="sm" variant="ghost" onClick={() => reviews.refetch()}><RefreshCw className="h-4 w-4" /></Button></CardTitle></CardHeader><CardContent className="space-y-3">{reviews.isLoading ? <p className="text-sm text-muted-foreground">Loading review queue…</p> : (reviews.data?.items || []).length === 0 ? <p className="text-sm text-muted-foreground">No pending proposals.</p> : reviews.data!.items.map((review) => <div key={review.id} className="flex flex-col gap-3 rounded-md border p-3 md:flex-row md:items-center md:justify-between"><div><p className="font-medium">{review.pandit.name} · {review.fieldKey}</p><p className="text-sm text-muted-foreground">{String(review.proposed)} · {review.proposalClass} · sources: {review.sourcePaths.join(", ") || "none"}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => reviewAction(review, "reject")}><X className="mr-1 h-4 w-4" />Reject</Button><Button size="sm" onClick={() => reviewAction(review, "approve")}><Check className="mr-1 h-4 w-4" />Approve</Button></div></div>)}</CardContent></Card>
      <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />Unknown findings require real source facts. This workflow does not fabricate values, enable booking, publish storefronts, or expose archived profiles.</div>
    </div>
  );
}