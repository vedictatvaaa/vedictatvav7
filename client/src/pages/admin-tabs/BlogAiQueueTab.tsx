import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { sanitizeHtml } from "@/lib/sanitize-html";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sparkles, CheckCircle2, XCircle, Clock, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

interface BlogPostLite {
  id: number;
  slug: string;
  title: string;
  excerpt: string | null;
  body?: string | null;
  category: string | null;
  status: string;
  aiGenerated: boolean | null;
  sourcePrompt: string | null;
  createdAt: string;
  cluster?: string | null;
}

export default function BlogAiQueueTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const fetcher = createFetcher(adminToken);
  const [reasonFor, setReasonFor] = useState<number | null>(null);
  const [reason, setReason] = useState("");
  const [previewFor, setPreviewFor] = useState<number | null>(null);

  const pendingQuery = useQuery<BlogPostLite[]>({
    queryKey: ["/api/admin/blog-queue", "pending"],
    queryFn: () => fetcher("/api/admin/blog-queue?status=pending"),
  });
  const publishedQuery = useQuery<BlogPostLite[]>({
    queryKey: ["/api/admin/blog-queue", "published"],
    queryFn: () => fetcher("/api/admin/blog-queue?status=published"),
  });
  const rejectedQuery = useQuery<BlogPostLite[]>({
    queryKey: ["/api/admin/blog-queue", "rejected"],
    queryFn: () => fetcher("/api/admin/blog-queue?status=rejected"),
  });

  const isLoading = pendingQuery.isLoading;
  const data = {
    pending: pendingQuery.data || [],
    recentlyPublished: (publishedQuery.data || []).slice(0, 10),
    rejected: rejectedQuery.data || [],
  };

  const generateMutation = useMutation({
    mutationFn: () =>
      fetch("/api/admin/blog-queue/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
      }).then((r) => {
        if (!r.ok) throw new Error("Generation failed");
        return r.json();
      }),
    onSuccess: (res: any) => {
      toast({ title: "Generation complete", description: `${res?.inserted ?? 0} of ${res?.attempted ?? 0} draft(s) added to queue` });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-queue", "pending"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const approveMutation = useMutation({
    mutationFn: (id: number) =>
      fetch(`/api/admin/blog-queue/${id}/approve`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      }).then((r) => {
        if (!r.ok) throw new Error("Approve failed");
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Published" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-queue", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-queue", "published"] });
      queryClient.invalidateQueries({ queryKey: ["/api/blog-posts"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }: { id: number; reason: string }) =>
      fetch(`/api/admin/blog-queue/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ reason }),
      }).then((r) => {
        if (!r.ok) throw new Error("Reject failed");
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Rejected" });
      setReasonFor(null);
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-queue", "pending"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/blog-queue", "rejected"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6" data-testid="tab-blog-ai-queue">
      <div className="flex flex-row items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-serif font-semibold text-[#6D2B35]">AI Blog Queue</h1>
          <p className="text-sm text-muted-foreground mt-1">
            AI generates 3 SEO-tuned drafts per day across 4 content clusters. Review and approve to publish.
          </p>
        </div>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          data-testid="button-generate-now"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          {generateMutation.isPending ? "Generating…" : "Generate now"}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Clock className="w-4 h-4" />Pending review</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="stat-pending">{data?.pending?.length ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4" />Recently published</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="stat-published">{data?.recentlyPublished?.length ?? 0}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><XCircle className="w-4 h-4" />Rejected</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="stat-rejected">{data?.rejected?.length ?? 0}</p></CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">Pending drafts</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          {isLoading && <p className="text-sm text-muted-foreground">Loading…</p>}
          {data?.pending?.length === 0 && (
            <p className="text-sm text-muted-foreground">No pending drafts. The AI runs once a day, or generate one now.</p>
          )}
          {data?.pending?.map((p) => (
            <div key={p.id} className="border border-[#E8DCC4] rounded-md p-4 space-y-3" data-testid={`row-draft-${p.id}`}>
              <div className="flex flex-row items-start justify-between gap-3 flex-wrap">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-row items-center gap-2 flex-wrap mb-1">
                    {p.category && <Badge variant="secondary" className="text-xs">{p.category}</Badge>}
                    {p.aiGenerated && <Badge className="text-xs bg-amber-100 text-amber-900">AI</Badge>}
                  </div>
                  <h3 className="font-serif font-bold text-[#6D2B35] line-clamp-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.excerpt}</p>
                </div>
                <div className="flex flex-row gap-2 flex-wrap">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPreviewFor(previewFor === p.id ? null : p.id)}
                    data-testid={`button-preview-${p.id}`}
                  >
                    {previewFor === p.id ? <EyeOff className="w-3 h-3 mr-1" /> : <Eye className="w-3 h-3 mr-1" />}
                    {previewFor === p.id ? "Hide" : "Preview"}
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => approveMutation.mutate(p.id)}
                    disabled={approveMutation.isPending}
                    data-testid={`button-approve-${p.id}`}
                  >
                    <CheckCircle2 className="w-3 h-3 mr-1" />Publish
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setReasonFor(reasonFor === p.id ? null : p.id)}
                    data-testid={`button-reject-${p.id}`}
                  >
                    <XCircle className="w-3 h-3 mr-1" />Reject
                  </Button>
                </div>
              </div>
              {previewFor === p.id && (
                <div
                  className="border-t border-[#E8DCC4] pt-3 max-h-[420px] overflow-y-auto prose prose-sm max-w-none text-foreground prose-headings:text-[#6D2B35] prose-p:leading-relaxed"
                  data-testid={`preview-body-${p.id}`}
                  dangerouslySetInnerHTML={{ __html: sanitizeHtml(p.body || "<p><em>No body content.</em></p>") }}
                />
              )}
              {reasonFor === p.id && (
                <div className="flex flex-row items-center gap-2 flex-wrap">
                  <input
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Reason for rejection"
                    className="flex-1 min-w-[200px] h-9 px-3 rounded-md border border-[#E8DCC4] bg-background text-sm"
                    data-testid={`input-reject-reason-${p.id}`}
                  />
                  <Button
                    size="sm"
                    onClick={() => rejectMutation.mutate({ id: p.id, reason })}
                    disabled={!reason.trim() || rejectMutation.isPending}
                    data-testid={`button-reject-confirm-${p.id}`}
                  >
                    Confirm reject
                  </Button>
                </div>
              )}
            </div>
          ))}
        </CardContent>
      </Card>

      {data?.recentlyPublished && data.recentlyPublished.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-lg">Recently published (last 10)</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            {data.recentlyPublished.map((p) => (
              <div key={p.id} className="flex flex-row items-center justify-between gap-3 flex-wrap py-1.5 border-b border-[#E8DCC4] last:border-b-0">
                <div className="flex-1 min-w-0">
                  <a href={`/blog/${p.slug}`} target="_blank" rel="noreferrer" className="text-sm text-[#6D2B35] hover:underline font-medium line-clamp-1">{p.title}</a>
                  <p className="text-xs text-muted-foreground">{new Date(p.createdAt).toLocaleDateString()} · {p.category}</p>
                </div>
                {p.aiGenerated && <Badge variant="secondary" className="text-xs">AI</Badge>}
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
