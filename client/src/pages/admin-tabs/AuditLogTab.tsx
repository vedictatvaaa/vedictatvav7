import { useState } from "react";
import { useQuery } from "@tanstack/react-query";

import { Card, CardContent } from "@/components/ui/card";

import { Input } from "@/components/ui/input";

import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { createFetcher } from "../admin-shared";

function AuditLogTab({ adminToken }: { adminToken?: string }) {
  const fetcher = createFetcher(adminToken);
  const [filter, setFilter] = useState("");
  const { data: logs, isLoading } = useQuery<Array<{
    id: number; actor: string | null; action: string; target: string | null;
    details: any; ipAddress: string | null; createdAt: string;
  }>>({
    queryKey: ["/api/admin/audit-log"],
    queryFn: () => fetcher("/api/admin/audit-log?limit=200"),
    staleTime: 30_000,
  });

  const filtered = (logs || []).filter((l) => {
    if (!filter.trim()) return true;
    const hay = `${l.action} ${l.target || ""} ${l.actor || ""}`.toLowerCase();
    return hay.includes(filter.toLowerCase());
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-audit-log">Audit Log</h1>
          <p className="text-sm text-muted-foreground">Append-only trail of sensitive admin actions. Latest 200 entries.</p>
        </div>
        <Input
          placeholder="Filter by action, target, or actor…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="max-w-sm"
          data-testid="input-audit-filter"
        />
      </div>

      {isLoading ? (
        <Skeleton className="h-64 w-full rounded-md" />
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-sm text-muted-foreground">
            {logs && logs.length === 0 ? "No audit entries yet. Admin writes will appear here." : "No entries match your filter."}
          </CardContent>
        </Card>
      ) : (
        <div className="border rounded-md bg-card overflow-hidden">
          <div className="grid grid-cols-12 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground bg-muted px-4 py-2">
            <div className="col-span-3">When</div>
            <div className="col-span-2">Actor</div>
            <div className="col-span-3">Action</div>
            <div className="col-span-3">Target</div>
            <div className="col-span-1 text-right">IP</div>
          </div>
          <div className="divide-y divide-secondary/60 max-h-[70vh] overflow-auto">
            {filtered.map((log) => (
              <div key={log.id} className="grid grid-cols-12 px-4 py-2.5 text-xs items-start" data-testid={`audit-row-${log.id}`}>
                <div className="col-span-3 font-mono text-muted-foreground">{new Date(log.createdAt).toLocaleString()}</div>
                <div className="col-span-2 font-mono text-primary">{log.actor || "—"}</div>
                <div className="col-span-3">
                  <Badge variant="secondary" className="font-mono text-[10px]">{log.action}</Badge>
                  {log.details && (
                    <div className="mt-1 text-[11px] text-muted-foreground truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </div>
                  )}
                </div>
                <div className="col-span-3 text-foreground">{log.target || "—"}</div>
                <div className="col-span-1 text-right font-mono text-muted-foreground">{log.ipAddress || "—"}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}


export default AuditLogTab;
