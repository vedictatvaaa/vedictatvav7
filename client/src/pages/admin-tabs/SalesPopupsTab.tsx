import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit, Type, Clock, Megaphone } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Coupon, SalesPopup } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { createFetcher } from "../admin-shared";

// ============================================================
// Sales FOMO Popups — campaign manager
// ============================================================
function SalesPopupsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: popups, isLoading } = useQuery<SalesPopup[]>({
    queryKey: ["/api/sales-popups"],
    queryFn: () => fetcher("/api/sales-popups"),
  });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<SalesPopup | null>(null);

  // Build a "yyyy-MM-ddThh:mm" string in local time for datetime-local inputs.
  const toLocalInput = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const defaultForm = () => {
    const now = new Date();
    const ends = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    return {
      title: "",
      message: "",
      couponCode: "",
      ctaLabel: "Shop Now",
      ctaUrl: "/products",
      startsAt: toLocalInput(now),
      endsAt: toLocalInput(ends),
      showAfterSeconds: 8,
      frequency: "session" as "session" | "daily" | "always",
      enabled: true,
    };
  };

  const [form, setForm] = useState(defaultForm());

  const openCreate = () => {
    setEditing(null);
    setForm(defaultForm());
    setDialogOpen(true);
  };

  const openEdit = (p: SalesPopup) => {
    setEditing(p);
    // Null-coalesce all fields — guards against legacy rows that pre-date
    // the NOT NULL defaults so controlled inputs never receive null.
    setForm({
      title: p.title ?? "",
      message: p.message ?? "",
      couponCode: p.couponCode ?? "",
      ctaLabel: p.ctaLabel ?? "Shop Now",
      ctaUrl: p.ctaUrl ?? "/products",
      startsAt: p.startsAt ? toLocalInput(new Date(p.startsAt)) : toLocalInput(new Date()),
      endsAt: p.endsAt ? toLocalInput(new Date(p.endsAt)) : toLocalInput(new Date(Date.now() + 7 * 86400_000)),
      showAfterSeconds: p.showAfterSeconds ?? 8,
      frequency: (p.frequency as "session" | "daily" | "always") || "session",
      enabled: p.enabled ?? true,
    });
    setDialogOpen(true);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      // Validate before constructing the body so we throw clean errors
      // instead of letting Date(NaN).toISOString() raise a RangeError.
      const startsDate = new Date(form.startsAt);
      const endsDate = new Date(form.endsAt);
      if (Number.isNaN(startsDate.getTime()) || Number.isNaN(endsDate.getTime())) {
        throw new Error("Invalid start or end date.");
      }
      if (endsDate <= startsDate) {
        throw new Error("End date must be after start date.");
      }
      const delay = Math.max(0, Number(form.showAfterSeconds) || 0);
      const body = {
        title: form.title.trim(),
        message: form.message.trim(),
        couponCode: form.couponCode.trim() || null,
        ctaLabel: form.ctaLabel.trim() || "Shop Now",
        ctaUrl: form.ctaUrl.trim() || "/products",
        startsAt: startsDate.toISOString(),
        endsAt: endsDate.toISOString(),
        showAfterSeconds: delay,
        frequency: form.frequency,
        enabled: form.enabled,
      };
      const url = editing ? `/api/sales-popups/${editing.id}` : "/api/sales-popups";
      const res = await fetch(url, {
        method: editing ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(`Save failed (${res.status})`);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-popups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-popups/active"] });
      setDialogOpen(false);
      toast({ title: editing ? "Campaign Updated" : "Campaign Created", description: "Sales popup saved." });
    },
    onError: (e: any) => toast({ title: "Error", description: e?.message || "Failed to save.", variant: "destructive" }),
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: number; enabled: boolean }) => {
      const res = await fetch(`/api/sales-popups/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ enabled }),
      });
      if (!res.ok) throw new Error("Toggle failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-popups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-popups/active"] });
    },
    onError: () => toast({ title: "Error", description: "Failed to toggle.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sales-popups/${id}`, {
        method: "DELETE",
        headers: { "x-admin-token": adminToken },
      });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sales-popups"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sales-popups/active"] });
      toast({ title: "Campaign Deleted" });
    },
    onError: () => toast({ title: "Error", description: "Failed to delete.", variant: "destructive" }),
  });

  const statusOf = (p: SalesPopup): { label: string; cls: string } => {
    const now = Date.now();
    const start = new Date(p.startsAt).getTime();
    const end = new Date(p.endsAt).getTime();
    if (!p.enabled) return { label: "Disabled", cls: "bg-muted text-muted-foreground" };
    if (now < start) return { label: "Scheduled", cls: "bg-amber-100 text-amber-900" };
    if (now > end) return { label: "Expired", cls: "bg-muted text-muted-foreground" };
    return { label: "Active", cls: "bg-emerald-100 text-emerald-900" };
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-sales-popups">Sales FOMO Popups</h1>
          <p className="text-sm text-muted-foreground">Schedule promotional popups with countdown and coupon code.</p>
        </div>
        <Button onClick={openCreate} className="bg-primary text-white gap-2" data-testid="btn-new-sales-popup">
          <Plus className="w-4 h-4" /> New Campaign
        </Button>
      </div>

      {isLoading ? (
        <div className="space-y-3">{Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-md" />)}</div>
      ) : !popups?.length ? (
        <Card className="bg-card border-border">
          <CardContent className="py-12 text-center">
            <Megaphone className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">No sales campaigns yet. Create one to start showing promotional popups on the storefront.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {popups.map((p) => {
            const status = statusOf(p);
            return (
              <Card key={p.id} className="bg-card border-border" data-testid={`card-sales-popup-${p.id}`}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="space-y-1.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-serif text-lg text-primary truncate" data-testid={`text-popup-title-${p.id}`}>{p.title}</h3>
                        <Badge className={status.cls} data-testid={`badge-popup-status-${p.id}`}>{status.label}</Badge>
                        {p.couponCode && <Badge variant="outline" className="font-mono">{p.couponCode}</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{p.message}</p>
                      <div className="text-xs text-muted-foreground flex items-center gap-3 flex-wrap pt-1">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {new Date(p.startsAt).toLocaleString()} → {new Date(p.endsAt).toLocaleString()}</span>
                        <span>Frequency: {p.frequency}</span>
                        <span>Delay: {p.showAfterSeconds}s</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={p.enabled}
                          onCheckedChange={(checked) => toggleMutation.mutate({ id: p.id, enabled: checked })}
                          data-testid={`switch-popup-enabled-${p.id}`}
                        />
                        <span className="text-xs text-muted-foreground">{p.enabled ? "On" : "Off"}</span>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => openEdit(p)} data-testid={`btn-edit-popup-${p.id}`}>
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button size="sm" variant="outline" data-testid={`btn-delete-popup-${p.id}`}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete this campaign?</AlertDialogTitle>
                            <AlertDialogDescription>"{p.title}" will be removed permanently.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={() => deleteMutation.mutate(p.id)} className="bg-destructive text-destructive-foreground">Delete</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Campaign" : "New Sales Campaign"}</DialogTitle>
            <DialogDescription>Configure the popup that visitors will see on the storefront.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))} placeholder="Diwali Mega Sale" data-testid="input-popup-title" />
            </div>
            <div className="space-y-2">
              <Label>Message</Label>
              <Textarea rows={3} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Get 25% off on all puja samagri this festive season." data-testid="input-popup-message" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Coupon Code (optional)</Label>
                <Input value={form.couponCode} onChange={(e) => setForm((f) => ({ ...f, couponCode: e.target.value.toUpperCase() }))} placeholder="DIWALI25" data-testid="input-popup-coupon" />
              </div>
              <div className="space-y-2">
                <Label>Show after (seconds)</Label>
                <Input type="number" min={0} value={form.showAfterSeconds} onChange={(e) => setForm((f) => ({ ...f, showAfterSeconds: Number(e.target.value) }))} data-testid="input-popup-delay" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>CTA Label</Label>
                <Input value={form.ctaLabel} onChange={(e) => setForm((f) => ({ ...f, ctaLabel: e.target.value }))} placeholder="Shop Now" data-testid="input-popup-cta-label" />
              </div>
              <div className="space-y-2">
                <Label>CTA Link</Label>
                <Input value={form.ctaUrl} onChange={(e) => setForm((f) => ({ ...f, ctaUrl: e.target.value }))} placeholder="/products" data-testid="input-popup-cta-url" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Starts At</Label>
                <Input type="datetime-local" value={form.startsAt} onChange={(e) => setForm((f) => ({ ...f, startsAt: e.target.value }))} data-testid="input-popup-starts-at" />
              </div>
              <div className="space-y-2">
                <Label>Ends At</Label>
                <Input type="datetime-local" value={form.endsAt} onChange={(e) => setForm((f) => ({ ...f, endsAt: e.target.value }))} data-testid="input-popup-ends-at" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 items-end">
              <div className="space-y-2">
                <Label>Frequency</Label>
                <Select value={form.frequency} onValueChange={(v) => setForm((f) => ({ ...f, frequency: v as any }))}>
                  <SelectTrigger data-testid="select-popup-frequency"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="session">Once per session</SelectItem>
                    <SelectItem value="daily">Once per day</SelectItem>
                    <SelectItem value="always">Every visit</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3 pb-2">
                <Switch checked={form.enabled} onCheckedChange={(checked) => setForm((f) => ({ ...f, enabled: checked }))} data-testid="switch-popup-enabled" />
                <Label>Enabled</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending || !form.title.trim() || !form.message.trim()}
              className="bg-primary text-white"
              data-testid="btn-save-popup"
            >
              {saveMutation.isPending ? "Saving..." : editing ? "Save Changes" : "Create Campaign"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}


export default SalesPopupsTab;
