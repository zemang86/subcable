"use client";

import { useMemo } from "react";

// Underwater attract-mode overlay shown over the globe while idle. Cheap,
// alpha-composited CSS layers (no WebGL): a blue-teal depth wash + vignette,
// soft vertical god-ray beams, slow caustic light, and rising bubbles.
//
// On wake (`surfacing`) it plays "the globe rising out of the water": the whole
// water layer is clipped by a WATERLINE that drops from top to bottom (so the
// globe is revealed top-down as the level falls), led by a bright surface
// highlight. The parent only reveals the UI chrome once this beat finishes.

const BUBBLE_COUNT = 14;
const RAY_COUNT = 5;

export function UnderwaterOverlay({ surfacing }: { surfacing: boolean }) {
  const bubbles = useMemo(
    () =>
      Array.from({ length: BUBBLE_COUNT }, (_, i) => {
        const r = (n: number) => (Math.sin(i * 12.9898 + n * 78.233) + 1) / 2;
        return {
          left: 4 + r(1) * 92, // vw
          size: 5 + r(2) * 16, // px
          dur: 8 + r(3) * 10, // s
          delay: -r(4) * 13, // s (negative → start mid-cycle)
          sway: (r(5) - 0.5) * 80, // px horizontal drift
        };
      }),
    [],
  );

  const rays = useMemo(
    () =>
      Array.from({ length: RAY_COUNT }, (_, i) => {
        const r = (n: number) => (Math.sin(i * 41.17 + n * 24.7) + 1) / 2;
        return {
          left: 8 + (i / RAY_COUNT) * 84 + (r(1) - 0.5) * 8, // vw
          width: 90 + r(2) * 140, // px
          rot: -14 + r(3) * 12, // deg
          dur: 11 + r(4) * 8, // s
          delay: -r(5) * 8, // s
          opacity: 0.05 + r(6) * 0.06,
        };
      }),
    [],
  );

  return (
    <>
      {/* WATER — clipped away top-down on wake so the globe surfaces. */}
      <div
        aria-hidden
        className={surfacing ? "v1-uw-recede" : undefined}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 12,
          pointerEvents: "none",
          overflow: "hidden",
        }}
      >
        {/* Depth wash — blue-teal tint, darker toward the deep. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "linear-gradient(180deg, rgba(12,74,116,0.36) 0%, rgba(7,44,78,0.44) 55%, rgba(4,22,46,0.56) 100%)",
          }}
        />

        {/* God-ray beams — soft near-vertical light shafts from the surface. */}
        {rays.map((ray, i) => (
          <div
            key={i}
            className="v1-uw-ray"
            style={
              {
                position: "absolute",
                top: "-15%",
                left: `${ray.left}vw`,
                width: ray.width,
                height: "130%",
                background: `linear-gradient(90deg, transparent 0%, rgba(165,228,255,${ray.opacity}) 50%, transparent 100%)`,
                filter: "blur(10px)",
                transformOrigin: "top center",
                animationDuration: `${ray.dur}s`,
                animationDelay: `${ray.delay}s`,
                "--rot": `${ray.rot}deg`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Caustic light blobs — slow dappled light rippling through water. */}
        <div
          className="v1-uw-caustic"
          style={{
            position: "absolute",
            left: "14%",
            top: "4%",
            width: "58vw",
            height: "58vw",
            background:
              "radial-gradient(circle, rgba(130,224,255,0.12) 0%, transparent 62%)",
            filter: "blur(34px)",
          }}
        />
        <div
          className="v1-uw-caustic v1-uw-caustic--2"
          style={{
            position: "absolute",
            right: "8%",
            top: "18%",
            width: "46vw",
            height: "46vw",
            background:
              "radial-gradient(circle, rgba(95,205,235,0.10) 0%, transparent 62%)",
            filter: "blur(44px)",
          }}
        />

        {/* Rising bubbles. */}
        {bubbles.map((b, i) => (
          <span
            key={i}
            className="v1-uw-bubble"
            style={
              {
                position: "absolute",
                bottom: "-8vh",
                left: `${b.left}vw`,
                width: b.size,
                height: b.size,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 35% 30%, rgba(255,255,255,0.95) 0%, rgba(195,236,255,0.55) 40%, rgba(150,215,255,0.18) 72%, transparent 80%)",
                boxShadow: "0 0 6px rgba(180,235,255,0.4)",
                border: "1px solid rgba(210,244,255,0.45)",
                animationDuration: `${b.dur}s`,
                animationDelay: `${b.delay}s`,
                "--sway": `${b.sway}px`,
              } as React.CSSProperties
            }
          />
        ))}

        {/* Vignette — darken the edges like looking up from the deep. */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(ellipse at 50% 36%, transparent 36%, rgba(2,8,20,0.55) 100%)",
          }}
        />
      </div>

      {/* WATERLINE — bright surface highlight pinned to the top edge of the
          water; slides down with it so it reads as the surface itself. */}
      {surfacing && (
        <div
          aria-hidden
          className="v1-uw-waterline"
          style={{
            position: "fixed",
            left: 0,
            right: 0,
            top: 0,
            height: 150,
            zIndex: 13,
            pointerEvents: "none",
            background:
              "linear-gradient(180deg, rgba(224,248,255,0) 0%, rgba(232,250,255,0.92) 5%, rgba(180,235,255,0.6) 12%, rgba(60,150,190,0.4) 34%, rgba(14,60,96,0.2) 70%, transparent 100%)",
            filter: "blur(0.5px)",
          }}
        />
      )}
    </>
  );
}
