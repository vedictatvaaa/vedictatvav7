import { Sparkles } from "lucide-react";

interface QuickAnswerProps {
  text: string;
  className?: string;
  testId?: string;
}

export default function QuickAnswer({ text, className = "", testId = "quick-answer" }: QuickAnswerProps) {
  if (!text) return null;
  return (
    <section className={`pt-6 ${className}`}>
      <div
        className="max-w-3xl mx-auto rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] p-5 sm:p-6"
        data-testid={testId}
      >
        <div className="flex items-center gap-2 mb-2">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" aria-hidden="true" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-semibold text-[#D4AF37]">
            Quick Answer
          </span>
        </div>
        <p className="text-[14px] leading-relaxed text-[#5a4a3a]">{text}</p>
      </div>
    </section>
  );
}
