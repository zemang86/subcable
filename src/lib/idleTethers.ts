// Umbilical data tethers for the idle "docked hologram" attract mode.
//
// While the kiosk idles underwater, the globe reads as a hologram docked in
// a seafloor facility: glowing conduits curve in from off-screen, clamp onto
// the visible hemisphere at luminous docking pads, and feed comet pulses
// INTO the globe — it's being charged/synced while it sleeps.
//
// Idle auto-rotate orbits the CAMERA, not the mesh, so the tethers are
// anchored in screen space and rebuilt every frame from the camera basis:
// the off-screen ends stay pinned to the viewport edges while the clamp
// points hold their position on screen — the surface turns beneath them,
// like magnetic clamps tracking the hull. Each tether is a cubic Bézier
// that approaches the sphere along its surface normal (plugged-in look).
//
// Rendering reuses the v7 toolkit wholesale: Line2 core+halo pairs with the
// cableFlow comet-pulse GLSL patched in (distance 0 at the off-screen end,
// so pulses travel toward the globe), and docking pads drawn the touchRipple
// way — an additive sphere shell shaded by angular distance from the pad
// direction. Geometry buffers are updated in place each frame (no allocs).

import {
  AdditiveBlending,
  Color,
  DynamicDrawUsage,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector2,
  Vector3,
  type PerspectiveCamera,
  type Scene,
  type WebGLRenderer,
} from "three";
import { Line2 } from "three/examples/jsm/lines/Line2.js";
import { LineGeometry } from "three/examples/jsm/lines/LineGeometry.js";
import { LineMaterial } from "three/examples/jsm/lines/LineMaterial.js";

// ── Tuning ──
const GLOBE_R = 100;
// Screen anchor (NDC, beyond ±1 = off-canvas) + clamp offset on the visible
// hemisphere (right/up coefficients mixed into the camera-facing direction).
// Each conduit carries one TM brand hue (V1 palette); the white-hot core and
// the docking pad are tinted from the same hue.
const TETHERS = [
  { nx: -1.25, ny: -0.75, a: -0.55, b: -0.22, color: "#F05A22" }, // lower-left — TM orange
  { nx: 1.25, ny: -0.75, a: 0.55, b: -0.22, color: "#2F86FF" }, // lower-right — brand blue
  { nx: -1.3, ny: 0.4, a: -0.68, b: 0.3, color: "#8FFF3F" }, // upper-left — status green
  { nx: 1.3, ny: 0.4, a: 0.68, b: 0.3, color: "#FF4D00" }, // upper-right — hot orange
  { nx: 0.0, ny: -1.3, a: 0.06, b: -0.72, color: "#0362A1" }, // bottom — deep brand blue
];
const POINTS = 36; // samples per Bézier (35 segments)
const SAG = 0.16; // downward bow, fraction of tether span
const APPROACH = 1.5; // 2nd control point at this × globe radius (normal approach)

// Core/pad tint: how far each tether's hue is pulled toward white.
const CORE_WHITEN = 0.78; // mostly white with a hint of the hue
const PAD_WHITEN = 0.45; // brighter, clearly-hued pad glow
const CORE_WIDTH = 1.8; // px
const HALO_WIDTH = 7; // px
const CORE_OPACITY = 0.8;
const HALO_OPACITY = 0.28;

// Comet pulses feeding into the globe (cf. cableFlow's wave, slightly faster).
const FLOW_WAVELENGTH = 20; // world units between pulses
const FLOW_SPEED = 26; // world units/sec toward the globe
const FLOW_AMP = 0.55;

// Docking pads — glow discs hugging the surface at the clamp points.
const PAD_RADIUS = 100.25; // shell radius (under the sweep at 100.3)
const PAD_ANGLE_DEG = 3.0; // disc angular radius
const PAD_PULSE_HZ = 0.35; // slow breathing
const PAD_ALPHA_BASE = 0.4;
const PAD_ALPHA_PULSE = 0.28;

const DEG = Math.PI / 180;

// ── cableFlow's comet-pulse patch, trimmed to the always-on flow ──
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
varying float vFlowDist;
`;

const FRAG_FLOW = /* glsl */ `
float flowP = fract( ( vFlowDist - flowTime ) / ${FLOW_WAVELENGTH.toFixed(1)} );
float flowPulse = pow( flowP, 3.0 ) * smoothstep( 1.0, 0.97, flowP );
float flowGain = ${(1 - FLOW_AMP).toFixed(2)} + ${FLOW_AMP.toFixed(2)} * 2.6 * flowPulse;
gl_FragColor = vec4( diffuseColor.rgb * flowGain, alpha * flowGain );
`;

type FlowLineMaterial = LineMaterial & {
  uniforms: Record<string, { value: number }>;
};

const WHITE = new Color("#FFFFFF");

function makeLineMaterial(
  color: Color,
  width: number,
  opacity: number,
): FlowLineMaterial {
  const mat = new LineMaterial({
    color: color.getHex(),
    linewidth: width,
    transparent: true,
    opacity,
    blending: AdditiveBlending,
    depthWrite: false,
  }) as FlowLineMaterial;
  const vert = mat.vertexShader;
  const frag = mat.fragmentShader;
  // Same anchors as cableFlow (three r182); on mismatch the tether still
  // renders, just without the travelling pulses.
  if (
    vert.includes(VERT_MAIN) &&
    frag.includes(FRAG_MAIN) &&
    frag.includes(FRAG_OUT)
  ) {
    mat.vertexShader = vert.replace(
      VERT_MAIN,
      `${VERT_DECLS}${VERT_MAIN}
vFlowDist = ( position.y < 0.5 ) ? instanceDistanceStart : instanceDistanceEnd;`,
    );
    mat.fragmentShader = frag
      .replace(FRAG_MAIN, `${FRAG_DECLS}${FRAG_MAIN}`)
      .replace(FRAG_OUT, FRAG_FLOW);
    mat.uniforms.flowTime = { value: 0 };
  }
  return mat;
}

// ── Docking pad shader (touchRipple's angular-distance construction) ──
const PAD_VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const PAD_FRAG = /* glsl */ `
uniform vec3 padColor;
uniform vec3 padDir;
uniform float padRadius;
uniform float padAlpha;
varying vec3 vPos;
void main() {
  float ang = acos( clamp( dot( normalize( vPos ), padDir ), -1.0, 1.0 ) );
  float disc = 1.0 - smoothstep( 0.0, padRadius, ang );
  float rim = 1.0 - smoothstep( 0.0, padRadius * 0.45, abs( ang - padRadius * 0.85 ) );
  float glow = disc * disc * 0.45 + rim * 0.75;
  gl_FragColor = vec4( padColor * glow * padAlpha, 1.0 );
}
`;

// Structural view of LineSegmentsGeometry's interleaved attributes, for the
// in-place per-frame updates.
type InterleavedAttr = {
  data: {
    array: Float32Array;
    needsUpdate: boolean;
    setUsage(usage: number): unknown;
  };
};

export interface IdleTethers {
  detach(): void;
}

/** Dock the globe: add the umbilical tethers to a mounted globe scene. */
export function attachIdleTethers(
  scene: Scene,
  camera: PerspectiveCamera,
  renderer: WebGLRenderer,
): IdleTethers {
  const padGeo = new SphereGeometry(PAD_RADIUS, 64, 48);

  interface Tether {
    geo: LineGeometry;
    core: Line2;
    halo: Line2;
    coreMat: FlowLineMaterial;
    haloMat: FlowLineMaterial;
    padMesh: Mesh;
    padMat: ShaderMaterial;
  }

  const tethers: Tether[] = TETHERS.map((cfg) => {
    const hue = new Color(cfg.color);
    const geo = new LineGeometry();
    geo.setPositions(new Float32Array(POINTS * 3));
    const haloMat = makeLineMaterial(hue, HALO_WIDTH, HALO_OPACITY);
    const coreMat = makeLineMaterial(
      hue.clone().lerp(WHITE, CORE_WHITEN),
      CORE_WIDTH,
      CORE_OPACITY,
    );
    const halo = new Line2(geo, haloMat);
    const core = new Line2(geo, coreMat);
    // Distance attributes for the flow varying; refreshed in place each frame.
    halo.computeLineDistances();
    for (const attr of ["instanceStart", "instanceDistanceStart"]) {
      (
        geo.attributes[attr] as unknown as InterleavedAttr
      ).data.setUsage(DynamicDrawUsage);
    }
    // Rebuilt every frame in camera space — skip stale-bounds culling.
    halo.frustumCulled = false;
    core.frustumCulled = false;
    halo.renderOrder = 1;
    core.renderOrder = 2;
    scene.add(halo);
    scene.add(core);

    const padMat = new ShaderMaterial({
      vertexShader: PAD_VERT,
      fragmentShader: PAD_FRAG,
      uniforms: {
        padColor: { value: hue.clone().lerp(WHITE, PAD_WHITEN) },
        padDir: { value: new Vector3(0, 1, 0) },
        padRadius: { value: PAD_ANGLE_DEG * DEG },
        padAlpha: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const padMesh = new Mesh(padGeo, padMat);
    padMesh.renderOrder = 2;
    scene.add(padMesh);

    return { geo, core, halo, coreMat, haloMat, padMesh, padMat };
  });

  // Per-frame scratch (allocated once).
  const right = new Vector3();
  const up = new Vector3();
  const facing = new Vector3();
  const e = new Vector3();
  const c1 = new Vector3();
  const c2 = new Vector3();
  const p = new Vector3();
  const clampDir = new Vector3();
  const size = new Vector2();
  const pts = new Float32Array(POINTS * 3);

  const start = performance.now();
  let raf = 0;
  const tick = (now: number) => {
    const elapsed = (now - start) / 1000;
    const flowTime = elapsed * FLOW_SPEED;

    // Camera basis — orbit controls keep the camera aimed at the origin, so
    // the view plane through the globe centre spans (right, up) and NDC maps
    // to it via the frustum half-extents at the camera's distance.
    camera.updateMatrixWorld();
    const m = camera.matrixWorld.elements;
    right.set(m[0], m[1], m[2]);
    up.set(m[4], m[5], m[6]);
    facing.copy(camera.position).normalize();
    const dist = camera.position.length();
    const halfH = Math.tan((camera.fov * Math.PI) / 360) * dist;
    const halfW = halfH * camera.aspect;
    renderer.getSize(size);

    for (let ti = 0; ti < tethers.length; ti++) {
      const cfg = TETHERS[ti];
      const t = tethers[ti];

      // Off-screen end, clamp point, and the Bézier frame between them.
      e.copy(right)
        .multiplyScalar(cfg.nx * halfW)
        .addScaledVector(up, cfg.ny * halfH);
      clampDir
        .copy(facing)
        .addScaledVector(right, cfg.a)
        .addScaledVector(up, cfg.b)
        .normalize();
      p.copy(clampDir).multiplyScalar(GLOBE_R * 1.002);
      c2.copy(clampDir).multiplyScalar(GLOBE_R * APPROACH);
      c1.copy(e)
        .lerp(p, 0.35)
        .addScaledVector(up, -SAG * e.distanceTo(p));

      // Sample the curve, then write segment pairs + cumulative distances
      // straight into the interleaved buffers.
      for (let i = 0; i < POINTS; i++) {
        const s = i / (POINTS - 1);
        const u = 1 - s;
        const w0 = u * u * u;
        const w1 = 3 * u * u * s;
        const w2 = 3 * u * s * s;
        const w3 = s * s * s;
        pts[i * 3] = w0 * e.x + w1 * c1.x + w2 * c2.x + w3 * p.x;
        pts[i * 3 + 1] = w0 * e.y + w1 * c1.y + w2 * c2.y + w3 * p.y;
        pts[i * 3 + 2] = w0 * e.z + w1 * c1.z + w2 * c2.z + w3 * p.z;
      }
      const posBuf = (
        t.geo.attributes.instanceStart as unknown as InterleavedAttr
      ).data;
      const distBuf = (
        t.geo.attributes.instanceDistanceStart as unknown as InterleavedAttr
      ).data;
      let cum = 0;
      for (let i = 0; i < POINTS - 1; i++) {
        const a0 = i * 3;
        const b0 = (i + 1) * 3;
        posBuf.array[i * 6] = pts[a0];
        posBuf.array[i * 6 + 1] = pts[a0 + 1];
        posBuf.array[i * 6 + 2] = pts[a0 + 2];
        posBuf.array[i * 6 + 3] = pts[b0];
        posBuf.array[i * 6 + 4] = pts[b0 + 1];
        posBuf.array[i * 6 + 5] = pts[b0 + 2];
        const dx = pts[b0] - pts[a0];
        const dy = pts[b0 + 1] - pts[a0 + 1];
        const dz = pts[b0 + 2] - pts[a0 + 2];
        const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
        distBuf.array[i * 2] = cum;
        distBuf.array[i * 2 + 1] = cum + len;
        cum += len;
      }
      posBuf.needsUpdate = true;
      distBuf.needsUpdate = true;

      for (const mat of [t.coreMat, t.haloMat]) {
        mat.resolution.set(size.x, size.y);
        if (mat.uniforms.flowTime) mat.uniforms.flowTime.value = flowTime;
      }

      (t.padMat.uniforms.padDir.value as Vector3).copy(clampDir);
      t.padMat.uniforms.padAlpha.value =
        PAD_ALPHA_BASE +
        PAD_ALPHA_PULSE *
          Math.sin(elapsed * PAD_PULSE_HZ * 2 * Math.PI + ti * 1.9);
    }

    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return {
    detach() {
      cancelAnimationFrame(raf);
      for (const t of tethers) {
        scene.remove(t.core);
        scene.remove(t.halo);
        scene.remove(t.padMesh);
        t.geo.dispose();
        t.coreMat.dispose();
        t.haloMat.dispose();
        t.padMat.dispose();
      }
      padGeo.dispose();
    },
  };
}
