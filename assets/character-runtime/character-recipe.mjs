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
  const eyes =
    selections.eyes ??
    (customized && recipe?.preset === 'lime_frog' ? 'todd' : undefined);
  const accessory =
    selections.accessory ??
    (customized && recipe?.preset === 'blue_beret'
      ? 'felipe_beret'
      : undefined);
  return {
    ...(selections.shape === 'clippo' ? { shape: 'clippo' } : {}),
    ...(eyes === 'todd' || eyes === 'clippo' ? { eyes } : {}),
    ...(accessory === 'felipe_beret' ? { accessory } : {}),
  };
}
