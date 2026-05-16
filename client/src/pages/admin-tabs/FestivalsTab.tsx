import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Calendar, Bell, Sparkles } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import type { Festival } from "@shared/schema";

import { createFetcher } from "../admin-shared";

const SEED: Array<Partial<Festival>> = [
  { name: "Diwali", slug: "diwali", date: "2026-11-08", importance: "high",
    description: "Festival of lights — Lakshmi puja, lamps, fireworks.",
    preparationNotes: "Order diyas, rangoli colours, Lakshmi-Ganesh idols, sweets ingredients. Book pandit early." },
  { name: "Holi", slug: "holi", date: "2027-03-22", importance: "high",
    description: "Festival of colours marking the arrival of spring.",
    preparationNotes: "Stock organic gulal, sweets, white clothes. Holika Dahan samagri." },
  { name: "Janmashtami", slug: "janmashtami", date: "2026-09-04", importance: "high",
    description: "Birth of Lord Krishna — fasting, midnight puja.",
    preparationNotes: "Krishna idol, jhula, makhan-mishri, fasting samagri." },
  { name: "Navratri", slug: "navratri-sharad", date: "2026-10-11", importance: "high",
    description: "Nine nights of Devi worship.",
    preparationNotes: "Kalash, akhand jyoti supplies, Durga Saptashati, fasting items." },
  { name: "Maha Shivratri", slug: "maha-shivratri", date: "2027-02-26", importance: "high",
    description: "Night-long worship of Lord Shiva.",
    preparationNotes: "Bilva patra, panchamrit, rudraksha, Shiva Tandava Stotram." },
  { name: "Ganesh Chaturthi", slug: "ganesh-chaturthi", date: "2026-08-26", importance: "high",
    description: "Birth of Lord Ganesha — 10 days of celebration.",
    preparationNotes: "Eco-friendly Ganesh idol, modak ingredients, durva grass." },
];

function FestivalsTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState<any>({
    name: "", slug: "", date: "", description: "", preparationNotes: "",
    importance: "medium", notifyUsers: true, notifyPandits: true, isActive: true,
  });

  const { data, isLoading } = useQuery<Festival[]>({
    queryKey: ["/api/admin/festivals"],
    queryFn: () => fetcher("/api/admin/festivals"),
  });

  const adminFetch = (url: string, init: RequestInit = {}) =>
    fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        "x-admin-token": adminToken,
        ...(init.headers || {}),
      },
    }).then(async (r) => { if (!r.ok) throw new Error(await r.text()); return r.json(); });

  const create = useMutation({
    mutationFn: (body: any) => adminFetch("/api/admin/festivals", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/festivals"] });
      setOpen(false);
      setDraft({ name: "", slug: "", date: "", description: "", preparationNotes: "",
                importance: "medium", notifyUsers: true, notifyPandits: true, isActive: true });
      toast({ title: "Festival added" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const update = useMutation({
    mutationFn: ({ id, body }: { id: number; body: any }) =>
      adminFetch(`/api/admin/festivals/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/admin/festivals"] }),
  });

  const remove = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/festivals/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/festivals"] });
      toast({ title: "Removed" });
    },
  });

  const seedAll = async () => {
    for (const f of SEED) {
      try { await create.mutateAsync(f); } catch {/* skip dupes */}
    }
    toast({ title: "Seeded popular festivals" });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Calendar className="h-6 w-6 text-primary" /> Festival Reminders
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Users and pandits get an email exactly 7 days before each festival. Idempotent — never duplicated.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={seedAll} data-testid="button-seed-festivals">
            <Sparkles className="h-4 w-4 mr-2" /> Seed Popular
          </Button>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button data-testid="button-add-festival"><Plus className="h-4 w-4 mr-2" /> Add Festival</Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader><DialogTitle>New festival</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div><Label>Name</Label>
                  <Input data-testid="input-festival-name" value={draft.name}
                    onChange={(e) => setDraft({ ...draft, name: e.target.value,
                      slug: draft.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") })} />
                </div>
                <div><Label>Slug</Label>
                  <Input data-testid="input-festival-slug" value={draft.slug}
                    onChange={(e) => setDraft({ ...draft, slug: e.target.value })} />
                </div>
                <div><Label>Date (YYYY-MM-DD)</Label>
                  <Input data-testid="input-festival-date" type="date" value={draft.date}
                    onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
                </div>
                <div><Label>Description</Label>
                  <Textarea data-testid="input-festival-desc" rows={2} value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })} />
                </div>
                <div><Label>Preparation notes</Label>
                  <Textarea data-testid="input-festival-prep" rows={3} value={draft.preparationNotes}
                    onChange={(e) => setDraft({ ...draft, preparationNotes: e.target.value })} />
                </div>
                <div><Label>Importance</Label>
                  <Select value={draft.importance} onValueChange={(v) => setDraft({ ...draft, importance: v })}>
                    <SelectTrigger data-testid="select-festival-importance"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notify users</Label>
                  <Switch checked={draft.notifyUsers}
                    onCheckedChange={(v) => setDraft({ ...draft, notifyUsers: v })} />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Notify pandits</Label>
                  <Switch checked={draft.notifyPandits}
                    onCheckedChange={(v) => setDraft({ ...draft, notifyPandits: v })} />
                </div>
              </div>
              <DialogFooter>
                <Button data-testid="button-save-festival"
                  onClick={() => create.mutate(draft)}
                  disabled={!draft.name || !draft.slug || !draft.date || create.isPending}>
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}</div>
      ) : !data || data.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">
          No festivals yet. Click <strong>Seed Popular</strong> to add the major ones, or add manually.
        </CardContent></Card>
      ) : (
        <div className="space-y-2">
          {data.map((f) => {
            const daysOut = Math.ceil((new Date(f.date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
            return (
              <Card key={f.id} data-testid={`card-festival-${f.id}`}>
                <CardContent className="p-4 flex items-center gap-4 flex-wrap">
                  <div className="flex-1 min-w-[200px]">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold">{f.name}</h3>
                      <Badge variant="outline">{f.date}</Badge>
                      {daysOut >= 0 && daysOut <= 14 && (
                        <Badge className="bg-amber-100 text-amber-900">in {daysOut}d</Badge>
                      )}
                      {f.importance === "high" && <Badge className="bg-primary/10 text-primary">high</Badge>}
                    </div>
                    {f.description && <p className="text-sm text-muted-foreground mt-1">{f.description}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Bell className="h-4 w-4 text-muted-foreground" />
                      <Label className="text-xs">Active</Label>
                      <Switch checked={f.isActive}
                        onCheckedChange={(v) => update.mutate({ id: f.id, body: { isActive: v } })} />
                    </div>
                    <Button size="icon" variant="ghost" data-testid={`button-delete-festival-${f.id}`}
                      onClick={() => { if (confirm(`Delete ${f.name}?`)) remove.mutate(f.id); }}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default FestivalsTab;
