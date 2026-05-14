import React from "react";

type SunbeamProps = { left: string; delay: string; duration: string; angle?: number; width?: number };
function Sunbeam({ left, delay, duration, angle = 18, width = 220 }: SunbeamProps) {
  return (
    <div
      className="ambient-sunbeam"
      style={{
        left,
        animationDelay: delay,
        animationDuration: duration,
        width: `${width}px`,
        ["--sunbeam-angle" as string]: `${angle}deg`,
      }}
      aria-hidden="true"
    />
  );
}

type FlowerKind = "marigold" | "lotus" | "hibiscus" | "champa" | "jasmine" | "rose";
type FlowerProps = { left: string; delay: string; duration: string; size?: number; kind: FlowerKind };

function Marigold({ uid }: { uid: string }) {
  // Layered pom-pom genda — saffron deepening to amber centre.
  const petals = 14;
  const outer = Array.from({ length: petals }, (_, i) => (i / petals) * 360);
  const mid = Array.from({ length: petals }, (_, i) => ((i + 0.5) / petals) * 360);
  const inner = Array.from({ length: 10 }, (_, i) => (i / 10) * 360);
  return (
    <g>
      <defs>
        <radialGradient id={`mg-out-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F4A93E" />
          <stop offset="100%" stopColor="#C56B14" />
        </radialGradient>
        <radialGradient id={`mg-mid-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#F8C16B" />
          <stop offset="100%" stopColor="#D6852A" />
        </radialGradient>
        <radialGradient id={`mg-in-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFE9B3" />
          <stop offset="100%" stopColor="#E0902E" />
        </radialGradient>
      </defs>
      {outer.map((a) => (
        <ellipse
          key={`o-${a}`}
          cx="32" cy="14" rx="6.5" ry="11"
          fill={`url(#mg-out-${uid})`}
          transform={`rotate(${a} 32 32)`}
          opacity="0.95"
        />
      ))}
      {mid.map((a) => (
        <ellipse
          key={`m-${a}`}
          cx="32" cy="20" rx="5.5" ry="9"
          fill={`url(#mg-mid-${uid})`}
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {inner.map((a) => (
        <ellipse
          key={`i-${a}`}
          cx="32" cy="26" rx="3.8" ry="6"
          fill={`url(#mg-in-${uid})`}
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="3" fill="#7A3A0E" opacity="0.8" />
    </g>
  );
}

function Lotus({ uid }: { uid: string }) {
  // 10-petal radiant lotus, pink with golden centre.
  const petals = 10;
  const angles = Array.from({ length: petals }, (_, i) => (i / petals) * 360);
  return (
    <g>
      <defs>
        <linearGradient id={`lt-out-${uid}`} x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#F8D5DD" />
          <stop offset="55%" stopColor="#E89AAD" />
          <stop offset="100%" stopColor="#B23A5C" />
        </linearGradient>
        <radialGradient id={`lt-cen-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FFF1B5" />
          <stop offset="80%" stopColor="#D4AF37" />
          <stop offset="100%" stopColor="#8C6E1A" />
        </radialGradient>
      </defs>
      {angles.map((a) => (
        <path
          key={`lp-${a}`}
          d="M32 32 C 26 22, 26 12, 32 4 C 38 12, 38 22, 32 32 Z"
          fill={`url(#lt-out-${uid})`}
          stroke="#7A2E40"
          strokeOpacity="0.25"
          strokeWidth="0.4"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {angles.map((a) => (
        <path
          key={`lp2-${a}`}
          d="M32 32 C 28 24, 28 16, 32 10 C 36 16, 36 24, 32 32 Z"
          fill={`url(#lt-out-${uid})`}
          opacity="0.85"
          transform={`rotate(${a + 18} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="6" fill={`url(#lt-cen-${uid})`} />
      {/* Tiny dot stamens for richness */}
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <circle key={`st-${a}`} cx="32" cy="29" r="0.9" fill="#8C6E1A" transform={`rotate(${a} 32 32)`} />
      ))}
    </g>
  );
}

function Hibiscus({ uid }: { uid: string }) {
  // 5 broad red petals with long stamen — the Devi flower (Jaba).
  const angles = [0, 72, 144, 216, 288];
  return (
    <g>
      <defs>
        <radialGradient id={`hb-${uid}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#F2A4A4" />
          <stop offset="55%" stopColor="#C8294A" />
          <stop offset="100%" stopColor="#7A1024" />
        </radialGradient>
      </defs>
      {angles.map((a) => (
        <path
          key={`hp-${a}`}
          d="M32 32 C 18 24, 14 8, 32 2 C 50 8, 46 24, 32 32 Z"
          fill={`url(#hb-${uid})`}
          stroke="#5A0A18"
          strokeOpacity="0.3"
          strokeWidth="0.5"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {/* Dark veining centre */}
      {angles.map((a) => (
        <path
          key={`hv-${a}`}
          d="M32 32 L 32 8"
          stroke="#5A0A18"
          strokeOpacity="0.55"
          strokeWidth="0.6"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {/* Stamen */}
      <line x1="32" y1="32" x2="32" y2="48" stroke="#D4AF37" strokeWidth="1.2" strokeLinecap="round" />
      <circle cx="32" cy="50" r="1.6" fill="#FFE9A8" stroke="#C49520" strokeWidth="0.4" />
      <circle cx="30" cy="49" r="0.9" fill="#FFE9A8" />
      <circle cx="34" cy="49" r="0.9" fill="#FFE9A8" />
      <circle cx="32" cy="32" r="2.2" fill="#7A1024" />
    </g>
  );
}

function Champa({ uid }: { uid: string }) {
  // 5 spiral cream-yellow petals — plumeria.
  const angles = [0, 72, 144, 216, 288];
  return (
    <g>
      <defs>
        <radialGradient id={`ch-${uid}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FFF6D5" />
          <stop offset="60%" stopColor="#FBE3A1" />
          <stop offset="100%" stopColor="#D9A24B" />
        </radialGradient>
      </defs>
      {angles.map((a) => (
        <path
          key={`cp-${a}`}
          d="M32 32 C 22 26, 18 14, 32 6 C 36 16, 38 24, 32 32 Z"
          fill={`url(#ch-${uid})`}
          stroke="#B0822D"
          strokeOpacity="0.25"
          strokeWidth="0.4"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      <circle cx="32" cy="32" r="3.5" fill="#E8B954" />
      <circle cx="32" cy="32" r="1.6" fill="#8A5E1B" />
    </g>
  );
}

function Jasmine({ uid }: { uid: string }) {
  // Cluster of 3 small white star-flowers — mogra.
  const positions = [
    { cx: 22, cy: 28, scale: 0.7 },
    { cx: 38, cy: 24, scale: 0.85 },
    { cx: 32, cy: 40, scale: 0.75 },
  ];
  const petalAngles = [0, 60, 120, 180, 240, 300];
  return (
    <g>
      <defs>
        <radialGradient id={`js-${uid}`} cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#FFFFFF" />
          <stop offset="80%" stopColor="#F8F2E0" />
          <stop offset="100%" stopColor="#D8CC9C" />
        </radialGradient>
      </defs>
      {positions.map((p, idx) => (
        <g key={idx} transform={`translate(${p.cx - 32} ${p.cy - 32}) scale(${p.scale} ${p.scale})`} style={{ transformOrigin: "32px 32px" }}>
          {petalAngles.map((a) => (
            <ellipse
              key={`jp-${idx}-${a}`}
              cx="32" cy="26" rx="3.2" ry="6"
              fill={`url(#js-${uid})`}
              stroke="#C9BE92"
              strokeOpacity="0.35"
              strokeWidth="0.3"
              transform={`rotate(${a} 32 32)`}
            />
          ))}
          <circle cx="32" cy="32" r="1.8" fill="#E8C75A" />
          <circle cx="32" cy="32" r="0.8" fill="#9C7A20" />
        </g>
      ))}
    </g>
  );
}

function Rose({ uid }: { uid: string }) {
  // Top-down rolled rose, deep crimson with bright heart.
  return (
    <g>
      <defs>
        <radialGradient id={`rs-${uid}`} cx="50%" cy="50%" r="55%">
          <stop offset="0%" stopColor="#F3A0AE" />
          <stop offset="50%" stopColor="#B23A48" />
          <stop offset="100%" stopColor="#5C0F1B" />
        </radialGradient>
      </defs>
      {/* Outer ruffle of 6 petals */}
      {[0, 60, 120, 180, 240, 300].map((a) => (
        <path
          key={`ro-${a}`}
          d="M32 32 Q 16 22, 22 6 Q 32 14, 42 6 Q 48 22, 32 32 Z"
          fill={`url(#rs-${uid})`}
          opacity="0.92"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {/* Mid layer */}
      {[30, 90, 150, 210, 270, 330].map((a) => (
        <path
          key={`rm-${a}`}
          d="M32 32 Q 22 22, 28 12 Q 32 18, 36 12 Q 42 22, 32 32 Z"
          fill={`url(#rs-${uid})`}
          opacity="0.95"
          transform={`rotate(${a} 32 32)`}
        />
      ))}
      {/* Inner curl */}
      <circle cx="32" cy="32" r="6" fill="#7A1024" />
      <path d="M32 28 Q 36 30, 34 34 Q 30 36, 28 32 Q 30 28, 32 28 Z" fill="#5C0F1B" />
      <path d="M32 30 Q 34 32, 32 34" stroke="#3A0610" strokeWidth="0.7" fill="none" />
    </g>
  );
}

function Flower({ left, delay, duration, size = 36, kind }: FlowerProps) {
  const uid = `${kind}-${left.replace(/[^0-9]/g, "")}-${delay.replace(/[^0-9]/g, "")}`;
  return (
    <svg
      className={`ambient-flower ambient-flower-${kind}`}
      style={{ left, animationDelay: delay, animationDuration: duration, width: size, height: size }}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      {kind === "marigold" && <Marigold uid={uid} />}
      {kind === "lotus" && <Lotus uid={uid} />}
      {kind === "hibiscus" && <Hibiscus uid={uid} />}
      {kind === "champa" && <Champa uid={uid} />}
      {kind === "jasmine" && <Jasmine uid={uid} />}
      {kind === "rose" && <Rose uid={uid} />}
    </svg>
  );
}

type BelPatraProps = { left: string; delay: string; duration: string; size?: number };
function BelPatra({ left, delay, duration, size = 36 }: BelPatraProps) {
  const uid = `${left.replace(/[^0-9]/g, "")}-${delay.replace(/[^0-9]/g, "")}`;
  return (
    <svg
      className="ambient-belpatra"
      style={{ left, animationDelay: delay, animationDuration: duration, width: size, height: size }}
      viewBox="0 0 64 64"
      aria-hidden="true"
    >
      <defs>
        <radialGradient id={`leafGrad-${uid}`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#7DAE63" stopOpacity="0.9" />
          <stop offset="100%" stopColor="#3F6B2C" stopOpacity="0.85" />
        </radialGradient>
      </defs>
      <g transform="translate(32 34)">
        <path
          d="M0 0 C-3 -10, -10 -16, -8 -24 C-4 -22, 0 -16, 0 -8 Z"
          fill={`url(#leafGrad-${uid})`}
          transform="rotate(-30)"
        />
        <path
          d="M0 0 C-3 -10, -10 -16, -8 -24 C-4 -22, 0 -16, 0 -8 Z"
          fill={`url(#leafGrad-${uid})`}
        />
        <path
          d="M0 0 C-3 -10, -10 -16, -8 -24 C-4 -22, 0 -16, 0 -8 Z"
          fill={`url(#leafGrad-${uid})`}
          transform="rotate(30)"
        />
        <line x1="0" y1="0" x2="0" y2="14" stroke="#5D4528" strokeWidth="1.4" strokeLinecap="round" opacity="0.75" />
      </g>
    </svg>
  );
}

export default function AmbientBackdrop() {
  return (
    <div className="ambient-backdrop" aria-hidden="true">
      {/* Diagonal sunbeams from upper-left, drifting */}
      <Sunbeam left="-8%"  delay="0s"   duration="55s" angle={20} width={280} />
      <Sunbeam left="62%"  delay="-22s" duration="62s" angle={20} width={260} />

      {/* Marigolds — the dominant temple bloom */}
      <Flower left="8%"  delay="0s"   duration="36s" size={42} kind="marigold" />
      <Flower left="38%" delay="-12s" duration="42s" size={48} kind="marigold" />
      <Flower left="72%" delay="-22s" duration="38s" size={38} kind="marigold" />

      {/* Lotus — sacred radiance */}
      <Flower left="22%" delay="-6s"  duration="48s" size={52} kind="lotus" />
      <Flower left="58%" delay="-28s" duration="52s" size={46} kind="lotus" />

      {/* Hibiscus — Devi's red flower */}
      <Flower left="48%" delay="-18s" duration="40s" size={44} kind="hibiscus" />
      <Flower left="86%" delay="-9s"  duration="44s" size={40} kind="hibiscus" />

      {/* Champa cream-yellow */}
      <Flower left="14%" delay="-15s" duration="46s" size={38} kind="champa" />
      <Flower left="66%" delay="-3s"  duration="42s" size={36} kind="champa" />

      {/* Jasmine clusters */}
      <Flower left="30%" delay="-20s" duration="50s" size={34} kind="jasmine" />
      <Flower left="80%" delay="-35s" duration="48s" size={32} kind="jasmine" />

      {/* Rose */}
      <Flower left="52%" delay="-8s"  duration="44s" size={40} kind="rose" />
      <Flower left="93%" delay="-26s" duration="50s" size={36} kind="rose" />

      {/* Bel patra leaves */}
      <BelPatra left="18%" delay="-4s"  duration="44s" size={38} />
      <BelPatra left="44%" delay="-22s" duration="50s" size={46} />
      <BelPatra left="76%" delay="-10s" duration="46s" size={34} />
    </div>
  );
}
