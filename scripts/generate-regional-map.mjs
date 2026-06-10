// Pre-bake a regional high-density basemap for Southeast Asia.
// Same equirectangular projection as generate-world-map.mjs, but covering
// only lat [-15, 25] × lng [90, 130]. 4096² over a 40°×40° window =
// ~1.2 km/texel (vs ~5 km/texel for the global 8K bake).
//
// Rendered as an overlay mesh in GlobeScene that fades in at close zoom —
// 1 extra draw call, no polygon mesh, no per-vertex transparency overhead.
//
// Usage:
//   node scripts/generate-regional-map.mjs           # both light + dark
//   node scripts/generate-regional-map.mjs light     # only light
//   node scripts/generate-regional-map.mjs dark      # only dark
//
// Output:  public/textures/world-mono-{light,dark}-sea.webp

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 4096;
const H = 4096;
const STROKE_WIDTH = 0.5;

// Geographic bounds — covers Bay of Bengal through South China Sea.
const LAT_MIN = -15;
const LAT_MAX = 25;
const LNG_MIN = 90;
const LNG_MAX = 130;

// ── Graticule (v7 hologram grid) ──
// Must match generate-world-map.mjs (same 10°/30° spacing and colours) so
// the grid lines up when this overlay cross-fades in at close zoom. This
// texture is ~4.5× denser (px/deg) than the global bake, so the stroke is
// wider in pixels yet renders slightly crisper on screen.
const GRID_ENABLED = true;
const GRID_STEP_DEG = 10;
const GRID_MAJOR_EVERY_DEG = 30;
const GRID_STROKE = 3.0;

const PRESETS = {
  light: {
    sea: "#C9D7E8",
    land: "#FAF6EB",
    stroke: "rgba(60, 70, 95, 0.45)",
    gridMinor: "rgba(60, 80, 120, 0.10)",
    gridMajor: "rgba(60, 80, 120, 0.18)",
  },
  dark: {
    sea: "#1E3A5F",
    land: "#152033",
    stroke: "rgba(150, 165, 200, 0.30)",
    gridMinor: "rgba(120, 170, 255, 0.08)",
    gridMajor: "rgba(120, 170, 255, 0.16)",
  },
};

const arg = process.argv[2];
const themes = arg ? [arg] : Object.keys(PRESETS);
for (const t of themes) {
  if (!PRESETS[t]) {
    console.error(`Unknown theme: ${t}. Expected: light, dark.`);
    process.exit(1);
  }
}

const inFile = path.resolve("src/data/countries.json");
const geojson = JSON.parse(fs.readFileSync(inFile, "utf8"));

const project = (lng, lat) => [
  ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * W,
  ((LAT_MAX - lat) / (LAT_MAX - LAT_MIN)) * H,
];

// Quick reject: skip features whose bbox is entirely outside the window.
// Saves time on the 200+ countries that aren't anywhere near SEA.
const bbox = (g) => {
  let minLng = Infinity,
    maxLng = -Infinity,
    minLat = Infinity,
    maxLat = -Infinity;
  const visit = (poly) => {
    for (const ring of poly) {
      for (const [x, y] of ring) {
        if (x < minLng) minLng = x;
        if (x > maxLng) maxLng = x;
        if (y < minLat) minLat = y;
        if (y > maxLat) maxLat = y;
      }
    }
  };
  if (g.type === "Polygon") visit(g.coordinates);
  else if (g.type === "MultiPolygon") for (const p of g.coordinates) visit(p);
  return { minLng, maxLng, minLat, maxLat };
};

const ringToPath = (ring) => {
  if (!ring || ring.length === 0) return "";
  const pts = ring.map(([lng, lat]) => project(lng, lat));
  let d = `M${pts[0][0].toFixed(1)},${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length; i++) {
    d += `L${pts[i][0].toFixed(1)},${pts[i][1].toFixed(1)}`;
  }
  return d + "Z";
};

const polyToPath = (poly) => poly.map(ringToPath).filter(Boolean).join(" ");

const paths = [];
let totalChecked = 0;
let kept = 0;
for (const f of geojson.features) {
  const g = f.geometry;
  if (!g) continue;
  totalChecked++;
  const b = bbox(g);
  if (
    b.maxLng < LNG_MIN ||
    b.minLng > LNG_MAX ||
    b.maxLat < LAT_MIN ||
    b.minLat > LAT_MAX
  )
    continue;
  kept++;
  if (g.type === "Polygon") {
    paths.push(polyToPath(g.coordinates));
  } else if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) paths.push(polyToPath(poly));
  }
}

// Grid lines at globally-aligned multiples of GRID_STEP_DEG that fall
// inside the window — one M…V/H command per line, bucketed by tier.
const graticuleSvg = (gridMinor, gridMajor) => {
  if (!GRID_ENABLED) return "";
  const minor = [];
  const major = [];
  const firstLng = Math.ceil(LNG_MIN / GRID_STEP_DEG) * GRID_STEP_DEG;
  for (let lng = firstLng; lng <= LNG_MAX; lng += GRID_STEP_DEG) {
    const [x] = project(lng, 0);
    const bucket = lng % GRID_MAJOR_EVERY_DEG === 0 ? major : minor;
    bucket.push(`M${x.toFixed(1)},0V${H}`);
  }
  const firstLat = Math.ceil(LAT_MIN / GRID_STEP_DEG) * GRID_STEP_DEG;
  for (let lat = firstLat; lat <= LAT_MAX; lat += GRID_STEP_DEG) {
    const [, y] = project(LNG_MIN, lat);
    const bucket = lat % GRID_MAJOR_EVERY_DEG === 0 ? major : minor;
    bucket.push(`M0,${y.toFixed(1)}H${W}`);
  }
  return `<g fill="none" stroke-width="${GRID_STROKE}">
<path stroke="${gridMinor}" d="${minor.join("")}"/>
<path stroke="${gridMajor}" d="${major.join("")}"/>
</g>`;
};

for (const theme of themes) {
  const { sea, land, stroke, gridMinor, gridMajor } = PRESETS[theme];
  const outFile = path.resolve(`public/textures/world-mono-${theme}-sea.webp`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${sea}"/>
${graticuleSvg(gridMinor, gridMajor)}
<g fill="${land}" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round" fill-rule="evenodd">
${paths.map((p) => `<path d="${p}"/>`).join("\n")}
</g>
</svg>`;

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await sharp(Buffer.from(svg), { density: 96, limitInputPixels: false })
    .resize(W, H)
    .webp({ quality: 88, effort: 6 })
    .toFile(outFile);

  const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(
    `Wrote ${outFile}: ${W}x${H}, ${sizeKb} KB, ${paths.length} polygons (${kept}/${totalChecked} features in window)`
  );
}
