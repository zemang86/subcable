import type { Language } from "@/lib/types";

type LanguageToggleProps = {
  value: Language;
  onChange: (lang: Language) => void;
};

// Vertical EN/BM pill toggle (Figma). The button IS the SVG: it shows the
// graphic for whichever language is currently active (EN highlighted vs BM
// highlighted); tapping flips to the other language. Sized to the 76px cluster
// button width so it lines up under the left-edge action stack.
const WIDTH = 76;

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const next: Language = value === "en" ? "bm" : "en";
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value === "bm"}
      aria-label={value === "en" ? "Switch to Bahasa Malaysia" : "Switch to English"}
      onClick={() => onChange(next)}
      className="v1-pressable-dim"
      style={{
        width: WIDTH,
        background: "transparent",
        border: "none",
        padding: 0,
        cursor: "pointer",
        display: "block",
        lineHeight: 0,
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={value === "en" ? "/buttons/lang-en.svg" : "/buttons/lang-bm.svg"}
        alt={value === "en" ? "English active" : "Bahasa Malaysia active"}
        width={WIDTH}
        draggable={false}
        style={{
          display: "block",
          width: "100%",
          height: "auto",
          userSelect: "none",
          pointerEvents: "none",
        }}
      />
    </button>
  );
}
