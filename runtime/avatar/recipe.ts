import { CHARACTER_COLORS } from '../../src/agent-avatar/character-colors';
import { CHARACTER_PRESET_DEFAULTS } from '../../src/agent-avatar/character-preset-defaults';
import type { EditorRenderProps, EditorRecipe } from '../avatar-contract';
import type { CatalogRecipe } from './catalog-compose';
import catalog from './assets/catalog-library/index.json';
import type { AvatarPreset } from './catalog';

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
 * instance state so changing a color never compiles or uploads another mesh.
 * Which animation plays is the character's `authored`, decided where it is resolved. */
export function resolveCompleteEditorRecipe(props: EditorRenderProps): CompleteEditorRecipe {
  const { character } = props;
  const parts = {
    shape: character.shape,
    eyes: character.eyes,
    eyewear: character.eyewear,
    accessory: character.accessory,
  };
  for (const [name, group] of Object.entries(groups)) {
    const id = parts[name as keyof typeof parts];
    if (name === 'eyes' && id === 'none') continue;
    if (!Object.prototype.hasOwnProperty.call(group, id))
      throw Error(`Unknown avatar ${name}: ${id}`);
  }
  const custom = !character.authored || props.previewPart === 'eyes';
  const composition: CatalogRecipe | undefined = custom
    ? {
        shape: parts.shape === 'todd' ? 'rounded_head_two_ears' : parts.shape,
        eyes: parts.eyes,
        eyewear: parts.eyewear,
        accessory: parts.accessory,
        ...(props.previewPart === 'eyes' ? { previewPart: 'eyes' as const } : {}),
        ...(character.eyeSpacing !== undefined ? { eyeSpacing: character.eyeSpacing } : {}),
      }
    : undefined;
  const paint = character.paint;
  const hex = 'bodyColor' in paint ? paint.bodyColor : CHARACTER_COLORS[paint.color];
  // A preset's own paint is already in its authored asset; naming it again would repaint it.
  const base = character.preset ? CHARACTER_PRESET_DEFAULTS[character.preset] : undefined;
  const ownPaint =
    base !== undefined &&
    ('bodyColor' in paint ? base.bodyColor === paint.bodyColor : base.color === paint.color);
  const color = custom || !ownPaint ? hex : undefined;
  return {
    preset: composition
      ? `catalog:${JSON.stringify(composition)}`
      : (character.preset as AvatarPreset),
    ...(composition ? { catalog: composition } : {}),
    color,
    capabilities: {
      key: JSON.stringify(character),
      selected: {
        ...parts,
        ...('bodyColor' in paint ? { bodyColor: paint.bodyColor } : { color: paint.color }),
      },
      available: Object.fromEntries([
        ...Object.entries(groups).flatMap(([name, group]) =>
          Object.keys(group).map((id) => [`${name}:${id}`, true]),
        ),
        ['eyes:none', true],
        ...Object.keys(CHARACTER_COLORS).map((id) => [`color:${id}`, true]),
      ]),
    },
  };
}
