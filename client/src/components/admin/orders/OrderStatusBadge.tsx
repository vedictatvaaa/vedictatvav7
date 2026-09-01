import { STATUS_COLORS } from "@/pages/admin-shared";
export function OrderStatusBadge({ status, label }: { status?: string | null; label?: string }) {
  const value = status || "Not recorded";
  return <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_COLORS[value.toLowerCase()] || "bg-[#f4ead3] text-[#6d2b35]"}`}>{label || value.replace(/_/g, " ")}</span>;
}