import {
  decodeAuthoredAsset,
  fetchResource,
  type AuthoredAsset,
  type AvatarPreset,
  type GeometryRecord,
  type MaterialRecord,
} from './catalog';
import type { ClippoConstruction } from './catalog-clippo';
export type CatalogConstruction =
  | ClippoConstruction
  | { kind: 'cyclops'; center: number[]; radius: number };
import type { Bounds, CatalogAssembly, CatalogPiece, FaceLayout } from './catalog-fitting';

export type CatalogCategory = 'body' | 'eyes' | 'eyewear' | 'accessory';
export type CatalogDonorEntry = {
  low: string;
  high: string;
  selectedPartIds: number[];
  face: FaceLayout | Record<'low' | 'high', FaceLayout>;
  signaturePreset: AvatarPreset;
  construction?: Record<'low' | 'high', CatalogConstruction>;
};
type Library = {
  schema: string;
  version: number;
  donors: Record<CatalogCategory, Record<string, CatalogDonorEntry>>;
};
export type CatalogDonor = CatalogAssembly & {
  source: AuthoredAsset;
  selectedPartIds: number[];
  signaturePreset: AvatarPreset;
  construction?: CatalogConstruction;
  sceneBounds: Bounds;
  referenceBounds: Bounds;
  aggregateBounds: Bounds;
  furMaskIndices?: (number | null)[];
};
type PieceDescription = {
  bounds: Bounds;
  category: CatalogCategory;
  pivot: number[];
  attachmentPivot?: number[] | null;
  selection?: string;
};
const urls = import.meta.glob('./assets/catalog-library/**/*.{json,bin}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>;
const url = (path: string) => {
  const found = urls[`./assets/catalog-library/${path}`];
  if (!found) throw Error(`Missing authored catalog asset: ${path}`);
  return found;
};
let library: Promise<Library> | undefined;
const pending = new Map<string, Promise<CatalogDonor>>();
const retained = new Map<string, number>();
const CACHE_BYTES = 48 * 1024 * 1024;
function retain(key: string, donor: CatalogDonor) {
  const buffers = new Set<ArrayBufferLike>();
  for (const part of donor.pieces) {
    for (const attr of Object.values(part.geometry.attributes)) {
      const a = attr as unknown as { array?: ArrayBufferView; data?: { array: ArrayBufferView } };
      const buffer = (a.data?.array ?? a.array)?.buffer;
      if (buffer) buffers.add(buffer);
    }
    const index = part.geometry.getIndex();
    if (index) buffers.add(index.array.buffer);
  }
  retained.delete(key);
  retained.set(
    key,
    [...buffers].reduce((n, b) => n + b.byteLength, 0),
  );
  let bytes = [...retained.values()].reduce((a, b) => a + b, 0);
  for (const [old, size] of retained) {
    if (bytes <= CACHE_BYTES) break;
    retained.delete(old);
    pending.delete(old);
    bytes -= size;
  }
  return donor;
}
export function loadCatalogLibrary() {
  return (library ??= fetchResource(url('index.json'))
    .then((r) => r.json())
    .catch((error) => {
      library = undefined;
      throw error;
    }));
}
/** Immutable CPU donor geometry. Composition clones it before attaching GPU state. */
export function loadCatalogDonor(
  category: CatalogCategory,
  id: string,
  detail: 'low' | 'high',
): Promise<CatalogDonor> {
  const key = `${category}:${id}:${detail}`;
  let result = pending.get(key);
  if (result && retained.has(key)) {
    const size = retained.get(key)!;
    retained.delete(key);
    retained.set(key, size);
  }
  if (!result) {
    result = (async () => {
      const library = await loadCatalogLibrary();
      const entry = library.donors[category]?.[id];
      if (!entry) throw Error(`Unknown avatar ${category}: ${id}`);
      const path = entry[detail];
      const [geometry, material, binary] = await Promise.all([
        fetchResource(url(`${path}/geometry.json`)).then((r) =>
          r.json(),
        ) as Promise<GeometryRecord>,
        fetchResource(url(`${path}/material.json`)).then((r) => r.json()) as Promise<
          Omit<MaterialRecord, 'parts'> & {
            parts: (MaterialRecord['parts'][number] & PieceDescription)[];
            sceneBounds: Bounds;
            referenceBounds: Bounds;
            aggregateBounds: Bounds;
            furMaskIndices?: (number | null)[];
          }
        >,
        fetchResource(url(`${path}/geometry.bin`)).then((r) => r.arrayBuffer()),
      ]);
      material.preset = entry.signaturePreset;
      material.crop = [0, 0, 1, 1]; // Replaced by the renderer's measured alpha fit.
      const source = decodeAuthoredAsset(
        entry.signaturePreset,
        geometry,
        material,
        binary,
        false,
        undefined,
      );
      const pieces = source.parts.map((part) => {
        const meta = material.parts.find((p) => p.id === part.id)!;
        if (!meta?.bounds || !meta.pivot)
          throw Error(`Missing semantic part metadata: ${key}/${part.id}`);
        return {
          ...part,
          bounds: meta.bounds,
          pivot: meta.pivot,
          attachmentPivot: meta.attachmentPivot,
          category: meta.category,
          selection: meta.selection ?? (entry.selectedPartIds.includes(part.id) ? id : ''),
        } as CatalogPiece;
      });
      const body = pieces.find((p) => p.id === 0 && !p.fur);
      if (!body) throw Error(`Missing catalog body: ${key}`);
      const face = 'centers' in entry.face ? entry.face : entry.face[detail];
      return {
        body,
        pieces,
        face,
        source,
        selectedPartIds: entry.selectedPartIds,
        signaturePreset: entry.signaturePreset,
        construction: entry.construction?.[detail],
        sceneBounds: material.sceneBounds,
        referenceBounds: material.referenceBounds,
        aggregateBounds: material.aggregateBounds,
        furMaskIndices: material.furMaskIndices,
      };
    })()
      .then((donor) => retain(key, donor))
      .catch((error) => {
        pending.delete(key);
        throw error;
      });
    pending.set(key, result);
  }
  return result;
}
