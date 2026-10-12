import assert from 'node:assert/strict';
import { catalogFurMask } from '../runtime/avatar/catalog-fur.ts';

/** Export the semantic eye indices that actually contributed each native fur
 * mask. Equality with independently observed material identifies the surface;
 * labels, pupil size and render order alone do not identify it reliably. */
export function catalogFurMaskIndices(material) {
  const body = material.parts.find((p) => p.id === 0);
  const eyes = material.selectedPartIds.map((id) => material.parts.find((p) => p.id === id));
  return ['furEye0', 'furEye1'].map((name) => {
    const observed = body.fields[name];
    assert.equal(observed.length, 4);
    if (observed.every((v) => v === 0)) return null;
    const matches = eyes.flatMap((part, index) =>
      catalogFurMask(part.bounds).every((v, k) => v === observed[k]) ? [index] : [],
    );
    assert.equal(matches.length, 1, `Unresolved fur mask ${material.id}/${name}`);
    return matches[0];
  });
}
