"use client";

import { useEffect, useRef } from "react";
import voManifest from "@/data/voManifest.json";
import type { Language } from "@/lib/types";

/**
 * Plays the pre-rendered narration for whatever the visitor is looking at.
 *
 * Clips are baked, never synthesised at runtime — the kiosk may be offline, and
 * the TTS engine is not reproducible, so a runtime call would say something
 * subtly different every time. `scripts/renderVoiceover.mjs` produces both the
 * audio and the manifest imported here; re-run it after any copy change.
 *
 * A "unit" is one info-panel screen (`overview/connecting-the-world`) or one
 * cable (`cable/smw4`) — the granularity the narration was recorded at.
 * Anything without a clip, the two video screens included, simply falls silent:
 * those carry their own audio.
 */

type ManifestEntry = { file: string; seconds: number };
const units = voManifest.units as Record<string, Record<string, ManifestEntry>>;

/** True when a clip exists — lets callers dim a control rather than lie about it. */
export function hasNarration(language: Language, unitRef: string | null): boolean {
  return Boolean(unitRef && units[language]?.[unitRef]);
}

export function useNarration(
  enabled: boolean,
  language: Language,
  unitRef: string | null,
): void {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // One element for the component's lifetime. Assigning `src` on a single
  // element cancels whatever it was playing, so moving between screens can
  // never leave two clips talking over each other.
  useEffect(() => {
    const el = (audioRef.current ??= new Audio());
    el.preload = "none";
    return () => {
      el.pause();
      el.removeAttribute("src");
      el.load();
      audioRef.current = null;
    };
  }, []);

  useEffect(() => {
    const el = audioRef.current;
    if (!el) return;

    const entry = enabled && unitRef ? units[language]?.[unitRef] : undefined;
    if (!entry) {
      el.pause();
      return;
    }

    el.src = `/audio/vo/${entry.file}`;
    el.currentTime = 0;
    // Autoplay is refused until the page has been interacted with. On the
    // kiosk a touch always precedes a selection, so this only ever fires in a
    // dev tab opened and left alone — not worth surfacing to the visitor.
    void el.play().catch(() => {});
  }, [enabled, language, unitRef]);
}
