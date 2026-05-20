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
        minHeight: 66,
        minWidth: 0,
        padding: "7px 9px 6px 9px",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        overflow: "hidden",
      }}
      aria-pressed={isSelected}
    >
      {/* TOP ROW — DOM/INT chip + name (right-aligned, with auto-sized
          divider beneath it that scales with the text length) + status. */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 4,
          minHeight: 6,
        }}
      >
        <DomChip type={TYPE_CHIP[cable.classification]} isSelected={isSelected} />
        {/* Right-aligned container so the subtitle hugs the right side;
            the span is inline-block so it sizes to its TEXT, not flex:1,
            which lets the border-bottom (= the divider) shrink/grow with name length. */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            textAlign: "right",
            lineHeight: 1,
          }}
        >
          <span
            style={{
              display: "inline-block",
              maxWidth: "100%",
              fontFamily: "var(--v1-heading)",
              fontWeight: 300,
              fontSize: 7,
              lineHeight: 1.25,
              color: text,
              borderBottom: `0.51px solid ${dividerColor}`,
              paddingBottom: 1.5,
              paddingRight: 5,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              verticalAlign: "top",
            }}
          >
            {cable.name}
          </span>
        </div>
        <MiniStatus inactive={inactive} />
      </div>

      {/* SHORT CODE — big Rajdhani 600 */}
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontWeight: 600,
          fontSize: cable.shortName.length > 10 ? 13 : 20,
          lineHeight: 1.1,
          letterSpacing: "0.01em",
          color: text,
          marginTop: 0,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {cable.shortName}
      </span>

      {/* METRICS ROW — IBM Plex Mono 300, inline single-line "3,800 Km · 6 Points · RFS June 2017" */}
      <div
        style={{
          display: "flex",
          gap: 6,
          marginTop: "auto",
          fontFamily: "var(--v1-mono)",
          fontWeight: 300,
          fontSize: 6.5,
          color: text,
          letterSpacing: "0.01em",
          whiteSpace: "nowrap",
          overflow: "hidden",
          minWidth: 0,
        }}
      >
        <span style={{ flexShrink: 0 }}>{parseLength(cable.length)}</span>
        <span style={{ flexShrink: 0 }}>{cable.landingPointIds.length} Points</span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", minWidth: 0 }}>
          {formatRfs(cable.rfs)}
        </span>
      </div>
    </button>
  );
}

// DOM/INT chip — solid light-gray #D9D9D9 pill with cobalt #0A0449 text.
// Selected cards get a marginally wider chip (11.55 vs 10.57 in Figma) and
// sit 0.64px lower to match the temp/cablecards-active.css offset.
function DomChip({ type, isSelected }: { type: string; isSelected: boolean }) {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#D9D9D9",
        borderRadius: 1.3,
        padding: "0.5px 2px",
        minWidth: isSelected ? 13 : 12,
        height: 6,
        marginTop: isSelected ? 0.6 : 0,
        fontFamily: "var(--v1-pixel)",
        fontSize: 3.3,
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
