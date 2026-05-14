import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquare, Loader2, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface QA {
  id: number;
  productId: number;
  askerName: string;
  question: string;
  answer: string | null;
  answeredBy: string | null;
  answeredAt: string | null;
  helpful: number;
  createdAt: string;
}

export function PersistentProductQA({ productId, defaultName, defaultEmail }: { productId: number; defaultName?: string; defaultEmail?: string }) {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [q, setQ] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: questionsData, isLoading } = useQuery<QA[]>({
    queryKey: ["/api/product-questions", productId],
    queryFn: async () => {
      try {
        const r = await fetch(`/api/product-questions/${productId}`);
        if (!r.ok) return [];
        const j = await r.json();
        return Array.isArray(j) ? j : [];
      } catch {
        return [];
      }
    },
  });
  const questions: QA[] = Array.isArray(questionsData) ? questionsData : [];

  async function submit() {
    if (name.trim().length < 2) { toast({ title: "Please add your name" }); return; }
    if (q.trim().length < 5) { toast({ title: "Please write a question (min 5 characters)" }); return; }
    setSubmitting(true);
    try {
      const r = await fetch("/api/product-questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId, askerName: name.trim(), askerEmail: email.trim() || undefined, question: q.trim() }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.message || "Could not submit");
      toast({ title: "Thanks", description: d._info || "We'll publish the answer soon." });
      setQ(""); setOpen(false);
      qc.invalidateQueries({ queryKey: ["/api/product-questions", productId] });
    } catch (e: any) {
      toast({ title: "Could not submit", description: e?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Card data-testid="card-product-qa-persistent">
      <CardContent className="p-5">
        <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4 text-[#6D2B35]" />
            <h3 className="font-serif font-bold text-[#4a1a22]">Customer Questions & Answers</h3>
          </div>
          <Button variant="outline" size="sm" onClick={() => setOpen((v) => !v)} data-testid="button-toggle-ask">
            {open ? "Cancel" : "Ask a question"}
          </Button>
        </div>

        {open && (
          <div className="border border-[#D4AF37]/25 rounded-md bg-[#FBF7EE] p-3 mb-4 space-y-2" data-testid="form-ask-question">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} maxLength={100} data-testid="input-asker-name" />
              <Input type="email" placeholder="Email (optional)" value={email} onChange={(e) => setEmail(e.target.value)} maxLength={200} data-testid="input-asker-email" />
            </div>
            <Textarea placeholder="What would you like to know?" value={q} onChange={(e) => setQ(e.target.value)} maxLength={1000} rows={3} data-testid="textarea-question" />
            <div className="flex justify-end">
              <Button onClick={submit} disabled={submitting} data-testid="button-submit-question">
                {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Submit question"}
              </Button>
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="text-sm text-[#5a4a3a]/60" data-testid="qa-loading">Loading questions...</div>
        ) : questions.length === 0 ? (
          <div className="text-sm text-[#5a4a3a]/70" data-testid="qa-empty">
            No questions yet. Be the first to ask — answers come from our team and verified buyers.
          </div>
        ) : (
          <div className="space-y-3" data-testid="qa-list">
            {questions.map((item) => (
              <div key={item.id} className="border-l-2 border-[#D4AF37]/40 pl-3" data-testid={`qa-item-${item.id}`}>
                <div className="text-sm font-medium text-[#4a1a22]" data-testid={`qa-question-${item.id}`}>
                  Q. {item.question}
                </div>
                <div className="text-xs text-[#5a4a3a]/60 mt-0.5">— {item.askerName}</div>
                {item.answer && (
                  <div className="mt-2 bg-[#FBF7EE]/60 rounded-md p-2.5" data-testid={`qa-answer-${item.id}`}>
                    <div className="flex items-center gap-1.5 mb-1">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="text-[11px] font-semibold text-emerald-700">Answer from {item.answeredBy?.includes("@") ? "Vedic Tatva Team" : (item.answeredBy || "Vedic Tatva Team")}</span>
                    </div>
                    <div className="text-sm text-[#5a4a3a] whitespace-pre-wrap">{item.answer}</div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
