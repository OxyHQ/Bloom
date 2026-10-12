import {
  decodeAuthoredAsset,
  fetchResource,
  type GeometryRecord,
  type MaterialRecord,
} from './catalog';
import type { ComposedCatalog } from './catalog-compose';
import centering from './assets/catalog-computer/centering.json';
import sceneCenters from './assets/catalog-computer/scene-centers.json';
import { decodeMotionBinary } from './motion-binary';
import { AuthoredMotionSampler, type AuthoredMotionClip, type AuthoredMotionPose } from './motion';

const urls = import.meta.glob('./assets/catalog-computer/**/*.{json,bin}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const url = (path: string) => {
  const result = urls[`./assets/catalog-computer/${path}`];
  if (!result) throw Error(`Missing catalog Computer asset: ${path}`);
  return result;
};
type Document = {
  schema: string;
  version: number;
  shape: string;
  clip: AuthoredMotionClip;
  nativeStart: number;
};
const documents = new Map<string, Promise<{ document: Document; material: MaterialRecord }>>();
let geometry: Promise<{ manifest: GeometryRecord; binary: ArrayBuffer }> | undefined;
function load(shape: string) {
  let promise = documents.get(shape);
  if (!promise) {
    promise = Promise.all([
      fetchResource(url(`${shape}/motion.bin`))
        .then((r) => r.arrayBuffer())
        .then(decodeMotionBinary),
      fetchResource(url(`${shape}/material.json`)).then((r) => r.json()),
    ])
      .then(([data, material]) => {
        const document = data as Document;
        if (
          document.schema !== 'bloom.avatar.catalog-computer' ||
          document.version !== 1 ||
          document.shape !== shape
        )
          throw Error('Invalid catalog Computer identity');
        return { document, material: material as MaterialRecord };
      })
      .catch((error) => {
        documents.delete(shape);
        throw error;
      });
    documents.set(shape, promise);
  }
  geometry ??= Promise.all([
    fetchResource(url('geometry.json')).then((r) => r.json()) as Promise<GeometryRecord>,
    fetchResource(url('geometry.bin')).then((r) => r.arrayBuffer()),
  ])
    .then(([manifest, binary]) => ({ manifest, binary }))
    .catch((error) => {
      geometry = undefined;
      throw error;
    });
  return Promise.all([promise, geometry]);
}
/** Centering moves the body and its two contact shadows on distinct authored
 * envelopes. Screen, hands and their shadows keep their body-specific tracks. */
class CatalogComputerSampler extends AuthoredMotionSampler {
  constructor(
    clip: AuthoredMotionClip,
    private centerDelta: readonly number[],
    private contactShadows: ReadonlySet<string>,
  ) {
    super(clip);
  }
  override sample(seconds: number, pose: AuthoredMotionPose[]) {
    super.sample(seconds, pose);
    const times = centering.times;
    const t = Math.max(0, Math.min(seconds, times[times.length - 1]!));
    let lo = 0,
      hi = times.length - 1;
    while (hi - lo > 1) {
      const mid = (lo + hi) >>> 1;
      if (times[mid]! <= t) lo = mid;
      else hi = mid;
    }
    const u = (t - times[lo]!) / (times[hi]! - times[lo]!);
    const body = centering.body[lo]! + (centering.body[hi]! - centering.body[lo]!) * u;
    const shadow = centering.shadow[lo]! + (centering.shadow[hi]! - centering.shadow[lo]!) * u;
    for (const part of pose) {
      if (part.id === 'mesh:0') {
        part.world.elements[12]! -= this.centerDelta[0]! * body;
        part.world.elements[13]! -= this.centerDelta[1]! * body;
      } else if (this.contactShadows.has(part.id))
        part.world.elements[12]! -= this.centerDelta[0]! * shadow;
    }
  }
}
export async function attachCatalogComputer(composed: ComposedCatalog, shape: string) {
  const [{ document, material }, { manifest, binary }] = await load(shape);
  const copy = structuredClone(material);
  const props = decodeAuthoredAsset(composed.source.preset, manifest, copy, binary, true);
  const firstId = Math.max(...composed.source.parts.map((p) => p.id)) + 1;
  for (const part of props.parts) {
    part.id += firstId;
    part.activity = 'computer';
    part.colorRole = part.fields.referencePose?.[3] === -40 ? 'body' : undefined;
  }
  for (const part of copy.parts) part.id += firstId;
  composed.source.parts.push(...props.parts);
  composed.source.material.parts.push(...copy.parts);
  const body = composed.bindings[0]!.part;
  const clip: AuthoredMotionClip = {
    ...document.clip,
    parts: document.clip.parts.map((part) => ({
      ...part,
      id: part.id === 'mesh:0' ? 'mesh:0' : `mesh:${firstId + Number(part.id.split(':')[1])}`,
      fields:
        part.id === 'mesh:0'
          ? {
              ...part.fields,
              ...Object.fromEntries(
                ['paletteBounds', 'furEye0', 'furEye1']
                  .filter((k) => body.fields[k])
                  .map((k) => [k, { value: body.fields[k]! }]),
              ),
            }
          : part.fields,
    })),
  };
  const bounds = structuredClone(composed.body.sceneBounds);
  for (const { part } of composed.bindings)
    for (let k = 0; k < 3; k++) {
      bounds.min[k] = Math.min(bounds.min[k]!, part.bounds.min[k]!);
      bounds.max[k] = Math.max(bounds.max[k]!, part.bounds.max[k]!);
    }
  const base = (sceneCenters as Record<string, number[]>)[shape];
  if (!base) throw Error(`Missing Computer scene reference: ${shape}`);
  const delta = [0, 1].map((k) => (bounds.min[k]! + bounds.max[k]!) / 2 - base[k]!);
  const shadows = props.parts.filter((p) => p.fields.referencePose?.[3] === -16).slice(0, 2);
  if (shadows.length !== 2) throw Error('Missing Computer contact shadows');
  return new CatalogComputerSampler(clip, delta, new Set(shadows.map((p) => `mesh:${p.id}`)));
}
