// TM Submarine Cable Map — kiosk shell.
// Recreated from /Wireframe/UI-UI-Concept-V1.3 and subcable/src/components/GlobeScene.tsx.
// Inside a fixed 2049×1150 stage, scaled with CSS transform to fit any viewport.

const STAGE_W = 2049;
const STAGE_H = 1150;

function App() {
  const cables = window.TM_CABLES;
  const COPY = window.TM_COPY;

  const [selectedId, setSelectedId] = React.useState("mct");
  const [filter, setFilter] = React.useState("all");
  const [lang, setLang] = React.useState("en");
  const [dialog, setDialog] = React.useState(null);  // "howto" | "funfact" | "morse" | null
  const [callout, setCallout] = React.useState(null); // landing point id
  const [muted, setMuted] = React.useState(false);

  const t = COPY[lang];
  const selectedCable = cables.find(c => c.id === selectedId) || null;

  const resetView = () => { setSelectedId(null); setCallout(null); setDialog(null); };

  // Fit-to-viewport scaler
  const stageRef = React.useRef(null);
  React.useEffect(() => {
    const onResize = () => {
      const el = stageRef.current;
      if (!el) return;
      const sx = window.innerWidth / STAGE_W;
      const sy = window.innerHeight / STAGE_H;
      const s = Math.min(sx, sy);
      el.style.transform = `translate(-50%, -50%) scale(${s})`;
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  return (
    <div style={{
      position: "fixed", inset: 0, background: "#000",
      display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
    }}>
      <div ref={stageRef} className="tm-tv-grid" style={{
        position: "absolute", top: "50%", left: "50%",
        width: STAGE_W, height: STAGE_H,
        background: "var(--tm-bg)",
        transformOrigin: "center center",
        boxShadow: "0 0 80px rgba(3,77,161,0.2)",
        overflow: "hidden",
      }}>
        {/* Globe */}
        <div style={{
          position: "absolute", right: -120, top: 0, bottom: 0, width: 1380,
          pointerEvents: "auto",
        }}>
          <Globe cables={cables} selectedId={selectedId}
            onPointTap={id => setCallout(id)} />
        </div>

        {/* Top-left chrome — audio mute (below title bar) */}
        <div style={{ position: "absolute", top: 140, left: 28, zIndex: 6 }}>
          <AudioMute muted={muted} onToggle={() => setMuted(m => !m)} />
        </div>

        {/* Lang toggle + compass — below title bar */}
        <div style={{
          position: "absolute", top: 140, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 14, alignItems: "center", zIndex: 6,
        }}>
          <LanguageToggle value={lang} onChange={setLang} />
          <CompassButton onClick={resetView} />
        </div>

        {/* Top-right — key statistic strip (below title bar) */}
        <KeyStats t={t} />

        {/* Sidebar — cable system grid */}
        <Sidebar cables={cables} selectedId={selectedId}
          onSelect={id => { setSelectedId(id); setCallout(null); }}
          filter={filter} onFilter={setFilter} t={t} />

        {/* Right cluster — How To / Info / Morse Code (Figma V1.3) */}
        <RightCluster open={dialog} onOpen={id => setDialog(id)}
          cableSelected={!!selectedCable} />

        {/* Cable Information — bottom-left */}
        {selectedCable && (
          <CableInfo cable={selectedCable} t={t}
            onOpenMorse={() => setDialog("morse")} />
        )}

        {/* Landing-point callout */}
        {callout && <LandingCallout pointId={callout} onClose={() => setCallout(null)} />}

        {/* Bottom titlebar */}
        <BottomTitlebar title={t.submarineCableMap} cable={selectedCable} />

        {/* Dialogs */}
        {dialog === "howto" && <HowToDialog onClose={() => setDialog(null)} t={t} />}
        {dialog === "funfact" && selectedCable && (
          <FunFactDialog cable={selectedCable} onClose={() => setDialog(null)} t={t} />
        )}
        {dialog === "morse" && selectedCable && (
          <MorseDialog cable={selectedCable} onClose={() => setDialog(null)} t={t} />
        )}
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
