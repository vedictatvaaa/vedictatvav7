
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Trash2, CheckCircle, XCircle, Star, Type, Heart, Shield } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import type { MatrimonyProfile } from "@shared/schema";

import { createFetcher } from "../admin-shared";

function MatrimonyTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: profiles, isLoading } = useQuery<MatrimonyProfile[]>({
    queryKey: ["/api/matrimony/profiles/all"],
    queryFn: () => fetcher("/api/matrimony/profiles/all"),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: number; data: any }) =>
      fetch(`/api/matrimony/profiles/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matrimony/profiles/all"] });
      queryClient.invalidateQueries({ queryKey: ["/api/matrimony/profiles"] });
      toast({ title: "Profile updated" });
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/matrimony/profiles/${id}`, { method: "DELETE" }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matrimony/profiles/all"] });
      toast({ title: "Profile deleted" });
    },
  });

  const pending = (profiles || []).filter(p => p.status === "pending");
  const approved = (profiles || []).filter(p => p.status === "approved");
  const rejected = (profiles || []).filter(p => p.status === "rejected");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-primary flex items-center gap-2">
          <Heart className="w-5 h-5" /> Matrimony Profiles
        </h2>
        <p className="text-sm text-muted-foreground">Manage, verify, and approve matrimony profile registrations</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-600">{pending.length}</p>
            <p className="text-xs text-muted-foreground">Pending Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{approved.length}</p>
            <p className="text-xs text-muted-foreground">Approved</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-600">{rejected.length}</p>
            <p className="text-xs text-muted-foreground">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[1,2,3].map(i => <Skeleton key={i} className="h-24 w-full" />)}</div>
      ) : !profiles || profiles.length === 0 ? (
        <Card><CardContent className="p-8 text-center text-muted-foreground">No matrimony registrations yet</CardContent></Card>
      ) : (
        <div className="space-y-3">
          {(profiles || []).map(profile => (
            <Card key={profile.id} className={`${profile.status === "pending" ? "border-yellow-200 bg-yellow-50/30" : profile.status === "rejected" ? "border-red-200 bg-red-50/30" : ""}`} data-testid={`admin-matrimony-${profile.id}`}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-semibold text-sm">{profile.fullName}</h3>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        profile.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                        profile.status === "approved" ? "bg-emerald-100 text-emerald-800" :
                        "bg-red-100 text-red-800"
                      }`}>{profile.status}</span>
                      {profile.verified && <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 flex items-center gap-0.5"><Shield className="w-2.5 h-2.5" /> Verified</span>}
                      {profile.featured && <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">Featured</span>}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {profile.gender === "Female" ? "Bride" : "Groom"} | {profile.age} yrs | {profile.city}, {profile.state} | {profile.education} | {profile.occupation}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Contact: {profile.contactName} ({profile.contactEmail}, {profile.contactPhone})
                    </p>
                    {profile.caste && <p className="text-xs text-muted-foreground">Caste: {profile.caste} {profile.gotra ? `| Gotra: ${profile.gotra}` : ""}</p>}
                    {profile.adminNotes && <p className="text-xs text-amber-700 mt-1">Note: {profile.adminNotes}</p>}
                  </div>
                  <div className="flex flex-col gap-1.5 shrink-0">
                    {profile.status === "pending" && (
                      <>
                        <Button size="sm" variant="outline" className="text-emerald-700 text-xs"
                          onClick={() => updateMut.mutate({ id: profile.id, data: { status: "approved", approved: true, verified: true } })}
                          data-testid={`btn-approve-${profile.id}`}
                        >
                          <CheckCircle className="h-3 w-3 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="outline" className="text-red-600 text-xs"
                          onClick={() => updateMut.mutate({ id: profile.id, data: { status: "rejected", approved: false } })}
                          data-testid={`btn-reject-${profile.id}`}
                        >
                          <XCircle className="h-3 w-3 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                    {profile.status === "approved" && (
                      <Button size="sm" variant="outline" className={`text-xs ${profile.featured ? "text-muted-foreground" : "text-amber-600"}`}
                        onClick={() => updateMut.mutate({ id: profile.id, data: { featured: !profile.featured } })}
                        data-testid={`btn-feature-${profile.id}`}
                      >
                        <Star className="h-3 w-3 mr-1" /> {profile.featured ? "Unfeature" : "Feature"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" className="text-red-600 text-xs"
                      onClick={() => { if (confirm("Delete this profile?")) deleteMut.mutate(profile.id); }}
                      data-testid={`btn-delete-${profile.id}`}
                    >
                      <Trash2 className="h-3 w-3 mr-1" /> Delete
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

export default MatrimonyTab;
