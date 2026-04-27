"use client";

import { cables } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";

const stats = (() => {
  const intl = cables.filter(
    (c) => c.classification === "international" && c.status === "active"
  ).length;
  const dom = cables.filter(
    (c) => c.classification === "domestic" && c.status === "active"
  ).length;
  const planned = cables.filter((c) => c.status === "planned").length;
  return {
    intl,
    dom,
    planned,
    points: landingPoints.length,
  };
})();

export default function Header() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#06013A]/95 via-[#06013A]/70 to-transparent backdrop-blur-sm border-b border-[#1800E7]/25">
        <div className="pointer-events-auto flex items-center gap-3">
          {/* TM Global logo placeholder — swap with SVG when supplied. */}
          <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded">
            <span className="font-display font-black text-[#1800E7] text-xl leading-none tracking-tight">
              TM
            </span>
            <span className="font-display font-bold text-[#06013A] text-[10px] leading-none tracking-[0.2em]">
              GLOBAL
            </span>
          </div>
          <div className="h-8 w-px bg-[#1800E7]/30" />
          <div>
            <h1 className="font-display font-bold text-base tracking-[0.18em] text-white uppercase">
              Submarine Cable Network
            </h1>
            <p className="text-[10px] tracking-[0.2em] text-[#A8B0D6] mt-0.5 uppercase">
              Wholesale Connectivity · TM Global
            </p>
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <Stat label="INTL" value={stats.intl} />
          <Stat label="DOMESTIC" value={stats.dom} />
          <Stat label="PLANNED" value={stats.planned} accent="#FF5E00" />
          <Stat label="LANDING POINTS" value={stats.points} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "#FFFFFF",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="px-3 py-1.5 bg-[#06013A]/80 border border-[#1800E7]/40 rounded">
      <span className="text-[10px] tracking-wider text-[#A8B0D6] font-medium">
        {label}
      </span>
      <span
        className="ml-2 text-sm font-display font-bold tabular-nums"
        style={{ color: accent }}
      >
        {value}
      </span>
    </div>
  );
}
