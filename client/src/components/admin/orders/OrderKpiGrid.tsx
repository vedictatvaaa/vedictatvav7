import { IndianRupee, Package, Truck, Clock, ClipboardCheck, Boxes } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export type OperationalSummary = {
  todayOrders?: number; todayRevenue?: number; todayUnits?: number;
  awaitingConfirmation?: number; awaitingPicking?: number; awaitingPacking?: number;
  readyToDispatch?: number; dispatchedToday?: number; staleOrders?: number;
  codOrders?: number; prepaidOrders?: number; returnsRefunds?: number;
};

const cards = [
  ["Today’s orders", "todayOrders", Package], ["Today’s revenue", "todayRevenue", IndianRupee],
  ["Items today", "todayUnits", Boxes], ["Awaiting confirmation", "awaitingConfirmation", ClipboardCheck],
  ["Awaiting picking", "awaitingPicking", Package], ["Awaiting packing", "awaitingPacking", Package],
  ["Ready to dispatch", "readyToDispatch", Truck], ["Dispatched today", "dispatchedToday", Truck],
  ["Operational ageing", "staleOrders", Clock], ["COD orders", "codOrders", Package],
  ["Prepaid orders", "prepaidOrders", IndianRupee], ["Returns & refunds", "returnsRefunds", ClipboardCheck],
] as const;

export function OrderKpiGrid({ operational }: { operational?: OperationalSummary }) {
  return <section className="grid grid-cols-1 gap-2 min-[360px]:grid-cols-2 sm:grid-cols-3 xl:grid-cols-6" aria-label="Order operations summary">
    {cards.map(([label, key, Icon]) => {
      const value = operational?.[key];
      return <Card key={key} className="min-w-0 overflow-hidden border-[#d4af37]/30 bg-[#fffaf0] shadow-sm">
        <CardContent className="flex min-h-[88px] flex-col justify-between p-3.5">
          <div className="flex justify-between gap-2 text-[#6d2b35]"><p className="text-[10px] font-bold uppercase tracking-[.11em] leading-tight">{label}</p><Icon className="h-4 w-4 shrink-0 text-[#b38a24]" /></div>
          <p className="mt-2 truncate font-serif text-xl font-semibold text-[#5c202b]">{value === undefined ? "—" : key === "todayRevenue" ? `₹${Math.round(value).toLocaleString("en-IN")}` : value}</p>
        </CardContent>
      </Card>;
    })}
  </section>;
}