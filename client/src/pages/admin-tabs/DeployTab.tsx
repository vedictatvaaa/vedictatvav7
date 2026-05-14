import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Rocket, RefreshCw, CheckCircle2, XCircle, Loader2, AlertTriangle, History, Undo2, GitCommit } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

type DeployStatus = "idle" | "running" | "success" | "failed" | "disabled";
type DeployKind = "deploy" | "rollback";

interface DeployState {
  enabled?: boolean;
  status: DeployStatus;
  id: string | null;
  kind?: DeployKind;
  startedAt?: number;
  finishedAt?: number;
  exitCode?: number | null;
  triggeredBy?: number;
  commitBefore?: string | null;
  commitAfter?: string | null;
  commitMessage?: string | null;
  targetSha?: string | null;
  currentCommit?: string | null;
  currentCommitMessage?: string | null;
  lines: string[];
  reason?: string;
}

interface HistoryEntry {
  id: string;
  kind: DeployKind;
  status: DeployStatus;
  startedAt: number;
  finishedAt?: number;
  exitCode?: number | null;
  commitBefore?: string | null;
  commitAfter?: string | null;
  commitMessage?: string | null;
  targetSha?: string | null;
}

interface HistoryResponse {
  entries: HistoryEntry[];
  enabled: boolean;
}

interface Stage {
  key: string;
  label: string;
  match: RegExp;
}

// Pipeline derived from scripts/deploy.sh + scripts/rollback.sh. Each stage
// advances the progress bar by an equal slice of the WORKING stages (i.e.
// excluding the terminal "done" marker). The "done" marker only fires when
// the run truly finished, in which case we render 100% (success) or the
// last-reached working stage (failed). This avoids the "always 100%" bug
// where the wrapper's "[deploy] finished" line counted as a stage on its own.
const STAGES: Stage[] = [
  { key: "start",   label: "Starting",        match: /\[deploy\] starting/i },
  { key: "pull",    label: "Pulling code",    match: /Pulling latest code|Skipping git pull|Resumed after self-update|Resetting working tree/i },
  { key: "install", label: "Installing deps", match: /Installing dependencies/i },
  { key: "build",   label: "Building bundle", match: /Building production bundle/i },
  { key: "db",      label: "Syncing schema",  match: /Syncing database schema|Schema sync complete|Skipping db:push|db:push exited|db:push intentionally skipped/i },
  { key: "restart", label: "Restarting PM2",  match: /Restarting PM2 process/i },
  { key: "verify",  label: "Verifying live",  match: /Sanity check: production assets/i },
];
const DONE_RE = /\[deploy\] finished with exit code/i;

const ERROR_PATTERNS: RegExp[] = [
  /^!!\s/,
  /\bERROR\b/,
  /\bERR!\b/,
  /\bFATAL\b/i,
  /\bfailed\b/i,
  /Error:/,
  /Cannot find module/i,
  /ENOENT|EACCES|EADDRINUSE|ECONNREFUSED/,
  /spawn error:/i,
  /finished with exit code (?!0)/,
];
const ERROR_IGNORE: RegExp[] = [
  /npm warn deprecated/i,
  /^\s*npm notice/i,
  /\bdeprecation\b/i,
];

function statusBadge(status: DeployStatus, kind?: DeployKind) {
  const prefix = kind === "rollback" ? "Rollback " : "";
  if (status === "running") return <Badge className="bg-amber-100 text-amber-900">{prefix}Running</Badge>;
  if (status === "success") return <Badge className="bg-emerald-100 text-emerald-900">{prefix}Success</Badge>;
  if (status === "failed") return <Badge className="bg-red-100 text-red-900">{prefix}Failed</Badge>;
  if (status === "disabled") return <Badge variant="secondary">Disabled</Badge>;
  return <Badge variant="secondary">Idle</Badge>;
}

function shortSha(sha?: string | null) {
  if (!sha) return "—";
  return sha.slice(0, 7);
}

/**
 * Compute progress percentage and current stage label.
 * Key invariants:
 *   - While running: cap at 95% so the bar visibly moves and never lies
 *     about being "done" before the script actually finishes.
 *   - On success: 100%.
 *   - On failed: % reflects the highest WORKING stage actually reached.
 */
function deriveProgress(lines: string[], status: DeployStatus): { pct: number; current: string } {
  if (status === "idle") return { pct: 0, current: "Idle" };

  // Find the highest WORKING stage reached.
  let highest = -1;
  for (const ln of lines) {
    for (let i = STAGES.length - 1; i > highest; i--) {
      if (STAGES[i].match.test(ln)) { highest = i; break; }
    }
  }
  const sawDone = lines.some((ln) => DONE_RE.test(ln));

  if (status === "success") return { pct: 100, current: "Finished" };
  if (status === "failed") {
    const idx = Math.max(0, highest);
    const pct = Math.round(((idx + 1) / STAGES.length) * 95);
    return { pct, current: `Failed at: ${STAGES[idx].label}` };
  }

  // Running: cap at 95% until the wrapper actually exits.
  const reachedCount = highest + 1;
  let pct = Math.round((reachedCount / STAGES.length) * 95);
  if (sawDone) pct = 95; // log says done but state hasn't reconciled yet
  if (reachedCount === 0) pct = 5; // show some movement immediately
  const current = highest >= 0 ? STAGES[highest].label : "Starting";
  return { pct, current };
}

function extractErrors(lines: string[]): { idx: number; line: string }[] {
  const out: { idx: number; line: string }[] = [];
  lines.forEach((line, idx) => {
    if (ERROR_IGNORE.some((r) => r.test(line))) return;
    if (ERROR_PATTERNS.some((r) => r.test(line))) {
      out.push({ idx, line });
    }
  });
  return out;
}

function formatDuration(ms: number) {
  const s = Math.max(0, Math.round(ms / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  const rem = s % 60;
  return `${m}m ${rem}s`;
}

export default function DeployTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const [triggering, setTriggering] = useState(false);
  const [skipGitPull, setSkipGitPull] = useState(false);
  const [rollingBack, setRollingBack] = useState<string | null>(null);
  const logRef = useRef<HTMLPreElement | null>(null);

  const { data, refetch } = useQuery<DeployState>({
    queryKey: ["/api/admin/deploy/status"],
    queryFn: () => fetcher("/api/admin/deploy/status"),
    refetchInterval: (q) => {
      const s = q.state.data?.status;
      return s === "running" ? 2000 : 10000;
    },
  });

  const { data: history, refetch: refetchHistory } = useQuery<HistoryResponse>({
    queryKey: ["/api/admin/deploy/history"],
    queryFn: () => fetcher("/api/admin/deploy/history"),
    refetchInterval: (q) => {
      const s = data?.status;
      return s === "running" ? 5000 : 30000;
    },
  });

  useEffect(() => {
    const el = logRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [data?.lines?.length]);

  // Live elapsed counter while running
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (data?.status !== "running") return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [data?.status]);

  const trigger = async () => {
    const msg = skipGitPull
      ? "Run a production deploy from the CURRENT working tree on the VPS? This will skip git pull, rebuild, and restart the app."
      : "Run a production deploy now? This will pull from GitHub, rebuild, and restart the app.";
    if (!confirm(msg)) return;
    setTriggering(true);
    try {
      const res = await fetch("/api/admin/deploy", {
        method: "POST",
        headers: { "x-admin-token": adminToken, "Content-Type": "application/json" },
        body: JSON.stringify({ skipGitPull }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Deploy failed to start", description: json.message || "Unknown error", variant: "destructive" });
      } else {
        toast({ title: "Deploy started", description: `Run ID: ${json.id}` });
        refetch();
        refetchHistory();
      }
    } catch (err: any) {
      toast({ title: "Network error", description: err?.message || "Could not reach server", variant: "destructive" });
    } finally {
      setTriggering(false);
    }
  };

  const triggerRollback = async (entry: HistoryEntry) => {
    const sha = entry.commitAfter || entry.targetSha;
    if (!sha) {
      toast({ title: "No commit recorded", description: "This run has no SHA to roll back to.", variant: "destructive" });
      return;
    }
    const summary = entry.commitMessage ? ` — "${entry.commitMessage}"` : "";
    const ok = confirm(
      `Roll the live site back to commit ${shortSha(sha)}${summary}?\n\n` +
      `The current version will be saved as a safety ref. If the rolled-back build fails to start, the site will be restored automatically.`
    );
    if (!ok) return;
    setRollingBack(entry.id);
    try {
      const res = await fetch("/api/admin/deploy/rollback", {
        method: "POST",
        headers: { "x-admin-token": adminToken, "Content-Type": "application/json" },
        body: JSON.stringify({ targetSha: sha }),
      });
      const json = await res.json();
      if (!res.ok) {
        toast({ title: "Rollback failed to start", description: json.message || "Unknown error", variant: "destructive" });
      } else {
        toast({ title: "Rollback started", description: `Restoring ${shortSha(sha)} (run ${json.id})` });
        refetch();
        refetchHistory();
      }
    } catch (err: any) {
      toast({ title: "Network error", description: err?.message || "Could not reach server", variant: "destructive" });
    } finally {
      setRollingBack(null);
    }
  };

  const status: DeployStatus = data?.enabled === false ? "disabled" : (data?.status || "idle");
  const running = status === "running";
  const elapsedMs = data?.startedAt
    ? (running ? now : (data.finishedAt || Date.now())) - data.startedAt
    : 0;

  const lines = data?.lines || [];
  const { pct, current } = useMemo(() => deriveProgress(lines, status), [lines, status]);
  const errors = useMemo(() => extractErrors(lines), [lines]);
  const historyEntries = history?.entries || [];

  return (
    <div className="space-y-4" data-testid="tab-deploy">
      <Card>
        <CardHeader>
          <div className="flex flex-row items-start justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Rocket className="w-5 h-5" />
                One-click Deploy
              </CardTitle>
              <CardDescription>
                Pulls the latest code from GitHub, runs <code className="text-xs">db:push</code>, rebuilds the production bundle, and reloads PM2.
              </CardDescription>
            </div>
            <div className="flex flex-row items-center gap-3 flex-wrap">
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none" title="Build from the files currently on the VPS instead of pulling from GitHub.">
                <input
                  type="checkbox"
                  checked={skipGitPull}
                  onChange={(e) => setSkipGitPull(e.target.checked)}
                  disabled={running || triggering || status === "disabled"}
                  data-testid="checkbox-skip-git-pull"
                />
                Skip git pull
              </label>
              {statusBadge(status, data?.kind)}
              <Button
                size="sm"
                variant="outline"
                onClick={() => { refetch(); refetchHistory(); }}
                data-testid="button-deploy-refresh"
              >
                <RefreshCw className="w-4 h-4 mr-1" />
                Refresh
              </Button>
              <Button
                size="default"
                onClick={trigger}
                disabled={running || triggering || status === "disabled"}
                data-testid="button-deploy-now"
              >
                {triggering || running ? (
                  <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                ) : (
                  <Rocket className="w-4 h-4 mr-1" />
                )}
                {running ? (data?.kind === "rollback" ? "Rolling back…" : "Deploying…") : skipGitPull ? "Deploy (no pull)" : "Deploy now"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {status === "disabled" && (
            <div className="rounded-md border border-amber-200 bg-amber-50 dark:bg-amber-950 dark:border-amber-900 p-3 text-sm">
              <div className="font-medium mb-1">Browser deploys are disabled</div>
              <div className="text-muted-foreground">
                {data?.reason || "Set the environment variable DEPLOY_FROM_BROWSER=1 on the production server (in your .env or PM2 env), then restart PM2 once."}
              </div>
            </div>
          )}

          {/* Currently-live commit indicator */}
          {data?.currentCommit && (
            <div className="flex items-center gap-2 rounded-md border bg-muted/40 px-3 py-2 text-xs flex-wrap" data-testid="current-commit">
              <GitCommit className="w-3.5 h-3.5 text-muted-foreground" />
              <span className="text-muted-foreground">Live version:</span>
              <code className="font-mono font-semibold" data-testid="text-current-sha">{shortSha(data.currentCommit)}</code>
              {data.currentCommitMessage && (
                <span className="text-muted-foreground truncate max-w-[60ch]">— {data.currentCommitMessage}</span>
              )}
            </div>
          )}

          {/* Progress bar with stage chips */}
          <div className="space-y-2" data-testid="deploy-progress">
            <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
              <div className="flex items-center gap-2">
                {running && <Loader2 className="w-4 h-4 animate-spin text-amber-700" />}
                {status === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                {status === "failed" && <XCircle className="w-4 h-4 text-red-700" />}
                <span className="font-medium" data-testid="text-deploy-current-stage">{current}</span>
                {data?.kind === "rollback" && (
                  <Badge variant="secondary" className="bg-blue-100 text-blue-900">Rollback</Badge>
                )}
              </div>
              <span className="text-xs text-muted-foreground tabular-nums" data-testid="text-deploy-pct">{pct}%</span>
            </div>
            <Progress
              value={pct}
              className={status === "failed" ? "[&>div]:bg-red-600" : status === "success" ? "[&>div]:bg-emerald-600" : ""}
            />
            <div className="flex flex-row flex-wrap gap-1.5 pt-1">
              {STAGES.map((stage) => {
                const reached = lines.some((ln) => stage.match.test(ln));
                const isActive = current === stage.label;
                const failedHere = status === "failed" && current === `Failed at: ${stage.label}`;
                return (
                  <Badge
                    key={stage.key}
                    variant={reached ? "default" : "secondary"}
                    className={
                      failedHere
                        ? "bg-red-100 text-red-900 border border-red-300"
                        : isActive && running
                          ? "bg-amber-100 text-amber-900 border border-amber-300"
                          : reached
                            ? "bg-emerald-100 text-emerald-900 border border-emerald-300"
                            : "opacity-60"
                    }
                    data-testid={`stage-${stage.key}`}
                  >
                    {reached && !failedHere && !isActive && <CheckCircle2 className="w-3 h-3 mr-1" />}
                    {failedHere && <XCircle className="w-3 h-3 mr-1" />}
                    {isActive && running && <Loader2 className="w-3 h-3 mr-1 animate-spin" />}
                    {stage.label}
                  </Badge>
                );
              })}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
            <div>
              <div className="text-xs text-muted-foreground">Run ID</div>
              <div className="font-mono" data-testid="text-deploy-id">{data?.id || "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Started</div>
              <div data-testid="text-deploy-started">
                {data?.startedAt ? new Date(data.startedAt).toLocaleTimeString() : "—"}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Elapsed</div>
              <div data-testid="text-deploy-elapsed" className="tabular-nums">{data?.startedAt ? formatDuration(elapsedMs) : "—"}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">Exit code</div>
              <div className="flex items-center gap-1" data-testid="text-deploy-exit">
                {data?.exitCode === 0 && <CheckCircle2 className="w-4 h-4 text-emerald-700" />}
                {typeof data?.exitCode === "number" && data.exitCode !== 0 && (
                  <XCircle className="w-4 h-4 text-red-700" />
                )}
                {data?.exitCode ?? "—"}
              </div>
            </div>
          </div>

          <div>
            <div className="text-xs text-muted-foreground mb-1">Live log</div>
            <pre
              ref={logRef}
              className="bg-muted text-foreground text-xs font-mono rounded-md p-3 h-96 overflow-auto whitespace-pre-wrap"
              data-testid="text-deploy-log"
            >
              {(lines.length > 0) ? lines.join("\n") : "No deploy has been run yet."}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Deploy history + rollback */}
      <Card data-testid="card-deploy-history">
        <CardHeader>
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <History className="w-4 h-4" />
                Recent deploys
              </CardTitle>
              <CardDescription>
                Last {historyEntries.length || "0"} runs. Click <strong>Rollback</strong> to restore that version. The live version is saved as a safety ref and auto-restored if the rolled-back build fails to start.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {historyEntries.length === 0 ? (
            <div className="text-sm text-muted-foreground py-6 text-center" data-testid="text-no-history">
              No deploy history yet — your first run will appear here.
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="px-3 py-2 text-muted-foreground">When</th>
                    <th className="px-3 py-2 text-muted-foreground">Kind</th>
                    <th className="px-3 py-2 text-muted-foreground">Status</th>
                    <th className="px-3 py-2 text-muted-foreground">Commit</th>
                    <th className="px-3 py-2 text-muted-foreground">Duration</th>
                    <th className="px-3 py-2 text-muted-foreground text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {historyEntries.map((e) => {
                    const sha = e.commitAfter || e.targetSha;
                    const isCurrent = !!sha && !!data?.currentCommit && data.currentCommit.startsWith(sha.slice(0, 7));
                    const dur = e.finishedAt && e.startedAt ? formatDuration(e.finishedAt - e.startedAt) : "—";
                    const canRollback = e.status === "success" && !!sha && !isCurrent && status !== "running" && status !== "disabled";
                    return (
                      <tr key={e.id} className="border-t border-border align-top" data-testid={`row-history-${e.id}`}>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <div>{new Date(e.startedAt).toLocaleString()}</div>
                          <div className="text-[10px] text-muted-foreground font-mono">{e.id}</div>
                        </td>
                        <td className="px-3 py-2">
                          <Badge variant="secondary" className={e.kind === "rollback" ? "bg-blue-100 text-blue-900" : ""}>
                            {e.kind}
                          </Badge>
                        </td>
                        <td className="px-3 py-2">{statusBadge(e.status)}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <code className="font-mono" data-testid={`sha-${e.id}`}>{shortSha(sha)}</code>
                            {isCurrent && (
                              <Badge className="bg-emerald-100 text-emerald-900 text-[10px]">Live</Badge>
                            )}
                          </div>
                          {e.commitMessage && (
                            <div className="text-muted-foreground truncate max-w-[40ch]">{e.commitMessage}</div>
                          )}
                        </td>
                        <td className="px-3 py-2 tabular-nums">{dur}</td>
                        <td className="px-3 py-2 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => triggerRollback(e)}
                            disabled={!canRollback || rollingBack === e.id}
                            data-testid={`button-rollback-${e.id}`}
                            title={
                              isCurrent ? "This is the live version" :
                              !sha ? "No commit recorded for this run" :
                              status === "running" ? "A run is already in progress" :
                              e.status !== "success" ? "Only successful runs can be rolled back to" :
                              "Restore the live site to this commit"
                            }
                          >
                            {rollingBack === e.id ? (
                              <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
                            ) : (
                              <Undo2 className="w-3.5 h-3.5 mr-1" />
                            )}
                            Rollback
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Errors surfaced from the current run */}
      <Card data-testid="card-deploy-errors">
        <CardHeader>
          <div className="flex flex-row items-center justify-between gap-3 flex-wrap">
            <div>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className={`w-4 h-4 ${errors.length > 0 ? "text-red-700" : "text-muted-foreground"}`} />
                Errors
              </CardTitle>
              <CardDescription>
                Lines from the current deploy log that look like errors or failures.
              </CardDescription>
            </div>
            <Badge
              variant="secondary"
              className={errors.length > 0 ? "bg-red-100 text-red-900" : ""}
              data-testid="text-deploy-error-count"
            >
              {errors.length} {errors.length === 1 ? "issue" : "issues"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {errors.length === 0 ? (
            <div className="text-sm text-muted-foreground py-4 text-center" data-testid="text-deploy-no-errors">
              {lines.length === 0
                ? "No deploy has been run yet."
                : "No errors detected in the current run."}
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr className="text-left">
                    <th className="px-3 py-2 w-12 text-muted-foreground">#</th>
                    <th className="px-3 py-2 w-24 text-muted-foreground">Line</th>
                    <th className="px-3 py-2 text-muted-foreground">Message</th>
                  </tr>
                </thead>
                <tbody>
                  {errors.map((e, i) => (
                    <tr
                      key={`${e.idx}-${i}`}
                      className="border-t border-border align-top"
                      data-testid={`row-deploy-error-${i}`}
                    >
                      <td className="px-3 py-2 text-muted-foreground tabular-nums">{i + 1}</td>
                      <td className="px-3 py-2 font-mono text-muted-foreground tabular-nums">{e.idx + 1}</td>
                      <td className="px-3 py-2 font-mono whitespace-pre-wrap break-all text-red-800 dark:text-red-300">
                        {e.line}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
