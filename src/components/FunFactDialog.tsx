"use client";

import { useState } from "react";
import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";
import { useScramble } from "@/lib/useScramble";

interface FunFactDialogProps {
  cable: CableSystem;
  onClose: () => void;
  language?: Language;
}

// Placeholder thumbnails — picsum.photos seeded URLs so each card renders a
// stable random photo until the client supplies real assets (per §H.6).
// NOTE: replace with local assets in /public/textures/funfact/ before kiosk
// deploy — picsum requires network access.
const PLACEHOLDER_THUMBS = [
  { id: 1, label: "Cross-section", src: "https://picsum.photos/seed/funfact-crosssection/800/450" },
  { id: 2, label: "Repeater",      src: "https://picsum.photos/seed/funfact-repeater/800/450" },
  { id: 3, label: "Cable ship I",  src: "https://picsum.photos/seed/funfact-ship-1/800/450" },
  { id: 4, label: "Cable ship II", src: "https://picsum.photos/seed/funfact-ship-2/800/450" },
];

// Panel gradient lifted from temp/facts_bg_gradient.css
const PANEL_BG =
  "linear-gradient(0.55deg, #034DA1 0.51%, rgba(3, 77, 161, 0.3) 33.81%), linear-gradient(180deg, #F05A22 0%, rgba(240, 90, 34, 0.4) 36.77%)";

const TITLE_STRIP_HEIGHT = 47;

export default function FunFactDialog({
  cable,
  onClose,
  language = "en",
}: FunFactDialogProps) {
  const t = useT(language);
  const [activeIndex, setActiveIndex] = useState(0);

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

        {/* Main player area — moved to top for touch-friendly thumb access below */}
        <div
          style={{
            aspectRatio: "16 / 9",
            maxHeight: 460,
            background: "rgba(0, 0, 0, 0.50)",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            margin: 22,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            overflow: "hidden",
          }}
        >
          <img
            src={PLACEHOLDER_THUMBS[activeIndex].src}
            alt={PLACEHOLDER_THUMBS[activeIndex].label}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              opacity: 0.85,
            }}
          />
          {/* Play button — blue circle + orange triangle */}
          <button
            type="button"
            aria-label={`Play ${PLACEHOLDER_THUMBS[activeIndex].label}`}
            style={{
              position: "relative",
              width: 84,
              height: 84,
              borderRadius: "50%",
              background: "var(--v1-blue)",
              border: "2px solid var(--v1-fg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
            }}
          >
            <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--v1-orange)" aria-hidden>
              <polygon points="7,4 21,12 7,20" />
            </svg>
          </button>
          <span
            style={{
              position: "absolute",
              bottom: 14,
              left: 18,
              fontFamily: "var(--v1-heading)",
              fontWeight: 600,
              fontSize: 12,
              letterSpacing: "0.20em",
              textTransform: "uppercase",
              color: "var(--v1-fg)",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)",
            }}
          >
            {t("overview")} · {cable.shortName}
          </span>
        </div>

        {/* Bottom thumbnail strip — at bottom for easier touch access */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            padding: 22,
            borderTop: "1px solid rgba(255, 255, 255, 0.15)",
          }}
        >
          {PLACEHOLDER_THUMBS.map((thumb, i) => {
            const active = activeIndex === i;
            return (
              <button
                key={thumb.id}
                type="button"
                onClick={() => setActiveIndex(i)}
                aria-pressed={active}
                style={{
                  aspectRatio: "16 / 9",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: `${active ? 3 : 1}px solid ${active ? "var(--v1-orange)" : "rgba(255, 255, 255, 0.30)"}`,
                  cursor: "pointer",
                  padding: 0,
                  overflow: "hidden",
                  position: "relative",
                }}
              >
                <img
                  src={thumb.src}
                  alt={thumb.label}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    display: "block",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: 4,
                    left: 6,
                    fontFamily: "var(--v1-mono)",
                    fontSize: 9,
                    color: "var(--v1-fg)",
                    textShadow: "0 1px 2px rgba(0,0,0,0.8)",
                  }}
                >
                  {thumb.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
      </div>
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
