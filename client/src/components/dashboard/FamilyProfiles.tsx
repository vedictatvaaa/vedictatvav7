import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Edit2, Trash2, Users2, Cake } from "lucide-react";
import { createFamily, deleteFamily, listFamily, updateFamily } from "@/lib/dashboardApi";
import type { FamilyMember } from "@shared/schema";

const RELATIONS = [
  { value: "self", label: "Self" },
  { value: "spouse", label: "Spouse" },
  { value: "son", label: "Son" },
  { value: "daughter", label: "Daughter" },
  { value: "father", label: "Father" },
  { value: "mother", label: "Mother" },
  { value: "sibling", label: "Sibling" },
  { value: "other", label: "Other" },
];

const RELATION_COLORS: Record<string, string> = {
  self: "bg-[#6D2B35]/10 text-[#6D2B35]",
  spouse: "bg-pink-100 text-pink-800",
  son: "bg-blue-100 text-blue-800",
  daughter: "bg-purple-100 text-purple-800",
  father: "bg-amber-100 text-amber-800",
  mother: "bg-rose-100 text-rose-800",
  sibling: "bg-emerald-100 text-emerald-800",
  other: "bg-stone-100 text-stone-700",
};

type FormState = {
  name: string;
  relation: string;
  gender: string;
  dateOfBirth: string;
  timeOfBirth: string;
  placeOfBirth: string;
  gotra: string;
  notes: string;
};

const blank = (): FormState => ({
  name: "", relation: "spouse", gender: "", dateOfBirth: "", timeOfBirth: "",
  placeOfBirth: "", gotra: "", notes: "",
});

export default function FamilyProfiles() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [items, setItems] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<FamilyMember | null>(null);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<FormState>(blank());
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<FamilyMember | null>(null);

  const refresh = async () => {
    if (!user?.id || !user?.email) return;
    try {
      setItems(await listFamily(user.id, user.email));
    } catch (e: any) {
      toast({ title: "Could not load family", description: e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  };

  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [user?.id]);

  const openCreate = () => { setEditing(null); setForm(blank()); setOpen(true); };
  const openEdit = (m: FamilyMember) => {
    setEditing(m);
    setForm({
      name: m.name, relation: m.relation, gender: m.gender || "",
      dateOfBirth: m.dateOfBirth || "", timeOfBirth: m.timeOfBirth || "",
      placeOfBirth: m.placeOfBirth || "", gotra: m.gotra || "", notes: m.notes || "",
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user?.id || !user?.email) return;
    if (!form.name.trim()) { toast({ title: "Name is required", variant: "destructive" }); return; }
    setBusy(true);
    try {
      const payload: any = {
        ...form,
        gender: form.gender || null,
        dateOfBirth: form.dateOfBirth || null,
        timeOfBirth: form.timeOfBirth || null,
        placeOfBirth: form.placeOfBirth || null,
        gotra: form.gotra || null,
        notes: form.notes || null,
      };
      if (editing) {
        await updateFamily(editing.id, user.id, payload, user.email);
        toast({ title: "Family member updated" });
      } else {
        await createFamily({ ...payload, userId: user.id }, user.email);
        toast({ title: "Family member added" });
      }
      setOpen(false);
      void refresh();
    } catch (e: any) {
      toast({ title: "Save failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(false); }
  };

  const remove = async () => {
    if (!confirmDelete || !user?.id || !user?.email) return;
    try {
      await deleteFamily(confirmDelete.id, user.id, user.email);
      toast({ title: "Removed" });
      setConfirmDelete(null);
      void refresh();
    } catch (e: any) {
      toast({ title: "Delete failed", description: e?.message, variant: "destructive" });
    }
  };

  if (!user) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <Users2 className="w-5 h-5 text-[#6D2B35]" />
          <h2 className="text-xl md:text-2xl font-serif font-bold text-[#4a1a22]">Family Profiles</h2>
        </div>
        <Button onClick={openCreate} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="button-add-family">
          <Plus className="w-4 h-4 mr-1.5" /> Add Member
        </Button>
      </div>
      <p className="text-xs text-[#5a4a3a]/65 -mt-2">
        Save birth details for your family once and reuse them for puja bookings, kundli reports, and pind daan.
      </p>

      {loading ? (
        <Card><CardContent className="p-10 text-center text-sm text-[#5a4a3a]/60">Loading…</CardContent></Card>
      ) : items.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Users2 className="w-10 h-10 mx-auto text-[#5a4a3a]/30 mb-2" />
            <p className="text-sm text-[#5a4a3a]/70">No family profiles yet. Add yourself, your spouse, parents or children to speed up future bookings.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((m) => (
            <Card key={m.id} className="hover-elevate" data-testid={`family-card-${m.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="font-serif font-semibold text-[#4a1a22] text-base truncate">{m.name}</h3>
                    <Badge className={`text-[10px] mt-1 ${RELATION_COLORS[m.relation] || RELATION_COLORS.other}`}>{m.relation}</Badge>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(m)} data-testid={`button-edit-family-${m.id}`}>
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(m)} data-testid={`button-delete-family-${m.id}`}>
                      <Trash2 className="w-4 h-4 text-rose-700" />
                    </Button>
                  </div>
                </div>
                <div className="text-xs text-[#5a4a3a]/75 mt-3 space-y-1">
                  {m.dateOfBirth && (
                    <div className="flex items-center gap-1.5">
                      <Cake className="w-3 h-3" />
                      {new Date(m.dateOfBirth).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}
                      {m.timeOfBirth && <span className="text-[#5a4a3a]/55">· {m.timeOfBirth}</span>}
                    </div>
                  )}
                  {m.placeOfBirth && <div className="truncate">📍 {m.placeOfBirth}</div>}
                  {m.gotra && <div>Gotra: <span className="font-medium">{m.gotra}</span></div>}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? "Edit family member" : "Add family member"}</DialogTitle></DialogHeader>
          <div className="grid gap-3 py-2">
            <div>
              <Label htmlFor="fm-name">Name *</Label>
              <Input id="fm-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="input-family-name" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Relation *</Label>
                <Select value={form.relation} onValueChange={(v) => setForm({ ...form, relation: v })}>
                  <SelectTrigger data-testid="select-family-relation"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {RELATIONS.map((r) => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={form.gender || "_unset"} onValueChange={(v) => setForm({ ...form, gender: v === "_unset" ? "" : v })}>
                  <SelectTrigger data-testid="select-family-gender"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_unset">—</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="fm-dob">Date of birth</Label>
                <Input id="fm-dob" type="date" value={form.dateOfBirth} onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })} data-testid="input-family-dob" />
              </div>
              <div>
                <Label htmlFor="fm-tob">Time of birth</Label>
                <Input id="fm-tob" type="time" value={form.timeOfBirth} onChange={(e) => setForm({ ...form, timeOfBirth: e.target.value })} data-testid="input-family-tob" />
              </div>
            </div>
            <div>
              <Label htmlFor="fm-pob">Place of birth</Label>
              <Input id="fm-pob" value={form.placeOfBirth} onChange={(e) => setForm({ ...form, placeOfBirth: e.target.value })} placeholder="City, State" data-testid="input-family-pob" />
            </div>
            <div>
              <Label htmlFor="fm-gotra">Gotra</Label>
              <Input id="fm-gotra" value={form.gotra} onChange={(e) => setForm({ ...form, gotra: e.target.value })} data-testid="input-family-gotra" />
            </div>
            <div>
              <Label htmlFor="fm-notes">Notes</Label>
              <Textarea id="fm-notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} data-testid="input-family-notes" />
            </div>
          </div>
          <DialogFooter className="flex flex-row gap-2 justify-end">
            <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-family">Cancel</Button>
            <Button onClick={save} disabled={busy} className="bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37]" data-testid="button-save-family">
              {busy ? "Saving…" : editing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <AlertDialog open={!!confirmDelete} onOpenChange={(o) => !o && setConfirmDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {confirmDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently delete this family profile.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-confirm-cancel">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={remove} className="bg-rose-700 hover:bg-rose-800" data-testid="button-confirm-delete">Remove</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
