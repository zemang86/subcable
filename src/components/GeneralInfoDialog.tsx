"use client";

import { useCallback, useMemo, useState, type CSSProperties } from "react";
import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";
import { getInfoTabs, type InfoScreen } from "@/data/generalInfo";
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
  // Screen within the active tab. Nothing moves it but a touch — the panel used
  // to hold each screen for 10s and advance itself, with the bar under the copy
  // as its countdown. The client dropped both.
  const [screenIndex, setScreenIndex] = useState(0);

  // Same structure in both languages — only the strings differ, so the active
  // tab and screen survive a language switch.
  const tabs = useMemo(() => getInfoTabs(language), [language]);

  const tab = tabs[tabIndex];
  const screens = tab.screens;
  const screen = screens[screenIndex];
  const count = screens.length;

  const selectTab = useCallback((i: number) => {
    setTabIndex(i);
    setScreenIndex(0);
  }, []);

  const step = useCallback(
    (delta: number) => setScreenIndex((i) => (i + delta + count) % count),
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
                index={screenIndex}
                count={count}
                onStep={step}
                onSelect={setScreenIndex}
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
  width: 6,
  height: 4,
  background: "#FFFFFF",
  pointerEvents: "none",
};

/**
 * A selected tab gives up the bottom of its slot to the red rule instead of
 * hanging it underneath, so the row's height never changes and the rule sits
 * inside the tab's own footprint.
 *
 * Split is the export's (selected-tab.svg, confirmed against the full
 * overview-1 render, where the selected body measures 12.10 units against the
 * unselected tab's 13.78): body 12.097, then a gap and a rule of 1.05 each —
 * the two are equal to four decimals. Scaled onto the 48px slot that's
 * 40.9/3.55/3.55, rounded to whole pixels so the rule stays crisp at 1x.
 */
const TAB_RULE = 4;
const TAB_RULE_GAP = 4;

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
                // A bare shell holding the slot: it keeps the full 48px as the
                // touch target whether or not the body inside it has shrunk.
                position: "relative",
                flex: 1,
                height: TAB_HEIGHT,
                padding: 0,
                cursor: "pointer",
                background: "none",
                border: "none",
              }}
            >
              <span
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: active ? TAB_RULE + TAB_RULE_GAP : 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
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
              </span>
              {active && (
                <span
                  aria-hidden
                  style={{
                    position: "absolute",
                    left: 0,
                    right: 0,
                    bottom: 0,
                    height: TAB_RULE,
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

/**
 * Geometry from temp/funfact/general-infoframe.svg, a 470-unit-wide drawing
 * scaled onto this 1040px panel (×2.213). It replaces a pair of full-width U
 * brackets: the export draws an L at each corner instead, twice the weight of
 * everything else (exactly 2 — 1.33813 against 0.669067), with hairline edges
 * running between them.
 *
 * Two things about it are deliberately not symmetric, and are what make it read
 * as a HUD rather than a box:
 *   · the top and bottom edges each break once near the middle, at different
 *     places and different widths;
 *   · the side rails stop well short of the lower brackets, the right one
 *     ~30px further clear than the left.
 *
 * The export is 470×287 where the panel is 1040×780, so the vertical measures
 * can't come from its own height — a rail expressed as a fraction of 287 would
 * land nowhere near its bracket here. They're taken relative to the bracket
 * arm instead, which keeps one scale for the whole frame.
 */
const FRAME_ARM_X = 57;
const FRAME_ARM_Y = 43;
/** Corner brackets are drawn at twice the weight of the rails and edges. */
const FRAME_ARM_WEIGHT = 2;
/** Break where an edge meets a bracket — the export runs 7–12px, near enough. */
const FRAME_GAP = 10;
const RAIL_TOP = FRAME_ARM_Y + 16;
const RAIL_BOTTOM_LEFT = FRAME_ARM_Y + 54;
const RAIL_BOTTOM_RIGHT = FRAME_ARM_Y + 85;
/** Mid-edge breaks: where the gap is centred, and how wide it runs. */
const TOP_BREAK = { at: 55.56, width: 9 };
const BOTTOM_BREAK = { at: 44.67, width: 18 };

function PanelFrame() {
  const line = "1px solid #FFFFFF";
  const arm = `${FRAME_ARM_WEIGHT}px solid #FFFFFF`;
  const edgeEnd = FRAME_ARM_X + FRAME_GAP;

  const parts: CSSProperties[] = [
    // Corner brackets.
    { top: 0, left: 0, borderTop: arm, borderLeft: arm },
    { top: 0, right: 0, borderTop: arm, borderRight: arm },
    { bottom: 0, left: 0, borderBottom: arm, borderLeft: arm },
    { bottom: 0, right: 0, borderBottom: arm, borderRight: arm },
  ].map((corner) => ({
    width: FRAME_ARM_X,
    height: FRAME_ARM_Y,
    ...corner,
  }));

  const edges: CSSProperties[] = [
    // Top edge, either side of its break.
    {
      top: 0,
      left: edgeEnd,
      right: `calc(${100 - TOP_BREAK.at}% + ${TOP_BREAK.width / 2}px)`,
      borderTop: line,
    },
    {
      top: 0,
      left: `calc(${TOP_BREAK.at}% + ${TOP_BREAK.width / 2}px)`,
      right: edgeEnd,
      borderTop: line,
    },
    // Bottom edge, either side of its own.
    {
      bottom: 0,
      left: edgeEnd,
      right: `calc(${100 - BOTTOM_BREAK.at}% + ${BOTTOM_BREAK.width / 2}px)`,
      borderBottom: line,
    },
    {
      bottom: 0,
      left: `calc(${BOTTOM_BREAK.at}% + ${BOTTOM_BREAK.width / 2}px)`,
      right: edgeEnd,
      borderBottom: line,
    },
    // Side rails.
    { left: 0, top: RAIL_TOP, bottom: RAIL_BOTTOM_LEFT, borderLeft: line },
    { right: 0, top: RAIL_TOP, bottom: RAIL_BOTTOM_RIGHT, borderRight: line },
  ];

  return (
    <>
      {[...parts, ...edges].map((part, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            pointerEvents: "none",
            zIndex: 2,
            ...part,
          }}
        />
      ))}
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
