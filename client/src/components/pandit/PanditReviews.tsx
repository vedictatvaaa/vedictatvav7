import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { panditApi } from "@/lib/panditAuth";
import { useToast } from "@/hooks/use-toast";
import { PanditEmptyState, PanditErrorState, PanditKpi, PanditKpiGrid, PanditLoadingState, PanditSectionHeader } from "@/components/pandit/PanditSection";

interface Review {
  id: number; reviewerName: string; reviewerCity: string | null;
  rating: number; comment: string | null; serviceType: string | null;
  panditReply: string | null; panditRepliedAt: string | null;
  createdAt: string | null;
}
interface Summary { count: number; avg: number; breakdown: Array<{ star: number; count: number }>; unanswered: number; }

function StarRow({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map((n) => (
        <Star key={n} className={`w-3.5 h-3.5 ${n <= Math.round(rating) ? "fill-[#D4AF37] text-[#D4AF37]" : "text-stone-300"}`} />
      ))}
    </div>
  );
}

export default function PanditReviews() {
  const { toast } = useToast();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      setError(null);
      const r = await panditApi("GET", "/api/pandit/reviews");
      setReviews(r.reviews || []); setSummary(r.summary || null);
    } catch (e: any) {
      setError(e?.message || "Your reviews could not be loaded.");
      toast({ title: "Failed to load reviews", description: e?.message, variant: "destructive" });
    } finally { setLoading(false); }
  }
  useEffect(() => { load(); }, []);

  async function reply(id: number) {
    const text = (drafts[id] || "").trim();
    if (text.length < 1) return;
    setBusy(id);
    try {
      await panditApi("PATCH", `/api/pandit/reviews/${id}/reply`, { reply: text });
      toast({ title: "Reply posted publicly" });
      setDrafts((d) => ({ ...d, [id]: "" }));
      await load();
    } catch (e: any) {
      toast({ title: "Reply failed", description: e?.message, variant: "destructive" });
    } finally { setBusy(null); }
  }

  if (loading) return <PanditLoadingState label="Loading reviews…" />;
  if (error) return <div className="space-y-5"><PanditSectionHeader title="Reviews" description="See what yajamanas are saying and reply publicly from one place." /><PanditErrorState detail={error} onRetry={load} /></div>;

  return (
    <div className="space-y-5" data-testid="pandit-reviews-tab">
      <PanditSectionHeader title="Reviews" description="See what yajamanas are saying and reply publicly from one place." actions={<Button size="sm" variant="outline" onClick={load}>Refresh</Button>} />

      {summary && (
        <PanditKpiGrid className="md:grid-cols-3">
          <PanditKpi label="Average rating" value={<span className="inline-flex items-center gap-2">{summary.avg.toFixed(1)} <StarRow rating={summary.avg} /></span>} detail={`${summary.count} reviews`} icon={Star} testId="text-avg-rating" />
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500 mb-2">Distribution</div>
            <div className="space-y-1">
              {summary.breakdown.map((b) => (
                <div key={b.star} className="flex items-center gap-2 text-xs">
                  <span className="w-3 text-stone-600">{b.star}</span>
                  <Star className="w-3 h-3 fill-[#D4AF37] text-[#D4AF37]" />
                  <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D4AF37]" style={{ width: summary.count ? `${(b.count / summary.count) * 100}%` : "0%" }} />
                  </div>
                  <span className="w-6 text-right text-stone-500">{b.count}</span>
                </div>
              ))}
            </div>
          </CardContent></Card>
          <PanditKpi label="Awaiting your reply" value={summary.unanswered} detail="Replying boosts trust on your profile." icon={MessageSquare} tone="gold" testId="text-unanswered" />
        </PanditKpiGrid>
      )}

      {!loading && reviews.length === 0 && (
        <PanditEmptyState icon={MessageSquare} title="No reviews yet" detail="They’ll appear here as yajamanas leave feedback." />
      )}

      <div className="space-y-3">
        {reviews.map((r) => (
          <Card key={r.id} data-testid={`card-review-${r.id}`}>
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base font-serif text-[#4a1a22]">{r.reviewerName}</CardTitle>
                    <StarRow rating={r.rating} />
                  </div>
                  <div className="text-xs text-stone-500 mt-1">
                    {r.serviceType ? `${r.serviceType} · ` : ""}{r.reviewerCity || ""}
                    {r.createdAt ? ` · ${new Date(r.createdAt).toLocaleDateString()}` : ""}
                  </div>
                </div>
                {r.panditReply && (
                  <Badge className="bg-emerald-100 text-emerald-900 border-0">
                    <CheckCircle2 className="w-3 h-3 mr-1 inline" />Replied
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="pt-2 space-y-3">
              {r.comment && <p className="text-sm text-stone-700">{r.comment}</p>}

              {r.panditReply ? (
                <div className="border-l-2 border-[#D4AF37] pl-3 ml-1 bg-[#FBF7EE]/40 rounded-r-md py-2">
                  <div className="text-xs text-stone-500 mb-0.5">
                    Your reply{r.panditRepliedAt ? ` · ${new Date(r.panditRepliedAt).toLocaleDateString()}` : ""}
                  </div>
                  <p className="text-sm text-stone-800">{r.panditReply}</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Textarea
                    placeholder="Thank the yajamana, address concerns, or share a brief reflection. Visible publicly."
                    value={drafts[r.id] || ""}
                    onChange={(e) => setDrafts((d) => ({ ...d, [r.id]: e.target.value }))}
                    rows={2}
                    data-testid={`input-reply-${r.id}`}
                  />
                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      className="bg-[#6D2B35] hover:bg-[#5a232c] text-white"
                      disabled={busy === r.id || (drafts[r.id] || "").trim().length < 1}
                      onClick={() => reply(r.id)}
                      data-testid={`button-post-reply-${r.id}`}
                    >
                      {busy === r.id ? "Posting…" : "Post reply"}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
