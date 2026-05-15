import { useState, useMemo } from "react";
import { Link, useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, MessageCircle, ArrowLeft, HelpCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import PageSeo from "@/components/PageSeo";

interface Question {
  id: number;
  slug: string;
  title: string;
  body: string | null;
  category: string;
  tags: string[];
  isFeatured: boolean | null;
  answerCount?: number;
  createdAt: string;
}
interface Answer {
  id: number;
  body: string;
  authorName: string;
  authorRole: string;
  isAccepted: boolean | null;
  createdAt: string;
}
interface QuestionDetail extends Question {
  answers: Answer[];
}

const CATEGORIES = ["all", "rituals", "festivals", "astrology", "puja", "general"];

export default function QaPage() {
  const params = useParams<{ slug?: string }>();
  if (params.slug) return <QaDetail slug={params.slug} />;
  return <QaHub />;
}

function QaHub() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [askOpen, setAskOpen] = useState(false);

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ["/api/qa"],
    queryFn: () => fetch("/api/qa").then((r) => r.json()),
  });

  const filtered = useMemo(() => {
    let q = questions;
    if (category !== "all") q = q.filter((x) => x.category === category);
    const s = search.toLowerCase().trim();
    if (s) q = q.filter((x) => x.title.toLowerCase().includes(s) || (x.body || "").toLowerCase().includes(s));
    return q;
  }, [questions, search, category]);

  const featured = useMemo(() => questions.filter((q) => q.isFeatured).slice(0, 6), [questions]);

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <PageSeo
        canonical="/qa"
        title="Spiritual Q&A — Pujas, Mantras, Vedic Wisdom | Vedic Tatva"
        description="Hundreds of answered questions on Hindu pujas, fasting, festivals, mantras, astrology and dharma — sourced from practising pandits and editorial review."
      />
      <div className="max-w-5xl mx-auto px-4 py-10 md:py-16">
        <div className="text-center space-y-4 mb-10">
          <Badge className="bg-[#6D2B35] text-white">Community Q&A</Badge>
          <h1 className="text-3xl md:text-5xl font-serif font-bold text-[#6D2B35]" data-testid="heading-qa">
            Spiritual Questions, Authentic Answers
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Answers reviewed by practising pandits — on pujas, mantras, fasting, festivals, and Vedic dharma.
          </p>
          <Button size="lg" onClick={() => setAskOpen(!askOpen)} data-testid="button-ask-question">
            <HelpCircle className="w-4 h-4 mr-2" />Ask a question
          </Button>
        </div>

        {askOpen && (
          <Card className="mb-8 border-[#D4AF37]/40">
            <CardContent className="pt-6">
              <AskQuestionForm onClose={() => setAskOpen(false)} />
            </CardContent>
          </Card>
        )}

        <div className="flex flex-row gap-3 flex-wrap items-center mb-6">
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search questions"
              className="pl-9 h-11"
              data-testid="input-search-qa"
            />
          </div>
          <div className="flex flex-row gap-1 flex-wrap">
            {CATEGORIES.map((c) => (
              <Button
                key={c}
                size="sm"
                variant={category === c ? "default" : "outline"}
                onClick={() => setCategory(c)}
                data-testid={`button-cat-${c}`}
              >
                {c}
              </Button>
            ))}
          </div>
        </div>

        {featured.length > 0 && search === "" && category === "all" && (
          <div className="mb-10">
            <h2 className="text-xl font-serif font-bold text-[#6D2B35] mb-3">Featured</h2>
            <div className="grid md:grid-cols-2 gap-3">
              {featured.map((q) => (
                <Link key={q.id} href={`/qa/${q.slug}`}>
                  <Card className="hover-elevate cursor-pointer" data-testid={`card-featured-${q.slug}`}>
                    <CardContent className="pt-6 space-y-2">
                      <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                      <p className="font-serif font-semibold text-[#6D2B35] line-clamp-2">{q.title}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {isLoading && <p className="text-center text-muted-foreground py-10">Loading questions…</p>}
          {filtered.length === 0 && !isLoading && (
            <p className="text-center text-muted-foreground py-10">No matching questions.</p>
          )}
          {filtered.map((q) => (
            <Link key={q.id} href={`/qa/${q.slug}`}>
              <Card className="hover-elevate cursor-pointer" data-testid={`card-qa-${q.slug}`}>
                <CardContent className="pt-5 pb-5 flex flex-row items-start gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-row items-center gap-2 flex-wrap mb-1">
                      <Badge variant="secondary" className="text-xs">{q.category}</Badge>
                      {(q.tags || []).slice(0, 3).map((t) => (
                        <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                      ))}
                    </div>
                    <p className="font-serif font-semibold text-[#6D2B35] line-clamp-2">{q.title}</p>
                    {q.body && <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{q.body}</p>}
                  </div>
                  <div className="flex flex-row items-center gap-1 text-muted-foreground text-sm">
                    <MessageCircle className="w-4 h-4" />
                    {q.answerCount ?? 0}
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

function QaDetail({ slug }: { slug: string }) {
  const { data, isLoading } = useQuery<{ question: Question; answers: Answer[] }>({
    queryKey: ["/api/qa", slug],
    queryFn: () => fetch(`/api/qa/${encodeURIComponent(slug)}`).then((r) => {
      if (!r.ok) throw new Error("Not found");
      return r.json();
    }),
    enabled: !!slug,
  });

  if (isLoading) return <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center"><p className="text-muted-foreground">Loading…</p></div>;
  if (!data?.question) return <div className="min-h-screen bg-[#FBF7EE] flex items-center justify-center"><p className="text-muted-foreground">Question not found.</p></div>;

  const q = data.question;
  const answers = data.answers || [];
  const accepted = answers.find((a) => a.isAccepted);
  const others = answers.filter((a) => !a.isAccepted);

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      <PageSeo canonical={`/qa/${slug}`} title={`${q.title} — Vedic Tatva Q&A`} description={(accepted?.body || q.body || q.title).slice(0, 160)} />
      <article className="max-w-3xl mx-auto px-4 py-10 md:py-16">
        <Link href="/qa" className="inline-flex items-center gap-1 text-sm text-[#6D2B35] hover:underline mb-6">
          <ArrowLeft className="w-4 h-4" />All questions
        </Link>
        <div className="flex flex-row items-center gap-2 flex-wrap mb-3">
          <Badge variant="secondary" className="text-xs">{q.category}</Badge>
          {(q.tags || []).map((t) => <Badge key={t} variant="outline" className="text-xs">{t}</Badge>)}
        </div>
        <h1 className="text-2xl md:text-4xl font-serif font-bold text-[#6D2B35] mb-4" data-testid="heading-question">{q.title}</h1>
        {q.body && <p className="text-lg text-muted-foreground whitespace-pre-wrap mb-8">{q.body}</p>}

        {accepted && (
          <div className="mb-6">
            <div className="flex flex-row items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-700" />
              <h2 className="text-lg font-serif font-bold text-[#6D2B35]">Accepted answer</h2>
            </div>
            <Card className="border-emerald-200">
              <CardContent className="pt-6">
                <p className="text-base text-foreground whitespace-pre-wrap leading-relaxed">{accepted.body}</p>
                <p className="text-xs text-muted-foreground mt-4">— {accepted.authorName} · {accepted.authorRole}</p>
              </CardContent>
            </Card>
          </div>
        )}

        {others.length > 0 && (
          <div className="space-y-3 mb-8">
            <h2 className="text-lg font-serif font-bold text-[#6D2B35]">Other answers ({others.length})</h2>
            {others.map((a) => (
              <Card key={a.id}>
                <CardContent className="pt-6">
                  <p className="text-base whitespace-pre-wrap leading-relaxed">{a.body}</p>
                  <p className="text-xs text-muted-foreground mt-3">— {a.authorName} · {a.authorRole}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <Card className="border-[#D4AF37]/40">
          <CardContent className="pt-6">
            <h3 className="font-serif font-bold text-[#6D2B35] mb-3">Add your answer</h3>
            <AnswerForm questionSlug={q.slug} />
          </CardContent>
        </Card>
      </article>
    </div>
  );
}

function AskQuestionForm({ onClose }: { onClose: () => void }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ title: "", body: "", category: "general", authorName: "", authorEmail: "", website: "" });

  const mutation = useMutation({
    mutationFn: () =>
      fetch("/api/qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j?.message || "Submit failed")));
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Submitted", description: "Your question is awaiting moderation. Thank you." });
      onClose();
      queryClient.invalidateQueries({ queryKey: ["/api/qa"] });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });

  return (
    <div className="space-y-3">
      <div><Label>Your question</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Short, specific question" data-testid="input-q-title" /></div>
      <div><Label>More detail (optional)</Label><Textarea rows={3} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} data-testid="input-q-body" /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Category</Label>
          <select className="w-full h-9 px-3 rounded-md border border-input bg-background text-sm" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.filter((c) => c !== "all").map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div><Label>Your name</Label><Input value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} data-testid="input-q-name" /></div>
      </div>
      <div><Label>Email (not published)</Label><Input type="email" value={form.authorEmail} onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} data-testid="input-q-email" /></div>
      <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <div className="flex flex-row gap-2 flex-wrap">
        <Button onClick={() => mutation.mutate()} disabled={!form.title.trim() || !form.authorName.trim() || !form.authorEmail.trim() || mutation.isPending} data-testid="button-submit-question">
          {mutation.isPending ? "Submitting…" : "Submit question"}
        </Button>
        <Button variant="outline" onClick={onClose}>Cancel</Button>
      </div>
    </div>
  );
}

function AnswerForm({ questionSlug }: { questionSlug: string }) {
  const { toast } = useToast();
  const [form, setForm] = useState({ body: "", authorName: "", authorEmail: "", website: "" });
  const mutation = useMutation({
    mutationFn: () =>
      fetch(`/api/qa/${encodeURIComponent(questionSlug)}/answers`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      }).then((r) => {
        if (!r.ok) return r.json().then((j) => Promise.reject(new Error(j?.message || "Submit failed")));
        return r.json();
      }),
    onSuccess: () => {
      toast({ title: "Submitted", description: "Your answer is awaiting moderation." });
      setForm({ body: "", authorName: "", authorEmail: "", website: "" });
    },
    onError: (e: any) => toast({ title: "Failed", description: e.message, variant: "destructive" }),
  });
  return (
    <div className="space-y-3">
      <Textarea rows={4} value={form.body} onChange={(e) => setForm({ ...form, body: e.target.value })} placeholder="Share your answer thoughtfully" data-testid="input-a-body" />
      <div className="grid grid-cols-2 gap-3">
        <Input placeholder="Your name" value={form.authorName} onChange={(e) => setForm({ ...form, authorName: e.target.value })} data-testid="input-a-name" />
        <Input type="email" placeholder="Email (not published)" value={form.authorEmail} onChange={(e) => setForm({ ...form, authorEmail: e.target.value })} data-testid="input-a-email" />
      </div>
      <input type="text" name="website" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <Button onClick={() => mutation.mutate()} disabled={!form.body.trim() || !form.authorName.trim() || !form.authorEmail.trim() || mutation.isPending} data-testid="button-submit-answer">
        {mutation.isPending ? "Submitting…" : "Submit answer"}
      </Button>
    </div>
  );
}
