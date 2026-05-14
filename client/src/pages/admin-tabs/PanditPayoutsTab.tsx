import { useEffect, useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { createFetcher } from "@/pages/admin-shared";
import { Wallet, Plus, Trash2, IndianRupee, Loader2 } from "lucide-react";

type Pandit = { id: number; name: string; city: string; commissionPct?: number | null };
type Payout = { id: number; panditId: number; amountInr: number; paidAt: string; method: string; reference: string | null; notes: string | null };
type Earnings = {
  commissionPct: number;
  summary: {
    grossBookings: number; commission: number; netBookings: number;
    tipsTotal: number; netEarned: number; paidOut: number; pending: number;
    referralPayable?: number; referralConfirmed?: number; referralPaid?: number;
    referralAccruing?: number; referralCount?: number;
  };
};

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

export default function PanditPayoutsTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = useMemo(() => createFetcher(adminToken), [adminToken]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [createOpen, setCreateOpen] = useState(false);

  const { data: panditsData } = useQuery<{ pandits?: Pandit[] } | Pandit[]>({
    queryKey: ["/api/pandits"],
  });
  const pandits: Pandit[] = useMemo(() => Array.isArray(panditsData) ? panditsData : (panditsData?.pandits || []), [panditsData]);

  useEffect(() => { if (!selectedId && pandits.length) setSelectedId(pandits[0].id); }, [pandits, selectedId]);

  const { data: earnings, isLoading: loadingEarnings } = useQuery<Earnings>({
    queryKey: ["/api/admin/pandits", selectedId, "earnings"],
    queryFn: () => fetcher(`/api/admin/pandits/${selectedId}/earnings`),
    enabled: !!selectedId,
  });

  const { data: payoutsResp, isLoading: loadingPayouts } = useQuery<{ payouts: Payout[] }>({
    queryKey: ["/api/admin/pandits", selectedId, "payouts"],
    queryFn: () => fetcher(`/api/admin/pandits/${selectedId}/payouts`),
    enabled: !!selectedId,
  });
  const payouts = payoutsResp?.payouts || [];

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => apiRequest("DELETE", `/api/admin/pandit-payouts/${id}`, undefined, { "x-admin-token": adminToken || "" }),
    onSuccess: () => {
      toast({ title: "Payout removed" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandits", selectedId, "payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandits", selectedId, "earnings"] });
    },
    onError: (e: any) => toast({ title: "Could not remove payout", description: e?.message, variant: "destructive" }),
  });

  const selected = pandits.find((p) => p.id === selectedId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-serif font-bold text-[#4a1a22] flex items-center gap-2"><Wallet className="h-5 w-5" />Pandit Payouts</h2>
          <p className="text-xs text-[#5a4a3a]/70 mt-0.5">Record payments made to pandits and view their pending balance.</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedId ? String(selectedId) : ""} onValueChange={(v) => setSelectedId(Number(v))}>
            <SelectTrigger className="w-64" data-testid="select-pandit"><SelectValue placeholder="Select pandit" /></SelectTrigger>
            <SelectContent>
              {pandits.map((p) => <SelectItem key={p.id} value={String(p.id)} data-testid={`opt-pandit-${p.id}`}>{p.name} — {p.city}</SelectItem>)}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)} disabled={!selectedId} data-testid="btn-record-payout"><Plus className="h-4 w-4 mr-1" />Record payout</Button>
        </div>
      </div>

      {selected && (
        loadingEarnings || !earnings ? (
          <Card><CardContent className="p-8 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></CardContent></Card>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
            {[
              { l: "Pending payout", v: inr(earnings.summary.pending), emph: true, sub: "Total owed" },
              { l: "Net earned", v: inr(earnings.summary.netEarned), sub: "All-time" },
              { l: "Already paid out", v: inr(earnings.summary.paidOut), sub: `${earnings.commissionPct}% puja fee` },
              { l: "Referrals payable", v: inr(earnings.summary.referralConfirmed || 0), sub: "Confirmed, unsettled" },
              { l: "Referrals accruing", v: inr(earnings.summary.referralAccruing || 0), sub: "Awaiting confirm" },
              { l: "Referrals settled", v: inr(earnings.summary.referralPaid || 0), sub: `${earnings.summary.referralCount || 0} total rows` },
            ].map((k, i) => (
              <Card key={i} className={k.emph ? "border-[#D4AF37]/40 bg-[#FFFAEC]" : ""}>
                <CardContent className="p-3">
                  <div className="text-[10px] text-[#5a4a3a]/65 uppercase tracking-wide font-bold">{k.l}</div>
                  <div className="text-xl font-bold text-[#4a1a22] mt-1">{k.v}</div>
                  <div className="text-[10px] text-[#5a4a3a]/60 mt-0.5">{k.sub}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        )
      )}

      <Card>
        <CardContent className="p-0">
          {loadingPayouts ? (
            <div className="p-8 flex items-center justify-center"><Loader2 className="h-4 w-4 animate-spin" /></div>
          ) : payouts.length === 0 ? (
            <div className="p-10 text-center text-sm text-muted-foreground">No payouts recorded for this pandit yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted/30 text-muted-foreground uppercase tracking-wide">
                  <tr>
                    <th className="text-left p-2.5">Date</th>
                    <th className="text-left p-2.5">Method</th>
                    <th className="text-left p-2.5">Reference</th>
                    <th className="text-left p-2.5">Notes</th>
                    <th className="text-right p-2.5">Amount</th>
                    <th className="p-2.5"></th>
                  </tr>
                </thead>
                <tbody>
                  {payouts.map((p) => (
                    <tr key={p.id} className="border-t" data-testid={`row-payout-${p.id}`}>
                      <td className="p-2.5 font-mono">{new Date(p.paidAt).toLocaleDateString()}</td>
                      <td className="p-2.5"><Badge variant="outline" className="capitalize">{p.method}</Badge></td>
                      <td className="p-2.5 font-mono">{p.reference || "—"}</td>
                      <td className="p-2.5 text-muted-foreground">{p.notes || "—"}</td>
                      <td className="p-2.5 text-right font-mono font-bold">{inr(p.amountInr)}</td>
                      <td className="p-2.5 text-right">
                        <Button size="icon" variant="ghost" onClick={() => { if (confirm("Delete this payout? The cash amount will reopen as pending balance, but any referral commissions auto-settled by this payout will remain marked 'paid' — adjust those manually from Pandit Storefront if needed.")) deleteMutation.mutate(p.id); }} data-testid={`btn-del-payout-${p.id}`}>
                          <Trash2 className="h-3.5 w-3.5 text-red-700" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <CreatePayoutDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        panditId={selectedId}
        adminToken={adminToken}
        suggested={earnings?.summary.pending || 0}
      />
    </div>
  );
}

function CreatePayoutDialog({
  open, onOpenChange, panditId, adminToken, suggested,
}: { open: boolean; onOpenChange: (v: boolean) => void; panditId: number | null; adminToken?: string; suggested: number }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<string>("");
  const [method, setMethod] = useState("upi");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => { if (open) { setAmount(suggested > 0 ? String(suggested) : ""); setReference(""); setNotes(""); setMethod("upi"); setPaidAt(new Date().toISOString().slice(0, 10)); } }, [open, suggested]);

  const m = useMutation({
    mutationFn: async () => apiRequest("POST", `/api/admin/pandits/${panditId}/payouts`, {
      amountInr: Number(amount), method, reference: reference || null, notes: notes || null, paidAt: new Date(paidAt).toISOString(),
    }, { "x-admin-token": adminToken || "" }),
    onSuccess: () => {
      toast({ title: "Payout recorded" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandits", panditId, "payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandits", panditId, "earnings"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast({ title: "Could not record payout", description: e?.message, variant: "destructive" }),
  });

  const valid = panditId && Number(amount) > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Record a payout</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">Amount (INR)</span>
            <div className="relative">
              <IndianRupee className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input className="pl-7" type="number" min={1} value={amount} onChange={(e) => setAmount(e.target.value)} data-testid="input-payout-amount" />
            </div>
            {suggested > 0 && <span className="text-[10px] text-muted-foreground">Pending balance: {inr(suggested)}</span>}
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">Method</span>
              <Select value={method} onValueChange={setMethod}>
                <SelectTrigger data-testid="select-payout-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="block">
              <span className="text-xs font-bold text-muted-foreground">Paid on</span>
              <Input type="date" value={paidAt} onChange={(e) => setPaidAt(e.target.value)} data-testid="input-payout-date" />
            </label>
          </div>
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">Reference (UTR / UPI ref / cheque no.)</span>
            <Input value={reference} onChange={(e) => setReference(e.target.value)} data-testid="input-payout-ref" />
          </label>
          <label className="block">
            <span className="text-xs font-bold text-muted-foreground">Notes</span>
            <Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} data-testid="input-payout-notes" />
          </label>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!valid || m.isPending} onClick={() => m.mutate()} data-testid="btn-save-payout">
            {m.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin mr-1" />}Record payout
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
