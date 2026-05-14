import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, CheckCircle, XCircle, Phone, Image, Type, Upload } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Pandit } from "@shared/schema";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

import { createFetcher } from "../admin-shared";

// ============================================================
// Pandits Tab
// ============================================================
function PanditsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingFeesId, setEditingFeesId] = useState<number | null>(null);
  const [editFees, setEditFees] = useState<number>(0);
  const [editingPandit, setEditingPandit] = useState<Pandit | null>(null);

  const { data: pandits, isLoading } = useQuery<Pandit[]>({
    queryKey: ["/api/pandits", "admin"],
    queryFn: () => fetcher("/api/pandits?all=true"),
  });

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const pandit = (pandits || []).find(p => p.id === id);
      const newVerified = !pandit?.verified;
      const res = await fetch(`/api/pandits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVerified }),
      });
      if (!res.ok) throw new Error("Update failed");
      return { ...await res.json(), newVerified };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/pandits", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: data.newVerified ? "Pandit Approved" : "Pandit Delisted", description: data.newVerified ? "Pandit is now live and visible." : "Pandit has been delisted from public view." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update pandit.", variant: "destructive" }),
  });

  const updateFeesMutation = useMutation({
    mutationFn: async ({ id, fees }: { id: number; fees: number }) => {
      const res = await fetch(`/api/pandits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fees }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pandits", "admin"] });
      toast({ title: "Fees Updated", description: "Pandit fees updated successfully." });
      setEditingFeesId(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to update fees.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pandits/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pandits", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Pandit Removed", description: "Pandit has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove pandit.", variant: "destructive" }),
  });

  const boostMutation = useMutation({
    mutationFn: async ({ id, boostType }: { id: number; boostType: "monthly" | "yearly" }) => {
      const res = await fetch(`/api/pandits/${id}/boost`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ boostType }) });
      if (!res.ok) throw new Error("Boost failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pandits", "admin"] });
      toast({ title: "Boost Activated", description: "Pandit profile is now boosted." });
    },
    onError: () => toast({ title: "Error", description: "Failed to activate boost.", variant: "destructive" }),
  });

  const deactivateBoostMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pandits/${id}/boost/deactivate`, { method: "POST" });
      if (!res.ok) throw new Error("Deactivate failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/pandits", "admin"] });
      toast({ title: "Boost Deactivated", description: "Pandit boost has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to deactivate boost.", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-pandits">Pandits</h1>
        <p className="text-sm text-muted-foreground">Manage pandit registrations, approvals & boosts</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {(pandits || []).map((pandit) => (
            <Card key={pandit.id} className="bg-card border-border" data-testid={`card-pandit-${pandit.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-serif font-bold text-lg shrink-0">
                    {pandit.name.charAt(0)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-primary">{pandit.name}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${pandit.verified ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`} data-testid={`status-pandit-${pandit.id}`}>
                        {pandit.verified ? "Verified" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{pandit.city} · {pandit.specialization}</p>
                    <p className="text-xs text-secondary">
                      {pandit.experience} yrs exp · {pandit.languages} · ⭐ {pandit.rating}
                      {pandit.boostActive && pandit.boostEndDate && new Date(pandit.boostEndDate) > new Date() && (
                        <span className="ml-2 bg-secondary/15 text-secondary px-2 py-0.5 rounded-full text-[10px] font-bold">BOOSTED ({pandit.boostType})</span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    {editingFeesId === pandit.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          value={editFees}
                          onChange={(e) => setEditFees(Number(e.target.value))}
                          className="w-24 h-8 text-sm"
                          data-testid={`input-edit-fees-${pandit.id}`}
                        />
                        <Button size="sm" className="bg-emerald-600 text-white" onClick={() => updateFeesMutation.mutate({ id: pandit.id, fees: editFees })} data-testid={`btn-save-fees-${pandit.id}`}>
                          Save
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingFeesId(null)} data-testid={`btn-cancel-fees-${pandit.id}`}>
                          Cancel
                        </Button>
                      </div>
                    ) : (
                      <div className="text-right">
                        <p className="font-bold text-foreground">₹{pandit.fees.toLocaleString()}</p>
                        <button onClick={() => { setEditingFeesId(pandit.id); setEditFees(pandit.fees); }} className="text-xs text-secondary hover:underline" data-testid={`btn-edit-fees-${pandit.id}`}>
                          Edit Fees
                        </button>
                      </div>
                    )}

                    {pandit.boostActive && pandit.boostEndDate && new Date(pandit.boostEndDate) > new Date() ? (
                      <Button size="sm" variant="outline" onClick={() => deactivateBoostMutation.mutate(pandit.id)} className="h-8 text-secondary border-secondary/30 text-xs gap-1" data-testid={`btn-deactivate-boost-${pandit.id}`}>
                        Remove Boost
                      </Button>
                    ) : (
                      <select
                        onChange={e => { if (e.target.value) { boostMutation.mutate({ id: pandit.id, boostType: e.target.value as "monthly" | "yearly" }); e.target.value = ""; } }}
                        className="h-8 text-xs rounded-md border border-secondary/30 bg-secondary/5 text-secondary px-2"
                        defaultValue=""
                        data-testid={`select-boost-${pandit.id}`}
                      >
                        <option value="" disabled>Boost</option>
                        <option value="monthly">Monthly ₹499</option>
                        <option value="yearly">Yearly ₹3,999</option>
                      </select>
                    )}

                    {pandit.verified && (
                      <Button size="sm" variant="outline" onClick={() => setEditingPandit(pandit)} className="h-8 text-primary border-primary/30 text-xs gap-1" data-testid={`btn-edit-pandit-${pandit.id}`}>
                        <Edit className="w-3 h-3" /> Edit
                      </Button>
                    )}

                    {pandit.verified ? (
                      <Button size="sm" variant="outline" onClick={() => approveMutation.mutate(pandit.id)} className="h-8 text-orange-600 border-orange-200 text-xs gap-1" data-testid={`btn-delist-pandit-${pandit.id}`}>
                        Delist
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => approveMutation.mutate(pandit.id)} className="bg-emerald-600 text-white h-8 gap-1 text-xs" data-testid={`btn-approve-pandit-${pandit.id}`}>
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(pandit.id)} className="h-8 text-red-500" data-testid={`btn-delete-pandit-${pandit.id}`}>
                      <XCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          {(pandits || []).length === 0 && (
            <p className="text-center text-muted-foreground py-8">No pandits registered.</p>
          )}
        </div>
      )}

      <EditPanditDialog
        pandit={editingPandit}
        onClose={() => setEditingPandit(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/pandits", "admin"] });
          queryClient.invalidateQueries({ queryKey: ["/api/pandits"] });
          setEditingPandit(null);
        }}
      />
    </div>
  );
}

// ============================================================
// Edit Pandit Dialog
// ============================================================
function EditPanditDialog({ pandit, onClose, onSaved }: { pandit: Pandit | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Pandit>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";

  const handlePhotoUpload = async (file: File) => {
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("images", file);
      const res = await fetch("/api/admin/upload-images", {
        method: "POST",
        headers: { "x-admin-token": adminToken },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Upload failed");
      const data = await res.json();
      const url = (data.urls as string[])[0];
      if (url) {
        setForm(prev => ({ ...prev, image: url }));
        toast({ title: "Photo Uploaded", description: "Photo uploaded successfully." });
      }
    } catch (err: any) {
      toast({ title: "Upload Failed", description: err.message, variant: "destructive" });
    }
    setUploadingPhoto(false);
  };

  useEffect(() => {
    if (pandit) {
      setForm({
        name: pandit.name,
        city: pandit.city,
        specialization: pandit.specialization,
        languages: pandit.languages,
        experience: pandit.experience,
        fees: pandit.fees,
        image: pandit.image ?? "",
        phone: pandit.phone ?? "",
        email: pandit.email ?? "",
        bio: pandit.bio ?? "",
        education: pandit.education ?? "",
        serviceArea: pandit.serviceArea ?? "",
        regionalOrigin: pandit.regionalOrigin ?? "",
        availability: pandit.availability ?? "available",
      });
    }
  }, [pandit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pandit) throw new Error("No pandit");
      const payload: Record<string, unknown> = {
        name: form.name,
        city: form.city,
        specialization: form.specialization,
        languages: form.languages,
        experience: Number(form.experience),
        fees: Number(form.fees),
        image: form.image || null,
        phone: form.phone || null,
        email: form.email || null,
        bio: form.bio || null,
        education: form.education || null,
        serviceArea: form.serviceArea || null,
        regionalOrigin: form.regionalOrigin || null,
        availability: form.availability || "available",
      };
      const res = await fetch(`/api/pandits/${pandit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || "Update failed");
      }
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Profile Updated", description: "Pandit profile has been updated." });
      onSaved();
    },
    onError: (e: Error) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const update = (k: keyof Pandit, v: any) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <Dialog open={!!pandit} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" data-testid="dialog-edit-pandit">
        <DialogHeader>
          <DialogTitle>Edit Pandit Profile</DialogTitle>
          <DialogDescription>Update the verified pandit's profile. Changes appear immediately in the directory.</DialogDescription>
        </DialogHeader>
        {pandit && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-2">
            <div className="md:col-span-2">
              <Label htmlFor="edit-pandit-name">Name</Label>
              <Input id="edit-pandit-name" value={form.name ?? ""} onChange={e => update("name", e.target.value)} data-testid="input-edit-pandit-name" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-city">City</Label>
              <Input id="edit-pandit-city" value={form.city ?? ""} onChange={e => update("city", e.target.value)} data-testid="input-edit-pandit-city" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-service-area">Service Area</Label>
              <Input id="edit-pandit-service-area" value={form.serviceArea ?? ""} onChange={e => update("serviceArea", e.target.value)} data-testid="input-edit-pandit-service-area" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-pandit-specialization">Specialization / Services</Label>
              <Input id="edit-pandit-specialization" value={form.specialization ?? ""} onChange={e => update("specialization", e.target.value)} data-testid="input-edit-pandit-specialization" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-languages">Languages</Label>
              <Input id="edit-pandit-languages" value={form.languages ?? ""} onChange={e => update("languages", e.target.value)} data-testid="input-edit-pandit-languages" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-regional-origin">Regional Origin</Label>
              <Input id="edit-pandit-regional-origin" value={form.regionalOrigin ?? ""} onChange={e => update("regionalOrigin", e.target.value)} data-testid="input-edit-pandit-regional-origin" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-experience">Experience (years)</Label>
              <Input id="edit-pandit-experience" type="number" value={form.experience ?? 0} onChange={e => update("experience", Number(e.target.value))} data-testid="input-edit-pandit-experience" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-fees">Fees (₹)</Label>
              <Input id="edit-pandit-fees" type="number" value={form.fees ?? 0} onChange={e => update("fees", Number(e.target.value))} data-testid="input-edit-pandit-fees" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-phone">Phone</Label>
              <Input id="edit-pandit-phone" value={form.phone ?? ""} onChange={e => update("phone", e.target.value)} data-testid="input-edit-pandit-phone" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-email">Email</Label>
              <Input id="edit-pandit-email" type="email" value={form.email ?? ""} onChange={e => update("email", e.target.value)} data-testid="input-edit-pandit-email" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label htmlFor="edit-pandit-image">Photo</Label>
              <div className="flex items-start gap-3">
                {form.image ? (
                  <img
                    src={form.image}
                    alt="Pandit preview"
                    className="w-20 h-20 rounded-md object-cover border border-border"
                    data-testid="img-edit-pandit-preview"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-md border border-dashed border-border flex items-center justify-center text-secondary" data-testid="placeholder-edit-pandit-preview">
                    <Image className="w-6 h-6" />
                  </div>
                )}
                <div className="flex-1 space-y-2">
                  <Input
                    id="edit-pandit-image"
                    value={form.image ?? ""}
                    onChange={e => update("image", e.target.value)}
                    placeholder="https://… or /uploads/…"
                    data-testid="input-edit-pandit-image"
                  />
                  <div className="flex items-center gap-2">
                    <input
                      id="edit-pandit-photo-file"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handlePhotoUpload(file);
                        e.target.value = "";
                      }}
                      data-testid="input-edit-pandit-photo-file"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={uploadingPhoto}
                      onClick={() => document.getElementById("edit-pandit-photo-file")?.click()}
                      data-testid="btn-upload-edit-pandit-photo"
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {uploadingPhoto ? "Uploading…" : "Upload Photo"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-pandit-education">Education</Label>
              <Input id="edit-pandit-education" value={form.education ?? ""} onChange={e => update("education", e.target.value)} data-testid="input-edit-pandit-education" />
            </div>
            <div className="md:col-span-2">
              <Label htmlFor="edit-pandit-bio">Bio</Label>
              <Textarea id="edit-pandit-bio" value={form.bio ?? ""} onChange={e => update("bio", e.target.value)} rows={4} data-testid="input-edit-pandit-bio" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-availability">Availability</Label>
              <Select value={form.availability ?? "available"} onValueChange={(v) => update("availability", v)}>
                <SelectTrigger id="edit-pandit-availability" data-testid="select-edit-pandit-availability">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="busy">Busy</SelectItem>
                  <SelectItem value="unavailable">Unavailable</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} data-testid="btn-cancel-edit-pandit">Cancel</Button>
          <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending} className="bg-primary text-white" data-testid="btn-save-edit-pandit">
            {saveMutation.isPending ? "Saving…" : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}


export default PanditsTab;
