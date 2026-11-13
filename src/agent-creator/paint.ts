import {
  avatarCharacterInColor,
  resolveAvatarCharacter,
  tryResolveAvatarCharacter,
  type AvatarCharacter,
} from '../agent-avatar/character';
import { FREE_COLOR_NAMES } from '../theme/color-presets';

/**
 * The creator's colour is the agent's account colour (`agent.color`), never the character's: a
 * character it hands back carries its parts and no paint, and every character it draws is painted
 * in the account's colour here.
 */

/** A character without its paint: what the creator emits. */
export function withoutPaint(character: AvatarCharacter): AvatarCharacter {
  const parts: AvatarCharacter = { ...character };
  delete parts.color;
  delete parts.bodyColor;
  return parts;
}

/**
 * The character as the creator draws it: in the agent's colour. A colour Bloom cannot resolve
 * leaves the character's own paint (or its preset's); a character with neither wears the first
 * colour the creator offers, so nothing it draws is undrawable.
 */
export function drawnCharacter(
  character: AvatarCharacter,
  color: string | null | undefined,
  colors: readonly string[],
): AvatarCharacter {
  const painted = avatarCharacterInColor(character, color);
  if (tryResolveAvatarCharacter(painted)) return painted;
  return avatarCharacterInColor(character, colors[0] ?? FREE_COLOR_NAMES[0]);
}

/**
 * What a character IS, for comparing two of them: its resolved parts, paint left out (the paint is
 * the account's). Two spellings of one character (a preset, or its parts written out) compare equal.
 */
export function characterPartsKey(character: AvatarCharacter): string {
  const parts: Partial<ReturnType<typeof resolveAvatarCharacter>> = resolveAvatarCharacter(
    drawnCharacter(character, undefined, FREE_COLOR_NAMES),
  );
  delete parts.paint;
  return JSON.stringify(parts);
}
