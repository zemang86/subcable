// Hologram rim light for the globe.
//
// A thin fresnel shell over the sphere: brightness rises as the surface
// turns away from the camera, so the silhouette catches a crisp electric
// edge while the face stays dark — the projected-hologram look. This is
// the inner, sharp counterpart to the stock three-globe atmosphere (which
// stays on and provides the soft OUTER falloff beyond the silhouette).
//
// One static additive mesh, no per-frame JS — the view-angle term is
// evaluated in the shader, so the rim tracks every camera move for free.

import {
  AdditiveBlending,
  Color,
  Mesh,
  ShaderMaterial,
  SphereGeometry,
  type Scene,
} from "three";

// ── Tuning ──
// Globe radius is 100 world units; the shell sits just above the surface
// (and above the country-fill caps at 100.2) so the rim reads as the
// sphere's own edge, not a detached ring.
const RIM_RADIUS = 100.4;
// Brighter electric blue than the deep v1 atmosphere (#034DA1) — at fresnel
// grazing angles a dark colour vanishes; the rim needs its own luminance.
const RIM_COLOR = "#2F86FF";
// Falloff exponent: higher = the glow hugs the silhouette tighter.
const RIM_POWER = 3.5;
const RIM_INTENSITY = 1.15;

const VERT = /* glsl */ `
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  vNormal = normalize( normalMatrix * normal );
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  vViewDir = normalize( -mvPosition.xyz );
  gl_Position = projectionMatrix * mvPosition;
}
`;

const FRAG = /* glsl */ `
uniform vec3 rimColor;
uniform float rimPower;
uniform float rimIntensity;
varying vec3 vNormal;
varying vec3 vViewDir;
void main() {
  float facing = abs( dot( normalize( vNormal ), normalize( vViewDir ) ) );
  float fresnel = pow( 1.0 - facing, rimPower );
  gl_FragColor = vec4( rimColor * fresnel * rimIntensity, 1.0 );
}
`;

/** Add the fresnel rim shell to a mounted globe scene. Returns cleanup. */
export function attachHologramRim(scene: Scene): () => void {
  const geo = new SphereGeometry(RIM_RADIUS, 64, 48);
  const mat = new ShaderMaterial({
    vertexShader: VERT,
    fragmentShader: FRAG,
    uniforms: {
      rimColor: { value: new Color(RIM_COLOR) },
      rimPower: { value: RIM_POWER },
      rimIntensity: { value: RIM_INTENSITY },
    },
    transparent: true,
    blending: AdditiveBlending,
    // Additive shell must never occlude — the opaque globe still depth-tests
    // away the far hemisphere, leaving only the visible silhouette ring.
    depthWrite: false,
  });
  const rim = new Mesh(geo, mat);
  rim.renderOrder = 2;
  scene.add(rim);
  return () => {
    scene.remove(rim);
    geo.dispose();
    mat.dispose();
  };
}
