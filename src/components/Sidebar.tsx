"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { cables } from "@/data/cables";
import type { CableSystem, Filter, LandingPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import { useScramble } from "@/lib/useScramble";
import CableCard from "./CableCard";

interface SidebarProps {
  selectedCable: CableSystem | null;
  onSelectCable: (cable: CableSystem | null) => void;
  /** Kept for legacy compatibility with GlobeScene; unused inside the v1 CableSystem panel. */
  onPointClick?: (point: LandingPoint) => void;
  language?: Language;
  className?: string;
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
  className,
}: SidebarProps) {
  const [filter, setFilter] = useState<Filter>("all");
  const t = useT(language);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollState, setScrollState] = useState({
    thumbHeightPct: 100,
    thumbTopPct: 0,
    hasOverflow: false,
  });
  // Drag-to-scroll on the card grid itself (the kiosk root sets
  // touch-action:none, so native pan never fires — same pattern as the Morse
  // picker sheet). A drag that moves >8px swallows the click it would
  // otherwise land on, so scrolling never accidentally selects a card.
  const gridDragRef = useRef<{ y: number; top: number; moved: boolean } | null>(
    null,
  );
  const suppressCardClickRef = useRef(false);

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
      className={className}
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
          onPointerDown={(e) => {
            gridDragRef.current = {
              y: e.clientY,
              top: scrollRef.current?.scrollTop ?? 0,
              moved: false,
            };
          }}
          onPointerMove={(e) => {
            const d = gridDragRef.current;
            const el = scrollRef.current;
            if (!d || !el) return;
            const dy = e.clientY - d.y;
            if (Math.abs(dy) > 8) d.moved = true;
            el.scrollTop = d.top - dy;
          }}
          onPointerUp={() => {
            suppressCardClickRef.current = gridDragRef.current?.moved ?? false;
            gridDragRef.current = null;
          }}
          onPointerCancel={() => {
            gridDragRef.current = null;
          }}
          onClickCapture={(e) => {
            // A scroll-drag ends in a click on whichever card the finger
            // lifted over — swallow it before it reaches the card.
            if (suppressCardClickRef.current) {
              suppressCardClickRef.current = false;
              e.stopPropagation();
              e.preventDefault();
            }
          }}
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

        {/* Orange scroll bar — thumb tracks the grid scroll position live and
            is draggable (pointer/touch) to scroll. Bound to the scroll
            container's vertical extent, not the panel, so it doesn't extend
            into the filter row area. */}
        <ScrollBar
          scrollRef={scrollRef}
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
  const display = useScramble(title);
  return (
    <div
      style={{
        position: "relative",
        width: PANEL_WIDTH,
        height: TITLE_STRIP_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 14px",
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
          fontStyle: "normal",
          fontWeight: 600,
          fontSize: 26,
          lineHeight: "34px",
          color: "#FFFFFF",
        }}
      >
        {display}
      </span>

      <div style={{ position: "relative", display: "flex", gap: 22, alignItems: "center" }}>
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
      className="v7-mat-cross"
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

// Single 8px wide orange track + thumb + horizontal caps at top/bottom.
// Thumb top/height are driven by the grid scroll container — fully live.
// The thumb is draggable (pointer + touch) and the track is tap-to-jump.
function ScrollBar({
  scrollRef,
  thumbHeightPct,
  thumbTopPct,
  hasOverflow,
}: {
  scrollRef: React.RefObject<HTMLDivElement | null>;
  thumbHeightPct: number;
  thumbTopPct: number;
  hasOverflow: boolean;
}) {
  const trackRef = useRef<HTMLDivElement>(null);
  // True while a drag is in progress (held in a ref so move handlers see it live).
  const dragging = useRef(false);

  // Absolute-position model: map the pointer's Y within the bar straight to a
  // scroll position, with the thumb centred on the finger and clamped to the
  // ends. The whole bar is the drag target, so a thin thumb is easy to grab.
  const scrollToPointer = (clientY: number) => {
    const el = scrollRef.current;
    const bar = trackRef.current;
    if (!el || !bar) return;
    const rect = bar.getBoundingClientRect();
    const maxScroll = el.scrollHeight - el.clientHeight;
    if (maxScroll <= 0) return;
    // Rendered thumb height (respects the 24px minimum) → leftover travel range.
    const thumbPx = Math.max(24, (thumbHeightPct / 100) * rect.height);
    const movable = Math.max(1, rect.height - thumbPx);
    const ratio = (clientY - rect.top - thumbPx / 2) / movable;
    el.scrollTop = Math.max(0, Math.min(ratio, 1)) * maxScroll;
  };

  const onPointerDown = (e: React.PointerEvent) => {
    if (!hasOverflow) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    scrollToPointer(e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    scrollToPointer(e.clientY);
  };

  const endDrag = (e: React.PointerEvent) => {
    if (!dragging.current) return;
    e.currentTarget.releasePointerCapture?.(e.pointerId);
    dragging.current = false;
  };

  return (
    <div
      ref={trackRef}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      style={{
        // Wide transparent hit area filling the FULL 34px right gutter (left
        // edge flush with the card grid — any wider would steal taps from the
        // right card column) so the thin visual bar is easy to grab on touch.
        // The visual track/thumb/caps are right-anchored at their original
        // panel position. The card grid itself is also drag-scrollable, so
        // this bar is a secondary control.
        position: "absolute",
        right: 0,
        top: 20,
        width: 34,
        // Stop above the filter row so the thumb only travels the card-grid extent.
        bottom: FILTER_BUTTON_HEIGHT + 22,
        pointerEvents: hasOverflow ? "auto" : "none",
        cursor: hasOverflow ? "pointer" : "default",
        touchAction: "none",
      }}
    >
      {/* Faint orange track — 8px, right-anchored within the hit area */}
      <div
        style={{
          position: "absolute",
          right: 19,
          width: 8,
          top: 0,
          bottom: 0,
          background: "rgba(240, 90, 34, 0.2)",
          pointerEvents: "none",
        }}
      />
      {/* Thumb — 8px wide orange section. Only rendered when content overflows. */}
      {hasOverflow && (
        <div
          style={{
            position: "absolute",
            right: 19,
            top: `${thumbTopPct}%`,
            width: 8,
            height: `${thumbHeightPct}%`,
            minHeight: 24,
            background: "#F05A22",
            transition: dragging.current ? "none" : "top 80ms linear",
            pointerEvents: "none",
          }}
        />
      )}
      {/* Top cap — horizontal stub */}
      <div
        style={{
          position: "absolute",
          right: 16,
          width: 14,
          top: -1,
          height: 0,
          borderTop: "1px solid #F05A22",
          pointerEvents: "none",
        }}
      />
      {/* Bottom cap */}
      <div
        style={{
          position: "absolute",
          right: 16,
          width: 14,
          bottom: -1,
          height: 0,
          borderTop: "1px solid #F05A22",
          pointerEvents: "none",
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
      className="v1-pressable"
      style={{
        position: "relative",
        // Visual height stays 32px (Figma); the invisible hit-extension span
        // below grows the touch target to the 48px project minimum.
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
      {/* Invisible hit-area extension — ±8px vertically takes the 32px visual
          to a 48px touch target. Taps on it bubble to the button. The 14px gap
          to the scroll container above and the 12px panel inset below mean it
          overlaps nothing. */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: -8,
          bottom: -8,
          left: 0,
          right: 0,
        }}
      />
    </button>
  );
}

export type { CableSystem };
