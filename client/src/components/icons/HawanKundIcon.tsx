import incenseFlowersImg from "@assets/generated_images/incense-flowers-icon.png";

interface IncenseIconProps {
  className?: string;
  style?: React.CSSProperties;
  active?: boolean;
}

const stickTips = [
  { left: "42%", bottom: "62%", delay: 0 },
  { left: "50%", bottom: "66%", delay: 0.5 },
  { left: "58%", bottom: "62%", delay: 1.1 },
];

export default function HawanKundIcon({
  className,
  style,
  active = false,
}: IncenseIconProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={style}
      aria-hidden
    >
      <span className="absolute inset-0 flex items-end justify-center">
        <img
          src={incenseFlowersImg}
          alt=""
          className="w-full h-full object-contain transition-all"
          style={{
            filter: active
              ? "drop-shadow(0 2px 4px rgba(224,122,43,0.5)) saturate(1.2) brightness(1.05)"
              : "saturate(1.05) brightness(0.98)",
          }}
          draggable={false}
        />
      </span>

      {stickTips.map((tip, i) => (
        <span
          key={`ember-${i}`}
          className="absolute rounded-full incense-ember pointer-events-none"
          style={{
            left: tip.left,
            bottom: tip.bottom,
            width: active ? "3px" : "2px",
            height: active ? "3px" : "2px",
            background: active ? "#ffb347" : "#ff9a4a",
            boxShadow: active
              ? "0 0 5px rgba(255,140,40,1), 0 0 10px rgba(255,90,20,0.7)"
              : "0 0 3px rgba(255,140,40,0.7), 0 0 6px rgba(255,90,20,0.35)",
            animationDelay: `${tip.delay}s`,
            transform: "translate(-50%, 50%)",
          }}
        />
      ))}

      {stickTips.map((tip, i) => (
        <svg
          key={`smoke-${i}`}
          viewBox="0 0 20 80"
          className="absolute pointer-events-none incense-smoke"
          style={{
            left: tip.left,
            bottom: tip.bottom,
            width: "18%",
            height: "60%",
            transform: "translate(-50%, 0)",
            animationDelay: `${tip.delay}s`,
            opacity: 0,
            mixBlendMode: "screen",
          }}
        >
          <defs>
            <linearGradient id={`smokeGrad-${i}`} x1="50%" y1="100%" x2="50%" y2="0%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity={active ? "0.95" : "0.7"} />
              <stop offset="60%" stopColor="#e8d8c0" stopOpacity={active ? "0.5" : "0.35"} />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M10 80 Q 6 65, 10 50 Q 14 35, 8 22 Q 4 12, 12 4"
            stroke={`url(#smokeGrad-${i})`}
            strokeWidth={active ? "2.6" : "2.2"}
            strokeLinecap="round"
            fill="none"
          />
        </svg>
      ))}

      <style>{`
        @keyframes incense-smoke-rise {
          0% {
            opacity: 0;
            transform: translate(-50%, 10%) scaleY(0.4);
          }
          15% {
            opacity: 0.85;
          }
          70% {
            opacity: 0.5;
          }
          100% {
            opacity: 0;
            transform: translate(-30%, -90%) scaleY(1.2);
          }
        }
        .incense-smoke {
          animation: incense-smoke-rise 3.4s ease-out infinite;
          transform-origin: bottom center;
        }
        @keyframes incense-ember-glow {
          0%, 100% {
            opacity: 0.7;
            box-shadow: 0 0 3px rgba(255,140,40,0.8), 0 0 6px rgba(255,90,20,0.4);
          }
          50% {
            opacity: 1;
            box-shadow: 0 0 5px rgba(255,160,60,1), 0 0 10px rgba(255,90,20,0.7);
          }
        }
        .incense-ember {
          animation: incense-ember-glow 1.6s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .incense-smoke, .incense-ember {
            animation: none !important;
          }
        }
      `}</style>
    </span>
  );
}
