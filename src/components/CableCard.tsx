"use client";

import { CableSystem } from "@/lib/types";

interface CableCardProps {
  cable: CableSystem;
  isSelected: boolean;
  onSelect: (cable: CableSystem) => void;
}

export default function CableCard({ cable, isSelected, onSelect }: CableCardProps) {
  return (
    <button
      onClick={() => onSelect(cable)}
      className={`w-full text-left p-4 rounded-lg border transition-all duration-200 min-h-[60px] ${
        isSelected
          ? "bg-white/10 border-white/40 shadow-[0_0_20px_rgba(255,255,255,0.1)]"
          : "bg-[#1A1F35]/60 border-[#2362DD]/20 active:bg-white/5"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-10 rounded-full flex-shrink-0 mt-0.5"
          style={{ backgroundColor: cable.color }}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-white tracking-wide">
              {cable.shortName}
            </span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-[#94A3B8] tracking-wider">
              {cable.rfs}
            </span>
          </div>
          <p className="text-xs text-[#94A3B8] mt-1 truncate">{cable.name}</p>
          <div className="flex gap-3 mt-2 text-[10px] text-[#60A5FA] tracking-wider">
            <span>{cable.length}</span>
            <span>{cable.landingPointIds.length} POINTS</span>
          </div>
        </div>
      </div>
    </button>
  );
}
