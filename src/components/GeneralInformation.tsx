"use client";

import { memo } from "react";
import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";

interface GeneralInformationProps {
  language?: Language;
  className?: string;
}

const PANEL_WIDTH = 454;
const TITLE_STRIP_HEIGHT = 47;
const PANEL_BODY_HEIGHT = 362;

// Orange-hot vs orange-mid alternation per Figma (key statistic 01–04).
const ORANGE_HOT = "#FF4D00";
const ORANGE_MID = "#F05A22";

// Memoized: shields the panel from GlobeScene's 30fps marker-tracking
// re-renders (props are stable).
export default memo(GeneralInformation);

function GeneralInformation({
  language = "en",
  className,
}: GeneralInformationProps) {
  const t = useT(language);

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
      <TitleStrip title={t("generalInformation")} />

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
          {/* Body copy */}
          <p
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
            {t("generalInfoBody")}
          </p>
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

        {/* ── "Key Statistic" heading ── */}
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
          {t("keyStatistic")}
        </span>

        {/* ── 2×2 key statistic grid ── */}
        <StatCell left={11} top={170} value="95%+" color={ORANGE_HOT} label={t("globalInternetTraffic")} />
        <StatCell left={11} top={247} value="1.3M" color={ORANGE_MID} label={t("kmOnSeafloors")} />
        <StatCell left={221} top={170} value="600+" color={ORANGE_MID} label={t("cablesWorldwide")} />
        <StatCell left={221} top={247} value="1866" color={ORANGE_HOT} label={t("firstTransAtlantic")} />
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
  color,
  label,
}: {
  left: number;
  top: number;
  value: string;
  color: string;
  label: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        left,
        top,
        width: 194,
        height: 66,
      }}
    >
      {/* Card shape from Figma (temp/done/keystats_card.svg) — chamfered bottom-left body +
          open top-left bracket. Text paths stripped; value/label overlaid below. */}
      <svg
        aria-hidden
        viewBox="0 0 196 67"
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
          d="M195.148 67.0047V1.14917H1.14844V49.4786L18.6683 67.0047H195.148Z"
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
          color,
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
