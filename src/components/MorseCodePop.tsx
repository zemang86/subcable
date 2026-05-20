"use client";

import { useCallback, useMemo, useState } from "react";
import { decodeSymbols, MORSE_ALPHABET } from "@/lib/morse";
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

  return (
    <div
      role="dialog"
      aria-modal="false"
      aria-label={t("morseCodeMessage")}
      style={{
        position: "fixed",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        zIndex: 50,
        width: "min(1200px, 96vw)",
        display: "flex",
        flexDirection: "column",
        gap: 6,
      }}
    >
      <TitleStrip title={t("morseCodeMessage")} onClose={onClose} />

      {/* Panel body — bevelled SVG card lifted verbatim from temp/morse-card.svg
          (orange→blue gradient stack + irregular notches on left/right edges +
          white hairline stroke). Replaces the previous deep-bg + flat border
          wrapper; aspectRatio locks the bevel notches to render at their
          intended proportions regardless of dialog width. */}
      <div
        style={{
          position: "relative",
          aspectRatio: "833 / 641",
        }}
      >
        <PanelBackground />

        <div
          style={{
            position: "relative",
            zIndex: 1,
            height: "100%",
            padding: "20px 24px",
            display: "flex",
            flexDirection: "column",
            gap: 12,
            boxSizing: "border-box",
          }}
        >
          {/* From row — [label] [country picker] [location picker]. Demo: both
              pickers bind to the same value; country vs location wiring lands
              next session. */}
          <PickerRow
            label={t("from")}
            value={from}
            onChange={setFrom}
            points={cablePoints}
          />

          {/* To row — same layout, separate state slot */}
          <PickerRow
            label={t("to")}
            value={to}
            onChange={setTo}
            points={cablePoints}
          />

      {/* Body: keyboard column + reference column */}
      <div
        style={{
          flex: 1,
          display: "grid",
          gridTemplateColumns: "1fr 220px",
          gap: 16,
        }}
      >
        {/* Left column: message + keys */}
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Message area */}
          <div
            style={{
              background: "var(--v1-mute-2)",
              padding: 14,
              position: "relative",
              minHeight: 130,
            }}
          >
            <div className="v1-h-eye" style={{ color: "var(--v1-orange)" }}>
              {t("typeMessageHere")}
            </div>
            <div
              style={{
                marginTop: 12,
                minHeight: 50,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--v1-display)",
                  fontWeight: 700,
                  fontSize: 28,
                  letterSpacing: "0.12em",
                  color: decoded ? "var(--v1-bg)" : "var(--v1-mute-dark)",
                  textAlign: "center",
                  wordBreak: "break-all",
                }}
              >
                {decoded || t("tapDotsDashesBegin")}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginTop: 6,
              }}
            >
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span
                  style={{
                    fontFamily: "var(--v1-mono)",
                    fontSize: 10,
                    color: "var(--v1-mute-dark)",
                    letterSpacing: "0.04em",
                  }}
                >
                  {decoded.length}/{MAX_CHARS}
                </span>
                <span
                  style={{
                    fontFamily: "var(--v1-mono)",
                    fontSize: 10,
                    color: atCap ? "var(--v1-inactive-2)" : "var(--v1-orange)",
                    letterSpacing: "0.04em",
                  }}
                >
                  buffer: {buffer || "·"}
                </span>
              </div>
              <span
                style={{
                  fontFamily: "var(--v1-mono)",
                  fontSize: 10,
                  color: atCap ? "var(--v1-inactive-2)" : "var(--v1-mute-dark)",
                  letterSpacing: "0.04em",
                }}
              >
                {t("maximumLetter")} [{MAX_CHARS}]
              </span>
            </div>
            {error && (
              <span
                style={{
                  position: "absolute",
                  right: 14,
                  top: 14,
                  fontFamily: "var(--v1-mono)",
                  fontSize: 9,
                  color: "var(--v1-inactive-2)",
                }}
              >
                {error}
              </span>
            )}
          </div>

          {/* DOT / DASH (primary 56px orange) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <KeyBtn
              variant="primary"
              disabled={atCap}
              onClick={() => append(".")}
              label="·"
              hint={t("dot")}
            />
            <KeyBtn
              variant="primary"
              disabled={atCap}
              onClick={() => append("-")}
              label="—"
              hint={t("dash")}
            />
          </div>

          {/* ENTER LETTER (blue) · SPACE · BACKSPACE (mute-brown) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <KeyBtn
              variant="blue"
              disabled={atCap || buffer.length === 0}
              onClick={commitLetter}
              label="↵"
              hint={t("enterLetter")}
            />
            <KeyBtn
              variant="plain"
              disabled={atCap}
              onClick={insertSpace}
              label="␣"
              hint={t("space")}
            />
            <KeyBtn
              variant="brown"
              onClick={backspace}
              label="⌫"
              hint={t("backspace")}
            />
          </div>

          {/* CLEAR ALL (red 1/3) · SEND (white bg blue text 2/3) */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button
              type="button"
              onClick={clear}
              disabled={buffer.length === 0 && decoded.length === 0}
              style={{
                minHeight: 56,
                background: "var(--v1-inactive-2)",
                border: "none",
                color: "var(--v1-fg)",
                fontFamily: "var(--v1-heading)",
                fontWeight: 700,
                fontSize: 13,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                opacity: buffer.length === 0 && decoded.length === 0 ? 0.4 : 1,
              }}
            >
              {t("clearAll")}
            </button>
            <button
              type="button"
              onClick={() => canSend && onSend(decoded.trim(), from, to)}
              disabled={!canSend}
              style={{
                minHeight: 56,
                background: "var(--v1-fg)",
                border: "none",
                color: "var(--v1-blue)",
                fontFamily: "var(--v1-heading)",
                fontWeight: 700,
                fontSize: 14,
                letterSpacing: "0.18em",
                textTransform: "uppercase",
                cursor: "pointer",
                opacity: canSend ? 1 : 0.4,
              }}
            >
              {t("sendMessage")}
            </button>
          </div>
        </div>

        {/* Right column: morse reference grid */}
        <div
          style={{
            border: "1px solid rgba(255, 255, 255, 0.15)",
            maxHeight: 420,
            overflowY: "auto",
            padding: 6,
          }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {MORSE_ALPHABET.map(({ char, code }) => (
              <div
                key={char}
                style={{
                  background: "var(--v1-blue)",
                  padding: "5px 8px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  color: "var(--v1-bg)",
                  gap: 6,
                }}
              >
                <span
                  style={{
                    fontFamily: "var(--v1-heading)",
                    fontWeight: 700,
                    fontSize: 12,
                  }}
                >
                  {char}
                </span>
                <span
                  style={{
                    fontFamily: "var(--v1-mono)",
                    fontSize: 10,
                    letterSpacing: "0.04em",
                  }}
                >
                  {code}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

        </div>
      </div>
    </div>
  );
}

/* ───────────────────────── TITLE STRIP ───────────────────────── */
// Shared title-strip pattern with FunFactDialog / HowToGuideDialog / CableInformation:
// 47px tall, translucent-white gradient fill, hairline white border,
// crosshair (+) at each of the 4 corners, title 28px Chakra Petch 500.

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

/* ───────────────────────── PICKER ROW ───────────────────────── */
// Per temp/morse.png + temp/morse.css: one row = [Rajdhani 500 label]
// [country picker] [location picker]. Both pickers visually identical;
// for now both bind to the same id slot — country vs city wiring lands
// in the next session per user instruction ("functionise we will work in
// another session").

function PickerRow({
  label,
  value,
  onChange,
  points,
}: {
  label: string;
  value: string;
  onChange: (id: string) => void;
  points: LandingPoint[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "60px 1fr 1fr",
        gap: 16,
        alignItems: "center",
      }}
    >
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontWeight: 500,
          fontSize: 19,
          lineHeight: "25px",
          color: "#FFFFFF",
        }}
      >
        {label}
      </span>
      {/* Country picker (demo: shows country half of the same selection) */}
      <Picker
        value={value}
        onChange={onChange}
        points={points}
        renderLabel={(p) => p.country}
        ariaLabel={`${label} country`}
      />
      {/* Location picker (demo: shows city half of the same selection) */}
      <Picker
        value={value}
        onChange={onChange}
        points={points}
        renderLabel={(p) => p.city}
        ariaLabel={`${label} location`}
      />
    </div>
  );
}

/* ───────────────────────── PICKER ───────────────────────── */
// Matches temp/morse.css "Drop Down Place" spec: blue-tint bg
// (rgba(3,77,161,0.68)), hairline white border, centred IBM Plex Mono 14.5
// white text, white downward caret on the right edge, and a tiny 2.9×2.9
// white-grey square at each of the four corners.

function Picker({
  value,
  onChange,
  points,
  renderLabel,
  ariaLabel,
}: {
  value: string;
  onChange: (id: string) => void;
  points: LandingPoint[];
  renderLabel: (p: LandingPoint) => string;
  ariaLabel: string;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 39,
        background: "rgba(3, 77, 161, 0.68)",
        border: "0.5px solid #FFFFFF",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxSizing: "border-box",
      }}
    >
      <PickerCornerDot position="tl" />
      <PickerCornerDot position="tr" />
      <PickerCornerDot position="bl" />
      <PickerCornerDot position="br" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={ariaLabel}
        style={{
          width: "100%",
          height: "100%",
          padding: "0 32px",
          background: "transparent",
          color: "#FFFFFF",
          border: "none",
          outline: "none",
          fontFamily: "var(--v1-mono)",
          fontWeight: 500,
          fontSize: 14.5,
          textAlign: "center",
          textAlignLast: "center",
          appearance: "none",
          cursor: "pointer",
        }}
      >
        {points.length === 0 && (
          <option value="" style={{ color: "#000", textAlign: "center" }}>
            —
          </option>
        )}
        {points.map((p) => (
          <option key={p.id} value={p.id} style={{ color: "#000" }}>
            {renderLabel(p)}
          </option>
        ))}
      </select>
      {/* Down caret */}
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
    </div>
  );
}

function PickerCornerDot({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const variants = {
    tl: { top: 1, left: 1 },
    tr: { top: 1, right: 1 },
    bl: { bottom: 1, left: 1 },
    br: { bottom: 1, right: 1 },
  };
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        width: 3,
        height: 3,
        background: "#D9D9D9",
        pointerEvents: "none",
        ...variants[position],
      }}
    />
  );
}

/* ──────────────────── PANEL BACKGROUND ──────────────────── */
// Bevelled morse card lifted verbatim from temp/morse-card.svg — irregular
// silhouette with notches at the left edge (top + bottom) and right edge
// (top, mid, bottom) plus a small inset cut at the bottom-left. Same
// orange-down + blue-up gradient stack as the help card.

function PanelBackground() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 833 641"
      preserveAspectRatio="none"
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient
          id="morse_card_orange"
          x1="415.839"
          y1="0"
          x2="415.839"
          y2="640.274"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0.275154" stopColor="#F05A22" />
          <stop offset="1" stopColor="#F05A22" stopOpacity="0.4" />
        </linearGradient>
        <linearGradient
          id="morse_card_blue"
          x1="403.694"
          y1="640.274"
          x2="406.611"
          y2="248.726"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="#034DA1" />
          <stop offset="1" stopColor="#034DA1" stopOpacity="0.3" />
        </linearGradient>
      </defs>
      {/* Paint order from kit: orange → blue → white stroke */}
      <path
        d="M832.404 65.2549L819.419 72.7529V388.428L832.404 395.925V464.754L824.045 469.581V617.528L832.404 622.354V640.561H0V622.978L9.43945 617.528V469.581L0 464.131V406.388L15.1514 397.641V81.9668L0 73.2188V0H832.404V65.2549Z"
        fill="url(#morse_card_orange)"
      />
      <path
        d="M832.404 65.2549L819.419 72.7529V388.428L832.404 395.925V464.754L824.045 469.581V617.528L832.404 622.354V640.561H0V622.978L9.43945 617.528V469.581L0 464.131V406.388L15.1514 397.641V81.9668L0 73.2188V0H832.404V65.2549Z"
        fill="url(#morse_card_blue)"
      />
      <path
        d="M832.404 65.2549L819.419 72.7529V388.428L832.404 395.925V464.754L824.045 469.581V617.528L832.404 622.354V640.561H0V622.978L9.43945 617.528V469.581L0 464.131V406.388L15.1514 397.641V81.9668L0 73.2188V0H832.404V65.2549Z"
        stroke="white"
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

function KeyBtn({
  label,
  hint,
  onClick,
  disabled = false,
  variant,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "primary" | "blue" | "brown" | "plain";
}) {
  const styleByVariant: Record<typeof variant, React.CSSProperties> = {
    primary: {
      background: "var(--v1-orange)",
      color: "var(--v1-fg)",
      minHeight: 56,
    },
    blue: {
      background: "var(--v1-blue)",
      color: "var(--v1-fg)",
      minHeight: 44,
    },
    brown: {
      background: "var(--v1-brown)",
      color: "var(--v1-fg)",
      minHeight: 44,
    },
    plain: {
      background: "rgba(255, 255, 255, 0.06)",
      color: "var(--v1-fg)",
      minHeight: 44,
      border: "1px solid rgba(255, 255, 255, 0.30)",
    },
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        ...styleByVariant[variant],
        border: styleByVariant[variant].border ?? "none",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.4 : 1,
      }}
    >
      <span
        style={{
          fontFamily: "var(--v1-display)",
          fontWeight: 700,
          fontSize: variant === "primary" ? 28 : 22,
          color: "var(--v1-fg)",
          lineHeight: 1,
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "var(--v1-heading)",
          fontWeight: 600,
          fontSize: 10,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "var(--v1-fg)",
        }}
      >
        {hint}
      </span>
    </button>
  );
}
