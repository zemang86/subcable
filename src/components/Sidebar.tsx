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
        top: 220,
        right: 28,
        zIndex: 20,
        width: 460,
        display: "flex",
        flexDirection: "column",
        gap: 10,
      }}
    >
      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 6 }}>
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

      {/* 3×3 grid panel — scrolls vertically when >9 (resolution §H.2) */}
      <div
        className="v1-card-bevel"
        style={{
          padding: 14,
          minHeight: 254,
          maxHeight: "60vh",
          overflowY: "auto",
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
              gap: 8,
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

      {/* Count summary strip */}
      <div
        className="v1-titlebar"
        style={{
          padding: "10px 14px",
          background: "linear-gradient(180deg, transparent 0%, rgba(0, 0, 0, 0.6) 100%)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span className="v1-h-display" style={{ fontSize: 13 }}>
          {t("cableSystem")}
        </span>
        <div style={{ display: "flex", gap: 14 }}>
          <CountChip
            label={`${activeCount} ${t("active")}`}
            tone="active"
          />
          <CountChip
            label={`${inactiveCount} ${t("inactive")}`}
            tone="inactive"
            hidden={inactiveCount === 0}
          />
        </div>
      </div>
    </div>
  );
}

function CountChip({
  label,
  tone,
  hidden = false,
}: {
  label: string;
  tone: "active" | "inactive";
  hidden?: boolean;
}) {
  if (hidden) return null;
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      <StatusIndicator status={tone} pulse={tone === "active"} scale={0.7} />
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontSize: 11,
          letterSpacing: "0.08em",
          color: tone === "active" ? "var(--v1-active)" : "var(--v1-inactive)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

// Keep underscore-prefixed helper that consumers may still reference; intentionally unused now.
export type { CableSystem };
