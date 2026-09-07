"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_IDLE_MS = 60_000;
const DEFAULT_WARN_MS = 10_000;

/**
 * Idle attractor hook (§H.12 resolution).
 *
 * Returns `isIdle`, which flips to true after `idleMs` of no pointer/touch
 * activity on the window, and `warnSecondsLeft` — non-null during the last
 * `warnMs` before that, counting down in whole seconds — so the UI can warn
 * "returning to start in Ns" instead of silently eating in-progress work
 * (e.g. a half-typed Morse message). Any pointerdown/touchstart/keydown
 * clears both and restarts the timer.
 *
 * `suspended` parks the attractor entirely (timers cleared, no warn, can't go
 * idle) — pass it while a scripted sequence holds the user's attention without
 * touches, e.g. an active Make-a-Call animation (long routes run >60s and the
 * watching user would otherwise be "idle" mid-cinematic). On unsuspend the
 * timer re-arms from zero, giving a full fresh window after the sequence.
 *
 * Consumers wire `isIdle` to:
 *  - enable slow auto-rotate on the globe
 *  - run the existing travelling-dot pulse across ALL cables (not just the
 *    selected one)
 *  - render the "TAP ANYWHERE TO BEGIN" hint overlay
 * and `warnSecondsLeft` to the pre-idle countdown toast.
 */
export function useIdleAttractor(
  idleMs: number = DEFAULT_IDLE_MS,
  warnMs: number = DEFAULT_WARN_MS,
  suspended: boolean = false,
): { isIdle: boolean; warnSecondsLeft: number | null } {
  const [isIdle, setIsIdle] = useState(false);
  const [warnSecondsLeft, setWarnSecondsLeft] = useState<number | null>(null);
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const warnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (suspended) {
      // Park the attractor: no countdown, no idle flip, until unsuspended.
      // Reset isIdle too — "suspended ⇒ not idle". Without this, a stale
      // isIdle=true from the previous cycle survives the park and fires the
      // moment the attractor un-suspends on the next reveal, instantly
      // re-triggering submerge. Cleanup of armed timers happens in the effect
      // teardown below (re-runs on `suspended` change); `arm()` runs fresh on
      // flip back, giving a full clean window.
      setIsIdle(false);
      setWarnSecondsLeft(null);
      return;
    }

    const clearAll = () => {
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (warnTimerRef.current) clearTimeout(warnTimerRef.current);
      if (tickRef.current) clearInterval(tickRef.current);
      idleTimerRef.current = null;
      warnTimerRef.current = null;
      tickRef.current = null;
    };

    const arm = () => {
      clearAll();
      setWarnSecondsLeft(null);
      const effWarnMs = Math.min(warnMs, idleMs);
      warnTimerRef.current = setTimeout(() => {
        const deadline = Date.now() + effWarnMs;
        setWarnSecondsLeft(Math.ceil(effWarnMs / 1000));
        // 250ms tick so the displayed second never lags a full second behind.
        tickRef.current = setInterval(() => {
          setWarnSecondsLeft(
            Math.max(0, Math.ceil((deadline - Date.now()) / 1000)),
          );
        }, 250);
      }, idleMs - effWarnMs);
      idleTimerRef.current = setTimeout(() => {
        clearAll();
        setWarnSecondsLeft(null);
        setIsIdle(true);
      }, idleMs);
    };

    const wake = () => {
      setIsIdle((current) => (current ? false : current));
      arm();
    };

    arm();
    window.addEventListener("pointerdown", wake);
    window.addEventListener("touchstart", wake, { passive: true });
    window.addEventListener("keydown", wake);

    return () => {
      clearAll();
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [idleMs, warnMs, suspended]);

  return { isIdle, warnSecondsLeft };
}
