import catalog from '../../../runtime/avatar/assets/catalog-library/index.json';
import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_EYEWEAR,
  AVATAR_PRESETS,
  AVATAR_SHAPES,
} from '../catalog-ids';
import { CHARACTER_COLORS } from '../character-colors';
import { CHARACTER_PRESET_DEFAULTS } from '../character-preset-defaults';
import { CHARACTER_SHAPES } from '../character-shapes';
import { SVG_EYES, SVG_SHAPES } from '../svg-catalog';

/**
 * Every id belongs to the 3D catalog or the explicit SVG registry. The registries are
 * disjoint: accepting a vector-only part must not pretend the 3D runtime has its asset.
 */
const sorted = (ids: readonly string[]) => [...ids].sort();

it.each([
  ['shapes', AVATAR_SHAPES, [...Object.keys(catalog.donors.body), ...SVG_SHAPES]],
  ['eyes', AVATAR_EYES, [...Object.keys(catalog.donors.eyes), ...SVG_EYES]],
  ['eyewear', AVATAR_EYEWEAR, Object.keys(catalog.donors.eyewear)],
  ['accessories', AVATAR_ACCESSORIES, Object.keys(catalog.donors.accessory)],
])('lists exactly the catalog %s', (_name, ids, donors) => {
  expect(sorted(ids)).toEqual(sorted(donors));
});

it('keeps vector-only parts out of the 3D asset registry', () => {
  for (const shape of SVG_SHAPES) expect(catalog.donors.body).not.toHaveProperty(shape);
  for (const eyes of SVG_EYES) expect(catalog.donors.eyes).not.toHaveProperty(eyes);
  expect(new Set(AVATAR_SHAPES).size).toBe(AVATAR_SHAPES.length);
  expect(new Set(AVATAR_EYES).size).toBe(AVATAR_EYES.length);
});

it('lists the named paints and the presets that have defaults', () => {
  expect(sorted(AVATAR_COLORS)).toEqual(sorted(Object.keys(CHARACTER_COLORS)));
  expect(sorted(AVATAR_PRESETS)).toEqual(
    sorted(Object.keys(CHARACTER_PRESET_DEFAULTS).filter((id) => id !== 'legacy')),
  );
});

it('gives every body the name the editors show, in the same order', () => {
  expect(CHARACTER_SHAPES.map(([id]) => id)).toEqual([...AVATAR_SHAPES]);
});

it('makes every preset a complete, resolvable character of listed ids', () => {
  for (const [id, preset] of Object.entries(CHARACTER_PRESET_DEFAULTS)) {
    expect(AVATAR_SHAPES).toContain(preset.shape);
    expect([...AVATAR_EYES, 'none']).toContain(preset.eyes);
    expect(AVATAR_EYEWEAR).toContain(preset.eyewear);
    expect(AVATAR_ACCESSORIES).toContain(preset.accessory);
    expect(preset.color !== undefined || preset.bodyColor !== undefined).toBe(true);
    if (id !== 'legacy') expect(AVATAR_PRESETS).toContain(id);
  }
});
