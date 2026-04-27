"use client";

import { CableSystem } from "@/lib/types";

interface CableCardProps {
  cable: CableSystem;
  isSelected: boolean;
  onSelect: (cable: CableSystem) => void;
}

const STATUS_BADGE: Record<CableSystem["status"], { label: string; bg: string; fg: string }> = {
  active: { label: "ACTIVE", bg: "bg-[#1800E7]/20", fg: "text-white" },
  planned: { label: "PLANNED", bg: "bg-[#FF5E00]/20", fg: "text-[#FF7A00]" },
  retired: { label: "RETIRED", bg: "bg-slate-500/15", fg: "text-slate-300" },
  inactive: { label: "LEGACY", bg: "bg-slate-500/15", fg: "text-slate-300" },
};

const CLASSIFICATION_LABEL: Record<CableSystem["classification"], string> = {
  international: "INTL",
  iru: "IRU",
  domestic: "DOM",
};

export default function CableCard({ cable, isSelected, onSelect }: CableCardProps) {
  const statusBadge = STATUS_BADGE[cable.status];
  const muted = cable.status === "retired" || cable.status === "inactive";
  return (
    <button
      onClick={() => onSelect(cable)}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 min-h-[60px] ${
        isSelected
          ? "bg-[#1800E7]/15 border-[#1800E7] shadow-[0_0_20px_rgba(24,0,231,0.25)]"
          : "bg-[#0B0750]/60 border-[#1800E7]/25 active:bg-white/5"
      } ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: cable.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display text-sm font-bold text-white tracking-wide">
              {cable.shortName}
            </span>
            <span
              className={`font-display text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge.bg} ${statusBadge.fg} tracking-wider`}
            >
              {statusBadge.label}
            </span>
            <span className="font-display text-[9px] font-bold px-1.5 py-0.5 rounded bg-white/10 text-[#A8B0D6] tracking-wider">
              {CLASSIFICATION_LABEL[cable.classification]}
            </span>
          </div>
          <p className="text-xs text-[#A8B0D6] mt-1 truncate">{cable.name}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[#7A8AFF] tracking-wider font-medium tabular-nums">
            <span>{cable.length}</span>
            <span>{cable.landingPointIds.length} POINTS</span>
            {cable.buildYear && <span>RFS {cable.rfs}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
