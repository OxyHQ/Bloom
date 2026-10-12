import { BufferAttribute, InstancedBufferGeometry, IntType } from 'three';
import { bodyFront, type CatalogAssembly, type CatalogPiece } from './catalog-fitting';
import type { FaceRig } from '../../src/agent-avatar/expression-rig';

/** Saved Alien face parameters. Geometry is built once, with two native blink
 * targets; the renderer and per-instance motion remain the shared 3D engine. */
export type AlienFace = {
  size: number;
  gap: number;
  tilt: number;
  light: boolean;
  rig: FaceRig;
};

export function constructAlienEye(
  body: CatalogAssembly,
  fitted: CatalogPiece,
  face: AlienFace,
  side: -1 | 1,
): CatalogPiece {
  const rig = face.rig;
  const halfWidth = Math.min(face.size * 1.06 * (rig.width / 0.45) ** 0.25, face.gap * 0.43) / 83;
  const height = Math.max(1.2, face.size * 0.6 * (side < 0 ? rig.leftOpen : rig.rightOpen)) / 83;
  const angle = -(
    (side < 0 ? rig.leftAngle : rig.rightAngle) +
    0.08 -
    side * 0.4 +
    face.tilt +
    rig.headTilt
  );
  const center = [(side * face.gap) / 166 + rig.lookX / 83, (9 - rig.lookY) / 83];
  const c = Math.cos(angle),
    s = Math.sin(angle);
  const front = bodyFront(body, center[0]!, center[1]!);
  const fallback = Number.isFinite(front) ? front : fitted.pivot[2]!;
  // Two parabolic arcs reproduce the original almond outline and expression.
  const outline = [[0, 0]];
  for (const edge of [-1, 1])
    for (let j = 0; j < 32; j++) {
      const t = edge < 0 ? j / 32 : 1 - j / 32;
      const arch = 4 * t * (1 - t);
      const downY =
        edge < 0
          ? -height * arch
          : height * arch * (1 - 2 * rig.smile) + rig.smile * (4 / 83) * arch;
      outline.push([-halfWidth + 2 * halfWidth * t, -downY]);
    }
  const positions = (closure: number) => {
    const values = new Float32Array(outline.length * 3);
    for (const [index, [x, y]] of outline.entries()) {
      const localY = y! * (1 - closure) + y! * closure * 0.035;
      const atX = center[0]! + c * x! - s * localY;
      const atY = center[1]! + s * x! + c * localY;
      const surface = bodyFront(body, atX, atY);
      values.set(
        [
          atX,
          atY,
          (Number.isFinite(surface) ? surface : fallback) + 0.012 + (index === 0 ? 0.028 : 0),
        ],
        index * 3,
      );
    }
    return values;
  };
  const base = positions(0),
    half = positions(0.5),
    shut = positions(1);
  const geometry = new InstancedBufferGeometry();
  const indices: number[] = [];
  for (let i = 1; i < outline.length; i++) indices.push(0, i === outline.length - 1 ? 1 : i + 1, i);
  geometry.setIndex(indices);
  const normals = (values: Float32Array) => {
    geometry.setAttribute('position', new BufferAttribute(values, 3));
    geometry.computeVertexNormals();
    return new Float32Array(geometry.getAttribute('normal').array);
  };
  const n0 = normals(half),
    shutNormal = normals(shut),
    normal = normals(base);
  const n1 = shutNormal.map((v, i) => normal[i]! + v - n0[i]!);
  const delta0 = half.map((value, i) => value - base[i]!);
  const delta1 = shut.map((value, i) => value - half[i]!);
  geometry.setAttribute('position', new BufferAttribute(base, 3));
  for (const [name, array] of Object.entries({
    normal,
    normal0: n0,
    normal1: n1,
    delta0,
    delta1,
  }))
    geometry.setAttribute(name, new BufferAttribute(array, 3));
  const count = outline.length;
  geometry.setAttribute('authoredResponse', new BufferAttribute(new Float32Array(count * 2), 2));
  const palette = new Float32Array(count * 4);
  for (let i = 0; i < count; i++)
    palette.set([0, normal[i * 3]!, normal[i * 3 + 1]!, normal[i * 3 + 2]!], i * 4);
  geometry.setAttribute('paletteGeometry', new BufferAttribute(palette, 4));
  const joints = new BufferAttribute(new Uint16Array(count * 4), 4);
  joints.gpuType = IntType;
  geometry.setAttribute('skinJoints', joints);
  geometry.setAttribute('skinWeights', new BufferAttribute(new Float32Array(count * 4), 4));
  geometry.computeBoundingBox();
  const box = geometry.boundingBox!;
  const rgb = face.light ? [0.975, 0.968, 0.951] : [0.005, 0.005, 0.009];
  return {
    ...fitted,
    geometry,
    bounds: { min: box.min.toArray(), max: box.max.toArray() },
    pivot: [center[0]!, center[1]!, fallback + 0.012],
    kind: 0,
    universal: false,
    doubleSided: true,
    label: 'Alien almond eye',
    fields: {
      ...fitted.fields,
      colorRoughness: [...rgb, 0.24],
      signatureDeform: [0, 0, 0, 0],
    },
  };
}
