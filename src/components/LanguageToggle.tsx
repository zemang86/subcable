import type { Language } from "@/lib/types";

type LanguageToggleProps = {
  value: Language;
  onChange: (lang: Language) => void;
};

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  return (
    <div className="v1-pill" role="radiogroup" aria-label="Language">
      <button
        type="button"
        role="radio"
        aria-checked={value === "en"}
        onClick={() => onChange("en")}
        className={`v1-pill__opt ${value === "en" ? "is-active" : ""}`}
      >
        English
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value === "bm"}
        onClick={() => onChange("bm")}
        className={`v1-pill__opt ${value === "bm" ? "is-active" : ""}`}
      >
        Bahasa Malaysia
      </button>
    </div>
  );
}
