import type { AuthoredPart } from './catalog';
import type { CatalogPiece } from './catalog-fitting';
import { tuftSurface } from './tuft-surface';
import { integrateCatalogTuft } from './catalog-tuft';

const prepared = new WeakMap<AuthoredPart[], ReadonlyMap<number, readonly number[]>>();
/** Run once after decoding a canonical asset, before alpha-fit and GPU upload.
 * Cached binary arrays remain immutable; only owned geometry clones are changed.
 * Returns the body-local attachment point for each tuft surface numeric ID. */
export function prepareCanonicalTuft(
  parts: AuthoredPart[],
): ReadonlyMap<number, readonly number[]> {
  const anchors = new Map<number, number[]>();
  const existing = prepared.get(parts);
  if (existing) return existing;
  const bodySource = parts.filter((p) => p.id === 0 && !p.activity);
  const tuftSource = parts.filter((p) => p.attachment === 'three_lobe' && !p.activity);
  if (!bodySource.some((p) => !p.fur) || !tuftSource.some((p) => !p.fur)) return anchors;
  const decorated = [...bodySource, ...tuftSource].map((part): CatalogPiece => {
    const geometry = part.geometry.clone();
    geometry.computeBoundingBox();
    return {
      ...part,
      geometry,
      bounds: {
        min: geometry.boundingBox!.min.toArray(),
        max: geometry.boundingBox!.max.toArray(),
      },
      category: part.id === 0 ? 'body' : 'accessory',
      selection: part.id === 0 ? '' : 'three_lobe',
      pivot: [0, 0, 0],
    };
  });
  try {
    const body = decorated.filter((p) => p.category === 'body'),
      tuft = decorated.filter((p) => p.category === 'accessory'),
      surface = tuft.find((p) => !p.fur)!,
      coat = body.find((p) => !p.fur)!;
    const center = [0, 1, 2].map((k) => (surface.bounds.min[k]! + surface.bounds.max[k]!) / 2);
    const root = tuftSurface(coat.geometry, center).point;
    for (const part of tuft) {
      part.attachmentPivot = root;
      anchors.set(part.id, root.slice());
    }
    integrateCatalogTuft(body, tuft);
    for (let i = 0; i < decorated.length; i++) {
      const source = [...bodySource, ...tuftSource][i]!;
      const previous = source.geometry;
      source.geometry = decorated[i]!.geometry;
      previous.dispose();
    }
    prepared.set(parts, anchors);
    return anchors;
  } catch (error) {
    for (const p of decorated) p.geometry.dispose();
    throw error;
  }
}
