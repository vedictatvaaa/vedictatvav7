import { useEffect, useRef, useState } from "react";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Send, PhoneOff, Wallet as WalletIcon, Star, Clock } from "lucide-react";
import { getIdentity, identityFetch } from "@/lib/userIdentity";

type SessionData = { session: any; walletBalancePaise: number; astrologer: { id: number; name: string; image: string | null } | null };
type Msg = { id: number; senderType: string; body: string; createdAt: string };

export default function AstrologySessionPage() {
  const [, params] = useRoute("/astrology-session/:id");
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const id = params?.id ? Number(params.id) : null;
  const me = getIdentity();
  const [data, setData] = useState<SessionData | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [showRate, setShowRate] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [elapsedSec, setElapsedSec] = useState(0);
  const lastMsgIdRef = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!me) { setLocation("/login"); return; }
    if (!id) return;
    let active = true;
    let pollHandle: any;

    async function loop() {
      try {
        const fresh = await identityFetch<SessionData>(`/api/astrology-sessions/${id}`);
        if (!active) return;
        setData(fresh);
        if (fresh.session.startedAt) {
          setElapsedSec(Math.floor((Date.now() - new Date(fresh.session.startedAt).getTime()) / 1000));
        }
        const newMsgs = await identityFetch<Msg[]>(`/api/astrology-sessions/${id}/messages?sinceId=${lastMsgIdRef.current}`);
        if (!active) return;
        if (newMsgs.length) {
          setMsgs(prev => [...prev, ...newMsgs]);
          lastMsgIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
        if (fresh.session.status !== "active" && !showRate) {
          setShowRate(true);
        }
      } catch (e: any) {
        // soft-fail polling errors
      } finally {
        if (active) pollHandle = setTimeout(loop, 3000);
      }
    }
    loop();
    return () => { active = false; if (pollHandle) clearTimeout(pollHandle); };
  }, [id]);

  useEffect(() => { scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }); }, [msgs.length]);

  async function send() {
    const body = text.trim();
    if (!body || !id) return;
    setSending(true); setText("");
    try {
      await identityFetch(`/api/astrology-sessions/${id}/messages`, { method: "POST", body: JSON.stringify({ body }) });
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
      setText(body);
    } finally { setSending(false); }
  }

  async function endSession() {
    if (!id) return;
    if (!confirm("End this consultation?")) return;
    try {
      await identityFetch(`/api/astrology-sessions/${id}/end`, { method: "POST" });
      setShowRate(true);
    } catch (e: any) { toast({ title: "Could not end session", description: e.message, variant: "destructive" }); }
  }

  async function submitRating() {
    if (!id) return;
    try {
      await identityFetch(`/api/astrology-sessions/${id}/rate`, {
        method: "POST", body: JSON.stringify({ rating, comment: comment || undefined }),
      });
      toast({ title: "Thank you for your feedback" });
      setLocation("/astrology");
    } catch (e: any) { toast({ title: "Rating failed", description: e.message, variant: "destructive" }); }
  }

  if (!data) return <div className="container mx-auto p-8">Connecting...</div>;
  const s = data.session;
  const isActive = s.status === "active";
  const balance = data.walletBalancePaise / 100;
  const ratePerMin = s.ratePaisePerMin / 100;
  const freeLeft = Math.max(0, s.freeMinutesGranted - s.freeMinutesUsed);
  const min = Math.floor(elapsedSec / 60), sec = elapsedSec % 60;

  return (
    <div className="min-h-screen bg-[#FBF7EE] flex flex-col">
      {/* Header */}
      <div className="bg-[#6D2B35] text-white px-4 py-3 sticky top-0 z-50">
        <div className="container mx-auto max-w-3xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-semibold">
              {data.astrologer?.name?.[0] || "A"}
            </div>
            <div>
              <div className="font-semibold" data-testid="text-astrologer-name">{data.astrologer?.name}</div>
              <div className="text-xs opacity-80 flex items-center gap-2">
                <Clock className="h-3 w-3" /> {String(min).padStart(2, "0")}:{String(sec).padStart(2, "0")}
                <span>·</span>
                <span>₹{ratePerMin}/min</span>
                {freeLeft > 0 && <Badge className="bg-[#D4AF37] text-[#6D2B35] text-[10px] h-5">{freeLeft} free min left</Badge>}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="opacity-80">Balance</div>
              <div className="font-bold flex items-center gap-1"><WalletIcon className="h-3 w-3" /> ₹{balance.toFixed(2)}</div>
            </div>
            {isActive && (
              <Button size="sm" variant="destructive" onClick={endSession} data-testid="button-end-session">
                <PhoneOff className="h-4 w-4 mr-1" /> End
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        <div className="container mx-auto max-w-3xl space-y-3">
          {msgs.map(m => (
            <div
              key={m.id}
              className={
                m.senderType === "system" ? "text-center" :
                m.senderType === "user" ? "flex justify-end" : "flex justify-start"
              }
              data-testid={`msg-${m.id}`}
            >
              {m.senderType === "system" ? (
                <div className="inline-block bg-[#D4AF37]/15 text-[#6D2B35] text-xs px-3 py-1 rounded-md">{m.body}</div>
              ) : (
                <div className={`max-w-[75%] px-3 py-2 rounded-md ${m.senderType === "user" ? "bg-[#6D2B35] text-white" : "bg-white border border-[#D4AF37]/30 text-[#3a2a20]"}`}>
                  <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                  <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Composer */}
      {isActive && (
        <div className="bg-white border-t border-[#D4AF37]/30 p-3 sticky bottom-0">
          <div className="container mx-auto max-w-3xl flex gap-2">
            <Input
              placeholder="Type your question..."
              value={text}
              onChange={e => setText(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
              disabled={sending}
              data-testid="input-message"
            />
            <Button onClick={send} disabled={sending || !text.trim()} data-testid="button-send">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Rating modal */}
      {showRate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[100] p-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-6">
              <h3 className="text-lg font-semibold mb-1">Session ended</h3>
              <div className="text-sm text-[#5a4a3a] mb-4">
                Charged ₹{(s.amountChargedPaise / 100).toFixed(2)} · {Math.floor(s.durationSec / 60)} min{s.freeMinutesUsed > 0 ? ` (${s.freeMinutesUsed} free)` : ""}
              </div>
              <div className="mb-4">
                <div className="text-sm mb-2">Rate your experience</div>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map(n => (
                    <button key={n} onClick={() => setRating(n)} data-testid={`button-star-${n}`}>
                      <Star className={`h-7 w-7 ${n <= rating ? "fill-[#D4AF37] text-[#D4AF37]" : "text-[#5a4a3a]/40"}`} />
                    </button>
                  ))}
                </div>
              </div>
              <Input placeholder="Optional comment" value={comment} onChange={e => setComment(e.target.value)} className="mb-3" data-testid="input-comment" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setLocation("/astrology")} data-testid="button-skip-rating">Skip</Button>
                <Button onClick={submitRating} data-testid="button-submit-rating">Submit</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
