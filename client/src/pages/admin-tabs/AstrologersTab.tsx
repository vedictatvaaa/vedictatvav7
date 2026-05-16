import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Star, KeyRound, Save } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Astrologer } from "@shared/schema";

import { createFetcher } from "../admin-shared";

function AstrologersTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [pwOpen, setPwOpen] = useState(false);
  const [pwTarget, setPwTarget] = useState<Astrologer | null>(null);
  const [pwValue, setPwValue] = useState("");

  // Local edit buffers per astrologer id (rate inputs in ₹/min, not paise)
  const [edits, setEdits] = useState<Record<number, { chat?: string; call?: string }>>({});

  const { data: astrologersList, isLoading } = useQuery<Astrologer[]>({
    queryKey: ["/api/astrologers", "admin"],
    queryFn: () => fetcher("/api/astrologers?all=true"),
  });

  // Generic admin patch — adds x-admin-token header (the public PATCH route is
  // gated by adminAuthMiddleware now).
  const patchAstrologer = async (id: number, body: Record<string, any>) => {
    const res = await fetch(`/api/astrologers/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Update failed");
    return res.json();
  };

  const patchMutation = useMutation({
    mutationFn: ({ id, body }: { id: number; body: Record<string, any> }) => patchAstrologer(id, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/astrologers"] });
    },
    onError: (e: Error) => toast({ title: "Update failed", description: e.message, variant: "destructive" }),
  });

  const toggleVerified = (a: Astrologer) =>
    patchMutation.mutate(
      { id: a.id, body: { verified: !a.verified } },
      { onSuccess: () => toast({ title: a.verified ? "Astrologer Delisted" : "Astrologer Approved" }) },
    );

  const toggleOnline = (a: Astrologer) =>
    patchMutation.mutate({ id: a.id, body: { online: !a.online } });

  const saveRates = (a: Astrologer) => {
    const buf = edits[a.id] || {};
    const body: Record<string, number> = {};
    if (buf.chat !== undefined && buf.chat !== "") {
      const n = Math.round(parseFloat(buf.chat) * 100);
      if (!Number.isFinite(n) || n < 0) return toast({ title: "Invalid chat rate", variant: "destructive" });
      body.chatRatePaisePerMin = n;
    }
    if (buf.call !== undefined && buf.call !== "") {
      const n = Math.round(parseFloat(buf.call) * 100);
      if (!Number.isFinite(n) || n < 0) return toast({ title: "Invalid call rate", variant: "destructive" });
      body.callRatePaisePerMin = n;
    }
    if (Object.keys(body).length === 0) return;
    patchMutation.mutate(
      { id: a.id, body },
      { onSuccess: () => {
        setEdits(prev => ({ ...prev, [a.id]: {} }));
        toast({ title: "Rates updated" });
      }},
    );
  };

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/astrologers/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/astrologers"] });
      toast({ title: "Astrologer Removed" });
    },
    onError: () => toast({ title: "Failed to remove", variant: "destructive" }),
  });

  const setPasswordMutation = useMutation({
    mutationFn: async ({ id, password }: { id: number; password: string }) => {
      const res = await fetch(`/api/admin/astrologers/${id}/set-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Failed");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Password set", description: "Astrologer can now log in to the portal." });
      setPwOpen(false); setPwValue(""); setPwTarget(null);
    },
    onError: (e: Error) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-astrologers">Astrologers</h1>
        <p className="text-sm text-muted-foreground">
          Manage astrologer registrations, approvals, per-minute rates & portal credentials
        </p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 rounded-xl" />)}
        </div>
      ) : (astrologersList || []).length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <Star className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground/50 text-sm">No astrologer applications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(astrologersList || []).map((a) => {
            const buf = edits[a.id] || {};
            const chatVal = buf.chat ?? ((a.chatRatePaisePerMin ?? 0) / 100).toString();
            const callVal = buf.call ?? ((a.callRatePaisePerMin ?? 0) / 100).toString();
            const dirty = (buf.chat !== undefined && buf.chat !== ((a.chatRatePaisePerMin ?? 0) / 100).toString())
              || (buf.call !== undefined && buf.call !== ((a.callRatePaisePerMin ?? 0) / 100).toString());
            return (
              <Card key={a.id} data-testid={`card-astrologer-${a.id}`}>
                <CardContent className="py-4 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-serif font-bold text-lg shrink-0">
                      {a.name.charAt(0)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-primary">{a.name}</h3>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${a.verified ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                          {a.verified ? "Live" : "Pending"}
                        </span>
                        {a.online && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 inline-flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Online
                          </span>
                        )}
                        {a.password && (
                          <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
                            Portal enabled
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{a.city} · {a.specialization}</p>
                      <p className="text-xs text-secondary">
                        {a.experience} yrs · {a.languages} · ₹{a.fees}/session
                      </p>
                      {a.email && <p className="text-[10px] text-muted-foreground/40">{a.email} · {a.phone}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {a.verified ? (
                        <Button size="sm" variant="outline" onClick={() => toggleVerified(a)} data-testid={`btn-delist-astrologer-${a.id}`}>
                          Delist
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => toggleVerified(a)} className="bg-emerald-600 text-white gap-1" data-testid={`btn-approve-astrologer-${a.id}`}>
                          <CheckCircle className="w-3 h-3" /> Approve
                        </Button>
                      )}
                      <Button size="icon" variant="ghost" onClick={() => deleteMutation.mutate(a.id)} className="text-red-500" data-testid={`btn-delete-astrologer-${a.id}`}>
                        <XCircle className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-3 pt-2 border-t border-border">
                    <div>
                      <Label className="text-xs">Chat rate (₹/min)</Label>
                      <Input
                        type="number" min="0" step="1" value={chatVal}
                        onChange={(e) => setEdits(prev => ({ ...prev, [a.id]: { ...buf, chat: e.target.value } }))}
                        data-testid={`input-chat-rate-${a.id}`}
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Call rate (₹/min)</Label>
                      <Input
                        type="number" min="0" step="1" value={callVal}
                        onChange={(e) => setEdits(prev => ({ ...prev, [a.id]: { ...buf, call: e.target.value } }))}
                        data-testid={`input-call-rate-${a.id}`}
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex items-center gap-2 h-9">
                        <Switch checked={!!a.online} onCheckedChange={() => toggleOnline(a)} data-testid={`switch-online-${a.id}`} />
                        <Label className="text-xs">Online</Label>
                      </div>
                    </div>
                    <div className="flex items-end gap-2 flex-wrap">
                      <Button
                        size="sm" disabled={!dirty || patchMutation.isPending}
                        onClick={() => saveRates(a)}
                        className="gap-1" data-testid={`btn-save-rates-${a.id}`}
                      >
                        <Save className="w-3 h-3" /> Save rates
                      </Button>
                      <Button
                        size="sm" variant="outline"
                        onClick={() => { setPwTarget(a); setPwValue(""); setPwOpen(true); }}
                        className="gap-1" data-testid={`btn-reset-password-${a.id}`}
                      >
                        <KeyRound className="w-3 h-3" /> {a.password ? "Reset password" : "Set password"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={pwOpen} onOpenChange={setPwOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pwTarget?.password ? "Reset" : "Set"} portal password — {pwTarget?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>New password (min 8 characters)</Label>
            <Input
              type="password" autoComplete="new-password" minLength={8}
              value={pwValue} onChange={(e) => setPwValue(e.target.value)}
              data-testid="input-new-astrologer-password"
            />
            <p className="text-xs text-muted-foreground">
              Astrologer logs in at <code>/astrologer-portal</code> using their phone number + this password.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwOpen(false)} data-testid="btn-cancel-password">Cancel</Button>
            <Button
              disabled={pwValue.length < 8 || setPasswordMutation.isPending}
              onClick={() => pwTarget && setPasswordMutation.mutate({ id: pwTarget.id, password: pwValue })}
              data-testid="btn-confirm-password"
            >
              {setPasswordMutation.isPending ? "Saving…" : "Save password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AstrologersTab;
