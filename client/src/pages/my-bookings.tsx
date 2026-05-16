import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { CalendarDays, Phone, MapPin, Video, MessageSquare, Sparkles, ClipboardList, Mic } from "lucide-react";

type Booking = {
  id: number; userId: number | null; panditId: number | null;
  pujaType: string; mode: string; date: string; timeSlot: string;
  location: string | null; contactName: string; contactPhone: string;
  status: string; totalAmount: number;
  acceptedAt: string | null; confirmedTimeSlot: string | null;
  samagriList: any; samagriSentAt: string | null;
  tipAmountInr: number; tipPaidAt: string | null;
  completedAt: string | null; declineReason: string | null;
  accessToken: string | null; createdAt: string;
};

const STATUS_BADGE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900 border-amber-300",
  accepted: "bg-emerald-100 text-emerald-900 border-emerald-300",
  completed: "bg-sky-100 text-sky-900 border-sky-300",
  declined: "bg-rose-100 text-rose-900 border-rose-300",
  cancelled: "bg-stone-100 text-stone-700 border-stone-300",
};

export default function MyBookingsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("active");

  useEffect(() => {
    if (!user) { setLocation("/login"); return; }
    fetch(`/api/my-bookings/${user.id}?email=${encodeURIComponent(user.email)}`)
      .then((r) => r.json())
      .then((j) => setBookings(j.bookings || []))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) return null;

  const active = bookings.filter((b) => ["pending", "accepted"].includes(b.status));
  const past = bookings.filter((b) => ["completed", "declined", "cancelled"].includes(b.status));

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <div className="container mx-auto px-4 py-6 max-w-5xl">
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-my-bookings-title">My Puja Bookings</h1>
          <p className="text-sm text-[#5a4a3a]/70 mt-1">Manage your pujas, message panditji, see samagri lists, and join online puja video calls.</p>
        </div>

        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="grid grid-cols-2 w-full max-w-sm">
            <TabsTrigger value="active" data-testid="tab-active">Active {active.length > 0 && <Badge className="ml-1.5 bg-[#6D2B35]">{active.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="past" data-testid="tab-past">Past</TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="mt-4 space-y-3">
            {loading ? <div className="text-center text-sm text-[#5a4a3a]/60 py-10">Loading...</div>
              : active.length === 0 ? <EmptyState />
              : active.map((b) => <BookingCard key={b.id} b={b} userName={user.name} />)}
          </TabsContent>
          <TabsContent value="past" className="mt-4 space-y-3">
            {past.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-[#5a4a3a]/55">No past bookings.</CardContent></Card>
              : past.map((b) => <BookingCard key={b.id} b={b} userName={user.name} />)}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        <Sparkles className="h-10 w-10 text-[#D4AF37] mx-auto mb-2" />
        <p className="text-sm font-semibold text-[#4a1a22]">No active puja bookings yet.</p>
        <p className="text-xs text-[#5a4a3a]/60 mt-1 mb-4">Book a puja with a verified pandit — online or at home.</p>
        <Link href="/online-puja-booking"><Button className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-book-puja">Browse Pujas</Button></Link>
      </CardContent>
    </Card>
  );
}

function BookingCard({ b, userName }: { b: Booking; userName: string }) {
  const cls = STATUS_BADGE[b.status] || STATUS_BADGE.pending;
  const callLink = `/puja-call/${b.id}?t=${b.accessToken || ""}&name=${encodeURIComponent(userName)}`;
  const detailLink = `/my-puja-booking/${b.id}${b.accessToken ? `?t=${b.accessToken}` : ""}`;
  const showCall = b.mode === "online" && b.status === "accepted";

  return (
    <Card data-testid={`card-booking-${b.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4 flex-wrap">
          <div className="bg-[#FBF7EE] border border-[#D4AF37]/30 rounded-md py-2 px-3 text-center min-w-[64px]">
            <div className="text-[10px] uppercase text-[#5a4a3a]/60">{new Date(b.date + "T00:00:00").toLocaleDateString(undefined, { month: "short" })}</div>
            <div className="text-2xl font-bold text-[#4a1a22] leading-none">{new Date(b.date + "T00:00:00").getDate()}</div>
            <div className="text-[9px] text-[#5a4a3a]/65 mt-0.5">{b.confirmedTimeSlot || b.timeSlot}</div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif font-semibold text-[#4a1a22] text-base">{b.pujaType}</h3>
              <Badge variant="outline" className={`text-[10px] uppercase ${cls}`}>{b.status}</Badge>
              <Badge variant="secondary" className="text-[10px]">{b.mode === "online" ? "Online Puja" : "At Home"}</Badge>
            </div>
            <div className="text-xs text-[#5a4a3a]/75 mt-1 flex flex-wrap gap-x-3 gap-y-0.5">
              <span><Phone className="h-3 w-3 inline mr-1" />{b.contactPhone}</span>
              {b.location && <span><MapPin className="h-3 w-3 inline mr-1" />{b.location}</span>}
            </div>
            <div className="text-sm text-[#6D2B35] font-bold mt-1">₹{b.totalAmount.toLocaleString("en-IN")}</div>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Link href={detailLink}>
            <Button size="sm" variant="outline" data-testid={`btn-chat-${b.id}`}><MessageSquare className="h-4 w-4 mr-1.5" />Messages & Samagri</Button>
          </Link>
          {showCall && (
            <>
              <Link href={callLink}>
                <Button size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" data-testid={`btn-join-video-${b.id}`}><Video className="h-4 w-4 mr-1.5" />Join Video Call</Button>
              </Link>
              <Link href={callLink + "&audio=1"}>
                <Button size="sm" variant="outline" className="border-emerald-300 text-emerald-800" data-testid={`btn-join-audio-${b.id}`}><Mic className="h-4 w-4 mr-1.5" />Audio Only</Button>
              </Link>
            </>
          )}
          {Array.isArray(b.samagriList) && b.samagriList.length > 0 && (
            <Badge className="bg-[#D4AF37]/15 text-[#4a1a22] border border-[#D4AF37]/40"><ClipboardList className="h-3 w-3 mr-1" />{b.samagriList.length} samagri items</Badge>
          )}
        </div>
        {b.status === "pending" && <p className="text-[11px] text-amber-800 mt-2">Awaiting pandit confirmation. You'll be notified once accepted.</p>}
        {b.status === "declined" && b.declineReason && <p className="text-[11px] text-rose-800 mt-2">Declined: {b.declineReason}. Our team will reassign.</p>}
      </CardContent>
    </Card>
  );
}
