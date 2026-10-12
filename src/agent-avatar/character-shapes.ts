import { CHARACTER_PRESET_DEFAULTS } from './character-preset-defaults';
import { avatarHex } from './avatar-color';
import type { AvatarCharacterConfig } from './config-character';
import type { AvatarConfig } from './model';

export const NATIVE_CHARACTER_SHAPES = [
  ['clippo', 'Clippo'],
  ['todd', 'Todd'],
  ['circle', 'Circle'],
  ['rounded_triangle', 'Rounded triangle'],
  ['capsule', 'Capsule'],
  ['rounded_head_two_ears', 'Rounded head with two ears'],
  ['six_lobed_flower', 'Six lobed flower'],
  ['heart', 'Heart'],
  ['four_lobed_butterfly', 'Four lobed butterfly'],
  ['circle_two_ears', 'Circle with two ears'],
  ['twelve_scalloped_rosette', 'Twelve scalloped rosette'],
  ['rounded_cube', 'Hexagon'],
  ['rounded_diamond', 'Rounded diamond'],
] as const;
export const MIGRATED_CHARACTER_SHAPES = [
  ['slender', 'Slender'],
  ['pocket', 'Pocket'],
  ['petal', 'Petal'],
  ['star', 'Star'],
  ['cloud', 'Cloud'],
  ['shield', 'Shield'],
  ['pebble', 'Pebble'],
  ['squircle', 'Squircle'],
] as const;
export const CHARACTER_SHAPES = [...NATIVE_CHARACTER_SHAPES, ...MIGRATED_CHARACTER_SHAPES] as const;

export function isMigratedCharacterShape(id: string | undefined): boolean {
  return MIGRATED_CHARACTER_SHAPES.some(([shape]) => shape === id);
}

/** The saved paper/blob fields remain readable; canonical shape IDs own new edits. */
export function currentCharacterShape(config: AvatarConfig): string {
  if (config.character?.selections?.shape) return config.character.selections.shape;
  const shape = config.family === 'fold' ? config.foldShape : config.shape;
  const equivalent: Partial<Record<string, string>> = {
    triangle: 'rounded_triangle',
    flower: 'six_lobed_flower',
    diamond: 'rounded_diamond',
  };
  return equivalent[shape] ?? shape;
}

/** Geometry-only view of one of the eight migrated contours. */
export function characterShapeGeometry(config: AvatarConfig): AvatarConfig {
  const shape = config.character?.selections?.shape;
  if (!isMigratedCharacterShape(shape)) return config;
  return shape === 'pebble' || shape === 'squircle'
    ? { ...config, family: 'blob', shape }
    : {
        ...config,
        family: 'fold',
        foldShape: shape as AvatarConfig['foldShape'],
      };
}

/** Retain effective authored parts while preparing the next body. An old recipe
 * is promoted once, with its actual paint and contour rather than Felipe defaults.
 */
export function materializeCharacter(
  config: AvatarConfig,
  selected: Readonly<Record<string, string>> = {},
): AvatarCharacterConfig {
  const saved = config.character;
  const { preset: _preset, ...rest } = saved ?? {};
  const legacy = !saved || saved.preset === 'bloom' || saved.preset === 'legacy';
  const base = !legacy && saved.preset ? CHARACTER_PRESET_DEFAULTS[saved.preset] : undefined;
  const selections: NonNullable<AvatarCharacterConfig['selections']> = {
    shape: base?.shape ?? currentCharacterShape(config),
    eyes:
      config.face === false
        ? 'none'
        : (base?.eyes ?? (config.family === 'alien' ? 'alien' : 'oval')),
    eyewear: base?.eyewear ?? 'none',
    accessory: base?.accessory ?? 'none',
  };
  for (const part of ['shape', 'eyes', 'eyewear', 'accessory'] as const)
    if (selected[part] && !(legacy && part === 'shape')) selections[part] = selected[part];
  Object.assign(selections, saved?.selections);
  const bodyColor =
    saved?.bodyColor ??
    (!saved?.selections?.color
      ? ((saved?.preset === 'clippo' ? base?.bodyColor : undefined) ??
        selected.bodyColor ??
        (!selected.color ? base?.bodyColor : undefined))
      : undefined);
  const namedColor =
    saved?.selections?.color ?? (!bodyColor ? (selected.color ?? base?.color) : undefined);
  if (namedColor) selections.color = namedColor;
  return {
    ...rest,
    ...(bodyColor ? { bodyColor } : !namedColor ? { bodyColor: avatarHex(config) } : {}),
    selections,
  };
}

/** All 21 bodies change the same character recipe. Named paint and explicit RGB
 * keep their precedence; a body never supplies a replacement color or face.
 */
export function createConfigForShape(
  config: AvatarConfig,
  shape: string,
  selected: Readonly<Record<string, string>> = {},
): AvatarConfig {
  if (!CHARACTER_SHAPES.some(([id]) => id === shape)) throw new Error('Unknown character shape.');
  const character = materializeCharacter(config, selected);
  return characterShapeGeometry({
    ...config,
    character: { ...character, selections: { ...character.selections, shape } },
  });
}
