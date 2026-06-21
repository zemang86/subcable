// Touch ripple for the hologram globe.
//
// Tapping the globe spawns an expanding ring on the sphere's surface at
// the tapped geographic point — the finger visibly disturbs the hologram.
// Fired from onGlobeClick, it covers exactly the taps that otherwise give
// no feedback (open ocean, near-misses), which matters on a kiosk where
// people doubt the screen registered them.
//
// Same construction as the rim/sweep shells: an additive sphere mesh whose
// fragment shader draws a ring by angular distance from the tap direction,
// so the ripple follows the sphere's curvature exactly and the opaque globe
// depth-tests away the far hemisphere. A pool of 3 shells handles fast
// repeat taps (a 4th tap recycles the oldest ring mid-flight).

import {
  AdditiveBlending,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
  type Scene,
} from "three";

// ── Tuning ──
// Between the scan sweep (100.3) and the fresnel rim (100.4).
const RIPPLE_RADIUS = 100.35;
const RIPPLE_COLOR = "#2F86FF"; // the hologram electric blue
const RIPPLE_DURATION_MS = 620;
const MAX_ANGLE_DEG = 9; // final ring radius (~10mm of screen at default zoom)
const RING_WIDTH_DEG = 1.6; // half-width of the ring band
const START_ALPHA = 0.85;
const POOL_SIZE = 3;

const DEG = Math.PI / 180;

const VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAG = /* glsl */ `
uniform vec3 ringColor;
uniform vec3 tapDir;
uniform float ringRadius;
uniform float ringWidth;
uniform float ringAlpha;
varying vec3 vPos;
void main() {
  float ang = acos( clamp( dot( normalize( vPos ), tapDir ), -1.0, 1.0 ) );
  float ring = 1.0 - smoothstep( 0.0, ringWidth, abs( ang - ringRadius ) );
  gl_FragColor = vec4( ringColor * ring * ringAlpha, 1.0 );
}
`;

// three-globe's polar2Cartesian convention (GLOBE_RADIUS-relative).
function latLngToDir(lat: number, lng: number, out: Vector3): Vector3 {
  const phi = (90 - lat) * DEG;
  const theta = (90 - lng) * DEG;
  const phiSin = Math.sin(phi);
  return out.set(
    phiSin * Math.cos(theta),
    Math.cos(phi),
    phiSin * Math.sin(theta),
  );
}

export interface TouchRipple {
  /** Spawn a ripple at a geographic point (raycast tap location). */
  spawn(lat: number, lng: number): void;
  detach(): void;
}

/** Add the touch-ripple pool to a mounted globe scene. */
export function attachTouchRipple(scene: Scene): TouchRipple {
  const geo = new SphereGeometry(RIPPLE_RADIUS, 64, 48);

  interface Slot {
    mesh: Mesh;
    mat: ShaderMaterial;
    startedAt: number; // 0 = idle
  }
  const pool: Slot[] = [];
  for (let i = 0; i < POOL_SIZE; i++) {
    const mat = new ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        ringColor: { value: new Color(RIPPLE_COLOR) },
        tapDir: { value: new Vector3(0, 1, 0) },
        ringRadius: { value: 0 },
        ringWidth: { value: RING_WIDTH_DEG * DEG },
        ringAlpha: { value: 0 },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    });
    const mesh = new Mesh(geo, mat);
    mesh.renderOrder = 2;
    mesh.visible = false;
    scene.add(mesh);
    pool.push({ mesh, mat, startedAt: 0 });
  }

  let raf = 0;
  const tick = (now: number) => {
    raf = 0;
    let anyAlive = false;
    for (const slot of pool) {
      if (!slot.startedAt) continue;
      const t = (now - slot.startedAt) / RIPPLE_DURATION_MS;
      if (t >= 1) {
        slot.startedAt = 0;
        slot.mesh.visible = false;
        continue;
      }
      anyAlive = true;
      // Radius eases out (fast launch, soft landing); alpha fades linearly
      // after a brief full-strength hold so quick taps still read.
      const eased = 1 - Math.pow(1 - t, 3);
      slot.mat.uniforms.ringRadius.value = eased * MAX_ANGLE_DEG * DEG;
      slot.mat.uniforms.ringAlpha.value =
        START_ALPHA * Math.min(1, (1 - t) / 0.75);
    }
    if (anyAlive) raf = requestAnimationFrame(tick);
  };

  return {
    spawn(lat: number, lng: number) {
      // Free slot, else the longest-running ring gets recycled.
      let slot = pool[0];
      for (const s of pool) {
        if (!s.startedAt) {
          slot = s;
          break;
        }
        if (s.startedAt < slot.startedAt) slot = s;
      }
      latLngToDir(lat, lng, slot.mat.uniforms.tapDir.value as Vector3);
      slot.startedAt = performance.now();
      slot.mesh.visible = true;
      slot.mat.uniforms.ringRadius.value = 0;
      slot.mat.uniforms.ringAlpha.value = START_ALPHA;
      if (!raf) raf = requestAnimationFrame(tick);
    },
    detach() {
      if (raf) cancelAnimationFrame(raf);
      for (const slot of pool) {
        scene.remove(slot.mesh);
        slot.mat.dispose();
      }
      geo.dispose();
    },
  };
}
