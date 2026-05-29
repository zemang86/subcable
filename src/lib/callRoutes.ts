import { cableRoutes } from "@/data/cableRoutes";
import { landingPointsById } from "@/data/landingPoints";
import { LandingPoint } from "@/lib/types";

// Single hardcoded demo route for the "Make a Call" interaction.
// APCN-2 has REAL imported geometry (4 polylines from TeleGeography), so the
// pulse traces the actual underwater cable route through SE Asia / China /
// Korea to Japan instead of a great-circle shortcut. CM was the prior choice
// but its geometry is great-circle-approximated and visually less authentic.
export const DEMO_CALL = {
  id: "MY_JP",
  cableId: "apcn2",
  fromId: "kuantan",
  toId: "kitaibaraki",
  fromLabel: "Malaysia",
  toLabel: "Japan",
  fromCity: "Kuantan",
  toCity: "Kitaibaraki",
  cableLabel: "APCN-2",
} as const;

const haversine = (a: [number, number], b: [number, number]) => {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180;
  const la2 = (b[0] * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

export interface ResolvedCallRoute {
  coords: [number, number][];
  cumKm: number[];
  totalKm: number;
  fromPoint: LandingPoint;
  toPoint: LandingPoint;
  cableId: string;
}

// Resolve the call route for an arbitrary cable + from/to landing-point pair
// (Model A: intra-cable dialling). The endpoints must both lie on the given
// cable — the caller scopes the From/To pickers to the selected cable's
// landing points, so this holds by construction. Args default to DEMO_CALL so
// the function still produces the showcase route when called bare.
//
// A cable's real geometry arrives as many DISJOINT polyline fragments (SMW4 is
// 13), and a long-haul route spans several of them in a chain. Picking a single
// "best" fragment and great-circle-bridging the remainder is wrong for these —
// the leftover collapses into a straight line across land (e.g. SMW4 Singapore
// → France used to jump straight from Mumbai to Marseille across Europe). So we
// instead STITCH the fragments into a graph and walk the shortest path from the
// From point to the To point along the actual cable.
export function resolveCallRoute(
  cableId: string = DEMO_CALL.cableId,
  fromId: string = DEMO_CALL.fromId,
  toId: string = DEMO_CALL.toId,
): ResolvedCallRoute {
  const fromPoint = landingPointsById[fromId];
  const toPoint = landingPointsById[toId];
  if (!fromPoint || !toPoint) {
    throw new Error("Call route endpoints missing from landingPoints");
  }
  const fromCoord: [number, number] = [fromPoint.lat, fromPoint.lng];
  const toCoord: [number, number] = [toPoint.lat, toPoint.lng];

  const route = cableRoutes.find((r) => r.cableId === cableId);
  const polylines = (route?.segments ?? [])
    .map((s) => s.coords)
    .filter((c) => c.length >= 2);

  // No usable geometry → fall back to a single great-circle arc.
  const body =
    stitchRoute(polylines, fromCoord, toCoord) ??
    greatCircle(fromCoord, toCoord, 48);

  const cumKm = [0];
  for (let i = 1; i < body.length; i++) {
    cumKm.push(cumKm[i - 1] + haversine(body[i - 1], body[i]));
  }

  return {
    coords: body,
    cumKm,
    totalKm: cumKm[cumKm.length - 1],
    fromPoint,
    toPoint,
    cableId,
  };
}

// Small-angle great-circle interpolation. Good enough for short bridge
// segments where we just want a smooth arc instead of a straight line.
function greatCircle(
  a: [number, number],
  b: [number, number],
  steps: number
): [number, number][] {
  const out: [number, number][] = [];
  const lat1 = (a[0] * Math.PI) / 180;
  const lng1 = (a[1] * Math.PI) / 180;
  const lat2 = (b[0] * Math.PI) / 180;
  const lng2 = (b[1] * Math.PI) / 180;
  const d =
    2 *
    Math.asin(
      Math.sqrt(
        Math.sin((lat2 - lat1) / 2) ** 2 +
          Math.cos(lat1) * Math.cos(lat2) * Math.sin((lng2 - lng1) / 2) ** 2
      )
    );
  if (d < 1e-9) return [a, b];
  for (let i = 0; i <= steps; i++) {
    const f = i / steps;
    const A = Math.sin((1 - f) * d) / Math.sin(d);
    const B = Math.sin(f * d) / Math.sin(d);
    const x = A * Math.cos(lat1) * Math.cos(lng1) + B * Math.cos(lat2) * Math.cos(lng2);
    const y = A * Math.cos(lat1) * Math.sin(lng1) + B * Math.cos(lat2) * Math.sin(lng2);
    const z = A * Math.sin(lat1) + B * Math.sin(lat2);
    const lat = Math.atan2(z, Math.sqrt(x * x + y * y));
    const lng = Math.atan2(y, x);
    out.push([(lat * 180) / Math.PI, (lng * 180) / Math.PI]);
  }
  return out;
}

// Max gap (km) across which two fragment vertices are treated as the same
// junction and stitched together. Real cable fragments meet at landing
// stations / branching units with near-coincident vertices; 150km comfortably
// bridges those joins without inventing shortcuts between unrelated stubs.
const STITCH_SNAP_KM = 150;
// Any single hop longer than this in the final path is re-sampled as a
// great-circle arc so long ocean stretches (and small bridges) curve with the
// globe instead of cutting a flat chord.
const DENSIFY_OVER_KM = 200;

// Build a graph over every fragment vertex (intra-fragment edges along each
// polyline, plus near-coincident vertices of different fragments joined as
// junctions), attach the from/to points to their single nearest vertex, and
// return the Dijkstra shortest path from→to as a coordinate list. Returns null
// when there is no geometry or the endpoints can't be connected, so the caller
// can fall back to a plain great-circle arc.
function stitchRoute(
  polylines: [number, number][][],
  from: [number, number],
  to: [number, number],
): [number, number][] | null {
  if (polylines.length === 0) return null;

  // Flatten all vertices into a single node list; remember each polyline's
  // node indices so we can wire intra-fragment edges.
  const nodes: [number, number][] = [];
  const polyNodes: number[][] = [];
  for (const coords of polylines) {
    const ids: number[] = [];
    for (const c of coords) {
      ids.push(nodes.length);
      nodes.push(c);
    }
    polyNodes.push(ids);
  }
  const FROM = nodes.length;
  nodes.push(from);
  const TO = nodes.length;
  nodes.push(to);

  const adj: Array<Array<[number, number]>> = nodes.map(() => []);
  const addEdge = (a: number, b: number, w: number) => {
    adj[a].push([b, w]);
    adj[b].push([a, w]);
  };

  // Intra-fragment edges (consecutive vertices).
  for (let p = 0; p < polylines.length; p++) {
    const coords = polylines[p];
    for (let v = 0; v + 1 < coords.length; v++) {
      addEdge(polyNodes[p][v], polyNodes[p][v + 1], haversine(coords[v], coords[v + 1]));
    }
  }

  // Junction edges between near-coincident vertices of DIFFERENT fragments.
  for (let p = 0; p < polylines.length; p++) {
    for (let v = 0; v < polylines[p].length; v++) {
      for (let q = p + 1; q < polylines.length; q++) {
        for (let w = 0; w < polylines[q].length; w++) {
          const gap = haversine(polylines[p][v], polylines[q][w]);
          if (gap <= STITCH_SNAP_KM) {
            addEdge(polyNodes[p][v], polyNodes[q][w], gap);
          }
        }
      }
    }
  }

  // Attach from/to to their single nearest vertex only. Connecting to more
  // than one vertex would hand Dijkstra long straight terminal edges to use as
  // shortcuts (it would skip the cable entirely).
  const nearestVertex = (pt: [number, number]): [number, number] => {
    let best = -1;
    let bestD = Infinity;
    for (let n = 0; n < nodes.length - 2; n++) {
      const d = haversine(pt, nodes[n]);
      if (d < bestD) {
        bestD = d;
        best = n;
      }
    }
    return [best, bestD];
  };
  const [fNode, fGap] = nearestVertex(from);
  const [tNode, tGap] = nearestVertex(to);
  if (fNode < 0 || tNode < 0) return null;
  addEdge(FROM, fNode, fGap);
  addEdge(TO, tNode, tGap);

  // Dijkstra (linear scan — fine for the few hundred vertices a cable has).
  const dist = nodes.map(() => Infinity);
  const prev = nodes.map(() => -1);
  const done = nodes.map(() => false);
  dist[FROM] = 0;
  for (;;) {
    let u = -1;
    let bestD = Infinity;
    for (let n = 0; n < nodes.length; n++) {
      if (!done[n] && dist[n] < bestD) {
        bestD = dist[n];
        u = n;
      }
    }
    if (u === -1 || u === TO) break;
    done[u] = true;
    for (const [v, w] of adj[u]) {
      if (dist[u] + w < dist[v]) {
        dist[v] = dist[u] + w;
        prev[v] = u;
      }
    }
  }
  if (prev[TO] === -1) return null;

  // Reconstruct from→to.
  const path: number[] = [];
  for (let cur = TO; cur !== -1; cur = prev[cur]) path.push(cur);
  path.reverse();
  const raw = path.map((n) => nodes[n]);

  // Smooth long hops (junction bridges, terminal gaps, coarse ocean spans)
  // into great-circle arcs so nothing renders as a flat chord across the globe.
  const out: [number, number][] = [raw[0]];
  for (let i = 1; i < raw.length; i++) {
    const a = raw[i - 1];
    const b = raw[i];
    const gap = haversine(a, b);
    if (gap > DENSIFY_OVER_KM) {
      const steps = Math.min(48, Math.max(2, Math.round(gap / 100)));
      const arc = greatCircle(a, b, steps);
      out.push(...arc.slice(1));
    } else {
      out.push(b);
    }
  }
  return out;
}
