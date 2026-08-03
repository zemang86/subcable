"use client";

import { useCallback, useEffect, useState } from "react";
import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";
import { INFO_SLIDE_MS, INFO_TABS, type InfoSlide } from "@/data/generalInfo";

interface GeneralInfoDialogProps {
  onClose: () => void;
  language?: Language;
}

// Panel gradient lifted from temp/facts_bg_gradient.css — same stack the
// Cable System / Cable Information panels use.
const PANEL_BG =
  "linear-gradient(0.55deg, #034DA1 0.51%, rgba(3, 77, 161, 0.3) 33.81%), linear-gradient(180deg, #F05A22 0%, rgba(240, 90, 34, 0.4) 36.77%)";

const TITLE_STRIP_HEIGHT = 47;

// Layout sizes. The Figma export (temp/funfact/overview-*.svg) is drawn at
// ~0.66 of the kiosk canvas — its title strip measures 31px against the 47px
// every other panel uses. Rather than shrink the panel to the export's ~712px,
// the card keeps the 1040px footprint already tuned to sit clear of the left
// cluster and the right-hand panels, and the design's proportions are scaled
// onto it. Body copy is held at 15px: a straight scale puts it near 12px,
// which is too small to read at kiosk arm's length.
const PANEL_PAD = 22;
const IMAGE_WIDTH = 320;
const IMAGE_RATIO = 150.08 / 108.62; // from the export's image frames
const COLUMN_GAP = 24;

export default function GeneralInfoDialog({
  onClose,
  language = "en",
}: GeneralInfoDialogProps) {
  const t = useT(language);
  const [tabIndex, setTabIndex] = useState(0);
  // Screen within the active tab. `cycle` bumps on any manual move so the hold
  // timer and the countdown bar restart together, even when the target screen
  // is the one already showing.
  const [slideIndex, setSlideIndex] = useState(0);
  const [cycle, setCycle] = useState(0);

  const tab = INFO_TABS[tabIndex];
  const slides = tab.slides;
  const slide: InfoSlide | undefined = slides[slideIndex];
  const slideCount = slides.length;

  // Auto-advance, looping back to the first screen of the same tab. Tabs with
  // fewer than two screens have nothing to advance to.
  useEffect(() => {
    if (slideCount < 2) return;
    const hold = setTimeout(
      () => setSlideIndex((i) => (i + 1) % slideCount),
      INFO_SLIDE_MS,
    );
    return () => clearTimeout(hold);
  }, [slideIndex, cycle, slideCount]);

  const selectTab = useCallback((i: number) => {
    setTabIndex(i);
    setSlideIndex(0);
    setCycle((c) => c + 1);
  }, []);

  const step = useCallback(
    (delta: number) => {
      setSlideIndex((i) => (i + delta + slideCount) % slideCount);
      setCycle((c) => c + 1);
    },
    [slideCount],
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
            background: PANEL_BG,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <PanelFrame />

          <TabRow
            labels={INFO_TABS.map((entry) => entry.label)}
            activeIndex={tabIndex}
            onSelect={selectTab}
          />

          {slide ? (
            <SlideView
              key={`${tab.id}-${slide.id}`}
              slide={slide}
              cycleKey={`${tab.id}-${slideIndex}-${cycle}`}
              showPrev={slideIndex > 0}
              showNext={slideIndex < slideCount - 1}
              onStep={step}
            />
          ) : (
            <PendingTab key={tab.id} label={tab.label} />
          )}
        </div>
      </div>
    </div>
  );
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

/* ───────────────────────── SLIDE ───────────────────────── */
// Overview composition: two stacked photos on the left, a bracketed copy card
// on the right with the countdown bar along its bottom edge, and the step
// arrows below the frame's right edge.

function SlideView({
  slide,
  cycleKey,
  showPrev,
  showNext,
  onStep,
}: {
  slide: InfoSlide;
  cycleKey: string;
  showPrev: boolean;
  showNext: boolean;
  onStep: (delta: number) => void;
}) {
  return (
    <div
      className="v1-gi-fade"
      style={{
        position: "relative",
        zIndex: 3,
        display: "flex",
        gap: COLUMN_GAP,
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
        {slide.images.map((image) => (
          // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
          <img
            key={image.src}
            src={image.src}
            alt={image.alt}
            style={{
              width: IMAGE_WIDTH,
              height: Math.round(IMAGE_WIDTH / IMAGE_RATIO),
              objectFit: "cover",
              display: "block",
              border: "1px solid rgba(255, 255, 255, 0.85)",
              borderRadius: 8,
            }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <div style={{ position: "relative", padding: "10px 12px" }}>
          <CardBrackets />
          <div
            style={{
              background: "rgba(255, 255, 255, 0.15)",
              padding: "16px 18px",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--v1-mono)",
                fontWeight: 600,
                fontSize: 30,
                lineHeight: "38px",
                color: "var(--v1-fg)",
              }}
            >
              {slide.title}
            </h2>
            {slide.body.map((paragraph, i) => (
              <p
                key={i}
                style={{
                  margin: i === 0 ? "14px 0 0" : "12px 0 0",
                  fontFamily: "var(--v1-mono)",
                  fontWeight: 300,
                  fontSize: 15,
                  lineHeight: "23px",
                  color: "var(--v1-fg)",
                }}
              >
                {paragraph}
              </p>
            ))}
          </div>

          {/* Countdown to the next screen — orange fill over the red track,
              driven by the same constant as the hold timer, so the bar and the
              advance can't drift apart. */}
          <div
            style={{
              position: "relative",
              height: 3,
              margin: "8px 4px 0",
              background: "#ED1B2E",
            }}
          >
            <span
              key={cycleKey}
              className="v1-gi-fill"
              style={{
                position: "absolute",
                inset: 0,
                background: "var(--v1-orange)",
                backgroundClip: "padding-box",
                borderRight: "4px solid transparent",
                animationDuration: `${INFO_SLIDE_MS}ms`,
              }}
            />
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {showPrev && (
            <StepButton direction="prev" onClick={() => onStep(-1)} />
          )}
          {showNext && (
            <StepButton direction="next" onClick={() => onStep(1)} />
          )}
        </div>
      </div>
    </div>
  );
}

function StepButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "next" ? "Next" : "Previous"}
      className="v1-pressable"
      style={{
        width: 48,
        height: 48,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor: "pointer",
        background: "rgba(240, 90, 34, 0.54)",
        border: "1px solid var(--v1-orange)",
      }}
    >
      <svg width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden>
        <path
          d={direction === "next" ? "M3 2 L13 13 L3 24" : "M13 2 L3 13 L13 24"}
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}

/* ───────────────────────── CARD BRACKETS ───────────────────────── */
// Four L-corners around the copy card + countdown bar, per the export.

const BRACKET = 22;

function CardBrackets() {
  const line = "1px solid #FFFFFF";
  const corners = [
    { top: 0, left: 0, borderTop: line, borderLeft: line },
    { top: 0, right: 0, borderTop: line, borderRight: line },
    { bottom: 0, left: 0, borderBottom: line, borderLeft: line },
    { bottom: 0, right: 0, borderBottom: line, borderRight: line },
  ];
  return (
    <>
      {corners.map((corner, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            width: BRACKET,
            height: BRACKET,
            pointerEvents: "none",
            ...corner,
          }}
        />
      ))}
    </>
  );
}

/* ───────────────────────── PENDING TAB ───────────────────────── */
// Each remaining tab gets its own layout and composition from Figma, so this
// is a neutral holding state rather than the Overview layout with empty slots.

function PendingTab({ label }: { label: string }) {
  return (
    <div
      className="v1-gi-fade"
      style={{
        position: "relative",
        zIndex: 3,
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
