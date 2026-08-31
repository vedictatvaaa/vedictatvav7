import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Edit, Eye, CheckCircle, XCircle, Image, Upload, MapPin, MapPinOff, LocateFixed, Crown } from "lucide-react";

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
// Geocode helper — uses OpenStreetMap Nominatim (free, no key)
// ============================================================
async function geocodeCity(city: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const q = encodeURIComponent(`${city}, India`);
    const res = await fetch(
      `https://nominatim.openstreetmap.org/search?q=${q}&format=json&limit=1&addressdetails=0`,
      { headers: { "Accept-Language": "en" } }
    );
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
  } catch {
    return null;
  }
}

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
  const [viewingPandit, setViewingPandit] = useState<Pandit | null>(null);
  const [search, setSearch] = useState(""); const [stateFilter, setStateFilter] = useState(""); const [cityFilter, setCityFilter] = useState(""); const [verificationFilter, setVerificationFilter] = useState("all"); const [availabilityFilter, setAvailabilityFilter] = useState("all"); const [activeFilter, setActiveFilter] = useState("all"); const [qualityFilter, setQualityFilter] = useState("all");
  const [geocodingId, setGeocodingId] = useState<number | null>(null);
  const [bulkGeocoding, setBulkGeocoding] = useState(false);
  const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number; failed: number } | null>(null);

  const { data: pandits, isLoading } = useQuery<Pandit[]>({
    queryKey: ["/api/book-pandit-online", "admin"],
    queryFn: () => fetcher("/api/book-pandit-online?all=true"),
  });
  const { data: locations = [] } = useQuery<Array<{id:number;name:string;isActive:boolean;cities:Array<{id:number;name:string;isActive:boolean}>}>>({ queryKey:["/api/admin/locations"], queryFn:()=>fetcher("/api/admin/locations") });
  type DiscoveryHealth = { total:number; verified:number; active:number; publiclyDiscoverable:number; missingState:number; missingCity:number; locationIssues:number; missingProfileData:number; issuePanditIds:number[] };
  const { data: health } = useQuery<DiscoveryHealth>({ queryKey:["/api/admin/pandit-discovery/health"], queryFn:()=>fetcher("/api/admin/pandit-discovery/health") });
  const issueIds = new Set(health?.issuePanditIds || []);
  const visiblePandits = (pandits || []).filter((p:any) => (!search || `${p.name} ${p.city} ${p.specialization}`.toLowerCase().includes(search.toLowerCase())) && (!stateFilter || stateFilter === "all" || String(p.stateId) === stateFilter) && (!cityFilter || cityFilter === "all" || String(p.cityId) === cityFilter) && (verificationFilter === "all" || String(!!p.verified) === verificationFilter) && (availabilityFilter === "all" || p.availability === availabilityFilter) && (activeFilter === "all" || String(!p.onLeave) === activeFilter) && (qualityFilter === "all" || (qualityFilter === "issues" ? issueIds.has(p.id) : !issueIds.has(p.id))));

  const approveMutation = useMutation({
    mutationFn: async (id: number) => {
      const pandit = (pandits || []).find(p => p.id === id);
      const newVerified = !pandit?.verified;
      const res = await fetch(`/api/pandits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ verified: newVerified }),
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({}));
        throw new Error(error.message || "Update failed");
      }
      return { ...await res.json(), newVerified };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-discovery/health"] });
      toast({ title: data.newVerified ? "Pandit Approved" : "Pandit Delisted", description: data.newVerified ? "Pandit is now live and visible." : "Pandit has been delisted from public view." });
    },
    onError: (error: Error) => toast({ title: "Pandit not updated", description: error.message, variant: "destructive" }),
  });

  const updateFeesMutation = useMutation({
    mutationFn: async ({ id, fees }: { id: number; fees: number }) => {
      const res = await fetch(`/api/pandits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ fees }),
      });
      if (!res.ok) throw new Error("Update failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      toast({ title: "Fees Updated", description: "Pandit fees updated successfully." });
      setEditingFeesId(null);
    },
    onError: () => toast({ title: "Error", description: "Failed to update fees.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pandits/${id}`, { method: "DELETE", headers: { "x-admin-token": adminToken } });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/stats"] });
      toast({ title: "Pandit Removed", description: "Pandit has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove pandit.", variant: "destructive" }),
  });

  const boostMutation = useMutation({
    mutationFn: async ({ id, boostType }: { id: number; boostType: "monthly" | "yearly" }) => {
      const res = await fetch(`/api/pandits/${id}/boost`, { method: "POST", headers: { "Content-Type": "application/json", "x-admin-token": adminToken }, body: JSON.stringify({ boostType }) });
      if (!res.ok) throw new Error("Boost failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      toast({ title: "Boost Activated", description: "Pandit profile is now boosted." });
    },
    onError: () => toast({ title: "Error", description: "Failed to activate boost.", variant: "destructive" }),
  });

  const deactivateBoostMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/pandits/${id}/boost/deactivate`, { method: "POST", headers: { "x-admin-token": adminToken } });
      if (!res.ok) throw new Error("Deactivate failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      toast({ title: "Boost Deactivated", description: "Pandit boost has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to deactivate boost.", variant: "destructive" }),
  });

  const setLocationMutation = useMutation({
    mutationFn: async (id: number) => {
      const pandit = (pandits || []).find(p => p.id === id);
      if (!pandit) throw new Error("Pandit not found");
      setGeocodingId(id);
      const coords = await geocodeCity(pandit.city);
      if (!coords) throw new Error(`Could not find coordinates for "${pandit.city}"`);
      const res = await fetch(`/api/pandits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }),
      });
      if (!res.ok) throw new Error("Save failed");
      return { pandit: await res.json(), coords };
    },
    onSuccess: ({ coords }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      toast({
        title: "Location Set ✓",
        description: `Coordinates saved: ${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`,
      });
      setGeocodingId(null);
    },
    onError: (e: Error) => {
      toast({ title: "Location Failed", description: e.message, variant: "destructive" });
      setGeocodingId(null);
    },
  });

  const TIER_META: Record<string, { label: string; color: string }> = {
    free:       { label: "Free",       color: "bg-stone-100 text-stone-600" },
    silver:     { label: "Silver",     color: "bg-slate-100 text-slate-600" },
    gold:       { label: "Gold",       color: "bg-yellow-100 text-yellow-700" },
    guru_elite: { label: "Guru Elite", color: "bg-purple-100 text-purple-700" },
  };

  const upgradeTierMutation = useMutation({
    mutationFn: async ({ id, tier }: { id: number; tier: string }) => {
      const res = await fetch(`/api/pandits/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
        // null tierExpiresAt = permanent admin grant (no subscription expiry)
        body: JSON.stringify({ tier, tierExpiresAt: null }),
      });
      if (!res.ok) throw new Error("Update failed");
      return { pandit: await res.json(), tier };
    },
    onSuccess: ({ tier }) => {
      queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
      const meta = TIER_META[tier] ?? { label: tier };
      toast({ title: `Tier Updated`, description: `Pandit upgraded to ${meta.label} tier.` });
    },
    onError: () => toast({ title: "Error", description: "Failed to update tier.", variant: "destructive" }),
  });

  const handleBulkSetLocations = async () => {
    const missing = (pandits || []).filter(p => p.latitude == null || p.longitude == null);
    if (!missing.length) {
      toast({ title: "All set!", description: "Every pandit already has GPS coordinates." });
      return;
    }
    setBulkGeocoding(true);
    setBulkProgress({ done: 0, total: missing.length, failed: 0 });
    let done = 0;
    let failed = 0;
    for (const pandit of missing) {
      const coords = await geocodeCity(pandit.city);
      if (coords) {
        try {
          await fetch(`/api/pandits/${pandit.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
            body: JSON.stringify({ latitude: coords.lat, longitude: coords.lng }),
          });
          done++;
        } catch {
          failed++;
        }
      } else {
        failed++;
      }
      setBulkProgress({ done: done + failed, total: missing.length, failed });
      // Nominatim rate limit: 1 req/sec
      await new Promise(r => setTimeout(r, 1100));
    }
    await queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
    setBulkGeocoding(false);
    setBulkProgress(null);
    toast({
      title: `Bulk Location Done`,
      description: `${done} pandits located${failed ? `, ${failed} could not be found` : ""}.`,
      variant: failed && !done ? "destructive" : "default",
    });
  };

  const noGpsCount = (pandits || []).filter(p => p.latitude == null || p.longitude == null).length;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-pandits">Pandits</h1>
          <p className="text-sm text-muted-foreground">Manage profiles, publishing eligibility, locations and discovery health.</p>
        </div>
        {noGpsCount > 0 && (
          <Button
            variant="outline"
            size="sm"
            disabled={bulkGeocoding}
            onClick={handleBulkSetLocations}
            className="shrink-0 gap-2 border-amber-300 text-amber-700 hover:bg-amber-50"
            data-testid="btn-bulk-set-locations"
          >
            <LocateFixed className={`w-4 h-4 ${bulkGeocoding ? "animate-spin" : ""}`} />
            {bulkGeocoding && bulkProgress
              ? `Locating… ${bulkProgress.done}/${bulkProgress.total}`
              : `Set All Locations (${noGpsCount} missing)`}
          </Button>
        )}
      </div>
      {health && <Card><CardContent className="p-4">
        <div className="mb-3"><h2 className="font-serif text-xl text-primary">Pandit Discovery Health</h2><p className="text-xs text-muted-foreground">Admin-controlled data that determines public marketplace visibility.</p></div>
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
          {[
            ["Verified", health.verified],
            ["Active", health.active],
            ["Discoverable", health.publiclyDiscoverable],
            ["Missing State", health.missingState],
            ["Missing City", health.missingCity],
            ["Location Issues", health.locationIssues],
            ["Missing Profile Data", health.missingProfileData],
            ["Total", health.total],
          ].map(([label, value]) => <div key={String(label)} className="rounded-lg border bg-muted/20 p-3"><div className="text-xl font-semibold text-primary">{value}</div><div className="text-xs text-muted-foreground">{label}</div></div>)}
        </div>
      </CardContent></Card>}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-7 gap-2">
        <Input placeholder="Search pandits…" value={search} onChange={e=>setSearch(e.target.value)} />
        <Select value={stateFilter} onValueChange={v=>{setStateFilter(v);setCityFilter("");}}><SelectTrigger><SelectValue placeholder="All states"/></SelectTrigger><SelectContent><SelectItem value="all">All states</SelectItem>{locations.map(s=><SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent></Select>
        <Select value={cityFilter} onValueChange={setCityFilter} disabled={!stateFilter || stateFilter === "all"}><SelectTrigger><SelectValue placeholder={stateFilter && stateFilter !== "all" ? "All cities" : "Select state first"}/></SelectTrigger><SelectContent><SelectItem value="all">All cities</SelectItem>{locations.find(s=>String(s.id)===stateFilter)?.cities.map(c=><SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select>
        <Select value={verificationFilter} onValueChange={setVerificationFilter}><SelectTrigger><SelectValue placeholder="Verification"/></SelectTrigger><SelectContent><SelectItem value="all">All verification</SelectItem><SelectItem value="true">Verified</SelectItem><SelectItem value="false">Pending</SelectItem></SelectContent></Select>
        <Select value={activeFilter} onValueChange={setActiveFilter}><SelectTrigger><SelectValue placeholder="Listing status"/></SelectTrigger><SelectContent><SelectItem value="all">All listing status</SelectItem><SelectItem value="true">Active</SelectItem><SelectItem value="false">On leave</SelectItem></SelectContent></Select>
        <Select value={availabilityFilter} onValueChange={setAvailabilityFilter}><SelectTrigger><SelectValue placeholder="Availability"/></SelectTrigger><SelectContent><SelectItem value="all">All availability</SelectItem><SelectItem value="available">Available</SelectItem><SelectItem value="busy">Busy</SelectItem><SelectItem value="unavailable">Unavailable</SelectItem></SelectContent></Select>
        <Select value={qualityFilter} onValueChange={setQualityFilter}><SelectTrigger><SelectValue placeholder="Data quality"/></SelectTrigger><SelectContent><SelectItem value="all">All data quality</SelectItem><SelectItem value="issues">Needs review</SelectItem><SelectItem value="clean">No detected issues</SelectItem></SelectContent></Select>
      </div>
      {bulkGeocoding && bulkProgress && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 flex items-center gap-3">
          <LocateFixed className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
          <div className="flex-1">
            <div className="text-sm font-medium text-amber-800">
              Geocoding pandits… {bulkProgress.done} of {bulkProgress.total} done
              {bulkProgress.failed > 0 && <span className="text-red-600 ml-1">· {bulkProgress.failed} failed</span>}
            </div>
            <div className="mt-1.5 h-1.5 bg-amber-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full transition-all duration-500"
                style={{ width: `${(bulkProgress.done / bulkProgress.total) * 100}%` }}
              />
            </div>
          </div>
          <span className="text-xs text-amber-600 shrink-0">{Math.round((bulkProgress.done / bulkProgress.total) * 100)}%</span>
        </div>
      )}

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (
        <div className="space-y-3">
          {visiblePandits.map((pandit) => {
            const hasGps = pandit.latitude != null && pandit.longitude != null;
            const isGeocoding = geocodingId === pandit.id;
            return (
              <Card key={pandit.id} className="bg-card border-border" data-testid={`card-pandit-${pandit.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary font-serif font-bold text-lg shrink-0">
                      {pandit.name.charAt(0)}
                    </div>
                    <div className="flex-grow min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-medium text-primary">{pandit.name}</h3>
                        <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${pandit.verified ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`} data-testid={`status-pandit-${pandit.id}`}>
                          {pandit.verified ? "Verified" : "Pending"}
                        </span>
                        {(() => {
                          const effectiveTier = (pandit.tier || "free").toLowerCase();
                          const meta = TIER_META[effectiveTier] ?? TIER_META.free;
                          const expired = pandit.tierExpiresAt && new Date(pandit.tierExpiresAt as any) < new Date();
                          return (
                            <span className={`text-[10px] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold ${expired ? "bg-red-100 text-red-600" : meta.color}`}>
                              <Crown className="w-2.5 h-2.5" />
                              {meta.label}{expired ? " (expired)" : ""}
                            </span>
                          );
                        })()}
                        {hasGps ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-sky-100 text-sky-700 flex items-center gap-1" title={`${(pandit.latitude as number).toFixed(4)}, ${(pandit.longitude as number).toFixed(4)}`}>
                            <MapPin className="w-2.5 h-2.5" /> GPS set
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                            <MapPinOff className="w-2.5 h-2.5" /> No GPS
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">{(pandit as any).state ? `${(pandit as any).state} · ` : ""}{pandit.city} · {pandit.specialization} · {(pandit as any).regionalOrigin || "Tradition not set"}</p>
                      <p className="text-xs text-secondary">
                        {pandit.experience} yrs exp · {pandit.languages} · ⭐ {pandit.rating} · {pandit.availability || "available"}
                        {pandit.boostActive && pandit.boostEndDate && new Date(pandit.boostEndDate) > new Date() && (
                          <span className="ml-2 bg-secondary/15 text-secondary px-2 py-0.5 rounded-full text-[10px] font-bold">BOOSTED ({pandit.boostType})</span>
                        )}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
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

                      <select
                        value={pandit.tier || "free"}
                        onChange={e => upgradeTierMutation.mutate({ id: pandit.id, tier: e.target.value })}
                        disabled={upgradeTierMutation.isPending}
                        className={`h-8 text-xs rounded-md border px-2 font-semibold cursor-pointer ${
                          (pandit.tier || "free") === "guru_elite" ? "border-purple-300 bg-purple-50 text-purple-700" :
                          (pandit.tier || "free") === "gold"       ? "border-yellow-300 bg-yellow-50 text-yellow-700" :
                          (pandit.tier || "free") === "silver"     ? "border-slate-300 bg-slate-50 text-slate-600" :
                                                                      "border-stone-200 bg-stone-50 text-stone-600"
                        }`}
                        data-testid={`select-tier-${pandit.id}`}
                      >
                        <option value="free">Free</option>
                        <option value="silver">Silver</option>
                        <option value="gold">Gold</option>
                        <option value="guru_elite">Guru Elite</option>
                      </select>

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

                      <Button
                        size="sm"
                        variant="outline"
                        disabled={isGeocoding}
                        onClick={() => setLocationMutation.mutate(pandit.id)}
                        className={`h-8 text-xs gap-1 ${hasGps ? "text-sky-600 border-sky-200" : "text-amber-600 border-amber-300"}`}
                        title={hasGps ? `GPS: ${(pandit.latitude as number).toFixed(4)}, ${(pandit.longitude as number).toFixed(4)} — click to refresh` : "Auto-detect coordinates from city"}
                        data-testid={`btn-set-location-${pandit.id}`}
                      >
                        <LocateFixed className={`w-3 h-3 ${isGeocoding ? "animate-spin" : ""}`} />
                        {isGeocoding ? "Locating…" : hasGps ? "Re-locate" : "Set Location"}
                      </Button>

                      {(pandit as any).locationReviewStatus === "needs_review" && <span className="text-xs font-medium text-amber-700">⚠ Location needs review</span>}
                      <Button size="sm" variant="outline" onClick={() => setViewingPandit(pandit)} className="h-8 text-xs gap-1"><Eye className="w-3 h-3"/> View</Button>
                      <Button size="sm" variant="outline" onClick={() => setEditingPandit(pandit)} className="h-8 text-primary border-primary/30 text-xs gap-1" data-testid={`btn-edit-pandit-${pandit.id}`}>
                          <Edit className="w-3 h-3" /> Edit
                        </Button>

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
            );
          })}
          {visiblePandits.length === 0 && (
            <p className="text-center text-muted-foreground py-8">{(pandits || []).length ? "No pandits match these filters." : "No pandits registered."}</p>
          )}
        </div>
      )}

      <EditPanditDialog
        pandit={editingPandit}
        onClose={() => setEditingPandit(null)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online", "admin"] });
          queryClient.invalidateQueries({ queryKey: ["/api/book-pandit-online"] });
          queryClient.invalidateQueries({ queryKey: ["/api/admin/pandit-discovery/health"] });
          setEditingPandit(null);
        }}
      />
      <Dialog open={!!viewingPandit} onOpenChange={o=>!o&&setViewingPandit(null)}><DialogContent><DialogHeader><DialogTitle>{viewingPandit?.name}</DialogTitle><DialogDescription>Read-only profile details</DialogDescription></DialogHeader>{viewingPandit && <div className="space-y-2 text-sm"><p>{(viewingPandit as any).state} · {viewingPandit.city}</p><p>{viewingPandit.specialization}</p><p>{viewingPandit.experience} years experience · {viewingPandit.availability}</p><p>{viewingPandit.bio}</p></div>}</DialogContent></Dialog>
    </div>
  );
}

// ============================================================
// Edit Pandit Dialog
// ============================================================
function EditPanditDialog({ pandit, onClose, onSaved }: { pandit: Pandit | null; onClose: () => void; onSaved: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState<Partial<Pandit & { latitude: number | null; longitude: number | null; stateId: number | null; cityId: number | null }>>({});
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const { data: locations = [] } = useQuery<Array<{id:number;name:string;isActive:boolean;cities:Array<{id:number;name:string;isActive:boolean}>}>>({ queryKey:["/api/admin/locations"], queryFn:()=>createFetcher(adminToken)("/api/admin/locations") });

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

  const handleAutoDetectLocation = async () => {
    const city = form.city || pandit?.city;
    if (!city) {
      toast({ title: "No City", description: "Enter a city name first.", variant: "destructive" });
      return;
    }
    setGeocoding(true);
    const coords = await geocodeCity(city);
    setGeocoding(false);
    if (!coords) {
      toast({ title: "Not Found", description: `Could not find coordinates for "${city}". Try a more specific city name.`, variant: "destructive" });
      return;
    }
    setForm(prev => ({ ...prev, latitude: coords.lat, longitude: coords.lng }));
    toast({ title: "Location Found", description: `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)} — save to apply.` });
  };

  useEffect(() => {
    if (pandit) {
      setForm({
        name: pandit.name,
        city: pandit.city,
        stateId: (pandit as any).stateId,
        cityId: (pandit as any).cityId,
        specialization: pandit.specialization,
        languages: pandit.languages,
        experience: pandit.experience,
        fees: pandit.fees,
        rating: pandit.rating,
        reviewCount: pandit.reviewCount,
        image: pandit.image ?? "",
        phone: pandit.phone ?? "",
        email: pandit.email ?? "",
        bio: pandit.bio ?? "",
        education: pandit.education ?? "",
        serviceArea: pandit.serviceArea ?? "",
        regionalOrigin: pandit.regionalOrigin ?? "",
        availability: pandit.availability ?? "available",
        latitude: (pandit.latitude as number | null) ?? null,
        longitude: (pandit.longitude as number | null) ?? null,
      });
    }
  }, [pandit]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!pandit) throw new Error("No pandit");
      const payload: Record<string, unknown> = {
        name: form.name,
        stateId: form.stateId,
        cityId: form.cityId,
        specialization: form.specialization,
        languages: form.languages,
        experience: Number(form.experience),
        fees: Number(form.fees),
        rating: Math.max(0, Math.min(5, Number(form.rating) || 0)),
        reviewCount: Math.max(0, Math.floor(Number(form.reviewCount) || 0)),
        image: form.image || null,
        phone: form.phone || null,
        email: form.email || null,
        bio: form.bio || null,
        education: form.education || null,
        serviceArea: form.serviceArea || null,
        regionalOrigin: form.regionalOrigin || null,
        availability: form.availability || "available",
        latitude: form.latitude != null ? Number(form.latitude) : null,
        longitude: form.longitude != null ? Number(form.longitude) : null,
      };
      const res = await fetch(`/api/pandits/${pandit.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
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

  const update = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }));
  const hasGps = form.latitude != null && form.longitude != null;

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
              <Label>State</Label>
              <Select value={String((form as any).stateId || "")} onValueChange={v=>setForm(p=>({...p,stateId:Number(v),cityId:null,city:""}))}><SelectTrigger><SelectValue placeholder="Select state"/></SelectTrigger><SelectContent>{locations.filter(s => s.isActive).map(s=><SelectItem key={s.id} value={String(s.id)}>{s.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label>City</Label>
              <Select value={String((form as any).cityId || "")} disabled={!(form as any).stateId} onValueChange={v=>{const c=locations.find(s=>s.id===(form as any).stateId)?.cities.find(c=>String(c.id)===v);setForm(p=>({...p,cityId:Number(v),city:c?.name||""}));}}><SelectTrigger><SelectValue placeholder="Select city"/></SelectTrigger><SelectContent>{locations.find(s=>s.id===(form as any).stateId)?.cities.filter(c=>c.isActive).map(c=><SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>)}</SelectContent></Select>
            </div>
            <div>
              <Label htmlFor="edit-pandit-service-area">Service Area</Label>
              <Input id="edit-pandit-service-area" value={form.serviceArea ?? ""} onChange={e => update("serviceArea", e.target.value)} data-testid="input-edit-pandit-service-area" />
            </div>
            <div className="md:col-span-2 space-y-2">
              <Label className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-sky-600" />
                GPS Coordinates
                {hasGps && (
                  <span className="text-[10px] px-2 py-0.5 bg-sky-100 text-sky-700 rounded-full font-medium">Set</span>
                )}
              </Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Latitude (e.g. 28.6139)"
                  type="number"
                  step="any"
                  value={form.latitude ?? ""}
                  onChange={e => update("latitude", e.target.value === "" ? null : parseFloat(e.target.value))}
                  className="flex-1"
                  data-testid="input-edit-pandit-latitude"
                />
                <Input
                  placeholder="Longitude (e.g. 77.2090)"
                  type="number"
                  step="any"
                  value={form.longitude ?? ""}
                  onChange={e => update("longitude", e.target.value === "" ? null : parseFloat(e.target.value))}
                  className="flex-1"
                  data-testid="input-edit-pandit-longitude"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={geocoding}
                  onClick={handleAutoDetectLocation}
                  className="shrink-0 gap-1.5 text-sky-600 border-sky-300 hover:bg-sky-50"
                  data-testid="btn-auto-detect-location"
                >
                  <LocateFixed className={`w-4 h-4 ${geocoding ? "animate-spin" : ""}`} />
                  {geocoding ? "Detecting…" : "Auto-detect"}
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Auto-detect fills coordinates from the city name via OpenStreetMap. Or enter manually.
              </p>
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
              <Label htmlFor="edit-pandit-rating">Rating (0–5)</Label>
              <Input id="edit-pandit-rating" type="number" step="0.1" min="0" max="5" value={form.rating ?? 0} onChange={e => update("rating", Number(e.target.value))} data-testid="input-edit-pandit-rating" />
            </div>
            <div>
              <Label htmlFor="edit-pandit-review-count">Review Count</Label>
              <Input id="edit-pandit-review-count" type="number" min="0" step="1" value={form.reviewCount ?? 0} onChange={e => update("reviewCount", Number(e.target.value))} data-testid="input-edit-pandit-review-count" />
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
