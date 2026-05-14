import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion } from "framer-motion";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { User, Star, Calendar, Clock, MapPin, Sparkles, Sun, Moon, Gem, Compass, Shield, Loader2, LogOut, Edit3, Save, X, Heart, FileText, Lock, Download, Share2, Copy, Award, Users } from "lucide-react";
import { LoyaltyCard } from "@/components/LoyaltyCard";
import { Button } from "@/components/ui/button";

type Predictions = {
  rashi?: string;
  nakshatra?: string;
  luckyColor?: string;
  luckyNumber?: string;
  luckyDay?: string;
  luckyGemstone?: string;
  rulingPlanet?: string;
  element?: string;
  luckyMetal?: string;
  luckyDirection?: string;
  mantra?: string;
  deity?: string;
  doshaStatus?: string;
  currentDasha?: string;
  todayTip?: string;
  favorableMonths?: string;
  personalityTraits?: string;
  spiritualPath?: string;
};

export default function MyProfile() {
  const { user, logout, updateProfile } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [predictions, setPredictions] = useState<Predictions | null>(null);
  const [loadingPredictions, setLoadingPredictions] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ gotra: "", birthDate: "", birthTime: "", birthCity: "" });

  // Saved premium PDF kundli orders for this user
  type SavedKundli = {
    id: number; fullName: string; birthDate: string; birthTime: string; birthCity: string;
    status: string; amountPaise: number; downloadToken: string; createdAt: string | null; paidAt: string | null;
  };
  const [savedKundlis, setSavedKundlis] = useState<SavedKundli[] | null>(null);
  const [loadingKundlis, setLoadingKundlis] = useState(false);

  useEffect(() => {
    if (!user?.id || !user?.email) return;
    let cancelled = false;
    (async () => {
      setLoadingKundlis(true);
      try {
        const res = await fetch(`/api/kundli-pdf/by-user/${user.id}?email=${encodeURIComponent(user.email)}`);
        if (res.ok) {
          const data = await res.json();
          if (!cancelled) setSavedKundlis(data.kundlis || []);
        } else if (!cancelled) {
          setSavedKundlis([]);
        }
      } catch {
        if (!cancelled) setSavedKundlis([]);
      } finally {
        if (!cancelled) setLoadingKundlis(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user?.id, user?.email]);

  function pdfPasswordFromDob(dob: string): string {
    const [y, m, d] = (dob || "").split("-");
    if (!y || !m || !d) return "";
    return `${d.padStart(2, "0")}${m.padStart(2, "0")}${y.padStart(4, "0")}`;
  }

  function formatBirthShort(date: string, time: string): string {
    try {
      const [y, m, d] = date.split("-").map(Number);
      const months = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      return `${String(d).padStart(2,"0")} ${months[m-1] || ""} ${y} · ${time}`;
    } catch { return `${date} ${time}`; }
  }

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  const hasBirthDetails = user?.birthDate && user?.birthCity;

  useEffect(() => {
    if (hasBirthDetails && !predictions) {
      fetchPredictions();
    }
  }, [hasBirthDetails]);

  const fetchPredictions = async () => {
    if (!user?.birthDate || !user?.birthCity) return;
    setLoadingPredictions(true);
    try {
      const res = await fetch("/api/ai/predictions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: user.name,
          gotra: user.gotra,
          birthDate: user.birthDate,
          birthTime: user.birthTime,
          birthCity: user.birthCity,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setPredictions(data);
      }
    } catch {
      toast({ title: "Could not load predictions", variant: "destructive" });
    } finally {
      setLoadingPredictions(false);
    }
  };

  const startEditing = () => {
    setEditForm({
      gotra: user?.gotra || "",
      birthDate: user?.birthDate || "",
      birthTime: user?.birthTime || "",
      birthCity: user?.birthCity || "",
    });
    setEditing(true);
  };

  const saveDetails = async () => {
    try {
      await updateProfile(editForm);
      setEditing(false);
      setPredictions(null);
      toast({ title: "Details updated! Generating new predictions..." });
      if (editForm.birthDate && editForm.birthCity) {
        setTimeout(fetchPredictions, 500);
      }
    } catch {
      toast({ title: "Update failed", variant: "destructive" });
    }
  };

  if (!user) return null;

  const predictionCards = predictions ? [
    { icon: Moon, label: "Rashi (Moon Sign)", value: predictions.rashi, color: "from-indigo-500 to-purple-600" },
    { icon: Star, label: "Nakshatra", value: predictions.nakshatra, color: "from-amber-500 to-orange-600" },
    { icon: Sun, label: "Ruling Planet", value: predictions.rulingPlanet, color: "from-yellow-500 to-amber-600" },
    { icon: Sparkles, label: "Lucky Color", value: predictions.luckyColor, color: "from-pink-500 to-rose-600" },
    { icon: Calendar, label: "Lucky Day", value: predictions.luckyDay, color: "from-emerald-500 to-teal-600" },
    { icon: Heart, label: "Lucky Number", value: predictions.luckyNumber, color: "from-red-500 to-pink-600" },
    { icon: Gem, label: "Lucky Gemstone", value: predictions.luckyGemstone, color: "from-cyan-500 to-blue-600" },
    { icon: Compass, label: "Lucky Direction", value: predictions.luckyDirection, color: "from-green-500 to-emerald-600" },
    { icon: Shield, label: "Element", value: predictions.element, color: "from-orange-500 to-red-600" },
    { icon: Star, label: "Lucky Metal", value: predictions.luckyMetal, color: "from-gray-500 to-slate-600" },
  ] : [];

  return (
    <div className="min-h-screen bg-[#F5F0E6]">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="relative bg-gradient-to-br from-[#6D2B35] via-[#8B3A47] to-[#6D2B35] text-white py-12 sm:py-16 overflow-hidden"
      >
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-4 right-8 text-8xl font-serif">ॐ</div>
          <div className="absolute bottom-4 left-8 text-6xl font-serif">ॐ</div>
        </div>
        <div className="container mx-auto px-4 relative z-10">
          <div className="flex flex-col sm:flex-row items-center gap-6">
            <div className="w-20 h-20 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border-2 border-[#D4AF37]/40">
              <User className="w-10 h-10 text-[#D4AF37]" />
            </div>
            <div className="text-center sm:text-left">
              <h1 className="font-serif text-2xl sm:text-3xl font-bold" data-testid="heading-profile">{user.name}</h1>
              <p className="text-white/70 text-sm mt-1">{user.email}</p>
              {user.gotra && <p className="text-[#D4AF37] text-sm mt-1">Gotra: {user.gotra}</p>}
            </div>
            <div className="sm:ml-auto flex gap-3">
              <button
                onClick={() => { logout(); setLocation("/"); }}
                className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm transition-colors"
                data-testid="btn-logout"
              >
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* Loyalty + Referral row */}
        {user?.id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid md:grid-cols-2 gap-4"
          >
            <LoyaltyCard />
            <ReferralShareCard userId={user.id} email={user.email} />
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-serif text-xl text-[#6D2B35] flex items-center gap-2">
              <Star className="w-5 h-5 text-[#D4AF37]" />
              Spiritual Details
            </h2>
            {!editing ? (
              <button
                onClick={startEditing}
                className="flex items-center gap-1.5 text-sm text-[#6D2B35] hover:text-[#D4AF37] transition-colors"
                data-testid="btn-edit-details"
              >
                <Edit3 className="w-4 h-4" /> Edit
              </button>
            ) : (
              <div className="flex gap-2">
                <button
                  onClick={saveDetails}
                  className="flex items-center gap-1.5 text-sm text-emerald-600 hover:text-emerald-700 transition-colors"
                  data-testid="btn-save-details"
                >
                  <Save className="w-4 h-4" /> Save
                </button>
                <button
                  onClick={() => setEditing(false)}
                  className="flex items-center gap-1.5 text-sm text-[#5a4a3a]/50 hover:text-[#5a4a3a] transition-colors"
                  data-testid="btn-cancel-edit"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-[#5a4a3a]/60 mb-1">Gotra</label>
                <input
                  type="text"
                  value={editForm.gotra}
                  onChange={(e) => setEditForm({ ...editForm, gotra: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                  placeholder="e.g., Bharadwaj, Kashyap"
                  data-testid="edit-gotra"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5a4a3a]/60 mb-1">Birth Date</label>
                <input
                  type="date"
                  value={editForm.birthDate}
                  onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                  data-testid="edit-birth-date"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5a4a3a]/60 mb-1">Birth Time</label>
                <input
                  type="time"
                  value={editForm.birthTime}
                  onChange={(e) => setEditForm({ ...editForm, birthTime: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                  data-testid="edit-birth-time"
                />
              </div>
              <div>
                <label className="block text-xs text-[#5a4a3a]/60 mb-1">Birth City</label>
                <input
                  type="text"
                  value={editForm.birthCity}
                  onChange={(e) => setEditForm({ ...editForm, birthCity: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-[#6D2B35]/15 bg-[#F5F0E6]/30 text-sm focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/30"
                  placeholder="e.g., Delhi, Mumbai"
                  data-testid="edit-birth-city"
                />
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Gotra</p>
                <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-gotra">{user.gotra || "Not set"}</p>
              </div>
              <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Birth Date</p>
                <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-birth-date">{user.birthDate || "Not set"}</p>
              </div>
              <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Birth Time</p>
                <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-birth-time">{user.birthTime || "Not set"}</p>
              </div>
              <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Birth City</p>
                <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-birth-city">{user.birthCity || "Not set"}</p>
              </div>
            </div>
          )}

          {!hasBirthDetails && !editing && (
            <div className="mt-4 p-4 bg-gradient-to-r from-[#D4AF37]/10 to-[#6D2B35]/5 rounded-xl border border-[#D4AF37]/20">
              <p className="text-sm text-[#6D2B35] font-medium flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#D4AF37]" />
                Add your birth details to unlock personalized Vedic predictions!
              </p>
              <p className="text-xs text-[#5a4a3a]/60 mt-1">
                Get your lucky color, day, gemstone, mantra, and more based on Vedic astrology.
              </p>
              <button
                onClick={startEditing}
                className="mt-3 px-4 py-2 bg-[#D4AF37] text-white text-sm rounded-full hover:bg-[#c4a030] transition-colors"
                data-testid="btn-add-birth-details"
              >
                Add Birth Details
              </button>
            </div>
          )}
        </motion.div>

        {hasBirthDetails && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-xl text-[#6D2B35] flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#D4AF37]" />
                Your Vedic Predictions
              </h2>
              {predictions && (
                <button
                  onClick={() => { setPredictions(null); fetchPredictions(); }}
                  className="text-xs text-[#6D2B35]/60 hover:text-[#6D2B35] transition-colors"
                  data-testid="btn-refresh-predictions"
                >
                  Refresh
                </button>
              )}
            </div>

            {loadingPredictions ? (
              <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8">
                <Loader2 className="w-8 h-8 text-[#D4AF37] animate-spin mb-4" />
                <p className="text-sm text-[#5a4a3a]/60">Analyzing your birth chart...</p>
                <p className="text-xs text-[#5a4a3a]/40 mt-1">Consulting Vedic planetary positions</p>
              </div>
            ) : predictions ? (
              <div className="space-y-6">
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                  {predictionCards.map((card, i) => (
                    <motion.div
                      key={card.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.1 * i }}
                      className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-4 text-center hover:shadow-md transition-shadow"
                      data-testid={`prediction-card-${i}`}
                    >
                      <div className={`w-10 h-10 mx-auto rounded-full bg-gradient-to-br ${card.color} flex items-center justify-center mb-2`}>
                        <card.icon className="w-5 h-5 text-white" />
                      </div>
                      <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">{card.label}</p>
                      <p className="text-sm font-medium text-[#5a4a3a] leading-tight">{card.value || "—"}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {predictions.deity && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <span className="text-[#D4AF37]">🙏</span> Ruling Deity
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80" data-testid="text-deity">{predictions.deity}</p>
                    </div>
                  )}
                  {predictions.mantra && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <span className="text-[#D4AF37]">🕉️</span> Recommended Mantra
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80 italic" data-testid="text-mantra">{predictions.mantra}</p>
                    </div>
                  )}
                  {predictions.doshaStatus && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <Shield className="w-4 h-4 text-[#D4AF37]" /> Dosha Analysis
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80" data-testid="text-dosha">{predictions.doshaStatus}</p>
                    </div>
                  )}
                  {predictions.currentDasha && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-[#D4AF37]" /> Current Dasha
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80" data-testid="text-dasha">{predictions.currentDasha}</p>
                    </div>
                  )}
                  {predictions.personalityTraits && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <User className="w-4 h-4 text-[#D4AF37]" /> Personality Traits
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80" data-testid="text-traits">{predictions.personalityTraits}</p>
                    </div>
                  )}
                  {predictions.favorableMonths && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-[#D4AF37]" /> Favorable Months
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80" data-testid="text-months">{predictions.favorableMonths}</p>
                    </div>
                  )}
                  {predictions.spiritualPath && (
                    <div className="bg-white rounded-xl shadow-sm border border-[#6D2B35]/8 p-5 sm:col-span-2">
                      <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-[#D4AF37]" /> Your Spiritual Path
                      </h3>
                      <p className="text-sm text-[#5a4a3a]/80" data-testid="text-spiritual-path">{predictions.spiritualPath}</p>
                    </div>
                  )}
                </div>

                {predictions.todayTip && (
                  <div className="bg-gradient-to-r from-[#D4AF37]/10 to-[#6D2B35]/5 rounded-xl border border-[#D4AF37]/20 p-5">
                    <h3 className="font-serif text-[#6D2B35] text-sm font-semibold mb-2 flex items-center gap-2">
                      <Sun className="w-4 h-4 text-[#D4AF37]" /> Today's Spiritual Tip
                    </h3>
                    <p className="text-sm text-[#5a4a3a]/80" data-testid="text-today-tip">{predictions.todayTip}</p>
                  </div>
                )}
              </div>
            ) : null}
          </motion.div>
        )}

        {/* Saved Premium PDF Kundli reports */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6"
        >
          <div className="flex items-start justify-between gap-3 mb-4 flex-wrap">
            <div>
              <h2 className="font-serif text-xl text-[#6D2B35] flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#D4AF37]" />
                My Premium Kundli Reports
              </h2>
              <p className="text-xs text-[#5a4a3a]/60 mt-1">All your purchased PDF kundlis — password-protected with your date of birth (DDMMYYYY).</p>
            </div>
            <button
              onClick={() => setLocation("/premium-kundli-pdf")}
              className="text-xs font-medium text-[#6D2B35] underline underline-offset-2 hover:opacity-80"
              data-testid="link-buy-new-kundli"
            >
              + Buy a new kundli
            </button>
          </div>

          {loadingKundlis ? (
            <div className="flex items-center justify-center py-8 text-[#5a4a3a]/60">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading your reports…
            </div>
          ) : savedKundlis && savedKundlis.length > 0 ? (
            <div className="space-y-3">
              {savedKundlis.map((k) => {
                const isReady = k.status === "ready" || k.status === "sent";
                const password = pdfPasswordFromDob(k.birthDate);
                return (
                  <div
                    key={k.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-[#FBF7EE] rounded-xl border border-[#D4AF37]/20"
                    data-testid={`row-kundli-${k.id}`}
                  >
                    <div className="min-w-0">
                      <p className="font-semibold text-[#6D2B35] truncate" data-testid={`text-kundli-name-${k.id}`}>
                        {k.fullName}
                      </p>
                      <p className="text-xs text-[#5a4a3a]/70 mt-0.5">
                        {formatBirthShort(k.birthDate, k.birthTime)} · {k.birthCity}
                      </p>
                      <p className="text-[11px] text-[#5a4a3a]/60 mt-1 flex items-center gap-1.5">
                        <span className="font-mono">VTK-{k.id}</span>
                        <span>·</span>
                        <span className={isReady ? "text-emerald-700" : k.status === "failed" ? "text-red-600" : "text-amber-700"} data-testid={`status-kundli-${k.id}`}>
                          {isReady ? "Ready" : k.status === "failed" ? "Failed" : "Generating…"}
                        </span>
                        {password && isReady && (
                          <>
                            <span>·</span>
                            <Lock className="w-2.5 h-2.5" />
                            <span className="font-mono">{password}</span>
                          </>
                        )}
                      </p>
                    </div>
                    {isReady ? (
                      <a
                        href={`/api/kundli-pdf/download/${k.downloadToken}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6D2B35] text-white text-sm font-medium hover:opacity-90 transition shrink-0"
                        data-testid={`button-download-kundli-${k.id}`}
                      >
                        <Download className="w-3.5 h-3.5" /> Download PDF
                      </a>
                    ) : (
                      <span className="text-xs text-[#5a4a3a]/60 italic shrink-0">
                        {k.status === "failed" ? "Please contact support" : "Available shortly"}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8 px-4 bg-[#FBF7EE]/40 rounded-xl border border-dashed border-[#6D2B35]/15">
              <FileText className="w-8 h-8 text-[#D4AF37] mx-auto mb-2 opacity-60" />
              <p className="text-sm text-[#5a4a3a]/70 mb-3">You haven't purchased a premium kundli report yet.</p>
              <button
                onClick={() => setLocation("/premium-kundli-pdf")}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#6D2B35] text-white text-sm font-medium hover:opacity-90 transition"
                data-testid="button-get-first-kundli"
              >
                <Sparkles className="w-3.5 h-3.5" /> Get your premium kundli (₹501)
              </button>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-[#6D2B35]/8 p-6"
        >
          <h2 className="font-serif text-xl text-[#6D2B35] flex items-center gap-2 mb-4">
            <User className="w-5 h-5 text-[#D4AF37]" />
            Account Details
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Full Name</p>
              <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-name">{user.name}</p>
            </div>
            <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
              <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Email</p>
              <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-email">{user.email}</p>
            </div>
            {user.phone && (
              <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">Phone</p>
                <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-phone">{user.phone}</p>
              </div>
            )}
            {user.city && (
              <div className="p-3 bg-[#F5F0E6]/50 rounded-xl">
                <p className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/40 mb-1">City</p>
                <p className="text-sm font-medium text-[#5a4a3a]" data-testid="text-city">{user.city}</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

function ReferralShareCard({ userId, email }: { userId: number; email: string }) {
  const [data, setData] = useState<{ code: string; shareUrl: string; totalReferred: number; bonusEarned: number; bonusPerReferral: number } | null>(null);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetch(`/api/referrals/me/${userId}?uid=${userId}&email=${encodeURIComponent(email)}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d && !d.error) setData(d); })
      .catch(() => {});
  }, [userId, email]);

  async function copyLink() {
    if (!data?.shareUrl) return;
    try {
      await navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      toast({ title: "Link copied", description: "Share it with friends and family" });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast({ title: "Copy failed", description: "Please copy manually", variant: "destructive" });
    }
  }

  async function shareNative() {
    if (!data?.shareUrl) return;
    const text = `Join Vedic Tatva for authentic spiritual essentials. Use my referral link to get started: ${data.shareUrl}`;
    if (navigator.share) {
      try { await navigator.share({ title: "Vedic Tatva", text, url: data.shareUrl }); } catch {}
    } else {
      copyLink();
    }
  }

  if (!data) {
    return (
      <div className="bg-white rounded-md border border-[#6D2B35]/10 p-5 flex items-center justify-center min-h-[180px]">
        <Loader2 className="h-5 w-5 animate-spin text-[#6D2B35]/40" aria-hidden="true" />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-md border border-[#6D2B35]/10 p-5" data-testid="card-referral-share">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4 text-[#D4AF37]" aria-hidden="true" />
            <h3 className="font-serif font-bold text-[#4a1a22]">Refer & Earn</h3>
          </div>
          <p className="text-[11px] text-[#5a4a3a]/65 mt-1">Earn {data.bonusPerReferral} points per referred friend</p>
        </div>
        <Link href="/refer">
          <Button size="sm" variant="outline" className="h-8 text-[11px] border-[#6D2B35]/30 text-[#6D2B35] font-semibold" data-testid="btn-refer-details">Details</Button>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div className="rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 p-2.5 text-center">
          <div className="text-lg font-bold text-[#6D2B35]" data-testid="text-referred-count">{data.totalReferred}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/65 font-semibold">Referred</div>
        </div>
        <div className="rounded-md bg-[#FBF7EE] border border-[#D4AF37]/20 p-2.5 text-center">
          <div className="text-lg font-bold text-[#6D2B35]" data-testid="text-bonus-earned">{data.bonusEarned}</div>
          <div className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/65 font-semibold">Pts Earned</div>
        </div>
      </div>

      <div className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE]/60 px-3 py-2 mb-2.5">
        <div className="text-[10px] uppercase tracking-wider text-[#5a4a3a]/60 font-semibold mb-0.5">Your Code</div>
        <div className="font-mono text-sm font-bold text-[#6D2B35] truncate" data-testid="text-referral-code">{data.code}</div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={copyLink} variant="outline" className="flex-1 h-9 text-[12px] border-[#6D2B35]/30 text-[#6D2B35] font-semibold" data-testid="btn-copy-referral">
          <Copy className="h-3.5 w-3.5 mr-1" />
          {copied ? "Copied!" : "Copy Link"}
        </Button>
        <Button size="sm" onClick={shareNative} className="flex-1 h-9 text-[12px] bg-[#6D2B35] hover:bg-[#5a1f29] text-[#D4AF37] font-semibold" data-testid="btn-share-referral">
          <Share2 className="h-3.5 w-3.5 mr-1" />
          Share
        </Button>
      </div>
    </div>
  );
}
