"use client";

import { useMemo, useState } from "react";
import { cables } from "@/data/cables";
import type { CableSystem, Filter, LandingPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";
import CableCard from "./CableCard";
import { StatusIndicator } from "./StatusIndicator";

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

// Panel width per Figma V1.3 (screenshots/cable-system-v3.png), node 335:298.
const PANEL_WIDTH = 454;

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
        gap: 8,
      }}
    >
      {/* TOP — title strip with 4 crosshair (+) corner markers, black bg, count chips right-aligned */}
      <TitleStrip
        title={t("cableSystem")}
        activeCount={activeCount}
        activeLabel={t("active")}
        inactiveCount={inactiveCount}
        inactiveLabel={t("inactive")}
      />

      {/* MIDDLE — 3×N grid panel with bevel gradient + scroll thumb on right edge */}
      <div
        className="v1-card-bevel"
        style={{
          padding: 12,
          height: 270,
          display: "grid",
          gridTemplateColumns: "1fr 6px",
          gap: 10,
        }}
      >
        <div
          style={{
            minWidth: 0,
            overflowY: "auto",
            scrollbarWidth: "none",
          }}
          className="v1-cable-grid-scroll"
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
                gap: 7,
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

        {/* Scroll indicator track + orange thumb (visual only — content scrolls
            independently). 38% thumb height + 6% top inset per V3 spec. */}
        <ScrollIndicator visibleCount={visible.length} rowsShown={3} />
      </div>

      {/* BOTTOM — filter tabs as a 3-col grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 6,
        }}
      >
        {FILTERS.map((f) => {
          const active = filter === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => setFilter(f.id)}
              className={`v1-filter-tab ${active ? "is-active" : ""}`}
            >
              {t(f.key).toUpperCase()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

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
        padding: "12px 18px",
        background: "#000000",
        border: "1px solid rgba(255, 255, 255, 0.10)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <CrossMark position="tl" />
      <CrossMark position="tr" />
      <CrossMark position="bl" />
      <CrossMark position="br" />

      <span
        className="v1-h-display"
        style={{
          fontSize: 18,
          fontFamily: "var(--v1-display)",
          fontWeight: 700,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
        }}
      >
        {title}
      </span>
      <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
        <CountChip n={activeCount} label={activeLabel} tone="active" />
        {inactiveCount > 0 && (
          <CountChip n={inactiveCount} label={inactiveLabel} tone="inactive" />
        )}
      </div>
    </div>
  );
}

function CrossMark({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const base = {
    position: "absolute" as const,
    width: 14,
    height: 14,
    pointerEvents: "none" as const,
  };
  const offsets = {
    tl: { top: -7, left: -7 },
    tr: { top: -7, right: -7 },
    bl: { bottom: -7, left: -7 },
    br: { bottom: -7, right: -7 },
  };
  return (
    <span aria-hidden style={{ ...base, ...offsets[position] }}>
      {/* vertical arm */}
      <span
        style={{
          position: "absolute",
          left: "50%",
          top: 0,
          width: 1.2,
          height: 14,
          transform: "translateX(-50%)",
          background: "rgba(255, 255, 255, 0.85)",
        }}
      />
      {/* horizontal arm */}
      <span
        style={{
          position: "absolute",
          top: "50%",
          left: 0,
          width: 14,
          height: 1.2,
          transform: "translateY(-50%)",
          background: "rgba(255, 255, 255, 0.85)",
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
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      <StatusIndicator status={tone} pulse={tone === "active"} scale={0.95} />
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontSize: 13,
          letterSpacing: "0.08em",
          color: tone === "active" ? "var(--v1-active)" : "var(--v1-inactive)",
        }}
      >
        {n} {label}
      </span>
    </div>
  );
}

function ScrollIndicator({
  visibleCount,
  rowsShown,
}: {
  visibleCount: number;
  rowsShown: number;
}) {
  // Thumb size scales inversely with overflow — capped between 22% and 88%.
  const rowsTotal = Math.max(1, Math.ceil(visibleCount / 3));
  const ratio = Math.min(1, rowsShown / rowsTotal);
  const thumbPct = Math.max(22, Math.min(88, ratio * 100));
  return (
    <div
      aria-hidden
      style={{
        width: 4,
        alignSelf: "stretch",
        background: "rgba(255, 255, 255, 0.12)",
        position: "relative",
      }}
    >
      <div
        style={{
          position: "absolute",
          left: 0,
          top: "6%",
          width: 4,
          height: `${thumbPct}%`,
          background: "var(--v1-orange)",
        }}
      />
    </div>
  );
}

// Keep underscore-prefixed helper that consumers may still reference; intentionally unused now.
export type { CableSystem };
