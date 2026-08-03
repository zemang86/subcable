"use client";

import type { CSSProperties, ReactNode } from "react";
import { INFO_SLIDE_MS } from "@/data/generalInfo";

/**
 * Pieces every General Information tab layout shares: the bracketed copy card,
 * the countdown bar, the small section strips and the panel's touch minimums.
 *
 * Sizing note (also in GeneralInfoDialog): the Figma exports are drawn at ~0.66
 * of the kiosk canvas, so their measurements are scaled onto the panel's
 * existing 1040px footprint rather than copied literally, and body copy is held
 * at a readable size instead of the ~8px a straight scale would give.
 */

export const PANEL_PAD = 22;
export const CARD_FILL = "rgba(255, 255, 255, 0.15)";
export const HAIRLINE = "rgba(255, 255, 255, 0.6)";
/** Minimum touch target on the kiosk. */
export const TOUCH = 48;

/** Props the panel hands every screen layout. */
export type ScreenProps = {
  /** Changes on every advance or manual move — restarts the countdown bar. */
  cycleKey: string;
  /** False for single-screen tabs and tabs that opt out of auto-advance. */
  counting: boolean;
  index: number;
  count: number;
  onStep: (delta: number) => void;
  onSelect: (index: number) => void;
};

/* ── Bracketed card ── */
// Four L-corners around a translucent copy block, per the exports.

const BRACKET = 22;

export function CardBrackets() {
  const line = "1px solid #FFFFFF";
  const corners: CSSProperties[] = [
    { top: 0, left: 0, borderTop: line, borderLeft: line },
    { top: 0, right: 0, borderTop: line, borderRight: line },
    { bottom: 0, left: 0, borderBottom: line, borderLeft: line },
    { bottom: 0, right: 0, borderBottom: line, borderRight: line },
  ];
  return (
    <>
      {corners.map((corner, i) => (
        <span
          key={i}
          aria-hidden
          style={{
            position: "absolute",
            width: BRACKET,
            height: BRACKET,
            pointerEvents: "none",
            ...corner,
          }}
        />
      ))}
    </>
  );
}

/**
 * Copy card + its countdown bar, bracketed. `flex` lets a layout stretch the
 * card to fill its column.
 */
export function CopyCard({
  children,
  cycleKey,
  counting,
  flex,
}: {
  children: ReactNode;
  cycleKey: string;
  counting: boolean;
  flex?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        padding: "10px 12px",
        ...(flex ? { flex: 1, display: "flex", flexDirection: "column" } : null),
      }}
    >
      <CardBrackets />
      <div
        style={{
          background: CARD_FILL,
          padding: "16px 18px",
          ...(flex ? { flex: 1 } : null),
        }}
      >
        {children}
      </div>
      <CountdownBar cycleKey={cycleKey} counting={counting} />
    </div>
  );
}

/**
 * Orange fill over a red track, filling across INFO_SLIDE_MS — the same
 * constant that drives the hold timer, so bar and advance can't drift apart.
 * Tabs with a single screen render the rail unanimated: the design shows it,
 * but there is nothing to count down to.
 */
export function CountdownBar({
  cycleKey,
  counting,
}: {
  cycleKey: string;
  counting: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 3,
        margin: "8px 4px 0",
        background: "#ED1B2E",
      }}
    >
      {counting && (
        <span
          key={cycleKey}
          className="v1-gi-fill"
          style={{
            position: "absolute",
            inset: 0,
            background: "var(--v1-orange)",
            backgroundClip: "padding-box",
            borderRight: "4px solid transparent",
            animationDuration: `${INFO_SLIDE_MS}ms`,
          }}
        />
      )}
    </div>
  );
}

/* ── Section strip ── */
// The small header strip over a column (e.g. "GUTTA PERCHA", "Tree
// Information") — same translucent-white gradient as the panel title strip at
// two thirds the height.

export function SectionStrip({
  label,
  mono = false,
}: {
  label: string;
  mono?: boolean;
}) {
  return (
    <div
      style={{
        position: "relative",
        height: 34,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        boxSizing: "border-box",
      }}
    >
      <span
        aria-hidden
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(0deg, rgba(255,255,255,0) 41.87%, #FFFFFF 413.39%), linear-gradient(180deg, rgba(255,255,255,0) 45.95%, #FFFFFF 278.39%)",
          border: "0.37px solid #FFFFFF",
          boxSizing: "border-box",
          pointerEvents: "none",
        }}
      />
      <span
        style={{
          position: "relative",
          fontFamily: mono ? "var(--v1-mono)" : "var(--v1-display)",
          fontWeight: 600,
          fontSize: 16,
          letterSpacing: mono ? "0.14em" : "0.04em",
          textTransform: mono ? "uppercase" : "none",
          color: "#FFFFFF",
        }}
      >
        {label}
      </span>
    </div>
  );
}

/* ── Typography ── */

export const CARD_TITLE: CSSProperties = {
  margin: 0,
  fontFamily: "var(--v1-mono)",
  fontWeight: 600,
  fontSize: 28,
  lineHeight: "36px",
  color: "var(--v1-fg)",
};

export const CARD_BODY: CSSProperties = {
  fontFamily: "var(--v1-mono)",
  fontWeight: 300,
  fontSize: 15,
  lineHeight: "23px",
  color: "var(--v1-fg)",
};

/* ── Framed photo ── */

export function Photo({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
    <img
      src={src}
      alt={alt}
      style={{
        display: "block",
        objectFit: "cover",
        border: "1px solid rgba(255, 255, 255, 0.85)",
        borderRadius: 8,
        ...style,
      }}
    />
  );
}

/* ── Step arrow ── */
// Orange translucent square with a white chevron, bottom-right of a screen.

export function StepButton({
  direction,
  onClick,
}: {
  direction: "prev" | "next";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "next" ? "Next" : "Previous"}
      className="v1-pressable"
      style={{
        width: TOUCH,
        height: TOUCH,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 0,
        cursor: "pointer",
        background: "rgba(240, 90, 34, 0.54)",
        border: "1px solid var(--v1-orange)",
      }}
    >
      <svg width="16" height="26" viewBox="0 0 16 26" fill="none" aria-hidden>
        <path
          d={direction === "next" ? "M3 2 L13 13 L3 24" : "M13 2 L3 13 L13 24"}
          stroke="#FFFFFF"
          strokeWidth="3"
          strokeLinecap="square"
        />
      </svg>
    </button>
  );
}
