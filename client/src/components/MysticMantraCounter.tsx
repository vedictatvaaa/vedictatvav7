import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, Loader2, RotateCcw, Volume2, VolumeX, Wand2, Maximize2, Minimize2, Play, Pause, Users, X, Library, Music, Search, Flame, Wind, Heart, Target, Sun, Calendar, Zap, BookOpen, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { MANTRA_LIBRARY, LIBRARY_CATEGORIES, type LibraryMantra } from "@/data/mantra-library";

type MantraResult = {
  id?: string;
  label: string;
  devanagari: string;
  transliteration: string;
  deity: string;
  meaning: string;
  recommendedCount: 27 | 54 | 108 | 1008;
  color: "gold" | "saffron" | "maroon" | "white" | "green" | "blue";
  audioUrl?: string | null;
};

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 64);
const audioOverrideKey = (m: { id?: string; label: string }) =>
  `vt-mystic-counter:audio:${m.id || slugify(m.label)}`;

const MOOD: Record<MantraResult["color"], { from: string; to: string; ring: string; glow: string }> = {
  gold:    { from: "#FFE9A8", to: "#D4AF37", ring: "#D4AF37", glow: "212, 175, 55" },
  saffron: { from: "#FFD7A8", to: "#FF9933", ring: "#FF9933", glow: "255, 153, 51" },
  maroon:  { from: "#E8B7BF", to: "#6D2B35", ring: "#6D2B35", glow: "109, 43, 53" },
  white:   { from: "#FFFFFF", to: "#E9DCC0", ring: "#D4AF37", glow: "255, 250, 236" },
  green:   { from: "#CDEAC0", to: "#3F7D5A", ring: "#3F7D5A", glow: "63, 125, 90" },
  blue:    { from: "#CFE3F1", to: "#3A6B8C", ring: "#3A6B8C", glow: "58, 107, 140" },
};

const SUGGESTIONS = [
  "Om Namah Shivaya",
  "Ganesha for new beginnings",
  "Peace of mind",
  "Mahamrityunjaya",
  "Lakshmi for abundance",
  "Hanuman for courage",
];

const STORAGE_KEY = "vt-mystic-counter:last";
const COUNT_KEY = "vt-mystic-counter:count";
const SADHANA_KEY = "vt-mystic-counter:sadhana";
const SANKALPA_KEY = "vt-mystic-counter:sankalpa";
const SESSION_KEY = "vt-mystic-counter:session";
const MUHURTA_CACHE_KEY = "vt-mystic-counter:muhurta";

// 108 malas = 1 mahamala (11,664 chants of one mantra) — a classical sadhana.
const MAHAMALA_TARGET = 108;

// Guided session presets — classical Vedic sadhanas with daily commitment.
// `mantraId` matches an entry in MANTRA_LIBRARY; `dailyMalas` × `days` = total commitment.
type SessionPreset = {
  id: string;
  name: string;
  mantraId: string;
  days: number;
  dailyMalas: number;
  deity: string;
  description: string;
};

const SESSION_PRESETS: SessionPreset[] = [
  {
    id: "mahamrityunjaya-21",
    name: "21-Day Mahamrityunjaya",
    mantraId: "mahamrityunjaya",
    days: 21, dailyMalas: 1,
    deity: "Shiva",
    description: "A classical 21-day sadhana for healing, courage in illness, and conquest of the fear of death.",
  },
  {
    id: "gayatri-40",
    name: "40-Day Gayatri",
    mantraId: "gayatri",
    days: 40, dailyMalas: 1,
    deity: "Savitr (Sun)",
    description: "Forty days of Gayatri at sunrise to illumine the intellect and clarify life direction.",
  },
  {
    id: "hanuman-11",
    name: "11-Day Hanuman Chalisa Sankalpa",
    mantraId: "hanuman-mantra",
    days: 11, dailyMalas: 1,
    deity: "Hanuman",
    description: "Eleven days of Hanuman japa for courage, protection, and the strength to overcome obstacles.",
  },
  {
    id: "navadurga-9",
    name: "Navratri · 9-Day Devi",
    mantraId: "om-dum-durgayai",
    days: 9, dailyMalas: 1,
    deity: "Durga",
    description: "Nine nights of Devi worship, one mala per day, aligned with the lunar Navratri rhythm.",
  },
  {
    id: "om-namah-shivaya-40",
    name: "40-Day Om Namah Shivaya",
    mantraId: "om-namah-shivaya",
    days: 40, dailyMalas: 2,
    deity: "Shiva",
    description: "Two malas a day for forty days — a deep dive into the panchakshara mantra.",
  },
];

type ActiveSession = {
  presetId: string;
  startedISO: string;        // YYYY-MM-DD
  malasCompleted: number;    // total across all days of this session
  lastChantDate: string;     // YYYY-MM-DD
  todayMalas: number;        // resets when date changes
};

type SadhanaStats = {
  totalMalas: number;       // lifetime malas across all mantras
  mahamalaMalas: number;    // malas counted toward the current mahamala (resets at 108)
  mahamalas: number;        // completed mahamalas (lifetime)
  dailyStreak: number;      // consecutive days with at least 1 mala
  longestStreak: number;
  lastChantDate: string;    // YYYY-MM-DD
};

const DEFAULT_SADHANA: SadhanaStats = {
  totalMalas: 0,
  mahamalaMalas: 0,
  mahamalas: 0,
  dailyStreak: 0,
  longestStreak: 0,
  lastChantDate: "",
};

// Journal — every completed mala can become a private reflection note.
// Stored client-side only (no PII leaves the device). Capped to keep
// localStorage light; old entries fall off the end.
type JournalEntry = {
  id: string;            // unique key, e.g. dateISO + random
  dateISO: string;       // YYYY-MM-DD-Thh:mm
  mantraId: string;
  mantraLabel: string;
  devanagari: string;
  transliteration: string;
  meaning: string;
  sankalpa: string;      // intention at the time
  malaNumber: number;    // which mala in this session (1, 2, 3…)
  reflection: string;    // user's private note
};
const JOURNAL_KEY = "vt_japa_journal";
const JOURNAL_MAX = 200;

// Snapshot captured at the moment a mala completes — fed into the
// reflection ritual modal. Kept separate from the saved entry so the
// user can dismiss without committing.
type RitualSnapshot = Omit<JournalEntry, "id" | "reflection"> | null;

const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

const daysBetween = (a: string, b: string) => {
  if (!a || !b) return Infinity;
  const da = new Date(a + "T00:00:00").getTime();
  const db = new Date(b + "T00:00:00").getTime();
  return Math.round((db - da) / 86400000);
};

// Approximate syllable count for haptic shaping. Counts vowel groups in the
// transliteration. Not phonetically perfect for Sanskrit but close enough to
// distinguish bija (1-3) vs medium (4-8) vs long (9+) mantras.
const countSyllables = (s: string): number => {
  if (!s) return 0;
  const matches = s.toLowerCase().match(/[aeiouāīūṛḷ]+/g);
  return matches ? matches.length : 0;
};

// Sruti / tanpura key → Sa frequency in Hz, low-octave (A2…A3 range).
// These are the keys most Indian classical singers tune to: men typically
// pick C–E, women E–A. Listed in pitch order so the chip row reads naturally.
// ===== Weekday → Deity mapping (classical Hindu sadhana calendar) =====
// Each weekday is sacred to a particular deity. We auto-suggest the
// matching mantra so a daily practitioner gets the "right" chant for
// today without having to know the calendar themselves.
const WEEKDAY_SADHANA: Record<number, {
  weekday: string;
  deity: string;
  mantraId: string;
  reason: string;
}> = {
  0: { weekday: "Sunday",    deity: "Surya",    mantraId: "om-suryaya-namah",    reason: "Sunday is sacred to the Sun — invoke vitality, clarity, leadership." },
  1: { weekday: "Monday",    deity: "Shiva",    mantraId: "om-namah-shivaya",    reason: "Monday belongs to Shiva — chant for inner stillness and dissolution of ego." },
  2: { weekday: "Tuesday",   deity: "Hanuman",  mantraId: "hanuman-mantra",      reason: "Tuesday is for Hanuman & Mangala — courage, protection, removal of obstacles." },
  3: { weekday: "Wednesday", deity: "Ganesha",  mantraId: "om-gam-ganapataye",   reason: "Wednesday is Ganesha's day — invoke wisdom and clear the path ahead." },
  4: { weekday: "Thursday",  deity: "Vishnu",   mantraId: "om-namo-narayanaya",  reason: "Thursday is Brihaspati's & Vishnu's day — invoke grace, dharma, prosperity." },
  5: { weekday: "Friday",    deity: "Lakshmi",  mantraId: "om-shrim-mahalakshmi", reason: "Friday is for Lakshmi — invoke abundance, beauty, and harmony at home." },
  6: { weekday: "Saturday",  deity: "Hanuman",  mantraId: "hanuman-bija",        reason: "Saturday is Shani's day — chant Hanuman's bija to soften Shani's lessons." },
};

const KEY_TO_HZ: Record<string, number> = {
  "C":   65.41,
  "C#":  69.30,
  "D":   73.42,
  "D#":  77.78,
  "E":   82.41,
  "F":   87.31,
  "F#":  92.50,
  "G":   98.00,
  "G#": 103.83,
  "A":  110.00,
  "A#": 116.54,
  "B":  123.47,
};
const SRUTI_KEYS = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];

// Tiny temple-bell synth + a sustained low om-drone for stage ambience.
function useAudio() {
  const ctxRef = useRef<AudioContext | null>(null);
  const droneRef = useRef<{ stop: () => void } | null>(null);
  const get = () => {
    if (!ctxRef.current && typeof window !== "undefined") {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    const ctx = ctxRef.current;
    // Browsers start the context in 'suspended' state until a user gesture.
    // resume() is safe to call on every audio op — it's a no-op when running.
    if (ctx && ctx.state === "suspended") {
      try { ctx.resume(); } catch {}
    }
    return ctx;
  };
  const tap = (enabled: boolean) => {
    if (!enabled) return;
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.type = "sine";
    o.frequency.setValueAtTime(880, t);
    o.frequency.exponentialRampToValueAtTime(660, t + 0.18);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    o.connect(g).connect(ctx.destination);
    o.start(t); o.stop(t + 0.24);
  };
  const bell = (enabled: boolean) => {
    if (!enabled) return;
    const ctx = get(); if (!ctx) return;
    const t = ctx.currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.type = "sine"; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t + i * 0.04);
      g.gain.exponentialRampToValueAtTime(0.22, t + i * 0.04 + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.04 + 1.6);
      o.connect(g).connect(ctx.destination);
      o.start(t + i * 0.04); o.stop(t + i * 0.04 + 1.65);
    });
  };
  // Layered sine drone (Sa + Pa fifth, slightly detuned per oscillator to
  // mimic a tanpura's beating shimmer) — accepts an optional Sa frequency
  // in Hz so the user can tune to their voice. Default 110 Hz ≈ A2.
  const startDrone = (baseHz: number = 110) => {
    if (droneRef.current) return;
    const ctx = get(); if (!ctx) return;
    const sa = baseHz;
    const pa = baseHz * 1.5;        // perfect fifth above Sa
    const saUp = baseHz * 2;        // Sa one octave up — adds shimmer
    const master = ctx.createGain();
    master.gain.setValueAtTime(0.0001, ctx.currentTime);
    master.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 1.5);
    master.connect(ctx.destination);
    const oscs: OscillatorNode[] = [];
    const layout: [number, number][] = [
      [sa, 0.7], [sa * 1.0036, 0.7],   // Sa + tiny detune partner
      [pa, 0.35], [pa * 1.0036, 0.35], // Pa + tiny detune partner
      [saUp, 0.18],                     // Sa octave shimmer
    ];
    layout.forEach(([f, vol]) => {
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = vol;
      o.connect(g).connect(master);
      o.start();
      oscs.push(o);
    });
    droneRef.current = {
      stop: () => {
        try {
          master.gain.cancelScheduledValues(ctx.currentTime);
          master.gain.setValueAtTime(master.gain.value, ctx.currentTime);
          master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.6);
        } catch {}
        const stopAt = ctx.currentTime + 0.7;
        oscs.forEach((o) => { try { o.stop(stopAt); } catch {} });
      },
    };
  };
  const stopDrone = () => {
    if (droneRef.current) {
      droneRef.current.stop();
      droneRef.current = null;
    }
  };
  // Memoize once — returning a fresh object every render would invalidate
  // any useEffect that depends on it (restarting the chorus on every state
  // change and cancelling speech mid-utterance).
  const apiRef = useRef<{ tap: typeof tap; bell: typeof bell; startDrone: typeof startDrone; stopDrone: typeof stopDrone } | null>(null);
  if (!apiRef.current) apiRef.current = { tap, bell, startDrone, stopDrone };
  return apiRef.current;
}

// Pick the most "sage-like" voices: prefer Indian English, then deep male
// English voices. Returns up to N voices to layer for the chorus effect.
function pickSageVoices(max = 4): SpeechSynthesisVoice[] {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return [];
  const all = window.speechSynthesis.getVoices();
  if (!all.length) return [];
  const score = (v: SpeechSynthesisVoice) => {
    let s = 0;
    const lang = (v.lang || "").toLowerCase();
    const name = (v.name || "").toLowerCase();
    if (lang.startsWith("hi")) s += 100;
    if (lang.includes("in")) s += 80;
    if (lang.startsWith("en")) s += 30;
    if (/(ravi|rishi|hemant|aditi|veena|priya|google हिन्दी|google india)/.test(name)) s += 60;
    if (/(male|man|deep|baritone|alex|daniel|fred|james)/.test(name)) s += 25;
    if (/(female|woman|samantha|karen|allison)/.test(name)) s -= 5; // chorus weights male
    if (v.localService) s += 5;
    return s;
  };
  const sorted = [...all].sort((a, b) => score(b) - score(a));
  // Deduplicate by lang to widen tonal variety
  const seen = new Set<string>();
  const out: SpeechSynthesisVoice[] = [];
  for (const v of sorted) {
    const key = (v.lang || "") + "|" + (v.name || "").slice(0, 6);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(v);
    if (out.length >= max) break;
  }
  return out;
}

function vibrate(pattern: number | number[], on: boolean) {
  if (!on) return;
  try { (navigator as any).vibrate?.(pattern); } catch {}
}

type Ripple = { id: number; x: number; y: number };
type Spark = { id: number; x: number; y: number; angle: number; dist: number; hue: "gold" | "saffron" | "white" };
type Floater = { id: number; x: number; y: number; glyph: string };

export default function MysticMantraCounter() {
  const { toast } = useToast();
  const audio = useAudio();

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [mantra, setMantra] = useState<MantraResult | null>(null);
  const [count, setCount] = useState(0);
  const [malas, setMalas] = useState(0);
  const [soundOn, setSoundOn] = useState(true);
  const [vibeOn, setVibeOn] = useState(true);
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const [floaters, setFloaters] = useState<Floater[]>([]);
  const [pulse, setPulse] = useState(0);
  const [celebrate, setCelebrate] = useState(false);

  // Mala completion ritual + private journal
  const [ritualSnapshot, setRitualSnapshot] = useState<RitualSnapshot>(null);
  const [reflection, setReflection] = useState("");
  const [journal, setJournal] = useState<JournalEntry[]>([]);
  const [showJournal, setShowJournal] = useState(false);

  // The whole component now renders as a single embedded app panel —
  // no focus toggle, no full-screen overlay. `focus` is kept as a
  // const so the existing dark-theme styling branches stay valid.
  const focus = true;
  const setFocus = (_: boolean) => {};
  const [chorusOn, setChorusOn] = useState(false);

  // Sadhana Mode — intention, streak, mahamala progress, breath guidance
  const [sankalpa, setSankalpa] = useState("");
  const [sadhana, setSadhana] = useState<SadhanaStats>(DEFAULT_SADHANA);
  const [breathOn, setBreathOn] = useState(false);
  // Sruti / tanpura drone — independent ambient layer the user can keep on
  // through chanting whether or not the Sage Chorus is running. Persisted
  // so the room stays "tuned" between sessions.
  const [droneOn, setDroneOn] = useState<boolean>(false);
  const [droneKey, setDroneKey] = useState<string>("A");
  const [breathPhase, setBreathPhase] = useState<"inhale" | "hold" | "exhale">("inhale");
  const sadhanaRef = useRef<SadhanaStats>(DEFAULT_SADHANA);

  // Brahma Muhurta — auspicious 96 min before sunrise (window lasts ~48 min).
  // We fetch sunrise once per day for India (default coords ~ Varanasi) and cache.
  const [muhurtaActive, setMuhurtaActive] = useState(false);
  const [muhurtaSunrise, setMuhurtaSunrise] = useState<Date | null>(null);

  // Tap rhythm guard — gentle nudge if user taps too fast (< 800ms × 3 in a row).
  const lastTapTsRef = useRef<number>(0);
  const fastTapStreakRef = useRef<number>(0);
  const [rhythmNudge, setRhythmNudge] = useState(false);

  // Guided sessions
  const [activeSession, setActiveSession] = useState<ActiveSession | null>(null);
  const activeSessionRef = useRef<ActiveSession | null>(null);
  const [showSessions, setShowSessions] = useState(false);
  const [speedMs, setSpeedMs] = useState(2800);          // ~3s per chant
  const [voicesReady, setVoicesReady] = useState(false);

  // Library + recorded-audio state
  const [showLibrary, setShowLibrary] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<"All" | typeof LIBRARY_CATEGORIES[number]>("All");
  const [audioOverride, setAudioOverride] = useState<string>("");   // user-pasted URL for current mantra
  const [audioPlaying, setAudioPlaying] = useState(false);
  // Loop-N-times: 0 = infinite, otherwise stop after N playthroughs.
  // Defaults to 108 — the classical mala count — so a single uploaded
  // recording becomes one full mala of japa.
  const [loopTarget, setLoopTarget] = useState<number>(108);
  const [loopPlays, setLoopPlays] = useState<number>(0);
  // When true, every completed playthrough also advances the bead counter
  // (so the recording IS the chant). Default on for counts > 1.
  const [autoCountOnLoop, setAutoCountOnLoop] = useState<boolean>(true);
  // Silent gap (ms) between repeats — gives you breath room to chant along
  // with each playthrough instead of just listening passively.
  const [loopGapMs, setLoopGapMs] = useState<number>(0);
  const loopGapTimerRef = useRef<number | null>(null);
  // Blob URL for an uploaded local file — revoked on change/unmount.
  const blobUrlRef = useRef<string | null>(null);
  const audioFileInputRef = useRef<HTMLInputElement | null>(null);

  // Mic listener — soft "I hear your voice" feedback. Pure local analysis,
  // never streamed anywhere. Toggleable; off by default for privacy.
  const [micOn, setMicOn] = useState<boolean>(false);
  const [voiceLevel, setVoiceLevel] = useState<number>(0); // 0..1, smoothed RMS
  const micStreamRef = useRef<MediaStream | null>(null);
  const micCtxRef = useRef<AudioContext | null>(null);
  const micAnalyserRef = useRef<AnalyserNode | null>(null);
  const micRafRef = useRef<number | null>(null);
  const voiceLevelSmoothRef = useRef<number>(0);
  const lastMicSetTsRef = useRef<number>(0);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [showAudioInput, setShowAudioInput] = useState(false);
  const audioElRef = useRef<HTMLAudioElement | null>(null);

  const rippleId = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const chorusIntervalRef = useRef<number | null>(null);
  // Latest values consumed by the chorus interval (avoids stale closures).
  const stateRef = useRef({ count: 0, mantra: null as MantraResult | null, soundOn: true, vibeOn: true, nudgeShowing: false, malas: 0, sankalpa: "" });

  useEffect(() => {
    stateRef.current.count = count;
    stateRef.current.mantra = mantra;
    stateRef.current.soundOn = soundOn;
    stateRef.current.vibeOn = vibeOn;
    stateRef.current.malas = malas;
    stateRef.current.sankalpa = sankalpa;
  }, [count, mantra, soundOn, vibeOn, malas, sankalpa]);

  // Hydrate journal from localStorage on mount; persist on every change.
  // Wrapped in try/catch so a corrupt entry can't crash the counter.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(JOURNAL_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setJournal(parsed.slice(0, JOURNAL_MAX));
      }
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem(JOURNAL_KEY, JSON.stringify(journal.slice(0, JOURNAL_MAX)));
    } catch { /* quota / private mode — silent */ }
  }, [journal]);

  // Save the current ritual snapshot + reflection note as a journal entry.
  // Reflection is optional — the snapshot itself is worth keeping as a
  // log of which mantra you completed and when.
  const saveJournalEntry = useCallback(() => {
    if (!ritualSnapshot) return;
    const entry: JournalEntry = {
      id: `${ritualSnapshot.dateISO}-${Math.random().toString(36).slice(2, 8)}`,
      reflection: reflection.trim().slice(0, 1000),
      ...ritualSnapshot,
    };
    setJournal((prev) => [entry, ...prev].slice(0, JOURNAL_MAX));
    setRitualSnapshot(null);
    setReflection("");
    toast({ title: "Mala logged", description: "Your reflection is saved privately on this device." });
  }, [ritualSnapshot, reflection, toast]);

  const deleteJournalEntry = useCallback((id: string) => {
    setJournal((prev) => prev.filter((e) => e.id !== id));
  }, []);

  useEffect(() => () => {
    timeoutsRef.current.forEach((id) => clearTimeout(id));
    timeoutsRef.current = [];
    if (chorusIntervalRef.current) clearInterval(chorusIntervalRef.current);
    try { window.speechSynthesis?.cancel(); } catch {}
    audio.stopDrone();
  }, [audio]);

  // Restore last session
  useEffect(() => {
    try {
      const m = localStorage.getItem(STORAGE_KEY);
      const c = localStorage.getItem(COUNT_KEY);
      if (m) setMantra(JSON.parse(m));
      if (c) {
        const parsed = JSON.parse(c);
        setCount(parsed.count || 0);
        setMalas(parsed.malas || 0);
      }
    } catch {}
  }, []);

  // Restore per-mantra audio override whenever the chosen mantra changes
  useEffect(() => {
    if (!mantra) { setAudioOverride(""); return; }
    // Switching mantra invalidates any per-session blob URL.
    if (blobUrlRef.current) {
      try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
      blobUrlRef.current = null;
    }
    try {
      const stored = localStorage.getItem(audioOverrideKey(mantra));
      setAudioOverride(stored || "");
    } catch { setAudioOverride(""); }
    setAudioError(null);
    setAudioPlaying(false);
    setLoopPlays(0);
    setLoopTarget(mantra.recommendedCount || 108);
  }, [mantra]);

  const effectiveAudioUrl = (audioOverride || mantra?.audioUrl || "").trim();

  const cancelLoopGap = () => {
    if (loopGapTimerRef.current != null) {
      window.clearTimeout(loopGapTimerRef.current);
      loopGapTimerRef.current = null;
    }
  };

  const toggleAudio = () => {
    const el = audioElRef.current;
    if (!el || !effectiveAudioUrl) return;
    if (audioPlaying) {
      el.pause();
      setAudioPlaying(false);
      cancelLoopGap();
    } else {
      setAudioError(null);
      // Fresh play session — reset the loop-progress counter so "X / 108"
      // starts at 0 again.
      setLoopPlays(0);
      try { el.currentTime = 0; } catch {}
      el.play().then(() => setAudioPlaying(true)).catch((err) => {
        setAudioError(err?.message || "Could not play audio. Check the URL or CORS.");
        setAudioPlaying(false);
      });
    }
  };

  // Local-file upload — creates a blob URL valid for this session only.
  // Blob URLs don't survive a reload, so we don't persist them via
  // saveAudioOverride; we just set the in-memory override.
  const handleAudioFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (!f.type.startsWith("audio/")) {
      setAudioError("Please choose an audio file (MP3, OGG, WAV, M4A).");
      return;
    }
    if (blobUrlRef.current) {
      try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
    }
    const url = URL.createObjectURL(f);
    blobUrlRef.current = url;
    setAudioOverride(url);
    setAudioError(null);
    setLoopPlays(0);
    setAudioPlaying(false);
  };

  // Revoke the blob URL on unmount so we don't leak the object.
  useEffect(() => () => {
    if (blobUrlRef.current) {
      try { URL.revokeObjectURL(blobUrlRef.current); } catch {}
      blobUrlRef.current = null;
    }
  }, []);

  const saveAudioOverride = (url: string) => {
    if (!mantra) return;
    const trimmed = url.trim();
    try {
      if (trimmed) localStorage.setItem(audioOverrideKey(mantra), trimmed);
      else localStorage.removeItem(audioOverrideKey(mantra));
    } catch {}
    setAudioOverride(trimmed);
    setAudioError(null);
    setAudioPlaying(false);
  };

  // Pick directly from the library (no AI call, instant)
  const pickFromLibrary = (m: LibraryMantra) => {
    const result: MantraResult = {
      id: m.id,
      label: m.label,
      devanagari: m.devanagari,
      transliteration: m.transliteration,
      deity: m.deity,
      meaning: m.meaning,
      recommendedCount: m.recommendedCount,
      color: m.color,
      audioUrl: m.audioUrl,
    };
    setMantra(result);
    setCount(0);
    setMalas(0);
    setShowLibrary(false);
    setFocus(true);
    audio.tap(soundOn);
  };

  // Today's sadhana — auto-resolves the deity-of-the-day mantra from the
  // weekday calendar. Memoized so the badge text is stable across renders.
  const todaySadhana = useMemo(() => {
    const day = new Date().getDay();
    const entry = WEEKDAY_SADHANA[day];
    if (!entry) return null;
    const m = MANTRA_LIBRARY.find((x) => x.id === entry.mantraId);
    if (!m) return null;
    return { ...entry, mantra: m };
  }, []);

  const filteredLibrary = useMemo(() => {
    const q = librarySearch.trim().toLowerCase();
    return MANTRA_LIBRARY.filter((m) => {
      if (libraryCategory !== "All" && m.category !== libraryCategory) return false;
      if (!q) return true;
      return (
        m.label.toLowerCase().includes(q) ||
        m.transliteration.toLowerCase().includes(q) ||
        m.deity.toLowerCase().includes(q) ||
        m.devanagari.includes(q)
      );
    });
  }, [librarySearch, libraryCategory]);

  // Persist
  useEffect(() => {
    try { if (mantra) localStorage.setItem(STORAGE_KEY, JSON.stringify(mantra)); } catch {}
  }, [mantra]);
  useEffect(() => {
    try { localStorage.setItem(COUNT_KEY, JSON.stringify({ count, malas })); } catch {}
  }, [count, malas]);

  // Restore sadhana + sankalpa on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SADHANA_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<SadhanaStats>;
        const merged: SadhanaStats = { ...DEFAULT_SADHANA, ...parsed };
        // If the streak was last updated more than 1 day ago, the streak is broken.
        if (merged.lastChantDate) {
          const gap = daysBetween(merged.lastChantDate, todayISO());
          if (gap > 1) merged.dailyStreak = 0;
        }
        setSadhana(merged);
      }
      const s = localStorage.getItem(SANKALPA_KEY);
      if (s) setSankalpa(s);
    } catch {}
  }, []);

  useEffect(() => {
    sadhanaRef.current = sadhana;
    try { localStorage.setItem(SADHANA_KEY, JSON.stringify(sadhana)); } catch {}
  }, [sadhana]);

  useEffect(() => {
    try {
      if (sankalpa.trim()) localStorage.setItem(SANKALPA_KEY, sankalpa.trim());
      else localStorage.removeItem(SANKALPA_KEY);
    } catch {}
  }, [sankalpa]);

  // Called whenever a mala completes — updates lifetime stats, daily streak,
  // and mahamala progress. Pure data; no audio/visual side effects.
  const recordMalaComplete = useCallback(() => {
    const cur = sadhanaRef.current;
    const today = todayISO();
    let dailyStreak = cur.dailyStreak;
    if (cur.lastChantDate !== today) {
      const gap = daysBetween(cur.lastChantDate, today);
      if (!cur.lastChantDate || gap > 1) dailyStreak = 1;     // first ever or broken streak
      else if (gap === 1) dailyStreak = cur.dailyStreak + 1;  // consecutive day
      // gap === 0 (same day) is impossible here because lastChantDate !== today
    }
    const longestStreak = Math.max(cur.longestStreak, dailyStreak);

    let mahamalaMalas = cur.mahamalaMalas + 1;
    let mahamalas = cur.mahamalas;
    if (mahamalaMalas >= MAHAMALA_TARGET) {
      mahamalas += 1;
      mahamalaMalas = 0;
      // Celebratory toast — completing a mahamala is a big spiritual milestone
      toast({
        title: "Mahamala complete",
        description: `${MAHAMALA_TARGET * 108} chants offered. May your sankalpa be fulfilled.`,
      });
    }
    setSadhana({
      totalMalas: cur.totalMalas + 1,
      mahamalaMalas,
      mahamalas,
      dailyStreak,
      longestStreak,
      lastChantDate: today,
    });

    // Hook into active guided session, if any. Functional updater so back-to-back
    // mala completions (e.g. chorus interval + manual tap in same tick) compose
    // instead of clobbering each other.
    setActiveSession((sess) => {
      if (!sess) return sess;
      const preset = SESSION_PRESETS.find((p) => p.id === sess.presetId);
      if (!preset) return sess;
      const sameDay = sess.lastChantDate === today;
      const todayMalas = (sameDay ? sess.todayMalas : 0) + 1;
      const malasCompleted = sess.malasCompleted + 1;
      const dayJustCompleted = sameDay
        ? sess.todayMalas < preset.dailyMalas && todayMalas >= preset.dailyMalas
        : todayMalas >= preset.dailyMalas;
      const sessionDone = malasCompleted >= preset.days * preset.dailyMalas;

      if (sessionDone) {
        toast({
          title: `${preset.name} complete`,
          description: `${preset.days * preset.dailyMalas * 108} chants offered. The sankalpa is fulfilled.`,
        });
        return null;
      }
      if (dayJustCompleted) {
        const dayNum = Math.ceil(malasCompleted / preset.dailyMalas);
        toast({
          title: `Day ${dayNum} of ${preset.days} complete`,
          description: `Return tomorrow to continue ${preset.name}.`,
        });
      }
      return { ...sess, malasCompleted, todayMalas, lastChantDate: today };
    });
  }, [toast]);

  // Start a guided session — auto-loads the prescribed mantra
  const startSession = useCallback((preset: SessionPreset) => {
    const m = MANTRA_LIBRARY.find((x) => x.id === preset.mantraId);
    if (m) {
      const result: MantraResult = {
        id: m.id, label: m.label, devanagari: m.devanagari,
        transliteration: m.transliteration, deity: m.deity, meaning: m.meaning,
        recommendedCount: m.recommendedCount, color: m.color, audioUrl: m.audioUrl,
      };
      setMantra(result);
      setCount(0);
      setMalas(0);
    }
    setActiveSession({
      presetId: preset.id,
      startedISO: todayISO(),
      malasCompleted: 0,
      lastChantDate: "",
      todayMalas: 0,
    });
    setShowSessions(false);
    setFocus(true);
    toast({
      title: `${preset.name} started`,
      description: `${preset.dailyMalas} mala${preset.dailyMalas === 1 ? "" : "s"} a day for ${preset.days} days.`,
    });
  }, [toast]);

  const stopSession = useCallback(() => {
    setActiveSession(null);
    toast({ title: "Session ended", description: "Your daily streak and totals stay intact." });
  }, [toast]);

  // Restore active session
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as ActiveSession;
        // Reset todayMalas if we crossed midnight
        if (parsed.lastChantDate && parsed.lastChantDate !== todayISO()) {
          parsed.todayMalas = 0;
        }
        setActiveSession(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    activeSessionRef.current = activeSession;
    try {
      if (activeSession) localStorage.setItem(SESSION_KEY, JSON.stringify(activeSession));
      else localStorage.removeItem(SESSION_KEY);
    } catch {}
  }, [activeSession]);

  // Brahma Muhurta detection — fetch sunrise once/day, recompute "active" each minute.
  // Default coords ~ Varanasi (sacred geographical center for Indian users).
  useEffect(() => {
    let cancelled = false;
    const today = todayISO();

    const computeFromSunrise = (sunriseDate: Date) => {
      setMuhurtaSunrise(sunriseDate);
      const tick = () => {
        if (cancelled) return;
        const now = Date.now();
        const sr = sunriseDate.getTime();
        // Brahma Muhurta: 96 min before sunrise, lasts 48 min → ends 48 min before sunrise
        const start = sr - 96 * 60 * 1000;
        const end = sr - 48 * 60 * 1000;
        setMuhurtaActive(now >= start && now <= end);
      };
      tick();
      const iv = window.setInterval(tick, 60 * 1000);
      timeoutsRef.current.push(iv as unknown as number);
    };

    // Try cache first
    try {
      const cached = localStorage.getItem(MUHURTA_CACHE_KEY);
      if (cached) {
        const c = JSON.parse(cached) as { date: string; sunriseISO: string };
        if (c.date === today && c.sunriseISO) {
          computeFromSunrise(new Date(c.sunriseISO));
          return;
        }
      }
    } catch {}

    // Fetch fresh — default Varanasi coords; sunrise-sunset.org returns UTC ISO
    (async () => {
      try {
        const r = await fetch("https://api.sunrise-sunset.org/json?lat=25.317&lng=83.005&formatted=0");
        const data = await r.json();
        if (cancelled) return;
        const sunrise = new Date(data?.results?.sunrise);
        if (!isNaN(sunrise.getTime())) {
          try {
            localStorage.setItem(MUHURTA_CACHE_KEY, JSON.stringify({ date: today, sunriseISO: sunrise.toISOString() }));
          } catch {}
          computeFromSunrise(sunrise);
        }
      } catch {
        // Fallback: assume sunrise at 5:45 AM local — better than nothing
        const fallback = new Date();
        fallback.setHours(5, 45, 0, 0);
        if (!cancelled) computeFromSunrise(fallback);
      }
    })();

    return () => { cancelled = true; };
  }, []);

  // Breath cycle — 4s inhale, 4s hold, 6s exhale. Pure visual guide.
  useEffect(() => {
    if (!breathOn) {
      setBreathPhase("inhale");
      return;
    }
    let cancelled = false;
    const cycle = () => {
      if (cancelled) return;
      setBreathPhase("inhale");
      const t1 = window.setTimeout(() => {
        if (cancelled) return;
        setBreathPhase("hold");
        const t2 = window.setTimeout(() => {
          if (cancelled) return;
          setBreathPhase("exhale");
          const t3 = window.setTimeout(() => { if (!cancelled) cycle(); }, 6000);
          timeoutsRef.current.push(t3);
        }, 4000);
        timeoutsRef.current.push(t2);
      }, 4000);
      timeoutsRef.current.push(t1);
    };
    cycle();
    return () => { cancelled = true; };
  }, [breathOn]);

  // Wait for SpeechSynthesis voices to load (fires async on most browsers)
  useEffect(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const tryLoad = () => {
      if (window.speechSynthesis.getVoices().length > 0) setVoicesReady(true);
    };
    tryLoad();
    window.speechSynthesis.onvoiceschanged = tryLoad;
    return () => { try { window.speechSynthesis.onvoiceschanged = null as any; } catch {} };
  }, []);

  // Spacebar = tap (only when NOT typing in input)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === " " && mantra) {
        // Spacebar = tap (only when NOT typing in input)
        const t = document.activeElement as HTMLElement | null;
        if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
        e.preventDefault();
        tapInternal();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focus, mantra, count, soundOn, vibeOn]);

  const mood = MOOD[mantra?.color || "gold"];
  const target = mantra?.recommendedCount || 108;
  const progress = Math.min(count / target, 1);

  const reveal = useCallback(async (text: string) => {
    const value = text.trim();
    if (!value) return;
    setLoading(true);
    try {
      const r = await fetch("/api/japa/mantra-assist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: value }),
      });
      const data = await r.json();
      if (!r.ok) {
        toast({ title: "Mantra not found", description: data?.message || "Try a deity name or a known mantra.", variant: "destructive" });
        return;
      }
      setMantra(data);
      setCount(0);
      setMalas(0);
      setFocus(true);
      audio.tap(soundOn);
    } catch {
      toast({ title: "Network hiccup", description: "Please try again.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast, soundOn, audio]);

  // Internal tap that increments count + plays effects but does NOT need an
  // event (used by spacebar shortcut and the auto-chorus interval).
  const tapInternal = useCallback((opts?: { silent?: boolean }) => {
    const m = stateRef.current.mantra;
    if (!m) return;
    setPulse((p) => p + 1);
    const targetN = m.recommendedCount || 108;
    const cur = stateRef.current.count;
    const next = cur + 1;
    const silent = opts?.silent === true;
    if (next >= targetN) {
      // Mala-complete bell still plays even when audio-driven — the temple
      // bell at 108 is part of the experience, not the per-tap click.
      audio.bell(stateRef.current.soundOn);
      vibrate([60, 40, 60, 40, 140], stateRef.current.vibeOn);
      setCount(0);
      const newMalaNumber = stateRef.current.malas + 1;
      setMalas(newMalaNumber);
      recordMalaComplete();
      setCelebrate(true);
      // Capture a snapshot of this mala so the reflection ritual can show
      // the mantra's meaning and let the user log a private note. Opens
      // ~2s after celebrate begins so the sparks finish first.
      const snap: RitualSnapshot = {
        dateISO: new Date().toISOString(),
        mantraId: m.id || slugify(m.label),
        mantraLabel: m.label,
        devanagari: m.devanagari,
        transliteration: m.transliteration,
        meaning: m.meaning,
        sankalpa: stateRef.current.sankalpa || "",
        malaNumber: newMalaNumber,
      };
      const cid = window.setTimeout(() => {
        setCelebrate(false);
        setRitualSnapshot(snap);
        setReflection("");
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== cid);
      }, 2200);
      timeoutsRef.current.push(cid);
    } else {
      // Skip the per-tap wood-block when the recording itself is the chant.
      if (!silent) audio.tap(stateRef.current.soundOn);
      // Mantra-aware haptic: short bija (≤3 syllables) gets a single sharp tap;
      // medium gets the double-thump; long mantras (Mahamrityunjaya, Gayatri)
      // get a longer wave so the body feels the full chant.
      const syllables = countSyllables(m.transliteration || "");
      const pattern: number[] =
        syllables <= 3  ? [34] :
        syllables <= 8  ? [22, 28, 18] :
        syllables <= 16 ? [18, 24, 18, 24, 26] :
                          [16, 22, 16, 22, 16, 22, 28];
      // Soft tactile metronome even when audio-driven, unless fully silent.
      if (!silent) vibrate(pattern, stateRef.current.vibeOn);
      setCount(next);
    }

    // Rhythm guard — track tap-to-tap interval; nudge if too fast 3× in a row.
    const now = Date.now();
    const gap = lastTapTsRef.current ? now - lastTapTsRef.current : Infinity;
    lastTapTsRef.current = now;
    if (gap < 800) {
      fastTapStreakRef.current += 1;
      if (fastTapStreakRef.current >= 3 && !stateRef.current.nudgeShowing) {
        stateRef.current.nudgeShowing = true;
        setRhythmNudge(true);
        const nid = window.setTimeout(() => {
          setRhythmNudge(false);
          stateRef.current.nudgeShowing = false;
          fastTapStreakRef.current = 0;
          timeoutsRef.current = timeoutsRef.current.filter((t) => t !== nid);
        }, 2400);
        timeoutsRef.current.push(nid);
      }
    } else if (gap > 1500) {
      fastTapStreakRef.current = 0;
    }
  }, [audio, recordMalaComplete]);

  const tap = useCallback((e?: React.MouseEvent | React.TouchEvent) => {
    if (!mantra) return;
    const targetEl = e?.currentTarget as HTMLElement | undefined;
    let x = 50, y = 50;
    if (targetEl) {
      const rect = targetEl.getBoundingClientRect();
      let px = rect.width / 2, py = rect.height / 2;
      const mEv = e as React.MouseEvent;
      const tEv = e as React.TouchEvent;
      if (mEv && typeof mEv.clientX === "number") {
        px = mEv.clientX - rect.left; py = mEv.clientY - rect.top;
      } else if (tEv && tEv.touches && tEv.touches[0]) {
        px = tEv.touches[0].clientX - rect.left; py = tEv.touches[0].clientY - rect.top;
      }
      x = (px / rect.width) * 100; y = (py / rect.height) * 100;
    }
    const id = ++rippleId.current;
    setRipples((r) => [...r, { id, x, y }]);
    const rid = window.setTimeout(() => {
      setRipples((r) => r.filter((rp) => rp.id !== id));
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== rid);
    }, 900);
    timeoutsRef.current.push(rid);

    // Mystic spark burst — 10 particles fly outward from the tap point.
    const sparkBatch: Spark[] = [];
    const N = 10;
    for (let i = 0; i < N; i++) {
      const baseAngle = (i / N) * 360;
      const jitter = (Math.random() - 0.5) * 22;
      const dist = 60 + Math.random() * 50;
      const hue = (i % 3 === 0 ? "gold" : i % 3 === 1 ? "saffron" : "white") as Spark["hue"];
      sparkBatch.push({ id: ++rippleId.current, x, y, angle: baseAngle + jitter, dist, hue });
    }
    setSparks((s) => [...s, ...sparkBatch]);
    const sids = sparkBatch.map((sp) => sp.id);
    const stid = window.setTimeout(() => {
      setSparks((s) => s.filter((sp) => !sids.includes(sp.id)));
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== stid);
    }, 950);
    timeoutsRef.current.push(stid);

    // Rising floater — devanagari "Om" glyph that drifts up and fades.
    const fid = ++rippleId.current;
    setFloaters((f) => [...f, { id: fid, x, y, glyph: "ॐ" }]);
    const ftid = window.setTimeout(() => {
      setFloaters((f) => f.filter((ff) => ff.id !== fid));
      timeoutsRef.current = timeoutsRef.current.filter((t) => t !== ftid);
    }, 1100);
    timeoutsRef.current.push(ftid);

    tapInternal();
  }, [mantra, tapInternal]);

  // Sage Chorus: layer 2-4 voices speaking the transliteration with varied
  // pitch/rate and 0-180ms stagger. Each tick also auto-increments the
  // counter so the user can sit back and observe.
  const speakChorus = useCallback(() => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    const m = stateRef.current.mantra;
    if (!m) return;
    const text = m.transliteration || m.label || "Om";
    const voices = pickSageVoices(4);
    const layers = voices.length > 0 ? voices : [null];
    layers.forEach((v, i) => {
      const u = new SpeechSynthesisUtterance(text);
      if (v) u.voice = v;
      // Vary pitch + rate per voice so it sounds like several sages, not one
      // person in a delay loop.
      u.pitch = [0.55, 0.8, 1.05, 1.2][i] ?? 0.9;
      u.rate  = [0.7, 0.85, 0.95, 0.8][i] ?? 0.85;
      u.volume = i === 0 ? 0.95 : 0.55 - i * 0.1;
      const delay = i * 110 + Math.random() * 40;
      const tid = window.setTimeout(() => {
        try { window.speechSynthesis.speak(u); } catch {}
        timeoutsRef.current = timeoutsRef.current.filter((t) => t !== tid);
      }, delay);
      timeoutsRef.current.push(tid);
    });
    tapInternal();
  }, [tapInternal]);

  // Start/stop chorus loop. Drone is now managed by its own effect below
  // so the user can keep the sruti playing after the chorus stops.
  useEffect(() => {
    if (chorusOn && mantra) {
      // Speak immediately, then on interval
      speakChorus();
      const id = window.setInterval(speakChorus, Math.max(1200, speedMs));
      chorusIntervalRef.current = id as unknown as number;
      return () => {
        clearInterval(id);
        chorusIntervalRef.current = null;
        try { window.speechSynthesis.cancel(); } catch {}
      };
    } else {
      try { window.speechSynthesis?.cancel(); } catch {}
    }
  }, [chorusOn, speedMs, mantra, speakChorus]);

  // Sruti drone manager — runs whenever the user toggles the drone OR when
  // the chorus is active (the chorus needs the temple-hall feel under it).
  // Restarts cleanly when the key changes.
  useEffect(() => {
    const wantDrone = droneOn || chorusOn;
    if (!wantDrone) { audio.stopDrone(); return; }
    audio.stopDrone();
    audio.startDrone(KEY_TO_HZ[droneKey] ?? 110);
    return () => { audio.stopDrone(); };
  }, [droneOn, chorusOn, droneKey, audio]);

  // Mic listener — opt-in voice-presence detector. Streams audio from the
  // mic into a local AnalyserNode, never to the network. Updates voiceLevel
  // ~12 Hz so the React render loop stays cheap.
  const stopMic = useCallback(() => {
    if (micRafRef.current != null) cancelAnimationFrame(micRafRef.current);
    micRafRef.current = null;
    try { micAnalyserRef.current?.disconnect(); } catch {}
    micAnalyserRef.current = null;
    if (micStreamRef.current) {
      try { micStreamRef.current.getTracks().forEach((t) => t.stop()); } catch {}
      micStreamRef.current = null;
    }
    if (micCtxRef.current) {
      try { micCtxRef.current.close(); } catch {}
      micCtxRef.current = null;
    }
    voiceLevelSmoothRef.current = 0;
    setVoiceLevel(0);
  }, []);

  useEffect(() => {
    if (!micOn) { stopMic(); return; }
    let cancelled = false;
    const start = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: false },
          video: false,
        });
        if (cancelled) { stream.getTracks().forEach((t) => t.stop()); return; }
        const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
        const ctx: AudioContext = new Ctx();
        const src = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 1024;
        analyser.smoothingTimeConstant = 0.6;
        src.connect(analyser);
        micStreamRef.current = stream;
        micCtxRef.current = ctx;
        micAnalyserRef.current = analyser;
        const buf = new Uint8Array(analyser.fftSize);
        const tick = () => {
          if (!micAnalyserRef.current) return;
          micAnalyserRef.current.getByteTimeDomainData(buf);
          // RMS over the buffer, normalized 0..1
          let sum = 0;
          for (let i = 0; i < buf.length; i++) {
            const v = (buf[i] - 128) / 128;
            sum += v * v;
          }
          const rms = Math.sqrt(sum / buf.length);
          // Map ~0.02..0.25 → 0..1 (typical chant range, ignores room hiss)
          const norm = Math.max(0, Math.min(1, (rms - 0.02) / (0.25 - 0.02)));
          // Smooth the meter so it floats instead of jittering
          const prev = voiceLevelSmoothRef.current;
          const next = prev * 0.7 + norm * 0.3;
          voiceLevelSmoothRef.current = next;
          // Throttle React state updates to ~12 Hz
          const now = performance.now();
          if (now - lastMicSetTsRef.current > 80) {
            lastMicSetTsRef.current = now;
            setVoiceLevel(next);
          }
          micRafRef.current = requestAnimationFrame(tick);
        };
        micRafRef.current = requestAnimationFrame(tick);
        toast({
          title: "Listening for your chant",
          description: "Audio stays on this device — never sent anywhere.",
        });
      } catch (err: any) {
        setMicOn(false);
        toast({
          title: "Mic unavailable",
          description: err?.message || "Grant microphone permission to enable voice detection.",
          variant: "destructive",
        });
      }
    };
    start();
    return () => { cancelled = true; stopMic(); };
  }, [micOn, stopMic, toast]);

  // Cancel any pending loop-gap timer on unmount so React doesn't hold a
  // dangling setTimeout into a torn-down component.
  useEffect(() => () => {
    if (loopGapTimerRef.current != null) window.clearTimeout(loopGapTimerRef.current);
  }, []);

  // Persist sruti preferences across reloads.
  useEffect(() => {
    try {
      const raw = localStorage.getItem("mantra-counter:drone");
      if (raw) {
        const v = JSON.parse(raw) as { on?: boolean; key?: string };
        if (typeof v.on === "boolean") setDroneOn(v.on);
        if (typeof v.key === "string" && KEY_TO_HZ[v.key] != null) setDroneKey(v.key);
      }
    } catch {}
  }, []);
  useEffect(() => {
    try {
      localStorage.setItem("mantra-counter:drone", JSON.stringify({ on: droneOn, key: droneKey }));
    } catch {}
  }, [droneOn, droneKey]);

  const reset = () => { setCount(0); };
  const change = () => {
    setChorusOn(false);
    setMantra(null); setCount(0); setMalas(0); setInput("");
  };

  // Petal positions on the ring around the lotus
  const beads = useMemo(() => {
    const arr: { x: number; y: number; lit: boolean }[] = [];
    const N = 36;
    for (let i = 0; i < N; i++) {
      const a = (i / N) * Math.PI * 2 - Math.PI / 2;
      const lit = (i / N) < progress;
      arr.push({ x: 50 + Math.cos(a) * 44, y: 50 + Math.sin(a) * 44, lit });
    }
    return arr;
  }, [progress]);

  // ===== Render helpers =====

  const InputForm = (
    <form
      className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto w-full"
      onSubmit={(e) => { e.preventDefault(); reveal(input); }}
    >
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="e.g. Om Namah Shivaya, Ganesha, peace of mind"
        className={focus
          ? "flex-1 bg-white/10 border-white/30 placeholder:text-white/60 text-white focus-visible:ring-[#D4AF37]"
          : "flex-1 bg-white border-[#D4AF37]/40 focus-visible:ring-[#D4AF37] text-[#4a1a22]"}
        data-testid="input-mantra"
        maxLength={200}
      />
      <Button
        type="submit"
        disabled={loading || input.trim().length < 2}
        className="bg-[#6D2B35] hover:bg-[#4a1a22] text-white"
        data-testid="button-reveal-mantra"
      >
        {loading ? (
          <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Revealing</>
        ) : (
          <><Wand2 className="h-4 w-4 mr-1.5" /> Reveal mantra</>
        )}
      </Button>
    </form>
  );

  const Suggestions = (
    <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 max-w-xl mx-auto">
      <span className={`text-[11px] uppercase tracking-[0.22em] mr-1 ${focus ? "text-[#D4AF37]" : "text-[#6D2B35]/60"}`}>Try</span>
      {SUGGESTIONS.map((s) => (
        <button
          key={s}
          type="button"
          onClick={() => { setInput(s); reveal(s); }}
          className={focus
            ? "text-[11px] md:text-xs rounded-full border border-white/30 bg-white/10 px-2.5 py-1 text-white hover-elevate active-elevate-2"
            : "text-[11px] md:text-xs rounded-full border border-[#D4AF37]/40 bg-white/80 px-2.5 py-1 text-[#6D2B35] hover-elevate active-elevate-2"}
          data-testid={`chip-suggest-${s.toLowerCase().replace(/[^a-z]+/g, "-")}`}
        >
          {s}
        </button>
      ))}
      <button
        type="button"
        onClick={() => setShowLibrary(true)}
        className={focus
          ? "text-[11px] md:text-xs rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-2.5 py-1 text-[#FFE9A8] font-semibold hover-elevate active-elevate-2 inline-flex items-center gap-1"
          : "text-[11px] md:text-xs rounded-full border border-[#D4AF37]/60 bg-[#D4AF37]/15 px-2.5 py-1 text-[#6D2B35] font-semibold hover-elevate active-elevate-2 inline-flex items-center gap-1"}
        data-testid="chip-open-library"
      >
        <Library className="h-3 w-3" /> Browse 30 mantras
      </button>
    </div>
  );

  const LibraryPanel = showLibrary && (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-label="Mantra library"
      onClick={() => setShowLibrary(false)}
      data-testid="modal-library"
    >
      <div
        className="bg-[#FFFAEC] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border border-[#D4AF37]/40 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4AF37]/30">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">Mantra Library</div>
            <h3 className="font-serif text-lg md:text-xl text-[#4a1a22]">30 Sacred Mantras · Tap to begin</h3>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setShowLibrary(false)} data-testid="button-close-library">
            <X className="h-4 w-4 text-[#6D2B35]" />
          </Button>
        </div>
        <div className="px-4 py-3 border-b border-[#D4AF37]/20 space-y-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[#6D2B35]/40" />
            <Input
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder="Search mantra, deity, or transliteration"
              className="pl-8 bg-white border-[#D4AF37]/40 text-[#4a1a22]"
              data-testid="input-library-search"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {(["All", ...LIBRARY_CATEGORIES] as const).map((c) => (
              <button
                key={c}
                onClick={() => setLibraryCategory(c)}
                className={`text-[10px] uppercase tracking-[0.2em] rounded-full border px-2 py-1 hover-elevate active-elevate-2 ${
                  libraryCategory === c
                    ? "bg-[#6D2B35] text-white border-[#6D2B35]"
                    : "bg-white text-[#6D2B35] border-[#D4AF37]/40"
                }`}
                data-testid={`button-cat-${c.toLowerCase()}`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-2">
          {filteredLibrary.length === 0 ? (
            <div className="text-center text-sm text-[#6D2B35]/60 py-8">No mantras match.</div>
          ) : (
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {filteredLibrary.map((m) => (
                <li key={m.id}>
                  <button
                    onClick={() => pickFromLibrary(m)}
                    className="w-full text-left rounded-lg border border-[#D4AF37]/30 bg-white px-3 py-2.5 hover-elevate active-elevate-2"
                    data-testid={`button-pick-${m.id}`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-sm text-[#4a1a22] truncate">{m.label}</span>
                      <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37] shrink-0">{m.category}</span>
                    </div>
                    <div className="mt-1 font-serif text-base text-[#6D2B35] truncate" lang="sa">{m.devanagari}</div>
                    <div className="mt-0.5 text-[11px] text-[#6D2B35]/70 italic truncate">{m.transliteration}</div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-[#6D2B35]/60">
                      <span>{m.deity}</span>
                      <span>·</span>
                      <span>{m.recommendedCount} count</span>
                      {m.audioUrl && (
                        <>
                          <span>·</span>
                          <span className="inline-flex items-center gap-0.5 text-[#D4AF37]"><Music className="h-2.5 w-2.5" /> audio</span>
                        </>
                      )}
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="px-4 py-2 border-t border-[#D4AF37]/20 text-[10px] text-[#6D2B35]/60 text-center">
          Don't see your mantra? Type it above and the AI will reveal it.
        </div>
      </div>
    </div>
  );

  const SessionsPanel = showSessions && (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-label="Guided sessions"
      onClick={() => setShowSessions(false)}
      data-testid="modal-sessions"
    >
      <div
        className="bg-[#FFFAEC] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border border-[#D4AF37]/40 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4AF37]/30">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">Guided Sadhana</div>
            <h3 className="font-serif text-lg md:text-xl text-[#4a1a22]">Classical multi-day programs</h3>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setShowSessions(false)} data-testid="button-close-sessions">
            <X className="h-4 w-4 text-[#6D2B35]" />
          </Button>
        </div>

        {activeSession && (() => {
          const preset = SESSION_PRESETS.find((p) => p.id === activeSession.presetId);
          if (!preset) return null;
          const dayNum = Math.min(preset.days, Math.floor(activeSession.malasCompleted / preset.dailyMalas) + 1);
          const todayDone = activeSession.todayMalas >= preset.dailyMalas;
          const totalTarget = preset.days * preset.dailyMalas;
          const pct = Math.round((activeSession.malasCompleted / totalTarget) * 100);
          return (
            <div className="px-4 py-3 bg-gradient-to-br from-[#FFFAEC] to-[#FFE9A8]/40 border-b border-[#D4AF37]/30">
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#3F7D5A] font-semibold">Active Session</div>
                <Button size="sm" variant="ghost" onClick={stopSession} className="text-[#6D2B35] hover:text-[#4a1a22]" data-testid="button-stop-session">
                  End session
                </Button>
              </div>
              <div className="font-serif text-lg text-[#4a1a22]">{preset.name}</div>
              <div className="mt-1 text-xs text-[#6D2B35]/70">{preset.description}</div>
              <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-white border border-[#D4AF37]/30 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#6D2B35]/60">Day</div>
                  <div className="font-serif text-xl text-[#4a1a22] tabular-nums" data-testid="text-session-day">{dayNum}<span className="text-sm text-[#6D2B35]/50">/{preset.days}</span></div>
                </div>
                <div className="rounded-lg bg-white border border-[#D4AF37]/30 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#6D2B35]/60">Today</div>
                  <div className="font-serif text-xl text-[#4a1a22] tabular-nums">{activeSession.todayMalas}<span className="text-sm text-[#6D2B35]/50">/{preset.dailyMalas}</span></div>
                  {todayDone && <div className="text-[9px] uppercase tracking-[0.2em] text-[#3F7D5A] font-semibold">Complete</div>}
                </div>
                <div className="rounded-lg bg-white border border-[#D4AF37]/30 px-2 py-2">
                  <div className="text-[9px] uppercase tracking-[0.2em] text-[#6D2B35]/60">Overall</div>
                  <div className="font-serif text-xl text-[#4a1a22] tabular-nums">{pct}%</div>
                </div>
              </div>
              <div className="mt-2 h-1.5 bg-[#D4AF37]/15 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FF9933]"
                  style={{ width: `${pct}%`, transition: "width 600ms ease-out" }}
                />
              </div>
            </div>
          );
        })()}

        <div className="flex-1 overflow-y-auto px-3 py-3">
          <ul className="space-y-2">
            {SESSION_PRESETS.map((p) => {
              const isActive = activeSession?.presetId === p.id;
              return (
                <li key={p.id}>
                  <button
                    onClick={() => startSession(p)}
                    className={`w-full text-left rounded-lg border px-3 py-3 hover-elevate active-elevate-2 ${
                      isActive
                        ? "border-[#3F7D5A]/60 bg-[#CDEAC0]/40"
                        : "border-[#D4AF37]/30 bg-white"
                    }`}
                    data-testid={`button-session-${p.id}`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-semibold text-sm text-[#4a1a22]">{p.name}</span>
                      <span className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] font-semibold shrink-0">
                        <Calendar className="h-3 w-3" /> {p.days}d × {p.dailyMalas} mala
                      </span>
                    </div>
                    <div className="text-[11px] text-[#6D2B35]/70">{p.description}</div>
                    <div className="mt-1 text-[10px] uppercase tracking-[0.22em] text-[#6D2B35]/50">
                      {p.deity} · {p.days * p.dailyMalas * 108} chants total
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="px-4 py-2 border-t border-[#D4AF37]/20 text-[10px] text-[#6D2B35]/60 text-center">
          A guided session auto-loads its mantra and tracks your daily commitment.
        </div>
      </div>
    </div>
  );

  const LOOP_OPTIONS: { label: string; value: number }[] = [
    { label: "1×",   value: 1 },
    { label: "27×",  value: 27 },
    { label: "54×",  value: 54 },
    { label: "108×", value: 108 },
    { label: "∞",    value: 0 },
  ];

  const AudioPlayer = mantra && (
    <div className="mt-3 flex flex-col items-center gap-2">
      {effectiveAudioUrl ? (
        <div className="inline-flex flex-wrap items-center justify-center gap-2 rounded-full border border-[#D4AF37]/50 bg-black/30 backdrop-blur px-3 py-1.5">
          <Button
            size="sm"
            variant="ghost"
            onClick={toggleAudio}
            className="text-[#FFE9A8] hover:text-white h-7 px-2"
            data-testid="button-toggle-recorded-audio"
          >
            {audioPlaying ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
            <Music className="h-3.5 w-3.5 mr-1" />
            {audioPlaying ? "Pause" : "Play"}
          </Button>
          {audioPlaying && (
            <span
              className="text-[11px] tabular-nums text-[#FFE9A8] font-semibold"
              data-testid="text-loop-progress"
              aria-live="polite"
            >
              {loopPlays}{loopTarget === 0 ? "" : ` / ${loopTarget}`}
            </span>
          )}
          <button
            type="button"
            onClick={() => setShowAudioInput((v) => !v)}
            className="text-[10px] uppercase tracking-[0.22em] text-[#FFE9A8]/70 hover:text-white"
            data-testid="button-edit-audio"
          >
            Change
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setShowAudioInput((v) => !v)}
          className="text-[11px] uppercase tracking-[0.22em] text-[#D4AF37] hover:text-white inline-flex items-center gap-1"
          data-testid="button-add-audio"
        >
          <Music className="h-3 w-3" /> Add a recording — upload or paste URL
        </button>
      )}

      {effectiveAudioUrl && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/60 mr-1">Repeat</span>
          {LOOP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => { setLoopTarget(opt.value); setLoopPlays(0); }}
              className={`text-[11px] rounded-full border px-2.5 py-0.5 hover-elevate active-elevate-2 ${
                loopTarget === opt.value
                  ? "bg-[#D4AF37] text-[#2A0F18] border-[#D4AF37] font-semibold"
                  : "bg-black/30 text-[#FFE9A8] border-[#D4AF37]/40"
              }`}
              data-testid={`chip-loop-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
          <label
            className={`text-[11px] inline-flex items-center gap-1 cursor-pointer rounded-full border px-2.5 py-0.5 hover-elevate active-elevate-2 ${
              autoCountOnLoop
                ? "bg-[#3F7D5A]/30 text-[#CDEAC0] border-[#3F7D5A]/60"
                : "bg-black/30 text-[#FFE9A8]/70 border-white/20"
            }`}
            title="Each completed playthrough advances the bead counter so the recording itself becomes the chant."
            data-testid="toggle-auto-count"
          >
            <input
              type="checkbox"
              checked={autoCountOnLoop}
              onChange={(e) => setAutoCountOnLoop(e.target.checked)}
              className="sr-only"
            />
            <Target className="h-3 w-3" /> Count beads
          </label>
        </div>
      )}

      {effectiveAudioUrl && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 max-w-md">
          <span className="text-[10px] uppercase tracking-[0.22em] text-white/60 mr-1">Gap</span>
          {[
            { label: "None", value: 0 },
            { label: "1s",   value: 1000 },
            { label: "3s",   value: 3000 },
            { label: "5s",   value: 5000 },
          ].map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setLoopGapMs(opt.value)}
              className={`text-[11px] rounded-full border px-2.5 py-0.5 hover-elevate active-elevate-2 ${
                loopGapMs === opt.value
                  ? "bg-[#D4AF37] text-[#2A0F18] border-[#D4AF37] font-semibold"
                  : "bg-black/30 text-[#FFE9A8] border-[#D4AF37]/40"
              }`}
              data-testid={`chip-gap-${opt.value}`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      )}

      {showAudioInput && (
        <div className="w-full max-w-md flex flex-col gap-1.5">
          <div className="flex gap-1.5">
            <Input
              value={audioOverride.startsWith("blob:") ? "" : audioOverride}
              onChange={(e) => setAudioOverride(e.target.value)}
              placeholder="Paste MP3/OGG URL — or upload a file →"
              className="flex-1 bg-white/10 border-white/30 text-white placeholder:text-white/50 text-xs"
              data-testid="input-audio-url"
            />
            <Button
              size="sm"
              onClick={() => audioFileInputRef.current?.click()}
              variant="outline"
              className="border-white/30 bg-black/30 text-white hover:bg-black/40"
              data-testid="button-upload-audio"
            >
              Upload
            </Button>
            <input
              ref={audioFileInputRef}
              type="file"
              accept="audio/*"
              className="hidden"
              onChange={handleAudioFile}
              data-testid="input-audio-file"
            />
            <Button
              size="sm"
              onClick={() => {
                // Persist a regular URL to localStorage; skip persistence for blob: (per-session only).
                if (!audioOverride.startsWith("blob:")) saveAudioOverride(audioOverride);
                setShowAudioInput(false);
              }}
              className="bg-[#D4AF37] text-[#2A0F18] hover:bg-[#E8C75A]"
              data-testid="button-save-audio"
            >
              Save
            </Button>
            {audioOverride && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  if (blobUrlRef.current) { try { URL.revokeObjectURL(blobUrlRef.current); } catch {} blobUrlRef.current = null; }
                  saveAudioOverride("");
                  setAudioOverride("");
                  setShowAudioInput(false);
                }}
                className="border-white/30 bg-black/30 text-white hover:bg-black/40"
                data-testid="button-clear-audio"
              >
                Clear
              </Button>
            )}
          </div>
          <p className="text-[10px] text-white/50 text-center">
            Upload your own recording, or paste a CORS-enabled MP3/OGG URL.
            Uploads play this session only; URLs are saved per-mantra in this browser.
          </p>
        </div>
      )}
      {audioError && (
        <p className="text-[10px] text-red-300 text-center max-w-md">
          {audioError}
        </p>
      )}
      {effectiveAudioUrl && (
        <audio
          ref={audioElRef}
          src={effectiveAudioUrl}
          preload="none"
          crossOrigin="anonymous"
          onPlay={() => setAudioPlaying(true)}
          onPause={() => setAudioPlaying(false)}
          onEnded={() => {
            // One full playthrough finished. Increment loop counter, optionally
            // advance the bead, then either replay (after the configured gap)
            // or stop based on loopTarget.
            setLoopPlays((prev) => {
              const next = prev + 1;
              if (autoCountOnLoop) tapInternal({ silent: true });
              const shouldReplay = loopTarget === 0 || next < loopTarget;
              if (shouldReplay) {
                const replay = () => {
                  loopGapTimerRef.current = null;
                  const el = audioElRef.current;
                  if (!el) return;
                  try { el.currentTime = 0; } catch {}
                  el.play().catch(() => { setAudioPlaying(false); });
                };
                if (loopGapMs > 0) {
                  if (loopGapTimerRef.current != null) window.clearTimeout(loopGapTimerRef.current);
                  loopGapTimerRef.current = window.setTimeout(replay, loopGapMs);
                } else {
                  replay();
                }
              } else {
                setAudioPlaying(false);
              }
              return next;
            });
          }}
          onError={() => { setAudioPlaying(false); setAudioError("Audio failed to load. Check the URL or that the host allows CORS."); }}
        />
      )}
    </div>
  );

  // ===== APP PANEL — renders as a tall, app-like card embedded in the page =====
  const Stage = (
    <div
      className="relative rounded-2xl sm:rounded-[28px] overflow-hidden border border-[#D4AF37]/40 shadow-[0_24px_70px_-20px_rgba(0,0,0,0.55)] min-h-[560px] sm:min-h-[680px] md:min-h-[760px]"
      data-testid="mystic-stage"
      role="region"
      aria-label="Mystic Mantra Counter"
    >
      {/* Layered cosmic backdrop */}
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(60% 40% at 50% 0%, rgba(${mood.glow}, 0.35), transparent 70%),
            radial-gradient(80% 60% at 50% 100%, rgba(${mood.glow}, 0.18), transparent 70%),
            linear-gradient(180deg, #1A0A0E 0%, #2A0F18 50%, #1A0A0E 100%)
          `,
        }}
      />
      {/* Slow rotating mandala */}
      <div aria-hidden className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-25">
        <svg viewBox="0 0 200 200" className="w-[min(95%,720px)] h-[min(95%,720px)] animate-[vt-spin_120s_linear_infinite]">
          {Array.from({ length: 24 }).map((_, i) => (
            <ellipse
              key={i}
              cx="100" cy="40" rx="3" ry="60"
              fill="none"
              stroke="#D4AF37"
              strokeWidth="0.5"
              transform={`rotate(${i * 15} 100 100)`}
            />
          ))}
          <circle cx="100" cy="100" r="20" fill="none" stroke="#D4AF37" strokeWidth="0.6" />
          <circle cx="100" cy="100" r="40" fill="none" stroke="#D4AF37" strokeWidth="0.4" />
          <circle cx="100" cy="100" r="60" fill="none" stroke="#D4AF37" strokeWidth="0.3" />
        </svg>
      </div>
      {/* Drifting sparkles */}
      <div aria-hidden className="absolute inset-0 pointer-events-none">
        {Array.from({ length: 22 }).map((_, i) => (
          <span
            key={i}
            className="absolute rounded-full"
            style={{
              left: `${(i * 37) % 100}%`,
              top: `${(i * 53) % 100}%`,
              width: 2 + (i % 3), height: 2 + (i % 3),
              background: i % 3 === 0 ? "#D4AF37" : i % 3 === 1 ? "#FF9933" : "#FFFAEC",
              opacity: 0.5,
              animation: `vt-drift ${8 + (i % 6)}s ease-in-out ${i * 0.2}s infinite alternate`,
            }}
          />
        ))}
      </div>

      {/* Top toolbar */}
      <div className="relative z-10 flex items-center justify-between gap-2 flex-wrap px-3 sm:px-4 md:px-8 pt-3 sm:pt-4 md:pt-6">
        <div className="inline-flex items-center gap-2 flex-wrap">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#D4AF37]/50 bg-black/30 backdrop-blur px-3 py-1 text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#FFE9A8] font-semibold">
            <Sparkles className="h-3 w-3 text-[#D4AF37]" /> Mystic Counter
          </div>
          {muhurtaActive && (
            <div
              className="inline-flex items-center gap-1.5 rounded-full border border-[#FF9933]/70 bg-gradient-to-r from-[#FF9933]/20 to-[#D4AF37]/20 backdrop-blur px-3 py-1 text-[10px] md:text-[11px] uppercase tracking-[0.28em] text-[#FFE9A8] font-semibold animate-pulse"
              data-testid="badge-muhurta"
              title="Brahma Muhurta — the sacred 48-min window before sunrise"
            >
              <Sun className="h-3 w-3 text-[#FF9933]" /> Brahma Muhurta · auspicious now
            </div>
          )}
          {!muhurtaActive && muhurtaSunrise && (
            <div
              className="hidden md:inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-black/20 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.28em] text-white/60"
              title="Today's sunrise — Brahma Muhurta starts 96 min earlier and lasts 48 min"
            >
              <Sun className="h-3 w-3" /> Sunrise {muhurtaSunrise.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowJournal(true)}
            className="border-[#D4AF37]/50 bg-black/30 backdrop-blur text-[#FFE9A8] hover:text-white"
            data-testid="button-open-journal"
          >
            <BookOpen className="h-4 w-4 mr-1" />
            Journal
            {journal.length > 0 && (
              <span className="ml-1.5 inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-[#D4AF37] text-[#4a1a22] text-[10px] font-bold">
                {journal.length}
              </span>
            )}
          </Button>
          {mantra && (
            <Button
              size="sm"
              variant="outline"
              onClick={change}
              className="border-[#D4AF37]/50 bg-black/30 backdrop-blur text-[#FFE9A8] hover:text-white"
              data-testid="button-change-mantra"
            >
              <RotateCcw className="h-4 w-4 mr-1" /> Change mantra
            </Button>
          )}
        </div>
      </div>

      {/* Main stage content */}
      <div className="relative z-10 flex flex-col items-center justify-center px-3 sm:px-4 md:px-8 py-6 sm:py-8 md:py-12">
        {!mantra ? (
          <div className="w-full max-w-xl text-center">
            <h3 className="font-serif text-3xl md:text-5xl text-white leading-tight tracking-tight">
              Type any mantra. <span className="italic font-semibold saffron-shimmer">We will reveal it.</span>
            </h3>
            <p className="mt-3 text-sm text-white/70">
              Write a mantra you remember, a deity's name, or your intention.
            </p>

            {todaySadhana && (
              <button
                type="button"
                onClick={() => pickFromLibrary(todaySadhana.mantra)}
                className="mt-5 w-full text-left rounded-2xl border border-[#D4AF37]/50 bg-gradient-to-br from-[#D4AF37]/15 via-black/30 to-[#FF9933]/10 backdrop-blur px-4 py-3 hover-elevate active-elevate-2 group"
                data-testid="banner-today-sadhana"
                title={todaySadhana.reason}
              >
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.28em] text-[#FFE9A8] font-semibold">
                    <Sun className="h-3 w-3 text-[#FF9933]" />
                    Today is {todaySadhana.weekday} · {todaySadhana.deity}'s day
                  </div>
                  <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] group-hover:text-white">
                    Begin sadhana ›
                  </span>
                </div>
                <div className="mt-2 font-serif text-xl md:text-2xl text-white saffron-shimmer truncate" lang="sa">
                  {todaySadhana.mantra.devanagari}
                </div>
                <div className="mt-1 text-xs text-white/70 italic truncate">
                  {todaySadhana.mantra.transliteration}
                </div>
                <div className="mt-2 text-[11px] text-white/60 leading-snug">
                  {todaySadhana.reason}
                </div>
              </button>
            )}

            <div className="mt-6">{InputForm}</div>
            {Suggestions}
          </div>
        ) : (
          <>
            {/* Sankalpa — set your intention before chanting */}
            <div className="w-full max-w-xl mb-5">
              <label className="flex items-center justify-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#D4AF37]/90 font-semibold mb-2">
                <Heart className="h-3 w-3" /> Sankalpa · your offering
              </label>
              <Input
                value={sankalpa}
                onChange={(e) => setSankalpa(e.target.value.slice(0, 140))}
                placeholder="e.g. For my mother's healing · For peace at home · For clarity"
                className="bg-white/10 border-white/30 placeholder:text-white/50 text-white text-center text-sm md:text-base focus-visible:ring-[#D4AF37]"
                data-testid="input-sankalpa"
                maxLength={140}
              />
            </div>

            {/* Mantra header — floats above the lotus */}
            <div className="text-center mb-6 max-w-2xl">
              <div className="text-[10px] uppercase tracking-[0.32em] text-[#D4AF37] font-semibold">
                {mantra.deity}
              </div>
              <div
                className="mt-2 font-serif text-3xl md:text-5xl leading-snug saffron-shimmer"
                lang="sa"
                data-testid="text-devanagari"
              >
                {mantra.devanagari}
              </div>
              {mantra.transliteration && (
                <div className="mt-2 text-base md:text-lg italic text-white/80">
                  {mantra.transliteration}
                </div>
              )}
              <div className="mt-2 text-xs md:text-sm text-white/60 max-w-xl mx-auto">
                {mantra.meaning}
              </div>
            </div>

            {/* Counter */}
            <div className="relative flex flex-col items-center">
              <div
                aria-hidden
                className="pointer-events-none absolute -inset-10 rounded-full blur-3xl opacity-80"
                style={{
                  background: `radial-gradient(closest-side, rgba(${mood.glow}, 0.55), transparent 70%)`,
                  transform: celebrate ? "scale(1.2)" : chorusOn ? "scale(1.05)" : "scale(1)",
                  transition: "transform 600ms ease-out",
                  animation: chorusOn ? "vt-breathe 4s ease-in-out infinite" : undefined,
                }}
              />

              {/* Breath ring — scales with inhale/hold/exhale to guide the user's breath */}
              {breathOn && (
                <>
                  <div
                    aria-hidden
                    className="pointer-events-none absolute inset-0 flex items-center justify-center"
                  >
                    <div
                      className="rounded-full border-2"
                      style={{
                        width: "92vmin",
                        height: "92vmin",
                        maxWidth: 560,
                        maxHeight: 560,
                        borderColor: "rgba(63, 125, 90, 0.55)",
                        boxShadow: "0 0 60px rgba(63,125,90,0.35), inset 0 0 40px rgba(63,125,90,0.25)",
                        transform:
                          breathPhase === "inhale" ? "scale(1.0)" :
                          breathPhase === "hold"   ? "scale(1.05)" :
                                                     "scale(0.78)",
                        transition: `transform ${breathPhase === "inhale" ? 4000 : breathPhase === "hold" ? 4000 : 6000}ms ease-in-out`,
                      }}
                    />
                  </div>
                  <div
                    className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 inline-flex items-center gap-2 rounded-full border border-[#3F7D5A]/60 bg-black/40 backdrop-blur px-3 py-1 text-[10px] uppercase tracking-[0.32em] text-[#CDEAC0] font-semibold"
                    data-testid="text-breath-phase"
                  >
                    <Wind className="h-3 w-3" />
                    {breathPhase === "inhale" ? "Inhale" : breathPhase === "hold" ? "Hold" : "Exhale"}
                  </div>
                </>
              )}

              <div className="relative w-[min(80vw,460px)] h-[min(80vw,460px)] sm:w-[min(70vw,460px)] sm:h-[min(70vw,460px)] md:w-[460px] md:h-[460px]">
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <defs>
                    <linearGradient id="vt-mystic-grad-stage" x1="0" y1="0" x2="1" y2="1">
                      <stop offset="0%" stopColor={mood.from} />
                      <stop offset="100%" stopColor={mood.to} />
                    </linearGradient>
                  </defs>
                  <circle cx="50" cy="50" r="46" fill="none" stroke="rgba(212,175,55,0.22)" strokeWidth="1.4" />
                  <circle
                    cx="50" cy="50" r="46"
                    fill="none"
                    stroke="url(#vt-mystic-grad-stage)"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeDasharray={`${progress * 2 * Math.PI * 46} ${2 * Math.PI * 46}`}
                    style={{ transition: "stroke-dasharray 380ms ease-out", filter: `drop-shadow(0 0 6px rgba(${mood.glow}, 0.6))` }}
                  />
                  {beads.map((b, i) => (
                    <circle
                      key={i}
                      cx={b.x} cy={b.y}
                      r={b.lit ? 1.6 : 1.0}
                      fill={b.lit ? mood.ring : "rgba(255,250,236,0.25)"}
                      style={{ transition: "fill 240ms ease, r 240ms ease" }}
                    />
                  ))}
                </svg>

                <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none">
                  {ripples.map((r) => (
                    <span
                      key={r.id}
                      className="absolute rounded-full"
                      style={{
                        left: `${r.x}%`, top: `${r.y}%`,
                        width: 8, height: 8,
                        marginLeft: -4, marginTop: -4,
                        background: `radial-gradient(circle, rgba(${mood.glow}, 0.7), rgba(${mood.glow}, 0) 70%)`,
                        animation: "vt-mystic-ripple 850ms ease-out forwards",
                      }}
                    />
                  ))}
                  {/* Halo ring that shoots out behind the sparks */}
                  {ripples.map((r) => (
                    <span
                      key={`halo-${r.id}`}
                      className="absolute rounded-full"
                      style={{
                        left: `${r.x}%`, top: `${r.y}%`,
                        width: 14, height: 14,
                        marginLeft: -7, marginTop: -7,
                        border: `1.5px solid rgba(${mood.glow}, 0.85)`,
                        boxShadow: `0 0 12px rgba(${mood.glow}, 0.7)`,
                        animation: "vt-mystic-halo 700ms ease-out forwards",
                      }}
                    />
                  ))}
                </div>

                {/* Spark burst — flies outward from the tap point */}
                <div className="absolute inset-0 pointer-events-none">
                  {sparks.map((sp) => {
                    const color = sp.hue === "gold" ? "#D4AF37" : sp.hue === "saffron" ? "#FF9933" : "#FFFAEC";
                    return (
                      <span
                        key={sp.id}
                        className="absolute rounded-full"
                        style={{
                          left: `${sp.x}%`, top: `${sp.y}%`,
                          width: 5, height: 5,
                          marginLeft: -2.5, marginTop: -2.5,
                          background: color,
                          boxShadow: `0 0 8px ${color}, 0 0 14px ${color}`,
                          ["--vt-angle" as any]: `${sp.angle}deg`,
                          ["--vt-dist" as any]: `${sp.dist}px`,
                          animation: "vt-mystic-spark-fly 900ms cubic-bezier(0.2, 0.7, 0.3, 1) forwards",
                        } as React.CSSProperties}
                      />
                    );
                  })}
                </div>

                {/* Floating Om glyph that rises and fades */}
                <div className="absolute inset-0 pointer-events-none">
                  {floaters.map((f) => (
                    <span
                      key={f.id}
                      className="absolute font-serif text-2xl md:text-3xl font-semibold"
                      style={{
                        left: `${f.x}%`, top: `${f.y}%`,
                        marginLeft: -12, marginTop: -16,
                        color: "#FFE9A8",
                        textShadow: `0 0 10px rgba(${mood.glow}, 0.9), 0 0 20px rgba(${mood.glow}, 0.6)`,
                        animation: "vt-mystic-floater 1.05s ease-out forwards",
                      }}
                      lang="sa"
                      aria-hidden
                    >
                      {f.glyph}
                    </span>
                  ))}
                </div>

                <button
                  onClick={tap}
                  className="absolute inset-5 rounded-full flex flex-col items-center justify-center select-none active:scale-[0.985] transition-transform"
                  style={{
                    background: `radial-gradient(circle at 50% 35%, ${mood.from}, ${mood.to})`,
                    boxShadow: `0 18px 60px -10px rgba(${mood.glow}, 0.7), inset 0 0 0 1px rgba(255,255,255,0.4), inset 0 -28px 40px -20px rgba(0,0,0,0.25)`,
                  }}
                  aria-label="Tap to count one japa"
                  data-testid="button-mystic-tap"
                >
                  <span
                    aria-hidden
                    key={pulse}
                    className="absolute inset-0 rounded-full"
                    style={{
                      animation: "vt-mystic-pulse 600ms ease-out",
                    }}
                  />
                  <svg viewBox="0 0 100 100" className="absolute inset-0 w-full h-full opacity-30 mix-blend-overlay" aria-hidden>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <ellipse
                        key={i}
                        cx="50" cy="22" rx="9" ry="20"
                        fill="white"
                        transform={`rotate(${i * 45} 50 50)`}
                      />
                    ))}
                  </svg>
                  <div className="relative font-serif text-5xl sm:text-6xl md:text-7xl text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.35)]" data-testid="text-mystic-count">
                    {count}
                  </div>
                  <div className="relative text-[10px] md:text-xs uppercase tracking-[0.32em] text-white/85 mt-1">
                    of {target}
                  </div>
                </button>
              </div>

              {/* Stats + controls */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <div className="rounded-full border border-[#D4AF37]/40 bg-black/30 backdrop-blur px-3 py-1 text-xs text-[#FFE9A8]">
                  Malas <span className="font-semibold ml-1" data-testid="text-mystic-malas">{malas}</span>
                </div>
                <div className="rounded-full border border-[#D4AF37]/40 bg-black/30 backdrop-blur px-3 py-1 text-xs text-[#FFE9A8]">
                  {Math.round(progress * 100)}%
                </div>
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#FF9933]/50 bg-black/30 backdrop-blur px-3 py-1 text-xs text-[#FFE9A8]"
                  data-testid="text-mystic-streak"
                  title="Daily chanting streak"
                >
                  <Flame className="h-3 w-3 text-[#FF9933]" />
                  {sadhana.dailyStreak}<span className="text-white/50">d</span>
                </div>
                <div
                  className="inline-flex items-center gap-1.5 rounded-full border border-[#D4AF37]/40 bg-black/30 backdrop-blur px-3 py-1 text-xs text-[#FFE9A8]"
                  data-testid="text-mystic-mahamala"
                  title="Progress toward your next mahamala (108 malas = 11,664 chants)"
                >
                  <Target className="h-3 w-3 text-[#D4AF37]" />
                  Mahamala <span className="font-semibold ml-1 tabular-nums">{sadhana.mahamalaMalas}/{MAHAMALA_TARGET}</span>
                  {sadhana.mahamalas > 0 && (
                    <span className="ml-1 text-[10px] text-[#D4AF37]">×{sadhana.mahamalas}</span>
                  )}
                </div>
                {activeSession && (() => {
                  const preset = SESSION_PRESETS.find((p) => p.id === activeSession.presetId);
                  if (!preset) return null;
                  const dayNum = Math.min(preset.days, Math.floor(activeSession.malasCompleted / preset.dailyMalas) + 1);
                  return (
                    <div
                      className="inline-flex items-center gap-1.5 rounded-full border border-[#3F7D5A]/60 bg-[#3F7D5A]/20 backdrop-blur px-3 py-1 text-xs text-[#CDEAC0]"
                      data-testid="text-session-progress"
                      title={preset.name}
                    >
                      <Calendar className="h-3 w-3" />
                      Day <span className="font-semibold mx-1 tabular-nums">{dayNum}/{preset.days}</span>
                      <span className="text-white/60">·</span>
                      <span className="ml-1 tabular-nums">{activeSession.todayMalas}/{preset.dailyMalas}</span>
                    </div>
                  );
                })()}

                <Button
                  size="sm"
                  onClick={() => setChorusOn((v) => !v)}
                  className={chorusOn
                    ? "bg-[#D4AF37] text-[#2A0F18] hover:bg-[#E8C75A]"
                    : "bg-[#6D2B35] hover:bg-[#4a1a22] text-white"}
                  data-testid="button-mystic-chorus"
                >
                  {chorusOn ? <Pause className="h-3.5 w-3.5 mr-1" /> : <Play className="h-3.5 w-3.5 mr-1" />}
                  <Users className="h-3.5 w-3.5 mr-1" />
                  {chorusOn ? "Pause Sage Chorus" : "Begin Sage Chorus"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setBreathOn((v) => !v)}
                  className={breathOn
                    ? "bg-[#3F7D5A] text-white hover:bg-[#356b4d]"
                    : "bg-[#6D2B35] hover:bg-[#4a1a22] text-white"}
                  data-testid="button-mystic-breath"
                >
                  <Wind className="h-3.5 w-3.5 mr-1" />
                  {breathOn ? "Breath On" : "Breath Guide"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setShowSessions(true)}
                  variant="outline"
                  className="border-[#D4AF37]/50 bg-black/30 backdrop-blur text-[#FFE9A8]"
                  data-testid="button-mystic-sessions"
                >
                  <Calendar className="h-3.5 w-3.5 mr-1" />
                  {activeSession ? "Session Active" : "Guided Sessions"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setDroneOn((v) => !v)}
                  className={droneOn
                    ? "bg-[#D4AF37] text-[#2A0F18] hover:bg-[#E8C75A]"
                    : "bg-[#6D2B35] hover:bg-[#4a1a22] text-white"}
                  title="Sruti drone — sustained tanpura-like Sa+Pa under your chant"
                  data-testid="button-mystic-sruti"
                >
                  <Music className="h-3.5 w-3.5 mr-1" />
                  {droneOn ? `Sruti · ${droneKey}` : "Sruti drone"}
                </Button>

                <Button
                  size="sm"
                  onClick={() => setMicOn((v) => !v)}
                  className={micOn
                    ? "bg-[#3F7D5A] text-white hover:bg-[#356b4d]"
                    : "bg-[#6D2B35] hover:bg-[#4a1a22] text-white"}
                  title="Listen for your chant — local analysis only, never sent to the server"
                  data-testid="button-mystic-mic"
                >
                  <Zap className="h-3.5 w-3.5 mr-1" />
                  {micOn
                    ? (voiceLevel > 0.15 ? "Hearing your chant" : "Listening…")
                    : "Voice listen"}
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={reset}
                  className="border-[#D4AF37]/50 bg-black/30 backdrop-blur text-[#FFE9A8]"
                  data-testid="button-mystic-reset"
                >
                  <RotateCcw className="h-3.5 w-3.5 mr-1" /> Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSoundOn((s) => !s)}
                  className="border-[#D4AF37]/50 bg-black/30 backdrop-blur text-[#FFE9A8]"
                  data-testid="button-mystic-sound"
                >
                  {soundOn ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={change}
                  className="text-[#FFE9A8]/80"
                  data-testid="button-mystic-change"
                >
                  Change mantra
                </Button>
              </div>

              {/* Sruti key picker — appears when the drone is on. Pick a key
                  that matches your voice; chant in that scale. */}
              {droneOn && (
                <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5">
                  <span className="text-[10px] uppercase tracking-[0.22em] text-white/60 mr-1">
                    Tune to
                  </span>
                  {SRUTI_KEYS.map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDroneKey(k)}
                      className={`text-[11px] rounded-full border px-2 py-0.5 hover-elevate active-elevate-2 ${
                        droneKey === k
                          ? "bg-[#D4AF37] text-[#2A0F18] border-[#D4AF37] font-semibold"
                          : "bg-black/30 text-[#FFE9A8] border-[#D4AF37]/40"
                      }`}
                      data-testid={`chip-sruti-${k}`}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              )}

              {/* Speed control — visible whenever chorus is available */}
              <div className="mt-4 flex items-center gap-3 text-[11px] uppercase tracking-[0.22em] text-white/70">
                <span>Pace</span>
                <input
                  type="range"
                  min={1500}
                  max={6000}
                  step={100}
                  value={speedMs}
                  onChange={(e) => setSpeedMs(Number(e.target.value))}
                  className="accent-[#D4AF37] w-44"
                  aria-label="Chant pace in milliseconds"
                  data-testid="slider-mystic-pace"
                />
                <span className="tabular-nums text-white/80">{(speedMs / 1000).toFixed(1)}s</span>
              </div>
              {!voicesReady && chorusOn && (
                <div className="mt-3 text-[11px] text-white/70 max-w-md text-center">
                  Loading voices… your browser needs a moment to surface its sage chorus. The bell drone is already playing.
                </div>
              )}

              {AudioPlayer}

              <div className="mt-2 text-[11px] text-white/50 text-center">
                Tip · Tap the lotus or press <kbd className="px-1.5 py-0.5 rounded bg-white/10 border border-white/20">space</kbd> to count
              </div>

              {/* Rhythm nudge — soft "slow down, breathe" cue when tapping too fast */}
              {rhythmNudge && (
                <div
                  className="pointer-events-none absolute -top-4 left-1/2 -translate-x-1/2 z-20 inline-flex items-center gap-2 rounded-full border border-[#FF9933]/60 bg-black/60 backdrop-blur px-4 py-1.5 text-[11px] uppercase tracking-[0.28em] text-[#FFE9A8] font-semibold animate-in fade-in slide-in-from-top-2"
                  data-testid="badge-rhythm-nudge"
                >
                  <Wind className="h-3 w-3 text-[#FF9933]" /> Slow down · breathe with each chant
                </div>
              )}

              {celebrate && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                  {Array.from({ length: 16 }).map((_, i) => (
                    <span
                      key={i}
                      className="absolute"
                      style={{
                        left: "50%", top: "50%",
                        width: 6, height: 6, borderRadius: "9999px",
                        background: i % 2 ? "#D4AF37" : "#FF9933",
                        transform: `rotate(${(i / 16) * 360}deg) translateY(-160px)`,
                        animation: "vt-mystic-spark 1.6s ease-out forwards",
                        animationDelay: `${i * 30}ms`,
                      }}
                    />
                  ))}
                  <div className="absolute -bottom-2 text-[11px] uppercase tracking-[0.32em] text-[#FFE9A8] font-semibold">
                    Mala complete · {malas + 1}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );

  // ===== Single app-like panel embedded in the page =====
  // ===== Mala completion ritual modal =====
  // Appears ~2s after a mala completes (108 chants). Shows the mantra's
  // full meaning so the practitioner pauses to absorb it, plus an optional
  // private reflection note that becomes a journal entry. Skip = dismiss.
  const RitualPanel = ritualSnapshot && (
    <div
      className="fixed inset-0 z-[70] bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-label="Mala completion ritual"
      data-testid="modal-ritual"
    >
      <div className="relative bg-gradient-to-br from-[#1a0608] via-[#2a0e12] to-[#1a0608] w-full sm:max-w-lg sm:rounded-2xl rounded-t-2xl border border-[#D4AF37]/50 shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Soft gold halo */}
        <div className="absolute inset-x-0 -top-24 h-48 bg-[#D4AF37]/20 blur-3xl pointer-events-none" />
        <div className="relative px-5 pt-5 pb-3 text-center">
          <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.32em] text-[#D4AF37] font-semibold">
            <Sparkles className="h-3 w-3" /> Mala {ritualSnapshot.malaNumber} complete
          </div>
          <div className="mt-3 font-serif text-2xl md:text-3xl text-white saffron-shimmer leading-tight" lang="sa">
            {ritualSnapshot.devanagari}
          </div>
          <div className="mt-1 text-sm text-white/70 italic">
            {ritualSnapshot.transliteration}
          </div>
        </div>
        <div className="relative flex-1 overflow-y-auto px-5 pb-3">
          {ritualSnapshot.meaning && (
            <div className="rounded-xl border border-[#D4AF37]/25 bg-black/30 backdrop-blur px-4 py-3">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]/80 font-semibold mb-1.5">Meaning</div>
              <p className="text-sm text-white/85 leading-relaxed">{ritualSnapshot.meaning}</p>
            </div>
          )}
          {ritualSnapshot.sankalpa && (
            <div className="mt-3 rounded-xl border border-[#FF9933]/25 bg-[#FF9933]/5 px-4 py-2.5">
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#FF9933] font-semibold mb-1">Your sankalpa</div>
              <p className="text-sm text-white/85 italic">{ritualSnapshot.sankalpa}</p>
            </div>
          )}
          <div className="mt-4">
            <label className="block text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]/80 font-semibold mb-2">
              Reflection (optional · private)
            </label>
            <textarea
              value={reflection}
              onChange={(e) => setReflection(e.target.value.slice(0, 1000))}
              placeholder="What arose? What shifted? Stays on this device."
              rows={4}
              className="w-full resize-none rounded-xl border border-[#D4AF37]/30 bg-black/40 text-white placeholder:text-white/40 px-3 py-2.5 text-sm focus:outline-none focus:border-[#D4AF37]/70"
              data-testid="textarea-reflection"
            />
            <div className="text-right text-[10px] text-white/40 mt-1">{reflection.length}/1000</div>
          </div>
        </div>
        <div className="relative px-5 py-4 border-t border-[#D4AF37]/20 flex items-center justify-end gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => { setRitualSnapshot(null); setReflection(""); }}
            className="text-white/70 hover:text-white"
            data-testid="button-skip-ritual"
          >
            Skip
          </Button>
          <Button
            size="sm"
            onClick={saveJournalEntry}
            className="bg-[#D4AF37] text-[#4a1a22] hover:bg-[#D4AF37]/90 font-semibold"
            data-testid="button-save-reflection"
          >
            <BookOpen className="h-4 w-4 mr-1.5" />
            {reflection.trim() ? "Save reflection" : "Log this mala"}
          </Button>
        </div>
      </div>
    </div>
  );

  // ===== Private journal panel =====
  const JournalPanel = showJournal && (
    <div
      className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
      role="dialog"
      aria-label="Your japa journal"
      onClick={() => setShowJournal(false)}
      data-testid="modal-journal"
    >
      <div
        className="bg-[#FFFAEC] w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl border border-[#D4AF37]/40 shadow-2xl max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#D4AF37]/30">
          <div>
            <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">Your Journal</div>
            <h3 className="font-serif text-lg md:text-xl text-[#4a1a22]">
              {journal.length === 0 ? "No entries yet" : `${journal.length} mala${journal.length === 1 ? "" : "s"} logged`}
            </h3>
          </div>
          <Button size="icon" variant="ghost" onClick={() => setShowJournal(false)} data-testid="button-close-journal">
            <X className="h-4 w-4 text-[#6D2B35]" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-3">
          {journal.length === 0 ? (
            <div className="text-center text-sm text-[#6D2B35]/60 py-12 px-4">
              <BookOpen className="h-8 w-8 text-[#D4AF37]/40 mx-auto mb-3" />
              <p>Complete a mala (108 chants) to begin your private journal.</p>
              <p className="mt-2 text-[11px] text-[#6D2B35]/50">Entries are stored on this device only.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {journal.map((e) => {
                const d = new Date(e.dateISO);
                const dateStr = d.toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short", year: "numeric" });
                const timeStr = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
                return (
                  <li
                    key={e.id}
                    className="rounded-lg border border-[#D4AF37]/30 bg-white px-3 py-2.5"
                    data-testid={`journal-entry-${e.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-sm text-[#4a1a22] truncate">{e.mantraLabel}</span>
                          <span className="text-[10px] uppercase tracking-[0.2em] text-[#D4AF37] shrink-0">Mala {e.malaNumber}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-[#6D2B35]/60">
                          {dateStr} · {timeStr}
                        </div>
                        <div className="mt-1 font-serif text-sm text-[#6D2B35] truncate" lang="sa">{e.devanagari}</div>
                        {e.sankalpa && (
                          <div className="mt-1.5 text-[11px] text-[#6D2B35]/70 italic truncate">
                            <span className="not-italic uppercase tracking-[0.2em] text-[10px] text-[#FF9933] font-semibold mr-1">Sankalpa</span>
                            {e.sankalpa}
                          </div>
                        )}
                        {e.reflection && (
                          <p className="mt-1.5 text-xs text-[#4a1a22]/85 leading-relaxed whitespace-pre-wrap">
                            {e.reflection}
                          </p>
                        )}
                      </div>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => deleteJournalEntry(e.id)}
                        className="text-[#6D2B35]/40 hover:text-[#6D2B35]"
                        data-testid={`button-delete-journal-${e.id}`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
        <div className="px-4 py-2 border-t border-[#D4AF37]/20 text-[10px] text-[#6D2B35]/60 text-center">
          Private to this device. Clear browser data and entries are gone.
        </div>
      </div>
    </div>
  );

  return (
    <div className="relative" data-testid="mystic-counter">
      {Stage}
      {LibraryPanel}
      {SessionsPanel}
      {RitualPanel}
      {JournalPanel}

      <style>{`
        @keyframes vt-mystic-ripple {
          0%   { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(28); opacity: 0; }
        }
        @keyframes vt-mystic-halo {
          0%   { transform: scale(0.4); opacity: 0.95; }
          100% { transform: scale(6); opacity: 0; }
        }
        @keyframes vt-mystic-spark-fly {
          0% {
            transform: rotate(var(--vt-angle, 0deg)) translateX(0) scale(1);
            opacity: 1;
          }
          70% { opacity: 0.95; }
          100% {
            transform: rotate(var(--vt-angle, 0deg)) translateX(var(--vt-dist, 80px)) scale(0.2);
            opacity: 0;
          }
        }
        @keyframes vt-mystic-floater {
          0%   { transform: translateY(0) scale(0.8); opacity: 0; }
          15%  { opacity: 1; }
          100% { transform: translateY(-70px) scale(1.25); opacity: 0; }
        }
        @keyframes vt-mystic-pulse {
          0%   { box-shadow: inset 0 0 0 0 rgba(255,255,255,0.55); }
          100% { box-shadow: inset 0 0 0 28px rgba(255,255,255,0); }
        }
        @keyframes vt-mystic-spark {
          0%   { opacity: 1; transform: rotate(var(--r,0deg)) translateY(0px) scale(1); }
          100% { opacity: 0; transform: rotate(var(--r,0deg)) translateY(-220px) scale(0.4); }
        }
        @keyframes vt-spin {
          to { transform: rotate(360deg); }
        }
        @keyframes vt-breathe {
          0%, 100% { opacity: 0.6; }
          50%      { opacity: 1; }
        }
        @keyframes vt-drift {
          0%   { transform: translateY(0px); opacity: 0.3; }
          100% { transform: translateY(-30px); opacity: 0.7; }
        }
        @media (prefers-reduced-motion: reduce) {
          [data-testid="mystic-counter"] *,
          [data-testid="mystic-stage"] * {
            animation-duration: 0.001ms !important;
            transition-duration: 0.001ms !important;
          }
        }
      `}</style>
    </div>
  );
}
