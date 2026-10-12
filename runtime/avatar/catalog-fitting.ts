import type { AuthoredPart } from './catalog';
import type { TuftLayout } from './catalog-layout';
import { Matrix4, Triangle, Vector3 } from 'three';

export type Bounds = { min: number[]; max: number[] };
export type FaceLayout = { centers: number[][]; radius: number };
export type CatalogPiece = AuthoredPart & {
  bounds: Bounds;
  category: 'body' | 'eyes' | 'eyewear' | 'accessory';
  selection: string;
  pivot: number[];
  attachmentPivot?: number[] | null;
};
export type CatalogAssembly = {
  body: CatalogPiece;
  pieces: CatalogPiece[];
  face: FaceLayout;
};
export type PieceTransform = {
  part: CatalogPiece;
  scale: number;
  /** Radians about origin; applied after uniform scale, before translate. */
  rotationZ?: number;
  origin: number[];
  translate: number[];
  attachmentRoot?: number[];
};
const fail = (message: string): never => {
  throw Error(`Avatar catalog: ${message}`);
};
const midpoint = (b: Bounds, k: number) => (b.min[k]! + b.max[k]!) / 2;
const union = (parts: { bounds: Bounds }[]): Bounds => ({
  min: [0, 1, 2].map((k) => Math.min(...parts.map((p) => p.bounds.min[k]!))),
  max: [0, 1, 2].map((k) => Math.max(...parts.map((p) => p.bounds.max[k]!))),
});
const eyePieces = (a: CatalogAssembly) =>
  a.pieces.filter(
    (p) => p.category === 'eyes' && p.attachment !== 'brows' && !p.fur,
  );
function eyeCenters(a: CatalogAssembly): Bounds[] {
  const eyes = eyePieces(a);
  const sides = [-1, 1].map((sign) =>
    eyes.filter((p) => Math.sign(midpoint(p.bounds, 0)) === sign),
  );
  if (sides.some((side) => !side.length)) fail('catalog face anchors missing');
  return sides.map(union);
}
/** Indexed surface intersection uses the real body, including open silhouettes. */
export function bodyFront(a: CatalogAssembly, x: number, y: number): number {
  const position = a.body.geometry.getAttribute('position');
  const indices = a.body.geometry.getIndex();
  if (!indices) return -Infinity;
  let front = -Infinity;
  for (let i = 0; i < indices.count; i += 3) {
    const points = [0, 1, 2].map((k) => {
      const index = indices.getX(i + k);
      return [position.getX(index), position.getY(index), position.getZ(index)];
    });
    const [a, b, c] = points as [number[], number[], number[]];
    const det =
      (b[1]! - c[1]!) * (a[0]! - c[0]!) + (c[0]! - b[0]!) * (a[1]! - c[1]!);
    if (Math.abs(det) < 1e-12) continue;
    const u =
      ((b[1]! - c[1]!) * (x - c[0]!) + (c[0]! - b[0]!) * (y - c[1]!)) / det;
    const v =
      ((c[1]! - a[1]!) * (x - c[0]!) + (a[0]! - c[0]!) * (y - c[1]!)) / det;
    const w = 1 - u - v;
    if (Math.min(u, v, w) >= -1e-6)
      front = Math.max(front, u * a[2]! + v * b[2]! + w * c[2]!);
  }
  return front;
}
export function fitCatalogPieces(
  target: CatalogAssembly,
  donor: CatalogAssembly,
  category: 'eyes' | 'eyewear' | 'accessory',
  id: string,
  {
    singleEye = false,
    faceLayout,
    tuftLayout,
  }: {
    singleEye?: boolean;
    faceLayout?: FaceLayout;
    tuftLayout?: TuftLayout;
  } = {},
) {
  const selected =
    category === 'eyes'
      ? eyePieces(donor)
      : donor.pieces.filter(
          (p) => p.category === category && p.selection === id && !p.fur,
        );
  if (!selected.length) fail(`missing catalog ${category}:${id}`);
  const bodyWidth = (info: CatalogAssembly) =>
    info.body.bounds.max[0]! - info.body.bounds.min[0]!;
  if (category === 'eyes' || category === 'eyewear') {
    // A Cyclops face has one actual eye, not a collapsed left/right pair.
    // Monocles surround its full eye. Two-lens styles retain both native lenses,
    // fitted to the two halves of that eye rather than the discarded old face.
    const singleBounds = singleEye ? union(eyePieces(target)) : null;
    const dst = singleBounds
        ? id === 'monocle'
          ? [singleBounds, singleBounds]
          : [0, 1].map((side) => ({
              min: singleBounds.min.map((value, k) =>
                k === 0 && side === 1 ? midpoint(singleBounds, 0) : value,
              ),
              max: singleBounds.max.map((value, k) =>
                k === 0 && side === 0 ? midpoint(singleBounds, 0) : value,
              ),
            }))
        : category === 'eyes' && faceLayout
          ? faceLayout.centers.map((center) => {
              const [x, y, z] = center as [number, number, number];
              return {
                min: [x - faceLayout.radius, y - faceLayout.radius, z],
                max: [
                  x + faceLayout.radius,
                  y + faceLayout.radius,
                  z + faceLayout.radius,
                ],
              };
            })
          : eyeCenters(target),
      src = eyeCenters(donor);
    const gap = (a: Bounds[]) =>
      Math.abs(midpoint(a[1]!, 0) - midpoint(a[0]!, 0));
    // Eye diameter follows the body, not the spacing of the old eye pair.
    // Todd's stalks have over twice the neutral face gap on the same size body.
    const clippo =
      target.body.attachment === 'metal' || target.body.label === 'metal';
    const scale =
      category === 'eyes'
        ? faceLayout
          ? faceLayout.radius /
            (src.reduce(
              (sum, b) =>
                sum +
                Math.max(b.max[0]! - b.min[0]!, b.max[1]! - b.min[1]!) / 2,
              0,
            ) /
              2)
          : clippo
            ? 1
            : Math.max(
                0.65,
                Math.min(1.2, bodyWidth(target) / bodyWidth(donor)),
              )
        : Math.max(0.25, Math.min(2, gap(dst) / gap(src)));
    if (category === 'eyes') {
      const fronts = dst.map((bounds) =>
        bodyFront(target, midpoint(bounds, 0), midpoint(bounds, 1)),
      );
      return selected.map((part) => {
        const side = midpoint(part.bounds, 0) < 0 ? 0 : 1;
        const origin = [0, 1, 2].map((k) => midpoint(src[side]!, k));
        const translate = [0, 1].map(
          (k) => midpoint(dst[side]!, k) - origin[k]!,
        );
        const depth = (src[side]!.max[2]! - src[side]!.min[2]!) * scale;
        const front = fronts[side]!;
        // Keep some embedding, while the majority of a shallow native eye
        // remains outside the real face. Open Clippo holes return no surface.
        const back = Math.max(dst[side]!.min[2]!, front - depth * 0.35);
        translate.push(
          back - (src[side]!.min[2]! - origin[2]!) * scale - origin[2]!,
        );
        return { part, scale, origin, translate };
      });
    }
    const middle = [0, 1, 2].map(
      (k) => (midpoint(src[0]!, k) + midpoint(src[1]!, k)) / 2,
    );
    const destination = [0, 1, 2].map(
      (k) => (midpoint(dst[0]!, k) + midpoint(dst[1]!, k)) / 2,
    );
    const sideParts = [0, 1].map((side) =>
      selected.filter(
        (p) =>
          Math.abs(midpoint(p.bounds, 0) - middle[0]!) > gap(src) * 0.15 &&
          (midpoint(p.bounds, 0) < middle[0]! ? 0 : 1) === side,
      ),
    );
    const frontBounds = sideParts.map((parts) => {
      if (!parts.length) return null;
      const z = Math.max(...parts.map((p) => p.bounds.max[2]!));
      return union(parts.filter((p) => p.bounds.max[2]! > z - 0.05));
    });
    // Sunglasses can be a single centered mesh, including both temples.
    // Its full minimum Z is the rear of the temples, not the front lens plane.
    // Use the same frontmost 0.05-unit band as the separate-lens classifier.
    const separateFronts = frontBounds.filter(
      (bounds): bounds is Bounds => bounds !== null,
    );
    const frontZ = separateFronts.length
      ? Math.min(...separateFronts.map((bounds) => bounds.min[2]!))
      : Math.max(...selected.map((part) => part.bounds.max[2]!)) - 0.05;
    // Whole-frame sunglasses cannot move individual lenses independently.
    // Fit their outside span to the final face instead of amplifying a donor's
    // small interocular gap (Todd has widely spaced stalks on a normal body).
    const centralScale = separateFronts.length
      ? scale
      : Math.max(
          0.25,
          Math.min(
            2,
            ((Math.max(...dst.map((b) => b.max[0]!)) -
              Math.min(...dst.map((b) => b.min[0]!))) *
              1.18) /
              (Math.max(...selected.map((p) => p.bounds.max[0]!)) -
                Math.min(...selected.map((p) => p.bounds.min[0]!))),
          ),
        );
    return selected.map((part) => {
      const x = midpoint(part.bounds, 0) - middle[0]!;
      if (Math.abs(x) <= gap(src) * 0.15)
        return {
          part,
          scale: centralScale,
          origin: middle,
          translate: destination.map((v, k) =>
            k === 2
              ? Math.max(...dst.map((bounds) => bounds.max[2]!)) +
                0.012 -
                ((frontZ - middle[2]!) * centralScale + middle[2]!)
              : v - middle[k]!,
          ),
        };
      const side = x < 0 ? 0 : 1,
        front = frontBounds[side]!;
      const lensScale = Math.min(
        singleEye && id === 'monocle' ? 4 : 2,
        Math.max(
          Math.min(scale, 1.2),
          ((dst[side]!.max[0]! - dst[side]!.min[0]!) * 1.08) /
            (front!.max[0]! - front!.min[0]!),
        ),
      );
      const origin = [0, 1, 2].map((k) => midpoint(src[side]!, k));
      const translate = [0, 1].map((k) => midpoint(dst[side]!, k) - origin[k]!);
      translate.push(
        dst[side]!.max[2]! +
          0.012 -
          ((front!.min[2]! - origin[2]!) * lensScale + origin[2]!),
      );
      return { part, scale: lensScale, origin, translate };
    });
  }
  if (category !== 'accessory') fail('unknown catalog fitting category');
  // Clippo's crown is narrower than its full curved-wire silhouette.
  const clippo =
    target.body.attachment === 'metal' || target.body.label === 'metal';
  const scale =
    (clippo
      ? 0.56
      : Math.max(0.35, Math.min(1.5, bodyWidth(target) / bodyWidth(donor)))) *
    (id === 'three_lobe' ? (tuftLayout?.scale ?? 1) : 1);
  const origin = [
    midpoint(donor.body.bounds, 0),
    donor.body.bounds.max[1]!,
    midpoint(donor.body.bounds, 2),
  ];
  const crown = [
    clippo ? 0.02 : midpoint(target.body.bounds, 0),
    target.body.bounds.max[1]!,
    clippo ? 0 : midpoint(target.body.bounds, 2),
  ];
  // A bow belongs near the lower face. Crown-mounted accessories retain the
  // source offset above the actual target crown.
  if (id === 'bow') {
    const src = eyeCenters(donor),
      dst = eyeCenters(target);
    for (let k = 0; k < 2; k++) {
      origin[k] = (midpoint(src[0]!, k) + midpoint(src[1]!, k)) / 2;
      crown[k] = (midpoint(dst[0]!, k) + midpoint(dst[1]!, k)) / 2;
    }
  }
  const translate = crown.map((v, k) => v - origin[k]!);
  if (id === 'three_lobe' && tuftLayout) {
    const anchor = selected[0]!.attachmentPivot;
    if (!anchor) fail('missing tuft attachment anchor');
    const root = closestBodySurface(donor.body, anchor!);
    // Rotation and scale pivot at the roots, so a tilted tuft cannot orbit
    // away from the head. The seating pass places this pivot on its crest.
    return selected.map((part) => ({
      part,
      scale,
      origin: root,
      translate,
      rotationZ: tuftLayout.rotationZ,
    }));
  }
  return selected.map((part) => ({ part, scale, origin, translate }));
}

/** The geometry map and animation conjugation must use the same transform. */
export function catalogPieceMatrix({
  scale,
  rotationZ = 0,
  origin,
  translate,
}: Omit<PieceTransform, 'part'>) {
  if (rotationZ === 0)
    return new Matrix4()
      .makeScale(scale, scale, scale)
      .setPosition(
        ...(origin.map((v, k) => v * (1 - scale) + translate[k]!) as [
          number,
          number,
          number,
        ]),
      );
  const matrix = new Matrix4()
    .makeRotationZ(rotationZ)
    .scale(new Vector3(scale, scale, scale));
  const offset = new Vector3()
    .fromArray(origin)
    .applyMatrix4(matrix)
    .negate()
    .add(new Vector3().fromArray(origin))
    .add(new Vector3().fromArray(translate));
  return matrix.setPosition(offset);
}

/** Uniform fitting retains the exported normals, authored proportions and morphs. */
export function transformCatalogPiece(
  part: CatalogPiece,
  transform: Omit<PieceTransform, 'part'>,
): CatalogPiece {
  const { scale, origin, translate, rotationZ = 0 } = transform;
  if (
    !Number.isFinite(scale) ||
    scale <= 0 ||
    scale > 8 ||
    !Number.isFinite(rotationZ) ||
    [...origin, ...translate].some((v) => !Number.isFinite(v))
  )
    fail('invalid part transform');
  // Palette UVs and eye/activity fields are polymorphic shader coordinates.
  // Tuft's FELIPE branch ignores those UVs; other rotations require an explicit
  // material contract instead of silently reinterpreting these packed fields.
  if (
    rotationZ !== 0 &&
    (part.attachment !== 'three_lobe' || part.universal === true)
  )
    fail('rotation currently requires a FELIPE Tuft material');
  const c = Math.cos(rotationZ),
    s = Math.sin(rotationZ);
  const point = (p: number[]) =>
    rotationZ === 0
      ? p.map((v, k) =>
          Math.fround((v - origin[k]!) * scale + origin[k]! + translate[k]!),
        )
      : [
          Math.fround(
            c * (p[0]! - origin[0]!) * scale -
              s * (p[1]! - origin[1]!) * scale +
              origin[0]! +
              translate[0]!,
          ),
          Math.fround(
            s * (p[0]! - origin[0]!) * scale +
              c * (p[1]! - origin[1]!) * scale +
              origin[1]! +
              translate[1]!,
          ),
          Math.fround(
            (p[2]! - origin[2]!) * scale + origin[2]! + translate[2]!,
          ),
        ];
  const geometry = part.geometry.clone();
  const position = geometry.getAttribute('position');
  for (let i = 0; i < position.count; i++)
    position.setXYZ(
      i,
      ...(point([position.getX(i), position.getY(i), position.getZ(i)]) as [
        number,
        number,
        number,
      ]),
    );
  if (!part.fur && (scale !== 1 || rotationZ !== 0))
    for (const name of ['delta0', 'delta1']) {
      const attr = geometry.getAttribute(name);
      if (attr)
        for (let i = 0; i < attr.count; i++)
          attr.setXYZ(
            i,
            Math.fround(
              (rotationZ === 0
                ? attr.getX(i)
                : c * attr.getX(i) - s * attr.getY(i)) * scale,
            ),
            Math.fround(
              (rotationZ === 0
                ? attr.getY(i)
                : s * attr.getX(i) + c * attr.getY(i)) * scale,
            ),
            Math.fround(attr.getZ(i) * scale),
          );
    }
  if (rotationZ !== 0) {
    for (const name of part.fur
      ? ['normal', 'normal0', 'delta1']
      : ['normal', 'normal0', 'normal1']) {
      const attr = geometry.getAttribute(name);
      if (!attr) continue;
      for (let i = 0; i < attr.count; i++) {
        const x = attr.getX(i),
          y = attr.getY(i);
        attr.setXYZ(i, c * x - s * y, s * x + c * y, attr.getZ(i));
      }
    }
    const palette = geometry.getAttribute('paletteGeometry');
    if (!part.fur && palette)
      for (let i = 0; i < palette.count; i++) {
        const x = palette.getY(i),
          y = palette.getZ(i);
        palette.setY(i, c * x - s * y);
        palette.setZ(i, s * x + c * y);
      }
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }
  const fields = Object.fromEntries(
    Object.entries(part.fields).map(([k, v]) => [k, [...v]]),
  );
  const palette = fields.paletteBounds;
  if (palette && (palette[2] || palette[3])) {
    const at = point([palette[0]!, palette[1]!, 0]);
    palette[0] = at[0]!;
    palette[1] = at[1]!;
    palette[2] = Math.fround(palette[2]! / scale);
    palette[3] = Math.fround(palette[3]! / scale);
  }
  return {
    ...part,
    geometry,
    fields,
    bounds:
      rotationZ === 0
        ? { min: point(part.bounds.min), max: point(part.bounds.max) }
        : {
            min: geometry.boundingBox!.min.toArray(),
            max: geometry.boundingBox!.max.toArray(),
          },
    pivot: point(part.pivot),
    attachmentPivot: part.attachmentPivot
      ? point(part.attachmentPivot)
      : part.attachmentPivot,
  };
}

/** Closest point on the actual body, including concave and open silhouettes.
 * Called once while composing a recipe, never in the animation loop. */
export function closestBodySurface(
  body: CatalogPiece,
  point: readonly number[],
): number[] {
  const positions = body.geometry.getAttribute('position');
  const indices = body.geometry.getIndex();
  if (!indices) fail('body attachment surface has no triangles');
  const triangle = new Triangle(),
    query = new Vector3().fromArray(point);
  const candidate = new Vector3(),
    closest = new Vector3();
  let distance = Infinity;
  for (let i = 0; i < indices!.count; i += 3) {
    triangle.a.fromBufferAttribute(positions, indices!.getX(i));
    triangle.b.fromBufferAttribute(positions, indices!.getX(i + 1));
    triangle.c.fromBufferAttribute(positions, indices!.getX(i + 2));
    triangle.closestPointToPoint(query, candidate);
    const d = candidate.distanceToSquared(query);
    if (d < distance) {
      distance = d;
      closest.copy(candidate);
    }
  }
  if (!Number.isFinite(distance)) fail('empty body attachment surface');
  return closest.toArray();
}

/** Vertical triangle intersection in body coordinates. */
function verticalSurface(
  part: CatalogPiece,
  x: number,
  z: number,
  top: boolean,
) {
  const p = part.geometry.getAttribute('position'),
    indices = part.geometry.getIndex();
  let result = top ? -Infinity : Infinity;
  if (!indices) return result;
  for (let i = 0; i < indices.count; i += 3) {
    const a = indices.getX(i),
      b = indices.getX(i + 1),
      c = indices.getX(i + 2);
    const ax = p.getX(a),
      az = p.getZ(a),
      bx = p.getX(b),
      bz = p.getZ(b),
      cx = p.getX(c),
      cz = p.getZ(c);
    const det = (bz - cz) * (ax - cx) + (cx - bx) * (az - cz);
    if (Math.abs(det) < 1e-12) continue;
    const u = ((bz - cz) * (x - cx) + (cx - bx) * (z - cz)) / det;
    const v = ((cz - az) * (x - cx) + (ax - cx) * (z - cz)) / det,
      w = 1 - u - v;
    if (Math.min(u, v, w) < -1e-7) continue;
    const y = u * p.getY(a) + v * p.getY(b) + w * p.getY(c);
    result = top ? Math.max(result, y) : Math.min(result, y);
  }
  return result;
}
/** A rigid hat rests on its underside, not on a center point that may sit
 * inside a notch between ears. The sampled contact is on both actual meshes. */
function headwearContact(
  target: CatalogAssembly,
  placements: PieceTransform[],
) {
  const first = placements[0]!;
  const projected = (value: number, k: number) =>
    (value - first.origin[k]!) * first.scale +
    first.origin[k]! +
    first.translate[k]!;
  const bounds = union(placements.map((p) => ({ bounds: p.part.bounds })));
  const min = [0, 2].map((k) =>
    Math.max(target.body.bounds.min[k]!, projected(bounds.min[k]!, k)),
  );
  const max = [0, 2].map((k) =>
    Math.min(target.body.bounds.max[k]!, projected(bounds.max[k]!, k)),
  );
  let shift = -Infinity,
    root: number[] | undefined;
  const sample = (x: number, z: number) => {
    const bodyY = verticalSurface(target.body, x, z, true);
    const localX =
      (x - first.origin[0]! - first.translate[0]!) / first.scale +
      first.origin[0]!;
    const localZ =
      (z - first.origin[2]! - first.translate[2]!) / first.scale +
      first.origin[2]!;
    const localY = Math.min(
      ...placements.map((p) => verticalSurface(p.part, localX, localZ, false)),
    );
    const delta = bodyY - projected(localY, 1);
    if (Number.isFinite(delta) && delta > shift) {
      shift = delta;
      root = [x, bodyY, z];
    }
  };
  for (let x = 0; x <= 12; x++)
    for (let z = 0; z <= 12; z++)
      sample(
        min[0]! + ((max[0]! - min[0]!) * x) / 12,
        min[1]! + ((max[1]! - min[1]!) * z) / 12,
      );
  // Include narrow wires/lobes that can fall between grid rays.
  const points = target.body.geometry.getAttribute('position');
  for (
    let i = 0;
    i < points.count;
    i += Math.max(1, Math.floor(points.count / 128))
  )
    sample(points.getX(i), points.getZ(i));
  return root ? { shift, root } : undefined;
}

/** Keep the authored insertion into the coat while moving its attachment from
 * the donor surface onto this body's real surface. Face/eyewear bounds must
 * never lift a hat or a tuft clear of the body. */
export function seatCatalogAccessories(
  target: CatalogAssembly,
  donor: CatalogAssembly,
  placements: PieceTransform[],
  selection: string,
  tuftLayout?: TuftLayout,
): PieceTransform[] {
  if (!placements.length) return placements;
  const first = placements[0]!;
  const anchor =
    selection === 'bow' ? first.part.pivot : first.part.attachmentPivot;
  if (!anchor) fail(`missing ${selection} attachment anchor`);
  const project = (point: readonly number[]) => {
    const delta = point.map((v, k) => (v - first.origin[k]!) * first.scale);
    const angle = first.rotationZ ?? 0;
    const cosine = Math.cos(angle),
      sine = Math.sin(angle);
    return [
      delta[0]! * cosine - delta[1]! * sine,
      delta[0]! * sine + delta[1]! * cosine,
      delta[2]!,
    ].map((v, k) => v + first.origin[k]! + first.translate[k]!);
  };
  let shift: number[];
  let root: number[];
  const support = ['felipe_beret', 'beret', 'beanie', 'hat', 'crown'].includes(
    selection,
  )
    ? headwearContact(target, placements)
    : undefined;
  if (support) {
    // Preserve the donor's authored insertion into the head. Treating a soft
    // beret as an impenetrable shell lifts its band above the coat and makes it
    // float; its original fit deliberately overlaps the head's upper surface.
    const authoredSupport = headwearContact(
      donor,
      placements.map(({ part }) => ({
        part, scale: 1, origin: [0, 0, 0], translate: [0, 0, 0],
      })),
    );
    shift = [
      0,
      support.shift - Math.max(0, authoredSupport?.shift ?? 0) * first.scale -
        (target.body.bounds.max[1]! - target.body.bounds.min[1]!) * 0.004,
      0,
    ];
    root = support.root;
  } else if (selection === 'headphones') {
    // A headset surrounds the body; its center follows the body center, not
    // the highest ear or lobe. Its ear cushions retain their separate roots.
    const sourceCenter = [0, 1, 2].map((k) => midpoint(donor.body.bounds, k));
    const destination = [0, 1, 2].map((k) => midpoint(target.body.bounds, k));
    const current = project(sourceCenter);
    shift = destination.map((v, k) => v - current[k]!);
    root = destination;
  } else {
    const sourceContact = closestBodySurface(donor.body, anchor!);
    const current = project(sourceContact);
    // Tuft grows from the upper silhouette, rather than being pressed into
    // whichever side happens to be nearest the donor's old root. Query from
    // above the head while retaining the authored left/right preference:
    // lobed heads select their crest, pointed heads their shoulder, and open
    // wire bodies still attach to a real triangle rather than empty bounds.
    const query =
      selection === 'three_lobe'
        ? [
            tuftLayout
              ? midpoint(target.body.bounds, 0) +
                (target.body.bounds.max[0]! - target.body.bounds.min[0]!) *
                  tuftLayout.x
              : current[0]!,
            target.body.bounds.max[1]! +
              (first.part.bounds.max[1]! - first.part.bounds.min[1]!) *
                first.scale *
                0.5,
            current[2]!,
          ]
        : current;
    root = closestBodySurface(target.body, query);
    shift = root.map((v, k) => v - current[k]!);
  }
  return placements.map((placement) => {
    const translate = placement.translate.map((v, k) => v + shift[k]!);
    const attachmentRoot =
      selection === 'headphones'
        ? closestBodySurface(
            target.body,
            project(placement.part.attachmentPivot!).map(
              (v, k) => v + shift[k]!,
            ),
          )
        : root;
    return { ...placement, translate, attachmentRoot };
  });
}
