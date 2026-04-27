// Pre-bake an equirectangular world basemap from Natural Earth GeoJSON.
// Output is a single WebP that gets sampled by three.js as the globe texture
// — replaces CARTO tile streaming so the kiosk works fully offline.
//
// Usage:
//   node scripts/generate-world-map.mjs           # both light + dark
//   node scripts/generate-world-map.mjs light     # only light
//   node scripts/generate-world-map.mjs dark      # only dark
//
// Output:  public/textures/world-mono-{light,dark}.webp  (~350 KB each at 8K)

import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const W = 8192;
const H = 4096;
const STROKE_WIDTH = 0.6;

const PRESETS = {
  light: {
    sea: "#C9D7E8",
    land: "#FAF6EB",
    stroke: "rgba(60, 70, 95, 0.45)",
  },
  dark: {
    sea: "#0B1322",
    land: "#152033",
    stroke: "rgba(150, 165, 200, 0.30)",
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
  ((lng + 180) / 360) * W,
  ((90 - lat) / 180) * H,
];

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
for (const f of geojson.features) {
  const g = f.geometry;
  if (!g) continue;
  if (g.type === "Polygon") {
    paths.push(polyToPath(g.coordinates));
  } else if (g.type === "MultiPolygon") {
    for (const poly of g.coordinates) paths.push(polyToPath(poly));
  }
}

for (const theme of themes) {
  const { sea, land, stroke } = PRESETS[theme];
  const outFile = path.resolve(`public/textures/world-mono-${theme}.webp`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<rect width="${W}" height="${H}" fill="${sea}"/>
<g fill="${land}" stroke="${stroke}" stroke-width="${STROKE_WIDTH}" stroke-linejoin="round" fill-rule="evenodd">
${paths.map((p) => `<path d="${p}"/>`).join("\n")}
</g>
</svg>`;

  fs.mkdirSync(path.dirname(outFile), { recursive: true });
  await sharp(Buffer.from(svg), { density: 96, limitInputPixels: false })
    .resize(W, H)
    .webp({ quality: 85, effort: 6 })
    .toFile(outFile);

  const sizeKb = (fs.statSync(outFile).size / 1024).toFixed(1);
  console.log(
    `Wrote ${outFile}: ${W}x${H}, ${sizeKb} KB, ${paths.length} polygons from ${geojson.features.length} features`
  );
}
