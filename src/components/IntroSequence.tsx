"use client";

// ───────── IntroSequence ─────────
// Video-driven idle/intro layer (v8). Replaces the old live-globe attract +
// emerge choreography with three pre-rendered clips:
//
//   attract   clip1 — underwater loop. "Tap anywhere to begin" prompt.
//   launching clip1 — plays out to its end (8s) with a centre countdown.
//   emerge    clip2 — emerge into the globe; last frame = globe's live pose.
//   live      —      video layer is transparent; globe + chrome run.
//   submerge  clip3 — live → back to idle, played over the globe.
//
// The clip2→globe and globe→clip3 handoffs are masked by a soft radial bloom;
// clip1→clip2 is a direct cut. All three <video> tags stay mounted with
// preload="auto" so the swaps are instant (kiosk has the clips buffered); only
// the active clip is opaque + playing.

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const CLIP1 = "/video/tm-clip1-underwater-loop.mp4";
const CLIP2 = "/video/tm-clip2-emerge-globe.mp4";
const CLIP3 = "/video/tm-clip3-submerge-loop.mp4";

// (clip1→clip2 is a direct cut — its frames match, no transition needed.)
// clip2→globe handoff: cut the emerge clip EARLY_CUT_SEC before its end (mid
// center→left move) and mask the cut with a soft radial bloom — it ramps up
// over BLOOM_RISE_MS, the clip→globe swap happens at the bloomed peak, then it
// recedes over BLOOM_FALL_MS revealing the live globe softly.
// The same bloom masks the globe→clip3 submerge (clip3 blends, no early cut).
const EARLY_CUT_SEC = 1.0;
const BLOOM_RISE_MS = 420;
const BLOOM_FALL_MS = 700;
// clip3→clip1: ease the submerge out by slowing the last second of clip3 to
// CLIP3_SLOW_RATE, then a quick digital glitch masks the swap back to the
// attract loop. The "tap to begin" prompt then fades in after PROMPT_DELAY_MS.
const CLIP3_SLOW_SEC = 1.0;
const CLIP3_SLOW_RATE = 0.5;
const GLITCH_MS = 450;
const PROMPT_DELAY_MS = 2000;

type Phase = "attract" | "launching" | "emerge" | "live" | "submerge";

export default function IntroSequence({
  language,
  requestSubmerge,
  onReveal,
  onReachedIdle,
}: {
  language: Language;
  /** Parent flips this true (idle reached, in live) to roll clip3 → idle. */
  requestSubmerge: boolean;
  /** clip2 finished — parent reveals the live globe + beams the network. */
  onReveal: () => void;
  /** clip3 finished — parent resets to the dormant/attract baseline. */
  onReachedIdle: () => void;
}) {
  const t = useT(language);
  // Starts in `live` (dormant + transparent): the app boots straight to the
  // live globe via the LoadingScreen. The attract loop is only entered after
  // the app goes idle and clip3 plays it back down. (v8)
  const [phase, setPhase] = useState<Phase>("live");
  const [countdown, setCountdown] = useState<number | null>(null);
  const [blooming, setBlooming] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [promptReady, setPromptReady] = useState(false);

  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);
  const v3Ref = useRef<HTMLVideoElement>(null);
  const bloomTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const glitchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards the early-cut so the clip2 timeupdate fires the reveal only once.
  const clip2CutRef = useRef(false);

  // Soft-bloom handoff: bloom up, run `atPeak` (the phase swap) at the bloomed
  // peak, then let the bloom recede over the new layer. Used for both clip2→
  // globe (reveal) and globe→clip3 (submerge).
  const bloom = useCallback((atPeak: () => void) => {
    bloomTimers.current.forEach(clearTimeout);
    setBlooming(true);
    bloomTimers.current = [
      setTimeout(() => {
        atPeak();
        setBlooming(false); // start the (slower) fall over the new layer
      }, BLOOM_RISE_MS),
    ];
  }, []);

  // clip2→globe reveal — fired once per emerge (early-cut timeupdate, or clip2
  // ending as a fallback).
  const bloomReveal = useCallback(() => {
    if (clip2CutRef.current) return;
    clip2CutRef.current = true;
    bloom(() => {
      setPhase("live");
      onReveal();
    });
  }, [bloom, onReveal]);

  // Drive playback off the phase. Only the active clip plays; clip1 loops only
  // while attracting.
  useEffect(() => {
    const v1 = v1Ref.current;
    const v2 = v2Ref.current;
    const v3 = v3Ref.current;
    if (phase === "attract") {
      if (v1) {
        v1.loop = true;
        v1.currentTime = 0;
        void v1.play().catch(() => {});
      }
      v2?.pause();
      v3?.pause();
      setCountdown(null);
      // Hold the "tap to begin" prompt back a couple of seconds after the loop
      // resumes, so it fades in once the underwater scene has settled.
      setPromptReady(false);
      if (promptTimer.current) clearTimeout(promptTimer.current);
      promptTimer.current = setTimeout(
        () => setPromptReady(true),
        PROMPT_DELAY_MS,
      );
    } else if (phase === "launching") {
      // Let the current clip1 frame play through to its 8s end — do NOT reset
      // currentTime; just stop looping so `ended` fires.
      if (v1) {
        v1.loop = false;
        void v1.play().catch(() => {});
      }
    } else if (phase === "emerge") {
      setCountdown(null);
      clip2CutRef.current = false; // arm the early-cut for this emerge
      if (v2) {
        v2.currentTime = 0;
        void v2.play().catch(() => {});
      }
    } else if (phase === "submerge") {
      if (v3) {
        v3.playbackRate = 1; // reset any slow-out from a prior cycle
        v3.currentTime = 0;
        void v3.play().catch(() => {});
      }
    } else if (phase === "live") {
      v1?.pause();
      v2?.pause();
      v3?.pause();
    }
  }, [phase]);

  // Parent flips requestSubmerge once the chrome has finished sliding out →
  // bloom the live globe into clip3 (clip3 blends, so no early cut).
  useEffect(() => {
    if (requestSubmerge && phase === "live") {
      bloom(() => setPhase("submerge"));
    }
  }, [requestSubmerge, phase, bloom]);

  useEffect(
    () => () => {
      bloomTimers.current.forEach(clearTimeout);
      if (glitchTimer.current) clearTimeout(glitchTimer.current);
      if (promptTimer.current) clearTimeout(promptTimer.current);
    },
    [],
  );

  // Begin the launch on the first touch while attracting.
  const handleTap = useCallback(() => {
    if (phase === "attract") setPhase("launching");
  }, [phase]);

  // clip1 reached 8s after a tap → direct cut into the emerge clip (no
  // transition for now; clip1's last frame matches clip2's first).
  const handleClip1Ended = useCallback(() => {
    if (phase === "launching") setPhase("emerge");
  }, [phase]);

  // clip1 timeupdate while launching → drive the centre countdown.
  const handleClip1Time = useCallback(() => {
    if (phase !== "launching") return;
    const v = v1Ref.current;
    if (!v || !v.duration) return;
    setCountdown(Math.max(0, Math.ceil(v.duration - v.currentTime)));
  }, [phase]);

  // clip2 timeupdate → early-cut: once it's within EARLY_CUT_SEC of the end
  // (mid center→left move), bloom-reveal the live globe.
  const handleClip2Time = useCallback(() => {
    if (phase !== "emerge") return;
    const v = v2Ref.current;
    if (!v || !v.duration) return;
    if (v.currentTime >= v.duration - EARLY_CUT_SEC) bloomReveal();
  }, [phase, bloomReveal]);

  // Fallback: if clip2 reaches its end before the early-cut fired, reveal now.
  const handleClip2Ended = useCallback(() => {
    if (phase === "emerge") bloomReveal();
  }, [phase, bloomReveal]);

  // clip3 timeupdate → ease the submerge out: slow the final second to
  // slow-motion before the glitch hands back to the attract loop.
  const handleClip3Time = useCallback(() => {
    if (phase !== "submerge") return;
    const v = v3Ref.current;
    if (!v || !v.duration) return;
    if (v.currentTime >= v.duration - CLIP3_SLOW_SEC && v.playbackRate !== CLIP3_SLOW_RATE) {
      v.playbackRate = CLIP3_SLOW_RATE;
    }
  }, [phase]);

  // clip3 finished → glitch-cut back to the attract loop; parent resets baseline.
  const handleClip3Ended = useCallback(() => {
    if (phase === "submerge") {
      setGlitching(true);
      setPhase("attract");
      onReachedIdle();
      if (glitchTimer.current) clearTimeout(glitchTimer.current);
      glitchTimer.current = setTimeout(() => setGlitching(false), GLITCH_MS);
    }
  }, [phase, onReachedIdle]);

  // The layer covers the globe except in `live` (where it must let touches
  // through and stay transparent so the globe shows).
  const covering = phase !== "live";

  return (
    <div
      onPointerDown={handleTap}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: covering ? "#000" : "transparent",
        pointerEvents: covering ? "auto" : "none",
        cursor: phase === "attract" ? "pointer" : "default",
        overflow: "hidden",
      }}
    >
      {/* Video stack — glitches during the clip3→clip1 handoff. */}
      <div
        className={glitching ? "intro-glitch" : undefined}
        style={{ position: "absolute", inset: 0 }}
      >
        <Clip refEl={v1Ref} src={CLIP1} active={phase === "attract" || phase === "launching"} onEnded={handleClip1Ended} onTimeUpdate={handleClip1Time} />
        <Clip refEl={v2Ref} src={CLIP2} active={phase === "emerge"} onEnded={handleClip2Ended} onTimeUpdate={handleClip2Time} />
        <Clip refEl={v3Ref} src={CLIP3} active={phase === "submerge"} onEnded={handleClip3Ended} onTimeUpdate={handleClip3Time} />
      </div>

      {/* Attract prompt — centred. Fades in PROMPT_DELAY_MS after the loop
          resumes (promptReady). */}
      {phase === "attract" && promptReady && (
        <div style={promptWrap}>
          <span className="v1-pulse" style={promptText}>
            {t("tapToBegin")}
          </span>
        </div>
      )}

      {/* Launch countdown — centred. */}
      {phase === "launching" && countdown !== null && (
        <div style={promptWrap}>
          <span style={countdownText}>
            {t("startingIn")} {countdown}s
          </span>
        </div>
      )}

      {/* Soft bloom / light-bleed — masks the clip2→globe early cut. Radial,
          biased toward the globe (left of centre), brighter in the core. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 40% 50%, rgba(224,240,255,0.92) 0%, rgba(150,200,255,0.5) 28%, rgba(80,140,220,0.16) 52%, transparent 70%)",
          opacity: blooming ? 1 : 0,
          transition: `opacity ${blooming ? BLOOM_RISE_MS : BLOOM_FALL_MS}ms ease`,
          pointerEvents: "none",
          mixBlendMode: "screen",
        }}
      />
    </div>
  );
}

function Clip({
  refEl,
  src,
  active,
  onEnded,
  onTimeUpdate,
}: {
  refEl: React.RefObject<HTMLVideoElement | null>;
  src: string;
  active: boolean;
  onEnded: () => void;
  onTimeUpdate?: () => void;
}) {
  return (
    <video
      ref={refEl}
      src={src}
      muted
      playsInline
      preload="auto"
      onEnded={onEnded}
      onTimeUpdate={onTimeUpdate}
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        objectFit: "cover",
        opacity: active ? 1 : 0,
        // Instant opacity swap — the bloom overlay masks the cut.
        transition: "none",
        pointerEvents: "none",
      }}
    />
  );
}

const promptWrap: React.CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  pointerEvents: "none",
};

const promptText: React.CSSProperties = {
  fontFamily: "var(--v1-heading)",
  fontWeight: 500,
  fontSize: 28,
  letterSpacing: "0.30em",
  textTransform: "uppercase",
  color: "var(--v1-fg)",
  padding: "16px 32px",
  background: "rgba(0, 0, 0, 0.45)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
};

const countdownText: React.CSSProperties = {
  fontFamily: "var(--v1-heading)",
  fontWeight: 500,
  fontSize: 24,
  letterSpacing: "0.24em",
  textTransform: "uppercase",
  color: "var(--v1-fg)",
  padding: "14px 30px",
  background: "rgba(0, 0, 0, 0.45)",
  border: "1px solid rgba(255, 255, 255, 0.25)",
};
