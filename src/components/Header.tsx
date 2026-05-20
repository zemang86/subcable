import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

type HeaderProps = {
  selectedCable: CableSystem | null;
  language: Language;
};

// Top "Header" strip per Figma V1.3.
// Frame 2008×120 at (18, 12) at the kiosk tile (2049×1150). Rendered with
// right:23 so the strip stretches with viewport width; height stays fixed.
export function Header({ selectedCable, language }: HeaderProps) {
  const t = useT(language);
  const typeLabel =
    selectedCable?.classification === "domestic" ? "DOM" : "INT";

  return (
    <div
      style={{
        position: "absolute",
        top: 12,
        left: 18,
        right: 23,
        height: 120,
        pointerEvents: "none",
      }}
    >
      {/* Rectangle 50 — translucent white-gradient fill, 3px inset from frame */}
      <div
        style={{
          boxSizing: "border-box",
          position: "absolute",
          left: 3,
          top: 4,
          right: 3,
          bottom: 4,
          background:
            "linear-gradient(0deg, rgba(255,255,255,0) 41.87%, #FFFFFF 413.39%), linear-gradient(180deg, rgba(255,255,255,0) 45.95%, #FFFFFF 278.39%)",
          border: "0.374494px solid #FFFFFF",
        }}
      />

      {/* 4 L-shaped corner brackets at the frame corners */}
      <FrameCorner position="tl" />
      <FrameCorner position="tr" />
      <FrameCorner position="bl" />
      <FrameCorner position="br" />

      {/* Title: Submarine Cable Map */}
      <span
        style={{
          position: "absolute",
          left: 27,
          top: 26,
          width: 537,
          height: 68,
          fontFamily: "var(--v1-display)",
          fontStyle: "normal",
          fontWeight: 700,
          fontSize: 52,
          lineHeight: "68px",
          color: "#FFFFFF",
        }}
      >
        {t("submarineCableMap")}
      </span>

      {selectedCable && (
        <>
          {/* SKR1M / cable code — Chakra Petch Regular 64px, right-anchored */}
          <span
            style={{
              position: "absolute",
              right: 24,
              top: 34,
              width: 194,
              height: 83,
              fontFamily: "var(--v1-display)",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: 64,
              lineHeight: "83px",
              color: "#FFFFFF",
              textAlign: "right",
            }}
          >
            {selectedCable.shortName}
          </span>

          {/* Top-right DOM/INT chip cluster — film-strip frame */}
          <DomChip label={typeLabel} />
        </>
      )}
    </div>
  );
}

function FrameCorner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const base = {
    position: "absolute" as const,
    width: 8,
    height: 8,
    borderStyle: "solid" as const,
    borderColor: "#FFFFFF",
  };
  const variants = {
    tl: { top: 0, left: 0, borderWidth: "2px 0 0 2px" },
    tr: { top: 0, right: 0, borderWidth: "2px 2px 0 0" },
    bl: { bottom: 0, left: 0, borderWidth: "0 0 2px 2px" },
    br: { bottom: 0, right: 0, borderWidth: "0 2px 2px 0" },
  };
  return <span aria-hidden style={{ ...base, ...variants[position] }} />;
}

// Composite chip — translucent rect + Chakra Petch Light 275 label,
// bracketed by 2 thin white lines and 4 tiny corner dots.
function DomChip({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 29,
        top: 10,
        width: 47.05,
        height: 27.74,
      }}
    >
      {/* Top + bottom tactical lines */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0.66,
          top: 0.63,
          width: 45.79,
          height: 0,
          borderTop: "0.6px solid #FFFFFF",
        }}
      />
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 0.66,
          top: 27.14,
          width: 45.79,
          height: 0,
          borderTop: "0.6px solid #FFFFFF",
        }}
      />
      {/* 4 corner dots */}
      <Dot left={0} top={0} />
      <Dot left={45.79} top={0} />
      <Dot left={0} top={26.47} />
      <Dot left={45.79} top={26.47} />

      {/* Rounded rect bg + label */}
      <div
        style={{
          position: "absolute",
          left: 0.84,
          top: 1.93,
          width: 45.61,
          height: 24.25,
          background: "rgba(217, 217, 217, 0.4)",
          borderRadius: 1.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <span
          style={{
            fontFamily: "var(--v1-display)",
            fontStyle: "normal",
            fontWeight: 275,
            fontSize: 18.22,
            lineHeight: 1,
            color: "#FFFFFF",
          }}
        >
          {label}
        </span>
      </div>
    </div>
  );
}

function Dot({ left, top }: { left: number; top: number }) {
  return (
    <span
      aria-hidden
      style={{
        position: "absolute",
        left,
        top,
        width: 1.26,
        height: 1.26,
        background: "#FFFFFF",
      }}
    />
  );
}
