"use client";

import { useMemo, useState } from "react";
import { CableSystem, Classification, LandingPoint } from "@/lib/types";
import { cables } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import CableCard from "./CableCard";
import CableDetailPanel from "./CableDetailPanel";

type Filter = "all" | Classification | "planned";

interface SidebarProps {
  selectedCable: CableSystem | null;
  onSelectCable: (cable: CableSystem | null) => void;
  onPointClick: (point: LandingPoint) => void;
}

const FILTERS: { id: Filter; label: string }[] = [
  { id: "all", label: "ALL" },
  { id: "international", label: "INTL" },
  { id: "domestic", label: "DOM" },
  { id: "iru", label: "IRU" },
  { id: "planned", label: "NEW" },
];

export default function Sidebar({
  selectedCable,
  onSelectCable,
  onPointClick,
}: SidebarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("all");

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return cables.filter((c) => {
      if (filter === "planned") {
        if (c.status !== "planned") return false;
      } else if (filter !== "all") {
        if (c.classification !== filter) return false;
        // hide planned from the classification tabs to avoid double-listing
        if (c.status === "planned") return false;
      }
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.shortName.toLowerCase().includes(q) ||
        (c.routeSummary?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [searchQuery, filter]);

  // Group by status for visual clarity inside a single filter view.
  const grouped = useMemo(() => {
    const active = filtered.filter((c) => c.status === "active");
    const planned = filtered.filter((c) => c.status === "planned");
    const retired = filtered.filter(
      (c) => c.status === "retired" || c.status === "inactive"
    );
    return { active, planned, retired };
  }, [filtered]);

  const counts = useMemo(() => {
    return {
      total: cables.length,
      active: cables.filter((c) => c.status === "active").length,
      planned: cables.filter((c) => c.status === "planned").length,
    };
  }, []);

  return (
    <div className="absolute right-0 top-0 bottom-0 z-20 w-[380px] flex flex-col bg-[#0A0E1A]/92 backdrop-blur-xl border-l border-[#2362DD]/20 shadow-[0_0_40px_rgba(35,98,221,0.15)]">
      {/* Header */}
      <div className="px-5 pt-20 pb-3 border-b border-[#2362DD]/15">
        <h2 className="text-xs font-bold tracking-[0.15em] text-[#60A5FA] mb-3">
          CABLE SYSTEMS
        </h2>
        <input
          type="text"
          placeholder="Search cables, routes, regions…"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2.5 bg-[#0A0E1A]/80 border border-[#2362DD]/20 rounded-lg text-xs text-white placeholder-[#94A3B8]/50 outline-none focus:border-[#2362DD]/50 transition-colors min-h-[44px]"
        />

        {/* Classification tabs */}
        <div className="flex gap-1 mt-3">
          {FILTERS.map((f) => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`flex-1 px-2 py-2 rounded text-[10px] font-bold tracking-wider transition-colors min-h-[36px] ${
                  active
                    ? "bg-[#2362DD]/30 text-white border border-[#2362DD]/60"
                    : "bg-white/5 text-[#94A3B8] border border-transparent active:bg-white/10"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
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
          <>
            {grouped.active.length > 0 && (
              <SectionHeader label="ACTIVE" count={grouped.active.length} />
            )}
            {grouped.active.map((cable) => (
              <CableCard
                key={cable.id}
                cable={cable}
                isSelected={false}
                onSelect={onSelectCable}
              />
            ))}

            {grouped.planned.length > 0 && (
              <SectionHeader
                label="PLANNED / IN DEVELOPMENT"
                count={grouped.planned.length}
                accent="#06B6D4"
              />
            )}
            {grouped.planned.map((cable) => (
              <CableCard
                key={cable.id}
                cable={cable}
                isSelected={false}
                onSelect={onSelectCable}
              />
            ))}

            {grouped.retired.length > 0 && (
              <SectionHeader
                label="LEGACY / INACTIVE"
                count={grouped.retired.length}
                accent="#64748B"
              />
            )}
            {grouped.retired.map((cable) => (
              <CableCard
                key={cable.id}
                cable={cable}
                isSelected={false}
                onSelect={onSelectCable}
              />
            ))}

            {filtered.length === 0 && (
              <div className="text-[11px] text-[#94A3B8] text-center py-8">
                No cables match.
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-[#2362DD]/15">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            <span className="text-[10px] text-[#94A3B8] tracking-wider">
              {counts.active} ACTIVE
            </span>
          </div>
          <span className="text-[10px] text-[#94A3B8] tracking-wider">
            {counts.planned} PLANNED · {counts.total} TOTAL
          </span>
        </div>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  count,
  accent = "#60A5FA",
}: {
  label: string;
  count: number;
  accent?: string;
}) {
  return (
    <div className="flex items-center gap-2 pt-2 pb-1">
      <div
        className="h-px flex-1"
        style={{ background: `${accent}33` }}
      />
      <span
        className="text-[9px] font-bold tracking-[0.15em]"
        style={{ color: accent }}
      >
        {label} · {count}
      </span>
      <div
        className="h-px flex-1"
        style={{ background: `${accent}33` }}
      />
    </div>
  );
}
