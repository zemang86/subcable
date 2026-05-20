"use client";

import { useMemo, useState } from "react";
import { cables } from "@/data/cables";
import type { CableSystem, Filter, LandingPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import CableCard from "./CableCard";

interface SidebarProps {
  selectedCable: CableSystem | null;
  onSelectCable: (cable: CableSystem | null) => void;
  /** Kept for legacy compatibility with GlobeScene; unused inside the v1 CableSystem panel. */
  onPointClick?: (point: LandingPoint) => void;
  language?: Language;
}

const FILTERS: { id: Filter; key: "showAll" | "international" | "domestic" }[] = [
  { id: "all", key: "showAll" },
  { id: "international", key: "international" },
  { id: "domestic", key: "domestic" },
];

// Panel width per Figma temp/cablesystem.css (Rectangle 52 + Rectangle 54).
const PANEL_WIDTH = 454;
const PANEL_BODY_HEIGHT = 254;
const TITLE_STRIP_HEIGHT = 47;
const FILTER_BUTTON_HEIGHT = 23;

export default function Sidebar({
  selectedCable,
  onSelectCable,
  language = "en",
}: SidebarProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const t = useT(language);

  const visible = useMemo(() => {
    if (filter === "all") return cables;
    if (filter === "international") {
      return cables.filter(
        (c) => c.classification === "international" || c.classification === "iru",
      );
    }
    return cables.filter((c) => c.classification === "domestic");
  }, [filter]);

  const activeCount = visible.filter((c) => c.status === "active").length;
  const inactiveCount = visible.length - activeCount;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 28,
        right: 28,
        zIndex: 20,
        width: PANEL_WIDTH,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      {/* TOP — title strip with white-gradient fill + L-bracket corners */}
      <TitleStrip
        title={t("cableSystem")}
        activeCount={activeCount}
        activeLabel={t("active")}
        inactiveCount={inactiveCount}
        inactiveLabel={t("inactive")}
      />

      {/* MIDDLE — 3-col grid panel with bevel gradient + tactical frame bands + orange scroll bar */}
      <div
        style={{
          position: "relative",
          width: PANEL_WIDTH,
          height: PANEL_BODY_HEIGHT,
          background:
            "linear-gradient(303.52deg, #034DA1 -11.48%, rgba(3, 77, 161, 0) 82.93%), linear-gradient(123.48deg, rgba(240, 90, 34, 0.6) -7.19%, rgba(240, 90, 34, 0) 100%)",
        }}
      >
        {/* Frame bands — top + bottom 50px borders, left + right 135px vertical lines */}
        <PanelFrame />

        {/* Scroll container — inset so cards don't overlap the frame edges */}
        <div
          className="v1-cable-grid-scroll"
          style={{
            position: "absolute",
            top: 8,
            bottom: 8,
            left: 8,
            right: 30,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
        >
          {visible.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: 28,
                color: "var(--v1-mute)",
                fontSize: 11,
              }}
            >
              No cables match.
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 6,
              }}
            >
              {visible.map((cable) => (
                <CableCard
                  key={cable.id}
                  cable={cable}
                  isSelected={selectedCable?.id === cable.id}
                  onSelect={() =>
                    onSelectCable(selectedCable?.id === cable.id ? null : cable)
                  }
                />
              ))}
            </div>
          )}
        </div>

        {/* Orange scroll bar — vertical line + thumb + 5px horizontal caps */}
        <ScrollBar visibleCount={visible.length} />
      </div>

      {/* BOTTOM — filter tabs row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 3,
        }}
      >
        {FILTERS.map((f) => (
          <FilterButton
            key={f.id}
            label={t(f.key).toUpperCase()}
            active={filter === f.id}
            onClick={() => setFilter(f.id)}
          />
        ))}
      </div>
    </div>
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */

function TitleStrip({
  title,
  activeCount,
  activeLabel,
  inactiveCount,
  inactiveLabel,
}: {
  title: string;
  activeCount: number;
  activeLabel: string;
  inactiveCount: number;
  inactiveLabel: string;
}) {
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
        justifyContent: "space-between",
        padding: "0 14px",
        boxSizing: "border-box",
      }}
    >
      <FrameBracket position="tl" />
      <FrameBracket position="tr" />
      <FrameBracket position="bl" />
      <FrameBracket position="br" />

      <span
        style={{
          fontFamily: "var(--v1-display)",
          fontStyle: "normal",
          fontWeight: 600,
          fontSize: 26,
          lineHeight: "34px",
          color: "#FFFFFF",
        }}
      >
        {title}
      </span>

      <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
        <CountChip n={activeCount} label={activeLabel} tone="active" />
        {inactiveCount > 0 && (
          <CountChip n={inactiveCount} label={inactiveLabel} tone="inactive" />
        )}
      </div>
    </div>
  );
}

// 8×8 L-bracket — same shape as the Header strip (top-left + top-right + bottom-left + bottom-right)
function FrameBracket({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const variants = {
    tl: { top: -4, left: -4, borderTop: "2px solid #FFFFFF", borderLeft: "2px solid #FFFFFF" },
    tr: { top: -4, right: -4, borderTop: "2px solid #FFFFFF", borderRight: "2px solid #FFFFFF" },
    bl: { bottom: -4, left: -4, borderBottom: "2px solid #FFFFFF", borderLeft: "2px solid #FFFFFF" },
    br: { bottom: -4, right: -4, borderBottom: "2px solid #FFFFFF", borderRight: "2px solid #FFFFFF" },
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
    />
  );
}

function CountChip({
  n,
  label,
  tone,
}: {
  n: number;
  label: string;
  tone: "active" | "inactive";
}) {
  const color = tone === "active" ? "#8FFF3F" : "#FF3F3F";
  const dark = tone === "active" ? "#3F642E" : "#642E2E";
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <BigStatus accent={color} middle={dark} />
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontStyle: "normal",
          fontWeight: 500,
          fontSize: 17,
          lineHeight: "22px",
          color,
        }}
      >
        {n} {label}
      </span>
    </div>
  );
}

// Title-bar size status indicator (15px concentric rings, with subtle outer glow)
function BigStatus({ accent, middle }: { accent: string; middle: string }) {
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        width: 15,
        height: 15,
        borderRadius: "50%",
        border: `1.37px solid ${accent}`,
        boxShadow: `0 0 4px ${accent}80`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 2.05,
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

/* ───────────────────────── PANEL FRAME ───────────────────────── */

// Four white border bands overlaid on the panel:
//   · top horizontal 50px-tall band (full width)
//   · bottom horizontal 50px-tall band (full width)
//   · left + right vertical 135px lines in the middle
function PanelFrame() {
  return (
    <>
      {/* Top horizontal band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: PANEL_WIDTH,
          height: 50,
          border: "1px solid #FFFFFF",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      />
      {/* Bottom horizontal band */}
      <div
        style={{
          position: "absolute",
          left: 0,
          bottom: 0,
          width: PANEL_WIDTH,
          height: 50,
          border: "1px solid #FFFFFF",
          pointerEvents: "none",
          boxSizing: "border-box",
        }}
      />
      {/* Left vertical line — 135px in the middle */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 61,
          width: 0,
          height: 135,
          borderLeft: "1px solid #FFFFFF",
          pointerEvents: "none",
        }}
      />
      {/* Right vertical line */}
      <div
        style={{
          position: "absolute",
          right: 0,
          top: 61,
          width: 0,
          height: 135,
          borderLeft: "1px solid #FFFFFF",
          pointerEvents: "none",
        }}
      />
    </>
  );
}

/* ───────────────────────── SCROLL BAR ───────────────────────── */

// Single 4px wide orange line + thumb + 5px horizontal caps at top/bottom
function ScrollBar({ visibleCount }: { visibleCount: number }) {
  // Thumb height scales: 87/163 ≈ 53% in the Figma reference (for the full ~21 cables).
  // Approximate ratio so the thumb shrinks as more cables show.
  const rowsShown = 3;
  const rowsTotal = Math.max(1, Math.ceil(visibleCount / 3));
  const ratio = Math.min(1, rowsShown / rowsTotal);
  const thumbPct = Math.max(22, Math.min(85, ratio * 100));
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        right: 21,
        top: 30,
        width: 4,
        bottom: 30,
        pointerEvents: "none",
      }}
    >
      {/* Vertical 1px orange track line, centered in the 4px column */}
      <div
        style={{
          position: "absolute",
          left: 1.5,
          top: 0,
          bottom: 0,
          width: 0,
          borderLeft: "1px solid #F05A22",
        }}
      />
      {/* Thumb — 4px wide orange section */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: 4,
          height: `${thumbPct}%`,
          background: "#F05A22",
        }}
      />
      {/* Top cap — 10px horizontal stub */}
      <div
        style={{
          position: "absolute",
          left: -3,
          top: -1,
          width: 10,
          height: 0,
          borderTop: "1px solid #F05A22",
        }}
      />
      {/* Bottom cap */}
      <div
        style={{
          position: "absolute",
          left: -3,
          bottom: -1,
          width: 10,
          height: 0,
          borderTop: "1px solid #F05A22",
        }}
      />
    </div>
  );
}

/* ───────────────────────── FILTER BUTTONS ───────────────────────── */

// 114×23 button: active = solid orange + 2px red bottom strip + 700 weight;
//                inactive = bevel gradient + 400 weight.
// Both have 2 white corner squares (top-left, bottom-right).
function FilterButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        position: "relative",
        height: FILTER_BUTTON_HEIGHT,
        background: active
          ? "#F05A22"
          : "linear-gradient(302.51deg, #034DA1 -89.34%, rgba(3, 77, 161, 0) 54.67%), linear-gradient(122.48deg, rgba(240, 90, 34, 0.6) -38.43%, rgba(240, 90, 34, 0) 58.47%)",
        border: "0.65px solid #FFFFFF",
        color: "#FFFFFF",
        fontFamily: "var(--v1-heading)",
        fontWeight: active ? 700 : 400,
        fontSize: 13,
        lineHeight: "17px",
        textAlign: "center",
        cursor: "pointer",
        padding: 0,
        boxSizing: "border-box",
      }}
    >
      {/* Top-left corner square */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0.4,
          left: 0,
          width: 2.35,
          height: 2.35,
          background: "#FFFFFF",
        }}
      />
      {/* Bottom-right corner square */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          right: 0,
          width: 2.35,
          height: 2.35,
          background: "#FFFFFF",
        }}
      />
      {label}
      {/* Active: 2px red bottom strip */}
      {active && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -2,
            height: 2,
            background: "#ED1B2E",
          }}
        />
      )}
    </button>
  );
}

export type { CableSystem };
