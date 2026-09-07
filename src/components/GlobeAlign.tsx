"use client";

// Temporary, isolated alignment rig — overlays the LIVE globe on the emerge
// clip's final frame so the reveal pose can be matched by eye and the numbers
// copied straight into GlobeScene.tsx. Does not touch GlobeScene; safe to
// delete along with app/align/ when done.
//
// Why it exists: the emerge video was rendered from a globe shot taken at
// lat 5 / lng 108 (the old capture route, deleted in 958db8e), while GlobeScene
// recenters to MY_LAT 4.2105 / MY_LNG 101.9758 — about 6 degrees of longitude
// apart, so the globe visibly snaps at the clip2 to live handoff.
//
// The rig renders the globe with the SAME settings GlobeScene uses for the
// reveal, at the kiosk's 16:9, with the video frame behind it. Everything else
// (cables, points, chrome) is left off — only the sphere's pose is being matched.

import { useCallback, useEffect, useRef, useState } from "react";
import Globe from "./GlobeWrapper";

// Land texture only — GlobeScene also lays a sea overlay over this, but the
// coastlines are what the pose is matched against, and the extra sphere would
// only wash them out against the reference.
const WORLD_MAP_DARK_URL = "/textures/world-mono-dark.webp";
const STARFIELD_URL = "/textures/starfield.webp";
const ATMOSPHERE_COLOR = "#237ED0";
const BG_COLOR = "#040E1F";

/** Where GlobeScene currently sits (MY_LAT / MY_LNG / MY_ALT). */
const SCENE = { lat: 4.2105, lng: 101.9758, alt: 2.2 };
/** Where the deleted capture route sat — what the emerge clip was rendered from. */
const CAPTURE = { lat: 5, lng: 108, alt: 2.2 };

/** Reference frame: the emerge clip's last frame, extracted at build time. */
const REF_FRAME = "/align/emerge-last.png";

type Pose = { lat: number; lng: number; alt: number };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GlobeHandle = any;

export default function GlobeAlign() {
  const globeRef = useRef<GlobeHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [pose, setPose] = useState<Pose>(CAPTURE);
  const [opacity, setOpacity] = useState(0.5);
  const [showRef, setShowRef] = useState(true);
  const [diff, setDiff] = useState(false);
  const [copied, setCopied] = useState(false);
  const ready = useRef(false);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () =>
      setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Push the pose on every change, with 0ms transition so dragging a slider
  // tracks live instead of easing behind the pointer.
  useEffect(() => {
    if (!ready.current) return;
    globeRef.current?.pointOfView(
      { lat: pose.lat, lng: pose.lng, altitude: pose.alt },
      0,
    );
  }, [pose]);

  const handleGlobeReady = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    ready.current = true;
    g.pointOfView({ lat: pose.lat, lng: pose.lng, altitude: pose.alt }, 0);
    g.renderer()?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const controls = g.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.enableDamping = false;
      controls.enablePan = false;
    }
    // Keep the pose in sync when the globe is dragged directly: OrbitControls
    // moves the camera without telling React, so read it back on change.
    controls?.addEventListener?.("change", () => {
      const pov = g.pointOfView();
      if (!pov) return;
      setPose((p) =>
        Math.abs(p.lat - pov.lat) < 1e-4 &&
        Math.abs(p.lng - pov.lng) < 1e-4 &&
        Math.abs(p.alt - pov.altitude) < 1e-4
          ? p
          : {
              lat: +pov.lat.toFixed(4),
              lng: +pov.lng.toFixed(4),
              alt: +pov.altitude.toFixed(4),
            },
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const snippet =
    `const MY_LAT = ${pose.lat};\n` +
    `const MY_LNG = ${pose.lng};\n` +
    `const MY_ALT = ${pose.alt};`;

  const copy = useCallback(() => {
    void navigator.clipboard?.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    });
  }, [snippet]);

  return (
    <div
      className="fixed inset-0 flex items-center justify-center"
      style={{ background: "#000" }}
    >
      {/* 16:9 stage — same aspect the kiosk and the clip both use, so the
          reference frame and the globe share a coordinate space. */}
      <div
        ref={containerRef}
        style={{
          position: "relative",
          width: "min(100vw, 177.78vh)",
          height: "min(56.25vw, 100vh)",
          background: BG_COLOR,
          overflow: "hidden",
        }}
      >
        {size.width > 0 && size.height > 0 && (
          <Globe
            ref={globeRef}
            width={size.width}
            height={size.height}
            backgroundColor={BG_COLOR}
            backgroundImageUrl={STARFIELD_URL}
            globeImageUrl={WORLD_MAP_DARK_URL}
            showAtmosphere
            atmosphereColor={ATMOSPHERE_COLOR}
            atmosphereAltitude={0.12}
            onGlobeReady={handleGlobeReady}
            animateIn={false}
          />
        )}

        {/* Reference frame on top, at adjustable opacity. `difference` blend
            makes a perfect match go black — far more sensitive than eyeballing
            a 50% dissolve, which hides a couple of degrees easily. */}
        {showRef && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={REF_FRAME}
            alt="emerge final frame"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "fill",
              opacity: diff ? 1 : opacity,
              mixBlendMode: diff ? "difference" : "normal",
              pointerEvents: "none",
            }}
          />
        )}

        {/* Centre crosshair — both the clip's sphere and ours should sit on it. */}
        <div style={crosshairV} />
        <div style={crosshairH} />
      </div>

      <Panel
        pose={pose}
        setPose={setPose}
        opacity={opacity}
        setOpacity={setOpacity}
        showRef={showRef}
        setShowRef={setShowRef}
        diff={diff}
        setDiff={setDiff}
        snippet={snippet}
        copy={copy}
        copied={copied}
      />
    </div>
  );
}

const crosshairV: React.CSSProperties = {
  position: "absolute",
  left: "50%",
  top: 0,
  bottom: 0,
  width: 1,
  background: "rgba(255,0,0,0.55)",
  pointerEvents: "none",
};
const crosshairH: React.CSSProperties = {
  position: "absolute",
  top: "50%",
  left: 0,
  right: 0,
  height: 1,
  background: "rgba(255,0,0,0.55)",
  pointerEvents: "none",
};

function Panel({
  pose,
  setPose,
  opacity,
  setOpacity,
  showRef,
  setShowRef,
  diff,
  setDiff,
  snippet,
  copy,
  copied,
}: {
  pose: Pose;
  setPose: (p: Pose | ((p: Pose) => Pose)) => void;
  opacity: number;
  setOpacity: (v: number) => void;
  showRef: boolean;
  setShowRef: (v: boolean) => void;
  diff: boolean;
  setDiff: (v: boolean) => void;
  snippet: string;
  copy: () => void;
  copied: boolean;
}) {
  return (
    <div
      style={{
        position: "fixed",
        top: 12,
        right: 12,
        width: 300,
        padding: 14,
        borderRadius: 8,
        background: "rgba(8,14,28,0.92)",
        border: "1px solid rgba(255,255,255,0.18)",
        backdropFilter: "blur(8px)",
        color: "#fff",
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
        fontSize: 12,
        display: "flex",
        flexDirection: "column",
        gap: 10,
        zIndex: 10,
      }}
    >
      <strong style={{ fontSize: 13, letterSpacing: "0.04em" }}>
        EMERGE POSE ALIGN
      </strong>

      <Slider
        label="lat"
        value={pose.lat}
        min={-30}
        max={40}
        step={0.0001}
        onChange={(v) => setPose((p) => ({ ...p, lat: v }))}
      />
      <Slider
        label="lng"
        value={pose.lng}
        min={60}
        max={150}
        step={0.0001}
        onChange={(v) => setPose((p) => ({ ...p, lng: v }))}
      />
      <Slider
        label="alt"
        value={pose.alt}
        min={1.2}
        max={3.5}
        step={0.001}
        onChange={(v) => setPose((p) => ({ ...p, alt: v }))}
      />

      <div style={{ display: "flex", gap: 6 }}>
        <Btn onClick={() => setPose(SCENE)}>scene</Btn>
        <Btn onClick={() => setPose(CAPTURE)}>capture</Btn>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.15)" }} />

      <label style={rowLabel}>
        <input
          type="checkbox"
          checked={showRef}
          onChange={(e) => setShowRef(e.target.checked)}
        />
        reference frame
      </label>
      <label style={rowLabel}>
        <input
          type="checkbox"
          checked={diff}
          onChange={(e) => setDiff(e.target.checked)}
        />
        difference blend (match = black)
      </label>
      {!diff && (
        <Slider
          label="opacity"
          value={opacity}
          min={0}
          max={1}
          step={0.01}
          onChange={setOpacity}
        />
      )}

      <hr style={{ border: 0, borderTop: "1px solid rgba(255,255,255,0.15)" }} />

      <textarea
        readOnly
        value={snippet}
        onFocus={(e) => e.currentTarget.select()}
        style={{
          width: "100%",
          height: 62,
          resize: "none",
          background: "rgba(0,0,0,0.45)",
          border: "1px solid rgba(255,255,255,0.2)",
          borderRadius: 4,
          color: "#9fe6a0",
          font: "inherit",
          padding: 6,
        }}
      />
      <Btn onClick={copy}>{copied ? "copied ✓" : "copy to clipboard"}</Btn>
      <span style={{ opacity: 0.55, lineHeight: 1.5 }}>
        Paste over MY_LAT / MY_LNG / MY_ALT in GlobeScene.tsx. Drag the globe
        directly to fine-tune; sliders follow.
      </span>
    </div>
  );
}

const rowLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: 6,
  cursor: "pointer",
};

function Slider({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <span style={{ opacity: 0.7 }}>{label}</span>
        <input
          type="number"
          value={value}
          step={step}
          onChange={(e) => {
            const v = Number(e.target.value);
            if (Number.isFinite(v)) onChange(v);
          }}
          style={{
            width: 96,
            textAlign: "right",
            background: "rgba(0,0,0,0.45)",
            border: "1px solid rgba(255,255,255,0.2)",
            borderRadius: 3,
            color: "#fff",
            font: "inherit",
            padding: "1px 4px",
          }}
        />
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ width: "100%" }}
      />
    </div>
  );
}

function Btn({
  onClick,
  children,
}: {
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        flex: 1,
        padding: "5px 8px",
        borderRadius: 4,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.2)",
        color: "#fff",
        font: "inherit",
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}
