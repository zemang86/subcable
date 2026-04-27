"use client";

import { CableSystem } from "@/lib/types";

interface CableCardProps {
  cable: CableSystem;
  isSelected: boolean;
  onSelect: (cable: CableSystem) => void;
}

const STATUS_BADGE: Record<CableSystem["status"], { label: string; bg: string; fg: string }> = {
  active: { label: "ACTIVE", bg: "bg-green-500/15", fg: "text-green-400" },
  planned: { label: "PLANNED", bg: "bg-cyan-500/15", fg: "text-cyan-300" },
  retired: { label: "RETIRED", bg: "bg-slate-500/15", fg: "text-slate-400" },
  inactive: { label: "LEGACY", bg: "bg-slate-500/15", fg: "text-slate-400" },
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
          ? "bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          : "bg-[#1A1F35]/60 border-[#2362DD]/20 active:bg-white/5"
      } ${muted ? "opacity-70" : ""}`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-12 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: cable.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-white tracking-wide">
              {cable.shortName}
            </span>
            <span
              className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${statusBadge.bg} ${statusBadge.fg} tracking-wider`}
            >
              {statusBadge.label}
            </span>
            <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#2362DD]/15 text-[#60A5FA] tracking-wider">
              {CLASSIFICATION_LABEL[cable.classification]}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 truncate">{cable.name}</p>
          <div className="flex flex-wrap gap-3 mt-2 text-[10px] text-[#60A5FA] tracking-wider">
            <span>{cable.length}</span>
            <span>{cable.landingPointIds.length} POINTS</span>
            {cable.buildYear && <span>RFS {cable.rfs}</span>}
          </div>
        </div>
      </div>
    </button>
  );
}
