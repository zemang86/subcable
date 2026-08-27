/**
 * Checks rendered narration against the script it was rendered from.
 *
 * Transcribes each shipped MP3 with Gemini and word-diffs the transcript
 * against docs/vo-table/vo-script.json. Catches the failure modes that are
 * invisible in a waveform and that nobody wants to find on the kiosk:
 * the direction prefix read aloud, a dropped paragraph, a hallucinated
 * sentence, the wrong language.
 *
 * It does NOT judge delivery. Accent, pace and whether the Malay drifts
 * Indonesian are ear calls — this only proves the words are right.
 *
 *   node scripts/verifyVoiceover.mjs --lang=en
 *   node scripts/verifyVoiceover.mjs --lang=en --only=gutta-percha
 */

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const MODEL = "gemini-3.6-flash";
const SCRIPT_JSON = "docs/vo-table/vo-script.json";
const MP3_ROOT = "public/audio/vo";
const MANIFEST = join(MP3_ROOT, "manifest.json");

const argv = process.argv.slice(2);
const arg = (k, d) => argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const lang = arg("lang", "en");
const only = arg("only");

function apiKey() {
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  const m = existsSync(".env.local")
    ? readFileSync(".env.local", "utf8").match(/^GOOGLE_API_KEY=(.+)$/m)
    : null;
  if (m) return m[1].trim();
  console.error("No GOOGLE_API_KEY.");
  process.exit(1);
}

const script = JSON.parse(readFileSync(SCRIPT_JSON, "utf8"));
const manifest = JSON.parse(readFileSync(MANIFEST, "utf8"));

/** Same unit grouping the renderer uses: the ref up to "#". */
const expected = new Map();
for (const seg of script.segments) {
  const ref = seg.ref.split("#")[0];
  expected.set(ref, [...(expected.get(ref) ?? []), seg[lang]]);
}

/**
 * The transcriber writes what it hears, not the copy's spelling, so British and
 * American forms of the same spoken word have to fold together — otherwise
 * "fibre" vs "fiber" buries a real defect under a false one. Quote marks go
 * entirely; an apostrophe inside a word ("today's") stays.
 */
const SPELLING = {
  fibre: "fiber", fibres: "fibers", metre: "meter", metres: "meters",
  kilometre: "kilometer", kilometres: "kilometers", centre: "center",
  colour: "color", programme: "program", defence: "defense",
  galvanised: "galvanized", organised: "organized", recognised: "recognized",
};

/**
 * The transcriber also likes to abbreviate spoken units — it writes "40 m,
 * 130 ft" for audio that says "forty metres, one hundred and thirty feet".
 * Folding those keeps a known artifact from masking real defects, but a read
 * that genuinely abbreviated would then pass silently, so any unit where this
 * fires gets an advisory. Confirmed spoken in full for gutta-percha on
 * 2026-08-27 by a targeted listen; re-check if that unit is re-rendered.
 */
const UNIT_ABBREV = { m: "meters", ft: "feet", km: "kilometers", cm: "centimeters" };

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .map((w) => SPELLING[w] ?? w);

/** Second pass, applied only when comparing, so the advisory can fire. */
const foldUnits = (ws) => ws.map((w) => UNIT_ABBREV[w] ?? w);

/** Longest common subsequence — reports what is genuinely missing or added
 * rather than every word after the first misalignment. */
function diffWords(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m + 1 }, () => new Uint16Array(n + 1));
  for (let i = m - 1; i >= 0; i--)
    for (let j = n - 1; j >= 0; j--)
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
  const missing = [], extra = [];
  let i = 0, j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) { i++; j++; }
    else if (dp[i + 1][j] >= dp[i][j + 1]) missing.push(a[i++]);
    else extra.push(b[j++]);
  }
  while (i < m) missing.push(a[i++]);
  while (j < n) extra.push(b[j++]);
  return { missing, extra, common: dp[0][0] };
}

async function transcribe(key, file) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: "Transcribe this audio verbatim, in the language spoken. Output the transcript only, with no commentary." },
            { inline_data: { mime_type: "audio/mp3", data: readFileSync(file).toString("base64") } },
          ],
        }],
        // A transcript cut off mid-sentence is indistinguishable from audio
        // that dropped a paragraph — which is the thing being tested for — so
        // give the answer ample room. Temperature 0 so repeat passes agree.
        // thinkingConfig is deliberately absent: thinkingBudget:0 is rejected
        // outright by this model, and thinkingLevel:"low" returns garbage.
        generationConfig: { temperature: 0, maxOutputTokens: 8192 },
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);
  const body = await res.json();
  const cand = body.candidates?.[0];
  // Reasoning parts carry text too; they are not transcript.
  const text = (cand?.content?.parts ?? [])
    .filter((p) => p.thought !== true)
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error(`empty transcript (${cand?.finishReason})`);
  // A truncated pass must surface as an error, never as a word diff.
  if (cand?.finishReason && cand.finishReason !== "STOP") {
    throw new Error(`transcript truncated (${cand.finishReason})`);
  }
  return text;
}

const key = apiKey();
const units = Object.entries(manifest.units?.[lang] ?? {}).filter(([ref]) => !only || ref.includes(only));
if (!units.length) {
  console.error(`Nothing rendered for ${lang}${only ? ` matching "${only}"` : ""}.`);
  process.exit(1);
}

console.log(`Verifying ${units.length} ${lang.toUpperCase()} unit(s) against ${SCRIPT_JSON}\n`);
let bad = 0;

for (const [ref, entry] of units) {
  const file = join(MP3_ROOT, entry.file);
  process.stdout.write(`  ${ref.padEnd(38)} `);
  try {
    const want = foldUnits(norm((expected.get(ref) ?? []).join(" ")));

    // The transcriber is flaky: it sometimes returns only the first sentence of
    // a long file. A truncated pass looks exactly like a badly dropped
    // paragraph, and acting on one would mean re-rendering good audio for
    // nothing. A real defect reproduces across passes, so take the best of two
    // and only believe a miss that survives both.
    let best = null;
    for (let pass = 1; pass <= 2; pass++) {
      const raw = norm(await transcribe(key, file));
      const got = foldUnits(raw);
      const d = diffWords(want, got);
      const match = ((2 * d.common) / (want.length + got.length)) * 100;
      const cand = { ...d, match, abbreviated: raw.some((w) => w in UNIT_ABBREV), pass };
      if (!best || cand.match > best.match) best = cand;
      if (best.missing.length === 0 && best.extra.length === 0) break;
    }

    const { missing, extra, match, abbreviated, pass } = best;
    const ok = missing.length === 0 && extra.length === 0;
    console.log(`${match.toFixed(1)}% ${ok ? "exact" : ""}${pass > 1 ? ` (pass ${pass})` : ""}`);
    if (abbreviated) {
      console.log("      note: transcriber abbreviated a spoken unit — confirm by ear that it is read in full");
    }
    if (!ok) {
      bad++;
      if (missing.length) console.log(`      missing: ${missing.slice(0, 12).join(" ")}${missing.length > 12 ? ` … (+${missing.length - 12})` : ""}`);
      if (extra.length) console.log(`      extra:   ${extra.slice(0, 12).join(" ")}${extra.length > 12 ? ` … (+${extra.length - 12})` : ""}`);
    }
  } catch (e) {
    bad++;
    console.log(`FAILED — ${e.message}`);
  }
}

console.log(`\n${units.length - bad}/${units.length} clean.`);
process.exit(bad ? 1 : 0);
