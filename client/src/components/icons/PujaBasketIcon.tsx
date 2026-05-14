interface PujaBasketIconProps {
  className?: string;
  style?: React.CSSProperties;
  color?: string;
  accentColor?: string;
  strokeWidth?: number;
  active?: boolean;
}

export default function PujaBasketIcon({
  className,
  style,
  color = "#D4AF37",
  accentColor = "#F2A93B",
  strokeWidth = 1.4,
  active = false,
}: PujaBasketIconProps) {
  const leafFill = color;
  const leafFillOpacity = 0.32;
  const leafStrokeWidth = 1.1;

  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      style={style}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <g transform="translate(16 11) rotate(-62)">
        <path
          d="M 0 0 C 1.4 -2.5, 1.4 -5, 0 -6.8 C -1.4 -5, -1.4 -2.5, 0 0 Z"
          fill={leafFill}
          fillOpacity={leafFillOpacity}
          stroke={color}
          strokeWidth={leafStrokeWidth}
        />
      </g>

      <g transform="translate(16 11) rotate(-30)">
        <path
          d="M 0 0 C 1.6 -3, 1.6 -5.8, 0 -8 C -1.6 -5.8, -1.6 -3, 0 0 Z"
          fill={leafFill}
          fillOpacity={leafFillOpacity}
          stroke={color}
          strokeWidth={leafStrokeWidth}
        />
      </g>

      <g transform="translate(16 11)">
        <path
          d="M 0 0 C 1.8 -3.5, 1.8 -6.5, 0 -8.6 C -1.8 -6.5, -1.8 -3.5, 0 0 Z"
          fill={leafFill}
          fillOpacity={leafFillOpacity}
          stroke={color}
          strokeWidth={leafStrokeWidth}
        />
      </g>

      <g transform="translate(16 11) rotate(30)">
        <path
          d="M 0 0 C 1.6 -3, 1.6 -5.8, 0 -8 C -1.6 -5.8, -1.6 -3, 0 0 Z"
          fill={leafFill}
          fillOpacity={leafFillOpacity}
          stroke={color}
          strokeWidth={leafStrokeWidth}
        />
      </g>

      <g transform="translate(16 11) rotate(62)">
        <path
          d="M 0 0 C 1.4 -2.5, 1.4 -5, 0 -6.8 C -1.4 -5, -1.4 -2.5, 0 0 Z"
          fill={leafFill}
          fillOpacity={leafFillOpacity}
          stroke={color}
          strokeWidth={leafStrokeWidth}
        />
      </g>

      <ellipse
        cx="16"
        cy="9.4"
        rx="2.4"
        ry="2.6"
        fill={accentColor}
        stroke={accentColor}
        strokeWidth="0.4"
        opacity={active ? 1 : 0.95}
      />

      <path
        d="M 11.6 11.5
           C 11 12.6, 10.2 13.4, 9.2 14.4
           C 5.2 16, 4.2 20, 5.2 24
           C 5.7 27, 8.2 28.6, 12 28.6
           L 20 28.6
           C 23.8 28.6, 26.3 27, 26.8 24
           C 27.8 20, 26.8 16, 22.8 14.4
           C 21.8 13.4, 21 12.6, 20.4 11.5
           Z"
        fill={color}
        fillOpacity="0.16"
        stroke={color}
        strokeWidth={strokeWidth}
      />

      <ellipse
        cx="16"
        cy="11.5"
        rx="4.8"
        ry="1"
        fill={color}
        fillOpacity="0.45"
        stroke={color}
        strokeWidth={strokeWidth}
      />

      <path
        d="M 5.6 19.5 Q 16 21 26.4 19.5"
        opacity="0.55"
      />
      <path
        d="M 6.2 23 Q 16 24 25.8 23"
        opacity="0.4"
      />

      <line
        x1="8.5"
        y1="28.9"
        x2="23.5"
        y2="28.9"
        strokeWidth={strokeWidth + 0.4}
      />
    </svg>
  );
}
