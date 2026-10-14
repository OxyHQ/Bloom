import { integrateCatalogTuft } from './catalog-tuft';
import { catalogLayout, fitCatalogFace } from './catalog-layout';
import { constructCyclops } from './catalog-cyclops';
import { fitClippoEyes } from './catalog-clippo';
import { catalogFurMask } from './catalog-fur';
import { Matrix4 } from 'three';
import { loadCatalogDonor, type CatalogDonor } from './catalog-library';
import {
  bodyFront,
  fitCatalogPieces,
  seatCatalogAccessories,
  transformCatalogPiece,
  catalogPieceMatrix,
  type CatalogAssembly,
  type CatalogPiece,
  type PieceTransform,
} from './catalog-fitting';
import type { AuthoredAsset, MaterialRecord } from './catalog';

export type CatalogRecipe = {
  shape: string;
  eyes: string;
  eyewear: string;
  accessory: string;
  eyeSpacing?: number;
  /** Editor thumbnails render the actual eye meshes, without a body behind them. */
  previewPart?: 'eyes';
};
export type CatalogBinding = {
  part: CatalogPiece;
  donor: CatalogDonor;
  sourcePart: CatalogPiece;
  transform: Matrix4;
  /** Procedural geometry owns these channels; keep observed motion for the rest. */
  preserveFields?: readonly string[];
  preserveMaterial?: boolean;
};
export type ComposedCatalog = {
  source: AuthoredAsset;
  bindings: CatalogBinding[];
  body: CatalogDonor;
};
const identity = { scale: 1, origin: [0, 0, 0], translate: [0, 0, 0] };

/** Build one geometry/material identity from independent, authored catalog parts.
 * All fitting happens on CPU once per recipe, never in the animation frame. */
export async function composeCatalog(
  recipe: CatalogRecipe,
  detail: 'low' | 'high',
): Promise<ComposedCatalog> {
  const [bodySource, eyes, eyewear, accessory, cyclopsSource] = await Promise.all([
    loadCatalogDonor('body', recipe.shape, detail),
    loadCatalogDonor('eyes', recipe.eyes === 'none' ? 'oval' : recipe.eyes, detail),
    recipe.eyewear === 'none' ? null : loadCatalogDonor('eyewear', recipe.eyewear, detail),
    recipe.accessory === 'none' ? null : loadCatalogDonor('accessory', recipe.accessory, detail),
    recipe.eyes === 'cyclops' ? loadCatalogDonor('eyes', 'todd', detail) : null,
  ]);
  const body = {
    ...bodySource,
    face: fitCatalogFace(bodySource, recipe.shape, recipe.eyes === 'cyclops'),
  };
  if (recipe.eyeSpacing !== undefined && recipe.eyeSpacing !== 1) {
    if (!Number.isFinite(recipe.eyeSpacing) || recipe.eyeSpacing < 0.5 || recipe.eyeSpacing > 1.5)
      throw Error('Invalid avatar eye spacing');
    const midpoint = (body.face.centers[0]![0]! + body.face.centers[1]![0]!) / 2;
    body.face = {
      ...body.face,
      centers: body.face.centers.map(([x, y, z]) => {
        const at = midpoint + (x! - midpoint) * recipe.eyeSpacing!;
        const front = bodyFront(body, at, y!);
        return [at, y!, Number.isFinite(front) ? front - body.face.radius * 0.3 : z!];
      }),
    };
  }
  const bindings: CatalogBinding[] = [];
  const fittingEyes: CatalogPiece[] = [];
  const add = (donor: CatalogDonor, placement: PieceTransform) => {
    for (const sourcePart of donor.pieces.filter((p) => p.id === placement.part.id)) {
      // A material may contribute both its solid surface and its fur geometry.
      const part = transformCatalogPiece(sourcePart, placement);
      if (placement.attachmentRoot) part.attachmentPivot = [...placement.attachmentRoot];
      bindings.push({
        part,
        sourcePart,
        donor,
        transform: catalogPieceMatrix(placement),
      });
    }
  };
  for (const part of body.pieces.filter((p) => body.selectedPartIds.includes(p.id) && !p.fur))
    add(body, { part, ...identity });
  const assembled = (): CatalogAssembly => ({
    body: bindings[0]!.part,
    pieces: [...bindings.map((b) => b.part), ...fittingEyes],
    face: body.face,
  });
  if (recipe.eyes === 'clippo') {
    for (const { donor, placement } of fitClippoEyes(
      body,
      eyes,
      eyes.construction?.kind === 'clippo-face' ? eyes.construction : undefined,
    )) {
      if (donor === body && recipe.eyeSpacing !== undefined && recipe.eyeSpacing !== 1) {
        const side =
          (placement.part.bounds.min[0]! + placement.part.bounds.max[0]!) / 2 < 0 ? 0 : 1;
        const center = bodySource.face.centers[side]!;
        placement.translate = placement.translate.map(
          (v, k) => v + body.face.centers[side]![k]! - center[k]!,
        );
      }
      add(donor, placement);
    }
  } else if (recipe.eyes === 'cyclops') {
    const selected = eyes.pieces.filter((p) => eyes.selectedPartIds.includes(p.id) && !p.fur);
    const white = selected[0];
    if (!white || selected.length !== 5) throw Error('Missing complete Cyclops donor');
    const center = (part: CatalogPiece) =>
      [0, 1, 2].map((k) => (part.bounds.min[k]! + part.bounds.max[k]!) / 2);
    if (eyes.construction?.kind !== 'cyclops') throw Error('Missing Cyclops construction anchors');
    const whiteCenter = eyes.construction.center;
    const scale = (body.face.radius * 2) / eyes.construction.radius;
    const destination = [0, 1]
      .map((k) => (body.face.centers[0]![k]! + body.face.centers[1]![k]!) / 2)
      .concat(Math.max(...body.face.centers.map((c) => c[2]!)) + body.face.radius * 0.5);
    const constructed = constructCyclops(cyclopsSource!, body.face);
    let front = 0;
    for (const [index, part] of selected.entries()) {
      const origin = index === 0 ? whiteCenter : center(part);
      const at =
        index === 0
          ? destination
          : [
              destination[0]! + (origin[0]! - whiteCenter[0]!) * scale,
              destination[1]! + (origin[1]! - whiteCenter[1]!) * scale,
              front + 0.006 - (part.bounds.max[2]! - origin[2]!) * scale,
            ];
      add(eyes, {
        part,
        scale,
        origin,
        translate: at.map((v, k) => v - origin[k]!),
      });
      const fitted = bindings[bindings.length - 1]!;
      fitted.part.geometry.dispose();
      const geometry = constructed[index]!;
      fitted.part = {
        ...fitted.part,
        geometry: geometry.geometry,
        bounds: geometry.bounds,
        pivot: geometry.pivot,
        attachmentPivot: geometry.attachmentPivot,
      };
      front = fitted.part.bounds.max[2]!;
    }
  } else {
    for (const placement of fitCatalogPieces(
      body,
      eyes,
      'eyes',
      recipe.eyes === 'none' ? 'oval' : recipe.eyes,
      {
        faceLayout: body.face,
      },
    )) {
      if (recipe.eyes === 'none') {
        // Invisible landmarks fit optional eyewear/bows without adding eye meshes.
        fittingEyes.push(transformCatalogPiece(placement.part, placement));
      } else {
        add(eyes, placement);
      }
    }
  }
  if (accessory) {
    const target = recipe.eyes === 'cyclops' ? body : assembled();
    const tuftLayout = catalogLayout(recipe.shape).tuft;
    const placements = fitCatalogPieces(target, accessory, 'accessory', recipe.accessory, {
      tuftLayout,
    });
    for (const placement of seatCatalogAccessories(
      target,
      accessory,
      placements,
      recipe.accessory,
      tuftLayout,
    ))
      add(accessory, placement);
  }
  if (eyewear)
    for (const placement of fitCatalogPieces(assembled(), eyewear, 'eyewear', recipe.eyewear, {
      singleEye: recipe.eyes === 'cyclops',
    }))
      add(eyewear, placement);
  if (recipe.accessory === 'three_lobe')
    integrateCatalogTuft(
      bindings.filter((b) => b.part.category === 'body').map((b) => b.part),
      bindings.filter((b) => b.part.category === 'accessory').map((b) => b.part),
    );
  const targetParent = new Matrix4().fromArray(body.body.fields.world!);
  const targetNormal = new Matrix4().fromArray(body.body.fields.normalMatrix!);
  const ids = new Map<CatalogPiece, number>();
  let count = 0;
  for (const binding of bindings) {
    let id = ids.get(binding.sourcePart);
    // Fur and surface share the numeric source ID; identity is donor+ID.
    const prior = bindings.find(
      (b) =>
        b !== binding &&
        b.donor === binding.donor &&
        b.sourcePart.id === binding.sourcePart.id &&
        ids.has(b.sourcePart),
    );
    if (id === undefined) id = prior ? ids.get(prior.sourcePart)! : count++;
    ids.set(binding.sourcePart, id);
    binding.part.id = id;
    const sourceParent = new Matrix4().fromArray(binding.donor.body.fields.world!).invert();
    const local = new Matrix4().multiplyMatrices(
      sourceParent,
      new Matrix4().fromArray(binding.sourcePart.fields.world!),
    );
    const inverse = binding.transform.clone().invert();
    binding.part.fields.world = targetParent
      .clone()
      .multiply(binding.transform)
      .multiply(local)
      .multiply(inverse)
      .toArray();
    const linear = binding.transform.clone().setPosition(0, 0, 0);
    const localNormal = new Matrix4()
      .fromArray(binding.donor.body.fields.normalMatrix!)
      .invert()
      .multiply(new Matrix4().fromArray(binding.sourcePart.fields.normalMatrix!));
    binding.part.fields.normalMatrix = targetNormal
      .clone()
      .multiply(linear)
      .multiply(localNormal)
      .multiply(linear.clone().invert())
      .toArray();
    binding.part.renderOrder = id;
    binding.part.colorRole =
      binding.part.category === 'body' || binding.part.attachment === 'three_lobe'
        ? 'body'
        : undefined;
  }
  const eyeParts = bindings.filter((b) => b.part.category === 'eyes' && !b.part.fur);
  const bodyHasFur = bindings.some((b) => b.part.category === 'body' && b.part.fur);
  if (!eyes.furMaskIndices || eyes.furMaskIndices.length !== 2)
    throw Error('Missing catalog eye fur masks');
  const masks = eyes.furMaskIndices.map((index) => {
    if (recipe.eyes === 'none' || index === null || !bodyHasFur) return [0, 0, 0, 0];
    const binding = eyeParts[index];
    if (!binding) throw Error('Missing catalog eye fur mask surface');
    return catalogFurMask(binding.part.bounds);
  });
  for (const { part } of bindings)
    if (part.category === 'body') {
      part.fields.furEye0 = masks[0]!;
      part.fields.furEye1 = masks[1]!;
    }
  for (const eye of fittingEyes) eye.geometry.dispose();
  const descriptions = bindings
    .filter((b) => !b.part.fur)
    .map(({ part }) => ({
      id: part.id,
      materialKind: part.kind,
      fields: part.fields,
      label: part.label,
      attachment: part.attachment,
      fur: bindings.some((b) => b.part.id === part.id && b.part.fur),
      universal: part.universal,
      transparent: part.transparent,
      depthWrite: part.depthWrite,
      depthTest: part.depthTest,
      doubleSided: part.doubleSided,
      renderOrder: part.renderOrder,
    }));
  const material: MaterialRecord = {
    ...body.source.material,
    preset: body.signaturePreset,
    parts: descriptions,
    crop: [0, 0, 1, 1],
  };
  return {
    source: {
      preset: body.signaturePreset,
      material,
      parts: bindings.map((b) => b.part),
    },
    bindings,
    body,
  };
}
