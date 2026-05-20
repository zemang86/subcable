import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

type LanguageToggleProps = {
  value: Language;
  onChange: (lang: Language) => void;
};

export function LanguageToggle({ value, onChange }: LanguageToggleProps) {
  const t = useT(value);
  return (
    <div
      role="radiogroup"
      aria-label="Language"
      style={{
        display: "inline-flex",
        padding: 4,
        borderRadius: 9999,
        background: "rgba(0, 0, 0, 0.55)",
        border: "1px solid rgba(255, 255, 255, 0.40)",
      }}
    >
      <LangButton active={value === "en"} onClick={() => onChange("en")}>
        {t("english")}
      </LangButton>
      <LangButton active={value === "bm"} onClick={() => onChange("bm")}>
        {t("bahasaMalaysia")}
      </LangButton>
    </div>
  );
}

function LangButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      style={{
        minHeight: 40,
        padding: "8px 22px",
        borderRadius: 9999,
        border: "none",
        cursor: "pointer",
        background: active ? "var(--v1-fg)" : "transparent",
        color: active ? "var(--v1-orange)" : "var(--v1-fg)",
        fontFamily: "var(--v1-heading)",
        fontWeight: 500,
        fontSize: 13,
        letterSpacing: "0.04em",
        transition: "background 200ms, color 200ms",
      }}
    >
      {children}
    </button>
  );
}
