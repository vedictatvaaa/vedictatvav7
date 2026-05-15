import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { CalendarDays, MessageSquare, ClipboardList, CheckCircle2, XCircle, Clock, IndianRupee, LogOut, Plus, Trash2, Send, Lock, Sparkles, MapPin, Phone, Video, Mic, LayoutDashboard, Wallet, Share2, Wrench, Music2, Users, Star, Crown, Bell, Settings as SettingsIcon } from "lucide-react";
import { clearPanditToken, getPanditToken, panditApi } from "@/lib/panditAuth";
import PanditEarnings from "@/components/pandit/PanditEarnings";
import PanditCustomers from "@/components/pandit/PanditCustomers";
import PanditTools from "@/components/pandit/PanditTools";
import JapCounter from "@/components/JapCounter";
import PanditMembership from "@/components/pandit/PanditMembership";
import { PanditStorefrontEditor, PanditCardOrders, PanditReferralsPanel } from "@/components/pandit/PanditStorefrontPanel";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";

type PanditSection = "dashboard" | "bookings" | "earnings" | "storefront" | "card" | "referrals" | "tools" | "japa" | "customers" | "reviews" | "membership" | "notifications" | "settings";

const PANDIT_NAV: Array<{ id: PanditSection; label: string; icon: any; section: "main" | "growth" | "account"; phase?: string }> = [
  { id: "dashboard",     label: "Dashboard",     icon: LayoutDashboard, section: "main" },
  { id: "bookings",      label: "Bookings",      icon: CalendarDays,    section: "main" },
  { id: "earnings",      label: "Earnings",      icon: Wallet,          section: "main" },
  { id: "notifications", label: "Notifications", icon: Bell,            section: "main", phase: "Phase 2" },
  { id: "storefront",    label: "My Storefront", icon: Share2,          section: "growth" },
  { id: "referrals",     label: "Referrals",     icon: IndianRupee,     section: "growth" },
  { id: "card",          label: "Pandit Card",   icon: Sparkles,        section: "growth" },
  { id: "tools",         label: "Tools",         icon: Wrench,          section: "growth" },
  { id: "japa",          label: "Jap Counter",   icon: Music2,          section: "growth" },
  { id: "customers",     label: "Customers",     icon: Users,           section: "growth" },
  { id: "reviews",       label: "Reviews",       icon: Star,            section: "growth", phase: "Phase 2" },
  { id: "membership",    label: "Membership",    icon: Crown,           section: "account" },
  { id: "settings",      label: "Settings",      icon: SettingsIcon,    section: "account", phase: "Phase 2" },
];

const PANDIT_SECTION_LABEL: Record<string, string> = { main: "Practice", growth: "Grow your practice", account: "Account" };

type Booking = {
  id: number; userId: number | null; panditId: number | null;
  pujaType: string; mode: string; date: string; timeSlot: string;
  location: string | null; contactName: string; contactPhone: string;
  status: string; totalAmount: number;
  acceptedAt: string | null; confirmedTimeSlot: string | null;
  samagriList: Array<{ name: string; qty?: string; note?: string }> | null;
  samagriSentAt: string | null; tipAmountInr: number; tipPaidAt: string | null;
  completedAt: string | null; declineReason: string | null; createdAt: string;
};
type Message = { id: number; bookingId: number; senderType: string; senderName: string; message: string; createdAt: string };

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  accepted: "bg-emerald-100 text-emerald-900 border-emerald-300",
  completed: "bg-sky-100 text-sky-900 border-sky-300",
  declined: "bg-rose-100 text-rose-900 border-rose-300",
  cancelled: "bg-stone-100 text-stone-700 border-stone-300",
};

export default function PanditPortalPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [me, setMe] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [tab, setTab] = useState("requests");
  const [section, setSection] = useState<PanditSection>("bookings");
  const [openBooking, setOpenBooking] = useState<Booking | null>(null);
  const [showPwdDlg, setShowPwdDlg] = useState(false);
  const [newPwd, setNewPwd] = useState("");
  const [calMonth, setCalMonth] = useState(new Date().toISOString().slice(0, 7));
  const [onLeave, setOnLeave] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("pandit:onLeave") === "1";
  });
  const [leaveNote, setLeaveNote] = useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("pandit:leaveNote") || "";
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pandit:onLeave", onLeave ? "1" : "0");
  }, [onLeave]);
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem("pandit:leaveNote", leaveNote);
  }, [leaveNote]);

  // Initial load
  useEffect(() => {
    if (!getPanditToken()) {
      setLocation("/pandit/login");
      return;
    }
    panditApi("GET", "/api/pandit/me").then((r) => {
      setMe(r.pandit);
      if (r.mustChangePassword) setShowPwdDlg(true);
    }).catch(() => { clearPanditToken(); setLocation("/pandit/login"); });
    refreshAll();
    // Live availability heartbeat — keeps the green "Online now" dot lit on
    // your public pandit cards while this tab is open. 60s cadence, server
    // TTL is 5 min so a brief network blip is forgiven.
    const ping = () => { panditApi("POST", "/api/pandit/heartbeat").catch(() => {}); };
    ping();
    const heartbeatId = window.setInterval(ping, 60_000);
    return () => { window.clearInterval(heartbeatId); };
  }, []);

  const refreshAll = async () => {
    try {
      const [b, s] = await Promise.all([
        panditApi("GET", "/api/pandit/bookings"),
        panditApi("GET", "/api/pandit/stats"),
      ]);
      setBookings(b.bookings || []);
      setStats(s);
    } catch (e: any) {
      toast({ title: "Failed to load", description: e?.message, variant: "destructive" });
    }
  };

  const logout = async () => {
    try { await panditApi("POST", "/api/pandit/logout"); } catch {}
    clearPanditToken();
    setLocation("/pandit/login");
  };

  const changePassword = async () => {
    if (newPwd.length < 6) { toast({ title: "At least 6 characters", variant: "destructive" }); return; }
    try {
      await panditApi("POST", "/api/pandit/change-password", { newPassword: newPwd });
      toast({ title: "Password updated" });
      setShowPwdDlg(false); setNewPwd("");
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
  };

  const pending = bookings.filter((b) => b.status === "pending");
  const accepted = bookings.filter((b) => b.status === "accepted");
  const completed = bookings.filter((b) => b.status === "completed");

  // Calendar map
  const calMap = useMemo(() => {
    const m: Record<string, Booking[]> = {};
    bookings.forEach((b) => { if (!m[b.date]) m[b.date] = []; m[b.date].push(b); });
    return m;
  }, [bookings]);

  const monthDate = new Date(`${calMonth}-01T00:00:00`);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const firstDow = monthDate.getDay();

  const StatsBar = (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {[
        { l: "Pending requests", v: stats?.pending ?? 0, i: Clock, c: "text-amber-700" },
        { l: "Upcoming pujas", v: stats?.upcoming ?? 0, i: CalendarDays, c: "text-emerald-700" },
        { l: "Completed", v: stats?.completed ?? 0, i: CheckCircle2, c: "text-sky-700" },
        { l: "Earnings", v: `₹${(stats?.totalEarningsInr || 0).toLocaleString("en-IN")}`, i: IndianRupee, c: "text-[#6D2B35]" },
        { l: "Tips received", v: `₹${(stats?.tipsInr || 0).toLocaleString("en-IN")}`, i: Sparkles, c: "text-[#D4AF37]" },
      ].map((s, i) => {
        const I = s.i;
        return (
          <Card key={i} data-testid={`stat-${i}`}>
            <CardContent className="p-3">
              <div className="flex items-center gap-2 text-[10px] text-[#5a4a3a]/65 uppercase tracking-wide font-bold"><I className={`h-3.5 w-3.5 ${s.c}`} />{s.l}</div>
              <div className="text-xl font-bold text-[#4a1a22] mt-1">{s.v}</div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );

  const sidebarStyle = { "--sidebar-width": "15rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full bg-[#FBF7EE]">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-[#D4AF37]/20 px-3 py-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-8 w-8 rounded-md bg-[#6D2B35] flex items-center justify-center text-[#D4AF37] shrink-0"><Sparkles className="h-4 w-4" /></div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="text-sm font-serif font-bold text-[#4a1a22] truncate" data-testid="text-pandit-name">{me?.name || "Panditji"}</div>
                <div className="text-[10px] text-[#5a4a3a]/65 flex items-center gap-1"><MapPin className="h-3 w-3" />{me?.city || "—"}</div>
              </div>
            </div>
          </SidebarHeader>
          <SidebarContent>
            {(["main", "growth", "account"] as const).map((sec) => (
              <SidebarGroup key={sec}>
                <SidebarGroupLabel>{PANDIT_SECTION_LABEL[sec]}</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {PANDIT_NAV.filter((n) => n.section === sec).map((n) => {
                      const Icon = n.icon;
                      const active = section === n.id;
                      return (
                        <SidebarMenuItem key={n.id}>
                          <SidebarMenuButton isActive={active} onClick={() => setSection(n.id)} tooltip={n.label} data-testid={`pandit-nav-${n.id}`}>
                            <Icon className="h-4 w-4" />
                            <span>{n.label}</span>
                            {n.id === "bookings" && pending.length > 0 && (
                              <Badge className="ml-auto h-4 min-w-[1.25rem] px-1 text-[10px] bg-amber-500 hover:bg-amber-500 text-white">{pending.length}</Badge>
                            )}
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      );
                    })}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            ))}
          </SidebarContent>
          <SidebarFooter className="border-t border-[#D4AF37]/20 p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={() => setShowPwdDlg(true)} tooltip="Change password" data-testid="btn-change-pwd">
                  <Lock className="h-4 w-4" /><span>Change password</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton onClick={logout} tooltip="Sign out" data-testid="btn-logout">
                  <LogOut className="h-4 w-4" /><span>Sign out</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#D4AF37]/20 px-4 py-2.5 flex items-center gap-3">
            <SidebarTrigger data-testid="button-pandit-sidebar-toggle" />
            <h1 className="text-base md:text-lg font-serif font-bold text-[#4a1a22]">{PANDIT_NAV.find((n) => n.id === section)?.label}</h1>
          </header>

          <main className="flex-1 px-3 md:px-6 py-4 md:py-6">
            {section === "dashboard" && (
              <div className="space-y-4">
                {StatsBar}
                <Card><CardContent className="p-5 text-sm text-[#5a4a3a]/75">
                  Welcome to your practice dashboard. Use <button className="underline" onClick={() => setSection("bookings")}>Bookings</button> to manage requests, accept upcoming pujas, and view your monthly calendar. Earnings, affiliate, customer ledger and reviews modules are coming next.
                </CardContent></Card>
              </div>
            )}
            {section === "bookings" && (
              <div className="space-y-4">
                {StatsBar}
                <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-4 w-full max-w-2xl">
            <TabsTrigger value="requests" data-testid="tab-requests">Requests {pending.length > 0 && <Badge className="ml-1.5 bg-amber-500 hover:bg-amber-500 text-white">{pending.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="upcoming" data-testid="tab-upcoming">Upcoming</TabsTrigger>
            <TabsTrigger value="calendar" data-testid="tab-calendar">Calendar</TabsTrigger>
            <TabsTrigger value="completed" data-testid="tab-completed">History</TabsTrigger>
          </TabsList>

          <TabsContent value="requests" className="mt-4 space-y-3">
            {pending.length === 0 ? <EmptyState text="No new booking requests right now." /> : pending.map((b) => <BookingRow key={b.id} b={b} onOpen={() => setOpenBooking(b)} />)}
          </TabsContent>
          <TabsContent value="upcoming" className="mt-4 space-y-3">
            {accepted.length === 0 ? <EmptyState text="No upcoming pujas yet." /> : accepted.map((b) => <BookingRow key={b.id} b={b} onOpen={() => setOpenBooking(b)} />)}
          </TabsContent>
          <TabsContent value="completed" className="mt-4 space-y-3">
            {completed.length === 0 ? <EmptyState text="No completed pujas yet." /> : completed.map((b) => <BookingRow key={b.id} b={b} onOpen={() => setOpenBooking(b)} />)}
          </TabsContent>

          <TabsContent value="calendar" className="mt-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <Button variant="outline" size="sm" onClick={() => {
                    const d = new Date(`${calMonth}-01T00:00:00`); d.setMonth(d.getMonth() - 1); setCalMonth(d.toISOString().slice(0, 7));
                  }} data-testid="btn-cal-prev">‹</Button>
                  <div className="font-serif text-base font-bold text-[#4a1a22]" data-testid="text-cal-month">{monthDate.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</div>
                  <Button variant="outline" size="sm" onClick={() => {
                    const d = new Date(`${calMonth}-01T00:00:00`); d.setMonth(d.getMonth() + 1); setCalMonth(d.toISOString().slice(0, 7));
                  }} data-testid="btn-cal-next">›</Button>
                </div>
                <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-wide text-[#5a4a3a]/60 mb-1">
                  {["S","M","T","W","T","F","S"].map((d, i) => <div key={i}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: firstDow }).map((_, i) => <div key={`pad${i}`} />)}
                  {Array.from({ length: daysInMonth }).map((_, i) => {
                    const day = i + 1;
                    const ds = `${calMonth}-${String(day).padStart(2, "0")}`;
                    const items = calMap[ds] || [];
                    return (
                      <button key={day} onClick={() => items[0] && setOpenBooking(items[0])} className={`aspect-square rounded-md border text-xs p-1 text-left flex flex-col ${items.length ? "border-[#D4AF37] bg-[#FBF7EE] hover-elevate" : "border-[#D4AF37]/15 bg-white"}`} data-testid={`cal-day-${day}`}>
                        <span className="font-bold text-[#4a1a22]">{day}</span>
                        {items.slice(0, 2).map((b) => (
                          <span key={b.id} className={`text-[8px] mt-0.5 px-1 rounded truncate ${b.status === "accepted" ? "bg-emerald-200 text-emerald-900" : b.status === "pending" ? "bg-amber-200 text-amber-900" : "bg-stone-200 text-stone-800"}`}>{b.timeSlot}</span>
                        ))}
                        {items.length > 2 && <span className="text-[8px] text-[#5a4a3a]/65 mt-0.5">+{items.length - 2} more</span>}
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
                </Tabs>
              </div>
            )}
            {section === "earnings" && <PanditEarnings />}
            {section === "customers" && <PanditCustomers />}
            {section === "tools" && <PanditTools />}
            {section === "membership" && <PanditMembership />}
            {section === "storefront" && <PanditStorefrontEditor />}
            {section === "referrals" && <PanditReferralsPanel />}
            {section === "card" && <PanditCardOrders />}
            {section === "japa" && (
              <JapCounter
                ownerKey={`pandit:${me?.id || "self"}`}
                devoteeName={me?.name}
                title="Jap Counter"
                subtitle="Track your daily sadhana — anushthans, sankalps, and mala counts."
              />
            )}
            {section === "settings" && (
              <Card>
                <CardContent className="p-5 md:p-6 space-y-5">
                  <div className="flex items-start gap-3">
                    <div className="h-10 w-10 rounded-md bg-[#6D2B35]/10 flex items-center justify-center text-[#6D2B35] shrink-0">
                      <SettingsIcon className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="text-xl font-serif font-bold text-[#4a1a22]">Settings</h2>
                      <p className="text-[12px] text-[#5a4a3a]/70 mt-0.5">Manage your availability and account preferences. Profile editing, service catalog and pricing presets are coming next.</p>
                    </div>
                  </div>

                  <div className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-1">Availability</p>
                        <p className="text-[14px] font-serif font-semibold text-[#4a1a22]">
                          {onLeave ? "You are currently on leave" : "You are accepting new bookings"}
                        </p>
                        <p className="text-[12px] text-[#5a4a3a]/70 mt-1">
                          When on leave, the live "Online now" dot stops appearing on your public profile and you'll see a banner on every screen so you don't forget. Existing bookings are not affected — please complete or reschedule them as usual.
                        </p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={onLeave}
                        aria-label={onLeave ? "Currently on leave — click to resume accepting bookings" : "Currently accepting bookings — click to mark on leave"}
                        onClick={() => setOnLeave(v => !v)}
                        className={`relative inline-flex h-7 w-12 shrink-0 items-center rounded-full transition-colors ${onLeave ? "bg-[#6D2B35]" : "bg-stone-300"}`}
                        data-testid="toggle-on-leave"
                      >
                        <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${onLeave ? "translate-x-6" : "translate-x-1"}`} />
                      </button>
                    </div>
                    {onLeave && (
                      <div className="mt-3 pt-3 border-t border-[#D4AF37]/25 space-y-1.5">
                        <Label htmlFor="leave-note" className="text-[11px] text-[#6D2B35]/85 font-medium">Note for the team (optional)</Label>
                        <textarea
                          id="leave-note"
                          value={leaveNote}
                          onChange={(e) => setLeaveNote(e.target.value.slice(0, 240))}
                          placeholder="e.g. Out for personal yatra till 25 Mar — please redirect urgent pujas to Pandit Sharma."
                          maxLength={240}
                          className="w-full min-h-[64px] resize-none rounded-md border border-[#D4AF37]/30 bg-white p-2.5 text-[12px] text-[#4a1a22] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                          data-testid="textarea-leave-note"
                        />
                        <p className="text-[10px] text-[#5a4a3a]/55 text-right">{leaveNote.length}/240</p>
                      </div>
                    )}
                    <p className="text-[10.5px] text-[#5a4a3a]/55 mt-3 leading-relaxed">
                      Note: this status is currently visible only inside your portal — sync to public listings is coming soon. For now, please also inform the team via WhatsApp so we can route urgent customer requests.
                    </p>
                  </div>

                  <div className="rounded-md border border-[#D4AF37]/20 bg-white p-4">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold mb-1">Account</p>
                    <p className="text-[13px] text-[#4a1a22] font-medium">Login password</p>
                    <p className="text-[11.5px] text-[#5a4a3a]/65 mt-0.5 mb-2.5">Update the password you use to sign in to this portal.</p>
                    <Button size="sm" variant="outline" onClick={() => setShowPwdDlg(true)} data-testid="btn-open-pwd-dialog">
                      Change password
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            {section !== "bookings" && section !== "dashboard" && section !== "earnings"
              && section !== "customers" && section !== "tools" && section !== "membership"
              && section !== "storefront" && section !== "referrals" && section !== "card"
              && section !== "japa" && section !== "settings" && (
              <PanditComingSoon nav={PANDIT_NAV.find((n) => n.id === section)!} />
            )}
          </main>
        </SidebarInset>

        {/* Booking detail dialog */}
        <BookingDetailDialog
          booking={openBooking}
          onClose={() => setOpenBooking(null)}
          onUpdated={() => { setOpenBooking(null); refreshAll(); }}
        />

        {/* Change password */}
        <Dialog open={showPwdDlg} onOpenChange={setShowPwdDlg}>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>Set a new password</DialogTitle></DialogHeader>
            <p className="text-xs text-[#5a4a3a]/70">Choose a 6+ character password you'll remember. You'll use this for all future logins.</p>
            <Input type="password" placeholder="New password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} data-testid="input-new-pwd" />
            <Button onClick={changePassword} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-save-pwd">Update Password</Button>
          </DialogContent>
        </Dialog>
      </div>
    </SidebarProvider>
  );
}

function PanditComingSoon({ nav }: { nav: { id: string; label: string; icon: any; phase?: string } }) {
  const Icon = nav.icon;
  const blurbs: Record<string, string[]> = {
    earnings:      ["Day-by-day payout ledger", "GST-ready monthly statement", "Withdraw to bank in one tap"],
    notifications: ["Booking, chat, payment updates", "Granular email + WhatsApp toggles", "Priority alerts for high-value pujas"],
    affiliate:     ["Personal referral link + QR", "Commission on every booking referred", "Realtime conversion ledger"],
    tools:         ["Sankalp & jaap PDF generator", "Birth-detail vault per yajamana", "Astro toolkit (Panchang, Muhurat, Vastu)"],
    japa:          ["Track your daily mantra count", "Lead live group chanting sessions", "Anushthan calendar with reminders"],
    customers:     ["Yajamana ledger with full history", "Personal notes + reminders", "Repeat-booking nudges"],
    reviews:       ["Star rating breakdown by puja type", "Public reply to reviews", "Improvement insights"],
    membership:    ["Pandit Pro tier with priority placement", "Lower platform fee + featured listing", "Quarterly skill workshops"],
    settings:      ["Edit profile, photo, regions served", "Service catalog + pricing presets", "Calendar blocking + leave"],
  };
  const lines = blurbs[nav.id] || ["Coming soon."];
  return (
    <Card>
      <CardContent className="p-8">
        <Badge variant="outline" className="mb-3 text-[10px] uppercase tracking-wide">{nav.phase || "Coming soon"}</Badge>
        <div className="flex items-center gap-3 mb-3">
          <div className="h-10 w-10 rounded-md bg-[#6D2B35]/10 flex items-center justify-center text-[#6D2B35]"><Icon className="h-5 w-5" /></div>
          <h2 className="text-2xl font-serif font-bold text-[#4a1a22]">{nav.label}</h2>
        </div>
        <p className="text-sm text-[#5a4a3a]/75 mb-4">Here's what's launching here:</p>
        <ul className="space-y-2 text-sm text-[#4a1a22]">
          {lines.map((l, i) => (
            <li key={i} className="flex items-start gap-2"><Sparkles className="w-4 h-4 text-[#D4AF37] shrink-0 mt-0.5" /><span>{l}</span></li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function EmptyState({ text }: { text: string }) {
  return <Card><CardContent className="p-8 text-center text-sm text-[#5a4a3a]/60">{text}</CardContent></Card>;
}

function BookingRow({ b, onOpen }: { b: Booking; onOpen: () => void }) {
  const cls = STATUS_BADGE[b.status] || STATUS_BADGE.pending;
  return (
    <Card className="hover-elevate cursor-pointer" onClick={onOpen} data-testid={`booking-row-${b.id}`}>
      <CardContent className="p-4 flex items-start gap-3">
        <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md py-2 px-3 text-center min-w-[64px]">
          <div className="text-[10px] uppercase text-[#5a4a3a]/60">{new Date(b.date + "T00:00:00").toLocaleDateString(undefined, { month: "short" })}</div>
          <div className="text-xl font-bold text-[#4a1a22] leading-none">{new Date(b.date + "T00:00:00").getDate()}</div>
          <div className="text-[9px] text-[#5a4a3a]/65 mt-0.5">{b.confirmedTimeSlot || b.timeSlot}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-serif font-semibold text-[#4a1a22] text-sm md:text-base truncate" data-testid={`text-puja-${b.id}`}>{b.pujaType}</h3>
            <Badge variant="outline" className={`text-[10px] uppercase ${cls}`}>{b.status}</Badge>
            <Badge variant="secondary" className="text-[10px]">{b.mode}</Badge>
          </div>
          <div className="text-xs text-[#5a4a3a]/75 mt-1">
            <span className="font-medium">{b.contactName}</span> · {b.contactPhone}
            {b.location && <> · {b.location}</>}
          </div>
          <div className="text-xs text-[#6D2B35] font-bold mt-1">₹{b.totalAmount.toLocaleString("en-IN")}{b.tipAmountInr > 0 && <span className="text-[#D4AF37] ml-2">+ ₹{b.tipAmountInr} dakshina</span>}</div>
        </div>
      </CardContent>
    </Card>
  );
}

function BookingDetailDialog({ booking, onClose, onUpdated }: { booking: Booking | null; onClose: () => void; onUpdated: () => void }) {
  const { toast } = useToast();
  const [tab, setTab] = useState("messages");
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [confirmedSlot, setConfirmedSlot] = useState("");
  const [acceptMsg, setAcceptMsg] = useState("");
  const [samagri, setSamagri] = useState<Array<{ name: string; qty: string }>>([{ name: "", qty: "" }]);
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!booking) return;
    setTab(booking.status === "pending" ? "accept" : "messages");
    setConfirmedSlot(booking.confirmedTimeSlot || booking.timeSlot);
    setSamagri(Array.isArray(booking.samagriList) && booking.samagriList.length ? booking.samagriList.map((i) => ({ name: i.name, qty: i.qty || "" })) : [{ name: "", qty: "" }]);
    void loadMessages();
  }, [booking?.id]);

  const loadMessages = async () => {
    if (!booking) return;
    try {
      const r = await panditApi("GET", `/api/pandit/bookings/${booking.id}/messages`);
      setMessages(r.messages || []);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    } catch (e: any) { toast({ title: "Could not load", description: e?.message, variant: "destructive" }); }
  };

  // Poll every 6s while open & on messages tab
  useEffect(() => {
    if (!booking || tab !== "messages") return;
    const t = setInterval(loadMessages, 6000);
    return () => clearInterval(t);
  }, [booking?.id, tab]);

  const sendMessage = async () => {
    if (!booking || !draft.trim()) return;
    setBusy(true);
    try {
      await panditApi("POST", `/api/pandit/bookings/${booking.id}/messages`, { message: draft.trim() });
      setDraft("");
      await loadMessages();
    } catch (e: any) { toast({ title: "Send failed", description: e?.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const accept = async () => {
    if (!booking) return;
    setBusy(true);
    try {
      await panditApi("POST", `/api/pandit/bookings/${booking.id}/accept`, { confirmedTimeSlot: confirmedSlot, message: acceptMsg || undefined });
      toast({ title: "Booking accepted ✅" });
      onUpdated();
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const decline = async () => {
    if (!booking) return;
    const reason = window.prompt("Reason for declining?") || "Pandit unavailable";
    setBusy(true);
    try {
      await panditApi("POST", `/api/pandit/bookings/${booking.id}/decline`, { reason });
      toast({ title: "Booking declined" });
      onUpdated();
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const complete = async () => {
    if (!booking) return;
    if (!window.confirm("Mark this puja as completed? Chat will be closed.")) return;
    setBusy(true);
    try {
      await panditApi("POST", `/api/pandit/bookings/${booking.id}/complete`);
      toast({ title: "Puja completed 🪔" });
      onUpdated();
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  const sendSamagri = async () => {
    if (!booking) return;
    const items = samagri.filter((s) => s.name.trim()).map((s) => ({ name: s.name.trim(), qty: s.qty.trim() || undefined }));
    if (items.length === 0) { toast({ title: "Add at least one item", variant: "destructive" }); return; }
    setBusy(true);
    try {
      await panditApi("POST", `/api/pandit/bookings/${booking.id}/samagri`, { items, notifyCustomer: true });
      toast({ title: "Samagri list sent to customer ✅" });
      await loadMessages();
      setTab("messages");
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
    finally { setBusy(false); }
  };

  if (!booking) return null;
  const chatClosed = ["completed", "declined", "cancelled"].includes(booking.status);

  return (
    <Dialog open={!!booking} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col" data-testid="dialog-booking-detail">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#4a1a22]">{booking.pujaType}</DialogTitle>
          <div className="text-xs text-[#5a4a3a]/70 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span><CalendarDays className="h-3 w-3 inline mr-1" />{booking.date} · {booking.confirmedTimeSlot || booking.timeSlot}</span>
            <span><Phone className="h-3 w-3 inline mr-1" />{booking.contactPhone}</span>
            {booking.location && <span><MapPin className="h-3 w-3 inline mr-1" />{booking.location}</span>}
            <Badge variant="outline" className={`text-[10px] uppercase ${STATUS_BADGE[booking.status] || ""}`}>{booking.status}</Badge>
          </div>
        </DialogHeader>

        <Tabs value={tab} onValueChange={setTab} className="flex-1 flex flex-col min-h-0">
          <TabsList className={`grid w-full ${booking.status === "pending" ? "grid-cols-3" : "grid-cols-2"}`}>
            {booking.status === "pending" && <TabsTrigger value="accept" data-testid="tab-accept">Accept / Decline</TabsTrigger>}
            <TabsTrigger value="messages"><MessageSquare className="h-3.5 w-3.5 mr-1" />Messages</TabsTrigger>
            <TabsTrigger value="samagri"><ClipboardList className="h-3.5 w-3.5 mr-1" />Samagri</TabsTrigger>
          </TabsList>

          {booking.status === "pending" && (
            <TabsContent value="accept" className="flex-1 overflow-auto py-3 space-y-3">
              <div>
                <Label htmlFor="cs">Confirmed time slot</Label>
                <Input id="cs" value={confirmedSlot} onChange={(e) => setConfirmedSlot(e.target.value)} placeholder="e.g. 7:00 AM – 9:00 AM" data-testid="input-confirmed-slot" />
                <p className="text-[10px] text-[#5a4a3a]/60 mt-1">Customer requested: {booking.timeSlot}. Confirm or propose alternate.</p>
              </div>
              <div>
                <Label htmlFor="am">Message to customer (optional)</Label>
                <Textarea id="am" value={acceptMsg} onChange={(e) => setAcceptMsg(e.target.value)} rows={3} placeholder="e.g. Pranam. I will be there 30 mins early to set up." data-testid="input-accept-msg" />
              </div>
              <div className="flex gap-2">
                <Button onClick={accept} disabled={busy} className="flex-1 bg-emerald-700 hover:bg-emerald-800 text-white" data-testid="btn-accept"><CheckCircle2 className="h-4 w-4 mr-1.5" />Accept Booking</Button>
                <Button onClick={decline} disabled={busy} variant="outline" className="flex-1 border-rose-300 text-rose-700" data-testid="btn-decline"><XCircle className="h-4 w-4 mr-1.5" />Decline</Button>
              </div>
            </TabsContent>
          )}

          <TabsContent value="messages" className="flex-1 flex flex-col min-h-0 py-3">
            <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-2 pr-1 mb-3">
              {messages.length === 0 && <div className="text-center text-xs text-[#5a4a3a]/50 py-8">No messages yet.</div>}
              {messages.map((m) => {
                const isMe = m.senderType === "pandit";
                const isSys = m.senderType === "system";
                return (
                  <div key={m.id} className={`flex ${isSys ? "justify-center" : isMe ? "justify-end" : "justify-start"}`} data-testid={`msg-${m.id}`}>
                    <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                      isSys ? "bg-[#FBF7EE] text-[#5a4a3a] text-xs italic border border-[#D4AF37]/20"
                      : isMe ? "bg-[#6D2B35] text-[#FBF7EE]"
                      : "bg-stone-100 text-stone-900 border border-stone-200"
                    }`}>
                      {!isSys && <div className="text-[10px] opacity-70 mb-0.5">{m.senderName}</div>}
                      <div>{m.message}</div>
                      <div className="text-[9px] opacity-60 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            {chatClosed ? (
              <div className="text-center text-xs text-[#5a4a3a]/60 py-3 bg-[#FBF7EE] rounded-md">Chat closed — booking is {booking.status}.</div>
            ) : (
              <div className="flex gap-2">
                <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message to customer..." rows={2} className="resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); } }} data-testid="input-msg-draft" />
                <Button onClick={sendMessage} disabled={busy || !draft.trim()} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-send-msg"><Send className="h-4 w-4" /></Button>
              </div>
            )}
            {booking.status === "accepted" && (
              <div className="mt-2 flex flex-wrap gap-2">
                {booking.mode === "online" && (
                  <>
                    <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" data-testid="btn-pandit-join-video">
                      <a href={`/puja-call/${booking.id}?as=pandit`} target="_blank" rel="noreferrer"><Video className="h-4 w-4 mr-1.5" />Start Video Call</a>
                    </Button>
                    <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-800" data-testid="btn-pandit-join-audio">
                      <a href={`/puja-call/${booking.id}?as=pandit&audio=1`} target="_blank" rel="noreferrer"><Mic className="h-4 w-4 mr-1.5" />Audio Only</a>
                    </Button>
                  </>
                )}
                <Button onClick={complete} variant="outline" size="sm" data-testid="btn-complete-puja"><CheckCircle2 className="h-4 w-4 mr-1.5" />Mark Puja as Completed</Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="samagri" className="flex-1 overflow-auto py-3">
            <p className="text-xs text-[#5a4a3a]/70 mb-3">List the items needed for this puja. Customer will receive it as a message and can order from Vedic Tatva.</p>
            <div className="space-y-2">
              {samagri.map((it, i) => (
                <div key={i} className="flex gap-2">
                  <Input placeholder="Item (e.g. Roli)" value={it.name} onChange={(e) => { const n = [...samagri]; n[i].name = e.target.value; setSamagri(n); }} className="flex-1" data-testid={`input-samagri-name-${i}`} />
                  <Input placeholder="Qty (e.g. 50g)" value={it.qty} onChange={(e) => { const n = [...samagri]; n[i].qty = e.target.value; setSamagri(n); }} className="w-28" data-testid={`input-samagri-qty-${i}`} />
                  <Button variant="outline" size="icon" onClick={() => setSamagri(samagri.filter((_, j) => j !== i))} data-testid={`btn-samagri-rm-${i}`}><Trash2 className="h-4 w-4" /></Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setSamagri([...samagri, { name: "", qty: "" }])} data-testid="btn-samagri-add"><Plus className="h-4 w-4 mr-1" />Add item</Button>
            </div>
            <Button onClick={sendSamagri} disabled={busy} className="mt-4 w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-send-samagri">Send Samagri List to Customer</Button>
            {booking.samagriSentAt && <p className="text-[11px] text-emerald-700 text-center mt-2">Last sent: {new Date(booking.samagriSentAt).toLocaleString()}</p>}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
