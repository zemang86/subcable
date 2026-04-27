"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Globe from "./GlobeWrapper";
import Header from "./Header";
import Sidebar from "./Sidebar";
import LoadingScreen from "./LoadingScreen";
import { cables, cablesById } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import { cableRoutes } from "@/data/cableRoutes";
import countries from "@/data/countries.json";
import { CableSystem, LandingPoint } from "@/lib/types";
import { TM_COLORS, CABLE_COLORS } from "@/lib/colors";

// 1x1 transparent PNG — fed to globeImageUrl in outline mode so three.js
// loads a clean (color-keyed) texture instead of holding onto the earth bitmap.
const BLANK_PIXEL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkAAIAAAoAAv/lxKUAAAAASUVORK5CYII=";

// Globe styles (textured = full earth bitmap; outline = country borders only)
const STYLES = {
  "texture-dark": {
    globe: "/textures/earth-night-hires.webp",
    bg: "/textures/night-sky.webp",
    atmosphere: "#2362DD",
    globeColor: undefined,
    countryStroke: undefined,
    countryFill: undefined,
  },
  "texture-light": {
    globe: "/textures/earth-day-hires.webp",
    bg: "/textures/night-sky.webp",
    atmosphere: "#4da6ff",
    globeColor: undefined,
    countryStroke: undefined,
    countryFill: undefined,
  },
  "outline-dark": {
    globe: BLANK_PIXEL,
    bg: "/textures/night-sky.webp",
    atmosphere: "#2362DD",
    globeColor: "#0B1A3A", // deep navy "sea"
    countryStroke: "rgba(180, 220, 255, 0.9)",
    countryFill: "rgba(34, 70, 50, 0.85)", // muted green "land"
  },
  "outline-light": {
    globe: BLANK_PIXEL,
    bg: "/textures/night-sky.webp",
    atmosphere: "#cfe6ff",
    globeColor: "#7EC0EE", // clear blue sea
    countryStroke: "#000000",
    countryFill: "#7BC47F", // green land
  },
  "mono-dark": {
    globe: BLANK_PIXEL,
    bg: "/textures/night-sky.webp",
    atmosphere: "#2362DD",
    globeColor: "#1a1a1a",
    countryStroke: undefined,
    countryFill: undefined,
  },
  "mono-light": {
    globe: BLANK_PIXEL,
    bg: "/textures/night-sky.webp",
    atmosphere: "#cfe6ff",
    globeColor: "#fafaf8",
    countryStroke: undefined,
    countryFill: undefined,
  },
} as const;
const BUMP_IMAGE = "/textures/earth-topology.png";

// XYZ tile servers
const SATELLITE_TILE_URL = (x: number, y: number, level: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`;

// CARTO basemaps (monochrome, free for non-commercial w/ attribution).
// Subdomain rotation a/b/c/d to spread requests across CDN edges.
const cartoSub = (z: number) => "abcd"[(z * 7) % 4];
const CARTO_LIGHT_TILE_URL = (x: number, y: number, level: number) =>
  `https://${cartoSub(x + y)}.basemaps.cartocdn.com/light_all/${level}/${x}/${y}.png`;
const CARTO_DARK_TILE_URL = (x: number, y: number, level: number) =>
  `https://${cartoSub(x + y)}.basemaps.cartocdn.com/dark_all/${level}/${x}/${y}.png`;

const TILE_ZOOM_THRESHOLD = 1.0; // altitude below this enables satellite tiles

const TOOLTIP_STYLE =
  "padding:6px 10px;background:rgba(10,14,26,0.9);border:1px solid rgba(35,98,221,0.4);border-radius:4px;color:#E2E8F0;font-size:12px;font-family:monospace;";
const renderPathLabel = (path: any) =>
  `<div style="${TOOLTIP_STYLE}">${path.name}</div>`;
const renderPointLabel = (p: any) =>
  `<div style="${TOOLTIP_STYLE}">${p.city}, ${p.country}</div>`;
const labelColorFn = () => "rgba(226, 232, 240, 0.8)";

type GlobeStyle = keyof typeof STYLES;
type Theme = "dark" | "light";
type RenderStyle = "texture" | "outline" | "mono";

const RENDER_STYLE_LABEL: Record<RenderStyle, string> = {
  texture: "TEXTURE",
  outline: "OUTLINE",
  mono: "MONO",
};

function nextStyle(s: RenderStyle): RenderStyle {
  return s === "texture" ? "outline" : s === "outline" ? "mono" : "texture";
}

function styleKey(render: RenderStyle, theme: Theme): GlobeStyle {
  return `${render}-${theme}` as GlobeStyle;
}

interface PathData {
  coords: [number, number][];
  cableId: string;
  name: string;
  color: string;
  status: CableSystem["status"];
  /** "line" = solid cable, "dot" = animated travelling glow */
  kind: "line" | "dot";
}

export default function GlobeScene() {
  const globeRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [selectedCable, setSelectedCable] = useState<CableSystem | null>(null);
  const [theme, setTheme] = useState<Theme>("dark");
  const [renderStyle, setRenderStyle] = useState<RenderStyle>("texture");
  const style = STYLES[styleKey(renderStyle, theme)];
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(2.2);
  const [autoRotate, setAutoRotate] = useState(false);

  // Resize handler
  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Prepare path data — two layers per segment: solid line + animated glow dot.
  const pathsData: PathData[] = useMemo(() => {
    const out: PathData[] = [];
    for (const route of cableRoutes) {
      const cable = cablesById[route.cableId];
      const baseColor = CABLE_COLORS[route.cableId] || "#ffffff";
      const status = cable?.status ?? "active";
      const colorByStatus =
        status === "retired" || status === "inactive"
          ? TM_COLORS.cableRetired
          : status === "planned"
            ? TM_COLORS.cablePlanned
            : baseColor;
      for (const seg of route.segments) {
        const base = {
          coords: seg.coords,
          cableId: route.cableId,
          name: cable?.shortName || route.cableId,
          color: colorByStatus,
          status,
        };
        out.push({ ...base, kind: "line" });
        out.push({ ...base, kind: "dot" });
      }
    }
    return out;
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
      globeRef.current.pointOfView({ lat: 5, lng: 108, altitude: 2.2 }, 0);
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
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

  // Sync auto-rotate state with controls
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = autoRotate;
  }, [autoRotate, isLoaded]);

  // Pause auto-rotation on interaction, resume after idle
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (!controls) return;

    let idleTimer: ReturnType<typeof setTimeout>;

    const stopAutoRotate = () => {
      controls.autoRotate = false;
      clearTimeout(idleTimer);
      if (autoRotate) {
        idleTimer = setTimeout(() => {
          controls.autoRotate = true;
        }, 8000);
      }
    };

    const el = globeRef.current.renderer().domElement;
    el.addEventListener("pointerdown", stopAutoRotate);
    el.addEventListener("touchstart", stopAutoRotate, { passive: true });

    return () => {
      el.removeEventListener("pointerdown", stopAutoRotate);
      el.removeEventListener("touchstart", stopAutoRotate);
      clearTimeout(idleTimer);
    };
  }, [isLoaded, autoRotate]);

  // Track camera altitude for dynamic scaling.
  // Only update React state when altitude shifts meaningfully — otherwise this
  // re-renders the whole scene at 60Hz and thrashes globe.gl's diffing.
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    let rafId: number;
    let lastReported = -1;
    const poll = () => {
      const pov = globeRef.current?.pointOfView?.();
      if (pov && typeof pov.altitude === "number") {
        if (Math.abs(pov.altitude - lastReported) > 0.02) {
          lastReported = pov.altitude;
          setZoomLevel(pov.altitude);
        }
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isLoaded]);

  // Linear interpolation between two anchor altitudes (clamped at both ends).
  const scaleByZoom = useCallback(
    (farVal: number, closeVal: number) => {
      const ALT_FAR = 4.0;
      const ALT_CLOSE = 0.35;
      const t = Math.max(
        0,
        Math.min(1, (zoomLevel - ALT_CLOSE) / (ALT_FAR - ALT_CLOSE))
      );
      return closeVal + t * (farVal - closeVal);
    },
    [zoomLevel]
  );

  // Piecewise scaler — accepts a list of [altitude, value] anchors sorted from
  // far to close. Linearly interpolates between adjacent stops; clamps at ends.
  // Useful when sizing should ramp down twice (e.g. labels: shrink at mid zoom,
  // then shrink again at very close zoom so they don't dominate the viewport).
  const piecewiseByZoom = useCallback(
    (stops: [number, number][]) => {
      const z = zoomLevel;
      if (z >= stops[0][0]) return stops[0][1];
      if (z <= stops[stops.length - 1][0]) return stops[stops.length - 1][1];
      for (let i = 0; i < stops.length - 1; i++) {
        const [a, va] = stops[i];
        const [b, vb] = stops[i + 1];
        if (z <= a && z >= b) {
          const t = (z - b) / (a - b);
          return vb + t * (va - vb);
        }
      }
      return stops[stops.length - 1][1];
    },
    [zoomLevel]
  );

  // Handle cable selection
  const handleSelectCable = useCallback((cable: CableSystem | null) => {
    setSelectedCable(cable);
    if (cable && globeRef.current) {
      const points = landingPoints.filter((p) =>
        cable.landingPointIds.includes(p.id)
      );
      if (points.length === 0) return;
      const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
      const avgLng = points.reduce((s, p) => s + p.lng, 0) / points.length;

      const latSpread =
        Math.max(...points.map((p) => p.lat)) -
        Math.min(...points.map((p) => p.lat));
      const lngSpread =
        Math.max(...points.map((p) => p.lng)) -
        Math.min(...points.map((p) => p.lng));
      const spread = Math.max(latSpread, lngSpread);
      const altitude = Math.max(0.4, Math.min(2.8, spread / 18));

      globeRef.current.pointOfView(
        { lat: avgLat, lng: avgLng, altitude },
        1500
      );
    } else if (!cable && globeRef.current) {
      globeRef.current.pointOfView({ lat: 5, lng: 108, altitude: 2.2 }, 1500);
    }
  }, []);

  // Handle point click
  const handlePointClick = useCallback((point: LandingPoint) => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: point.lat, lng: point.lng, altitude: 0.15 },
        1500
      );
    }
  }, []);

  // Click on a globe point: pan to it and select its first associated cable.
  const handleGlobePointClick = useCallback(
    (point: any) => {
      handlePointClick(point);
      const firstCableId = point.cableIds?.[0];
      if (firstCableId && cablesById[firstCableId]) {
        setSelectedCable(cablesById[firstCableId]);
      }
    },
    [handlePointClick]
  );

  // Handle globe path click
  const handlePathClick = useCallback(
    (path: PathData) => {
      const cable = cablesById[path.cableId];
      if (cable) handleSelectCable(cable);
    },
    [handleSelectCable]
  );

  // Path color: dots render brighter than the underlying line.
  const getPathColor = useCallback(
    (path: PathData) => {
      const isSel = selectedCable && path.cableId === selectedCable.id;
      const isMuted = selectedCable && !isSel;
      if (path.kind === "dot") {
        if (isMuted) return "rgba(255,255,255,0)"; // hide muted dots
        return "#FFFFFF";
      }
      if (isMuted) return TM_COLORS.cableMuted;
      return path.color;
    },
    [selectedCable]
  );

  // Stroke: lines uniform; dots slightly thicker for the glow effect.
  const getPathStroke = useCallback(
    (path: PathData) => {
      const isSel = selectedCable && path.cableId === selectedCable.id;
      if (path.kind === "dot") return isSel ? 5 : 3.5;
      return isSel ? 4 : 2;
    },
    [selectedCable]
  );

  // Dash params: lines solid, dots = tiny segment + huge gap = travelling dot.
  const getDashLength = useCallback(
    (path: PathData) => (path.kind === "dot" ? 0.005 : 1),
    []
  );
  const getDashGap = useCallback(
    (path: PathData) => (path.kind === "dot" ? 0.995 : 0),
    []
  );
  const getDashAnimateTime = useCallback(
    (path: PathData) => (path.kind === "dot" ? 6000 : 0),
    []
  );

  // Set of active landing-point IDs for the selected cable (O(1) lookup in the
  // per-point callbacks below).
  const selectedLPSet = useMemo(
    () => (selectedCable ? new Set(selectedCable.landingPointIds) : null),
    [selectedCable]
  );

  // Point color based on selection state
  const getPointColor = useCallback(
    (point: any) => {
      if (!selectedLPSet) return TM_COLORS.landingPointDefault;
      if (selectedLPSet.has(point.id)) return TM_COLORS.cableHighlight;
      return "rgba(100, 100, 100, 0.3)";
    },
    [selectedLPSet]
  );

  // Point size based on selection, scaled by zoom
  const getPointAltitude = useCallback(
    (point: any) => {
      const base = !selectedLPSet
        ? 0.01
        : selectedLPSet.has(point.id)
          ? 0.03
          : 0.005;
      return base * scaleByZoom(1, 0.15);
    },
    [selectedLPSet, scaleByZoom]
  );

  const [useTiles, setUseTiles] = useState(false);
  useEffect(() => {
    // Outline mode = vector polygons only, no raster tiles.
    if (renderStyle === "outline") {
      if (useTiles) setUseTiles(false);
      return;
    }
    // Mono mode renders Carto tiles at all zooms.
    if (renderStyle === "mono") {
      if (!useTiles) setUseTiles(true);
      return;
    }
    if (!useTiles && zoomLevel < TILE_ZOOM_THRESHOLD) {
      setUseTiles(true);
    } else if (useTiles && zoomLevel > TILE_ZOOM_THRESHOLD + 0.15) {
      setUseTiles(false);
    }
  }, [zoomLevel, useTiles, renderStyle]);

  // Tile URL provider switches with render style.
  const tileUrl = useMemo(() => {
    if (renderStyle === "mono") {
      return theme === "dark" ? CARTO_DARK_TILE_URL : CARTO_LIGHT_TILE_URL;
    }
    return SATELLITE_TILE_URL;
  }, [renderStyle, theme]);

  // Override the globe sphere's material in outline mode. We have to wait one
  // tick after the new globeImageUrl propagates so we can dispose the texture
  // three.js just loaded — otherwise the earth bitmap keeps showing through.
  // Outline mode also needs an emissive override so the night side of the
  // sphere doesn't render dark (MeshPhongMaterial without a texture only shows
  // diffuse where the directional light hits it).
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const id = setTimeout(() => {
      const mat = globeRef.current?.globeMaterial?.();
      if (!mat) return;
      if (style.globeColor) {
        if (mat.map) {
          mat.map.dispose?.();
          mat.map = null;
        }
        mat.color?.set?.(style.globeColor);
        mat.emissive?.set?.(style.globeColor);
        if ("emissiveIntensity" in mat) mat.emissiveIntensity = 1;
      } else {
        mat.color?.set?.("#ffffff");
        mat.emissive?.set?.("#000000");
        if ("emissiveIntensity" in mat) mat.emissiveIntensity = 0;
      }
      mat.needsUpdate = true;
    }, 60);
    return () => clearTimeout(id);
  }, [isLoaded, style.globeColor, style.globe]);

  const polygonsData = useMemo(
    () => (renderStyle === "outline" ? (countries as any).features : []),
    [renderStyle]
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
        globeImageUrl={style.globe}
        globeTileEngineUrl={useTiles ? tileUrl : undefined}
        bumpImageUrl={renderStyle === "texture" ? BUMP_IMAGE : undefined}
        backgroundImageUrl={style.bg}
        showAtmosphere={true}
        atmosphereColor={style.atmosphere}
        atmosphereAltitude={0.18}
        // Country outlines (only populated in outline mode)
        polygonsData={polygonsData}
        polygonGeoJsonGeometry={(d: any) => d.geometry}
        polygonAltitude={0.001}
        polygonCapColor={() => style.countryFill || "rgba(0,0,0,0)"}
        polygonSideColor={() => "rgba(0,0,0,0)"}
        polygonStrokeColor={() => style.countryStroke || "rgba(0,0,0,0)"}
        polygonsTransitionDuration={0}
        // Paths (cable routes)
        pathsData={pathsData}
        pathPoints="coords"
        pathPointLat={(p: any) => p[0]}
        pathPointLng={(p: any) => p[1]}
        pathPointAlt={() => 0.003}
        pathColor={getPathColor as any}
        pathStroke={getPathStroke as any}
        pathDashLength={getDashLength as any}
        pathDashGap={getDashGap as any}
        pathDashAnimateTime={getDashAnimateTime as any}
        pathLabel={renderPathLabel}
        onPathClick={handlePathClick as any}
        // Points (landing stations)
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={getPointColor as any}
        pointAltitude={getPointAltitude as any}
        pointRadius={scaleByZoom(0.55, 0.03)}
        pointLabel={renderPointLabel}
        onPointClick={handleGlobePointClick}
        // Labels
        labelsData={pointsData}
        labelLat="lat"
        labelLng="lng"
        labelText="city"
        labelSize={piecewiseByZoom([
          [4.0, 0.9],
          [1.5, 0.45],
          [0.35, 0.18],
          [0.05, 0.06],
        ])}
        labelColor={labelColorFn}
        labelDotRadius={piecewiseByZoom([
          [4.0, 0.22],
          [1.5, 0.12],
          [0.35, 0.05],
          [0.05, 0.02],
        ])}
        labelAltitude={0.005}
        labelResolution={2}
        labelIncludeDot={true}
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

      {/* Bottom-right controls */}
      <div className="absolute bottom-6 right-[400px] z-10 flex items-center gap-2">
        {/* Auto-rotate toggle */}
        <button
          onClick={() => setAutoRotate(!autoRotate)}
          className="flex items-center gap-2 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg text-left active:bg-white/5 transition-colors min-h-[48px]"
        >
          <div
            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${autoRotate ? "bg-[#2362DD]/40" : "bg-[#1A1F35]"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${autoRotate ? "left-5 bg-[#60A5FA]" : "left-0.5 bg-[#475569]"}`}
            />
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8]">
            ROTATE
          </span>
        </button>

        {/* Style cycle: TEXTURE -> OUTLINE -> MONO */}
        <button
          onClick={() => setRenderStyle(nextStyle(renderStyle))}
          className="flex items-center gap-2 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg text-left active:bg-white/5 transition-colors min-h-[48px]"
        >
          <span className="text-[11px] font-semibold tracking-wider text-[#60A5FA]">
            STYLE
          </span>
          <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8]">
            {RENDER_STYLE_LABEL[renderStyle]}
          </span>
        </button>

        {/* Theme toggle (dark vs light) */}
        <button
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="flex items-center gap-2 px-4 py-3 bg-[#0A0E1A]/90 backdrop-blur-xl border border-[#2362DD]/20 rounded-lg text-left active:bg-white/5 transition-colors min-h-[48px]"
        >
          <div
            className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === "dark" ? "bg-[#1A1F35]" : "bg-[#2362DD]/40"}`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${theme === "dark" ? "left-0.5 bg-[#60A5FA]" : "left-5 bg-[#FFD700]"}`}
            />
          </div>
          <span className="text-[11px] font-semibold tracking-wider text-[#94A3B8]">
            {theme === "dark" ? "DARK" : "LIGHT"}
          </span>
        </button>
      </div>

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
