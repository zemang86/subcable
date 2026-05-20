"use client";

import type { LandingPoint } from "@/lib/types";
import { StatusIndicator } from "./StatusIndicator";

type LandingPointCalloutProps = {
  point: LandingPoint;
  /** Screen-space position of the landing point on the globe canvas. */
  screenPos: { x: number; y: number };
  /** When true, the callout fades and stops receiving pointer events. */
  hidden?: boolean;
  onClose?: () => void;
};

const CALLOUT_OFFSET_Y = 110;
const CALLOUT_OFFSET_X = -120;

export function LandingPointCallout({
  point,
  screenPos,
  hidden = false,
  onClose,
}: LandingPointCalloutProps) {
  return (
    <div
      style={{
        position: "absolute",
        left: screenPos.x + CALLOUT_OFFSET_X,
        top: screenPos.y - CALLOUT_OFFSET_Y,
        width: 240,
        pointerEvents: hidden ? "none" : "auto",
        opacity: hidden ? 0 : 1,
        transition: "opacity 200ms ease",
        zIndex: 15,
      }}
    >
      {/* Box */}
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close callout for ${point.name}`}
        style={{
          width: "100%",
          padding: "10px 12px",
          background: "rgba(240, 90, 34, 0.92)",
          border: "1px solid rgba(255, 255, 255, 0.55)",
          color: "var(--v1-fg)",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 4,
        }}
      >
        <span
          className="v1-h-heading"
          style={{
            fontSize: 16,
            color: "var(--v1-fg)",
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            lineHeight: 1.1,
          }}
        >
          {point.name}
        </span>
        <span className="v1-coords" style={{ color: "var(--v1-fg)" }}>
          {point.region.toUpperCase()} · {point.lat.toFixed(4)}, {point.lng.toFixed(4)}
        </span>
      </button>

      {/* Connector line — straight 1px orange line from box bottom to the landing-point ring */}
      <div
        style={{
          width: 1,
          height: CALLOUT_OFFSET_Y - 24,
          margin: `0 auto`,
          background: "var(--v1-orange)",
        }}
      />

      {/* Status indicator anchored on the landing point */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        <StatusIndicator
          status={point.kind === "pop" ? "inactive" : "active"}
          pulse={point.kind !== "pop"}
        />
      </div>
    </div>
  );
}
