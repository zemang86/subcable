/**
 * Voice-casting demo for the kiosk narration.
 *
 * Renders the same Bahasa Malaysia script through a shortlist of Gemini TTS
 * prebuilt voices so the client can audition them side by side and pick one.
 * This is a casting tool, not part of the app build — nothing here ships.
 *
 * Output lands in temp/voiceover/<lang>/ (gitignored) as both WAV (the raw
 * 24 kHz PCM the API returns, wrapped in a header) and MP3 (small enough to
 * WhatsApp to the client). ffmpeg does the MP3 step; skipped if absent.
 *
 *   node scripts/tts-voice-demo.mjs              # BM, the 10-voice shortlist
 *   node scripts/tts-voice-demo.mjs --lang=en    # same voices, English script
 *   node scripts/tts-voice-demo.mjs --all        # all 30 voices, short line
 *   node scripts/tts-voice-demo.mjs --voice=Kore # just one
 *
 * Needs GOOGLE_API_KEY in the environment or in .env.local.
 */

import { writeFileSync, mkdirSync, readFileSync, existsSync } from "node:fs";
import { execFileSync } from "node:child_process";
import { join } from "node:path";

const MODEL = "gemini-3.1-flash-tts-preview";
const OUT_ROOT = "temp/voiceover";

/**
 * The casting shortlist. Style words in the comments are Google's own labels
 * from the voice table; the male/female read is approximate — the API does not
 * publish a gender field, so treat it as a hint for balancing the lineup, not
 * as fact. Ten is deliberate: enough to hear real range, short enough that a
 * client will sit through the whole set in one go.
 */
const SHORTLIST = [
  { name: "Charon", style: "Informative", read: "male" },
  { name: "Sadaltager", style: "Knowledgeable", read: "male" },
  { name: "Iapetus", style: "Clear", read: "male" },
  { name: "Algieba", style: "Smooth", read: "male" },
  { name: "Schedar", style: "Even", read: "male" },
  { name: "Sulafat", style: "Warm", read: "female" },
  { name: "Erinome", style: "Clear", read: "female" },
  { name: "Kore", style: "Firm", read: "female" },
  { name: "Vindemiatrix", style: "Gentle", read: "female" },
  { name: "Achernar", style: "Soft", read: "female" },
];

/** Every prebuilt voice, for the --all sweep. */
const ALL_VOICES = [
  "Zephyr", "Puck", "Charon", "Kore", "Fenrir", "Leda", "Orus", "Aoede",
  "Callirrhoe", "Autonoe", "Enceladus", "Iapetus", "Umbriel", "Algieba",
  "Despina", "Erinome", "Algenib", "Rasalgethi", "Laomedeia", "Achernar",
  "Alnilam", "Schedar", "Gacrux", "Pulcherrima", "Achird", "Zubenelgenubi",
  "Vindemiatrix", "Sadachbia", "Sadaltager", "Sulafat",
];

/**
 * Direction prefix. Naming Malaysia explicitly matters: left alone the model
 * drifts toward Indonesian vowels and intonation, which a KL audience hears
 * immediately. The prefix is spoken as direction, not read aloud.
 */
const DIRECTION = {
  bm:
    "Bacakan teks berikut dalam Bahasa Malaysia baku dengan nada hangat, " +
    "tenang dan berwibawa — seperti narator dokumentari muzium. Gunakan " +
    "sebutan Malaysia, bukan Indonesia. Rentak sederhana dan jelas, dengan " +
    "jeda pendek antara perenggan:",
  en:
    "Read the following in a warm, calm, authoritative museum-documentary " +
    "tone. Measured pace, clear diction, a short pause between paragraphs:",
};

/**
 * The audition script. Real kiosk copy, not filler — the client should hear the
 * words they signed off on. Deliberately includes the things that break Malay
 * TTS: a decade written as digits ("1870-an"), an English place name, an
 * initialism (TM), and a borrowed technical term ("fiber optik"). If a voice
 * fumbles those, better to find out now than after the recording session.
 *
 * BM sources: i18n.ts attractCopy, generalInfo.ts overview + era-then/now.
 */
const SCRIPT = {
  bm: [
    "Selamat datang.",
    "Terokai peta interaktif kabel dasar laut dan jejaki hubungan yang menyambungkan Malaysia ke rangkaian telekomunikasi global.",
    "Kabel komunikasi dasar laut ialah kabel yang terletak di dasar laut di antara stesen daratan bagi membawa isyarat telekomunikasi merentasi lautan.",
    "Sejak tahun 1870-an lagi, Malaysia telahpun boleh berkomunikasi secara langsung dengan pihak di Britain dan Madras melalui talian telegraf dasar laut.",
    "Hari ini, kabel dasar laut moden menggunakan teknologi fiber optik untuk menghantar data dalam bentuk denyutan cahaya, dan TM terus menyediakan infrastruktur telekomunikasi yang termaju untuk negara.",
  ].join("\n\n"),
  en: [
    "Welcome.",
    "Explore an interactive map of submarine cables and trace the connections that link Malaysia to the global telecommunications network.",
    "A submarine communications cable is a cable laid on the sea bed between land stations to carry telecommunication signals across stretches of ocean.",
    "As early as the 1870s, Malaysia could already communicate directly with Britain and Madras over submarine telegraph lines.",
    "Today, modern submarine cables use fibre optic technology to send data as pulses of light, and TM continues to provide the country with the most advanced telecommunications infrastructure.",
  ].join("\n\n"),
};

/** One short line, for the 30-voice sweep where nobody wants 30 × 40 seconds. */
const ONE_LINER = {
  bm: "Terokai peta interaktif kabel dasar laut yang menyambungkan Malaysia ke rangkaian telekomunikasi global.",
  en: "Explore an interactive map of submarine cables connecting Malaysia to the global telecommunications network.",
};

// ── Key ──────────────────────────────────────────────────────────────────────

function apiKey() {
  if (process.env.GOOGLE_API_KEY) return process.env.GOOGLE_API_KEY;
  if (existsSync(".env.local")) {
    const m = readFileSync(".env.local", "utf8").match(
      /^GOOGLE_API_KEY=(.+)$/m,
    );
    if (m) return m[1].trim();
  }
  console.error("No GOOGLE_API_KEY — set it in the environment or .env.local.");
  process.exit(1);
}

// ── WAV ──────────────────────────────────────────────────────────────────────

/**
 * The API hands back headerless little-endian PCM (audio/L16). Prepend the
 * 44-byte canonical WAV header so QuickTime, ffmpeg and the browser will all
 * open it. Sample rate comes off the response mimeType, not a constant, in case
 * a future model changes it.
 */
function wav(pcm, rate) {
  const h = Buffer.alloc(44);
  h.write("RIFF", 0);
  h.writeUInt32LE(36 + pcm.length, 4);
  h.write("WAVE", 8);
  h.write("fmt ", 12);
  h.writeUInt32LE(16, 16); // PCM chunk size
  h.writeUInt16LE(1, 20); // format = PCM
  h.writeUInt16LE(1, 22); // mono
  h.writeUInt32LE(rate, 24);
  h.writeUInt32LE(rate * 2, 28); // byte rate: mono × 16-bit
  h.writeUInt16LE(2, 32); // block align
  h.writeUInt16LE(16, 34); // bits per sample
  h.write("data", 36);
  h.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([h, pcm]);
}

// ── Synthesis ────────────────────────────────────────────────────────────────

async function synth(key, voice, text, lang) {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${key}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${DIRECTION[lang]}\n\n${text}` }] }],
        generationConfig: {
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: voice } },
          },
        },
      }),
    },
  );

  if (!res.ok) throw new Error(`${res.status} ${(await res.text()).slice(0, 300)}`);

  const body = await res.json();
  const parts = body.candidates?.[0]?.content?.parts ?? [];
  const audio = parts.filter((p) => p.inlineData?.data);
  if (!audio.length) {
    throw new Error(
      `no audio returned (finishReason: ${body.candidates?.[0]?.finishReason})`,
    );
  }

  const rate = Number(audio[0].inlineData.mimeType.match(/rate=(\d+)/)?.[1] ?? 24000);
  const pcm = Buffer.concat(
    audio.map((p) => Buffer.from(p.inlineData.data, "base64")),
  );
  return { wav: wav(pcm, rate), seconds: pcm.length / (rate * 2) };
}

// ── Main ─────────────────────────────────────────────────────────────────────

const argv = process.argv.slice(2);
const arg = (k, d) => argv.find((a) => a.startsWith(`--${k}=`))?.split("=")[1] ?? d;
const lang = arg("lang", "bm");
const all = argv.includes("--all");
const only = arg("voice");

if (!SCRIPT[lang]) {
  console.error(`--lang must be bm or en (got "${lang}")`);
  process.exit(1);
}

const roster = only
  ? [{ name: only, style: "", read: "" }]
  : all
    ? ALL_VOICES.map((name) => ({ name, style: "", read: "" }))
    : SHORTLIST;

const text = all ? ONE_LINER[lang] : SCRIPT[lang];
const outDir = join(OUT_ROOT, all ? `${lang}-sweep` : lang);
mkdirSync(outDir, { recursive: true });

const hasFfmpeg = (() => {
  try {
    execFileSync("ffmpeg", ["-version"], { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();

const key = apiKey();
console.log(
  `${MODEL} · ${lang.toUpperCase()} · ${roster.length} voice(s) · ~${text.length} chars → ${outDir}/`,
);

const failures = [];
for (const [i, v] of roster.entries()) {
  const n = String(i + 1).padStart(2, "0");
  const stem = join(outDir, [n, v.name, v.style, v.read].filter(Boolean).join("-"));
  process.stdout.write(`  ${n}. ${v.name.padEnd(14)} `);
  try {
    const { wav: buf, seconds } = await synth(key, v.name, text, lang);
    writeFileSync(`${stem}.wav`, buf);
    if (hasFfmpeg) {
      execFileSync(
        "ffmpeg",
        ["-y", "-i", `${stem}.wav`, "-b:a", "128k", `${stem}.mp3`],
        { stdio: "ignore" },
      );
    }
    console.log(`${seconds.toFixed(1)}s`);
  } catch (e) {
    console.log(`FAILED — ${e.message}`);
    failures.push(`${v.name}: ${e.message}`);
  }
}

if (failures.length) {
  console.error(`\n${failures.length} failed:\n  ${failures.join("\n  ")}`);
  process.exit(1);
}
console.log(`\nDone. Audition with:  open ${outDir}`);
