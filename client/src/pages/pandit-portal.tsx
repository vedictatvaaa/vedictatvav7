import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { Bell, CalendarDays, Crown, IndianRupee, LayoutDashboard, LogOut, MapPin, Menu, MessageSquare, Settings, Share2, Star, Store, Users, Wallet, Wrench, Music2, Sparkles, Lock, X, Copy, QrCode, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { clearPanditToken, getPanditToken, panditApi } from "@/lib/panditAuth";
import { usePanditDashboard } from "@/hooks/use-pandit-dashboard";
import PanditHome from "@/components/pandit/PanditHome";
import PanditEarnings from "@/components/pandit/PanditEarnings";
import PanditCustomers from "@/components/pandit/PanditCustomers";
import PanditTools from "@/components/pandit/PanditTools";
import PanditPayments from "@/components/pandit/PanditPayments";
import PanditNotifications from "@/components/pandit/PanditNotifications";
import PanditReviews from "@/components/pandit/PanditReviews";
import PanditMembership from "@/components/pandit/PanditMembership";
import JapCounter from "@/components/JapCounter";
import { PanditStorefrontEditor, PanditCardOrders, PanditReferralsPanel } from "@/components/pandit/PanditStorefrontPanel";
import PanditBookingWorkflow from "@/components/pandit/PanditBookingWorkflow";
import PanditCalendar from "@/components/pandit/PanditCalendar";

type Section = "home" | "bookings" | "calendar" | "messages" | "earnings" | "payments" | "storefront" | "services" | "gallery" | "analytics" | "googleBusiness" | "card" | "referrals" | "tools" | "japa" | "customers" | "reviews" | "membership" | "notifications" | "settings";
const aliases: Record<string, Section> = { dashboard: "home", requests: "bookings", home: "home", affiliate: "referrals", calendar: "calendar", messages: "messages" };
const sectionSet = new Set<Section>(["home","bookings","calendar","messages","earnings","payments","storefront","services","gallery","analytics","googleBusiness","card","referrals","tools","japa","customers","reviews","membership","notifications","settings"]);
const nav = [
  { id: "home", label: "Home", icon: LayoutDashboard, group: "Practice" },
  { id: "bookings", label: "Bookings", icon: CalendarDays, group: "Practice" },
  { id: "calendar", label: "Calendar", icon: CalendarDays, group: "Practice" },
  { id: "messages", label: "Messages", icon: MessageSquare, group: "Practice" },
  { id: "earnings", label: "Earnings", icon: Wallet, group: "Practice" },
  { id: "payments", label: "Payment requests", icon: IndianRupee, group: "Practice" },
  { id: "notifications", label: "Notifications", icon: Bell, group: "Practice" },
  { id: "storefront", label: "My storefront", icon: Store, group: "Grow your practice" },
  { id: "services", label: "Services", icon: Store, group: "Grow your practice" },
  { id: "gallery", label: "Gallery", icon: Store, group: "Grow your practice" },
  { id: "analytics", label: "Analytics", icon: LayoutDashboard, group: "Grow your practice" },
  { id: "googleBusiness", label: "Google Business", icon: ExternalLink, group: "Grow your practice" },
  { id: "referrals", label: "Referrals", icon: Share2, group: "Grow your practice" },
  { id: "card", label: "Pandit card", icon: Sparkles, group: "Grow your practice" },
  { id: "tools", label: "Tools", icon: Wrench, group: "Grow your practice" },
  { id: "japa", label: "Jap counter", icon: Music2, group: "Grow your practice" },
  { id: "customers", label: "Customers", icon: Users, group: "Grow your practice" },
  { id: "reviews", label: "Reviews", icon: Star, group: "Grow your practice" },
  { id: "membership", label: "Membership", icon: Crown, group: "Account" },
  { id: "settings", label: "Settings", icon: Settings, group: "Account" },
] as const;

function readSection() {
  const p = new URLSearchParams(window.location.search);
  const raw = p.get("section") || p.get("tab") || "home";
  const result = aliases[raw] || raw;
  return (sectionSet.has(result as Section) ? result : "home") as Section;
}
export default function PanditPortalPage() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const data = usePanditDashboard();
  const [section, setSection] = useState<Section>(() => readSection());
  const [mobileOpen, setMobileOpen] = useState(false);
  const [pwdOpen, setPwdOpen] = useState(false);
  const [password, setPassword] = useState("");
  const groups = useMemo(() => Array.from(new Set(nav.map(n => n.group))), []);
  useEffect(() => {
    if (!getPanditToken()) { setLocation("/pandit/login"); return; }
    panditApi("GET", "/api/pandit/me").then((r) => { if (r.mustChangePassword) setPwdOpen(true); }).catch(() => { clearPanditToken(); setLocation("/pandit/login"); });
    const ping = () => { void panditApi("POST", "/api/pandit/heartbeat").catch(() => {}); };
    ping(); const id = window.setInterval(ping, 60000); return () => window.clearInterval(id);
  }, [setLocation]);
  const go = (next: string) => { const candidate = (aliases[next] || next) as Section; const target = sectionSet.has(candidate) ? candidate : "home"; setSection(target); setMobileOpen(false); window.history.pushState({}, "", `/pandit/portal?section=${target}`); };
  useEffect(() => { const sync = () => setSection(readSection()); window.addEventListener("popstate", sync); return () => window.removeEventListener("popstate", sync); }, []);
  async function logout() { try { await panditApi("POST", "/api/pandit/logout"); } catch {} clearPanditToken(); setLocation("/pandit/login"); }
  async function changePassword() { if (password.length < 6) { toast({ title: "Use at least 6 characters", variant: "destructive" }); return; } try { await panditApi("POST", "/api/pandit/change-password", { newPassword: password }); toast({ title: "Password updated" }); setPwdOpen(false); setPassword(""); } catch (e: any) { toast({ title: "Could not update password", description: e.message, variant: "destructive" }); } }
  const active = nav.find(n => n.id === section) || nav[0];
  function content() {
    if (section === "home") return <PanditHome me={data.me} stats={data.stats} summary={data.summary} unavailable={data.summaryUnavailable} go={go} />;
    if (section === "bookings") return <PanditBookingWorkflow bookings={data.bookings} refresh={data.refresh} />;
    if (section === "calendar") return <PanditCalendar refresh={data.refresh} />;
    if (section === "messages") return <MessagesAdapter bookings={data.bookings} go={go} />;
    if (section === "earnings") return <PanditEarnings />; if (section === "payments") return <PanditPayments />;
    if (section === "storefront") return <PanditStorefrontEditor />; if (section === "card") return <PanditCardOrders />;
    if (section === "services") return <PanditStorefrontEditor />; if (section === "gallery") return <FoundationUnavailable title="Gallery" detail="Gallery data is not available in this practice system yet." />;
    if (section === "analytics") return <FoundationUnavailable title="Analytics" detail="Practice analytics will appear here when a verified reporting source is connected." />;
    if (section === "googleBusiness") return <FoundationUnavailable title="Google Business" detail="Google Business is not connected for this practice. No Google state is being assumed." />;
    if (section === "referrals") return <PanditReferralsPanel />; if (section === "tools") return <PanditTools />;
    if (section === "japa") return <JapCounter ownerKey={`pandit:${data.me?.id || "self"}`} devoteeName={data.me?.name} title="Jap Counter" subtitle="Track your daily sadhana." />;
    if (section === "customers") return <PanditCustomers />; if (section === "reviews") return <PanditReviews />;
    if (section === "membership") return <PanditMembership />; if (section === "notifications") return <PanditNotifications />;
    return <SettingsPanel onLeave={!!data.me?.onLeave} note={data.me?.leaveNote || ""} refresh={data.refresh} />;
  }
  return <div className="min-h-[100dvh] overflow-x-hidden bg-[#f6f0e4] text-[#35231d]">
    <aside className={`fixed inset-y-0 left-0 z-40 w-72 -translate-x-full border-r border-[#d8c8ae] bg-[#fffaf1] transition-transform lg:translate-x-0 ${mobileOpen ? "translate-x-0" : ""}`}>
      <div className="flex h-full flex-col"><div className="flex items-center justify-between border-b border-[#e4d7c3] px-5 py-5"><div><p className="font-serif text-xl font-semibold text-[#55252d]">Vedic Tatva</p><p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[.2em] text-[#946c16]">Pandit business OS</p></div><button className="lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation"><X className="h-5 w-5" /></button></div>
        <div className="border-b border-[#e4d7c3] px-5 py-4"><p className="text-sm font-semibold">{data.me?.name || "Panditji"}</p><p className="mt-1 flex items-center gap-1 text-xs text-[#806f5e]"><MapPin className="h-3 w-3" />{data.me?.city || "Practice headquarters"}</p></div>
        <nav className="admin-scrollbar flex-1 overflow-y-auto px-3 py-4">{groups.map(group => <div key={group} className="mb-5"><p className="mb-2 px-3 text-[10px] font-bold uppercase tracking-[.19em] text-[#946c16]">{group}</p>{nav.filter(n => n.group === group).map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => go(item.id)} className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${section === item.id ? "bg-[#55252d] font-semibold text-[#fff8e9]" : "text-[#665445] hover:bg-[#f2e6d2]"}`}><Icon className="h-4 w-4" />{item.label}{item.id === "bookings" && !!data.stats?.pending && <span className="ml-auto rounded-full bg-[#e6b957] px-2 py-0.5 text-[10px] font-bold text-[#55252d]">{data.stats.pending}</span>}</button>; })}</div>)}</nav>
        <div className="border-t border-[#e4d7c3] p-3"><StoreActions path={data.summary?.storefront?.publicPath || null} /><button onClick={() => setPwdOpen(true)} className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#665445] hover:bg-[#f2e6d2]"><Lock className="h-4 w-4" />Change password</button><button onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-[#665445] hover:bg-[#f2e6d2]"><LogOut className="h-4 w-4" />Sign out</button></div>
      </div>
    </aside>
    {mobileOpen && <button className="fixed inset-0 z-30 bg-[#35231d]/30 lg:hidden" onClick={() => setMobileOpen(false)} aria-label="Close navigation overlay" />}
    <div className="lg:pl-72"><header className="sticky top-0 z-20 flex h-16 items-center gap-2 border-b border-[#d8c8ae] bg-[#fffaf1]/90 px-3 backdrop-blur md:gap-3 md:px-8"><button className="rounded-lg p-2 hover:bg-[#f2e6d2] lg:hidden" onClick={() => setMobileOpen(true)} aria-label="Open navigation" data-testid="button-mobile-menu"><Menu className="h-5 w-5" /></button><div className="flex min-w-0 items-center gap-2 lg:hidden"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#55252d] font-serif text-sm text-[#e6b957]">V</span><span className="truncate font-serif text-sm font-semibold text-[#55252d]">Vedic Tatva</span></div><div className="min-w-0 flex-1"><p className="hidden text-[10px] font-bold uppercase tracking-[.2em] text-[#946c16] sm:block">Practice headquarters</p><h1 className="truncate font-serif text-base font-semibold text-[#55252d] md:text-xl">{active.label}</h1></div><div className="flex shrink-0 items-center gap-1.5"><button onClick={() => go("notifications")} className="relative rounded-lg p-2 text-[#665445] hover:bg-[#f2e6d2]" aria-label="Notifications" data-testid="button-mobile-notifications"><Bell className="h-4 w-4" />{data.summary?.today?.unreadMessages?.state === "available" && data.summary.today.unreadMessages.count > 0 && <span className="absolute right-0.5 top-0.5 min-w-4 rounded-full bg-[#55252d] px-1 text-center text-[9px] font-bold text-[#fff8e9]">{data.summary.today.unreadMessages.count}</span>}</button><button onClick={() => setMobileOpen(true)} className="rounded-lg p-2 text-[#665445] hover:bg-[#f2e6d2] lg:hidden" aria-label={`Open ${data.me?.name || "profile"} menu`} data-testid="button-mobile-profile"><Users className="h-4 w-4" /></button><StoreActions path={data.summary?.storefront?.publicPath || null} /></div></header><main className="mx-auto max-w-[1440px] px-4 py-5 pb-24 md:px-8 md:py-8 md:pb-8">{data.error && <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">We couldn't load your practice. <button className="font-semibold underline" onClick={data.refresh}>Try again</button></div>}{data.loading ? <Loading /> : content()}</main></div>
     <MobileNav active={section} go={go} onMore={() => setMobileOpen(true)} unread={data.summary?.today?.unreadMessages?.state === "available" ? data.summary.today.unreadMessages.count : 0} /><Dialog open={pwdOpen} onOpenChange={setPwdOpen}><DialogContent className="max-w-sm"><DialogHeader><DialogTitle>Update your password</DialogTitle><DialogDescription>Choose a password with at least 6 characters.</DialogDescription></DialogHeader><Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password" /><Button onClick={changePassword} className="bg-[#55252d] text-[#fff8e9] hover:bg-[#3e1b20]">Update password</Button></DialogContent></Dialog>
  </div>;
}
function Loading() { return <div className="space-y-4 animate-pulse"><div className="h-44 rounded-[1.35rem] bg-[#e8dcc8]" /><div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{[1,2,3,4].map(i => <div key={i} className="h-32 rounded-xl bg-[#e8dcc8]" />)}</div></div>; }
function StoreActions({ path }: { path: string | null }) {
  const url = () => path ? `${window.location.origin}${path}` : "";
  const share = async () => {
    if (!path) return;
    const value = url();
    if (navigator.share) await navigator.share({ title: "My Vedic Tatva storefront", url: value });
    else { await navigator.clipboard.writeText(value); window.alert("Store link copied"); }
  };
  return <div className="flex items-center gap-1.5">
    <Button size="sm" variant="outline" disabled={!path} onClick={() => path && window.open(url(), "_blank", "noopener")} data-testid="button-view-store"><ExternalLink className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">View store</span></Button>
    <Button size="sm" variant="outline" disabled={!path} onClick={share} data-testid="button-share-store"><Copy className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">Share</span></Button>
    <Button size="sm" variant="outline" disabled={!path} onClick={() => { if (!path) return; const a = document.createElement("a"); a.href = "/api/pandit/storefront/qr.png"; a.download = "vedic-tatva-storefront-qr.png"; a.click(); }} data-testid="button-download-qr"><QrCode className="h-3.5 w-3.5 sm:mr-1.5" /><span className="hidden sm:inline">QR</span></Button>
  </div>;
}
function MobileNav({ active, go, onMore, unread }: { active: Section; go: (s: string) => void; onMore: () => void; unread: number }) {
  const items = [{ id: "home", label: "Home", icon: LayoutDashboard }, { id: "storefront", label: "Store", icon: Store }, { id: "bookings", label: "Bookings", icon: CalendarDays }, { id: "messages", label: "Messages", icon: MessageSquare }];
  return <nav className="fixed inset-x-0 bottom-0 z-20 flex justify-around border-t border-[#d8c8ae] bg-[#fffaf1]/95 px-1 pb-[max(.35rem,env(safe-area-inset-bottom))] pt-2 backdrop-blur lg:hidden" aria-label="Mobile navigation" data-testid="mobile-bottom-nav">{items.map(({ id, label, icon: Icon }) => <button key={id} onClick={() => go(id)} className={`relative flex min-w-0 flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold ${active === id ? "text-[#55252d]" : "text-[#806f5e]"}`} data-testid={`mobile-nav-${id}`}><Icon className="h-4 w-4" />{label}{id === "messages" && unread > 0 && <span className="absolute right-5 top-0 min-w-3 rounded-full bg-[#55252d] px-1 text-[8px] text-[#fff8e9]">{unread}</span>}</button>)}<button onClick={onMore} className="flex min-w-0 flex-1 flex-col items-center gap-1 py-1 text-[10px] font-semibold text-[#806f5e]" data-testid="mobile-nav-more"><Menu className="h-4 w-4" />More</button></nav>;
}
function FoundationUnavailable({ title, detail }: { title: string; detail: string }) { return <div className="rounded-xl border border-dashed border-[#cdbb9f] bg-[#fffaf1] p-8 md:p-12"><p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#946c16]">Foundation status</p><h2 className="mt-2 font-serif text-3xl text-[#55252d]">{title}</h2><p className="mt-3 max-w-xl text-sm leading-6 text-[#806f5e]">{detail}</p><span className="mt-5 inline-flex rounded-full bg-[#f2e6d2] px-3 py-1 text-xs font-semibold text-[#665445]">Setup required</span></div>; }
function CalendarAdapter({ bookings }: { bookings: any[] }) { return <div className="space-y-4"><h2 className="font-serif text-3xl text-[#55252d]">Calendar</h2><div className="grid gap-3 md:grid-cols-2">{bookings.filter(b => b.status === "accepted").map(b => <div key={b.id} className="rounded-xl border border-[#d8c8ae] bg-[#fffdf8] p-4"><p className="font-semibold">{b.date}</p><p className="mt-1 text-sm text-[#806f5e]">{b.timeSlot} · {b.pujaType}</p><p className="mt-1 text-xs text-[#806f5e]">{b.contactName}</p></div>)}{bookings.filter(b => b.status === "accepted").length === 0 && <div className="rounded-xl border border-dashed border-[#cdbb9f] bg-[#fffaf1] p-10 text-sm text-[#806f5e]">No accepted pujas on your calendar.</div>}</div></div>; }
function MessagesAdapter({ bookings, go }: { bookings: any[]; go: (s: string) => void }) {
  const [selected, setSelected] = useState<any>(bookings[0] || null);
  const [messages, setMessages] = useState<any[]>([]);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState("");
  useEffect(() => { if (!selected && bookings[0]) setSelected(bookings[0]); }, [bookings, selected]);
  useEffect(() => { if (selected) { setError(""); panditApi("GET", `/api/pandit/bookings/${selected.id}/messages`).then(r => setMessages(r.messages || [])).catch(() => { setMessages([]); setError("Messages could not be loaded. Try again from the booking."); }); } }, [selected]);
  async function send() { if (!selected || !draft.trim()) return; try { await panditApi("POST", `/api/pandit/bookings/${selected.id}/messages`, { message: draft.trim() }); setDraft(""); const r = await panditApi("GET", `/api/pandit/bookings/${selected.id}/messages`); setMessages(r.messages || []); } catch { setError("Your message could not be sent. Please try again."); } }
  return <div className="space-y-4"><h2 className="font-serif text-3xl text-[#55252d]">Messages</h2><div className="grid gap-4 lg:grid-cols-[260px_1fr]"><div className="rounded-xl border border-[#d8c8ae] bg-[#fffdf8] p-2">{bookings.map(b => <button key={b.id} onClick={() => setSelected(b)} className={`w-full rounded-lg p-3 text-left text-sm ${selected?.id === b.id ? "bg-[#f2e6d2] font-semibold" : "hover:bg-[#f6f0e4]"}`}>{b.contactName}<span className="block text-xs font-normal text-[#806f5e]">{b.pujaType}</span></button>)}{bookings.length === 0 && <p className="p-3 text-xs text-[#806f5e]">No booking conversations yet.</p>}</div><div className="rounded-xl border border-[#d8c8ae] bg-[#fffdf8] p-4"><MessageSquare className="h-5 w-5 text-[#946c16]" /><p className="mt-2 text-sm font-semibold">{selected ? selected.contactName : "Select a booking"}</p>{error && <p role="alert" className="mt-2 rounded-lg bg-rose-50 p-2 text-xs text-rose-800">{error}</p>}<div className="my-4 min-h-28 space-y-2">{messages.map(m => <p key={m.id} className={`rounded-lg p-2 text-sm ${m.senderType === "pandit" ? "ml-8 bg-[#55252d] text-[#fff8e9]" : "mr-8 bg-[#f2e6d2]"}`}>{m.message}</p>)}</div>{selected && <div className="flex gap-2"><Input value={draft} onChange={e => setDraft(e.target.value)} placeholder="Write to yajamana" onKeyDown={e => { if (e.key === "Enter") void send(); }} /><Button onClick={() => void send()} className="bg-[#55252d] text-[#fff8e9]">Send</Button></div>}{!selected && <Button onClick={() => go("bookings")} variant="outline">Open bookings</Button>}</div></div></div>;
}
function SettingsPanel({ onLeave, note, refresh }: { onLeave: boolean; note: string; refresh: () => void }) {
  const [busy, setBusy] = useState(false);
  async function toggle() {
    setBusy(true);
    try { await panditApi("POST", "/api/pandit/availability/leave", { onLeave: !onLeave, leaveNote: !onLeave ? note : "" }); await refresh(); }
    finally { setBusy(false); }
  }
  return <div className="rounded-xl border border-[#d8c8ae] bg-[#fffdf8] p-6">
    <p className="text-[11px] font-bold uppercase tracking-[.2em] text-[#946c16]">Availability</p>
    <h2 className="mt-2 font-serif text-2xl">{onLeave ? "You are on leave" : "Accepting new bookings"}</h2>
    <p className="mt-2 text-sm leading-6 text-[#806f5e]">{note || "Manage how your practice appears to yajamanas. Availability changes are synced to your public profile."}</p>
    <div className="mt-5 flex flex-wrap gap-2">
      <Button onClick={toggle} disabled={busy} className="bg-[#55252d] text-[#fff8e9] hover:bg-[#3e1b20]">{busy ? "Saving…" : onLeave ? "Resume bookings" : "Mark as on leave"}</Button>
      <Button onClick={refresh} variant="outline">Refresh status</Button>
    </div>
  </div>;
}