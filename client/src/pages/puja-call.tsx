import { useEffect, useMemo, useState } from "react";
import { useRoute, useLocation } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Video, Mic, ArrowLeft, Sparkles, Shield, Phone, AlertTriangle, Users, Copy, Share2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { getPanditToken } from "@/lib/panditAuth";
import { useToast } from "@/hooks/use-toast";

export default function PujaCallPage() {
  const [, params] = useRoute("/puja-call/:id");
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const id = params?.id;
  const search = useMemo(() => new URLSearchParams(window.location.search), []);
  const accessToken = search.get("t") || "";
  const audioOnly = search.get("audio") === "1";
  const isPandit = search.get("as") === "pandit";
  const observerName = search.get("name");

  const [verified, setVerified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<any>(null);
  const [pandit, setPandit] = useState<any>(null);

  useEffect(() => {
    (async () => {
      if (!id) { setError("Invalid call link"); return; }
      try {
        if (isPandit) {
          // pandit verifies via session token
          const tok = getPanditToken();
          if (!tok) { setError("Pandit not logged in"); return; }
          const r = await fetch(`/api/pandit/bookings/${id}/messages`, { headers: { "x-pandit-token": tok } });
          if (!r.ok) throw new Error((await r.json()).error || "Cannot access");
          const j = await r.json();
          setBooking(j.booking); setVerified(true);
        } else {
          // customer: prefer logged-in user; fall back to phone+token
          const phone = user?.phone || "";
          const qs = new URLSearchParams();
          if (phone) qs.set("phone", phone);
          if (accessToken) qs.set("t", accessToken);
          if (user?.id) { qs.set("uid", String(user.id)); qs.set("email", user.email); }
          const r = await fetch(`/api/puja-bookings/${id}/messages?${qs.toString()}`);
          if (!r.ok) throw new Error((await r.json()).error || "Access denied");
          const j = await r.json();
          setBooking(j.booking); setPandit(j.pandit); setVerified(true);
        }
      } catch (e: any) { setError(e?.message || "Cannot join call"); }
    })();
  }, [id, isPandit]);

  if (!id) return <div className="p-8 text-center text-sm">Invalid link.</div>;

  if (error) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto mb-2" />
            <h1 className="text-lg font-serif font-bold text-[#4a1a22]">Cannot Join Call</h1>
            <p className="text-sm text-rose-700 mt-1">{error}</p>
            <Button variant="outline" onClick={() => window.history.back()} className="mt-4" data-testid="btn-back">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!verified || !booking) return <div className="p-8 text-center text-sm text-[#5a4a3a]">Connecting to puja call...</div>;

  if (booking.mode !== "online") {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <p className="text-sm text-[#4a1a22]">This is an in-person puja — no video call needed.</p>
            <Button variant="outline" onClick={() => window.history.back()} className="mt-3">Go Back</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Build deterministic Jitsi room name from booking + accessToken so it's hard to guess
  const roomSecret = (booking.accessToken || accessToken || "").slice(0, 12) || "open";
  const roomName = `vedictatva-puja-${booking.id}-${roomSecret}`;
  const displayName = observerName || (isPandit ? "Panditji" : (user?.name || booking.contactName || "Devotee"));
  const cfg = [
    `config.startWithVideoMuted=${audioOnly ? "true" : "false"}`,
    "config.startWithAudioMuted=false",
    "config.prejoinPageEnabled=false",
    "config.disableDeepLinking=true",
    `userInfo.displayName=${encodeURIComponent(displayName)}`,
    "interfaceConfig.MOBILE_APP_PROMO=false",
    "interfaceConfig.SHOW_JITSI_WATERMARK=false",
    "interfaceConfig.DISABLE_FOCUS_INDICATOR=true",
  ].join("&");
  const jitsiUrl = `https://meet.jit.si/${encodeURIComponent(roomName)}#${cfg}`;

  return (
    <div className="min-h-screen bg-stone-950 flex flex-col">
      {/* Top bar */}
      <div className="bg-[#4a1a22] border-b border-[#D4AF37]/30 px-4 py-2 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3 min-w-0">
          <Button size="sm" variant="ghost" className="text-[#D4AF37] hover:bg-[#6D2B35]" onClick={() => setLocation(isPandit ? "/pandit/portal" : "/my-bookings")} data-testid="btn-call-back"><ArrowLeft className="h-4 w-4 mr-1" />Back</Button>
          <Sparkles className="h-5 w-5 text-[#D4AF37] shrink-0" />
          <div className="min-w-0">
            <div className="text-sm font-serif font-bold text-[#FBF7EE] truncate" data-testid="text-call-puja">{booking.pujaType}</div>
            <div className="text-[10px] text-[#D4AF37]/70 truncate">
              {booking.date} · {booking.confirmedTimeSlot || booking.timeSlot}
              {pandit && <> · with {pandit.name}</>}
              {isPandit && <> · {booking.contactName} ({booking.contactPhone})</>}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {audioOnly ? (
            <Badge className="bg-emerald-700 text-white border-emerald-500"><Mic className="h-3 w-3 mr-1" />Audio Call</Badge>
          ) : (
            <Badge className="bg-emerald-700 text-white border-emerald-500"><Video className="h-3 w-3 mr-1" />Video Call</Badge>
          )}
          <Badge variant="outline" className="border-[#D4AF37]/40 text-[#D4AF37] text-[10px]"><Shield className="h-3 w-3 mr-1" />End-to-end</Badge>
          {!isPandit && booking.accessToken && (
            <>
              <Button
                size="sm"
                variant="outline"
                className="border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#6D2B35]"
                data-testid="btn-invite-family"
                onClick={() => {
                  const url = `${window.location.origin}/puja-call/${booking.id}?t=${booking.accessToken}&name=Family`;
                  navigator.clipboard.writeText(url);
                  toast({ title: "Family invite copied", description: "Share this link with up to 7 family members to join the same puja call." });
                }}
              >
                <Users className="h-3.5 w-3.5 mr-1" />Invite Family
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="border-emerald-500/40 text-emerald-400 hover:bg-emerald-900/30 hidden sm:inline-flex"
                data-testid="btn-share-wa"
                onClick={() => {
                  const url = `${window.location.origin}/puja-call/${booking.id}?t=${booking.accessToken}&name=Family`;
                  const msg = `Join our ${booking.pujaType} puja live with Vedic Tatva: ${url}`;
                  window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank");
                }}
              >
                <Share2 className="h-3.5 w-3.5 mr-1" />WhatsApp
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Jitsi iframe */}
      <div className="flex-1 bg-black">
        <iframe
          src={jitsiUrl}
          allow="camera; microphone; fullscreen; display-capture; autoplay; clipboard-write"
          className="w-full h-full border-0"
          style={{ minHeight: "calc(100vh - 56px)" }}
          title="Vedic Tatva Puja Call"
          data-testid="iframe-jitsi"
        />
      </div>

      <div className="bg-[#4a1a22] px-4 py-1.5 text-center text-[10px] text-[#D4AF37]/70 flex items-center justify-center gap-2 flex-wrap">
        <span>Secure puja call · Powered by Vedic Tatva</span>
        {pandit?.phone && !isPandit && <span className="opacity-70"><Phone className="h-2.5 w-2.5 inline mr-1" />Pandit: {pandit.phone}</span>}
      </div>
    </div>
  );
}
