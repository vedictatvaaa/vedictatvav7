import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Type, Tag } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Order, Coupon } from "@shared/schema";

import { createFetcher } from "../admin-shared";

function CouponsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: coupons } = useQuery<Coupon[]>({ queryKey: ["/api/coupons"], queryFn: () => fetcher("/api/coupons") });
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: "", description: "", type: "percentage", value: 10, minOrderAmount: 0, maxDiscount: 0, maxUses: 0, active: true });

  const createMut = useMutation({
    mutationFn: (data: any) => fetch("/api/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coupons"] }); toast({ title: "Coupon created" }); setShowForm(false); setForm({ code: "", description: "", type: "percentage", value: 10, minOrderAmount: 0, maxDiscount: 0, maxUses: 0, active: true }); },
    onError: () => toast({ title: "Error creating coupon", variant: "destructive" }),
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/coupons/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coupons"] }); toast({ title: "Coupon deleted" }); },
  });

  const toggleMut = useMutation({
    mutationFn: ({ id, active }: { id: number; active: boolean }) => fetch(`/api/coupons/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ active }) }).then(r => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/coupons"] }); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-serif text-primary" data-testid="text-coupons-title">Coupons & Discounts</h2>
          <p className="text-sm text-muted-foreground">Manage discount codes for your customers</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} className="bg-primary text-white gap-2" data-testid="btn-add-coupon">
          <Plus className="h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardContent className="pt-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Coupon Code *</Label>
                <Input value={form.code} onChange={(e) => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g., SAVE20" className="uppercase" data-testid="input-coupon-code-admin" />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input value={form.description} onChange={(e) => setForm(p => ({ ...p, description: e.target.value }))} placeholder="20% off on all orders" data-testid="input-coupon-desc" />
              </div>
              <div className="space-y-2">
                <Label>Discount Type</Label>
                <Select value={form.type} onValueChange={(v) => setForm(p => ({ ...p, type: v }))}>
                  <SelectTrigger data-testid="select-coupon-type"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage (%)</SelectItem>
                    <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Discount Value *</Label>
                <Input type="number" value={form.value} onChange={(e) => setForm(p => ({ ...p, value: Number(e.target.value) }))} data-testid="input-coupon-value" />
              </div>
              <div className="space-y-2">
                <Label>Min. Order Amount (₹)</Label>
                <Input type="number" value={form.minOrderAmount} onChange={(e) => setForm(p => ({ ...p, minOrderAmount: Number(e.target.value) }))} data-testid="input-coupon-min" />
              </div>
              <div className="space-y-2">
                <Label>Max Discount (₹) {form.type === "percentage" ? "(cap)" : "(ignored)"}</Label>
                <Input type="number" value={form.maxDiscount} onChange={(e) => setForm(p => ({ ...p, maxDiscount: Number(e.target.value) }))} data-testid="input-coupon-max-discount" />
              </div>
              <div className="space-y-2">
                <Label>Max Uses (0 = unlimited)</Label>
                <Input type="number" value={form.maxUses} onChange={(e) => setForm(p => ({ ...p, maxUses: Number(e.target.value) }))} data-testid="input-coupon-max-uses" />
              </div>
            </div>
            <div className="flex gap-3">
              <Button onClick={() => createMut.mutate({ ...form, code: form.code.trim(), maxDiscount: form.maxDiscount || null, maxUses: form.maxUses || null })} disabled={createMut.isPending || !form.code.trim()} className="bg-primary text-white" data-testid="btn-save-coupon">
                {createMut.isPending ? "Creating..." : "Create Coupon"}
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-3">
        {(!coupons || coupons.length === 0) && (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No coupons created yet. Click "Add Coupon" to get started.</CardContent></Card>
        )}
        {coupons?.map((coupon) => (
          <Card key={coupon.id} className={`${!coupon.active ? "opacity-60" : ""}`} data-testid={`coupon-card-${coupon.id}`}>
            <CardContent className="py-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-primary text-lg">{coupon.code}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.active ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                      {coupon.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">{coupon.description || (coupon.type === "percentage" ? `${coupon.value}% off` : `₹${coupon.value} off`)}</p>
                  <p className="text-xs text-muted-foreground/60">
                    Min: ₹{coupon.minOrderAmount} | Used: {coupon.usedCount}{coupon.maxUses ? `/${coupon.maxUses}` : ""} times
                    {coupon.maxDiscount ? ` | Max discount: ₹${coupon.maxDiscount}` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={coupon.active} onCheckedChange={(checked) => toggleMut.mutate({ id: coupon.id, active: checked })} data-testid={`toggle-coupon-${coupon.id}`} />
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => deleteMut.mutate(coupon.id)} data-testid={`btn-delete-coupon-${coupon.id}`}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}


export default CouponsTab;
