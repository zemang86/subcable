// Scanline sweep for the hologram globe.
//
// A meridian-aligned band of light that circles the sphere continuously —
// a sharp leading edge with a soft tail trailing behind it, like a radar
// sweep unrolled onto the planet. Same shell construction as the fresnel
// rim (additive, depthWrite off): the opaque globe depth-tests away the
// far hemisphere, so the band is only visible while crossing the near
// face, which makes each pass read as "the machine scans the planet".
//
// Cost: one sphere draw + a single uniform write per frame.

import {
  AdditiveBlending,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  type Scene,
} from "three";

// ── Tuning ──
// Slightly below the fresnel rim shell (100.4) so the two never z-overlap.
const SWEEP_RADIUS = 100.3;
const SWEEP_PERIOD_SEC = 20; // one full revolution
const SWEEP_COLOR = "#2F86FF"; // matches the rim's electric blue
// Head line: thin bright leading edge. Tail: soft falloff behind it.
const HEAD_WIDTH_DEG = 2;
const TAIL_WIDTH_DEG = 28;
const HEAD_INTENSITY = 0.4;
const TAIL_INTENSITY = 0.14;

const DEG = Math.PI / 180;

const VERT = /* glsl */ `
varying vec3 vPos;
void main() {
  vPos = position;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
}
`;

const FRAG = /* glsl */ `
uniform vec3 sweepColor;
uniform float sweepAngle;
uniform float headWidth;
uniform float tailWidth;
uniform float headIntensity;
uniform float tailIntensity;
varying vec3 vPos;
void main() {
  float lng = atan( vPos.z, vPos.x );
  // Angular distance BEHIND the sweep head, wrapped to [0, 2π).
  float d = mod( sweepAngle - lng, 6.28318530718 );
  float head = ( 1.0 - smoothstep( 0.0, headWidth, d ) ) * headIntensity;
  float tail = ( 1.0 - smoothstep( headWidth, tailWidth, d ) ) * tailIntensity;
  gl_FragColor = vec4( sweepColor * ( head + tail ), 1.0 );
}
`;

/** Add the rotating scan sweep to a mounted globe scene. Returns cleanup. */
export function attachScanSweep(scene: Scene): () => void {
  const geo = new SphereGeometry(SWEEP_RADIUS, 64, 48);
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      sweepColor: { value: new Color(SWEEP_COLOR) },
      sweepAngle: { value: 0 },
      headWidth: { value: HEAD_WIDTH_DEG * DEG },
      tailWidth: { value: TAIL_WIDTH_DEG * DEG },
      headIntensity: { value: HEAD_INTENSITY },
      tailIntensity: { value: TAIL_INTENSITY },
    },
    transparent: true,
    blending: AdditiveBlending,
    depthWrite: false,
  });
  const sweep = new Mesh(geo, mat);
  sweep.renderOrder = 2;
  scene.add(sweep);

  let raf = 0;
  const start = performance.now();
  const tick = (now: number) => {
    mat.uniforms.sweepAngle.value =
      (((now - start) / 1000) * Math.PI * 2) / SWEEP_PERIOD_SEC;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);

  return () => {
    cancelAnimationFrame(raf);
    scene.remove(sweep);
    geo.dispose();
    mat.dispose();
  };
}
