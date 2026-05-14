import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bell, BellOff, ShoppingCart, RotateCcw, CalendarClock, UserCheck,
  ShoppingBag, PackageX, Activity, Volume2, VolumeX, CheckCheck,
} from "lucide-react";
import {
  Popover, PopoverContent, PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { createFetcher, type TabId } from "@/pages/admin-shared";

type CategoryKey =
  | "orders" | "returns" | "bookings" | "applications" | "abandoned" | "lowStock";

interface AlertCategory {
  label: string;
  count: number;
  latestId: number;
  tab: TabId;
}

interface AlertsPayload {
  generatedAt: number;
  uptimeSeconds: number;
  categories: Record<CategoryKey, AlertCategory>;
}

const ICONS: Record<CategoryKey, typeof Bell> = {
  orders: ShoppingCart,
  returns: RotateCcw,
  bookings: CalendarClock,
  applications: UserCheck,
  abandoned: ShoppingBag,
  lowStock: PackageX,
};

const SOUND_PREF_KEY = "vt-admin-alert-sound";
const SEEN_PREF_KEY = "vt-admin-alert-seen";
const POLL_INTERVAL_MS = 30_000;

interface SeenState {
  // category -> highest latestId already acknowledged
  [k: string]: number;
}

function readSeen(): SeenState {
  if (typeof window === "undefined") return {};
  try { return JSON.parse(localStorage.getItem(SEEN_PREF_KEY) || "{}"); }
  catch { return {}; }
}

function writeSeen(s: SeenState) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(SEEN_PREF_KEY, JSON.stringify(s)); } catch {}
}

// Plays a short two-note chime via WebAudio. No external asset needed.
// Gracefully no-ops on browsers that block AudioContext until user gesture.
function playChime() {
  try {
    const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const now = ctx.currentTime;
    const playNote = (freq: number, start: number, dur: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0, now + start);
      gain.gain.linearRampToValueAtTime(0.18, now + start + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + start + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(now + start);
      osc.stop(now + start + dur + 0.05);
    };
    // Soft maroon-gold chime: G5 then C6
    playNote(784, 0, 0.4);
    playNote(1047, 0.18, 0.55);
    setTimeout(() => { ctx.close().catch(() => {}); }, 1200);
  } catch { /* ignore — no audio in this browser */ }
}

interface AdminAlertsBellProps {
  adminToken?: string;
  onJumpToTab: (id: TabId) => void;
}

export function AdminAlertsBell({ adminToken, onJumpToTab }: AdminAlertsBellProps) {
  const fetcher = useMemo(() => createFetcher(adminToken), [adminToken]);
  const { toast } = useToast();

  const [soundOn, setSoundOn] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem(SOUND_PREF_KEY) !== "0";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(SOUND_PREF_KEY, soundOn ? "1" : "0");
  }, [soundOn]);

  const [open, setOpen] = useState(false);
  const seenRef = useRef<SeenState>(readSeen());
  const firstLoadRef = useRef(true);
  // Bumped whenever seenRef mutates so derived memos (totalUnseen, isNew
  // per row) recompute without waiting for the next poll.
  const [seenVersion, setSeenVersion] = useState(0);
  const bumpSeen = () => setSeenVersion((v) => v + 1);

  const { data, isError, dataUpdatedAt } = useQuery<AlertsPayload>({
    queryKey: ["/api/admin/alerts"],
    queryFn: () => fetcher("/api/admin/alerts"),
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    staleTime: 5_000,
  });

  // Tick once a second so the "updated Ns ago" label re-renders even when
  // the underlying query data hasn't changed.
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 5_000);
    return () => clearInterval(id);
  }, []);
  const lastUpdatedLabel = useMemo(() => {
    if (!dataUpdatedAt) return "—";
    const secs = Math.max(0, Math.round((Date.now() - dataUpdatedAt) / 1000));
    if (secs < 5) return "just now";
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.round(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.round(mins / 60);
    return `${hrs}h ago`;
    // tick included so this re-renders without needing new data.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dataUpdatedAt, tick]);

  // Detect "new since last seen" → toast + sound. Skip the very first load
  // so we don't blast a chime as soon as the admin opens the page.
  useEffect(() => {
    if (!data) return;
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      // Initialize seen baseline so existing items are not announced.
      const baseline: SeenState = {};
      (Object.keys(data.categories) as CategoryKey[]).forEach((k) => {
        baseline[k] = Math.max(seenRef.current[k] || 0, data.categories[k].latestId);
      });
      seenRef.current = baseline;
      writeSeen(baseline);
      return;
    }
    let anythingNew = false;
    (Object.keys(data.categories) as CategoryKey[]).forEach((k) => {
      const cat = data.categories[k];
      const lastSeen = seenRef.current[k] || 0;
      if (cat.latestId > lastSeen && cat.count > 0) {
        anythingNew = true;
        toast({
          title: cat.label,
          description: `${cat.count} item${cat.count === 1 ? "" : "s"} need attention.`,
        });
      }
    });
    if (anythingNew && soundOn) playChime();
  }, [data, toast, soundOn]);

  const totalUnseen = useMemo(() => {
    if (!data) return 0;
    let n = 0;
    (Object.keys(data.categories) as CategoryKey[]).forEach((k) => {
      const cat = data.categories[k];
      if (cat.latestId > (seenRef.current[k] || 0)) n += cat.count;
    });
    return n;
    // seenVersion intentionally included so this recomputes on ack.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, seenVersion]);

  const totalActive = useMemo(() => {
    if (!data) return 0;
    return (Object.keys(data.categories) as CategoryKey[])
      .reduce((sum, k) => sum + data.categories[k].count, 0);
  }, [data]);

  const acknowledgeAll = () => {
    if (!data) return;
    const next: SeenState = { ...seenRef.current };
    (Object.keys(data.categories) as CategoryKey[]).forEach((k) => {
      next[k] = Math.max(next[k] || 0, data.categories[k].latestId);
    });
    seenRef.current = next;
    writeSeen(next);
    bumpSeen();
  };

  const handleJump = (cat: AlertCategory, key: CategoryKey) => {
    const next: SeenState = { ...seenRef.current, [key]: cat.latestId };
    seenRef.current = next;
    writeSeen(next);
    bumpSeen();
    onJumpToTab(cat.tab);
    setOpen(false);
  };

  const uptimeLabel = useMemo(() => {
    if (!data) return "—";
    const s = data.uptimeSeconds;
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d ${Math.floor((s % 86400) / 3600)}h`;
  }, [data]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label="Admin alerts"
          data-testid="button-admin-alerts"
        >
          {isError ? (
            <BellOff className="w-5 h-5 text-destructive" />
          ) : (
            <Bell className="w-5 h-5" />
          )}
          {totalUnseen > 0 && (
            <span
              className="absolute -top-0.5 -right-0.5 min-w-[1.1rem] h-[1.1rem] px-1 rounded-full bg-[hsl(var(--secondary))] text-[hsl(var(--secondary-foreground))] text-[10px] font-bold flex items-center justify-center ring-2 ring-background"
              data-testid="badge-admin-alerts-count"
            >
              {totalUnseen > 99 ? "99+" : totalUnseen}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0" data-testid="popover-admin-alerts">
        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold">Alerts</span>
            <span
              className={`flex items-center gap-1 text-[10px] ${
                isError ? "text-destructive" : "text-muted-foreground"
              }`}
              title={isError ? "Connection error" : `Updated ${lastUpdatedLabel}`}
              data-testid="admin-alerts-connection"
            >
              <span
                aria-hidden="true"
                className={`w-1.5 h-1.5 rounded-full ${
                  isError
                    ? "bg-destructive"
                    : "bg-emerald-500 animate-pulse"
                }`}
              />
              {isError ? "Offline" : lastUpdatedLabel}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => setSoundOn((v) => !v)}
              aria-label={soundOn ? "Mute alert sound" : "Unmute alert sound"}
              title={soundOn ? "Sound on (click to mute)" : "Sound off (click to enable)"}
              data-testid="button-admin-alerts-sound"
            >
              {soundOn ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={acknowledgeAll}
              disabled={totalUnseen === 0}
              data-testid="button-admin-alerts-mark-read"
            >
              <CheckCheck className="w-3.5 h-3.5 mr-1" />
              Mark seen
            </Button>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto py-1">
          {!data ? (
            <div className="px-3 py-6 text-xs text-muted-foreground text-center">
              Loading alerts...
            </div>
          ) : totalActive === 0 ? (
            <div className="px-3 py-8 text-center">
              <div className="text-sm font-medium text-foreground mb-1">All clear</div>
              <div className="text-xs text-muted-foreground">
                No new orders, returns, bookings or applications need your attention.
              </div>
            </div>
          ) : (
            (Object.keys(data.categories) as CategoryKey[]).map((k) => {
              const cat = data.categories[k];
              if (cat.count === 0) return null;
              const Icon = ICONS[k];
              const isNew = cat.latestId > (seenRef.current[k] || 0);
              return (
                <button
                  key={k}
                  onClick={() => handleJump(cat, k)}
                  className="w-full flex items-center gap-3 px-3 py-2.5 text-left hover-elevate"
                  data-testid={`alert-row-${k}`}
                >
                  <div className={`shrink-0 w-8 h-8 rounded-md flex items-center justify-center ${
                    isNew ? "bg-[hsl(var(--secondary))]/20 text-[hsl(var(--primary))]" : "bg-muted text-muted-foreground"
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{cat.label}</div>
                    <div className="text-xs text-muted-foreground">
                      {cat.count} item{cat.count === 1 ? "" : "s"}
                    </div>
                  </div>
                  {isNew && (
                    <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                      New
                    </Badge>
                  )}
                </button>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between gap-2 px-3 py-2 border-t bg-muted/40 text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Server up {uptimeLabel}</span>
          </div>
          <span>Polled every 30s</span>
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default AdminAlertsBell;
