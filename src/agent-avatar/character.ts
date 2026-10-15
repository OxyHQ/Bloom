import {
  AVATAR_ACCESSORIES,
  AVATAR_COLORS,
  AVATAR_EYES,
  AVATAR_EYEWEAR,
  AVATAR_PRESETS,
  AVATAR_SHAPES,
  type AvatarAccessoryId,
  type AvatarColorId,
  type AvatarEyesId,
  type AvatarEyewearId,
  type AvatarPresetId,
  type AvatarShapeId,
} from './catalog-ids';
import { CHARACTER_COLORS } from './character-colors';
import { CHARACTER_PRESET_DEFAULTS } from './character-preset-defaults';

/**
 * A character: what an avatar IS, in one flat shape. Every field is optional because a
 * `preset` supplies the rest, and every field means the same everywhere (`AgentAvatar`,
 * `AgentCreator`, `MultiAgentChat`, the saved JSON).
 *
 * ```ts
 * <AgentAvatar character={{ preset: 'blue_beret' }} />
 * <AgentAvatar character={{ preset: 'blue_beret', accessory: 'none', color: 'orchid' }} />
 * <AgentAvatar character={{ shape: 'heart', eyes: 'oval', eyewear: 'none', accessory: 'bow', bodyColor: '#ffd838' }} />
 * ```
 *
 * Without a `preset`, all four parts and a paint are required.
 */
export type AvatarCharacter = {
  /** A named template. Any part or paint left out comes from it. */
  preset?: AvatarPresetId;
  shape?: AvatarShapeId;
  eyes?: AvatarEyesId;
  eyewear?: AvatarEyewearId;
  accessory?: AvatarAccessoryId;
  /** Named paint. */
  color?: AvatarColorId;
  /** Exact paint as `#rrggbb`. It wins over `color`. */
  bodyColor?: string;
  /** Multiplier (0.5 to 1.5) on the shape's eye separation. The eyes keep their size. */
  eyeSpacing?: number;
};

/** A character with nothing left to infer. Paint is exactly one of the two spellings. */
export type ResolvedAvatarCharacter = {
  preset?: AvatarPresetId;
  shape: AvatarShapeId;
  eyes: AvatarEyesId;
  eyewear: AvatarEyewearId;
  accessory: AvatarAccessoryId;
  paint: { color: AvatarColorId } | { bodyColor: string };
  eyeSpacing?: number;
  /**
   * Whether the preset's own authored animation plays. It does while the character is
   * exactly the preset (paint aside): change a part, the eye spacing, or hide the face and the
   * animation is retargeted onto the new parts instead. This is the only thing that picks
   * between the two, and it is decided here, from data, rather than by how the character
   * happened to be written.
   */
  authored: boolean;
};

const PARTS = ['shape', 'eyes', 'eyewear', 'accessory'] as const;
const KEYS: ReadonlySet<string> = new Set(['preset', ...PARTS, 'color', 'bodyColor', 'eyeSpacing']);
/** Their authored clips are not the preset's own: the legacy body and Clippo's wire. */
const NEVER_AUTHORED: ReadonlySet<string> = new Set(['clippo']);

const oneOf = <T extends string>(list: readonly T[], value: unknown, what: string): T => {
  if (typeof value !== 'string' || !list.includes(value as T))
    throw new Error(`Unknown avatar ${what}: ${String(value)}`);
  return value as T;
};

/** Fill in every part and the paint, validating each id. Throws on anything the renderer cannot draw. */
export function resolveAvatarCharacter(character: AvatarCharacter): ResolvedAvatarCharacter {
  const preset =
    character.preset === undefined ? undefined : oneOf(AVATAR_PRESETS, character.preset, 'preset');
  const base = preset === undefined ? undefined : CHARACTER_PRESET_DEFAULTS[preset];
  const part = <T extends string>(name: (typeof PARTS)[number], list: readonly T[]): T => {
    const value = character[name] ?? base?.[name];
    if (value === undefined) throw new Error(`A character without a preset needs its ${name}.`);
    return oneOf(list, value, name);
  };
  const shape = part('shape', AVATAR_SHAPES);
  const eyes = part('eyes', [...AVATAR_EYES, 'none'] as const);
  const eyewear = part('eyewear', AVATAR_EYEWEAR);
  const accessory = part('accessory', AVATAR_ACCESSORIES);

  const hex = (value: unknown) => {
    if (typeof value !== 'string' || !/^#[0-9a-f]{6}$/i.test(value))
      throw new Error('Invalid avatar body color.');
    return value.toLowerCase();
  };
  let paint: ResolvedAvatarCharacter['paint'];
  if (character.bodyColor !== undefined) paint = { bodyColor: hex(character.bodyColor) };
  else if (character.color !== undefined)
    paint = { color: oneOf(AVATAR_COLORS, character.color, 'color') };
  else if (base?.bodyColor !== undefined) paint = { bodyColor: hex(base.bodyColor) };
  else if (base?.color !== undefined) paint = { color: oneOf(AVATAR_COLORS, base.color, 'color') };
  else throw new Error('A character without a preset needs a color or a bodyColor.');

  const { eyeSpacing } = character;
  if (
    eyeSpacing !== undefined &&
    (typeof eyeSpacing !== 'number' ||
      !Number.isFinite(eyeSpacing) ||
      eyeSpacing < 0.5 ||
      eyeSpacing > 1.5)
  )
    throw new Error('Invalid avatar eye spacing.');

  const authored =
    preset !== undefined &&
    !NEVER_AUTHORED.has(preset) &&
    eyeSpacing === undefined &&
    eyes !== 'none' &&
    PARTS.every((name) => ({ shape, eyes, eyewear, accessory })[name] === base![name]);
  return {
    ...(preset === undefined ? {} : { preset }),
    shape,
    eyes,
    eyewear,
    accessory,
    paint,
    ...(eyeSpacing === undefined ? {} : { eyeSpacing }),
    authored,
  };
}

/**
 * `resolveAvatarCharacter` for a value that arrives from outside (an account payload): `undefined`
 * instead of a throw, so one bad stored character costs its own row the character and not the
 * screen that lists it.
 */
export function tryResolveAvatarCharacter(
  character: AvatarCharacter | null | undefined,
): ResolvedAvatarCharacter | undefined {
  if (!character) return undefined;
  try {
    return resolveAvatarCharacter(character);
  } catch {
    return undefined;
  }
}

/**
 * The JSON boundary: what was saved, checked before it reaches the renderer. Flat characters
 * only; anything saved in the old `AvatarConfig` shape goes through `characterFromLegacy`.
 */
export function parseAvatarCharacter(value: unknown): AvatarCharacter {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Invalid avatar character.');
  const unknown = Object.keys(value).find((key) => !KEYS.has(key));
  if (unknown !== undefined) throw new Error(`Unsupported avatar character field: ${unknown}.`);
  const candidate = value as AvatarCharacter;
  resolveAvatarCharacter(candidate);
  const { bodyColor, ...rest } = candidate;
  return { ...rest, ...(bodyColor === undefined ? {} : { bodyColor: bodyColor.toLowerCase() }) };
}

/** The character a resolved one writes down: complete, so it survives a change of preset. */
export function avatarCharacterOf(resolved: ResolvedAvatarCharacter): AvatarCharacter {
  const { shape, eyes, eyewear, accessory, preset, eyeSpacing, paint } = resolved;
  return {
    ...(preset === undefined ? {} : { preset }),
    shape,
    eyes,
    eyewear,
    accessory,
    ...paint,
    ...(eyeSpacing === undefined ? {} : { eyeSpacing }),
  };
}

/**
 * The character after an edit. The edited character is written out in full, so choosing a body
 * or a part keeps the face and the rest the preset supplied (presets are defaults; an edit
 * owns the parts). Paint is one spelling at a time: a `color` replaces a `bodyColor` and the
 * other way round.
 */
export function updateAvatarCharacter(
  character: AvatarCharacter,
  patch: Partial<Omit<AvatarCharacter, 'preset'>>,
): AvatarCharacter {
  const { color, bodyColor, ...parts } = patch;
  const next: AvatarCharacter = {
    ...avatarCharacterOf(resolveAvatarCharacter(character)),
    ...parts,
  };
  if (color !== undefined || bodyColor !== undefined) {
    delete next.color;
    delete next.bodyColor;
    if (bodyColor !== undefined) next.bodyColor = bodyColor;
    else next.color = color;
  }
  return next;
}

/** The body paint as `#rrggbb`, whichever way it was named. */
export function avatarBodyHex(resolved: ResolvedAvatarCharacter): string {
  return 'bodyColor' in resolved.paint
    ? resolved.paint.bodyColor
    : CHARACTER_COLORS[resolved.paint.color];
}
