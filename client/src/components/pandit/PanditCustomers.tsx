import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { panditApi } from "@/lib/panditAuth";
import {
  Users, Search, Phone, Loader2, Repeat, Wallet, Calendar, CalendarHeart,
  Plus, Trash2, Bell, Cake, Flame, Gift, Sparkles, AlertCircle,
} from "lucide-react";
import { PanditEmptyState, PanditErrorState, PanditKpi, PanditKpiGrid, PanditLoadingState, PanditSectionHeader } from "@/components/pandit/PanditSection";

type Customer = {
  key: string; userId: number | null; name: string; phone: string;
  totalBookings: number; totalSpent: number;
  completedCount: number; pendingCount: number; cancelledCount: number;
  lastBookingDate: string | null; lastPujaType: string | null;
};
type Resp = { customers: Customer[]; summary: { totalCustomers: number; repeatCustomers: number; lifetimeValue: number } };
type Booking = { id: number; pujaType: string; date: string; status: string; totalAmount: number; mode: string; createdAt: string };
type Memory = {
  id: number; customerKey: string; customerName: string; customerPhone: string | null;
  kind: string; label: string; dateText: string | null; tithi: string | null;
  notifyDaysBefore: number; notes: string | null; createdAt: string;
};
type UpcomingMemory = { memory: Memory; nextDate: string; daysAway: number };

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

const KIND_OPTIONS: Array<{ value: string; label: string; icon: any }> = [
  { value: "birthday", label: "Birthday", icon: Cake },
  { value: "anniversary", label: "Anniversary", icon: Gift },
  { value: "shradh", label: "Shradh tithi", icon: Flame },
  { value: "naamkaran", label: "Naamkaran", icon: Sparkles },
  { value: "mundan", label: "Mundan", icon: Sparkles },
  { value: "griha_pravesh", label: "Griha pravesh", icon: Sparkles },
  { value: "other", label: "Other", icon: CalendarHeart },
];
const kindIcon = (k: string) => KIND_OPTIONS.find((o) => o.value === k)?.icon || CalendarHeart;
const kindLabel = (k: string) => KIND_OPTIONS.find((o) => o.value === k)?.label || k;

export default function PanditCustomers() {
  const { toast } = useToast();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [tab, setTab] = useState<"list" | "upcoming">("list");
  const [drillKey, setDrillKey] = useState<string | null>(null);
  const [drillBookings, setDrillBookings] = useState<Booking[]>([]);
  const [drillMemories, setDrillMemories] = useState<Memory[]>([]);
  const [drillLoading, setDrillLoading] = useState(false);
  const [drillError, setDrillError] = useState<string | null>(null);
  const [drillTab, setDrillTab] = useState<"bookings" | "memories">("bookings");

  // Upcoming-tithi tab payload
  const [upcoming, setUpcoming] = useState<UpcomingMemory[]>([]);
  const [upcomingLoading, setUpcomingLoading] = useState(false);
  const [upcomingError, setUpcomingError] = useState<string | null>(null);

  // New-memory form
  const [memOpen, setMemOpen] = useState(false);
  const [memSubmitting, setMemSubmitting] = useState(false);
  const [memForm, setMemForm] = useState({ kind: "birthday", label: "", dateText: "", tithi: "", notifyDaysBefore: "3", notes: "" });

  async function load() {
    setLoading(true);
    setError(null);
    try { setData(await panditApi("GET", "/api/pandit/customers") as Resp); }
    catch (e: any) { setError(e?.message || "Your customers could not be loaded."); toast({ title: "Failed to load customers", description: e?.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { void load(); }, []);

  async function loadUpcoming() {
    setUpcomingLoading(true);
    setUpcomingError(null);
    try {
      const r = await panditApi("GET", "/api/pandit/memories/upcoming") as { upcoming: UpcomingMemory[] };
      setUpcoming(r.upcoming || []);
    } catch (e: any) { setUpcomingError(e?.message || "Upcoming dates could not be loaded."); toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
    finally { setUpcomingLoading(false); }
  }
  useEffect(() => { if (tab === "upcoming") loadUpcoming(); }, [tab]);

  const filtered = useMemo(() => {
    if (!data?.customers) return [];
    const term = q.trim().toLowerCase();
    if (!term) return data.customers;
    return data.customers.filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || (c.lastPujaType || "").toLowerCase().includes(term));
  }, [data, q]);

  async function openDrill(key: string) {
    setDrillKey(key);
    setDrillTab("bookings");
    setDrillLoading(true);
    setDrillError(null);
    setDrillBookings([]);
    setDrillMemories([]);
    try {
      const [b, m] = await Promise.all([
        panditApi("GET", `/api/pandit/customers/${encodeURIComponent(key)}/bookings`) as Promise<{ bookings: Booking[] }>,
        panditApi("GET", `/api/pandit/customers/${encodeURIComponent(key)}/memories`) as Promise<{ memories: Memory[] }>,
      ]);
      setDrillBookings(b.bookings || []);
      setDrillMemories(m.memories || []);
    } catch (e: any) { setDrillError(e?.message || "This customer history could not be loaded."); toast({ title: "Failed to load", description: e?.message, variant: "destructive" }); }
    finally { setDrillLoading(false); }
  }

  async function reloadDrillMemories() {
    if (!drillKey) return;
    try {
      const m = await panditApi("GET", `/api/pandit/customers/${encodeURIComponent(drillKey)}/memories`) as { memories: Memory[] };
      setDrillMemories(m.memories || []);
    } catch {}
  }

  async function submitMemory() {
    if (!drillKey || !drillCustomer) return;
    if (!memForm.label.trim()) { toast({ title: "Label is required", variant: "destructive" }); return; }
    if (!memForm.dateText.trim() && !memForm.tithi.trim()) {
      toast({ title: "Add either a date or a tithi", variant: "destructive" }); return;
    }
    setMemSubmitting(true);
    try {
      await panditApi("POST", "/api/pandit/memories", {
        customerKey: drillKey,
        customerName: drillCustomer.name,
        customerPhone: drillCustomer.phone,
        kind: memForm.kind,
        label: memForm.label.trim(),
        dateText: memForm.dateText.trim() || undefined,
        tithi: memForm.tithi.trim() || undefined,
        notifyDaysBefore: Math.max(0, Math.min(60, Number(memForm.notifyDaysBefore) || 3)),
        notes: memForm.notes.trim() || undefined,
      });
      toast({ title: "Saved" });
      setMemOpen(false);
      setMemForm({ kind: "birthday", label: "", dateText: "", tithi: "", notifyDaysBefore: "3", notes: "" });
      reloadDrillMemories();
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
    finally { setMemSubmitting(false); }
  }

  async function deleteMemory(id: number) {
    if (!confirm("Delete this saved date?")) return;
    try {
      await panditApi("DELETE", `/api/pandit/memories/${id}`);
      reloadDrillMemories();
      if (tab === "upcoming") loadUpcoming();
      toast({ title: "Deleted" });
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
  }

  const drillCustomer = drillKey ? data?.customers.find((c) => c.key === drillKey) : null;

  if (loading) return <PanditLoadingState label="Loading customers…" />;
  if (error) return <div className="space-y-5"><PanditSectionHeader title="Customers" description="Know your yajamanas, their history, and the moments worth remembering." /><PanditErrorState detail={error} onRetry={load} /></div>;
  if (!data) return <div className="space-y-5"><PanditSectionHeader title="Customers" description="Know your yajamanas, their history, and the moments worth remembering." /><PanditEmptyState icon={Users} title="Customers are not available yet" detail="Customer history will appear here after your first completed booking." /></div>;

  return (
    <div className="space-y-5" data-testid="pandit-customers">
      <PanditSectionHeader title="Customers" description="Know your yajamanas, their history, and the moments worth remembering." />
      <PanditKpiGrid className="md:grid-cols-3">
        {[
          { l: "Total customers", v: data.summary.totalCustomers, i: Users },
          { l: "Repeat yajamanas", v: data.summary.repeatCustomers, i: Repeat },
          { l: "Lifetime value", v: inr(data.summary.lifetimeValue), i: Wallet },
        ].map((k, i) => {
          const I = k.i;
          return (
            <PanditKpi key={i} label={k.l} value={k.v} icon={I} testId={`cust-kpi-${i}`} />
          );
        })}
      </PanditKpiGrid>

      <Tabs value={tab} onValueChange={(v) => setTab(v as any)}>
        <TabsList className="flex max-w-full overflow-x-auto justify-start">
          <TabsTrigger value="list" data-testid="tab-cust-list"><Users className="h-3.5 w-3.5 mr-1.5" />All yajamanas</TabsTrigger>
          <TabsTrigger value="upcoming" data-testid="tab-cust-upcoming"><Bell className="h-3.5 w-3.5 mr-1.5" />Upcoming tithis</TabsTrigger>
        </TabsList>

        <TabsContent value="list" className="space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/50" />
            <Input className="pl-9" placeholder="Search by name, phone, or puja…" value={q} onChange={(e) => setQ(e.target.value)} data-testid="input-cust-search" />
          </div>

          <Card>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <PanditEmptyState icon={q ? Search : Users} title={q ? "No customers match your search" : "No customers yet"} detail={q ? "Try a different name, phone number, or puja." : "They’ll appear here once you complete bookings."} />
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-[#FBF7EE] text-[#5a4a3a]/70 uppercase tracking-wide">
                      <tr>
                        <th className="text-left p-2.5">Yajamana</th>
                        <th className="text-left p-2.5">Phone</th>
                        <th className="text-right p-2.5">Bookings</th>
                        <th className="text-right p-2.5">Lifetime spend</th>
                        <th className="text-left p-2.5">Last puja</th>
                        <th className="p-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((c) => (
                        <tr key={c.key} className="border-t border-[#D4AF37]/15 hover-elevate" data-testid={`cust-row-${c.key}`}>
                          <td className="p-2.5">
                            <div className="font-bold text-[#4a1a22]">{c.name}</div>
                            <div className="flex flex-wrap gap-1 mt-0.5">
                              {c.completedCount > 0 && <Badge variant="outline" className="text-[9px]">{c.completedCount} done</Badge>}
                              {c.pendingCount > 0 && <Badge variant="outline" className="text-[9px] border-amber-500/40 text-amber-700">{c.pendingCount} pending</Badge>}
                              {c.totalBookings > 1 && <Badge className="text-[9px] bg-[#D4AF37]/20 text-[#6D2B35] border-[#D4AF37]/40">repeat</Badge>}
                            </div>
                          </td>
                          <td className="p-2.5 font-mono text-[#5a4a3a]/85">{c.phone}</td>
                          <td className="p-2.5 text-right font-mono">{c.totalBookings}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#4a1a22]">{inr(c.totalSpent)}</td>
                          <td className="p-2.5 text-[#5a4a3a]/85">
                            <div>{c.lastPujaType || "—"}</div>
                            <div className="text-[10px] text-[#5a4a3a]/60">{c.lastBookingDate ? new Date(c.lastBookingDate).toLocaleDateString() : ""}</div>
                          </td>
                          <td className="p-2.5 text-right space-x-1 whitespace-nowrap">
                            <Button size="sm" variant="outline" onClick={() => openDrill(c.key)} data-testid={`btn-cust-view-${c.key}`}>View</Button>
                            <Button size="sm" variant="outline" asChild><a href={`tel:${c.phone}`} data-testid={`btn-cust-call-${c.key}`}><Phone className="h-3 w-3" /></a></Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingLoading ? (
            <Card><CardContent className="p-10 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>
          ) : upcomingError ? (
            <PanditErrorState title="Upcoming dates could not be loaded" detail={upcomingError} onRetry={loadUpcoming} />
          ) : upcoming.length === 0 ? (
            <PanditEmptyState icon={Bell} title="No upcoming dates" detail="There are no saved dates in the next 60 days. Add one from a yajamana profile." />
          ) : (
            <div className="space-y-2">
              {upcoming.map((u) => {
                const I = kindIcon(u.memory.kind);
                const urgent = u.daysAway <= u.memory.notifyDaysBefore;
                return (
                  <Card key={u.memory.id} className={urgent ? "border-[#D4AF37]/60" : ""} data-testid={`upcoming-${u.memory.id}`}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`h-9 w-9 rounded-md flex items-center justify-center shrink-0 ${urgent ? "bg-[#D4AF37]/20" : "bg-[#FBF7EE]"}`}>
                          <I className="h-4 w-4 text-[#6D2B35]" />
                        </div>
                        <div className="min-w-0">
                          <div className="font-bold text-[#4a1a22] text-sm truncate">{u.memory.customerName} — {u.memory.label}</div>
                          <div className="text-[11px] text-[#5a4a3a]/70 mt-0.5">
                            {kindLabel(u.memory.kind)} · {new Date(u.nextDate).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}
                            {u.memory.tithi ? ` · ${u.memory.tithi}` : ""}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <Badge className={urgent
                          ? "bg-[#D4AF37]/20 text-[#6D2B35] border-[#D4AF37]/40"
                          : "bg-stone-100 text-stone-600 border-stone-300"}>
                          {u.daysAway === 0 ? "Today" : u.daysAway === 1 ? "Tomorrow" : `in ${u.daysAway} days`}
                        </Badge>
                        {u.memory.customerPhone && (
                          <div className="mt-1.5">
                            <Button size="sm" variant="outline" asChild>
                              <a href={`tel:${u.memory.customerPhone}`}><Phone className="h-3 w-3 mr-1" />Call</a>
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={!!drillKey} onOpenChange={(v) => { if (!v) { setDrillKey(null); setDrillBookings([]); setDrillMemories([]); setDrillError(null); } }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-[#4a1a22]">{drillCustomer?.name}</DialogTitle>
          </DialogHeader>
          {drillLoading ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : drillError ? (
            <PanditErrorState title="Customer history could not be loaded" detail={drillError} onRetry={() => { if (drillKey) void openDrill(drillKey); }} />
          ) : (
            <Tabs value={drillTab} onValueChange={(v) => setDrillTab(v as any)}>
              <TabsList>
                <TabsTrigger value="bookings" data-testid="tab-drill-bookings">Bookings ({drillBookings.length})</TabsTrigger>
                <TabsTrigger value="memories" data-testid="tab-drill-memories"><CalendarHeart className="h-3.5 w-3.5 mr-1.5" />Saved dates ({drillMemories.length})</TabsTrigger>
              </TabsList>

              <TabsContent value="bookings" className="space-y-2 max-h-[60vh] overflow-y-auto">
                {drillBookings.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#5a4a3a]/65">No bookings yet.</div>
                ) : drillBookings.map((b) => (
                  <Card key={b.id} data-testid={`drill-bk-${b.id}`}>
                    <CardContent className="p-3 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-bold text-[#4a1a22] text-sm">{b.pujaType}</div>
                        <div className="text-[11px] text-[#5a4a3a]/70 mt-0.5 flex items-center gap-2">
                          <Calendar className="h-3 w-3" />{b.date} · <span className="capitalize">{b.mode}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono font-bold text-[#4a1a22]">{inr(b.totalAmount)}</div>
                        <Badge variant="outline" className="capitalize text-[9px] mt-1">{b.status}</Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              <TabsContent value="memories" className="space-y-2 max-h-[60vh] overflow-y-auto">
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-[#5a4a3a]/65">Save birthdays, anniversaries, and shradh tithis. The dashboard reminds you ahead of time so you can reach out personally.</p>
                  <Button size="sm" onClick={() => setMemOpen(true)} className="bg-[#6D2B35] hover:bg-[#6D2B35]" data-testid="btn-add-memory">
                    <Plus className="h-3 w-3 mr-1" />Add date
                  </Button>
                </div>
                {drillMemories.length === 0 ? (
                  <div className="p-6 text-center text-sm text-[#5a4a3a]/65 border border-dashed border-[#D4AF37]/30 rounded-md">
                    <AlertCircle className="h-5 w-5 mx-auto mb-1.5 text-[#5a4a3a]/40" />
                    No saved dates yet. Click "Add date" to remember a birthday, anniversary, or shradh tithi.
                  </div>
                ) : drillMemories.map((m) => {
                  const I = kindIcon(m.kind);
                  return (
                    <Card key={m.id} data-testid={`drill-mem-${m.id}`}>
                      <CardContent className="p-3 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="h-9 w-9 rounded-md bg-[#FBF7EE] flex items-center justify-center shrink-0">
                            <I className="h-4 w-4 text-[#6D2B35]" />
                          </div>
                          <div className="min-w-0">
                            <div className="font-bold text-[#4a1a22] text-sm">{m.label}</div>
                            <div className="text-[11px] text-[#5a4a3a]/70 mt-0.5">
                              {kindLabel(m.kind)}
                              {m.dateText ? ` · ${new Date(m.dateText).toLocaleDateString("en-IN", { day: "numeric", month: "long" })}` : ""}
                              {m.tithi ? ` · ${m.tithi}` : ""}
                              {` · remind ${m.notifyDaysBefore}d before`}
                            </div>
                            {m.notes && <div className="text-[11px] text-[#5a4a3a]/60 italic mt-0.5">{m.notes}</div>}
                          </div>
                        </div>
                        <Button size="icon" variant="ghost" onClick={() => deleteMemory(m.id)} data-testid={`btn-del-mem-${m.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-[#6D2B35]" />
                        </Button>
                      </CardContent>
                    </Card>
                  );
                })}
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={memOpen} onOpenChange={setMemOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4a1a22]">Save a date for {drillCustomer?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold">Type</label>
              <Select value={memForm.kind} onValueChange={(v) => setMemForm({ ...memForm, kind: v })}>
                <SelectTrigger className="mt-1" data-testid="select-mem-kind"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {KIND_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Label (e.g. Father's shradh, Wedding anniversary)" value={memForm.label} onChange={(e) => setMemForm({ ...memForm, label: e.target.value })} data-testid="input-mem-label" />
            <div className="grid grid-cols-2 gap-2">
              <Input type="date" value={memForm.dateText} onChange={(e) => setMemForm({ ...memForm, dateText: e.target.value })} data-testid="input-mem-date" />
              <Input placeholder="Tithi (optional)" value={memForm.tithi} onChange={(e) => setMemForm({ ...memForm, tithi: e.target.value })} data-testid="input-mem-tithi" />
            </div>
            <div>
              <label className="text-[11px] uppercase tracking-wide text-[#5a4a3a]/65 font-bold">Remind me</label>
              <Select value={memForm.notifyDaysBefore} onValueChange={(v) => setMemForm({ ...memForm, notifyDaysBefore: v })}>
                <SelectTrigger className="mt-1" data-testid="select-mem-notify"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">On the day</SelectItem>
                  <SelectItem value="1">1 day before</SelectItem>
                  <SelectItem value="3">3 days before</SelectItem>
                  <SelectItem value="7">7 days before</SelectItem>
                  <SelectItem value="15">15 days before</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Textarea rows={2} placeholder="Note (optional)" value={memForm.notes} onChange={(e) => setMemForm({ ...memForm, notes: e.target.value })} data-testid="input-mem-notes" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemOpen(false)} disabled={memSubmitting}>Cancel</Button>
            <Button onClick={submitMemory} disabled={memSubmitting} className="bg-[#6D2B35] hover:bg-[#6D2B35]" data-testid="btn-submit-memory">
              {memSubmitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Save date
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
