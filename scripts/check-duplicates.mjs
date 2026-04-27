// Parses landingPoints.ts as text and scans for duplicates / near-duplicates.
import fs from "node:fs";

const src = fs.readFileSync(
  new URL("../src/data/landingPoints.ts", import.meta.url),
  "utf-8"
);

// Match each { id: ..., name: ..., city: ..., country: ..., region: ..., lat: N, lng: N, cableIds: [...] }
const re =
  /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*city:\s*"([^"]+)",\s*country:\s*"([^"]+)",\s*region:\s*"([^"]+)",\s*lat:\s*(-?[\d.]+),\s*lng:\s*(-?[\d.]+),\s*cableIds:\s*\[([^\]]*)\]/g;

const points = [];
let m;
while ((m = re.exec(src))) {
  const cableIds = m[8]
    .split(",")
    .map((s) => s.trim().replace(/"/g, ""))
    .filter(Boolean);
  points.push({
    id: m[1],
    name: m[2],
    city: m[3],
    country: m[4],
    region: m[5],
    lat: parseFloat(m[6]),
    lng: parseFloat(m[7]),
    cableIds,
  });
}

console.log(`Parsed ${points.length} landing points\n`);

// 1) Same city + country
const byCityCountry = new Map();
for (const p of points) {
  const k = `${p.city}|${p.country}`;
  if (!byCityCountry.has(k)) byCityCountry.set(k, []);
  byCityCountry.get(k).push(p);
}
console.log("=== Same city+country (multiple landing points) ===");
let anyCity = false;
for (const [k, arr] of byCityCountry) {
  if (arr.length > 1) {
    anyCity = true;
    console.log(`\n${k}  (${arr.length})`);
    for (const p of arr)
      console.log(
        `  ${p.id.padEnd(28)} lat=${p.lat} lng=${p.lng}  cables=${p.cableIds.join(",")}`
      );
  }
}
if (!anyCity) console.log("(none)");

// 2) Pairs within 5 km
const haversine = (a, b) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
};
console.log("\n\n=== Pairs within 5 km (potential duplicates) ===");
let anyClose = false;
for (let i = 0; i < points.length; i++) {
  for (let j = i + 1; j < points.length; j++) {
    const d = haversine(points[i], points[j]);
    if (d < 5) {
      anyClose = true;
      console.log(
        `${d.toFixed(2)} km: ${points[i].id} (${points[i].city}) <-> ${points[j].id} (${points[j].city})`
      );
    }
  }
}
if (!anyClose) console.log("(none)");

// 3) Exact lat/lng duplicates
console.log("\n=== Exact lat/lng duplicates ===");
const byCoord = new Map();
for (const p of points) {
  const k = `${p.lat},${p.lng}`;
  if (!byCoord.has(k)) byCoord.set(k, []);
  byCoord.get(k).push(p);
}
let anyCoord = false;
for (const [k, arr] of byCoord) {
  if (arr.length > 1) {
    anyCoord = true;
    console.log(`${k}: ${arr.map((p) => p.id).join(", ")}`);
  }
}
if (!anyCoord) console.log("(none)");

// 4) Duplicate IDs
console.log("\n=== Duplicate IDs ===");
const byId = new Map();
for (const p of points) byId.set(p.id, (byId.get(p.id) || 0) + 1);
let anyDup = false;
for (const [id, n] of byId)
  if (n > 1) {
    anyDup = true;
    console.log(`${id}: ${n}x`);
  }
if (!anyDup) console.log("(none)");
