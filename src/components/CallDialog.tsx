"use client";

import { useCallback, useState } from "react";
import { decodeSymbols, MORSE_ALPHABET } from "@/lib/morse";
import { DEMO_CALL } from "@/lib/callRoutes";
import {
  playBackspace,
  playDash,
  playDot,
  playLetterCommit,
  playSpace,
} from "@/lib/morseAudio";

const MAX_CHARS = 20;

interface CallDialogProps {
  onSend: (message: string) => void;
  onClose: () => void;
}

export default function CallDialog({ onSend, onClose }: CallDialogProps) {
  const [buffer, setBuffer] = useState("");
  const [decoded, setDecoded] = useState("");
  const [error, setError] = useState<string | null>(null);

  const append = useCallback(
    (sym: "." | "-") => {
      if (decoded.length >= MAX_CHARS) return;
      setError(null);
      setBuffer((b) => b + sym);
      if (sym === ".") playDot();
      else playDash();
    },
    [decoded.length]
  );

  // LETTER: commit the current dot/dash buffer as one decoded character.
  const commitLetter = useCallback(() => {
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
  }, [buffer]);

  // SPACE: insert a literal word space. If there's a pending buffer, commit
  // it first so the user doesn't lose what they typed.
  const insertSpace = useCallback(() => {
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
  }, [buffer, decoded]);

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

  const canSend = decoded.trim().length > 0;

  return (
    <div className="fixed bottom-6 left-6 z-50 w-[640px] max-h-[calc(100vh-3rem)] rounded-2xl bg-[#06013A]/95 backdrop-blur-xl border border-[#1800E7]/40 shadow-[0_8px_60px_rgba(0,0,0,0.6)] flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-[#1800E7]/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#FF5E00]/20 border border-[#FF5E00]/40 flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="none" stroke="#FF5E00" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
          </div>
          <div>
            <div className="font-display font-bold text-[9px] tracking-[0.25em] text-[#A8B0D6] uppercase leading-none">
              Make a Call
            </div>
            <div className="font-display font-bold text-sm tracking-[0.12em] text-white uppercase mt-1 leading-none">
              {DEMO_CALL.fromLabel}{" "}
              <span className="text-[#FF5E00] mx-1.5">→</span>{" "}
              {DEMO_CALL.toLabel}
            </div>
            <div className="text-[10px] text-[#A8B0D6] mt-1 tracking-wider">
              Via {DEMO_CALL.cableLabel}
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          aria-label="Close"
          className="w-9 h-9 rounded-full bg-white/5 border border-[#1800E7]/40 text-white flex items-center justify-center active:bg-white/10"
        >
          <span className="text-base leading-none">✕</span>
        </button>
      </div>

      {/* Body — two columns: keyboard (left) + reference chart (right) */}
      <div className="grid grid-cols-[1fr_180px] gap-4 p-4">
        {/* Left: preview + keyboard */}
        <div className="flex flex-col gap-3">
          {/* Decoded preview */}
          <div className="rounded-xl bg-[#06013A]/60 border border-[#1800E7]/30 p-3">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-display text-[9px] tracking-[0.2em] text-[#A8B0D6] uppercase">
                Message (max {MAX_CHARS})
              </span>
              <span className="font-display text-[9px] tabular-nums text-[#A8B0D6]">
                {decoded.length}/{MAX_CHARS}
              </span>
            </div>
            <div className="min-h-[44px] flex items-center justify-center">
              <span className="font-display font-bold text-2xl text-white tracking-[0.15em] uppercase break-all text-center">
                {decoded || (
                  <span className="text-[#A8B0D6]/50 text-base tracking-widest">
                    Tap dots & dashes…
                  </span>
                )}
              </span>
            </div>
            <div className="mt-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-[#A8B0D6] tracking-wider">
                  BUFFER
                </span>
                <span className="font-mono text-sm text-[#FF5E00] min-w-[2ch]">
                  {buffer || "·"}
                </span>
              </div>
              {error && (
                <span className="text-[9px] text-[#FF5E00] tracking-wider">
                  {error}
                </span>
              )}
            </div>
          </div>

          {/* Keyboard — DOT/DASH on top row, LETTER/SPACE/⌫ on bottom row */}
          <div className="grid grid-cols-2 gap-2">
            <KeyboardButton onPress={() => append(".")} primary label="·" hint="DOT" />
            <KeyboardButton onPress={() => append("-")} primary label="—" hint="DASH" />
          </div>
          <div className="grid grid-cols-3 gap-2">
            <KeyboardButton
              onPress={commitLetter}
              accent
              label="↵"
              hint="LETTER"
            />
            <KeyboardButton onPress={insertSpace} label="␣" hint="SPACE" />
            <KeyboardButton onPress={backspace} label="⌫" hint="BACKSPACE" />
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={clear}
              disabled={buffer.length === 0 && decoded.length === 0}
              className="px-3 py-2.5 rounded-lg bg-white/5 border border-[#1800E7]/30 font-display text-[10px] tracking-[0.2em] text-[#A8B0D6] uppercase active:bg-white/10 disabled:opacity-40"
            >
              Clear
            </button>
            <button
              onClick={() => canSend && onSend(decoded.trim())}
              disabled={!canSend}
              className="flex-1 px-5 py-3 rounded-lg bg-[#FF5E00] font-display font-bold text-xs tracking-[0.2em] text-white uppercase active:bg-[#E65500] disabled:bg-[#FF5E00]/30 disabled:text-white/50"
            >
              Send Message →
            </button>
          </div>
        </div>

        {/* Right: morse reference chart */}
        <div className="rounded-xl bg-[#06013A]/60 border border-[#1800E7]/30 p-2 overflow-y-auto max-h-[420px]">
          <div className="font-display font-bold text-[9px] tracking-[0.2em] text-white uppercase mb-2 text-center">
            Morse Code
          </div>
          <div className="grid grid-cols-1 gap-1">
            {MORSE_ALPHABET.map(({ char, code }) => (
              <div
                key={char}
                className="flex items-center justify-between px-2 py-0.5 rounded bg-white/5"
              >
                <span className="font-display font-bold text-[11px] text-white tabular-nums">
                  {char}
                </span>
                <span className="font-mono text-[10px] text-[#FF5E00] tracking-wider">
                  {code}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function KeyboardButton({
  onPress,
  label,
  hint,
  primary = false,
  accent = false,
}: {
  onPress: () => void;
  label: string;
  hint: string;
  primary?: boolean;
  accent?: boolean;
}) {
  const cls = primary
    ? "bg-[#1800E7]/30 border-[#1800E7] active:bg-[#1800E7]/50"
    : accent
      ? "bg-[#FF5E00]/15 border-[#FF5E00]/60 active:bg-[#FF5E00]/30"
      : "bg-white/5 border-[#1800E7]/40 active:bg-white/10";
  return (
    <button
      onClick={onPress}
      className={`min-h-[68px] rounded-xl border flex flex-col items-center justify-center gap-0.5 transition-colors active:scale-[0.98] ${cls}`}
    >
      <span className="font-display font-bold text-2xl text-white leading-none">
        {label}
      </span>
      <span className="font-display text-[9px] tracking-[0.2em] text-[#A8B0D6] uppercase">
        {hint}
      </span>
    </button>
  );
}
