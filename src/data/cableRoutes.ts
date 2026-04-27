import { CableRoute, CableSegment } from "@/lib/types";
import { cables } from "@/data/cables";
import { landingPointsById } from "@/data/landingPoints";
import { CABLE_GEOMETRY } from "@/data/cableGeometry";
import { greatCircle, arcDetail } from "@/lib/geo";

/**
 * Cable route topologies (fallback when no real geometry is available).
 *
 * If a cable is in CABLE_GEOMETRY (imported via scripts/import-cable-geometry.mjs)
 * we render its real polylines and ignore TOPOLOGIES entirely. Otherwise we
 * generate great-circle arcs between consecutive landing points.
 */
type Topology =
  | { kind: "linear" }
  | { kind: "ring" }
  | { kind: "explicit"; pairs: [string, string][] };

const TOPOLOGIES: Record<string, Topology> = {
  bdm: {
    kind: "explicit",
    pairs: [
      ["melaka", "batam"],
      ["melaka", "dumai"],
    ],
  },
  mct: {
    kind: "explicit",
    pairs: [
      ["cherating", "rayong"],
      ["cherating", "sihanoukville"],
    ],
  },
  skr1m: { kind: "ring" },
  bps: {
    kind: "explicit",
    pairs: [
      ["pulau-jerejak", "bayan-baru"],
      ["pulau-jerejak", "seberang-jaya"],
    ],
  },
  mdscs: { kind: "ring" },
  "stingray2-ketam": { kind: "linear" },
  cm: {
    kind: "explicit",
    pairs: [
      ["mersing", "tseung-kwan-o"],
      ["tseung-kwan-o", "shinmaruyama"],
      ["tseung-kwan-o", "okinawa"],
      ["tseung-kwan-o", "east-coast-sg"],
      ["tseung-kwan-o", "daet"],
    ],
  },
  apcn2: { kind: "ring" },
  flag: { kind: "ring" },
};

function pairsForCable(cableId: string, ids: string[]): [string, string][] {
  const topo: Topology = TOPOLOGIES[cableId] ?? { kind: "linear" };
  if (topo.kind === "explicit") return topo.pairs;
  const pairs: [string, string][] = [];
  for (let i = 0; i < ids.length - 1; i++) pairs.push([ids[i], ids[i + 1]]);
  if (topo.kind === "ring" && ids.length > 2) {
    pairs.push([ids[ids.length - 1], ids[0]]);
  }
  return pairs;
}

function segmentBetween(fromId: string, toId: string): CableSegment | null {
  const a = landingPointsById[fromId];
  const b = landingPointsById[toId];
  if (!a || !b) return null;
  const start: [number, number] = [a.lat, a.lng];
  const end: [number, number] = [b.lat, b.lng];
  return {
    fromPoint: a.city,
    toPoint: b.city,
    coords: greatCircle(start, end, arcDetail(start, end)),
  };
}

function fallbackSegments(cableId: string, ids: string[]): CableSegment[] {
  return pairsForCable(cableId, ids)
    .map(([a, b]) => segmentBetween(a, b))
    .filter((s): s is CableSegment => s !== null);
}

function realSegments(cableId: string): CableSegment[] {
  const polylines = CABLE_GEOMETRY[cableId];
  if (!polylines) return [];
  return polylines.map((coords, i) => ({
    fromPoint: `${cableId}-real-${i}`,
    toPoint: `${cableId}-real-${i}`,
    coords,
  }));
}

export const cableRoutes: CableRoute[] = cables
  .map((c) => {
    const segments = realSegments(c.id);
    if (segments.length > 0) return { cableId: c.id, segments };
    if (c.landingPointIds.length < 2) return { cableId: c.id, segments: [] };
    return { cableId: c.id, segments: fallbackSegments(c.id, c.landingPointIds) };
  })
  .filter((r) => r.segments.length > 0);
