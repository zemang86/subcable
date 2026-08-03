"use client";

import { useState } from "react";
import type { VideoScreen as VideoData } from "@/data/generalInfo";
import { CardBrackets, PANEL_PAD, StepButton, type ScreenProps } from "./shared";

/**
 * Videos — poster, player chrome and pagination.
 *
 * The clips themselves aren't supplied yet: a screen with no `src` shows the
 * design's static chrome with an inert play control. As soon as a file lands in
 * /public, setting `src` on that screen turns it into a real <video>. This tab
 * doesn't auto-advance (see INFO_TABS) — rotating away from a playing clip
 * would be wrong — so the dots and the arrow are the only way through it.
 */
export default function VideoScreen({
  screen,
  index,
  count,
  onStep,
  onSelect,
}: { screen: VideoData } & ScreenProps) {
  const [playing, setPlaying] = useState(false);
  const playable = Boolean(screen.src);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      <div style={{ position: "relative", padding: "14px 16px" }}>
        <CardBrackets />

        <h2
          style={{
            margin: "0 0 14px",
            fontFamily: "var(--v1-mono)",
            fontWeight: 600,
            fontSize: 30,
            lineHeight: "38px",
            color: "var(--v1-fg)",
          }}
        >
          {screen.title}
        </h2>

        <div
          style={{
            position: "relative",
            aspectRatio: "16 / 9",
            maxHeight: 420,
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.85)",
            background: "rgba(0, 0, 0, 0.5)",
          }}
        >
          {playing && screen.src ? (
            <video
              src={screen.src}
              poster={screen.poster.src}
              controls
              autoPlay
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
              <img
                src={screen.poster.src}
                alt={screen.poster.alt}
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                }}
              />
              <button
                type="button"
                onClick={() => playable && setPlaying(true)}
                aria-label={playable ? `Play ${screen.title}` : "Video pending"}
                aria-disabled={!playable}
                className="v1-pressable"
                style={{
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: 108,
                  height: 108,
                  borderRadius: "50%",
                  border: "none",
                  background: "var(--v1-blue)",
                  cursor: playable ? "pointer" : "default",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  padding: 0,
                }}
              >
                <svg width="36" height="40" viewBox="0 0 24 24" aria-hidden>
                  <polygon points="7,4 21,12 7,20" fill="var(--v1-orange)" />
                </svg>
              </button>
              <ControlBar duration={screen.duration} />
            </>
          )}
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
          minHeight: 48,
        }}
      >
        <div style={{ display: "flex", gap: 10 }}>
          {Array.from({ length: count }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onSelect(i)}
              aria-label={`Video ${i + 1}`}
              aria-current={i === index}
              style={{
                width: 24,
                height: 24,
                padding: 0,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background:
                    i === index ? "var(--v1-blue)" : "rgba(255, 255, 255, 0.55)",
                }}
              />
            </button>
          ))}
        </div>

        <div style={{ position: "absolute", right: 0, display: "flex", gap: 10 }}>
          {index > 0 && <StepButton direction="prev" onClick={() => onStep(-1)} />}
          {index < count - 1 && (
            <StepButton direction="next" onClick={() => onStep(1)} />
          )}
        </div>
      </div>
    </div>
  );
}

/** Static player chrome from the export — live controls come with the clips. */
function ControlBar({ duration }: { duration: string }) {
  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(140, 140, 140, 0.72)",
      }}
    >
      <div style={{ position: "relative", height: 3, background: "rgba(255, 255, 255, 0.5)" }}>
        <span
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: "21%",
            background: "var(--v1-orange)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: "21%",
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: "var(--v1-orange)",
          }}
        />
      </div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          padding: "8px 12px",
        }}
      >
        <GlyphBox>
          <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
            <rect x="1" y="1" width="4" height="14" fill="#FFFFFF" />
            <rect x="9" y="1" width="4" height="14" fill="#FFFFFF" />
          </svg>
        </GlyphBox>
        <GlyphBox>
          <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden>
            <path d="M1 5h4l5-4v14l-5-4H1z" fill="#FFFFFF" />
            <path d="M13 4a6 6 0 0 1 0 8" stroke="#FFFFFF" strokeWidth="1.6" fill="none" />
          </svg>
        </GlyphBox>
        <span
          style={{
            padding: "6px 12px",
            background: "rgba(255, 255, 255, 0.35)",
            fontFamily: "var(--v1-mono)",
            fontSize: 13,
            color: "#FFFFFF",
          }}
        >
          0:00/{duration}
        </span>
        <span style={{ flex: 1 }} />
        <GlyphBox>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path
              d="M2 7V2h5M16 11v5h-5M16 7V2h-5M2 11v5h5"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              fill="none"
            />
          </svg>
        </GlyphBox>
      </div>
    </div>
  );
}

function GlyphBox({ children }: { children: React.ReactNode }) {
  return (
    <span
      aria-hidden
      style={{
        width: 38,
        height: 32,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(255, 255, 255, 0.25)",
        border: "1px solid rgba(255, 255, 255, 0.5)",
      }}
    >
      {children}
    </span>
  );
}
