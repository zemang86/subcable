"use client";

import { useState } from "react";
import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

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
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50,
        width: "min(1200px, 96vw)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <TitleStrip title={t("funFactTitle")} onClose={onClose} />

      {/* Panel body — gradient bg matches cable-system/cable-info treatment */}
      <div
        style={{
          position: "relative",
          background: PANEL_BG,
          border: "1px solid rgba(255, 255, 255, 0.40)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Top thumbnail strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 12,
            padding: 22,
            borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
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

        {/* Main player area */}
        <div
          style={{
            aspectRatio: "16 / 9",
            maxHeight: 560,
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
      </div>
    </div>
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
  return (
    <div
      style={{
        position: "relative",
        width: "100%",
        height: TITLE_STRIP_HEIGHT,
        background:
          "linear-gradient(0deg, rgba(255,255,255,0) 41.87%, #FFFFFF 413.39%), linear-gradient(180deg, rgba(255,255,255,0) 45.95%, #FFFFFF 278.39%)",
        border: "0.37px solid #FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        boxSizing: "border-box",
      }}
    >
      <CrossMark position="tl" />
      <CrossMark position="tr" />
      <CrossMark position="bl" />
      <CrossMark position="br" />
      <span
        style={{
          fontFamily: "var(--v1-display)",
          fontWeight: 500,
          fontSize: 28,
          lineHeight: "36px",
          color: "#FFFFFF",
        }}
      >
        {title}
      </span>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close"
        style={{
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
