import type { VectorData } from './vector-types';
export type VectorLook = { yaw: number; pitch: number; mix: number };
type Face = NonNullable<VectorData['referenceFace']>;
const v = (p: number[], i: number) => p[i] ?? 0;
function rotate(p: number[], q: number[]) {
  const [x = 0, y = 0, z = 0, w = 1] = q,
    [px = 0, py = 0, pz = 0] = p;
  const tx = 2 * (y * pz - z * py),
    ty = 2 * (z * px - x * pz),
    tz = 2 * (x * py - y * px);
  return [
    px + w * tx + y * tz - z * ty,
    py + w * ty + z * tx - x * tz,
    pz + w * tz + x * ty - y * tx,
  ];
}
/** A single tangent plane per attachment preserves rigid lenses/capsules. */
export function referenceFaceDepth(
  face: Face,
  x: number,
  y: number,
  anchorX = x,
  anchorY = y,
): number {
  const plane = face.eyePlanes?.reduce((best, p) =>
    Math.hypot(v(p.center, 0) - anchorX, v(p.center, 1) - anchorY) <
    Math.hypot(v(best.center, 0) - anchorX, v(best.center, 1) - anchorY)
      ? p
      : best,
  );
  if (!plane) return 0.24;
  return (
    v(plane.center, 2) -
    ((x - v(plane.center, 0)) * v(plane.normal, 0) +
      (y - v(plane.center, 1)) * v(plane.normal, 1)) /
      Math.max(0.05, v(plane.normal, 2))
  );
}
/** Absolute target gaze blends from the authored head orientation, never adds to it. */
export function prepareReferenceFaceProjection(
  face: Face,
  look: VectorLook,
): (point: number[]) => number[] {
  const basis = face.restBasis,
    rest = face.restQuaternion;
  if (!basis || !rest || look.mix <= 0) return (point) => point;
  const mix = Math.max(0, Math.min(1, Number.isFinite(look.mix) ? look.mix : 0));
  const yaw = Math.max(-0.6, Math.min(0.6, Number.isFinite(look.yaw) ? look.yaw : 0)),
    pitch = Math.max(-0.45, Math.min(0.45, Number.isFinite(look.pitch) ? look.pitch : 0));
  const sy = Math.sin(yaw / 2),
    cy = Math.cos(yaw / 2),
    sx = Math.sin(pitch / 2),
    cx = Math.cos(pitch / 2);
  const target = [sx * cy, cx * sy, sx * sy, cx * cy];
  const sign = rest.reduce((n, c, i) => n + c * v(target, i), 0) < 0 ? -1 : 1;
  const q = rest.map((c, i) => c * (1 - mix) + v(target, i) * mix * sign),
    length = Math.hypot(...q) || 1;
  const normalized = q.map((c) => c / length);
  return (point) => {
    const source = [v(point, 0) - face.center[0], v(point, 1) - face.center[1], v(point, 2)];
    const neutral = [0, 1, 2].map(
      (i) =>
        v(basis, i * 3) * v(source, 0) +
        v(basis, i * 3 + 1) * v(source, 1) +
        v(basis, i * 3 + 2) * v(source, 2),
    );
    const result = rotate(neutral, normalized);
    return [v(result, 0) + face.center[0], v(result, 1) + face.center[1], v(result, 2)];
  };
}
export function projectReferenceFacePoint(face: Face, point: number[], look: VectorLook): number[] {
  return prepareReferenceFaceProjection(face, look)(point);
}

/** Headwear turns as one rigid object about the body, never about an eye tangent. */
export function prepareReferenceHeadProjection(
  face: Face,
  look: VectorLook,
): (point: number[]) => number[] {
  const amount = Math.max(0, Math.min(1, Number.isFinite(look.mix) ? look.mix : 0));
  if (amount === 0) return (point) => point;
  const yaw = Math.max(-0.6, Math.min(0.6, Number.isFinite(look.yaw) ? look.yaw : 0));
  const pitch = Math.max(-0.45, Math.min(0.45, Number.isFinite(look.pitch) ? look.pitch : 0));
  const sy = Math.sin(yaw / 2),
    cy = Math.cos(yaw / 2);
  const sx = Math.sin(pitch / 2),
    cx = Math.cos(pitch / 2);
  const q = [sx * cy * amount, cx * sy * amount, sx * sy * amount, 1 + (cx * cy - 1) * amount];
  const length = Math.hypot(...q);
  const normalized = q.map((value) => value / length);
  return (point) => {
    const p = rotate(
      [v(point, 0) - face.center[0], v(point, 1) - face.center[1], v(point, 2)],
      normalized,
    );
    return [v(p, 0) + face.center[0], v(p, 1) + face.center[1], v(p, 2)];
  };
}
export function projectReferenceHeadPoint(face: Face, point: number[], look: VectorLook): number[] {
  return prepareReferenceHeadProjection(face, look)(point);
}
