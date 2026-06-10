// Decrypt-style text resolve for panel titles and key values.
//
// On mount AND whenever the target text changes (cable switch, language
// flip), the string spends ~280ms as shifting random glyphs that settle
// into the real characters left to right — the terminal "decrypting" look.
// Spaces stay spaces so multi-word titles don't jitter their word breaks.
//
// One interval per hook instance, alive only while animating. Runs once
// per change, never loops — kiosk-safe.

import { useEffect, useState } from "react";

const GLYPHS = "ABCDEFGHKMNPRSTUVXYZ0123456789#<>/=+";
const TICK_MS = 30;

function scrambleTail(text: string, resolvedCount: number): string {
  let out = text.slice(0, resolvedCount);
  for (let i = resolvedCount; i < text.length; i++) {
    out +=
      text[i] === " "
        ? " "
        : GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  }
  return out;
}

export function useScramble(text: string, durationMs = 280): string {
  // First paint shows the real text (SSR-safe — no random output during
  // hydration); the scramble kicks in on the first effect tick.
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    const steps = Math.max(1, Math.round(durationMs / TICK_MS));
    let frame = 0;
    setDisplay(scrambleTail(text, 0));
    const id = setInterval(() => {
      frame++;
      if (frame >= steps) {
        setDisplay(text);
        clearInterval(id);
        return;
      }
      const resolved = Math.floor((text.length * frame) / steps);
      setDisplay(scrambleTail(text, resolved));
    }, TICK_MS);
    return () => clearInterval(id);
  }, [text, durationMs]);

  return display;
}
