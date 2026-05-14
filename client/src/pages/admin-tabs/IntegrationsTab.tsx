import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { RefreshCw, Zap, ExternalLink } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { useToast } from "@/hooks/use-toast";

import { createFetcher } from "../admin-shared";

// ============================================================
// Integrations Hub
// ============================================================
interface IntegrationStatus {
  key: string;
  label: string;
  category: string;
  envVars: string[];
  configured: boolean;
  maskedIdentifier?: string;
  docs: string;
}

function IntegrationsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const [pingResults, setPingResults] = useState<Record<string, { ok: boolean; message: string; at: number }>>({});
  const [pingingKey, setPingingKey] = useState<string | null>(null);

  const { data: integrations, isLoading } = useQuery<IntegrationStatus[]>({
    queryKey: ["/api/admin/integrations/status"],
    queryFn: () => fetcher("/api/admin/integrations/status"),
  });

  const runPing = async (key: string) => {
    setPingingKey(key);
    try {
      const res = await fetch(`/api/admin/integrations/${key}/ping`, {
        method: "POST",
        headers: { "x-admin-token": adminToken },
      });
      const json = await res.json();
      setPingResults((prev) => ({ ...prev, [key]: { ...json, at: Date.now() } }));
      toast({
        title: json.ok ? "Integration healthy" : "Ping failed",
        description: json.message,
        variant: json.ok ? "default" : "destructive",
      });
    } catch (err: any) {
      toast({ title: "Ping error", description: err?.message || "Request failed", variant: "destructive" });
    } finally {
      setPingingKey(null);
    }
  };

  if (isLoading) return <div className="space-y-4">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>;

  const configuredCount = (integrations || []).filter((i) => i.configured).length;
  const totalCount = (integrations || []).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-integrations">Integrations Hub</h1>
          <p className="text-sm text-muted-foreground">Health and configuration status of every connected provider</p>
        </div>
        <Badge className="bg-primary text-white">{configuredCount} / {totalCount} configured</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(integrations || []).map((int) => {
          const ping = pingResults[int.key];
          return (
            <Card key={int.key} className="bg-card border-border" data-testid={`card-integration-${int.key}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1">
                    <CardTitle className="text-base text-primary font-serif">{int.label}</CardTitle>
                    <CardDescription className="text-xs">{int.category}</CardDescription>
                  </div>
                  <Badge className={int.configured ? "bg-emerald-100 text-emerald-800" : "bg-muted text-muted-foreground"}>
                    {int.configured ? "Configured" : "Not configured"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {int.maskedIdentifier && (
                  <div className="text-xs font-mono text-muted-foreground" data-testid={`masked-${int.key}`}>
                    ID: {int.maskedIdentifier}
                  </div>
                )}
                <div className="text-xs text-muted-foreground">
                  <span className="font-semibold">Env vars: </span>
                  <span className="font-mono">{int.envVars.join(", ")}</span>
                </div>
                {ping && (
                  <div className={`text-xs rounded px-2 py-1 ${ping.ok ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-800"}`}>
                    {ping.ok ? "✓" : "✗"} {ping.message}
                    <span className="opacity-60 ml-2">{new Date(ping.at).toLocaleTimeString()}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-1 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => runPing(int.key)}
                    disabled={!int.configured || pingingKey === int.key}
                    data-testid={`btn-ping-${int.key}`}
                  >
                    {pingingKey === int.key ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                    Test
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <a href={int.docs} target="_blank" rel="noreferrer" data-testid={`link-docs-${int.key}`}>
                      <ExternalLink className="w-3 h-3" /> Docs
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="bg-muted border-border">
        <CardContent className="pt-6 text-xs text-muted-foreground">
          <p className="font-semibold mb-1">Managing credentials</p>
          <p>Credentials are stored as environment variables, not in the database. To add or rotate a key, set the corresponding env var (listed on each card) and restart the app. The "Test" button performs a lightweight read against each provider to verify connectivity.</p>
        </CardContent>
      </Card>
    </div>
  );
}


export default IntegrationsTab;
