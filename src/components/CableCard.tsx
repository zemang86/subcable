"use client";

import { CableSystem } from "@/lib/types";
import { StatusIndicator } from "./StatusIndicator";

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

function statusVariant(status: CableSystem["status"]): "active" | "inactive" {
  return status === "active" ? "active" : "inactive";
}

// Split "20,000 km" → { value: "20,000", unit: "Km" }. Falls back to whole string.
function parseLength(len: string): { value: string; unit: string } {
  const m = len.match(/^([\d,]+)\s*([A-Za-z]+)/);
  if (!m) return { value: len, unit: "" };
  return { value: m[1], unit: m[2].charAt(0).toUpperCase() + m[2].slice(1).toLowerCase() };
}

// Split "November 2005" → { head: "RFS Nov", tail: "2005" }.
// Bare year like "2005" → { head: "RFS", tail: "2005" }.
function parseRfs(rfs: string): { head: string; tail: string } {
  const yearMatch = rfs.match(/\d{4}/);
  const year = yearMatch ? yearMatch[0] : "";
  const monthStr = year ? rfs.replace(year, "").trim() : rfs.trim();
  const monthAbbr = monthStr ? monthStr.slice(0, 3) : "";
  return { head: monthAbbr ? `RFS ${monthAbbr}` : "RFS", tail: year };
}

export default function CableCard({ cable, isSelected, onSelect }: CableCardProps) {
  const status = statusVariant(cable.status);
  const inactive = status === "inactive";
  const { value: lenValue, unit: lenUnit } = parseLength(cable.length);
  const { head: rfsHead, tail: rfsTail } = parseRfs(cable.rfs);
  const pointsCount = cable.landingPointIds.length;

  return (
    <button
      type="button"
      onClick={() => onSelect(cable)}
      className={`v1-cablecard ${isSelected ? "is-selected" : ""} ${inactive ? "is-inactive" : ""}`}
      style={{
        cursor: "pointer",
        textAlign: "left",
        minHeight: 70,
      }}
      aria-pressed={isSelected}
    >
      {/* TOP — short code + INT/DOM chip */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <span
          style={{
            fontFamily: "var(--v1-display)",
            fontWeight: 700,
            fontSize: cable.shortName.length > 10 ? 9 : 12,
            color: "var(--v1-fg)",
            letterSpacing: "0.04em",
            lineHeight: 1.1,
            flex: 1,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {cable.shortName}
        </span>
        <span
          style={{
            fontFamily: "var(--v1-pixel)",
            fontSize: 7,
            color: "var(--v1-fg)",
            padding: "1px 4px",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            flexShrink: 0,
          }}
        >
          {TYPE_CHIP[cable.classification]}
        </span>
      </div>

      {/* MID — long name */}
      <div
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 6.5,
          color: "rgba(255, 255, 255, 0.85)",
          lineHeight: 1.3,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {cable.name}
      </div>

      {/* BOT — status dot + 3 stacked metric blocks (Km / Pts / RFS year) */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: "auto",
        }}
      >
        <StatusIndicator status={status} pulse={!inactive} scale={0.55} />
        <MetricBlock head={lenValue} tail={lenUnit} />
        <MetricBlock head={String(pointsCount)} tail="Pts" />
        <MetricBlock head={rfsHead} tail={rfsTail} mono />
      </div>
    </button>
  );
}

function MetricBlock({
  head,
  tail,
  mono,
}: {
  head: string;
  tail: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        lineHeight: 1.05,
        minWidth: 0,
        flex: 1,
      }}
    >
      <span
        style={{
          fontFamily: mono ? "var(--v1-mono)" : "var(--v1-mono)",
          fontSize: 7,
          fontWeight: 500,
          color: "var(--v1-fg)",
          letterSpacing: "0.01em",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {head}
      </span>
      <span
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 6,
          color: "var(--v1-mute)",
          letterSpacing: "0.04em",
        }}
      >
        {tail}
      </span>
    </div>
  );
}
