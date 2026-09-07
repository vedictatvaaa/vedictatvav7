import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

type ContactItem = {
  panditId: number;
  name: string;
  city: string | null;
  revealedAt: string;
  contactStatus: "revealed";
};
type ContactHistory = { items: ContactItem[]; quota: { used: number; remaining: number; resetsAt?: string | null } };

export default function MyPanditContacts() {
  const [history, setHistory] = useState<ContactHistory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/account/pandit-contacts").then(async response => {
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.message || "Your contact history could not be loaded.");
      return body as ContactHistory;
    }).then(body => { if (active) setHistory(body); }).catch((e: Error) => { if (active) setError(e.message); }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  if (loading) return <div className="animate-pulse space-y-3"><div className="h-20 rounded-xl bg-[#eadcc7]" /><div className="h-24 rounded-xl bg-[#eadcc7]" /></div>;
  if (error) return <p role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error}</p>;
  const items = history?.items || [];
  return <div className="space-y-4">
    <Card><CardContent className="p-5"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#946c16]">Contact allowance</p><h2 className="mt-1 font-serif text-2xl text-[#4a1a22]">{history?.quota.used || 0} of 10 contacts used</h2><p className="mt-1 text-sm text-[#5a4a3a]/70">{history?.quota.remaining || 0} contacts remaining{history?.quota.resetsAt ? ` · Allowance resets on ${new Date(history.quota.resetsAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}.</p></CardContent></Card>
    {items.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-[#5a4a3a]/70">You have not revealed any Panditji contacts yet. <Link href="/book-pandit-online" className="font-semibold text-[#6D2B35] underline">Find a Pandit</Link></CardContent></Card> : <div className="grid gap-3 md:grid-cols-2">{items.map(item => <Card key={item.panditId}><CardContent className="p-4"><div className="flex gap-3"><div className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[#f2e6d2] font-serif text-[#6D2B35]">{item.name.slice(0, 1)}</div><div className="min-w-0 flex-1"><p className="font-semibold text-[#4a1a22]">{item.name}</p><p className="text-xs text-[#5a4a3a]/65">{item.city || "Location unavailable"} · Revealed {new Date(item.revealedAt).toLocaleDateString("en-IN")}</p></div><ExternalLink className="h-4 w-4 text-[#6D2B35]" aria-label="Previously revealed contact" /></div></CardContent></Card>)}</div>}
  </div>;
}