/**
 * Renders the kiosk narration to shippable audio.
 *
 * Reads docs/vo-table/vo-script.json — the machine-readable twin that
 * scripts/buildVoScript.ts emits from the app's own copy — so the audio can
 * never drift from the script the client signed off. Never edit that JSON;
 * re-run the builder.
 *
 *   node scripts/renderVoiceover.mjs --lang=en --block=info
 *   node scripts/renderVoiceover.mjs --lang=en --block=cables
 *   node scripts/renderVoiceover.mjs --lang=en --only=gutta-percha --force
 *   node scripts/renderVoiceover.mjs --lang=en --only=bdm,bps --force   (comma list)
 *   node scripts/renderVoiceover.mjs --lang=en --dry-run
 *   node scripts/renderVoiceover.mjs --lang=en --reencode --tempo=1.15
 *
 * One file per UNIT, where a unit is one info-panel screen or one cable —
 * the granularity the narration button plays at. Recording a whole screen in
 * one call also keeps prosody consistent across its paragraphs.
 *
 * Re-runs are cheap and safe: the manifest stores a hash of each unit's spoken
 * text, and a unit whose copy has not changed is skipped. That matters because
 * Gemini TTS is NOT reproducible — re-rendering an approved unit would hand
 * back a different take, not the same file.
 *
 * Output:
 *   temp/voiceover/render/<lang>/*.wav   24 kHz masters, gitignored
 *   public/audio/vo/<lang>/*.mp3         64k mono, normalised, committed
 *   public/audio/vo/manifest.json        unit -> file, duration, hash
 *
 * Needs GOOGLE_API_KEY in the environment or in .env.local, and ffmpeg.
 */

import { writeFileSync, readFileSync, mkdirSync, existsSync } from "node:fs";
import { execFileSync, spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { join, dirname } from "node:path";

const MODEL = "gemini-3.1-flash-tts-preview";
/** The client's pick, 2026-08-27. Both languages. */
const VOICE = "Sulafat";

const SCRIPT_JSON = "docs/vo-table/vo-script.json";
const WAV_ROOT = "temp/voiceover/render";
const MP3_ROOT = "public/audio/vo";
const MANIFEST = join(MP3_ROOT, "manifest.json");

/** EBU R128 target. Speech on kiosk speakers.
 *
 * TP is -3, not the usual -1.5: loudnorm limits the PCM, but the MP3 encoder
 * then overshoots by more than a dB, and measuring the decoded file after a
 * -1.5 pass showed true peaks at -0.26 dBTP — close enough to clip on an
 * unforgiving DAC. -3 costs nothing audible at this level and lands the
 * shipped file around -1.5. */
const LOUDNESS = { I: -16, TP: -3, LRA: 11 };

/** Run before loudness measurement so both passes see the same signal.
 * Gemini occasionally hands back half a second of silence before the first
 * word; on a kiosk the narration button should speak immediately. Conservative
 * threshold and a 0.1s pad so a soft leading consonant survives. */
const TRIM =
  "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:" +
  "start_silence=0.1:detection=peak," +
  "areverse," +
  "silenceremove=start_periods=1:start_duration=0:start_threshold=-50dB:" +
  "start_silence=0.3:detection=peak," +
  "areverse";
const MP3_BITRATE = "64k";

/**
 * Direction prefix, spoken as direction and not read aloud. Same shape as the
 * casting round the client picked from — instructions, a colon, then the text.
 *
 * Naming Malaysia explicitly matters in both languages: left alone the model
 * drifts to Indonesian vowels in BM and anglicises Malay proper nouns in EN,
 * and a KL audience hears both instantly. The initialism line is for the cable
 * block, where nearly every name is one (SMW4, AAG, BBG, SKR1M) — but it must
 * carry the exception, because a blanket "letter by letter" made a take spell
 * SEA-ME-WE as "S-E-E-W-E".
 *
 * NOTE: the direction is deliberately NOT part of the take hash. Editing it
 * does not mark anything stale; re-render the affected units with --force.
 */
const DIRECTION = {
  bm:
    "Bacakan teks berikut dalam Bahasa Malaysia baku dengan nada hangat, " +
    "tenang dan berwibawa — seperti narator dokumentari muzium. Gunakan " +
    "sebutan Malaysia, bukan Indonesia. Eja huruf demi huruf bagi singkatan " +
    "yang tidak boleh disebut sebagai perkataan; nama yang boleh disebut, " +
    "sebutlah sebagai perkataan. Rentak sederhana dan jelas, dengan jeda " +
    "pendek antara perenggan:",
  en:
    "Read the following as museum exhibit narration, in a warm, calm, " +
    "authoritative tone. Measured pace, clear diction, a short pause between " +
    "paragraphs. Malaysian English: give Malay proper nouns their Malay " +
    "pronunciation rather than anglicising them. Read an initialism letter by " +
    "letter only when it cannot be said as a word; say pronounceable names as " +
    "words:",
};

/**
 * Pronunciation hints, applied ONLY to the text handed to the engine — never to
 * the script, the client's copy, or what the verifier compares against. Written
 * so that normalising both sides for comparison still lines up: "SEA-ME-WE" and
 * "Sea Me We" both reduce to "sea me we".
 *
 * These ARE part of the take hash, since they change what is actually spoken.
 */
const SAY_AS = [[/SEA-ME-WE/g, "Sea Me We"]];
const spoken = (t) => SAY_AS.reduce((acc, [re, to]) => acc.replace(re, to), t);

// ── args ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const arg = (k, d) => argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const lang = arg("lang", "en");
const block = arg("block", "all");
const only = arg("only");
const force = argv.includes("--force");
const dryRun = argv.includes("--dry-run");
/** Re-run trim/normalise/encode from the WAV masters, no API call. Lets the
 * audio chain be tuned without gambling on a fresh, different take. */
const reencode = argv.includes("--reencode");
/**
 * Playback speed applied to the master before encoding. The Gemini read comes
 * out around 106 wpm against the 145 the script quotes, and atempo is
 * pitch-preserving and transparent to roughly 1.15x — so the read that was
 * approved stays the read that ships, just tightened. Post-process only: it is
 * deliberately NOT part of the take hash, so changing it re-encodes rather than
 * buying a new and different take.
 */
const tempo = Number(arg("tempo", "1"));
if (!Number.isFinite(tempo) || tempo < 0.5 || tempo > 2) {
  die(`--tempo must be between 0.5 and 2 (got "${arg("tempo")}")`);
}

if (!["en", "bm"].includes(lang)) die(`--lang must be en or bm (got "${lang}")`);
if (!["info", "cables", "all"].includes(block)) die(`--block must be info, cables or all`);

function die(msg) {
  console.error(msg);
  process.exit(1);
}

// ── units ────────────────────────────────────────────────────────────────────

if (!existsSync(SCRIPT_JSON)) die(`${SCRIPT_JSON} missing — run: npx tsx scripts/buildVoScript.ts`);
const script = JSON.parse(readFileSync(SCRIPT_JSON, "utf8"));

/** A unit is the ref up to "#": one info screen, or one cable. */
const units = new Map();
for (const seg of script.segments) {
  const ref = seg.ref.split("#")[0];
  if (!units.has(ref)) {
    units.set(ref, {
      ref,
      block: ref.startsWith("cable/") ? "cables" : "info",
      where: seg.where,
      parts: [],
      flags: new Set(),
    });
  }
  const u = units.get(ref);
  u.parts.push(seg[lang]);
  if (lang === "bm" && !seg.bmApproved) u.flags.add("BM not signed off");
  if (seg.ours) u.flags.add("EN is ours, not client copy");
}

/** Filename: the ref with its separators flattened. Stable, greppable. */
const fileStem = (ref) => ref.replace(/\//g, "-");
const hashOf = (text) => createHash("sha1").update(`${MODEL}|${VOICE}|${lang}|${text}`).digest("hex").slice(0, 12);

let roster = [...units.values()]
  .filter((u) => block === "all" || u.block === block)
  .filter((u) => !only || only.split(",").some((o) => u.ref.includes(o.trim())));

for (const u of roster) {
  u.text = spoken(u.parts.join("\n\n").trim());
  u.hash = hashOf(u.text);
  u.stem = fileStem(u.ref);
}

const missing = roster.filter((u) => !u.text || u.text.includes("— NO BM —"));
if (missing.length) {
  console.error(`No ${lang.toUpperCase()} copy for: ${missing.map((u) => u.ref).join(", ")} — skipping.`);
  roster = roster.filter((u) => !missing.includes(u));
}
if (!roster.length) die("Nothing to render.");

// ── manifest ─────────────────────────────────────────────────────────────────

const manifest = existsSync(MANIFEST)
  ? JSON.parse(readFileSync(MANIFEST, "utf8"))
  : { voice: VOICE, model: MODEL, loudness: `${LOUDNESS.I} LUFS / ${LOUDNESS.TP} dBTP`, units: {} };
manifest.units[lang] ??= {};

const mp3Path = (u) => join(MP3_ROOT, lang, `${u.stem}.mp3`);
const isFresh = (u) => {
  const prev = manifest.units[lang][u.ref];
  return !force && prev?.hash === u.hash && existsSync(mp3Path(u));
};

const todo = reencode ? roster : roster.filter((u) => !isFresh(u));
const fresh = roster.length - todo.length;

console.log(
  `${MODEL} · ${VOICE} · ${lang.toUpperCase()} · block=${block}` +
    (tempo === 1 ? "" : ` · tempo=${tempo}x`),
);
console.log(
  reencode
    ? `${roster.length} unit(s): re-encoding from masters, no API calls.\n`
    : `${roster.length} unit(s): ${todo.length} to render, ${fresh} already current.\n`,
);
for (const u of roster) {
  const words = u.text.split(/\s+/).length;
  const state = reencode ? "ENCODE " : isFresh(u) ? "current" : "RENDER ";
  const flags = u.flags.size ? `  [${[...u.flags].join("; ")}]` : "";
  console.log(`  ${state}  ${u.ref.padEnd(38)} ${String(words).padStart(4)}w${flags}`);
}
if (dryRun) {
  console.log("\n--dry-run: nothing rendered.");
  process.exit(0);
}
if (!todo.length) {
  console.log("\nEverything current. Use --force to re-render (a new take, not the same file).");
  process.exit(0);
}

// ── key ──────────────────────────────────────────────────────────────────────

function apiKey() {
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  if (existsSync(".env.local")) {
    const m = readFileSync(".env.local", "utf8").match(/^GOOGLE_API_KEY=(.+)$/m);
    if (m) return m[1].trim();
  }
  die("No GOOGLE_API_KEY — set it in the environment or .env.local.");
}

// ── wav ──────────────────────────────────────────────────────────────────────

/** The API returns headerless little-endian PCM (audio/L16); give it a header. */
function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16);
  h.writeUInt16LE(1, 20);
  h.writeUInt16LE(1, 22);
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28);
  h.writeUInt16LE(2, 32);
  h.writeUInt16LE(16, 34);
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// ── synthesis ────────────────────────────────────────────────────────────────

async function synth(key, text) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${DIRECTION[lang]}\n\n${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE } } },
        },
      }),
    },
  );
  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 200)}`);

  const body = await res.json();
  const audio = (body.candidates?.[0]?.content?.parts ?? []).filter((p) => p.inlineData?.data);
  if (!audio.length) throw new Error(`no audio (finishReason: ${body.candidates?.[0]?.finishReason})`);

  const rate = Number(audio[0].inlineData.mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
  const pcm = Buffer.concat(audio.map((p) => Buffer.from(p.inlineData.data, "base64")));
  return { wav: wav(pcm, rate), seconds: pcm.length / (rate * 2) };
}

/** Transient 429/5xx are common on the preview endpoint; three tries, backing off. */
async function synthWithRetry(key, text) {
  let last;
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      return await synth(key, text);
    } catch (e) {
      last = e;
      if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 4000));
    }
  }
  throw last;
}

// ── loudness ─────────────────────────────────────────────────────────────────

const ff = (args) => execFileSync("ffmpeg", ["-hide_banner", "-y", ...args], { stdio: ["ignore", "pipe", "pipe"] });

/** Everything ahead of loudness measurement, so both passes see one signal. */
const PRE = tempo === 1 ? TRIM : `${TRIM},atempo=${tempo}`;

/**
 * Two-pass loudnorm. One pass would leave each take a couple of dB apart, which
 * on a kiosk reads as the volume jumping between screens. Measure, then correct.
 */
function normaliseToMp3(wavIn, mp3Out) {
  let measured = null;
  try {
    const probe = execFileSync(
      "ffmpeg",
      ["-hide_banner", "-i", wavIn, "-af",
       `${PRE},loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:print_format=json`,
       "-f", "null", "-"],
      { stdio: ["ignore", "pipe", "pipe"] },
    );
    const stderr = probe.toString() || "";
    measured = JSON.parse(stderr.slice(stderr.lastIndexOf("{"), stderr.lastIndexOf("}") + 1));
  } catch (e) {
    const stderr = (e.stderr?.toString() ?? "") + (e.stdout?.toString() ?? "");
    const start = stderr.lastIndexOf("{");
    if (start !== -1) {
      try {
        measured = JSON.parse(stderr.slice(start, stderr.lastIndexOf("}") + 1));
      } catch {}
    }
  }

  const norm = measured
    ? `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}` +
      `:measured_I=${measured.input_i}:measured_TP=${measured.input_tp}` +
      `:measured_LRA=${measured.input_lra}:measured_thresh=${measured.input_thresh}` +
      `:offset=${measured.target_offset}:linear=true`
    : `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}`;

  mkdirSync(dirname(mp3Out), { recursive: true });
  ff(["-i", wavIn, "-af", `${PRE},${norm}`, "-ac", "1", "-b:a", MP3_BITRATE, mp3Out]);
  return measured;
}

const duration = (file) =>
  Number(
    execFileSync("ffprobe", [
      "-v", "error", "-show_entries", "format=duration",
      "-of", "default=nw=1:nk=1", file,
    ]).toString().trim(),
  );

/** Integrated loudness of the finished file, measured the same way the target
 * is set. Reported per unit so a drifting take is visible in the run log. */
const loudnessOf = (file) => {
  const r = spawnSync("ffmpeg", [
    "-hide_banner", "-i", file, "-af",
    `loudnorm=I=${LOUDNESS.I}:TP=${LOUDNESS.TP}:LRA=${LOUDNESS.LRA}:print_format=json`,
    "-f", "null", "-",
  ], { encoding: "utf8" });
  const out = `${r.stderr ?? ""}${r.stdout ?? ""}`;
  const start = out.lastIndexOf("{");
  if (start === -1) return { i: NaN, tp: NaN };
  try {
    const m = JSON.parse(out.slice(start, out.lastIndexOf("}") + 1));
    return { i: Number(m.input_i), tp: Number(m.input_tp) };
  } catch {
    return { i: NaN, tp: NaN };
  }
};

// ── main ─────────────────────────────────────────────────────────────────────

try {
  execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
  execFileSync("ffprobe", ["-version"], { stdio: "ignore" });
} catch {
  die("ffmpeg/ffprobe not found — both are required for normalisation.");
}

const key = reencode ? null : apiKey();
const wavDir = join(WAV_ROOT, lang);
mkdirSync(wavDir, { recursive: true });

console.log(`\n${reencode ? "Re-encoding" : "Rendering"} ${todo.length} unit(s)…\n`);
const failures = [];
let totalSeconds = 0;

for (const [i, u] of todo.entries()) {
  const n = `${String(i + 1).padStart(2, "0")}/${todo.length}`;
  process.stdout.write(`  ${n}  ${u.ref.padEnd(38)} `);
  try {
    const wavOut = join(wavDir, `${u.stem}.wav`);
    let seconds;
    if (reencode) {
      if (!existsSync(wavOut)) throw new Error(`no master at ${wavOut}`);
      seconds = duration(wavOut);
    } else {
      const synthed = await synthWithRetry(key, u.text);
      writeFileSync(wavOut, synthed.wav);
      seconds = synthed.seconds;
    }

    const mp3Out = mp3Path(u);
    normaliseToMp3(wavOut, mp3Out);
    const secs = duration(mp3Out);
    totalSeconds += secs;

    manifest.units[lang][u.ref] = {
      file: `${lang}/${u.stem}.mp3`,
      seconds: Number(secs.toFixed(2)),
      hash: u.hash,
      words: u.text.split(/\s+/).length,
      tempo,
    };
    // Every hallucination found so far — an appended sentence, a description
    // spoken twice, a whole different cable invented — showed up first as audio
    // far longer than the word count can account for. Acronyms read letter by
    // letter legitimately drag the rate down, so the threshold is generous;
    // this is a prompt to go and verify, not a verdict.
    const wpm = (u.text.split(/\s+/).length / secs) * 60;
    const suspect = wpm < 45;

    const { i, tp } = loudnessOf(mp3Out);
    console.log(
      `${seconds.toFixed(1)}s -> ${secs.toFixed(1)}s  ` +
        `${i.toFixed(1)} LUFS / ${tp.toFixed(1)} dBTP` +
        (suspect ? `  ** ${wpm.toFixed(0)} wpm — verify, likely invented content` : ""),
    );
  } catch (e) {
    console.log(`FAILED — ${e.message}`);
    failures.push(`${u.ref}: ${e.message}`);
  }
}

manifest.voice = VOICE;
manifest.model = MODEL;
manifest.loudness = `${LOUDNESS.I} LUFS / ${LOUDNESS.TP} dBTP`;
mkdirSync(MP3_ROOT, { recursive: true });
writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + "\n");

const mmss = (s) => {
  const t = Math.round(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
};
console.log(`\n${todo.length - failures.length} rendered, ${mmss(totalSeconds)} of audio.`);
console.log(`  masters  ${wavDir}/`);
console.log(`  shipping ${join(MP3_ROOT, lang)}/`);
console.log(`  manifest ${MANIFEST}`);

if (failures.length) {
  console.error(`\n${failures.length} failed:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
