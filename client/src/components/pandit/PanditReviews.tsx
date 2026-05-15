import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Star, MessageSquare, CheckCircle2 } from "lucide-react";
import { panditApi } from "@/lib/panditAuth";
import { useToast } from "@/hooks/use-toast";

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
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const [busy, setBusy] = useState<number | null>(null);

  async function load() {
    try {
      setLoading(true);
      const r = await panditApi("GET", "/api/pandit/reviews");
      setReviews(r.reviews || []); setSummary(r.summary || null);
    } catch (e: any) {
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

  return (
    <div className="space-y-6" data-testid="pandit-reviews-tab">
      <div>
        <h2 className="text-2xl font-serif font-bold text-[#4a1a22]">Reviews</h2>
        <p className="text-sm text-stone-600 mt-1">
          What yajamanas are saying. Replies appear publicly on your profile and help future bookings.
        </p>
      </div>

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500">Average rating</div>
            <div className="flex items-baseline gap-2">
              <div className="text-3xl font-serif font-bold text-[#4a1a22]" data-testid="text-avg-rating">
                {summary.avg.toFixed(1)}
              </div>
              <StarRow rating={summary.avg} />
            </div>
            <div className="text-xs text-stone-500 mt-1">{summary.count} reviews</div>
          </CardContent></Card>
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
          <Card><CardContent className="p-4">
            <div className="text-xs text-stone-500">Awaiting your reply</div>
            <div className="text-3xl font-serif font-bold text-amber-700" data-testid="text-unanswered">{summary.unanswered}</div>
            <div className="text-xs text-stone-500 mt-1">Replying boosts trust on your profile.</div>
          </CardContent></Card>
        </div>
      )}

      {loading && <div className="text-sm text-stone-500">Loading…</div>}
      {!loading && reviews.length === 0 && (
        <Card><CardContent className="p-8 text-center text-stone-500">
          <MessageSquare className="w-8 h-8 mx-auto mb-2 text-stone-400" />
          No reviews yet. They will appear here as yajamanas leave feedback.
        </CardContent></Card>
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
