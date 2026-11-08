import { CHARACTER_COLORS } from './character-colors';
import { SVG_EYES, SVG_SHAPES } from './svg-catalog';

/**
 * The ids a character is made of: one list per part, in the order the editors show them.
 * `catalog-ids.test.ts` pins the lists to the 3D asset catalog and the explicit vector registry,
 * so vector-only parts never masquerade as assets the 3D runtime can load.
 */
export const AVATAR_SHAPES = [
  'clippo',
  'todd',
  'circle',
  'rounded_triangle',
  'capsule',
  'rounded_head_two_ears',
  'six_lobed_flower',
  'heart',
  'four_lobed_butterfly',
  'circle_two_ears',
  'twelve_scalloped_rosette',
  'rounded_cube',
  'rounded_diamond',
  'slender',
  'pocket',
  'petal',
  'star',
  'cloud',
  'shield',
  'pebble',
  'squircle',
  ...SVG_SHAPES,
] as const;

export const AVATAR_EYES = [
  'swept_lids',
  'oval',
  'sparkle_capsules',
  'highlight_capsules',
  'dots',
  'double_highlights',
  'round_inset',
  'crescent_inset',
  'sleepy_lids',
  'todd',
  'clippo',
  'cyclops',
  ...SVG_EYES,
] as const;

export const AVATAR_EYEWEAR = [
  'none',
  'monocle',
  'tall_oval_frames',
  'separate_trapezoid_lenses',
  'classic_sunglasses',
  'round_sunglasses',
] as const;

export const AVATAR_ACCESSORIES = [
  'none',
  'headphones',
  'bow',
  'beanie',
  'hat',
  'beret',
  'orb',
  'three_lobe',
  'crown',
  'felipe_beret',
] as const;

/** Named paint. A character can also take any `#rrggbb` as `bodyColor`. */
export const AVATAR_COLORS = Object.keys(CHARACTER_COLORS) as AvatarColorId[];

/** Named templates: a complete character each, and the animation it was authored with. */
export const AVATAR_PRESETS = [
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
  'clippo',
] as const;

export type AvatarShapeId = (typeof AVATAR_SHAPES)[number];
/** `'none'` hides the face. */
export type AvatarEyesId = (typeof AVATAR_EYES)[number] | 'none';
export type AvatarEyewearId = (typeof AVATAR_EYEWEAR)[number];
export type AvatarAccessoryId = (typeof AVATAR_ACCESSORIES)[number];
export type AvatarColorId = keyof typeof CHARACTER_COLORS;
export type AvatarPresetId = (typeof AVATAR_PRESETS)[number];
