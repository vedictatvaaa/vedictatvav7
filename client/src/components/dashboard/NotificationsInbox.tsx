import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, BellRing, Check, CheckCheck, Inbox } from "lucide-react";
import { listNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/dashboardApi";
import type { UserNotification } from "@shared/schema";

const KIND_ICON: Record<string, string> = {
  booking_accepted: "bg-emerald-100 text-emerald-800",
  booking_declined: "bg-rose-100 text-rose-800",
  booking_completed: "bg-sky-100 text-sky-800",
  order_paid: "bg-emerald-100 text-emerald-800",
  order_shipped: "bg-blue-100 text-blue-800",
  order_delivered: "bg-emerald-100 text-emerald-800",
  refund_initiated: "bg-amber-100 text-amber-800",
  loyalty_earned: "bg-[#D4AF37]/15 text-[#7a5a00]",
  system: "bg-stone-100 text-stone-800",
};

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = Math.max(1, Math.floor(ms / 1000));
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60); if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
}

export default function NotificationsInbox() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [items, setItems] = useState<UserNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    if (!user?.id || !user?.email) return;
    try {
      const { items, unread } = await listNotifications(user.id, user.email, { limit: 100 });
      setItems(items); setUnread(unread);
    } catch (e: any) {
      toast({ title: "Could not load notifications", description: e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const handleClick = async (n: UserNotification) => {
    if (!user?.id || !user?.email) return;
    if (!n.readAt) {
      try { await markNotificationRead(n.id, user.id, user.email); } catch {}
      setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, readAt: new Date() as any } : x)));
      setUnread((u) => Math.max(0, u - 1));
    }
    if (n.link) setLocation(n.link);
  };

  const handleMarkAll = async () => {
    if (!user?.id || !user?.email) return;
    try {
      const n = await markAllNotificationsRead(user.id, user.email);
      toast({ title: `Marked ${n} as read` });
      const now = new Date();
      setItems((prev) => prev.map((x) => (x.readAt ? x : { ...x, readAt: now as any })));
      setUnread(0);
    } catch (e: any) {
      toast({ title: "Failed", description: e?.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#4a1a22]">Notifications</h2>
          {unread > 0 && (
            <Badge className="bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" data-testid="badge-unread-count">
              {unread} new
            </Badge>
          )}
        </div>
        {unread > 0 && (
          <Button variant="outline" size="sm" onClick={handleMarkAll} data-testid="button-mark-all-read">
            <CheckCheck className="w-4 h-4 mr-1.5" /> Mark all read
          </Button>
        )}
      </div>

      {loading ? (
        <Card><CardContent className="p-10 text-center text-sm text-[#5a4a3a]/60">Loading…</CardContent></Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Inbox className="w-10 h-10 mx-auto text-[#5a4a3a]/30 mb-2" />
            <p className="text-sm text-[#5a4a3a]/70">No notifications yet. We'll let you know when there's an update on your bookings or orders.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {items.map((n) => {
            const isUnread = !n.readAt;
            const palette = KIND_ICON[n.kind] || KIND_ICON.system;
            return (
              <Card
                key={n.id}
                onClick={() => handleClick(n)}
                className={`cursor-pointer hover-elevate ${isUnread ? "border-[#D4AF37]/50 bg-[#FBF7EE]" : ""}`}
                data-testid={`notification-row-${n.id}`}
              >
                <CardContent className="p-3 md:p-4 flex items-start gap-3">
                  <div className={`shrink-0 h-9 w-9 rounded-full flex items-center justify-center ${palette}`}>
                    {isUnread ? <BellRing className="w-4 h-4" /> : <Bell className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className={`text-sm ${isUnread ? "font-bold text-[#4a1a22]" : "font-medium text-[#4a1a22]/85"} truncate`}>
                        {n.title}
                      </p>
                      {isUnread && <span className="h-2 w-2 rounded-full bg-[#6D2B35]" aria-label="unread" />}
                    </div>
                    {n.body && <p className="text-xs text-[#5a4a3a]/75 mt-0.5 line-clamp-2">{n.body}</p>}
                    <p className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/55 mt-1">{timeAgo(n.createdAt as any)}</p>
                  </div>
                  {!isUnread && <Check className="w-4 h-4 text-[#5a4a3a]/30 shrink-0" />}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
