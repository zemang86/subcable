"use client";

import { memo, useEffect, useState } from "react";
import type { Language } from "@/lib/types";
import {
  AT_A_GLANCE,
  DID_YOU_KNOW_FACTS,
  FACT_SLIDE_MS,
} from "@/data/didYouKnow";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";

interface DidYouKnowProps {
  language?: Language;
  className?: string;
}

const PANEL_WIDTH = 454;
const TITLE_STRIP_HEIGHT = 47;
const PANEL_BODY_HEIGHT = 362;

const ORANGE_MID = "#F05A22";
// At a Glance cards. The height is set by the copy, not by taste: the labels
// wrap to two 13px lines under a 39px value, and 80 leaves the same bottom
// padding the design shows. Two rows then land 14px clear of the panel floor.
const GRID_TOP = 170;
const CARD_HEIGHT = 80;
const CARD_GAP = 18;
// Card outline geometry, in the export's own units.
const CARD_BOTTOM = CARD_HEIGHT - 1.15;
const CHAMFER = 17.53;
// Sampled from the design: the spent dots are a warm cream, not dimmed white —
// white at any opacity goes grey against this panel's gradient.
const DOT_IDLE = "#F1CCAA";
// 6px on an 11px pitch, measured off the design.
const DOT_SIZE = 6;
const DOT_GAP = 5;

// Memoized: shields the panel from GlobeScene's 30fps marker-tracking
// re-renders (props are stable).
export default memo(DidYouKnow);

function DidYouKnow({
  language = "en",
  className,
}: DidYouKnowProps) {
  const t = useT(language);
  const [fact, setFact] = useState(0);

  // One fact per FACT_SLIDE_MS, looping. setInterval rather than a chained
  // timeout: nothing here can interrupt the cadence, so there's no state to
  // restart it from.
  useEffect(() => {
    const tick = setInterval(
      () => setFact((i) => (i + 1) % DID_YOU_KNOW_FACTS.length),
      FACT_SLIDE_MS,
    );
    return () => clearInterval(tick);
  }, []);

  return (
    <div
      className={className}
      style={{
        position: "fixed",
        // Occupies the same slot as CableInformation — shown when no cable is
        // selected, stacked above the Cable System panel on the right edge.
        bottom: 420,
        right: 28,
        zIndex: 20,
        width: PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <TitleStrip title={t("didYouKnow")} />

      {/* PANEL BODY — bevel gradient + SVG frame. The gradient sits on its
          own wiping layer so the traced frame isn't clipped with it, and the
          content shares one fade layer (absolute coords preserved by inset 0). */}
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

        <div className="v7-mat-body" style={{ position: "absolute", inset: 0 }}>

        {/* ── Intro description block (Figma "General Info 01") ── */}
        <div style={{ position: "absolute", left: 11, top: 14, width: 405, height: 79 }}>
          {/* Translucent inner fill */}
          <div
            style={{
              position: "absolute",
              left: 15,
              top: 4,
              width: 384,
              height: 70,
              background: "rgba(255, 255, 255, 0.15)",
            }}
          />
          {/* Left edge accent line */}
          <div
            style={{
              position: "absolute",
              left: 0,
              top: 2,
              width: 1,
              height: 76,
              background: "#FFFFFF",
            }}
          />
          {/* Corner brackets */}
          <CornerBracket position="tl" />
          <CornerBracket position="tr" />
          <CornerBracket position="bl" />
          <CornerBracket position="br" />
          {/* Body copy — the fact on show, re-keyed so each one fades in */}
          <p
            key={fact}
            className="v1-gi-fade"
            style={{
              position: "absolute",
              left: 26,
              top: 17,
              width: 361,
              margin: 0,
              fontFamily: "var(--v1-mono)",
              fontWeight: 400,
              fontSize: 9,
              lineHeight: "12px",
              textAlign: "justify",
              color: "#FFFFFF",
            }}
          >
            {DID_YOU_KNOW_FACTS[fact]}
          </p>

          {/* Ten-second countdown — orange filling a white track, sized and
              placed to the paragraph so it reads as that fact's timer. Shares
              FACT_SLIDE_MS with the interval above, so bar and advance can't
              drift apart. */}
          <div
            style={{
              position: "absolute",
              left: 26,
              top: 65,
              width: 361,
              height: 2,
              background: "#FFFFFF",
              overflow: "hidden",
            }}
          >
            <span
              key={fact}
              className="v1-gi-fill"
              aria-hidden
              style={{
                position: "absolute",
                left: 0,
                top: 0,
                bottom: 0,
                background: ORANGE_MID,
                animationDuration: `${FACT_SLIDE_MS}ms`,
              }}
            />
          </div>
          {/* Orange + red underline accent */}
          <div
            style={{
              position: "absolute",
              left: 34,
              top: 77,
              width: 177,
              height: 2,
              background: ORANGE_MID,
            }}
          />
          <div
            style={{
              position: "absolute",
              left: 213,
              top: 77,
              width: 169,
              height: 2,
              background: "#ED1B2E",
            }}
          />
        </div>

        {/* ── Fact pagination — one dot per fact, current one orange ── */}
        <div
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            top: 100,
            display: "flex",
            justifyContent: "center",
            gap: DOT_GAP,
          }}
        >
          {DID_YOU_KNOW_FACTS.map((_, i) => (
            <span
              key={i}
              style={{
                width: DOT_SIZE,
                height: DOT_SIZE,
                borderRadius: "50%",
                background: i === fact ? ORANGE_MID : DOT_IDLE,
              }}
            />
          ))}
        </div>

        {/* ── Divider with end caps ── */}
        <div style={{ position: "absolute", left: 9, top: 118, width: 417, height: 4 }}>
          <div
            style={{
              position: "absolute",
              left: 2,
              top: 2,
              width: 413,
              height: 0,
              borderTop: "1px solid #FFFFFF",
            }}
          />
          <span style={{ position: "absolute", left: 0, top: 0, width: 4, height: 4, background: "#FFFFFF" }} />
          <span style={{ position: "absolute", right: 0, top: 0, width: 4, height: 4, background: "#FFFFFF" }} />
        </div>

        {/* ── "At a Glance" heading ── */}
        <span
          style={{
            position: "absolute",
            left: 9,
            top: 132,
            fontFamily: "var(--v1-display)",
            fontWeight: 500,
            fontSize: 14,
            lineHeight: "18px",
            color: "#FFFFFF",
          }}
        >
          {t("atAGlance")}
        </span>

        {/* ── 2×2 "At a Glance" grid, in reading order ── */}
        {AT_A_GLANCE.map((stat, i) => (
          <StatCell
            key={stat.value}
            left={i % 2 === 0 ? 11 : 221}
            top={GRID_TOP + Math.floor(i / 2) * (CARD_HEIGHT + CARD_GAP)}
            value={stat.value}
            label={stat.label}
          />
        ))}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── KEY STATISTIC CELL ───────────────────────── */

function StatCell({
  left,
  top,
  value,
  label,
}: {
  left: number;
  top: number;
  value: string;
  label: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 194,
        height: CARD_HEIGHT,
      }}
    >
      {/* Card shape from Figma (temp/done/keystats_card.svg) — chamfered bottom-left body +
          open top-left bracket. Text paths stripped; value/label overlaid below.
          The viewBox tracks the card height so the chamfer keeps the angle the
          export drew instead of stretching with the card. */}
      <svg
        aria-hidden
        viewBox={`0 0 196 ${CARD_HEIGHT}`}
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
          d={`M195.148 ${CARD_BOTTOM}V1.14917H1.14844V${CARD_BOTTOM - CHAMFER}L18.6683 ${CARD_BOTTOM}H195.148Z`}
          fill="#034DA1"
          fillOpacity="0.44"
        />
        <path
          d="M1.14844 15.3758V1.14917H15.3751"
          stroke="#FFFFFF"
          strokeWidth="2.29828"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <span
        style={{
          position: "absolute",
          left: 18,
          top: 6,
          fontFamily: "var(--v1-stat)",
          fontWeight: 400,
          fontSize: 32,
          lineHeight: "39px",
          whiteSpace: "nowrap",
          color: ORANGE_MID,
        }}
      >
        {value}
      </span>
      <span
        style={{
          position: "absolute",
          left: 18,
          top: 45,
          right: 8,
          fontFamily: "var(--v1-mono)",
          fontWeight: 400,
          fontSize: 10,
          lineHeight: "13px",
          color: "#FFFFFF",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ───────────────────────── CORNER BRACKET ───────────────────────── */

// 21×17.5 open L-bracket (1px white) at each corner of the intro block,
// per Figma Vector 66–69. Placeholder for the custom SVG to be supplied later.
function CornerBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const W = 21;
  const H = 17.5;
  const base: React.CSSProperties = {
    position: "absolute",
    width: W,
    height: H,
    pointerEvents: "none",
    boxSizing: "border-box",
  };
  const variants: Record<typeof position, React.CSSProperties> = {
    tl: { left: 10, top: 0, borderTop: "1px solid #FFFFFF", borderLeft: "1px solid #FFFFFF" },
    tr: { right: 6, top: 1, borderTop: "1px solid #FFFFFF", borderRight: "1px solid #FFFFFF" },
    bl: { left: 10, bottom: 1, borderBottom: "1px solid #FFFFFF", borderLeft: "1px solid #FFFFFF" },
    br: { right: 6, bottom: 1, borderBottom: "1px solid #FFFFFF", borderRight: "1px solid #FFFFFF" },
  };
  return <span aria-hidden style={{ ...base, ...variants[position] }} />;
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
        d={`M${PANEL_WIDTH - 0.5} 60 V${PANEL_BODY_HEIGHT - 60}`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        className="v7-mat-trace"
        pathLength={1}
        d={`M0.5 60 V${PANEL_BODY_HEIGHT - 60}`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}
