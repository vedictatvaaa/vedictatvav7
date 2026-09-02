import { useEffect, useState } from "react";
import { AlertTriangle, Download, FileSpreadsheet, Globe2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useCsvApply, useCsvPreview, useEnablement, usePublicPreview, usePublicState, usePublicStateMutation } from "./hooks";
import type { Entity } from "./types";

const base = "/api/admin/knowledge-graph/relationships/csv";
const download = async (url: string, fallback: string) => {
  const response = await fetch(url, { credentials: "include" });
  if (!response.ok) throw new Error((await response.text()) || "Download failed");
  const blob = await response.blob(), link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = fallback; link.click(); URL.revokeObjectURL(link.href);
  return response;
};
const downloadErrors = async (file: File) => {
  const form = new FormData(); form.append("file", file);
  const response = await fetch(`${base}/errors`, { method: "POST", credentials: "include", body: form });
  if (!response.ok) throw new Error((await response.text()) || "Error CSV download failed");
  const blob = await response.blob(), link = document.createElement("a");
  link.href = URL.createObjectURL(blob); link.download = "knowledge-graph-relationships-errors.csv"; link.click(); URL.revokeObjectURL(link.href);
};
export function PublishingControls() {
  const state = usePublicState(), report = useEnablement(), change = usePublicStateMutation();
  const [confirm, setConfirm] = useState<null | boolean>(null);
  const [status, setStatus] = useState("");
  const failure = change.error as (Error & { status?: number; report?: { canEnable: boolean; blockerCount: number; findings: { code: string; entityType?: string }[]; findingsTruncated: boolean } }) | null;
  const currentReport = failure?.status === 409 ? failure.report : report.data;
  if (state.isLoading) return <div className="h-44 animate-pulse rounded-xl bg-muted" />;
  if (state.isError) return <div className="rounded-xl border border-destructive/30 p-4 text-sm text-destructive">Publishing state is unavailable. <button className="underline" onClick={() => state.refetch()}>Try again</button></div>;
  return <section className="rounded-xl border border-border bg-card p-5"><div className="flex flex-col justify-between gap-5 md:flex-row md:items-start"><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary-foreground">Public projection</p><h2 className="mt-1 font-serif text-2xl text-primary">Publishing gate</h2><p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground">Related records appear publicly only when this gate is enabled and every readiness check passes.</p></div><div className={`rounded-full px-3 py-1 text-xs font-bold ${state.data?.isPublicEnabled ? "bg-secondary/20 text-primary" : "bg-muted text-muted-foreground"}`}>{state.data?.isPublicEnabled ? "Publicly enabled" : "Private"}</div></div>
    <p className="sr-only" aria-live="polite">{status}</p>
    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-4"><Button onClick={() => setConfirm(!state.data?.isPublicEnabled)} disabled={change.isPending}>{state.data?.isPublicEnabled ? "Disable public related content" : "Review and enable"}</Button><span className="text-xs text-muted-foreground">Generation {state.data?.generation} · updated {new Date(state.data?.updatedAt || "").toLocaleString()}</span></div>
    {!state.data?.isPublicEnabled && report.isError && <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive" role="alert">Readiness could not be checked. <Button size="sm" variant="outline" className="ml-2" onClick={() => { report.refetch(); setStatus("Readiness check requested."); }}>Try again</Button></div>}
    {!state.data?.isPublicEnabled && currentReport && <div className={`mt-4 rounded-lg border p-4 ${currentReport.canEnable ? "border-secondary/40 bg-accent/30" : "border-destructive/30 bg-destructive/5"}`}><div className="flex gap-3"><AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" /><div><p className="text-sm font-semibold">{currentReport.canEnable ? "Readiness check passed" : `${currentReport.blockerCount} publishing blocker${currentReport.blockerCount === 1 ? "" : "s"} found`}</p>{!currentReport.canEnable && <ul className="mt-2 space-y-1 text-xs text-muted-foreground">{currentReport.findings.map((finding, i) => <li key={`${finding.code}-${i}`}>{finding.code}{finding.entityType ? ` · ${finding.entityType}` : ""}</li>)}{currentReport.findingsTruncated && <li>Additional findings are not shown in this bounded report.</li>}</ul>}</div></div></div>}
    <Dialog open={confirm !== null} onOpenChange={open => !open && setConfirm(null)}><DialogContent><DialogHeader><DialogTitle>{confirm ? "Enable public related content?" : "Disable public related content?"}</DialogTitle><DialogDescription>{confirm ? "This publishes only projections that satisfy the governed readiness checks. This action cannot bypass blockers." : "Related content will stop rendering across public pages until it is enabled again."}</DialogDescription></DialogHeader>{failure && <p className="text-sm text-destructive" role="alert">{failure.message}</p>}<DialogFooter><Button variant="outline" onClick={() => setConfirm(null)}>Cancel</Button><Button onClick={() => confirm !== null && change.mutate(confirm, { onSuccess: () => { setConfirm(null); setStatus(confirm ? "Public related content enabled." : "Public related content disabled."); } })} disabled={change.isPending || (confirm === true && currentReport?.canEnable === false)}>{change.isPending ? "Updating…" : confirm ? "Enable publishing" : "Disable publishing"}</Button></DialogFooter></DialogContent></Dialog>
  </section>;
}
export function CsvWorkflow() {
  const preview = useCsvPreview(), apply = useCsvApply();
  const [file, setFile] = useState<File | null>(null), [error, setError] = useState<string | null>(null), [exportMore, setExportMore] = useState<{ hasMore: boolean; cursor: string | null } | null>(null);
  const [previewToken, setPreviewToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number | null>(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [applied, setApplied] = useState(false);
  const [status, setStatus] = useState("");
  useEffect(() => {
    if (!expiresAt) return;
    const tick = () => setSecondsLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    tick(); const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [expiresAt]);
  const doDownload = async (url: string, name: string) => { try { const response = await download(url, name); if (url.includes("/export")) setExportMore({ hasMore: response.headers.get("X-Export-Has-More") === "true", cursor: response.headers.get("X-Next-Cursor") }); } catch (e) { setError(e instanceof Error ? e.message : "Download failed"); } };
  const result = preview.data;
  return <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-start gap-3"><FileSpreadsheet className="mt-1 h-5 w-5 text-secondary-foreground" /><div><p className="text-[10px] font-bold uppercase tracking-[.18em] text-secondary-foreground">Governed relationship import</p><h2 className="mt-1 font-serif text-2xl text-primary">CSV workspace</h2><p className="mt-2 text-sm text-muted-foreground">Preview validates the uploaded file and returns an owner-bound token. Tokens remain only in this session.</p></div></div>
    <div className="mt-5 flex flex-wrap gap-2"><Button variant="outline" onClick={() => doDownload(`${base}/template`, "knowledge-graph-relationships-template.csv")}><Download className="mr-2 h-4 w-4" />Template</Button><Button variant="outline" onClick={() => doDownload(`${base}/export`, "knowledge-graph-relationships-export.csv")}><Download className="mr-2 h-4 w-4" />Export first file</Button>{exportMore?.hasMore && exportMore.cursor && <Button variant="outline" onClick={() => doDownload(`${base}/export?afterId=${encodeURIComponent(String(exportMore.cursor))}`, `knowledge-graph-relationships-export-after-${String(exportMore.cursor)}.csv`)}>Download next file</Button>}</div>
    {exportMore?.hasMore && <p className="mt-2 text-xs text-muted-foreground">This export is bounded. Download each continuation as its own file; files are not merged.</p>}
    <div className="mt-5 grid gap-3 border-t border-border pt-5 md:grid-cols-[1fr_auto]"><label className="text-sm font-semibold">Relationship CSV<Input className="mt-2" type="file" accept=".csv,text/csv" onChange={e => { preview.reset(); setFile(e.target.files?.[0] || null); setError(null); setPreviewToken(null); setExpiresAt(null); setApplied(false); setStatus(""); }} /></label><Button className="self-end" disabled={!file || preview.isPending} onClick={() => { if (file) preview.mutate(file, { onSuccess: data => { const token = data.previewToken; setPreviewToken(token); setExpiresAt(token ? Date.now() + data.expiresInSeconds * 1000 : null); setApplied(false); setStatus(token ? "CSV preview validated and ready to apply." : "CSV preview completed with validation findings."); }, onError: e => setError(e.message) }); }}><Upload className="mr-2 h-4 w-4" />{preview.isPending ? "Validating…" : "Preview file"}</Button></div>
    {error && <p className="mt-3 text-sm text-destructive" role="alert">{error}</p>}
    <p className="sr-only" aria-live="polite">{status}</p>
    {result && <div className="mt-5 rounded-lg bg-muted/50 p-4"><div className="flex flex-wrap justify-between gap-3"><p className="text-sm font-semibold">{result.counts.create} create · {result.counts.update} update · {result.counts.skip} skip · {result.counts.invalid} invalid</p>{result.errors?.length ? <Button size="sm" variant="outline" onClick={() => { if (file) downloadErrors(file).catch(e => setError(e.message)); }}>Download error CSV</Button> : null}</div><div className="mt-3 max-h-40 overflow-auto text-xs"><table className="w-full text-left"><tbody>{result.rows.slice(0, 30).map(row => <tr key={row.line} className="border-t border-border"><td className="py-1.5 pr-3">Line {row.line}</td><td className="py-1.5 pr-3">{row.action}</td><td className="py-1.5 text-destructive">{row.errors.join("; ")}</td><td className="py-1.5 text-muted-foreground">{row.warnings.join("; ")}</td></tr>)}</tbody></table></div>{previewToken && !applied && <div className="mt-4"><p className={`text-xs ${secondsLeft ? "text-muted-foreground" : "text-destructive"}`}>{secondsLeft ? `Preview expires in ${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, "0")}` : "Preview expired. Re-upload and preview this file."}</p><Button className="mt-2" disabled={apply.isPending || secondsLeft === 0} onClick={() => { const token = previewToken; if (!token || secondsLeft === 0) return; apply.mutate(token, { onSuccess: () => { setPreviewToken(null); setExpiresAt(null); setApplied(true); setStatus("CSV changes applied successfully."); }, onError: e => setError(e.message) }); }}>{apply.isPending ? "Applying…" : "Apply validated changes"}</Button></div>}{applied && <p className="mt-4 text-sm font-semibold text-primary">Validated CSV changes were applied. The preview token has been retired.</p>}</div>}
  </section>;
}
export function EntityPublicPreview({ entity }: { entity: Entity }) {
  const preview = usePublicPreview(entity);
  if (preview.isLoading) return <div className="h-28 animate-pulse rounded-xl bg-muted" />;
  if (preview.isError) return <div className="rounded-xl border border-border bg-muted/30 p-4 text-sm text-muted-foreground">Public preview is unavailable for this record.</div>;
  return <section className="rounded-xl border border-border bg-card p-5"><div className="flex items-center gap-2"><Globe2 className="h-4 w-4 text-secondary-foreground" /><h2 className="font-serif text-lg">Public related-content preview</h2></div>{preview.data?.groups.length ? <div className="mt-3 space-y-3">{preview.data.groups.map(group => <div key={group.relationshipType}><p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{group.label}</p><p className="mt-1 text-sm">{group.items.map(item => item.name).join(" · ")}</p></div>)}</div> : <p className="mt-3 text-sm text-muted-foreground">No publishable related content resolves for this record.</p>}</section>;
}