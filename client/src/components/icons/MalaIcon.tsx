type Props = {
  className?: string;
  strokeWidth?: number;
  style?: React.CSSProperties;
  "data-active"?: boolean;
};

export default function MalaIcon({ className, strokeWidth = 1.8, style }: Props) {
  const stroke = "currentColor";
  const beadFill = "currentColor";
  const cx = 12;
  const cy = 12.4;
  const r = 6.6;
  const beadCount = 10;
  const beadR = 1.35;
  const beads = Array.from({ length: beadCount }, (_, i) => {
    const a = (i / beadCount) * Math.PI * 2 - Math.PI / 2;
    return { x: cx + Math.cos(a) * r, y: cy + Math.sin(a) * r };
  });

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
      aria-hidden="true"
    >
      <circle cx={cx} cy={cy} r={r} stroke={stroke} strokeWidth={strokeWidth * 0.55} strokeDasharray="0.6 1.4" opacity="0.55" />
      {beads.map((b, i) => (
        <circle key={i} cx={b.x} cy={b.y} r={beadR} fill={beadFill} stroke={stroke} strokeWidth={strokeWidth * 0.4} opacity={0.95} />
      ))}
      <circle cx={cx} cy={cy - r - 2.2} r={beadR * 1.55} fill={beadFill} stroke={stroke} strokeWidth={strokeWidth * 0.5} />
      <path
        d={`M ${cx - 0.9} ${cy - r - 2.2} L ${cx - 0.4} ${cy - r - 0.9} M ${cx + 0.9} ${cy - r - 2.2} L ${cx + 0.4} ${cy - r - 0.9}`}
        stroke={stroke}
        strokeWidth={strokeWidth * 0.5}
        strokeLinecap="round"
        opacity="0.7"
      />
    </svg>
  );
}
