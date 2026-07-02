// Flowing-energy shader for the cable lines.
//
// three-globe renders every path (our cores + halo rings) as a fat line:
// a Line2 with its own LineMaterial instance. This module patches those
// materials' GLSL in place to add a comet-shaped brightness wave that
// travels along each cable — luminous energy flowing through a conduit —
// and drives the shared time uniform from a single rAF loop.
//
// Why patch instead of drawing our own layer: the wave needs a per-fragment
// "distance along the line" coordinate, and LineMaterial already has the
// plumbing for one (the dash system's instanceDistanceStart/End attributes
// filled by computeLineDistances). Riding the existing lines means zero
// extra geometry and zero extra draw calls — the only added cost is one
// varying and a few ALU ops in shaders that were already running.
//
// three-globe rebuilds path objects whenever the rendered-paths array
// changes identity (selection / call / zoom-bucket changes), so patching is
// re-applied lazily: every tick, any unpatched material found in the scene
// gets patched. A freshly rebuilt line renders unpatched for at most one
// frame — imperceptible.

import type { Object3D, Scene } from "three";
import type { Line2 } from "three/examples/jsm/lines/Line2.js";
import type { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

// ── Tuning ──
// Globe radius is 100 world units ≈ 6371 km, so 1 unit ≈ 64 km.
const FLOW_WAVELENGTH = 14; // pulse spacing along the cable (~890 km)
const FLOW_SPEED = 7; // world units/sec (~450 km/s of apparent travel)
// Modulation depth per line role. 0 = static. Between pulses a line dims to
// (1 - amp) of its normal brightness; at the pulse head it peaks above it.
const AMP_CORE = 0.35; // white-hot core filament
const AMP_HALO = 0.45; // wide translucent colour glow

// ── Circuit-trace selection ──
// On selecting a cable, a white-hot scan head races tip-to-tail along the
// route; fragments ahead of it hold a faint ghost of the line until the
// head passes and leaves them energized (the normal selected look).
// The launch is delayed so the head runs while the 1500ms select flight
// is settling — fired immediately it would finish off-camera, mid-flight.
const TRACE_DELAY_SEC = 0.55;
const TRACE_DURATION_SEC = 1.3;
const TRACE_HEAD_UNITS = 6; // white-hot head length (~380 km)
const TRACE_GHOST = 0.06; // brightness of the not-yet-energized line
// "Fully energized" sentinel — far beyond any cable's real length.
const ENERGIZED = 1e9;

// ── Dormant network + wake-up boot ──
// While the kiosk idles "docked" (and through the emerge + branding beat)
// the whole network sleeps at the ghost level; when the branding card bows
// out, a one-shot circuit-trace runs on EVERY cable at once — the grid
// powers on tip-to-tail out of the dark. Each cable's front is scaled to
// its own route length, so all routes complete together.
const BOOT_DURATION_SEC = 3.0;
// "Everything ahead of the front" sentinel — ghosts the entire line.
const DORMANT = -1e9;

export interface CableFlowState {
  selectedCableId: string | null;
  callCableIds: Set<string> | null;
  /** Ghost the whole network (idle dock / emerge / branding hold). */
  dormant: boolean;
  /** performance.now() timestamp of the wake-up power-on; 0 = never. */
  bootAt: number;
  /** Globe is covered by the opaque attract video — skip all per-frame work. */
  hidden: boolean;
}

// Minimal structural view of three-globe internals we rely on.
interface FlowPathDatum {
  cableId?: string;
  _halo?: number;
  _segIndex?: number;
}
type PathGroup = Object3D & {
  __globeObjType?: string;
  __data?: FlowPathDatum;
};
type FlowUniform = { value: number };
type PatchableMaterial = LineMaterial & {
  uniforms: Record<string, FlowUniform>;
};

// Anchors in three r182's LineMaterial shader source. If a future three
// upgrade rewrites them, patching degrades gracefully: lines render exactly
// as before, without the flow wave.
const VERT_MAIN = "void main() {";
const FRAG_MAIN = "void main() {";
const FRAG_OUT = "gl_FragColor = vec4( diffuseColor.rgb, alpha );";

const VERT_DECLS = /* glsl */ `
#ifndef USE_DASH
attribute float instanceDistanceStart;
attribute float instanceDistanceEnd;
#endif
varying float vFlowDist;
`;

const FRAG_DECLS = /* glsl */ `
uniform float flowTime;
uniform float flowWavelength;
uniform float flowAmp;
uniform float energizeFront;
varying float vFlowDist;
`;

// Comet profile: long tail rising into a bright head, with the head's front
// edge softened (smoothstep) so the sawtooth wrap doesn't alias/shimmer.
// The energize terms layer the circuit-trace on top: fragments ahead of
// energizeFront dim to a ghost, the few units behind it flash white-hot.
// At rest energizeFront sits at ENERGIZED, so eMask=1, eHead=0 and the
// whole block reduces to the plain flow look.
const FRAG_FLOW = /* glsl */ `
float flowP = fract( ( vFlowDist - flowTime ) / flowWavelength );
float flowPulse = pow( flowP, 3.0 ) * smoothstep( 1.0, 0.97, flowP );
float flowGain = 1.0 - flowAmp + flowAmp * 2.4 * flowPulse;
float eBehind = energizeFront - vFlowDist;
float eMask = clamp( eBehind * 0.7, 0.0, 1.0 );
float eHead = smoothstep( ${TRACE_HEAD_UNITS.toFixed(1)}, 0.0, abs( eBehind ) ) * eMask;
float eGain = mix( ${TRACE_GHOST.toFixed(2)}, flowGain + 1.8 * eHead, eMask );
vec3 eRGB = mix( diffuseColor.rgb, vec3( 1.0 ), 0.6 * eHead );
gl_FragColor = vec4( eRGB * eGain, alpha * eGain );
`;

function patchMaterial(mat: PatchableMaterial): void {
  if (mat.userData.flowPatched) return;
  mat.userData.flowPatched = true;
  const vert = mat.vertexShader;
  const frag = mat.fragmentShader;
  if (
    !vert.includes(VERT_MAIN) ||
    !frag.includes(FRAG_MAIN) ||
    !frag.includes(FRAG_OUT)
  ) {
    // Unknown shader source (three upgrade?) — leave the material untouched.
    return;
  }
  mat.vertexShader = vert.replace(
    VERT_MAIN,
    `${VERT_DECLS}${VERT_MAIN}
vFlowDist = ( position.y < 0.5 ) ? instanceDistanceStart : instanceDistanceEnd;`,
  );
  mat.fragmentShader = frag
    .replace(FRAG_MAIN, `${FRAG_DECLS}${FRAG_MAIN}`)
    .replace(FRAG_OUT, FRAG_FLOW);
  mat.uniforms.flowTime = { value: 0 };
  mat.uniforms.flowWavelength = { value: FLOW_WAVELENGTH };
  mat.uniforms.flowAmp = { value: 0 };
  mat.uniforms.energizeFront = { value: ENERGIZED };
  mat.needsUpdate = true;
}

// The dash-distance attributes only exist after computeLineDistances(), and
// go stale when three-globe calls setPositions (which allocates a fresh
// interleaved buffer — so a buffer-identity check detects every rebuild).
// The segment's total arc length (last cumulative distance) is cached for
// the circuit-trace offsets.
function ensureLineDistances(line: Line2): void {
  const geo = line.geometry;
  const pos = geo.attributes.instanceStart as
    | { data?: object }
    | undefined;
  if (!pos?.data) return;
  if (
    !geo.attributes.instanceDistanceStart ||
    geo.userData.flowPosBuffer !== pos.data
  ) {
    line.computeLineDistances();
    geo.userData.flowPosBuffer = pos.data;
    const distEnd = geo.attributes.instanceDistanceEnd as
      | { count: number; getX(i: number): number }
      | undefined;
    geo.userData.flowSegLen = distEnd?.count
      ? distEnd.getX(distEnd.count - 1)
      : 0;
  }
}

/**
 * Attach the flowing-energy effect to a mounted globe scene. Returns a
 * cleanup function that stops the animation loop.
 *
 * `getState` is read every frame (keep it a cheap ref read): cables outside
 * the current selection / active call freeze to their plain look (amp 0),
 * matching how the colour accessors mute them.
 */
export function attachCableFlow(
  scene: Scene,
  getState: () => CableFlowState,
): () => void {
  let raf = 0;
  const start = performance.now();

  // Circuit-trace clock: restarted whenever the selected cable changes.
  // Initialized to the mount-time selection so re-attaching (idle return,
  // fast refresh) doesn't replay the trace on an old selection.
  let lastSelected = getState().selectedCableId;
  let traceStart = 0;

  // Per-frame scratch for the selected cable's segments (reused, no allocs
  // once warm). Indexed by _segIndex; halo+core pairs share an entry's
  // length but both receive the uniform.
  let traceMats: PatchableMaterial[] = [];
  let traceSegs: number[] = [];
  const segLens: number[] = [];

  // Wake-up boot scratch — per-cable this time, since every route traces at
  // once. The inner offset arrays alloc per frame, but only for the boot's
  // 2.4s window.
  let bootMats: PatchableMaterial[] = [];
  let bootSegs: number[] = [];
  let bootCables: string[] = [];
  const bootLens = new Map<string, number[]>();
  const bootOffs = new Map<string, number[]>();
  const bootFront = new Map<string, number>();

  // All path groups live under one persistent parent (the paths layer's
  // scene group — three-globe empties it only at init and ThreeDigest
  // adds/removes children in place). Caching that parent replaces the
  // whole-scene traverse (globe, atmosphere, ~140 label groups, points…)
  // with a flat walk of just the path children. Rebuilt lines simply show
  // up as new children, so the lazy patching keeps working unchanged.
  let pathsParent: Object3D | null = null;
  const findPathsParent = (): Object3D | null => {
    if (pathsParent && pathsParent.parent) return pathsParent;
    pathsParent = null;
    scene.traverse((obj) => {
      if (!pathsParent && (obj as PathGroup).__globeObjType === "path") {
        pathsParent = obj.parent;
      }
    });
    return pathsParent;
  };

  const tick = (now: number) => {
    const { selectedCableId, callCableIds, dormant, bootAt, hidden } =
      getState();
    // Covered by the opaque attract video — keep the clock alive but do no
    // work. The first visible tick after reveal runs before react-globe.gl's
    // freshly-resumed render (its rAF re-registers after ours), so uniforms
    // are correct by the first drawn frame.
    if (hidden) {
      raf = requestAnimationFrame(tick);
      return;
    }
    const flowTime = ((now - start) / 1000) * FLOW_SPEED;

    if (selectedCableId !== lastSelected) {
      lastSelected = selectedCableId;
      traceStart = selectedCableId ? now + TRACE_DELAY_SEC * 1000 : 0;
    }
    const traceT = traceStart ? (now - traceStart) / 1000 : Infinity;
    // An active call takes over the cable styling — skip the trace there.
    // During the pre-launch delay (traceT < 0) the line holds at ghost.
    const tracing = !callCableIds && !dormant && traceT < TRACE_DURATION_SEC;
    let traceCount = 0;
    segLens.length = 0;

    // A selection mid-boot hands over to the ordinary selection trace.
    const bootT = bootAt ? (now - bootAt) / 1000 : Infinity;
    const booting =
      !callCableIds && !dormant && !selectedCableId && bootT < BOOT_DURATION_SEC;
    let bootCount = 0;
    bootLens.clear();

    const processGroup = (obj: Object3D) => {
      const group = obj as PathGroup;
      if (group.__globeObjType !== "path") return;
      const line = group.children[0] as Line2 | undefined;
      if (!line || !(line as { isLine2?: boolean }).isLine2) return;
      const mat = line.material as PatchableMaterial;
      patchMaterial(mat);
      if (!mat.uniforms.flowTime) return; // anchor mismatch — left unpatched
      ensureLineDistances(line);

      const datum = group.__data;
      const cableId = datum?.cableId;
      const flowing = callCableIds
        ? cableId !== undefined && callCableIds.has(cableId)
        : selectedCableId
          ? cableId === selectedCableId
          : true;
      mat.uniforms.flowAmp.value = flowing
        ? datum?._halo
          ? AMP_HALO
          : AMP_CORE
        : 0;
      mat.uniforms.flowTime.value = flowTime;

      const segIndex = datum?._segIndex;
      if (dormant && !callCableIds) {
        mat.uniforms.energizeFront.value = DORMANT;
      } else if (booting && cableId !== undefined && segIndex !== undefined) {
        // Defer like the selection trace, but grouped per cable.
        bootMats[bootCount] = mat;
        bootSegs[bootCount] = segIndex;
        bootCables[bootCount] = cableId;
        bootCount++;
        let lens = bootLens.get(cableId);
        if (!lens) {
          lens = [];
          bootLens.set(cableId, lens);
        }
        lens[segIndex] = (line.geometry.userData.flowSegLen as number) || 0;
      } else if (
        tracing &&
        cableId === selectedCableId &&
        segIndex !== undefined
      ) {
        // Defer the uniform — the front position needs every segment's
        // length first (offsets accumulate in _segIndex order).
        traceMats[traceCount] = mat;
        traceSegs[traceCount] = segIndex;
        traceCount++;
        segLens[segIndex] = (line.geometry.userData.flowSegLen as number) || 0;
      } else {
        mat.uniforms.energizeFront.value = ENERGIZED;
      }
    };

    const parent = findPathsParent();
    if (parent) {
      for (const child of parent.children) processGroup(child);
    }

    if (traceCount > 0) {
      // Cumulative offset of each segment along the whole route.
      let total = 0;
      const offsets: number[] = [];
      for (let i = 0; i < segLens.length; i++) {
        offsets[i] = total;
        total += segLens[i] || 0;
      }
      // Ease-out: the head launches fast and settles into the far end,
      // overshooting by the head length so the hot spot fully exits.
      const x = Math.max(0, Math.min(1, traceT / TRACE_DURATION_SEC));
      const front = (1 - Math.pow(1 - x, 3)) * (total + TRACE_HEAD_UNITS);
      for (let i = 0; i < traceCount; i++) {
        traceMats[i].uniforms.energizeFront.value =
          front - offsets[traceSegs[i]];
      }
    }
    if (bootCount > 0) {
      const x = Math.max(0, Math.min(1, bootT / BOOT_DURATION_SEC));
      const eased = 1 - Math.pow(1 - x, 3);
      // Per-cable cumulative offsets + a front scaled to that cable's
      // length, so short island hops and long trunks land together.
      for (const [cid, lens] of bootLens) {
        let total = 0;
        const offs: number[] = [];
        for (let i = 0; i < lens.length; i++) {
          offs[i] = total;
          total += lens[i] || 0;
        }
        bootOffs.set(cid, offs);
        bootFront.set(cid, eased * (total + TRACE_HEAD_UNITS));
      }
      for (let i = 0; i < bootCount; i++) {
        const offs = bootOffs.get(bootCables[i]);
        const front = bootFront.get(bootCables[i]);
        bootMats[i].uniforms.energizeFront.value =
          front !== undefined && offs
            ? front - (offs[bootSegs[i]] || 0)
            : ENERGIZED;
      }
      bootOffs.clear();
      bootFront.clear();
    }
    // Drop material refs so disposed lines aren't retained between frames.
    traceMats.length = 0;
    traceSegs.length = 0;
    bootMats.length = 0;
    bootSegs.length = 0;
    bootCables.length = 0;

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    traceMats = [];
    traceSegs = [];
    bootMats = [];
    bootSegs = [];
    bootCables = [];
  };
}
