"use client";

import { INFO_TABS, type EraScreen as EraData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CARD_TITLE,
  CopyCard,
  PANEL_PAD,
  Photo,
  TOUCH,
  type ScreenProps,
} from "./shared";

const IMAGE_WIDTH = 300;

/**
 * Then And Now — two photos and the era's copy, a six-tile spec grid, and the
 * Then/Now pill that switches eras. The pill is this tab's manual control (no
 * step arrows), and the countdown flips it on its own every 10s.
 */
export default function EraScreen({
  screen,
  cycleKey,
  barRepeat,
  index,
  onSelect,
}: { screen: EraData } & ScreenProps) {
  const eraLabels = INFO_TABS.find((tab) => tab.id === "then-and-now")
    ?.screens.map((entry) => (entry.kind === "era" ? entry.toggleLabel : ""))
    .filter(Boolean) ?? [];

  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: 24,
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      <div
        style={{
          flex: "none",
          width: IMAGE_WIDTH,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {screen.images.map((image) => (
          <Photo
            key={image.src}
            src={image.src}
            alt={image.alt}
            style={{ width: IMAGE_WIDTH, flex: 1, minHeight: 0 }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <CopyCard cycleKey={cycleKey} barRepeat={barRepeat}>
          <h2 style={CARD_TITLE}>{screen.title}</h2>
          {screen.body.map((paragraph, i) => (
            <p key={i} style={{ ...CARD_BODY, margin: "12px 0 0" }}>
              {paragraph}
            </p>
          ))}
        </CopyCard>

        <div
          style={{
            flex: 1,
            minHeight: 0,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gridTemplateRows: "repeat(3, 1fr)",
            gap: 12,
          }}
        >
          {screen.specs.map((spec) => (
            <SpecTile key={spec.label} label={spec.label} value={spec.value} />
          ))}
        </div>

        <div style={{ display: "flex", justifyContent: "center" }}>
          <EraToggle
            labels={eraLabels}
            activeIndex={index}
            onSelect={onSelect}
          />
        </div>
      </div>
    </div>
  );
}

/** Spec tile — bevelled top-left and bottom-right, per the export. */
function SpecTile({ label, value }: { label: string; value: string }) {
  const cut = 16;
  return (
    <div
      style={{
        position: "relative",
        padding: "10px 16px 12px",
        background: "rgba(255, 255, 255, 0.18)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
        clipPath: `polygon(${cut}px 0, 100% 0, 100% calc(100% - ${cut}px), calc(100% - ${cut}px) 100%, 0 100%, 0 ${cut}px)`,
      }}
    >
      <span
        style={{
          display: "block",
          fontFamily: "var(--v1-heading)",
          fontWeight: 500,
          fontSize: 13,
          letterSpacing: "0.04em",
          color: "rgba(255, 255, 255, 0.7)",
        }}
      >
        {label}
      </span>
      <span
        style={{
          display: "block",
          marginTop: 2,
          fontFamily: "var(--v1-mono)",
          fontWeight: 500,
          fontSize: 22,
          lineHeight: "30px",
          color: "var(--v1-fg)",
        }}
      >
        {value}
      </span>
    </div>
  );
}

/** Then | Now pill. */
function EraToggle({
  labels,
  activeIndex,
  onSelect,
}: {
  labels: string[];
  activeIndex: number;
  onSelect: (index: number) => void;
}) {
  return (
    <div
      role="tablist"
      style={{
        display: "flex",
        alignItems: "center",
        padding: 4,
        gap: 4,
        borderRadius: 999,
        background: "rgba(3, 77, 161, 0.45)",
        border: "1px solid rgba(255, 255, 255, 0.65)",
      }}
    >
      {labels.map((label, i) => {
        const active = i === activeIndex;
        return (
          <button
            key={label}
            type="button"
            role="tab"
            aria-selected={active}
            onClick={() => onSelect(i)}
            className="v1-pressable"
            style={{
              minWidth: 104,
              height: TOUCH - 12,
              padding: "0 20px",
              borderRadius: 999,
              border: active ? "1px solid rgba(255, 255, 255, 0.9)" : "none",
              background: active ? "rgba(255, 255, 255, 0.92)" : "transparent",
              cursor: "pointer",
              fontFamily: "var(--v1-heading)",
              fontWeight: active ? 700 : 500,
              fontSize: 17,
              color: active ? "var(--v1-orange)" : "var(--v1-fg)",
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
  );
}
