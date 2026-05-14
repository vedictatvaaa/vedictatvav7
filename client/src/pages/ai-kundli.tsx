import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Sparkles,
  Star,
  Sun,
  Moon,
  Heart,
  TrendingUp,
  Activity,
  Brain,
  Gem,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Compass,
  Calendar,
  Palette,
  Hash,
  Clock,
  Loader2,
  ShieldCheck,
  Globe,
  HeartHandshake,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/api";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageAPlusContent from "@/components/PageAPlusContent";
import { PageHero, SectionHeader } from "@/components/ui/section-primitives";

interface KundliReport {
  summary: {
    overview: string;
    rashi: string;
    nakshatra: string;
    lagna: string;
    sunSign: string;
  };
  planetaryPositions: Array<{
    planet: string;
    sign: string;
    house: number;
    degree: string;
    status: string;
  }>;
  doshas: Array<{
    name: string;
    present: boolean;
    severity: string;
    remedy: string;
  }>;
  mahadasha: {
    currentDasha: string;
    planet: string;
    startDate: string;
    endDate: string;
    description: string;
  };
  predictions: {
    career: string;
    health: string;
    relationships: string;
    finance: string;
    spiritual: string;
  };
  yogas: Array<{
    name: string;
    type: string;
    description: string;
  }>;
  luckyElements: {
    number: string;
    color: string;
    day: string;
    gemstone: string;
    metal: string;
    direction: string;
  };
  manglikStatus: {
    isManglik: boolean;
    details: string;
  };
  remedies: string[];
}

const predictionIcons: Record<string, typeof TrendingUp> = {
  career: TrendingUp,
  health: Activity,
  relationships: Heart,
  finance: Gem,
  spiritual: Brain,
};

const predictionLabels: Record<string, string> = {
  career: "Career & Profession",
  health: "Health & Wellness",
  relationships: "Relationships & Love",
  finance: "Finance & Wealth",
  spiritual: "Spiritual Growth",
};

const inputCls =
  "h-10 w-full rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] px-3 text-[13px] text-[#3a1a20] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:ring-1 focus:ring-[#D4AF37] focus:border-[#D4AF37]";

const labelCls =
  "text-[10px] uppercase tracking-[0.25em] font-semibold text-[#6D2B35]";

const sectionCard = "rounded-lg border border-[#D4AF37]/20 bg-white p-6 md:p-7";

function FieldLabel({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <label htmlFor={htmlFor} className={`${labelCls} flex items-center gap-1.5`}>
      <span>{children}</span>
      {optional && (
        <span className="text-[#5a4a3a]/40 normal-case tracking-normal text-[10px] font-normal">
          (optional)
        </span>
      )}
    </label>
  );
}

export default function AiKundli() {
  const { toast } = useToast();
  const [fullName, setFullName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthCity, setBirthCity] = useState("");
  const [gender, setGender] = useState("Male");
  const [report, setReport] = useState<KundliReport | null>(null);

  const kundliMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("/api/ai/kundli", {
        method: "POST",
        body: JSON.stringify({
          fullName,
          birthDate,
          birthTime: birthTime || null,
          birthCity: birthCity || null,
          gender,
        }),
      });
    },
    onSuccess: (data: KundliReport) => {
      setReport(data);
      toast({
        title: "Kundli Generated",
        description: `Your AI-powered Kundli report for ${fullName} is ready.`,
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Could not generate your Kundli. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !birthDate) {
      toast({
        title: "Missing Details",
        description: "Please provide your full name and date of birth.",
        variant: "destructive",
      });
      return;
    }
    kundliMutation.mutate();
  };

  return (
    <div className="w-full bg-[#FBF7EE] pb-16">
      <PageHero
        eyebrow="AI Kundli · Free Forever"
        title="AI Janam Kundli Generation"
        subtitle="Authentic Vedic birth chart powered by AI. Get planetary positions, dasha analysis, doshas, predictions and personalised remedies — instantly and free."
        testId="ai-kundli-hero"
      />

      <div className="container mx-auto px-4 -mt-8 relative z-10">
        <div
          className="max-w-2xl mx-auto rounded-lg border border-[#D4AF37]/30 bg-white p-6 md:p-8"
          data-testid="card-birth-form"
        >
          <div className="text-center mb-6">
            <p className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37] font-semibold mb-2">
              Birth Details
            </p>
            <h2 className="text-xl md:text-2xl font-serif font-semibold text-[#6D2B35]">
              Enter Your Details
            </h2>
            <p className="text-[12px] text-[#5a4a3a]/60 mt-1.5">
              Provide accurate details for the most precise Kundli reading.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <FieldLabel htmlFor="fullName">
                Full Name <span className="text-[#6D2B35] normal-case">*</span>
              </FieldLabel>
              <input
                id="fullName"
                type="text"
                placeholder="Enter your full name"
                className={inputCls}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                data-testid="input-full-name"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="birthDate">
                  Date of Birth <span className="text-[#6D2B35] normal-case">*</span>
                </FieldLabel>
                <input
                  id="birthDate"
                  type="date"
                  className={inputCls}
                  value={birthDate}
                  onChange={(e) => setBirthDate(e.target.value)}
                  data-testid="input-birth-date"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="birthTime" optional>
                  Time of Birth
                </FieldLabel>
                <input
                  id="birthTime"
                  type="time"
                  className={inputCls}
                  value={birthTime}
                  onChange={(e) => setBirthTime(e.target.value)}
                  data-testid="input-birth-time"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <FieldLabel htmlFor="birthCity" optional>
                  Place of Birth
                </FieldLabel>
                <input
                  id="birthCity"
                  type="text"
                  placeholder="e.g., Mumbai, Delhi"
                  className={inputCls}
                  value={birthCity}
                  onChange={(e) => setBirthCity(e.target.value)}
                  data-testid="input-birth-city"
                />
              </div>
              <div className="space-y-1.5">
                <FieldLabel htmlFor="gender">Gender</FieldLabel>
                <select
                  id="gender"
                  className={inputCls}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  data-testid="select-gender"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={kundliMutation.isPending}
              className="w-full inline-flex items-center justify-center gap-2 h-11 px-5 rounded-md bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] text-[13px] font-semibold uppercase tracking-wider border border-[#6D2B35] transition-colors disabled:opacity-60 mt-2"
              data-testid="button-generate-kundli"
            >
              {kundliMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Analyzing celestial positions…
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4" strokeWidth={1.8} />
                  Generate My Kundli
                </>
              )}
            </button>
          </form>
        </div>
      </div>

      {report && (
        <div
          className="container mx-auto px-4 mt-14 space-y-8"
          data-testid="section-report"
        >
          <SectionHeader
            eyebrow="Your Kundli Report"
            title={`Kundli for ${fullName}`}
            testIdPrefix="report-heading"
          />

          {/* SUMMARY */}
          <div className={sectionCard} data-testid="card-summary">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-4 flex items-center gap-2">
              <Sun className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Summary
            </h3>
            <p
              className="text-[13px] text-[#5a4a3a]/80 leading-relaxed mb-5"
              data-testid="text-summary-overview"
            >
              {report.summary.overview}
            </p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Rashi", value: report.summary.rashi },
                { label: "Nakshatra", value: report.summary.nakshatra },
                { label: "Lagna", value: report.summary.lagna },
                { label: "Sun Sign", value: report.summary.sunSign },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3 text-center"
                  data-testid={`text-summary-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <p className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.25em] font-semibold mb-1">
                    {item.label}
                  </p>
                  <p className="text-[13px] font-serif font-semibold text-[#6D2B35]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* PLANETARY POSITIONS */}
          <div className={sectionCard} data-testid="card-planetary-positions">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-5 flex items-center gap-2">
              <Moon className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Planetary Positions
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-[#D4AF37]/25">
                    {["Planet", "Sign", "House", "Degree", "Status"].map((h, i) => (
                      <th
                        key={h}
                        className={`py-2.5 px-2 text-[#5a4a3a]/60 font-semibold text-[10px] uppercase tracking-[0.2em] ${i === 0 || i === 1 ? "text-left" : "text-center"}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.planetaryPositions.map((planet, idx) => (
                    <tr
                      key={idx}
                      className="border-b border-[#D4AF37]/10"
                      data-testid={`row-planet-${idx}`}
                    >
                      <td className="py-3 px-2 font-semibold text-[#6D2B35]">{planet.planet}</td>
                      <td className="py-3 px-2 text-[#5a4a3a]">{planet.sign}</td>
                      <td className="py-3 px-2 text-center text-[#5a4a3a]">{planet.house}</td>
                      <td className="py-3 px-2 text-center text-[#5a4a3a]">{planet.degree}</td>
                      <td className="py-3 px-2 text-center">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase tracking-wider border ${
                            planet.status.toLowerCase() === "exalted"
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                              : planet.status.toLowerCase() === "debilitated"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : planet.status.toLowerCase() === "own sign"
                                  ? "bg-[#FBF7EE] text-[#6D2B35] border-[#D4AF37]/40"
                                  : "bg-stone-50 text-stone-600 border-stone-200"
                          }`}
                        >
                          {planet.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* DOSHAS */}
          <div data-testid="section-doshas">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Doshas
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.doshas.map((dosha, idx) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-4 ${dosha.present ? "border-red-200 bg-red-50/40" : "border-emerald-200 bg-emerald-50/40"}`}
                  data-testid={`card-dosha-${idx}`}
                >
                  <div className="flex items-center justify-between mb-2.5">
                    <h4 className="font-serif font-semibold text-[#6D2B35] text-[13px]">
                      {dosha.name}
                    </h4>
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[9px] px-2 py-0.5 rounded-md font-semibold uppercase tracking-wider border ${
                          dosha.severity === "High"
                            ? "bg-red-100 text-red-700 border-red-200"
                            : dosha.severity === "Medium"
                              ? "bg-amber-100 text-amber-700 border-amber-200"
                              : "bg-emerald-100 text-emerald-700 border-emerald-200"
                        }`}
                        data-testid={`badge-severity-${idx}`}
                      >
                        {dosha.severity}
                      </span>
                      {dosha.present ? (
                        <XCircle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-[#5a4a3a]/55 font-semibold mb-2">
                    {dosha.present ? "Present" : "Absent"}
                  </p>
                  <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{dosha.remedy}</p>
                </div>
              ))}
            </div>
          </div>

          {/* MAHADASHA */}
          <div className={sectionCard} data-testid="card-mahadasha">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-4 flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Mahadasha — Current Dasha Period
            </h3>
            <div className="rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 p-5">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                {[
                  { label: "Current Dasha", value: report.mahadasha.currentDasha, testId: "text-current-dasha" },
                  { label: "Ruling Planet", value: report.mahadasha.planet },
                  { label: "Start Date", value: report.mahadasha.startDate },
                  { label: "End Date", value: report.mahadasha.endDate },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.25em] font-semibold mb-1">
                      {item.label}
                    </p>
                    <p
                      className="text-[13px] font-serif font-semibold text-[#6D2B35]"
                      data-testid={item.testId}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <p
                className="text-[12px] text-[#5a4a3a]/75 leading-relaxed"
                data-testid="text-mahadasha-description"
              >
                {report.mahadasha.description}
              </p>
            </div>
          </div>

          {/* PREDICTIONS */}
          <div data-testid="section-predictions">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Life Predictions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {Object.entries(report.predictions).map(([key, value]) => {
                const Icon = predictionIcons[key] || Star;
                return (
                  <div
                    key={key}
                    className="rounded-lg border border-[#D4AF37]/20 bg-white p-4 hover:border-[#D4AF37]/45 transition-colors"
                    data-testid={`card-prediction-${key}`}
                  >
                    <div className="flex items-center gap-2.5 mb-2.5">
                      <div className="w-7 h-7 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/25 flex items-center justify-center">
                        <Icon className="h-3.5 w-3.5 text-[#6D2B35]" strokeWidth={1.8} />
                      </div>
                      <h4 className="font-serif font-semibold text-[#6D2B35] text-[13px]">
                        {predictionLabels[key] || key}
                      </h4>
                    </div>
                    <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">{value}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* YOGAS */}
          <div className={sectionCard} data-testid="card-yogas">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-5 flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Yogas Found
            </h3>
            <div className="space-y-2">
              {report.yogas.map((yoga, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/15"
                  data-testid={`row-yoga-${idx}`}
                >
                  <div className="mt-0.5">
                    {yoga.type === "positive" ? (
                      <CheckCircle className="h-4 w-4 text-emerald-600" strokeWidth={1.8} />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" strokeWidth={1.8} />
                    )}
                  </div>
                  <div>
                    <h4 className="text-[13px] font-semibold text-[#6D2B35]">{yoga.name}</h4>
                    <p className="text-[12px] text-[#5a4a3a]/65 mt-0.5 leading-relaxed">
                      {yoga.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* LUCKY ELEMENTS */}
          <div className={sectionCard} data-testid="card-lucky-elements">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-5 flex items-center gap-2">
              <Gem className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Lucky Elements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Lucky Number", value: report.luckyElements.number, icon: Hash },
                { label: "Lucky Color", value: report.luckyElements.color, icon: Palette },
                { label: "Lucky Day", value: report.luckyElements.day, icon: Calendar },
                { label: "Gemstone", value: report.luckyElements.gemstone, icon: Gem },
                { label: "Metal", value: report.luckyElements.metal, icon: Shield },
                { label: "Direction", value: report.luckyElements.direction, icon: Compass },
              ].map((item) => (
                <div
                  key={item.label}
                  className="bg-[#FBF7EE] rounded-md border border-[#D4AF37]/20 p-3 text-center"
                  data-testid={`text-lucky-${item.label.toLowerCase().replace(/\s+/g, "-")}`}
                >
                  <item.icon
                    className="h-4 w-4 text-[#D4AF37] mx-auto mb-1.5"
                    strokeWidth={1.8}
                  />
                  <p className="text-[9px] text-[#5a4a3a]/55 uppercase tracking-[0.25em] font-semibold mb-1">
                    {item.label}
                  </p>
                  <p className="text-[12px] font-serif font-semibold text-[#6D2B35]">
                    {item.value}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* MANGLIK */}
          <div
            className={`rounded-lg border p-6 md:p-7 ${report.manglikStatus.isManglik ? "border-red-200 bg-red-50/30" : "border-emerald-200 bg-emerald-50/30"}`}
            data-testid="card-manglik-status"
          >
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-3 flex items-center gap-2">
              <Heart className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Manglik Status
            </h3>
            <div className="flex items-center gap-2 mb-3">
              {report.manglikStatus.isManglik ? (
                <span
                  className="inline-flex items-center gap-1.5 bg-red-100 text-red-700 border border-red-200 px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider"
                  data-testid="badge-manglik"
                >
                  <XCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Manglik — Yes
                </span>
              ) : (
                <span
                  className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-md text-[11px] font-semibold uppercase tracking-wider"
                  data-testid="badge-manglik"
                >
                  <CheckCircle className="h-3.5 w-3.5" strokeWidth={1.8} />
                  Manglik — No
                </span>
              )}
            </div>
            <p className="text-[12px] text-[#5a4a3a]/75 leading-relaxed">
              {report.manglikStatus.details}
            </p>
          </div>

          {/* REMEDIES */}
          <div className={sectionCard} data-testid="card-remedies">
            <h3 className="text-base font-serif font-semibold text-[#6D2B35] mb-5 flex items-center gap-2">
              <Shield className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              Personalized Remedies
            </h3>
            <div className="space-y-2">
              {report.remedies.map((remedy, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-3 p-3.5 rounded-md bg-[#FBF7EE] border border-[#D4AF37]/15"
                  data-testid={`text-remedy-${idx}`}
                >
                  <div className="w-6 h-6 rounded-md bg-[#6D2B35] text-[#D4AF37] flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold">{idx + 1}</span>
                  </div>
                  <p className="text-[12px] text-[#5a4a3a]/80 leading-relaxed">{remedy}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      <PageAPlusContent
        eyebrow="Why Generate Your Kundli on Vedic Tatva"
        title="Free AI Kundli — Authentic Vedic Birth Chart in Seconds"
        intro="Your Janam Kundli is the cosmic blueprint of your life. Our AI-powered kundli engine uses authentic Vedic calculations (Lahiri Ayanamsa — the same system used by traditional astrologers) to generate your birth chart, dasha periods, doshas and personalised remedies. Completely free."
        trustBadges={[
          { value: "100%", label: "Free Forever" },
          { value: "10L+", label: "Kundlis Generated" },
          { value: "36-Pt", label: "Guna Milan" },
          { value: "12+", label: "Languages" },
        ]}
        benefits={[
          {
            icon: ShieldCheck,
            title: "Authentic Vedic Calculations",
            body: "Built on Lahiri Ayanamsa — the official Indian government standard — ensuring every nakshatra, dasha and dosha calculation is scripture-accurate.",
          },
          {
            icon: Brain,
            title: "AI-Powered Insights",
            body: "Beyond calculations, our AI synthesises your chart into easy-to-read predictions across career, love, marriage, finance and health.",
          },
          {
            icon: HeartHandshake,
            title: "Free Kundli Matching",
            body: "Check 36-point Ashtakoot Guna Milan for marriage compatibility — Mangal Dosha and Bhakoot Dosha automatically flagged with remedies.",
          },
          {
            icon: Clock,
            title: "Vimshottari Dasha Analysis",
            body: "See your current Mahadasha, Antardasha and Pratyantar dasha — understand which planetary period rules your life right now.",
          },
          {
            icon: Sparkles,
            title: "Personalised Remedies",
            body: "Get specific gemstone, mantra, yantra and donation remedies tailored to your kundli's doshas and weak planetary positions.",
          },
          {
            icon: Globe,
            title: "Available in 12+ Languages",
            body: "Read your kundli in Hindi, English, Tamil, Telugu, Kannada, Bengali, Marathi, Gujarati, Malayalam, Punjabi, Odia & more.",
          },
        ]}
        steps={[
          { title: "Enter Birth Details", body: "Provide your full date, exact time, and place of birth — the only inputs needed for an accurate chart." },
          { title: "AI Casts Your Chart", body: "Our engine calculates your D-1 birth chart, dashas, nakshatra, rashi and all major doshas instantly." },
          { title: "Read Your Predictions", body: "Get personalised insights on career, love, marriage, finance, health and your current dasha period." },
          { title: "Apply Remedies", body: "Follow recommended mantra, gemstone, donation or puja remedies to balance challenging planetary positions." },
        ]}
        faqs={[
          {
            q: "Is the kundli on Vedic Tatva really free?",
            a: "Yes — 100% free. Generating your kundli, viewing your dasha, checking Mangal/Bhakoot dosha, and getting basic remedies costs nothing. Premium consultations with our astrologers are optional add-ons.",
          },
          {
            q: "How accurate is the AI Kundli?",
            a: "Our engine uses Lahiri Ayanamsa — the official Indian government standard — for all astronomical calculations, the same system used by traditional Vedic astrologers and the Indian Astronomical Ephemeris. The AI layer adds personalisation but never changes the underlying math.",
          },
          {
            q: "Can I check kundli matching for marriage?",
            a: "Yes — completely free. Our Ashtakoot Guna Milan matches both kundlis on 36 points across Varna, Vashya, Tara, Yoni, Graha Maitri, Gana, Bhakoot and Nadi. Mangal Dosha and Nadi Dosha are flagged automatically with remedy guidance.",
          },
          {
            q: "What is Mangal Dosha and how do I check it?",
            a: "Mangal Dosha (also called Manglik Dosha) occurs when Mars sits in specific houses (1, 4, 7, 8, 12) of your kundli. Our chart instantly flags it with severity (high/medium/low) and effective remedies — no need to consult separately.",
          },
          {
            q: "What information do I need to generate my kundli?",
            a: "Just three things: your full date of birth, exact time of birth (down to the minute — check your birth certificate), and place of birth (city/town). The more precise the time, the more accurate your dashas.",
          },
          {
            q: "Can I download or share my kundli?",
            a: "Yes — you can download your full kundli report as a PDF, or share it directly via WhatsApp with family members or astrologers.",
          },
          {
            q: "What is Vimshottari Dasha?",
            a: "Vimshottari Dasha is the most important predictive system in Vedic astrology. It divides your 120-year life into planetary periods. Knowing your current Mahadasha (e.g. Sun, Saturn, Jupiter) reveals which planet rules your life events right now.",
          },
          {
            q: "Should I consult a real astrologer too?",
            a: "AI gives you the foundation — accurate calculations and personalised insights. For life-changing decisions (marriage, business, major remedies), our verified astrologers offer paid 1-on-1 consultations to deep-dive into your unique chart.",
          },
        ]}
        keywordsBlurb="Generate free online kundli (janam kundli, birth chart, horoscope) with accurate Vedic calculations. Free kundli matching for marriage with Ashtakoot Guna Milan. Check Mangal Dosha, Manglik Dosha, Kaal Sarp Dosh, Pitra Dosh. Get Vimshottari Dasha analysis, nakshatra-based predictions, planetary remedies and gemstone recommendations — in Hindi, English and 10+ Indian languages."
      />

      <div className="container mx-auto px-4">
        <RelatedServicesSection context="kundli" currentPath="/ai-kundli" />
      </div>
    </div>
  );
}
