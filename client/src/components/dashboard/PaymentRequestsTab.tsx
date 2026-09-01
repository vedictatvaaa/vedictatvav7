import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { IndianRupee, ExternalLink, CheckCircle2, Clock, XCircle, Receipt } from "lucide-react";
import { listMyPaymentRequests, type MyPaymentRequest } from "@/lib/dashboardApi";

const STATUS: Record<string, { label: string; tone: string; icon: any }> = {
  pending:   { label: "Pending",   tone: "bg-amber-100 text-amber-900",     icon: Clock },
  paid:      { label: "Paid",      tone: "bg-emerald-100 text-emerald-900", icon: CheckCircle2 },
  cancelled: { label: "Cancelled", tone: "bg-stone-200 text-stone-700",     icon: XCircle },
  expired:   { label: "Expired",   tone: "bg-stone-200 text-stone-700",     icon: XCircle },
};

export default function PaymentRequestsTab() {
  const { user } = useAuth();
  const [items, setItems] = useState<MyPaymentRequest[]>([]);
  const [summary, setSummary] = useState<{ pendingCount: number; pendingValue: number; paidCount: number; paidValue: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    let cancel = false;
    (async () => {
      try {
        setLoading(true); setErr(null);
        const d = await listMyPaymentRequests(user.id, user.email);
        if (cancel) return;
        setItems(d.requests); setSummary(d.summary);
      } catch (e: any) {
        if (!cancel) setErr(e?.message || "Failed to load payment requests");
      } finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, [user?.id]);

  if (!user) return null;

  return (
    <div className="space-y-6" data-testid="payment-requests-tab">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#4a1a22]">Payment Requests</h2>
        <p className="text-sm text-stone-600 mt-1">
          Dakshina, samagri reimbursements, and special-service payments your pandit has raised against you.
          Pay securely with the link, or settle in person and the pandit will mark it received.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500">Pending</div>
            <div className="text-2xl font-serif font-bold text-amber-700" data-testid="text-pending-count">{summary.pendingCount}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500">Pending value</div>
            <div className="text-2xl font-serif font-bold flex items-center gap-1"><IndianRupee className="w-4 h-4" />{summary.pendingValue}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500">Paid</div>
            <div className="text-2xl font-serif font-bold text-emerald-700">{summary.paidCount}</div>
          </CardContent></Card>
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500">Paid value</div>
            <div className="text-2xl font-serif font-bold flex items-center gap-1"><IndianRupee className="w-4 h-4" />{summary.paidValue}</div>
          </CardContent></Card>
        </div>
      )}

      {loading && <div className="text-sm text-stone-500" data-testid="text-loading">Loading…</div>}
      {err && <div className="text-sm text-red-700">{err}</div>}
      {!loading && !err && items.length === 0 && (
        <Card><CardContent className="p-8 text-center text-stone-500">
          <Receipt className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          No payment requests yet. When your pandit raises one, it will appear here with a secure link.
        </CardContent></Card>
      )}

      <div className="grid gap-3">
        {items.map((r) => {
          const s = STATUS[r.status] || STATUS.pending;
          const Icon = s.icon;
          return (
            <Card key={r.id} data-testid={`card-payment-request-${r.id}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <CardTitle className="text-base font-serif text-[#4a1a22]">
                      {r.pandit?.name || "Your pandit"} requested ₹{r.amountInr}
                    </CardTitle>
                    <div className="text-sm text-stone-600 mt-1">{r.purpose}</div>
                    {r.notes && <div className="text-xs text-stone-500 mt-1">{r.notes}</div>}
                  </div>
                  <Badge className={`${s.tone} border-0`}><Icon className="w-3 h-3 mr-1 inline" />{s.label}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pt-0 flex flex-wrap items-center gap-2">
                {r.status === "pending" && r.rpShortUrl && (
                  <Button asChild size="sm" className="bg-[#6D2B35] hover:bg-[#5a232c] text-white" data-testid={`button-pay-${r.id}`}>
                    <a href={r.rpShortUrl} target="_blank" rel="noopener noreferrer">
                      <IndianRupee className="w-3 h-3 mr-1" />Pay ₹{r.amountInr} <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </Button>
                )}
                {r.pandit?.slug && (
                  <Button asChild size="sm" variant="outline" data-testid={`button-view-pandit-${r.id}`}>
                    <a href={`/pandit/${r.pandit.slug}`}>View pandit</a>
                  </Button>
                )}
                <span className="text-xs text-stone-400 ml-auto">
                  {new Date(r.createdAt).toLocaleDateString()}
                  {r.paidAt ? ` · Paid ${new Date(r.paidAt).toLocaleDateString()}` : ""}
                </span>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
