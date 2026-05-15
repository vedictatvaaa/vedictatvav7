import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle2, XCircle, Sparkles, MessageSquare, HelpCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { createFetcher } from "../admin-shared";

interface Comment {
  id: number;
  postId: number;
  name: string;
  email: string;
  body: string;
  status: string;
  createdAt: string;
}
interface Question {
  id: number;
  slug: string;
  title: string;
  body: string | null;
  category: string;
  authorName: string;
  status: string;
  createdAt: string;
}
interface Answer {
  id: number;
  questionId: number;
  body: string;
  authorName: string;
  authorRole: string;
  status: string;
  createdAt: string;
}

export default function CommunityTab({ adminToken }: { adminToken?: string }) {
  const fetcher = createFetcher(adminToken);
  const { toast } = useToast();

  const { data: comments = [] } = useQuery<Comment[]>({
    queryKey: ["/api/admin/blog-comments"],
    queryFn: () => fetcher("/api/admin/blog-comments?status=pending"),
  });
  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/admin/qa/questions"],
    queryFn: () => fetcher("/api/admin/qa/questions?status=pending"),
  });
  const { data: answers = [] } = useQuery<Answer[]>({
    queryKey: ["/api/admin/qa/answers"],
    queryFn: () => fetcher("/api/admin/qa/answers?status=pending"),
  });

  const moderate = (url: string, payload: any, invalidate: string[]) =>
    fetch(url, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
      body: JSON.stringify(payload),
    }).then((r) => {
      if (!r.ok) throw new Error("Moderation failed");
      invalidate.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
      return r.json();
    });

  const commentMod = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      moderate(`/api/admin/blog-comments/${id}`, { status }, ["/api/admin/blog-comments"]),
    onSuccess: () => toast({ title: "Comment updated" }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const qMod = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      moderate(`/api/admin/qa/questions/${id}`, { status }, ["/api/admin/qa/questions"]),
    onSuccess: () => toast({ title: "Question updated" }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  const aMod = useMutation({
    mutationFn: ({ id, status }: { id: number; status: string }) =>
      moderate(`/api/admin/qa/answers/${id}`, { status }, ["/api/admin/qa/answers"]),
    onSuccess: () => toast({ title: "Answer updated" }),
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-6" data-testid="tab-community">
      <div>
        <h1 className="text-2xl font-serif font-semibold text-[#6D2B35]">Comments & Q&A Moderation</h1>
        <p className="text-sm text-muted-foreground mt-1">Approve or reject submissions from public visitors. Honeypot + rate-limited.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><MessageSquare className="w-4 h-4" />Pending comments</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="stat-pending-comments">{comments.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><HelpCircle className="w-4 h-4" />Pending questions</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="stat-pending-questions">{questions.length}</p></CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2"><Sparkles className="w-4 h-4" />Pending answers</CardTitle></CardHeader>
          <CardContent><p className="text-3xl font-bold" data-testid="stat-pending-answers">{answers.length}</p></CardContent>
        </Card>
      </div>

      <Tabs defaultValue="comments" className="space-y-4">
        <TabsList>
          <TabsTrigger value="comments">Comments ({comments.length})</TabsTrigger>
          <TabsTrigger value="questions">Questions ({questions.length})</TabsTrigger>
          <TabsTrigger value="answers">Answers ({answers.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="comments" className="space-y-3">
          {comments.length === 0 && <p className="text-sm text-muted-foreground">No pending comments.</p>}
          {comments.map((c) => (
            <Card key={c.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                  <div>
                    <p className="font-medium text-sm">{c.name} <span className="text-muted-foreground font-normal">· {c.email}</span></p>
                    <p className="text-xs text-muted-foreground">Post #{c.postId} · {new Date(c.createdAt).toLocaleString()}</p>
                  </div>
                  <Badge className="text-xs bg-amber-100 text-amber-900">pending</Badge>
                </div>
                <p className="text-sm whitespace-pre-wrap">{c.body}</p>
                <div className="flex flex-row gap-2 flex-wrap">
                  <Button size="sm" onClick={() => commentMod.mutate({ id: c.id, status: "approved" })} data-testid={`button-approve-comment-${c.id}`}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => commentMod.mutate({ id: c.id, status: "rejected" })} data-testid={`button-reject-comment-${c.id}`}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>

        <TabsContent value="questions" className="space-y-3">
          {questions.length === 0 && <p className="text-sm text-muted-foreground">No pending questions.</p>}
          {questions.map((q) => (
            <QuestionCard key={q.id} q={q} adminToken={adminToken} onModerate={qMod.mutate} />
          ))}
        </TabsContent>

        <TabsContent value="answers" className="space-y-3">
          {answers.length === 0 && <p className="text-sm text-muted-foreground">No pending answers.</p>}
          {answers.map((a) => (
            <Card key={a.id}>
              <CardContent className="pt-6 space-y-3">
                <div className="flex flex-row items-center justify-between gap-2 flex-wrap">
                  <p className="font-medium text-sm">{a.authorName} <Badge variant="secondary" className="text-xs ml-1">{a.authorRole}</Badge></p>
                  <p className="text-xs text-muted-foreground">Q#{a.questionId} · {new Date(a.createdAt).toLocaleString()}</p>
                </div>
                <p className="text-sm whitespace-pre-wrap">{a.body}</p>
                <div className="flex flex-row gap-2 flex-wrap">
                  <Button size="sm" onClick={() => aMod.mutate({ id: a.id, status: "approved" })} data-testid={`button-approve-answer-${a.id}`}><CheckCircle2 className="w-3 h-3 mr-1" />Approve</Button>
                  <Button size="sm" variant="outline" onClick={() => aMod.mutate({ id: a.id, status: "rejected" })}><XCircle className="w-3 h-3 mr-1" />Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function QuestionCard({ q, adminToken, onModerate }: { q: Question; adminToken?: string; onModerate: (p: { id: number; status: string }) => void }) {
  const { toast } = useToast();
  const [draft, setDraft] = useState("");
  const [showAnswer, setShowAnswer] = useState(false);

  const aiDraft = useMutation({
    mutationFn: () =>
      fetch(`/api/admin/qa/questions/${q.id}/ai-draft`, {
        method: "POST",
        headers: { "x-admin-token": adminToken || "" },
      }).then((r) => {
        if (!r.ok) throw new Error("AI draft failed");
        return r.json();
      }),
    onSuccess: (res: any) => {
      setDraft(res.body || res.draft || "");
      setShowAnswer(true);
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  const submitAnswer = useMutation({
    mutationFn: () =>
      fetch(`/api/admin/qa/questions/${q.id}/answer`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-token": adminToken || "" },
        body: JSON.stringify({ body: draft }),
      }).then((r) => {
        if (!r.ok) throw new Error("Submit failed");
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Answer published" });
      onModerate({ id: q.id, status: "approved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/qa/questions"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        <div className="flex flex-row items-start justify-between gap-2 flex-wrap">
          <div className="flex-1 min-w-0">
            <p className="font-serif font-bold text-[#6D2B35]">{q.title}</p>
            {q.body && <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{q.body}</p>}
            <p className="text-xs text-muted-foreground mt-1">{q.authorName} · {q.category} · {new Date(q.createdAt).toLocaleString()}</p>
          </div>
          <Badge className="text-xs bg-amber-100 text-amber-900">pending</Badge>
        </div>
        {showAnswer && (
          <Textarea rows={5} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Editorial answer" data-testid={`textarea-answer-${q.id}`} />
        )}
        <div className="flex flex-row gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => aiDraft.mutate()} disabled={aiDraft.isPending} data-testid={`button-ai-draft-${q.id}`}>
            <Sparkles className="w-3 h-3 mr-1" />{aiDraft.isPending ? "Drafting…" : "AI draft"}
          </Button>
          <Button size="sm" variant="outline" onClick={() => setShowAnswer(!showAnswer)}>{showAnswer ? "Hide" : "Write"} answer</Button>
          {showAnswer && (
            <Button size="sm" onClick={() => submitAnswer.mutate()} disabled={!draft.trim() || submitAnswer.isPending} data-testid={`button-submit-answer-${q.id}`}>
              <CheckCircle2 className="w-3 h-3 mr-1" />Publish answer
            </Button>
          )}
          <Button size="sm" variant="outline" onClick={() => onModerate({ id: q.id, status: "approved" })}>Approve only</Button>
          <Button size="sm" variant="outline" onClick={() => onModerate({ id: q.id, status: "rejected" })}>Reject</Button>
        </div>
      </CardContent>
    </Card>
  );
}
