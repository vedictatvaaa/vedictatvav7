import { useEffect, useMemo, useRef, useState } from "react";
import { useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Sparkles, MessageSquare, ClipboardList, Send, IndianRupee, CalendarDays, MapPin, Phone, Heart, ShieldCheck, Video, Mic } from "lucide-react";
import { useAuth } from "@/lib/auth";

type Msg = { id: number; senderType: string; senderName: string; message: string; createdAt: string };

const KEY = (id: string | number) => `vt_booking_phone_${id}`;

export default function MyPujaBookingPage() {
  const [, params] = useRoute("/my-puja-booking/:id");
  const id = params?.id;
  const { toast } = useToast();
  const { user } = useAuth();
  const accessToken = useMemo(() => new URLSearchParams(window.location.search).get("t") || "", []);
  const [phone, setPhone] = useState<string>(() => (id ? localStorage.getItem(KEY(id)) || "" : ""));
  // Logged-in users skip phone gate entirely
  const [verifiedPhone, setVerifiedPhone] = useState<string>(() => {
    if (!id) return "";
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem(KEY(id));
      if (stored) return stored;
    }
    return "";
  });
  const isLoggedInOwner = !!user;
  const [data, setData] = useState<{ booking: any; messages: Msg[]; pandit: any } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [tipOpen, setTipOpen] = useState(false);
  const [tipAmt, setTipAmt] = useState(101);
  const [tipMsg, setTipMsg] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const load = async (ph: string) => {
    if (!id) return;
    if (!ph && !isLoggedInOwner) return;
    try {
      const qs = new URLSearchParams();
      if (ph) qs.set("phone", ph);
      if (accessToken) qs.set("t", accessToken);
      if (user?.id) { qs.set("uid", String(user.id)); qs.set("email", user.email); }
      const r = await fetch(`/api/puja-bookings/${id}/messages?${qs.toString()}`);
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.error || "Failed");
      }
      const j = await r.json();
      setData(j);
      setError(null);
      setTimeout(() => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }), 50);
    } catch (e: any) { setError(e?.message || "Failed"); }
  };

  useEffect(() => {
    if (verifiedPhone || isLoggedInOwner) load(verifiedPhone || (user?.phone || ""));
  }, [verifiedPhone, id, isLoggedInOwner]);
  // Poll every 6s
  useEffect(() => {
    if (!verifiedPhone && !isLoggedInOwner) return;
    const t = setInterval(() => load(verifiedPhone || (user?.phone || "")), 6000);
    return () => clearInterval(t);
  }, [verifiedPhone, id, isLoggedInOwner]);

  const verify = async () => {
    if (!phone || phone.replace(/\D/g, "").length < 10) { toast({ title: "Enter your 10-digit phone", variant: "destructive" }); return; }
    if (id) localStorage.setItem(KEY(id), phone);
    setVerifiedPhone(phone);
  };

  const send = async () => {
    if (!draft.trim() || !data) return;
    try {
      const r = await fetch(`/api/puja-bookings/${id}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: verifiedPhone, token: accessToken || undefined, message: draft.trim() }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Failed"); }
      setDraft("");
      await load(verifiedPhone);
    } catch (e: any) { toast({ title: "Send failed", description: e?.message, variant: "destructive" }); }
  };

  const sendTip = async () => {
    try {
      // NOTE: live Razorpay flow can be wired later. For now, mark as pending.
      const r = await fetch(`/api/puja-bookings/${id}/tip`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: verifiedPhone, token: accessToken || undefined, amountInr: tipAmt, message: tipMsg }),
      });
      if (!r.ok) { const j = await r.json().catch(() => ({})); throw new Error(j.error || "Failed"); }
      toast({ title: "Dakshina pledged", description: "Our team will reach out with payment link." });
      setTipOpen(false); setTipMsg("");
      await load(verifiedPhone);
    } catch (e: any) { toast({ title: "Failed", description: e?.message, variant: "destructive" }); }
  };

  if (!id) return <div className="p-8 text-center text-sm text-[#5a4a3a]">Invalid booking link.</div>;

  // Phone gate (skipped for logged-in users)
  if (!verifiedPhone && !isLoggedInOwner) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center px-4 py-10">
        <Card className="max-w-md w-full">
          <CardContent className="p-6">
            <ShieldCheck className="h-10 w-10 text-[#6D2B35] mx-auto mb-2" />
            <h1 className="text-lg font-serif font-bold text-[#4a1a22] text-center">View Booking #{id}</h1>
            <p className="text-xs text-[#5a4a3a]/65 text-center mt-1">Enter the phone number you used while booking.</p>
            <div className="space-y-2 mt-4">
              <Label htmlFor="ph">Phone (10 digits)</Label>
              <Input id="ph" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} data-testid="input-verify-phone" />
              <Button onClick={verify} className="w-full bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-verify-phone">Open Booking</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center px-4">
        <Card className="max-w-md w-full"><CardContent className="p-6 text-center">
          <p className="text-sm text-rose-700 mb-3">{error}</p>
          <Button variant="outline" onClick={() => { if (id) localStorage.removeItem(KEY(id)); setVerifiedPhone(""); }}>Try a different phone</Button>
        </CardContent></Card>
      </div>
    );
  }

  if (!data) return <div className="p-8 text-center text-sm text-[#5a4a3a]">Loading...</div>;

  const b = data.booking;
  const chatClosed = ["completed", "declined", "cancelled"].includes(b.status);

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      {/* Header card */}
      <div className="container mx-auto px-4 py-5 max-w-4xl">
        <Card className="border-2 border-[#D4AF37]/40">
          <div className="h-2 w-full bg-gradient-to-r from-[#D4AF37] via-[#f5d76e] to-[#D4AF37]" />
          <CardContent className="p-5">
            <div className="flex items-start justify-between flex-wrap gap-3">
              <div>
                <Badge className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#6D2B35] mb-2 uppercase">{b.status}</Badge>
                <h1 className="text-xl md:text-2xl font-serif font-bold text-[#4a1a22]" data-testid="text-puja-title">{b.pujaType}</h1>
                <div className="text-xs text-[#5a4a3a]/75 mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                  <span><CalendarDays className="h-3 w-3 inline mr-1" />{b.date} · {b.confirmedTimeSlot || b.timeSlot}</span>
                  <span><Phone className="h-3 w-3 inline mr-1" />{b.contactPhone}</span>
                  {b.location && <span><MapPin className="h-3 w-3 inline mr-1" />{b.location}</span>}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] text-[#5a4a3a]/65 uppercase">Total</div>
                <div className="text-xl font-bold text-[#4a1a22]">₹{b.totalAmount.toLocaleString("en-IN")}</div>
              </div>
            </div>
            {data.pandit ? (
              <div className="mt-4 flex items-center gap-3 bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-3">
                <div className="h-10 w-10 rounded-full bg-[#6D2B35] flex items-center justify-center text-[#D4AF37] font-bold">{(data.pandit.name || "P").charAt(0)}</div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-[#4a1a22]" data-testid="text-pandit-name">{data.pandit.name}</div>
                  <div className="text-[11px] text-[#5a4a3a]/70">{data.pandit.city} · {data.pandit.rating?.toFixed(1)} ★</div>
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  {b.mode === "online" && b.status === "accepted" && (
                    <>
                      <Button asChild size="sm" className="bg-emerald-700 hover:bg-emerald-800 text-white" data-testid="btn-cust-join-video">
                        <a href={`/puja-call/${b.id}?t=${b.accessToken || accessToken}&name=${encodeURIComponent(user?.name || b.contactName)}`}><Video className="h-4 w-4 mr-1.5" />Join Video Call</a>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="border-emerald-300 text-emerald-800" data-testid="btn-cust-join-audio">
                        <a href={`/puja-call/${b.id}?t=${b.accessToken || accessToken}&audio=1&name=${encodeURIComponent(user?.name || b.contactName)}`}><Mic className="h-4 w-4 mr-1.5" />Audio</a>
                      </Button>
                    </>
                  )}
                  {b.status === "completed" && (
                    <Button size="sm" onClick={() => setTipOpen(true)} className="bg-[#D4AF37] hover:bg-[#c39d2c] text-[#4a1a22] font-bold" data-testid="btn-open-tip">
                      <Heart className="h-4 w-4 mr-1.5" />Send Dakshina
                    </Button>
                  )}
                  {b.status === "accepted" && (
                    <Button size="sm" variant="outline" onClick={() => setTipOpen(true)} data-testid="btn-open-tip-2"><IndianRupee className="h-4 w-4 mr-1" />Tip</Button>
                  )}
                </div>
              </div>
            ) : (
              <div className="mt-4 bg-amber-50 border border-amber-200 rounded-md p-3 text-xs text-amber-900">Panditji being assigned. You'll be notified soon.</div>
            )}
          </CardContent>
        </Card>

        {/* Samagri */}
        {Array.isArray(b.samagriList) && b.samagriList.length > 0 && (
          <Card className="mt-4">
            <CardContent className="p-5">
              <div className="flex items-center gap-2 mb-3"><ClipboardList className="h-5 w-5 text-[#6D2B35]" /><h2 className="text-base font-serif font-bold text-[#4a1a22]">Samagri (Items) Needed</h2></div>
              <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {b.samagriList.map((it: any, i: number) => (
                  <li key={i} className="flex items-center justify-between text-sm bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md px-3 py-2" data-testid={`samagri-${i}`}>
                    <span className="text-[#4a1a22]">{it.name}</span>
                    {it.qty && <span className="text-xs text-[#6D2B35] font-semibold">{it.qty}</span>}
                  </li>
                ))}
              </ul>
              <p className="text-[11px] text-[#5a4a3a]/65 mt-3">You can order missing items from <a href="/puja-samagri-online" className="text-[#6D2B35] underline">Vedic Tatva shop</a>.</p>
            </CardContent>
          </Card>
        )}

        {/* Messages */}
        <Card className="mt-4">
          <CardContent className="p-0">
            <div className="px-5 py-3 border-b border-[#D4AF37]/15 flex items-center gap-2">
              <MessageSquare className="h-4 w-4 text-[#6D2B35]" />
              <span className="text-sm font-serif font-bold text-[#4a1a22]">Messages with Panditji</span>
              {!chatClosed && <Badge variant="secondary" className="ml-auto bg-emerald-100 text-emerald-800 text-[10px]">Live</Badge>}
            </div>
            <div ref={scrollRef} className="h-[420px] overflow-y-auto p-4 space-y-2 bg-gradient-to-b from-white to-[#FBF7EE]/40">
              {data.messages.length === 0 && <div className="text-center text-xs text-[#5a4a3a]/55 py-12">No messages yet. Say Pranam</div>}
              {data.messages.map((m) => {
                const isMe = m.senderType === "customer";
                const isSys = m.senderType === "system";
                return (
                  <div key={m.id} className={`flex ${isSys ? "justify-center" : isMe ? "justify-end" : "justify-start"}`} data-testid={`cust-msg-${m.id}`}>
                    <div className={`max-w-[80%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                      isSys ? "bg-[#FBF7EE] text-[#5a4a3a] text-xs italic border border-[#D4AF37]/20"
                      : isMe ? "bg-[#6D2B35] text-[#FBF7EE]"
                      : "bg-white text-[#4a1a22] border border-[#D4AF37]/25"
                    }`}>
                      {!isSys && <div className="text-[10px] opacity-70 mb-0.5 font-semibold">{m.senderName}</div>}
                      <div>{m.message}</div>
                      <div className="text-[9px] opacity-60 mt-1 text-right">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="p-3 border-t border-[#D4AF37]/15">
              {chatClosed ? (
                <div className="text-center text-xs text-[#5a4a3a]/65 py-2">Chat closed — booking is {b.status}.</div>
              ) : (
                <div className="flex gap-2">
                  <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Type a message to Panditji..." rows={2} className="resize-none" onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }} data-testid="input-cust-draft" />
                  <Button onClick={send} disabled={!draft.trim()} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="btn-cust-send"><Send className="h-4 w-4" /></Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tip dialog */}
      <Dialog open={tipOpen} onOpenChange={setTipOpen}>
        <DialogContent className="max-w-sm" data-testid="dialog-tip">
          <DialogHeader>
            <DialogTitle className="font-serif text-[#4a1a22] flex items-center gap-2"><Sparkles className="h-5 w-5 text-[#D4AF37]" />Send Dakshina to Panditji</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-[#5a4a3a]/70">A small offering as gratitude for the puja. 100% goes to Panditji.</p>
          <div className="grid grid-cols-4 gap-2 my-2">
            {[101, 251, 501, 1001, 1100, 2100, 5100, 11000].map((v) => (
              <button key={v} onClick={() => setTipAmt(v)} className={`text-xs font-semibold py-2 rounded-md border ${tipAmt === v ? "border-[#D4AF37] bg-[#FBF7EE] text-[#4a1a22]" : "border-[#D4AF37]/25 text-[#5a4a3a]"}`} data-testid={`tip-amt-${v}`}>₹{v.toLocaleString("en-IN")}</button>
            ))}
          </div>
          <div>
            <Label htmlFor="tip-amt">Custom amount</Label>
            <Input id="tip-amt" type="number" min={11} value={tipAmt} onChange={(e) => setTipAmt(Number(e.target.value) || 0)} data-testid="input-tip-amt" />
          </div>
          <div>
            <Label htmlFor="tip-msg">Message (optional)</Label>
            <Textarea id="tip-msg" rows={2} value={tipMsg} onChange={(e) => setTipMsg(e.target.value)} placeholder="With gratitude" data-testid="input-tip-msg" />
          </div>
          <Button onClick={sendTip} disabled={tipAmt < 11} className="w-full bg-[#D4AF37] hover:bg-[#c39d2c] text-[#4a1a22] font-bold" data-testid="btn-send-tip">
            Send ₹{tipAmt.toLocaleString("en-IN")} as Dakshina
          </Button>
          <p className="text-[10px] text-[#5a4a3a]/55 text-center">Payment link will be shared on WhatsApp/SMS.</p>
        </DialogContent>
      </Dialog>
    </div>
  );
}
