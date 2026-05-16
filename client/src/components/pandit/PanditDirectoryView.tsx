// =====================================================================
// Pandit Directory — V2 redesign
//
// One self-contained component that powers the per-city listing. Replaces
// the ~825-line monolith in pandit-directory.tsx with a denser, more
// modern layout and the ten "advanced features" the operator picked:
//
//   1.  Smart filters     — search, tradition chips, online-only,
//                           verified-only, price range, min-rating,
//                           multi-language, specialization, sort
//   2.  Live online dot   — green pulse on cards + sort online-first
//   3.  Compare           — checkbox per card (max 3) → bottom drawer →
//                           side-by-side dialog
//   4.  Reviews           — rating + count featured prominently on card
//   5.  Map view          — toggle list/map; Leaflet w/ OSM tiles, no key
//   6.  Trust signals     — verified shield, years exp, education,
//                           tier badge, languages count
//   7.  Sticky Book Now   — bottom-of-card CTA + mobile sticky action
//   8.  AI puja recommender — modal that calls /api/ai/puja-recommend,
//                             auto-applies the suggested specialization
//   9.  Distance-aware    — "near me" sort + km display when GPS allowed
//   10. Price transparency — fees rendered with from-price + dakshina note
//
// Data shape: /api/pandits returns sanitized Pandit + { isOnline, distance }
// =====================================================================
import { useState, useMemo, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import {
  Search, MapPin, Star, ShieldCheck, Crown, Filter, X, Languages,
  Sparkles, Map as MapIcon, List as ListIcon, Loader2,
  GraduationCap, Award, Check, MessageCircle, Calendar,
  Wand2, Navigation, Phone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Pandit } from "@shared/schema";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Leaflet's default marker icons break under bundlers — point at the CDN.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

type PanditWithMeta = Pandit & { distance: number | null; isOnline?: boolean };

const TRADITIONS = [
  "Bengali", "Bihari", "Marwari", "South Indian", "Maharashtrian",
  "Gujarati", "Kashmiri", "Odia", "UP", "Punjabi", "Nepali",
];

const SPECIALIZATIONS = [
  "Satyanarayan", "Griha Pravesh", "Vivah", "Mundan", "Namkaran",
  "Rudrabhishek", "Navagraha", "Shradh", "Vastu", "Ganesh",
  "Lakshmi", "Saraswati", "Kaal Sarp", "Mahamrityunjaya",
];

const COMMON_LANGUAGES = [
  "Sanskrit", "Hindi", "English", "Marathi", "Tamil", "Telugu",
  "Kannada", "Malayalam", "Bengali", "Gujarati", "Punjabi", "Odia",
];

// City centroids (only Delhi NCR live for now). Used as default map center.
const CITY_CENTROIDS: Record<string, [number, number]> = {
  Delhi: [28.6139, 77.2090],
  Mumbai: [19.0760, 72.8777],
  Bangalore: [12.9716, 77.5946],
  Chennai: [13.0827, 80.2707],
  Kolkata: [22.5726, 88.3639],
};

const TIER_META: Record<string, { label: string; cls: string; rank: number }> = {
  guru_elite: { label: "Guru Elite", cls: "bg-amber-100 text-amber-900 border-amber-300", rank: 4 },
  gold: { label: "Gold", cls: "bg-yellow-100 text-yellow-900 border-yellow-300", rank: 3 },
  silver: { label: "Silver", cls: "bg-zinc-100 text-zinc-700 border-zinc-300", rank: 2 },
  free: { label: "", cls: "", rank: 1 },
};

function formatDistance(d: number | null): string {
  if (d === null || d === undefined) return "";
  if (d < 1) return `${Math.round(d * 1000)} m`;
  if (d < 10) return `${d.toFixed(1)} km`;
  return `${Math.round(d)} km`;
}

// =====================================================================
// AI Puja Recommender — modal
// =====================================================================
function AiRecommender({
  open, onClose, onApply,
}: {
  open: boolean;
  onClose: () => void;
  onApply: (specialization: string, pujaName: string) => void;
}) {
  const [situation, setSituation] = useState("");
  const [result, setResult] = useState<null | { pujaName: string; specialization: string; reasoning: string; preparation: string }>(null);
  const { toast } = useToast();

  const recommend = useMutation({
    mutationFn: async () => {
      const r = await apiRequest("POST", "/api/ai/puja-recommend", { situation });
      return r.json();
    },
    onSuccess: (data) => {
      if (data?.error) {
        toast({ title: "AI unavailable", description: data.error, variant: "destructive" });
        return;
      }
      setResult(data);
    },
    onError: () => toast({ title: "Could not generate", variant: "destructive" }),
  });

  const reset = () => { setSituation(""); setResult(null); };
  const handleClose = () => { reset(); onClose(); };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
      <DialogContent className="max-w-lg" data-testid="dialog-ai-recommender">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" /> Which puja should I do?
          </DialogTitle>
          <DialogDescription>
            Describe your situation in a sentence or two. Our AI pandit will suggest the right ritual.
          </DialogDescription>
        </DialogHeader>
        {!result ? (
          <div className="space-y-3">
            <Textarea
              data-testid="textarea-ai-situation"
              placeholder="e.g. We just bought a new home and want a blessing ceremony before moving in..."
              rows={4}
              value={situation}
              onChange={(e) => setSituation(e.target.value)}
            />
            <div className="text-xs text-muted-foreground">
              Common starters: new home, baby naming, business launch, ancestral peace, removing obstacles.
            </div>
          </div>
        ) : (
          <div className="space-y-4" data-testid="result-ai-recommendation">
            <div className="rounded-md border border-primary/20 bg-primary/5 p-4">
              <div className="text-xs uppercase tracking-wide text-primary font-semibold mb-1">Recommended Puja</div>
              <div className="text-xl font-serif text-primary">{result.pujaName}</div>
            </div>
            <p className="text-sm leading-relaxed">{result.reasoning}</p>
            {result.preparation && (
              <div className="rounded-md bg-amber-50 border border-amber-200 p-3 text-sm">
                <strong className="text-amber-900">Prepare:</strong> {result.preparation}
              </div>
            )}
          </div>
        )}
        <DialogFooter className="gap-2 flex-wrap">
          {result ? (
            <>
              <Button variant="outline" onClick={reset} data-testid="button-ai-restart">Ask again</Button>
              <Button
                onClick={() => { onApply(result.specialization, result.pujaName); handleClose(); }}
                data-testid="button-ai-apply"
              >
                <Check className="h-4 w-4 mr-2" />
                Find pandits for this
              </Button>
            </>
          ) : (
            <Button
              disabled={recommend.isPending || situation.trim().length < 5}
              onClick={() => recommend.mutate()}
              data-testid="button-ai-recommend"
            >
              {recommend.isPending
                ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Thinking...</>
                : <><Sparkles className="h-4 w-4 mr-2" /> Recommend a puja</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// Filter Sheet — mobile/secondary filters
// =====================================================================
type Filters = {
  q: string;
  tradition: string;
  specialization: string;
  languages: string[];
  priceMax: number;
  minRating: number;
  onlineOnly: boolean;
  verifiedOnly: boolean;
  availableToday: boolean;
};

const DEFAULT_FILTERS: Filters = {
  q: "", tradition: "", specialization: "", languages: [],
  priceMax: 25000, minRating: 0, onlineOnly: false,
  verifiedOnly: false, availableToday: false,
};

// Keyboard-accessible filter chip — semantic <button> with aria-pressed.
// Badge component renders a <div>, so we wrap it (or imitate it) in a real button.
function ChipButton({
  pressed, onClick, children, testId,
}: { pressed: boolean; onClick: () => void; children: React.ReactNode; testId?: string }) {
  return (
    <button
      type="button"
      role="button"
      aria-pressed={pressed}
      onClick={onClick}
      data-testid={testId}
      className={[
        "inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        "hover-elevate active-elevate-2",
        pressed
          ? "border-transparent bg-primary text-primary-foreground"
          : "border-border bg-background text-foreground",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

function FilterPanel({ filters, setFilters }: { filters: Filters; setFilters: (f: Filters) => void }) {
  const toggleLang = (lang: string) => {
    const next = filters.languages.includes(lang)
      ? filters.languages.filter((l) => l !== lang)
      : [...filters.languages, lang];
    setFilters({ ...filters, languages: next });
  };
  return (
    <div className="space-y-6">
      <div>
        <Label className="text-sm font-semibold">Tradition</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          <ChipButton
            pressed={!filters.tradition}
            onClick={() => setFilters({ ...filters, tradition: "" })}
            testId="chip-tradition-all"
          >All</ChipButton>
          {TRADITIONS.map((t) => (
            <ChipButton
              key={t}
              pressed={filters.tradition === t}
              onClick={() => setFilters({ ...filters, tradition: filters.tradition === t ? "" : t })}
              testId={`chip-tradition-${t}`}
            >{t}</ChipButton>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Specialization</Label>
        <Select
          value={filters.specialization || "any"}
          onValueChange={(v) => setFilters({ ...filters, specialization: v === "any" ? "" : v })}
        >
          <SelectTrigger className="mt-2" data-testid="select-specialization">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any puja</SelectItem>
            {SPECIALIZATIONS.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <div>
        <div className="flex justify-between items-baseline">
          <Label className="text-sm font-semibold">Price up to</Label>
          <span className="text-sm font-medium text-primary">
            ₹{filters.priceMax.toLocaleString("en-IN")}
          </span>
        </div>
        <Slider
          className="mt-3"
          min={500} max={25000} step={500}
          value={[filters.priceMax]}
          onValueChange={(v) => setFilters({ ...filters, priceMax: v[0] })}
          data-testid="slider-price"
        />
      </div>

      <div>
        <Label className="text-sm font-semibold">Minimum rating</Label>
        <div className="flex gap-1.5 mt-2">
          {[0, 4.0, 4.5, 4.8].map((r) => (
            <ChipButton
              key={r}
              pressed={filters.minRating === r}
              onClick={() => setFilters({ ...filters, minRating: r })}
              testId={`chip-rating-${r}`}
            >
              {r === 0 ? "Any" : <><Star className="h-3 w-3 fill-current" />{r}+</>}
            </ChipButton>
          ))}
        </div>
      </div>

      <div>
        <Label className="text-sm font-semibold">Languages</Label>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {COMMON_LANGUAGES.map((lang) => (
            <ChipButton
              key={lang}
              pressed={filters.languages.includes(lang)}
              onClick={() => toggleLang(lang)}
              testId={`chip-lang-${lang}`}
            >{lang}</ChipButton>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 cursor-pointer">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
              <span className="relative rounded-full h-2 w-2 bg-green-500" />
            </span>
            Online now
          </Label>
          <Switch
            checked={filters.onlineOnly}
            onCheckedChange={(v) => setFilters({ ...filters, onlineOnly: v })}
            data-testid="switch-online"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 cursor-pointer">
            <ShieldCheck className="h-4 w-4 text-primary" /> Verified only
          </Label>
          <Switch
            checked={filters.verifiedOnly}
            onCheckedChange={(v) => setFilters({ ...filters, verifiedOnly: v })}
            data-testid="switch-verified"
          />
        </div>
        <div className="flex items-center justify-between">
          <Label className="flex items-center gap-2 cursor-pointer">
            <Calendar className="h-4 w-4 text-primary" /> Available today
          </Label>
          <Switch
            checked={filters.availableToday}
            onCheckedChange={(v) => setFilters({ ...filters, availableToday: v })}
            data-testid="switch-available"
          />
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// Pandit Card v2
// =====================================================================
function PanditCard({
  p, compareSelected, onToggleCompare, compareDisabled,
}: {
  p: PanditWithMeta;
  compareSelected: boolean;
  onToggleCompare: () => void;
  compareDisabled: boolean;
}) {
  const tier = TIER_META[(p.tier || "free").toLowerCase()] || TIER_META.free;
  const langCount = (p.languages || "").split(",").filter(Boolean).length;
  const isOnline = !!p.isOnline && !p.onLeave;
  const dist = formatDistance(p.distance);

  return (
    <Card
      data-testid={`card-pandit-${p.id}`}
      className={`relative overflow-visible ${compareSelected ? "ring-2 ring-primary" : ""}`}
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex gap-4">
          {/* Photo + online dot */}
          <div className="relative shrink-0">
            <Avatar className="h-20 w-20 border border-amber-200">
              <AvatarImage src={p.image || undefined} alt={p.name} />
              <AvatarFallback className="bg-primary/10 text-primary font-serif text-xl">
                {p.name.split(" ").map((s) => s[0]).slice(0, 2).join("")}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span
                title="Available now"
                data-testid={`dot-online-${p.id}`}
                className="absolute -bottom-0.5 -right-0.5 flex h-4 w-4"
              >
                <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-60" />
                <span className="relative rounded-full h-4 w-4 bg-green-500 border-2 border-white" />
              </span>
            )}
          </div>

          <div className="flex-1 min-w-0">
            {/* Name + verified + tier */}
            <div className="flex flex-wrap items-start gap-2">
              <h3 className="text-lg font-serif font-semibold text-foreground" data-testid={`text-pandit-name-${p.id}`}>
                {p.name}
              </h3>
              {p.verified && (
                <ShieldCheck className="h-4 w-4 text-primary mt-1.5 shrink-0" />
              )}
              {tier.label && (
                <Badge variant="outline" className={`${tier.cls} text-xs`}>
                  <Crown className="h-3 w-3 mr-1" /> {tier.label}
                </Badge>
              )}
              {isOnline && (
                <Badge className="bg-green-100 text-green-800 border-green-300 text-xs" data-testid={`badge-online-${p.id}`}>
                  Available now
                </Badge>
              )}
              {p.onLeave && (
                <Badge variant="outline" className="text-xs text-muted-foreground">On leave</Badge>
              )}
            </div>

            {/* Rating row */}
            <div className="flex items-center gap-2 mt-1 text-sm">
              <div className="flex items-center gap-0.5">
                <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                <span className="font-semibold">{p.rating?.toFixed(1)}</span>
              </div>
              <span className="text-muted-foreground">
                ({p.reviewCount || 0} review{p.reviewCount === 1 ? "" : "s"})
              </span>
              {dist && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MapPin className="h-3.5 w-3.5" /> {dist}
                  </span>
                </>
              )}
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap gap-1.5 mt-2.5">
              <Badge variant="outline" className="text-xs gap-1 font-normal">
                <Award className="h-3 w-3" /> {p.experience}+ yrs
              </Badge>
              {p.education && (
                <Badge variant="outline" className="text-xs gap-1 font-normal">
                  <GraduationCap className="h-3 w-3" /> {p.education.split(",")[0]}
                </Badge>
              )}
              <Badge variant="outline" className="text-xs gap-1 font-normal">
                <Languages className="h-3 w-3" /> {langCount} lang
              </Badge>
              {p.regionalOrigin && (
                <Badge variant="outline" className="text-xs font-normal">{p.regionalOrigin}</Badge>
              )}
            </div>

            {/* Specializations preview */}
            {p.specialization && (
              <p className="text-xs text-muted-foreground mt-2 line-clamp-1">
                <strong className="text-foreground">Specializes in:</strong> {p.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Footer — price + actions */}
        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-border flex-wrap">
          <div>
            <div className="text-xs text-muted-foreground">Starts from</div>
            <div className="text-xl font-serif text-primary font-semibold" data-testid={`text-fees-${p.id}`}>
              ₹{p.fees.toLocaleString("en-IN")}
            </div>
            <div className="text-xs text-muted-foreground">+ dakshina (your choice)</div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <label className="flex items-center gap-1.5 text-xs cursor-pointer text-muted-foreground select-none">
              <Checkbox
                checked={compareSelected}
                disabled={!compareSelected && compareDisabled}
                onCheckedChange={onToggleCompare}
                data-testid={`checkbox-compare-${p.id}`}
              />
              Compare
            </label>
            <Link href={p.slug ? `/pandit/${p.slug}` : `/pandit/${p.id}`}>
              <Button variant="outline" size="sm" data-testid={`button-view-${p.id}`}>View</Button>
            </Link>
            <Link href={p.slug ? `/pandit/${p.slug}` : `/pandit/${p.id}`}>
              <Button size="sm" data-testid={`button-book-${p.id}`}>
                <MessageCircle className="h-4 w-4 mr-1.5" /> Book Now
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// =====================================================================
// Compare Drawer (sticky bottom bar) + Compare Dialog
// =====================================================================
function CompareBar({
  selected, onClear, onOpen,
}: { selected: PanditWithMeta[]; onClear: () => void; onOpen: () => void }) {
  if (selected.length === 0) return null;
  return (
    <div className="fixed bottom-0 inset-x-0 z-40 border-t bg-background/95 backdrop-blur shadow-lg" data-testid="bar-compare">
      <div className="container max-w-7xl mx-auto px-4 py-3 flex items-center gap-3 flex-wrap">
        <span className="text-sm font-medium">
          Comparing {selected.length} of 3
        </span>
        <div className="flex gap-1 flex-1 min-w-0 overflow-x-auto">
          {selected.map((p) => (
            <Badge key={p.id} variant="secondary" className="whitespace-nowrap">
              {p.name}
            </Badge>
          ))}
        </div>
        <Button variant="ghost" size="sm" onClick={onClear} data-testid="button-clear-compare">Clear</Button>
        <Button
          size="sm"
          disabled={selected.length < 2}
          onClick={onOpen}
          data-testid="button-open-compare"
        >Compare side-by-side</Button>
      </div>
    </div>
  );
}

function CompareDialog({
  open, onClose, selected,
}: { open: boolean; onClose: () => void; selected: PanditWithMeta[] }) {
  const rows: { label: string; render: (p: PanditWithMeta) => React.ReactNode }[] = [
    { label: "Rating", render: (p) => (
      <span className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        {p.rating?.toFixed(1)} ({p.reviewCount})
      </span>
    )},
    { label: "Experience", render: (p) => `${p.experience}+ yrs` },
    { label: "Starting fee", render: (p) => `₹${p.fees.toLocaleString("en-IN")}` },
    { label: "Tier", render: (p) => TIER_META[(p.tier || "free").toLowerCase()]?.label || "Standard" },
    { label: "Tradition", render: (p) => p.regionalOrigin || "—" },
    { label: "Languages", render: (p) => p.languages },
    { label: "Specialization", render: (p) => p.specialization },
    { label: "Education", render: (p) => p.education || "—" },
    { label: "Distance", render: (p) => formatDistance(p.distance) || "—" },
    { label: "Status", render: (p) => p.isOnline ? "Online now" : p.onLeave ? "On leave" : "Offline" },
    { label: "Verified", render: (p) => p.verified ? <Check className="h-4 w-4 text-green-600" /> : "—" },
  ];
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl" data-testid="dialog-compare">
        <DialogHeader>
          <DialogTitle>Compare pandits</DialogTitle>
          <DialogDescription>Side-by-side details to help you choose.</DialogDescription>
        </DialogHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 text-xs uppercase text-muted-foreground font-semibold">Attribute</th>
                {selected.map((p) => (
                  <th key={p.id} className="text-left p-2">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-8 w-8"><AvatarImage src={p.image || undefined} /><AvatarFallback>{p.name[0]}</AvatarFallback></Avatar>
                      <span className="font-serif font-semibold">{p.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b last:border-0">
                  <td className="p-2 text-muted-foreground font-medium">{row.label}</td>
                  {selected.map((p) => (
                    <td key={p.id} className="p-2">{row.render(p)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <DialogFooter className="gap-2">
          {selected.map((p) => (
            <Link key={p.id} href={p.slug ? `/pandit/${p.slug}` : `/pandit/${p.id}`}>
              <Button size="sm" variant="outline">Book {p.name.split(" ")[0]}</Button>
            </Link>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// Map View
// =====================================================================
function PanditMap({
  pandits, center,
}: { pandits: PanditWithMeta[]; center: [number, number] }) {
  const withCoords = pandits.filter((p) => p.latitude !== null && p.longitude !== null);
  return (
    <div className="rounded-lg overflow-hidden border h-[600px]" data-testid="map-pandits">
      <MapContainer center={center} zoom={11} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {withCoords.map((p) => (
          <Marker key={p.id} position={[p.latitude!, p.longitude!]}>
            <Popup>
              <div className="space-y-1 min-w-[180px]">
                <div className="font-serif font-semibold text-base">{p.name}</div>
                <div className="text-xs flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500 fill-amber-500" />
                  {p.rating?.toFixed(1)} · {p.experience}+ yrs
                </div>
                <div className="text-xs">From ₹{p.fees.toLocaleString("en-IN")}</div>
                <Link href={p.slug ? `/pandit/${p.slug}` : `/pandit/${p.id}`}>
                  <button className="text-xs text-primary font-semibold underline">View profile →</button>
                </Link>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      {withCoords.length === 0 && (
        <div className="text-center text-sm text-muted-foreground p-4">
          No pandits in this area have shared their exact location yet.
        </div>
      )}
    </div>
  );
}

// =====================================================================
// Main directory view
// =====================================================================
export function PanditDirectoryView({ defaultCity, cityLabel }: { defaultCity: string; cityLabel: string }) {
  const [filters, setFilters] = useState<Filters>(DEFAULT_FILTERS);
  const [sortBy, setSortBy] = useState<"best" | "online" | "rating" | "price-low" | "price-high" | "distance" | "experience">("best");
  const [view, setView] = useState<"list" | "map">("list");
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // GPS — best-effort, never blocks rendering
  const detectLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {/* user denied — fine */},
      { timeout: 8000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);
  useEffect(() => { detectLocation(); }, [detectLocation]);

  // Fetch pandits — server-side filters: city, region, lat/lng
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    params.set("city", defaultCity);
    if (filters.tradition) params.set("region", filters.tradition);
    if (userLocation) {
      params.set("lat", userLocation.lat.toString());
      params.set("lng", userLocation.lng.toString());
    }
    return params.toString();
  }, [defaultCity, filters.tradition, userLocation]);

  const { data: pandits, isLoading } = useQuery<PanditWithMeta[]>({
    queryKey: ["/api/pandits", queryParams],
    queryFn: () => fetch(`/api/pandits?${queryParams}`).then((r) => r.json()),
  });

  // Client-side filter chain (server already handled city/region)
  const filtered = useMemo(() => {
    if (!pandits) return [];
    const q = filters.q.trim().toLowerCase();
    return pandits.filter((p) => {
      if (q && !(`${p.name} ${p.specialization} ${p.bio || ""}`.toLowerCase().includes(q))) return false;
      if (filters.specialization && !p.specialization.toLowerCase().includes(filters.specialization.toLowerCase())) return false;
      if (filters.priceMax && p.fees > filters.priceMax) return false;
      if (filters.minRating && (p.rating || 0) < filters.minRating) return false;
      if (filters.onlineOnly && !p.isOnline) return false;
      if (filters.verifiedOnly && !p.verified) return false;
      if (filters.availableToday && p.availability !== "available") return false;
      if (filters.languages.length > 0) {
        const panditLangs = (p.languages || "").toLowerCase();
        if (!filters.languages.some((l) => panditLangs.includes(l.toLowerCase()))) return false;
      }
      return true;
    });
  }, [pandits, filters]);

  const sorted = useMemo(() => {
    const arr = [...filtered];
    // Always: tier rank → boost → user-selected sort. Online-first when sortBy=online.
    arr.sort((a, b) => {
      const aTier = TIER_META[(a.tier || "free").toLowerCase()]?.rank || 1;
      const bTier = TIER_META[(b.tier || "free").toLowerCase()]?.rank || 1;
      if (sortBy === "online") {
        const ao = a.isOnline ? 1 : 0;
        const bo = b.isOnline ? 1 : 0;
        if (ao !== bo) return bo - ao;
      }
      if (sortBy === "best") {
        if (bTier !== aTier) return bTier - aTier;
        const ao = a.isOnline ? 1 : 0;
        const bo = b.isOnline ? 1 : 0;
        if (ao !== bo) return bo - ao;
      }
      switch (sortBy) {
        case "rating": return (b.rating || 0) - (a.rating || 0);
        case "price-low": return a.fees - b.fees;
        case "price-high": return b.fees - a.fees;
        case "experience": return (b.experience || 0) - (a.experience || 0);
        case "distance": {
          const ad = a.distance ?? Infinity;
          const bd = b.distance ?? Infinity;
          return ad - bd;
        }
        default: return (b.rating || 0) - (a.rating || 0);
      }
    });
    return arr;
  }, [filtered, sortBy]);

  // Compare entities are derived from the FULL fetched dataset (not the
  // currently-filtered list) so a selection doesn't vanish from the bar
  // when the user adjusts filters. We also auto-prune any IDs that no
  // longer exist in the fetched data (e.g. city changed).
  const compareSelected = useMemo(
    () => (pandits || []).filter((p) => compareIds.includes(p.id)),
    [pandits, compareIds],
  );
  useEffect(() => {
    if (!pandits) return;
    const valid = new Set(pandits.map((p) => p.id));
    setCompareIds((cur) => {
      const next = cur.filter((id) => valid.has(id));
      return next.length === cur.length ? cur : next;
    });
  }, [pandits]);

  const toggleCompare = (id: number) => {
    setCompareIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const activeFilterCount = (filters.q ? 1 : 0)
    + (filters.tradition ? 1 : 0)
    + (filters.specialization ? 1 : 0)
    + filters.languages.length
    + (filters.minRating > 0 ? 1 : 0)
    + (filters.priceMax < 25000 ? 1 : 0)
    + (filters.onlineOnly ? 1 : 0)
    + (filters.verifiedOnly ? 1 : 0)
    + (filters.availableToday ? 1 : 0);

  const onlineCount = (pandits || []).filter((p) => p.isOnline).length;
  const center: [number, number] = CITY_CENTROIDS[defaultCity] || [28.6139, 77.2090];

  return (
    <div className="bg-background min-h-screen pb-32">
      {/* Top header — quick stats + AI CTA */}
      <div className="bg-gradient-to-b from-primary/5 to-background border-b">
        <div className="container max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                Verified Pandits in {cityLabel}
              </h1>
              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                <span>{(pandits || []).length} pandits available</span>
                {onlineCount > 0 && (
                  <span className="flex items-center gap-1.5 text-green-700">
                    <span className="relative flex h-2 w-2">
                      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                      <span className="relative rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    {onlineCount} online now
                  </span>
                )}
                {userLocation && <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> Sorted by distance available</span>}
              </p>
            </div>
            <Button onClick={() => setAiOpen(true)} variant="outline" className="gap-2" data-testid="button-open-ai">
              <Wand2 className="h-4 w-4 text-primary" />
              Not sure which puja? <span className="text-primary">Ask AI</span>
            </Button>
          </div>

          {aiSuggestion && (
            <div className="mt-4 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm flex items-center gap-2 flex-wrap" data-testid="banner-ai-applied">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Showing pandits for <strong>{aiSuggestion}</strong>.</span>
              <button
                className="text-xs underline text-primary ml-auto"
                onClick={() => { setAiSuggestion(null); setFilters({ ...filters, specialization: "" }); }}
              >Clear</button>
            </div>
          )}
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-6 grid gap-6 lg:grid-cols-[280px_1fr]">
        {/* Sticky filter sidebar (desktop) */}
        <aside className="hidden lg:block">
          <div className="sticky top-4 max-h-[calc(100vh-2rem)] overflow-y-auto pr-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-sm flex items-center gap-2">
                <Filter className="h-4 w-4" /> Filters
                {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
              </h2>
              {activeFilterCount > 0 && (
                <Button variant="ghost" size="sm" onClick={() => setFilters(DEFAULT_FILTERS)} data-testid="button-clear-filters">
                  Clear
                </Button>
              )}
            </div>
            <FilterPanel filters={filters} setFilters={setFilters} />
          </div>
        </aside>

        {/* Main column */}
        <main>
          {/* Search + sort + view toggle */}
          <div className="flex items-center gap-2 flex-wrap mb-4">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-9"
                placeholder="Search by name or puja..."
                value={filters.q}
                onChange={(e) => setFilters({ ...filters, q: e.target.value })}
                data-testid="input-search"
              />
            </div>

            {/* Mobile filter trigger */}
            <Sheet open={filterSheetOpen} onOpenChange={setFilterSheetOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden gap-2" data-testid="button-mobile-filters">
                  <Filter className="h-4 w-4" /> Filters
                  {activeFilterCount > 0 && <Badge variant="secondary">{activeFilterCount}</Badge>}
                </Button>
              </SheetTrigger>
              <SheetContent className="w-[320px] sm:w-[380px] overflow-y-auto">
                <SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader>
                <div className="mt-6">
                  <FilterPanel filters={filters} setFilters={setFilters} />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear</Button>
                  <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>Show {sorted.length}</Button>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={(v: any) => setSortBy(v)}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="best">Best match</SelectItem>
                <SelectItem value="online">Online first</SelectItem>
                <SelectItem value="rating">Top rated</SelectItem>
                <SelectItem value="price-low">Price: low to high</SelectItem>
                <SelectItem value="price-high">Price: high to low</SelectItem>
                <SelectItem value="experience">Most experienced</SelectItem>
                <SelectItem value="distance" disabled={!userLocation}>Nearest first</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex border rounded-md overflow-hidden" data-testid="toggle-view">
              <button
                className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === "list" ? "bg-primary text-primary-foreground" : "bg-background hover-elevate"}`}
                onClick={() => setView("list")}
                data-testid="button-view-list"
              ><ListIcon className="h-4 w-4" /> List</button>
              <button
                className={`px-3 py-2 text-sm flex items-center gap-1.5 ${view === "map" ? "bg-primary text-primary-foreground" : "bg-background hover-elevate"}`}
                onClick={() => setView("map")}
                data-testid="button-view-map"
              ><MapIcon className="h-4 w-4" /> Map</button>
            </div>
          </div>

          {/* Results */}
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full" />)}
            </div>
          ) : sorted.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold">No pandits match these filters</p>
                <p className="text-sm text-muted-foreground mt-1">Try clearing filters or expanding the price range.</p>
                <Button variant="outline" className="mt-4" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</Button>
              </CardContent>
            </Card>
          ) : view === "map" ? (
            <PanditMap pandits={sorted} center={center} />
          ) : (
            <div className="space-y-3">
              {sorted.map((p) => (
                <PanditCard
                  key={p.id}
                  p={p}
                  compareSelected={compareIds.includes(p.id)}
                  compareDisabled={compareIds.length >= 3}
                  onToggleCompare={() => toggleCompare(p.id)}
                />
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Mobile sticky action bar — shows when compare empty so the
          primary "book the top match" action is always one tap away. */}
      {compareSelected.length === 0 && sorted.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t bg-background/95 backdrop-blur shadow-lg" data-testid="bar-mobile-cta">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Top pick in {cityLabel}</div>
              <div className="text-sm font-semibold truncate">{sorted[0].name} · ₹{sorted[0].fees.toLocaleString("en-IN")}</div>
            </div>
            <Link href={sorted[0].slug ? `/pandit/${sorted[0].slug}` : `/pandit/${sorted[0].id}`}>
              <Button size="sm" data-testid="button-mobile-book-top">
                <MessageCircle className="h-4 w-4 mr-1.5" /> Book Now
              </Button>
            </Link>
          </div>
        </div>
      )}

      <CompareBar
        selected={compareSelected}
        onClear={() => setCompareIds([])}
        onOpen={() => setCompareOpen(true)}
      />
      <CompareDialog
        open={compareOpen}
        onClose={() => setCompareOpen(false)}
        selected={compareSelected}
      />
      <AiRecommender
        open={aiOpen}
        onClose={() => setAiOpen(false)}
        onApply={(spec, pujaName) => {
          setFilters({ ...filters, specialization: spec });
          setAiSuggestion(pujaName);
        }}
      />
    </div>
  );
}
