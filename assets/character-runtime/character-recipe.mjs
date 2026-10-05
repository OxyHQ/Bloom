/** Resolve editable defaults without passing virtual catalog IDs to the engine. */
import { MIGRATED_CONTOURS } from './migrated-contours.mjs';
export function isLegacyRecipe(props) {
  return !props.config.character || props.config.character.preset === 'bloom';
}
export const MIGRATED_SHAPE_IDS = Object.freeze([
  'slender',
  'pocket',
  'petal',
  'star',
  'cloud',
  'shield',
  'pebble',
  'squircle',
]);
export function withCharacterGeometry(props) {
  const shape = props.config.character?.selections?.shape;
  if (!Object.hasOwn(MIGRATED_CONTOURS, shape)) return props;
  return {
    ...props,
    legacy: props.legacy?.points
      ? props.legacy
      : { points: MIGRATED_CONTOURS[shape] },
  };
}
const PRESET_DEFAULTS = Object.freeze({
  blue_beret: {
    shape: 'six_lobed_flower',
    eyes: 'oval',
    eyewear: 'none',
    accessory: 'felipe_beret',
  },
  alfred: {
    shape: 'rounded_triangle',
    eyes: 'sleepy_lids',
    eyewear: 'tall_oval_frames',
    accessory: 'bow',
  },
  purple_heart: {
    shape: 'heart',
    eyes: 'oval',
    eyewear: 'round_sunglasses',
    accessory: 'none',
  },
  lime_frog: {
    shape: 'rounded_head_two_ears',
    eyes: 'todd',
    eyewear: 'none',
    accessory: 'bow',
  },
  coral_monocle: {
    shape: 'twelve_scalloped_rosette',
    eyes: 'double_highlights',
    eyewear: 'monocle',
    accessory: 'none',
  },
  gus: {
    shape: 'rounded_diamond',
    eyes: 'oval',
    eyewear: 'classic_sunglasses',
    accessory: 'orb',
  },
  blue_spectacles: {
    shape: 'rounded_cube',
    eyes: 'crescent_inset',
    eyewear: 'tall_oval_frames',
    accessory: 'three_lobe',
  },
  lime_headphones: {
    shape: 'circle_two_ears',
    eyes: 'swept_lids',
    eyewear: 'none',
    accessory: 'headphones',
  },
});
export function characterRecipe(props) {
  if (props.legacy && isLegacyRecipe(props))
    return {
      preset: 'legacy',
      selections: {
        shape: props.legacy.shape ?? 'circle',
        eyes: props.legacy.eyes ?? 'oval',
        ...props.legacy.selections,
      },
      ...props.legacy.patch,
      ...(props.legacy.eyeSpacing !== undefined
        ? { eyeSpacing: props.legacy.eyeSpacing }
        : {}),
    };
  const recipe = props.config.character;
  if (recipe?.preset !== 'clippo') return recipe;
  return {
    ...recipe,
    selections: { shape: 'clippo', eyes: 'clippo', ...recipe.selections },
    // A palette selection is an explicit replacement of the preset's grey.
    ...(!recipe.bodyColor && !recipe.selections?.color
      ? { bodyColor: '#999b9d' }
      : {}),
  };
}

export function authoredPartsFor(props) {
  const recipe = characterRecipe(props);
  const selections = recipe?.selections ?? {};
  const customized = Boolean(
    props.legacy || recipe?.bodyColor || Object.keys(selections).length,
  );
  const defaults = !isLegacyRecipe(props)
    ? PRESET_DEFAULTS[recipe.preset]
    : undefined;
  const selectedShape = selections.shape ?? defaults?.shape;
  const shape =
    selectedShape === 'todd' ? 'rounded_head_two_ears' : selectedShape;
  const eyes =
    selections.eyes ??
    defaults?.eyes ??
    (customized && recipe?.preset === 'lime_frog' ? 'todd' : undefined);
  const accessory =
    selections.accessory ??
    defaults?.accessory ??
    (customized && recipe?.preset === 'blue_beret'
      ? 'felipe_beret'
      : undefined);
  if (!customized) return {};
  const bodyPreset =
    !shape &&
    !isLegacyRecipe(props) &&
    ORIGINAL_PRESETS.includes(recipe?.preset)
      ? recipe.preset
      : undefined;
  return {
    ...(bodyPreset ? { bodyPreset } : {}),
    ...(bodyPreset &&
    (recipe.bodyColor || selections.color || bodyPreset !== recipe.preset)
      ? { paintBody: true }
      : {}),
    ...(selections.shape === 'clippo' ? { shape: 'clippo' } : {}),
    ...((!isLegacyRecipe(props) || !props.legacy?.points) &&
    (MIGRATED_SHAPE_IDS.includes(shape) || NATIVE_PARTS.shape.includes(shape))
      ? { faceShape: shape }
      : {}),
    ...(eyes ? { eyes } : {}),
    ...((selections.eyewear ?? defaults?.eyewear)
      ? { eyewear: selections.eyewear ?? defaults?.eyewear }
      : {}),
    ...(accessory ? { accessory } : {}),
  };
}
export const ORIGINAL_PRESETS = Object.freeze([
  'blue_beret',
  'alfred',
  'purple_heart',
  'lime_frog',
  'coral_monocle',
  'gus',
  'blue_spectacles',
  'lime_headphones',
]);
// Exact shapes reported by the original engine's eight named appearances.
const BODY_SIGNATURES = Object.freeze({
  six_lobed_flower: 'blue_beret',
  rounded_triangle: 'alfred',
  heart: 'purple_heart',
  rounded_head_two_ears: 'lime_frog',
  twelve_scalloped_rosette: 'coral_monocle',
  rounded_diamond: 'gus',
  rounded_cube: 'blue_spectacles',
  circle_two_ears: 'lime_headphones',
  todd: 'lime_frog',
});
/** The body's authored reaction follows its geometry, independently of its pieces. */
export function bodySignatureFor(props) {
  const recipe = characterRecipe(props),
    parts = authoredPartsFor(props);
  if (parts.bodyPreset) return parts.bodyPreset;
  if (
    !isLegacyRecipe(props) &&
    !recipe.selections?.shape &&
    ORIGINAL_PRESETS.includes(recipe.preset)
  )
    return recipe.preset;
  // Distinct migrated contours and Clippo use Todd's original signature as the
  // shared standard; they never fall back to the original Wave/maracas.
  if (props.legacy?.points) return 'lime_frog';
  return (
    BODY_SIGNATURES[
      recipe.selections?.shape ?? PRESET_DEFAULTS[recipe.preset]?.shape
    ] ?? 'lime_frog'
  );
}
/** Prepared authored bodies retain their actual defaults, not the fitting scene's catalog selections. */
export function bodySelectionDefaults(preset, appearance) {
  return {
    shape: appearance.shape,
    eyes: preset === 'lime_frog' ? 'todd' : appearance.eyes,
    eyewear: appearance.eyewear ?? 'none',
    accessory:
      preset === 'blue_beret'
        ? 'felipe_beret'
        : (appearance.accessories?.[0] ?? 'none'),
  };
}
export const NATIVE_PARTS = Object.freeze({
  shape: Object.freeze([
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
  ]),
  eyes: Object.freeze([
    'swept_lids',
    'oval',
    'sparkle_capsules',
    'highlight_capsules',
    'dots',
    'double_highlights',
    'round_inset',
    'crescent_inset',
    'sleepy_lids',
  ]),
  eyewear: Object.freeze([
    'none',
    'monocle',
    'tall_oval_frames',
    'separate_trapezoid_lenses',
    'classic_sunglasses',
    'round_sunglasses',
  ]),
  accessory: Object.freeze([
    'none',
    'headphones',
    'bow',
    'beanie',
    'hat',
    'beret',
    'orb',
    'three_lobe',
    'crown',
  ]),
});
