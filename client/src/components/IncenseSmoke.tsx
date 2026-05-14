interface IncenseSmokeProps {
  className?: string;
}

export function IncenseSmoke({ className = "" }: IncenseSmokeProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}
      data-testid="incense-smoke"
    >
      <span className="vt-smoke vt-smoke-1" />
      <span className="vt-smoke vt-smoke-2" />
      <span className="vt-smoke vt-smoke-3" />
    </div>
  );
}
