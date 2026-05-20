"use client";

import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface LoadingScreenProps {
  language?: Language;
}

export default function LoadingScreen({ language = "en" }: LoadingScreenProps) {
  const t = useT(language);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 50,
        background: "#000000",
        display: "flex",
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

      {/* Top + bottom hairlines */}
      <div
        style={{
          position: "absolute",
          top: "calc(50% - 80px)",
          left: "10%",
          right: "10%",
          height: 1,
          background: "rgba(255, 255, 255, 0.45)",
        }}
      />
      <div
        style={{
          position: "absolute",
          top: "calc(50% + 80px)",
          left: "10%",
          right: "10%",
          height: 1,
          background: "rgba(255, 255, 255, 0.45)",
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
          fontWeight: 500,
        }}
      >
        {t("loading")}
      </span>
    </div>
  );
}
