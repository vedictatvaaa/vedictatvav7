import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Link } from "wouter";
import { Search, CalendarClock, Package, RefreshCw, Pause, Play, X, ArrowLeft, Truck, Leaf, Sparkles, SkipForward, Settings2, BadgeCheck } from "lucide-react";
import PageAPlusContent from "@/components/PageAPlusContent";
import { useAuth } from "@/lib/auth";
import type { Subscription } from "@shared/schema";

const STATUS_TOKENS: Record<string, string> = {
  active: "bg-emerald-50 text-emerald-800 border-emerald-200",
  paused: "bg-amber-50 text-amber-800 border-amber-200",
  cancelled: "bg-rose-50 text-rose-800 border-rose-200",
};

const FREQ_LABELS: Record<string, string> = {
  weekly: "Every Week",
  biweekly: "Every 2 Weeks",
  monthly: "Every Month",
  quarterly: "Every 3 Months",
};

export default function SubscriptionsPage() {
  const { user } = useAuth();
  const [emailInput, setEmailInput] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searched, setSearched] = useState(false);
  const [editingSub, setEditingSub] = useState<Subscription | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Auto-load logged-in user's subscriptions (no email entry needed)
  useEffect(() => {
    if (user?.email) {
      setSearchEmail(user.email);
      setSearched(true);
    }
  }, [user?.email]);

  // For logged-in users, use the auth-verified by-user endpoint;
  // for anonymous lookup keep the email-based fallback.
  const queryKey = user?.id
    ? ["/api/subscriptions/by-user", user.id]
    : ["/api/subscriptions/by-email", searchEmail];
  const { data: subscriptions, isLoading, refetch } = useQuery<Subscription[]>({
    queryKey,
    queryFn: () => {
      if (user?.id && user?.email) {
        return fetch(`/api/subscriptions/by-user/${user.id}?email=${encodeURIComponent(user.email)}`).then(r => r.json());
      }
      return fetch(`/api/subscriptions/by-email?email=${encodeURIComponent(searchEmail)}`).then(r => r.json());
    },
    enabled: searched && (!!user?.email || !!searchEmail),
  });

  const verifyEmail = user?.email || searchEmail;

  const statusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await fetch(`/api/subscriptions/${id}/customer-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, status }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      toast({ title: "Subscription updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });

  const skipMutation = useMutation({
    mutationFn: async ({ id }: { id: number; nextDelivery?: string | null }) => {
      const res = await fetch(`/api/subscriptions/${id}/skip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to skip");
      return res.json();
    },
    onSuccess: (_, { nextDelivery }) => {
      queryClient.invalidateQueries({ queryKey });
      let description: string | undefined;
      if (nextDelivery) {
        const skippedDate = new Date(nextDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
        description = `The ${skippedDate} shipment has been skipped — your next delivery will follow the one after.`;
      }
      toast({ title: "Next delivery skipped", description });
    },
    onError: (e: any) => toast({ title: "Could not skip", description: e?.message, variant: "destructive" }),
  });

  const editMutation = useMutation({
    mutationFn: async (payload: { id: number; quantity?: number; frequency?: string; address?: string; city?: string; state?: string; pincode?: string }) => {
      const { id, ...rest } = payload;
      const res = await fetch(`/api/subscriptions/${id}/customer-update`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: verifyEmail, ...rest }),
      });
      if (!res.ok) throw new Error((await res.json()).message || "Failed to update");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey });
      setEditingSub(null);
      toast({ title: "Subscription updated" });
    },
    onError: (e: any) => toast({ title: "Update failed", description: e?.message, variant: "destructive" }),
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!emailInput.trim()) return;
    setSearchEmail(emailInput.trim().toLowerCase());
    setSearched(true);
    setTimeout(() => refetch(), 0);
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Slim hero */}
      <div className="bg-[#6D2B35] border-b border-[#D4AF37]/30 text-white">
        <div className="container mx-auto px-4 py-9 sm:py-11">
          <Link href="/">
            <Button variant="ghost" className="text-[#D4AF37] hover:text-white hover:bg-white/5 mb-3 -ml-2 rounded-md h-9 text-[12px] uppercase tracking-[0.25em] font-semibold" data-testid="btn-back-home">
              <ArrowLeft className="h-3.5 w-3.5 mr-1.5" />
              Back
            </Button>
          </Link>
          <div className="flex items-center gap-2.5 mb-2">
            <span className="h-px w-6 bg-[#D4AF37]/60" />
            <span className="inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
              <Sparkles className="w-3 h-3" /> Auto-Delivery Manager
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-serif font-semibold tracking-tight" data-testid="text-subscriptions-title">My Subscriptions</h1>
          <p className="text-white/70 mt-1 text-sm sm:text-[15px]">
            {user?.email
              ? `Loaded for ${user.email} — pause, skip, or modify any time`
              : "Manage your recurring orders and delivery schedule"}
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {!user && (
          <div className="bg-white border border-[#D4AF37]/25 rounded-md p-4 md:p-5 mb-8">
            <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-[#6D2B35] mb-3 flex items-center gap-2">
              <Search className="h-3 w-3 text-[#D4AF37]" /> Find Your Subscriptions
            </p>
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2.5">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5a4a3a]/45" aria-hidden="true" />
                <Input
                  placeholder="Enter your email to view subscriptions"
                  value={emailInput}
                  onChange={(e) => { setEmailInput(e.target.value); setSearched(false); }}
                  className="pl-9 h-10 rounded-md border-[#D4AF37]/30 text-sm"
                  type="email"
                  data-testid="input-subscription-email"
                  aria-label="Email address for subscription lookup"
                />
              </div>
              <Button type="submit" className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md h-10 px-5 text-[13px] font-semibold" data-testid="btn-search-subscriptions">
                Search
              </Button>
            </form>
            <p className="text-[11px] text-[#5a4a3a]/65 mt-2.5">
              Tip: <Link href="/login"><span className="text-[#6D2B35] font-semibold underline">Sign in</span></Link> to load your subscriptions automatically.
            </p>
          </div>
        )}

        {isLoading && (
          <div className="text-center py-12 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md">
            <RefreshCw className="h-6 w-6 animate-spin mx-auto text-[#6D2B35]" aria-hidden="true" />
            <p className="mt-3 text-sm text-[#5a4a3a]/65">Loading subscriptions...</p>
          </div>
        )}

        {searched && !isLoading && subscriptions && subscriptions.length === 0 && (
          <div className="text-center py-14 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md">
            <div className="w-14 h-14 rounded-md bg-white border border-[#D4AF37]/30 flex items-center justify-center mx-auto mb-4">
              <CalendarClock className="h-6 w-6 text-[#6D2B35]/50" strokeWidth={1.6} aria-hidden="true" />
            </div>
            <h2 className="text-xl font-serif text-[#6D2B35] mb-2 font-semibold tracking-tight" data-testid="text-no-subscriptions">No Subscriptions Found</h2>
            <p className="text-sm text-[#5a4a3a]/65 mb-5">
              {user
                ? "You haven't started a subscription yet. Browse our spiritual essentials to set up auto-delivery."
                : "No subscriptions found for this email address."}
            </p>
            <Link href="/spiritual-essentials">
              <Button className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] rounded-md h-10 px-5 text-[13px] font-semibold">Browse Products</Button>
            </Link>
          </div>
        )}

        {subscriptions && subscriptions.length > 0 && (
          <div className="space-y-3">
            {subscriptions.map((sub) => (
              <div key={sub.id} className="bg-white border border-[#D4AF37]/25 rounded-md p-5 hover:border-[#D4AF37]/45 transition-colors" data-testid={`subscription-card-${sub.id}`}>
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex items-start gap-4 min-w-0 flex-1">
                    <div className="w-11 h-11 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/30 flex items-center justify-center flex-shrink-0">
                      <Package className="h-5 w-5 text-[#6D2B35]" strokeWidth={1.6} aria-hidden="true" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-serif text-base text-[#6D2B35] font-semibold">{sub.productName}</h3>
                        <span className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-md border ${STATUS_TOKENS[sub.status] || "bg-gray-50 text-gray-700 border-gray-200"}`}>
                          {sub.status}
                        </span>
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                          <BadgeCheck className="h-2.5 w-2.5" /> Save 10%
                        </span>
                      </div>
                      <div className="text-xs text-[#5a4a3a]/70 space-y-0.5">
                        <p>Qty: <span className="font-semibold text-[#5a4a3a]">{sub.quantity}</span> · {FREQ_LABELS[sub.frequency] || sub.frequency}</p>
                        <p className="font-semibold text-[#6D2B35] text-sm">₹{sub.price.toLocaleString()} per delivery</p>
                        {sub.nextDelivery && sub.status === "active" && (
                          <p className="text-[#D4AF37] font-semibold">
                            Next delivery: {new Date(sub.nextDelivery).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                          </p>
                        )}
                        {sub.address && <p className="text-[11px] text-[#5a4a3a]/55">{sub.address}{sub.city ? `, ${sub.city}` : ""}{sub.pincode ? ` ${sub.pincode}` : ""}</p>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {sub.status === "active" && (
                      <>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => skipMutation.mutate({ id: sub.id, nextDelivery: sub.nextDelivery })}
                          disabled={skipMutation.isPending}
                          className="rounded-md h-9 text-[12px] text-[#6D2B35] border-[#D4AF37]/40 hover:bg-[#FBF7EE] font-semibold"
                          data-testid={`btn-skip-sub-${sub.id}`}
                          aria-label={`Skip next delivery for ${sub.productName}`}
                        >
                          <SkipForward className="h-3.5 w-3.5 mr-1" />
                          Skip Next
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSub(sub)}
                          className="rounded-md h-9 text-[12px] text-[#6D2B35] border-[#6D2B35]/30 hover:bg-[#FBF7EE] font-semibold"
                          data-testid={`btn-edit-sub-${sub.id}`}
                          aria-label={`Edit ${sub.productName} subscription`}
                        >
                          <Settings2 className="h-3.5 w-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => statusMutation.mutate({ id: sub.id, status: "paused" })}
                          disabled={statusMutation.isPending}
                          className="rounded-md h-9 text-[12px] text-amber-800 border-amber-300 hover:bg-amber-50 font-semibold"
                          data-testid={`btn-pause-sub-${sub.id}`}
                          aria-label={`Pause ${sub.productName} subscription`}
                        >
                          <Pause className="h-3.5 w-3.5 mr-1" />
                          Pause
                        </Button>
                      </>
                    )}
                    {sub.status === "paused" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: sub.id, status: "active" })}
                        disabled={statusMutation.isPending}
                        className="rounded-md h-9 text-[12px] text-emerald-800 border-emerald-300 hover:bg-emerald-50 font-semibold"
                        data-testid={`btn-resume-sub-${sub.id}`}
                        aria-label={`Resume ${sub.productName} subscription`}
                      >
                        <Play className="h-3.5 w-3.5 mr-1" />
                        Resume
                      </Button>
                    )}
                    {sub.status !== "cancelled" && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => statusMutation.mutate({ id: sub.id, status: "cancelled" })}
                        disabled={statusMutation.isPending}
                        className="rounded-md h-9 text-[12px] text-rose-700 border-rose-200 hover:bg-rose-50 font-semibold"
                        data-testid={`btn-cancel-sub-${sub.id}`}
                        aria-label={`Cancel ${sub.productName} subscription`}
                      >
                        <X className="h-3.5 w-3.5 mr-1" />
                        Cancel
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Edit dialog */}
        {editingSub && (
          <EditSubscriptionDialog
            sub={editingSub}
            isPending={editMutation.isPending}
            onClose={() => setEditingSub(null)}
            onSave={(payload) => editMutation.mutate({ id: editingSub.id, ...payload })}
          />
        )}

        <PageAPlusContent
          eyebrow="Why Subscribe With Vedic Tatva"
          title="Monthly Puja Samagri Subscription — Never Run Out of Essentials"
          intro="Set up an auto-delivery for your monthly puja essentials — agarbatti, dhoop, camphor, cotton vatti, ghee, roli, kumkum, chandan, akshat — and never interrupt your daily sadhana to source samagri. Skip, pause or modify any month, no commitment."
          trustBadges={[
            { value: "Auto", label: "Delivery" },
            { value: "Skip", label: "Anytime" },
            { value: "Save", label: "Up to 15%" },
            { value: "Free", label: "Shipping" },
          ]}
          benefits={[
            { icon: CalendarClock, title: "Never Run Out", body: "Your daily puja items arrive before they finish — no last-minute trips to the shop, no interruption in your sadhana or family rituals." },
            { icon: Package, title: "Curated Monthly Boxes", body: "Choose from Daily Puja Box (essential samagri), Festival Box (occasion-specific), Sadhaka Box (mala/oils/incense) or Premium Devotion Box." },
            { icon: Sparkles, title: "Save 10–15% vs One-Off", body: "Subscriber pricing is consistently lower than one-off purchase — plus free delivery on every shipment." },
            { icon: RefreshCw, title: "Skip, Pause or Modify", body: "Going on yatra? Skip a month. Need extra for a special puja? Add items to next shipment. Full control, no commitment." },
            { icon: Leaf, title: "Pure & Natural Items", body: "Every subscription contains cow ghee, hand-rolled sandal agarbatti, organic camphor, natural roli/kumkum — no synthetic chemicals." },
            { icon: Truck, title: "Pan-India + NRI", body: "Reliable monthly delivery across India and quarterly delivery options for NRI households in USA, UK, Canada, Singapore and UAE." },
          ]}
          steps={[
            { title: "Choose Your Box", body: "Pick Daily Puja, Festival, Sadhaka or Premium Devotion box — based on your home rituals and family size." },
            { title: "Set Frequency", body: "Monthly (most popular), bi-monthly or quarterly — pick what matches your usage." },
            { title: "Manage Anytime", body: "Skip, pause, swap items, change address or cancel from your dashboard — no calls or emails needed." },
            { title: "Receive & Use", body: "Box arrives every month with everything fresh — keep your daily and festival puja seamless year-round." },
          ]}
          faqs={[
            { q: "What is included in the monthly Daily Puja Box?", a: "The standard Daily Puja Box includes: agarbatti (sandalwood + dhoop variety pack), camphor cubes, cotton vatti for diyas, cow ghee (small jar), roli, kumkum, akshat (rice), chandan, and a small package of dry havan samagri. Sufficient for daily puja in a family home for one month." },
            { q: "Can I skip a month if I'm travelling?", a: "Yes — you can skip any upcoming shipment from your dashboard up to 7 days before despatch. Skipped months are simply not charged. Resume next month automatically." },
            { q: "How is subscription pricing lower than one-off purchase?", a: "Because we plan despatches in advance, packaging is more efficient, and we pass the saving on. Subscribers also get free shipping on every box, which alone usually covers the discount difference. Net saving is typically 10–15% compared to buying the same items one-off." },
            { q: "Can I customise what's in my box?", a: "Yes — at any time you can swap items (e.g., replace sandalwood agarbatti with rose), increase quantities for larger families, or add specific items (extra ghee, special incense, additional kumkum). Customisations apply from the next shipment." },
            { q: "Do you offer occasion-specific subscriptions?", a: "Yes — the Festival Box is delivered just before major festivals (Diwali, Navratri, Ganesh Chaturthi, Janmashtami, Karva Chauth) with all required festival-specific samagri (lakshmi puja kit, navratri akhand jyot oil, modak ingredients, etc.) included." },
            { q: "Can NRIs subscribe?", a: "Yes — we offer quarterly subscriptions for NRI households in USA, UK, Canada, Australia, Singapore and UAE. Each quarterly box contains 3 months of essentials. International shipping included in subscription pricing." },
            { q: "How do I cancel?", a: "Cancel anytime from your dashboard — no calls, no retention attempts, no fees. Active shipments already despatched cannot be cancelled, but no future charges will be made. You can also pause indefinitely instead of cancelling if you may want to resume later." },
            { q: "What if an item is damaged in transit?", a: "Report within 7 days with a photo via our support portal. We replace damaged items in your next shipment, or issue a full refund for the damaged item — your choice." },
          ]}
          keywordsBlurb="Monthly Hindu puja samagri subscription — auto-delivery of daily puja essentials including agarbatti, dhoop, camphor, cow ghee, cotton vatti, roli, kumkum, chandan, akshat and havan samagri. Festival boxes for Diwali Lakshmi puja, Navratri, Ganesh Chaturthi, Janmashtami and Karva Chauth. Sadhaka subscription with rudraksha, sphatik mala and meditation incense. Skip, pause or modify anytime. Pan-India monthly delivery and quarterly NRI shipping for USA, UK, Canada, Singapore, UAE Hindu households."
        />
      </div>
    </div>
  );
}

function EditSubscriptionDialog({
  sub, isPending, onClose, onSave,
}: {
  sub: Subscription;
  isPending: boolean;
  onClose: () => void;
  onSave: (payload: { quantity?: number; frequency?: string; address?: string; city?: string; state?: string; pincode?: string }) => void;
}) {
  const [quantity, setQuantity] = useState(sub.quantity);
  const [frequency, setFrequency] = useState(sub.frequency);
  const [address, setAddress] = useState(sub.address || "");
  const [city, setCity] = useState(sub.city || "");
  const [state, setState] = useState(sub.state || "");
  const [pincode, setPincode] = useState(sub.pincode || "");

  function submit() {
    const payload: any = {};
    if (quantity !== sub.quantity) payload.quantity = quantity;
    if (frequency !== sub.frequency) payload.frequency = frequency;
    if (address.trim() && address !== sub.address) payload.address = address;
    if (city !== sub.city) payload.city = city;
    if (state !== sub.state) payload.state = state;
    if (pincode !== sub.pincode) payload.pincode = pincode;
    if (Object.keys(payload).length === 0) { onClose(); return; }
    onSave(payload);
  }

  return (
    <Dialog open onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-[#6D2B35]">Edit Subscription</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#6D2B35] mb-1">Quantity</label>
            <Input
              type="number"
              min={1}
              max={20}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(20, Math.floor(Number(e.target.value) || 1))))}
              className="h-9"
              data-testid="input-edit-quantity"
              aria-label="Quantity per delivery"
            />
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#6D2B35] mb-1">Frequency</label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger className="h-9" data-testid="select-edit-frequency" aria-label="Delivery frequency">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Every Week</SelectItem>
                <SelectItem value="biweekly">Every 2 Weeks</SelectItem>
                <SelectItem value="monthly">Every Month</SelectItem>
                <SelectItem value="quarterly">Every 3 Months</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="block text-[11px] uppercase tracking-wider font-bold text-[#6D2B35] mb-1">Delivery Address</label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} className="h-9" data-testid="input-edit-address" aria-label="Street address" />
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" className="h-9" data-testid="input-edit-city" aria-label="City" />
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" className="h-9" data-testid="input-edit-state" aria-label="State" />
              <Input value={pincode} onChange={(e) => setPincode(e.target.value)} placeholder="PIN" className="h-9" data-testid="input-edit-pincode" aria-label="PIN code" />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-row gap-2">
          <Button variant="outline" onClick={onClose} className="flex-1" data-testid="btn-edit-cancel">Cancel</Button>
          <Button onClick={submit} disabled={isPending} className="flex-1 bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-edit-save">
            {isPending ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
