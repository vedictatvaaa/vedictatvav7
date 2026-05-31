import { useRef, useEffect, useMemo } from "react";
import { Link } from "wouter";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  type MotionValue,
} from "framer-motion";
import {
  Flame,
  Sparkles,
  Star,
  ShoppingBag,
  Moon,
  ScrollText,
  CalendarCheck,
  HandHeart,
  ShieldCheck,
  Leaf,
  Lock,
  BadgeCheck,
  ChevronDown,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ *
 * Vedic Tatva — "Your Sacred Journey" cinematic flagship (/experience)
 * Scroll-driven, six-scene guided ritual that branches into the four
 * revenue streams. Built on framer-motion scroll transforms + SVG.
 * ------------------------------------------------------------------ */

const NIGHT = "#0a0610";
const NIGHT_2 = "#1a0d18";
const MAROON = "#6D2B35";
const GOLD = "#D4AF37";
const CREAM = "#F5F0E6";

const PATHS = [
  {
    id: "pandit",
    label: "Pandit Booking",
    href: "/online-pandit-booking",
    icon: HandHeart,
    blurb: "Verified pandits for authentic rituals, online & across India.",
  },
  {
    id: "puja",
    label: "Puja Booking",
    href: "/online-puja-booking",
    icon: Flame,
    blurb: "From Griha Pravesh to Satyanarayan Katha — book sacred ceremonies.",
  },
  {
    id: "essentials",
    label: "Puja Essentials",
    href: "/spiritual-essentials",
    icon: ShoppingBag,
    blurb: "Pure ingredients, authentic sources, traditional preparation.",
  },
  {
    id: "astrology",
    label: "Astrologer Consultation",
    href: "/astrology",
    icon: Moon,
    blurb: "Understand the influences shaping your journey.",
  },
] as const;

/* ----------------------------- Starfield ----------------------------- */
function Starfield({ count = 130 }: { count?: number }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }).map(() => ({
        top: Math.random() * 100,
        left: Math.random() * 100,
        size: Math.random() * 2 + 0.6,
        delay: Math.random() * 4,
        dur: 2.4 + Math.random() * 3.5,
        op: 0.4 + Math.random() * 0.6,
      })),
    [count],
  );
  return (
    <div className="absolute inset-0 overflow-hidden" aria-hidden="true">
      {stars.map((s, i) => (
        <span
          key={i}
          className="vt-star"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: `${s.size}px`,
            height: `${s.size}px`,
            opacity: s.op,
            animationDelay: `${s.delay}s`,
            animationDuration: `${s.dur}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ------------------------------ Mandala ------------------------------ */
function Mandala({ className = "" }: { className?: string }) {
  const petals = Array.from({ length: 12 });
  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <g fill="none" stroke={GOLD} strokeWidth="0.6">
        <circle cx="100" cy="100" r="92" opacity="0.5" />
        <circle cx="100" cy="100" r="74" opacity="0.7" />
        <circle cx="100" cy="100" r="50" opacity="0.85" />
        <circle cx="100" cy="100" r="28" opacity="1" />
        {petals.map((_, i) => (
          <ellipse
            key={i}
            cx="100"
            cy="40"
            rx="11"
            ry="34"
            opacity="0.65"
            transform={`rotate(${i * 30} 100 100)`}
          />
        ))}
        {petals.map((_, i) => (
          <line
            key={`l-${i}`}
            x1="100"
            y1="100"
            x2="100"
            y2="8"
            opacity="0.3"
            transform={`rotate(${i * 30 + 15} 100 100)`}
          />
        ))}
      </g>
      <circle cx="100" cy="100" r="6" fill={GOLD} />
    </svg>
  );
}

/* -------------------------------- Diya -------------------------------- */
function Diya({ scale }: { scale: MotionValue<number> }) {
  return (
    <div className="relative flex flex-col items-center" aria-hidden="true">
      {/* flame */}
      <motion.div style={{ scale }} className="origin-bottom">
        <div className="vt-flame" />
      </motion.div>
      {/* lamp */}
      <svg viewBox="0 0 120 60" className="w-40 sm:w-52 -mt-2">
        <defs>
          <linearGradient id="diyaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#a85b2a" />
            <stop offset="100%" stopColor="#5b2a12" />
          </linearGradient>
        </defs>
        <path d="M10 16 Q60 64 110 16 Q60 36 10 16 Z" fill="url(#diyaGrad)" />
        <ellipse cx="60" cy="16" rx="50" ry="9" fill="#c9762f" />
        <ellipse cx="60" cy="15" rx="38" ry="6" fill="#3a1a0c" />
      </svg>
    </div>
  );
}

/* --------------------------- Section heading -------------------------- */
function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-2 text-xs sm:text-sm tracking-[0.3em] uppercase"
      style={{ color: GOLD }}
    >
      <span className="h-px w-8" style={{ background: GOLD }} />
      {children}
    </span>
  );
}

function CTA({
  href,
  children,
  variant = "solid",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "solid" | "ghost";
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-8 py-3.5 text-sm sm:text-base font-medium transition-all duration-300 hover-elevate active-elevate-2";
  return (
    <Link
      href={href}
      data-testid={`cta-${href.replace(/\W+/g, "-")}`}
      className={base}
      style={
        variant === "solid"
          ? {
              background: `linear-gradient(135deg, ${GOLD}, #b8902a)`,
              color: "#2B1115",
              boxShadow: "0 10px 30px -10px rgba(212,175,55,0.6)",
            }
          : {
              border: `1.5px solid ${MAROON}`,
              color: MAROON,
              background: "rgba(255,255,255,0.35)",
            }
      }
    >
      {children}
      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

/* ----------------------------- Timeline ------------------------------ */
function Timeline({ steps }: { steps: string[] }) {
  return (
    <ol className="flex flex-col sm:flex-row items-stretch gap-3 sm:gap-2">
      {steps.map((step, i) => (
        <li key={step} className="flex items-center gap-3 sm:flex-col sm:gap-2 sm:flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.6 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ delay: i * 0.12, duration: 0.5 }}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold"
            style={{ border: `1px solid ${GOLD}`, color: GOLD, background: "rgba(212,175,55,0.08)" }}
          >
            {i + 1}
          </motion.div>
          <span className="text-sm sm:text-center" style={{ color: "rgba(245,240,230,0.85)" }}>
            {step}
          </span>
        </li>
      ))}
    </ol>
  );
}

/* ============================ Path scene ============================= */
function PathScene({
  index,
  label,
  href,
  ctaLabel,
  icon: Icon,
  lines,
  steps,
  accent,
  children,
}: {
  index: string;
  label: string;
  href: string;
  ctaLabel: string;
  icon: typeof Flame;
  lines: string[];
  steps?: string[];
  accent: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      className="relative flex min-h-screen items-center py-24"
      style={{ background: `radial-gradient(1200px 600px at 50% 0%, ${NIGHT_2}, ${NIGHT})` }}
      data-testid={`scene-${label.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-6 lg:grid-cols-2 lg:items-center">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.7 }}
        >
          <Eyebrow>Path {index}</Eyebrow>
          <h2
            className="mt-4 font-serif text-4xl sm:text-5xl"
            style={{ color: CREAM }}
          >
            {label}
          </h2>
          <div className="mt-6 space-y-1.5">
            {lines.map((l) => (
              <p key={l} className="text-lg" style={{ color: "rgba(245,240,230,0.78)" }}>
                {l}
              </p>
            ))}
          </div>
          {steps && (
            <div className="mt-8">
              <Timeline steps={steps} />
            </div>
          )}
          <div className="mt-9">
            <CTA href={href}>{ctaLabel}</CTA>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.85 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, amount: 0.4 }}
          transition={{ duration: 0.8 }}
          className="relative flex items-center justify-center"
        >
          <div
            className="relative flex h-64 w-64 items-center justify-center rounded-full sm:h-80 sm:w-80"
            style={{
              background: `radial-gradient(circle, ${accent}22, transparent 70%)`,
            }}
          >
            <div
              className="absolute inset-0 rounded-full"
              style={{ boxShadow: `0 0 80px -10px ${accent}`, border: `1px solid ${accent}55` }}
            />
            {children ?? (
              <Icon className="h-24 w-24" style={{ color: accent }} strokeWidth={1} />
            )}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

/* ============================ Kundli wheel =========================== */
function KundliWheel() {
  return (
    <svg viewBox="0 0 200 200" className="h-44 w-44 sm:h-56 sm:w-56" aria-hidden="true">
      <g fill="none" stroke={GOLD} strokeWidth="0.8">
        <rect x="20" y="20" width="160" height="160" />
        <line x1="20" y1="20" x2="180" y2="180" />
        <line x1="180" y1="20" x2="20" y2="180" />
        <polygon points="100,20 180,100 100,180 20,100" />
        <polygon points="100,20 140,60 100,100 60,60" opacity="0.6" />
        <polygon points="180,100 140,140 100,100 140,60" opacity="0.6" />
      </g>
      <circle cx="100" cy="100" r="4" fill={GOLD} />
    </svg>
  );
}

/* =============================== Page =============================== */
export default function ExperiencePage() {
  const rootRef = useRef<HTMLDivElement>(null);

  // Scene 1 — cosmic
  const cosmicRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: cosmic } = useScroll({
    target: cosmicRef,
    offset: ["start start", "end start"],
  });
  const starsScale = useSpring(useTransform(cosmic, [0, 1], [1, 2.6]), { stiffness: 60, damping: 20 });
  const mandalaScale = useTransform(cosmic, [0, 1], [0.7, 1.7]);
  const mandalaRotate = useTransform(cosmic, [0, 1], [0, 90]);
  const cosmicTextY = useTransform(cosmic, [0, 1], [0, -120]);
  const cosmicTextOpacity = useTransform(cosmic, [0, 0.6], [1, 0]);

  // Scene 2 — sankalp
  const sankalpRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: sankalp } = useScroll({
    target: sankalpRef,
    offset: ["start end", "end start"],
  });
  const flameScale = useSpring(useTransform(sankalp, [0.2, 0.7], [0.4, 1.4]), {
    stiffness: 50,
    damping: 18,
  });

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Your Sacred Journey · Vedic Tatva";
    const meta = document.querySelector('meta[name="description"]');
    const prevDesc = meta?.getAttribute("content") ?? null;
    meta?.setAttribute(
      "content",
      "Begin a cinematic Vedic journey — book verified pandits, sacred pujas, authentic puja essentials and astrologer consultations with Vedic Tatva.",
    );
    return () => {
      document.title = prevTitle;
      if (meta && prevDesc !== null) meta.setAttribute("content", prevDesc);
    };
  }, []);

  return (
    <div ref={rootRef} style={{ background: NIGHT }} data-testid="page-experience">
      {/* Inline keyframes scoped to this page */}
      <style>{`
        .vt-star{position:absolute;border-radius:9999px;background:#fff;
          box-shadow:0 0 6px rgba(255,255,255,0.8);animation:vtTwinkle ease-in-out infinite;}
        @keyframes vtTwinkle{0%,100%{opacity:.2;transform:scale(.7)}50%{opacity:1;transform:scale(1.2)}}
        .vt-flame{width:26px;height:46px;border-radius:50% 50% 50% 50%/60% 60% 40% 40%;
          background:radial-gradient(circle at 50% 75%, #fff6d6 0%, ${GOLD} 35%, #ff8a1e 70%, #c0341a 100%);
          box-shadow:0 0 40px 8px rgba(255,160,40,0.55);
          animation:vtFlicker 1.6s ease-in-out infinite;transform-origin:bottom center;}
        @keyframes vtFlicker{0%,100%{transform:scaleY(1) skewX(-1deg)}25%{transform:scaleY(1.08) skewX(2deg)}
          50%{transform:scaleY(.95) skewX(-2deg)}75%{transform:scaleY(1.05) skewX(1deg)}}
        @keyframes vtRayPulse{0%,100%{opacity:.35}50%{opacity:.75}}
        @media (prefers-reduced-motion: reduce){
          .vt-star,.vt-flame{animation:none!important}
        }
      `}</style>

      {/* Floating brand / home link */}
      <Link
        href="/"
        className="fixed left-5 top-5 z-50 font-serif text-lg tracking-wide"
        style={{ color: GOLD }}
        data-testid="link-experience-home"
      >
        Vedic&nbsp;Tatva
      </Link>

      {/* ===================== Scene 1: Cosmic Beginning ===================== */}
      <section
        ref={cosmicRef}
        className="relative flex h-[200vh] flex-col"
        data-testid="scene-cosmic"
      >
        <div className="sticky top-0 flex h-screen items-center justify-center overflow-hidden">
          <div
            className="absolute inset-0"
            style={{ background: `radial-gradient(900px 600px at 50% 40%, ${NIGHT_2}, ${NIGHT} 70%)` }}
          />
          <motion.div style={{ scale: starsScale }} className="absolute inset-0">
            <Starfield />
          </motion.div>
          <motion.div
            style={{ scale: mandalaScale, rotate: mandalaRotate }}
            className="pointer-events-none absolute h-[80vmin] w-[80vmin] opacity-40"
          >
            <Mandala className="h-full w-full" />
          </motion.div>
          <motion.div
            style={{ y: cosmicTextY, opacity: cosmicTextOpacity }}
            className="relative z-10 max-w-2xl px-6 text-center"
          >
            <Eyebrow>Your Sacred Journey</Eyebrow>
            <h1
              className="mt-6 font-serif text-3xl leading-snug sm:text-5xl"
              style={{ color: CREAM }}
            >
              For thousands of years, seekers have turned to Vedic wisdom for
              guidance, prosperity and peace.
            </h1>
            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="mt-12 flex flex-col items-center gap-2"
              style={{ color: "rgba(245,240,230,0.6)" }}
            >
              <span className="text-xs tracking-[0.3em] uppercase">Scroll to begin</span>
              <ChevronDown className="h-5 w-5" />
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* ===================== Scene 2: Sankalp ===================== */}
      <section
        ref={sankalpRef}
        className="relative flex min-h-screen items-center justify-center overflow-hidden py-24"
        style={{ background: `radial-gradient(800px 500px at 50% 70%, ${NIGHT_2}, ${NIGHT})` }}
        data-testid="scene-sankalp"
      >
        <div className="relative z-10 flex flex-col items-center px-6 text-center">
          <Eyebrow>The Intention</Eyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.6 }}
            transition={{ duration: 0.8 }}
            className="mt-6 max-w-xl font-serif text-3xl sm:text-5xl"
            style={{ color: CREAM }}
          >
            Every sacred journey begins with a Sankalp.
          </motion.h2>
          <div className="my-12">
            <Diya scale={flameScale} />
          </div>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 1 }}
            className="font-serif text-2xl sm:text-3xl"
            style={{ color: GOLD }}
          >
            What brings you here today?
          </motion.p>
        </div>
      </section>

      {/* ===================== Scene 3: Four Paths ===================== */}
      <section
        className="relative min-h-screen overflow-hidden py-28"
        style={{ background: `radial-gradient(1000px 700px at 50% 0%, ${NIGHT_2}, ${NIGHT})` }}
        data-testid="scene-four-paths"
      >
        {/* rays */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-full w-full -translate-x-1/2">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute left-1/2 top-0 h-[60%] w-px origin-top"
              style={{
                background: `linear-gradient(to bottom, ${GOLD}, transparent)`,
                transform: `translateX(-50%) rotate(${-30 + i * 20}deg)`,
                animation: "vtRayPulse 3s ease-in-out infinite",
                animationDelay: `${i * 0.4}s`,
              }}
            />
          ))}
        </div>
        <div className="relative z-10 mx-auto max-w-6xl px-6 text-center">
          <Eyebrow>Four Sacred Paths</Eyebrow>
          <h2 className="mt-5 font-serif text-3xl sm:text-5xl" style={{ color: CREAM }}>
            Choose the path that calls to you
          </h2>
          <div className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PATHS.map((p, i) => {
              const Icon = p.icon;
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.3 }}
                  transition={{ delay: i * 0.12, duration: 0.6 }}
                >
                  <Link
                    href={p.href}
                    className="group flex h-full flex-col items-center rounded-2xl p-7 text-center transition-all duration-300 hover-elevate"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(212,175,55,0.25)",
                    }}
                    data-testid={`path-card-${p.id}`}
                  >
                    <span
                        className="flex h-16 w-16 items-center justify-center rounded-full transition-transform duration-300 group-hover:scale-110"
                        style={{ background: "rgba(212,175,55,0.1)", border: `1px solid ${GOLD}55` }}
                      >
                        <Icon className="h-7 w-7" style={{ color: GOLD }} strokeWidth={1.5} />
                      </span>
                      <h3 className="mt-5 font-serif text-xl" style={{ color: CREAM }}>
                        {p.label}
                      </h3>
                    <p className="mt-3 text-sm" style={{ color: "rgba(245,240,230,0.65)" }}>
                      {p.blurb}
                    </p>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== Scene 4A: Pandit Booking ===================== */}
      <PathScene
        index="I"
        label="Pandit Booking"
        href="/online-pandit-booking"
        ctaLabel="Book a Pandit"
        icon={HandHeart}
        accent={GOLD}
        lines={["Verified Pandits", "Authentic Rituals", "Online & Offline", "Across India"]}
        steps={["Choose Ritual", "Select Date", "Meet Pandit", "Perform Puja"]}
      />

      {/* ===================== Scene 4B: Puja Booking ===================== */}
      <PathScene
        index="II"
        label="Puja Booking"
        href="/online-puja-booking"
        ctaLabel="Book a Puja"
        icon={Flame}
        accent="#ff9a3c"
        lines={[
          "From Griha Pravesh",
          "to Satyanarayan Katha,",
          "book authentic Vedic ceremonies.",
        ]}
      >
        <div className="relative">
          <div className="vt-flame" style={{ transform: "scale(2.2)" }} />
        </div>
      </PathScene>

      {/* ===================== Scene 4C: Puja Essentials ===================== */}
      <PathScene
        index="III"
        label="Puja Essentials"
        href="/spiritual-essentials"
        ctaLabel="Shop Puja Essentials"
        icon={ShoppingBag}
        accent="#e8c25a"
        lines={["Pure Ingredients.", "Authentic Sources.", "Traditional Preparation."]}
      >
        <div className="grid grid-cols-2 gap-6">
          {[
            { Icon: Flame, t: "Camphor" },
            { Icon: Sparkles, t: "Dhoop" },
            { Icon: Leaf, t: "Havan Samagri" },
            { Icon: Star, t: "Rudraksha" },
          ].map(({ Icon, t }, i) => (
            <motion.div
              key={t}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="flex flex-col items-center gap-2"
            >
              <span
                className="flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgba(212,175,55,0.1)", border: `1px solid ${GOLD}55` }}
              >
                <Icon className="h-6 w-6" style={{ color: GOLD }} strokeWidth={1.5} />
              </span>
              <span className="text-xs" style={{ color: "rgba(245,240,230,0.7)" }}>
                {t}
              </span>
            </motion.div>
          ))}
        </div>
      </PathScene>

      {/* ===================== Scene 4D: Astrologer Consultation ===================== */}
      <PathScene
        index="IV"
        label="Astrologer Consultation"
        href="/astrology"
        ctaLabel="Consult an Astrologer"
        icon={Moon}
        accent="#9db4ff"
        lines={["Understand the influences", "shaping your journey."]}
        steps={["Share Birth Details", "Consult Astrologer", "Receive Guidance"]}
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 60, ease: "linear" }}
        >
          <KundliWheel />
        </motion.div>
      </PathScene>

      {/* ===================== Scene 5: Why Vedic Tatva ===================== */}
      <section
        className="relative flex min-h-screen items-center justify-center py-28"
        style={{ background: `linear-gradient(${NIGHT}, ${NIGHT_2})` }}
        data-testid="scene-why"
      >
        <div className="mx-auto max-w-4xl px-6 text-center">
          <Eyebrow>Why Vedic Tatva</Eyebrow>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.5 }}
            transition={{ duration: 0.8 }}
            className="mt-6 font-serif text-3xl sm:text-5xl"
            style={{ color: CREAM }}
          >
            One destination.
            <br />
            Authentic Vedic guidance.
          </motion.h2>
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { Icon: BadgeCheck, t: "Verified Experts" },
              { Icon: ScrollText, t: "Traditional Methods" },
              { Icon: Leaf, t: "Genuine Products" },
              { Icon: Lock, t: "Secure Booking" },
            ].map(({ Icon, t }, i) => (
              <motion.div
                key={t}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true, amount: 0.4 }}
                transition={{ delay: i * 0.1 }}
                className="flex flex-col items-center gap-3 rounded-xl p-6"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(212,175,55,0.2)" }}
              >
                <Icon className="h-8 w-8" style={{ color: GOLD }} strokeWidth={1.5} />
                <span className="text-sm" style={{ color: "rgba(245,240,230,0.85)" }}>
                  {t}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== Scene 6: Final Blessing ===================== */}
      <section
        className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden py-28"
        data-testid="scene-blessing"
        style={{
          background: `linear-gradient(to top, #f3d9a4 0%, #d99a5b 30%, ${MAROON} 70%, ${NIGHT_2} 100%)`,
        }}
      >
        {/* sun glow */}
        <div
          className="pointer-events-none absolute bottom-0 left-1/2 h-[60vh] w-[60vh] -translate-x-1/2 translate-y-1/3 rounded-full"
          style={{ background: "radial-gradient(circle, rgba(255,240,200,0.9), transparent 60%)" }}
          aria-hidden="true"
        />
        {/* temple silhouette */}
        <svg
          viewBox="0 0 400 120"
          className="pointer-events-none absolute bottom-0 left-0 w-full"
          aria-hidden="true"
          preserveAspectRatio="none"
        >
          <path
            d="M0 120 V70 H30 V55 H50 V70 H80 V40 L100 20 L120 40 V70 H150 V55 H170 V70 H200 V35 L220 10 L240 35 V70 H270 V55 H290 V70 H320 V40 L340 20 L360 40 V70 H390 V120 Z"
            fill={NIGHT_2}
            opacity="0.85"
          />
        </svg>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.5 }}
          transition={{ duration: 1 }}
          className="relative z-10 mx-auto max-w-3xl px-6 text-center"
        >
          <h2 className="font-serif text-3xl leading-snug sm:text-5xl" style={{ color: "#2B1115" }}>
            May your path be guided by wisdom, devotion and blessings.
          </h2>
          <div className="mt-12 flex flex-wrap items-center justify-center gap-4">
            <CTA href="/online-pandit-booking">Book a Pandit</CTA>
            <CTA href="/online-puja-booking">Book a Puja</CTA>
            <CTA href="/spiritual-essentials" variant="ghost">
              Shop Essentials
            </CTA>
            <CTA href="/astrology" variant="ghost">
              Consult Astrologer
            </CTA>
          </div>
        </motion.div>
      </section>
    </div>
  );
}
