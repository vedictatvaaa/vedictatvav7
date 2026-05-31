import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Star, BookOpen, ChevronDown, ChevronUp, Download,
  MapPin, Phone, User, Calendar, Clock, Package,
  AlertTriangle, CheckCircle2, MessageSquare, IndianRupee,
} from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { PujaBooking, AstrologyBooking } from "@shared/schema";

import { createFetcher, STATUS_COLORS } from "../admin-shared";

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtDate(val: string | Date | null | undefined) {
  if (!val) return "—";
  const d = new Date(val as string);
  return isNaN(d.getTime()) ? String(val) : d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function fmtRupees(val: number | null | undefined) {
  if (!val) return "—";
  return `₹${val.toLocaleString("en-IN")}`;
}

function downloadCsv(filename: string, rows: Record<string, unknown>[]) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r =>
      headers.map(h => {
        const v = r[h];
        if (v === null || v === undefined) return "";
        const s = typeof v === "object" ? JSON.stringify(v) : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      }).join(",")
    ),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function pujaBookingToCsvRow(b: PujaBooking) {
  return {
    id: b.id,
    status: b.status,
    puja_type: b.pujaType,
    mode: b.mode,
    contact_name: b.contactName,
    contact_phone: b.contactPhone,
    location: b.location || "",
    date: b.date,
    time_slot: b.timeSlot,
    confirmed_time_slot: b.confirmedTimeSlot || "",
    total_amount: b.totalAmount,
    tip_amount: b.tipAmountInr || 0,
    pandit_id: b.panditId || "",
    user_id: b.userId || "",
    needs_reassignment: b.needsReassignment ? "Yes" : "No",
    decline_reason: b.declineReason || "",
    samagri_list: b.samagriList ? JSON.stringify(b.samagriList) : "",
    samagri_sent_at: b.samagriSentAt ? fmtDate(b.samagriSentAt) : "",
    created_at: fmtDate(b.createdAt),
    accepted_at: b.acceptedAt ? fmtDate(b.acceptedAt) : "",
    completed_at: b.completedAt ? fmtDate(b.completedAt) : "",
    tip_paid_at: b.tipPaidAt ? fmtDate(b.tipPaidAt) : "",
  };
}

function astrologyBookingToCsvRow(b: AstrologyBooking) {
  return {
    id: b.id,
    status: b.status,
    service_type: b.serviceType,
    full_name: b.fullName,
    birth_date: b.birthDate,
    birth_time: b.birthTime || "",
    birth_city: b.birthCity || "",
    partner_name: b.partnerName || "",
    partner_birth_date: b.partnerBirthDate || "",
    total_amount: b.totalAmount,
    user_id: b.userId || "",
    created_at: fmtDate(b.createdAt),
  };
}

// ─── Detail Row ─────────────────────────────────────────────────────────────

function DetailRow({ icon, label, value }: { icon?: React.ReactNode; label: string; value: React.ReactNode }) {
  if (!value || value === "—") return null;
  return (
    <div className="flex items-start gap-2 text-xs">
      {icon && <span className="mt-0.5 text-muted-foreground shrink-0">{icon}</span>}
      <span className="text-muted-foreground shrink-0 w-32">{label}</span>
      <span className="text-foreground font-medium break-words min-w-0">{value}</span>
    </div>
  );
}

// ─── Puja Booking Card ───────────────────────────────────────────────────────

function PujaBookingCard({
  booking,
  statuses,
  onStatusChange,
  isPending,
}: {
  booking: PujaBooking;
  statuses: string[];
  onStatusChange: (id: number, status: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const samagri = booking.samagriList as Record<string, unknown>[] | null | undefined;

  return (
    <Card className="bg-card border-border" data-testid={`card-puja-booking-${booking.id}`}>
      <CardContent className="py-4 space-y-3">
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-primary">{booking.pujaType}</h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[booking.status] || "bg-muted"}`}>
                {booking.status}
              </span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 capitalize">
                {booking.mode}
              </Badge>
              {booking.needsReassignment && (
                <Badge className="text-[10px] bg-red-100 text-red-700 border-red-200 gap-1">
                  <AlertTriangle className="w-3 h-3" /> Needs Reassignment
                </Badge>
              )}
            </div>

            {/* always-visible summary */}
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{booking.contactName}</span>
              <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{booking.contactPhone}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{booking.date}</span>
              <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.timeSlot}</span>
            </div>

            {/* Location — always visible if present */}
            {booking.location && (
              <p className="flex items-center gap-1 text-xs text-foreground font-medium">
                <MapPin className="w-3 h-3 text-primary" />{booking.location}
              </p>
            )}
          </div>

          {/* Right actions */}
          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="font-bold text-foreground text-lg">{fmtRupees(booking.totalAmount)}</p>
            <Select
              value={booking.status}
              onValueChange={(val) => onStatusChange(booking.id, val)}
              disabled={isPending}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-puja-status-${booking.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* ── Expand toggle ── */}
        <button
          className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
          onClick={() => setExpanded(v => !v)}
          data-testid={`btn-expand-puja-${booking.id}`}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide details" : "Show full details"}
        </button>

        {/* ── Expanded details ── */}
        {expanded && (
          <div className="border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <DetailRow icon={<BookOpen className="w-3.5 h-3.5" />}   label="Booking ID"         value={`#${booking.id}`} />
            <DetailRow icon={<User className="w-3.5 h-3.5" />}       label="User ID"             value={booking.userId ? `#${booking.userId}` : "—"} />
            <DetailRow icon={<User className="w-3.5 h-3.5" />}       label="Pandit ID"           value={booking.panditId ? `#${booking.panditId}` : "Not assigned"} />
            <DetailRow icon={<MapPin className="w-3.5 h-3.5" />}     label="Location"            value={booking.location || "—"} />
            <DetailRow icon={<Clock className="w-3.5 h-3.5" />}      label="Confirmed Slot"      value={booking.confirmedTimeSlot || "—"} />
            <DetailRow icon={<IndianRupee className="w-3.5 h-3.5" />} label="Tip"                value={booking.tipAmountInr ? `₹${booking.tipAmountInr.toLocaleString("en-IN")}${booking.tipPaidAt ? " (paid)" : " (unpaid)"}` : "—"} />
            <DetailRow icon={<Calendar className="w-3.5 h-3.5" />}   label="Booked On"           value={fmtDate(booking.createdAt)} />
            <DetailRow icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Accepted At"       value={fmtDate(booking.acceptedAt)} />
            <DetailRow icon={<CheckCircle2 className="w-3.5 h-3.5" />} label="Completed At"      value={fmtDate(booking.completedAt)} />
            <DetailRow icon={<Package className="w-3.5 h-3.5" />}    label="Samagri Sent"        value={fmtDate(booking.samagriSentAt)} />
            {booking.declineReason && (
              <div className="col-span-2">
                <DetailRow icon={<MessageSquare className="w-3.5 h-3.5" />} label="Decline Reason" value={booking.declineReason} />
              </div>
            )}
            {samagri && samagri.length > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> Samagri List
                </p>
                <ul className="text-xs space-y-0.5 pl-5 list-disc text-foreground">
                  {samagri.map((item, i) => (
                    <li key={i}>{typeof item === "object" ? JSON.stringify(item) : String(item)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Astrology Booking Card ──────────────────────────────────────────────────

function AstrologyBookingCard({
  booking,
  statuses,
  onStatusChange,
  isPending,
}: {
  booking: AstrologyBooking;
  statuses: string[];
  onStatusChange: (id: number, status: string) => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="bg-card border-border" data-testid={`card-astrology-booking-${booking.id}`}>
      <CardContent className="py-4 space-y-3">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-primary">{booking.serviceType}</h3>
              <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[booking.status] || "bg-muted"}`}>
                {booking.status}
              </span>
            </div>
            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-sm text-muted-foreground">
              <span className="flex items-center gap-1"><User className="w-3 h-3" />{booking.fullName}</span>
              <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />DOB: {booking.birthDate}</span>
              {booking.birthTime && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{booking.birthTime}</span>}
              {booking.birthCity && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{booking.birthCity}</span>}
            </div>
            {booking.partnerName && (
              <p className="text-xs text-muted-foreground">Partner: <span className="text-foreground font-medium">{booking.partnerName}</span></p>
            )}
          </div>

          <div className="flex flex-col items-end gap-2 shrink-0">
            <p className="font-bold text-foreground text-lg">{fmtRupees(booking.totalAmount)}</p>
            <Select
              value={booking.status}
              onValueChange={(val) => onStatusChange(booking.id, val)}
              disabled={isPending}
            >
              <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-astrology-status-${booking.id}`}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <button
          className="flex items-center gap-1 text-xs text-primary/70 hover:text-primary transition-colors"
          onClick={() => setExpanded(v => !v)}
          data-testid={`btn-expand-astrology-${booking.id}`}
        >
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {expanded ? "Hide details" : "Show full details"}
        </button>

        {expanded && (
          <div className="border-t border-border pt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2">
            <DetailRow icon={<Star className="w-3.5 h-3.5" />}       label="Booking ID"        value={`#${booking.id}`} />
            <DetailRow icon={<User className="w-3.5 h-3.5" />}       label="User ID"           value={booking.userId ? `#${booking.userId}` : "Guest"} />
            <DetailRow icon={<User className="w-3.5 h-3.5" />}       label="Full Name"         value={booking.fullName} />
            <DetailRow icon={<Calendar className="w-3.5 h-3.5" />}   label="Date of Birth"     value={booking.birthDate} />
            <DetailRow icon={<Clock className="w-3.5 h-3.5" />}      label="Time of Birth"     value={booking.birthTime || "—"} />
            <DetailRow icon={<MapPin className="w-3.5 h-3.5" />}     label="Birth City"        value={booking.birthCity || "—"} />
            <DetailRow icon={<User className="w-3.5 h-3.5" />}       label="Partner Name"      value={booking.partnerName || "—"} />
            <DetailRow icon={<Calendar className="w-3.5 h-3.5" />}   label="Partner DOB"       value={booking.partnerBirthDate || "—"} />
            <DetailRow icon={<Calendar className="w-3.5 h-3.5" />}   label="Booked On"         value={fmtDate(booking.createdAt)} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Tab ────────────────────────────────────────────────────────────────

function BookingsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"puja" | "astrology">("puja");
  const [pujaSearch, setPujaSearch] = useState("");
  const [astroSearch, setAstroSearch] = useState("");

  const { data: pujaBookings, isLoading: loadingPuja } = useQuery<PujaBooking[]>({
    queryKey: ["/api/puja-bookings"],
    queryFn: () => fetcher("/api/puja-bookings"),
  });

  const { data: astrologyBookings, isLoading: loadingAstro } = useQuery<AstrologyBooking[]>({
    queryKey: ["/api/astrology-bookings"],
    queryFn: () => fetcher("/api/astrology-bookings"),
  });

  const updatePujaMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/puja-bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/puja-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Booking Updated", description: "Puja booking status updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" }),
  });

  const updateAstroMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/astrology-bookings/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/astrology-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Booking Updated", description: "Astrology booking status updated." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update booking.", variant: "destructive" }),
  });

  const bookingStatuses = ["pending", "confirmed", "completed", "cancelled"];

  const filteredPuja = (pujaBookings || []).filter(b =>
    !pujaSearch ||
    b.contactName.toLowerCase().includes(pujaSearch.toLowerCase()) ||
    b.contactPhone.includes(pujaSearch) ||
    b.pujaType.toLowerCase().includes(pujaSearch.toLowerCase()) ||
    (b.location || "").toLowerCase().includes(pujaSearch.toLowerCase()) ||
    b.status.includes(pujaSearch.toLowerCase())
  );

  const filteredAstro = (astrologyBookings || []).filter(b =>
    !astroSearch ||
    b.fullName.toLowerCase().includes(astroSearch.toLowerCase()) ||
    b.serviceType.toLowerCase().includes(astroSearch.toLowerCase()) ||
    b.status.includes(astroSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-bookings">Bookings</h1>
        <p className="text-sm text-muted-foreground">Manage puja and astrology bookings</p>
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2">
        <Button
          variant={view === "puja" ? "default" : "outline"}
          onClick={() => setView("puja")}
          className={view === "puja" ? "bg-primary text-white" : ""}
          data-testid="btn-view-puja"
        >
          <BookOpen className="w-4 h-4 mr-2" /> Puja Bookings ({pujaBookings?.length || 0})
        </Button>
        <Button
          variant={view === "astrology" ? "default" : "outline"}
          onClick={() => setView("astrology")}
          className={view === "astrology" ? "bg-primary text-white" : ""}
          data-testid="btn-view-astrology"
        >
          <Star className="w-4 h-4 mr-2" /> Astrology Bookings ({astrologyBookings?.length || 0})
        </Button>
      </div>

      {/* ── Puja Bookings ──────────────────────────────────────────────── */}
      {view === "puja" && (
        loadingPuja ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="search"
                placeholder="Search by name, phone, type, location…"
                value={pujaSearch}
                onChange={e => setPujaSearch(e.target.value)}
                className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="input-search-puja"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => downloadCsv(`puja-bookings-${new Date().toISOString().slice(0, 10)}.csv`, filteredPuja.map(pujaBookingToCsvRow))}
                data-testid="btn-download-puja-csv"
                disabled={!filteredPuja.length}
              >
                <Download className="w-4 h-4" />
                Download CSV ({filteredPuja.length})
              </Button>
            </div>

            {filteredPuja.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {pujaSearch ? "No bookings match your search." : "No puja bookings yet."}
              </p>
            )}

            {filteredPuja.map((booking) => (
              <PujaBookingCard
                key={booking.id}
                booking={booking}
                statuses={bookingStatuses}
                onStatusChange={(id, status) => updatePujaMutation.mutate({ id, status })}
                isPending={updatePujaMutation.isPending}
              />
            ))}
          </div>
        )
      )}

      {/* ── Astrology Bookings ─────────────────────────────────────────── */}
      {view === "astrology" && (
        loadingAstro ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-4">
            {/* Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <input
                type="search"
                placeholder="Search by name, service, status…"
                value={astroSearch}
                onChange={e => setAstroSearch(e.target.value)}
                className="flex-1 h-9 px-3 rounded-md border border-input bg-background text-sm focus:outline-none focus:ring-1 focus:ring-primary"
                data-testid="input-search-astrology"
              />
              <Button
                variant="outline"
                size="sm"
                className="gap-1.5 shrink-0"
                onClick={() => downloadCsv(`astrology-bookings-${new Date().toISOString().slice(0, 10)}.csv`, filteredAstro.map(astrologyBookingToCsvRow))}
                data-testid="btn-download-astrology-csv"
                disabled={!filteredAstro.length}
              >
                <Download className="w-4 h-4" />
                Download CSV ({filteredAstro.length})
              </Button>
            </div>

            {filteredAstro.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                {astroSearch ? "No bookings match your search." : "No astrology bookings yet."}
              </p>
            )}

            {filteredAstro.map((booking) => (
              <AstrologyBookingCard
                key={booking.id}
                booking={booking}
                statuses={bookingStatuses}
                onStatusChange={(id, status) => updateAstroMutation.mutate({ id, status })}
                isPending={updateAstroMutation.isPending}
              />
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default BookingsTab;
