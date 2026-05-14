import { useState, useEffect, useRef } from "react";
import { Link } from "wouter";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Calculator, Calendar, MapPin, Clock, Bell, ArrowRight, Sparkles, Star, Trash2, Plus, ShieldAlert, ChevronRight, Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PageSeo from "@/components/PageSeo";
import { faqPage, breadcrumbList, softwareApplication } from "@/lib/seo-schemas";

type ShradhDate = { year: number; date: string; weekday: string; tithiName: string; paksha: string; isPitruPaksha: boolean };
type Tithi = { tithiNumber: number; tithiInPaksha: number; tithiName: string; paksha: string; nakshatraName: string; hinduMonth: string };
type DoshRec = { title: string; body: string; href?: string };
type Dosh = { hasPitruDosh: boolean; severity: "low" | "moderate" | "high"; indicators: string[]; recommendations: DoshRec[]; recommendedPackage: { slug: string; title: string; href: string } };
type ShradhTradition = "pitru-paksha" | "pratisamvatsarik";
type CalcResult = { place: { name: string; lat: number; lon: number; tz: string }; tithi: Tithi; dosh: Dosh; shradhDates: ShradhDate[]; tradition?: ShradhTradition; computedAt: string };

type Ancestor = {
  id: number; userId: number; name: string; relation: string; gotra: string | null;
  departureDate: string; departureTime: string | null; departurePlace: string;
  tithiNumber: number | null; tithiName: string | null; paksha: string | null; nakshatraName: string | null;
  notifyWhatsapp: boolean; notifyEmail: boolean; notes: string | null;
  nextShradh: ShradhDate | null;
};

const RELATIONS = ["Father", "Mother", "Grandfather", "Grandmother", "Spouse", "Brother", "Sister", "Son", "Daughter", "Uncle", "Aunt", "Other"];

const PAGE_TITLE = "Free Pitru Tithi Calculator & Annual Shradh Reminders | Vedic Tatva";
const PAGE_DESC = "Compute the exact Vedic tithi, paksha and nakshatra of your ancestor's departure. Get the next 5 annual Shradh dates, a Pitru Dosh assessment, and free yearly WhatsApp + email reminders.";
const PAGE_URL = "https://vedictatva.com/tools/tithi-calculator";

const FAQ_ITEMS: { q: string; a: string }[] = [
  { q: "What is a Shradh tithi and why does it matter?", a: "Shradh tithi is the lunar tithi (date) on which an ancestor departed. The annual Shradh — performed on this same tithi during Pitru Paksha each year — is shastric prescription for ancestral peace and to protect descendants from Pitru Dosh." },
  { q: "How does the calculator find the right tithi?", a: "We use Swiss Ephemeris with Lahiri ayanamsa — the same standard used by all serious panchang publishers — to compute the position of the Sun and Moon at the exact moment of departure at your chosen place. The tithi is determined from the angular distance between them (each tithi spans 12°)." },
  { q: "Why does the date shift each year?", a: "Tithis follow the lunar calendar (~354 days), so the Gregorian date shifts ~11 days earlier each year. We compute the matching tithi within the Pitru Paksha window for each upcoming year so you always see the correct date." },
  { q: "When will I get reminders?", a: "Once you save an ancestor and sign in, our scheduler automatically sends free reminders 7 days before, 1 day before, and on the day of every annual Shradh — by WhatsApp and email. You can edit or remove ancestors anytime from your dashboard." },
  { q: "Is my data shared?", a: "No. Ancestor records are private to your account, never shared, never used for marketing. Reminders are sent only to your registered email and phone." },
];

type CityMatch = { name: string; state?: string; country?: string; lat: number; lon: number; tz: string };

function CityAutocomplete({ value, onPick, testId }: { value: string; onPick: (c: CityMatch) => void; testId?: string }) {
  const [q, setQ] = useState(value);
  const [open, setOpen] = useState(false);
  const [opts, setOpts] = useState<CityMatch[]>([]);
  const tRef = useRef<number | null>(null);
  useEffect(() => { setQ(value); }, [value]);
  useEffect(() => {
    if (tRef.current) window.clearTimeout(tRef.current);
    tRef.current = window.setTimeout(async () => {
      try {
        const r = await fetch(`/api/tools/places?q=${encodeURIComponent(q)}`);
        if (r.ok) setOpts(await r.json());
      } catch {}
    }, 150);
    return () => { if (tRef.current) window.clearTimeout(tRef.current); };
  }, [q]);
  return (
    <div className="relative">
      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/40 pointer-events-none" />
      <Input
        type="text"
        placeholder="Type a city e.g. Varanasi"
        value={q}
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          // Clear stale picked-city when the user edits text after selecting,
          // so submission is blocked until they pick again from the dropdown.
          onPick({ name: "", lat: 0, lon: 0, tz: "" });
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        className="pl-9"
        data-testid={testId}
        autoComplete="off"
      />
      {open && opts.length > 0 && (
        <div className="absolute z-20 mt-1 w-full bg-white rounded-md border border-[#D4AF37]/30 shadow-lg max-h-64 overflow-auto">
          {opts.map((c) => (
            <button
              type="button"
              key={`${c.name}-${c.lat}`}
              onMouseDown={(e) => { e.preventDefault(); setQ(c.name); setOpen(false); onPick(c); }}
              className="w-full text-left px-3 py-2 hover-elevate text-sm"
              data-testid={`option-city-${c.name.toLowerCase().replace(/\s+/g, "-")}`}
            >
              <div className="font-semibold text-[#6D2B35]">{c.name}</div>
              <div className="text-[11px] text-[#5a4a3a]/70">{c.state}{c.country ? `, ${c.country}` : ""} • {c.tz}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TithiCalculator() {
  const { user, openAuth } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  // ----- calculator form state -----
  const [date, setDate] = useState("");
  const [time, setTime] = useState("12:00");
  const [place, setPlace] = useState("");
  const [pickedCity, setPickedCity] = useState<CityMatch | null>(null);
  const [tradition, setTradition] = useState<ShradhTradition>("pitru-paksha");
  const [result, setResult] = useState<CalcResult | null>(null);

  // Prefill from query params (when arriving from the home-page compact widget
  // or the site-wide ribbon). We accept ?date, ?place, ?lat, ?lon, ?tz, ?tradition.
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const qd = sp.get("date"); if (qd) setDate(qd);
      const qp = sp.get("place"); const qlat = sp.get("lat"); const qlon = sp.get("lon"); const qtz = sp.get("tz");
      if (qp) {
        setPlace(qp);
        if (qlat && qlon && qtz) setPickedCity({ name: qp, lat: Number(qlat), lon: Number(qlon), tz: qtz });
      }
      const qt = sp.get("tradition");
      if (qt === "pratisamvatsarik" || qt === "pitru-paksha") setTradition(qt);
    } catch {}
  }, []);

  // ----- ancestor save state (only used when signed in) -----
  const [showSave, setShowSave] = useState(false);
  const [name, setName] = useState("");
  const [relation, setRelation] = useState(RELATIONS[0]);
  const [gotra, setGotra] = useState("");
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notes, setNotes] = useState("");

  const calc = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/tools/tithi-calculator", { departureDate: date, departureTime: time, departurePlace: place, shradhTradition: tradition });
      return res.json() as Promise<CalcResult>;
    },
    onSuccess: (data) => { setResult(data); setShowSave(false); },
    onError: (e: unknown) => toast({ title: "Could not compute", description: e instanceof Error ? e.message : "Please check the date and place." }),
  });

  const save = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Sign in required");
      const res = await apiRequest("POST", `/api/pitru/ancestors?uid=${user.id}&email=${encodeURIComponent(user.email)}`, {
        uid: user.id, email: user.email,
        name, relation, gotra: gotra || null,
        departureDate: date, departureTime: time, departurePlace: place,
        notifyWhatsapp, notifyEmail, notes: notes || null,
        shradhTradition: tradition,
      });
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Ancestor saved", description: "We'll remind you 7 days, 1 day and on the day of every annual Shradh." });
      setShowSave(false); setName(""); setGotra(""); setNotes("");
      qc.invalidateQueries({ queryKey: ["/api/pitru/ancestors", user?.id] });
    },
    onError: (e: unknown) => toast({ title: "Could not save", description: e instanceof Error ? e.message : "Please try again." }),
  });

  const submitCalc = (e: React.FormEvent) => {
    e.preventDefault();
    if (!date || !place) { toast({ title: "Missing details", description: "Please enter departure date and pick a place from the list." }); return; }
    if (!pickedCity || !pickedCity.name) { toast({ title: "Pick a city", description: "Please choose a city from the dropdown — we use its IANA timezone for an accurate result." }); return; }
    calc.mutate();
  };

  return (
    <div className="bg-[#FBF7EE] min-h-screen pb-20">
      <PageSeo
        title={PAGE_TITLE}
        description={PAGE_DESC}
        canonical="/tools/tithi-calculator"
        twitterCard="summary_large_image"
        schemas={[
          softwareApplication({
            name: "Pitru Tithi Calculator",
            url: PAGE_URL,
            description: PAGE_DESC,
            applicationCategory: "UtilitiesApplication",
            offerPrice: "0",
          }),
          breadcrumbList([
            { name: "Home", url: "/" },
            { name: "Tools", url: "/tools" },
            { name: "Pitru Tithi Calculator", url: "/tools/tithi-calculator" },
          ]),
          faqPage(FAQ_ITEMS.map((it) => ({ question: it.q, answer: it.a }))),
        ]}
      />
      <Hero />
      <div className="container mx-auto px-4 -mt-8 relative z-10 max-w-5xl">
        <Card className="border-[#D4AF37]/35 shadow-lg">
          <CardContent className="p-6 sm:p-8">
            <form onSubmit={submitCalc} className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="sm:col-span-1">
                <Label htmlFor="dep-date" className="text-[#5a4a3a] text-xs font-semibold uppercase tracking-wide">Departure date</Label>
                <div className="relative mt-1.5">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/40 pointer-events-none" />
                  <Input id="dep-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="pl-9" data-testid="input-departure-date" />
                </div>
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="dep-time" className="text-[#5a4a3a] text-xs font-semibold uppercase tracking-wide">Time (optional)</Label>
                <div className="relative mt-1.5">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#5a4a3a]/40 pointer-events-none" />
                  <Input id="dep-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} className="pl-9" data-testid="input-departure-time" />
                </div>
              </div>
              <div className="sm:col-span-1">
                <Label htmlFor="dep-place" className="text-[#5a4a3a] text-xs font-semibold uppercase tracking-wide">Place of departure</Label>
                <div className="mt-1.5">
                  <CityAutocomplete
                    value={place}
                    onPick={(c) => { setPickedCity(c); setPlace(c.name); }}
                    testId="input-departure-place"
                  />
                </div>
                {pickedCity && pickedCity.name && <div className="text-[10px] text-[#5a4a3a]/60 mt-1">Timezone: {pickedCity.tz}</div>}
              </div>
              <div className="sm:col-span-3">
                <TraditionToggle value={tradition} onChange={setTradition} />
              </div>
              <div className="sm:col-span-3 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between pt-2">
                <p className="text-[12px] text-[#5a4a3a]/60">Computation uses the Lahiri ayanamsa with Swiss Ephemeris. No data is stored unless you save the ancestor.</p>
                <Button type="submit" disabled={calc.isPending} className="bg-[#6D2B35] hover:bg-[#5a232b] text-white font-bold tracking-wide" data-testid="button-calculate">
                  {calc.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Calculator className="w-4 h-4 mr-2" />}
                  Compute Tithi
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {result && (
          <div className="mt-8 space-y-6">
            <ResultPanel result={result} />
            <DoshPanel dosh={result.dosh} />
            <ShradhDatesPanel dates={result.shradhDates} />

            {/* Save ancestor — gates on auth */}
            <Card className="border-[#D4AF37]/35">
              <CardContent className="p-6 sm:p-8">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <h3 className="font-serif text-xl text-[#6D2B35] font-bold flex items-center gap-2"><Bell className="w-4 h-4 text-[#D4AF37]" /> Save this ancestor for yearly reminders</h3>
                    <p className="text-[13px] text-[#5a4a3a]/75 mt-1">We will message you on WhatsApp and email at <strong>T&minus;7</strong>, <strong>T&minus;1</strong> and on the <strong>day of Shradh</strong> — every year, automatically. You can edit or delete anytime from your dashboard.</p>
                  </div>
                  {!user && (
                    <Button onClick={() => openAuth("login")} className="bg-[#6D2B35] hover:bg-[#5a232b] text-white" data-testid="button-signin-to-save">Sign in to enable reminders</Button>
                  )}
                  {user && !showSave && (
                    <Button onClick={() => setShowSave(true)} className="bg-[#D4AF37] hover:bg-[#c19f30] text-[#6D2B35] font-bold" data-testid="button-show-save">
                      <Plus className="w-4 h-4 mr-1" /> Save Ancestor
                    </Button>
                  )}
                </div>

                {user && showSave && (
                  <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="anc-name" className="text-xs font-semibold uppercase text-[#5a4a3a]">Ancestor name</Label>
                      <Input id="anc-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Shri Ram Prasad" className="mt-1.5" data-testid="input-ancestor-name" />
                    </div>
                    <div>
                      <Label htmlFor="anc-relation" className="text-xs font-semibold uppercase text-[#5a4a3a]">Relation</Label>
                      <select id="anc-relation" value={relation} onChange={(e) => setRelation(e.target.value)} className="mt-1.5 w-full h-9 rounded-md border border-input bg-background px-3 text-sm" data-testid="select-ancestor-relation">
                        {RELATIONS.map((r) => <option key={r} value={r}>{r}</option>)}
                      </select>
                    </div>
                    <div>
                      <Label htmlFor="anc-gotra" className="text-xs font-semibold uppercase text-[#5a4a3a]">Gotra (optional)</Label>
                      <Input id="anc-gotra" value={gotra} onChange={(e) => setGotra(e.target.value)} placeholder="e.g. Bhardwaj" className="mt-1.5" data-testid="input-ancestor-gotra" />
                    </div>
                    <div>
                      <Label htmlFor="anc-notes" className="text-xs font-semibold uppercase text-[#5a4a3a]">Notes (optional)</Label>
                      <Textarea id="anc-notes" value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1.5 min-h-[40px]" placeholder="e.g. Devotee of Lord Shiva" data-testid="textarea-ancestor-notes" />
                    </div>
                    <div className="sm:col-span-2 flex items-center gap-6 pt-1">
                      <label className="flex items-center gap-2 text-sm text-[#5a4a3a]">
                        <Switch checked={notifyWhatsapp} onCheckedChange={setNotifyWhatsapp} data-testid="switch-notify-whatsapp" />
                        Remind on WhatsApp
                      </label>
                      <label className="flex items-center gap-2 text-sm text-[#5a4a3a]">
                        <Switch checked={notifyEmail} onCheckedChange={setNotifyEmail} data-testid="switch-notify-email" />
                        Remind on Email
                      </label>
                    </div>
                    <div className="sm:col-span-2 flex justify-end gap-2 pt-2">
                      <Button variant="ghost" onClick={() => setShowSave(false)} data-testid="button-cancel-save">Cancel</Button>
                      <Button
                        onClick={() => save.mutate()}
                        disabled={save.isPending || !name.trim()}
                        className="bg-[#6D2B35] hover:bg-[#5a232b] text-white font-bold"
                        data-testid="button-save-ancestor"
                      >
                        {save.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Bell className="w-4 h-4 mr-2" />}
                        Save &amp; Schedule Reminders
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {user && <SavedAncestorsList />}

        <FAQ />
      </div>
    </div>
  );
}

function TraditionToggle({ value, onChange }: { value: ShradhTradition; onChange: (v: ShradhTradition) => void }) {
  const opts: { id: ShradhTradition; title: string; sub: string; body: string }[] = [
    {
      id: "pitru-paksha",
      title: "Pitru Paksha Shradh",
      sub: "Ashvin Krishna Paksha (Sept-Oct)",
      body: "Annual Shradh observed on the matching tithi during the 16-day Pitru Paksha fortnight. Dominant in North India and the Smarta tradition (Banaras, Gaya, Haridwar).",
    },
    {
      id: "pratisamvatsarik",
      title: "Pratisamvatsarik Shradh",
      sub: "Same tithi, same lunar month of death",
      body: "Annual Shradh observed every year on the same tithi in the same Hindu month the person passed away. Followed by many Bengali, Maithili, Marathi and South Indian families.",
    },
  ];
  return (
    <div className="bg-[#FBF7EE] border border-[#D4AF37]/25 rounded-md p-4">
      <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/70 font-semibold mb-3">Which Shradh tradition does your family observe?</div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {opts.map((o) => {
          const active = value === o.id;
          return (
            <button
              key={o.id}
              type="button"
              onClick={() => onChange(o.id)}
              data-testid={`button-tradition-${o.id}`}
              className={`text-left rounded-md p-3 border-2 transition-colors ${active ? "bg-white border-[#6D2B35]" : "bg-white/60 border-[#D4AF37]/25 hover-elevate"}`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-3.5 h-3.5 rounded-full border-2 flex-shrink-0 ${active ? "border-[#6D2B35] bg-[#6D2B35]" : "border-[#5a4a3a]/40"}`} />
                <div className="font-serif font-bold text-[#6D2B35] text-[15px]">{o.title}</div>
              </div>
              <div className="text-[11px] uppercase tracking-wide text-[#D4AF37] font-semibold mt-1">{o.sub}</div>
              <div className="text-[12px] text-[#5a4a3a]/85 mt-1.5 leading-relaxed">{o.body}</div>
            </button>
          );
        })}
      </div>
      <p className="text-[11px] text-[#5a4a3a]/60 mt-3">Both traditions are shastrically valid &mdash; they belong to different sampradayas. Pick the one your family follows; we&rsquo;ll compute the next 5 yearly dates accordingly.</p>
    </div>
  );
}

function Hero() {
  return (
    <section className="bg-gradient-to-b from-[#6D2B35] to-[#5a232b] text-white pt-12 pb-20 relative overflow-hidden">
      <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, #D4AF37 0%, transparent 35%), radial-gradient(circle at 80% 60%, #D4AF37 0%, transparent 30%)" }} />
      <div className="container mx-auto px-4 relative">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 mb-4">
            <Calculator className="w-4 h-4 text-[#D4AF37]" />
            <span className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold">Free Vedic Tool</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-5xl font-bold leading-tight" data-testid="text-page-title">Pitru Tithi Calculator &amp; Annual Shradh Reminder</h1>
          <p className="text-white/80 mt-4 text-[15px] sm:text-base leading-relaxed">
            Enter your ancestor&rsquo;s date, time and place of departure. Our panchang engine computes the exact <strong className="text-[#D4AF37]">tithi, paksha &amp; nakshatra</strong>, lists the next 5 annual <strong className="text-[#D4AF37]">Shradh dates</strong>, gives a <strong className="text-[#D4AF37]">Pitru Dosh</strong> assessment, and (when you sign in) sends free yearly reminders by WhatsApp and email.
          </p>
        </div>
      </div>
    </section>
  );
}

function ResultPanel({ result }: { result: CalcResult }) {
  return (
    <Card className="border-[#D4AF37]/35">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="font-serif text-xl text-[#6D2B35] font-bold" data-testid="text-result-title">Departure Tithi</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <Stat label="Tithi" value={result.tithi.tithiName} sub={`${result.tithi.tithiInPaksha} of paksha`} testId="text-result-tithi" />
          <Stat label="Paksha" value={result.tithi.paksha} testId="text-result-paksha" />
          <Stat label="Nakshatra" value={result.tithi.nakshatraName} testId="text-result-nakshatra" />
          <Stat label="Lunar Month" value={result.tithi.hinduMonth} testId="text-result-month" />
        </div>
        <p className="text-[11px] text-[#5a4a3a]/55 mt-4">Computed for {result.place.name} ({result.place.lat.toFixed(2)}°, {result.place.lon.toFixed(2)}°, {result.place.tz}).</p>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value, sub, testId }: { label: string; value: string; sub?: string; testId?: string }) {
  return (
    <div className="bg-[#FBF7EE] rounded-md p-4 border border-[#D4AF37]/20">
      <div className="text-[10px] uppercase tracking-wide text-[#5a4a3a]/60 font-semibold">{label}</div>
      <div className="font-serif text-lg text-[#6D2B35] font-bold mt-1" data-testid={testId}>{value}</div>
      {sub && <div className="text-[11px] text-[#5a4a3a]/60 mt-0.5">{sub}</div>}
    </div>
  );
}

function DoshPanel({ dosh }: { dosh: Dosh }) {
  const sevColor = dosh.severity === "high" ? "bg-red-50 border-red-200 text-red-800"
    : dosh.severity === "moderate" ? "bg-amber-50 border-amber-200 text-amber-800"
    : "bg-emerald-50 border-emerald-200 text-emerald-800";
  return (
    <Card className="border-[#D4AF37]/35">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center justify-between gap-3 flex-wrap mb-4">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-[#D4AF37]" />
            <h2 className="font-serif text-xl text-[#6D2B35] font-bold">Pitru Dosh Assessment</h2>
          </div>
          <Badge className={`${sevColor} border`} data-testid="badge-dosh-severity">
            {dosh.hasPitruDosh ? `Indicators present — severity ${dosh.severity}` : "No specific indicators"}
          </Badge>
        </div>

        <div className="space-y-2">
          {dosh.indicators.map((ind, i) => (
            <div key={i} className="flex items-start gap-2 text-sm text-[#5a4a3a]">
              <Star className="w-3.5 h-3.5 text-[#D4AF37] mt-1 flex-shrink-0" />
              <span>{ind}</span>
            </div>
          ))}
        </div>

        <h3 className="font-serif text-base text-[#6D2B35] font-bold mt-6 mb-3">Recommended remedies</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {dosh.recommendations.map((r, i) => (
            <div key={i} className="bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-4">
              <div className="font-semibold text-sm text-[#6D2B35]">{r.title}</div>
              <div className="text-[12px] text-[#5a4a3a]/85 mt-1 leading-relaxed">{r.body}</div>
              {r.href && <Link href={r.href} className="inline-flex items-center gap-1 text-[12px] text-[#6D2B35] font-bold mt-2 hover:text-[#D4AF37]">Learn more <ArrowRight className="w-3 h-3" /></Link>}
            </div>
          ))}
        </div>

        <div className="mt-6 bg-gradient-to-r from-[#6D2B35] to-[#5a232b] rounded-md p-5 flex items-center justify-between gap-4 flex-wrap text-white">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-[#D4AF37] font-semibold">Recommended package</div>
            <div className="font-serif text-lg font-bold mt-0.5" data-testid="text-recommended-package">{dosh.recommendedPackage.title}</div>
          </div>
          <Link href={dosh.recommendedPackage.href} className="bg-[#D4AF37] hover:bg-[#c19f30] text-[#6D2B35] rounded-md h-10 px-5 text-[13px] font-bold tracking-wide inline-flex items-center gap-2" data-testid="link-book-package">
            View &amp; Book <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function ShradhDatesPanel({ dates }: { dates: ShradhDate[] }) {
  if (!dates.length) return null;
  return (
    <Card className="border-[#D4AF37]/35">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="font-serif text-xl text-[#6D2B35] font-bold">Next 5 Annual Shradh Dates</h2>
        </div>
        <div className="space-y-2">
          {dates.map((d) => (
            <div key={d.year} className="flex items-center justify-between gap-3 bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md px-4 py-3" data-testid={`row-shradh-${d.year}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 text-center">
                  <div className="text-[10px] uppercase text-[#5a4a3a]/60 font-semibold">{d.year}</div>
                  <div className="font-serif text-base text-[#6D2B35] font-bold leading-tight">{new Date(d.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</div>
                </div>
                <div>
                  <div className="text-sm text-[#5a4a3a] font-semibold">{d.weekday}</div>
                  <div className="text-[12px] text-[#5a4a3a]/70">{d.tithiName} • {d.paksha}</div>
                </div>
              </div>
              {d.isPitruPaksha && <Badge className="bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a232b]">Pitru Paksha</Badge>}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function SavedAncestorsList() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { data, isLoading } = useQuery<Ancestor[]>({
    queryKey: ["/api/pitru/ancestors", user?.id],
    queryFn: async () => {
      const r = await fetch(`/api/pitru/ancestors?uid=${user!.id}&email=${encodeURIComponent(user!.email)}`);
      if (!r.ok) throw new Error("Failed");
      return r.json();
    },
    enabled: !!user,
  });

  const del = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/pitru/ancestors/${id}?uid=${user!.id}&email=${encodeURIComponent(user!.email)}`);
    },
    onSuccess: () => {
      toast({ title: "Removed", description: "Ancestor and reminders removed." });
      queryClient.invalidateQueries({ queryKey: ["/api/pitru/ancestors", user?.id] });
    },
  });

  if (!user) return null;
  if (isLoading) return <div className="mt-8 text-center text-[#5a4a3a]/60 text-sm">Loading saved ancestors…</div>;
  if (!data || data.length === 0) return null;

  return (
    <Card className="mt-8 border-[#D4AF37]/35">
      <CardContent className="p-6 sm:p-8">
        <div className="flex items-center gap-2 mb-4">
          <Bell className="w-4 h-4 text-[#D4AF37]" />
          <h2 className="font-serif text-xl text-[#6D2B35] font-bold">Your Saved Ancestors ({data.length})</h2>
        </div>
        <div className="space-y-3">
          {data.map((a) => (
            <div key={a.id} className="flex items-center justify-between gap-3 bg-[#FBF7EE] border border-[#D4AF37]/20 rounded-md p-4 flex-wrap" data-testid={`row-ancestor-${a.id}`}>
              <div className="min-w-0 flex-1">
                <div className="font-serif text-base text-[#6D2B35] font-bold">{a.name} <span className="text-[12px] text-[#5a4a3a]/60 font-sans">({a.relation})</span></div>
                <div className="text-[12px] text-[#5a4a3a]/75 mt-0.5">
                  {a.tithiName} • {a.paksha}
                  {a.nakshatraName && <> • {a.nakshatraName}</>}
                  {a.gotra && <> • Gotra: {a.gotra}</>}
                </div>
                {a.nextShradh && (
                  <div className="text-[12px] text-[#6D2B35] font-semibold mt-1">
                    Next Shradh: {new Date(a.nextShradh.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex flex-col items-end gap-0.5">
                  {a.notifyWhatsapp && <Badge className="bg-emerald-50 text-emerald-700 border border-emerald-200">WhatsApp</Badge>}
                  {a.notifyEmail && <Badge className="bg-blue-50 text-blue-700 border border-blue-200">Email</Badge>}
                </div>
                <Button variant="ghost" size="icon" onClick={() => del.mutate(a.id)} disabled={del.isPending} data-testid={`button-delete-ancestor-${a.id}`}>
                  <Trash2 className="w-4 h-4 text-[#6D2B35]" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function FAQ() {
  return (
    <div className="mt-12">
      <h2 className="font-serif text-2xl text-[#6D2B35] font-bold mb-4">Common questions</h2>
      <div className="space-y-2">
        {FAQ_ITEMS.map((it, i) => (
          <details key={i} className="bg-white border border-[#D4AF37]/25 rounded-md p-4 group">
            <summary className="cursor-pointer font-semibold text-[#6D2B35] flex items-center justify-between">
              <span>{it.q}</span>
              <ChevronRight className="w-4 h-4 group-open:rotate-90 transition-transform text-[#5a4a3a]/60" />
            </summary>
            <p className="text-[13px] text-[#5a4a3a]/85 mt-2 leading-relaxed">{it.a}</p>
          </details>
        ))}
      </div>
    </div>
  );
}
