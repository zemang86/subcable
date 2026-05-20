type KeyStatisticProps = {
  label: string;
  value: string | number;
  /** "hot" = orange-hot stat number, "mute" = white tabular text. */
  accent?: "hot" | "mute";
};

export function KeyStatistic({ label, value, accent = "hot" }: KeyStatisticProps) {
  return (
    <div
      className="v1-card-bevel"
      style={{
        width: 194,
        height: 66,
        padding: "10px 14px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
      }}
    >
      <span className="v1-h-eye" style={{ fontSize: 9 }}>
        {label}
      </span>
      <span
        className={accent === "hot" ? "v1-h-stat" : "v1-mono"}
        style={{
          fontSize: accent === "hot" ? 32 : 26,
          color: accent === "hot" ? "var(--v1-orange-hot)" : "var(--v1-fg)",
          lineHeight: 1,
          textAlign: "right",
        }}
      >
        {value}
      </span>
    </div>
  );
}
