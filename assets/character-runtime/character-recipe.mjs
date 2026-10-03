/** Resolve editable defaults without passing virtual catalog IDs to the engine. */
export function characterRecipe(props) {
  if (props.legacy)
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
    props.legacy ||
    recipe?.bodyColor ||
    recipe?.eyeSpacing !== undefined ||
    Object.keys(selections).length,
  );
  const eyes =
    selections.eyes ??
    (customized && recipe?.preset === 'lime_frog' ? 'todd' : undefined);
  const accessory =
    selections.accessory ??
    (customized && recipe?.preset === 'blue_beret'
      ? 'felipe_beret'
      : undefined);
  if (!customized) return {};
  const bodyPreset =
    selections.shape === 'todd'
      ? 'lime_frog'
      : !props.legacy &&
          !selections.shape &&
          ORIGINAL_PRESETS.includes(recipe?.preset)
        ? recipe.preset
        : undefined;
  return {
    ...(bodyPreset ? { bodyPreset } : {}),
    ...(bodyPreset && (recipe.bodyColor || selections.color)
      ? { paintBody: true }
      : {}),
    ...(selections.shape === 'clippo' ? { shape: 'clippo' } : {}),
    ...(eyes ? { eyes } : {}),
    ...(selections.eyewear ? { eyewear: selections.eyewear } : {}),
    ...(accessory ? { accessory } : {}),
    ...(recipe?.eyeSpacing !== undefined && recipe.eyeSpacing !== 1
      ? { eyeSpacing: recipe.eyeSpacing }
      : {}),
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
    !props.legacy &&
    !recipe.selections?.shape &&
    ORIGINAL_PRESETS.includes(recipe.preset)
  )
    return recipe.preset;
  // Distinct migrated contours and Clippo use Todd's original signature as the
  // shared standard; they never fall back to the original Wave/maracas.
  if (props.legacy?.points) return 'lime_frog';
  return BODY_SIGNATURES[recipe.selections?.shape] ?? 'lime_frog';
}
/** Prepared authored bodies retain their actual defaults, not the fitting scene's catalog selections. */
export function bodySelectionDefaults(preset, appearance) {
  return {
    shape: preset === 'lime_frog' ? 'todd' : appearance.shape,
    eyes: preset === 'lime_frog' ? 'todd' : appearance.eyes,
    eyewear: appearance.eyewear ?? 'none',
    accessory:
      preset === 'blue_beret'
        ? 'felipe_beret'
        : (appearance.accessories?.[0] ?? 'none'),
  };
}
export const NATIVE_PARTS = Object.freeze({
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
