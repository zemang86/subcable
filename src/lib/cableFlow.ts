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

export interface CableFlowState {
  selectedCableId: string | null;
  callCableIds: Set<string> | null;
}

// Minimal structural view of three-globe internals we rely on.
interface FlowPathDatum {
  cableId?: string;
  _halo?: number;
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
varying float vFlowDist;
`;

// Comet profile: long tail rising into a bright head, with the head's front
// edge softened (smoothstep) so the sawtooth wrap doesn't alias/shimmer.
const FRAG_FLOW = /* glsl */ `
float flowP = fract( ( vFlowDist - flowTime ) / flowWavelength );
float flowPulse = pow( flowP, 3.0 ) * smoothstep( 1.0, 0.97, flowP );
float flowGain = 1.0 - flowAmp + flowAmp * 2.4 * flowPulse;
gl_FragColor = vec4( diffuseColor.rgb * flowGain, alpha * flowGain );
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
  mat.needsUpdate = true;
}

// The dash-distance attributes only exist after computeLineDistances(), and
// go stale when three-globe calls setPositions (which allocates a fresh
// interleaved buffer — so a buffer-identity check detects every rebuild).
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

  const tick = (now: number) => {
    const flowTime = ((now - start) / 1000) * FLOW_SPEED;
    const { selectedCableId, callCableIds } = getState();
    scene.traverse((obj) => {
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
    });
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => cancelAnimationFrame(raf);
}
