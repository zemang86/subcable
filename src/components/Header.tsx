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
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#0A0E1A]/95 via-[#0A0E1A]/70 to-transparent backdrop-blur-sm border-b border-[#2362DD]/20">
        <div className="pointer-events-auto">
          <h1 className="text-xl font-bold tracking-[0.1em] text-white">
            <span className="text-[#2362DD]">TM</span> SUBMARINE CABLE NETWORK
          </h1>
          <p className="text-[10px] tracking-[0.15em] text-[#94A3B8] mt-0.5">
            GLOBAL CONNECTIVITY · TELEKOM MALAYSIA
          </p>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <Stat label="INTL" value={stats.intl} />
          <Stat label="DOMESTIC" value={stats.dom} />
          <Stat label="PLANNED" value={stats.planned} accent="#06B6D4" />
          <Stat label="LANDING POINTS" value={stats.points} />
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  accent = "#60A5FA",
}: {
  label: string;
  value: number;
  accent?: string;
}) {
  return (
    <div className="px-3 py-1.5 bg-[#1A1F35]/80 border border-[#2362DD]/30 rounded">
      <span className="text-[10px] tracking-wider text-[#94A3B8]">{label}</span>
      <span className="ml-2 text-sm font-bold" style={{ color: accent }}>
        {value}
      </span>
    </div>
  );
}
