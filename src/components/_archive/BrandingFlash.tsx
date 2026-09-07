"use client";

// ───────── BrandingFlash (ARCHIVED v8) ─────────
// Extracted from GlobeScene.tsx when the idle/emerge flow moved to the
// video-driven IntroSequence (v8). No longer rendered anywhere — kept here so
// the title-card treatment ("Submarine Cable Map" / "Brought to you by" / TM
// logo / HUD tagline, staggered v1-brand-rise, ice-blue shine, `+` crosshair
// frame) can be restored or re-used later. To bring it back, render
// <BrandingFlash language leaving onGone /> over the globe.

import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

export function BrandingFlash({
  language,
  leaving,
  onGone,
}: {
  language: Language;
  leaving: boolean;
  onGone: () => void;
}) {
  const t = useT(language);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        opacity: leaving ? 0 : 1,
        transition: "opacity 700ms ease",
      }}
      onTransitionEnd={() => {
        if (leaving) onGone();
      }}
    >
      {/* Scrim — soft dark halo so the white text reads off the globe. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "min(120vw, 1100px)",
          height: "min(80vh, 620px)",
          background:
            "radial-gradient(ellipse at center, rgba(2,8,20,0.62) 0%, rgba(2,8,20,0.34) 46%, transparent 72%)",
        }}
      />

      {/* Framed card — frosted glass panel with `+` corner crosshairs. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "clamp(30px, 4vw, 60px) clamp(40px, 6vw, 96px)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          background: "rgba(8, 18, 33, 0.30)",
          backdropFilter: "blur(16px) saturate(1.15)",
          WebkitBackdropFilter: "blur(16px) saturate(1.15)",
          boxShadow:
            "0 24px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        }}
      >
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <BrandCross key={pos} position={pos} />
        ))}

        <span
          className="v1-brand-title"
          style={{
            fontFamily: "var(--v1-display)",
            fontWeight: 700,
            fontSize: "clamp(40px, 6.4vw, 88px)",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          {t("submarineCableMap")}
        </span>

        <span
          className="v1-brand-rise"
          style={{
            animationDelay: "150ms",
            marginTop: "clamp(20px, 2.6vw, 40px)",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: "clamp(15px, 1.6vw, 30px)",
            color: "#FFFFFF",
            textAlign: "center",
            textShadow: "0 2px 18px rgba(0, 0, 0, 0.7)",
          }}
        >
          {t("broughtToYouBy")}
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tm-logo.png"
          alt="Telekom Malaysia"
          className="v1-brand-rise"
          style={{
            animationDelay: "300ms",
            marginTop: "clamp(18px, 2vw, 32px)",
            width: "clamp(120px, 11vw, 200px)",
            height: "auto",
            userSelect: "none",
            filter: "drop-shadow(0 4px 22px rgba(0, 0, 0, 0.55))",
          }}
          draggable={false}
        />

        <span
          className="v1-brand-rise"
          style={{
            animationDelay: "440ms",
            marginTop: "clamp(16px, 1.8vw, 28px)",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: "clamp(10px, 0.95vw, 15px)",
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(184, 230, 255, 0.78)",
            textAlign: "center",
            textShadow: "0 2px 14px rgba(0, 0, 0, 0.7)",
          }}
        >
          {t("globalSubmarineNetwork")}
        </span>
      </div>
    </div>
  );
}

// 8×8 `+` corner crosshair for the branding frame (project title-strip
// convention — see CableInformation's CrossMark).
function BrandCross({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const variants = {
    tl: { top: -4, left: -4 },
    tr: { top: -4, right: -4 },
    bl: { bottom: -4, left: -4 },
    br: { bottom: -4, right: -4 },
  } as const;
  return (
    <span
      aria-hidden
      style={{ position: "absolute", width: 8, height: 8, ...variants[position] }}
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
