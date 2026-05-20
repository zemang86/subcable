// HowTo / FunFact / Morse dialogs — overlay variants of the kiosk

function DialogShell({ title, onClose, width = 1100, children }) {
  return (
    <div role="dialog" aria-modal="false" aria-label={title}
      style={{
        position: "absolute", top: "50%", left: "50%",
        transform: "translate(-50%, -50%)", zIndex: 50,
        width: `min(${width}px, 95%)`, background: "var(--tm-bg-deep)",
        border: "1px solid rgba(255,255,255,0.40)",
        display: "flex", flexDirection: "column",
      }}>
      {children}
      <div style={{
        borderTop: "1px solid rgba(255,255,255,0.20)",
        padding: "14px 28px", display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <span className="tm-h-display" style={{ fontSize: 18 }}>{title}</span>
        <button type="button" onClick={onClose} aria-label="Close" style={{
          width: 36, height: 36, background: "transparent",
          border: "1px solid rgba(255,255,255,0.40)", color: "var(--tm-fg)",
          cursor: "pointer", fontFamily: "var(--tm-mono)", fontSize: 14,
        }}>✕</button>
      </div>
    </div>
  );
}

function HowToDialog({ onClose, t }) {
  return (
    <DialogShell title={t.howToTitle} onClose={onClose} width={1100}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(3, 1fr)",
        gap: 28, padding: "56px 60px", flex: 1,
      }}>
        <Tile title={t.tapToInteract} body={t.tapToInteractBody} icon={
          <>
            <path d="M9 11.5V7a2 2 0 0 1 4 0v6" />
            <path d="M13 8a2 2 0 0 1 4 0v5" />
            <path d="M17 9a2 2 0 0 1 4 0v6a6 6 0 0 1-6 6h-3a6 6 0 0 1-5.66-4l-2.21-6a2 2 0 0 1 3.76-1.34l1.11 3" />
          </>
        } />
        <Tile title={t.zoomInOut} body={t.zoomInOutBody} icon={
          <>
            <circle cx="11" cy="11" r="7" />
            <path d="M21 21l-4.35-4.35" />
            <path d="M11 8v6M8 11h6" />
          </>
        } />
        <Tile title={t.swipe} body={t.swipeBody} icon={
          <>
            <path d="M3 12h18" />
            <path d="M9 6l-6 6 6 6" />
            <path d="M15 6l6 6-6 6" />
          </>
        } />
      </div>
    </DialogShell>
  );
}

function Tile({ icon, title, body }) {
  return (
    <div className="tm-bracket" style={{
      padding: "32px 24px", display: "flex", flexDirection: "column",
      alignItems: "center", gap: 16, textAlign: "center",
    }}>
      <span className="bracket-tl" /><span className="bracket-br" />
      <svg width="46" height="46" viewBox="0 0 24 24" fill="none"
        stroke="var(--tm-fg)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {icon}
      </svg>
      <div className="tm-h-heading" style={{
        fontSize: 14, color: "var(--tm-fg)", textTransform: "uppercase",
        letterSpacing: "0.12em",
      }}>{title}</div>
      <p style={{
        fontFamily: "var(--tm-mono)", fontSize: 11, color: "var(--tm-mute)",
        lineHeight: 1.6, margin: 0, maxWidth: 280,
      }}>{body}</p>
    </div>
  );
}

function FunFactDialog({ cable, onClose, t }) {
  const [active, setActive] = React.useState(0);
  const THUMBS = [
    { id: 1, label: "Cross-section" },
    { id: 2, label: "Repeater" },
    { id: 3, label: "Cable ship I" },
    { id: 4, label: "Cable ship II" },
  ];
  return (
    <DialogShell title={t.funFactTitle} onClose={onClose} width={1200}>
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12,
        padding: 22, borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}>
        {THUMBS.map((th, i) => (
          <button key={th.id} type="button" onClick={() => setActive(i)}
            aria-pressed={active === i}
            style={{
              aspectRatio: "16 / 9", background: "rgba(255,255,255,0.05)",
              border: `${active === i ? 3 : 1}px solid ${active === i ? "var(--tm-orange)" : "rgba(255,255,255,0.30)"}`,
              cursor: "pointer", padding: 0, position: "relative", overflow: "hidden",
            }}>
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center",
              justifyContent: "center", color: "rgba(255,255,255,0.30)",
              fontFamily: "var(--tm-pixel)", fontSize: 12,
            }}>[ {th.label.toUpperCase()} ]</div>
            <span style={{
              position: "absolute", bottom: 6, left: 8,
              fontFamily: "var(--tm-mono)", fontSize: 10, color: "var(--tm-fg)",
              textShadow: "0 1px 2px rgba(0,0,0,0.8)",
            }}>{th.label}</span>
          </button>
        ))}
      </div>
      <div style={{
        aspectRatio: "16 / 9", margin: 22, position: "relative",
        background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.15)",
        display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
      }}>
        <div style={{
          position: "absolute", inset: 0, display: "grid", placeItems: "center",
          color: "rgba(255,255,255,0.18)", fontFamily: "var(--tm-pixel)",
          fontSize: 18, letterSpacing: "0.20em",
        }}>[ {THUMBS[active].label.toUpperCase()} VIDEO / IMAGE ]</div>
        <button type="button" aria-label="Play" style={{
          position: "relative", width: 84, height: 84, borderRadius: "50%",
          background: "var(--tm-blue)", border: "2px solid var(--tm-fg)",
          display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer",
        }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="var(--tm-orange)">
            <polygon points="7,4 21,12 7,20" />
          </svg>
        </button>
        <span style={{
          position: "absolute", bottom: 18, left: 22,
          fontFamily: "var(--tm-heading)", fontWeight: 600, fontSize: 13,
          letterSpacing: "0.20em", textTransform: "uppercase",
          color: "var(--tm-fg)", textShadow: "0 1px 4px rgba(0,0,0,0.8)",
        }}>{t.overview} · {cable.short}</span>
      </div>
    </DialogShell>
  );
}

// Trimmed morse keyboard — DOT/DASH/SPACE/BACKSPACE/CLEAR/SEND but no live alphabet
// reference (kept compact for the kit). Real impl: subcable/src/components/MorseCodePop.tsx.
const MORSE = { ".-":"A","-...":"B","-.-.":"C","-..":"D",".":"E","..-.":"F","--.":"G","....":"H","..":"I",".---":"J","-.-":"K",".-..":"L","--":"M","-.":"N","---":"O",".--.":"P","--.-":"Q",".-.":"R","...":"S","-":"T","..-":"U","...-":"V",".--":"W","-..-":"X","-.--":"Y","--..":"Z" };

function MorseDialog({ cable, onClose, t }) {
  const [buf, setBuf] = React.useState("");
  const [msg, setMsg] = React.useState("");
  const [from, setFrom] = React.useState(cable.points[0] || "");
  const [to, setTo] = React.useState(cable.points[cable.points.length - 1] || "");
  const cap = msg.length >= 20;

  const append = (s) => { if (!cap) setBuf(b => b + s); };
  const commit = () => {
    const letter = MORSE[buf];
    if (letter && !cap) setMsg(m => m + letter);
    setBuf("");
  };
  const space = () => {
    if (cap) return;
    if (buf) commit();
    if (msg.length > 0 && !msg.endsWith(" ")) setMsg(m => m + " ");
  };
  const back = () => {
    if (buf) setBuf(b => b.slice(0, -1));
    else setMsg(m => m.slice(0, -1));
  };
  const clear = () => { setBuf(""); setMsg(""); };

  return (
    <DialogShell title={t.morseCodeMessage} onClose={onClose} width={1200}>
      {/* From / To pickers */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, padding: 20,
        borderBottom: "1px solid rgba(255,255,255,0.15)",
      }}>
        <Picker label={t.from} value={from} onChange={setFrom} points={cable.points} />
        <Picker label={t.to} value={to} onChange={setTo} points={cable.points} />
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "1fr 240px", gap: 16, padding: 20,
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* Message area */}
          <div style={{
            background: "var(--tm-mute-2)", padding: 14, position: "relative", minHeight: 130,
          }}>
            <div className="tm-h-eye" style={{ color: "var(--tm-orange)" }}>{t.typeMessageHere}</div>
            <div style={{
              marginTop: 12, minHeight: 50,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <span style={{
                fontFamily: "var(--tm-display)", fontWeight: 700, fontSize: 28,
                letterSpacing: "0.12em",
                color: msg ? "var(--tm-bg)" : "var(--tm-mute-dark)",
              }}>{msg || t.tapDotsDashesBegin}</span>
            </div>
            <div style={{
              display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6,
            }}>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <span style={{ fontFamily: "var(--tm-mono)", fontSize: 10, color: "var(--tm-mute-dark)" }}>
                  {msg.length}/20
                </span>
                <span style={{
                  fontFamily: "var(--tm-mono)", fontSize: 10,
                  color: cap ? "var(--tm-inactive-2)" : "var(--tm-orange)",
                }}>buffer: {buf || "·"}</span>
              </div>
              <span style={{
                fontFamily: "var(--tm-mono)", fontSize: 10,
                color: cap ? "var(--tm-inactive-2)" : "var(--tm-mute-dark)",
              }}>{t.maximumLetter} [20]</span>
            </div>
          </div>

          {/* DOT / DASH */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
            <KeyBtn variant="primary" disabled={cap} onClick={() => append(".")} label="·" hint={t.dot} />
            <KeyBtn variant="primary" disabled={cap} onClick={() => append("-")} label="—" hint={t.dash} />
          </div>

          {/* ENTER / SPACE / BACK */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
            <KeyBtn variant="blue" disabled={cap || !buf} onClick={commit} label="↵" hint={t.enterLetter} />
            <KeyBtn variant="plain" disabled={cap} onClick={space} label="␣" hint={t.space} />
            <KeyBtn variant="brown" onClick={back} label="⌫" hint={t.backspace} />
          </div>

          {/* CLEAR / SEND */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: 10 }}>
            <button type="button" onClick={clear} className="tm-btn-danger"
              disabled={!buf && !msg} style={{ opacity: !buf && !msg ? 0.4 : 1 }}>
              {t.clearAll}
            </button>
            <button type="button" onClick={onClose} className="tm-btn-send"
              disabled={!msg.trim()} style={{ opacity: !msg.trim() ? 0.4 : 1 }}>
              {t.sendMessage}
            </button>
          </div>
        </div>

        {/* Morse reference */}
        <div style={{
          border: "1px solid rgba(255,255,255,0.15)", padding: 6,
          maxHeight: 420, overflowY: "auto",
        }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 3 }}>
            {Object.entries(MORSE).map(([code, ch]) => (
              <div key={code} style={{
                background: "var(--tm-blue)", padding: "5px 8px", color: "var(--tm-bg)",
                display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6,
              }}>
                <span style={{ fontFamily: "var(--tm-heading)", fontWeight: 700, fontSize: 12 }}>{ch}</span>
                <span style={{ fontFamily: "var(--tm-mono)", fontSize: 10, letterSpacing: "0.04em" }}>{code}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DialogShell>
  );
}

function Picker({ label, value, onChange, points }) {
  const lp = window.TM_LANDING_POINTS;
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      <span className="tm-h-eye" style={{ fontSize: 9 }}>{label}</span>
      <div className="tm-input">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="var(--tm-fg)" strokeWidth="1.6" strokeLinecap="round">
          <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
          <line x1="12" y1="2" x2="12" y2="12" />
        </svg>
        <select value={value} onChange={e => onChange(e.target.value)} style={{
          flex: 1, marginLeft: 10, background: "transparent", color: "var(--tm-fg)",
          border: "none", outline: "none", fontFamily: "var(--tm-mono)", fontSize: 12,
          appearance: "none",
        }}>
          {points.map(id => (
            <option key={id} value={id} style={{ color: "#000" }}>
              {lp[id] ? `${lp[id].city}, ${lp[id].region.split(" · ").pop()}` : id}
            </option>
          ))}
        </select>
      </div>
    </label>
  );
}

function KeyBtn({ label, hint, onClick, disabled = false, variant }) {
  const styles = {
    primary: { background: "var(--tm-orange)", color: "var(--tm-fg)", minHeight: 56, border: "1px solid var(--tm-orange-hot)" },
    blue:    { background: "var(--tm-blue)",   color: "var(--tm-fg)", minHeight: 48, border: "none" },
    brown:   { background: "var(--tm-brown)",  color: "var(--tm-fg)", minHeight: 48, border: "none" },
    plain:   { background: "rgba(255,255,255,0.06)", color: "var(--tm-fg)", minHeight: 48, border: "1px solid rgba(255,255,255,0.30)" },
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} style={{
      ...styles[variant], display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center", gap: 2,
      cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.4 : 1,
    }}>
      <span style={{
        fontFamily: "var(--tm-display)", fontWeight: 700,
        fontSize: variant === "primary" ? 28 : 22, color: "var(--tm-fg)", lineHeight: 1,
      }}>{label}</span>
      <span style={{
        fontFamily: "var(--tm-heading)", fontWeight: 600, fontSize: 10,
        letterSpacing: "0.18em", textTransform: "uppercase", color: "var(--tm-fg)",
      }}>{hint}</span>
    </button>
  );
}

Object.assign(window, { HowToDialog, FunFactDialog, MorseDialog });
