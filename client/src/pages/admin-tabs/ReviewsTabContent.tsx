import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { TrendingUp, Search, Plus, Trash2, CheckCircle, Star, Type } from "lucide-react";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

import { Badge } from "@/components/ui/badge";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import type { Product, ProductReview } from "@shared/schema";


// ============================================================
// Reviews Tab Content
// ============================================================
function ReviewsTabContent() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: reviews } = useQuery<ProductReview[]>({
    queryKey: ["/api/reviews"],
    queryFn: () => fetch("/api/reviews").then((r) => r.json()),
  });
  const deleteReviewMut = useMutation({
    mutationFn: (id: number) => fetch(`/api/reviews/${id}`, { method: "DELETE" }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/reviews"] }); toast({ title: "Review deleted" }); },
  });
  const createReviewMut = useMutation({
    mutationFn: (data: any) => fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) }).then((r) => r.json()),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/reviews"] }); toast({ title: "Review added" }); },
  });
  return (
    <div className="space-y-6">
      <PendingReviewsPanel />
      <PendingQuestionsPanel />
      <SearchAnalyticsPanel />
      <ApprovedReviewsSection reviews={reviews || []} createReviewMut={createReviewMut} deleteReviewMut={deleteReviewMut} />
    </div>
  );
}

function PendingQuestionsPanel() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const headers: Record<string, string> = adminToken ? { "x-admin-token": adminToken } : {};
  const adminFetch = (url: string, init: RequestInit = {}) =>
    fetch(url, { ...init, headers: { ...headers, ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers as any) } });

  const { data: pending = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/admin/product-questions", "pending"],
    queryFn: () => adminFetch("/api/admin/product-questions?status=pending").then((r) => r.json()),
  });

  const [drafts, setDrafts] = useState<Record<number, string>>({});

  const answerMut = useMutation({
    mutationFn: ({ id, answer }: { id: number; answer: string }) =>
      adminFetch(`/api/admin/product-questions/${id}/answer`, { method: "POST", body: JSON.stringify({ answer }) }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/product-questions", "pending"] });
      toast({ title: "Answer published" });
    },
  });
  const rejectMut = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/product-questions/${id}/reject`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/admin/product-questions", "pending"] });
      toast({ title: "Rejected" });
    },
  });

  return (
    <Card data-testid="card-pending-questions">
      <CardHeader>
        <CardTitle>Pending customer questions ({pending.length})</CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : pending.length === 0 ? (
          <div className="text-sm text-muted-foreground" data-testid="text-no-pending-questions">No pending questions.</div>
        ) : (
          <div className="space-y-4">
            {pending.map((q: any) => (
              <div key={q.id} className="border rounded-md p-3" data-testid={`pending-q-${q.id}`}>
                <div className="text-xs text-muted-foreground mb-1">Product #{q.productId} — asked by {q.askerName}{q.askerEmail ? ` (${q.askerEmail})` : ""}</div>
                <div className="font-medium mb-2">Q. {q.question}</div>
                <Textarea
                  placeholder="Write the official answer..."
                  rows={3}
                  value={drafts[q.id] || ""}
                  onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                  data-testid={`textarea-answer-${q.id}`}
                />
                <div className="flex gap-2 mt-2 flex-wrap">
                  <Button
                    size="sm"
                    onClick={() => {
                      const ans = (drafts[q.id] || "").trim();
                      if (ans.length < 2) { toast({ title: "Please write an answer first" }); return; }
                      answerMut.mutate({ id: q.id, answer: ans });
                    }}
                    disabled={answerMut.isPending}
                    data-testid={`button-publish-answer-${q.id}`}
                  >
                    Publish answer
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => rejectMut.mutate(q.id)} disabled={rejectMut.isPending} data-testid={`button-reject-q-${q.id}`}>
                    Reject
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function PendingReviewsPanel() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const headers: Record<string, string> = adminToken ? { "x-admin-token": adminToken } : {};
  const adminFetch = (url: string, init: RequestInit = {}) =>
    fetch(url, { ...init, headers: { ...headers, ...(init.body ? { "Content-Type": "application/json" } : {}), ...(init.headers as any) } });

  const { data: pending = [], isLoading } = useQuery<ProductReview[]>({
    queryKey: ["/api/admin/reviews", "pending"],
    queryFn: () => adminFetch("/api/admin/reviews?status=pending").then((r) => r.json()),
  });
  const { data: counts } = useQuery<Record<string, number>>({
    queryKey: ["/api/admin/reviews/counts"],
    queryFn: () => adminFetch("/api/admin/reviews/counts").then((r) => r.json()),
  });

  const approveMut = useMutation({
    mutationFn: (id: number) => adminFetch(`/api/admin/reviews/${id}/approve`, { method: "POST" }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/counts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/reviews"] });
      toast({ title: "Approved", description: "Review is now visible publicly" });
    },
  });
  const rejectMut = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      adminFetch(`/api/admin/reviews/${id}/reject`, { method: "POST", body: JSON.stringify({ reason }) }).then((r) => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/reviews/counts"] });
      toast({ title: "Rejected" });
    },
  });

  return (
    <Card className="bg-card border-amber-200" data-testid="card-pending-reviews">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-lg text-amber-700 flex items-center gap-2">
            <Star className="w-5 h-5" />
            Pending Moderation
            {pending.length > 0 && (
              <Badge variant="secondary" className="bg-amber-100 text-amber-800" data-testid="badge-pending-count">{pending.length}</Badge>
            )}
          </CardTitle>
          {counts && (
            <div className="text-xs text-muted-foreground flex gap-3">
              <span data-testid="count-approved">Approved: <strong>{counts.approved || 0}</strong></span>
              <span data-testid="count-rejected">Rejected: <strong>{counts.rejected || 0}</strong></span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
        {!isLoading && pending.length === 0 && (
          <div className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-pending">
            No reviews awaiting moderation.
          </div>
        )}
        <div className="space-y-3">
          {pending.map((r) => (
            <div key={r.id} className="border border-amber-200 rounded-md p-3 bg-amber-50/50" data-testid={`pending-review-${r.id}`}>
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-semibold text-foreground">{r.reviewerName}</span>
                    {r.reviewerCity && <span className="text-xs text-muted-foreground">· {r.reviewerCity}</span>}
                    <span className="text-amber-600">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</span>
                    <span className="text-xs text-muted-foreground">· Product #{r.productId}</span>
                  </div>
                  <div className="font-medium text-foreground mt-1">{r.title}</div>
                  <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{r.body}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => approveMut.mutate(r.id)}
                    disabled={approveMut.isPending}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    data-testid={`button-approve-${r.id}`}
                  >
                    Approve
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const reason = window.prompt("Reason for rejection (optional):") || "";
                      rejectMut.mutate({ id: r.id, reason });
                    }}
                    disabled={rejectMut.isPending}
                    data-testid={`button-reject-${r.id}`}
                  >
                    Reject
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SearchAnalyticsPanel() {
  const adminToken = typeof window !== "undefined" ? localStorage.getItem("adminToken") : null;
  const headers: Record<string, string> = adminToken ? { "x-admin-token": adminToken } : {};

  const { data, isLoading } = useQuery<{
    total: number;
    totalSearches: number;
    zeroResultCount: number;
    zeroResults: { query: string; hits: number; lastSeenAt: string }[];
    top: { id: number; query: string; hits: number; resultCount: number; lastSeenAt: string }[];
  }>({
    queryKey: ["/api/admin/search/queries"],
    queryFn: () => fetch("/api/admin/search/queries?limit=100", { headers }).then((r) => r.json()),
  });

  return (
    <Card data-testid="card-search-analytics">
      <CardHeader>
        <CardTitle className="text-base">Search Analytics</CardTitle>
        <CardDescription>What customers are searching for, and where the catalog has gaps.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading...</p>
        ) : !data ? (
          <p className="text-sm text-muted-foreground">No data yet.</p>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-md border p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Unique queries</p>
                <p className="text-lg font-bold" data-testid="stat-unique-queries">{data.total}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Total searches</p>
                <p className="text-lg font-bold" data-testid="stat-total-searches">{data.totalSearches}</p>
              </div>
              <div className="rounded-md border p-3">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Zero-result queries</p>
                <p className="text-lg font-bold text-[#6D2B35]" data-testid="stat-zero-results">{data.zeroResultCount}</p>
              </div>
            </div>

            {data.zeroResults?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[#6D2B35] mb-2">Catalog gaps (zero results)</p>
                <div className="flex flex-wrap gap-2">
                  {data.zeroResults.slice(0, 20).map((z, i) => (
                    <Badge key={i} variant="outline" data-testid={`badge-zero-${i}`}>
                      {z.query} <span className="ml-1 text-muted-foreground">×{z.hits}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {data.top?.length > 0 && (
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Top searches</p>
                <div className="flex flex-wrap gap-2">
                  {data.top.slice(0, 20).map((t, i) => (
                    <Badge key={t.id} variant="secondary" data-testid={`badge-top-${i}`}>
                      {t.query} <span className="ml-1 text-muted-foreground">×{t.hits}</span>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ApprovedReviewsSection({ reviews, createReviewMut, deleteReviewMut }: {
  reviews: ProductReview[];
  createReviewMut: ReturnType<typeof useMutation<any, Error, any>>;
  deleteReviewMut: ReturnType<typeof useMutation<any, Error, number>>;
}) {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newReview, setNewReview] = useState({
    productId: 1, reviewerName: "", reviewerCity: "", rating: 5, title: "", body: "", verified: false, isBoosted: false,
  });

  const totalReviews = reviews.length;
  const avgRating = totalReviews > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews).toFixed(1) : "0";
  const verifiedCount = reviews.filter(r => r.verified).length;
  const boostedCount = reviews.filter(r => r.isBoosted).length;

  const handleSubmit = () => {
    createReviewMut.mutate(newReview);
    setNewReview({ productId: 1, reviewerName: "", reviewerCity: "", rating: 5, title: "", body: "", verified: false, isBoosted: false });
    setShowAddForm(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif text-primary" data-testid="page-title-reviews">Reviews</h1>
          <p className="text-sm text-muted-foreground">Manage product reviews</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} className="bg-primary text-white gap-2" data-testid="btn-add-review">
          <Plus className="w-4 h-4" /> Add Review
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" data-testid="reviews-summary-stats">
        {[
          { label: "Total Reviews", value: totalReviews, icon: Star, color: "text-amber-600 bg-amber-50", border: "border-amber-200" },
          { label: "Average Rating", value: avgRating, icon: Star, color: "text-emerald-600 bg-emerald-50", border: "border-emerald-200" },
          { label: "Verified", value: verifiedCount, icon: CheckCircle, color: "text-blue-600 bg-blue-50", border: "border-blue-200" },
          { label: "Boosted", value: boostedCount, icon: TrendingUp, color: "text-purple-600 bg-purple-50", border: "border-purple-200" },
        ].map((stat, i) => (
          <Card key={i} className={`bg-card border ${stat.border}`} data-testid={`review-stat-${i}`}>
            <CardContent className="pt-5 pb-4 flex items-center gap-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-medium text-secondary uppercase tracking-wide">{stat.label}</p>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Review Form */}
      {showAddForm && (
        <Card className="bg-card border-secondary/30" data-testid="card-add-review-form">
          <CardHeader>
            <CardTitle className="text-lg text-primary">New Review</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Product ID</Label>
                <Input type="number" value={newReview.productId} onChange={(e) => setNewReview({ ...newReview, productId: Number(e.target.value) })} data-testid="input-review-product-id" />
              </div>
              <div className="space-y-2">
                <Label>Reviewer Name</Label>
                <Input value={newReview.reviewerName} onChange={(e) => setNewReview({ ...newReview, reviewerName: e.target.value })} data-testid="input-review-name" />
              </div>
              <div className="space-y-2">
                <Label>Reviewer City</Label>
                <Input value={newReview.reviewerCity} onChange={(e) => setNewReview({ ...newReview, reviewerCity: e.target.value })} data-testid="input-review-city" />
              </div>
              <div className="space-y-2">
                <Label>Rating</Label>
                <Select value={String(newReview.rating)} onValueChange={(val) => setNewReview({ ...newReview, rating: Number(val) })}>
                  <SelectTrigger data-testid="select-review-rating">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5].map((r) => (
                      <SelectItem key={r} value={String(r)}>{"★".repeat(r)}{"☆".repeat(5 - r)} ({r})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Title</Label>
                <Input value={newReview.title} onChange={(e) => setNewReview({ ...newReview, title: e.target.value })} data-testid="input-review-title" />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Body</Label>
                <Textarea value={newReview.body} onChange={(e) => setNewReview({ ...newReview, body: e.target.value })} rows={3} data-testid="input-review-body" />
              </div>
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Switch checked={newReview.verified} onCheckedChange={(val) => setNewReview({ ...newReview, verified: val })} data-testid="switch-review-verified" />
                  <Label>Verified</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={newReview.isBoosted} onCheckedChange={(val) => setNewReview({ ...newReview, isBoosted: val })} data-testid="switch-review-boosted" />
                  <Label>Is Boosted</Label>
                </div>
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleSubmit} disabled={createReviewMut.isPending} className="bg-primary text-white" data-testid="btn-submit-review">
                {createReviewMut.isPending ? "Adding..." : "Add Review"}
              </Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)} data-testid="btn-cancel-add-review">Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews Table */}
      <Card className="bg-card border-border" data-testid="card-reviews-table">
        <CardHeader>
          <CardTitle className="text-lg text-primary font-serif">All Reviews</CardTitle>
          <CardDescription className="text-muted-foreground">{totalReviews} total reviews</CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center" data-testid="text-no-reviews">No reviews yet</p>
          ) : (
            <div className="space-y-3">
              {reviews.map((review) => (
                <div key={review.id} className="flex items-center justify-between p-3 rounded-lg bg-muted border border-border" data-testid={`row-review-${review.id}`}>
                  <div className="flex items-center gap-4 flex-grow min-w-0">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                      #{review.id}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-medium text-foreground">{review.reviewerName}</span>
                        {review.reviewerCity && <span className="text-xs text-muted-foreground">· {review.reviewerCity}</span>}
                        <span className="text-xs text-secondary">Product #{review.productId}</span>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-amber-500 text-sm" data-testid={`rating-review-${review.id}`}>{"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}</span>
                        <span className="text-sm font-medium text-foreground truncate">{review.title}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0 ml-4">
                    {review.verified && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700" data-testid={`badge-verified-${review.id}`}>
                        Verified
                      </span>
                    )}
                    {review.isBoosted && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700" data-testid={`badge-boosted-${review.id}`}>
                        Boosted
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground" data-testid={`helpful-review-${review.id}`}>👍 {review.helpful}</span>
                    <Button size="icon" variant="ghost" onClick={() => deleteReviewMut.mutate(review.id)} className="h-8 w-8 text-red-500" data-testid={`btn-delete-review-${review.id}`}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


export default ReviewsTabContent;
