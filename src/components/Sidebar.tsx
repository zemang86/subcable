"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
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
const TITLE_STRIP_HEIGHT = 47;
const FILTER_BUTTON_HEIGHT = 32;
// Panel body holds: card grid (3 rows visible) + filter row aligned to the
// bottom. 3 × 66 cards + 2 × 12 gap + 12 + 8 inner padding + 14 gap-to-filters
// + 32 filter-row + 12 bottom-padding ≈ 314. Round to 318.
const PANEL_BODY_HEIGHT = 318;

export default function Sidebar({
  selectedCable,
  onSelectCable,
  language = "en",
}: SidebarProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const t = useT(language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    thumbHeightPct: 100,
    thumbTopPct: 0,
    hasOverflow: false,
  });

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
  // Count only true "inactive" cables — "planned" cables are excluded from the
  // count per client feedback (so this reads 1, not 5).
  const inactiveCount = visible.filter((c) => c.status === "inactive").length;

  const updateScrollState = () => {
    const el = scrollRef.current;
    if (!el) return;
    const { scrollTop, scrollHeight, clientHeight } = el;
    const overflow = scrollHeight > clientHeight + 1;
    if (!overflow) {
      setScrollState({ thumbHeightPct: 100, thumbTopPct: 0, hasOverflow: false });
      return;
    }
    const thumbHeightPct = Math.max(15, (clientHeight / scrollHeight) * 100);
    const maxScroll = scrollHeight - clientHeight;
    const scrollRatio = maxScroll > 0 ? scrollTop / maxScroll : 0;
    const thumbTopPct = scrollRatio * (100 - thumbHeightPct);
    setScrollState({ thumbHeightPct, thumbTopPct, hasOverflow: true });
  };

  // Recompute on filter change (visible count changes content height)
  useLayoutEffect(() => {
    updateScrollState();
  }, [visible.length]);

  // Listen to scroll + resize so the thumb tracks live
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const handler = () => updateScrollState();
    el.addEventListener("scroll", handler, { passive: true });
    const ro = new ResizeObserver(handler);
    ro.observe(el);
    return () => {
      el.removeEventListener("scroll", handler);
      ro.disconnect();
    };
  }, []);

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

      {/* PANEL BODY — bevel gradient. Holds cards (top) + filter tabs (bottom)
          inside a single container so the gradient + frame wraps both. */}
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

        {/* Scroll container — takes the top portion of the panel, leaving room
            at the bottom for the filter row inside the same container. */}
        <div
          ref={scrollRef}
          className="v1-cable-grid-scroll"
          style={{
            position: "absolute",
            top: 12,
            bottom: 12 + FILTER_BUTTON_HEIGHT + 14,
            left: 12,
            right: 34,
            overflowY: "auto",
            overflowX: "hidden",
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
                gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                gap: 12,
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

        {/* Filter tabs row — INSIDE the panel, flush-aligned to the bottom of
            the row. Column edges align with the card grid columns above. */}
        <div
          style={{
            position: "absolute",
            left: 12,
            right: 34,
            bottom: 12,
            display: "grid",
            gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
            gap: 12,
            alignItems: "end",
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

        {/* Orange scroll bar — thumb tracks the grid scroll position live.
            Bound to the scroll container's vertical extent, not the panel,
            so it doesn't extend into the filter row area. */}
        <ScrollBar
          thumbHeightPct={scrollState.thumbHeightPct}
          thumbTopPct={scrollState.thumbTopPct}
          hasOverflow={scrollState.hasOverflow}
        />
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
      <CrossMark position="tl" />
      <CrossMark position="tr" />
      <CrossMark position="bl" />
      <CrossMark position="br" />

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

// 8×8 crosshair (+) per Figma temp/cablesystem.css Group 56/57/58/59.
// Two 2px-thick white lines crossing at the centre; the corner of the title
// strip sits exactly on the cross's centre (half inside / half outside).
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
      {/* Horizontal arm (Vector 54) */}
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
      {/* Vertical arm (Vector 55 — rotated -90deg in Figma) */}
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

// Single-SVG tactical frame from temp/systemcable.svg.
// Two bracket shapes (top + bottom) and two vertical side lines, all with
// rounded line-caps. Stretches to fill whatever panel dimensions we hand it
// via preserveAspectRatio="none".
function PanelFrame() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 455 255"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {/* Top bracket */}
      <path
        d="M0.503906 50.5V0.5H454.504V50.5"
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      {/* Bottom bracket */}
      <path
        d="M454.5 204.501L454.5 254.501L0.500004 254.501L0.499999 204.501"
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      {/* Right vertical line */}
      <path
        d="M454.5 61.5V196.5"
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
      {/* Left vertical line */}
      <path
        d="M0.503906 61.5V196.5"
        stroke="#FFFFFF"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

/* ───────────────────────── SCROLL BAR ───────────────────────── */

// Single 4px wide orange track + thumb + 10px horizontal caps at top/bottom.
// Thumb top/height are driven by the grid scroll container — fully live.
function ScrollBar({
  thumbHeightPct,
  thumbTopPct,
  hasOverflow,
}: {
  thumbHeightPct: number;
  thumbTopPct: number;
  hasOverflow: boolean;
}) {
  return (
    <div
      aria-hidden
      style={{
        position: "absolute",
        right: 21,
        top: 20,
        width: 4,
        // Stop above the filter row so the thumb only travels the card-grid extent.
        bottom: FILTER_BUTTON_HEIGHT + 22,
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
      {/* Thumb — 4px wide orange section. Only rendered when content overflows. */}
      {hasOverflow && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: `${thumbTopPct}%`,
            width: 4,
            height: `${thumbHeightPct}%`,
            background: "#F05A22",
            transition: "top 80ms linear",
          }}
        />
      )}
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

// Each column-aligned filter tab matches the width of one card column.
// Active = solid orange + 2px red bottom strip + Rajdhani 700.
// Inactive = transparent dark + 1px white border + Rajdhani 400.
// Both states: 2 white 3px corner squares (top-left + bottom-right) per Figma.
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
        background: active ? "#F05A22" : "rgba(255, 255, 255, 0.04)",
        border: "1px solid #FFFFFF",
        color: "#FFFFFF",
        fontFamily: "var(--v1-heading)",
        fontWeight: active ? 700 : 400,
        fontSize: 13,
        lineHeight: 1,
        letterSpacing: "0.12em",
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
          top: 0,
          left: 0,
          width: 3,
          height: 3,
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
          width: 3,
          height: 3,
          background: "#FFFFFF",
        }}
      />
      {label}
      {/* Active state: 2px red bottom strip sits just below the button */}
      {active && (
        <span
          aria-hidden
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            bottom: -3,
            height: 2,
            background: "#ED1B2E",
          }}
        />
      )}
    </button>
  );
}

export type { CableSystem };
