// Converts an OpenType (.otf) font to three.js typeface.json so it can be
// passed to react-globe.gl's `labelTypeFace` prop. three-globe renders labels
// as 3D extruded TextGeometry, which needs glyph paths in typeface.json form.
//
// Usage:
//   node scripts/convert-typeface.mjs public/fonts/hkgroteskwide-bold.otf src/data/hk-grotesk-bold.typeface.json
//
// Reverse-engineered from the original facetype.js output format.

import fs from "node:fs";
import path from "node:path";
import opentype from "opentype.js";

const [, , inFile, outFile] = process.argv;
if (!inFile || !outFile) {
  console.error("Usage: node convert-typeface.mjs <in.otf> <out.json>");
  process.exit(1);
}

const RESTRICT = [
  // Latin printable + a few extras commonly used in city/country names
  ..."ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789 .,'-/()&·",
  // Common diacritics in country names (Türkiye, Côte, São, etc.)
  ..."ÀÁÂÃÄÅÆÇÈÉÊËÌÍÎÏÐÑÒÓÔÕÖØÙÚÛÜÝŸ",
  ..."àáâãäåæçèéêëìíîïðñòóôõöøùúûüýÿ",
  ..."ŠŽŒšžœ",
];

const font = opentype.loadSync(path.resolve(inFile));
const scale = 1000 / (font.unitsPerEm || 1000);
const out = {
  glyphs: {},
  familyName: font.names.fontFamily?.en || "Custom",
  ascender: Math.round(font.ascender * scale),
  descender: Math.round(font.descender * scale),
  underlinePosition: Math.round((font.tables.post?.underlinePosition || 0) * scale),
  underlineThickness: Math.round((font.tables.post?.underlineThickness || 0) * scale),
  boundingBox: {
    yMin: Math.round((font.tables.head?.yMin || 0) * scale),
    xMin: Math.round((font.tables.head?.xMin || 0) * scale),
    yMax: Math.round((font.tables.head?.yMax || 0) * scale),
    xMax: Math.round((font.tables.head?.xMax || 0) * scale),
  },
  resolution: 1000,
  original_font_information: {},
  cssFontWeight: "normal",
  cssFontStyle: "normal",
};

function pathToTokens(p) {
  // typeface.json command stream: "m x y q cx cy x y b cx1 cy1 cx2 cy2 x y l x y z"
  // opentype.js emits y-down; three.js expects y-up — flip y on the way out.
  const parts = [];
  const rx = (n) => +(n * scale).toFixed(0);
  const ry = (n) => +(-n * scale).toFixed(0);
  for (const cmd of p.commands) {
    if (cmd.type === "M") parts.push("m", rx(cmd.x), ry(cmd.y));
    else if (cmd.type === "L") parts.push("l", rx(cmd.x), ry(cmd.y));
    else if (cmd.type === "Q")
      parts.push("q", rx(cmd.x), ry(cmd.y), rx(cmd.x1), ry(cmd.y1));
    else if (cmd.type === "C")
      parts.push(
        "b",
        rx(cmd.x),
        ry(cmd.y),
        rx(cmd.x1),
        ry(cmd.y1),
        rx(cmd.x2),
        ry(cmd.y2)
      );
    else if (cmd.type === "Z") parts.push("z");
  }
  return parts.join(" ");
}

let included = 0;
for (const ch of RESTRICT) {
  const glyph = font.charToGlyph(ch);
  if (!glyph || glyph.unicode === undefined) continue;
  const p = glyph.getPath(0, 0, 1000);
  out.glyphs[ch] = {
    ha: Math.round(glyph.advanceWidth * scale),
    x_min: Math.round((glyph.xMin || 0) * scale),
    x_max: Math.round((glyph.xMax || 0) * scale),
    o: pathToTokens(p),
  };
  included++;
}

fs.mkdirSync(path.dirname(path.resolve(outFile)), { recursive: true });
fs.writeFileSync(path.resolve(outFile), JSON.stringify(out));
const sizeKb = (fs.statSync(path.resolve(outFile)).size / 1024).toFixed(1);
console.log(`Wrote ${outFile}: ${included} glyphs, ${sizeKb} KB`);
