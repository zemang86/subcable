/* Route audit harness — runs the REAL resolver over every reachable landing-point
 * pair and scores each route for things that look broken on the globe.
 * Run:  npx tsx scripts/auditRoutes.ts            (summary + worst offenders)
 *       npx tsx scripts/auditRoutes.ts --csv      (full per-pair CSV to stdout)
 */
import { readFileSync } from "node:fs";
import { resolveNetworkRoute, sensiblyReachableFrom, type RouteLeg } from "@/lib/callRoutes";
import { landingPoints, landingPointsById } from "@/data/landingPoints";

type LL = [number, number]; // [lat,lng]

const R = 6371;
const hav = (a: LL, b: LL) => {
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const la1 = (a[0] * Math.PI) / 180, la2 = (b[0] * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};

// ── land detection (point-in-polygon over Natural Earth countries) ──
type Ring = number[][]; // [lng,lat]
interface Poly { rings: Ring[]; bbox: [number, number, number, number]; name: string }
const geo = JSON.parse(readFileSync(new URL("../src/data/countries.json", import.meta.url), "utf8"));
const polys: Poly[] = [];
for (const f of geo.features) {
  const name = f.properties?.name ?? "?";
  const push = (coords: Ring[]) => {
    let minX = 180, minY = 90, maxX = -180, maxY = -90;
    for (const r of coords) for (const [x, y] of r) {
      if (x < minX) minX = x; if (x > maxX) maxX = x;
      if (y < minY) minY = y; if (y > maxY) maxY = y;
    }
    polys.push({ rings: coords, bbox: [minX, minY, maxX, maxY], name });
  };
  if (f.geometry.type === "Polygon") push(f.geometry.coordinates);
  else if (f.geometry.type === "MultiPolygon") for (const p of f.geometry.coordinates) push(p);
}
const inRing = (lng: number, lat: number, ring: Ring) => {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1], xj = ring[j][0], yj = ring[j][1];
    if (((yi > lat) !== (yj > lat)) && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};
const onLand = (p: LL): boolean => {
  const [lat, lng] = p;
  for (const poly of polys) {
    const [minX, minY, maxX, maxY] = poly.bbox;
    if (lng < minX || lng > maxX || lat < minY || lat > maxY) continue;
    // first ring = outer, rest = holes
    if (inRing(lng, lat, poly.rings[0])) {
      let hole = false;
      for (let r = 1; r < poly.rings.length; r++) if (inRing(lng, lat, poly.rings[r])) { hole = true; break; }
      if (!hole) return true;
    }
  }
  return false;
};

// km of a leg's *interior* that runs over land (skip hops touching an endpoint,
// since landing stations are coastal/slightly inland by nature).
const overlandKm = (coords: LL[]): number => {
  let km = 0;
  for (let i = 1; i < coords.length; i++) {
    if (i === 1 || i === coords.length - 1) continue; // endpoint-adjacent hops
    const mid: LL = [(coords[i - 1][0] + coords[i][0]) / 2, (coords[i - 1][1] + coords[i][1]) / 2];
    if (onLand(mid)) km += hav(coords[i - 1], coords[i]);
  }
  return km;
};
const maxHop = (coords: LL[]): number => {
  let m = 0;
  for (let i = 1; i < coords.length; i++) m = Math.max(m, hav(coords[i - 1], coords[i]));
  return m;
};

// ── enumerate reachable unordered pairs ──
const ids = landingPoints.map((p) => p.id);
const seenPair = new Set<string>();
interface Row {
  from: string; to: string; fromC: string; toC: string;
  totalKm: number; havKm: number; ratio: number;
  nLegs: number; nCable: number; nTeleport: number;
  maxTeleportKm: number; teleportCrossCountry: number;
  cableOverlandKm: number; cableMaxHop: number;
  fallback: boolean; cables: string;
}
const rows: Row[] = [];
const reachCounts: Record<string, number> = {};

for (const from of ids) {
  const reach = sensiblyReachableFrom(from);
  reachCounts[from] = reach.size;
  for (const to of reach) {
    if (to === from) continue;
    const key = from < to ? `${from}|${to}` : `${to}|${from}`;
    if (seenPair.has(key)) continue;
    seenPair.add(key);

    const r = resolveNetworkRoute(from, to);
    const fp = landingPointsById[from], tp = landingPointsById[to];
    const havKm = hav([fp.lat, fp.lng], [tp.lat, tp.lng]);
    let totalKm = 0, nCable = 0, nTele = 0, maxTele = 0, teleXC = 0, overland = 0, cMaxHop = 0;
    let fallback = false;
    const cableSet = new Set<string>();
    for (const leg of r.legs as RouteLeg[]) {
      if (leg.kind === "teleport") {
        nTele++; totalKm += leg.km; maxTele = Math.max(maxTele, leg.km);
        const a = landingPointsById[leg.fromId], b = landingPointsById[leg.toId];
        if (a.country !== b.country) teleXC++;
      } else {
        nCable++; totalKm += leg.km;
        if (!leg.cableId) fallback = true; else cableSet.add(leg.cableId);
        overland += overlandKm(leg.coords);
        cMaxHop = Math.max(cMaxHop, maxHop(leg.coords));
      }
    }
    rows.push({
      from, to, fromC: fp.country, toC: tp.country,
      totalKm: Math.round(totalKm), havKm: Math.round(havKm),
      ratio: +(totalKm / Math.max(havKm, 1)).toFixed(2),
      nLegs: r.legs.length, nCable, nTeleport: nTele,
      maxTeleportKm: Math.round(maxTele), teleportCrossCountry: teleXC,
      cableOverlandKm: Math.round(overland), cableMaxHop: Math.round(cMaxHop),
      fallback, cables: [...cableSet].join("+"),
    });
  }
}

if (process.argv.includes("--csv")) {
  const cols = Object.keys(rows[0]) as (keyof Row)[];
  console.log(cols.join(","));
  for (const r of rows) console.log(cols.map((c) => r[c]).join(","));
  process.exit(0);
}

// ── summary ──
const total = rows.length;
const isolated = ids.filter((id) => reachCounts[id] <= 1);
const fallbacks = rows.filter((r) => r.fallback);
const overland = rows.filter((r) => r.cableOverlandKm > 150).sort((a, b) => b.cableOverlandKm - a.cableOverlandKm);
const longTele = rows.filter((r) => r.maxTeleportKm > 600).sort((a, b) => b.maxTeleportKm - a.maxTeleportKm);
const xcTele = rows.filter((r) => r.teleportCrossCountry > 0).sort((a, b) => b.teleportCrossCountry - a.teleportCrossCountry);
const detour = rows.filter((r) => r.ratio > 1.6 && r.havKm > 300).sort((a, b) => b.ratio - a.ratio);

console.log(`\n=== ROUTE AUDIT — ${total} reachable pairs over ${ids.length} landing points ===\n`);
console.log(`Isolated points (reach<=1, never offered as a destination): ${isolated.length}`);
console.log("  " + (isolated.join(", ") || "none"));
console.log(`\nReach-count distribution:`);
const buckets: Record<string, number> = {};
for (const id of ids) { const b = `${Math.floor(reachCounts[id] / 20) * 20}-${Math.floor(reachCounts[id] / 20) * 20 + 19}`; buckets[b] = (buckets[b] || 0) + 1; }
for (const [b, n] of Object.entries(buckets).sort()) console.log(`  ${b}: ${n} points`);

const fmt = (r: Row) => `${r.from}→${r.to} [${r.fromC}→${r.toC}] tot=${r.totalKm} hav=${r.havKm} x${r.ratio} legs=${r.nLegs}(c${r.nCable}/t${r.nTeleport}) maxTele=${r.maxTeleportKm} overland=${r.cableOverlandKm} maxHop=${r.cableMaxHop} ${r.cables}${r.fallback ? " FALLBACK" : ""}`;

console.log(`\n── A. Great-circle FALLBACK legs (no real path, draws a chord): ${fallbacks.length} pairs`);
fallbacks.slice(0, 15).forEach((r) => console.log("  " + fmt(r)));
console.log(`\n── B. Cable legs crossing LAND (>150km overland interior): ${overland.length} pairs`);
overland.slice(0, 20).forEach((r) => console.log("  " + fmt(r)));
console.log(`\n── C. Oversized TELEPORT jumps (>600km): ${longTele.length} pairs`);
longTele.slice(0, 20).forEach((r) => console.log("  " + fmt(r)));
console.log(`\n── D. Cross-COUNTRY teleports (mis-grouped hand-off): ${xcTele.length} pairs`);
xcTele.slice(0, 15).forEach((r) => console.log("  " + fmt(r)));
console.log(`\n── E. Absurd DETOUR ratio (>1.6x, hav>300km): ${detour.length} pairs`);
detour.slice(0, 20).forEach((r) => console.log("  " + fmt(r)));
