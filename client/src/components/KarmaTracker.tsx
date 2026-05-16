// =====================================================================
// KarmaTracker — gamified Karma + Dharma score widget for the spiritual
// dashboard. Lets the user log japa, charity, fasting, temple visits,
// gauseva, and pind daan, and shows live aggregated scores + a streak +
// upcoming festival reminders. Backend: /api/spiritual/* + /api/festivals.
// =====================================================================
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Sparkles, Flame, HandHeart, Plus, Calendar, Loader2,
  Award, Hash, Heart,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth";

type Dashboard = {
  totals: { karma: number; dharma: number; japa: number; charity: number;
            fasting: number; temple: number; gauseva: number; pind_daan: number };
  level: number;
  nextLevelAt: number;
  karmaToNextLevel: number;
  fastingStreak: number;
  activityCount: number;
  recent: Array<{ id: number; activityType: string; value: number; karmaPoints: number;
                  dharmaPoints: number; performedAt: string; notes?: string | null }>;
  upcomingFestivals: Array<{ id: number; name: string; date: string; description?: string | null;
                              preparationNotes?: string | null; importance: string }>;
};

const ACTIVITIES: Array<{
  type: "japa" | "charity" | "fasting" | "temple" | "gauseva" | "pind_daan";
  label: string; unit: string; placeholder: string; icon: any; tint: string;
}> = [
  { type: "japa",      label: "Japa",        unit: "mantras",  placeholder: "108", icon: Hash,      tint: "from-violet-500/20 to-violet-500/5" },
  { type: "charity",   label: "Charity",     unit: "₹ donated", placeholder: "501", icon: HandHeart, tint: "from-rose-500/20 to-rose-500/5" },
  { type: "fasting",   label: "Fasting",     unit: "days",      placeholder: "1",   icon: Flame,     tint: "from-amber-500/20 to-amber-500/5" },
  { type: "temple",    label: "Temple Visit", unit: "visits",   placeholder: "1",   icon: Sparkles,  tint: "from-emerald-500/20 to-emerald-500/5" },
  { type: "gauseva",   label: "Gauseva",     unit: "sevas",     placeholder: "1",   icon: Heart,     tint: "from-pink-500/20 to-pink-500/5" },
  { type: "pind_daan", label: "Pind Daan",   unit: "rituals",   placeholder: "1",   icon: Award,     tint: "from-primary/20 to-primary/5" },
];

function fmt(n: number) { return new Intl.NumberFormat("en-IN").format(n); }

export function KarmaTracker() {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [pick, setPick] = useState<typeof ACTIVITIES[number] | null>(null);
  const [val, setVal] = useState("");
  const [notes, setNotes] = useState("");

  const headers: Record<string, string> = user
    ? { "x-user-id": String(user.id), "x-user-email": user.email }
    : {};

  const { data, isLoading } = useQuery<Dashboard>({
    queryKey: ["/api/spiritual/dashboard"],
    enabled: !!user,
    queryFn: () => fetch("/api/spiritual/dashboard", { headers }).then((r) => {
      if (!r.ok) throw new Error("Failed");
      return r.json();
    }),
  });

  const log = useMutation({
    mutationFn: (body: { activityType: string; value: number; notes?: string }) =>
      fetch("/api/spiritual/log", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...headers },
        body: JSON.stringify(body),
      }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); }),
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ["/api/spiritual/dashboard"] });
      const k = resp?.activity?.karmaPoints || 0;
      const d = resp?.activity?.dharmaPoints || 0;
      toast({
        title: "Logged",
        description: `+${k} Karma · +${d} Dharma`,
      });
      setOpen(false); setPick(null); setVal(""); setNotes("");
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  if (!user) {
    return (
      <Card className="bg-gradient-to-br from-[#FBF6EC] to-white border-[#D4AF37]/20" data-testid="karma-tracker-locked">
        <CardContent className="p-6 text-center">
          <Sparkles className="h-10 w-10 mx-auto text-[#D4AF37] mb-2" />
          <h3 className="font-serif text-lg font-bold text-[#6D2B35]">Karma & Dharma Tracker</h3>
          <p className="text-sm text-[#5a4a3a]/70 mt-1">Sign in to start tracking your spiritual progress.</p>
        </CardContent>
      </Card>
    );
  }

  const progressPct = data && data.nextLevelAt > 0
    ? Math.min(100, Math.round((data.totals.karma / data.nextLevelAt) * 100))
    : 0;

  return (
    <section className="space-y-4" data-testid="section-karma-tracker">
      {/* Score header */}
      <div className="grid gap-3 grid-cols-1 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-[#6D2B35] to-[#8B3A3A] text-white border-0" data-testid="card-karma-score">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider opacity-80">Karma Score</span>
              <Award className="h-5 w-5 opacity-90" />
            </div>
            <div className="text-4xl font-serif font-bold mt-2" data-testid="text-karma-total">
              {isLoading ? "—" : fmt(data?.totals.karma || 0)}
            </div>
            <div className="mt-3 text-xs opacity-90">
              Level <span className="font-bold" data-testid="text-karma-level">{data?.level || 1}</span>
              {data && data.karmaToNextLevel > 0 && (
                <span className="opacity-75"> · {fmt(data.karmaToNextLevel)} to next level</span>
              )}
            </div>
            <Progress value={progressPct} className="mt-2 h-1.5 bg-white/20" />
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-[#D4AF37] to-[#B8941F] text-white border-0" data-testid="card-dharma-score">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider opacity-90">Dharma Score</span>
              <HandHeart className="h-5 w-5 opacity-90" />
            </div>
            <div className="text-4xl font-serif font-bold mt-2" data-testid="text-dharma-total">
              {isLoading ? "—" : fmt(data?.totals.dharma || 0)}
            </div>
            <div className="mt-3 text-xs opacity-95">Service · Charity · Ancestral duty</div>
          </CardContent>
        </Card>

        <Card data-testid="card-streak">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-muted-foreground">Fasting Streak</span>
              <Flame className="h-5 w-5 text-amber-500" />
            </div>
            <div className="text-4xl font-serif font-bold mt-2 text-[#6D2B35]" data-testid="text-streak">
              {isLoading ? "—" : (data?.fastingStreak || 0)}{" "}
              <span className="text-sm font-sans font-normal text-muted-foreground">days</span>
            </div>
            <div className="mt-3 text-xs text-muted-foreground">{data?.activityCount || 0} total acts logged</div>
          </CardContent>
        </Card>
      </div>

      {/* Per-activity tiles + log button */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-baseline justify-between mb-4 gap-3 flex-wrap">
            <div>
              <h3 className="font-serif text-lg font-bold text-[#6D2B35]">Spiritual Activities</h3>
              <p className="text-xs text-muted-foreground">Tap any tile to log a new entry.</p>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" data-testid="button-quick-log"
                        onClick={() => setPick(ACTIVITIES[0])}>
                  <Plus className="h-4 w-4 mr-1.5" /> Quick Log
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Log {pick?.label || "activity"}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    {ACTIVITIES.map((a) => (
                      <button key={a.type}
                        onClick={() => setPick(a)}
                        className={`p-3 rounded-lg border text-xs flex flex-col items-center gap-1 hover-elevate ${
                          pick?.type === a.type ? "border-primary bg-primary/5" : "border-border"
                        }`}
                        data-testid={`pick-${a.type}`}>
                        <a.icon className="h-4 w-4" />
                        {a.label}
                      </button>
                    ))}
                  </div>
                  {pick && (
                    <>
                      <div>
                        <Label>{pick.unit}</Label>
                        <Input type="number" inputMode="numeric" min="1" value={val}
                          placeholder={pick.placeholder}
                          onChange={(e) => setVal(e.target.value)}
                          data-testid="input-log-value" />
                      </div>
                      <div>
                        <Label>Notes (optional)</Label>
                        <Input value={notes} onChange={(e) => setNotes(e.target.value)}
                          placeholder="At my home temple..." data-testid="input-log-notes" />
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <Button data-testid="button-save-log"
                    disabled={!pick || !val || Number(val) <= 0 || log.isPending}
                    onClick={() => log.mutate({
                      activityType: pick!.type, value: Number(val),
                      notes: notes || undefined,
                    })}>
                    {log.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                    Save Activity
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-3 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
            {ACTIVITIES.map((a) => {
              const total = data?.totals[a.type] || 0;
              return (
                <button key={a.type}
                  onClick={() => { setPick(a); setOpen(true); }}
                  className={`p-4 rounded-xl border bg-gradient-to-br ${a.tint} text-left hover-elevate active-elevate-2`}
                  data-testid={`tile-${a.type}`}>
                  <a.icon className="h-5 w-5 text-[#6D2B35] mb-2" />
                  <div className="text-xs text-muted-foreground">{a.label}</div>
                  <div className="text-xl font-serif font-bold text-[#6D2B35]">{fmt(total)}</div>
                  <div className="text-[10px] text-muted-foreground">{a.unit}</div>
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Upcoming festivals */}
      {data && data.upcomingFestivals.length > 0 && (
        <Card data-testid="card-upcoming-festivals">
          <CardContent className="p-5">
            <div className="flex items-baseline justify-between mb-3">
              <h3 className="font-serif text-lg font-bold text-[#6D2B35] flex items-center gap-2">
                <Calendar className="h-5 w-5" /> Upcoming Festivals
              </h3>
              <span className="text-xs text-muted-foreground">Reminder email 7 days prior</span>
            </div>
            <div className="space-y-2">
              {data.upcomingFestivals.map((f) => {
                const days = Math.ceil((new Date(f.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
                return (
                  <div key={f.id} className="flex items-start gap-3 p-3 rounded-lg bg-[#FBF6EC]/60 border border-[#D4AF37]/15"
                       data-testid={`festival-${f.id}`}>
                    <div className="w-12 h-12 rounded-lg bg-[#6D2B35]/10 flex flex-col items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-[#6D2B35]">
                        {new Date(f.date).toLocaleDateString("en-IN", { month: "short" })}
                      </span>
                      <span className="text-base font-serif font-bold text-[#6D2B35] -mt-0.5">
                        {new Date(f.date).getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-semibold text-[#6D2B35]">{f.name}</h4>
                        <Badge variant="outline" className="text-[10px]">in {days}d</Badge>
                        {f.importance === "high" && (
                          <Badge className="bg-primary/10 text-primary text-[10px]">major</Badge>
                        )}
                      </div>
                      {f.preparationNotes && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{f.preparationNotes}</p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}

export default KarmaTracker;
