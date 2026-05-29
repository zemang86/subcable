"use client";

import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface HowToGuideDialogProps {
  onClose: () => void;
  language?: Language;
}

const TITLE_STRIP_HEIGHT = 47;

export default function HowToGuideDialog({
  onClose,
  language = "en",
}: HowToGuideDialogProps) {
  const t = useT(language);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("howToTitle")}
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "rgba(0, 0, 0, 0.30)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "min(1100px, 100%)",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        <TitleStrip title={t("howToTitle")} onClose={onClose} />

        {/* Panel body — bevelled SVG card (orange→blue gradient + white stroke
            outline + cut corners) from temp/card-help.svg replaces the CSS
            gradient + HUD bracket frame approach. */}
        <div
          style={{
            position: "relative",
            padding: "64px 60px",
            aspectRatio: "1058 / 416",
          }}
        >
          <PanelBackground />

          <div
            style={{
              position: "relative",
              zIndex: 1,
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 36,
              height: "100%",
              alignContent: "center",
            }}
          >
            <Tile
              title={t("tapToInteract")}
              body={t("tapToInteractBody")}
              image="/textures/howto/tap.png"
            />
            <Tile
              title={t("zoomInOut")}
              body={t("zoomInOutBody")}
              image="/textures/howto/pinch.png"
            />
            <Tile
              title={t("swipe")}
              body={t("swipeBody")}
              image="/textures/howto/swipe.png"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────── TILE ───────────────────────────── */
// Per temp/help_comp.css: ~202px square, translucent grey-20% bg, hairline
// white border, plus a small outlined rectangle at each of the 4 corners
// (Vector 132–135). PNG illustration sits inside the frame, IBM Plex Mono
// 600 24px title + Space Mono 400 14px body stack below.

function Tile({
  image,
  title,
  body,
}: {
  image: string;
  title: string;
  body: string;
}) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 18,
        textAlign: "center",
      }}
    >
      {/* PNG illustration — fills the tile, frame/border baked into the asset */}
      <img
        src={image}
        alt={title}
        style={{
          width: "100%",
          maxWidth: 202,
          aspectRatio: "1 / 1",
          objectFit: "contain",
          display: "block",
        }}
      />

      <div
        style={{
          fontFamily: "var(--v1-mono)",
          fontWeight: 600,
          fontSize: 24,
          lineHeight: "32px",
          color: "#FFFFFF",
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: "var(--v1-mono)",
          fontWeight: 400,
          fontSize: 14,
          lineHeight: "21px",
          color: "#FFFFFF",
          margin: 0,
          maxWidth: 260,
        }}
      >
        {body}
      </p>
    </div>
  );
}

/* ──────────────────────── PANEL BACKGROUND ──────────────────────── */
// Bevelled card lifted verbatim from temp/card-help.svg — single shape
// stretches to fill its container. preserveAspectRatio="none" lets the
// bevel cuts skew slightly with panel width but keeps the silhouette right
// at our intended 1058×416 aspect.

function PanelBackground() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 1058 416"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <path
        d="M1028.02 0.5H25.767L0.5 27.1821V392.306L22.9595 414.775H46.8227H641.999H1029.43L1057.5 386.688V29.9907L1028.02 0.5Z"
        fill="url(#help_card_orange)"
      />
      <path
        d="M1028.02 0.5H25.767L0.5 27.1821V392.306L22.9595 414.775H46.8227H641.999H1029.43L1057.5 386.688V29.9907L1028.02 0.5Z"
        fill="url(#help_card_blue)"
      />
      <path
        d="M1028.02 0.5H25.767L0.5 27.1821V392.306L22.9595 414.775H46.8227H641.999H1029.43L1057.5 386.688V29.9907L1028.02 0.5Z"
        stroke="white"
        fill="none"
      />
      <defs>
        <linearGradient
          id="help_card_orange"
          x1="529.461"
          y1="0.499985"
          x2="529.461"
          y2="245.655"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#F05A22" />
          <stop offset="1" stopColor="#F05A22" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient
          id="help_card_blue"
          x1="544.883"
          y1="433.628"
          x2="543.832"
          y2="168.746"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#034DA1" />
          <stop offset="1" stopColor="#034DA1" stopOpacity="0.3" />
        </linearGradient>
      </defs>
    </svg>
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */
// 47px tall, translucent-white gradient fill, hairline white border,
// crosshair (+) at each of the 4 corners, title 28px Chakra Petch 500.
// Mirrors the FunFactDialog / CableInformation title strip exactly.

function TitleStrip({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
      data-stem-title
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
