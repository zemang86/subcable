// StatusIndicator — triple concentric ring · 14×14 base · CSS in colors_and_type.css
function StatusIndicator({ status = "active", pulse = false, scale = 1 }) {
  const cls = ["tm-status", status === "inactive" ? "inactive" : "", pulse ? "tm-pulse" : ""]
    .filter(Boolean).join(" ");
  const style = scale === 1 ? undefined : { transform: `scale(${scale})` };
  return <span className={cls} style={style} aria-hidden />;
}

// CableCard — used in 3×3 grid
function CableCard({ cable, selected, onClick }) {
  const inactive = cable.status === "inactive";
  const cls = ["tm-cablecard", selected ? "is-selected" : "", inactive ? "is-inactive" : ""]
    .filter(Boolean).join(" ");
  return (
    <button type="button" onClick={onClick} className={cls}
      style={{ textAlign: "left", cursor: "pointer", minHeight: 60, font: "inherit" }}
      aria-pressed={selected}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 6 }}>
        <span style={{
          fontFamily: "var(--tm-display)", fontWeight: 700,
          fontSize: cable.short.length > 8 ? 9 : 11,
          color: "var(--tm-fg)", lineHeight: 1.1, letterSpacing: "0.04em", flex: 1,
        }}>{cable.short}</span>
        <span style={{
          fontFamily: "var(--tm-pixel)", fontSize: 8, color: "var(--tm-fg)",
          padding: "1px 5px", border: "1px solid rgba(255,255,255,0.6)", flexShrink: 0,
        }}>{cable.type}</span>
      </div>
      <div style={{
        fontFamily: "var(--tm-mono)", fontSize: 8, lineHeight: 1.3,
        color: "rgba(255,255,255,0.85)",
        overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
      }}>{cable.name}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: "auto" }}>
        <StatusIndicator status={inactive ? "inactive" : "active"} pulse={!inactive} scale={0.6} />
        <span style={{ fontFamily: "var(--tm-mono)", fontSize: 7, color: "var(--tm-mute)" }}>
          {inactive ? cable.length : `${cable.length} · ${cable.points.length} POINTS`}
        </span>
      </div>
    </button>
  );
}

// KeyStatistic — 194×66 bevel card with stat number
function KeyStatistic({ label, value, accent = "hot" }) {
  return (
    <div className="tm-card-bevel" style={{
      width: 194, height: 66, padding: "10px 14px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
    }}>
      <span className="tm-h-eye" style={{ fontSize: 9 }}>{label}</span>
      <span className={accent === "hot" ? "tm-h-stat" : "tm-mono"} style={{
        fontSize: accent === "hot" ? 32 : 26,
        color: accent === "hot" ? "var(--tm-orange-hot)" : "var(--tm-fg)",
        lineHeight: 1, textAlign: "right",
      }}>{value}</span>
    </div>
  );
}

Object.assign(window, { StatusIndicator, CableCard, KeyStatistic });
