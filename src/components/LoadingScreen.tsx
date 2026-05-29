"use client";

import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface LoadingScreenProps {
  language?: Language;
}

// Loading bar geometry from Figma (temp/loading.css, 2048-wide canvas):
//   track  — left 198, width 1652  → 80.66% wide, centred (symmetric 9.67% margins)
//   fill   — white, 3px, sweeps 0 → 100%
//   glow   — blurred white copy trailing the leading edge (blur 4.95px)
const BAR_WIDTH = "80.66%";
const BAR_THICKNESS = 3;
// Just for show — a leisurely 3s sweep. (Globe reveal is gated separately by
// GlobeScene's own min-hold; this is purely the visual fill duration.)
const FILL_MS = 3000;

export default function LoadingScreen({ language = "en" }: LoadingScreenProps) {
  const t = useT(language);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#040E1F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
      }}
    >
      {/* 3×3 TV wall grid pattern */}
      <div
        className="v1-tv-grid"
        style={{
          position: "absolute",
          inset: 0,
          opacity: 0.38,
        }}
      />

      <span
        className="v1-h-display"
        style={{
          fontFamily: "var(--v1-heading)",
          fontSize: 60,
          color: "var(--v1-fg)",
          letterSpacing: "0.15em",
          textTransform: "uppercase",
          fontWeight: 400,
          marginBottom: 48,
        }}
      >
        {t("loading")}
      </span>

      {/* Loading bar — dark track with an animated white fill + leading glow */}
      <div
        style={{
          position: "relative",
          width: BAR_WIDTH,
          height: BAR_THICKNESS,
          background: "#293445",
        }}
      >
        {/* Blurred glow underlay — follows the fill's leading edge */}
        <div
          style={{
            position: "absolute",
            insetBlock: 0,
            left: 0,
            width: "100%",
            height: BAR_THICKNESS,
            background: "#FFFFFF",
            filter: "blur(4.95px)",
            transformOrigin: "left center",
            willChange: "transform",
            animation: `v1-loadbar ${FILL_MS}ms ease-out forwards`,
          }}
        />
        {/* Solid white fill */}
        <div
          style={{
            position: "absolute",
            insetBlock: 0,
            left: 0,
            width: "100%",
            height: BAR_THICKNESS,
            background: "#FFFFFF",
            transformOrigin: "left center",
            willChange: "transform",
            animation: `v1-loadbar ${FILL_MS}ms ease-out forwards`,
          }}
        />
      </div>
    </div>
  );
}
