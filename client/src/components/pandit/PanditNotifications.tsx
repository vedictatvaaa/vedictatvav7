import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, Check, MessageSquare, Star, IndianRupee, XCircle } from "lucide-react";
import { panditApi } from "@/lib/panditAuth";
import { useToast } from "@/hooks/use-toast";
import { PanditEmptyState, PanditErrorState, PanditLoadingState, PanditSectionHeader } from "@/components/pandit/PanditSection";

interface Notif {
  id: number; kind: string; title: string; body: string | null; link: string | null;
  readAt: string | null; createdAt: string;
}

const ICONS: Record<string, any> = {
  booking_message: MessageSquare,
  review_new: Star,
  payment_request_paid: IndianRupee,
  booking_cancelled: XCircle,
};

export default function PanditNotifications() {
  const { toast } = useToast();
  const [items, setItems] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const r = await panditApi("GET", "/api/pandit/notifications");
      setItems(r.notifications || []); setUnread(Number(r.unread || 0));
    } catch (e: any) {
      setError(e?.message || "Your notifications could not be loaded.");
      toast({ title: "Failed to load notifications", description: e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function markRead(id: number) {
    try {
      await panditApi("PATCH", `/api/pandit/notifications/${id}/read`);
      setItems((a) => a.map((n) => n.id === id ? { ...n, readAt: new Date().toISOString() } : n));
      setUnread((u) => Math.max(0, u - 1));
    } catch {}
  }
  async function markAll() {
    try {
      await panditApi("POST", "/api/pandit/notifications/read-all");
      const now = new Date().toISOString();
      setItems((a) => a.map((n) => n.readAt ? n : { ...n, readAt: now }));
      setUnread(0);
      toast({ title: "All notifications marked as read" });
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  }

  return (
    <div className="space-y-5" data-testid="pandit-notifications-tab">
      <PanditSectionHeader
        title="Notifications"
        description="Keep up with new messages, reviews, payment confirmations, and booking changes."
        actions={unread > 0 ? <Button size="sm" variant="outline" onClick={markAll} data-testid="button-mark-all-read"><Check className="w-3 h-3 mr-1" />Mark all read ({unread})</Button> : <Button size="sm" variant="outline" onClick={load}>Refresh</Button>}
      />

      {loading && <PanditLoadingState label="Loading notifications…" />}
      {error && <PanditErrorState detail={error} onRetry={load} />}
      {!loading && !error && items.length === 0 && (
        <PanditEmptyState icon={Bell} title="You’re all caught up" detail="New activity from your yajamanas will appear here." />
      )}

      <div className="space-y-2">
        {items.map((n) => {
          const Icon = ICONS[n.kind] || Bell;
          const unreadRow = !n.readAt;
          return (
            <Card key={n.id} className={unreadRow ? "border-[#D4AF37]" : ""} data-testid={`row-notif-${n.id}`}>
              <CardContent className="p-3 flex items-start gap-3">
                <div className={`mt-0.5 ${unreadRow ? "text-[#6D2B35]" : "text-stone-400"}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <div className="text-sm font-medium text-stone-800">{n.title}</div>
                    {unreadRow && <Badge className="bg-[#6D2B35] text-white border-0 text-[10px] px-1.5 py-0">NEW</Badge>}
                  </div>
                  {n.body && <div className="text-xs text-stone-600 mt-0.5">{n.body}</div>}
                  <div className="text-[11px] text-stone-400 mt-1">{new Date(n.createdAt).toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {n.link && (
                    <Button asChild size="sm" variant="ghost" data-testid={`button-open-notif-${n.id}`}>
                      <a href={n.link}>Open</a>
                    </Button>
                  )}
                  {unreadRow && (
                    <Button size="sm" variant="ghost" onClick={() => markRead(n.id)} data-testid={`button-read-notif-${n.id}`}>
                      <Check className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
