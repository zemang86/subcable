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

interface MorseCodePopProps {
  cable: CableSystem;
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
  const cablePoints = useMemo(() => {
    const lookup = new Map(landingPoints.map((p) => [p.id, p]));
    return cable.landingPointIds
      .map((id) => lookup.get(id))
      .filter((p): p is LandingPoint => Boolean(p));
  }, [cable.landingPointIds, landingPoints]);

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
        background: "var(--v1-bg-deep)",
        border: "1px solid rgba(255, 255, 255, 0.40)",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Top — From/To pickers */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 16,
          padding: 20,
          borderBottom: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <CountryPicker
          label={t("from")}
          value={from}
          onChange={setFrom}
          points={cablePoints}
        />
        <CountryPicker
          label={t("to")}
          value={to}
          onChange={setTo}
          points={cablePoints}
        />
      </div>

      {/* Body: keyboard column + reference column */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 220px",
          gap: 16,
          padding: 20,
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
          {t("morseCodeMessage")}
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

function CountryPicker({
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
    <label
      style={{
        display: "flex",
        flexDirection: "column",
        gap: 4,
        fontFamily: "var(--v1-mono)",
        color: "var(--v1-fg)",
      }}
    >
      <span className="v1-h-eye" style={{ fontSize: 9 }}>
        {label.toUpperCase()}
      </span>
      <div
        style={{
          display: "flex",
          gap: 8,
          alignItems: "center",
          padding: "10px 14px",
          background: "var(--v1-blue-fill)",
          border: "1px solid rgba(255, 255, 255, 0.55)",
          minHeight: 48,
        }}
      >
        <PowerIcon />
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            color: "var(--v1-fg)",
            border: "none",
            outline: "none",
            fontFamily: "var(--v1-mono)",
            fontSize: 12,
            appearance: "none",
          }}
        >
          {points.map((p) => (
            <option key={p.id} value={p.id} style={{ color: "#000" }}>
              {p.city}, {p.country}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function PowerIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="var(--v1-fg)"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
      <line x1="12" y1="2" x2="12" y2="12" />
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
