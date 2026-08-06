"use client";

import { memo, useLayoutEffect, useRef } from "react";
import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";

interface CableInformationProps {
  cable: CableSystem;
  language?: Language;
  className?: string;
}

const PANEL_WIDTH = 454;
const TITLE_STRIP_HEIGHT = 47;

/**
 * The card is a fixed frame, so every block is placed at the coordinate the
 * export draws it at rather than stacked in flow. temp/cablesystem/card.svg is
 * 455 x 363 against this panel's 454, so its numbers are used literally.
 *
 * 363 is what the body comes back to now that the client has dropped the owner
 * chips. It used to be 409 — the original Figma frame was 362 and an earlier
 * pass added a second owner row (35 + 12) on top of it so cables with four or
 * six owners stopped pushing the description through the floor. With the chips
 * gone that reservation goes with them, and the description takes the space:
 * it is 180 tall here against 104 before.
 */
const PANEL_BODY_HEIGHT = 363;

/**
 * Cable name. The export's cap box is y 18.67-39.71; a flex-centred line box
 * puts the caps 1.15px above its own centre (Rajdhani's ascent and descent
 * aren't symmetric about the cap height), so the box starts at 15.15 rather
 * than 14 to land them where the export draws them.
 */
const NAME_TOP = 15.15;
const NAME_HEIGHT = 30;
const NAME_SIZE = 32.5;

/** Field chips. Rows at the export's y, 27 tall, 17 apart. */
const CHIP_LEFT = 17.8;
const ROW1_TOP = 58.75;
const ROW2_TOP = 107.67;
const CHIP_HEIGHT = 27;
const CHIP_GAP = 17;
const LABEL_WIDTH = 78;
const LABEL_WIDTH_WIDE = 134;

/**
 * Value-cell widths. Row 2 is the export's 57 exactly. Row 1 is not: the export
 * draws LENGTH at 84 and RFS at 115 because it mocks them with "3,000 KM" and
 * "June 2017", and our data is longer than both — ten cables carry a six-figure
 * length and eleven an RFS month of 13-14 characters, all of which would have
 * to condense. Widening the two cells to 100 and 145 lands the row at exactly
 * 418, which is the panel's full content width, so it now closes 18 from the
 * right edge the way it opens 18 from the left.
 */
const VALUE_WIDTH_LENGTH = 100;
const VALUE_WIDTH_RFS = 145;
const VALUE_WIDTH_COUNT = 57;

/** Description frame — the export's rect, panel-relative. */
const DESC_LEFT = 19.1;
const DESC_TOP = 160.6;
const DESC_WIDTH = 411.27;
const DESC_HEIGHT = 180.42;

// Pull out the leading number group + a unit hint from a free-form string.
// "3,000 km" → { value: "3,000", unit: "KM" }
// "~21,700 km (planned)" → { value: "~21,700", unit: "km" }
//
// The tilde and the trailing parenthetical are the four planned cables' way of
// saying the figure isn't final. The tilde is kept — it is the hedge, and it
// costs one character; "(planned)" is dropped, because at the card's type size
// it would condense the whole value to a third of its width to say what the
// red name and the offline indicator already say.
function splitValueUnit(raw: string | undefined, fallbackUnit?: string): {
  value: string;
  unit: string;
} {
  if (!raw) return { value: "—", unit: fallbackUnit ?? "" };
  const m = raw.match(/^(~?)\s*([\d,.]+)\s*([A-Za-z/]+)?/);
  if (!m) return { value: raw, unit: "" };
  return { value: m[1] + m[2], unit: (m[3] ?? fallbackUnit ?? "").trim() };
}

// Memoized: shields the panel from GlobeScene's 30fps marker-tracking
// re-renders — its props (cable, language, className) are stable between
// real selection changes.
export default memo(CableInformation);

function CableInformation({
  cable,
  language = "en",
  className,
}: CableInformationProps) {
  const t = useT(language);
  const inactive = cable.status !== "active";
  const nameColor = inactive ? "#FF3F3F" : "#01FF4E";
  const indicatorAccent = inactive ? "#FF3F3F" : "#8FFF3F";
  const indicatorMiddle = inactive ? "#642E2E" : "#3F642E";

  const length = splitValueUnit(cable.length);

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        // Stacked above the Cable System panel on the right edge.
        bottom: 420,
        right: 28,
        zIndex: 20,
        width: PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <TitleStrip title={t("cableInformation")} />

      {/* PANEL BODY — bevel gradient + SVG frame. The gradient sits on its
          own wiping layer so the traced frame isn't clipped with it. */}
      <div
        style={{
          position: "relative",
          width: PANEL_WIDTH,
          height: PANEL_BODY_HEIGHT,
        }}
      >
        <span
          aria-hidden
          className="v7-mat-wipe"
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(303.52deg, #034DA1 -11.48%, rgba(3, 77, 161, 0) 82.93%), linear-gradient(123.48deg, rgba(240, 90, 34, 0.6) -7.19%, rgba(240, 90, 34, 0) 100%)",
            pointerEvents: "none",
          }}
        />
        <PanelFrame />
        <OnlineIndicator accent={indicatorAccent} middle={indicatorMiddle} />

        <div
          className="v7-mat-body"
          style={{ position: "absolute", inset: 0 }}
        >
          <CableName name={cable.name} color={nameColor} />

          <div
            style={{
              position: "absolute",
              left: CHIP_LEFT,
              top: ROW1_TOP,
              display: "flex",
              gap: CHIP_GAP,
            }}
          >
            <FieldChip
              label={t("length").toUpperCase()}
              labelWidth={LABEL_WIDTH}
              valueWidth={VALUE_WIDTH_LENGTH}
              value={length.value}
              unit={length.unit || "KM"}
            />
            <FieldChip
              label={t("rfs").toUpperCase()}
              labelWidth={LABEL_WIDTH}
              valueWidth={VALUE_WIDTH_RFS}
              value={cable.rfs || "—"}
            />
          </div>

          <div
            style={{ position: "absolute", left: CHIP_LEFT, top: ROW2_TOP }}
          >
            <FieldChip
              label={t("totalLandingPoints").toUpperCase()}
              labelWidth={LABEL_WIDTH_WIDE}
              valueWidth={VALUE_WIDTH_COUNT}
              value={String(cable.landingPointIds.length)}
            />
          </div>

          <DescriptionBlock
            label={t("description")}
            text={cable.description}
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── CABLE NAME ───────────────────────── */

// The card's headline, straight off the export: Rajdhani Bold at 32.5px in the
// live green, sitting on its own row above the field chips.
//
// At that size the name is the one block that can't be trusted to fit — the
// export mocks it with "SEA-ME-WE 4" at 176px, and the longest name we carry
// ("Malaysia Domestic Submarine Cable System") is 595. It scales uniformly to
// the width instead of wrapping, because wrapping would move the chips.
function CableName({ name, color }: { name: string; color: string }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const probeRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const display = useScramble(name);

  // Measured off a hidden copy of the settled name, never off what's on
  // screen: the scramble swaps glyphs every 30ms and Rajdhani is proportional,
  // so mid-animation the visible node is not the width we have to fit.
  useLayoutEffect(() => {
    const box = boxRef.current;
    const probe = probeRef.current;
    const text = textRef.current;
    if (!box || !probe || !text) return;
    const fit = () => {
      const ratio = box.clientWidth / Math.max(1, probe.offsetWidth);
      text.style.transform = ratio < 1 ? `scale(${ratio})` : "none";
    };
    fit();
    // Re-fit once webfonts land — the fallback's metrics aren't Rajdhani's.
    void document.fonts?.ready.then(fit);
  }, [name]);

  const type = {
    fontFamily: "var(--v1-heading)",
    fontWeight: 700,
    fontSize: NAME_SIZE,
    lineHeight: 1,
    whiteSpace: "nowrap" as const,
  };

  return (
    <div
      ref={boxRef}
      style={{
        position: "absolute",
        left: 18,
        top: NAME_TOP,
        // Stops short of the online indicator at x=426.
        width: 400,
        height: NAME_HEIGHT,
        display: "flex",
        alignItems: "center",
        color,
        ...type,
      }}
    >
      <span
        ref={textRef}
        style={{ display: "inline-block", transformOrigin: "left center" }}
      >
        {display}
      </span>
      <span
        aria-hidden
        ref={probeRef}
        style={{
          position: "absolute",
          visibility: "hidden",
          pointerEvents: "none",
          ...type,
        }}
      >
        {name}
      </span>
    </div>
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */

function TitleStrip({ title }: { title: string }) {
  const display = useScramble(title);
  return (
    <div
      style={{
        position: "relative",
        width: PANEL_WIDTH,
        height: TITLE_STRIP_HEIGHT,
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      {/* Background + border on their own layer so the materialize wipe
          doesn't clip the overhanging crosshairs or the decrypting title. */}
      <span
        aria-hidden
        className="v7-mat-wipe"
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
      <CrossMark position="tl" />
      <CrossMark position="tr" />
      <CrossMark position="bl" />
      <CrossMark position="br" />
      <span
        style={{
          position: "relative",
          fontFamily: "var(--v1-display)",
          fontWeight: 500,
          fontSize: 28,
          lineHeight: "36px",
          color: "#FFFFFF",
        }}
      >
        {display}
      </span>
    </div>
  );
}

function CrossMark({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const variants = {
    tl: { top: -4, left: -4 },
    tr: { top: -4, right: -4 },
    bl: { bottom: -4, left: -4 },
    br: { bottom: -4, right: -4 },
  };
  return (
    <span
      aria-hidden
      className="v7-mat-cross"
      style={{
        position: "absolute",
        width: 8,
        height: 8,
        pointerEvents: "none",
        ...variants[position],
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 8,
          height: 0,
          borderTop: "2px solid #FFFFFF",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 3,
          width: 0,
          height: 8,
          borderLeft: "2px solid #FFFFFF",
        }}
      />
    </span>
  );
}

/* ───────────────────────── PANEL FRAME ───────────────────────── */

// Tactical bracket frame: 50px top + 50px bottom horizontal brackets, plus
// two vertical side lines spanning the middle. viewBox sized to panel so
// y=50 renders at literal 50px (preserveAspectRatio="none" stretches).
// The side rules' 58.45 / 305.22 are the export's own.
function PanelFrame() {
  return (
    <svg
      aria-hidden
      viewBox={`0 0 ${PANEL_WIDTH} ${PANEL_BODY_HEIGHT}`}
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <path
        className="v7-mat-trace"
        pathLength={1}
        d={`M0.5 50.5 V0.5 H${PANEL_WIDTH - 0.5} V50.5`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="v7-mat-trace"
        pathLength={1}
        d={`M${PANEL_WIDTH - 0.5} ${PANEL_BODY_HEIGHT - 50.5} V${PANEL_BODY_HEIGHT - 0.5} H0.5 V${PANEL_BODY_HEIGHT - 50.5}`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="v7-mat-trace"
        pathLength={1}
        d={`M${PANEL_WIDTH - 0.5} 58.45 V305.22`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="v7-mat-trace"
        pathLength={1}
        d="M0.5 58.45 V305.22"
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ───────────────────────── ONLINE INDICATOR ───────────────────────── */

// Concentric-ring status indicator at top-right inside the panel. Ring, mid
// disc and core are the export's 7.19 / 5.07 / 3.30 radii on a 15.75 box.
function OnlineIndicator({
  accent,
  middle,
}: {
  accent: string;
  middle: string;
}) {
  return (
    <span
      aria-hidden
      className="v7-mat-body"
      style={{
        position: "absolute",
        top: 12.5,
        right: 13,
        width: 15.75,
        height: 15.12,
        borderRadius: "50%",
        border: `1.37px solid ${accent}`,
        boxShadow: `0 0 4px ${accent}80`,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 2.8,
          borderRadius: "50%",
          background: middle,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 4.57,
          borderRadius: "50%",
          background: accent,
        }}
      />
    </span>
  );
}

/* ───────────────────────── FIELD CHIP ───────────────────────── */

// Label on the left + translucent-white value cell on the right with a
// large mono number and an optional small unit suffix. Both boxes are fixed
// width — the card never reflows between cables.
//
// Type is measured off the export: the label is 8.7px with no tracking (its
// "TOTAL LANDING POINTS" run is 103.4 wide over 20 characters, which is IBM
// Plex Mono's 0.6em advance exactly), the value 16.5 and the unit 7.5. The
// value is centred in its cell, not right-aligned — all three of the export's
// cells pad it to within 2px on both sides.
function FieldChip({
  label,
  labelWidth,
  valueWidth,
  value,
  unit,
}: {
  label: string;
  labelWidth: number;
  valueWidth: number;
  value: string;
  unit?: string;
}) {
  const cellRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  // Shrink the value+unit pair with transform: scaleX() whenever the
  // natural width exceeds the available cell width. offsetWidth is layout
  // width (ignores transform) so we always measure the unscaled extent.
  useLayoutEffect(() => {
    const cell = cellRef.current;
    const inner = innerRef.current;
    if (!cell || !inner) return;
    const HORIZONTAL_PADDING = 20;
    const fit = () => {
      const available = cell.clientWidth - HORIZONTAL_PADDING;
      const used = inner.offsetWidth;
      if (used > 0 && used > available) {
        inner.style.transform = `scaleX(${available / used})`;
      } else {
        inner.style.transform = "scaleX(1)";
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(cell);
    return () => ro.disconnect();
  }, [value, unit]);

  return (
    <div
      style={{
        display: "flex",
        width: labelWidth + valueWidth,
        height: CHIP_HEIGHT,
        border: "0.29px solid #FFFFFF",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          flex: `0 0 ${labelWidth}px`,
          display: "flex",
          alignItems: "center",
          paddingLeft: 10,
          boxSizing: "border-box",
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 8.7,
          lineHeight: 1.3,
          color: "#FFF6F6",
        }}
      >
        {label}
      </div>
      <div
        ref={cellRef}
        // flex:1 rather than a second fixed basis — the chip is border-box, so
        // the two fixed widths would together overrun its content box by the
        // border and push the cell half a pixel past the right edge.
        style={{
          flex: 1,
          minWidth: 0,
          background: "rgba(255, 255, 255, 0.3)",
          borderLeft: "0.285px solid #FFFFFF",
          boxSizing: "border-box",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 10px",
          overflow: "hidden",
        }}
      >
        <div
          ref={innerRef}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 5,
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontWeight: 400,
              fontSize: 16.5,
              lineHeight: 1,
              color: "#FFF6F6",
            }}
          >
            {value}
          </span>
          {unit && (
            <span
              style={{
                fontFamily: "var(--v1-mono)",
                fontWeight: 300,
                fontSize: 7.5,
                lineHeight: 1,
                color: "#FFFFFF",
              }}
            >
              {unit}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── DESCRIPTION BLOCK ───────────────────────── */

// Integrated frame from temp/cablesystem/card.svg — the eyebrow chip is part
// of the container's outer outline as one continuous stroke (no overlapping
// borders), with a chamfered top-right corner, a bottom-left staircase, and an
// open-ended inner L-bracket on the left.
//
// The shape is the one that was here before, stretched: every corner keeps its
// absolute size and only the left wall's straight run grows, from 91.6 to
// 170.8. That is what the owner chips paid for.
//
// It no longer scrolls. The block holds ten 13px lines at a 320px measure —
// 53 characters of IBM Plex Mono, whose 0.6em advance makes that arithmetic
// rather than a guess — and the longest description we carry (SMW4 and SMW5,
// 426 characters) wraps to nine. So the copy fits outright and the drag-scroll,
// the fade mask and the "more below" chevron are gone with it. The ceiling is
// real though: a description past ~500 characters would clip silently.
const DESC_FRAME =
  "M132.5034 0 L5.9222 0 H0 V50.425 L29.724 82.952 V170.832 L39.7182 180.418 H411.2734 V38.993 L391.5984 19.338 L151.8604 19.338 Z";
const DESC_BRACKET =
  "M61.5715 59.388 H46.2428 L39.0311 50.882 H10.8827 V14.984 H28.476";

function DescriptionBlock({ label, text }: { label: string; text: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: DESC_LEFT,
        top: DESC_TOP,
        width: DESC_WIDTH,
        height: DESC_HEIGHT,
      }}
    >
      {/* Half a pixel of margin in the viewBox so the outline's 1px stroke
          sits inside the box instead of being clipped in half on all four
          edges — the path runs along the box's own boundary. */}
      <svg
        viewBox={`-0.5 -0.5 ${DESC_WIDTH + 1} ${DESC_HEIGHT + 1}`}
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        <path
          d={DESC_FRAME}
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* Inner L-bracket — open at both ends with a chamfered diagonal. */}
        <path
          d={DESC_BRACKET}
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* Box around the "Description" eyebrow inside the integrated chip. */}
        <rect
          x="29.1062"
          y="6.121"
          width="71.6179"
          height="15.145"
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      <span
        style={{
          position: "absolute",
          left: 29.1062,
          top: 6.121,
          width: 71.6179,
          height: 15.145,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--v1-mono)",
          fontWeight: 400,
          fontSize: 8.5,
          lineHeight: 1.3,
          color: "#FFF6F6",
        }}
      >
        {label}
      </span>

      {/* Body copy — right of the inner bracket, below the eyebrow chip, clear
          of the bottom-left staircase. 320 wide so it wraps where the export
          wraps; 130 tall is ten lines, one more than the longest copy needs. */}
      <p
        style={{
          position: "absolute",
          left: 69,
          top: 40,
          width: 320,
          height: 130,
          margin: 0,
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 10,
          lineHeight: "13px",
          color: "#FFFFFF",
          overflow: "hidden",
        }}
      >
        {text}
      </p>
    </div>
  );
}
