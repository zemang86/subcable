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

// Pick the cable polyline that best brackets fromPoint and toPoint, orient
// it so the start is closer to fromPoint, then bridge any gap at each end
// with a short great-circle arc. Works for both real geometry (long
// polylines from TeleGeography) and topology cables (short great-circle
// segments from cableRoutes.ts).
// Resolve the call route for an arbitrary cable + from/to landing-point pair
// (Model A: intra-cable dialling). The endpoints must both lie on the given
// cable — the caller scopes the From/To pickers to the selected cable's
// landing points, so this holds by construction. Args default to DEMO_CALL so
// the function still produces the showcase route when called bare.
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
  const segments = route?.segments ?? [];

  let body: [number, number][];

  if (segments.length === 0) {
    body = greatCircle(fromCoord, toCoord, 48);
  } else {
    // Score every segment by how well its endpoints bracket from + to.
    // The ideal segment minimises (dist from one end to fromCoord) +
    // (dist from other end to toCoord).
    let best: {
      coords: [number, number][];
      score: number;
      reverse: boolean;
    } | null = null;
    for (const seg of segments) {
      if (seg.coords.length < 2) continue;
      const a = seg.coords[0];
      const b = seg.coords[seg.coords.length - 1];
      const fwd = haversine(a, fromCoord) + haversine(b, toCoord);
      const rev = haversine(b, fromCoord) + haversine(a, toCoord);
      const score = Math.min(fwd, rev);
      if (!best || score < best.score) {
        best = { coords: seg.coords, score, reverse: rev < fwd };
      }
    }

    if (!best) {
      body = greatCircle(fromCoord, toCoord, 48);
    } else {
      const oriented = best.reverse ? [...best.coords].reverse() : best.coords;
      // Bridge from fromPoint → polyline start, then polyline, then
      // polyline end → toPoint. Skip a leg if it's already < ~5 km.
      const bridgeStart =
        haversine(fromCoord, oriented[0]) > 5
          ? greatCircle(fromCoord, oriented[0], 16)
          : [fromCoord];
      const bridgeEnd =
        haversine(oriented[oriented.length - 1], toCoord) > 5
          ? greatCircle(oriented[oriented.length - 1], toCoord, 16)
          : [toCoord];
      body = [
        ...bridgeStart.slice(0, -1),
        ...oriented,
        ...bridgeEnd.slice(1),
      ];
    }
  }

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
