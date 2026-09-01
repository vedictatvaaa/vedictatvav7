import { AlertTriangle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export type RequiredAction = { key: string; label: string; count: number; filter: { status?: string; view?: string } };
export function ActionRequired({ actions, onSelect }: { actions?: RequiredAction[]; onSelect: (filter: RequiredAction["filter"]) => void }) {
  if (!actions?.length) return null;
  return <section className="rounded-xl border border-[#d4af37]/40 bg-[#6d2b35] p-4 text-[#fff7e7]" aria-label="Action required">
    <div className="mb-3 flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-[#d4af37]" /><h2 className="font-serif text-lg">Action required</h2><span className="text-xs text-[#f6df9b]">Live operational queues</span></div>
    <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-5">{actions.map((action) =>
      <Button key={action.key} variant="ghost" onClick={() => onSelect(action.filter)} className="h-auto min-w-0 justify-between whitespace-normal border border-[#d4af37]/25 bg-white/5 px-3 py-2 text-left text-[#fff7e7] hover:bg-white/10 hover:text-white">
        <span className="min-w-0"><span className="block text-lg font-semibold text-[#f6d46b]">{action.count}</span><span className="block text-xs leading-tight">{action.label}</span></span><ArrowRight className="h-4 w-4 shrink-0 text-[#d4af37]" />
      </Button>)}</div>
  </section>;
}