// Globe — placeholder SVG sphere with cable polylines.
// The real kiosk renders three-globe.gl with the night-earth texture; this is a
// stylized 2D recreation in the same visual language (white land outlines + red
// 3px selected cable, 1px white 30% unselected). svgX/svgY in TM_LANDING_POINTS
// are positioned on a 1121×1150 frame.

function Globe({ cables, selectedId, onPointTap, hideUnselected = false }) {
  const W = 1121, H = 1150;
  const points = window.TM_LANDING_POINTS;

  // Build a quadratic-bezier path for each cable's polyline
  const renderCable = (c) => {
    const segs = c.points
      .map(id => points[id])
      .filter(Boolean)
      .map(p => p.svg);
    if (segs.length < 2) return null;
    const d = segs.reduce((acc, [x, y], i) => {
      if (i === 0) return `M ${x} ${y}`;
      const [px, py] = segs[i - 1];
      const cx = (px + x) / 2, cy = (py + y) / 2 - 30;
      return `${acc} Q ${cx} ${cy}, ${x} ${y}`;
    }, "");
    const isSelected = selectedId === c.id;
    if (!isSelected && hideUnselected) return null;
    return (
      <path key={c.id} d={d}
        stroke={isSelected ? "var(--tm-inactive-2)" : "rgba(255,255,255,0.30)"}
        strokeWidth={isSelected ? 3 : 1}
        fill="none"
      />
    );
  };

  // Land outlines: very loose blob shapes inspired by the Figma globe — we
  // intentionally don't replicate the real coastline; placeholder vector only.
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>
      <defs>
        <radialGradient id="sphereGlow" cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="rgba(3,77,161,0.45)" />
          <stop offset="70%" stopColor="rgba(4,14,31,0.95)" />
          <stop offset="100%" stopColor="rgba(4,14,31,1)" />
        </radialGradient>
        <clipPath id="sphereClip">
          <circle cx={W / 2} cy={H / 2} r={H / 2 - 40} />
        </clipPath>
      </defs>

      {/* Sphere base */}
      <circle cx={W / 2} cy={H / 2} r={H / 2 - 40} fill="url(#sphereGlow)"
        stroke="rgba(3,77,161,0.45)" strokeWidth="1" />

      {/* Atmospheric ring */}
      <circle cx={W / 2} cy={H / 2} r={H / 2 - 30} fill="none"
        stroke="rgba(3,77,161,0.40)" strokeWidth="2" opacity="0.6" />

      <g clipPath="url(#sphereClip)">
        {/* Latitude graticules */}
        {Array.from({ length: 7 }).map((_, i) => (
          <ellipse key={"lat" + i} cx={W / 2} cy={H / 2} rx={(H / 2 - 40)}
            ry={((H / 2 - 40) / 7) * (i + 1) * 0.5}
            fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
        ))}
        {/* Longitude graticules */}
        {Array.from({ length: 12 }).map((_, i) => (
          <line key={"lng" + i}
            x1={W / 2 - (H / 2 - 40) * Math.cos((i / 12) * Math.PI)}
            y1={H / 2 - (H / 2 - 40) * Math.sin((i / 12) * Math.PI) * 0.001}
            x2={W / 2 + (H / 2 - 40) * Math.cos((i / 12) * Math.PI)}
            y2={H / 2 + (H / 2 - 40) * Math.sin((i / 12) * Math.PI) * 0.001}
            stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
        ))}

        {/* Placeholder land masses — very loose Asia-Pacific shapes */}
        <g fill="rgba(6,22,48,0.85)" stroke="rgba(255,255,255,0.55)" strokeWidth="1">
          {/* Eurasia roughly */}
          <path d="M 60 350 L 220 320 L 330 360 L 420 380 L 480 360 L 560 380 L 620 410 L 660 470 L 700 510 L 720 540 L 700 560 L 660 540 L 600 510 L 540 530 L 470 510 L 400 520 L 340 510 L 280 490 L 230 470 L 180 440 L 140 420 L 90 400 Z" />
          {/* SE Asia archipelago */}
          <path d="M 480 600 L 540 590 L 580 610 L 620 600 L 660 630 L 700 660 L 740 640 L 760 620 L 780 600 L 800 620 L 780 660 L 740 700 L 700 720 L 660 700 L 620 680 L 580 660 L 540 640 L 500 620 Z" />
          {/* Australia hint */}
          <path d="M 720 820 L 820 810 L 870 840 L 880 870 L 860 900 L 800 910 L 750 890 L 720 860 Z" />
          {/* Japan / Korea hint */}
          <path d="M 760 340 L 800 320 L 820 360 L 800 420 L 780 440 L 760 420 Z" />
          {/* India hint */}
          <path d="M 230 420 L 280 410 L 310 440 L 320 500 L 290 560 L 260 540 L 240 500 Z" />
          {/* Middle East */}
          <path d="M 80 360 L 140 350 L 170 370 L 200 410 L 180 440 L 140 430 L 100 410 Z" />
        </g>

        {/* Cable polylines */}
        {cables.map(renderCable)}

        {/* Landing points — show all the landing points of the selected cable */}
        {selectedId && (() => {
          const cable = cables.find(c => c.id === selectedId);
          if (!cable) return null;
          return cable.points.map(id => {
            const p = points[id];
            if (!p) return null;
            return (
              <g key={id} onClick={() => onPointTap && onPointTap(id)}
                style={{ cursor: "pointer" }}>
                <circle cx={p.svg[0]} cy={p.svg[1]} r="11" fill="rgba(240,90,34,0.20)"
                  stroke="var(--tm-orange)" strokeWidth="1.2" className="tm-pulse" />
                <circle cx={p.svg[0]} cy={p.svg[1]} r="4" fill="var(--tm-orange)" />
              </g>
            );
          });
        })()}
      </g>
    </svg>
  );
}

// LandingPointCallout — overlay box pointing at a landing point
function LandingCallout({ pointId, onClose }) {
  const p = window.TM_LANDING_POINTS[pointId];
  if (!p) return null;
  const W = 1121, H = 1150;
  // Place callout above-left of the point
  const xPct = p.svg[0] / W * 100;
  const yPct = p.svg[1] / H * 100;
  return (
    <div onClick={onClose} style={{
      position: "absolute", inset: 0, zIndex: 7,
    }}>
      <div onClick={e => e.stopPropagation()} style={{
        position: "absolute", left: `calc(${xPct}% - 100px)`, top: `calc(${yPct}% - 80px)`,
        padding: "8px 12px", background: "rgba(240,90,34,0.92)",
        border: "1px solid var(--tm-orange-hot)",
        display: "flex", flexDirection: "column", gap: 2, minWidth: 200,
      }}>
        <div style={{
          fontFamily: "var(--tm-heading)", fontWeight: 600, fontSize: 14,
          color: "var(--tm-fg)", letterSpacing: "0.08em", textTransform: "uppercase",
        }}>{p.city}</div>
        <div style={{
          fontFamily: "var(--tm-pixel)", fontSize: 9, color: "var(--tm-fg-cream)",
          letterSpacing: "0.04em",
        }}>{p.region}</div>
      </div>
      <div style={{
        position: "absolute", left: `${xPct}%`, top: `calc(${yPct}% - 40px)`,
        width: 1, height: 40, background: "var(--tm-orange)",
      }} />
    </div>
  );
}

Object.assign(window, { Globe, LandingCallout });
