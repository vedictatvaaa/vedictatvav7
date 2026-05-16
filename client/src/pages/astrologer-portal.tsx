import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { LogOut, MessageSquare, Wallet, Activity, Send, Power } from "lucide-react";
import { astrologerApi, clearAstrologerToken, getAstrologerToken, setAstrologerToken } from "@/lib/astrologerAuth";

type Astrologer = any;
type Session = any;
type Msg = { id: number; senderType: string; body: string; createdAt: string };

export default function AstrologerPortalPage() {
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [me, setMe] = useState<Astrologer | null>(null);
  const [phone, setPhone] = useState("");
  const [pwd, setPwd] = useState("");
  const [tab, setTab] = useState<"inbox" | "earnings" | "profile">("inbox");
  const [sessions, setSessions] = useState<Session[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [activeSessionId, setActiveSessionId] = useState<number | null>(null);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const lastMsgIdRef = useRef(0);

  useEffect(() => {
    if (getAstrologerToken()) loadMe();
  }, []);

  // Heartbeat + sessions polling.
  useEffect(() => {
    if (!me) return;
    const tick = setInterval(async () => {
      try {
        await astrologerApi("/api/astrologer/me/heartbeat", { method: "POST" });
        const s = await astrologerApi<Session[]>("/api/astrologer/me/sessions");
        setSessions(s);
      } catch {}
    }, 5000);
    return () => clearInterval(tick);
  }, [me]);

  // Active-session message polling.
  useEffect(() => {
    if (!activeSessionId) return;
    let active = true;
    setMsgs([]); lastMsgIdRef.current = 0;
    async function loop() {
      try {
        const newMsgs = await astrologerApi<Msg[]>(`/api/astrologer/sessions/${activeSessionId}/messages?sinceId=${lastMsgIdRef.current}`);
        if (!active) return;
        if (newMsgs.length) {
          setMsgs(p => [...p, ...newMsgs]);
          lastMsgIdRef.current = newMsgs[newMsgs.length - 1].id;
        }
      } catch {}
      if (active) setTimeout(loop, 3000);
    }
    loop();
    return () => { active = false; };
  }, [activeSessionId]);

  async function loadMe() {
    try {
      const m = await astrologerApi<Astrologer>("/api/astrologer/me");
      setMe(m);
      const s = await astrologerApi<Session[]>("/api/astrologer/me/sessions");
      setSessions(s);
      const e = await astrologerApi<any>("/api/astrologer/me/earnings");
      setEarnings(e);
    } catch { setMe(null); }
  }

  async function login() {
    try {
      const r = await astrologerApi<any>("/api/astrologer/auth/login", {
        method: "POST", body: JSON.stringify({ phone, password: pwd }),
      });
      setAstrologerToken(r.token);
      await loadMe();
    } catch (e: any) {
      toast({ title: "Login failed", description: e.message, variant: "destructive" });
    }
  }

  async function logout() {
    try { await astrologerApi("/api/astrologer/auth/logout", { method: "POST" }); } catch {}
    clearAstrologerToken(); setMe(null);
  }

  async function toggleField(field: "online" | "acceptingChat" | "acceptingCall", val: boolean) {
    try {
      const r = await astrologerApi<any>("/api/astrologer/me/online", { method: "POST", body: JSON.stringify({ [field]: val }) });
      setMe((m: any) => ({ ...m, ...r }));
    } catch (e: any) {
      toast({ title: "Update failed", description: e.message, variant: "destructive" });
    }
  }

  async function sendMessage() {
    if (!activeSessionId || !text.trim()) return;
    const body = text.trim(); setText("");
    try {
      await astrologerApi(`/api/astrologer/sessions/${activeSessionId}/messages`, { method: "POST", body: JSON.stringify({ body }) });
    } catch (e: any) {
      toast({ title: "Send failed", description: e.message, variant: "destructive" });
      setText(body);
    }
  }

  async function endActiveSession() {
    if (!activeSessionId) return;
    try {
      await astrologerApi(`/api/astrologer/sessions/${activeSessionId}/end`, { method: "POST" });
      setActiveSessionId(null);
      const s = await astrologerApi<Session[]>("/api/astrologer/me/sessions");
      setSessions(s);
    } catch (e: any) {
      toast({ title: "End failed", description: e.message, variant: "destructive" });
    }
  }

  // ---------- Login screen ----------
  if (!me) {
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader><CardTitle>Astrologer Portal Login</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Phone (10-digit)</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="9876543210" data-testid="input-phone" />
            </div>
            <div>
              <Label>Password</Label>
              <Input type="password" value={pwd} onChange={e => setPwd(e.target.value)} data-testid="input-password" />
            </div>
            <Button className="w-full" onClick={login} data-testid="button-login">Sign In</Button>
            <p className="text-xs text-[#5a4a3a]">No password yet? Ask admin to set one for your account.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const activeSessions = sessions.filter(s => s.status === "active");
  const recentEnded = sessions.filter(s => s.status === "ended").slice(0, 10);

  // ---------- Active chat overlay ----------
  if (activeSessionId) {
    const s = sessions.find(x => x.id === activeSessionId);
    return (
      <div className="min-h-screen bg-[#FBF7EE] flex flex-col">
        <div className="bg-[#6D2B35] text-white px-4 py-3 sticky top-0 z-50 flex items-center justify-between">
          <div>
            <div className="font-semibold">Live Consultation #{activeSessionId}</div>
            <div className="text-xs opacity-80">₹{((s?.ratePaisePerMin || 0) / 100).toFixed(0)}/min · {Math.floor((s?.durationSec || 0) / 60)} min</div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" className="bg-white/10 text-white border-white/30" onClick={() => setActiveSessionId(null)} data-testid="button-back-inbox">Back</Button>
            <Button size="sm" variant="destructive" onClick={endActiveSession} data-testid="button-end-active">End Session</Button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-4 py-4">
          <div className="container mx-auto max-w-3xl space-y-3">
            {msgs.map(m => (
              <div key={m.id} className={
                m.senderType === "system" ? "text-center" :
                m.senderType === "astrologer" ? "flex justify-end" : "flex justify-start"
              }>
                {m.senderType === "system" ? (
                  <div className="inline-block bg-[#D4AF37]/15 text-[#6D2B35] text-xs px-3 py-1 rounded-md">{m.body}</div>
                ) : (
                  <div className={`max-w-[75%] px-3 py-2 rounded-md ${m.senderType === "astrologer" ? "bg-[#6D2B35] text-white" : "bg-white border border-[#D4AF37]/30"}`}>
                    <div className="text-sm whitespace-pre-wrap break-words">{m.body}</div>
                    <div className="text-[10px] opacity-70 mt-1">{new Date(m.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white border-t border-[#D4AF37]/30 p-3">
          <div className="container mx-auto max-w-3xl flex gap-2">
            <Input value={text} onChange={e => setText(e.target.value)} onKeyDown={e => { if (e.key === "Enter") sendMessage(); }} placeholder="Type your reply..." data-testid="input-astro-msg" />
            <Button onClick={sendMessage} disabled={!text.trim()} data-testid="button-astro-send"><Send className="h-4 w-4" /></Button>
          </div>
        </div>
      </div>
    );
  }

  // ---------- Dashboard ----------
  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <div className="bg-[#6D2B35] text-white px-4 py-3">
        <div className="container mx-auto flex items-center justify-between max-w-5xl">
          <div>
            <div className="font-semibold" data-testid="text-astrologer-greeting">Hello, {me.name}</div>
            <div className="text-xs opacity-80">{me.city} · {me.experience} yrs</div>
          </div>
          <Button size="sm" variant="outline" className="bg-white/10 text-white border-white/30" onClick={logout} data-testid="button-logout">
            <LogOut className="h-4 w-4 mr-1" /> Logout
          </Button>
        </div>
      </div>

      <div className="container mx-auto max-w-5xl px-4 py-6 space-y-4">
        {/* Status card */}
        <Card>
          <CardContent className="pt-5">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold flex items-center gap-2"><Power className="h-4 w-4 text-emerald-600" /> Online</div>
                  <div className="text-xs text-[#5a4a3a]">Show as available</div>
                </div>
                <Switch checked={me.online} onCheckedChange={v => toggleField("online", v)} data-testid="switch-online" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Accept Chat</div>
                  <div className="text-xs text-[#5a4a3a]">₹{(me.chatRatePaisePerMin / 100).toFixed(0)}/min</div>
                </div>
                <Switch checked={me.acceptingChat} onCheckedChange={v => toggleField("acceptingChat", v)} data-testid="switch-chat" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-semibold">Accept Call</div>
                  <div className="text-xs text-[#5a4a3a]">Phase 2 — coming</div>
                </div>
                <Switch checked={me.acceptingCall} onCheckedChange={v => toggleField("acceptingCall", v)} disabled data-testid="switch-call" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Earnings */}
        {earnings && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Card><CardContent className="pt-5"><div className="text-xs text-[#5a4a3a]">Total earnings</div><div className="text-lg font-semibold">₹{(earnings.totalEarningsPaise / 100).toLocaleString("en-IN")}</div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-xs text-[#5a4a3a]">Last 30 days</div><div className="text-lg font-semibold">₹{(earnings.last30DaysPaise / 100).toLocaleString("en-IN")}</div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-xs text-[#5a4a3a]">Sessions</div><div className="text-lg font-semibold">{earnings.totalSessions}</div></CardContent></Card>
            <Card><CardContent className="pt-5"><div className="text-xs text-[#5a4a3a]">Minutes</div><div className="text-lg font-semibold">{earnings.totalMinutes}</div></CardContent></Card>
          </div>
        )}

        {/* Active sessions */}
        <Card>
          <CardHeader><CardTitle className="text-base flex items-center gap-2"><Activity className="h-4 w-4" /> Active Sessions ({activeSessions.length})</CardTitle></CardHeader>
          <CardContent>
            {activeSessions.length === 0 ? (
              <div className="text-sm text-[#5a4a3a]">{me.online ? "Waiting for users to start a session..." : "Go online to start receiving sessions."}</div>
            ) : (
              <div className="space-y-2">
                {activeSessions.map(s => (
                  <div key={s.id} className="flex items-center justify-between border border-[#D4AF37]/30 rounded-md p-3" data-testid={`row-active-${s.id}`}>
                    <div>
                      <div className="text-sm font-semibold">Session #{s.id} — {s.mode}</div>
                      <div className="text-xs text-[#5a4a3a]">User #{s.userId} · ₹{(s.ratePaisePerMin / 100).toFixed(0)}/min · {Math.floor(s.durationSec / 60)} min</div>
                    </div>
                    <Button size="sm" onClick={() => setActiveSessionId(s.id)} data-testid={`button-open-${s.id}`}>
                      <MessageSquare className="h-4 w-4 mr-1" /> Open Chat
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent ended */}
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Sessions</CardTitle></CardHeader>
          <CardContent>
            {recentEnded.length === 0 ? <div className="text-sm text-[#5a4a3a]">No completed sessions yet.</div> : (
              <div className="space-y-2">
                {recentEnded.map(s => (
                  <div key={s.id} className="flex items-center justify-between border-b border-[#D4AF37]/20 pb-2 last:border-0" data-testid={`row-ended-${s.id}`}>
                    <div>
                      <div className="text-sm font-medium">#{s.id} · {Math.floor(s.durationSec / 60)} min</div>
                      <div className="text-xs text-[#5a4a3a]">{new Date(s.endedAt).toLocaleString()} · ended by {s.endedBy}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-700">+₹{(s.astrologerEarningsPaise / 100).toFixed(2)}</div>
                      <Badge variant="outline" className="text-[10px]">{s.status}</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
