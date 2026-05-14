import { CheckCircle2, Clock, Package as PackageIcon, Truck, MapPin, Home, XCircle } from "lucide-react";

export type TimelineStep = {
  key: string;
  label: string;
  ts?: string | Date | null;
  note?: string | null;
};

const ICONS: Record<string, any> = {
  placed: Clock,
  confirmed: CheckCircle2,
  packed: PackageIcon,
  dispatched: Truck,
  out_for_delivery: MapPin,
  delivered: Home,
};

const ORDER = ["placed", "confirmed", "packed", "dispatched", "out_for_delivery", "delivered"];

const LABELS: Record<string, string> = {
  placed: "Placed",
  confirmed: "Confirmed",
  packed: "Packed",
  dispatched: "Dispatched",
  out_for_delivery: "Out for Delivery",
  delivered: "Delivered",
};

export function statusToStep(status: string | null | undefined, shippingStatus?: string | null): string {
  const s = String(shippingStatus || status || "").toLowerCase().trim();
  if (!s) return "placed";
  if (s === "cancelled" || s === "canceled") return "cancelled";
  // Precedence matters: more specific phrases must be checked before generic substrings.
  if (s.includes("out for delivery") || s.includes("out_for_delivery") || s.includes("ofd")) return "out_for_delivery";
  if (s.includes("undelivered") || s.includes("delivery attempt") || s.includes("rto") || s.includes("returned")) return "dispatched";
  if (/(^|\b)delivered(\b|$)/.test(s) || s === "delivered") return "delivered";
  if (s.includes("transit") || s.includes("shipped") || s.includes("dispatch") || s === "ship") return "dispatched";
  if (s.includes("pickup") || s.includes("packed") || s.includes("manifest") || s.includes("processing") || s.includes("ready")) return "packed";
  if (s.includes("confirm") || s === "paid") return "confirmed";
  return "placed";
}

export default function OrderTimeline({
  status,
  shippingStatus,
  steps,
  compact = false,
}: {
  status: string | null | undefined;
  shippingStatus?: string | null;
  steps?: TimelineStep[];
  compact?: boolean;
}) {
  const currentKey = statusToStep(status, shippingStatus);

  if (currentKey === "cancelled") {
    return (
      <div className="flex items-center gap-2 text-rose-700 text-sm rounded-md border border-rose-200 bg-rose-50 px-3 py-2" data-testid="order-timeline-cancelled">
        <XCircle className="w-4 h-4" />
        <span className="font-medium">Order cancelled</span>
      </div>
    );
  }

  const activeIndex = ORDER.indexOf(currentKey);
  const stepMap = new Map<string, TimelineStep>((steps || []).map((s) => [s.key, s]));

  return (
    <ol
      className={`relative ${compact ? "flex items-start gap-0" : "grid grid-cols-3 sm:grid-cols-6 gap-1"}`}
      data-testid="order-timeline"
    >
      {ORDER.map((key, i) => {
        const Icon = ICONS[key];
        const isDone = i <= activeIndex;
        const isCurrent = i === activeIndex;
        const meta = stepMap.get(key);

        return (
          <li
            key={key}
            className={`relative flex ${compact ? "flex-1 flex-col items-center" : "flex-col items-center"} text-center`}
            data-testid={`timeline-step-${key}`}
          >
            <div
              className={`relative z-10 w-9 h-9 rounded-full flex items-center justify-center border-2 transition-colors ${
                isDone
                  ? "bg-[#6D2B35] border-[#6D2B35] text-[#D4AF37]"
                  : "bg-white border-[#D4AF37]/30 text-[#5a4a3a]/40"
              } ${isCurrent ? "ring-2 ring-[#D4AF37] ring-offset-2 ring-offset-[#FBF7EE]" : ""}`}
            >
              <Icon className="w-4 h-4" />
            </div>
            <span
              className={`mt-1.5 text-[11px] leading-tight ${
                isDone ? "text-[#6D2B35] font-semibold" : "text-[#5a4a3a]/50"
              }`}
            >
              {LABELS[key]}
            </span>
            {meta?.ts && (
              <span className="text-[10px] text-[#5a4a3a]/60 mt-0.5">
                {new Date(meta.ts).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </span>
            )}
            {i < ORDER.length - 1 && (
              <div
                aria-hidden="true"
                className={`absolute top-[18px] left-1/2 right-[-50%] h-0.5 ${
                  i < activeIndex ? "bg-[#6D2B35]" : "bg-[#D4AF37]/20"
                }`}
                style={{ width: "100%" }}
              />
            )}
          </li>
        );
      })}
    </ol>
  );
}
