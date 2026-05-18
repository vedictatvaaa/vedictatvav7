import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarFooter,
  SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarTrigger, SidebarInset,
} from "@/components/ui/sidebar";
import {
  LayoutDashboard, Calendar, Heart, Users2, Bell, Music2,
  Settings as SettingsIcon, Sparkles, ArrowRight, IndianRupee, MapPin, Receipt,
} from "lucide-react";
import NotificationsInbox from "@/components/dashboard/NotificationsInbox";
import FamilyProfiles from "@/components/dashboard/FamilyProfiles";
import MyBookings from "@/pages/my-bookings";
import Wishlist from "@/pages/wishlist";
import MyProfile from "@/pages/my-profile";
import JapCounter from "@/components/JapCounter";
import PaymentRequestsTab from "@/components/dashboard/PaymentRequestsTab";
import MyPanditMemoriesCard from "@/components/dashboard/MyPanditMemoriesCard";
import { listNotifications } from "@/lib/dashboardApi";

type TabId =
  | "overview" | "bookings" | "wishlist" | "family" | "notifications" | "payments"
  | "chanting" | "settings";

const NAV: Array<{
  id: TabId; label: string; icon: any; section: "main" | "spiritual" | "account";
  badge?: "unread" | null;
}> = [
  { id: "overview",      label: "Overview",         icon: LayoutDashboard, section: "main" },
  { id: "bookings",      label: "My Bookings",      icon: Calendar,        section: "main" },
  { id: "payments",      label: "Payment Requests", icon: IndianRupee,     section: "main" },
  { id: "wishlist",      label: "Favorites",        icon: Heart,           section: "main" },
  { id: "family",        label: "Family",           icon: Users2,          section: "main" },
  { id: "notifications", label: "Notifications",    icon: Bell,            section: "main", badge: "unread" },
  { id: "chanting",      label: "Jap Counter",      icon: Music2,          section: "spiritual" },
  { id: "settings",      label: "Settings",         icon: SettingsIcon,    section: "account" },
];

const SECTION_LABEL: Record<string, string> = {
  main: "Dashboard",
  spiritual: "Spiritual journey",
  account: "Account",
};

function getTabFromUrl(): TabId {
  if (typeof window === "undefined") return "overview";
  const t = new URLSearchParams(window.location.search).get("tab");
  return (NAV.find((n) => n.id === t)?.id) || "overview";
}

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<TabId>(getTabFromUrl());
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!loading && !user) setLocation("/login?next=/dashboard");
  }, [loading, user, setLocation]);

  // Sync URL → tab on browser nav
  useEffect(() => {
    const onPop = () => setTab(getTabFromUrl());
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // Push URL change on tab change (no page reload)
  useEffect(() => {
    const url = new URL(window.location.href);
    if (tab === "overview") url.searchParams.delete("tab");
    else url.searchParams.set("tab", tab);
    window.history.replaceState({}, "", url.toString());
  }, [tab]);

  // Fetch unread count for sidebar badge
  useEffect(() => {
    let cancel = false;
    const fetchUnread = async () => {
      if (!user?.id || !user?.email) return;
      try {
        const { unread } = await listNotifications(user.id, user.email, { limit: 1 });
        if (!cancel) setUnread(unread);
      } catch {}
    };
    fetchUnread();
    const t = setInterval(fetchUnread, 60_000);
    return () => { cancel = true; clearInterval(t); };
  }, [user?.id, user?.email]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-sm text-[#5a4a3a]/60">Loading…</div>;
  if (!user) return null;

  const sidebarStyle = { "--sidebar-width": "16rem", "--sidebar-width-icon": "3.25rem" } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full bg-[#FBF7EE]">
        <Sidebar collapsible="icon">
          <SidebarHeader className="border-b border-[#D4AF37]/20 px-3 py-3">
            <Link href="/" className="flex items-center gap-2 min-w-0" data-testid="link-home-from-dashboard">
              <div className="h-8 w-8 rounded-md bg-[#6D2B35] flex items-center justify-center text-[#D4AF37] shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 group-data-[collapsible=icon]:hidden">
                <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/55">Welcome back</div>
                <div className="text-sm font-serif font-bold text-[#4a1a22] truncate" data-testid="text-dashboard-user">{user.name}</div>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent>
            {(["main", "spiritual", "account"] as const).map((section) => {
              const items = NAV.filter((n) => n.section === section);
              return (
                <SidebarGroup key={section}>
                  <SidebarGroupLabel>{SECTION_LABEL[section]}</SidebarGroupLabel>
                  <SidebarGroupContent>
                    <SidebarMenu>
                      {items.map((n) => {
                        const Icon = n.icon;
                        const active = tab === n.id;
                        return (
                          <SidebarMenuItem key={n.id}>
                            <SidebarMenuButton
                              isActive={active}
                              onClick={() => setTab(n.id)}
                              tooltip={n.label}
                              data-testid={`nav-tab-${n.id}`}
                            >
                              <Icon className="h-4 w-4" />
                              <span>{n.label}</span>
                              {n.badge === "unread" && unread > 0 && (
                                <Badge className="ml-auto h-4 min-w-[1.25rem] px-1 text-[10px] bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]">
                                  {unread > 9 ? "9+" : unread}
                                </Badge>
                              )}
                            </SidebarMenuButton>
                          </SidebarMenuItem>
                        );
                      })}
                    </SidebarMenu>
                  </SidebarGroupContent>
                </SidebarGroup>
              );
            })}
          </SidebarContent>

          <SidebarFooter className="border-t border-[#D4AF37]/20 p-2">
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip="Refer & earn">
                  <Link href="/refer" data-testid="nav-refer">
                    <Heart className="h-4 w-4" />
                    <span>Refer & Earn</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        </Sidebar>

        <SidebarInset className="flex flex-col flex-1 min-w-0">
          <header className="sticky top-0 z-30 bg-white/90 backdrop-blur border-b border-[#D4AF37]/20 px-4 py-2.5 flex items-center gap-3">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <h1 className="text-base md:text-lg font-serif font-bold text-[#4a1a22]" data-testid="text-tab-title">
              {NAV.find((n) => n.id === tab)?.label}
            </h1>
          </header>

          <main className="flex-1 px-3 md:px-6 py-4 md:py-6 max-w-6xl w-full mx-auto">
            {tab === "overview" && <OverviewTab unread={unread} setTab={setTab} />}
            {tab === "bookings" && <MyBookings />}
            {tab === "wishlist" && <Wishlist />}
            {tab === "family" && <FamilyProfiles />}
            {tab === "notifications" && <NotificationsInbox />}
            {tab === "payments" && <PaymentRequestsTab />}
            {tab === "chanting" && (
              <JapCounter
                ownerKey={`user:${user.id}`}
                devoteeName={user.name}
                title="Jap Counter"
                subtitle="Choose a mantra, tap the mala for each japa. Sound and vibration follow every count."
              />
            )}
            {tab === "settings" && <MyProfile />}
          </main>
        </SidebarInset>
      </div>
    </SidebarProvider>
  );
}

function OverviewTab({ unread, setTab }: { unread: number; setTab: (t: TabId) => void }) {
  const { user } = useAuth();
  const tiles = useMemo(() => ([
    { label: "New notifications", value: unread, icon: Bell, color: "text-[#6D2B35]", to: "notifications" as TabId },
    { label: "My bookings",       value: "→",   icon: Calendar, color: "text-emerald-700", to: "bookings" as TabId },
    { label: "Family profiles",   value: "→",   icon: Users2,   color: "text-blue-700",    to: "family" as TabId },
    { label: "Favorites",         value: "→",   icon: Heart,    color: "text-rose-700",    to: "wishlist" as TabId },
  ]), [unread]);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]">Namaste, {user?.name?.split(" ")[0] || "Devotee"}</h2>
        <p className="text-sm text-[#5a4a3a]/70 mt-1">Your spiritual home — bookings, family, and updates in one place.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tiles.map((t) => {
          const Icon = t.icon;
          return (
            <Card key={t.label} className="hover-elevate cursor-pointer" onClick={() => setTab(t.to)} data-testid={`tile-${t.to}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`h-5 w-5 ${t.color}`} />
                  <ArrowRight className="h-4 w-4 text-[#5a4a3a]/40" />
                </div>
                <div className="text-2xl font-bold text-[#4a1a22]" data-testid={`tile-value-${t.to}`}>{t.value}</div>
                <div className="text-[11px] uppercase tracking-wide text-[#5a4a3a]/65 mt-1">{t.label}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <MyPanditMemoriesCard />

      <Card>
        <CardContent className="p-5">
          <h3 className="font-serif font-bold text-[#4a1a22] mb-3">Quick actions</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <QA href="/online-puja-booking" icon={MapPin} label="Book a Puja" />
            <QA href="/book-pandit-online" icon={Sparkles} label="Find a Pandit" />
            <QA href="/puja-samagri-online" icon={IndianRupee} label="Shop Samagri" />
            <QA href="/order-history" icon={Receipt} label="Order History" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function QA({ href, icon: Icon, label }: { href: string; icon: any; label: string }) {
  return (
    <Link href={href} className="flex items-center gap-2 p-3 rounded-md border border-[#D4AF37]/20 hover-elevate text-sm text-[#4a1a22]" data-testid={`quick-action-${label.toLowerCase().replace(/\s+/g, "-")}`}>
      <Icon className="h-4 w-4 text-[#6D2B35]" /> {label}
    </Link>
  );
}

