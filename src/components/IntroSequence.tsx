"use client";

// ───────── IntroSequence ─────────
// Video-driven idle/intro layer (v8). Replaces the old live-globe attract +
// emerge choreography with three pre-rendered clips:
//
//   attract   clip1 — underwater dolly loop (two layered elements crossfade at
//                     the seam, see LOOP_FADE_MS). "Tap anywhere to begin".
//   launching clip1 — the lead element plays to its 8s end with a countdown.
//   emerge    clip2 — emerge into the globe; last frame = globe's live pose.
//   live      —      video layer is transparent; globe + chrome run.
//   submerge  clip3 — live → back to idle, played over the globe.
//
// The clip2→globe and globe→clip3 handoffs are masked by a soft radial bloom;
// clip1→clip2, clip3→clip1, and the clip1 attract loop itself are crossfades.
// All four <video> tags (clip1 ×2, clip2, clip3) stay mounted with
// preload="auto" AND are primed (decoded to frame 0) on mount so swaps are
// instant (kiosk has the clips buffered); only the active clip is opaque +
// playing.
//
// Stale-frame rule: a <video> keeps painting its last decoded frame until
// seeked. So every clip is PARKED at frame 0 the instant it stops being shown
// (while still hidden/masked) — never left holding a tail frame that would
// flash on its next reveal (globe peeking on clip1→clip2, the surfaced
// frame peeking on clip3→clip1). Crossfades add a second layer of safety:
// gradual opacity hides any residual first-paint frame.

import { useCallback, useEffect, useRef, useState } from "react";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

const CLIP1 = "/video/tm-clip1-underwater-dolly-v2.mp4";
const CLIP2 = "/video/tm-clip2-emerge-globe.mp4";
const CLIP3 = "/video/tm-clip3-submerge-loop.mp4";

// clip1→clip2 handoff: clip2 fades IN over clip1 (held on its matching end
// frame beneath) across CROSSFADE_MS — a soft dissolve so the emerge "merges"
// naturally rather than hard-cutting.
// clip2→globe handoff: cut the emerge clip EARLY_CUT_SEC before its end (mid
// center→left move) and mask the cut with a soft radial bloom — it ramps up
// over BLOOM_RISE_MS, the clip→globe swap happens at the bloomed peak, then it
// recedes over BLOOM_FALL_MS revealing the live globe softly.
// The same bloom masks the globe→clip3 submerge (clip3 blends, no early cut).
const EARLY_CUT_SEC = 1.0;
const BLOOM_RISE_MS = 420;
const BLOOM_FALL_MS = 700;
// clip3→clip1: crossfade/dissolve over CROSSFADE_MS. After the loop resumes
// the "tap to begin" prompt fades in after PROMPT_DELAY_MS.
const CROSSFADE_MS = 650;
const PROMPT_DELAY_MS = 2000;
// clip1→clip2 (emerge start): longer dissolve so clip2's motion has time to
// diverge from clip1's frozen matching end frame (a shorter fade reads as a
// hard cut because the boundary frames are identical).
const EMERGE_FADE_MS = 1800;
// clip1→clip2 bloom — its own swell, CENTERED (the globe is still centre at the
// emerge start; the shared reveal/submerge bloom is biased left for the
// center→left move). Independent rise/fall so it can be tuned alone.
const EMERGE_BLOOM_RISE_MS = 420;
const EMERGE_BLOOM_FALL_MS = 700;
// clip1 attract loop is a dolly (start frame ≠ end frame), so native looping
// jump-cuts at the seam. Two layered clip1 elements (A/B) crossfade instead: as
// the lead nears its end, the other starts from frame 0 and dissolves in over
// LOOP_FADE_MS, hiding the seam. Roles then swap, ping-ponging forever.
const LOOP_FADE_MS = 900;
const LOOP_FADE_S = LOOP_FADE_MS / 1000;

type Phase = "attract" | "launching" | "emerge" | "live" | "submerge";
type Lead = "a" | "b";

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
  const [crossfading, setCrossfading] = useState(false); // clip3→clip1 dissolve
  const [emergeFading, setEmergeFading] = useState(false); // clip1→clip2 dissolve
  const [emergeBlooming, setEmergeBlooming] = useState(false); // clip1→clip2 swell
  const [promptReady, setPromptReady] = useState(false);
  // clip1 crossfade-loop bookkeeping: which of the two clip1 elements is the
  // current lead, and whether a seam crossfade is in progress (drives opacity).
  const [attractLead, setAttractLead] = useState<Lead>("a");
  const [loopFading, setLoopFading] = useState(false);

  // Two layered clip1 elements for the seamless dolly loop (see LOOP_FADE_MS).
  const v1aRef = useRef<HTMLVideoElement>(null);
  const v1bRef = useRef<HTMLVideoElement>(null);
  const v2Ref = useRef<HTMLVideoElement>(null);
  const v3Ref = useRef<HTMLVideoElement>(null);
  // Mirror lead/fade in refs so the timeupdate/ended handlers read fresh values
  // without being torn down and rebound on every swap.
  const attractLeadRef = useRef<Lead>("a");
  const loopFadingRef = useRef(false);
  const bloomTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const crossfadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emergeFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const emergeBloomTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const loopFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const promptTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Guards the early-cut so the clip2 timeupdate fires the reveal only once.
  const clip2CutRef = useRef(false);

  const leadEl = useCallback(
    (id: Lead) => (id === "a" ? v1aRef.current : v1bRef.current),
    [],
  );

  // Crossfade the attract loop to the other clip1 element at the seam: start the
  // incoming from frame 0, flip the lead (opacity transition does the dissolve),
  // then park the outgoing at 0 once the fade completes.
  const loopSwap = useCallback(() => {
    if (loopFadingRef.current) return; // a fade is already running
    const next: Lead = attractLeadRef.current === "a" ? "b" : "a";
    const incoming = leadEl(next);
    if (incoming) {
      incoming.loop = false;
      incoming.currentTime = 0;
      void incoming.play().catch(() => {});
    }
    loopFadingRef.current = true;
    setLoopFading(true);
    attractLeadRef.current = next;
    setAttractLead(next);
    if (loopFadeTimer.current) clearTimeout(loopFadeTimer.current);
    loopFadeTimer.current = setTimeout(() => {
      loopFadingRef.current = false;
      setLoopFading(false);
      const outgoing = leadEl(next === "a" ? "b" : "a");
      if (outgoing) {
        outgoing.pause();
        outgoing.currentTime = 0;
      }
    }, LOOP_FADE_MS);
  }, [leadEl]);

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

  // Prime all clips on mount: kick off buffering and warm each decoder so the
  // first frame is ready instantly when a clip is first revealed (no decode
  // stall on a cold kiosk). Muted videos are allowed to autoplay; we play a
  // tick then pause + park at 0. All start inactive (phase "live"), so this is
  // invisible. preload="auto" already buffers; this also forces frame decode.
  useEffect(() => {
    [v1aRef, v1bRef, v2Ref, v3Ref].forEach((r) => {
      const v = r.current;
      if (!v) return;
      v.load();
      void v
        .play()
        .then(() => {
          v.pause();
          v.currentTime = 0;
        })
        .catch(() => {});
    });
  }, []);

  // Drive playback off the phase. Only the active clip plays; clip1 loops only
  // while attracting.
  useEffect(() => {
    const v1a = v1aRef.current;
    const v1b = v1bRef.current;
    const v2 = v2Ref.current;
    const v3 = v3Ref.current;
    if (phase === "attract") {
      // Start the crossfade loop fresh on the lead element (reset to A in the
      // handler that enters attract): lead plays from 0, the other parked.
      // Looping is manual (native loop off) so the seam crossfade can run.
      if (v1a) {
        v1a.loop = false;
        v1a.currentTime = 0;
        void v1a.play().catch(() => {});
      }
      if (v1b) {
        v1b.pause();
        v1b.currentTime = 0;
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
      // Play the current lead clip1 through to its 8s end (no swap — looping is
      // gated to the attract phase) and park the other element out of the way.
      const lead = leadEl(attractLeadRef.current);
      const back = leadEl(attractLeadRef.current === "a" ? "b" : "a");
      if (lead) {
        lead.loop = false;
        void lead.play().catch(() => {});
      }
      if (back) {
        back.pause();
        back.currentTime = 0;
      }
    } else if (phase === "emerge") {
      setCountdown(null);
      clip2CutRef.current = false; // arm the early-cut for this emerge
      // clip1→clip2 handoff: clip2 fades in over clip1, held on its matching 8s
      // end frame beneath (clip1 stays `active` while emergeFading). The frames
      // match, so the dissolve alone reads as a cut — a soft bloom swell over
      // the seam gives it a visible "surge into emerge". clip2 is parked at 0
      // from the prior cycle so it comes in clean.
      setEmergeFading(true);
      // Own centered light-bleed swell over the seam (rises then recedes; the
      // crossfade does the actual clip swap — see the emerge bloom overlay).
      setEmergeBlooming(true);
      if (emergeBloomTimer.current) clearTimeout(emergeBloomTimer.current);
      emergeBloomTimer.current = setTimeout(
        () => setEmergeBlooming(false),
        EMERGE_BLOOM_RISE_MS,
      );
      if (v2) {
        v2.currentTime = 0;
        void v2.play().catch(() => {});
      }
      if (emergeFadeTimer.current) clearTimeout(emergeFadeTimer.current);
      emergeFadeTimer.current = setTimeout(() => {
        setEmergeFading(false);
        // Crossfade done — clip2 fully covers; drop both clip1 elements and PARK
        // them at 0 so neither flashes a tail frame on the next clip3→clip1.
        [v1aRef.current, v1bRef.current].forEach((v) => {
          if (v) {
            v.pause();
            v.currentTime = 0;
          }
        });
      }, EMERGE_FADE_MS);
    } else if (phase === "submerge") {
      if (v3) {
        v3.currentTime = 0;
        void v3.play().catch(() => {});
      }
    } else if (phase === "live") {
      v1a?.pause();
      v1b?.pause();
      v3?.pause();
      // PARK clip2 at 0 (masked by the bloom reveal) so the next emerge starts
      // on its first frame instead of flashing the held globe end frame.
      if (v2) {
        v2.pause();
        v2.currentTime = 0;
      }
    }
  }, [phase, leadEl]);

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
      if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
      if (emergeFadeTimer.current) clearTimeout(emergeFadeTimer.current);
      if (emergeBloomTimer.current) clearTimeout(emergeBloomTimer.current);
      if (loopFadeTimer.current) clearTimeout(loopFadeTimer.current);
      if (promptTimer.current) clearTimeout(promptTimer.current);
    },
    [],
  );

  // Begin the launch on the first touch while attracting. Dismiss the prompt
  // immediately and keep promptReady false for the rest of the cycle — otherwise
  // its stale `true` survives until the next attract effect runs and flashes the
  // prompt for one paint during the clip3→clip1 re-entry (2nd cycle onward).
  const handleTap = useCallback(() => {
    if (phase === "attract") {
      setPromptReady(false);
      // Commit to the current lead: stop any in-progress seam crossfade so the
      // launch plays one clean element through to 8s.
      if (loopFadeTimer.current) clearTimeout(loopFadeTimer.current);
      loopFadingRef.current = false;
      setLoopFading(false);
      setPhase("launching");
    }
  }, [phase]);

  // clip1 `ended`. While launching: the lead reached 8s → cut into the emerge
  // clip. While attracting: an outgoing loop element finished its tail → park it.
  const handleClip1Ended = useCallback(
    (id: Lead) => {
      if (phase === "launching" && id === attractLeadRef.current) {
        setPhase("emerge");
        return;
      }
      if (phase === "attract") {
        const v = leadEl(id);
        if (v) {
          v.pause();
          v.currentTime = 0;
        }
      }
    },
    [phase, leadEl],
  );

  // clip1 `timeupdate`. Only the lead acts: launching drives the countdown;
  // attract triggers the seam crossfade once the lead is within LOOP_FADE_S of
  // its end.
  const handleClip1Time = useCallback(
    (id: Lead) => {
      if (id !== attractLeadRef.current) return;
      const v = leadEl(id);
      if (!v || !v.duration) return;
      if (phase === "launching") {
        setCountdown(Math.max(0, Math.ceil(v.duration - v.currentTime)));
      } else if (phase === "attract") {
        if (v.currentTime >= v.duration - LOOP_FADE_S) loopSwap();
      }
    },
    [phase, leadEl, loopSwap],
  );

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

  // clip3 finished → crossfade (dissolve) into the clip1 attract loop. clip1
  // plays beneath at full opacity while clip3 fades out on top (crossfading
  // enables v3's opacity transition; setPhase('attract') drops its `active`).
  const handleClip3Ended = useCallback(() => {
    if (phase === "submerge") {
      // Reset the loop bookkeeping before entering attract: lead back to A, no
      // fade in flight. (Done here, not in the effect, to avoid set-state-in-
      // effect cascades — attract is only ever entered from this handler.)
      attractLeadRef.current = "a";
      setAttractLead("a");
      loopFadingRef.current = false;
      setLoopFading(false);
      if (loopFadeTimer.current) clearTimeout(loopFadeTimer.current);
      setCrossfading(true);
      setPhase("attract");
      onReachedIdle();
      if (crossfadeTimer.current) clearTimeout(crossfadeTimer.current);
      crossfadeTimer.current = setTimeout(() => {
        setCrossfading(false);
        // Crossfade done — clip1 fully covers; PARK clip3 at 0 for next submerge.
        const v3b = v3Ref.current;
        if (v3b) {
          v3b.pause();
          v3b.currentTime = 0;
        }
      }, CROSSFADE_MS);
    }
  }, [phase, onReachedIdle]);

  // The layer covers the globe except in `live` (where it must let touches
  // through and stay transparent so the globe shows).
  const covering = phase !== "live";
  // clip1 is visible while attracting/launching and held beneath clip2 during
  // the emerge crossfade.
  const clip1Shown =
    phase === "attract" ||
    phase === "launching" ||
    (phase === "emerge" && emergeFading);

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
      {/* clip1 ×2 — layered A/B for the seamless dolly loop (crossfade at the
          seam). The lead is opaque; during a swap the outgoing fades out while
          the incoming fades in (loopFading enables the opacity transition).
          clip1 is also held opaque beneath while clip2 dissolves in (emerge). */}
      {(["a", "b"] as Lead[]).map((id) => (
        <video
          key={id}
          ref={id === "a" ? v1aRef : v1bRef}
          src={CLIP1}
          muted
          playsInline
          preload="auto"
          onEnded={() => handleClip1Ended(id)}
          onTimeUpdate={() => handleClip1Time(id)}
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            opacity: clip1Shown && id === attractLead ? 1 : 0,
            // Linear so the two layers sum to ~1 through the crossfade (no dip).
            transition: loopFading ? `opacity ${LOOP_FADE_MS}ms linear` : "none",
            pointerEvents: "none",
          }}
        />
      ))}
      {/* clip2 dissolves in over clip1 on emerge (emergeFading), then plays out
          to the bloom-masked globe reveal. */}
      <Clip refEl={v2Ref} src={CLIP2} active={phase === "emerge"} onEnded={handleClip2Ended} onTimeUpdate={handleClip2Time} fadeMs={emergeFading ? EMERGE_FADE_MS : 0} />
      {/* clip3 dissolves out over the clip1 loop on the way back to idle. */}
      <Clip refEl={v3Ref} src={CLIP3} active={phase === "submerge"} onEnded={handleClip3Ended} fadeMs={crossfading ? CROSSFADE_MS : 0} />

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

      {/* Emerge bloom — clip1→clip2 seam only. CENTERED (globe still centre at
          emerge start), with its own rise/fall so it tunes independently of the
          left-biased reveal/submerge bloom above. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(circle at 50% 50%, rgba(224,240,255,0.92) 0%, rgba(150,200,255,0.5) 28%, rgba(80,140,220,0.16) 52%, transparent 70%)",
          opacity: emergeBlooming ? 1 : 0,
          transition: `opacity ${emergeBlooming ? EMERGE_BLOOM_RISE_MS : EMERGE_BLOOM_FALL_MS}ms ease`,
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
  fadeMs = 0,
}: {
  refEl: React.RefObject<HTMLVideoElement | null>;
  src: string;
  active: boolean;
  onEnded: () => void;
  onTimeUpdate?: () => void;
  /** When >0, opacity changes animate over this duration (clip3→clip1 dissolve);
   *  0 = instant swap. */
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
        // Instant swap by default (bloom masks the cut); fadeMs drives the
        // clip3→clip1 dissolve.
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
