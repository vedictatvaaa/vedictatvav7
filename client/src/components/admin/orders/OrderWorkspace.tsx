import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Boxes, Clock, Mail, MapPin, Package, Truck } from "lucide-react";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { OrderStatusBadge } from "./OrderStatusBadge";

type WorkspaceProps = {
  orderId: number | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fetcher: (url: string) => Promise<any>;
  onTransition: (id: number, status: string) => void;
};

const display = (value: unknown) => value === null || value === undefined || value === "" ? "Not recorded" : String(value);
const money = (value: unknown) => value === null || value === undefined ? "Not recorded" : `₹${Number(value).toLocaleString("en-IN")}`;
const paymentFor = (order: any) => order?.operational?.payment || { method: null, status: null, amount: null, paymentId: null };

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return <section className="rounded-xl border border-[#d4af37]/30 bg-[#fffdf8] p-4">
    <h3 className="mb-3 flex items-center gap-2 font-serif text-base text-[#6d2b35]">
      <span className="h-4 w-4 text-[#b38a24]">{icon}</span>{title}
    </h3>
    {children}
  </section>;
}

function Data({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3 py-1 text-xs">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-right font-medium text-[#5c202b]">{value}</span>
  </div>;
}

function HistoricalItems({ items }: { items: unknown }) {
  if (!Array.isArray(items) || !items.length) return <p className="text-sm text-muted-foreground">No historical item lines recorded.</p>;
  return <div className="space-y-2">{items.map((item: any, index: number) => {
    const lineTotal = item.lineTotal ?? item.total;
    return <div key={index} className="flex min-w-0 gap-3 rounded-lg border border-[#d4af37]/20 bg-white/60 p-3">
      {item.image || item.imageUrl ? <img src={item.image || item.imageUrl} alt="" className="h-10 w-10 shrink-0 rounded object-cover" /> : null}
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-[#5c202b]">{display(item.name ?? item.productName)}</p>
        <p className="text-xs text-muted-foreground">SKU: {display(item.sku)} · Variant: {display(item.variant ?? item.packSize)}</p>
        <p className="text-xs text-muted-foreground">Quantity: {display(item.quantity)} · Unit price: {money(item.unitPrice ?? item.price)} · Discount: {money(item.discount)} · Tax: {money(item.tax ?? item.gstAmount)}</p>
      </div>
      <b className="shrink-0 text-sm">{money(lineTotal)}</b>
    </div>;
  })}</div>;
}

function Inventory({ lines }: { lines: any[] | undefined }) {
  if (!lines?.length) return <p className="text-sm text-muted-foreground">No inventory verification is available for the historical item lines.</p>;
  return <div className="space-y-1.5">{lines.map((line, index) => <p key={index} className="text-xs capitalize">
    {String(line.status || "unable_to_verify").replaceAll("_", " ")} · required {display(line.requiredQuantity)}
    {line.availableQuantity !== null && line.availableQuantity !== undefined ? ` / available ${line.availableQuantity}` : ""}
    {line.shortBy ? ` · short by ${line.shortBy}` : ""}
  </p>)}</div>;
}

function Events({ events }: { events: any[] | undefined }) {
  if (!events?.length) return <p className="text-sm text-muted-foreground">No post-rollout status events recorded yet.</p>;
  return <ol className="space-y-2">{events.map((event) => <li key={event.id} className="border-l-2 border-[#d4af37] pl-3 text-sm">
    <b>{display(event.previousStatus)} → {display(event.nextStatus)}</b>
    <p className="text-xs text-muted-foreground">{event.createdAt ? new Date(event.createdAt).toLocaleString("en-IN") : "Timestamp not recorded"} · {display(event.actorLabel ?? event.actorType)}</p>
    {event.reason ? <p className="text-xs text-muted-foreground">Reason: {event.reason}</p> : null}
  </li>)}</ol>;
}

export function OrderWorkspace({ orderId, open, onOpenChange, fetcher, onTransition }: WorkspaceProps) {
  const detail = useQuery({
    queryKey: ["/api/orders", orderId],
    queryFn: () => fetcher(`/api/orders/${orderId}`),
    enabled: open && !!orderId,
  });
  const order = detail.data;
  const op = order?.operational;
  const payment = paymentFor(order);
  const related = order?.related || {};

  return <Sheet open={open} onOpenChange={onOpenChange}>
    <SheetContent side="right" className="w-full overflow-y-auto overflow-x-hidden border-[#d4af37]/40 bg-[#fffaf0] p-0 sm:max-w-3xl">
      <SheetHeader className="sr-only">
        <SheetTitle>Order {orderId ? `#${orderId}` : ""} workspace</SheetTitle>
        <SheetDescription>Review this order's operational status, historical details, inventory verification, and fulfilment timeline.</SheetDescription>
      </SheetHeader>
      {detail.isLoading ? <div className="space-y-4 p-6"><Skeleton className="h-16" /><Skeleton className="h-80" /></div> : null}
      {detail.isError ? <div className="p-8 text-center text-[#8b2635]"><AlertCircle className="mx-auto mb-2" />Unable to load this order. Please try again.</div> : null}
      {!detail.isLoading && !detail.isError && !order ? <div className="p-8 text-center">Order not found.</div> : null}
      {order ? <><div className="sticky top-0 z-10 border-b border-[#d4af37]/30 bg-[#fffaf0]/95 p-5 text-left backdrop-blur">
        <h2 className="font-serif text-2xl font-semibold text-[#6d2b35]">Order #{order.id}</h2>
        <p className="text-xs text-muted-foreground">Placed: {order.createdAt ? new Date(order.createdAt).toLocaleString("en-IN") : "Not recorded"}</p>
        <div className="flex flex-wrap items-center gap-2"><OrderStatusBadge status={order.status} /><OrderStatusBadge status={payment.status} label={`${display(payment.method)} · ${display(payment.status)}`} /><span className="text-sm font-semibold text-[#6d2b35]">{money(order.totalAmount)}</span></div>
      </div>
      <div className="grid gap-4 p-5 lg:grid-cols-[minmax(0,1fr)_250px]"><main className="min-w-0 space-y-4">
        <Section title="Operational next step" icon={<Clock />}>{op?.nextAction?.available ? <Button className="bg-[#6d2b35] text-[#f7d66d] hover:bg-[#541f28]" onClick={() => onTransition(order.id, op.nextAction.targetStatus)}>{op.nextAction.action}</Button> : <p className="text-sm text-muted-foreground">{op?.nextAction?.reason || "No further operational action"}</p>}</Section>
        <Section title="Historical items" icon={<Package />}><HistoricalItems items={order.items} /></Section>
        <Section title="Timeline & status events" icon={<Clock />}><Events events={related.statusEvents} /></Section>
      </main><aside className="min-w-0 space-y-4">
        <Section title="Order summary" icon={<Boxes />}><Data label="Items / units" value={`${op?.counts?.itemCount ?? "—"} / ${op?.counts?.unitCount ?? "—"}`} /><Data label="Unique SKUs" value={display(op?.counts?.uniqueSkuCount)} /><Data label="Subtotal" value={money(order.subtotal)} /><Data label="Coupon" value={display(order.couponCode)} /><Data label="Coupon discount" value={money(order.couponDiscount)} /><Data label="Prepaid discount" value={money(order.prepaidDiscount)} /><Data label="Shipping" value={money(order.shippingCharges)} /><Data label="COD charges" value={money(order.codCharges)} /><Data label="GST" value={money(order.gstAmount)} /><Data label="Grand total" value={money(order.totalAmount)} /></Section>
        <Section title="Inventory verification" icon={<Boxes />}><Inventory lines={op?.inventory} /></Section>
        <Section title="Customer & addresses" icon={<MapPin />}><Data label="Customer" value={display(order.customerName)} /><Data label="Email" value={display(order.customerEmail)} /><Data label="Phone" value={display(order.customerPhone)} /><p className="mt-2 text-xs font-medium">Shipping</p><p className="whitespace-pre-wrap text-xs text-muted-foreground">{display(order.shippingAddress)}</p><p className="mt-2 text-xs font-medium">Billing</p><p className="whitespace-pre-wrap text-xs text-muted-foreground">{display(order.billingAddress)}</p></Section>
        <Section title="Payment" icon={<Mail />}><Data label="Method" value={display(payment.method)} /><Data label="Status" value={display(payment.status)} /><Data label="Amount" value={money(payment.amount)} /><Data label="Payment ID" value={display(payment.paymentId)} /></Section>
        <Section title="Dispatch & documents" icon={<Truck />}><Data label="Courier" value={display(related.dispatch?.courierName)} /><Data label="Tracking" value={display(related.dispatch?.trackingNumber ?? related.dispatch?.waybill)} /><Data label="Shipping state" value={display(related.dispatch?.shippingStatus)} /><Data label="Dispatch date" value={related.dispatch?.dispatchedAt ? new Date(related.dispatch.dispatchedAt).toLocaleString("en-IN") : "Not recorded"} /><Data label="Invoice" value={display(related.invoice?.invoiceNumber ?? related.invoice?.id)} /><Data label="Returns" value={related.returns?.length ? `${related.returns.length} record(s)` : "None recorded"} /></Section>
      </aside></div></> : null}
    </SheetContent>
  </Sheet>;
}