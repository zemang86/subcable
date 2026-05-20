"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { LandingPoint } from "@/lib/types";
import {
  HUD_BOTTOM_PAD,
  HUD_CENTER_Y,
  MARKER_TOP,
  PointHUD,
} from "./PointHUD";

type LandingPointCalloutProps = {
  point: LandingPoint;
  /** Screen-space position of the landing point on the globe canvas. */
  screenPos: { x: number; y: number };
  /** When true, the callout fades and stops receiving pointer events. */
  hidden?: boolean;
  /** When true, dim the callout — used to background siblings while one is expanded. */
  dimmed?: boolean;
  /** When true, render the big expanded card with thumbnail + body copy. */
  expanded?: boolean;
  /** Toggle handler — fired on tap of the small or expanded card. */
  onToggleExpand?: () => void;
};

const CALLOUT_WIDTH = 210;
const CALLOUT_BOX_HEIGHT = 58;
const GAP_BOX_TO_HUD = 6;
const OFFSET_FROM_POINT = CALLOUT_BOX_HEIGHT + GAP_BOX_TO_HUD + HUD_CENTER_Y;

// Expanded card native geometry — lifted from temp/expand-location.css.
// 439w main panel; height is content-driven so longer descriptions don't
// clip. A single 86h vertical line extends below the panel to the dot.
const EXP_W = 439;
const EXP_STEM_H = 86;
const EXP_STEM_THICKNESS = 2.28;

export function LandingPointCallout({
  point,
  screenPos,
  hidden = false,
  dimmed = false,
  expanded = false,
  onToggleExpand,
}: LandingPointCalloutProps) {
  if (expanded) {
    return (
      <ExpandedCard
        point={point}
        screenPos={screenPos}
        onClose={onToggleExpand}
      />
    );
  }

  const interactive = !hidden && !dimmed && Boolean(onToggleExpand);

  return (
    <div
      style={{
        position: "absolute",
        left: screenPos.x - CALLOUT_WIDTH / 2,
        top: screenPos.y - OFFSET_FROM_POINT,
        width: CALLOUT_WIDTH,
        pointerEvents: interactive ? "auto" : "none",
        opacity: hidden ? 0 : dimmed ? 0.28 : 1,
        filter: dimmed ? "grayscale(0.6)" : undefined,
        transition: "opacity 200ms ease, filter 200ms ease",
        zIndex: 15,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <button
        type="button"
        onClick={onToggleExpand}
        aria-label={`Open details for ${point.name}`}
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
          border: "none",
          cursor: interactive ? "pointer" : "default",
          font: "inherit",
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
      </button>

      <PointHUD
        status={point.kind === "pop" ? "inactive" : "active"}
        pulse={point.kind !== "pop"}
      />
    </div>
  );
}

const SHRINK_MS = 200;

function ExpandedCard({
  point,
  screenPos,
  onClose,
}: {
  point: LandingPoint;
  screenPos: { x: number; y: number };
  onClose?: () => void;
}) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing || !onClose) return;
    setClosing(true);
    window.setTimeout(onClose, SHRINK_MS);
  };

  // Anchor the wrapper so its bottom (= bottom of stem) sits at the globe
  // point; translateY(-100%) makes this content-height agnostic.
  return (
    <div
      style={{
        position: "absolute",
        left: screenPos.x - EXP_W / 2,
        top: screenPos.y,
        transform: "translateY(-100%)",
        width: EXP_W,
        zIndex: 20,
        pointerEvents: "auto",
      }}
    >
      {/* Main panel — translucent orange fill + 4 L-corner brackets;
          height grows with content. */}
      <button
        type="button"
        onClick={handleClose}
        aria-label={`Close details for ${point.name}`}
        className={closing ? "v1-callout-shrink" : "v1-callout-expand"}
        style={{
          position: "relative",
          width: "100%",
          background: "rgba(240, 90, 34, 0.44)",
          border: "none",
          padding: "20px 20px 22px",
          cursor: "pointer",
          color: "#FFFFFF",
          textAlign: "left",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          font: "inherit",
        }}
      >
        <CornerBracket position="tl" size={32} thickness={3} />
        <CornerBracket position="tr" size={32} thickness={3} />
        <CornerBracket position="bl" size={32} thickness={3} />
        <CornerBracket position="br" size={32} thickness={3} />

        {/* Title — shrinks to stay one line when the city name is long */}
        <FitTitle text={point.city} maxFontSize={74} minFontSize={28} />

        {/* Subtitle row: country (left) + coords (right) */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            gap: 12,
            fontFamily: "var(--v1-heading)",
            fontWeight: 400,
            fontSize: 23,
            lineHeight: "29px",
            color: "#FFFFFF",
          }}
        >
          <span>{point.country}</span>
          <span>
            {point.lat.toFixed(2)}, {point.lng.toFixed(2)}
          </span>
        </div>

        {/* Thumbnail */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`https://picsum.photos/seed/${point.id}/398/116`}
          alt={point.name}
          style={{
            width: "100%",
            height: 116,
            objectFit: "cover",
            display: "block",
            background: "#1A1A1A",
          }}
        />

        {/* Built: DD/MM/YY */}
        <div
          style={{
            display: "flex",
            gap: 8,
            fontFamily: "var(--v1-mono)",
            fontSize: 18,
            lineHeight: "23px",
          }}
        >
          <span style={{ color: "#FFFFFF" }}>Built:</span>
          <span style={{ color: "#F05A22" }}>DD/MM/YY</span>
        </div>

        {/* Body text — wraps and grows the panel */}
        <div
          style={{
            fontFamily: "var(--v1-mono)",
            fontSize: 18,
            lineHeight: "23px",
            color: "#FFFFFF",
          }}
        >
          Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do
          eiusmod tempor incididunt ut labore et dolore magna aliqua.
        </div>
      </button>

      {/* Stem — single vertical line centered under the panel,
          terminating in the same reticle the small callout uses. */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          pointerEvents: "none",
        }}
      >
        <div
          aria-hidden
          style={{
            width: EXP_STEM_THICKNESS,
            height: EXP_STEM_H,
            background: "#F05A22",
          }}
        />
        {/* Negative margins trim the empty top/bottom pads inside the
            PointHUD SVG so (a) the stem connects flush to the marker
            visual and (b) wrapper-bottom = reticle center (anchored to
            screenPos.y by translateY(-100%)). */}
        <div style={{ marginTop: -MARKER_TOP, marginBottom: -HUD_BOTTOM_PAD }}>
          <PointHUD
            status={point.kind === "pop" ? "inactive" : "active"}
            pulse={point.kind !== "pop"}
            hideLine
          />
        </div>
      </div>
    </div>
  );
}

function FitTitle({
  text,
  maxFontSize,
  minFontSize,
}: {
  text: string;
  maxFontSize: number;
  minFontSize: number;
}) {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLSpanElement>(null);
  const [size, setSize] = useState(maxFontSize);

  useLayoutEffect(() => {
    const wrapper = wrapperRef.current;
    const measure = measureRef.current;
    if (!wrapper || !measure) return;
    const containerW = wrapper.clientWidth;
    if (containerW <= 0) return;
    const textW = measure.scrollWidth;
    if (textW <= 0) return;
    const fit = Math.min(maxFontSize, (containerW / textW) * maxFontSize);
    setSize(Math.max(minFontSize, Math.floor(fit)));
  }, [text, maxFontSize, minFontSize]);

  return (
    <div
      ref={wrapperRef}
      style={{
        width: "100%",
        fontFamily: "var(--v1-heading)",
        fontWeight: 700,
        lineHeight: 1,
        color: "#FFFFFF",
        textTransform: "uppercase",
        letterSpacing: "0.01em",
        whiteSpace: "nowrap",
        overflow: "hidden",
      }}
    >
      {/* hidden measurer at max size — sets the natural text width */}
      <span
        ref={measureRef}
        aria-hidden
        style={{
          position: "absolute",
          visibility: "hidden",
          whiteSpace: "nowrap",
          fontSize: maxFontSize,
          fontWeight: 700,
          fontFamily: "var(--v1-heading)",
          letterSpacing: "0.01em",
          textTransform: "uppercase",
          pointerEvents: "none",
        }}
      >
        {text}
      </span>
      <span style={{ fontSize: size }}>{text}</span>
    </div>
  );
}

function CornerBracket({
  position,
  size = 14,
  thickness = 1.8,
}: {
  position: "tl" | "tr" | "bl" | "br";
  size?: number;
  thickness?: number;
}) {
  const t = `${thickness}px`;
  const off = -Math.round(thickness / 2);
  const base = {
    position: "absolute" as const,
    width: size,
    height: size,
    borderStyle: "solid" as const,
    borderColor: "var(--v1-orange)",
    pointerEvents: "none" as const,
  };
  const variants = {
    tl: { top: off, left: off, borderWidth: `${t} 0 0 ${t}` },
    tr: { top: off, right: off, borderWidth: `${t} ${t} 0 0` },
    bl: { bottom: off, left: off, borderWidth: `0 0 ${t} ${t}` },
    br: { bottom: off, right: off, borderWidth: `0 ${t} ${t} 0` },
  };
  return <span aria-hidden style={{ ...base, ...variants[position] }} />;
}
