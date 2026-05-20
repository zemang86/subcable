"use client";

import { useEffect, useRef, useState } from "react";

const DEFAULT_IDLE_MS = 60_000;

/**
 * Idle attractor hook (§H.12 resolution).
 *
 * Returns `isIdle` which flips to true after `idleMs` of no pointer/touch
 * activity on the window. Any subsequent pointerdown/touchstart flips it back
 * to false and restarts the timer.
 *
 * Consumers wire `isIdle` to:
 *  - enable slow auto-rotate on the globe
 *  - run the existing travelling-dot pulse across ALL cables (not just the
 *    selected one)
 *  - render the "TAP ANYWHERE TO BEGIN" hint overlay
 */
export function useIdleAttractor(idleMs: number = DEFAULT_IDLE_MS): boolean {
  const [isIdle, setIsIdle] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const arm = () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setIsIdle(true), idleMs);
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
      if (timerRef.current) clearTimeout(timerRef.current);
      window.removeEventListener("pointerdown", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown", wake);
    };
  }, [idleMs]);

  return isIdle;
}
