import { preserveCatalogAccessoryMaterial } from './catalog-accessory-material';
import { AuthoredMotionSampler, type AuthoredMotionClip } from './motion';
import { decodeMotionBinary } from './motion-binary';
import {
  CatalogRetargetSampler,
  type CatalogLocalBinding,
} from './catalog-retarget';
import { loadCatalogDonor } from './catalog-library';
import type { ComposedCatalog } from './catalog-compose';
import type { MotionSamplers } from './motion-catalog';
import type { EyeGazeProfile } from './eye-gaze-controller';

type PartIdentity = {
  id: number;
  category: string;
  selection: string;
  sourcePart: number;
};
type Rig = {
  construction?: 'clippo-special';
  sourceDetail?: 'low' | 'high';
  sceneCenter: number[];
  render: Record<string, { universal: boolean }>;
  parts: PartIdentity[];
  idle: AuthoredMotionClip;
  reaction: AuthoredMotionClip;
  work: AuthoredMotionClip;
  returnNativeTime: number;
  sourceGround: number;
  sourceHeight: number;
};
type Library = {
  schema: string;
  version: number;
  preset: string;
  idleNativeStart: number;
  reactionNativeStart: number;
  workNativeStart: number;
  rigs: Rig[];
  materialCalibrated?: boolean;
};
const urls = import.meta.glob('./assets/catalog-motion/*.bin', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const pending = new Map<string, Promise<Library>>();
async function library(preset: string) {
  let result = pending.get(preset);
  if (!result) {
    result = (async () => {
      const url = urls[`./assets/catalog-motion/${preset}.bin`];
      if (!url) throw Error(`Missing semantic catalog motion ${preset}`);
      const response = await fetch(url);
      if (!response.ok) throw Error(`Catalog motion HTTP ${response.status}`);
      const value = decodeMotionBinary(await response.arrayBuffer()) as Library;
      if (
        value.schema !== 'bloom.avatar.catalog-motion-library' ||
        value.version !== 1 ||
        value.preset !== preset ||
        !value.materialCalibrated
      )
        throw Error('Unvalidated catalog motion library');
      return value;
    })().catch((error) => {
      pending.delete(preset);
      throw error;
    });
    pending.set(preset, result);
  }
  return result;
}
function partId(fur: boolean, id: number) {
  return `${fur ? 'fur' : 'mesh'}:${id}`;
}
async function recipeLibrary(
  composed: ComposedCatalog,
  detail: 'low' | 'high',
) {
  const data = await library(composed.body.signaturePreset);
  const asymmetric = composed.bindings.some(
    ({ part, sourcePart }) =>
      part.category === 'eyes' &&
      !sourcePart.selection &&
      (composed.body.body.attachment === 'metal' ||
        composed.body.body.label === 'metal'),
  );
  if (!asymmetric) return data;
  const special = await library(
    detail === 'high' ? 'clippo-special' : 'clippo-special-low',
  );
  if (composed.body.signaturePreset !== 'lime_frog')
    throw Error('Unobserved asymmetric Clippo signature');
  return { ...data, rigs: [...data.rigs, ...special.rigs] };
}
/** Merge only selected semantic channels; source clips remain immutable and are
 * shared between recipes. Each sampler owns scratch poses and caller output. */
async function prepare(composed: ComposedCatalog, data: Library) {
  const bindings: CatalogLocalBinding[] = [];
  const bounds = structuredClone(composed.body.sceneBounds);
  for (const { part } of composed.bindings)
    for (let k = 0; k < 3; k++) {
      bounds.min[k] = Math.min(bounds.min[k]!, part.bounds.min[k]!);
      bounds.max[k] = Math.max(bounds.max[k]!, part.bounds.max[k]!);
    }
  const center = [0, 1].map((k) => (bounds.min[k]! + bounds.max[k]!) / 2);
  const selected: { rig: number; id: string; merged: string }[] = [];
  for (const binding of composed.bindings) {
    preserveCatalogAccessoryMaterial(binding);
    const { part, sourcePart } = binding;
    const isBody = part.category === 'body';
    // The wire body's asymmetric Clippo eyes are constructed inside its body
    // donor, so they have no selected-eye catalog key. Their explicit family
    // is still Clippo; the geometry and destination pivots remain untouched.
    const clippoConstruction =
      !sourcePart.selection &&
      part.category === 'eyes' &&
      (composed.body.body.attachment === 'metal' ||
        composed.body.body.label === 'metal');
    const selection = clippoConstruction
      ? 'clippo-special'
      : sourcePart.selection;
    let rig = 0,
      record = data.rigs[0]!.parts[0]!;
    if (!isBody) {
      let found = false;
      for (let g = 0; g < data.rigs.length; g++) {
        const match = data.rigs[g]!.parts.find(
          (p) =>
            p.category === part.category &&
            p.selection === selection &&
            p.sourcePart === sourcePart.id,
        );
        if (match) {
          rig = g;
          record = match;
          found = true;
          break;
        }
      }
      if (!found)
        throw Error(
          `Missing catalog observation ${part.category}/${sourcePart.selection}/${sourcePart.id}`,
        );
    }
    const sourceId = partId(!!part.fur, record.id),
      mergedId = isBody ? sourceId : `${sourceId}@${rig}`;
    selected.push({ rig, id: sourceId, merged: mergedId });
    const nativePart = data.rigs[rig]!.idle.parts.find(
      (p) => p.id === sourceId,
    );
    if (!nativePart) throw Error('Missing catalog material observation');
    // Editing a named eye recipe changes its native shader branch. Set static
    // material fields before the renderer compiles or measures the alpha fit.
    if (!isBody) {
      for (const [name, channel] of Object.entries(nativePart.fields)) {
        if (binding.preserveFields?.includes(name)) continue;
        const values = 'value' in channel ? channel.value : channel.samples;
        part.fields[name] = Array.from(values.slice(0, 4));
      }
    }
    if (!binding.preserveMaterial)
      part.universal = data.rigs[rig]!.render[sourceId]!.universal;
    const description = composed.source.material.parts.find(
      (p) => p.id === part.id,
    );
    if (description) {
      description.fields = part.fields;
      description.universal = part.universal;
    }

    const sourceDonor = await loadCatalogDonor(
      isBody || clippoConstruction ? 'body' : part.category,
      isBody ? 'circle' : clippoConstruction ? 'clippo' : selection,
      data.rigs[rig]!.sourceDetail ?? 'high',
    );
    const source = sourceDonor.pieces.find(
      (p) => p.id === record.sourcePart && !!p.fur === !!part.fur,
    );
    if (!source) throw Error('Missing catalog motion source anchor');
    bindings.push({
      sourceId: mergedId,
      inheritBodyPigment: part.attachment === 'three_lobe',
      sourceParentId: rig ? `mesh:parent${rig}` : 'mesh:0',
      eyeHeightRatio: clippoConstruction ? 1 : undefined,
      attachmentAnchor:
        part.category === 'accessory'
          ? (part.attachmentPivot ?? undefined)
          : undefined,
      sourceSceneCenter: data.rigs[rig]!.sceneCenter,
      targetId: partId(!!part.fur, part.id),
      category: part.category,
      sourcePivot: source.pivot,
      targetPivot: part.pivot,
      geometryTransform: binding.transform,
      fields: part.fields,
      preserveFields: binding.preserveFields,
      sceneCenterDelta: data.rigs[rig]!.sceneCenter.map(
        (v, k) => v - center[k]!,
      ),
    });
  }
  // The Tuft is continuous body tissue. Its donor rig may have a zero color
  // channel (Josh red=0), so a multiplicative correction cannot match the coat.
  // Establish the actual body RGB before material compilation/alpha fitting.
  const bodyPaint = composed.source.parts.find(
    (part) => part.id === 0 && !part.fur,
  )!.fields.colorRoughness!;
  for (const { part } of composed.bindings)
    if (part.attachment === 'three_lobe') {
      const paint = part.fields.colorRoughness!;
      for (let k = 0; k < 3; k++) paint[k] = bodyPaint[k]!;
    }
  const merge = (kind: 'idle' | 'reaction' | 'work') => {
    const first = data.rigs[0]![kind];
    const parts = selected.map(({ rig, id, merged }) => {
      const clip = data.rigs[rig]![kind];
      if (
        clip.duration !== first.duration ||
        clip.times.length !== first.times.length ||
        !clip.times.every((v, i) => v === first.times[i])
      )
        throw Error('Catalog observation clocks differ');
      const p = clip.parts.find((p) => p.id === id);
      if (!p) throw Error(`Missing catalog channel ${id}`);
      return { ...p, id: merged };
    });
    for (const rig of new Set(selected.map((p) => p.rig))) {
      if (rig === 0) continue;
      const parent = data.rigs[rig]![kind].parts.find((p) => p.id === 'mesh:0');
      if (!parent) throw Error('Missing catalog rig parent');
      parts.push({ ...parent, id: `mesh:parent${rig}` });
    }
    if (!parts.some((p) => p.id === 'mesh:0'))
      throw Error('Missing catalog parent frame');
    return new AuthoredMotionSampler({ ...first, parts });
  };
  return {
    bindings,
    merge,
    dimensions: {
      ground: data.rigs[0]!.sourceGround,
      height: data.rigs[0]!.sourceHeight,
    },
    destination: {
      ground: composed.body.body.bounds.min[1]!,
      height:
        composed.body.body.bounds.max[1]! - composed.body.body.bounds.min[1]!,
    },
  };
}
/** Complete catalog controller factory. It rejects uncalibrated observations;
 * publication is contingent on native material and interaction gates. */
export async function createCatalogMotion(
  composed: ComposedCatalog,
  detail: 'low' | 'high',
  baseWork: AuthoredMotionSampler,
): Promise<{
  samplers: MotionSamplers;
  eyeProfiles: Record<number, EyeGazeProfile>;
}> {
  const data = await recipeLibrary(composed, detail);
  const setup = await prepare(composed, data);
  const make = (
    kind: 'idle' | 'reaction' | 'work',
    base?: AuthoredMotionSampler,
  ) =>
    new CatalogRetargetSampler(
      setup.merge(kind),
      setup.bindings,
      setup.dimensions,
      setup.destination,
      base,
    );
  const idle = make('idle'),
    reaction = make('reaction'),
    work = make('work', baseWork);
  const phase = (native: number) =>
    (((native - data.idleNativeStart) % idle.clip.duration) +
      idle.clip.duration) %
    idle.clip.duration;
  return {
    samplers: {
      idle,
      reaction,
      work,
      reactionReturnTime: phase(data.rigs[0]!.returnNativeTime),
      workReturn: {
        time: work.clip.duration,
        idleTime: phase(data.workNativeStart + work.clip.duration),
      },
    },
    eyeProfiles: {},
  };
}
export async function createCatalogWorkAttachments(
  composed: ComposedCatalog,
  baseWork: AuthoredMotionSampler,
  detail: 'low' | 'high' = 'high',
) {
  const data = await recipeLibrary(composed, detail),
    setup = await prepare(composed, data);
  return new CatalogRetargetSampler(
    setup.merge('work'),
    setup.bindings,
    setup.dimensions,
    setup.destination,
    baseWork,
  );
}
