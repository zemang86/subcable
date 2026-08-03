"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";
import {
  INFO_SLIDE_MS,
  getInfoTabs,
  type InfoScreen,
} from "@/data/generalInfo";
import { PANEL_PAD, type ScreenProps } from "./generalInfo/shared";
import OverviewScreen from "./generalInfo/OverviewScreen";
import MaterialScreen from "./generalInfo/MaterialScreen";
import CutawayScreen from "./generalInfo/CutawayScreen";
import EraScreen from "./generalInfo/EraScreen";
import VideoScreen from "./generalInfo/VideoScreen";

interface GeneralInfoDialogProps {
  onClose: () => void;
  language?: Language;
  /**
   * Raised while the Videos tab has a clip running, so the caller can hold off
   * the idle attractor. Must be a stable reference — it drives an effect.
   */
  onHoldIdle: (holding: boolean) => void;
}

// Panel gradient lifted from temp/facts_bg_gradient.css — same stack the
// Cable System / Cable Information panels use.
const PANEL_BG =
  "linear-gradient(0.55deg, #034DA1 0.51%, rgba(3, 77, 161, 0.3) 33.81%), linear-gradient(180deg, #F05A22 0%, rgba(240, 90, 34, 0.4) 36.77%)";

const TITLE_STRIP_HEIGHT = 47;

// The panel body is a fixed canvas: every tab renders into the same box, so
// switching tabs never resizes or re-centres the card. 780px on the 1080px
// kiosk; the viewport clamp only bites on a smaller dev screen. Layouts that
// need less room leave space, and none of them may push the panel taller —
// inside a screen it's the photos that absorb the slack, never the copy.
const PANEL_BODY_HEIGHT = "min(780px, calc(100vh - 120px))";

// Sizing: the Figma exports (temp/funfact/*.svg) are drawn at ~0.66 of the
// kiosk canvas — their title strip measures 31px against the 47px every other
// panel uses. Rather than shrink the panel to the export's ~712px, the card
// keeps the 1040px footprint already tuned to sit clear of the left cluster and
// the right-hand panels, and the design's proportions are scaled onto it. Body
// copy is held at a readable size: a straight scale lands near 8px.

export default function GeneralInfoDialog({
  onClose,
  language = "en",
  onHoldIdle,
}: GeneralInfoDialogProps) {
  const t = useT(language);
  const [tabIndex, setTabIndex] = useState(0);
  // Screen within the active tab. `cycle` bumps on any manual move so the hold
  // timer and the countdown bar restart together, even when the target screen
  // is the one already showing.
  const [screenIndex, setScreenIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  // Same structure in both languages — only the strings differ, so the active
  // tab and screen survive a language switch.
  const tabs = useMemo(() => getInfoTabs(language), [language]);

  const tab = tabs[tabIndex];
  const screens = tab.screens;
  const screen = screens[screenIndex];
  const count = screens.length;
  const counting = count > 1 && tab.autoAdvance !== false;
  // Single-screen tabs still show the design's countdown rail, but with nothing
  // to advance to it simply cycles.
  const barRepeat = count < 2;

  // Auto-advance, looping back to the first screen of the same tab.
  useEffect(() => {
    if (!counting) return;
    const hold = setTimeout(
      () => setScreenIndex((i) => (i + 1) % count),
      INFO_SLIDE_MS,
    );
    return () => clearTimeout(hold);
  }, [screenIndex, cycle, count, counting]);

  const selectTab = useCallback((i: number) => {
    setTabIndex(i);
    setScreenIndex(0);
    setCycle((c) => c + 1);
  }, []);

  const selectScreen = useCallback((i: number) => {
    setScreenIndex(i);
    setCycle((c) => c + 1);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setScreenIndex((i) => (i + delta + count) % count);
      setCycle((c) => c + 1);
    },
    [count],
  );

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("generalInformation")}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        // Reserve the right gutter for the Cable System / Cable Information
        // panel and the left gutter for the action cluster, so the centred
        // card shifts left and never overlaps either (mirrors HowToGuide).
        padding: "24px 400px 24px 120px",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          width: "min(1040px, 92vw)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
          pointerEvents: "auto",
        }}
      >
        <TitleStrip title={t("generalInformation")} onClose={onClose} />

        {/* Panel body — gradient bg matches cable-system/cable-info treatment.
            Tactical-HUD bracket frame: top + bottom U-brackets (50px tall) +
            left + right vertical side rails with small gaps. */}
        <div
          style={{
            position: "relative",
            height: PANEL_BODY_HEIGHT,
            background: PANEL_BG,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <PanelFrame />

          <TabRow
            labels={tabs.map((entry) => entry.label)}
            activeIndex={tabIndex}
            onSelect={selectTab}
          />

          <div
            key={`${tab.id}-${screen?.id ?? "empty"}`}
            className="v1-gi-fade"
            style={{
              position: "relative",
              zIndex: 3,
              flex: 1,
              minHeight: 0,
            }}
          >
            {screen ? (
              <ScreenLayout
                screen={screen}
                cycleKey={`${tab.id}-${screenIndex}-${cycle}`}
                barRepeat={barRepeat}
                index={screenIndex}
                count={count}
                onStep={step}
                onSelect={selectScreen}
                siblings={screens}
                onHoldIdle={onHoldIdle}
              />
            ) : (
              <PendingTab label={tab.label} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/** Each tab owns its own composition — dispatch on the screen's kind. */
function ScreenLayout({
  screen,
  ...rest
}: { screen: InfoScreen } & ScreenProps) {
  switch (screen.kind) {
    case "overview":
      return <OverviewScreen screen={screen} {...rest} />;
    case "material":
      return <MaterialScreen screen={screen} {...rest} />;
    case "cutaway":
      return <CutawayScreen screen={screen} {...rest} />;
    case "era":
      return <EraScreen screen={screen} {...rest} />;
    case "video":
      return <VideoScreen screen={screen} {...rest} />;
  }
}

/* ───────────────────────── TAB ROW ───────────────────────── */
// Five equal-width tabs. Active = solid orange, bold label, red underline;
// inactive = translucent blue with a hairline border and the small white
// corner nubs (top-left / bottom-right) from the export. Buttons are 48px tall
// for touch — the export draws them at ~22px, under the kiosk minimum.

const TAB_HEIGHT = 48;

const NUB: React.CSSProperties = {
  position: "absolute",
  width: 4,
  height: 4,
  background: "#FFFFFF",
  pointerEvents: "none",
};

function TabRow({
  labels,
  activeIndex,
  onSelect,
}: {
  labels: string[];
  activeIndex: number;
  onSelect: (i: number) => void;
}) {
  return (
    <div
      style={{
        position: "relative",
        zIndex: 3,
        padding: `${PANEL_PAD}px ${PANEL_PAD}px 0`,
        borderBottom: "1px solid rgba(255, 255, 255, 0.6)",
      }}
    >
      <div
        role="tablist"
        style={{ display: "flex", gap: 10, paddingBottom: 12 }}
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
                position: "relative",
                flex: 1,
                height: TAB_HEIGHT,
                padding: 0,
                cursor: "pointer",
                background: active
                  ? "var(--v1-orange)"
                  : "rgba(3, 77, 161, 0.31)",
                border: "1px solid #FFFFFF",
                boxSizing: "border-box",
                fontFamily: "var(--v1-heading)",
                fontWeight: active ? 700 : 400,
                fontSize: 16,
                letterSpacing: "0.06em",
                textTransform: "uppercase",
                color: "var(--v1-fg)",
              }}
            >
              {label}
              <span aria-hidden style={{ ...NUB, top: 1, left: 1 }} />
              <span aria-hidden style={{ ...NUB, bottom: 1, right: 1 }} />
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: -5,
                    height: 3,
                    background: "#ED1B2E",
                  }}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/* ───────────────────────── PENDING TAB ───────────────────────── */
// Holding state for a tab whose content hasn't landed yet.

function PendingTab({ label }: { label: string }) {
  return (
    <div
      style={{
        minHeight: 420,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 12,
        padding: PANEL_PAD,
      }}
    >
      <span
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 13,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.55)",
        }}
      >
        layout pending
      </span>
      <span
        style={{
          fontFamily: "var(--v1-display)",
          fontWeight: 600,
          fontSize: 28,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.35)",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ───────────────────────── PANEL FRAME ───────────────────────── */
// Tactical-HUD bracket frame, same visual as CableInformation's PanelFrame
// but built with absolute-positioned CSS borders so it stays pixel-perfect
// at any fluid panel size. Top + bottom 50px U-brackets, plus left + right
// vertical rails that stop short of the brackets to create the HUD gap.

const FRAME_BRACKET_HEIGHT = 50;
const FRAME_RAIL_INSET = 60; // rails start 60px from top/bottom (10px gap past bracket)

function PanelFrame() {
  const lineColor = "#FFFFFF";
  return (
    <>
      {/* Top U bracket — top + left + right borders, no bottom */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: FRAME_BRACKET_HEIGHT,
          borderTop: `1px solid ${lineColor}`,
          borderLeft: `1px solid ${lineColor}`,
          borderRight: `1px solid ${lineColor}`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* Bottom U bracket — bottom + left + right borders, no top */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: FRAME_BRACKET_HEIGHT,
          borderBottom: `1px solid ${lineColor}`,
          borderLeft: `1px solid ${lineColor}`,
          borderRight: `1px solid ${lineColor}`,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* Left vertical rail */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: FRAME_RAIL_INSET,
          bottom: FRAME_RAIL_INSET,
          left: 0,
          width: 1,
          background: lineColor,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
      {/* Right vertical rail */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          top: FRAME_RAIL_INSET,
          bottom: FRAME_RAIL_INSET,
          right: 0,
          width: 1,
          background: lineColor,
          pointerEvents: "none",
          zIndex: 2,
        }}
      />
    </>
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */
// Mirrors the CableInformation / Cable System title-strip pattern:
// 47px tall, translucent-white gradient fill, hairline white border,
// crosshair (+) at each of the 4 corners, title 28px Chakra Petch 500 white.
// Adds a close button on the right for modal dismissal.

function TitleStrip({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  const display = useScramble(title);
  return (
    <div
      data-stem-title
      style={{
        position: "relative",
        width: "100%",
        height: TITLE_STRIP_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      {/* Background + border on their own layer so the materialize wipe
          doesn't clip the overhanging crosshairs or the decrypting title. */}
      <span
        aria-hidden
        className="v7-mat-wipe"
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(255,255,255,0) 41.87%, #FFFFFF 413.39%), linear-gradient(180deg, rgba(255,255,255,0) 45.95%, #FFFFFF 278.39%)",
          border: "0.37px solid #FFFFFF",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
      <CrossMark position="tl" />
      <CrossMark position="tr" />
      <CrossMark position="bl" />
      <CrossMark position="br" />
      <span
        style={{
          position: "relative",
          fontFamily: "var(--v1-display)",
          fontWeight: 500,
          fontSize: 28,
          lineHeight: "36px",
          color: "#FFFFFF",
        }}
      >
        {display}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
          position: "relative",
          width: 28,
          height: 28,
          background: "transparent",
          border: "1px solid rgba(255, 255, 255, 0.6)",
          color: "#FFFFFF",
          cursor: "pointer",
          fontFamily: "var(--v1-mono)",
          fontSize: 14,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 0,
        }}
      >
        ✕
      </button>
    </div>
  );
}

function CrossMark({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const variants = {
    tl: { top: -4, left: -4 },
    tr: { top: -4, right: -4 },
    bl: { bottom: -4, left: -4 },
    br: { bottom: -4, right: -4 },
  };
  return (
    <span
      aria-hidden
      className="v7-mat-cross"
      style={{
        position: "absolute",
        width: 8,
        height: 8,
        pointerEvents: "none",
        ...variants[position],
      }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 8,
          height: 0,
          borderTop: "2px solid #FFFFFF",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 3,
          width: 0,
          height: 8,
          borderLeft: "2px solid #FFFFFF",
        }}
      />
    </span>
  );
}
