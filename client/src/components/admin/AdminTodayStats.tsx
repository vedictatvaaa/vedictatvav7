import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart, IndianRupee, CalendarDays } from "lucide-react";
import { createFetcher } from "@/pages/admin-shared";

interface StatsPayload {
  totalOrders: number;
  totalRevenue: number;
}

const POLL_MS = 60_000;

function formatINR(n: number): string {
  if (n >= 10_00_000) return `₹${(n / 1_00_000).toFixed(1)}L`;
  if (n >= 1_00_000) return `₹${(n / 1_000).toFixed(0)}k`;
  if (n >= 1_000) return `₹${(n / 1_000).toFixed(1)}k`;
  return `₹${Math.round(n)}`;
}

export function AdminTodayStats({ adminToken }: { adminToken?: string }) {
  const fetcher = useMemo(() => createFetcher(adminToken), [adminToken]);
  const today = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }, []);

  const { data } = useQuery<StatsPayload>({
    queryKey: ["/api/admin/stats", { from: today, to: today, scope: "today-strip" }],
    queryFn: () => fetcher(`/api/admin/stats?from=${today}&to=${today}`),
    refetchInterval: POLL_MS,
    staleTime: 30_000,
  });

  const dateLabel = useMemo(() => {
    return new Date().toLocaleDateString(undefined, {
      day: "numeric", month: "short",
    });
  }, []);

  return (
    <div className="hidden lg:flex items-center gap-2 pr-1" data-testid="admin-today-strip">
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[hsl(var(--accent))]/60 text-[hsl(var(--primary))] text-xs"
        title="Today"
      >
        <CalendarDays className="w-3.5 h-3.5 opacity-70" />
        <span className="font-medium">{dateLabel}</span>
      </div>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs"
        title="Orders today"
        data-testid="stat-today-orders"
      >
        <ShoppingCart className="w-3.5 h-3.5 text-[hsl(var(--primary))]" />
        <span className="font-semibold tabular-nums">{data?.totalOrders ?? "—"}</span>
        <span className="text-muted-foreground">orders</span>
      </div>
      <div
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-foreground text-xs"
        title="Revenue today (orders + bookings)"
        data-testid="stat-today-revenue"
      >
        <IndianRupee className="w-3.5 h-3.5 text-[hsl(var(--secondary))]" />
        <span className="font-semibold tabular-nums">
          {data ? formatINR(data.totalRevenue) : "—"}
        </span>
      </div>
    </div>
  );
}

export default AdminTodayStats;
