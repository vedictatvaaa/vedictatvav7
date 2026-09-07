import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ExternalLink, MessageCircle, Phone } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ContactItem = {
  pandit: { name: string; slug: string; city: string; state: string; image?: string | null };
  revealedAt: string;
  contact: { phone?: string; whatsapp?: string };
};
type ContactHistory = { items: ContactItem[]; used: number; remaining: number; limit: number; resetAt?: string | null };

export default function MyPanditContacts() {
  const [history, setHistory] = useState<ContactHistory | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    fetch("/api/me/pandit-contacts").then(async response => {
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
    <Card><CardContent className="p-5"><p className="text-[11px] font-bold uppercase tracking-[.18em] text-[#946c16]">Contact allowance</p><h2 className="mt-1 font-serif text-2xl text-[#4a1a22]">{history?.used || 0} of {history?.limit || 10} contacts used</h2><p className="mt-1 text-sm text-[#5a4a3a]/70">{history?.remaining || 0} contacts remaining{history?.resetAt ? ` · Allowance resets on ${new Date(history.resetAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}` : ""}.</p></CardContent></Card>
    {items.length === 0 ? <Card><CardContent className="p-8 text-center text-sm text-[#5a4a3a]/70">You have not revealed any Panditji contacts yet. <Link href="/book-pandit-online" className="font-semibold text-[#6D2B35] underline">Find a Pandit</Link></CardContent></Card> : <div className="grid gap-3 md:grid-cols-2">{items.map(item => <Card key={item.pandit.slug}><CardContent className="p-4"><div className="flex gap-3"><div className="h-11 w-11 shrink-0 overflow-hidden rounded-full bg-[#f2e6d2]">{item.pandit.image && <img src={item.pandit.image} alt="" className="h-full w-full object-cover" />}</div><div className="min-w-0 flex-1"><Link href={`/pandit/${item.pandit.slug}`} className="font-semibold text-[#4a1a22] hover:underline">{item.pandit.name}</Link><p className="text-xs text-[#5a4a3a]/65">{[item.pandit.city, item.pandit.state].filter(Boolean).join(", ") || "Location unavailable"} · Revealed {new Date(item.revealedAt).toLocaleDateString("en-IN")}</p></div><Link href={`/pandit/${item.pandit.slug}`} aria-label={`View ${item.pandit.name}'s profile`}><ExternalLink className="h-4 w-4 text-[#6D2B35]" /></Link></div><div className="mt-4 flex flex-wrap gap-2">{item.contact.phone && <Button asChild size="sm" variant="outline"><a href={`tel:${item.contact.phone}`}><Phone className="mr-1 h-3.5 w-3.5" />Call</a></Button>}{item.contact.whatsapp && <Button asChild size="sm" variant="outline"><a href={`https://wa.me/${item.contact.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer"><MessageCircle className="mr-1 h-3.5 w-3.5" />WhatsApp</a></Button>}</div></CardContent></Card>)}</div>}
  </div>;
}