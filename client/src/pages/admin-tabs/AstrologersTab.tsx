
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Star, Type } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

import { Button } from "@/components/ui/button";

import { Skeleton } from "@/components/ui/skeleton";

import { useToast } from "@/hooks/use-toast";
import type { Astrologer } from "@shared/schema";

import { createFetcher } from "../admin-shared";

// ============================================================
// Astrologers Tab
// ============================================================
function AstrologersTab() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") || "" : "";
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: astrologersList, isLoading } = useQuery<Astrologer[]>({
    queryKey: ["/api/astrologers", "admin"],
    queryFn: () => fetcher("/api/astrologers?all=true"),
  });

  const toggleVerifiedMutation = useMutation({
    mutationFn: async (id: number) => {
      const astrologer = (astrologersList || []).find(a => a.id === id);
      const newVerified = !astrologer?.verified;
      const res = await fetch(`/api/astrologers/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: newVerified }),
      });
      if (!res.ok) throw new Error("Update failed");
      return { ...await res.json(), newVerified };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/astrologers"] });
      toast({ title: data.newVerified ? "Astrologer Approved" : "Astrologer Delisted", description: data.newVerified ? "Astrologer is now live and visible." : "Astrologer has been delisted from public view." });
    },
    onError: () => toast({ title: "Error", description: "Failed to update astrologer.", variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/astrologers/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/astrologers"] });
      toast({ title: "Astrologer Removed", description: "Astrologer has been removed." });
    },
    onError: () => toast({ title: "Error", description: "Failed to remove astrologer.", variant: "destructive" }),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-serif text-primary" data-testid="page-title-astrologers">Astrologers</h1>
        <p className="text-sm text-muted-foreground">Manage astrologer registrations, approvals & listings</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}
        </div>
      ) : (astrologersList || []).length === 0 ? (
        <Card className="bg-card border-border">
          <CardContent className="py-8 text-center">
            <Star className="w-10 h-10 mx-auto text-muted-foreground/20 mb-3" />
            <p className="text-muted-foreground/50 text-sm">No astrologer applications yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(astrologersList || []).map((astrologer) => (
            <Card key={astrologer.id} className="bg-card border-border" data-testid={`card-astrologer-${astrologer.id}`}>
              <CardContent className="py-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center text-secondary font-serif font-bold text-lg shrink-0">
                    {astrologer.name.charAt(0)}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-primary">{astrologer.name}</h3>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full ${astrologer.verified ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"}`}>
                        {astrologer.verified ? "Live" : "Pending"}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground">{astrologer.city} · {astrologer.specialization}</p>
                    <p className="text-xs text-secondary">
                      {astrologer.experience} yrs exp · {astrologer.languages} · ₹{astrologer.fees}/session
                      {astrologer.certification && <span className="ml-2 text-muted-foreground/50">· {astrologer.certification}</span>}
                    </p>
                    {astrologer.email && <p className="text-[10px] text-muted-foreground/40">{astrologer.email} · {astrologer.phone}</p>}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    {astrologer.verified ? (
                      <Button size="sm" variant="outline" onClick={() => toggleVerifiedMutation.mutate(astrologer.id)} className="h-8 text-orange-600 border-orange-200 text-xs" data-testid={`btn-delist-astrologer-${astrologer.id}`}>
                        Delist
                      </Button>
                    ) : (
                      <Button size="sm" onClick={() => toggleVerifiedMutation.mutate(astrologer.id)} className="bg-emerald-600 text-white h-8 gap-1 text-xs" data-testid={`btn-approve-astrologer-${astrologer.id}`}>
                        <CheckCircle className="w-3 h-3" /> Approve
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" onClick={() => deleteMutation.mutate(astrologer.id)} className="h-8 text-red-500" data-testid={`btn-delete-astrologer-${astrologer.id}`}>
                      <XCircle className="w-4 h-4" />
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


export default AstrologersTab;
