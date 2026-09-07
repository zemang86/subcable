// Generates build/icon.png — the source icon electron-builder converts into
// the Windows .ico and macOS .icns. Re-run after changing public/tm-logo.png.
//
//   node scripts/buildAppIcon.mjs
//
// The logo sits on a white plate: the TM wordmark is dark blue, which reads
// poorly on Windows' dark taskbar if left on a transparent background.

import sharp from "sharp";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { mkdir } from "node:fs/promises";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SIZE = 1024;
const RADIUS = Math.round(SIZE * 0.11); // squircle-ish, survives macOS masking
const LOGO_WIDTH = Math.round(SIZE * 0.62);

const plate = Buffer.from(
  `<svg width="${SIZE}" height="${SIZE}" xmlns="http://www.w3.org/2000/svg">
     <rect width="${SIZE}" height="${SIZE}" rx="${RADIUS}" ry="${RADIUS}" fill="#ffffff"/>
   </svg>`,
);

const logo = await sharp(path.join(root, "public", "tm-logo.png"))
  .resize({ width: LOGO_WIDTH })
  .toBuffer();

const { height: logoHeight } = await sharp(logo).metadata();

await mkdir(path.join(root, "build"), { recursive: true });
await sharp(plate)
  .composite([
    {
      input: logo,
      left: Math.round((SIZE - LOGO_WIDTH) / 2),
      top: Math.round((SIZE - logoHeight) / 2),
    },
  ])
  .png()
  .toFile(path.join(root, "build", "icon.png"));

console.log(`build/icon.png — ${SIZE}x${SIZE}, logo ${LOGO_WIDTH}x${logoHeight}`);
