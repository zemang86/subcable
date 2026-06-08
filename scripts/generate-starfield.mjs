// Pre-bake an equirectangular starfield used as the globe's background sphere
// (globe.gl backgroundImageUrl). Scattered stars of varying size/brightness on
// the app's dark background, with a few soft "glow" stars for depth. Baked once
// so the kiosk works offline and the field stays identical every run.
//
// Usage:  node scripts/generate-starfield.mjs
// Output: public/textures/starfield.webp

import path from "node:path";
import sharp from "sharp";

const W = 4096;
const H = 2048;
const BG = "#040E1F"; // matches the canvas backgroundColor

// Tunables — bump COUNT / sizes / opacity for a busier or brighter sky.
const COUNT = 1400;
const GLOW_COUNT = 40;
const STAR_TINTS = ["#FFFFFF", "#FFFFFF", "#FFFFFF", "#CFE0FF", "#FFE7C7"];

// Deterministic PRNG (mulberry32) so re-bakes are reproducible.
let _s = 0x9e3779b9;
const rand = () => {
  _s |= 0;
  _s = (_s + 0x6d2b79f5) | 0;
  let t = Math.imul(_s ^ (_s >>> 15), 1 | _s);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
const pick = (arr) => arr[Math.floor(rand() * arr.length)];

const parts = [];

// Soft glow stars first (behind the crisp ones).
for (let i = 0; i < GLOW_COUNT; i++) {
  const cx = (rand() * W).toFixed(1);
  const cy = (rand() * H).toFixed(1);
  const r = (4 + rand() * 9).toFixed(1);
  const tint = pick(STAR_TINTS);
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#glow)" opacity="${(
      0.12 +
      rand() * 0.22
    ).toFixed(2)}"/>`,
  );
  // bright core
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${(0.8 + rand() * 1.0).toFixed(
      1,
    )}" fill="${tint}" opacity="0.95"/>`,
  );
}

// Crisp pinprick stars.
for (let i = 0; i < COUNT; i++) {
  const cx = (rand() * W).toFixed(1);
  const cy = (rand() * H).toFixed(1);
  const r = (0.4 + rand() * 1.7).toFixed(2);
  const op = (0.3 + rand() * 0.7).toFixed(2);
  parts.push(
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${pick(
      STAR_TINTS,
    )}" opacity="${op}"/>`,
  );
}

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
<defs>
  <radialGradient id="glow" cx="50%" cy="50%" r="50%">
    <stop offset="0%" stop-color="#FFFFFF" stop-opacity="0.9"/>
    <stop offset="40%" stop-color="#9DB8E0" stop-opacity="0.35"/>
    <stop offset="100%" stop-color="#9DB8E0" stop-opacity="0"/>
  </radialGradient>
</defs>
<rect width="${W}" height="${H}" fill="${BG}"/>
${parts.join("\n")}
</svg>`;

const outFile = path.resolve("public/textures/starfield.webp");
await sharp(Buffer.from(svg)).webp({ quality: 90 }).toFile(outFile);
const { size } = await sharp(outFile).metadata().then(async () => ({
  size: (await import("node:fs")).statSync(outFile).size,
}));
console.log(
  `Wrote ${outFile}: ${W}x${H}, ${(size / 1024).toFixed(0)} KB, ${
    COUNT + GLOW_COUNT
  } stars`,
);
