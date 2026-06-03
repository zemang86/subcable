import { cableRoutes } from "@/data/cableRoutes";
import { cables } from "@/data/cables";
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

// ─────────────────────── CROSS-NETWORK ROUTING (Model B) ───────────────────────
//
// A call may run between any two landing points in the whole network. We model
// the network as a graph whose NODES are landing points and whose EDGES are of
// two kinds:
//
//   • CABLE edges — consecutive stations along ONE cable (a topological chain,
//     weighted by the real along-cable distance). Travelling a cable from any
//     entry to any exit walks these and renders the cable's true geometry.
//   • TELEPORT edges — two stations IN THE SAME COUNTRY that share no cable.
//     This is the cross-network hand-off: when a cable reaches a country that
//     another cable also lands in, the signal "teleports" to that other cable
//     instead of detouring thousands of km to a physically shared splice point.
//     Weighted by the short within-country jump distance plus a small penalty
//     so the router doesn't teleport gratuitously when a cable would do.
//
// Dijkstra over this graph gives the shortest hop chain. We then collapse runs
// of same-cable hops into single cable legs (rendered entry→exit, no back and
// forth) and emit teleport legs between them — see resolveNetworkRoute.

// Added to every teleport edge's weight. Keeps the router from chaining lots of
// tiny country-hub hops when staying on one cable is barely longer — tuned so a
// hand-off only happens when it meaningfully shortens the route (e.g. a cable
// that would otherwise detour thousands of km), not for marginal gains.
const TELEPORT_PENALTY_KM = 500;

interface GraphEdge {
  to: string;
  weightKm: number;
  cableId: string; // "" for teleport edges
  kind: "cable" | "teleport";
}

let _graph: Map<string, GraphEdge[]> | null = null;

// Build (once) the landing-point graph used for cross-network routing.
//
// A submarine cable is a LINE of stations, not a clique. We chain each cable's
// stations in geographic order and connect only CONSECUTIVE stations. Because
// adjacent stations sit close together, a straight-line (haversine) weight is a
// faithful proxy for the along-cable distance between them — and it keeps the
// build cheap (the expensive real-geometry stitch happens only for the handful
// of legs the chosen route actually renders, in resolveNetworkRoute). The old
// "flew everywhere" zig-zag came from haversine on LONG all-pairs edges; here we
// only ever weight SHORT consecutive edges, so the proxy holds.
function getNetworkGraph(): Map<string, GraphEdge[]> {
  if (_graph) return _graph;
  const g = new Map<string, GraphEdge[]>();
  const addEdge = (
    a: string,
    b: string,
    w: number,
    cableId: string,
    kind: "cable" | "teleport",
  ) => {
    let list = g.get(a);
    if (!list) {
      list = [];
      g.set(a, list);
    }
    list.push({ to: b, weightKm: w, cableId, kind });
  };
  const co = (id: string): [number, number] => [
    landingPointsById[id].lat,
    landingPointsById[id].lng,
  ];
  for (const cable of cables) {
    const ids = cable.landingPointIds.filter((id) => landingPointsById[id]);
    if (ids.length < 2) continue;

    // Double-sweep: from an arbitrary anchor, find the farthest station — that
    // is a true end of the line. Ordering by distance from a MIDDLE station
    // would tie the two sides of the cable together and scramble the chain.
    const anchor = ids[0];
    let end = anchor;
    let endD = -1;
    for (const id of ids) {
      if (id === anchor) continue;
      const d = haversine(co(anchor), co(id));
      if (d > endD) {
        endD = d;
        end = id;
      }
    }
    const ordered = ids
      .map((id) => ({ id, d: id === end ? 0 : haversine(co(end), co(id)) }))
      .sort((p, q) => p.d - q.d)
      .map((p) => p.id);

    // Consecutive stations only; weight = straight-line distance (good proxy
    // for adjacent stations). Real geometry is drawn later, per chosen leg.
    for (let i = 0; i + 1 < ordered.length; i++) {
      const a = ordered[i];
      const b = ordered[i + 1];
      const w = haversine(co(a), co(b));
      addEdge(a, b, w, cable.id, "cable");
      addEdge(b, a, w, cable.id, "cable");
    }
  }

  // ── Teleport edges ── group all graph nodes (cable stations) by country, then
  // connect every same-country pair that shares NO cable. This is the country-
  // hub hand-off: a cable reaching a country can jump to any OTHER cable landing
  // in that country without a physical splice. Weight is the short within-
  // country jump distance (+ penalty), so the router prefers a local hand-off
  // over a long cable detour. Endpoints are existing nodes only (a teleport into
  // a dead-end station you can't travel onward from is useless).
  const byCountry = new Map<string, string[]>();
  for (const id of g.keys()) {
    const lp = landingPointsById[id];
    if (!lp) continue;
    let arr = byCountry.get(lp.country);
    if (!arr) {
      arr = [];
      byCountry.set(lp.country, arr);
    }
    arr.push(id);
  }
  for (const ids of byCountry.values()) {
    for (let i = 0; i < ids.length; i++) {
      for (let j = i + 1; j < ids.length; j++) {
        const a = landingPointsById[ids[i]];
        const b = landingPointsById[ids[j]];
        // Skip if a real cable already connects them — travel it, don't teleport.
        if (a.cableIds.some((c) => b.cableIds.includes(c))) continue;
        const w =
          haversine([a.lat, a.lng], [b.lat, b.lng]) + TELEPORT_PENALTY_KM;
        addEdge(ids[i], ids[j], w, "", "teleport");
        addEdge(ids[j], ids[i], w, "", "teleport");
      }
    }
  }

  _graph = g;
  return g;
}

// Every landing point reachable from `fromId` through the real cable network
// (BFS over the topological graph). The Morse "To" pickers use this to offer
// ONLY destinations that genuinely have a cable path — no dead-end picks that
// would silently fall back to a straight great-circle line.
export function reachableFrom(fromId: string): Set<string> {
  const g = getNetworkGraph();
  const seen = new Set<string>([fromId]);
  if (!g.has(fromId)) return seen;
  const stack = [fromId];
  while (stack.length > 0) {
    const u = stack.pop() as string;
    for (const e of g.get(u) ?? []) {
      if (!seen.has(e.to)) {
        seen.add(e.to);
        stack.push(e.to);
      }
    }
  }
  return seen;
}

interface RouteHop {
  fromId: string;
  toId: string;
  cableId: string;
  kind: "cable" | "teleport";
}

// Dijkstra from→to over the landing-point graph. Returns the hop sequence (each
// tagged with the cable that carries it, or marked as a teleport), or null if
// the two points can't be connected through the network.
function shortestHops(fromId: string, toId: string): RouteHop[] | null {
  if (fromId === toId) return [];
  const g = getNetworkGraph();
  if (!g.has(fromId) || !g.has(toId)) return null;

  const dist = new Map<string, number>();
  const prev = new Map<
    string,
    { node: string; cableId: string; kind: "cable" | "teleport" }
  >();
  const visited = new Set<string>();
  dist.set(fromId, 0);

  for (;;) {
    // Pick the unvisited node with the smallest tentative distance (linear
    // scan — the graph has ~100 nodes, so this is plenty fast).
    let u: string | null = null;
    let best = Infinity;
    for (const [node, d] of dist) {
      if (!visited.has(node) && d < best) {
        best = d;
        u = node;
      }
    }
    if (u === null || u === toId) break;
    visited.add(u);
    for (const e of g.get(u) ?? []) {
      if (visited.has(e.to)) continue;
      const nd = (dist.get(u) ?? Infinity) + e.weightKm;
      if (nd < (dist.get(e.to) ?? Infinity)) {
        dist.set(e.to, nd);
        prev.set(e.to, { node: u, cableId: e.cableId, kind: e.kind });
      }
    }
  }

  if (!prev.has(toId)) return null;
  const hops: RouteHop[] = [];
  let cur = toId;
  while (cur !== fromId) {
    const p = prev.get(cur);
    if (!p) return null;
    hops.push({ fromId: p.node, toId: cur, cableId: p.cableId, kind: p.kind });
    cur = p.node;
  }
  hops.reverse();
  return hops;
}

// One leg of a resolved cross-network call. A CABLE leg is travelled along its
// cable's real geometry (entry → exit, shortest path, no back-and-forth). A
// TELEPORT leg is the country-hub hand-off jump between two cables.
export type RouteLeg =
  | { kind: "cable"; cableId: string; coords: [number, number][]; km: number }
  | {
      kind: "teleport";
      fromId: string;
      toId: string;
      from: [number, number];
      to: [number, number];
      km: number;
    };

export interface ResolvedNetworkRoute {
  legs: RouteLeg[];
  cableIds: string[]; // unique cables the call rides (for highlighting)
  totalCableKm: number; // sum of cable-leg distances (paces the pulse)
  fromPoint: LandingPoint;
  toPoint: LandingPoint;
}

const pathKm = (coords: [number, number][]) => {
  let k = 0;
  for (let i = 1; i < coords.length; i++) k += haversine(coords[i - 1], coords[i]);
  return k;
};

// Resolve a call between ANY two landing points across the whole network. Finds
// the shortest hop chain, then collapses it into LEGS: maximal runs of the same
// cable become one cable leg (drawn entry→exit along the real cable), and each
// teleport hop becomes a teleport leg. Falls back to a single great-circle leg
// when the two points can't be connected.
export function resolveNetworkRoute(
  fromId: string,
  toId: string,
): ResolvedNetworkRoute {
  const fromPoint = landingPointsById[fromId];
  const toPoint = landingPointsById[toId];
  if (!fromPoint || !toPoint) {
    throw new Error("Network route endpoints missing from landingPoints");
  }

  const hops = shortestHops(fromId, toId);
  const legs: RouteLeg[] = [];

  if (!hops || hops.length === 0) {
    // Same point, or no path through the network → plain great-circle leg.
    const coords = greatCircle(
      [fromPoint.lat, fromPoint.lng],
      [toPoint.lat, toPoint.lng],
      48,
    );
    legs.push({ kind: "cable", cableId: "", coords, km: pathKm(coords) });
  } else {
    let i = 0;
    while (i < hops.length) {
      const h = hops[i];
      if (h.kind === "teleport") {
        const a = landingPointsById[h.fromId];
        const b = landingPointsById[h.toId];
        legs.push({
          kind: "teleport",
          fromId: h.fromId,
          toId: h.toId,
          from: [a.lat, a.lng],
          to: [b.lat, b.lng],
          km: haversine([a.lat, a.lng], [b.lat, b.lng]),
        });
        i++;
      } else {
        // Collapse a run of consecutive same-cable hops into one leg and draw
        // it as the direct shortest path along that cable (entry → exit).
        const cableId = h.cableId;
        const start = h.fromId;
        let end = h.toId;
        let j = i + 1;
        while (
          j < hops.length &&
          hops[j].kind === "cable" &&
          hops[j].cableId === cableId
        ) {
          end = hops[j].toId;
          j++;
        }
        const coords = resolveCallRoute(cableId, start, end).coords;
        legs.push({ kind: "cable", cableId, coords, km: pathKm(coords) });
        i = j;
      }
    }
  }

  const cableIds = [
    ...new Set(
      legs.flatMap((l) => (l.kind === "cable" && l.cableId ? [l.cableId] : [])),
    ),
  ];
  const totalCableKm = legs.reduce(
    (s, l) => s + (l.kind === "cable" ? l.km : 0),
    0,
  );

  return { legs, cableIds, totalCableKm, fromPoint, toPoint };
}
