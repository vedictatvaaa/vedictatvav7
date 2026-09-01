import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { panditApi } from "@/lib/panditAuth";
import { Booking, BookingDetailDialog } from "@/components/pandit/PanditBookingWorkflow";
import { PanditEmptyState, PanditErrorState, PanditLoadingState, PanditSectionHeader } from "@/components/pandit/PanditSection";

export default function PanditCalendar({ refresh }: { refresh: () => void }) {
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [items, setItems] = useState<Booking[]>([]);
  const [open, setOpen] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await panditApi("GET", `/api/pandit/bookings/calendar?month=${month}`);
      setItems(response.bookings || []);
    } catch (cause: any) {
      setError(cause?.message || "This month’s bookings could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, [month]);

  useEffect(() => {
    void load();
  }, [load]);

  const date = new Date(`${month}-01T00:00:00`);
  const days = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  const start = date.getDay();
  const bookingMap = useMemo(
    () => items.reduce((result, booking) => {
      (result[booking.date] ||= []).push(booking);
      return result;
    }, {} as Record<string, Booking[]>),
    [items],
  );
  const move = (amount: number) => {
    const next = new Date(date);
    next.setMonth(next.getMonth() + amount);
    setMonth(next.toISOString().slice(0, 7));
  };

  return (
    <div className="min-w-0 space-y-5">
      <PanditSectionHeader title="Calendar" description="See the rhythm of your practice and open any scheduled puja." />
      <Card className="min-w-0 border-[#d8c8ae] bg-[#fffdf8]">
        <CardContent className="p-3 sm:p-4">
          <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
            <Button size="icon" variant="outline" onClick={() => move(-1)} aria-label="Previous month"><ChevronLeft className="h-4 w-4" /></Button>
            <h3 className="min-w-0 truncate text-center font-serif text-lg text-[#55252d] sm:text-xl">{date.toLocaleDateString(undefined, { month: "long", year: "numeric" })}</h3>
            <Button size="icon" variant="outline" onClick={() => move(1)} aria-label="Next month"><ChevronRight className="h-4 w-4" /></Button>
          </div>
          {loading ? (
            <PanditLoadingState label="Loading this month’s bookings…" />
          ) : error ? (
            <PanditErrorState title="Calendar unavailable" detail={error} onRetry={() => void load()} />
          ) : (
            <>
              <div className="mb-1 grid grid-cols-7 text-center text-[10px] font-bold uppercase text-[#806f5e]">
                {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => <span key={index}>{day}</span>)}
              </div>
              <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: start }, (_, index) => <div key={`pad-${index}`} />)}
                {Array.from({ length: days }, (_, index) => {
                  const day = index + 1;
                  const key = `${month}-${String(day).padStart(2, "0")}`;
                  const dayItems = bookingMap[key] || [];
                  return (
                    <button
                      key={day}
                      onClick={() => dayItems[0] && setOpen(dayItems[0])}
                      className={`min-h-12 min-w-0 rounded border p-1 text-left text-[11px] sm:min-h-14 sm:text-xs ${dayItems.length ? "border-[#e6b957] bg-[#f2e6d2]" : "border-[#e4d7c3]"}`}
                      data-testid={`cal-day-${day}`}
                    >
                      <b>{day}</b>
                      {dayItems.slice(0, 2).map((booking) => (
                        <span key={booking.id} className={`mt-1 block truncate rounded px-1 text-[8px] sm:text-[9px] ${booking.status === "accepted" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
                          {booking.timeSlot}
                        </span>
                      ))}
                    </button>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>
      {!loading && !error && items.length === 0 && <PanditEmptyState icon={CalendarDays} title="No pujas this month" detail="Accepted and pending bookings will appear on their scheduled dates." />}
      <BookingDetailDialog booking={open} onClose={() => setOpen(null)} onUpdated={() => { setOpen(null); refresh(); void load(); }} />
    </div>
  );
}