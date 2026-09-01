import { CalendarDays, CheckCircle2, Clock3, ExternalLink, IndianRupee, MessageSquare, Store, ArrowUpRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { DashboardSummary, PanditIdentity, Metric } from "@/hooks/use-pandit-dashboard";

const money = (n: unknown) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const withPanditHonorific = (name: string | null | undefined) => {
  const value = name?.trim();
  if (!value) return "Panditji";
  return /^(pt\.?|pandit)\s/i.test(value) ? value : `Pt. ${value}`;
};
export default function PanditHome({ me, stats, summary, unavailable, go }: { me: PanditIdentity | null; stats: any; summary: DashboardSummary | null; unavailable: boolean; go: (s: string) => void }) {
  const identity = summary?.identity;
  const today = summary?.today;
  const metric = (m: Metric | undefined, label: string, destination: string) => ({ label, value: unavailable || !m || m.state === "unavailable" ? "Unavailable" : m.state === "empty" ? "0" : m.count, icon: label.includes("message") ? MessageSquare : label.includes("Pending") ? Clock3 : CalendarDays, destination });
  const cards = [
    { ...metric(today?.bookings, "Today's bookings", "bookings"), tone: "saffron" },
    { ...metric(today?.pendingBookings, "Pending requests", "bookings"), tone: "rose" },
    { ...metric(today?.unreadMessages, "Unread messages", "messages"), tone: "ink" },
    { label: "Today's earnings", value: unavailable || !today?.earnings || today.earnings.state === "unavailable" ? "Unavailable" : money(today.earnings.amountInr), icon: IndianRupee, tone: "gold", destination: "earnings" },
  ];
  const checklist = summary?.checklist;
  const storeState = summary?.storefront?.state || "unavailable";
  const storeCopy = storeState === "published" ? "Published and discoverable." : storeState === "draft" ? "Your storefront is still a draft." : storeState === "pending_review" ? "Your storefront is awaiting review." : storeState === "suspended" ? "Your storefront is temporarily suspended." : "Your storefront is unavailable until publication details are ready.";
  return <div className="space-y-5" data-testid="pandit-home">
    <section className="relative overflow-hidden rounded-[1.35rem] bg-[#55252d] px-5 py-7 text-[#fff8e9] shadow-[0_18px_45px_rgba(85,37,45,.16)] md:px-8 md:py-9">
      <div className="absolute -right-10 -top-16 h-56 w-56 rounded-full border border-[#e6b957]/25" />
      <div className="absolute right-10 top-5 h-36 w-36 rounded-full border border-[#e6b957]/15" />
      <p className="mb-2 text-[11px] font-semibold uppercase tracking-[.24em] text-[#e6b957]">Your practice, at a glance</p>
      <h2 className="max-w-xl text-3xl font-semibold leading-tight md:text-4xl">Welcome back, {withPanditHonorific(identity?.name || me?.name)} <span aria-label="prayer mark">ॐ</span></h2>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-[#f7e6cb]/80">{(identity?.verification === "verified" || (me as any)?.verified) && <span className="rounded-full border border-[#e6b957]/50 px-2 py-1 text-xs text-[#e6b957]">Verified Pandit</span>}{(identity?.city || me?.city) && <span>{identity?.city || me?.city}</span>}{identity?.experience != null && <span>{identity.experience} years of experience</span>}</div>
      <p className="mt-3 max-w-lg text-sm leading-6 text-[#f7e6cb]/75">Here is what is waiting for you today.</p>
      <div className="mt-6 flex flex-wrap gap-2">
        <Button onClick={() => go("bookings")} className="bg-[#e6b957] text-[#3e1b20] hover:bg-[#f0ca76]" data-testid="home-view-bookings">View bookings <ArrowUpRight className="ml-1.5 h-4 w-4" /></Button>
        <Button variant="outline" onClick={() => go("storefront")} className="border-[#e6b957]/45 bg-transparent text-[#fff8e9] hover:bg-[#fff8e9]/10" data-testid="home-edit-storefront">Edit storefront</Button>
      </div>
    </section>
    {unavailable && <div className="rounded-xl border border-[#e6b957]/45 bg-[#fff8e9] px-4 py-3 text-xs text-[#6e5947]" role="status">Today’s detailed summary is unavailable right now. Existing booking totals are shown where available.</div>}
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
      {cards.map(({ label, value, icon: Icon, tone, destination }) => <button key={label} onClick={() => go(destination)} className="text-left"><Card className="h-full border-[#d8c8ae]/70 bg-[#fffdf8] transition-transform hover:-translate-y-0.5"><CardContent className="p-4">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${tone === "rose" ? "bg-[#55252d]/10 text-[#55252d]" : tone === "gold" ? "bg-[#e6b957]/20 text-[#946c16]" : "bg-[#efe4cf] text-[#765b3f]"}`}><Icon className="h-4 w-4" /></div>
        <p className="text-[11px] font-semibold uppercase tracking-[.12em] text-[#806f5e]">{label}</p><p className="mt-1 font-mono text-2xl font-medium text-[#35231d]">{value}</p>
      </CardContent></Card></button>)}
    </div>
    <div className="grid gap-5 lg:grid-cols-[1.25fr_.75fr]">
      <Card className="border-[#d8c8ae]/70 bg-[#fffdf8]"><CardContent className="p-5">
        <div className="flex items-center justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#946c16]">Practice pulse</p><h3 className="mt-1 text-xl text-[#35231d]">What deserves your attention</h3></div><CheckCircle2 className="h-5 w-5 text-[#946c16]" /></div>
        <div className="mt-5 space-y-2"><Action label="Review pending booking requests" detail={`${stats?.pending ?? 0} waiting for your response`} onClick={() => go("bookings")} /><Action label="Keep your public profile current" detail={storeCopy} onClick={() => go("storefront")} /></div>
      </CardContent></Card>
      <Card className="border-[#d8c8ae]/70 bg-[#f2e6d2]"><CardContent className="p-5">
        <div className="flex items-start justify-between"><div><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#946c16]">Public storefront</p><h3 className="mt-1 text-xl text-[#35231d]">{storeCopy}</h3></div><Store className="h-5 w-5 text-[#55252d]" /></div>
        <p className="mt-3 text-sm leading-6 text-[#6e5947]">{summary?.storefront?.publicPath ? "Your public storefront is ready to share." : "Add the details that help yajamanas choose you with confidence."}</p>
        <Button variant="link" className="mt-3 h-auto p-0 text-[#55252d]" onClick={() => go("storefront")}>Manage storefront <ExternalLink className="ml-1.5 h-3.5 w-3.5" /></Button>
      </CardContent></Card>
    </div>
    {checklist && <Card className="border-[#d8c8ae]/70 bg-[#fffdf8]"><CardContent className="p-5"><p className="text-[11px] font-semibold uppercase tracking-[.18em] text-[#946c16]">Your foundation</p><div className="mt-4 grid gap-2 md:grid-cols-2">{(["profile","services","gallery","availability","googleBusiness"] as const).map(key => <button key={key} disabled={key === "gallery" || key === "googleBusiness"} onClick={() => go(key === "availability" ? "settings" : key)} className={`flex items-center gap-3 rounded-lg border border-[#d8c8ae]/70 p-3 text-left ${key === "gallery" || key === "googleBusiness" ? "cursor-default opacity-75" : "hover:bg-[#f2e6d2]"}`}><CheckCircle2 className={`h-4 w-4 ${checklist[key] === "available" ? "text-emerald-700" : "text-[#b8aa97]"}`} /><span className="text-sm text-[#35231d]">{key === "googleBusiness" ? "Google Business" : key[0].toUpperCase() + key.slice(1)} <span className="text-xs text-[#806f5e]">· {checklist[key]}</span></span></button>)}</div></CardContent></Card>}
  </div>;
}
function Action({ label, detail, onClick }: { label: string; detail: string; onClick: () => void }) { return <button onClick={onClick} className="flex w-full items-center justify-between rounded-xl border border-[#e4d7c3] p-3 text-left transition-colors hover:bg-[#f2e6d2]"><span><span className="block text-sm font-semibold text-[#35231d]">{label}</span><span className="mt-1 block text-xs text-[#806f5e]">{detail}</span></span><ArrowUpRight className="h-4 w-4 shrink-0 text-[#946c16]" /></button>; }