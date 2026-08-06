"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { VideoScreen as VideoData } from "@/data/generalInfo";
import { CardBrackets, PANEL_PAD, StepButton, type ScreenProps } from "./shared";

/**
 * Videos — poster, player chrome and pagination.
 *
 * The chrome from the export *is* the player: no native `controls`, so the
 * kiosk never shows browser UI. A screen with a `src` plays on tap; one without
 * keeps the same chrome with the controls inert. The dots and the arrow are the
 * only way through the tab; stepping away remounts the screen (the panel keys
 * it by id), which stops playback.
 */
export default function VideoScreen({
  screen,
  index,
  count,
  onStep,
  onSelect,
  onHoldIdle,
}: { screen: VideoData } & ScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const [started, setStarted] = useState(false);
  // Starts true so `playing` only goes high once the play event actually fires:
  // if the clip never starts (decode failure, autoplay refusal) the idle hold
  // below must never be raised, or the kiosk can't return to attract.
  const [paused, setPaused] = useState(true);
  const [muted, setMuted] = useState(false);
  const [time, setTime] = useState(0);
  const [length, setLength] = useState(0);
  const playable = Boolean(screen.src);
  const playing = started && !paused;

  // Watching is engagement, but it produces no pointer events, so hold the idle
  // attractor off while a clip runs — both clips outlast the 60s window (the
  // repair one is 3:08). The cleanup is the important half: it lowers the hold
  // when the tab changes or the panel closes mid-play, which is the difference
  // between a paused attractor and a kiosk that never returns to attract.
  useEffect(() => {
    onHoldIdle(playing);
    return () => onHoldIdle(false);
  }, [playing, onHoldIdle]);

  const toggle = useCallback(() => {
    if (!playable) return;
    const video = videoRef.current;
    if (!started || !video) {
      setStarted(true);
      setPaused(true);
      return;
    }
    if (video.paused) void video.play().catch(() => setPaused(true));
    else video.pause();
  }, [playable, started]);

  const seekTo = useCallback((ratio: number) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const next = Math.min(Math.max(ratio, 0), 1) * video.duration;
    video.currentTime = next;
    setTime(next);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void frameRef.current?.requestFullscreen?.();
  }, []);

  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        flexDirection: "column",
        gap: 14,
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          padding: "14px 16px",
        }}
      >
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

        {/* Player = picture stacked above its controls, both inside the one
            bordered frame. The control bar is in normal flow, not floated over
            the picture: on a kiosk it is always visible, so overlaying it would
            permanently cover the bottom of every clip. The stage takes whatever
            height is left, which is why the picture is shorter than the frame. */}
        <div
          ref={frameRef}
          style={{
            position: "relative",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRadius: 8,
            border: "1px solid rgba(255, 255, 255, 0.85)",
            background: "#000000",
          }}
        >
          <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
            {started && screen.src ? (
              <video
                ref={videoRef}
                src={screen.src}
                poster={screen.poster.src}
                autoPlay
                muted={muted}
                playsInline
                onClick={toggle}
                onPlay={() => setPaused(false)}
                onPause={() => setPaused(true)}
                onLoadedMetadata={(e) => setLength(e.currentTarget.duration)}
                onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
                onEnded={() => {
                  setStarted(false);
                  setPaused(true);
                  setTime(0);
                }}
                // A clip that fails to load or decode must fall back to the
                // poster and release the idle hold — otherwise the attractor
                // never fires again for the rest of the exhibit day.
                onError={() => {
                  setStarted(false);
                  setPaused(true);
                  setTime(0);
                }}
                // contain, not cover: the two clips aren't the same aspect (16:9
                // and 4:3) and cropping a documentary frame to fill is worse than
                // pillarboxing it against the black backing.
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                }}
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
                  onClick={toggle}
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
              </>
            )}
          </div>

          <ControlBar
            live={playable}
            playing={playing}
            muted={muted}
            time={time}
            length={length}
            durationLabel={screen.duration}
            onToggle={toggle}
            onMute={() => setMuted((m) => !m)}
            onSeek={seekTo}
            onFullscreen={toggleFullscreen}
          />
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

/* ── Player chrome ── */
// Drawn to the export: grey wash, orange scrub with a round knob, glyph boxes
// and the time pill. Always on screen — a kiosk has no hover to reveal it, and
// because it never hides it sits under the picture rather than over it.

const GLYPH_W = 38;
const GLYPH_H = 32;
/** Transparent padding that lifts each glyph to the 48px touch minimum. */
const GLYPH_PAD_X = (48 - GLYPH_W) / 2;
const GLYPH_PAD_Y = (48 - GLYPH_H) / 2;

function ControlBar({
  live,
  playing,
  muted,
  time,
  length,
  durationLabel,
  onToggle,
  onMute,
  onSeek,
  onFullscreen,
}: {
  live: boolean;
  playing: boolean;
  muted: boolean;
  time: number;
  length: number;
  durationLabel: string;
  onToggle: () => void;
  onMute: () => void;
  onSeek: (ratio: number) => void;
  onFullscreen: () => void;
}) {
  // Before metadata arrives there's nothing to scrub against, so the bar sits
  // at the export's own 21% rather than snapping to an empty zero.
  const progress = length > 0 ? time / length : live ? 0 : 0.21;

  const scrub = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!live || length <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    onSeek((e.clientX - rect.left) / rect.width);
  };

  return (
    <div
      style={{
        flex: "none",
        background: "rgba(140, 140, 140, 0.72)",
      }}
    >
      {/* The visible track is 3px; the hit area around it is 24px so a finger
          can find it. The strip sits below the picture rather than over it, so
          the track is centred in its hit area instead of being pulled up onto
          the video's bottom edge. */}
      <div
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          scrub(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) scrub(e);
        }}
        style={{
          position: "relative",
          height: 24,
          display: "flex",
          alignItems: "center",
          cursor: live ? "pointer" : "default",
          touchAction: "none",
        }}
      >
        <div
          style={{
            position: "relative",
            width: "100%",
            height: 3,
            background: "rgba(255, 255, 255, 0.5)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: 0,
              top: 0,
              bottom: 0,
              width: `${progress * 100}%`,
              background: "var(--v1-orange)",
            }}
          />
          <span
            style={{
              position: "absolute",
              left: `${progress * 100}%`,
              top: "50%",
              transform: "translate(-50%, -50%)",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "var(--v1-orange)",
            }}
          />
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          padding: `4px ${12 - GLYPH_PAD_X}px 4px`,
        }}
      >
        <GlyphButton
          label={playing ? "Pause" : "Play"}
          disabled={!live}
          onClick={onToggle}
        >
          {playing ? (
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
              <rect x="1" y="1" width="4" height="14" fill="#FFFFFF" />
              <rect x="9" y="1" width="4" height="14" fill="#FFFFFF" />
            </svg>
          ) : (
            <svg width="14" height="16" viewBox="0 0 14 16" aria-hidden>
              <polygon points="2,1 13,8 2,15" fill="#FFFFFF" />
            </svg>
          )}
        </GlyphButton>

        <GlyphButton
          label={muted ? "Unmute" : "Mute"}
          disabled={!live}
          onClick={onMute}
        >
          <svg width="18" height="16" viewBox="0 0 18 16" aria-hidden>
            <path d="M1 5h4l5-4v14l-5-4H1z" fill="#FFFFFF" />
            {muted ? (
              <path
                d="M12 5l5 6M17 5l-5 6"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                fill="none"
              />
            ) : (
              <path
                d="M13 4a6 6 0 0 1 0 8"
                stroke="#FFFFFF"
                strokeWidth="1.6"
                fill="none"
              />
            )}
          </svg>
        </GlyphButton>

        <span
          style={{
            marginLeft: GLYPH_PAD_X,
            padding: "6px 12px",
            background: "rgba(255, 255, 255, 0.35)",
            fontFamily: "var(--v1-mono)",
            fontSize: 13,
            color: "#FFFFFF",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock(time)}/{length > 0 ? clock(length) : durationLabel}
        </span>

        <span style={{ flex: 1 }} />

        <GlyphButton label="Fullscreen" disabled={!live} onClick={onFullscreen}>
          <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden>
            <path
              d="M2 7V2h5M16 11v5h-5M16 7V2h-5M2 11v5h5"
              stroke="#FFFFFF"
              strokeWidth="1.6"
              fill="none"
            />
          </svg>
        </GlyphButton>
      </div>
    </div>
  );
}

/**
 * The export's 38×32 glyph box, wrapped in transparent padding so the tappable
 * area is 48px square without the artwork growing. The padding also supplies
 * the gap between glyphs, so they don't need one.
 */
function GlyphButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      style={{
        padding: `${GLYPH_PAD_Y}px ${GLYPH_PAD_X}px`,
        border: "none",
        background: "transparent",
        cursor: disabled ? "default" : "pointer",
        display: "flex",
      }}
    >
      <span
        style={{
          width: GLYPH_W,
          height: GLYPH_H,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "rgba(255, 255, 255, 0.25)",
          border: "1px solid rgba(255, 255, 255, 0.5)",
          opacity: disabled ? 0.6 : 1,
        }}
      >
        {children}
      </span>
    </button>
  );
}

/** m:ss — every clip here is well under an hour. */
function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  return `${mins}:${String(whole % 60).padStart(2, "0")}`;
}
