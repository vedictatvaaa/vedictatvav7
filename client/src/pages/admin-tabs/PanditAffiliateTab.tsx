import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { createFetcher } from "@/pages/admin-shared";
import { Loader2, Truck, Package, Share2, Store, BadgeCheck, ShieldAlert, Banknote, CheckCircle2 } from "lucide-react";

type ReferralRow = {
  id: number; panditId: number; panditName?: string; kind: string;
  refEmail?: string | null; grossAmount: number; commissionAmount: number;
  commissionPct: number; status: string; createdAt: string;
  payoutId?: number | null;
};
type CardOrderRow = {
  id: number; panditId: number; panditName?: string; cardType: string;
  quantity: number; totalAmount: number; status: string;
  paymentStatus?: string;
  shippingName: string; shippingCity: string; shippingState: string;
  shippingPincode: string; shippingPhone: string;
  trackingNumber?: string | null; trackingUrl?: string | null;
  shiprocketOrderId?: string | null; shiprocketShipmentId?: string | null;
  shiprocketError?: string | null;
  createdAt: string;
};
type StorefrontRow = {
  panditId: number; name: string; slug: string; tier: string; city?: string | null;
  productCommissionPct: number; isPublished: boolean; productCount: number;
  viewCount: number; totalCommission: number; referralCount: number;
  cardIssued?: boolean; membershipNo?: string | null;
};
type PayoutRow = {
  id: number; panditId: number; panditName?: string; amountInr: number;
  paidAt: string; method: string; reference?: string | null;
  notes?: string | null; referralIds: number[];
  reversedAt?: string | null; reverseReason?: string | null;
};

const inr = (n: number) => `₹${(n || 0).toLocaleString("en-IN")}`;

const STATUS_VARIANT: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  confirmed: "bg-amber-100 text-amber-800 hover:bg-amber-100",
  approved: "bg-sky-100 text-sky-800 hover:bg-sky-100",
  paid: "bg-emerald-100 text-emerald-800 hover:bg-emerald-100",
  rejected: "bg-stone-200 text-stone-700 hover:bg-stone-200",
  reversed: "bg-stone-200 text-stone-700 hover:bg-stone-200",
};

export default function PanditAffiliateTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = useMemo(() => createFetcher(adminToken), [adminToken]);

  const referrals = useQuery<{ items: ReferralRow[] }>({
    queryKey: ["/api/admin/referrals"],
    queryFn: () => fetcher("/api/admin/referrals") as Promise<{ items: ReferralRow[] }>,
  });
  const orders = useQuery<{ items: CardOrderRow[] }>({
    queryKey: ["/api/admin/card-orders"],
    queryFn: () => fetcher("/api/admin/card-orders") as Promise<{ items: CardOrderRow[] }>,
  });
  const storefronts = useQuery<{ items: StorefrontRow[] }>({
    queryKey: ["/api/admin/storefronts"],
    queryFn: () => fetcher("/api/admin/storefronts") as Promise<{ items: StorefrontRow[] }>,
  });
  const payouts = useQuery<{ items: PayoutRow[] }>({
    queryKey: ["/api/admin/payouts"],
    queryFn: () => fetcher("/api/admin/payouts") as Promise<{ items: PayoutRow[] }>,
  });

  // ---- Selection (referrals tab) ----
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const toggleOne = (id: number) =>
    setSelected((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });

  const items: ReferralRow[] = referrals.data?.items || [];
  // Selectable for any bulk action: anything not already terminal.
  const actionable = items.filter((r) => r.status !== "paid" && r.status !== "rejected" && r.status !== "reversed");
  // Server only pays out APPROVED referrals (state machine: pending -> approved -> paid).
  const settleable = items.filter((r) => r.status === "approved");
  const selectedRows = items.filter((r) => selected.has(r.id));
  const selectedActionable = selectedRows.filter((r) => r.status === "pending" || r.status === "confirmed" || r.status === "approved");
  const selectedSettleable = selectedRows.filter((r) => r.status === "approved");
  const selectedTotal = selectedSettleable.reduce((s, r) => s + (r.commissionAmount || 0), 0);
  const selectedPandits = Array.from(new Set(selectedSettleable.map((r) => r.panditId)));

  const summary = useMemo(() => ({
    total: items.reduce((s, r) => s + (r.commissionAmount || 0), 0),
    pending: items.filter((r) => r.status === "pending" || r.status === "confirmed").reduce((s, r) => s + (r.commissionAmount || 0), 0),
    approved: items.filter((r) => r.status === "approved").reduce((s, r) => s + (r.commissionAmount || 0), 0),
    paid: items.filter((r) => r.status === "paid").reduce((s, r) => s + (r.commissionAmount || 0), 0),
    count: items.length,
  }), [items]);

  // ---- Mutations ----
  const headers = { "x-admin-token": adminToken || "" };
  const refreshReferrals = () => {
    queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
    queryClient.invalidateQueries({ queryKey: ["/api/admin/storefronts"] });
  };

  const bulkUpdate = useMutation({
    mutationFn: (vars: { ids: number[]; status: "approved" | "rejected" | "pending" | "reversed"; notes?: string }) =>
      apiRequest("POST", "/api/admin/referrals/bulk", vars, headers),
    onSuccess: (_d, v) => { refreshReferrals(); setSelected(new Set()); toast({ title: `Updated ${v.ids.length} referral${v.ids.length === 1 ? "" : "s"}` }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateOne = useMutation({
    mutationFn: (vars: { id: number; status: string }) => apiRequest("PATCH", `/api/admin/referrals/${vars.id}`, { status: vars.status }, headers),
    onSuccess: () => { refreshReferrals(); toast({ title: "Updated" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  // ---- Reject dialog (captures optional reason) ----
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectNote, setRejectNote] = useState("");

  // ---- Payout dialog ----
  const [payoutOpen, setPayoutOpen] = useState(false);
  type PayoutForm = { method: "upi" | "bank" | "cash" | "other"; reference: string; notes: string };
  const [payoutForm, setPayoutForm] = useState<PayoutForm>({ method: "upi", reference: "", notes: "" });

  const recordPayout = useMutation({
    mutationFn: (vars: { panditId: number; referralIds: number[]; body: PayoutForm }) =>
      apiRequest("POST", "/api/admin/payouts", { panditId: vars.panditId, referralIds: vars.referralIds, ...vars.body }, headers),
    onSuccess: () => {
      refreshReferrals(); setPayoutOpen(false); setSelected(new Set());
      setPayoutForm({ method: "upi", reference: "", notes: "" });
      toast({ title: "Payout recorded" });
    },
    onError: (e: Error) => toast({ title: "Payout failed", description: e.message, variant: "destructive" }),
  });

  // ---- Reverse payout dialog (Task #70) ----
  const [reverseTarget, setReverseTarget] = useState<PayoutRow | null>(null);
  const [reverseReason, setReverseReason] = useState("");
  const reversePayout = useMutation({
    mutationFn: (vars: { id: number; reason: string }) =>
      apiRequest("POST", `/api/admin/payouts/${vars.id}/reverse`, { reason: vars.reason || null }, headers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/referrals"] });
      setReverseTarget(null); setReverseReason("");
      toast({ title: "Payout reversed", description: "Referrals returned to approved queue and pandit notified by email." });
    },
    onError: (e: Error) => toast({ title: "Reverse failed", description: e.message, variant: "destructive" }),
  });

  const openPayout = () => {
    if (selectedSettleable.length === 0) { toast({ title: "Select at least one settleable referral" }); return; }
    if (selectedPandits.length !== 1) { toast({ title: "Pick one pandit at a time", description: "A payout settles commissions for a single pandit." }); return; }
    setPayoutOpen(true);
  };

  // ---- Card-order ship dialog (existing) ----
  type ShipForm = { status: string; trackingNumber: string; trackingUrl: string };
  const [shipOpen, setShipOpen] = useState<CardOrderRow | null>(null);
  const [shipForm, setShipForm] = useState<ShipForm>({ status: "shipped", trackingNumber: "", trackingUrl: "" });
  const updateOrder = useMutation({
    mutationFn: (vars: { id: number; body: ShipForm }) => apiRequest("PATCH", `/api/admin/card-orders/${vars.id}`, vars.body, headers),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/card-orders"] }); setShipOpen(null); toast({ title: "Order updated" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const pushShiprocket = useMutation({
    mutationFn: (id: number) => apiRequest("POST", `/api/admin/card-orders/${id}/shiprocket`, {}, headers),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/card-orders"] }); toast({ title: "Pushed to Shiprocket" }); },
    onError: (e: Error) => toast({ title: "Shiprocket push failed", description: e.message, variant: "destructive" }),
  });

  const issueCard = useMutation({
    mutationFn: (vars: { panditId: number; issued: boolean }) =>
      apiRequest("POST", `/api/admin/pandits/${vars.panditId}/issue-card`, { issued: vars.issued }, { "x-admin-token": adminToken || "" }),
    onSuccess: (_d, v) => { queryClient.invalidateQueries({ queryKey: ["/api/admin/storefronts"] }); toast({ title: v.issued ? "Card issued" : "Card revoked" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const updateStorefront = useMutation({
    mutationFn: (vars: { panditId: number; body: { productCommissionPct?: number; isPublished?: boolean } }) =>
      apiRequest("PATCH", `/api/admin/storefronts/${vars.panditId}`, vars.body, headers),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/storefronts"] }); toast({ title: "Saved" }); },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const payoutPanditName = selectedPandits.length === 1
    ? (selectedSettleable[0]?.panditName || `#${selectedPandits[0]}`)
    : "";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Share2 className="w-5 h-5 text-[#6D2B35]" />
        <h2 className="text-xl font-bold text-[#4a1a22]">Pandit Affiliate Program</h2>
      </div>

      <Tabs defaultValue="referrals">
        <TabsList>
          <TabsTrigger value="referrals" data-testid="tab-referrals">Referrals & Commissions</TabsTrigger>
          <TabsTrigger value="payouts" data-testid="tab-payouts">Payout history</TabsTrigger>
          <TabsTrigger value="storefronts" data-testid="tab-storefronts">Storefronts</TabsTrigger>
          <TabsTrigger value="cards" data-testid="tab-cards">Card Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="storefronts" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Store className="w-4 h-4 text-[#6D2B35]" />
                <div className="text-sm font-semibold text-[#4a1a22]">Top storefronts (by commission earned)</div>
              </div>
              {storefronts.isLoading ? (
                <div className="text-sm text-stone-500"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading…</div>
              ) : (storefronts.data?.items || []).length === 0 ? (
                <div className="text-sm text-stone-500">No pandits yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-stone-500"><th className="py-2">Pandit</th><th>Membership</th><th>Tier</th><th>Published</th><th>Card</th><th>Curated</th><th>Views</th><th>Commission</th><th>Override %</th></tr></thead>
                    <tbody>
                      {(storefronts.data?.items || []).map((s) => (
                        <tr key={s.panditId} className="border-t" data-testid={`row-storefront-${s.panditId}`}>
                          <td className="py-2"><a href={`/p/${s.slug}`} target="_blank" rel="noopener noreferrer" className="font-medium text-[#6D2B35] underline">{s.name}</a><div className="text-xs text-stone-500">{s.city || "—"}</div></td>
                          <td className="text-xs font-mono text-stone-700">{s.membershipNo || `VT-PND-${String(s.panditId).padStart(5, "0")}`}</td>
                          <td><Badge variant="outline" className="capitalize">{s.tier || "free"}</Badge></td>
                          <td><Switch checked={s.isPublished} onCheckedChange={(v) => updateStorefront.mutate({ panditId: s.panditId, body: { isPublished: v } })} data-testid={`switch-published-${s.panditId}`} /></td>
                          <td>
                            <div className="flex items-center gap-2">
                              {s.cardIssued ? (
                                <Badge className="bg-emerald-100 text-emerald-800 border border-emerald-200 gap-1"><BadgeCheck className="w-3 h-3" />Issued</Badge>
                              ) : (
                                <Badge className="bg-amber-100 text-amber-800 border border-amber-200 gap-1"><ShieldAlert className="w-3 h-3" />Pending</Badge>
                              )}
                              <Button size="sm" variant="outline" disabled={issueCard.isPending} onClick={() => issueCard.mutate({ panditId: s.panditId, issued: !s.cardIssued })} data-testid={`btn-issue-card-${s.panditId}`}>{s.cardIssued ? "Revoke" : "Issue"}</Button>
                            </div>
                          </td>
                          <td>{s.productCount}</td>
                          <td>{s.viewCount}</td>
                          <td className="font-semibold">{inr(s.totalCommission)}</td>
                          <td>
                            <Input
                              type="number" min={0} max={50}
                              defaultValue={s.productCommissionPct}
                              className="w-20 h-8"
                              onBlur={(e) => {
                                const v = Number(e.currentTarget.value);
                                if (Number.isFinite(v) && v !== s.productCommissionPct) {
                                  updateStorefront.mutate({ panditId: s.panditId, body: { productCommissionPct: v } });
                                }
                              }}
                              data-testid={`input-commission-${s.panditId}`}
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="referrals" className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Total commission</div><div className="text-xl font-bold">{inr(summary.total)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Pending review</div><div className="text-xl font-bold text-amber-700">{inr(summary.pending)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Approved (ready)</div><div className="text-xl font-bold text-sky-700">{inr(summary.approved)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Paid out</div><div className="text-xl font-bold text-emerald-700">{inr(summary.paid)}</div></CardContent></Card>
            <Card><CardContent className="p-4"><div className="text-xs text-stone-500">Conversions</div><div className="text-xl font-bold">{summary.count}</div></CardContent></Card>
          </div>

          <Card>
            <CardContent className="p-5">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
                <div className="text-xs text-stone-500">
                  {selected.size > 0
                    ? <>Selected <span className="font-semibold text-[#4a1a22]">{selectedSettleable.length}</span> settleable · <span className="font-semibold text-[#4a1a22]">{inr(selectedTotal)}</span>{selectedPandits.length > 1 && <span className="text-amber-700"> · spans {selectedPandits.length} pandits</span>}</>
                    : <>Tick rows to bulk-approve or record a payout.</>}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button size="sm" variant="outline" disabled={selectedActionable.filter((r) => r.status !== "approved").length === 0 || bulkUpdate.isPending} onClick={() => bulkUpdate.mutate({ ids: selectedActionable.filter((r) => r.status !== "approved").map((r) => r.id), status: "approved" })} data-testid="btn-bulk-approve">
                    <CheckCircle2 className="w-3 h-3 mr-1" />Approve selected
                  </Button>
                  <Button size="sm" variant="outline" disabled={selectedActionable.length === 0 || bulkUpdate.isPending} onClick={() => { setRejectNote(""); setRejectOpen(true); }} data-testid="btn-bulk-reject">
                    Reject
                  </Button>
                  <Button size="sm" disabled={selectedSettleable.length === 0 || selectedPandits.length !== 1} onClick={openPayout} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-open-payout">
                    <Banknote className="w-3 h-3 mr-1" />Record payout
                  </Button>
                </div>
              </div>

              {referrals.isLoading ? (
                <div className="text-sm text-stone-500"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading…</div>
              ) : items.length === 0 ? (
                <div className="text-sm text-stone-500">No referrals yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-xs text-stone-500">
                        <th className="py-2 w-8">
                          <Checkbox
                            checked={actionable.length > 0 && actionable.every((r) => selected.has(r.id))}
                            onCheckedChange={(v) => {
                              if (v) setSelected(new Set(actionable.map((r) => r.id)));
                              else setSelected(new Set());
                            }}
                            data-testid="checkbox-select-all"
                          />
                        </th>
                        <th>Date</th><th>Pandit</th><th>Kind</th><th>Email</th><th>Gross</th><th>Commission</th><th>Status</th><th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((r) => {
                        const locked = r.status === "paid" || r.status === "rejected" || r.status === "reversed";
                        return (
                          <tr key={r.id} className="border-t" data-testid={`row-referral-${r.id}`}>
                            <td className="py-2"><Checkbox checked={selected.has(r.id)} disabled={locked} onCheckedChange={() => toggleOne(r.id)} data-testid={`checkbox-referral-${r.id}`} /></td>
                            <td className="py-2 text-xs">{new Date(r.createdAt).toLocaleDateString("en-IN")}</td>
                            <td>{r.panditName || `#${r.panditId}`}</td>
                            <td className="capitalize">{r.kind}</td>
                            <td className="text-xs">{r.refEmail || "—"}</td>
                            <td>{inr(r.grossAmount)}</td>
                            <td className="font-semibold">{inr(r.commissionAmount)} <span className="text-xs text-stone-400">({r.commissionPct}%)</span></td>
                            <td><Badge className={`capitalize ${STATUS_VARIANT[r.status] || ""}`}>{r.status}</Badge></td>
                            <td>
                              {r.status === "pending" || r.status === "confirmed" ? (
                                <Button size="sm" variant="outline" onClick={() => updateOne.mutate({ id: r.id, status: "approved" })} disabled={updateOne.isPending} data-testid={`btn-approve-${r.id}`}>Approve</Button>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payouts" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h3 className="font-bold text-[#4a1a22] mb-3">Recorded payouts</h3>
              {payouts.isLoading ? (
                <div className="text-sm text-stone-500"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading…</div>
              ) : (payouts.data?.items || []).length === 0 ? (
                <div className="text-sm text-stone-500">No payouts recorded yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-stone-500"><th className="py-2">Date</th><th>Pandit</th><th>Amount</th><th>Method</th><th>Reference</th><th>Settles</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {(payouts.data?.items || []).map((p) => (
                        <tr key={p.id} className="border-t align-top" data-testid={`row-payout-${p.id}`}>
                          <td className="py-2 text-xs">{new Date(p.paidAt).toLocaleDateString("en-IN")}</td>
                          <td>{p.panditName || `#${p.panditId}`}</td>
                          <td className={`font-semibold ${p.reversedAt ? "line-through text-stone-400" : ""}`}>{inr(p.amountInr)}</td>
                          <td className="capitalize">{p.method}</td>
                          <td className="text-xs">{p.reference || "—"}</td>
                          <td className="text-xs text-stone-500">{(p.referralIds || []).length} referral{(p.referralIds || []).length === 1 ? "" : "s"}</td>
                          <td>
                            {p.reversedAt ? (
                              <Badge className={`capitalize ${STATUS_VARIANT.reversed}`} data-testid={`badge-payout-reversed-${p.id}`}>Reversed</Badge>
                            ) : (
                              <Badge className={`capitalize ${STATUS_VARIANT.paid}`}>Paid</Badge>
                            )}
                            {p.reverseReason && <div className="text-xs text-stone-500 mt-1 max-w-[200px] truncate" title={p.reverseReason}>{p.reverseReason}</div>}
                            {p.notes && !p.reversedAt && <div className="text-xs text-stone-500 mt-1 max-w-[200px] truncate" title={p.notes}>{p.notes}</div>}
                          </td>
                          <td>
                            {!p.reversedAt && (
                              <Button size="sm" variant="outline" onClick={() => { setReverseTarget(p); setReverseReason(""); }} data-testid={`btn-reverse-payout-${p.id}`}>Reverse</Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="cards" className="space-y-4">
          <Card>
            <CardContent className="p-5">
              {orders.isLoading ? (
                <div className="text-sm text-stone-500"><Loader2 className="w-4 h-4 inline animate-spin" /> Loading…</div>
              ) : (orders.data?.items || []).length === 0 ? (
                <div className="text-sm text-stone-500">No card orders yet.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead><tr className="text-left text-xs text-stone-500"><th className="py-2">Date</th><th>Pandit</th><th>Type</th><th>Qty</th><th>Amount</th><th>Ship to</th><th>Status</th><th></th></tr></thead>
                    <tbody>
                      {(orders.data?.items || []).map((o) => {
                        const paid = (o.paymentStatus === "paid") || ["paid", "printing", "shipped", "delivered"].includes(o.status);
                        const dispatched = !!o.shiprocketOrderId;
                        return (
                        <tr key={o.id} className="border-t align-top" data-testid={`row-card-order-${o.id}`}>
                          <td className="py-2 text-xs">{new Date(o.createdAt).toLocaleDateString("en-IN")}</td>
                          <td>{o.panditName || `#${o.panditId}`}</td>
                          <td className="capitalize">{o.cardType}</td>
                          <td>{o.quantity}</td>
                          <td>{inr(o.totalAmount)}</td>
                          <td className="text-xs">{o.shippingName}<br/>{o.shippingCity}, {o.shippingState} — {o.shippingPincode}<br/>{o.shippingPhone}</td>
                          <td>
                            <Badge className="capitalize">{o.status}</Badge>
                            {o.trackingUrl && (
                              <a href={o.trackingUrl} target="_blank" rel="noopener noreferrer" className="block text-xs text-[#6D2B35] underline mt-1 inline-flex items-center gap-1" data-testid={`link-tracking-${o.id}`}><Truck className="w-3 h-3" />{o.trackingNumber || "Track"}</a>
                            )}
                            {dispatched && !o.trackingUrl && (
                              <div className="text-xs text-stone-500 mt-1" data-testid={`text-shiprocket-id-${o.id}`}>SR #{o.shiprocketOrderId}{o.trackingNumber ? ` · AWB ${o.trackingNumber}` : ""}</div>
                            )}
                            {o.shiprocketError && (
                              <div className="text-xs text-red-600 mt-1 max-w-[200px] truncate" title={o.shiprocketError} data-testid={`text-shiprocket-error-${o.id}`}>SR error: {o.shiprocketError}</div>
                            )}
                          </td>
                          <td>
                            <div className="flex flex-col gap-1">
                              {paid && !dispatched && (
                                <Button size="sm" variant="outline" disabled={pushShiprocket.isPending} onClick={() => pushShiprocket.mutate(o.id)} data-testid={`btn-push-shiprocket-${o.id}`}>
                                  <Truck className="w-3 h-3 mr-1" />Push to Shiprocket
                                </Button>
                              )}
                              <Button size="sm" variant="outline" onClick={() => { setShipForm({ status: o.status === "paid" ? "shipped" : o.status, trackingNumber: o.trackingNumber || "", trackingUrl: o.trackingUrl || "" }); setShipOpen(o); }} data-testid={`btn-ship-${o.id}`}><Package className="w-3 h-3 mr-1" />Update</Button>
                            </div>
                          </td>
                        </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={!!shipOpen} onOpenChange={(o) => !o && setShipOpen(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Update card order #{shipOpen?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <div className="text-xs text-stone-500 mb-1">Status</div>
              <Select value={shipForm.status} onValueChange={(v) => setShipForm({ ...shipForm, status: v })}>
                <SelectTrigger data-testid="select-ship-status"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="shipped">Shipped</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Input placeholder="Tracking number" value={shipForm.trackingNumber} onChange={(e) => setShipForm({ ...shipForm, trackingNumber: e.target.value })} />
            <Input placeholder="Tracking URL" value={shipForm.trackingUrl} onChange={(e) => setShipForm({ ...shipForm, trackingUrl: e.target.value })} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShipOpen(null)}>Cancel</Button>
            <Button onClick={() => shipOpen && updateOrder.mutate({ id: shipOpen.id, body: shipForm })} disabled={updateOrder.isPending} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]">{updateOrder.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!reverseTarget} onOpenChange={(o) => !o && setReverseTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reverse payout #{reverseTarget?.id}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-[#FFFAEC] p-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Pandit</span><span className="font-semibold">{reverseTarget?.panditName || `#${reverseTarget?.panditId}`}</span></div>
              <div className="flex justify-between mt-1"><span className="text-stone-500">Amount</span><span className="font-bold text-[#4a1a22]">{inr(reverseTarget?.amountInr || 0)}</span></div>
              <div className="flex justify-between mt-1"><span className="text-stone-500">Restores</span><span>{(reverseTarget?.referralIds || []).length} referral{(reverseTarget?.referralIds || []).length === 1 ? "" : "s"}</span></div>
            </div>
            <div className="text-xs text-stone-600">The settled referrals will be moved back to the approved queue so you can re-pay them. The pandit will be notified by email.</div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea rows={3} value={reverseReason} onChange={(e) => setReverseReason(e.target.value)} maxLength={500} placeholder="e.g. UPI bounced — sent to wrong VPA" data-testid="input-reverse-reason" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReverseTarget(null)}>Cancel</Button>
            <Button
              onClick={() => reverseTarget && reversePayout.mutate({ id: reverseTarget.id, reason: reverseReason.trim() })}
              disabled={reversePayout.isPending}
              className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
              data-testid="btn-confirm-reverse"
            >
              {reversePayout.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reverse payout
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={rejectOpen} onOpenChange={(o) => !o && setRejectOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Reject {selectedActionable.length} referral{selectedActionable.length === 1 ? "" : "s"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="text-sm text-stone-600">Rejected commissions will not be paid out. Add an optional reason for the audit trail.</div>
            <div>
              <Label>Reason (optional)</Label>
              <Textarea rows={3} value={rejectNote} onChange={(e) => setRejectNote(e.target.value)} maxLength={500} placeholder="e.g. Order was refunded / fraudulent referral" data-testid="input-reject-note" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectOpen(false)}>Cancel</Button>
            <Button
              onClick={() => {
                bulkUpdate.mutate({ ids: selectedActionable.map((r) => r.id), status: "rejected", notes: rejectNote.trim() || undefined });
                setRejectOpen(false);
              }}
              disabled={bulkUpdate.isPending}
              className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
              data-testid="btn-confirm-reject"
            >
              {bulkUpdate.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={payoutOpen} onOpenChange={(o) => !o && setPayoutOpen(false)}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle>Record payout to {payoutPanditName}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="rounded-md border bg-[#FFFAEC] p-3 text-sm">
              <div className="flex justify-between"><span className="text-stone-500">Referrals settled</span><span className="font-semibold">{selectedSettleable.length}</span></div>
              <div className="flex justify-between mt-1"><span className="text-stone-500">Total amount</span><span className="font-bold text-[#4a1a22]">{inr(selectedTotal)}</span></div>
            </div>
            <div>
              <Label>Method</Label>
              <Select value={payoutForm.method} onValueChange={(v) => setPayoutForm({ ...payoutForm, method: v as PayoutForm["method"] })}>
                <SelectTrigger data-testid="select-payout-method"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="bank">Bank transfer</SelectItem>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Reference (UTR / UPI ref / cheque no.)</Label>
              <Input value={payoutForm.reference} onChange={(e) => setPayoutForm({ ...payoutForm, reference: e.target.value })} placeholder="e.g. 123456789012" data-testid="input-payout-reference" />
            </div>
            <div>
              <Label>Notes (optional)</Label>
              <Textarea rows={2} value={payoutForm.notes} onChange={(e) => setPayoutForm({ ...payoutForm, notes: e.target.value })} maxLength={500} data-testid="input-payout-notes" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayoutOpen(false)}>Cancel</Button>
            <Button
              onClick={() => recordPayout.mutate({ panditId: selectedPandits[0], referralIds: selectedSettleable.map((r) => r.id), body: payoutForm })}
              disabled={recordPayout.isPending || selectedPandits.length !== 1}
              className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]"
              data-testid="btn-confirm-payout"
            >
              {recordPayout.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Mark paid · {inr(selectedTotal)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
