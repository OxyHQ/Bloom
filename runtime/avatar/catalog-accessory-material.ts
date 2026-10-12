import type { CatalogBinding } from './catalog-compose';

/** Felipe's beret keeps its authored padded, glossy material when composed with
 * another face. Generic rig observations describe the plain matte beret instead.
 * Preserve only material channels; placement and action deformation still animate.
 */
export function preserveCatalogAccessoryMaterial(binding: CatalogBinding): void {
  if (binding.part.category !== 'accessory' || binding.sourcePart.selection !== 'felipe_beret')
    return;
  binding.preserveMaterial = true;
  binding.part.universal = binding.sourcePart.universal;
  binding.preserveFields = [
    ...new Set([...(binding.preserveFields ?? []), 'colorRoughness', 'parameters']),
  ];
  for (const field of ['colorRoughness', 'parameters'])
    binding.part.fields[field] = [...binding.sourcePart.fields[field]!];
}
