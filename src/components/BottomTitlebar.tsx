import type { CableSystem, Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

type BottomTitlebarProps = {
  selectedCable: CableSystem | null;
  language: Language;
};

export function BottomTitlebar({ selectedCable, language }: BottomTitlebarProps) {
  const t = useT(language);
  const typeLabel =
    selectedCable?.classification === "domestic" ? "DOM" : "INT";

  return (
    <div
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        padding: "18px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        pointerEvents: "none",
        minHeight: 110,
        background:
          "linear-gradient(180deg, #000 0%, rgba(0, 0, 0, 0.90) 40%, transparent 100%)",
      }}
    >
      <span
        className="v1-h-display"
        style={{
          fontSize: 56,
          color: "var(--v1-fg)",
          letterSpacing: "0.02em",
          lineHeight: 1,
        }}
      >
        {t("submarineCableMap")}
      </span>

      {selectedCable && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "center",
          }}
        >
          <span
            className="v1-h-display"
            style={{
              fontSize: 56,
              color: "var(--v1-fg)",
              letterSpacing: "0.04em",
              lineHeight: 1,
            }}
          >
            {selectedCable.shortName}
          </span>
          <span
            style={{
              fontFamily: "var(--v1-pixel)",
              fontSize: 11,
              color: "var(--v1-fg)",
              padding: "3px 9px",
              border: "1px solid rgba(255, 255, 255, 0.6)",
            }}
          >
            {typeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
