// Trim src/data/countries.json (496 KB of full Natural Earth polygons, all
// bundled into the client JS) down to the two things the app actually uses:
//
//   1. src/data/countryLabels.json — one {lat,lng,name,area} per country for
//      the 3D label layer. Mirrors the exact largest-ring centroid logic that
//      used to run in GlobeScene's countryLabels useMemo (shoelace area on the
//      outer ring, bbox centre, area ≥ 4 cutoff) so labels land identically.
//   2. src/data/landingCountries.json — full GeoJSON features ONLY for the
//      countries that appear as landing-point countries (the selected-cable
//      highlight layer never needs the other ~215 geometries).
//
// RE-RUN THIS after adding cables/landing points in a new country, or its
// highlight will silently not light up:  node scripts/trim-countries.mjs
import { readFileSync, writeFileSync } from "node:fs";

const countries = JSON.parse(readFileSync("src/data/countries.json", "utf8"));
const landingSrc = readFileSync("src/data/landingPoints.ts", "utf8");

// Keep in sync with COUNTRY_NAME_ALIASES in GlobeScene.tsx
// (landingPoint.country → Natural Earth properties.name).
const ALIASES = { "United States": "United States of America" };

// ── 1. Label centroids (verbatim port of the old runtime computation) ──
const ringArea = (ring) => {
  let a = 0;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
  }
  return Math.abs(a) / 2;
};
const ringCentre = (ring) => {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  }
  return [(minX + maxX) / 2, (minY + maxY) / 2];
};

const labels = [];
for (const f of countries.features) {
  const g = f.geometry;
  if (!g) continue;
  const polys =
    g.type === "Polygon" ? [g.coordinates]
    : g.type === "MultiPolygon" ? g.coordinates
    : [];
  let bestRing = null;
  let bestArea = 0;
  for (const poly of polys) {
    const outer = poly[0];
    if (!outer || outer.length < 3) continue;
    const a = ringArea(outer);
    if (a > bestArea) {
      bestArea = a;
      bestRing = outer;
    }
  }
  if (!bestRing || bestArea < 4) continue;
  const [lng, lat] = ringCentre(bestRing);
  labels.push({
    lat,
    lng,
    name: (f.properties?.name || "").toUpperCase(),
    area: bestArea,
  });
}

// ── 2. Landing-country geometries ──
const landingCountryNames = new Set(
  [...landingSrc.matchAll(/country:\s*"([^"]+)"/g)].map(
    (m) => ALIASES[m[1]] ?? m[1],
  ),
);
const kept = countries.features.filter((f) =>
  landingCountryNames.has(f.properties?.name),
);
const featureNames = new Set(countries.features.map((f) => f.properties?.name));
const unmatched = [...landingCountryNames].filter((n) => !featureNames.has(n));

writeFileSync("src/data/countryLabels.json", JSON.stringify(labels));
writeFileSync(
  "src/data/landingCountries.json",
  JSON.stringify({ type: "FeatureCollection", features: kept }),
);

console.log(`labels: ${labels.length} countries`);
console.log(
  `landing geometries: kept ${kept.length}/${countries.features.length} features`,
);
if (unmatched.length) {
  console.log(
    `NOTE: no geometry for landing countries (stay unhighlighted): ${unmatched.join(", ")}`,
  );
}
