"use client";

import { CableSystem } from "@/lib/types";

interface CableCardProps {
  cable: CableSystem;
  isSelected: boolean;
  onSelect: (cable: CableSystem) => void;
}

const TYPE_CHIP: Record<CableSystem["classification"], string> = {
  international: "INT",
  iru: "INT",
  domestic: "DOM",
};

// "20,000 km" → { num: "20,000", unit: "Km" }
function parseLength(len: string): string {
  const m = len.match(/^([\d,]+)\s*([A-Za-z]+)/);
  if (!m) return len;
  return `${m[1]} ${m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase()}`;
}

// "November 2005" → "RFS November 2005"; "2005" → "RFS 2005"
function formatRfs(rfs: string): string {
  return `RFS ${rfs.trim()}`;
}

export default function CableCard({ cable, isSelected, onSelect }: CableCardProps) {
  const inactive = cable.status !== "active";
  const text = isSelected ? "#034DA1" : "#FFFFFF";
  const dividerColor = isSelected ? "#034DA1" : "#FFFFFF";

  return (
    <button
      type="button"
      onClick={() => onSelect(cable)}
      className={`v1-cablecard ${isSelected ? "is-selected" : ""} ${inactive ? "is-inactive" : ""}`}
      style={{
        position: "relative",
        cursor: "pointer",
        textAlign: "left",
        minHeight: 46,
        padding: "4px 5px 3px 5px",
        display: "flex",
        flexDirection: "column",
        gap: 1,
      }}
      aria-pressed={isSelected}
    >
      {/* TOP ROW — DOM/INT chip + name (right-aligned) + status indicator (far right) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 4,
          minHeight: 6,
        }}
      >
        <DomChip type={TYPE_CHIP[cable.classification]} />
        <span
          style={{
            flex: 1,
            textAlign: "right",
            fontFamily: "var(--v1-heading)",
            fontWeight: 300,
            fontSize: 5.84,
            lineHeight: 1.2,
            color: text,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cable.name}
        </span>
        <MiniStatus inactive={inactive} />
      </div>

      {/* DIVIDER — horizontal line below the top row */}
      <div
        style={{
          height: 0,
          borderTop: `0.51px solid ${dividerColor}`,
          marginLeft: 14,
          marginRight: 0,
        }}
      />

      {/* SHORT CODE — big Rajdhani 600 */}
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontWeight: 600,
          fontSize: cable.shortName.length > 10 ? 13 : 19,
          lineHeight: 1.1,
          letterSpacing: "0.01em",
          color: text,
          marginTop: -1,
        }}
      >
        {cable.shortName}
      </span>

      {/* METRICS ROW — IBM Plex Mono 300, inline single-line "3,800 Km · 6 Points · RFS June 2017" */}
      <div
        style={{
          display: "flex",
          gap: 7,
          marginTop: "auto",
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 5,
          color: text,
          letterSpacing: "0.02em",
          whiteSpace: "nowrap",
        }}
      >
        <span>{parseLength(cable.length)}</span>
        <span>{cable.landingPointIds.length} Points</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>
          {formatRfs(cable.rfs)}
        </span>
      </div>
    </button>
  );
}

// DOM/INT chip — solid light-gray #D9D9D9 pill with cobalt #0A0449 text
function DomChip({ type }: { type: string }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#D9D9D9",
        borderRadius: 1.3,
        padding: "0.5px 2px",
        minWidth: 11.55,
        height: 5.49,
        fontFamily: "var(--v1-pixel)",
        fontSize: 3,
        fontWeight: 700,
        color: "#0A0449",
        letterSpacing: "0.04em",
        lineHeight: 1,
        flexShrink: 0,
      }}
    >
      {type}
    </span>
  );
}

// Mini concentric-ring status — matches the Figma 5.17×5.03 status indicator
function MiniStatus({ inactive }: { inactive: boolean }) {
  const accent = inactive ? "#FF3F3F" : "#8FFF3F";
  const middle = inactive ? "#642E2E" : "#3F642E";
  return (
    <span
      aria-hidden
      style={{
        position: "relative",
        width: 5.2,
        height: 5.06,
        borderRadius: "50%",
        border: `0.49px solid ${accent}`,
        boxShadow: `0 0 1.5px ${accent}`,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: "absolute",
          inset: 0.7,
          borderRadius: "50%",
          background: middle,
        }}
      />
      <span
        style={{
          position: "absolute",
          inset: 1.4,
          borderRadius: "50%",
          background: accent,
        }}
      />
    </span>
  );
}
