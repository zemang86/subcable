"use client";

import { useLayoutEffect, useRef, useState } from "react";

import type { LandingPoint } from "@/lib/types";
import { HUD_CENTER_Y, PointHUD, SVG_W } from "./PointHUD";

type LandingPointCalloutProps = {
  point: LandingPoint;
  /** Screen-space position of the landing point on the globe canvas. */
  screenPos: { x: number; y: number };
  /** Viewport size — used by the expanded card to place its fixed panel. */
  viewport?: { width: number; height: number };
  /** Box-centre offset from the point (px), set by the declutter pass. */
  offset?: { dx: number; dy: number };
  /** When true, the callout fades and stops receiving pointer events. */
  hidden?: boolean;
  /** When true, dim the callout — used to background siblings while one is expanded. */
  dimmed?: boolean;
  /** When true, render the big expanded card with thumbnail + body copy. */
  expanded?: boolean;
  /** When true, render ONLY the reticle marker (clickable) — no leader line,
      no text box. Used when a cable is selected to mark its landing points. */
  markerOnly?: boolean;
  /** Toggle handler — fired on tap of the marker / small / expanded card. */
  onToggleExpand?: () => void;
};

// Declutter geometry — shared with the layout pass in GlobeScene so the
// collision math and the rendered boxes agree.
export const CALLOUT_WIDTH = 210;
export const CALLOUT_BOX_HEIGHT = 58; // nominal; the box auto-heights at render
// At rest (no neighbours) the box centre sits this far ABOVE the point.
export const CALLOUT_REST_RISE = 73;
// Line stops this far short of the point so it meets the reticle, not its centre.
const MARKER_GAP = 13;
const CONNECTOR_THICKNESS = 1.4;

// Expanded card native geometry — lifted from temp/expand-location.css.
// 439w main panel; height is content-driven so longer descriptions don't clip.
const EXP_W = 439;
const EXP_STEM_THICKNESS = 2.28;
// The panel holds a fixed spot right of the globe centre (the globe is offset
// left, so the rotated point lands on the left, clear of the panel). A variable
// stem links the panel's left edge to the live marker.
const PANEL_CENTER_FRAC = 0.56;

export function LandingPointCallout({
  point,
  screenPos,
  viewport,
  offset = { dx: 0, dy: -CALLOUT_REST_RISE },
  hidden = false,
  dimmed = false,
  expanded = false,
  markerOnly = false,
  onToggleExpand,
}: LandingPointCalloutProps) {
  if (expanded) {
    return (
      <ExpandedCard
        point={point}
        screenPos={screenPos}
        viewport={viewport}
        onClose={onToggleExpand}
      />
    );
  }

  const interactive = !hidden && !dimmed && Boolean(onToggleExpand);

  // Marker-only: just the reticle pinned on the point, wrapped in a tap target
  // (padded out to a touch-friendly hit area). No leader line, no text box.
  if (markerOnly) {
    const HIT = 24; // px padding around the 40px reticle → ~64px touch target
    return (
      <div
        style={{
          position: "absolute",
          left: screenPos.x,
          top: screenPos.y,
          width: 0,
          height: 0,
          opacity: hidden ? 0 : dimmed ? 0.28 : 1,
          filter: dimmed ? "grayscale(0.6)" : undefined,
          transition: "opacity 200ms ease, filter 200ms ease",
          zIndex: 15,
          pointerEvents: "none",
        }}
      >
        <button
          type="button"
          onClick={onToggleExpand}
          aria-label={`Open details for ${point.name}`}
          style={{
            position: "absolute",
            left: -SVG_W / 2 - HIT,
            top: -HUD_CENTER_Y - HIT,
            padding: HIT,
            background: "transparent",
            border: "none",
            cursor: interactive ? "pointer" : "default",
            pointerEvents: interactive ? "auto" : "none",
            lineHeight: 0,
          }}
        >
          <PointHUD
            status={point.kind === "pop" ? "inactive" : "active"}
            pulse={point.kind !== "pop"}
            hideLine
          />
        </button>
      </div>
    );
  }

  // Everything is positioned relative to a zero-size anchor pinned at the point
  // (screenPos). The box centre sits at `offset` from the point; the declutter
  // pass nudges that offset in both axes. A diagonal leader line runs from the
  // reticle to whichever box edge faces the point.
  const { dx, dy } = offset;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist; // unit vector point → box
  const uy = dy / dist;
  // Line start: just outside the reticle, heading toward the box.
  const startX = ux * MARKER_GAP;
  const startY = uy * MARKER_GAP;
  // Line end: where the segment from the point exits the box rectangle.
  const sx = Math.abs(ux) < 1e-3 ? Infinity : CALLOUT_WIDTH / 2 / Math.abs(ux);
  const sy = Math.abs(uy) < 1e-3 ? Infinity : CALLOUT_BOX_HEIGHT / 2 / Math.abs(uy);
  const s = Math.min(sx, sy);
  const endX = dx - ux * s;
  const endY = dy - uy * s;
  const lineLen = Math.max(0, Math.hypot(endX - startX, endY - startY));
  const lineAngle = (Math.atan2(endY - startY, endX - startX) * 180) / Math.PI;

  return (
    <div
      style={{
        position: "absolute",
        left: screenPos.x,
        top: screenPos.y,
        width: 0,
        height: 0,
        pointerEvents: "none",
        opacity: hidden ? 0 : dimmed ? 0.28 : 1,
        filter: dimmed ? "grayscale(0.6)" : undefined,
        transition: "opacity 200ms ease, filter 200ms ease",
        zIndex: 15,
      }}
    >
      {/* Leader line — diagonal, from the reticle to the box's near edge */}
      {lineLen > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: startX,
            top: startY - CONNECTOR_THICKNESS / 2,
            width: lineLen,
            height: CONNECTOR_THICKNESS,
            background: "var(--v1-orange)",
            transformOrigin: "left center",
            transform: `rotate(${lineAngle}deg)`,
          }}
        />
      )}

      <button
        type="button"
        onClick={onToggleExpand}
        aria-label={`Open details for ${point.name}`}
        style={{
          position: "absolute",
          left: dx,
          top: dy,
          transform: "translate(-50%, -50%)",
          width: CALLOUT_WIDTH,
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
          pointerEvents: interactive ? "auto" : "none",
          transition: "top 220ms ease",
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

      {/* Reticle marker — pinned with its centre exactly on the point */}
      <div
        style={{
          position: "absolute",
          left: -SVG_W / 2,
          top: -HUD_CENTER_Y,
          pointerEvents: "none",
        }}
      >
        <PointHUD
          status={point.kind === "pop" ? "inactive" : "active"}
          pulse={point.kind !== "pop"}
          hideLine
        />
      </div>
    </div>
  );
}

const SHRINK_MS = 200;

function ExpandedCard({
  point,
  screenPos,
  viewport,
  onClose,
}: {
  point: LandingPoint;
  screenPos: { x: number; y: number };
  viewport?: { width: number; height: number };
  onClose?: () => void;
}) {
  const [closing, setClosing] = useState(false);

  const handleClose = () => {
    if (closing || !onClose) return;
    setClosing(true);
    window.setTimeout(onClose, SHRINK_MS);
  };

  // Fixed panel: holds a spot right of the globe centre and vertically centred.
  const vw = viewport?.width ?? (typeof window !== "undefined" ? window.innerWidth : 1920);
  const vh = viewport?.height ?? (typeof window !== "undefined" ? window.innerHeight : 1080);
  const panelLeft = PANEL_CENTER_FRAC * vw - EXP_W / 2;
  const panelMidY = vh / 2;

  // Variable stem: from the live marker (the rotated globe point) to the panel's
  // left-edge centre. Recomputes every frame as screenPos moves, so the link
  // stretches/rotates with the globe while the panel stays put.
  const sx = screenPos.x;
  const sy = screenPos.y;
  const dx = panelLeft - sx;
  const dy = panelMidY - sy;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const startX = sx + ux * MARKER_GAP; // just outside the reticle
  const startY = sy + uy * MARKER_GAP;
  const lineLen = Math.max(0, dist - MARKER_GAP);
  const lineAngle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return (
    <>
      {/* Variable stem — reticle → panel left edge */}
      {lineLen > 0 && (
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: startX,
            top: startY - EXP_STEM_THICKNESS / 2,
            width: lineLen,
            height: EXP_STEM_THICKNESS,
            background: "#F05A22",
            transformOrigin: "left center",
            transform: `rotate(${lineAngle}deg)`,
            zIndex: 19,
            pointerEvents: "none",
          }}
        />
      )}

      {/* Reticle marker — pinned with its centre on the (rotated) globe point */}
      <div
        style={{
          position: "absolute",
          left: sx - SVG_W / 2,
          top: sy - HUD_CENTER_Y,
          zIndex: 20,
          pointerEvents: "none",
        }}
      >
        <PointHUD
          status={point.kind === "pop" ? "inactive" : "active"}
          pulse={point.kind !== "pop"}
          hideLine
        />
      </div>

      {/* Main panel — fixed, vertically centred, right of the globe centre. */}
      <div
        style={{
          position: "absolute",
          left: panelLeft,
          top: panelMidY,
          transform: "translateY(-50%)",
          width: EXP_W,
          zIndex: 20,
          pointerEvents: "auto",
        }}
      >
      {/* translucent orange fill + 4 L-corner brackets; height grows with copy. */}
      <button
        type="button"
        onClick={handleClose}
        aria-label={`Close details for ${point.name}`}
        className={closing ? "v1-callout-shrink" : "v1-callout-expand"}
        style={{
          transformOrigin: "0% 50%",
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
      </div>
    </>
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
