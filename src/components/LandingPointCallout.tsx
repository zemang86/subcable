"use client";

import type { LandingPoint } from "@/lib/types";
import { PointHUD } from "./PointHUD";

type LandingPointCalloutProps = {
  point: LandingPoint;
  /** Screen-space position of the landing point on the globe canvas. */
  screenPos: { x: number; y: number };
  /** When true, the callout fades and stops receiving pointer events. */
  hidden?: boolean;
};

const CALLOUT_WIDTH = 210;
const CALLOUT_BOX_HEIGHT = 58; // padding 10+10 + title 20 + row 10 + gap 4
const GAP_BOX_TO_HUD = 6;
const HUD_CENTER_Y = 72; // y of dot inside the 48×90 PointHUD SVG
const OFFSET_FROM_POINT = CALLOUT_BOX_HEIGHT + GAP_BOX_TO_HUD + HUD_CENTER_Y;

export function LandingPointCallout({
  point,
  screenPos,
  hidden = false,
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
      <div
        role="group"
        aria-label={point.name}
        style={{
          position: "relative",
          width: "100%",
          padding: "10px 14px",
          background: "rgba(188, 53, 20, 0.55)",
          color: "var(--v1-fg)",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 4,
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
            fontSize: 20,
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
            gap: 8,
          }}
        >
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontSize: 10,
              color: "var(--v1-fg)",
              letterSpacing: "0.04em",
            }}
          >
            {point.region}
          </span>
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontSize: 10,
              color: "var(--v1-fg)",
              letterSpacing: "0.04em",
            }}
          >
            {point.lat.toFixed(2)}, {point.lng.toFixed(2)}
          </span>
        </div>
      </div>

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
    width: 14,
    height: 14,
    borderStyle: "solid" as const,
    borderColor: "var(--v1-orange)",
  };
  const variants = {
    tl: { top: -2, left: -2, borderWidth: "1.8px 0 0 1.8px" },
    tr: { top: -2, right: -2, borderWidth: "1.8px 1.8px 0 0" },
    bl: { bottom: -2, left: -2, borderWidth: "0 0 1.8px 1.8px" },
    br: { bottom: -2, right: -2, borderWidth: "0 1.8px 1.8px 0" },
  };
  return <span aria-hidden style={{ ...base, ...variants[position] }} />;
}
