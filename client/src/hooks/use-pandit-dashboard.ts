import { useCallback, useEffect, useState } from "react";
import { panditApi } from "@/lib/panditAuth";

export type PanditIdentity = {
  id: number; name: string; city?: string | null; phone?: string | null;
  onLeave?: boolean; leaveNote?: string | null; slug?: string | null;
};
export type DashboardSummary = {
  identity?: { id: number; name: string; city: string | null; experience: number | null; image: string | null; verification: string; approval: string };
  today?: { bookings?: Metric; pendingBookings?: Metric; unreadMessages?: Metric; earnings?: { state: string; amountInr: number; scope: string } };
  storefront?: { state: string; isPublished: boolean; slug: string | null; publicPath: string | null };
  checklist?: { profile: string; services: string; gallery: string; availability: string; googleBusiness: string; inputs: { activeServiceCount: number; hasProfile: boolean; hasAvailability: boolean } };
};
export type Metric = { state: string; count: number };
export function usePanditDashboard() {
  const [me, setMe] = useState<PanditIdentity | null>(null);
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<any[]>([]);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [summaryUnavailable, setSummaryUnavailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    setLoading(true); setError(null);
    try {
      const identityRequest = panditApi("GET", "/api/pandit/me");
      const bookingsRequest = panditApi("GET", "/api/pandit/bookings");
      const statsRequest = panditApi("GET", "/api/pandit/stats");
      const summaryRequest = panditApi("GET", "/api/pandit/dashboard/summary");
      const results = await Promise.allSettled([identityRequest, bookingsRequest, statsRequest, summaryRequest]);
      const [identityResult, bookingsResult, statsResult, summaryResult] = results;
      if (identityResult.status === "fulfilled") setMe(identityResult.value.pandit || null);
      else { setMe(null); throw identityResult.reason; }
      if (bookingsResult.status === "fulfilled") setBookings(bookingsResult.value.bookings || []);
      if (statsResult.status === "fulfilled") setStats(statsResult.value);
      if (summaryResult.status === "fulfilled") { setSummary(summaryResult.value); setSummaryUnavailable(false); }
      else { setSummaryUnavailable(true); }
      if (bookingsResult.status === "rejected" && statsResult.status === "rejected") setError("Practice data could not be loaded");
    } catch (e: any) { setError(e?.message || "Unable to load your practice"); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  return { me, stats, bookings, summary, summaryUnavailable, loading, error, refresh };
}