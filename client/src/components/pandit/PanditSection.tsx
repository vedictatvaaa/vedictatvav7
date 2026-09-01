import type { ComponentType, ReactNode } from "react";
import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const surface = "border-[#d8c8ae]/75 bg-[#fffdf8] shadow-[0_8px_24px_rgba(85,37,45,.04)]";

export function PanditSectionHeader({
  eyebrow = "Practice headquarters",
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#946c16]">{eyebrow}</p>
        <h2 className="mt-1 font-serif text-2xl font-semibold tracking-tight text-[#55252d] md:text-3xl">{title}</h2>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-[#806f5e]">{description}</p>
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </div>
  );
}

export function PanditKpiGrid({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`}>{children}</div>;
}

export function PanditKpi({
  label,
  value,
  detail,
  icon: Icon,
  tone = "maroon",
  testId,
}: {
  label: string;
  value: ReactNode;
  detail?: string;
  icon: ComponentType<{ className?: string }>;
  tone?: "maroon" | "gold" | "green";
  testId?: string;
}) {
  const toneClass = tone === "gold" ? "bg-[#e6b957]/20 text-[#946c16]" : tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-[#55252d]/10 text-[#55252d]";
  return (
    <Card className={surface} data-testid={testId}>
      <CardContent className="p-4">
        <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${toneClass}`}><Icon className="h-4 w-4" /></div>
        <p className="text-[10px] font-bold uppercase tracking-[.12em] text-[#806f5e]">{label}</p>
        <p className="mt-1 truncate font-mono text-xl font-semibold tabular-nums text-[#35231d] md:text-2xl">{value}</p>
        {detail && <p className="mt-1 truncate text-[11px] text-[#806f5e]">{detail}</p>}
      </CardContent>
    </Card>
  );
}

export function PanditLoadingState({ label = "Loading your practice…" }: { label?: string }) {
  return (
    <div className="space-y-4" aria-label={label} role="status">
      <div className="h-24 animate-pulse rounded-[1.1rem] bg-[#e8dcc8]" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[1, 2, 3, 4].map((item) => <div key={item} className="h-28 animate-pulse rounded-xl bg-[#e8dcc8]" />)}
      </div>
      <div className="h-56 animate-pulse rounded-xl bg-[#e8dcc8]" />
    </div>
  );
}

export function PanditEmptyState({
  icon: Icon = Inbox,
  title,
  detail,
}: {
  icon?: ComponentType<{ className?: string }>;
  title: string;
  detail: string;
}) {
  return (
    <Card className={surface}>
      <CardContent className="flex flex-col items-center justify-center px-5 py-12 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f2e6d2] text-[#946c16]"><Icon className="h-5 w-5" /></div>
        <p className="mt-4 font-serif text-lg font-semibold text-[#55252d]">{title}</p>
        <p className="mt-1 max-w-md text-sm leading-6 text-[#806f5e]">{detail}</p>
      </CardContent>
    </Card>
  );
}

export function PanditErrorState({ title = "We couldn't load this section", detail, onRetry }: { title?: string; detail?: string; onRetry: () => void }) {
  return (
    <Card className="border-rose-200 bg-rose-50/70">
      <CardContent className="flex flex-col items-start gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-700" />
          <div><p className="font-semibold text-rose-900">{title}</p><p className="mt-1 text-sm text-rose-800/80">{detail || "Please try again in a moment."}</p></div>
        </div>
        <Button variant="outline" onClick={onRetry} className="border-rose-300 bg-transparent text-rose-900 hover:bg-rose-100">Try again</Button>
      </CardContent>
    </Card>
  );
}

export function PanditUnavailableState({ title, detail, action }: { title: string; detail: string; action?: ReactNode }) {
  return (
    <Card className={`${surface} border-dashed`}>
      <CardContent className="px-5 py-12 md:px-10">
        <p className="text-[10px] font-bold uppercase tracking-[.2em] text-[#946c16]">Foundation status</p>
        <h3 className="mt-2 font-serif text-2xl font-semibold text-[#55252d]">{title}</h3>
        <p className="mt-2 max-w-xl text-sm leading-6 text-[#806f5e]">{detail}</p>
        {action && <div className="mt-5">{action}</div>}
      </CardContent>
    </Card>
  );
}

export function PanditInlineLoading({ label }: { label: string }) {
  return <div className="flex items-center justify-center gap-2 rounded-xl border border-[#d8c8ae]/75 bg-[#fffdf8] px-4 py-10 text-sm text-[#806f5e]" role="status"><Loader2 className="h-4 w-4 animate-spin text-[#946c16]" />{label}</div>;
}