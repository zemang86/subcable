"use client";

import { useEffect, useState } from "react";
import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface SplashScreenProps {
  language?: Language;
  // When true, the splash fades out (parent unmounts it after the fade).
  fadingOut?: boolean;
}

// Intro splash shown after the loading screen and before the globe.
// Crossfades IN over the still-mounted loading screen (both share the
// #040E1F backdrop, so no flash), then fades OUT to reveal the globe.
// Layout from Figma (temp/splash.css, 2048-wide canvas):
//   "Submarine Cable Map" — Chakra Petch 700, 88px, centred (top 405)
//   "Brought to you by"    — IBM Plex Mono 400, 30px, centred (top 562)
//   TM Global logo         — 158×74, centred (top 635)
const FADE_MS = 600;

export default function SplashScreen({
  language = "en",
  fadingOut = false,
}: SplashScreenProps) {
  const t = useT(language);
  // Start transparent, flip opaque on the next frame → CSS fade-in.
  const [shown, setShown] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => setShown(true));
    return () => cancelAnimationFrame(id);
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        background: "#040E1F",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        opacity: shown && !fadingOut ? 1 : 0,
        transition: `opacity ${FADE_MS}ms ease`,
      }}
    >
      {/* 3×3 TV wall grid pattern — consistent with the loading screen */}
      <div
        className="v1-tv-grid"
        style={{ position: "absolute", inset: 0, opacity: 0.38 }}
      />

      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          animation: "v1-splash-rise 700ms ease-out both",
        }}
      >
        <span
          style={{
            fontFamily: "var(--v1-display)",
            fontWeight: 700,
            fontSize: "clamp(40px, 6.4vw, 88px)",
            lineHeight: 1.1,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {t("submarineCableMap")}
        </span>

        <span
          style={{
            marginTop: "clamp(20px, 2.6vw, 40px)",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: "clamp(15px, 1.6vw, 30px)",
            lineHeight: 1.3,
            color: "#FFFFFF",
            textAlign: "center",
          }}
        >
          {t("broughtToYouBy")}
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tm-logo.png"
          alt="Telekom Malaysia"
          style={{
            marginTop: "clamp(18px, 2vw, 32px)",
            width: "clamp(120px, 11vw, 200px)",
            height: "auto",
            userSelect: "none",
            pointerEvents: "none",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
