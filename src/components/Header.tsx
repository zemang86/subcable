"use client";

import { cables } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";

export default function Header() {
  return (
    <div className="absolute top-0 left-0 right-0 z-10 pointer-events-none">
      <div className="flex items-center justify-between px-6 py-4 bg-gradient-to-b from-[#0A0E1A]/95 via-[#0A0E1A]/70 to-transparent backdrop-blur-sm border-b border-[#2362DD]/20">
        <div className="pointer-events-auto">
          <h1 className="text-xl font-bold tracking-[0.1em] text-white">
            <span className="text-[#2362DD]">TM</span> SUBMARINE CABLE NETWORK
          </h1>
          <p className="text-[10px] tracking-[0.15em] text-[#94A3B8] mt-0.5">
            PROOF OF CONCEPT VISUALIZATION
          </p>
        </div>

        <div className="flex gap-4 pointer-events-auto">
          <div className="px-3 py-1.5 bg-[#1A1F35]/80 border border-[#2362DD]/30 rounded">
            <span className="text-[10px] tracking-wider text-[#94A3B8]">CABLES</span>
            <span className="ml-2 text-sm font-bold text-[#60A5FA]">{cables.length}</span>
          </div>
          <div className="px-3 py-1.5 bg-[#1A1F35]/80 border border-[#2362DD]/30 rounded">
            <span className="text-[10px] tracking-wider text-[#94A3B8]">LANDING POINTS</span>
            <span className="ml-2 text-sm font-bold text-[#60A5FA]">{landingPoints.length}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
