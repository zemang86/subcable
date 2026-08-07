"use client";

import { useState } from "react";

type RecenterButtonProps = {
  onRecenter: () => void;
  ariaLabel?: string;
};

// Re-center control (Figma). The button is the SVG itself — a framed compass
// that swaps to a pressed graphic while held (pointer captured) and fires on
// release. Camera only — see recenterView in GlobeScene: it re-frames the
// selected cable's default view (home pose if nothing is selected) and
// dismisses nothing, so an open location panel stays open. Lives in the
// right-edge system column, above the audio toggle — sized 48×48 to match the
// audio/back buttons.
const SIZE = 48;

export function RecenterButton({
  onRecenter,
  ariaLabel = "Re-center",
}: RecenterButtonProps) {
  const [pressed, setPressed] = useState(false);

  const release = (commit: boolean) => {
    setPressed(false);
    if (commit) onRecenter();
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      className="v1-pressable"
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setPressed(true);
      }}
      onPointerUp={() => release(true)}
      onPointerCancel={() => release(false)}
      onPointerLeave={() => pressed && release(false)}
      style={{
        width: SIZE,
        height: SIZE,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "block",
        lineHeight: 0,
        touchAction: "none",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pressed ? "/buttons/recenter-onpress.svg" : "/buttons/recenter.svg"}
        alt={ariaLabel}
        width={SIZE}
        height={SIZE}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
