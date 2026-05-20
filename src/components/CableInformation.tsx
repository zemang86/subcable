"use client";

import { useLayoutEffect, useRef } from "react";
import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

interface CableInformationProps {
  cable: CableSystem;
  language?: Language;
}

const PANEL_WIDTH = 454;
const TITLE_STRIP_HEIGHT = 47;
const PANEL_BODY_HEIGHT = 362;

// Pull out the leading number group + a unit hint from a free-form string.
// "3,000 km" → { value: "3,000", unit: "KM" }
// "10 Tbps (MY–Japan)" → { value: "10", unit: "Tbps" }
function splitValueUnit(raw: string | undefined, fallbackUnit?: string): {
  value: string;
  unit: string;
} {
  if (!raw) return { value: "—", unit: fallbackUnit ?? "" };
  const m = raw.match(/^([\d,.]+)\s*([A-Za-z/]+)?/);
  if (!m) return { value: raw, unit: "" };
  return { value: m[1], unit: (m[2] ?? fallbackUnit ?? "").trim() };
}

export default function CableInformation({
  cable,
  language = "en",
}: CableInformationProps) {
  const t = useT(language);
  const inactive = cable.status !== "active";
  const nameColor = inactive ? "#FF3F3F" : "#00FF4D";
  const indicatorAccent = inactive ? "#FF3F3F" : "#8FFF3F";
  const indicatorMiddle = inactive ? "#642E2E" : "#3F642E";

  const length = splitValueUnit(cable.length);
  const capacity = splitValueUnit(cable.capacity, "Gbps");

  return (
    <div
      style={{
        position: "fixed",
        // Stacked above the Cable System panel on the right edge.
        bottom: 420,
        right: 28,
        zIndex: 20,
        width: PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        gap: 24,
      }}
    >
      <TitleStrip title={t("cableInformation")} />

      {/* PANEL BODY — bevel gradient + SVG frame */}
      <div
        style={{
          position: "relative",
          width: PANEL_WIDTH,
          height: PANEL_BODY_HEIGHT,
          background:
            "linear-gradient(303.52deg, #034DA1 -11.48%, rgba(3, 77, 161, 0) 82.93%), linear-gradient(123.48deg, rgba(240, 90, 34, 0.6) -7.19%, rgba(240, 90, 34, 0) 100%)",
        }}
      >
        <PanelFrame />
        <OnlineIndicator accent={indicatorAccent} middle={indicatorMiddle} />

        {/* Body content — padded inset */}
        <div
          style={{
            position: "absolute",
            inset: "13px 18px 12px 18px",
            display: "flex",
            flexDirection: "column",
            gap: 6,
          }}
        >
          <EyebrowChip label={t("fullName")} />

          <div
            style={{
              fontFamily: "var(--v1-heading)",
              fontWeight: 700,
              fontSize: 15,
              lineHeight: "19px",
              color: nameColor,
              marginTop: 2,
              marginBottom: 4,
            }}
          >
            {cable.name}
          </div>

          {/* 2x2 field chip grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
              marginTop: 2,
            }}
          >
            <FieldChip
              label={t("length").toUpperCase()}
              value={length.value}
              unit={length.unit || "KM"}
            />
            <FieldChip
              label={t("built").toUpperCase()}
              value={cable.buildYear ? String(cable.buildYear) : "—"}
            />
            <FieldChip
              label={t("capacity").toUpperCase()}
              value={capacity.value}
              unit={capacity.unit || "Gbps"}
            />
            <FieldChip
              label={t("rfs").toUpperCase()}
              value={cable.rfs || "—"}
            />
          </div>

          {/* Owners */}
          <div style={{ marginTop: 10 }}>
            <EyebrowChip label={t("owners")} />
            <div
              style={{
                display: "flex",
                gap: 12,
                marginTop: 6,
                flexWrap: "wrap",
              }}
            >
              {cable.owners.map((owner) => (
                <FilmStripChip key={owner} label={owner.toUpperCase()} />
              ))}
            </div>
          </div>

          {/* Description */}
          <DescriptionBlock
            label={t("description")}
            text={cable.description}
          />
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */

function TitleStrip({ title }: { title: string }) {
  return (
    <div
      style={{
        position: "relative",
        width: PANEL_WIDTH,
        height: TITLE_STRIP_HEIGHT,
        background:
          "linear-gradient(0deg, rgba(255,255,255,0) 41.87%, #FFFFFF 413.39%), linear-gradient(180deg, rgba(255,255,255,0) 45.95%, #FFFFFF 278.39%)",
        border: "0.37px solid #FFFFFF",
        display: "flex",
        alignItems: "center",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <CrossMark position="tl" />
      <CrossMark position="tr" />
      <CrossMark position="bl" />
      <CrossMark position="br" />
      <span
        style={{
          fontFamily: "var(--v1-display)",
          fontWeight: 500,
          fontSize: 28,
          lineHeight: "36px",
          color: "#FFFFFF",
        }}
      >
        {title}
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
        d={`M0.5 50.5 V0.5 H${PANEL_WIDTH - 0.5} V50.5`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${PANEL_WIDTH - 0.5} ${PANEL_BODY_HEIGHT - 50.5} V${PANEL_BODY_HEIGHT - 0.5} H0.5 V${PANEL_BODY_HEIGHT - 50.5}`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M${PANEL_WIDTH - 0.5} 60 V${PANEL_BODY_HEIGHT - 60}`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      <path
        d={`M0.5 60 V${PANEL_BODY_HEIGHT - 60}`}
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ───────────────────────── ONLINE INDICATOR ───────────────────────── */

// 15px concentric-ring status indicator at top-right inside the panel.
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
      style={{
        position: "absolute",
        top: 12,
        right: 16,
        width: 15.43,
        height: 15,
        borderRadius: "50%",
        border: `1.37px solid ${accent}`,
        boxShadow: `0 0 4px ${accent}80`,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 2.2,
          borderRadius: "50%",
          background: middle,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 4.3,
          borderRadius: "50%",
          background: accent,
        }}
      />
    </span>
  );
}

/* ───────────────────────── EYEBROW CHIP ───────────────────────── */

// Small white-bordered tag for section labels ("Full name", "Owners", etc).
function EyebrowChip({ label }: { label: string }) {
  return (
    <span
      style={{
        display: "inline-block",
        border: "0.26px solid #FFFFFF",
        padding: "2px 7px",
        fontFamily: "var(--v1-mono)",
        fontWeight: 400,
        fontSize: 8.5,
        lineHeight: 1.3,
        color: "#FFF6F6",
        letterSpacing: "0.02em",
        alignSelf: "flex-start",
        boxSizing: "border-box",
      }}
    >
      {label}
    </span>
  );
}

/* ───────────────────────── FIELD CHIP ───────────────────────── */

// Label on the left + translucent-white value cell on the right with a
// large mono number and an optional small unit suffix.
function FieldChip({
  label,
  value,
  unit,
}: {
  label: string;
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
        position: "relative",
        height: 27,
        border: "0.29px solid #FFFFFF",
        display: "grid",
        gridTemplateColumns: "minmax(60px, auto) 1fr",
        alignItems: "stretch",
        boxSizing: "border-box",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: "0 8px",
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 9,
          color: "#FFF6F6",
          letterSpacing: "0.04em",
        }}
      >
        {label}
      </div>
      <div
        ref={cellRef}
        style={{
          background: "rgba(255, 255, 255, 0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "flex-end",
          padding: "0 10px",
          overflow: "hidden",
        }}
      >
        <div
          ref={innerRef}
          style={{
            display: "inline-flex",
            alignItems: "baseline",
            gap: 3,
            transformOrigin: "right center",
            whiteSpace: "nowrap",
          }}
        >
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontWeight: 400,
              fontSize: 17,
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
                fontSize: 8,
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

/* ───────────────────────── FILM-STRIP OWNER CHIP ───────────────────────── */

// Owner pill: light-gray fill, white border, orange text — with a small
// protruding square at top-left mimicking the Figma "film-strip" leader.
function FilmStripChip({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#D9D9D9",
        border: "0.37px solid #FFFFFF",
        padding: "0 14px 0 18px",
        height: 22,
        minWidth: 100,
        fontFamily: "var(--v1-heading)",
        fontWeight: 700,
        fontSize: 9,
        letterSpacing: "0.06em",
        color: "#F05A22",
        boxSizing: "border-box",
        whiteSpace: "nowrap",
      }}
    >
      {/* protruding square at top-left — the "film-strip" leader */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -5,
          left: -1,
          width: 10.5,
          height: 10.5,
          background: "#D9D9D9",
          border: "0.37px solid #FFFFFF",
        }}
      />
      {label}
    </span>
  );
}

/* ───────────────────────── DESCRIPTION BLOCK ───────────────────────── */

// White-bordered container with:
//   - "Description" eyebrow chip overlapping the top border
//   - inner L-bracket frame on the left (decoration / icon slot)
//   - description body text on the right
function DescriptionBlock({ label, text }: { label: string; text: string }) {
  return (
    <div
      style={{
        position: "relative",
        marginTop: 14,
        border: "0.63px solid #FFFFFF",
        minHeight: 90,
        padding: "16px 14px 14px 70px",
        boxSizing: "border-box",
      }}
    >
      {/* Eyebrow chip — sits on the top border with the chip's own border
          continuing around it. The chip background is opaque enough to
          visually break the container border line behind it. */}
      <span
        style={{
          position: "absolute",
          top: -8,
          left: 28,
          border: "0.26px solid #FFFFFF",
          padding: "2px 7px",
          background:
            "linear-gradient(303.52deg, #034DA1 -11.48%, rgba(3, 77, 161, 0.95) 82.93%), linear-gradient(123.48deg, rgba(240, 90, 34, 0.6) -7.19%, rgba(240, 90, 34, 0) 100%)",
          fontFamily: "var(--v1-mono)",
          fontWeight: 400,
          fontSize: 8.5,
          lineHeight: 1.3,
          color: "#FFF6F6",
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>

      {/* Inner L-bracket frame on the left — decorative icon slot.
          Figma Vector 214: 50×44 white border. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 14,
          left: 10,
          width: 50,
          height: 44,
          border: "0.37px solid #FFFFFF",
          pointerEvents: "none",
        }}
      />

      <p
        style={{
          margin: 0,
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 10,
          lineHeight: "13px",
          color: "#FFFFFF",
        }}
      >
        {text}
      </p>
    </div>
  );
}
