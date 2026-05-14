import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Star, Type, BookOpen } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { PujaBooking, AstrologyBooking } from "@shared/schema";

import { createFetcher, STATUS_COLORS } from "../admin-shared";

// ============================================================
// Bookings Tab
// ============================================================
function BookingsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [view, setView] = useState<"puja" | "astrology">("puja");

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-bookings">Bookings</h1>
        <p className="text-sm text-muted-foreground">Manage puja and astrology bookings</p>
      </div>

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

      {view === "puja" && (
        loadingPuja ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {(pujaBookings || []).map((booking) => (
              <Card key={booking.id} className="bg-card border-border" data-testid={`card-puja-booking-${booking.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-primary">{booking.pujaType}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[booking.status] || "bg-muted"}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.contactName} · {booking.contactPhone}</p>
                      <p className="text-xs text-secondary">{booking.date} · {booking.timeSlot} · {booking.mode}</p>
                      {booking.location && <p className="text-xs text-muted-foreground">📍 {booking.location}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-foreground">₹{booking.totalAmount.toLocaleString()}</p>
                      <Select value={booking.status} onValueChange={(val) => updatePujaMutation.mutate({ id: booking.id, status: val })}>
                        <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-puja-status-${booking.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bookingStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(pujaBookings || []).length === 0 && <p className="text-center text-muted-foreground py-8">No puja bookings.</p>}
          </div>
        )
      )}

      {view === "astrology" && (
        loadingAstro ? (
          <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
        ) : (
          <div className="space-y-3">
            {(astrologyBookings || []).map((booking) => (
              <Card key={booking.id} className="bg-card border-border" data-testid={`card-astrology-booking-${booking.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium text-primary">{booking.serviceType}</h3>
                        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${STATUS_COLORS[booking.status] || "bg-muted"}`}>
                          {booking.status}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{booking.fullName}</p>
                      <p className="text-xs text-secondary">DOB: {booking.birthDate} {booking.birthTime ? `· ${booking.birthTime}` : ""} {booking.birthCity ? `· ${booking.birthCity}` : ""}</p>
                      {booking.partnerName && <p className="text-xs text-muted-foreground">Partner: {booking.partnerName}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-foreground">₹{booking.totalAmount.toLocaleString()}</p>
                      <Select value={booking.status} onValueChange={(val) => updateAstroMutation.mutate({ id: booking.id, status: val })}>
                        <SelectTrigger className="w-[130px] h-8 text-xs" data-testid={`select-astrology-status-${booking.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {bookingStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {(astrologyBookings || []).length === 0 && <p className="text-center text-muted-foreground py-8">No astrology bookings.</p>}
          </div>
        )
      )}
    </div>
  );
}


export default BookingsTab;
