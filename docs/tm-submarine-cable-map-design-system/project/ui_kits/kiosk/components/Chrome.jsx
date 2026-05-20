// Floating chrome — Audio Mute (top-left), Language Toggle + Compass (top-centre),
// Right Cluster (right-edge), Bottom Titlebar, Key Statistic cards (top-right).

function AudioMute({ muted, onToggle }) {
  return (
    <button type="button" onClick={onToggle} aria-label="Mute audio"
      aria-pressed={muted}
      style={{
        width: 36, height: 36,
        background: muted ? "var(--tm-inactive-bg)" : "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.40)",
        color: "var(--tm-fg)", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}>
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        {muted ? <><line x1="23" y1="9" x2="17" y2="15" /><line x1="17" y1="9" x2="23" y2="15" /></>
          : <><path d="M19.07 4.93a10 10 0 0 1 0 14.14" /><path d="M15.54 8.46a5 5 0 0 1 0 7.07" /></>}
      </svg>
    </button>
  );
}

function LanguageToggle({ value, onChange }) {
  return (
    <div className="tm-pill">
      <button className={`tm-pill__opt ${value === "en" ? "is-active" : ""}`}
        onClick={() => onChange("en")}>English</button>
      <button className={`tm-pill__opt ${value === "bm" ? "is-active" : ""}`}
        onClick={() => onChange("bm")}>Bahasa Malaysia</button>
    </div>
  );
}

function CompassButton({ onClick }) {
  return (
    <button type="button" onClick={onClick} aria-label="Locate"
      style={{
        width: 44, height: 44, borderRadius: "50%",
        background: "rgba(255,255,255,0.04)",
        border: "1px solid rgba(255,255,255,0.40)",
        color: "var(--tm-fg)", display: "flex", alignItems: "center", justifyContent: "center",
        cursor: "pointer",
      }}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="1" x2="12" y2="5" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="1" y1="12" x2="5" y2="12" />
        <line x1="19" y1="12" x2="23" y2="12" />
      </svg>
    </button>
  );
}

function RightCluster({ open, onOpen, cableSelected }) {
  return (
    <div style={{
      position: "absolute", right: 26, top: "50%", transform: "translateY(-50%)",
      display: "flex", flexDirection: "column", gap: 14, zIndex: 6,
    }}>
      <ClusterBtn active={open === "howto"} onClick={() => onOpen("howto")} label="How to use">
        <circle cx="12" cy="12" r="9" />
        <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
      </ClusterBtn>
      <ClusterBtn active={open === "funfact"} onClick={() => onOpen("funfact")}
        disabled={!cableSelected} label="Information">
        <circle cx="12" cy="12" r="9" />
        <circle cx="12" cy="12" r="6.5" />
        <path d="M12 8h.01M11 12h1v4h1" />
      </ClusterBtn>
      <ClusterBtn active={open === "morse"} onClick={() => onOpen("morse")}
        disabled={!cableSelected} label="Morse Code">
        {/* dots + dashes glyph from Figma V1.3 — pattern of 5 dots in column + 5 dashes offset */}
        <g fill="currentColor" stroke="none">
          <circle cx="7"  cy="4.5" r="1.2"/>
          <circle cx="7"  cy="8"   r="1.2"/>
          <circle cx="7"  cy="11.5" r="1.2"/>
          <circle cx="7"  cy="15"  r="1.2"/>
          <circle cx="7"  cy="18.5" r="1.2"/>
          <rect x="11" y="3.4" width="7" height="1.7" rx="0.6"/>
          <rect x="11" y="6.9" width="7" height="1.7" rx="0.6"/>
          <rect x="11" y="10.4" width="7" height="1.7" rx="0.6"/>
          <rect x="11" y="13.9" width="7" height="1.7" rx="0.6"/>
          <rect x="11" y="17.4" width="7" height="1.7" rx="0.6"/>
        </g>
      </ClusterBtn>
    </div>
  );
}

function ClusterBtn({ active, disabled, onClick, children, label }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled}
      aria-label={label} aria-pressed={active}
      className={`tm-circle-btn ${active ? "is-active" : ""}`}>
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none"
        stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {children}
      </svg>
    </button>
  );
}

function BottomTitlebar({ title, cable }) {
  return (
    <div className="tm-titlebar" style={{
      position: "absolute", left: 0, right: 0, top: 0, padding: "18px 32px",
      display: "flex", justifyContent: "space-between", alignItems: "flex-start",
      minHeight: 110, zIndex: 4,
      background: "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.90) 40%, transparent 100%)",
    }}>
      <div style={{
        fontFamily: "var(--tm-display)", fontWeight: 700, fontSize: 56,
        letterSpacing: "0.02em", color: "var(--tm-fg)", lineHeight: 1,
      }}>{title}</div>
      {cable && (
        <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
          <div style={{
            fontFamily: "var(--tm-display)", fontWeight: 700, fontSize: 56,
            letterSpacing: "0.04em", color: "var(--tm-fg)", lineHeight: 1,
          }}>{cable.short}</div>
          <span style={{
            fontFamily: "var(--tm-pixel)", fontSize: 11, color: "var(--tm-fg)",
            padding: "3px 9px", border: "1px solid rgba(255,255,255,0.6)",
          }}>{cable.type}</span>
        </div>
      )}
    </div>
  );
}

function KeyStats({ t }) {
  return (
    <div style={{
      position: "absolute", right: 110, top: 140, zIndex: 4,
      display: "flex", gap: 12, alignItems: "flex-start",
    }}>
      <KeyStatistic label="km of cable on seafloor" value="1.3M" />
      <KeyStatistic label="cables worldwide" value="600+" />
      <KeyStatistic label="of global internet traffic" value="95%+" />
    </div>
  );
}

Object.assign(window, { AudioMute, LanguageToggle, CompassButton, RightCluster, BottomTitlebar, KeyStats });
