import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

type HeaderProps = {
  selectedCable: CableSystem | null;
  language: Language;
  className?: string;
};

// Top "Header" strip per Figma V1.3.
// Frame 2008×120 at (18, 12) at the kiosk tile (2049×1150). Rendered with
// right:23 so the strip stretches with viewport width; height stays fixed.
export function Header({ selectedCable, language, className }: HeaderProps) {
  const t = useT(language);
  const typeLabel =
    selectedCable?.classification === "domestic" ? "DOM" : "INT";

  return (
    <div
      className={className}
      style={{
        position: "absolute",
        top: 12,
        left: 18,
        right: 23,
        height: 80,
        pointerEvents: "none",
      }}
    >
      {/* Rectangle 50 — translucent white-gradient fill, 3px inset from frame.
          Crosshair markers are children of this so their -4 offset sits on the
          actual visible border corner. */}
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
      >
        <CrossMark position="tl" />
        <CrossMark position="tr" />
        <CrossMark position="bl" />
        <CrossMark position="br" />
      </div>

      {/* Title: Submarine Cable Map */}
      <span
        style={{
          position: "absolute",
          left: 27,
          top: 14,
          fontFamily: "var(--v1-display)",
          fontStyle: "normal",
          fontWeight: 700,
          fontSize: 40,
          lineHeight: "48px",
          color: "#FFFFFF",
          whiteSpace: "nowrap",
        }}
      >
        {t("submarineCableMap")}
      </span>

      {selectedCable && (
        <>
          {/* Cable code — middle-right column, leaves room for chip in 3rd column */}
          <span
            style={{
              position: "absolute",
              right: 87,
              top: 14,
              fontFamily: "var(--v1-display)",
              fontStyle: "normal",
              fontWeight: 400,
              fontSize: 48,
              lineHeight: "48px",
              color: "#FFFFFF",
              textAlign: "right",
              whiteSpace: "nowrap",
            }}
          >
            {selectedCable.shortName}
          </span>

          {/* DOM/INT chip — 3rd column, far right, vertically centered */}
          <DomChip label={typeLabel} />
        </>
      )}
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

// Composite chip — translucent rect + Chakra Petch Light 275 label,
// bracketed by 2 thin white lines and 4 tiny corner dots.
function DomChip({ label }: { label: string }) {
  return (
    <div
      style={{
        position: "absolute",
        right: 24,
        top: 26,
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
