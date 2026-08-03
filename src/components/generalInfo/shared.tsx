"use client";

import type { CSSProperties, ReactNode } from "react";
import { INFO_SLIDE_MS } from "@/data/generalInfo";

/**
 * Pieces every General Information tab layout shares: the bracketed copy card,
 * the countdown bar, the small section strips and the panel's touch minimums.
 *
 * Sizing note (also in GeneralInfoDialog): the Figma exports are drawn at ~0.66
 * of the kiosk canvas, so their measurements are scaled onto the panel's
 * existing 1040px footprint rather than copied literally, and body copy is held
 * at a readable size instead of the ~8px a straight scale would give.
 */

export const PANEL_PAD = 22;
export const CARD_FILL = "rgba(255, 255, 255, 0.15)";
/** Minimum touch target on the kiosk. */
export const TOUCH = 48;

/** Props the panel hands every screen layout. */
export type ScreenProps = {
  /** Changes on every advance or manual move — restarts the countdown bar. */
  cycleKey: string;
  /**
   * True on single-screen tabs: the bar keeps cycling because there is no next
   * screen for the hold timer to move to. Multi-screen tabs run it once per
   * hold and restart it from the new screen's cycleKey.
   */
  barRepeat: boolean;
  index: number;
  count: number;
  onStep: (delta: number) => void;
  onSelect: (index: number) => void;
};

/* ── Bracketed card ── */
// Four L-corners around a translucent copy block, per the exports.

const BRACKET = 22;

export function CardBrackets() {
  const line = "1px solid #FFFFFF";
  const corners: CSSProperties[] = [
    { top: 0, left: 0, borderTop: line, borderLeft: line },
    { top: 0, right: 0, borderTop: line, borderRight: line },
    { bottom: 0, left: 0, borderBottom: line, borderLeft: line },
    { bottom: 0, right: 0, borderBottom: line, borderRight: line },
  ];
  return (
    <>
      {corners.map((corner, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            width: BRACKET,
            height: BRACKET,
            pointerEvents: "none",
            ...corner,
          }}
        />
      ))}
    </>
  );
}

/**
 * Copy card + its countdown bar, bracketed. Always sizes to its text — inside a
 * fixed-height screen it's the photos that give up room, never the copy.
 */
export function CopyCard({
  children,
  cycleKey,
  barRepeat,
}: {
  children: ReactNode;
  cycleKey: string;
  barRepeat: boolean;
}) {
  return (
    <div style={{ position: "relative", flex: "none", padding: "10px 12px" }}>
      <CardBrackets />
      <div style={{ background: CARD_FILL, padding: "16px 18px" }}>
        {children}
      </div>
      <CountdownBar cycleKey={cycleKey} repeat={barRepeat} />
    </div>
  );
}

/**
 * Orange fill running along a red track over INFO_SLIDE_MS — the same constant
 * that drives the hold timer, so bar and advance can't drift apart. The fill
 * animates its width (not a scale) so the transparent right border stays a
 * constant gap between the fill's leading edge and the red remainder, the way
 * the export draws it.
 */
const BAR_HEIGHT = 6;
const BAR_GAP = 10;

export function CountdownBar({
  cycleKey,
  repeat,
}: {
  cycleKey: string;
  repeat: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: BAR_HEIGHT,
        margin: "10px 4px 0",
        background: "#ED1B2E",
        overflow: "hidden",
      }}
    >
      <span
        key={cycleKey}
        className="v1-gi-fill"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          bottom: 0,
          background: "var(--v1-orange)",
          backgroundClip: "padding-box",
          borderRight: `${BAR_GAP}px solid transparent`,
          animationDuration: `${INFO_SLIDE_MS}ms`,
          animationIterationCount: repeat ? "infinite" : 1,
        }}
      />
    </div>
  );
}

/* ── Section strip ── */
// The small header strip over a column (e.g. "GUTTA PERCHA", "Tree
// Information") — same translucent-white gradient as the panel title strip at
// two thirds the height.

export function SectionStrip({
  label,
  mono = false,
}: {
  label: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 34,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        boxSizing: "border-box",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(255,255,255,0) 41.87%, #FFFFFF 413.39%), linear-gradient(180deg, rgba(255,255,255,0) 45.95%, #FFFFFF 278.39%)",
          border: "0.37px solid #FFFFFF",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "relative",
          fontFamily: mono ? "var(--v1-mono)" : "var(--v1-display)",
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: mono ? "0.14em" : "0.04em",
          textTransform: mono ? "uppercase" : "none",
          color: "#FFFFFF",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Typography ── */

export const CARD_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: "var(--v1-mono)",
  fontWeight: 600,
  fontSize: 28,
  lineHeight: "36px",
  color: "var(--v1-fg)",
};

export const CARD_BODY: CSSProperties = {
  fontFamily: "var(--v1-mono)",
  fontWeight: 300,
  fontSize: 15,
  lineHeight: "23px",
  color: "var(--v1-fg)",
};

/* ── Framed photo ── */

export function Photo({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
    <img
      src={src}
      alt={alt}
      style={{
        display: "block",
        objectFit: "cover",
        border: "1px solid rgba(255, 255, 255, 0.85)",
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

/* ── Step arrow ── */
// Orange translucent square with a white chevron, bottom-right of a screen.

export function StepButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "next" ? "Next" : "Previous"}
      className="v1-pressable"
      style={{
        width: TOUCH,
        height: TOUCH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor: "pointer",
        background: "rgba(240, 90, 34, 0.54)",
        border: "1px solid var(--v1-orange)",
      }}
    >
      <svg width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden>
        <path
          d={direction === "next" ? "M3 2 L13 13 L3 24" : "M13 2 L3 13 L13 24"}
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
