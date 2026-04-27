// Pulls Natural Earth Admin-0 country borders (110m, low-detail) and bakes a
// slim version into src/data/countries.json. Run manually:
//
//   node scripts/import-countries.mjs
//
// Used by the "outline" map style — instead of rendering a full earth texture
// we draw country borders as polygons. Much lighter on GPU/network.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const OUT_FILE = path.join(REPO, "src/data/countries.json");
const CACHE_DIR = path.join(__dirname, ".cache");
const URL =
  "https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson";

const SIMPLIFY_TOLERANCE_DEG = 0.15; // ~17 km — fine for country outlines
const COORD_DECIMALS = 2;

async function load() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, "ne-countries.geojson");
  if (!fs.existsSync(cachePath)) {
    console.log(`Fetching ${URL}...`);
    const res = await fetch(URL);
    if (!res.ok) throw new Error(`Fetch failed: ${res.status}`);
    fs.writeFileSync(cachePath, await res.text());
  }
  return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
}

// Standard RDP — fine for open paths. For closed rings (first === last) the
// start-to-end segment is degenerate and the base case collapses everything to
// 2 points. Caller must split closed rings before invoking, or use rdpRing.
function rdp(points, tol) {
  if (points.length < 3) return points;
  let dmax = 0;
  let idx = 0;
  const [x1, y1] = points[0];
  const [x2, y2] = points[points.length - 1];
  for (let i = 1; i < points.length - 1; i++) {
    const [x, y] = points[i];
    const dx = x2 - x1;
    const dy = y2 - y1;
    const denom = Math.hypot(dx, dy) || 1;
    const d = Math.abs(dy * x - dx * y + x2 * y1 - y2 * x1) / denom;
    if (d > dmax) {
      dmax = d;
      idx = i;
    }
  }
  if (dmax > tol) {
    return rdp(points.slice(0, idx + 1), tol)
      .slice(0, -1)
      .concat(rdp(points.slice(idx), tol));
  }
  return [points[0], points[points.length - 1]];
}

// RDP for closed rings — splits the ring at the point farthest from the start
// to avoid the degenerate-segment collapse, then RDPs both halves.
function rdpRing(ring, tol) {
  if (ring.length < 5) return ring;
  // Find vertex farthest from ring[0].
  const [x0, y0] = ring[0];
  let maxD = 0;
  let split = Math.floor(ring.length / 2);
  for (let i = 1; i < ring.length - 1; i++) {
    const dx = ring[i][0] - x0;
    const dy = ring[i][1] - y0;
    const d = dx * dx + dy * dy;
    if (d > maxD) {
      maxD = d;
      split = i;
    }
  }
  const left = rdp(ring.slice(0, split + 1), tol);
  const right = rdp(ring.slice(split), tol);
  // Stitch and ensure the ring is closed.
  const out = left.slice(0, -1).concat(right);
  if (out[0][0] !== out[out.length - 1][0] || out[0][1] !== out[out.length - 1][1]) {
    out.push(out[0]);
  }
  return out;
}

function round(n) {
  const k = 10 ** COORD_DECIMALS;
  return Math.round(n * k) / k;
}

function simplifyRing(ring) {
  const simp = rdpRing(ring, SIMPLIFY_TOLERANCE_DEG);
  return simp.map(([x, y]) => [round(x), round(y)]);
}

function simplifyGeom(geom) {
  if (geom.type === "Polygon") {
    return { type: "Polygon", coordinates: geom.coordinates.map(simplifyRing) };
  }
  if (geom.type === "MultiPolygon") {
    return {
      type: "MultiPolygon",
      coordinates: geom.coordinates.map((poly) => poly.map(simplifyRing)),
    };
  }
  return geom;
}

async function main() {
  const data = await load();
  let totalIn = 0;
  let totalOut = 0;
  const features = data.features.map((f) => {
    const before = JSON.stringify(f.geometry).length;
    const geom = simplifyGeom(f.geometry);
    const after = JSON.stringify(geom).length;
    totalIn += before;
    totalOut += after;
    return {
      type: "Feature",
      properties: { name: f.properties.NAME, iso: f.properties.ADM0_A3 },
      geometry: geom,
    };
  });
  const out = { type: "FeatureCollection", features };
  fs.writeFileSync(OUT_FILE, JSON.stringify(out));
  const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(
    `Wrote ${OUT_FILE}: ${features.length} features, geom ${(totalIn / 1024).toFixed(1)} KB -> ${(totalOut / 1024).toFixed(1)} KB, file ${sizeKb} KB`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
