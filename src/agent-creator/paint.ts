import {
  avatarCharacterInColor,
  resolveAvatarCharacter,
  tryResolveAvatarCharacter,
  type AvatarCharacter,
} from '../agent-avatar/character';
import { CHARACTER_COLORS } from '../agent-avatar/character-colors';

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

/** What a character with no paint and no resolvable colour wears: the first named swatch. */
const FALLBACK_COLOR = CHARACTER_COLORS.pink;

/**
 * The character as the creator draws it: in the agent's colour (a preset key or a `#rrggbb`). A
 * colour Bloom cannot resolve leaves the character's own paint (or its preset's); a character with
 * neither wears the first named swatch, so nothing it draws is undrawable.
 */
export function drawnCharacter(
  character: AvatarCharacter,
  color: string | null | undefined,
): AvatarCharacter {
  const painted = avatarCharacterInColor(character, color);
  if (tryResolveAvatarCharacter(painted)) return painted;
  return avatarCharacterInColor(character, FALLBACK_COLOR);
}

/**
 * The body paint an account colour draws, `#rrggbb`, or `undefined` for a colour that does not
 * resolve. Read through `avatarCharacterInColor`, the one mapping from a colour to a paint.
 */
export function accountBodyHex(color: string | null | undefined): string | undefined {
  return avatarCharacterInColor({}, color).bodyColor;
}

/**
 * What a character IS, for comparing two of them: its resolved parts, paint left out (the paint is
 * the account's). Two spellings of one character (a preset, or its parts written out) compare equal.
 */
export function characterPartsKey(character: AvatarCharacter): string {
  const parts: Partial<ReturnType<typeof resolveAvatarCharacter>> = resolveAvatarCharacter(
    drawnCharacter(character, undefined),
  );
  delete parts.paint;
  return JSON.stringify(parts);
}
