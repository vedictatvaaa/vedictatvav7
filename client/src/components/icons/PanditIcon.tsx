import panditImg from "@assets/generated_images/pandit-icon.png";

interface PanditIconProps {
  className?: string;
  style?: React.CSSProperties;
  active?: boolean;
}

export default function PanditIcon({ className, style, active = false }: PanditIconProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={style}
      aria-hidden
    >
      <span
        className="absolute rounded-full pandit-aura pointer-events-none"
        style={{
          width: "120%",
          height: "120%",
          background:
            "radial-gradient(circle, rgba(255,196,90,0.45) 0%, rgba(255,196,90,0.15) 45%, rgba(255,196,90,0) 75%)",
          opacity: active ? 1 : 0.6,
          filter: "blur(2px)",
        }}
      />
      <img
        src={panditImg}
        alt=""
        className="relative w-full h-full object-contain transition-all"
        style={{
          filter: active
            ? "drop-shadow(0 2px 4px rgba(46,125,107,0.55)) saturate(1.18) brightness(1.04)"
            : "saturate(1.05) brightness(0.98)",
        }}
        draggable={false}
      />
      <style>{`
        @keyframes pandit-aura-pulse {
          0%, 100% { transform: scale(0.92); opacity: 0.45; }
          50%      { transform: scale(1.05); opacity: 0.85; }
        }
        .pandit-aura {
          animation: pandit-aura-pulse 3s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .pandit-aura { animation: none; }
        }
      `}</style>
    </span>
  );
}
