import { useState } from "react";
import { motion } from "framer-motion";
import { Sparkles, Loader2, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import type { CategoryTheme, AdvisorField } from "@/data/category-themes";

type Props = {
  slug: string;
  theme: CategoryTheme;
};

export default function CategoryAdvisor({ slug, theme }: Props) {
  const advisor = theme.advisor;
  const [values, setValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [answer, setAnswer] = useState<string>("");
  const [error, setError] = useState<string>("");

  if (!advisor.enabled) return null;

  const set = (key: string, value: string) => setValues(v => ({ ...v, [key]: value }));

  const missing = advisor.fields
    .filter(f => f.required && !values[f.key]?.trim())
    .map(f => f.label);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (missing.length > 0) {
      setError(`Please fill: ${missing.join(", ")}`);
      return;
    }
    setLoading(true);
    setAnswer("");
    try {
      const res = await fetch("/api/category-advisor", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, fields: values }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Advisor unavailable right now");
      setAnswer(data.answer || "");
    } catch (err: any) {
      setError(err.message || "Could not get a recommendation right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const renderField = (f: AdvisorField) => {
    if (f.kind === "select") {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={`adv-${f.key}`} className="text-sm font-medium">
            {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Select value={values[f.key] || ""} onValueChange={(v) => set(f.key, v)}>
            <SelectTrigger id={`adv-${f.key}`} data-testid={`select-advisor-${f.key}`}>
              <SelectValue placeholder={`Select ${f.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {f.options.map(opt => (
                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      );
    }
    if (f.kind === "date") {
      return (
        <div key={f.key} className="space-y-1.5">
          <Label htmlFor={`adv-${f.key}`} className="text-sm font-medium">
            {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
          </Label>
          <Input id={`adv-${f.key}`} type="date" value={values[f.key] || ""}
            onChange={(e) => set(f.key, e.target.value)}
            data-testid={`input-advisor-${f.key}`} />
        </div>
      );
    }
    return (
      <div key={f.key} className="space-y-1.5">
        <Label htmlFor={`adv-${f.key}`} className="text-sm font-medium">
          {f.label}{f.required && <span className="text-destructive ml-0.5">*</span>}
        </Label>
        <Input id={`adv-${f.key}`} type="text" placeholder={f.placeholder}
          value={values[f.key] || ""}
          onChange={(e) => set(f.key, e.target.value)}
          data-testid={`input-advisor-${f.key}`} />
      </div>
    );
  };

  return (
    <section className="container mx-auto px-4 py-10 sm:py-14" data-testid="section-category-advisor">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.5 }}
      >
        <Card className="overflow-hidden border-2" style={{ borderColor: `${theme.palette.accent}55` }}>
          <div className="grid md:grid-cols-5 gap-0">
            {/* Left: themed banner */}
            <div
              className="md:col-span-2 p-6 sm:p-8 text-white relative overflow-hidden"
              style={{ background: `linear-gradient(135deg, ${theme.palette.bgFrom}, ${theme.palette.bgVia} 60%, ${theme.palette.bgTo})` }}
            >
              <div className="absolute -right-6 -bottom-10 text-[140px] sm:text-[180px] opacity-10 leading-none select-none pointer-events-none">
                {theme.motifEmoji}
              </div>
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] font-semibold px-2.5 py-1 rounded-full"
                  style={{ background: theme.palette.chip, color: theme.palette.accent, border: `1px solid ${theme.palette.accent}55` }}>
                  <Sparkles className="w-3 h-3" /> AI Advisor
                </span>
                <h2 className="font-serif text-2xl sm:text-3xl mt-3 leading-tight">
                  {advisor.title}
                </h2>
                <p className="text-white/80 mt-2 text-sm sm:text-base leading-relaxed">
                  {advisor.subtitle}
                </p>
                <p className="text-white/60 text-[11px] mt-4 leading-relaxed">
                  Powered by Vedic Tatva AI — for guidance only. For major decisions consult a verified pandit or jyotishi.
                </p>
              </div>
            </div>

            {/* Right: form + answer */}
            <div className="md:col-span-3 p-6 sm:p-8">
              <form onSubmit={submit} className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  {advisor.fields.map(renderField)}
                </div>

                {error && (
                  <p className="text-sm text-destructive" data-testid="text-advisor-error">{error}</p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-auto"
                  style={{ background: theme.palette.accent, color: theme.palette.accentInk }}
                  data-testid="button-advisor-submit"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Asking the AI...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 mr-2" /> {advisor.cta}</>
                  )}
                </Button>
              </form>

              {answer && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="mt-6 p-4 sm:p-5 rounded-lg border"
                  style={{ background: `${theme.palette.accent}12`, borderColor: `${theme.palette.accent}40` }}
                  data-testid="text-advisor-answer"
                >
                  <div className="flex items-start gap-2 mb-2">
                    <MessageCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: theme.palette.bgVia }} />
                    <span className="font-semibold text-sm" style={{ color: theme.palette.bgFrom }}>
                      Our AI suggests:
                    </span>
                  </div>
                  <div className="prose prose-sm max-w-none text-foreground whitespace-pre-wrap leading-relaxed">
                    {answer}
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </Card>
      </motion.div>
    </section>
  );
}
