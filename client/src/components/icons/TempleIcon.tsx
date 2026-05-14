import templeImg from "@assets/generated_images/kedarnath-3d-icon.png";

interface TempleIconProps {
  className?: string;
  style?: React.CSSProperties;
  active?: boolean;
}

export default function TempleIcon({ className, style, active = false }: TempleIconProps) {
  return (
    <span
      className={`relative inline-flex items-center justify-center ${className ?? ""}`}
      style={style}
      aria-hidden
    >
      <img
        src={templeImg}
        alt=""
        className="relative w-full h-full object-contain transition-all temple-3d"
        style={{
          filter: active
            ? "drop-shadow(0 2px 5px rgba(180,95,77,0.55)) saturate(1.18) brightness(1.04)"
            : "drop-shadow(0 1px 2px rgba(0,0,0,0.18)) saturate(1.05)",
        }}
        draggable={false}
      />
      <style>{`
        @keyframes temple-3d-float {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-1px); }
        }
        .temple-3d {
          animation: temple-3d-float 3.4s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .temple-3d { animation: none; }
        }
      `}</style>
    </span>
  );
}
