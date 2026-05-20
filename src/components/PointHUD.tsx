// Composite "target reticle" mark anchored to a landing point on the globe.
// Used inside LandingPointCallout (Figma UI-UI-Concept-V1.3).

type PointHUDProps = {
  status?: "active" | "inactive";
  /** Pulse the center dot; defaults to true for active. */
  pulse?: boolean;
};

export function PointHUD({ status = "active", pulse = true }: PointHUDProps) {
  const dotColor =
    status === "active" ? "var(--v1-active)" : "var(--v1-inactive-2)";
  return (
    <svg width="48" height="90" viewBox="0 0 48 90" aria-hidden>
      {/* Drop line — orange 1.2px from y=0 down to y=58 */}
      <line
        x1="24"
        y1="0"
        x2="24"
        y2="58"
        stroke="var(--v1-orange)"
        strokeWidth="1.2"
      />

      {/* Outer ring — 4 white arc quadrants with gaps */}
      <g
        transform="translate(24 72)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2"
        strokeLinecap="round"
      >
        <path d="M -16 -4 A 17 17 0 0 1 -4 -16" />
        <path d="M  16 -4 A 17 17 0 0 0  4 -16" />
        <path d="M -16  4 A 17 17 0 0 0 -4  16" />
        <path d="M  16  4 A 17 17 0 0 1  4  16" />
      </g>

      {/* Middle ring — 4 orange arcs rotated 45° */}
      <g
        transform="translate(24 72) rotate(45)"
        fill="none"
        stroke="var(--v1-orange)"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M -10 -3 A 11 11 0 0 1 -3 -10" />
        <path d="M  10 -3 A 11 11 0 0 0  3 -10" />
        <path d="M -10  3 A 11 11 0 0 0 -3  10" />
        <path d="M  10  3 A 11 11 0 0 1  3  10" />
      </g>

      {/* Inner dot — lime when active, red when inactive */}
      <circle cx="24" cy="72" r="4" fill={dotColor}>
        {pulse && (
          <animate
            attributeName="opacity"
            values="1;0.55;1"
            dur="1.5s"
            repeatCount="indefinite"
          />
        )}
      </circle>
    </svg>
  );
}
