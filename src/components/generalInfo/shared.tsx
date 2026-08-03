"use client";

import type { CSSProperties, ReactNode } from "react";
import { INFO_SLIDE_MS, type InfoScreen } from "@/data/generalInfo";

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
  /**
   * Every screen in the active tab, already resolved to the current language.
   * A layout that draws its own switcher rather than the dot rail — Then And
   * Now's Then/Now pill — reads its sibling's label from here.
   */
  siblings: InfoScreen[];
  /**
   * Raised while a screen is holding the user's attention without any touches
   * to show for it, so the idle attractor doesn't submerge the kiosk mid-view.
   * Only the Videos tab has anything that qualifies; every other layout ignores
   * it. A screen that raises this MUST lower it on unmount — leaving it raised
   * parks the attractor for good and the kiosk never returns to attract.
   */
  onHoldIdle: (holding: boolean) => void;
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

export const STRIP_HEIGHT = 34;

/**
 * How far the broken outline sits outside the strip it wraps. The export puts
 * it 22–29 of its own units clear on all four sides — near enough uniform that
 * one number works, even though this panel scales the strip's height and width
 * by different factors, so there's no single faithful conversion.
 *
 * The column brackets start on this outline, not on the strip: the export runs
 * them from x=206.059 against an outline edge at x=206.058.
 */
export const STRIP_OUTLINE_OFFSET = 5;

/**
 * Runs of the outline's top and bottom edges, as [start, end, thickness]
 * fractions of its width. The gaps are what make it read as a tech frame
 * rather than a box.
 *
 * Taken from temp/funfact/pokok-internal-skeleton.svg, where both strips
 * resolve to exactly these fractions — so it's one component reused, and the
 * breaks are proportional rather than fixed. That matters here because this
 * layout uses the strip at two different widths where the export uses one.
 */
const OUTLINE_TOP: [number, number, number][] = [
  [0, 0.0785, 1],
  // The export draws this run 1.5x heavier than the rest.
  [0.0939, 0.3615, 2],
  [0.4038, 1, 1],
];
const OUTLINE_BOTTOM: [number, number, number][] = [
  [0, 0.596, 1],
  [0.624, 0.864, 1],
  [0.9214, 1, 1],
];

function StripOutline() {
  const line = "1px solid #FFFFFF";
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        inset: -STRIP_OUTLINE_OFFSET,
        pointerEvents: "none",
      }}
    >
      <span style={{ position: "absolute", left: 0, top: 0, bottom: 0, borderLeft: line }} />
      <span style={{ position: "absolute", right: 0, top: 0, bottom: 0, borderRight: line }} />
      {OUTLINE_TOP.map(([from, to, weight], i) => (
        <span
          key={`t${i}`}
          style={{
            position: "absolute",
            top: 0,
            left: `${from * 100}%`,
            width: `${(to - from) * 100}%`,
            borderTop: `${weight}px solid #FFFFFF`,
          }}
        />
      ))}
      {OUTLINE_BOTTOM.map(([from, to, weight], i) => (
        <span
          key={`b${i}`}
          style={{
            position: "absolute",
            bottom: 0,
            left: `${from * 100}%`,
            width: `${(to - from) * 100}%`,
            borderBottom: `${weight}px solid #FFFFFF`,
          }}
        />
      ))}
    </span>
  );
}

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
        height: STRIP_HEIGHT,
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
      <StripOutline />
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

/* ── Column bracket ── */

/**
 * The connector that leaves a section strip, runs down the gutter between the
 * columns and tucks back into the copy card at the bottom. It is three sides
 * of a rectangle, so one bordered box draws the whole thing — no SVG, and the
 * strokes stay a true 1px.
 *
 * `side` names the column it belongs to, not the direction it opens: the left
 * column's bracket reaches right into the gutter (⊐), the right column's
 * reaches left (⊏).
 *
 * Geometry from temp/funfact/howitsmade.svg, whose gutter is 49.7 units wide:
 * the left bracket steps 12.4 into it, the right one 21.2 in from the far
 * side, so the two verticals never meet. `width` is that step scaled onto this
 * panel's gutter; `bottom` is how far above the column's floor the bracket
 * closes, which the export puts at different depths on each side.
 */
export function ColumnBracket({
  side,
  width,
  bottom,
}: {
  side: "left" | "right";
  width: number;
  bottom: number;
}) {
  const line = "1px solid #FFFFFF";
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        // Leaves the strip at its mid-height, as the export draws it.
        top: STRIP_HEIGHT / 2,
        bottom,
        width,
        borderTop: line,
        borderBottom: line,
        // Offset so it starts on the strip's outline, not the column edge.
        ...(side === "left"
          ? {
              left: "100%",
              marginLeft: STRIP_OUTLINE_OFFSET,
              borderRight: line,
            }
          : {
              right: "100%",
              marginRight: STRIP_OUTLINE_OFFSET,
              borderLeft: line,
            }),
        pointerEvents: "none",
      }}
    />
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
