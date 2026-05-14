import { useState, useRef, useEffect } from "react";
import { X, Send, Loader2, Sparkles, MessageCircle } from "lucide-react";
import guruMaleImg from "../../assets/images/guru-male.png";
import guruFemaleImg from "../../assets/images/guru-female.png";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [gender, setGender] = useState<"male" | "female" | null>(null);
  const [guideName, setGuideName] = useState("Karthik");
  const [guideTitle, setGuideTitle] = useState("Karthik");
  const [collapsed, setCollapsed] = useState(true);
  const messagesEnd = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const guideImg = gender === "female" ? guruFemaleImg : guruMaleImg;

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: "auto", block: "end" });
  }, [messages, loading]);

  useEffect(() => {
    if (open && gender && inputRef.current) inputRef.current.focus();
  }, [open, gender]);

  useEffect(() => {
    if (!open) {
      collapseTimer.current = setTimeout(() => setCollapsed(true), 5000);
      return () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); };
    }
  }, [open]);

  const handleTabHover = () => {
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    setCollapsed(false);
  };

  const handleTabLeave = () => {
    collapseTimer.current = setTimeout(() => setCollapsed(true), 3000);
  };

  const sendMessage = async (msg?: string) => {
    const text = msg || input.trim();
    if (!text || loading) return;
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    if (!msg) setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: text,
          history: [...messages, userMsg],
          gender: gender || "male",
        }),
      });
      const data = await res.json();
      if (res.ok) {
        if (data.guideName) setGuideName(data.guideName);
        if (data.guideTitle) setGuideTitle(data.guideTitle);
        setMessages(prev => [...prev, { role: "assistant", content: data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: "assistant", content: "The divine connection is momentarily interrupted. Please try again, dear seeker." }]);
      }
    } catch {
      setMessages(prev => [...prev, { role: "assistant", content: "The cosmic energies are realigning. Please try again in a moment." }]);
    } finally {
      setLoading(false);
    }
  };

  const selectGender = (g: "male" | "female") => {
    setGender(g);
    const name = g === "female" ? "Yogini" : "Karthik";
    const title = g === "female" ? "Yogini" : "Karthik";
    setGuideName(name);
    setGuideTitle(title);
  };

  const quickQuestions = [
    "I'm feeling stressed, what should I do?",
    "How do I start my spiritual journey?",
    "Which puja can bring peace at home?",
    "Help me find the right Rudraksha for me",
  ];

  const formatMessage = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*|"[^"]+"|_[^_]+_|॥[^॥]+॥)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-[#6D2B35] font-semibold">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith("_") && part.endsWith("_")) {
        return <em key={i} className="text-[#6D2B35] not-italic font-medium">{part.slice(1, -1)}</em>;
      }
      if (part.startsWith("॥") && part.endsWith("॥")) {
        return <span key={i} className="block text-center text-[#6D2B35] font-serif italic my-1 text-xs">{part}</span>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <>
      {!open && (
        <div className="fixed z-40 bottom-[84px] right-3 lg:bottom-6 lg:right-6" data-testid="chat-tab">
          <button
            onClick={() => setOpen(true)}
            aria-label={`Open chat with ${guideName}`}
            title={`Ask ${guideName}`}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-white hover:bg-[#FBF7EE] border border-[#D4AF37]/50 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
            data-testid="btn-open-chat"
          >
            {gender ? (
              <span className="block w-10 h-10 rounded-full overflow-hidden border border-[#D4AF37]/30">
                <img src={guideImg} alt={guideName} className="w-full h-full object-cover" />
              </span>
            ) : (
              <MessageCircle className="w-5 h-5 text-[#6D2B35]" strokeWidth={1.8} />
            )}
          </button>
        </div>
      )}

      {open && (
        <div className="fixed bottom-20 lg:bottom-6 right-3 sm:right-6 z-50 w-[calc(100vw-1.5rem)] sm:w-[400px] max-h-[70vh] lg:max-h-[80vh] bg-white rounded-md border border-[#D4AF37]/30 flex flex-col overflow-hidden" data-testid="chat-widget">
          <div className="bg-[#6D2B35] px-3 py-2.5 flex items-center justify-between flex-shrink-0 border-b border-[#D4AF37]/30">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full overflow-hidden border border-[#D4AF37]/50 flex-shrink-0">
                {gender ? (
                  <img src={guideImg} alt={guideName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-[#FBF7EE] flex items-center justify-center">
                    <Sparkles className="h-4 w-4 text-[#6D2B35]" strokeWidth={1.8} />
                  </div>
                )}
              </div>
              <div>
                <p className="font-serif font-semibold text-[13px] text-[#D4AF37] leading-tight">{gender ? guideName : "Vedic Guide"}</p>
                <p className="text-[9px] uppercase tracking-[0.2em] text-white/60 mt-0.5">{gender ? `${guideTitle} · Spiritual Guide` : "Choose a guide"}</p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} aria-label="Close chat" className="w-7 h-7 rounded-md hover:bg-white/10 flex items-center justify-center transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60" data-testid="btn-close-chat">
              <X className="h-3.5 w-3.5 text-white/80" strokeWidth={1.8} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-3 min-h-[200px] max-h-[55vh] bg-white" data-testid="chat-messages">
            {!gender && (
              <div className="text-center py-4 px-2">
                <div className="inline-flex items-center gap-2 mb-3">
                  <span className="h-px w-5 bg-[#D4AF37]" />
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">Namaste</p>
                  <span className="h-px w-5 bg-[#D4AF37]" />
                </div>
                <p className="text-[12px] text-[#5a4a3a]/70 mb-4 leading-relaxed">Ask anything — doubts, lessons, guidance, or life problems.</p>
                <div className="grid grid-cols-2 gap-2">
                  {([
                    { g: "male" as const, name: "Karthik", img: guruMaleImg },
                    { g: "female" as const, name: "Yogini", img: guruFemaleImg },
                  ]).map(opt => (
                    <button
                      key={opt.g}
                      onClick={() => selectGender(opt.g)}
                      className="flex flex-col items-center gap-2 p-3 bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md hover:border-[#D4AF37]/50 hover:bg-white transition-colors"
                      data-testid={`gender-${opt.g}`}
                    >
                      <div className="w-14 h-14 rounded-full overflow-hidden border border-[#D4AF37]/30">
                        <img src={opt.img} alt={opt.name} className="w-full h-full object-cover" />
                      </div>
                      <span className="text-[11px] font-serif font-semibold text-[#6D2B35]">{opt.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {gender && messages.length === 0 && (
              <div className="text-center py-2">
                <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-2 border border-[#D4AF37]/40">
                  <img src={guideImg} alt={guideName} className="w-full h-full object-cover object-top" />
                </div>
                <p className="text-[13px] font-serif font-semibold text-[#6D2B35] mb-1">
                  Hi, I'm {guideName}
                </p>
                <p className="text-[11px] text-[#5a4a3a]/65 mb-3 leading-relaxed px-3">
                  {gender === "female"
                    ? "Got a question, a problem, or just need some guidance? Ask me anything."
                    : "Whether it's a doubt, a life problem, or spiritual guidance — ask me anything."}
                </p>
                <div className="flex items-center gap-2 mb-2 px-1">
                  <span className="h-px w-3 bg-[#D4AF37]" />
                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">Try asking</p>
                  <span className="h-px flex-1 bg-[#D4AF37]/20" />
                </div>
                <div className="space-y-1.5">
                  {quickQuestions.map((q, i) => (
                    <button
                      key={i}
                      onClick={() => sendMessage(q)}
                      className="block w-full text-left px-3 py-2 text-[12px] bg-[#FBF7EE] rounded-md text-[#5a4a3a] hover:bg-white hover:text-[#6D2B35] transition-colors border border-[#D4AF37]/15 hover:border-[#D4AF37]/40"
                      data-testid={`quick-q-${i}`}
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-full overflow-hidden border border-[#D4AF37]/40 mr-2 flex-shrink-0 mt-0.5">
                    <img src={guideImg} alt={guideName} className="w-full h-full object-cover object-top" />
                  </div>
                )}
                <div className={`max-w-[80%] px-3 py-2 text-[13px] leading-relaxed whitespace-pre-line rounded-md ${
                  msg.role === "user"
                    ? "bg-[#6D2B35] text-[#FBF7EE]"
                    : "bg-[#FBF7EE] text-[#3d2e20] border border-[#D4AF37]/15"
                }`} data-testid={`chat-msg-${i}`}>
                  {msg.role === "assistant" ? formatMessage(msg.content) : msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex justify-start">
                <div className="bg-[#FBF7EE] px-3 py-1.5 rounded-md border border-[#D4AF37]/15 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 text-[#6D2B35] animate-spin" strokeWidth={1.8} />
                  <span className="text-[11px] text-[#6D2B35]/70">{guideName} is reflecting…</span>
                </div>
              </div>
            )}
            <div ref={messagesEnd} />
          </div>

          {gender && (
            <div className="border-t border-[#D4AF37]/20 p-2.5 flex-shrink-0 bg-[#FBF7EE]">
              <form onSubmit={e => { e.preventDefault(); sendMessage(); }} className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={e => setInput(e.target.value)}
                  placeholder={`Ask ${guideName}…`}
                  className="flex-1 px-3 h-10 text-[13px] rounded-md border border-[#D4AF37]/30 bg-white focus:outline-none focus:border-[#6D2B35] focus:ring-1 focus:ring-[#6D2B35]/20 text-[#3d2e20] placeholder:text-[#5a4a3a]/40"
                  disabled={loading}
                  data-testid="input-chat"
                />
                <button
                  type="submit"
                  disabled={!input.trim() || loading}
                  aria-label="Send message"
                  className="w-10 h-10 rounded-md bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] flex items-center justify-center transition-colors disabled:opacity-40 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60"
                  data-testid="btn-send-chat"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.8} /> : <Send className="h-4 w-4" strokeWidth={1.8} />}
                </button>
              </form>
            </div>
          )}
        </div>
      )}
    </>
  );
}
