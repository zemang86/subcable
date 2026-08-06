"use client";

import type { EraScreen as EraData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CARD_TITLE,
  CopyCard,
  PANEL_PAD,
  Photo,
  TOUCH,
  type ScreenProps,
} from "./shared";

/**
 * Widths from thennow-1.svg at the panel's x2.20: the photos are 334 wide with
 * 17 between them, the copy column clears them by 28, and the Then/Now pill
 * closes the screen 22 above the frame's floor.
 */
const IMAGE_WIDTH = 334;
const COLUMN_GAP = 28;
const PHOTO_GAP = 17;
const STACK_GAP = 12;

/**
 * Then And Now — two photos and the era's copy, a six-tile spec grid, and the
 * Then/Now pill that switches eras. The pill is this tab's only control; it
 * draws no step arrows.
 */
export default function EraScreen({
  screen,
  index,
  onSelect,
  siblings,
}: { screen: EraData } & ScreenProps) {
  // The pill's two segments are this tab's own screens, so the labels come
  // from the siblings the panel handed down — already in the active language.
  const eraLabels = siblings
    .map((entry) => (entry.kind === "era" ? entry.toggleLabel : ""))
    .filter(Boolean);

  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: COLUMN_GAP,
        padding: `15px ${PANEL_PAD}px 14px`,
      }}
    >
      <div
        style={{
          flex: "none",
          width: IMAGE_WIDTH,
          display: "flex",
          flexDirection: "column",
          gap: PHOTO_GAP,
        }}
      >
        {screen.images.map((image) => (
          <Photo
            key={image.src}
            src={image.src}
            alt={image.alt}
            style={{ width: IMAGE_WIDTH, flex: 1, minHeight: 0 }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: STACK_GAP,
        }}
      >
        <CopyCard>
          <h2 style={CARD_TITLE}>{screen.title}</h2>
          {screen.body.map((paragraph, i) => (
            <p key={i} style={{ ...CARD_BODY, margin: "12px 0 0" }}>
              {paragraph}
            </p>
          ))}
        </CopyCard>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {screen.specs.map((spec) => (
            <SpecTile key={spec.label} label={spec.label} value={spec.value} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <EraToggle
            labels={eraLabels}
            activeIndex={index}
            onSelect={onSelect}
          />
        </div>
      </div>
    </div>
  );
}

/* ── Spec tile ── */
// Straight off the export's badge (thenandnow-card.svg): a hairline frame with
// a lighter plate sitting just inside it, both cut at the top-left corner only
// — not the top-left/bottom-right pair the tile used to carry.
//
// Both outlines are stroked *along* that diagonal, which CSS can't do: a border
// gets clipped away on a clip-path's cut edge. So the frame is the export's own
// two paths, inline. preserveAspectRatio="none" stretches them to the grid
// cell — the cell's ~3.7:1 is the badge's own ratio, so nothing skews at the
// nominal size, and away from it the cut simply stays proportional to the box.
// non-scaling-stroke keeps both lines a true hairline at any cell size.

const BADGE_VIEWBOX = "0 0 1413 381";
const BADGE_FRAME =
  "M1412.05 0.425781V379.782H0.426547V59.9404L90.8025 0.425781H1412.05Z";
// The export insets the plate unevenly — more on the right and bottom — so the
// frame reads as an offset outline rather than a concentric border. Kept as
// drawn.
const BADGE_PLATE =
  "M1384.66 15.3257V357.407H19.0594V68.9946L105.597 15.3257H1384.66Z";

// Type is measured off the badge: both lines are IBM Plex Mono Bold, the label
// at half the value's size in white at 50%, and the text origin sits 6.4% of
// the card's width in from its left edge — 21px on the 330px cell.
const BADGE_INSET = 21;
/** Value size at its widest — the badge's own, and the cap for shorter values. */
const BADGE_VALUE_PX = 22;
/**
 * Every value is set on one line, shrinking only as far as it has to.
 *
 * IBM Plex Mono advances exactly 0.6em per glyph at every weight (measured, all
 * five faces), so a string's width is arithmetic, not something to measure: n
 * characters need `0.6 · n · fontSize`. Turning that around gives the largest
 * size that still fits, and `min()` keeps the badge's 22px wherever there's
 * room. The design mocks these cards in English; the BM values run to 26
 * characters ("Internet, Panggilan, Video") and would otherwise wrap.
 *
 * The width comes from `cqi` rather than a hardcoded cell width so it tracks
 * the panel, which is fluid below 1130px. Two spare pixels absorb rounding —
 * with nowrap an under-estimate would spill into the neighbouring tile.
 */
function valueFontSize(value: string) {
  const room = BADGE_INSET * 2 + 2;
  const advance = (0.6 * Math.max(1, value.length)).toFixed(2);
  return `min(${BADGE_VALUE_PX}px, calc((100cqi - ${room}px) / ${advance}))`;
}

function SpecTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        // The badge centres its text block in the card to within 3% of height.
        justifyContent: "center",
        padding: `0 ${BADGE_INSET}px`,
        minWidth: 0,
        // Gives the value's cqi something to resolve against. Safe on a grid
        // item whose track is 1fr — the width comes from the track, never from
        // the text, so nothing circles back on itself.
        containerType: "inline-size",
      }}
    >
      <svg
        aria-hidden
        viewBox={BADGE_VIEWBOX}
        preserveAspectRatio="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        <path
          d={BADGE_FRAME}
          fill="none"
          stroke="#FFFFFF"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
        <path
          d={BADGE_PLATE}
          fill="#D9D9D9"
          fillOpacity={0.55}
          stroke="#FFFFFF"
          strokeWidth={1}
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Both lines are positioned so they paint over the absolute frame —
          in-flow content would sit under it whatever the DOM order. */}
      <span
        style={{
          position: "relative",
          display: "block",
          fontFamily: "var(--v1-mono)",
          fontWeight: 700,
          fontSize: 11,
          lineHeight: "15px",
          color: "rgba(255, 255, 255, 0.5)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          position: "relative",
          display: "block",
          marginTop: 3,
          fontFamily: "var(--v1-mono)",
          fontWeight: 700,
          fontSize: valueFontSize(value),
          // Ratio, not a fixed height, so a shrunk value keeps the badge's
          // leading instead of floating in a 28px box.
          lineHeight: 1.27,
          whiteSpace: "nowrap",
          color: "var(--v1-fg)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/* ── Then | Now pill ── */
// Values straight from the export (thennow-2.css, "Then and Now Button Toggle
// Button"): the track carries two translucent gradients — blue washing in from
// one corner, orange from the other — and the thumb is a white-to-blue vertical
// gradient. Geometry keeps the export's 4.1:1 track ratio but at touch size;
// the export draws the whole pill ~19px tall.

const TOGGLE_TRACK_BG =
  "linear-gradient(302.51deg, #034DA1 -89.34%, rgba(3, 77, 161, 0) 54.67%), linear-gradient(122.48deg, rgba(240, 90, 34, 0.6) -38.43%, rgba(240, 90, 34, 0) 58.47%)";
const TOGGLE_THUMB_BG =
  "linear-gradient(360deg, #034DA1 -78.91%, #FFFFFF 100.09%)";

const TRACK_W = 180;
const TRACK_H = TOUCH - 4;
const THUMB_INSET = 3;

function EraToggle({
  labels,
  activeIndex,
  onSelect,
}: {
  labels: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  // Inset the thumb with top/bottom/left/right rather than height/width: the
  // track is border-box, so an absolute child sized from TRACK_H overshoots by
  // the 2px of border and lands 3px below the top edge but flush with the
  // bottom. Edge offsets stay symmetric whatever the border does. The thumb
  // overlaps the midpoint by THUMB_INSET, matching the export (its thumb is
  // half the track plus the inset).
  const thumbSides =
    activeIndex === 0
      ? { left: THUMB_INSET, right: `calc(50% - ${THUMB_INSET}px)` }
      : { left: `calc(50% - ${THUMB_INSET}px)`, right: THUMB_INSET };

  return (
    <div
      role="tablist"
      style={{
        position: "relative",
        width: TRACK_W,
        height: TRACK_H,
        boxSizing: "border-box",
        borderRadius: 999,
        border: "1px solid #FFFFFF",
        background: TOGGLE_TRACK_BG,
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: THUMB_INSET,
          bottom: THUMB_INSET,
          ...thumbSides,
          boxSizing: "border-box",
          borderRadius: 999,
          border: "1px solid #FFFFFF",
          background: TOGGLE_THUMB_BG,
          transition:
            "left 260ms cubic-bezier(0.4, 0, 0.2, 1), right 260ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
      {labels.map((label, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            style={{
              // Halves meet exactly at the midpoint the thumb straddles, so a
              // label sits centred in the thumb on either side.
              position: "absolute",
              top: 0,
              bottom: 0,
              left: i === 0 ? THUMB_INSET : "50%",
              right: i === 0 ? "50%" : THUMB_INSET,
              padding: 0,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              fontFamily: "var(--v1-heading)",
              fontWeight: active ? 600 : 400,
              fontSize: 17,
              letterSpacing: "0.02em",
              color: active ? "var(--v1-orange)" : "var(--v1-fg)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
