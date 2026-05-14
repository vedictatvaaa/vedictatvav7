import { useState, useRef, useEffect } from "react";
import { Sparkles, Send, Copy, RotateCcw, Check } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type Preset =
  | "general"
  | "product_description"
  | "email_campaign"
  | "blog_topics"
  | "translate_hindi"
  | "summarize";

const PRESETS: Array<{ id: Preset; label: string; hint: string }> = [
  { id: "general",             label: "General Helper",      hint: "Ask anything — copy, ideas, drafts" },
  { id: "product_description", label: "Product Description", hint: "Tagline + description + 5 highlights" },
  { id: "email_campaign",      label: "Email Campaign",      hint: "Subject + preview + HTML body" },
  { id: "blog_topics",         label: "Blog Topics",         hint: "8 click-worthy headline ideas" },
  { id: "translate_hindi",     label: "Translate to Hindi",  hint: "English → Devanagari" },
  { id: "summarize",           label: "Summarize",           hint: "Bullets + one next-action line" },
];

type ChatMessage = { role: "user" | "assistant"; content: string };

function AiAssistantTab({ adminToken }: { adminToken?: string }) {
  const { toast } = useToast();
  const [preset, setPreset] = useState<Preset>("general");
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const next: ChatMessage[] = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setLoading(true);
    try {
      const r = await fetch("/api/admin/ai/assistant", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(adminToken ? { "x-admin-token": adminToken } : {}),
        },
        body: JSON.stringify({ messages: next, preset }),
      });
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        throw new Error(j.message || `Request failed (${r.status})`);
      }
      const j = await r.json();
      setMessages([...next, { role: "assistant", content: j.reply || "(empty response)" }]);
    } catch (err: any) {
      toast({
        title: "AI request failed",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setMessages(next);
    } finally {
      setLoading(false);
    }
  };

  const copyReply = async (idx: number, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx((c) => (c === idx ? null : c)), 1500);
    } catch {
      toast({ title: "Copy failed", description: "Clipboard unavailable in this browser.", variant: "destructive" });
    }
  };

  const resetChat = () => {
    setMessages([]);
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
      e.preventDefault();
      send();
    }
  };

  const activePreset = PRESETS.find((p) => p.id === preset) || PRESETS[0];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-3xl font-serif text-primary flex items-center gap-2" data-testid="page-title-ai-assistant">
            <Sparkles className="w-7 h-7" />
            AI Assistant
          </h1>
          <p className="text-sm text-muted-foreground max-w-2xl mt-1">
            ChatGPT-powered helper for product copy, email drafts, blog topics, Hindi translation, and quick summaries.
            It only produces text — your code, settings, and database are never touched.
          </p>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={resetChat}
            data-testid="button-ai-reset"
          >
            <RotateCcw className="w-4 h-4 mr-1.5" />
            New chat
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Mode</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p.id}
                onClick={() => setPreset(p.id)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium border transition-colors hover-elevate ${
                  preset === p.id
                    ? "bg-primary/10 text-primary border-primary/30"
                    : "bg-card text-muted-foreground border-border"
                }`}
                data-testid={`preset-${p.id}`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{activePreset.hint}</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0 flex flex-col h-[60vh]">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3" data-testid="chat-scroll">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground gap-2 py-8">
                <Sparkles className="w-10 h-10 opacity-40" />
                <p className="text-sm">Pick a mode above and ask away.</p>
                <p className="text-xs">Press Enter to send · Shift+Enter for newline</p>
              </div>
            )}
            {messages.map((m, idx) => (
              <div
                key={idx}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                data-testid={`message-${m.role}-${idx}`}
              >
                <div
                  className={`max-w-[85%] rounded-md px-3 py-2 text-sm whitespace-pre-wrap break-words ${
                    m.role === "user"
                      ? "bg-primary/10 text-foreground border border-primary/20"
                      : "bg-muted text-foreground border border-border"
                  }`}
                >
                  {m.content}
                  {m.role === "assistant" && (
                    <div className="mt-2 pt-2 border-t border-border/60 flex justify-end">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => copyReply(idx, m.content)}
                        data-testid={`button-copy-${idx}`}
                      >
                        {copiedIdx === idx ? (
                          <><Check className="w-3.5 h-3.5 mr-1" /> Copied</>
                        ) : (
                          <><Copy className="w-3.5 h-3.5 mr-1" /> Copy</>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start" data-testid="message-loading">
                <div className="max-w-[85%] rounded-md px-3 py-2 text-sm bg-muted text-muted-foreground border border-border">
                  Thinking…
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-border p-3 flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={onKeyDown}
              placeholder={
                preset === "product_description" ? "Paste product name or rough notes…" :
                preset === "email_campaign"      ? "What's the email about? (e.g. Diwali sale)" :
                preset === "blog_topics"         ? "What theme or audience?" :
                preset === "translate_hindi"     ? "Paste English text to translate…" :
                preset === "summarize"           ? "Paste text to summarize…" :
                "Type your message…"
              }
              rows={2}
              className="resize-none min-h-[60px]"
              disabled={loading}
              data-testid="input-ai-message"
            />
            <Button
              onClick={send}
              disabled={loading || !input.trim()}
              data-testid="button-ai-send"
            >
              <Send className="w-4 h-4 mr-1.5" />
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AiAssistantTab;
