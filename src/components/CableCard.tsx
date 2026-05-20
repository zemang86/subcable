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

export default function CableCard({ cable, isSelected, onSelect }: CableCardProps) {
  const status = statusVariant(cable.status);
  const inactive = status === "inactive";
  const meta = inactive
    ? cable.length
    : `${cable.length} · ${cable.landingPointIds.length} POINTS`;

  return (
    <button
      type="button"
      onClick={() => onSelect(cable)}
      className={`v1-cablecard ${isSelected ? "is-selected" : ""} ${inactive ? "is-inactive" : ""}`}
      style={{
        cursor: "pointer",
        textAlign: "left",
        minHeight: 60,
      }}
      aria-pressed={isSelected}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 6,
        }}
      >
        <span
          className="v1-h-display"
          style={{
            fontSize: cable.shortName.length > 8 ? 9 : 11,
            color: "var(--v1-fg)",
            lineHeight: 1.1,
            flex: 1,
            wordBreak: "break-word",
          }}
        >
          {cable.shortName}
        </span>
        <span
          style={{
            fontFamily: "var(--v1-pixel)",
            fontSize: 8,
            color: "var(--v1-fg)",
            padding: "1px 5px",
            border: "1px solid rgba(255, 255, 255, 0.6)",
            flexShrink: 0,
          }}
        >
          {TYPE_CHIP[cable.classification]}
        </span>
      </div>

      <div
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 8,
          color: "rgba(255, 255, 255, 0.85)",
          lineHeight: 1.3,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {cable.name}
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginTop: "auto",
        }}
      >
        <StatusIndicator status={status} pulse={!inactive} scale={0.6} />
        <span
          style={{
            fontFamily: "var(--v1-mono)",
            fontSize: 7,
            color: "var(--v1-mute)",
          }}
        >
          {meta}
        </span>
      </div>
    </button>
  );
}
