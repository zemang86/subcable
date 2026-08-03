"use client";

import { INFO_TABS, type EraScreen as EraData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CARD_TITLE,
  CopyCard,
  PANEL_PAD,
  Photo,
  TOUCH,
  type ScreenProps,
} from "./shared";

const IMAGE_WIDTH = 300;

/**
 * Then And Now — two photos and the era's copy, a six-tile spec grid, and the
 * Then/Now pill that switches eras. The pill is this tab's manual control (no
 * step arrows), and the countdown flips it on its own every 10s.
 */
export default function EraScreen({
  screen,
  cycleKey,
  barRepeat,
  index,
  onSelect,
}: { screen: EraData } & ScreenProps) {
  const eraLabels = INFO_TABS.find((tab) => tab.id === "then-and-now")
    ?.screens.map((entry) => (entry.kind === "era" ? entry.toggleLabel : ""))
    .filter(Boolean) ?? [];

  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: 24,
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      <div
        style={{
          flex: "none",
          width: IMAGE_WIDTH,
          display: "flex",
          flexDirection: "column",
          gap: 14,
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
          gap: 14,
        }}
      >
        <CopyCard cycleKey={cycleKey} barRepeat={barRepeat}>
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

/** Spec tile — bevelled top-left and bottom-right, per the export. */
function SpecTile({ label, value }: { label: string; value: string }) {
  const cut = 16;
  return (
    <div
      style={{
        position: "relative",
        padding: "10px 16px 12px",
        background: "rgba(255, 255, 255, 0.18)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        clipPath: `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`,
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: "var(--v1-heading)",
          fontWeight: 500,
          fontSize: 13,
          letterSpacing: "0.04em",
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 2,
          fontFamily: "var(--v1-mono)",
          fontWeight: 500,
          fontSize: 22,
          lineHeight: "30px",
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
