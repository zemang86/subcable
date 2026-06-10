"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import Globe from "./GlobeWrapper";
import Sidebar from "./Sidebar";
import SystemButtons from "./SystemButtons";
import LoadingScreen from "./LoadingScreen";
import SplashScreen from "./SplashScreen";
import CableInformation from "./CableInformation";
import GeneralInformation from "./GeneralInformation";
import { Header } from "./Header";
import { LanguageToggle } from "./LanguageToggle";
import { RecenterButton } from "./RecenterButton";
import { RightCluster } from "./RightCluster";
import { ClusterStem } from "./ClusterStem";
import { LandingPointCallout } from "./LandingPointCallout";
import { UnderwaterOverlay } from "./UnderwaterOverlay";
import HowToGuideDialog from "./HowToGuideDialog";
import FunFactDialog from "./FunFactDialog";
import MorseCodePop from "./MorseCodePop";

import { cables, cablesById } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import { cableRoutes } from "@/data/cableRoutes";
import countries from "@/data/countries.json";
import robotoMedium from "@/data/roboto-medium.typeface.json";

import type {
  CableSystem,
  DialogId,
  Language,
  LandingPoint,
} from "@/lib/types";
import { V1_COLORS, CABLE_COLORS } from "@/lib/colors";
import {
  resolveNetworkRoute,
  type ResolvedNetworkRoute,
} from "@/lib/callRoutes";
import {
  playConnect,
  playDialing,
  playMessage,
  setMuted as setAudioMuted,
  stopAll as stopAllAudio,
} from "@/lib/morseAudio";
import { useIdleAttractor } from "@/lib/useIdleAttractor";
import { useT } from "@/lib/i18n";
import { attachCableFlow, type CableFlowState } from "@/lib/cableFlow";

// ───────── Tuning ─────────

// Quantized zoom buckets — three-globe rebuilds TextGeometry whenever
// labelSize / labelDotRadius returns a new value. A continuous scalar from
// piecewiseByZoom triggers ~163 dispose+tessellate-glyph-paths per zoom tick →
// catastrophic stutter. Buckets cap rebuilds at one per threshold crossing.
type ZoomBucket = 0 | 1 | 2 | 3 | 4 | 5;
const bucketForAltitude = (alt: number): ZoomBucket => {
  if (alt >= 1.5) return 0;
  if (alt >= 1.2) return 1;
  if (alt >= 0.35) return 2;
  if (alt >= 0.1) return 3;
  if (alt >= 0.02) return 4;
  return 5;
};
const POINT_RADIUS_BY_BUCKET = [0, 0, 0.06, 0.04, 0.025, 0.025] as const;
// Cable glow width multiplier per zoom bucket (0 = far, 5 = closest). Bucketed
// rather than computed from raw altitude so the path-stroke accessor only
// changes identity on a bucket crossing — avoids re-tessellating every path on
// each zoom poll. Grows as you zoom in so the neon glow keeps constant visual
// thickness instead of appearing to shrink.
const GLOW_SCALE_BY_BUCKET = [1.0, 1.3, 1.7, 2.1, 2.4, 2.6] as const;
// Horizontal placement of the globe's centre as a fraction of viewport width.
// 0.5 = dead-centre; we push it left so the sphere sits between the left edge
// and the Cable System panel, leaving room on the right for the panels.
// The canvas is translated by this offset and the callout/label projections
// add the same offset so they stay locked to the sphere.
const GLOBE_CENTER_FRAC = 0.4;
const globeOffsetX = (width: number) => (GLOBE_CENTER_FRAC - 0.5) * width;
// The translate above would drag the canvas edge into view and expose a bare
// strip of page background (right edge when offset, left edge when idle slides
// back to centre). So the canvas is oversized by the offset amount on BOTH
// sides and statically shifted left by one bleed — its edges stay off-screen
// at every point of the idle⇄active slide, and the globe lands on exactly the
// same screen position as before. Projections map canvas→viewport with
// `globeProjectionOffsetX`.
const GLOBE_BLEED_FRAC = Math.abs(GLOBE_CENTER_FRAC - 0.5);
const globeBleedX = (width: number) => GLOBE_BLEED_FRAC * width;
const globeCanvasWidth = (width: number) =>
  width + 2 * globeBleedX(width);
// canvasX → viewportX for the non-idle pose (static -bleed shift + offset
// translate). Takes the CANVAS width since projection code reads the renderer
// DOM element (always current), not the React dimensions state (stale-closure
// prone inside long-lived rAF loops).
const globeProjectionOffsetX = (canvasWidth: number) => {
  const viewportWidth = canvasWidth / (1 + 2 * GLOBE_BLEED_FRAC);
  return globeOffsetX(viewportWidth) - globeBleedX(viewportWidth);
};

// City labels: one threshold instead of buckets. Above it cities vanish.
// Below, geometry is built once and a per-frame scaler handles fade-in + a
// sqrt shrink with altitude (keeps labels visible at very close zoom).
const CITY_LABEL_BASE_SIZE = 0.13;
const CITY_VISIBLE_ALT = 0.314;
const CITY_FADE_BAND = 0.05;
const CITY_REF_ALT = CITY_VISIBLE_ALT - CITY_FADE_BAND;
const CITY_MIN_SCALE = 0.18;
const cityScaleAt = (alt: number): number => {
  if (alt >= CITY_VISIBLE_ALT) return 0;
  const fade = Math.min(1, (CITY_VISIBLE_ALT - alt) / CITY_FADE_BAND);
  const shrink = Math.max(
    CITY_MIN_SCALE,
    Math.sqrt(Math.max(0, alt) / CITY_REF_ALT),
  );
  return fade * shrink;
};

// Country labels: mirror of the city pattern, but inverted. Fade OUT as you
// zoom in past a threshold; visible above with sqrt shrink so big country
// names don't dominate at mid-zoom.
const COUNTRY_LABEL_BASE_SIZE = 0.85;
const COUNTRY_HIDDEN_ALT = 0.2;
const COUNTRY_FADE_BAND = 0.1;
const COUNTRY_REF_ALT = 1.5;
const countryScaleAt = (alt: number): number => {
  if (alt <= COUNTRY_HIDDEN_ALT) return 0;
  const fade = Math.min(1, (alt - COUNTRY_HIDDEN_ALT) / COUNTRY_FADE_BAND);
  const shrink = Math.min(1, Math.sqrt(alt / COUNTRY_REF_ALT));
  return fade * shrink;
};

// ───────── Static assets ─────────

// Pre-baked equirectangular dark world map (sea + land + country strokes).
// Generated by scripts/generate-world-map.mjs. Replaces tile streaming so the
// kiosk works fully offline. Light variant + outline-mode + texture-mode all
// removed in v1.0 (resolution §H.11 = dark only, §H.1 = re-skin).
const WORLD_MAP_DARK_URL = "/textures/world-mono-dark.webp";

// Regional sharpness overlay — 4K bake over the SEA window (~1.2 km/texel vs
// ~5 km for the global). One grid-mesh draw call, fades in at close zoom.
const SEA_OVERLAY_DARK_URL = "/textures/world-mono-dark-sea.webp";

// Starfield behind the globe (globe.gl background sphere). Baked by
// scripts/generate-starfield.mjs on the same #040E1F as the canvas so the
// stars sit seamlessly on the dark background.
const STARFIELD_URL = "/textures/starfield.webp";
const SEA_LAT_MIN = -15;
const SEA_LAT_MAX = 25;
const SEA_LNG_MIN = 90;
const SEA_LNG_MAX = 130;
const SEA_GRID = 32;
const SEA_OVERLAY_ALT = 0.0008;
const SEA_FADE_IN_ALT = 0.6;
const SEA_FADE_OUT_ALT = 0.3;

// ───────── v1.0 palette → globe constants ─────────

const ATMOSPHERE_COLOR = V1_COLORS.atmosphere;          // #034DA1 v1-blue
const CABLE_SELECTED_COLOR = V1_COLORS.cableSelected;   // #ED1B2E
const CABLE_MUTED_COLOR = V1_COLORS.cableMuted;         // rgba(255,255,255,0.30)
// Neon glow (both default + selected): one saturated colour ring hugging the
// white-hot core.
const CABLE_HALO_DEFAULT_OUTER_ALPHA = 0.15; // saturated colour glow around core


const hexToRgb = (hex: string): [number, number, number] => {
  const h = hex.replace("#", "");
  const full =
    h.length === 3
      ? h.split("").map((c) => c + c).join("")
      : h;
  return [
    parseInt(full.slice(0, 2), 16),
    parseInt(full.slice(2, 4), 16),
    parseInt(full.slice(4, 6), 16),
  ];
};
const hexToRgba = (hex: string, alpha: number) => {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};
// Neon "hot filament" core — push the identity colour most of the way to white
// so the centre of the line reads as a bright lit core (lightsaber style),
// leaving the saturated colour to live in the surrounding glow.
const neonCore = (hex: string, toward = 0.72) => {
  const [r, g, b] = hexToRgb(hex);
  const mix = (c: number) => Math.round(c + (255 - c) * toward);
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`;
};
const LANDING_POINT_DEFAULT = V1_COLORS.fg;             // white
const LANDING_POINT_ACTIVE = V1_COLORS.active;          // #8FFF3F lime
const LANDING_POINT_MUTED = "rgba(120, 120, 120, 0.30)";

// Country highlight (Phase 2): when a cable is selected, the countries it lands
// in get a flat translucent light-grey fill — no border, no pattern. Sits just
// above the globe texture but below the cable lines so the cables stay on top.
const COUNTRY_FILL_CAP = "rgba(232, 236, 243, 0.20)";
const COUNTRY_FILL_SIDE = "rgba(232, 236, 243, 0.08)";
const COUNTRY_FILL_STROKE = "rgba(0, 0, 0, 0)"; // transparent — no outline
const COUNTRY_FILL_ALTITUDE = 0.002;
// landingPoint.country → countries.json properties.name, where they differ.
// (Réunion has no feature in this Natural Earth extract, so it stays unhighlighted
// rather than wrongly lighting up mainland France.)
const COUNTRY_NAME_ALIASES: Record<string, string> = {
  "United States": "United States of America",
};

// Default + Malaysia-recenter coordinates.
const DEFAULT_LAT = 5;
const DEFAULT_LNG = 108;
const DEFAULT_ALT = 2.2;
// Idle attract mode pulls the camera back so the globe sits smaller/further in
// the underwater scene (kept under MAX_CAM_DISTANCE's altitude ~3.4 cap).
const IDLE_ALT = 3.3;
const MY_LAT = 4.2105;
const MY_LNG = 101.9758;
const MY_ALT = 2.2;

// Cinematic arrival after the emerge: the camera flies in toward the Malaysia
// hero region, overshooting slightly closer than the resting view, then eases
// back out to settle — so it reads as "arriving at" the subject, not a dolly.
const ARRIVAL_OVERSHOOT_ALT = 1.92;
const ARRIVAL_MS = 1300;
const ARRIVAL_SETTLE_MS = 650;

// Zoom clamps. three-globe camera distance = 100 × (1 + altitude), so these
// bound the OrbitControls dolly: MAX caps zoom-out at ~altitude 3.4 (a touch
// past the default 2.2 view) so the globe never shrinks to a dot in the
// starfield; MIN floors zoom-in so the camera can't tunnel through the surface.
const MIN_CAM_DISTANCE = 108; // ~altitude 0.08 (close detail)
const MAX_CAM_DISTANCE = 440; // ~altitude 3.4

// NOTE: no pathLabel/pointLabel hover tooltips — they never fire on the
// touch kiosk (no hover), and with tap forgiveness every tap already lands
// on the full info (cable panel / landing-point card) in one step.

interface PathData {
  coords: [number, number][];
  cableId: string;
  name: string;
  color: string;
  status: CableSystem["status"];
  // Neon glow ring index: undefined = white-hot core line,
  // 2 = saturated colour glow hugging the core.
  _halo?: 2;
}

export default function GlobeScene() {
  const globeRef = useRef<any>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // ── Cancellable camera flights ──
  // globe.gl's pointOfView tweens can't be interrupted (the tween group isn't
  // exposed, and a 0-duration set doesn't kill an in-flight tween), so a long
  // programmatic move fights the user's drag for its whole duration. Instead,
  // every user-flow camera move goes through flyTo: our own rAF loop stepping
  // pointOfView(…, 0) frames with the same cubic in-out easing — and any
  // pointerdown cancels it instantly, handing control back to the finger.
  const flyRafRef = useRef<number | null>(null);
  // Timer for the second leg of the emerge arrival (overshoot → settle); owned
  // here so cancelling a flight also cancels its queued follow-up leg.
  const arrivalSettleRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelFly = useCallback(() => {
    if (flyRafRef.current !== null) {
      cancelAnimationFrame(flyRafRef.current);
      flyRafRef.current = null;
    }
    if (arrivalSettleRef.current) {
      clearTimeout(arrivalSettleRef.current);
      arrivalSettleRef.current = null;
    }
  }, []);
  const flyTo = useCallback(
    (
      target: { lat?: number; lng?: number; altitude?: number },
      ms: number,
    ) => {
      const g = globeRef.current;
      if (!g) return;
      cancelFly();
      const from = g.pointOfView?.();
      if (!from || ms <= 0) {
        g.pointOfView(target, 0);
        return;
      }
      const to = {
        lat: target.lat ?? from.lat,
        lng: target.lng ?? from.lng,
        altitude: target.altitude ?? from.altitude,
      };
      // Shortest way around for longitude (never rotate >180°).
      let dLng = to.lng - from.lng;
      while (dLng > 180) dLng -= 360;
      while (dLng < -180) dLng += 360;
      const startTs = performance.now();
      const ease = (t: number) =>
        t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
      const step = () => {
        const t = Math.min(1, (performance.now() - startTs) / ms);
        const e = ease(t);
        globeRef.current?.pointOfView(
          {
            lat: from.lat + (to.lat - from.lat) * e,
            lng: from.lng + dLng * e,
            altitude: from.altitude + (to.altitude - from.altitude) * e,
          },
          0,
        );
        if (t < 1) flyRafRef.current = requestAnimationFrame(step);
        else flyRafRef.current = null;
      };
      flyRafRef.current = requestAnimationFrame(step);
    },
    [cancelFly],
  );
  useEffect(() => cancelFly, [cancelFly]);
  // Intro splash: shown AFTER the loading screen finishes (isLoaded → true),
  // held ~3.5s then faded out to reveal the globe. Order: loading → splash →
  // globe. `splashFading` triggers the fade-out before unmount.
  const [showSplash, setShowSplash] = useState(true);
  const [splashFading, setSplashFading] = useState(false);
  // Keep the loading screen mounted under the splash until the splash has
  // fully faded in, so the #040E1F backdrop never breaks during the crossfade.
  const [hideLoading, setHideLoading] = useState(false);
  const [selectedCable, setSelectedCable] = useState<CableSystem | null>(null);
  const [selectedLandingPoint, setSelectedLandingPoint] =
    useState<LandingPoint | null>(null);
  /** Screen-space position of every landing point along the selected cable —
      keyed by point id. Used to position the per-point callouts. */
  const [calloutScreens, setCalloutScreens] = useState<
    Record<string, { x: number; y: number; visible: boolean }>
  >({});
  const [openDialog, setOpenDialog] = useState<DialogId>(null);
  const [expandedPointId, setExpandedPointId] = useState<string | null>(null);
  const [language, setLanguage] = useState<Language>("en");
  const [muted, setMuted] = useState(false);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [zoomLevel, setZoomLevel] = useState(DEFAULT_ALT);
  const [autoRotate, setAutoRotate] = useState(false);
  const [activeCall, setActiveCall] = useState<{
    message: string;
    route: ResolvedNetworkRoute;
    startedAt: number;
  } | null>(null);

  // Idle attractor (§H.12): after ~60s of no interaction, slow auto-rotate
  // kicks in and a "TAP ANYWHERE TO BEGIN" hint appears. Any touch dismisses.
  // Suspended while a call animation runs — watching IS engagement (long
  // routes travel >60s with zero touches; without this the kiosk submerged
  // mid-call and the idle zoom-out fought the call's camera follow). The
  // timer re-arms fresh when the call ends.
  const { isIdle, warnSecondsLeft } = useIdleAttractor(
    60_000,
    undefined,
    activeCall !== null,
  );
  const t = useT(language);

  // Transient hint shown when a dimmed cluster button (Morse / Fun Fact) is
  // tapped without a cable selected — both are scoped to a single cable
  // system. Tracks which button so the toast anchors beside it.
  const [hintFor, setHintFor] = useState<"morse" | "funfact" | null>(null);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashClusterHint = useCallback((id: "morse" | "funfact") => {
    setHintFor(id);
    if (hintTimer.current) clearTimeout(hintTimer.current);
    hintTimer.current = setTimeout(() => setHintFor(null), 3000);
  }, []);
  useEffect(
    () => () => {
      if (hintTimer.current) clearTimeout(hintTimer.current);
    },
    [],
  );

  // Push mute state down to morseAudio so playDot/playMessage/etc no-op.
  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  // Idle → enable auto-rotate and close any open dialog so the attractor
  // doesn't end up rendered behind a modal nobody is around to dismiss.
  useEffect(() => {
    if (isIdle) {
      // Cancel any in-flight camera move + pending arrival-settle so neither
      // fights the idle zoom-out.
      cancelFly();
      setAutoRotate(true);
      setOpenDialog(null);
      setSelectedCable(null);
      setSelectedLandingPoint(null);
      setExpandedPointId(null);
      // If idle re-triggers mid-emerge, drop any lingering branding card so it
      // doesn't hang over the underwater scene.
      setBrandingOn(false);
      setBrandingLeaving(false);
    } else {
      setAutoRotate(false);
    }
  }, [isIdle, cancelFly]);

  // Dolly the camera back when idle (globe sits smaller/further in the scene).
  // The zoom back IN is deliberately deferred to AFTER the emerge — see the
  // surfacing effect — so the globe surfaces at its far size, then zooms in.
  // Only altitude is passed so the current lat/lng (idle rotation) is kept.
  useEffect(() => {
    if (!globeRef.current || !isLoaded) return;
    if (isIdle) flyTo({ altitude: IDLE_ALT }, 1200);
  }, [isIdle, isLoaded, flyTo]);

  // Underwater attract mode: while idle the globe sits under a "submerged"
  // overlay; on wake it plays the "rising out of the water" beat (the waterline
  // recedes top-down) before the chrome is revealed. `surfacing` is that
  // transient phase — must match the .v1-uw-recede duration in globals.css.
  const SURFACE_MS = 1150;
  const [surfacing, setSurfacing] = useState(false);
  // Branding card ("Submarine Cable Map / by TM") surfaces mid-emerge, holds
  // through the camera fly-in, then bows out — and ONLY once it's fully gone do
  // the panels/HUD slide in (gated by `chromeReady`). `brandingOn` mounts the
  // card; `brandingLeaving` triggers its fade-out (it unmounts when done).
  const [brandingOn, setBrandingOn] = useState(false);
  const [brandingLeaving, setBrandingLeaving] = useState(false);
  // Chrome (panels + HUD) is held back during the whole emerge + branding beat
  // on a wake-from-idle, then revealed. Defaults true so the very first load
  // (no emerge) shows chrome immediately.
  const [chromeReady, setChromeReady] = useState(true);
  const wasIdleRef = useRef(isIdle);
  useEffect(() => {
    if (wasIdleRef.current && !isIdle) {
      setSurfacing(true);
      setBrandingLeaving(false);
      setChromeReady(false); // hold the panels/HUD until the card is gone
      const idEnd = setTimeout(() => {
        setSurfacing(false);
        // Globe surfaces at its far size, THEN the camera flies in: sweep toward
        // the Malaysia hero region while zooming PAST the resting view (a slight
        // overshoot), then ease back out to settle — a cinematic arrival. Both
        // legs ride flyTo so a touch can take over at any point.
        if (globeRef.current) {
          flyTo(
            { lat: DEFAULT_LAT, lng: DEFAULT_LNG, altitude: ARRIVAL_OVERSHOOT_ALT },
            ARRIVAL_MS,
          );
          arrivalSettleRef.current = setTimeout(() => {
            flyTo(
              { lat: DEFAULT_LAT, lng: DEFAULT_LNG, altitude: DEFAULT_ALT },
              ARRIVAL_SETTLE_MS,
            );
          }, ARRIVAL_MS);
        }
      }, SURFACE_MS);
      // Fade the card in halfway through the emerge, hold through the fly-in,
      // then bow it out. Reveal the chrome only after its 700ms fade completes.
      const idIn = setTimeout(() => setBrandingOn(true), SURFACE_MS * 0.5);
      const idOut = setTimeout(() => setBrandingLeaving(true), SURFACE_MS + 2500);
      const idChrome = setTimeout(
        () => setChromeReady(true),
        SURFACE_MS + 2500 + 700,
      );
      wasIdleRef.current = isIdle;
      return () => {
        clearTimeout(idEnd);
        clearTimeout(idIn);
        clearTimeout(idOut);
        clearTimeout(idChrome);
      };
    }
    wasIdleRef.current = isIdle;
  }, [isIdle, flyTo]);

  // Resize handler
  useEffect(() => {
    const update = () =>
      setDimensions({ width: window.innerWidth, height: window.innerHeight });
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // Solid line per segment. The flowing-energy pulses are not extra objects —
  // they're a shader patch on these lines' materials (src/lib/cableFlow.ts).
  const pathsData: PathData[] = useMemo(() => {
    const out: PathData[] = [];
    for (const route of cableRoutes) {
      const cable = cablesById[route.cableId];
      const baseColor = CABLE_COLORS[route.cableId] || "#ffffff";
      const status = cable?.status ?? "active";
      const colorByStatus =
        status === "retired" || status === "inactive"
          ? V1_COLORS.mute // #C4C4C4 — dim grey, but glows like the rest
          : status === "planned"
            ? V1_COLORS.orange
            : baseColor;
      for (const seg of route.segments) {
        out.push({
          coords: seg.coords,
          cableId: route.cableId,
          name: cable?.shortName || route.cableId,
          color: colorByStatus,
          status,
        });
      }
    }
    return out;
  }, []);

  // Greedy cluster: any landing points within CLUSTER_KM of an existing
  // cluster centroid get merged. Avoids stacked dots/labels for near-duplicate
  // sites (Sedili CLS1+CLS2, Katong/East Coast, etc.).
  const CLUSTER_KM = 6;
  const pointClusters = useMemo(() => {
    const haversine = (
      a: { lat: number; lng: number },
      b: { lat: number; lng: number },
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
  const useClusters = zoomLevel > 0.18;

  const pointsData = useMemo(() => {
    if (!useClusters) {
      return landingPoints.map((p) => ({
        ...p,
        memberIds: [p.id],
        size: 0.4,
        color: LANDING_POINT_DEFAULT,
      }));
    }
    return pointClusters.map((c) => {
      const ids = c.members.map((m) => m.id);
      const cities = Array.from(new Set(c.members.map((m) => m.city)));
      const cableIds = Array.from(
        new Set(c.members.flatMap((m) => m.cableIds)),
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
        color: LANDING_POINT_DEFAULT,
      };
    });
  }, [useClusters, pointClusters]);

  // Country labels — pick the largest polygon per feature so MultiPolygon
  // countries label on their main body, not a stray island.
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
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;
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
      if (!bestRing || bestArea < 4) continue;
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

  // City labels are built from pointClusters directly (NOT pointsData) so
  // identity stays stable across the cluster flip at alt 0.18.
  const cityLabelsData = useMemo(
    () =>
      pointClusters.map((c) => {
        const ids = c.members.map((m) => m.id);
        const cities = Array.from(new Set(c.members.map((m) => m.city)));
        return {
          id: ids.join("+"),
          city: cities.join(" / "),
          country: c.members[0].country,
          lat: c.lat,
          lng: c.lng,
        };
      }),
    [pointClusters],
  );

  const allLabels = useMemo(() => {
    const cities = cityLabelsData.map((p) => ({ ...p, kind: "city" as const }));
    const countriesL = countryLabels.map((c) => ({
      ...c,
      kind: "country" as const,
    }));
    return [...countriesL, ...cities];
  }, [cityLabelsData, countryLabels]);

  // Splash timing: starts once the loading screen is done (isLoaded). Hold
  // ~2.9s, fade out over 600ms, unmount at 3.5s total → then the globe shows.
  useEffect(() => {
    if (!isLoaded) return;
    // Splash crossfades in over the loading screen (~600ms); once opaque,
    // drop the loading screen. Then hold and fade out → globe.
    const hide = setTimeout(() => setHideLoading(true), 700);
    const fade = setTimeout(() => setSplashFading(true), 2900);
    const done = setTimeout(() => setShowSplash(false), 3500);
    return () => {
      clearTimeout(hide);
      clearTimeout(fade);
      clearTimeout(done);
    };
  }, [isLoaded]);

  // Initial view + globe controls
  const handleGlobeReady = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: DEFAULT_LAT, lng: DEFAULT_LNG, altitude: DEFAULT_ALT },
        0,
      );
      const controls = globeRef.current.controls();
      if (controls) {
        controls.autoRotate = false;
        controls.autoRotateSpeed = 0.3;
        controls.enableDamping = true;
        controls.dampingFactor = 0.1;
        controls.enablePan = false;
        controls.touches = { ONE: 0, TWO: 2 };
        // Clamp the dolly so zoom-out stops before the globe gets tiny and
        // zoom-in can't punch through the surface.
        controls.minDistance = MIN_CAM_DISTANCE;
        controls.maxDistance = MAX_CAM_DISTANCE;
      }
    }
    // Hold the loading screen for a minimum of 3000ms even when textures are
    // cached, so the kiosk gets a clean intro frame (§H.9) and the loading-bar
    // sweep (3s, see LoadingScreen.FILL_MS) plays out in full.
    setTimeout(() => setIsLoaded(true), 3000);
  }, []);

  // Drive controls.autoRotate from the React state. The state itself is set
  // by the useIdleAttractor sync effect — pause-on-interaction is handled
  // implicitly because any touch wakes the attractor (isIdle → false).
  useEffect(() => {
    if (!globeRef.current) return;
    const controls = globeRef.current.controls();
    if (controls) controls.autoRotate = autoRotate;
  }, [autoRotate, isLoaded]);

  // Camera altitude polling — throttled so React re-renders don't blow up.
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    let rafId: number;
    let lastReported = -1;
    const poll = () => {
      const pov = globeRef.current?.pointOfView?.();
      if (pov && typeof pov.altitude === "number") {
        if (Math.abs(pov.altitude - lastReported) > 0.1) {
          lastReported = pov.altitude;
          setZoomLevel(pov.altitude);
        }
      }
      rafId = requestAnimationFrame(poll);
    };
    rafId = requestAnimationFrame(poll);
    return () => cancelAnimationFrame(rafId);
  }, [isLoaded]);

  const zoomBucket = useMemo(() => bucketForAltitude(zoomLevel), [zoomLevel]);

  // Cable selection — zoom-to-fit the selected cable's landing points.
  const handleSelectCable = useCallback((cable: CableSystem | null) => {
    setSelectedCable(cable);
    setSelectedLandingPoint(null);
    setExpandedPointId(null);
    if (cable && globeRef.current) {
      const points = landingPoints.filter((p) =>
        cable.landingPointIds.includes(p.id),
      );
      if (points.length === 0) return;
      // Unwrap longitudes around the first point so trans-Pacific systems
      // (AAG: Malaysia → Guam → Hawaii → US) average across the antimeridian
      // instead of cancelling out to the wrong side of the planet.
      const anchor = points[0].lng;
      const lngs = points.map((p) => {
        let lng = p.lng;
        while (lng - anchor > 180) lng -= 360;
        while (lng - anchor < -180) lng += 360;
        return lng;
      });
      const avgLat = points.reduce((s, p) => s + p.lat, 0) / points.length;
      const avgLng = lngs.reduce((s, lng) => s + lng, 0) / lngs.length;
      const latSpread =
        Math.max(...points.map((p) => p.lat)) -
        Math.min(...points.map((p) => p.lat));
      const lngSpread = Math.max(...lngs) - Math.min(...lngs);
      const spread = Math.max(latSpread, lngSpread);
      const altitude = Math.max(0.4, Math.min(2.8, spread / 18));
      flyTo({ lat: avgLat, lng: avgLng, altitude }, 1500);
    } else if (!cable && globeRef.current) {
      flyTo({ lat: DEFAULT_LAT, lng: DEFAULT_LNG, altitude: DEFAULT_ALT }, 1500);
    }
  }, [flyTo]);

  const handlePathClick = useCallback(
    (path: PathData) => {
      const cable = cablesById[path.cableId];
      if (cable) handleSelectCable(cable);
    },
    [handleSelectCable],
  );

  // Camera view captured when an info panel opens, so closing can glide back.
  const prevPovRef = useRef<{
    lat: number;
    lng: number;
    altitude: number;
  } | null>(null);

  // Close the expanded info panel and restore the globe to the view it had
  // when the panel was opened (the user may have rotated/zoomed while reading).
  // Also drop the selected point so the globe falls back to markers-only.
  const closeExpanded = useCallback(() => {
    const prev = prevPovRef.current;
    if (prev) {
      flyTo(prev, 700);
      prevPovRef.current = null;
    }
    setExpandedPointId(null);
    setSelectedLandingPoint(null);
  }, [flyTo]);

  // Back button — pops one navigation step:
  //  1. If a landing-point callout is open (location info showing) → close it,
  //     returning to the cable network view. Same as tapping the callout.
  //  2. Otherwise, if a cable is selected → deselect it (resets camera), which
  //     also hides the back button.
  const handleBack = useCallback(() => {
    if (expandedPointId !== null) {
      closeExpanded();
      setSelectedLandingPoint(null);
    } else if (selectedCable) {
      handleSelectCable(null);
    }
  }, [expandedPointId, selectedCable, handleSelectCable, closeExpanded]);

  // Expand a landing-point callout: snapshot the current view, then simply
  // rotate the point to the globe's centre (same altitude — no zoom). The panel
  // anchors above that point, so it ends up centred over the globe with the
  // marker at its bottom. closeExpanded glides back to the snapshot.
  const handleToggleExpand = useCallback(
    (p: LandingPoint) => {
      if (expandedPointId === p.id) {
        closeExpanded();
        return;
      }
      const pov = globeRef.current?.pointOfView?.();
      if (pov && !prevPovRef.current) {
        prevPovRef.current = {
          lat: pov.lat,
          lng: pov.lng,
          altitude: pov.altitude,
        };
      }
      const alt = pov?.altitude ?? DEFAULT_ALT;
      flyTo({ lat: p.lat, lng: p.lng, altitude: alt }, 700);
      setExpandedPointId(p.id);
    },
    [expandedPointId, closeExpanded, flyTo],
  );

  // Open a landing point's info directly (the expanded card), independent of
  // cable selection. No auto-selecting a cable. Shared by globe-dot taps and
  // reticle-marker taps.
  const openLandingPoint = useCallback(
    (lp: LandingPoint) => {
      setSelectedLandingPoint(lp);
      handleToggleExpand(lp);
    },
    [handleToggleExpand],
  );

  // Click on a globe marker dot → resolve the landing point and open its info.
  const handleGlobePointClick = useCallback(
    (point: any) => {
      const memberIds: string[] = point.memberIds || [point.id];
      const lp = landingPoints.find((p) => memberIds.includes(p.id));
      if (!lp) return;
      openLandingPoint(lp);
    },
    [openLandingPoint],
  );

  // ── Tap forgiveness ──
  // Globe dots are a few px and cable strokes thinner still, so a fingertip
  // that just misses raycasts through to the bare globe. onGlobeClick catches
  // that miss and retargets it: the nearest landing point within an
  // altitude-scaled reach (≈ a fingertip at any zoom), else the nearest cable
  // vertex within a tighter reach. Zooming in shrinks the reach, so precision
  // returns once targets are big enough to hit directly.
  const handleGlobeClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (isIdle || surfacing || activeCall) return;
      const alt = globeRef.current?.pointOfView?.()?.altitude ?? DEFAULT_ALT;
      const cosLat = Math.cos((lat * Math.PI) / 180);
      const distDeg = (aLat: number, aLng: number) => {
        const dLat = aLat - lat;
        let dLng = aLng - lng;
        while (dLng > 180) dLng -= 360;
        while (dLng < -180) dLng += 360;
        return Math.hypot(dLat, dLng * cosLat);
      };

      const pointReach = 1.6 * alt + 0.2; // alt 2.2 → ~3.7°, alt 0.5 → ~1°
      let bestPoint: (typeof pointsData)[number] | null = null;
      let bestPointD = Infinity;
      for (const p of pointsData) {
        const d = distDeg(p.lat, p.lng);
        if (d < bestPointD) {
          bestPointD = d;
          bestPoint = p;
        }
      }
      if (bestPoint && bestPointD <= pointReach) {
        handleGlobePointClick(bestPoint);
        return;
      }

      // Cables get a tighter reach so a stray land tap doesn't surprise-select.
      const cableReach = pointReach * 0.7;
      let bestCableId: string | null = null;
      let bestCableD = Infinity;
      for (const path of pathsData) {
        for (const [cLat, cLng] of path.coords) {
          const d = distDeg(cLat, cLng);
          if (d < bestCableD) {
            bestCableD = d;
            bestCableId = path.cableId;
          }
        }
      }
      if (bestCableId && bestCableD <= cableReach) {
        const cable = cablesById[bestCableId];
        if (cable) handleSelectCable(cable);
      }
    },
    [
      isIdle,
      surfacing,
      activeCall,
      pointsData,
      pathsData,
      handleGlobePointClick,
      handleSelectCable,
    ],
  );

  // Recenter on Malaysia (compass) — leaves selection/dialogs alone.
  const recenterMalaysia = useCallback(() => {
    flyTo({ lat: MY_LAT, lng: MY_LNG, altitude: MY_ALT }, 1200);
  }, [flyTo]);

  // Any touch immediately takes the camera back from a programmatic flight
  // (cable zoom, recenter, arrival, …) so the globe never fights the finger.
  // Calls are exempt — their camera is scripted, and TAP TO SKIP is the out.
  //
  // It also invalidates the landing-point card's "glide back on close"
  // snapshot when the user grabs the GLOBE while a card is open: the snapshot
  // exists to undo the card's auto-centering, not the user's own navigation —
  // closing should leave the camera where they deliberately put it. Canvas
  // target only: tapping the card itself (HTML) to close it also lands here,
  // and that one must keep the snapshot or the glide-back would never happen.
  const handleScenePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (activeCall) return;
      cancelFly();
      if (
        expandedPointId !== null &&
        (e.target as HTMLElement).tagName === "CANVAS"
      ) {
        prevPovRef.current = null;
      }
    },
    [activeCall, cancelFly, expandedPointId],
  );

  // Full reset (RightCluster ⊙) — deselect cable, close callout/dialog,
  // recenter, stop auto-rotate.
  const resetView = useCallback(() => {
    setSelectedCable(null);
    setSelectedLandingPoint(null);
    setOpenDialog(null);
    setExpandedPointId(null);
    prevPovRef.current = null;
    setAutoRotate(false);
    recenterMalaysia();
  }, [recenterMalaysia]);

  // Cables the in-progress call rides — highlighted bright for the call's
  // duration so the viewer sees exactly which systems carry the signal.
  const activeCallCableIds = useMemo(
    () => (activeCall ? new Set(activeCall.route.cableIds) : null),
    [activeCall],
  );

  // Flowing-energy wave on the cable lines (src/lib/cableFlow.ts). The flow
  // loop reads selection/call state through a ref so the rAF never restarts
  // on state changes — it just sees the latest values each frame.
  const flowStateRef = useRef<CableFlowState>({
    selectedCableId: null,
    callCableIds: null,
  });
  useEffect(() => {
    flowStateRef.current = {
      selectedCableId: selectedCable?.id ?? null,
      callCableIds: activeCallCableIds,
    };
  }, [selectedCable, activeCallCableIds]);
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const scene = globeRef.current.scene?.();
    if (!scene) return;
    return attachCableFlow(scene, () => flowStateRef.current);
  }, [isLoaded]);

  // Render order: muted siblings first → halo rings → cores.
  // Later entries in pathsData paint over earlier ones in three-globe, so
  // each core sits on top of its own translucent halo.
  const renderedPaths = useMemo(() => {
    // During a call: spotlight only the cables the call uses (neon stack),
    // mute the rest — same layering as a selection but for a SET of cables.
    if (activeCallCableIds) {
      const others: PathData[] = [];
      const core: PathData[] = [];
      for (const p of pathsData) {
        if (activeCallCableIds.has(p.cableId)) core.push(p);
        else others.push(p);
      }
      const halos = core.map((p) => ({ ...p, _halo: 2 }) as PathData);
      return [...others, ...halos, ...core];
    }
    if (!selectedCable) {
      // Nothing selected — every cable gets the neon stack (white-hot core +
      // glow ring) so the network reads consistently "lit up". Each glows in
      // its own colour: active = identity hue, planned = orange, inactive /
      // retired = dim grey.
      const out: PathData[] = [];
      for (const p of pathsData) {
        if (p.color.startsWith("#")) {
          out.push({ ...p, _halo: 2 }, p);
        } else {
          out.push(p);
        }
      }
      return out;
    }
    const others: PathData[] = [];
    const core: PathData[] = [];
    for (const p of pathsData) {
      if (p.cableId === selectedCable.id) core.push(p);
      else others.push(p);
    }
    const halos: PathData[] = [];
    for (const p of core) {
      halos.push({ ...p, _halo: 2 });
    }
    return [...others, ...halos, ...core];
  }, [pathsData, selectedCable, activeCallCableIds]);

  // Path color: selected core → red 3px; selected halos → translucent red;
  // muted siblings (non-selected when a cable is selected) → white 30%, flat;
  // nothing selected → identity colour core + identity-colour translucent halo.
  const getPathColor = useCallback(
    (path: PathData) => {
      // Active call: ridden cables keep their identity neon, others mute out.
      if (activeCallCableIds) {
        if (!activeCallCableIds.has(path.cableId)) return CABLE_MUTED_COLOR;
        if (path._halo === 2)
          return hexToRgba(path.color, CABLE_HALO_DEFAULT_OUTER_ALPHA);
        return path.color.startsWith("#") ? neonCore(path.color) : path.color;
      }
      if (selectedCable) {
        if (path.cableId !== selectedCable.id) return CABLE_MUTED_COLOR;
        // Selected cable gets the same neon stack, in hot red.
        if (path._halo === 2)
          return hexToRgba(CABLE_SELECTED_COLOR, CABLE_HALO_DEFAULT_OUTER_ALPHA);
        return neonCore(CABLE_SELECTED_COLOR);
      }
      if (path._halo === 2)
        return hexToRgba(path.color, CABLE_HALO_DEFAULT_OUTER_ALPHA);
      return path.color.startsWith("#") ? neonCore(path.color) : path.color;
    },
    [selectedCable, activeCallCableIds],
  );
  const getPathStroke = useCallback(
    (path: PathData) => {
      const s = GLOW_SCALE_BY_BUCKET[zoomBucket];
      if (activeCallCableIds) {
        if (!activeCallCableIds.has(path.cableId)) return 1;
        if (path._halo === 2) return 4 * s;
        return 1.5;
      }
      if (selectedCable) {
        const isSel = path.cableId === selectedCable.id;
        if (!isSel) return 1;
        // Same neon widths as default, a touch thicker so selection reads.
        if (path._halo === 2) return 4 * s;
        return 1.5;
      }
      if (path._halo === 2) return 3.5 * s;
      return 1;
    },
    [selectedCable, activeCallCableIds, zoomBucket],
  );

  // Point color: highlights cluster members of the selected cable in lime.
  const selectedLPSet = useMemo(
    () => (selectedCable ? new Set(selectedCable.landingPointIds) : null),
    [selectedCable],
  );
  const isPointSelected = useCallback(
    (point: any) => {
      if (!selectedLPSet) return false;
      const ids: string[] = point.memberIds || [point.id];
      return ids.some((id) => selectedLPSet.has(id));
    },
    [selectedLPSet],
  );
  const getPointColor = useCallback(
    (point: any) => {
      if (!selectedLPSet) return LANDING_POINT_DEFAULT;
      if (isPointSelected(point)) return LANDING_POINT_ACTIVE;
      return LANDING_POINT_MUTED;
    },
    [selectedLPSet, isPointSelected],
  );

  const getPointAltitude = useCallback(() => 0.001, []);

  // Stable accessor refs (three-globe is reference-equality based — every new
  // closure looks like a "changed prop" and re-runs the layer's full update).
  const pathPointLat = useCallback((p: any) => p[0], []);
  const pathPointLng = useCallback((p: any) => p[1], []);
  const pathPointAlt = useCallback(() => 0.003, []);
  const labelText = useCallback(
    (l: any) => (l.kind === "country" ? l.name : l.city),
    [],
  );
  const labelColor = useCallback(
    (l: any) =>
      l.kind === "country"
        ? "rgba(180, 200, 230, 0.55)"
        : "rgba(226, 232, 240, 0.85)",
    [],
  );
  const labelSize = useCallback(
    (l: any) =>
      l.kind === "country" ? COUNTRY_LABEL_BASE_SIZE : CITY_LABEL_BASE_SIZE,
    [],
  );
  const labelDotRadius = useCallback(() => 0, []);
  const labelIncludeDot = useCallback(() => false, []);
  const pointRadius = POINT_RADIUS_BY_BUCKET[zoomBucket];

  // Globe sphere material — baked equirectangular dark map routed through
  // emissiveMap so the day/night terminator disappears (mono basemap is
  // already shaded; we want it rendered flat-bright).
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const id = setTimeout(() => {
      const mat = globeRef.current?.globeMaterial?.();
      if (!mat) return;
      if (mat.map) {
        mat.emissiveMap = mat.map;
        mat.color?.set?.("#000000");
        mat.emissive?.set?.("#ffffff");
        if ("emissiveIntensity" in mat) mat.emissiveIntensity = 1;
      }
      const renderer = globeRef.current?.renderer?.();
      if (renderer && mat.map) {
        const maxAniso = renderer.capabilities?.getMaxAnisotropy?.() ?? 1;
        if (mat.map.anisotropy !== maxAniso) {
          mat.map.anisotropy = maxAniso;
          mat.map.needsUpdate = true;
        }
      }
      mat.needsUpdate = true;
    }, 60);
    return () => clearTimeout(id);
  }, [isLoaded]);

  // Regional sharpness overlay (SEA window). Single grid mesh, fades in at
  // close zoom. Always dark in v1.0.
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const scene = globeRef.current.scene?.();
    if (!scene) return;

    const loader = new THREE.TextureLoader();
    let mesh: THREE.Mesh | null = null;
    let raf = 0;
    let cancelled = false;

    loader.load(SEA_OVERLAY_DARK_URL, (texture) => {
      if (cancelled) {
        texture.dispose();
        return;
      }
      texture.colorSpace = THREE.SRGBColorSpace;
      const renderer = globeRef.current?.renderer?.();
      if (renderer) {
        texture.anisotropy = renderer.capabilities?.getMaxAnisotropy?.() ?? 1;
      }

      const N = SEA_GRID;
      const verts = (N + 1) * (N + 1);
      const positions = new Float32Array(verts * 3);
      const uvs = new Float32Array(verts * 2);
      const indices: number[] = [];

      for (let r = 0; r <= N; r++) {
        const t = r / N;
        const lat = SEA_LAT_MAX + (SEA_LAT_MIN - SEA_LAT_MAX) * t;
        for (let c = 0; c <= N; c++) {
          const u = c / N;
          const lng = SEA_LNG_MIN + (SEA_LNG_MAX - SEA_LNG_MIN) * u;
          const xyz = globeRef.current.getCoords(lat, lng, SEA_OVERLAY_ALT);
          const i = r * (N + 1) + c;
          positions[i * 3] = xyz.x;
          positions[i * 3 + 1] = xyz.y;
          positions[i * 3 + 2] = xyz.z;
          uvs[i * 2] = u;
          uvs[i * 2 + 1] = 1 - t;
        }
      }
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          const a = r * (N + 1) + c;
          const b = a + 1;
          const cIdx = a + (N + 1);
          const d = cIdx + 1;
          indices.push(a, cIdx, b, b, cIdx, d);
        }
      }

      const geo = new THREE.BufferGeometry();
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geo.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
      geo.setIndex(indices);

      const mat = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });

      mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 1;
      mesh.frustumCulled = false;
      scene.add(mesh);

      const tick = () => {
        const pov = globeRef.current?.pointOfView?.();
        const alt = pov?.altitude ?? 1;
        const opacity =
          alt >= SEA_FADE_IN_ALT
            ? 0
            : Math.min(
                1,
                (SEA_FADE_IN_ALT - alt) /
                  (SEA_FADE_IN_ALT - SEA_FADE_OUT_ALT),
              );
        mat.opacity = opacity;
        mat.visible = opacity > 0.001;
        raf = requestAnimationFrame(tick);
      };
      raf = requestAnimationFrame(tick);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      if (mesh) {
        scene.remove(mesh);
        const m = mesh.material as THREE.MeshBasicMaterial;
        m.map?.dispose();
        m.dispose();
        (mesh.geometry as THREE.BufferGeometry).dispose();
      }
    };
  }, [isLoaded]);

  // Per-frame label scaler — both kinds drive visibility + size via
  // mesh.scale on the label Group; TextGeometry is built once and never
  // rebuilt.
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    let raf = 0;
    const tick = () => {
      const pov = globeRef.current?.pointOfView?.();
      const alt = pov?.altitude ?? 1;
      const cityScale = cityScaleAt(alt);
      const countryScale = countryScaleAt(alt);
      for (const label of allLabels) {
        const group = (label as any).__threeObjLabel as
          | { scale: { setScalar: (n: number) => void } }
          | undefined;
        if (!group) continue;
        group.scale.setScalar(
          label.kind === "country" ? countryScale : cityScale,
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLoaded, allLabels]);

  // Cable-scoped landing-point list passed to MorseCodePop.
  const cableLandingPoints = useMemo(() => {
    if (!selectedCable) return [];
    const lookup = new Map(landingPoints.map((p) => [p.id, p]));
    return selectedCable.landingPointIds
      .map((id) => lookup.get(id))
      .filter((p): p is LandingPoint => Boolean(p));
  }, [selectedCable]);

  // Points that get an on-globe reticle marker: every landing point on the
  // selected cable, plus whichever point is currently open (covers the case of
  // tapping a point that isn't on the selected cable). Markers are dropped when
  // no cable is selected and nothing is open — just the bare globe dots remain.
  const markerPoints = useMemo(() => {
    const map = new Map<string, LandingPoint>();
    for (const p of cableLandingPoints) map.set(p.id, p);
    if (selectedLandingPoint) map.set(selectedLandingPoint.id, selectedLandingPoint);
    return [...map.values()];
  }, [cableLandingPoints, selectedLandingPoint]);

  // Phase 2: GeoJSON features for the countries the selected cable lands in.
  // Empty when no cable is selected → the polygon layer renders nothing.
  const highlightedCountries = useMemo(() => {
    if (cableLandingPoints.length === 0) return [];
    const wanted = new Set(
      cableLandingPoints.map((p) => COUNTRY_NAME_ALIASES[p.country] ?? p.country),
    );
    return (countries as { features: { properties?: { name?: string } }[] }).features.filter(
      (f) => f.properties?.name && wanted.has(f.properties.name),
    );
  }, [cableLandingPoints]);

  const countryCapColor = useCallback(() => COUNTRY_FILL_CAP, []);
  const countrySideColor = useCallback(() => COUNTRY_FILL_SIDE, []);
  const countryStrokeColor = useCallback(() => COUNTRY_FILL_STROKE, []);

  // Track the screen position of every marked landing point so its reticle (and
  // the open info card) anchor to the live marker as the globe rotates.
  // Throttled to ~30 fps via a frame-skip to avoid a 60Hz React storm.
  useEffect(() => {
    if (!isLoaded || markerPoints.length === 0 || !globeRef.current) {
      setCalloutScreens({});
      return;
    }
    let raf = 0;
    let frame = 0;
    const tick = () => {
      frame = (frame + 1) & 1;
      if (frame === 0) {
        const camera: THREE.Camera | null =
          globeRef.current?.camera?.() ?? null;
        const renderer = globeRef.current?.renderer?.();
        if (camera && renderer) {
          const dom = renderer.domElement as HTMLCanvasElement;
          const offX = globeProjectionOffsetX(dom.clientWidth);
          const next: Record<string, { x: number; y: number; visible: boolean }> = {};
          for (const p of markerPoints) {
            const xyz = globeRef.current.getCoords(p.lat, p.lng, 0.01);
            const v = new THREE.Vector3(xyz.x, xyz.y, xyz.z).project(camera);
            // v.z > 1 = point is behind the camera (far side of the globe)
            const visible = v.z <= 1;
            next[p.id] = {
              x: ((v.x + 1) / 2) * dom.clientWidth + offX,
              y: ((1 - v.y) / 2) * dom.clientHeight,
              visible,
            };
          }
          setCalloutScreens(next);
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLoaded, markerPoints]);

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "var(--v1-bg)", touchAction: "none" }}
      onPointerDownCapture={handleScenePointerDown}
    >
      {!hideLoading && <LoadingScreen language={language} />}
      {isLoaded && showSplash && (
        <SplashScreen language={language} fadingOut={splashFading} />
      )}

      <div
        className={surfacing ? "v1-globe-defocus" : undefined}
        style={{
          // Normally offset left to clear the right-side panels. In idle attract
          // mode the panels are hidden, so slide the globe back to centre for a
          // balanced screen; it eases back left on wake. It's also blurred while
          // idle (submerged feel) and pulls INTO focus as it surfaces — the
          // .v1-globe-defocus rack-focus animation overrides this blur while it
          // plays, timed to the breach.
          transform: `translateX(${
            isIdle || surfacing ? 0 : globeOffsetX(dimensions.width)
          }px)`,
          filter: isIdle ? "blur(3px)" : "none",
          transition:
            "transform 700ms cubic-bezier(0.4, 0, 0.2, 1), filter 800ms ease",
          willChange: "transform",
        }}
      >
        <div
          className={surfacing ? "v1-globe-breach" : undefined}
          style={{
            willChange: "transform",
            // Static half-bleed shift — centres the oversized canvas so its
            // edges stay off-screen at both ends of the idle⇄active slide.
            marginLeft: -globeBleedX(dimensions.width),
          }}
        >
        <Globe
          ref={globeRef}
          width={globeCanvasWidth(dimensions.width)}
          height={dimensions.height}
        backgroundColor="#040E1F"
        backgroundImageUrl={STARFIELD_URL}
        globeImageUrl={WORLD_MAP_DARK_URL}
        showAtmosphere={true}
        atmosphereColor={ATMOSPHERE_COLOR}
        atmosphereAltitude={0.18}
        polygonsData={highlightedCountries}
        polygonCapColor={countryCapColor}
        polygonSideColor={countrySideColor}
        polygonStrokeColor={countryStrokeColor}
        polygonAltitude={COUNTRY_FILL_ALTITUDE}
        polygonsTransitionDuration={300}
        pathsData={renderedPaths}
        pathPoints="coords"
        pathPointLat={pathPointLat}
        pathPointLng={pathPointLng}
        pathPointAlt={pathPointAlt}
        pathColor={getPathColor as any}
        pathStroke={getPathStroke as any}
        pathResolution={0.05}
        pathTransitionDuration={0}
        onPathClick={handlePathClick as any}
        onGlobeClick={handleGlobeClick as any}
        pointsData={pointsData}
        pointLat="lat"
        pointLng="lng"
        pointColor={getPointColor as any}
        pointAltitude={getPointAltitude as any}
        pointRadius={pointRadius}
        onPointClick={handleGlobePointClick}
        labelsData={allLabels}
        labelLat="lat"
        labelLng="lng"
        labelText={labelText}
        labelColor={labelColor}
        labelSize={labelSize}
        labelDotRadius={labelDotRadius}
        labelAltitude={0.005}
        labelResolution={1}
        labelTypeFace={robotoMedium as any}
        labelIncludeDot={labelIncludeDot}
          onGlobeReady={handleGlobeReady}
          animateIn={true}
        />
        </div>
      </div>

      {/* Idle attract mode: hide ALL chrome so only the rotating globe + the
          "touch anywhere to start" hint remain. On wake the panels are held
          back (chromeReady) until the branding card has fully bowed out. */}
      {!isIdle && !surfacing && chromeReady && (
        <>
          {/* Each panel slides in from its nearest edge on wake (v1-enter-*),
              applied straight to the panel's own element so it stays fully
              interactive — no overlay wrappers. */}

          {/* Top-right: CableSystem panel (filter tabs + 3x3 grid + counts) */}
          <Sidebar
            className="v1-enter-right"
            selectedCable={selectedCable}
            onSelectCable={handleSelectCable}
            language={language}
          />

          {/* Left of Cable System panel: Back / Audio / Naration button column.
              Back shows when a cable is selected OR a landing-point card is open
              (handleBack pops the open card first, then deselects the cable). */}
          <SystemButtons
            className="v1-enter-right v1-delay-1"
            showBack={Boolean(selectedCable) || Boolean(selectedLandingPoint)}
            onBack={handleBack}
            muted={muted}
            onAudioToggle={() => setMuted((m) => !m)}
          />

          {/* Right edge: CableInformation when a cable is selected, otherwise
              the General Information panel sits in the same slot. */}
          {selectedCable ? (
            <CableInformation
              className="v1-enter-right v1-delay-2"
              cable={selectedCable}
              language={language}
            />
          ) : (
            <GeneralInformation
              className="v1-enter-right v1-delay-2"
              language={language}
            />
          )}

          {/* Left edge centered: action cluster (Morse / Fun Fact / Help). The
              outer div holds the fixed centring transform; the inner div carries
              the slide-in animation so the two transforms don't collide. */}
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: 26,
              transform: "translateY(-50%)",
              zIndex: 25,
            }}
          >
            <div className="v1-enter-left">
              <RightCluster
                openDialog={openDialog}
                onOpen={(id) => {
                  // Fun Fact is still scoped to one cable — block + hint if none.
                  // Morse now works standalone (cross-network dialling).
                  if (id === "funfact" && !selectedCable) {
                    flashClusterHint(id);
                    return;
                  }
                  setOpenDialog((current) => (current === id ? null : id));
                }}
                cableSelected={Boolean(selectedCable)}
              />

              {/* "Choose a network first" hint — anchored to the right of
                  whichever dimmed button was tapped. Cluster buttons are 76px
                  tall with 31px gaps, so centres sit at 38 (Morse) and 145 (Fun
                  Fact). pointer-events:none so it never eats touches. */}
              {hintFor && (
                <div
                  role="status"
                  style={{
                    position: "absolute",
                    left: 76 + 16,
                    top: hintFor === "morse" ? 38 : 76 + 31 + 38,
                    transform: "translateY(-50%)",
                    zIndex: 26,
                    pointerEvents: "none",
                    whiteSpace: "nowrap",
                    padding: "10px 18px",
                    background: "rgba(4, 14, 31, 0.92)",
                    border: "1px solid var(--v1-orange)",
                    boxShadow: "0 4px 24px rgba(0, 0, 0, 0.5)",
                  }}
                >
                  <span
                    className="v1-h-display"
                    style={{
                      fontSize: 14,
                      color: "var(--v1-fg)",
                      letterSpacing: "0.14em",
                    }}
                  >
                    {t("chooseNetworkFirst")}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Bottom: titlebar */}
          <Header
            className="v1-enter-bottom v1-delay-1"
            selectedCable={selectedCable}
            language={language}
          />

          {/* Bottom-center: language toggle + re-center button (Figma V1.3).
              Outer div centres; inner div animates (avoids transform clash). */}
          <div
            style={{
              position: "fixed",
              bottom: 30,
              left: "50%",
              transform: "translateX(-50%)",
              zIndex: 25,
            }}
          >
            <div
              className="v1-enter-bottom v1-delay-3"
              style={{ display: "flex", gap: 14, alignItems: "center" }}
            >
              <LanguageToggle value={language} onChange={setLanguage} />
              <RecenterButton onRecenter={resetView} />
            </div>
          </div>
        </>
      )}

      {/* Map overlay: a reticle marker for each landing point on the selected
          cable (no text callout). Tapping a marker opens that point's expanded
          info card; the open point renders the card instead of the bare marker.
          Hidden during an active call so the dialing animation is unobstructed. */}
      {!activeCall &&
        markerPoints.map((p) => {
          const pos = calloutScreens[p.id];
          if (!pos || !pos.visible) return null;
          const isExpanded = expandedPointId === p.id;
          return (
            <LandingPointCallout
              key={p.id}
              point={p}
              screenPos={{ x: pos.x, y: pos.y }}
              viewport={dimensions}
              markerOnly={!isExpanded}
              expanded={isExpanded}
              // When one point is open, grey out the other cable markers.
              dimmed={Boolean(expandedPointId) && !isExpanded}
              onToggleExpand={() => openLandingPoint(p)}
            />
          );
        })}

      {/* Leader line from the active cluster button to its dialog title. */}
      <ClusterStem openDialog={openDialog} viewport={dimensions} />

      {/* Dialogs */}
      {openDialog === "howto" && (
        <HowToGuideDialog
          onClose={() => setOpenDialog(null)}
          language={language}
        />
      )}
      {openDialog === "funfact" && selectedCable && (
        <FunFactDialog
          cable={selectedCable}
          onClose={() => setOpenDialog(null)}
          language={language}
        />
      )}
      {openDialog === "morse" && (
        <MorseCodePop
          landingPoints={landingPoints}
          language={language}
          onClose={() => setOpenDialog(null)}
          onSend={(message, fromId, toId) => {
            setOpenDialog(null);
            setActiveCall({
              message,
              route: resolveNetworkRoute(fromId, toId),
              startedAt: performance.now(),
            });
          }}
        />
      )}

      {activeCall && (
        <CallAnimationOverlay
          message={activeCall.message}
          route={activeCall.route}
          onDone={() => setActiveCall(null)}
          globeRef={globeRef}
        />
      )}

      {/* Underwater attract overlay — submerged look while idle; the waterline
          recedes during `surfacing`, then it unmounts. */}
      {isLoaded && (isIdle || surfacing) && (
        <UnderwaterOverlay surfacing={surfacing} />
      )}

      {/* Branding card that surfaces with the globe and fades once UI settles. */}
      {brandingOn && (
        <BrandingFlash
          language={language}
          leaving={brandingLeaving}
          onGone={() => {
            setBrandingOn(false);
            setBrandingLeaving(false);
          }}
        />
      )}

      {/* Pre-idle countdown — warns for the last 10s before the attractor
          submerges everything (otherwise it silently eats in-progress work,
          e.g. a half-typed Morse message). Any tap resets the idle timer via
          useIdleAttractor's window listeners, so the toast needs no button —
          pointer-events: none keeps it out of the way. Above dialogs (z 50). */}
      {warnSecondsLeft !== null && !isIdle && isLoaded && (
        <div
          role="status"
          style={{
            position: "fixed",
            top: 48,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 55,
            pointerEvents: "none",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 6,
            padding: "16px 30px",
            background: "rgba(4, 14, 31, 0.92)",
            border: "1px solid var(--v1-orange)",
            boxShadow: "0 6px 30px rgba(0, 0, 0, 0.55)",
          }}
        >
          <span
            className="v1-pulse"
            style={{
              fontFamily: "var(--v1-heading)",
              fontWeight: 600,
              fontSize: 22,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              color: "var(--v1-fg)",
            }}
          >
            {t("stillThere")}
          </span>
          <span
            style={{
              fontFamily: "var(--v1-mono)",
              fontSize: 13,
              color: "var(--v1-fg)",
            }}
          >
            {t("idleReturningIn")}{" "}
            <span style={{ color: "var(--v1-orange)", fontWeight: 700 }}>
              {warnSecondsLeft}s
            </span>
            {" — "}
            {t("idleTapToContinue").toLowerCase()}
          </span>
        </div>
      )}

      {/* Idle attractor hint — overlays everything else, pointer-events: none
          so any touch hits the layer underneath and useIdleAttractor wakes. */}
      {isIdle && isLoaded && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 40,
            pointerEvents: "none",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            paddingBottom: "20vh",
          }}
        >
          <span
            className="v1-pulse"
            style={{
              fontFamily: "var(--v1-heading)",
              fontWeight: 500,
              fontSize: 28,
              letterSpacing: "0.30em",
              textTransform: "uppercase",
              color: "var(--v1-fg)",
              padding: "16px 32px",
              background: "rgba(0, 0, 0, 0.45)",
              border: "1px solid rgba(255, 255, 255, 0.25)",
            }}
          >
            {t("tapToBegin")}
          </span>
        </div>
      )}
    </div>
  );
}

// ───────── BrandingFlash ─────────
// Title card ("Submarine Cable Map" / "Brought to you by" / TM logo / HUD
// tagline) shown over the emerging globe. Each line rises + fades in staggered
// (v1-brand-rise); the title carries an ice-blue gradient + one-time shine. A
// soft scrim lifts it off the busy globe and the project's `+` corner
// crosshairs frame it. When `leaving` goes true the whole card fades out and
// calls `onGone` so the parent can unmount it.
function BrandingFlash({
  language,
  leaving,
  onGone,
}: {
  language: Language;
  leaving: boolean;
  onGone: () => void;
}) {
  const t = useT(language);
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 45,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        pointerEvents: "none",
        // Children stagger IN on their own; the container only drives fade-OUT.
        opacity: leaving ? 0 : 1,
        transition: "opacity 700ms ease",
      }}
      onTransitionEnd={() => {
        if (leaving) onGone();
      }}
    >
      {/* Scrim — soft dark halo so the white text reads off the globe. */}
      <div
        aria-hidden
        style={{
          position: "absolute",
          width: "min(120vw, 1100px)",
          height: "min(80vh, 620px)",
          background:
            "radial-gradient(ellipse at center, rgba(2,8,20,0.62) 0%, rgba(2,8,20,0.34) 46%, transparent 72%)",
        }}
      />

      {/* Framed card — frosted glass panel with `+` corner crosshairs (project
          title-strip convention). Square corners keep the crosshairs aligned. */}
      <div
        style={{
          position: "relative",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          padding: "clamp(30px, 4vw, 60px) clamp(40px, 6vw, 96px)",
          border: "1px solid rgba(255, 255, 255, 0.22)",
          background: "rgba(8, 18, 33, 0.30)",
          backdropFilter: "blur(16px) saturate(1.15)",
          WebkitBackdropFilter: "blur(16px) saturate(1.15)",
          boxShadow:
            "0 24px 60px rgba(0, 0, 0, 0.45), inset 0 1px 0 rgba(255, 255, 255, 0.12)",
        }}
      >
        {(["tl", "tr", "bl", "br"] as const).map((pos) => (
          <BrandCross key={pos} position={pos} />
        ))}

        <span
          className="v1-brand-title"
          style={{
            fontFamily: "var(--v1-display)",
            fontWeight: 700,
            fontSize: "clamp(40px, 6.4vw, 88px)",
            lineHeight: 1.1,
            textAlign: "center",
          }}
        >
          {t("submarineCableMap")}
        </span>

        <span
          className="v1-brand-rise"
          style={{
            animationDelay: "150ms",
            marginTop: "clamp(20px, 2.6vw, 40px)",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: "clamp(15px, 1.6vw, 30px)",
            color: "#FFFFFF",
            textAlign: "center",
            textShadow: "0 2px 18px rgba(0, 0, 0, 0.7)",
          }}
        >
          {t("broughtToYouBy")}
        </span>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/tm-logo.png"
          alt="Telekom Malaysia"
          className="v1-brand-rise"
          style={{
            animationDelay: "300ms",
            marginTop: "clamp(18px, 2vw, 32px)",
            width: "clamp(120px, 11vw, 200px)",
            height: "auto",
            userSelect: "none",
            filter: "drop-shadow(0 4px 22px rgba(0, 0, 0, 0.55))",
          }}
          draggable={false}
        />

        <span
          className="v1-brand-rise"
          style={{
            animationDelay: "440ms",
            marginTop: "clamp(16px, 1.8vw, 28px)",
            fontFamily: "var(--v1-mono)",
            fontWeight: 400,
            fontSize: "clamp(10px, 0.95vw, 15px)",
            letterSpacing: "0.34em",
            textTransform: "uppercase",
            color: "rgba(184, 230, 255, 0.78)",
            textAlign: "center",
            textShadow: "0 2px 14px rgba(0, 0, 0, 0.7)",
          }}
        >
          {t("globalSubmarineNetwork")}
        </span>
      </div>
    </div>
  );
}

// 8×8 `+` corner crosshair for the branding frame (project title-strip
// convention — see CableInformation's CrossMark).
function BrandCross({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const variants = {
    tl: { top: -4, left: -4 },
    tr: { top: -4, right: -4 },
    bl: { bottom: -4, left: -4 },
    br: { bottom: -4, right: -4 },
  } as const;
  return (
    <span
      aria-hidden
      style={{ position: "absolute", width: 8, height: 8, ...variants[position] }}
    >
      <span
        style={{
          position: "absolute",
          top: 3,
          left: 0,
          width: 8,
          height: 0,
          borderTop: "2px solid #FFFFFF",
        }}
      />
      <span
        style={{
          position: "absolute",
          top: 0,
          left: 3,
          width: 0,
          height: 8,
          borderLeft: "2px solid #FFFFFF",
        }}
      />
    </span>
  );
}

// ───────── CallAnimationOverlay ─────────
// Drives the call animation: stitched cable polyline → bright orange pulse
// mesh that traverses source → destination, camera lerps to follow, decoded
// message floats above the pulse, then camera returns to world view on
// arrival. Self-cleaning on unmount; runs once per activeCall instance.
const CALL_PULSE_RADIUS = 0.22;
const CALL_PULSE_SPEED_KM_PER_SEC = 550;
const CALL_FOLLOW_ALT = 0.45;
const CALL_INTRO_ALT = 0.9;
const CALL_RETURN_LAT = 5;
const CALL_RETURN_LNG = 108;
const CALL_RETURN_ALT = 2.2;

// Teleport (country-hub hand-off) tuning: how long one jump takes and how far
// the dashed arc bows off the globe surface.
const TELEPORT_LEG_MS = 650;
const TELEPORT_ARC_LIFT = 0.16;

function CallAnimationOverlay({
  message,
  route,
  onDone,
  globeRef,
}: {
  message: string;
  route: ResolvedNetworkRoute;
  onDone: () => void;
  globeRef: React.MutableRefObject<any>;
}) {
  const [labelPos, setLabelPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [phase, setPhase] = useState<
    "dial" | "connect" | "intro" | "travel" | "arrive" | "return"
  >("dial");
  const returnTriggeredRef = useRef(false);
  // Populated by the effect with a "finish now" closure; the TAP TO SKIP chip
  // calls it. Tears the animation down instantly: timers, rAF, meshes, audio.
  const skipRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!globeRef.current) return;
    const scene = globeRef.current.scene?.();
    const renderer = globeRef.current.renderer?.();
    if (!scene || !renderer) return;

    const legs = route.legs;
    if (legs.length === 0) {
      onDone();
      return;
    }

    const hav = (a: [number, number], b: [number, number]) => {
      const R = 6371;
      const dLat = ((b[0] - a[0]) * Math.PI) / 180;
      const dLng = ((b[1] - a[1]) * Math.PI) / 180;
      const la1 = (a[0] * Math.PI) / 180;
      const la2 = (b[0] * Math.PI) / 180;
      const x =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
      return 2 * R * Math.asin(Math.sqrt(x));
    };

    // Turn the route's legs into a timed sequence: cable legs are paced by
    // distance (km / speed); each teleport leg takes a fixed quick beat and
    // traces a dashed arc that bows off the globe surface.
    type TimedLeg =
      | {
          kind: "cable";
          coords: [number, number][];
          cum: number[];
          km: number;
          dur: number;
        }
      | {
          kind: "teleport";
          arc: { lat: number; lng: number; alt: number }[];
          dur: number;
        };
    const timed: TimedLeg[] = legs.map((leg) => {
      if (leg.kind === "cable") {
        const coords = leg.coords;
        const cum = [0];
        for (let i = 1; i < coords.length; i++)
          cum.push(cum[i - 1] + hav(coords[i - 1], coords[i]));
        const km = cum[cum.length - 1] || 0;
        return {
          kind: "cable",
          coords,
          cum,
          km,
          dur: Math.max(300, (km / CALL_PULSE_SPEED_KM_PER_SEC) * 1000),
        };
      }
      const steps = 26;
      const arc: { lat: number; lng: number; alt: number }[] = [];
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        arc.push({
          lat: leg.from[0] + (leg.to[0] - leg.from[0]) * t,
          lng: leg.from[1] + (leg.to[1] - leg.from[1]) * t,
          alt: 0.012 + TELEPORT_ARC_LIFT * Math.sin(Math.PI * t),
        });
      }
      return { kind: "teleport", arc, dur: TELEPORT_LEG_MS };
    });
    const totalTravelMs = timed.reduce((s, l) => s + l.dur, 0);
    if (totalTravelMs <= 0) {
      onDone();
      return;
    }

    const dialMs = 1300;
    const connectMs = 1100;
    const introMs = 800;

    playDialing();

    const start: [number, number] = [route.fromPoint.lat, route.fromPoint.lng];
    const connectTimer = setTimeout(() => {
      playConnect();
      globeRef.current?.pointOfView(
        { lat: start[0], lng: start[1], altitude: CALL_INTRO_ALT },
        connectMs + introMs,
      );
    }, dialMs);

    const messageTimer = setTimeout(
      () => playMessage(message, totalTravelMs),
      dialMs + connectMs + introMs,
    );

    const geo = new THREE.SphereGeometry(CALL_PULSE_RADIUS, 16, 12);
    const mat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(V1_COLORS.orangeHot),
      depthTest: false,
      transparent: true,
    });
    const pulse = new THREE.Mesh(geo, mat);
    pulse.renderOrder = 1000;
    pulse.frustumCulled = false;
    scene.add(pulse);

    const haloGeo = new THREE.SphereGeometry(CALL_PULSE_RADIUS * 2.4, 16, 12);
    const haloMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(V1_COLORS.orange),
      transparent: true,
      opacity: 0.35,
      depthTest: false,
      blending: THREE.AdditiveBlending,
    });
    const halo = new THREE.Mesh(haloGeo, haloMat);
    halo.renderOrder = 999;
    halo.frustumCulled = false;
    scene.add(halo);

    // One dashed arc line per teleport leg — hidden until that hand-off is live.
    const teleLines: (THREE.Line | null)[] = timed.map((l) => {
      if (l.kind !== "teleport") return null;
      const pts = l.arc.map((p) => {
        const c = globeRef.current.getCoords(p.lat, p.lng, p.alt);
        return new THREE.Vector3(c.x, c.y, c.z);
      });
      const lineGeo = new THREE.BufferGeometry().setFromPoints(pts);
      const lineMat = new THREE.LineDashedMaterial({
        color: new THREE.Color(V1_COLORS.orangeHot),
        dashSize: 1.4,
        gapSize: 0.9,
        transparent: true,
        depthTest: false,
      });
      const line = new THREE.Line(lineGeo, lineMat);
      line.computeLineDistances();
      line.renderOrder = 1001;
      line.frustumCulled = false;
      line.visible = false;
      scene.add(line);
      return line;
    });

    let raf = 0;
    let cancelled = false;
    const preLaunchMs = dialMs + connectMs + introMs;
    const travelMs = totalTravelMs;
    const arriveMs = 1500;
    const returnMs = 1800;
    const startTs = performance.now();

    const camera: THREE.Camera | null = globeRef.current?.camera?.() ?? null;
    const projectToScreen = (xyz: { x: number; y: number; z: number }) => {
      if (!camera) return null;
      const v = new THREE.Vector3(xyz.x, xyz.y, xyz.z).project(camera);
      const dom = renderer.domElement as HTMLCanvasElement;
      const w = dom.clientWidth;
      const h = dom.clientHeight;
      return {
        x: ((v.x + 1) / 2) * w + globeProjectionOffsetX(w),
        y: ((1 - v.y) / 2) * h,
      };
    };

    // Sample the pulse position at a given travel-elapsed time: find which leg
    // we're in, then interpolate within it (cable = by distance, teleport = by
    // arc parameter). Returns the leg index so the caller can light its arc.
    const sampleTravel = (te: number) => {
      let acc = 0;
      for (let li = 0; li < timed.length; li++) {
        const leg = timed[li];
        if (te < acc + leg.dur || li === timed.length - 1) {
          const lt = leg.dur > 0 ? Math.min(1, (te - acc) / leg.dur) : 1;
          if (leg.kind === "cable") {
            const dist = lt * leg.km;
            let j = 1;
            while (j < leg.cum.length && leg.cum[j] < dist) j++;
            if (j >= leg.cum.length) j = leg.cum.length - 1;
            const a = leg.coords[j - 1];
            const b = leg.coords[j];
            const segLen = leg.cum[j] - leg.cum[j - 1];
            const tt = segLen > 0 ? (dist - leg.cum[j - 1]) / segLen : 0;
            return {
              li,
              teleport: false,
              lat: a[0] + (b[0] - a[0]) * tt,
              lng: a[1] + (b[1] - a[1]) * tt,
              alt: 0.012,
            };
          }
          const f = lt * (leg.arc.length - 1);
          const k = Math.min(leg.arc.length - 1, Math.floor(f));
          const k2 = Math.min(leg.arc.length - 1, k + 1);
          const tt = f - k;
          const p1 = leg.arc[k];
          const p2 = leg.arc[k2];
          return {
            li,
            teleport: true,
            lat: p1.lat + (p2.lat - p1.lat) * tt,
            lng: p1.lng + (p2.lng - p1.lng) * tt,
            alt: p1.alt + (p2.alt - p1.alt) * tt,
          };
        }
        acc += leg.dur;
      }
      return {
        li: timed.length - 1,
        teleport: false,
        lat: start[0],
        lng: start[1],
        alt: 0.012,
      };
    };

    // Final resting position (last leg's end — could be a cable exit OR the far
    // end of a teleport, when the destination is reached by a hand-off).
    const endLeg = timed[timed.length - 1];
    const endLatLng: [number, number] =
      endLeg.kind === "cable"
        ? endLeg.coords[endLeg.coords.length - 1]
        : [
            endLeg.arc[endLeg.arc.length - 1].lat,
            endLeg.arc[endLeg.arc.length - 1].lng,
          ];

    pulse.visible = false;
    halo.visible = false;

    const tick = () => {
      if (cancelled) return;
      const elapsed = performance.now() - startTs;

      if (elapsed < dialMs) {
        setPhase("dial");
      } else if (elapsed < dialMs + connectMs) {
        setPhase("connect");
      } else if (elapsed < preLaunchMs) {
        setPhase("intro");
      } else if (elapsed < preLaunchMs + travelMs) {
        setPhase("travel");
        if (!pulse.visible) {
          pulse.visible = true;
          halo.visible = true;
        }
        const s = sampleTravel(elapsed - preLaunchMs);
        const xyz = globeRef.current.getCoords(s.lat, s.lng, s.alt);
        pulse.position.set(xyz.x, xyz.y, xyz.z);
        halo.position.set(xyz.x, xyz.y, xyz.z);

        // Light only the arc of the teleport leg currently in progress.
        for (let li = 0; li < teleLines.length; li++) {
          const ln = teleLines[li];
          if (ln) ln.visible = s.teleport && li === s.li;
        }

        if (s.teleport) {
          // Zap emphasis: pulse swells, halo flares, dashed arc shimmers.
          pulse.scale.setScalar(1.5);
          halo.scale.setScalar(1.7);
          haloMat.opacity = 0.6;
          const ln = teleLines[s.li];
          if (ln)
            (ln.material as THREE.LineDashedMaterial).opacity =
              0.55 + 0.45 * Math.sin(elapsed / 55);
        } else {
          pulse.scale.setScalar(1);
          halo.scale.setScalar(1);
          haloMat.opacity = 0.25 + 0.2 * Math.sin(elapsed / 120);
        }

        const pov = globeRef.current.pointOfView?.();
        if (pov) {
          const alpha = 0.06;
          const nextLat = pov.lat + (s.lat - pov.lat) * alpha;
          const nextLng = pov.lng + (s.lng - pov.lng) * alpha;
          const nextAlt =
            pov.altitude + (CALL_FOLLOW_ALT - pov.altitude) * alpha;
          globeRef.current.pointOfView(
            { lat: nextLat, lng: nextLng, altitude: nextAlt },
            0,
          );
        }

        const screen = projectToScreen(xyz);
        if (screen) setLabelPos(screen);
      } else if (elapsed < preLaunchMs + travelMs + arriveMs) {
        setPhase("arrive");
        for (const ln of teleLines) if (ln) ln.visible = false;
        const xyz = globeRef.current.getCoords(
          endLatLng[0],
          endLatLng[1],
          0.012,
        );
        pulse.position.set(xyz.x, xyz.y, xyz.z);
        halo.position.set(xyz.x, xyz.y, xyz.z);
        const arriveT = (elapsed - preLaunchMs - travelMs) / arriveMs;
        const flash = 1 + Math.sin(arriveT * Math.PI) * 1.4;
        pulse.scale.setScalar(flash);
        halo.scale.setScalar(flash);
        haloMat.opacity = 0.5 * (1 - arriveT) + 0.2;
        const screen = projectToScreen(xyz);
        if (screen) setLabelPos(screen);
      } else if (elapsed < preLaunchMs + travelMs + arriveMs + returnMs) {
        if (!returnTriggeredRef.current) {
          returnTriggeredRef.current = true;
          setPhase("return");
          globeRef.current.pointOfView(
            {
              lat: CALL_RETURN_LAT,
              lng: CALL_RETURN_LNG,
              altitude: CALL_RETURN_ALT,
            },
            returnMs,
          );
        }
        const rt = (elapsed - preLaunchMs - travelMs - arriveMs) / returnMs;
        mat.opacity = Math.max(0, 1 - rt);
        haloMat.opacity = Math.max(0, 0.4 * (1 - rt));
        setLabelPos(null);
      } else {
        cancelled = true;
        cancelAnimationFrame(raf);
        disposeAll();
        onDone();
        return;
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    let disposed = false;
    function disposeAll() {
      if (disposed) return;
      disposed = true;
      scene.remove(pulse);
      scene.remove(halo);
      geo.dispose();
      mat.dispose();
      haloGeo.dispose();
      haloMat.dispose();
      for (const ln of teleLines) {
        if (!ln) continue;
        scene.remove(ln);
        ln.geometry.dispose();
        (ln.material as THREE.Material).dispose();
      }
    }

    // TAP TO SKIP — jump straight to the end state: stop the scripted timers,
    // the rAF loop, the pulse meshes and any scheduled morse audio, then glide
    // the camera home and report done (parent unmounts us).
    skipRef.current = () => {
      if (cancelled) return;
      cancelled = true;
      clearTimeout(connectTimer);
      clearTimeout(messageTimer);
      cancelAnimationFrame(raf);
      disposeAll();
      stopAllAudio();
      globeRef.current?.pointOfView(
        { lat: CALL_RETURN_LAT, lng: CALL_RETURN_LNG, altitude: CALL_RETURN_ALT },
        900,
      );
      onDone();
    };

    return () => {
      cancelled = true;
      clearTimeout(connectTimer);
      clearTimeout(messageTimer);
      cancelAnimationFrame(raf);
      disposeAll();
      skipRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      {labelPos && (
        <div
          className="fixed z-30 pointer-events-none"
          style={{
            left: labelPos.x,
            top: labelPos.y - 60,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div
            style={{
              padding: "10px 18px",
              background: "var(--v1-orange)",
              border: "1px solid rgba(255, 255, 255, 0.30)",
              boxShadow: "0 4px 24px rgba(240, 90, 34, 0.55)",
            }}
          >
            <span
              className="v1-h-display"
              style={{
                fontSize: 18,
                color: "var(--v1-fg)",
                letterSpacing: "0.18em",
                whiteSpace: "nowrap",
              }}
            >
              {message}
            </span>
          </div>
          <div
            style={{
              width: 1,
              height: 48,
              background:
                "linear-gradient(180deg, var(--v1-orange) 0%, transparent 100%)",
              margin: "0 auto",
            }}
          />
        </div>
      )}
      <div
        style={{
          position: "fixed",
          top: "40%",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 30,
          pointerEvents: "none",
        }}
      >
        {phase === "dial" && (
          <PhaseChip text="Dialing…" tone="orange" pulse />
        )}
        {phase === "connect" && (
          <PhaseChip text="Establishing Link…" tone="blue" />
        )}
        {phase === "intro" && <PhaseChip text="Transmitting" tone="blue" />}
        {phase === "arrive" && <PhaseChip text="Delivered" tone="orange" />}
      </div>

      {/* Skip — the call runs 5-10s; impatient kiosk visitors need an out.
          Hidden once the return glide starts (it's about to end anyway).
          Outer div centres; the button carries the press-scale animation so
          the two transforms don't collide. */}
      {phase !== "return" && (
        <div
          style={{
            position: "fixed",
            bottom: 110,
            left: "50%",
            transform: "translateX(-50%)",
            zIndex: 31,
          }}
        >
          <button
            type="button"
            className="v1-pressable"
            onClick={() => skipRef.current?.()}
            style={{
              minHeight: 48,
              padding: "12px 26px",
              background: "rgba(4, 14, 31, 0.85)",
              border: "1px solid rgba(255, 255, 255, 0.45)",
              color: "var(--v1-fg)",
              fontFamily: "var(--v1-mono)",
              fontSize: 14,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            Tap to skip ✕
          </button>
        </div>
      )}
    </>
  );
}

function PhaseChip({
  text,
  tone,
  pulse = false,
}: {
  text: string;
  tone: "orange" | "blue";
  pulse?: boolean;
}) {
  return (
    <div
      className={pulse ? "v1-pulse" : undefined}
      style={{
        padding: "12px 24px",
        background:
          tone === "orange" ? "var(--v1-orange)" : "var(--v1-blue)",
        border: "1px solid rgba(255, 255, 255, 0.40)",
      }}
    >
      <span
        className="v1-h-display"
        style={{
          fontSize: 13,
          color: "var(--v1-fg)",
          letterSpacing: "0.30em",
        }}
      >
        {text}
      </span>
    </div>
  );
}
