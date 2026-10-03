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
export const CHARACTER_SHAPES = [
  ...NATIVE_CHARACTER_SHAPES,
  ...MIGRATED_CHARACTER_SHAPES,
] as const;

export function isMigratedCharacterShape(id: string | undefined): boolean {
  return MIGRATED_CHARACTER_SHAPES.some(([shape]) => shape === id);
}

/** The saved paper/blob fields remain readable; canonical shape IDs own new edits. */
export function currentCharacterShape(config: AvatarConfig): string {
  if (config.character?.selections?.shape)
    return config.character.selections.shape;
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
  if (!saved || saved.preset === 'bloom')
    return {
      ...saved,
      preset: 'legacy',
      ...(saved?.bodyColor
        ? { bodyColor: saved.bodyColor }
        : !saved?.selections?.color
          ? { bodyColor: avatarHex(config) }
          : {}),
      selections: {
        shape: currentCharacterShape(config),
        eyes: 'oval',
        eyewear: 'none',
        accessory: 'none',
        ...saved?.selections,
      },
    };
  const defaults: NonNullable<AvatarCharacterConfig['selections']> = {};
  for (const part of ['eyes', 'eyewear', 'accessory'] as const)
    if (selected[part]) defaults[part] = selected[part];
  // These virtual parts are absent from the backing native catalog.
  if (!defaults.eyes && saved.preset === 'clippo') defaults.eyes = 'clippo';
  if (!defaults.eyes && saved.preset === 'lime_frog') defaults.eyes = 'todd';
  if (!defaults.accessory && saved.preset === 'blue_beret')
    defaults.accessory = 'felipe_beret';
  return { ...saved, selections: { ...defaults, ...saved.selections } };
}

/** All 21 bodies change the same character recipe. Named paint and explicit RGB
 * keep their precedence; a body never supplies a replacement color or face.
 */
export function createConfigForShape(
  config: AvatarConfig,
  shape: string,
  selected: Readonly<Record<string, string>> = {},
): AvatarConfig {
  if (!CHARACTER_SHAPES.some(([id]) => id === shape))
    throw new Error('Unknown character shape.');
  const character = materializeCharacter(config, selected);
  if (!character.bodyColor && !character.selections?.color) {
    if (character.preset === 'clippo') character.bodyColor = '#999b9d';
    else if (selected.color)
      character.selections = { ...character.selections, color: selected.color };
    else if (selected.bodyColor) character.bodyColor = selected.bodyColor;
  }
  return characterShapeGeometry({
    ...config,
    character: { ...character, selections: { ...character.selections, shape } },
  });
}
