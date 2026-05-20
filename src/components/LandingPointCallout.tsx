"use client";

import type { LandingPoint } from "@/lib/types";
import { PointHUD } from "./PointHUD";

type LandingPointCalloutProps = {
  point: LandingPoint;
  /** Screen-space position of the landing point on the globe canvas. */
  screenPos: { x: number; y: number };
  /** When true, the callout fades and stops receiving pointer events. */
  hidden?: boolean;
  onClose?: () => void;
};

const CALLOUT_WIDTH = 380;
const CALLOUT_BOX_HEIGHT = 100; // padding 22+18 + title 32 + row 11 + gap 8 ≈ 91, round up
const GAP_BOX_TO_HUD = 14;
const HUD_CENTER_Y = 138; // y coord of dot inside the 64×170 PointHUD SVG
const OFFSET_FROM_POINT = CALLOUT_BOX_HEIGHT + GAP_BOX_TO_HUD + HUD_CENTER_Y;

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
        left: screenPos.x - CALLOUT_WIDTH / 2,
        top: screenPos.y - OFFSET_FROM_POINT,
        width: CALLOUT_WIDTH,
        pointerEvents: hidden ? "none" : "auto",
        opacity: hidden ? 0 : 1,
        transition: "opacity 200ms ease",
        zIndex: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      {/* Callout box — 4 L-corner orange brackets + translucent deep-orange fill */}
      <button
        type="button"
        onClick={onClose}
        aria-label={`Close callout for ${point.name}`}
        style={{
          position: "relative",
          width: "100%",
          padding: "22px 26px 18px",
          background: "rgba(188, 53, 20, 0.55)",
          border: "1px solid rgba(0, 0, 0, 0)",
          color: "var(--v1-fg)",
          textAlign: "left",
          cursor: "pointer",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        <CornerBracket position="tl" />
        <CornerBracket position="tr" />
        <CornerBracket position="bl" />
        <CornerBracket position="br" />

        <span
          style={{
            fontFamily: "var(--v1-heading)",
            fontWeight: 700,
            fontSize: 32,
            color: "var(--v1-fg)",
            letterSpacing: "0.02em",
            lineHeight: 1,
            textTransform: "uppercase",
          }}
        >
          {point.name}
        </span>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 14,
          }}
        >
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontSize: 11,
              color: "var(--v1-fg)",
              letterSpacing: "0.04em",
            }}
          >
            {point.region}
          </span>
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontSize: 11,
              color: "var(--v1-fg)",
              letterSpacing: "0.04em",
            }}
          >
            {point.lat.toFixed(2)}, {point.lng.toFixed(2)}
          </span>
        </div>
      </button>

      {/* Drop line + reticle, centered under the callout box */}
      <PointHUD
        status={point.kind === "pop" ? "inactive" : "active"}
        pulse={point.kind !== "pop"}
      />
    </div>
  );
}

function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const base = {
    position: "absolute" as const,
    width: 22,
    height: 22,
    borderStyle: "solid" as const,
    borderColor: "var(--v1-orange)",
  };
  const variants = {
    tl: { top: -3, left: -3, borderWidth: "2.5px 0 0 2.5px" },
    tr: { top: -3, right: -3, borderWidth: "2.5px 2.5px 0 0" },
    bl: { bottom: -3, left: -3, borderWidth: "0 0 2.5px 2.5px" },
    br: { bottom: -3, right: -3, borderWidth: "0 2.5px 2.5px 0" },
  };
  return <span aria-hidden style={{ ...base, ...variants[position] }} />;
}
