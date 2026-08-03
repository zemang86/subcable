"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";

import Globe from "./GlobeWrapper";
import Sidebar from "./Sidebar";
import SystemButtons from "./SystemButtons";
import LoadingScreen from "./LoadingScreen";
import CableInformation from "./CableInformation";
import GeneralInformation from "./GeneralInformation";
import { Header } from "./Header";
import { LanguageToggle } from "./LanguageToggle";
import { RightCluster } from "./RightCluster";
import { ClusterStem } from "./ClusterStem";
import { LandingPointCallout } from "./LandingPointCallout";
import IntroSequence from "./IntroSequence";
import HowToGuideDialog from "./HowToGuideDialog";
import FunFactDialog from "./FunFactDialog";
import MorseCodePop from "./MorseCodePop";

import { cables, cablesById } from "@/data/cables";
import { landingPoints } from "@/data/landingPoints";
import { cableRoutes } from "@/data/cableRoutes";
// Precomputed extracts of countries.json (see scripts/trim-countries.mjs) —
// the full 496 KB Natural Earth file stays out of the client bundle.
import countryLabelData from "@/data/countryLabels.json";
import landingCountries from "@/data/landingCountries.json";
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
import { attachHologramRim } from "@/lib/hologramRim";
// import { attachScanSweep } from "@/lib/scanSweep"; // radar sweep hidden (client)
import { attachTouchRipple, type TouchRipple } from "@/lib/touchRipple";

// ───────── Tuning ─────────

// Dev escape hatch: `NEXT_PUBLIC_DEV_NO_IDLE=1` in .env.local parks the idle
// attractor, so the live screen never submerges back to the attract loop while
// you're working on it. Lives in a (gitignored) env file rather than a source
// constant on purpose — a hardcoded testing override is exactly what shipped as
// the 15s idle window fixed in 93e4609. Belt and braces: the NODE_ENV guard
// makes it inert in any production build even if .env.local is left in place.
const DEV_NO_IDLE =
  process.env.NODE_ENV !== "production" &&
  process.env.NEXT_PUBLIC_DEV_NO_IDLE === "1";

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

// WebGLRenderer options (module-level: a fresh object identity here would
// re-create the whole renderer). alpha/antialias match the defaults;
// powerPreference asks the OS for the discrete/high-perf GPU on hybrid
// hardware.
const RENDERER_CONFIG = {
  antialias: true,
  alpha: true,
  powerPreference: "high-performance",
} as const;
const SEA_LAT_MIN = -15;
const SEA_LAT_MAX = 25;
const SEA_LNG_MIN = 90;
const SEA_LNG_MAX = 130;
const SEA_GRID = 32;
const SEA_OVERLAY_ALT = 0.0008;
const SEA_FADE_IN_ALT = 0.6;
const SEA_FADE_OUT_ALT = 0.3;

// ───────── v1.0 palette → globe constants ─────────

// Globe glow ramp follows temp/globe.svg: a #237ED0 halo that whitens at the
// silhouette. Recoloured off the deep v1 atmosphere (#034DA1) and dimmed —
// the broad outer falloff is the atmosphere, the crisp rim is hologramRim.
const ATMOSPHERE_COLOR = "#237ED0";                     // globe.svg halo stop
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
const MY_LAT = 4.2105;
const MY_LNG = 101.9758;
const MY_ALT = 2.2;

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
  // Position of this segment within its cable's route — the circuit-trace
  // selection effect energizes segments in this order (src/lib/cableFlow.ts).
  _segIndex: number;
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
  // First boot: show the LoadingScreen, then reveal the live globe directly
  // (NOT the attract video — that only appears after the app later goes idle).
  // `booted` flips true on the first reveal and never resets, so the loading
  // screen is a one-time boot cover; subsequent idle→attract cycles are owned
  // by the IntroSequence video layer instead.
  const [booted, setBooted] = useState(false);
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

  // v8 intro/idle: `revealed` = live globe + chrome are up; `submerging` = idle
  // reached, chrome reversing out while clip3 plays. See the IntroSequence
  // block below. Declared here so the idle attractor can suspend off them.
  const [revealed, setRevealed] = useState(false);
  const [submerging, setSubmerging] = useState(false);
  // v8: clip2 (fullseq) ends with the globe CENTERED, so the live globe is
  // revealed centered too (seamless cut), then slides left into its working
  // offset pose to clear the right-side panels. `globeSlid` drives that slide;
  // it stays true through the live session + submerge (clip3 hands off from the
  // offset pose) and resets on idle so the next reveal starts centered again.
  const [globeSlid, setGlobeSlid] = useState(false);

  // Idle attractor (§H.12): fires after ~60s of no interaction. Suspended
  // unless the live globe is up (the attract/emerge/submerge clips own those
  // phases) and while a call animation runs — watching IS engagement (long
  // routes travel >60s with zero touches). The timer re-arms fresh on unsuspend.
  const { isIdle, warnSecondsLeft } = useIdleAttractor(
    60_000,
    undefined,
    DEV_NO_IDLE || !revealed || submerging || activeCall !== null,
  );
  const t = useT(language);

  // Stable handlers for the memoized chrome — an inline arrow here would give
  // SystemButtons/RightCluster a fresh prop identity every render and defeat
  // their memo.
  const handleAudioToggle = useCallback(() => setMuted((m) => !m), []);
  // All three cluster dialogs are standalone now — Morse dials cross-network,
  // and the Fun Fact deck is its own looping content, not scoped to a cable —
  // so none of them need a selection guard or the old "choose a network" hint.
  const handleClusterOpen = useCallback((id: Exclude<DialogId, null>) => {
    setOpenDialog((current) => (current === id ? null : id));
  }, []);

  // Push mute state down to morseAudio so playDot/playMessage/etc no-op.
  useEffect(() => {
    setAudioMuted(muted);
  }, [muted]);

  // The cable network is dormant (ghosted by cableFlow) until the globe is
  // revealed at the end of the emerge clip, when a one-shot circuit-trace beams
  // every cable on at once. `cableBootAt` is that power-on timestamp (0 = never
  // fired). Stays dormant again across each submerge → attract cycle.
  const [networkDormant, setNetworkDormant] = useState(true);
  const [cableBootAt, setCableBootAt] = useState(0);

  // Chrome (panels + HUD) boots in subsystem order after reveal: Header →
  // Sidebar/system buttons → info panel → cluster/controls, each replaying its
  // slide-in. 0 = nothing (attract video is up), 4 = fully booted.
  const BOOT_STEP_MS = 360;
  // Reveal beats (from the moment the bare globe is shown): hold, then beam the
  // network on; then a further hold before the chrome panels boot in. Spreads
  // the reveal out instead of everything firing at once.
  const BEAM_DELAY_MS = 500; // bare globe → network pulses on
  // Center→offset slide: globe is revealed centered (matching clip2's last
  // frame) and holds while clip2 dissolves out over it (IntroSequence
  // REVEAL_FADE_MS ≈ 1200ms — the hold MUST outlast it so clip2 isn't still
  // lingering centered while the globe slides, which would double-image), then
  // glides left into its working pose.
  const GLOBE_SLIDE_DELAY_MS = 1300;
  const GLOBE_SLIDE_MS = 2000;
  // Chrome boots once the globe is most of the way through its slide (cleared the
  // right side) so the panels never appear over a still-centered globe.
  const CHROME_AT_SLIDE_FRAC = 0.65;
  // Submerge: how long the chrome takes to animate OUT before clip3 blooms in —
  // the reverse cascade (last slot 760ms delay + 600ms slide ≈ 1360ms).
  const CHROME_EXIT_MS = 1450;
  const [chromeReady, setChromeReady] = useState(false);
  const [bootStage, setBootStage] = useState(0);
  // `chromeExiting` keeps the panels mounted (with v1-exit-* classes) while they
  // slide back out; `submergePlay` then tells IntroSequence to bloom into clip3.
  const [chromeExiting, setChromeExiting] = useState(false);
  const [submergePlay, setSubmergePlay] = useState(false);
  const bootTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const submergeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => bootTimers.current.forEach(clearTimeout), []);
  useEffect(
    () => () => {
      if (submergeTimer.current) clearTimeout(submergeTimer.current);
    },
    [],
  );

  // Reveal the live globe (first boot, or clip2 emerge cut): show the bare globe
  // immediately, beam the network on after BEAM_DELAY_MS, then boot the chrome
  // in stages once the globe has slid most of the way left (CHROME_AT_SLIDE_FRAC).
  const handleReveal = useCallback(() => {
    setRevealed(true);
    setGlobeSlid(false); // appear centered (matches clip2's last frame)
    bootTimers.current.forEach(clearTimeout);
    const chromeStart =
      GLOBE_SLIDE_DELAY_MS + Math.round(GLOBE_SLIDE_MS * CHROME_AT_SLIDE_FRAC);
    const slide = setTimeout(() => setGlobeSlid(true), GLOBE_SLIDE_DELAY_MS);
    const beam = setTimeout(() => {
      setNetworkDormant(false);
      setCableBootAt(performance.now());
    }, BEAM_DELAY_MS);
    const chrome = setTimeout(() => {
      setChromeReady(true);
      setBootStage(1);
    }, chromeStart);
    const stages = [2, 3, 4].map((stage, i) =>
      setTimeout(() => setBootStage(stage), chromeStart + (i + 1) * BOOT_STEP_MS),
    );
    bootTimers.current = [slide, beam, chrome, ...stages];
  }, []);

  // clip3 (submerge) finished → reset to the dormant attract baseline so the
  // next reveal is clean.
  const handleReachedIdle = useCallback(() => {
    bootTimers.current.forEach(clearTimeout);
    bootTimers.current = [];
    if (submergeTimer.current) clearTimeout(submergeTimer.current);
    setRevealed(false);
    setGlobeSlid(false); // next reveal starts centered again (globe is hidden)
    setSubmerging(false);
    setChromeExiting(false);
    setSubmergePlay(false);
    setNetworkDormant(true);
    setCableBootAt(0);
    setChromeReady(false);
    setBootStage(0);
    setSelectedCable(null);
    setSelectedLandingPoint(null);
    setExpandedPointId(null);
    setOpenDialog(null);
    setAutoRotate(false);
  }, []);

  // Inactivity while live (useIdleAttractor fires only when revealed) →
  // submerge: recenter the globe to the canonical recenter pose (so it matches
  // clip3's framing — the bloom must hand off at the same position/zoom), the
  // chrome reverses out (panels slide back to their edges), then once they're
  // gone IntroSequence blooms the globe into clip3. The 1200ms recenter lands
  // well before the bloom (CHROME_EXIT_MS).
  useEffect(() => {
    if (isIdle && revealed && !submerging) {
      setSubmerging(true);
      setChromeExiting(true); // panels animate out (still mounted)
      cancelFly();
      flyTo({ lat: MY_LAT, lng: MY_LNG, altitude: MY_ALT }, 1200); // recenter
      setOpenDialog(null);
      setSelectedCable(null);
      setSelectedLandingPoint(null);
      setExpandedPointId(null);
      if (submergeTimer.current) clearTimeout(submergeTimer.current);
      submergeTimer.current = setTimeout(() => {
        setChromeExiting(false);
        setChromeReady(false); // unmount the (now hidden) panels
        setBootStage(0);
        setSubmergePlay(true); // → IntroSequence blooms into clip3
      }, CHROME_EXIT_MS);
    }
  }, [isIdle, revealed, submerging, cancelFly, flyTo]);

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
      route.segments.forEach((seg, segIndex) => {
        out.push({
          coords: seg.coords,
          cableId: route.cableId,
          name: cable?.shortName || route.cableId,
          color: colorByStatus,
          status,
          _segIndex: segIndex,
        });
      });
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

  // Country labels — largest-polygon centroids precomputed at build time by
  // scripts/trim-countries.mjs (verbatim port of the old runtime shoelace/
  // bbox-centre computation).
  const countryLabels = useMemo(
    () =>
      countryLabelData as { lat: number; lng: number; name: string; area: number }[],
    [],
  );

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

  // First boot: once the globe is loaded (LoadingScreen has had its run), drop
  // the loading cover and reveal the live globe directly — beam the network on
  // and boot the chrome, same as a post-emerge reveal. The attract video stays
  // dormant until the app later goes idle.
  useEffect(() => {
    if (isLoaded && !booted) {
      setBooted(true);
      handleReveal();
    }
  }, [isLoaded, booted, handleReveal]);

  // Initial view + globe controls
  const handleGlobeReady = useCallback(() => {
    if (globeRef.current) {
      globeRef.current.pointOfView(
        { lat: DEFAULT_LAT, lng: DEFAULT_LNG, altitude: DEFAULT_ALT },
        0,
      );
      // Cap the render resolution: react-globe.gl defaults to the full
      // devicePixelRatio, which is 4× the fragment work on a DPR-2 kiosk
      // panel — invisible at touchscreen viewing distance. 1.5 keeps text
      // and cable edges crisp at a fraction of the fill cost.
      globeRef.current
        .renderer()
        ?.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
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

  // While the opaque attract/idle video owns the screen the globe is pure
  // waste — on a kiosk that's the majority of 24/7 uptime. Pause the whole
  // react-globe.gl render loop (draw calls, controls, tweens) and resume on
  // reveal. Gated on isLoaded so the initial 3s LoadingScreen window still
  // renders — first-draw shader compilation must happen there, not at the
  // reveal cut. The satellite rAF loops below gate on the same signal.
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    if (revealed) globeRef.current.resumeAnimation?.();
    else globeRef.current.pauseAnimation?.();
  }, [isLoaded, revealed]);

  // Ref mirror for rAF loops that must not re-run their setup on reveal
  // flips (e.g. the SEA overlay effect owns a texture load).
  const revealedRef = useRef(revealed);
  useEffect(() => {
    revealedRef.current = revealed;
  }, [revealed]);

  // Camera altitude polling — throttled so React re-renders don't blow up.
  useEffect(() => {
    if (!isLoaded || !revealed || !globeRef.current) return;
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
  }, [isLoaded, revealed]);

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

  // Touch ripple — an expanding ring on the sphere at the tapped point
  // (src/lib/touchRipple.ts), spawned from handleGlobeClick below. Gives
  // every globe tap visible feedback, including misses that select nothing.
  // (Declared before handleGlobeClick so the ref mutation in the effect
  // precedes the callback that captures it — react-hooks/immutability.)
  const touchRippleRef = useRef<TouchRipple | null>(null);
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const scene = globeRef.current.scene?.();
    if (!scene) return;
    const ripple = attachTouchRipple(scene);
    touchRippleRef.current = ripple;
    return () => {
      touchRippleRef.current = null;
      ripple.detach();
    };
  }, [isLoaded]);

  // ── Tap forgiveness ──
  // Globe dots are a few px and cable strokes thinner still, so a fingertip
  // that just misses raycasts through to the bare globe. onGlobeClick catches
  // that miss and retargets it: the nearest landing point within an
  // altitude-scaled reach (≈ a fingertip at any zoom), else the nearest cable
  // vertex within a tighter reach. Zooming in shrinks the reach, so precision
  // returns once targets are big enough to hit directly.
  const handleGlobeClick = useCallback(
    ({ lat, lng }: { lat: number; lng: number }) => {
      if (!revealed || submerging || activeCall) return;
      // Hologram disturbance at the touched point — fires for every globe
      // tap, hit or miss, so the kiosk always acknowledges the finger.
      touchRippleRef.current?.spawn(lat, lng);
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
      revealed,
      submerging,
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
    dormant: false,
    bootAt: 0,
    hidden: false,
  });
  useEffect(() => {
    flowStateRef.current = {
      selectedCableId: selectedCable?.id ?? null,
      callCableIds: activeCallCableIds,
      dormant: networkDormant,
      bootAt: cableBootAt,
      hidden: !revealed,
    };
  }, [selectedCable, activeCallCableIds, networkDormant, cableBootAt, revealed]);
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const scene = globeRef.current.scene?.();
    if (!scene) return;
    return attachCableFlow(scene, () => flowStateRef.current);
  }, [isLoaded]);

  // Hologram fresnel rim — crisp electric edge on the sphere's silhouette
  // (src/lib/hologramRim.ts). The stock atmosphere stays on for the soft
  // outer falloff; this shell provides the sharp inner edge.
  useEffect(() => {
    if (!isLoaded || !globeRef.current) return;
    const scene = globeRef.current.scene?.();
    if (!scene) return;
    return attachHologramRim(scene);
  }, [isLoaded]);

  // Scanline sweep — a radar-style band of light circling the sphere every
  // ~20s (src/lib/scanSweep.ts), so the globe reads as continuously scanned.
  // HIDDEN for now (commented by client) — the radar sweep is disabled.
  // useEffect(() => {
  //   if (!isLoaded || !globeRef.current) return;
  //   const scene = globeRef.current.scene?.();
  //   if (!scene) return;
  //   return attachScanSweep(scene);
  // }, [isLoaded]);

  // (v8) Idle umbilical tethers + underwater attract removed — the idle/emerge
  // experience is now the IntroSequence video layer. src/lib/idleTethers.ts and
  // UnderwaterOverlay.tsx are kept in the tree but no longer wired.

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

      let lastOpacity = -1;
      const tick = () => {
        // Idle-cheap: no camera read or material write while the attract
        // video covers the globe, and no write when the value hasn't moved
        // (the overlay spends most of its life pinned at 0 or 1).
        if (revealedRef.current) {
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
          if (opacity !== lastOpacity) {
            lastOpacity = opacity;
            mat.opacity = opacity;
            mat.visible = opacity > 0.001;
          }
        }
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
    if (!isLoaded || !revealed || !globeRef.current) return;
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
  }, [isLoaded, revealed, allLabels]);

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
    return (
      landingCountries as { features: { properties?: { name?: string } }[] }
    ).features.filter((f) => f.properties?.name && wanted.has(f.properties.name));
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
    // Reused scratch vector (no per-marker allocation) + last-published
    // positions: while the camera is at rest (damping settled, user reading
    // the panel) positions don't move, so skipping the setState spares the
    // whole React tree a 30fps re-render for zero visual change.
    const scratch = new THREE.Vector3();
    let last: Record<string, { x: number; y: number; visible: boolean }> = {};
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
          let changed = false;
          for (const p of markerPoints) {
            const xyz = globeRef.current.getCoords(p.lat, p.lng, 0.01);
            const v = scratch.set(xyz.x, xyz.y, xyz.z).project(camera);
            // v.z > 1 = point is behind the camera (far side of the globe)
            const visible = v.z <= 1;
            const x = ((v.x + 1) / 2) * dom.clientWidth + offX;
            const y = ((1 - v.y) / 2) * dom.clientHeight;
            next[p.id] = { x, y, visible };
            const prev = last[p.id];
            if (
              !prev ||
              prev.visible !== visible ||
              Math.abs(prev.x - x) > 0.5 ||
              Math.abs(prev.y - y) > 0.5
            ) {
              changed = true;
            }
          }
          if (changed) {
            last = next;
            setCalloutScreens(next);
          }
        }
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [isLoaded, markerPoints]);

  // Panel animation class: the enter class on reveal; on submerge swap to the
  // reverse exit and replace the enter stagger with a cascade slot (1 = leaves
  // first … 5 = leaves last) so the panels exit one after another.
  const chromeCls = (enterCls: string, exitOrder: number) =>
    chromeExiting
      ? `${enterCls
          .replace(/v1-enter/g, "v1-exit")
          .replace(/\s*v1-delay-\d/g, "")} v1-exit-d${exitOrder}`
      : enterCls;

  return (
    <div
      className="relative w-full h-screen overflow-hidden"
      style={{ background: "var(--v1-bg)", touchAction: "none" }}
      onPointerDownCapture={handleScenePointerDown}
    >
      {/* One-time boot cover: LoadingScreen → live globe. (z below the globe's
          own backdrop is fine — it paints over the globe; the IntroSequence
          layer above is transparent in its dormant `live` phase.) */}
      {!booted && <LoadingScreen language={language} />}

      <div
        style={{
          // clip2 ends centered, so the globe is revealed centered then slides
          // left into its working pose (clears the right-side panels). The bleed
          // margin keeps the oversized canvas edges off-screen throughout the
          // slide. `globeSlid` false→true animates; the reset back to false
          // happens while the globe is hidden, so it's left non-transitioning. (v8)
          transform: `translateX(${globeSlid ? globeOffsetX(dimensions.width) : 0}px)`,
          transition: globeSlid
            ? `transform ${GLOBE_SLIDE_MS}ms cubic-bezier(0.45, 0, 0.55, 1)`
            : "none",
          willChange: "transform",
        }}
      >
        <div
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
        atmosphereAltitude={0.12}
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
          rendererConfig={RENDERER_CONFIG}
        />
        </div>
      </div>

      {/* Chrome shows once the globe is revealed (post-emerge) and boots in
          subsystem order; on submerge it stays mounted with v1-exit-* classes
          (chromeExiting) to slide back out, then unmounts. (v8) */}
      {revealed && chromeReady && (!submerging || chromeExiting) && (
        <>
          {/* Each panel slides in from its nearest edge on wake (v1-enter-*),
              applied straight to the panel's own element so it stays fully
              interactive — no overlay wrappers. */}

          {/* Top-right: CableSystem panel (filter tabs + 3x3 grid + counts) */}
          {bootStage >= 2 && (
            <Sidebar
              className={chromeCls("v1-enter-right", 4)}
              selectedCable={selectedCable}
              onSelectCable={handleSelectCable}
              language={language}
            />
          )}

          {/* Left of Cable System panel: Back / Audio / Naration button column.
              Back shows when a cable is selected OR a landing-point card is open
              (handleBack pops the open card first, then deselects the cable). */}
          {bootStage >= 2 && (
            <SystemButtons
              className={chromeCls("v1-enter-right v1-delay-1", 3)}
              showBack={Boolean(selectedCable) || Boolean(selectedLandingPoint)}
              onBack={handleBack}
              onRecenter={resetView}
              muted={muted}
              onAudioToggle={handleAudioToggle}
            />
          )}

          {/* Right edge: CableInformation when a cable is selected, otherwise
              the General Information panel sits in the same slot. */}
          {bootStage < 3 ? null : selectedCable ? (
            <CableInformation
              className={chromeCls("v1-enter-right v1-delay-2", 2)}
              cable={selectedCable}
              language={language}
            />
          ) : (
            <GeneralInformation
              className={chromeCls("v1-enter-right v1-delay-2", 2)}
              language={language}
            />
          )}

          {/* Left edge centered: action cluster (Morse / Fun Fact / Help). The
              outer div holds the fixed centring transform; the inner div carries
              the slide-in animation so the two transforms don't collide. */}
          {bootStage >= 4 && (
          <div
            style={{
              position: "fixed",
              top: "50%",
              left: 26,
              transform: "translateY(-50%)",
              zIndex: 25,
            }}
          >
            <div className={chromeCls("v1-enter-left", 1)}>
              <RightCluster openDialog={openDialog} onOpen={handleClusterOpen} />

              {/* Language toggle — sits directly below the Help button, sharing
                  the left-edge action stack. */}
              <div style={{ marginTop: 31 }}>
                <LanguageToggle value={language} onChange={setLanguage} />
              </div>
            </div>
          </div>
          )}

          {/* Bottom: titlebar — first subsystem online. */}
          {bootStage >= 1 && (
            <Header
              className={chromeCls("v1-enter-bottom v1-delay-1", 5)}
              selectedCable={selectedCable}
              language={language}
            />
          )}

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
      {openDialog === "funfact" && (
        <FunFactDialog onClose={() => setOpenDialog(null)} language={language} />
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

      {/* Pre-idle countdown — warns for the last 10s before the kiosk
          submerges back to the attract video (otherwise it silently eats
          in-progress work, e.g. a half-typed Morse message). Any tap resets the
          idle timer via useIdleAttractor's window listeners, so the toast needs
          no button — pointer-events: none keeps it out of the way. (z 55) */}
      {warnSecondsLeft !== null && revealed && !submerging && (
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

      {/* Video idle/intro layer (clip1 attract → clip2 emerge → live → clip3
          submerge). Owns the "tap to begin" prompt + launch countdown, and
          hands the screen to the live globe on reveal. Top of the stack. */}
      <IntroSequence
        language={language}
        requestSubmerge={submergePlay}
        onReveal={handleReveal}
        onReachedIdle={handleReachedIdle}
      />
    </div>
  );
}

// BrandingFlash + BrandCross archived to ./_archive/BrandingFlash.tsx (v8 —
// branding dropped from the video-driven intro; kept for future re-use).

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
