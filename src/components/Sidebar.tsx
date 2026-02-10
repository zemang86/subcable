"use client";

import { useState } from "react";
import { CableSystem, LandingPoint } from "@/lib/types";
import { cables } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import CableCard from "./CableCard";
import CableDetailPanel from "./CableDetailPanel";

interface SidebarProps {
  selectedCable: CableSystem | null;
  onSelectCable: (cable: CableSystem | null) => void;
  onPointClick: (point: LandingPoint) => void;
}

export default function Sidebar({
  selectedCable,
  onSelectCable,
  onPointClick,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = cables.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.shortName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 w-[380px] flex flex-col bg-[#0A0E1A]/92 backdrop-blur-xl border-l border-[#2362DD]/20 shadow-[0_0_40px_rgba(35,98,221,0.15)]">
      {/* Header */}
      <div className="px-5 pt-20 pb-4 border-b border-[#2362DD]/15">
        <h2 className="text-xs font-bold tracking-[0.15em] text-[#60A5FA] mb-3">
          CABLE SYSTEMS
        </h2>
        <input
          type="text"
          placeholder="Search cables..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#0A0E1A]/80 border border-[#2362DD]/20 rounded-lg text-xs text-white placeholder-[#94A3B8]/50 outline-none focus:border-[#2362DD]/50 transition-colors min-h-[44px]"
        />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 touch-pan-y">
        {selectedCable ? (
          <CableDetailPanel
            cable={selectedCable}
            landingPoints={landingPoints}
            onPointClick={onPointClick}
            onClose={() => onSelectCable(null)}
          />
        ) : (
          filtered.map((cable) => (
            <CableCard
              key={cable.id}
              cable={cable}
              isSelected={false}
              onSelect={onSelectCable}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#2362DD]/15">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
          <span className="text-[10px] text-[#94A3B8] tracking-wider">
            {cables.length} SYSTEMS ACTIVE
          </span>
        </div>
      </div>
    </div>
  );
}
