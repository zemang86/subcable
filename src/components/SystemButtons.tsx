"use client";

import { useState } from "react";

// Vertical button column sitting to the LEFT of the Cable System panel,
// bottom-aligned with it. Three buttons (top → bottom): Back, Audio, Naration.
//
// BACK   — hidden by default; shows only when a cable is selected. Pops one
//          navigation step on release (handled in parent via `onBack`).
// AUDIO  — toggles audio on/off (`muted` + `onAudioToggle`). Resting graphic
//          reflects state (on vs off); while held it shows the pressed graphic.
// NARATION — on/off toggle for now (local state) so the client can test the
//          interaction. No real narration function wired behind it yet.
//
// All press buttons swap to a "pressed" graphic while held (pointer captured)
// and fire their action on release.

// Cable System panel geometry (from Sidebar.tsx): position fixed, right: 28,
// width 454. Its left edge therefore sits at right: 28 + 454 = 482. The column
// is placed just left of that with a small gap, bottom-aligned at bottom: 28.
const PANEL_RIGHT = 28;
const PANEL_WIDTH = 454;
const GAP_TO_PANEL = 12;
const BUTTON_SIZE = 48;

interface SystemButtonsProps {
  showBack?: boolean;
  onBack?: () => void;
  muted?: boolean;
  onAudioToggle?: () => void;
  onNaration?: () => void;
}

export default function SystemButtons({
  showBack = false,
  onBack,
  muted = false,
  onAudioToggle,
  onNaration,
}: SystemButtonsProps) {
  // Local on/off state for narration — placeholder until the real narration
  // function is supplied. Defaults to "on" (active waves icon), matching audio.
  const [narrationOn, setNarrationOn] = useState(true);

  return (
    <div
      style={{
        position: "fixed",
        bottom: PANEL_RIGHT,
        right: PANEL_RIGHT + PANEL_WIDTH + GAP_TO_PANEL,
        zIndex: 20,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        alignItems: "center",
      }}
    >
      {/* Back — only rendered when a cable is selected. Topmost in the column;
          collapsing it keeps Audio/Naration bottom-aligned. */}
      {showBack && (
        <PressButton
          label="Back"
          restingSrc="/buttons/back.svg"
          pressedSrc="/buttons/back-onpress.svg"
          onActivate={onBack}
        />
      )}

      {/* Audio — on/off toggle. Resting icon depends on muted state. */}
      <PressButton
        label={muted ? "Unmute audio" : "Mute audio"}
        restingSrc={muted ? "/buttons/audio-off.svg" : "/buttons/audio.svg"}
        pressedSrc="/buttons/audio-onpress.svg"
        onActivate={onAudioToggle}
      />

      {/* Naration — on/off toggle (local state) for client testing. */}
      <PressButton
        label={narrationOn ? "Turn narration off" : "Turn narration on"}
        restingSrc={
          narrationOn ? "/buttons/naration.svg" : "/buttons/narrate-off.svg"
        }
        pressedSrc="/buttons/narrate-onpress.svg"
        onActivate={() => {
          setNarrationOn((on) => !on);
          onNaration?.();
        }}
      />
    </div>
  );
}

// Button that swaps to `pressedSrc` while held and fires `onActivate` on
// release. Pointer capture keeps the press alive even if the finger drifts;
// leaving/cancelling aborts without firing.
function PressButton({
  label,
  restingSrc,
  pressedSrc,
  onActivate,
}: {
  label: string;
  restingSrc: string;
  pressedSrc: string;
  onActivate?: () => void;
}) {
  const [pressed, setPressed] = useState(false);

  const release = (commit: boolean) => {
    setPressed(false);
    if (commit) onActivate?.();
  };

  return (
    <button
      type="button"
      aria-label={label}
      onPointerDown={(e) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setPressed(true);
      }}
      onPointerUp={() => release(true)}
      onPointerCancel={() => release(false)}
      onPointerLeave={() => pressed && release(false)}
      style={buttonStyle}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={pressed ? pressedSrc : restingSrc}
        alt={label}
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
        draggable={false}
        style={imgStyle}
      />
    </button>
  );
}

const buttonStyle: React.CSSProperties = {
  width: BUTTON_SIZE,
  height: BUTTON_SIZE,
  padding: 0,
  border: "none",
  background: "transparent",
  cursor: "pointer",
  display: "block",
  lineHeight: 0,
  touchAction: "none",
};

const imgStyle: React.CSSProperties = {
  display: "block",
  width: "100%",
  height: "100%",
  userSelect: "none",
  pointerEvents: "none",
};
