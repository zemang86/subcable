import { CableRoute, CableSegment } from "@/lib/types";
import { cables } from "@/data/cables";
import { landingPointsById } from "@/data/landingPoints";
import { greatCircle, arcDetail } from "@/lib/geo";

/**
 * Cable route topologies.
 *
 * Most cables are linear chains (LP1 → LP2 → ... → LPn) where each pair gets
 * one great-circle segment. Cables with a branching unit (BDM, MCT) need an
 * explicit list of segments so the branches render correctly.
 *
 * If a cable id isn't listed here, we default to chaining its
 * `landingPointIds` order from cables.ts.
 */
type Topology =
  | { kind: "linear" } // pair up consecutive landingPointIds
  | { kind: "ring" } // linear + close back to the first point
  | { kind: "explicit"; pairs: [string, string][] }; // explicit edges

const TOPOLOGIES: Record<string, Topology> = {
  // BDM branches from Melaka into both Batam and Dumai.
  bdm: {
    kind: "explicit",
    pairs: [
      ["melaka", "batam"],
      ["melaka", "dumai"],
    ],
  },
  // MCT has a Y-junction near the Gulf of Thailand.
  mct: {
    kind: "explicit",
    pairs: [
      ["cherating", "rayong"],
      ["cherating", "sihanoukville"],
    ],
  },
  // SKR1M closes the loop back from Kota Kinabalu to Cherating.
  skr1m: { kind: "ring" },
  // BPS is a hub-and-spoke from Pulau Jerejak.
  bps: {
    kind: "explicit",
    pairs: [
      ["pulau-jerejak", "bayan-baru"],
      ["pulau-jerejak", "seberang-jaya"],
    ],
  },
  // MDSCS loops the country: peninsular ↔ Sarawak ↔ Sabah.
  mdscs: { kind: "ring" },
  // Stingray II Ketam: Jeram → Sg Lima → Pulau Ketam (linear chain).
  "stingray2-ketam": { kind: "linear" },
  // CM trunk + ASE branches diverge at Hong Kong / Singapore — model as star.
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
  // APCN-2 is a ring; trace as a loop.
  apcn2: { kind: "ring" },
  // FLAG is also a globe-circling ring.
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

export const cableRoutes: CableRoute[] = cables
  .filter((c) => c.landingPointIds.length >= 2)
  .map((c) => ({
    cableId: c.id,
    segments: pairsForCable(c.id, c.landingPointIds)
      .map(([a, b]) => segmentBetween(a, b))
      .filter((s): s is CableSegment => s !== null),
  }))
  .filter((r) => r.segments.length > 0);
