import { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { panditApi } from "@/lib/panditAuth";
import {
  IndianRupee, Plus, Loader2, Copy, ExternalLink, Check,
  XCircle, Clock, MessageCircle, Wallet,
} from "lucide-react";

type PaymentRequest = {
  id: number;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  amountInr: number;
  purpose: string;
  notes: string | null;
  status: "pending" | "paid" | "cancelled" | "expired";
  rpShortUrl: string | null;
  paidAt: string | null;
  manualPaidNote: string | null;
  expiresAt: string | null;
  createdAt: string;
};
type Resp = {
  requests: PaymentRequest[];
  summary: { pendingCount: number; paidCount: number; pendingValue: number; paidValue: number };
};

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PanditPayments() {
  const { toast } = useToast();
  const [data, setData] = useState<Resp | null>(null);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "paid" | "cancelled">("all");
  const [form, setForm] = useState({
    customerName: "", customerPhone: "", customerEmail: "",
    amountInr: "", purpose: "", notes: "",
  });

  async function load() {
    setLoading(true);
    try { setData(await panditApi("GET", "/api/pandit/payment-requests") as Resp); }
    catch (e: any) { toast({ title: "Failed to load", description: e?.message, variant: "destructive" }); }
    finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (!data?.requests) return [];
    if (filter === "all") return data.requests;
    return data.requests.filter((r) => r.status === filter);
  }, [data, filter]);

  async function submit() {
    const amt = Number(form.amountInr);
    if (!form.customerName.trim() || !form.customerPhone.trim() || !form.purpose.trim()) {
      toast({ title: "Fill name, phone, and purpose", variant: "destructive" }); return;
    }
    if (!Number.isFinite(amt) || amt < 1 || amt > 200000) {
      toast({ title: "Amount must be ₹1 to ₹2,00,000", variant: "destructive" }); return;
    }
    setSubmitting(true);
    try {
      await panditApi("POST", "/api/pandit/payment-requests", {
        customerName: form.customerName.trim(),
        customerPhone: form.customerPhone.trim(),
        customerEmail: form.customerEmail.trim() || undefined,
        amountInr: amt,
        purpose: form.purpose.trim(),
        notes: form.notes.trim() || undefined,
      });
      toast({ title: "Payment request created", description: "Share the link with the yajamana." });
      setOpen(false);
      setForm({ customerName: "", customerPhone: "", customerEmail: "", amountInr: "", purpose: "", notes: "" });
      load();
    } catch (e: any) {
      toast({ title: "Failed to create request", description: e?.message, variant: "destructive" });
    } finally { setSubmitting(false); }
  }

  async function cancel(id: number) {
    if (!confirm("Cancel this payment request? The yajamana will no longer be able to pay it.")) return;
    try {
      await panditApi("PATCH", `/api/pandit/payment-requests/${id}`, { status: "cancelled" });
      toast({ title: "Request cancelled" });
      load();
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
  }

  async function markPaid(id: number) {
    const note = prompt("Add a short note (e.g. 'Cash received', 'UPI to 98xxx'):") || "";
    try {
      await panditApi("PATCH", `/api/pandit/payment-requests/${id}`, { status: "paid", manualPaidNote: note });
      toast({ title: "Marked as paid" });
      load();
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text).then(
      () => toast({ title: "Copied" }),
      () => toast({ title: "Copy failed", variant: "destructive" }),
    );
  }

  function whatsappShare(r: PaymentRequest) {
    const msg = [
      `Pranam ${r.customerName} ji,`,
      ``,
      `Please complete the payment of ${inr(r.amountInr)} for: ${r.purpose}.`,
      r.rpShortUrl ? `\nSecure payment link: ${r.rpShortUrl}` : ``,
      `\n— Sent via Vedic Tatva`,
    ].filter(Boolean).join("\n");
    const phone = r.customerPhone.replace(/\D/g, "");
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener");
  }

  if (loading || !data) {
    return <Card><CardContent className="p-10 flex items-center justify-center text-sm text-[#5a4a3a]/70"><Loader2 className="h-4 w-4 animate-spin mr-2" />Loading payment requests…</CardContent></Card>;
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { l: "Pending", v: data.summary.pendingCount, i: Clock, color: "#B8860B" },
          { l: "Pending value", v: inr(data.summary.pendingValue), i: IndianRupee, color: "#B8860B" },
          { l: "Paid (lifetime)", v: data.summary.paidCount, i: Check, color: "#1f7a4d" },
          { l: "Paid value", v: inr(data.summary.paidValue), i: Wallet, color: "#1f7a4d" },
        ].map((k, i) => {
          const I = k.i;
          return (
            <Card key={i} data-testid={`pay-kpi-${i}`}>
              <CardContent className="p-3">
                <div className="flex items-center gap-2 text-[10px] text-[#5a4a3a]/65 uppercase tracking-wide font-bold">
                  <I className="h-3.5 w-3.5" style={{ color: k.color }} />{k.l}
                </div>
                <div className="text-xl font-bold text-[#4a1a22] mt-1 truncate">{k.v}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center gap-2 justify-between">
        <div className="flex flex-wrap gap-1">
          {(["all", "pending", "paid", "cancelled"] as const).map((s) => (
            <Button
              key={s}
              size="sm"
              variant={filter === s ? "default" : "outline"}
              onClick={() => setFilter(s)}
              data-testid={`filter-${s}`}
              className={filter === s ? "bg-[#6D2B35] hover:bg-[#6D2B35]" : ""}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </Button>
          ))}
        </div>
        <Button onClick={() => setOpen(true)} className="bg-[#6D2B35] hover:bg-[#6D2B35]" data-testid="btn-new-payment-request">
          <Plus className="h-4 w-4 mr-1.5" />New payment request
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          {filtered.length === 0 ? (
            <div className="p-10 text-center text-sm text-[#5a4a3a]/65">
              {filter === "all"
                ? "No payment requests yet. Click \"New payment request\" to bill a yajamana."
                : `No ${filter} requests.`}
            </div>
          ) : (
            <div className="divide-y divide-[#D4AF37]/15">
              {filtered.map((r) => (
                <div key={r.id} className="p-3 flex flex-col md:flex-row md:items-center gap-3" data-testid={`pay-row-${r.id}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-bold text-[#4a1a22]">{r.customerName}</div>
                      <Badge
                        variant="outline"
                        className={
                          r.status === "paid" ? "border-emerald-500/40 text-emerald-700 capitalize"
                          : r.status === "cancelled" ? "border-stone-400/50 text-stone-600 capitalize"
                          : r.status === "expired" ? "border-stone-400/50 text-stone-600 capitalize"
                          : "border-amber-500/40 text-amber-700 capitalize"
                        }
                      >{r.status}</Badge>
                    </div>
                    <div className="text-xs text-[#5a4a3a]/80 mt-0.5">{r.purpose}</div>
                    <div className="text-[11px] text-[#5a4a3a]/60 mt-0.5 font-mono">
                      {r.customerPhone}{r.customerEmail ? ` · ${r.customerEmail}` : ""}
                    </div>
                  </div>
                  <div className="text-right md:w-28 shrink-0">
                    <div className="font-mono font-bold text-[#4a1a22] text-lg">{inr(r.amountInr)}</div>
                    <div className="text-[10px] text-[#5a4a3a]/60">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex flex-wrap gap-1.5 shrink-0">
                    {r.rpShortUrl && r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => copy(r.rpShortUrl!)} data-testid={`btn-copy-${r.id}`}>
                          <Copy className="h-3 w-3 mr-1" />Copy link
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => whatsappShare(r)} data-testid={`btn-wa-${r.id}`}>
                          <MessageCircle className="h-3 w-3 mr-1" />WhatsApp
                        </Button>
                        <Button size="sm" variant="outline" asChild>
                          <a href={r.rpShortUrl} target="_blank" rel="noopener" data-testid={`btn-open-${r.id}`}>
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        </Button>
                      </>
                    )}
                    {r.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" onClick={() => markPaid(r.id)} data-testid={`btn-mark-paid-${r.id}`}>
                          <Check className="h-3 w-3 mr-1" />Mark paid
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => cancel(r.id)} data-testid={`btn-cancel-${r.id}`}>
                          <XCircle className="h-3 w-3" />
                        </Button>
                      </>
                    )}
                    {r.status === "paid" && r.manualPaidNote && (
                      <div className="text-[10px] text-[#5a4a3a]/60 italic max-w-[200px] truncate">{r.manualPaidNote}</div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[#4a1a22]">Request payment from yajamana</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="grid grid-cols-1 gap-2">
              <Input placeholder="Yajamana name" value={form.customerName} onChange={(e) => setForm({ ...form, customerName: e.target.value })} data-testid="input-pay-name" />
              <Input placeholder="Phone (10 digits)" value={form.customerPhone} onChange={(e) => setForm({ ...form, customerPhone: e.target.value })} data-testid="input-pay-phone" />
              <Input placeholder="Email (optional)" value={form.customerEmail} onChange={(e) => setForm({ ...form, customerEmail: e.target.value })} data-testid="input-pay-email" />
              <Input type="number" inputMode="numeric" placeholder="Amount in ₹" value={form.amountInr} onChange={(e) => setForm({ ...form, amountInr: e.target.value })} data-testid="input-pay-amount" />
              <Input placeholder="Purpose (e.g. Satyanarayan Katha dakshina)" value={form.purpose} onChange={(e) => setForm({ ...form, purpose: e.target.value })} data-testid="input-pay-purpose" />
              <Textarea rows={2} placeholder="Internal note (optional)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} data-testid="input-pay-notes" />
            </div>
            <p className="text-[11px] text-[#5a4a3a]/60">
              A secure Razorpay payment link will be generated. The yajamana can pay via UPI, card, or netbanking. Funds are credited to your linked Vedic Tatva ledger after platform commission.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>Cancel</Button>
            <Button onClick={submit} disabled={submitting} className="bg-[#6D2B35] hover:bg-[#6D2B35]" data-testid="btn-submit-payment-request">
              {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
              Create request
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
