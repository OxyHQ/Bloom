import { avatarCharacterInColor, type AvatarCharacter } from '../agent-avatar/character';
import type { AvatarAccount, AvatarProps } from './types';

/** The text that names an account: its display name, else its handle. */
export function accountName(account: AvatarAccount | undefined): string | undefined {
  const name = account?.name;
  const text =
    typeof name === 'string'
      ? name
      : name?.displayName?.trim() ||
        name?.full?.trim() ||
        [name?.first, name?.last].filter(Boolean).join(' ');
  return text?.trim() || account?.username?.trim() || undefined;
}

/**
 * The one answer to "which character does this avatar carry": an explicit `character` wins
 * (`null` opts out), else the character of a bot account painted in the account's own `color`
 * (`avatarCharacterInColor`). Resolve it with `tryResolveAvatarCharacter`. A painted character is
 * a new object each call, so a caller memoizes on `character`, `account.character` and
 * `account.color` rather than on the result.
 */
export function pickAccountCharacter({
  character,
  account,
}: Pick<AvatarProps, 'character' | 'account'>): unknown {
  if (character !== undefined) return character;
  if (account?.kind !== 'bot') return undefined;
  const stored = account.character;
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return stored;
  return avatarCharacterInColor(stored as AvatarCharacter, account.color);
}
