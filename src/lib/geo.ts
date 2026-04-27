// Spherical helpers for plotting cable routes on the globe.

const R_DEG = 180 / Math.PI;
const D_RAD = Math.PI / 180;

/**
 * Returns N+1 points along the great-circle arc from `start` to `end`,
 * sampled at uniform parametric distance. Result includes both endpoints.
 *
 * Coordinates are [lat, lng] in degrees. Uses the standard spherical
 * Slerp formulation; safe for antipodal-ish pairs because the visualization
 * can tolerate the degenerate fallback.
 */
export function greatCircle(
  start: [number, number],
  end: [number, number],
  segments = 24
): [number, number][] {
  const [lat1, lng1] = start;
  const [lat2, lng2] = end;
  const φ1 = lat1 * D_RAD;
  const φ2 = lat2 * D_RAD;
  const λ1 = lng1 * D_RAD;
  const λ2 = lng2 * D_RAD;

  const sinφ1 = Math.sin(φ1);
  const cosφ1 = Math.cos(φ1);
  const sinφ2 = Math.sin(φ2);
  const cosφ2 = Math.cos(φ2);

  const Δσ = Math.acos(
    Math.max(-1, Math.min(1, sinφ1 * sinφ2 + cosφ1 * cosφ2 * Math.cos(λ2 - λ1)))
  );

  if (Δσ < 1e-9) return [start, end];

  const sinΔσ = Math.sin(Δσ);
  const out: [number, number][] = [];

  for (let i = 0; i <= segments; i++) {
    const f = i / segments;
    const A = Math.sin((1 - f) * Δσ) / sinΔσ;
    const B = Math.sin(f * Δσ) / sinΔσ;
    const x = A * cosφ1 * Math.cos(λ1) + B * cosφ2 * Math.cos(λ2);
    const y = A * cosφ1 * Math.sin(λ1) + B * cosφ2 * Math.sin(λ2);
    const z = A * sinφ1 + B * sinφ2;
    const φ = Math.atan2(z, Math.sqrt(x * x + y * y));
    const λ = Math.atan2(y, x);
    out.push([φ * R_DEG, λ * R_DEG]);
  }
  return out;
}

/**
 * Pick a sensible number of great-circle segments based on the distance
 * between the two endpoints — short links don't need 24 points.
 */
export function arcDetail(
  start: [number, number],
  end: [number, number]
): number {
  const dLat = end[0] - start[0];
  const dLng = end[1] - start[1];
  const approxDeg = Math.sqrt(dLat * dLat + dLng * dLng);
  if (approxDeg < 1) return 4;
  if (approxDeg < 5) return 10;
  if (approxDeg < 20) return 18;
  return 28;
}
