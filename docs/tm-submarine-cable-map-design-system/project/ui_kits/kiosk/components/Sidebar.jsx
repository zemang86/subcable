// Filter tabs + 3×3 cable grid + count strip — the right-edge "Cable System" panel
function FilterTabs({ value, onChange, t }) {
  const FILTERS = [
    { id: "all", key: "showAll" },
    { id: "international", key: "international" },
    { id: "domestic", key: "domestic" },
  ];
  return (
    <div style={{ display: "flex", gap: 6 }}>
      {FILTERS.map(f => (
        <button key={f.id} type="button" onClick={() => onChange(f.id)}
          className={`tm-filter-tab ${value === f.id ? "is-active" : ""}`}>
          {t[f.key]}
        </button>
      ))}
    </div>
  );
}

function Sidebar({ cables, selectedId, onSelect, filter, onFilter, t }) {
  const visible = React.useMemo(() => {
    if (filter === "all") return cables;
    if (filter === "international") return cables.filter(c => c.type === "INT");
    return cables.filter(c => c.type === "DOM");
  }, [cables, filter]);
  const activeCount = visible.filter(c => c.status === "active").length;
  const inactiveCount = visible.length - activeCount;

  return (
    <div style={{
      position: "absolute", top: 220, left: 28,
      width: 460, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <FilterTabs value={filter} onChange={onFilter} t={t} />

      <div className="tm-card-bevel" style={{
        padding: 14, minHeight: 260, maxHeight: 360, overflowY: "auto",
      }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
          {visible.map(c => (
            <CableCard key={c.id} cable={c} selected={selectedId === c.id}
              onClick={() => onSelect(selectedId === c.id ? null : c.id)} />
          ))}
        </div>
      </div>

      <div className="tm-titlebar" style={{
        padding: "10px 14px", border: "1px solid rgba(255,255,255,0.15)",
        background: "linear-gradient(180deg, transparent 0%, rgba(0,0,0,0.6) 100%)",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="tm-h-display" style={{ fontSize: 13 }}>{t.cableSystemTitle}</span>
        <div style={{ display: "flex", gap: 14 }}>
          <CountChip n={activeCount} label={t.active} tone="active" />
          {inactiveCount > 0 && <CountChip n={inactiveCount} label={t.inactive} tone="inactive" />}
        </div>
      </div>
    </div>
  );
}

function CountChip({ n, label, tone }) {
  return (
    <div style={{ display: "flex", gap: 5, alignItems: "center" }}>
      <StatusIndicator status={tone} pulse={tone === "active"} scale={0.7} />
      <span style={{
        fontFamily: "var(--tm-heading)", fontSize: 11, letterSpacing: "0.08em",
        color: tone === "active" ? "var(--tm-active)" : "var(--tm-inactive)",
      }}>{n} {label}</span>
    </div>
  );
}

Object.assign(window, { FilterTabs, Sidebar });
