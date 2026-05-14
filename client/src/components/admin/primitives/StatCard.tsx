import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string | number | null | undefined;
  icon?: LucideIcon;
  hint?: string;
  loading?: boolean;
  testId?: string;
}

export function StatCard({ label, value, icon: Icon, hint, loading, testId }: StatCardProps) {
  return (
    <Card data-testid={testId ?? `stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <CardContent className="p-4">
        <div className="flex flex-row items-center justify-between gap-2">
          <div className="text-xs uppercase tracking-wider text-muted-foreground">{label}</div>
          {Icon && <Icon className="w-4 h-4 text-primary shrink-0" />}
        </div>
        {loading ? (
          <Skeleton className="h-8 w-24 mt-2" />
        ) : (
          <div className="text-2xl font-bold text-primary mt-1">{value ?? "—"}</div>
        )}
        {hint && <div className="text-xs text-muted-foreground mt-1">{hint}</div>}
      </CardContent>
    </Card>
  );
}
