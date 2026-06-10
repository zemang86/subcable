"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

interface CableInformationProps {
  cable: CableSystem;
  language?: Language;
  className?: string;
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
  className,
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

// Owner chip — single continuous L-shape outline (tab + main body) lifted
// directly from temp/owner-cableinfocard.svg. The tab area at top-left is
// outline-only (panel gradient shows through); only the main 75×12 inner
// rectangle is filled #D9D9D9.
function FilmStripChip({ label }: { label: string }) {
  return (
    <span
      style={{
        position: "relative",
        display: "inline-block",
        width: 130,
        height: 35,
        flexShrink: 0,
      }}
    >
      <svg
        viewBox="0 0 86 23"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* Inner gray fill — main body only; the tab area stays transparent
            so the panel gradient shows through it. */}
        <rect x="6.6" y="7.6" width="75.4" height="12.6" fill="#D9D9D9" />
        {/* L-shaped outer outline — exact path from Figma export. */}
        <path
          d="M10.7158 5.33203 H85.1221 V22.5771 H4.81934 V10.7168 H0.183594 V0.18457 H10.7158 Z"
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      {/* Text overlay — positioned inside the main body region only, skipping
          the tab area (≈13% from left). */}
      <span
        style={{
          position: "absolute",
          top: "33%",
          bottom: "12.2%",
          left: "13%",
          right: "5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--v1-heading)",
          fontWeight: 700,
          fontSize: 10,
          color: "#F05A22",
          letterSpacing: "0.06em",
          whiteSpace: "nowrap",
          pointerEvents: "none",
        }}
      >
        {label}
      </span>
    </span>
  );
}

/* ───────────────────────── DESCRIPTION BLOCK ───────────────────────── */

// Integrated frame from temp/description.svg — eyebrow chip is part of the
// container's outer outline as one continuous stroke (no overlapping borders).
// Includes a chamfered top-right corner, a bottom-left staircase, and an
// open-ended inner L-bracket on the left. Text overlays are positioned
// inside the corresponding viewBox regions.
//
// The frame is a fixed 104px (the panel body is a fixed Figma frame, so the
// block can't grow). Copy that doesn't fit used to be silently clipped; now
// overflow is detected and the text becomes drag-scrollable (pointer-driven —
// the kiosk root sets touch-action:none, so native pan never fires), with a
// bottom fade + chevron so the user can SEE there's more.
function DescriptionBlock({ label, text }: { label: string; text: string }) {
  const bodyRef = useRef<HTMLParagraphElement | null>(null);
  const dragRef = useRef<{ y: number; top: number } | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const [atEnd, setAtEnd] = useState(false);

  // Re-measure whenever the copy changes (cable switch / language flip).
  useEffect(() => {
    const el = bodyRef.current;
    if (!el) return;
    el.scrollTop = 0;
    setOverflowing(el.scrollHeight > el.clientHeight + 1);
    setAtEnd(false);
  }, [text]);

  const updateAtEnd = () => {
    const el = bodyRef.current;
    if (!el) return;
    setAtEnd(el.scrollTop + el.clientHeight >= el.scrollHeight - 2);
  };

  return (
    <div
      style={{
        position: "relative",
        marginTop: 16,
        width: "100%",
        height: 104,
      }}
    >
      <svg
        viewBox="0 0 413 103"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          pointerEvents: "none",
        }}
      >
        {/* Outer frame — integrated eyebrow chip + container + bottom-left
            staircase, all as one continuous path. */}
        <path
          d="M132.941 0.316406L6.24404 0.316763H0.316406V50.7876L30.0676 83.3441V91.6193L40.071 102.077H411.966V39.3451L392.274 19.6723L152.316 19.6719L132.941 0.316406Z"
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* Inner L-bracket — open at both ends with a chamfered diagonal. */}
        <path
          d="M61.9423 59.7585H46.5995L39.3812 51.2446H11.207V15.3145H28.8164"
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
        {/* Tight box around the "Description" eyebrow label inside the
            integrated chip area at top-left. */}
        <rect
          x="33"
          y="3"
          width="64"
          height="16"
          stroke="#FFFFFF"
          strokeWidth="1"
          fill="none"
          vectorEffect="non-scaling-stroke"
        />
      </svg>

      {/* Eyebrow label — inside the integrated chip area at top-left
          (matches Figma "Description" glyph position at x≈37, y≈11). */}
      <span
        style={{
          position: "absolute",
          top: 5,
          left: "9%",
          fontFamily: "var(--v1-mono)",
          fontWeight: 400,
          fontSize: 8.5,
          color: "#FFF6F6",
          lineHeight: 1.3,
          letterSpacing: "0.02em",
        }}
      >
        {label}
      </span>

      {/* Body text — right of inner bracket, below the eyebrow chip,
          above the bottom-left staircase. Drag-scrollable when it overflows;
          the fade mask lifts once scrolled to the end. */}
      <p
        ref={bodyRef}
        onPointerDown={(e) => {
          if (!overflowing) return;
          dragRef.current = {
            y: e.clientY,
            top: bodyRef.current?.scrollTop ?? 0,
          };
        }}
        onPointerMove={(e) => {
          const d = dragRef.current;
          const el = bodyRef.current;
          if (!d || !el) return;
          el.scrollTop = d.top - (e.clientY - d.y);
          updateAtEnd();
        }}
        onPointerUp={() => {
          dragRef.current = null;
        }}
        onPointerCancel={() => {
          dragRef.current = null;
        }}
        onPointerLeave={() => {
          dragRef.current = null;
        }}
        style={{
          position: "absolute",
          top: "26%",
          left: "17%",
          right: "3%",
          bottom: "13%",
          margin: 0,
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 10,
          lineHeight: "13px",
          color: "#FFFFFF",
          overflow: "hidden",
          userSelect: "none",
          touchAction: "none",
          ...(overflowing && !atEnd
            ? {
                WebkitMaskImage:
                  "linear-gradient(180deg, #000 62%, transparent 100%)",
                maskImage:
                  "linear-gradient(180deg, #000 62%, transparent 100%)",
              }
            : null),
        }}
      >
        {text}
      </p>

      {/* "More below" chevron — only while overflowing copy hasn't been
          scrolled to its end. */}
      {overflowing && !atEnd && (
        <span
          aria-hidden
          className="v1-pulse"
          style={{
            position: "absolute",
            right: "4%",
            bottom: 2,
            fontFamily: "var(--v1-mono)",
            fontSize: 11,
            lineHeight: 1,
            color: "#FFFFFF",
            pointerEvents: "none",
          }}
        >
          ⌄
        </span>
      )}
    </div>
  );
}
