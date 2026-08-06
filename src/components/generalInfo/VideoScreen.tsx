"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import type { VideoScreen as VideoData } from "@/data/generalInfo";
import {
  CutBox,
  PANEL_PAD,
  StepButton,
  TOUCH,
  type ScreenProps,
} from "./shared";

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
        padding: `6px ${PANEL_PAD}px 12px`,
      }}
    >
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          display: "flex",
          flexDirection: "column",
          // The frame itself is drawn at inset 0, so this padding is the clear
          // between its rails and everything the screen puts inside them.
          padding: `${FRAME_PAD_T}px ${FRAME_PAD_X}px ${FRAME_PAD_B}px`,
        }}
      >
        <VideoFrame />

        <h2
          style={{
            margin: `0 0 ${TITLE_GAP}px`,
            fontFamily: "var(--v1-mono)",
            fontWeight: 600,
            fontSize: 29,
            lineHeight: "38px",
            color: "var(--v1-fg)",
          }}
        >
          {screen.title}
        </h2>

        {/* Player = picture stacked above its controls, both inside the one
            bordered frame. The control bar is in normal flow, not floated over
            the picture: on a kiosk it is always visible, so overlaying it would
            permanently cover the bottom of every clip.

            The sizer holds the export's proportions. Left to fill the column
            the player stretched to about 1.8:1, which reads as a tall box; the
            export draws it 414.184 x 162.934 counting the bar. Shrink is still
            allowed, so a short window loses height rather than overflowing.

            The ratio sits on the sizer, not on the player: the player is what
            goes fullscreen, and it has to fill the screen there rather than
            hold a 2.54:1 letterbox in the middle of it. */}
        <div
          style={{
            flex: "0 1 auto",
            minHeight: 0,
            width: "100%",
            aspectRatio: PLAYER_ASPECT,
          }}
        >
          <div
            ref={frameRef}
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              boxSizing: "border-box",
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

        {/* Pager, inside the frame and under the player rather than under the
            frame: the export lines the arrow's right edge up with the video
            box's own, and centres the dots on that same box. Both fall out of
            putting the row in the frame's padding box, which is exactly the
            player's width. */}
        <div
          style={{
            position: "relative",
            marginTop: PAGER_GAP,
            minHeight: TOUCH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div style={{ display: "flex" }}>
            {Array.from({ length: count }, (_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`Video ${i + 1}`}
                aria-current={i === index}
                style={{
                  // Each button is exactly the export's dot pitch wide, so the
                  // hit areas tile without overlapping — widening one would eat
                  // into its neighbour. They gain their reach vertically.
                  width: DOT_PITCH,
                  height: TOUCH,
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
                    width: DOT,
                    height: DOT,
                    borderRadius: "50%",
                    background: i === index ? DOT_ON : DOT_OFF,
                  }}
                />
              </button>
            ))}
          </div>

          <div
            style={{ position: "absolute", right: 0, display: "flex", gap: 10 }}
          >
            {index > 0 && (
              <StepButton direction="prev" onClick={() => onStep(-1)} />
            )}
            {index < count - 1 && (
              <StepButton direction="next" onClick={() => onStep(1)} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Screen frame ── */

/**
 * The outline around the whole screen, verbatim from video-box.svg: a chamfer
 * at the top-left and again at the bottom-right, with the run between them left
 * open — the top edge stops a third of the way across after stepping down once,
 * the right rail climbs only a third of the way up, and the bottom edge breaks
 * in two. Nothing about it is symmetric, which is the point.
 *
 * Three stroked paths and no fill, so it is the export's own data under a
 * preserveAspectRatio="none". The frame is 1.80:1 in the export against 1.64:1
 * here, which tilts each chamfer by about a degree; reconstructing six runs and
 * two 45° cuts in CSS to avoid that would be far more code and no more faithful.
 * non-scaling-stroke holds every line at the export's ~2px.
 */
/** The export's player box, control bar included: 414.184 x 162.934. */
const PLAYER_ASPECT = 414.184 / 162.934;

/**
 * Pager dots, from video-dots.svg: r 2.41272 at a 9.651 centre-to-centre pitch,
 * scaled by the panel's 1040 over the export's 472 (x2.203). The two tones are
 * the export's own, and neither is a token this app already carries.
 */
const DOT = 11;
const DOT_PITCH = 21;
const DOT_ON = "#FF5E00";
const DOT_OFF = "#FFCEB1";
/** Clear between the bottom of the video box and the pager row. */
const PAGER_GAP = 16;

/**
 * The screen frame's own padding, from video-1.svg at the panel's x2.23: the
 * video box sits 38.6px inside the panel's left edge and the frame's rails run
 * either side of it, so 38 is what separates the box from the frame. The 28 on
 * top is the export's clear from the frame's top rail to the title, and the 12
 * below closes it under the pager.
 *
 * Together with the panel's 22px side padding these fix the box at 920 x 362 —
 * the export draws it 414.184 x 162.934, so the width decides the height and
 * everything else on the screen is sized around what is left.
 */
const FRAME_PAD_X = 38;
const FRAME_PAD_T = 28;
const FRAME_PAD_B = 12;
const TITLE_GAP = 16;

const VIDEO_FRAME_VIEWBOX = "0 0 439 244";
const VIDEO_FRAME = [
  "M0.439697 229.557V14.161L14.5096 0.439697H65.5129L70.051 4.9778H135.542",
  "M371.506 242.91H423.683L438.077 229.185L438.077 85.2459",
  "M364.907 242.91L240.923 242.91",
];

function VideoFrame() {
  return (
    <svg
      aria-hidden
      viewBox={VIDEO_FRAME_VIEWBOX}
      preserveAspectRatio="none"
      fill="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      {VIDEO_FRAME.map((d) => (
        <path
          key={d}
          d={d}
          stroke="#FFFFFF"
          strokeWidth={2}
          vectorEffect="non-scaling-stroke"
        />
      ))}
    </svg>
  );
}

/* ── Player chrome ── */

/**
 * Metrics off video-box.svg, scaled by this player's 920px against the
 * export's 414.18-unit picture (x2.221).
 *
 * The bar itself is the export's: 44px of solid #868585 under a hairline top
 * edge, with the scrub line straddling that edge rather than sitting in a lane
 * of its own. The glyphs are the cut-corner box again — the same drawing as the
 * step arrows, in white with an orange icon — at 27px, which is why they carry
 * their own transparent hit area to reach the kiosk's 48px minimum.
 *
 * One departure, kept from before: the export overlays this strip on the bottom
 * of the picture. Here it sits below. On a kiosk the controls never hide, so an
 * opaque overlay would permanently cover the bottom 44px of every clip.
 */
const BAR_H = 44;
const GLYPH = 27;
/** Between glyphs, and how far the row starts in from each end of the bar. */
const GLYPH_GAP = 20;
const BAR_PAD_L = 16;
const BAR_PAD_R = 21;
/** The export seats the glyphs high in the bar: 7px clear above, 10px below. */
const GLYPH_TOP = 7;
const PILL_W = 106;
const TRACK_H = 3;
const KNOB = 11;
/** Lifts each 27px glyph to the 48px touch minimum without growing the art. */
const GLYPH_REACH = (TOUCH - GLYPH) / 2;

/**
 * Icons are the export's own paths, moved to the box's local origin by a
 * translate rather than by hand-editing curves. Each box is 11.5374 x 11.433
 * export units, so that is the icon viewBox.
 */
const ICON_VIEWBOX = "0 0 11.5374 11.433";
const PAUSE_ORIGIN = "translate(-17.6527, -186.317)";
const VOLUME_ORIGIN = "translate(-37.7364, -186.317)";
const FULLSCREEN_ORIGIN = "translate(-404.373, -186.317)";

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
        position: "relative",
        flex: "none",
        height: BAR_H,
        boxSizing: "border-box",
        background: "#868585",
        borderTop: "1px solid #FFFFFF",
      }}
    >
      {/* The scrub line straddles the bar's own top edge, so the played run is
          orange and the rest is that hairline. The hit area reaches 10px up
          into the picture and 10px down into the bar — the line itself is 3px
          and no finger would find it otherwise. */}
      <div
        onPointerDown={(e) => {
          e.currentTarget.setPointerCapture(e.pointerId);
          scrub(e);
        }}
        onPointerMove={(e) => {
          if (e.buttons === 1) scrub(e);
        }}
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          top: -11,
          height: 20,
          cursor: live ? "pointer" : "default",
          touchAction: "none",
        }}
      >
        <span
          style={{
            position: "absolute",
            left: 0,
            top: (20 - TRACK_H) / 2,
            width: `${progress * 100}%`,
            height: TRACK_H,
            background: "var(--v1-orange)",
          }}
        />
        <span
          style={{
            position: "absolute",
            left: `${progress * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%)",
            width: KNOB,
            height: KNOB,
            borderRadius: "50%",
            background: "var(--v1-orange)",
          }}
        />
      </div>

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "flex-start",
          gap: GLYPH_GAP,
          padding: `${GLYPH_TOP}px ${BAR_PAD_R}px 0 ${BAR_PAD_L}px`,
        }}
      >
        <GlyphButton
          label={playing ? "Pause" : "Play"}
          disabled={!live}
          onClick={onToggle}
        >
          <g transform={PAUSE_ORIGIN}>
            {playing ? (
              <>
                <rect
                  x="20.3555"
                  y="189.156"
                  width="2.02503"
                  height="6.07509"
                  fill="var(--v1-orange)"
                />
                <rect
                  x="24.0654"
                  y="189.156"
                  width="2.02503"
                  height="6.07509"
                  fill="var(--v1-orange)"
                />
              </>
            ) : (
              // No play state in the export — the clip is running in it. Drawn
              // to the pause bars' own bounds so the two glyphs share a weight.
              <polygon
                points="20.356,189.156 26.090,192.194 20.356,195.231"
                fill="var(--v1-orange)"
              />
            )}
          </g>
        </GlyphButton>

        <GlyphButton
          label={muted ? "Unmute" : "Mute"}
          disabled={!live}
          onClick={onMute}
        >
          <g transform={VOLUME_ORIGIN}>
            <path
              d="M39.7086 193.785V190.437L44.0948 188.706V195.401L39.7086 193.785Z"
              fill="var(--v1-orange)"
            />
            {muted ? (
              // Also not in the export. The wave's own box, crossed out.
              <path
                d="M45.0202 190.207L46.6362 193.669M46.6362 190.207L45.0202 193.669"
                stroke="var(--v1-orange)"
                strokeWidth={0.923413}
              />
            ) : (
              <path
                d="M45.0202 190.207H46.6362V193.669H45.0202"
                stroke="var(--v1-orange)"
                strokeWidth={0.923413}
              />
            )}
          </g>
        </GlyphButton>

        <span
          style={{
            flex: "none",
            width: PILL_W,
            height: GLYPH,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(217, 217, 217, 0.54)",
            fontFamily: "var(--v1-mono)",
            fontSize: 12,
            color: "#FFFFFF",
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {clock(time)}/{length > 0 ? clock(length) : durationLabel}
        </span>

        <span style={{ flex: 1 }} />

        <GlyphButton label="Fullscreen" disabled={!live} onClick={onFullscreen}>
          {/* The export's own expand glyph: two arrows on the diagonal, not the
              four corner brackets this carried before. */}
          <g transform={FULLSCREEN_ORIGIN} fill="var(--v1-orange)">
            <path d="M405.95 187.584C405.765 187.584 405.615 187.733 405.615 187.918L405.615 190.931C405.615 191.116 405.765 191.266 405.95 191.266C406.134 191.266 406.284 191.116 406.284 190.931L406.284 188.253L408.962 188.253C409.147 188.253 409.297 188.103 409.297 187.918C409.297 187.733 409.147 187.584 408.962 187.584L405.95 187.584ZM409.494 191.463L409.731 191.226L406.186 187.682L405.95 187.918L405.713 188.155L409.257 191.699L409.494 191.463Z" />
            <path d="M414.219 196.524C414.404 196.524 414.554 196.374 414.554 196.189V193.176C414.554 192.991 414.404 192.841 414.219 192.841C414.034 192.841 413.884 192.991 413.884 193.176V195.854H411.206C411.021 195.854 410.872 196.004 410.872 196.189C410.872 196.374 411.021 196.524 411.206 196.524H414.219ZM410.872 192.841L410.635 193.078L413.982 196.425L414.219 196.189L414.456 195.952L411.108 192.605L410.872 192.841Z" />
          </g>
        </GlyphButton>
      </div>
    </div>
  );
}

/**
 * A control glyph: the export's cut-corner box in white, with the icon drawn
 * over it in the box's own export units.
 *
 * The box is 27px, so the button carries a transparent span reaching 10.5px
 * past it on every side to make the 48px touch target. That exactly fills the
 * 20px gap the export leaves between glyphs, so neighbouring targets meet
 * without overlapping.
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
        position: "relative",
        flex: "none",
        width: GLYPH,
        height: GLYPH,
        padding: 0,
        border: "none",
        background: "none",
        cursor: disabled ? "default" : "pointer",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      <span
        aria-hidden
        style={{ position: "absolute", inset: -GLYPH_REACH }}
      />
      <CutBox tone="#FFFFFF" flip />
      <svg
        aria-hidden
        viewBox={ICON_VIEWBOX}
        fill="none"
        style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
      >
        {children}
      </svg>
    </button>
  );
}

/** m:ss — every clip here is well under an hour. */
function clock(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  const mins = Math.floor(whole / 60);
  return `${mins}:${String(whole % 60).padStart(2, "0")}`;
}
