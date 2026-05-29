"use client";

import { useState } from "react";

// Vertical button column sitting to the LEFT of the Cable System panel,
// bottom-aligned with it. Three buttons (top → bottom): Back, Audio, Naration.
//
// BACK button behaviour (wired):
//  - Hidden by default; shows only when a cable is selected (`showBack`).
//  - While held down it swaps to the dark pressed graphic (back-onpress.svg).
//  - On release it pops one navigation step via `onBack` (handled in parent).
// AUDIO / NARATION: functions still TBD — handlers are stubs for now.

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
  onAudio?: () => void;
  onNaration?: () => void;
}

export default function SystemButtons({
  showBack = false,
  onBack,
  onAudio,
  onNaration,
}: SystemButtonsProps) {
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
      {showBack && <BackButton onBack={onBack} />}

      <IconButton src="/buttons/audio.svg" label="Audio" onClick={onAudio} />
      <IconButton
        src="/buttons/naration.svg"
        label="Naration"
        onClick={onNaration}
      />
    </div>
  );
}

function BackButton({ onBack }: { onBack?: () => void }) {
  const [pressed, setPressed] = useState(false);

  const release = (commit: boolean) => {
    setPressed(false);
    if (commit) onBack?.();
  };

  return (
    <button
      type="button"
      aria-label="Back"
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
        src={pressed ? "/buttons/back-onpress.svg" : "/buttons/back.svg"}
        alt="Back"
        width={BUTTON_SIZE}
        height={BUTTON_SIZE}
        draggable={false}
        style={imgStyle}
      />
    </button>
  );
}

function IconButton({
  src,
  label,
  onClick,
}: {
  src: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button type="button" aria-label={label} onClick={onClick} style={buttonStyle}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
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
