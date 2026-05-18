// =====================================================================
// AI Coder admin tab — Tier 1 UI.
// Workflow: pick files → write request → Generate → review diff per
// file → Apply / Reject. Past Applied sessions can be Rolled Back.
// All actions are POSTs against /api/admin/ai-coder/* with the admin
// token; the backend enforces the AI_CODER_ENABLED kill-switch.
// =====================================================================
import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, FileCode, Search, Send, Check, X, Undo2, AlertTriangle, Loader2, ShieldCheck } from "lucide-react";

type FileEntry = { path: string; bytes: number };
type Session = {
  id: number;
  adminActor: string;
  prompt: string;
  contextPaths: string[];
  generatedFiles: Array<{ path: string; newContent: string }>;
  oldContents: Array<{ path: string; oldContent: string }>;
  summary: string | null;
  model: string | null;
  status: "proposed" | "applied" | "rejected" | "rolledback" | "error";
  errorMessage: string | null;
  tokenUsage: { prompt_tokens?: number; completion_tokens?: number; total_tokens?: number } | null;
  createdAt: string;
  appliedAt: string | null;
  rolledbackAt: string | null;
};
type Status = {
  enabled: boolean;
  hasOpenAiKey: boolean;
  model: string;
  scope: string;
  limits: { maxFileBytes: number; maxFilesPerSession: number; maxGenerationsPerDay: number };
};

const STATUS_PILL: Record<Session["status"], string> = {
  proposed:   "bg-amber-100 text-amber-900",
  applied:    "bg-emerald-100 text-emerald-900",
  rejected:   "bg-muted text-muted-foreground",
  rolledback: "bg-secondary/30 text-foreground",
  error:      "bg-red-100 text-red-900",
};

function authedFetch(url: string, token?: string, init?: RequestInit) {
  return fetch(url, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-admin-token": token } : {}),
      ...(init?.headers || {}),
    },
  });
}

export default function AiCoderTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();

  // Form state
  const [prompt, setPrompt] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [fileFilter, setFileFilter] = useState("");
  const [openSessionId, setOpenSessionId] = useState<number | null>(null);

  const status = useQuery<Status>({
    queryKey: ["/api/admin/ai-coder/status"],
    queryFn: async () => {
      const r = await authedFetch("/api/admin/ai-coder/status", adminToken);
      if (!r.ok) throw new Error("Failed to load status");
      return r.json();
    },
  });

  const filesQ = useQuery<{ files: FileEntry[] }>({
    queryKey: ["/api/admin/ai-coder/files"],
    enabled: !!status.data?.enabled,
    queryFn: async () => {
      const r = await authedFetch("/api/admin/ai-coder/files", adminToken);
      if (!r.ok) throw new Error("Failed to load file list");
      return r.json();
    },
  });

  const sessionsQ = useQuery<{ sessions: Session[] }>({
    queryKey: ["/api/admin/ai-coder/sessions"],
    enabled: !!status.data?.enabled,
    queryFn: async () => {
      const r = await authedFetch("/api/admin/ai-coder/sessions", adminToken);
      if (!r.ok) throw new Error("Failed to load sessions");
      return r.json();
    },
  });

  const openSessionQ = useQuery<{ session: Session }>({
    queryKey: ["/api/admin/ai-coder/sessions", openSessionId],
    enabled: openSessionId !== null,
    queryFn: async () => {
      const r = await authedFetch(`/api/admin/ai-coder/sessions/${openSessionId}`, adminToken);
      if (!r.ok) throw new Error("Failed to load session");
      return r.json();
    },
  });

  const generate = useMutation({
    mutationFn: async () => {
      const r = await authedFetch("/api/admin/ai-coder/sessions", adminToken, {
        method: "POST",
        body: JSON.stringify({ prompt, contextPaths: Array.from(selected) }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.message || "Generation failed");
      return data.session as Session;
    },
    onSuccess: (s) => {
      toast({ title: "Generated", description: s.summary || "AI proposed changes — review below." });
      setPrompt("");
      setSelected(new Set());
      setOpenSessionId(s.id);
      qc.invalidateQueries({ queryKey: ["/api/admin/ai-coder/sessions"] });
    },
    onError: (err: any) => {
      toast({ title: "Generation failed", description: String(err?.message || err), variant: "destructive" });
    },
  });

  function action(verb: "apply" | "reject" | "rollback", id: number) {
    return async () => {
      const r = await authedFetch(`/api/admin/ai-coder/sessions/${id}/${verb}`, adminToken, { method: "POST" });
      const data = await r.json();
      if (!r.ok) {
        toast({ title: `${verb} failed`, description: data?.message || "Unknown error", variant: "destructive" });
        return;
      }
      toast({
        title: verb === "apply" ? "Applied" : verb === "reject" ? "Rejected" : "Rolled back",
        description: verb === "apply"
          ? "Files written. Vite HMR should hot-reload the changes; check the preview."
          : verb === "rollback"
          ? "Files restored to the snapshot taken at apply time."
          : "Marked rejected — no files were touched.",
      });
      qc.invalidateQueries({ queryKey: ["/api/admin/ai-coder/sessions"] });
      qc.invalidateQueries({ queryKey: ["/api/admin/ai-coder/sessions", id] });
    };
  }

  const filteredFiles = useMemo(() => {
    const all = filesQ.data?.files || [];
    if (!fileFilter.trim()) return all;
    const q = fileFilter.trim().toLowerCase();
    return all.filter((f) => f.path.toLowerCase().includes(q));
  }, [filesQ.data?.files, fileFilter]);

  // ---- Disabled gate -----------------------------------------------------
  if (status.isLoading) {
    return <div className="p-6 text-sm text-muted-foreground" data-testid="text-aic-loading">Loading AI Coder…</div>;
  }
  if (!status.data?.enabled) {
    return (
      <Card className="border border-amber-200 bg-amber-50/50" data-testid="card-aic-disabled">
        <CardContent className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-700 mt-0.5 shrink-0" />
            <div>
              <h3 className="font-serif text-lg text-[#6D2B35] mb-1">AI Coder is disabled</h3>
              <p className="text-sm text-[#5a4a3a]/80 mb-3">
                For safety, this feature is off by default. Set the environment variable
                <code className="mx-1 px-1.5 py-0.5 rounded bg-amber-100 font-mono text-xs">AI_CODER_ENABLED=1</code>
                and restart the server to enable it. While disabled the UI loads but no AI calls or file writes can occur.
              </p>
              <p className="text-xs text-[#5a4a3a]/60">
                When you turn it off again, the kill-switch takes effect immediately — past sessions remain visible but
                Apply / Rollback are blocked.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  if (!status.data.hasOpenAiKey) {
    return (
      <Card className="border border-red-200 bg-red-50/50" data-testid="card-aic-no-key">
        <CardContent className="p-6 text-sm">
          <strong>OPENAI_API_KEY is not configured.</strong> Set it in the environment and restart.
        </CardContent>
      </Card>
    );
  }

  // ---- Active UI --------------------------------------------------------
  const sessions = sessionsQ.data?.sessions || [];
  const openSession = openSessionQ.data?.session;
  const canSubmit = prompt.trim().length >= 10 && selected.size > 0 && !generate.isPending;

  return (
    <div className="space-y-6 p-1" data-testid="ai-coder-tab">
      {/* Header / safety strip */}
      <Card className="border border-[#6D2B35]/10 bg-[#FBF7EE]">
        <CardContent className="p-4 flex items-start gap-3">
          <div className="w-9 h-9 rounded-full bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center shrink-0">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="font-serif text-lg text-[#6D2B35]">AI Coder</h2>
              <Badge className="bg-emerald-100 text-emerald-900 text-[10px]" data-testid="badge-aic-enabled">
                <ShieldCheck className="h-3 w-3 mr-1" /> Enabled
              </Badge>
              <Badge variant="outline" className="text-[10px]">{status.data.model}</Badge>
              <Badge variant="outline" className="text-[10px]">scope: {status.data.scope}</Badge>
            </div>
            <p className="text-xs text-[#5a4a3a]/70 mt-1">
              Type a request, pick files, generate a proposal. Nothing is written to disk until you click <strong>Apply</strong>.
              Limit: {status.data.limits.maxGenerationsPerDay} generations/day · {status.data.limits.maxFilesPerSession} files/session.
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Composer */}
      <Card className="border border-[#6D2B35]/10">
        <CardContent className="p-4 space-y-4">
          <div>
            <label className="text-xs uppercase tracking-wider text-[#5a4a3a]/70 font-bold">Your request</label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder='e.g. "Add a Diwali 10% off banner to the homepage above the hero, link to /puja-samagri-online?coupon=DIWALI10"'
              className="mt-1 min-h-[100px]"
              maxLength={4000}
              data-testid="input-aic-prompt"
            />
            <div className="text-[10px] text-[#5a4a3a]/50 mt-1 text-right">{prompt.length}/4000</div>
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <label className="text-xs uppercase tracking-wider text-[#5a4a3a]/70 font-bold">
                Files in scope · {selected.size} selected
              </label>
              <div className="relative">
                <Search className="h-3.5 w-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#5a4a3a]/50" />
                <Input
                  value={fileFilter}
                  onChange={(e) => setFileFilter(e.target.value)}
                  placeholder="Filter…"
                  className="h-8 pl-7 w-48 text-xs"
                  data-testid="input-aic-file-filter"
                />
              </div>
            </div>
            <div className="border border-[#6D2B35]/10 rounded-md max-h-64 overflow-y-auto bg-white" data-testid="list-aic-files">
              {filesQ.isLoading && <div className="p-4 text-xs text-muted-foreground">Loading file list…</div>}
              {filesQ.data && filteredFiles.length === 0 && (
                <div className="p-4 text-xs text-muted-foreground">No files match.</div>
              )}
              {filteredFiles.map((f) => {
                const checked = selected.has(f.path);
                const disabled = !checked && selected.size >= status.data!.limits.maxFilesPerSession;
                return (
                  <label
                    key={f.path}
                    className={`flex items-center gap-2 px-3 py-1.5 text-xs border-b border-[#6D2B35]/5 last:border-b-0 cursor-pointer hover-elevate ${disabled ? "opacity-40 cursor-not-allowed" : ""}`}
                    data-testid={`row-aic-file-${f.path}`}
                  >
                    <input
                      type="checkbox"
                      className="accent-[#6D2B35]"
                      checked={checked}
                      disabled={disabled}
                      onChange={(e) => {
                        setSelected((prev) => {
                          const next = new Set(prev);
                          if (e.target.checked) next.add(f.path); else next.delete(f.path);
                          return next;
                        });
                      }}
                    />
                    <FileCode className="h-3.5 w-3.5 text-[#6D2B35]/60 shrink-0" />
                    <span className="font-mono truncate flex-1">{f.path}</span>
                    <span className="text-[10px] text-[#5a4a3a]/50 tabular-nums">{(f.bytes / 1024).toFixed(1)}K</span>
                  </label>
                );
              })}
            </div>
            <p className="text-[10px] text-[#5a4a3a]/50 mt-1">
              The AI sees only the files you check here. Pick the smallest set that contains the change site.
            </p>
          </div>

          <div className="flex items-center justify-end gap-2">
            <Button
              onClick={() => generate.mutate()}
              disabled={!canSubmit}
              className="bg-[#6D2B35] hover:bg-[#6D2B35]/90 text-white"
              data-testid="btn-aic-generate"
            >
              {generate.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Generate proposal
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sessions list */}
      <Card className="border border-[#6D2B35]/10">
        <CardContent className="p-4">
          <h3 className="font-serif text-[#6D2B35] mb-3">Recent sessions</h3>
          {sessionsQ.isLoading && <div className="text-xs text-muted-foreground">Loading…</div>}
          {sessions.length === 0 && !sessionsQ.isLoading && (
            <div className="text-xs text-muted-foreground">No sessions yet — generate your first proposal above.</div>
          )}
          <div className="divide-y divide-[#6D2B35]/5">
            {sessions.map((s) => (
              <button
                key={s.id}
                onClick={() => setOpenSessionId(s.id === openSessionId ? null : s.id)}
                className="w-full text-left py-2 px-2 hover-elevate flex items-start gap-3"
                data-testid={`row-aic-session-${s.id}`}
              >
                <Badge className={`${STATUS_PILL[s.status]} text-[10px] shrink-0 mt-0.5`}>{s.status}</Badge>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-[#5a4a3a] truncate">{s.prompt}</div>
                  <div className="text-[10px] text-[#5a4a3a]/50">
                    {new Date(s.createdAt).toLocaleString()} · {s.contextPaths.length} files in · {s.generatedFiles.length} files out · actor {s.adminActor}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Session detail */}
      {openSession && <SessionDetail session={openSession} onAction={action} />}
    </div>
  );
}

function SessionDetail({
  session,
  onAction,
}: {
  session: Session;
  onAction: (verb: "apply" | "reject" | "rollback", id: number) => () => Promise<void>;
}) {
  return (
    <Card className="border border-[#D4AF37]/30 bg-white" data-testid={`detail-aic-session-${session.id}`}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <Badge className={`${STATUS_PILL[session.status]} text-[10px]`}>{session.status}</Badge>
              <span className="text-xs text-[#5a4a3a]/60">
                #{session.id} · {new Date(session.createdAt).toLocaleString()}
              </span>
              {session.tokenUsage?.total_tokens && (
                <span className="text-[10px] text-[#5a4a3a]/50">{session.tokenUsage.total_tokens} tokens</span>
              )}
            </div>
            <div className="text-sm text-[#5a4a3a] mb-2"><strong>Prompt:</strong> {session.prompt}</div>
            {session.summary && (
              <div className="text-sm text-[#5a4a3a]/80 italic mb-1"><strong>AI summary:</strong> {session.summary}</div>
            )}
            {session.errorMessage && (
              <div className="text-sm text-red-700"><strong>Error:</strong> {session.errorMessage}</div>
            )}
          </div>
          <div className="flex gap-2 shrink-0">
            {session.status === "proposed" && (
              <>
                <Button size="sm" onClick={onAction("apply", session.id)} className="bg-emerald-700 hover:bg-emerald-800 text-white" data-testid={`btn-aic-apply-${session.id}`}>
                  <Check className="h-4 w-4 mr-1" /> Apply
                </Button>
                <Button size="sm" variant="outline" onClick={onAction("reject", session.id)} data-testid={`btn-aic-reject-${session.id}`}>
                  <X className="h-4 w-4 mr-1" /> Reject
                </Button>
              </>
            )}
            {session.status === "applied" && (
              <Button size="sm" variant="outline" onClick={onAction("rollback", session.id)} className="border-amber-400 text-amber-900" data-testid={`btn-aic-rollback-${session.id}`}>
                <Undo2 className="h-4 w-4 mr-1" /> Rollback
              </Button>
            )}
          </div>
        </div>

        {session.generatedFiles.length === 0 && session.status !== "error" && (
          <div className="text-xs text-muted-foreground italic">Model returned no file changes.</div>
        )}

        {session.generatedFiles.map((f) => {
          const before = session.oldContents.find((s) => s.path === f.path)?.oldContent;
          return <FileDiff key={f.path} path={f.path} newContent={f.newContent} oldContent={before} />;
        })}
      </CardContent>
    </Card>
  );
}

// Side-by-side file viewer. We don't compute a true LCS diff in Phase 1 —
// instead we show new content with a small marker on lines that differ
// from the captured "before" snapshot (only available after Apply).
// Before Apply, only the new content is shown (oldContent is unknown
// without an extra fetch). Compact, monospaced, scrollable.
function FileDiff({ path, newContent, oldContent }: { path: string; newContent: string; oldContent?: string }) {
  const newLines = newContent.split("\n");
  const oldLines = (oldContent ?? "").split("\n");
  const oldSet = new Set(oldLines);
  return (
    <div className="border border-[#6D2B35]/10 rounded-md overflow-hidden" data-testid={`diff-aic-${path}`}>
      <div className="bg-[#FBF7EE] px-3 py-1.5 text-xs font-mono text-[#6D2B35] border-b border-[#6D2B35]/10 flex items-center gap-2">
        <FileCode className="h-3.5 w-3.5" />
        <span className="truncate">{path}</span>
        <span className="ml-auto text-[10px] text-[#5a4a3a]/50">{newLines.length} lines</span>
      </div>
      <pre className="bg-white text-[11px] leading-relaxed font-mono overflow-x-auto max-h-96 m-0 p-0">
        {newLines.map((ln, i) => {
          const isNew = oldContent !== undefined && !oldSet.has(ln) && ln.trim() !== "";
          return (
            <div
              key={i}
              className={`px-3 py-0 whitespace-pre ${isNew ? "bg-emerald-50 border-l-2 border-emerald-400" : ""}`}
            >
              <span className="inline-block w-8 text-right pr-2 text-[#5a4a3a]/40 select-none">{i + 1}</span>
              <span>{ln || " "}</span>
            </div>
          );
        })}
      </pre>
    </div>
  );
}
