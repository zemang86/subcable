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
      className="v1-titlebar"
      style={{
        position: "absolute",
        left: 0,
        right: 0,
        top: 0,
        padding: "14px 36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        pointerEvents: "none",
        minHeight: 56,
      }}
    >
      <span
        className="v1-h-display"
        style={{
          fontSize: 24,
          color: "var(--v1-fg)",
          letterSpacing: "0.04em",
          lineHeight: 1,
        }}
      >
        {t("submarineCableMap")}
      </span>

      {selectedCable && (
        <div
          style={{
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          <span
            className="v1-h-display"
            style={{
              fontSize: 28,
              color: "var(--v1-fg)",
              lineHeight: 1,
            }}
          >
            {selectedCable.shortName}
          </span>
          <span
            className="v1-tag"
            style={{
              padding: "3px 8px",
              fontSize: 10,
            }}
          >
            {typeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
