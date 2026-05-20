"use client";

import { useState } from "react";
import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

interface FunFactDialogProps {
  cable: CableSystem;
  onClose: () => void;
  language?: Language;
}

// Placeholder asset references — paths resolve to /public/textures/funfact/.
// Per §H.6 resolution, the client will supply real images later.
const PLACEHOLDER_THUMBS = [
  { id: 1, label: "Cross-section", src: "/textures/funfact/placeholder-1.webp" },
  { id: 2, label: "Repeater",       src: "/textures/funfact/placeholder-2.webp" },
  { id: 3, label: "Cable ship I",   src: "/textures/funfact/placeholder-3.webp" },
  { id: 4, label: "Cable ship II",  src: "/textures/funfact/placeholder-4.webp" },
];

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
        background: "var(--v1-bg-deep)",
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

      {/* Title strip bottom */}
      <div
        style={{
          borderTop: "1px solid rgba(255, 255, 255, 0.20)",
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          className="v1-h-display"
          style={{ fontSize: 18, color: "var(--v1-fg)" }}
        >
          {t("funFactTitle")}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            width: 36,
            height: 36,
            background: "transparent",
            border: "1px solid rgba(255, 255, 255, 0.40)",
            color: "var(--v1-fg)",
            cursor: "pointer",
            fontFamily: "var(--v1-mono)",
            fontSize: 14,
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}
