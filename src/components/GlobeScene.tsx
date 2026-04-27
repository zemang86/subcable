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
import robotoMedium from "@/data/roboto-medium.typeface.json";
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
    globeColor: "#EDE9DE", // cream sea — soft mono backdrop
    countryStroke: "rgba(40, 50, 70, 0.85)", // charcoal hairline
    countryFill: "#FAFAF6", // off-white land
  },
  "mono-dark": {
    globe: BLANK_PIXEL,
    bg: "/textures/night-sky.webp",
    atmosphere: "#2362DD",
    globeColor: "#1a1a1a",
    countryStroke: "rgba(220, 230, 250, 0.55)", // hairline overlay on dark tiles
    countryFill: undefined,
  },
  "mono-light": {
    globe: BLANK_PIXEL,
    bg: "/textures/night-sky.webp",
    atmosphere: "#cfe6ff",
    globeColor: "#fafaf8",
    countryStroke: "rgba(30, 40, 70, 0.55)", // hairline overlay on light tiles
    countryFill: undefined,
  },
} as const;
const BUMP_IMAGE = "/textures/earth-topology.png";

// XYZ tile servers
const SATELLITE_TILE_URL = (x: number, y: number, level: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/${level}/${y}/${x}`;

// CARTO basemaps (monochrome, free for non-commercial w/ attribution).
// Subdomain rotation a/b/c/d to spread requests across CDN edges.
// Use the `_nolabels` variants — we draw our own city/cable labels on top, and
// dropping CARTO's baked glyphs halves PNG size and skips a render pass.
const cartoSub = (z: number) => "abcd"[(z * 7) % 4];
const CARTO_LIGHT_TILE_URL = (x: number, y: number, level: number) =>
  `https://${cartoSub(x + y)}.basemaps.cartocdn.com/light_nolabels/${level}/${x}/${y}.png`;
const CARTO_DARK_TILE_URL = (x: number, y: number, level: number) =>
  `https://${cartoSub(x + y)}.basemaps.cartocdn.com/dark_nolabels/${level}/${x}/${y}.png`;

const TILE_ZOOM_THRESHOLD = 1.0; // altitude below this enables satellite tiles

const TOOLTIP_STYLE =
  "padding:6px 10px;background:rgba(6,1,58,0.92);border:1px solid rgba(24,0,231,0.5);border-radius:4px;color:#FFFFFF;font-size:12px;font-family:'HK Grotesk Wide','Hanken Grotesk',system-ui,sans-serif;font-weight:700;letter-spacing:0.04em;";
const renderPathLabel = (path: any) =>
  `<div style="${TOOLTIP_STYLE}">${path.name}</div>`;
const renderPointLabel = (p: any) =>
  `<div style="${TOOLTIP_STYLE}">${p.city}, ${p.country}</div>`;

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
  const [theme, setTheme] = useState<Theme>("light");
  const [renderStyle, setRenderStyle] = useState<RenderStyle>("mono");
  const style = STYLES[styleKey(renderStyle, theme)];
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(2.2);
  const [autoRotate, setAutoRotate] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

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

  // Greedy cluster: any landing points within CLUSTER_KM of an existing cluster
  // centroid get merged. Avoids stacked dots/labels for near-duplicate sites
  // (Sedili CLS1+CLS2, Bayan Baru/Pulau Jerejak, Katong/East Coast, etc.).
  const CLUSTER_KM = 6;
  const pointClusters = useMemo(() => {
    const haversine = (
      a: { lat: number; lng: number },
      b: { lat: number; lng: number }
    ) => {
      const R = 6371;
      const dLat = ((b.lat - a.lat) * Math.PI) / 180;
      const dLng = ((b.lng - a.lng) * Math.PI) / 180;
      const la1 = (a.lat * Math.PI) / 180;
      const la2 = (b.lat * Math.PI) / 180;
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };
    type Cluster = {
      lat: number;
      lng: number;
      members: typeof landingPoints;
    };
    const result: Cluster[] = [];
    for (const p of landingPoints) {
      const c = result.find((c) => haversine(c, p) < CLUSTER_KM);
      if (c) {
        c.members.push(p);
        c.lat = c.members.reduce((s, m) => s + m.lat, 0) / c.members.length;
        c.lng = c.members.reduce((s, m) => s + m.lng, 0) / c.members.length;
      } else {
        result.push({ lat: p.lat, lng: p.lng, members: [p] });
      }
    }
    return result;
  }, []);

  // Switch between clustered (far/mid zoom) and individual (close zoom) points.
  // Close enough that the two dots no longer overlap visually -> show both.
  const useClusters = zoomLevel > 0.18;

  // Prepare points data for globe — either cluster reps or raw points.
  const pointsData = useMemo(() => {
    if (!useClusters) {
      return landingPoints.map((p) => ({
        ...p,
        memberIds: [p.id],
        size: 0.4,
        color: TM_COLORS.landingPointDefault,
      }));
    }
    return pointClusters.map((c) => {
      const ids = c.members.map((m) => m.id);
      const cities = Array.from(new Set(c.members.map((m) => m.city)));
      const cableIds = Array.from(
        new Set(c.members.flatMap((m) => m.cableIds))
      );
      return {
        id: ids.join("+"),
        name: c.members[0].name,
        city: cities.join(" / "),
        country: c.members[0].country,
        region: c.members[0].region,
        lat: c.lat,
        lng: c.lng,
        cableIds,
        memberIds: ids,
        size: 0.4,
        color: TM_COLORS.landingPointDefault,
      };
    });
  }, [useClusters, pointClusters]);

  // Country labels — derived once from countries.json. We pick the largest
  // polygon per feature (so MultiPolygon countries label on their main body,
  // not a stray island), then use its outer-ring bbox centre. Tiny countries
  // are filtered out to keep the globe uncluttered at far zoom.
  const countryLabels = useMemo(() => {
    const out: { lat: number; lng: number; name: string; area: number }[] = [];
    const ringArea = (ring: number[][]) => {
      let a = 0;
      for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
        a += (ring[j][0] + ring[i][0]) * (ring[j][1] - ring[i][1]);
      }
      return Math.abs(a) / 2;
    };
    const ringCentre = (ring: number[][]) => {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      for (const [x, y] of ring) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
      return [(minX + maxX) / 2, (minY + maxY) / 2];
    };
    for (const f of (countries as any).features) {
      const g = f.geometry;
      if (!g) continue;
      const polys =
        g.type === "Polygon"
          ? [g.coordinates]
          : g.type === "MultiPolygon"
            ? g.coordinates
            : [];
      let bestRing: number[][] | null = null;
      let bestArea = 0;
      for (const poly of polys) {
        const outer = poly[0];
        if (!outer || outer.length < 3) continue;
        const a = ringArea(outer);
        if (a > bestArea) {
          bestArea = a;
          bestRing = outer;
        }
      }
      if (!bestRing || bestArea < 4) continue; // skip tiny countries (~degrees²)
      const [lng, lat] = ringCentre(bestRing);
      out.push({
        lat,
        lng,
        name: (f.properties?.name || "").toUpperCase(),
        area: bestArea,
      });
    }
    return out;
  }, []);

  // Combined labels feed: cities (landing points) + country names. We branch
  // accessors on the `kind` field so each type gets its own size/color/dot.
  const allLabels = useMemo(() => {
    const cities = pointsData.map((p) => ({ ...p, kind: "city" as const }));
    const countriesL = countryLabels.map((c) => ({
      ...c,
      kind: "country" as const,
    }));
    return [...countriesL, ...cities];
  }, [pointsData, countryLabels]);

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

  // Path color: dots render brighter than the underlying line. On a light
  // canvas, muted lines/dots need a dark stroke or they vanish into the basemap.
  const isLightCanvas = theme === "light";
  const mutedCableColor = isLightCanvas
    ? "rgba(30, 40, 60, 0.35)"
    : TM_COLORS.cableMuted;
  const dotColor = isLightCanvas ? "#0B1A3A" : "#FFFFFF";
  const getPathColor = useCallback(
    (path: PathData) => {
      const isSel = selectedCable && path.cableId === selectedCable.id;
      const isMuted = selectedCable && !isSel;
      if (path.kind === "dot") {
        if (isMuted) return "rgba(0,0,0,0)"; // hide muted dots
        return dotColor;
      }
      if (isMuted) return mutedCableColor;
      return path.color;
    },
    [selectedCable, dotColor, mutedCableColor]
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

  // Point color based on selection state. Cluster points highlight when ANY
  // member id is in the selected set.
  const mutedPointColor = isLightCanvas
    ? "rgba(30, 40, 60, 0.35)"
    : "rgba(100, 100, 100, 0.3)";
  const isPointSelected = useCallback(
    (point: any) => {
      if (!selectedLPSet) return false;
      const ids: string[] = point.memberIds || [point.id];
      return ids.some((id) => selectedLPSet.has(id));
    },
    [selectedLPSet]
  );
  const getPointColor = useCallback(
    (point: any) => {
      if (!selectedLPSet) return TM_COLORS.landingPointDefault;
      if (isPointSelected(point)) return TM_COLORS.cableHighlight;
      return mutedPointColor;
    },
    [selectedLPSet, isPointSelected, mutedPointColor]
  );

  // Flatten dots onto the globe surface (no cylinder height) so they read as
  // pinned markers, not floating poles.
  const getPointAltitude = useCallback(() => 0.001, []);

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

  // Country polygons render in both outline mode (with fill) and mono mode
  // (stroke-only overlay on top of CARTO tiles for crisp vector edges).
  const polygonsData = useMemo(
    () =>
      renderStyle === "outline" || renderStyle === "mono"
        ? (countries as any).features
        : [],
    [renderStyle]
  );

  return (
    <div
      className="relative w-full h-screen overflow-hidden bg-[#06013A]"
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
        showAtmosphere={renderStyle !== "mono"}
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
        pointRadius={piecewiseByZoom([
          [4.0, 0],
          [1.2, 0],
          [0.8, 0.18],
          [0.35, 0.06],
          [0.05, 0.025],
        ])}
        pointLabel={renderPointLabel}
        onPointClick={handleGlobePointClick}
        // Labels — combined feed (countries + cities), accessors branch on kind
        labelsData={allLabels}
        labelLat="lat"
        labelLng="lng"
        labelText={(l: any) => (l.kind === "country" ? l.name : l.city)}
        labelColor={(l: any) => {
          if (l.kind === "country") {
            return isLightCanvas
              ? "rgba(60, 70, 95, 0.65)"
              : "rgba(180, 200, 230, 0.55)";
          }
          return isLightCanvas
            ? "rgba(15, 23, 42, 0.9)"
            : "rgba(226, 232, 240, 0.85)";
        }}
        labelSize={(l: any) => {
          if (l.kind === "country") {
            return piecewiseByZoom([
              [4.0, 0.85],
              [1.5, 0.5],
              [0.35, 0.22],
              [0.05, 0.13],
            ]);
          }
          // City labels hidden at far zoom; fade in past alt 1.2. Sizes kept
          // small at close zoom so adjacent landing points don't collide.
          // Extra breakpoint at alt 0.02 for very-close zoom (single station
          // detail view) where labels need to be tiny.
          return piecewiseByZoom([
            [4.0, 0],
            [1.2, 0],
            [0.8, 0.27],
            [0.35, 0.13],
            [0.1, 0.06],
            [0.02, 0.02],
          ]);
        }}
        labelDotRadius={(l: any) => {
          if (l.kind === "country") return 0;
          return piecewiseByZoom([
            [4.0, 0],
            [1.2, 0],
            [0.8, 0.07],
            [0.35, 0.035],
            [0.1, 0.015],
            [0.02, 0.005],
          ]);
        }}
        labelAltitude={0.005}
        labelResolution={renderStyle === "mono" ? 1 : 2}
        labelTypeFace={robotoMedium as any}
        labelIncludeDot={(l: any) => l.kind !== "country"}
        // Events
        onGlobeReady={handleGlobeReady}
        animateIn={true}
      />

      <Header />

      {/* Altitude readout — tucked under the header, off to the right of the
          title block. Sidebar is 380px wide so we offset accordingly. */}
      <div className="absolute top-[88px] right-[400px] z-10 pointer-events-none">
        <div className="flex items-center gap-3 px-3 py-1.5 bg-[#06013A]/85 backdrop-blur-md border border-[#1800E7]/40 rounded">
          <span className="font-display text-[9px] font-bold tracking-[0.2em] text-[#A8B0D6] uppercase">
            Altitude
          </span>
          <span className="font-display text-[11px] font-bold text-white tabular-nums">
            {zoomLevel.toFixed(2)}
          </span>
          <div className="relative w-24 h-1 bg-white/10 rounded overflow-hidden">
            <div
              className="absolute top-0 left-0 h-full bg-[#FF5E00]"
              style={{
                // Visible camera range is roughly 0.02 (close) → 4.0 (far).
                // Bar fills from left = far out, right = close in.
                width: `${Math.max(2, Math.min(100, (1 - Math.log(Math.max(0.02, zoomLevel) / 0.02) / Math.log(4 / 0.02)) * 100))}%`,
              }}
            />
          </div>
        </div>
      </div>

      <Sidebar
        selectedCable={selectedCable}
        onSelectCable={handleSelectCable}
        onPointClick={handlePointClick}
      />

      {/* Bottom-right settings toggle */}
      <div className="absolute bottom-6 right-[400px] z-10">
        <button
          onClick={() => setSettingsOpen((v) => !v)}
          aria-label="Display settings"
          className="flex items-center justify-center w-12 h-12 bg-[#06013A]/90 backdrop-blur-xl border border-[#1800E7]/40 rounded-lg text-[#A8B0D6] active:bg-white/5 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="w-5 h-5"
          >
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33h.01a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82v.01a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          </svg>
        </button>

        {settingsOpen && (
          <div className="absolute bottom-14 right-0 flex flex-col gap-2 p-3 bg-[#06013A]/95 backdrop-blur-xl border border-[#1800E7]/40 rounded-lg min-w-[200px]">
            <div className="font-display text-[10px] text-white font-bold tracking-[0.2em] mb-1 uppercase">
              Display
            </div>

            <button
              onClick={() => setAutoRotate(!autoRotate)}
              className="flex items-center gap-2 px-3 py-2 bg-[#06013A]/60 border border-[#1800E7]/30 rounded-md text-left active:bg-white/5 transition-colors min-h-[44px]"
            >
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${autoRotate ? "bg-[#1800E7]" : "bg-[#0B0750]"}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${autoRotate ? "left-5 bg-white" : "left-0.5 bg-[#A8B0D6]"}`}
                />
              </div>
              <span className="font-display text-[11px] font-bold tracking-wider text-[#A8B0D6]">
                ROTATE
              </span>
            </button>

            <button
              onClick={() => setRenderStyle(nextStyle(renderStyle))}
              className="flex items-center justify-between gap-2 px-3 py-2 bg-[#06013A]/60 border border-[#1800E7]/30 rounded-md text-left active:bg-white/5 transition-colors min-h-[44px]"
            >
              <span className="font-display text-[11px] font-bold tracking-wider text-white">
                STYLE
              </span>
              <span className="font-display text-[11px] font-bold tracking-wider text-[#FF7A00]">
                {RENDER_STYLE_LABEL[renderStyle]}
              </span>
            </button>

            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="flex items-center gap-2 px-3 py-2 bg-[#06013A]/60 border border-[#1800E7]/30 rounded-md text-left active:bg-white/5 transition-colors min-h-[44px]"
            >
              <div
                className={`w-10 h-5 rounded-full relative transition-colors duration-300 ${theme === "dark" ? "bg-[#0B0750]" : "bg-[#1800E7]"}`}
              >
                <div
                  className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-300 ${theme === "dark" ? "left-0.5 bg-[#A8B0D6]" : "left-5 bg-[#FF5E00]"}`}
                />
              </div>
              <span className="font-display text-[11px] font-bold tracking-wider text-[#A8B0D6]">
                {theme === "dark" ? "DARK" : "LIGHT"}
              </span>
            </button>
          </div>
        )}
      </div>

      {/* Controls overlay */}
      <div className="absolute bottom-6 left-6 z-10 px-4 py-3 bg-[#06013A]/90 backdrop-blur-xl border border-[#1800E7]/40 rounded-lg pointer-events-none">
        <div className="font-display text-[10px] text-white font-bold tracking-[0.2em] mb-2 uppercase">
          Controls
        </div>
        <div className="space-y-1 text-[11px] text-[#A8B0D6] font-medium">
          <div>DRAG &mdash; Rotate globe</div>
          <div>PINCH &mdash; Zoom in/out</div>
          <div>TAP &mdash; Select cable/point</div>
        </div>
      </div>
    </div>
  );
}
