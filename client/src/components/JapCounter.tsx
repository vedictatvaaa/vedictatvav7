import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MANTRA_LIBRARY } from "@/data/mantra-library";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import {
  BellOff, Vibrate, RotateCcw, Plus, Sparkles, Flame,
  Volume2, VolumeX, Undo2, Trophy, Music2, Trash2,
  Maximize2, Minimize2, Lock, LockOpen, X,
  Heart, Share2, CalendarCheck, Headphones, Play, Square,
  Info, ChevronDown, ChevronUp, Shuffle,
} from "lucide-react";
import mahamrityunjayaAudioUrl from "@assets/oms-uravarakabnathhanama_1DPkLkXi_1778219722131.mp3";
import omNamahShivayaAudioUrl from "@assets/om-namah-shivaya-chant_XTVuqww6_1778237342624.mp3";
import saraswatiAudioUrl from "@assets/oms-ai-sarasavataya_hwbrE3zA_1778238403622.mp3";
import gayatriAudioUrl from "@assets/gayatri-mantra_Q6Wr5t9i_1778239049070.mp3";
import hareKrishnaAudioUrl from "@assets/hare-krishna_qUJzAru3_1778247300927.mp3";
import omNamoBhagavateAudioUrl from "@assets/108fold-namo_3L0KPc4A_1778251695849.mp3";
import mahalaxmiAudioUrl from "@assets/108fold-namo_3L0KPc4A_2_1778252274758.mp3";
import ganeshAudioUrl from "@assets/ganaepata-tana-oms_SQQ7M0nq_1778252685826.mp3";
import hanumanAudioUrl from "@assets/hanumate-namah_jaqqzhio_2_1778253761476.mp3";
import shivaMahamrityunjayaImg from "@assets/generated_images/shiva-mahamrityunjaya.png";
import shivaBlessingHandImg from "@assets/generated_images/shiva-blessing-hand.png";
// AI-generated deity portraits for each preset mantra. Used as the
// background of the Focus-mode overlay (masked + low opacity so the
// mala stays legible). Imported eagerly so the bundler hashes them
// and the browser caches them; per-mantra rendering is opt-in via
// MANTRA_DEITY_IMAGES below.
import krishnaFluteDeityImg from "@assets/generated_images/krishna-flute-deity.png";
import krishnaVasudevaDeityImg from "@assets/generated_images/krishna-vasudeva-deity.png";
import radhaKrishnaDeityImg from "@assets/generated_images/radha-krishna-deity.png";
import vishnuNarayanaDeityImg from "@assets/generated_images/vishnu-narayana-deity.png";
import ganeshaDeityImg from "@assets/generated_images/ganesha-deity.png";
import suryaGayatriDeityImg from "@assets/generated_images/surya-gayatri-deity.png";
import durgaDeityImg from "@assets/generated_images/durga-deity.png";
import saraswatiDeityImg from "@assets/generated_images/saraswati-deity.png";
import mahalakshmiDeityImg from "@assets/generated_images/mahalakshmi-deity.png";
import hanumanDeityImg from "@assets/generated_images/hanuman-deity.png";

type Mantra = {
  id: string;
  label: string;
  sanskrit?: string;
  // Set by user via "Add my own" — kept private to ownerKey in localStorage.
  custom?: boolean;
  // Set by admin-managed mantras coming from /api/mantras. Visible to all
  // visitors; when audioUrl is present we play that audio instead of the
  // synthetic temple bell on tap. meaning/deity surface in the existing
  // "What does this mean?" disclosure.
  audioUrl?: string;
  meaning?: string;
  deity?: string;
};

// Server payload for admin-managed mantras (subset of AdminMantra select
// type — kept narrow so this file doesn't depend on @shared/schema).
type ServerMantra = {
  id: number;
  slug: string;
  label: string;
  sanskrit: string | null;
  meaning: string | null;
  deity: string | null;
  audioUrl: string | null;
  audioMimeType: string | null;
  isActive: boolean;
  sortOrder: number;
};

const PRESET_MANTRAS: Mantra[] = [
  { id: "om-namah-shivaya",        label: "Om Namah Shivaya",                sanskrit: "ॐ नमः शिवाय" },
  { id: "hare-krishna",            label: "Hare Krishna Mahamantra",         sanskrit: "हरे कृष्ण हरे कृष्ण कृष्ण कृष्ण हरे हरे" },
  { id: "gayatri",                 label: "Gayatri Mantra",                  sanskrit: "ॐ भूर्भुवः स्वः…" },
  { id: "mahamrityunjaya",         label: "Mahamrityunjaya Mantra",          sanskrit: "ॐ त्र्यम्बकं यजामहे…" },
  { id: "om-gam-ganapataye",       label: "Om Gam Ganapataye Namaha",        sanskrit: "ॐ गं गणपतये नमः" },
  { id: "om-namo-narayanaya",      label: "Om Namo Narayanaya",              sanskrit: "ॐ नमो नारायणाय" },
  { id: "om-namo-bhagavate",       label: "Om Namo Bhagavate Vasudevaya",    sanskrit: "ॐ नमो भगवते वासुदेवाय" },
  { id: "radhe-radhe",             label: "Radhe Radhe",                     sanskrit: "राधे राधे" },
  { id: "durga-mantra",            label: "Om Sarva Mangala Mangalye",       sanskrit: "ॐ सर्व मङ्गल माङ्गल्ये" },
  { id: "saraswati-mantra",        label: "Om Aim Saraswatyai Namaha",       sanskrit: "ॐ ऐं सरस्वत्यै नमः" },
  { id: "mahalaxmi-mantra",        label: "Om Shreem Mahalakshmiyei Namaha", sanskrit: "ॐ श्रीं महालक्ष्म्यै नमः" },
  { id: "hanuman-mantra",          label: "Om Hanumate Namaha",              sanskrit: "ॐ हनुमते नमः" },
];

// English meaning + presiding deity for each preset mantra. Surfaced under
// the chant via an expandable "What does this mean?" disclosure so the
// devotee can chant with understanding rather than rote recitation.
const MANTRA_MEANINGS: Record<string, { meaning: string; deity: string }> = {
  "om-namah-shivaya":   { meaning: "I bow to Shiva — the auspicious one within all forms, destroyer of ego, the stillness behind every breath.", deity: "Shiva, the cosmic dancer of dissolution and renewal." },
  "hare-krishna":       { meaning: "Calling upon the joyful, all-attractive Divine — Radha and Krishna, the eternal play of love and devotion.", deity: "Krishna, the flute-player who steals the heart." },
  "gayatri":            { meaning: "May the radiant light of the Sun illumine our intellect and awaken right understanding.", deity: "Savitr, the divine Sun who births all wisdom." },
  "mahamrityunjaya":    { meaning: "We worship the three-eyed Lord — fragrant, nourisher of all. As a ripe cucumber is freed from its vine, may we be freed from death — but not from immortality.", deity: "Shiva as Mrityunjaya, the conqueror of death." },
  "om-gam-ganapataye":  { meaning: "Salutations to Ganesha — remover of obstacles, lord of beginnings, keeper of the threshold.", deity: "Ganesha, the elephant-headed son of Shiva and Parvati." },
  "om-namo-narayanaya": { meaning: "I bow to Narayana — the supreme refuge who rests upon the cosmic ocean, the support of all worlds.", deity: "Vishnu as Narayana, sustainer of the universe." },
  "om-namo-bhagavate":  { meaning: "I bow to the Divine Vasudeva — the indwelling source from whom all beings arise and into whom they return.", deity: "Krishna-Vasudeva, the all-pervading Lord." },
  "radhe-radhe":        { meaning: "Calling upon Radha — divine love personified, the longing of the soul for its source.", deity: "Radha, eternal beloved of Krishna." },
  "durga-mantra":       { meaning: "Salutations to the Mother — auspiciousness of all auspiciousness, fulfiller of every right desire, refuge of the surrendered.", deity: "Durga, the fierce and protective Mother." },
  "saraswati-mantra":   { meaning: "I bow to Saraswati — goddess of wisdom, music, speech, and the flowing river of learning.", deity: "Saraswati, consort of Brahma." },
  "mahalaxmi-mantra":   { meaning: "I bow to Mahalakshmi — bestower of abundance, beauty, prosperity, and inner fulfilment.", deity: "Mahalakshmi, consort of Vishnu, mother of all wealth." },
  "hanuman-mantra":     { meaning: "I bow to Hanuman — fearless devotee of Rama, embodiment of strength, courage, and unwavering surrender.", deity: "Hanuman, son of Vayu, the wind-borne servant of Sri Rama." },
};

// Karaoke-style synced lyrics for the Mahamrityunjaya chant. The recorded
// audio chants these four padas in order — we light up the active line based
// on `audio.currentTime / audio.duration` so the devotee can sing along,
// see the Devanagari, and read the meaning all at once.
const MAHAMRITYUNJAYA_LYRICS: { sa: string; iast: string; en: string }[] = [
  { sa: "ॐ त्र्यम्बकं यजामहे",       iast: "Om Tryambakam Yajamahe",       en: "We worship the three-eyed Lord Shiva" },
  { sa: "सुगन्धिं पुष्टिवर्धनम्",      iast: "Sugandhim Pushtivardhanam",    en: "The fragrant one who nourishes all beings" },
  { sa: "उर्वारुकमिव बन्धनान्",       iast: "Urvarukamiva Bandhanan",       en: "As a ripe cucumber is freed from its vine" },
  { sa: "मृत्योर्मुक्षीय माऽमृतात्",   iast: "Mrityormukshiya Maamritat",    en: "May we be freed from death — but not from immortality" },
];

const MANTRA_LYRICS: Record<string, typeof MAHAMRITYUNJAYA_LYRICS> = {
  mahamrityunjaya: MAHAMRITYUNJAYA_LYRICS,
};

// Sacred mala sizes. 108 is the canonical full mala; the smaller
// counts are used for shorter daily intentions or quick rounds
// (11 = Rudras, 51 = ardha-mala, 108 = full mala).
const TARGET_OPTIONS = [11, 51, 108];
const STORAGE_PREFIX = "vt-jap";

type Persist = {
  count: number;            // count within current mala
  malas: number;            // malas completed (lifetime for this mantra+owner)
  total: number;            // total japas (lifetime)
  todayDate: string;        // YYYY-MM-DD
  todayCount: number;
  todayMalas: number;
  streak: number;
  lastDay: string | null;
  history: { ts: number; count: number; mantraLabel: string }[];
};

const emptyPersist = (): Persist => ({
  count: 0, malas: 0, total: 0,
  todayDate: today(), todayCount: 0, todayMalas: 0,
  streak: 0, lastDay: null, history: [],
});

function today() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function yesterday() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function loadPersist(key: string): Persist {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return emptyPersist();
    const p = JSON.parse(raw) as Persist;
    // Roll over today bucket if date changed
    const t = today();
    if (p.todayDate !== t) {
      // Update streak: if last day was yesterday, +1; else reset to count today's activity later
      const yest = yesterday();
      if (p.lastDay === yest && p.todayCount > 0) {
        // streak preserved (will be confirmed when user counts again today)
      } else if (p.lastDay !== t) {
        // reset streak only if last activity wasn't today and not yesterday
        if (p.lastDay !== yest) p.streak = 0;
      }
      p.todayDate = t;
      p.todayCount = 0;
      p.todayMalas = 0;
    }
    return { ...emptyPersist(), ...p };
  } catch {
    return emptyPersist();
  }
}

function savePersist(key: string, p: Persist) {
  try { localStorage.setItem(key, JSON.stringify(p)); } catch {}
}

function loadCustomMantras(ownerKey: string): Mantra[] {
  try { return JSON.parse(localStorage.getItem(`${STORAGE_PREFIX}:custom:${ownerKey}`) || "[]"); }
  catch { return []; }
}
function loadActiveMantraId(ownerKey: string): string {
  try { return localStorage.getItem(`${STORAGE_PREFIX}:active:${ownerKey}`) || PRESET_MANTRAS[0].id; }
  catch { return PRESET_MANTRAS[0].id; }
}
// Favourite mantras + the user's "daily ritual" mantra are scoped to the same
// ownerKey as everything else (guest, user:42, pandit:42, …). Stored in
// localStorage so they survive across visits without needing a backend round
// trip; the rest of the JapCounter state already lives here.
function loadFavorites(ownerKey: string): string[] {
  try {
    const raw = localStorage.getItem(`${STORAGE_PREFIX}:favs:${ownerKey}`);
    const arr = raw ? JSON.parse(raw) : [];
    return Array.isArray(arr) ? arr.filter((x): x is string => typeof x === "string") : [];
  } catch { return []; }
}
function saveFavorites(ownerKey: string, ids: string[]) {
  try { localStorage.setItem(`${STORAGE_PREFIX}:favs:${ownerKey}`, JSON.stringify(ids)); } catch {}
}
function loadDailyRitual(ownerKey: string): string | null {
  try { return localStorage.getItem(`${STORAGE_PREFIX}:daily:${ownerKey}`) || null; }
  catch { return null; }
}
function saveDailyRitual(ownerKey: string, id: string | null) {
  try {
    if (id) localStorage.setItem(`${STORAGE_PREFIX}:daily:${ownerKey}`, id);
    else localStorage.removeItem(`${STORAGE_PREFIX}:daily:${ownerKey}`);
  } catch {}
}

function loadTarget(ownerKey: string): number {
  try {
    const n = Number(localStorage.getItem(`${STORAGE_PREFIX}:target:${ownerKey}`));
    return Number.isFinite(n) && n > 0 ? n : 108;
  } catch { return 108; }
}

// =====================================================================
// Web Audio: synthesize an Indian temple ghanti (brass bell) without any
// external asset.
//
// Real temple bells are inharmonic — partials sit at non-integer multiples
// of the strike tone (~1, 2.43, 3.78, 5.62, 7.4) and decay at different
// rates, giving the characteristic shimmery, slowly-rotating sustain.
// We layer:
//   - a brief metallic strike noise burst (the mallet impact)
//   - 5 inharmonic sine partials with staggered decays
//   - a subtle low "hum" partial at half the strike pitch
// to recreate that feel from pure synthesis.
// =====================================================================
// Per-bead click character. "bell" is the metallic ghanta tap (default),
// "wood" is a short hollow knock — the sound a sandalwood bead makes
// against your thumbnail. Persisted in localStorage as `vt-jap-click-style`.
export type ClickStyle = "bell" | "wood";

class BellPlayer {
  private ctx: AudioContext | null = null;
  private enabled = true;
  private noiseBuf: AudioBuffer | null = null;
  private style: ClickStyle = "bell";

  setEnabled(e: boolean) { this.enabled = e; }
  setStyle(s: ClickStyle) { this.style = s; }

  private ensure() {
    if (this.ctx) return this.ctx;
    try {
      const Ctx = (window as any).AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      this.ctx = new Ctx();
      return this.ctx;
    } catch { return null; }
  }

  // 30ms of white noise, cached, for the metallic strike transient.
  private noise(ctx: AudioContext): AudioBuffer {
    if (this.noiseBuf) return this.noiseBuf;
    const len = Math.floor(ctx.sampleRate * 0.06);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    this.noiseBuf = buf;
    return buf;
  }

  // Strike a bell at the given strike pitch with the given peak gain and
  // overall decay. Used for both the soft per-bead tap and the rich
  // mala-completion clang.
  private strike(strikePitch: number, peak: number, decaySec: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;

    // Master out for this hit — gentle highpass keeps it from feeling muddy.
    const out = ctx.createGain();
    out.gain.value = 1;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 220;
    hp.Q.value = 0.4;
    out.connect(hp).connect(ctx.destination);

    // 1) Mallet strike: short, bandpass-filtered noise burst around 2× pitch.
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = this.noise(ctx);
    const nBp = ctx.createBiquadFilter();
    nBp.type = "bandpass";
    nBp.frequency.value = strikePitch * 2.2;
    nBp.Q.value = 1.4;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(peak * 0.7, now + 0.004);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.05);
    nSrc.connect(nBp).connect(nGain).connect(out);
    nSrc.start(now);
    nSrc.stop(now + 0.07);

    // 2) Inharmonic partials — ratios drawn from real bell measurements.
    //    Each has its own decay; higher partials die first.
    const partials: Array<{ ratio: number; gain: number; decay: number }> = [
      { ratio: 0.5,  gain: 0.18, decay: decaySec * 0.9 },  // hum tone
      { ratio: 1.0,  gain: 0.55, decay: decaySec },         // strike / prime
      { ratio: 2.43, gain: 0.40, decay: decaySec * 0.75 },  // tierce
      { ratio: 3.78, gain: 0.30, decay: decaySec * 0.55 },  // quint
      { ratio: 5.62, gain: 0.22, decay: decaySec * 0.40 },  // nominal
      { ratio: 7.40, gain: 0.14, decay: decaySec * 0.28 },  // upper shimmer
    ];

    for (const p of partials) {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = "sine";
      const f = strikePitch * p.ratio;
      o.frequency.value = f;
      // Slight detune wobble for shimmer.
      o.detune.setValueAtTime(-3 + Math.random() * 6, now);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(peak * p.gain, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + p.decay);
      o.connect(g).connect(out);
      o.start(now);
      o.stop(now + p.decay + 0.05);
    }
  }

  // Soft per-bead "ting" — small ghanta tap. Short decay so rapid japa
  // doesn't pile up. When style="wood", routes to a hollow knock instead.
  tap(count: number) {
    if (!this.enabled) return;
    if (this.style === "wood") { this.wood(count); return; }
    // Gently alternate between two strike pitches so the rhythm feels alive
    // without becoming a melody.
    const pitches = [560, 600];
    const f = pitches[count % pitches.length];
    this.strike(f, 0.18, 0.55);
  }

  // Wooden bead knock — short, hollow, dry. Built from a tight noise
  // burst through a high-Q bandpass + a low resonant body tone. Two
  // pitches alternate so consecutive beads don't feel like a metronome.
  private wood(count: number) {
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    const now = ctx.currentTime;
    const out = ctx.createGain();
    out.gain.value = 1;
    out.connect(ctx.destination);

    // 1) Click transient — narrow noise burst around 2.6 kHz.
    const knockHz = count % 2 === 0 ? 2600 : 2350;
    const nSrc = ctx.createBufferSource();
    nSrc.buffer = this.noise(ctx);
    const nBp = ctx.createBiquadFilter();
    nBp.type = "bandpass";
    nBp.frequency.value = knockHz;
    nBp.Q.value = 6;
    const nGain = ctx.createGain();
    nGain.gain.setValueAtTime(0.0001, now);
    nGain.gain.exponentialRampToValueAtTime(0.32, now + 0.002);
    nGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.045);
    nSrc.connect(nBp).connect(nGain).connect(out);
    nSrc.start(now);
    nSrc.stop(now + 0.06);

    // 2) Body resonance — a single low partial gives it the "sandalwood
    //    bead" weight without ringing into the next tap.
    const bodyHz = count % 2 === 0 ? 220 : 245;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = "sine";
    o.frequency.value = bodyHz;
    g.gain.setValueAtTime(0.0001, now);
    g.gain.exponentialRampToValueAtTime(0.16, now + 0.006);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
    o.connect(g).connect(out);
    o.start(now);
    o.stop(now + 0.22);
  }

  // Mandir aarti ghanti — rich brass clang on mala completion.
  bell() {
    if (!this.enabled) return;
    // Lower strike pitch + longer decay for the big temple-bell character.
    this.strike(420, 0.42, 3.2);
  }

  // Aarti completion chime — a celebratory sequence of three ascending
  // brass strikes followed by a deep resonant final bell. Plays when the
  // devotee finishes a full mala.
  aarti() {
    if (!this.enabled) return;
    const ctx = this.ensure();
    if (!ctx) return;
    if (ctx.state === "suspended") ctx.resume().catch(() => {});
    // Three ascending light strikes — like the priest swinging the ghanti
    // back-and-forth — then a deep low bell to close.
    const seq: Array<{ pitch: number; peak: number; decay: number; delay: number }> = [
      { pitch: 520, peak: 0.32, decay: 1.4, delay: 0    },
      { pitch: 660, peak: 0.34, decay: 1.4, delay: 220  },
      { pitch: 820, peak: 0.36, decay: 1.6, delay: 440  },
      { pitch: 360, peak: 0.50, decay: 4.2, delay: 760  }, // grand finale
    ];
    for (const s of seq) {
      setTimeout(() => this.strike(s.pitch, s.peak, s.decay), s.delay);
    }
  }
}

const bellPlayer = new BellPlayer();

// Per-mantra recorded audio that replaces the temple bell on each press.
// Uses a small pool of HTMLAudioElement clones so rapid taps overlap cleanly
// instead of cutting each other off (which is what happens if you replay a
// single Audio instance).
// Mutable so we can register admin-uploaded chant audio at runtime when
// the /api/mantras query resolves. The MantraAudioPlayer reads this map
// on every ensure()/has() call so new entries are picked up immediately.
const MANTRA_AUDIO_URLS: Record<string, string> = {
  mahamrityunjaya: mahamrityunjayaAudioUrl,
  "om-namah-shivaya": omNamahShivayaAudioUrl,
  "saraswati-mantra": saraswatiAudioUrl,
  gayatri: gayatriAudioUrl,
  "hare-krishna": hareKrishnaAudioUrl,
  "om-namo-bhagavate": omNamoBhagavateAudioUrl,
  "mahalaxmi-mantra": mahalaxmiAudioUrl,
  "om-gam-ganapataye": ganeshAudioUrl,
  "hanuman-mantra": hanumanAudioUrl,
};

export function registerMantraAudio(mantraId: string, url: string | null | undefined) {
  if (!mantraId) return;
  if (url && (/^https?:\/\//i.test(url) || url.startsWith("/"))) {
    MANTRA_AUDIO_URLS[mantraId] = url;
  }
}

class MantraAudioPlayer {
  private elements: Record<string, HTMLAudioElement> = {};
  private busy = false;
  private activeAudio: HTMLAudioElement | null = null;
  private activeCleanup: (() => void) | null = null;

  private ensure(mantraId: string): HTMLAudioElement | null {
    const url = MANTRA_AUDIO_URLS[mantraId];
    if (!url) return null;
    if (!this.elements[mantraId]) {
      const a = new Audio(url);
      a.preload = "auto";
      a.volume = 0.95;
      this.elements[mantraId] = a;
    }
    return this.elements[mantraId];
  }

  has(mantraId: string): boolean {
    return Boolean(MANTRA_AUDIO_URLS[mantraId]);
  }

  isBusy(): boolean {
    return this.busy;
  }

  /** Returns the currently-playing HTMLAudioElement, or null when idle.
   *  Used by the UI to subscribe to `timeupdate` for karaoke-style lyric
   *  highlighting in sync with the chant audio. */
  getActiveAudio(): HTMLAudioElement | null {
    return this.activeAudio;
  }

  /**
   * Play the mantra audio fully. The returned promise resolves when the
   * audio ends OR fails to play (so the caller can always proceed). While
   * playing, isBusy() is true — use that to lock further taps.
   */
  play(mantraId: string): Promise<void> {
    // Always abort any in-flight playback first so we never leak a pending
    // promise or leave the singleton's busy flag stuck on `true`.
    this.stop();
    const a = this.ensure(mantraId);
    if (!a) return Promise.resolve();
    return new Promise<void>((resolve) => {
      const cleanup = () => {
        a.removeEventListener("ended", onEnded);
        a.removeEventListener("error", onError);
        if (this.activeAudio === a) {
          this.activeAudio = null;
          this.activeCleanup = null;
        }
        this.busy = false;
        resolve();
      };
      const onEnded = () => cleanup();
      const onError = () => cleanup();
      a.addEventListener("ended", onEnded, { once: true });
      a.addEventListener("error", onError, { once: true });
      this.activeAudio = a;
      this.activeCleanup = cleanup;
      try {
        a.currentTime = 0;
        this.busy = true;
        const p = a.play();
        if (p && typeof p.catch === "function") p.catch(() => cleanup());
      } catch {
        cleanup();
      }
    });
  }

  /**
   * Abort any in-flight playback and resolve its pending promise. Safe to
   * call when nothing is playing. Used on mantra-switch and unmount so the
   * lock state can never get stuck.
   */
  stop(): void {
    const a = this.activeAudio;
    const cleanup = this.activeCleanup;
    if (!a || !cleanup) return;
    try { a.pause(); } catch {}
    try { a.currentTime = 0; } catch {}
    cleanup();
  }
}
const mantraAudio = new MantraAudioPlayer();

// Fires the device's haptic motor. Patterns shorter than ~20 ms are
// silently dropped by most Android devices (the motor cannot spin up
// fast enough), so callers should never use single pulses below ~30 ms
// or the haptic will feel completely absent. Returns the underlying
// browser result (true = queued, false = blocked / unsupported) so
// callers can detect a no-op and surface a helpful message to the user.
function vibrate(pattern: number | number[], enabled: boolean): boolean {
  if (!enabled) return false;
  try {
    const v = (navigator as any).vibrate;
    if (typeof v !== "function") return false;
    return v.call(navigator, pattern) === true;
  } catch {
    return false;
  }
}

export type JapCounterProps = {
  /** Stable id for storage key — usually `user:<id>` or `pandit:<id>` or `guest`. */
  ownerKey?: string;
  /** Heading shown above the counter. */
  title?: string;
  /** Subtitle copy. */
  subtitle?: string;
  /** Hide the internal title when a parent workspace supplies its own section header. */
  embedded?: boolean;
  /** Display name of the signed-in devotee — used to personalise the
   *  Tathastu ashirvad popup. Omit or pass empty for guests. */
  devoteeName?: string;
  /** When set (e.g. /japa/<slug> landing pages), force this mantra as
   *  the initially selected one and persist it to the active key, so the
   *  picker reflects the URL the devotee landed on. The user can still
   *  pick a different mantra inside the picker — this just sets the
   *  starting point. */
  initialMantraId?: string;
};

// LED caption strip — looks up the active mantra's transliteration from
// the shared MANTRA_LIBRARY (so the strip works for the 30 SEO-landing
// mantras out of the box) and falls back to the Devanagari + label for
// admin-managed or custom mantras that aren't in the library. The
// caption text is duplicated inside the marquee track so the loop is
// seamless — see vt-led-* in index.css for the keyframes.
function LedCaptionStrip({ mantra }: { mantra: Mantra }) {
  const caption = useMemo(() => {
    const lib = MANTRA_LIBRARY.find((m) => m.id === mantra.id);
    const dev = lib?.devanagari || mantra.sanskrit || "";
    const joined = dev;
    // Pad with spaces so very short mantras (e.g. "Om") still feel like
    // they're scrolling rather than blinking past.
    return joined.length < 40 ? `${joined}${" ".repeat(40 - joined.length)}` : joined;
  }, [mantra.id, mantra.sanskrit, mantra.label]);
  return (
    <div
      className="vt-led-strip w-full mb-3"
      role="marquee"
      aria-label={`Sing-along caption: ${caption}`}
      data-testid="led-caption-strip"
    >
      <div className="vt-led-track" data-testid="led-caption-track">
        <span>{caption}&nbsp;&nbsp;&nbsp;&middot;&nbsp;&nbsp;&nbsp;</span>
        <span aria-hidden="true">{caption}&nbsp;&nbsp;&nbsp;&middot;&nbsp;&nbsp;&nbsp;</span>
      </div>
    </div>
  );
}

export default function JapCounter({ ownerKey = "guest", title = "Jap Counter", subtitle, embedded = false, devoteeName, initialMantraId }: JapCounterProps) {
  const { toast } = useToast();

  // Owner-scoped state. Re-hydrate from localStorage whenever ownerKey changes
  // so a parent that resolves the owner async (e.g. pandit:self → pandit:42)
  // doesn't leak state between owners.
  const [customMantras, setCustomMantras] = useState<Mantra[]>(() => loadCustomMantras(ownerKey));
  const [mantraId, setMantraId] = useState<string>(() => initialMantraId || loadActiveMantraId(ownerKey));
  const [target, setTarget] = useState<number>(() => loadTarget(ownerKey));

  // Hydration gate prevents the "save" effect from firing with stale state from
  // the previous (mantra,owner) pair right after a key switch.
  const hydratingRef = useRef(false);

  // Favourites + daily-ritual selection (also owner-scoped).
  const [favorites, setFavorites] = useState<string[]>(() => loadFavorites(ownerKey));
  const [dailyRitual, setDailyRitual] = useState<string | null>(() => loadDailyRitual(ownerKey));

  useEffect(() => {
    hydratingRef.current = true;
    setCustomMantras(loadCustomMantras(ownerKey));
    // Per-mantra landing pages (/japa/<slug>) take precedence over the
    // last-active mantra so the URL is the source of truth on first paint.
    setMantraId(initialMantraId || loadActiveMantraId(ownerKey));
    setTarget(loadTarget(ownerKey));
    setFavorites(loadFavorites(ownerKey));
    setDailyRitual(loadDailyRitual(ownerKey));
    // hydration completes after the next paint
    const id = setTimeout(() => { hydratingRef.current = false; }, 0);
    return () => clearTimeout(id);
  }, [ownerKey, initialMantraId]);

  // Admin-managed global mantras — every visitor sees these merged into
  // the picker. Their audio URLs (if any) are registered with the audio
  // player so tap playback works just like the built-in Mahamrityunjaya
  // recording. We DO dedupe by id: if an admin slug collides with a
  // built-in id, the built-in wins (so admins can't accidentally hide a
  // preset by reusing its slug).
  const { data: serverMantras } = useQuery<ServerMantra[]>({
    queryKey: ["/api/mantras"],
    staleTime: 5 * 60 * 1000,
  });
  useEffect(() => {
    for (const m of (serverMantras || [])) {
      if (m.audioUrl) registerMantraAudio(m.slug, m.audioUrl);
    }
  }, [serverMantras]);
  const adminMantras = useMemo<Mantra[]>(() => {
    const presetIds = new Set(PRESET_MANTRAS.map((m) => m.id));
    return (serverMantras || [])
      .filter((m) => m && m.slug && !presetIds.has(m.slug))
      .map((m) => ({
        id: m.slug,
        label: m.label,
        sanskrit: m.sanskrit || undefined,
        meaning: m.meaning || undefined,
        deity: m.deity || undefined,
        audioUrl: m.audioUrl || undefined,
      }));
  }, [serverMantras]);
  const ALL_MANTRAS = useMemo(() => [...PRESET_MANTRAS, ...adminMantras, ...customMantras], [adminMantras, customMantras]);
  // Stable ref so the auto-chant loop (which is a long-running async
  // closure) can read the current mantra list without being torn
  // down every time admin/custom lists change.
  const allMantrasRef = useRef(ALL_MANTRAS);
  useEffect(() => { allMantrasRef.current = ALL_MANTRAS; }, [ALL_MANTRAS]);
  const mantra = ALL_MANTRAS.find((m) => m.id === mantraId) || PRESET_MANTRAS[0];

  // Resolved meaning + deity for the active mantra. Built-in MANTRA_MEANINGS
  // wins; admin-added mantras fall back to the row's own meaning/deity.
  const meaningInfo: { meaning: string; deity: string } | null =
    MANTRA_MEANINGS[mantra.id] ||
    (mantra.meaning ? { meaning: mantra.meaning, deity: mantra.deity || "" } : null);

  const storageKey = `${STORAGE_PREFIX}:data:${ownerKey}:${mantra.id}`;
  const [persist, setPersist] = useState<Persist>(() => loadPersist(storageKey));
  const lastLoadedKeyRef = useRef(storageKey);

  // Reload persist when storage key changes (mantra or owner). Mark hydrating
  // so the save effect below doesn't write the previous mantra's data into the
  // new key in the same commit.
  useEffect(() => {
    hydratingRef.current = true;
    const loaded = loadPersist(storageKey);
    setPersist(loaded);
    // Sync the ambient-effect refs to the freshly-loaded counts so the
    // milestone detector (which fires on `prev < m && curr >= m`) does
    // NOT spuriously trigger 27/54/81 blooms on every page load when the
    // stored count is already past one of those marks. Same for the
    // mala-rollover ref — without this, switching mantras could clear
    // an in-progress dhyana session.
    prevCountRef.current = loaded.count;
    prevMalasRef.current = loaded.malas;
    lastLoadedKeyRef.current = storageKey;
    try { localStorage.setItem(`${STORAGE_PREFIX}:active:${ownerKey}`, mantraId); } catch {}
    const id = setTimeout(() => { hydratingRef.current = false; }, 0);
    return () => clearTimeout(id);
  }, [storageKey, ownerKey, mantraId]);

  // Save on every change — guarded by hydration + key match.
  useEffect(() => {
    if (hydratingRef.current) return;
    if (lastLoadedKeyRef.current !== storageKey) return;
    savePersist(storageKey, persist);
  }, [storageKey, persist]);

  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_PREFIX}:target:${ownerKey}`, String(target)); } catch {}
  }, [target, ownerKey]);

  const [soundOn, setSoundOn] = useState(true);
  const [vibrationOn, setVibrationOn] = useState(true);
  // Per-bead click texture — temple-bell ting (default) or sandalwood
  // bead knock. Persisted globally (not per-owner) so the chosen feel
  // follows the devotee across mantras.
  const [clickStyle, setClickStyle] = useState<ClickStyle>(() => {
    try {
      const v = localStorage.getItem(`${STORAGE_PREFIX}:clickStyle`);
      return v === "wood" ? "wood" : "bell";
    } catch { return "bell"; }
  });
  useEffect(() => {
    bellPlayer.setStyle(clickStyle);
    try { localStorage.setItem(`${STORAGE_PREFIX}:clickStyle`, clickStyle); } catch {}
  }, [clickStyle]);

  // Sync taps to audio (default OFF). When ON, the press button is hard-locked
  // while the recorded chant is mid-playback — devotees who want the discipline
  // of "one tap per recited cycle" turn this on. When OFF (the default) the
  // counter stays kind: taps always count, audio is feedback only.
  const [syncTapsToAudio, setSyncTapsToAudio] = useState<boolean>(() => {
    try { return localStorage.getItem(`${STORAGE_PREFIX}:syncAudio:${ownerKey}`) === "1"; }
    catch { return false; }
  });
  useEffect(() => {
    try { localStorage.setItem(`${STORAGE_PREFIX}:syncAudio:${ownerKey}`, syncTapsToAudio ? "1" : "0"); } catch {}
  }, [syncTapsToAudio, ownerKey]);
  const syncRef = useRef(syncTapsToAudio);
  useEffect(() => { syncRef.current = syncTapsToAudio; }, [syncTapsToAudio]);
  const [celebration, setCelebration] = useState<{ malaNumber: number; target: number; mantraLabel: string; mantraId: string; ts: number } | null>(null);
  const [celebrationExiting, setCelebrationExiting] = useState(false);
  const [ashirvad, setAshirvad] = useState<{ mantraLabel: string; mantraId: string; ts: number } | null>(null);

  // Pre-chant breathwork (4-7-8 pranayama). Auto-runs once per session
  // on the first orb tap; subsequent taps go straight to counting.
  // Session is process-lifetime (mount → unmount). A fresh page load
  // counts as a new session and the breathwork triggers again.
  const [breathingActive, setBreathingActive] = useState(false);
  const [breathTick, setBreathTick] = useState(0);
  const breathingDoneThisSessionRef = useRef(false);
  const BREATH_TOTAL_MS = 60000;
  const BREATH_CYCLE_MS = 19000; // 4s inhale + 7s hold + 8s exhale
  useEffect(() => {
    if (!breathingActive) return;
    const start = Date.now();
    const id = setInterval(() => {
      const e = Date.now() - start;
      setBreathTick(e);
      if (e >= BREATH_TOTAL_MS) {
        clearInterval(id);
        breathingDoneThisSessionRef.current = true;
        setBreathingActive(false);
        setBreathTick(0);
      }
    }, 100);
    return () => clearInterval(id);
  }, [breathingActive]);
  const skipBreathing = useCallback(() => {
    breathingDoneThisSessionRef.current = true;
    setBreathingActive(false);
    setBreathTick(0);
  }, []);

  // — Full-mala bloom: timestamp of the most recent mala completion;
  //   the orb fires a gold radial flash + slow pulse for ~2.4s when
  //   this changes. Distinct from the existing CelebrationOverlay so
  //   the bloom can play even after the user dismisses the overlay.
  const [fullMalaBloom, setFullMalaBloom] = useState<number | null>(null);

  // — Sankalpa (today's intention): a short line the devotee writes
  //   before chanting. Persists per-day under STORAGE_PREFIX:sankalpa.
  //   The storage key combines ownerKey + today's date so it auto-resets
  //   at midnight and never leaks between owners. We track sankalpaKey
  //   in state and re-hydrate from localStorage whenever it changes —
  //   this prevents stale text from being written into a new owner /
  //   new day's slot when the component is reused across identities.
  const [sankalpaKey, setSankalpaKey] = useState(`${STORAGE_PREFIX}:sankalpa:${ownerKey}:${today()}`);
  const [sankalpaToday, setSankalpaToday] = useState<string>(() => {
    try { return localStorage.getItem(sankalpaKey) || ""; }
    catch { return ""; }
  });
  // When ownerKey changes, recompute the storage key + reload its value.
  useEffect(() => {
    const nextKey = `${STORAGE_PREFIX}:sankalpa:${ownerKey}:${today()}`;
    setSankalpaKey((cur) => (cur === nextKey ? cur : nextKey));
    try { setSankalpaToday(localStorage.getItem(nextKey) || ""); }
    catch { setSankalpaToday(""); }
  }, [ownerKey]);
  // Watch for date rollover (every 60s — cheap; the only thing it does
  // is swap the storage key when today() changes).
  useEffect(() => {
    const id = setInterval(() => {
      const nextKey = `${STORAGE_PREFIX}:sankalpa:${ownerKey}:${today()}`;
      setSankalpaKey((cur) => {
        if (cur === nextKey) return cur;
        try { setSankalpaToday(localStorage.getItem(nextKey) || ""); }
        catch { setSankalpaToday(""); }
        return nextKey;
      });
    }, 60_000);
    return () => clearInterval(id);
  }, [ownerKey]);
  // Persist on text change — always under the *current* key, never a
  // stale one (sankalpaKey is rebuilt on owner/day change above).
  useEffect(() => {
    try { localStorage.setItem(sankalpaKey, sankalpaToday); } catch {}
  }, [sankalpaToday, sankalpaKey]);
  useEffect(() => { bellPlayer.setEnabled(soundOn); }, [soundOn]);

  // — Lotus petals: tiny petal motes that drift up from the mala on
  //   each tap. Bounded — entries auto-purge from state after the
  //   2.2s drift animation so the array never grows unbounded.
  const [petals, setPetals] = useState<{ id: number; x: number; ts: number }[]>([]);
  const petalIdRef = useRef(0);
  // Track in-flight petal removal timeouts so we can cancel them on
  // unmount (avoids "set state on unmounted component" warnings and
  // any lingering closure references).
  const petalTimeoutsRef = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());
  useEffect(() => {
    return () => {
      petalTimeoutsRef.current.forEach((t) => clearTimeout(t));
      petalTimeoutsRef.current.clear();
    };
  }, []);

  // — Milestone bloom: when the count first crosses 27 / 54 / 81
  //   within a mala, render a golden bloom + a soft bell. Cleared
  //   automatically after ~2s.
  const [milestoneFlash, setMilestoneFlash] = useState<number | null>(null);
  // prevCountRef / prevMalasRef are seeded from the persisted state at
  // mount AND re-synced inside the hydration useEffect (above) so that
  // a page reload with a stored count of e.g. 30 does NOT spuriously
  // fire the 27-milestone bloom.
  const prevCountRef = useRef<number>(persist.count);

  // — Time in dhyana: stopwatch starts on the first tap of a
  //   session and resets on resetMala or mala completion. Updated
  //   once per second while running.
  const [sessionStartTs, setSessionStartTs] = useState<number | null>(null);
  const [sessionTickMs, setSessionTickMs] = useState<number>(0);
  useEffect(() => {
    if (!sessionStartTs) { setSessionTickMs(0); return; }
    const tick = () => setSessionTickMs(Date.now() - sessionStartTs);
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [sessionStartTs]);

  // — Mantra-meaning disclosure (collapsed by default).
  const [showMeaning, setShowMeaning] = useState(false);
  useEffect(() => { setShowMeaning(false); }, [mantra.id]);

  const [showAdd, setShowAdd] = useState(false);
  const [newName, setNewName] = useState("");
  const [newSanskrit, setNewSanskrit] = useState("");
  const [showCustomTarget, setShowCustomTarget] = useState(false);
  const [customTarget, setCustomTarget] = useState("");

  // Fullscreen / focused chanting mode
  const [fullscreen, setFullscreen] = useState(false);
  // Wake-lock state mirrors whether a sentinel is currently held
  const [wakeLockOn, setWakeLockOn] = useState(false);
  const wakeLockRef = useRef<any>(null);
  const wakeLockDesiredRef = useRef(false);

  const releaseWakeLock = useCallback(async () => {
    wakeLockDesiredRef.current = false;
    const sentinel = wakeLockRef.current;
    wakeLockRef.current = null;
    setWakeLockOn(false);
    if (sentinel) { try { await sentinel.release(); } catch {} }
  }, []);

  const acquireWakeLock = useCallback(async () => {
    wakeLockDesiredRef.current = true;
    const wl = (navigator as any).wakeLock;
    if (!wl || typeof wl.request !== "function") {
      toast({ title: "Screen lock not supported", description: "This browser cannot prevent the screen from sleeping. Use your device's screen-timeout setting.", variant: "destructive" });
      wakeLockDesiredRef.current = false;
      return;
    }
    try {
      const sentinel = await wl.request("screen");
      wakeLockRef.current = sentinel;
      setWakeLockOn(true);
      sentinel.addEventListener?.("release", () => {
        wakeLockRef.current = null;
        setWakeLockOn(false);
      });
    } catch {
      setWakeLockOn(false);
      toast({ title: "Could not lock screen", description: "Try again after tapping the counter once.", variant: "destructive" });
    }
  }, [toast]);

  // Re-acquire wake lock if it was dropped on tab-hide and the user wants it on
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === "visible" && wakeLockDesiredRef.current && !wakeLockRef.current) {
        acquireWakeLock();
      }
    };
    document.addEventListener("visibilitychange", onVis);
    return () => document.removeEventListener("visibilitychange", onVis);
  }, [acquireWakeLock]);

  // Release wake lock on unmount
  useEffect(() => () => { void releaseWakeLock(); }, [releaseWakeLock]);

  // Native Fullscreen API — best-effort. The overlay alone (fixed
  // inset-0 z-[9999]) already covers the whole document, but on
  // Android Chrome / desktop browsers we additionally request
  // browser-level fullscreen so the address bar, tabs, and OS chrome
  // disappear and the devotee gets a TRUE fullscreen sacred space.
  //
  // Caveats handled:
  //  - iOS Safari does not support requestFullscreen() on regular
  //    elements (only <video>). On iOS we silently fall back to the
  //    CSS overlay, which is already the maximally-fullscreen presentation
  //    available short of a PWA install. No error is shown.
  //  - Inside iframes (e.g. the Replit preview), requestFullscreen
  //    rejects unless the parent set `allow="fullscreen"`. We catch
  //    and continue — the overlay still works.
  //  - The request must run synchronously in a user-gesture chain —
  //    we DO NOT await it before setFullscreen() so the React state
  //    update fires immediately and the overlay paints regardless.
  const enterFullscreen = useCallback(() => {
    setFullscreen(true);
    try {
      const el: any = document.documentElement;
      const req = el.requestFullscreen || el.webkitRequestFullscreen || el.mozRequestFullScreen || el.msRequestFullscreen;
      if (typeof req === "function") {
        const result = req.call(el);
        if (result && typeof result.catch === "function") result.catch(() => { /* unsupported / denied — overlay still works */ });
      }
    } catch { /* unsupported — overlay still works */ }
  }, []);

  const exitFullscreen = useCallback(async () => {
    setFullscreen(false);
    try {
      const d: any = document;
      const exit = d.exitFullscreen || d.webkitExitFullscreen || d.mozCancelFullScreen || d.msExitFullscreen;
      if (exit && (d.fullscreenElement || d.webkitFullscreenElement || d.mozFullScreenElement || d.msFullscreenElement)) {
        await exit.call(d);
      }
    } catch {}
  }, []);

  // Body scroll lock while the focus overlay is open.
  useEffect(() => {
    if (!fullscreen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [fullscreen]);

  // Esc / browser fullscreen-exit should sync our overlay state
  useEffect(() => {
    const onChange = () => {
      const d: any = document;
      if (!(d.fullscreenElement || d.webkitFullscreenElement)) setFullscreen(false);
    };
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange as any);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange as any);
    };
  }, []);

  const lastTapRef = useRef<number>(0);
  // Tracks whether the per-mantra recorded chime is mid-playback. Drives the
  // karaoke lyrics highlight + the "Listening…" hint. Only blocks taps when
  // `syncTapsToAudio` is ON (devotee opted-in to disciplined pacing). In the
  // default mode taps stay free — audio is feedback, not a gate.
  const [audioLocked, setAudioLocked] = useState(false);
  const audioLockedRef = useRef(false);
  useEffect(() => { audioLockedRef.current = audioLocked; }, [audioLocked]);

  // Pace hint — if the devotee is tapping faster than ~700 ms (sub-second,
  // i.e. faster than a single chant cycle could ever finish), pulse the ring
  // gold for ~700 ms. No toast, no block — just a gentle visual nudge to
  // breathe between repetitions.
  const [paceHint, setPaceHint] = useState(false);
  const paceTimerRef = useRef<number | null>(null);
  const triggerPaceHint = useCallback(() => {
    setPaceHint(true);
    if (paceTimerRef.current) window.clearTimeout(paceTimerRef.current);
    paceTimerRef.current = window.setTimeout(() => setPaceHint(false), 700);
  }, []);
  useEffect(() => () => {
    if (paceTimerRef.current) window.clearTimeout(paceTimerRef.current);
  }, []);

  // Auto-chant has two states:
  //   • autoMode      — the devotee has armed hands-free mode (toggle on)
  //   • autoChanting  — the chant loop is actively running
  // Flipping the toggle on only ARMS the mode; the actual chanting begins
  // when the devotee then taps the main mala (so the start is intentional,
  // not a side-effect of clicking a settings toggle). Not persisted —
  // always starts off each session.
  const [autoMode, setAutoMode] = useState(false);
  const [autoChanting, setAutoChanting] = useState(false);
  const autoChantingRef = useRef(false);
  useEffect(() => { autoChantingRef.current = autoChanting; }, [autoChanting]);
  // Mix mode — when ON, the auto-chant loop completes the chosen
  // mala size on the current mantra and then advances to the next
  // mantra in ALL_MANTRAS that has a recorded chant. Cycles forever
  // until the devotee turns auto-chant off.
  const [mixMode, setMixMode] = useState(false);
  const mixModeRef = useRef(false);
  useEffect(() => { mixModeRef.current = mixMode; }, [mixMode]);

  // Keep a live ref to current persisted count so we can compute mala-completion
  // synchronously inside the click handler. This is required because
  // navigator.vibrate() must be called from a user-gesture stack on Android
  // Chrome — calling it inside React's setState updater (which may run
  // asynchronously / be replayed in Strict Mode) silently no-ops.
  const persistRef = useRef(persist);
  useEffect(() => { persistRef.current = persist; }, [persist]);

  // If the user switches mantras (or the component unmounts) while a chime
  // is mid-playback, abort it so the lock can't get stuck and the new
  // mantra's sound starts cleanly. Resolving the in-flight promise calls
  // its `.then` which clears `audioLocked`.
  useEffect(() => {
    return () => { mantraAudio.stop(); };
  }, [mantra.id]);

  // Karaoke-style progress: while the chime is playing, track the active
  // audio element's currentTime so the lyrics panel can light up the
  // matching line. Runs only while `audioLocked` is true and the active
  // mantra has lyrics. We attach `timeupdate`/`loadedmetadata` listeners
  // (cheap, browser-throttled) instead of an animation frame loop.
  const [audioProgress, setAudioProgress] = useState(0);
  const lyrics = MANTRA_LYRICS[mantra.id] ?? null;
  useEffect(() => {
    if (!audioLocked) { setAudioProgress(0); return; }
    const a = mantraAudio.getActiveAudio();
    if (!a) return;
    const update = () => {
      const dur = a.duration;
      if (!dur || !isFinite(dur) || dur <= 0) return;
      setAudioProgress(Math.min(1, Math.max(0, a.currentTime / dur)));
    };
    update();
    a.addEventListener("timeupdate", update);
    a.addEventListener("loadedmetadata", update);
    return () => {
      a.removeEventListener("timeupdate", update);
      a.removeEventListener("loadedmetadata", update);
    };
  }, [audioLocked]);

  // Active lyric index — while playing, advance proportionally; when idle,
  // keep all lines at "calm" state (no highlight) so the screen reads as
  // a respectful display rather than a karaoke prompt.
  const activeLyricIndex = lyrics && audioLocked
    ? Math.min(lyrics.length - 1, Math.floor(audioProgress * lyrics.length))
    : -1;

  // Helper: commit a single count tick. Extracted so the final-count tap can
  // defer the commit until AFTER the chime audio has finished playing — so
  // the mala-complete celebration shows only once the music is done.
  const commitTick = useCallback(() => {
    // Sacred side-effects of every tick:
    // 1. Start the dhyana stopwatch on the first tap of the session.
    // 2. Spawn a lotus petal that drifts up from the mala.
    setSessionStartTs((s) => s ?? Date.now());
    const petalId = ++petalIdRef.current;
    const petalX = 35 + Math.random() * 30; // 35–65% horizontal jitter
    setPetals((arr) => [...arr, { id: petalId, x: petalX, ts: Date.now() }].slice(-6));
    const purge = setTimeout(() => {
      petalTimeoutsRef.current.delete(purge);
      setPetals((arr) => arr.filter((pp) => pp.id !== petalId));
    }, 2400);
    petalTimeoutsRef.current.add(purge);
    setPersist((prev) => {
      const t = today();
      const isNewDay = prev.todayDate !== t;
      const yest = yesterday();
      const newStreak = isNewDay
        ? (prev.lastDay === yest ? prev.streak + 1 : 1)
        : (prev.streak === 0 ? 1 : prev.streak);
      // Display semantics: when the previous tap landed on the full mala
      // (count === target), the visible "108" lingered. The next tap is
      // bead 1 of the next mala — no extra mala credit (already credited
      // when we hit target). Otherwise increment, and on hitting target
      // we hold the count at target so the user actually sees "108".
      const wasAtTarget = prev.count >= target;
      let count = wasAtTarget ? 1 : prev.count + 1;
      let malas = prev.malas;
      let todayMalas = isNewDay ? 0 : prev.todayMalas;
      let todayCount = (isNewDay ? 0 : prev.todayCount) + 1;
      if (!wasAtTarget && count >= target) {
        malas += 1;
        todayMalas += 1;
        count = target;
      }
      return {
        ...prev,
        count, malas,
        total: prev.total + 1,
        todayDate: t, todayCount, todayMalas,
        streak: newStreak, lastDay: t,
      };
    });
  }, [target]);

  // Quarter-mala milestone detection. Fires only on increment (ignores
  // undo / reset / mala-completion-flip-to-0). One bloom per crossing.
  useEffect(() => {
    const prev = prevCountRef.current;
    const curr = persist.count;
    prevCountRef.current = curr;
    if (curr <= prev) return;
    for (const m of [27, 54, 81]) {
      if (prev < m && curr >= m && m < target) {
        setMilestoneFlash(m);
        if (soundOn) bellPlayer.tap(m);
        vibrate([60, 40, 60], vibrationOn);
        const id = setTimeout(() => setMilestoneFlash(null), 2000);
        return () => clearTimeout(id);
      }
    }
  }, [persist.count, target, soundOn, vibrationOn]);

  // Reset the dhyana stopwatch whenever the mala count rolls over
  // (mala completed). Skipped on initial mount via the ref.
  const prevMalasRef = useRef(persist.malas);
  useEffect(() => {
    if (persist.malas !== prevMalasRef.current) {
      prevMalasRef.current = persist.malas;
      setSessionStartTs(null);
    }
  }, [persist.malas]);

  // Auto-chant loop. While `autoChanting` is true, the counter advances by
  // one IMMEDIATELY (so the devotee sees the count flip the moment they
  // press Play) and the recorded chant plays in the background as feedback
  // — exactly mirroring manual-tap UX. When the chant ends, the next tick
  // begins. Manual taps are disabled during auto-chant (see press button
  // below) so the count never double-advances. The mala-completing
  // iteration plays the chant in full, THEN fires the aarti chime + the
  // Tathastu blessing — matching the manual final-tap completion flow.
  useEffect(() => {
    if (!autoChanting) return;
    if (!soundOn || !mantraAudio.has(mantra.id)) {
      setAutoChanting(false);
      toast({
        title: "Auto-chant unavailable",
        description: !soundOn
          ? "Turn Sound on to let the chant play."
          : "This mantra has no recorded chant yet — try Mahamrityunjaya.",
        variant: "destructive",
      });
      return;
    }
    let cancelled = false;
    (async () => {
      while (!cancelled && autoChantingRef.current) {
        // Capture state and commit the tick BEFORE playing the chant, so
        // the count flips instantly and the chant plays underneath as
        // feedback (same UX shape as manual tapping).
        const nextCount = persistRef.current.count + 1;
        const completedMala = nextCount >= target;
        const malaNumberAtTap = persistRef.current.malas + 1;
        vibrate([60, 30, 90], vibrationOn);
        commitTick();
        setAudioLocked(true);
        await mantraAudio.play(mantra.id);
        setAudioLocked(false);
        if (cancelled || !autoChantingRef.current) break;
        if (completedMala) {
          bellPlayer.aarti();
          vibrate([80, 60, 80, 60, 80, 60, 220], vibrationOn);
          setCelebration({
            malaNumber: malaNumberAtTap,
            target,
            mantraLabel: mantra.label,
            mantraId: mantra.id,
            ts: Date.now(),
          });
          // Mix mode: hop to the next mantra that has a recorded
          // chant and let the loop continue (the effect re-runs
          // automatically because mantra.id is in its deps). We
          // skip auto-chant teardown so it just keeps going.
          if (mixModeRef.current) {
            const audibles = allMantrasRef.current.filter((m) => mantraAudio.has(m.id));
            const idx = audibles.findIndex((m) => m.id === mantra.id);
            const nextMantra = audibles.length > 1 ? audibles[(idx + 1) % audibles.length] : null;
            if (nextMantra && nextMantra.id !== mantra.id) {
              toast({
                title: "Mix mode",
                description: `Now chanting ${nextMantra.label}`,
              });
              setMantraId(nextMantra.id);
              break; // effect re-fires with the new mantra; autoChanting stays true
            }
          }
          setAutoChanting(false);
          setAutoMode(false);
          break;
        }
      }
    })();
    return () => {
      cancelled = true;
      mantraAudio.stop();
    };
  }, [autoChanting, mantra.id, mantra.label, soundOn, vibrationOn, target, commitTick, toast, setMantraId]);

  // Toggle the auto-chant arming flag. Turning it OFF also stops any
  // running loop. Turning it ON only arms the mode — the actual chant
  // starts when the devotee then taps the mala.
  const toggleAutoMode = useCallback(() => {
    setAutoMode((prev) => {
      const next = !prev;
      if (!next) setAutoChanting(false);
      return next;
    });
  }, []);

  const tap = useCallback(() => {
    // Soft debounce (~250 ms) — kills accidental double-fires from palm
    // drag / shaky finger without blocking real chant pacing. A devotee
    // can still tap up to 4× per second if they want.
    const now = Date.now();
    const delta = now - lastTapRef.current;
    if (delta < 250) return;
    // Pace hint — gentle gold pulse on the ring if the devotee is tapping
    // faster than ~700 ms between counts (sub-second, faster than a single
    // chant cycle could ever finish). No toast, no block.
    if (lastTapRef.current > 0 && delta < 700) triggerPaceHint();
    lastTapRef.current = now;

    // Hard-block ONLY when the devotee opted into "Sync taps to audio"
    // (default off). Default behaviour: every tap counts, audio is just
    // feedback — exactly like a physical mala bead never refusing to advance.
    if (syncRef.current && audioLockedRef.current) return;

    // Compute mala completion synchronously to fire haptics + audio inside
    // the user-gesture stack BEFORE handing off to React's setState.
    const nextCount = persistRef.current.count + 1;
    const completedMala = nextCount >= target;
    const audioAvailable = soundOn && mantraAudio.has(mantra.id);
    const audioBusy = audioLockedRef.current;

    // Restart the mantra audio on EVERY tap (manual mode). Each bead
    // = one fresh recitation, just like a physical mala. mantraAudio
    // .play() calls stop() first, so currentTime resets to 0 even if
    // a previous chant is still mid-flight. When no chant is recorded
    // for this mantra, fall back to the bell-tap chime instead.
    if (audioAvailable) {
      setAudioLocked(true);
      mantraAudio.play(mantra.id).then(() => setAudioLocked(false));
    } else if (!audioBusy) {
      bellPlayer.tap(nextCount);
    }

    if (completedMala) {
      // Tathastu fires immediately on the bead that closes the mala.
      // The chant restart above plays in the background as feedback;
      // it does NOT block the celebration.
      bellPlayer.aarti();
      vibrate([80, 60, 80, 60, 80, 60, 220], vibrationOn);
      setCelebration({
        malaNumber: persistRef.current.malas + 1,
        target,
        mantraLabel: mantra.label,
        mantraId: mantra.id,
        ts: Date.now(),
      });
    } else {
      // Milestone haptics — gives the chanting body a felt sense of
      // progress without any visual interruption. Spec: gentle pulse on
      // every bead, distinct pattern on every 108th lifetime tap, and a
      // sustained sahasranama pulse on every 1008th. Lifetime (not
      // current-mala) so the felt-rhythm survives target switches and
      // mid-mala undo. NB: persistRef.total is the count BEFORE this tap.
      const lifetimeNext = persistRef.current.total + 1;
      if (lifetimeNext > 0 && lifetimeNext % 1008 === 0) {
        vibrate([120, 60, 120, 60, 120, 60, 280], vibrationOn);
      } else if (lifetimeNext > 0 && lifetimeNext % 108 === 0) {
        vibrate([100, 50, 100], vibrationOn);
      } else {
        // Forceful per-bead haptic — double-pulse felt clearly on every count.
        // 35ms single pulse was being silently dropped by most Android devices
        // (the motor can't spin up that fast). 60+30+90ms pattern always lands.
        vibrate([60, 30, 90], vibrationOn);
      }
    }

    setPersist((prev) => {
      const t = today();
      const isNewDay = prev.todayDate !== t;
      const yest = yesterday();
      const newStreak = isNewDay
        ? (prev.lastDay === yest ? prev.streak + 1 : 1)
        : (prev.streak === 0 ? 1 : prev.streak);

      // Same display rule as the manual tap path — hold the visible
      // count at target on completion so "108" is shown, then next tap
      // is bead 1 of the next mala (no double-credit).
      const wasAtTarget = prev.count >= target;
      let count = wasAtTarget ? 1 : prev.count + 1;
      let malas = prev.malas;
      let todayMalas = isNewDay ? 0 : prev.todayMalas;
      let todayCount = (isNewDay ? 0 : prev.todayCount) + 1;

      if (!wasAtTarget && count >= target) {
        malas += 1;
        todayMalas += 1;
        count = target;
      }

      return {
        ...prev,
        count, malas,
        total: prev.total + 1,
        todayDate: t, todayCount, todayMalas,
        streak: newStreak, lastDay: t,
      };
    });
  }, [target, vibrationOn, mantra.label, mantra.id, soundOn, triggerPaceHint, commitTick]);

  // — Undo last tap. Long-press the orb (~600ms) and the existing Undo
  //   button both call this. Handles four cases:
  //     1. Holding at target (108): drop to 107, uncredit the mala.
  //     2. At bead 1 of a new mala with prior malas: step back to 108
  //        of the previous mala (mala count stays — that one is real).
  //     3. Mid-mala (count > 1): simple decrement.
  //     4. count === 0 with prior malas: peel one mala back to 107.
  //   Also rolls back the streak credit when today's tap count zeros
  //   out (mirroring the original undo logic).
  const undoLastTap = useCallback(() => {
    setPersist((prev) => {
      if (prev.total <= 0) return prev;
      let count = prev.count;
      let malas = prev.malas;
      let todayMalas = prev.todayMalas;
      if (prev.count >= target) {
        count = target - 1;
        malas = Math.max(0, malas - 1);
        todayMalas = Math.max(0, todayMalas - 1);
      } else if (prev.count <= 1 && prev.malas > 0) {
        // Bead 0 or 1 of a new mala with prior malas → display the prior
        // mala's 108. The mala is still completed; we only re-show it.
        count = target;
      } else if (prev.count > 0) {
        count = prev.count - 1;
      } else if (prev.malas > 0) {
        // count === 0 and never wrapped to a new mala (no prior 1-tap).
        // Peel a full mala back so undo always has somewhere to go.
        count = target - 1;
        malas = Math.max(0, malas - 1);
        todayMalas = Math.max(0, todayMalas - 1);
      } else {
        return prev;
      }
      const nextTodayCount = Math.max(0, prev.todayCount - 1);
      // Roll back today's streak credit if undo zeroes out today's
      // activity — same rule as the original Undo button.
      let streak = prev.streak;
      let lastDay = prev.lastDay;
      if (nextTodayCount === 0 && prev.todayCount > 0) {
        streak = Math.max(0, prev.streak - 1);
        lastDay = streak === 0 ? null : yesterday();
      }
      return {
        ...prev,
        count, malas, todayMalas,
        todayCount: nextTodayCount,
        total: Math.max(0, prev.total - 1),
        streak, lastDay,
      };
    });
    // Cancel any pending mala-complete celebration if we just undid the
    // 108-bead tap — the celebration was scheduled but the mala is no
    // longer complete.
    setCelebration(null);
    setFullMalaBloom(null);
  }, [target]);

  // Long-press detection on the orb. We track a timer + a "fired" flag.
  // If the user holds for 600ms, undo fires and the upcoming click is
  // suppressed. A normal tap (release before 600ms) clears the timer
  // and the click handler runs as before.
  const longPressTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressFiredRef = useRef(false);
  const handleOrbPointerDown = useCallback(() => {
    longPressFiredRef.current = false;
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
    longPressTimerRef.current = setTimeout(() => {
      longPressFiredRef.current = true;
      undoLastTap();
      vibrate([20, 30, 20], vibrationOn);
      if (soundOn) bellPlayer.tap(0);
    }, 600);
  }, [undoLastTap, vibrationOn, soundOn]);
  const handleOrbPointerEnd = useCallback(() => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);
  useEffect(() => () => {
    if (longPressTimerRef.current) clearTimeout(longPressTimerRef.current);
  }, []);

  // Tap dispatcher used by the main mala press button. When auto-chant is
  // armed but not yet running, the first tap kicks off the loop. Otherwise
  // it falls through to the normal manual tap.
  const handleTapOrAutoStart = useCallback(() => {
    // First tap of the session → run pranayama instead of counting.
    // The breathing overlay calls back into normal tap behaviour once
    // it finishes (or the devotee skips it).
    if (!breathingDoneThisSessionRef.current && !breathingActive) {
      setBreathingActive(true);
      setBreathTick(0);
      return;
    }
    if (breathingActive) return;
    if (autoMode && !autoChantingRef.current) {
      if (!soundOn || !mantraAudio.has(mantra.id)) {
        toast({
          title: "Auto-chant unavailable",
          description: !soundOn
            ? "Turn Sound on to let the chant play."
            : "This mantra has no recorded chant yet — try Mahamrityunjaya.",
          variant: "destructive",
        });
        setAutoMode(false);
        return;
      }
      setAutoChanting(true);
      return;
    }
    tap();
  }, [autoMode, soundOn, mantra.id, toast, tap]);

  // Shake-to-count: useShakeToJapa fires this CustomEvent on every clean
  // shake while the devotee is on /japa. We treat it like a manual tap —
  // includes the auto-chant gating + the tap()'s 250ms debounce.
  useEffect(() => {
    const onShake = () => handleTapOrAutoStart();
    window.addEventListener("vt:japa-shake-tap", onShake);
    return () => window.removeEventListener("vt:japa-shake-tap", onShake);
  }, [handleTapOrAutoStart]);

  // Full-mala bloom trigger — when a mala completes (celebration is
  // set by the tap/auto-chant paths), light up the orb with the gold
  // radial flash + slow pulse for 2.4s. Independent of the Tathastu
  // overlay so the bloom plays even if the user dismisses early.
  useEffect(() => {
    if (!celebration) return;
    setFullMalaBloom(celebration.ts);
    const id = setTimeout(() => setFullMalaBloom(null), 2400);
    return () => clearTimeout(id);
  }, [celebration]);

  // Mala completion → Tathastu blessing. The old celebration fanfare
  // overlay was retired (it competed with the divine ashirvad for the
  // moment of completion). Now the aarti chime plays as the count flips,
  // and ~600 ms later the Tathastu blessing rises — one sacred handoff.
  // `celebration` lives on purely as the scheduling trigger.
  // Auto-reset: ~4s after the mala closes we silently roll the visible
  // count back to 0 so when the devotee dismisses the ashirvad the orb
  // is already showing a fresh mala. malasCompleted / total are
  // untouched (those were credited at the moment of completion).
  useEffect(() => {
    if (!celebration) return;
    setCelebrationExiting(false);
    const ashirvadId = setTimeout(() => {
      setAshirvad({
        mantraLabel: celebration.mantraLabel,
        mantraId: celebration.mantraId,
        ts: Date.now(),
      });
    }, 600);
    const id = setTimeout(() => {
      setCelebration(null);
    }, 900);
    const resetId = setTimeout(() => {
      setPersist((prev) => (prev.count >= target ? { ...prev, count: 0 } : prev));
      setSessionStartTs(null);
    }, 4000);
    return () => {
      clearTimeout(id);
      clearTimeout(ashirvadId);
      clearTimeout(resetId);
    };
  }, [celebration, target]);

  // Share the divine blessing — separate copy from the mantra share so
  // the recipient gets the ashirvad, not just the chant link.
  const shareBlessing = useCallback(async (sanskrit: string, english: string) => {
    const url = typeof window !== "undefined" ? window.location.href : "";
    const text = `तथास्तु — A blessing for you from Lord Shiva.\n\n${sanskrit}\n\n${english}\n\nReceived after a sacred mala on Vedic Tatva.\n${url}`;
    try {
      if (typeof navigator !== "undefined" && "share" in navigator) {
        await (navigator as any).share({ title: "तथास्तु — A blessing for you", text });
        return;
      }
    } catch (err: any) {
      if (err && err.name === "AbortError") return;
      // fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(text);
      toast({ title: "Blessing copied", description: "Share it with someone you love." });
    } catch {
      toast({ title: "Could not share", description: "Please try again.", variant: "destructive" });
    }
  }, [toast]);

  // The legacy Undo button delegates to the same undoLastTap callback
  // used by long-press, so both undo paths produce identical state
  // transitions (and both correctly handle the new "hold count at
  // target" wrap rule that was added when the counter started showing
  // 108 instead of wrapping to 0).
  const undo = undoLastTap;

  const resetMala = () => {
    // Hard-stop any in-flight chant audio so the devotee doesn't hear
    // the previous bead finish chanting after the count returns to 0.
    // Without this the user hits Reset, sees "0" but the mantra audio
    // (which can run several seconds per bead) keeps playing — visually
    // inconsistent and acoustically jarring. The synthesized bell is a
    // ~200 ms one-shot so it doesn't need an explicit stop.
    try { mantraAudio.stop(); } catch {}
    setPersist((prev) => ({ ...prev, count: 0 }));
    setSessionStartTs(null);
    setMilestoneFlash(null);
    toast({ title: "Mala reset", description: "Current mala count cleared." });
  };

  const resetAll = () => {
    if (!confirm(`Reset ALL stats for "${mantra.label}"? This cannot be undone.`)) return;
    try { mantraAudio.stop(); } catch {}
    setPersist(emptyPersist());
    toast({ title: "Stats reset" });
  };

  const addCustomMantra = () => {
    const name = newName.trim();
    if (!name) return;
    const id = `custom-${Date.now()}`;
    const next = [...customMantras, { id, label: name, sanskrit: newSanskrit.trim() || undefined, custom: true }];
    setCustomMantras(next);
    try { localStorage.setItem(`${STORAGE_PREFIX}:custom:${ownerKey}`, JSON.stringify(next)); } catch {}
    setMantraId(id);
    setShowAdd(false); setNewName(""); setNewSanskrit("");
    toast({ title: "Mantra added" });
  };

  const removeCustomMantra = (id: string) => {
    if (!confirm("Remove this custom mantra and its counts?")) return;
    const next = customMantras.filter((m) => m.id !== id);
    setCustomMantras(next);
    try {
      localStorage.setItem(`${STORAGE_PREFIX}:custom:${ownerKey}`, JSON.stringify(next));
      localStorage.removeItem(`${STORAGE_PREFIX}:data:${ownerKey}:${id}`);
    } catch {}
    if (mantraId === id) setMantraId(PRESET_MANTRAS[0].id);
  };

  const applyCustomTarget = () => {
    const n = parseInt(customTarget, 10);
    if (!Number.isFinite(n) || n < 1 || n > 100000) {
      toast({ title: "Enter a number between 1 and 100,000", variant: "destructive" });
      return;
    }
    setTarget(n);
    setShowCustomTarget(false);
    setCustomTarget("");
  };

  // ===== Favourite / daily-ritual / share =====
  // All scoped to the active mantra. Favourites are a small set; daily-ritual
  // is a single id (the mantra the devotee wants to chant every day).
  const isFav = favorites.includes(mantra.id);
  const isDaily = dailyRitual === mantra.id;

  const toggleFavorite = useCallback(() => {
    setFavorites((prev) => {
      const had = prev.includes(mantra.id);
      const next = had ? prev.filter((x) => x !== mantra.id) : [...prev, mantra.id];
      saveFavorites(ownerKey, next);
      toast({
        title: had ? "Removed from favourites" : "Added to favourites",
        description: mantra.label,
      });
      return next;
    });
  }, [mantra.id, mantra.label, ownerKey, toast]);

  const toggleDailyRitual = useCallback(() => {
    setDailyRitual((prev) => {
      const next = prev === mantra.id ? null : mantra.id;
      saveDailyRitual(ownerKey, next);
      toast({
        title: next ? "Daily ritual set" : "Daily ritual cleared",
        description: next
          ? `${mantra.label} will be your daily mantra.`
          : "You can set a different mantra as your daily ritual anytime.",
      });
      return next;
    });
  }, [mantra.id, mantra.label, ownerKey, toast]);

  const shareMantra = useCallback(async () => {
    const sa = mantra.sanskrit ? `\n${mantra.sanskrit}` : "";
    const title = `Chant ${mantra.label} with me`;
    const text = `${mantra.label}${sa}\n\nJoin me in chanting on Vedic Tatva — a sacred mantra a day keeps the soul aligned.`;
    const url = typeof window !== "undefined" ? window.location.href : "https://vedictatva.com";

    // Try the native share sheet first (great on mobile + modern desktop).
    try {
      const navAny = navigator as any;
      if (navAny && typeof navAny.share === "function") {
        await navAny.share({ title, text, url });
        return;
      }
    } catch (e: any) {
      // User dismissed the sheet — that's not a failure, don't fall through.
      if (e && e.name === "AbortError") return;
      // Any other error (NotAllowedError, permission policy, etc.) → fall
      // through and try the clipboard so the share still has *some* path.
    }
    // Fallback: copy a tidy share blob to the clipboard.
    try {
      await navigator.clipboard.writeText(`${text}\n${url}`);
      toast({
        title: "Link copied",
        description: "Paste it in any chat to share this mantra.",
      });
    } catch {
      toast({
        title: "Couldn't open share sheet",
        description: "Copy the page URL manually to share.",
        variant: "destructive",
      });
    }
  }, [mantra.label, mantra.sanskrit, toast]);

  // Spacebar / Enter to count (when not focused on a control)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.code !== "Enter") return;
      const t = e.target as HTMLElement | null;
      if (t) {
        if (/^(INPUT|TEXTAREA|SELECT|BUTTON|A)$/.test(t.tagName)) return;
        if (t.isContentEditable) return;
        const role = t.getAttribute("role");
        if (role === "button" || role === "link" || role === "checkbox" || role === "switch") return;
      }
      e.preventDefault();
      tap();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [tap]);

  // ===== Mala garland sizing (108-bead SVG renders into a square box) =====
  // Responsive: shrinks on narrow screens so the orb never touches the
  // absolutely-positioned vertical toggle strip on the left wall.
  const [ringSize, setRingSize] = useState<number>(() => {
    if (typeof window === "undefined") return 280;
    return window.innerWidth < 480 ? 220 : 280;
  });
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onResize = () => setRingSize(window.innerWidth < 480 ? 220 : 280);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  const RING_SIZE = ringSize;

  return (
    <div className="space-y-4" data-testid="jap-counter">
      {/* The mala-completion fanfare overlay was retired — the aarti chime
          plays, then the divine Tathastu blessing rises. One sacred moment,
          not two competing notifications. The `celebration` state is kept
          purely as the trigger that schedules the ashirvad. */}
      {ashirvad && (
        <TathastuBlessing
          mantraLabel={ashirvad.mantraLabel}
          mantraId={ashirvad.mantraId}
          devoteeName={devoteeName}
          onShare={(s, e) => shareBlessing(s, e)}
          onDismiss={() => setAshirvad(null)}
        />
      )}

      {/* Pre-chant 4-7-8 pranayama — modal popup so the breathing UI has
          its own canvas instead of cramming inside the orb. Auto-runs
          once per session on the first orb tap; "Skip" closes it and
          counting begins. Closing the dialog (Esc / overlay click) is
          treated as Skip so the devotee never gets locked out. */}
      <Dialog
        open={breathingActive}
        onOpenChange={(open) => { if (!open) skipBreathing(); }}
      >
        <DialogContent
          className="w-[20rem] h-[20rem] sm:w-[24rem] sm:h-[24rem] max-w-none bg-gradient-to-br from-[#6D2B35] to-[#2a0d12] border-[#D4AF37]/40 text-[#FFFAEC] p-0 overflow-hidden rounded-full shadow-[0_0_60px_-10px_rgba(212,175,55,0.45)] [&>button]:hidden"
          data-testid="dialog-pranayama"
        >
          {(() => {
            const elapsed = breathTick;
            const totalRemain = Math.max(0, Math.ceil((BREATH_TOTAL_MS - elapsed) / 1000));
            const t = elapsed % BREATH_CYCLE_MS;
            let phase: "Inhale" | "Hold" | "Exhale";
            let phaseRemain: number;
            let auraScale: number;
            if (t < 4000) {
              phase = "Inhale";
              phaseRemain = Math.max(1, Math.ceil((4000 - t) / 1000));
              auraScale = 0.78 + (t / 4000) * 0.27;
            } else if (t < 11000) {
              phase = "Hold";
              phaseRemain = Math.max(1, Math.ceil((11000 - t) / 1000));
              auraScale = 1.05;
            } else {
              phase = "Exhale";
              phaseRemain = Math.max(1, Math.ceil((19000 - t) / 1000));
              auraScale = 1.05 - ((t - 11000) / 8000) * 0.27;
            }
            const cycleNum = Math.min(3, Math.floor(elapsed / BREATH_CYCLE_MS) + 1);
            return (
              <div className="relative w-full h-full flex flex-col items-center justify-center text-center px-6 py-6">
                <DialogTitle className="sr-only">Pranayama breathing</DialogTitle>
                <DialogDescription className="sr-only">
                  60-second 4-7-8 breathing exercise before chanting begins.
                </DialogDescription>
                <div className="text-[9px] sm:text-[10px] uppercase tracking-[0.3em] text-[#D4AF37] font-semibold">
                  Pranayama · {cycleNum}/3
                </div>
                <div
                  className="relative my-3 sm:my-4 w-32 h-32 sm:w-40 sm:h-40 rounded-full flex items-center justify-center"
                  style={{
                    background: "radial-gradient(circle, rgba(212,175,55,0.22) 0%, rgba(212,175,55,0.08) 55%, transparent 80%)",
                  }}
                  aria-hidden="true"
                >
                  <div
                    className="absolute inset-0 rounded-full border border-[#D4AF37]/40 transition-transform duration-1000 ease-in-out"
                    style={{ transform: `scale(${auraScale})` }}
                  />
                  <div className="relative flex flex-col items-center">
                    <div className="text-lg sm:text-xl font-serif font-bold text-[#FFFAEC]" data-testid="text-breath-phase">
                      {phase}
                    </div>
                    <div className="text-5xl sm:text-6xl font-serif font-bold tabular-nums text-[#FFEBB0] leading-none mt-0.5" data-testid="text-breath-countdown">
                      {phaseRemain}
                    </div>
                  </div>
                </div>
                <div className="text-[11px] sm:text-xs text-[#FFEBB0]/90 max-w-[14rem] leading-snug">
                  {phase === "Inhale" ? "Breathe in slowly through the nose"
                    : phase === "Hold" ? "Hold gently · settle the mind"
                    : "Release slowly through the mouth"}
                </div>
                <div className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37]/70 mt-2">
                  {totalRemain}s until chanting
                </div>
                <button
                  type="button"
                  onClick={skipBreathing}
                  className="mt-3 text-[11px] uppercase tracking-[0.16em] font-semibold px-3.5 py-1.5 rounded-full border border-[#D4AF37]/55 text-[#FFEBB0] hover:bg-[#D4AF37]/15 transition-colors"
                  data-testid="btn-skip-breathing"
                  aria-label="Skip breathwork and begin chanting now"
                >
                  Skip · Begin
                </button>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
      {/* Header — replaces the previous "Begin Your Sādhanā" + Focus mode
          + favourite/daily/share cluster with a single, calm centered
          title block. The page H1 was promoted up here as the SEO heading,
          and Focus mode + the per-mantra quick actions were retired in
          favour of the orb being the sole hero. */}
      {!embedded && <header className="text-center px-2 pt-1 pb-1">
        <h1
          className="text-2xl sm:text-3xl font-serif font-bold text-[#4a1a22] tracking-tight"
          data-testid="text-counter-h1"
        >
          {title}
        </h1>
        {subtitle && (
          <p className="mt-1 text-[12.5px] sm:text-sm text-[#5a4a3a]/75 leading-relaxed max-w-md mx-auto">
            {subtitle}
          </p>
        )}
      </header>}

      {/* Sankalpa — today's intention. One short line, persisted per day.
          Sits between the title and the orb so the devotee names what
          they're chanting for before the first bead. Empty by default;
          collapses gracefully on mobile. */}
      <div className="mx-auto w-full max-w-md px-2">
        <label
          htmlFor={`sankalpa-${ownerKey}`}
          className="block text-[10px] uppercase tracking-[0.22em] text-[#6D2B35]/65 font-bold mb-1 text-center"
        >
          Today I chant for
        </label>
        <input
          id={`sankalpa-${ownerKey}`}
          type="text"
          value={sankalpaToday}
          onChange={(e) => setSankalpaToday(e.target.value.slice(0, 80))}
          placeholder="peace · gratitude · a loved one's healing…"
          maxLength={80}
          className="w-full rounded-md border border-[#D4AF37]/35 bg-[#FFFAEC] px-3 py-1.5 text-sm text-[#4a1a22] text-center placeholder:text-[#5a4a3a]/40 focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/45 focus:border-[#D4AF37]/55"
          data-testid="input-sankalpa"
          aria-label="Today's intention for chanting"
        />
      </div>

      {fullscreen && (
        <FullscreenOverlay
          mantra={mantra}
          count={persist.count}
          target={target}
          malas={persist.malas}
          todayCount={persist.todayCount}
          soundOn={soundOn}
          vibrationOn={vibrationOn}
          wakeLockOn={wakeLockOn}
          onTap={handleTapOrAutoStart}
          audioLocked={audioLocked}
          syncTapsToAudio={syncTapsToAudio}
          paceHint={paceHint}
          onToggleSyncAudio={() => setSyncTapsToAudio((s) => !s)}
          autoChanting={autoChanting}
          autoMode={autoMode}
          onToggleAutoChant={toggleAutoMode}
          lyrics={lyrics}
          activeLyricIndex={activeLyricIndex}
          mysticBackdrop={true}
          isFavorite={isFav}
          isDailyRitual={isDaily}
          onUndo={undo}
          onResetMala={resetMala}
          onToggleSound={() => setSoundOn((s) => !s)}
          onToggleVibration={() => setVibrationOn((s) => !s)}
          onToggleWakeLock={() => { wakeLockOn ? void releaseWakeLock() : void acquireWakeLock(); }}
          onToggleFavorite={toggleFavorite}
          onToggleDailyRitual={toggleDailyRitual}
          onShare={shareMantra}
          petals={petals}
          milestoneFlash={milestoneFlash}
          sessionElapsedMs={sessionTickMs}
          meaning={meaningInfo}
          allMantras={ALL_MANTRAS}
          onChangeMantra={(id) => { if (!audioLocked) setMantraId(id); }}
          streak={persist.streak}
          onClose={() => { void exitFullscreen(); void releaseWakeLock(); }}
        />
      )}

      {/* Mantra select + Mala size + custom-mantra editor were moved BELOW
          the Counter so the orb is the first interactive element on the
          page. The picker is still one tap away — see the Mantra select
          Card rendered after the Counter further down. */}

      {/* Counter */}
      <Card className="overflow-hidden">
        <CardContent className="p-4 sm:p-6">
          <div className="flex flex-col items-center select-none">
            <div className="relative flex flex-row items-center justify-center w-full">
              {/* Toggle strip — always vertical, pinned to the left wall. Orb stays centered in the card. Sound / Vibration / Sync to audio / Auto-chant / Mix all. */}
              <div className="absolute left-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 shrink-0 z-10" role="group" aria-label="Counter controls" data-testid="counter-toggle-strip">
                <Button
                  size="icon"
                  variant={soundOn ? "default" : "outline"}
                  className={soundOn ? "bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" : ""}
                  onClick={() => setSoundOn((s) => !s)}
                  aria-pressed={soundOn}
                  aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
                  title={`Sound: ${soundOn ? "On" : "Off"}`}
                  data-testid="btn-toggle-sound"
                >
                  {soundOn ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={vibrationOn ? "default" : "outline"}
                  className={vibrationOn ? "bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" : ""}
                  onClick={() => {
                    setVibrationOn((s) => {
                      const next = !s;
                      if (next) {
                        const ok = vibrate([40, 60, 40, 60, 80], true);
                        if (!ok) {
                          toast({
                            title: "Vibration not available",
                            description: "Your browser blocked the haptic motor. iPhones and most in-app browsers (Instagram / Facebook) don't allow it — try opening this page in Chrome, and check that battery saver isn't on.",
                            variant: "destructive",
                          });
                        }
                      }
                      return next;
                    });
                  }}
                  aria-pressed={vibrationOn}
                  aria-label={vibrationOn ? "Turn vibration off" : "Turn vibration on"}
                  title={`Vibration: ${vibrationOn ? "On" : "Off"}`}
                  data-testid="btn-toggle-vibrate"
                >
                  {vibrationOn ? <Vibrate className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={syncTapsToAudio ? "default" : "outline"}
                  className={syncTapsToAudio ? "bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" : ""}
                  onClick={() => setSyncTapsToAudio((s) => !s)}
                  aria-pressed={syncTapsToAudio}
                  aria-label={syncTapsToAudio ? "Stop syncing taps to audio" : "Sync taps to audio"}
                  title={`Sync to audio: ${syncTapsToAudio ? "On" : "Off"} — when on, the press button waits for each chant to finish before accepting the next tap.`}
                  data-testid="btn-toggle-sync-audio"
                >
                  <Headphones className="h-4 w-4" />
                </Button>
                <Button
                  size="icon"
                  variant={autoMode ? "default" : "outline"}
                  className={autoMode ? "bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" : ""}
                  onClick={toggleAutoMode}
                  aria-pressed={autoMode}
                  aria-label={autoMode ? "Stop auto-chant" : "Arm auto-chant"}
                  title={`Auto-chant: ${autoMode ? "On" : "Off"} — arm hands-free chanting; tap the mala to start.`}
                  data-testid="btn-toggle-auto-chant"
                >
                  {autoMode ? <Square className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
                <Button
                  size="icon"
                  variant={mixMode ? "default" : "outline"}
                  className={mixMode ? "bg-[#D4AF37] hover:bg-[#D4AF37] text-[#6D2B35]" : ""}
                  onClick={() => setMixMode((m) => !m)}
                  aria-pressed={mixMode}
                  aria-label={mixMode ? "Stop mixing all mantras" : "Mix all mantras during auto-chant"}
                  title={`Mix all: ${mixMode ? "On" : "Off"} — cycle through every mantra during auto-chant.`}
                  data-testid="btn-toggle-mix-mode"
                >
                  <Shuffle className="h-4 w-4" />
                </Button>
              </div>
            <div className="relative shrink-0 animate-japa-orb-enter" style={{ width: RING_SIZE, height: RING_SIZE, maxWidth: "100%" }}>
              {/* Devanagari watermark — large, very low opacity, sits behind
                  the mala garland. Reinforces the active mantra subliminally
                  and adds depth. Pointer-events disabled so it never blocks
                  the tap target. Hidden when the orb is in the auto-chant
                  prompt state to avoid clashing with the in-orb Sanskrit. */}
              {mantra.sanskrit && !(autoMode && !autoChanting) && (
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center overflow-hidden"
                  data-testid="orb-devanagari-watermark"
                >
                  <span
                    className="text-[#6D2B35] opacity-[0.05] font-bold leading-none whitespace-nowrap select-none"
                    style={{
                      fontFamily: "'Tiro Devanagari Sanskrit', serif",
                      fontSize: `${Math.round(RING_SIZE * 0.42)}px`,
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {mantra.sanskrit.split(/\s+/)[0] || mantra.sanskrit}
                  </span>
                </div>
              )}
              {/* 108-bead mala garland (with breath-pacing aura). */}
              <MalaGarland
                count={persist.count}
                target={target}
                fillColor={getMantraTheme(mantra.id).accent}
                restColor="#E9DEC3"
                withBreathAura={!autoChanting}
                viewBoxSize={RING_SIZE}
                beadR={3.5}
                guruR={6.5}
              />
              <button
                type="button"
                onClick={() => {
                  // Suppress the synthetic click that follows a long-press
                  // (PointerDown → 600ms timer → undo → PointerUp → click).
                  if (longPressFiredRef.current) {
                    longPressFiredRef.current = false;
                    return;
                  }
                  handleTapOrAutoStart();
                }}
                onPointerDown={handleOrbPointerDown}
                onPointerUp={handleOrbPointerEnd}
                onPointerLeave={handleOrbPointerEnd}
                onPointerCancel={handleOrbPointerEnd}
                disabled={autoChanting || (audioLocked && syncTapsToAudio)}
                aria-busy={(autoChanting || (audioLocked && syncTapsToAudio)) || undefined}
                className={`absolute inset-7 rounded-full bg-gradient-to-br from-[#6D2B35] to-[#4a1a22] shadow-lg flex flex-col items-center justify-center text-center text-[#FFFAEC] transition-transform focus:outline-none focus:ring-4 focus:ring-[#D4AF37]/50 ${fullMalaBloom !== null ? "animate-japa-full-mala-pulse " : ""}${autoChanting || (audioLocked && syncTapsToAudio) ? "opacity-80 cursor-wait" : "active:scale-[0.97]"}`}
                aria-label={autoMode && !autoChanting ? "Tap to start auto-chant" : autoChanting ? "Auto-chant is playing — press Stop to chant manually" : (audioLocked && syncTapsToAudio ? "Mantra audio playing — please wait" : "Count one japa")}
                data-testid="btn-tap"
              >
                {autoMode && !autoChanting ? (
                  <>
                    {mantra.sanskrit && (
                      <div
                        className="text-sm sm:text-base leading-tight text-[#FFFAEC] px-3 mb-1.5 line-clamp-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                        style={{ fontFamily: "'Tiro Devanagari Sanskrit', serif" }}
                        data-testid="text-orb-sanskrit"
                      >
                        {mantra.sanskrit}
                      </div>
                    )}
                    <div className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">Auto-chant</div>
                    <div className="text-2xl sm:text-3xl font-semibold font-serif text-[#FFFAEC]">Tap to start</div>
                    <div className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#D4AF37]">{target} chants</div>
                  </>
                ) : (
                  <>
                    {mantra.sanskrit && (
                      <div
                        className="text-sm sm:text-base leading-tight text-[#FFFAEC] px-3 mb-1.5 line-clamp-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]"
                        style={{ fontFamily: "'Tiro Devanagari Sanskrit', serif" }}
                        data-testid="text-orb-sanskrit"
                      >
                        {mantra.sanskrit}
                      </div>
                    )}
                    <div className="text-[11px] sm:text-xs uppercase tracking-[0.28em] text-[#D4AF37] font-semibold">Mala</div>
                    <div className="text-5xl sm:text-6xl font-bold font-serif tabular-nums text-[#FFFAEC]" data-testid="text-count">{persist.count}</div>
                    <div className="text-[11px] sm:text-xs uppercase tracking-[0.22em] text-[#D4AF37]">of {target}</div>
                  </>
                )}
              </button>
              {/* Pace pulse — gentle gold ring flash when tapping faster than a chant cycle. */}
              {paceHint && (
                <div
                  className="absolute inset-3 rounded-full pointer-events-none ring-2 ring-[#D4AF37]/70 animate-pulse"
                  aria-hidden="true"
                  data-testid="ring-pace-hint"
                />
              )}
              {/* Quarter-mala milestone bloom — fires on 27 / 54 / 81. */}
              {milestoneFlash !== null && (
                <MilestoneBloom
                  key={`milestone-${milestoneFlash}-${persist.malas}`}
                  accent={getMantraTheme(mantra.id).accent}
                />
              )}
              {/* Full-mala bloom — bigger gold flash when 108 closes. */}
              {fullMalaBloom !== null && (
                <FullMalaBloom key={`fullbloom-${fullMalaBloom}`} />
              )}
              {/* Lotus petals drifting up from each tap. */}
              {petals.map((pp) => (
                <LotusPetal key={pp.id} x={pp.x} color={getMantraTheme(mantra.id).accent} />
              ))}
            </div>
            </div>

            <div className="mt-3 text-xs text-[#5a4a3a]/70" data-testid="text-tap-hint">
              {autoMode && !autoChanting
                ? `Auto-chant is armed — tap the mala to begin. The chant will play and count itself to ${target}.`
                : autoChanting
                ? "Auto-chant is on — the mantra is reciting and counting itself. Press Stop anytime."
                : audioLocked && syncTapsToAudio
                ? "Listening to the mantra… next press will unlock when the chant finishes."
                : audioLocked
                ? "Chant is playing — keep tapping at your own pace."
                : "Tap the mala (or press Space) to count one japa · Hold to undo"}
            </div>

            <div className="mt-3 flex items-center gap-2 flex-wrap justify-center">
              <Badge className="bg-[#D4AF37]/25 text-[#6D2B35] hover:bg-[#D4AF37]/25" data-testid="badge-malas">
                <Trophy className="h-3 w-3 mr-1" />
                {persist.malas} malas completed
              </Badge>
              <Badge variant="outline" className="border-[#D4AF37]/40" data-testid="badge-total">
                {persist.total.toLocaleString("en-IN")} japas total
              </Badge>
              {sessionStartTs !== null && (
                <Badge variant="outline" className="border-[#D4AF37]/40" data-testid="badge-dhyana">
                  <Flame className="h-3 w-3 mr-1" />
                  {formatDhyana(sessionTickMs)}
                </Badge>
              )}
              {/* Mantra meaning — demoted from a full-width disclosure pill
                  to a tiny (?) icon button beside the badges. Keeps the
                  orb the visual centerpiece; meaning is one tap away. */}
              {meaningInfo && (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  onClick={() => setShowMeaning((s) => !s)}
                  className="h-9 w-9 rounded-full text-[#6D2B35]/70 hover:text-[#6D2B35]"
                  aria-expanded={showMeaning}
                  aria-label={showMeaning ? "Hide mantra meaning" : "What does this mantra mean?"}
                  title="What does this mantra mean?"
                  data-testid="btn-toggle-meaning"
                >
                  <Info className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>

            {/* Inline meaning panel — opens directly from the (?) icon
                above. Hidden by default; resets on mantra change. */}
            {meaningInfo && showMeaning && (
              <div
                className="mt-3 w-full max-w-md rounded-md border border-[#D4AF37]/25 bg-[#FBF7EE] px-3 py-3 text-sm text-[#5a4a3a] leading-relaxed"
                data-testid="text-mantra-meaning"
              >
                <p className="font-serif italic text-[#6D2B35]">
                  {meaningInfo.meaning}
                </p>
                {meaningInfo.deity && (
                  <p className="mt-2 text-xs text-[#5a4a3a]/80">
                    <span className="font-bold uppercase tracking-wide text-[#6D2B35]/70">Deity · </span>
                    {meaningInfo.deity}
                  </p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* LED caption strip — its own segment directly beneath the orb card.
          Always visible (no toggle) so the devotee can chant along without
          digging through controls. */}
      <div className="-mx-2 sm:mx-0" data-testid="led-caption-segment">
        <LedCaptionStrip mantra={mantra} />
      </div>

      {/* Stats pill bar — single horizontal strip beneath the orb */}
      <div
        className="flex flex-wrap items-center justify-between gap-x-5 gap-y-2 rounded-xl border border-[#D4AF37]/30 bg-[#FFFAEC] px-4 py-3 text-[#4a1a22]"
        role="group"
        aria-label="Counter stats"
        data-testid="counter-stats-bar"
      >
        <div className="flex items-center gap-1.5 min-w-0" data-testid="stat-today">
          <Sparkles className="h-3.5 w-3.5 text-[#6D2B35]/70 shrink-0" />
          <span className="text-[10px] uppercase tracking-wide font-bold text-[#5a4a3a]/65">Today</span>
          <span className="text-sm font-bold tabular-nums">{persist.todayCount.toLocaleString("en-IN")}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0" data-testid="stat-malas-today">
          <Trophy className="h-3.5 w-3.5 text-[#6D2B35]/70 shrink-0" />
          <span className="text-[10px] uppercase tracking-wide font-bold text-[#5a4a3a]/65">Malas</span>
          <span className="text-sm font-bold tabular-nums">{persist.todayMalas}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0" data-testid="stat-streak">
          <Flame className="h-3.5 w-3.5 text-[#6D2B35]/70 shrink-0" />
          <span className="text-[10px] uppercase tracking-wide font-bold text-[#5a4a3a]/65">Streak</span>
          <span className="text-sm font-bold tabular-nums">{persist.streak}</span>
        </div>
        <div className="flex items-center gap-1.5 min-w-0" data-testid="stat-lifetime">
          <Trophy className="h-3.5 w-3.5 text-[#6D2B35]/70 shrink-0" />
          <span className="text-[10px] uppercase tracking-wide font-bold text-[#5a4a3a]/65">Lifetime</span>
          <span className="text-sm font-bold tabular-nums">{persist.total.toLocaleString("en-IN")} · {persist.malas}m</span>
        </div>
      </div>

      {/* Slim actions row */}
      <Card>
        <CardContent className="p-3">
          <div className="flex items-center gap-2 flex-wrap">
            <Button size="sm" variant="ghost" onClick={undo} disabled={persist.total === 0 || (audioLocked && syncTapsToAudio)} data-testid="btn-undo">
              <Undo2 className="h-3.5 w-3.5 mr-1" />Undo
            </Button>
            <Button size="sm" variant="outline" onClick={resetMala} data-testid="btn-reset-mala">
              <RotateCcw className="h-3.5 w-3.5 mr-1" />Reset mala
            </Button>
            <Button size="sm" variant="ghost" onClick={resetAll} className="text-rose-700" data-testid="btn-reset-all">
              <Trash2 className="h-3.5 w-3.5 mr-1" />Reset all
            </Button>
            <div className="text-[11px] text-[#5a4a3a]/55 leading-relaxed flex-1 min-w-[180px]">
              Counts are saved on this device only. Each mantra keeps its own count.
              {!("vibrate" in navigator) && " Your device does not support vibration."}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mantra select + Mala size — relocated from above the Counter so the
          orb sits at the top of the card. The picker still feels native to
          the counter (same card surface, same colours) but is one scroll
          below the orb instead of pushing it down on mobile. */}
      <Card data-testid="card-mantra-picker">
        <CardContent className="p-3 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <label className="text-[11px] uppercase tracking-wide font-bold text-[#5a4a3a]/70">Mantra</label>
            <select
              value={mantraId}
              onChange={(e) => setMantraId(e.target.value)}
              disabled={audioLocked}
              className="flex-1 min-w-[200px] h-9 rounded-md border border-input bg-background px-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
              data-testid="select-mantra"
            >
              <optgroup label="Sacred mantras">
                {PRESET_MANTRAS.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
              </optgroup>
              {customMantras.length > 0 && (
                <optgroup label="My mantras">
                  {customMantras.map((m) => <option key={m.id} value={m.id}>{m.label}</option>)}
                </optgroup>
              )}
            </select>
          </div>
          <div className="flex items-center gap-2 flex-wrap pt-1">
            <label className="text-[11px] uppercase tracking-wide font-bold text-[#5a4a3a]/70">Mala size</label>
            {TARGET_OPTIONS.map((n) => (
              <Button
                key={n}
                size="sm"
                variant={target === n ? "default" : "outline"}
                className={target === n ? "bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" : ""}
                onClick={() => setTarget(n)}
                data-testid={`btn-target-${n}`}
              >{n}</Button>
            ))}
            <Button
              size="sm"
              variant={!TARGET_OPTIONS.includes(target) ? "default" : "outline"}
              className={!TARGET_OPTIONS.includes(target) ? "bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" : ""}
              onClick={() => setShowCustomTarget((s) => !s)}
              data-testid="btn-target-custom"
            >
              {!TARGET_OPTIONS.includes(target) ? `Custom (${target})` : "Custom"}
            </Button>
          </div>
          {showCustomTarget && (
            <div className="flex items-center gap-2">
              <Input type="number" min={1} max={100000} value={customTarget} onChange={(e) => setCustomTarget(e.target.value)} placeholder="e.g. 540" className="max-w-[160px]" data-testid="input-custom-target" />
              <Button size="sm" onClick={applyCustomTarget} data-testid="btn-apply-custom-target">Apply</Button>
            </div>
          )}
          <div className="flex items-center gap-2 flex-wrap pt-1 text-xs">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAdd((s) => !s)}
              className="h-7 px-2 text-[#6D2B35] hover:text-[#6D2B35]"
              data-testid="btn-add-mantra"
            >
              <Plus className="h-3.5 w-3.5 mr-1" />Add custom mantra
            </Button>
            {mantra.custom && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeCustomMantra(mantra.id)}
                className="h-7 px-2 text-rose-700 hover:text-rose-700"
                data-testid="btn-remove-mantra"
              >
                <Trash2 className="h-3.5 w-3.5 mr-1" />Remove this mantra
              </Button>
            )}
          </div>
          {showAdd && (
            <div className="rounded-md border border-[#D4AF37]/30 bg-[#FBF7EE] p-3 space-y-2">
              <Input placeholder="Mantra name (e.g., Om Tat Sat)" value={newName} onChange={(e) => setNewName(e.target.value)} data-testid="input-new-mantra-name" />
              <Input placeholder="Sanskrit / Devanagari (optional)" value={newSanskrit} onChange={(e) => setNewSanskrit(e.target.value)} data-testid="input-new-mantra-sanskrit" />
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancel</Button>
                <Button size="sm" onClick={addCustomMantra} className="bg-[#6D2B35] hover:bg-[#6D2B35] text-[#D4AF37]" data-testid="btn-save-mantra">Save mantra</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Stat({ icon, label, value, testId }: { icon: React.ReactNode; label: string; value: string; testId?: string }) {
  return (
    <Card data-testid={testId}>
      <CardContent className="p-3">
        <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wide font-bold text-[#5a4a3a]/65">{icon}{label}</div>
        <div className="text-lg font-bold text-[#4a1a22] mt-0.5 tabular-nums">{value}</div>
      </CardContent>
    </Card>
  );
}

// =====================================================================
// FullscreenOverlay — immersive single-tap chanting view.
// Covers the entire viewport, giant tap target, screen-lock toggle,
// minimal controls. The actual count/sound/vibration logic lives in
// the parent JapCounter — this is a presentational shell that calls
// callbacks.
// =====================================================================

type FullscreenOverlayProps = {
  mantra: { id: string; label: string; sanskrit?: string };
  count: number;
  target: number;
  malas: number;
  todayCount: number;
  soundOn: boolean;
  vibrationOn: boolean;
  wakeLockOn: boolean;
  onTap: () => void;
  audioLocked?: boolean;
  syncTapsToAudio?: boolean;
  paceHint?: boolean;
  onToggleSyncAudio?: () => void;
  autoChanting?: boolean;
  autoMode?: boolean;
  onToggleAutoChant?: () => void;
  lyrics?: { sa: string; iast: string; en: string }[] | null;
  activeLyricIndex?: number;
  mysticBackdrop?: boolean;
  isFavorite?: boolean;
  isDailyRitual?: boolean;
  onUndo: () => void;
  onResetMala: () => void;
  onToggleSound: () => void;
  onToggleVibration: () => void;
  onToggleWakeLock: () => void;
  onToggleFavorite?: () => void;
  onToggleDailyRitual?: () => void;
  onShare?: () => void;
  onClose: () => void;
  // Beautification hooks (108-bead garland + ambient effects).
  petals?: { id: number; x: number; ts: number }[];
  milestoneFlash?: number | null;
  sessionElapsedMs?: number;
  meaning?: { meaning: string; deity: string } | null;
  // Mantra picker (focus-mode change-without-exit). When provided,
  // a compact dropdown appears in the top bar; selecting a different
  // mantra swaps the chant + theme + deity portrait without leaving
  // focus mode.
  allMantras?: { id: string; label: string; sanskrit?: string }[];
  onChangeMantra?: (id: string) => void;
  // Streak (consecutive days with at least one mantra). Powers the
  // outermost MalaRing so the devotee feels their week-long sadhana
  // accruing visually, Apple-Activity-Rings style.
  streak?: number;
};

// Per-mantra deity backdrop themes. Every chant has its own atmosphere:
// background gradient, glow colour, central Devanagari glyph, ornament set
// (trishul + crescent + Kailash for Shiva-family, lotus + peacock + grove
// for Krishna-family, lotus + sun + lotus pond for the calmer mantras).
// Photographic Shiva image is reserved for Mahamrityunjaya so the rest of
// the experience stays light to render and ships no extra binary assets.
type MotifSet = "mountain" | "grove" | "lotus";
type DeityTheme = {
  glyph: string;          // big faint Devanagari glyph behind the ring
  glowRgb: string;        // "R,G,B" used inside rgba() for the central aura
  accent: string;         // hex stroke colour for ornaments
  bgFrom: string;         // outer-most full-screen gradient stop
  bgVia: string;
  bgTo: string;
  motifs: MotifSet;
};

const SHIVA_THEME: DeityTheme = {
  glyph: "ॐ", glowRgb: "212,175,55", accent: "#D4AF37",
  bgFrom: "#3a1218", bgVia: "#4a1a22", bgTo: "#2a0d12", motifs: "mountain",
};
const KRISHNA_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "127,216,200", accent: "#7FD8C8",
  bgFrom: "#0c2e2a", bgVia: "#143b36", bgTo: "#06211e", motifs: "grove",
};
const VISHNU_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "156,192,240", accent: "#9CC0F0",
  bgFrom: "#0e1f3a", bgVia: "#16294a", bgTo: "#0a1428", motifs: "grove",
};
const RAMA_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "240,168,90", accent: "#F0A85A",
  bgFrom: "#3a1c08", bgVia: "#4a2410", bgTo: "#2a1404", motifs: "mountain",
};
const GANESHA_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "240,128,96", accent: "#F08060",
  bgFrom: "#3a1410", bgVia: "#4a1c18", bgTo: "#2a0c08", motifs: "lotus",
};
const SURYA_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "255,201,90", accent: "#FFC95A",
  bgFrom: "#3a1f08", bgVia: "#4a2810", bgTo: "#2a1604", motifs: "lotus",
};
const BUDDHA_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "232,157,196", accent: "#E89DC4",
  bgFrom: "#2a1828", bgVia: "#3a2038", bgTo: "#1c0e1c", motifs: "lotus",
};
const SHANTI_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "200,220,236", accent: "#C8DCEC",
  bgFrom: "#1a2638", bgVia: "#202e44", bgTo: "#101824", motifs: "lotus",
};
const DURGA_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "212,175,55", accent: "#D4AF37",
  bgFrom: "#3a0e0e", bgVia: "#4a1414", bgTo: "#280808", motifs: "mountain",
};
const SARASWATI_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "236,238,250", accent: "#ECEEFA",
  bgFrom: "#1a2238", bgVia: "#222b46", bgTo: "#0e1424", motifs: "lotus",
};
const LAKSHMI_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "240,182,108", accent: "#F0B66C",
  bgFrom: "#3a1e08", bgVia: "#4a2a10", bgTo: "#2a1404", motifs: "lotus",
};
const HANUMAN_THEME: Omit<DeityTheme, "glyph"> = {
  glowRgb: "244,140,72", accent: "#F48C48",
  bgFrom: "#3a1408", bgVia: "#4a1c10", bgTo: "#2a0c04", motifs: "mountain",
};

const MANTRA_THEMES: Record<string, DeityTheme> = {
  "om-namah-shivaya":  SHIVA_THEME,
  "mahamrityunjaya":   { ...SHIVA_THEME },
  "hare-krishna":      { glyph: "क्लीं", ...KRISHNA_THEME },
  "om-namo-bhagavate": { glyph: "ॐ",     ...KRISHNA_THEME },
  "radhe-radhe":       { glyph: "राधे",  ...KRISHNA_THEME },
  "om-namo-narayanaya":{ glyph: "ॐ",     ...VISHNU_THEME },
  "om-gam-ganapataye": { glyph: "गं",    ...GANESHA_THEME },
  "gayatri":           { glyph: "ॐ",     ...SURYA_THEME },
  "durga-mantra":      { glyph: "दुं",   ...DURGA_THEME },
  "saraswati-mantra":  { glyph: "ऐं",    ...SARASWATI_THEME },
  "mahalaxmi-mantra":  { glyph: "श्रीं", ...LAKSHMI_THEME },
  "hanuman-mantra":    { glyph: "राम",   ...HANUMAN_THEME },
};
const DEFAULT_THEME: DeityTheme = SHIVA_THEME;

// Per-mantra deity portrait. Used by MysticBackdrop to ground the
// Focus-mode chant in the visual presence of the chosen deity. Both
// Shiva mantras share the existing Mahamrityunjaya portrait so we
// don't ship a redundant asset.
const MANTRA_DEITY_IMAGES: Record<string, string> = {
  "om-namah-shivaya":   shivaMahamrityunjayaImg,
  "mahamrityunjaya":    shivaMahamrityunjayaImg,
  "hare-krishna":       krishnaFluteDeityImg,
  "om-namo-bhagavate":  krishnaVasudevaDeityImg,
  "radhe-radhe":        radhaKrishnaDeityImg,
  "om-namo-narayanaya": vishnuNarayanaDeityImg,
  "om-gam-ganapataye":  ganeshaDeityImg,
  "gayatri":            suryaGayatriDeityImg,
  "durga-mantra":       durgaDeityImg,
  "saraswati-mantra":   saraswatiDeityImg,
  "mahalaxmi-mantra":   mahalakshmiDeityImg,
  "hanuman-mantra":     hanumanDeityImg,
};
function getDeityImage(mantraId: string): string | undefined {
  return MANTRA_DEITY_IMAGES[mantraId];
}

function getMantraTheme(mantraId: string): DeityTheme {
  return MANTRA_THEMES[mantraId] ?? DEFAULT_THEME;
}

// ---- Ornament primitives -------------------------------------------------
function TrishulCorner({ side, accent }: { side: "left" | "right"; accent: string }) {
  return (
    <svg viewBox="0 0 60 200"
      className={`absolute top-6 ${side === "left" ? "left-4" : "right-4"} w-10 h-32 sm:w-14 sm:h-40 opacity-30`}
      style={side === "right" ? { transform: "scaleX(-1)" } : undefined}>
      <g fill="none" stroke={accent} strokeWidth="2.5" strokeLinecap="round">
        <line x1="30" y1="60" x2="30" y2="190" />
        <path d="M30 60 L30 18 M30 60 C18 50 12 38 12 22 M30 60 C42 50 48 38 48 22" />
        <path d="M12 22 L8 8 M30 18 L30 4 M48 22 L52 8" />
        <line x1="22" y1="120" x2="38" y2="120" />
      </g>
    </svg>
  );
}

function LotusCorner({ side, accent }: { side: "left" | "right"; accent: string }) {
  return (
    <svg viewBox="0 0 60 200"
      className={`absolute top-6 ${side === "left" ? "left-4" : "right-4"} w-10 h-32 sm:w-14 sm:h-40 opacity-35`}>
      <g fill="none" stroke={accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="30" y1="80" x2="30" y2="200" />
        <path d="M30 78 C22 60 22 38 30 22 C38 38 38 60 30 78 Z" />
        <path d="M30 80 C18 70 14 55 18 40 C24 50 28 65 30 78 Z" />
        <path d="M30 80 C42 70 46 55 42 40 C36 50 32 65 30 78 Z" />
        <path d="M30 80 C12 75 6 64 8 50 C18 56 24 64 28 78 Z" />
        <path d="M30 80 C48 75 54 64 52 50 C42 56 36 64 32 78 Z" />
      </g>
    </svg>
  );
}

function CrescentMoon({ cutout }: { cutout: string }) {
  return (
    <svg viewBox="0 0 200 200" className="absolute top-12 right-10 w-24 h-24 sm:w-32 sm:h-32 opacity-70">
      <defs>
        <radialGradient id="moonGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFAEC" stopOpacity="0.95" />
          <stop offset="100%" stopColor="#D4AF37" stopOpacity="0.5" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="60" fill="url(#moonGlow)" />
      <circle cx="125" cy="92" r="58" fill={cutout} />
    </svg>
  );
}

function SunWithRays({ accent }: { accent: string }) {
  const rays = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    const x1 = 100 + Math.cos(a) * 44, y1 = 100 + Math.sin(a) * 44;
    const x2 = 100 + Math.cos(a) * 64, y2 = 100 + Math.sin(a) * 64;
    return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} />;
  });
  return (
    <svg viewBox="0 0 200 200" className="absolute top-10 right-8 w-28 h-28 sm:w-36 sm:h-36 opacity-65">
      <defs>
        <radialGradient id="sunGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFFAEC" stopOpacity="0.95" />
          <stop offset="100%" stopColor={accent} stopOpacity="0.35" />
        </radialGradient>
      </defs>
      <circle cx="100" cy="100" r="34" fill="url(#sunGlow)" />
      <g stroke={accent} strokeWidth="2" strokeLinecap="round" opacity="0.55">{rays}</g>
    </svg>
  );
}

function PeacockFeather({ accent, cutout }: { accent: string; cutout: string }) {
  return (
    <svg viewBox="0 0 200 220" className="absolute top-10 right-8 w-24 h-32 sm:w-28 sm:h-36 opacity-75">
      <ellipse cx="100" cy="80" rx="42" ry="60" fill={accent} opacity="0.25" />
      <ellipse cx="100" cy="80" rx="22" ry="30" fill={accent} opacity="0.45" />
      <ellipse cx="100" cy="80" rx="14" ry="20" fill={cutout} />
      <ellipse cx="100" cy="78" rx="9" ry="13" fill={accent} opacity="0.85" />
      <ellipse cx="100" cy="78" rx="4" ry="6" fill={cutout} />
      <line x1="100" y1="142" x2="100" y2="216" stroke={accent} strokeWidth="2" opacity="0.6" />
    </svg>
  );
}

function MountainSilhouette() {
  return (
    <svg viewBox="0 0 1000 280" preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0 w-full h-44 sm:h-56 opacity-55">
      <defs>
        <linearGradient id="mtnGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="55%" stopColor="#000" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M0,280 L0,200 L120,160 L210,210 L320,120 L430,180 L520,80 L620,170 L720,130 L820,200 L920,150 L1000,210 L1000,280 Z" fill="url(#mtnGrad)" />
    </svg>
  );
}

function GroveSilhouette() {
  return (
    <svg viewBox="0 0 1000 280" preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0 w-full h-44 sm:h-56 opacity-55">
      <defs>
        <linearGradient id="grvGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="60%" stopColor="#000" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M0,280 L0,220 Q150,180 300,210 T600,200 T1000,210 L1000,280 Z" fill="url(#grvGrad)" />
      <g fill="#000" opacity="0.7">
        <ellipse cx="180" cy="195" rx="3" ry="22" />
        <path d="M180 173 q-12 -4 -22 4 q12 -10 22 0 q10 -10 22 0 q-10 -8 -22 -4 q0 -14 6 -24 q-6 6 -6 24 q0 -16 -6 -24 q6 10 6 24 Z" />
        <ellipse cx="780" cy="200" rx="3" ry="20" />
        <path d="M780 180 q-11 -4 -20 3 q10 -9 20 0 q9 -9 20 0 q-9 -7 -20 -3 q0 -12 6 -22 q-6 6 -6 22 Z" />
      </g>
    </svg>
  );
}

function LotusPondSilhouette({ accent }: { accent: string }) {
  return (
    <svg viewBox="0 0 1000 280" preserveAspectRatio="none"
      className="absolute bottom-0 left-0 right-0 w-full h-44 sm:h-56 opacity-55">
      <defs>
        <linearGradient id="pondGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#000" stopOpacity="0" />
          <stop offset="50%" stopColor="#000" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#000" stopOpacity="0.85" />
        </linearGradient>
      </defs>
      <path d="M0,280 L0,230 Q250,215 500,225 T1000,225 L1000,280 Z" fill="url(#pondGrad)" />
      <g fill={accent} opacity="0.55">
        <ellipse cx="220" cy="226" rx="14" ry="4" />
        <ellipse cx="500" cy="222" rx="18" ry="5" />
        <ellipse cx="780" cy="226" rx="14" ry="4" />
      </g>
    </svg>
  );
}

// ---- Backdrop assembly ---------------------------------------------------
// Layers (back to front): radial aura → optional photographic deity →
// top-right ornament (crescent / sun / peacock feather) → corner motifs
// (trishul or lotus) → bottom silhouette (mountain / grove / pond) →
// huge faint deity glyph centred behind the ring. Opacities are gentle so
// the chant counter stays the focal point — the backdrop only sets mood.
// ──────────────────────────────────────────────────────────────────────
// Sacred ambient helpers — used by both the inline mala view and the
// fullscreen focus mode.
// ──────────────────────────────────────────────────────────────────────

const MALA_TOTAL_BEADS = 108;

// 108-bead mala garland — replaces the plain progress arc with the
// iconic visual: 108 beads arranged in a circle, filling with the
// mantra's accent gold as the count progresses. Bead 0 is the "guru
// bead" (meru) — slightly larger, deep maroon with a gold rim.
// SVG uses width/height 100% + viewBox so it scales to any container.
function MalaGarland({
  count, target, fillColor, restColor, withBreathAura,
  beadR = 3.5, guruR = 6.5, viewBoxSize = 280,
}: {
  count: number; target: number;
  fillColor: string; restColor: string;
  withBreathAura?: boolean;
  beadR?: number; guruR?: number; viewBoxSize?: number;
}) {
  const center = viewBoxSize / 2;
  const radius = center - guruR - 2;
  const fillProgress = Math.min(1, count / target);
  const filled = Math.floor(fillProgress * MALA_TOTAL_BEADS);
  const beads = [];
  for (let i = 0; i < MALA_TOTAL_BEADS; i++) {
    const angle = -Math.PI / 2 + (i / MALA_TOTAL_BEADS) * Math.PI * 2;
    const cx = center + radius * Math.cos(angle);
    const cy = center + radius * Math.sin(angle);
    const isGuru = i === 0;
    const isFilled = i < filled;
    if (isGuru) {
      beads.push(
        <g key={i}>
          <circle cx={cx} cy={cy} r={guruR + 1.4} fill={fillColor} opacity="0.55" />
          <circle cx={cx} cy={cy} r={guruR} fill="#6D2B35" stroke={fillColor} strokeWidth={Math.max(0.6, viewBoxSize / 350)} />
        </g>
      );
    } else {
      // Filled beads render slightly larger with a soft accent halo
      // so the mala visibly "fills" as the count climbs — turning the
      // ring of dots into a real progress arc. Unfilled beads stay
      // small and faint.
      beads.push(
        <g key={i} style={{ transition: "opacity 0.25s ease" }}>
          {isFilled && (
            <circle
              cx={cx} cy={cy} r={beadR + 1.6}
              fill={fillColor}
              opacity="0.32"
            />
          )}
          <circle
            cx={cx} cy={cy} r={isFilled ? beadR + 0.6 : beadR}
            fill={isFilled ? fillColor : restColor}
            opacity={isFilled ? 1 : 0.55}
            style={{ transition: "fill 0.25s ease, opacity 0.25s ease, r 0.25s ease" }}
          />
        </g>
      );
    }
  }
  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${viewBoxSize} ${viewBoxSize}`} className="block" aria-hidden="true">
      {/* Breath-pacing aura — a slow expanding/contracting gold ring that
          invites rhythmic breathing (≈4s in / 6s out, 10s cycle). */}
      {withBreathAura && (
        <g className="animate-japa-breath" style={{ transformBox: "fill-box", transformOrigin: "center" }}>
          <circle
            cx={center} cy={center} r={radius + guruR + 4}
            fill="none" stroke={fillColor}
            strokeWidth={Math.max(0.4, viewBoxSize / 600)}
            opacity="0.5"
          />
        </g>
      )}
      {beads}
    </svg>
  );
}

// Time-of-day → subtle backdrop tint. The mystic backdrop breathes
// with the hours of the day: Brahma muhurta gold pre-dawn, dawn pink,
// neutral midday, amber dusk, deep maroon early night, indigo deep
// night. Returns rgba components + a label for diagnostics.
function getTimeOfDayTint(date = new Date()): { color: string; opacity: number; label: string } {
  const h = date.getHours();
  if (h >= 4 && h < 6)   return { color: "212,175,55",  opacity: 0.18, label: "Brahma muhurta" };
  if (h >= 6 && h < 9)   return { color: "255,180,140", opacity: 0.10, label: "Dawn" };
  if (h >= 9 && h < 16)  return { color: "0,0,0",       opacity: 0,    label: "Day" };
  if (h >= 16 && h < 19) return { color: "240,140,60",  opacity: 0.14, label: "Dusk" };
  if (h >= 19 && h < 22) return { color: "109,43,53",   opacity: 0.20, label: "Evening" };
  return                        { color: "40,30,70",    opacity: 0.24, label: "Night" };
}

// Format dhyana session duration as "12 min in stillness" (or seconds
// while still under one minute).
function formatDhyana(ms: number): string {
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  if (m === 0) return `${total}s in stillness`;
  return `${m} min in stillness`;
}

// Single lotus petal that drifts upward and fades on each tap. The
// CSS keyframe (`animate-japa-lotus`) handles the rise + fade in 2.2s.
function LotusPetal({ x, color }: { x: number; color: string }) {
  return (
    <div
      className="absolute pointer-events-none animate-japa-lotus"
      style={{ left: `${x}%`, bottom: "30%" }}
      aria-hidden="true"
    >
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
        <g stroke={color} strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" fill={color} fillOpacity="0.22">
          <ellipse cx="12" cy="6"  rx="2.4" ry="4" />
          <ellipse cx="12" cy="18" rx="2.4" ry="4" />
          <ellipse cx="6"  cy="12" rx="4"   ry="2.4" />
          <ellipse cx="18" cy="12" rx="4"   ry="2.4" />
          <ellipse cx="7.6"  cy="7.6"  rx="3.6" ry="2.2" transform="rotate(-45 7.6 7.6)" />
          <ellipse cx="16.4" cy="7.6"  rx="3.6" ry="2.2" transform="rotate(45 16.4 7.6)" />
          <ellipse cx="7.6"  cy="16.4" rx="3.6" ry="2.2" transform="rotate(45 7.6 16.4)" />
          <ellipse cx="16.4" cy="16.4" rx="3.6" ry="2.2" transform="rotate(-45 16.4 16.4)" />
          <circle cx="12" cy="12" r="1.5" fill={color} fillOpacity="0.9" />
        </g>
      </svg>
    </div>
  );
}

// Soft golden bloom marking a quarter-mala milestone (27 / 54 / 81).
// Mounted briefly when the count crosses a milestone — the keyframe
// (`animate-japa-milestone`) fires once and the element fades away.
function MilestoneBloom({ accent }: { accent: string }) {
  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center animate-japa-milestone"
      aria-hidden="true"
    >
      <div
        className="rounded-full"
        style={{
          width: "85%",
          height: "85%",
          background: `radial-gradient(circle, ${accent}55 0%, ${accent}22 40%, transparent 75%)`,
          boxShadow: `0 0 60px ${accent}55`,
        }}
      />
    </div>
  );
}

// FullMalaBloom — fires once when a 108 mala closes. Larger, longer,
// and gold-rich (regardless of mantra accent) so completing the mala
// visibly outranks the 27/54/81 quarter-mala milestone blooms.
function FullMalaBloom() {
  return (
    <div
      className="absolute inset-0 pointer-events-none flex items-center justify-center animate-japa-full-mala-bloom"
      aria-hidden="true"
      data-testid="bloom-full-mala"
    >
      <div
        className="rounded-full"
        style={{
          width: "100%",
          height: "100%",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.65) 0%, rgba(212,175,55,0.32) 35%, rgba(212,175,55,0.10) 60%, transparent 80%)",
          boxShadow: "0 0 90px rgba(212,175,55,0.55)",
        }}
      />
    </div>
  );
}

// MalaRings — Apple-Activity-Rings analogue for sacred practice.
// Three concentric SVG progress rings:
//   - Inner (gold):    current mala progress (count / target)
//   - Middle (saffron):today's malas vs the daily intention (3 malas)
//   - Outer (maroon):  weekly streak (streak / 7 days)
// Closed rings glow gently. Fully decorative + accessible: an
// aria-hidden SVG with a sibling sr-only summary for screen readers.
function MalaRings({
  count, target, malasToday, streakDays, accent,
}: {
  count: number;
  target: number;
  malasToday: number;
  streakDays: number;
  accent: string;
}) {
  const malaPct   = target > 0 ? Math.min(1, (count % target) / target) : 0;
  const todayPct  = Math.min(1, malasToday / 3);
  const streakPct = Math.min(1, streakDays / 7);
  const RINGS = [
    { r: 44, sw: 6, pct: streakPct, color: "#9C2A2F", glow: "rgba(156,42,47,0.55)",  label: "Streak"  },
    { r: 33, sw: 6, pct: todayPct,  color: "#D88B2C", glow: "rgba(216,139,44,0.55)", label: "Today"   },
    { r: 22, sw: 6, pct: malaPct,   color: accent,    glow: "rgba(212,175,55,0.55)", label: "Mala"    },
  ];
  return (
    <div className="relative w-[120px] h-[120px] flex-shrink-0" data-testid="mala-rings">
      <style>{`
        @keyframes vt-ring-glow {
          0%, 100% { filter: drop-shadow(0 0 3px var(--ring-glow)); }
          50%      { filter: drop-shadow(0 0 10px var(--ring-glow)); }
        }
      `}</style>
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        {RINGS.map((ring, i) => {
          const circumference = 2 * Math.PI * ring.r;
          const dash = circumference * ring.pct;
          const closed = ring.pct >= 1;
          return (
            <g key={i} style={closed ? { ["--ring-glow" as any]: ring.glow, animation: "vt-ring-glow 2.4s ease-in-out infinite" } : undefined}>
              {/* Track */}
              <circle cx="50" cy="50" r={ring.r} fill="none"
                stroke={ring.color} strokeOpacity="0.18"
                strokeWidth={ring.sw} />
              {/* Progress */}
              <circle cx="50" cy="50" r={ring.r} fill="none"
                stroke={ring.color}
                strokeWidth={ring.sw}
                strokeLinecap="round"
                strokeDasharray={`${dash} ${circumference}`}
                style={{ transition: "stroke-dasharray 600ms cubic-bezier(0.4,0,0.2,1)" }} />
            </g>
          );
        })}
      </svg>
      <span className="sr-only">
        Mala {Math.round(malaPct * 100)}%, Today {malasToday} of 3, Streak {streakDays} days.
      </span>
    </div>
  );
}

function MysticBackdrop({ mantraId, active }: { mantraId: string; active?: boolean }) {
  const theme = getMantraTheme(mantraId);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true"
      data-testid="deity-backdrop" data-deity={mantraId}>
      {/* Local keyframes for the mystic-halo layers. Scoped via the
          unique animation names so they cannot collide with anything
          else on the page. Apple-Mindfulness inspired: aurora drifts
          on long loops, halo breathes on a 9s cycle. */}
      <style>{`
        @keyframes vt-aurora-a {
          0%   { transform: translate(0%, 0%)   scale(1);    }
          100% { transform: translate(14%, 8%)  scale(1.18); }
        }
        @keyframes vt-aurora-b {
          0%   { transform: translate(0%, 0%)   scale(1.08); }
          100% { transform: translate(-12%,-9%) scale(0.94); }
        }
        @keyframes vt-halo-breathe {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.00); }
          50%      { opacity: 0.95; transform: translate(-50%, -50%) scale(1.08); }
        }
      `}</style>
      {/* Aurora — two slow-drifting radial blooms in theme colour
          with screen-blend so they layer like northern lights. Soft
          enough that the deity portrait still leads visually. */}
      <div
        className="absolute -inset-[20%] mix-blend-screen opacity-60"
        style={{
          background: `radial-gradient(60% 45% at 30% 30%, rgba(${theme.glowRgb},0.45) 0%, transparent 65%)`,
          animation: "vt-aurora-a 32s ease-in-out infinite alternate",
        }}
        data-testid="aurora-a"
      />
      <div
        className="absolute -inset-[20%] mix-blend-screen opacity-50"
        style={{
          background: `radial-gradient(55% 40% at 72% 70%, rgba(${theme.glowRgb},0.35) 0%, transparent 65%)`,
          animation: "vt-aurora-b 47s ease-in-out infinite alternate",
        }}
        data-testid="aurora-b"
      />
      {/* Radial aura — now breathes on a 9s loop so the deity halo
          feels alive instead of static. Active state still nudges it
          brighter to mark when audio is playing. */}
      <div
        className={`absolute left-1/2 top-1/2 rounded-full ${active ? "opacity-100" : "opacity-80"}`}
        style={{
          width: "min(95vmin, 900px)",
          height: "min(95vmin, 900px)",
          background: `radial-gradient(circle, rgba(${theme.glowRgb},0.32) 0%, rgba(${theme.glowRgb},0.12) 40%, rgba(0,0,0,0) 72%)`,
          animation: "vt-halo-breathe 9s ease-in-out infinite",
          transition: "opacity 1s",
        }}
      />
      {/* Photographic deity portrait — one per mantra. Masked with a
          radial fade so it integrates with the gradient backdrop and
          never competes with the central mala for visual focus. */}
      {(() => {
        const deityImg = getDeityImage(mantraId);
        if (!deityImg) return null;
        return (
          <img
            src={deityImg}
            alt="" aria-hidden="true" draggable={false}
            className={`absolute left-1/2 bottom-0 -translate-x-1/2 select-none transition-opacity duration-1000 ${active ? "opacity-50" : "opacity-35"}`}
            style={{
              height: "min(92vh, 980px)",
              maxWidth: "min(80vw, 620px)",
              objectFit: "contain",
              objectPosition: "bottom center",
              WebkitMaskImage: "radial-gradient(ellipse at 50% 55%, #000 55%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0) 95%)",
              maskImage: "radial-gradient(ellipse at 50% 55%, #000 55%, rgba(0,0,0,0.6) 75%, rgba(0,0,0,0) 95%)",
              filter: `drop-shadow(0 0 24px rgba(${theme.glowRgb},0.35))`,
            }}
            data-testid={`deity-img-${mantraId}`}
          />
        );
      })()}
      {/* Top-right celestial ornament */}
      {theme.motifs === "mountain" && <CrescentMoon cutout={theme.bgFrom} />}
      {theme.motifs === "grove"    && <PeacockFeather accent={theme.accent} cutout={theme.bgFrom} />}
      {theme.motifs === "lotus"    && <SunWithRays accent={theme.accent} />}
      {/* Corner motifs */}
      {theme.motifs === "mountain" ? (
        <>
          <TrishulCorner side="left"  accent={theme.accent} />
          <TrishulCorner side="right" accent={theme.accent} />
        </>
      ) : (
        <>
          <LotusCorner side="left"  accent={theme.accent} />
          <LotusCorner side="right" accent={theme.accent} />
        </>
      )}
      {/* Bottom silhouette */}
      {theme.motifs === "mountain" && <MountainSilhouette />}
      {theme.motifs === "grove"    && <GroveSilhouette />}
      {theme.motifs === "lotus"    && <LotusPondSilhouette accent={theme.accent} />}
      {/* Central faint deity glyph */}
      <div
        className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-serif tabular-nums select-none transition-opacity duration-700 ${active ? "opacity-[0.07]" : "opacity-[0.04]"}`}
        style={{ fontSize: "min(72vmin, 720px)", color: theme.accent, lineHeight: 1 }}
      >
        {theme.glyph}
      </div>
      {/* Time-of-day tint — the backdrop subtly breathes with the
          hours of the day (Brahma muhurta gold pre-dawn, dusk amber,
          night deep maroon/indigo). Pure radial overlay; no blend
          modes so it stays cheap on mobile. */}
      {(() => {
        const tint = getTimeOfDayTint();
        if (tint.opacity === 0) return null;
        return (
          <div
            className="absolute inset-0 pointer-events-none transition-opacity duration-1000"
            style={{
              background: `radial-gradient(circle at 50% 30%, rgba(${tint.color}, ${tint.opacity}) 0%, rgba(${tint.color}, ${tint.opacity * 0.4}) 60%, transparent 100%)`,
            }}
            aria-hidden="true"
            data-testid="time-of-day-tint"
            data-tod={tint.label}
          />
        );
      })()}
    </div>
  );
}

function FullscreenOverlay(p: FullscreenOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col overflow-y-auto overflow-x-hidden"
      style={{
        background: `linear-gradient(135deg, ${getMantraTheme(p.mantra.id).bgFrom} 0%, ${getMantraTheme(p.mantra.id).bgVia} 50%, ${getMantraTheme(p.mantra.id).bgTo} 100%)`,
      }}
      data-testid="jap-fullscreen"
      role="dialog"
      aria-modal="true"
      aria-label="Mantra chanting focus mode"
      onKeyDown={(e) => { if (e.key === "Escape") p.onClose?.(); }}
      tabIndex={-1}
    >
      {p.mysticBackdrop && <MysticBackdrop mantraId={p.mantra.id} active={p.audioLocked} />}
      {/* Floating safety-net Exit pill — fixed bottom-right, ALWAYS
          visible even if the user scrolls the overlay or somehow loses
          the top bar (e.g. the browser temporarily covers it during a
          fullscreen transition). Belt-and-braces with the top "Exit"
          button so the devotee can never get stuck inside focus mode.
          z-30 sits above the sticky top/bottom bars (z-20). */}
      <button
        type="button"
        onClick={p.onClose}
        aria-label="Exit focus mode"
        title="Exit focus mode (Esc)"
        data-testid="btn-fs-exit-floating"
        className="fixed z-30 right-3 sm:right-4 inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-xs font-semibold text-[#FFFAEC] bg-black/55 ring-1 ring-[#D4AF37]/60 backdrop-blur-md shadow-xl hover:bg-black/70 active:scale-95 transition-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]"
        style={{
          bottom: "max(env(safe-area-inset-bottom, 0px), 0.75rem)",
        }}
      >
        <X className="h-3.5 w-3.5" />
        Exit
      </button>
      {/* Top bar — sticky so the close X stays reachable even when the
          overlay scrolls on short screens. Two-row layout fixes a long-
          standing crowding bug: previously the title competed with 5
          icon buttons in a single row and on narrow screens the share
          / wake-lock / favourite buttons either truncated or overflowed
          off-screen entirely. Now row 1 owns the mantra title + Close X
          (the only "always reachable" control), and row 2 carries the
          secondary actions in their own gold-tinted action pill that
          can wrap freely without ever pushing Close out of reach. */}
      <div
        className="sticky top-0 z-20 px-3 sm:px-4 pb-2 bg-gradient-to-b from-black/55 via-black/30 to-transparent backdrop-blur-sm"
        style={{
          // Respect iOS notch / Android status bar so the Close ✕ never
          // sits underneath the system overlay. On devices without a
          // safe area, max() falls back to the regular padding.
          paddingTop: "max(env(safe-area-inset-top, 0px), 0.75rem)",
        }}
      >
        <div className="flex items-center gap-2">
          <div className="min-w-0 flex-1">
            {p.allMantras && p.onChangeMantra ? (
              <div className="relative inline-flex items-center gap-1.5 max-w-full min-h-[44px] rounded-md focus-within:ring-2 focus-within:ring-[#D4AF37]/60 focus-within:ring-offset-1 focus-within:ring-offset-transparent">
                <span className="text-[#FFFAEC] font-serif text-base sm:text-lg truncate" data-testid="text-fs-mantra">
                  {p.mantra.label}
                </span>
                <ChevronDown className="h-4 w-4 text-[#D4AF37]/80 flex-shrink-0" aria-hidden="true" />
                <select
                  value={p.mantra.id}
                  onChange={(e) => p.onChangeMantra?.(e.target.value)}
                  disabled={p.audioLocked && p.syncTapsToAudio}
                  aria-label="Change mantra"
                  data-testid="select-fs-mantra"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                >
                  {p.allMantras.map((m) => (
                    <option key={m.id} value={m.id}>{m.label}</option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="text-[#FFFAEC] font-serif text-base sm:text-lg truncate" data-testid="text-fs-mantra">{p.mantra.label}</div>
            )}
            {p.mantra.sanskrit && (
              <div className="text-[#D4AF37]/85 font-serif text-sm sm:text-base truncate">{p.mantra.sanskrit}</div>
            )}
          </div>
          {/* Exit button — labelled, gold pill, large enough that it
              can never be missed. The previous icon-only X felt
              invisible once the browser entered true fullscreen and
              all the system chrome disappeared, leaving devotees
              stranded. Now reads as a clear "Exit" pill at top right. */}
          <div className="flex flex-col items-end flex-shrink-0">
            <Button
              size="default"
              variant="outline"
              onClick={p.onClose}
              className="h-11 px-4 border-[#D4AF37]/70 bg-black/40 text-[#FFFAEC] backdrop-blur-sm font-semibold shadow-lg"
              data-testid="btn-fs-close"
              aria-label="Exit focus mode"
              title="Exit focus mode (Esc)"
            >
              <X className="h-5 w-5 mr-1.5" />
              Exit
            </Button>
            <span className="hidden sm:block text-[9px] uppercase tracking-wider text-[#D4AF37]/70 mt-1 leading-none">Esc to exit</span>
          </div>
        </div>
        {/* Secondary action pill — own row, can wrap, gold-tinted divider
            so it reads as its own group rather than competing with the
            title. Buttons have proper 44px tap targets via Button size="icon". */}
        {(p.onToggleFavorite || p.onToggleDailyRitual || p.onShare || p.onToggleWakeLock) && (
          <div className="mt-2 flex items-center justify-end gap-1 flex-wrap">
            <div className="inline-flex items-center gap-0.5 rounded-full bg-black/30 ring-1 ring-[#D4AF37]/25 px-1 py-0.5 backdrop-blur-sm">
              {p.onToggleFavorite && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={p.onToggleFavorite}
                  className={p.isFavorite ? "text-[#D4AF37]" : "text-[#FFFAEC]"}
                  aria-pressed={p.isFavorite}
                  aria-label={p.isFavorite ? "Remove from favourites" : "Add to favourites"}
                  data-testid="btn-fs-favorite"
                  title={p.isFavorite ? "Remove from favourites" : "Add to favourites"}
                >
                  <Heart className={`h-5 w-5 ${p.isFavorite ? "fill-current" : ""}`} />
                </Button>
              )}
              {p.onToggleDailyRitual && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={p.onToggleDailyRitual}
                  className={p.isDailyRitual ? "text-[#D4AF37]" : "text-[#FFFAEC]"}
                  aria-pressed={p.isDailyRitual}
                  aria-label={p.isDailyRitual ? "Clear daily ritual" : "Set as daily ritual"}
                  data-testid="btn-fs-daily"
                  title={p.isDailyRitual ? "Clear daily ritual" : "Set as daily ritual"}
                >
                  <CalendarCheck className="h-5 w-5" />
                </Button>
              )}
              {p.onShare && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={p.onShare}
                  className="text-[#FFFAEC]"
                  aria-label="Share mantra"
                  data-testid="btn-fs-share"
                  title="Share mantra"
                >
                  <Share2 className="h-5 w-5" />
                </Button>
              )}
              {p.onToggleWakeLock && (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={p.onToggleWakeLock}
                  className={p.wakeLockOn ? "text-[#D4AF37]" : "text-[#FFFAEC]"}
                  data-testid="btn-fs-wakelock"
                  aria-pressed={p.wakeLockOn}
                  aria-label={p.wakeLockOn ? "Release screen lock" : "Keep screen on"}
                  title={p.wakeLockOn ? "Screen will stay on — tap to release" : "Keep screen on while chanting"}
                >
                  {p.wakeLockOn ? <Lock className="h-5 w-5" /> : <LockOpen className="h-5 w-5" />}
                </Button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Center stats — Apple-Activity-Rings layout: a small ring stack
          on the left with stat numbers + labels stacked to the right.
          Same data the old strip showed, just visualised. */}
      <div className="relative flex justify-center items-center gap-4 sm:gap-6 py-2 text-[#D4AF37]/85">
        <MalaRings
          count={p.count}
          target={p.target}
          malasToday={p.malas}
          streakDays={p.streak ?? 0}
          accent={getMantraTheme(p.mantra.id).accent}
        />
        <div className="grid grid-cols-3 gap-x-4 sm:gap-x-6 text-center">
          <div>
            <div className="text-[9px] uppercase tracking-wider">Today</div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-[#FFFAEC]" data-testid="text-fs-today">{p.todayCount.toLocaleString("en-IN")}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider">Malas</div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-[#FFFAEC]" data-testid="text-fs-malas">{p.malas}</div>
          </div>
          <div>
            <div className="text-[9px] uppercase tracking-wider">Streak</div>
            <div className="text-base sm:text-lg font-bold tabular-nums text-[#FFFAEC]" data-testid="text-fs-streak">{p.streak ?? 0}d</div>
          </div>
        </div>
      </div>

      {/* Giant tap area — the click target is the orb itself, NOT the
          surrounding flex stripe. Wrapping the whole flex-1 region in a
          button caused taps in the empty padding around the orb (and
          near the bottom controls on short screens) to register as
          counts. The flex wrapper now centres the orb but is inert. */}
      <div className={`relative flex-1 flex items-center justify-center px-4 pb-3 ${p.autoChanting || (p.audioLocked && p.syncTapsToAudio) ? "opacity-80" : ""}`}>
        <button
          type="button"
          onClick={(e) => {
            // Hit-test against the visible CIRCLE, not the square
            // bounding box. Without this, taps in the four corners of
            // the orb's bounding rectangle (which look like "anywhere
            // around the orb" to the user) still increment the count
            // because <button rounded-full> only masks pixels visually
            // — the click target stays square. We compute the squared
            // distance from centre and reject anything outside the
            // inscribed circle. ~2% inset matches the orb's visible
            // halo edge so the breath-glow still feels tappable.
            const rect = e.currentTarget.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;
            const r = (rect.width / 2) * 0.98;
            if (dx * dx + dy * dy > r * r) return;
            p.onTap();
          }}
          disabled={!!(p.autoChanting || (p.audioLocked && p.syncTapsToAudio))}
          aria-busy={(p.autoChanting || (p.audioLocked && p.syncTapsToAudio)) || undefined}
          // Pointer-events restricted to the visible circle via clip-path
          // so even hover / cursor-change feedback only happens inside
          // the orb. Belt-and-braces with the click hit-test above.
          style={{
            clipPath: "circle(50% at 50% 50%)",
            // Mobile tap polish: kill the 300ms double-tap-zoom delay AND
            // the iOS blue tap-highlight flash. Per-button only — global
            // viewport remains pinch-zoomable for accessibility.
            touchAction: "manipulation",
            WebkitTapHighlightColor: "transparent",
          }}
          className={`relative w-[min(78vmin,560px)] h-[min(78vmin,560px)] rounded-full select-none focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4AF37]/60 transition-transform ${p.autoChanting || (p.audioLocked && p.syncTapsToAudio) ? "cursor-wait" : "active:scale-[0.985]"}`}
          aria-label={p.autoMode && !p.autoChanting ? "Tap to start auto-chant" : p.autoChanting ? "Auto-chant is playing — press Stop to chant manually" : p.audioLocked && p.syncTapsToAudio ? "Mantra audio playing — please wait" : "Count one japa"}
          data-testid="btn-fs-tap"
        >
          {/* Apple-Breathe orb — soft luminous halo behind the central
              bead that slowly expands and contracts on a 10s cycle
              (≈4s in / 6s out). The devotee can pace breath against it
              without thinking. Distinct from MalaGarland's thin
              breath-pacing ring (which lives on the bead garland
              itself); together they create concentric rhythm. */}
          <div
            className="absolute inset-[6%] rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle, rgba(${getMantraTheme(p.mantra.id).glowRgb},0.22) 0%, rgba(${getMantraTheme(p.mantra.id).glowRgb},0.08) 50%, transparent 75%)`,
              animation: "vt-breathe-orb 10s ease-in-out infinite",
            }}
            aria-hidden="true"
            data-testid="breathe-orb"
          />
          <style>{`
            @keyframes vt-breathe-orb {
              0%, 100% { opacity: 0.45; transform: scale(0.92); }
              50%      { opacity: 0.85; transform: scale(1.08); }
            }
          `}</style>
          {/* 108-bead mala garland (with breath-pacing aura). */}
          <MalaGarland
            count={p.count}
            target={p.target}
            fillColor={getMantraTheme(p.mantra.id).accent}
            restColor="rgba(212,175,55,0.18)"
            withBreathAura={!p.autoChanting}
            viewBoxSize={100}
            beadR={1.0}
            guruR={1.7}
          />
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-[#6D2B35] to-[#2a0d12] shadow-2xl flex flex-col items-center justify-center text-center text-[#FFFAEC] ring-1 ring-[#D4AF37]/30">
            {p.paceHint && (
              <div className="absolute inset-0 rounded-full pointer-events-none ring-2 ring-[#D4AF37]/70 animate-pulse" aria-hidden="true" data-testid="ring-fs-pace-hint" />
            )}
            <div className="text-[11px] uppercase tracking-[0.3em] text-[#D4AF37]/85">Tap to count</div>
            <div className="font-serif font-bold tabular-nums leading-none mt-3" style={{ fontSize: "clamp(5rem, 22vmin, 14rem)" }} data-testid="text-fs-count">
              {p.count}
            </div>
            <div className="text-xs sm:text-sm uppercase tracking-[0.25em] text-[#D4AF37]/70 mt-3">of {p.target}</div>
            {p.sessionElapsedMs !== undefined && p.sessionElapsedMs > 0 && (
              <div className="text-[10px] uppercase tracking-[0.25em] text-[#D4AF37]/65 mt-2" data-testid="text-fs-dhyana">
                {formatDhyana(p.sessionElapsedMs)}
              </div>
            )}
          </div>
          {/* Quarter-mala milestone bloom (27 / 54 / 81). */}
          {p.milestoneFlash !== null && p.milestoneFlash !== undefined && (
            <MilestoneBloom
              key={`fs-milestone-${p.milestoneFlash}-${p.malas}`}
              accent={getMantraTheme(p.mantra.id).accent}
            />
          )}
          {/* Lotus petals drifting up from each tap. */}
          {p.petals && p.petals.map((pp) => (
            <LotusPetal key={pp.id} x={pp.x} color={getMantraTheme(p.mantra.id).accent} />
          ))}
        </button>
      </div>

      {/* Mantra meaning + presiding deity. Always shown when no
          karaoke lyrics are available for this mantra (lyrics take
          precedence so the screen never gets crowded). Subtle gold
          card with the deity name as the section header so every
          mantra now reads with the same depth as Mahamrityunjaya. */}
      {(!p.lyrics || p.lyrics.length === 0) && p.meaning && (
        <div className="relative px-4 pb-1" data-testid="fs-meaning">
          <div className="mx-auto max-w-2xl rounded-md bg-black/30 backdrop-blur-sm ring-1 ring-[#D4AF37]/25 px-4 py-3">
            {p.meaning.deity && (
              <div className="text-[10px] uppercase tracking-[0.28em] text-[#D4AF37]/85 font-bold text-center">
                {p.meaning.deity}
              </div>
            )}
            <p className="mt-1.5 text-center font-serif italic text-[#FFFAEC]/95 text-sm sm:text-base leading-relaxed">
              {p.meaning.meaning}
            </p>
          </div>
        </div>
      )}

      {/* Karaoke-style synced lyrics (Mahamrityunjaya only) */}
      {p.lyrics && p.lyrics.length > 0 && (
        <div className="relative px-4 pb-1" data-testid="fs-lyrics">
          <div className="mx-auto max-w-2xl rounded-md bg-black/25 backdrop-blur-sm ring-1 ring-[#D4AF37]/20 px-4 py-3">
            {p.lyrics.map((line, i) => {
              const active = i === p.activeLyricIndex;
              const seen = p.activeLyricIndex !== undefined && i < p.activeLyricIndex;
              return (
                <div
                  key={i}
                  className={`text-center transition-all duration-300 ${active ? "scale-[1.04]" : ""}`}
                  data-testid={`fs-lyric-line-${i}`}
                  data-active={active || undefined}
                >
                  <div
                    className={`font-serif leading-snug ${active ? "text-[#FFFAEC] text-base sm:text-lg" : seen ? "text-[#D4AF37]/55 text-sm" : "text-[#D4AF37]/75 text-sm"}`}
                  >
                    {line.sa}
                  </div>
                  <div className={`text-[10px] sm:text-xs tracking-wide ${active ? "text-[#D4AF37]" : "text-[#D4AF37]/55"}`}>
                    {line.iast} <span className={`${active ? "text-[#FFFAEC]/85" : "text-[#FFFAEC]/45"}`}>· {line.en}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Bottom controls — sticky so Bell / Auto / Reset stay reachable
          when the overlay scrolls on short screens. */}
      <div className="sticky bottom-0 z-20 p-3 sm:p-4 flex items-center justify-center gap-2 flex-wrap bg-gradient-to-t from-black/45 via-black/25 to-transparent backdrop-blur-sm">
        <Button size="sm" variant="outline" onClick={p.onToggleSound} className="border-[#D4AF37]/40 bg-transparent text-[#FFFAEC]" data-testid="btn-fs-sound" aria-pressed={p.soundOn}>
          {p.soundOn ? <Volume2 className="h-3.5 w-3.5 mr-1.5" /> : <VolumeX className="h-3.5 w-3.5 mr-1.5" />}
          Bell
        </Button>
        <Button size="sm" variant="outline" onClick={p.onToggleVibration} className="border-[#D4AF37]/40 bg-transparent text-[#FFFAEC]" data-testid="btn-fs-vibrate" aria-pressed={p.vibrationOn}>
          {p.vibrationOn ? <Vibrate className="h-3.5 w-3.5 mr-1.5" /> : <BellOff className="h-3.5 w-3.5 mr-1.5" />}
          Buzz
        </Button>
        {p.onToggleSyncAudio && (
          <Button
            size="sm"
            variant="outline"
            onClick={p.onToggleSyncAudio}
            className="border-[#D4AF37]/40 bg-transparent text-[#FFFAEC]"
            data-testid="btn-fs-sync-audio"
            aria-pressed={!!p.syncTapsToAudio}
            title="Sync taps to audio: when on, the press waits for each chant to finish before accepting the next tap."
          >
            <Headphones className="h-3.5 w-3.5 mr-1.5" />
            Sync: {p.syncTapsToAudio ? "On" : "Off"}
          </Button>
        )}
        {p.onToggleAutoChant && (
          <Button
            size="sm"
            variant="outline"
            onClick={p.onToggleAutoChant}
            className={p.autoMode ? "bg-[#D4AF37] hover:bg-[#D4AF37] text-[#6D2B35] border-[#D4AF37]" : "border-[#D4AF37]/40 bg-transparent text-[#FFFAEC]"}
            data-testid="btn-fs-auto-chant"
            aria-pressed={!!p.autoMode}
            title="Arm auto-chant. After turning it on, tap the mala to start — the chant then loops and counts itself to the goal."
          >
            {p.autoMode ? <Square className="h-3.5 w-3.5 mr-1.5" /> : <Play className="h-3.5 w-3.5 mr-1.5" />}
            Auto: {p.autoMode ? "On" : "Off"}
          </Button>
        )}
        <Button size="sm" variant="ghost" onClick={p.onUndo} disabled={!!(p.audioLocked && p.syncTapsToAudio)} className="text-[#FFFAEC] hover:text-[#FFFAEC]" data-testid="btn-fs-undo">
          <Undo2 className="h-3.5 w-3.5 mr-1.5" />Undo
        </Button>
        <Button size="sm" variant="outline" onClick={p.onResetMala} className="border-[#D4AF37]/40 bg-transparent text-[#FFFAEC]" data-testid="btn-fs-reset">
          <RotateCcw className="h-3.5 w-3.5 mr-1.5" />Reset mala
        </Button>
      </div>
    </div>
  );
}


// =====================================================================
// CelebrationOverlay — full-screen sacred celebration when a mala is
// completed. Lotus burst, rotating golden ring, radiating sparkles, and
// "Mala Complete!" headline. Auto-dismisses; tap to dismiss early.
// =====================================================================
function CelebrationOverlay({
  malaNumber,
  target,
  mantraLabel,
  exiting = false,
  onDismiss,
}: {
  malaNumber: number;
  target: number;
  mantraLabel: string;
  exiting?: boolean;
  onDismiss: () => void;
}) {
  // 14 sparkle rays radiating outward
  const rays = Array.from({ length: 14 }, (_, i) => i);
  return (
    <div
      role="dialog"
      aria-label="Mala complete celebration"
      onClick={onDismiss}
      className="fixed inset-0 z-[10000] flex items-center justify-center cursor-pointer"
      data-testid="overlay-mala-complete"
      style={{
        background:
          "radial-gradient(circle at center, rgba(74,26,34,0.92) 0%, rgba(20,8,12,0.96) 70%)",
        backdropFilter: "blur(6px)",
        animation: exiting ? undefined : "vt-mala-fade 0.35s ease-out",
        opacity: exiting ? 0 : 1,
        transition: "opacity 0.7s ease-out",
      }}
    >
      <style>{`
        @keyframes vt-mala-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vt-mala-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          55%  { transform: scale(1.08); opacity: 1; }
          100% { transform: scale(1);    opacity: 1; }
        }
        @keyframes vt-mala-spin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes vt-mala-spin-rev {
          from { transform: rotate(360deg); }
          to   { transform: rotate(0deg); }
        }
        @keyframes vt-mala-ray {
          0%   { transform: rotate(var(--ang)) translateY(0)    scale(0.4); opacity: 0; }
          25%  { opacity: 1; }
          100% { transform: rotate(var(--ang)) translateY(-180px) scale(1.1); opacity: 0; }
        }
        @keyframes vt-mala-glow {
          0%, 100% { filter: drop-shadow(0 0 16px rgba(212,175,55,0.6)); }
          50%      { filter: drop-shadow(0 0 32px rgba(212,175,55,1));   }
        }
        @keyframes vt-mala-float {
          0%   { transform: translateY(8px); opacity: 0; }
          100% { transform: translateY(0);   opacity: 1; }
        }
      `}</style>

      <div
        className="relative flex flex-col items-center text-center px-6"
        style={{ animation: "vt-mala-pop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1) both" }}
      >
        {/* Radiating sparkle rays */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {rays.map((i) => (
            <span
              key={i}
              className="absolute"
              style={{
                ["--ang" as any]: `${(360 / rays.length) * i}deg`,
                width: "10px",
                height: "44px",
                borderRadius: "999px",
                background:
                  "linear-gradient(180deg, rgba(212,175,55,0) 0%, #D4AF37 50%, rgba(212,175,55,0) 100%)",
                animation: `vt-mala-ray 1.6s ease-out ${i * 0.04}s infinite`,
                transformOrigin: "center",
              }}
            />
          ))}
        </div>

        {/* Concentric mandala rings */}
        <div className="relative" style={{ width: 260, height: 260 }}>
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{ animation: "vt-mala-spin 14s linear infinite, vt-mala-glow 1.6s ease-in-out infinite" }}
          >
            <defs>
              <radialGradient id="vtMalaCore" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#FFFAEC" />
                <stop offset="55%" stopColor="#D4AF37" />
                <stop offset="100%" stopColor="#6D2B35" />
              </radialGradient>
            </defs>
            {/* Outer petal ring */}
            {Array.from({ length: 12 }).map((_, i) => (
              <ellipse
                key={i}
                cx="100" cy="22" rx="6" ry="14"
                fill="#D4AF37"
                opacity="0.85"
                transform={`rotate(${i * 30} 100 100)`}
              />
            ))}
            <circle cx="100" cy="100" r="68" fill="none" stroke="#D4AF37" strokeWidth="1.5" opacity="0.6" />
          </svg>

          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{ animation: "vt-mala-spin-rev 22s linear infinite" }}
          >
            {/* Inner petal ring */}
            {Array.from({ length: 8 }).map((_, i) => (
              <ellipse
                key={i}
                cx="100" cy="46" rx="9" ry="20"
                fill="#FFFAEC"
                opacity="0.92"
                transform={`rotate(${i * 45} 100 100)`}
              />
            ))}
            <circle cx="100" cy="100" r="34" fill="url(#vtMalaCore)" />
            <text
              x="100" y="108"
              textAnchor="middle"
              fontFamily="'Playfair Display', serif"
              fontWeight="700"
              fontSize="24"
              fill="#4a1a22"
            >
              ॐ
            </text>
          </svg>
        </div>

        {/* Headline */}
        <div
          className="mt-8 font-serif text-[#FFFAEC]"
          style={{
            fontSize: "clamp(2rem, 7vw, 3.5rem)",
            lineHeight: 1.1,
            animation: "vt-mala-float 0.6s ease-out 0.25s both",
          }}
          data-testid="text-mala-complete-title"
        >
          Mala Complete
        </div>
        <div
          className="mt-2 font-serif text-[#D4AF37]"
          style={{ fontSize: "clamp(1.1rem, 3vw, 1.6rem)", animation: "vt-mala-float 0.6s ease-out 0.4s both" }}
        >
          जप पूर्ण — {malaNumber.toLocaleString("en-IN")}
          {malaNumber === 1 ? "st" : malaNumber === 2 ? "nd" : malaNumber === 3 ? "rd" : "th"} mala
        </div>
        <div
          className="mt-3 text-sm uppercase tracking-[0.3em] text-[#FFFAEC]/70"
          style={{ animation: "vt-mala-float 0.6s ease-out 0.55s both" }}
          data-testid="text-mala-complete-meta"
        >
          {target.toLocaleString("en-IN")} japas · {mantraLabel}
        </div>
        <div
          className="mt-6 text-[11px] uppercase tracking-[0.3em] text-[#FFFAEC]/50"
          style={{ animation: "vt-mala-float 0.6s ease-out 0.85s both" }}
        >
          Tap anywhere to continue
        </div>
      </div>
    </div>
  );
}

// =====================================================================
// TathastuBlessing — the divine ashirvad popup. Appears as the mala
// celebration fades, presenting Lord Shiva's blessing hand in abhaya
// mudra with a Sanskrit blessing + English translation. The devotee
// can receive it (dismiss) or pass it on (share).
// =====================================================================
// Deity-aware blessings. The first Sanskrit line ("ॐ तथास्तु। शिवोऽस्तु
// ते सर्वदा।") is shared as the universal opener; the second line and the
// English deity sentence are mantra-specific. Custom or unknown mantras
// fall back to DEFAULT_BLESSING with the chosen mantra's own label
// surfacing in the "with the grace of …" footer.
type Blessing = { sanskrit: string; englishSecond: string; grace: string };
const ASV_OPENER_SK = "ॐ तथास्तु। शिवोऽस्तु ते सर्वदा।";
const MANTRA_BLESSINGS: Record<string, Blessing> = {
  "om-namah-shivaya": {
    sanskrit: `${ASV_OPENER_SK}\nशम्भुः त्वां सदा पातु॥`,
    englishSecond: "May Shambhu, the ever-auspicious, forever protect you.",
    grace: "Bhagavān Śiva",
  },
  "hare-krishna": {
    sanskrit: `${ASV_OPENER_SK}\nगोविन्दः त्वां सदा पातु॥`,
    englishSecond: "May Govinda forever delight in you and protect you.",
    grace: "Bhagavān Kṛṣṇa",
  },
  "gayatri": {
    sanskrit: `${ASV_OPENER_SK}\nसवितुः तेजः त्वां पावयतु॥`,
    englishSecond: "May the radiance of Savitṛ forever illumine your intellect.",
    grace: "Devī Sāvitrī",
  },
  "mahamrityunjaya": {
    sanskrit: `${ASV_OPENER_SK}\nमृत्युञ्जयः त्वां सदा पातु॥`,
    englishSecond: "May the Conqueror of Death forever protect you.",
    grace: "Mahā-Mṛtyuñjaya",
  },
  "om-gam-ganapataye": {
    sanskrit: `${ASV_OPENER_SK}\nगणेशः विघ्नान् हरतु॥`,
    englishSecond: "May Gaṇeśa remove every obstacle from your path.",
    grace: "Bhagavān Gaṇeśa",
  },
  "om-namo-narayanaya": {
    sanskrit: `${ASV_OPENER_SK}\nनारायणः त्वां सदा पातु॥`,
    englishSecond: "May Bhagavān Nārāyaṇa forever protect you and shower you with abundance.",
    grace: "Bhagavān Nārāyaṇa",
  },
  "om-namo-bhagavate": {
    sanskrit: `${ASV_OPENER_SK}\nवासुदेवः त्वां सदा पातु॥`,
    englishSecond: "May Bhagavān Vāsudeva forever protect you, and may your devotion ever deepen.",
    grace: "Bhagavān Vāsudeva",
  },
  "radhe-radhe": {
    sanskrit: `${ASV_OPENER_SK}\nराधाकृपा त्वां सदा सिञ्चतु॥`,
    englishSecond: "May Śrī Rādhā's grace forever shower you with divine love.",
    grace: "Śrī Rādhā",
  },
  "durga-mantra": {
    sanskrit: `${ASV_OPENER_SK}\nदुर्गा त्वां सदा रक्षतु॥`,
    englishSecond: "May Mā Durgā forever guard you and bless you with strength.",
    grace: "Mā Durgā",
  },
  "saraswati-mantra": {
    sanskrit: `${ASV_OPENER_SK}\nसरस्वती त्वयि सदा वसतु॥`,
    englishSecond: "May Mā Sarasvatī forever dwell in you and illumine your knowledge, speech, and arts.",
    grace: "Mā Sarasvatī",
  },
  "mahalaxmi-mantra": {
    sanskrit: `${ASV_OPENER_SK}\nमहालक्ष्मीः त्वां सदा सम्पूर्णां करोतु॥`,
    englishSecond: "May Mā Mahālakṣmī forever bless you with abundance, beauty, and inner fulfilment.",
    grace: "Mā Mahālakṣmī",
  },
  "hanuman-mantra": {
    sanskrit: `${ASV_OPENER_SK}\nहनुमान् त्वां सदा रक्षतु॥`,
    englishSecond: "May Bhagavān Hanumān forever protect you and grant you fearless strength.",
    grace: "Bhagavān Hanumān",
  },
};
const DEFAULT_BLESSING: Blessing = {
  sanskrit: `${ASV_OPENER_SK}\nदिव्यकृपा त्वां सदा पातु॥`,
  englishSecond: "May divine grace forever protect you.",
  grace: "",
};

function TathastuBlessing({
  mantraLabel,
  mantraId,
  devoteeName,
  onDismiss,
  onShare,
}: {
  mantraLabel: string;
  mantraId: string;
  devoteeName?: string;
  onDismiss: () => void;
  onShare?: (sanskrit: string, english: string) => void;
}) {
  // First name only, trimmed, capitalised — keeps the blessing intimate
  // without surfacing a long display name.
  const firstName = (devoteeName || "").trim().split(/\s+/)[0] || "";
  const personalisedFor = firstName
    ? (firstName.charAt(0).toUpperCase() + firstName.slice(1))
    : "";

  const blessing = MANTRA_BLESSINGS[mantraId] ?? DEFAULT_BLESSING;
  const sanskrit = blessing.sanskrit;
  const englishOpener = personalisedFor
    ? `Om, so be it. ${personalisedFor}, may auspiciousness be with you always.`
    : "Om, so be it. May auspiciousness be with you always.";
  const english = `${englishOpener} ${blessing.englishSecond}`;
  const graceLabel = blessing.grace || mantraLabel;

  // Auto-dismiss after 12s + Esc to close early
  useEffect(() => {
    const t = setTimeout(onDismiss, 12000);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDismiss();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(t);
      window.removeEventListener("keydown", onKey);
    };
  }, [onDismiss]);

  return (
    <div
      role="dialog"
      aria-label="Tathastu — a blessing from Lord Shiva"
      onClick={onDismiss}
      className="vt-asv-overlay fixed inset-0 z-[10001] flex items-center justify-center cursor-pointer overflow-hidden"
      data-testid="overlay-tathastu"
      style={{
        background:
          "radial-gradient(ellipse at center, rgba(74,26,34,0.95) 0%, rgba(20,8,12,0.98) 65%, rgba(0,0,0,1) 100%)",
        backdropFilter: "blur(8px)",
        animation: "vt-asv-fade 0.6s ease-out",
      }}
    >
      <style>{`
        @keyframes vt-asv-fade {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes vt-asv-bloom {
          0%, 100% { transform: translate(-50%, -50%) scale(1);    opacity: 0.55; }
          50%      { transform: translate(-50%, -50%) scale(1.10); opacity: 0.85; }
        }
        @keyframes vt-asv-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-10px); }
        }
        @keyframes vt-asv-rise {
          from { transform: translateY(20px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        @media (prefers-reduced-motion: reduce) {
          .vt-asv-overlay,
          .vt-asv-bloom,
          .vt-asv-float,
          .vt-asv-rise { animation: none !important; }
          .vt-asv-rise { opacity: 1 !important; transform: none !important; }
        }
      `}</style>

      {/* Gold light bloom behind everything */}
      <div
        aria-hidden
        className="vt-asv-bloom absolute left-1/2 top-1/2 rounded-full pointer-events-none"
        style={{
          width: "min(110vmin, 1100px)",
          height: "min(110vmin, 1100px)",
          background:
            "radial-gradient(circle, rgba(212,175,55,0.35) 0%, rgba(212,175,55,0.10) 40%, rgba(0,0,0,0) 70%)",
          animation: "vt-asv-bloom 4s ease-in-out infinite",
        }}
      />

      {/* Tap anywhere — including the panel — to dismiss. Receive
          dismisses anyway; Share stops propagation so the popup stays
          long enough for the share sheet / clipboard toast to surface. */}
      <div className="relative flex flex-col items-center text-center px-6 max-w-2xl">
        {/* Blessing hand */}
        <img
          src={shivaBlessingHandImg}
          alt=""
          aria-hidden
          draggable={false}
          className="vt-asv-float select-none"
          style={{
            width: "min(50vmin, 320px)",
            height: "auto",
            filter: "drop-shadow(0 0 30px rgba(212,175,55,0.55))",
            animation: "vt-asv-float 4.5s ease-in-out infinite",
          }}
          data-testid="img-blessing-hand"
        />

        {/* तथास्तु headline */}
        <div
          className="font-serif text-[#D4AF37] mt-2"
          style={{
            fontSize: "clamp(3rem, 12vmin, 6rem)",
            lineHeight: 1,
            animation: "vt-asv-rise 0.8s 0.2s both ease-out",
          }}
          data-testid="text-tathastu"
        >
          तथास्तु
        </div>
        <div
          className="text-[#FFFAEC]/70 text-xs sm:text-sm uppercase tracking-[0.4em] mt-2"
          style={{ animation: "vt-asv-rise 0.8s 0.4s both ease-out" }}
        >
          So be it
        </div>

        {personalisedFor && (
          <div
            className="vt-asv-rise mt-3 italic text-[#D4AF37] text-sm sm:text-base"
            style={{ animation: "vt-asv-rise 0.8s 0.5s both ease-out" }}
            data-testid="text-blessing-devotee"
          >
            For {personalisedFor}
          </div>
        )}

        {/* Sanskrit blessing */}
        <div
          className="mt-6 font-serif text-[#FFFAEC] whitespace-pre-line"
          style={{
            fontSize: "clamp(1rem, 2.6vmin, 1.4rem)",
            lineHeight: 1.6,
            animation: "vt-asv-rise 0.8s 0.6s both ease-out",
          }}
          data-testid="text-blessing-sanskrit"
        >
          {sanskrit}
        </div>

        {/* English translation */}
        <div
          className="mt-3 italic text-[#FFFAEC]/80 max-w-xl"
          style={{
            fontSize: "clamp(0.85rem, 1.9vmin, 1rem)",
            lineHeight: 1.55,
            animation: "vt-asv-rise 0.8s 0.8s both ease-out",
          }}
          data-testid="text-blessing-english"
        >
          {english}
        </div>

        <div
          className="mt-5 text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/70"
          style={{ animation: "vt-asv-rise 0.8s 1s both ease-out" }}
        >
          with the grace of {graceLabel}
        </div>

        {/* Buttons */}
        <div
          className="mt-7 flex flex-wrap items-center justify-center gap-3"
          style={{ animation: "vt-asv-rise 0.8s 1.2s both ease-out" }}
        >
          <Button
            size="lg"
            onClick={onDismiss}
            className="bg-[#6D2B35] text-[#D4AF37]"
            data-testid="btn-blessing-receive"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            Receive blessing
          </Button>
          {onShare && (
            <Button
              size="lg"
              variant="outline"
              onClick={(e) => { e.stopPropagation(); onShare(sanskrit, english); }}
              className="border-[#D4AF37]/40 text-[#FFFAEC] bg-transparent"
              data-testid="btn-blessing-share"
            >
              <Share2 className="h-4 w-4 mr-2" />
              Share blessing
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
