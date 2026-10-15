import type { AvatarCharacter } from '../agent-avatar/character';
import type { AvatarAccount, AvatarProps } from './types';

/** The text that names an account: its display name, else its handle. */
export function accountName(account: AvatarAccount | undefined): string | undefined {
  const name = account?.name;
  const text =
    typeof name === 'string'
      ? name
      : (name?.full ?? [name?.first, name?.last].filter(Boolean).join(' '));
  return text?.trim() || account?.username?.trim() || undefined;
}

/**
 * The one answer to "which character does this avatar carry": an explicit `character` wins
 * (`null` opts out), else the character of a bot account. Returns the stored object itself, so a
 * caller can memoize on it; resolve it with `tryResolveAvatarCharacter`.
 */
export function pickAccountCharacter({
  character,
  account,
}: Pick<AvatarProps, 'character' | 'account'>): AvatarCharacter | null | undefined {
  if (character !== undefined) return character;
  return account?.kind === 'bot' ? account.character : undefined;
}
