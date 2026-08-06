"use client";

import type { CSSProperties, ReactNode } from "react";
import type { InfoScreen } from "@/data/generalInfo";

/**
 * Pieces every General Information tab layout shares: the bracketed copy card,
 * the small section strips and the panel's touch minimums.
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
 * The copy card's frame, from temp/funfact/box.svg: the four brackets, a
 * hairline rail down each side and across the top, and the orange/red rule
 * that closes the bottom. Every rail stops short of the bracket it meets, so
 * each corner reads as a break rather than a join.
 *
 * Positioned 1px borders rather than the export's rects, because the brackets
 * are a fixed size while the rails have to stretch: these cards run from a
 * third of the panel to nearly all of it, and one exported box can only be one
 * of those widths. The break is 5px, the export's ~0.22 of a bracket arm.
 *
 * The rule sits on the same line as the two lower bracket arms and starts where
 * the side rails do, so the bottom edge breaks at its corners like the others.
 * It is static: this used to be the countdown, and the export catches it 32%
 * along, but the panel no longer counts down. Segment split and colours are the
 * export's.
 */
const FRAME_BREAK = 5;
const RAIL_INSET = BRACKET + FRAME_BREAK;
const RULE_HEIGHT = 2;
/** Of the rule's own run: orange, then a break, then red for the remainder. */
const RULE_ORANGE_PCT = 31.9;
const RULE_BREAK_PCT = 0.7;

export function CardFrame() {
  const line = "1px solid #FFFFFF";
  const rails: CSSProperties[] = [
    { left: 0, top: RAIL_INSET, bottom: RAIL_INSET, borderLeft: line },
    { right: 0, top: RAIL_INSET, bottom: RAIL_INSET, borderRight: line },
    { top: 0, left: RAIL_INSET, right: RAIL_INSET, borderTop: line },
  ];
  return (
    <>
      <CardBrackets />
      {rails.map((rail, i) => (
        <span
          key={i}
          aria-hidden
          style={{ position: "absolute", pointerEvents: "none", ...rail }}
        />
      ))}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: RAIL_INSET,
          right: RAIL_INSET,
          bottom: 0,
          height: RULE_HEIGHT,
          display: "flex",
          pointerEvents: "none",
        }}
      >
        <span
          style={{ width: `${RULE_ORANGE_PCT}%`, background: "var(--v1-orange)" }}
        />
        <span style={{ width: `${RULE_BREAK_PCT}%` }} />
        <span style={{ flex: 1, background: "#ED1B2E" }} />
      </span>
    </>
  );
}

/**
 * Bracketed copy card. Always sizes to its text — inside a fixed-height screen
 * it's the photos that give up room, never the copy.
 *
 * It used to carry a countdown bar under the copy, driving a 10s auto-advance.
 * The client dropped both: these screens are read at the reader's pace, and
 * every tab is now stepped by hand.
 */
export function CopyCard({ children }: { children: ReactNode }) {
  return (
    <div style={{ position: "relative", flex: "none", padding: "10px 12px" }}>
      <CardFrame />
      <div style={{ background: CARD_FILL, padding: "16px 18px" }}>
        {children}
      </div>
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

/**
 * Drawn verbatim from temp/funfact/next-button.svg: a translucent orange body
 * with its leading top corner cut away, a solid orange tab filling that notch,
 * a white chevron, and a small tick at each of the three square corners.
 *
 * pre-button.svg is the same artwork mirrored — checked point for point, the
 * two agree to four decimal places once translated — so this renders one set of
 * paths and flips it. The flip carries everything correctly: the notch and its
 * tab move to the other top corner, the ticks follow, and the chevron turns.
 *
 * The viewBox is cropped to the art (the export leaves it off-centre on an
 * 18-unit canvas) so the body fills the touch target rather than floating at
 * 84% of it. Strokes come out as true hairlines at this size: the body's 0.5px,
 * the ticks' 1px, the chevron's 3.9px.
 */
const STEP_VIEWBOX = "1.7 1.7 15.9 15.9";
const STEP_BODY =
  "M6.80509 2.03052L17.2609 2.03052L17.2609 17.0181L2.13684 17.0181L2.13684 6.69877L6.80509 2.03052Z";
const STEP_TAB =
  "M6.12639 1.83447L1.88983 6.19901L1.88979 1.83451L6.12639 1.83447Z";
const STEP_CHEVRON = "M8.22192 13.8059L12.587 9.44083L8.22192 5.07574";
const STEP_TICKS = [
  "M1.96802 16.0391L1.96802 17.0355L3.04636 17.0355",
  "M17.2559 3.04102L17.2559 2.04458L16.1775 2.04458",
  "M16.2217 17.0186L17.2181 17.0186L17.2181 15.9402",
];

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
        display: "block",
        padding: 0,
        cursor: "pointer",
        background: "none",
        border: "none",
      }}
    >
      <svg
        width={TOUCH}
        height={TOUCH}
        viewBox={STEP_VIEWBOX}
        fill="none"
        aria-hidden
        style={{
          display: "block",
          transform: direction === "prev" ? "scaleX(-1)" : undefined,
        }}
      >
        <path
          d={STEP_BODY}
          fill="var(--v1-orange)"
          fillOpacity={0.54}
          stroke="var(--v1-orange)"
          strokeWidth={0.187029}
        />
        <path d={STEP_TAB} fill="var(--v1-orange)" />
        {STEP_TICKS.map((tick) => (
          <path
            key={tick}
            d={tick}
            stroke="var(--v1-orange)"
            strokeWidth={0.357056}
          />
        ))}
        <path d={STEP_CHEVRON} stroke="#FFFFFF" strokeWidth={1.45503} />
      </svg>
    </button>
  );
}
