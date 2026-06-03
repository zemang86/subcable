"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { decodeSymbols } from "@/lib/morse";
import { reachableFrom } from "@/lib/callRoutes";
import {
  playBackspace,
  playDash,
  playDot,
  playLetterCommit,
  playSpace,
} from "@/lib/morseAudio";
import type { Language, LandingPoint } from "@/lib/types";
import { useT } from "@/lib/i18n";

const MAX_CHARS = 20;
const TITLE_STRIP_HEIGHT = 47;

// Native dimensions of public/textures/fullmorse.svg — every overlay coord is
// expressed inside this frame. The dialog wraps the body in a CSS scale
// transform so we get a kiosk-friendly footprint without breaking pixel match.
const NATIVE_W = 833;
const NATIVE_H = 641;
const SCALE = 1;

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
  /** All landing points; the pickers route across the whole network. */
  landingPoints: LandingPoint[];
  onSend: (message: string, fromId: string, toId: string) => void;
  onClose: () => void;
  language?: Language;
}

export default function MorseCodePop({
  landingPoints,
  onSend,
  onClose,
  language = "en",
}: MorseCodePopProps) {
  const t = useT(language);

  // Cross-network dialling (Model B): From/To can be any routable landing point
  // (one that's on at least one cable). The pickers are a country → location
  // two-step; the call resolver finds the shortest path across cables.
  const routable = useMemo(
    () => landingPoints.filter((p) => p.cableIds.length > 0),
    [landingPoints],
  );
  const lpById = useMemo(
    () => new Map(routable.map((p) => [p.id, p])),
    [routable],
  );
  const countries = useMemo(
    () => [...new Set(routable.map((p) => p.country))].sort(),
    [routable],
  );
  const lpsIn = useCallback(
    (country: string) => routable.filter((p) => p.country === country),
    [routable],
  );
  const firstLpId = useCallback(
    (country: string) => lpsIn(country)[0]?.id ?? "",
    [lpsIn],
  );

  // Default to the showcase pair Kuantan → Kitaibaraki (both APCN-2 only, so the
  // call traces one clean authentic cable). Fall back to the first Malaysia →
  // Japan points, then to the first/last countries available.
  const defFromCountry = countries.includes("Malaysia")
    ? "Malaysia"
    : countries[0] ?? "";
  const defToCountry = countries.includes("Japan")
    ? "Japan"
    : countries[countries.length - 1] ?? defFromCountry;
  const defFrom = lpById.has("kuantan") ? "kuantan" : firstLpId(defFromCountry);
  const defTo = lpById.has("kitaibaraki")
    ? "kitaibaraki"
    : firstLpId(defToCountry);

  const [from, setFrom] = useState(() => defFrom);
  const [to, setTo] = useState(() => defTo);

  // Reachability — destinations that actually have a cable path from `from`.
  // The "To" pickers are scoped to this so the UI never offers a dead-end pick
  // (the resolver would otherwise quietly draw a straight great-circle line).
  const reachable = useMemo(() => reachableFrom(from), [from]);
  const toCountries = useMemo(
    () =>
      [
        ...new Set(
          routable.filter((p) => reachable.has(p.id)).map((p) => p.country),
        ),
      ].sort(),
    [routable, reachable],
  );
  const lpsToIn = useCallback(
    (country: string) =>
      routable.filter((p) => p.country === country && reachable.has(p.id)),
    [routable, reachable],
  );
  const firstReachableLpId = useCallback(
    (country: string) => lpsToIn(country)[0]?.id ?? "",
    [lpsToIn],
  );

  // When `from` changes, the current `to` may no longer be reachable (or may now
  // equal `from`). Snap it to the first valid destination so the route is always
  // sendable. Prefer keeping the same country if it still has a reachable point.
  useEffect(() => {
    if (to !== from && to !== "" && reachable.has(to)) return;
    const sameCountry = lpById.get(to)?.country;
    const fallback =
      (sameCountry && firstReachableLpId(sameCountry)) ||
      routable.find((p) => p.id !== from && reachable.has(p.id))?.id ||
      "";
    setTo(fallback);
  }, [from, to, reachable, lpById, firstReachableLpId, routable]);
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

  const canSend =
    decoded.trim().length > 0 && from !== "" && to !== "" && from !== to;

  // City + country live values for each picker. The SVG bakes in English
  // placeholders — our opaque overlay selects cover them entirely.
  const fromPoint = lpById.get(from);
  const toPoint = lpById.get(to);
  const fromCountry = fromPoint?.country ?? defFromCountry;
  const toCountry = toPoint?.country ?? defToCountry;

  // Country picker swaps the whole country → jump to that country's first
  // location; location picker just moves within the current country.
  const onChangeFromCountry = useCallback(
    (c: string) => setFrom(firstLpId(c)),
    [firstLpId],
  );
  const onChangeToCountry = useCallback(
    (c: string) => setTo(firstReachableLpId(c)),
    [firstReachableLpId],
  );

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

        {/* Corrected A-Z morse reference chart, overlaid 1:1 on top of the
            baked-in chart in fullmorse.svg (same 433×249 panel, just shifted
            origin: baked panel at +364.06/+373.67). Covers the old D/N glyphs. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/textures/morseguide.svg"
          alt=""
          aria-hidden
          style={{
            position: "absolute",
            left: 364.06,
            top: 373.67,
            width: 433,
            height: 249,
            display: "block",
            pointerEvents: "none",
            userSelect: "none",
          }}
        />

        {/* Updated location-selector icon, overlaid 1:1 on the baked-in pins in
            the two city ("location") pickers. Your locationicon.svg origin maps
            to the baked icons at left 468.3 / top 8.74 (From) & 73.84 (To). */}
        {[POS.fromCity.top, POS.toCity.top].map((iconTop) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={iconTop}
            src="/textures/locationicon.svg"
            alt=""
            aria-hidden
            style={{
              position: "absolute",
              left: 468.3,
              top: iconTop,
              width: 42,
              height: 42,
              display: "block",
              pointerEvents: "none",
              userSelect: "none",
            }}
          />
        ))}

        {/* ── PICKERS ── overlay selects mask the SVG's baked-in city/country
            text. Each is sized exactly to the picker rect; opaque navy
            background covers the SVG decorations underneath. */}
        <PickerOverlay
          pos={POS.fromCountry}
          value={fromCountry}
          onChange={onChangeFromCountry}
          options={countries.map((c) => ({ value: c, label: c }))}
          ariaLabel="From country"
          placeholder={fromCountry}
        />
        <PickerOverlay
          pos={POS.fromCity}
          value={from}
          onChange={setFrom}
          options={lpsIn(fromCountry).map((p) => ({ value: p.id, label: p.city }))}
          ariaLabel="From location"
          placeholder={fromPoint?.city}
        />
        <PickerOverlay
          pos={POS.toCountry}
          value={toCountry}
          onChange={onChangeToCountry}
          options={toCountries.map((c) => ({ value: c, label: c }))}
          ariaLabel="To country"
          placeholder={toCountry}
        />
        <PickerOverlay
          pos={POS.toCity}
          value={to}
          onChange={setTo}
          options={lpsToIn(toCountry).map((p) => ({
            value: p.id,
            label: p.city,
          }))}
          ariaLabel="To location"
          placeholder={toPoint?.city}
        />

        {/* Mask out the baked-in "max letters" hint at the top-left INSIDE the
            message canvas (the count now lives in the right-side counter). It
            sits on the grey canvas, so a grey patch hides it cleanly. Leaves
            the "type message" tab above it untouched. */}
        <div
          style={{
            position: "absolute",
            left: 57,
            top: 154,
            width: 114,
            height: 15,
            background: "#d6d2d2",
            pointerEvents: "none",
          }}
        />

        {/* ── LIVE MESSAGE ── covers the SVG's "Tap Dots & Dashes to Begin"
            placeholder + shows decoded text plus the in-progress buffer
            (dots/dashes typed but not yet committed via Enter Letter).
            The mask matches the light-grey canvas colour so when both
            decoded and buffer are empty the SVG placeholder underneath
            remains visible. */}
        {(decoded.length > 0 || buffer.length > 0) && (
          <div style={absPos(POS.placeholder)}>
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
                gap: 12,
                fontFamily: "var(--v1-heading)",
                fontWeight: 500,
                fontSize: 19.36,
                letterSpacing: "0.08em",
                wordBreak: "break-all",
                textAlign: "center",
                padding: "0 16px",
                boxSizing: "border-box",
              }}
            >
              {decoded.length > 0 && (
                <span style={{ color: "#1A1A1A" }}>{decoded}</span>
              )}
              {buffer.length > 0 && (
                <span
                  style={{
                    color: "#F05A22",
                    fontFamily: "var(--v1-mono)",
                    fontWeight: 700,
                    letterSpacing: "0.15em",
                  }}
                >
                  {buffer.replace(/\./g, "·").replace(/-/g, "−")}
                </span>
              )}
              {/* Blinking caret — hugs the end of the text (offsets the flex
                  gap so it sits right after the last glyph). Geometry is inline
                  so it shows even if the animation class is unavailable. */}
              <span
                aria-hidden
                className="v1-caret"
                style={{
                  display: "inline-block",
                  width: 3,
                  height: 22,
                  marginLeft: -8,
                  background: "#1A1A1A",
                  alignSelf: "center",
                }}
              />
            </div>
          </div>
        )}

        {/* ── COUNTER ── covers SVG's baked "0/20" with live count.
            Turns red once at cap. */}
        <div
          style={{
            ...absPos(POS.counter),
            left: 615,
            width: 181,
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            background: "#d6d2d2",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: 8.78,
            lineHeight: 1,
            color: atCap ? "#ED1B2E" : "#808080",
            paddingRight: 2,
            boxSizing: "border-box",
            whiteSpace: "nowrap",
          }}
        >
          Maximum Characters: {decoded.length}/{MAX_CHARS}
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
        <SendButton
          pos={POS.sendBtn}
          onClick={() => canSend && onSend(decoded.trim(), from, to)}
          disabled={!canSend}
          label={t("sendMessage")}
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
  options,
  ariaLabel,
  placeholder,
}: {
  pos: Pos;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
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
        {options.length === 0 && <option value="">—</option>}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
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

/* ─────────────────────── SEND BUTTON ─────────────────────── */
// Solid white pill (no icon) overlaying the baked-in send button art.
// Styling from temp/sendmessage.css: white bg, ~9.7px radius, "Send Message"
// in Rajdhani 600 / 23.6px / #034DA1. Greys out when there's nothing to send.

function SendButton({
  pos,
  onClick,
  disabled,
  label,
}: {
  pos: Pos;
  onClick: () => void;
  disabled: boolean;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{
        ...absPos(pos),
        background: disabled ? "#9AA7B6" : "#FFFFFF",
        borderRadius: 9.71585,
        border: "none",
        cursor: disabled ? "not-allowed" : "pointer",
        color: disabled ? "#5E6B7A" : "#034DA1",
        fontFamily: "var(--v1-heading)",
        fontWeight: 600,
        fontSize: 23.627,
        lineHeight: "30px",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
      }}
    >
      {label}
    </button>
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
      data-stem-title
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
