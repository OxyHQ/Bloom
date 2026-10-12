import { Triangle, Vector3 } from 'three';
import type { BufferGeometry } from 'three';

/** Closest point on the actual triangles, with the authored smooth normal.
 * Concavities and wire bodies cannot use a radius from the bounding-box center. */
export function tuftSurface(geometry: BufferGeometry, point: readonly number[]) {
  const positions = geometry.getAttribute('position'),
    normals = geometry.getAttribute('normal'),
    indices = geometry.getIndex();
  const query = new Vector3().fromArray(point),
    triangle = new Triangle(),
    candidate = new Vector3(),
    barycentric = new Vector3(),
    normal = new Vector3(),
    bestPoint = new Vector3(),
    bestNormal = new Vector3();
  let nearest = Infinity;
  const count = indices?.count ?? positions.count;
  for (let at = 0; at + 2 < count; at += 3) {
    const ids = [0, 1, 2].map((k) => (indices ? indices.getX(at + k) : at + k));
    triangle.a.fromBufferAttribute(positions, ids[0]!);
    triangle.b.fromBufferAttribute(positions, ids[1]!);
    triangle.c.fromBufferAttribute(positions, ids[2]!);
    triangle.getNormal(normal);
    if (normal.lengthSq() === 0) continue;
    triangle.closestPointToPoint(query, candidate);
    const distance = candidate.distanceToSquared(query);
    if (distance >= nearest) continue;
    if (normals) {
      triangle.getBarycoord(candidate, barycentric);
      normal.set(0, 0, 0);
      for (let k = 0; k < 3; k++)
        normal.addScaledVector(
          new Vector3().fromBufferAttribute(normals, ids[k]!),
          barycentric.getComponent(k),
        );
      if (normal.lengthSq() < 1e-20) triangle.getNormal(normal);
    }
    nearest = distance;
    bestPoint.copy(candidate);
    bestNormal.copy(normal).normalize();
  }
  if (!Number.isFinite(nearest)) throw Error('Tuft requires a nondegenerate body surface');
  return { point: bestPoint.toArray(), normal: bestNormal.toArray() };
}
