// Pulls real cable route geometry from external sources and bakes it into
// src/data/cableGeometry.ts. Run manually whenever the source data changes:
//
//   node scripts/import-cable-geometry.mjs
//
// Sources (add more as needed):
//  - TeleGeography / submarinecablemap.com — public GeoJSON endpoint
//  - (future) hand-traced KML/JSON files dropped into scripts/sources/
//
// Mapping table CABLE_SOURCE_MAP below maps our internal cable id -> the
// external feature name(s) to merge. If a cable isn't listed, runtime falls
// back to the great-circle TOPOLOGIES dict in cableRoutes.ts.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO = path.resolve(__dirname, "..");
const OUT_FILE = path.join(REPO, "src/data/cableGeometry.ts");
const CACHE_DIR = path.join(__dirname, ".cache");
const SCM_URL =
  "https://www.submarinecablemap.com/api/v3/cable/cable-geo.json";

// Simplification: drop colinear-ish points to keep payload reasonable.
// Threshold in degrees of perpendicular distance — 0.05° ≈ 5.5 km at equator.
const SIMPLIFY_TOLERANCE_DEG = 0.05;

/**
 * Map internal cable id -> SCM feature name(s).
 * Use an array when a single logical cable is split across multiple SCM features
 * (e.g. SAT-3/WASC and SAFE are stored as two separate cables on SCM).
 *
 * Cables not in this map fall back to great-circle topology (cableRoutes.ts).
 * Reasons for omission:
 *   - nugate, mdscs, bps, langkawi-perlis: not in TeleGeography dataset
 *     (NuGate is partner-PoP, MDSCS/BPS/LKP are short Malaysian domestic)
 *   - stingray-perhentian, stingray2-ketam, stingray2-redang: not in dataset
 */
const CABLE_SOURCE_MAP = {
  smw4: { scm: "SeaMeWe-4" },
  smw5: { scm: "SeaMeWe-5" },
  smw6: { scm: "SeaMeWe-6" },
  bbg: { scm: "Bay of Bengal Gateway (BBG)" },
  aag: { scm: "Asia-America Gateway (AAG) Cable System" },
  apcn2: { scm: "APCN-2" },
  cm: { scm: "Asia Submarine-cable Express (ASE)/Cahaya Malaysia" },
  bdm: { scm: "Batam Dumai Melaka (BDM)" },
  dmcs: { scm: "Dumai-Melaka Cable System (DMCS)" },
  mct: { scm: "Malaysia-Cambodia-Thailand (MCT) Cable" },
  "sat3-wasc-safe": { scm: ["SAT-3/WASC", "SAFE"] },
  flag: { scm: "FEA" },
  fa1: { scm: "FLAG Atlantic-1 (FA-1)" },
  alc: { scm: "Asia Link Cable (ALC)" },
  "aug-east": { scm: "Asia United Gateway East (AUG East)" },
  candle: { scm: "Candle" },
  // TM now calls this SKRM; TeleGeography still files it under the original
  // 1Malaysia-era title, so this lookup key must keep the "1".
  skr1m: { scm: "Sistem Kabel Rakyat 1Malaysia (SKR1M)" },
  "stingray-pangkor": { scm: "Lumut-Pangkor Island" },
  "stingray-tioman": { scm: "Rompin-Tioman Island" },
};

async function loadSCM() {
  fs.mkdirSync(CACHE_DIR, { recursive: true });
  const cachePath = path.join(CACHE_DIR, "scm-cables.json");
  if (!fs.existsSync(cachePath)) {
    console.log(`Fetching ${SCM_URL}...`);
    const res = await fetch(SCM_URL);
    if (!res.ok) throw new Error(`SCM fetch failed: ${res.status}`);
    const text = await res.text();
    fs.writeFileSync(cachePath, text);
    console.log(`Cached to ${cachePath} (${(text.length / 1024).toFixed(1)} KB)`);
  } else {
    console.log(`Using cached ${cachePath}`);
  }
  return JSON.parse(fs.readFileSync(cachePath, "utf-8"));
}

// Ramer-Douglas-Peucker simplification. Keeps shape but drops dense filler points.
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
    const left = rdp(points.slice(0, idx + 1), tol);
    const right = rdp(points.slice(idx), tol);
    return left.slice(0, -1).concat(right);
  }
  return [points[0], points[points.length - 1]];
}

function buildGeometry(scm) {
  const featuresByName = new Map(
    scm.features.map((f) => [f.properties.name, f])
  );

  const out = {};
  const stats = [];
  for (const [cableId, src] of Object.entries(CABLE_SOURCE_MAP)) {
    const names = Array.isArray(src.scm) ? src.scm : [src.scm];
    const segments = [];
    let totalIn = 0;
    let totalOut = 0;
    for (const name of names) {
      const feat = featuresByName.get(name);
      if (!feat) {
        console.warn(`  ! ${cableId}: SCM feature not found: ${name}`);
        continue;
      }
      // MultiLineString -> array of LineStrings, each is array of [lng, lat]
      for (const ls of feat.geometry.coordinates) {
        totalIn += ls.length;
        const simplified = rdp(ls, SIMPLIFY_TOLERANCE_DEG);
        totalOut += simplified.length;
        // Convert SCM [lng, lat] -> our [lat, lng]; round to 4 decimals (~11m).
        const coords = simplified.map(([lng, lat]) => [
          Math.round(lat * 1e4) / 1e4,
          Math.round(lng * 1e4) / 1e4,
        ]);
        segments.push(coords);
      }
    }
    if (segments.length === 0) continue;
    out[cableId] = segments;
    stats.push(
      `  ${cableId}: ${segments.length} seg, ${totalIn} -> ${totalOut} pts`
    );
  }
  console.log("Geometry summary:");
  stats.forEach((s) => console.log(s));
  return out;
}

function emitTs(geometry) {
  const header = `// AUTO-GENERATED by scripts/import-cable-geometry.mjs — do not edit by hand.
// Source: TeleGeography submarinecablemap.com (public GeoJSON endpoint).
// Geometry is simplified (RDP, ~5.5km tolerance) and rounded to 4 decimals.
// Re-run \`node scripts/import-cable-geometry.mjs\` to refresh.

/** Real-world cable geometry per cable id. Each entry is one or more polylines
 *  of [lat, lng] pairs. Cables not listed here fall back to the great-circle
 *  TOPOLOGIES in cableRoutes.ts. */
export const CABLE_GEOMETRY: Record<string, [number, number][][]> = `;
  return header + JSON.stringify(geometry, null, 2) + ";\n";
}

async function main() {
  const scm = await loadSCM();
  console.log(`SCM has ${scm.features.length} cable features`);
  const geometry = buildGeometry(scm);
  fs.writeFileSync(OUT_FILE, emitTs(geometry));
  const sizeKb = (fs.statSync(OUT_FILE).size / 1024).toFixed(1);
  console.log(
    `\nWrote ${OUT_FILE} — ${Object.keys(geometry).length} cables, ${sizeKb} KB`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
