import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Bot, ExternalLink, CheckCircle2, FileText } from "lucide-react";

const AI_CRAWLERS = [
  { name: "GPTBot (ChatGPT training)", agent: "GPTBot", allowed: true },
  { name: "ChatGPT-User (ChatGPT browse)", agent: "ChatGPT-User", allowed: true },
  { name: "OAI-SearchBot (ChatGPT Search)", agent: "OAI-SearchBot", allowed: true },
  { name: "Google-Extended (Bard / Gemini)", agent: "Google-Extended", allowed: true },
  { name: "ClaudeBot (Anthropic)", agent: "ClaudeBot", allowed: true },
  { name: "Claude-Web", agent: "Claude-Web", allowed: true },
  { name: "anthropic-ai", agent: "anthropic-ai", allowed: true },
  { name: "PerplexityBot", agent: "PerplexityBot", allowed: true },
  { name: "Perplexity-User", agent: "Perplexity-User", allowed: true },
  { name: "Applebot-Extended (Apple Intelligence)", agent: "Applebot-Extended", allowed: true },
  { name: "CCBot (Common Crawl)", agent: "CCBot", allowed: true },
];

export function AiSeoTab() {
  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><Bot className="h-4 w-4 text-[#6D2B35]" /> AI / LLM crawler access</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            Visibility in ChatGPT, Claude, Perplexity, Gemini and Apple Intelligence answers depends on these bots being allowed to read your public content.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid sm:grid-cols-2 gap-2">
            {AI_CRAWLERS.map((c) => (
              <div key={c.agent} className="flex items-center justify-between text-sm rounded-md border bg-card px-3 py-2" data-testid={`row-crawler-${c.agent}`}>
                <span>{c.name}</span>
                {c.allowed
                  ? <Badge variant="default" className="gap-1"><CheckCircle2 className="h-3 w-3" /> Allowed</Badge>
                  : <Badge variant="destructive">Blocked</Badge>}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/robots.txt" target="_blank" rel="noreferrer">View robots.txt <ExternalLink className="h-3 w-3 ml-1.5" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><FileText className="h-4 w-4 text-[#6D2B35]" /> llms.txt — AI discovery file</CardTitle>
          <p className="text-xs text-muted-foreground mt-1">
            An auto-generated overview of your site (services, categories, products, pandits) at <code>/llms.txt</code>. ChatGPT, Claude and Perplexity look for this file to understand what your site is about.
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a href="/llms.txt" target="_blank" rel="noreferrer">View llms.txt <ExternalLink className="h-3 w-3 ml-1.5" /></a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href="/api/ai/product-summary/1-mukhi-rudraksha-original-nepal" target="_blank" rel="noreferrer">Sample AI product summary <ExternalLink className="h-3 w-3 ml-1.5" /></a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base">Tips to rank in AI answers</CardTitle></CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• Use the Per-Product SEO tab to add <strong>FAQ schema</strong> to top products — LLMs love structured Q&amp;A and quote them in answers.</p>
          <p>• Make sure each product has a <strong>focus keyword</strong> set — this signals what query the page should answer.</p>
          <p>• Track backlinks from authoritative spiritual / Hindu publications in the <strong>Off-Page</strong> tab — citations matter to AI ranking.</p>
          <p>• Monitor zero-result searches in the <strong>Autocomplete</strong> tab — every gap is a content opportunity.</p>
          <p>• Run the <strong>Notify Google &amp; Bing</strong> button after major content updates so your changes appear in AI answers within hours.</p>
        </CardContent>
      </Card>
    </div>
  );
}
