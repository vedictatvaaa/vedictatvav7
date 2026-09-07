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
// Data shape: /api/book-pandit-online returns sanitized Pandit + { isOnline, distance }
//
// Embedded mode: when this component is rendered inside a city or city×puja
// landing page, pass `embedded` to suppress the duplicate H1 + mini-hero
// (the parent page already provides those).
// =====================================================================
import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { bookingContextParams } from "@/lib/puja-service-map";
import { trackDiscoveryEvent, trackPanditFunnelEvent } from "@/lib/analytics";
import {
  Search, MapPin, Star, ShieldCheck, Filter, X, Languages,
  Sparkles, Loader2,
  GraduationCap, Award, Check, MessageCircle, Calendar,
  Wand2, Navigation,
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
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Pandit } from "@shared/schema";

type PanditWithMeta = Pandit & {
  distance: number | null;
  isOnline?: boolean;
  matchReasons?: string[];
  requestedMuhurat?: { date: string; window?: string; reason?: string };
  calendarStatus?: "confirmation_required";
  // Public directory presence is independent of this optional, server-derived
  // managed-booking signal. Absence is not treated as a negative eligibility.
  managedBookingEligible?: boolean;
};

type DirectoryResponse = {
  items: PanditWithMeta[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  availableSorts: string[];
};

const SORT_OPTIONS = [
  { value: "best_match", label: "Best match" },
  { value: "highest_rated", label: "Highest rated" },
  { value: "most_reviewed", label: "Most reviewed" },
  { value: "price_low", label: "Price: low to high" },
  { value: "price_high", label: "Price: high to low" },
  { value: "nearest", label: "Nearest first", needsLocation: true },
  { value: "experience", label: "Most experienced" },
] as const;

function formatDistance(d: number | null): string {
  if (d === null || d === undefined) return "";
  if (d < 1) return `${Math.round(d * 1000)} m`;
  if (d < 10) return `${d.toFixed(1)} km`;
  return `${Math.round(d)} km`;
}

function contextualProfileHref(p: PanditWithMeta) {
  const path = p.slug ? `/pandit/${p.slug}` : "/book-pandit-online";
  if (typeof window === "undefined" || !window.location.search) return path;
  return `${path}${window.location.search}`;
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
  verified: boolean;
  onlineOnly: boolean;
};

const DEFAULT_FILTERS: Filters = {
  q: "", tradition: "", specialization: "", languages: [],
  priceMax: 25000, minRating: 0, verified: false, onlineOnly: false,
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

function FilterPanel({ filters, setFilters, facetOptions }: { filters: Filters; setFilters: (f: Filters) => void; facetOptions?: { services: string[]; languages: string[]; traditions: string[] } }) {
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
          {(facetOptions?.traditions || []).map((t) => (
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
            {(facetOptions?.services || []).map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
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
          {(facetOptions?.languages || []).map((lang) => (
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
          <Label className="cursor-pointer">Verified pandits</Label>
          <Switch
            checked={filters.verified}
            onCheckedChange={(v) => setFilters({ ...filters, verified: v })}
            data-testid="switch-verified"
          />
        </div>
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
  const langCount = (p.languages || "").split(",").filter(Boolean).length;
  const isOnline = !!p.isOnline && !p.onLeave;
  const dist = formatDistance(p.distance);
  const { requireAuth } = useAuth();
  const managedBookingUnavailable = p.managedBookingEligible === false;

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
              {p.reviewCount > 0 && p.rating !== undefined ? (
                <>
                  <div className="flex items-center gap-0.5">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span className="font-semibold">{p.rating.toFixed(1)}</span>
                  </div>
                  <span className="text-muted-foreground">
                    ({p.reviewCount} review{p.reviewCount === 1 ? "" : "s"})
                  </span>
                </>
              ) : <span className="font-medium text-muted-foreground">New</span>}
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
            {p.matchReasons?.length ? (
              <div className="mt-3 rounded-md border border-primary/15 bg-primary/5 p-2.5 text-xs" data-testid={`match-reasons-${p.id}`}>
                <p className="font-semibold text-foreground">Why this Pandit matches</p>
                <p className="mt-1 text-muted-foreground">{p.matchReasons.join(" · ")}</p>
                {p.requestedMuhurat ? <p className="mt-1 text-amber-800">Requested: {p.requestedMuhurat.date}{p.requestedMuhurat.window ? ` · ${p.requestedMuhurat.window}` : ""}{p.requestedMuhurat.reason ? ` · ${p.requestedMuhurat.reason}` : ""}. Final calendar availability is confirmed during booking.</p> : null}
              </div>
            ) : null}
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
            <Link href={contextualProfileHref(p)} onClick={() => trackDiscoveryEvent("profile_opened", { pandit_id: p.id, source: "card" })}>
              <Button variant="outline" size="sm" data-testid={`button-view-${p.id}`}>View Profile</Button>
            </Link>
            <Link href={`${contextualProfileHref(p)}#overview`} onClick={() => trackPanditFunnelEvent("contact_cta", { slug: p.slug || undefined, source: "directory" })}>
              <Button size="sm" variant="outline" className="border-green-700 text-green-800" data-testid={`button-call-${p.id}`}><MessageCircle className="h-4 w-4 mr-1.5" /> Call Panditji</Button>
            </Link>
            {managedBookingUnavailable ? <span className="text-xs text-muted-foreground" aria-label="Managed booking unavailable">Managed booking unavailable</span> : <Button
                size="sm"
                data-testid={`button-book-${p.id}`}
                onClick={() => requireAuth(
                  () => { trackPanditFunnelEvent("booking_start", { slug: p.slug || undefined, source: "directory", managed_booking_eligible: p.managedBookingEligible === true }); trackDiscoveryEvent("booking_handoff", { pandit_id: p.id, source: "card" }); window.location.href = `/online-puja-booking?${bookingContextParams(window.location.search, p.id)}`; },
                  { title: "Sign in to book", description: `Please sign in to book ${p.name}` }
                )}
              >
                <Calendar className="h-4 w-4 mr-1.5" /> Book Now
              </Button>}
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
          {selected.length} of 3 selected on this page
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
    { label: "Rating", render: (p) => p.reviewCount > 0 && p.rating !== undefined ? (
      <span className="flex items-center gap-1">
        <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />
        {p.rating.toFixed(1)} ({p.reviewCount})
      </span>
    ) : "New" },
    { label: "Experience", render: (p) => `${p.experience}+ yrs` },
    { label: "Starting fee", render: (p) => `₹${p.fees.toLocaleString("en-IN")}` },
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
            <Link key={p.id} href={contextualProfileHref(p)} onClick={() => trackDiscoveryEvent("profile_opened", { pandit_id: p.id, source: "compare" })}>
              <Button size="sm" variant="outline">View {p.name.split(" ")[0]}</Button>
            </Link>
          ))}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// =====================================================================
// Main directory view
// =====================================================================
export function PanditDirectoryView({ defaultCity, cityLabel, cityId, stateId, stateLabel, stateSlug, cityOptions = [], mode = "city", service, pujaSlug, language, tradition, date, muhurat, facetOptions, embedded = false }: { defaultCity?: string; cityLabel?: string; cityId?: number; stateId?: number; stateLabel?: string; stateSlug?: string; cityOptions?: { id: number; name: string; slug: string; count: number }[]; mode?: "city" | "state" | "nearMe"; service?: string; pujaSlug?: string; language?: string; tradition?: string; date?: string; muhurat?: string; facetOptions?: { services: string[]; languages: string[]; traditions: string[] }; embedded?: boolean }) {
  const initialQuery = typeof window === "undefined" ? new URLSearchParams() : new URLSearchParams(window.location.search);
  const [filters, setFilters] = useState<Filters>(() => ({
    ...DEFAULT_FILTERS,
    q: initialQuery.get("q") || "",
    tradition: initialQuery.get("region") || tradition || "",
    specialization: initialQuery.get("service") || "",
    languages: (initialQuery.get("language") || language || "").split(",").filter(Boolean),
    priceMax: Number(initialQuery.get("maxPrice")) || DEFAULT_FILTERS.priceMax,
    minRating: Number(initialQuery.get("minRating")) || 0,
    verified: initialQuery.get("verified") === "true",
    onlineOnly: initialQuery.get("onlineOnly") === "true",
  }));
  const [debouncedSearch, setDebouncedSearch] = useState(filters.q);
  const [sortBy, setSortBy] = useState(initialQuery.get("sort") || (mode === "nearMe" ? "nearest" : "best_match"));
  const [page, setPage] = useState(Math.max(1, Number(initialQuery.get("page")) || 1));
  const hasAppliedInitialDirectoryState = useRef(false);
  const [, navigate] = useLocation();
  const [compareIds, setCompareIds] = useState<number[]>([]);
  const [compareOpen, setCompareOpen] = useState(false);
  const [aiOpen, setAiOpen] = useState(false);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  // Location is deliberately opt-in. Discovery never asks for permission on mount.
  const [locationState, setLocationState] = useState<"idle" | "requesting" | "denied" | "error">("idle");
  const requestLocation = useCallback(() => {
    trackDiscoveryEvent("location_permission_requested");
    setLocationState("requesting");
    if (!navigator.geolocation) { trackDiscoveryEvent("location_permission_outcome", { outcome: "unsupported" }); setLocationState("error"); return; }
    let settled = false;
    const finish = (state: "idle" | "denied" | "error", coords?: { lat: number; lng: number }) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(fallbackTimer);
      if (coords) setUserLocation(coords);
      trackDiscoveryEvent("location_permission_outcome", { outcome: coords ? "granted" : state });
      setLocationState(state);
    };
    const fallbackTimer = window.setTimeout(() => finish("error"), 6500);
    navigator.geolocation.getCurrentPosition(
      (pos) => finish("idle", { lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => finish(err.code === 1 ? "denied" : "error"),
      { timeout: 5000, maximumAge: 5 * 60 * 1000 },
    );
  }, []);

  // Search is intentionally debounced before it becomes part of the server query.
  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(filters.q.trim()), 300);
    return () => window.clearTimeout(timer);
  }, [filters.q]);

  // A changed directory constraint always starts a fresh server-side page.
  useEffect(() => {
    if (!hasAppliedInitialDirectoryState.current) {
      hasAppliedInitialDirectoryState.current = true;
      return;
    }
    setPage(1);
  }, [debouncedSearch, filters.tradition, filters.specialization, filters.languages, filters.priceMax, filters.minRating, filters.verified, filters.onlineOnly, sortBy, userLocation, mode, cityId, stateId, defaultCity, service, language, date, muhurat, pujaSlug]);

  useEffect(() => {
    const activeCount = [
      !!filters.q,
      !!filters.tradition,
      !!filters.specialization,
      filters.languages.length > 0,
      filters.priceMax !== DEFAULT_FILTERS.priceMax,
      filters.minRating > 0,
      filters.verified,
      filters.onlineOnly,
    ].filter(Boolean).length;
    if (activeCount > 0) trackDiscoveryEvent("filters_changed", { active_count: activeCount });
  }, [debouncedSearch, filters.tradition, filters.specialization, filters.languages.length, filters.priceMax, filters.minRating, filters.verified, filters.onlineOnly]);

  // All directory filtering, ordering, and pagination belongs to the API.
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (mode === "nearMe") params.set("nearMe", "true");
    if (stateId) params.set("stateId", String(stateId));
    if (defaultCity) params.set("city", defaultCity);
    if (cityId) params.set("cityId", String(cityId));
    if (filters.specialization || service) params.set("service", filters.specialization || service || "");
    if (pujaSlug) params.set("pujaSlug", pujaSlug);
    if (filters.languages.length) params.set("language", filters.languages.join(","));
    else if (language) params.set("language", language);
    if (date) params.set("date", date);
    if (muhurat) params.set("muhurat", muhurat);
    if (filters.tradition || tradition) params.set("region", filters.tradition || tradition || "");
    if (debouncedSearch) params.set("q", debouncedSearch);
    if (filters.minRating) params.set("minRating", String(filters.minRating));
    if (filters.priceMax < DEFAULT_FILTERS.priceMax) params.set("maxPrice", String(filters.priceMax));
    if (filters.verified) params.set("verified", "true");
    if (filters.onlineOnly) params.set("onlineOnly", "true");
    params.set("sort", sortBy);
    params.set("page", String(page));
    params.set("pageSize", "12");
    if (userLocation) {
      params.set("lat", userLocation.lat.toString());
      params.set("lng", userLocation.lng.toString());
      if (mode === "nearMe") params.set("radiusKm", "50");
    }
    return params.toString();
  }, [defaultCity, cityId, stateId, mode, service, pujaSlug, language, tradition, date, muhurat, filters, debouncedSearch, sortBy, page, userLocation]);

  const { data, isLoading, isError, refetch, isFetching } = useQuery<DirectoryResponse>({
    queryKey: ["/api/book-pandit-online", queryParams],
    queryFn: async () => {
      const r = await fetch(`/api/book-pandit-online?${queryParams}`);
      if (!r.ok) throw new Error(`Failed to load pandits (${r.status})`);
      const response = await r.json();
      // Canonical contract only: an array would hide inaccurate client-side totals.
      if (!Array.isArray(response?.items) || !response?.pagination) throw new Error("Invalid directory response");
      return response;
    },
    retry: 1,
    enabled: mode !== "nearMe" || !!userLocation,
  });
  const pandits = data?.items || [];
  const pagination = data?.pagination;
  const availableSorts = data?.availableSorts || [];
  useEffect(() => {
    if (data?.items.length) trackPanditFunnelEvent("directory_impression", { source: "directory" });
  }, [data]);
  const supportedSorts = SORT_OPTIONS.filter((option) =>
    availableSorts.includes(option.value) && (!("needsLocation" in option) || !!userLocation),
  );

  // Compare is deliberately scoped to the loaded page. Selections that do
  // not exist in the current response are removed as filters/pages change.
  const compareSelected = useMemo(
    () => pandits.filter((p) => compareIds.includes(p.id)),
    [pandits, compareIds],
  );
  useEffect(() => {
    const valid = new Set(pandits.map((p) => p.id));
    setCompareIds((cur) => {
      const next = cur.filter((id) => valid.has(id));
      return next.length === cur.length ? cur : next;
    });
  }, [data]);

  useEffect(() => {
    if (availableSorts.length && !availableSorts.includes(sortBy)) {
      setSortBy(availableSorts.includes("best_match") ? "best_match" : availableSorts[0]);
    }
  }, [availableSorts, sortBy]);

  const toggleCompare = (id: number) => {
    setCompareIds((cur) => cur.includes(id) ? cur.filter((x) => x !== id) : [...cur, id]);
  };

  const activeFilterCount = (filters.q ? 1 : 0)
    + (filters.tradition ? 1 : 0)
    + (filters.specialization ? 1 : 0)
    + filters.languages.length
    + (filters.minRating > 0 ? 1 : 0)
    + (filters.priceMax < 25000 ? 1 : 0)
    + (filters.verified ? 1 : 0)
    + (filters.onlineOnly ? 1 : 0)
    ;

  const onlineCount = pandits.filter((p) => p.isOnline).length;
  const stateHref = (() => {
    if (!stateId || !stateSlug) return "/book-pandit-online";
    const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
    params.delete("cityId");
    params.delete("city");
    params.set("stateId", String(stateId));
    params.set("state", stateSlug);
    return `/book-pandit-online?${params}`;
  })();

  return (
    <div className={embedded ? "bg-background pb-32" : "bg-background min-h-screen pb-32"}>
      {/* Top header — quick stats + AI CTA. Hidden in embedded mode
          since the parent landing page already provides H1 + hero. */}
      {!embedded && (
        <div className="bg-gradient-to-b from-primary/5 to-background border-b">
          <div className="container max-w-7xl mx-auto px-4 py-6">
            <nav aria-label="Breadcrumb" className="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Link href="/book-pandit-online" className="hover:text-primary">All States</Link>
              {stateLabel ? <><span aria-hidden="true">/</span><Link href={stateHref} className="hover:text-primary">{stateLabel}</Link></> : null}
              {cityLabel ? <><span aria-hidden="true">/</span><span aria-current="page" className="text-foreground">{cityLabel}</span></> : null}
              {mode === "nearMe" ? <><span aria-hidden="true">/</span><span aria-current="page" className="text-foreground">Near Me</span></> : null}
            </nav>
            <div className="flex items-end justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-2xl sm:text-3xl font-serif font-semibold text-foreground">
                  {mode === "nearMe" ? "Pandits near you" : mode === "state" ? `Pandits in ${stateLabel}` : `Pandits in ${cityLabel}`}
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-3 flex-wrap">
                  <span>{pagination ? `${pagination.total.toLocaleString("en-IN")} pandit${pagination.total === 1 ? "" : "s"} available` : "Loading results…"}</span>
                  {onlineCount > 0 && (
                    <span className="flex items-center gap-1.5 text-green-700">
                      <span className="relative flex h-2 w-2">
                        <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                        <span className="relative rounded-full h-2 w-2 bg-green-500" />
                      </span>
                      {onlineCount} online now
                    </span>
                  )}
                  {userLocation && <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> Distance calculated from your location</span>}
                </p>
              </div>
              <Button onClick={() => setAiOpen(true)} variant="outline" className="gap-2" data-testid="button-open-ai">
                <Wand2 className="h-4 w-4 text-primary" />
                Not sure which puja? <span className="text-primary">Ask AI</span>
              </Button>
            </div>
            {mode === "state" && cityOptions.length > 0 ? (
              <div className="mt-5 max-w-sm">
                <Label htmlFor="state-city-filter" className="text-xs text-muted-foreground">Narrow to a City</Label>
                <Select onValueChange={(value) => {
                  const chosen = cityOptions.find((item) => String(item.id) === value);
                  if (!chosen || !stateId || !stateSlug) return;
                  const params = new URLSearchParams(typeof window === "undefined" ? "" : window.location.search);
                  params.set("stateId", String(stateId));
                  params.set("state", stateSlug);
                  params.set("cityId", String(chosen.id));
                  params.set("city", chosen.slug);
                  params.delete("scope");
                  navigate(`/book-pandit-online?${params}`);
                }}>
                  <SelectTrigger id="state-city-filter" className="mt-1 bg-background"><SelectValue placeholder={`Choose a City in ${stateLabel}`} /></SelectTrigger>
                  <SelectContent>{cityOptions.map((item) => <SelectItem key={item.id} value={String(item.id)}>{item.name} ({item.count})</SelectItem>)}</SelectContent>
                </Select>
              </div>
            ) : null}

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
            {date && (
              <div className="mt-4 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm" data-testid="banner-muhurat-context">
                <strong>Selected auspicious window:</strong> {date}{muhurat ? ` · ${muhurat}` : ""}. These Pandits match your ritual and filters; their calendar is confirmed in the booking request.
              </div>
            )}
          </div>
        </div>
      )}
      {mode === "nearMe" && !userLocation && (
        <div className="container max-w-7xl mx-auto px-4 pt-5">
          <Card className="border-primary/20 bg-primary/5">
            <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div><p className="font-semibold">Find pandits near your current location</p><p className="text-sm text-muted-foreground">Your coordinates are used only to calculate nearby results. We never guess your location.</p>
                {locationState === "denied" && <p className="mt-1 text-sm text-destructive">Location permission was denied. Allow it in your browser settings, or search by State or City.</p>}
                {locationState === "error" && <p className="mt-1 text-sm text-destructive">We could not access your location. Please try again or search by State or City.</p>}
              </div>
              <Button onClick={requestLocation} disabled={locationState === "requesting"} className="shrink-0"><Navigation className="mr-2 h-4 w-4" />{locationState === "requesting" ? "Requesting…" : "Use my location"}</Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Embedded-mode compact stats strip (no H1) — keeps online count
          and AI helper visible without duplicating the parent hero. */}
      {embedded && (
        <div className="container max-w-7xl mx-auto px-4 pt-2">
          <div className="flex items-center justify-between gap-3 flex-wrap text-sm">
            <p className="text-muted-foreground flex items-center gap-3 flex-wrap" data-testid="text-embedded-stats">
              <span>{pagination ? `${pagination.total.toLocaleString("en-IN")} pandit${pagination.total === 1 ? "" : "s"} available` : "Loading results…"}</span>
              {onlineCount > 0 && (
                <span className="flex items-center gap-1.5 text-green-700">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                    <span className="relative rounded-full h-2 w-2 bg-green-500" />
                  </span>
                  {onlineCount} online now
                </span>
              )}
              {userLocation && <span className="flex items-center gap-1"><Navigation className="h-3 w-3" /> Distance calculated from your location</span>}
            </p>
            <Button onClick={() => setAiOpen(true)} variant="outline" size="sm" className="gap-2" data-testid="button-open-ai">
              <Wand2 className="h-4 w-4 text-primary" />
              Ask AI
            </Button>
          </div>
          {aiSuggestion && (
            <div className="mt-3 rounded-md bg-primary/10 border border-primary/20 px-3 py-2 text-sm flex items-center gap-2 flex-wrap" data-testid="banner-ai-applied">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Showing pandits for <strong>{aiSuggestion}</strong>.</span>
              <button
                className="text-xs underline text-primary ml-auto"
                onClick={() => { setAiSuggestion(null); setFilters({ ...filters, specialization: "" }); }}
              >Clear</button>
            </div>
          )}
        </div>
      )}

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
                <FilterPanel filters={filters} setFilters={setFilters} facetOptions={facetOptions} />
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
                <SheetHeader><SheetTitle>Filters</SheetTitle><SheetDescription>Narrow the eligible Pandits shown in these results.</SheetDescription></SheetHeader>
                <div className="mt-6">
                   <FilterPanel filters={filters} setFilters={setFilters} facetOptions={facetOptions} />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="outline" className="flex-1" onClick={() => setFilters(DEFAULT_FILTERS)}>Clear</Button>
                  <Button className="flex-1" onClick={() => setFilterSheetOpen(false)}>Show {pagination?.total ?? 0}</Button>
                </div>
              </SheetContent>
            </Sheet>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-[180px]" data-testid="select-sort">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {supportedSorts.map((option) => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
              </SelectContent>
            </Select>

          </div>

          {/* Results */}
          {mode === "nearMe" && !userLocation ? null : isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-44 w-full" />)}
            </div>
          ) : isError ? (
            <Card data-testid="state-pandits-error">
              <CardContent className="p-12 text-center">
                <X className="h-10 w-10 mx-auto text-destructive mb-3" />
                <p className="font-semibold">We couldn't load the pandit list</p>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  This is usually a temporary network issue. Please try again — if it keeps happening, you can reach us on WhatsApp.
                </p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  <Button onClick={() => refetch()} disabled={isFetching} data-testid="button-retry-pandits">
                    {isFetching ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
                    Try again
                  </Button>
                  <Link href="/online-puja-booking">
                    <Button variant="outline" data-testid="button-fallback-online-puja">Book online puja instead</Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          ) : pandits.length === 0 ? (
            <Card data-testid="state-pandits-empty">
              <CardContent className="p-12 text-center">
                <Search className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
                <p className="font-semibold">
                  {(pagination?.total || 0) === 0
                    ? mode === "nearMe"
                      ? "No eligible Pandits found within 50 km"
                      : `No Pandits onboarded in ${cityLabel || stateLabel || "this area"} yet`
                    : "No pandits match these filters"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {(pagination?.total || 0) === 0
                    ? mode === "nearMe"
                      ? "Try again from another location, or browse by State and City instead."
                      : `We're verifying our first batch of ${cityLabel || stateLabel || "local"} Pandits — until then you can book the same ritual via a live online puja.`
                    : "Try clearing filters or expanding the price range."}
                </p>
                <div className="flex gap-2 justify-center mt-4 flex-wrap">
                  {(pagination?.total || 0) === 0 ? (
                    <Link href="/online-puja-booking">
                      <Button data-testid="button-empty-online-puja">Book online puja</Button>
                    </Link>
                  ) : (
                    <Button variant="outline" onClick={() => setFilters(DEFAULT_FILTERS)}>Reset filters</Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {pandits.map((p) => (
                <PanditCard
                  key={p.id}
                  p={p}
                  compareSelected={compareIds.includes(p.id)}
                  compareDisabled={compareIds.length >= 3}
                  onToggleCompare={() => toggleCompare(p.id)}
                />
              ))}
              {pagination && pagination.totalPages > 1 ? (
                <nav className="flex flex-wrap items-center justify-center gap-2 pt-4" aria-label="Directory pages">
                  <Button variant="outline" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={!pagination.hasPreviousPage} aria-label="Previous page">Previous</Button>
                  {Array.from({ length: pagination.totalPages }, (_, index) => index + 1)
                    .filter((number) => number === 1 || number === pagination.totalPages || Math.abs(number - pagination.page) <= 1)
                    .map((number, index, shown) => <span key={number} className="contents">
                      {index > 0 && number - shown[index - 1] > 1 ? <span className="px-1 text-muted-foreground" aria-hidden="true">…</span> : null}
                      <Button variant={number === pagination.page ? "default" : "outline"} size="sm" className="min-w-10" onClick={() => setPage(number)} aria-current={number === pagination.page ? "page" : undefined}>{number}</Button>
                    </span>)}
                  <Button variant="outline" onClick={() => setPage((current) => current + 1)} disabled={!pagination.hasNextPage} aria-label="Next page">Next</Button>
                </nav>
              ) : null}
            </div>
          )}
        </main>
      </div>

      {/* Mobile sticky action bar — shows when compare empty so the
          primary "book the top match" action is always one tap away. */}
      {compareSelected.length === 0 && pandits.length > 0 && (
        <div className="fixed bottom-0 inset-x-0 z-30 lg:hidden border-t bg-background/95 backdrop-blur shadow-lg" data-testid="bar-mobile-cta">
          <div className="px-4 py-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-xs text-muted-foreground">Top result {cityLabel ? `in ${cityLabel}` : stateLabel ? `in ${stateLabel}` : "near you"}</div>
              <div className="text-sm font-semibold truncate">{pandits[0].name} · ₹{pandits[0].fees.toLocaleString("en-IN")}</div>
            </div>
            <Link href={contextualProfileHref(pandits[0])} onClick={() => trackDiscoveryEvent("profile_opened", { pandit_id: pandits[0].id, source: "mobile_top" })}>
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
