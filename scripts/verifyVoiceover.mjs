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
  neighbouring: "neighboring", neighbour: "neighbor", neighbours: "neighbors",
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

/**
 * Transcribing Malay, the model reaches for Indonesian vocabulary: it wrote
 * "keterhubungan" for spoken "ketersambungan" across a dozen clips, and
 * "kapasitas / Eropa / serikat" for "kapasiti / Eropah / Syarikat". These are
 * not acoustically confusable — the transcriber is substituting the word it
 * expects, not the one it heard. Confirmed against the audio on 2026-08-28,
 * and Hazman confirmed no Indonesian dialect by ear.
 *
 * Folded so a dozen false positives stop hiding real defects. Because a
 * genuine drift to Indonesian is EXACTLY the failure this project fears, every
 * fold prints an advisory rather than passing silently.
 */
const ID_TO_MY = {
  keterhubungan: "ketersambungan", kapasitas: "kapasiti", eropa: "eropah",
  serikat: "syarikat", aktivitas: "aktiviti", kualitas: "kualiti",
  universitas: "universiti", komunitas: "komuniti", provinsi: "wilayah",
};

const norm = (s) =>
  s
    .toLowerCase()
    .replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}\s']/gu, " ")
    .split(/\s+/)
    .map((w) => w.replace(/^'+|'+$/g, ""))
    .filter(Boolean)
    .map((w) => SPELLING[w] ?? w);

/** Second pass, applied only when comparing, so the advisories can fire. */
const FOLD = lang === "bm" ? { ...UNIT_ABBREV, ...ID_TO_MY } : UNIT_ABBREV;
const foldUnits = (ws) => ws.map((w) => FOLD[w] ?? w);

/**
 * Where the word boundaries fall is the transcriber's choice, not the
 * narrator's: it writes "transatlantic" for copy reading "Trans-Atlantic",
 * "smw4" for "SMW-4", "sat 3" for "SAT3". None of that is audible. If the two
 * sides are identical once spacing is discarded, the words spoken were right
 * and only the spelling of the gap differs.
 */
const despace = (ws) => ws.join("");

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
    .trim()
    // Reasoning occasionally leaks into the answer as a bare "thought" line
    // rather than as a part flagged thought:true.
    .replace(/^thought\s*\n/i, "")
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

    // The transcriber is flaky in two ways: it sometimes returns only the first
    // sentence of a long file, and sometimes returns nothing at all. A truncated
    // pass looks exactly like a badly dropped paragraph, and acting on one would
    // mean re-rendering good audio for nothing. A real defect reproduces across
    // passes; flakiness does not. So: up to three passes, keep the best, and
    // treat a failed pass as a failed pass rather than as a verdict on the audio.
    let best = null;
    let lastErr = null;
    for (let pass = 1; pass <= 3; pass++) {
      let raw;
      try {
        raw = norm(await transcribe(key, file));
      } catch (e) {
        lastErr = e;
        continue;
      }
      const got = foldUnits(raw);
      const d = diffWords(want, got);
      const match = ((2 * d.common) / (want.length + got.length)) * 100;
      const cand = {
        ...d,
        match,
        abbreviated: raw.some((w) => w in UNIT_ABBREV),
        indonesian: raw.some((w) => w in ID_TO_MY),
        spacingOnly: despace(want) === despace(got),
        pass,
      };
      if (!best || cand.match > best.match) best = cand;
      if (best.spacingOnly || (best.missing.length === 0 && best.extra.length === 0)) break;
    }
    if (!best) throw lastErr ?? new Error("no transcript after 3 passes");

    const { missing, extra, match, abbreviated, indonesian, spacingOnly, pass } = best;
    const ok = spacingOnly || (missing.length === 0 && extra.length === 0);
    const label = spacingOnly && missing.length + extra.length > 0 ? "exact (word-splitting only)" : ok ? "exact" : "";
    console.log(`${match.toFixed(1)}% ${label}${pass > 1 ? ` (pass ${pass})` : ""}`);
    if (abbreviated) {
      console.log("      note: transcriber abbreviated a spoken unit — confirm by ear that it is read in full");
    }
    if (indonesian) {
      console.log("      note: transcriber wrote an Indonesian form — confirm by ear that the narrator said the Malay one");
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
