"use client";

import { useCallback, useMemo, useState } from "react";
import { decodeSymbols } from "@/lib/morse";
import {
  playBackspace,
  playDash,
  playDot,
  playLetterCommit,
  playSpace,
} from "@/lib/morseAudio";
import type { CableSystem, Language, LandingPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";

const MAX_CHARS = 20;
const TITLE_STRIP_HEIGHT = 47;

// Native dimensions of public/textures/fullmorse.svg — every overlay coord is
// expressed inside this frame. The dialog wraps the body in a CSS scale
// transform so we get a kiosk-friendly footprint without breaking pixel match.
const NATIVE_W = 833;
const NATIVE_H = 641;
const SCALE = 1.5;

// All in-frame coordinates derived from temp/morse.css (subtracting the
// dialog's reference offset of left=574.57 top=348.44).
const POS = {
  fromCountry:  { left:  87.45, top:   8.74, width: 297.31, height: 38.86 },
  fromCity:     { left: 513.00, top:   8.74, width: 297.31, height: 38.86 },
  toCountry:    { left:  87.45, top:  73.84, width: 297.31, height: 38.86 },
  toCity:       { left: 513.00, top:  73.84, width: 297.31, height: 38.86 },
  msgCanvas:    { left:  51.5,  top: 148.65, width: 745.21, height: 201.12 },
  counter:      { left: 760.0,  top: 157.91, width:  35,    height: 14    },
  placeholder:  { left:  51.5,  top: 220,    width: 745.21, height: 60    },
  dotBtn:       { left:  42.75, top: 384.75, width: 144.61, height: 75.70 },
  dashBtn:      { left: 198.21, top: 384.75, width: 144.61, height: 75.70 },
  enterBtn:     { left:  42.75, top: 477.04, width:  93.86, height: 49.21 },
  spaceBtn:     { left: 145.74, top: 477.04, width:  93.86, height: 49.21 },
  backspaceBtn: { left: 248.73, top: 477.04, width:  93.86, height: 49.21 },
  clearBtn:     { left:  42.75, top: 536.31, width:  94.24, height: 84.53 },
  sendBtn:      { left: 148.66, top: 536.31, width: 194.32, height: 84.53 },
} as const;

type Pos = { left: number; top: number; width: number; height: number };

interface MorseCodePopProps {
  cable: CableSystem | null;
  landingPoints: LandingPoint[];
  onSend: (message: string, fromId: string, toId: string) => void;
  onClose: () => void;
  language?: Language;
}

export default function MorseCodePop({
  cable,
  landingPoints,
  onSend,
  onClose,
  language = "en",
}: MorseCodePopProps) {
  const t = useT(language);

  // Landing points scoped to the selected cable (resolution §H.8).
  // When no cable is selected, the From/To pickers are empty and SEND is gated;
  // the keyboard demo itself stays fully playable.
  const cablePoints = useMemo(() => {
    if (!cable) return [];
    const lookup = new Map(landingPoints.map((p) => [p.id, p]));
    return cable.landingPointIds
      .map((id) => lookup.get(id))
      .filter((p): p is LandingPoint => Boolean(p));
  }, [cable, landingPoints]);

  const initialFrom = cablePoints[0]?.id ?? "";
  const initialTo = cablePoints[cablePoints.length - 1]?.id ?? initialFrom;

  const [from, setFrom] = useState(initialFrom);
  const [to, setTo] = useState(initialTo);
  const [buffer, setBuffer] = useState("");
  const [decoded, setDecoded] = useState("");
  const [error, setError] = useState<string | null>(null);

  // HARD cap (resolution §H.7): block input growth at total length 20.
  const atCap = decoded.length >= MAX_CHARS;

  const append = useCallback(
    (sym: "." | "-") => {
      if (atCap) return;
      setError(null);
      setBuffer((b) => b + sym);
      if (sym === ".") playDot();
      else playDash();
    },
    [atCap],
  );

  const commitLetter = useCallback(() => {
    if (atCap) return;
    if (buffer.length === 0) return;
    const letter = decodeSymbols(buffer);
    if (letter === null) {
      setError(`"${buffer}" is not a valid morse letter`);
      setBuffer("");
      return;
    }
    setError(null);
    setBuffer("");
    setDecoded((d) => (d.length < MAX_CHARS ? d + letter : d));
    playLetterCommit();
  }, [atCap, buffer]);

  const insertSpace = useCallback(() => {
    if (atCap) return;
    setError(null);
    let next = decoded;
    if (buffer.length > 0) {
      const letter = decodeSymbols(buffer);
      if (letter === null) {
        setError(`"${buffer}" is not a valid morse letter`);
        setBuffer("");
        return;
      }
      if (next.length < MAX_CHARS) next = next + letter;
      setBuffer("");
    }
    if (next.length < MAX_CHARS && !next.endsWith(" ") && next.length > 0) {
      next = next + " ";
    }
    setDecoded(next);
    playSpace();
  }, [atCap, buffer, decoded]);

  const backspace = useCallback(() => {
    setError(null);
    if (buffer.length > 0) {
      setBuffer((b) => b.slice(0, -1));
    } else if (decoded.length > 0) {
      setDecoded((d) => d.slice(0, -1));
    }
    playBackspace();
  }, [buffer.length, decoded.length]);

  const clear = useCallback(() => {
    setBuffer("");
    setDecoded("");
    setError(null);
  }, []);

  const canSend = decoded.trim().length > 0 && from !== "" && to !== "";

  // City + country live values for each picker. The SVG bakes in English
  // placeholders ("United States of America" / "San Luis Obispo" / etc) —
  // our opaque overlay selects cover them entirely.
  const fromPoint = cablePoints.find((p) => p.id === from);
  const toPoint = cablePoints.find((p) => p.id === to);

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("morseCodeMessage")}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: `translate(-50%, -50%) scale(${SCALE})`,
        transformOrigin: "center center",
        zIndex: 50,
        width: NATIVE_W,
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <TitleStrip title={t("morseCodeMessage")} onClose={onClose} />

      {/* Body — fullmorse.svg pinned at native 833×641. Every interactive
          element sits in an absolutely-positioned overlay above it. Labels,
          glyphs, button shapes, picker decorations etc are all baked into
          the SVG so we only render the live bits. */}
      <div
        style={{
          position: "relative",
          width: NATIVE_W,
          height: NATIVE_H,
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- SVG doesn't
            benefit from next/image optimization and we want a single static
            request */}
        <img
          src="/textures/fullmorse.svg"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* ── PICKERS ── overlay selects mask the SVG's baked-in city/country
            text. Each is sized exactly to the picker rect; opaque navy
            background covers the SVG decorations underneath. */}
        <PickerOverlay
          pos={POS.fromCountry}
          value={from}
          onChange={setFrom}
          points={cablePoints}
          renderText={(p) => p.country}
          ariaLabel="From country"
          placeholder={fromPoint?.country}
        />
        <PickerOverlay
          pos={POS.fromCity}
          value={from}
          onChange={setFrom}
          points={cablePoints}
          renderText={(p) => p.city}
          ariaLabel="From location"
          placeholder={fromPoint?.city}
        />
        <PickerOverlay
          pos={POS.toCountry}
          value={to}
          onChange={setTo}
          points={cablePoints}
          renderText={(p) => p.country}
          ariaLabel="To country"
          placeholder={toPoint?.country}
        />
        <PickerOverlay
          pos={POS.toCity}
          value={to}
          onChange={setTo}
          points={cablePoints}
          renderText={(p) => p.city}
          ariaLabel="To location"
          placeholder={toPoint?.city}
        />

        {/* ── LIVE MESSAGE ── covers the SVG's "Tap Dots & Dashes to Begin"
            placeholder + decoded text. The mask matches the light-grey
            canvas colour so an empty `decoded` reveals the SVG placeholder
            underneath. */}
        {decoded.length > 0 && (
          <div
            style={absPos(POS.placeholder)}
          >
            <div
              style={{
                position: "absolute",
                inset: 0,
                background: "rgba(217, 217, 217, 1)",
              }}
            />
            <div
              style={{
                position: "relative",
                width: "100%",
                height: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "var(--v1-heading)",
                fontWeight: 500,
                fontSize: 19.36,
                color: "#1A1A1A",
                letterSpacing: "0.08em",
                wordBreak: "break-all",
                textAlign: "center",
                padding: "0 16px",
                boxSizing: "border-box",
              }}
            >
              {decoded}
            </div>
          </div>
        )}

        {/* ── COUNTER ── covers SVG's baked "0/20" with live count.
            Turns red once at cap. */}
        <div
          style={{
            ...absPos(POS.counter),
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            background: "rgba(217, 217, 217, 1)",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: 8.78,
            lineHeight: 1,
            color: atCap ? "#ED1B2E" : "#808080",
            paddingRight: 2,
            boxSizing: "border-box",
          }}
        >
          {decoded.length}/{MAX_CHARS}
        </div>

        {/* ── BUTTON HOTSPOTS ── transparent click targets sized exactly to
            each SVG button shape. The SVG paints the colour, gradient,
            glyph and label; we only catch the tap. */}
        <Hotspot
          pos={POS.dotBtn}
          onClick={() => append(".")}
          disabled={atCap}
          ariaLabel={t("dot")}
        />
        <Hotspot
          pos={POS.dashBtn}
          onClick={() => append("-")}
          disabled={atCap}
          ariaLabel={t("dash")}
        />
        <Hotspot
          pos={POS.enterBtn}
          onClick={commitLetter}
          disabled={atCap || buffer.length === 0}
          ariaLabel={t("enterLetter")}
        />
        <Hotspot
          pos={POS.spaceBtn}
          onClick={insertSpace}
          disabled={atCap}
          ariaLabel={t("space")}
        />
        <Hotspot
          pos={POS.backspaceBtn}
          onClick={backspace}
          ariaLabel={t("backspace")}
        />
        <Hotspot
          pos={POS.clearBtn}
          onClick={clear}
          disabled={buffer.length === 0 && decoded.length === 0}
          ariaLabel={t("clearAll")}
        />
        <Hotspot
          pos={POS.sendBtn}
          onClick={() => canSend && onSend(decoded.trim(), from, to)}
          disabled={!canSend}
          ariaLabel={t("sendMessage")}
        />

        {/* Tiny error toast — only visible when buffer decode fails */}
        {error && (
          <div
            style={{
              position: "absolute",
              left: POS.msgCanvas.left,
              top: POS.msgCanvas.top + POS.msgCanvas.height + 4,
              fontFamily: "var(--v1-mono)",
              fontSize: 9,
              color: "#ED1B2E",
            }}
          >
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

/* ─────────────────────── absPos helper ─────────────────────── */
function absPos(p: Pos): React.CSSProperties {
  return {
    position: "absolute",
    left: p.left,
    top: p.top,
    width: p.width,
    height: p.height,
  };
}

/* ─────────────────────── PICKER OVERLAY ─────────────────────── */
// Native <select> sized to the SVG's picker rect. Opaque navy bg covers
// the baked-in city/country text underneath. Live label text is the
// `placeholder` prop (rendered visually) while the select itself is
// stretched on top to capture taps and open the dropdown.

function PickerOverlay({
  pos,
  value,
  onChange,
  points,
  renderText,
  ariaLabel,
  placeholder,
}: {
  pos: Pos;
  value: string;
  onChange: (id: string) => void;
  points: LandingPoint[];
  renderText: (p: LandingPoint) => string;
  ariaLabel: string;
  placeholder?: string;
}) {
  return (
    <div style={absPos(pos)}>
      {/* Opaque navy mask covers the SVG-baked picker text */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: "#1B3E6D",
          pointerEvents: "none",
        }}
      />
      {/* Visible live label */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "var(--v1-mono)",
          fontWeight: 500,
          fontSize: 14.57,
          lineHeight: 1,
          color: "#FFFFFF",
          pointerEvents: "none",
          padding: "0 32px",
          textAlign: "center",
        }}
      >
        {placeholder ?? "—"}
      </div>
      {/* Caret — small white down-triangle on the right */}
      <svg
        width="15"
        height="10"
        viewBox="0 0 15 10"
        aria-hidden
        style={{
          position: "absolute",
          right: 10,
          top: "50%",
          transform: "translateY(-50%)",
          pointerEvents: "none",
        }}
      >
        <polygon points="0,0 15,0 7.5,10" fill="#FFFFFF" />
      </svg>
      {/* Transparent select stretched over the whole picker — catches taps */}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        style={{
          position: "absolute",
          inset: 0,
          width: "100%",
          height: "100%",
          opacity: 0,
          cursor: "pointer",
          appearance: "none",
          border: "none",
          background: "transparent",
        }}
      >
        {points.length === 0 && (
          <option value="">—</option>
        )}
        {points.map((p) => (
          <option key={p.id} value={p.id}>
            {renderText(p)}
          </option>
        ))}
      </select>
    </div>
  );
}

/* ─────────────────────── HOTSPOT ─────────────────────── */
// Transparent click target sized to one of the SVG's button shapes. The
// SVG provides all visual chrome (gradient, glyph, label). When disabled,
// we paint a translucent grey mask so it visually reads as inactive.

function Hotspot({
  pos,
  onClick,
  disabled = false,
  ariaLabel,
}: {
  pos: Pos;
  onClick: () => void;
  disabled?: boolean;
  ariaLabel: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      style={{
        ...absPos(pos),
        background: disabled ? "rgba(0, 0, 0, 0.45)" : "transparent",
        border: "none",
        borderRadius: 9.7,
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
      }}
    />
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */
// Shared title-strip pattern with FunFactDialog / HowToGuideDialog /
// CableInformation: 47px tall, translucent-white gradient fill, hairline
// white border, crosshair `+` at each of the 4 corners, 28px Chakra
// Petch 500 title.

function TitleStrip({
  title,
  onClose,
}: {
  title: string;
  onClose: () => void;
}) {
  return (
    <div
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
