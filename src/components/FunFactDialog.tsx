"use client";

import { useCallback, useEffect, useState } from "react";
import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";
import {
  FUN_FACT_INTERVAL_MS,
  FUN_FACT_SLIDES,
  type FunFactSlide,
} from "@/data/funFacts";

interface FunFactDialogProps {
  onClose: () => void;
  language?: Language;
}

// Panel gradient lifted from temp/facts_bg_gradient.css
const PANEL_BG =
  "linear-gradient(0.55deg, #034DA1 0.51%, rgba(3, 77, 161, 0.3) 33.81%), linear-gradient(180deg, #F05A22 0%, rgba(240, 90, 34, 0.4) 36.77%)";

const TITLE_STRIP_HEIGHT = 47;

export default function FunFactDialog({
  onClose,
  language = "en",
}: FunFactDialogProps) {
  const t = useT(language);
  // The deck always opens on slide 0 and loops. `cycle` bumps on a manual jump
  // so the hold timer + progress bar restart even when the tapped slide is the
  // one already showing.
  const [activeIndex, setActiveIndex] = useState(0);
  const [cycle, setCycle] = useState(0);
  const slideCount = FUN_FACT_SLIDES.length;
  const slide = FUN_FACT_SLIDES[activeIndex];

  useEffect(() => {
    const hold = setTimeout(
      () => setActiveIndex((i) => (i + 1) % slideCount),
      FUN_FACT_INTERVAL_MS,
    );
    return () => clearTimeout(hold);
  }, [activeIndex, cycle, slideCount]);

  const jumpTo = useCallback((i: number) => {
    setActiveIndex(i);
    setCycle((c) => c + 1);
  }, []);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("funFactTitle")}
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
        <TitleStrip title={t("funFactTitle")} onClose={onClose} />

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

        {/* One screen: artwork + copy. Keyed on the slide id so React remounts
            the block and the fade-in replays on every advance. */}
        <article
          key={slide.id}
          className="v1-ff-in"
          style={{
            padding: "22px 22px 0",
            display: "flex",
            flexDirection: "column",
            gap: 18,
          }}
        >
          <div
            style={{
              aspectRatio: "16 / 9",
              maxHeight: 360,
              background: "rgba(0, 0, 0, 0.50)",
              border: "1px solid rgba(255, 255, 255, 0.15)",
              position: "relative",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
            }}
          >
            {slide.image ? (
              <img
                src={slide.image}
                alt=""
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
            ) : (
              <PlaceholderArt slide={slide} />
            )}
            <span
              style={{
                position: "absolute",
                top: 12,
                right: 16,
                fontFamily: "var(--v1-mono)",
                fontSize: 12,
                letterSpacing: "0.14em",
                color: "var(--v1-fg)",
                textShadow: "0 1px 4px rgba(0,0,0,0.8)",
              }}
            >
              {pad(activeIndex + 1)} / {pad(slideCount)}
            </span>
          </div>

          <div style={{ minHeight: 120 }}>
            <h2
              style={{
                margin: 0,
                fontFamily: "var(--v1-display)",
                fontWeight: 600,
                fontSize: 26,
                lineHeight: "32px",
                letterSpacing: "0.02em",
                color: "var(--v1-fg)",
              }}
            >
              {slide.title[language]}
            </h2>
            <p
              style={{
                margin: "10px 0 0",
                fontFamily: "var(--v1-heading)",
                fontWeight: 500,
                fontSize: 18,
                lineHeight: "26px",
                color: "var(--v1-fg-iceblue)",
                maxWidth: "72ch",
              }}
            >
              {slide.body[language]}
            </p>
          </div>
        </article>

        {/* Progress rail — one segment per screen. The active segment fills
            over FUN_FACT_INTERVAL_MS, so the rail doubles as the countdown to
            the next slide. Segments are tappable (48px touch height) to jump. */}
        <div
          role="tablist"
          aria-label={t("funFactTitle")}
          style={{ display: "flex", gap: 8, padding: "6px 22px 16px" }}
        >
          {FUN_FACT_SLIDES.map((s, i) => (
            <button
              key={s.id}
              type="button"
              role="tab"
              aria-selected={i === activeIndex}
              aria-label={`${pad(i + 1)} / ${pad(slideCount)}`}
              onClick={() => jumpTo(i)}
              style={{
                flex: 1,
                height: 48,
                padding: 0,
                background: "transparent",
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
              }}
            >
              <span
                aria-hidden
                style={{
                  position: "relative",
                  display: "block",
                  width: "100%",
                  height: 4,
                  background: "rgba(255, 255, 255, 0.25)",
                  overflow: "hidden",
                }}
              >
                {i === activeIndex && (
                  <span
                    key={`${activeIndex}-${cycle}`}
                    className="v1-ff-fill"
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "var(--v1-orange)",
                      animationDuration: `${FUN_FACT_INTERVAL_MS}ms`,
                    }}
                  />
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
      </div>
    </div>
  );
}

const pad = (n: number) => String(n).padStart(2, "0");

/* ───────────────────────── PLACEHOLDER ART ───────────────────────── */
// Stands in for a slide's artwork until the client's assets land in
// /public/textures/funfact/. Deliberately reads as a holding frame rather than
// a finished visual, so an unfilled slide is obvious in a demo.

function PlaceholderArt({ slide }: { slide: FunFactSlide }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        background:
          "repeating-linear-gradient(135deg, rgba(255,255,255,0.05) 0 2px, transparent 2px 14px)",
      }}
    >
      <span
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 12,
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.55)",
        }}
      >
        artwork pending
      </span>
      <span
        style={{
          fontFamily: "var(--v1-display)",
          fontWeight: 600,
          fontSize: 20,
          letterSpacing: "0.10em",
          textTransform: "uppercase",
          color: "rgba(255, 255, 255, 0.30)",
        }}
      >
        {slide.id}
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
