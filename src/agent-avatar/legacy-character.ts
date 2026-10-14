import { AVATAR_SHAPES } from './catalog-ids';
import { CHARACTER_COLORS } from './character-colors';
import { type AvatarCharacter, parseAvatarCharacter } from './character';

/** The fields of an avatar saved before 10 that the migration reads. The rest are ignored. */
type SavedAvatar = {
  family?: string;
  foldShape?: string;
  shape?: string;
  face?: boolean;
  hue?: number;
  saturation?: number;
  lightness?: number;
  character?: {
    preset?: string;
    selections?: Partial<Record<'shape' | 'eyes' | 'eyewear' | 'accessory' | 'color', string>>;
    bodyColor?: string;
    eyeSpacing?: number;
  };
};

/** The paper and blob silhouettes whose catalog body has another name. */
const EQUIVALENT_SHAPE: Record<string, string> = {
  triangle: 'rounded_triangle',
  flower: 'six_lobed_flower',
  diamond: 'rounded_diamond',
};

/** HSL as `#rrggbb`, with the old default lightness. */
function hexOf(hue: number, saturation: number, lightness = 76): string {
  const light = lightness / 100;
  const a = (saturation / 100) * Math.min(light, 1 - light);
  const channel = (n: number) => {
    const k = (n + hue / 30) % 12;
    return Math.round(255 * (light - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))))
      .toString(16)
      .padStart(2, '0');
  };
  return `#${channel(0)}${channel(8)}${channel(4)}`;
}

/**
 * A character from an avatar saved in the old `AvatarConfig` shape (the 36-field config with
 * `family`, `foldShape`, `hue`… and an optional nested `character`). It is a migration for
 * stored data, not a second way to describe an avatar: run it once when reading a saved
 * value, keep the flat character.
 *
 * Best effort for what the old procedural families drew: the body becomes the catalog shape
 * of the same name, `face: false` hides the face, and hue/saturation/lightness become the
 * exact `bodyColor`. Alien eyes and the sixteen expressions have no catalog counterpart and
 * become `oval`.
 */
export function characterFromLegacy(saved: unknown): AvatarCharacter {
  if (!saved || typeof saved !== 'object' || Array.isArray(saved))
    throw new Error('Invalid saved avatar.');
  const old = saved as SavedAvatar;
  const nested = old.character;
  const sel = nested?.selections;

  // A catalog character written with `selections`: flatten it. `legacy` was the internal
  // template of a procedural avatar, never a preset anyone could name.
  if (nested && nested.preset !== 'bloom') {
    const preset = nested.preset === 'legacy' ? undefined : nested.preset;
    return parseAvatarCharacter({
      ...(preset === undefined ? {} : { preset }),
      ...sel,
      ...(nested.bodyColor === undefined ? {} : { bodyColor: nested.bodyColor }),
      ...(nested.eyeSpacing === undefined ? {} : { eyeSpacing: nested.eyeSpacing }),
    });
  }

  // A procedural avatar, possibly with a `bloom` customization on top.
  const body = old.family === 'fold' ? old.foldShape : old.shape;
  const shape = EQUIVALENT_SHAPE[body ?? ''] ?? body;
  const named = sel?.color as keyof typeof CHARACTER_COLORS | undefined;
  const eyes = old.face === false ? 'none' : (sel?.eyes ?? 'oval');
  return parseAvatarCharacter({
    shape: (AVATAR_SHAPES as readonly string[]).includes(shape ?? '') ? shape : 'circle',
    eyes: eyes === 'alien' ? 'oval' : eyes,
    eyewear: sel?.eyewear ?? 'none',
    accessory: sel?.accessory ?? 'none',
    bodyColor:
      nested?.bodyColor ??
      (named ? CHARACTER_COLORS[named] : hexOf(old.hue ?? 24, old.saturation ?? 94, old.lightness)),
    ...(nested?.eyeSpacing === undefined ? {} : { eyeSpacing: nested.eyeSpacing }),
  });
}
