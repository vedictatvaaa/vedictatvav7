import { useState, useEffect, useMemo } from "react";
import { Link } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft, Flame, Target, Trophy, Star, Calendar, Heart, BookOpen,
  Plus, Minus, Check, Sparkles, Moon, Sun, TrendingUp, Award,
  Zap, Clock, HandHeart, Music, Eye, Leaf, ChevronRight, Compass,
  Gem, Hash, ArrowRight, RefreshCw, Wand2, Brain, ShoppingBag, Loader2, Bell
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { RelatedServicesSection } from "@/components/RelatedServices";
import { DailyRecommendations } from "@/pages/home";
import { getInteractionSummary, getJourneyDataForAI } from "@/lib/spiritual-tracker";
import { useAuth } from "@/lib/auth";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import PageSeo from "@/components/PageSeo";
import KarmaTracker from "@/components/KarmaTracker";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface SpiritualProfile {
  name: string;
  startDate: string;
  goals: string[];
}

interface DailyLog {
  date: string;
  mantras: number;
  meditationMins: number;
  templeVisit: boolean;
  reading: boolean;
  charity: boolean;
  puja: boolean;
  notes: string;
}

interface RewardPoints {
  total: number;
  level: number;
  levelName: string;
  nextLevel: number;
  nextLevelName: string;
  pointsToNext: number;
}

interface JourneyData {
  profile: SpiritualProfile | null;
  logs: DailyLog[];
  achievements: string[];
  rewardPoints?: number;
}

const SPIRITUAL_GOALS = [
  "Daily Meditation", "Mantra Chanting", "Temple Visits", "Scripture Reading",
  "Yoga Practice", "Sattvic Diet", "Charity & Seva", "Festival Observance",
  "Pranayama", "Pilgrimage"
];

const ACHIEVEMENTS = [
  { id: "first_log", title: "First Step", desc: "Logged your first spiritual activity", icon: Zap, threshold: (d: JourneyData) => d.logs.length >= 1 },
  { id: "week_streak", title: "Sacred Week", desc: "7-day spiritual streak", icon: Flame, threshold: (d: JourneyData) => getStreak(d.logs) >= 7 },
  { id: "month_streak", title: "Devoted Month", desc: "30-day spiritual streak", icon: Trophy, threshold: (d: JourneyData) => getStreak(d.logs) >= 30 },
  { id: "mantra_100", title: "Mantra Master", desc: "Chanted 100+ mantras total", icon: Music, threshold: (d: JourneyData) => d.logs.reduce((s, l) => s + l.mantras, 0) >= 100 },
  { id: "mantra_1000", title: "Mantra Siddhi", desc: "Chanted 1,000+ mantras total", icon: Star, threshold: (d: JourneyData) => d.logs.reduce((s, l) => s + l.mantras, 0) >= 1000 },
  { id: "meditation_60", title: "Inner Peace", desc: "60+ minutes meditation in a day", icon: Moon, threshold: (d: JourneyData) => d.logs.some(l => l.meditationMins >= 60) },
  { id: "temple_10", title: "Temple Devotee", desc: "Visited temple 10 times", icon: Sun, threshold: (d: JourneyData) => d.logs.filter(l => l.templeVisit).length >= 10 },
  { id: "charity_5", title: "Generous Soul", desc: "Gave charity 5 times", icon: HandHeart, threshold: (d: JourneyData) => d.logs.filter(l => l.charity).length >= 5 },
  { id: "reader", title: "Wisdom Seeker", desc: "Read scriptures 10 times", icon: BookOpen, threshold: (d: JourneyData) => d.logs.filter(l => l.reading).length >= 10 },
  { id: "puja_10", title: "Puja Performer", desc: "Performed 10 pujas", icon: Flame, threshold: (d: JourneyData) => d.logs.filter(l => l.puja).length >= 10 },
  { id: "logs_50", title: "Consistent Seeker", desc: "Logged 50 days of activities", icon: Calendar, threshold: (d: JourneyData) => d.logs.length >= 50 },
  { id: "all_activities", title: "Complete Sadhak", desc: "Logged all activities in one day", icon: Award, threshold: (d: JourneyData) => d.logs.some(l => l.mantras > 0 && l.meditationMins > 0 && l.templeVisit && l.reading && l.charity && l.puja) },
];

function getStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  const today = new Date().toISOString().slice(0, 10);
  let streak = 0;
  let checkDate = new Date(today);

  for (let i = 0; i < 365; i++) {
    const dateStr = checkDate.toISOString().slice(0, 10);
    const hasLog = sorted.some(l => l.date === dateStr);
    if (hasLog) {
      streak++;
    } else if (i > 0) {
      break;
    }
    checkDate.setDate(checkDate.getDate() - 1);
  }
  return streak;
}

function getLongestStreak(logs: DailyLog[]): number {
  if (logs.length === 0) return 0;
  const dates = Array.from(new Set(logs.map(l => l.date))).sort();
  let longest = 1;
  let current = 1;
  for (let i = 1; i < dates.length; i++) {
    const prev = new Date(dates[i - 1]);
    const curr = new Date(dates[i]);
    const diff = (curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      current++;
      longest = Math.max(longest, current);
    } else {
      current = 1;
    }
  }
  return longest;
}

const STORAGE_KEY = "vedic_tatva_spiritual_journey";

function loadData(): JourneyData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { profile: null, logs: [], achievements: [] };
}

function saveData(data: JourneyData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

const RECS_CACHE_TTL = 4 * 60 * 60 * 1000;

function getRecsCacheKey(userId?: number) {
  return `vedic_tatva_ai_recommendations_${userId || "guest"}`;
}

function PersonalizedRecommendations({ journeyData }: { journeyData: JourneyData }) {
  const { user } = useAuth();
  const [recs, setRecs] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const cacheKey = getRecsCacheKey(user?.id);

  const fetchRecommendations = async (force = false) => {
    if (!force) {
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Date.now() - parsed.timestamp < RECS_CACHE_TTL) {
            setRecs(parsed.data);
            return;
          }
        }
      } catch {}
    }

    setLoading(true);
    try {
      const interactions = getInteractionSummary();
      const journey = getJourneyDataForAI();
      const res = await fetch("/api/spiritual-recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          journeyData: journey,
          interactions,
          userProfile: user ? {
            name: user.name,
            birthDate: (user as any).birthDate,
            birthTime: (user as any).birthTime,
            birthCity: (user as any).birthCity,
            gotra: (user as any).gotra,
          } : null,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setRecs(data.recommendations);
        localStorage.setItem(cacheKey, JSON.stringify({ data: data.recommendations, timestamp: Date.now() }));
      }
    } catch (err) {
      console.error("Failed to fetch recommendations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (journeyData.profile) {
      fetchRecommendations();
    }
  }, [journeyData.profile?.name]);

  if (!journeyData.profile) return null;

  const priorityColors: Record<string, string> = {
    high: "bg-red-50 text-red-700 border-red-200",
    medium: "bg-amber-50 text-amber-700 border-amber-200",
    low: "bg-green-50 text-green-700 border-green-200",
  };

  return (
    <div className="mt-8" data-testid="personalized-recommendations">
      <div className="bg-gradient-to-br from-[#6D2B35]/5 via-white to-[#D4AF37]/5 rounded-2xl border border-[#6D2B35]/10 shadow-sm overflow-hidden">
        <div
          className="flex items-center justify-between px-5 sm:px-6 py-4 cursor-pointer bg-gradient-to-r from-[#6D2B35]/5 to-transparent"
          onClick={() => setExpanded(!expanded)}
        >
          <h2 className="font-serif text-lg font-bold text-[#6D2B35] flex items-center gap-2">
            <Brain className="h-5 w-5 text-[#D4AF37]" />
            Your Personalized Spiritual Path
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); fetchRecommendations(true); }}
              disabled={loading}
              className="p-1.5 rounded-lg hover:bg-[#F5F0E6] transition-colors"
              title="Refresh recommendations"
              data-testid="btn-refresh-recommendations"
            >
              <RefreshCw className={`h-4 w-4 text-[#5a4a3a]/50 ${loading ? "animate-spin" : ""}`} />
            </button>
            <ChevronRight className={`h-4 w-4 text-[#5a4a3a]/40 transition-transform ${expanded ? "rotate-90" : ""}`} />
          </div>
        </div>

        {expanded && (
          <div className="px-5 sm:px-6 pb-6">
            {loading && !recs && (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#D4AF37]/20 to-[#6D2B35]/10 flex items-center justify-center mb-4">
                  <Loader2 className="h-8 w-8 text-[#D4AF37] animate-spin" />
                </div>
                <p className="text-sm text-[#5a4a3a]/60 font-medium">Analyzing your spiritual journey...</p>
                <p className="text-xs text-[#5a4a3a]/40 mt-1">Our AI is crafting personalized recommendations just for you</p>
              </div>
            )}

            {!loading && !recs && (
              <div className="text-center py-8">
                <Wand2 className="h-10 w-10 text-[#D4AF37]/40 mx-auto mb-3" />
                <p className="text-sm text-[#5a4a3a]/60 mb-3">Get AI-powered spiritual recommendations based on your journey</p>
                <button
                  onClick={() => fetchRecommendations(true)}
                  className="px-5 py-2.5 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] text-white text-sm font-semibold rounded-lg hover:shadow-lg transition-all"
                  data-testid="btn-generate-recommendations"
                >
                  <Sparkles className="h-4 w-4 inline mr-1.5" />
                  Generate My Spiritual Path
                </button>
              </div>
            )}

            {recs && (
              <div className="space-y-6">
                {recs.personalInsight && (
                  <div className="bg-gradient-to-r from-[#D4AF37]/10 via-[#f5efe3] to-[#6D2B35]/5 rounded-xl p-4 sm:p-5 border border-[#D4AF37]/20" data-testid="spiritual-insight">
                    <p className="text-sm text-[#5a4a3a]/80 leading-relaxed italic">"{recs.personalInsight}"</p>
                  </div>
                )}

                {recs.spiritualPath && (
                  <div className="bg-white rounded-xl p-5 border border-[#6D2B35]/8" data-testid="spiritual-path">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#D4AF37] to-[#6D2B35] flex items-center justify-center flex-shrink-0">
                        <Compass className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-[#D4AF37] font-semibold mb-0.5">Your Spiritual Path</p>
                        <h3 className="font-serif text-xl font-bold text-[#6D2B35]">{recs.spiritualPath.title}</h3>
                        <p className="text-sm text-[#5a4a3a]/70 mt-1 leading-relaxed">{recs.spiritualPath.description}</p>
                      </div>
                    </div>
                  </div>
                )}

                {recs.dailyPractice && (
                  <div data-testid="daily-practice">
                    <h3 className="font-serif text-base font-bold text-[#6D2B35] mb-3 flex items-center gap-2">
                      <Sun className="h-4 w-4 text-[#D4AF37]" /> Recommended Daily Practice
                    </h3>
                    <div className="grid sm:grid-cols-3 gap-3">
                      {recs.dailyPractice.mantra && (
                        <div className="bg-white rounded-xl p-4 border border-[#6D2B35]/8">
                          <Music className="h-5 w-5 text-purple-500 mb-2" />
                          <p className="text-xs uppercase tracking-wide text-[#5a4a3a]/40 font-semibold mb-1">Mantra</p>
                          <p className="font-serif text-lg font-bold text-[#6D2B35] mb-1">{recs.dailyPractice.mantra.text}</p>
                          <p className="text-xs text-[#5a4a3a]/60 italic">{recs.dailyPractice.mantra.transliteration}</p>
                          <p className="text-xs text-[#5a4a3a]/50 mt-1">{recs.dailyPractice.mantra.meaning}</p>
                          <p className="text-[10px] text-[#D4AF37] font-semibold mt-2">{recs.dailyPractice.mantra.repetitions}x repetitions</p>
                        </div>
                      )}
                      {recs.dailyPractice.meditation && (
                        <div className="bg-white rounded-xl p-4 border border-[#6D2B35]/8">
                          <Moon className="h-5 w-5 text-blue-500 mb-2" />
                          <p className="text-xs uppercase tracking-wide text-[#5a4a3a]/40 font-semibold mb-1">Meditation</p>
                          <p className="font-semibold text-sm text-[#6D2B35] mb-1">{recs.dailyPractice.meditation.technique}</p>
                          <p className="text-xs text-[#5a4a3a]/60">{recs.dailyPractice.meditation.instructions}</p>
                          <p className="text-[10px] text-blue-600 font-semibold mt-2">{recs.dailyPractice.meditation.duration}</p>
                        </div>
                      )}
                      {recs.dailyPractice.reading && (
                        <div className="bg-white rounded-xl p-4 border border-[#6D2B35]/8">
                          <BookOpen className="h-5 w-5 text-green-600 mb-2" />
                          <p className="text-xs uppercase tracking-wide text-[#5a4a3a]/40 font-semibold mb-1">Reading</p>
                          <p className="font-semibold text-sm text-[#6D2B35] mb-1">{recs.dailyPractice.reading.text}</p>
                          <p className="text-xs text-[#5a4a3a]/60">{recs.dailyPractice.reading.reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {recs.weeklyRecommendations?.length > 0 && (
                  <div data-testid="weekly-recommendations">
                    <h3 className="font-serif text-base font-bold text-[#6D2B35] mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-[#D4AF37]" /> Weekly Spiritual Schedule
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                      {recs.weeklyRecommendations.map((w: any, i: number) => (
                        <div key={i} className="bg-white rounded-lg p-3 border border-[#6D2B35]/5">
                          <p className="text-xs font-bold text-[#D4AF37] uppercase">{w.day}</p>
                          <p className="text-sm font-medium text-[#6D2B35] mt-0.5">{w.practice}</p>
                          <p className="text-[10px] text-[#5a4a3a]/50 mt-0.5">{w.deity}</p>
                          <p className="text-[10px] text-[#5a4a3a]/40 mt-1 leading-tight">{w.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid sm:grid-cols-2 gap-4">
                  {recs.serviceSuggestions?.length > 0 && (
                    <div data-testid="service-suggestions">
                      <h3 className="font-serif text-base font-bold text-[#6D2B35] mb-3 flex items-center gap-2">
                        <Sparkles className="h-4 w-4 text-[#D4AF37]" /> Recommended Services
                      </h3>
                      <div className="space-y-2">
                        {recs.serviceSuggestions.map((s: any, i: number) => (
                          <Link
                            key={i}
                            href={s.path || "/"}
                            className="flex items-start gap-3 bg-white rounded-lg p-3 border border-[#6D2B35]/5 hover:border-[#D4AF37]/30 hover:shadow-sm transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-[#F5F0E6] flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/10 transition-colors">
                              <ArrowRight className="h-4 w-4 text-[#6D2B35]/60" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-[#6D2B35]">{s.name}</p>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${priorityColors[s.priority] || priorityColors.medium}`}>
                                  {s.priority}
                                </span>
                              </div>
                              <p className="text-[11px] text-[#5a4a3a]/50 mt-0.5 leading-tight">{s.reason}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}

                  {recs.productSuggestions?.length > 0 && (
                    <div data-testid="product-suggestions">
                      <h3 className="font-serif text-base font-bold text-[#6D2B35] mb-3 flex items-center gap-2">
                        <ShoppingBag className="h-4 w-4 text-[#D4AF37]" /> Recommended Products
                      </h3>
                      <div className="space-y-2">
                        {recs.productSuggestions.map((p: any, i: number) => (
                          <Link
                            key={i}
                            href="/puja-samagri-online"
                            className="flex items-start gap-3 bg-white rounded-lg p-3 border border-[#6D2B35]/5 hover:border-[#D4AF37]/30 hover:shadow-sm transition-all group"
                          >
                            <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center flex-shrink-0 group-hover:bg-[#D4AF37]/10 transition-colors">
                              <ShoppingBag className="h-4 w-4 text-amber-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-[#6D2B35]">{p.name}</p>
                                <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${priorityColors[p.priority] || priorityColors.medium}`}>
                                  {p.priority}
                                </span>
                              </div>
                              <p className="text-[10px] text-[#D4AF37] font-medium">{p.category}</p>
                              <p className="text-[11px] text-[#5a4a3a]/50 mt-0.5 leading-tight">{p.reason}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-4">
                  {recs.nextMilestone && (
                    <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl p-4 border border-purple-100" data-testid="next-milestone">
                      <div className="flex items-start gap-3">
                        <Target className="h-5 w-5 text-purple-500 flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-xs uppercase tracking-wide text-purple-500 font-semibold mb-0.5">Next Milestone</p>
                          <p className="font-semibold text-sm text-[#6D2B35]">{recs.nextMilestone.title}</p>
                          <p className="text-xs text-[#5a4a3a]/60 mt-1">{recs.nextMilestone.description}</p>
                          {recs.nextMilestone.estimatedDays && (
                            <p className="text-[10px] text-purple-600 font-medium mt-2">~{recs.nextMilestone.estimatedDays} days to achieve</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {recs.luckyElements && (
                    <div className="bg-gradient-to-br from-[#D4AF37]/10 to-amber-50 rounded-xl p-4 border border-[#D4AF37]/20" data-testid="lucky-elements">
                      <p className="text-xs uppercase tracking-wide text-[#D4AF37] font-semibold mb-3 flex items-center gap-1">
                        <Star className="h-3.5 w-3.5" /> Lucky Elements for Your Phase
                      </p>
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { label: "Color", value: recs.luckyElements.color, icon: Heart },
                          { label: "Number", value: recs.luckyElements.number, icon: Hash },
                          { label: "Direction", value: recs.luckyElements.direction, icon: Compass },
                          { label: "Gemstone", value: recs.luckyElements.gemstone, icon: Gem },
                          { label: "Day", value: recs.luckyElements.day, icon: Calendar },
                        ].filter(e => e.value).map((elem, i) => (
                          <div key={i} className="text-center">
                            <elem.icon className="h-3.5 w-3.5 text-[#D4AF37] mx-auto mb-0.5" />
                            <p className="text-[10px] text-[#5a4a3a]/40 uppercase">{elem.label}</p>
                            <p className="text-xs font-semibold text-[#6D2B35]">{String(elem.value)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <p className="text-[10px] text-[#5a4a3a]/30 text-center">
                  Recommendations refresh every 4 hours based on your spiritual journey activity
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/** Push journey data to the server (fire-and-forget; never throws). */
async function syncToServer(userId: number, email: string, data: JourneyData) {
  try {
    await fetch(`/api/spiritual-journey/${userId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-user-email": email },
      body: JSON.stringify({ data }),
    });
  } catch {}
}

export default function SpiritualDashboard() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [data, setData] = useState<JourneyData>(loadData);
  const [showSetup, setShowSetup] = useState(!data.profile);
  const [setupName, setSetupName] = useState(data.profile?.name || "");
  const [setupGoals, setSetupGoals] = useState<string[]>(data.profile?.goals || []);
  const [serverSynced, setServerSynced] = useState(false);

  const today = new Date().toISOString().slice(0, 10);
  // Legacy daily-log form state retired — superseded by KarmaTracker (CLUSTER 0).
  // Logs are now POSTed to /api/spiritual/log; the migration above lifts old localStorage rows.

  // One-shot migration: lift legacy localStorage daily-logs into the new
  // server-backed Karma & Dharma tracker. Runs once per user (flagged in
  // localStorage). Silent — failures are non-fatal, retried next visit.
  useEffect(() => {
    if (!user) return;
    const email = (user as any).email as string;
    if (!email) return;
    const flagKey = `vt_karma_migrated_${user.id}`;
    if (localStorage.getItem(flagKey) === "1") return;
    const localData = loadData();
    const logs: DailyLog[] = localData.logs || [];
    if (!logs.length) { localStorage.setItem(flagKey, "1"); return; }
    (async () => {
      const headers = { "Content-Type": "application/json", "x-user-id": String(user.id), "x-user-email": email };
      // Server contract: { activityType, value, performedAt? }. Returns 200 on success.
      const post = async (body: any): Promise<boolean> => {
        try {
          const r = await fetch("/api/spiritual/log", { method: "POST", headers, body: JSON.stringify(body) });
          return r.ok;
        } catch { return false; }
      };
      let attempted = 0; let succeeded = 0;
      for (const l of logs) {
        if (!l?.date) continue;
        const performedAt = new Date(`${l.date}T08:00:00Z`).toISOString();
        const calls: Array<Promise<boolean>> = [];
        if (l.mantras && l.mantras > 0) calls.push(post({ activityType: "japa",    value: l.mantras, performedAt, notes: l.notes || undefined }));
        if (l.charity)                  calls.push(post({ activityType: "charity", value: 100,        performedAt, notes: "Migrated from daily log" }));
        if (l.templeVisit)              calls.push(post({ activityType: "temple",  value: 1,          performedAt, notes: "Migrated from daily log" }));
        if (l.puja)                     calls.push(post({ activityType: "temple",  value: 1,          performedAt, notes: "Puja (migrated)" }));
        const results = await Promise.all(calls);
        attempted += results.length;
        succeeded += results.filter(Boolean).length;
      }
      // Only mark migrated when every intended row landed. Partial failures
      // retry next visit (idempotency on the server side is acceptable here
      // since worst case is double-credit on one retry — rare and bounded).
      if (attempted === 0 || succeeded === attempted) {
        localStorage.setItem(flagKey, "1");
      }
    })();
  }, [user]);

  // On mount (or when user logs in), fetch server data and merge with local.
  // Server data wins if it has more logs; local is pushed to server if server is empty.
  useEffect(() => {
    if (!user) return;
    const email = (user as any).email as string;
    (async () => {
      try {
        const res = await fetch(`/api/spiritual-journey/${user.id}`, {
          headers: { "x-user-email": email },
        });
        if (!res.ok) return;
        const { data: serverData } = await res.json();
        if (serverData && typeof serverData === "object") {
          const serverLogs: DailyLog[] = serverData.logs || [];
          const localData = loadData();
          const localLogs: DailyLog[] = localData.logs || [];
          // Merge: keep whichever snapshot has more total logs
          const merged: JourneyData = serverLogs.length >= localLogs.length
            ? serverData
            : localData;
          setData(merged);
          saveData(merged);
          if (serverLogs.length < localLogs.length) {
            // Push richer local data up to server
            await syncToServer(user.id, email, localData);
          }
          setShowSetup(!merged.profile);
        } else {
          // Server has nothing — push local data up
          const localData = loadData();
          if (localData.profile || localData.logs.length > 0) {
            await syncToServer(user.id, email, localData);
          }
        }
      } catch {} finally {
        setServerSynced(true);
      }
    })();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  useEffect(() => {
    saveData(data);
    // Also persist to server when user is logged in
    if (user && serverSynced) {
      syncToServer(user.id, (user as any).email, data);
    }
  }, [data]);

  const streak = useMemo(() => getStreak(data.logs), [data.logs]);
  const longestStreak = useMemo(() => getLongestStreak(data.logs), [data.logs]);
  const totalMantras = useMemo(() => data.logs.reduce((s, l) => s + l.mantras, 0), [data.logs]);
  const totalMeditation = useMemo(() => data.logs.reduce((s, l) => s + l.meditationMins, 0), [data.logs]);
  const totalTemple = useMemo(() => data.logs.filter(l => l.templeVisit).length, [data.logs]);
  const totalPuja = useMemo(() => data.logs.filter(l => l.puja).length, [data.logs]);
  const totalCharity = useMemo(() => data.logs.filter(l => l.charity).length, [data.logs]);

  const LEVELS = [
    { name: "Seeker", min: 0 },
    { name: "Sadhak", min: 100 },
    { name: "Upasak", min: 300 },
    { name: "Bhakt", min: 600 },
    { name: "Tapasvi", min: 1000 },
    { name: "Siddh", min: 1500 },
    { name: "Rishi", min: 2500 },
    { name: "Maharishi", min: 4000 },
  ];

  const rewardInfo = useMemo((): RewardPoints => {
    let pts = 0;
    data.logs.forEach(l => {
      pts += Math.floor(l.mantras / 10) * 5;
      pts += l.meditationMins >= 15 ? 10 : l.meditationMins >= 5 ? 5 : 0;
      pts += l.templeVisit ? 20 : 0;
      pts += l.reading ? 10 : 0;
      pts += l.charity ? 25 : 0;
      pts += l.puja ? 15 : 0;
    });
    pts += data.achievements.length * 50;
    pts += streak >= 7 ? 30 : streak >= 3 ? 10 : 0;

    let lvl = 0;
    for (let i = LEVELS.length - 1; i >= 0; i--) {
      if (pts >= LEVELS[i].min) { lvl = i; break; }
    }
    const nextIdx = Math.min(lvl + 1, LEVELS.length - 1);
    return {
      total: pts,
      level: lvl + 1,
      levelName: LEVELS[lvl].name,
      nextLevel: nextIdx + 1,
      nextLevelName: LEVELS[nextIdx].name,
      pointsToNext: lvl < LEVELS.length - 1 ? LEVELS[nextIdx].min - pts : 0,
    };
  }, [data, streak]);

  const earnedAchievements = useMemo(() => {
    return ACHIEVEMENTS.filter(a => a.threshold(data));
  }, [data]);

  const newAchievements = useMemo(() => {
    return earnedAchievements.filter(a => !data.achievements.includes(a.id));
  }, [earnedAchievements, data.achievements]);

  useEffect(() => {
    if (newAchievements.length > 0) {
      const updated = { ...data, achievements: [...data.achievements, ...newAchievements.map(a => a.id)] };
      setData(updated);
      newAchievements.forEach(a => {
        toast({ title: `Achievement Unlocked: ${a.title}!`, description: a.desc });
      });
    }
  }, [newAchievements.length]);

  const handleSetup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!setupName.trim()) return;
    const profile: SpiritualProfile = {
      name: setupName.trim(),
      startDate: new Date().toISOString().slice(0, 10),
      goals: setupGoals,
    };
    setData(prev => ({ ...prev, profile }));
    setShowSetup(false);
    toast({ title: "Namaste, " + setupName.trim() + "!", description: "Your spiritual journey begins today." });
  };

  const daysOnJourney = data.profile ? Math.max(1, Math.ceil((Date.now() - new Date(data.profile.startDate).getTime()) / (1000 * 60 * 60 * 24))) : 0;

  if (showSetup) {
    return (
      <div className="min-h-screen bg-[#F5F0E6] flex items-center justify-center p-4">
        <div className="max-w-lg w-full">
          <div className="text-center mb-8">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#6D2B35] to-[#D4AF37] flex items-center justify-center mx-auto mb-4">
              <Sparkles className="h-10 w-10 text-white" />
            </div>
            <h1 className="font-serif text-3xl font-bold text-[#6D2B35] mb-2">Begin Your Spiritual Journey</h1>
            <p className="text-[#5a4a3a]/70">Set up your profile to start tracking your spiritual progress</p>
          </div>

          <form onSubmit={handleSetup} className="bg-white rounded-2xl p-6 shadow-lg border border-[#6D2B35]/8">
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#5a4a3a] mb-1.5">Your Name</label>
              <input
                type="text"
                value={setupName}
                onChange={e => setSetupName(e.target.value)}
                placeholder="Enter your name"
                className="w-full px-4 py-2.5 rounded-lg border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-[#5a4a3a] focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                required
                data-testid="input-journey-name"
              />
            </div>
            <div className="mb-5">
              <label className="block text-sm font-medium text-[#5a4a3a] mb-2">Spiritual Goals (select any)</label>
              <div className="grid grid-cols-2 gap-2">
                {SPIRITUAL_GOALS.map(goal => (
                  <button
                    type="button"
                    key={goal}
                    onClick={() => setSetupGoals(prev => prev.includes(goal) ? prev.filter(g => g !== goal) : [...prev, goal])}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${
                      setupGoals.includes(goal)
                        ? "bg-[#6D2B35] text-white"
                        : "bg-[#F5F0E6] text-[#5a4a3a]/70 hover:bg-[#6D2B35]/10"
                    }`}
                    data-testid={`goal-${goal.toLowerCase().replace(/\s+/g, "-")}`}
                  >
                    {setupGoals.includes(goal) && <Check className="h-3 w-3 inline mr-1" />}
                    {goal}
                  </button>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#6D2B35] to-[#8B3A47] text-white font-semibold rounded-lg hover:shadow-lg transition-all"
              data-testid="btn-start-journey"
            >
              Start My Spiritual Journey
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <PageSeo
        title="My Spiritual Dashboard — Track Mantras, Meditation & Vedic Journey | Vedic Tatva"
        description="Track your daily Vedic spiritual practice — mantras, meditation, temple visits, charity and puja. Build streaks, earn rewards, and stay connected to your dharma."
        canonical="/spiritual-dashboard"
        noindex
      />
      <div className="bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white py-8 sm:py-12">
        <div className="container mx-auto px-4">
          <Link href="/" className="inline-flex items-center gap-1.5 text-white/70 hover:text-white text-sm mb-4 transition-colors" data-testid="link-back-home">
            <ArrowLeft className="h-4 w-4" /> Home
          </Link>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <p className="text-[#D4AF37] text-sm font-medium mb-1">Namaste, {data.profile?.name}</p>
              <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="text-dashboard-title">
                Spiritual Journey Dashboard
              </h1>
              <p className="text-white/60 text-sm mt-1">
                {daysOnJourney} days on your journey • Started {new Date(data.profile?.startDate || "").toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {streak > 0 && (
                <div className="flex items-center gap-2 px-4 py-2 bg-white/10 rounded-xl border border-white/10">
                  <Flame className="h-5 w-5 text-orange-400" />
                  <div>
                    <p className="text-lg font-bold leading-none">{streak}</p>
                    <p className="text-[10px] text-white/60 uppercase tracking-wide">Day Streak</p>
                  </div>
                </div>
              )}
              <button
                onClick={() => setShowSetup(true)}
                className="px-3 py-2 text-sm bg-white/10 rounded-lg hover:bg-white/20 transition-colors border border-white/10"
                data-testid="btn-edit-profile"
              >
                Edit Profile
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6 sm:py-8">
        {/* CLUSTER 0: Karma & Dharma tracker — server-backed score + activity log */}
        <section className="mb-8" data-testid="section-karma-dharma">
          <KarmaTracker />
        </section>

        {/* CLUSTER 1: Your Sadhana — identity + level + stats + loyalty in one card */}
        <section className="bg-white rounded-2xl border border-[#6D2B35]/8 shadow-sm mb-8 overflow-hidden" data-testid="section-your-sadhana">
          <div className="px-5 sm:px-6 pt-5 pb-4 border-b border-[#6D2B35]/8">
            <h2 className="font-serif text-lg font-bold text-[#6D2B35] flex items-center gap-2">
              <Award className="h-5 w-5 text-[#D4AF37]" /> Your Sadhana
            </h2>
          </div>
          <div className="grid lg:grid-cols-5 gap-0">
            {/* Level + progress (left, 2 cols on lg) */}
            <div className="lg:col-span-2 p-5 sm:p-6 bg-gradient-to-br from-[#D4AF37]/8 via-white to-[#6D2B35]/5 lg:border-r border-[#6D2B35]/8">
              <div className="flex items-baseline gap-3 mb-1">
                <p className="text-3xl font-bold text-[#D4AF37]" data-testid="text-total-points">{rewardInfo.total}</p>
                <p className="text-xs text-[#5a4a3a]/60 uppercase tracking-wide">Points</p>
              </div>
              <p className="text-base font-bold text-[#6D2B35]" data-testid="text-level">
                Level {rewardInfo.level} · <span className="text-purple-700">{rewardInfo.levelName}</span>
              </p>
              <div className="mt-4">
                <div className="flex justify-between text-[10px] text-[#5a4a3a]/60 mb-1.5">
                  <span>{rewardInfo.levelName}</span>
                  <span>{rewardInfo.nextLevelName}</span>
                </div>
                <div className="w-full h-2.5 bg-[#F5F0E6] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#D4AF37] to-[#6D2B35] rounded-full transition-all duration-700"
                    style={{ width: `${rewardInfo.pointsToNext > 0 ? Math.min(100, ((rewardInfo.total - (LEVELS[rewardInfo.level - 1]?.min || 0)) / (rewardInfo.pointsToNext + rewardInfo.total - (LEVELS[rewardInfo.level - 1]?.min || 0))) * 100) : 100}%` }}
                    data-testid="reward-progress"
                  />
                </div>
                <p className="text-[10px] text-[#5a4a3a]/50 mt-1.5">
                  {rewardInfo.pointsToNext > 0 ? `${rewardInfo.pointsToNext} points to ${rewardInfo.nextLevelName}` : "Max level reached"}
                </p>
              </div>
              <div className="mt-4 pt-4 border-t border-[#6D2B35]/8 grid grid-cols-3 gap-2 text-center">
                <div className="text-[10px] text-[#5a4a3a]/50">
                  <span className="font-semibold text-[#6D2B35] block text-sm">+5</span>per 10 mantras
                </div>
                <div className="text-[10px] text-[#5a4a3a]/50">
                  <span className="font-semibold text-[#6D2B35] block text-sm">+20</span>temple visit
                </div>
                <div className="text-[10px] text-[#5a4a3a]/50">
                  <span className="font-semibold text-[#6D2B35] block text-sm">+50</span>per achievement
                </div>
              </div>
            </div>
            {/* Stats grid (right, 3 cols on lg) */}
            <div className="lg:col-span-3 p-5 sm:p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: "Current Streak", value: streak, suffix: " days", icon: Flame, color: "text-orange-500" },
                  { label: "Longest Streak", value: longestStreak, suffix: " days", icon: Trophy, color: "text-[#D4AF37]" },
                  { label: "Total Mantras", value: totalMantras, suffix: "", icon: Music, color: "text-purple-500" },
                  { label: "Meditation", value: totalMeditation, suffix: " min", icon: Moon, color: "text-blue-500" },
                  { label: "Temple Visits", value: totalTemple, suffix: "", icon: Sun, color: "text-amber-500" },
                  { label: "Pujas Done", value: totalPuja, suffix: "", icon: Flame, color: "text-red-500" },
                ].map(stat => (
                  <div key={stat.label} className="rounded-xl p-3 bg-[#FBF7EE]/60 border border-[#6D2B35]/5" data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, "-")}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color} mb-1.5`} />
                    <p className="text-lg sm:text-xl font-bold text-[#6D2B35] leading-tight">{stat.value.toLocaleString()}{stat.suffix}</p>
                    <p className="text-[10px] text-[#5a4a3a]/50 uppercase tracking-wide">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {/* Loyalty inline at bottom */}
          <div className="px-5 sm:px-6 pb-5 pt-1">
            <LoyaltyCard />
          </div>
        </section>


        {/* CLUSTER 3: Progress — Achievements + Activity (tabbed; both retrospective) */}
        <section className="mb-8" data-testid="section-progress">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h2 className="font-serif text-xl font-bold text-[#6D2B35]">Progress</h2>
            <p className="text-xs text-[#5a4a3a]/50">{earnedAchievements.length}/{ACHIEVEMENTS.length} milestones · {data.logs.length} days logged</p>
          </div>
          <div className="bg-white rounded-2xl border border-[#6D2B35]/8 shadow-sm p-5 sm:p-6">
            <Tabs defaultValue="achievements">
              <TabsList className="mb-4">
                <TabsTrigger value="achievements" data-testid="tab-achievements">
                  <Trophy className="h-4 w-4 mr-1.5" /> Milestones
                </TabsTrigger>
                <TabsTrigger value="activity" data-testid="tab-activity">
                  <Clock className="h-4 w-4 mr-1.5" /> Recent Activity
                </TabsTrigger>
              </TabsList>
              <TabsContent value="achievements">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                  {ACHIEVEMENTS.map(a => {
                    const earned = earnedAchievements.some(e => e.id === a.id);
                    return (
                      <div
                        key={a.id}
                        className={`rounded-xl p-3 text-center transition-all ${
                          earned
                            ? "bg-gradient-to-br from-[#D4AF37]/10 to-[#6D2B35]/5 border-2 border-[#D4AF37]/30"
                            : "bg-[#F5F0E6]/50 border border-[#6D2B35]/5 opacity-50"
                        }`}
                        data-testid={`achievement-${a.id}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                          earned ? "bg-[#D4AF37]/20" : "bg-[#F5F0E6]"
                        }`}>
                          <a.icon className={`h-5 w-5 ${earned ? "text-[#D4AF37]" : "text-[#5a4a3a]/30"}`} />
                        </div>
                        <p className={`text-xs font-bold ${earned ? "text-[#6D2B35]" : "text-[#5a4a3a]/40"}`}>{a.title}</p>
                        <p className="text-[10px] text-[#5a4a3a]/50 mt-0.5 leading-tight">{a.desc}</p>
                      </div>
                    );
                  })}
                </div>
              </TabsContent>
              <TabsContent value="activity">
                {data.logs.length > 0 ? (
                  <div className="space-y-2">
                    {[...data.logs]
                      .sort((a, b) => b.date.localeCompare(a.date))
                      .slice(0, 10)
                      .map(log => (
                        <div key={log.date} className="flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-[#F5F0E6]/50 transition-colors border-b border-[#6D2B35]/5 last:border-0" data-testid={`log-${log.date}`}>
                          <div className="w-10 h-10 rounded-full bg-[#6D2B35]/5 flex items-center justify-center flex-shrink-0">
                            <Calendar className="h-4 w-4 text-[#6D2B35]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#5a4a3a]">
                              {new Date(log.date).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
                            </p>
                            <div className="flex flex-wrap gap-2 mt-0.5">
                              {log.mantras > 0 && <span className="text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded">{log.mantras} mantras</span>}
                              {log.meditationMins > 0 && <span className="text-[10px] bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{log.meditationMins}m meditation</span>}
                              {log.templeVisit && <span className="text-[10px] bg-amber-50 text-amber-700 px-1.5 py-0.5 rounded">Temple</span>}
                              {log.reading && <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded">Reading</span>}
                              {log.charity && <span className="text-[10px] bg-rose-50 text-rose-700 px-1.5 py-0.5 rounded">Charity</span>}
                              {log.puja && <span className="text-[10px] bg-red-50 text-red-700 px-1.5 py-0.5 rounded">Puja</span>}
                            </div>
                          </div>
                          {log.notes && <span title={log.notes}><Eye className="h-4 w-4 text-[#5a4a3a]/30 flex-shrink-0" /></span>}
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-sm text-[#5a4a3a]/60 text-center py-8">Log your first day above to start your activity history.</p>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* CLUSTER 4: Reminders — personal Pitru Tithi tracking (deeply personal, owns its space) */}
        <section className="mb-8" data-testid="section-reminders">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h2 className="font-serif text-xl font-bold text-[#6D2B35]">Reminders</h2>
            <p className="text-xs text-[#5a4a3a]/50">Pitru Tithi &amp; annual Shradh dates</p>
          </div>
          <SavedAncestorsDashboardSection />
        </section>

        {/* CLUSTER 5: Discover — AI recs + daily panchang + service shortcuts in one block */}
        <section data-testid="section-discover">
          <div className="flex items-baseline justify-between mb-3 px-1">
            <h2 className="font-serif text-xl font-bold text-[#6D2B35]">Discover</h2>
            <p className="text-xs text-[#5a4a3a]/50">Personalised for your sadhana</p>
          </div>
          <PersonalizedRecommendations journeyData={data} />
          <DailyRecommendations defaultExpanded />
          <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/panchang-calendar" className="group bg-white rounded-xl p-4 border border-[#6D2B35]/8 shadow-sm hover-elevate" data-testid="link-panchang">
              <Calendar className="h-5 w-5 text-[#D4AF37] mb-2" />
              <h3 className="font-serif font-bold text-sm text-[#6D2B35]">Panchang Calendar</h3>
              <p className="text-[11px] text-[#5a4a3a]/60 mt-1">Tithi, nakshatra &amp; auspicious days</p>
            </Link>
            <Link href="/astrology" className="group bg-white rounded-xl p-4 border border-[#6D2B35]/8 shadow-sm hover-elevate" data-testid="link-astrology">
              <Sparkles className="h-5 w-5 text-purple-500 mb-2" />
              <h3 className="font-serif font-bold text-sm text-[#6D2B35]">Astrology Services</h3>
              <p className="text-[11px] text-[#5a4a3a]/60 mt-1">AI Kundli, baby names &amp; palm reading</p>
            </Link>
            <Link href="/online-puja-booking" className="group bg-white rounded-xl p-4 border border-[#6D2B35]/8 shadow-sm hover-elevate" data-testid="link-puja">
              <Flame className="h-5 w-5 text-orange-500 mb-2" />
              <h3 className="font-serif font-bold text-sm text-[#6D2B35]">Book a Puja</h3>
              <p className="text-[11px] text-[#5a4a3a]/60 mt-1">Sacred ceremonies with verified pandits</p>
            </Link>
            <Link href="/tools/tithi-calculator" className="group bg-white rounded-xl p-4 border border-[#6D2B35]/8 shadow-sm hover-elevate" data-testid="link-tithi-calculator">
              <Bell className="h-5 w-5 text-[#6D2B35] mb-2" />
              <h3 className="font-serif font-bold text-sm text-[#6D2B35]">Tithi Calculator</h3>
              <p className="text-[11px] text-[#5a4a3a]/60 mt-1">Compute Shradh dates instantly</p>
            </Link>
          </div>
          <RelatedServicesSection context="dashboard" currentPath="/spiritual-dashboard" />
        </section>
      </div>
    </div>
  );
}
type DashAncestor = {
  id: number;
  name: string;
  relation: string;
  departureDate: string;
  departurePlace: string;
  tithiName?: string | null;
  paksha?: string | null;
  notifyWhatsapp?: boolean;
  notifyEmail?: boolean;
  nextShradh?: { date: string; year: number; tithiName: string; paksha: string; hinduMonth: string } | null;
  nextReminder?: { date: string; offsetDays: number } | null;
  recommendedHref?: string;
};

function fmtNiceDate(iso: string) {
  try { return new Date(iso + "T00:00:00").toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "long", year: "numeric" }); }
  catch { return iso; }
}

function SavedAncestorsDashboardSection() {
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: ancestors, isLoading } = useQuery<DashAncestor[]>({
    queryKey: ["/api/pitru/ancestors"],
    queryFn: async () => {
      if (!user) return [];
      const r = await fetch(`/api/pitru/ancestors?uid=${user.id}&email=${encodeURIComponent(user.email || "")}`);
      if (!r.ok) return [];
      return r.json();
    },
    enabled: !!user,
  });

  const patchMut = useMutation({
    mutationFn: async ({ id, patch }: { id: number; patch: Partial<DashAncestor> }) => {
      const r = await fetch(`/api/pitru/ancestors/${id}?uid=${user!.id}&email=${encodeURIComponent(user!.email || "")}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Update failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pitru/ancestors"] }); toast({ title: "Updated" }); },
    onError: (e: unknown) => toast({ title: "Could not update", description: e instanceof Error ? e.message : "Try again." }),
  });
  const deleteMut = useMutation({
    mutationFn: async (id: number) => {
      const r = await fetch(`/api/pitru/ancestors/${id}?uid=${user!.id}&email=${encodeURIComponent(user!.email || "")}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json().catch(() => ({}))).error || "Delete failed");
      return r.json();
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/pitru/ancestors"] }); toast({ title: "Ancestor removed" }); },
    onError: (e: unknown) => toast({ title: "Could not delete", description: e instanceof Error ? e.message : "Try again." }),
  });

  if (!user) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-[#6D2B35]/8 shadow-sm" data-testid="section-saved-ancestors">
      <div className="flex items-start justify-between flex-wrap gap-3 mb-4">
        <div>
          <h2 className="font-serif text-2xl text-[#6D2B35] font-bold flex items-center gap-2">
            <Bell className="w-5 h-5 text-[#D4AF37]" /> Pitru Reminders
          </h2>
          <p className="text-xs text-[#5a4a3a]/70 mt-1">Saved ancestors and their next annual Shradh date. We send free reminders 7 days before, 1 day before and on the day.</p>
        </div>
        <Link href="/tools/tithi-calculator" className="text-xs font-bold text-[#6D2B35] hover:text-[#D4AF37] inline-flex items-center gap-1" data-testid="link-add-ancestor">
          <Plus className="w-3.5 h-3.5" /> Add ancestor
        </Link>
      </div>

      {isLoading ? (
        <div className="text-sm text-[#5a4a3a]/60">Loading…</div>
      ) : !ancestors || ancestors.length === 0 ? (
        <div className="bg-[#FBF7EE] rounded-xl p-6 border border-dashed border-[#D4AF37]/40 text-center">
          <p className="text-sm text-[#5a4a3a] mb-3">You have not saved any ancestors yet. Use the Tithi Calculator to compute the exact Shradh tithi and we will remind you every year — for free.</p>
          <Link href="/tools/tithi-calculator" className="inline-flex items-center gap-2 bg-[#6D2B35] hover:bg-[#5a232b] text-white text-sm font-bold px-4 py-2 rounded-md" data-testid="button-open-calculator">
            Open Tithi Calculator <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {ancestors.map((a) => (
            <div key={a.id} className="bg-[#FBF7EE] rounded-xl p-4 border border-[#D4AF37]/20" data-testid={`card-ancestor-${a.id}`}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-serif text-lg font-bold text-[#6D2B35]" data-testid={`text-ancestor-name-${a.id}`}>{a.name}</div>
                  <div className="text-[11px] uppercase tracking-wide text-[#5a4a3a]/70">{a.relation} • {a.tithiName || "—"} {a.paksha ? `(${a.paksha})` : ""}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const newName = window.prompt("Ancestor name", a.name);
                      if (newName == null) return;
                      const trimmed = newName.trim();
                      if (!trimmed) { toast({ title: "Name cannot be empty" }); return; }
                      patchMut.mutate({ id: a.id, patch: { name: trimmed } });
                    }}
                    className="text-[11px] text-[#6D2B35] hover:text-[#D4AF37] font-bold underline"
                    data-testid={`button-edit-ancestor-${a.id}`}
                  >Edit</button>
                  <button
                    type="button"
                    onClick={() => {
                      if (!window.confirm(`Remove ${a.name} and stop their reminders?`)) return;
                      deleteMut.mutate(a.id);
                    }}
                    className="text-[11px] text-[#6D2B35]/70 hover:text-red-700 font-bold underline"
                    data-testid={`button-delete-ancestor-${a.id}`}
                  >Delete</button>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-3 text-[10px]">
                <label className="inline-flex items-center gap-1 text-[#5a4a3a]/80">
                  <input
                    type="checkbox"
                    checked={!!a.notifyWhatsapp}
                    onChange={(e) => patchMut.mutate({ id: a.id, patch: { notifyWhatsapp: e.target.checked } })}
                    data-testid={`toggle-whatsapp-${a.id}`}
                  />
                  WhatsApp
                </label>
                <label className="inline-flex items-center gap-1 text-[#5a4a3a]/80">
                  <input
                    type="checkbox"
                    checked={!!a.notifyEmail}
                    onChange={(e) => patchMut.mutate({ id: a.id, patch: { notifyEmail: e.target.checked } })}
                    data-testid={`toggle-email-${a.id}`}
                  />
                  Email
                </label>
              </div>
              {a.nextShradh ? (
                <div className="mt-3 bg-white rounded-md p-3 border border-[#D4AF37]/20">
                  <div className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/60 font-bold">Next annual Shradh</div>
                  <div className="text-base font-bold text-[#6D2B35]" data-testid={`text-next-shradh-${a.id}`}>{fmtNiceDate(a.nextShradh.date)}</div>
                  <div className="text-[11px] text-[#5a4a3a]/70">{a.nextShradh.tithiName} • {a.nextShradh.paksha} • {a.nextShradh.hinduMonth}</div>
                  {a.nextReminder && (
                    <div className="text-[10px] text-[#5a4a3a]/60 mt-1" data-testid={`text-next-reminder-${a.id}`}>
                      Next reminder: {fmtNiceDate(a.nextReminder.date)} (T-{a.nextReminder.offsetDays})
                    </div>
                  )}
                </div>
              ) : (
                <div className="mt-3 text-xs text-[#5a4a3a]/60">Computing next date…</div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={a.recommendedHref || "/pind-daan-booking"} className="inline-flex items-center gap-1.5 bg-[#6D2B35] hover:bg-[#5a232b] text-white text-xs font-bold px-3 py-1.5 rounded-md" data-testid={`button-book-pind-daan-${a.id}`}>
                  Book Pind Daan <ChevronRight className="w-3 h-3" />
                </Link>
                <Link href="/online-puja-booking" className="inline-flex items-center gap-1.5 bg-white text-[#6D2B35] border border-[#6D2B35]/20 hover-elevate text-xs font-bold px-3 py-1.5 rounded-md" data-testid={`button-book-tarpan-${a.id}`}>
                  Book Tarpan Puja
                </Link>
                <span className="ml-auto text-[10px] text-[#5a4a3a]/60 self-center">
                  {a.notifyWhatsapp && a.notifyEmail ? "WhatsApp + Email" : a.notifyWhatsapp ? "WhatsApp only" : a.notifyEmail ? "Email only" : "Reminders off"}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
