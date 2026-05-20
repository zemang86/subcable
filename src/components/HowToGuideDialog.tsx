"use client";

import { useT } from "@/lib/i18n";
import type { Language } from "@/lib/types";

interface HowToGuideDialogProps {
  onClose: () => void;
  language?: Language;
}

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
          minHeight: 500,
          background: "var(--v1-bg-deep)",
          border: "1px solid rgba(255, 255, 255, 0.30)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {/* Tile row — 3 bracket-corner tiles */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 24,
            padding: "48px 56px",
            flex: 1,
          }}
        >
          <Tile
            title={t("tapToInteract")}
            body={t("tapToInteractBody")}
            icon={
              <>
                <path d="M9 11.5V7a2 2 0 0 1 4 0v6" />
                <path d="M13 8a2 2 0 0 1 4 0v5" />
                <path d="M17 9a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-5.66-4l-2.21-6a2 2 0 0 1 3.76-1.34l1.11 3" />
              </>
            }
          />
          <Tile
            title={t("zoomInOut")}
            body={t("zoomInOutBody")}
            icon={
              <>
                <circle cx="11" cy="11" r="7" />
                <path d="M21 21l-4.35-4.35" />
                <path d="M11 8v6M8 11h6" />
              </>
            }
          />
          <Tile
            title={t("swipe")}
            body={t("swipeBody")}
            icon={
              <>
                <path d="M3 12h18" />
                <path d="M9 6l-6 6 6 6" />
                <path d="M15 6l6 6-6 6" />
              </>
            }
          />
        </div>

        {/* Title strip bottom */}
        <div
          style={{
            borderTop: "1px solid rgba(255, 255, 255, 0.20)",
            padding: "16px 32px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            className="v1-h-display"
            style={{ fontSize: 16, color: "var(--v1-fg)" }}
          >
            {t("howToTitle")}
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
    </div>
  );
}

function Tile({
  icon,
  title,
  body,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div
      className="v1-bracket"
      style={{
        padding: "32px 24px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 16,
        textAlign: "center",
      }}
    >
      <span className="bracket-tl" />
      <span className="bracket-br" />
      <svg
        width="40"
        height="40"
        viewBox="0 0 24 24"
        fill="none"
        stroke="var(--v1-fg)"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        {icon}
      </svg>
      <div
        className="v1-h-heading"
        style={{
          fontSize: 13,
          color: "var(--v1-fg)",
          textTransform: "uppercase",
          letterSpacing: "0.12em",
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: "var(--v1-mono)",
          fontSize: 9.5,
          color: "var(--v1-mute)",
          lineHeight: 1.6,
          margin: 0,
        }}
      >
        {body}
      </p>
    </div>
  );
}
