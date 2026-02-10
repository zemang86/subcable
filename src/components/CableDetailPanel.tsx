"use client";

import { CableSystem, LandingPoint } from "@/lib/types";

interface CableDetailPanelProps {
  cable: CableSystem;
  landingPoints: LandingPoint[];
  onPointClick: (point: LandingPoint) => void;
  onClose: () => void;
}

export default function CableDetailPanel({
  cable,
  landingPoints,
  onPointClick,
  onClose,
}: CableDetailPanelProps) {
  const points = landingPoints.filter((p) =>
    cable.landingPointIds.includes(p.id)
  );

  return (
    <div className="animate-in slide-in-from-right">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: cable.color }}
          />
          <h3 className="text-base font-bold text-white tracking-wide">
            {cable.shortName}
          </h3>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#94A3B8] active:bg-white/10 text-lg"
        >
          x
        </button>
      </div>

      <p className="text-xs text-[#94A3B8] mb-4">{cable.name}</p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <div className="p-3 bg-[#0A0E1A]/60 rounded-lg border border-[#2362DD]/10">
          <div className="text-[10px] text-[#94A3B8] tracking-wider mb-1">LENGTH</div>
          <div className="text-sm font-semibold text-white">{cable.length}</div>
        </div>
        <div className="p-3 bg-[#0A0E1A]/60 rounded-lg border border-[#2362DD]/10">
          <div className="text-[10px] text-[#94A3B8] tracking-wider mb-1">RFS</div>
          <div className="text-sm font-semibold text-white">{cable.rfs}</div>
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-[#94A3B8] tracking-wider mb-2">OWNERS</div>
        <div className="flex flex-wrap gap-1.5">
          {cable.owners.map((owner) => (
            <span
              key={owner}
              className="text-[11px] px-2 py-1 bg-[#2362DD]/10 border border-[#2362DD]/20 rounded text-[#60A5FA]"
            >
              {owner}
            </span>
          ))}
        </div>
      </div>

      <div className="mb-4">
        <div className="text-[10px] text-[#94A3B8] tracking-wider mb-2">
          DESCRIPTION
        </div>
        <p className="text-xs text-[#94A3B8] leading-relaxed">
          {cable.description}
        </p>
      </div>

      <div>
        <div className="text-[10px] text-[#94A3B8] tracking-wider mb-2">
          LANDING POINTS
        </div>
        <div className="space-y-1.5">
          {points.map((point) => (
            <button
              key={point.id}
              onClick={() => onPointClick(point)}
              className="w-full flex items-center gap-3 p-3 bg-[#0A0E1A]/40 border border-[#2362DD]/10 rounded-lg text-left active:bg-white/5 min-h-[48px]"
            >
              <div className="w-2 h-2 rounded-full bg-[#60A5FA] flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-white">{point.city}</div>
                <div className="text-[10px] text-[#94A3B8]">{point.country}</div>
              </div>
              <div className="ml-auto text-[10px] text-[#94A3B8] tabular-nums">
                {point.lat.toFixed(2)}N, {point.lng.toFixed(2)}E
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
