// Composite "target reticle" mark anchored to a landing point on the globe.
// Replaces StatusIndicator at this one site — kit only uses this for the
// landing-point callout overlay (Figma UI-UI-Concept-V1.3 / preview/comp-landing-callout.html).

type PointHUDProps = {
  status?: "active" | "inactive";
  /** Pulse the center dot; defaults to true for active. */
  pulse?: boolean;
};

export function PointHUD({ status = "active", pulse = true }: PointHUDProps) {
  const dotColor =
    status === "active" ? "var(--v1-active)" : "var(--v1-inactive-2)";
  return (
    <svg width="64" height="170" viewBox="0 0 64 170" aria-hidden>
      {/* Drop line — orange 1.2px from y=0 down to y=120 */}
      <line
        x1="32"
        y1="0"
        x2="32"
        y2="120"
        stroke="var(--v1-orange)"
        strokeWidth="1.2"
      />

      {/* Outer ring — 4 white arc quadrants with gaps */}
      <g
        transform="translate(32 138)"
        fill="none"
        stroke="#FFFFFF"
        strokeWidth="2.4"
        strokeLinecap="round"
      >
        <path d="M -22 -6 A 24 24 0 0 1 -6 -22" />
        <path d="M  22 -6 A 24 24 0 0 0  6 -22" />
        <path d="M -22  6 A 24 24 0 0 0 -6  22" />
        <path d="M  22  6 A 24 24 0 0 1  6  22" />
      </g>

      {/* Middle ring — 4 orange arcs rotated 45° */}
      <g
        transform="translate(32 138) rotate(45)"
        fill="none"
        stroke="var(--v1-orange)"
        strokeWidth="3"
        strokeLinecap="round"
      >
        <path d="M -15 -4 A 16.5 16.5 0 0 1 -4 -15" />
        <path d="M  15 -4 A 16.5 16.5 0 0 0  4 -15" />
        <path d="M -15  4 A 16.5 16.5 0 0 0 -4  15" />
        <path d="M  15  4 A 16.5 16.5 0 0 1  4  15" />
      </g>

      {/* Inner dot — lime when active, red when inactive */}
      <circle cx="32" cy="138" r="5" fill={dotColor}>
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
