// Composite reticle mark anchored to a landing point on the globe.
// Marker artwork lifted from temp/marker.svg (79×74 native). Wrapped in a
// taller container so we can hang a drop line above the reticle when the
// HUD is used directly under a callout box.

type PointHUDProps = {
  status?: "active" | "inactive";
  /** Pulse the center dot; defaults to true for active. */
  pulse?: boolean;
  /** Hide the drop line — useful when an external stem provides the line. */
  hideLine?: boolean;
};

const MARKER_SCALE = 0.5;
const MARKER_NATIVE_W = 79;
const MARKER_NATIVE_CY = 35.15; // center-y of the reticle in marker coords
const SVG_W = 40;
const SVG_H = 70;
export const MARKER_TOP = 32; // y at which the (scaled) marker artwork begins
const MARKER_X = (SVG_W - MARKER_NATIVE_W * MARKER_SCALE) / 2; // center horizontally
export const HUD_CENTER_Y = MARKER_TOP + MARKER_NATIVE_CY * MARKER_SCALE;
export const HUD_BOTTOM_PAD = SVG_H - HUD_CENTER_Y;

export function PointHUD({
  status = "active",
  pulse = true,
  hideLine = false,
}: PointHUDProps) {
  const dotColor = status === "active" ? "#00FF4D" : "var(--v1-inactive-2)";
  return (
    <svg
      width={SVG_W}
      height={SVG_H}
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      aria-hidden
    >
      {!hideLine && (
        <line
          x1={SVG_W / 2}
          y1="0"
          x2={SVG_W / 2}
          y2={MARKER_TOP}
          stroke="var(--v1-orange)"
          strokeWidth="1.2"
        />
      )}

      <g transform={`translate(${MARKER_X} ${MARKER_TOP}) scale(${MARKER_SCALE})`}>
        {/* White outer ring (full circle, base) */}
        <circle
          cx="31.8352"
          cy="31.8352"
          r="31.8352"
          transform="matrix(1 0 0 -1 7.16016 66.9873)"
          stroke="#FFFFFF"
          strokeWidth="3.60398"
          fill="none"
        />
        {/* Three white arc segments forming the outer ring */}
        <path
          d="M67.088 14.9823C71.771 21.505 74.0386 29.4539 73.5016 37.4656C72.9646 45.4773 69.6566 53.0526 64.145 58.892"
          stroke="#FFFFFF"
          strokeWidth="9.10338"
          fill="none"
        />
        <path
          d="M4.53399 32.218C5.04097 26.2652 7.08136 20.5452 10.4563 15.6155C13.8313 10.6857 18.4258 6.71433 23.792 4.08824"
          stroke="#FFFFFF"
          strokeWidth="9.10338"
          fill="none"
        />
        <path
          d="M34.0956 69.3891C26.6904 68.3295 19.8285 64.8976 14.5389 59.608"
          stroke="#FFFFFF"
          strokeWidth="9.10338"
          fill="none"
        />

        {/* Orange inner ring (rotated full circle) */}
        <circle
          cx="18.0199"
          cy="18.0199"
          r="18.0199"
          transform="matrix(0.53624 -0.844065 -0.844065 -0.53624 44.543 60.0259)"
          stroke="#F05A22"
          strokeWidth="4.55169"
          fill="none"
        />
        {/* Three orange arc segments */}
        <path
          d="M37.8366 14.7727C42.5685 14.5041 47.2464 15.8903 51.0679 18.6937C54.8895 21.497 57.6165 25.5428 58.7812 30.137"
          stroke="#F05A22"
          strokeWidth="6.82754"
          fill="none"
        />
        <path
          d="M26.6242 51.393C23.819 49.2562 21.615 46.4293 20.2272 43.1875C18.8394 39.9457 18.315 36.3997 18.7052 32.895"
          stroke="#F05A22"
          strokeWidth="6.82754"
          fill="none"
        />
        <path
          d="M54.4999 48.4304C51.6282 51.7843 47.7464 54.1167 43.4369 55.0778"
          stroke="#F05A22"
          strokeWidth="6.82754"
          fill="none"
        />

        {/* Center dot — green when active, red when inactive */}
        <circle
          cx="9.13027"
          cy="9.13027"
          r="9.13027"
          transform="matrix(1 0 0 -1 29.8633 44.2827)"
          fill={dotColor}
        >
          {pulse && (
            <animate
              attributeName="opacity"
              values="1;0.55;1"
              dur="1.5s"
              repeatCount="indefinite"
            />
          )}
        </circle>
      </g>
    </svg>
  );
}
