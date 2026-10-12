import { expressionRig } from '../../src/agent-avatar/expression-rig';
import { CHARACTER_COLORS } from '../../src/agent-avatar/character-colors';
import type { LegacyRecipe } from '../../src/agent-avatar/legacy-recipe';
import type { EditorRenderProps, EditorRecipe } from '../avatar-contract';
import type { CatalogRecipe } from './catalog-compose';
import catalog from './assets/catalog-library/index.json';
import type { AvatarPreset } from './catalog';

import { CHARACTER_PRESET_DEFAULTS as defaults } from '../../src/agent-avatar/character-preset-defaults';

const groups = {
  shape: catalog.donors.body,
  eyes: catalog.donors.eyes,
  eyewear: catalog.donors.eyewear,
  accessory: catalog.donors.accessory,
};
export type CompleteEditorRecipe = Omit<EditorRecipe, 'preset'> & {
  preset: string;
  catalog?: CatalogRecipe;
};

/** One deterministic asset identity for every catalog combination. Paint is
 * instance state so changing a color never compiles or uploads another mesh. */
export function resolveCompleteEditorRecipe(props: EditorRenderProps): CompleteEditorRecipe {
  const legacy = props.legacy as LegacyRecipe | undefined;
  const saved = props.config.character;
  const isLegacy = !saved || saved.preset === 'bloom';
  if (isLegacy && !legacy) throw Error('Missing saved avatar geometry');
  const recipe = isLegacy
    ? {
        preset: 'legacy',
        selections: {
          shape: legacy!.shape ?? 'circle',
          eyes: legacy!.eyes,
          ...legacy!.selections,
        },
        ...legacy!.patch,
        ...(legacy!.eyeSpacing !== undefined ? { eyeSpacing: legacy!.eyeSpacing } : {}),
      }
    : saved!;
  if (recipe.preset !== undefined && !Object.prototype.hasOwnProperty.call(defaults, recipe.preset))
    throw Error(`Unknown avatar preset: ${recipe.preset}`);
  if (
    !recipe.preset &&
    (['shape', 'eyes', 'eyewear', 'accessory'].some(
      (part) => !recipe.selections?.[part as keyof typeof recipe.selections],
    ) ||
      (!recipe.bodyColor && !recipe.selections?.color))
  )
    throw Error('A custom avatar requires complete parts and a body color');
  const base: Partial<(typeof defaults)[string]> = recipe.preset ? defaults[recipe.preset]! : {};
  const selected: Record<string, string> = { ...base, ...recipe.selections };
  if (props.config.face === false) selected.eyes = 'none';
  const eyeSpacing = recipe.eyeSpacing;
  if (
    eyeSpacing !== undefined &&
    (!Number.isFinite(eyeSpacing) || eyeSpacing < 0.5 || eyeSpacing > 1.5)
  )
    throw Error('Invalid avatar eye spacing');
  for (const [name, group] of Object.entries(groups)) {
    const id = selected[name]!;
    if (name === 'eyes' && (id === 'none' || id === 'alien')) continue;
    if (!Object.prototype.hasOwnProperty.call(group, id))
      throw Error(`Unknown avatar ${name}: ${id}`);
  }
  const palette = recipe.selections?.color;
  if (palette && !Object.prototype.hasOwnProperty.call(CHARACTER_COLORS, palette))
    throw Error(`Unknown avatar color: ${palette}`);
  if (recipe.bodyColor && !/^#[0-9a-f]{6}$/i.test(recipe.bodyColor))
    throw Error('Invalid avatar body color');
  const explicitColor =
    recipe.bodyColor ??
    (palette ? CHARACTER_COLORS[palette as keyof typeof CHARACTER_COLORS] : undefined);
  if (explicitColor) {
    delete selected.color;
    delete selected.bodyColor;
    if (palette && !recipe.bodyColor) selected.color = palette;
    else selected.bodyColor = explicitColor;
  }
  // Preserve the exact original named scene until a geometry choice changes it.
  // Explicit shape selections use the native catalog geometry, including Todd's
  // stored alias, rather than silently substituting the named preset's sculpture.
  const custom =
    !recipe.preset ||
    props.previewPart === 'eyes' ||
    selected.eyes === 'none' ||
    selected.eyes === 'alien' ||
    eyeSpacing !== undefined ||
    recipe.preset === 'legacy' ||
    recipe.preset === 'clippo' ||
    !!legacy?.points ||
    Object.keys(recipe.selections ?? {}).some((k) => k !== 'color');
  const composition: CatalogRecipe | undefined = custom
    ? {
        shape: selected.shape === 'todd' ? 'rounded_head_two_ears' : selected.shape!,
        eyes: selected.eyes!,
        eyewear: selected.eyewear!,
        accessory: selected.accessory!,
        ...(props.previewPart === 'eyes' ? { previewPart: 'eyes' as const } : {}),
        ...(eyeSpacing !== undefined ? { eyeSpacing } : {}),
        ...(selected.eyes === 'alien'
          ? {
              alienFace: {
                size: props.config.eyeSize,
                gap: props.config.eyeGap * (eyeSpacing ?? 1),
                tilt: (props.config.eyeTilt * Math.PI) / 180,
                light: props.config.lightEyes,
                rig: expressionRig(props.config),
              },
            }
          : {}),
        ...(legacy?.points && isLegacy ? { points: legacy.points } : {}),
      }
    : undefined;
  const color =
    explicitColor ??
    (custom
      ? (base.bodyColor ??
        CHARACTER_COLORS[(selected.color ?? base.color) as keyof typeof CHARACTER_COLORS])
      : undefined);
  return {
    preset: composition
      ? `catalog:${JSON.stringify(composition)}`
      : (recipe.preset as AvatarPreset),
    ...(composition ? { catalog: composition } : {}),
    color,
    capabilities: {
      key: JSON.stringify(recipe),
      selected,
      available: Object.fromEntries([
        ...Object.entries(groups).flatMap(([name, group]) =>
          Object.keys(group).map((id) => [`${name}:${id}`, true]),
        ),
        ['eyes:none', true],
        ['eyes:alien', true],
        ...Object.keys(CHARACTER_COLORS).map((id) => [`color:${id}`, true]),
      ]),
    },
  };
}
