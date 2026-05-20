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
        bottom: 0,
        padding: "24px 36px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-end",
        pointerEvents: "none",
        minHeight: 120,
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
        {t("submarineCableMap")}
      </span>

      {selectedCable && (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-end",
          }}
        >
          <span
            className="v1-h-display"
            style={{
              fontSize: 64,
              color: "var(--v1-fg)",
              lineHeight: 1,
            }}
          >
            {selectedCable.shortName}
          </span>
          <span
            className="v1-tag"
            style={{
              padding: "4px 10px",
              fontSize: 11,
              alignSelf: "center",
            }}
          >
            {typeLabel}
          </span>
        </div>
      )}
    </div>
  );
}
