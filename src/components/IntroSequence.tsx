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
// Handoffs are masked by a short white flash. All three <video> tags stay
// mounted with preload="auto" so the swaps are instant (kiosk has the clips
// buffered); only the active clip is opaque + playing.

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const CLIP1 = "/video/tm-clip1-underwater-loop.mp4";
const CLIP2 = "/video/tm-clip2-emerge-globe.mp4";
const CLIP3 = "/video/tm-clip3-submerge-loop.mp4";

// White-flash duration that masks the submerge handoff.
// (clip1→clip2 is a direct cut — its frames match, no transition needed.)
const FLASH_MS = 240;
// clip2→globe handoff fades clip2's last frame out over the live globe, hiding
// any seam between the video and the real globe.
const REVEAL_FADE_MS = 650;
// Beat between "go submerge" and clip3 covering the screen, so the chrome's
// reverse-reveal (panels sliding back out) is visible over the live globe.
const SUBMERGE_LEAD_MS = 550;

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
  const [flashing, setFlashing] = useState(false);
  const [revealFading, setRevealFading] = useState(false);

  const v1Ref = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);
  const v3Ref = useRef<HTMLVideoElement>(null);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const submergeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const flash = useCallback(() => {
    setFlashing(true);
    if (flashTimer.current) clearTimeout(flashTimer.current);
    flashTimer.current = setTimeout(() => setFlashing(false), FLASH_MS);
  }, []);

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
    } else if (phase === "launching") {
      // Let the current clip1 frame play through to its 8s end — do NOT reset
      // currentTime; just stop looping so `ended` fires.
      if (v1) {
        v1.loop = false;
        void v1.play().catch(() => {});
      }
    } else if (phase === "emerge") {
      setCountdown(null);
      if (v2) {
        v2.currentTime = 0;
        void v2.play().catch(() => {});
      }
    } else if (phase === "submerge") {
      if (v3) {
        v3.currentTime = 0;
        void v3.play().catch(() => {});
      }
    } else if (phase === "live") {
      v1?.pause();
      v2?.pause();
      v3?.pause();
    }
  }, [phase]);

  // Parent asks to submerge: hold in live for a beat so the chrome reverse
  // animates over the globe, then flash and roll clip3.
  useEffect(() => {
    if (requestSubmerge && phase === "live") {
      submergeTimer.current = setTimeout(() => {
        flash();
        setPhase("submerge");
      }, SUBMERGE_LEAD_MS);
      return () => {
        if (submergeTimer.current) clearTimeout(submergeTimer.current);
      };
    }
  }, [requestSubmerge, phase, flash]);

  useEffect(
    () => () => {
      if (flashTimer.current) clearTimeout(flashTimer.current);
      if (revealTimer.current) clearTimeout(revealTimer.current);
      if (submergeTimer.current) clearTimeout(submergeTimer.current);
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

  // clip2 finished → hand the screen to the live globe. Fade clip2's last frame
  // out over the now-live globe (revealFading enables the v2 opacity transition;
  // setPhase('live') drops its `active`, so it animates 1→0) to hide the seam.
  const handleClip2Ended = useCallback(() => {
    if (phase === "emerge") {
      setRevealFading(true);
      setPhase("live");
      onReveal();
      if (revealTimer.current) clearTimeout(revealTimer.current);
      revealTimer.current = setTimeout(
        () => setRevealFading(false),
        REVEAL_FADE_MS,
      );
    }
  }, [phase, onReveal]);

  // clip3 finished → back to the attract loop; parent resets baseline.
  const handleClip3Ended = useCallback(() => {
    if (phase === "submerge") {
      setPhase("attract");
      onReachedIdle();
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
      <Clip refEl={v1Ref} src={CLIP1} active={phase === "attract" || phase === "launching"} onEnded={handleClip1Ended} onTimeUpdate={handleClip1Time} />
      <Clip refEl={v2Ref} src={CLIP2} active={phase === "emerge"} onEnded={handleClip2Ended} fadeMs={revealFading ? REVEAL_FADE_MS : 0} />
      <Clip refEl={v3Ref} src={CLIP3} active={phase === "submerge"} onEnded={handleClip3Ended} />

      {/* Attract prompt — centred. */}
      {phase === "attract" && (
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

      {/* Handoff flash. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background: "#FFFFFF",
          opacity: flashing ? 0.85 : 0,
          transition: `opacity ${FLASH_MS}ms ease`,
          pointerEvents: "none",
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
  fadeMs = 0,
}: {
  refEl: React.RefObject<HTMLVideoElement | null>;
  src: string;
  active: boolean;
  onEnded: () => void;
  onTimeUpdate?: () => void;
  /** When >0, opacity changes animate over this duration (used for the
   *  clip2→globe fade-out). Default 0 = instant swap (hard cut). */
  fadeMs?: number;
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
        transition: fadeMs ? `opacity ${fadeMs}ms ease` : "none",
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
