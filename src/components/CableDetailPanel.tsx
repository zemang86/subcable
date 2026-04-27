"use client";

import { CableSystem, LandingPoint } from "@/lib/types";

interface CableDetailPanelProps {
  cable: CableSystem;
  landingPoints: LandingPoint[];
  onPointClick: (point: LandingPoint) => void;
  onClose: () => void;
}

const STATUS_LABEL: Record<CableSystem["status"], string> = {
  active: "ACTIVE",
  planned: "PLANNED",
  retired: "RETIRED",
  inactive: "LEGACY",
};

const STATUS_COLOR: Record<CableSystem["status"], string> = {
  active: "text-green-400 border-green-500/40 bg-green-500/10",
  planned: "text-cyan-300 border-cyan-500/40 bg-cyan-500/10",
  retired: "text-slate-400 border-slate-500/40 bg-slate-500/10",
  inactive: "text-slate-400 border-slate-500/40 bg-slate-500/10",
};

const CLASSIFICATION_LABEL: Record<CableSystem["classification"], string> = {
  international: "International",
  iru: "IRU",
  domestic: "Domestic",
};

export default function CableDetailPanel({
  cable,
  landingPoints,
  onPointClick,
  onClose,
}: CableDetailPanelProps) {
  // Pre-filter relevant landing points; preserves the cable's defined ordering.
  const orderIndex: Record<string, number> = {};
  cable.landingPointIds.forEach((id, i) => (orderIndex[id] = i));
  const points = landingPoints
    .filter((p) => p.id in orderIndex)
    .sort((a, b) => orderIndex[a.id] - orderIndex[b.id]);

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
          <span
            className={`text-[9px] font-bold px-1.5 py-0.5 rounded border tracking-wider ${STATUS_COLOR[cable.status]}`}
          >
            {STATUS_LABEL[cable.status]}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 text-[#94A3B8] active:bg-white/10 text-lg"
        >
          x
        </button>
      </div>

      <p className="text-xs text-[#94A3B8] mb-1">{cable.name}</p>
      <p className="text-[10px] text-[#60A5FA] tracking-wider mb-4">
        {CLASSIFICATION_LABEL[cable.classification].toUpperCase()} · {cable.regions.join(" · ")}
      </p>

      <div className="grid grid-cols-2 gap-2 mb-4">
        <Stat label="LENGTH" value={cable.length} />
        <Stat label="RFS" value={cable.rfs} />
        {cable.buildYear && (
          <Stat label="BUILT" value={String(cable.buildYear)} />
        )}
        {cable.capacity && <Stat label="CAPACITY" value={cable.capacity} />}
      </div>

      {cable.routeSummary && (
        <div className="mb-4">
          <div className="text-[10px] text-[#94A3B8] tracking-wider mb-2">ROUTE</div>
          <p className="text-xs text-[#E2E8F0] leading-relaxed">
            {cable.routeSummary}
          </p>
        </div>
      )}

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
          LANDING POINTS · {points.length}
        </div>
        <div className="space-y-1.5">
          {points.map((point) => (
            <button
              key={point.id}
              onClick={() => onPointClick(point)}
              className="w-full flex items-center gap-3 p-3 bg-[#0A0E1A]/40 border border-[#2362DD]/10 rounded-lg text-left active:bg-white/5 min-h-[48px]"
            >
              <div className="w-2 h-2 rounded-full bg-[#60A5FA] flex-shrink-0" />
              <div className="min-w-0">
                <div className="text-xs font-medium text-white truncate">
                  {point.city}
                  {point.kind === "pop" && (
                    <span className="ml-1.5 text-[9px] text-cyan-400 tracking-wider">
                      PoP
                    </span>
                  )}
                </div>
                <div className="text-[10px] text-[#94A3B8]">{point.country}</div>
              </div>
              <div className="ml-auto text-[10px] text-[#94A3B8] tabular-nums whitespace-nowrap">
                {point.lat.toFixed(2)}, {point.lng.toFixed(2)}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-3 bg-[#0A0E1A]/60 rounded-lg border border-[#2362DD]/10">
      <div className="text-[10px] text-[#94A3B8] tracking-wider mb-1">{label}</div>
      <div className="text-xs font-semibold text-white leading-snug">{value}</div>
    </div>
  );
}
