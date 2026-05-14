import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sparkles, Loader2 } from "lucide-react";

interface QA { question: string; answer: string }

export function ProductQAWidget({ slug }: { slug: string }) {
  const [question, setQuestion] = useState("");
  const [history, setHistory] = useState<QA[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function ask() {
    const q = question.trim();
    if (q.length < 3) return;
    setLoading(true); setError(null);
    try {
      const r = await fetch(`/api/ai/product-qa/${encodeURIComponent(slug)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Could not answer");
      setHistory((h) => [{ question: q, answer: d.answer }, ...h]);
      setQuestion("");
    } catch (e: any) {
      setError(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card data-testid="card-product-qa">
      <CardContent className="p-5">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles className="h-4 w-4 text-[#D4AF37]" />
          <h3 className="font-serif font-bold text-[#4a1a22]">Ask About This Product</h3>
        </div>
        <p className="text-sm text-[#5a4a3a]/70 mb-3">Get instant answers about ingredients, usage, rituals, and more.</p>
        <div className="flex gap-2 flex-wrap">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !loading) ask(); }}
            placeholder="e.g. Is this samagri suitable for daily hawan?"
            maxLength={500}
            disabled={loading}
            data-testid="input-product-question"
            className="flex-1 min-w-[200px]"
          />
          <Button onClick={ask} disabled={loading || question.trim().length < 3} data-testid="button-ask-product">
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ask"}
          </Button>
        </div>
        {error && <div className="text-sm text-red-600 mt-2" data-testid="text-qa-error">{error}</div>}
        {history.length > 0 && (
          <div className="mt-4 space-y-3">
            {history.map((qa, i) => (
              <div key={i} className="border-l-2 border-[#D4AF37]/40 pl-3" data-testid={`qa-pair-${i}`}>
                <div className="text-sm font-medium text-[#4a1a22]">{qa.question}</div>
                <div className="text-sm text-[#5a4a3a] mt-1 whitespace-pre-wrap">{qa.answer}</div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
