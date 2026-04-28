// Web Audio morse code beeps. Single shared AudioContext, lazily created on
// first user gesture so we comply with browser autoplay policies.
import { MORSE } from "./morse";

let ctx: AudioContext | null = null;

const FREQ = 650;
const UNIT_MS = 80;       // 1 unit = dot length
const DASH_UNITS = 3;
const INTRA_LETTER_GAP = 1; // between symbols of same letter
const LETTER_GAP = 3;       // between letters
const WORD_GAP = 7;         // between words

function ensureCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx && ctx.state !== "closed") {
    if (ctx.state === "suspended") void ctx.resume();
    return ctx;
  }
  const Ctor =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext })
      .webkitAudioContext;
  if (!Ctor) return null;
  ctx = new Ctor();
  return ctx;
}

function beep(durationMs: number, startAt = 0, gain = 0.18) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + startAt;
  const t1 = t0 + durationMs / 1000;

  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.value = FREQ;

  const g = c.createGain();
  // Tiny attack/release ramps so we don't hear clicks at the edges.
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.005);
  g.gain.setValueAtTime(gain, Math.max(t0 + 0.005, t1 - 0.005));
  g.gain.linearRampToValueAtTime(0, t1);

  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t1 + 0.01);
}

function clickDown(freq = 220, gain = 0.08) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime;
  const osc = c.createOscillator();
  osc.type = "square";
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.002);
  g.gain.linearRampToValueAtTime(0, t0 + 0.04);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + 0.05);
}

export function playDot() { beep(UNIT_MS); }
export function playDash() { beep(UNIT_MS * DASH_UNITS); }
export function playLetterCommit() { clickDown(440, 0.05); }
export function playSpace() { clickDown(330, 0.05); }
export function playBackspace() { clickDown(180, 0.07); }

// Internal: tone at a given frequency for a given duration, scheduled at
// `startSec` from now. Used by the dialing/connect sequences.
function tone(
  freq: number,
  durationMs: number,
  startSec = 0,
  gain = 0.14,
  type: OscillatorType = "sine"
) {
  const c = ensureCtx();
  if (!c) return;
  const t0 = c.currentTime + startSec;
  const t1 = t0 + durationMs / 1000;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.value = freq;
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(gain, t0 + 0.008);
  g.gain.setValueAtTime(gain, Math.max(t0 + 0.008, t1 - 0.012));
  g.gain.linearRampToValueAtTime(0, t1);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t1 + 0.01);
}

// "Dialing" — 5 quick descending DTMF-flavoured pips. ~1200ms total.
export function playDialing(): number {
  const pips = [880, 740, 660, 580, 520];
  const pipMs = 110;
  const gapMs = 120;
  let t = 0;
  for (const f of pips) {
    tone(f, pipMs, t / 1000, 0.16, "sine");
    t += pipMs + gapMs;
  }
  return t;
}

// "Connecting" — a single rising tone that holds, like a line lock-on.
export function playConnect(): number {
  const c = ensureCtx();
  if (!c) return 800;
  const t0 = c.currentTime;
  const dur = 0.9;
  const osc = c.createOscillator();
  osc.type = "sine";
  osc.frequency.setValueAtTime(420, t0);
  osc.frequency.linearRampToValueAtTime(820, t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(0.1, t0 + 0.05);
  g.gain.setValueAtTime(0.1, t0 + dur - 0.08);
  g.gain.linearRampToValueAtTime(0, t0 + dur);
  osc.connect(g).connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
  return Math.round(dur * 1000);
}

// Encode a decoded message back to morse and play it as a timed beep
// sequence. Used when the call is sent — the audio rides alongside the
// visual pulse so the user can hear what they typed.
export function playMessage(text: string, totalMs?: number) {
  const c = ensureCtx();
  if (!c) return;

  // Build the full unit sequence as a list of (durationUnits, isSilence) pairs.
  type Beat = { units: number; silent: boolean };
  const beats: Beat[] = [];
  const upper = text.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    const ch = upper[i];
    if (ch === " ") {
      // Replace any trailing letter gap with a word gap.
      if (beats.length && beats[beats.length - 1].silent) beats.pop();
      beats.push({ units: WORD_GAP, silent: true });
      continue;
    }
    const code = MORSE[ch];
    if (!code) continue;
    for (let j = 0; j < code.length; j++) {
      const sym = code[j];
      beats.push({ units: sym === "." ? 1 : DASH_UNITS, silent: false });
      if (j < code.length - 1)
        beats.push({ units: INTRA_LETTER_GAP, silent: true });
    }
    if (i < upper.length - 1 && upper[i + 1] !== " ") {
      beats.push({ units: LETTER_GAP, silent: true });
    }
  }

  // If the caller wants the whole sequence to fit in `totalMs`, scale the
  // unit length so it does (clamped so it stays audible).
  const totalUnits = beats.reduce((s, b) => s + b.units, 0);
  let unitMs = UNIT_MS;
  if (totalMs && totalUnits > 0) {
    unitMs = Math.max(40, Math.min(120, totalMs / totalUnits));
  }

  let offsetSec = 0;
  for (const b of beats) {
    if (!b.silent) beep(b.units * unitMs, offsetSec);
    offsetSec += (b.units * unitMs) / 1000;
  }
}
