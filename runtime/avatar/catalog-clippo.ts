import type {
  CatalogAssembly,
  CatalogPiece,
  PieceTransform,
} from './catalog-fitting';

/** Construction data exported from the source Clippo generator, before Float32
 * vertex storage. Bounds of a tessellated eye are not its mathematical radius. */
export type ClippoConstruction = {
  kind: 'clippo-face';
  eyes: { center: number[]; radius: number[]; eyeScale: number }[];
};
export type ClippoPlacement<T extends CatalogAssembly> = {
  donor: T;
  placement: PieceTransform;
};

/** Native Clippo has two distinct constructions. Its own wire body carries
 * asymmetric eyes/brows; other bodies receive the symmetric cubic brow and
 * original two-layer eye scaled uniformly from its construction coordinates.
 * This is geometry fitting only; donor-local animated transforms remain the
 * composer's responsibility. */
export function fitClippoEyes<T extends CatalogAssembly>(
  target: T,
  donor: T,
  construction?: ClippoConstruction,
): ClippoPlacement<T>[] {
  const special =
    target.body.attachment === 'metal' || target.body.label === 'metal';
  const source = special ? target : donor;
  const parts = source.pieces.filter((p) => p.category === 'eyes' && !p.fur);
  if (parts.length !== 6)
    throw Error('Clippo requires two eyes, two pupils and two brows');
  if (special)
    return parts.map((part) => ({
      donor: source,
      placement: { part, scale: 1, origin: [0, 0, 0], translate: [0, 0, 0] },
    }));
  if (construction?.kind !== 'clippo-face' || construction.eyes.length !== 2)
    throw Error('Missing Clippo construction anchors');
  const face = target.face;
  if (!(face.radius > 0) || face.centers.length !== 2)
    throw Error('Missing target Clippo face layout');
  const eyeScale = face.radius / 0.21;
  return parts.map((part: CatalogPiece) => {
    const side = (part.bounds.min[0]! + part.bounds.max[0]!) / 2 < 0 ? 0 : 1;
    const anchor = construction.eyes[side]!;
    if (!(anchor.eyeScale > 0) || anchor.center.length !== 3)
      throw Error('Invalid Clippo source eye scale');
    const center = face.centers[side]!.map(
      (v, k) => v + (k === 2 ? 0.14 * eyeScale : 0),
    );
    return {
      donor,
      placement: {
        part,
        scale: eyeScale / anchor.eyeScale,
        origin: anchor.center,
        translate: center.map((v, k) => v - anchor.center[k]!),
      },
    };
  });
}
