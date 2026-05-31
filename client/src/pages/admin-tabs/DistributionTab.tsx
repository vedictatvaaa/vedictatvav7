import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import {
  Radio, Send, Sparkles, Globe, Newspaper, Bot, Map, CheckCircle2,
  XCircle, Loader2, RefreshCw, Copy, ChevronDown, ChevronRight, Zap,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

type ChannelId = "google" | "indexnow" | "google-news" | "sitemap" | "ai-agents";

type ChannelInfo = {
  id: ChannelId;
  label: string;
  description: string;
  reach: string[];
  configured: boolean;
  note?: string;
};
type StatusResponse = {
  baseUrl: string;
  indexNowKey: string;
  googleConfigured: boolean;
  googleQuota: { day: string; used: number; cap: number };
  channels: ChannelInfo[];
};
type TargetGroup = { id: string; label: string; urls: Array<{ path: string; title: string }> };
type TargetsResponse = { groups: TargetGroup[] };
type ChannelResult = ChannelInfo & { ok: boolean; detail: string; submitted?: number };
type BroadcastResponse = { ok: boolean; urls: string[]; results: ChannelResult[]; googleQuota: StatusResponse["googleQuota"] };
type Draft = {
  title: string;
  metaTitle: string;
  metaDescription: string;
  keywords: string[];
  body: string;
  hashtags: string[];
  suggestedPaths: string[];
};
type GenerateResponse = { ok: boolean; kind: string; draft: Draft };

const CHANNEL_ICONS: Record<ChannelId, typeof Globe> = {
  google: Globe,
  indexnow: Radio,
  "google-news": Newspaper,
  sitemap: Map,
  "ai-agents": Bot,
};

function DistributionTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);

  const [selected, setSelected] = useState<Set<string>>(new Set(["/"]));
  const [customUrls, setCustomUrls] = useState("");
  const [activeChannels, setActiveChannels] = useState<Set<ChannelId>>(
    new Set<ChannelId>(["google", "indexnow", "google-news", "sitemap", "ai-agents"]),
  );
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set(["core"]));
  const [results, setResults] = useState<ChannelResult[] | null>(null);

  // AI studio
  const [topic, setTopic] = useState("");
  const [kind, setKind] = useState<"announcement" | "blog" | "social">("announcement");
  const [draft, setDraft] = useState<Draft | null>(null);

  const { data: status, isLoading: statusLoading, refetch: refetchStatus, isFetching } = useQuery<StatusResponse>({
    queryKey: ["/api/admin/distribution/status"],
    queryFn: () => fetcher("/api/admin/distribution/status"),
    staleTime: 30_000,
  });

  const { data: targets, isLoading: targetsLoading } = useQuery<TargetsResponse>({
    queryKey: ["/api/admin/distribution/targets"],
    queryFn: () => fetcher("/api/admin/distribution/targets"),
    staleTime: 60_000,
  });

  const allCustom = useMemo(
    () => customUrls.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean),
    [customUrls],
  );
  const totalSelected = selected.size + allCustom.length;

  const toggleUrl = (path: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(path) ? next.delete(path) : next.add(path);
      return next;
    });
  };
  const toggleChannel = (id: ChannelId) => {
    setActiveChannels((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const toggleGroup = (id: string) => {
    setOpenGroups((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };
  const selectAllInGroup = (g: TargetGroup) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const allIn = g.urls.every((u) => next.has(u.path));
      g.urls.forEach((u) => (allIn ? next.delete(u.path) : next.add(u.path)));
      return next;
    });
  };

  const broadcastMut = useMutation<BroadcastResponse>({
    mutationFn: async () => {
      const urls = [...Array.from(selected), ...allCustom];
      const r = await fetch("/api/admin/distribution/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
        body: JSON.stringify({ urls, channels: Array.from(activeChannels) }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message || "Broadcast failed");
      return r.json();
    },
    onSuccess: (data) => {
      setResults(data.results);
      const okCount = data.results.filter((x) => x.ok).length;
      toast({
        title: okCount > 0 ? "Broadcast complete" : "Broadcast finished with issues",
        description: `${okCount}/${data.results.length} channels succeeded · ${data.urls.length} URLs.`,
      });
      refetchStatus();
    },
    onError: (e: any) => toast({ title: "Broadcast failed", description: e.message, variant: "destructive" }),
  });

  const generateMut = useMutation<GenerateResponse>({
    mutationFn: async () => {
      const r = await fetch("/api/admin/distribution/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(adminToken ? { "x-admin-token": adminToken } : {}) },
        body: JSON.stringify({ topic, kind }),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({})))?.message || "Generation failed");
      return r.json();
    },
    onSuccess: (data) => {
      setDraft(data.draft);
      if (Array.isArray(data.draft.suggestedPaths)) {
        setSelected((prev) => {
          const next = new Set(prev);
          data.draft.suggestedPaths.forEach((p) => p && p.startsWith("/") && next.add(p));
          return next;
        });
      }
      toast({ title: "Draft ready", description: "Review the content, then broadcast the suggested pages." });
    },
    onError: (e: any) => toast({ title: "Generation failed", description: e.message, variant: "destructive" }),
  });

  const copy = (text: string, label: string) => {
    navigator.clipboard?.writeText(text);
    toast({ title: `${label} copied` });
  };

  return (
    <div className="space-y-6" data-testid="tab-distribution">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-serif font-bold text-foreground flex items-center gap-2">
            <Radio className="h-6 w-6 text-primary" />
            Distribution Hub
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            One click pushes your pages to Google, Bing, Yahoo, Google News and AI assistants.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => refetchStatus()} disabled={isFetching} data-testid="button-refresh-status">
          <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {/* Channel status cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {statusLoading
          ? Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)
          : status?.channels.map((ch) => {
              const Icon = CHANNEL_ICONS[ch.id] || Globe;
              const active = activeChannels.has(ch.id);
              return (
                <button
                  key={ch.id}
                  onClick={() => toggleChannel(ch.id)}
                  data-testid={`channel-${ch.id}`}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    active ? "border-primary/50 bg-primary/5 shadow-sm" : "border-border bg-card opacity-70 hover:opacity-100"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-lg p-1.5 ${active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold text-sm text-foreground">{ch.label}</span>
                    </div>
                    {ch.configured ? (
                      <Badge className="bg-emerald-100 text-emerald-900 hover:bg-emerald-100">Ready</Badge>
                    ) : (
                      <Badge className="bg-amber-100 text-amber-900 hover:bg-amber-100">Setup</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">{ch.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {ch.reach.map((r) => (
                      <span key={r} className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{r}</span>
                    ))}
                  </div>
                  {ch.note && <p className="text-[11px] text-amber-700 mt-2">{ch.note}</p>}
                </button>
              );
            })}
      </div>

      {status && (
        <p className="text-xs text-muted-foreground">
          Google Indexing quota today: <span className="font-medium text-foreground">{status.googleQuota.used}/{status.googleQuota.cap}</span>
          {" · "}Tap a card to include/exclude that channel from the next push.
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* What to push */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center justify-between">
              <span>What to push</span>
              <Badge variant="outline" data-testid="text-selected-count">{totalSelected} selected</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {targetsLoading ? (
              <Skeleton className="h-40" />
            ) : (
              targets?.groups.map((g) => {
                const open = openGroups.has(g.id);
                const allIn = g.urls.length > 0 && g.urls.every((u) => selected.has(u.path));
                return (
                  <div key={g.id} className="border border-border rounded-lg">
                    <div className="flex items-center justify-between px-3 py-2">
                      <button className="flex items-center gap-1.5 text-sm font-medium" onClick={() => toggleGroup(g.id)} data-testid={`group-${g.id}`}>
                        {open ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                        {g.label}
                        <span className="text-xs text-muted-foreground">({g.urls.length})</span>
                      </button>
                      <button className="text-xs text-primary hover:underline" onClick={() => selectAllInGroup(g)}>
                        {allIn ? "Clear" : "Select all"}
                      </button>
                    </div>
                    {open && (
                      <div className="px-3 pb-3 flex flex-wrap gap-1.5 max-h-44 overflow-y-auto" data-lenis-prevent>
                        {g.urls.map((u) => {
                          const on = selected.has(u.path);
                          return (
                            <button
                              key={u.path}
                              onClick={() => toggleUrl(u.path)}
                              title={u.path}
                              data-testid={`url-${u.path}`}
                              className={`text-xs px-2 py-1 rounded-full border transition-colors ${
                                on ? "bg-primary text-primary-foreground border-primary" : "bg-card text-foreground border-border hover:border-primary/50"
                              }`}
                            >
                              {u.title}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })
            )}

            <div>
              <label className="text-xs font-medium text-muted-foreground">Custom URLs (one per line)</label>
              <Textarea
                value={customUrls}
                onChange={(e) => setCustomUrls(e.target.value)}
                placeholder={"/blog/new-article\nhttps://vedictatva.com/special-puja"}
                className="mt-1 h-20 text-sm"
                data-testid="input-custom-urls"
              />
            </div>

            <Button
              className="w-full"
              size="lg"
              onClick={() => broadcastMut.mutate()}
              disabled={broadcastMut.isPending || totalSelected === 0 || activeChannels.size === 0}
              data-testid="button-broadcast"
            >
              {broadcastMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
              Push {totalSelected} {totalSelected === 1 ? "page" : "pages"} to {activeChannels.size} channels
            </Button>

            {results && (
              <div className="space-y-2 pt-2" data-testid="broadcast-results">
                {results.map((r) => (
                  <div key={r.id} className="flex items-start gap-2 text-sm border border-border rounded-lg px-3 py-2">
                    {r.ok ? (
                      <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                    ) : (
                      <XCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                    )}
                    <div>
                      <span className="font-medium">{r.label}</span>
                      <p className="text-xs text-muted-foreground">{r.detail}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* AI Content Studio */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Content Studio
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Describe a topic and let AI draft on-brand content plus the SEO meta, then broadcast the suggested pages.
            </p>
            <Input
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Mahashivratri puja booking now open"
              data-testid="input-topic"
            />
            <div className="flex gap-2">
              {(["announcement", "blog", "social"] as const).map((k) => (
                <button
                  key={k}
                  onClick={() => setKind(k)}
                  data-testid={`kind-${k}`}
                  className={`flex-1 text-xs py-1.5 rounded-lg border capitalize transition-colors ${
                    kind === k ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/50"
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>
            <Button
              variant="secondary"
              className="w-full"
              onClick={() => generateMut.mutate()}
              disabled={generateMut.isPending || !topic.trim()}
              data-testid="button-generate"
            >
              {generateMut.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Zap className="h-4 w-4 mr-2" />}
              Generate draft
            </Button>

            {draft && (
              <div className="space-y-3 pt-1" data-testid="ai-draft">
                <Field label="Title" value={draft.title} onCopy={copy} />
                <Field label="Meta title" value={draft.metaTitle} onCopy={copy} />
                <Field label="Meta description" value={draft.metaDescription} onCopy={copy} />
                {draft.keywords?.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-muted-foreground">Keywords</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {draft.keywords.map((k) => (
                        <span key={k} className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{k}</span>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">Body</span>
                    <button className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => copy(draft.body, "Body")}>
                      <Copy className="h-3 w-3" /> Copy
                    </button>
                  </div>
                  <div className="mt-1 text-sm whitespace-pre-wrap bg-muted/40 rounded-lg p-3 max-h-60 overflow-y-auto" data-lenis-prevent>
                    {draft.body}
                  </div>
                </div>
                {draft.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {draft.hashtags.map((h) => (
                      <span key={h} className="text-[11px] px-1.5 py-0.5 rounded bg-primary/10 text-primary">{h}</span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Field({ label, value, onCopy }: { label: string; value: string; onCopy: (v: string, l: string) => void }) {
  return (
    <div>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground">{label}</span>
        <button className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => onCopy(value, label)}>
          <Copy className="h-3 w-3" /> Copy
        </button>
      </div>
      <p className="text-sm mt-0.5">{value}</p>
    </div>
  );
}

export default DistributionTab;
