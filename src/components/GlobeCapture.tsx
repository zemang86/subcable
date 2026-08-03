"use client";

// Temporary, isolated route for grabbing a clean 16:9 globe screenshot —
// no HUD chrome, no cable route glow, no points/labels. Does not touch
// GlobeScene.tsx; safe to delete along with app/capture/page.tsx when done.

import { useCallback, useEffect, useRef, useState } from "react";
import Globe from "./GlobeWrapper";

const WORLD_MAP_DARK_URL = "/textures/world-mono-dark.webp";
const STARFIELD_URL = "/textures/starfield.webp";
const ATMOSPHERE_COLOR = "#237ED0";
const BG_COLOR = "#040E1F";

const DEFAULT_LAT = 5;
const DEFAULT_LNG = 108;
const DEFAULT_ALT = 2.2;

// preserveDrawingBuffer so the canvas can be read back with toDataURL for
// the download button below — main app's renderer skips this (perf cost).
const RENDERER_CONFIG = {
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
  preserveDrawingBuffer: true,
} as const;

export default function GlobeCapture() {
  const globeRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => setSize({ width: el.clientWidth, height: el.clientHeight });
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const handleGlobeReady = useCallback(() => {
    const g = globeRef.current;
    if (!g) return;
    g.pointOfView({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, altitude: DEFAULT_ALT }, 0);
    g.renderer()?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    const controls = g.controls();
    if (controls) {
      controls.autoRotate = false;
      controls.enableDamping = true;
      controls.dampingFactor = 0.1;
      controls.enablePan = false;
    }
  }, []);

  const handleDownload = useCallback(() => {
    const g = globeRef.current;
    const canvas: HTMLCanvasElement | undefined = g?.renderer()?.domElement;
    if (!g || !canvas) return;
    // Force a fresh render right before reading pixels back, in case the
    // browser already discarded the previous frame's buffer.
    g.renderer().render(g.scene(), g.camera());
    const link = document.createElement("a");
    link.download = `globe-capture-${canvas.width}x${canvas.height}.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
  }, []);

  return (
    <div className="fixed inset-0 flex items-center justify-center" style={{ background: "#000" }}>
      <div
        ref={containerRef}
        style={{
          width: "min(100vw, 177.78vh)",
          height: "min(56.25vw, 100vh)",
          background: BG_COLOR,
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
            showAtmosphere={true}
            atmosphereColor={ATMOSPHERE_COLOR}
            atmosphereAltitude={0.12}
            onGlobeReady={handleGlobeReady}
            animateIn={false}
            rendererConfig={RENDERER_CONFIG}
          />
        )}
      </div>

      <button
        type="button"
        onClick={handleDownload}
        className="fixed bottom-4 right-4 rounded-md bg-white/10 px-4 py-2 text-sm text-white/80 backdrop-blur hover:bg-white/20"
      >
        Download PNG
      </button>
    </div>
  );
}
