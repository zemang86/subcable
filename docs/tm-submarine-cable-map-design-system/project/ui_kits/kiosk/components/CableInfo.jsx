// CableInformation panel — bottom-right when a cable is selected
function CableInfo({ cable, onOpenMorse, t }) {
  const inactive = cable.status === "inactive";
  return (
    <div className="tm-card-bevel" style={{
      position: "absolute", left: 28, bottom: 130, width: 580, padding: 18, zIndex: 5,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 2 }}>
        <StatusIndicator status={inactive ? "inactive" : "active"} pulse={!inactive} />
        <div className="tm-h-heading" style={{
          fontSize: 18,
          color: inactive ? "var(--tm-inactive)" : "var(--tm-active)",
        }}>{cable.short}</div>
        {inactive && (
          <span style={{
            padding: "3px 8px", fontFamily: "var(--tm-heading)", fontWeight: 700,
            fontSize: 9, letterSpacing: "0.20em", color: "var(--tm-fg)",
            background: "var(--tm-inactive-2)", textTransform: "uppercase",
          }}>{t.decommissioned}</span>
        )}
      </div>
      <div className="tm-h-eye" style={{ marginBottom: 16 }}>{cable.name}</div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10, marginBottom: 16 }}>
        <Field label={t.length} value={cable.length} />
        <Field label={t.built} value={String(cable.built)} />
        <Field label={t.rfs} value={cable.rfs} />
        <Field label={t.type} value={cable.type === "INT" ? "INTERNATIONAL" : "DOMESTIC"} />
      </div>

      <div className="tm-h-eye" style={{ marginBottom: 6 }}>{t.owners}</div>
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 14 }}>
        {cable.owners.map(o => <span key={o} className="tm-tag">{o}</span>)}
      </div>

      <div className="tm-h-eye" style={{ marginBottom: 6 }}>{t.description}</div>
      <p style={{
        fontFamily: "var(--tm-mono)", fontSize: 11, color: "var(--tm-mute)",
        lineHeight: 1.6, margin: "0 0 14px",
      }}>{cable.description}</p>

      {!inactive && (
        <button type="button" onClick={onOpenMorse} className="tm-btn-primary"
          style={{ width: "100%" }}>{t.sendMessage} →</button>
      )}
    </div>
  );
}

function Field({ label, value }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div className="tm-h-eye" style={{ fontSize: 9 }}>{label}</div>
      <div style={{
        padding: "5px 9px", background: "rgba(255,255,255,0.06)",
        border: "1px solid rgba(255,255,255,0.3)",
        fontFamily: "var(--tm-mono)", fontSize: 11, color: "var(--tm-fg)",
        whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
      }}>{value}</div>
    </div>
  );
}

Object.assign(window, { CableInfo });
