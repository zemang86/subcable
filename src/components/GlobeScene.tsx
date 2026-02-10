"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "./GlobeWrapper";
import Header from "./Header";
import Sidebar from "./Sidebar";
import LoadingScreen from "./LoadingScreen";
import { cables } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import { cableRoutes } from "@/data/cableRoutes";
import { CableSystem, LandingPoint } from "@/lib/types";
import { TM_COLORS, CABLE_COLORS } from "@/lib/colors";

// Globe textures (local high-res)
const TEXTURES = {
  night: {
    globe: "/textures/earth-night-hires.jpg",
    bg: "/textures/night-sky.png",
    atmosphere: "#2362DD",
  },
  day: {
    globe: "/textures/earth-day-hires.jpg",
    bg: "/textures/night-sky.png",
    atmosphere: "#4da6ff",
  },
} as const;
const BUMP_IMAGE = "/textures/earth-topology.png";

type GlobeMode = "night" | "day";

interface PathData {
  coords: [number, number][];
  cableId: string;
  name: string;
  color: string;
}

export default function GlobeScene() {
  const globeRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCable, setSelectedCable] = useState<CableSystem | null>(null);
  const [globeMode, setGlobeMode] = useState<GlobeMode>("night");
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(2.2);

  // Resize handler
  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Prepare path data for globe
  const pathsData: PathData[] = useMemo(() => {
    return cableRoutes.flatMap((route) =>
      route.segments.map((seg) => ({
        coords: seg.coords,
        cableId: route.cableId,
        name:
          cables.find((c) => c.id === route.cableId)?.shortName || route.cableId,
        color: CABLE_COLORS[route.cableId] || "#ffffff",
      }))
    );
  }, []);

  // Prepare points data for globe
  const pointsData = useMemo(() => {
    return landingPoints.map((p) => ({
      ...p,
      size: 0.4,
      color: TM_COLORS.landingPointDefault,
    }));
  }, []);

  // Initialize globe view centered on SEA
  const handleGlobeReady = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: 5, lng: 108, altitude: 2.2 },
        0
      );
      // Enable auto-rotation
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 0.3;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        // Touch support
        controls.enablePan = false;
        controls.touches = {
          ONE: 0, // THREE.TOUCH.ROTATE
          TWO: 2, // THREE.TOUCH.DOLLY_PAN
        };
      }
    }
    setTimeout(() => setIsLoaded(true), 500);
  }, []);

  // Stop auto-rotation on interaction, resume after idle
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const stopAutoRotate = () => {
      controls.autoRotate = false;
      clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        controls.autoRotate = true;
      }, 8000);
    };

    const el = globeRef.current.renderer().domElement;
    el.addEventListener("pointerdown", stopAutoRotate);
    el.addEventListener("touchstart", stopAutoRotate, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", stopAutoRotate);
      el.removeEventListener("touchstart", stopAutoRotate);
      clearTimeout(idleTimer);
    };
  }, [isLoaded]);

  // Track camera altitude for dynamic scaling
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    let rafId: number;
    const poll = () => {
      const pov = globeRef.current?.pointOfView?.();
      if (pov && typeof pov.altitude === "number") {
        setZoomLevel(pov.altitude);
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isLoaded]);

  // Linear interpolation helper for zoom-based scaling
  const scaleByZoom = useCallback(
    (farVal: number, closeVal: number) => {
      const ALT_FAR = 2.2;
      const ALT_CLOSE = 0.5;
      const t = Math.max(0, Math.min(1, (zoomLevel - ALT_CLOSE) / (ALT_FAR - ALT_CLOSE)));
      return closeVal + t * (farVal - closeVal);
    },
    [zoomLevel]
  );

  // Handle cable selection
  const handleSelectCable = useCallback(
    (cable: CableSystem | null) => {
      setSelectedCable(cable);
      if (cable && globeRef.current) {
        // Find center of cable's landing points
        const points = landingPoints.filter((p) =>
          cable.landingPointIds.includes(p.id)
        );
        const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
        const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

        // Zoom level based on cable extent
        const latSpread = Math.max(...points.map((p) => p.lat)) - Math.min(...points.map((p) => p.lat));
        const lngSpread = Math.max(...points.map((p) => p.lng)) - Math.min(...points.map((p) => p.lng));
        const spread = Math.max(latSpread, lngSpread);
        const altitude = Math.max(0.8, Math.min(2.5, spread / 15));

        globeRef.current.pointOfView(
          { lat: avgLat, lng: avgLng, altitude },
          1500
        );
      } else if (!cable && globeRef.current) {
        globeRef.current.pointOfView({ lat: 5, lng: 108, altitude: 2.2 }, 1500);
      }
    },
    []
  );

  // Handle point click
  const handlePointClick = useCallback((point: LandingPoint) => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: point.lat, lng: point.lng, altitude: 0.8 },
        1500
      );
    }
  }, []);

  // Handle globe path click
  const handlePathClick = useCallback(
    (path: PathData) => {
      const cable = cables.find((c) => c.id === path.cableId);
      if (cable) handleSelectCable(cable);
    },
    [handleSelectCable]
  );

  // Path color based on selection state
  const getPathColor = useCallback(
    (path: PathData) => {
      if (!selectedCable) return path.color;
      if (path.cableId === selectedCable.id) return path.color;
      return "rgba(100, 100, 100, 0.15)";
    },
    [selectedCable]
  );

  // Point color based on selection state
  const getPointColor = useCallback(
    (point: any) => {
      if (!selectedCable) return TM_COLORS.landingPointDefault;
      if (selectedCable.landingPointIds.includes(point.id))
        return TM_COLORS.cableHighlight;
      return "rgba(100, 100, 100, 0.3)";
    },
    [selectedCable]
  );

  // Point size based on selection
  const getPointAltitude = useCallback(
    (point: any) => {
      if (!selectedCable) return 0.01;
      if (selectedCable.landingPointIds.includes(point.id)) return 0.03;
      return 0.005;
    },
    [selectedCable]
  );

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#0A0E1A]"
      style={{ touchAction: "none" }}
    >
      {!isLoaded && <LoadingScreen />}

      <Globe
        ref={globeRef}
        width={Math.max(dimensions.width - 380, 400)}
        height={dimensions.height}
        globeImageUrl={TEXTURES[globeMode].globe}
        bumpImageUrl={BUMP_IMAGE}
        backgroundImageUrl={TEXTURES[globeMode].bg}
        showAtmosphere={true}
        atmosphereColor={TEXTURES[globeMode].atmosphere}
        atmosphereAltitude={0.18}
        // Paths (cable routes)
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathColor={getPathColor as any}
        pathStroke={(path: any) =>
          selectedCable?.id === path.cableId ? 3 : 1.5
        }
        pathDashLength={0.15}
        pathDashGap={0.05}
        pathDashAnimateTime={15000}
        pathLabel={(path: any) => `<div style="padding:6px 10px;background:rgba(10,14,26,0.9);border:1px solid rgba(35,98,221,0.4);border-radius:4px;color:#E2E8F0;font-size:12px;font-family:monospace;">${path.name}</div>`}
        onPathClick={handlePathClick as any}
        // Points (landing stations)
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={getPointColor as any}
        pointAltitude={getPointAltitude as any}
        pointRadius={scaleByZoom(0.35, 0.1)}
        pointLabel={(p: any) => `<div style="padding:6px 10px;background:rgba(10,14,26,0.9);border:1px solid rgba(35,98,221,0.4);border-radius:4px;color:#E2E8F0;font-size:12px;font-family:monospace;">${p.city}, ${p.country}</div>`}
        onPointClick={(point: any) => {
          handlePointClick(point);
          // Also select the first cable connected to this point
          const cable = cables.find((c) => point.cableIds?.includes(c.id));
          if (cable) setSelectedCable(cable);
        }}
        // Labels
        labelsData={pointsData}
        labelLat="lat"
        labelLng="lng"
        labelText="city"
        labelSize={scaleByZoom(0.6, 0.15)}
        labelColor={() => "rgba(226, 232, 240, 0.8)"}
        labelDotRadius={scaleByZoom(0.15, 0.04)}
        labelAltitude={0.015}
        labelResolution={2}
        // Events
        onGlobeReady={handleGlobeReady}
        animateIn={true}
      />

      <Header />
      <Sidebar
        selectedCable={selectedCable}
        onSelectCable={handleSelectCable}
        onPointClick={handlePointClick}
      />

      {/* Day/Night toggle */}
      <button
        onClick={() => setGlobeMode(globeMode === "night" ? "day" : "night")}
        className="absolute bottom-6 right-[400px] z-10 flex items-center gap-2 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg text-left active:bg-white/5 transition-colors min-h-[48px]"
      >
        <div className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${globeMode === "night" ? "bg-[#1A1F35]" : "bg-[#2362DD]/40"}`}>
          <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${globeMode === "night" ? "left-0.5 bg-[#60A5FA]" : "left-5 bg-[#FFD700]"}`} />
        </div>
        <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8]">
          {globeMode === "night" ? "NIGHT" : "DAY"}
        </span>
      </button>

      {/* Controls overlay */}
      <div className="absolute bottom-6 left-6 z-10 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg pointer-events-none">
        <div className="text-[10px] text-[#60A5FA] font-bold tracking-[0.1em] mb-2">
          CONTROLS
        </div>
        <div className="space-y-1 text-[11px] text-[#94A3B8]">
          <div>DRAG &mdash; Rotate globe</div>
          <div>PINCH &mdash; Zoom in/out</div>
          <div>TAP &mdash; Select cable/point</div>
        </div>
      </div>
    </div>
  );
}
