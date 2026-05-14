import { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "wouter";
import { Calendar, MapPin, Calculator, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type City = { name: string; state?: string; country?: string; lat: number; lon: number; tz: string };
type Tradition = "pitru-paksha" | "pratisamvatsarik";

export function CompactTithiCalculator({
  variant = "section",
  testIdPrefix = "tithi",
}: {
  variant?: "section" | "embed";
  testIdPrefix?: string;
}) {
  const [, navigate] = useLocation();
  const [date, setDate] = useState("");
  const [placeQ, setPlaceQ] = useState("");
  const [picked, setPicked] = useState<City | null>(null);
  const [tradition, setTradition] = useState<Tradition>("pitru-paksha");
  const [opts, setOpts] = useState<City[]>([]);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const tRef = useRef<number | null>(null);

  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/tools/places?q=${encodeURIComponent(placeQ)}`);
        if (r.ok) setOpts(await r.json());
      } catch {}
    }, 150);
    return () => { if (tRef.current) window.clearTimeout(tRef.current); };
  }, [placeQ]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date) { setErr("Please enter the departure date."); return; }
    if (!picked || !picked.name) { setErr("Please pick a city from the dropdown."); return; }
    setErr(null);
    const sp = new URLSearchParams({
      date, place: picked.name, lat: String(picked.lat), lon: String(picked.lon),
      tz: picked.tz, tradition,
    });
    navigate(`/tools/tithi-calculator?${sp.toString()}`);
  };

  const inner = (
    <div className="container mx-auto px-4 max-w-5xl">
      <div className="text-center mb-6 md:mb-8">
        <div className="flex items-center justify-center gap-2.5 mb-3">
          <span className="h-px w-6 bg-[#D4AF37]" />
          <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Free Vedic Tool</span>
          <span className="h-px w-6 bg-[#D4AF37]" />
        </div>
        <h2 className="font-serif text-2xl md:text-3xl text-[#6D2B35] font-bold">Pitru Tithi &amp; Annual Shradh Calculator</h2>
        <p className="text-[14px] md:text-[15px] text-[#5a4a3a]/85 mt-2 max-w-2xl mx-auto">
          Find the exact tithi of your ancestor&rsquo;s departure and the next 5 yearly Shradh dates. Choose the tradition your family observes &mdash; we&rsquo;ll send free reminders 7 days, 1 day &amp; on the day, every year.
        </p>
      </div>

      <Card className="border-[#D4AF37]/30 shadow-sm">
        <div className="p-5 md:p-7">
          <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor={`${testIdPrefix}-date`} className="text-[#5a4a3a] text-[10px] font-semibold uppercase tracking-wide">Departure date</Label>
              <div className="relative mt-1.5">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/40 pointer-events-none" />
                <Input id={`${testIdPrefix}-date`} type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9" data-testid={`input-${testIdPrefix}-date`} />
              </div>
            </div>
            <div>
              <Label htmlFor={`${testIdPrefix}-place`} className="text-[#5a4a3a] text-[10px] font-semibold uppercase tracking-wide">Place of departure</Label>
              <div className="relative mt-1.5">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/40 pointer-events-none" />
                <Input
                  id={`${testIdPrefix}-place`}
                  type="text"
                  placeholder="e.g. Varanasi"
                  value={placeQ}
                  onChange={(e) => { setPlaceQ(e.target.value); setOpen(true); setPicked(null); }}
                  onFocus={() => setOpen(true)}
                  onBlur={() => window.setTimeout(() => setOpen(false), 150)}
                  className="pl-9"
                  autoComplete="off"
                  data-testid={`input-${testIdPrefix}-place`}
                />
                {open && opts.length > 0 && (
                  <div className="absolute z-30 mt-1 w-full bg-white rounded-md border border-[#D4AF37]/30 shadow-lg max-h-64 overflow-auto">
                    {opts.map((c) => (
                      <button
                        type="button"
                        key={`${c.name}-${c.lat}`}
                        onMouseDown={(e) => { e.preventDefault(); setPlaceQ(c.name); setPicked(c); setOpen(false); }}
                        className="w-full text-left px-3 py-2 hover-elevate text-sm"
                        data-testid={`option-${testIdPrefix}-city-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
                      >
                        <div className="font-semibold text-[#6D2B35]">{c.name}</div>
                        <div className="text-[11px] text-[#5a4a3a]/70">{c.state}{c.country ? `, ${c.country}` : ""} &bull; {c.tz}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {picked && <div className="text-[10px] text-[#5a4a3a]/60 mt-1">Timezone: {picked.tz}</div>}
            </div>
            <div className="flex flex-col">
              <Label className="text-[#5a4a3a] text-[10px] font-semibold uppercase tracking-wide">Tradition</Label>
              <div className="mt-1.5 grid grid-cols-2 gap-2 flex-1">
                {([
                  { id: "pitru-paksha", label: "Pitru Paksha", sub: "Sept-Oct" },
                  { id: "pratisamvatsarik", label: "Pratisamvatsarik", sub: "Death-month tithi" },
                ] as { id: Tradition; label: string; sub: string }[]).map((t) => {
                  const active = tradition === t.id;
                  return (
                    <button
                      type="button"
                      key={t.id}
                      onClick={() => setTradition(t.id)}
                      data-testid={`button-${testIdPrefix}-tradition-${t.id}`}
                      className={`text-left rounded-md border-2 px-2.5 py-2 transition-colors ${active ? "bg-white border-[#6D2B35]" : "bg-white/70 border-[#D4AF37]/25 hover-elevate"}`}
                    >
                      <div className="font-semibold text-[#6D2B35] text-[12px] leading-tight">{t.label}</div>
                      <div className="text-[10px] text-[#5a4a3a]/70 mt-0.5 leading-tight">{t.sub}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="md:col-span-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-1">
              <p className="text-[11px] text-[#5a4a3a]/65 max-w-xl">
                <strong className="text-[#6D2B35]">Pitru Paksha:</strong> matching tithi during Ashvin Krishna fortnight (Sept-Oct) &mdash; common in North Indian / Smarta tradition.
                <br />
                <strong className="text-[#6D2B35]">Pratisamvatsarik:</strong> same tithi in the same Hindu month of death &mdash; common in Bengali, Maithili, Marathi &amp; many South Indian families.
              </p>
              <Button type="submit" className="bg-[#6D2B35] hover:bg-[#5a232b] text-white font-bold tracking-wide" data-testid={`button-${testIdPrefix}-compute`}>
                <Calculator className="w-4 h-4 mr-2" /> Compute Shradh Dates
              </Button>
            </div>
            {err && <div className="md:col-span-3 text-[12px] text-[#9b1c2e]" data-testid={`text-${testIdPrefix}-error`}>{err}</div>}
          </form>
        </div>
      </Card>

      <div className="text-center mt-4">
        <Link href="/tools/tithi-calculator" className="text-[12px] text-[#6D2B35] font-semibold hover:text-[#D4AF37] inline-flex items-center gap-1" data-testid={`link-${testIdPrefix}-full`}>
          Open the full calculator with Pitru Dosh assessment <ArrowRight className="w-3 h-3" />
        </Link>
      </div>
    </div>
  );

  if (variant === "embed") {
    return (
      <section className="py-8 md:py-10" data-testid={`section-${testIdPrefix}`}>
        {inner}
      </section>
    );
  }

  return (
    <section className="py-10 md:py-14 bg-[#FBF7EE] border-y border-[#D4AF37]/20" data-testid={`section-${testIdPrefix}`}>
      {inner}
    </section>
  );
}
