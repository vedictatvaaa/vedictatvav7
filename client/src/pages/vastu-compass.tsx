import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import {
  Compass, Plus, Trash2, Loader2, AlertTriangle, CheckCircle, Info, Sparkles,
  Home, ChevronDown, Navigation, RotateCcw, Zap, Sun, BookOpen,
  Palette, Sprout, Flame, Hammer
} from "lucide-react";
import { RelatedServicesSection } from "@/components/RelatedServices";
import PageAPlusContent from "@/components/PageAPlusContent";

type RoomEntry = {
  id: string;
  name: string;
  direction: string;
  degrees: number;
};

type Finding = {
  room: string;
  direction: string;
  status: "excellent" | "good" | "warning" | "critical";
  finding: string;
  remedy: string | null;
};

type VastuAnalysis = {
  overallScore: number;
  overallVerdict: string;
  findings: Finding[];
  generalTips: string[];
  luckyElements: {
    color: string;
    plant: string;
    symbol: string;
    material: string;
  };
  doshaAnalysis: string;
  energyFlow: string;
};

const ROOM_OPTIONS = [
  "Main Entrance", "Kitchen", "Master Bedroom", "Living Room", "Bathroom/Toilet",
  "Pooja Room", "Dining Room", "Study Room", "Children's Room", "Guest Room",
  "Staircase", "Balcony", "Garden", "Garage", "Store Room", "Water Tank",
  "Septic Tank", "Main Gate", "Exit Door", "Kitchen Stove", "Wash Area",
];

const PRIMARY_BTN =
  "inline-flex items-center justify-center gap-2 bg-[#6D2B35] text-[#D4AF37] hover:bg-[#5a1f29] disabled:opacity-50 disabled:cursor-not-allowed rounded-md h-10 px-5 text-[13px] font-semibold transition-colors";

const OUTLINE_BTN =
  "inline-flex items-center justify-center gap-2 bg-[#FBF7EE] text-[#6D2B35] hover:bg-[#f3ecdc] border border-[#D4AF37]/40 rounded-md h-10 px-5 text-[13px] font-semibold transition-colors";

const FIELD_INPUT =
  "w-full h-10 rounded-md border border-[#D4AF37]/30 bg-white px-3 text-[13px] text-[#5a4a3a] placeholder:text-[#5a4a3a]/40 focus:outline-none focus:border-[#6D2B35] focus:ring-1 focus:ring-[#6D2B35]/30 transition-colors";

const FIELD_LABEL =
  "block text-[10px] uppercase tracking-[0.18em] font-semibold text-[#5a4a3a]/70 mb-1.5";

function getDirectionFromDegrees(deg: number): string {
  const dirs = ["North", "North-East", "East", "South-East", "South", "South-West", "West", "North-West"];
  const idx = Math.round(((deg % 360 + 360) % 360) / 45) % 8;
  return dirs[idx];
}

function getStatusTokens(status: string) {
  switch (status) {
    case "excellent": return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: "text-emerald-600" };
    case "good": return { bg: "bg-[#FBF7EE]", text: "text-[#6D2B35]", border: "border-[#D4AF37]/30", icon: "text-[#D4AF37]" };
    case "warning": return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: "text-amber-600" };
    case "critical": return { bg: "bg-rose-50", text: "text-rose-700", border: "border-rose-200", icon: "text-rose-600" };
    default: return { bg: "bg-[#FBF7EE]", text: "text-[#5a4a3a]", border: "border-[#D4AF37]/25", icon: "text-[#5a4a3a]" };
  }
}

function getScoreText(score: number) {
  if (score >= 80) return "text-emerald-700";
  if (score >= 60) return "text-[#6D2B35]";
  if (score >= 40) return "text-amber-700";
  return "text-rose-700";
}

export default function VastuCompass() {
  const { toast } = useToast();
  const [compassHeading, setCompassHeading] = useState<number | null>(null);
  const [compassSupported, setCompassSupported] = useState(true);
  const [permissionNeeded, setPermissionNeeded] = useState(false);
  const [rooms, setRooms] = useState<RoomEntry[]>([]);
  const [selectedRoom, setSelectedRoom] = useState(ROOM_OPTIONS[0]);
  const [manualDegrees, setManualDegrees] = useState("");
  const [analysis, setAnalysis] = useState<VastuAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"compass" | "results">("compass");

  const handleOrientation = useCallback((event: DeviceOrientationEvent) => {
    let heading: number | null = null;
    if ("webkitCompassHeading" in event) {
      heading = (event as any).webkitCompassHeading as number;
    } else if (event.alpha !== null) {
      heading = (360 - event.alpha) % 360;
    }
    if (heading !== null) {
      setCompassHeading(Math.round(heading));
    }
  }, []);

  useEffect(() => {
    if (typeof DeviceOrientationEvent !== "undefined") {
      if (typeof (DeviceOrientationEvent as any).requestPermission === "function") {
        setPermissionNeeded(true);
      } else {
        window.addEventListener("deviceorientation", handleOrientation, true);
      }
    } else {
      setCompassSupported(false);
    }
    return () => {
      window.removeEventListener("deviceorientation", handleOrientation, true);
    };
  }, [handleOrientation]);

  const requestPermission = async () => {
    try {
      const permission = await (DeviceOrientationEvent as any).requestPermission();
      if (permission === "granted") {
        window.addEventListener("deviceorientation", handleOrientation, true);
        setPermissionNeeded(false);
      }
    } catch {
      toast({ title: "Compass permission denied", variant: "destructive" });
    }
  };

  const addRoom = () => {
    if (compassHeading === null && !manualDegrees.trim()) {
      toast({ title: "Please enter compass degrees or enable compass", variant: "destructive" });
      return;
    }
    const rawDeg = compassHeading !== null ? compassHeading : parseInt(manualDegrees);
    const degrees = isNaN(rawDeg) ? 0 : ((rawDeg % 360) + 360) % 360;
    const direction = getDirectionFromDegrees(degrees);

    if (rooms.some(r => r.name === selectedRoom)) {
      toast({ title: `${selectedRoom} is already added`, variant: "destructive" });
      return;
    }

    setRooms([...rooms, {
      id: `${Date.now()}`,
      name: selectedRoom,
      direction,
      degrees,
    }]);

    toast({ title: `${selectedRoom} added facing ${direction}` });
  };

  const removeRoom = (id: string) => {
    setRooms(rooms.filter(r => r.id !== id));
  };

  const analyzeVastu = async () => {
    if (rooms.length < 2) {
      toast({ title: "Please add at least 2 rooms/areas for analysis", variant: "destructive" });
      return;
    }
    setLoading(true);
    try {
      const entrance = rooms.find(r => r.name === "Main Entrance");
      const res = await fetch("/api/ai/vastu-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rooms: rooms.map(r => ({ name: r.name, direction: r.direction, degrees: r.degrees })),
          heading: entrance?.degrees ?? compassHeading,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data);
        setActiveTab("results");
      } else {
        toast({ title: "Analysis failed. Please try again.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Could not connect to server", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetAll = () => {
    setRooms([]);
    setAnalysis(null);
    setActiveTab("compass");
  };

  const currentDirection = compassHeading !== null ? getDirectionFromDegrees(compassHeading) : null;

  const luckyIcons: Array<{ Icon: typeof Palette; label: string; key: keyof VastuAnalysis["luckyElements"] }> = [
    { Icon: Palette, label: "Wall Colors", key: "color" },
    { Icon: Sprout, label: "Plants", key: "plant" },
    { Icon: Flame, label: "Symbols", key: "symbol" },
    { Icon: Hammer, label: "Materials", key: "material" },
  ];

  return (
    <div className="min-h-screen bg-[#FBF7EE]">
      {/* Hero */}
      <section className="relative bg-[#6D2B35] border-b border-[#D4AF37]/30 py-12 md:py-16">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#D4AF37]/40 to-transparent" aria-hidden="true" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2.5 mb-3">
              <span className="h-px w-8 bg-[#D4AF37]/60" />
              <Compass className="h-4 w-4 text-[#D4AF37]" strokeWidth={1.8} />
              <span className="h-px w-8 bg-[#D4AF37]/60" />
            </div>
            <span className="inline-block text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] font-semibold mb-3">
              AI-Powered Vastu Analysis
            </span>
            <h1 className="font-serif text-3xl md:text-5xl text-white mb-3 leading-tight" data-testid="heading-vastu">
              Vastu Compass
            </h1>
            <p className="text-white/70 text-[13px] md:text-sm leading-relaxed max-w-xl mx-auto">
              Use your phone's compass to detect directions and get AI-powered Vastu Shastra analysis for your home.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        {/* Tab toggle */}
        <div className="inline-flex bg-white rounded-md border border-[#D4AF37]/30 p-1 mb-6 w-full sm:w-auto">
          <button
            onClick={() => setActiveTab("compass")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-md text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors ${
              activeTab === "compass"
                ? "bg-[#6D2B35] text-[#D4AF37]"
                : "text-[#5a4a3a]/65 hover:text-[#6D2B35]"
            }`}
            data-testid="tab-compass"
          >
            <Compass className="w-3.5 h-3.5" strokeWidth={1.8} /> Compass
          </button>
          <button
            onClick={() => setActiveTab("results")}
            className={`flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 h-9 rounded-md text-[12px] font-semibold uppercase tracking-[0.15em] transition-colors ${
              activeTab === "results"
                ? "bg-[#6D2B35] text-[#D4AF37]"
                : "text-[#5a4a3a]/65 hover:text-[#6D2B35]"
            } ${!analysis ? "opacity-50 cursor-not-allowed" : ""}`}
            disabled={!analysis}
            data-testid="tab-results"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.8} /> Analysis
          </button>
        </div>

        {activeTab === "compass" && (
          <div className="space-y-5">
            {/* Live Compass Card */}
            <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Navigation className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                <h2 className="font-serif text-lg text-[#6D2B35]">Live Compass</h2>
              </div>

              <div className="flex flex-col items-center">
                <div className="relative w-64 h-64 sm:w-72 sm:h-72">
                  <svg viewBox="0 0 300 300" className="w-full h-full">
                    <circle cx="150" cy="150" r="140" fill="none" stroke="#6D2B35" strokeWidth="1" opacity="0.15" />
                    <circle cx="150" cy="150" r="120" fill="none" stroke="#6D2B35" strokeWidth="1" opacity="0.1" />
                    <circle cx="150" cy="150" r="100" fill="none" stroke="#D4AF37" strokeWidth="0.5" opacity="0.25" />

                    {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
                      const rad = (angle - 90) * (Math.PI / 180);
                      const x1 = 150 + 125 * Math.cos(rad);
                      const y1 = 150 + 125 * Math.sin(rad);
                      const x2 = 150 + 140 * Math.cos(rad);
                      const y2 = 150 + 140 * Math.sin(rad);
                      return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={i % 2 === 0 ? "#6D2B35" : "#D4AF37"} strokeWidth={i % 2 === 0 ? 2 : 1} opacity={i % 2 === 0 ? 0.6 : 0.4} />;
                    })}

                    {["N", "NE", "E", "SE", "S", "SW", "W", "NW"].map((dir, i) => {
                      const angle = i * 45;
                      const rad = (angle - 90) * (Math.PI / 180);
                      const x = 150 + 108 * Math.cos(rad);
                      const y = 150 + 108 * Math.sin(rad);
                      const isCardinal = i % 2 === 0;
                      return (
                        <text
                          key={dir}
                          x={x}
                          y={y}
                          textAnchor="middle"
                          dominantBaseline="central"
                          className={isCardinal ? "text-[11px] font-bold" : "text-[9px] font-medium"}
                          fill={dir === "N" ? "#D4AF37" : "#6D2B35"}
                          opacity={isCardinal ? 0.85 : 0.5}
                        >
                          {dir}
                        </text>
                      );
                    })}

                    {compassHeading !== null && (
                      <g transform={`rotate(${compassHeading}, 150, 150)`}>
                        <polygon points="150,30 143,80 157,80" fill="#D4AF37" opacity="0.95" />
                        <polygon points="150,270 143,220 157,220" fill="#6D2B35" opacity="0.5" />
                      </g>
                    )}

                    <circle cx="150" cy="150" r="5" fill="#D4AF37" />
                    <circle cx="150" cy="150" r="2" fill="white" />
                  </svg>

                  {compassHeading !== null && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center mt-2">
                        <p className="text-3xl font-serif font-bold text-[#6D2B35]" data-testid="text-heading-degrees">{compassHeading}°</p>
                        <p className="text-[11px] text-[#D4AF37] uppercase tracking-[0.2em] font-semibold mt-0.5" data-testid="text-heading-direction">{currentDirection}</p>
                      </div>
                    </div>
                  )}
                </div>

                {!compassSupported && (
                  <div className="mt-4 px-4 py-3 rounded-md border border-amber-200 bg-amber-50 text-center">
                    <p className="text-[12px] text-amber-700 flex items-center justify-center gap-2 font-semibold">
                      <AlertTriangle className="w-3.5 h-3.5" strokeWidth={1.8} />
                      Compass not available on this device
                    </p>
                    <p className="text-[11px] text-amber-700/75 mt-1">Use the manual input below to enter directions</p>
                  </div>
                )}

                {permissionNeeded && (
                  <button
                    onClick={requestPermission}
                    className={`${PRIMARY_BTN} mt-4`}
                    data-testid="btn-compass-permission"
                  >
                    Enable Compass
                  </button>
                )}

                {compassHeading === null && !permissionNeeded && compassSupported && (
                  <p className="mt-4 text-[12px] text-[#5a4a3a]/60 text-center max-w-xs leading-relaxed">
                    Point your phone in the direction of each room/area to capture its compass direction
                  </p>
                )}
              </div>
            </div>

            {/* Add Room Card */}
            <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Home className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                <h2 className="font-serif text-lg text-[#6D2B35]">Add Room/Area Direction</h2>
              </div>

              <div className="space-y-3">
                <div>
                  <label className={FIELD_LABEL}>Select Room/Area</label>
                  <div className="relative">
                    <select
                      value={selectedRoom}
                      onChange={(e) => setSelectedRoom(e.target.value)}
                      className={`${FIELD_INPUT} appearance-none pr-9`}
                      data-testid="select-room"
                    >
                      {ROOM_OPTIONS.map(r => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#5a4a3a]/45 pointer-events-none" strokeWidth={1.8} />
                  </div>
                </div>

                {compassHeading === null && (
                  <div>
                    <label className={FIELD_LABEL}>Manual Direction (degrees 0–359)</label>
                    <input
                      type="number"
                      min="0"
                      max="359"
                      value={manualDegrees}
                      onChange={(e) => setManualDegrees(e.target.value)}
                      className={FIELD_INPUT}
                      placeholder="0=N, 90=E, 180=S, 270=W"
                      data-testid="input-manual-degrees"
                    />
                    <p className="text-[10.5px] text-[#5a4a3a]/55 mt-1.5 leading-relaxed">0°=North, 45°=NE, 90°=East, 135°=SE, 180°=South, 225°=SW, 270°=West, 315°=NW</p>
                  </div>
                )}

                {compassHeading !== null && (
                  <div className="rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] p-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-[#5a4a3a]/60">Current compass reading</p>
                    <p className="text-base font-serif font-bold text-[#6D2B35] mt-0.5">{compassHeading}° — {currentDirection}</p>
                    <p className="text-[10.5px] text-[#5a4a3a]/55 mt-0.5">Point your phone toward the room and tap "Add"</p>
                  </div>
                )}

                <button
                  onClick={addRoom}
                  className={`${PRIMARY_BTN} w-full`}
                  data-testid="btn-add-room"
                >
                  <Plus className="w-4 h-4" strokeWidth={2} /> Add {selectedRoom}
                </button>
              </div>
            </div>

            {/* Rooms List */}
            {rooms.length > 0 && (
              <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
                <div className="flex items-center justify-between mb-4 gap-3">
                  <h2 className="font-serif text-lg text-[#6D2B35]">
                    Added Rooms <span className="text-[#5a4a3a]/55 text-[13px]">({rooms.length})</span>
                  </h2>
                  <button
                    onClick={resetAll}
                    className="inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.15em] font-semibold text-[#5a4a3a]/60 hover:text-rose-700 transition-colors"
                    data-testid="btn-reset"
                  >
                    <RotateCcw className="w-3 h-3" strokeWidth={1.8} /> Reset
                  </button>
                </div>

                <div className="space-y-2">
                  {rooms.map((room) => (
                    <div
                      key={room.id}
                      className="flex items-center justify-between p-3 rounded-md border border-[#D4AF37]/20 bg-[#FBF7EE]"
                      data-testid={`room-entry-${room.id}`}
                    >
                      <div className="min-w-0">
                        <p className="text-[13px] font-medium text-[#5a4a3a] truncate">{room.name}</p>
                        <p className="text-[11px] text-[#5a4a3a]/55 mt-0.5 uppercase tracking-[0.12em] font-semibold">{room.direction} · {room.degrees}°</p>
                      </div>
                      <button
                        onClick={() => removeRoom(room.id)}
                        className="p-1.5 rounded-md text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition-colors shrink-0"
                        data-testid={`btn-remove-${room.id}`}
                      >
                        <Trash2 className="w-3.5 h-3.5" strokeWidth={1.8} />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={analyzeVastu}
                  disabled={loading || rooms.length < 2}
                  className={`${PRIMARY_BTN} w-full mt-4`}
                  data-testid="btn-analyze"
                >
                  {loading ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing Vastu…</>
                  ) : (
                    <><Sparkles className="w-4 h-4" strokeWidth={1.8} /> Analyze Vastu ({rooms.length} rooms)</>
                  )}
                </button>
                {rooms.length < 2 && (
                  <p className="text-[10.5px] text-center text-[#5a4a3a]/50 mt-2">Add at least 2 rooms for analysis</p>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === "results" && analysis && (
          <div className="space-y-5">
            {/* Score Card */}
            <div className="rounded-md border border-[#D4AF37]/30 bg-white p-6 text-center">
              <div className="inline-flex items-center justify-center w-24 h-24 rounded-md border-2 border-[#D4AF37]/40 bg-[#FBF7EE] mb-4">
                <span className={`text-3xl font-serif font-bold ${getScoreText(analysis.overallScore)}`} data-testid="text-vastu-score">{analysis.overallScore}</span>
              </div>
              <span className="block text-[10px] text-[#D4AF37] uppercase tracking-[0.28em] font-semibold mb-1">Vastu Score</span>
              <h2 className={`font-serif text-xl font-semibold ${getScoreText(analysis.overallScore)}`} data-testid="text-vastu-verdict">
                {analysis.overallVerdict}
              </h2>
              <p className="text-[11px] text-[#5a4a3a]/55 mt-1 uppercase tracking-[0.15em] font-semibold">Compliance Score · out of 100</p>
            </div>

            {/* Findings */}
            <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                <h2 className="font-serif text-lg text-[#6D2B35]">Room-wise Vastu Analysis</h2>
              </div>
              <div className="space-y-3">
                {analysis.findings.map((finding, i) => {
                  const t = getStatusTokens(finding.status);
                  const StatusIcon = finding.status === "excellent" || finding.status === "good"
                    ? CheckCircle
                    : finding.status === "critical"
                    ? AlertTriangle
                    : Info;
                  return (
                    <div
                      key={i}
                      className={`p-4 rounded-md border ${t.border} ${t.bg}`}
                      data-testid={`finding-${i}`}
                    >
                      <div className="flex items-start gap-3">
                        <StatusIcon className={`w-4 h-4 ${t.icon} mt-0.5 shrink-0`} strokeWidth={1.8} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                            <span className={`text-[13px] font-semibold ${t.text}`}>{finding.room}</span>
                            <span className="text-[10px] px-1.5 py-0.5 bg-white/70 rounded-md text-[#5a4a3a]/65 uppercase tracking-[0.12em] font-semibold border border-[#D4AF37]/20">{finding.direction}</span>
                            <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-semibold uppercase tracking-[0.12em] border ${t.border} ${t.text}`}>
                              {finding.status}
                            </span>
                          </div>
                          <p className="text-[12.5px] text-[#5a4a3a]/85 leading-relaxed">{finding.finding}</p>
                          {finding.remedy && (
                            <div className="mt-2 p-2.5 bg-white/80 rounded-md border border-[#D4AF37]/20">
                              <p className="text-[10px] text-[#6D2B35] font-semibold uppercase tracking-[0.18em] flex items-center gap-1">
                                <Zap className="w-3 h-3" strokeWidth={1.8} /> Remedy
                              </p>
                              <p className="text-[12px] text-[#5a4a3a]/75 mt-1 leading-relaxed">{finding.remedy}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {analysis.doshaAnalysis && (
              <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                  <h2 className="font-serif text-lg text-[#6D2B35]">Vastu Dosha Analysis</h2>
                </div>
                <p className="text-[13px] text-[#5a4a3a]/85 leading-relaxed" data-testid="text-dosha-analysis">{analysis.doshaAnalysis}</p>
              </div>
            )}

            {analysis.energyFlow && (
              <div className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                  <h2 className="font-serif text-lg text-[#6D2B35]">Energy Flow (Prana)</h2>
                </div>
                <p className="text-[13px] text-[#5a4a3a]/85 leading-relaxed" data-testid="text-energy-flow">{analysis.energyFlow}</p>
              </div>
            )}

            {analysis.luckyElements && (
              <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                  <h2 className="font-serif text-lg text-[#6D2B35]">Recommended Elements</h2>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-px rounded-md overflow-hidden border border-[#D4AF37]/25 bg-[#D4AF37]/25">
                  {luckyIcons.map((el, i) => (
                    <div key={i} className="bg-white p-4" data-testid={`lucky-element-${i}`}>
                      <div className="w-8 h-8 rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] flex items-center justify-center mb-2">
                        <el.Icon className="w-4 h-4 text-[#6D2B35]" strokeWidth={1.8} />
                      </div>
                      <p className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#5a4a3a]/60">{el.label}</p>
                      <p className="text-[12.5px] text-[#5a4a3a] font-medium mt-0.5 leading-snug">{analysis.luckyElements[el.key]}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {analysis.generalTips && analysis.generalTips.length > 0 && (
              <div className="rounded-md border border-[#D4AF37]/25 bg-white p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle className="w-4 h-4 text-[#D4AF37]" strokeWidth={1.8} />
                  <h2 className="font-serif text-lg text-[#6D2B35]">General Vastu Tips</h2>
                </div>
                <div className="space-y-2">
                  {analysis.generalTips.map((tip, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 rounded-md border border-[#D4AF37]/20 bg-[#FBF7EE]" data-testid={`tip-${i}`}>
                      <span className="w-6 h-6 flex-shrink-0 rounded-md border border-[#D4AF37]/30 bg-white text-[#6D2B35] text-[11px] font-bold flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <p className="text-[12.5px] text-[#5a4a3a]/85 leading-relaxed">{tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={resetAll}
              className={`${OUTLINE_BTN} w-full`}
              data-testid="btn-new-analysis"
            >
              <RotateCcw className="w-4 h-4" strokeWidth={1.8} /> Start New Analysis
            </button>
          </div>
        )}

        <PageAPlusContent
          eyebrow="Why Use Vedic Tatva Vastu Compass"
          title="Free Vastu Compass — Analyse Your Home, Office & Plot Online"
          intro="Vastu Shastra is the ancient Vedic science of architectural harmony. Our AI-powered Vastu compass analyses your home, office or plot — identifies doshas, energy imbalances, and gives precise remedies based on the eight directions (ashta dishas) and five elements (pancha mahabhutas)."
          trustBadges={[
            { value: "Free", label: "Compass Tool" },
            { value: "8", label: "Direction Analysis" },
            { value: "AI", label: "Dosha Detection" },
            { value: "Vedic", label: "Authentic Remedies" },
          ]}
          benefits={[
            { icon: Compass, title: "Accurate Direction Mapping", body: "Mark each room — kitchen, bedroom, puja room, entrance, toilet — and our compass calculates ideal vs actual placement against authentic Vastu principles." },
            { icon: AlertTriangle, title: "Auto Dosha Detection", body: "Instantly detects major doshas — Northeast toilet, Southwest kitchen, brahmasthan obstruction, Vastu purush violations — with severity ratings." },
            { icon: Sparkles, title: "Personalised Remedies", body: "Get specific, practical remedies — pyramids, mirrors, plants, colour corrections, yantras and pujas — without expensive demolition or restructuring." },
            { icon: Sun, title: "Pancha Mahabhuta Balance", body: "Analyse the balance of five elements — earth, water, fire, air, space — across your space, with adjustments to restore positive energy flow." },
            { icon: Home, title: "Home, Office & Plot", body: "Works for residential homes, apartments, office spaces, shops, factories and even raw plots — different rules apply for each, all built in." },
            { icon: BookOpen, title: "Scripture-Based", body: "Built on classical Vastu texts — Mayamatam, Manasara, Vishwakarma Vastu Shastra and Brihat Samhita — not modern interpretations or shortcuts." },
          ]}
          steps={[
            { title: "Set Your Compass Direction", body: "Use your phone's compass to align North accurately — or input degrees manually if you've measured with a magnetic compass." },
            { title: "Mark Each Room", body: "Add rooms one by one — kitchen, bedroom, puja, toilet, entrance, drawing room — and place them on the directional grid." },
            { title: "Get Vastu Analysis", body: "Instantly see which rooms are in ideal directions, which have doshas, and the severity of each issue (minor, moderate, severe)." },
            { title: "Apply Remedies", body: "Follow specific remedies — most are simple corrections (mirror placement, pyramid, plant, colour) without any structural changes." },
          ]}
          faqs={[
            { q: "What is Vastu Shastra and is it really effective?", a: "Vastu Shastra is the ancient Vedic science of architecture, codified in texts like Mayamatam and Manasara. It explains how directional energies and the five elements affect human well-being. Properly applied, Vastu improves harmony, prosperity and health — millions of Indian homes and major corporations use it." },
            { q: "Can I check Vastu without breaking walls?", a: "Yes — over 90% of Vastu doshas can be remedied without any structural change. Mirror placement, pyramid yantras, colour corrections, plant positioning, and element balancing (water bowl, lamp, crystal) effectively neutralise most doshas." },
            { q: "What are the most common Vastu doshas?", a: "The most common doshas are: toilet in northeast (drains positive energy), kitchen in southwest (causes financial issues), main door facing south (without remedies), missing northeast corner, brahmasthan (centre) blocked or used as toilet/storage, and bedroom in northeast (causes restlessness)." },
            { q: "Which direction should the kitchen face?", a: "The kitchen should ideally be in the southeast (Agneya) corner — the direction of fire (Agni). The cook should face east while cooking. If southeast isn't possible, northwest is the second-best option. Avoid kitchen in northeast or southwest." },
            { q: "Where should the puja room be placed?", a: "The puja room should be in the northeast (Ishanya) — the direction of Lord Shiva and divine energy. The deity should face west or east, and the worshipper should sit facing east or north. Avoid puja room above/below toilet or below stairs." },
            { q: "What is brahmasthan and why is it important?", a: "Brahmasthan is the centre of any structure — considered the most sacred zone, where Lord Brahma resides. It should be kept open, clean and obstruction-free. Avoid placing pillars, toilets, staircases, heavy furniture or storage in the brahmasthan." },
            { q: "Does Vastu apply to flats and apartments?", a: "Yes — Vastu principles apply equally to apartments. The main door direction, room layout, and brahmasthan are still relevant. For apartments, focus on internal room placement, colours, and remedy yantras since you can't change the building's overall direction." },
            { q: "Should I consult a Vastu expert too?", a: "Our AI compass is excellent for first-level analysis and most homes. For commercial properties, factories, large plots or major doshas requiring structural advice, we recommend booking a 1-on-1 consultation with our verified Vastu experts." },
          ]}
          keywordsBlurb="Free online Vastu Shastra compass for home, office, shop and plot analysis. AI-powered Vastu dosha detection and remedies based on classical texts (Mayamatam, Manasara, Vishwakarma Vastu Shastra). Vastu tips for kitchen, bedroom, puja room, main entrance, toilet and brahmasthan. Vastu remedies without demolition — pyramid yantra, mirror placement, plant positioning, colour correction. Vastu for north-facing, east-facing, west-facing and south-facing houses. Vastu compass directions in Hindi, English, Tamil, Telugu, Kannada and other regional languages."
        />

        <RelatedServicesSection context="vastu" currentPath="/vastu-compass" />
      </div>
    </div>
  );
}
